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
import type {
	AssembledEnum,
	AssembledNonterminal,
	AssembledNode,
	AssembledPolymorph,
	AssembledSupertype,
	UnresolvedRef
} from '../compiler/node-map.ts';
import { isNodeRef, isUnresolvedRef } from '../compiler/node-map.ts';
import { createNamedSlotModel, createUnnamedChildrenSlotModel, type SlotModel } from '../compiler/slot-model.ts';
import { deriveUnnamedChildrenCardinality } from '../compiler/node-map.ts';
import {
	collectAliasTargetToSourceMap,
	isMultiple,
	isNonEmpty,
	isRequired,
	resolveFieldStorageInfo,
	classifyChildFactorySurface,
	classifyWrapEmission,
	warnSkippedParserSymbol
} from './shared.ts';
import { fieldElementType, childElementType, childrenSetterRestType } from './factories.ts';
import { deriveChildrenKinds } from './transport-common.ts';
import {
	collectKindEntries,
	kindIdMemberName,
	hasCatalogEntry,
	collectCatalogKinds,
	type KindEnumEntry
} from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';
import { expandRuntimeDiscriminatorKinds } from './factory-map.ts';

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

/**
 * Standalone entry point — preserved for backwards compatibility (tests,
 * CLI callers). Delegates to the emitter protocol (init → loop → finalize).
 */
export function emitWrap(config: EmitWrapConfig): string {
	const wrapEmitter = new WrapEmitter(config);
	for (const [kind, node] of config.nodeMap.nodes) {
		wrapEmitter.dispatchNode(kind, node);
	}
	return wrapEmitter.finalize();
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
	/** Back-compat no-op; collection state now lives on emitter instances. */
	export function init(): void {
		// No-op.
	}

	/** Back-compat stub; callers now own the output buffer directly. */
	export function collect(): string[] {
		return [];
	}

	/**
	 * Emit a branch wrap function — field-carrying (handles both regular
	 * and container shapes; fields is `[]` for the container case).
	 */
	export function branch(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'branch' }>,
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
			node.children,
			kindEntries,
			nodeMap
		);
		output.push(result);
	}

	/**
	 * Emit a polymorph wrap function — merges all form fields/children
	 * into a unified superset, then emits a field-carrying wrap.
	 */
	export function polymorph(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'polymorph' }>,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		// Polymorph wraps reuse the branch-style structural slot surface; the
		// form-specific shell remains only in the variant descriptor metadata.
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				childSurface: classifyChildFactorySurface(node, nodeMap),
				isPolymorph: true,
				optionalChildren: node.forms.some((form) => form.children.length === 0)
			},
			node.fields,
			node.children,
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
		if (!node.parentKind && node.fields.length === 0 && node.children.length === 1) {
			output.push(
				emitTransparentGroupWrap(
					{
						kind: node.kind,
						typeName: node.typeName,
						rawFactoryName: node.rawFactoryName,
						childSurface: classifyChildFactorySurface(node, nodeMap)
					},
					node.children,
					nodeMap
				)
			);
			return;
		}
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				childSurface: classifyChildFactorySurface(node, nodeMap)
			},
			node.fields,
			node.children,
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
	readonly optionalChildren?: boolean;
	/**
	 * True when the node is a polymorph — the parent type is a union of UForm
	 * interfaces where not all members may declare `$children`. Callers use
	 * this to emit casts at boundaries where the union type is too narrow for
	 * the runtime shape (e.g., `data.$children` and children setter spreads).
	 */
	readonly isPolymorph?: boolean;
}

type WrapVariantDescriptor =
	| {
			readonly source: 'override';
			readonly childKind: Readonly<Record<string, string>>;
	  }
	| {
			readonly source: 'promoted';
			readonly slots: Readonly<Record<string, readonly string[]>>;
	  };

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

