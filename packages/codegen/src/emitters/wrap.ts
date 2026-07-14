/**
 * Emits wrap.ts — de-hoisted lazy view layer over readNode output.
 *
 * Mirrors the factory emitter (factories.ts) shape A one-for-one:
 *   - `_<name>` storage keys (enumerable, serializable stubs from readNode de-hoisted output)
 *   - Inline method shorthand `name()` accessors that perform lazy drill-in
 *   - Inline `$with` property that calls the factory for updates
 *   - `withMethods<T>` from per-grammar `./utils.js` wraps the literal
 *   - No `Object.defineProperty`, no `freezeNodeData`, no `Record<string,unknown>` casts
 *
 * Consumes NodeMap directly. No routing-map / override-field-promotion
 * emission — the compiled override grammar bakes all field() placements
 * into the tree-sitter parser, so tree-sitter's native
 * `fieldNameForChild` is the single source of truth at runtime.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { AssembledEnum, AssembledNode, AssembledSupertype } from '../compiler/model/node-map.ts';
import type { AssembledSeparatedList } from '../compiler/model/node-map.ts';
import { AssembledNonterminal, aliasTargetToSourceMapOf, valueParseKindsOf } from '../compiler/model/node-map.ts';
import type { Rule } from '../types/rule.ts';

type BranchLikeForWrap = Extract<AssembledNode, { modelType: 'branch' }>;
import { deriveUnnamedChildrenCardinality } from '../compiler/model/node-map.ts';
import {
	collectAliasTargetToSourceMap,
	isMultiple,
	isNonEmpty,
	isRequired,
	resolveFieldStorageInfo,
	classifyChildFactorySurface,
	classifyWrapEmission,
	warnSkippedParserSymbol,
	isSlotBearingCompound
} from './shared.ts';
import { fieldElementType, childElementType, childrenSetterRestType } from './factories.ts';
import { deriveChildrenKinds } from './transport-common.ts';
import {
	collectKindEntries,
	kindIdMemberName,
	hasCatalogEntry,
	kindDiscriminantExpr,
	collectCatalogKinds,
	type KindEnumEntry
} from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';
import { expandRuntimeDiscriminatorKinds } from './factory-map.ts';

// Local view-layer slot descriptor: the minimal `{ name, storageKey, arity }`
// surface wrap.ts consumes. `AssembledNonterminal` structurally satisfies it
// (it exposes `name`, `storageKey`, and `arity` getters — the single source of
// truth for those derivations), so emitFieldCarryingWrap passes `f` directly.
// The shape is retained only for the synthetic unnamed-children slot, which is
// not a class instance (see resolveUnnamedSlotConfig; reworked in task B).
interface SlotModel {
	readonly name: string;
	readonly storageKey: string;
	readonly arity: 'one' | 'many';
}

export interface EmitWrapConfig {
	grammar: string;
	nodeMap: NodeMap;
	/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * per-kind wrap functions stamp `$type: TSKindId.X` to convert the string
	 * from core's readNode to the numeric runtime discriminant. When absent,
	 * $type is inherited from data (string passthrough — legacy mode).
	 */
	generatedIdTables?: GeneratedIdTables;
	/**
	 * Kind names listed in the grammar's `inline:` array. When a kind has no
	 * parser symbol AND appears here, it's a deliberately inlined rule — warn
	 * and skip. When absent from this list, it's a codegen bug — throw.
	 */
	inlineKinds?: readonly string[];
	/**
	 * Kind names synthesized by evaluate's inline-alias-source pass. No parser
	 * symbol by design; warn and skip.
	 */
	synthesizedKinds?: ReadonlySet<string>;
	kindEntries?: readonly KindEnumEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collects the set of concrete interface type names that need to be imported.
 *
 * Wrap functions return `AnyNodeData` (not `WrappedNode<T>`), so no
 * per-kind type imports are needed. Returns an empty set.
 *
 * @param _nodeMap - The fully assembled node map for the grammar (unused).
 * @returns An empty set — no per-kind type imports needed.
 */
function collectTypeImports(_nodeMap: NodeMap): Set<string> {
	// Wrap functions return AnyNodeData; no WrappedNode<T> per-kind type
	// imports required.
	return new Set<string>();
}

// ---------------------------------------------------------------------------
// Namespace — taxonomy-keyed wrap dispatch API
// ---------------------------------------------------------------------------

/**
 * Taxonomy-keyed wrap dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
export namespace wrap {
	/**
	 * Emit a branch wrap function — field-carrying (handles both regular
	 * and container shapes; fields is `[]` for the container case).
	 */
	export function branch(
		output: string[],
		node: BranchLikeForWrap,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		// NOTE: class getters are NOT enumerable, so we must pass explicitly
		// rather than relying on { ...node } to capture prototype-defined
		// getters like `rawFactoryName`.
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				childSurface: classifyChildFactorySurface(node, nodeMap)
			},
			node.fields,
			[],
			kindEntries,
			nodeMap
		);
		output.push(result);
	}

	/**
	 * Emit a group wrap function — hidden structural helpers still need lazy
	 * accessors so native read payloads can drill through their child stubs.
	 */
	export function group(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'group' }>,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				childSurface: classifyChildFactorySurface(node, nodeMap)
			},
			node.fields,
			[],
			kindEntries,
			nodeMap
		);
		output.push(result);
	}

	export function supertype(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'supertype' }>,
		_kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(emitTransparentSupertypeWrap(node));
	}

	/**
	 * Emit a separatedList wrap function — per-instance separator capture
	 * (`_content`/`_separator_kind`/`_leading_sep`/`_trailing_sep`). See
	 * `emitSeparatedListWrap`'s doc comment for the wire-shape rationale.
	 */
	export function separatedList(
		output: string[],
		node: AssembledSeparatedList,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		const result = emitSeparatedListWrap(node, kindEntries, nodeMap);
		if (result !== undefined) output.push(result);
	}
}

// ---------------------------------------------------------------------------
// Field-carrying wrap — shape A inline literal + withMethods<T>
// ---------------------------------------------------------------------------

interface WrapNode {
	readonly kind: string;
	readonly typeName: string;
	/** rawFactoryName for $with — null when the kind has no factory. */
	readonly rawFactoryName?: string;
	/** Child-factory surface when the node exposes positional child factories. */
	readonly childSurface?: 'direct' | 'spread' | null;
}

/**
 * Builds a map from supertype kind name to its resolved transitive member set.
 * Used by the emitted `SUPERTYPE_MEMBERS` const in wrap.ts to enable
 * `_matchesAllowedWrapKind` to correctly match concrete kinds against
 * grammar-declared supertypes (e.g., "identifier" against "_expression").
 */
function buildSupertypeMembersMap(nodeMap: NodeMap): Map<string, string[]> {
	const expandMembers = (kind: string, seen: Set<string>): string[] => {
		if (seen.has(kind)) return [];
		seen.add(kind);
		const node = nodeMap.nodes.get(kind);
		if (!node) return [kind];
		if (node.modelType === 'enum')
			return (node as AssembledEnum).resolvedKinds.length > 0 ? [...(node as AssembledEnum).resolvedKinds] : [kind];
		if (node.modelType !== 'supertype') return [kind];
		const members = new Set<string>();
		for (const subtype of (node as AssembledSupertype).subtypes) {
			members.add(subtype);
			if (subtype.startsWith('_')) members.add(subtype.slice(1));
			for (const member of expandMembers(subtype, seen)) {
				members.add(member);
				if (member.startsWith('_')) members.add(member.slice(1));
			}
		}
		return [...members];
	};

	const out = new Map<string, string[]>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		out.set(kind, expandMembers(kind, new Set()));
	}
	return out;
}

/**
 * Resolve the drill-in expression for a field storage assignment.
 * Returns the raw-field read expression AND the inline accessor body.
 *
 * @param f - The assembled nonterminal field descriptor.
 * @param nodeMap - The assembled node map, needed to derive the per-field
 *   element type for generic type arguments on drill helpers.
 * @returns An object with `storeExpr` (storage init from `data` via
 *   `readRawField` — bridges the `AnyNodeData` type which doesn't
 *   declare per-kind `_<name>` properties) and `accessorBody` (reads
 *   `this._<name>` directly — the literal declares the property so
 *   TS resolves it from the inferred literal type).
 */
interface ResolveSlotDrillConfig {
	readonly dataExpr: string;
	readonly elemType: string;
	readonly required: boolean;
	readonly nonEmpty?: boolean;
	readonly alias?: readonly [string, string];
	readonly storageInfo?: ReturnType<typeof resolveFieldStorageInfo>;
	readonly allowedKinds?: readonly string[];
	/**
	 * Optional list of concrete `_<kind>` storage keys to probe in lieu of
	 * the slot's nominal single key. When set, the storeExpr becomes a
	 * `??`-coalesce chain over these keys. See `collectConcreteStorageKeys`.
	 */
	readonly candidateStorageKeys?: readonly string[];
	/**
	 * Pre-built numeric-kindId array expression (e.g. `[TSKindId.DotDotEq,
	 * TSKindId.DotDot]`) for a kindEnum slot's member discriminants. Drives the
	 * `$other` reclamation fallback (option B). Built by the caller, which holds
	 * `nodeMap` + `kindEntries` for `kindDiscriminantExpr` resolution.
	 */
	readonly reclaimKindIdsExpr?: string;
}

