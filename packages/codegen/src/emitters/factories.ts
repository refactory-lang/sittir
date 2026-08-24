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
	kindDiscriminantExprForId,
	kindDiscriminantExprForLiteral,
	findKindEntryForLiteral,
	hasCatalogEntry,
	type KindEnumEntry
} from './kind-discriminant.ts';
import {
	type AssembledNode,
	type AssembledNonterminal,
	type AssembledSeparatedList,
	AssembledGroup,
	AssembledKeyword,
	AssembledToken
} from '../compiler/model/node-map.ts';
import { isNodeRef, isTerminalValue, allSlotsOf, storageKindOfRef } from '../compiler/model/node-map.ts';
import {
	isRequired,
	isMultiple,
	isNonEmpty,
	slotKindNames,
	slotLiteralValues,
	fieldTypeComponents,
	childTypeComponents,
	isValidIdent,
	resolveFieldStorageInfo,
	resolveHiddenKeywordLiteral,
	classifyFactoryShape,
	classifyChildFactorySurface,
	keywordRefWireIdentity,
	classifyFactoryEmission,
	forwardedTargetKind,
	resolveDirectFactorySlot,
	collectAliasSourceKinds,
	warnSkippedParserSymbol,
	soleSlotFacts,
	canonicalSeparatedListField,
	escForSource
} from './shared.ts';
import {
	collectRefineKindInfos,
	refineFormTypeName,
	refineFormFactoryName,
	type RefineKindInfo,
	type RefineFormInfo
} from './refine-emit.ts';
import { buildSeparatedListContentSlot, collectSeparatorCandidateKindNames } from './wrap.ts';
import type { CodegenEmitter } from './emitter.ts';
import { emittedByCatalog, namespacedConstructors, type NamespacedConstructorSet } from './namespaced-constructors.ts';
import { buildTriviaParamType, resolveTriviaTypeNames } from './client-utils.ts';

export interface EmitFactoriesConfig {
	grammar: string;
	nodeMap: NodeMap;
	strict?: boolean;
	generatedIdTables?: GeneratedIdTables;
	kindEntries?: readonly KindEnumEntry[];
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	triviaKinds?: readonly string[];
}

// ---------------------------------------------------------------------------
// FactoryEmitter helpers
// ---------------------------------------------------------------------------

function collectUsesNonEmptyArray(nodeMap: NodeMap): boolean {
	for (const n of nodeMap.nodes.values()) {
		if (n.modelType === 'separatedList' && n.nonEmpty) return true;
		if (allSlotsOf(n).some((f) => isNonEmpty(f))) return true;
	}
	return false;
}

