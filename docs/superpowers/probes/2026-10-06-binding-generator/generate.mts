/**
 * Prototype of the binding generator: reads a grammar's bindings.scm and slot model and writes
 * out/<grammar>.vocab.ts, the grammar's live views (read) and build entries (build), typed against
 * the vocabulary interfaces in packages/types/src/vocabulary. See README.md and spec.md.
 *
 *   SITTIR_ROOT=<checkout with fresh natives> pnpm exec tsx generate.mts [grammar]
 *
 * Run it with the checkout as the working directory. It prints what it emitted and what it skipped.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.SITTIR_ROOT ?? join(HERE, '..', '..', '..', '..');
const GRAMMAR = process.argv[2] ?? 'rust';
const OUT_DIR = join(HERE, 'out');

interface SlotSelector {
	readonly field: string | null;
	readonly kind: string | null;
	readonly after: SlotSelector | null;
}
interface ModelSlot {
	readonly name: string;
	readonly propertyName: string;
	readonly required: boolean;
	readonly multiple: boolean;
	readonly storage: string;
	readonly kinds: readonly string[];
	readonly terminals: readonly string[];
}
interface ModelNode {
	readonly kind: string;
	readonly modelType: string;
	readonly slots: readonly ModelSlot[];
	readonly subtypes: readonly string[];
	readonly elementKinds: readonly string[];
	readonly enumValues: readonly string[];
	readonly pattern: string | null;
}
interface ClaimFact {
	readonly vocab: string;
	readonly kind: string | null;
	readonly predicate: boolean;
	readonly toplevel: boolean;
	readonly within: readonly string[];
	readonly fieldLiterals: Readonly<Record<string, string>>;
	readonly tokens: readonly string[];
}
type MemberFact =
	| ({ readonly route: 'rename'; readonly owner: string; readonly name: string } & SlotSelector)
	| { readonly route: 'presence'; readonly owner: string; readonly name: string; readonly via: readonly string[] }
	| ({
			readonly route: 'nested';
			readonly owner: string;
			readonly name: string;
			readonly parent: string;
			readonly multiple: boolean;
			readonly via: readonly string[];
	  } & SlotSelector);
interface ContainerFact {
	readonly kind: string;
	readonly element: SlotSelector;
}
interface GrammarInput {
	readonly grammar: string;
	readonly bindings: {
		readonly claims: readonly ClaimFact[];
		readonly members: readonly MemberFact[];
		readonly containers: readonly ContainerFact[];
		readonly unclaimed: readonly { readonly kind: string }[];
	};
	readonly model: ReadonlyMap<string, ModelNode>;
	readonly textTokens: ReadonlySet<string>;
	readonly layoutSlots: readonly { readonly kind: string | null; readonly slot: string }[];
}
interface RawValue {
	readonly kind: string;
	readonly value?: string;
	readonly parseKind?: string;
}
interface RawNode {
	readonly kind: string;
	readonly modelType?: string;
	readonly typeName?: string;
	readonly factoryName?: string;
	readonly text?: string;
	readonly slots?: readonly { readonly name: string; readonly paramName?: string; readonly values?: readonly RawValue[] }[];
}

const { loadInputs } = (await import(join(ROOT, 'packages/tools/src/inventory/index.ts'))) as {
	loadInputs: (g: readonly string[]) => Promise<GrammarInput[]>;
};
const { camel, tsname } = (await import(join(ROOT, 'packages/tools/src/inventory/derive.ts'))) as {
	camel: (s: string) => string;
	tsname: (s: string) => string;
};
const { readNodeModelFile } = (await import(join(ROOT, 'packages/tools/src/validate/common.ts'))) as {
	readNodeModelFile: (g: string) => string | undefined;
};
const { TSKindId } = (await import(join(ROOT, `packages/${GRAMMAR}/src/types.ts`))) as {
	TSKindId: Record<string, number | string>;
};

const [input] = await loadInputs([GRAMMAR]);
// The members each vocabulary interface declares, inherited ones included, read from the vocabulary's
// own files: each interface's `readonly` members and its `SubKindOf<Parent>`, by namespace nesting.
const VOCAB_FILES = process.env.VOCAB_DIR ?? join(ROOT, 'packages/types/src/vocabulary');
const declared = new Map<string, { readonly path: string; readonly members: Set<string>; readonly parent: string | undefined }>();
for (const file of readdirSync(VOCAB_FILES).filter((f) => f.endsWith('.ts'))) {
	const stack: { name: string; indent: number }[] = [];
	let open: { tsName: string; indent: number; path: string; members: Set<string>; parent: string | undefined } | undefined;
	for (const line of readFileSync(join(VOCAB_FILES, file), 'utf8').split('\n')) {
		const indent = line.length - line.trimStart().length;
		if (open !== undefined) {
			if (indent === open.indent && line.trim() === '}') {
				declared.set(open.tsName, { path: open.path, members: open.members, parent: open.parent });
				open = undefined;
				continue;
			}
			const kind = /^readonly kind: '([a-z_.]+)'/.exec(line.trim());
			if (indent === open.indent + 1 && kind?.[1] !== undefined) open.path = kind[1];
			const member = /^readonly ([A-Za-z_$][\w$]*)\??:/.exec(line.trim());
			if (indent === open.indent + 1 && member?.[1] !== undefined && member[1] !== 'kind') open.members.add(member[1]);
			continue;
		}
		const ns = /^export namespace (\w+) \{/.exec(line.trim());
		if (ns?.[1] !== undefined) {
			stack.push({ name: ns[1], indent });
			continue;
		}
		const iface = /^export interface (\w+)<G[^>]*>(?: extends Simplify<SubKindOf<V\.([\w.]+)<G>>>)? \{/.exec(line.trim());
		if (iface?.[1] !== undefined) {
			open = { tsName: [...stack.map((s) => s.name), iface[1]].join('.'), indent, path: '', members: new Set(), parent: iface[2] };
			continue;
		}
		if (line.trim() === '}' && stack.length > 0 && stack[stack.length - 1]!.indent === indent) stack.pop();
	}
}
const declaredByPath = new Map([...declared.values()].map((d) => [d.path, d]));
const interfaceMembers = (path: string): string[] => {
	const names = new Set<string>();
	for (let d = declaredByPath.get(path); d !== undefined; d = d.parent ? declared.get(d.parent) : undefined) for (const m of d.members) names.add(m);
	return [...names];
};
if (input === undefined) throw new Error(`no inputs for ${GRAMMAR}`);
const rawJson = JSON.parse(readNodeModelFile(GRAMMAR) ?? 'null') as { nodes: RawNode[] | Record<string, RawNode> };
const rawNodes: readonly RawNode[] = Array.isArray(rawJson.nodes) ? rawJson.nodes : Object.values(rawJson.nodes);
const rawOf = new Map(rawNodes.map((n) => [n.kind, n]));
const facts = input.bindings;
const model = input.model;
const unclaimed = new Set(facts.unclaimed.map((u) => u.kind));

// ---------------------------------------------------------------------------------------------
// Names: the vocabulary's interface for a path, a grammar kind's typed-surface names and kind id.

const interfaceOf = (path: string): string => `V.${path.split('.').map(tsname).join('.')}<Ctx>`;
const typeNameOf = (kind: string): string | undefined => rawOf.get(kind)?.typeName;
const kindIdRef = (kind: string): string | undefined => {
	const name = typeNameOf(kind) ?? tsname(kind.replace(/^_+/, ''));
	return typeof TSKindId[name] === 'number' ? `TSKindId.${name}` : undefined;
};
const modelNode = (kind: string): ModelNode | undefined => model.get(kind) ?? model.get(`_${kind}`);
const quote = (s: string): string => JSON.stringify(s).replace(/'/g, "\\'").replace(/^"|"$/g, "'");

// Token texts: every terminal a slot holds, by the kind that parses it.
const tokenText = new Map<string, string>();
for (const n of rawNodes) {
	if ((n.modelType === 'keyword' || n.modelType === 'punctuation') && n.text !== undefined) tokenText.set(n.kind, n.text);
	for (const s of n.slots ?? [])
		for (const v of s.values ?? [])
			if (v.kind === 'terminal' && v.value !== undefined && v.parseKind !== undefined) tokenText.set(v.parseKind, v.value);
}
const tokenKindOfText = (slotOwner: string, slotName: string, text: string): string | undefined =>
	rawOf
		.get(slotOwner)
		?.slots?.find((s) => s.name === slotName)
		?.values?.find((v) => v.kind === 'terminal' && v.value === text)?.parseKind;

// ---------------------------------------------------------------------------------------------
// The inventory's slot rules, restated (the real generator shares them with derive; see spec §4).

function slotFor(slots: readonly ModelSlot[], n: SlotSelector): ModelSlot | undefined {
	if (n.field !== null) return slots.find((s) => s.name === n.field || s.propertyName === camel(n.field ?? ''));
	if (n.kind !== null) return slots.find((s) => s.kinds.includes(n.kind ?? ''));
	const previous = n.after === null ? undefined : slotFor(slots, n.after);
	return slots
		.slice(previous === undefined ? 0 : slots.indexOf(previous) + 1)
		.find((s) => s.storage !== 'boolean' && s.kinds.length > 0);
}
const isLayout = (owner: string, slot: ModelSlot): boolean =>
	input.layoutSlots.some((l) => (l.kind === null || l.kind === owner) && l.slot === slot.name) ||
	(slot.kinds.length > 0 && slot.terminals.length === 0 && slot.kinds.every((k) => unclaimed.has(k)));
const memberNameOf = (renames: ReadonlyMap<string, string>, slot: ModelSlot): string =>
	camel(renames.get(slot.name) ?? slot.propertyName.replace(/_$/, '').replace(/Modifier$/, ''));
const TRANSPARENT = new Set(['envelope', 'alias', 'polymorph']);
function containerElement(node: ModelNode): { slot: ModelSlot } | { list: true } | null {
	const declared = facts.containers.find((c) => c.kind === node.kind);
	if (declared === undefined && node.modelType === 'list') return { list: true };
	const content = node.slots.filter((s) => !isLayout(node.kind, s));
	const slot = declared
		? slotFor(node.slots, declared.element)
		: TRANSPARENT.has(node.modelType) && content.length === 1
			? content[0]
			: undefined;
	return slot !== undefined && slot.storage !== 'boolean' && slot.kinds.length > 0 ? { slot } : null;
}

// ---------------------------------------------------------------------------------------------
// Read entries: per grammar kind, the vocabulary kinds it can be, most specific first.

interface Entry {
	readonly kind: string;
	readonly vocab: string;
	readonly literals: readonly (readonly [slot: string, text: string])[];
	readonly claim: ClaimFact;
}
const entriesOf = new Map<string, Entry[]>();
for (const claim of facts.claims) {
	if (claim.kind === null) continue;
	const node = modelNode(claim.kind);
	const literals: [string, string][] = Object.entries(claim.fieldLiterals).map(([f, t]) => [
		node?.slots.find((s) => s.name === f)?.name ?? f,
		t
	]);
	for (const text of claim.tokens) {
		const pinned = node?.slots.find((s) => s.terminals.includes(text));
		if (pinned && !literals.some(([f]) => f === pinned.name)) literals.push([pinned.name, text]);
	}
	const list = entriesOf.get(claim.kind) ?? entriesOf.set(claim.kind, []).get(claim.kind)!;
	list.push({ kind: claim.kind, vocab: claim.vocab, literals, claim });
}
for (const list of entriesOf.values())
	list.sort(
		(a, b) =>
			Number(b.claim.predicate) - Number(a.claim.predicate) ||
			b.claim.within.length - a.claim.within.length ||
			b.literals.length - a.literals.length
	);
const plainVocabOf = (kind: string): string | undefined =>
	entriesOf.get(kind)?.find((e) => e.literals.length === 0 && e.claim.toplevel && !e.claim.predicate)?.vocab;
const runtimeEntry = (e: Entry): boolean => e.claim.toplevel && !e.claim.predicate;

// ---------------------------------------------------------------------------------------------
// Member routes: what each view reads, as typed-surface reader calls.

type Member =
	| { readonly name: string; readonly route: 'slot'; readonly slot: ModelSlot }
	| { readonly name: string; readonly route: 'presence'; readonly via: readonly string[]; readonly token: string }
	| {
			readonly name: string;
			readonly route: 'nested';
			readonly via: readonly string[];
			readonly parent: string;
			readonly selector: SlotSelector;
	  };
const skipped: string[] = [];

function membersOf(kind: string): Member[] {
	const node = modelNode(kind);
	if (node === undefined) return [];
	const own = facts.members.filter((m) => m.owner === kind);
	const renames = new Map<string, string>();
	for (const m of own)
		if (m.route === 'rename') {
			const slot = slotFor(node.slots, m);
			if (slot !== undefined) renames.set(slot.name, m.name);
		}
	const deep = own.filter((m): m is Exclude<MemberFact, { readonly route: 'rename' }> => m.route !== 'rename');
	const via = new Set(deep.flatMap((d) => d.via));
	const out: Member[] = [];
	for (const slot of node.slots) {
		if (isLayout(kind, slot) || slot.kinds.some((k) => via.has(k))) continue;
		out.push({ name: memberNameOf(renames, slot), route: 'slot', slot });
	}
	for (const d of deep) {
		if (d.route === 'presence') out.push({ name: camel(d.name), route: 'presence', via: d.via, token: d.name });
		else out.push({ name: camel(d.name), route: 'nested', via: d.via, parent: d.parent, selector: d });
	}
	return out;
}

/** The chain of optional reader calls from `this.$core` through the kinds in `via`, or undefined. */
function viaChain(owner: string, via: readonly string[]): { expr: string; at: ModelNode } | undefined {
	let expr = 'this.$core';
	let at = modelNode(owner);
	for (const step of via) {
		const slot = at?.slots.find((s) => s.kinds.includes(step));
		const next = modelNode(step);
		if (slot === undefined || next === undefined || slot.multiple) return undefined;
		expr = `${expr}${expr === 'this.$core' ? '.' : '?.'}${slot.propertyName}()`;
		at = next;
	}
	return at === undefined ? undefined : { expr, at };
}

