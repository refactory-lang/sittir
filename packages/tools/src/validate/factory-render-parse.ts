/**
 * Factory-render-parse validation — corpus → parse → read (wrapped tree,
 * same materialization rrp uses) → config object → factory() → compare
 * storage.
 *
 * Uses direct factory calls (via `_factoryMap`) to isolate the factory
 * API's own correctness from render-template bugs and from `from()`
 * resolver bugs:
 * 1. Parse corpus source with tree-sitter.
 * 2. Walk the wrapped tree (rrp's own read path) and fully materialize
 *    each candidate node — this is the canonical "what a real parse+read
 *    produces" reference.
 * 3. Derive a factory config from that reference via `nodeToConfig`.
 * 4. Call the factory directly with that config (no `from()` resolver).
 * 5. Compare the factory-built node's storage against the reference,
 *    field by field, ignoring identity-only metadata.
 *
 * Previously this rendered the factory output and re-parsed it, which (a)
 * duplicated what `read-render-parse` already exercises with real read
 * data of the same shape, and (b) conflated factory-API bugs with
 * render-template bugs and native-transport strictness on incomplete
 * data. Comparing storage directly gives a precise "factory dropped/
 * mis-shaped field X" signal instead of an opaque re-parsed-AST diff.
 */

import type { AnyNodeData } from '@sittir/types';
import type { PolymorphVariantMap, FactoryShape, FactorySlotMeta } from '../codegen-surface.ts';
import { load } from '../codegen-surface.ts';
import { deriveRuleKinds } from './templates-path.ts';

const { loadRawEntries } = await load('nodeTypesLoader');
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	buildReadHandle,
	walkWrappedTree,
	materializeWrappedNodeData,
	loadReadTreeNode,
	emitValidatorMetrics,
	loadNodeModel,
	dedupeMismatchesByContainment,
	type TSNode,
	type TSTree,
	type WrappedNodeData,
	buildFactoryNodeFromReference
} from './common.ts';

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
const IGNORED_NODE_KEYS = new Set(['$nodeHandle', '$childIndex', '$span', '$source', '$named', '$with', '$variant']);

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
 * kinds — see `isTextShapeNode`), and dehoisted `_<field>` keys. `$other`
 * (the catch-all bucket for anonymous/unnamed children — punctuation,
 * unlabeled keywords) is deliberately excluded: the factory API surface is
 * defined entirely by NAMED fields, so factories have no way to reconstruct
 * anonymous filler content and never populate it. Comparing `$other` would
 * flag every punctuation-bearing kind as "wrong" for something the factory
 * was never meant to reproduce.
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
	if (expected.$type !== actual.$type) {
		return `${path || 'root'}: $type ${String(expected.$type)} ≠ ${String(actual.$type)}`;
	}
	const expectedKeys = storageKeysOf(expected, ctx);
	const actualKeys = new Set(storageKeysOf(actual, ctx));
	const seen = new Set<string>();
	for (const key of expectedKeys) {
		if (key === '$type') continue;
		seen.add(key);
		const ev = expected[key];
		if (!actualKeys.has(key)) {
			if (isEmptyStorageValue(ev)) continue;
			return `${path || 'root'}.${key}: missing on factory output`;
		}
		const diff = compareStorageValue(ev, actual[key], `${path || 'root'}.${key}`, ctx);
		if (diff) return diff;
	}
	for (const key of actualKeys) {
		if (key === '$type' || seen.has(key)) continue;
		const av = actual[key];
		if (isEmptyStorageValue(av)) continue;
		return `${path || 'root'}.${key}: unexpected extra field on factory output`;
	}
	return null;
}

/** Relative path from codegen/src/validate to language package factories.ts */
const FACTORY_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/factories/raw.ts',
	typescript: '../../../typescript/src/factories/raw.ts',
	python: '../../../python/src/factories/raw.ts'
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FactoryRenderParseResult {
	grammar: string;
	total: number;
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
}

