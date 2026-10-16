import {
	fieldNames,
	isParserHiddenName,
	isRecord,
	listedNames,
	OPAQUE_RULES,
	replaceSymbols,
	supertypesOf,
	symbolNames,
	transparentReach,
	unwrapPrec,
	type GrammarRecord
} from './rule-patterns.ts';
import { mintLists, VerbRefusal, verbCtxOf } from './verbs/copy.ts';
import {
	bindMatch,
	boundFieldNameOf,
	effectsForOwners,
	inheritSplitOptions,
	provenanceOf,
	renameKeys,
	renameOptionPaths,
	renameRecords,
	renameValue,
	rewriteOwnedSegments,
	type BindingEffect,
	type Lead,
	type LeadMatch
} from './verbs/effects.ts';
import { appendLeadGroups, applyLead } from './verbs/lead.ts';
import type { EditsConfig } from './wire/wire.ts';

export interface Rename {
	readonly from: string;
	readonly to: string;
}

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

export interface Bindings {
	readonly hash?: string;
	readonly patches?: EditsConfig;
	readonly renames?: readonly Rename[];
	readonly leads?: readonly Lead[];
	readonly splits?: readonly Split[];
}

export const BINDING_SET: unique symbol = Symbol.for('sittir.bindingSet');

export function markBindingSet<S extends object>(set: S): S {
	return Object.defineProperty({ ...set }, BINDING_SET, { value: true });
}

export function isBindingSet(set: object): boolean {
	return (set as { [BINDING_SET]?: boolean })[BINDING_SET] === true;
}

export function bindings<const B extends Bindings>(grammarBindings: B): B {
	return grammarBindings;
}

