/**
 * Emits wrap.ts — ADR-0018 Phase 2 de-hoisted lazy view layer over readNode output.
 *
 * Mirrors the factory emitter (factories.ts) one-for-one:
 *   - `_<name>` storage keys (enumerable, serializable stubs from data.$fields)
 *   - Non-enumerable accessor functions `name()` that perform lazy drill-in
 *   - `$with` namespace (non-enumerable) that calls the factory for updates
 *   - `withMethods` attaches `$render`/`$toEdit`/`$replace`/`$trivia`
 *   - `freezeNodeData` as the final step
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
	isMultiple
} from './shared.ts';
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

export function emitWrap(config: EmitWrapConfig): string {
	const { nodeMap, generatedIdTables, inlineKinds, synthesizedKinds } = config;

	// Collect KindEnumEntry table for numeric $type stamping when
	// generatedIdTables is present (Phase A KindID migration). Undefined
	// for legacy callers — per-kind wrap functions then inherit $type from data.
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;

	const typeImports = collectTypeImports(nodeMap);
	// Multi-line import for readability — see factories.ts.
	const typeImportLine =
		typeImports.size > 0
			? [
					'import type {',
					...[...typeImports].sort().map((name) => `  ${name},`),
					"} from './types.js';"
				].join('\n')
			: undefined;

	// ------------------------------------------------------------------
	// Per-kind wrap functions — emit first so we can scan for which
	// drill helpers are actually referenced, then conditionally emit
	// only the used ones in the preamble below. Avoids dead-helper
	// lint warnings (`no-unused-vars` on drillAsAll for grammars with
	// no multiple-cardinality alias-source fields).
	// ------------------------------------------------------------------
	const bodyLines: string[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
		// never appear at runtime; wrap functions for them are dead code.
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) {
			if (inlineKinds?.includes(kind)) {
				console.warn(
					`[codegen] '${kind}' is in inline: array — no parser symbol expected. ` +
					`Skipping wrap emission. ` +
					// TODO: map inlined-kind factories to their decomposition (the
					// concrete kinds the inlined rule expands to).
					`Future: map to decomposition.`
				);
			} else if (synthesizedKinds?.has(kind)) {
				// Intentionally synthesized by evaluate — no parser symbol by design.
				// Warn-and-skip, same treatment as inline-list kinds.
			} else {
				console.warn(
					`[codegen] VAPORIZED: '${kind}' has no parser symbol and is ` +
					`NOT in the grammar's inline: array. Skipping wrap ` +
					`emission. Investigate why tree-sitter dropped this rule.`
				);
			}
			continue;
		}
		const source = renderWrapForNode(node, kindEntries, nodeMap);
		if (source === undefined) continue;
		bodyLines.push(source);
		bodyLines.push('');
	}
	const bodySource = bodyLines.join('\n');
	const usesDrillIn = /\bdrillIn\b/.test(bodySource);
	const usesDrillInAll = /\bdrillInAll\b/.test(bodySource);
	const usesDrillAs = /\bdrillAs\b/.test(bodySource);
	const usesDrillAsAll = /\bdrillAsAll\b/.test(bodySource);

	// ------------------------------------------------------------------
	// Preamble
	// ------------------------------------------------------------------
	const lines: string[] = [
		'// Auto-generated by @sittir/codegen — do not edit',
		'// Lazy view layer over readNode output — ADR-0018 Phase 2 de-hoisted surface.',
		'',
		"import { readNode as readNodeJs } from '@sittir/core';",
		"import type { TreeHandle } from '@sittir/core';",
		'// ADR-0018 Phase 2: withMethods/freezeNodeData/buildWithNamespace from @sittir/core.',
		"import { withMethods, freezeNodeData, buildWithNamespace } from '@sittir/core';",
		'// Spec 008 US4 — import _NodeData (== AnyNodeData) from @sittir/types',
		'// instead of re-declaring locally. Single source of truth.',
		"import type { AnyNodeData as _NodeData, AnyNodeData } from '@sittir/types';",
		// When kindEntries is present, import TSKindId for per-kind $type stamping
		// (Phase A KindID migration: wrap normalizes string $type from core to numeric).
		...(kindEntries ? ["import { TSKindId } from './types.js';"] : []),
		...(typeImportLine ? [typeImportLine] : []),
		// ADR-0018 Phase 2: wrap $with calls the corresponding factory to produce
		// factory-output nodes. Import all factories from the generated factories module.
		"import { render, toEdit } from './boundary.ts';",
		"import * as _factories from './factories.js';",
		'',
		'// ADR-0018 Phase 2: reads a raw field value from incoming data — handles both',
		'// the old $fields wrapper (from readNode in @sittir/core) and the new _<name>',
		'// de-hoisted storage (from factory or prior wrap output).',
		'function readRawField(data: AnyNodeData, rawName: string): unknown {',
		'  // as unknown as: AnyNodeData lacks an index signature in TS6 — bridge through unknown.',
		'  const rec = data as unknown as Record<string, unknown>;',
		"  const dehoisted = rec['_' + rawName];",
		'  if (dehoisted !== undefined) return dehoisted;',
		"  const fields = rec['$fields'] as Record<string, unknown> | null | undefined;",
		"  if (fields && typeof fields === 'object') return fields[rawName];",
		'  return undefined;',
		'}',
		'',
		'// Drill-in helpers — call back through `readTreeNode` so the same',
		'// per-handle dispatch + wrap pipeline runs at every level. Layering:',
		'//   readTreeNode (public entry)',
		'//     → readNode (handle-driven — tree.read for native, JS walker otherwise)',
		'//       → wrapNode (dispatches on $type)',
		'//         → drillIn / drillAs → readTreeNode (recurse)',
		...(usesDrillIn
			? [
					'function drillIn(entry: unknown, tree: TreeHandle): unknown {',
					'  if (!entry) return undefined;',
					'  const e = entry as _NodeData;',
					'  if (e.$nodeHandle != null && e.$childIndex != null) return readTreeNode(tree, e.$nodeHandle, e.$childIndex);',
					'  return entry;',
					'}'
				]
			: []),
		...(usesDrillInAll
			? [
					'function drillInAll(entries: unknown, tree: TreeHandle): unknown[] {',
					'  if (!entries) return [];',
					'  const arr = Array.isArray(entries) ? entries : [entries];',
					'  return arr.map(e => drillIn(e, tree));',
					'}'
				]
			: []),
		...(usesDrillAs
			? [
					'// drillAs — field-site unalias for grammar `alias($.source, $.target)`',
					'// declarations (ADR-0006). The `asType` override rewrites $type from',
					"// tree-sitter's alias target back to the codegen-canonical source",
					'// name between the read and the wrap. Conditional rewrite: only',
					"// fires when the child's actual $type matches `fromType`; mixed-",
					'// union fields (e.g. Path | BracketedType | GenericTypeWithTurbofish)',
					'// pass through unchanged when the child arrived as a non-alias kind.',
					'function drillAs(entry: unknown, tree: TreeHandle, fromType: string, toType: string): unknown {',
					'  if (!entry) return undefined;',
					'  const e = entry as _NodeData;',
					'  if (e.$nodeHandle == null || e.$childIndex == null) return entry;',
					'  return readTreeNode(tree, e.$nodeHandle, e.$childIndex, { from: fromType, to: toType });',
					'}'
				]
			: []),
		...(usesDrillAsAll
			? [
					'function drillAsAll(entries: unknown, tree: TreeHandle, fromType: string, toType: string): unknown[] {',
					'  if (!entries) return [];',
					'  const arr = Array.isArray(entries) ? entries : [entries];',
					'  return arr.map(e => drillAs(e, tree, fromType, toType));',
					'}'
				]
			: []),
		''
	];
	lines.push(bodySource);

	// ------------------------------------------------------------------
	// _wrapTable — runtime dispatch by kind
	// ------------------------------------------------------------------
	lines.push(
		'const _wrapTable: Record<string, (data: _NodeData, tree: TreeHandle) => unknown> = {'
	);
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.factoryName) continue;
		// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
		// never appear in a parsed tree; no wrap entry is needed.
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		if (node.modelType === 'branch' || node.modelType === 'polymorph') {
			lines.push(`  '${kind}': (d, t) => wrap${node.typeName}(d, t),`);
		} else if (
			node.modelType === 'leaf' ||
			node.modelType === 'enum' ||
			node.modelType === 'keyword'
		) {
			// Terminal nodes have no subtree to drill into — pass through,
			// but stamp numeric $type when kindEntries is present (Phase B-inverse:
			// readNode returns string $type from the JS wasm path; wrap normalizes it).
			if (kindEntries) {
				const entry = kindEntries.find((e) => e.kind === kind);
				if (entry) {
					lines.push(`  '${kind}': (d) => ({ ...d, $type: TSKindId.${kindIdMemberName(nodeMap, kind)} as number }),`);
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

	// ------------------------------------------------------------------
	// _aliasTargetToSource — canonical-hidden remap (Option Y)
	// ------------------------------------------------------------------
	// tree-sitter parses `alias($._x, $.x)` and emits `$type = 'x'`
	// (the visible alias target). The codegen surface (interfaces,
	// factories, templates) treats the hidden source `_x` as canonical.
	// wrapNode consults this map on receipt and rewrites `$type` from
	// visible → hidden BEFORE dispatching to the per-kind wrap function
	// so consumers always see the canonical hidden form.
	const aliasMap = collectAliasTargetToSourceMap(nodeMap);
	lines.push('const _aliasTargetToSource: Record<string, string> = {');
	for (const [target, source] of [...aliasMap.entries()].sort()) {
		lines.push(`  '${target}': '${source}',`);
	}
	lines.push('};');
	lines.push('');

	// ------------------------------------------------------------------
	// Public entry points
	// ------------------------------------------------------------------
	// Import KIND_NAMES when kindEntries is present so wrapNode can resolve
	// numeric $type (from the native path) to a string for the dispatch tables.
	if (kindEntries) {
		lines.push("import { KIND_NAMES } from './types.js';");
	}
	lines.push('/** Wrap a NodeData into its lazy read-only view. */');
	lines.push(
		'export function wrapNode(data: _NodeData, tree: TreeHandle): unknown {'
	);
	lines.push('  // Phase B-inverse bridge: the native path now returns numeric $type');
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
	lines.push('  // ADR-0017: navigation via handle + childIndex replaces nodeId).');
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
		' * `drillAs` for ADR-0006 alias-target → alias-source rewrites at'
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
	lines.push('  // Phase B-inverse: asType comparison must handle both string and numeric $type.');
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collects the set of concrete interface type names that need to be imported.
 *
 * ADR-0018 Phase 2: wrap functions return `AnyNodeData` (not `WrappedNode<T>`),
 * so no per-kind type imports are needed. Returns an empty set.
 *
 * @param _nodeMap - The fully assembled node map for the grammar (unused).
 * @returns An empty set — no per-kind type imports needed.
 */