/** Which reader a slot's values go through: a slot that admits a claimed enum reads its tokens as
 * that enum's view, any other slot reads a token as its text. The same kind id is both. */
const viewerOf = (kinds: readonly string[]): string =>
	kinds.some((k) => concreteKinds(k).some((c) => isEnum(c) && entriesOf.has(c))) ? 'viewEnum' : 'view';

function getterOf(owner: string, m: Member): string | undefined {
	switch (m.route) {
		case 'slot': {
			const call = `this.$core.${m.slot.propertyName}()`;
			const viewer = viewerOf(m.slot.kinds);
			if (m.slot.storage === 'boolean') return `return ${call};`;
			if (m.slot.multiple) return `return ${call}.map((x) => ${viewer}(x));`;
			return `return ${viewer}(${call});`;
		}
		case 'presence': {
			const chain = viaChain(owner, m.via);
			const slot = chain?.at.slots.find((s) => s.terminals.includes(m.token));
			const tokenKind = chain && slot ? tokenKindOfText(chain.at.kind, slot.name, m.token) : undefined;
			const id = tokenKind ? kindIdRef(tokenKind) : undefined;
			if (!chain || !slot || !id) return undefined;
			const read = `${chain.expr}${chain.expr === 'this.$core' ? '.' : '?.'}${slot.propertyName}()`;
			return slot.multiple ? `return ${read}.includes(${id}) ?? false;` : `return ${read} === ${id};`;
		}
		case 'nested': {
			const chain = viaChain(owner, m.via);
			const slot = chain ? slotFor(chain.at.slots, m.selector) : undefined;
			if (!chain || !slot) return undefined;
			const read = `${chain.expr}${chain.expr === 'this.$core' ? '.' : '?.'}${slot.propertyName}()`;
			const target = m.selector.kind;
			const id = target !== null ? kindIdRef(target) : undefined;
			const typeName = target !== null ? typeNameOf(target) : undefined;
			if (slot.multiple && id && typeName)
				return `return view(${read}.find((x): x is T.${typeName}.Parsed => typeof x === 'object' && x.$type === ${id}));`;
			return slot.multiple ? undefined : `return ${viewerOf(slot.kinds)}(${read});`;
		}
	}
}

