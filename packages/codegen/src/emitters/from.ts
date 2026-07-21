/**
 * Emits from.ts — consumes NodeMap directly.
 *
 * Owns ALL `from()` resolver string generation. Rule.ts exposes the
 * IR; this file dispatches on `node.modelType` and emits the per-kind
 * resolver bodies plus the module-scoped helpers (_resolveOne,
 * _resolveMany, _resolveLeafString, _resolveByKind, _resolveScalar).
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	kindDiscriminantExpr,
	kindDiscriminantExprForId,
	hasCatalogEntry,
	findKindEntry,
	type KindEnumEntry
} from './kind-discriminant.ts';
import type { AssembledNode, AssembledNonterminal, AssembledSeparatedList } from '../compiler/model/node-map.ts';

type BranchLikeForFrom = Extract<AssembledNode, { modelType: 'branch' }>;
import {
	isAutoStampField,
	isRequired,
	isMultiple,
	isNonEmpty,
	slotKindNames,
	keywordPresenceKind,
	resolveSingleFieldFactorySlot,
	resolveFieldStorageInfo,
	stampExpressionFor,
	isHiddenInfraSlot,
	type BranchSlotClass,
	classifyFactoryShape,
	classifyChildFactorySurface,
	classifyFromEmission,
	unnamedChildSlotFacts,
	canonicalSeparatedListField
} from './shared.ts';
import { fieldElementType, childElementType, kindEnumTextMapExpr } from './factories.ts';
import { buildSeparatedListContentSlot, collectSeparatorCandidateKindNames } from './wrap.ts';
import { isNodeRef, isTerminalValue, storageKindIdByNameOf, storageKindOfRef } from '../compiler/model/node-map.ts';
import type { NodeOrTerminal } from '../compiler/model/node-map.ts';
import type { CodegenEmitter } from './emitter.ts';

const SAFE_IDENT_KEY = /^[A-Za-z_$][\w$]*$/;

export interface EmitFromConfig {
	grammar: string;
	nodeMap: NodeMap;
	/**
	 * Parser-symbol ID tables for numeric $type comparison emission.
	 * When present, from.ts emits `input.$type === TSKindId.X` checks.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
	generatedIdTables?: GeneratedIdTables;
	kindEntries?: readonly KindEnumEntry[];
}

// ---------------------------------------------------------------------------
// Dedup helpers
// ---------------------------------------------------------------------------

/**
 * Builds a reverse-lookup map from a sorted subtype key to the named
 * supertype constant identifier for dedup.
 *
 * @remarks
 * Each unique resolver kind list gets a single module-scoped constant
 * declaration; resolver call sites reference that constant instead of
 * repeating the literal array inline. Supertypes get *named* constants
 * (`_super_expression`) — when a field's content exactly matches a
 * supertype's subtype set we reuse the supertype's name as the dedup
 * identifier, making the generated code readable and aligning the physical
 * constant with the grammar's own supertype declarations. Any other list
 * falls through to numbered `_K0`, `_K1`, …
 *
 * Reverse lookup: sorted-subtypes key → supertype constant name.
 * First occurrence wins — two supertypes sharing an exact subtype set is
 * rare and the first name is as good as any.
 *
 * @param nodeMap - The assembled node map containing supertype entries.
 * @returns A map from sorted-subtypes key string to `_super_<name>` identifier.
 */
function buildSupertypeByKey(nodeMap: NodeMap): Map<string, string> {
	const supertypeByKey = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		if (node.subtypes.length === 0) continue;
		const key = [...node.subtypes].sort().join('\n');
		if (!supertypeByKey.has(key)) {
			const safe = kind.replace(/^_+/, '').replace(/[^\w]/g, '_');
			supertypeByKey.set(key, `_super_${safe}`);
		}
	}
	return supertypeByKey;
}

/**
 * Creates a kind-list interner that deduplicates resolver kind arrays
 * into module-scoped constants.
 *
 * @remarks
 * Looks up by sorted supertype signature first — gives readable names for
 * the common case. Otherwise falls back to numbered dedup (`_K0`, `_K1`, …).
 *
 * @param supertypeByKey - Reverse lookup built by {@link buildSupertypeByKey}.
 * @param kindTableIndex - Mutable map from JSON-serialized kind list to index.
 * @param kindTableLiterals - Mutable array of JSON kind-list literals.
 * @param namedEntries - Mutable map from supertype constant name to JSON literal.
 * @returns An interner function that maps a kind list to its constant identifier.
 */
function buildKindInterner(
	supertypeByKey: Map<string, string>,
	kindTableIndex: Map<string, number>,
	kindTableLiterals: string[],
	namedEntries: Map<string, string>
): KindInterner {
	return (kinds: readonly string[]): string => {
		const superKey = [...kinds].sort().join('\n');
		const superName = supertypeByKey.get(superKey);
		if (superName !== undefined) {
			if (!namedEntries.has(superName)) {
				namedEntries.set(superName, JSON.stringify(kinds));
			}
			return superName;
		}
		const key = JSON.stringify(kinds);
		let idx = kindTableIndex.get(key);
		if (idx === undefined) {
			idx = kindTableLiterals.length;
			kindTableIndex.set(key, idx);
			kindTableLiterals.push(key);
		}
		return `_K${idx}`;
	};
}

// ---------------------------------------------------------------------------
// Emission helpers for the from.ts header block
// ---------------------------------------------------------------------------

/**
 * Emits the namespace import lines into the generated from.ts header.
 *
 * @remarks
 * Factories are accessed via `F.<name>`; types via
 * `T.<Kind>.Config` / `.Loose` / `.Fluent`. Collapsing to a namespace
 * import eliminates the per-factory import wall (~3kB in rust) to a
 * single line.
 *
 * @param lines - Output lines array to push into.
 */
function emitNamespaceImports(lines: string[], kindEntries: readonly KindEnumEntry[] | undefined): void {
	lines.push(`import * as F from './factories.js';`);
	lines.push(`import type * as T from './types.js';`);
	if (kindEntries) {
		lines.push(`import { TSKindId, kindIdFromName } from './types.js';`);
	} else {
		lines.push(`import { kindIdFromName } from './types.js';`);
	}
	lines.push("import type { AnyNodeData } from '@sittir/types';");
	lines.push("import { coerceKindEnumStorage, isNodeData } from './utils.js';");
	lines.push('');
}

/**
 * Emits the `_FromFieldInput` closed union type declaration into generated
 * from.ts, capturing every shape a loose-from() field value can hold.
 *
 * @remarks
 * Every loose-from() caller can hand us:
 *   - a fully-built NodeData     (passthrough path)
 *   - a primitive                (leaf-factory dispatch)
 *   - a { kind, ...rest } object (kind-tagged dispatch)
 *   - an array of any of above   (multi-field slot)
 *   - undefined / null           (absent optional field)
 *
 * `_FromFieldInput` is intentionally `unknown`. Generated field resolver
 * helpers immediately narrow with runtime guards (`typeof`, `Array.isArray`,
 * `isNodeData`, `'kind' in value`), and keeping the alias closed causes
 * recursive assignability failures once strict Config surfaces expose large
 * concrete node unions.
 *
 * @param lines - Output lines array to push into.
 */
function emitFromFieldInputType(lines: string[]): void {
	lines.push('/** Runtime-narrowed field input bag for generated from() helpers. */');
	lines.push('type _FromFieldInput = unknown;');
	lines.push('');
}

/**
 * Emits the `_fromMap` runtime dispatch table and `_FromMap` type alias into
 * generated from.ts.
 *
 * @remarks
 * Same pattern as `_factoryMap` in factories.ts: declared as a plain `as const`
 * object so every entry's type is inferred from the per-kind `fromX` signature.
 * `_FromMap = typeof _fromMap` gives consumers the precise per-slot type without
 * duplicating the kind→function mapping.
 *
 * Declared BEFORE the resolver helpers so `_resolveByKind<K>` can reference
 * `_FromMap[K]` / `_fromMap[kind]` in its signature — the per-kind function
 * declarations it points at are hoisted at both the TS type level and the
 * runtime level, so forward references across the per-node blocks below
 * resolve cleanly.
 *
 * @param lines - Output lines array to push into.
 * @param nodeMap - The assembled node map.
 */
function emitFromMapDeclaration(
	lines: string[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	lines.push('export const _fromMap = {');
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_')) continue;
		if (!node.factoryName) continue;
		if (node.modelType === 'token' || node.modelType === 'supertype' || node.modelType === 'group') continue;
		if (!node.fromFunctionName) continue;
		// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
		// never appear at runtime; no from() was emitted for them.
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		lines.push(`  ${JSON.stringify(kind)}: ${node.fromFunctionName},`);
	}
	lines.push('} as const;');
	lines.push('export type _FromMap = typeof _fromMap;');
	lines.push('');
}

/**
 * Emits the interned resolver kind-list constants (dedup table) before
 * the per-node blocks, ensuring every `_KN` / `_super_X` identifier is
 * declared by the time it is referenced.
 *
 * @param lines - Output lines array to push into.
 * @param namedEntries - Map from supertype constant name to JSON literal.
 * @param kindTableLiterals - Array of numbered JSON kind-list literals.
 */
function emitInternedKindTable(lines: string[], namedEntries: Map<string, string>, kindTableLiterals: string[]): void {
	if (kindTableLiterals.length > 0 || namedEntries.size > 0) {
		lines.push('// Interned resolver kind lists (dedup)');
		for (const [name, literal] of namedEntries) {
			lines.push(`const ${name}: readonly string[] = ${literal};`);
		}
		for (let i = 0; i < kindTableLiterals.length; i++) {
			lines.push(`const _K${i}: readonly string[] = ${kindTableLiterals[i]};`);
		}
		lines.push('');
	}
}

// ---------------------------------------------------------------------------
// Namespace — taxonomy-keyed from() dispatch API
// ---------------------------------------------------------------------------