function buildWrapVariantDescriptors(nodeMap: NodeMap): Readonly<Record<string, WrapVariantDescriptor>> {
	const out: Record<string, WrapVariantDescriptor> = {};
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'polymorph') continue;
		const polymorph = node as AssembledPolymorph;
		if (polymorph.source === 'override') {
			const childKind: Record<string, string> = {};
			for (const form of polymorph.formRules) {
				const discriminatorKinds = form.discriminatorKinds ?? [`${kind}_${form.name}`];
				for (const runtimeKind of expandRuntimeDiscriminatorKinds(discriminatorKinds, nodeMap)) {
					childKind[runtimeKind] = form.name;
				}
			}
			out[kind] = { source: 'override', childKind };
			continue;
		}
		const slots: Record<string, readonly string[]> = {};
		for (const form of polymorph.forms) {
			const requiredSlots = form.fields.map((field) => `_${field.name}`);
			if (form.children.length > 0) requiredSlots.push('$children');
			slots[form.name] = requiredSlots;
		}
		out[kind] = { source: 'promoted', slots };
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
	const normalizedStoreExpr =
		slot.arity === 'many'
			? `normalizeRepeatedWrapSlot(${filteredStoreExpr}, ${config.nonEmpty ? 'true' : 'false'}, ${JSON.stringify(slot.name)})`
			: `normalizeSingularWrapSlot(${filteredStoreExpr}, ${JSON.stringify(slot.name)}, ${config.required ? 'true' : 'false'}, ${config.dataExpr}.$type)`;
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
	nodeMap: NodeMap,
	options?: { optional?: boolean; forceSingular?: boolean }
): UnnamedChildrenSlotConfig {
	const cardinality = deriveUnnamedChildrenCardinality(children);
	return {
		slot: createUnnamedChildrenSlotModel(
			options?.forceSingular ? 'one' : children.length === 1 && !cardinality.multiple ? 'one' : 'many'
		),
		elemType: childElementType({ children }, nodeMap),
		required: options?.optional ? false : cardinality.required,
		nonEmpty: cardinality.nonEmpty,
		allowedKinds: [...new Set(children.flatMap((child) => deriveChildrenKinds(child, nodeMap)))]
	};
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
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
function collectConcreteStorageKeys(
	slot: AssembledNonterminal,
	nodeMap: NodeMap
): readonly string[] | undefined {
	if (slot.origin !== 'kind') return undefined;
	// Route by the slot's parse-names — the kinds the parser can actually emit:
	// ref-kinds PLUS alias targets (collect-slots now folds the targets into
	// parseNamesNew). Expand supertypes. No base→variant rewrite: parseNames
	// already carries both the base kind (validation-only polymorph variants,
	// which the parser emits as the base — e.g. type_query's
	// instantiation_expression) AND the alias target (real tree-sitter aliases
	// like decorator, which the parser emits as the target). The old rewrite
	// REPLACED base with target, mis-routing the validation-only case.
	let refKinds: string[];
	if (slot.parseNamesNew && slot.parseNamesNew.length > 0) {
		refKinds = [...slot.parseNamesNew];
	} else {
		refKinds = [];
		for (const v of slot.values) {
			if (!isNodeRef(v)) continue;
			refKinds.push(isUnresolvedRef(v.node) ? (v.node as UnresolvedRef).name : (v.node as AssembledNode).kind);
		}
	}
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
		// Append the slot's nominal storage key as a final fallback for any
		// edge case the analysis missed (e.g. a tree-sitter-injected alias the
		// supertype-expansion doesn't see).
		const allKeys = candidateKeys.includes(slot.storageKey)
			? candidateKeys
			: [...candidateKeys, slot.storageKey];

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
			const sources = allKeys.map((k) => dataAccessExpr(dataExpr, k));
			return `_concatInSourceOrder([${sources.join(', ')}])`;
		}

		// Singular slot: exactly one of these will be populated.
		// ??-coalesce is correct — return the first non-null source.
		const probes = allKeys.map((k) => dataAccessExpr(dataExpr, k));
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

function emitTransparentGroupWrap(
	node: WrapNode,
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap
): string {
	const fn = `wrap${node.typeName}`;
	const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap);
	const { storeExpr } = resolveSlotDrillExprs(childrenConfig.slot, {
		dataExpr: 'data',
		elemType: childrenConfig.elemType,
		required: childrenConfig.required,
		nonEmpty: childrenConfig.nonEmpty,
		allowedKinds: childrenConfig.allowedKinds
	});
	const arrayElemType =
		childrenConfig.elemType.includes(' | ') ? `(${childrenConfig.elemType})` : childrenConfig.elemType;
	const returnExpr =
		childrenConfig.slot.arity === 'many'
			? `drillInAll<${childrenConfig.elemType}>(${storeExpr} as readonly ${arrayElemType}[] | undefined, tree)`
			: `drillIn<${childrenConfig.required ? childrenConfig.elemType : `${childrenConfig.elemType} | undefined`}>(${storeExpr}, tree)`;
	return [`export function ${fn}(data: T.${node.typeName}, tree: TreeHandle) {`, `  return ${returnExpr};`, `}`].join(
		'\n'
	);
}

