import type { AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { AbstractAssembledCompound, AssembledAlias, isBuilderTextLeaf, storageKindOfRef } from '../compiler/model/node-map.ts';
import { CHOICE, SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../types/rule.ts';
import { findOwnKindEntry, type GeneratedIdTables } from '../dsl/symbol-table.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import {
	AssembledSupertype,
	AssembledList,
	AssembledKeyword,
	AssembledNonterminal,
	AssembledPunctuation,
	isNodeRef
} from '../compiler/model/node-map.ts';

type BranchLikeForWrap = AuthoredCompound;
import { deriveUnnamedChildrenCardinality } from '../compiler/model/node-map.ts';
import { buildSupertypeMembersMap } from '../compiler/model/supertype-members.ts';
import { interiorOf } from './interior.ts';

import {
	DELIMITER_IMPORT,
	collectAliasTargetToSourceMap,
	hasOptionalElements,
	isMultiple,
	isNonEmpty,
	isRequired,
	resolveFieldStorageInfo,
	reclaimsAnonymousChild,
	wrapExposesChildren,
	classifyWrapEmission,
	isSlotBearingCompound,
	warnSkippedParserSymbol,
	canonicalSeparatedListField,
	kindEnumTextIdPairs,
	kindEnumAltIdPairs,
	kindEnumOwnSymbolIds,
	fieldTypeComponents,
	slotSeparatorTexts,
	pruneUnusedImports
} from './shared.ts';
import {
	builtTypeSurfaceOf,
	childElementType,
	childrenSetterRestType,
	declaredSeparatorDefault,
	fieldElementType,
	listViewOwners,
	seatRuntimes,
	seatOpening,
	seatClosing
} from './factories.ts';
import { deriveChildrenKinds } from './transport-common.ts';
import {
	collectKindEntries,
	findKindEntry,
	hasCatalogEntry,
	kindDiscriminantExpr,
	kindDiscriminantExprForId,
	kindDiscriminantExprForLiteral,
	collectCatalogKinds,
	type KindEnumEntry
} from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';
interface SlotModel {
	readonly name: string;
	readonly propertyName: string;
	readonly storageKey: string;
	readonly arity: 'one' | 'many';
}

export interface EmitWrapConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	kindEntries?: readonly KindEnumEntry[];
	rootKind?: string;
}

function collectTypeImports(_nodeMap: NodeMap): Set<string> {
	return new Set<string>();
}

function declaredParsedType(
	node: { readonly kind: string; readonly typeName: string },
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	return kindEntries !== undefined && findKindEntry(kindEntries, node.kind) !== undefined
		? `T.${node.typeName}.Parsed`
		: undefined;
}

function castToParsed(expression: string, parsedType: string | undefined): string {
	return parsedType === undefined ? expression : `${expression} as unknown as ${parsedType}`;
}

function returnAnnotation(parsedType: string | undefined): string {
	return parsedType === undefined ? '' : `: ${parsedType}`;
}