function collectStorageCoercionImports(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string[] {
	const imports = new Set<string>();
	for (const node of nodeMap.nodes.values()) {
		for (const slot of allSlotsOf(node)) {
			const storageInfo = resolveFieldStorageInfo(slot, nodeMap, kindEntries);
			switch (storageInfo.kind) {
				case 'boolean':
					imports.add('coerceBooleanKeywordStorage');
					break;
				case 'bitflag':
					imports.add('coerceBitflagStorage');
					break;
				case 'kindEnum':
					if (kindEntries) imports.add('coerceKindEnumStorage');
					break;
				case 'verbatim':
					break;
			}
		}
	}
	return [...imports].sort();
}

function collectUsesKindIdFromName(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): boolean {
	if (!kindEntries) return false;
	for (const node of nodeMap.nodes.values()) {
		for (const slot of allSlotsOf(node)) {
			const storageInfo = resolveFieldStorageInfo(slot, nodeMap, kindEntries);
			if (storageInfo.kind !== 'kindEnum') continue;
			if (kindEnumTextMapExpr(slot, nodeMap, kindEntries).includes('kindIdFromName(')) return true;
		}
	}
	return false;
}

function emitFluentSetterHelpers(): string[] {
	return [];
}

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
		// TEMPORARY: 'separatedList' widened in alongside 'branch' — see
		// isSlotBearingCompound's doc comment (shared.ts).
		const fluent = node.modelType === 'branch' || node.modelType === 'separatedList';
		const classified = classifyFactoryShape(node, nodeMap, { includeTokenText: true });
		if (!classified) continue;
		// `MapEntry.shape` is dead-to-runtime (emitFactoryMapConst/
		// emitFluentKindMap never read it) — 'spread'/'elements' both
		// collapse to 'children' here purely so this field's narrower type
		// stays satisfied; the validator-only distinction lives in
		// factory-map.ts's own factoryShapes, built straight from
		// classifyFactoryShape without this remap.
		const shape = classified === 'spread' || classified === 'elements' ? 'children' : classified;
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

/** The factory's namespaced constructors — ambiguous names reported once
 *  and dropped; entries pre-filtered to the emittable set (see
 *  namespacedEntryEligible) so every consumer — factory consts, ir
 *  bundles, from mirrors, `_fromMap`'s `$impl` decision — sees the same
 *  surface. */
export function namespaceOf(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): NamespacedConstructorSet {
	const set = namespacedConstructors(node, nodeMap, { isEmitted: emittedByCatalog(kindEntries) });
	for (const a of set.ambiguous) {
		if (warnedAmbiguous.has(`${node.kind}.${a.name}`)) continue;
		warnedAmbiguous.add(`${node.kind}.${a.name}`);
		console.warn(
			`[codegen] '${node.kind}': namespaced constructor '${a.name}' is claimed by ${a.claimants.join(' and ')} — none hoisted`
		);
	}
	const entries = set.entries.filter((e) => namespacedEntryEligible(e, nodeMap, kindEntries));
	return entries.length === set.entries.length ? set : { ...set, entries };
}
const warnedAmbiguous = new Set<string>();

/**
 * Taxonomy-keyed factory dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
export namespace factory {
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

	export function branch(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'branch' }>,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(
			emitFieldCarryingFactory(node, node.fields, nodeMap, kindEntries, namespaceOf(node, nodeMap, kindEntries))
		);
	}

	export function group(
		output: string[],
		node: Extract<AssembledNode, { modelType: 'group' }>,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(
			emitFieldCarryingFactory(node, node.fields, nodeMap, kindEntries, namespaceOf(node, nodeMap, kindEntries))
		);
	}

	export function separatedList(
		output: string[],
		node: AssembledSeparatedList,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		const result = emitSeparatedListFactory(node, nodeMap, kindEntries);
		if (result) output.push(result);
	}
}

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

function buildEnumLiteralUnion(node: { values: readonly string[] }): string {
	return node.values.map((v) => `'${escForSource(v)}'`).join(' | ');
}

// ---------------------------------------------------------------------------
// Field-carrying factory (branches, groups, polymorph forms)
// ---------------------------------------------------------------------------

type FieldCarryingNode = Extract<AssembledNode, { modelType: 'branch' | 'group' }>;

export function childElementType(node: { children: readonly AssembledNonterminal[] }, nodeMap: NodeMap): string {
	const parts = new Set<string>();
	for (const c of node.children) {
		for (const component of childTypeComponents(c, nodeMap)) {
			if (component.kind === 'literal') {
				parts.add(JSON.stringify(component.value));
				continue;
			}
			if (component.kind === 'missing') {
				parts.add(JSON.stringify(component.rawKind));
				continue;
			}
			let ref = nodeMap.nodes.get(component.rawKind);
			if (!ref) {
				parts.add(JSON.stringify(component.rawKind));
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
			if (component.rawKind.startsWith('_') && (ref.modelType === 'multi' || ref.modelType === 'token')) {
				const visible = nodeMap.nodes.get(component.rawKind.slice(1));
				if (visible) ref = visible;
			}
			const name = ref.typeName;
			parts.add(/^[A-Za-z_$][\w$]*$/.test(name) ? `T.${name}` : JSON.stringify(component.rawKind));
		}
	}
	if (parts.size === 0) return 'never';
	const union = [...parts].join(' | ');
	return parts.size > 1 ? `(${union})` : union;
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
}

// Exported: from.ts's resolver emission shares this map builder (it
// previously had its own duplicate emitting runtime `kindIdFromName(text)`
// lookups — which resolve literal texts through the name-polymorphic
// runtime switch and reintroduce the #129 shadowing at runtime).
export function kindEnumTextMapExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if (storageInfo.kind !== 'kindEnum' || !kindEntries) return '[]';
	const byText: Array<readonly [string, string]> = [];
	// Every text below is a LITERAL TOKEN TEXT (enum member values and
	// terminal STRING values), so resolution goes through the literal-aware
	// lookup — the anonymous token must win over a same-spelled named rule
	// (#129: python's `'type'` keyword stamped the `type` RULE's id, which
	// the transport dispatched to TypeTransport → "Missing field `_content`").
	for (const value of f.values) {
		if (isNodeRef(value)) {
			const kind = storageKindOfRef(value.node);
			const resolved = nodeMap.nodes.get(kind);
			if (resolved instanceof AssembledKeyword || resolved instanceof AssembledToken) {
				// Same wire-identity derivation as kindEnumTextIdPairs/
				// classifyFieldStorageInfo — see keywordRefWireIdentity
				// (shared.ts) for the alias vs hidden-inlined split.
				const text = resolved.text;
				if (text === undefined) continue;
				const { kindName, kindId } = keywordRefWireIdentity(value, resolved);
				const discriminant =
					(kindId !== undefined ? kindDiscriminantExprForId(kindId, kindEntries) : undefined) ??
					(kindName !== undefined && hasCatalogEntry(kindEntries, kindName)
						? kindDiscriminantExpr(kindName, nodeMap, kindEntries)
						: findKindEntryForLiteral(kindEntries, text) !== undefined
							? kindDiscriminantExprForLiteral(text, kindEntries)
							: undefined);
				if (discriminant === undefined) continue;
				byText.push([text, discriminant]);
				continue;
			}
			if (!resolved || resolved.modelType !== 'enum') continue;
			for (const text of resolved.values) {
				// PR-K3a: the enum node's construction-time literal-chain
				// record is authoritative and already carries the stamped id
				// (`rec.id`) — resolve straight from it via
				// kindDiscriminantExprForId rather than re-deriving one from
				// `rec.kind` through a fresh name-keyed catalog scan. The old
				// chain remains only for catalog-less construction (fixtures).
				const rec = resolved.resolvedByText.get(text);
				const discriminant =
					rec !== undefined
						? (kindDiscriminantExprForId(rec.id, kindEntries) ?? kindDiscriminantExpr(rec.kind, nodeMap, kindEntries))
						: findKindEntryForLiteral(kindEntries, text) !== undefined
							? kindDiscriminantExprForLiteral(text, kindEntries)
							: hasCatalogEntry(kindEntries, resolved.kind)
								? kindDiscriminantExpr(resolved.kind, nodeMap, kindEntries)
								: `kindIdFromName(${JSON.stringify(resolved.kind)})`;
				byText.push([text, discriminant]);
			}
			continue;
		}
		if (!isTerminalValue(value)) continue;
		// PR-K3a: the mint ID stamp (resolvedKindId, minted through the
		// literal chain) is authoritative when present — the resolvedKind
		// NAME is not a resolution key (a link-minted name can collide with
		// a rule name; the id cannot). Chain fallback for stamp-less values
		// (fixtures); genuinely kindless literals skip.
		const discriminant =
			(value.resolvedKindId !== undefined ? kindDiscriminantExprForId(value.resolvedKindId, kindEntries) : undefined) ??
			(findKindEntryForLiteral(kindEntries, value.value) !== undefined
				? kindDiscriminantExprForLiteral(value.value, kindEntries)
				: undefined);
		if (discriminant === undefined) continue;
		byText.push([value.value, discriminant]);
	}
	return `[${byText.map(([text, discriminant]) => `[${JSON.stringify(text)}, ${discriminant}] as const`).join(', ')}]`;
}

function slotStorageFromValueExpr(
	f: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	switch (storageInfo.kind) {
		case 'boolean':
			return `coerceBooleanKeywordStorage(${valueExpr})`;
		case 'bitflag':
			return `coerceBitflagStorage(${valueExpr}, ${bitflagTextsExpr(storageInfo.texts)})`;
		case 'kindEnum': {
			// The storage type the node interface declares for this slot
			// (types.ts: a kind-enum member id, or an array of them).
			const storageType = isMultiple(f) && !storageInfo.collapsesMultiplicity ? 'number[]' : 'number';
			return kindEntries
				? `coerceKindEnumStorage<${storageType}>(${valueExpr}, ${kindEnumTextMapExpr(f, nodeMap, kindEntries)})`
				: valueExpr;
		}
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
	const valueExpr = `${configAccess}.${f.configKey}`;
	// types.ts declares every multiple field's accessor as always returning
	// an array, never `| undefined` — storage draws no distinction between
	// "empty array" and "absent" for array-shaped slots; "must have at least
	// one" is enforced elsewhere (the Config type's required key, or
	// `_assertNonEmpty` at the from.ts boundary), not by leaving storage
	// `undefined`. Default here unconditionally for any multiple field so a
	// bypassed/omitted value still stores `[]` rather than `undefined`.
	const withDefault = isMultiple(f) ? `(${valueExpr} ?? [])` : valueExpr;
	return slotStorageFromValueExpr(f, withDefault, nodeMap, kindEntries);
}

function setterValueSignature(f: AssembledNonterminal, elemType: string): string {
	if (isRequired(f)) return `value: ${elemType}`;
	return `value?: ${elemType}`;
}

// `fnTakesFieldDirectly` distinguishes the two factory calling conventions:
// config-object factories (`fn(config)`) have `Parameters<typeof fn>[0]`
// as the config object, so re-deriving the field's type means indexing it
// by `configKey`; single-field factories (Gap 5, `fn(value)`) pass the
// field's own value as that first parameter, so indexing by `configKey`
// would reach into the value's own (non-object) type instead.
function setterElemType(
	f: AssembledNonterminal,
	elemType: string,
	fn: string,
	nodeMap: NodeMap,
	fnTakesFieldDirectly = false
): string {
	if (resolveFieldStorageInfo(f, nodeMap).kind !== 'verbatim') {
		return fnTakesFieldDirectly
			? `NonNullable<Parameters<typeof ${fn}>[0]>`
			: `NonNullable<Parameters<typeof ${fn}>[0]>['${f.configKey}']`;
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

/** The `delimiter` bitflag members the grammar permits a caller to select
 *  (leading = 1, trailing = 2, both = 3); empty when neither flank is
 *  optional. ONE derivation for both the factory option's union type and
 *  the from() coercer's runtime narrowing guard. */
export function delimiterMembersFor(list: {
	readonly leadingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly trailingDelimiter: 'mandatory' | 'optional' | 'none';
}): readonly string[] {
	const l = list.leadingDelimiter === 'optional';
	const t = list.trailingDelimiter === 'optional';
	return [
		...(l ? ['Delimiter.Leading'] : []),
		...(t ? ['Delimiter.Trailing'] : []),
		...(l && t ? ['Delimiter.Both'] : [])
	];
}

/** The `delimiter` option's type for a list with these flank modes. */
function delimiterUnionFor(list: {
	readonly leadingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly trailingDelimiter: 'mandatory' | 'optional' | 'none';
}): string {
	return delimiterMembersFor(list).join(' | ');
}

/**
 * A field-carrying factory's calling convention, resolved once: the
 * parameter list the factory declares and how the body reads each slot.
 * `emitFieldCarryingFactory` spells its signature from this, and a
 * namespaced form constructor (`parent.form(...)`) re-declares the SAME
 * parameters for its child — one derivation, two consumers.
 */
interface FactorySurface {
	readonly containerFacts: ReturnType<typeof soleSlotFacts> | null;
	readonly singleField: AssembledNonterminal | undefined;
	/** Parameter list text, without the parentheses. */
	readonly params: string;
	/** Forwarding call arguments for `params` (`...children`, `config`, …). */
	readonly args: string;
	readonly elementType?: string;
	readonly directParamType?: string;
	readonly directParamOptional: boolean;
	readonly configType?: string;
	readonly opt: '' | '?';
}

function resolveFactorySurface(node: FieldCarryingNode, nodeMap: NodeMap): FactorySurface {
	// Container shape: unnamed single/multiple child slot, positional
	// `child`/`...children` calling convention. Never applies to 'group' —
	// `classifyChildFactorySurface` only recognizes 'branch' modelType, since
	// polymorph FORM factories (group) are always field-carrying.
	const containerFacts =
		node.modelType === 'branch' && classifyChildFactorySurface(node, nodeMap) !== null
			? soleSlotFacts(node, nodeMap)
			: null;
	// Gap 5: Single-field-no-children factories take the value directly
	// instead of a config object. `resolveDirectFactorySlot` is the single
	// derivation of this calling convention, shared with
	// `classifyFactoryShape` so the emitted signature and the shape
	// metadata can never disagree.
	const singleField = !containerFacts ? resolveDirectFactorySlot(node, nodeMap) : undefined;
	if (containerFacts) {
		const elementType = resolveContainerElementType(
			{
				kind: node.kind,
				typeName: node.typeName,
				treeTypeName: node.treeTypeName,
				rawFactoryName: node.rawFactoryName,
				fields: [containerFacts.slot]
			},
			nodeMap
		);
		if (containerFacts.multiple) {
			return {
				containerFacts,
				singleField,
				params: `...children: ${elementType}[]`,
				args: '...children',
				elementType,
				directParamOptional: false,
				opt: ''
			};
		}
		const optMark = containerFacts.required ? '' : '?';
		return {
			containerFacts,
			singleField,
			params: `child${optMark}: ${elementType}`,
			args: 'child',
			elementType,
			directParamType: elementType,
			directParamOptional: !containerFacts.required,
			opt: optMark
		};
	}
	if (singleField) {
		const elemType = `T.${node.typeName}.Config['${singleField.configKey}']`;
		const optMark = isRequired(singleField) ? '' : '?';
		return {
			containerFacts,
			singleField,
			params: `${singleField.paramName}${optMark}: ${elemType}`,
			args: singleField.paramName,
			directParamType: elemType,
			directParamOptional: !isRequired(singleField),
			opt: optMark
		};
	}
	const fields = node.fields;
	const opt = resolveConfigOptional(fields);
	const configType = resolveConfigType(node, nodeMap.refineForms?.has(node.kind) ?? false);
	// When opt is '?' (all fields optional), a local `_config` default lets
	// property access use `config.x` (no optional chaining) — only when the
	// body actually reads from config.
	const hasConfigReads = fields.length > 0;
	return {
		containerFacts,
		singleField,
		params: opt === '?' && hasConfigReads ? `config: Partial<${configType}> = {}` : `config${opt}: ${configType}`,
		args: 'config',
		configType,
		directParamOptional: false,
		opt
	};
}

/**
 * The kind whose constructor arguments a form constructor takes: a
 * forwarding factory (see `forwardedTargetKind`) hands its target's
 * arguments straight through, transitively.
 */
export function constructorTargetKind(kind: string, nodeMap: NodeMap): string {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || (node.modelType !== 'branch' && node.modelType !== 'group')) return kind;
	const surface = resolveFactorySurface(node, nodeMap);
	const target = surface.directParamType !== undefined ? forwardedTargetKind(node, nodeMap) : null;
	return target === null ? kind : constructorTargetKind(target, nodeMap);
}