function collectTypeImports(_nodeMap: NodeMap): Set<string> {
	// ADR-0018 Phase 2: wrap functions return AnyNodeData; no WrappedNode<T>
	// per-kind type imports required.
	return new Set<string>();
}

// ---------------------------------------------------------------------------
// Per-node wrap dispatch
// ---------------------------------------------------------------------------

function renderWrapForNode(
	node: AssembledNode,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string | undefined {
	if (!node.rawFactoryName) return undefined;

	switch (node.modelType) {
		case 'branch':
			// Phase 1d.vii (spec 022): the former `'container'` modelType is
			// now `'branch'` with `fields.length === 0`. Both shapes share the
			// same wrap entry — fields is `[]` for the container case which
			// `emitFieldCarryingWrap` already handles.
			//
			// NOTE: class getters are NOT enumerable, so we must pass explicitly
			// rather than relying on { ...node } to capture prototype-defined
			// getters like `rawFactoryName` and `isContainerShape`.
			return emitFieldCarryingWrap(
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
		case 'polymorph': {
			const { fields, children } =
				mergePolymorphFormsIntoFieldsAndChildren(node);
			// Polymorph wraps never have container shape — they always have at least
			// one form with fields. Pass rawFactoryName explicitly (class getters are
			// NOT enumerable, so { ...node } would lose it).
			return emitFieldCarryingWrap(
				{
					kind: node.kind,
					typeName: node.typeName,
					rawFactoryName: node.rawFactoryName,
					isContainerShape: false
				},
				fields,
				children,
				kindEntries,
				nodeMap
			);
		}
		default:
			return undefined;
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
// Field-carrying wrap — ADR-0018 Phase 2 de-hoisted lazy view layer
// ---------------------------------------------------------------------------

interface WrapNode {
	readonly kind: string;
	readonly typeName: string;
	/** rawFactoryName for $with — null when the kind has no factory. */
	readonly rawFactoryName?: string;
	/** True when this is a container-shaped node (rest-param factory, no named fields). */
	readonly isContainerShape?: boolean;
}

/**
 * Resolve the drill-in expression for a field storage assignment.
 * Returns the raw-field read expression AND the drill-in accessor expression.
 *
 * @param f - The assembled nonterminal field descriptor.
 * @returns An object with `storeExpr` (for `_node._name = ...`) and
 *   `accessorBody` (for the non-enumerable accessor function body).
 */
function resolveFieldDrillExprs(f: AssembledNonterminal): {
	storeExpr: string;
	accessorBody: string;
} {
	const aliasEntries = f.aliasSources ? Object.entries(f.aliasSources) : [];
	if (aliasEntries.length > 0) {
		const [fromType, toType] = aliasEntries[0]!;
		const helper = isMultiple(f) ? 'drillAsAll' : 'drillAs';
		return {
			storeExpr: `readRawField(data, '${f.name}')`,
			accessorBody: `return ${helper}((this as Record<string,unknown>)['_${f.name}'], tree, ${JSON.stringify(fromType)}, ${JSON.stringify(toType)})`,
		};
	} else if (isMultiple(f)) {
		return {
			storeExpr: `readRawField(data, '${f.name}')`,
			accessorBody: `return drillInAll((this as Record<string,unknown>)['_${f.name}'], tree)`,
		};
	} else {
		return {
			storeExpr: `readRawField(data, '${f.name}')`,
			accessorBody: `return drillIn((this as Record<string,unknown>)['_${f.name}'], tree)`,
		};
	}
}

/**
 * Emit a per-kind wrap function using the ADR-0018 Phase 2 de-hoisted surface:
 * `_<name>` storage, non-enumerable accessor functions, `$with` namespace,
 * `withMethods`, and `freezeNodeData`.
 *
 * The function signature returns `AnyNodeData` (not `WrappedNode<T>`) because
 * the frozen-accessor shape is structurally identical to factory output and
 * `WrappedNode<T>` is no longer needed as a separate surface type.
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
	// Signature: returns AnyNodeData (frozen, accessor-equipped, same shape as factory).
	lines.push(`export function ${fn}(data: _NodeData, tree: TreeHandle): AnyNodeData {`);

	// Build mutable _node with $-metadata spread + _<name> storage.
	lines.push('  const _node: Record<string,unknown> = {');
	lines.push('    ...data,');
	// Phase A KindID migration: override $type with the numeric TSKindId.X discriminant.
	if (kindEntries) {
		const entry = kindEntries.find((e) => e.kind === node.kind);
		if (entry) {
			lines.push(`    $type: TSKindId.${kindIdMemberName(nodeMap, node.kind)} as number,`);
		}
	}
	// Named fields → `_<name>` storage (enumerable).
	for (const f of fields) {
		const { storeExpr } = resolveFieldDrillExprs(f);
		lines.push(`    _${f.name}: ${storeExpr},`);
	}
	// Unnamed children slot — pass through from data (stubs; drilled lazily by consumer).
	if (children.length > 0) {
		// as unknown as: AnyNodeData lacks an index signature in TS6 — bridge through unknown.
		lines.push('    $children: (data as unknown as Record<string,unknown>)[\'$children\'],');
	}
	lines.push('  };');
	// Strip legacy $fields from the spread — not part of de-hoisted surface.
	lines.push("  delete _node['$fields'];");

	// Non-enumerable accessor functions: `name()` returns drilled value via `this._name`.
	for (const f of fields) {
		const propName = f.propertyName === 'type' ? 'typeField' : f.propertyName;
		const { accessorBody } = resolveFieldDrillExprs(f);
		lines.push(
			`  Object.defineProperty(_node, '${propName}', { value: function() { ${accessorBody}; }, enumerable: false, writable: false, configurable: false });`
		);
	}

	// $with namespace — calls the corresponding factory for update operations.
	if (node.rawFactoryName) {
		if (node.isContainerShape) {
			// Container-shape branches: factory takes rest-params (...children), NOT a
			// config object. buildWithNamespace is wrong here — emit a direct lambda $with
			// that matches the container factory's signature (same as emitContainerFactory).
			const anyMultiple = children.some((c) => isMultiple(c));
			// as unknown as Record<...>: _factories is a module namespace — its type is
			// not assignable to Record<string, fn> directly. Route through unknown for
			// cross-shape bridging (CLAUDE.md: allowed in dsl/ cross-runtime shape bridging).
			// Non-null `!` after indexed factory access: the factory name is codegen-guaranteed
			// to exist in the factories module. TS6 strict Record indexing returns `fn | undefined`.
			if (anyMultiple) {
				lines.push(
					`  Object.defineProperty(_node, '$with', { value: { $children: (...vs: unknown[]) => (_factories as unknown as Record<string, (...a: unknown[]) => AnyNodeData>)['${node.rawFactoryName}']!(...vs) }, enumerable: false, writable: false, configurable: false });`
				);
			} else {
				lines.push(
					`  Object.defineProperty(_node, '$with', { value: { $child: (v: unknown) => (_factories as unknown as Record<string, (...a: unknown[]) => AnyNodeData>)['${node.rawFactoryName}']!(v) }, enumerable: false, writable: false, configurable: false });`
				);
			}
		} else {
			// Field-carrying branches: build a lazy config that reads current values via
			// accessor functions, materializing stubs when $with.name(v) is called.
			const slotKeyPairs: [string, string][] = fields.map((f) => [
				`_${f.name}`,
				f.propertyName
			]);
			// Children slot: include $children in $with when children are present.
			if (children.length > 0) {
				slotKeyPairs.push(['$children', 'children']);
			}
			if (slotKeyPairs.length > 0) {
				const configEntries: string[] = [];
				for (const f of fields) {
					const propName = f.propertyName === 'type' ? 'typeField' : f.propertyName;
					// Use the accessor function to get the drilled value for the config.
					configEntries.push(`    get ${f.propertyName}() { return (_node as any)['${propName}']?.(); }`);
				}
				if (children.length > 0) {
					// For children, drill all stubs eagerly for the config.
					configEntries.push(`    get children() { const ch = (_node as Record<string,unknown>)['$children']; return Array.isArray(ch) ? (ch as unknown[]).map(c => drillIn(c, tree)) : []; }`);
				}
				lines.push('  const _wrapConfig = {');
				for (const entry of configEntries) {
					lines.push(entry + ',');
				}
				lines.push('  };');
				const pairsStr = slotKeyPairs
					.map(([s, c]) => `['${s}', '${c}']`)
					.join(', ');
				// as unknown as Record<...>: _factories is a module namespace — its type is
				// not assignable to Record<string, fn> directly. Route through unknown for
				// cross-shape bridging (CLAUDE.md: allowed in dsl/ cross-runtime shape bridging).
				lines.push(
					`  const _with = buildWithNamespace(_wrapConfig as Record<string,unknown>, (_factories as unknown as Record<string, (c: Record<string,unknown>) => AnyNodeData>)['${node.rawFactoryName}'] as (c: Record<string,unknown>) => AnyNodeData, [${pairsStr}] as const);`
				);
				lines.push(
					`  Object.defineProperty(_node, '$with', { value: _with, enumerable: false, writable: false, configurable: false });`
				);
			} else {
				lines.push(
					`  Object.defineProperty(_node, '$with', { value: {}, enumerable: false, writable: false, configurable: false });`
				);
			}
		}
	}

	lines.push(`  return freezeNodeData(withMethods(_node, { render, toEdit }));`);
	lines.push('}');
	return lines.join('\n');
}
