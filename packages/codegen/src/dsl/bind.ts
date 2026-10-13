import { isPreference } from './primitives/preference.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
import type { AnyRule, Rule } from '../types/rule.ts';
import type { RuntimeRule } from '../types/runtime-shapes.ts';
import { undisplayedKindAddress } from './arm-names.ts';
import { fieldedHeadListOf, isParserHiddenName, optionalContentOf, rulesEqual, type RuleListEntry, type SymbolSource } from './rule-patterns.ts';
import { predictedSymbolSourceOf } from './symbol-table.ts';
import { LABELS_KEY } from './wire/options-block.ts';
import { REPARSE_HOST_PRIORITY } from './wire/reparse-hosts.ts';
import type { PatchesConfig } from './wire/wire.ts';

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
	readonly field: string | null;
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

export function lead(list: string, item: string, field: string, ...admits: LeadMatch[]): Lead {
	return { list, item, field, admits };
}

function leadWithin(kind: string, within: readonly LeadMatch[] | Readonly<Record<string, readonly LeadMatch[]>>): LeadWithin {
	if (Array.isArray(within)) return { field: null, admits: within };
	const entries = Object.entries(within as Readonly<Record<string, readonly LeadMatch[]>>);
	const [entry] = entries;
	if (entry === undefined || entries.length > 1) throw new Error(`bind: match '${kind}' restricts one field, not ${entries.length}`);
	return { field: entry[0], admits: entry[1] };
}

export function match(kind: string, within?: readonly LeadMatch[] | Readonly<Record<string, readonly LeadMatch[]>>, as?: string): LeadMatch {
	return { kind, ...(within === undefined ? {} : { within: leadWithin(kind, within) }), ...(as === undefined ? {} : { as }) };
}

