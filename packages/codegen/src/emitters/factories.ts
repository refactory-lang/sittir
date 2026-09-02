import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import {
	kindDiscriminantExprForId,
	kindDiscriminantExprForLiteral,
	collectKindEntries,
	collectCatalogKinds,
	kindDiscriminantExpr,
	findKindEntry,
	findKindEntryForLiteral,
	hasCatalogEntry,
	type KindEnumEntry
} from './kind-discriminant.ts';
import {
	type AssembledNode,
	type AssembledNonterminal,
	type AssembledBranch,
	type AssembledPattern,
	type AssembledEnum,
	AssembledList,
	AssembledEnvelope,
	AssembledPolymorph,
	AssembledSupertype,
	AssembledKeyword,
	AssembledToken,
	type TextValueStorage,
	type FieldStorageInfo
} from '../compiler/model/node-map.ts';
import { isNodeRef, isTerminalValue, storageKindOfRef, isKindIdStored } from '../compiler/model/node-map.ts';
import {
	isRequired,
	isMultiple,
	isNonEmpty,
	slotKindNames,
	slotLiteralValues,
	fieldTypeComponents,
	childTypeComponents,
	isValidIdent,
	valueStorageOf,
	resolveFieldStorageInfo,
	resolveHiddenKeywordLiteral,
	classifyFactoryShape,
	factoryTakesSpreadChildren,
	isSlotBearingCompound,
	keywordRefWireIdentity,
	classifyFactoryEmission,
	forwardedTargetKind,
	resolveDirectFactorySlot,
	collectAliasSourceKinds,
	warnSkippedParserSymbol,
	soleSlotFacts,
	canonicalSeparatedListField,
	escForSource,
	emitsPlainBuiltAlias,
	transparentWrapperContentSlot,
	isAuthoredCompound
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

function collectUsesNonEmptyArray(nodeMap: NodeMap): boolean {
	for (const n of nodeMap.nodes.values()) {
		if (n instanceof AssembledList && n.nonEmpty) return true;
		if (n.slots.some((f) => isNonEmpty(f))) return true;
	}
	return false;
}

function collectStorageCoercionImports(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string[] {
	const imports = new Set<string>();
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
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
				case 'mixedEnum':
					if (kindEntries) imports.add('coerceMixedEnumStorage');
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
		for (const slot of node.slots) {
			const storageInfo = resolveFieldStorageInfo(slot, nodeMap, kindEntries);
			if (storageInfo.kind !== 'kindEnum' && storageInfo.kind !== 'mixedEnum') continue;
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
		if (kind.startsWith('_') && node.modelType === 'token') continue;
		if (node.modelType !== 'pattern' || !node.pattern) continue;
		const fn = node.rawFactoryName!;
		const constName = `_leafRe_${fn}`;
		const cleaned = stripUselessEscapes(node.pattern);
		const fullPattern = `^(?:${cleaned})$`;
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
	if (!hasCatalogEntry(kindEntries, kind)) {
		throw new Error(
			`factoryTypeDiscriminant: kind '${kind}' has no parser symbol (TSGrammar-only). ` +
				`Filter this kind at the emitter entry point before calling factoryTypeDiscriminant.`
		);
	}
	return `${kindDiscriminantExpr(kind, nodeMap, kindEntries)} as const`;
}

function buildFactoryMapEntries(
	nodeMap: NodeMap,
	_aliasSourceKinds: Set<string>,
	kindEntries?: readonly KindEnumEntry[]
): MapEntry[] {
	const mapEntries: MapEntry[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		const isHiddenGroup = kind.startsWith('_') && !(node instanceof AssembledToken);
		if (!node.userFacing && !isHiddenGroup) continue;
		if (!node.rawFactoryName) continue;
		if (resolveHiddenKeywordLiteral(kind, nodeMap) !== undefined) continue;
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		const fluent = emitsPlainBuiltAlias(kind, node, { nodeMap, kindEntries });
		const classified = classifyFactoryShape(node, nodeMap, { includeTokenText: true });
		if (!classified) continue;
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
			lines.push(`  ${JSON.stringify(kind)}: T.${typeName}.Built;`);
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
				result = emitTextFactory(node, 'text: string', 'text', guard, kindEntries, nodeMap);
				break;
			}
			case 'token':
				if (node instanceof AssembledKeyword) {
					result = emitKindIdFactory(node, kindEntries, nodeMap);
				}
				break;
			case 'enum': {
				const literalUnion = buildEnumLiteralUnion(node);
				result = emitTextFactory(node, `text: ${literalUnion}`, 'text', undefined, kindEntries, nodeMap);
				break;
			}
			default:
				break;
		}
		if (result) output.push(result);
	}

	export function branch(
		output: string[],
		node: FieldCarryingNode,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(emitFieldCarryingFactory(node, node.slots, nodeMap, kindEntries));
	}

	export function group(
		output: string[],
		node: FieldCarryingNode,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(emitFieldCarryingFactory(node, node.slots, nodeMap, kindEntries));
	}

	export function separatedList(
		output: string[],
		node: AssembledList,
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

type FieldCarryingNode = AssembledBranch | AssembledEnvelope | AssembledPolymorph;

export function childElementType(
	node: { children: readonly AssembledNonterminal[] },
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): string {
	const parts = new Set<string>();
	for (const c of node.children) {
		const slotInfo = resolveFieldStorageInfo(c, nodeMap);
		for (const value of c.values) {
			const storage = valueStorageOf(value, nodeMap);
			if (storage === undefined) continue;
			if (storage.via !== 'node') {
				parts.add(valueKindIdExpr(storage, slotInfo, kindEntries) ?? JSON.stringify(storage.text));
				continue;
			}
			if (storage.missing) {
				parts.add(`T.${storage.typeName}`);
				continue;
			}
			let ref = nodeMap.nodes.get(storage.kind);
			if (!ref) {
				parts.add(JSON.stringify(storage.kind));
				continue;
			}
			if (storage.kind.startsWith('_') && ref instanceof AssembledToken) {
				const visible = nodeMap.nodes.get(storage.kind.slice(1));
				if (visible) ref = visible;
			}
			const name = ref.typeName;
			parts.add(isValidIdent(name) ? `T.${name}` : JSON.stringify(storage.kind));
		}
	}
	if (parts.size === 0) return 'never';
	const union = [...parts].join(' | ');
	return parts.size > 1 ? `(${union})` : union;
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
}

export function kindEnumTextMapExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if ((storageInfo.kind !== 'kindEnum' && storageInfo.kind !== 'mixedEnum') || !kindEntries) return '[]';
	const byText: Array<readonly [string, string]> = [];
	for (const value of f.values) {
		if (isNodeRef(value)) {
			const kind = storageKindOfRef(value.node);
			const resolved = nodeMap.nodes.get(kind);
			if (resolved !== undefined && isKindIdStored(resolved)) {
				const text = resolved.text;
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
			const storageType = isMultiple(f) && !storageInfo.collapsesMultiplicity ? 'number[]' : 'number';
			return kindEntries
				? `coerceKindEnumStorage<${storageType}>(${valueExpr}, ${kindEnumTextMapExpr(f, nodeMap, kindEntries)})`
				: valueExpr;
		}
		case 'mixedEnum': {
			if (!kindEntries) return valueExpr;
			const elem = fieldElementType(f, nodeMap, kindEntries);
			const storageType = isMultiple(f) && !storageInfo.collapsesMultiplicity ? `(${elem})[]` : elem;
			return `coerceMixedEnumStorage<${storageType}>(${valueExpr}, ${kindEnumTextMapExpr(f, nodeMap, kindEntries)})`;
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
	const withDefault = isMultiple(f) ? `(${valueExpr} ?? [])` : valueExpr;
	return slotStorageFromValueExpr(f, withDefault, nodeMap, kindEntries);
}

function setterValueSignature(f: AssembledNonterminal, elemType: string): string {
	if (isRequired(f)) return `value: ${elemType}`;
	return `value?: ${elemType}`;
}

function setterElemType(
	f: AssembledNonterminal,
	elemType: string,
	paramType: string,
	nodeMap: NodeMap,
	fnTakesFieldDirectly = false
): string {
	if (resolveFieldStorageInfo(f, nodeMap).kind !== 'verbatim') {
		return fnTakesFieldDirectly ? `NonNullable<${paramType}>` : `NonNullable<${paramType}>['${f.configKey}']`;
	}
	return elemType;
}

export interface BuiltTypeSurface {
	readonly extendsList: readonly string[];
	readonly members: readonly string[];
	readonly buildArgs: string;
	readonly looseArgs: string;
}

function builtInterfaceMembers(withTypeMembers: readonly string[], extraMembers: readonly string[] = []): string[] {
	return [
		'  readonly $source: 2;',
		'  readonly $named: true;',
		...extraMembers,
		'  readonly $with: {',
		...withTypeMembers,
		'  };'
	];
}

function setterTypeMember(
	f: AssembledNonterminal,
	configType: string,
	self: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if (isMultiple(f) && storageInfo.kind === 'verbatim') {
		const elemType = fieldElementType(f, nodeMap, kindEntries);
		const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
		const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
		return `    ${f.propertyName}(...values: ${restType}): ${self};`;
	}
	const elemType = setterElemType(f, fieldElementType(f, nodeMap, kindEntries), configType, nodeMap);
	return `    ${f.propertyName}(${setterValueSignature(f, elemType)}): ${self};`;
}

function fieldCarryingBuiltTypeSurface(
	node: FieldCarryingNode,
	slots: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface {
	const self = `T.${node.typeName}.Built`;
	const surface = resolveFactorySurface(node, nodeMap, kindEntries);
	const { spreadFacts, singleField } = surface;
	let withTypeMembers: string[];
	if (spreadFacts) {
		withTypeMembers = [`    ${spreadFacts.slot.propertyName}(...vs: ${surface.elementType!}[]): ${self};`];
	} else if (singleField) {
		const setterType = setterElemType(singleField, surface.directParamType!, surface.directParamType!, nodeMap, true);
		withTypeMembers = [`    ${singleField.propertyName}(${setterValueSignature(singleField, setterType)}): ${self};`];
	} else {
		const configType = surface.configType ?? `T.${node.typeName}.Config`;
		withTypeMembers = slots.map((f) => setterTypeMember(f, configType, self, nodeMap, kindEntries));
	}
	return {
		extendsList: [`T.${node.typeName}`, 'NodeMethodsOf'],
		members: builtInterfaceMembers(withTypeMembers),
		buildArgs: paramsToTuple(surface.rowParams),
		looseArgs: paramsToTuple(surface.rowLooseParams)
	};
}

function leafBuiltTypeSurface(
	node: AssembledNode,
	params: string,
	textType: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface {
	return {
		extendsList: ['NodeMethodsOf'],
		members: [
			`  readonly $type: ${kindDiscriminantType(node.kind, nodeMap, kindEntries)};`,
			'  readonly $source: 2;',
			'  readonly $named: true;',
			`  readonly $text: ${textType};`
		],
		buildArgs: paramsToTuple(params),
		looseArgs: paramsToTuple(params)
	};
}

export function builtTypeSurfaceOf(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface | undefined {
	if (node instanceof AssembledList) return listBuiltTypeSurface(node, nodeMap, kindEntries);
	if (isSlotBearingCompound(node)) return fieldCarryingBuiltTypeSurface(node, node.slots, nodeMap, kindEntries);
	switch (node.modelType) {
		case 'pattern':
			return leafBuiltTypeSurface(node, 'text: string', 'string', nodeMap, kindEntries);
		case 'enum': {
			const union = buildEnumLiteralUnion(node);
			return leafBuiltTypeSurface(node, `text: ${union}`, union, nodeMap, kindEntries);
		}
		default:
			return undefined;
	}
}

export function fieldElementType(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): string {
	const literals = slotLiteralValues(f);
	const kindNames = slotKindNames(f);

	if (literals.length > 0 && kindNames.length === 0) {
		return literals.map((v) => JSON.stringify(v)).join(' | ');
	}
	if (kindNames.length === 0 && literals.length === 0) return 'string';

	const slotInfo = resolveFieldStorageInfo(f, nodeMap);
	const parts: string[] = [];
	for (const value of f.values) {
		const storage = valueStorageOf(value, nodeMap);
		if (storage === undefined) continue;
		if (storage.via === 'node') {
			parts.push(
				storage.missing || isValidIdent(storage.typeName) ? `T.${storage.typeName}` : JSON.stringify(storage.kind)
			);
			continue;
		}
		parts.push(valueKindIdExpr(storage, slotInfo, kindEntries) ?? JSON.stringify(storage.text));
	}
	return [...new Set(parts)].join(' | ');
}

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

function delimiterUnionFor(list: {
	readonly leadingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly trailingDelimiter: 'mandatory' | 'optional' | 'none';
}): string {
	return delimiterMembersFor(list).join(' | ');
}

interface FactoryParam {
	readonly label: string;
	readonly optional: boolean;
	readonly rest: boolean;
	readonly strictType: string;
	readonly looseType: string;
	readonly rowStrictType?: string;
	readonly rowLooseType?: string;
	readonly defaultValue?: string;
}

interface FactorySurface {
	readonly spreadFacts: ReturnType<typeof soleSlotFacts> | null;
	readonly singleField: AssembledNonterminal | undefined;
	readonly param: FactoryParam;
	readonly params: string;
	readonly looseParams: string;
	readonly rowParams: string;
	readonly rowLooseParams: string;
	readonly args: string;
	readonly elementType?: string;
	readonly directParamType?: string;
	readonly directParamOptional: boolean;
	readonly configType?: string;
	readonly opt: '' | '?';
}

export function declarationParams(params: string): string {
	return params.replace(/(\w+)\??: (.+?) = .+$/, '$1?: $2');
}

function paramText(param: FactoryParam, type: string): string {
	const rest = param.rest ? '...' : '';
	const initializer = param.defaultValue === undefined ? '' : ` = ${param.defaultValue}`;
	const optMark = param.optional && !param.rest && param.defaultValue === undefined ? '?' : '';
	return `${rest}${param.label}${optMark}: ${type}${initializer}`;
}

function renderSurfaceParams(param: FactoryParam): {
	params: string;
	looseParams: string;
	rowParams: string;
	rowLooseParams: string;
} {
	return {
		params: paramText(param, param.strictType),
		looseParams: paramText(param, param.looseType),
		rowParams: paramText(param, param.rowStrictType ?? param.strictType),
		rowLooseParams: paramText(param, param.rowLooseType ?? param.looseType)
	};
}

function paramsToTuple(params: string): string {
	return `[${declarationParams(params)}]`;
}

function looseValueOf(elementType: string): string {
	return `LooseValue<${elementType}, T.LeafScalarMap, T.LeafStringMap, T.NamespaceMap>`;
}

function resolveFactorySurface(
	node: FieldCarryingNode,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): FactorySurface {
	const spreadFacts =
		isAuthoredCompound(node) && factoryTakesSpreadChildren(node, nodeMap) ? soleSlotFacts(node, nodeMap) : null;
	const singleField = !spreadFacts ? resolveDirectFactorySlot(node, nodeMap) : undefined;
	if (spreadFacts) {
		const elementType = childElementType({ children: [spreadFacts.slot] }, nodeMap, kindEntries);
		if (spreadFacts.multiple) {
			const param: FactoryParam = {
				label: 'children',
				optional: false,
				rest: true,
				strictType: `${elementType}[]`,
				looseType: `${looseValueOf(elementType)}[]`
			};
			return {
				spreadFacts,
				singleField,
				param,
				...renderSurfaceParams(param),
				args: '...children',
				elementType,
				directParamOptional: false,
				opt: ''
			};
		}
		const param: FactoryParam = {
			label: 'child',
			optional: !spreadFacts.required,
			rest: false,
			strictType: elementType,
			looseType: looseValueOf(elementType)
		};
		return {
			spreadFacts,
			singleField,
			param,
			...renderSurfaceParams(param),
			args: 'child',
			elementType,
			directParamType: elementType,
			directParamOptional: !spreadFacts.required,
			opt: spreadFacts.required ? '' : '?'
		};
	}
	if (singleField) {
		const elemType = childElementType({ children: [singleField] }, nodeMap, kindEntries);
		const param: FactoryParam = {
			label: 'value',
			optional: !isRequired(singleField),
			rest: false,
			strictType: elemType,
			looseType: looseValueOf(elemType)
		};
		return {
			spreadFacts,
			singleField,
			param,
			...renderSurfaceParams(param),
			args: 'value',
			directParamType: elemType,
			directParamOptional: !isRequired(singleField),
			opt: isRequired(singleField) ? '' : '?'
		};
	}
	const slots = node.slots;
	const opt = resolveConfigOptional(slots);
	const configType = resolveConfigType(node, nodeMap.refineForms?.has(node.kind) ?? false);
	const hasConfigReads = slots.length > 0;
	const allOptional = opt === '?' && hasConfigReads;
	const param: FactoryParam = {
		label: 'config',
		optional: opt === '?',
		rest: false,
		strictType: allOptional ? `Partial<${configType}>` : configType,
		looseType: `T.${node.typeName}.Loose`,
		rowStrictType: allOptional ? `Partial<ConfigOf<T.${node.typeName}>>` : `ConfigOf<T.${node.typeName}>`,
		rowLooseType: `LooseConfigOf<T.${node.typeName}, T.LeafScalarMap, T.LeafStringMap, [], T.NamespaceMap> | T.${node.typeName}`,
		...(allOptional ? { defaultValue: '{}' } : {})
	};
	return {
		spreadFacts,
		singleField,
		param,
		...renderSurfaceParams(param),
		args: 'config',
		configType,
		directParamOptional: false,
		opt
	};
}

export function constructorTargetKind(kind: string, nodeMap: NodeMap, kindEntries?: readonly KindEnumEntry[]): string {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || !isSlotBearingCompound(node) || node instanceof AssembledList) return kind;
	const surface = resolveFactorySurface(node, nodeMap, kindEntries);
	const target = surface.directParamType !== undefined ? forwardedTargetKind(node, nodeMap) : null;
	return target === null ? kind : constructorTargetKind(target, nodeMap, kindEntries);
}

function chainParamOptional(kind: string, nodeMap: NodeMap, kindEntries?: readonly KindEnumEntry[]): boolean {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || !isSlotBearingCompound(node) || node instanceof AssembledList) return false;
	const surface = resolveFactorySurface(node, nodeMap, kindEntries);
	if (surface.directParamType === undefined) return false;
	if (surface.directParamOptional) return true;
	const target = forwardedTargetKind(node, nodeMap);
	return target === null ? false : chainParamOptional(target, nodeMap, kindEntries);
}

export function constructorSurface(
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): { params: string; looseParams?: string; args: string; argOptional?: boolean } | undefined {
	const target = nodeMap.nodes.get(constructorTargetKind(kind, nodeMap, kindEntries));
	if (target === undefined) return undefined;
	switch (target.modelType) {
		case 'list': {
			const list = separatedListSurface(target, nodeMap, kindEntries);
			return list.optionsType === undefined
				? { params: `...elements: ${list.elementsType}`, args: '...elements' }
				: { params: `...args: (${list.optionsType} | ${list.elemTypeForArray})[]`, args: '...args' };
		}
		case 'envelope':
		case 'branch':
		case 'polymorph': {
			if (target instanceof AssembledSupertype) return undefined;
			const surface = resolveFactorySurface(target, nodeMap, kindEntries);
			const optionalized = chainParamOptional(kind, nodeMap, kindEntries) && /^\w+: /.test(surface.params);
			const relax = (text: string): string => (optionalized ? text.replace(/^(\w+): /, '$1?: ') : text);
			return {
				params: relax(surface.params),
				looseParams: relax(surface.looseParams),
				args: surface.args,
				argOptional: optionalized
			};
		}
		case 'token':
			if (!(target instanceof AssembledKeyword)) return undefined;
			return { params: '', args: '' };
		case 'pattern':
			return { params: 'text: string', args: 'text' };
		case 'enum':
			return { params: `text: ${buildEnumLiteralUnion(target)}`, args: 'text' };
		default:
			return undefined;
	}
}

function emitFieldCarryingFactory(
	node: FieldCarryingNode,
	slots: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string {
	const exportName = node.rawFactoryName!;
	const fn = exportName;
	const exportKw = 'export ';
	slots = slots ?? [];
	const typeKind = node.kind;
	const surface = resolveFactorySurface(node, nodeMap, kindEntries);
	const { spreadFacts, singleField } = surface;

	const flankField = slots.find((f) => f.trailingDelimiter === 'optional' || f.leadingDelimiter === 'optional');
	if (flankField !== undefined) {
		throw new Error(
			`emitFieldCarryingFactory: '${typeKind}' field '${flankField.name}' carries an optional delimiter — ` +
				`a delimiter-bearing list must classify as its own separatedList kind (kind-level _delimiter storage)`
		);
	}

	const builtName = `T.${node.typeName}.Built`;
	const configType = surface.configType ?? `T.${node.typeName}.Config`;
	const signature = `${exportKw}function ${fn}(${surface.params}): ${builtName} {`;
	let valueSourceFor: (f: AssembledNonterminal) => string;
	let withLines: string[];
	let slotsToEmit: readonly AssembledNonterminal[] = slots;

	if (spreadFacts) {
		slotsToEmit = [spreadFacts.slot];
		const elementType = surface.elementType!;
		const setter = spreadFacts.slot.propertyName;
		valueSourceFor = (f) => (f === spreadFacts.slot ? 'children' : '');
		withLines = [`    $with: { ${setter}: (...vs: ${elementType}[]) => ${fn}(...vs) },`];
	} else if (singleField) {
		const elemType = surface.directParamType!;
		valueSourceFor = (f) => slotStorageFromValueExpr(f, 'value', nodeMap, kindEntries);
		const setterType = setterElemType(singleField, elemType, elemType, nodeMap, true);
		const setterSig = setterValueSignature(singleField, setterType);
		withLines = ['    $with: {', `      ${singleField.propertyName}: (${setterSig}) => ${fn}(value),`, '    },'];
	} else {
		const configAccess = 'config';
		valueSourceFor = (f) => slotStorageExpr(f, configAccess, nodeMap, kindEntries);
		withLines = ['    $with: {'];
		for (const f of slots) {
			const method = f.propertyName;
			const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
			if (isMultiple(f) && storageInfo.kind === 'verbatim') {
				const elemType = fieldElementType(f, nodeMap, kindEntries);
				const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
				const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
				withLines.push(
					`      ${method}: (...values: ${restType}) => ${fn}({ ...${configAccess}, ${f.configKey}: values }),`
				);
			} else {
				const elemType = setterElemType(f, fieldElementType(f, nodeMap, kindEntries), configType, nodeMap);
				const setterSig = setterValueSignature(f, elemType);
				withLines.push(`      ${method}: (${setterSig}) => ${fn}({ ...${configAccess}, ${f.configKey}: value }),`);
			}
		}
		withLines.push('    },');
	}

	const lines: string[] = [signature];
	if (spreadFacts?.multiple && spreadFacts.nonEmpty) {
		lines.push(`  _assertNonEmpty(children, '${node.kind}.children');`);
	}
	for (const f of slotsToEmit) {
		lines.push(`  const ${f.storageKey} = ${valueSourceFor(f)};`);
	}
	lines.push('  return withMethods(withAccessors({');
	lines.push(`    $type: ${factoryTypeDiscriminant(typeKind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	for (const f of slotsToEmit) {
		lines.push(`    ${f.storageKey},`);
	}
	lines.push(...withLines);
	lines.push('  }, {');
	for (const f of slotsToEmit) {
		const propName = f.propertyName;
		lines.push(`    ${propName}: () => ${f.storageKey},`);
	}
	lines.push('  }), methodsEngine);');
	lines.push('}');

	const { directParamType, directParamOptional } = surface;
	const resolvedForwardTarget = directParamType !== undefined ? forwardedTargetKind(node, nodeMap) : null;
	const forwardTarget =
		resolvedForwardTarget !== null && kindEntries !== undefined && !hasCatalogEntry(kindEntries, resolvedForwardTarget)
			? null
			: resolvedForwardTarget;
	if (forwardTarget !== null) {
		const targetFn = nodeMap.nodes.get(forwardTarget)!.rawFactoryName!;
		lines[0] = lines[0]!.replace(`${exportKw}function ${fn}(`, `function _${fn}(`);
		const targetSurfaceParams = constructorSurface(forwardTarget, nodeMap, kindEntries)?.params;
		const rawTargetParams = targetSurfaceParams ?? `...args: Parameters<typeof ${targetFn}>`;
		const targetNode = nodeMap.nodes.get(forwardTarget);
		const targetTakesNoArgs =
			targetSurfaceParams !== undefined &&
			!(targetNode instanceof AssembledList && targetNode.nonEmpty) &&
			!targetSurfaceParams.includes('NonEmptyArray<') &&
			(targetSurfaceParams === '' || targetSurfaceParams.startsWith('...') || /^\w+\?:/.test(targetSurfaceParams));
		const targetParams = declarationParams(rawTargetParams);
		const wrapper: string[] = [
			`${exportKw}function ${fn}(${declarationParams(surface.params)}): ReturnType<typeof _${fn}>;`,
			`${exportKw}function ${fn}(${targetParams}): ReturnType<typeof _${fn}>;`,
			`${exportKw}function ${fn}(...args: unknown[]) {`
		];
		if (!directParamOptional && targetTakesNoArgs) {
			wrapper.push(`  if (args.length === 0) {`, `    return _${fn}(${targetFn}() as ${directParamType});`, `  }`);
		}
		wrapper.push(
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
	return renameUnusedConfigParam(lines);
}

export function slotStoresKindIds(info: FieldStorageInfo | undefined): boolean {
	return info === undefined || info.kind === 'kindEnum' || info.kind === 'mixedEnum';
}

export function valueKindIdExpr(
	storage: TextValueStorage,
	slotInfo: FieldStorageInfo | undefined,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	if (storage.via !== 'kindId' || kindEntries === undefined || !slotStoresKindIds(slotInfo)) return undefined;
	const entry =
		storage.kindId !== undefined
			? kindEntries.find((e) => e.id === storage.kindId)
			: findKindEntry(kindEntries, storage.kind);
	return entry === undefined ? undefined : `TSKindId.${entry.member}`;
}

export function valueStorageExpr(
	storage: TextValueStorage,
	slotInfo: FieldStorageInfo | undefined,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	return valueKindIdExpr(storage, slotInfo, kindEntries) ?? `'${escForSource(storage.text)}'`;
}

export function kindEnumTextExpr(text: string, kindEntries: readonly KindEnumEntry[] | undefined): string {
	const entry = kindEntries === undefined ? undefined : findKindEntryForLiteral(kindEntries, text);
	return entry === undefined ? `'${escForSource(text)}'` : `TSKindId.${entry.member}`;
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
	const idx = lines.findIndex((l) => /^(?:export )?function \w+\(config\??:/.test(l));
	if (idx === -1) return lines.join('\n');
	const rest = [...lines.slice(0, idx), ...lines.slice(idx + 1)].join('\n');
	if (!/\bconfig\b/.test(rest)) {
		lines[idx] = lines[idx]!.replace(/\bconfig(\??:)/, '_config$1');
	}
	return lines.join('\n');
}

function emitRefineFormFactory(
	node: AssembledNode,
	form: RefineFormInfo,
	info: RefineKindInfo,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined
): string | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
	const baseFn = node.rawFactoryName;
	if (!baseFn) return undefined;
	const formFn = refineFormFactoryName(baseFn, form.name);
	const narrowed = new Map<string, string>();
	for (const n of form.narrowedFields) narrowed.set(n.fieldName, n.literal);
	const slots = node.slots;
	const opt = resolveRefineFormConfigOptional(slots, nodeMap, narrowed);
	const formTypeName = refineFormTypeName(info.typeName, form.name);
	const formShortName = formTypeName.slice(info.typeName.length);
	const lines: string[] = [];
	const formConfigType = `T.${info.typeName}.${formShortName}.Config`;
	const formBuiltName = `T.${info.typeName}.${formShortName}.Built`;
	lines.push(`export function ${formFn}(config${opt}: ${formConfigType}): ${formBuiltName} {`);
	for (const f of slots) {
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
	for (const f of slots) {
		lines.push(`    ${f.storageKey},`);
	}
	lines.push('    $with: {');
	for (const f of slots) {
		if (narrowed.has(f.name)) continue;
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (isMultiple(f) && storageInfo.kind === 'verbatim') {
			const elemType = fieldElementType(f, nodeMap);
			const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
			lines.push(`      ${method}: (...values: ${restType}) => ${formFn}({ ...config, ${f.configKey}: values }),`);
		} else {
			const elemType = setterElemType(f, fieldElementType(f, nodeMap, kindEntries), formConfigType, nodeMap);
			const setterSig = setterValueSignature(f, elemType);
			lines.push(`      ${method}: (${setterSig}) => ${formFn}({ ...config, ${f.configKey}: value }),`);
		}
	}
	lines.push('    },');
	lines.push('  }, {');
	for (const f of slots) {
		const propName = f.propertyName;
		lines.push(`    ${propName}: () => ${f.storageKey},`);
	}
	lines.push('  }), methodsEngine);');
	lines.push('}');
	return renameUnusedConfigParam(lines);
}

export function refineFormBuiltTypeSurfaceOf(
	node: AssembledNode,
	form: RefineFormInfo,
	info: RefineKindInfo,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList || !node.rawFactoryName) return undefined;
	const narrowed = new Set(form.narrowedFields.map((n) => n.fieldName));
	const formShortName = refineFormTypeName(info.typeName, form.name).slice(info.typeName.length);
	const formConfigType = `T.${info.typeName}.${formShortName}.Config`;
	const self = `T.${info.typeName}.${formShortName}.Built`;
	const opt = resolveRefineFormConfigOptional(node.slots, nodeMap, new Map(form.narrowedFields.map((n) => [n.fieldName, n.literal])));
	const withTypeMembers = node.slots
		.filter((f) => !narrowed.has(f.name))
		.map((f) => setterTypeMember(f, formConfigType, self, nodeMap, kindEntries));
	const params = `config${opt}: ${formConfigType}`;
	return {
		extendsList: [`T.${info.typeName}`, 'NodeMethodsOf'],
		members: builtInterfaceMembers(withTypeMembers),
		buildArgs: paramsToTuple(params),
		looseArgs: paramsToTuple(params)
	};
}

function resolveRefineFormConfigOptional(
	slots: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	narrowed: ReadonlyMap<string, string>
): '' | '?' {
	const hasRequired = slots.some((f) => isRequired(f) && !narrowed.has(f.name));
	return hasRequired ? '' : '?';
}

function resolveConfigOptional(slots: readonly AssembledNonterminal[]): '' | '?' {
	slots = slots ?? [];
	const hasRequired = slots.some((f) => isRequired(f));
	return hasRequired ? '' : '?';
}

function resolveConfigType(node: FieldCarryingNode, hasRefineForms: boolean): string {
	if (hasRefineForms) return `ConfigOf<T.${node.typeName}>`;
	return `T.${node.typeName}.Config`;
}

function elementsTypeOf(nonEmpty: boolean, elemType: string): string {
	return nonEmpty ? `NonEmptyArray<${elemType}>` : `${parenthesizeUnion(elemType)}[]`;
}

function elementsTuple(nonEmpty: boolean, elemType: string): string {
	const rest = `...elements: ${parenthesizeUnion(elemType)}[]`;
	return nonEmpty ? `[element: ${elemType}, ${rest}]` : `[${rest}]`;
}

function parenthesizeUnion(elemType: string): string {
	return elemType.includes(' | ') ? `(${elemType})` : elemType;
}

export function separatedListSurface(
	node: AssembledList,
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
	readonly wrapper?: {
		readonly member: string;
		readonly factory: string;
		readonly contentKey: string;
		readonly typeName: string;
	};
	readonly storageElementsType: string;
} {
	const contentSlot = buildSeparatedListContentSlot(node);
	let elemType = fieldElementType(contentSlot, nodeMap, kindEntries);
	const baseElemType = elemType;
	let wrapper: { member: string; factory: string; contentKey: string; typeName: string } | undefined;
	const contentKinds = slotKindNames(contentSlot);
	if (contentKinds.length === 1 && kindEntries) {
		const wKind = contentKinds[0]!;
		const entry = findKindEntry(kindEntries, wKind);
		const content = transparentWrapperContentSlot(wKind, nodeMap);
		const factoryName = nodeMap.nodes.get(wKind)?.rawFactoryName;
		if (entry !== undefined && content !== undefined && factoryName !== undefined) {
			wrapper = {
				member: entry.member,
				factory: factoryName,
				contentKey: content.configKey,
				typeName: nodeMap.nodes.get(wKind)!.typeName
			};
			elemType = `${elemType} | ${fieldElementType(content, nodeMap, kindEntries)}`;
		}
	}
	const elemTypeForArray = parenthesizeUnion(elemType);
	const elementsType = elementsTypeOf(node.nonEmpty, elemType);
	const hasSeparatorKindOption = node.separatorRule !== undefined;
	const candidateKindNames = hasSeparatorKindOption
		? collectSeparatorCandidateKindNames(node.separatorRule!).filter((k) => hasCatalogEntry(kindEntries, k))
		: [];
	const hasDelimiterOption = node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional';
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
		optionsType,
		wrapper,
		storageElementsType: node.nonEmpty ? `NonEmptyArray<${baseElemType}>` : `${parenthesizeUnion(baseElemType)}[]`
	};
}

function listBuiltTypeSurface(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface {
	const self = `T.${node.typeName}.Built`;
	const canonical = node.slots.length > 1 ? undefined : canonicalSeparatedListField(node);
	const contentAccessorName = canonical?.propertyName ?? 'content';
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	const withTypeMembers = [
		`    ${contentAccessorName}(...vs: ${surface.elementsType}): ${self};`,
		...(surface.hasSeparatorKindOption ? [`    separator(v: ${surface.separatorKindUnion}): ${self};`] : []),
		...(surface.hasDelimiterOption ? [`    delimiter(v?: ${delimiterUnionFor(node)}): ${self};`] : [])
	];
	const extraMembers = [
		...(surface.hasSeparatorKindOption ? ['  readonly _separator: number | undefined;'] : []),
		...(surface.hasDelimiterOption ? ['  readonly _delimiter: Delimiter;'] : [])
	];
	return {
		extendsList: [`T.${node.typeName}`, 'NodeMethodsOf'],
		members: builtInterfaceMembers(withTypeMembers, extraMembers),
		buildArgs: elementsTuple(node.nonEmpty, surface.elemType),
		looseArgs: elementsTuple(node.nonEmpty, looseValueOf(surface.elemTypeForArray))
	};
}

function emitSeparatedListFactory(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const fn = node.rawFactoryName;

	const isMultiField = node.slots.length > 1;
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
	const listBuiltName = `T.${node.typeName}.Built`;
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
	if (node.terminatedSeparator && hasTrailingOption) {
		lines.push(`  if (elements.length === 1 && ((options.delimiter ?? Delimiter.None) & Delimiter.Trailing) === 0) {`);
		lines.push(`    throw new Error('${node.kind}: a single element requires a trailing delimiter (delimiter: 2)');`);
		lines.push('  }');
	}
	const w = surface.wrapper;
	if (w !== undefined) {
		lines.push(
			`  const _mapped = elements.map((e): T.${w.typeName} => (isNodeData(e) && e.$type === TSKindId.${w.member} ? (e as T.${w.typeName}) : ${w.factory}({ ${w.contentKey}: e } as Parameters<typeof ${w.factory}>[0])));`
		);
		if (node.nonEmpty) lines.push(`  _assertNonEmpty(_mapped, '${node.kind}.elements');`);
		lines.push(`  const ${contentStorageKey} = _mapped;`);
	} else {
		lines.push(`  const ${contentStorageKey} = elements;`);
	}
	if (hasSeparatorKindOption) {
		if (candidateKindNames.length > 0) {
			const arms = candidateKindNames
				.map((k) => `${JSON.stringify(k)}: ${kindDiscriminantExpr(k, nodeMap, kindEntries)}`)
				.join(', ');
			lines.push(
				`  const _separator = options.separator === undefined ? undefined : ({ ${arms} } as Record<string, number>)[options.separator];`
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
	lines.push(`      ${contentAccessorName}: (...vs: ${elementsType}) => ${fn}(${optionsArg}...vs),`);
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

interface TextFactoryNode {
	readonly kind: string;
	readonly typeName: string;
	readonly treeTypeName: string;
	readonly rawFactoryName?: string;
}

function emitKindIdFactory(node: TextFactoryNode, kindEntries: readonly KindEnumEntry[] | undefined, nodeMap: NodeMap): string {
	const fn = node.rawFactoryName!;
	const id = kindDiscriminantType(node.kind, nodeMap, kindEntries);
	return [`export function ${fn}(): ${id} {`, `  return ${id};`, '}'].join('\n');
}

function kindDiscriminantType(kind: string, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string {
	return kindEntries === undefined ? JSON.stringify(kind) : kindDiscriminantExpr(kind, nodeMap, kindEntries);
}

function emitTextFactory(
	node: TextFactoryNode,
	params: string,
	textExpr: string,
	guard?: string,
	kindEntries?: readonly KindEnumEntry[],
	nodeMap?: NodeMap
): string {
	const fn = node.rawFactoryName!;
	const typeExpr = factoryTypeDiscriminant(node.kind, nodeMap!, kindEntries);
	const body: string[] = [`export function ${fn}(${params}): T.${node.typeName}.Built {`];
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
		if (c === ']') {
			inClass = false;
			out += c;
			i++;
			continue;
		}
		if (c === '\\' && i + 1 < pattern.length) {
			const next = pattern[i + 1];
			if (next === '[') {
				out += '[';
				i += 2;
				continue;
			}
			if (next === '-' && pattern[i + 2] === ']') {
				out += '-';
				i += 2;
				continue;
			}
			out += c + next;
			i += 2;
			continue;
		}
		out += c;
		i++;
	}
	try {
		new RegExp(out, 'u');
	} catch {
		return pattern;
	}
	return out;
}

interface MapEntry {
	kind: string;
	factory: string;
	typeName: string;
	fluent: boolean;
	shape: 'config' | 'children' | 'text' | 'direct' | 'forwarded';
}

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
		const {
			nodeMap,
			generatedIdTables,
			kindEntries: providedKindEntries,
			inlineKinds,
			synthesizedKinds
		} = config;
		const kindEntries =
			providedKindEntries ??
			(generatedIdTables
				? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
				: undefined);

		const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];

		lines.push(`import type * as T from '../types.js';`);
		lines.push(`import { Delimiter } from '../types.js';`);
		if (kindEntries) {
			const kindIdImports = ['TSKindId'];
			if (collectUsesKindIdFromName(nodeMap, kindEntries)) kindIdImports.push('kindIdFromName');
			lines.push(`import { ${kindIdImports.join(', ')} } from '../types.js';`);
		}
		const usesElementWrap = [...nodeMap.nodes.values()].some(
			(n) => n instanceof AssembledList && separatedListSurface(n, nodeMap, kindEntries).wrapper !== undefined
		);
		const storageCoercionImports = collectStorageCoercionImports(nodeMap, kindEntries);
		lines.push(SITTIR_TYPES_IMPORT_PLACEHOLDER);
		lines.push(
			`import { ${['withMethods', 'withAccessors', 'methodsEngine', ...storageCoercionImports, ...(usesElementWrap ? ['isNodeData'] : [])].join(', ')} } from '../utils.js';`
		);
		lines.push('');
		lines.push(...emitFluentSetterHelpers());
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

	emitLeaf(node: AssembledPattern | AssembledKeyword | AssembledEnum): void {
		factory.leaf(this.#output, node, this.#nodeMap, this.#leafReConsts, this.#kindEntries);
	}

	emitBranch(node: FieldCarryingNode): void {
		factory.branch(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitGroup(node: FieldCarryingNode): void {
		factory.group(this.#output, node, this.#nodeMap, this.#kindEntries);
	}

	emitSeparatedList(node: AssembledList): void {
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
			case 'enum':
				this.emitLeaf(node);
				break;
			case 'token':
				if (node instanceof AssembledKeyword) this.emitLeaf(node);
				break;
			case 'envelope':
			case 'branch':
				if (node.hoisted) this.emitGroup(node);
				else this.emitBranch(node);
				break;
			case 'polymorph':
				if (node instanceof AssembledSupertype) break;
				if (node.hoisted) this.emitGroup(node);
				else this.emitBranch(node);
				break;
			case 'list':
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

		const source = lines.join('\n');
		const body = source.replace(SITTIR_TYPES_IMPORT_PLACEHOLDER, '');
		const used = SITTIR_TYPES_IMPORT_CANDIDATES.filter((name) => new RegExp(`\\b${name}\\b`).test(body));
		return source.replace(SITTIR_TYPES_IMPORT_PLACEHOLDER, `import type { ${used.join(', ')} } from '@sittir/types';`);
	}
}

const SITTIR_TYPES_IMPORT_PLACEHOLDER = '__SITTIR_TYPES_IMPORT__';
const SITTIR_TYPES_IMPORT_CANDIDATES = ['AnyNodeData', 'ByteRange', 'ConfigOf', 'Edit', 'LooseValue', 'NonEmptyArray'];