// ---------------------------------------------------------------------------------------------
// Emit.

const lines: string[] = [];
const emit = (s = ''): void => void lines.push(s);
const relAbs = (p: string): string => {
	const r = relative(OUT_DIR, p);
	return r.startsWith('.') ? r : `./${r}`;
};
const rel = (p: string): string => relAbs(join(ROOT, p));
const VOCAB_DIR = process.env.VOCAB_DIR ?? join(ROOT, 'packages/types/src/vocabulary');
emit(`// Generated by docs/superpowers/probes/2026-10-06-binding-generator/generate.mts from packages/${GRAMMAR}/bindings.scm. Do not edit.`);
emit(`import type * as V from '${relAbs(join(VOCAB_DIR, 'index.ts'))}';`);
emit(`import type { GrammarContext } from '${relAbs(join(VOCAB_DIR, 'context.ts'))}';`);
emit(`import type * as T from '${rel(`packages/${GRAMMAR}/src/types.ts`)}';`);
emit(`import { TSKindId } from '${rel(`packages/${GRAMMAR}/src/types.ts`)}';`);
emit();

// The language context: per namespace, the interfaces of the kinds this grammar claims.
const NAMESPACES = [
	'argument',
	'attribute',
	'clause',
	'comment',
	'declaration',
	'element',
	'expression',
	'identifier',
	'literal',
	'modifier',
	'module',
	'pattern',
	'statement',
	'type'
] as const;
const claimedPaths = [...new Set(facts.claims.map((c) => c.vocab))].sort();
emit(`/** ${GRAMMAR}'s context: each namespace's kind-set, the interfaces of the kinds ${GRAMMAR} claims. */`);
emit('export interface Ctx extends GrammarContext {');
for (const ns of NAMESPACES) {
	const paths = claimedPaths.filter((p) => p === ns || p.startsWith(`${ns}.`));
	emit(`\treadonly ${ns}: ${paths.length > 0 ? paths.map(interfaceOf).join(' | ') : 'never'};`);
}
emit('}');
emit();