function emitTransparentSupertypeWrap(node: AssembledSupertype): string {
	const fn = `wrap${node.typeName}`;
	const allowedKinds = [...new Set(node.subtypes.flatMap((kind) => (kind.startsWith('_') ? [kind, kind.slice(1)] : [kind])))];
	return [
		`export function ${fn}(data: T.${node.typeName}, tree: TreeHandle) {`,
		`  return drillIn<T.${node.typeName}>(normalizeSingularWrapSlot(_filterWrapChildrenByKind(data.$children, ${JSON.stringify(allowedKinds)}), "children", true, data.$type), tree);`,
		`}`
	].join('\n');
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
function emitFieldCarryingWrap(
	node: WrapNode,
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string {
	const fn = `wrap${node.typeName}`;
	const lines: string[] = [];
	lines.push(`export function ${fn}(data: T.${node.typeName}, tree: TreeHandle) {`);

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
	// Polymorph parent types are unions of UForm interfaces — not all members
	// declare every field, but merged fields are a superset. Cast through
	// `(data as any)` to access fields that may not exist on all union members.
	for (const f of fields) {
		const slot = createNamedSlotModel(f.name, isMultiple(f) ? 'many' : 'one');
		const aliasEntries = f.aliasSources ? Object.entries(f.aliasSources) : [];
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);
		const allowedKinds =
			storageInfo.kind === 'verbatim' && hasSeparatorMetadata
				? [...new Set([...deriveChildrenKinds(f, nodeMap), ...aliasEntries.flatMap(([from, to]) => [from, to])])]
				: undefined;
		// For kind-origin slots whose values reference one or more concrete
		// kinds (possibly via a supertype), the native reader populates
		// `_<concrete_kind>` not `_<slot.name>`. Probe each concrete key.
		const candidateStorageKeys = collectConcreteStorageKeys(f, nodeMap);
		const { storeExpr } = resolveSlotDrillExprs(slot, {
			dataExpr: node.isPolymorph ? '(data as any)' : 'data',
			elemType: fieldElementType(f, nodeMap),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			alias: aliasEntries[0],
			storageInfo,
			allowedKinds,
			candidateStorageKeys
		});
		lines.push(`    _${f.name}: ${storeExpr},`);
	}
	// Unnamed children slot -- pass through from data (stubs; drilled lazily by consumer).
	// $children is a $-prefixed metadata key, not a _<name> storage key, so
	// $children doesn't have the `_` prefix convention — access via data.$children
	// which AnyNodeData declares as `readonly NodeMemberValue[] | undefined`.
	// Polymorph parent types are unions of UForm interfaces — not all members
	// may declare `$children`, but it is always present at runtime. Cast
	// through `(data as any)` to access the property without type errors.
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, {
			optional: node.optionalChildren,
			forceSingular: node.isPolymorph
		});
		const { storeExpr } = resolveSlotDrillExprs(childrenConfig.slot, {
			dataExpr: node.isPolymorph ? '(data as any)' : 'data',
			elemType: childrenConfig.elemType,
			required: childrenConfig.required,
			nonEmpty: childrenConfig.nonEmpty,
			allowedKinds: childrenConfig.allowedKinds
		});
		lines.push(`    $children: ${storeExpr},`);
	}
	lines.push('');

	// Inline method shorthand accessors: `name()` returns drilled value via `this._<name>`.
	for (const f of fields) {
		const propName = f.propertyName;
		const slot = createNamedSlotModel(f.name, isMultiple(f) ? 'many' : 'one');
		const aliasEntries = f.aliasSources ? Object.entries(f.aliasSources) : [];
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);
		const allowedKinds =
			storageInfo.kind === 'verbatim' && hasSeparatorMetadata
				? [...new Set([...deriveChildrenKinds(f, nodeMap), ...aliasEntries.flatMap(([from, to]) => [from, to])])]
				: undefined;
		const { accessorBody } = resolveSlotDrillExprs(slot, {
			dataExpr: node.isPolymorph ? '(data as any)' : 'data',
			elemType: fieldElementType(f, nodeMap),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			alias: aliasEntries[0],
			storageInfo,
			allowedKinds
		});
		lines.push(`    ${propName}() { ${accessorBody}; },`);
	}
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, {
			optional: node.optionalChildren,
			forceSingular: node.isPolymorph
		});
		const { accessorBody } = resolveSlotDrillExprs(childrenConfig.slot, {
			dataExpr: node.isPolymorph ? '(data as any)' : 'data',
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
 * Container-shape nodes emit `$children`/`$child` lambdas calling the
 * rest-param factory. Field-carrying nodes emit per-field setters that
 * build a lazy config and call the factory with a patched value.
 *
 * @param lines - Output line buffer to append to.
 * @param node - The assembled node descriptor.
 * @param fields - Named field slots.
 * @param children - Unnamed child slots.
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

	// Polymorph parent types are unions of UForm interfaces. Spread-and-
	// override (`{ ...data, $children: items }`) does not distribute over
	// union types — TypeScript rejects the assignment. Cast `data` to `any`
	// in the spread expression so the setter compiles. The cast is sound:
	// the runtime object always has the right shape (dispatcher matches
	// `$type` before calling the wrap function).
	const spreadData = node.isPolymorph ? '...(data as any)' : '...data';

	if (node.childSurface === 'spread' || node.childSurface === 'direct') {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, {
			optional: node.optionalChildren,
			forceSingular: node.isPolymorph
		});
		const childElem = childrenConfig.elemType;
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		if (childrenConfig.slot.arity === 'one') {
			lines.push(`    $with: { $child: (v: ${childElem}) => ${wrapFn}({ ${spreadData}, $children: v }, tree) },`);
		} else {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(
				`    $with: { $children: (...vs: ${restType}) => ${wrapFn}({ ${spreadData}, $children: vs }, tree) },`
			);
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
		const polymorphSetterType =
			storageInfo.kind === 'boolean'
				? 'boolean'
				: storageInfo.kind === 'bitflag' || storageInfo.kind === 'kindEnum'
					? 'number'
					: fieldElementType(f, nodeMap);
		if (isMultiple(f) && !storageInfo.collapsesMultiplicity) {
			const setterValueType = node.isPolymorph
				? polymorphSetterType
				: `NonNullable<T.${node.typeName}['_${f.name}']>[number]`;
			const setterRestElement = setterValueType.includes(' | ') ? `(${setterValueType})` : setterValueType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${setterValueType}>` : `${setterRestElement}[]`;
			lines.push(`      ${method}: (...v: ${restType}) => ${wrapFn}({ ${spreadData}, _${f.name}: v }, tree),`);
		} else {
			const setterValueType = node.isPolymorph ? polymorphSetterType : `NonNullable<T.${node.typeName}['_${f.name}']>`;
			lines.push(`      ${method}: (v: ${setterValueType}) => ${wrapFn}({ ${spreadData}, _${f.name}: v }, tree),`);
		}
	}
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, {
			optional: node.optionalChildren
		});
		const childElem = childrenConfig.elemType;
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		if (childrenConfig.slot.arity === 'one') {
			lines.push(`      children: (item: ${childElem}) => ${wrapFn}({ ${spreadData}, $children: item }, tree),`);
		} else {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(`      children: (...items: ${restType}) => ${wrapFn}({ ${spreadData}, $children: items }, tree),`);
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

	emitBranch(node: Extract<AssembledNode, { modelType: 'branch' }>): void {
		wrap.branch(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitPolymorph(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void {
		wrap.polymorph(this.#output, node, this.#kindEntries, this.#nodeMap);
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
			case 'polymorph':
				this.emitPolymorph(node);
				break;
			case 'supertype':
				this.emitSupertype(node);
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
		const usesCoerceBoolean = /\bcoerceBooleanKeywordStorage\b/.test(bodySource);
		const usesCoerceBitflag = /\bcoerceBitflagStorage\b/.test(bodySource);
		const usesFilteredChildren = /\b_filterWrapChildrenByKind\b/.test(bodySource);
		const usesNormalizeSingular = /\bnormalizeSingularWrapSlot\b/.test(bodySource);
		const usesNormalizeRepeated = /\bnormalizeRepeatedWrapSlot\b/.test(bodySource);
		const usesConcatInSourceOrder = /\b_concatInSourceOrder\b/.test(bodySource);
		// `_concatInSourceOrder` calls `_toArr`, so emit `_toArr` whenever either is used.
		const usesToArr = /\b_toArr\b/.test(bodySource) || usesConcatInSourceOrder;
		const variantDescriptors = buildWrapVariantDescriptors(this.#nodeMap);
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
			...(usesNormalizeSingular
				? [
						'const WRAP_WARNING_MODE = typeof process !== "undefined" && process.env?.SITTIR_WRAP_WARNING_MODE === "1";',
						'function describeWrapNodeType(nodeType: string | number): string {',
						'  if (typeof nodeType === "number") return KIND_NAMES.get(nodeType) ?? String(nodeType);',
						'  return nodeType;',
						'}',
						'function handleWrapViolation<T>(message: string, fallback: T): T {',
						'  if (WRAP_WARNING_MODE) {',
						'    console.warn(`[wrapNode warning] ${message}`);',
						'    return fallback;',
						'  }',
						'  throw new TypeError(message);',
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
						'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: true, nodeType: string | number): T;',
						'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: false, nodeType: string | number): T | undefined;',
						'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: boolean, nodeType: string | number): T | undefined {',
						'  if (Array.isArray(value)) {',
						'    if (value.length === 0) {',
						'      if (required) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} requires one value; got ${describeWrapSlotValue(value)}`, undefined as T | undefined);',
						'      return undefined;',
						'    }',
						'    if (value.length !== 1) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} received ${value.length} values; got ${describeWrapSlotValue(value)}`, value[0] as T);',
						'    return value[0] as T;',
						'  }',
						'  if (value == null && required) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} requires one value; got ${describeWrapSlotValue(value)}`, undefined as T | undefined);',
						'  return value as T | undefined;',
						'}'
					]
				: []),
			...(usesNormalizeRepeated
				? [
						'function normalizeRepeatedWrapSlot<T>(value: T | readonly T[] | undefined, nonEmpty: boolean, slotName: string): readonly T[] {',
						'  const items: readonly T[] = Array.isArray(value) ? (value as readonly T[]) : value == null ? ([] as readonly T[]) : ([value] as readonly T[]);',
						'  if (nonEmpty && items.length === 0) return handleWrapViolation(`repeated slot ${JSON.stringify(slotName)} requires at least one value`, items);',
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
			...(Object.keys(variantDescriptors).length > 0
				? [
						'type _WrapVariantDescriptor =',
						'  | { source: "override"; childKind: Record<string, string> }',
						'  | { source: "promoted"; slots: Record<string, readonly string[]> };',
						`const _variantTable: Record<string, _WrapVariantDescriptor> = ${JSON.stringify(variantDescriptors, null, 2)};`,
						'',
						'function _kindNameOf(entry: unknown): string | undefined {',
						'  if (!entry || typeof entry !== "object") return undefined;',
						'  const raw = (entry as { $type?: unknown }).$type;',
						'  if (raw === undefined) return undefined;',
						...(this.#kindEntries
							? ['  if (typeof raw === "number") return KIND_NAMES.get(raw as never) ?? String(raw);']
							: []),
						'  return typeof raw === "string" ? raw : undefined;',
						'}',
						'',
						'function _wrapChildEntries(value: unknown): unknown[] {',
						'  if (value == null) return [];',
						'  return Array.isArray(value) ? value : [value];',
						'}',
						'',
						'function _hasWrapChildren(value: unknown): boolean {',
						'  return _wrapChildEntries(value).length > 0;',
						'}',
						'',
						'function _resolveVariant(kind: string, data: _NodeData): string | undefined {',
						'  const desc = _variantTable[kind];',
						'  if (!desc) return undefined;',
						'  if (desc.source === "override") {',
						'    const firstChild = _wrapChildEntries(data.$children).find(',
						'      (child) => child != null && typeof child === "object" && (child as { $named?: boolean }).$named !== false',
						'    );',
						'    const candidate = _kindNameOf(firstChild);',
						'    if (!candidate) return undefined;',
						'    if (candidate in desc.childKind) return desc.childKind[candidate];',
						'    const stripped = candidate.startsWith("_") ? candidate.slice(1) : undefined;',
						'    if (stripped && stripped in desc.childKind) return desc.childKind[stripped];',
						'    let bestVariant: string | undefined;',
						'    let bestSpecificity = -1;',
						'    for (const variant of Object.values(desc.childKind)) {',
						'      const suffix = `_${variant}`;',
						'      if (candidate.endsWith(suffix) || stripped?.endsWith(suffix)) {',
						'        if (variant.length > bestSpecificity) {',
						'          bestVariant = variant;',
						'          bestSpecificity = variant.length;',
						'        }',
						'      }',
						'    }',
						'    return bestVariant;',
						'  }',
						'  for (const [variant, requiredSlots] of Object.entries(desc.slots) as [string, readonly string[]][]) {',
						'    const matches = requiredSlots.every((slot) => {',
						'      if (slot === "$children") return _hasWrapChildren(data.$children);',
						'      return (data as unknown as Record<string, unknown>)[slot] !== undefined;',
						'    });',
						'    if (matches) return variant;',
						'  }',
						'  return undefined;',
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
				node.modelType === 'polymorph' ||
				node.modelType === 'supertype'
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
		if (Object.keys(variantDescriptors).length > 0) {
			lines.push('  const variant = _resolveVariant(canonical ?? rawType, data);');
			lines.push('  if (variant !== undefined && (data as { $variant?: unknown }).$variant === undefined) {');
			lines.push('    data = { ...data, $variant: variant } as _NodeData;');
			lines.push('  }');
		}
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
		lines.push(' * closure that routes through napi; wasm/JS handles leave it');
		lines.push(' * absent and fall back to `readNodeJs` (the in-process walker).');
		lines.push(' */');
		lines.push('function readNode(tree: TreeHandle, handle?: number, childIndex?: number): AnyNodeData {');
		lines.push('  // Per-handle dispatch: native-engine handles carry a `read`');
		lines.push('  // closure that routes through napi (engine owns the tree;');
		lines.push('  // Navigation via handle + childIndex replaces nodeId).');
		lines.push('  // Wasm/JS handles leave `read` absent and fall');
		lines.push('  // back to the in-process JS walker.');
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