function resolveSlotDrillExprs(
	slot: SlotModel,
	config: ResolveSlotDrillConfig
): {
	storeExpr: string;
	accessorBody: string;
} {
	const slotStoreExpr = resolveSlotStoreExpr(slot, config.dataExpr, config.candidateStorageKeys);
	const filteredStoreExpr =
		config.allowedKinds && config.allowedKinds.length > 0
			? `_filterWrapChildrenByKind(${slotStoreExpr}, ${JSON.stringify(config.allowedKinds)})`
			: slotStoreExpr;
	const diagnosticContextExpr = `{ tree, nodeType: ${config.dataExpr}.$type, slotName: ${JSON.stringify(slot.name)}, span: (${config.dataExpr} as _NodeData).$span }`;
	// $other reclamation (option B): a kindEnum slot's value is a terminal
	// discriminant (operator / keyword). When that token is anonymous and
	// unfielded, read_node forwards it to `$other`, not `_<kind>` storage, so
	// the nominal `??`-chain comes up empty. Append a final fallback that
	// reclaims it from `$other` by numeric kindId (`config.reclaimKindIdsExpr`,
	// the kindEnum member discriminants). When the token IS field-tagged the
	// chain short-circuits and the fallback is inert.
	const reclaimedStoreExpr =
		config.storageInfo?.kind === 'kindEnum' && config.reclaimKindIdsExpr
			? `(${filteredStoreExpr} ?? readTerminalFromOther(${config.dataExpr}, ${config.reclaimKindIdsExpr}))`
			: filteredStoreExpr;
	const normalizedStoreExpr =
		slot.arity === 'many'
			? `normalizeRepeatedWrapSlot(${reclaimedStoreExpr}, ${config.nonEmpty ? 'true' : 'false'}, ${JSON.stringify(slot.name)}, ${diagnosticContextExpr})`
			: `normalizeSingularWrapSlot(${reclaimedStoreExpr}, ${JSON.stringify(slot.name)}, ${config.required ? 'true' : 'false'}, ${config.dataExpr}.$type, ${diagnosticContextExpr})`;
	const storageInfo = config.storageInfo;
	if (storageInfo?.kind === 'boolean') {
		return {
			storeExpr: `coerceBooleanKeywordStorage(${normalizedStoreExpr})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	if (storageInfo?.kind === 'bitflag') {
		return {
			storeExpr: `coerceBitflagStorage(${normalizedStoreExpr}, ${bitflagTextsExpr(storageInfo.texts)})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	if (storageInfo?.kind === 'kindEnum') {
		return {
			storeExpr: `projectKindEnumStorage(${normalizedStoreExpr})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	if (config.alias) {
		const [fromType, toType] = config.alias;
		if (slot.arity === 'many') {
			return {
				storeExpr: normalizedStoreExpr,
				accessorBody: `return drillAsAll<${config.elemType}>(this.${slot.storageKey}, tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`
			};
		}
		const returnType = config.required ? config.elemType : `${config.elemType} | undefined`;
		return {
			storeExpr: normalizedStoreExpr,
			accessorBody: `return drillAs<${returnType}>(this.${slot.storageKey}, tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`
		};
	}
	return {
		storeExpr: normalizedStoreExpr,
		accessorBody: resolveSlotAccessorBody(
			slot,
			slot.arity === 'many' ? config.elemType : config.required ? config.elemType : `${config.elemType} | undefined`
		)
	};
}

interface UnnamedChildrenSlotConfig {
	readonly slot: SlotModel;
	readonly elemType: string;
	readonly required: boolean;
	readonly nonEmpty: boolean;
	readonly allowedKinds: readonly string[];
}

function resolveUnnamedSlotConfig(
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap
): UnnamedChildrenSlotConfig {
	const cardinality = deriveUnnamedChildrenCardinality(children);
	return {
		slot: {
			name: 'children',
			storageKey: '$other',
			arity: children.length === 1 && !cardinality.multiple ? 'one' : 'many'
		} satisfies SlotModel,
		elemType: childElementType({ children }, nodeMap),
		required: cardinality.required,
		nonEmpty: cardinality.nonEmpty,
		allowedKinds: [...new Set(children.flatMap((child) => deriveChildrenKinds(child, nodeMap)))]
	};
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
}

function resolveSlotAliasRewrite(slot: AssembledNonterminal): readonly [string, string] | undefined {
	const aliases = Object.entries(aliasTargetToSourceMapOf(slot));
	if (aliases.length !== 1) return undefined;
	return aliases[0];
}

/**
 * For a kind-origin slot whose `values[]` reference one or more concrete
 * grammar kinds (possibly through a supertype), collect the concrete
 * `_<kind>` storage keys the runtime reader will populate.
 *
 * Background (spec 2026-05-17 kind-named slots):
 *   The native reader routes UNNAMED-but-named CST children by their
 *   `child.kind()` (the CONCRETE kind, e.g. `identifier`, `call_expression`).
 *   That becomes the `_<kind_name>` storage key in the serialized NodeData.
 *
 *   For a grammar rule like `await_expression: seq($._expression, '.', 'await')`
 *   the slot is named after the supertype (`expression`), but the data on the
 *   wire is keyed by the CONCRETE subtype (`_identifier`, `_call_expression`,
 *   ...). Accessing `data._expression` always returns undefined.
 *
 *   This helper expands each value's referenced kind through
 *   `expandRuntimeDiscriminatorKinds`, which normalizes the leading
 *   underscore on supertype names and walks the supertype tree to enumerate
 *   concrete subtypes. The result is a list of concrete `_<kind>` keys —
 *   exactly one of which will be populated on the data object at runtime.
 *
 * Returns undefined when expansion produces a single key that already
 * matches the slot's nominal `_<slot.name>` — the legacy single-key access
 * is sufficient and no probe shape is needed.
 */
function collectConcreteStorageKeys(slot: AssembledNonterminal, nodeMap: NodeMap): readonly string[] | undefined {
	if (!slot.isUnnamed) return undefined;
	// Route by the slot's parse-names — the kinds the parser can actually emit:
	// ref-kinds PLUS alias targets (collect-slots now folds the targets into
	// parseNames). Expand supertypes. No base→variant rewrite: parseNames
	// already carries both the base kind (validation-only polymorph variants,
	// which the parser emits as the base — e.g. type_query's
	// instantiation_expression) AND the alias target (real tree-sitter aliases
	// like decorator, which the parser emits as the target). The old rewrite
	// REPLACED base with target, mis-routing the validation-only case.
	const refKinds = [...slot.parseNames];
	if (refKinds.length === 0) return undefined;
	const concrete = expandRuntimeDiscriminatorKinds(refKinds, nodeMap);
	if (concrete.length === 0) return undefined;
	const storageKeys = [...new Set(concrete.map((k) => `_${k}`))];
	const legacyKey = `_${slot.name}`;
	if (storageKeys.length === 1 && storageKeys[0] === legacyKey) {
		return undefined;
	}
	return storageKeys;
}

/**
 * Union the wire-only `_<kind>` storage keys (see `collectConcreteStorageKeys`)
 * across every field of a wrap function, mapped to the SAME element type as
 * the field's own canonical key (`fieldElementType`) — not a generic
 * catch-all. This matters: each probe key feeds the same `??`-coalesce /
 * `_concatInSourceOrder` expression as the field's canonical key, whose
 * result flows (via the generic `normalizeSingularWrapSlot<T>` /
 * `normalizeRepeatedWrapSlot<T>` helpers) into a `drillIn<ElemType>`-typed
 * accessor. A broad probe-key type would widen that inferred `T`, breaking
 * the accessor's explicit generic argument — so precision here isn't
 * cosmetic, it's required for the coalesce chain to type-check.
 *
 * Excludes each field's own canonical `storageKey` (already declared on the
 * canonical `T.X` interface). When the SAME wire key is probed by more than
 * one field with different element types (a key collision that can't
 * actually happen at runtime — a physical key holds one value shape — but
 * isn't structurally impossible to encode), the member types are unioned.
 */
function collectWrapWireKeyTypes(
	fields: readonly AssembledNonterminal[],
	nodeMap: NodeMap
): ReadonlyMap<string, string> {
	// A wire key that coincides with SOME OTHER field's own canonical
	// `storageKey` (e.g. a `block`-aliased field sharing the physical wire
	// key with an unrelated `_block` field — tree-sitter alias-source
	// sharing) is already declared, with its own authoritative type, on the
	// canonical `T.X` interface. Adding a second, differently-typed member
	// for that same key would form an incoherent property-type intersection
	// (e.g. `Block & (SimpleStatements | Newline)`) and break assignability
	// at every existing `T.X`-typed call site. The field that legitimately
	// owns that key already reads it through its canonical declaration; skip
	// re-declaring it here.
	const canonicalKeys = new Set(fields.map((f) => f.storageKey));
	const keyTypes = new Map<string, string>();
	for (const f of fields) {
		const candidates = collectConcreteStorageKeys(f, nodeMap);
		if (!candidates) continue;
		const elemType = fieldElementType(f, nodeMap);
		// `resolveSlotStoreExpr`'s `arity: 'many'` branch documents that each
		// wire candidate key may hold EITHER a scalar (text-collapsed leaf) OR
		// an array of node stubs — that's what `_toArr`/`_concatInSourceOrder`
		// normalize. Mirror that shape here (same widening pattern as
		// `resolveSlotAccessorBody`'s `arrayElemType`), or the declared type
		// would be narrower than what the runtime actually delivers.
		const candidateType =
			f.arity === 'many'
				? `${elemType} | readonly ${elemType.includes(' | ') ? `(${elemType})` : elemType}[]`
				: elemType;
		for (const k of candidates) {
			if (k === f.storageKey || canonicalKeys.has(k)) continue;
			const existing = keyTypes.get(k);
			keyTypes.set(
				k,
				existing === undefined || existing === candidateType ? candidateType : `${existing} | ${candidateType}`
			);
		}
	}
	return keyTypes;
}

/**
 * Build the wrap function's `data` parameter type: the canonical `T.X`
 * interface widened with the wire-only keys the function body actually
 * reads/writes (`_<concreteKind>` probe keys from `collectWrapWireKeyTypes`,
 * and/or `$other`). The canonical interface intentionally omits these —
 * they're wire-shape artifacts, not part of the public `T.X` surface — so
 * the wrap body needs a widened LOCAL view. All added members are optional,
 * so `T.X` values remain assignable to the widened type (no cast needed at
 * existing `T.X`-typed call sites).
 *
 * `otherType`, when provided, is the PRECISE type for `$other` (e.g.
 * `T.Condition | readonly T.Condition[]` for a transparent supertype whose
 * body reads `data.$other` through the same generic-inference chain as the
 * field probe keys above — see `emitTransparentSupertypeWrap`). Pass a
 * generic fallback for call sites that only ever WRITE `$other` inside a
 * `{ ...data, $other: v }` argument literal (no local read, so no inference
 * chain to keep narrow — see the `childSurface` branch in
 * `emitInlineWithProperty`).
 */
function buildWrapParamType(typeName: string, wireKeyTypes: ReadonlyMap<string, string>, otherType?: string): string {
	if (wireKeyTypes.size === 0 && otherType === undefined) return `T.${typeName}`;
	const members = [
		...[...wireKeyTypes].map(([k, t]) => `readonly ${JSON.stringify(k)}?: ${t};`),
		...(otherType !== undefined ? [`readonly $other?: ${otherType};`] : [])
	];
	return `T.${typeName} & { ${members.join(' ')} }`;
}

// `_<ident>` where ident is a valid JS identifier suffix. Keys outside this
// shape must be accessed via bracket notation. Tree-sitter exposes some kinds
// as literal token strings (`'`, `$`, `.`), which become storage keys like
// `_'` / `_$` / `_.` — all valid object keys but invalid dotted accessors.
const SAFE_IDENT_KEY = /^_[A-Za-z_$][A-Za-z0-9_$]*$/;

function dataAccessExpr(dataExpr: string, storageKey: string): string {
	if (SAFE_IDENT_KEY.test(storageKey)) {
		return `${dataExpr}.${storageKey}`;
	}
	return `${dataExpr}[${JSON.stringify(storageKey)}]`;
}

function resolveSlotStoreExpr(slot: SlotModel, dataExpr: string, candidateKeys?: readonly string[]): string {
	if (candidateKeys && candidateKeys.length > 0) {
		// Probe the slot's own canonical storage key WITH PRIORITY over the
		// concrete-kind candidate keys, rather than as a final fallback. On a
		// genuinely fresh wire read the reader never populates the canonical
		// key (only the concrete-kind-keyed candidates), so this is a no-op for
		// that case. But `$with` setters re-invoke the wrap function via
		// `{ ...data, [storageKey]: v }` (see `emitInlineWithProperty`), which
		// spreads the ORIGINAL data — carrying the stale candidate-key values
		// from the original read — alongside the newly patched canonical key.
		// Probing candidates first would mask the patched value entirely
		// (singular: the stale `??` operand wins) or merge stale-and-patched
		// (repeated: concat includes both) — the canonical key must win
		// outright once populated. Exclude it from the candidate list itself
		// so it isn't probed twice.
		const candidates = candidateKeys.filter((k) => k !== slot.storageKey);
		const canonicalExpr = dataAccessExpr(dataExpr, slot.storageKey);

		if (slot.arity === 'many') {
			// Repeated supertype-list slot: the runtime reader populates EACH
			// concrete-kind wire field as a separate array (e.g. `_primitive_type:
			// ["i32"]`, `_type_identifier: ["String"]`). A ??-coalesce returns
			// only the first non-null source, dropping the rest.
			// Concatenate ALL source arrays instead, preserving child order
			// (each kind-keyed array is already in source order; cross-kind
			// ordering within a single slot relies on child position in the CST,
			// which the reader preserves within each kind bucket — interleaved
			// ordering across kinds is not guaranteed, but all elements are kept).
			//
			// Each wire field may be a scalar value (text-collapsed leaf, e.g.
			// "i32" for primitive_type) OR an array of node stubs. The native
			// reader buckets by kind, so a plain declaration-order concat
			// interleaves cross-kind members wrongly (e.g. an object_type's
			// `call_signature` + `property_signature` swap). `_concatInSourceOrder`
			// normalizes each source (via _toArr) and STABLE-sorts the result by
			// CST position (`$span.start` / `$childIndex`) to restore source order.
			//
			// The canonical key, once populated by a `$with` setter, is
			// authoritative on its own — normalize it (scalar-or-array, via the
			// same `_toArr` the concat path uses) rather than merging it into
			// the candidate concat.
			const sources = candidates.map((k) => dataAccessExpr(dataExpr, k));
			const candidateExpr = sources.length > 0 ? `_concatInSourceOrder([${sources.join(', ')}])` : '[]';
			return `(${canonicalExpr} !== undefined ? _toArr(${canonicalExpr}) : ${candidateExpr})`;
		}

		// Singular slot: exactly one of these will be populated on a fresh
		// read; the canonical key wins outright once a `$with` setter patches it.
		const probes = [canonicalExpr, ...candidates.map((k) => dataAccessExpr(dataExpr, k))];
		return `(${probes.join(' ?? ')})`;
	}
	return dataAccessExpr(dataExpr, slot.storageKey);
}

function resolveSlotAccessorBody(slot: SlotModel, valueType: string): string {
	if (slot.arity === 'many') {
		const arrayElemType = valueType.includes(' | ') ? `(${valueType})` : valueType;
		return `return drillInAll<${valueType}>(this.${slot.storageKey} as readonly ${arrayElemType}[] | undefined, tree)`;
	}
	return `return drillIn<${valueType}>(this.${slot.storageKey}, tree)`;
}

function emitTransparentSupertypeWrap(node: AssembledSupertype): string {
	const fn = `wrap${node.typeName}`;
	const allowedKinds = [
		...new Set(node.subtypes.flatMap((kind) => (kind.startsWith('_') ? [kind, kind.slice(1)] : [kind])))
	];
	// `data.$other` flows through the generic `_filterWrapChildrenByKind<T>` /
	// `normalizeSingularWrapSlot<T>` helpers into an explicit
	// `drillIn<T.${typeName}>(...)` check below — the inferred `T` must stay
	// exactly `T.${typeName}` (the supertype's own member union), or the
	// explicit generic argument mismatches. Array-inclusive: the wire may
	// deliver the single member wrapped in a 1-element array.
	const paramType = buildWrapParamType(node.typeName, new Map(), `T.${node.typeName} | readonly T.${node.typeName}[]`);
	return [
		`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`,
		`  return drillIn<T.${node.typeName}>(normalizeSingularWrapSlot(_filterWrapChildrenByKind(data.$other, ${JSON.stringify(allowedKinds)}), "children", true, data.$type, { tree, nodeType: data.$type, slotName: "children", span: (data as _NodeData).$span }), tree);`,
		`}`
	].join('\n');
}

/**
 * Recursively collect candidate separator token kind names from a
 * nonterminal separator rule (`AssembledSeparatedList.separatorRule`) —
 * walks CHOICE/GROUP/OPTIONAL down to STRING/SYMBOL leaves, gathering the
 * set of literal texts / referenced rule names the runtime `$other` scan
 * must match against. A plain leaf-collecting walk, not related to
 * `link.ts`'s flank-absorption (which does structural `rulesEqual`
 * comparison between two rule trees — a different mechanism entirely).
 *
 * Throws on any rule shape this walk doesn't know how to resolve to a
 * kind-discriminant leaf (e.g. a `SEQ`-shaped separator — a genuinely
 * different scenario needing multi-token matching, not a single kind-id
 * probe) — no real grammar currently sets a nonterminal `separatorRule`
 * at all (see `emitSeparatedListWrap`'s doc comment), so a silent `[]`
 * here would make `_separator_kind` silently always resolve to
 * `undefined` for whatever future kind first reaches this gap, rather
 * than failing loudly at codegen time the way `kindDiscriminantExpr`
 * (this file) already does for its own unresolvable-kind case.
 *
 * Exported for reuse by render-module.ts, which needs the SAME candidate
 * set to resynthesize `_separator_kind`'s literal text on the render side
 * (see `buildSeparatorKindMatchLines` there) — the render-side match arms
 * must enumerate exactly the kinds this wire-capture walk can produce, or
 * a real runtime `_separator_kind` value could hit the render match's
 * fallback arm instead of its correct literal.
 */
export function collectSeparatorCandidateKindNames(rule: Rule<'link'>): string[] {
	switch (rule.type) {
		case 'STRING':
			return [rule.value];
		case 'SYMBOL':
			return [rule.name];
		case 'CHOICE':
			return rule.members.flatMap((m) => collectSeparatorCandidateKindNames(m));
		case 'GROUP':
		case 'OPTIONAL':
			return collectSeparatorCandidateKindNames(rule.content);
		default:
			throw new Error(
				`collectSeparatorCandidateKindNames: unhandled separator rule shape '${rule.type}' — ` +
					`extend this walk to resolve its kind-discriminant leaves before this kind can emit ` +
					`_separator_kind.`
			);
	}
}

/**
 * Build the synthetic `AssembledNonterminal` representing a
 * separatedList node's `elements` as a positional (unnamed) repeated
 * slot — routes through the SAME storage-info / concrete-kind-expansion
 * machinery real 'branch' repeated content fields use (`resolveFieldStorageInfo`,
 * `expandRuntimeDiscriminatorKinds`), so `_content`'s READ SOURCE matches
 * whatever kind-named wire keys the native reader actually populates for
 * these elements (verified empirically — see `collectSeparatedListContentStorageKeys`).
 * `fieldName` is intentionally left `undefined` (positional/unnamed) so
 * `valueParseKindsOf` — not a literal field name — drives that expansion;
 * the OUTPUT storage key is forced to the fixed `_content` name separately
 * (see `emitSeparatedListWrap`), decoupling "what we call it" from "where
 * the data actually lives on the wire".
 *
 * Exported for reuse by factories.ts, which needs the SAME synthetic
 * "elements as an unnamed repeated slot" to resolve the `elements`
 * constructor parameter's element type — same reuse rationale as
 * `collectSeparatorCandidateKindNames` above.
 */
export function buildSeparatedListContentSlot(node: AssembledSeparatedList): AssembledNonterminal {
	return new AssembledNonterminal({
		values: node.elements,
		fieldName: undefined,
		hasTrailing: false,
		hasLeading: false,
		sourceRuleIds: []
	});
}

/**
 * Concrete `_<kind>` wire storage keys for a separatedList's content
 * elements. Deliberately NOT `collectConcreteStorageKeys` (which elides
 * the result to `undefined` when the expansion matches the slot's OWN
 * nominal name) — `_content` is a fixed target name that never matches
 * the elements' real kind name, so that elision would silently produce
 * `data._content` (a key that does not exist on the wire; verified via
 * `probe-kind` — the native reader keys unnamed repeated children by
 * their CONCRETE kind, e.g. `data._with_item` / `data._identifier`, never
 * by a generic slot name). Always returns the real expansion instead.
 */
function collectSeparatedListContentStorageKeys(
	contentSlot: AssembledNonterminal,
	nodeMap: NodeMap
): readonly string[] {
	const parseKinds = valueParseKindsOf(contentSlot);
	if (parseKinds.length === 0) return [];
	const concrete = expandRuntimeDiscriminatorKinds(parseKinds, nodeMap);
	return [...new Set(concrete.map((k) => `_${k}`))];
}

/**
 * Union the wire-only `_<kind>` storage keys a separatedList wrap function
 * body actually reads (`collectSeparatedListContentStorageKeys`) to the
 * content slot's own element type — mirrors the SAME wire-widening pattern
 * `emitFieldCarryingWrap`'s per-field version needs for real 'branch' fields
 * (see this function's commit message for provenance).
 *
 * Excludes any candidate key that coincides with a member `T.<TypeName>`
 * already declares (its OWN canonical `_<name>` storage key, from whatever
 * naming the Task-2 `_slots` stub's `types.ts` derivation picked for this
 * kind — e.g. `_with_item` for `WithClauseBare`, already typed
 * `NonEmptyArray<WithItem>` there) — re-declaring that same key with a
 * different (optional, elemType-only) shape here would form an incoherent
 * intersection.
 */
function collectSeparatedListWireKeyTypes(
	contentSlot: AssembledNonterminal,
	canonicalKeys: ReadonlySet<string>,
	fallbackStorageKey: string,
	nodeMap: NodeMap
): ReadonlyMap<string, string> {
	const candidates = collectSeparatedListContentStorageKeys(contentSlot, nodeMap);
	const elemType = fieldElementType(contentSlot, nodeMap);
	const keyTypes = new Map<string, string>();
	for (const k of candidates) {
		if (canonicalKeys.has(k)) continue;
		keyTypes.set(k, elemType);
	}
	// `resolveSlotStoreExpr` always appends the target slot's OWN storage
	// key as a final probe fallback (its normal behavior for ANY slot whose
	// nominal key isn't already among the concrete candidates — see its doc
	// comment) — so `data[fallbackStorageKey]` is read regardless, even
	// though it is never a REAL wire key. `fallbackStorageKey` is the
	// model's OWN derived slot name (Bug B fix — `node.fields`'s real
	// storage key, e.g. `_pattern`, NOT a hardcoded `_content`; single-field
	// kinds pass their sole field's storage key here). Widen for it too
	// unless it already happens to be this kind's canonical key (the common
	// case for genuinely multi-kind content, where `types.ts`'s own
	// `_slots`-derived naming already fell back to the same generic name).
	if (!canonicalKeys.has(fallbackStorageKey)) keyTypes.set(fallbackStorageKey, elemType);
	return keyTypes;
}

/**
 * Build a separatedList wrap function's `data` parameter type: the
 * canonical `T.<TypeName>` interface widened with the wire-only members the
 * function body actually reads — the concrete-kind content probe keys
 * (`collectSeparatedListWireKeyTypes`), plus `$other` and `$span` (both read
 * directly by `_hasSeparatorFlank` / `_separatorKindOf`, and neither
 * declared on `T.<TypeName>` — that interface is the public, de-hoisted
 * surface; `$other`/`$span` are raw-wire-only). All added members are
 * optional, so real `T.<TypeName>` values remain assignable at existing
 * call sites (no cast needed there).
 */
function buildSeparatedListWrapParamType(typeName: string, wireKeyTypes: ReadonlyMap<string, string>): string {
	const members = [
		...[...wireKeyTypes].map(([k, t]) => `readonly ${JSON.stringify(k)}?: ${t};`),
		"readonly $other?: _NodeData['$other'];",
		'readonly $span?: { start: number; end: number };'
	];
	return `T.${typeName} & { ${members.join(' ')} }`;
}

/**
 * Emit a wrap function for a `'separatedList'`-classified kind — REAL
 * per-instance separator capture, replacing the Task-2 stub's
 * `_slots`-based branch-reuse emission for wrap.ts specifically (other
 * emitters — render-module.ts, factories.ts, from.ts — still read the
 * stub's `_slots`/`fields` surface; only wrap.ts, the TS SDK's deprecated
 * JS view layer, switches over here — see `AssembledSeparatedList`'s doc
 * comment: "at that point this slot-bearing surface goes away" for wrap.ts).
 *
 * Field derivation, verified against real generated grammar output
 * (`probe-kind` on python's `with_clause_bare` / `expression_statement_tuple`
 * / `lambda_parameters` and typescript's `object_type_content_comma` /
 * `object_type_content_semi` — the only 5 real `'separatedList'` kinds
 * across all 3 grammars as of this task):
 *
 * - `_content`: the elements array. The wire has NO `_content` key —
 *   the native reader buckets unnamed repeated children by their CONCRETE
 *   kind (`data._with_item`, `data._identifier`, ...; see
 *   `collectSeparatedListContentStorageKeys`). Populated via the same
 *   `resolveSlotDrillExprs` a real repeated field uses, just targeting a
 *   fixed output key instead of the kind-projected name.
 *
 * - `_leading_sep` / `_trailing_sep`: whether an optional flank separator
 *   is present in THIS instance, verified against real
 *   `object_type_content_comma`/`_semi` payloads (the one real case where
 *   BOTH `leadingMode` and `trailingMode` are simultaneously `'optional'`)
 *   and all 3 python kinds. See the emitted `_hasSeparatorFlank` runtime
 *   helper's own doc comment (below, in the generated-boilerplate section
 *   of this file) for the full span-comparison rationale and the
 *   text-collapsed-content fallback's documented ambiguity guard — kept in
 *   one place since that's what a maintainer debugging generated output
 *   actually sees.
 *
 * - `_separator_kind`: only emitted when `separatorRule` is a nonterminal
 *   (Task 2). UNVERIFIED against real wire data — no real grammar kind in
 *   any of the 3 grammars currently has a nonterminal separator (all 5
 *   real `'separatedList'` kinds have a literal `,` separator with
 *   `separatorRule === undefined`). Implemented via the SAME `$other`
 *   kind-id scan `readTerminalFromOther` already performs for kindEnum
 *   reclamation (option B) — reused, not reinvented — but this specific
 *   path has no real-grammar coverage yet.
 */
function emitSeparatedListWrap(
	node: AssembledSeparatedList,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const fn = `wrap${node.typeName}`;
	const lines: string[] = [];

	const contentSlot = buildSeparatedListContentSlot(node);
	// Bug B fix (separator-as-slot follow-up): a separatedList's elements do
	// NOT always all bucket under one generic "content" name — `node.fields`
	// (the SAME `_slots`-derived source `types.ts` derives `T.<TypeName>`'s
	// declared members from) is the model's OWN name for the real slot(s),
	// e.g. `_pattern`/`_parameters`/`_use_clause`/`_where_predicate` — NOT
	// always `_content`. Hardcoding `_content` here (independent of
	// `node.fields`) made anything whose real slot name differs throw a hard
	// "Missing field" at render time (or silently happen to coincide with
	// `_content` by luck, e.g. `tuple_pattern_group1`'s unnamed-CHOICE
	// element). `_content` (the local var below) remains an INTERNAL bucket
	// used only to feed `_hasSeparatorFlank`/`_separatorKindOf` (which need
	// the full element list's span boundaries, not any one field's subset);
	// it is no longer emitted as a storage key or accessor name itself.
	//
	// Single-field kinds (the common case: one field spans the whole element
	// union) rename the emitted property/accessor to the model's real slot
	// name. Multi-field kinds (e.g. a dict-pattern-shaped separatedList whose
	// elements route to more than one real slot by kind) route EACH field
	// through the exact same per-field drilling logic
	// `emitFieldCarryingWrap` uses (`emitFieldStorageLines`/
	// `emitFieldAccessorLines`) instead of one shared bucket.
	const canonical = node.fields.find((f) => f.arity === 'many') ?? node.fields[0]!;
	// `node.fields` (Task-2 `_slots` stub) is the SAME source `types.ts`
	// derives `T.<TypeName>`'s declared members from — the canonical-key
	// exclusion set for `collectSeparatedListWireKeyTypes` must match it
	// exactly, or a still-declared key gets redundantly (and incoherently)
	// re-widened.
	const canonicalKeys = new Set(node.fields.map((f) => f.storageKey));
	const wireKeyTypes = collectSeparatedListWireKeyTypes(contentSlot, canonicalKeys, canonical.storageKey, nodeMap);
	const paramType = buildSeparatedListWrapParamType(node.typeName, wireKeyTypes);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`);

	const storageInfo = resolveFieldStorageInfo(contentSlot, nodeMap, kindEntries);
	const candidateStorageKeys = collectSeparatedListContentStorageKeys(contentSlot, nodeMap);
	const contentModel: SlotModel = { name: canonical.name, storageKey: canonical.storageKey, arity: 'many' };
	const { storeExpr, accessorBody } = resolveSlotDrillExprs(contentModel, {
		dataExpr: 'data',
		elemType: fieldElementType(contentSlot, nodeMap),
		required: node.nonEmpty,
		nonEmpty: node.nonEmpty,
		storageInfo,
		candidateStorageKeys: candidateStorageKeys.length > 0 ? candidateStorageKeys : undefined
	});
	lines.push(`  const _content = ${storeExpr};`);
	lines.push('  return withMethods({');
	lines.push('    ...data,');
	if (kindEntries) {
		const entry = kindEntries.find((e) => e.kind === node.kind);
		if (entry) {
			lines.push(`    $type: TSKindId.${kindIdMemberName(nodeMap, node.kind)} as const,`);
		}
	}
	if (node.fields.length > 1) {
		emitFieldStorageLines(node.fields, node.kind, 'data', lines, kindEntries, nodeMap);
	} else {
		lines.push(`    ${canonical.storageKey}: _content,`);
	}
	if (node.separatorRule) {
		const candidateKindNames = collectSeparatorCandidateKindNames(node.separatorRule);
		const candidateExprs = candidateKindNames
			.filter((k) => hasCatalogEntry(kindEntries, k))
			.map((k) => kindDiscriminantExpr(k, nodeMap, kindEntries));
		lines.push(`    _separator_kind: _separatorKindOf(data, [${candidateExprs.join(', ')}]),`);
	}
	const bothFlanksOptional = node.leadingMode === 'optional' && node.trailingMode === 'optional';
	if (node.leadingMode === 'optional') {
		lines.push(`    _leading_sep: _hasSeparatorFlank(data, _content, data.$other, "leading", ${bothFlanksOptional}),`);
	}
	if (node.trailingMode === 'optional') {
		lines.push(
			`    _trailing_sep: _hasSeparatorFlank(data, _content, data.$other, "trailing", ${bothFlanksOptional}),`
		);
	}
	lines.push('');
	if (node.fields.length > 1) {
		emitFieldAccessorLines(node.fields, 'data', lines, kindEntries, nodeMap);
	} else {
		lines.push(`    ${canonical.name}() { ${accessorBody}; },`);
	}
	lines.push('    $with: {},');
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return lines.join('\n');
}

/**
 * Emit a per-kind wrap function using shape A:
 * inline object literal with `_<name>` storage, method shorthand accessors,
 * inline `$with` property, wrapped by `withMethods<T>`.
 *
 * No `Object.defineProperty`, no `freezeNodeData`, no `Record<string,unknown>` casts.
 *
 * @param node - The assembled node descriptor (kind, typeName, rawFactoryName).
 * @param fields - Named field slots for this node.
 * @param children - Unnamed child slots for this node.
 * @param kindEntries - KindEnumEntry list for numeric `$type` stamping; undefined for legacy.
 * @param nodeMap - The assembled node map (for kindIdMemberName).
 * @returns Emitted TypeScript source string for the wrap function.
 */
/**
 * Option-B reclamation collision guard. Across a kind's kindEnum slots, find
 * member kinds claimed by more than one slot — a `$other` token of that kind
 * would be ambiguous between them. Warn and return the colliding set so the
 * caller can SUPPRESS the auto-reclaim for those members (they fall back to
 * normal field population / explicit fielding — option C).
 */
function computeCollidedReclaimKinds(
	fields: readonly AssembledNonterminal[],
	ownerKind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): ReadonlySet<string> {
	const claimedBy = new Map<string, string[]>();
	for (const f of fields) {
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (storageInfo.kind !== 'kindEnum') continue;
		for (const k of storageInfo.enumKinds) {
			if (!hasCatalogEntry(kindEntries, k)) continue;
			const slots = claimedBy.get(k) ?? [];
			if (!slots.includes(f.name)) slots.push(f.name);
			claimedBy.set(k, slots);
		}
	}
	const collided = new Set<string>();
	for (const [k, slots] of claimedBy) {
		if (slots.length < 2) continue;
		collided.add(k);
		console.warn(
			`[codegen] reclaim-ambiguous: kind '${ownerKind}' has kindEnum slots ` +
				`[${slots.join(', ')}] all reclaiming member '${k}' from $other; the token is ` +
				`ambiguous between them — auto-reclaim suppressed. Field one operator (override) to resolve.`
		);
	}
	return collided;
}

/**
 * Emit per-field `_<name>: <storeExpr>,` storage assignments for `fields`,
 * reusing the exact same per-field kindEnum/verbatim/alias/candidate-
 * storage-key drilling logic regardless of which caller's kind classifies as
 * (`'branch'`/`'group'` via `emitFieldCarryingWrap`, or a MULTI-field
 * `'separatedList'` via `emitSeparatedListWrap` — e.g. a separatedList whose
 * elements route to more than one real slot by kind, not one shared
 * bucket). Extracted so both callers share ONE source for this drilling
 * decision tree instead of two copies drifting apart.
 */
function emitFieldStorageLines(
	fields: readonly AssembledNonterminal[],
	ownerKind: string,
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	// Option-B reclamation guard (pre-pass): each kindEnum slot reclaims its
	// member tokens from `$other` by kindId. If two kindEnum slots on THIS kind
	// claim the same member kind, a `$other` token is ambiguous between them (the
	// `??` fallback would award it to whichever slot is read first). Detect such
	// members up front, warn, and SUPPRESS the auto-reclaim for them — those slots
	// fall back to normal field population / explicit fielding (option C).
	const collidedReclaimKinds = computeCollidedReclaimKinds(fields, ownerKind, nodeMap, kindEntries);
	for (const f of fields) {
		// f IS AssembledNonterminal — read getters directly (DRY: single source for arity/storageKey).
		const aliasRewrite = resolveSlotAliasRewrite(f);
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);
		const allowedKinds =
			storageInfo.kind === 'verbatim' && hasSeparatorMetadata
				? [...new Set([...deriveChildrenKinds(f, nodeMap), ...valueParseKindsOf(f)])]
				: undefined;
		// For kind-origin slots whose values reference one or more concrete
		// kinds (possibly via a supertype), the native reader populates
		// `_<concrete_kind>` not `_<slot.name>`. Probe each concrete key.
		const candidateStorageKeys = collectConcreteStorageKeys(f, nodeMap);
		// Option B: for kindEnum slots, build the numeric-kindId list for the
		// `$other` reclamation fallback (anonymous discriminant tokens). Only
		// catalog-resolvable members (real parser symbols) can appear in $other.
		const reclaimKindIdsExpr =
			storageInfo.kind === 'kindEnum'
				? (() => {
						const reclaimKinds = storageInfo.enumKinds.filter(
							(k) => hasCatalogEntry(kindEntries, k) && !collidedReclaimKinds.has(k)
						);
						const ids = reclaimKinds.map((k) => kindDiscriminantExpr(k, nodeMap, kindEntries));
						return ids.length > 0 ? `[${ids.join(', ')}]` : undefined;
					})()
				: undefined;
		const { storeExpr } = resolveSlotDrillExprs(f, {
			dataExpr,
			elemType: fieldElementType(f, nodeMap),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			alias: aliasRewrite,
			storageInfo,
			allowedKinds,
			candidateStorageKeys,
			reclaimKindIdsExpr
		});
		lines.push(`    ${f.storageKey}: ${storeExpr},`);
	}
}

/**
 * Emit per-field `<propName>() { ... },` inline accessor methods for
 * `fields` — the accessor-side counterpart to `emitFieldStorageLines`,
 * shared for the same reason (branch/group AND multi-field separatedList
 * both need identical per-field drilling for their accessors).
 */
function emitFieldAccessorLines(
	fields: readonly AssembledNonterminal[],
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	for (const f of fields) {
		const propName = f.propertyName;
		const aliasRewrite = resolveSlotAliasRewrite(f);
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);
		const allowedKinds =
			storageInfo.kind === 'verbatim' && hasSeparatorMetadata
				? [...new Set([...deriveChildrenKinds(f, nodeMap), ...valueParseKindsOf(f)])]
				: undefined;
		const { accessorBody } = resolveSlotDrillExprs(f, {
			dataExpr,
			elemType: fieldElementType(f, nodeMap),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			alias: aliasRewrite,
			storageInfo,
			allowedKinds
		});
		lines.push(`    ${propName}() { ${accessorBody}; },`);
	}
}

function emitFieldCarryingWrap(
	node: WrapNode,
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string {
	const fn = `wrap${node.typeName}`;
	const lines: string[] = [];
	const wireKeyTypes = collectWrapWireKeyTypes(fields, nodeMap);
	// $other is real ONLY when the assembled node's own children slot is
	// non-empty — the model's structural fact that this kind's wire data can
	// carry unfielded/unnamed children. (`node.childSurface` governs $with
	// CALLING CONVENTION, not wire storage shape — see investigation note
	// below; using it here would describe the body's ACCESS, not the data's
	// real shape.)
	const needsOther = children.length > 0;
	const paramType = buildWrapParamType(node.typeName, wireKeyTypes, needsOther ? "_NodeData['$other']" : undefined);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`);

	// Shape A: inline object literal wrapped by withMethods<T>. No
	// Object.defineProperty, no freezeNodeData, no Record<string,unknown> cast.
	//
	// When $with setters are present, we hoist the literal to `const _node`
	// so the closures inside $with can reference it (arrow functions capture
	// the variable by reference; _node is initialized before any setter runs).
	const hasWithSetters = node.rawFactoryName && (fields.length > 0 || children.length > 0);

	if (hasWithSetters) {
		lines.push('  const _node = withMethods({');
	} else {
		lines.push('  return withMethods({');
	}
	lines.push('    ...data,');
	// Override $type with the numeric TSKindId.X discriminant when kindEntries is present.
	if (kindEntries) {
		const entry = kindEntries.find((e) => e.kind === node.kind);
		if (entry) {
			lines.push(`    $type: TSKindId.${kindIdMemberName(nodeMap, node.kind)} as const,`);
		}
	}
	// Named fields -> `_<name>` storage (enumerable).
	emitFieldStorageLines(fields, node.kind, 'data', lines, kindEntries, nodeMap);
	// Unnamed children slot -- pass through from data (stubs; drilled lazily by consumer).
	// $other is a $-prefixed metadata key, not a _<name> storage key, so
	// $other doesn't have the `_` prefix convention — access via data.$other
	// which AnyNodeData declares as `readonly NodeMemberValue[] | undefined`.
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap);
		const { storeExpr } = resolveSlotDrillExprs(childrenConfig.slot, {
			dataExpr: 'data',
			elemType: childrenConfig.elemType,
			required: childrenConfig.required,
			nonEmpty: childrenConfig.nonEmpty,
			allowedKinds: childrenConfig.allowedKinds
		});
		lines.push(`    $other: ${storeExpr},`);
	}
	lines.push('');

	// Inline method shorthand accessors: `name()` returns drilled value via `this._<name>`.
	emitFieldAccessorLines(fields, 'data', lines, kindEntries, nodeMap);
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap);
		const { accessorBody } = resolveSlotDrillExprs(childrenConfig.slot, {
			dataExpr: 'data',
			elemType: childrenConfig.elemType,
			required: childrenConfig.required,
			nonEmpty: childrenConfig.nonEmpty,
			allowedKinds: childrenConfig.allowedKinds
		});
		lines.push(`    children() { ${accessorBody}; },`);
	}

	// $with — calls the corresponding factory for update operations.
	emitInlineWithProperty(lines, node, fields, children, nodeMap, kindEntries);

	lines.push('  }, methodsEngine);');
	if (hasWithSetters) {
		lines.push('  return _node;');
	}
	lines.push('}');
	return lines.join('\n');
}

/**
 * Emit the inline `$with: { ... }` property for a wrap function literal.
 *
 * Container-shape nodes with a real unnamed-children wire slot (`children`
 * non-empty) emit `$other`/`$child` lambdas calling the rest-param factory.
 * `node.childSurface` alone is NOT sufficient to pick that path — it
 * describes the factory's own calling convention, and under the unified-slot
 * model an unnamed slot lives in `fields` with a real `_<name>` storage key,
 * not in `$other`. All other nodes (including childSurface spread/direct
 * nodes whose unnamed slot is a `fields` entry) fall through to the
 * per-field setters below, which build a lazy config and call the factory
 * with a patched value at the field's real storage key.
 *
 * @param lines - Output line buffer to append to.
 * @param node - The assembled node descriptor.
 * @param fields - Named field slots.
 * @param children - Unnamed child slots (currently always `[]` from both
 *   call sites — `AssembledBranch/Group.fields` already unifies unnamed
 *   slots into `fields`).
 */
function emitInlineWithProperty(
	lines: string[],
	node: WrapNode,
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	if (!node.rawFactoryName) return;

	const wrapFn = `wrap${node.typeName}`;

	const spreadData = '...data';

	if ((node.childSurface === 'spread' || node.childSurface === 'direct') && children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap);
		const childElem = childrenConfig.elemType;
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		if (childrenConfig.slot.arity === 'one') {
			lines.push(`    $with: { $child: (v: ${childElem}) => ${wrapFn}({ ${spreadData}, $other: v }, tree) },`);
		} else {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(`    $with: { $children: (...vs: ${restType}) => ${wrapFn}({ ${spreadData}, $other: vs }, tree) },`);
		}
		return;
	}

	if (fields.length === 0 && children.length === 0) {
		lines.push('    $with: {},');
		return;
	}

	// Field-carrying: $with setters spread `data` + patch the target
	// `_<name>` key, then re-wrap — producing another fluent wrapped node
	// with drill-in support (not a raw factory node). Typed params align
	// with the factory version's setter signatures.
	lines.push('    $with: {');
	for (const f of fields) {
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (isMultiple(f) && !storageInfo.collapsesMultiplicity) {
			const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>[number]`;
			const setterRestElement = setterValueType.includes(' | ') ? `(${setterValueType})` : setterValueType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${setterValueType}>` : `${setterRestElement}[]`;
			lines.push(`      ${method}: (...v: ${restType}) => ${wrapFn}({ ${spreadData}, ${f.storageKey}: v }, tree),`);
		} else {
			const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>`;
			lines.push(`      ${method}: (v: ${setterValueType}) => ${wrapFn}({ ${spreadData}, ${f.storageKey}: v }, tree),`);
		}
	}
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap);
		const childElem = childrenConfig.elemType;
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		if (childrenConfig.slot.arity === 'one') {
			lines.push(`      children: (item: ${childElem}) => ${wrapFn}({ ${spreadData}, $other: item }, tree),`);
		} else {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(`      children: (...items: ${restType}) => ${wrapFn}({ ${spreadData}, $other: items }, tree),`);
		}
	}
	lines.push('    },');
}

// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------

export class WrapEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #canonicalAliasSourceKinds: ReadonlySet<string>;
	readonly #typeImportLine: string | undefined;
	readonly #output: string[] = [];
	readonly #emittedStructuralKinds = new Set<string>();

	constructor(config: EmitWrapConfig) {
		const { nodeMap, generatedIdTables, inlineKinds, synthesizedKinds, kindEntries: providedKindEntries } = config;
		const kindEntries =
			providedKindEntries ??
			(generatedIdTables
				? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
				: undefined);

		const typeImports = collectTypeImports(nodeMap);
		this.#nodeMap = nodeMap;
		this.#kindEntries = kindEntries;
		this.#inlineKinds = inlineKinds;
		this.#synthesizedKinds = synthesizedKinds;
		this.#canonicalAliasSourceKinds = new Set(collectAliasTargetToSourceMap(nodeMap).values());
		this.#typeImportLine =
			typeImports.size > 0
				? ['import type {', ...[...typeImports].sort().map((name) => `  ${name},`), "} from './types.js';"].join('\n')
				: undefined;
	}

	emitBranch(node: BranchLikeForWrap): void {
		wrap.branch(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitGroup(node: Extract<AssembledNode, { modelType: 'group' }>): void {
		wrap.group(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitSupertype(node: Extract<AssembledNode, { modelType: 'supertype' }>): void {
		wrap.supertype(this.#output, node, this.#kindEntries);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitSeparatedList(node: AssembledSeparatedList): void {
		wrap.separatedList(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	dispatchNode(kind: string, node: AssembledNode): void {
		let emission = classifyWrapEmission(kind, node, {
			kindEntries: this.#kindEntries,
			inlineKinds: this.#inlineKinds,
			synthesizedKinds: this.#synthesizedKinds
		});
		if (
			(emission === 'skip-missing-parser-symbol' || emission === 'skip-synthesized-kind') &&
			this.#canonicalAliasSourceKinds.has(kind)
		) {
			emission = 'emit';
		}
		if (
			emission === 'skip-inline-kind' ||
			emission === 'skip-synthesized-kind' ||
			emission === 'skip-missing-parser-symbol'
		) {
			warnSkippedParserSymbol(kind, 'wrap', emission);
		}
		if (emission !== 'emit') return;
		switch (node.modelType) {
			case 'branch':
				this.emitBranch(node);
				break;
			case 'group':
				this.emitGroup(node);
				break;
			case 'supertype':
				this.emitSupertype(node);
				break;
			case 'separatedList':
				this.emitSeparatedList(node);
				break;
			default:
				break;
		}
	}

	finalize(): string {
		const bodyLines: string[] = [];
		for (const source of this.#output) {
			bodyLines.push(source);
			bodyLines.push('');
		}
		const bodySource = bodyLines.join('\n');
		const usesDrillIn = /\bdrillIn\b/.test(bodySource);
		const usesDrillInAll = /\bdrillInAll\b/.test(bodySource);
		const usesDrillAs = /\bdrillAs\b/.test(bodySource);
		const usesDrillAsAll = /\bdrillAsAll\b/.test(bodySource);
		const usesProjectKindEnum = /\bprojectKindEnumStorage\b/.test(bodySource);
		const usesSeparatorKindOf = /\b_separatorKindOf\b/.test(bodySource);
		// `_separatorKindOf` calls `readTerminalFromOther`, so emit it whenever either is used.
		const usesReadTerminalFromOther = /\breadTerminalFromOther\b/.test(bodySource) || usesSeparatorKindOf;
		const usesHasSeparatorFlank = /\b_hasSeparatorFlank\b/.test(bodySource);
		const usesCoerceBoolean = /\bcoerceBooleanKeywordStorage\b/.test(bodySource);
		const usesCoerceBitflag = /\bcoerceBitflagStorage\b/.test(bodySource);
		const usesFilteredChildren = /\b_filterWrapChildrenByKind\b/.test(bodySource);
		const usesNormalizeSingular = /\bnormalizeSingularWrapSlot\b/.test(bodySource);
		const usesNormalizeRepeated = /\bnormalizeRepeatedWrapSlot\b/.test(bodySource);
		const usesConcatInSourceOrder = /\b_concatInSourceOrder\b/.test(bodySource);
		// `_concatInSourceOrder` calls `_toArr`, so emit `_toArr` whenever either is used.
		const usesToArr = /\b_toArr\b/.test(bodySource) || usesConcatInSourceOrder;
		const supertypeMembers = buildSupertypeMembersMap(this.#nodeMap);
		const utilsImports = [
			'withMethods',
			'methodsEngine',
			...(usesCoerceBoolean ? ['coerceBooleanKeywordStorage'] : []),
			...(usesCoerceBitflag ? ['coerceBitflagStorage'] : [])
		];

		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'// Lazy view layer over readNode output — shape A surface.',
			'',
			"import { readNode as readNodeJs } from '@sittir/common';",
			"import type { TreeHandle } from '@sittir/common';",
			'// Import _NodeData (== AnyNodeData) from @sittir/types',
			'// instead of re-declaring locally. Single source of truth.',
			"import type { AnyNodeData as _NodeData, AnyNodeData, NonEmptyArray } from '@sittir/types';",
			...(this.#kindEntries ? ["import { TSKindId, KIND_NAMES } from './types.js';"] : []),
			"import type * as T from './types.js';",
			...(this.#typeImportLine ? [this.#typeImportLine] : []),
			`import { ${utilsImports.join(', ')} } from './utils.js';`,
			"import * as _factories from './factories.js';",
			'',
			...(usesNormalizeSingular || usesNormalizeRepeated
				? [
						'const WRAP_WARNING_MODE = typeof process !== "undefined" && process.env?.SITTIR_WRAP_WARNING_MODE === "1";',
						'interface WrapDiagnosticContext {',
						'  tree?: TreeHandle;',
						'  nodeType: string | number;',
						'  slotName?: string;',
						'  span?: { start?: number; end?: number };',
						'}',
						'function describeWrapNodeType(nodeType: string | number): string {',
						'  if (typeof nodeType === "number") return KIND_NAMES.get(nodeType) ?? String(nodeType);',
						'  return nodeType;',
						'}',
						'function describeWrapLocation(context: WrapDiagnosticContext): string | undefined {',
						'  const source = context.tree ? context.tree.source : undefined;',
						'  const start = context.span?.start;',
						'  if (source == null || start == null) return undefined;',
						"  const lines = source.slice(0, start).split('\\n');",
						'  const line = lines.length;',
						'  const column = (lines[lines.length - 1]?.length ?? 0) + 1;',
						'  return `${line}:${column}`;',
						'}',
						'function describeWrapSnippet(context: WrapDiagnosticContext): string | undefined {',
						'  const source = context.tree ? context.tree.source : undefined;',
						'  const start = context.span?.start;',
						'  const end = context.span?.end;',
						'  if (source == null || start == null || end == null) return undefined;',
						'  return JSON.stringify(source.slice(start, end));',
						'}',
						'function buildWrapDiagnostic(message: string, context: WrapDiagnosticContext): string {',
						'  const location = describeWrapLocation(context);',
						'  const snippet = describeWrapSnippet(context);',
						'  if (location === undefined && snippet === undefined) return message;',
						'  const parts = [message];',
						'  if (location !== undefined) parts.push(`at ${location}`);',
						'  if (snippet !== undefined) parts.push(`near ${snippet}`);',
						'  return parts.join(` — `);',
						'}',
						'function handleWrapViolation<T>(message: string, fallback: T, context: WrapDiagnosticContext): T {',
						'  const diagnostic = buildWrapDiagnostic(message, context);',
						'  if (WRAP_WARNING_MODE) {',
						'    console.warn(`[wrapNode warning] ${diagnostic}`);',
						'    return fallback;',
						'  }',
						'  throw new TypeError(diagnostic);',
						'}',
						'function describeWrapSlotItem(value: unknown): string {',
						'  if (value == null) return String(value);',
						'  if (typeof value !== "object") return `${typeof value}(${JSON.stringify(value)})`;',
						'  const node = value as Partial<_NodeData>;',
						'  if (typeof node.$type === "string" || typeof node.$type === "number") {',
						'    const text = typeof node.$text === "string" ? `, $text=${JSON.stringify(node.$text)}` : "";',
						'    return `node($type=${JSON.stringify(node.$type)}${text})`;',
						'  }',
						'  return `object(keys=${Object.keys(value as Record<string, unknown>).slice(0, 5).join(",")})`;',
						'}',
						'function describeWrapSlotValue(value: unknown): string {',
						'  if (Array.isArray(value)) {',
						'    const preview = value.slice(0, 3).map((item) => describeWrapSlotItem(item)).join(", ");',
						'    const suffix = value.length > 3 ? ", …" : "";',
						'    return `array(len=${value.length}, items=[${preview}${suffix}])`;',
						'  }',
						'  if (value == null) return String(value);',
						'  return describeWrapSlotItem(value);',
						'}',
						...(usesNormalizeSingular
							? [
									'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: true, nodeType: string | number, context: WrapDiagnosticContext): T;',
									'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: false, nodeType: string | number, context: WrapDiagnosticContext): T | undefined;',
									'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: boolean, nodeType: string | number, context: WrapDiagnosticContext): T | undefined {',
									'  if (Array.isArray(value)) {',
									'    if (value.length === 0) {',
									'      if (required) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} requires one value; got ${describeWrapSlotValue(value)}`, undefined as T | undefined, context);',
									'      return undefined;',
									'    }',
									'    if (value.length !== 1) {',
									'      // read_node concatenates grammar-agnostically; the named/unnamed',
									'      // disparity for SINGULAR slots is resolved HERE (the per-kind layer',
									'      // that knows arity). A structural anonymous token co-occurring on the',
									'      // same field (e.g. splat_type `field("identifier", seq("*", $.identifier))`)',
									'      // surfaces as a scalarized kindId NUMBER or a $named:false object; the',
									'      // real value is a string (text-collapsed leaf) or a $named!==false object.',
									'      // Drop the structural tokens — the template re-emits them — and keep the',
									'      // substantive value.',
									'      const substantive = (value as readonly unknown[]).filter((v) => !(typeof v === "number" || (typeof v === "object" && v !== null && (v as { $named?: unknown }).$named === false)));',
									'      if (substantive.length === 1) return substantive[0] as T;',
									'      return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} received ${value.length} values; got ${describeWrapSlotValue(value)}`, value[0] as T, context);',
									'    }',
									'    return value[0] as T;',
									'  }',
									'  if (value == null && required) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} requires one value; got ${describeWrapSlotValue(value)}`, undefined as T | undefined, context);',
									'  return value as T | undefined;',
									'}'
								]
							: [])
					]
				: []),
			...(usesNormalizeSingular || usesNormalizeRepeated
				? [
						'function normalizeRepeatedWrapSlot<T>(value: T | readonly T[] | undefined, nonEmpty: boolean, slotName: string, context: WrapDiagnosticContext): readonly T[] {',
						'  const items: readonly T[] = Array.isArray(value) ? (value as readonly T[]) : value == null ? ([] as readonly T[]) : ([value] as readonly T[]);',
						'  if (nonEmpty && items.length === 0) return handleWrapViolation(`repeated slot ${JSON.stringify(slotName)} requires at least one value`, items, context);',
						'  return items;',
						'}'
					]
				: []),
			...(usesToArr
				? [
						'// _toArr — normalize a single wire field (may be a scalar value or an',
						'// array of node stubs) to a readonly array. Used by repeated supertype-',
						'// list slot concatenation so that spreading a text-collapsed leaf (e.g.',
						'// primitive_type "i32" arriving as the string "i32") does not split it',
						'// character-by-character.',
						'function _toArr<T>(value: T | readonly T[] | undefined): readonly T[] {',
						'  if (value == null) return [];',
						'  return Array.isArray(value) ? (value as readonly T[]) : [value as T];',
						'}'
					]
				: []),
			...(usesConcatInSourceOrder
				? [
						'// _concatInSourceOrder — concatenate the per-kind wire arrays of a',
						'// repeated heterogeneous-union slot, then STABLE-sort by CST position.',
						'// The native reader buckets repeated unfielded children by kind, so a',
						'// plain declaration-order concat loses cross-kind source order. Each',
						'// node stub carries `$span.start` (byte offset) / `$childIndex` (position',
						'// in parent); sort on those to restore order. Text-collapsed scalar',
						'// leaves lack both → sorted to the end, stable among themselves (so a',
						'// homogeneous single-bucket slot is a no-op).',
						'function _concatInSourceOrder<T>(parts: readonly (T | readonly T[] | undefined)[]): readonly T[] {',
						'  const flat = parts.flatMap((p) => _toArr(p));',
						'  const pos = (e: T): number => {',
						'    const n = e as unknown as { $span?: { start?: number }; $childIndex?: number };',
						'    return n?.$span?.start ?? n?.$childIndex ?? Number.MAX_SAFE_INTEGER;',
						'  };',
						'  return flat',
						'    .map((e, i) => [e, i] as const)',
						'    .sort(([a, ai], [b, bi]) => pos(a) - pos(b) || ai - bi)',
						'    .map(([e]) => e);',
						'}'
					]
				: []),
			'// Drill-in helpers — call back through `readTreeNode` so the same',
			'// per-handle dispatch + wrap pipeline runs at every level. Layering:',
			'//   readTreeNode (public entry)',
			'//     → readNode (handle-driven — tree.read for native, JS walker otherwise)',
			'//       → wrapNode (dispatches on $type)',
			'//         → drillIn / drillAs → readTreeNode (recurse)',
			...(usesDrillIn
				? [
						'function drillIn<T>(entry: T, tree: TreeHandle): T {',
						'  if (!entry) return undefined as unknown as T;',
						'  const e = entry as unknown as _NodeData;',
						'  if (e.$nodeHandle != null && e.$childIndex != null) return readTreeNode(tree, e.$nodeHandle, e.$childIndex) as unknown as T;',
						'  return entry;',
						'}'
					]
				: []),
			...(usesDrillInAll
				? [
						'function drillInAll<T>(entries: readonly T[] | undefined, tree: TreeHandle): T[] {',
						'  if (!entries) return [];',
						'  const arr = Array.isArray(entries) ? entries : [entries];',
						'  return arr.map(e => drillIn(e, tree));',
						'}'
					]
				: []),
			...(usesDrillAs
				? [
						'// drillAs — field-site unalias for grammar `alias($.source, $.target)`',
						'// declarations. The `asType` override rewrites $type from',
						"// tree-sitter's alias target back to the codegen-canonical source",
						'// name between the read and the wrap. Conditional rewrite: only',
						"// fires when the child's actual $type matches `fromType`; mixed-",
						'// union fields (e.g. Path | BracketedType | GenericTypeWithTurbofish)',
						'// pass through unchanged when the child arrived as a non-alias kind.',
						'function drillAs<T>(entry: unknown, tree: TreeHandle, fromType: string, toType: string): T {',
						'  if (!entry) return undefined as unknown as T;',
						'  const e = entry as _NodeData;',
						'  if (e.$nodeHandle == null || e.$childIndex == null) {',
						'    if (typeof e === "object" && e !== null && e.$type != null) {',
						'      const currentType = typeof e.$type === "number"',
						'        ? KIND_NAMES.get(e.$type as never) ?? String(e.$type)',
						'        : (e.$type as unknown as string);',
						'      const hiddenCurrentType = currentType.startsWith("_") ? currentType.slice(1) : undefined;',
						'      const next = currentType === fromType || hiddenCurrentType === fromType',
						'        ? ({ ...e, $type: toType as unknown as number } as _NodeData)',
						'        : e;',
						'      return next as unknown as T;',
						'    }',
						'    return entry as unknown as T;',
						'  }',
						'  return readTreeNode(tree, e.$nodeHandle, e.$childIndex, { from: fromType, to: toType }) as unknown as T;',
						'}'
					]
				: []),
			...(usesDrillAsAll
				? [
						'function drillAsAll<T>(entries: unknown, tree: TreeHandle, fromType: string, toType: string): T[] {',
						'  if (!entries) return [];',
						'  const arr = Array.isArray(entries) ? entries : [entries];',
						'  return arr.map(e => drillAs<T>(e, tree, fromType, toType));',
						'}'
					]
				: []),
			...(usesProjectKindEnum
				? [
						'function projectKindEnumStorage<T>(value: T): T {',
						'  if (!value) return value;',
						'  if (Array.isArray(value)) return value.map(entry => projectKindEnumStorage(entry)) as unknown as T;',
						'  const entry = value as unknown as _NodeData;',
						'  return typeof entry.$type === "number" ? (entry.$type as T) : value;',
						'}'
					]
				: []),
			...(usesReadTerminalFromOther
				? [
						'// readTerminalFromOther — reclaim a model-designated terminal (operator /',
						'// keyword discriminant) that read_node forwarded to `$other` because it is',
						'// an anonymous, unfielded token. The model knows the slot accepts these',
						'// kinds; match an `$other` entry by kind-name and return it for the slot',
						'// storage. Non-mutating (idempotent): the entry stays in `$other`, but the',
						'// per-kind template renders the discriminant from its slot, not via $other,',
						'// so there is no double-render. A final `?? readTerminalFromOther(...)` only',
						'// fires when the nominal storage keys are all empty (the unfielded case);',
						'// when the token IS field-tagged the chain short-circuits before reaching it.',
						'function readTerminalFromOther(data: _NodeData, allowedKindIds: readonly number[]): _NodeData | number | undefined {',
						'  const other = (data as { $other?: readonly unknown[] }).$other;',
						'  if (!Array.isArray(other)) return undefined;',
						'  for (const e of other) {',
						'    const id = typeof e === "number" ? e : (typeof e === "object" && e !== null ? (e as { $type?: unknown }).$type : undefined);',
						'    if (typeof id === "number" && allowedKindIds.includes(id)) return e as _NodeData | number;',
						'  }',
						'  return undefined;',
						'}'
					]
				: []),
			...(usesSeparatorKindOf
				? [
						'// _separatorKindOf — a separatedList nonterminal-separator discriminant,',
						'// reusing readTerminalFromOther’s $other kind-id scan (option B',
						'// reclamation) rather than a parallel scan.',
						'function _separatorKindOf(data: _NodeData, candidateKindIds: readonly number[]): number | undefined {',
						'  const entry = readTerminalFromOther(data, candidateKindIds);',
						'  return typeof entry === "number" ? entry : (entry as _NodeData | undefined)?.$type as number | undefined;',
						'}'
					]
				: []),
			...(usesHasSeparatorFlank
				? [
						'// _hasSeparatorFlank — whether an optional leading/trailing separator is',
						'// present on this instance.',
						'//',
						'// Preferred signal: compare the container span against the first/last',
						"// content element span. A literal separator's $other entry is a bare",
						'// kind-id number with no position of its own (verified against real',
						'// parsed payloads — a "," token is indistinguishable from any other ","',
						'// at a different position), so it cannot answer "which side is this on".',
						"// The container span extending past the content's own extent is direct,",
						'// order-independent evidence instead: no separator ever falls OUTSIDE',
						'// [firstContent.start, lastContent.end] except a leading/trailing flank.',
						'//',
						'// Falls back to a $other-length vs. between-separator-count comparison',
						'// when content is text-collapsed (no per-element span survives — e.g. a',
						'// bare-identifier tuple element arriving as the plain string "a"). That',
						'// fallback is correct ONLY when the OPPOSITE flank direction is',
						"// structurally 'none' on this kind — otherwise a single extra $other",
						'// entry is genuinely ambiguous between "this is the leading flank" and',
						'// "this is the trailing flank", and the count alone cannot tell them',
						'// apart (both queries would compute the identical boolean off the',
						'// identical formula). `otherFlankOptional` is the codegen-time fact',
						"// (`node.leadingMode === 'optional' && node.trailingMode === 'optional'`)",
						'// that flags this — a kind combining both-optional flanks with',
						'// text-collapsed content has no real-grammar coverage today (all such',
						'// kinds currently retain per-element span), so this throws loudly rather',
						'// than silently returning a wrong-for-one-edge answer if that combination',
						'// is ever reached.',
						'function _hasSeparatorFlank(container: { $span?: { start: number; end: number } }, content: readonly unknown[], other: readonly unknown[] | undefined, edge: "leading" | "trailing", otherFlankOptional: boolean): boolean {',
						'  const containerSpan = container.$span;',
						'  const anchor = edge === "leading" ? content[0] : content[content.length - 1];',
						'  const anchorSpan = anchor && typeof anchor === "object" ? (anchor as { $span?: { start: number; end: number } }).$span : undefined;',
						'  if (containerSpan && anchorSpan) {',
						'    return edge === "leading" ? containerSpan.start < anchorSpan.start : containerSpan.end > anchorSpan.end;',
						'  }',
						'  if (otherFlankOptional) {',
						'    throw new Error(`_hasSeparatorFlank: cannot disambiguate the "${edge}" flank from its opposite for a text-collapsed content element (no per-element $span) when BOTH flank directions are optional on this kind — the $other-count fallback is ambiguous here. This combination has no real-grammar coverage; a genuine order-aware mechanism is needed before this kind can support both-optional-flank capture.`);',
						'  }',
						'  const otherCount = Array.isArray(other) ? other.length : 0;',
						'  const between = Math.max(content.length - 1, 0);',
						'  return otherCount > between;',
						'}'
					]
				: []),
			...(usesFilteredChildren
				? [
						...(supertypeMembers.size > 0
							? [
									'const SUPERTYPE_MEMBERS: Record<string, ReadonlySet<string>> = {',
									...Array.from(supertypeMembers.entries()).map(
										([k, v]) => `  ${JSON.stringify(k)}: new Set(${JSON.stringify(v)}),`
									),
									'};',
									''
								]
							: []),
						'function _wrapKindNameOf(entry: unknown): string | undefined {',
						'  if (!entry || typeof entry !== "object") return undefined;',
						'  const raw = (entry as { $type?: unknown }).$type;',
						'  if (raw === undefined) return undefined;',
						...(this.#kindEntries
							? ['  if (typeof raw === "number") return KIND_NAMES.get(raw as never) ?? String(raw);']
							: []),
						'  return typeof raw === "string" ? raw : undefined;',
						'}',
						'',
						'function _matchesAllowedWrapKind(kind: string, allowedKinds: readonly string[]): boolean {',
						'  if (allowedKinds.includes(kind)) return true;',
						'  const canonical = _aliasTargetToSource[kind];',
						'  if (canonical && allowedKinds.includes(canonical)) return true;',
						'  const stripped = kind.startsWith("_") ? kind.slice(1) : undefined;',
						'  if (stripped && allowedKinds.includes(stripped)) return true;',
						'  for (const allowed of allowedKinds) {',
						...(supertypeMembers.size > 0
							? [
									'    const members = SUPERTYPE_MEMBERS[allowed] ?? SUPERTYPE_MEMBERS[allowed.startsWith("_") ? allowed.slice(1) : allowed];',
									'    if (members?.has(kind)) return true;',
									'    if (canonical !== undefined && members?.has(canonical)) return true;',
									'    if (stripped !== undefined && members?.has(stripped)) return true;'
								]
							: []),
						'    const allowedStripped = allowed.startsWith("_") ? allowed.slice(1) : allowed;',
						'    if (allowedStripped === kind || (canonical !== undefined && allowedStripped === canonical) || (stripped !== undefined && allowedStripped === stripped)) return true;',
						'  }',
						'  return false;',
						'}',
						'',
						'function _filterWrapChildrenByKind<T>(value: T | readonly T[] | undefined, allowedKinds: readonly string[]): T | readonly T[] | undefined {',
						'  if (value == null) return undefined;',
						'  if (!Array.isArray(value)) {',
						'    const kind = _wrapKindNameOf(value);',
						'    if (kind === undefined) return value;',
						'    return _matchesAllowedWrapKind(kind, allowedKinds) ? value : undefined;',
						'  }',
						'  const entries = value;',
						'  return entries.filter((entry) => {',
						'    // Text-collapsed leaf elements (e.g. identifiers rendered as their',
						'    // $text string) survive the legacy readNode walker but carry no $type',
						'    // to classify. Keep them — the field tag already selected the slot\\u2019s',
						'    // content. Numeric separator kind-ids stay dropped (the template\\u2019s',
						'    // join re-adds separators).',
						'    if (typeof entry === "string") return true;',
						'    const kind = _wrapKindNameOf(entry);',
						'    if (kind === undefined) return false;',
						'    return _matchesAllowedWrapKind(kind, allowedKinds);',
						'  });',
						'}'
					]
				: []),
			''
		];
		lines.push(bodySource);

		// _wrapTable — runtime dispatch by kind
		lines.push('const _wrapTable: Record<string, (data: _NodeData, tree: TreeHandle) => unknown> = {');
		for (const [kind, node] of this.#nodeMap.nodes) {
			if (
				node.modelType === 'branch' ||
				node.modelType === 'group' ||
				node.modelType === 'supertype' ||
				// TEMPORARY: 'separatedList' shares 'branch's wrap function — see
				// isSlotBearingCompound's doc comment (shared.ts).
				node.modelType === 'separatedList'
			) {
				if (!this.#emittedStructuralKinds.has(kind)) continue;
				lines.push(`  '${kind}': (d, t) => wrap${node.typeName}(d as unknown as T.${node.typeName}, t),`);
			} else if (node.modelType === 'pattern' || node.modelType === 'enum' || node.modelType === 'keyword') {
				if (!node.factoryName) continue;
				if (this.#kindEntries && !hasCatalogEntry(this.#kindEntries, kind)) continue;
				if (this.#kindEntries) {
					const entry = this.#kindEntries.find((e) => e.kind === kind);
					if (entry) {
						lines.push(
							`  '${kind}': (d) => ({ ...d, $type: TSKindId.${kindIdMemberName(this.#nodeMap, kind)} as const }),`
						);
					} else {
						lines.push(`  '${kind}': (d) => d,`);
					}
				} else {
					lines.push(`  '${kind}': (d) => d,`);
				}
			}
		}
		lines.push('};');
		lines.push('');

		// _aliasTargetToSource — canonical-hidden remap (Option Y)
		const aliasMap = collectAliasTargetToSourceMap(this.#nodeMap);
		lines.push('const _aliasTargetToSource: Record<string, string> = {');
		for (const [target, source] of [...aliasMap.entries()].sort()) {
			lines.push(`  '${target}': '${source}',`);
		}
		lines.push('};');
		lines.push('');

		// Public entry points
		lines.push('/** Wrap a NodeData into its lazy read-only view. */');
		lines.push('export function wrapNode(data: _NodeData, tree: TreeHandle): unknown {');
		lines.push('  // The native path now returns numeric $type');
		lines.push('  // (KindId) from Rust; the JS wasm path still returns string $type.');
		lines.push('  // Resolve to a kind-name string for the string-keyed dispatch tables,');
		lines.push('  // then per-kind wrap functions stamp the numeric TSKindId.$type on output.');
		if (this.#kindEntries) {
			lines.push('  const rawType = typeof data.$type === "number"');
			lines.push('    ? KIND_NAMES.get(data.$type as never) ?? String(data.$type)');
			lines.push('    : (data.$type as unknown as string);');
		} else {
			lines.push('  const rawType = data.$type as unknown as string;');
		}
		lines.push('  // Canonical-hidden remap (Option Y): parser-output `$type`');
		lines.push('  // is the visible alias target (e.g. `range_pattern_left_with_right`);');
		lines.push('  // remap to the hidden alias source (`_range_pattern_left_with_right`)');
		lines.push('  // so dispatch + downstream consumers see the canonical form.');
		lines.push('  const canonical = _aliasTargetToSource[rawType];');
		lines.push('  if (canonical !== undefined) {');
		lines.push('    data = { ...data, $type: canonical as unknown as number };');
		lines.push('  }');
		lines.push('  const fn = _wrapTable[canonical ?? rawType];');
		lines.push('  if (!fn) return data; // unknown kind — return as-is');
		lines.push('  return fn(data, tree);');
		lines.push('}');
		lines.push('');
		lines.push('/**');
		lines.push(' * Per-handle dispatching `readNode` — the architectural seam where');
		lines.push(' * the engine choice (JS vs native) lives. `readTreeNode`,');
		lines.push(' * `drillIn` and `drillAs` all read through THIS function so the');
		lines.push(' * wrap layer is engine-agnostic. tree-sitter `Node::id()` is');
		lines.push(' * documented as "unique within a given syntax tree" and is a');
		lines.push(' * raw pointer cast — different parses yield different ids — so');
		lines.push(' * the engine that parsed the tree is the only thing that can');
		lines.push(' * dereference its ids. Native handles set `tree.read` to a');
		lines.push(' * closure that routes through napi; wasm/JS handles (used by');
		lines.push(' * retained diagnostic tooling — `tool walk`, `tool probe-kind');
		lines.push(' * --engine js`) leave it absent and fall back to `readNodeJs`');
		lines.push(' * (the in-process walker).');
		lines.push(' */');
		lines.push('function readNode(tree: TreeHandle, handle?: number, childIndex?: number): AnyNodeData {');
		lines.push('  // Per-handle dispatch: native-engine handles carry a `read`');
		lines.push('  // closure that routes through napi (engine owns the tree;');
		lines.push('  // navigation via handle + childIndex replaces nodeId).');
		lines.push('  // Wasm/JS handles (retained diagnostic tooling) leave `read`');
		lines.push('  // absent and fall back to the in-process JS walker.');
		lines.push('  return tree.read ? tree.read(handle, childIndex) : readNodeJs(tree, handle, childIndex);');
		lines.push('}');
		lines.push('');
		lines.push('/**');
		lines.push(' * Read a parsed tree node into a lazily-wrapped NodeData.');
		lines.push(' * One level deep — getters drill into subtrees on demand by');
		lines.push(' * recursing back through this same function.');
		lines.push(' *');
		lines.push(' * Optional `asType: { from, to }` rewrites `$type` between the read');
		lines.push(" * and the wrap when the node's actual `$type === from`. Used by");
		lines.push(' * `drillAs` for alias-target → alias-source rewrites at');
		lines.push(' * declared field sites.');
		lines.push(' */');
		lines.push('export function readTreeNode(');
		lines.push('  tree: TreeHandle,');
		lines.push('  handle?: number,');
		lines.push('  childIndex?: number,');
		lines.push('  asType?: { from: string; to: string },');
		lines.push('): unknown {');
		lines.push('  let data = readNode(tree, handle, childIndex);');
		lines.push('  // asType comparison must handle both string and numeric $type.');
		lines.push('  // When numeric (native path), convert to kind-name first for comparison.');
		if (this.#kindEntries) {
			lines.push('  if (asType) {');
			lines.push('    const currentType = typeof data.$type === "number"');
			lines.push('      ? KIND_NAMES.get(data.$type as never) ?? String(data.$type)');
			lines.push('      : (data.$type as unknown as string);');
			lines.push('    const hiddenCurrentType = currentType.startsWith("_") ? currentType.slice(1) : undefined;');
			lines.push('    if (currentType === asType.from || hiddenCurrentType === asType.from) {');
			lines.push('      data = { ...data, $type: asType.to as unknown as number };');
			lines.push('    }');
			lines.push('  }');
		} else {
			lines.push('  if (asType && (data.$type as unknown as string) === asType.from) {');
			lines.push('    data = { ...data, $type: asType.to as unknown as number };');
			lines.push('  }');
		}
		lines.push('  return wrapNode(data, tree);');
		lines.push('}');
		lines.push('');

		return lines.join('\n');
	}
}
