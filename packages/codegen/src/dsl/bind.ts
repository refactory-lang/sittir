import { isPreference } from './primitives/preference.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
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

export interface Bindings {
	readonly hash?: string;
	readonly patches?: PatchesConfig;
	readonly renames?: readonly Rename[];
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

export function bindings<const B extends Bindings>(overlay: B): B {
	return overlay;
}

export function rename(from: string, to: string): Rename {
	return { from, to };
}

export function split(kind: string, as: string, placement: Pick<Split, 'within' | 'containers'>): Split {
	return { kind, as, within: placement.within, containers: placement.containers };
}

export type GrammarRecord = Record<string, unknown>;

const LIST_FIELDS = ['supertypes', 'inline', 'factoryInline', 'textTokens', 'protectedRuleNames', 'undeclaredRules'];
const RULE_FIELDS = ['extras', 'externals', 'precedences', 'reserved', 'conflicts'];
const KEYED_FIELDS = ['rules', 'renderAs', 'visibleExternals', 'groups'];

export const isRecord = (value: unknown): value is GrammarRecord => typeof value === 'object' && value !== null && !Array.isArray(value);

function renameValue(value: unknown, rename: (name: string) => string): unknown {
	if (typeof value === 'string') return rename(value);
	if (Array.isArray(value)) return value.map((v) => renameValue(v, rename));
	if (!isRecord(value)) return value;
	const out: GrammarRecord = {};
	for (const [key, v] of Object.entries(value)) {
		if (key === 'type' || key === 'value' || key === 'id') out[key] = v;
		else if (key === 'name' && value.type !== 'SYMBOL' && value.type !== 'FIELD_ALIAS') out[key] = v;
		else out[key] = renameValue(v, rename);
	}
	if (value.type === 'ALIAS' && value.named === true && typeof value.value === 'string') out.value = rename(value.value);
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

export function bindGrammar(grammar: GrammarRecord, overlay: Bindings, effects: readonly BindingEffect[] = []): GrammarRecord {
	const renames = Object.fromEntries((overlay.renames ?? []).map((r) => [r.from, r.to]));
	const renamed = renameGrammar(rewriteBindingOptions(grammar, effects), renames);
	const boundName = (name: string): string => mappedName(renames, name);
	return splitGrammar(
		renamed,
		(overlay.splits ?? []).map((s) => ({ ...s, kind: boundName(s.kind), within: s.within.map(boundName) }))
	);
}

export function boundNameOf(renamedFrom: Readonly<Record<string, string>> | undefined): (name: string) => string {
	const bound = new Map(Object.entries(renamedFrom ?? {}).map(([to, from]) => [from, to]));
	return (name) => bound.get(name) ?? name;
}
