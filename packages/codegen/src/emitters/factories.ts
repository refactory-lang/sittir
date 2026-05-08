/**
 * Emits factories.ts — consumes NodeMap directly.
 *
 * Owns ALL factory string generation. Rule.ts exposes the IR
 * (AssembledNode class hierarchy, derivation functions) but does
 * not know how to spell a factory. This file dispatches on
 * `node.modelType` and calls model-specific helpers locally.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	kindDiscriminantExpr,
	hasCatalogEntry,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { type AssembledNode, type AssembledNonterminal, AssembledGroup } from '../compiler/node-map.ts';
import { isNodeRef, isTerminalValue, isUnresolvedRef, allSlotsOf } from '../compiler/node-map.ts';
import {
	resolveEffectiveLiteral,
	isAutoStampSlot,
	stampExpressionFor,
	isRequired,
	isMultiple,
	isNonEmpty,
	slotKindNames,
	slotLiteralValues,
	resolveHoistedForm,
	type HoistedForm,
	fieldTypeComponents,
	isValidIdent,
	keywordPresenceKind,
	resolveFieldStorageInfo,
	resolveHiddenKeywordLiteral,
	classifyFactoryShape,
	classifyChildFactorySurface,
	classifyFactoryEmission,
	warnSkippedParserSymbol
} from './shared.ts';
import {
	collectRefineKindInfos,
	refineFormTypeName,
	refineFormFactoryName,
	type RefineKindInfo,
	type RefineFormInfo
} from './refine-emit.ts';
import type { CodegenEmitter } from './emitter.ts';

export interface EmitFactoriesConfig {
	grammar: string;
	nodeMap: NodeMap;
	/** Emit runtime leaf pattern validation. Default `false`. */
	strict?: boolean;
	/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * factories stamp numeric `$type: TSKindId.X` discriminants. When absent
	 * (legacy callers / unit tests), falls back to string `$type: 'kind' as const`.
	 */
	generatedIdTables?: GeneratedIdTables;
	kindEntries?: readonly KindEnumEntry[];
	/**
	 * Kind names listed in the grammar's `inline:` array. When a kind has no
	 * parser symbol AND appears here, it's a deliberately inlined rule — warn
	 * and skip. When it's absent from this list, it's a codegen bug — throw.
	 */
	inlineKinds?: readonly string[];
	/**
	 * Kind names synthesized by evaluate's inline-alias-source pass
	 * (`synthesizeInlineAliasSources`). These have no parser symbol by design;
	 * warn and skip, same treatment as inline-list kinds.
	 */
	synthesizedKinds?: ReadonlySet<string>;
}

/**
 * Standalone entry point — preserved for backwards compatibility (tests,
 * CLI callers). Delegates to the emitter protocol (init → loop → finalize).
 */
export function emitFactories(config: EmitFactoriesConfig): string {
	const factoryEmitter = new FactoryEmitter(config);
	for (const [kind, node] of config.nodeMap.nodes) {
		factoryEmitter.dispatchNode(kind, node);
	}
	return factoryEmitter.finalize();
}

// ---------------------------------------------------------------------------
// emitFactories helpers
// ---------------------------------------------------------------------------

/**
 * Detect whether any field across all nodes uses `nonEmpty: true`.
 *
 * @param nodeMap - The assembled node map for the grammar.
 * @returns `true` when at least one field carries `nonEmpty`, triggering the
 *   `NonEmptyArray` import in the generated file.
 * @remarks
 *   `NonEmptyArray` is conditional on any field having `nonEmpty: true`
 *   (rust has none; typescript + python do). `Edit` was previously
 *   imported but no emitted body references it — dropped.
 */
function collectUsesNonEmptyArray(nodeMap: NodeMap): boolean {
	return [...nodeMap.nodes.values()].some((n) => allSlotsOf(n).some((f) => isNonEmpty(f)));
}

/**
 * Does any polymorph in this grammar have a form that qualifies for the
 * hoisted Config shape (inner-child fields surfaced at the parent's
 * Config)? The unified hoisted factory types its `config` parameter as
 * `ConfigOf<T.<FormTypeName>>` which pulls the `ConfigOf` generic in
 * from `@sittir/types`; gate the import on whether any factory actually
 * uses it.
 */
function collectUsesHoistedPolymorphForm(nodeMap: NodeMap): boolean {
	// Any polymorph parent triggers `ConfigOf` usage — both the
	// dispatcher overloads (`ConfigOf<T.FooUFormX>`) and the per-form
	// signatures (`Omit<ConfigOf<T.FooUFormX>, '$variant'>`) reference
	// it regardless of whether `resolveHoistedForm` fires. The earlier
	// hoisted-only check missed grammars whose polymorph forms are all
	// non-hoisted (e.g. python, whose polymorph forms have no inner
	// field-carrying kind with a factory), leaving `ConfigOf`
	// unimported in the emitted factories.ts.
	for (const n of nodeMap.nodes.values()) {
		if (n.modelType === 'polymorph') return true;
	}
	return false;
}

/**
 * The old `_setField`, `_setFields`, `_branchMethods`, and
 * `_leafMethods` helpers are replaced by the `withMethods`/`freezeNodeData`/
 * `buildWithNamespace` runtime helpers from `@sittir/core`. Nothing to emit here.
 *
 * @returns Empty array — kept for call-site symmetry with `emitNonEmptyAssertHelper`.
 */
function emitFluentSetterHelpers(): string[] {
	return [];
}

/**
 * Emit the `_assertNonEmpty` runtime guard + static narrowing helper source lines.
 *
 * @returns Array of source lines for the helper (without trailing blank line).
 * @remarks
 *   Callers get `readonly T[]` from input collections (`_children.filter(...)`,
 *   `_resolveMany(...)`, etc.) but the factory's stored shape is the non-empty
 *   tuple `readonly [T, ...T[]]`. This assertion function throws on empty input
 *   AND narrows the static type of the argument so the subsequent assignment /
 *   spread type-checks without a cast.
 */
function emitNonEmptyAssertHelper(): string[] {
	return [
		'function _assertNonEmpty<T>(',
		'  arr: readonly T[],',
		'  label: string,',
		'): asserts arr is readonly [T, ...(readonly T[])] {',
		"  if (typeof process !== 'undefined' && !process.env.SITTIR_DEBUG) return;",
		'  if (arr.length === 0) {',
		'    throw new Error(`${label}: requires at least one element`);',
		'  }',
		'}'
	];
}

function emitConfigChildrenHelper(): string[] {
	return [
		'function _configChildren<T>(config: unknown, fallback: T): T {',
		"  if (config === null || config === undefined || typeof config !== 'object') return fallback;",
		"  if (!('children' in config)) return fallback;",
		'  return ((config as { readonly children?: T }).children ?? fallback);',
		'}'
	];
}

/**
 * Compile leaf-pattern `RegExp` constants and push their declarations into `lines`.
 *
 * @param nodeMap - The assembled node map to scan for leaf nodes with patterns.
 * @param lines - Output line buffer; `const _leafRe_<name> = /.../` declarations
 *   are appended here as a side effect.
 * @returns Map from kind string to the emitted constant name (e.g. `_leafRe_identifier`).
 * @throws When a leaf pattern does not compile as a JavaScript `RegExp` under either
 *   the `'u'` flag or no flag.
 * @remarks
 *   RegExp constants are hoisted to module scope so they are compiled once at load
 *   time rather than per-call. For each patterned leaf, the `'u'` flag is tried
 *   first (needed for `\p{...}` property escapes), then no-flag. The constant name
 *   is `_leafRe_<camelKind>`; the leaf factory references it instead of the previous
 *   inline try/catch block.
 */
function buildLeafReConsts(nodeMap: NodeMap, lines: string[]): Map<string, string> {
	const leafReConsts = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		// Token modelType hidden kinds (e.g. `_range_pattern_left_bare` = '..') have
		// no standalone factory — skip their regex consts. Non-token hidden kinds
		// (groups, branches) get fragment factories and may carry patterns.
		if (kind.startsWith('_') && node.modelType === 'token') continue;
		if (node.modelType !== 'pattern' || !node.pattern) continue;
		const fn = node.rawFactoryName!;
		const constName = `_leafRe_${fn}`;
		const cleaned = stripUselessEscapes(node.pattern);
		const fullPattern = `^(?:${cleaned})$`;
		// Compile at codegen time to pick the flag. If NEITHER flag
		// compiles the grammar has a pattern we can't turn into a runtime
		// regex — surface this loudly instead of silently dropping the
		// validation guard (which would let the factory accept any string
		// for this leaf kind, bypassing grammar constraints).
		let flag: 'u' | '' = 'u';
		try {
			new RegExp(fullPattern, 'u');
		} catch {
			try {
				new RegExp(fullPattern);
				flag = '';
			} catch (e) {
				throw new Error(
					`factories emitter: leaf '${kind}' pattern does not compile as a JavaScript RegExp ` +
						`(tried 'u' flag and no-flag). Pattern: ${JSON.stringify(fullPattern)}. ` +
						`Cause: ${(e as Error).message}. ` +
						`Either fix the grammar or add the kind to an emitter exception list.`
				);
			}
		}
		// Prefer a regex literal when the pattern has no unescaped `/`
		// (which would break the literal delimiter). Escape `/` if present.
		const escapedForLiteral = cleaned.replace(/\//g, '\\/');
		const literal = flag === 'u' ? `/${`^(?:${escapedForLiteral})`}/u` : `/${`^(?:${escapedForLiteral})`}/`;
		leafReConsts.set(kind, constName);
		lines.push(`const ${constName} = ${literal};`);
	}
	return leafReConsts;
}

/**
 * Collect all kind strings that appear as alias sources in any field across the node map.
 *
 * @param nodeMap - The assembled node map to scan.
 * @returns Set of kind strings that are alias sources.
 * @remarks
 *   Hidden rules (prefix `_`) are normally skipped — they're grammar machinery,
 *   not user-facing kinds. The exception: hidden rules that appear as alias sources.
 *   `alias($._match_block, $.block)` means the body's canonical shape is
 *   `_match_block`; validators drilling into an aliased field need a factory that
 *   accepts the source kind so alias-symmetric dispatch works through the
 *   `_fieldAliasMap`.
 */
