import { isPreference } from './primitives/preference.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
import { LABELS_KEY } from './wire/options-block.ts';
import { REPARSE_HOST_PRIORITY } from './wire/reparse-hosts.ts';
import type { PatchesConfig } from './wire/wire.ts';
import { undisplayedKindAddress } from './arm-names.ts';
import { readFileSync } from 'node:fs';

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

export interface LeadWithin {
	readonly field?: string;
	readonly admits: readonly LeadMatch[];
}

export interface LeadMatch {
	readonly kind: string;
	readonly within?: LeadWithin;
	readonly as?: string;
}

export interface Lead {
	readonly list: string;
	readonly item: string;
	readonly field: string;
	readonly admits: readonly LeadMatch[];
}

export interface Bindings {
	readonly hash?: string;
	readonly patches?: PatchesConfig;
	readonly renames?: readonly Rename[];
	readonly leads?: readonly Lead[];
	readonly splits?: readonly Split[];
}

export type BindingEffect =
	| { readonly kind: 'segment'; readonly owner: string; readonly from: string; readonly to: string }
	| { readonly kind: 'alias'; readonly from: string; readonly to: string };

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

export function split(kind: string, as: string, placement: Pick<Split, 'within' | 'containers'>): Split {
	return { kind, as, within: placement.within, containers: placement.containers };
}

export function lead(list: string, item: string, field: string, ...admits: LeadMatch[]): Lead {
	return { list, item, field, admits };
}

export function match(kind: string, within?: readonly LeadMatch[] | Readonly<Record<string, readonly LeadMatch[]>>, as?: string): LeadMatch {
	const inner: LeadWithin | undefined =
		within === undefined
			? undefined
			: Array.isArray(within)
				? { admits: within }
				: (() => {
						const [entry, ...rest] = Object.entries(within as Readonly<Record<string, readonly LeadMatch[]>>);
						if (entry === undefined || rest.length > 0) throw new Error(`bind: match '${kind}' restricts one field, not ${rest.length + (entry === undefined ? 0 : 1)}`);
						return { field: entry[0], admits: entry[1] };
					})();
	return { kind, ...(inner === undefined ? {} : { within: inner }), ...(as === undefined ? {} : { as }) };
}

export type GrammarRecord = Record<string, unknown>;

const LIST_FIELDS = ['supertypes', 'inline', 'factoryInline', 'textTokens', 'protectedRuleNames', 'undeclaredRules'];
const RULE_FIELDS = ['extras', 'externals', 'precedences', 'reserved', 'conflicts'];
const KEYED_FIELDS = ['rules', 'renderAs', 'visibleExternals', 'groups'];

export const isRecord = (value: unknown): value is GrammarRecord => typeof value === 'object' && value !== null && !Array.isArray(value);

const KIND_KEYS: ReadonlySet<string> = new Set(['variantOf']);

function namesKind(record: GrammarRecord, key: string): boolean {
	if (key === 'name') return record.type === 'SYMBOL' || record.type === 'FIELD_ALIAS';
	if (key === 'value') return record.type === 'ALIAS' && record.named === true;
	return KIND_KEYS.has(key);
}

function renameValue(value: unknown, rename: (name: string) => string): unknown {
	if (typeof value === 'string') return rename(value);
	if (Array.isArray(value)) return value.map((v) => renameValue(v, rename));
	if (!isRecord(value)) return value;
	const out: GrammarRecord = {};
	for (const [key, v] of Object.entries(value)) {
		if (typeof v === 'string') out[key] = namesKind(value, key) ? rename(v) : v;
		else out[key] = renameValue(v, rename);
	}
	return out;
}

export function mappedName(record: Readonly<Record<string, string>> | undefined, name: string): string {
	return record !== undefined && Object.hasOwn(record, name) ? record[name]! : name;
}

function renameKeys(record: unknown, rename: (name: string) => string, renameValues = true): unknown {
	if (!isRecord(record)) return record;
	const out: GrammarRecord = {};
	for (const [key, v] of Object.entries(record)) {
		const to = rename(key);
		if (to in out) throw new Error(`bind: '${key}' renames to '${to}', which the grammar already names`);
		out[to] = renameValues ? renameValue(v, rename) : v;
	}
	return out;
}

