import { findOwnKindEntry } from '../dsl/symbol-table.ts';
import type { AuthoredCompound, FullForm } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { defaultConcreteKindOf, isBuilderTextLeaf, isBuilderlessPunctuationLeaf } from '../compiler/model/node-map.ts';
import { bareInteriorText, interiorOf, interiorSlotGuards, numberInputTest, numberInputType, numberTextArgs, numericLeafKinds, numericLeafShape, numericSlotShape, type NumberShape } from './interior.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
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
	FieldStorageInfo
} from '../compiler/model/node-map.ts';

type BranchLikeForFrom = AuthoredCompound;
type FormChildForFrom = AuthoredCompound;
import { anchoredLeafRegex } from '../compiler/model/leaf-pattern.ts';
import { siblingLeads, type TriviaSibling } from '../compiler/model/trivia.ts';
import {
	DELIMITER_IMPORT,
	classifyFactoryShape,
	expandAndDedupeContentTypes,
	withEmptyOverload,
	isRequired,
	isMultiple,
	slotKindNames,
	slotLiteralValues,
	keywordPresenceKind,
	resolveSingleFieldFactorySlot,
	resolveFieldStorageInfo,
	bareValueSlot,
	lexedContentSlot,
	fieldResolverName,
	needsNonEmptyHoist,
	fromEmitsChildrenCoercer,
	fromBareInput,
	canDefaultToEmpty,
	scalarLeafKinds,
	classifyFromEmission,
	isWrapChildrenKind,
	soleSlotFacts,
	type SoleSlotFacts,
	canonicalSeparatedListField,
	stringConstructibleTexts,
	wordConstructibleText,
	isAuthoredCompound,
	listRestParamType,
	transparentContentKindNames,
	isAffixedLeaf,
	transparentWrapperContentSlot,
	referencedKinds,
	classifyFactoryEmission,
	registeredSlots,
	pruneUnusedImports
} from './shared.ts';
import {
	fieldElementType,
	childElementType,
	kindEnumTextMapExpr,
	keywordArmTextMapExpr,
	delimiterMembersFor,
	listHasOptions,
	separatedListSurface,
	spellingTypeOf,
	listOptionKeys
} from './factories.ts';
import { buildSeparatedListContentSlot } from './wrap.ts';
import {
	AssembledAlias,
	AbstractAssembledCompound,
	AssembledList,
	AssembledSupertype,
	AssembledEnvelope,
	AssembledPattern,
	AssembledEnum,
	AssembledKeyword,
	AssembledPunctuation,
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

function emitNamespaceImports(lines: string[], kindEntries: readonly KindEnumEntry[] | undefined): void {
	lines.push(`import * as F from './raw.js';`);
	lines.push(`import type * as T from '../types.js';`);
	if (kindEntries) {
		lines.push(`import { TSKindId, KIND_NAMES } from '../types.js';`);
	}
	lines.push(DELIMITER_IMPORT);
	lines.push(`import type { ${[TYPES_IMPORT_ALWAYS, ...TYPES_IMPORT_OPTIONAL].join(', ')} } from '@sittir/types';`);
	lines.push("import { coerceKindEnumStorage, coerceMixedEnumStorage } from '@sittir/common/utils';");
	lines.push("import { isNode } from '../utils.js';");
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
const TYPES_IMPORT_OPTIONAL = ['LooseValue', 'NonEmptyArray', 'WidenNumeric', 'SiblingLeadRefusal', 'SpelledAffix', 'WithSpelling'] as const;

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
		if (classifyFromEmission(kind, node, { nodeMap, kindEntries }) !== 'emit') continue;
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
		_nodeMap: NodeMap,
		_kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		if (!node.rawFactoryName || !node.fromFunctionName) return;
		let result: string | undefined;
		if (node instanceof AssembledPattern) {
			result = emitStringLikeFrom(node, numericLeafShape(node.kind, node));
		} else if (isBuilderTextLeaf(node)) {
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
		intern: KindInterner,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		const result = emitSeparatedListFrom(node, kindEntries, nodeMap, intern);
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
	typeName: string,
	bare: false | 'text' | NumberShape = false
): void {
	const configType = `T.${typeName}.LooseConfig${bare ? ' | string' : ''}${typeof bare === 'object' ? ` | ${numberInputType(bare)}` : ''}${inputOptional ? ' | undefined' : ''}`;
	lines.push(`  if (!_isLooseConfig<${configType}>(input)) return input as unknown as ${returnType};`);
}

function refuseSiblingLeadExpr(interior: string, siblings: readonly TriviaSibling[]): string {
	if (siblings.length === 0) return interior;
	const leads = siblings.map(
		(sibling) => `[/${sibling.lead.source}/${sibling.lead.flags}, ${JSON.stringify(sibling.builder)}]`
	);
	return `refuseSiblingLead(${interior}, [${leads.join(', ')}])`;
}

function spelledOptionSlots(
	node: FormChildForFrom,
	fullForm: FullForm
): readonly (readonly ['open' | 'close', AssembledNonterminal])[] {
	return (['open', 'close'] as const).flatMap((side) => {
		const field = fullForm[side].slot;
		if (field === undefined) return [];
		const slot = node.slots.find((candidate) => candidate.fieldName === field);
		if (slot?.registeredOption === undefined) {
			throw new Error(`from: '${node.kind}' spells its full form in '${field}', which is not a registered option`);
		}
		return [[side, slot] as const];
	});
}

function literalUnion(texts: readonly string[]): string {
	return texts.map((text) => JSON.stringify(text)).join(' | ');
}

function spelledReturnType(
	returnType: string,
	fullForm: FullForm,
	spelled: readonly (readonly ['open' | 'close', AssembledNonterminal])[]
): string {
	return spelled.reduce((type, [side, slot]) => {
		if (side === 'close') throw new Error(`from: a spelled closing delimiter ('${slot.configKey}') has no typed form`);
		const typed = `SpelledAffix<I, ${literalUnion(fullForm.open.texts)}, ${JSON.stringify(slot.optionDefaultArm)}>`;
		const key = slot.configKey;
		return `WithSpelling<${type}, ${JSON.stringify(key)}, O extends { ${key}: infer P } ? P : ${typed}>`;
	}, returnType);
}

function siblingLeadRefusalType(fullForm: FullForm, siblings: readonly TriviaSibling[]): string | undefined {
	const textless = siblings.findIndex((sibling) => sibling.texts === undefined);
	const typed = textless === -1 ? siblings : siblings.slice(0, textless);
	const leads = typed.flatMap((sibling) =>
		(sibling.texts ?? []).map((text) => `[${JSON.stringify(text)}, ${JSON.stringify(sibling.builder)}]`)
	);
	if (leads.length === 0) return undefined;
	const [open] = fullForm.open.texts;
	const [close] = fullForm.close.texts;
	return `SiblingLeadRefusal<I, ${JSON.stringify(open)}, ${JSON.stringify(close)}, [${leads.join(', ')}]>`;
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
	const slots = node.configSlots;
	const spellingType = spellingTypeOf(node, nodeMap, kindEntries);
	const optionsParam = spellingType === undefined ? '' : `, options?: T.${node.typeName}.Options`;
	const optionsArg = spellingType === undefined ? '' : ', options';
	// Loose optionality mirrors the strict surface's own derivation
	// (`argumentOptional`, node-map.ts): a required field only blocks the
	// no-argument call when it has no default-empty construction of its own
	// (a blocking `repeat1`, or a target that itself requires an argument).
	const opt = node.argumentOptional(nodeMap) ? '?' : '';
	const typeName = node.typeName;
	const lines: string[] = [];
	const returnType = factoryReturnTypeExpr(factory);
	const soleField = resolveSingleFieldFactorySlot(node, nodeMap);
	const canDirectFactoryCall = soleField && fromBareInput(node, nodeMap) === 'value';
	const { inputType, inputOptional } = buildBranchSignatureParts(node, factory, opt);
	const resolverSlots = slots;
	for (const f of resolverSlots) {
		const body = resolveFieldCall('value', f, isMultiple(f), nodeMap, intern, true, undefined, kindEntries);
		const key = JSON.stringify(f.configKey);
		// `input` being optional (argumentOptional) only ever leaves ONE
		// required field forwarding to an empty-constructible target — the
		// call site passes it as `input?.<key>`, so its own resolver has to
		// accept the `undefined` that reaches it too, even though the field
		// itself is required within a config that IS provided.
		const valueType = `T.${typeName}.LooseConfig[${key}]${inputOptional && isRequired(f) ? ' | undefined' : ''}`;
		const signature = `export function ${fieldResolverName(typeName, f)}(value: ${valueType}): T.${typeName}[${JSON.stringify(f.storageKey)}] {`;
		if (needsNonEmptyHoist(f, nodeMap)) {
			const storageKeyExpr = JSON.stringify(f.storageKey);
			lines.push(
				signature,
				`  const resolved: readonly T.${typeName}[${storageKeyExpr}][number][] = ${body};`,
				`  _assertNonEmpty(resolved, '${node.kind}.${f.propertyName}');`,
				'  return resolved;',
				'}',
				''
			);
		} else {
			const shape = numericSlotShape(f);
			const numeric = shape === undefined ? body : `${numberInputTest(shape, 'value')} ? numberText(${numberTextArgs(shape)}, value) : ${body}`;
			lines.push(signature, `  return ${numeric};`, '}', '');
		}
	}
	const resolverFor = new Set(resolverSlots.map((f) => f.propertyName));
	const fieldValue = (f: AssembledNonterminal, valueExpr: string): string =>
		resolverFor.has(f.propertyName)
			? `${fieldResolverName(typeName, f)}(${valueExpr})`
			: resolveFieldCall(valueExpr, f, isMultiple(f), nodeMap, intern, true, undefined, kindEntries);
	const fullForm = canDirectFactoryCall ? node.fullForm : undefined;
	const spelled = fullForm === undefined ? [] : spelledOptionSlots(node, fullForm);
	const siblings = fullForm === undefined ? [] : siblingLeads(nodeMap, node);
	const refusal = fullForm === undefined ? undefined : siblingLeadRefusalType(fullForm, siblings);
	if (spelled.length > 0 && refusal !== undefined) {
		throw new Error(`from: '${node.kind}' has both a spelled delimiter and sibling leads; no typed form covers both`);
	}
	const spelledType = fullForm === undefined || spelled.length === 0 ? undefined : spelledReturnType(returnType, fullForm, spelled);
	const signature =
		spelledType !== undefined
			? `export function ${fn}<const I extends ${inputType}, const O extends T.${typeName}.Options = {}>(input${opt}: I, options?: O): ${spelledType} {`
			: refusal !== undefined
				? `export function ${fn}<const I extends ${inputType}>(input${opt}: I & ${refusal}${optionsParam}): ${returnType} {`
				: `export function ${fn}(input${opt}: ${inputType}${optionsParam}): ${returnType} {`;
	lines.push(...withEmptyOverload(nodeMap, node.kind, `export function ${fn}`, [signature], signature.replace(/ \{$/, ';')));
	const bareContent = canDirectFactoryCall ? undefined : lexedContentSlot(node);
	const bareInterior = canDirectFactoryCall || slots.length === 0 ? undefined : bareInteriorText(node.kind, node);
	const cfg = bareContent === undefined && bareInterior === undefined ? 'input' : '_cfg';
	if (slots.length > 0) {
		if (canDirectFactoryCall) {
			lines.push(
				`  if (${inputOptional ? 'input !== undefined && ' : ''}isNode(input) && (input.$type as string | number) === ${kindDiscriminantCheck(node.kind, kindEntries, nodeMap)}) return input as unknown as ${spelledType ?? returnType};`
			);
		} else {
			const bareKind =
				bareInterior !== undefined
					? (bareInterior.number ?? 'text')
					: bareContent === undefined
						? false
						: (numericSlotShape(bareContent) ?? 'text');
			emitBranchNodeDataPassthrough(lines, inputOptional, returnType, typeName, bareKind);
		}
		if (bareInterior !== undefined) {
			const shape = bareInterior.number;
			const text = shape === undefined ? 'input' : `numberText(${numberTextArgs(shape)}, input)`;
			lines.push(
				`  const _cfg = (typeof input === 'string'${shape === undefined ? '' : ` || ${numberInputTest(shape, 'input')}`} ? lexedConfig(${text}, TOKEN_INTERIORS[${JSON.stringify(node.kind)}], ${JSON.stringify(node.kind)}) : input) as T.${typeName}.LooseConfig;`
			);
		}
		if (bareContent !== undefined) {
			const bareShape = numericSlotShape(bareContent);
			lines.push(
				`  const _cfg = (typeof input === 'string'${bareShape === undefined ? '' : ` || ${numberInputTest(bareShape, 'input')}`} ? { ${bareContent.configKey}: input } : input) as T.${typeName}.LooseConfig;`
			);
		}
		const neName = (f: AssembledNonterminal) => `_ne_${f.propertyName}`;
		for (const f of slots) {
			if (needsNonEmptyHoist(f, nodeMap) && !resolverFor.has(f.propertyName)) {
				const call = fieldValue(f, `${cfg}${inputOptional ? '?' : ''}.${f.configKey}`);
				lines.push(`  const ${neName(f)} = ${call};`);
				lines.push(`  _assertNonEmpty(${neName(f)}, '${node.kind}.${f.propertyName}');`);
			}
		}
		if (canDirectFactoryCall) {
			const soleGuard = interiorSlotGuards(node.kind, node).find((guard) => guard.slot === soleField.name);
			if (fullForm !== undefined && spelled.length > 0) {
				const alternatives = (texts: readonly string[]) =>
					`[${texts.map((text) => JSON.stringify(text)).join(', ')}] as const`;
				lines.push(
					`  const _spelled = typeof input === 'string' ? spelledForm(input, ${alternatives(fullForm.open.texts)}, ${alternatives(fullForm.close.texts)}) : undefined;`
				);
			}
			const bare =
				fullForm === undefined
					? 'input'
					: spelled.length > 0
						? `(_spelled === undefined ? input : ${refuseSiblingLeadExpr('_spelled.interior', siblings)})`
						: `(typeof input === 'string' ? ${refuseSiblingLeadExpr(`spelledInterior(input, ${JSON.stringify(fullForm.open.texts[0])}, ${JSON.stringify(fullForm.close.texts[0])}${soleGuard === undefined ? '' : `, F.${soleGuard.constName}`})`, siblings)} : input)`;
			const callOptions =
				spelled.length === 0
					? optionsArg
					: `, _spelled === undefined ? options : { ${spelled.map(([side, slot]) => `${slot.configKey}: _spelled.${side}`).join(', ')}, ...options }`;
			const inputExpr = `(input !== null && typeof input === 'object' && !isNode(input) && ${JSON.stringify(soleField.configKey)} in input ? input.${soleField.configKey} : ${bare})`;
			const soleShape = numericSlotShape(soleField);
			const numeric = soleShape !== undefined;
			if (numeric) lines.push(`  const _value = ${inputExpr};`);
			const resolved = resolveFieldCall(
				numeric ? '_value' : inputExpr,
				soleField,
				isMultiple(soleField),
				nodeMap,
				intern,
				true,
				undefined,
				kindEntries
			);
			const call = soleShape === undefined ? resolved : `(${numberInputTest(soleShape, '_value')} ? _value : ${resolved})`;
			const directDefaultFactory = canDefaultToEmpty(soleField, nodeMap);
			const guardedCall = directDefaultFactory
				? `${call} ?? F.${directDefaultFactory}()`
				: isRequired(soleField)
					? `_requireField(${JSON.stringify(node.kind)}, ${JSON.stringify(soleField.configKey)}, ${call})`
					: call;
			lines.push(`  return ${factory}(${guardedCall}${callOptions})${spelledType === undefined ? '' : ` as ${spelledType}`};`);
		} else {
			lines.push(`  return ${factory}({`);
			for (const f of slots) {
				if (needsNonEmptyHoist(f, nodeMap) && !resolverFor.has(f.propertyName)) {
					lines.push(`    ${f.configKey}: ${neName(f)},`);
				} else {
					const call = fieldValue(f, `${cfg}${inputOptional ? '?' : ''}.${f.configKey}`);
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
			lines.push(`  }${optionsArg});`);
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
	childrenTypeAnnotation = '',
	optionsType?: string,
	nonEmpty = false,
	optionsRequired = false
): string {
	const typeCheck = kindDiscriminantCheck(kind, kindEntries, nodeMap);
	const hasNumericDiscriminant = (kindEntries !== undefined && findOwnKindEntry(kindEntries, kind) !== undefined);
	const unwrap =
		unwrapConfigKey === undefined
			? []
			: [
					`  const _elems: readonly unknown[] = (() => {`,
					`    if (input.length !== 1) return input;`,
					`    const head: unknown = input[0];`,
					`    if (typeof head !== 'object' || head === null || isNode(head) || !(${JSON.stringify(unwrapConfigKey)} in head)) return input;`,
					`    const v = (head as Record<string, unknown>)[${JSON.stringify(unwrapConfigKey)}];`,
					`    return Array.isArray(v) ? v : [v];`,
					`  })();`
				];
	const paramType = `${tName}.Loose | LooseValue<${elementType}, T.LeafScalarMap, T.LeafStringMap, T.NamespaceMap>`;
	const returnType = factoryReturnTypeExpr(factory);
	const inputType = listRestParamType(nonEmpty, `(${paramType})`, optionsType, optionsRequired);
	const freshVar = unwrapConfigKey === undefined ? 'input' : '_elems';
	const signature = `export function ${fn}(...input: ${inputType}): ${returnType} {`;
	const head = withEmptyOverload(nodeMap, kind, `export function ${fn}`, [signature], signature.replace(/ \{$/, ';'));
	if (!hasNumericDiscriminant) {
		return [
			...head,
			...unwrap,
			`  return ${buildCallExpr(freshVar, false)};`,
			'}'
		].join('\n');
	}
	const storageAccess = SAFE_IDENT_KEY.test(storageKey)
		? `(data as unknown as { ${storageKey}?: unknown }).${storageKey}`
		: `(data as unknown as Record<string, unknown>)[${JSON.stringify(storageKey)}]`;
	return [
		...head,
		`  if (input.length === 1 && isNode(input[0]) && input[0].$type === ${typeCheck}) {`,
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
	const resolvable = resolvesLooseInput(slot, nodeMap);
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

function resolvesLooseInput(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	if (slotLiteralValues(slot).length === 0) return true;
	const { leafKinds, branchKinds } = classifyKindsForResolver(
		expandAndDedupeContentTypes(slotKindNames(slot), nodeMap, storageKindIdByNameOf(slot)),
		nodeMap
	);
	return leafKinds.length + branchKinds.length > 0;
}

function looseElementType(elementType: string, slot: AssembledNonterminal, nodeMap: NodeMap): string {
	const expanded = expandAndDedupeContentTypes(slotKindNames(slot), nodeMap, storageKindIdByNameOf(slot));
	const { leafKinds, branchKinds } = classifyKindsForResolver(expanded, nodeMap);
	const admitsText = leafKinds.length === 1 || leafKinds.some((kind) => !isAffixedLeaf(nodeMap.nodes.get(kind)));
	return admitsText && branchKinds.length === 0 ? `${elementType} | string` : elementType;
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
	const hasNumericDiscriminant = (kindEntries !== undefined && findOwnKindEntry(kindEntries, kind) !== undefined);
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
		`export function ${fn}(input?: ${resolvesLooseInput(slot, nodeMap) ? looseElementType(elementType, slot, nodeMap) : elementType}${inputWiden !== undefined ? ` | ${inputWiden}` : ''} | ${tName}): ${factoryReturnTypeExpr(factory)} {`,
		`  if (isNode(input) && input.$type === ${typeCheck}) {`,
		`    const data = input;`,
		`    const child = ${storageAccess};`,
		`    return ${factory}(child as Parameters<typeof ${factory}>[0]);`,
		`  }`,
		`  return ${factory}(${
			resolvesLooseInput(slot, nodeMap)
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
	nodeMap: NodeMap,
	intern: KindInterner
): string | undefined {
	if (!node.rawFactoryName || !node.fromFunctionName) return undefined;
	const fn = node.fromFunctionName;
	const factory = `F.${node.rawFactoryName}`;
	const tName = `T.${node.typeName}`;
	const contentSlot = buildSeparatedListContentSlot(node);
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	const elemType = surface.elemType;
	const wrapperKind = surface.wrapper === undefined ? undefined : slotKindNames(contentSlot)[0];
	const elementSlot =
		(wrapperKind === undefined ? undefined : transparentWrapperContentSlot(wrapperKind, nodeMap)) ?? contentSlot;
	const wrapperKindExpr = wrapperKind === undefined ? 'undefined' : JSON.stringify(wrapperKind);
	const resolvable = slotLiteralValues(elementSlot).length === 0;
	const resolvedElements = (varExpr: string): string =>
		resolvable ? resolveFieldCall(varExpr, elementSlot, true, nodeMap, intern, false, elemType, kindEntries) : varExpr;
	const optionKeys = JSON.stringify(listOptionKeys(surface));
	const contentStorageKey = node.slots.length > 1 ? '_content' : canonicalSeparatedListField(node).storageKey;

	const hasSeparatorKindOption = node.separatorRule !== undefined;
	const hasLeadingOption = node.leadingDelimiter === 'optional';
	const hasTrailingOption = node.trailingDelimiter === 'optional';
	const hasOptions = listHasOptions(node);

	const elemTypeForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
	const elementsType = node.nonEmpty ? `NonEmptyArray<${elemType}>` : `${elemTypeForArray}[]`;
	const spreadElements = (varExpr: string): string => `...(${varExpr} as unknown as ${elementsType})`;

	const buildOptionsPreservingCall = (varExpr: string): string => {
		const sourceFields = '(data as unknown as { _separator?: number; _delimiter?: Delimiter })';
		const optionParts: string[] = [];
		if (hasSeparatorKindOption) optionParts.push(`separator: ${sourceFields}._separator`);
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
			isSelfUnwrap && hasOptions
				? buildOptionsPreservingCall(varExpr)
				: `${factory}(${spreadElements(`_listElements(${varExpr}, ${optionKeys}, ${wrapperKindExpr}, (els) => ${resolvedElements('els')})`)})`,
		': readonly unknown[]',
		surface.optionsType,
		node.nonEmpty,
		surface.separatorRequired
	);
}

interface LeafFromNode {
	readonly typeName: string;
	readonly rawFactoryName?: string;
	readonly fromFunctionName?: string;
}

function emitStringLikeFrom(node: LeafFromNode, shape: NumberShape | undefined): string {
	const fn = node.fromFunctionName!;
	const factory = `F.${node.rawFactoryName!}`;
	return [
		`export function ${fn}(input: T.${node.typeName}.Loose): ${factoryReturnTypeExpr(factory)} {`,
		`  if (typeof input !== 'string'${shape === undefined ? '' : ` && !${numberInputTest(shape, 'input')}`}) return input as unknown as ${factoryReturnTypeExpr(factory)};`,
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

export function transparentEnvelopeTextLeaves(node: AssembledNode, nodeMap: NodeMap): readonly string[] {
	if (!(node instanceof AssembledEnvelope) || node.modelType !== 'envelope' || !node.surfaceHidden) return [];
	if (node.fromFunctionName === undefined || node.slots.length !== 1) return [];
	return slotResolverKinds(node.slots[0]!, nodeMap).leafKinds;
}

export function slotResolverKinds(field: { values: readonly NodeOrTerminal[] }, nodeMap: NodeMap): ReturnType<typeof classifyKindsForResolver> {
	return classifyKindsForResolver(expandAndDedupeContentTypes(slotKindNames(field), nodeMap, storageKindIdByNameOf(field)), nodeMap);
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
		if (n instanceof AssembledPattern || n instanceof AssembledEnum || isBuilderTextLeaf(n)) {
			leafKinds.push(t);
		} else if (isBuilderlessPunctuationLeaf(n)) {
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
	elementType?: string,
	optionalSlot = false
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
	const optionalArg =
		specialized === '_resolveOneBranch' && optionalSlot ? `${altArg === '' ? ', undefined' : ''}, true` : '';
	return `${specialized}${tArg}(${prop}, ${JSON.stringify(kindName)}${altArg}${optionalArg})`;
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

/**
 * The storage kind of the arm a field's author declared as the default —
 * either through a `preference()`-declared option arm, or the DSL's
 * `defaultArm()` placeholder stamping `annotations.default` on the arm
 * itself. `_resolveOne` hoists a bare, kindless value straight into this
 * arm when the field admits more than one; it is never a candidate the
 * kind/NodeData route re-targets, since that route is never ambiguous
 * about a value's own kind.
 */
function defaultArmKindOf(
	field: { values: readonly NodeOrTerminal[]; optionDefaultArm?: string },
	nodeMap: NodeMap
): string | undefined {
	const declared = field.optionDefaultArm;
	if (declared !== undefined) {
		const chosen = field.values.find((v) => isNodeRef(v) && (v.variant ?? v.resolvedKind) === declared);
		if (chosen !== undefined && isNodeRef(chosen)) return storageKindOfRef(chosen.node);
	}
	const supertypeDefaults = field.values.flatMap((v) => {
		const node = isNodeRef(v) ? nodeMap.nodes.get(storageKindOfRef(v.node)) : undefined;
		if (!(node instanceof AssembledSupertype) || node.optionDefaultArm === undefined) return [];
		const chosen = node.variantSubtypes?.find((ref) => ref.variant === node.optionDefaultArm);
		return chosen === undefined ? [] : [storageKindOfRef(chosen.node)];
	});
	if (supertypeDefaults.length === 1) return supertypeDefaults[0];
	const flagged = field.values.filter((v) => v.default === true && isNodeRef(v));
	if (flagged.length > 1) {
		const names = flagged.filter(isNodeRef).map((v) => storageKindOfRef(v.node));
		throw new Error(`arm.default: ${flagged.length} arms are declared the default (${names.join(', ')}); pick one`);
	}
	const first = flagged[0];
	return first === undefined || !isNodeRef(first) ? undefined : storageKindOfRef(first.node);
}

function buildInternedArrayResolverCall(
	prop: string,
	leafKinds: string[],
	branchKinds: string[],
	fieldMultiple: boolean,
	intern: KindInterner,
	elementType?: string,
	defaultArmKind?: string
): string {
	const leafArr = intern(leafKinds);
	const branchArr = intern(branchKinds);
	const helper = fieldMultiple ? '_resolveMany' : '_resolveOne';
	const tArg = elementType ? `<${elementType}>` : '';
	const defaultArg = defaultArmKind === undefined ? '' : `, ${JSON.stringify(defaultArmKind)}`;
	return `${helper}${tArg}(${prop}, ${leafArr}, ${branchArr}${defaultArg})`;
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
	const keywords =
		storageInfo?.kind === 'mixedEnum'
			? keywordArmTextMapExpr(field as AssembledNonterminal, nodeMap, kindEntries)
			: '[]';
	if (keywords === '[]')
		return storedFieldCall(prop, field, storageInfo, fieldMultiple, nodeMap, intern, elementTypeOverride, kindEntries);
	if (!fieldMultiple) {
		const resolved = storedFieldCall(
			prop,
			field,
			storageInfo,
			false,
			nodeMap,
			intern,
			elementTypeOverride,
			kindEntries
		);
		return `(_keywordOf(${prop}, ${keywords}) ?? ${resolved})`;
	}
	const element = storedFieldCall('_e', field, storageInfo, false, nodeMap, intern, elementTypeOverride, kindEntries);
	return `(${prop} == null ? [] : Array.isArray(${prop}) ? ${prop} : [${prop}]).map((_e: _LooseFieldInput) => _keywordOf(_e, ${keywords}) ?? ${element}).filter((_e) => _e !== undefined)`;
}

function storedFieldCall(
	prop: string,
	field: { values: readonly NodeOrTerminal[] },
	storageInfo: FieldStorageInfo | undefined,
	fieldMultiple: boolean,
	nodeMap: NodeMap,
	intern: KindInterner,
	elementTypeOverride?: string,
	kindEntries?: readonly KindEnumEntry[]
): string {
	const { leafKinds, branchKinds, tokenKinds } = slotResolverKinds(field, nodeMap);

	const elementType =
		elementTypeOverride ?? ('name' in field ? fieldElementType(field as AssembledNonterminal, nodeMap) : undefined);

	const fastPath = buildSingleKindFastPath(
		prop,
		leafKinds,
		branchKinds,
		altKindDiscriminants(tokenKinds, field.values, nodeMap, kindEntries),
		fieldMultiple,
		elementType,
		'name' in field && !isRequired(field as AssembledNonterminal)
	);
	const baseCall =
		fastPath !== undefined
			? fastPath
			: buildInternedArrayResolverCall(
					prop,
					leafKinds,
					branchKinds,
					fieldMultiple,
					intern,
					elementType,
					defaultArmKindOf(field, nodeMap)
				);
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

interface LeafRegistry {
	readonly entries: readonly string[];
	readonly textChecks: readonly TextKindCheck[];
}

export interface TextKindCheck {
	readonly kind: string;
	readonly values?: readonly string[];
	readonly pattern?: RegExp;
}

export function leafTextChecks(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): readonly TextKindCheck[] {
	return buildLeafRegistryEntries(nodeMap, kindEntries).textChecks;
}

export function textCheckAccepts(check: TextKindCheck, text: string): boolean {
	return check.values !== undefined ? check.values.includes(text) : check.pattern?.test(text) === true;
}

function buildLeafRegistryEntries(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): LeafRegistry {
	const registryEntries: string[] = [];
	const textChecks: TextKindCheck[] = [];
	const referenced = referencedKinds(nodeMap);
	for (const [kind, node] of nodeMap.nodes) {
		if (classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) !== 'emit') continue;
		const factory = `F.${node.rawFactoryName}`;
		if (isBuilderTextLeaf(node)) {
			textChecks.push({ kind, values: [node.text] });
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { values: [${JSON.stringify(node.text)}], factory: () => ${factory}() },`
			);
		} else if (isAffixedLeaf(node)) {
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { factory: (content: string) => _resolveByKind(${JSON.stringify(kind)}, content) },`
			);
		} else if (interiorOf(node) !== undefined) {
			const interior = interiorOf(node)!;
			const shape = classifyFactoryShape(node, nodeMap);
			const config = `lexedConfig(text, TOKEN_INTERIORS[${JSON.stringify(kind)}], ${JSON.stringify(kind)})`;
			const registered = registeredSlots(node);
			const spelling = registered.length === 0 ? '' : `, { ${registered.map((slot) => `${slot.configKey}: cfg[${JSON.stringify(slot.configKey)}]`).join(', ')} } as never`;
			const configSlot = interior.slots.find((slot) => !slot.flag && !registered.some((r) => r.configKey === slot.configKey));
			const arg = shape === 'direct' ? `cfg[${JSON.stringify(configSlot!.configKey)}] as never` : 'cfg as never';
			textChecks.push({ kind, pattern: new RegExp(interior.regex, 'su') });
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { pattern: new RegExp(TOKEN_INTERIORS[${JSON.stringify(kind)}].regex, 'su'), factory: (text: string) => { const cfg = ${config}; return ${factory}(${arg}${spelling}); } },`
			);
		} else if (node instanceof AssembledPattern) {
			const pattern = anchoredLeafRegex(kind, node.textPattern);
			if (pattern === undefined) {
				if (!referenced.has(kind)) continue;
				throw new Error(
					`leaf registry: '${kind}' has a factory but no text pattern; an external scanner token authors its shape in renderAs`
				);
			}
			textChecks.push({ kind, pattern });
			registryEntries.push(`  ${JSON.stringify(kind)}: { pattern: /${pattern.source}/${pattern.flags}, factory: ${factory} },`);
		} else if (node instanceof AssembledAlias) {
			const leaf = aliasPatternLeaf(node, nodeMap);
			if (leaf === undefined) continue;
			const pattern = anchoredLeafRegex(leaf.kind, leaf.textPattern);
			if (pattern === undefined) continue;
			textChecks.push({ kind, pattern });
			registryEntries.push(
				`  ${JSON.stringify(kind)}: { pattern: /${pattern.source}/${pattern.flags}, factory: (text: string) => ${factory}(F.${leaf.rawFactoryName}(text) as never) },`
			);
		}
	}
	return { entries: registryEntries, textChecks: rankTextKinds(textChecks, kindEntries) };
}

function rankTextKinds(checks: readonly TextKindCheck[], kindEntries: readonly KindEnumEntry[] | undefined): TextKindCheck[] {
	if (kindEntries === undefined) return [...checks];
	const rankOf = ({ kind }: TextKindCheck): number => {
		const rank = findKindEntry(kindEntries, kind)?.lexicalRank;
		if (rank === undefined) throw new Error(`from: text kind '${kind}' has no lexical rank in the catalog`);
		return rank;
	};
	return [...checks].sort((a, b) => rankOf(a) - rankOf(b));
}

function aliasPatternLeaf(node: AssembledAlias, nodeMap: NodeMap): AssembledPattern | undefined {
	if (node.slots.length !== 1) return undefined;
	const kinds = slotKindNames(node.slots[0]!);
	if (kinds.length !== 1) return undefined;
	const leaf = nodeMap.nodes.get(kinds[0]!);
	return leaf instanceof AssembledPattern && leaf.rawFactoryName !== undefined ? leaf : undefined;
}

function emitResolveByKindHelper(lines: string[], nodeMap: NodeMap): void {
	lines.push('function _isFromKind(k: string): k is keyof _FromMap {');
	lines.push('  return k in _fromMap;');
	lines.push('}');
	lines.push('');
	lines.push('const _SUPERTYPE_KIND_TAGS: Record<string, string | readonly string[] | undefined> = {');
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype) || !node.declared) continue;
		const concrete = defaultConcreteKindOf(kind, nodeMap);
		lines.push(`  ${JSON.stringify(kind)}: ${JSON.stringify(concrete ?? node.subtypeNames)},`);
	}
	lines.push('};');
	lines.push('');
	lines.push('/** A `kind:` discriminant names its kind by the grammar string or the');
	lines.push(' *  stamped `TSKindId` enum value — both spellings resolve to the same name.');
	lines.push(' *  A supertype tag names its default arm; one without a default names no kind. */');
	lines.push('function _kindNameOf(kind: unknown): string | undefined {');
	lines.push('  const name = typeof kind === "number" ? KIND_NAMES.get(kind) : typeof kind === "string" ? kind : undefined;');
	lines.push('  const tag = name === undefined || _isFromKind(name) ? undefined : _SUPERTYPE_KIND_TAGS[name];');
	lines.push('  if (tag === undefined || typeof tag === "string") return tag ?? name;');
	lines.push('  throw new Error(`kind ${JSON.stringify(name)} has no default arm; name one of [${tag.join(", ")}]`);');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveByKind<K extends keyof _FromMap>(');
	lines.push('  kind: K,');
	lines.push('  rest: _LooseFieldInput,');
	lines.push('): ReturnType<_FromMap[K]> {');
	lines.push('  const fn = _fromMap[kind] as (rest: _LooseFieldInput) => ReturnType<_FromMap[K]>;');
	lines.push('  if (!(kind in _leafRegistry) || typeof rest !== "object" || rest === null || Array.isArray(rest) || isNode(rest)) return fn(rest);');
	lines.push('  const text = (rest as { text?: unknown }).text;');
	lines.push('  if (typeof text !== "string") throw new Error(`the ${kind} tag takes its text: { kind: ${JSON.stringify(kind)}, text: "…" }`);');
	lines.push('  return fn(text);');
	lines.push('}');
	lines.push('');
}

function resolveScalarParamName(hasBool: boolean, hasNumeric: boolean): string {
	return hasBool || hasNumeric ? 'v' : '_v';
}

function bareSlotOf(node: AssembledNode, nodeMap: NodeMap): AssembledNonterminal | undefined {
	switch (fromBareInput(node, nodeMap)) {
		case 'value':
			return bareValueSlot(node, nodeMap);
		case 'elements':
			return canonicalSeparatedListField(node as AssembledList);
		case null:
			return undefined;
	}
}

function bareSlotKinds(kind: string, nodeMap: NodeMap): readonly string[] | undefined {
	const node = nodeMap.nodes.get(kind);
	const slot = node === undefined ? undefined : bareSlotOf(node, nodeMap);
	if (slot === undefined) return undefined;
	const slotKinds =
		node instanceof AssembledList ? transparentContentKindNames(slotKindNames(slot), nodeMap) : slotKindNames(slot);
	return expandAndDedupeContentTypes(slotKinds, nodeMap);
}

function forwardsBareString(kind: string, nodeMap: NodeMap, seen: ReadonlySet<string> = new Set()): boolean {
	if (seen.has(kind)) return false;
	const admitted = bareSlotKinds(kind, nodeMap);
	if (admitted === undefined || admitted.length !== 1) return false;
	const only = admitted[0]!;
	const node = nodeMap.nodes.get(only);
	if (node !== undefined && isLeafRegistryKind(only, node)) return true;
	return forwardsBareString(only, nodeMap, new Set([...seen, kind]));
}

export function bareAcceptClosure(
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): Map<string, ReadonlySet<string>> {
	const acceptedBy = (kind: string, seen: Set<string>): Set<string> => {
		const names = new Set<string>();
		if (seen.has(kind)) return names;
		seen.add(kind);
		for (const admitted of bareSlotKinds(kind, nodeMap) ?? []) {
			names.add(admitted);
			const admittedNode = nodeMap.nodes.get(admitted);
			if (admittedNode instanceof AssembledEnum) for (const member of admittedNode.resolvedKinds) names.add(member);
			for (const inner of acceptedBy(admitted, seen)) names.add(inner);
		}
		return names;
	};
	const out = new Map<string, ReadonlySet<string>>();
	for (const [kind, node] of nodeMap.nodes) {
		if (classifyFromEmission(kind, node, { nodeMap, kindEntries }) !== 'emit') continue;
		if (fromBareInput(node, nodeMap) === null) continue;
		out.set(kind, acceptedBy(kind, new Set()));
	}
	return out;
}

function isLeafRegistryKind(kind: string, node: AssembledNode): boolean {
	if (!node.rawFactoryName) return false;
	return node instanceof AssembledEnum || isBuilderTextLeaf(node) || node instanceof AssembledPattern;
}

function emitBareRoutingTables(
	lines: string[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	const idOf = (kind: string): number | undefined => (kindEntries ? findKindEntry(kindEntries, kind)?.id : undefined);
	const idStored: number[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (node.storage !== 'kindId') continue;
		const id = idOf(kind);
		if (id !== undefined) idStored.push(id);
	}
	const enumsOfMember = new Map<number, string[]>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledEnum)) continue;
		for (const id of node.resolvedKindIds) enumsOfMember.set(id, [...(enumsOfMember.get(id) ?? []), kind]);
	}
	const accepts: [string, number[]][] = [];
	for (const [kind, names] of bareAcceptClosure(nodeMap, kindEntries)) {
		const ids = [...names].flatMap((name) => {
			const id = idOf(name);
			return id === undefined ? [] : [id];
		});
		if (ids.length > 0) accepts.push([kind, [...new Set(ids)].sort((a, b) => a - b)]);
	}
	lines.push(
		`const _KIND_ID_STORED: ReadonlySet<number> = new Set(${JSON.stringify(idStored.sort((a, b) => a - b))});`
	);
	lines.push('const _BARE_ACCEPTS: Record<string, ReadonlySet<number> | undefined> = {');
	for (const [kind, ids] of accepts) lines.push(`  ${JSON.stringify(kind)}: new Set(${JSON.stringify(ids)}),`);
	lines.push('};');
	lines.push('const _ENUMS_OF_MEMBER: Record<number, readonly string[] | undefined> = {');
	for (const [id, kinds] of [...enumsOfMember].sort((a, b) => a[0] - b[0]))
		lines.push(`  ${id}: ${JSON.stringify(kinds)},`);
	lines.push('};');
}

function emitResolveOneHelper(lines: string[]): void {
	lines.push('function _resolveOne<T>(');
	lines.push('  v: _LooseFieldInput,');
	lines.push('  leafKinds: readonly string[],');
	lines.push('  branchKinds: readonly string[],');
	lines.push('  defaultArm?: string,');
	lines.push('): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push(
		'  const kindId = isNode(v) ? v.$type : typeof v === "number" && _KIND_ID_STORED.has(v) ? v : undefined;'
	);
	// A value that already names its own kind (NodeData, or a stored kind-id)
	// is never re-targeted by a declared default — there is nothing ambiguous
	// about what it is, only whether the arm it names is one this field
	// admits. Genuine ambiguity here (the same kind-id fits more than one
	// structurally distinct arm) always refuses, defaulted arm or not.
	lines.push('  if (typeof kindId === "number") {');
	lines.push('    const kindName = KIND_NAMES.get(kindId);');
	lines.push(
		'    if (kindName !== undefined && (leafKinds.includes(kindName) || branchKinds.includes(kindName) || (_ENUMS_OF_MEMBER[kindId] ?? []).some((e) => leafKinds.includes(e)))) return v as T;'
	);
	lines.push('    const arms = branchKinds.filter((b) => _BARE_ACCEPTS[b]?.has(kindId) === true);');
	lines.push('    const arm = arms.length <= 1 ? arms[0] : undefined;');
	lines.push('    if (arm !== undefined && _isFromKind(arm)) return _resolveByKind(arm, v) as T;');
	lines.push('    if (isNode(v)) return v as T;');
	lines.push('    if (arms.length > 1) {');
	lines.push(
		'      throw new Error(`_resolveOne: a bare ${kindName ?? kindId} fits more than one arm: [${arms.join(", ")}]; name the arm explicitly`);'
	);
	lines.push('    }');
	lines.push('  }');
	lines.push('  if (typeof v === "boolean" || typeof v === "number" || typeof v === "bigint") {');
	lines.push('    const scalar = _resolveScalar(v);');
	lines.push('    if (scalar !== undefined) return scalar as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "string") {');
	lines.push('    const leaf = _resolveBareText(v, [...leafKinds, ...branchKinds]);');
	lines.push('    if (leaf !== undefined) return leaf as T;');
	lines.push(
		'    if (branchKinds.length === 0 && leafKinds.length === 1) return _resolveOneLeaf<T>(v, leafKinds[0]!);'
	);
	lines.push(
		'    if (branchKinds.length === 0 && leafKinds.length > 1 && leafKinds.every((k) => _AFFIXED_KINDS.has(k))) {'
	);
	lines.push(
		"      throw new Error(`_resolveOne: a bare string never picks among affixed leaves [${leafKinds.join(', ')}]; build one with its own factory`);"
	);
	lines.push('    }');
	lines.push('  }');
	lines.push('  if (typeof v === "string") {');
	lines.push('    const bk = _KEYWORD_BRANCH_BY_TEXT[v];');
	lines.push('    if (bk !== undefined && branchKinds.includes(bk)) {');
	lines.push('      const build = _KEYWORD_BRANCH_BUILD[bk];');
	lines.push('      if (build !== undefined) return build() as T;');
	lines.push('      if (_isFromKind(bk)) return _resolveByKind(bk, {}) as T;');
	lines.push('    }');
	lines.push('  }');
	lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {');
	lines.push('    const { kind, ...rest } = v;');
	lines.push('    const kindName = _kindNameOf(kind);');
	lines.push('    if (kindName !== undefined && _isFromKind(kindName)) {');
	lines.push('      const built = _resolveByKind(kindName, rest) as _LooseFieldInput;');
	lines.push(
		'      return (isNode(built) ? _resolveOne<T>(built, leafKinds, branchKinds, defaultArm) : built) as T;'
	);
	lines.push('    }');
	lines.push('  }');
	lines.push('  if (branchKinds.length === 1 && typeof v === "object" && !Array.isArray(v)) {');
	lines.push('    const bk = branchKinds[0]!;');
	lines.push('    if (_isFromKind(bk)) return _resolveByKind(bk, v) as T;');
	lines.push('  }');
	lines.push('  if (!(typeof v === "object" && !Array.isArray(v))) {');
	lines.push(
		'    const candidates = typeof v === "string" ? branchKinds.filter((b) => _STRING_CAPABLE_BRANCHES.has(b)) : branchKinds;'
	);
	lines.push(
		'    const target = candidates.length === 1 && branchKinds.length === 1 ? candidates[0] : defaultArm !== undefined && candidates.includes(defaultArm) ? defaultArm : undefined;'
	);
	lines.push('    if (target !== undefined && Array.isArray(v) && target in _wrapKindIds) {');
	lines.push('      return _wrapArray(target, v) as T;');
	lines.push('    }');
	lines.push('    if (target !== undefined && _isFromKind(target)) return _resolveByKind(target, v) as T;');
	lines.push('    if (typeof v === "string" && candidates.length > 0) {');
	lines.push(
		'      throw new Error(`_resolveOne: a bare string picks no arm among [${branchKinds.join(", ")}]; declare the arm (defaultArm()) or name it explicitly`);'
	);
	lines.push('    }');
	lines.push('  }');
	lines.push('  if (typeof v === "object") {');
	lines.push(
		'    throw new Error(`_resolveOne: cannot resolve value to any of [${[...leafKinds, ...branchKinds].join(", ")}]: ${JSON.stringify(v)}`);'
	);
	lines.push('  }');
	lines.push('  if (typeof v === "string") {');
	lines.push('    const texts = _TEXT_KINDS_BY_RANK.filter((kind) => leafKinds.includes(kind) || branchKinds.includes(kind));');
	lines.push('    if (texts.length > 0) throw new Error(`_resolveOne: ${JSON.stringify(v)} matches none of [${texts.join(", ")}]`);');
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
	lines.push('/** Narrows a coercer input to its config arm. A bare `isNode` check');
	lines.push(' *  cannot: the NodeData arm is not a strict subtype of the config arm, so');
	lines.push(' *  negative narrowing leaves it in place. */');
	lines.push('function _isLooseConfig<C>(v: C | AnyNodeData): v is C {');
	lines.push('  return !isNode(v);');
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
	readonly fromFunctionName: string | undefined;
	readonly childSurface: 'direct' | 'spread' | 'array';
	readonly kindIdExpr: string;
	readonly elementKind: string | undefined;
	readonly soleSlotOptional: boolean;
}

function soleElementKindOf(node: AssembledNode, nodeMap: NodeMap): string | undefined {
	const slot = soleSlotFacts(node, nodeMap)?.slot;
	if (slot === undefined) return undefined;
	const kinds = new Set<string>();
	for (const v of slot.values) {
		if (!isNodeRef(v)) continue;
		const kind = storageKindOfRef(v.node);
		if (nodeMap.nodes.get(kind)?.parameterless === true) continue;
		kinds.add(kind);
	}
	return kinds.size === 1 ? [...kinds][0] : undefined;
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
			fromFunctionName: node.fromFunctionName,
			childSurface,
			kindIdExpr: `TSKindId.${entry.member}`,
			elementKind: soleElementKindOf(node, nodeMap),
			soleSlotOptional: childSurface === 'direct' && soleSlotFacts(node, nodeMap)?.required === false
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

	// Emitted alongside `_wrapKindIds`, never on its own condition: the two
	// are read by the same branch of `_resolveOneBranch`, so a gate that can
	// admit one without the other emits a reference to a missing table.
	lines.push('const _wrapElementKinds: { readonly [kind: string]: string } = {');
	for (const e of entries) {
		if (e.elementKind === undefined) continue;
		lines.push(`  ${JSON.stringify(e.kind)}: ${JSON.stringify(e.elementKind)},`);
	}
	lines.push('};');
	lines.push('');

	// A 'direct' kind's own factory takes ONE child (`children[0]`): when that
	// child is itself a list envelope (`_wrapElementKinds[kind]` names another
	// `_wrapKindIds` member), an array given at this position names the
	// envelope's elements, not this kind's own — `_wrapArray` has to build the
	// inner envelope first. 'spread'/'array' kinds take the array as their own
	// children directly and never recurse.
	lines.push('const _wrapDirectKinds: ReadonlySet<string> = new Set([');
	for (const e of entries) {
		if (e.childSurface !== 'direct') continue;
		lines.push(`  ${JSON.stringify(e.kind)},`);
	}
	lines.push(']);');
	lines.push('');

	lines.push('const _wrapOptionalSoleKinds: ReadonlySet<string> = new Set([');
	for (const e of entries) {
		if (e.soleSlotOptional) lines.push(`  ${JSON.stringify(e.kind)},`);
	}
	lines.push(']);');
	lines.push('');

	lines.push('function _wrapWithChildren(kind: string, children: readonly unknown[]): unknown {');
	lines.push('  switch (kind) {');
	for (const e of entries) {
		if (e.childSurface !== 'direct' && e.fromFunctionName !== undefined) {
			lines.push(
				`    case ${JSON.stringify(e.kind)}: return (${e.fromFunctionName} as (...args: unknown[]) => unknown)(...children);`
			);
		} else if (e.childSurface === 'spread') {
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

	// An array given where a wrap-children kind is expected: rule 4 (loose =
	// strict + coercions) builds the envelope with one element per entry. A
	// 'direct' kind's array is never its own children (it takes exactly one);
	// when its sole child is itself a wrap-children kind (a nested list
	// envelope), recurse into that kind first, then wrap the single result.
	lines.push('function _wrapArray<T>(kind: string, arr: readonly unknown[]): T {');
	lines.push('  const elementKind = _wrapElementKinds[kind];');
	lines.push('  if (_wrapDirectKinds.has(kind) && elementKind !== undefined && elementKind in _wrapKindIds) {');
	lines.push('    if (arr.length === 0 && _wrapOptionalSoleKinds.has(kind)) return _wrapWithChildren(kind, []) as T;');
	lines.push('    return _wrapWithChildren(kind, [_wrapArray(elementKind, arr)]) as T;');
	lines.push('  }');
	lines.push('  return _wrapWithChildren(kind, arr) as T;');
	lines.push('}');
	lines.push('');
}

function emitResolverHelpers(
	lines: string[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	const { entries: registryEntries, textChecks } = buildLeafRegistryEntries(nodeMap, kindEntries);

	lines.push('// --- Loose-input resolver helpers (see C6-prereq) ---');
	lines.push('interface _LeafEntry {');
	lines.push('  readonly values?: readonly string[];');
	lines.push('  readonly pattern?: RegExp;');
	lines.push('  readonly factory: (text: string) => AnyNodeData | number;');
	lines.push('}');
	lines.push('const _leafRegistry: { readonly [kind: string]: _LeafEntry } = {');
	for (const entry of registryEntries) lines.push(entry);
	lines.push('};');
	const affixed = [...nodeMap.nodes].filter(([, node]) => isAffixedLeaf(node)).map(([kind]) => kind);
	lines.push(`const _AFFIXED_KINDS: ReadonlySet<string> = new Set(${JSON.stringify(affixed)});`);
	lines.push('');

	lines.push('function _buildGuardedText(v: string, kind: string): AnyNodeData | number {');
	lines.push('  const entry = _leafRegistry[kind]!;');
	lines.push('  if (entry.values !== undefined && !entry.values.includes(v)) {');
	lines.push('    throw new Error(`${JSON.stringify(v)} is not the text of ${kind}: expected one of ${JSON.stringify(entry.values)}`);');
	lines.push('  }');
	lines.push('  if (entry.pattern !== undefined && !entry.pattern.test(v)) {');
	lines.push('    throw new Error(`${JSON.stringify(v)} is not a ${kind}: it does not match ${entry.pattern}`);');
	lines.push('  }');
	lines.push('  return entry.factory(v);');
	lines.push('}');
	lines.push('');
	lines.push(`const _TEXT_KINDS_BY_RANK: readonly string[] = ${JSON.stringify(textChecks.map((check) => check.kind))};`);
	lines.push('');
	const envelopeTextLeaves = [...nodeMap.nodes]
		.map(([kind, node]) => [kind, transparentEnvelopeTextLeaves(node, nodeMap)] as const)
		.filter(([, leaves]) => leaves.length > 0);
	lines.push('const _ENVELOPE_TEXT_LEAVES: Record<string, readonly string[] | undefined> = {');
	for (const [kind, leaves] of envelopeTextLeaves) lines.push(`  ${JSON.stringify(kind)}: ${JSON.stringify(leaves)},`);
	lines.push('};');
	lines.push('');
	lines.push('function _resolveBareText(v: string, kinds: readonly string[]): AnyNodeData | number | undefined {');
	lines.push('  for (const kind of _TEXT_KINDS_BY_RANK) {');
	lines.push('    const direct = kinds.includes(kind);');
	lines.push('    const envelope = direct ? undefined : kinds.find((k) => _ENVELOPE_TEXT_LEAVES[k]?.includes(kind) === true && _isFromKind(k));');
	lines.push('    if (!direct && envelope === undefined) continue;');
	lines.push('    const entry = _leafRegistry[kind]!;');
	lines.push('    if (!(entry.values !== undefined ? entry.values.includes(v) : entry.pattern?.test(v) === true)) continue;');
	lines.push('    return envelope !== undefined && _isFromKind(envelope) ? _resolveByKind(envelope, v) : entry.factory(v);');
	lines.push('  }');
	lines.push('  return undefined;');
	lines.push('}');
	lines.push('');

	emitResolveByKindHelper(lines, nodeMap);

	lines.push(
		'function _keywordOf(v: _LooseFieldInput, keywords: readonly (readonly [string, number])[]): number | undefined {'
	);
	lines.push('  return typeof v === "string" ? keywords.find(([text]) => text === v)?.[1] : undefined;');
	lines.push('}');
	lines.push('');

	lines.push("/** A kind-enum slot's loose input. A stored kind id is already the slot's");
	lines.push(' *  own discriminant; any other number is a numeric value and resolves as a');
	lines.push(' *  leaf like every other shape. */');
	lines.push('function _resolveKindEnum<T>(v: _LooseFieldInput, resolve: () => T): T {');
	lines.push('  return typeof v === "number" && _KIND_ID_STORED.has(v) ? (v as T) : resolve();');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveKindEnumScalar<T>(v: _LooseFieldInput, resolve: () => T): T {');
	lines.push('  return typeof v === "number" || typeof v === "string" ? (v as T) : resolve();');
	lines.push('}');
	lines.push('');

	const scalars = scalarLeafKinds(nodeMap);
	const numeric = numericLeafKinds(nodeMap);
	const scalarParam = resolveScalarParamName(
		scalars.boolean !== undefined && kindEntries !== undefined,
		numeric.length > 0
	);
	lines.push(`function _resolveScalar(${scalarParam}: boolean | number | bigint): AnyNodeData | number | undefined {`);
	const booleanMember = (kind: string): string | undefined =>
		kindEntries === undefined ? undefined : findKindEntry(kindEntries, kind)?.member;
	const trueMember = scalars.boolean === undefined ? undefined : booleanMember(scalars.boolean.trueKind);
	const falseMember = scalars.boolean === undefined ? undefined : booleanMember(scalars.boolean.falseKind);
	if (trueMember !== undefined && falseMember !== undefined) {
		lines.push(`  if (typeof v === "boolean") return v ? TSKindId.${trueMember} : TSKindId.${falseMember};`);
	}
	if (numeric.length > 0) {
		lines.push('  if (typeof v === "number" || typeof v === "bigint") {');
		lines.push('    const text = String(v);');
		lines.push(`    for (const kind of ${JSON.stringify(numeric)}) {`);
		lines.push('      const e = _leafRegistry[kind];');
		lines.push('      if (e?.pattern?.test(text)) return e.factory(text);');
		lines.push('    }');
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
		} else if (node.fromFunctionName !== undefined && stringConstructibleTexts(kind, nodeMap).length > 0) {
			stringCapable.push(kind);
		}
	}
	for (const kind of bareAcceptClosure(nodeMap, kindEntries).keys()) {
		if (!stringCapable.includes(kind) && forwardsBareString(kind, nodeMap)) stringCapable.push(kind);
	}
	const branchByText = new Map<string, string>();
	for (const [text, k] of byText) {
		const prior = branchByText.get(text);
		if (prior !== undefined) throw new Error(`from: keyword text ${JSON.stringify(text)} builds both '${prior}' and '${k}'; a bare keyword must name one branch`);
		branchByText.set(text, k);
	}
	lines.push('const _KEYWORD_BRANCH_BY_TEXT: Record<string, string | undefined> = {');
	for (const [text, k] of byText) lines.push(`  ${JSON.stringify(text)}: ${JSON.stringify(k)},`);
	lines.push('};');
	lines.push('const _KEYWORD_BRANCH_BUILD: Record<string, (() => AnyNodeData | number) | undefined> = {');
	for (const [k, factory] of buildByKind) lines.push(`  ${JSON.stringify(k)}: () => F.${factory}(),`);
	lines.push('};');
	lines.push(`const _STRING_CAPABLE_BRANCHES: ReadonlySet<string> = new Set(${JSON.stringify(stringCapable)});`);
	emitBareRoutingTables(lines, nodeMap, kindEntries);
	lines.push('');

	emitResolveOneHelper(lines);

	lines.push('function _resolveMany<T>(');
	lines.push('  v: _LooseFieldInput,');
	lines.push('  leafKinds: readonly string[],');
	lines.push('  branchKinds: readonly string[],');
	lines.push('  defaultArm?: string,');
	lines.push('): readonly T[] {');
	lines.push('  if (v === undefined || v === null) return [];');
	lines.push('  const arr: readonly _LooseFieldInput[] = Array.isArray(v) ? v : [v];');
	lines.push('  return arr.map(e => _resolveOne<T>(e, leafKinds, branchKinds, defaultArm));');
	lines.push('}');
	lines.push('');

	lines.push('function _listElements(');
	lines.push('  input: readonly unknown[],');
	lines.push('  optionKeys: readonly string[],');
	lines.push('  wrapperKind: string | undefined,');
	lines.push('  resolve: (elements: readonly unknown[]) => readonly unknown[],');
	lines.push('): readonly unknown[] {');
	lines.push('  const head = input[0];');
	lines.push(
		'  const optionsFirst = optionKeys.length > 0 && typeof head === "object" && head !== null && !Array.isArray(head) && !isNode(head) && Object.keys(head).every((k) => optionKeys.includes(k));'
	);
	lines.push('  const elements = (optionsFirst ? input.slice(1) : input).map((e) =>');
	lines.push(
		'    wrapperKind !== undefined && _isFromKind(wrapperKind) && typeof e === "object" && e !== null && !Array.isArray(e) && !isNode(e) && !("kind" in e)'
	);
	lines.push('      ? _resolveByKind(wrapperKind, e)');
	lines.push('      : e');
	lines.push('  );');
	lines.push(
		'  const resolved = elements.map((e) => (wrapperKind !== undefined && isNode(e) && typeof e.$type === "number" && KIND_NAMES.get(e.$type) === wrapperKind ? e : resolve([e])[0]));'
	);
	lines.push('  return optionsFirst ? [head, ...resolved] : resolved;');
	lines.push('}');
	lines.push('');

	lines.push('function _resolveOneLeaf<T>(v: _LooseFieldInput, kind: string): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (isNode(v)) return v as T;');
	lines.push('  if (typeof v === "boolean" || typeof v === "number" || typeof v === "bigint") {');
	lines.push('    const scalar = _resolveScalar(v);');
	lines.push('    if (scalar !== undefined) return scalar as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "string" && _leafRegistry[kind] !== undefined) return _buildGuardedText(v, kind) as T;');
	lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {');
	lines.push('    const { kind: k, ...rest } = v;');
	lines.push('    const kn = _kindNameOf(k);');
	lines.push('    if (kn !== undefined && _isFromKind(kn)) return _resolveByKind(kn, rest) as T;');
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
		'function _resolveOneBranch<T>(v: _LooseFieldInput, kind: string, altKinds?: readonly (string | number)[], optionalSlot?: boolean): T {'
	);
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (optionalSlot === true && Array.isArray(v) && v.length === 0) return undefined as T;');
	// A `kind:` config naming a DIFFERENT concrete kind than this branch is
	// itself the value a wrap-children kind's sole slot admits (rule 5): build
	// it eagerly and run it through the SAME NodeData wrap-or-passthrough
	// check below, rather than duplicating that check against a reassigned
	// `v` (reassignment would widen every later narrowing of `v` in this
	// function back to its declared type).
	lines.push('  if (typeof v === "object" && !Array.isArray(v) && !isNode(v) && "kind" in v) {');
	lines.push('    const { kind: k, ...rest } = v;');
	lines.push('    const kn = _kindNameOf(k);');
	lines.push('    if (kn !== undefined && kn !== kind && kind in _wrapKindIds && _isFromKind(kn)) {');
	lines.push('      return _resolveOneBranch<T>(_resolveByKind(kn, rest), kind, altKinds);');
	lines.push('    }');
	lines.push('  }');
	lines.push('  if (isNode(v)) {');
	lines.push('    const wrapId = _wrapKindIds[kind];');
	lines.push('    if (wrapId !== undefined && v.$type !== wrapId) {');
	lines.push('      if (altKinds !== undefined && altKinds.some(k => k === v.$type)) return v as T;');
	lines.push('      return _wrapWithChildren(kind, [v]) as T;');
	lines.push('    }');
	lines.push('    return v as T;');
	lines.push('  }');
	lines.push('  if (Array.isArray(v) && kind in _wrapKindIds) {');
	lines.push('    return _wrapArray(kind, v) as T;');
	lines.push('  }');
	lines.push(
		'  if ((typeof v === "string" || typeof v === "number" || typeof v === "boolean") && _isFromKind(kind)) {'
	);
	lines.push('    return _resolveByKind(kind, v) as T;');
	lines.push('  }');
	lines.push('  if (typeof v === "object" && !Array.isArray(v)) {');
	lines.push('    if ("kind" in v) {');
	lines.push('      const { kind: k, ...rest } = v;');
	lines.push('      const kn = _kindNameOf(k);');
	lines.push('      if (kn !== undefined && _isFromKind(kn)) return _resolveByKind(kn, rest) as T;');
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
	lines.push('  if (isNode(v)) return v as T;');
	lines.push('  if (Array.isArray(v)) return v as T;');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');
	lines.push('function _resolveBitflag<T>(v: _LooseFieldInput): T {');
	lines.push('  if (v === undefined || v === null) return v as T;');
	lines.push('  if (typeof v === "number") return v as T;');
	lines.push('  if (typeof v === "string") return v as T;');
	lines.push('  if (Array.isArray(v)) return v as T;');
	lines.push('  if (isNode(v)) return v as T;');
	lines.push('  return v as T;');
	lines.push('}');
	lines.push('');

	emitAssertNonEmptyHelper(lines);
	lines.push('');
	emitLooseConfigGuard(lines);
	emitRequireFieldHelper(lines);
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

	emitLeaf(node: AssembledPattern | AssembledEnum | AssembledKeyword | AssembledPunctuation): void {
		from.leaf(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitBranch(node: BranchLikeForFrom): void {
		from.branch(this.#output, node, this.#nodeMap, this.#internKinds, this.#kindEntries);
	}

	emitSeparatedList(node: AssembledList): void {
		from.separatedList(this.#output, node, this.#nodeMap, this.#internKinds, this.#kindEntries);
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
		if (node instanceof AssembledPattern || node instanceof AssembledEnum || isBuilderTextLeaf(node)) {
			this.emitLeaf(node);
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
		const body = lines.filter((l) => !l.startsWith('import ')).join('\n');
		const usesArgs = lines.some((l) => l !== ARGS_HELPER && /\b_Args</.test(l));
		const pruned = lines.flatMap((l) => {
			if (!usesArgs && l === ARGS_HELPER) return [];
			if (l === `import * as F from './raw.js';`) {
				const usesInterior = /\bTOKEN_INTERIORS\b/.test(body);
				const usesNumberText = /\bnumberText\(/.test(body);
				const usesSpelled = /\bspelledInterior\(/.test(body);
				const usesSpelledForm = /\bspelledForm\(/.test(body);
				const usesSiblingLead = /\brefuseSiblingLead\(/.test(body);
				if (usesInterior || usesNumberText || usesSpelled || usesSpelledForm) {
					const common = [
						...(usesInterior ? ['lexedConfig'] : []),
						...(usesNumberText ? ['numberText'] : []),
						...(usesSpelledForm ? ['spelledForm'] : []),
						...(usesSpelled ? ['spelledInterior'] : []),
						...(usesSiblingLead ? ['refuseSiblingLead'] : [])
					];
					return [
						l,
						...(usesInterior ? [`import { TOKEN_INTERIORS } from '../consts.js';`] : []),
						`import { ${common.join(', ')} } from '@sittir/common/utils';`
					];
				}
			}
			return [l];
		});
		return pruneUnusedImports(pruned, ['Delimiter', ...TYPES_IMPORT_OPTIONAL]).join('\n');
	}
}
