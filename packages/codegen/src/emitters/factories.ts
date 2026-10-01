import { LIST_VIEW_MEMBERS } from '@sittir/common/utils';
import { findOwnKindEntry, reservedWordset } from '../dsl/symbol-table.ts';
import type { AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { holdsFixedText, isBuilderTextLeaf, isPatternValue, isHiddenPresenceMarker, separatorRequired } from '../compiler/model/node-map.ts';
import {
	interiorSlotGuards,
	numberInputType,
	numberTextArgs,
	numericLeafShape,
	numericSlotKeys,
	numericSlotShape,
	optionalGroupPeers,
	widenNumericSlots
} from './interior.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import {
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
	AssembledPattern,
	AssembledAlias,
	AssembledEnum,
	AbstractAssembledCompound,
	AssembledList,
	AssembledSupertype,
	AssembledKeyword,
	AssembledPunctuation,
	type TextValueStorage,
	type FieldStorageInfo
} from '../compiler/model/node-map.ts';
import {
	isTerminalValue,
	isFixedTextLeaf,
	textStoragesOf,
	delimiterMembersFor
} from '../compiler/model/node-map.ts';
export { delimiterMembersFor } from '../compiler/model/node-map.ts';
import { anchoredLeafRegex, anchoredLeafRegexLiteral } from '../compiler/model/leaf-pattern.ts';
import {
	DELIMITER_IMPORT,
	isRequired,
	isMultiple,
	isNonEmpty,
	slotKindNames,
	slotLiteralValues,
	isValidIdent,
	valueStorageOf,
	resolveFieldStorageInfo,
	classifyFactoryShape,
	factoryTakesSpreadChildren,
	isSlotBearingCompound,
	classifyFactoryEmission,
	forwardedTargetKind,
	resolveDirectFactorySlot,
	warnSkippedParserSymbol,
	soleSlotFacts,
	emptyDefaultOf,
	kindEnumTextEntries,
	type KindEnumTextEntry,
	canonicalSeparatedListField,
	escForSource,
	emitsPlainBuiltAlias,
	transparentWrapperContentSlot,
	isAuthoredCompound,
	enumMemberDiscriminant,
	expandAndDedupeContentTypes,
	registeredSlots,
	withEmptyOverload,
	pruneUnusedImports
} from './shared.ts';
import {
	collectRefineKindInfos,
	refineFormTypeName,
	refineFormFactoryName,
	type RefineKindInfo,
	type RefineFormInfo
} from './refine-emit.ts';
import { buildSeparatedListContentSlot } from './wrap.ts';
import { configKeysOf, elementsSeatOf, flattenSeatsOf, prefixedKey } from './overlays/sub-factories.ts';
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
			if (!isMultiple(slot) && emptyDefaultOf(slot, nodeMap, kindEntries)) imports.add('orDefault');
			if (strictNodeExpectation(slot, nodeMap) !== undefined) imports.add('rejectBareText');
			if (seatedKeywordTexts(slot, nodeMap, kindEntries).length > 0) imports.add('rejectKeywordText');
			if (kindEntries !== undefined && slotAliases(slot, nodeMap).length > 0) imports.add('admitAliasContent');
		}
		for (const seat of seatRuntimes(node, nodeMap, kindEntries)) imports.add(seat.helper);
		if (kindEntries !== undefined && node instanceof AssembledList && slotAliases(buildSeparatedListContentSlot(node), nodeMap).length > 0)
			imports.add('admitAliasContent');
	}
	for (const [kind, node] of nodeMap.nodes) {
		if (numericSlotKeys(node).length > 0 || numericLeafShape(kind, node) !== undefined) imports.add('numberText');
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
		'  if (arr.length === 0) {',
		'    throw new Error(`${label}: requires at least one element`);',
		'  }',
		'}'
	];
}

function slotGuardKey(kind: string, slot: string): string {
	return `${kind}\0${slot}`;
}

function leafReDeclaration(kind: string, node: AssembledNode): { constName: string; literal: string } | undefined {
	if (node.surfaceHidden && isFixedTextLeaf(node)) return undefined;
	if (node.modelType !== 'pattern') return undefined;
	const literal = anchoredLeafRegexLiteral(kind, node.textPattern);
	if (literal === undefined) return undefined;
	return { constName: `_leafRe_${node.rawFactoryName!}`, literal };
}

function buildLeafReConsts(
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	lines: string[]
): Map<string, string> {
	const leafReConsts = new Map<string, string>();
	const word = nodeMap.word ? nodeMap.nodes.get(nodeMap.word) : undefined;
	const reserved = reservedWordset(nodeMap.reserved, 'global', kindEntries ?? []).words;
	if (word?.rawFactoryName && reserved.length > 0) {
		const listName = `_reservedWordList_${word.rawFactoryName}`;
		const constName = `_reservedWords_${word.rawFactoryName}`;
		const typeName = `_ReservedWord_${word.rawFactoryName}`;
		leafReConsts.set(reservedGuardKey(word.kind), constName);
		leafReConsts.set(reservedTypeKey(word.kind), typeName);
		lines.push(`const ${listName} = ${JSON.stringify(reserved)} as const;`);
		lines.push(`type ${typeName} = (typeof ${listName})[number];`);
		lines.push(`const ${constName}: ReadonlySet<string> = new Set(${listName});`);
	}
	for (const [kind, node] of nodeMap.nodes) {
		const declaration = leafReDeclaration(kind, node);
		if (declaration === undefined) continue;
		leafReConsts.set(kind, declaration.constName);
		lines.push(`const ${declaration.constName} = ${declaration.literal};`);
	}
	for (const [kind, node] of nodeMap.nodes) {
		for (const { slot, literal, constName } of interiorSlotGuards(kind, node)) {
			leafReConsts.set(slotGuardKey(kind, slot), constName);
			lines.push(`export const ${constName} = ${literal};`);
		}
	}
	return leafReConsts;
}

export function textLeaves(f: AssembledNonterminal, nodeMap: NodeMap): AssembledPattern[] {
	const leaves = new Set<AssembledPattern>();
	for (const value of f.values) {
		const storage = valueStorageOf(value, nodeMap);
		if (storage === undefined || storage.via !== 'node' || storage.missing) continue;
		const node = nodeMap.nodes.get(storage.kind);
		if (node instanceof AssembledPattern && node.rawFactoryName !== undefined) leaves.add(node);
	}
	return [...leaves];
}

function bareTextRejection(f: AssembledNonterminal, expr: string, nodeMap: NodeMap, typeName: string): string {
	const expected = strictNodeExpectation(f, nodeMap);
	if (expected === undefined) return expr;
	return `rejectBareText(${expr}, '${typeName}.${f.configKey}', ${JSON.stringify(expected)})`;
}

function keywordTextRejection(
	f: AssembledNonterminal,
	expr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	typeName: string
): string {
	const keywords = seatedKeywordTexts(f, nodeMap, kindEntries);
	if (keywords.length === 0) return expr;
	const word = kindDiscriminantExpr(nodeMap.word!, nodeMap, kindEntries!);
	return `rejectKeywordText(${expr}, '${typeName}.${f.configKey}', ${word}, ${JSON.stringify(keywords)})`;
}

