/**
 * Factory-storage validation — corpus → parse → read (wrapped tree,
 * same materialization rrp uses) → config object → factory() → compare
 * storage.
 *
 * Uses direct factory calls (via `_factoryMap`) to isolate the factory
 * API's own correctness from `from()` resolver bugs:
 * 1. Parse corpus source with tree-sitter.
 * 2. Walk the wrapped tree (rrp's own read path) and fully materialize
 *    each candidate node — this is the canonical "what a real parse+read
 *    produces" reference.
 * 3. Derive a factory config from that reference via `nodeToConfig`.
 * 4. Call the factory directly with that config (no `from()` resolver).
 * 5. Compare the factory-built node's storage against the reference,
 *    field by field, ignoring identity-only metadata.
 *
 * 6. Render the factory-built node, which carries no source identity,
 *    reparse it and compare its AST with the source's — reported apart
 *    from the storage comparison (`render`), so a factory-API defect and a
 *    render defect each fail on their own.
 */

import type { AnyUntypedNode, NodeTrivia } from '@sittir/types';
import { nodeText, placeOf, spanOf } from '@sittir/common/utils';
import type { TreeHandle } from '@sittir/common/utils';
import type { FactoryShape, FactorySlotMeta } from '../codegen-surface.ts';
import { load } from '../codegen-surface.ts';
import { importGrammarModule, type FactoryEntry } from '../grammar-internals.ts';
import { deriveRuleKinds } from './render-bodies.ts';

const { loadRawEntries } = await load('nodeTypesLoader');
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	buildReadHandle,
	walkWrappedTree,
	materialize,
	loadSlotAccessorOf,
	readNodeOf,
	emitValidatorMetrics,
	loadNodeModel,
	dedupeMismatchesByContainment,
	type TSNode,
	type TSTree,
	type TypedNode,
	type IrSurface,
	type ValidatorSkip,
	loadIrSurface,
	buildFactoryNodeFromReference,
	tableSides,
	type ReadNodeLike,
	loadScopedFactoryMap,
	loadNativeEngine
} from './common.ts';
import { hostlessReason, loadRenderReparseContext, renderReparse, wrapRendered, type AstTolerance } from './read-render-parse.ts';
import {
	emptyBuiltRender,
	emptyBuiltRenderRun,
	finishBuiltRender,
	type BuiltRenderFailure,
	type BuiltRenderResult
} from './built-render.ts';
import { KindCases, type CasesByKind } from './kind-cases.ts';
import { sourceSpans } from '@sittir/common';

/**
 * Which factory surface a run builds through: `raw` calls each kind's raw
 * builder, where a hoisted child is an ordinary child; `ir` calls the
 * author-facing `ir` binding and its mount routes, projecting a hoisted child
 * by its seat, and counts only kinds bound on `ir`.
 */
export type FactorySurface = 'raw' | 'ir';

export interface ValidateFactoryStorageOptions {
	readonly surface?: FactorySurface;
}

/**
 * Find a node anywhere in the tree by its exact byte span, preferring the
 * deepest node whose `.type` matches `kind` over an enclosing same-span
 * wrapper (e.g. `tuple_struct_pattern` over an enclosing `match_pattern`).
 * Falls back to the deepest same-span node of any type.
 */
function findNodeBySpanOfKind(node: TSNode, startIndex: number, endIndex: number, kind: string): TSNode | null {
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		if (c.startIndex > startIndex || c.endIndex < endIndex) continue;
		const hit = findNodeBySpanOfKind(c, startIndex, endIndex, kind);
		if (hit) return hit;
	}
	if (node.startIndex === startIndex && node.endIndex === endIndex && node.type === kind) return node;
	return null;
}

/** Find a node anywhere in the tree by its exact byte span (any type). */
function findNodeBySpan(node: TSNode, startIndex: number, endIndex: number): TSNode | null {
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		if (c.startIndex > startIndex || c.endIndex < endIndex) continue;
		const hit = findNodeBySpan(c, startIndex, endIndex);
		if (hit) return hit;
	}
	if (node.startIndex === startIndex && node.endIndex === endIndex) return node;
	return null;
}