/**
 * Dynamically import the generated `_factoryMap` and validator-only metadata
 * for a grammar. `_factoryShapes[kind]` encodes the calling convention
 * (`config` / `children` / `text`) produced at codegen time from the node
 * model type — it is never inferred at runtime.
 *
 * @param grammar - Grammar name (rust / typescript / python).
 * @returns Resolved factory artifacts and an `importFailure` record if loading
 *   fails, or `null` for `importFailure` on success.
 * @remarks Validator-only metadata lives in `node-model.json5` (PR-K) and is
 *   loaded via `loadNodeModel`, separately from the factory functions so the
 *   pure-data file stays tree-shakeable.
 */
async function loadFactoryModuleForGrammar(grammar: string): Promise<{
	factoryMap: Record<string, (config?: any) => unknown>;
	factoryShapes: Record<string, FactoryShape>;
	fieldAliasMap: Record<string, Record<string, string>>;
	factoryFields: Record<string, readonly string[]>;
	factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	polymorphVariants: PolymorphVariantMap;
	kindNameFromId: ((id: number) => string | undefined) | undefined;
	kindLiteralText: ReadonlyMap<number, string> | undefined;
	importFailure: { message: string } | null;
}> {
	const factoryModulePath = FACTORY_MODULE_PATHS[grammar];
	let factoryMap: Record<string, (config?: any) => unknown> = {};
	let factoryShapes: Record<string, FactoryShape> = {};
	let fieldAliasMap: Record<string, Record<string, string>> = {};
	let factoryFields: Record<string, readonly string[]> = {};
	let factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
	let polymorphVariants: PolymorphVariantMap = {};
	let kindNameFromId: ((id: number) => string | undefined) | undefined = undefined;
	let kindLiteralText: ReadonlyMap<number, string> | undefined = undefined;
	if (!factoryModulePath) {
		return {
			factoryMap,
			factoryShapes,
			fieldAliasMap,
			factoryFields,
			factorySlots,
			polymorphVariants,
			kindNameFromId,
			kindLiteralText,
			importFailure: null
		};
	}
	try {
		const factoryModule = await import(new URL(factoryModulePath, import.meta.url).pathname);
		factoryMap = factoryModule._factoryMap ?? {};
		// Validator-only metadata lives in node-model.json5 (PR-K) — pure
		// data, loaded separately from the factory functions.
		const mapData = await loadNodeModel(grammar);
		factoryShapes = mapData.factoryShapes;
		fieldAliasMap = mapData.fieldAliasMap;
		factoryFields = mapData.factoryFields;
		factorySlots = mapData.factorySlots;
		polymorphVariants = mapData.polymorphVariants;
		const typesModulePath = FACTORY_MODULE_PATHS[grammar]?.replace('factories/raw.ts', 'types.ts');
		if (typesModulePath) {
			try {
				const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
				// KIND_NAMES (not KIND_DISPLAY_NAMES): this validator's `kind`
				// resolution feeds factoryMap/factoryShapes/factoryFields lookups,
				// which are keyed by the canonical (wrap-dispatch) catalog name —
				// the same identity `wrapNode` stamps. KIND_DISPLAY_NAMES is
				// tree-sitter's raw parse label, which collapses distinct
				// canonical kinds sharing one display name (python's `block`
				// (160) and `_match_block` (135) both display as "block") onto
				// the wrong factory, producing a false `$type` mismatch even
				// though the wrapped reference and a correctly-selected factory
				// would agree.
				const kindNamesMap = typesModule.KIND_NAMES as ReadonlyMap<number, string> | undefined;
				if (kindNamesMap) {
					kindNameFromId = (id: number) => kindNamesMap.get(id);
				}
				kindLiteralText = typesModule.KIND_LITERAL_TEXT as ReadonlyMap<number, string> | undefined;
			} catch (e) {
				// Without kindNameFromId every walked candidate is rejected (its
				// numeric $type can't be resolved to a kind name), so the validator
				// would silently report an empty 0/0 pass. Route this into the same
				// failure path as a factory-module load failure instead of
				// continuing with a resolver that can never succeed.
				const message = `[validate-factory-roundtrip] failed to load ${typesModulePath}: ${(e as Error)?.message ?? e}`;
				console.error(message);
				return {
					factoryMap,
					factoryShapes,
					fieldAliasMap,
					factoryFields,
					factorySlots,
					polymorphVariants,
					kindNameFromId,
					kindLiteralText,
					importFailure: { message }
				};
			}
		}
		return {
			factoryMap,
			factoryShapes,
			fieldAliasMap,
			factoryFields,
			factorySlots,
			polymorphVariants,
			kindNameFromId,
			kindLiteralText,
			importFailure: null
		};
	} catch (e) {
		const message = `[validate-factory-roundtrip] failed to load ${factoryModulePath}: ${(e as Error)?.message ?? e}`;
		console.error(message);
		return {
			factoryMap,
			factoryShapes,
			fieldAliasMap,
			factoryFields,
			factorySlots,
			polymorphVariants,
			kindNameFromId,
			kindLiteralText,
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

/**
 * Dispatch `referenceData` through the appropriate factory call convention
 * and return the resulting `NodeData`. Factory lookup uses the walked
 * (source) kind so that alias-source factories are preferred over
 * alias-target factories, keeping the output `$type` aligned with our
 * declared interfaces. Errors thrown by the factory are pushed to `errors`
 * and `null` is returned so the caller can skip the comparison step.
 *
 * @param referenceData - Fully materialized NodeData from the wrapped read tree.
 * @param renderedKind - The walked (source) kind — used for factory + shape lookup.
 * @param cstNodeKindHint - CST node-kind fallback when the wrapper node itself discriminates the variant.
 * @param firstNamedChildKindHint - First CST named-child fallback for legacy callers.
 * @param namedChildKindHints - Ordered CST named-child fallback candidates.
 * @param factoryMap - Map from kind to factory function.
 * @param factoryShapes - Codegen-produced calling-convention map per kind.
 * @param fieldAliasMap - Camel→snake alias map used by `nodeToConfig`.
 * @param factoryFields - Declared field list per kind used by `nodeToConfig`.
 * @param factorySlots - Declared slot metadata per kind used by `nodeToConfig`.
 * @param entryName - Corpus entry name, used when recording errors.
 * @param inputSource - Original source text, used when recording errors.
 * @param errors - Mutable error list to append to on factory throw.
 * @returns The factory-produced `AnyNodeData`, or `null` if the factory threw.
 */
function buildFactoryNodeData(
	referenceData: AnyNodeData,
	renderedKind: string,
	cstNodeKindHint: string | undefined,
	firstNamedChildKindHint: string | undefined,
	namedChildKindHints: readonly string[],
	factoryMap: Record<string, (config?: any) => unknown>,
	factoryShapes: Record<string, FactoryShape>,
	fieldAliasMap: Record<string, Record<string, string>>,
	factoryFields: Record<string, readonly string[]>,
	factorySlots: Record<string, Record<string, FactorySlotMeta>>,
	polymorphVariants: PolymorphVariantMap,
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
	kindLiteralText?: ReadonlyMap<number, string>
): AnyNodeData | null {
	const factory = factoryMap[renderedKind];
	if (!factory) return null;
	try {
		return buildFactoryNodeFromReference(
			referenceData,
			renderedKind,
			{ factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants },
			{ cstNodeKindHint, firstNamedChildKindHint, namedChildKindHints, kindNameFromId, kindLiteralText }
		) as AnyNodeData | null;
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

export async function validateFactoryRenderParse(
	grammar: string,
	templatesPath: string,
	backend: 'native' | 'js' = 'native'
): Promise<FactoryRenderParseResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	loadRawEntries(grammar);
	const ruleKinds = deriveRuleKinds(templatesPath);

	const {
		factoryMap,
		factoryShapes,
		fieldAliasMap,
		factoryFields,
		factorySlots,
		polymorphVariants,
		kindNameFromId,
		kindLiteralText,
		importFailure
	} = await loadFactoryModuleForGrammar(grammar);

	const readTreeNodeFn = await loadReadTreeNode(grammar);

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
	let skip = 0;
	let total = 0;

	recordFactoryModuleLoadFailure(importFailure, errors);
	if (importFailure) {
		return {
			grammar,
			total: 0,
			pass: 0,
			fail: 0,
			skip: 0,
			astMatchPass: 0,
			errors,
			astMismatches: []
		};
	}

	// This validator's storage comparison only has meaning against the
	// wrapped NATIVE read path (readTreeNodeFn + handle.read). Without it,
	// every candidate below would be silently rejected and the run would
	// report a misleading "0/0 pass" instead of a real failure. Probe
	// availability up front and fail loudly instead of skipping.
	let readPathFailure: string | undefined;
	if (!readTreeNodeFn) {
		readPathFailure = `wrap module unavailable for '${grammar}' — no wrapped-tree read function`;
	} else {
		try {
			const probeTree = parser.parse('') as TSTree;
			const probeHandle = buildReadHandle(grammar, probeTree, '', backend, undefined);
			if (!probeHandle.read) {
				readPathFailure = `backend '${backend}' has no wrapped native read path (handle.read unavailable) — factory storage validation requires the native backend`;
			}
		} catch (e) {
			readPathFailure = `failed to build native read handle: ${(e as Error)?.message ?? e}`;
		}
	}
	if (readPathFailure || !readTreeNodeFn) {
		const message = `[validate-factory-roundtrip] ${readPathFailure ?? 'wrap module unavailable — no wrapped-tree read function'}`;
		errors.push({ kind: '(read-tree-unavailable)', message });
		return {
			grammar,
			total: 0,
			pass: 0,
			fail: 1,
			skip: 0,
			astMatchPass: 0,
			errors,
			astMismatches: []
		};
	}

	for (const entry of entries) {
		const tree1 = parser.parse(entry.source) as TSTree;
		if (tree1.rootNode.hasError) continue;

		// Same read path as read-render-parse: build the native read handle,
		// then walk the WRAPPED tree once. Every node arrives as its true
		// source kind, so no separate wrapper/effective-kind reconciliation
		// dance is needed (the old readNodeAt-based single-node read here
		// required exactly that, and its non-recursive nodeToConfig call
		// left child fields as unresolved stubs — the root cause of the
		// native transport's "Missing field" errors once render was fixed
		// to use the native engine).
		const handle = buildReadHandle(grammar, tree1, entry.source, backend, undefined);
		const wrappedRoot = readTreeNodeFn(handle) as WrappedNodeData;
		const candidatesByKind = new Map<string, { start: number; end: number; node: WrappedNodeData }[]>();
		const seen = new Set<string>();
		walkWrappedTree(wrappedRoot, (w: WrappedNodeData) => {
			if (w.$named === false) return;
			const sourceKind = kindNameFromId ? kindNameFromId(w.$type) : undefined;
			if (sourceKind === undefined || !ruleKinds.has(sourceKind)) return;
			const span = (w as { $span?: { start: number; end: number } }).$span;
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
				total++;

				const node1 =
					findNodeBySpanOfKind(tree1.rootNode, cand.start, cand.end, kind) ??
					findNodeBySpan(tree1.rootNode, cand.start, cand.end);
				const inputSource = node1 ? node1.text : entry.source.slice(cand.start, cand.end);

				// Canonical reference: what a real parse+read produces for
				// this node, fully materialized (no lazy $nodeHandle stubs).
				// $text is handled per-node by the comparator itself (see
				// isTextShapeNode) rather than stripped here.
				const referenceData = materializeWrappedNodeData(cand.node);

				const cstNamedChildKinds = node1 ? namedChildKinds(node1) : [];

				const factoryData = buildFactoryNodeData(
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
					polymorphVariants,
					entry.name,
					inputSource,
					errors,
					kindNameFromId,
					kindLiteralText
				);
				if (factoryData === null) {
					// No factory for this kind, or the factory threw (already
					// recorded). Either way there's nothing to compare.
					skip++;
					continue;
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

	emitValidatorMetrics();
	return {
		grammar,
		total,
		pass,
		fail: total - pass - skip,
		skip,
		astMatchPass: pass,
		errors,
		astMismatches: dedupeMismatchesByContainment(astMismatches)
	};
}

export function formatFactoryRenderParseReport(result: FactoryRenderParseResult): string {
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
	return lines.join('\n');
}
