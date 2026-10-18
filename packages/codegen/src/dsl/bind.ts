import {
	fieldNames,
	isParserHiddenName,
	isRecord,
	listedNames,
	OPAQUE_RULES,
	supertypesOf,
	transparentReach,
	unwrapPrec,
	type GrammarRecord
} from './rule-patterns.ts';
import {
	renameKeys,
	renameRecords,
	renameValue,
	rewriteOwnedSegments,
	type BindingEffect,
	type Lead,
	type LeadMatch
} from './verbs/effects.ts';

export interface Split {
	readonly kind: string;
	readonly within: readonly string[];
	readonly as: string;
	readonly containers: readonly { readonly name: string; readonly field: string }[];
}

export interface FieldRename {
	readonly owner: string;
	readonly from: string;
	readonly to: string;
}

export type FieldWrapTarget = { readonly symbol: string } | { readonly token: string };
export interface FieldWrap {
	readonly owner: string;
	readonly field: string;
	readonly target: FieldWrapTarget;
}

export function lead(list: string, item: string, field: string, ...admits: LeadMatch[]): Lead {
	return { list, item, field, admits };
}

export function split(kind: string, as: string, placement: Pick<Split, 'within' | 'containers'>): Split {
	return { kind, as, within: placement.within, containers: placement.containers };
}

const LIST_FIELDS = ['supertypes', 'inline', 'factoryInline', 'textTokens'];
const RULE_FIELDS = ['extras', 'externals', 'precedences', 'reserved', 'conflicts'];

export function mappedName(record: Readonly<Record<string, string>> | undefined, name: string): string {
	return record !== undefined && Object.hasOwn(record, name) ? record[name]! : name;
}

function carryHiddenFacts(from: GrammarRecord, to: GrammarRecord, rename: (name: string) => string): void {
	for (const key of Reflect.ownKeys(from)) {
		const descriptor = Object.getOwnPropertyDescriptor(from, key);
		if (descriptor === undefined || descriptor.enumerable) continue;
		const value: unknown = descriptor.value;
		const renamed =
			value instanceof Set
				? new Set([...value].map((name) => (typeof name === 'string' ? rename(name) : name)))
				: Array.isArray(value)
					? renameValue(value, rename)
					: value;
		Object.defineProperty(to, key, { ...descriptor, value: renamed });
	}
}

export function renameGrammar(grammar: GrammarRecord, renames: Readonly<Record<string, string>>): GrammarRecord {
	const rename = (name: string): string => mappedName(renames, name);
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	const externals = listedNames(grammar.externals);
	for (const [from, to] of Object.entries(renames)) {
		if (!(from in rules) && !externals.has(from)) throw new Error(`bind: '${from}' is no rule or external of the grammar`);
		if (isParserHiddenName(from) !== isParserHiddenName(to)) throw new Error(`bind: '${from}' → '${to}' flips hiddenness`);
		if (to in rules && !(to in renames)) throw new Error(`bind: '${from}' → '${to}', which the grammar already names`);
	}
	const out = renameRecords(grammar, rename, fieldNames(grammar.rules));
	if ('rules' in grammar) out.rules = renameKeys(grammar.rules, rename);
	for (const field of [...LIST_FIELDS, ...RULE_FIELDS]) if (field in grammar) out[field] = renameValue(grammar[field], rename);
	if (typeof grammar.word === 'string') out.word = rename(grammar.word);
	for (const [field, value] of Object.entries(grammar))
		if (value instanceof Set) out[field] = new Set([...value].map((name) => (typeof name === 'string' ? rename(name) : name)));
	carryHiddenFacts(grammar, out, rename);
	const renamedFrom: Record<string, string> = {};
	for (const [from, to] of Object.entries(renames)) renamedFrom[to] = from;
	out.renamedFrom = { ...(isRecord(grammar.renamedFrom) ? grammar.renamedFrom : {}), ...renamedFrom };
	return out;
}

function fieldHosts(rules: GrammarRecord, owner: string, field: string, stop: ReadonlySet<string>): string[] {
	return [...transparentReach(rules, owner, stop)].filter((name) => fieldNames(rules[name]).has(field));
}

export function fieldRenameIssue(grammar: GrammarRecord, rename: FieldRename, batch: readonly FieldRename[] = [rename]): string | undefined {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	if (!(rename.owner in rules)) return 'owner is not a rule';
	const stop = supertypesOf(grammar);
	const hosts = fieldHosts(rules, rename.owner, rename.from, stop);
	if (hosts.length === 0) return 'field is not on the owner';
	if (hosts.some((host) => host !== rename.owner && !sharersAgree(rules, host, stop, rename, batch))) return 'field sits in a hidden rule another kind shares';
	if (fieldHosts(rules, rename.owner, rename.to, stop).length > 0) return 'member name is already a field of the owner';
	return undefined;
}