/** The parameters a form constructor declares for `kind` and how it
 *  forwards them — the target factory's own surface. */
function constructorSurface(
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): { params: string; args: string } | undefined {
	const target = nodeMap.nodes.get(constructorTargetKind(kind, nodeMap));
	if (target === undefined) return undefined;
	switch (target.modelType) {
		case 'separatedList': {
			const list = separatedListSurface(target, nodeMap, kindEntries);
			// With per-instance options the list factory dispatches on its
			// first argument (`fn(...elements)` / `fn(options, ...elements)`);
			// the hoisted form keeps that one surface.
			return list.optionsType === undefined
				? { params: `...elements: ${list.elementsType}`, args: '...elements' }
				: { params: `...args: (${list.optionsType} | ${list.elemTypeForArray})[]`, args: '...args' };
		}
		case 'branch':
		case 'group': {
			const surface = resolveFactorySurface(target, nodeMap);
			return { params: surface.params, args: surface.args };
		}
		default:
			return undefined;
	}
}

/** The per-kind explicit factory return type: the concrete interface plus
 *  construction metadata, the `$with` setter record (self-referencing by
 *  NAME — what keeps declaration emit finite), and the shared method tail. */
function builtAliasLines(
	builtName: string,
	base: string,
	withTypeMembers: readonly string[],
	variantName?: string,
	extraMembers: readonly string[] = []
): string[] {
	return [
		`export type ${builtName} = ${base} & {`,
		'  readonly $source: 2;',
		'  readonly $named: true;',
		...(variantName ? [`  readonly $variant: '${variantName}';`] : []),
		...extraMembers,
		'  readonly $with: {',
		...withTypeMembers,
		'  };',
		'} & _NodeMethods;',
		''
	];
}