// Re-export the shared helper under the existing name used throughout
// this module — collectAliasSourceKinds lives in ./shared.ts so the
// template emitter can use the same rule.
import { collectAliasSourceKinds as collectAliasSourceKindsShared } from './shared.ts';
function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
	const out = collectAliasSourceKindsShared(nodeMap);
	// Also include slot-level aliasSources (the legacy channel —
	// some paths populate this without a hidden-ref value slot).
	for (const [, n] of nodeMap.nodes) {
		for (const f of allSlotsOf(n)) {
			if (!f.aliasSources) continue;
			for (const source of Object.values(f.aliasSources)) out.add(source as string);
		}
	}
	return out;
}

/**
 * Produce the `$type` line for a factory return object literal.
 *
 * When `kindEntries` is present, emits the
 * numeric `TSKindId.X` discriminant. Without it (legacy callers / unit
 * tests), falls back to `'kind' as const` so the emitter is backward-
 * compatible.
 */
function factoryTypeDiscriminant(
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (!kindEntries) return `'${kind}' as const`;
	// All factory-emitting kinds must have a parser symbol. If kindEntries is
	// present and this kind is absent, it's a TSGrammar-only kind that should
	// have been filtered before reaching here — throw loudly so the emitter
	// bug is surfaced at codegen time rather than producing a string $type.
	if (!hasCatalogEntry(kindEntries, kind)) {
		throw new Error(
			`factoryTypeDiscriminant: kind '${kind}' has no parser symbol (TSGrammar-only). ` +
				`Filter this kind at the emitter entry point before calling factoryTypeDiscriminant.`
		);
	}
	// `as const` narrows the literal type to the specific TSKindId member
	// (e.g. `TSKindId.RangeExpressionBinary`), keeping `$type` discriminable
	// for kind-narrowing in consumers — `is.functionItem(node)` etc. all
	// match against the const-enum value, not the widened `number` type.
	// Factory output remains structurally compatible with `AnyNodeData`
	// because const-enum members ARE numeric at runtime; the $type read
	// path doesn't widen.
	return `${kindDiscriminantExpr(kind, nodeMap, kindEntries)} as const`;
}

/**
 * Emit factory source for each eligible node and push it into `lines`.
 *
 * @param nodeMap - The assembled node map.
 * @param strict - Whether runtime leaf pattern validation is enabled.
 * @param aliasSourceKinds - Set of kinds that are alias sources (included even if hidden).
 * @param leafReConsts - Map from kind to its compiled-regex constant name.
 * @param kindEntries - KindEnumEntry list for numeric $type emission; undefined for legacy fallback.
 * @param lines - Output line buffer; factory declarations are appended here.
 * @remarks
 *   Dispatch is on `modelType`. Polymorph form groups are skipped at the top
 *   level because the polymorph dispatcher emits its forms inline.
 */
/**
 * Build the map entries list for `_factoryMap` and `FluentKindMap`.
 *
 * @param nodeMap - The assembled node map.
 * @param aliasSourceKinds - Set of kinds that are alias sources (included even if hidden).
 * @returns Ordered array of map entry descriptors.
 * @remarks
 *   Every kind with a factory lands here — branches, containers, polymorphs, leaves,
 *   keywords, enums — because each entry's type is `typeof <factory>`, so the map
 *   slot uses the factory's own signature directly. Polymorph forms are reached
 *   through the parent polymorph dispatcher and are not registered separately.
 */
function buildFactoryMapEntries(
	nodeMap: NodeMap,
	_aliasSourceKinds: Set<string>,
	kindEntries?: readonly KindEnumEntry[]
): MapEntry[] {
	const mapEntries: MapEntry[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		// Include hidden non-token groups even when not userFacing — same
		// predicate as emitPerNodeFactories so the map and emission stay in sync.
		const isHiddenGroup = kind.startsWith('_') && node.modelType !== 'token' && node.modelType !== 'multi';
		if (!node.userFacing && !isHiddenGroup) continue;
		if (!node.rawFactoryName) continue;
		if (nodeMap.polymorphFormKinds.has(kind)) continue;
		// Hidden single-literal `_kw_*` keywords are inlined at every
		// reference (factory fields emit the literal string directly,
		// see `keywordPresenceAssignmentExpr`), so they never need a
		// factory / `replace()` method / NamespaceMap entry. Dropping
		// them also removes the dangling `T.Kw<Keyword>` / `T.Kw<
		// Keyword>Tree` type references that would otherwise survive
		// after types.ts skipped emitting those aliases. Lockstep with
		// `emitLeafTerminalAliases` / `emitTreeInterfaceDeclarations`.
		if (resolveHiddenKeywordLiteral(kind, nodeMap) !== undefined) continue;
		// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
		// never appear at runtime; no factory was emitted for them, so no map
		// entry either. Lockstep with emitPerNodeFactories.
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		const fluent = node.modelType === 'branch' || node.modelType === 'polymorph';
		const classified = classifyFactoryShape(node, nodeMap, { includeTokenText: true });
		if (!classified) continue;
		const shape = classified === 'spread' ? 'children' : classified;
		mapEntries.push({
			kind,
			factory: node.rawFactoryName,
			typeName: node.typeName,
			fluent,
			shape
		});
	}
	return mapEntries;
}

/**
 * Emit `FluentKindMap` type declaration source lines.
 *
 * @param mapEntries - Factory map entry descriptors produced by `buildFactoryMapEntries`.
 * @returns Array of source lines for the type declaration.
 * @remarks
 *   Only branches / containers / polymorphs get a `FluentNode` entry; leaves /
 *   keywords / enums produce raw `NodeData` instead and are keyed to their own
 *   interface.
 */
function emitFluentKindMap(mapEntries: MapEntry[]): string[] {
	const lines: string[] = [];
	lines.push('export type FluentKindMap = {');
	for (const { kind, typeName, fluent } of mapEntries) {
		if (fluent) {
			// Base kinds (mapEntries skips polymorph forms) have namespace
			// sugar — use `T.${typeName}.Config` instead of the legacy flat alias.
			lines.push(`  ${JSON.stringify(kind)}: FluentNode<${JSON.stringify(kind)}, T.${typeName}.Config>;`);
		} else {
			lines.push(`  ${JSON.stringify(kind)}: T.${typeName};`);
		}
	}
	lines.push('};');
	return lines;
}

/**
 * Emit `_factoryMap` const and `_FactoryMap` type alias source lines.
 *
 * @param mapEntries - Factory map entry descriptors produced by `buildFactoryMapEntries`.
 * @returns Array of source lines for the const and type alias.
 * @remarks
 *   Declared as a plain const so every entry's type comes from the factory's own
 *   signature via inference. `_FactoryMap` is then just `typeof _factoryMap`,
 *   giving consumers a precise type for each slot without duplicating the
 *   kind→factory mapping.
 */
function emitFactoryMapConst(mapEntries: MapEntry[]): string[] {
	const lines: string[] = [];
	lines.push('export const _factoryMap = {');
	for (const { kind, factory } of mapEntries) {
		lines.push(`  ${JSON.stringify(kind)}: ${factory},`);
	}
	lines.push('} as const;');
	lines.push('export type _FactoryMap = typeof _factoryMap;');
	return lines;
}

// ---------------------------------------------------------------------------
// Namespace — taxonomy-keyed factory dispatch API
// ---------------------------------------------------------------------------

/**
 * Taxonomy-keyed factory dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
export namespace factory {
	/** Back-compat no-op; collection state now lives on emitter instances. */
	export function init(): void {
		// No-op.
	}

	/** Back-compat stub; callers now own the output buffer directly. */
	export function collect(): string[] {
		return [];
	}

	/**
	 * Emit a leaf factory (pattern, keyword, enum).
	 */
	export function leaf(
		output: string[],
		node: AssembledNode,
		nodeMap: NodeMap,
		leafReConsts: Map<string, string>,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		if (!node.rawFactoryName) return;
		let result: string | undefined;
		switch (node.modelType) {
			case 'pattern': {
				const guards = buildLeafGuards(node, leafReConsts);
				const guard = guards.join(' ');
				result = emitTextFactory(node, '(text: string)', 'text', guard, kindEntries, nodeMap);
				break;
			}
			case 'keyword':
				result = emitTextFactory(node, '()', `'${escForSource(node.text)}' as const`, undefined, kindEntries, nodeMap);
				break;
			case 'enum': {
				const literalUnion = buildEnumLiteralUnion(node);
				result = emitTextFactory(node, `(text: ${literalUnion})`, 'text', undefined, kindEntries, nodeMap);
				break;
			}
			default:
				break;
		}
		if (result) output.push(result);
	}

	/**
	 * Emit a branch factory — either container-shape (rest-param) or
	 * field-carrying (config object, internally routes to single-field
	 * when applicable).
	 */
	export function branch(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'branch' }>,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		let result: string;
		if (classifyChildFactorySurface(node, nodeMap) !== null) {
			result = emitContainerFactory(
				{
					kind: node.kind,
					typeName: node.typeName,
					treeTypeName: node.treeTypeName,
					rawFactoryName: node.rawFactoryName,
					children: node.children
				},
				nodeMap,
				kindEntries
			);
		} else {
			result = emitFieldCarryingFactory(node, node.fields, node.children, nodeMap, false, kindEntries);
		}
		output.push(result);
	}

	/**
	 * Emit a polymorph factory — dispatcher + per-form inline factories.
	 */
	export function polymorph(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'polymorph' }>,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		const result = emitPolymorphFactory(node, nodeMap, kindEntries);
		output.push(result);
	}

	/**
	 * Emit a group factory — field-carrying factory for hidden composition
	 * fragments (polymorph form inner kinds).
	 */
	export function group(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'group' }>,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		const result = emitFieldCarryingFactory(node, node.fields, node.children, nodeMap, false, kindEntries);
		output.push(result);
	}
}

/**
 * Build the runtime guard statements for a leaf factory.
 *
 * @param node - The leaf `AssembledNode` to generate guards for.
 * @param leafReConsts - Map from kind string to the module-level regex constant name.
 * @returns Array of guard statement strings (each is a complete `if (...) throw` statement).
 * @remarks
 *   Leaf factories accept arbitrary text but receive two categories of runtime guard:
 *
 *   1. **Pattern** — the module-level `_leafRe_*` const (hoisted for zero per-call
 *      regex compilation cost) is used directly if available.
 *
 *   2. **Non-empty** — every leaf gets this guard unconditionally. A named terminal
 *      always has at least one character in the parse tree, so an empty string is
 *      always semantically invalid regardless of pattern, word-kind, or enum constraints.
 *
 *   Reserved-keyword exclusion is intentionally omitted. The earlier heuristic
 *   ("if text matches word-pattern AND is in the collected keyword set, reject")
 *   rejected legitimate constructions: rust `_` in `'_` elided-lifetime identifier,
 *   python `print`/`match`/`exec` in identifier contexts (permitted via the grammar's
 *   `keyword_identifier` alias-to-identifier). Tree-sitter resolves these by grammar
 *   context; the factory has no context and cannot distinguish "this identifier slot
 *   permits the keyword" from "this one doesn't". The pattern check above still
 *   rejects non-identifier-shaped input; tree-sitter reparse in validators catches
 *   semantic misuse.
 */
