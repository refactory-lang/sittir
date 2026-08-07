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
import {
	AssembledNonterminal,
	aliasTargetToSourceMapOf,
	valueParseKindsOf,
	valueParseLabelsOf
} from '../compiler/model/node-map.ts';
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
	canonicalSeparatedListField,
	kindEnumTextIdPairs
} from './shared.ts';
import { fieldElementType, childElementType, childrenSetterRestType } from './factories.ts';
import { deriveChildrenKinds } from './transport-common.ts';
import {
	collectKindEntries,
	kindIdMemberName,
	hasCatalogEntry,
	kindDiscriminantExpr,
	kindDiscriminantExprForId,
	collectCatalogKinds,
	type KindEnumEntry
} from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';
// Reads the stamp `emitters/shared.ts::computeSupertypeTransitiveParseKinds`
// computes once, post-assemble — see glossary.
function expandToConcreteParseKinds(names: readonly string[], nodeMap: NodeMap): string[] {
	const expanded: string[] = [];
	const seen = new Set<string>();
	function add(name: string): void {
		const normalized = name.startsWith('_') ? name.slice(1) : name;
		if (seen.has(normalized)) return;
		seen.add(normalized);
		expanded.push(normalized);
	}
	for (const name of names) {
		const normalized = name.startsWith('_') ? name.slice(1) : name;
		const node = nodeMap.nodes.get(name) ?? nodeMap.nodes.get(normalized);
		if (node?.modelType !== 'supertype') {
			add(name);
			continue;
		}
		for (const v of node.transitiveParseKinds ?? []) {
			const parseName = v.parseKind?.name;
			if (parseName !== undefined) add(parseName);
		}
	}
	return expanded;
}

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
	generatedIdTables?: GeneratedIdTables;
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	kindEntries?: readonly KindEnumEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
	readonly rawFactoryName?: string;
	readonly childSurface?: 'direct' | 'spread' | null;
}

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
		for (const subtype of (node as AssembledSupertype).subtypeNames) {
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

interface ResolveSlotDrillConfig {
	readonly dataExpr: string;
	readonly elemType: string;
	readonly required: boolean;
	readonly nonEmpty?: boolean;
	readonly alias?: readonly (readonly [string, string])[];
	readonly storageInfo?: ReturnType<typeof resolveFieldStorageInfo>;
	readonly allowedKinds?: readonly string[];
	readonly candidateStorageKeys?: readonly string[];
	readonly reclaimKindIdsExpr?: string;
	readonly kindEnumTextIdPairs?: readonly (readonly [string, number])[];
	readonly forceUnknownElement?: boolean;
}

function resolveSlotDrillExprs(
	slot: SlotModel,
	config: ResolveSlotDrillConfig
): {
	storeExpr: string;
	accessorBody: string;
} {
	const slotStoreExpr = resolveSlotStoreExpr(
		slot,
		config.dataExpr,
		config.candidateStorageKeys,
		config.forceUnknownElement
	);
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
	const typeArg = config.forceUnknownElement ? '<unknown>' : '';
	const normalizedStoreExpr =
		slot.arity === 'many'
			? `normalizeRepeatedWrapSlot${typeArg}(${reclaimedStoreExpr}, ${config.nonEmpty ? 'true' : 'false'}, ${JSON.stringify(slot.name)}, ${diagnosticContextExpr})`
			: `normalizeSingularWrapSlot${typeArg}(${reclaimedStoreExpr}, ${JSON.stringify(slot.name)}, ${config.required ? 'true' : 'false'}, ${config.dataExpr}.$type, ${diagnosticContextExpr})`;
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
		// Id-first wire contract: bake the slot's STAMPED text→member-id map
		// into the call so a wrapper-materialized enum (`{ $type: <wrapper id>,
		// $text: "private" }`) projects to the member's numeric kind id — the
		// same stamped ids the render-side enum arms accept — instead of raw
		// text. Text survives only as the fallback for unstamped members.
		const textIdMapExpr =
			config.kindEnumTextIdPairs && config.kindEnumTextIdPairs.length > 0
				? `{ ${config.kindEnumTextIdPairs.map(([text, id]) => `${JSON.stringify(text)}: ${id}`).join(', ')} }`
				: undefined;
		return {
			storeExpr: textIdMapExpr
				? `projectKindEnumStorage(${normalizedStoreExpr}, ${textIdMapExpr})`
				: `projectKindEnumStorage(${normalizedStoreExpr})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	if (config.alias) {
		const pairsExpr = `[${config.alias.map(([from, to]) => `{ from: ${JSON.stringify(from)}, to: ${JSON.stringify(to)} }`).join(', ')}]`;
		if (slot.arity === 'many') {
			return {
				storeExpr: normalizedStoreExpr,
				accessorBody: `return drillAsAll<${config.elemType}>(this.${slot.storageKey}, tree, ${pairsExpr})`
			};
		}
		const returnType = config.required ? config.elemType : `${config.elemType} | undefined`;
		return {
			storeExpr: normalizedStoreExpr,
			accessorBody: `return drillAs<${returnType}>(this.${slot.storageKey}, tree, ${pairsExpr})`
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
	readonly alias?: readonly (readonly [string, string])[];
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
		allowedKinds: [...new Set(children.flatMap((child) => deriveChildrenKinds(child, nodeMap)))],
		alias: resolveChildrenAliasRewrite(children, nodeMap)
	};
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
}

function resolveSlotAliasRewrite(
	slot: AssembledNonterminal,
	nodeMap: NodeMap
): readonly (readonly [string, string])[] | undefined {
	// A slot can have MULTIPLE simultaneously-aliased candidate kinds — e.g. a
	// polymorphic choice where several (or all) arms each alias onto their own
	// shared canonical name (type_query's content: subscript_expression,
	// member_expression, call_expression, and instantiation_expression are ALL
	// aliased). Return every pair — drillAs/drillAsAll try each in turn and at
	// most one can match a given node's actual (single) real kind.
	const pairs: (readonly [string, string])[] = Object.entries(aliasTargetToSourceMapOf(slot));
	// A slot can ALSO reference a hidden rule (e.g. `_tuple_type_member`,
	// `type`) that's itself modeled as a supertype-like node (an inlined
	// hidden choice, same mechanism tree-sitter's own `supertype` nodes use)
	// rather than expanding directly into concrete arm NodeRefs — the slot's
	// OWN .values then contains one opaque unresolved-ref whose parseKind
	// equals its storageKind (no divergence visible at THIS level). The real
	// per-arm alias info lives one level down, in that node's
	// `subtypeParseNames` map (storageKind -> parseKind), which already
	// records exactly which arms diverge (e.g. `tuple_parameter` ->
	// `required_parameter`). Expand through it.
	for (const parseKind of valueParseKindsOf(slot)) {
		const normalized = parseKind.startsWith('_') ? parseKind.slice(1) : parseKind;
		const node = nodeMap.nodes.get(parseKind) ?? nodeMap.nodes.get(normalized);
		if (node?.modelType !== 'supertype') continue;
		for (const [storageKind, parseName] of Object.entries(node.subtypeParseNames ?? {})) {
			if (storageKind !== parseName) pairs.push([parseName, storageKind]);
		}
	}
	return pairs.length > 0 ? pairs : undefined;
}

// Same alias-rewrite need as resolveSlotAliasRewrite, but for the unnamed
// "children" ($other) slot, which is built from potentially several
// AssembledNonterminal children rather than one field — merge pairs across
// all of them (e.g. `_tuple_type_member`'s `required_parameter`/
// `optional_parameter` arms each need their own rewrite).
function resolveChildrenAliasRewrite(
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap
): readonly (readonly [string, string])[] | undefined {
	const pairs = children.flatMap((child) => resolveSlotAliasRewrite(child, nodeMap) ?? []);
	return pairs.length > 0 ? pairs : undefined;
}

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
	const labelNames = valueParseLabelsOf(slot);
	const kindNames = valueParseKindsOf(slot).filter((k) => !labelNames.includes(k));
	if (labelNames.length === 0 && kindNames.length === 0) return undefined;
	const concrete = kindNames.length > 0 ? expandToConcreteParseKinds(kindNames, nodeMap) : [];
	if (labelNames.length === 0 && concrete.length === 0) return undefined;
	const storageKeys = [...new Set([...labelNames, ...concrete].map((k) => `_${k}`))];
	const legacyKey = `_${slot.name}`;
	if (storageKeys.length === 1 && storageKeys[0] === legacyKey) {
		return undefined;
	}
	return storageKeys;
}

function computeConsumedCandidateKeys(fields: readonly AssembledNonterminal[], nodeMap: NodeMap): readonly string[] {
	const canonicalStorageKeys = new Set(fields.map((f) => f.storageKey));
	return [
		...new Set(
			fields.flatMap((f) => (collectConcreteStorageKeys(f, nodeMap) ?? []).filter((k) => !canonicalStorageKeys.has(k)))
		)
	].sort();
}

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

function resolveSlotStoreExpr(
	slot: SlotModel,
	dataExpr: string,
	candidateKeys?: readonly string[],
	forceUnknownElement?: boolean
): string {
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
			// See resolveSlotDrillExprs's ResolveSlotDrillConfig.forceUnknownElement
			// doc comment: a multi-field AssembledSeparatedList's internal
			// `_content` probe can combine candidate keys from more than one real
			// slot with no common element type — `_concatInSourceOrder`'s own
			// generic inference (independent of the outer normalizeRepeatedWrapSlot
			// call) needs the same explicit widening, or it silently picks one
			// candidate's type and rejects the others.
			const concatTypeArg = forceUnknownElement ? '<unknown>' : '';
			const candidateExpr = sources.length > 0 ? `_concatInSourceOrder${concatTypeArg}([${sources.join(', ')}])` : '[]';
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
		...new Set(node.subtypeNames.flatMap((kind) => (kind.startsWith('_') ? [kind, kind.slice(1)] : [kind])))
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
		// A VISIBLE occurrence of this supertype (enrich-minted alias node)
		// carries its member child under a kind-keyed `_<childKind>` property
		// (reader kind-named slots) — probe those first; `$other` covers the
		// legacy bucketed shape.
		`  const kindKeyed = _firstKindKeyedWrapChild(data, ${JSON.stringify(allowedKinds)}) as T.${node.typeName} | readonly T.${node.typeName}[] | undefined;`,
		`  const filtered = kindKeyed ?? _filterWrapChildrenByKind(data.$other, ${JSON.stringify(allowedKinds)});`,
		// The native reader collapses a node whose children are ALL
		// anonymous tokens (no named member — e.g. this supertype's visible
		// occurrence wrapping a bare punctuation/lifetime token like `'`)
		// into a text-only leaf: no kind-keyed child, no `$other` bucket to
		// drill into. The occurrence itself already carries the leaf's own
		// `$text`/`$span`/`$type` — exactly the bare-leaf shape the
		// transport side already accepts for such members — so treat the
		// node itself as the resolved member instead of requiring a named
		// child that will never surface.
		`  if (filtered === undefined && typeof (data as _NodeData).$text === 'string') {`,
		`    return drillIn<T.${node.typeName}>(data as T.${node.typeName}, tree);`,
		`  }`,
		`  return drillIn<T.${node.typeName}>(normalizeSingularWrapSlot(filtered, "children", true, data.$type, { tree, nodeType: data.$type, slotName: "children", span: (data as _NodeData).$span }), tree);`,
		`}`
	].join('\n');
}

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

export function buildSeparatedListContentSlot(node: AssembledSeparatedList): AssembledNonterminal {
	return new AssembledNonterminal({
		values: node.elements,
		fieldName: undefined,
		hasTrailing: false,
		hasLeading: false,
		sourceRuleIds: []
	});
}

// A separatedList's content position is genuinely field-backed when
// wrapper-deletion stamped a `fieldName` directly onto its simplified rule
// (carried down from the REPEAT wrapper it deleted — see
// `compiler/model/node-map.ts`'s `AssembledSeparatedList` doc comment).
// That's a real tree-sitter `field()` the native reader always populates —
// confirmed empirically (a fielded separatedList's canonical storage key is
// present on every genuine parse) — as opposed to a `separatedList`
// classified purely by structural shape (`isSeparatedListShape`,
// compiler/assemble.ts) with no grammar-level field backing it, where the
// canonical key is a compiler-only abstraction and the candidate-kind-bucket
// keys below are the ONLY thing a fresh read ever populates. Conflating the
// two (dropping candidates whenever there's a "single" canonical slot,
// regardless of whether it's a real field) breaks the many separatedList
// kinds that fall in the second bucket — verified the hard way.
function isFieldBackedSeparatedList(node: AssembledSeparatedList): boolean {
	return (node.simplifiedRule as { fieldName?: string }).fieldName !== undefined;
}

function collectSeparatedListContentStorageKeys(
	contentSlot: AssembledNonterminal,
	nodeMap: NodeMap,
	fieldBacked: boolean
): readonly string[] {
	if (fieldBacked) return [];
	const parseKinds = valueParseKindsOf(contentSlot);
	if (parseKinds.length === 0) return [];
	const concrete = expandToConcreteParseKinds(parseKinds, nodeMap);
	return [...new Set(concrete.map((k) => `_${k}`))];
}

function collectSeparatedListWireKeyTypes(
	contentSlot: AssembledNonterminal,
	canonicalField: AssembledNonterminal,
	canonicalKeys: ReadonlySet<string>,
	fallbackStorageKey: string,
	nodeMap: NodeMap,
	fieldBacked: boolean
): ReadonlyMap<string, string> {
	const candidates = collectSeparatedListContentStorageKeys(contentSlot, nodeMap, fieldBacked);
	const elemType = fieldElementType(canonicalField, nodeMap);
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

function buildSeparatedListWrapParamType(typeName: string, wireKeyTypes: ReadonlyMap<string, string>): string {
	const members = [
		...[...wireKeyTypes].map(([k, t]) => `readonly ${JSON.stringify(k)}?: ${t};`),
		"readonly $other?: _NodeData['$other'];",
		'readonly $span?: { start: number; end: number };'
	];
	return `T.${typeName} & { ${members.join(' ')} }`;
}

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
	const canonical = canonicalSeparatedListField(node);
	// `node.fields` (Task-2 `_slots` stub) is the SAME source `types.ts`
	// derives `T.<TypeName>`'s declared members from — the canonical-key
	// exclusion set for `collectSeparatedListWireKeyTypes` must match it
	// exactly, or a still-declared key gets redundantly (and incoherently)
	// re-widened.
	const canonicalKeys = new Set(node.fields.map((f) => f.storageKey));
	const fieldBacked = isFieldBackedSeparatedList(node);
	const wireKeyTypes = collectSeparatedListWireKeyTypes(
		contentSlot,
		canonical,
		canonicalKeys,
		canonical.storageKey,
		nodeMap,
		fieldBacked
	);
	const paramType = buildSeparatedListWrapParamType(node.typeName, wireKeyTypes);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`);

	const storageInfo = resolveFieldStorageInfo(contentSlot, nodeMap, kindEntries);
	const candidateStorageKeys = collectSeparatedListContentStorageKeys(contentSlot, nodeMap, fieldBacked);
	const contentModel: SlotModel = { name: canonical.name, storageKey: canonical.storageKey, arity: 'many' };
	const { storeExpr, accessorBody } = resolveSlotDrillExprs(contentModel, {
		dataExpr: 'data',
		elemType: fieldElementType(contentSlot, nodeMap),
		required: node.nonEmpty,
		nonEmpty: node.nonEmpty,
		storageInfo,
		alias: resolveSlotAliasRewrite(contentSlot, nodeMap),
		candidateStorageKeys: candidateStorageKeys.length > 0 ? candidateStorageKeys : undefined,
		// Multi-field kinds (see doc comment above) route each field through
		// emitFieldStorageLines/emitFieldAccessorLines separately — `_content`
		// here is ONLY the internal `_hasSeparatorFlank`/`_separatorKindOf`
		// probe bucket, never a real storage key or accessor. Its candidate
		// keys can span more than one field's element type (e.g. TypeScript's
		// enum_body_group1 mixes PropertyName-kind and EnumAssignment-kind
		// keys), which don't share a common generic T.
		forceUnknownElement: node.fields.length > 1
	});
	lines.push(`  const _content = ${storeExpr};`);
	lines.push('  return withMethods({');
	// Same consumed-key omission as `emitFieldCarryingWrap` (shared via
	// `computeConsumedCandidateKeys`) — a raw kind-keyed wire stub any real
	// field's `??`-chain consumed (single-field: `canonical`/`_content`'s own
	// source keys; multi-field: each of `node.fields`) must not survive on
	// the spread base, or it wins the validator's deep-walk dedupe over the
	// canonical `_<name>` key it was folded into (see `_omitWrapKeys`).
	const consumedCandidateKeys = computeConsumedCandidateKeys(node.fields, nodeMap);
	if (consumedCandidateKeys.length > 0) {
		lines.push(`    ..._omitWrapKeys(data, ${JSON.stringify(consumedCandidateKeys)}),`);
	} else {
		lines.push('    ...data,');
	}
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
		const mandatoryAnons = node.trailingMode === 'mandatory' ? 1 : 0;
		lines.push(
			`    _leading_sep: _hasSeparatorFlank(data, _content, data.$other, "leading", ${bothFlanksOptional}, ${mandatoryAnons}),`
		);
	}
	if (node.trailingMode === 'optional') {
		const mandatoryAnons = node.leadingMode === 'mandatory' ? 1 : 0;
		lines.push(
			`    _trailing_sep: _hasSeparatorFlank(data, _content, data.$other, "trailing", ${bothFlanksOptional}, ${mandatoryAnons}),`
		);
	}
	lines.push('');
	if (node.fields.length > 1) {
		emitFieldAccessorLines(node.fields, 'data', lines, kindEntries, nodeMap);
	} else {
		// Match `emitFieldAccessorLines`' convention (`f.propertyName`, camelCase):
		// `canonical.name` is the raw storage-level slot name (snake_case for
		// kind-derived slots, e.g. `attributed_parameter`). An accessor emitted
		// under that raw name is invisible to consumers that derive the
		// expected accessor name via camelCase projection (e.g. the validator's
		// `accessorCandidatesForStorageKey`), which then silently falls back to
		// the raw, undrilled `_<kind>` storage value instead of calling this
		// method — a materialization gap for separatedList content accessors.
		lines.push(`    ${canonical.propertyName}() { ${accessorBody}; },`);
	}
	lines.push('    $with: {},');
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return lines.join('\n');
}

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
		const aliasRewrite = resolveSlotAliasRewrite(f, nodeMap);
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
						const ids = storageInfo.enumKinds
							.filter((k) => !collidedReclaimKinds.has(k))
							.map((k) => {
								const id = storageInfo.enumKindsById.get(k);
								return id !== undefined && kindEntries ? kindDiscriminantExprForId(id, kindEntries) : undefined;
							})
							.filter((expr): expr is string => expr !== undefined);
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
			reclaimKindIdsExpr,
			kindEnumTextIdPairs: storageInfo.kind === 'kindEnum' ? kindEnumTextIdPairs(f, nodeMap, kindEntries) : undefined
		});
		lines.push(`    ${f.storageKey}: ${storeExpr},`);
	}
}

/**
 * Emit `_<field>_leading_sep`/`_<field>_trailing_sep` sibling wire keys for
 * array fields whose OWN separator flank is genuinely `'optional'` — the
 * per-*field* counterpart to `emitSeparatedListWrap`'s per-*kind* capture
 * (which only fires when the array IS the kind's whole top-level structure,
 * `isSeparatedListShape`, assemble.ts). Reuses the SAME `_hasSeparatorFlank`
 * runtime helper, but can't reuse its span-comparison primary path: that
 * path compares the CONTAINER's own `$span` against the first/last content
 * element's span, which is only a valid "does a flank occurrence exist"
 * signal when the container's span IS the list's own span (the whole-kind
 * case). For a field nested inside a larger branch (e.g. a paren-wrapped
 * list), the owning node's span always extends past the field's own
 * occurrence (there's a closing delimiter after it), so that comparison
 * would spuriously always read "trailing present". Passing `{}` (no
 * `$span`) as the container forces `_hasSeparatorFlank` straight to its
 * count-based fallback instead.
 *
 * That fallback counts `$other` (the kind's full unfielded/anonymous
 * children bucket) — which, unlike the whole-kind case, may ALSO contain
 * anonymous tokens belonging to OTHER structure on this same kind (e.g.
 * `tuple_expression`'s wrapping `(`/`)`), not just this field's own
 * separator. Filter `$other` down to entries matching the separator's own
 * literal kind before counting, or the paren tokens would inflate the count
 * and produce false positives.
 *
 * Scope: only a literal separator with a catalog-resolvable kind, and only
 * when the OTHER flank on this same field isn't ALSO `'optional'` — mirrors
 * `_hasSeparatorFlank`'s own explicit unsupported case (it throws for
 * text-collapsed content when both flanks are optional, since a lone extra
 * anon can't be disambiguated by count alone). A field outside this scope
 * keeps today's behavior (no capture; render falls back to compile-time
 * `false`) rather than emitting a wire key that could be silently wrong.
 */
function emitFieldFlankCaptureLines(
	fields: readonly AssembledNonterminal[],
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	for (const f of fields) {
		if (f.trailingMode !== 'optional' && f.leadingMode !== 'optional') continue;
		if (f.trailingMode === 'optional' && f.leadingMode === 'optional') continue;
		const sepText = f.values.map((v) => v.separator).find((s): s is string => s !== undefined);
		if (sepText === undefined || !hasCatalogEntry(kindEntries, sepText)) continue;
		const kindExpr = kindDiscriminantExpr(sepText, nodeMap, kindEntries);
		const contentExpr = `${dataExpr}.${f.storageKey}`;
		const otherExpr =
			`(Array.isArray(${dataExpr}.$other) ? ${dataExpr}.$other : ${dataExpr}.$other !== undefined ? [${dataExpr}.$other] : [])` +
			`.filter((e) => (typeof e === 'object' && e !== null ? (e as { $type?: number }).$type : e) === ${kindExpr})`;
		if (f.trailingMode === 'optional') {
			lines.push(
				`    ${f.storageKey}_trailing_sep: _hasSeparatorFlank({}, Array.isArray(${contentExpr}) ? ${contentExpr} : [], ${otherExpr}, "trailing", false, 0),`
			);
		}
		if (f.leadingMode === 'optional') {
			lines.push(
				`    ${f.storageKey}_leading_sep: _hasSeparatorFlank({}, Array.isArray(${contentExpr}) ? ${contentExpr} : [], ${otherExpr}, "leading", false, 0),`
			);
		}
	}
}

function emitFieldAccessorLines(
	fields: readonly AssembledNonterminal[],
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	for (const f of fields) {
		const propName = f.propertyName;
		const aliasRewrite = resolveSlotAliasRewrite(f, nodeMap);
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
	// Consumed candidate keys: concrete kind-keyed wire keys any field's
	// `??`-chain reads (collectConcreteStorageKeys) that are NOT some field's
	// own canonical storageKey. Omit them from the spread base so the wrapped
	// object carries exactly ONE copy of each child — the canonical `_<name>`
	// assignment below — never a raw un-dispatched shadow stub (see
	// `_omitWrapKeys`' doc comment).
	const consumedCandidateKeys = computeConsumedCandidateKeys(fields, nodeMap);
	if (consumedCandidateKeys.length > 0) {
		lines.push(`    ..._omitWrapKeys(data, ${JSON.stringify(consumedCandidateKeys)}),`);
	} else {
		lines.push('    ...data,');
	}
	// Override $type with the numeric TSKindId.X discriminant when kindEntries is present.
	if (kindEntries) {
		const entry = kindEntries.find((e) => e.kind === node.kind);
		if (entry) {
			lines.push(`    $type: TSKindId.${kindIdMemberName(nodeMap, node.kind)} as const,`);
		}
	}
	// Named fields -> `_<name>` storage (enumerable).
	emitFieldStorageLines(fields, node.kind, 'data', lines, kindEntries, nodeMap);
	// Per-field optional-flank capture (see doc comment) — sibling wire keys
	// consumed by render-module.ts's per-field leading/trailing expression.
	emitFieldFlankCaptureLines(fields, 'data', lines, kindEntries, nodeMap);
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
			allowedKinds: childrenConfig.allowedKinds,
			alias: childrenConfig.alias
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
			allowedKinds: childrenConfig.allowedKinds,
			alias: childrenConfig.alias
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
		// `wrapNode`'s unknown-kind fallback (below) always calls
		// `_drillUnknownKindChildren`, which unconditionally uses both — so
		// these must be `true` regardless of what `bodySource` (the per-kind
		// wrap functions) itself references.
		const usesDrillIn = true;
		const usesDrillInAll = true;
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
		const usesOmitWrapKeys = /\b_omitWrapKeys\b/.test(bodySource);
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
			...(this.#kindEntries ? ["import { TSKindId, KIND_NAMES, kindIdFromName } from './types.js';"] : []),
			"import type * as T from './types.js';",
			...(this.#typeImportLine ? [this.#typeImportLine] : []),
			`import { ${utilsImports.join(', ')} } from './utils.js';`,
			"import * as _factories from './factories.js';",
			'',
			...(usesOmitWrapKeys
				? [
						'// Drop CONSUMED raw candidate storage keys from the spread base. A',
						'// field whose `??`-chain reads concrete kind-keyed wire keys',
						'// (`_binary_expression`, …) copies the winner into its canonical',
						'// `_<name>` key — leaving the raw stub on the object gives generic',
						'// key-walkers (the validator deep walk dedupes candidates by node',
						'// coords) a never-wrap-dispatched shadow copy that can win by',
						'// Object.keys insertion order and mask the canonical one (the',
						'// deep-read Missing-field class). Copy-on-first-delete keeps the',
						'// no-candidate fast path allocation-free.',
						'function _omitWrapKeys<T extends object>(data: T, keys: readonly string[]): T {',
						'  let out: T = data;',
						'  for (const key of keys) {',
						'    if (key in out) {',
						'      if (out === data) out = { ...data };',
						'      delete (out as Record<string, unknown>)[key];',
						'    }',
						'  }',
						'  return out;',
						'}',
						''
					]
				: []),
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
						'// declarations. `pairs` rewrites $type from one of possibly several',
						"// tree-sitter alias targets back to the codegen-canonical source",
						'// name between the read and the wrap (a polymorphic slot can have',
						'// several simultaneously-aliased candidate kinds — e.g. every arm',
						'// of a `choice()` aliasing onto its own shared canonical name).',
						'// Conditional rewrite: only fires when the child\'s actual $type',
						'// matches one pair\'s `from` (at most one can, since a given node',
						'// has exactly one real kind); mixed-union fields pass through',
						'// unchanged when the child arrived as a non-alias kind.',
						'function drillAs<T>(entry: unknown, tree: TreeHandle, pairs: readonly { from: string; to: string }[]): T {',
						'  if (!entry) return undefined as unknown as T;',
						'  const e = entry as _NodeData;',
						'  if (e.$nodeHandle == null || e.$childIndex == null) {',
						'    if (typeof e === "object" && e !== null && e.$type != null) {',
						'      const currentType = typeof e.$type === "number"',
						'        ? KIND_NAMES.get(e.$type as never) ?? String(e.$type)',
						'        : (e.$type as unknown as string);',
						'      const hiddenCurrentType = currentType.startsWith("_") ? currentType.slice(1) : undefined;',
						'      const match = pairs.find(p => currentType === p.from || hiddenCurrentType === p.from);',
						'      if (!match) return e as unknown as T;',
						'      let resolvedToId: number | undefined;',
						'      try { resolvedToId = kindIdFromName(match.to) as unknown as number; } catch { resolvedToId = undefined; }',
						'      return ({ ...e, $type: (resolvedToId ?? match.to) as unknown as number } as _NodeData) as unknown as T;',
						'    }',
						'    return entry as unknown as T;',
						'  }',
						'  return readTreeNode(tree, e.$nodeHandle, e.$childIndex, pairs) as unknown as T;',
						'}'
					]
				: []),
			...(usesDrillAsAll
				? [
						'function drillAsAll<T>(entries: unknown, tree: TreeHandle, pairs: readonly { from: string; to: string }[]): T[] {',
						'  if (!entries) return [];',
						'  const arr = Array.isArray(entries) ? entries : [entries];',
						'  return arr.map(e => drillAs<T>(e, tree, pairs));',
						'}'
					]
				: []),
			...(usesProjectKindEnum
				? [
						'function projectKindEnumStorage<T>(value: T, textIds?: Readonly<Record<string, number>>): T {',
						'  if (!value) return value;',
						'  if (Array.isArray(value)) return value.map(entry => projectKindEnumStorage(entry, textIds)) as unknown as T;',
						'  const entry = value as unknown as _NodeData;',
						// A reference site can materialize the enum choice as its OWN
						// wrapper node (a dedicated kind_id distinct from any member
						// literal's id, carrying which member matched only in `$text`
						// — e.g. TS `method_definition._accessibility_modifier` reads
						// `{ $type: <wrapper kind>, $text: "private" }`, not the bare
						// `private` keyword's own id). `$type` alone can't disambiguate
						// that case. Id-first contract: resolve the text through the
						// slot's STAMPED text→member-id map (baked at codegen time) so
						// the wire carries the same numeric ids the render-side enum
						// arms accept; raw text survives only as the fallback for
						// members with no stamped id (mixed literal/external members —
						// the render-side string branch still accepts those). The bare
						// `$type` id passes through for the direct, already-flattened
						// keyword-literal case. A bare string (not object-wrapped) is
						// read_node\'s raw-read shape for a NAMED fixed-text keyword
						// leaf (e.g. rust\'s mutable_specifier: "mut") — map it the
						// same way before falling through to the object-shaped checks.',
						'  if (typeof value === "string") {',
						'    const mappedId = textIds?.[value];',
						'    return typeof mappedId === "number" ? (mappedId as unknown as T) : value;',
						'  }',
						'  if (typeof entry.$text === "string") {',
						'    const mappedId = textIds?.[entry.$text];',
						'    if (typeof mappedId === "number") return mappedId as unknown as T;',
						'    return entry.$text as unknown as T;',
						'  }',
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
						'function _hasSeparatorFlank(container: { $span?: { start: number; end: number } }, content: readonly unknown[], other: unknown, edge: "leading" | "trailing", otherFlankOptional: boolean, mandatoryAnons: number): boolean {',
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
						'  // Baseline = between-separators PLUS any structurally-mandatory flank',
						'  // anons: a mandatory-LEADING list consumes one anon per element (n),',
						'  // not n-1, so a lone captured separator on a single-element instance',
						'  // is the leading flank, not an extra trailing one.',
						'  const between = Math.max(content.length - 1, 0) + mandatoryAnons;',
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
						'// Kind-keyed child probe: the grammar-agnostic reader stores an',
						'// unlabeled named child under `_<childKind>` (read_node.rs kind-named',
						'// slots). A VISIBLE supertype occurrence (an enrich-minted alias like',
						'// `alias($._expression_except_range, $.expression_group1)`) therefore',
						'// carries its single member child as a kind-keyed property, NOT in',
						'// `$other` — probe those keys before falling back to the `$other` scan.',
						'function _firstKindKeyedWrapChild(data: object, allowedKinds: readonly string[]): unknown {',
						'  for (const key of Object.keys(data)) {',
						'    if (key.charCodeAt(0) !== 95 /* `_` */) continue;',
						'    const stripped = key.slice(1);',
						'    if (!_matchesAllowedWrapKind(stripped, allowedKinds) && !_matchesAllowedWrapKind(key, allowedKinds)) continue;',
						'    const value = (data as Record<string, unknown>)[key];',
						'    if (value !== undefined) return value;',
						'  }',
						'  return undefined;',
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

		// Kinds absent from the NodeMap entirely (no `_wrapTable` entry — e.g.
		// python's `case_pattern_group1`, a hidden alias-mint wrapper the
		// grammar produces but our model doesn't represent) have no dedicated
		// wrap function to drill into their own kind-named-slot children.
		// `read_node.rs`'s one-level read (`read_children` / `read_child_stub`)
		// leaves an unlabeled named child with sub-structure as a shallow stub
		// (`$nodeHandle`/`$childIndex`, no fields of its own) — normally a
		// generated wrap function's `drillIn` call materializes it fully via
		// `readTreeNode`. With no such function for the PARENT kind, nothing
		// ever calls `drillIn` on the stub, so it reaches the native
		// transport deserializer still shallow — and the child's OWN
		// transport struct then fails, missing every one of its real fields
		// (confirmed via `tool probe-kind`: python's `case_pattern` → `content`
		// → `_dotted_name` arrives as `{$type, $text, $span, ...}` only, no
		// `_identifier`, because `case_pattern_group1` triggers exactly this
		// fallback). Drill in every `_`-prefixed property here — mirrors
		// `_firstKindKeyedWrapChild`'s kind-named-slot convention above, just
		// applied unconditionally instead of gated to one matching kind.
		lines.push('function _drillUnknownKindChildren(data: _NodeData, tree: TreeHandle): _NodeData {');
		lines.push('  const out: Record<string, unknown> = { ...(data as unknown as Record<string, unknown>) };');
		lines.push('  for (const key of Object.keys(out)) {');
		lines.push('    if (key.charCodeAt(0) !== 95 /* `_` */) continue;');
		lines.push('    const value = out[key];');
		lines.push('    if (Array.isArray(value)) {');
		lines.push('      out[key] = drillInAll(value, tree);');
		lines.push('    } else if (value != null) {');
		lines.push('      out[key] = drillIn(value, tree);');
		lines.push('    }');
		lines.push('  }');
		lines.push('  return out as unknown as _NodeData;');
		lines.push('}');
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
		lines.push(
			'  if (!fn) return _drillUnknownKindChildren(data, tree); // unknown kind — still drill in its kind-named-slot children'
		);
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
		lines.push('  asType?: readonly { from: string; to: string }[],');
		lines.push('): unknown {');
		lines.push('  let data = readNode(tree, handle, childIndex);');
		lines.push('  // asType comparison must handle both string and numeric $type. A');
		lines.push('  // slot can have MULTIPLE simultaneously-aliased candidate kinds');
		lines.push('  // (e.g. a polymorphic choice where every arm aliases onto a');
		lines.push('  // shared canonical name) — try each pair in turn; at most one');
		lines.push("  // can match the node's actual (single) real kind.");
		lines.push('  // When numeric (native path), convert to kind-name first for comparison.');
		if (this.#kindEntries) {
			lines.push('  if (asType) {');
			lines.push('    const currentType = typeof data.$type === "number"');
			lines.push('      ? KIND_NAMES.get(data.$type as never) ?? String(data.$type)');
			lines.push('      : (data.$type as unknown as string);');
			lines.push('    const hiddenCurrentType = currentType.startsWith("_") ? currentType.slice(1) : undefined;');
			lines.push(
				'    const match = asType.find(p => currentType === p.from || hiddenCurrentType === p.from);'
			);
			lines.push('    if (match) {');
			lines.push('      let resolvedAsTypeId: number | undefined;');
			lines.push(
				'      try { resolvedAsTypeId = kindIdFromName(match.to) as unknown as number; } catch { resolvedAsTypeId = undefined; }'
			);
			lines.push('      data = { ...data, $type: (resolvedAsTypeId ?? match.to) as unknown as number };');
			lines.push('    }');
			lines.push('  }');
		} else {
			lines.push('  if (asType) {');
			lines.push('    const match = asType.find(p => (data.$type as unknown as string) === p.from);');
			lines.push('    if (match) {');
			lines.push('      data = { ...data, $type: match.to as unknown as number };');
			lines.push('    }');
			lines.push('  }');
		}
		lines.push('  return wrapNode(data, tree);');
		lines.push('}');
		lines.push('');

		return lines.join('\n');
	}
}