function renameFields(rule: unknown, from: string, to: string): unknown {
	if (Array.isArray(rule)) return rule.map((r) => renameFields(r, from, to));
	if (!isRecord(rule)) return rule;
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = renameFields(value, from, to);
	if (rule.type === 'FIELD' && rule.name === from) out.name = to;
	return out;
}

export function fieldRenameGrammar(grammar: GrammarRecord, renames: readonly FieldRename[]): GrammarRecord {
	const original = isRecord(grammar.rules) ? grammar.rules : {};
	const rules: GrammarRecord = { ...original };
	const stop = supertypesOf(grammar);
	for (const rename of renames) {
		const issue = fieldRenameIssue(grammar, rename, renames);
		if (issue !== undefined) throw new Error(`bind: field '${rename.owner}.${rename.from}' → '${rename.to}': ${issue}`);
	}
	for (const rename of renames) {
		for (const host of fieldHosts(original, rename.owner, rename.from, stop)) rules[host] = renameFields(rules[host], rename.from, rename.to);
	}
	const out: GrammarRecord = { ...grammar, rules };
	if ('options' in grammar) out.options = rewriteOwnedSegments(grammar.options, renames.map((r) => ({ owner: r.owner, from: `${r.from}:`, to: `${r.to}:` })));
	carryHiddenFacts(grammar, out, (name) => name);
	return out;
}

function isWrapTarget(rule: GrammarRecord, target: FieldWrapTarget): boolean {
	if ('token' in target) return rule.type === 'STRING' && rule.value === target.token;
	if (rule.type === 'SYMBOL') return rule.name === target.symbol;
	return rule.type === 'ALIAS' && rule.named === true && rule.value === target.symbol;
}

function isWrapSite(rule: GrammarRecord, target: FieldWrapTarget): boolean {
	if (isWrapTarget(rule, target)) return true;
	return (rule.type === 'REPEAT' || rule.type === 'REPEAT1') && isRecord(rule.content) && isWrapTarget(rule.content, target);
}

function wrapTargets(rule: unknown, target: FieldWrapTarget, field: string): unknown {
	if (Array.isArray(rule)) return rule.map((r) => wrapTargets(r, target, field));
	if (!isRecord(rule)) return rule;
	if (isWrapSite(rule, target)) return { type: 'FIELD', name: field, content: rule };
	if (OPAQUE_RULES.has(rule.type) || rule.type === 'ALIAS') return rule;
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = wrapTargets(value, target, field);
	return out;
}

function hasWrapTarget(rule: unknown, target: FieldWrapTarget): boolean {
	if (Array.isArray(rule)) return rule.some((r) => hasWrapTarget(r, target));
	if (!isRecord(rule)) return false;
	if (isWrapSite(rule, target)) return true;
	if (OPAQUE_RULES.has(rule.type) || rule.type === 'ALIAS') return false;
	return Object.values(rule).some((value) => hasWrapTarget(value, target));
}

function wrapHosts(rules: GrammarRecord, wrap: FieldWrap, stop: ReadonlySet<string>): string[] {
	return [...transparentReach(rules, wrap.owner, stop)].filter((name) => hasWrapTarget(rules[name], wrap.target));
}

export function fieldWrapIssue(grammar: GrammarRecord, wrap: FieldWrap, batch: readonly FieldWrap[] = [wrap]): string | undefined {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	if (!(wrap.owner in rules)) return 'owner is not a rule';
	const stop = supertypesOf(grammar);
	const hosts = wrapHosts(rules, wrap, stop);
	if (hosts.length === 0) return 'token' in wrap.target ? 'token is not on the owner outside a field or token' : 'child is not an unfielded reference of the owner';
	if (hosts.some((host) => host !== wrap.owner && !sharersAgree(rules, host, stop, wrap, batch))) return 'field sits in a hidden rule another kind shares';
	if (fieldHosts(rules, wrap.owner, wrap.field, stop).length > 0) return 'member name is already a field of the owner';
	return undefined;
}

export interface ChildFields {
	readonly fields: readonly string[];
	readonly unfielded: boolean;
	readonly mixed: boolean;
	readonly arm: boolean;
}

