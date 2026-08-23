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
	isRequired,
	isMultiple,
	isNonEmpty,
	slotKindNames,
	keywordPresenceKind,
	resolveSingleFieldFactorySlot,
	resolveFieldStorageInfo,
	isHiddenInfraSlot,
	configurableFactoryFields,
	type BranchSlotClass,
	classifyFactoryShape,
	classifyChildFactorySurface,
	classifyFromEmission,
	soleSlotFacts,
	type SoleSlotFacts,
	canonicalSeparatedListField
} from './shared.ts';
import { fieldElementType, childElementType, kindEnumTextMapExpr } from './factories.ts';
import { buildSeparatedListContentSlot, collectSeparatorCandidateKindNames } from './wrap.ts';
import { isNodeRef, storageKindIdByNameOf, storageKindOfRef } from '../compiler/model/node-map.ts';
import type { NodeOrTerminal } from '../compiler/model/node-map.ts';
import type { CodegenEmitter } from './emitter.ts';

const SAFE_IDENT_KEY = /^[A-Za-z_$][\w$]*$/;

export interface EmitFromConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	kindEntries?: readonly KindEnumEntry[];
}

// ---------------------------------------------------------------------------
// Dedup helpers
// ---------------------------------------------------------------------------

function buildSupertypeByKey(nodeMap: NodeMap): Map<string, string> {
	const supertypeByKey = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		if (node.subtypeNames.length === 0) continue;
		const key = [...node.subtypeNames].sort().join('\n');
		if (!supertypeByKey.has(key)) {
			const safe = kind.replace(/^_+/, '').replace(/[^\w]/g, '_');
			supertypeByKey.set(key, `_super_${safe}`);
		}
	}
	return supertypeByKey;
}

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

function emitNamespaceImports(
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	usesKindLiteralText: boolean
): void {
	lines.push(`import * as F from './factories.js';`);
	lines.push(`import type * as T from './types.js';`);
	// `kindIdFromName` was a runtime kind-id resolver from before PR-K3d baked
	// kind ids into generated from.ts statically (`kindIdExpr: TSKindId.<member>`
	// above) — no call site references it anymore, so importing it here is
	// dead weight that trips no-unused-vars.
	if (kindEntries) {
		lines.push(
			usesKindLiteralText
				? `import { TSKindId, KIND_LITERAL_TEXT } from './types.js';`
				: `import { TSKindId } from './types.js';`
		);
	}
	lines.push("import type { AnyNodeData } from '@sittir/types';");
	lines.push("import { coerceKindEnumStorage, isNodeData } from './utils.js';");
	lines.push('');
}