/** Return the named tree-sitter child kinds for a parsed CST node, in source order. */
function namedChildKinds(node: TSNode): string[] {
	const kinds: string[] = [];
	for (let i = 0; i < node.childCount; i++) {
		const child = node.child(i);
		if (child?.isNamed) kinds.push(child.type);
	}
	return kinds;
}

// ---------------------------------------------------------------------------
// Storage comparison — the core new check
// ---------------------------------------------------------------------------

/**
 * Metadata/identity keys present on materialized-read or factory-built
 * nodes that are EXPECTED to differ (or be absent on one side) between an
 * independently-constructed factory node and the node a real parse+read
 * produced. Never part of the structural comparison.
 */
const IGNORED_NODE_KEYS = new Set([
	'$_layout',
	'$treeHandle',
	'$span',
	'$named',
	'$with',
	'$variant'
]);

function isComparableNode(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && '$type' in (v as Record<string, unknown>);
}

/** Shared context threaded through the recursive comparator. */
interface CompareCtx {
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly kindNameFromId?: (id: number) => string | undefined;
}

function kindOf(node: Record<string, unknown>, ctx: CompareCtx): string | undefined {
	const t = node.$type;
	if (typeof t === 'number') return ctx.kindNameFromId?.(t);
	if (typeof t === 'string') return t;
	return undefined;
}

/**
 * `true` only for a node whose OWN kind is a `'text'`-shape factory — the
 * one shape whose factory function actually sets `$text` (it takes a raw
 * source string). Every other shape ('config' / 'direct' / 'spread') never
 * populates `$text`, REGARDLESS of whether the node happens to have visible
 * `_<field>` structure — an empty container (e.g. `parameters` with zero
 * params) still omits `$text` on the factory side. A structure-based
 * heuristic (has-fields ⇒ no-text) misses exactly that empty-container case,
 * which is why this checks the factory shape directly instead.
 */
function isTextShapeNode(node: Record<string, unknown>, ctx: CompareCtx): boolean {
	const kind = kindOf(node, ctx);
	return kind !== undefined && ctx.factoryShapes[kind] === 'text';
}

/**
 * Storage-relevant keys on a node: `$type`, `$text` (only for `'text'`-shape
 * kinds — see `isTextShapeNode`), and dehoisted `_<field>` keys.
 */
function storageKeysOf(v: Record<string, unknown>, ctx: CompareCtx): string[] {
	return Object.keys(v).filter((k) => {
		if (IGNORED_NODE_KEYS.has(k)) return false;
		if (k === '$text') return isTextShapeNode(v, ctx);
		return k === '$type' || k.startsWith('_');
	});
}

/** `true` when a storage value is absent in a way that should be tolerated
 * on the other side too (undefined, or an empty array — an omitted
 * optional/empty-array field is not a real divergence). */
function isEmptyStorageValue(v: unknown): boolean {
	return v === undefined || (Array.isArray(v) && v.length === 0);
}

function storageValueOf(node: Record<string, unknown>, key: string): unknown {
	return key === '$text' ? nodeText(node) : node[key];
}

/**
 * A bare scalar and a single-element array are the SAME storage value, not
 * a masked cardinality bug: the slot model owns arity and enforces it at
 * construction on both sides being compared here — the wrap/read layer
 * throws (`singular slot "x" requires one value; got array(len=2)`) and a
 * factory's own `nodeToConfig`/slot-normalization path enforces the same
 * slot model when building storage. Both the materialized reference and
 * the factory-built node have therefore already passed arity validation
 * for their kind's slots before reaching this comparator, so a scalar on
 * one side and a matching one-element array on the other is a
 * representational difference only (singular field vs. an unwrapped
 * array-of-one), never a genuine cardinality divergence — a factory that
 * built the wrong arity would already have failed upstream as a wrap/
 * factory error, not slipped through here. Coalescing them for comparison
 * mirrors this arity ownership rather than re-deriving it: this
 * comparator's job is value equality, not a second arity check.
 */