function buildLeafGuards(node: { kind: string }, leafReConsts: Map<string, string>): string[] {
	const guards: string[] = [];
	const reConst = leafReConsts.get(node.kind);
	if (reConst) {
		guards.push(
			`if (typeof process !== 'undefined' && process.env.SITTIR_DEBUG && !${reConst}.test(text)) throw new Error(\`${node.kind}: text does not match pattern: \${text}\`);`
		);
	}
	guards.unshift(
		`if (typeof process !== 'undefined' && process.env.SITTIR_DEBUG && text.length === 0) throw new Error(\`${node.kind}: text must be non-empty\`);`
	);
	return guards;
}

/**
 * Build a TypeScript literal-union string for all enum values.
 *
 * @param node - The enum `AssembledNode` with a `values` array.
 * @returns A TS source string like `'foo' | 'bar' | 'baz'`.
 * @remarks
 *   Enums use compile-time literal-union typing on the parameter — the type
 *   system enforces the valid set, so no runtime `.includes()` guard is emitted.
 *   The `from()` resolvers that call enum factories via `Parameters<>` cast are
 *   trusted paths that do their own validation.
 */
function buildEnumLiteralUnion(node: { values: readonly string[] }): string {
	return node.values.map((v) => `'${escForSource(v)}'`).join(' | ');
}

// ---------------------------------------------------------------------------
// Field-carrying factory (branches, groups, polymorph forms)
// ---------------------------------------------------------------------------

type FieldCarryingNode = Extract<AssembledNode, { modelType: 'branch' | 'group' | 'polymorph' }>;

/** Resolve a container node's children element type to a concrete TS type expression. */
export function childElementType(node: { children: readonly AssembledNonterminal[] }, nodeMap: NodeMap): string {
	const parts = new Set<string>();
	for (const c of node.children) {
		for (const t of slotKindNames(c)) {
			// Hidden-keyword kinds (`_not_escape_sequence` → `'\\'`) inline
			// their literal as a string type member — same rule types.ts
			// applies to `fieldTypeComponents`. Avoids dangling references
			// to `NotEscapeSequence` / `KwMove` etc.
			const lit = resolveHiddenKeywordLiteral(t, nodeMap);
			if (lit !== undefined) {
				parts.add(JSON.stringify(lit));
				continue;
			}
			let ref = nodeMap.nodes.get(t);
			if (!ref) {
				parts.add(JSON.stringify(t));
				continue;
			}
			// Hidden kinds with `multi` or `token` modelType don't get
			// exported interfaces (types.ts excludes them from emission).
			// When their typeName was collision-renamed (e.g.,
			// `_expression_statement_tuple` → `_ExpressionStatementTuple`),
			// the `T._X` reference is dangling. Redirect to the visible
			// counterpart (strip leading `_`) which has a standalone
			// exported interface. The runtime shapes are structurally
			// compatible (same fields/children).
			if (t.startsWith('_') && (ref.modelType === 'multi' || ref.modelType === 'token')) {
				const visible = nodeMap.nodes.get(t.slice(1));
				if (visible) ref = visible;
			}
			const name = ref.typeName;
			parts.add(/^[A-Za-z_$][\w$]*$/.test(name) ? `T.${name}` : JSON.stringify(t));
		}
	}
	if (parts.size === 0) return 'never';
	const union = [...parts].join(' | ');
	return parts.size > 1 ? `(${union})` : union;
}

/**
 * Build the TypeScript stamp expression for an auto-stamp-eligible field.
 *
 * @remarks
 * Two cases:
 *
 * - **Source A** (`field.literalValues.length === 1`): the field content is an
 *   inline string literal. Stamp the string directly, e.g. `'pub' as const`.
 *
 * - **Source B** (`field.contentTypes.length === 1` and the referenced kind is
 *   an `AssembledKeyword`): the field content is a hidden-rule terminal with a
 *   single word-like text value (e.g. `_kw_async`). Stamp a minimal leaf
 *   NodeData object whose shape matches `Terminal<kind, text>`:
 *   `{ $type: '_kw_async', $text: 'async', $source: 2, $named: true }`.
 *
 * Returns `undefined` when the field is NOT auto-stamp-eligible.
 */
function autoStampExpression(f: AssembledNonterminal, nodeMap: NodeMap): string | undefined {
	// Delegates to the shared stampExpressionFor which uses the new values model.
	return stampExpressionFor(f, nodeMap);
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
}

function kindEnumTextMapExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap);
	if (storageInfo.kind !== 'kindEnum' || !kindEntries) return '[]';
	const byText: Array<readonly [string, string]> = [];
	for (const value of f.values) {
		if (!isNodeRef(value)) continue;
		const kind = isUnresolvedRef(value.node) ? value.node.name : value.node.kind;
		const resolved = nodeMap.nodes.get(kind);
		if (!resolved || resolved.modelType !== 'enum') continue;
		for (const text of resolved.values) {
			const discriminant = hasCatalogEntry(kindEntries, text)
				? kindDiscriminantExpr(text, nodeMap, kindEntries)
				: hasCatalogEntry(kindEntries, resolved.kind)
					? kindDiscriminantExpr(resolved.kind, nodeMap, kindEntries)
					: `kindIdFromName(${JSON.stringify(resolved.kind)})`;
			byText.push([text, discriminant]);
		}
	}
	return `[${byText.map(([text, discriminant]) => `[${JSON.stringify(text)}, ${discriminant}] as const`).join(', ')}]`;
}

function slotStorageFromValueExpr(
	f: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap);
	switch (storageInfo.kind) {
		case 'boolean':
			return `coerceBooleanKeywordStorage(${valueExpr})`;
		case 'bitflag':
			return `coerceBitflagStorage(${valueExpr}, ${bitflagTextsExpr(storageInfo.texts)})`;
		case 'kindEnum':
			return kindEntries
				? `coerceKindEnumStorage(${valueExpr}, ${kindEnumTextMapExpr(f, nodeMap, kindEntries)})`
				: valueExpr;
		case 'verbatim':
			return valueExpr;
	}
}

function slotStorageExpr(
	f: AssembledNonterminal,
	configAccess: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	return slotStorageFromValueExpr(f, `${configAccess}.${f.configKey}`, nodeMap, kindEntries);
}

/**
 * `$with.<name>` setter parameter signature for a single-valued field.
 * Required fields take `(value: T)`; optional fields take `(value?: T)`.
 * Previously the emitter unconditionally used `(value?: T)` — the new shape
 * matches the field's actual required/optional contract so callers can't
 * accidentally clear a required field by calling `$with.foo()` with no arg.
 */
function setterValueSignature(f: AssembledNonterminal, elemType: string): string {
	if (isRequired(f)) return `value: ${elemType}`;
	return `value?: ${elemType}`;
}

/**
 * Param type for a single-valued setter:
 *   - storage-rewritten fields: derive from the factory's own config slot.
 *   - default: plain `elemType`.
 */
function setterElemType(f: AssembledNonterminal, elemType: string, fn: string, nodeMap: NodeMap): string {
	if (resolveFieldStorageInfo(f, nodeMap).kind !== 'verbatim') {
		return `NonNullable<Parameters<typeof ${fn}>[0]>['${f.configKey}']`;
	}
	return elemType;
}

export function fieldElementType(f: AssembledNonterminal, nodeMap: NodeMap): string {
	const literals = slotLiteralValues(f);
	const kindNames = slotKindNames(f);

	if (literals.length > 0 && kindNames.length === 0) {
		return literals.map((v) => JSON.stringify(v)).join(' | ');
	}
	if (kindNames.length === 0 && literals.length === 0) return 'string';

	const components = fieldTypeComponents(f, nodeMap);
	const parts: string[] = [];
	for (const comp of components) {
		if (comp.kind === 'literal') {
			parts.push(JSON.stringify(comp.value));
		} else if (comp.kind === 'nodeKind') {
			parts.push(isValidIdent(comp.value) ? `T.${comp.value}` : JSON.stringify(comp.rawKind));
		} else {
			// Missing kind — factories can't register for stub emission
			// (types.ts owns that side). Fall back to the `T.` prefix so
			// the reference at least links against whatever stub types.ts
			// emits for its own missing kind.
			parts.push(`T.${comp.value}`);
		}
	}
	return [...new Set(parts)].join(' | ');
}