function renameReparseHosts(config: GrammarRecord, rename: (name: string) => string): GrammarRecord {
	const out: GrammarRecord = { ...config, hosts: renameKeys(config.hosts, rename, false), priority: renameValue(config.priority ?? REPARSE_HOST_PRIORITY, rename) };
	if ('gated' in config) out.gated = renameValue(config.gated, rename);
	return out;
}

function renameSegment(segment: string, rename: (name: string) => string, fields: ReadonlySet<string>): string {
	if (segment.startsWith('(') && segment.endsWith(')')) return `(${rename(segment.slice(1, -1))})`;
	if (segment.endsWith(':') && !fields.has(segment.slice(0, -1))) return `${rename(segment.slice(0, -1))}:`;
	return segment;
}

function renamePath(path: string, rename: (name: string) => string, kindHead: boolean, fields: ReadonlySet<string>): string {
	const [head = '', ...rest] = path.split('/');
	return [kindHead ? rename(head) : renameSegment(head, rename, fields), ...rest.map((s) => renameSegment(s, rename, fields))].join('/');
}

function renameOptionPaths(record: unknown, rename: (name: string) => string, kindHead: boolean, fields: ReadonlySet<string>): unknown {
	if (!isRecord(record) || isPreference(record)) return record;
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(record)) {
		const to = renamePath(key, rename, kindHead, fields);
		if (to in out) throw new Error(`bind: options '${key}' renames to '${to}', which the options already name`);
		out[to] = renameOptionPaths(value, rename, key === LABELS_KEY, fields);
	}
	return out;
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
	const externals = new Set(
		(Array.isArray(grammar.externals) ? grammar.externals : []).flatMap((e) => (isRecord(e) && typeof e.name === 'string' ? [e.name] : []))
	);
	for (const [from, to] of Object.entries(renames)) {
		if (!(from in rules) && !externals.has(from)) throw new Error(`bind: '${from}' is no rule or external of the grammar`);
		if (from.startsWith('_') !== to.startsWith('_')) throw new Error(`bind: '${from}' → '${to}' flips hiddenness`);
		if (to in rules && !(to in renames)) throw new Error(`bind: '${from}' → '${to}', which the grammar already names`);
	}
	const out: GrammarRecord = { ...grammar };
	for (const field of KEYED_FIELDS) if (field in grammar) out[field] = renameKeys(grammar[field], rename);
	if ('options' in grammar) out.options = renameOptions(grammar, rename, true);
	if (isRecord(grammar.reparseHosts)) out.reparseHosts = renameReparseHosts(grammar.reparseHosts, rename);
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

export function symbolNames(rule: unknown, out: Set<string> = new Set()): Set<string> {
	if (Array.isArray(rule)) for (const r of rule) symbolNames(r, out);
	else if (isRecord(rule)) {
		if (rule.type === 'SYMBOL' && typeof rule.name === 'string') out.add(rule.name);
		for (const value of Object.values(rule)) symbolNames(value, out);
	}
	return out;
}

function replaceSymbols(rule: unknown, replace: (name: string) => string): unknown {
	if (Array.isArray(rule)) return rule.map((r) => replaceSymbols(r, replace));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'SYMBOL' && typeof rule.name === 'string') return { ...rule, name: replace(rule.name) };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = replaceSymbols(value, replace);
	return out;
}

const isTransparent = (name: string): boolean => name.startsWith('_');

function fieldNames(rule: unknown, out: Set<string> = new Set()): Set<string> {
	if (Array.isArray(rule)) for (const r of rule) fieldNames(r, out);
	else if (isRecord(rule)) {
		if (rule.type === 'FIELD' && typeof rule.name === 'string') out.add(rule.name);
		for (const value of Object.values(rule)) fieldNames(value, out);
	}
	return out;
}

function supertypesOf(grammar: GrammarRecord): ReadonlySet<string> {
	return new Set((Array.isArray(grammar.supertypes) ? grammar.supertypes : []).flatMap((s) => (typeof s === 'string' ? [s] : isRecord(s) && typeof s.name === 'string' ? [s.name] : [])));
}

