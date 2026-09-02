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
import type {
	AssembledNode,
	AssembledNonterminal,
	AssembledEnvelope,
	AssembledPolymorph
} from '../compiler/model/node-map.ts';

type BranchLikeForFrom = AssembledBranch | AssembledEnvelope | AssembledPolymorph;
type FormChildForFrom = AssembledBranch | AssembledEnvelope | AssembledPolymorph;
import {
	isRequired,
	isMultiple,
	slotKindNames,
	slotLiteralValues,
	keywordPresenceKind,
	resolveSingleFieldFactorySlot,
	resolveFieldStorageInfo,
	isHiddenInfraSlot,
	fieldResolverName,
	needsNonEmptyHoist,
	fromEmitsChildrenCoercer,
	fromForwardsToChildFactory,
	fromBareInput,
	scalarLeafKinds,
	classifyFromEmission,
	isWrapChildrenKind,
	soleSlotFacts,
	type SoleSlotFacts,
	canonicalSeparatedListField,
	stringConstructibleTexts,
	wordConstructibleText,
	isAuthoredCompound
} from './shared.ts';
import {
	fieldElementType,
	childElementType,
	kindEnumTextMapExpr,
	delimiterMembersFor,
	separatedListSurface
} from './factories.ts';
import { buildSeparatedListContentSlot, collectSeparatorCandidateKindNames } from './wrap.ts';
import {
	AssembledBranch,
	AbstractAssembledCompound,
	AssembledList,
	AssembledSupertype,
	AssembledPattern,
	AssembledEnum,
	AssembledKeyword,
	AssembledToken,
	isNodeRef,
	storageKindIdByNameOf,
	storageKindOfRef
} from '../compiler/model/node-map.ts';
import type { NodeOrTerminal } from '../compiler/model/node-map.ts';
import type { CodegenEmitter } from './emitter.ts';

const SAFE_IDENT_KEY = /^[A-Za-z_$][\w$]*$/;

export interface EmitFromConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	kindEntries?: readonly KindEnumEntry[];
}