function emitFieldCarryingFactory(
	node: FieldCarryingNode,
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	isPolymorphForm = false,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string {
	const fn = node.rawFactoryName!;
	fields = fields ?? [];
	// Filter child slots whose refs all resolve to non-constructible
	// kinds — see `emitFormChildrenSlot` in types.ts for the same
	// predicate. Three flavours rejected:
	//   - Tokens / non-userFacing hidden helpers (`_impl_item_semi`).
	//   - Hidden single-literal keywords (`_pointer_type_const`) — the
	//     `T.Kw*` stub was dropped with the `_bk` removal.
	//   - Empty branches / groups (`_range_expression_postfix`) — no
	//     fields, no children — the `$variant` discriminator already
	//     captures the semantic distinction.
	children = (children ?? []).filter((c) =>
		slotKindNames(c).some((t) => {
			const n = nodeMap.nodes.get(t);
			if (!n) return false;
			// Hidden non-token groups have fragment factories and are constructible —
			// include them. Token modelType hidden kinds (bare anon tokens) stay excluded.
			const isHiddenGroup = t.startsWith('_') && n.modelType !== 'token' && n.modelType !== 'multi';
			if (!n.userFacing && !isHiddenGroup) return false;
			if (resolveHiddenKeywordLiteral(t, nodeMap) !== undefined) return false;
			if (n.modelType === 'branch' || n.modelType === 'group') {
				if (Object.values(n.slots).length === 0) return false;
			}
			return true;
		})
	);
	const hasChildren = children.length > 0;
	const opt = resolveConfigOptional(fields, children, nodeMap);
	const typeKind = node.modelType === 'group' ? (node.parentKind ?? node.kind) : node.kind;
	const configType = resolveConfigType(node, isPolymorphForm);

	// Gap 5: Single-field-no-children factories take the value directly
	// instead of a config object. Uses the pre-computed slotClass
	// (set by computeSlotClasses) for the sole-slot reference. The
	// signature becomes `fn(fieldName: T)` and the $with setter rebuilds
	// via `fn(value)`.
	const nonStampFields = fields.filter((f) => autoStampExpression(f, nodeMap) === undefined);
	// Exclude hidden kinds (`_`-prefixed) — they're internal infrastructure
	// (inner children of polymorph dispatchers) whose factories are called
	// with config objects by the polymorph form wrapper. Also exclude
	// polymorph forms and keyword-presence / multiple fields.
	const sc = typeof node === 'object' && node !== null && 'slotClass' in node ? node.slotClass : undefined;
	if (
		nonStampFields.length === 1 &&
		!hasChildren &&
		!isPolymorphForm &&
		!node.kind.startsWith('_') &&
		sc?.tag === 'singleSlot' &&
		sc.arity === 'singular'
	) {
		return emitSingleFieldFactory(node, fields, sc.slot, nodeMap, kindEntries);
	}

	// `childrenUserConfigurable` is false when every required child
	// auto-stamps AND there are no optional children. In that case
	// the Config (post-ConfigOf) has no `children` slot — ConfigOf
	// filters auto-stamp entries out — so the factory must neither
	// read `config.children` nor expose a child setter. Canonical
	// case: `visibility_modifier__form_0` (single required child
	// auto-stamps from `_crate`; Config is empty).
	const requiredChildren = hasChildren ? children.filter((c) => isRequired(c)) : [];
	const optionalChildren = hasChildren ? children.filter((c) => !isRequired(c)) : [];
	const allRequiredAutoStamp =
		hasChildren && requiredChildren.length > 0 && requiredChildren.every((c) => isAutoStampSlot(c, nodeMap));
	const childrenUserConfigurable = hasChildren && !(allRequiredAutoStamp && optionalChildren.length === 0);

	// When opt is '?' (all fields optional), emit a local `_config` default so
	// property access uses `_config.x` (no optional chaining) instead of
	// `config?.x`. Only emit the default when the body actually reads from
	// config — avoids dead code when all fields auto-stamp.
	const hasConfigReads = fields.some((f) => autoStampExpression(f, nodeMap) === undefined) || childrenUserConfigurable;
	const configAccess = opt === '?' && hasConfigReads ? '_config' : 'config';

	const lines: string[] = [];
	lines.push(`export function ${fn}(config${opt}: ${configType}) {`);
	if (opt === '?' && hasConfigReads) {
		lines.push('  const _config = config ?? {};');
	}

	// Build children local variable.
	if (hasChildren) {
		// Stamp expressions use child-context (NodeData wrapper) so
		// the resulting `$children` array matches the parent's
		// interface shape (`readonly [Crate]` = NodeData tuples, not
		// raw strings).
		if (allRequiredAutoStamp) {
			const stampedItems = requiredChildren.map((c) => stampExpressionFor(c, nodeMap, 'child') ?? 'undefined');
			if (!childrenUserConfigurable) {
				lines.push(`  const children = [${stampedItems.join(', ')}] as const;`);
			} else {
				lines.push(
					`  const children = _configChildren<T.${node.typeName}['$children']>(${configAccess}, [${stampedItems.join(', ')}] as unknown as T.${node.typeName}['$children']);`
				);
			}
		} else {
			lines.push(
				`  const children = _configChildren<T.${node.typeName}['$children']>(${configAccess}, [] as unknown as T.${node.typeName}['$children']);`
			);
		}
	}

	const variantName = node.modelType == 'group' ? resolvePolymorphFormVariantName(node) : undefined;

	// Shape A — closure-based locals + property shorthand storage +
	// pure-getter methods reading the local consts + `$with` block with
	// setter wiring. No `Object.defineProperty`. No `..._sharedMethods`
	// spread. No freeze.
	//
	// Step 1: hoist each field's storage value to a local `_<name>` const so
	// the getter method can `return _<name>;` directly via lexical closure.
	// All-leaf fields hoist `.$text` so storage holds the string directly
	// (the wrapper carries no info beyond `$text` for leaf kinds).
	for (const f of fields) {
		const stamp = autoStampExpression(f, nodeMap);
		if (stamp !== undefined) {
			lines.push(`  const _${f.name} = ${slotStorageFromValueExpr(f, stamp, nodeMap, kindEntries)};`);
			continue;
		}
		lines.push(`  const _${f.name} = ${slotStorageExpr(f, configAccess, nodeMap, kindEntries)};`);
	}

	// Step 2: emit the literal. Storage uses property shorthand so the local
	// const flows in by name. Getters are method shorthand that read the
	// local const via closure. `withMethods<T>` adds the four `$`-prefixed
	// methods at the boundary — generic on T preserves the literal's type.
	lines.push('  return withMethods({');
	lines.push(`    $type: ${factoryTypeDiscriminant(typeKind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	if (variantName) lines.push(`    $variant: '${variantName}' as const,`);
	for (const f of fields) {
		lines.push(`    _${f.name},`);
	}
	if (hasChildren) lines.push('    $children: children,');

	// Pure getters — method shorthand, body returns the local const.
	for (const f of fields) {
		const propName = f.propertyName;
		lines.push(`    ${propName}() { return _${f.name}; },`);
	}
	if (hasChildren) {
		lines.push('    children() { return children; },');
	}

	// $with: setters call the factory directly with a patched config —
	// `(value) => factory({ ...config, <key>: value })`. No `_setField` /
	// `_setFields` indirection (those were old helpers serving
	// the combined getter/setter method; under shape A getters are pure and
	// the setter is purely a rebuild). Auto-stamp fields are skipped — no
	// setter exposed because the value is fixed.
	lines.push('    $with: {');
	for (const f of fields) {
		if (autoStampExpression(f, nodeMap) !== undefined) continue;
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap);
		if (isMultiple(f) && storageInfo.kind === 'verbatim') {
			const elemType = fieldElementType(f, nodeMap);
			const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
			lines.push(`      ${method}: (...values: ${restType}) => ${fn}({ ...${configAccess}, ${f.configKey}: values }),`);
		} else {
			const elemType = setterElemType(f, fieldElementType(f, nodeMap), fn, nodeMap);
			lines.push(
				`      ${method}: (${setterValueSignature(f, elemType)}) => ${fn}({ ...${configAccess}, ${f.configKey}: value }),`
			);
		}
	}
	if (childrenUserConfigurable) {
		const childElem = childElementType({ children }, nodeMap);
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		const restType = childrenSetterRestType(children, childElem, childRest);
		lines.push(
			`      children: (...items: ${restType}) => ${fn}({ ...${configAccess}, children: items } as unknown as Parameters<typeof ${fn}>[0]),`
		);
	}
	lines.push('    },');
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return renameUnusedConfigParam(lines);
}

/**
 * Emit a factory with a direct-value signature for single-field-no-children kinds.
 *
 * @remarks
 * When a kind has exactly one non-auto-stamp field and no children, the config
 * object wrapper is unnecessary ceremony. Instead of `label(config: T.Label.Config)`
 * the factory signature becomes `label(identifier: T.Identifier)` and the `$with`
 * setter rebuilds via `fn(value)` (direct call, not config-spread).
 *
 * @param node - The assembled node descriptor.
 * @param allFields - All fields including auto-stamp ones (for storage hoisting).
 * @param soleField - The single non-auto-stamp field.
 * @param nodeMap - Grammar-wide node map.
 * @param kindEntries - KindEnumEntry table for numeric `$type` emission.
 * @returns The emitted factory function source string.
 */
function emitSingleFieldFactory(
	node: FieldCarryingNode,
	allFields: readonly AssembledNonterminal[],
	soleField: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const fn = node.rawFactoryName!;
	const typeKind = node.modelType === 'group' ? (node.parentKind ?? node.kind) : node.kind;
	const variantName = node.modelType === 'group' ? resolvePolymorphFormVariantName(node as AssembledGroup) : undefined;
	const elemType = `T.${node.typeName}.Config['${soleField.configKey}']`;
	const paramName = soleField.propertyName;
	const fieldOptional = !isRequired(soleField);
	const optMark = fieldOptional ? '?' : '';

	const lines: string[] = [];
	lines.push(`export function ${fn}(${paramName}${optMark}: ${elemType}) {`);

	// Storage hoists for all fields — auto-stamp ones get their stamp expression,
	// the sole user-facing field reads directly from the parameter.
	for (const f of allFields) {
		const stamp = autoStampExpression(f, nodeMap);
		if (stamp !== undefined) {
			lines.push(`  const _${f.name} = ${slotStorageFromValueExpr(f, stamp, nodeMap, kindEntries)};`);
			continue;
		}
		lines.push(`  const _${f.name} = ${slotStorageFromValueExpr(f, paramName, nodeMap, kindEntries)};`);
	}

	// Emit the literal object with withMethods wrapper.
	lines.push('  return withMethods({');
	lines.push(`    $type: ${factoryTypeDiscriminant(typeKind, nodeMap, kindEntries)},`);
	lines.push('    $source: 2 as const,');
	lines.push('    $named: true as const,');
	if (variantName) lines.push(`    $variant: '${variantName}' as const,`);
	for (const f of allFields) {
		lines.push(`    _${f.name},`);
	}

	// Pure getters.
	for (const f of allFields) {
		const propName = f.propertyName;
		lines.push(`    ${propName}() { return _${f.name}; },`);
	}

	// $with: setter calls the factory directly with the new value.
	lines.push('    $with: {');
	const method = soleField.propertyName;
	const setterType = setterElemType(soleField, elemType, fn, nodeMap);
	lines.push(`      ${method}: (${setterValueSignature(soleField, setterType)}) => ${fn}(value),`);
	lines.push('    },');
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return lines.join('\n');
}

/**
 * Resolve the rest-param type for a `$with.children` setter so it matches
 * the config's `children` slot shape. Three cases mirror the three shapes
 * `emitInterface` produces for `$children`:
 *
 *   - `anyMultiple && anyNonEmpty` → `NonEmptyArray<T>` (= `readonly [T, ...T[]]`).
 *   - `anyMultiple && !anyNonEmpty` → `T[]` (regular array).
 *   - `!anyMultiple` → `readonly [T]` (single-element tuple, exactly one arg).
 *
 * The TS rest-parameter type system accepts all three shapes; declaring
 * the right one means `factory({ ...config, children: items })` type-checks
 * without a runtime narrowing helper.
 */
export function childrenSetterRestType(
	children: readonly AssembledNonterminal[],
	childElem: string,
	childRest: string
): string {
	const anyMultiple = children.some((c) => isMultiple(c));
	const anyNonEmpty = children.some((c) => isNonEmpty(c));
	if (!anyMultiple) return `readonly [${childRest}]`;
	if (anyNonEmpty) return `NonEmptyArray<${childElem}>`;
	return `${childRest}[]`;
}

/**
 * Post-process emitted factory lines: rename the `config` parameter to
 * `_config` when the function body never reads it. Silences
 * `no-unused-vars` (lint rule explicitly exempts `_`-prefixed names)
 * without changing the public type signature — dispatchers and From
 * wrappers that forward `config` to these form factories continue to
 * type-check. Dropping the param entirely cascades into the dispatcher
 * + From emit, which is invasive; rename is the contained fix.
 */
function renameUnusedConfigParam(lines: string[]): string {
	const header = lines[0]!;
	const body = lines.slice(1).join('\n');
	if (!/\bconfig\b/.test(body)) {
		lines[0] = header.replace(/\bconfig(\??:)/, '_config$1');
	}
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// refine() per-form factory emission
// ---------------------------------------------------------------------------

/**
 * Emit a per-form factory for a refined kind.
 *
 * @remarks
 * The per-form factory accepts the form's narrowed Config (base kind's
 * Config minus the fields stamped by this form), stamps the form's
 * selected literals directly into `$fields` alongside user-supplied
 * fields, and returns a NodeData shape structurally identical to the
 * base factory's output (and to what `readNode` produces from a parsed
 * tree). No `$variant` tag — the selected literals live in `$fields`
 * exactly as they do when parsed, so the round-trip contract is
 * preserved.
 *
 * The fluent method suffix (render/toEdit/replace) mirrors the base
 * factory so the output shape is interchangeable; callers switching
 * between `ir.interfaceBody.curly(...)` and `readNode(...)` get the
 * same surface.
 */
function emitRefineFormFactory(
	node: AssembledNode,
	form: RefineFormInfo,
	info: RefineKindInfo,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string | undefined {
	if (node.modelType !== 'branch' && node.modelType !== 'group') return undefined;
	const baseFn = node.rawFactoryName;
	if (!baseFn) return undefined;
	const formFn = refineFormFactoryName(baseFn, form.name);
	const narrowed = new Map<string, string>();
	for (const n of form.narrowedFields) narrowed.set(n.fieldName, n.literal);
	const fields = node.fields;
	const children = node.children;
	const hasChildren = children.length > 0;
	const opt = resolveRefineFormConfigOptional(fields, children, nodeMap, narrowed);
	const formTypeName = refineFormTypeName(info.typeName, form.name);
	const formShortName = formTypeName.slice(info.typeName.length);
	const lines: string[] = [];
	// Refine form Config lives at `T.<Parent>.<FormShort>.Config` per
	// emitRefineFormSubNamespaces — the flat `T.<ParentForm>` identifier
	// is not emitted as a top-level namespace.
	lines.push(`export function ${formFn}(config${opt}: T.${info.typeName}.${formShortName}.Config) {`);
	if (hasChildren) {
		lines.push(
			`  const children = _configChildren<T.${formTypeName}['$children']>(config${opt}, [] as unknown as T.${formTypeName}['$children']);`
		);
	}
	// Shape A: storage hoist + property shorthand + pure getters + $with.
	for (const f of fields) {
		const narrowedLit = narrowed.get(f.name);
		if (narrowedLit !== undefined) {
			lines.push(
				`  const _${f.name} = ${slotStorageFromValueExpr(f, `${JSON.stringify(narrowedLit)} as const`, nodeMap, kindEntries)};`
			);
			continue;
		}
		const stamp = autoStampExpression(f, nodeMap);
		if (stamp !== undefined) {
			lines.push(`  const _${f.name} = ${slotStorageFromValueExpr(f, stamp, nodeMap, kindEntries)};`);
			continue;
		}
		lines.push(`  const _${f.name} = ${slotStorageExpr(f, `config${opt}`, nodeMap, kindEntries)};`);
	}
	lines.push('  return withMethods({');
	lines.push(`    $type: ${factoryTypeDiscriminant(node.kind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	for (const f of fields) {
		lines.push(`    _${f.name},`);
	}
	if (hasChildren) lines.push('    $children: children,');
	for (const f of fields) {
		const propName = f.propertyName;
		lines.push(`    ${propName}() { return _${f.name}; },`);
	}
	if (hasChildren) {
		lines.push('    children() { return children; },');
	}
	lines.push('    $with: {');
	for (const f of fields) {
		// Narrowed-literal fields and auto-stamp fields are read-only —
		// their value is fixed by the form, no setter is exposed.
		if (narrowed.has(f.name)) continue;
		if (autoStampExpression(f, nodeMap) !== undefined) continue;
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap);
		if (isMultiple(f) && storageInfo.kind === 'verbatim') {
			const elemType = fieldElementType(f, nodeMap);
			const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
			lines.push(`      ${method}: (...values: ${restType}) => ${formFn}({ ...config, ${f.configKey}: values }),`);
		} else {
			const elemType = setterElemType(f, fieldElementType(f, nodeMap), formFn, nodeMap);
			lines.push(
				`      ${method}: (${setterValueSignature(f, elemType)}) => ${formFn}({ ...config, ${f.configKey}: value }),`
			);
		}
	}
	if (hasChildren) {
		const childElem = childElementType({ children: node.children }, nodeMap);
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		const restType = childrenSetterRestType(node.children, childElem, childRest);
		lines.push(
			`      children: (...items: ${restType}) => ${formFn}({ ...config, children: items } as unknown as Parameters<typeof ${formFn}>[0]),`
		);
	}
	lines.push('    },');
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return lines.join('\n');
}

/**
 * Per-form equivalent of `resolveConfigOptional` — factors the narrowed
 * fields out of the "required" check (those are stamped by this form and
 * never come from Config input).
 */
function resolveRefineFormConfigOptional(
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	narrowed: ReadonlyMap<string, string>
): '' | '?' {
	const hasRequired =
		fields.some((f) => isRequired(f) && autoStampExpression(f, nodeMap) === undefined && !narrowed.has(f.name)) ||
		children.some((c) => isRequired(c) && !isAutoStampSlot(c, nodeMap));
	return hasRequired ? '' : '?';
}

/**
 * Determine whether the `config` parameter should be optional (`?`).
 *
 * @param fields - The assembled field descriptors for the node.
 * @param children - The assembled child descriptors for the node.
 * @param nodeMap - The assembled node map (used for auto-stamp detection).
 * @returns The option marker — `'?'` when every non-auto-stamped field and
 *   child is optional, `''` otherwise.
 * @remarks
 *   Auto-stamp-eligible fields are excluded from the "required" check because
 *   they are never present in Config — the factory stamps them directly.
 *   Only fields that remain in Config can make config required.
 */
function resolveConfigOptional(
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap
): '' | '?' {
	fields = fields ?? [];
	children = children ?? [];
	// Auto-stamp-eligible fields are excluded from the "required" check —
	// they never appear in Config. Auto-stamp-eligible children are also
	// excluded: when all required children are parameterless, they are
	// stamped directly in the factory body rather than read from config.
	// Repeat-0+ children (isMultiple && !isNonEmpty) are also excluded:
	// the factory body defaults them to `[]` via `config.children ?? []`,
	// so they never require user input at the Config surface.
	const hasRequired =
		fields.some((f) => isRequired(f) && autoStampExpression(f, nodeMap) === undefined) ||
		children.some((c) => isRequired(c) && !isAutoStampSlot(c, nodeMap) && !(isMultiple(c) && !isNonEmpty(c)));
	return hasRequired ? '' : '?';
}

/**
 * Resolve the config type reference for a field-carrying factory parameter.
 *
 * @param node - The node descriptor (provides `typeName` and `parentKind`).
 * @param isPolymorphForm - Whether the factory is emitting a polymorph form (not the dispatcher).
 * @returns A TS source string like `T.FunctionItem.Config` or `ConfigOf<T.FunctionItemBodyForm>`.
 * @remarks
 *   Polymorph forms use `ConfigOf<T.${typeName}>` directly — synthetic UForm
 *   kinds have no declaration-merged namespace, and the generic projection
 *   picks up the polymorph-variant hoist automatically. Base kinds use the
 *   `T.${typeName}.Config` namespace alias, which resolves to the same
 *   `ConfigOf<T.${typeName}>` shape under the hood.
 */
function resolveConfigType(node: FieldCarryingNode, isPolymorphForm: boolean): string {
	// Polymorph FORM factories omit `$variant` from their input Config —
	// the form itself stamps `$variant` on the output, so accepting it
	// as input would be redundant. Parent (dispatcher) factories use
	// `T.${parent}.Config` which resolves to `ConfigOf<union>` and
	// REQUIRES `$variant` (discriminated-union narrowing).
	//
	// Refined kinds also alias their parent `T.<TypeName>.Config` to the
	// first-declared form's narrowed Config (per emitRefineFormSubNamespaces),
	// dropping the narrowed-out fields. The parent factory still references
	// those fields directly, so route through `ConfigOf<T.<TypeName>>` here
	// to get the full Config — same shape as the generic indirection
	// for polymorph dispatchers, just minus the `$variant` Omit.
	// Hygiene rule 5 — prefer concrete per-kind namespace alias over the
	// `ConfigOf<T>` generic indirection. `T.${typeName}.Config` is emitted
	// by the types.ts namespace-sugar pass and resolves to the same
	// `ConfigFor<kind>` shape, so this is a pure typing-surface improvement
	// with no runtime change. Polymorph forms keep `ConfigOf<T.X>` because
	// synthetic UForm names don't carry a `.Config` namespace member.
	return isPolymorphForm ? `Omit<ConfigOf<T.${node.typeName}>, '$variant'>` : `T.${node.typeName}.Config`;
}

/**
 * Resolve the `$variant` tag name for a polymorph form factory.
 *
 * @param node - The node descriptor (provides `name` and `parentKind`).
 * @returns The form's short name (e.g. `'body'`, `'binary'`, `'form0'`), or
 *   `undefined` when the node is not a polymorph form.
 * @remarks
 *   Polymorph form factories tag their output with `$variant: '<name>'` so the
 *   renderer's variant dispatch (path 1) can discriminate forms whose templates
 *   differ only by literal tokens (e.g. rust `struct_item` body vs semi — same
 *   `$VARS`, differ by trailing `;`).
 *
 *   Single source of truth (DRY): the variant name is `form.name`, assigned at
 *   assembly time in {@link buildAssembledFormGroups}. Reconstructing it from
 *   the kind suffix is fragile — `source='override'` polymorphs use
 *   `${parent}__form_${name}` and slicing by `${parent}_` yields `_form_<name>`
 *   (leading underscore garbage). Use `form.name` directly and let assemble
 *   own the naming decision.
 */
function resolvePolymorphFormVariantName(node: AssembledGroup): string | undefined {
	return node.parentKind ? node.name : undefined;
}

// ---------------------------------------------------------------------------
// Container factory (children only, no fields)
// ---------------------------------------------------------------------------

interface ContainerNode {
	readonly kind: string;
	readonly typeName: string;
	readonly treeTypeName: string;
	readonly rawFactoryName?: string;
	readonly children: readonly AssembledNonterminal[];
}

function emitContainerFactory(
	node: ContainerNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string {
	const fn = node.rawFactoryName!;
	const lines: string[] = [];
	const anyMultiple = resolveContainerMultiple(node);
	const anyNonEmpty = node.children.some((c) => isNonEmpty(c));
	const elementType = resolveContainerElementType(node, nodeMap);
	if (anyMultiple) {
		lines.push(`export function ${fn}(...children: ${elementType}[]) {`);
		if (anyNonEmpty) {
			lines.push(`  _assertNonEmpty(children, '${node.kind}.children');`);
		}
	} else {
		const firstChild = node.children[0];
		const required = firstChild ? isRequired(firstChild) : false;
		const optMark = required ? '' : '?';
		lines.push(`export function ${fn}(child${optMark}: ${elementType}) {`);
		// Required child: type guarantees non-null, wrap directly.
		// Optional child: null/undefined is valid → wrap only if present.
		lines.push(required ? `  const children = [child];` : `  const children = child != null ? [child] : [];`);
	}
	// Inline literal wrapped by withMethods<T>. No defineProperty,
	// no spread, no Record cast.
	lines.push('  return withMethods({');
	lines.push(`    $type: ${factoryTypeDiscriminant(node.kind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	lines.push('    $children: children,');
	lines.push('    children() { return children; },');
	// Container $with: unnamed slot updater. Multiple → `$children`; single → `$child`.
	// Both call the factory directly (no config object).
	if (anyMultiple) {
		lines.push(`    $with: { $children: (...vs: ${elementType}[]) => ${fn}(...vs) },`);
	} else {
		lines.push(`    $with: { $child: (v: ${elementType}) => ${fn}(v) },`);
	}
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return lines.join('\n');
}

/**
 * Determine whether a container node uses a rest-params (multiple-children) signature.
 *
 * @param node - The container node descriptor.
 * @returns `true` when any child entry is repeated.
 * @remarks
 *   Containers are "multiple-shaped" when ANY child entry is repeated. Inlining
 *   Inlining can flatten a choice of hidden helpers into a mixed list of single +
 *   repeated entries, so checking only `children[0]` misses the repeated signal.
 */
function resolveContainerMultiple(node: ContainerNode): boolean {
	return node.children.some((c) => isMultiple(c));
}

/**
 * Resolve the element type for a container node's children parameter.
 *
 * @param node - The container node descriptor.
 * @param nodeMap - The assembled node map for type resolution.
 * @returns A TS source string for the element type (e.g. `T.FunctionItem | T.Block`).
 * @remarks
 *   Uses the concrete element type union (e.g. `FunctionItem | Block`) instead of
 *   the generic `ChildOf<X>` alias so consumers see the actual types in
 *   hover/autocomplete with no indirection.
 */
function resolveContainerElementType(node: ContainerNode, nodeMap: NodeMap): string {
	return childElementType(node, nodeMap);
}

// ---------------------------------------------------------------------------
// Polymorph factory — dispatcher + inline form factories
// ---------------------------------------------------------------------------

interface PolymorphNode {
	readonly kind: string;
	readonly typeName: string;
	readonly treeTypeName: string;
	readonly rawFactoryName?: string;
	readonly forms: AssembledGroup[];
	readonly source?: 'promoted' | 'override';
	readonly variantChildKinds?: readonly string[];
}

function emitPolymorphFactory(
	node: PolymorphNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string {
	const fn = node.rawFactoryName!;
	const forms = node.forms ?? [];

	if (forms.length === 0) {
		// Defensive stub — shouldn't happen after classifier fix.
		// Inline literal + withMethods<T> wrap.
		const typeExpr = factoryTypeDiscriminant(node.kind, nodeMap, kindEntries);
		return [
			`export function ${fn}(_config?: unknown) {`,
			`  return withMethods({`,
			`    $type: ${typeExpr},`,
			`    $source: 2 as const,`,
			`    $named: true as const,`,
			`    $with: {},`,
			`  }, methodsEngine);`,
			`}`
		].join('\n');
	}

	const parts: string[] = [];
	parts.push(emitPolymorphDispatcher(node, forms));

	// Emit each form factory inline after the dispatcher.
	// `isPolymorphForm=true` routes the form factory's config parameter
	// through the legacy flat alias instead of namespace sugar — synthetic
	// UForm kinds aren't in `NamespaceMap`.
	for (const form of forms) {
		const hoist = resolveHoistedForm(form, nodeMap);
		if (hoist) {
			parts.push(emitHoistedPolymorphFormFactory(form, hoist, nodeMap, kindEntries));
		} else {
			parts.push(emitFieldCarryingFactory(form, form.fields, form.children, nodeMap, true, kindEntries));
		}
	}
	return parts.join('\n');
}

/**
 * Build the inline rebuild expression used by a hoisted polymorph form's
 * fluent setter. Projects BOTH the form-level fields (from
 * `config.<propName>`) and the hoisted inner fields (from
 * `inner.$fields.<name>`) back into a camelCase Config literal, then
 * overlays the patched key at the tail so it shadows the original value.
 *
 * Replaces the previous runtime `_rebuildHoist` helper — the field set is
 * known at emit time, so the whole projection is a static object literal
 * rather than a generic loop in the generated output. Fewer indirections
 * in the factory, and the field inventory is visible in the generated
 * source (not reconstructed at runtime from `Object.keys`).
 *
 * @param formFields - Form-level fields (surfaced directly on Config).
 * @param innerFields - Hoisted inner fields (flattened onto Config).
 * @param patchKey - The camelCase property name being overridden by the setter.
 * @param patchVar - The setter parameter expression (e.g. `'value'`, `'values'`).
 * @param patchSource - Which group the patched field lives in — `'form'` skips
 *   the form-level copy of `patchKey`, `'inner'` skips the inner-level copy.
 * @returns A string like
 *   - form-level patch:  `{ left: value, right: inner.$fields.right }`
 *   - inner-level patch: `{ left: config.left, right: value }`.
 */
function buildHoistedRebuildExpr(
	_formFields: readonly AssembledNonterminal[],
	_innerFields: readonly AssembledNonterminal[],
	patchKey: string,
	patchVar: string,
	_patchSource: 'form' | 'inner',
	_nodeMap: NodeMap
): string {
	// Hoisted-form Config flattens BOTH form-level fields AND the inner
	// child's Config fields onto the surface (see `ConfigOf` in
	// `@sittir/types`). Spreading `...config` carries every preserved
	// field — form-level (`refMarker`) and inner-hoisted (`name`) alike —
	// in a single token. Patched key shadows the original.
	return `{ ...config, ${patchKey}: ${patchVar} }`;
}

/**
 * Emit a polymorph form factory whose inner child's fields have been
 * hoisted up into the Config surface.
 *
 * @remarks
 * The emitted factory accepts the hoisted Config (flat camelCase fields from
 * the inner child), constructs the inner child via its factory, then returns
 * a NodeData object with `$children: [inner]`. Runtime shape matches the
 * non-hoisted version — this is purely an input-side ergonomic.
 *
 * Fluent getter/setter surface is the inner child's field methods applied
 * at the top level. No `getChild` / `setChild` is emitted — the child slot
 * is hidden from consumers since they never construct it directly.
 *
 * @see {@link resolveHoistedForm}
 */
function emitHoistedPolymorphFormFactory(
	form: AssembledGroup,
	hoist: HoistedForm,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string {
	const fn = form.rawFactoryName!;
	// Polymorph form factories OMIT `$variant` from their input Config
	// — the factory stamps the variant on output. See resolveConfigType.
	const configType = `Omit<ConfigOf<T.${form.typeName}>, '$variant'>`;
	const variantName = form.name;
	const parentKind = form.parentKind ?? form.kind;
	const formFields = form.fields;

	// Required if ANY form-level OR inner-level required field is present
	// (modulo auto-stamp / literal-resolved — those don't participate in the
	// Config surface). Also required when the inner is a container whose
	// children DON'T all auto-stamp — the inner factory needs `config
	// .children[0]` and the form can't honour that with `config?:`.
	const formRequired = formFields.some((f) => isRequired(f) && autoStampExpression(f, nodeMap) === undefined);
	const innerRequired = hoist.innerFields.some(
		(f) => isRequired(f) && resolveEffectiveLiteral(f, nodeMap) === undefined
	);
	const opt = formRequired || innerRequired ? '' : '?';

	const lines: string[] = [];
	lines.push(`export function ${fn}(config${opt}: ${configType}) {`);

	// Inner child construction. Three paths:
	//
	//   - **Field-carrier + factory available** (branches/groups with
	//     fields that also have a factory): delegate to
	//     `innerFactory(config)`. The inner factory picks out
	//     `config.<its own fields>` and ignores the form-level keys.
	//     Structural subtyping + `resolveHoistedForm`'s name-collision
	//     gate keep this safe.
	//
	//   - **Container inner** (modelType='container', has children
	//     but no fields): the inner factory takes positional children
	//     (`containerFactory(child)` for single-child, `(...children)`
	//     for multi). ConfigOf hoists the container's `Partial<{
	//     children }>` up, so the form's Config has `config.children`
	//     typed as the inner's children slot. Extract from config
	//     and pass positionally. Example:
	//     `expression_statement__form_with_semi` → inner container
	//     `_expression_statement_with_semi`.
	//
	//   - **No factory** (hidden group with fields): inline the
	//     NodeData construction — unblocks polymorph forms whose
	//     inner kind is a hidden field-carrying group without
	//     retrofitting factory emission onto every hidden group.
	//     Example: python's `_assignment_eq`.
	// The former `AssembledContainer` shape is
	// now an `AssembledBranch`. Distinguish via the structural
	// `isContainerShape` getter (no `field()` on the rule). The
	// `hoist.innerFields.length === 0` clause keeps the prior behavior
	// for hoisted forms whose inner has empty derived fields too.
	const innerIsContainer =
		hoist.innerNode.modelType === 'branch' && hoist.innerNode.isContainerShape && hoist.innerFields.length === 0;
	if (innerIsContainer && hoist.innerFactoryName !== undefined) {
		// innerNode is AssembledBranch (checked via isContainerShape above)
		const innerNode = hoist.innerNode as { slots: Readonly<Record<string, AssembledNonterminal>> };
		const innerChildren = Object.values(innerNode.slots);
		const anyMultiple = innerChildren.some((c) => isMultiple(c));
		if (anyMultiple) {
			// Spread coalesces missing children to an empty list — varargs
			// inner factory accepts the empty case.
			lines.push(
				`  const inner = ${hoist.innerFactoryName}(..._configChildren<Parameters<typeof ${hoist.innerFactoryName}>>(config, [] as unknown as Parameters<typeof ${hoist.innerFactoryName}>));`
			);
		} else {
			// Single-child inner factory takes one required NodeData. Tests
			// and lenient consumers pass `{}` to form factories; we preserve
			// that tolerance by reading defensively (returns undefined when
			// either config or children is missing) and casting to the inner
			// factory's required-arg type. Replaces the structurally absurd
			// `config?.children?.[0]!` (which said "may be undefined" then
			// asserted not). The cast is now the single honest statement of
			// "trust the caller to provide this — runtime will see undefined
			// if they didn't, same as before."
			lines.push(
				`  const _innerChildren = _configChildren<readonly [Parameters<typeof ${hoist.innerFactoryName}>[0]] | []>(config, []);`
			);
			lines.push(
				`  const inner = ${hoist.innerFactoryName}(_innerChildren[0] as Parameters<typeof ${hoist.innerFactoryName}>[0]);`
			);
		}
	} else if (hoist.innerFactoryName !== undefined) {
		// When the outer config is optional (no required fields anywhere
		// in the hoisted surface), TS sees `config` as `Config | undefined`
		// and the inner factory's required-Config parameter rejects it.
		// Pass through with the boundary cast — the inner factory's own
		// optional-field handling treats undefined fields as missing.
		const innerArg = opt === '?' ? `config as Parameters<typeof ${hoist.innerFactoryName}>[0]` : `config`;
		lines.push(`  const inner = ${hoist.innerFactoryName}(${innerArg});`);
	} else {
		const innerKind = hoist.innerKind;
		// Canonical-hidden architecture (Option Y): the inner $type
		// retains its `_` prefix when the inner is a hidden alias-source
		// kind. Templates, interfaces, factories all key on the same
		// hidden name; wrap canonicalizes parser output (visible →
		// hidden) so consumers always see the canonical hidden form.
		// Inner node — local consts + property shorthand +
		// pure getters + withMethods<T> wrap. No freeze on the inner —
		// the outer does the rebuild.
		for (const f of hoist.innerFields) {
			const stamp = autoStampExpression(f, nodeMap);
			if (stamp !== undefined) {
				lines.push(`  const _${f.name} = ${slotStorageFromValueExpr(f, stamp, nodeMap, kindEntries)};`);
				continue;
			}
			lines.push(`  const _${f.name} = ${slotStorageExpr(f, `config${opt}`, nodeMap, kindEntries)};`);
		}
		lines.push('  const inner = withMethods({');
		lines.push(`    $type: ${factoryTypeDiscriminant(innerKind, nodeMap, kindEntries)},`);
		lines.push(`    $source: 2 as const,`);
		lines.push('    $named: true as const,');
		for (const f of hoist.innerFields) {
			lines.push(`    _${f.name},`);
		}
		for (const f of hoist.innerFields) {
			const propName = f.propertyName;
			lines.push(`    ${propName}() { return _${f.name}; },`);
		}
		lines.push('  }, methodsEngine);');
	}
	lines.push(`  const children = [inner] as const;`);

	// Form-level node — form-field locals + property
	// shorthand + form-field getters from local consts. Inner-field getters
	// close over the `inner` reference and read its storage via property
	// access (not readRawField; the closure has the typed reference).
	for (const f of formFields) {
		const stamp = autoStampExpression(f, nodeMap);
		if (stamp !== undefined) {
			lines.push(`  const _${f.name} = ${slotStorageFromValueExpr(f, stamp, nodeMap, kindEntries)};`);
			continue;
		}
		lines.push(`  const _${f.name} = ${slotStorageExpr(f, `config${opt}`, nodeMap, kindEntries)};`);
	}
	lines.push('  return withMethods({');
	lines.push(`    $type: ${factoryTypeDiscriminant(parentKind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	lines.push(`    $variant: '${variantName}' as const,`);
	for (const f of formFields) {
		lines.push(`    _${f.name},`);
	}
	lines.push('    $children: children,');
	// Form-field getters: read the local const directly.
	for (const f of formFields) {
		const propName = f.propertyName;
		lines.push(`    ${propName}() { return _${f.name}; },`);
	}
	// Inner-field getters: close over `inner` and read via the inner node's
	// own getter (which delegates to inner's local const). `inner` is the
	// withMethods<T>-wrapped object literal, so `inner.<propName>()`
	// resolves through the getter method emitted on inner.
	for (const f of hoist.innerFields) {
		const propName = f.propertyName;
		lines.push(`    ${propName}() { return inner.${propName}(); },`);
	}

	// $with: updater namespace for hoisted form. Build a custom $with that
	// handles both form-level and inner-level field updates via rebuild expr.
	// Each entry calls fn(rebuildConfig) which returns a new wrapped node.
	// Setter parameter types match the field's required/optional/multi shape
	// — same rules as non-hoisted setters (rule 3, consistent across paths).
	const withEntries: string[] = [];
	const buildHoistedSetter = (f: AssembledNonterminal, patchSource: 'form' | 'inner'): string => {
		const storageInfo = resolveFieldStorageInfo(f, nodeMap);
		const fMultiple = isMultiple(f) && storageInfo.kind === 'verbatim';
		const rawElem = fieldElementType(f, nodeMap);
		const elemType = setterElemType(f, rawElem, fn, nodeMap);
		const param = fMultiple
			? `...values: ${
					isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemType.includes(' | ') ? `(${elemType})` : elemType}[]`
				}`
			: setterValueSignature(f, elemType);
		const rebuild = buildHoistedRebuildExpr(
			formFields,
			hoist.innerFields,
			f.configKey,
			fMultiple ? 'values' : 'value',
			patchSource,
			nodeMap
		);
		return `      ${f.propertyName}: (${param}) => ${fn}(${rebuild} as Parameters<typeof ${fn}>[0]),`;
	};
	for (const f of formFields) {
		if (autoStampExpression(f, nodeMap) !== undefined) continue;
		withEntries.push(buildHoistedSetter(f, 'form'));
	}
	for (const f of hoist.innerFields) {
		if (autoStampExpression(f, nodeMap) !== undefined) continue;
		withEntries.push(buildHoistedSetter(f, 'inner'));
	}
	if (withEntries.length > 0) {
		lines.push(`    $with: {`);
		lines.push(...withEntries);
		lines.push(`    },`);
	} else {
		lines.push(`    $with: {},`);
	}
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return renameUnusedConfigParam(lines);
}

/**
 * Emit the polymorph dispatcher function: overloaded signatures (one per
 * variant, return type narrowed via `ReturnType<typeof formFactory>`) followed
 * by an implementation signature accepting the discriminated union.
 *
 * The body is a single `switch (config.$variant)` over the form names,
 * throwing on unknown. Callers that don't stamp `$variant` route through
 * `.from()` which normalizes the shape (see `emitters/from.ts`).
 */
function emitPolymorphDispatcher(node: PolymorphNode, forms: AssembledGroup[]): string {
	const fn = node.rawFactoryName!;
	const lines: string[] = [];

	if (forms.length > 1) {
		// One overload per variant so call-site `config.$variant === 'binary'`
		// narrows the return type to the binary form factory's output. The
		// `$variant: '<name>'` literal is already baked into ConfigOf<T> for
		// polymorph variants (@sittir/types), so each overload's arm
		// self-discriminates — no extra intersection wrapper needed.
		for (const form of forms) {
			lines.push(
				`export function ${fn}(config: ConfigOf<T.${form.typeName}>): ReturnType<typeof ${form.rawFactoryName!}>;`
			);
		}
	}

	const polyOpt = resolvePolymorphConfigOptional(forms);
	const configUnion = buildPolymorphConfigUnion(forms);
	// Implementation signature — the untyped union accepted at the dispatch
	// boundary. The overloads above govern what callers see.
	lines.push(`export function ${fn}(config${polyOpt}: ${configUnion}) {`);
	lines.push(...emitPolymorphDispatch(node, forms));
	lines.push('}');
	return lines.join('\n');
}

/**
 * Build the config parameter union type string for a polymorph dispatcher.
 *
 * @param forms - The polymorph form descriptors.
 * @returns A TS source string like `ConfigOf<T.StructItemBodyForm> | ConfigOf<T.StructItemSemiForm>`.
 * @remarks
 *   `ConfigOf<T>` applied per-form (rather than `ConfigOf<Parent>` over the
 *   parent-union type) preserves TypeScript's `'field' in config` narrowing
 *   at the call site — distributive `ConfigOf` over a union doesn't narrow
 *   the same way.
 */
function buildPolymorphConfigUnion(forms: AssembledGroup[]): string {
	// Single-form polymorphs have no actual variant choice — the dispatcher
	// always routes to the single form factory, which stamps `$variant`
	// itself. Strip `$variant` from the dispatcher's accepted Config so
	// callers can `factoryFn({})` without supplying a tag the form fills
	// in. Multi-form dispatchers preserve `$variant` on the input — the
	// discriminator drives the switch.
	if (forms.length === 1) {
		return `Omit<ConfigOf<T.${forms[0]!.typeName}>, '$variant'>`;
	}
	return forms.map((f) => `ConfigOf<T.${f.typeName}>`).join(' | ');
}

/**
 * Determine whether the polymorph dispatcher's `config` parameter should be optional.
 *
 * @param forms - The polymorph form descriptors.
 * @returns `''` when any form has a required field or child, `'?'` otherwise.
 */
function resolvePolymorphConfigOptional(forms: AssembledGroup[]): string {
	const anyFormHasRequired = forms.some((f) => Object.values(f.slots).some((s) => isRequired(s)));
	return anyFormHasRequired ? '' : '?';
}

/**
 * Emit the dispatch body lines for a polymorph factory.
 *
 * @param node - The polymorph node descriptor.
 * @param forms - The polymorph form descriptors.
 * @returns Array of source lines for the dispatch body (without the surrounding `{ }`).
 * @remarks
 *   Shape: non-object guard → `$variant` inference preamble → `switch` → throw.
 *
 *   `$variant` is the authoritative discriminator, but Loose input flowing
 *   through `.from()` wrappers and readNode-derived shapes don't carry it.
 *   The preamble infers `variant` from parse-tree truth (first child's kind
 *   for `source='override'`) or field-presence (for `source='promoted'`),
 *   feeding the same single-dispatch switch. The final `throw` fires only
 *   when BOTH caller-supplied `$variant` and inference yield nothing.
 *
 *   Single-form polymorphs (`forms.length === 1`) skip the switch entirely.
 */
function emitPolymorphDispatch(node: PolymorphNode, forms: AssembledGroup[]): string[] {
	const lines: string[] = [];
	if (forms.length === 1) {
		// Single-form polymorph: form factory's input type omits `$variant`.
		// The parent's Config still carries it (discriminated union arm),
		// so cast when delegating.
		lines.push(`  return ${forms[0]!.rawFactoryName!}(config as Parameters<typeof ${forms[0]!.rawFactoryName!}>[0]);`);
		return lines;
	}

	// `$variant` is the authoritative discriminator — `ConfigOf<T>` carries
	// it in the type for polymorph variants, so the switch narrows the
	// union arm-by-arm. Form factories accept `Omit<ConfigOf<T.FormN>, '$variant'>`
	// (the variant tag is factory-output, not input) — cast when delegating.
	lines.push(`  switch (config.$variant) {`);
	for (const form of forms) {
		lines.push(
			`    case '${form.name}': return ${form.rawFactoryName!}(config as Parameters<typeof ${form.rawFactoryName!}>[0]);`
		);
	}
	lines.push(`  }`);
	const formNames = forms.map((f) => `'${f.name}'`).join(' | ');
	lines.push(
		`  throw new Error(\`${node.rawFactoryName!}: unknown $variant '\${(config as { $variant?: string }).$variant}' — expected one of ${formNames}.\`);`
	);
	return lines;
}

// ---------------------------------------------------------------------------
// Text factory (leaves, keywords, enums)
// ---------------------------------------------------------------------------

interface TextFactoryNode {
	readonly kind: string;
	readonly treeTypeName: string;
	readonly rawFactoryName?: string;
}

function emitTextFactory(
	node: TextFactoryNode,
	sig: string,
	textExpr: string,
	guard?: string,
	kindEntries?: readonly KindEnumEntry[],
	nodeMap?: NodeMap
): string {
	const fn = node.rawFactoryName!;
	// Emit numeric TSKindId discriminant for leaf / keyword /
	// enum nodes, matching the AnyNodeData.$type: number contract. Falls back to
	// string literal for kinds not yet in kindEntries (TSGrammar-only or no
	// parser.c available).
	const typeExpr = factoryTypeDiscriminant(node.kind, nodeMap!, kindEntries);
	// Leaf/keyword/enum factories — inline literal +
	// `withMethods<T>` wrap. No `_<name>` storage (text nodes carry only
	// `$text`); no `$with` (no updatable slots).
	const body: string[] = [`export function ${fn}${sig} {`];
	if (guard) body.push(`  ${guard}`);
	body.push(
		'  return withMethods({',
		`    $type: ${typeExpr},`,
		`    $source: 2 as const,`,
		'    $named: true as const,',
		`    $text: ${textExpr},`,
		'  }, methodsEngine);',
		'}'
	);
	return body.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escForSource(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Strip ESLint-flagged useless escapes that occur inside tree-sitter
 * grammar regex patterns. Only two cases appear in real grammars and
 * are safe to strip:
 *
 *   - `\[` inside a character class — `[` has no special meaning inside
 *     `[...]`, so the backslash is decorative.
 *   - `\-` at the end of a character class — a literal `-` after a prior
 *     character set needs no escape when it's the last char in the class.
 *
 * The stripped pattern must still compile as a RegExp. If it doesn't
 * (some grammar regex we didn't anticipate), fall back to the original
 * pattern so semantics stay identical. Full set-equivalence cannot be
 * checked at codegen time without running both regexes against a corpus
 * — the two specific transformations above are provably safe by the
 * JavaScript regex grammar, so compile-success is the strongest static
 * check we can offer.
 */
function stripUselessEscapes(pattern: string): string {
	let out = '';
	let i = 0;
	let inClass = false;
	while (i < pattern.length) {
		const c = pattern[i];
		if (!inClass) {
			if (c === '[') inClass = true;
			out += c;
			i++;
			continue;
		}
		// Inside character class.
		if (c === ']') {
			inClass = false;
			out += c;
			i++;
			continue;
		}
		if (c === '\\' && i + 1 < pattern.length) {
			const next = pattern[i + 1];
			// `\[` inside a class → `[`
			if (next === '[') {
				out += '[';
				i += 2;
				continue;
			}
			// `\-` at end of class (next-next is `]`) → `-`
			if (next === '-' && pattern[i + 2] === ']') {
				out += '-';
				i += 2;
				continue;
			}
			// Otherwise keep the escape verbatim.
			out += c + next;
			i += 2;
			continue;
		}
		out += c;
		i++;
	}
	// If the stripped pattern fails to compile, the transformation broke
	// something — fall back to the original (which we know compiled;
	// otherwise this function wouldn't have been called).
	try {
		new RegExp(out, 'u');
	} catch {
		return pattern;
	}
	return out;
}

// ---------------------------------------------------------------------------
// Internal interfaces
// ---------------------------------------------------------------------------

/**
 * Factory map entry descriptor — used to emit `FluentKindMap` and `_factoryMap`.
 *
 * @remarks
 *   Factory signature shape — `'config'` for config-object factories,
 *   `'children'` for child-backed rest/single-child factories,
 *   `'direct'` for field-backed direct-value factories, and `'text'`
 *   for leaf / keyword factories that take a raw string.
 */
interface MapEntry {
	kind: string;
	factory: string;
	typeName: string;
	fluent: boolean;
	shape: 'config' | 'children' | 'text' | 'direct';
}

// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------

export class FactoryEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #leafReConsts: Map<string, string>;
	readonly #aliasSourceKinds: Set<string>;
	readonly #refineByKind: Map<string, RefineKindInfo>;
	readonly #preambleLines: string[];
	readonly #output: string[] = [];

	constructor(config: EmitFactoriesConfig) {
		const { nodeMap, generatedIdTables, kindEntries: providedKindEntries, inlineKinds, synthesizedKinds } = config;
		const kindEntries =
			providedKindEntries ??
			(generatedIdTables
				? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
				: undefined);

		const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];

		lines.push(`import type * as T from './types.js';`);
		if (kindEntries) {
			lines.push(`import { TSKindId, kindIdFromName } from './types.js';`);
		}
		const usesNonEmptyArray = collectUsesNonEmptyArray(nodeMap);
		const usesConfigOf = collectUsesHoistedPolymorphForm(nodeMap);
		const utilImports = ['AnyNodeData', 'FluentNode'];
		if (usesConfigOf) utilImports.push('ConfigOf');
		if (usesNonEmptyArray) utilImports.push('NonEmptyArray');
		lines.push(`import type { ${utilImports.sort().join(', ')} } from '@sittir/types';`);
		lines.push(
			"import { withMethods, methodsEngine, coerceBitflagStorage, coerceBooleanKeywordStorage, coerceKindEnumStorage } from './utils.js';"
		);
		lines.push('');
		lines.push(...emitFluentSetterHelpers());
		lines.push(...emitConfigChildrenHelper());
		lines.push(...emitNonEmptyAssertHelper());
		lines.push('');

		const leafReConsts = buildLeafReConsts(nodeMap, lines);
		if (leafReConsts.size > 0) lines.push('');

		const aliasSourceKinds = collectAliasSourceKinds(nodeMap);
		const refineByKind = new Map<string, RefineKindInfo>();
		for (const info of collectRefineKindInfos(nodeMap) ?? []) {
			refineByKind.set(info.kind, info);
		}

		this.#nodeMap = nodeMap;
		this.#kindEntries = kindEntries;
		this.#inlineKinds = inlineKinds;
		this.#synthesizedKinds = synthesizedKinds;
		this.#leafReConsts = leafReConsts;
		this.#aliasSourceKinds = aliasSourceKinds;
		this.#refineByKind = refineByKind;
		this.#preambleLines = lines;
	}

	emitLeaf(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void {
		factory.leaf(this.#output, node, this.#nodeMap, this.#leafReConsts, this.#kindEntries);
	}

	emitBranch(node: Extract<AssembledNode, { modelType: 'branch' }>): void {
		factory.branch(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitPolymorph(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void {
		factory.polymorph(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitGroup(node: Extract<AssembledNode, { modelType: 'group' }>): void {
		factory.group(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	dispatchNode(kind: string, node: AssembledNode): void {
		const emission = classifyFactoryEmission(kind, node, {
			nodeMap: this.#nodeMap,
			kindEntries: this.#kindEntries,
			inlineKinds: this.#inlineKinds,
			synthesizedKinds: this.#synthesizedKinds
		});
		if (
			emission === 'skip-inline-kind' ||
			emission === 'skip-synthesized-kind' ||
			emission === 'skip-missing-parser-symbol'
		) {
			warnSkippedParserSymbol(kind, 'factory', emission);
		}
		if (emission !== 'emit') return;

		const prevLen = this.#output.length;
		switch (node.modelType) {
			case 'pattern':
			case 'keyword':
			case 'enum':
				this.emitLeaf(node);
				break;
			case 'branch':
				this.emitBranch(node);
				break;
			case 'polymorph':
				this.emitPolymorph(node);
				break;
			case 'group':
				this.emitGroup(node);
				break;
			default:
				break;
		}
		if (this.#output.length === prevLen) return;

		const refineInfo = this.#refineByKind.get(kind);
		if (!refineInfo) return;
		for (const form of refineInfo.forms) {
			const formSource = emitRefineFormFactory(node, form, refineInfo, this.#nodeMap, this.#kindEntries);
			if (formSource === undefined) continue;
			this.#output.push(formSource);
		}
	}

	finalize(): string {
		const lines = [...this.#preambleLines];
		for (const source of this.#output) {
			lines.push(source);
			lines.push('');
		}

		const mapEntries = buildFactoryMapEntries(this.#nodeMap, this.#aliasSourceKinds, this.#kindEntries);
		lines.push(...emitFluentKindMap(mapEntries));
		lines.push('');
		lines.push(...emitFactoryMapConst(mapEntries));
		lines.push('');

		return lines.join('\n');
	}
}