/**
 * Taxonomy-keyed from() dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
export namespace from {
	/**
	 * Emit a leaf from() resolver — string-like (pattern, enum) or keyword.
	 */
	export function leaf(output: string[], node: AssembledNode): void {
		if (!node.rawFactoryName || !node.fromFunctionName) return;
		let result: string | undefined;
		switch (node.modelType) {
			case 'pattern':
				result = emitStringLikeFrom(node);
				break;
			case 'enum':
				result = emitStringLikeFrom({
					typeName: node.typeName,
					rawFactoryName: node.rawFactoryName,
					fromFunctionName: node.fromFunctionName,
					enumValues: node.values
				});
				break;
			case 'keyword':
				result = emitKeywordFrom(node);
				break;
			default:
				break;
		}
		if (result) output.push(result);
	}

	/**
	 * Emit a branch from() resolver — container shape, text-template,
	 * or regular field-carrying branch.
	 */
	export function branch(
		output: string[],
		node: BranchLikeForFrom,
		nodeMap: NodeMap,
		intern: KindInterner,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(emitBranchFrom(node, nodeMap, intern, kindEntries));
	}

	/**
	 * Emit a `'separatedList'` from() resolver — dedicated construct/
	 * reconstruction surface, see `emitSeparatedListFrom`'s doc comment.
	 */
	export function separatedList(
		output: string[],
		node: AssembledSeparatedList,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		const result = emitSeparatedListFrom(node, kindEntries, nodeMap);
		if (result) output.push(result);
	}
}

// ---------------------------------------------------------------------------
// Branch from() — loose input, field-level resolution
// ---------------------------------------------------------------------------

interface BranchLikeNode {
	readonly kind: string;
	// TEMPORARY: 'separatedList' widened in alongside 'branch'/'group' — see
	// isSlotBearingCompound's doc comment (shared.ts).
	readonly modelType: 'branch' | 'group' | 'separatedList';
	readonly typeName: string;
	readonly fromInputTypeName: string;
	readonly rawFactoryName?: string;
	readonly fromFunctionName?: string;
	readonly fields: readonly AssembledNonterminal[];
	readonly slotClass?: BranchSlotClass;
}

/**
 * Builds the input signature parts for a branch from() function.
 * Return type is omitted — TS infers it from the body.
 */
function buildBranchSignatureParts(
	node: BranchLikeNode,
	_factory: string,
	opt: string
): { inputType: string; inputOptional: boolean } {
	const inputType = `T.${node.typeName}.Loose`;
	const inputOptional = opt === '?';
	return { inputType, inputOptional };
}

function factoryReturnTypeExpr(factory: string): string {
	return `ReturnType<typeof ${factory}>`;
}

function emitBranchNodeDataPassthrough(lines: string[], inputOptional: boolean, returnType: string): void {
	const passGuard = inputOptional ? 'input !== undefined && ' : '';
	lines.push(`  if (${passGuard}isNodeData(input)) return input as unknown as ${returnType};`);
}

/**
 * Returns the target factory name when a required field can default to an
 * empty factory call, or `null` when it cannot.
 *
 * A field qualifies for default-empty when:
 * 1. `isRequired(field)` is true.
 * 2. Its `values` resolve to exactly ONE kind (not a union).
 * 3. That kind's factory can be called with zero arguments:
 *    - Container shape with rest-params (multiple children) — always callable.
 *    - Container shape with optional singular child — callable.
 *    - Config-based factory where every non-auto-stamp field is optional and
 *      every non-auto-stamp child is either auto-stamp-eligible or repeat-0+.
 *
 * @param field - The field slot to check.
 * @param nodeMap - The assembled node map.
 * @returns The target factory's `rawFactoryName` if it qualifies, or `null`.
 */
function canDefaultToEmpty(field: AssembledNonterminal, nodeMap: NodeMap): string | null {
	if (!isRequired(field)) return null;
	if (isHiddenInfraSlot(field, nodeMap)) return null;
	const kinds = slotKindNames(field);
	if (kinds.length !== 1) return null;
	const targetKind = kinds[0]!;
	const targetNode = nodeMap.nodes.get(targetKind);
	if (!targetNode) return null;
	if (!targetNode.rawFactoryName) return null;

	// 'separatedList' is EXCLUDED here (unlike 'branch') — its Task-6 factory
	// signature always requires an `elements` argument (never a zero-arg
	// `F.x()` call, even for a plain `repeat` whose elements COULD be an
	// empty array — the array itself is still a mandatory argument, not a
	// default). `instanceof AssembledBranch` can't recognize
	// AssembledSeparatedList, so narrow on modelType instead.
	const branchTarget = targetNode.modelType === 'branch' ? targetNode : null;
	const childSurface = branchTarget !== null ? classifyChildFactorySurface(branchTarget, nodeMap) : null;
	if (childSurface === 'direct' || childSurface === 'spread') {
		if (branchTarget === null) return null;
		const facts = unnamedChildSlotFacts(branchTarget.fields);
		if (!facts) return null;
		// Rest params (`...children`) always accept zero args. A singular
		// positional `child` is safe only when it's itself optional.
		if (facts.multiple || !facts.required) return targetNode.rawFactoryName;
		return null;
	}

	// Branch / group with fields: check if the factory config is all-optional.
	// 'separatedList' excluded — see this function's doc comment above.
	if (targetNode.modelType !== 'branch' && targetNode.modelType !== 'group') {
		return null;
	}
	const targetFields = targetNode.fields;
	const hasBlockingField = targetFields.some((f) => isRequired(f) && stampExpressionFor(f, nodeMap) === undefined);
	if (hasBlockingField) return null;
	return targetNode.rawFactoryName;
}

/**
 * Emit a branch from() resolver — dispatches to the container calling
 * convention (positional element args) when `classifyChildFactorySurface`
 * recognizes an unnamed child slot, otherwise falls through to the regular
 * field-carrying Loose-input resolution below. Single entry point so
 * `branch()`'s dispatcher doesn't have to know about the two shapes.
 */
function emitBranchFrom(
	node: BranchLikeForFrom,
	nodeMap: NodeMap,
	intern: KindInterner,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (classifyChildFactorySurface(node, nodeMap) !== null) {
		return emitContainerFrom(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				fromFunctionName: node.fromFunctionName,
				fields: node.fields
			},
			kindEntries,
			nodeMap
		);
	}

	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	const fields = node.fields;
	// Auto-stamp fields are always `required` but they have no slot in Config —
	// exclude them from the optionality check so the input `?` marker is correct.
	const nonStampFields = fields.filter((f) => !isAutoStampField(f, nodeMap));
	const opt = nonStampFields.some((f) => isRequired(f)) ? '' : '?';
	const typeName = node.typeName;
	const lines: string[] = [];
	const { inputType, inputOptional } = buildBranchSignatureParts(node, factory, opt);
	const returnType = factoryReturnTypeExpr(factory);
	const soleField = !nodeMap.polymorphFormKinds.has(node.kind)
		? resolveSingleFieldFactorySlot(node, nodeMap)
		: undefined;
	const canDirectFactoryCall =
		soleField &&
		classifyFactoryShape(node, nodeMap) === 'direct' &&
		!node.fields.some((field) => keywordPresenceKind(field, nodeMap) !== null);
	lines.push(`export function ${fn}(input${opt}: ${inputType}): ${returnType} {`);
	if (fields.length > 0) {
		if (canDirectFactoryCall) {
			lines.push(
				`  if (${inputOptional ? 'input !== undefined && ' : ''}isNodeData(input) && (input.$type as string | number) === ${containerTypeCheck(node.kind, kindEntries, nodeMap)}) return input as unknown as ${returnType};`
			);
		} else {
			emitBranchNodeDataPassthrough(lines, inputOptional, returnType);
		}
		const neName = (f: AssembledNonterminal) => `_ne_${f.propertyName}`;
		// Keyword-presence fields (boolean / bitflag) are NOT array-shaped on
		// the factory's Config surface — they're a `Bitflag<Const, T>` /
		// `BooleanKeyword<T>` brand. Skip the non-empty hoist for those even
		// when the underlying values are repeat1, otherwise we generate a
		// `_ne_X` array hoist + `_assertNonEmpty` call against a non-array.
		const needsNonEmptyHoist = (f: AssembledNonterminal): boolean =>
			isNonEmpty(f) && isMultiple(f) && keywordPresenceKind(f, nodeMap) === null;
		for (const f of fields) {
			if (isAutoStampField(f, nodeMap)) continue; // factory stamps these; no Config slot
			if (needsNonEmptyHoist(f)) {
				const call = resolveFieldFromTypedInput(f, nodeMap, typeName, intern, 'input', inputOptional, kindEntries);
				lines.push(`  const ${neName(f)} = ${call};`);
				lines.push(`  _assertNonEmpty(${neName(f)}, '${node.kind}.${f.propertyName}');`);
			}
		}
		// Gap 5: single-field factories take the value directly. Emit
		// `return F.label(resolved)` instead of `F.label({ identifier: resolved })`.
		// Uses pre-computed slotClass for the sole-slot reference.
		// Excluded: hidden kinds (inner polymorph children), keyword-presence,
		// and multiple (array) fields.
		if (canDirectFactoryCall) {
			const inputExpr = `(input !== null && typeof input === 'object' && !isNodeData(input) && ${JSON.stringify(soleField.configKey)} in input ? input.${soleField.configKey} : input)`;
			const call = resolveFieldCall(inputExpr, soleField, isMultiple(soleField), nodeMap, intern, true, undefined, kindEntries);
			// Gap A: sole-slot direct-call factories skip the Config object
			// literal entirely, so a required sole field needs its own guard.
			const guardedCall = isRequired(soleField)
				? `_requireField(${JSON.stringify(node.kind)}, ${JSON.stringify(soleField.configKey)}, ${call})`
				: call;
			lines.push(`  return ${factory}(${guardedCall});`);
		} else {
			lines.push(`  return ${factory}({`);
			for (const f of fields) {
				if (isAutoStampField(f, nodeMap)) continue; // factory stamps these; no Config slot
				if (needsNonEmptyHoist(f)) {
					lines.push(`    ${f.configKey}: ${neName(f)},`);
				} else {
					const call = resolveFieldFromTypedInput(f, nodeMap, typeName, intern, 'input', inputOptional, kindEntries);
					const defaultFactory = canDefaultToEmpty(f, nodeMap);
					if (defaultFactory) {
						lines.push(`    ${f.configKey}: ${call} ?? F.${defaultFactory}(),`);
					} else if (isRequired(f)) {
						// Gap A: a required field whose loose-input value didn't
						// resolve is otherwise silently `undefined` here.
						lines.push(
							`    ${f.configKey}: _requireField(${JSON.stringify(node.kind)}, ${JSON.stringify(f.configKey)}, ${call}),`
						);
					} else {
						lines.push(`    ${f.configKey}: ${call},`);
					}
				}
			}
			lines.push('  });');
		}
	} else {
		// No fields: pass-through to the factory with a boundary cast — the
		// Loose input shape is wider than the factory's strict Config, but the
		// structural overlap (children + leaf shape) is enough at runtime.
		emitBranchNodeDataPassthrough(lines, inputOptional, returnType);
		lines.push(`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`);
	}
	lines.push('}');
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Container from() — accepts element args OR a self NodeData
// ---------------------------------------------------------------------------