export function rename(from: string, to: string): Rename {
	return { from, to };
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

function renameOptions(grammar: GrammarRecord, rename: (name: string) => string, kindHead: boolean): unknown {
	return renameOptionPaths(grammar.options, rename, kindHead, fieldNames(grammar.rules));
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

function wrapTargets(rule: unknown, target: FieldWrapTarget, field: string): unknown {
	if (Array.isArray(rule)) return rule.map((r) => wrapTargets(r, target, field));
	if (!isRecord(rule)) return rule;
	if (isWrapTarget(rule, target)) return { type: 'FIELD', name: field, content: rule };
	if (OPAQUE_RULES.has(rule.type) || rule.type === 'ALIAS') return rule;
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = wrapTargets(value, target, field);
	return out;
}

function hasWrapTarget(rule: unknown, target: FieldWrapTarget): boolean {
	if (Array.isArray(rule)) return rule.some((r) => hasWrapTarget(r, target));
	if (!isRecord(rule)) return false;
	if (isWrapTarget(rule, target)) return true;
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

function fieldReferences(rule: unknown, symbol: string, field: string, inField = false): unknown {
	if (Array.isArray(rule)) return rule.map((r) => fieldReferences(r, symbol, field, inField));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'SYMBOL' && rule.name === symbol && !inField) return { type: 'FIELD', name: field, content: rule };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = fieldReferences(value, symbol, field, inField || rule.type === 'FIELD');
	return out;
}

export function splitGrammar(grammar: GrammarRecord, splits: readonly Split[]): GrammarRecord {
	const rules: GrammarRecord = { ...(isRecord(grammar.rules) ? grammar.rules : {}) };
	const { supertypes, inline, enlist } = mintLists(grammar);
	const splitFrom: Record<string, string> = {};
	const reaches = (from: string, target: string, seen: Set<string> = new Set()): boolean => {
		if (from === target) return true;
		if (seen.has(from) || !(from in rules)) return false;
		seen.add(from);
		return [...symbolNames(rules[from])].some((name) => name === target || (isParserHiddenName(name) && reaches(name, target, seen)));
	};
	const mint = (base: string, name: string, body: unknown): string => {
		if (name in rules && splitFrom[name] !== base) throw new Error(`bind: split '${base}' → '${name}', which the grammar already names`);
		rules[name] = body;
		splitFrom[name] = base;
		enlist(base, name);
		return name;
	};
	const visiting = new Set<string>();
	const clones = new Map<string, string>();
	const containerFields = new Map<string, string>();
	const cloneToward = (name: string, target: string, replacement: string, outer: string, container?: Split['containers'][number]): string => {
		const base = mappedName(splitFrom, name);
		const key = `${base}\u0000${outer}`;
		const clone = clones.get(key) ?? (isParserHiddenName(base) || container === undefined ? `${base}_${outer}` : container.name);
		clones.set(key, clone);
		if (!isParserHiddenName(base) && container !== undefined) containerFields.set(clone, container.field);
		if (visiting.has(clone)) return clone;
		visiting.add(clone);
		const from = splitFrom[clone] === base ? rules[clone] : rules[base];
		splitFrom[clone] = base;
		const body = replaceSymbols(from, (ref) =>
			ref === target ? replacement : isParserHiddenName(ref) && reaches(ref, target) ? cloneToward(ref, target, replacement, outer) : ref
		);
		visiting.delete(clone);
		return mint(base, clone, body);
	};
	for (const split of splits) {
		if (!(split.kind in rules)) throw new Error(`bind: split source '${split.kind}' is no rule of the grammar`);
		if (isParserHiddenName(split.kind) !== isParserHiddenName(split.as)) throw new Error(`bind: split '${split.kind}' → '${split.as}' flips hiddenness`);
		const outer = split.within[split.within.length - 1];
		if (outer === undefined) throw new Error(`bind: split '${split.kind}' → '${split.as}' names no placement`);
		mint(split.kind, split.as, rules[split.kind]);
		let target = split.kind;
		let replacement = split.as;
		split.within.slice(0, -1).forEach((ancestor, index) => {
			replacement = cloneToward(ancestor, target, replacement, outer, split.containers[index]);
			target = ancestor;
		});
		const outerTarget = target;
		const outerReplacement = replacement;
		rules[outer] = replaceSymbols(rules[outer], (ref) =>
			ref === outerTarget ? outerReplacement : isParserHiddenName(ref) && reaches(ref, outerTarget) ? cloneToward(ref, outerTarget, outerReplacement, outer) : ref
		);
	}
	const placements = new Set([...splits.map((split) => split.within[split.within.length - 1]!), ...Object.keys(splitFrom)]);
	for (const [container, field] of containerFields)
		for (const host of placements) if (host in rules) rules[host] = fieldReferences(rules[host], container, field);
	const out: GrammarRecord = { ...grammar, rules, supertypes, inline };
	carryHiddenFacts(grammar, out, (name) => name);
	out.splitFrom = { ...(isRecord(grammar.splitFrom) ? grammar.splitFrom : {}), ...splitFrom };
	if ('options' in grammar) out.options = inheritSplitOptions(grammar, splitFrom);
	return out;
}

export class LeadRefusal extends Error {
	readonly reason: string;
	constructor(reason: string, lead?: Lead) {
		super(lead === undefined ? reason : `bind: lead '${lead.list}.${lead.field}': ${reason}`);
		this.reason = reason;
	}
}

export function leadGrammar(grammar: GrammarRecord, leads: readonly Lead[]): GrammarRecord {
	if (leads.length === 0) return grammar;
	const ctx = verbCtxOf(grammar);
	for (const l of leads) {
		try {
			applyLead(l, ctx);
		} catch (error) {
			throw error instanceof VerbRefusal ? new LeadRefusal(error.reason, l) : error;
		}
	}
	appendLeadGroups(ctx);
	const out: GrammarRecord = { ...grammar, rules: ctx.rules, supertypes: ctx.lists.supertypes, inline: ctx.lists.inline };
	carryHiddenFacts(grammar, out, (name) => name);
	const provenance = provenanceOf(ctx.effects, ctx.rules);
	out.leadFrom = { ...(isRecord(grammar.leadFrom) ? grammar.leadFrom : {}), ...provenance.leadFrom };
	out.bindingEffects = [...(Array.isArray(grammar.bindingEffects) ? grammar.bindingEffects : []), ...provenance.bindingEffects];
	return out;
}

export function leadIssue(grammar: GrammarRecord, leads: readonly Lead[]): string | undefined {
	try {
		leadGrammar(grammar, leads);
		return undefined;
	} catch (error) {
		if (error instanceof LeadRefusal) return error.reason;
		throw error;
	}
}

export function aliasTargetIssue(grammar: GrammarRecord, from: string, to: string): string | undefined {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	if (isParserHiddenName(from) !== isParserHiddenName(to)) return 'flips hiddenness';
	if (to in rules) return 'the grammar already names the target';
	return undefined;
}

function patchAliases(value: unknown, out: { from: string; to: string }[] = []): { from: string; to: string }[] {
	if (Array.isArray(value)) for (const v of value) patchAliases(v, out);
	else if (isRecord(value)) {
		const content = value.content;
		if (value.type === 'ALIAS' && value.named === true && typeof value.value === 'string' && isRecord(content) && content.type === 'SYMBOL' && typeof content.name === 'string')
			out.push({ from: content.name, to: value.value });
		for (const v of Object.values(value)) patchAliases(v, out);
	}
	return out;
}

export function checkBindingPatches(holder: unknown, patches: EditsConfig | undefined): void {
	const grammar = isRecord(holder) && isRecord(holder.grammar) ? holder.grammar : isRecord(holder) ? holder : {};
	for (const { from, to } of patchAliases(patches)) {
		const issue = aliasTargetIssue(grammar, from, to);
		if (issue !== undefined) throw new Error(`bind: alias '${from}' → '${to}': ${issue}`);
	}
}

export function rewriteBindingOptions(grammar: GrammarRecord, effects: readonly BindingEffect[]): GrammarRecord {
	if (!('options' in grammar) || effects.length === 0) return grammar;
	const segments = effects.flatMap((e) => (e.kind === 'segment' ? [{ owner: e.owner, from: e.from, to: e.to }] : []));
	const aliases = new Map(effects.flatMap((e) => (e.kind === 'alias' ? [[e.from, e.to] as const] : [])));
	const out: GrammarRecord = { ...grammar, options: rewriteOwnedSegments(grammar.options, segments, grammar) };
	if (aliases.size > 0) out.options = renameOptions(out, (name) => aliases.get(name) ?? name, false);
	carryHiddenFacts(grammar, out, (name) => name);
	return out;
}

export function bindGrammar(
	grammar: GrammarRecord,
	grammarBindings: Bindings,
	effects: readonly BindingEffect[] = []
): GrammarRecord {
	const ownedEffects = effectsForOwners(grammar, effects);
	const split = splitGrammar(rewriteBindingOptions(grammar, ownedEffects), grammarBindings.splits ?? []);
	const fieldNameOf = boundFieldNameOf(ownedEffects.filter((effect) => effect.kind === 'segment'));
	const leads = (grammarBindings.leads ?? []).map((entry) => ({
		...entry,
		item: fieldNameOf(entry.list, entry.item),
		admits: entry.admits.map((admit) => bindMatch(admit, (kind) => kind, fieldNameOf))
	}));
	const bound = leadGrammar(split, leads);
	bound.bindingEffects = [
		...ownedEffects,
		...(Array.isArray(bound.bindingEffects)
			? bound.bindingEffects.filter((effect: BindingEffect) => effect.kind === 'lead')
			: [])
	];
	return bound;
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