function transparentReach(rules: GrammarRecord, from: string, stop: ReadonlySet<string>): Set<string> {
	const out = new Set<string>([from]);
	const queue = [from];
	while (queue.length > 0) {
		for (const ref of symbolNames(rules[queue.pop()!])) {
			if (isTransparent(ref) && ref in rules && !stop.has(ref) && !out.has(ref)) {
				out.add(ref);
				queue.push(ref);
			}
		}
	}
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

interface SegmentRewrite {
	readonly owner: string;
	readonly from: string;
	readonly to: string;
}

function rewriteOwnedSegments(options: unknown, rewrites: readonly SegmentRewrite[]): unknown {
	if (!isRecord(options)) return options;
	const fieldOf = (owner: string, segment: string): string =>
		rewrites.find((r) => r.owner === owner && r.from === segment)?.to ?? segment;
	const ownedPath = (owner: string, path: string): string => path.split('/').map((segment) => fieldOf(owner, segment)).join('/');
	const ownedRecord = (owner: string, record: unknown): unknown => {
		if (!isRecord(record) || isPreference(record)) return record;
		const out: GrammarRecord = {};
		for (const [key, value] of Object.entries(record)) out[ownedPath(owner, key)] = ownedRecord(owner, value);
		return out;
	};
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(options)) {
		if (key === LABELS_KEY && isRecord(value)) {
			const labels: GrammarRecord = {};
			for (const [address, target] of Object.entries(value)) {
				const [head = '', ...rest] = address.split('/');
				labels[[head, ...rest.map((segment) => fieldOf(head, segment))].join('/')] = target;
			}
			out[key] = labels;
		} else out[key] = ownedRecord(key, value);
	}
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

const OPAQUE_RULES: ReadonlySet<unknown> = new Set(['FIELD', 'TOKEN', 'IMMEDIATE_TOKEN']);

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

function unprecedenced(rule: unknown): unknown {
	return isRecord(rule) && isPrecWrapper(rule as { type: string }) ? unprecedenced(rule.content) : rule;
}

export function childFields(grammar: GrammarRecord, owner: string, target: FieldWrapTarget | null): ChildFields {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	const supertypes = supertypesOf(grammar);
	const descended = (name: string): boolean => isTransparent(name) && name in rules && !supertypes.has(name);
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
	const root = unprecedenced(rules[owner]);
	const arm = isRecord(root) && root.type === 'CHOICE' && Array.isArray(root.members) && root.members.some((member) => {
		const alternative = unprecedenced(member);
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
	const sharers = Object.keys(rules).filter((name) => !isTransparent(name) && transparentReach(rules, name, stop).has(host));
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
	const supertypes = (Array.isArray(grammar.supertypes) ? grammar.supertypes : []).slice();
	const inline = (Array.isArray(grammar.inline) ? grammar.inline : []).slice();
	const nameOf = (entry: unknown): string | undefined => (typeof entry === 'string' ? entry : isRecord(entry) && typeof entry.name === 'string' ? entry.name : undefined);
	const listed = (list: unknown[], name: string): boolean => list.some((entry) => nameOf(entry) === name);
	const splitFrom: Record<string, string> = {};
	const reaches = (from: string, target: string, seen: Set<string> = new Set()): boolean => {
		if (from === target) return true;
		if (seen.has(from) || !(from in rules)) return false;
		seen.add(from);
		return [...symbolNames(rules[from])].some((name) => name === target || (name.startsWith('_') && reaches(name, target, seen)));
	};
	const mint = (base: string, name: string, body: unknown): string => {
		if (name in rules && splitFrom[name] !== base) throw new Error(`bind: split '${base}' → '${name}', which the grammar already names`);
		rules[name] = body;
		splitFrom[name] = base;
		if (listed(supertypes, base) && !listed(supertypes, name)) supertypes.push(typeof supertypes[0] === 'string' ? name : { type: 'SYMBOL', name });
		if (listed(inline, base) && !listed(inline, name)) inline.push(typeof inline[0] === 'string' ? name : { type: 'SYMBOL', name });
		return name;
	};
	const visiting = new Set<string>();
	const clones = new Map<string, string>();
	const containerFields = new Map<string, string>();
	const cloneToward = (name: string, target: string, replacement: string, outer: string, container?: Split['containers'][number]): string => {
		const base = mappedName(splitFrom, name);
		const key = `${base}\u0000${outer}`;
		const clone = clones.get(key) ?? (isTransparent(base) || container === undefined ? `${base}_${outer}` : container.name);
		clones.set(key, clone);
		if (!isTransparent(base) && container !== undefined) containerFields.set(clone, container.field);
		if (visiting.has(clone)) return clone;
		visiting.add(clone);
		const from = splitFrom[clone] === base ? rules[clone] : rules[base];
		splitFrom[clone] = base;
		const body = replaceSymbols(from, (ref) =>
			ref === target ? replacement : isTransparent(ref) && reaches(ref, target) ? cloneToward(ref, target, replacement, outer) : ref
		);
		visiting.delete(clone);
		return mint(base, clone, body);
	};
	for (const split of splits) {
		if (!(split.kind in rules)) throw new Error(`bind: split source '${split.kind}' is no rule of the grammar`);
		if (split.kind.startsWith('_') !== split.as.startsWith('_')) throw new Error(`bind: split '${split.kind}' → '${split.as}' flips hiddenness`);
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
			ref === outerTarget ? outerReplacement : ref.startsWith('_') && reaches(ref, outerTarget) ? cloneToward(ref, outerTarget, outerReplacement, outer) : ref
		);
	}
	const placements = new Set([...splits.map((split) => split.within[split.within.length - 1]!), ...Object.keys(splitFrom)]);
	for (const [container, field] of containerFields)
		for (const host of placements) if (host in rules) rules[host] = fieldReferences(rules[host], container, field);
	const out: GrammarRecord = { ...grammar, rules, supertypes, inline };
	carryHiddenFacts(grammar, out, (name) => name);
	out.splitFrom = { ...(isRecord(grammar.splitFrom) ? grammar.splitFrom : {}), ...splitFrom };
	return out;
}

interface LeadSide {
	readonly keep: boolean;
	readonly suffix: string;
}

interface LeadState {
	readonly rules: GrammarRecord;
	readonly supertypes: ReadonlySet<string>;
	readonly referencers: ReadonlyMap<string, ReadonlySet<string>>;
	readonly mint: (base: string, side: LeadSide, body: unknown) => string;
}

interface ListShape {
	readonly item: string;
	readonly content: unknown;
	readonly separator: unknown;
	readonly trailing: boolean;
	readonly optional: (rule: unknown) => GrammarRecord;
}

const BLANK_RULE: GrammarRecord = { type: 'BLANK' };
const sameRule = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const isBlankRule = (rule: unknown): boolean => isRecord(rule) && rule.type === 'BLANK';

function rewrap(original: unknown, inner: unknown): unknown {
	return isRecord(original) && isPrecWrapper(original as { type: string }) ? { ...original, content: rewrap(original.content, inner) } : inner;
}

function refKind(ref: unknown): string | undefined {
	const node = unprecedenced(ref);
	if (!isRecord(node)) return undefined;
	if (node.type === 'ALIAS' && node.named === true && typeof node.value === 'string') return node.value;
	return node.type === 'SYMBOL' && typeof node.name === 'string' && !isTransparent(node.name) ? node.name : undefined;
}

function refRule(ref: unknown): string | undefined {
	const node = unprecedenced(ref);
	if (!isRecord(node)) return undefined;
	if (node.type === 'SYMBOL' && typeof node.name === 'string') return node.name;
	return node.type === 'ALIAS' ? refRule(node.content) : undefined;
}

function listShape(rule: unknown): ListShape | undefined {
	const body = unprecedenced(rule);
	if (!isRecord(body) || body.type !== 'SEQ' || !Array.isArray(body.members)) return undefined;
	const [first, repeat, tail, ...extra] = body.members.map(unprecedenced);
	if (extra.length > 0 || !isRecord(first) || first.type !== 'FIELD' || typeof first.name !== 'string' || !isRecord(repeat) || repeat.type !== 'REPEAT') return undefined;
	const step = unprecedenced(repeat.content);
	if (!isRecord(step) || step.type !== 'SEQ' || !Array.isArray(step.members) || step.members.length !== 2) return undefined;
	const [separator, again] = step.members.map(unprecedenced);
	if (!isRecord(again) || again.type !== 'FIELD' || again.name !== first.name || !sameRule(again.content, first.content)) return undefined;
	const optionalOf = (rule: unknown): unknown =>
		isRecord(rule) && rule.type === 'OPTIONAL'
			? rule.content
			: isRecord(rule) && rule.type === 'CHOICE' && Array.isArray(rule.members) && rule.members.length === 2 && isBlankRule(rule.members[1])
				? rule.members[0]
				: undefined;
	const trailing = tail !== undefined && sameRule(optionalOf(tail), separator);
	if (tail !== undefined && !trailing) return undefined;
	const optional = isRecord(tail) && tail.type === 'OPTIONAL' ? (rule: unknown): GrammarRecord => ({ type: 'OPTIONAL', content: rule }) : (rule: unknown): GrammarRecord => ({ type: 'CHOICE', members: [rule, BLANK_RULE] });
	return { item: first.name, content: first.content, separator, trailing, optional };
}

function exclusiveTo(state: LeadState, name: string, exclusive: boolean): boolean {
	return exclusive && (state.referencers.get(name)?.size ?? 0) <= 1;
}

function narrowRef(state: LeadState, ref: unknown, admits: readonly LeadMatch[], side: LeadSide, exclusive: boolean): unknown {
	const kind = refKind(ref);
	if (kind !== undefined) {
		const matches = admits.filter((m) => m.kind === kind);
		if (matches.length === 0) return side.keep ? undefined : ref;
		if (matches.length > 1) throw new Error(`bind: lead admits '${kind}' twice`);
		const match = matches[0]!;
		const as = side.keep ? (match.as ?? kind) : kind;
		const name = refRule(ref)!;
		const body = match.within === undefined ? undefined : narrowWithin(state, state.rules[name], match.within, side, exclusiveTo(state, name, exclusive));
		if (body === undefined) {
			if (!side.keep) return undefined;
			return as === kind ? ref : { type: 'ALIAS', named: true, value: as, content: { type: 'SYMBOL', name } };
		}
		if (body === state.rules[name]) return side.keep && as !== kind ? { type: 'ALIAS', named: true, value: as, content: { type: 'SYMBOL', name } } : ref;
		if (!side.keep && (exclusiveTo(state, name, exclusive) || process.env.SITTIR_SCRATCH_LEAD_REST_IN_PLACE === '1')) {
			state.rules[name] = body;
			return ref;
		}
		return { type: 'ALIAS', named: true, value: as, content: { type: 'SYMBOL', name: state.mint(name, side, body) } };
	}
	const node = unprecedenced(ref);
	if (isRecord(node) && node.type === 'CHOICE' && Array.isArray(node.members)) {
		const members: readonly unknown[] = node.members;
		const arms = members.map((arm) => narrowRef(state, arm, admits, side, exclusive)).filter((arm) => arm !== undefined);
		if (arms.length === 0) return undefined;
		if (arms.length === members.length && arms.every((arm, i) => arm === members[i])) return ref;
		return arms.length === 1 ? arms[0] : rewrap(ref, { ...node, members: arms });
	}
	const name = refRule(ref);
	if (name !== undefined && isRecord(node) && node.type === 'SYMBOL' && isTransparent(name) && !state.supertypes.has(name) && name in state.rules) {
		const exclusiveHere = exclusiveTo(state, name, exclusive);
		const narrowed = narrowRef(state, state.rules[name], admits, side, exclusiveHere);
		if (narrowed === undefined) return undefined;
		if (narrowed === state.rules[name]) return ref;
		if (refRule(narrowed) !== undefined) return narrowed;
		if (!side.keep && exclusiveHere) {
			state.rules[name] = narrowed;
			return ref;
		}
		return rewrap(ref, { ...node, name: state.mint(name, side, narrowed) });
	}
	return side.keep ? undefined : ref;
}

function narrowWithin(state: LeadState, body: unknown, within: LeadWithin, side: LeadSide, exclusive: boolean): unknown {
	const admitted = new Set(within.admits.map((m) => m.kind));
	const isTarget = (node: GrammarRecord): boolean =>
		within.field === undefined
			? node.type === 'CHOICE' && Array.isArray(node.members) && node.members.some((arm) => admitted.has(refKind(arm) ?? ''))
			: node.type === 'FIELD' && node.name === within.field;
	const holds = (node: unknown, seen: Set<string> = new Set()): boolean => {
		if (Array.isArray(node)) return node.some((n) => holds(n, seen));
		if (!isRecord(node)) return false;
		if (isTarget(node)) return true;
		if (OPAQUE_RULES.has(node.type) || node.type === 'ALIAS') return false;
		if (node.type === 'SYMBOL') {
			const name = node.name as string;
			if (!isTransparent(name) || state.supertypes.has(name) || seen.has(name) || !(name in state.rules)) return false;
			seen.add(name);
			return holds(state.rules[name], seen);
		}
		return holds(node.members, seen) || holds(node.content, seen);
	};
	if (!holds(body)) throw new Error(`bind: lead restriction ${within.field === undefined ? 'of an unfielded child' : `of field '${within.field}'`} names no position in the kind`);
	const visit = (node: unknown): unknown => {
		if (Array.isArray(node)) {
			const out = node.map(visit);
			return out.every((n, i) => n === node[i]) ? node : out;
		}
		if (!isRecord(node)) return node;
		if (isTarget(node)) {
			if (node.type === 'FIELD') {
				const content = narrowRef(state, node.content, within.admits, side, exclusive);
				if (content === undefined) throw new Error(`bind: lead leaves field '${within.field}' empty`);
				return content === node.content ? node : { ...node, content };
			}
			const narrowed = narrowRef(state, node, within.admits, side, exclusive);
			if (narrowed === undefined) throw new Error('bind: lead leaves an unfielded child empty');
			return narrowed;
		}
		if (OPAQUE_RULES.has(node.type) || node.type === 'ALIAS') return node;
		if (node.type === 'SYMBOL') {
			const name = node.name as string;
			if (!holds(node)) return node;
			const exclusiveHere = exclusiveTo(state, name, exclusive);
			const inner = narrowWithin(state, state.rules[name], within, side, exclusiveHere);
			if (inner === state.rules[name]) return node;
			if (!side.keep && exclusiveHere) {
				state.rules[name] = inner;
				return node;
			}
			return { ...node, name: state.mint(name, side, inner) };
		}
		const members = node.members === undefined ? undefined : visit(node.members);
		const content = node.content === undefined ? undefined : visit(node.content);
		if (members === node.members && content === node.content) return node;
		return { ...node, ...(members === undefined ? {} : { members }), ...(content === undefined ? {} : { content }) };
	};
	return visit(body);
}

function replaceItems(rule: unknown, item: string, from: unknown, to: unknown): unknown {
	if (Array.isArray(rule)) return rule.map((r) => replaceItems(r, item, from, to));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'FIELD' && rule.name === item && sameRule(rule.content, from)) return { ...rule, content: to };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = key === 'members' || key === 'content' ? replaceItems(value, item, from, to) : value;
	return out;
}

function listTarget(rule: unknown, list: string): string | undefined {
	if (Array.isArray(rule)) {
		for (const r of rule) {
			const found = listTarget(r, list);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	if (!isRecord(rule)) return undefined;
	if (rule.type === 'FIELD' && rule.name === list) return refRule(rule.content);
	if (OPAQUE_RULES.has(rule.type) || rule.type === 'ALIAS') return undefined;
	return listTarget(rule.members, list) ?? listTarget(rule.content, list);
}

function rewriteListRefs(rule: unknown, list: string, replace: (field: GrammarRecord) => GrammarRecord): unknown {
	if (Array.isArray(rule)) {
		const out = rule.map((r) => rewriteListRefs(r, list, replace));
		return out.every((r, i) => r === rule[i]) ? rule : out;
	}
	if (!isRecord(rule)) return rule;
	if (rule.type === 'FIELD' && refRule(rule.content) === list) return replace(rule);
	const members = rule.members === undefined ? undefined : rewriteListRefs(rule.members, list, replace);
	const content = rule.content === undefined ? undefined : rewriteListRefs(rule.content, list, replace);
	if (members === rule.members && content === rule.content) return rule;
	return { ...rule, ...(members === undefined ? {} : { members }), ...(content === undefined ? {} : { content }) };
}

export function leadGrammar(grammar: GrammarRecord, leads: readonly Lead[]): GrammarRecord {
	if (leads.length === 0) return grammar;
	const rules: GrammarRecord = { ...(isRecord(grammar.rules) ? grammar.rules : {}) };
	const supertypeList = (Array.isArray(grammar.supertypes) ? grammar.supertypes : []).slice();
	const inline = (Array.isArray(grammar.inline) ? grammar.inline : []).slice();
	const nameOf = (entry: unknown): string | undefined => (typeof entry === 'string' ? entry : isRecord(entry) && typeof entry.name === 'string' ? entry.name : undefined);
	const listed = (list: unknown[], name: string): boolean => list.some((entry) => nameOf(entry) === name);
	const leadFrom: Record<string, string> = {};
	const mint = (base: string, side: LeadSide, body: unknown): string => {
		const name = `_${undisplayedKindAddress(base)}_${side.suffix}`;
		if (name in rules && leadFrom[name] !== base) throw new Error(`bind: lead '${base}' → '${name}', which the grammar already names`);
		rules[name] = body;
		leadFrom[name] = base;
		if (listed(supertypeList, base) && !listed(supertypeList, name)) supertypeList.push(typeof supertypeList[0] === 'string' ? name : { type: 'SYMBOL', name });
		if (listed(inline, base) && !listed(inline, name)) inline.push(typeof inline[0] === 'string' ? name : { type: 'SYMBOL', name });
		return name;
	};
	for (const l of leads) {
		const container = l.list;
		if (!(container in rules)) throw new Error(`bind: lead list '${container}' is no rule of the grammar`);
		const shape = listShape(rules[container]);
		if (shape === undefined || shape.item !== l.item) throw new Error(`bind: lead '${container}.${l.item}' is no separated list of '${l.item}'`);
		const referencers = new Map<string, Set<string>>();
		for (const [name, body] of Object.entries(rules)) for (const ref of symbolNames(body)) (referencers.get(ref) ?? referencers.set(ref, new Set()).get(ref)!).add(name);
		const state: LeadState = { rules, supertypes: supertypesOf({ ...grammar, supertypes: supertypeList }), referencers, mint };
		const head = narrowRef(state, shape.content, l.admits, { keep: true, suffix: l.field }, false);
		if (head === undefined) throw new Error(`bind: lead '${container}.${l.field}' admits no item of '${container}'`);
		const rest = narrowRef(state, shape.content, l.admits, { keep: false, suffix: l.item }, true);
		if (rest === undefined) throw new Error(`bind: lead '${container}.${l.field}' leaves '${container}' no item`);
		const body = unprecedenced(rules[container]) as GrammarRecord;
		const [first, ...others] = body.members as GrammarRecord[];
		const firstField = unprecedenced(first) as GrammarRecord;
		const form = process.env.SITTIR_SCRATCH_LEAD_FORM ?? 'container';
		if (form === 'container') {
			const leading: GrammarRecord = {
				type: 'CHOICE',
				members: [
					{ ...firstField, name: l.field, content: head },
					{ ...firstField, content: rest }
				]
			};
			rules[container] = rewrap(rules[container], { ...body, members: [rewrap(first, leading), ...(replaceItems(others, l.item, shape.content, rest) as unknown[])] });
			continue;
		}
		if (!['two-rules', 'two-rules-repeat', 'two-rules-tail', 'two-rules-plain', 'two-rules-plain-group', 'two-rules-items', 'two-arms'].includes(form)) throw new Error(`bind: SITTIR_SCRATCH_LEAD_FORM '${form}' is no lead form`);
		rules[container] = replaceItems(rules[container], l.item, shape.content, rest);
		const sep = shape.separator;
		const receiver: GrammarRecord = { ...firstField, name: l.field, content: head };
		const step: GrammarRecord = { type: 'SEQ', members: [sep, { ...firstField, content: rest }] };
		const run: GrammarRecord = { type: 'REPEAT1', content: step };
		const runTrailed: GrammarRecord = shape.trailing ? { type: 'SEQ', members: [run, shape.optional(sep)] } : run;
		const alias = (name: string, value: string): GrammarRecord => ({ type: 'ALIAS', named: true, value, content: { type: 'SYMBOL', name } });
		const groupLift = (name: string, groupBody: GrammarRecord): GrammarRecord => {
			rules[name] = { ...groupBody, annotations: { hoisted: true } };
			leadFrom[name] = container;
			return { type: 'SYMBOL', name, metadata: { symbolSource: 'group-lift' } };
		};
		const armOf = { variantOf: `_${undisplayedKindAddress(container)}_${l.field}` };
		let ledRef: GrammarRecord | undefined;
		const receiverForm = (listField: GrammarRecord): GrammarRecord => {
			if (ledRef !== undefined) return ledRef;
			const members =
				form === 'two-rules-repeat'
					? [receiver, { type: 'REPEAT', content: step }, ...(shape.trailing ? [shape.optional(sep)] : [])]
					: form === 'two-rules'
						? [receiver, shape.optional(shape.trailing ? { type: 'CHOICE', members: [sep, runTrailed] } : run)]
						: form === 'two-rules-tail'
							? [receiver, shape.optional({ type: 'CHOICE', members: [sep, { ...listField, content: alias(mint(container, { keep: true, suffix: `${l.field}_tail` }, runTrailed), `${container}_${l.field}_tail`) }] })]
							: form === 'two-rules-plain-group'
								? [receiver, shape.optional(groupLift(`${container}_${l.field}_group`, { type: 'SEQ', members: [sep, shape.optional(listField)] }))]
								: form === 'two-rules-items'
									? [
											receiver,
											shape.optional({
												type: 'CHOICE',
												members: [
													{ ...(sep as GrammarRecord), annotations: armOf },
													{ type: 'FIELD', name: 'items', content: groupLift(`${container}_${l.field}_items`, runTrailed), metadata: { fieldSource: 'enriched' }, annotations: armOf }
												]
											})
										]
									: [receiver, shape.optional({ type: 'SEQ', members: [sep, shape.optional(listField)] })];
			const arms: GrammarRecord = {
				type: 'CHOICE',
				members: [
					{ type: 'SEQ', members: [receiver, shape.optional(sep)], annotations: armOf },
					{ type: 'SEQ', members: [receiver, sep, listField], annotations: armOf }
				]
			};
			ledRef = alias(mint(container, { keep: true, suffix: l.field }, form === 'two-arms' ? arms : { type: 'SEQ', members }), `${container}_${l.field}`);
			return ledRef;
		};
		const led = `_${undisplayedKindAddress(container)}_${l.field}`;
		let edited = 0;
		for (const [name, ruleBody] of Object.entries(rules)) {
			if (name === container || name === led || leadFrom[name] === container) continue;
			const next = rewriteListRefs(ruleBody, container, (field) => ({ ...field, content: { type: 'CHOICE', members: [field.content, receiverForm(field)] } }));
			if (next !== ruleBody) {
				rules[name] = next;
				edited++;
			}
		}
		if (edited === 0) throw new Error(`bind: lead '${container}' sits in no field of another rule`);
	}
	const out: GrammarRecord = { ...grammar, rules, supertypes: supertypeList, inline };
	const scratchConflicts = process.env.SITTIR_SCRATCH_LEAD_CONFLICTS;
	if (scratchConflicts !== undefined) out.conflicts = [...(Array.isArray(grammar.conflicts) ? grammar.conflicts : []), ...(JSON.parse(readFileSync(scratchConflicts, 'utf8')) as string[][]).map((set) => (Array.isArray(grammar.conflicts) && Array.isArray(grammar.conflicts[0]) && typeof grammar.conflicts[0][0] === 'string' ? set : set.map((name) => ({ type: 'SYMBOL', name }))))];
	carryHiddenFacts(grammar, out, (name) => name);
	out.leadFrom = { ...(isRecord(grammar.leadFrom) ? grammar.leadFrom : {}), ...leadFrom };
	return out;
}

export function aliasTargetIssue(grammar: GrammarRecord, from: string, to: string): string | undefined {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	if (from.startsWith('_') !== to.startsWith('_')) return 'flips hiddenness';
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

export function checkBindingPatches(holder: unknown, patches: PatchesConfig | undefined): void {
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
	const out: GrammarRecord = { ...grammar, options: rewriteOwnedSegments(grammar.options, segments) };
	if (aliases.size > 0) out.options = renameOptions(out, (name) => aliases.get(name) ?? name, false);
	carryHiddenFacts(grammar, out, (name) => name);
	return out;
}

export function bindGrammar(grammar: GrammarRecord, grammarBindings: Bindings, effects: readonly BindingEffect[] = []): GrammarRecord {
	const renames = Object.fromEntries((grammarBindings.renames ?? []).map((r) => [r.from, r.to]));
	const renamed = renameGrammar(rewriteBindingOptions(grammar, effects), renames);
	const boundName = (name: string): string => mappedName(renames, name);
	const led = leadGrammar(renamed, (grammarBindings.leads ?? []).map((l) => ({ ...l, list: boundName(l.list) })));
	return splitGrammar(
		led,
		(grammarBindings.splits ?? []).map((s) => ({ ...s, kind: boundName(s.kind), within: s.within.map(boundName) }))
	);
}

export function boundNameOf(renamedFrom: Readonly<Record<string, string>> | undefined): (name: string) => string {
	const bound = new Map(Object.entries(renamedFrom ?? {}).map(([to, from]) => [from, to]));
	return (name) => bound.get(name) ?? name;
}