// What `view()` gives for each kind id, as one alias per kind so recursive containers resolve:
// a claimed kind's interfaces (its own claims, else its nearest claimed supertype's), an enum
// token's claimed kind, a container's elements, a token's text, a text leaf's string, and an
// unmapped kind's marker.
const supertypesOf = new Map<string, string[]>();
for (const n of model.values())
	for (const s of n.subtypes) (supertypesOf.get(s) ?? supertypesOf.set(s, []).get(s)!).push(n.kind);
const ownEntries = (kind: string): Entry[] | undefined => entriesOf.get(kind) ?? entriesOf.get(kind.replace(/^_+/, ''));
function entriesFor(kind: string, seen = new Set<string>()): Entry[] | undefined {
	const own = ownEntries(kind);
	if (own !== undefined) return own;
	for (const s of supertypesOf.get(kind) ?? []) {
		if (seen.has(s)) continue;
		seen.add(s);
		const found = entriesFor(s, seen);
		if (found !== undefined) return found;
	}
	return undefined;
}
const isEnum = (kind: string): boolean => modelNode(kind)?.modelType === 'enum';
const enumOfToken = new Map<string, string>();
for (const kind of entriesOf.keys()) {
	const node = modelNode(kind);
	if (node?.modelType !== 'enum') continue;
	for (const text of node.enumValues) for (const [tk, t] of tokenText) if (t === text) enumOfToken.set(tk, kind);
}
const concreteKinds = (kind: string, seen = new Set<string>()): string[] => {
	const node = modelNode(kind);
	if (node === undefined || seen.has(kind)) return [];
	seen.add(kind);
	return node.subtypes.length > 0 ? node.subtypes.flatMap((s) => concreteKinds(s, seen)) : [node.kind];
};
const aliasOf = (kind: string): string => `VK_${typeNameOf(kind) ?? tsname(kind.replace(/^_+/, ''))}`;
const refsOf = (kinds: readonly string[], terminals: readonly string[] = []): string => {
	const parts = new Set<string>(terminals.map(quote));
	for (const k of kinds) for (const c of concreteKinds(k)) if (kindIdRef(c)) parts.add(aliasOf(c));
	return parts.size > 0 ? [...parts].join(' | ') : 'never';
};
/** A container's runtime unwrap, and whether an absent optional list reads as `[]`. */
function unwrapOf(node: ModelNode): { type: string; read: string } | null {
	const c = containerElement(node);
	if (c === null) return null;
	if ('list' in c) return { type: `(${refsOf(node.elementKinds)})[]`, read: `n.items().map((x) => ${viewerOf(node.elementKinds)}(x))` };
	const call = `n.${c.slot.propertyName}()`;
	const viewer = viewerOf(c.slot.kinds);
	if (c.slot.multiple) return { type: `(${refsOf(c.slot.kinds, c.slot.terminals)})[]`, read: `${call}.map((x) => ${viewer}(x))` };
	const inner = c.slot.kinds.length === 1 ? modelNode(c.slot.kinds[0] ?? '') : undefined;
	const innerList = inner !== undefined && inner.subtypes.length === 0 && (unwrapOf(inner)?.type.endsWith('[]') ?? false);
	if (innerList && !c.slot.required) return { type: refsOf(c.slot.kinds), read: `${viewer}(${call}) ?? []` };
	return { type: refsOf(c.slot.kinds, c.slot.terminals) + (c.slot.required ? '' : ' | undefined'), read: `${viewer}(${call})` };
}
const concrete = [...model.values()].filter((n) => n.subtypes.length === 0 && kindIdRef(n.kind) !== undefined);
const viewTypeOf = new Map<string, string>();
for (const node of concrete) {
	const entries = entriesFor(node.kind);
	let type: string;
	if (entries !== undefined) type = [...new Set(entries.map((e) => `VocabViews[${quote(e.vocab)}]`))].join(' | ');
	else if (unclaimed.has(node.kind)) type = 'never';
	else if (node.modelType === 'keyword' || node.modelType === 'punctuation')
		type = tokenText.has(node.kind) ? quote(tokenText.get(node.kind)!) : 'string';
	else if (node.modelType === 'enum') type = node.enumValues.map(quote).join(' | ') || 'string';
	else if (input.textTokens.has(node.kind) && node.pattern !== null) type = 'string';
	else type = unwrapOf(node)?.type ?? `V.Unmapped<'${GRAMMAR}:${node.kind.replace(/^_+/, '')}'>`;
	viewTypeOf.set(node.kind, type);
}
for (const [kind, text] of tokenText)
	if (kindIdRef(kind) !== undefined && !viewTypeOf.has(kind))
		viewTypeOf.set(kind, quote(text));