function renameUnusedTreeParam(source: string): string {
	const header = source.match(/^export function wrap\w+\(data: .*, tree: TreeHandle\)(?:: [^\n{]+)? \{$/m)?.[0];
	if (header === undefined) return source;
	if (/\btree\b/.test(source.replace(header, ''))) return source;
	return source.replace(header, header.replace(', tree: TreeHandle)', ', _tree: TreeHandle)'));
}

export namespace wrap {
	export function branch(
		output: string[],
		node: BranchLikeForWrap,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		const result = emitFieldCarryingWrap(
			{
				kind: node.kind,
				typeName: node.typeName,
				rawFactoryName: node.rawFactoryName,
				exposesChildren: wrapExposesChildren(node, nodeMap)
			},
			node.slots,
			[],
			kindEntries,
			nodeMap
		);
		output.push(renameUnusedTreeParam(result));
	}

	export function supertype(
		output: string[],
		node: AssembledSupertype,
		_kindEntries: readonly KindEnumEntry[] | undefined
	): void {
		output.push(renameUnusedTreeParam(emitTransparentSupertypeWrap(node)));
	}

	export function separatedList(
		output: string[],
		node: AssembledList,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		const result = emitSeparatedListWrap(node, kindEntries, nodeMap);
		if (result !== undefined) output.push(renameUnusedTreeParam(result));
	}
}

interface WrapNode {
	readonly kind: string;
	readonly typeName: string;
	readonly rawFactoryName?: string;
	readonly exposesChildren: boolean;
}

interface ResolveSlotDrillConfig {
	readonly dataExpr: string;
	readonly elemType: string;
	readonly required: boolean;
	readonly nonEmpty?: boolean;
	readonly storageInfo?: ReturnType<typeof resolveFieldStorageInfo>;
	readonly allowedKinds?: readonly string[];
	readonly reclaimKindIdsExpr?: string;
	readonly kindEnumTextIdPairs?: readonly (readonly [string, number])[];
	readonly kindEnumAltIdPairs?: readonly (readonly [number, number])[];
	readonly kindEnumOwnSymbolIds?: readonly number[];
	readonly forceUnknownElement?: boolean;
	readonly separatorIdsExpr?: string;
	readonly elided?: boolean;
}

function resolveSlotDrillExprs(
	slot: SlotModel,
	config: ResolveSlotDrillConfig
): {
	storeExpr: string;
	accessorBody: string;
} {
	const rawStoreExpr = dataAccessExpr(config.dataExpr, slot.storageKey);
	if (config.separatorIdsExpr !== undefined && slot.arity === 'many' && config.elided) {
		const allowedArg =
			config.allowedKinds && config.allowedKinds.length > 0 ? JSON.stringify(config.allowedKinds) : 'undefined';
		return {
			storeExpr: `splitElidedWrapSlot(${rawStoreExpr}, ${config.separatorIdsExpr}, ${allowedArg}, _order, ${JSON.stringify(slotOrderName(slot))})`,
			accessorBody: resolveSlotAccessorBody(slot, `${config.elemType} | undefined`)
		};
	}
	const slotStoreExpr =
		config.separatorIdsExpr !== undefined
			? `dropWireDelimiters(${rawStoreExpr}, ${config.separatorIdsExpr}, _order, ${JSON.stringify(slotOrderName(slot))})`
			: rawStoreExpr;
	const filteredStoreExpr =
		config.allowedKinds && config.allowedKinds.length > 0
			? `_filterWrapChildrenByKind(${slotStoreExpr}, ${JSON.stringify(config.allowedKinds)})`
			: slotStoreExpr;
	const diagnosticContextExpr = `{ tree, nodeType: ${config.dataExpr}.$type, slotName: ${JSON.stringify(slot.name)}, span: (${config.dataExpr} as _NodeData).$span }`;
	const reclaimedStoreExpr =
		config.reclaimKindIdsExpr !== undefined
			? `(${filteredStoreExpr} ?? readTerminalFromOther<${config.elemType}>(${config.dataExpr}, ${config.reclaimKindIdsExpr}))`
			: filteredStoreExpr;
	const typeArg = config.forceUnknownElement ? '<unknown>' : '';
	const normalizedStoreExpr =
		slot.arity === 'many'
			? `normalizeRepeatedWrapSlot${typeArg}(${reclaimedStoreExpr}, ${config.nonEmpty ? 'true' : 'false'}, ${JSON.stringify(slot.name)}, ${diagnosticContextExpr})`
			: `normalizeSingularWrapSlot${typeArg}(${reclaimedStoreExpr}, ${JSON.stringify(slot.name)}, ${config.required ? 'true' : 'false'}, ${config.dataExpr}.$type, ${diagnosticContextExpr})`;
	const storageInfo = config.storageInfo;
	if (storageInfo?.kind === 'boolean') {
		return {
			storeExpr: `coerceBooleanKeywordStorage(${normalizedStoreExpr})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	if (storageInfo?.kind === 'bitflag') {
		return {
			storeExpr: `coerceBitflagStorage(${normalizedStoreExpr}, ${bitflagTextsExpr(storageInfo.texts)})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	const textIdMapExpr =
		config.kindEnumTextIdPairs && config.kindEnumTextIdPairs.length > 0
			? `{ ${config.kindEnumTextIdPairs.map(([text, id]) => `${JSON.stringify(text)}: ${id}`).join(', ')} }`
			: undefined;
	const altIdMapExpr =
		config.kindEnumAltIdPairs && config.kindEnumAltIdPairs.length > 0
			? `{ ${config.kindEnumAltIdPairs.map(([alt, stored]) => `${alt}: ${stored}`).join(', ')} }`
			: undefined;
	const projectionArgs = altIdMapExpr
		? `, ${textIdMapExpr ?? 'undefined'}, ${altIdMapExpr}`
		: textIdMapExpr
			? `, ${textIdMapExpr}`
			: '';
	if (storageInfo?.kind === 'kindEnum') {
		return {
			storeExpr: `projectKindEnumStorage(${normalizedStoreExpr}${projectionArgs})`,
			accessorBody: `return this.${slot.storageKey}`
		};
	}
	if (storageInfo?.kind === 'mixedEnum') {
		const ownSymbolsExpr =
			config.kindEnumOwnSymbolIds && config.kindEnumOwnSymbolIds.length > 0
				? `[${config.kindEnumOwnSymbolIds.join(', ')}]`
				: undefined;
		const mixedArgs = ownSymbolsExpr
			? `, ${textIdMapExpr ?? 'undefined'}, ${altIdMapExpr ?? 'undefined'}, ${ownSymbolsExpr}`
			: projectionArgs;
		return {
			storeExpr: mixedArgs ? `projectMixedEnumStorage(${normalizedStoreExpr}${mixedArgs})` : normalizedStoreExpr,
			accessorBody: resolveSlotAccessorBody(
				slot,
				slot.arity === 'many' ? config.elemType : config.required ? config.elemType : `${config.elemType} | undefined`
			)
		};
	}
	return {
		storeExpr: normalizedStoreExpr,
		accessorBody: resolveSlotAccessorBody(
			slot,
			slot.arity === 'many' ? config.elemType : config.required ? config.elemType : `${config.elemType} | undefined`
		)
	};
}

interface UnnamedChildrenSlotConfig {
	readonly slot: SlotModel;
	readonly elemType: string;
	readonly required: boolean;
	readonly nonEmpty: boolean;
	readonly allowedKinds: readonly string[];
}

function resolveUnnamedSlotConfig(
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): UnnamedChildrenSlotConfig {
	const cardinality = deriveUnnamedChildrenCardinality(children);
	const arity = children.length === 1 && !cardinality.multiple ? 'one' : 'many';
	const soleChild = children.length === 1 ? children[0] : undefined;
	return {
		slot: {
			name: 'children',
			propertyName: soleChild?.propertyName ?? (arity === 'many' ? 'contents' : 'content'),
			storageKey: '$other',
			arity
		} satisfies SlotModel,
		elemType: childElementType({ children }, nodeMap, kindEntries),
		required: cardinality.required,
		nonEmpty: cardinality.nonEmpty,
		allowedKinds: [...new Set(children.flatMap((child) => deriveChildrenKinds(child, nodeMap)))]
	};
}

function bitflagTextsExpr(texts: readonly string[]): string {
	return `[${texts.map((text) => JSON.stringify(text)).join(', ')}]`;
}

function buildWrapParamType(typeName: string, otherType?: string): string {
	return otherType === undefined ? `T.${typeName}` : `T.${typeName} & { readonly $other?: ${otherType}; }`;
}

const SAFE_IDENT_KEY = /^_[A-Za-z_$][A-Za-z0-9_$]*$/;

function dataAccessExpr(dataExpr: string, storageKey: string): string {
	if (SAFE_IDENT_KEY.test(storageKey)) {
		return `${dataExpr}.${storageKey}`;
	}
	return `${dataExpr}[${JSON.stringify(storageKey)}]`;
}

function resolveSlotAccessorBody(slot: SlotModel, valueType: string): string {
	if (slot.arity === 'many') {
		const arrayElemType = valueType.includes(' | ') ? `(${valueType})` : valueType;
		return `return expandChildren<${valueType}>(this.${slot.storageKey} as readonly ${arrayElemType}[] | undefined, tree)`;
	}
	return `return expandChild<${valueType}>(this.${slot.storageKey}, tree)`;
}

function emitTransparentSupertypeWrap(node: AssembledSupertype): string {
	const fn = `wrap${node.typeName}`;
	const parsed = node.declared ? `T.${node.typeName}.Parsed` : `SupertypeSurface<T.${node.typeName}, T.ParsedByKindId>`;
	const cast = (expression: string): string => `${expression} as unknown as ${parsed}`;
	const reachable = [
		...node.subtypeNames,
		...(node.transitiveParseKinds ?? []).filter(isNodeRef).map((ref) => storageKindOfRef(ref.node))
	];
	const allowedKinds = [
		...new Set(reachable.flatMap((kind) => (kind.startsWith('_') ? [kind, kind.slice(1)] : [kind])))
	];
	const paramType = buildWrapParamType(node.typeName, `T.${node.typeName} | readonly T.${node.typeName}[]`);
	const subtypeRefs = node.subtypes.filter(isNodeRef);
	if (
		subtypeRefs.length > 0 &&
		subtypeRefs.every((ref) => ref.node instanceof AssembledPunctuation || ref.node instanceof AssembledKeyword)
	) {
		return [
			`export function ${fn}(data: ${paramType}, tree: TreeHandle): ${parsed} {`,
			`  return ${cast('data')};`,
			'}'
		].join('\n');
	}
	return [
		`export function ${fn}(data: ${paramType}, tree: TreeHandle): ${parsed} {`,
		`  if (typeof data === 'number') return ${cast('data')};`,
		`  const node = _keepModelledSlots(data, ${JSON.stringify(allowedKinds.map((k) => `_${k}`))});`,
		`  const kindKeyed = _firstKindKeyedWrapChild(node, ${JSON.stringify(allowedKinds)}) as T.${node.typeName} | readonly T.${node.typeName}[] | undefined;`,
		`  const filtered = kindKeyed ?? _filterWrapChildrenByKind(node.$other, ${JSON.stringify(allowedKinds)});`,
		`  if (filtered === undefined && (typeof (node as _NodeData).$text === 'string' || treeHandleOf(node) !== undefined)) {`,
		`    return ${cast(`expandStub<T.${node.typeName}>(node as T.${node.typeName}, tree)`)};`,
		`  }`,
		`  return expandChild<T.${node.typeName}>(normalizeSingularWrapSlot(filtered, "children", true, node.$type, { tree, nodeType: node.$type, slotName: "children", span: (node as _NodeData).$span }), tree);`,
		`}`
	].join('\n');
}

export function buildSeparatedListContentSlot(node: AssembledList): AssembledNonterminal {
	return new AssembledNonterminal({
		values: node.elements,
		fieldName: undefined,
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: []
	});
}

function buildSeparatedListWrapParamType(typeName: string): string {
	return `T.${typeName} & { readonly $other?: _NodeData['$other']; readonly $span?: { start: number; end: number } }`;
}

function emitSeparatedListWrap(
	node: AssembledList,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const fn = `wrap${node.typeName}`;
	const lines: string[] = [];

	const contentSlot = buildSeparatedListContentSlot(node);
	const canonical = canonicalSeparatedListField(node);
	const canonicalKeys = new Set(node.slots.map((f) => f.storageKey));
	const paramType = buildSeparatedListWrapParamType(node.typeName);
	const parsedType = declaredParsedType(node, kindEntries);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle)${returnAnnotation(parsedType)} {`);
	lines.push(`  data = _keepModelledSlots(data, ${JSON.stringify([...canonicalKeys])});`);
	if (wrapsAnonLiteralContent(node.slots, nodeMap)) {
		lines.push(
			`  if (_isReadTextLeaf(data)) return ${castToParsed(`withMethods({ ...data${wrapTextLeafTypeStamp(node, kindEntries)} })`, parsedType)};`
		);
	}

	const storageInfo = resolveFieldStorageInfo(contentSlot, nodeMap, kindEntries);
	const contentModel: SlotModel = {
		name: canonical.name,
		propertyName: canonical.propertyName,
		storageKey: canonical.storageKey,
		arity: 'many'
	};
	const { storeExpr, accessorBody } = resolveSlotDrillExprs(contentModel, {
		dataExpr: 'data',
		elemType: fieldElementType(contentSlot, nodeMap, kindEntries),
		required: node.nonEmpty,
		nonEmpty: node.nonEmpty,
		storageInfo,
		forceUnknownElement: node.slots.length > 1
	});
	lines.push(`  const _content = ${storeExpr};`);
	const seats = seatRuntimes(nodeMap.nodes.get(node.kind)!, nodeMap, kindEntries, 'RAW.', 'tree');
	if (node.slots.length > 1) emitSlotOrderDraftLine(node.slots, node.kind, lines, kindEntries, nodeMap);
	lines.push(`  return withMethods(${seatOpening(seats)}{`);
	lines.push('    ...data,');
	if (kindEntries) {
		const entry = findKindEntry(kindEntries, node.kind);
		if (entry) {
			lines.push(`    $type: TSKindId.${entry.member} as const,`);
		}
	}
	if (node.slots.length > 1) {
		emitFieldStorageLines(node.slots, node.kind, 'data', lines, kindEntries, nodeMap);
	} else {
		lines.push(`    ${canonical.storageKey}: _content,`);
	}
	if (node.separatorRule) {
		const candidateExprs = node.separatorCandidateKindNames
			.filter((k) => hasCatalogEntry(kindEntries, k))
			.map((k) => kindDiscriminantExpr(k, nodeMap, kindEntries));
		lines.push(
			`    _separator: _separatorKindOf(data, [${candidateExprs.join(', ')}])${separatorDefaultSuffix(declaredSeparatorDefault(node, nodeMap, kindEntries))},`
		);
	}
	const bothFlanksOptional = node.leadingDelimiter === 'optional' && node.trailingDelimiter === 'optional';
	const delimiterParts: string[] = [];
	if (node.leadingDelimiter === 'optional') {
		const mandatoryAnons = node.trailingDelimiter === 'mandatory' ? 1 : 0;
		delimiterParts.push(
			`(_hasSeparatorFlank(data, _content, data.$other, "leading", ${bothFlanksOptional}, ${mandatoryAnons}) ? Delimiter.Leading : Delimiter.None)`
		);
	}
	if (node.trailingDelimiter === 'optional') {
		const mandatoryAnons = node.leadingDelimiter === 'mandatory' ? 1 : 0;
		delimiterParts.push(
			`(_hasSeparatorFlank(data, _content, data.$other, "trailing", ${bothFlanksOptional}, ${mandatoryAnons}) ? Delimiter.Trailing : Delimiter.None)`
		);
	}
	if (delimiterParts.length > 0) {
		lines.push(`    _delimiter: ${delimiterParts.join(' | ')},`);
	}
	lines.push('');
	if (node.slots.length > 1) {
		emitFieldAccessorLines(node.slots, node.kind, 'data', lines, kindEntries, nodeMap);
	} else {
		lines.push(`    ${canonical.propertyName}() { ${accessorBody}; },`);
	}
	lines.push('    $with: {},');
	lines.push(`  }${seatClosing(seats)})${parsedType === undefined ? '' : ` as unknown as ${parsedType}`};`);
	lines.push('}');
	return lines.join('\n');
}

function computeCollidedReclaimKinds(
	slots: readonly AssembledNonterminal[],
	ownerKind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): ReadonlySet<string> {
	const claimedBy = new Map<string, string[]>();
	for (const f of slots) {
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (!reclaimsAnonymousChild(f, nodeMap)) continue;
		for (const k of storageInfo.enumKinds) {
			if (!hasCatalogEntry(kindEntries, k)) continue;
			const slots = claimedBy.get(k) ?? [];
			if (!slots.includes(f.name)) slots.push(f.name);
			claimedBy.set(k, slots);
		}
	}
	const collided = new Set<string>();
	for (const [k, slots] of claimedBy) {
		if (slots.length < 2) continue;
		collided.add(k);
		console.warn(
			`[codegen] reclaim-ambiguous: kind '${ownerKind}' has unnamed slots ` +
				`[${slots.join(', ')}] all reclaiming member '${k}' from $other; the token is ` +
				`ambiguous between them — auto-reclaim suppressed. Field one operator (override) to resolve.`
		);
	}
	return collided;
}

function emitFieldStorageLines(
	slots: readonly AssembledNonterminal[],
	ownerKind: string,
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	const collidedReclaimKinds = computeCollidedReclaimKinds(slots, ownerKind, nodeMap, kindEntries);
	for (const f of slots) {
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const reclaimKindIdsExpr = reclaimsAnonymousChild(f, nodeMap)
			? (() => {
					const ids = storageInfo.enumKinds
						.filter((k) => !collidedReclaimKinds.has(k))
						.map((k) => {
							const id = storageInfo.enumKindsById.get(k);
							return id !== undefined && kindEntries ? kindDiscriminantExprForId(id, kindEntries) : undefined;
						})
						.filter((expr): expr is string => expr !== undefined);
					return ids.length > 0 ? `[${ids.join(', ')}]` : undefined;
				})()
			: undefined;
		const elided = hasOptionalElements(f);
		const { storeExpr } = resolveSlotDrillExprs(f, {
			dataExpr,
			elemType: fieldElementType(f, nodeMap, kindEntries),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			storageInfo,
			reclaimKindIdsExpr,
			kindEnumTextIdPairs:
				storageInfo.kind === 'kindEnum' || storageInfo.kind === 'mixedEnum'
					? kindEnumTextIdPairs(f, nodeMap, kindEntries)
					: undefined,
			kindEnumAltIdPairs:
				storageInfo.kind === 'kindEnum' || storageInfo.kind === 'mixedEnum'
					? kindEnumAltIdPairs(f, nodeMap)
					: undefined,
			kindEnumOwnSymbolIds: storageInfo.kind === 'mixedEnum' ? kindEnumOwnSymbolIds(f, nodeMap) : undefined,
			separatorIdsExpr: separatorIdsExprOf(f, nodeMap.nodes.get(ownerKind), kindEntries, elided),
			elided
		});
		lines.push(`    ${f.storageKey}: ${storeExpr},`);
	}
	if (dropsDelimiters(slots, ownerKind, kindEntries, nodeMap)) lines.push('    ...(_order && { $slotOrder: _order }),');
}

function slotOrderName(slot: SlotModel): string {
	return slot.storageKey.slice(1);
}

function dropsDelimiters(
	slots: readonly AssembledNonterminal[],
	ownerKind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): boolean {
	const owner = nodeMap.nodes.get(ownerKind);
	return slots.some((f) => separatorIdsExprOf(f, owner, kindEntries, hasOptionalElements(f)) !== undefined);
}

function emitSlotOrderDraftLine(
	slots: readonly AssembledNonterminal[],
	ownerKind: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	if (dropsDelimiters(slots, ownerKind, kindEntries, nodeMap)) lines.push('  const _order = (data as _NodeData).$slotOrder?.slice();');
}

function separatorIdsExprOf(
	f: AssembledNonterminal,
	owner: AssembledNode | undefined,
	kindEntries: readonly KindEnumEntry[] | undefined,
	elided: boolean
): string | undefined {
	if (!kindEntries) return undefined;
	const tagged = owner !== undefined && f.fieldName !== undefined ? (fieldTaggedLiteralTexts(owner).get(f.fieldName) ?? []) : [];
	const sepTexts = [...new Set([...slotSeparatorTexts(f, elided), ...tagged])];
	if (sepTexts.length === 0) return undefined;
	return `[${sepTexts.map((text) => kindDiscriminantExprForLiteral(text, kindEntries)).join(', ')}]`;
}

function fieldTaggedLiteralTexts(node: AssembledNode): ReadonlyMap<string, readonly string[]> {
	const out = new Map<string, string[]>();
	const walk = (rule: RenderRule, field: string | undefined): void => {
		const own = (rule as { fieldName?: string }).fieldName ?? field;
		switch (rule.type) {
			case STRING:
				if (own !== undefined && own !== (rule as { fieldName?: string }).fieldName) {
					const list = out.get(own) ?? [];
					if (!list.includes(rule.value)) list.push(rule.value);
					out.set(own, list);
				}
				return;
			case SEQ:
			case CHOICE:
				for (const member of rule.members) walk(member, own);
				return;
			default:
				return;
		}
	};
	if (node instanceof AbstractAssembledCompound && !node.lexedInterior) walk(node.renderRule, undefined);
	return out;
}


function emitFieldAccessorLines(
	slots: readonly AssembledNonterminal[],
	ownerKind: string,
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	for (const f of slots) {
		const propName = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const elided = hasOptionalElements(f);
		const { accessorBody } = resolveSlotDrillExprs(f, {
			dataExpr,
			elemType: fieldElementType(f, nodeMap, kindEntries),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			storageInfo,
			separatorIdsExpr: separatorIdsExprOf(f, nodeMap.nodes.get(ownerKind), kindEntries, elided),
			elided
		});
		lines.push(`    ${propName}() { ${accessorBody}; },`);
	}
}

function wrapsAnonLiteralContent(slots: readonly AssembledNonterminal[], nodeMap: NodeMap): boolean {
	return slots.some((f) => fieldTypeComponents(f, nodeMap).some((c) => c.kind === 'literal'));
}

function wrapTextLeafTypeStamp(
	node: { readonly kind: string },
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const entry = kindEntries === undefined ? undefined : findKindEntry(kindEntries, node.kind);
	return entry ? `, $type: TSKindId.${entry.member} as const` : '';
}

function emitFieldCarryingWrap(
	node: WrapNode,
	slots: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): string {
	const fn = `wrap${node.typeName}`;
	const lines: string[] = [];
	const needsOther = children.length > 0;
	const paramType = buildWrapParamType(node.typeName, needsOther ? "_NodeData['$other']" : undefined);
	const interior = interiorOf(nodeMap.nodes.get(node.kind)!);
	const parsedType = declaredParsedType(node, kindEntries);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle)${returnAnnotation(parsedType)} {`);
	lines.push(`  data = _keepModelledSlots(data, ${JSON.stringify([...new Set(slots.map((f) => f.storageKey))])});`);
	if (interior !== undefined) {
		lines.push(
			`  data = _projectLexed(data, TOKEN_INTERIORS[${JSON.stringify(node.kind)}], ${JSON.stringify(node.kind)});`
		);
	}
	if (wrapsAnonLiteralContent(slots, nodeMap)) {
		lines.push(
			`  if (_isReadTextLeaf(data)) return ${castToParsed(`withMethods({ ...data${wrapTextLeafTypeStamp(node, kindEntries)} })`, parsedType)};`
		);
	}

	const hasWithSetters = node.rawFactoryName && (slots.length > 0 || children.length > 0);

	const seats = seatRuntimes(nodeMap.nodes.get(node.kind)!, nodeMap, kindEntries, 'RAW.', 'tree');
	emitSlotOrderDraftLine(slots, node.kind, lines, kindEntries, nodeMap);
	lines.push(hasWithSetters ? `  const _node = withMethods(${seatOpening(seats)}{` : `  return withMethods(${seatOpening(seats)}{`);
	lines.push('    ...data,');
	if (kindEntries) {
		const entry = findKindEntry(kindEntries, node.kind);
		if (entry) {
			lines.push(`    $type: TSKindId.${entry.member} as const,`);
		}
	}
	emitFieldStorageLines(slots, node.kind, 'data', lines, kindEntries, nodeMap);
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, kindEntries);
		const { storeExpr } = resolveSlotDrillExprs(childrenConfig.slot, {
			dataExpr: 'data',
			elemType: childrenConfig.elemType,
			required: childrenConfig.required,
			nonEmpty: childrenConfig.nonEmpty,
			allowedKinds: childrenConfig.allowedKinds
		});
		lines.push(`    $other: ${storeExpr},`);
	}
	lines.push('');

	emitFieldAccessorLines(slots, node.kind, 'data', lines, kindEntries, nodeMap);
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, kindEntries);
		const { accessorBody } = resolveSlotDrillExprs(childrenConfig.slot, {
			dataExpr: 'data',
			elemType: childrenConfig.elemType,
			required: childrenConfig.required,
			nonEmpty: childrenConfig.nonEmpty,
			allowedKinds: childrenConfig.allowedKinds
		});
		lines.push(`    children() { ${accessorBody}; },`);
	}

	emitInlineWithProperty(lines, node, slots, children, nodeMap, kindEntries);

	const closing = `  }${seatClosing(seats)})`;
	lines.push(
		hasWithSetters ? `${closing};` : `${closing}${parsedType === undefined ? '' : ` as unknown as ${parsedType}`};`
	);
	if (hasWithSetters) {
		lines.push(`  return ${castToParsed('_node', parsedType)};`);
	}
	lines.push('}');
	return lines.join('\n');
}