interface ContainerFromNode {
	readonly kind: string;
	readonly typeName: string;
	readonly rawFactoryName?: string;
	readonly fromFunctionName?: string;
	// Post-unification: the unnamed-child slot is exposed via `fields[0]`. Its
	// `storageName` drives the `_<name>` data key we read here.
	readonly fields?: readonly AssembledNonterminal[];
}

/**
 * Returns the runtime expression used to compare `.$type` in container
 * from() guards.
 *
 * @remarks
 * When `kindEntries` is present (KindID pipeline), emits `TSKindId.X` — a
 * numeric discriminant. When absent (legacy / unit-test path), falls back
 * to `'<kind>'` string literal so callers without real grammar ID tables
 * continue to compile.
 *
 * @param kind - The grammar kind string.
 * @param kindEntries - Collected kind-enum entries, or `undefined` for fallback.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @returns An expression string suitable for `input.$type === <expr>`.
 */
function containerTypeCheck(kind: string, kindEntries: readonly KindEnumEntry[] | undefined, nodeMap: NodeMap): string {
	if (!kindEntries) return `'${kind}'`;
	if (!hasCatalogEntry(kindEntries, kind)) return `'${kind}'`;
	return kindDiscriminantExpr(kind, nodeMap, kindEntries);
}

/**
 * Shared body for a rest-param (`...input`) from() resolver that reconstructs
 * either from a flat list of already-resolved elements or by unwrapping an
 * existing self-NodeData value's storage. Both `emitRepeatedContainerFrom`
 * (container-shape branches — spreads the resolved elements into the
 * factory's `(...children: T[])` rest param) and `emitSeparatedListFrom`
 * (`'separatedList'` kinds — passes the resolved elements as the single
 * `elements: T[] | NonEmptyArray<T>` array argument, Task 6) share this exact
 * three-shape structure (numeric-discriminant gate, self-NodeData unwrap,
 * fresh-input fallback); they differ ONLY in how the final call expression is
 * built from a resolved variable name, which `buildCallExpr` parameterizes.
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-NodeData check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @param storageKey - The wire storage key to unwrap on the self-NodeData path.
 * @param buildCallExpr - Builds the final `factory(...)` call expression from
 *   a resolved variable name (`'input'` or `'children'`) — spread-via-unknown
 *   for container-shape factories, direct array cast for `'separatedList'`.
 * @param childrenTypeAnnotation - Optional explicit type annotation for the
 *   self-NodeData-unwrap `children` local (e.g. `': readonly unknown[]'`) —
 *   `emitSeparatedListFrom` needs this so its direct (non-`unknown`-laundered)
 *   cast type-checks; the local's inferred type otherwise widens to `any[]`
 *   via the `Array.isArray` ternary, which a direct cast rejects even though
 *   the runtime value is the same. `emitRepeatedContainerFrom` doesn't need
 *   it since its cast still routes through `unknown` first.
 * @returns The emitted function source string.
 */
function emitRestParamFromResolver(
	fn: string,
	factory: string,
	tName: string,
	elementType: string,
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	storageKey: string,
	// `isSelfUnwrap` distinguishes the two call sites below: `true` inside
	// the self-NodeData-unwrap branch (a `data` local naming the original
	// wrapped node is in scope, so a caller like `emitSeparatedListFrom` can
	// read per-instance facts off it — e.g. preserving `_separator_kind`/
	// `_leading_sep`/`_trailing_sep` when reconstructing an already-wrapped
	// separatedList node); `false` for the fresh-input path, where no such
	// source node exists to read facts from.
	buildCallExpr: (varExpr: string, isSelfUnwrap: boolean) => string,
	childrenTypeAnnotation = ''
): string {
	const typeCheck = containerTypeCheck(kind, kindEntries, nodeMap);
	// TSGrammar-only kinds (string $type) can't satisfy isNodeData() (which
	// requires numeric $type). Skip the node-data pass-through guard entirely
	// — the check would always be false at runtime anyway.
	const hasNumericDiscriminant = kindEntries?.some((e) => e.kind === kind) ?? false;
	if (!hasNumericDiscriminant) {
		return [
			`export function ${fn}(...input: readonly (${elementType} | ${tName})[]): ${factoryReturnTypeExpr(factory)} {`,
			`  return ${buildCallExpr('input', false)};`,
			'}'
		].join('\n');
	}
	// The accepted-input union allows callers to hand back an existing
	// <kind> NodeData OR a flat list of element children. The single-arg
	// self-NodeData path unwraps the storage key; otherwise every item must
	// already be an element. The storage value is typed as singular-or-array
	// on the loose `AnyNodeData` shape; normalize to an array before the
	// boundary cast.
	const storageAccess = SAFE_IDENT_KEY.test(storageKey)
		? `(data as unknown as { ${storageKey}?: unknown }).${storageKey}`
		: `(data as unknown as Record<string, unknown>)[${JSON.stringify(storageKey)}]`;
	return [
		`export function ${fn}(...input: readonly (${elementType} | ${tName})[]): ${factoryReturnTypeExpr(factory)} {`,
		`  if (input.length === 1 && isNodeData(input[0]) && input[0].$type === ${typeCheck}) {`,
		`    const data = input[0];`,
		`    const stored = ${storageAccess};`,
		`    const children${childrenTypeAnnotation} = stored === undefined ? [] : Array.isArray(stored) ? stored : [stored];`,
		`    return ${buildCallExpr('children', true)};`,
		`  }`,
		`  return ${buildCallExpr('input', false)};`,
		'}'
	].join('\n');
}

/**
 * Emits the repeated-children variant of a container from() function, using
 * rest-parameter spread syntax.
 *
 * @remarks
 * Singular-child containers take one positional arg (`child?: T`); repeated-
 * child containers take `...children: T[]`. The from function has to match
 * the factory's signature at the call sites it forwards to.
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-NodeData check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @returns The emitted function source string.
 */
function emitRepeatedContainerFrom(
	fn: string,
	factory: string,
	tName: string,
	elementType: string,
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	storageKey: string
): string {
	// as unknown as Parameters<>: elementType/children may include separator
	// literals (e.g. ",") the factory doesn't accept directly as a spread
	// element. Route through unknown.
	return emitRestParamFromResolver(
		fn,
		factory,
		tName,
		elementType,
		kind,
		kindEntries,
		nodeMap,
		storageKey,
		(varExpr) => `${factory}(...(${varExpr} as unknown as Parameters<typeof ${factory}>))`
	);
}

/**
 * Emits the singular-child variant of a container from() function.
 *
 * @remarks
 * Casts the extracted single child all the way to the element type — the
 * container factory requires a non-nullable element when the grammar says
 * the child is required, and we can't express "indexed access on a non-null
 * tuple" through ConfigOf without pushing casts downstream.
 *
 * Empty collections (e.g. python `()` / `[]`) have no named children —
 * readNode promotes `(` / `)` / `[` / `]` into fields and produces no
 * `children`. Calling `factory(undefined)` rebuilds the empty form;
 * indexing `children[0]` in that case throws "Cannot read properties of
 * undefined (reading '0')".
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-NodeData check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @returns The emitted function source string.
 */
