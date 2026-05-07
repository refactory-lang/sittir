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
	AssembledNonterminal,
	AssembledNode,
	AssembledPolymorph
} from '../compiler/node-map.ts';
import {
	collectAliasTargetToSourceMap,
	isMultiple,
	isNonEmpty,
	isRequired
} from './shared.ts';
import { fieldElementType, childElementType, childrenSetterRestType } from './factories.ts';
import {
	collectKindEntries,
	kindIdMemberName,
	hasCatalogEntry,
	collectCatalogKinds,
	type KindEnumEntry
} from './kind-discriminant.ts';

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
}

/**
 * Standalone entry point — preserved for backwards compatibility (tests,
 * CLI callers). Delegates to the emitter protocol (init → loop → finalize).
 */
export function emitWrap(config: EmitWrapConfig): string {
	wrapEmitter.init(config);
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
 * Module-local output buffer — populated by {@link wrap} namespace
 * functions, read by {@link emitWrap} after the dispatch loop.
 */
let _wrapOutput: string[] = [];

/**
 * Taxonomy-keyed wrap dispatch namespace.
 *
 * Each function pushes into the module-local `_wrapOutput` buffer
 * (populated via `init()`, consumed via `collect()`). The functions are
 * thin wrappers that delegate to the existing internal emit helpers;
 * no emit-function signatures are changed.
 */
export namespace wrap {
	/** Reset the output buffer before a new dispatch loop. */
	export function init(): void {
		_wrapOutput = [];
	}

	/** Return the accumulated wrap source blocks. */
	export function collect(): string[] {
		return _wrapOutput;
	}

	/**
	 * Emit a branch wrap function — field-carrying (handles both regular
	 * and container shapes; fields is `[]` for the container case).
	 */
	export function branch(
		node: Extract<AssembledNode, { modelType: 'branch' }>,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		// NOTE: class getters are NOT enumerable, so we must pass explicitly
		// rather than relying on { ...node } to capture prototype-defined
		// getters like `rawFactoryName` and `isContainerShape`.
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				isContainerShape: node.isContainerShape
			},
			node.fields,
			node.children,
			kindEntries,
			nodeMap
		);
		_wrapOutput.push(result);
	}

	/**
	 * Emit a polymorph wrap function — merges all form fields/children
	 * into a unified superset, then emits a field-carrying wrap.
	 */
	export function polymorph(
		node: Extract<AssembledNode, { modelType: 'polymorph' }>,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		const { fields, children } =
			mergePolymorphFormsIntoFieldsAndChildren(node);
		// Polymorph wraps never have container shape — they always have at least
		// one form with fields. Pass rawFactoryName explicitly (class getters are
		// NOT enumerable, so { ...node } would lose it).
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				isContainerShape: false,
				isPolymorph: true
			},
			fields,
			children,
			kindEntries,
			nodeMap
		);
		_wrapOutput.push(result);
	}
}

/**
 * Merges all polymorph forms into a unified field list and child list so
 * the lazy view exposes any field that might be populated at runtime.
 *
 * @remarks
 * Polymorph wraps under the parent kind — unioning every form's fields
 * ensures the view surface is a superset of all possible runtime shapes.
 * First-occurrence wins on duplicate field names; same deduplication
 * applies to named child slots.
 *
 * @param node - An assembled polymorph node whose `forms` array contains
 *   the individual structural variants.
 * @returns An object with the merged `fields` array and merged `children`
 *   array, both deduplicated by name.
 */
function mergePolymorphFormsIntoFieldsAndChildren(node: AssembledPolymorph): {
	fields: AssembledNonterminal[];
	children: AssembledNonterminal[];
} {
	const allFields = new Map<string, AssembledNonterminal>();
	for (const form of node.forms) {
		for (const f of form.fields) {
			if (!allFields.has(f.name)) allFields.set(f.name, f);
		}
	}
	const allChildren: AssembledNonterminal[] = [];
	for (const form of node.forms) {
		for (const c of form.children) {
			if (!allChildren.some((existing) => existing.name === c.name)) {
				allChildren.push(c);
			}
		}
	}
	return { fields: [...allFields.values()], children: allChildren };
}

// ---------------------------------------------------------------------------
// Field-carrying wrap — shape A inline literal + withMethods<T>
// ---------------------------------------------------------------------------