function buildSupertypeByKey(nodeMap: NodeMap): Map<string, string> {
	const supertypeByKey = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
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

function emitNamespaceImports(
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	usesKindLiteralText: boolean,
	usesAttachProps: boolean
): void {
	lines.push(`import * as F from './raw.js';`);
	lines.push(`import type * as T from '../types.js';`);
	if (kindEntries) {
		const valueImports = ['TSKindId', ...(usesKindLiteralText ? ['KIND_LITERAL_TEXT'] : []), 'Delimiter'];
		lines.push(`import { ${valueImports.join(', ')} } from '../types.js';`);
	} else {
		lines.push(`import { Delimiter } from '../types.js';`);
	}
	lines.push(`import type { ${[TYPES_IMPORT_ALWAYS, ...TYPES_IMPORT_OPTIONAL].join(', ')} } from '@sittir/types';`);
	lines.push(
		usesAttachProps
			? "import { coerceKindEnumStorage, coerceMixedEnumStorage, isNodeData, attachProps } from '../utils.js';"
			: "import { coerceKindEnumStorage, coerceMixedEnumStorage, isNodeData } from '../utils.js';"
	);
	lines.push('');
}

const ARGS_HELPER = [
	"/** A function's parameters, including the readonly-rest signatures",
	' *  `Parameters` cannot reflect. */',
	'type _Args<F> = F extends (...args: infer P) => unknown',
	'  ? P',
	'  : F extends (...args: readonly (infer E)[]) => unknown',
	'    ? E[]',
	'    : never;'
].join('\n');

const TYPES_IMPORT_ALWAYS = 'AnyNodeData';
const TYPES_IMPORT_OPTIONAL = ['LooseValue', 'NonEmptyArray'] as const;

function emitFromFieldInputType(lines: string[]): void {
	lines.push('/** Runtime-narrowed field input bag for generated from() helpers. */');
	lines.push('type _LooseFieldInput = unknown;');
	lines.push('');
	lines.push(ARGS_HELPER);
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
		if (
			node instanceof AssembledToken ||
			node instanceof AssembledSupertype ||
			(node instanceof AbstractAssembledCompound && node.hoisted)
		)
			continue;
		if (!node.fromFunctionName) continue;
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

export namespace from {
	export function leaf(
		output: string[],
		node: AssembledNode,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		if (!node.rawFactoryName || !node.fromFunctionName) return;
		let result: string | undefined;
		if (node instanceof AssembledPattern) {
			result = emitStringLikeFrom(node);
		} else if (node instanceof AssembledEnum) {
			result = emitStringLikeFrom({
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				fromFunctionName: node.fromFunctionName,
				enumValues: node.values
			});
		} else if (node instanceof AssembledKeyword) {
			result = emitKeywordFrom(node);
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
		node: AssembledList,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		const result = emitSeparatedListFrom(node, kindEntries, nodeMap);
		if (result) output.push(result);
	}
}

interface BranchLikeNode {
	readonly kind: string;
	readonly typeName: string;
	readonly fromInputTypeName: string;
	readonly rawFactoryName?: string;
	readonly fromFunctionName?: string;
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

function emitBranchNodeDataPassthrough(
	lines: string[],
	inputOptional: boolean,
	returnType: string,
	typeName: string
): void {
	const configType = `T.${typeName}.LooseConfig${inputOptional ? ' | undefined' : ''}`;
	lines.push(`  if (!_isLooseConfig<${configType}>(input)) return input as unknown as ${returnType};`);
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

	const branchTarget = targetNode instanceof AbstractAssembledCompound && !targetNode.hoisted ? targetNode : null;
	if (branchTarget !== null && fromForwardsToChildFactory(branchTarget, nodeMap)) {
		const facts = soleSlotFacts(branchTarget, nodeMap);
		if (!facts) return null;
		if (facts.multiple || !facts.required) return targetNode.rawFactoryName;
		return null;
	}

	if (!(targetNode instanceof AbstractAssembledCompound)) {
		return null;
	}
	const targetFields = targetNode.slots;
	const hasBlockingField = targetFields.some((f) => isRequired(f));
	if (hasBlockingField) return null;
	return targetNode.rawFactoryName;
}

function emitBranchFrom(
	node: FormChildForFrom,
	nodeMap: NodeMap,
	intern: KindInterner,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (fromEmitsChildrenCoercer(node, nodeMap)) {
		return emitChildrenFrom(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				fromFunctionName: node.fromFunctionName,
				slots: node.slots,
				childSlotFacts: soleSlotFacts(node, nodeMap)
			},
			kindEntries,
			nodeMap,
			intern
		);
	}

	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	const slots = node.slots;
	const opt = slots.some((f) => isRequired(f)) ? '' : '?';
	const typeName = node.typeName;
	const lines: string[] = [];
	const returnType = factoryReturnTypeExpr(factory);
	const soleField = !nodeMap.polymorphFormKinds.has(node.kind)
		? resolveSingleFieldFactorySlot(node, nodeMap)
		: undefined;
	const canDirectFactoryCall = soleField && fromBareInput(node, nodeMap) === 'value';
	const { inputType, inputOptional } = buildBranchSignatureParts(node, factory, opt);
	const resolverSlots = slots;
	for (const f of resolverSlots) {
		const body = resolveFieldCall('value', f, isMultiple(f), nodeMap, intern, true, undefined, kindEntries);
		const key = JSON.stringify(f.configKey);
		const signature = `export function ${fieldResolverName(typeName, f)}(value: T.${typeName}.LooseConfig[${key}]): T.${typeName}[${JSON.stringify(f.storageKey)}] {`;
		if (needsNonEmptyHoist(f, nodeMap)) {
			lines.push(
				signature,
				`  const resolved = ${body};`,
				`  _assertNonEmpty(resolved, '${node.kind}.${f.propertyName}');`,
				'  return resolved;',
				'}',
				''
			);
		} else {
			lines.push(signature, `  return ${body};`, '}', '');
		}
	}
	const resolverFor = new Set(resolverSlots.map((f) => f.propertyName));
	const fieldValue = (f: AssembledNonterminal, valueExpr: string): string =>
		resolverFor.has(f.propertyName)
			? `${fieldResolverName(typeName, f)}(${valueExpr})`
			: resolveFieldCall(valueExpr, f, isMultiple(f), nodeMap, intern, true, undefined, kindEntries);
	lines.push(`export function ${fn}(input${opt}: ${inputType}): ${returnType} {`);
	if (slots.length > 0) {
		if (canDirectFactoryCall) {
			lines.push(
				`  if (${inputOptional ? 'input !== undefined && ' : ''}isNodeData(input) && (input.$type as string | number) === ${kindDiscriminantCheck(node.kind, kindEntries, nodeMap)}) return input as unknown as ${returnType};`
			);
		} else {
			emitBranchNodeDataPassthrough(lines, inputOptional, returnType, typeName);
		}
		const neName = (f: AssembledNonterminal) => `_ne_${f.propertyName}`;
		for (const f of slots) {
			if (needsNonEmptyHoist(f, nodeMap) && !resolverFor.has(f.propertyName)) {
				const call = fieldValue(f, `input${inputOptional ? '?' : ''}.${f.configKey}`);
				lines.push(`  const ${neName(f)} = ${call};`);
				lines.push(`  _assertNonEmpty(${neName(f)}, '${node.kind}.${f.propertyName}');`);
			}
		}
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
			const guardedCall = isRequired(soleField)
				? `_requireField(${JSON.stringify(node.kind)}, ${JSON.stringify(soleField.configKey)}, ${call})`
				: call;
			lines.push(`  return ${factory}(${guardedCall});`);
		} else {
			lines.push(`  return ${factory}({`);
			for (const f of slots) {
				if (needsNonEmptyHoist(f, nodeMap) && !resolverFor.has(f.propertyName)) {
					lines.push(`    ${f.configKey}: ${neName(f)},`);
				} else {
					const call = fieldValue(f, `input${inputOptional ? '?' : ''}.${f.configKey}`);
					const defaultFactory = canDefaultToEmpty(f, nodeMap);
					if (defaultFactory) {
						lines.push(`    ${f.configKey}: ${call} ?? F.${defaultFactory}(),`);
					} else if (isRequired(f)) {
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
		emitBranchNodeDataPassthrough(lines, inputOptional, returnType, typeName);
		lines.push(`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`);
	}
	lines.push('}');
	return lines.join('\n');
}

interface ChildrenFromNode {
	readonly kind: string;
	readonly typeName: string;
	readonly rawFactoryName?: string;
	readonly fromFunctionName?: string;
	readonly slots?: readonly AssembledNonterminal[];
	readonly childSlotFacts: SoleSlotFacts | null;
}

function kindDiscriminantCheck(
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string {
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
	unwrapConfigKey: string | undefined,
	buildCallExpr: (varExpr: string, isSelfUnwrap: boolean) => string,
	childrenTypeAnnotation = ''
): string {
	const typeCheck = kindDiscriminantCheck(kind, kindEntries, nodeMap);
	const hasNumericDiscriminant = kindEntries?.some((e) => e.kind === kind) ?? false;
	const unwrap =
		unwrapConfigKey === undefined
			? []
			: [
					`  const _elems: readonly unknown[] = (() => {`,
					`    if (input.length !== 1) return input;`,
					`    const head: unknown = input[0];`,
					`    if (typeof head !== 'object' || head === null || isNodeData(head) || !(${JSON.stringify(unwrapConfigKey)} in head)) return input;`,
					`    const v = (head as Record<string, unknown>)[${JSON.stringify(unwrapConfigKey)}];`,
					`    return Array.isArray(v) ? v : [v];`,
					`  })();`
				];
	const configShape =
		unwrapConfigKey === undefined
			? ''
			: ` | { ${SAFE_IDENT_KEY.test(unwrapConfigKey) ? unwrapConfigKey : JSON.stringify(unwrapConfigKey)}: ${elementType} | readonly (${elementType})[] }`;
	const freshVar = unwrapConfigKey === undefined ? 'input' : '_elems';
	if (!hasNumericDiscriminant) {
		return [
			`export function ${fn}(...input: readonly (${elementType} | ${tName}${configShape})[]): ${factoryReturnTypeExpr(factory)} {`,
			...unwrap,
			`  return ${buildCallExpr(freshVar, false)};`,
			'}'
		].join('\n');
	}
	const storageAccess = SAFE_IDENT_KEY.test(storageKey)
		? `(data as unknown as { ${storageKey}?: unknown }).${storageKey}`
		: `(data as unknown as Record<string, unknown>)[${JSON.stringify(storageKey)}]`;
	return [
		`export function ${fn}(...input: readonly (${elementType} | ${tName}${configShape})[]): ${factoryReturnTypeExpr(factory)} {`,
		`  if (input.length === 1 && isNodeData(input[0]) && input[0].$type === ${typeCheck}) {`,
		`    const data = input[0];`,
		`    const stored = ${storageAccess};`,
		`    const children${childrenTypeAnnotation} = stored === undefined ? [] : Array.isArray(stored) ? stored : [stored];`,
		`    return ${buildCallExpr('children', true)};`,
		`  }`,
		...unwrap,
		`  return ${buildCallExpr(freshVar, false)};`,
		'}'
	].join('\n');
}

function emitRepeatedChildrenFrom(
	fn: string,
	factory: string,
	tName: string,
	elementType: string,
	slot: AssembledNonterminal,
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	intern: KindInterner,
	storageKey: string
): string {
	const resolvable = slotLiteralValues(slot).length === 0;
	return emitRestParamFromResolver(
		fn,
		factory,
		tName,
		resolvable ? looseElementType(elementType, slot, nodeMap) : elementType,
		kind,
		kindEntries,
		nodeMap,
		storageKey,
		slot.configKey,
		(varExpr) =>
			resolvable
				? `${factory}(...(${resolveFieldCall(varExpr, slot, true, nodeMap, intern, false, elementType, kindEntries)} as unknown as Parameters<typeof ${factory}>))`
				: `${factory}(...(${varExpr} as unknown as Parameters<typeof ${factory}>))`
	);
}

function looseElementType(elementType: string, slot: AssembledNonterminal, nodeMap: NodeMap): string {
	const expanded = expandAndDedupeContentTypes(slotKindNames(slot), nodeMap, storageKindIdByNameOf(slot));
	const { leafKinds, branchKinds } = classifyKindsForResolver(expanded, nodeMap);
	return leafKinds.length > 0 && branchKinds.length === 0 ? `${elementType} | string` : elementType;
}

function emitSingularChildrenFrom(
	fn: string,
	factory: string,
	tName: string,
	elementType: string,
	slot: AssembledNonterminal,
	intern: KindInterner,
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	storageKey: string,
	inputWiden?: string
): string {
	const typeCheck = kindDiscriminantCheck(kind, kindEntries, nodeMap);
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
		`export function ${fn}(input?: ${slotLiteralValues(slot).length === 0 ? looseElementType(elementType, slot, nodeMap) : elementType}${inputWiden !== undefined ? ` | ${inputWiden}` : ''} | ${tName}): ${factoryReturnTypeExpr(factory)} {`,
		`  if (isNodeData(input) && input.$type === ${typeCheck}) {`,
		`    const data = input;`,
		`    const child = ${storageAccess};`,
		`    return ${factory}(child as Parameters<typeof ${factory}>[0]);`,
		`  }`,
		`  return ${factory}(${
			slotLiteralValues(slot).length === 0
				? resolveFieldCall('input', slot, false, nodeMap, intern, false, elementType, kindEntries)
				: `input as Parameters<typeof ${factory}>[0]`
		});`,
		'}'
	].join('\n');
}

function emitChildrenFrom(
	node: ChildrenFromNode,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	intern: KindInterner
): string {
	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	const tName = `T.${node.typeName}`;
	const facts = node.childSlotFacts;
	const elementType = facts
		? childElementType({ children: node.slots ?? [] }, nodeMap)
		: `NonNullable<T.${node.typeName}['$other']> extends readonly [infer E] ? E : NonNullable<T.${node.typeName}['$other']>`;
	let inputWiden: string | undefined;
	if (facts && !facts.multiple) {
		const kinds = slotKindNames(facts.slot);
		const inner = kinds.length === 1 ? nodeMap.nodes.get(kinds[0]!) : undefined;
		if (inner instanceof AssembledList) {
			inputWiden = separatedListSurface(inner, nodeMap, kindEntries).elemType;
		}
	}
	const storageKey = facts ? facts.slot.storageKey : '$other';
	if (facts === null) {
		return [
			`export function ${fn}(input?: ${elementType} | ${tName}): ${factoryReturnTypeExpr(factory)} {`,
			`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
			'}'
		].join('\n');
	}
	if (facts.multiple) {
		return emitRepeatedChildrenFrom(
			fn,
			factory,
			tName,
			elementType,
			facts.slot,
			node.kind,
			kindEntries,
			nodeMap,
			intern,
			storageKey
		);
	}
	return emitSingularChildrenFrom(
		fn,
		factory,
		tName,
		elementType,
		facts.slot,
		intern,
		node.kind,
		kindEntries,
		nodeMap,
		storageKey,
		inputWiden
	);
}

function emitSeparatedListFrom(
	node: AssembledList,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string | undefined {
	if (!node.rawFactoryName || !node.fromFunctionName) return undefined;
	const fn = node.fromFunctionName;
	const factory = `F.${node.rawFactoryName}`;
	const tName = `T.${node.typeName}`;
	const contentSlot = buildSeparatedListContentSlot(node);
	const elemType = separatedListSurface(node, nodeMap, kindEntries).elemType;
	void contentSlot;
	const contentStorageKey = node.slots.length > 1 ? '_content' : canonicalSeparatedListField(node).storageKey;

	const hasSeparatorKindOption = node.separatorRule !== undefined;
	const candidateKindNames = hasSeparatorKindOption
		? collectSeparatorCandidateKindNames(node.separatorRule!).filter((k) => hasCatalogEntry(kindEntries, k))
		: [];
	const hasLeadingOption = node.leadingDelimiter === 'optional';
	const hasTrailingOption = node.trailingDelimiter === 'optional';
	const hasOptions = hasSeparatorKindOption || hasLeadingOption || hasTrailingOption;

	const elemTypeForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
	const elementsType = node.nonEmpty ? `NonEmptyArray<${elemType}>` : `${elemTypeForArray}[]`;
	const spreadElements = (varExpr: string): string => `...(${varExpr} as unknown as ${elementsType})`;

	const buildOptionsPreservingCall = (varExpr: string): string => {
		const sourceFields = '(data as unknown as { _separator?: number; _delimiter?: T.Delimiter })';
		const optionParts: string[] = [];
		if (candidateKindNames.length > 0) {
			const guard = candidateKindNames.map((k) => `t === ${JSON.stringify(k)}`).join(' || ');
			optionParts.push(
				`separator: (() => { const sk = ${sourceFields}._separator; const t = sk === undefined ? undefined : KIND_LITERAL_TEXT.get(sk); return ${guard} ? t : undefined; })()`
			);
		}
		if (hasLeadingOption || hasTrailingOption) {
			const guard = delimiterMembersFor(node)
				.map((m) => `d === ${m}`)
				.join(' || ');
			optionParts.push(
				`delimiter: (() => { const d = ${sourceFields}._delimiter; return ${guard} ? d : undefined; })()`
			);
		}
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
		undefined,
		(varExpr, isSelfUnwrap) =>
			isSelfUnwrap && hasOptions ? buildOptionsPreservingCall(varExpr) : `${factory}(${spreadElements(varExpr)})`,
		': readonly unknown[]'
	);
}

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
		`export function ${fn}(input: T.${node.typeName}.Loose): ${factoryReturnTypeExpr(factory)} {`,
		`  if (typeof input !== 'string') return input as unknown as ${factoryReturnTypeExpr(factory)};`,
		`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
		'}'
	].join('\n');
}

function emitKeywordFrom(node: LeafFromNode): string {
	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	return [
		`export function ${fn}(_input?: T.${node.typeName}.Loose): ${factoryReturnTypeExpr(factory)} {`,
		`  return ${factory}();`,
		'}'
	].join('\n');
}

type KindInterner = (kinds: readonly string[]) => string;

function expandAndDedupeContentTypes(
	contentTypes: readonly string[],
	nodeMap: NodeMap,
	idByKind?: ReadonlyMap<string, number>
): string[] {
	const seen = new Set<string>();
	const expanded: string[] = [];
	const visit = (kind: string): void => {
		const node = nodeMap.nodes.get(kind);
		if (node instanceof AssembledSupertype) {
			for (const subtype of node.subtypeNames) visit(subtype);
			return;
		}
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
			branchKinds.push(t);
			continue;
		}
		if (n instanceof AssembledPattern || n instanceof AssembledEnum || n instanceof AssembledKeyword) {
			leafKinds.push(t);
		} else if (n instanceof AssembledToken) {
			tokenKinds.push(t);
		} else {
			branchKinds.push(t);
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
		return stamped ?? kindDiscriminantCheck(t, kindEntries, nodeMap);
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
	const tArg = elementType ? `<${elementType}>` : '';
	return `${helper}${tArg}(${prop}, ${leafArr}, ${branchArr})`;
}

function resolveFieldCall(
	prop: string,
	field: { values: readonly NodeOrTerminal[] },
	fieldMultiple: boolean,
	nodeMap: NodeMap,
	intern: KindInterner,
	applyKeywordPresence = true,
	elementTypeOverride?: string,
	kindEntries?: readonly KindEnumEntry[]
): string {
	if (applyKeywordPresence) {
		const kwCall = keywordPresenceResolverCall(prop, field, nodeMap);
		if (kwCall !== undefined) return kwCall;
	}

	const storageInfo = 'name' in field ? resolveFieldStorageInfo(field as AssembledNonterminal, nodeMap) : undefined;

	const expanded = expandAndDedupeContentTypes(slotKindNames(field), nodeMap, storageKindIdByNameOf(field));
	const { leafKinds, branchKinds, tokenKinds } = classifyKindsForResolver(expanded, nodeMap);

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
		const table = kindEnumTextMapExpr(field as AssembledNonterminal, nodeMap, kindEntries);
		return `coerceKindEnumStorage(_resolveKindEnumScalar(${prop}, () => ${baseCall}), ${table})`;
	}
	if (storageInfo?.kind === 'mixedEnum') {
		const table = kindEnumTextMapExpr(field as AssembledNonterminal, nodeMap, kindEntries);
		return `coerceMixedEnumStorage(_resolveKindEnum(${prop}, () => ${baseCall}), ${table})`;
	}
	return baseCall;
}

function keywordPresenceResolverCall(
	prop: string,
	field: { values: readonly NodeOrTerminal[] },
	nodeMap: NodeMap
): string | undefined {
	const kw = keywordPresenceKind(field as AssembledNonterminal, nodeMap);
	if (kw === null) return undefined;
	if (kw === 'boolean') return `_resolveBooleanKeyword(${prop})`;
	return `_resolveBitflag(${prop})`;
}

function buildLeafRegistryEntries(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string[] {
	const registryEntries: string[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (kind.startsWith('_')) continue;
		if (!node.rawFactoryName) continue;
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		const factory = `F.${node.rawFactoryName}`;
		if (node instanceof AssembledEnum) {
			const values = node.values.map((v) => JSON.stringify(v)).join(', ');
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { values: [${values}], factory: (text: string) => ${factory}(text as Parameters<typeof ${factory}>[0]) },`
			);
		} else if (node instanceof AssembledKeyword) {
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { values: [${JSON.stringify(node.text)}], factory: () => ${factory}() },`
			);
		} else if (node instanceof AssembledPattern) {
			registryEntries.push(`  ${JSON.stringify(kind)}: { factory: ${factory} },`);
		}
	}
	return registryEntries;
}

function emitResolveByKindHelper(lines: string[]): void {
	lines.push('function _isFromKind(k: string): k is keyof _FromMap {');
	lines.push('  return k in _fromMap;');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveByKind<K extends keyof _FromMap>(');
	lines.push('  kind: K,');
	lines.push('  rest: _LooseFieldInput,');
	lines.push('): ReturnType<_FromMap[K]> {');
	lines.push('  const fn = _fromMap[kind] as (rest: _LooseFieldInput) => ReturnType<_FromMap[K]>;');
	lines.push('  return fn(rest);');
	lines.push('}');
	lines.push('');
}

function resolveScalarParamName(hasBool: boolean, hasInt: boolean, hasFloat: boolean): string {
	return hasBool || hasInt || hasFloat ? 'v' : '_v';
}

function emitResolveOneHelper(lines: string[]): void {
	lines.push('function _resolveOne<T>(');
	lines.push('  v: _LooseFieldInput,');
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
	lines.push('  if (typeof v === "string") {');
	lines.push('    const bk = _KEYWORD_BRANCH_BY_TEXT[v];');
	lines.push('    if (bk !== undefined && branchKinds.includes(bk)) {');
	lines.push('      const build = _KEYWORD_BRANCH_BUILD[bk];');
	lines.push('      if (build !== undefined) return build() as T;');
	lines.push('      if (_isFromKind(bk)) return _resolveByKind(bk, {}) as T;');
	lines.push('    }');
	lines.push('    const fwd = branchKinds.length === 1 ? branchKinds[0]! : undefined;');
	lines.push(
		'    if (fwd !== undefined && _STRING_CAPABLE_BRANCHES.has(fwd) && _isFromKind(fwd)) return _resolveByKind(fwd, v) as T;'
	);
	lines.push('  }');
	lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {');
	lines.push('    const { kind, ...rest } = v;');
	lines.push('    if (typeof kind === "string" && _isFromKind(kind)) return _resolveByKind(kind, rest) as T;');
	lines.push('  }');
	lines.push('  if (branchKinds.length === 1 && typeof v === "object" && !Array.isArray(v)) {');
	lines.push('    const bk = branchKinds[0]!;');
	lines.push('    if (_isFromKind(bk)) return _resolveByKind(bk, v) as T;');
	lines.push('  }');
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

function emitLooseConfigGuard(lines: string[]): void {
	lines.push('/** Narrows a coercer input to its config arm. A bare `isNodeData` check');
	lines.push(' *  cannot: the NodeData arm is not a strict subtype of the config arm, so');
	lines.push(' *  negative narrowing leaves it in place. */');
	lines.push('function _isLooseConfig<C>(v: C | AnyNodeData): v is C {');
	lines.push('  return !isNodeData(v);');
	lines.push('}');
}

function emitRequireFieldHelper(lines: string[]): void {
	lines.push('function _requireField<T>(kind: string, slot: string, v: T | undefined | null): T {');
	lines.push('  if (v === undefined || v === null) {');
	lines.push("    throw new Error(`Missing required slot '${slot}' on ${kind}.from()`);");
	lines.push('  }');
	lines.push('  return v;');
	lines.push('}');
}

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
		if (!isWrapChildrenKind(kind, node, nodeMap, kindEntries)) continue;
		const factoryName = node.rawFactoryName;
		const entry = kindEntries === undefined ? undefined : findKindEntry(kindEntries, kind);
		if (factoryName === undefined || entry === undefined) continue;
		const childSurface: 'direct' | 'spread' | 'array' =
			node instanceof AssembledList ? 'array' : soleSlotFacts(node, nodeMap)?.multiple ? 'spread' : 'direct';
		entries.push({
			kind,
			factoryName,
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

	lines.push('const _wrapKindIds: { readonly [kind: string]: number } = {');
	for (const e of entries) {
		lines.push(`  ${JSON.stringify(e.kind)}: ${e.kindIdExpr},`);
	}
	lines.push('};');
	lines.push('');

	lines.push('function _wrapWithChildren(kind: string, children: readonly unknown[]): unknown {');
	lines.push('  switch (kind) {');
	for (const e of entries) {
		if (e.childSurface === 'spread') {
			lines.push(
				`    case ${JSON.stringify(e.kind)}: return F.${e.factoryName}(...(children as Parameters<typeof F.${e.factoryName}>));`
			);
		} else if (e.childSurface === 'array') {
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
	lines.push('  readonly factory: (text: string) => AnyNodeData | number;');
	lines.push('}');
	lines.push('const _leafRegistry: { readonly [kind: string]: _LeafEntry } = {');
	for (const entry of registryEntries) lines.push(entry);
	lines.push('};');
	lines.push('');

	lines.push('function _resolveLeafString(v: string, kinds: readonly string[]): AnyNodeData | number | undefined {');
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

	lines.push("/** A kind-enum slot's loose input. A NUMBER is already the slot's own");
	lines.push(' *  stored discriminant; every other shape resolves as a leaf. */');
	lines.push('function _resolveKindEnum<T>(v: _LooseFieldInput, resolve: () => T): T {');
	lines.push('  return typeof v === "number" ? (v as T) : resolve();');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveKindEnumScalar<T>(v: _LooseFieldInput, resolve: () => T): T {');
	lines.push('  return typeof v === "number" || typeof v === "string" ? (v as T) : resolve();');
	lines.push('}');
	lines.push('');

	const scalars = scalarLeafKinds(nodeMap);
	const scalarParam = resolveScalarParamName(
		scalars.boolean !== undefined,
		scalars.integer !== undefined,
		scalars.float !== undefined
	);
	lines.push(`function _resolveScalar(${scalarParam}: boolean | number): AnyNodeData | number | undefined {`);
	if (scalars.boolean !== undefined) {
		lines.push('  if (typeof v === "boolean") {');
		lines.push(`    const e = _leafRegistry[${JSON.stringify(scalars.boolean)}];`);
		lines.push('    return e ? e.factory(v ? "true" : "false") : undefined;');
		lines.push('  }');
	}
	if (scalars.integer !== undefined || scalars.float !== undefined) {
		lines.push('  if (typeof v === "number") {');
		if (scalars.integer !== undefined) {
			lines.push(`    if (Number.isInteger(v)) {`);
			lines.push(`      const e = _leafRegistry[${JSON.stringify(scalars.integer)}];`);
			lines.push(`      return e ? e.factory(String(v)) : undefined;`);
			lines.push(`    }`);
		}
		if (scalars.float !== undefined) {
			lines.push(`    const e = _leafRegistry[${JSON.stringify(scalars.float)}];`);
			lines.push(`    return e ? e.factory(String(v)) : undefined;`);
		}
		lines.push('  }');
	}
	lines.push('  return undefined;');
	lines.push('}');
	lines.push('');

	const byText: [string, string][] = [];
	const buildByKind: [string, string][] = [];
	const stringCapable: string[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (!isAuthoredCompound(node)) continue;
		const own = wordConstructibleText(node, nodeMap);
		if (own !== undefined && node.rawFactoryName !== undefined) {
			byText.push([own, kind]);
			buildByKind.push([kind, node.rawFactoryName]);
		} else if (
			!kind.startsWith('_') &&
			node.fromFunctionName !== undefined &&
			stringConstructibleTexts(kind, nodeMap).length > 0
		) {
			stringCapable.push(kind);
		}
	}
	lines.push('const _KEYWORD_BRANCH_BY_TEXT: Record<string, string | undefined> = {');
	for (const [text, k] of byText) lines.push(`  ${JSON.stringify(text)}: ${JSON.stringify(k)},`);
	lines.push('};');
	lines.push('const _KEYWORD_BRANCH_BUILD: Record<string, (() => AnyNodeData | number) | undefined> = {');
	for (const [k, factory] of buildByKind) lines.push(`  ${JSON.stringify(k)}: () => F.${factory}(),`);
	lines.push('};');
	lines.push(`const _STRING_CAPABLE_BRANCHES: ReadonlySet<string> = new Set(${JSON.stringify(stringCapable)});`);
	lines.push('');

	emitResolveOneHelper(lines);

	lines.push('function _resolveMany<T>(');
	lines.push('  v: _LooseFieldInput,');
	lines.push('  leafKinds: readonly string[],');
	lines.push('  branchKinds: readonly string[],');
	lines.push('): readonly T[] {');
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _LooseFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOne<T>(e, leafKinds, branchKinds));');
	lines.push('}');
	lines.push('');

	lines.push('function _resolveOneLeaf<T>(v: _LooseFieldInput, kind: string): T {');
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
	lines.push('  if (typeof v === "object") {');
	lines.push(
		"    throw new Error(`_resolveOneLeaf: cannot resolve value to leaf kind '${kind}': ${JSON.stringify(v)}`);"
	);
	lines.push('  }');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');

	emitWrapWithChildrenTable(lines, nodeMap, kindEntries);

	lines.push(
		'function _resolveOneBranch<T>(v: _LooseFieldInput, kind: string, altKinds?: readonly (string | number)[]): T {'
	);
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (isNodeData(v)) {');
	lines.push('    const wrapId = _wrapKindIds[kind];');
	lines.push('    if (wrapId !== undefined && v.$type !== wrapId) {');
	lines.push('      if (altKinds !== undefined && altKinds.some(k => k === v.$type)) return v as T;');
	lines.push('      return _wrapWithChildren(kind, [v]) as T;');
	lines.push('    }');
	lines.push('    return v as T;');
	lines.push('  }');
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
	lines.push('  if (typeof v === "object" && !Array.isArray(v)) {');
	lines.push('    if ("kind" in v) {');
	lines.push('      const { kind: k, ...rest } = v;');
	lines.push('      if (typeof k === "string" && _isFromKind(k)) return _resolveByKind(k, rest) as T;');
	lines.push('    }');
	lines.push('    if (_isFromKind(kind)) return _resolveByKind(kind, v) as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "object") {');
	lines.push(
		"    throw new Error(`_resolveOneBranch: cannot resolve value to branch kind '${kind}': ${JSON.stringify(v)}`);"
	);
	lines.push('  }');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');

	lines.push('function _resolveManyLeaf<T>(v: _LooseFieldInput, kind: string): readonly T[] {');
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _LooseFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOneLeaf<T>(e, kind));');
	lines.push('}');
	lines.push('');

	lines.push(
		'function _resolveManyBranch<T>(v: _LooseFieldInput, kind: string, altKinds?: readonly (string | number)[]): readonly T[] {'
	);
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _LooseFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOneBranch<T>(e, kind, altKinds));');
	lines.push('}');
	lines.push('');

	lines.push('function _resolveBooleanKeyword<T>(v: _LooseFieldInput): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (v === true || v === false) return v as T;');
	lines.push('  if (isNodeData(v)) return v as T;');
	lines.push('  if (Array.isArray(v)) return v as T;');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveBitflag<T>(v: _LooseFieldInput): T {');
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
	emitLooseConfigGuard(lines);
	emitRequireFieldHelper(lines);
}

function unexported(block: string): string {
	return block.replace(/^export function /gm, 'function ');
}

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
			(node) => node instanceof AssembledList && node.separatorRule !== undefined
		);
		const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
		emitNamespaceImports(lines, kindEntries, usesKindLiteralText, false);
		emitFromFieldInputType(lines);

		this.#nodeMap = nodeMap;
		this.#kindEntries = kindEntries;
		this.#internKinds = internKinds;
		this.#kindTableLiterals = kindTableLiterals;
		this.#namedEntries = namedEntries;
		this.#preambleLines = lines;
	}

	emitLeaf(node: AssembledPattern | AssembledEnum | AssembledKeyword): void {
		from.leaf(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitBranch(node: BranchLikeForFrom): void {
		from.branch(this.#output, node, this.#nodeMap, this.#internKinds, this.#kindEntries);
	}

	emitSeparatedList(node: AssembledList): void {
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
		if (node instanceof AssembledList) {
			this.emitSeparatedList(node);
			return;
		}
		if (node instanceof AbstractAssembledCompound) {
			this.emitBranch(node);
			return;
		}
		if (node instanceof AssembledPattern || node instanceof AssembledEnum || node instanceof AssembledKeyword) {
			this.emitLeaf(node);
		}
	}

	#localFormChildCoercers(): string[] {
		const context = { nodeMap: this.#nodeMap, kindEntries: this.#kindEntries };
		const needed = new Set<string>();
		for (const [kind, node] of this.#nodeMap.nodes) {
			if (classifyFromEmission(kind, node, context) !== 'emit') continue;
		}
		return [...needed].map((kind) =>
			unexported(
				emitBranchFrom(
					this.#nodeMap.nodes.get(kind) as FormChildForFrom,
					this.#nodeMap,
					this.#internKinds,
					this.#kindEntries
				)
			)
		);
	}

	finalize(): string {
		const localCoercers = this.#localFormChildCoercers();
		const lines = [...this.#preambleLines];
		emitFromMapDeclaration(lines, this.#nodeMap, this.#kindEntries);
		emitResolverHelpers(lines, this.#nodeMap, this.#kindEntries);
		lines.push('');
		emitInternedKindTable(lines, this.#namedEntries, this.#kindTableLiterals);
		for (const block of [...localCoercers, ...this.#output]) {
			lines.push(block);
			lines.push('');
		}
		const body = lines.filter((l) => !l.startsWith('import ')).join('\n');
		const usesArgs = lines.some((l) => l !== ARGS_HELPER && /\b_Args</.test(l));
		const pruned = lines.flatMap((l) => {
			if (!usesArgs && l === ARGS_HELPER) return [];
			if (!/\bDelimiter\./.test(body)) {
				if (l === `import { Delimiter } from './types.js';`) return [];
				l = l.replace(`, Delimiter } from './types.js';`, ` } from './types.js';`);
			}
			if (l.endsWith(`} from '@sittir/types';`)) {
				const used = TYPES_IMPORT_OPTIONAL.filter((name) => new RegExp(`\\b${name}\\b`).test(body));
				return [`import type { ${[TYPES_IMPORT_ALWAYS, ...used].join(', ')} } from '@sittir/types';`];
			}
			return [l];
		});
		return pruned.join('\n');
	}
}