function emitFieldCarryingFactory(
	node: FieldCarryingNode,
	fields: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined,
	namespace: NamespacedConstructorSet | null = null
): string {
	// A namespaced factory is exported as a const carrying its constructors
	// (`export const buildX = attachProps(buildX$impl, {...})`); the
	// implementation below is then the private `buildX$impl`, and every
	// self-reference (setters, the forwarding tail) stays on the impl so
	// the const's type never depends on its own initializer.
	const exportName = node.rawFactoryName!;
	const namespaced = namespace !== null && namespace.entries.length > 0;
	const fn = namespaced ? `${exportName}$impl` : exportName;
	const exportKw = namespaced ? '' : 'export ';
	fields = fields ?? [];
	const typeKind = node.modelType === 'group' ? (node.parentKind ?? node.kind) : node.kind;
	const variantName = node.modelType == 'group' ? resolvePolymorphFormVariantName(node) : undefined;
	const surface = resolveFactorySurface(node, nodeMap);
	const { containerFacts, singleField } = surface;

	// A field with an optional delimiter flank cannot reach this emitter: a
	// delimiter-bearing list is a separatedList KIND (classifyNode routes it
	// there, peeling group wrappers), and the delimiter is stored kind-level
	// on that kind — field-prefixed delimiter storage is retired. Fail fast
	// if classification ever regresses.
	const flankField = fields.find((f) => f.trailingDelimiter === 'optional' || f.leadingDelimiter === 'optional');
	if (flankField !== undefined) {
		throw new Error(
			`emitFieldCarryingFactory: '${typeKind}' field '${flankField.name}' carries an optional delimiter — ` +
				`a delimiter-bearing list must classify as its own separatedList kind (kind-level _delimiter storage)`
		);
	}

	const builtName = `${node.typeName}Built`;
	const signature = `${exportKw}function ${fn}(${surface.params}): ${builtName} {`;
	let valueSourceFor: (f: AssembledNonterminal) => string;
	let withLines: string[];
	// Parallel type members for the `$with` record — same parameter text as
	// the lambdas below, so the alias and the runtime never diverge.
	let withTypeMembers: string[];
	// Which fields actually get storage + a getter. Container shape only
	// stamps its ONE real slot — `node.fields` can hold other entries
	// (e.g. keyword-presence markers) that `classifyBranchSlots`' userSlot
	// filtering already excluded from the single-slot classification, and
	// the original per-shape emitters never touched those for a container.
	// The other two shapes (single-field, config) always use every field.
	let fieldsToEmit: readonly AssembledNonterminal[] = fields;

	if (containerFacts) {
		// The container's ONE user slot takes the positional child value.
		// Other fields (markers the single-slot classification excluded)
		// stay un-emitted, as before.
		fieldsToEmit = [containerFacts.slot];
		const elementType = surface.elementType!;
		valueSourceFor = (f) => (f === containerFacts.slot ? (containerFacts.multiple ? 'children' : 'child') : '');
		withLines = containerFacts.multiple
			? [`    $with: { $children: (...vs: ${elementType}[]) => ${fn}(...vs) },`]
			: [`    $with: { $child: (v: ${elementType}) => ${fn}(v) },`];
		withTypeMembers = containerFacts.multiple
			? [`    $children(...vs: ${elementType}[]): ${builtName};`]
			: [`    $child(v: ${elementType}): ${builtName};`];
	} else if (singleField) {
		const elemType = surface.directParamType!;
		const paramName = singleField.paramName;
		valueSourceFor = (f) => slotStorageFromValueExpr(f, paramName, nodeMap, kindEntries);
		const setterType = setterElemType(singleField, elemType, fn, nodeMap, true);
		const setterSig = setterValueSignature(singleField, setterType);
		withLines = ['    $with: {', `      ${singleField.propertyName}: (${setterSig}) => ${fn}(value),`, '    },'];
		withTypeMembers = [`    ${singleField.propertyName}(${setterSig}): ${builtName};`];
	} else {
		const configAccess = 'config';
		valueSourceFor = (f) => slotStorageExpr(f, configAccess, nodeMap, kindEntries);
		// $with: setters call the factory directly with a patched config —
		// `(value) => factory({ ...config, <key>: value })`. No `_setField` /
		// `_setFields` indirection (those were old helpers serving
		// the combined getter/setter method; under shape A getters are pure and
		// the setter is purely a rebuild). Auto-stamp fields are skipped — no
		// setter exposed because the value is fixed.
		withLines = ['    $with: {'];
		withTypeMembers = [];
		for (const f of fields) {
			const method = f.propertyName;
			const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
			if (isMultiple(f) && storageInfo.kind === 'verbatim') {
				const elemType = fieldElementType(f, nodeMap);
				const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
				const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
				withLines.push(
					`      ${method}: (...values: ${restType}) => ${fn}({ ...${configAccess}, ${f.configKey}: values }),`
				);
				withTypeMembers.push(`    ${method}(...values: ${restType}): ${builtName};`);
			} else {
				const elemType = setterElemType(f, fieldElementType(f, nodeMap), fn, nodeMap);
				const setterSig = setterValueSignature(f, elemType);
				withLines.push(`      ${method}: (${setterSig}) => ${fn}({ ...${configAccess}, ${f.configKey}: value }),`);
				withTypeMembers.push(`    ${method}(${setterSig}): ${builtName};`);
			}
		}
		// Post-unification: the legacy `children` setter is gone — per-slot setters
		// above cover every slot through the unified `fields` loop.
		withLines.push('    },');
	}

	// --- Shared body, all three shapes: storage hoist, withMethods literal,
	// getters. Storage uses property shorthand so the local const flows in
	// by name; getters are method shorthand reading the local const via
	// closure. `withMethods<T>` adds the four `$`-prefixed methods at the
	// boundary — generic on T preserves the literal's type. ---
	const lines: string[] = [signature];
	if (containerFacts?.multiple && containerFacts.nonEmpty) {
		lines.push(`  _assertNonEmpty(children, '${node.kind}.children');`);
	}
	for (const f of fieldsToEmit) {
		lines.push(`  const ${f.storageKey} = ${valueSourceFor(f)};`);
	}
	lines.push('  return withMethods(withAccessors({');
	lines.push(`    $type: ${factoryTypeDiscriminant(typeKind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	if (variantName) lines.push(`    $variant: '${variantName}' as const,`);
	for (const f of fieldsToEmit) {
		lines.push(`    ${f.storageKey},`);
	}
	lines.push(...withLines);
	lines.push('  }, {');
	for (const f of fieldsToEmit) {
		const propName = f.propertyName;
		lines.push(`    ${propName}: () => ${f.storageKey},`);
	}
	lines.push('  }), methodsEngine);');
	lines.push('}');

	// 'forwarded' shape (see forwardedTargetKind, shared.ts): the direct
	// convention's single child slot holds exactly ONE concrete kind, so the
	// factory forwards that kind's constructor — callers pass either the
	// forwarded constructor arguments (the child is built internally) or a
	// pre-built node, discriminated by `$type`. The direct implementation
	// above becomes the private tail; chains compose transitively because a
	// forwarded TARGET factory performs the same dispatch itself.
	const { directParamType, directParamOptional } = surface;
	// A catalog-less target (tree-sitter-inlined kind) gets no factory to
	// forward to — the kind keeps the plain direct surface.
	const resolvedForwardTarget = directParamType !== undefined ? forwardedTargetKind(node, nodeMap) : null;
	const forwardTarget =
		resolvedForwardTarget !== null && kindEntries !== undefined && !hasCatalogEntry(kindEntries, resolvedForwardTarget)
			? null
			: resolvedForwardTarget;
	if (forwardTarget !== null) {
		const targetFn = nodeMap.nodes.get(forwardTarget)!.rawFactoryName!;
		lines[0] = lines[0]!.replace(`${exportKw}function ${fn}(`, `function _${fn}(`);
		const optMark = directParamOptional ? '?' : '';
		// The forwarded overload re-declares the target's own constructor
		// surface (its spread form for a list target) rather than
		// `Parameters<typeof target>`, which would select the target's LAST
		// overload — the options-first form of a separated list.
		const rawTargetParams =
			constructorSurface(forwardTarget, nodeMap, kindEntries)?.params ?? `...args: Parameters<typeof ${targetFn}>`;
		// Overload DECLARATIONS cannot carry parameter initializers — a target
		// surface like `config: Partial<X> = {}` re-declares as `config?: Partial<X>`.
		const targetParams = rawTargetParams.replace(/(\w+)\??: ([^=]+?) = \{\}/g, '$1?: $2');
		const wrapper: string[] = [
			`${exportKw}function ${fn}(child${optMark}: ${directParamType}): ReturnType<typeof _${fn}>;`,
			`${exportKw}function ${fn}(${targetParams}): ReturnType<typeof _${fn}>;`,
			`${exportKw}function ${fn}(...args: unknown[]) {`
		];
		wrapper.push(
			// A single non-object argument (undefined = optional-empty; string
			// = text-collapsed scalar storage; number = scalarized kind-enum
			// storage; boolean = keyword-presence storage) keeps the direct
			// pass-through semantics — read-side storage scalar-collapses such
			// children, so constructing a node here would diverge from what a
			// real parse stores. Only structured forwarded args (config
			// objects, node spreads) construct the child.
			`  if (args.length === 0 || (args.length === 1 && typeof args[0] !== 'object')) {`,
			`    return _${fn}(args[0] as ${directParamType});`,
			`  }`,
			`  const prebuilt =`,
			`    args.length === 1 && typeof args[0] === 'object' && args[0] !== null &&`,
			`    (args[0] as { $type?: unknown }).$type === (${factoryTypeDiscriminant(forwardTarget, nodeMap, kindEntries)});`,
			`  return prebuilt`,
			`    ? _${fn}(args[0] as ${directParamType})`,
			`    : _${fn}((${targetFn} as (...a: unknown[]) => unknown)(...args) as ${directParamType});`,
			'}'
		);
		lines.unshift(...wrapper);
	}
	lines.unshift(...builtAliasLines(builtName, `T.${node.typeName}`, withTypeMembers, variantName));
	if (namespaced) {
		lines.push('', ...emitNamespacedConstructors(node, namespace!, fn, exportName, surface, nodeMap, kindEntries));
	}
	return renameUnusedConfigParam(lines);
}

/**
 * `export const buildX = attachProps(buildX$impl, {...})` — the factory's
 * namespaced constructors. A form constructor declares its child's own
 * parameters (`constructorSurface`) and stores the built child in the
 * parent slot; a member constructor fixes its kind-enum slot to the
 * member's discriminant and takes the remaining user slots positionally.
 */
function emitNamespacedConstructors(
	node: FieldCarryingNode,
	namespace: NamespacedConstructorSet,
	fn: string,
	exportName: string,
	surface: FactorySurface,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string[] {
	// How the parent takes its slot value: positionally (container / direct
	// convention) or as a config key — the decision its signature came from.
	const positionalSlot = surface.containerFacts?.slot ?? surface.singleField;
	const fill = (slot: AssembledNonterminal, value: string): string =>
		slot === positionalSlot ? `${fn}(${value})` : `${fn}({ ${slot.configKey}: ${value} })`;
	const lines = [`export const ${exportName} = attachProps(${fn}, {`];
	for (const entry of namespace.entries) {
		const key = isValidIdent(entry.name) ? entry.name : JSON.stringify(entry.name);
		if (entry.via === 'form') {
			const ctor = [entry.childFactory, ...entry.path].join('.');
			// A hoisted sub-constructor already declares its own parameters;
			// a direct form takes what its factory (or forwarding target)
			// takes.
			const sig =
				entry.path.length > 0
					? { params: `...args: Parameters<typeof ${ctor}>`, args: '...args' }
					: constructorSurface(entry.childKind, nodeMap, kindEntries);
			// Unreachable when callers pre-filter via namespacedEntryEligible;
			// kept as a hard guard so a stale caller can't emit a dangling ref.
			if (sig === undefined) continue;
			// An `(options | element)[]` surface has no overload to resolve
			// against — the same untyped-args call the forwarded wrapper makes.
			const call =
				sig.args === '...args' && entry.path.length === 0
					? `(${ctor} as (...a: unknown[]) => ReturnType<typeof ${ctor}>)(...args)`
					: `${ctor}(${sig.args})`;
			lines.push(`  ${key}: (${sig.params}) => ${fill(entry.slot, call)},`);
		} else {
			// TS forbids a required parameter after an optional one: a slot is
			// declared optional only when every later parameter is too;
			// otherwise it is required with an explicit `| undefined`.
			const params = entry.params.map((p, i) => {
				const restOptional = entry.params.slice(i + 1).every((q) => !isRequired(q));
				const type = `T.${node.typeName}.Config['${p.configKey}']`;
				return isRequired(p)
					? `${p.paramName}: ${type}`
					: restOptional
						? `${p.paramName}?: ${type}`
						: `${p.paramName}: ${type} | undefined`;
			});
			const literal = kindEnumConfigValue(entry.literal, kindEntries);
			const call =
				entry.slot === positionalSlot
					? `${fn}(${literal})`
					: `${fn}({ ${[...entry.params.map((p) => `${p.configKey}: ${p.paramName}`), `${entry.slot.configKey}: ${literal}`].join(', ')} })`;
			lines.push(`  ${key}: (${params.join(', ')}) => ${call},`);
		}
	}
	lines.push('});');
	return lines;
}

/** Whether a namespaced constructor entry can actually be emitted as a
 *  factory prop: a direct form entry needs a resolvable constructor
 *  surface for its child kind. The ir/from surfaces attach the SAME prop
 *  set the factory carries, so all three consult this one predicate. */
export function namespacedEntryEligible(
	entry: NamespacedConstructorSet['entries'][number],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): boolean {
	if (entry.via !== 'form' || entry.path.length > 0) return true;
	return constructorSurface(entry.childKind, nodeMap, kindEntries) !== undefined;
}

/** The strict Config value for a kind-enum member: its kind discriminant
 *  when the catalog knows the literal, else the text. */
export function kindEnumConfigValue(literal: string, kindEntries: readonly KindEnumEntry[] | undefined): string {
	const entry = kindEntries === undefined ? undefined : findKindEntryForLiteral(kindEntries, literal);
	return entry === undefined ? `'${escForSource(literal)}'` : `TSKindId.${entry.member}`;
}

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
	const opt = resolveRefineFormConfigOptional(fields, nodeMap, narrowed);
	const formTypeName = refineFormTypeName(info.typeName, form.name);
	const formShortName = formTypeName.slice(info.typeName.length);
	const lines: string[] = [];
	// Refine form Config lives at `T.<Parent>.<FormShort>.Config` per
	// emitRefineFormSubNamespaces — the flat `T.<ParentForm>` identifier
	// is not emitted as a top-level namespace.
	const formBuiltName = `${info.typeName}${formShortName}Built`;
	const formWithTypeMembers: string[] = [];
	lines.push(`export function ${formFn}(config${opt}: T.${info.typeName}.${formShortName}.Config): ${formBuiltName} {`);
	// Post-unification: kind-named slots flow through `fields`; no separate
	// `$children` storage path remains.
	// Shape A: storage hoist + property shorthand + pure getters + $with.
	for (const f of fields) {
		const narrowedLit = narrowed.get(f.name);
		if (narrowedLit !== undefined) {
			lines.push(
				`  const ${f.storageKey} = ${slotStorageFromValueExpr(f, `${JSON.stringify(narrowedLit)} as const`, nodeMap, kindEntries)};`
			);
			continue;
		}
		lines.push(`  const ${f.storageKey} = ${slotStorageExpr(f, `config${opt}`, nodeMap, kindEntries)};`);
	}
	lines.push('  return withMethods(withAccessors({');
	lines.push(`    $type: ${factoryTypeDiscriminant(node.kind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	for (const f of fields) {
		lines.push(`    ${f.storageKey},`);
	}
	lines.push('    $with: {');
	for (const f of fields) {
		// Narrowed-literal fields are read-only — their value is fixed by
		// the form, no setter is exposed.
		if (narrowed.has(f.name)) continue;
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (isMultiple(f) && storageInfo.kind === 'verbatim') {
			const elemType = fieldElementType(f, nodeMap);
			const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
			lines.push(`      ${method}: (...values: ${restType}) => ${formFn}({ ...config, ${f.configKey}: values }),`);
			formWithTypeMembers.push(`    ${method}(...values: ${restType}): ${formBuiltName};`);
		} else {
			const elemType = setterElemType(f, fieldElementType(f, nodeMap), formFn, nodeMap);
			const setterSig = setterValueSignature(f, elemType);
			lines.push(`      ${method}: (${setterSig}) => ${formFn}({ ...config, ${f.configKey}: value }),`);
			formWithTypeMembers.push(`    ${method}(${setterSig}): ${formBuiltName};`);
		}
	}
	// Post-unification: legacy children setter is gone — per-slot setters above
	// cover every slot.
	lines.push('    },');
	lines.push('  }, {');
	for (const f of fields) {
		const propName = f.propertyName;
		lines.push(`    ${propName}: () => ${f.storageKey},`);
	}
	lines.push('  }), methodsEngine);');
	lines.push('}');
	lines.unshift(...builtAliasLines(formBuiltName, `T.${info.typeName}`, formWithTypeMembers));
	return lines.join('\n');
}

function resolveRefineFormConfigOptional(
	fields: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	narrowed: ReadonlyMap<string, string>
): '' | '?' {
	const hasRequired = fields.some((f) => isRequired(f) && !narrowed.has(f.name));
	return hasRequired ? '' : '?';
}

function resolveConfigOptional(fields: readonly AssembledNonterminal[]): '' | '?' {
	fields = fields ?? [];
	const hasRequired = fields.some((f) => isRequired(f));
	return hasRequired ? '' : '?';
}

function resolveConfigType(node: FieldCarryingNode, hasRefineForms: boolean): string {
	if (hasRefineForms) return `ConfigOf<T.${node.typeName}>`;
	return `T.${node.typeName}.Config`;
}

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
	readonly fields: readonly AssembledNonterminal[];
}

function resolveContainerElementType(node: ContainerNode, nodeMap: NodeMap): string {
	// The unnamed-child slot lives in `node.fields`; derive the element type
	// from it directly.
	return childElementType({ children: node.fields }, nodeMap);
}

// ---------------------------------------------------------------------------
// SeparatedList factory (separator-as-slot Task 6)
// ---------------------------------------------------------------------------

/** `fieldElementType` doesn't parenthesize multi-member unions (unlike
 *  `childElementType`) — guard the bare-array case, or `A | B[]` binds
 *  `[]` to `B` alone. */
function parenthesizeUnion(elemType: string): string {
	return elemType.includes(' | ') ? `(${elemType})` : elemType;
}

/**
 * A separated list factory's calling surface: the elements rest type and,
 * when the list has per-instance options (a nonterminal separator or an
 * optional flank), the leading options bag — `fn(...elements)` /
 * `fn(options, ...elements)`. Shared by the list factory's own signature
 * and by form constructors that hoist it.
 */
function separatedListSurface(
	node: AssembledSeparatedList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): {
	readonly elemType: string;
	readonly elemTypeForArray: string;
	readonly elementsType: string;
	readonly separatorKindUnion: string;
	readonly candidateKindNames: readonly string[];
	readonly hasSeparatorKindOption: boolean;
	readonly hasDelimiterOption: boolean;
	readonly optionsType: string | undefined;
} {
	const elemType = fieldElementType(buildSeparatedListContentSlot(node), nodeMap);
	const elemTypeForArray = parenthesizeUnion(elemType);
	const elementsType = node.nonEmpty ? `NonEmptyArray<${elemType}>` : `${elemTypeForArray}[]`;
	// Outer gate matches wrap.ts's `emitSeparatedListWrap` and render-module.ts's
	// `renderTransportDataStruct` exactly: `node.separatorRule !== undefined`,
	// NOT "at least one candidate resolves in the catalog" — the catalog
	// filter is applied only to the candidate LIST inside, same as those two.
	// Currently inert (no real grammar kind has a nonterminal separator), but
	// keeps the three tasks' gating logic consistent rather than diverging on
	// an edge case none of them can reach today.
	const hasSeparatorKindOption = node.separatorRule !== undefined;
	const candidateKindNames = hasSeparatorKindOption
		? collectSeparatorCandidateKindNames(node.separatorRule!).filter((k) => hasCatalogEntry(kindEntries, k))
		: [];
	const hasDelimiterOption = node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional';
	// `never` when the separator is nonterminal but zero candidates resolve
	// in the catalog (mirrors `childElementType`/`fieldElementType`'s own
	// zero-parts fallback) — an uninhabited type communicates "no valid
	// choice exists" rather than emitting an invalid empty union.
	const separatorKindUnion =
		candidateKindNames.length > 0 ? candidateKindNames.map((k) => JSON.stringify(k)).join(' | ') : 'never';
	const optionsTypeParts: string[] = [];
	if (hasSeparatorKindOption) optionsTypeParts.push(`separator?: ${separatorKindUnion}`);
	if (hasDelimiterOption) optionsTypeParts.push(`delimiter?: ${delimiterUnionFor(node)}`);
	const optionsType = optionsTypeParts.length > 0 ? `{ ${optionsTypeParts.join('; ')} }` : undefined;
	return {
		elemType,
		elemTypeForArray,
		elementsType,
		separatorKindUnion,
		candidateKindNames,
		hasSeparatorKindOption,
		hasDelimiterOption,
		optionsType
	};
}

function emitSeparatedListFactory(
	node: AssembledSeparatedList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const fn = node.rawFactoryName;

	// Single-field kinds (the common case) store/expose the elements under
	// the model's real slot name (Bug B fix — shared with wrap.ts/
	// render-module.ts via `canonicalSeparatedListField`), not a generic
	// `_content` bucket. Multi-field kinds (`node.fields.length > 1`) can't
	// be split from a flat `elements` array without a real per-field
	// partition (see doc comment) — they keep the old generic bucket.
	const isMultiField = node.fields.length > 1;
	const canonical = isMultiField ? undefined : canonicalSeparatedListField(node);
	const contentStorageKey = canonical?.storageKey ?? '_content';
	const contentAccessorName = canonical?.propertyName ?? 'content';
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	const {
		elemTypeForArray,
		elementsType,
		separatorKindUnion,
		candidateKindNames,
		hasSeparatorKindOption,
		hasDelimiterOption
	} = surface;
	const hasTrailingOption = node.trailingDelimiter === 'optional';
	const delimiterUnion = delimiterUnionFor(node);
	const hasOptions = surface.optionsType !== undefined;
	const optionsType = surface.optionsType ?? '{  }';

	const lines: string[] = [];
	// Spread signature with a LEADING optional options bag —
	// `fn(...elements)` / `fn(options, ...elements)` — dispatched on the
	// first argument: every element value is either a string literal or a
	// node carrying `$type`, so a plain object WITHOUT `$type` can only be
	// the options bag.
	const listBuiltName = `${node.typeName}Built`;
	const listWithTypeMembers = [
		`    $children(...vs: ${elementsType}): ${listBuiltName};`,
		...(hasSeparatorKindOption ? [`    separator(v: ${separatorKindUnion}): ${listBuiltName};`] : []),
		...(hasDelimiterOption ? [`    delimiter(v?: ${delimiterUnion}): ${listBuiltName};`] : [])
	];
	const listExtraMembers = [
		...(hasSeparatorKindOption ? ['  readonly _separator: number | undefined;'] : []),
		...(hasDelimiterOption ? ['  readonly _delimiter: Delimiter;'] : [])
	];
	lines.push(
		...builtAliasLines(listBuiltName, `T.${node.typeName}`, listWithTypeMembers, undefined, listExtraMembers)
	);
	if (hasOptions) {
		lines.push(`export function ${fn}(...elements: ${elementsType}): ReturnType<typeof _${fn}>;`);
		lines.push(
			`export function ${fn}(options: ${optionsType}, ...elements: ${elementsType}): ReturnType<typeof _${fn}>;`
		);
		lines.push(`export function ${fn}(...args: (${optionsType} | ${elemTypeForArray})[]) {`);
		const permittedKeys = [
			...(hasSeparatorKindOption ? ['separator'] : []),
			...(hasDelimiterOption ? ['delimiter'] : [])
		];
		// Options are recognized by shape: a plain object (not an array, not a
		// node — no `$type`) whose keys are all permitted option names.
		lines.push(
			`  const _optsFirst = typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0]) && !('$type' in (args[0] as object)) && ` +
				`Object.keys(args[0] as object).every((k) => ${JSON.stringify(permittedKeys)}.includes(k));`
		);
		lines.push(`  const options = (_optsFirst ? args[0] : {}) as ${optionsType};`);
		lines.push(`  const elements = (_optsFirst ? args.slice(1) : args) as unknown as ${elementsType};`);
		lines.push(`  return _${fn}(elements, options);`);
		lines.push('}');
		lines.push(`function _${fn}(elements: ${elementsType}, options: ${optionsType}): ${listBuiltName} {`);
	} else {
		lines.push(`export function ${fn}(...elements: ${elementsType}): ${listBuiltName} {`);
	}
	if (node.nonEmpty) {
		lines.push(`  _assertNonEmpty(elements, '${node.kind}.elements');`);
	}
	// Terminated-list validity invariant (see AssembledSeparatedList.
	// terminatedSeparator): a single element must carry the trailing
	// delimiter — the undelimited one-element rendering parses as a
	// different construct.
	if (node.terminatedSeparator && hasTrailingOption) {
		lines.push(`  if (elements.length === 1 && ((options.delimiter ?? Delimiter.None) & Delimiter.Trailing) === 0) {`);
		lines.push(`    throw new Error('${node.kind}: a single element requires a trailing delimiter (delimiter: 2)');`);
		lines.push('  }');
	}
	lines.push(`  const ${contentStorageKey} = elements;`);
	if (hasSeparatorKindOption) {
		if (candidateKindNames.length > 0) {
			const arms = candidateKindNames
				.map((k) => `${JSON.stringify(k)}: ${kindDiscriminantExpr(k, nodeMap, kindEntries)}`)
				.join(', ');
			lines.push(
				`  const _separator = ({ ${arms} } as Record<string, number>)[options.separator ?? ${JSON.stringify(candidateKindNames[0])}];`
			);
		} else {
			lines.push('  const _separator = undefined;');
		}
	}
	if (hasDelimiterOption) {
		lines.push('  const _delimiter = options.delimiter ?? Delimiter.None;');
	}

	lines.push('  return withMethods(withAccessors({');
	lines.push(`    $type: ${factoryTypeDiscriminant(node.kind, nodeMap, kindEntries)},`);
	lines.push('    $source: 2 as const,');
	lines.push('    $named: true as const,');
	lines.push(`    ${contentStorageKey},`);
	if (hasSeparatorKindOption) lines.push('    _separator,');
	if (hasDelimiterOption) lines.push('    _delimiter,');
	lines.push('    $with: {');
	const optionsArg = hasOptions ? 'options, ' : '';
	// Rest param type must match `elementsType` exactly (`NonEmptyArray<T>`
	// when nonEmpty) — a plain `T[]` rest capture isn't assignable to the
	// tuple-shaped `NonEmptyArray<T>` the factory's own `elements` parameter
	// requires. Independently computed from `node.nonEmpty` (the
	// authoritative source — `rule.type === REPEAT1`) rather than via
	// `childrenSetterRestType`, which derives multiplicity from
	// `AssembledNonterminal.isMultiple`/`isNonEmpty` — themselves derived
	// from `slot.values`' own per-value `multiplicity` tags, so they
	// generally DO reflect the content slot's real multiplicity. The narrow
	// edge case that rules this out as a safe drop-in: if
	// `deriveValuesForRule` (node-map.ts) ever resolves `node.elements` to
	// an EMPTY array for some content-rule shape (e.g. an unresolved
	// reference), `isMultiple`/`isNonEmpty` degrade to `false` on zero
	// values, silently diverging from the true (still-repeated) rule shape
	// — `node.nonEmpty` has no such degenerate case since it reads directly
	// off `rule.type`, never off the derived value count.
	lines.push(`      $children: (...vs: ${elementsType}) => ${fn}(${optionsArg}...vs),`);
	if (hasSeparatorKindOption) {
		lines.push(`      separator: (v: ${separatorKindUnion}) => ${fn}({ ...options, separator: v }, ...elements),`);
	}
	if (hasDelimiterOption) {
		lines.push(`      delimiter: (v?: ${delimiterUnion}) => ${fn}({ ...options, delimiter: v }, ...elements),`);
	}
	lines.push('    },');
	lines.push('  }, {');
	lines.push(`    ${contentAccessorName}: () => ${contentStorageKey},`);
	lines.push('  }), methodsEngine);');
	lines.push('}');
	return lines.join('\n');
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

interface MapEntry {
	kind: string;
	factory: string;
	typeName: string;
	fluent: boolean;
	shape: 'config' | 'children' | 'text' | 'direct' | 'forwarded';
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
		const { nodeMap, generatedIdTables, kindEntries: providedKindEntries, inlineKinds, synthesizedKinds, triviaKinds } = config;
		const kindEntries =
			providedKindEntries ??
			(generatedIdTables
				? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
				: undefined);

		const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];

		lines.push(`import type * as T from './types.js';`);
		lines.push(`import { Delimiter } from './types.js';`);
		if (kindEntries) {
			const kindIdImports = ['TSKindId'];
			if (collectUsesKindIdFromName(nodeMap, kindEntries)) kindIdImports.push('kindIdFromName');
			lines.push(`import { ${kindIdImports.join(', ')} } from './types.js';`);
		}
		const usesNonEmptyArray = collectUsesNonEmptyArray(nodeMap);
		const storageCoercionImports = collectStorageCoercionImports(nodeMap, kindEntries);
		const usesAttachProps = [...nodeMap.nodes.values()].some(
			(node) =>
				classifyFactoryEmission(node.kind, node, { nodeMap, kindEntries, inlineKinds, synthesizedKinds }) === 'emit' &&
				namespaceOf(node, nodeMap, kindEntries).entries.length > 0
		);
		const refineKindInfos = collectRefineKindInfos(nodeMap) ?? [];
		const utilImports = ['AnyNodeData', 'ByteRange', 'Edit', 'FluentNode'];
		if (usesNonEmptyArray) utilImports.push('NonEmptyArray');
		// resolveConfigType() emits `ConfigOf<T.X>` (rather than `T.X.Config`)
		// for every refine-form kind's config parameter — import it whenever
		// at least one such kind exists.
		if (refineKindInfos.length > 0) utilImports.push('ConfigOf');
		lines.push(`import type { ${utilImports.sort().join(', ')} } from '@sittir/types';`);
		lines.push(
			`import { ${['withMethods', 'withAccessors', 'methodsEngine', ...storageCoercionImports, ...(usesAttachProps ? ['attachProps'] : [])].join(', ')} } from './utils.js';`
		);
		lines.push('');
		lines.push(...emitFluentSetterHelpers());
		const triviaParamType = buildTriviaParamType(resolveTriviaTypeNames(triviaKinds ?? [], nodeMap), 'T.');
		lines.push(
			'/** The render/edit method surface withMethods attaches — the shared tail',
			" *  of every factory's explicit return type (the per-kind `*Built` aliases",
			' *  below). Explicit named return types keep declaration emit finite: the',
			' *  recursive `$with` setter closures otherwise blow the serializer',
			" *  (TS7056) and the package can't publish types. The `$trivia` argument",
			' *  union is derived from the grammar trivia roles — the same derivation',
			" *  behind utils.ts' withMethods signature — so this alias tail and the",
			' *  runtime surface never diverge. */',
			'type _NodeMethods = {',
			'  $render(): string;',
			'  $toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;',
			'  $replace(target: { range(): ByteRange }): Edit;',
			`  $trivia(...args: ${triviaParamType}[]): AnyNodeData;`,
			'};',
			''
		);
		lines.push(...emitNonEmptyAssertHelper());
		lines.push('');

		const leafReConsts = buildLeafReConsts(nodeMap, lines);
		if (leafReConsts.size > 0) lines.push('');

		const aliasSourceKinds = collectAliasSourceKinds(nodeMap);
		const refineByKind = new Map<string, RefineKindInfo>();
		for (const info of refineKindInfos) {
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

	emitGroup(node: Extract<AssembledNode, { modelType: 'group' }>): void {
		factory.group(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitSeparatedList(node: AssembledSeparatedList): void {
		factory.separatedList(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitRefineForms(kind: string, node: AssembledNode): void {
		const refineInfo = this.#refineByKind.get(kind);
		if (!refineInfo) return;
		for (const form of refineInfo.forms) {
			const formSource = emitRefineFormFactory(node, form, refineInfo, this.#nodeMap, this.#kindEntries);
			if (formSource === undefined) continue;
			this.#output.push(formSource);
		}
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
			case 'group':
				this.emitGroup(node);
				break;
			case 'separatedList':
				this.emitSeparatedList(node);
				break;
			default:
				break;
		}
		if (this.#output.length === prevLen) return;
		this.emitRefineForms(kind, node);
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