for (const [kind, type] of viewTypeOf) emit(`type ${aliasOf(kind)} = ${type};`);
emit();
const coreOf = (kind: string): string | undefined => (isEnum(kind) ? 'number' : typeNameOf(kind) ? `T.${typeNameOf(kind)}.Parsed` : undefined);
emit('/** A member type resolved to its view: a vocabulary value by its `kind` through `VocabViews`, an array element by element. */');
emit('type Resolved<R> = R extends readonly unknown[]');
emit('\t? { [I in keyof R]: Resolved<R[I]> }');
emit('\t: R extends { readonly kind: infer K }');
emit('\t\t? K extends keyof VocabViews');
emit('\t\t\t? VocabViews[K]');
emit('\t\t\t: R');
emit('\t\t: R;');
emit('/** A vocabulary kind\'s view form: `kind` as data, each property member as a closure returning its resolved value. */');
emit('export type ViewForm<I> = { readonly kind: I extends { readonly kind: infer K } ? K : never } & {');
emit("\treadonly [P in keyof I as P extends 'kind' ? never : P]-?: () => Resolved<I[P]>;");
emit('};');
emit();
emit(`/** Each vocabulary kind ${GRAMMAR} claims, as its view: the kind's view form plus \`$core\`, the low-level node it reads. */`);
emit('export interface VocabViews {');
for (const path of claimedPaths) {
	const cores = [...new Set(facts.claims.filter((c) => c.vocab === path && c.kind !== null).flatMap((c) => (coreOf(c.kind!) ? [coreOf(c.kind!)!] : [])))];
	emit(`\t${quote(path)}: ViewForm<${interfaceOf(path)}> & { readonly $core: ${cores.length > 0 ? cores.join(' | ') : 'never'}; readonly $text?: () => string };`);
}
emit('}');
emit();
emit(`/** What \`view()\` gives for each ${GRAMMAR} kind id. */`);
emit('export interface ViewByKind {');
for (const kind of viewTypeOf.keys()) emit(`\t[${kindIdRef(kind)}]: ${aliasOf(kind)};`);
emit('}');
emit();
emit(`/** What \`viewEnum()\` gives for a token that is a value of a claimed ${GRAMMAR} enum. */`);
emit('export interface EnumViewByKind {');
for (const [token, enumKind] of enumOfToken) if (kindIdRef(token) && kindIdRef(enumKind)) emit(`\t[${kindIdRef(token)}]: ${aliasOf(enumKind)};`);
emit('}');
emit();
emit('/** A reader result, viewed: a node by its kind id, a token by its kind id, absence as absence. */');
emit('export type ViewOf<N> = N extends undefined');
emit('\t? undefined');
emit('\t: N extends keyof ViewByKind');
emit('\t\t? ViewByKind[N]');
emit('\t\t: N extends { readonly $type: infer K }');
emit('\t\t\t? K extends keyof ViewByKind');
emit('\t\t\t\t? ViewByKind[K]');
emit('\t\t\t\t: never');
emit('\t\t\t: never;');
emit('/** As `ViewOf`, where a token that is an enum value reads as that enum\'s view. */');
emit('export type ViewEnumOf<N> = N extends keyof EnumViewByKind ? EnumViewByKind[N] : ViewOf<N>;');
emit();