interface WrapNode {
	readonly kind: string;
	readonly typeName: string;
	/** rawFactoryName for $with — null when the kind has no factory. */
	readonly rawFactoryName?: string;
	/** True when this is a container-shaped node (rest-param factory, no named fields). */
	readonly isContainerShape?: boolean;
	/**
	 * True when the node is a polymorph — the parent type is a union of UForm
	 * interfaces where not all members may declare `$children`. Callers use
	 * this to emit casts at boundaries where the union type is too narrow for
	 * the runtime shape (e.g., `data.$children` and children setter spreads).
	 */
	readonly isPolymorph?: boolean;
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
function resolveFieldDrillExprs(f: AssembledNonterminal, nodeMap: NodeMap): {
	storeExpr: string;
	accessorBody: string;
} {
	const elemType = fieldElementType(f, nodeMap);
	const aliasEntries = f.aliasSources ? Object.entries(f.aliasSources) : [];
	if (aliasEntries.length > 0) {
		const [fromType, toType] = aliasEntries[0]!;
		if (isMultiple(f)) {
			return {
				storeExpr: `data._${f.name}`,
				accessorBody: `return drillAsAll<${elemType}>(this._${f.name}, tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`,
			};
		}
		const returnType = isRequired(f) ? elemType : `${elemType} | undefined`;
		return {
			storeExpr: `data._${f.name}`,
			accessorBody: `return drillAs<${returnType}>(this._${f.name}, tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`,
		};
	} else if (isMultiple(f)) {
		return {
			storeExpr: `data._${f.name}`,
			accessorBody: `return drillInAll<${elemType}>(this._${f.name}, tree)`,
		};
	} else {
		const returnType = isRequired(f) ? elemType : `${elemType} | undefined`;
		return {
			storeExpr: `data._${f.name}`,
			accessorBody: `return drillIn<${returnType}>(this._${f.name}, tree)`,
		};
	}
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
		const { storeExpr } = resolveFieldDrillExprs(f, nodeMap);
		const expr = node.isPolymorph
			? storeExpr.replace(/^data\./, '(data as any).')
			: storeExpr;
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
		const dataExpr = node.isPolymorph ? '(data as any).$children' : 'data.$children';
		lines.push(`    $children: ${dataExpr},`);
	}
	lines.push('');

	// Inline method shorthand accessors: `name()` returns drilled value via `this._<name>`.
	for (const f of fields) {
		const propName = f.propertyName;
		const { accessorBody } = resolveFieldDrillExprs(f, nodeMap);
		lines.push(`    ${propName}() { ${accessorBody}; },`);
	}

	// $with — calls the corresponding factory for update operations.
	emitInlineWithProperty(lines, node, fields, children, nodeMap);

	lines.push('  });');
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
	nodeMap: NodeMap
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