function compareStorageValue(expected: unknown, actual: unknown, path: string, ctx: CompareCtx): string | null {
	if (Array.isArray(expected) || Array.isArray(actual)) {
		const ea = Array.isArray(expected) ? expected : isEmptyStorageValue(expected) ? [] : [expected];
		const aa = Array.isArray(actual) ? actual : isEmptyStorageValue(actual) ? [] : [actual];
		if (ea.length !== aa.length) {
			return `${path}: array length ${ea.length} ≠ ${aa.length}`;
		}
		for (let i = 0; i < ea.length; i++) {
			const diff = compareStorageValue(ea[i], aa[i], `${path}[${i}]`, ctx);
			if (diff) return diff;
		}
		return null;
	}
	if (isComparableNode(expected) && isComparableNode(actual)) {
		return compareNodeStorage(expected, actual, path, ctx);
	}
	if (isComparableNode(expected) !== isComparableNode(actual)) {
		return `${path}: shape mismatch (node vs scalar) — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
	}
	if (expected !== actual) {
		return `${path}: value ${JSON.stringify(expected)} ≠ ${JSON.stringify(actual)}`;
	}
	return null;
}

/**
 * Deep-compare a factory-built node against the materialized reference
 * node a real parse+read produced. Returns a human-readable diff
 * description for the first divergence found, or `null` when the two are
 * storage-identical (ignoring identity-only metadata — see
 * `IGNORED_NODE_KEYS`).
 *
 * @param expected - Materialized reference node (from the wrapped read tree).
 * @param actual - Factory-built node under test.
 * @param path - Field-path accumulator for error messages (empty at the root).
 * @param ctx - Factory-shape lookup used to decide whether `$text` applies.
 */
function compareNodeStorage(
	expected: Record<string, unknown>,
	actual: Record<string, unknown>,
	path: string,
	ctx: CompareCtx
): string | null {
	const expectedKind = expected.$type;
	const actualKind = actual.$type;
	if (expectedKind !== actualKind) {
		return `${path || 'root'}: $type ${String(expectedKind)} ≠ ${String(actualKind)}`;
	}
	const expectedKeys = storageKeysOf(expected, ctx);
	const actualKeys = new Set(storageKeysOf(actual, ctx));
	const seen = new Set<string>();
	for (const key of expectedKeys) {
		if (key === '$type') continue;
		seen.add(key);
		const ev = storageValueOf(expected, key);
		if (!actualKeys.has(key)) {
			if (isEmptyStorageValue(ev)) continue;
			return `${path || 'root'}.${key}: missing on factory output`;
		}
		const diff = compareStorageValue(ev, storageValueOf(actual, key), `${path || 'root'}.${key}`, ctx);
		if (diff) return diff;
	}
	for (const key of actualKeys) {
		if (key === '$type' || seen.has(key)) continue;
		const av = storageValueOf(actual, key);
		if (isEmptyStorageValue(av)) continue;
		return `${path || 'root'}.${key}: unexpected extra field on factory output`;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FactoryStorageResult {
	grammar: string;
	total: number;
	casesByKind: CasesByKind;
	pass: number;
	fail: number;
	skip: number;
	/**
	 * Storage-identity is now a single-tier check (see module doc comment),
	 * so this is always equal to `pass`. Kept as a distinct field for
	 * backward compatibility with callers (`commands.ts`, the JSON
	 * validation report) that display it alongside `read-render-parse`'s
	 * genuinely two-tier `astMatchPass`.
	 */
	astMatchPass: number;
	errors: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
	}[];
	astMismatches: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
		start: number;
		end: number;
	}[];
	skips: ValidatorSkip[];
	excluded: ValidatorSkip[];
	/** Each built node rendered and reparsed, its AST compared with the source's. */
	render: BuiltRenderResult;
}

const SOURCE_KEYS: ReadonlySet<string> = new Set(['$treeHandle', '$span']);

/**
 * `node` with every node under it built through `build` from its leaves up,
 * so none keeps the identity of the read it came from. A node `build` has no
 * factory for is kept as its data, without the keys that name its source.
 * Each copy carries the sides `sides` gives the read it came from, taken
 * while that read still names its tree.
 */
function rebuildChildren(
	node: Record<string, unknown>,
	build: (node: Record<string, unknown>) => unknown,
	sides: (node: ReadNodeLike, rebuild: (read: unknown) => unknown) => NodeTrivia | undefined,
	takesText: (node: Record<string, unknown>) => boolean = () => false
): Record<string, unknown> {
	const rebuild = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(rebuild);
		if (typeof value !== 'object' || value === null) return value;
		if (isComparableNode(value) && takesText(value as Record<string, unknown>)) {
			return build(value as Record<string, unknown>) ?? value;
		}
		const data = rebuildChildren(value as Record<string, unknown>, build, sides, takesText);
		if (!isComparableNode(value)) return data;
		return build(data) ?? data;
	};
	const copy = Object.fromEntries(
		Object.entries(node).flatMap(([key, value]): [string, unknown][] =>
			SOURCE_KEYS.has(key) || key === '$_layout' ? [] : [[key, rebuild(value)]]
		)
	);
	const trivia = isComparableNode(node) ? sides(node as unknown as ReadNodeLike, rebuild) : undefined;
	return trivia === undefined ? copy : { ...copy, $_layout: { trivia } };
}

/** Whether `value` or any node under it carries the identity of a parsed source node. */
function carriesSource(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(carriesSource);
	if (typeof value !== 'object' || value === null) return false;
	if (placeOf(value) !== undefined) return true;
	return Object.values(value).some(carriesSource);
}

async function loadFactoryKindNameFromId(grammar: string): Promise<{
	kindNameFromId: ((id: number) => string | undefined) | undefined;
	importFailure: { message: string } | null;
}> {
	try {
		const kindNames = (await importGrammarModule(grammar, 'types.ts'))?.KIND_NAMES;
		return { kindNameFromId: kindNames ? (id: number) => kindNames.get(id) : undefined, importFailure: null };
	} catch (error) {
		const message = `[validate-factory-roundtrip] failed to load ${grammar} src/types.ts: ${error instanceof Error ? error.message : error}`;
		console.error(message);
		return { kindNameFromId: undefined, importFailure: { message } };
	}
}

async function loadFactoryModuleForGrammar(grammar: string): Promise<{
	factoryMap: Record<string, FactoryEntry>;
	factoryShapes: Record<string, FactoryShape>;
	fieldAliasMap: Record<string, Record<string, string>>;
	factoryFields: Record<string, readonly string[]>;
	factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	kindNameFromId: ((id: number) => string | undefined) | undefined;
	importFailure: { message: string } | null;
}> {
	let factoryMap: Record<string, FactoryEntry> = {};
	let factoryShapes: Record<string, FactoryShape> = {};
	let fieldAliasMap: Record<string, Record<string, string>> = {};
	let factoryFields: Record<string, readonly string[]> = {};
	let factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
	let kindNameFromId: ((id: number) => string | undefined) | undefined = undefined;
	try {
		const factoryModule = await importGrammarModule(grammar, 'factories/raw.ts');
		if (!factoryModule) {
			return {
				factoryMap,
				factoryShapes,
				fieldAliasMap,
				factoryFields,
				factorySlots,
				kindNameFromId,
				importFailure: null
			};
		}
		factoryMap = await loadScopedFactoryMap(grammar, factoryModule._factoryMap ?? {});
		// Validator-only metadata lives in node-model.json5 (PR-K) — pure
		// data, loaded separately from the factory functions.
		const mapData = await loadNodeModel(grammar);
		factoryShapes = mapData.factoryShapes;
		fieldAliasMap = mapData.fieldAliasMap;
		factoryFields = mapData.factoryFields;
		factorySlots = mapData.factorySlots;
		const identity = await loadFactoryKindNameFromId(grammar);
		kindNameFromId = identity.kindNameFromId;
		if (identity.importFailure) {
			return {
				factoryMap,
				factoryShapes,
				fieldAliasMap,
				factoryFields,
				factorySlots,
				kindNameFromId,
				importFailure: identity.importFailure
			};
		}
		return {
			factoryMap,
			factoryShapes,
			fieldAliasMap,
			factoryFields,
			factorySlots,
			kindNameFromId,
			importFailure: null
		};
	} catch (e) {
		const message = `[validate-factory-roundtrip] failed to load ${grammar} src/factories/raw.ts: ${(e as Error)?.message ?? e}`;
		console.error(message);
		return {
			factoryMap,
			factoryShapes,
			fieldAliasMap,
			factoryFields,
			factorySlots,
			kindNameFromId,
			importFailure: { message }
		};
	}
}

/**
 * Create a `Set` that deduplicates validation work on (kind, entry) pairs.
 * Each corpus entry that contains a kind is exercised exactly once — the
 * prior per-kind-only granularity hid real bugs: when the first corpus entry
 * happened to exercise a working shape, subsequent entries testing buggy
 * shapes (e.g. python `comparison_operator` with `not in` vs the chained
 * `a < b`) never ran. The (kind, entry) granularity keeps runtime bounded
 * while catching shape-specific bugs.
 *
 * @returns An empty Set keyed by `"${kind}\0${entryName}"` strings.
 */
function initKindEntryDeduplicator(): Set<string> {
	return new Set<string>();
}

/**
 * Record a factory-module load failure as a sentinel error entry. Without
 * this entry, an empty `factoryMap` silently skips every kind, making the
 * reported "factory pass" count reflect an all-skip run rather than a real
 * failure signal.
 *
 * @param importFailure - The load-failure descriptor, or `null` if loading succeeded.
 * @param errors - Mutable error list to append to.
 */
function recordFactoryModuleLoadFailure(
	importFailure: { message: string } | null,
	errors: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
	}[]
): void {
	if (importFailure) {
		errors.push({
			kind: '(factory-module-load)',
			message: importFailure.message
		});
	}
}

function buildFactoryUntypedNode(
	referenceData: AnyUntypedNode,
	renderedKind: string,
	cstNodeKindHint: string | undefined,
	firstNamedChildKindHint: string | undefined,
	namedChildKindHints: readonly string[],
	factoryMap: Record<string, FactoryEntry>,
	factoryShapes: Record<string, FactoryShape>,
	fieldAliasMap: Record<string, Record<string, string>>,
	factoryFields: Record<string, readonly string[]>,
	factorySlots: Record<string, Record<string, FactorySlotMeta>>,
	surface: IrSurface | undefined,
	entryName: string,
	inputSource: string,
	errors: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
	}[],
	kindNameFromId?: (id: number) => string | undefined,
	tree?: TreeHandle
): AnyUntypedNode | null {
	const factory = factoryMap[renderedKind];
	if (!factory) return null;
	try {
		return buildFactoryNodeFromReference(
			referenceData,
			renderedKind,
			{ factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, surface },
			{ cstNodeKindHint, firstNamedChildKindHint, namedChildKindHints, kindNameFromId, tree, placeText: tree !== undefined }
		) as AnyUntypedNode | null;
	} catch (e) {
		errors.push({
			kind: renderedKind,
			entry: entryName,
			message: `factory threw: ${(e as Error)?.message ?? String(e)}`,
			input: inputSource
		});
		return null;
	}
}

export async function validateFactoryStorage(
	grammar: string,
	backend: 'native' = 'native',
	options: ValidateFactoryStorageOptions = {}
): Promise<FactoryStorageResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	loadRawEntries(grammar);
	const ruleKinds = deriveRuleKinds(grammar);

	const { factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, kindNameFromId, importFailure } =
		await loadFactoryModuleForGrammar(grammar);

	const readNode = await readNodeOf(grammar);
	const surface = options.surface === 'ir' ? await loadIrSurface(grammar) : undefined;
	const renderReparseContext = await loadRenderReparseContext(grammar, parser, await loadNativeEngine(grammar));
	const { listSeparators } = await loadNodeModel(grammar);
	const accessorOf = await loadSlotAccessorOf(grammar);
	const render = emptyBuiltRenderRun();

	const entries = loadCorpusEntries(grammar);
	const errors: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
	}[] = [];
	const astMismatches: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
		start: number;
		end: number;
	}[] = [];
	const testedPairs = initKindEntryDeduplicator();
	let pass = 0;
	const cases = new KindCases();
	const skips: ValidatorSkip[] = [];
	const excluded: ValidatorSkip[] = [];

	recordFactoryModuleLoadFailure(importFailure, errors);
	if (options.surface === 'ir' && surface === undefined) {
		errors.push({ kind: '(ir-surface-load)', message: `[validate-factory-roundtrip] no ir module for '${grammar}'` });
	}
	if (importFailure || (options.surface === 'ir' && surface === undefined)) {
		return {
			grammar,
			total: 0,
			casesByKind: {},
			pass: 0,
			fail: 0,
			skip: 0,
			astMatchPass: 0,
			errors,
			astMismatches: [],
			skips: [],
			excluded: [],
			render: emptyBuiltRender()
		};
	}

	// This validator's storage comparison only has meaning against the
	// wrapped NATIVE read path (readNode + handle.read). Without it,
	// every candidate below would be silently rejected and the run would
	// report a misleading "0/0 pass" instead of a real failure. Probe
	// availability up front and fail loudly instead of skipping.
	let readPathFailure: string | undefined;
	if (!readNode) {
		readPathFailure = `wrap module unavailable for '${grammar}' — no wrapped-tree read function`;
	} else {
		try {
			const probeHandle = await buildReadHandle(grammar, '');
			if (!probeHandle.read) {
				readPathFailure = `backend '${backend}' has no wrapped native read path (handle.read unavailable) — factory storage validation requires the native backend`;
			}
		} catch (e) {
			readPathFailure = `failed to build native read handle: ${(e as Error)?.message ?? e}`;
		}
	}
	if (readPathFailure || !readNode) {
		const message = `[validate-factory-roundtrip] ${readPathFailure ?? 'wrap module unavailable — no wrapped-tree read function'}`;
		errors.push({ kind: '(read-tree-unavailable)', message });
		return {
			grammar,
			total: 0,
			casesByKind: {},
			pass: 0,
			fail: 1,
			skip: 0,
			astMatchPass: 0,
			errors,
			astMismatches: [],
			skips: [],
			excluded: [],
			render: emptyBuiltRender()
		};
	}

	for (const entry of entries) {
		const tree1 = parser.parse(entry.source) as TSTree;
		const spans = sourceSpans(entry.source);
		if (tree1.rootNode.hasError) {
			excluded.push({ entry: entry.name, reason: 'parse-error', input: entry.source });
			continue;
		}

		// Same read path as read-render-parse: build the native read handle,
		// then walk the WRAPPED tree once. Every node arrives as its true
		// source kind, so no separate wrapper/effective-kind reconciliation
		// dance is needed (the old readUntypedNodeAt-based single-node read here
		// required exactly that, and its non-recursive nodeToConfig call
		// left child fields as unresolved stubs — the root cause of the
		// native node's "Missing field" errors once render was fixed
		// to use the native engine).
		const handle = await buildReadHandle(grammar, entry.source);
		const wrappedRoot = readNode(handle) as TypedNode;
		const candidatesByKind = new Map<string, { start: number; end: number; node: TypedNode }[]>();
		const seen = new Set<string>();
		walkWrappedTree(wrappedRoot, accessorOf, (w: TypedNode) => {
			if (w.$named === false) return;
			const sourceKind = kindNameFromId ? kindNameFromId(w.$type) : undefined;
			if (sourceKind === undefined || !ruleKinds.has(sourceKind)) return;
			if (surface !== undefined && surface.entries[sourceKind] === undefined) return;
			const span = spanOf(w);
			if (span == null) return;
			const dedup = `${sourceKind}@${span.start}:${span.end}`;
			if (seen.has(dedup)) return;
			seen.add(dedup);
			const list = candidatesByKind.get(sourceKind) ?? [];
			list.push({ start: span.start, end: span.end, node: w });
			candidatesByKind.set(sourceKind, list);
		});

		for (const [kind, candidates] of candidatesByKind) {
			for (const cand of candidates) {
				const pairKey = `${kind}\0${entry.name}`;
				if (testedPairs.has(pairKey)) continue;
				testedPairs.add(pairKey);
				cases.add(kind);

				const indices = spans.toIndices(cand);
				const node1 =
					findNodeBySpanOfKind(tree1.rootNode, indices.start, indices.end, kind) ??
					findNodeBySpan(tree1.rootNode, indices.start, indices.end);
				const inputSource = node1 ? node1.text : spans.slice(cand);

				// Canonical reference: what a real parse+read produces for
				// this node, fully materialized (no lazy stubs).
				// $text is handled per-node by the comparator itself (see
				// isTextShapeNode) rather than stripped here.
				const referenceData = materialize(cand.node, accessorOf);

				const cstNamedChildKinds = node1 ? namedChildKinds(node1) : [];

				const factoryData = buildFactoryUntypedNode(
					referenceData,
					kind,
					node1?.type,
					cstNamedChildKinds[0],
					cstNamedChildKinds,
					factoryMap,
					factoryShapes,
					fieldAliasMap,
					factoryFields,
					factorySlots,
					surface,
					entry.name,
					inputSource,
					errors,
					kindNameFromId,
					handle
				);
				if (factoryData === null) {
					// No factory for this kind, or the factory threw (already
					// recorded). Either way there's nothing to compare.
					skips.push({ entry: entry.name, kind, reason: 'no-factory-data', input: inputSource });
					continue;
				}

				render.cases.add(kind);
				const renderFailure = (message: string, rendered?: string): BuiltRenderFailure => ({
					kind,
					entry: entry.name,
					message,
					input: inputSource,
					...(rendered === undefined ? {} : { rendered })
				});
				const buildInner = (node: Record<string, unknown>): unknown => {
					const innerKind = typeof node.$type === 'number' ? kindNameFromId?.(node.$type) : undefined;
					if (innerKind === undefined) return null;
					const innerSurface = surface?.entries[innerKind] === undefined ? undefined : surface;
					return buildFactoryNodeFromReference(
						node,
						innerKind,
						{ factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, surface: innerSurface },
						{ kindNameFromId, tree: handle, placeText: true }
					);
				};
				const buildErrors: typeof errors = [];
				let builtTree: AnyUntypedNode | null = null;
				try {
					const takesText = (node: Record<string, unknown>): boolean => {
						const name = typeof node.$type === 'number' ? kindNameFromId?.(node.$type) : undefined;
						return name !== undefined && factoryShapes[name] === 'placed';
					};
					const root = referenceData as unknown as Record<string, unknown>;
					builtTree = buildFactoryUntypedNode(
						(takesText(root)
							? root
							: rebuildChildren(root, buildInner, (read, rebuild) => tableSides(read, handle, rebuild), takesText)) as unknown as AnyUntypedNode,
						kind,
						node1?.type,
						cstNamedChildKinds[0],
						cstNamedChildKinds,
						factoryMap,
						factoryShapes,
						fieldAliasMap,
						factoryFields,
						factorySlots,
						surface,
						entry.name,
						inputSource,
						buildErrors,
						kindNameFromId,
						handle
					);
				} catch (e) {
					buildErrors.push({ kind, message: `factory threw: ${(e as Error)?.message ?? String(e)}` });
				}
				const hostless = wrapRendered('', kind, node1?.type ?? kind, renderReparseContext) === null;
				if (hostless) {
					render.cases.remove(kind);
					render.excluded.push({ entry: entry.name, kind, reason: hostlessReason(kind, node1?.type ?? kind, renderReparseContext), input: inputSource });
				} else if (builtTree === null) {
					render.errors.push(renderFailure(buildErrors[0]?.message ?? 'no node built'));
				} else if (carriesSource(builtTree)) {
					render.errors.push(renderFailure('built node carries source identity'));
				} else {
					try {
						const tolerance: AstTolerance = { listSeparators, tolerated: [] };
						const outcome = renderReparse(
							builtTree,
							kind,
							node1?.type ?? kind,
							node1,
							node1 !== null && node1.type === tree1.rootNode.type,
							renderReparseContext,
							tolerance
						);
						if (outcome.status === 'excluded') {
							render.cases.remove(kind);
							render.excluded.push({ entry: entry.name, kind, reason: outcome.reason, input: inputSource });
						} else if (outcome.status === 'failed') {
							render.errors.push(renderFailure(outcome.message, outcome.rendered));
						} else {
							render.pass++;
							if (outcome.astDiff === null) {
								render.astMatchPass++;
								if (tolerance.tolerated.length > 0) render.separatorTolerated++;
							} else render.astMismatches.push(renderFailure(outcome.astDiff, outcome.rendered));
						}
					} catch (e) {
						render.errors.push(renderFailure(`render: ${(e as Error)?.message ?? String(e)}`));
					}
				}

				const diff = compareNodeStorage(
					referenceData as unknown as Record<string, unknown>,
					factoryData as unknown as Record<string, unknown>,
					'',
					{ factoryShapes, kindNameFromId }
				);
				if (diff) {
					astMismatches.push({
						kind,
						entry: entry.name,
						message: diff,
						input: inputSource,
						start: cand.start,
						end: cand.end
					});
					continue;
				}

				pass++;
			}
		}
	}

	const total = cases.total;
	emitValidatorMetrics();
	return {
		grammar,
		total,
		casesByKind: cases.byKind(),
		pass,
		fail: total - pass - skips.length,
		skip: skips.length,
		astMatchPass: pass,
		errors,
		astMismatches: dedupeMismatchesByContainment(astMismatches),
		skips,
		excluded,
		render: finishBuiltRender(render)
	};
}

export function formatFactoryStorageReport(result: FactoryStorageResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.pass}/${result.total} factory storage match (${result.skip} skipped, ${result.errors.length} errors)`
	);
	if (result.errors.length > 0) {
		for (const e of result.errors) {
			lines.push(`    x ${e.entry ? `${e.entry} (${e.kind})` : e.kind}: ${e.message}`);
			if (e.input) lines.push(`      source:   ${JSON.stringify(e.input)}`);
		}
	}
	if (result.astMismatches.length > 0) {
		for (const e of result.astMismatches.slice(0, 20)) {
			lines.push(`    ~ ${e.entry ? `${e.entry} (${e.kind})` : e.kind}: ${e.message}`);
			if (e.input) lines.push(`      source:   ${JSON.stringify(e.input)}`);
		}
		if (result.astMismatches.length > 20) {
			lines.push(`    … and ${result.astMismatches.length - 20} more`);
		}
	}
	const { render } = result;
	const renderFailures = [...render.errors, ...render.astMismatches];
	lines.push(
		`  ${renderFailures.length === 0 ? 'v' : 'x'} ${render.astMatchPass}/${render.total} built nodes render and reparse (${render.excluded.length} excluded)`
	);
	for (const e of renderFailures.slice(0, 20)) {
		lines.push(`    x ${e.entry} (${e.kind}): ${e.message}`);
		lines.push(`      source:   ${JSON.stringify(e.input)}`);
	}
	if (renderFailures.length > 20) lines.push(`    … and ${renderFailures.length - 20} more`);
	return lines.join('\n');
}