// One class per read entry. A refinement reads like its parent and pins its literals; an enum
// leaf's claim is a view over the token's kind id, which is how an enum value is stored.
const classNameOf = (e: Entry): string => `${tsname(e.kind.replace(/^_+/, ''))}As${e.vocab.split('.').map(tsname).join('')}`;
const pinsOf = (e: Entry): Map<string, string> => {
	const parent = e.literals.length > 0 ? plainVocabOf(e.kind) : undefined;
	if (parent === undefined || parent === e.vocab) return new Map();
	return new Map(
		e.literals.map(([slot, text]) => {
			const s = modelNode(e.kind)?.slots.find((x) => x.name === slot);
			return [s ? memberNameOf(new Map(), s) : camel(slot), text] as const;
		})
	);
};
const emitted: Entry[] = [];
for (const [kind, entries] of entriesOf) {
	const typeName = typeNameOf(kind);
	if (typeName === undefined || kindIdRef(kind) === undefined) {
		skipped.push(`${kind}: no typed surface`);
		continue;
	}
	for (const e of entries) {
		if (!runtimeEntry(e)) {
			skipped.push(`${kind} → ${e.vocab}: ${e.claim.predicate ? 'predicate' : `placed within ${e.claim.within.join(' > ')}`}`);
			continue;
		}
		const node = modelNode(kind);
		const leaf = node !== undefined && (node.modelType === 'pattern' || node.modelType === 'enum' || input.textTokens.has(kind));
		emit(`const ${classNameOf(e)} = (n: ${coreOf(kind)}): VocabViews[${quote(e.vocab)}] => ({`);
		emit(`\tkind: ${quote(e.vocab)},`);
		emit('\t$core: n,');
		if (leaf) emit(`\t$text: () => ${isEnum(kind) ? "TEXT[n] ?? ''" : 'n.$text'},`);
		const pins = pinsOf(e);
		const written = new Set<string>();
		for (const m of isEnum(kind) ? [] : membersOf(kind)) {
			if (m.name === 'kind') continue;
			const pin = pins.get(m.name);
			if (pin !== undefined) {
				emit(`\t${m.name}: () => ${quote(pin)},`);
				written.add(m.name);
				continue;
			}
			const body = getterOf(kind, m);
			if (body === undefined) {
				skipped.push(`${kind} → ${e.vocab}.${m.name}: unresolved ${m.route} route`);
				continue;
			}
			emit(`\t${m.name}: () => ${body.replace(/^return /, '').replace(/;$/, '').replaceAll('this.$core', 'n')},`);
			written.add(m.name);
		}
		for (const name of interfaceMembers(e.vocab)) if (name !== 'kind' && !written.has(name)) emit(`\t${name}: () => undefined,`);
		emit('});');
		emit();
		emitted.push(e);
	}
}

// The read dispatch: kind id → the most specific entry whose literals hold, or a container's unwrap.
const dispatchOf = (kind: string, entries: readonly Entry[], param: string): string[] => {
	const out: string[] = [];
	const live = entries.filter((e) => emitted.includes(e));
	for (const e of live) {
		const tests = e.literals.flatMap(([slot, text]) => {
			const s = modelNode(e.kind)?.slots.find((x) => x.name === slot);
			const tk = s ? tokenKindOfText(e.kind, s.name, text) : undefined;
			const ref = tk ? kindIdRef(tk) : undefined;
			return s && ref ? [`${param}.${s.propertyName}() === ${ref}`] : [];
		});
		if (tests.length < e.literals.length) {
			skipped.push(`${kind} → ${e.vocab}: a literal with no token kind`);
			continue;
		}
		out.push(tests.length > 0 ? `\t\tif (${tests.join(' && ')}) return ${classNameOf(e)}(${param});` : `\t\treturn ${classNameOf(e)}(${param});`);
		if (tests.length === 0) return out;
	}
	out.push(`\t\tthrow new Error('no ${GRAMMAR} read entry for this ${kind}');`);
	return out;
};
emit('const VIEWS: { readonly [kind: number]: (node: never) => unknown } = {');
for (const node of concrete) {
	if (isEnum(node.kind)) continue;
	const id = kindIdRef(node.kind)!;
	const typeName = typeNameOf(node.kind);
	if (typeName === undefined) continue;
	const entries = entriesFor(node.kind);
	if (entries !== undefined) {
		const body = dispatchOf(node.kind, entries, 'n');
		if (body.every((l) => l.includes('throw'))) continue;
		emit(`\t[${id}]: (n: T.${typeName}.Parsed) => {`);
		for (const l of body) emit(l);
		emit('\t},');
		continue;
	}
	const unwrap = unwrapOf(node);
	if (unwrap !== null) emit(`\t[${id}]: (n: T.${typeName}.Parsed) => ${unwrap.read},`);
}
emit('};');
emit();
emit('const TOKEN_VIEWS: { readonly [kind: number]: (id: number) => unknown } = {');
for (const [token, enumKind] of enumOfToken) {
	const id = kindIdRef(token);
	const entry = entriesOf.get(enumKind)?.find((e) => emitted.includes(e) && e.literals.length === 0);
	if (id !== undefined && entry !== undefined) emit(`\t[${id}]: (id) => ${classNameOf(entry)}(id),`);
}
emit('};');
emit();
emit('const TEXT: { readonly [kind: number]: string } = {');
for (const [kind, text] of tokenText) {
	const id = kindIdRef(kind);
	if (id !== undefined) emit(`\t[${id}]: ${quote(text)},`);
}
emit('};');
emit();
emit('function viewAny(node: unknown, enums: boolean): unknown {');
emit('\tif (node === undefined || node === null) return undefined;');
emit("\tif (typeof node === 'number') return (enums ? TOKEN_VIEWS[node]?.(node) : undefined) ?? TEXT[node];");
emit("\tif (typeof node !== 'object' || !('$type' in node) || typeof node.$type !== 'number') return node;");
emit('\tconst make = VIEWS[node.$type];');
emit('\tif (make !== undefined) return make(node as never);');
emit("\tif ('$text' in node && typeof node.$text === 'string') return node.$text;");
emit(`\treturn { $unmapped: \`${GRAMMAR}:\${TSKindId[node.$type]}\` };`);
emit('}');
emit();
emit('/** Views a reader result: a node through its read entries, a token as its text. */');
emit('function view<N>(node: N): ViewOf<N> {');
emit('\treturn viewAny(node, false) as ViewOf<N>;');
emit('}');
emit();
emit('/** Views a reader result from a slot that admits an enum: a token as that enum\'s view. */');
emit('function viewEnum<N>(node: N): ViewEnumOf<N> {');
emit('\treturn viewAny(node, true) as ViewEnumOf<N>;');
emit('}');
emit();
const contextual = [...entriesOf].filter(([, es]) => es.some((e) => !e.claim.toplevel)).flatMap(([k]) => (kindIdRef(k) ? [kindIdRef(k)!] : []));
emit(`/** The ${GRAMMAR} kinds a node can be read back from on its own: every claim of the kind is decided by the node. A kind whose claim depends on where it sits is reached through its parent's view. */`);
emit(`export type Backward = Exclude<keyof ViewByKind, ${contextual.length > 0 ? contextual.join(' | ') : 'never'}>;`);
emit();
emit('/** Reads a node as its vocabulary kind. Only a kind in `Backward` can be read on its own. */');
emit('export function viewNode<N extends { readonly $type: Backward }>(node: N): ViewOf<N> {');
emit('\treturn view(node);');
emit('}');
emit();