export function split(kind: string, as: string, placement: Pick<Split, 'within' | 'containers'>): Split {
	return { kind, as, within: placement.within, containers: placement.containers };
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
		if (isParserHiddenName(from) !== isParserHiddenName(to)) throw new Error(`bind: '${from}' → '${to}' flips hiddenness`);
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
			if (isParserHiddenName(ref) && ref in rules && !stop.has(ref) && !out.has(ref)) {
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

const listEntryName = (entry: unknown): string | undefined => (typeof entry === 'string' ? entry : isRecord(entry) && typeof entry.name === 'string' ? entry.name : undefined);

interface MintLists {
	readonly supertypes: unknown[];
	readonly inline: unknown[];
	readonly enlist: (base: string, name: string) => void;
}

function mintLists(grammar: GrammarRecord): MintLists {
	const supertypes = (Array.isArray(grammar.supertypes) ? grammar.supertypes : []).slice();
	const inline = (Array.isArray(grammar.inline) ? grammar.inline : []).slice();
	const listed = (list: unknown[], name: string): boolean => list.some((entry) => listEntryName(entry) === name);
	const enlist = (base: string, name: string): void => {
		for (const list of [supertypes, inline]) if (listed(list, base) && !listed(list, name)) list.push(typeof list[0] === 'string' ? name : { type: 'SYMBOL', name });
	};
	return { supertypes, inline, enlist };
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
	return out;
}

export class LeadRefusal extends Error {
	readonly reason: string;
	constructor(reason: string, lead?: Lead) {
		super(lead === undefined ? reason : `bind: lead '${lead.list}.${lead.field}': ${reason}`);
		this.reason = reason;
	}
}

interface LeadSide {
	readonly lead: boolean;
	readonly suffix: string;
}

interface LeadEdit {
	readonly rules: GrammarRecord;
	readonly supertypes: ReadonlySet<string>;
	readonly sites: ReadonlyMap<string, number>;
	readonly positions: ItemPositions;
	readonly heldBy: ReadonlyMap<string, string>;
	readonly reach: Set<string>;
	readonly mint: (base: string, side: LeadSide, body: unknown) => string;
}

function rewrap(original: unknown, inner: unknown): unknown {
	return isRecord(original) && isPrecWrapper(original as { type: string }) ? { ...original, content: rewrap(original.content, inner) } : inner;
}

function refRule(ref: unknown): string | undefined {
	const node = unprecedenced(ref);
	if (!isRecord(node)) return undefined;
	if (node.type === 'SYMBOL' && typeof node.name === 'string') return node.name;
	return node.type === 'ALIAS' ? refRule(node.content) : undefined;
}

function refKind(ref: unknown): string | undefined {
	const node = unprecedenced(ref);
	if (!isRecord(node)) return undefined;
	if (node.type === 'ALIAS' && node.named === true && typeof node.value === 'string') return node.value;
	return node.type === 'SYMBOL' && typeof node.name === 'string' && !isParserHiddenName(node.name) ? node.name : undefined;
}

const aliasOf = (name: string, value: string): GrammarRecord => ({ type: 'ALIAS', content: { type: 'SYMBOL', name }, named: true, value });

function renamedKind(ref: unknown, value: string): unknown {
	const node = unprecedenced(ref);
	return rewrap(ref, isRecord(node) && node.type === 'ALIAS' ? { ...node, value } : { type: 'ALIAS', content: node, named: true, value });
}

const exclusiveTo = (edit: LeadEdit, name: string, exclusive: boolean): boolean => exclusive && (edit.sites.get(name) ?? 0) <= 1;

const isDescended = (edit: LeadEdit, name: string): boolean => isParserHiddenName(name) && !edit.supertypes.has(name) && name in edit.rules;

function narrowRef(edit: LeadEdit, ref: unknown, admits: readonly LeadMatch[], side: LeadSide, exclusive: boolean): unknown {
	const kind = refKind(ref);
	if (kind !== undefined) {
		const matches = admits.filter((m) => m.kind === kind);
		if (matches.length > 1) throw new LeadRefusal(`it admits '${kind}' twice`);
		const [admitted] = matches;
		if (admitted === undefined) return side.lead ? undefined : ref;
		if (admitted.within === undefined) return side.lead ? (admitted.as === undefined ? ref : renamedKind(ref, admitted.as)) : undefined;
		const name = refRule(ref);
		if (name === undefined) throw new LeadRefusal(`'${kind}' has no rule to narrow`);
		const inPlace = !side.lead && (!isParserHiddenName(name) || exclusiveTo(edit, name, exclusive));
		edit.reach.add(name);
		const body = narrowWithin(edit, kind, edit.rules[name], admitted.within, side, inPlace);
		if (side.lead) return aliasOf(edit.mint(name, side, body), admitted.as ?? `${kind}_${side.suffix}`);
		if (inPlace && !isParserHiddenName(name)) {
			const count = edit.positions.counts.get(name) ?? 0;
			const holders = [...(edit.positions.holders.get(name) ?? [])].sort();
			if (count > 1) throw new LeadRefusal(`'${kind}' narrows in place, but the item holds it at ${count} positions (in ${holders.join(', ')})`);
		}
		if (inPlace) {
			narrowInPlace(edit, name, body);
			return ref;
		}
		const clone = edit.mint(name, side, body);
		return replaceSymbols(ref, (ref) => (ref === name ? clone : ref));
	}
	const node = unprecedenced(ref);
	if (isRecord(node) && node.type === 'CHOICE' && Array.isArray(node.members)) {
		const members: readonly unknown[] = node.members;
		const arms = members.map((arm) => narrowRef(edit, arm, admits, side, exclusive)).filter((arm) => arm !== undefined);
		if (arms.length === 0) return undefined;
		if (arms.length === members.length && arms.every((arm, i) => arm === members[i])) return ref;
		return arms.length === 1 ? arms[0] : rewrap(ref, { ...node, members: arms });
	}
	const name = refRule(ref);
	if (isRecord(node) && node.type === 'SYMBOL' && name !== undefined && isDescended(edit, name)) {
		const inPlace = !side.lead && exclusiveTo(edit, name, exclusive);
		edit.reach.add(name);
		const narrowed = narrowRef(edit, edit.rules[name], admits, side, inPlace);
		if (narrowed === undefined || narrowed === edit.rules[name]) return narrowed === undefined ? undefined : ref;
		if (refRule(narrowed) !== undefined) return narrowed;
		if (inPlace) {
			narrowInPlace(edit, name, narrowed);
			return ref;
		}
		return rewrap(ref, { ...node, name: edit.mint(name, side, narrowed) });
	}
	const inside = admittedInside(edit, ref, new Set(admits.map((m) => m.kind)));
	if (inside !== undefined) throw new LeadRefusal(`'${inside}' sits where the split cannot divide it`);
	return side.lead ? undefined : ref;
}

function admittedInside(edit: LeadEdit, rule: unknown, admitted: ReadonlySet<string>, path: readonly string[] = []): string | undefined {
	if (Array.isArray(rule)) return rule.map((r) => admittedInside(edit, r, admitted, path)).find((kind) => kind !== undefined);
	if (!isRecord(rule)) return undefined;
	const kind = refKind(rule);
	if (kind !== undefined) return admitted.has(kind) ? kind : undefined;
	if (rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN') return undefined;
	if (rule.type === 'SYMBOL') {
		const name = rule.name as string;
		return name in edit.rules && !path.includes(name) ? admittedInside(edit, edit.rules[name], admitted, [...path, name]) : undefined;
	}
	return admittedInside(edit, rule.members, admitted, path) ?? admittedInside(edit, rule.content, admitted, path);
}

function narrowWithin(edit: LeadEdit, kind: string, body: unknown, within: LeadWithin, side: LeadSide, exclusive: boolean): unknown {
	const admitted = new Set(within.admits.map((m) => m.kind));
	const position = within.field === null ? 'an unfielded child' : `field '${within.field}'`;
	const isTarget = (node: GrammarRecord): boolean =>
		within.field === null
			? node.type === 'CHOICE' && Array.isArray(node.members) && node.members.some((arm) => admitted.has(refKind(arm) ?? ''))
			: node.type === 'FIELD' && node.name === within.field;
	const positionsIn = (node: unknown, path: readonly string[] = [], repeated = false): boolean[] => {
		if (Array.isArray(node)) return node.flatMap((n) => positionsIn(n, path, repeated));
		if (!isRecord(node)) return [];
		if (isTarget(node)) return [repeated];
		if (OPAQUE_RULES.has(node.type) || node.type === 'ALIAS') return [];
		if (node.type === 'SYMBOL') {
			const name = node.name as string;
			if (!isDescended(edit, name) || path.includes(name)) return [];
			return positionsIn(edit.rules[name], [...path, name], repeated);
		}
		const under = repeated || node.type === 'REPEAT' || node.type === 'REPEAT1';
		return [...positionsIn(node.members, path, under), ...positionsIn(node.content, path, under)];
	};
	const holds = (node: unknown): boolean => positionsIn(node).length > 0;
	const found = positionsIn(body);
	if (found.length === 0) throw new LeadRefusal(`the restriction of ${position} names no position in '${kind}'`);
	if (found.length > 1) throw new LeadRefusal(`the restriction of ${position} names ${found.length} positions in '${kind}'`);
	if (found[0] === true) throw new LeadRefusal(`the restriction of ${position} sits under a repeat in '${kind}'`);
	const visit = (node: unknown): unknown => {
		if (Array.isArray(node)) {
			const out = node.map(visit);
			return out.every((n, i) => n === node[i]) ? node : out;
		}
		if (!isRecord(node)) return node;
		if (isTarget(node)) {
			const narrowed = narrowRef(edit, node.type === 'FIELD' ? node.content : node, within.admits, side, exclusive);
			if (narrowed === undefined) throw new LeadRefusal(`it leaves ${position} of '${kind}' empty`);
			if (node.type !== 'FIELD') return narrowed;
			return narrowed === node.content ? node : { ...node, content: narrowed };
		}
		if (OPAQUE_RULES.has(node.type) || node.type === 'ALIAS') return node;
		if (side.lead) {
			const optional = optionalContentOf(node as { readonly type: string });
			if (optional !== undefined && holds(optional)) return visit(optional);
			const arm = node.type === 'CHOICE' && Array.isArray(node.members) ? node.members.find(holds) : undefined;
			if (arm !== undefined) return visit(arm);
		}
		if (node.type === 'SYMBOL') {
			const name = node.name as string;
			if (!holds(node)) return node;
			const inPlace = !side.lead && exclusiveTo(edit, name, exclusive);
			edit.reach.add(name);
			const inner = narrowWithin(edit, kind, edit.rules[name], within, side, inPlace);
			if (inner === edit.rules[name]) return node;
			if (inPlace) {
				narrowInPlace(edit, name, inner);
				return node;
			}
			return { ...node, name: edit.mint(name, side, inner) };
		}
		const members = node.members === undefined ? undefined : visit(node.members);
		const content = node.content === undefined ? undefined : visit(node.content);
		if (members === node.members && content === node.content) return node;
		return { ...node, ...(members === undefined ? {} : { members }), ...(content === undefined ? {} : { content }) };
	};
	return visit(body);
}

function optionalSpelling(rule: unknown): (content: unknown) => GrammarRecord {
	const find = (node: unknown): GrammarRecord | undefined => {
		if (Array.isArray(node)) return node.map(find).find((found) => found !== undefined);
		if (!isRecord(node)) return undefined;
		if (optionalContentOf(node as { readonly type: string }) !== undefined) return node;
		return find(node.members) ?? find(node.content);
	};
	return find(rule)?.type === 'OPTIONAL' ? (content) => ({ type: 'OPTIONAL', content }) : (content) => ({ type: 'CHOICE', members: [content, { type: 'BLANK' }] });
}

function replaceItems(rule: unknown, item: string, from: unknown, to: unknown): unknown {
	if (Array.isArray(rule)) return rule.map((r) => replaceItems(r, item, from, to));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'FIELD' && rule.name === item && rulesEqual(rule.content as RuntimeRule, from as RuntimeRule)) return { ...rule, content: to };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = key === 'members' || key === 'content' ? replaceItems(value, item, from, to) : value;
	return out;
}

function listSites(rule: unknown, list: string, owner: string, out: GrammarRecord[] = []): GrammarRecord[] {
	if (Array.isArray(rule)) for (const r of rule) listSites(r, list, owner, out);
	else if (isRecord(rule)) {
		if (rule.type === 'FIELD' && refRule(rule.content) === list) out.push(rule);
		else if (rule.type === 'SYMBOL' && rule.name === list) throw new LeadRefusal(`'${owner}' holds the list other than as a field's content`);
		else {
			listSites(rule.members, list, owner, out);
			listSites(rule.content, list, owner, out);
		}
	}
	return out;
}

function withReceiverForm(rule: unknown, list: string, receiverForm: GrammarRecord): unknown {
	if (Array.isArray(rule)) return rule.map((r) => withReceiverForm(r, list, receiverForm));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'FIELD' && refRule(rule.content) === list) return { ...rule, content: { type: 'CHOICE', members: [rule.content, receiverForm] } };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = key === 'members' || key === 'content' ? withReceiverForm(value, list, receiverForm) : value;
	return out;
}

function leadSymbols(grammar: GrammarRecord, rules: GrammarRecord, supertypes: ReadonlySet<string>): SymbolSource {
	const entries = (key: string): RuleListEntry[] => (Array.isArray(grammar[key]) ? (grammar[key] as RuleListEntry[]) : []);
	return predictedSymbolSourceOf({
		rules: rules as Record<string, AnyRule>,
		extras: entries('extras'),
		externals: entries('externals'),
		supertypes: [...supertypes],
		inline: entries('inline').flatMap((entry) => listEntryName(entry) ?? []),
		word: typeof grammar.word === 'string' ? grammar.word : null
	});
}

function countSymbols(rule: unknown, sites: Map<string, number> = new Map()): Map<string, number> {
	if (Array.isArray(rule)) for (const r of rule) countSymbols(r, sites);
	else if (isRecord(rule)) {
		if (rule.type === 'SYMBOL' && typeof rule.name === 'string') sites.set(rule.name, (sites.get(rule.name) ?? 0) + 1);
		for (const value of Object.values(rule)) countSymbols(value, sites);
	}
	return sites;
}

function referenceSites(rules: GrammarRecord, list: string, listParts: readonly unknown[]): Map<string, number> {
	const sites = new Map<string, number>();
	for (const [name, body] of Object.entries(rules)) if (name !== list) countSymbols(body, sites);
	countSymbols(listParts, sites);
	return sites;
}

interface ItemPositions {
	readonly counts: ReadonlyMap<string, number>;
	readonly holders: ReadonlyMap<string, ReadonlySet<string>>;
}

const NO_POSITIONS: ItemPositions = { counts: new Map(), holders: new Map() };

function itemPositions(item: unknown, rules: GrammarRecord, reach: ReadonlySet<string>): ItemPositions {
	const counts = new Map<string, number>();
	const holders = new Map<string, Set<string>>();
	const expands = (name: string): boolean => name in rules && (reach.has(name) || isParserHiddenName(name));
	const walk = (node: unknown, path: readonly string[], holder: string): void => {
		if (Array.isArray(node)) for (const n of node) walk(n, path, holder);
		else if (isRecord(node)) {
			if (node.type === 'SYMBOL' && typeof node.name === 'string') {
				const name = node.name;
				counts.set(name, (counts.get(name) ?? 0) + 1);
				(holders.get(name) ?? holders.set(name, new Set()).get(name)!).add(holder);
				if (expands(name) && !path.includes(name)) walk(rules[name], [...path, name], name);
				return;
			}
			walk(node.members, path, holder);
			walk(node.content, path, holder);
		}
	};
	walk(item, [], 'the list item');
	return { counts, holders };
}

function narrowInPlace(edit: LeadEdit, name: string, body: unknown): void {
	const holder = edit.heldBy.get(name);
	if (holder !== undefined) throw new LeadRefusal(`'${name}' narrows in place, but the lead on '${holder}' holds it in its item`);
	edit.rules[name] = body;
}

export function leadGrammar(grammar: GrammarRecord, leads: readonly Lead[]): GrammarRecord {
	if (leads.length === 0) return grammar;
	const rules: GrammarRecord = { ...(isRecord(grammar.rules) ? grammar.rules : {}) };
	const { supertypes, inline, enlist } = mintLists(grammar);
	const leadFrom: Record<string, string> = {};
	const mint = (base: string, side: LeadSide, body: unknown): string => {
		const name = `_${undisplayedKindAddress(base)}_${side.suffix}`;
		if (name in rules) {
			if (leadFrom[name] !== base) throw new LeadRefusal(`'${base}' mints '${name}', which the grammar already names`);
			if (!rulesEqual(rules[name] as RuntimeRule, body as RuntimeRule)) throw new LeadRefusal(`'${base}' narrows two ways to '${name}'`);
			return name;
		}
		rules[name] = body;
		leadFrom[name] = base;
		enlist(base, name);
		return name;
	};
	const stop = supertypesOf(grammar);
	const heldBy = new Map<string, string>();
	const edit = ({ list, item, field, admits }: Lead): void => {
		if (!(list in rules)) throw new LeadRefusal('the list is no rule of the grammar');
		const shape = fieldedHeadListOf(rules[list] as Rule<'normalize'>, leadSymbols(grammar, rules, stop));
		if (shape === null || shape.elementName !== item) throw new LeadRefusal(`the list is no separated list of field '${item}'`);
		if (shape.leading !== undefined) throw new LeadRefusal('the list takes a leading separator');
		if (shape.trailing === 'mandatory') throw new LeadRefusal('the list takes a mandatory trailing separator');
		const element = shape.element as unknown as GrammarRecord;
		const reach = new Set<string>();
		const head = narrowRef({ rules, supertypes: stop, sites: new Map(), positions: NO_POSITIONS, heldBy, reach, mint }, element.content, admits, { lead: true, suffix: field }, false);
		if (head === undefined) throw new LeadRefusal('it admits no item of the list');
		const positions = itemPositions(element.content, rules, reach);
		const rest = narrowRef({ rules, supertypes: stop, sites: referenceSites(rules, list, [element.content, shape.separatorRule]), positions, heldBy, reach, mint }, element.content, admits, { lead: false, suffix: item }, true);
		if (rest === undefined) throw new LeadRefusal('it leaves the list no item');
		if (rest !== element.content) rules[list] = replaceItems(rules[list], item, element.content, rest);
		const owners = Object.keys(rules).filter((name) => name !== list && leadFrom[name] === undefined);
		const sites = owners.flatMap((owner) => listSites(rules[owner], list, owner));
		const fields = [...new Set(sites.map((site) => site.name as string))].sort();
		if (fields.length !== 1) throw new LeadRefusal(fields.length === 0 ? 'the list sits in no field of another rule' : `the list sits in fields ${fields.join(', ')}`);
		const optional = optionalSpelling(rules[list]);
		const body = { type: 'SEQ', members: [{ ...element, name: field, content: head }, optional({ type: 'SEQ', members: [shape.separatorRule, shape.trailing === undefined ? sites[0] : optional(sites[0])] })] };
		const receiverForm = aliasOf(mint(list, { lead: true, suffix: field }, body), `${list}_${field}`);
		for (const owner of owners) rules[owner] = withReceiverForm(rules[owner], list, receiverForm);
		for (const name of positions.counts.keys()) if (!heldBy.has(name)) heldBy.set(name, list);
	};
	for (const l of leads) {
		try {
			edit(l);
		} catch (error) {
			throw error instanceof LeadRefusal ? new LeadRefusal(error.reason, l) : error;
		}
	}
	const out: GrammarRecord = { ...grammar, rules, supertypes, inline };
	carryHiddenFacts(grammar, out, (name) => name);
	out.leadFrom = { ...(isRecord(grammar.leadFrom) ? grammar.leadFrom : {}), ...leadFrom };
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
	return splitGrammar(
		renamed,
		(grammarBindings.splits ?? []).map((s) => ({ ...s, kind: boundName(s.kind), within: s.within.map(boundName) }))
	);
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

export function boundNameOf(renamedFrom: Readonly<Record<string, string>> | undefined): (name: string) => string {
	const bound = new Map(Object.entries(renamedFrom ?? {}).map(([to, from]) => [from, to]));
	return (name) => bound.get(name) ?? name;
}