function emitInlineWithProperty(
	lines: string[],
	node: WrapNode,
	slots: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	if (!node.rawFactoryName) return;

	const wrapFn = `wrap${node.typeName}`;

	const spreadData = '...$edited(data)';

	if (node.exposesChildren && children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, kindEntries);
		const childElem = childrenConfig.elemType;
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		const setter = childrenConfig.slot.propertyName;
		if (childrenConfig.slot.arity === 'one') {
			lines.push(`    $with: { ${setter}: (v: ${childElem}) => ${wrapFn}({ ${spreadData}, $other: v }, tree) },`);
		} else {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(`    $with: { ${setter}: (...vs: ${restType}) => ${wrapFn}({ ${spreadData}, $other: vs }, tree) },`);
		}
		return;
	}

	if (slots.length === 0 && children.length === 0) {
		lines.push('    $with: {},');
		return;
	}

	const restSlots = new Set(
		(builtTypeSurfaceOf(nodeMap.nodes.get(node.kind)!, nodeMap, kindEntries)?.setters ?? [])
			.filter((setter) => setter.rest)
			.map((setter) => setter.name)
	);
	lines.push('    $with: {');
	for (const f of slots) {
		const method = f.propertyName;
		if (isMultiple(f) && restSlots.has(method)) {
			const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>[number]`;
			const setterRestElement = setterValueType.includes(' | ') ? `(${setterValueType})` : setterValueType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${setterValueType}>` : `${setterRestElement}[]`;
			lines.push(`      ${method}: (...v: ${restType}) => ${wrapFn}({ ${spreadData}, ${f.storageKey}: v }, tree),`);
		} else {
			const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>`;
			lines.push(`      ${method}: (v: ${setterValueType}) => ${wrapFn}({ ${spreadData}, ${f.storageKey}: v }, tree),`);
		}
	}
	if (children.length > 0) {
		const childrenConfig = resolveUnnamedSlotConfig(children, nodeMap, kindEntries);
		const childElem = childrenConfig.elemType;
		const childRest = childElem.includes(' | ') ? `(${childElem})` : childElem;
		if (childrenConfig.slot.arity === 'one') {
			lines.push(`      children: (item: ${childElem}) => ${wrapFn}({ ${spreadData}, $other: item }, tree),`);
		} else {
			const restType = childrenSetterRestType(children, childElem, childRest);
			lines.push(`      children: (...items: ${restType}) => ${wrapFn}({ ${spreadData}, $other: items }, tree),`);
		}
	}
	lines.push('    },');
}

export class WrapEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #canonicalAliasSourceKinds: ReadonlySet<string>;
	readonly #typeImportLine: string | undefined;
	readonly #rootKind: string | undefined;
	readonly #output: string[] = [];
	readonly #emittedStructuralKinds = new Set<string>();
	#rootTreeTypeName: string | undefined;

	get rootTreeTypeName(): string | undefined {
		return this.#rootTreeTypeName;
	}

	constructor(config: EmitWrapConfig) {
		const {
			nodeMap,
			generatedIdTables,
			inlineKinds,
			synthesizedKinds,
			kindEntries: providedKindEntries,
			rootKind
		} = config;
		const kindEntries =
			providedKindEntries ??
			(generatedIdTables
				? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
				: undefined);

		const typeImports = collectTypeImports(nodeMap);
		this.#nodeMap = nodeMap;
		this.#kindEntries = kindEntries;
		this.#inlineKinds = inlineKinds;
		this.#synthesizedKinds = synthesizedKinds;
		this.#canonicalAliasSourceKinds = new Set(collectAliasTargetToSourceMap(nodeMap).values());
		this.#rootKind = rootKind;
		this.#typeImportLine =
			typeImports.size > 0
				? [
						'import type {',
						...[...typeImports].sort().map((name) => `  ${name},`),
						"} from './types-internal.js';"
					].join('\n')
				: undefined;
	}

	emitBranch(node: BranchLikeForWrap): void {
		wrap.branch(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitSupertype(node: AssembledSupertype): void {
		wrap.supertype(this.#output, node, this.#kindEntries);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitSeparatedList(node: AssembledList): void {
		wrap.separatedList(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	dispatchNode(kind: string, node: AssembledNode): void {
		let emission = classifyWrapEmission(kind, node, {
			kindEntries: this.#kindEntries,
			inlineKinds: this.#inlineKinds,
			synthesizedKinds: this.#synthesizedKinds
		});
		if (
			(emission === 'skip-missing-parser-symbol' || emission === 'skip-synthesized-kind') &&
			this.#canonicalAliasSourceKinds.has(kind)
		) {
			emission = 'emit';
		}
		if (
			emission === 'skip-inline-kind' ||
			emission === 'skip-synthesized-kind' ||
			emission === 'skip-missing-parser-symbol'
		) {
			warnSkippedParserSymbol(kind, 'wrap', emission);
		}
		if (emission !== 'emit') return;
		switch (node.modelType) {
			case 'envelope':
			case 'branch':
				this.emitBranch(node);
				break;
			case 'polymorph':
			case 'alias':
				this.emitBranch(node);
				break;
			case 'supertype':
				this.emitSupertype(node);
				break;
			case 'list':
				this.emitSeparatedList(node);
				break;
			default:
				break;
		}
	}

	#aliasIdentityLines(): string[] {
		const displayOf = [
			"function _displayOf(entry: _NodeData): _NodeData['$type'] {",
			"  return (entry as { readonly $displayType?: _NodeData['$type'] }).$displayType ?? entry.$type;",
			'}'
		];
		if (!this.#kindEntries) {
			return [...displayOf, "function _kindOf(entry: _NodeData): _NodeData['$type'] {", '  return entry.$type;', '}', ''];
		}
		const envelopes = [...this.#nodeMap.nodes.values()].filter((node) => node instanceof AssembledAlias);
		const envelopeIds = [...new Set(envelopes.map((node) => node.aliasTypeId))].sort((a, b) => a - b);
		const hiddenIds =
			envelopes.length === 0
				? []
				: [...new Set(this.#kindEntries.filter((entry) => entry.hidden).map((entry) => entry.id))].sort((a, b) => a - b);
		return [
			`const _ALIAS_ENVELOPES: ReadonlySet<_NodeData["$type"]> = new Set([${envelopeIds.join(', ')}]);`,
			...(envelopes.length === 0 ? [] : [`const _HIDDEN_KINDS: ReadonlySet<_NodeData["$type"]> = new Set([${hiddenIds.join(', ')}]);`]),
			...displayOf,
			"function _kindOf(entry: _NodeData): _NodeData['$type'] {",
			'  const display = _displayOf(entry);',
			'  return _ALIAS_ENVELOPES.has(display) ? display : entry.$type;',
			'}',
			'function _withoutDisplay(data: _NodeData): _NodeData {',
			'  const { $displayType: _display, ...node } = data as _NodeData & { readonly $displayType?: number };',
			'  return node as _NodeData;',
			'}',
			''
		];
	}

	#dropSpellingLines(): string[] {
		const reclaiming = [...this.#nodeMap.nodes.values()].filter((node) =>
			node.slots.some((slot) => reclaimsAnonymousChild(slot, this.#nodeMap))
		);
		const keys = this.#kindEntries
			? [
					...new Set(
						reclaiming
							.map((node) => findOwnKindEntry(this.#kindEntries!, node.kind)?.id)
							.filter((id): id is number => id !== undefined)
					)
				]
					.sort((a, b) => a - b)
					.map(String)
			: [...new Set(reclaiming.map((node) => JSON.stringify(node.kind)))].sort();
		return [
			`const _RECLAIMS_ANONYMOUS: ReadonlySet<_NodeData["$type"]> = new Set([${keys.join(', ')}]);`,
			'function _spellingTokens(data: _NodeData): readonly _NodeData[] | undefined {',
			'  const { $other, ...node } = data;',
			'  if ($other === undefined || _RECLAIMS_ANONYMOUS.has(data.$type)) return undefined;',
			'  if (Object.keys(node).some((key) => key.charCodeAt(0) === 95)) return undefined;',
			'  const tokens = (Array.isArray($other) ? $other : [$other]) as readonly unknown[];',
			'  if (tokens.some((token) => typeof token !== "object" || token === null || (token as _NodeData).$named !== false)) return undefined;',
			'  return tokens as readonly _NodeData[];',
			'}',
			'function _spelledText(data: _NodeData): string | undefined {',
			'  if (data.$text !== undefined) return data.$text;',
			'  const tokens = _spellingTokens(data);',
			'  return tokens === undefined ? undefined : _tiledSpelling(data.$span, tokens);',
			'}',
			'function _dropSpelling(data: _NodeData): _NodeData {',
			'  if (_spellingTokens(data) === undefined) return data;',
			'  const { $other: _tokens, ...node } = data;',
			'  const $text = _spelledText(data);',
			'  return ($text === undefined ? node : { ...node, $text }) as _NodeData;',
			'}',
			'function _spellingOf(entry: _NodeData): string | undefined {',
			'  const text = _spelledText(entry);',
			'  if (text !== undefined || entry.$named !== false) return text;',
			'  const shown = _displayOf(entry);',
			`  return ${this.#kindEntries ? 'typeof shown === "number" ? KIND_DISPLAY_NAMES.get(shown) : shown' : 'String(shown)'};`,
			'}',
			'function _tiledSpelling(span: _NodeData["$span"], children: readonly _NodeData[]): string | undefined {',
			'  if (span === undefined) return undefined;',
			'  let at = span.start;',
			'  let text = "";',
			'  for (const child of children) {',
			'    const spelling = _spellingOf(child);',
			'    if (child.$span?.start !== at || spelling === undefined) return undefined;',
			'    text += spelling;',
			'    at = child.$span.end;',
			'  }',
			'  return at === span.end ? text : undefined;',
			'}',
			'function _readChildren(data: _NodeData): readonly _NodeData[] | undefined {',
			'  const children: _NodeData[] = [];',
			'  for (const [key, value] of Object.entries(data)) {',
			'    if (key.charCodeAt(0) !== 95 && key !== "$other") continue;',
			'    for (const child of (Array.isArray(value) ? value : [value]) as readonly unknown[]) {',
			'      if (child === undefined) continue;',
			'      if (typeof child !== "object" || child === null) return undefined;',
			'      children.push(child as _NodeData);',
			'    }',
			'  }',
			'  return children.sort((a, b) => (a.$span?.start ?? 0) - (b.$span?.start ?? 0));',
			'}',
			'function _spelledLeaf(data: _NodeData): _NodeData {',
			'  if (data.$text !== undefined) return data;',
			'  const children = _readChildren(data);',
			'  if (children === undefined || children.length === 0) return data;',
			'  const $text = _tiledSpelling(data.$span, children);',
			'  if ($text === undefined) return data;',
			'  const leaf: Record<string, unknown> = {};',
			'  for (const [key, value] of Object.entries(data)) {',
			'    if (key.charCodeAt(0) !== 95 && key !== "$other" && key !== "$slotOrder") leaf[key] = value;',
			'  }',
			'  return { ...leaf, $text } as _NodeData;',
			'}',
			''
		];
	}

	finalize(): string {
		const bodyLines: string[] = [];
		for (const source of this.#output) {
			bodyLines.push(source);
			bodyLines.push('');
		}
		const bodySource = bodyLines.join('\n');
		const usesProjectKindEnum = /\bprojectKindEnumStorage\b/.test(bodySource);
		const usesProjectMixedEnum = /\bprojectMixedEnumStorage\b/.test(bodySource);
		const usesSeparatorKindOf = /\b_separatorKindOf\b/.test(bodySource);
		const usesReadTerminalFromOther = /\breadTerminalFromOther\b/.test(bodySource) || usesSeparatorKindOf;
		const usesHasSeparatorFlank = /\b_hasSeparatorFlank\b/.test(bodySource);
		const usesSplitElided = /\bsplitElidedWrapSlot\b/.test(bodySource);
		const usesDropWireDelimiters = /\bdropWireDelimiters\b/.test(bodySource);
		const usesWireDelimiter = usesSplitElided || usesDropWireDelimiters;
		const usesFilteredChildren = /\b_filterWrapChildrenByKind\b/.test(bodySource) || usesSplitElided;
		const usesNormalizeSingular = /\bnormalizeSingularWrapSlot\b/.test(bodySource);
		const usesNormalizeRepeated = /\bnormalizeRepeatedWrapSlot\b/.test(bodySource);
		const usesToArr = /\b_toArr\b/.test(bodySource);
		const usesKeepModelledSlots = /\b_keepModelledSlots\b/.test(bodySource);
		const usesIsReadTextLeaf = /\b_isReadTextLeaf\b/.test(bodySource) || /\b_projectLexed\b/.test(bodySource);
		const usesProjectLexed = /\b_projectLexed\b/.test(bodySource);
		const supertypeMembers = buildSupertypeMembersMap(this.#nodeMap);
		const kindEntries = this.#kindEntries;
		const listOwnerMembers =
			kindEntries === undefined
				? []
				: listViewOwners(this.#nodeMap)
						.map((node) => findKindEntry(kindEntries, node.kind)?.member)
						.filter((member): member is string => member !== undefined)
						.sort();
		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'// Lazy view layer over readNode output — shape A surface.',
			'',
			"import { readNode, isStub, markEdited as $edited, treeHandleOf, mapTriviaEntries, projectInterior, coerceBooleanKeywordStorage, coerceBitflagStorage, inTreeEngine, withListView, withListSlots, withGroupSeat, withElementsSeat } from '@sittir/common/utils';",
			"import type { TreeHandle, TokenInterior } from '@sittir/common/utils';",
			"import { TOKEN_INTERIORS } from './consts.js';",
			"import type { ParsedRoot } from '@sittir/common/engine';",
			"import type { AnyNodeData as _NodeData, AnyNodeData, NonEmptyArray, SupertypeSurface } from '@sittir/types';",
			...(this.#kindEntries ? ["import { TSKindId, KIND_NAMES, KIND_DISPLAY_NAMES } from './types.js';"] : []),
			DELIMITER_IMPORT,
			"import type * as T from './types-internal.js';",
			...(this.#typeImportLine ? [this.#typeImportLine] : []),
			"import { withMethods } from './utils.js';",
			"import * as FR from './factories/coerce.js';",
			"import * as RAW from './factories/raw.js';",
			'',
			...(usesIsReadTextLeaf
				? [
						'// A hydrated read-layer TEXT LEAF: the reader modeled no addressable',
						'// structure (no `_<slot>` storage keys, no `$other`) and captured the',
						"// node's verbatim `$text` — e.g. a `string_content` whose only CST",
						'// children are anonymous escape tokens. Such data passes through the',
						"// wrap untouched: fabricating this kind's (empty) slot storage on top",
						'// of it would read as "structure" to every downstream structure probe',
						"// — the validator's `$text` strip and the native render's",
						"// all-slots-empty `$text` fast-path — replacing the leaf's verbatim",
						'// text with an empty template render.',
						'function _isReadTextLeaf(data: object): boolean {',
						'  const d = data as { $text?: unknown; $other?: unknown };',
						"  if (typeof d.$text !== 'string') return false;",
						'  if (d.$other != null) return false;',
						'  for (const key in data) {',
						"    if (key.startsWith('_')) return false;",
						'  }',
						'  return true;',
						'}',
						''
					]
				: []),
			...(usesProjectLexed
				? [
						'function _projectLexed<D extends object>(data: D, interior: TokenInterior, kind: string): D {',
						'  if (!_isReadTextLeaf(data)) return data;',
						'  const projected = projectInterior((data as { $text: string }).$text, interior, kind);',
						'  const out: Record<string, unknown> = { ...(data as Record<string, unknown>) };',
						'  for (const [name, value] of Object.entries(projected)) {',
						'    if (value !== undefined && value !== false) out[`_${name}`] = value;',
						'  }',
						'  return out as D;',
						'}',
						''
					]
				: []),
			...(usesNormalizeSingular || usesNormalizeRepeated
				? [
						'const WRAP_WARNING_MODE = typeof process !== "undefined" && process.env?.SITTIR_WRAP_WARNING_MODE === "1";',
						'interface WrapDiagnosticContext {',
						'  tree?: TreeHandle;',
						'  nodeType: string | number;',
						'  slotName?: string;',
						'  span?: { start?: number; end?: number };',
						'}',
						'function describeWrapNodeType(nodeType: string | number): string {',
						'  if (typeof nodeType === "number") return KIND_NAMES.get(nodeType) ?? String(nodeType);',
						'  return nodeType;',
						'}',
						'function describeWrapLocation(context: WrapDiagnosticContext): string | undefined {',
						'  const source = context.tree ? context.tree.source : undefined;',
						'  const start = context.span?.start;',
						'  if (source == null || start == null) return undefined;',
						"  const lines = source.slice(0, start).split('\\n');",
						'  const line = lines.length;',
						'  const column = (lines[lines.length - 1]?.length ?? 0) + 1;',
						'  return `${line}:${column}`;',
						'}',
						'function describeWrapSnippet(context: WrapDiagnosticContext): string | undefined {',
						'  const source = context.tree ? context.tree.source : undefined;',
						'  const start = context.span?.start;',
						'  const end = context.span?.end;',
						'  if (source == null || start == null || end == null) return undefined;',
						'  return JSON.stringify(source.slice(start, end));',
						'}',
						'function buildWrapDiagnostic(message: string, context: WrapDiagnosticContext): string {',
						'  const location = describeWrapLocation(context);',
						'  const snippet = describeWrapSnippet(context);',
						'  if (location === undefined && snippet === undefined) return message;',
						'  const parts = [message];',
						'  if (location !== undefined) parts.push(`at ${location}`);',
						'  if (snippet !== undefined) parts.push(`near ${snippet}`);',
						'  return parts.join(` — `);',
						'}',
						'function handleWrapViolation<T>(message: string, fallback: T, context: WrapDiagnosticContext): T {',
						'  const diagnostic = buildWrapDiagnostic(message, context);',
						'  if (WRAP_WARNING_MODE) {',
						'    console.warn(`[wrapNode warning] ${diagnostic}`);',
						'    return fallback;',
						'  }',
						'  throw new TypeError(diagnostic);',
						'}',
						'function describeWrapSlotItem(value: unknown): string {',
						'  if (value == null) return String(value);',
						'  if (typeof value !== "object") return `${typeof value}(${JSON.stringify(value)})`;',
						'  const node = value as Partial<_NodeData>;',
						'  if (typeof node.$type === "string" || typeof node.$type === "number") {',
						'    const text = typeof node.$text === "string" ? `, $text=${JSON.stringify(node.$text)}` : "";',
						'    return `node($type=${JSON.stringify(node.$type)}${text})`;',
						'  }',
						'  return `object(keys=${Object.keys(value as Record<string, unknown>).slice(0, 5).join(",")})`;',
						'}',
						'function describeWrapSlotValue(value: unknown): string {',
						'  if (Array.isArray(value)) {',
						'    const preview = value.slice(0, 3).map((item) => describeWrapSlotItem(item)).join(", ");',
						'    const suffix = value.length > 3 ? ", …" : "";',
						'    return `array(len=${value.length}, items=[${preview}${suffix}])`;',
						'  }',
						'  if (value == null) return String(value);',
						'  return describeWrapSlotItem(value);',
						'}',
						...(usesNormalizeSingular
							? [
									'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: true, nodeType: string | number, context: WrapDiagnosticContext): T;',
									'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: false, nodeType: string | number, context: WrapDiagnosticContext): T | undefined;',
									'function normalizeSingularWrapSlot<T>(value: T | readonly T[] | undefined, slotName: string, required: boolean, nodeType: string | number, context: WrapDiagnosticContext): T | undefined {',
									'  if (Array.isArray(value)) {',
									'    if (value.length === 0) {',
									'      if (required) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} requires one value; got ${describeWrapSlotValue(value)}`, undefined as T | undefined, context);',
									'      return undefined;',
									'    }',
									'    if (value.length !== 1) {',
									'      // read_node concatenates grammar-agnostically; the named/unnamed',
									'      // disparity for SINGULAR slots is resolved HERE (the per-kind layer',
									'      // that knows arity). A structural anonymous token co-occurring on the',
									'      // same field (e.g. splat_type `field("identifier", seq("*", $.identifier))`)',
									'      // surfaces as a scalarized kindId NUMBER or a $named:false object; the',
									'      // real value is a string (text-collapsed leaf) or a $named!==false object.',
									'      // Drop the structural tokens — the template re-emits them — and keep the',
									'      // substantive value.',
									'      const substantive = (value as readonly unknown[]).filter((v) => !(typeof v === "number" || (typeof v === "object" && v !== null && (v as { $named?: unknown }).$named === false)));',
									'      if (substantive.length === 1) return substantive[0] as T;',
									'      return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} received ${value.length} values; got ${describeWrapSlotValue(value)}`, value[0] as T, context);',
									'    }',
									'    return value[0] as T;',
									'  }',
									'  if (value == null && required) return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} requires one value; got ${describeWrapSlotValue(value)}`, undefined as T | undefined, context);',
									'  return value as T | undefined;',
									'}'
								]
							: [])
					]
				: []),
			...(usesNormalizeSingular || usesNormalizeRepeated
				? [
						'function normalizeRepeatedWrapSlot<T>(value: T | readonly T[] | undefined, nonEmpty: boolean, slotName: string, context: WrapDiagnosticContext): readonly T[] {',
						'  const items: readonly T[] = Array.isArray(value) ? (value as readonly T[]) : value == null ? ([] as readonly T[]) : ([value] as readonly T[]);',
						'  if (nonEmpty && items.length === 0) return handleWrapViolation(`repeated slot ${JSON.stringify(slotName)} requires at least one value`, items, context);',
						'  return items;',
						'}'
					]
				: []),
			...(usesToArr
				? [
						'// _toArr — normalize a single wire field (may be a scalar value or an',
						'// array of node stubs) to a readonly array. Used by repeated supertype-',
						'// list slot concatenation so that spreading a text-collapsed leaf (e.g.',
						'// primitive_type "i32" arriving as the string "i32") does not split it',
						'// character-by-character.',
						'function _toArr<T>(value: T | readonly T[] | undefined): readonly T[] {',
						'  if (value == null) return [];',
						'  return Array.isArray(value) ? (value as readonly T[]) : [value as T];',
						'}'
					]
				: []),
			'// Expansion helpers — call back through `projectNode` so the same',
			'// per-handle dispatch + wrap pipeline runs at every level. Layering:',
			'//   projectNode (public entry)',
			'//     → readNode (handle-driven — tree.read for native, JS walker otherwise)',
			'//       → wrapNode (dispatches on $type)',
			'//         → expandChild → projectNode (recurse)',
			'// Resolve a node that IS the value being returned — a supertype',
			'// occurrence the reader collapsed to a text leaf stands in for its',
			'// own member. An unexpanded stub reads one more level; anything',
			'// else passes through untouched. It must NOT re-wrap: wrapping',
			'// would dispatch straight back into the wrap function that called',
			'// this, with the same data.',
			...(listOwnerMembers.length === 0
				? []
				: [
						'// A list owner is read two levels at once: its list node arrives with',
						'// its items as stubs, so the owner sizes its list view with no second read.',
						`const _LIST_OWNER_KINDS: ReadonlySet<number> = new Set([${listOwnerMembers.map((member) => `TSKindId.${member}`).join(', ')}]);`
					]),
			'function expandStub<T>(entry: T, tree: TreeHandle): T {',
			'  if (entry == null) return undefined as unknown as T;',
			'  const e = entry as unknown as _NodeData;',
			listOwnerMembers.length === 0
				? '  if (isStub(e)) return projectNode(tree, e.$parentHandle, e.$childIndex) as unknown as T;'
				: '  if (isStub(e)) return projectNode(tree, e.$parentHandle, e.$childIndex, _LIST_OWNER_KINDS.has(e.$type as number) ? 2 : undefined) as unknown as T;',
			'  return entry;',
			'}',
			'// Resolve a CHILD position. Beyond the stub read, node data a deep',
			'// read already expanded carries no coordinates to re-read by (and',
			'// re-reading would replace the expansion with a shallow one), so the',
			'// wrap layer adds its methods in place instead.',
			...(this.#kindEntries
				? [
						'type ParsedOfData<D> = D extends { readonly $type: infer Id }',
						'  ? Id extends keyof T.ParsedByKindId',
						'    ? T.ParsedByKindId[Id]',
						'    : D',
						'  : D;'
					]
				: ['type ParsedOfData<D> = D;']),
			'function expandChild<T>(entry: T, tree: TreeHandle): ParsedOfData<T> {',
			'  const resolved = expandStub(entry, tree);',
			'  const e = resolved as unknown as _NodeData;',
			'  if (resolved === entry && typeof e?.$type === "number") return wrapNode(e, tree) as unknown as ParsedOfData<T>;',
			'  return resolved as unknown as ParsedOfData<T>;',
			'}',
			'function expandChildren<T>(entries: readonly T[] | undefined, tree: TreeHandle): ParsedOfData<T>[] {',
			'  if (!entries) return [];',
			'  const arr = Array.isArray(entries) ? entries : [entries];',
			'  return arr.map(e => expandChild(e, tree));',
			'}',
			...(usesProjectKindEnum
				? [
						'function projectKindEnumStorage<T>(value: T, textIds?: Readonly<Record<string, number>>, altIds?: Readonly<Record<number, number>>): T {',
						'  if (!value) return value;',
						'  if (Array.isArray(value)) return value.map(entry => projectKindEnumStorage(entry, textIds, altIds)) as unknown as T;',
						'  const entry = value as unknown as _NodeData;',
						'  if (typeof value === "string") {',
						'    const mappedId = textIds?.[value];',
						'    return typeof mappedId === "number" ? (mappedId as unknown as T) : value;',
						'  }',
						'  if (typeof value === "number") return (altIds?.[value] ?? value) as unknown as T;',
						'  const kind = _kindOf(entry);',
						'  if (typeof kind === "number" && altIds?.[kind] !== undefined) return altIds[kind] as unknown as T;',
						'  const text = _spelledText(entry);',
						'  if (text !== undefined) {',
						'    const mappedId = textIds?.[text];',
						'    if (typeof mappedId === "number") return mappedId as unknown as T;',
						'    return text as unknown as T;',
						'  }',
						'  return typeof kind === "number" ? (kind as T) : value;',
						'}'
					]
				: []),
			...(usesProjectMixedEnum
				? [
						'function projectMixedEnumStorage<T>(value: T, textIds?: Readonly<Record<string, number>>, altIds?: Readonly<Record<number, number>>, ownSymbols?: readonly number[]): T {',
						'  if (!value) return value;',
						'  if (Array.isArray(value)) return value.map(entry => projectMixedEnumStorage(entry, textIds, altIds, ownSymbols)) as unknown as T;',
						'  const entry = value as unknown as _NodeData;',
						'  if (typeof value === "string") {',
						'    const mappedId = textIds?.[value];',
						'    return typeof mappedId === "number" ? (mappedId as unknown as T) : value;',
						'  }',
						'  if (typeof value === "number") return (altIds?.[value] ?? value) as unknown as T;',
						'  const kind = _kindOf(entry);',
						'  if (typeof kind === "number") {',
						'    const folded = altIds?.[kind];',
						'    if (folded !== undefined) return folded as unknown as T;',
						'    if (textIds && Object.values(textIds).includes(kind)) return kind as unknown as T;',
						'    const text = ownSymbols?.includes(kind) ? _spelledText(entry) : undefined;',
						'    if (text !== undefined) {',
						'      const memberId = textIds?.[text];',
						'      if (typeof memberId === "number") return memberId as unknown as T;',
						'    }',
						'  }',
						'  return value;',
						'}'
					]
				: []),
			...(usesReadTerminalFromOther
				? [
						'// readTerminalFromOther — reclaim a model-designated terminal (operator /',
						'// keyword discriminant) that read_node forwarded to `$other` because it is',
						'// an anonymous, unfielded token. The model knows the slot accepts these',
						'// kinds; match an `$other` entry by kind-name and return it for the slot',
						'// storage. Non-mutating (idempotent): the entry stays in `$other`, but the',
						'// per-kind template renders the discriminant from its slot, not via $other,',
						'// so there is no double-render. A final `?? readTerminalFromOther(...)` only',
						'// fires when the nominal storage keys are all empty (the unfielded case);',
						'// when the token IS field-tagged the chain short-circuits before reaching it.',
						'function readTerminalFromOther<T = _NodeData | number>(data: _NodeData, allowedKindIds: readonly number[]): T | undefined {',
						'  const other = (data as { $other?: readonly unknown[] }).$other;',
						'  if (!Array.isArray(other)) return undefined;',
						'  for (const e of other) {',
						'    const id = typeof e === "number" ? e : (typeof e === "object" && e !== null ? (e as { $type?: unknown }).$type : undefined);',
						'    if (typeof id === "number" && allowedKindIds.includes(id)) return e as T;',
						'  }',
						'  return undefined;',
						'}'
					]
				: []),
			...(usesSeparatorKindOf
				? [
						'// _separatorKindOf — a separatedList nonterminal-separator discriminant,',
						'// reusing readTerminalFromOther’s $other kind-id scan (option B',
						'// reclamation) rather than a parallel scan.',
						'function _separatorKindOf(data: _NodeData, candidateKindIds: readonly number[]): number | undefined {',
						'  const entry = readTerminalFromOther(data, candidateKindIds);',
						'  return typeof entry === "number" ? entry : (entry as _NodeData | undefined)?.$type as number | undefined;',
						'}'
					]
				: []),
			...(usesHasSeparatorFlank
				? [
						'// _hasSeparatorFlank — whether an optional leading/trailing separator is',
						'// present on this instance.',
						'//',
						'// Preferred signal: compare the container span against the first/last',
						"// content element span. A literal separator's $other entry is a bare",
						'// kind-id number with no position of its own (verified against real',
						'// parsed payloads — a "," token is indistinguishable from any other ","',
						'// at a different position), so it cannot answer "which side is this on".',
						"// The container span extending past the content's own extent is direct,",
						'// order-independent evidence instead: no separator ever falls OUTSIDE',
						'// [firstContent.start, lastContent.end] except a leading/trailing flank.',
						'//',
						'// Falls back to a $other-length vs. between-separator-count comparison',
						'// when content is text-collapsed (no per-element span survives — e.g. a',
						'// bare-identifier tuple element arriving as the plain string "a"). That',
						'// fallback is correct ONLY when the OPPOSITE flank direction is',
						"// structurally 'none' on this kind — otherwise a single extra $other",
						'// entry is genuinely ambiguous between "this is the leading flank" and',
						'// "this is the trailing flank", and the count alone cannot tell them',
						'// apart (both queries would compute the identical boolean off the',
						'// identical formula). `otherFlankOptional` is the codegen-time fact',
						"// (`node.leadingDelimiter === 'optional' && node.trailingDelimiter === 'optional'`)",
						'// that flags this — a kind combining both-optional flanks with',
						'// text-collapsed content has no real-grammar coverage today (all such',
						'// kinds currently retain per-element span), so this throws loudly rather',
						'// than silently returning a wrong-for-one-edge answer if that combination',
						'// is ever reached.',
						'function _hasSeparatorFlank(container: { $span?: { start: number; end: number } }, content: readonly unknown[], other: unknown, edge: "leading" | "trailing", otherFlankOptional: boolean, mandatoryAnons: number): boolean {',
						'  const containerSpan = container.$span;',
						'  const anchor = edge === "leading" ? content[0] : content[content.length - 1];',
						'  const anchorSpan = anchor && typeof anchor === "object" ? (anchor as { $span?: { start: number; end: number } }).$span : undefined;',
						'  if (containerSpan && anchorSpan) {',
						'    return edge === "leading" ? containerSpan.start < anchorSpan.start : containerSpan.end > anchorSpan.end;',
						'  }',
						'  if (otherFlankOptional) {',
						'    throw new Error(`_hasSeparatorFlank: cannot disambiguate the "${edge}" flank from its opposite for a text-collapsed content element (no per-element $span) when BOTH flank directions are optional on this kind — the $other-count fallback is ambiguous here. This combination has no real-grammar coverage; a genuine order-aware mechanism is needed before this kind can support both-optional-flank capture.`);',
						'  }',
						'  const otherCount = Array.isArray(other) ? other.length : 0;',
						'  // Baseline = between-separators PLUS any structurally-mandatory flank',
						'  // anons: a mandatory-LEADING list consumes one anon per element (n),',
						'  // not n-1, so a lone captured separator on a single-element instance',
						'  // is the leading flank, not an extra trailing one.',
						'  const between = Math.max(content.length - 1, 0) + mandatoryAnons;',
						'  return otherCount > between;',
						'}'
					]
				: []),
			...(usesFilteredChildren
				? [
						...(supertypeMembers.size > 0
							? [
									'const SUPERTYPE_MEMBERS: Record<string, ReadonlySet<string>> = {',
									...Array.from(supertypeMembers.entries()).map(
										([k, v]) => `  ${JSON.stringify(k)}: new Set(${JSON.stringify(v)}),`
									),
									'};',
									''
								]
							: []),
						'function _wrapKindNameOf(entry: unknown): string | undefined {',
						'  if (!entry || typeof entry !== "object") return undefined;',
						'  const raw: unknown = _kindOf(entry as _NodeData);',
						'  if (raw === undefined) return undefined;',
						...(this.#kindEntries
							? ['  if (typeof raw === "number") return KIND_NAMES.get(raw as never) ?? String(raw);']
							: []),
						'  return typeof raw === "string" ? raw : undefined;',
						'}',
						''
					]
				: []),
			...(usesKeepModelledSlots
				? [
						'// The model is the wire contract: a `_<key>` the model has no slot for',
						'// (a reference to a literal — the grammar-agnostic reader still emits it)',
						'// never enters a wrapped node.',
						'function _keepModelledSlots<T extends object>(data: T, keys: readonly string[]): T {',
						'  const out: Record<string, unknown> = {};',
						'  for (const key of Object.keys(data)) {',
						'    if (key.charCodeAt(0) === 95 /* `_` */ && !keys.includes(key)) continue;',
						'    out[key] = (data as Record<string, unknown>)[key];',
						'  }',
						'  return out as T;',
						'}',
						''
					]
				: []),
			...(usesFilteredChildren
				? [
						'',
						'function _matchesAllowedWrapKind(kind: string, allowedKinds: readonly string[]): boolean {',
						'  if (allowedKinds.includes(kind)) return true;',
						'  const stripped = kind.startsWith("_") ? kind.slice(1) : undefined;',
						'  if (stripped && allowedKinds.includes(stripped)) return true;',
						'  for (const allowed of allowedKinds) {',
						...(supertypeMembers.size > 0
							? [
									'    const members = SUPERTYPE_MEMBERS[allowed] ?? SUPERTYPE_MEMBERS[allowed.startsWith("_") ? allowed.slice(1) : allowed];',
									'    if (members?.has(kind)) return true;',
									'    if (stripped !== undefined && members?.has(stripped)) return true;'
								]
							: []),
						'    const allowedStripped = allowed.startsWith("_") ? allowed.slice(1) : allowed;',
						'    if (allowedStripped === kind || (stripped !== undefined && allowedStripped === stripped)) return true;',
						'  }',
						'  return false;',
						'}',
						'',
						'// Kind-keyed child probe: the grammar-agnostic reader stores an',
						'// unlabeled named child under `_<childKind>` (read_node.rs kind-named',
						'// slots). A VISIBLE supertype occurrence (an enrich-minted alias like',
						'// `alias($._expression_except_range, $.expression_group1)`) therefore',
						'// carries its single member child as a kind-keyed property, NOT in',
						'// `$other` — probe those keys before falling back to the `$other` scan.',
						'function _firstKindKeyedWrapChild(data: object, allowedKinds: readonly string[]): unknown {',
						'  for (const key of Object.keys(data)) {',
						'    if (key.charCodeAt(0) !== 95 /* `_` */) continue;',
						'    const stripped = key.slice(1);',
						'    if (!_matchesAllowedWrapKind(stripped, allowedKinds) && !_matchesAllowedWrapKind(key, allowedKinds)) continue;',
						'    const value = (data as Record<string, unknown>)[key];',
						'    if (value !== undefined) return value;',
						'  }',
						'  return undefined;',
						'}',
						'',
						'function _filterWrapChildrenByKind<T>(value: readonly T[], allowedKinds: readonly string[]): readonly T[];',
						'function _filterWrapChildrenByKind<T>(value: T | readonly T[] | undefined, allowedKinds: readonly string[]): T | readonly T[] | undefined;',
						'function _filterWrapChildrenByKind<T>(value: T | readonly T[] | undefined, allowedKinds: readonly string[]): T | readonly T[] | undefined {',
						'  if (value == null) return undefined;',
						'  if (!Array.isArray(value)) {',
						'    const kind = _wrapKindNameOf(value);',
						'    if (kind === undefined) return value;',
						'    return _matchesAllowedWrapKind(kind, allowedKinds) ? value : undefined;',
						'  }',
						'  const entries = value;',
						'  return entries.filter((entry) => {',
						'    // Text-collapsed leaf elements (e.g. identifiers rendered as their',
						'    // $text string) survive the legacy readNode walker but carry no $type',
						'    // to classify. Keep them — the field tag already selected the slot\\u2019s',
						'    // content. Numeric separator kind-ids stay dropped (the template\\u2019s',
						'    // join re-adds separators).',
						'    if (typeof entry === "string") return true;',
						'    const kind = _wrapKindNameOf(entry);',
						'    if (kind === undefined) return false;',
						'    return _matchesAllowedWrapKind(kind, allowedKinds);',
						'  });',
						'}'
					]
				: []),
			...(usesWireDelimiter
				? [
						'',
						'// A wire delimiter is a field-tagged separator token: either its bare',
						'// numeric kind id (text-collapsed contexts) or an anonymous node stub',
						'// `{ $type: <id>, $named: false }` (node-stub contexts).',
						'type _WireDelimiter = number | { readonly $type: number; readonly $named: false };',
						'function _isWireDelimiter(e: unknown, separatorKindIds: readonly number[]): e is _WireDelimiter {',
						'  if (typeof e === "number") return separatorKindIds.includes(e);',
						'  if (typeof e === "object" && e !== null) {',
						'    const stub = e as { $type?: unknown; $named?: unknown };',
						'    return stub.$named === false && typeof stub.$type === "number" && separatorKindIds.includes(stub.$type);',
						'  }',
						'  return false;',
						'}',
						'',
						'function _dropOrderEntry(order: string[] | undefined, slot: string, occurrence: number): void {',
						'  if (order === undefined) return;',
						'  let seen = 0;',
						'  const at = order.findIndex((name) => name === slot && seen++ === occurrence);',
						'  if (at >= 0) order.splice(at, 1);',
						'}'
					]
				: []),
			...(usesDropWireDelimiters
				? [
						'',
						'// A delimiter the parser field-tagged into a slot is punctuation the',
						'// render body writes itself, so it is dropped rather than stored, and',
						'// its entry leaves the node\'s `$slotOrder` draft with it.',
						'// Assumes T itself is never an array type — slot elements are node unions.',
						'function dropWireDelimiters<T>(',
						'  value: T | readonly (T | _WireDelimiter)[] | undefined,',
						'  separatorKindIds: readonly number[],',
						'  order: string[] | undefined,',
						'  slot: string',
						'): T | readonly T[] | undefined {',
						'  const isSlotList = (v: T | readonly (T | _WireDelimiter)[]): v is readonly (T | _WireDelimiter)[] => Array.isArray(v);',
						'  if (value == null) return undefined;',
						'  if (!isSlotList(value)) {',
						'    if (!_isWireDelimiter(value, separatorKindIds)) return value;',
						'    _dropOrderEntry(order, slot, 0);',
						'    return undefined;',
						'  }',
						'  let kept = 0;',
						'  return value.filter((e): e is T => {',
						'    if (!_isWireDelimiter(e, separatorKindIds)) return (kept++, true);',
						'    _dropOrderEntry(order, slot, kept);',
						'    return false;',
						'  });',
						'}'
					]
				: []),
			...(usesSplitElided
				? [
						'',
						'// Elidable separated-list positions (array elision, `[a, , b]`): the',
						'// raw wire array interleaves element entries with the separator token.',
						'// Segment on those delimiters — each segment is one position holding',
						'// 0-or-1 element; an empty position stores `undefined`. Idempotent over',
						'// already-positional storage (a `$with` re-wrap carries no delimiters):',
						'// with no delimiter present every entry is its own position, `undefined`',
						'// holes intact.',
						'function splitElidedWrapSlot<T>(',
						'  value: T | readonly (T | _WireDelimiter | undefined)[] | undefined,',
						'  separatorKindIds: readonly number[],',
						'  allowedKinds: readonly string[] | undefined,',
						'  order: string[] | undefined,',
						'  slot: string',
						'): readonly (T | undefined)[] {',
						'  // Assumes T itself is never an array type — slot elements are node unions.',
						'  const isSlotList = (v: T | readonly (T | _WireDelimiter | undefined)[]): v is readonly (T | _WireDelimiter | undefined)[] => Array.isArray(v);',
						'  const items: readonly (T | _WireDelimiter | undefined)[] = value == null ? [] : isSlotList(value) ? value : [value];',
						'  if (items.length === 0) return [];',
						'  const isDelimiter = (e: unknown): e is _WireDelimiter => _isWireDelimiter(e, separatorKindIds);',
						'  const keepFirst = (seg: readonly (T | undefined)[]): T | undefined => {',
						'    const present = seg.filter((e): e is T => e !== undefined);',
						'    const kept = allowedKinds === undefined ? present : _filterWrapChildrenByKind(present, allowedKinds);',
						'    return kept.length > 0 ? kept[0] : undefined;',
						'  };',
						'  if (!items.some(isDelimiter)) {',
						'    return items.map((e) => (e === undefined || isDelimiter(e) ? undefined : keepFirst([e])));',
						'  }',
						'  const positions: (T | undefined)[] = [];',
						'  let segment: (T | undefined)[] = [];',
						'  let kept = 0;',
						'  for (const entry of items) {',
						'    if (isDelimiter(entry)) {',
						'      _dropOrderEntry(order, slot, kept);',
						'      positions.push(keepFirst(segment));',
						'      segment = [];',
						'    } else {',
						'      kept++;',
						'      segment.push(entry);',
						'    }',
						'  }',
						'  positions.push(keepFirst(segment));',
						'  return positions;',
						'}'
					]
				: []),
			''
		];
		lines.push(bodySource);

		const wrapTableKey = (kind: string, memberName: string): string =>
			this.#kindEntries ? `[TSKindId.${memberName}]` : `'${kind}'`;
		lines.push(
			this.#kindEntries
				? 'const _wrapTable: Record<number, (data: _NodeData, tree: TreeHandle) => unknown> = {'
				: 'const _wrapTable: Record<string, (data: _NodeData, tree: TreeHandle) => unknown> = {'
		);
		const rows = new Map<string, { row: string; exact: boolean }>();
		const claimRow = (tableKey: string, row: string, exact: boolean): void => {
			const existing = rows.get(tableKey);
			if (existing === undefined || (exact && !existing.exact)) rows.set(tableKey, { row, exact });
		};
		for (const [kind, node] of this.#nodeMap.nodes) {
			if (isSlotBearingCompound(node) || node instanceof AssembledSupertype) {
				if (!this.#emittedStructuralKinds.has(kind)) continue;
				const entry = this.#kindEntries ? findKindEntry(this.#kindEntries, kind) : undefined;
				if (this.#kindEntries && entry === undefined) {
					console.warn(
						`[codegen] wrap dispatch: '${kind}' resolves to no catalog entry — no numeric dispatch row emitted (no parser-issued $type can reach it)`
					);
					continue;
				}
				const memberName = entry?.member ?? node.typeName;
				if (node instanceof AssembledAlias) {
					if (entry === undefined || (entry.parseId ?? entry.id) !== node.aliasTypeId) {
						throw new Error(
							`emitWrap: alias envelope '${kind}' has no catalog entry for its type id ${node.aliasTypeId} — the reader stamps that id and nothing could dispatch it`
						);
					}
					rows.set(memberName, {
						row: `  ${wrapTableKey(kind, memberName)}: (d, t) => wrap${node.typeName}(_aliasEnvelope(d, t) as unknown as T.${node.typeName}, t),`,
						exact: true
					});
					continue;
				}
				claimRow(
					this.#kindEntries ? memberName : kind,
					`  ${wrapTableKey(kind, memberName)}: (d, t) => wrap${node.typeName}(d as unknown as T.${node.typeName}, t),`,
					entry !== undefined && entry.kind === kind
				);
			} else if (node.modelType === 'pattern' || node.modelType === 'enum' || isBuilderTextLeaf(node)) {
				if (!node.factoryName) continue;
				if (this.#kindEntries) {
					const entry = findKindEntry(this.#kindEntries, kind);
					if (entry === undefined) continue;
					claimRow(
						entry.member,
						`  [TSKindId.${entry.member}]: (d) => ({ ..._spelledLeaf(d), $type: TSKindId.${entry.member} as const }),`,
						entry.kind === kind
					);
				} else {
					claimRow(kind, `  '${kind}': (d) => _spelledLeaf(d),`, true);
				}
			}
		}
		for (const { row } of rows.values()) lines.push(row);
		lines.push('};');
		lines.push('');
		if ([...this.#nodeMap.nodes.values()].some((node) => node instanceof AssembledAlias)) {
			lines.push(
				'function _aliasEnvelope(data: _NodeData, tree: TreeHandle): _NodeData {',
				'  type Wire = _NodeData & {',
				'    readonly $displayType?: number;',
				'    readonly $handle?: number;',
				'    readonly $parentHandle?: number;',
				'    readonly $treeHandle?: number;',
				'    readonly $childIndex?: number;',
				'    readonly $span?: unknown;',
				'  };',
				'  const { $displayType, ...shown } = data as Wire;',
				'  if ($displayType === undefined) return data;',
				"  const envelope = $displayType as _NodeData['$type'];",
				'  if (_HIDDEN_KINDS.has(shown.$type)) {',
				'    const slots = Object.keys(shown).filter((key) => key.charCodeAt(0) === 95);',
				"    if (slots.length !== 1 || slots[0] === '_content') return { ...shown, $type: envelope } as _NodeData;",
				'    const { [slots[0]!]: child, ...container } = shown as unknown as Record<string, unknown>;',
				'    return { ...container, $type: envelope, _content: child } as unknown as _NodeData;',
				'  }',
				'  const full = (',
				'    isStub(shown) ? readNode(tree, shown.$parentHandle, shown.$childIndex) : shown',
				'  ) as Wire;',
				'  const { $displayType: _display, $_trivia, $childIndex: _childIndex, ...storage } = full;',
				'  return {',
				'    $type: envelope,',
				'    $source: shown.$source,',
				'    $named: shown.$named,',
				'    $span: shown.$span,',
				'    $handle: shown.$handle,',
				'    $parentHandle: shown.$parentHandle,',
				'    $treeHandle: shown.$treeHandle,',
				'    $childIndex: shown.$childIndex,',
				'    $_trivia: shown.$_trivia ?? _wrapTrivia($_trivia, tree),',
				'    _content: storage',
				'  } as unknown as _NodeData;',
				'}',
				''
			);
		}
		if (this.#kindEntries) {
			if (this.#rootKind !== undefined) {
				const rootEntry = findKindEntry(this.#kindEntries, this.#rootKind);
				if (rootEntry === undefined || !rows.has(rootEntry.member)) {
					throw new Error(
						`emitWrap: root kind '${this.#rootKind}' has no wrap-table row — cannot name the wrapped root surface`
					);
				}
				this.#rootTreeTypeName = `${rootEntry.member}Tree`;
				lines.push('/** The wrapped root of a whole-source parse — what `engine.parse()` returns. */');
				lines.push(
					`export type ${this.#rootTreeTypeName} = T.ParsedByKindId[TSKindId.${rootEntry.member}] & ParsedRoot;`
				);
				lines.push('');
			}
		}

		lines.push('function _drillUnknownKindChildren(data: _NodeData, tree: TreeHandle): _NodeData {');
		lines.push('  const out: Record<string, unknown> = { ...(data as unknown as Record<string, unknown>) };');
		lines.push('  for (const key of Object.keys(out)) {');
		lines.push('    if (key.charCodeAt(0) !== 95 /* `_` */) continue;');
		lines.push('    const value = out[key];');
		lines.push('    if (Array.isArray(value)) {');
		lines.push('      out[key] = expandChildren(value, tree);');
		lines.push('    } else if (value != null) {');
		lines.push('      out[key] = expandChild(value, tree);');
		lines.push('    }');
		lines.push('  }');
		lines.push('  return out as unknown as _NodeData;');
		lines.push('}');
		lines.push('');

		lines.push("function _wrapTrivia(trivia: _NodeData['$_trivia'], tree: TreeHandle): _NodeData['$_trivia'] {");
		lines.push(
			'  return trivia && mapTriviaEntries(trivia, (entries) => expandChildren(entries, tree) as unknown as typeof entries);'
		);
		lines.push('}');
		lines.push('');

		lines.push(...this.#aliasIdentityLines());
		lines.push(...this.#dropSpellingLines());
		lines.push('/** Wrap a NodeData into its lazy read-only view. */');
		if (this.#kindEntries) {
			lines.push('export function wrapNode<D extends _NodeData & { readonly $type: keyof T.ParsedByKindId }>(');
			lines.push('  data: D,');
			lines.push('  tree: TreeHandle');
			lines.push(
				"): T.ParsedByKindId[D['$type'] & keyof T.ParsedByKindId] & Pick<D, Extract<keyof D, keyof ParsedRoot>>;"
			);
			lines.push('export function wrapNode(data: _NodeData, tree: TreeHandle): unknown;');
		}
		lines.push('export function wrapNode(data: _NodeData, tree: TreeHandle): unknown {');
		if (this.#kindEntries) {
			lines.push('  // The wire `$type` is the numeric grammar-symbol KindId — dispatch');
			lines.push('  // is a direct id-keyed lookup. A non-numeric `$type` can only be a');
			lines.push('  // catalog-less kind (the deprecated JS diagnostic lane stamps those');
			lines.push('  // as strings), which never had a table entry to reach.');
			lines.push('  const type = _kindOf(data);');
			lines.push('  const fn = typeof type === "number" ? _wrapTable[type] : undefined;');
			lines.push('  const own = _dropSpelling(type === data.$type ? _withoutDisplay(data) : data);');
		} else {
			lines.push('  const rawType = data.$type as unknown as string;');
			lines.push('  const fn = _wrapTable[rawType];');
			lines.push('  const own = _dropSpelling(data);');
		}
		lines.push(
			'  const shown = own.$_trivia == null ? own : { ...own, $_trivia: _wrapTrivia(own.$_trivia, tree) };'
		);
		lines.push('  return inTreeEngine(tree, () => (fn ? fn(shown, tree) : _drillUnknownKindChildren(shown, tree)));');
		lines.push('}');
		lines.push('');
		lines.push('/**');
		lines.push(' * Read a parsed tree node into a lazily-wrapped NodeData.');
		lines.push(' * One level deep — getters expand into subtrees on demand by');
		lines.push(' * recursing back through this same function. The wire `$type` is');
		lines.push(' * the grammar symbol (stamped by the read), so no per-site alias');
		lines.push(' * rewriting exists between the read and the wrap.');
		lines.push(' */');
		lines.push('export function projectNode(');
		lines.push('  tree: TreeHandle,');
		lines.push('  handle?: number,');
		lines.push('  childIndex?: number,');
		lines.push('  depth?: number,');
		lines.push('): unknown {');
		lines.push('  return wrapNode(readNode(tree, handle, childIndex, depth), tree);');
		lines.push('}');
		lines.push('');

		return pruneUnusedImports(lines, [
			'AnyNodeData',
			'Delimiter',
			'projectInterior',
			'TokenInterior',
			'TOKEN_INTERIORS',
			'coerceBooleanKeywordStorage',
			'coerceBitflagStorage',
			'withListView',
			'withListSlots',
			'withGroupSeat',
			'withElementsSeat',
			'FR',
			'RAW',
			'SupertypeSurface'
		]).join('\n');
	}
}

function separatorDefaultSuffix(separatorDefault: string | undefined): string {
	return separatorDefault === undefined ? '' : ` ?? ${separatorDefault}`;
}