// The build side: a vocabulary value back to a low-level loose builder call, member by member
// along the same routes, with a refinement's pinned literals filled in.
const factoryOf = (kind: string): string | undefined => rawOf.get(kind)?.factoryName;
const paramOf = (kind: string, slot: string): string | undefined =>
	rawOf.get(kind)?.slots?.find((s) => s.name === slot)?.paramName;
const buildCases = new Map<string, string[]>();
const builtBy = new Map<string, string>();
for (const [kind, entries] of entriesOf) {
	const factory = factoryOf(kind);
	if (factory === undefined) {
		for (const e of entries) skipped.push(`build ${e.vocab}: ${kind} has no factory`);
		continue;
	}
	for (const e of entries) {
		if (e.claim.predicate) {
			skipped.push(`build ${e.vocab}: predicate claim, its pinned text is not in the facts`);
			continue;
		}
		if (builtBy.has(e.vocab)) {
			skipped.push(`build ${e.vocab}: already built by ${builtBy.get(e.vocab)}, not by ${kind}`);
			continue;
		}
		builtBy.set(e.vocab, kind);
		const node = modelNode(kind);
		const body: string[] = [];
		if (node !== undefined && node.modelType === 'enum') {
			body.push(`return tokenOf(s, ENUM_${typeNameOf(kind)});`);
			buildCases.set(e.vocab, body);
			continue;
		}
		if (node !== undefined && (node.modelType === 'pattern' || input.textTokens.has(kind))) {
			body.push(`return call(${quote(factory)}, textOf(s));`);
			buildCases.set(e.vocab, body);
			continue;
		}
		const pins = pinsOf(e);
		const fields: string[] = [];
		const viaGroups = new Map<string, { path: string[]; parts: string[]; envelope: string | undefined }>();
		for (const m of membersOf(kind)) {
			if (m.name === 'kind') continue;
			const value = pins.has(m.name) ? quote(pins.get(m.name)!) : `member(s, ${quote(m.name)})`;
			if (m.route === 'slot') {
				const param = paramOf(kind, m.slot.name);
				if (param === undefined) continue;
				fields.push(`${param}: ${m.slot.storage === 'boolean' ? value : `back(${value})`}`);
				continue;
			}
			const chain = viaChain(kind, m.via);
			if (chain === undefined) continue;
			const slot = m.route === 'presence' ? chain.at.slots.find((x) => x.terminals.includes(m.token)) : slotFor(chain.at.slots, m.selector);
			if (slot === undefined) continue;
			const path: string[] = [];
			let at = modelNode(kind);
			for (const step of m.via) {
				const s = at?.slots.find((x) => x.kinds.includes(step));
				const p = at && s ? paramOf(at.kind, s.name) : undefined;
				if (p === undefined) break;
				path.push(p);
				at = modelNode(step);
			}
			const leafParam = paramOf(chain.at.kind, slot.name);
			if (path.length !== m.via.length || leafParam === undefined) continue;
			const key = [...path, leafParam].join('.');
			const envelope = chain.at.modelType === 'envelope' ? factoryOf(chain.at.kind) : undefined;
			const group = viaGroups.get(key) ?? viaGroups.set(key, { path: [...path, leafParam], parts: [], envelope }).get(key)!;
			const tokenKind = m.route === 'presence' ? tokenKindOfText(chain.at.kind, slot.name, m.token) : undefined;
			const tokenId = tokenKind ? kindIdRef(tokenKind) : undefined;
			if (m.route === 'presence' && tokenId === undefined) continue;
			group.parts.push(m.route === 'presence' ? `...(${value} === true ? [${tokenId}] : [])` : `...(${value} === undefined ? [] : [back(${value})])`);
		}
		for (const { path, parts, envelope } of viaGroups.values()) {
			const list = `[${parts.join(', ')}]`;
			if (envelope !== undefined && path.length === 2) {
				fields.push(`...((items) => (items.length > 0 ? { ${path[0]}: spread(${quote(envelope)}, items) } : {}))(${list})`);
				continue;
			}
			const nest = (i: number): string => (i === path.length - 1 ? `{ ${path[i]}: items }` : `{ ${path[i]}: ${nest(i + 1)} }`);
			fields.push(`...((items) => (items.length > 0 ? ${nest(0)} : {}))(${list})`);
		}
		body.push(`return call(${quote(factory)}, { ${fields.join(', ')} });`);
		buildCases.set(e.vocab, body);
	}
}
for (const kind of entriesOf.keys()) {
	if (!isEnum(kind) || typeNameOf(kind) === undefined) continue;
	emit(`const ENUM_${typeNameOf(kind)}: { readonly [text: string]: number } = {`);
	for (const [token, enumKind] of enumOfToken)
		if (enumKind === kind && kindIdRef(token)) emit(`\t${quote(tokenText.get(token)!)}: ${kindIdRef(token)},`);
	emit('};');
}
emit();
emit('/** A vocabulary value: a view, or a plain structure carrying `kind` and members. */');
emit('export interface Value {');
emit('\treadonly kind: string;');
emit('\treadonly $text?: string | (() => string);');
emit('}');
emit();
emit(`type Build = typeof import('${rel(`packages/${GRAMMAR}/src/ir.ts`)}').ir;`);
emit();
emit('/** Builds vocabulary values through the low-level loose builders of an engine. */');
emit('export function builder(build: Build) {');
emit('\tconst table = build as unknown as { readonly [factory: string]: ((input: unknown) => unknown) | undefined };');
emit('\tconst call = (factory: string, input: unknown): unknown => {');
emit('\t\tconst make = table[factory];');
emit("\t\tif (make === undefined) throw new Error(`no loose builder ${factory}`);");
emit('\t\treturn make(input);');
emit('\t};');
emit('\tconst spread = (factory: string, items: readonly unknown[]): unknown => {');
emit('\t\tconst make = table[factory] as ((...items: unknown[]) => unknown) | undefined;');
emit("\t\tif (make === undefined) throw new Error(`no loose builder ${factory}`);");
emit('\t\treturn make(...items);');
emit('\t};');
emit('\tconst member = (s: Value, name: string): unknown => {');
emit('\t\tconst v = (s as unknown as { readonly [name: string]: unknown })[name];');
emit("\t\treturn typeof v === 'function' ? (v as () => unknown)() : v;");
emit('\t};');
emit("\tconst textOf = (s: Value): string => (typeof s.$text === 'function' ? s.$text() : s.$text) ?? '';");
emit('\tconst tokenOf = (s: Value, ids: { readonly [text: string]: number }): number => {');
emit("\t\tif ('$core' in s && typeof s.$core === 'number') return s.$core;");
emit('\t\tconst id = ids[textOf(s)];');
emit("\t\tif (id === undefined) throw new Error(`${s.kind} has no token spelled ${textOf(s)}`);");
emit('\t\treturn id;');
emit('\t};');
emit('\tconst back = (v: unknown): unknown => {');
emit("\t\tif (Array.isArray(v)) return v.map(back);");
emit("\t\tif (typeof v === 'object' && v !== null && 'kind' in v && typeof v.kind === 'string') return from(v as Value);");
emit('\t\treturn v;');
emit('\t};');
emit('\tfunction from<S extends Value>(s: S): unknown {');
emit('\t\tswitch (s.kind) {');
for (const [vocab, body] of buildCases) {
	emit(`\t\t\tcase ${quote(vocab)}:`);
	for (const l of body) emit(`\t\t\t\t${l}`);
}
emit('\t\t\tdefault:');
emit(`\t\t\t\tthrow new Error(\`${GRAMMAR} has no build entry for \${s.kind}\`);`);
emit('\t\t}');
emit('\t}');
emit('\treturn from;');
emit('}');

mkdirSync(OUT_DIR, { recursive: true });
const out = join(OUT_DIR, `${GRAMMAR}.vocab.ts`);
writeFileSync(out, `${lines.join('\n')}\n`);
writeFileSync(
	join(OUT_DIR, `${GRAMMAR}.engine.ts`),
	`// The engine the generated views read through, re-exported from the checkout they were generated against.\n` +
		`export { createEngine } from '${rel('packages/common/src/index.ts')}';\n` +
		`export { default as language } from '${rel(`packages/${GRAMMAR}/src/index.ts`)}';\n`
);
console.log(`wrote ${relative(process.cwd(), out)}: ${emitted.length} view classes over ${entriesOf.size} grammar kinds, ${viewTypeOf.size} kind ids typed, ${buildCases.size} build entries`);
console.log(`skipped ${skipped.length}:`);
for (const s of skipped) console.log(`  ${s}`);
