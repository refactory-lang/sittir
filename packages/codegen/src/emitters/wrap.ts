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
import type { AssembledNonterminal, AssembledNode, AssembledPolymorph } from '../compiler/node-map.ts';
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
				isPolymorph: true
			},
			node.fields,
			node.children,
			kindEntries,
			nodeMap
		);
		output.push(result);
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
			const requiredSlots = [...form.fields.map((field) => `_${field.name}`)];
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
function resolveFieldDrillExprs(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): {
	storeExpr: string;
	accessorBody: string;
} {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if (storageInfo.kind === 'boolean') {
		return {
			storeExpr: `coerceBooleanKeywordStorage(data._${f.name})`,
			accessorBody: `return this._${f.name}`
		};
	}
	if (storageInfo.kind === 'bitflag') {
		return {
			storeExpr: `coerceBitflagStorage(data._${f.name}, ${bitflagTextsExpr(storageInfo.texts)})`,
			accessorBody: `return this._${f.name}`
		};
	}
	if (storageInfo.kind === 'kindEnum') {
		return {
			storeExpr: `projectKindEnumStorage(data._${f.name})`,
			accessorBody: `return this._${f.name}`
		};
	}
	const elemType = fieldElementType(f, nodeMap);
	const aliasEntries = f.aliasSources ? Object.entries(f.aliasSources) : [];
	if (aliasEntries.length > 0) {
		const [fromType, toType] = aliasEntries[0]!;
		if (isMultiple(f)) {
			return {
				storeExpr: `data._${f.name}`,
				accessorBody: `return drillAsAll<${elemType}>(this._${f.name}, tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`
			};
		}
		const returnType = isRequired(f) ? elemType : `${elemType} | undefined`;
		return {
			storeExpr: `data._${f.name}`,
			accessorBody: `return drillAs<${returnType}>(this._${f.name}, tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`
		};
	} else if (isMultiple(f)) {
		return {
			storeExpr: `data._${f.name}`,
			accessorBody: `return drillInAll<${elemType}>(this._${f.name}, tree)`
		};
	} else {
		const returnType = isRequired(f) ? elemType : `${elemType} | undefined`;
		return {
			storeExpr: `data._${f.name}`,
			accessorBody: `return drillIn<${returnType}>(this._${f.name}, tree)`
		};
	}
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
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
		const { storeExpr } = resolveFieldDrillExprs(f, nodeMap, kindEntries);
		const expr = node.isPolymorph ? storeExpr.replace(/^data\./, '(data as any).') : storeExpr;
		lines.push(`    _${f.name}: ${expr},`);
	}
	// Unnamed children slot -- pass through from data (stubs; drilled lazily by consumer).
	// $children is a $-prefixed metadata key, not a _<name> storage key, so
	// $children doesn't have the `_` prefix convention — access via data.$children
	// which AnyNodeData declares as `readonly NodeMemberValue[] | undefined`.
	// Polymorph parent types are unions of UForm interfaces — not all members
	// may declare `$children`, but it is always present at runtime. Cast
	// through `(data as any)` to access the property without type errors.
	if (children.length > 0) {
		lines.push(`    $children: ${resolveChildrenStoreExpr(node, children)},`);
	}
	lines.push('');

	// Inline method shorthand accessors: `name()` returns drilled value via `this._<name>`.
	for (const f of fields) {
		const propName = f.propertyName;
		const { accessorBody } = resolveFieldDrillExprs(f, nodeMap, kindEntries);
		lines.push(`    ${propName}() { ${accessorBody}; },`);
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

function resolveChildrenStoreExpr(node: WrapNode, children: readonly AssembledNonterminal[]): string {
	const dataExpr = node.isPolymorph ? '(data as any).$children' : 'data.$children';
	const allowedKinds = [...new Set(children.flatMap((child) => deriveChildrenKinds(child)))];
	if (allowedKinds.length === 0) return dataExpr;
	return `_filterWrapChildrenByKind(${dataExpr}, ${JSON.stringify(allowedKinds)})`;
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
		const childElem = childElementType({ children }, nodeMap);
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		if (node.childSurface === 'spread') {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(
				`    $with: { $children: (...vs: ${restType}) => ${wrapFn}({ ${spreadData}, $children: vs }, tree) },`
			);
		} else {
			lines.push(`    $with: { $child: (v: ${childElem}) => ${wrapFn}({ ${spreadData}, $children: [v] }, tree) },`);
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
		const childElem = childElementType({ children }, nodeMap);
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		const restType = childrenSetterRestType(children, childElem, childRest);
		lines.push(`      children: (...items: ${restType}) => ${wrapFn}({ ${spreadData}, $children: items }, tree),`);
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
	readonly #typeImportLine: string | undefined;
	readonly #output: string[] = [];

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
		this.#typeImportLine =
			typeImports.size > 0
				? ['import type {', ...[...typeImports].sort().map((name) => `  ${name},`), "} from './types.js';"].join('\n')
				: undefined;
	}

	emitBranch(node: Extract<AssembledNode, { modelType: 'branch' }>): void {
		wrap.branch(this.#output, node, this.#kindEntries, this.#nodeMap);
	}

	emitPolymorph(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void {
		wrap.polymorph(this.#output, node, this.#kindEntries, this.#nodeMap);
	}

	dispatchNode(kind: string, node: AssembledNode): void {
		const emission = classifyWrapEmission(kind, node, {
			kindEntries: this.#kindEntries,
			inlineKinds: this.#inlineKinds,
			synthesizedKinds: this.#synthesizedKinds
		});
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
			case 'polymorph':
				this.emitPolymorph(node);
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
		const variantDescriptors = buildWrapVariantDescriptors(this.#nodeMap);
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
			...(this.#kindEntries ? ["import { TSKindId } from './types.js';"] : []),
			"import type * as T from './types.js';",
			...(this.#typeImportLine ? [this.#typeImportLine] : []),
			`import { ${utilsImports.join(', ')} } from './utils.js';`,
			"import * as _factories from './factories.js';",
			'',
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
						'  if (e.$nodeHandle == null || e.$childIndex == null) return entry as unknown as T;',
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
						'function _wrapKindNameOf(entry: unknown): string | undefined {',
						'  if (!entry || typeof entry !== "object") return undefined;',
						'  const raw = (entry as { $type?: unknown }).$type;',
						'  if (raw === undefined) return undefined;',
						...(this.#kindEntries
							? [
									'  if (typeof raw === "number") return KIND_NAMES.get(raw as never) ?? String(raw);'
								]
							: []),
						'  return typeof raw === "string" ? raw : undefined;',
						'}',
						'',
						'function _matchesAllowedWrapKind(kind: string, allowedKinds: readonly string[]): boolean {',
						'  if (allowedKinds.includes(kind)) return true;',
						'  const stripped = kind.startsWith("_") ? kind.slice(1) : undefined;',
						'  if (stripped && allowedKinds.includes(stripped)) return true;',
						'  return allowedKinds.some((allowed) => {',
						'    const allowedStripped = allowed.startsWith("_") ? allowed.slice(1) : allowed;',
						'    return allowedStripped === kind || (stripped !== undefined && allowedStripped === stripped);',
						'  });',
						'}',
						'',
						'function _filterWrapChildrenByKind(value: unknown, allowedKinds: readonly string[]): unknown[] | undefined {',
						'  if (value == null) return undefined;',
						'  const entries = Array.isArray(value) ? value : [value];',
						'  return entries.filter((entry) => {',
						'    const kind = _wrapKindNameOf(entry);',
						'    return kind === undefined || _matchesAllowedWrapKind(kind, allowedKinds);',
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
							? [
									'  if (typeof raw === "number") return KIND_NAMES.get(raw as never) ?? String(raw);'
								]
							: []),
						'  return typeof raw === "string" ? raw : undefined;',
						'}',
						'',
						'function _resolveVariant(kind: string, data: _NodeData): string | undefined {',
						'  const desc = _variantTable[kind];',
						'  if (!desc) return undefined;',
						'  if (desc.source === "override") {',
						'    const firstChild = data.$children?.find(',
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
						'      if (slot === "$children") return Array.isArray(data.$children) && data.$children.length > 0;',
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
			if (!node.factoryName) continue;
			if (this.#kindEntries && !hasCatalogEntry(this.#kindEntries, kind)) continue;
			if (node.modelType === 'branch' || node.modelType === 'polymorph') {
				lines.push(`  '${kind}': (d, t) => wrap${node.typeName}(d as T.${node.typeName}, t),`);
			} else if (node.modelType === 'pattern' || node.modelType === 'enum' || node.modelType === 'keyword') {
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
		if (this.#kindEntries) {
			lines.push("import { KIND_NAMES } from './types.js';");
		}
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