export function childFields(grammar: GrammarRecord, owner: string, target: FieldWrapTarget | null): ChildFields {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	const supertypes = supertypesOf(grammar);
	const descended = (name: string): boolean => isParserHiddenName(name) && name in rules && !supertypes.has(name);
	const isNamedChild = (rule: GrammarRecord): boolean =>
		(rule.type === 'SYMBOL' && typeof rule.name === 'string' && !descended(rule.name)) || (rule.type === 'ALIAS' && rule.named === true);
	const matches = (rule: GrammarRecord): boolean => (target === null ? isNamedChild(rule) : isWrapTarget(rule, target));
	const fields = new Set<string>();
	const others = new Set<string>();
	let unfielded = false;
	const walk = (rule: unknown, field: string | null): void => {
		if (Array.isArray(rule)) return rule.forEach((r) => walk(r, field));
		if (!isRecord(rule)) return;
		if (matches(rule)) {
			if (field === null) unfielded = true;
			else fields.add(field);
			return;
		}
		if (isNamedChild(rule) && field !== null) others.add(field);
		if (rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN' || rule.type === 'ALIAS') return;
		const inner = rule.type === 'FIELD' && typeof rule.name === 'string' ? rule.name : field;
		for (const value of Object.values(rule)) walk(value, inner);
	};
	for (const host of transparentReach(rules, owner, supertypes)) walk(rules[host], null);
	const root = unwrapPrec(rules[owner]);
	const arm = isRecord(root) && root.type === 'CHOICE' && Array.isArray(root.members) && root.members.some((member) => {
		const alternative = unwrapPrec(member);
		return isRecord(alternative) && matches(alternative);
	});
	return { fields: [...fields], unfielded, mixed: [...fields].some((field) => others.has(field)), arm };
}

export function sharedHosts(grammar: GrammarRecord, request: FieldRename | FieldWrap, batch: readonly (FieldRename | FieldWrap)[] = [request]): string[] {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	const stop = supertypesOf(grammar);
	const hosts = 'from' in request ? fieldHosts(rules, request.owner, request.from, stop) : wrapHosts(rules, request, stop);
	return hosts.filter((host) => host !== request.owner && !sharersAgree(rules, host, stop, request, batch));
}

const sameEdit = (a: FieldRename | FieldWrap, b: FieldRename | FieldWrap): boolean =>
	'from' in a
		? 'from' in b && a.from === b.from && a.to === b.to
		: !('from' in b) && a.field === b.field && JSON.stringify(a.target) === JSON.stringify(b.target);

function sharersAgree(
	rules: GrammarRecord,
	host: string,
	stop: ReadonlySet<string>,
	request: FieldRename | FieldWrap,
	batch: readonly (FieldRename | FieldWrap)[]
): boolean {
	const sharers = Object.keys(rules).filter((name) => !isParserHiddenName(name) && transparentReach(rules, name, stop).has(host));
	return sharers.every((owner) => batch.some((edit) => edit.owner === owner && sameEdit(edit, request)));
}

export function fieldWrapGrammar(grammar: GrammarRecord, wraps: readonly FieldWrap[]): GrammarRecord {
	const original = isRecord(grammar.rules) ? grammar.rules : {};
	const rules: GrammarRecord = { ...original };
	const stop = supertypesOf(grammar);
	for (const wrap of wraps) {
		const issue = fieldWrapIssue(grammar, wrap, wraps);
		if (issue !== undefined) throw new Error(`bind: field '${wrap.owner}.${wrap.field}': ${issue}`);
	}
	for (const wrap of wraps) {
		for (const host of wrapHosts(original, wrap, stop)) rules[host] = wrapTargets(rules[host], wrap.target, wrap.field);
	}
	const slots = wraps.map((wrap) => ({
		owner: wrap.owner,
		from: 'symbol' in wrap.target ? `${wrap.target.symbol}:` : JSON.stringify(wrap.target.token),
		to: `${wrap.field}:`
	}));
	const out: GrammarRecord = { ...grammar, rules };
	if ('options' in grammar) out.options = rewriteOwnedSegments(grammar.options, slots);
	carryHiddenFacts(grammar, out, (name) => name);
	return out;
}

export function baseNamesOf(
	renamedFrom: Readonly<Record<string, string>> | undefined,
	splitFrom: Readonly<Record<string, string>> | undefined
): Record<string, string> {
	const names = new Set([...Object.keys(renamedFrom ?? {}), ...Object.keys(splitFrom ?? {})]);
	return Object.fromEntries(
		[...names].flatMap((name) => {
			const base = mappedName(renamedFrom, mappedName(splitFrom, name));
			return base === name ? [] : [[name, base]];
		})
	);
}

export function boundNameOf(
	renamedFrom: Readonly<Record<string, string>> | undefined,
	aliases: readonly Extract<BindingEffect, { kind: 'alias' }>[] = []
): (name: string) => string {
	const bound = new Map(Object.entries(renamedFrom ?? {}).map(([to, from]) => [from, to]));
	for (const { from, to } of aliases) bound.set(from, to);
	return (name) => bound.get(name) ?? name;
}