function emitSingularContainerFrom(
	fn: string,
	factory: string,
	tName: string,
	elementType: string,
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	storageKey: string
): string {
	// The factory's child parameter inferred type may be required or optional
	// depending on grammar shape. Cast at the boundary funnels both shapes
	// through one assertion so the emitter doesn't have to track which form
	// each kind maps to. Runtime behaviour: required factories will throw
	// on `undefined`, matching the unwrap path's "missing children" diagnostic.
	const typeCheck = containerTypeCheck(kind, kindEntries, nodeMap);
	// TSGrammar-only kinds (string $type) can't satisfy isNodeData() (which
	// requires numeric $type). Skip the node-data pass-through guard entirely
	// — the check would always be false at runtime anyway.
	const hasNumericDiscriminant = kindEntries?.some((e) => e.kind === kind) ?? false;
	if (!hasNumericDiscriminant) {
		return [
			`export function ${fn}(input?: ${elementType} | ${tName}): ${factoryReturnTypeExpr(factory)} {`,
			`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
			'}'
		].join('\n');
	}
	const storageAccess = SAFE_IDENT_KEY.test(storageKey)
		? `(data as unknown as { ${storageKey}?: unknown }).${storageKey}`
		: `(data as unknown as Record<string, unknown>)[${JSON.stringify(storageKey)}]`;
	return [
		`export function ${fn}(input?: ${elementType} | ${tName}): ${factoryReturnTypeExpr(factory)} {`,
		`  if (isNodeData(input) && input.$type === ${typeCheck}) {`,
		`    const data = input;`,
		`    const child = ${storageAccess};`,
		`    return ${factory}(child as Parameters<typeof ${factory}>[0]);`,
		`  }`,
		// Post-guard `input` is necessarily an `${elementType}` (the self-
		// NodeData branch is the only path the union's `${tName}` arm
		// could reach this function through). Narrow at the boundary.
		`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
		'}'
	].join('\n');
}

function emitContainerFrom(
	node: ContainerFromNode,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string {
	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	const tName = `T.${node.typeName}`;
	// Post-unification: the unnamed slot lives in `node.fields[0]` with a
	// kind-derived `storageName`. The interface declares `_<storageName>` per
	// slot (no `$other`), so the element type is the slot's element type and
	// the data read is `data._<storageName>`.
	const facts = unnamedChildSlotFacts(node.fields ?? []);
	const elementType = facts
		? childElementType({ children: node.fields ?? [] }, nodeMap)
		: `NonNullable<T.${node.typeName}['$other']> extends readonly [infer E] ? E : NonNullable<T.${node.typeName}['$other']>`;
	const storageKey = facts ? facts.slot.storageKey : '$other';
	if (facts?.multiple) {
		return emitRepeatedContainerFrom(fn, factory, tName, elementType, node.kind, kindEntries, nodeMap, storageKey);
	}
	return emitSingularContainerFrom(fn, factory, tName, elementType, node.kind, kindEntries, nodeMap, storageKey);
}

/**
 * Emit a `'separatedList'` from() resolver — dedicated construct/
 * reconstruction surface built directly from `AssembledSeparatedList`'s own
 * real fields, bypassing the Task-2 `_slots` stub entirely (see
 * `AssembledSeparatedList`'s doc comment, node-map.ts, and
 * `emitSeparatedListFactory`'s doc comment, factories.ts).
 *
 * Shares `emitRestParamFromResolver`'s three-shape structure with
 * `emitRepeatedContainerFrom` (see that function's doc comment for the
 * shared shape), with ONE deliberate difference in the call expression: the
 * resolved elements are passed to the factory as the `elements` ARRAY
 * argument directly (`factory(children as Parameters<typeof
 * factory>[0])`), never spread and never indexed — factories.ts's Task 6
 * signature is `factory(elements: T[] | NonEmptyArray<T>, options?: {...})`,
 * not the old `factory(...children: T[])` `emitRepeatedContainerFrom`
 * assumes. Before this function existed, `classifyChildFactorySurface`'s
 * stub-based 'spread'/'direct' classification routed `'separatedList'`
 * kinds through the SAME spread/index call shape `emitRepeatedContainerFrom`
 * still uses for real container-shape branches — which silently bound
 * `children[0]` to `elements` and `children[1]` to `options` instead of the
 * whole array once the Task 6 factory signature landed (found in
 * spec-compliance review of Task 6, confirmed via code reading:
 * `_assertNonEmpty` is a no-op outside `SITTIR_DEBUG`, so the mis-binding
 * compiled and ran silently rather than throwing).
 *
 * Deliberately NOT `as unknown as Parameters<...>` (the cast pattern that
 * let the original bug hide from tsgo undetected) — empirically confirmed
 * (`tsgo` against a scratch repro) that a DIRECT cast from a `readonly`
 * array type to the tuple-shaped `NonEmptyArray<T>` target IS accepted as
 * "sufficiently overlapping" (tsgo TS2352's own comparability rule), for
 * both the rest-param `input` (already `readonly (...)[]`-typed) and the
 * self-NodeData-unwrap `children` local, PROVIDED that local carries an
 * explicit `readonly unknown[]` annotation — its inferred type otherwise
 * widens to `any[]` (via the `Array.isArray` ternary), which tsgo does
 * reject directly. A narrower cast means a genuinely wrong shape at one of
 * these two remaining opaque-`unknown`-origin sites (the self-NodeData
 * unwrap's `stored` read, and `_wrapWithChildren`'s own `children` param)
 * would now surface as a real tsgo error instead of silently laundering
 * through `unknown`, closing the exact gap that let this bug ship
 * undetected the first time.
 *
 * `options` is omitted on the fresh-input path (no source node exists there
 * to read per-instance facts from — the factory's own defaults apply, same
 * as before this fix). On the self-NodeData-unwrap path, `options` IS built
 * from the original wrapped node's own `_separator_kind`/`_leading_sep`/
 * `_trailing_sep` — calling `from()` on an already-wrapped separatedList
 * node used to silently reconstruct it with the factory's DEFAULTS (comma,
 * no flanks) regardless of what the original instance actually was, e.g.
 * `objectTypeContentFrom()` on a wrapped semicolon-delimited node would
 * change its rendered syntax back to a comma. Gated identically to
 * `emitSeparatedListFactory`'s own options surface (`node.separatorRule !==
 * undefined` / `leadingMode === 'optional'` / `trailingMode === 'optional'`)
 * so only fields the factory actually accepts get passed. `separatorKind`
 * needs a NUMBER→NAME reverse lookup since the wire stores a KindId but the
 * factory's `options.separatorKind` takes one of the candidate NAME
 * strings — built the same way `emitSeparatedListFactory`'s forward
 * (name→id) lookup is, just with the object literal's key/value swapped.
 */
function emitSeparatedListFrom(
	node: AssembledSeparatedList,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string | undefined {
	if (!node.rawFactoryName || !node.fromFunctionName) return undefined;
	const fn = node.fromFunctionName;
	const factory = `F.${node.rawFactoryName}`;
	const tName = `T.${node.typeName}`;
	const contentSlot = buildSeparatedListContentSlot(node);
	const elemType = fieldElementType(contentSlot, nodeMap);
	// Same single-field-storage rule as `emitSeparatedListFactory`
	// (factories.ts): the self-NodeData-unwrap path must read the SAME wire
	// storage key the factory actually wrote. Multi-field kinds keep the
	// generic `_content` bucket (see factories.ts's doc comment).
	const contentStorageKey = node.fields.length > 1 ? '_content' : canonicalSeparatedListField(node).storageKey;

	// Mirrors emitSeparatedListFactory's own gating exactly (see that
	// function's doc comment, factories.ts) — kept consistent across
	// capture/render/construct/reconstruct rather than diverging.
	const hasSeparatorKindOption = node.separatorRule !== undefined;
	const candidateKindNames = hasSeparatorKindOption
		? collectSeparatorCandidateKindNames(node.separatorRule!).filter((k) => hasCatalogEntry(kindEntries, k))
		: [];
	const hasLeadingOption = node.leadingMode === 'optional';
	const hasTrailingOption = node.trailingMode === 'optional';
	const hasOptions = hasSeparatorKindOption || hasLeadingOption || hasTrailingOption;

	const buildOptionsPreservingCall = (varExpr: string): string => {
		// `data`'s ambient type has no arbitrary storage keys (same reason
		// `storageAccess` above needs its own `unknown` cast) — read the
		// three per-instance fields through one shared cast rather than
		// three separate ones.
		const sourceFields =
			'(data as unknown as { _separator_kind?: number; _leading_sep?: boolean; _trailing_sep?: boolean })';
		const optionParts: string[] = [];
		if (candidateKindNames.length > 0) {
			const reverseArms = candidateKindNames
				.map((k) => `[${kindDiscriminantExpr(k, nodeMap, kindEntries)}]: ${JSON.stringify(k)}`)
				.join(', ');
			// IIFE (not a bare ternary) so the `_separator_kind` read is
			// narrowed by a single `const`, not two independent casts — a
			// ternary re-reading the cast expression twice can't correlate
			// the `undefined` check with the second read, tripping tsgo's
			// "undefined can't be used as an index type" (TS2538).
			optionParts.push(
				`separatorKind: (() => { const sk = ${sourceFields}._separator_kind; return sk === undefined ? undefined : ({ ${reverseArms} } as Record<number, string>)[sk]; })()`
			);
		}
		if (hasLeadingOption) optionParts.push(`leading: ${sourceFields}._leading_sep`);
		if (hasTrailingOption) optionParts.push(`trailing: ${sourceFields}._trailing_sep`);
		return `${factory}(${varExpr} as Parameters<typeof ${factory}>[0], { ${optionParts.join(', ')} } as Parameters<typeof ${factory}>[1])`;
	};

	return emitRestParamFromResolver(
		fn,
		factory,
		tName,
		elemType,
		node.kind,
		kindEntries,
		nodeMap,
		contentStorageKey,
		(varExpr, isSelfUnwrap) =>
			isSelfUnwrap && hasOptions
				? buildOptionsPreservingCall(varExpr)
				: `${factory}(${varExpr} as Parameters<typeof ${factory}>[0])`,
		': readonly unknown[]'
	);
}

// ---------------------------------------------------------------------------
// Leaf / enum from() — `string | NodeData` passthrough
// ---------------------------------------------------------------------------

interface LeafFromNode {
	readonly typeName: string;
	readonly rawFactoryName?: string;
	readonly fromFunctionName?: string;
	/** Enum value list when the underlying node is an enum. */
	readonly enumValues?: readonly string[];
}

function emitStringLikeFrom(node: LeafFromNode): string {
	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	return [
		`export function ${fn}(input: string | T.${node.typeName}): ${factoryReturnTypeExpr(factory)} {`,
		// `isNodeData` does not negative-narrow `Terminal<K, V>` out of the
		// input union (TS structural-Exclude limitation), so the
		// `typeof === 'string'` test is what funnels the post-guard branch
		// to the factory's `string` parameter.
		`  if (typeof input !== 'string') return input as unknown as ${factoryReturnTypeExpr(factory)};`,
		// Enum-leaf factories declare a narrow string-literal union for
		// their text parameter; the from() entry point accepts arbitrary
		// strings and the factory's runtime guard catches invalid values.
		// Cast at the boundary funnels the `string` to the narrow shape.
		`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
		'}'
	].join('\n');
}

// ---------------------------------------------------------------------------
// Keyword from() — NodeData passthrough or zero-arg factory
// ---------------------------------------------------------------------------

function emitKeywordFrom(node: LeafFromNode): string {
	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	return [
		`export function ${fn}(input?: T.${node.typeName}): ${factoryReturnTypeExpr(factory)} {`,
		`  if (isNodeData(input)) return input as unknown as ${factoryReturnTypeExpr(factory)};`,
		`  return ${factory}();`,
		'}'
	].join('\n');
}

// ---------------------------------------------------------------------------
// Field-level resolver call generation
// ---------------------------------------------------------------------------

/** Interner signature passed through the resolver emitter calls. */
type KindInterner = (kinds: readonly string[]) => string;

/**
 * Build a field-resolver call that reads a single camelCase property
 * directly off a typed FromInput bag (`input?.fieldName`). Typed
 * access flows the FromInput's per-field type into the resolver's
 * generic slot — no `_f` normalize, no index-signature widening. Used
 * by branch `fromX` bodies after the top-level kind discriminator has
 * already handed back any pre-built node.
 */
function resolveFieldFromTypedInput(
	field: AssembledNonterminal,
	nodeMap: NodeMap,
	parentTypeName: string,
	intern: KindInterner,
	sourceVar: string,
	inputOptional: boolean,
	kindEntries?: readonly KindEnumEntry[]
): string {
	// parentTypeName is retained for signature stability with callers;
	// the prior implementation used it to build an explicit
	// `<NonNullable<T.X.Config['y']>>` type arg on the resolver call. Those
	// type args were stripped in a follow-up to the from-cleanup pass —
	// TS now infers the slot type from parameters / call context.
	void parentTypeName;
	/**
	 * Single-access camelCase read on the bag
	 * branch. After the isNodeData identity quick-return at resolver entry,
	 * the resolver body runs only for loose-bag input, which carries the
	 * camelCase property directly. No cast — if the typed input union
	 * doesn't expose the camelCase property at this position that is a
	 * real type error, not something to paper over.
	 */
	const optChain = inputOptional ? '?' : '';
	const access = `${sourceVar}${optChain}.${field.configKey}`;
	return resolveFieldCall(access, field, isMultiple(field), nodeMap, intern, true, undefined, kindEntries);
}

/**
 * Expands supertype references in a field's content types to their concrete
 * subtypes, deduplicating the result.
 *
 * @remarks
 * A content entry whose kind is a supertype in the NodeMap expands to that
 * supertype's declared subtypes — the resolver works at the concrete kind
 * layer, so dispatching through a supertype literal would never match
 * anything. Expansion also lets the interner reach for the named `_super_<name>`
 * dedup entry since the interner keys on the full subtype set.
 *
 * Deduplication is applied after expansion: contentTypes may legitimately
 * contain a supertype AND one of its concrete subtypes (e.g. `_expression`
 * and `range_expression` can both appear on the same field), and the
 * expansion would otherwise surface the concrete kind twice.
 *
 * @param contentTypes - The raw content types from the field.
 * @param nodeMap - The assembled node map (used to look up supertype subtypes).
 * @returns Deduplicated list of concrete kind strings.
 */
function expandAndDedupeContentTypes(
	contentTypes: readonly string[],
	nodeMap: NodeMap,
	idByKind?: ReadonlyMap<string, number>
): string[] {
	const seen = new Set<string>();
	const expanded: string[] = [];
	const visit = (kind: string): void => {
		const node = nodeMap.nodes.get(kind);
		if (node?.modelType === 'supertype') {
			for (const subtype of node.subtypes) visit(subtype);
			return;
		}
		// PR-K3e: dedupe by the mint-stamped id where the slot's values carry
		// one — same-id kinds are one runtime identity even under different
		// names. Name key for stamp-less kinds (incl. supertype expansions).
		const id = idByKind?.get(kind);
		const key = id !== undefined ? `#${id}` : `n:${kind}`;
		if (seen.has(key)) return;
		seen.add(key);
		expanded.push(kind);
	};
	for (const t of contentTypes) visit(t);
	return expanded;
}

/**
 * Classifies a list of concrete kind strings into leaf kinds and branch kinds
 * for resolver dispatch.
 *
 * @remarks
 * Anonymous tokens have no factory binding and are skipped. Unknown kinds
 * (not in the node map) are treated as branch kinds so they go through
 * `_resolveByKind`.
 *
 * @param expanded - Concrete kind strings (already deduplicated / supertype-expanded).
 * @param nodeMap - The assembled node map.
 * @returns Object with `leafKinds` and `branchKinds` arrays.
 */
function classifyKindsForResolver(
	expanded: string[],
	nodeMap: NodeMap
): { leafKinds: string[]; branchKinds: string[]; tokenKinds: string[] } {
	const leafKinds: string[] = [];
	const branchKinds: string[] = [];
	const tokenKinds: string[] = [];
	for (const t of expanded) {
		const n = nodeMap.nodes.get(t);
		if (!n) {
			// Unknown kind — treat as branch so it goes through _resolveByKind
			branchKinds.push(t);
			continue;
		}
		switch (n.modelType) {
			case 'pattern':
			case 'enum':
			case 'keyword':
				leafKinds.push(t);
				break;
			case 'token':
				// Anonymous tokens have no factory binding — no resolver
				// dispatch, but they are still VALID union members: report
				// them so the single-kind fast path can pass an already-built
				// token NodeData through instead of auto-wrapping it into the
				// primary branch's container (#128).
				tokenKinds.push(t);
				break;
			case 'supertype':
			case 'branch':
			case 'group':
			// TEMPORARY: 'separatedList' shares 'branch'/'group's from()
			// dispatch — see isSlotBearingCompound's doc comment (shared.ts).
			case 'separatedList':
				branchKinds.push(t);
				break;
		}
	}
	return { leafKinds, branchKinds, tokenKinds };
}

/**
 * Selects the single-kind fast-path resolver call when dispatch reduces to
 * exactly one possible target kind.
 *
 * @remarks
 * When there is only one possible target, skip the generic `_resolveOne` /
 * `_resolveMany` entry point (which iterates the leafKinds / branchKinds
 * arrays) and emit a direct specialized call. Removes one function-call
 * layer + array-iteration dispatch per field read at runtime.
 *
 * Call sites no longer carry an explicit `<T>` type argument — TS infers
 * the slot type from the parameter type / return context at the assignment.
 * The per-call-site `NonNullable<T.X.Config['y']>` ceremony was orphaned
 * after the earlier from-cleanup pass removed the `as X` casts it paired with.
 *
 * @param prop - The property access expression string.
 * @param leafKinds - Classified leaf kind names.
 * @param branchKinds - Classified branch kind names.
 * @param fieldMultiple - Whether the slot accepts multiple values.
 * @returns The fast-path call string, or `undefined` if there is more than one kind.
 */
function buildSingleKindFastPath(
	prop: string,
	leafKinds: string[],
	branchKinds: string[],
	altKindExprs: readonly string[],
	fieldMultiple: boolean,
	elementType?: string
): string | undefined {
	const total = leafKinds.length + branchKinds.length;
	if (total !== 1) return undefined;
	const kindName = leafKinds[0] ?? branchKinds[0]!;
	const isLeaf = leafKinds.length === 1;
	const specialized = fieldMultiple
		? isLeaf
			? '_resolveManyLeaf'
			: '_resolveManyBranch'
		: isLeaf
			? '_resolveOneLeaf'
			: '_resolveOneBranch';
	const tArg = elementType ? `<${elementType}>` : '';
	// Branch fast path with anonymous-token union siblings (e.g.
	// mod_item.content's `';' | DeclarationList`): pass the token kinds'
	// discriminants so the resolver recognizes an already-valid
	// alternate-branch NodeData instead of auto-wrapping it into the
	// primary container (#128). Leaf resolvers never wrap, so they need
	// no alternate list. PR-K3d: the discriminants are baked at codegen
	// (`altKindDiscriminants`) — no runtime `kindIdFromName` re-resolution.
	const altArg = !isLeaf && altKindExprs.length > 0 ? `, [${altKindExprs.join(', ')}]` : '';
	return `${specialized}${tArg}(${prop}, ${JSON.stringify(kindName)}${altArg})`;
}

/**
 * Baked discriminant expressions for a slot's anonymous-token union
 * siblings (the `altKinds` argument of `_resolveOneBranch`). Resolution
 * order per token kind (PR-K3d): the slot value's mint `storageKindId`
 * stamp when present (collision-free id), else the name chain via
 * {@link containerTypeCheck} (`TSKindId.X` for catalog-backed kinds,
 * string literal for catalog-less fixtures — matching the string `$type`
 * world those pipelines run in).
 */
function altKindDiscriminants(
	tokenKinds: readonly string[],
	values: readonly NodeOrTerminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string[] {
	return tokenKinds.map((t) => {
		const stampedId = values.find(
			(v) => isNodeRef(v) && (storageKindOfRef(v.node)) === t && v.storageKindId !== undefined
		)?.storageKindId;
		const stamped =
			stampedId !== undefined && kindEntries !== undefined
				? kindDiscriminantExprForId(stampedId, kindEntries)
				: undefined;
		return stamped ?? containerTypeCheck(t, kindEntries, nodeMap);
	});
}

/**
 * Emits an interned-array resolver call, referring to module-scoped
 * constants instead of repeating literal arrays at every call site.
 *
 * @remarks
 * Duplicated entries collapse to a single module-scoped `_KN = [...]` decl
 * or `_super_<name>` when the list matches a supertype exactly.
 *
 * Call sites no longer carry an explicit `<T>` type argument — TS infers
 * the slot type from the parameter type / return context at the assignment.
 *
 * @param prop - The property access expression string.
 * @param leafKinds - Classified leaf kind names.
 * @param branchKinds - Classified branch kind names.
 * @param fieldMultiple - Whether the slot accepts multiple values.
 * @param intern - Kind-list interner.
 * @returns The resolver call string with interned array references.
 */
function buildInternedArrayResolverCall(
	prop: string,
	leafKinds: string[],
	branchKinds: string[],
	fieldMultiple: boolean,
	intern: KindInterner,
	elementType?: string
): string {
	const leafArr = intern(leafKinds);
	const branchArr = intern(branchKinds);
	const helper = fieldMultiple ? '_resolveMany' : '_resolveOne';
	// Explicit `<T>` type arg when an element type is known — TS does not
	// reliably infer the slot type from the assignment context for these
	// generic helpers, so call sites that have field metadata provide it.
	const tArg = elementType ? `<${elementType}>` : '';
	return `${helper}${tArg}(${prop}, ${leafArr}, ${branchArr})`;
}

function resolveFieldCall(
	prop: string,
	field: { values: readonly NodeOrTerminal[] },
	fieldMultiple: boolean,
	nodeMap: NodeMap,
	intern: KindInterner,
	/** When true, keyword-presence short-circuit applies.
	 * Children slots (the merged-values pseudo shape) skip it because
	 * the Config surface there is `children`, not the keyword name — a
	 * boolean-keyword classifier match on a children slot is coincidental
	 * and should not route through _resolveBooleanKeyword. */
	applyKeywordPresence = true,
	/** Pre-computed element type expression for the explicit `<T>` type
	 * argument on the resolver call. When omitted, falls back to deriving
	 * from the field shape (only possible when `field` is an `AssembledNonterminal`). */
	elementTypeOverride?: string,
	/** Catalog entries — required for kindEnum fields to emit compile-time
	 * literal-aware discriminants (shared kindEnumTextMapExpr, #129). */
	kindEntries?: readonly KindEnumEntry[]
): string {
	// Short-circuit keyword-presence fields through dedicated
	// resolvers. Boolean / bitflag inputs must NOT get routed through the
	// leaf-literal registry (a `true` on a boolean-keyword field is a
	// presence marker, not a boolean_literal node).
	if (applyKeywordPresence) {
		const kwCall = keywordPresenceResolverCall(prop, field, nodeMap);
		if (kwCall !== undefined) return kwCall;
	}

	const storageInfo = 'name' in field ? resolveFieldStorageInfo(field as AssembledNonterminal, nodeMap) : undefined;

	const expanded = expandAndDedupeContentTypes(slotKindNames(field), nodeMap, storageKindIdByNameOf(field));
	const { leafKinds, branchKinds, tokenKinds } = classifyKindsForResolver(expanded, nodeMap);

	// Pass an explicit element type when we have one — `resolveFieldCall` is
	// also invoked with merged children pseudo-fields (no AssembledNonterminal
	// shape), so prefer an override when supplied; otherwise derive from the
	// AssembledNonterminal when present.
	const elementType =
		elementTypeOverride ?? ('name' in field ? fieldElementType(field as AssembledNonterminal, nodeMap) : undefined);

	const fastPath = buildSingleKindFastPath(
		prop,
		leafKinds,
		branchKinds,
		altKindDiscriminants(tokenKinds, field.values, nodeMap, kindEntries),
		fieldMultiple,
		elementType
	);
	const baseCall =
		fastPath !== undefined
			? fastPath
			: buildInternedArrayResolverCall(prop, leafKinds, branchKinds, fieldMultiple, intern, elementType);
	if (storageInfo?.kind === 'kindEnum') {
		return `coerceKindEnumStorage(${baseCall}, ${kindEnumTextMapExpr(field as AssembledNonterminal, nodeMap, kindEntries)})`;
	}
	return baseCall;
}

// kindEnumTextMapExpr: shared with factories.ts (imported above) — from.ts
// previously carried a duplicate that emitted runtime `kindIdFromName(text)`
// lookups, resolving literal texts through the name-polymorphic runtime
// switch (rust `'block'` → the named block RULE's id instead of the
// anon_sym_block token's) — the runtime face of the #129 shadowing class.

/**
 * Emit the resolver call string for a keyword-presence field.
 *
 * Returns `undefined` when the field isn't a keyword-presence pattern
 * (caller falls through to the default resolver).
 */
function keywordPresenceResolverCall(
	prop: string,
	field: { values: readonly NodeOrTerminal[] },
	nodeMap: NodeMap
): string | undefined {
	const kw = keywordPresenceKind(field as AssembledNonterminal, nodeMap);
	if (kw === null) return undefined;
	if (kw === 'boolean') return `_resolveBooleanKeyword(${prop})`;
	// bitflag — pass through; the factory handles number expansion via _bf.
	return `_resolveBitflag(${prop})`;
}

// ---------------------------------------------------------------------------
// Module-scoped resolver helpers (emitted into generated from.ts)
// ---------------------------------------------------------------------------

/**
 * Builds the leaf registry entries from NodeMap leaves, keywords, and enums.
 *
 * @remarks
 * Enum factories declare their parameter as a literal union at the type
 * level but the factory's runtime guard accepts any string and throws on
 * invalid values. The registry slot declares the factory as `(text: string)`
 * so the enum's narrower signature is exposed through a thin closure — no
 * cast at the call site, runtime guard still catches invalid input.
 *
 * @param nodeMap - The assembled node map.
 * @returns Array of registry entry source strings to push into the `_leafRegistry` literal.
 */
function buildLeafRegistryEntries(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string[] {
	const registryEntries: string[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_')) continue;
		if (!node.rawFactoryName) continue;
		// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
		// never appear at runtime; no factory was emitted for them.
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		const factory = `F.${node.rawFactoryName}`;
		if (node.modelType === 'enum') {
			const values = node.values.map((v) => JSON.stringify(v)).join(', ');
			// Enum factories declare a narrow string-literal union for `text`,
			// but the registry slot is `(text: string)` (the runtime guard
			// catches invalid input). Cast at the boundary so the wrapper
			// signature stays uniform.
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { values: [${values}], factory: (text: string) => ${factory}(text as Parameters<typeof ${factory}>[0]) },`
			);
		} else if (node.modelType === 'keyword') {
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { values: [${JSON.stringify(node.text)}], factory: () => ${factory}() },`
			);
		} else if (node.modelType === 'pattern') {
			registryEntries.push(`  ${JSON.stringify(kind)}: { factory: ${factory} },`);
		}
	}
	return registryEntries;
}

/**
 * Emits the `_resolveByKind` generic helper into generated from.ts.
 *
 * @remarks
 * Generic over the kind literal so the return type is the precise
 * `ReturnType<_FromMap[K]>` — each per-kind factory's output flows through,
 * not a widened `AnyNodeData` union. Callers pass a narrow kind (string-
 * literal from the field's content types or narrowed via an `in`-check
 * against `_fromMap`) to get the specific return shape back. The internal
 * sideways cast routes around per-slot parameter variance without going
 * through `unknown` / `any`.
 *
 * @param lines - Output lines array to push into.
 */
function emitResolveByKindHelper(lines: string[]): void {
	// Type guard for keyof _FromMap so `kind in _fromMap` checks elsewhere
	// narrow the string parameter without an unchecked cast.
	lines.push('function _isFromKind(k: string): k is keyof _FromMap {');
	lines.push('  return k in _fromMap;');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveByKind<K extends keyof _FromMap>(');
	lines.push('  kind: K,');
	lines.push('  rest: _FromFieldInput,');
	lines.push('): ReturnType<_FromMap[K]> {');
	lines.push('  const fn = _fromMap[kind] as (rest: _FromFieldInput) => ReturnType<_FromMap[K]>;');
	lines.push('  return fn(rest);');
	lines.push('}');
	lines.push('');
}

/**
 * Determines the scalar resolver parameter name, prefixing with `_` when
 * the grammar has no scalar leaf kinds to satisfy the oxlint unused-variable
 * convention.
 *
 * @remarks
 * When the grammar declares no scalar leaf kinds the function body is empty —
 * prefixing the parameter with `_` prevents oxlint from flagging it. Callers
 * still pass arguments; the `_` is a lint convention only.
 *
 * @param hasBool - Whether the grammar has a `boolean_literal` kind.
 * @param hasInt - Whether the grammar has an integer literal kind.
 * @param hasFloat - Whether the grammar has a float literal kind.
 * @returns The parameter name string: `'v'` or `'_v'`.
 */
function resolveScalarParamName(hasBool: boolean, hasInt: boolean, hasFloat: boolean): string {
	return hasBool || hasInt || hasFloat ? 'v' : '_v';
}

/**
 * Emits the `_resolveOne` generic helper into generated from.ts.
 *
 * @remarks
 * Resolvers are emitted with a `<T>` type parameter so the call site can
 * name the expected slot shape (`_resolveOne<FunctionItem>`); no `extends`
 * constraint because the factory-emitted node interfaces don't all
 * structurally satisfy `AnyNodeData` (they omit the `named` property), and
 * adding such a constraint would force every call site to re-widen. The
 * input is the closed `_FromFieldInput` union so no caller has to cast
 * anything loose.
 *
 * @param lines - Output lines array to push into.
 */
function emitResolveOneHelper(lines: string[]): void {
	// Generic <T> reflects the caller-supplied slot shape. Body branches
	// produce either a factory output, a scalar leaf, a resolved branch,
	// or pass the input through unchanged. Each branch tail asserts to T —
	// the runtime guarantees agree with the assertion: factory outputs
	// satisfy the slot's NodeData shape; scalar/leaf factories produce
	// Terminal<kind, text> matching the leaf interface; resolveByKind
	// dispatches through `_FromMap` whose return type is the slot's
	// factory output. Single-site cast keeps the helper readable; per-call
	// assertions would clutter every consumer.
	lines.push('function _resolveOne<T>(');
	lines.push('  v: _FromFieldInput,');
	lines.push('  leafKinds: readonly string[],');
	lines.push('  branchKinds: readonly string[],');
	lines.push('): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (isNodeData(v)) return v as T;');
	lines.push('  if (typeof v === "boolean" || typeof v === "number") {');
	lines.push('    const scalar = _resolveScalar(v);');
	lines.push('    if (scalar !== undefined) return scalar as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "string" && leafKinds.length > 0) {');
	lines.push('    const leaf = _resolveLeafString(v, leafKinds);');
	lines.push('    if (leaf !== undefined) return leaf as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {');
	lines.push('    const { kind, ...rest } = v;');
	lines.push('    if (typeof kind === "string" && _isFromKind(kind)) return _resolveByKind(kind, rest) as T;');
	lines.push('  }');
	lines.push('  if (branchKinds.length === 1 && typeof v === "object" && !Array.isArray(v)) {');
	lines.push('    const bk = branchKinds[0]!;');
	lines.push('    if (_isFromKind(bk)) return _resolveByKind(bk, v) as T;');
	lines.push('  }');
	// Gap B: an unresolved object/array would otherwise pass through raw and
	// get embedded in the tree, surfacing only later as a confusing transport
	// error. Scalars (string/number/boolean) are excluded — some call sites
	// deliberately rely on scalar passthrough to coerceKindEnumStorage.
	lines.push('  if (typeof v === "object") {');
	lines.push(
		'    throw new Error(`_resolveOne: cannot resolve value to any of [${[...leafKinds, ...branchKinds].join(", ")}]: ${JSON.stringify(v)}`);'
	);
	lines.push('  }');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');
}

/**
 * Emits the `_assertNonEmpty` runtime guard and static narrowing helper into
 * generated from.ts.
 *
 * @remarks
 * Runtime guard + static narrowing helper for repeat1-sourced list fields.
 * `from()` resolves a loose input to a `readonly T[]` via `_resolveMany*`,
 * but the factory's config slot is the non-empty tuple `readonly [T, ...T[]]`.
 * Calling this assertion on the resolver result narrows the static type to
 * the tuple shape AND throws at runtime if the input was empty.
 *
 * @param lines - Output lines array to push into.
 */
function emitAssertNonEmptyHelper(lines: string[]): void {
	lines.push('function _assertNonEmpty<T>(');
	lines.push('  arr: readonly T[],');
	lines.push('  label: string,');
	lines.push('): asserts arr is readonly [T, ...(readonly T[])] {');
	lines.push('  if (arr.length === 0) {');
	lines.push('    throw new Error(`${label}: requires at least one element`);');
	lines.push('  }');
	lines.push('}');
}

/**
 * Emits the `_requireField` runtime guard into generated from.ts.
 *
 * @remarks
 * Gap A: a required slot whose loose-input value didn't resolve to any
 * known branch/leaf kind comes back `undefined` from `_resolveOne` —
 * indistinguishable from a legitimately-absent optional slot. Call sites
 * for REQUIRED, non-defaultable fields wrap the resolver result in this
 * guard so the failure surfaces at the `from()` boundary (naming the kind
 * and slot) instead of silently constructing a node with a missing field.
 *
 * @param lines - Output lines array to push into.
 */
function emitRequireFieldHelper(lines: string[]): void {
	lines.push('function _requireField<T>(kind: string, slot: string, v: T): T {');
	lines.push('  if (v === undefined || v === null) {');
	lines.push("    throw new Error(`Missing required slot '${slot}' on ${kind}.from()`);");
	lines.push('  }');
	lines.push('  return v;');
	lines.push('}');
}

// ---------------------------------------------------------------------------
// Gap 3 + 4: _wrapWithChildren dispatch table
// ---------------------------------------------------------------------------

interface WrapChildrenEntry {
	readonly kind: string;
	readonly factoryName: string;
	readonly childSurface: 'direct' | 'spread' | 'array';
	readonly kindIdExpr: string;
}

/**
 * Collects all branch/separatedList kinds that accept `$other` (catch-all
 * children) — used by the `_wrapWithChildren` runtime dispatch table in
 * generated from.ts.
 *
 * @remarks
 * Child-surface branches wrap through the same taxonomy used by the factory
 * emitter: direct unnamed-child factories call `F.kind(children[0])`, while
 * spread-child factories call `F.kind(...children)`. `'separatedList'`
 * kinds are handled separately with `childSurface: 'array'` (`F.kind(children
 * as ...)`, the whole array as the single `elements` argument) — routing
 * them through `classifyChildFactorySurface`'s stub-based 'direct'/'spread'
 * classification here would reproduce the same real from() mis-binding bug
 * `emitSeparatedListFrom`'s doc comment (this file) documents; every
 * `'separatedList'` kind unconditionally gets an `'array'` entry regardless
 * of what the stub would have classified it as.
 *
 * @param nodeMap - The assembled node map.
 * @param kindEntries - Kind enum entries for TSKindId emission.
 * @returns Array of wrap-children descriptors.
 */
function collectWrapChildrenEntries(
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): WrapChildrenEntry[] {
	const entries: WrapChildrenEntry[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'branch' && node.modelType !== 'separatedList') continue;
		if (!node.rawFactoryName) continue;
		if (kind.startsWith('_') && !node.userFacing) continue;
		if (!kindEntries) continue;
		const entry = findKindEntry(kindEntries, kind);
		if (!entry) continue;
		let childSurface: 'direct' | 'spread' | 'array' | null;
		if (node.modelType === 'separatedList') {
			childSurface = 'array';
		} else {
			if (classifyChildFactorySurface(node, nodeMap) === null) continue;
			// Real arity decides direct-vs-spread — see `unnamedChildSlotFacts`'s
			// doc comment for why this reads the slot directly rather than
			// trusting `classifyFactoryShape`'s label for the shape itself.
			childSurface = unnamedChildSlotFacts(node.fields)?.multiple ? 'spread' : 'direct';
		}
		entries.push({
			kind,
			factoryName: node.rawFactoryName,
			childSurface,
			kindIdExpr: `TSKindId.${entry.member}`
		});
	}
	return entries;
}

/**
 * Emits the `_wrapKindIds` map and `_wrapWithChildren` dispatcher into
 * generated from.ts.
 *
 * @remarks
 * Gap 3 (array auto-wrap): when `_resolveOneBranch` receives an array and
 * the target kind is in `_wrapKindIds`, each element is resolved and the
 * array is forwarded to the factory via `_wrapWithChildren`.
 *
 * Gap 4 (single-value auto-wrap): when `_resolveOneBranch` receives a
 * NodeData whose `$type` differs from the target kind, it wraps the value
 * as a single child if the target kind accepts children.
 *
 * @param lines - Output lines array to push into.
 * @param nodeMap - The assembled node map.
 * @param kindEntries - Kind enum entries for TSKindId emission.
 */
function emitWrapWithChildrenTable(
	lines: string[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	const entries = collectWrapChildrenEntries(nodeMap, kindEntries);
	if (entries.length === 0) return;

	// Emit _wrapKindIds map: kind string → TSKindId numeric value
	lines.push('const _wrapKindIds: { readonly [kind: string]: number } = {');
	for (const e of entries) {
		lines.push(`  ${JSON.stringify(e.kind)}: ${e.kindIdExpr},`);
	}
	lines.push('};');
	lines.push('');

	// Emit _wrapWithChildren dispatcher
	lines.push('function _wrapWithChildren(kind: string, children: readonly unknown[]): unknown {');
	lines.push('  switch (kind) {');
	for (const e of entries) {
		if (e.childSurface === 'spread') {
			lines.push(
				`    case ${JSON.stringify(e.kind)}: return F.${e.factoryName}(...(children as Parameters<typeof F.${e.factoryName}>));`
			);
		} else if (e.childSurface === 'array') {
			// 'separatedList' — the whole array IS the `elements` argument, never
			// spread and never indexed. See `emitSeparatedListFrom`'s doc comment.
			// Direct cast (no `as unknown` intermediate) — `children`'s own
			// declared param type is already `readonly unknown[]`, which tsgo
			// accepts as directly comparable to the tuple-shaped
			// `NonEmptyArray<T>` target (confirmed empirically; see
			// `emitSeparatedListFrom`'s doc comment for the same finding).
			lines.push(
				`    case ${JSON.stringify(e.kind)}: return F.${e.factoryName}(children as Parameters<typeof F.${e.factoryName}>[0]);`
			);
		} else {
			lines.push(
				`    case ${JSON.stringify(e.kind)}: return F.${e.factoryName}(children[0] as Parameters<typeof F.${e.factoryName}>[0]);`
			);
		}
	}
	lines.push('    default: return undefined;');
	lines.push('  }');
	lines.push('}');
	lines.push('');
}

function emitResolverHelpers(
	lines: string[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	const registryEntries = buildLeafRegistryEntries(nodeMap, kindEntries);

	lines.push('// --- Loose-input resolver helpers (see C6-prereq) ---');
	lines.push('interface _LeafEntry {');
	lines.push('  readonly values?: readonly string[];');
	lines.push('  readonly pattern?: RegExp;');
	lines.push('  readonly factory: (text: string) => AnyNodeData;');
	lines.push('}');
	lines.push('const _leafRegistry: { readonly [kind: string]: _LeafEntry } = {');
	for (const entry of registryEntries) lines.push(entry);
	lines.push('};');
	lines.push('');

	lines.push('function _resolveLeafString(v: string, kinds: readonly string[]): AnyNodeData | undefined {');
	lines.push('  for (const kind of kinds) {');
	lines.push('    const entry = _leafRegistry[kind];');
	lines.push('    if (!entry) continue;');
	lines.push('    if (entry.values && entry.values.includes(v)) return entry.factory(v);');
	lines.push('    if (entry.pattern && entry.pattern.test(v)) return entry.factory(v);');
	lines.push('  }');
	lines.push('  for (const kind of kinds) {');
	lines.push('    const entry = _leafRegistry[kind];');
	lines.push('    if (entry && !entry.values && !entry.pattern) return entry.factory(v);');
	lines.push('  }');
	lines.push('  return undefined;');
	lines.push('}');
	lines.push('');

	emitResolveByKindHelper(lines);

	const hasBool = nodeMap.nodes.has('boolean_literal');
	const hasInt = nodeMap.nodes.has('integer_literal') || nodeMap.nodes.has('integer');
	const hasFloat = nodeMap.nodes.has('float_literal') || nodeMap.nodes.has('float');
	const scalarParam = resolveScalarParamName(hasBool, hasInt, hasFloat);
	lines.push(`function _resolveScalar(${scalarParam}: boolean | number): AnyNodeData | undefined {`);
	if (hasBool) {
		lines.push('  if (typeof v === "boolean") {');
		lines.push('    const e = _leafRegistry["boolean_literal"];');
		lines.push('    return e ? e.factory(v ? "true" : "false") : undefined;');
		lines.push('  }');
	}
	if (hasInt || hasFloat) {
		lines.push('  if (typeof v === "number") {');
		if (hasInt) {
			const intKind = nodeMap.nodes.has('integer_literal') ? 'integer_literal' : 'integer';
			lines.push(`    if (Number.isInteger(v)) {`);
			lines.push(`      const e = _leafRegistry[${JSON.stringify(intKind)}];`);
			lines.push(`      return e ? e.factory(String(v)) : undefined;`);
			lines.push(`    }`);
		}
		if (hasFloat) {
			const floatKind = nodeMap.nodes.has('float_literal') ? 'float_literal' : 'float';
			lines.push(`    const e = _leafRegistry[${JSON.stringify(floatKind)}];`);
			lines.push(`    return e ? e.factory(String(v)) : undefined;`);
		}
		lines.push('  }');
	}
	lines.push('  return undefined;');
	lines.push('}');
	lines.push('');

	emitResolveOneHelper(lines);

	lines.push('function _resolveMany<T>(');
	lines.push('  v: _FromFieldInput,');
	lines.push('  leafKinds: readonly string[],');
	lines.push('  branchKinds: readonly string[],');
	lines.push('): readonly T[] {');
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _FromFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOne<T>(e, leafKinds, branchKinds));');
	lines.push('}');
	lines.push('');

	// Single-kind fast paths — resolver call sites with only one
	// possible target dispatch here directly, skipping the leafKinds
	// / branchKinds iteration in _resolveOne.
	lines.push('function _resolveOneLeaf<T>(v: _FromFieldInput, kind: string): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (isNodeData(v)) return v as T;');
	lines.push('  if (typeof v === "boolean" || typeof v === "number") {');
	lines.push('    const scalar = _resolveScalar(v);');
	lines.push('    if (scalar !== undefined) return scalar as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "string") {');
	lines.push('    const e = _leafRegistry[kind];');
	lines.push('    if (e !== undefined) return e.factory(v) as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {');
	lines.push('    const { kind: k, ...rest } = v;');
	lines.push('    if (typeof k === "string" && _isFromKind(k)) return _resolveByKind(k, rest) as T;');
	lines.push('  }');
	// Gap B: see _resolveOne — same object/array-only throw, scalars pass through.
	lines.push('  if (typeof v === "object") {');
	lines.push(
		"    throw new Error(`_resolveOneLeaf: cannot resolve value to leaf kind '${kind}': ${JSON.stringify(v)}`);"
	);
	lines.push('  }');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');

	// Gap 3+4: emit _wrapWithChildren table before _resolveOneBranch
	// since _resolveOneBranch references _wrapKindIds and _wrapWithChildren.
	emitWrapWithChildrenTable(lines, nodeMap, kindEntries);

	lines.push('function _resolveOneBranch<T>(v: _FromFieldInput, kind: string, altKinds?: readonly (string | number)[]): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	// Gap 4: NodeData pass-through if $type matches; wrap as single child
	// when it doesn't and target kind supports children. `altKinds` carries
	// the slot's OTHER union members (anonymous tokens the resolver
	// classification has no factory dispatch for, e.g. mod_item.content's
	// `';'` external form) — a NodeData already matching one is a VALID
	// alternate branch and must pass through, not get auto-wrapped into the
	// primary branch's container (#128).
	lines.push('  if (isNodeData(v)) {');
	lines.push('    const wrapId = _wrapKindIds[kind];');
	lines.push('    if (wrapId !== undefined && v.$type !== wrapId) {');
	lines.push('      if (altKinds !== undefined && altKinds.some(k => k === v.$type)) return v as T;');
	lines.push('      return _wrapWithChildren(kind, [v]) as T;');
	lines.push('    }');
	lines.push('    return v as T;');
	lines.push('  }');
	// Gap 3: Array at wrapper position — resolve each element, wrap in
	// target kind via _wrapWithChildren.
	lines.push('  if (Array.isArray(v) && kind in _wrapKindIds) {');
	lines.push('    const resolved = v.map(e => {');
	lines.push('      if (typeof e === "string" || typeof e === "number") return e;');
	lines.push('      if (isNodeData(e)) return e;');
	lines.push('      if (typeof e === "object" && e !== null && !Array.isArray(e)) {');
	lines.push('        if ("kind" in e) {');
	lines.push('          const { kind: k, ...rest } = e;');
	lines.push('          if (typeof k === "string" && _isFromKind(k)) return _resolveByKind(k, rest);');
	lines.push('        }');
	lines.push('        if (_isFromKind(kind)) return _resolveByKind(kind, e);');
	lines.push('      }');
	lines.push('      return e;');
	lines.push('    });');
	lines.push('    return _wrapWithChildren(kind, resolved) as T;');
	lines.push('  }');
	lines.push(
		'  if ((typeof v === "string" || typeof v === "number" || typeof v === "boolean") && _isFromKind(kind)) {'
	);
	lines.push('    return _resolveByKind(kind, v) as T;');
	lines.push('  }');
	// Existing object handling
	lines.push('  if (typeof v === "object" && !Array.isArray(v)) {');
	lines.push('    if ("kind" in v) {');
	lines.push('      const { kind: k, ...rest } = v;');
	lines.push('      if (typeof k === "string" && _isFromKind(k)) return _resolveByKind(k, rest) as T;');
	lines.push('    }');
	lines.push('    if (_isFromKind(kind)) return _resolveByKind(kind, v) as T;');
	lines.push('  }');
	// Gap B: see _resolveOne — same object/array-only throw, scalars pass through.
	lines.push('  if (typeof v === "object") {');
	lines.push(
		"    throw new Error(`_resolveOneBranch: cannot resolve value to branch kind '${kind}': ${JSON.stringify(v)}`);"
	);
	lines.push('  }');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');

	lines.push('function _resolveManyLeaf<T>(v: _FromFieldInput, kind: string): readonly T[] {');
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _FromFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOneLeaf<T>(e, kind));');
	lines.push('}');
	lines.push('');

	lines.push('function _resolveManyBranch<T>(v: _FromFieldInput, kind: string, altKinds?: readonly (string | number)[]): readonly T[] {');
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _FromFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOneBranch<T>(e, kind, altKinds));');
	lines.push('}');
	lines.push('');

	// Keyword-presence resolvers — pass-through. For scalar /
	// repeat-of-one booleans the factory inlines
	// `config.x ? '<literal>' : undefined` (no runtime helper); for
	// bitflags the `_bf` helper stamps the NodeData container. The
	// resolver layer only has to refuse the leaf-registry path so a
	// `true` input doesn't get misrouted through `_resolveScalar` into
	// a `boolean_literal` factory call.
	lines.push('function _resolveBooleanKeyword<T>(v: _FromFieldInput): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (v === true || v === false) return v as T;');
	lines.push('  if (isNodeData(v)) return v as T;');
	lines.push('  if (Array.isArray(v)) return v as T;');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveBitflag<T>(v: _FromFieldInput): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (typeof v === "number") return v as T;');
	lines.push('  if (typeof v === "string") return v as T;');
	lines.push('  if (Array.isArray(v)) return v as T;');
	lines.push('  if (isNodeData(v)) return v as T;');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');

	emitAssertNonEmptyHelper(lines);
	lines.push('');
	emitRequireFieldHelper(lines);
}

// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------

export class FromEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #internKinds: KindInterner;
	readonly #kindTableLiterals: string[];
	readonly #namedEntries: Map<string, string>;
	readonly #preambleLines: string[];
	readonly #output: string[] = [];

	constructor(config: EmitFromConfig) {
		const { nodeMap, generatedIdTables, kindEntries: providedKindEntries } = config;
		const kindEntries =
			providedKindEntries ??
			(generatedIdTables
				? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
				: undefined);

		const supertypeByKey = buildSupertypeByKey(nodeMap);
		const kindTableIndex = new Map<string, number>();
		const kindTableLiterals: string[] = [];
		const namedEntries = new Map<string, string>();
		const internKinds = buildKindInterner(supertypeByKey, kindTableIndex, kindTableLiterals, namedEntries);

		const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
		emitNamespaceImports(lines, kindEntries);
		emitFromFieldInputType(lines);

		this.#nodeMap = nodeMap;
		this.#kindEntries = kindEntries;
		this.#internKinds = internKinds;
		this.#kindTableLiterals = kindTableLiterals;
		this.#namedEntries = namedEntries;
		this.#preambleLines = lines;
	}

	emitLeaf(node: Extract<AssembledNode, { modelType: 'pattern' | 'enum' | 'keyword' }>): void {
		from.leaf(this.#output, node);
	}

	emitBranch(node: BranchLikeForFrom): void {
		from.branch(this.#output, node, this.#nodeMap, this.#internKinds, this.#kindEntries);
	}

	emitSeparatedList(node: AssembledSeparatedList): void {
		from.separatedList(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	dispatchNode(kind: string, node: AssembledNode): void {
		if (
			classifyFromEmission(kind, node, {
				nodeMap: this.#nodeMap,
				kindEntries: this.#kindEntries
			}) !== 'emit'
		) {
			return;
		}
		switch (node.modelType) {
			case 'branch':
				this.emitBranch(node);
				break;
			case 'pattern':
			case 'enum':
			case 'keyword':
				this.emitLeaf(node);
				break;
			case 'separatedList':
				this.emitSeparatedList(node);
				break;
			default:
				break;
		}
	}

	finalize(): string {
		const lines = [...this.#preambleLines];
		emitFromMapDeclaration(lines, this.#nodeMap, this.#kindEntries);
		emitResolverHelpers(lines, this.#nodeMap, this.#kindEntries);
		lines.push('');
		emitInternedKindTable(lines, this.#namedEntries, this.#kindTableLiterals);
		for (const block of this.#output) {
			lines.push(block);
			lines.push('');
		}
		return lines.join('\n');
	}
}