function emitFromFieldInputType(lines: string[]): void {
	lines.push('/** Runtime-narrowed field input bag for generated from() helpers. */');
	lines.push('type _FromFieldInput = unknown;');
	lines.push('');
}

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

	export function branch(
		output: string[],
		node: BranchLikeForFrom,
		nodeMap: NodeMap,
		intern: KindInterner,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(emitBranchFrom(node, nodeMap, intern, kindEntries));
	}

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
		const facts = soleSlotFacts(branchTarget, nodeMap);
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
	const hasBlockingField = targetFields.some((f) => isRequired(f));
	if (hasBlockingField) return null;
	return targetNode.rawFactoryName;
}

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
				fields: node.fields,
				childSlotFacts: soleSlotFacts(node, nodeMap)
			},
			kindEntries,
			nodeMap
		);
	}

	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	const fields = node.fields;
	// A field forces required input only if the caller must actually supply
	// it: auto-stamped fields (always `required` but have no Config slot) and
	// keyword-presence fields (default to absent/false) are excluded, same as
	// configurableFactoryFields' definition of the real Config surface
	// (shared.ts) — a caller only ever HAS to supply what that surface lists.
	const opt = configurableFactoryFields(fields, nodeMap).some((f) => isRequired(f)) ? '' : '?';
	const typeName = node.typeName;
	const lines: string[] = [];
	const { inputType, inputOptional } = buildBranchSignatureParts(node, factory, opt);
	const returnType = factoryReturnTypeExpr(factory);
	const soleField = !nodeMap.polymorphFormKinds.has(node.kind)
		? resolveSingleFieldFactorySlot(node, nodeMap)
		: undefined;
	// `classifyFactoryShape` returning 'direct' already guarantees the sole
	// user slot is the only non-stamped field (resolveDirectFactorySlot) —
	// no separate keyword-presence exclusion needed here.
	const shapeForDirect = classifyFactoryShape(node, nodeMap);
	// 'forwarded' refines 'direct' — the factory still accepts the single
	// direct value (a pre-built node dispatches via $type), so the same
	// direct-call emission applies.
	const canDirectFactoryCall = soleField && (shapeForDirect === 'direct' || shapeForDirect === 'forwarded');
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
			const call = resolveFieldCall(
				inputExpr,
				soleField,
				isMultiple(soleField),
				nodeMap,
				intern,
				true,
				undefined,
				kindEntries
			);
			// Gap A: sole-slot direct-call factories skip the Config object
			// literal entirely, so a required sole field needs its own guard.
			const guardedCall = isRequired(soleField)
				? `_requireField(${JSON.stringify(node.kind)}, ${JSON.stringify(soleField.configKey)}, ${call})`
				: call;
			lines.push(`  return ${factory}(${guardedCall});`);
		} else {
			lines.push(`  return ${factory}({`);
			for (const f of fields) {
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
	readonly fields?: readonly AssembledNonterminal[];
	// The container's classified sole user slot (soleSlotFacts) —
	// its `storageName` drives the `_<name>` data key we read here. Computed
	// by the caller from the full node; not derivable from `fields` alone.
	readonly childSlotFacts: SoleSlotFacts | null;
}

function containerTypeCheck(kind: string, kindEntries: readonly KindEnumEntry[] | undefined, nodeMap: NodeMap): string {
	if (!kindEntries) return `'${kind}'`;
	if (!hasCatalogEntry(kindEntries, kind)) return `'${kind}'`;
	return kindDiscriminantExpr(kind, nodeMap, kindEntries);
}

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
	// read per-instance facts off it — e.g. preserving `_separator`/
	// `_delimiter` when reconstructing an already-wrapped
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
	// The interface declares `_<storageName>` per slot (no `$other`), so the
	// element type is the slot's element type and the data read is
	// `data._<storageName>` — keyed off the classified sole user slot.
	const facts = node.childSlotFacts;
	const elementType = facts
		? childElementType({ children: node.fields ?? [] }, nodeMap)
		: `NonNullable<T.${node.typeName}['$other']> extends readonly [infer E] ? E : NonNullable<T.${node.typeName}['$other']>`;
	const storageKey = facts ? facts.slot.storageKey : '$other';
	if (facts?.multiple) {
		return emitRepeatedContainerFrom(fn, factory, tName, elementType, node.kind, kindEntries, nodeMap, storageKey);
	}
	return emitSingularContainerFrom(fn, factory, tName, elementType, node.kind, kindEntries, nodeMap, storageKey);
}

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
	const hasLeadingOption = node.leadingDelimiter === 'optional';
	const hasTrailingOption = node.trailingDelimiter === 'optional';
	const hasOptions = hasSeparatorKindOption || hasLeadingOption || hasTrailingOption;

	// The factory's spread signature — `fn(...elements)` / `fn(options,
	// ...elements)` — needs the elements ARRAY spread at the call, typed as
	// the same rest-tuple the factory declares (mirrors
	// emitSeparatedListFactory's elementsType derivation).
	const elemTypeForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
	const elementsType = node.nonEmpty ? `NonEmptyArray<${elemType}>` : `${elemTypeForArray}[]`;
	const spreadElements = (varExpr: string): string => `...(${varExpr} as unknown as ${elementsType})`;

	const buildOptionsPreservingCall = (varExpr: string): string => {
		// `data`'s ambient type has no arbitrary storage keys (same reason
		// `storageAccess` above needs its own `unknown` cast) — read the
		// three per-instance fields through one shared cast rather than
		// three separate ones.
		const sourceFields = '(data as unknown as { _separator?: number; _delimiter?: number })';
		const optionParts: string[] = [];
		if (candidateKindNames.length > 0) {
			// `KIND_LITERAL_TEXT` (types.ts) is the single stamped source for
			// kindId→literal-text — no per-kind reverse-arms table to build here.
			optionParts.push(
				`separator: (() => { const sk = ${sourceFields}._separator; return sk === undefined ? undefined : KIND_LITERAL_TEXT.get(sk); })()`
			);
		}
		if (hasLeadingOption || hasTrailingOption) optionParts.push(`delimiter: ${sourceFields}._delimiter`);
		return `${factory}({ ${optionParts.join(', ')} }, ${spreadElements(varExpr)})`;
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
			isSelfUnwrap && hasOptions ? buildOptionsPreservingCall(varExpr) : `${factory}(${spreadElements(varExpr)})`,
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

type KindInterner = (kinds: readonly string[]) => string;

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
	const optChain = inputOptional ? '?' : '';
	const access = `${sourceVar}${optChain}.${field.configKey}`;
	return resolveFieldCall(access, field, isMultiple(field), nodeMap, intern, true, undefined, kindEntries);
}

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
			for (const subtype of node.subtypeNames) visit(subtype);
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

function altKindDiscriminants(
	tokenKinds: readonly string[],
	values: readonly NodeOrTerminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string[] {
	return tokenKinds.map((t) => {
		const stampedId = values.find(
			(v) => isNodeRef(v) && storageKindOfRef(v.node) === t && v.storageKindId !== undefined
		)?.storageKindId;
		const stamped =
			stampedId !== undefined && kindEntries !== undefined
				? kindDiscriminantExprForId(stampedId, kindEntries)
				: undefined;
		return stamped ?? containerTypeCheck(t, kindEntries, nodeMap);
	});
}

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

function resolveScalarParamName(hasBool: boolean, hasInt: boolean, hasFloat: boolean): string {
	return hasBool || hasInt || hasFloat ? 'v' : '_v';
}

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
			// Real arity decides direct-vs-spread — see `soleSlotFacts`'s
			// doc comment for why this reads the slot directly rather than
			// trusting `classifyFactoryShape`'s label for the shape itself.
			childSurface = soleSlotFacts(node, nodeMap)?.multiple ? 'spread' : 'direct';
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
			// 'separatedList' — the factory's spread-with-leading-options
			// signature takes the elements as REST arguments; spread the array
			// into the call (the `unknown` launder is unavoidable here: the
			// overloaded signature's Parameters<> resolves to the
			// options-leading overload, not the rest tuple).
			lines.push(
				`    case ${JSON.stringify(e.kind)}: return (F.${e.factoryName} as (...args: unknown[]) => unknown)(...children);`
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

	lines.push(
		'function _resolveOneBranch<T>(v: _FromFieldInput, kind: string, altKinds?: readonly (string | number)[]): T {'
	);
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

	lines.push(
		'function _resolveManyBranch<T>(v: _FromFieldInput, kind: string, altKinds?: readonly (string | number)[]): readonly T[] {'
	);
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

		const usesKindLiteralText = [...nodeMap.nodes.values()].some(
			(node) => node.modelType === 'separatedList' && node.separatorRule !== undefined
		);
		const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
		emitNamespaceImports(lines, kindEntries, usesKindLiteralText);
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