export function seatedKeywordTexts(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string[] {
	if (kindEntries === undefined || !textLeaves(f, nodeMap).some((leaf) => leaf.kind === nodeMap.word)) return [];
	return keywordArmTextEntries(f, nodeMap, kindEntries).map((entry) => entry.text);
}

export function strictNodeExpectation(f: AssembledNonterminal, nodeMap: NodeMap): string | undefined {
	const leaves = textLeaves(f, nodeMap);
	if (leaves.length > 0) return leaves.map((leaf) => `${leaf.rawFactoryName}(…)`).join(' / ');
	const nodeTypes = new Set<string>();
	for (const value of f.values) {
		const storage = valueStorageOf(value, nodeMap);
		if (storage === undefined || storage.via === 'literal') return undefined;
		if (storage.via === 'node') nodeTypes.add(storage.typeName);
	}
	return nodeTypes.size === 0 ? undefined : `a built ${[...nodeTypes].join(' / ')}`;
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
	kindEntries?: readonly KindEnumEntry[]
): MapEntry[] {
	const mapEntries: MapEntry[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		const isHiddenGroup = node.surfaceHidden && !(node instanceof AssembledPunctuation);
		if (!node.userFacing && !isHiddenGroup) continue;
		if (!node.rawFactoryName) continue;
		if (isHiddenPresenceMarker(node)) continue;
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
			lines.push(`  ${JSON.stringify(kind)}: T.${typeName}.Bound;`);
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
				const shape = numericLeafShape(node.kind, node);
				if (shape !== undefined) guards.unshift(`text = numberText(${numberTextArgs(shape)}, text);`);
				const guard = guards.join(' ');
				const reservedType = leafReConsts.get(reservedTypeKey(node.kind));
				result =
					reservedType === undefined
						? emitTextFactory(node, leafTextParams(node), 'text', guard, kindEntries, nodeMap)
						: emitTextFactory(node, `text: W extends ${reservedType} ? never : W`, 'text', guard, kindEntries, nodeMap, '<const W extends string>');
				break;
			}
			case 'keyword':
			case 'punctuation':
				if (isBuilderTextLeaf(node)) {
					result = emitKindIdFactory(node, kindEntries, nodeMap);
				}
				break;
			default:
				break;
		}
		if (result) output.push(result);
	}

	export function branch(
		output: string[],
		node: FieldCarryingNode,
		nodeMap: NodeMap,
		kindEntries: readonly KindEnumEntry[] | undefined,
		leafReConsts: Map<string, string> = new Map()
	): void {
		output.push(emitFieldCarryingFactory(node, node.slots, nodeMap, kindEntries, leafReConsts));
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

function leafTextParams(node: AssembledNode): string {
	const shape = numericLeafShape(node.kind, node);
	return shape === undefined ? 'text: string' : `text: string | ${numberInputType(shape)}`;
}

function buildLeafGuards(node: { kind: string; textPattern?: string }, leafReConsts: Map<string, string>): string[] {
	const guards: string[] = [];
	const reConst = leafReConsts.get(node.kind);
	if (reConst) {
		guards.push(
			`if (!${reConst}.test(text)) throw new Error(\`${node.kind}: text does not match pattern: \${text}\`);`
		);
	}
	const reservedConst = leafReConsts.get(reservedGuardKey(node.kind));
	if (reservedConst) {
		guards.push(`if (${reservedConst}.has(text)) throw new Error(\`${node.kind}: '\${text}' is a reserved word\`);`);
	}
	if (!anchoredLeafRegex(node.kind, node.textPattern)?.test('')) {
		guards.unshift(`if (text.length === 0) throw new Error(\`${node.kind}: text must be non-empty\`);`);
	}
	return guards;
}

function reservedGuardKey(kind: string): string {
	return `${kind}\0\0reserved`;
}

function reservedTypeKey(kind: string): string {
	return `${kind}\0\0reservedType`;
}

type FieldCarryingNode = AuthoredCompound;

export function childElementType(
	node: { children: readonly AssembledNonterminal[] },
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): string {
	const parts = new Set<string>();
	for (const c of node.children) {
		const slotInfo = resolveFieldStorageInfo(c, nodeMap);
		for (const value of c.values) {
			if (isPatternValue(value)) {
				parts.add('string');
				continue;
			}
			const storage = valueStorageOf(value, nodeMap);
			if (storage === undefined) continue;
			if (storage.via !== 'node') {
				for (const text of textStoragesOf(storage)) {
					parts.add(valueKindIdExpr(text, slotInfo, kindEntries) ?? JSON.stringify(text.text));
				}
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
			if (ref.surfaceHidden && ref instanceof AssembledPunctuation) {
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
	return textMapExpr(kindEnumTextEntries(f, nodeMap, kindEntries));
}

export function kindEnumMemberDiscriminants(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string[] {
	return kindEnumTextEntries(f, nodeMap, kindEntries).map(({ discriminant }) => discriminant);
}

export function keywordArmTextMapExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	return textMapExpr(keywordArmTextEntries(f, nodeMap, kindEntries));
}

function keywordArmTextEntries(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): KindEnumTextEntry[] {
	return kindEnumTextEntries(f, nodeMap, kindEntries).filter((entry) => entry.keyword);
}

function textMapExpr(entries: readonly KindEnumTextEntry[]): string {
	return `[${entries.map(({ text, discriminant }) => `[${JSON.stringify(text)}, ${discriminant}] as const`).join(', ')}]`;
}


function slotStorageFromValueExpr(
	f: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	typeName: string
): string {
	return admittedSlotInput(f, storedSlotValueExpr(f, valueExpr, nodeMap, kindEntries, typeName), nodeMap, kindEntries, typeName);
}

function admittedSlotInput(
	f: AssembledNonterminal,
	expr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	typeName: string
): string {
	const admitted = keywordTextRejection(f, bareTextRejection(f, expr, nodeMap, typeName), nodeMap, kindEntries, typeName);
	return aliasContentAdmission(f, admitted, nodeMap, kindEntries, `NonNullable<T.${typeName}[${JSON.stringify(f.storageKey)}]>`);
}

function aliasContentTypes(slots: readonly AssembledNonterminal[], nodeMap: NodeMap): string[] {
	return [...new Set(slots.flatMap((slot) => slotAliases(slot, nodeMap).map((alias) => `T.${alias.typeName}.Types`)))];
}

function withAliasContentTypes(type: string, f: AssembledNonterminal, nodeMap: NodeMap): string {
	return [type, ...aliasContentTypes([f], nodeMap)].join(' | ');
}

export function slotAliases(f: AssembledNonterminal, nodeMap: NodeMap): AssembledAlias[] {
	const aliases: AssembledAlias[] = [];
	for (const kind of expandAndDedupeContentTypes(slotKindNames(f), nodeMap)) {
		const node = nodeMap.nodes.get(kind);
		if (node instanceof AssembledAlias && node.rawFactoryName !== undefined) aliases.push(node);
	}
	return aliases;
}

function kindIdsOf(kind: string, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): number[] {
	const node = nodeMap.nodes.get(kind);
	if (node instanceof AssembledEnum) return [...node.resolvedKindIds];
	const id = findOwnKindEntry(kindEntries, kind)?.id;
	return id === undefined ? [] : [id];
}

function slotStoredIds(f: AssembledNonterminal, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): number[] {
	const nodeIds = expandAndDedupeContentTypes(slotKindNames(f), nodeMap).flatMap((kind) => kindIdsOf(kind, nodeMap, kindEntries));
	const terminalIds = f.values.flatMap((value) =>
		isTerminalValue(value) && value.resolvedKindId !== undefined ? [value.resolvedKindId] : []
	);
	return [...new Set([...nodeIds, ...terminalIds])];
}

function aliasContentAdmission(
	f: AssembledNonterminal,
	expr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	storedType: string
): string {
	if (kindEntries === undefined) return expr;
	const aliases = slotAliases(f, nodeMap);
	if (aliases.length === 0) return expr;
	const direct = new Set(slotStoredIds(f, nodeMap, kindEntries));
	const table = aliases.flatMap((alias) => {
		const ids = alias.slots.flatMap((slot) => slotStoredIds(slot, nodeMap, kindEntries)).filter((id) => !direct.has(id));
		return ids.length === 0 ? [] : [`[${JSON.stringify(ids)}, (v: unknown) => ${alias.rawFactoryName}(v as never)]`];
	});
	if (table.length === 0) return expr;
	return `admitAliasContent<${storedType}>(${expr}, [${table.join(', ')}])`;
}

function storedSlotValueExpr(
	f: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	typeName: string
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	switch (storageInfo.kind) {
		case 'boolean':
			return `coerceBooleanKeywordStorage(${valueExpr})`;
		case 'bitflag':
			return `coerceBitflagStorage(${valueExpr}, ${bitflagTextsExpr(storageInfo.texts)})`;
		case 'kindEnum':
			return kindEntries
				? `coerceKindEnumStorage<NonNullable<T.${typeName}[${JSON.stringify(f.storageKey)}]>>(${valueExpr}, ${kindEnumTextMapExpr(f, nodeMap, kindEntries)})`
				: valueExpr;
		case 'mixedEnum':
			return kindEntries
				? `coerceMixedEnumStorage<NonNullable<T.${typeName}[${JSON.stringify(f.storageKey)}]>>(${valueExpr}, ${kindEnumTextMapExpr(f, nodeMap, kindEntries)})`
				: valueExpr;
		case 'verbatim':
			return valueExpr;
	}
}

function slotStorageExpr(
	f: AssembledNonterminal,
	configAccess: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	typeName: string
): string {
	return slotStorageFromValueExpr(f, defaultedValueExpr(f, `${configAccess}.${f.configKey}`, nodeMap, kindEntries), nodeMap, kindEntries, typeName);
}

function defaultedValueExpr(
	f: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (isMultiple(f)) return `(${valueExpr} ?? [])`;
	const emptyDefault = emptyDefaultOf(f, nodeMap, kindEntries);
	return emptyDefault ? `orDefault(${valueExpr}, () => ${emptyDefault})` : valueExpr;
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

export interface SlotSetter {
	readonly name: string;
	readonly input: string;
	readonly optional: boolean;
	readonly rest: boolean;
}

export interface BuiltTypeSurface {
	readonly mainType: string | undefined;
	readonly members: readonly string[];
	readonly setters: readonly SlotSetter[];
	readonly buildArgs: string;
	readonly looseArgs: string;
	readonly maxArgs: number | undefined;
}

export function slotSetter(
	f: AssembledNonterminal,
	configType: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): SlotSetter {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if (isMultiple(f) && storageInfo.kind === 'verbatim') {
		const elemType = constructionFieldElementType(f, nodeMap, kindEntries);
		const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
		return {
			name: f.propertyName,
			input: isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`,
			optional: !isRequired(f),
			rest: true
		};
	}
	const elemType = setterElemType(f, constructionFieldElementType(f, nodeMap, kindEntries), configType, nodeMap);
	return { name: f.propertyName, input: elemType, optional: !isRequired(f), rest: false };
}

function fieldCarryingBuiltTypeSurface(
	node: FieldCarryingNode,
	slots: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface {
	const surface = resolveFactorySurface(node, nodeMap, kindEntries);
	const { spreadFacts, singleField } = surface;
	const spreadTarget = listSpreadTarget(node, nodeMap, kindEntries);
	const spreadArgs = (member: 'BuildArgs' | 'LooseArgs'): string =>
		spreadTarget === null ? '' : ` | T.${nodeMap.nodes.get(spreadTarget)!.typeName}.${member}`;
	let setters: SlotSetter[];
	if (spreadFacts) {
		setters = [{ name: spreadFacts.slot.propertyName, input: `${surface.elementType!}[]`, optional: false, rest: true }];
	} else if (singleField) {
		const setterType = setterElemType(singleField, surface.directParamType!, surface.directParamType!, nodeMap, true);
		setters = [
			{ name: singleField.propertyName, input: setterType, optional: !isRequired(singleField), rest: false },
			...registeredSlots(node).map((f) => slotSetter(f, `T.${node.typeName}.Options`, nodeMap, kindEntries))
		];
	} else {
		const configType = surface.configType ?? `T.${node.typeName}.Config`;
		const registeredHere = new Set(registeredSlots(node));
		setters = [
			...slots.filter((f) => !registeredHere.has(f)).map((f) => slotSetter(f, configType, nodeMap, kindEntries)),
			...registeredSlots(node).map((f) => slotSetter(f, `T.${node.typeName}.Options`, nodeMap, kindEntries))
		];
	}
	return {
		mainType: `T.${node.typeName}`,
		members: [],
		setters,
		buildArgs: `${paramsToTuple(surface.rowParams)}${spreadArgs('BuildArgs')}`,
		looseArgs: `${paramsToTuple(surface.rowLooseParams)}${spreadArgs('LooseArgs')}`,
		maxArgs: spreadTarget === null ? surface.arity : undefined
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
		mainType: undefined,
		members: [
			`  readonly $type: ${kindDiscriminantType(node.kind, nodeMap, kindEntries)};`,
			'  readonly $source?: 0 | 1 | 2;',
			'  readonly $named: true;',
			`  readonly $text: ${textType};`
		],
		setters: [],
		buildArgs: paramsToTuple(params),
		looseArgs: paramsToTuple(params),
		maxArgs: 1
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
			return leafBuiltTypeSurface(node, leafTextParams(node), 'string', nodeMap, kindEntries);
		default:
			return undefined;
	}
}

export function constructionChildElementType(
	node: { children: readonly AssembledNonterminal[] },
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): string {
	const base = childElementType(node, nodeMap, kindEntries);
	const aliasTypes = aliasContentTypes(node.children, nodeMap);
	const type = aliasTypes.length === 0 ? base : `(${[base, ...aliasTypes].join(' | ')})`;
	return type;
}

export function constructionFieldElementType(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): string {
	const type = withAliasContentTypes(fieldElementType(f, nodeMap, kindEntries), f, nodeMap);
	const shape = numericSlotShape(f);
	return shape === undefined ? type : `${type} | ${numberInputType(shape)}`;
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
		for (const text of textStoragesOf(storage)) {
			parts.push(valueKindIdExpr(text, slotInfo, kindEntries) ?? JSON.stringify(text.text));
		}
	}
	return [...new Set(parts)].join(' | ');
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
	readonly admitsNodes?: true;
}

interface FactorySurface {
	readonly spreadFacts: ReturnType<typeof soleSlotFacts> | null;
	readonly singleField: AssembledNonterminal | undefined;
	readonly param: FactoryParam;
	readonly params: string;
	readonly looseParams: string;
	readonly rowParams: string;
	readonly rowLooseParams: string;
	readonly arity: number | undefined;
	readonly args: string;
	readonly elementType?: string;
	readonly directParamType?: string;
	readonly directParamOptional: boolean;
	readonly configType?: string;
	readonly opt: '' | '?';
	readonly spellingType?: string;
}

export function declarationParams(params: string): string {
	return params.replace(/(\w+)\??: (.+?) = [^,]+/, '$1?: $2');
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
	arity: number | undefined;
} {
	const strict = (type: string): string => (param.admitsNodes ? admitNodes(type) : type);
	return {
		arity: param.rest ? undefined : 1,
		params: paramText(param, strict(param.strictType)),
		looseParams: paramText(param, param.looseType),
		rowParams: paramText(param, strict(param.rowStrictType ?? param.strictType)),
		rowLooseParams: paramText(param, param.rowLooseType ?? param.looseType)
	};
}

function paramsToTuple(params: string): string {
	return `[${declarationParams(params)}]`;
}

function admitNodes(type: string): string {
	return `AdmitBound<${type}, T.AdmittedNodes>`;
}

function looseValueOf(elementType: string): string {
	return `LooseValue<${elementType}, T.LeafScalarMap, T.LeafStringMap, T.NamespaceMap>`;
}

function registeredSlotSource(
	node: FieldCarryingNode,
	slot: AssembledNonterminal,
	hasConfig: boolean,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (slot.registeredOption === 'choice') {
		return storedSlotValueExpr(slot, `options?.${slot.configKey}`, nodeMap, kindEntries, node.typeName);
	}
	const value = `options?.${slot.configKey} ?? ${JSON.stringify(slot.optionDefaultArm)}`;
	const peers = hasConfig ? optionalGroupPeers(node, slot.name) : undefined;
	const present = (peers ?? [])
		.map((name) => node.slots.find((candidate) => candidate.name === name))
		.filter((peer): peer is AssembledNonterminal => peer !== undefined && peer.registeredOption === undefined)
		.map((peer) => `config.${peer.configKey} !== undefined`);
	return present.length === 0 ? value : `(${present.join(' || ')}) ? (${value}) : undefined`;
}

export function omitRegistered(type: string, node: { readonly slots: readonly AssembledNonterminal[] }): string {
	const keys = registeredSlots(node).map((slot) => JSON.stringify(slot.configKey));
	return keys.length === 0 ? type : `OmitEach<${type}, ${keys.join(' | ')}>`;
}

export function spellingTypeOf(node: { readonly slots: readonly AssembledNonterminal[] }, nodeMap: NodeMap, kindEntries?: readonly KindEnumEntry[]): string | undefined {
	const registered = registeredSlots(node);
	if (registered.length === 0) return undefined;
	return `{ ${registered.map((slot) => `readonly ${slot.configKey}?: ${constructionFieldElementType(slot, nodeMap, kindEntries)}`).join('; ')} }`;
}

function resolveFactorySurface(
	node: FieldCarryingNode,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): FactorySurface {
	const surface = resolveConfigFactorySurface(node, nodeMap, kindEntries);
	const spellingType = spellingTypeOf(node, nodeMap, kindEntries);
	if (spellingType === undefined) return surface;
	const trailing = `options?: T.${node.typeName}.Options`;
	return {
		...surface,
		params: `${surface.params}, ${trailing}`,
		looseParams: `${surface.looseParams}, ${trailing}`,
		rowParams: `${surface.rowParams}, ${trailing}`,
		rowLooseParams: `${surface.rowLooseParams}, ${trailing}`,
		arity: surface.arity === undefined ? undefined : surface.arity + 1,
		args: `${surface.args}, options`,
		spellingType
	};
}

function resolveConfigFactorySurface(
	node: FieldCarryingNode,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): FactorySurface {
	const spreadFacts =
		isAuthoredCompound(node) && factoryTakesSpreadChildren(node, nodeMap) ? soleSlotFacts(node, nodeMap) : null;
	const singleField = !spreadFacts ? resolveDirectFactorySlot(node, nodeMap) : undefined;
	if (spreadFacts) {
		const elementType = constructionChildElementType({ children: [spreadFacts.slot] }, nodeMap, kindEntries);
		if (spreadFacts.multiple) {
			const param: FactoryParam = {
				label: 'children',
				optional: false,
				rest: true,
				strictType: `${elementType}[]`,
				looseType: `${looseValueOf(elementType)}[]`,
				admitsNodes: true
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
			looseType: looseValueOf(elementType),
			admitsNodes: true
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
		const baseType = constructionChildElementType({ children: [singleField] }, nodeMap, kindEntries);
		const singleShape = numericSlotShape(singleField);
		const elemType = singleShape === undefined ? baseType : `${baseType} | ${numberInputType(singleShape)}`;
		const optional = !isRequired(singleField) || holdsFixedText(singleField);
		const param: FactoryParam = {
			label: 'value',
			optional,
			rest: false,
			strictType: elemType,
			looseType: looseValueOf(elemType),
			admitsNodes: true
		};
		return {
			spreadFacts,
			singleField,
			param,
			...renderSurfaceParams(param),
			args: 'value',
			directParamType: elemType,
			directParamOptional: optional,
			opt: optional ? '?' : ''
		};
	}
	const slots = node.slots;
	const opt = node.argumentOptional(nodeMap) ? '?' : '';
	const configType = resolveConfigType(node, nodeMap.refineForms?.has(node.kind) ?? false);
	const hasConfigReads = slots.length > 0;
	const allOptional = opt === '?' && hasConfigReads;
	const widen = (type: string): string => widenNumericSlots(type, node);
	const param: FactoryParam = {
		label: 'config',
		optional: opt === '?',
		rest: false,
		strictType: allOptional ? `Partial<${widen(configType)}>` : widen(configType),
		looseType: `T.${node.typeName}.Loose`,
		rowStrictType: allOptional ? `Partial<${widen(omitRegistered(`ConfigOf<T.${node.typeName}, T.NamespaceMap>`, node))}>` : widen(omitRegistered(`ConfigOf<T.${node.typeName}, T.NamespaceMap>`, node)),
		rowLooseType: `${widen(omitRegistered(`LooseConfigOf<T.${node.typeName}, T.LeafScalarMap, T.LeafStringMap, [], T.NamespaceMap>`, node))} | AdmitBound<T.${node.typeName}, T.AdmittedNodes>`,
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

export function forwardedConstructorTarget(
	node: FieldCarryingNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | null {
	if (resolveFactorySurface(node, nodeMap, kindEntries).directParamType === undefined) return null;
	const target = forwardedTargetKind(node, nodeMap);
	if (target === null) return null;
	if (kindEntries !== undefined && !hasCatalogEntry(kindEntries, target)) return null;
	const targetNode = nodeMap.nodes.get(target);
	const seatedGroup =
		targetNode instanceof AbstractAssembledCompound &&
		targetNode.annotations?.hoisted === true &&
		classifyFactoryShape(targetNode, nodeMap) === 'config';
	return seatedGroup ? null : target;
}

export function listSpreadTarget(
	node: FieldCarryingNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | null {
	if (registeredSlots(node).length > 0) return null;
	const target = forwardedConstructorTarget(node, nodeMap, kindEntries);
	if (target === null) return null;
	return nodeMap.nodes.get(constructorTargetKind(target, nodeMap, kindEntries))?.modelType === 'list' ? target : null;
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
):
	| {
			params: string;
			paramsOverloads?: readonly string[];
			looseParams?: string;
			args: string;
			argOptional?: boolean;
	  }
	| undefined {
	const target = nodeMap.nodes.get(constructorTargetKind(kind, nodeMap, kindEntries));
	if (target === undefined) return undefined;
	switch (target.modelType) {
		case 'list': {
			const list = separatedListSurface(target, nodeMap, kindEntries);
			return list.optionsType === undefined
				? { params: `...elements: ${list.elementsType}`, args: '...elements' }
				: {
						params: `...elements: ${list.elementsType}`,
						paramsOverloads: [
							`options: ${list.optionsType}, ...elements: ${list.elementsType}`,
							`...elements: ${list.elementsType}`
						],
						args: '...args'
					};
		}
		case 'envelope':
		case 'branch':
		case 'polymorph':
		case 'alias': {
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
		case 'keyword':
		case 'punctuation':
			if (!isBuilderTextLeaf(target)) return undefined;
			return { params: '', args: '' };
		case 'pattern':
			return { params: leafTextParams(target), args: 'text' };
		case 'enum':
			return { params: `value: ${enumMemberDiscriminant(target, kindEntries)}`, args: 'value' };
		default:
			return undefined;
	}
}

function emitFieldCarryingFactory(
	node: FieldCarryingNode,
	slots: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined = undefined,
	leafReConsts: ReadonlyMap<string, string> = new Map()
): string {
	const exportName = node.rawFactoryName!;
	const fn = exportName;
	const exportKw = 'export ';
	slots = slots ?? [];
	const typeKind = node.kind;
	const surface = resolveFactorySurface(node, nodeMap, kindEntries);
	const { spreadFacts, singleField } = surface;

	const builtName = `T.${node.typeName}.Bound`;
	const configType = surface.configType ?? `T.${node.typeName}.Config`;
	const signature = `${exportKw}function ${fn}(${surface.params}): ${builtName} {`;
	let valueSourceFor: (f: AssembledNonterminal) => string;
	let withLines: string[];
	let slotsToEmit: readonly AssembledNonterminal[] = slots;
	const registered = registeredSlots(node);
	const registeredSet = new Set(registered);
	const spellingWith = (rebuild: (patch: string) => string): string[] =>
		registered.map((f) => `      ${f.propertyName}: (spelling: ${constructionFieldElementType(f, nodeMap, kindEntries)}) => ${rebuild(`{ ...options, ${f.configKey}: spelling }`)},`);

	if (spreadFacts) {
		slotsToEmit = [spreadFacts.slot];
		const elementType = surface.elementType!;
		const setter = spreadFacts.slot.propertyName;
		valueSourceFor = (f) => (f === spreadFacts.slot ? admittedSlotInput(f, 'children', nodeMap, kindEntries, node.typeName) : '');
		withLines = [`    $with: { ${setter}: (...vs: ${elementType}[]) => ${fn}(...vs) },`];
	} else if (singleField) {
		const elemType = surface.directParamType!;
		valueSourceFor = (f) =>
			slotStorageFromValueExpr(f, holdsFixedText(f) ? defaultedValueExpr(f, 'value', nodeMap, kindEntries) : 'value', nodeMap, kindEntries, node.typeName);
		const setterType = setterElemType(singleField, elemType, elemType, nodeMap, true);
		const setterSig = setterValueSignature(singleField, setterType);
		const rebuildDirect = (options: string): string => `${fn}(value, ${options})`;
		withLines = [
			'    $with: {',
			`      ${singleField.propertyName}: (${setterSig}) => ${registered.length === 0 ? `${fn}(value)` : `${fn}(value, options)`},`,
			...spellingWith(rebuildDirect),
			'    },'
		];
	} else {
		const configAccess = 'config';
		valueSourceFor = (f) => slotStorageExpr(f, configAccess, nodeMap, kindEntries, node.typeName);
		withLines = ['    $with: {'];
		const optionsArg = registered.length === 0 ? '' : ', options';
		for (const f of slots) {
			if (registeredSet.has(f)) continue;
			const method = f.propertyName;
			const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
			if (isMultiple(f) && storageInfo.kind === 'verbatim') {
				const elemType = constructionFieldElementType(f, nodeMap, kindEntries);
				const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
				const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
				withLines.push(
					`      ${method}: (...values: ${restType}) => ${fn}({ ...${configAccess}, ${f.configKey}: values }${optionsArg}),`
				);
			} else {
				const elemType = setterElemType(f, constructionFieldElementType(f, nodeMap, kindEntries), configType, nodeMap);
				const setterSig = setterValueSignature(f, elemType);
				withLines.push(`      ${method}: (${setterSig}) => ${fn}({ ...${configAccess}, ${f.configKey}: value }${optionsArg}),`);
			}
		}
		withLines.push(...spellingWith((patch) => `${fn}(${configAccess}, ${patch})`), '    },');
	}

	const lines: string[] = [signature];
	if (spreadFacts?.multiple && spreadFacts.nonEmpty) {
		lines.push(`  _assertNonEmpty(children, '${node.kind}.children');`);
	}
	for (const f of slotsToEmit) {
		const shape = numericSlotShape(f);
		const source =
			registeredSet.has(f)
				? registeredSlotSource(node, f, singleField === undefined && spreadFacts === null, nodeMap, kindEntries)
				: shape === undefined
					? valueSourceFor(f)
					: `numberText(${numberTextArgs(shape)}, ${valueSourceFor(f)})`;
		lines.push(`  const ${f.storageKey} = ${source};`);
		const guard = leafReConsts.get(slotGuardKey(node.kind, f.name));
		if (guard !== undefined) {
			lines.push(
				`  if (${f.storageKey} !== undefined && !${guard}.test(${f.storageKey})) throw new Error(\`${node.kind}.${f.name}: text does not match pattern: \${${f.storageKey}}\`);`
			);
		}
	}
	const seats = seatRuntimes(node, nodeMap, kindEntries);
	lines.push(`  return withMethods(${seatOpening(seats)}withAccessors({`);
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
	lines.push(`  })${seatClosing(seats)}) as unknown as ${builtName};`);
	lines.push('}');

	const { directParamType, directParamOptional } = surface;
	const forwardTarget = forwardedConstructorTarget(node, nodeMap, kindEntries);
	if (forwardTarget !== null) {
		const targetFn = nodeMap.nodes.get(forwardTarget)!.rawFactoryName!;
		lines[0] = lines[0]!.replace(`${exportKw}function ${fn}(`, `function _${fn}(`);
		const targetSurface = constructorSurface(forwardTarget, nodeMap, kindEntries);
		const targetSurfaceParams = targetSurface?.params;
		const rawTargetParams = targetSurfaceParams ?? `...args: Parameters<typeof ${targetFn}>`;
		const targetNode = nodeMap.nodes.get(forwardTarget);
		const targetIsConstant = targetNode !== undefined && isBuilderTextLeaf(targetNode);
		const targetBuilt = (args: string): string =>
			targetIsConstant ? targetFn : `(${targetFn} as (...a: unknown[]) => unknown)(${args})`;
		const targetEmpty = targetIsConstant ? targetFn : `${targetFn}()`;
		const targetTakesNoArgs =
			targetSurfaceParams !== undefined && targetNode !== undefined && targetNode.argumentOptional(nodeMap);
		const targetOverloads = targetSurface?.paramsOverloads ?? [rawTargetParams];
		const overloadParams = [surface.params, ...targetOverloads].map(declarationParams);
		const wrapper = withEmptyOverload(nodeMap, node.kind, `${exportKw}function ${fn}`, [
			...[...overloadParams.filter((params) => params === ''), ...overloadParams.filter((params) => params !== '')].map(
				(params) => `${exportKw}function ${fn}(${params}): ReturnType<typeof _${fn}>;`
			),
			`${exportKw}function ${fn}(...args: unknown[]) {`
		]);
		if (registered.length > 0) {
			if (!directParamOptional && targetTakesNoArgs) {
				wrapper.push(
					`  if (args.length === 0 || args[0] === undefined) {`,
					`    return _${fn}(${targetEmpty} as ${directParamType}, args[0] as never);`,
					`  }`
				);
			}
			wrapper.push(
				`  if (args.length === 1 && typeof args[0] !== 'object') {`,
				`    return _${fn}(args[0] as ${directParamType});`,
				`  }`,
				`  if (args[0] === undefined) {`,
				`    return _${fn}(args[0] as unknown as ${directParamType}, args[1] as never);`,
				`  }`,
				`  const prebuilt =`,
				`    typeof args[0] === 'object' && args[0] !== null &&`,
				`    (args[0] as { $type?: unknown }).$type === (${factoryTypeDiscriminant(forwardTarget, nodeMap, kindEntries)});`,
				`  return prebuilt`,
				`    ? _${fn}(args[0] as ${directParamType}, args[1] as never)`,
				`    : _${fn}(${targetBuilt('args[0]')} as ${directParamType}, args[1] as never);`,
				'}'
			);
		} else {
			if (!directParamOptional && targetTakesNoArgs) {
				wrapper.push(`  if (args.length === 0) {`, `    return _${fn}(${targetEmpty} as ${directParamType});`, `  }`);
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
				`    : _${fn}(${targetBuilt('...args')} as ${directParamType});`,
				'}'
			);
		}
		lines.unshift(...wrapper);
		return renameUnusedConfigParam(lines);
	}
	return renameUnusedConfigParam(
		withEmptyOverload(nodeMap, node.kind, `${exportKw}function ${fn}`, lines, `${exportKw}function ${fn}(${declarationParams(surface.params)}): ${builtName};`)
	);
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
	const allSlots = node.slots;
	const slots = node.configSlots;
	const registered = registeredSlots(node);
	const opt = resolveRefineFormConfigOptional(slots, nodeMap, narrowed);
	const formTypeName = refineFormTypeName(info.typeName, form.name);
	const formShortName = formTypeName.slice(info.typeName.length);
	const lines: string[] = [];
	const formConfigType = `T.${info.typeName}.${formShortName}.Config`;
	const formBuiltName = `T.${info.typeName}.${formShortName}.Bound`;
	const optionsParam = registered.length === 0 ? '' : `, options?: T.${info.typeName}.${formShortName}.Options`;
	const optionsArg = registered.length === 0 ? '' : ', options';
	lines.push(`export function ${formFn}(config${opt}: ${formConfigType}${optionsParam}): ${formBuiltName} {`);
	for (const f of allSlots) {
		const narrowedLit = narrowed.get(f.name);
		if (narrowedLit !== undefined) {
			lines.push(
				`  const ${f.storageKey} = ${slotStorageFromValueExpr(f, `${JSON.stringify(narrowedLit)} as const`, nodeMap, kindEntries, info.typeName)};`
			);
			continue;
		}
		if (registered.includes(f)) {
			lines.push(`  const ${f.storageKey} = ${registeredSlotSource(node, f, true, nodeMap, kindEntries)};`);
			continue;
		}
		lines.push(`  const ${f.storageKey} = ${slotStorageExpr(f, `config${opt}`, nodeMap, kindEntries, info.typeName)};`);
	}
	lines.push('  return withMethods(withAccessors({');
	lines.push(`    $type: ${factoryTypeDiscriminant(node.kind, nodeMap, kindEntries)},`);
	lines.push(`    $source: 2 as const,`);
	lines.push('    $named: true as const,');
	for (const f of allSlots) {
		lines.push(`    ${f.storageKey},`);
	}
	lines.push('    $with: {');
	for (const f of slots) {
		if (narrowed.has(f.name)) continue;
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (isMultiple(f) && storageInfo.kind === 'verbatim') {
			const elemType = constructionFieldElementType(f, nodeMap);
			const elemForArray = elemType.includes(' | ') ? `(${elemType})` : elemType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `${elemForArray}[]`;
			lines.push(`      ${method}: (...values: ${restType}) => ${formFn}({ ...config, ${f.configKey}: values }${optionsArg}),`);
		} else {
			const elemType = setterElemType(
				f,
				constructionFieldElementType(f, nodeMap, kindEntries),
				formConfigType,
				nodeMap
			);
			const setterSig = setterValueSignature(f, elemType);
			lines.push(`      ${method}: (${setterSig}) => ${formFn}({ ...config, ${f.configKey}: value }${optionsArg}),`);
		}
	}
	for (const f of registered) {
		if (narrowed.has(f.name)) continue;
		lines.push(
			`      ${f.propertyName}: (spelling: ${constructionFieldElementType(f, nodeMap, kindEntries)}) => ${formFn}(config, { ...options, ${f.configKey}: spelling }),`
		);
	}
	lines.push('    },');
	lines.push('  }, {');
	for (const f of allSlots) {
		const propName = f.propertyName;
		lines.push(`    ${propName}: () => ${f.storageKey},`);
	}
	lines.push(`  })) as unknown as ${formBuiltName};`);
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
	const formOptionsType = `T.${info.typeName}.${formShortName}.Options`;
	const opt = resolveRefineFormConfigOptional(
		node.configSlots,
		nodeMap,
		new Map(form.narrowedFields.map((n) => [n.fieldName, n.literal]))
	);
	const registered = registeredSlots(node);
	const setters = [
		...node.configSlots.filter((f) => !narrowed.has(f.name)).map((f) => slotSetter(f, formConfigType, nodeMap, kindEntries)),
		...registered.filter((f) => !narrowed.has(f.name)).map((f) => slotSetter(f, formOptionsType, nodeMap, kindEntries))
	];
	const optionsParam = registered.length === 0 ? '' : `, options?: ${formOptionsType}`;
	const params = `config${opt}: ${formConfigType}${optionsParam}`;
	return {
		mainType: `T.${info.typeName}`,
		members: [],
		setters,
		buildArgs: paramsToTuple(params),
		looseArgs: paramsToTuple(params),
		maxArgs: registered.length === 0 ? 1 : 2
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

function resolveConfigType(node: FieldCarryingNode, hasRefineForms: boolean): string {
	if (hasRefineForms) return `ConfigOf<T.${node.typeName}, T.NamespaceMap>`;
	return `T.${node.typeName}.Config`;
}

function elementsTypeOf(nonEmpty: boolean, elemType: string): string {
	return nonEmpty ? `NonEmptyArray<${elemType}>` : `${parenthesizeUnion(elemType)}[]`;
}

function elementsTuple(nonEmpty: boolean, elemType: string): string {
	const rest = `...elements: ${parenthesizeUnion(elemType)}[]`;
	return nonEmpty ? `[element: ${elemType}, ${rest}]` : `[${rest}]`;
}

function hasTopLevelUnion(type: string): boolean {
	let depth = 0;
	for (let i = 0; i < type.length; i++) {
		const ch = type[i]!;
		if (ch === '<' || ch === '(' || ch === '{' || ch === '[') depth++;
		else if (ch === '>' || ch === ')' || ch === '}' || ch === ']') depth--;
		else if (depth === 0 && type.startsWith(' | ', i)) return true;
	}
	return false;
}

function parenthesizeUnion(elemType: string): string {
	return hasTopLevelUnion(elemType) ? `(${elemType})` : elemType;
}

export function listOptionKeys(surface: {
	readonly hasSeparatorKindOption: boolean;
	readonly hasDelimiterOption: boolean;
}): readonly string[] {
	return [
		...(surface.hasSeparatorKindOption ? ['separator'] : []),
		...(surface.hasDelimiterOption ? ['delimiter'] : [])
	];
}

export function listOptionDefaults(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): readonly { readonly key: string; readonly default: string }[] {
	const parts = listOptionParts(node, nodeMap, kindEntries);
	return [
		...(parts.hasSeparatorKindOption
			? [{ key: 'separator', default: declaredSeparatorDefault(node, nodeMap, kindEntries) ?? 'undefined' }]
			: []),
		...(parts.hasDelimiterOption ? [{ key: 'delimiter', default: declaredDelimiterDefault(node) }] : [])
	];
}

export function listHasOptions(node: AssembledList): boolean {
	return (
		node.separatorRule !== undefined || node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional'
	);
}

function listOptionParts(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
) {
	const hasSeparatorKindOption = node.separatorRule !== undefined;
	const candidateKindNames = hasSeparatorKindOption
		? node.separatorCandidateKindNames.filter((k) => hasCatalogEntry(kindEntries, k))
		: [];
	const hasDelimiterOption = node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional';
	const separatorKindUnion =
		candidateKindNames.length > 0
			? candidateKindNames.map((k) => kindDiscriminantExpr(k, nodeMap, kindEntries)).join(' | ')
			: 'never';
	const optionsTypeParts: string[] = [];
	const required = separatorRequired(node);
	if (hasSeparatorKindOption) optionsTypeParts.push(`separator${required ? '' : '?'}: ${separatorKindUnion}`);
	if (hasDelimiterOption) optionsTypeParts.push(`delimiter?: ${delimiterUnionFor(node)}`);
	const optionsType = optionsTypeParts.length > 0 ? `{ ${optionsTypeParts.join('; ')} }` : undefined;
	return {
		separatorKindUnion,
		candidateKindNames,
		hasSeparatorKindOption,
		separatorRequired: required,
		hasDelimiterOption,
		optionsType
	};
}

export function listOptionsType(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	return listOptionParts(node, nodeMap, kindEntries).optionsType;
}

function listViewTarget(
	node: AssembledNode,
	nodeMap: NodeMap
): { readonly owner?: AssembledNonterminal; readonly list: AssembledList } | undefined {
	if (node instanceof AssembledList) return { list: node };
	const target = forwardedTargetKind(node, nodeMap);
	const list = target === null ? undefined : nodeMap.nodes.get(target);
	const owner = 'soleSlot' in node ? (node as { soleSlot?: AssembledNonterminal }).soleSlot : undefined;
	return list instanceof AssembledList && owner !== undefined ? { owner, list } : undefined;
}

export interface GroupSeatKey {
	readonly name: string;
	readonly field: string;
	readonly rest: boolean;
	readonly required: boolean;
}

export interface GroupSeatHint {
	readonly slot: string;
	readonly stored: string;
	readonly group: string;
	readonly groupKind: string;
	readonly factory: string;
	readonly optional: boolean;
	readonly keys: readonly GroupSeatKey[];
}

export function groupSeatHints(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): readonly GroupSeatHint[] {
	if (!isSlotBearingCompound(node)) return [];
	return flattenSeatsOf(node, nodeMap).flatMap((seat) => {
		if (!isSlotBearingCompound(seat.group)) return [];
		const restKeys = new Set(
			(builtTypeSurfaceOf(seat.group, nodeMap, kindEntries)?.setters ?? []).filter((setter) => setter.rest).map((setter) => setter.name)
		);
		const slotByKey = new Map(seat.group.slots.map((slot) => [slot.configKey, slot]));
		const keys = seat.keys.map(({ key, field }) => {
			const slot = slotByKey.get(field)!;
			return {
				name: key === field ? slot.propertyName : prefixedKey(seat.slot.propertyName, slot.propertyName),
				field: slot.propertyName,
				rest: restKeys.has(slot.propertyName),
				required: isRequired(slot)
			};
		});
		return [
			{
				slot: seat.slot.propertyName,
				stored: `_${seat.slot.storageName}`,
				group: seat.group.typeName,
				groupKind: seat.group.kind,
				factory: seat.group.rawFactoryName!,
				optional: !isRequired(seat.slot),
				keys
			}
		];
	});
}

function groupSeatRuntimeSpecs(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	factoryScope = ''
): readonly string[] {
	return groupSeatHints(node, nodeMap, kindEntries).map((hint) => {
		const keys = hint.keys.map(({ name, field, rest, required }) => ({
			name,
			...(name === field ? {} : { field }),
			rest,
			...(required ? { required } : {})
		}));
		return `{ slot: ${JSON.stringify(hint.slot)}, stored: ${JSON.stringify(hint.stored)}, kind: ${factoryTypeDiscriminant(hint.groupKind, nodeMap, kindEntries)}, make: ${factoryScope}${hint.factory}, keys: ${JSON.stringify(keys)} }`;
	});
}

export interface ElementConfigFact {
	readonly slot: string;
	readonly group: string;
	readonly factory: string;
	readonly keys: readonly string[];
	readonly config: string;
}

export function elementConfigsOf(node: AssembledNode, nodeMap: NodeMap): readonly ElementConfigFact[] {
	return elementsSeatOf(node, nodeMap).map((seat) => ({
		slot: seat.slot.propertyName,
		group: seat.group.typeName,
		factory: seat.group.rawFactoryName!,
		keys: configKeysOf(seat.group),
		config: `T.${seat.group.typeName}.Config`
	}));
}

function listElementConfigOf(kind: AssembledNode, nodeMap: NodeMap): ElementConfigFact | undefined {
	const list = listViewTarget(kind, nodeMap)?.list;
	if (list === undefined) return undefined;
	const elements = canonicalSeparatedListField(list).propertyName;
	return elementConfigsOf(list, nodeMap).find((fact) => fact.slot === elements);
}

function elementConfigFields(fact: ElementConfigFact, factoryScope: string): string {
	return `keys: ${JSON.stringify(fact.keys)}, make: ${factoryScope}${fact.factory}`;
}

function elementSpecOf(kind: AssembledNode, nodeMap: NodeMap, factoryScope: string): string {
	const element = listElementConfigOf(kind, nodeMap);
	return element === undefined ? '' : `, element: { ${elementConfigFields(element, factoryScope)} }`;
}

export interface ListViewFacts {
	readonly element: string;
	readonly options: string;
	readonly factory: string;
	readonly accessors: readonly string[];
}

export function listViewHint(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): ListViewFacts | undefined {
	const target = listViewTarget(node, nodeMap);
	if (target === undefined) return undefined;
	const surface = separatedListSurface(target.list, nodeMap, kindEntries);
	const options = listOptionDefaults(target.list, nodeMap, kindEntries).map((option) => option.key);
	const accessors = [
		...(isSlotBearingCompound(node) ? node.slots.map((slot) => slot.propertyName) : []),
		...options
	];
	const clash = accessors.find((name) => LIST_VIEW_MEMBERS.includes(name));
	if (clash !== undefined) {
		throw new Error(
			`listViewHint: '${node.kind}' reads as a list, and its '${clash}' collides with the ReadonlyArray member of that name; rename the slot in the grammar`
		);
	}
	return {
		element: surface.elemType,
		options: surface.optionsType ?? '{}',
		factory: target.list.rawFactoryName!,
		accessors
	};
}

export function listViewOwners(nodeMap: NodeMap): readonly AssembledNode[] {
	return [...nodeMap.nodes.values()].filter((node) => listViewTarget(node, nodeMap)?.owner !== undefined);
}

export function listViewRuntimeSpec(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	const target = listViewTarget(node, nodeMap);
	if (target === undefined) return undefined;
	const options = listOptionDefaults(target.list, nodeMap, kindEntries)
		.map((option) => `{ key: ${JSON.stringify(option.key)}, default: ${option.default} }`)
		.join(', ');
	const wrapper = separatedListSurface(target.list, nodeMap, kindEntries).wrapper;
	const wrapperSpec =
		wrapper === undefined
			? ''
			: `, wrapper: { kind: TSKindId.${wrapper.member}, content: ${JSON.stringify(wrapper.contentProperty)}, decorations: ${JSON.stringify(wrapper.decorationKeys)} }`;
	const elements = canonicalSeparatedListField(target.list);
	const list =
		target.owner === undefined
			? ''
			: `list: { accessor: ${JSON.stringify(target.owner.propertyName)}, storage: ${JSON.stringify(target.owner.storageKey)} }, `;
	const optionsSpec = options === '' ? '' : `, options: [${options}]`;
	return `{ ${list}elements: ${JSON.stringify(elements.propertyName)}, count: ${JSON.stringify(elements.storageKey)}${optionsSpec}${wrapperSpec} }`;
}

function listSlotTargets(
	node: AssembledNode,
	nodeMap: NodeMap
): readonly { readonly slot: AssembledNonterminal; readonly kind: AssembledNode }[] {
	if (!isSlotBearingCompound(node)) return [];
	return node.slots.flatMap((slot) => {
		if (isMultiple(slot)) return [];
		const kinds = slotKindNames(slot);
		const kind = kinds.length === 1 ? nodeMap.nodes.get(kinds[0]!) : undefined;
		return kind !== undefined && kind.rawFactoryName !== undefined && listViewTarget(kind, nodeMap) !== undefined
			? [{ slot, kind }]
			: [];
	});
}

export function listSlotHints(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): readonly (ListViewFacts & { readonly slot: string; readonly kind: string; readonly config: string })[] {
	return listSlotTargets(node, nodeMap).map(({ slot, kind }) => ({
		...listViewHint(kind, nodeMap, kindEntries)!,
		slot: slot.propertyName,
		kind: kind.typeName,
		config: listElementConfigOf(kind, nodeMap)?.config ?? 'never'
	}));
}

function listSlotsRuntimeSpec(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	factoryScope: string
): string | undefined {
	const targets = listSlotTargets(node, nodeMap);
	if (targets.length === 0) return undefined;
	const specs = targets.map(
		({ slot, kind }) =>
			`{ slot: ${JSON.stringify(slot.propertyName)}, kind: ${factoryTypeDiscriminant(kind.kind, nodeMap, kindEntries)}, optional: ${!isRequired(slot)}, make: ${factoryScope}${kind.rawFactoryName}${elementSpecOf(kind, nodeMap, factoryScope)} }`
	);
	return `[${specs.join(', ')}]`;
}

export interface SeatRuntime {
	readonly helper: 'withListView' | 'withListSlots' | 'withGroupSeat' | 'withElementsSeat';
	readonly spec: string;
}

export function seatRuntimes(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	factoryScope = '',
	tree?: string
): readonly SeatRuntime[] {
	const view = listViewRuntimeSpec(node, nodeMap, kindEntries);
	const slots = listSlotsRuntimeSpec(node, nodeMap, kindEntries, factoryScope);
	const groups = groupSeatRuntimeSpecs(node, nodeMap, kindEntries, factoryScope);
	return [
		...(view === undefined ? [] : [{ helper: 'withListView' as const, spec: tree === undefined ? view : `${view}, ${tree}` }]),
		...(slots === undefined ? [] : [{ helper: 'withListSlots' as const, spec: slots }]),
		...groups.map((spec) => ({ helper: 'withGroupSeat' as const, spec })),
		...elementConfigsOf(node, nodeMap).map((fact) => ({
			helper: 'withElementsSeat' as const,
			spec: `{ slot: ${JSON.stringify(fact.slot)}, ${elementConfigFields(fact, factoryScope)} }`
		}))
	];
}

export function seatOpening(seats: readonly SeatRuntime[]): string {
	return seats.map((seat) => `${seat.helper}(`).join('');
}

export function seatClosing(seats: readonly SeatRuntime[]): string {
	return [...seats].reverse().map((seat) => `, ${seat.spec})`).join('');
}

export function separatedListSurface(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): {
	readonly elemType: string;
	readonly storageElemType: string;
	readonly elemTypeForArray: string;
	readonly strictElemType: string;
	readonly looseElemTypeForArray: string;
	readonly elementsType: string;
	readonly rawElementsType: string;
	readonly separatorKindUnion: string;
	readonly candidateKindNames: readonly string[];
	readonly hasSeparatorKindOption: boolean;
	readonly separatorRequired: boolean;
	readonly hasDelimiterOption: boolean;
	readonly optionsType: string | undefined;
	readonly wrapper?: {
		readonly member: string;
		readonly factory: string;
		readonly contentKey: string;
		readonly contentProperty: string;
		readonly decorationKeys: readonly string[];
		readonly typeName: string;
	};
	readonly storageElementsType: string;
} {
	const contentSlot = buildSeparatedListContentSlot(node);
	const baseElemType = fieldElementType(contentSlot, nodeMap, kindEntries);
	let elemType = withAliasContentTypes(baseElemType, contentSlot, nodeMap);
	let wrapper: ReturnType<typeof separatedListSurface>['wrapper'];
	const contentKinds = slotKindNames(contentSlot);
	if (contentKinds.length === 1 && kindEntries) {
		const wKind = contentKinds[0]!;
		const entry = findKindEntry(kindEntries, wKind);
		const content = transparentWrapperContentSlot(wKind, nodeMap);
		const factoryName = nodeMap.nodes.get(wKind)?.rawFactoryName;
		const wrapperNode = nodeMap.nodes.get(wKind);
		const wrapperSlots = wrapperNode !== undefined && isSlotBearingCompound(wrapperNode) ? wrapperNode.slots : [];
		if (entry !== undefined && content !== undefined && factoryName !== undefined) {
			wrapper = {
				member: entry.member,
				factory: factoryName,
				contentKey: content.configKey,
				contentProperty: content.propertyName,
				decorationKeys: wrapperSlots.filter((slot) => slot !== content).map((slot) => slot.storageKey),
				typeName: nodeMap.nodes.get(wKind)!.typeName
			};
			elemType = `${elemType} | ${withAliasContentTypes(fieldElementType(content, nodeMap, kindEntries), content, nodeMap)}`;
		}
	}
	const strictElemType = admitNodes(elemType);
	const elemTypeForArray = strictElemType;
	const elementsType = elementsTypeOf(node.nonEmpty, strictElemType);
	return {
		elemType,
		storageElemType: baseElemType,
		elemTypeForArray,
		strictElemType,
		looseElemTypeForArray: parenthesizeUnion(elemType),
		elementsType,
		rawElementsType: elementsTypeOf(node.nonEmpty, elemType),
		...listOptionParts(node, nodeMap, kindEntries),
		wrapper,
		storageElementsType: node.nonEmpty ? `NonEmptyArray<${baseElemType}>` : `${parenthesizeUnion(baseElemType)}[]`
	};
}

function listBuiltTypeSurface(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): BuiltTypeSurface {
	const canonical = node.slots.length > 1 ? undefined : canonicalSeparatedListField(node);
	const contentAccessorName = canonical?.propertyName ?? 'content';
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	const setters: SlotSetter[] = [
		{ name: contentAccessorName, input: surface.rawElementsType, optional: false, rest: true },
		...(surface.hasSeparatorKindOption
			? [{ name: 'separator', input: surface.separatorKindUnion, optional: false, rest: false }]
			: []),
		...(surface.hasDelimiterOption ? [{ name: 'delimiter', input: delimiterUnionFor(node), optional: true, rest: false }] : [])
	];
	const extraMembers = [
		...(surface.hasSeparatorKindOption ? ['  readonly _separator: number | undefined;'] : []),
		...(surface.hasDelimiterOption ? ['  readonly _delimiter: Delimiter;'] : [])
	];
	return {
		mainType: `T.${node.typeName}`,
		members: extraMembers,
		setters,
		buildArgs: elementsTuple(node.nonEmpty, surface.strictElemType),
		looseArgs: elementsTuple(node.nonEmpty, looseValueOf(surface.looseElemTypeForArray)),
		maxArgs: undefined
	};
}

export function declaredSeparatorDefault(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	const declared = node.resolvedSeparatorArm;
	return declared === undefined ? undefined : kindDiscriminantExpr(declared, nodeMap, kindEntries);
}

export function declaredDelimiterDefault(node: AssembledList): string {
	return node.resolvedDelimiterArm ?? 'Delimiter.None';
}

function emitSeparatedListFactory(
	node: AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const fn = node.rawFactoryName;
	const delimiterDefault = declaredDelimiterDefault(node);

	const isMultiField = node.slots.length > 1;
	const canonical = isMultiField ? undefined : canonicalSeparatedListField(node);
	const contentStorageKey = canonical?.storageKey ?? '_content';
	const contentAccessorName = canonical?.propertyName ?? 'content';
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	const { elemTypeForArray, elementsType, separatorKindUnion, hasSeparatorKindOption, hasDelimiterOption } = surface;
	const delimiterUnion = delimiterUnionFor(node);
	const hasOptions = surface.optionsType !== undefined;
	const optionsType = surface.optionsType ?? '{  }';

	const lines: string[] = [];
	const listBuiltName = `T.${node.typeName}.Bound`;
	if (hasOptions) {
		if (!surface.separatorRequired) lines.push(`export function ${fn}(...elements: ${elementsType}): ReturnType<typeof _${fn}>;`);
		lines.push(
			`export function ${fn}(options: ${optionsType}, ...elements: ${elementsType}): ReturnType<typeof _${fn}>;`
		);
		lines.push(`export function ${fn}(...args: (${optionsType} | ${elemTypeForArray})[]) {`);
		const permittedKeys = listOptionKeys(surface);
		lines.push(
			`  const _optsFirst = typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0]) && !('$type' in (args[0] as object)) && ` +
				`Object.keys(args[0] as object).every((k) => ${JSON.stringify(permittedKeys)}.includes(k));`
		);
		lines.push(`  const options = (_optsFirst ? (args[0] as unknown) : {}) as ${optionsType};`);
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
	if (node.singleElementNeedsTrailing) {
		lines.push(
			`  if (elements.length === 1 && ((options.delimiter ?? ${delimiterDefault}) & Delimiter.Trailing) === 0) {`
		);
		lines.push(`    throw new Error('${node.kind}: a single element requires a trailing delimiter (delimiter: 2)');`);
		lines.push('  }');
	}
	const w = surface.wrapper;
	if (w !== undefined) {
		lines.push(
			`  const _mapped = elements.map((e): T.${w.typeName} => ((isNodeOfKind(e, TSKindId.${w.member}) ? (e as unknown) : ${w.factory}({ ${w.contentKey}: e } as Parameters<typeof ${w.factory}>[0])) as T.${w.typeName}));`
		);
		if (node.nonEmpty) lines.push(`  _assertNonEmpty(_mapped, '${node.kind}.elements');`);
		lines.push(`  const ${contentStorageKey} = _mapped;`);
	} else {
		const admitted = aliasContentAdmission(buildSeparatedListContentSlot(node), 'elements', nodeMap, kindEntries, surface.storageElementsType);
		lines.push(`  const ${contentStorageKey} = ${admitted};`);
	}
	if (hasSeparatorKindOption) {
		const separatorDefault = declaredSeparatorDefault(node, nodeMap, kindEntries);
		if (separatorDefault === undefined) {
			lines.push(`  if (options.separator === undefined) throw new Error('${node.kind}: its separator has no declared default; pass options.separator');`);
			lines.push('  const _separator = options.separator;');
		} else lines.push(`  const _separator = options.separator ?? ${separatorDefault};`);
	}
	if (hasDelimiterOption) {
		lines.push(`  const _delimiter = options.delimiter ?? ${delimiterDefault};`);
	}

	const seats = seatRuntimes(node, nodeMap, kindEntries);
	lines.push(`  return withMethods(${seatOpening(seats)}withAccessors({`);
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
	lines.push(`  })${seatClosing(seats)}) as unknown as ${listBuiltName};`);
	lines.push('}');
	return lines.join('\n');
}

interface TextFactoryNode {
	readonly kind: string;
	readonly typeName: string;
	readonly rawFactoryName?: string;
}

function emitKindIdFactory(
	node: TextFactoryNode,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string {
	const fn = node.rawFactoryName!;
	const id = kindDiscriminantType(node.kind, nodeMap, kindEntries);
	return `export const ${fn}: ${id} = ${id};`;
}

function kindDiscriminantType(
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	return kindEntries === undefined ? JSON.stringify(kind) : kindDiscriminantExpr(kind, nodeMap, kindEntries);
}

function emitTextFactory(
	node: TextFactoryNode,
	params: string,
	textExpr: string,
	guard?: string,
	kindEntries?: readonly KindEnumEntry[],
	nodeMap?: NodeMap,
	typeParams: string = ''
): string {
	const fn = node.rawFactoryName!;
	const typeExpr = factoryTypeDiscriminant(node.kind, nodeMap!, kindEntries);
	const body: string[] = [`export function ${fn}${typeParams}(${params}): T.${node.typeName}.Bound {`];
	if (guard) body.push(`  ${guard}`);
	body.push(
		'  return withMethods({',
		`    $type: ${typeExpr},`,
		`    $source: 2 as const,`,
		'    $named: true as const,',
		`    $text: ${textExpr},`,
		'  });',
		'}'
	);
	return body.join('\n');
}

interface MapEntry {
	kind: string;
	factory: string;
	typeName: string;
	fluent: boolean;
	shape: 'config' | 'children' | 'text' | 'constant' | 'direct' | 'forwarded';
}

export class FactoryEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #leafReConsts: Map<string, string>;
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

		lines.push(`import type * as T from '../types-internal.js';`);
		lines.push(DELIMITER_IMPORT);
		if (kindEntries) {
			const kindIdImports = ['TSKindId'];
			if (collectUsesKindIdFromName(nodeMap, kindEntries)) kindIdImports.push('kindIdFromName');
			lines.push(`import { ${kindIdImports.join(', ')} } from '../types.js';`);
		}
		const usesElementWrap = [...nodeMap.nodes.values()].some(
			(n) => n instanceof AssembledList && separatedListSurface(n, nodeMap, kindEntries).wrapper !== undefined
		);
		const storageCoercionImports = collectStorageCoercionImports(nodeMap, kindEntries);
		lines.push(`import type { ${SITTIR_TYPES_IMPORT_CANDIDATES.join(', ')} } from '@sittir/types';`);
		lines.push(
			`import { ${['withAccessors', ...(usesElementWrap ? ['isNodeOfKind'] : []), ...storageCoercionImports].join(', ')} } from '@sittir/common/utils';`
		);
		lines.push(`import { withMethods } from '../utils.js';`);
		lines.push('');
		lines.push(...emitFluentSetterHelpers());
		lines.push(...emitNonEmptyAssertHelper());
		lines.push('');

		const leafReConsts = buildLeafReConsts(nodeMap, kindEntries, lines);
		if (leafReConsts.size > 0) lines.push('');

		const refineByKind = new Map<string, RefineKindInfo>();
		for (const info of collectRefineKindInfos(nodeMap) ?? []) {
			refineByKind.set(info.kind, info);
		}

		this.#nodeMap = nodeMap;
		this.#kindEntries = kindEntries;
		this.#inlineKinds = inlineKinds;
		this.#synthesizedKinds = synthesizedKinds;
		this.#leafReConsts = leafReConsts;
		this.#refineByKind = refineByKind;
		this.#preambleLines = lines;
	}

	emitLeaf(node: AssembledPattern | AssembledKeyword | AssembledPunctuation | AssembledEnum): void {
		factory.leaf(this.#output, node, this.#nodeMap, this.#leafReConsts, this.#kindEntries);
	}

	emitBranch(node: FieldCarryingNode): void {
		factory.branch(this.#output, node, this.#nodeMap, this.#kindEntries, this.#leafReConsts);
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
			case 'keyword':
			case 'punctuation':
				if (isBuilderTextLeaf(node)) this.emitLeaf(node);
				break;
			case 'envelope':
			case 'branch':
				this.emitBranch(node);
				break;
			case 'polymorph':
			case 'alias':
				if (node instanceof AssembledSupertype) break;
				this.emitBranch(node);
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

		const mapEntries = buildFactoryMapEntries(this.#nodeMap, this.#kindEntries);
		lines.push(...emitFluentKindMap(mapEntries));
		lines.push('');
		lines.push(...emitFactoryMapConst(mapEntries));
		lines.push('');

		return pruneUnusedImports(lines, ['Delimiter', ...SITTIR_TYPES_IMPORT_CANDIDATES]).join('\n');
	}
}

const SITTIR_TYPES_IMPORT_CANDIDATES = ['AdmitBound', 'AnyUntypedNode', 'ByteRange', 'ConfigOf', 'Edit', 'LooseValue', 'NonEmptyArray', 'WidenNumeric'];