	if (node.isContainerShape) {
		const childElem = childElementType({ children }, nodeMap);
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		const anyMultiple = children.some((c) => isMultiple(c));
		if (anyMultiple) {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(
				`    $with: { $children: (...vs: ${restType}) => ${wrapFn}({ ${spreadData}, $children: vs }, tree) },`
			);
		} else {
			lines.push(
				`    $with: { $child: (v: ${childElem}) => ${wrapFn}({ ${spreadData}, $children: [v] }, tree) },`
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
		const elemType = fieldElementType(f, nodeMap);
		if (isMultiple(f)) {
			const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
			const restType = isNonEmpty(f)
				? `NonEmptyArray<${elemType}>`
				: `${elemForArray}[]`;
			lines.push(
				`      ${method}: (...v: ${restType}) => ${wrapFn}({ ${spreadData}, _${f.name}: v }, tree),`
			);
		} else {
			lines.push(
				`      ${method}: (v: ${elemType}) => ${wrapFn}({ ${spreadData}, _${f.name}: v }, tree),`
			);
		}
	}
	if (children.length > 0) {
		const childElem = childElementType({ children }, nodeMap);
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		const restType = childrenSetterRestType(children, childElem, childRest);
		lines.push(
			`      children: (...items: ${restType}) => ${wrapFn}({ ${spreadData}, $children: items }, tree),`
		);
	}
	lines.push('    },');
}

// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------

/**
 * Module-level state captured by {@link wrapEmitter.init} and consumed
 * by {@link wrapEmitter.dispatchNode} and {@link wrapEmitter.finalize}.
 */
let _wrapEmitterNodeMap: NodeMap;
let _wrapEmitterKindEntries: readonly KindEnumEntry[] | undefined;
let _wrapEmitterInlineKinds: readonly string[] | undefined;
let _wrapEmitterSynthesizedKinds: ReadonlySet<string> | undefined;
let _wrapEmitterTypeImportLine: string | undefined;

/**
 * Emitter protocol for the single-loop orchestrator in `emit.ts`.
 *
 * `init()` computes kindEntries and captures config state.
 * `dispatchNode()` handles one node from the shared loop — filtering
 * + taxonomy dispatch. `finalize()` assembles the final output:
 * body scan for drill usage → preamble → body → _wrapTable →
 * _aliasTargetToSource → public entry points → join.
 *
 * The existing `emitWrap()` entry point is preserved as a thin wrapper
 * for backwards compatibility (tests, CLI).
 */
export const wrapEmitter = {
	/**
	 * Compute kindEntries and capture config state for the dispatch loop.
	 */
	init(config: EmitWrapConfig): void {
		const { nodeMap, generatedIdTables, inlineKinds, synthesizedKinds } = config;

		const kindEntries = generatedIdTables
			? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
			: undefined;

		const typeImports = collectTypeImports(nodeMap);
		const typeImportLine =
			typeImports.size > 0
				? [
						'import type {',
						...[...typeImports].sort().map((name) => `  ${name},`),
						"} from './types.js';"
					].join('\n')
				: undefined;

		// Capture state for dispatchNode / finalize
		_wrapEmitterNodeMap = nodeMap;
		_wrapEmitterKindEntries = kindEntries;
		_wrapEmitterInlineKinds = inlineKinds;
		_wrapEmitterSynthesizedKinds = synthesizedKinds;
		_wrapEmitterTypeImportLine = typeImportLine;

		// Reset the per-node output buffer
		wrap.init();
	},

	/**
	 * Handle one node from the shared loop — applies the same filtering
	 * as the loop in `emitWrap()` and dispatches to the wrap namespace.
	 */
	dispatchNode(kind: string, node: AssembledNode): void {
		const nodeMap = _wrapEmitterNodeMap;
		const kindEntries = _wrapEmitterKindEntries;
		const inlineKinds = _wrapEmitterInlineKinds;
		const synthesizedKinds = _wrapEmitterSynthesizedKinds;

		// --- Filtering (mirrors emitWrap loop) ---
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) {
			if (inlineKinds?.includes(kind)) {
				console.warn(
					`[codegen] '${kind}' is in inline: array — no parser symbol expected. ` +
					`Skipping wrap emission. ` +
					`Future: map to decomposition.`
				);
			} else if (synthesizedKinds?.has(kind)) {
				// Intentionally synthesized by evaluate — no parser symbol by design.
			} else {
				console.warn(
					`[codegen] VAPORIZED: '${kind}' has no parser symbol and is ` +
					`NOT in the grammar's inline: array. Skipping wrap ` +
					`emission. Investigate why tree-sitter dropped this rule.`
				);
			}
			return;
		}

		if (!node.rawFactoryName) return;

		// --- Taxonomy dispatch ---
		switch (node.modelType) {
			case 'branch':
				wrap.branch(node, kindEntries, nodeMap);
				break;
			case 'polymorph':
				wrap.polymorph(node, kindEntries, nodeMap);
				break;
			default:
				// Leaves, groups, supertypes, tokens — no wrap function
				break;
		}
	},

	/**
	 * Assemble the final output: scan body for drill usage, emit preamble
	 * with conditionally-included drill helpers, then body, _wrapTable,
	 * _aliasTargetToSource, and public entry points.
	 */
	finalize(): string {
		const nodeMap = _wrapEmitterNodeMap;
		const kindEntries = _wrapEmitterKindEntries;
		const typeImportLine = _wrapEmitterTypeImportLine;

		// Build body from collected wrap functions
		const bodyLines: string[] = [];
		for (const source of wrap.collect()) {
			bodyLines.push(source);
			bodyLines.push('');
		}
		const bodySource = bodyLines.join('\n');
		const usesDrillIn = /\bdrillIn\b/.test(bodySource);
		const usesDrillInAll = /\bdrillInAll\b/.test(bodySource);
		const usesDrillAs = /\bdrillAs\b/.test(bodySource);
		const usesDrillAsAll = /\bdrillAsAll\b/.test(bodySource);

		// Preamble (depends on body scan results)
		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'// Lazy view layer over readNode output — shape A surface.',
			'',
			"import { readNode as readNodeJs } from '@sittir/core';",
			"import type { TreeHandle } from '@sittir/core';",
			'// Import _NodeData (== AnyNodeData) from @sittir/types',
			'// instead of re-declaring locally. Single source of truth.',
			"import type { AnyNodeData as _NodeData, AnyNodeData, NonEmptyArray } from '@sittir/types';",
			...(kindEntries ? ["import { TSKindId } from './types.js';"] : []),
			"import type * as T from './types.js';",
			...(typeImportLine ? [typeImportLine] : []),
			"import { withMethods } from './utils.js';",
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
			''
		];
		lines.push(bodySource);

		// _wrapTable — runtime dispatch by kind
		lines.push(
			'const _wrapTable: Record<string, (data: _NodeData, tree: TreeHandle) => unknown> = {'
		);
		for (const [kind, node] of nodeMap.nodes) {
			if (!node.factoryName) continue;
			if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
			if (node.modelType === 'branch' || node.modelType === 'polymorph') {
				lines.push(`  '${kind}': (d, t) => wrap${node.typeName}(d as T.${node.typeName}, t),`);
			} else if (
				node.modelType === 'pattern' ||
				node.modelType === 'enum' ||
				node.modelType === 'keyword'
			) {
				if (kindEntries) {
					const entry = kindEntries.find((e) => e.kind === kind);
					if (entry) {
						lines.push(`  '${kind}': (d) => ({ ...d, $type: TSKindId.${kindIdMemberName(nodeMap, kind)} as const }),`);
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
		const aliasMap = collectAliasTargetToSourceMap(nodeMap);
		lines.push('const _aliasTargetToSource: Record<string, string> = {');
		for (const [target, source] of [...aliasMap.entries()].sort()) {
			lines.push(`  '${target}': '${source}',`);
		}
		lines.push('};');
		lines.push('');

		// Public entry points
		if (kindEntries) {
			lines.push("import { KIND_NAMES } from './types.js';");
		}
		lines.push('/** Wrap a NodeData into its lazy read-only view. */');
		lines.push(
			'export function wrapNode(data: _NodeData, tree: TreeHandle): unknown {'
		);
		lines.push('  // The native path now returns numeric $type');
		lines.push('  // (KindId) from Rust; the JS wasm path still returns string $type.');
		lines.push('  // Resolve to a kind-name string for the string-keyed dispatch tables,');
		lines.push('  // then per-kind wrap functions stamp the numeric TSKindId.$type on output.');
		if (kindEntries) {
			lines.push('  const rawType = typeof data.$type === "number"');
			lines.push('    ? KIND_NAMES.get(data.$type as never) ?? String(data.$type)');
			lines.push('    : (data.$type as unknown as string);');
		} else {
			lines.push('  const rawType = data.$type as unknown as string;');
		}
		lines.push('  // Canonical-hidden remap (Option Y): parser-output `$type`');
		lines.push(
			'  // is the visible alias target (e.g. `range_pattern_left_with_right`);'
		);
		lines.push(
			'  // remap to the hidden alias source (`_range_pattern_left_with_right`)'
		);
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
		lines.push(
			' * Per-handle dispatching `readNode` — the architectural seam where'
		);
		lines.push(' * the engine choice (JS vs native) lives. `readTreeNode`,');
		lines.push(
			' * `drillIn` and `drillAs` all read through THIS function so the'
		);
		lines.push(' * wrap layer is engine-agnostic. tree-sitter `Node::id()` is');
		lines.push(' * documented as "unique within a given syntax tree" and is a');
		lines.push(' * raw pointer cast — different parses yield different ids — so');
		lines.push(' * the engine that parsed the tree is the only thing that can');
		lines.push(' * dereference its ids. Native handles set `tree.read` to a');
		lines.push(' * closure that routes through napi; wasm/JS handles leave it');
		lines.push(
			' * absent and fall back to `readNodeJs` (the in-process walker).'
		);
		lines.push(' */');
		lines.push(
			'function readNode(tree: TreeHandle, handle?: number, childIndex?: number): AnyNodeData {'
		);
		lines.push('  // Per-handle dispatch: native-engine handles carry a `read`');
		lines.push('  // closure that routes through napi (engine owns the tree;');
		lines.push('  // Navigation via handle + childIndex replaces nodeId).');
		lines.push('  // Wasm/JS handles leave `read` absent and fall');
		lines.push('  // back to the in-process JS walker.');
		lines.push(
			'  return tree.read ? tree.read(handle, childIndex) : readNodeJs(tree, handle, childIndex);'
		);
		lines.push('}');
		lines.push('');
		lines.push('/**');
		lines.push(' * Read a parsed tree node into a lazily-wrapped NodeData.');
		lines.push(' * One level deep — getters drill into subtrees on demand by');
		lines.push(' * recursing back through this same function.');
		lines.push(' *');
		lines.push(
			' * Optional `asType: { from, to }` rewrites `$type` between the read'
		);
		lines.push(
			" * and the wrap when the node's actual `$type === from`. Used by"
		);
		lines.push(
			' * `drillAs` for alias-target → alias-source rewrites at'
		);
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
		if (kindEntries) {
			lines.push('  if (asType) {');
			lines.push('    const currentType = typeof data.$type === "number"');
			lines.push('      ? KIND_NAMES.get(data.$type as never) ?? String(data.$type)');
			lines.push('      : (data.$type as unknown as string);');
			lines.push('    if (currentType === asType.from) {');
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
};
