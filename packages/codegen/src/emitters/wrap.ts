import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import type { AssembledBranch, AssembledEnvelope, AssembledPolymorph } from '../compiler/model/node-map.ts';
import {
	AssembledEnum,
	AssembledSupertype,
	AssembledList,
	AssembledKeyword,
	AssembledNonterminal,
	valueParseKindsOf,
	valueParseLabelsOf
} from '../compiler/model/node-map.ts';
import type { Rule } from '../types/rule.ts';

type BranchLikeForWrap = AssembledBranch | AssembledEnvelope | AssembledPolymorph;
import { deriveUnnamedChildrenCardinality } from '../compiler/model/node-map.ts';
import { buildSupertypeMembersMap } from '../compiler/model/supertype-members.ts';

import {
	collectAliasTargetToSourceMap,
	hasOptionalElements,
	isMultiple,
	isNonEmpty,
	isRequired,
	resolveFieldStorageInfo,
	wrapExposesChildren,
	classifyWrapEmission,
	isSlotBearingCompound,
	warnSkippedParserSymbol,
	canonicalSeparatedListField,
	kindEnumTextIdPairs,
	kindEnumAltIdPairs,
	fieldTypeComponents
} from './shared.ts';
import { fieldElementType, childElementType, childrenSetterRestType } from './factories.ts';
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
function expandToConcreteParseKinds(names: readonly string[], nodeMap: NodeMap): string[] {
	const expanded: string[] = [];
	const seen = new Set<string>();
	function add(name: string): void {
		const normalized = name.startsWith('_') ? name.slice(1) : name;
		if (seen.has(normalized)) return;
		seen.add(normalized);
		expanded.push(normalized);
	}
	for (const name of names) {
		const normalized = name.startsWith('_') ? name.slice(1) : name;
		const node = nodeMap.nodes.get(name) ?? nodeMap.nodes.get(normalized);
		if (!(node instanceof AssembledSupertype)) {
			add(name);
			continue;
		}
		for (const v of node.transitiveParseKinds ?? []) {
			const parseName = v.parseKind?.name;
			if (parseName !== undefined) add(parseName);
		}
	}
	return expanded;
}

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

function renameUnusedTreeParam(source: string): string {
	const header = source.match(/^export function wrap\w+\(data: .*, tree: TreeHandle\) \{$/m)?.[0];
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

	export function group(
		output: string[],
		node: BranchLikeForWrap,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
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
	readonly candidateStorageKeys?: readonly string[];
	readonly reclaimKindIdsExpr?: string;
	readonly kindEnumTextIdPairs?: readonly (readonly [string, number])[];
	readonly kindEnumAltIdPairs?: readonly (readonly [number, number])[];
	readonly forceUnknownElement?: boolean;
	readonly elidedSeparatorIdsExpr?: string;
}

function resolveSlotDrillExprs(
	slot: SlotModel,
	config: ResolveSlotDrillConfig
): {
	storeExpr: string;
	accessorBody: string;
} {
	const slotStoreExpr = resolveSlotStoreExpr(
		slot,
		config.dataExpr,
		config.candidateStorageKeys,
		config.forceUnknownElement
	);
	if (config.elidedSeparatorIdsExpr !== undefined && slot.arity === 'many') {
		const allowedArg =
			config.allowedKinds && config.allowedKinds.length > 0 ? JSON.stringify(config.allowedKinds) : 'undefined';
		return {
			storeExpr: `splitElidedWrapSlot(${slotStoreExpr}, ${config.elidedSeparatorIdsExpr}, ${allowedArg})`,
			accessorBody: resolveSlotAccessorBody(slot, `${config.elemType} | undefined`)
		};
	}
	const filteredStoreExpr =
		config.allowedKinds && config.allowedKinds.length > 0
			? `_filterWrapChildrenByKind(${slotStoreExpr}, ${JSON.stringify(config.allowedKinds)})`
			: slotStoreExpr;
	const diagnosticContextExpr = `{ tree, nodeType: ${config.dataExpr}.$type, slotName: ${JSON.stringify(slot.name)}, span: (${config.dataExpr} as _NodeData).$span }`;
	const reclaimedStoreExpr =
		config.storageInfo?.kind === 'kindEnum' && config.reclaimKindIdsExpr
			? `(${filteredStoreExpr} ?? readTerminalFromOther(${config.dataExpr}, ${config.reclaimKindIdsExpr}))`
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
		return {
			storeExpr: projectionArgs
				? `projectMixedEnumStorage(${normalizedStoreExpr}${projectionArgs})`
				: normalizedStoreExpr,
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

function collectConcreteStorageKeys(slot: AssembledNonterminal, nodeMap: NodeMap): readonly string[] | undefined {
	if (!slot.isUnnamed) return undefined;
	const labelNames = valueParseLabelsOf(slot);
	const kindNames = valueParseKindsOf(slot).filter((k) => !labelNames.includes(k));
	if (labelNames.length === 0 && kindNames.length === 0) return undefined;
	const concrete = kindNames.length > 0 ? expandToConcreteParseKinds(kindNames, nodeMap) : [];
	if (labelNames.length === 0 && concrete.length === 0) return undefined;
	const storageKeys = [...new Set([...labelNames, ...concrete].map((k) => `_${k}`))];
	const legacyKey = `_${slot.name}`;
	if (storageKeys.length === 1 && storageKeys[0] === legacyKey) {
		return undefined;
	}
	return storageKeys;
}

function computeConsumedCandidateKeys(slots: readonly AssembledNonterminal[], nodeMap: NodeMap): readonly string[] {
	const canonicalStorageKeys = new Set(slots.map((f) => f.storageKey));
	return [
		...new Set(
			slots.flatMap((f) => (collectConcreteStorageKeys(f, nodeMap) ?? []).filter((k) => !canonicalStorageKeys.has(k)))
		)
	].sort();
}

function collectWrapWireKeyTypes(
	slots: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): ReadonlyMap<string, string> {
	const canonicalKeys = new Set(slots.map((f) => f.storageKey));
	const keyTypes = new Map<string, string>();
	for (const f of slots) {
		const candidates = collectConcreteStorageKeys(f, nodeMap);
		if (!candidates) continue;
		const elemType = fieldElementType(f, nodeMap, kindEntries);
		const candidateType =
			f.arity === 'many'
				? `${elemType} | readonly ${elemType.includes(' | ') ? `(${elemType})` : elemType}[]`
				: elemType;
		for (const k of candidates) {
			if (k === f.storageKey || canonicalKeys.has(k)) continue;
			const existing = keyTypes.get(k);
			keyTypes.set(
				k,
				existing === undefined || existing === candidateType ? candidateType : `${existing} | ${candidateType}`
			);
		}
	}
	return keyTypes;
}

function buildWrapParamType(typeName: string, wireKeyTypes: ReadonlyMap<string, string>, otherType?: string): string {
	if (wireKeyTypes.size === 0 && otherType === undefined) return `T.${typeName}`;
	const members = [
		...[...wireKeyTypes].map(([k, t]) => `readonly ${JSON.stringify(k)}?: ${t};`),
		...(otherType !== undefined ? [`readonly $other?: ${otherType};`] : [])
	];
	return `T.${typeName} & { ${members.join(' ')} }`;
}

const SAFE_IDENT_KEY = /^_[A-Za-z_$][A-Za-z0-9_$]*$/;

function dataAccessExpr(dataExpr: string, storageKey: string): string {
	if (SAFE_IDENT_KEY.test(storageKey)) {
		return `${dataExpr}.${storageKey}`;
	}
	return `${dataExpr}[${JSON.stringify(storageKey)}]`;
}

function resolveSlotStoreExpr(
	slot: SlotModel,
	dataExpr: string,
	candidateKeys?: readonly string[],
	forceUnknownElement?: boolean
): string {
	if (candidateKeys && candidateKeys.length > 0) {
		const candidates = candidateKeys.filter((k) => k !== slot.storageKey);
		const canonicalExpr = dataAccessExpr(dataExpr, slot.storageKey);

		if (slot.arity === 'many') {
			const sources = candidates.map(
				(k) => `[${JSON.stringify(k.startsWith('_') ? k.slice(1) : k)}, ${dataAccessExpr(dataExpr, k)}]`
			);
			const concatTypeArg = forceUnknownElement ? '<unknown>' : '';
			const candidateExpr =
				sources.length > 0
					? `_interleaveBySlotOrder${concatTypeArg}(${dataExpr} as _NodeData, [${sources.join(', ')}])`
					: '[]';
			return `(${canonicalExpr} !== undefined ? _toArr(${canonicalExpr}) : ${candidateExpr})`;
		}

		const probes = [canonicalExpr, ...candidates.map((k) => dataAccessExpr(dataExpr, k))];
		return `(${probes.join(' ?? ')})`;
	}
	return dataAccessExpr(dataExpr, slot.storageKey);
}

function resolveSlotAccessorBody(slot: SlotModel, valueType: string): string {
	if (slot.arity === 'many') {
		const arrayElemType = valueType.includes(' | ') ? `(${valueType})` : valueType;
		return `return drillInAll<${valueType}>(this.${slot.storageKey} as readonly ${arrayElemType}[] | undefined, tree)`;
	}
	return `return drillIn<${valueType}>(this.${slot.storageKey}, tree)`;
}

function emitTransparentSupertypeWrap(node: AssembledSupertype): string {
	const fn = `wrap${node.typeName}`;
	const allowedKinds = [
		...new Set(node.subtypeNames.flatMap((kind) => (kind.startsWith('_') ? [kind, kind.slice(1)] : [kind])))
	];
	const paramType = buildWrapParamType(node.typeName, new Map(), `T.${node.typeName} | readonly T.${node.typeName}[]`);
	return [
		`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`,
		`  if (typeof data === 'number') return data;`,
		`  data = _keepModelledSlots(data, ${JSON.stringify(allowedKinds.map((k) => `_${k}`))});`,
		`  const kindKeyed = _firstKindKeyedWrapChild(data, ${JSON.stringify(allowedKinds)}) as T.${node.typeName} | readonly T.${node.typeName}[] | undefined;`,
		`  const filtered = kindKeyed ?? _filterWrapChildrenByKind(data.$other, ${JSON.stringify(allowedKinds)});`,
		`  if (filtered === undefined && typeof (data as _NodeData).$text === 'string') {`,
		`    return drillInSelf<T.${node.typeName}>(data as T.${node.typeName}, tree);`,
		`  }`,
		`  return drillIn<T.${node.typeName}>(normalizeSingularWrapSlot(filtered, "children", true, data.$type, { tree, nodeType: data.$type, slotName: "children", span: (data as _NodeData).$span }), tree);`,
		`}`
	].join('\n');
}

export function collectSeparatorCandidateKindNames(rule: Rule<'link'>): string[] {
	switch (rule.type) {
		case 'STRING':
			return [rule.value];
		case 'SYMBOL':
			return [rule.name];
		case 'CHOICE':
			return rule.members.flatMap((m) => collectSeparatorCandidateKindNames(m));
		case 'OPTIONAL':
			return collectSeparatorCandidateKindNames(rule.content);
		default:
			throw new Error(
				`collectSeparatorCandidateKindNames: unhandled separator rule shape '${rule.type}' — ` +
					`extend this walk to resolve its kind-discriminant leaves before this kind can emit ` +
					`_separator.`
			);
	}
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

function isFieldBackedSeparatedList(node: AssembledList): boolean {
	return (node.simplifiedRule as { fieldName?: string }).fieldName !== undefined;
}

function collectSeparatedListContentStorageKeys(
	contentSlot: AssembledNonterminal,
	nodeMap: NodeMap,
	fieldBacked: boolean
): readonly string[] {
	if (fieldBacked) return [];
	const parseKinds = valueParseKindsOf(contentSlot);
	if (parseKinds.length === 0) return [];
	const concrete = expandToConcreteParseKinds(parseKinds, nodeMap);
	const armFieldNames = contentSlot.values.map((v) => v.parseName).filter((n): n is string => n !== undefined);
	return [...new Set([...armFieldNames.map((n) => `_${n}`), ...concrete.map((k) => `_${k}`)])];
}

function collectSeparatedListWireKeyTypes(
	contentSlot: AssembledNonterminal,
	canonicalField: AssembledNonterminal,
	canonicalKeys: ReadonlySet<string>,
	fallbackStorageKey: string,
	nodeMap: NodeMap,
	fieldBacked: boolean,
	kindEntries?: readonly KindEnumEntry[]
): ReadonlyMap<string, string> {
	const candidates = collectSeparatedListContentStorageKeys(contentSlot, nodeMap, fieldBacked);
	const elemType = fieldElementType(canonicalField, nodeMap, kindEntries);
	const keyTypes = new Map<string, string>();
	for (const k of candidates) {
		if (canonicalKeys.has(k)) continue;
		keyTypes.set(k, elemType);
	}
	if (!canonicalKeys.has(fallbackStorageKey)) keyTypes.set(fallbackStorageKey, elemType);
	return keyTypes;
}

function buildSeparatedListWrapParamType(typeName: string, wireKeyTypes: ReadonlyMap<string, string>): string {
	const members = [
		...[...wireKeyTypes].map(([k, t]) => `readonly ${JSON.stringify(k)}?: ${t};`),
		"readonly $other?: _NodeData['$other'];",
		'readonly $span?: { start: number; end: number };'
	];
	return `T.${typeName} & { ${members.join(' ')} }`;
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
	const fieldBacked = isFieldBackedSeparatedList(node);
	const wireKeyTypes = collectSeparatedListWireKeyTypes(
		contentSlot,
		canonical,
		canonicalKeys,
		canonical.storageKey,
		nodeMap,
		fieldBacked,
		kindEntries
	);
	const paramType = buildSeparatedListWrapParamType(node.typeName, wireKeyTypes);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`);
	lines.push(
		`  data = _keepModelledSlots(data, ${JSON.stringify([...new Set([...canonicalKeys, ...wireKeyTypes.keys()])])});`
	);
	if (wrapsAnonLiteralContent(node.slots, nodeMap)) {
		lines.push(
			`  if (_isReadTextLeaf(data)) return withMethods({ ...data${wrapTextLeafTypeStamp(node, kindEntries)} }, _treeEngine(tree));`
		);
	}

	const storageInfo = resolveFieldStorageInfo(contentSlot, nodeMap, kindEntries);
	const candidateStorageKeys = collectSeparatedListContentStorageKeys(contentSlot, nodeMap, fieldBacked);
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
		candidateStorageKeys: candidateStorageKeys.length > 0 ? candidateStorageKeys : undefined,
		forceUnknownElement: node.slots.length > 1
	});
	lines.push(`  const _content = ${storeExpr};`);
	lines.push('  return withMethods({');
	const consumedCandidateKeys = computeConsumedCandidateKeys(node.slots, nodeMap);
	if (consumedCandidateKeys.length > 0) {
		lines.push(`    ..._omitWrapKeys(data, ${JSON.stringify(consumedCandidateKeys)}),`);
	} else {
		lines.push('    ...data,');
	}
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
		const candidateKindNames = collectSeparatorCandidateKindNames(node.separatorRule);
		const candidateExprs = candidateKindNames
			.filter((k) => hasCatalogEntry(kindEntries, k))
			.map((k) => kindDiscriminantExpr(k, nodeMap, kindEntries));
		lines.push(`    _separator: _separatorKindOf(data, [${candidateExprs.join(', ')}]),`);
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
		emitFieldAccessorLines(node.slots, 'data', lines, kindEntries, nodeMap);
	} else {
		lines.push(`    ${canonical.propertyName}() { ${accessorBody}; },`);
	}
	lines.push('    $with: {},');
	lines.push('  }, _treeEngine(tree));');
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
		if (storageInfo.kind !== 'kindEnum') continue;
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
			`[codegen] reclaim-ambiguous: kind '${ownerKind}' has kindEnum slots ` +
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
		const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);
		const allowedKinds =
			storageInfo.kind === 'verbatim' && hasSeparatorMetadata
				? [...new Set([...deriveChildrenKinds(f, nodeMap), ...valueParseKindsOf(f)])]
				: undefined;
		const candidateStorageKeys = collectConcreteStorageKeys(f, nodeMap);
		const reclaimKindIdsExpr =
			storageInfo.kind === 'kindEnum'
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
		const { storeExpr } = resolveSlotDrillExprs(f, {
			dataExpr,
			elemType: fieldElementType(f, nodeMap, kindEntries),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			storageInfo,
			allowedKinds,
			candidateStorageKeys,
			reclaimKindIdsExpr,
			kindEnumTextIdPairs:
				storageInfo.kind === 'kindEnum' || storageInfo.kind === 'mixedEnum'
					? kindEnumTextIdPairs(f, nodeMap, kindEntries)
					: undefined,
			kindEnumAltIdPairs:
				storageInfo.kind === 'kindEnum' || storageInfo.kind === 'mixedEnum'
					? kindEnumAltIdPairs(f, nodeMap)
					: undefined,
			elidedSeparatorIdsExpr: elidedSeparatorIdsExprOf(f, kindEntries)
		});
		lines.push(`    ${f.storageKey}: ${storeExpr},`);
	}
}

function elidedSeparatorIdsExprOf(
	f: AssembledNonterminal,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	if (!hasOptionalElements(f) || !kindEntries) return undefined;
	const sepTexts = [
		...new Set(
			f.values.filter((v) => v.optionalElement === true && v.separator !== undefined).map((v) => v.separator as string)
		)
	];
	if (sepTexts.length === 0) return undefined;
	return `[${sepTexts.map((text) => kindDiscriminantExprForLiteral(text, kindEntries)).join(', ')}]`;
}

function emitFieldAccessorLines(
	slots: readonly AssembledNonterminal[],
	dataExpr: string,
	lines: string[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap
): void {
	for (const f of slots) {
		const propName = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);
		const allowedKinds =
			storageInfo.kind === 'verbatim' && hasSeparatorMetadata
				? [...new Set([...deriveChildrenKinds(f, nodeMap), ...valueParseKindsOf(f)])]
				: undefined;
		const { accessorBody } = resolveSlotDrillExprs(f, {
			dataExpr,
			elemType: fieldElementType(f, nodeMap, kindEntries),
			required: isRequired(f),
			nonEmpty: isNonEmpty(f),
			storageInfo,
			allowedKinds,
			elidedSeparatorIdsExpr: elidedSeparatorIdsExprOf(f, kindEntries)
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
	const wireKeyTypes = collectWrapWireKeyTypes(slots, nodeMap, kindEntries);
	const needsOther = children.length > 0;
	const paramType = buildWrapParamType(node.typeName, wireKeyTypes, needsOther ? "_NodeData['$other']" : undefined);
	lines.push(`export function ${fn}(data: ${paramType}, tree: TreeHandle) {`);
	lines.push(
		`  data = _keepModelledSlots(data, ${JSON.stringify([...new Set([...slots.map((f) => f.storageKey), ...wireKeyTypes.keys()])])});`
	);
	if (wrapsAnonLiteralContent(slots, nodeMap)) {
		lines.push(
			`  if (_isReadTextLeaf(data)) return withMethods({ ...data${wrapTextLeafTypeStamp(node, kindEntries)} }, _treeEngine(tree));`
		);
	}

	const hasWithSetters = node.rawFactoryName && (slots.length > 0 || children.length > 0);

	if (hasWithSetters) {
		lines.push('  const _node = withMethods({');
	} else {
		lines.push('  return withMethods({');
	}
	const consumedCandidateKeys = computeConsumedCandidateKeys(slots, nodeMap);
	if (consumedCandidateKeys.length > 0) {
		lines.push(`    ..._omitWrapKeys(data, ${JSON.stringify(consumedCandidateKeys)}),`);
	} else {
		lines.push('    ...data,');
	}
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

	emitFieldAccessorLines(slots, 'data', lines, kindEntries, nodeMap);
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

	lines.push('  }, _treeEngine(tree));');
	if (hasWithSetters) {
		lines.push('  return _node;');
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

	lines.push('    $with: {');
	for (const f of slots) {
		const method = f.propertyName;
		const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
		if (isMultiple(f) && !storageInfo.collapsesMultiplicity) {
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
				? ['import type {', ...[...typeImports].sort().map((name) => `  ${name},`), "} from './types.js';"].join('\n')
				: undefined;
	}

	emitBranch(node: BranchLikeForWrap): void {
		wrap.branch(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
	}

	emitGroup(node: BranchLikeForWrap): void {
		wrap.group(this.#output, node, this.#kindEntries, this.#nodeMap);
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
				if (node.hoisted) this.emitGroup(node);
				else this.emitBranch(node);
				break;
			case 'polymorph':
				if (node.hoisted) this.emitGroup(node);
				else this.emitBranch(node);
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

	finalize(): string {
		const bodyLines: string[] = [];
		for (const source of this.#output) {
			bodyLines.push(source);
			bodyLines.push('');
		}
		const bodySource = bodyLines.join('\n');
		const usesDrillIn = true;
		const usesDrillInAll = true;
		const usesProjectKindEnum = /\bprojectKindEnumStorage\b/.test(bodySource);
		const usesProjectMixedEnum = /\bprojectMixedEnumStorage\b/.test(bodySource);
		const usesSeparatorKindOf = /\b_separatorKindOf\b/.test(bodySource);
		const usesReadTerminalFromOther = /\breadTerminalFromOther\b/.test(bodySource) || usesSeparatorKindOf;
		const usesHasSeparatorFlank = /\b_hasSeparatorFlank\b/.test(bodySource);
		const usesCoerceBoolean = /\bcoerceBooleanKeywordStorage\b/.test(bodySource);
		const usesCoerceBitflag = /\bcoerceBitflagStorage\b/.test(bodySource);
		const usesSplitElided = /\bsplitElidedWrapSlot\b/.test(bodySource);
		const usesFilteredChildren = /\b_filterWrapChildrenByKind\b/.test(bodySource) || usesSplitElided;
		const usesNormalizeSingular = /\bnormalizeSingularWrapSlot\b/.test(bodySource);
		const usesNormalizeRepeated = /\bnormalizeRepeatedWrapSlot\b/.test(bodySource);
		const usesInterleaveBySlotOrder = /\b_interleaveBySlotOrder\b/.test(bodySource);
		const usesConcatInSourceOrder = /\b_concatInSourceOrder\b/.test(bodySource) || usesInterleaveBySlotOrder;
		const usesToArr = /\b_toArr\b/.test(bodySource) || usesConcatInSourceOrder;
		const usesOmitWrapKeys = /\b_omitWrapKeys\b/.test(bodySource);
		const usesKeepModelledSlots = /\b_keepModelledSlots\b/.test(bodySource);
		const usesIsReadTextLeaf = /\b_isReadTextLeaf\b/.test(bodySource);
		const usesFieldResolvers = /\bFR\./.test(bodySource);
		const supertypeMembers = buildSupertypeMembersMap(this.#nodeMap);
		const utilsImports = [
			'withMethods',
			'methodsEngine',
			...(usesCoerceBoolean ? ['coerceBooleanKeywordStorage'] : []),
			...(usesCoerceBitflag ? ['coerceBitflagStorage'] : [])
		];

		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'// Lazy view layer over readNode output — shape A surface.',
			'',
			"import { readNode as readNodeJs, toTransportData, markEdited as $edited } from '@sittir/common';",
			"import type { TreeHandle } from '@sittir/common';",
			"import type { ParsedRoot } from '@sittir/common/engine';",
			'// Import _NodeData (== AnyNodeData) from @sittir/types',
			'// instead of re-declaring locally. Single source of truth.',
			"import type { AnyNodeData as _NodeData, AnyNodeData, NonEmptyArray } from '@sittir/types';",
			...(this.#kindEntries ? ["import { TSKindId, KIND_NAMES } from './types.js';"] : []),
			"import { Delimiter } from './types.js';",
			"import type * as T from './types.js';",
			...(this.#typeImportLine ? [this.#typeImportLine] : []),
			`import { ${utilsImports.join(', ')} } from './utils.js';`,
			...(usesFieldResolvers ? ["import * as FR from './factories/coerce.js';"] : []),
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
			...(usesOmitWrapKeys
				? [
						'// Drop CONSUMED raw candidate storage keys from the spread base. A',
						'// field whose `??`-chain reads concrete kind-keyed wire keys',
						'// (`_binary_expression`, …) copies the winner into its canonical',
						'// `_<name>` key — leaving the raw stub on the object gives generic',
						'// key-walkers (the validator deep walk dedupes candidates by node',
						'// coords) a never-wrap-dispatched shadow copy that can win by',
						'// Object.keys insertion order and mask the canonical one (the',
						'// deep-read Missing-field class). Copy-on-first-delete keeps the',
						'// no-candidate fast path allocation-free.',
						'function _omitWrapKeys<T extends object>(data: T, keys: readonly string[]): T {',
						'  let out: T = data;',
						'  for (const key of keys) {',
						'    if (key in out) {',
						'      if (out === data) out = { ...data };',
						'      delete (out as Record<string, unknown>)[key];',
						'    }',
						'  }',
						'  return out;',
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
			...(usesConcatInSourceOrder
				? [
						'// _concatInSourceOrder — concatenate the per-kind wire arrays of a',
						'// repeated heterogeneous-union slot, then STABLE-sort by CST position.',
						'// The native reader buckets repeated unfielded children by kind, so a',
						'// plain declaration-order concat loses cross-kind source order. Each',
						'// node stub carries `$span.start` (byte offset) / `$childIndex` (position',
						'// in parent); sort on those to restore order. Text-collapsed scalar',
						'// leaves lack both → sorted to the end, stable among themselves (so a',
						'// homogeneous single-bucket slot is a no-op).',
						'function _concatInSourceOrder<T>(parts: readonly (T | readonly T[] | undefined)[]): readonly T[] {',
						'  const flat = parts.flatMap((p) => _toArr(p));',
						'  const pos = (e: T): number => {',
						'    const n = e as unknown as { $span?: { start?: number }; $childIndex?: number };',
						'    return n?.$span?.start ?? n?.$childIndex ?? Number.MAX_SAFE_INTEGER;',
						'  };',
						'  return flat',
						'    .map((e, i) => [e, i] as const)',
						'    .sort(([a, ai], [b, bi]) => pos(a) - pos(b) || ai - bi)',
						'    .map(([e]) => e);',
						'}'
					]
				: []),
			...(usesInterleaveBySlotOrder
				? [
						'// _interleaveBySlotOrder — reassemble a repeated heterogeneous-union',
						"// slot's per-route wire buckets into document order by walking the",
						"// parent's `$slotOrder` stamp (route names in child order, emitted by",
						'// the native reader on multi-bucket parents) with a cursor per bucket.',
						'// Text-collapsed scalar leaves carry no `$span`, so a position sort',
						'// cannot order them — the stamp is the only cross-bucket order source.',
						'// Nodes without the stamp (older captures) fall back to the position',
						'// sort; elements the stamp does not cover are appended in bucket order',
						'// so a mismatch never drops members.',
						'function _interleaveBySlotOrder<T>(',
						'  data: { readonly $slotOrder?: readonly string[] },',
						'  pairs: readonly (readonly [string, T | readonly T[] | undefined])[]',
						'): readonly T[] {',
						'  const order = data.$slotOrder;',
						'  if (!Array.isArray(order)) return _concatInSourceOrder(pairs.map(([, v]) => v));',
						'  const buckets = new Map<string, readonly T[]>();',
						'  for (const [route, value] of pairs) {',
						'    if (value === undefined) continue;',
						'    buckets.set(route, _toArr(value));',
						'  }',
						'  const cursors = new Map<string, number>();',
						'  const out: T[] = [];',
						'  for (const route of order) {',
						'    const bucket = buckets.get(route);',
						'    if (!bucket) continue;',
						'    const i = cursors.get(route) ?? 0;',
						'    if (i < bucket.length) {',
						'      out.push(bucket[i] as T);',
						'      cursors.set(route, i + 1);',
						'    }',
						'  }',
						'  for (const [route, bucket] of buckets) {',
						'    for (let i = cursors.get(route) ?? 0; i < bucket.length; i++) out.push(bucket[i] as T);',
						'  }',
						'  return out;',
						'}'
					]
				: []),
			"// The wrap layer's method engine. A wrapped node carries accessor",
			'// methods over storage the reader spelled its own way, so',
			'// `$render`/`$toEdit` project it to plain data first — routing every',
			'// level that carries storage back through `wrapNode`, which reconciles',
			'// slot names and arity. An unexpanded stub carries no storage, so it',
			'// passes through and the transport reproduces its own text verbatim.',
			'// One engine per tree — the closure is the only per-tree state.',
			'const _treeEngines = new WeakMap<TreeHandle, typeof methodsEngine>();',
			'function _treeEngine(tree: TreeHandle): typeof methodsEngine {',
			'  let engine = _treeEngines.get(tree);',
			'  if (engine === undefined) {',
			'    const project = (node: AnyNodeData) =>',
			'      toTransportData(node, (level) => wrapNode(level, tree) as AnyNodeData);',
			'    engine = {',
			'      render: (node) => methodsEngine.render(project(node)),',
			'      toEdit: (node, startOrRange, endPos) => methodsEngine.toEdit(project(node), startOrRange, endPos),',
			'    };',
			'    _treeEngines.set(tree, engine);',
			'  }',
			'  return engine;',
			'}',
			'// Drill-in helpers — call back through `readTreeNode` so the same',
			'// per-handle dispatch + wrap pipeline runs at every level. Layering:',
			'//   readTreeNode (public entry)',
			'//     → readNode (handle-driven — tree.read for native, JS walker otherwise)',
			'//       → wrapNode (dispatches on $type)',
			'//         → drillIn → readTreeNode (recurse)',
			...(usesDrillIn
				? [
						'// Resolve a node that IS the value being returned — a supertype',
						'// occurrence the reader collapsed to a text leaf stands in for its',
						'// own member. An unexpanded stub reads one more level; anything',
						'// else passes through untouched. It must NOT re-wrap: wrapping',
						'// would dispatch straight back into the wrap function that called',
						'// this, with the same data.',
						'function drillInSelf<T>(entry: T, tree: TreeHandle): T {',
						'  if (!entry) return undefined as unknown as T;',
						'  const e = entry as unknown as _NodeData;',
						'  if (e.$nodeHandle != null && e.$childIndex != null) return readTreeNode(tree, e.$nodeHandle, e.$childIndex) as unknown as T;',
						'  return entry;',
						'}',
						'// Resolve a CHILD position. Beyond the stub read, node data a deep',
						'// read already expanded carries no coordinates to re-read by (and',
						'// re-reading would replace the expansion with a shallow one), so the',
						'// wrap layer adds its methods in place instead.',
						'function drillIn<T>(entry: T, tree: TreeHandle): T {',
						'  const resolved = drillInSelf(entry, tree);',
						'  const e = resolved as unknown as _NodeData;',
						'  if (resolved === entry && typeof e?.$type === "number") return wrapNode(e, tree) as unknown as T;',
						'  return resolved;',
						'}'
					]
				: []),
			...(usesDrillInAll
				? [
						'function drillInAll<T>(entries: readonly T[] | undefined, tree: TreeHandle): T[] {',
						'  if (!entries) return [];',
						'  const arr = Array.isArray(entries) ? entries : [entries];',
						'  return arr.map(e => drillIn(e, tree));',
						'}'
					]
				: []),
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
						'  if (typeof entry.$type === "number" && altIds?.[entry.$type] !== undefined) return altIds[entry.$type] as unknown as T;',
						'  if (typeof entry.$text === "string") {',
						'    const mappedId = textIds?.[entry.$text];',
						'    if (typeof mappedId === "number") return mappedId as unknown as T;',
						'    return entry.$text as unknown as T;',
						'  }',
						'  return typeof entry.$type === "number" ? (entry.$type as T) : value;',
						'}'
					]
				: []),
			...(usesProjectMixedEnum
				? [
						'function projectMixedEnumStorage<T>(value: T, textIds?: Readonly<Record<string, number>>, altIds?: Readonly<Record<number, number>>): T {',
						'  if (!value) return value;',
						'  if (Array.isArray(value)) return value.map(entry => projectMixedEnumStorage(entry, textIds, altIds)) as unknown as T;',
						'  const entry = value as unknown as _NodeData;',
						'  if (typeof value === "string") {',
						'    const mappedId = textIds?.[value];',
						'    return typeof mappedId === "number" ? (mappedId as unknown as T) : value;',
						'  }',
						'  if (typeof value === "number") return (altIds?.[value] ?? value) as unknown as T;',
						'  if (typeof entry.$type === "number") {',
						'    const folded = altIds?.[entry.$type];',
						'    if (folded !== undefined) return folded as unknown as T;',
						'    if (textIds && Object.values(textIds).includes(entry.$type)) return entry.$type as unknown as T;',
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
						'function readTerminalFromOther(data: _NodeData, allowedKindIds: readonly number[]): _NodeData | number | undefined {',
						'  const other = (data as { $other?: readonly unknown[] }).$other;',
						'  if (!Array.isArray(other)) return undefined;',
						'  for (const e of other) {',
						'    const id = typeof e === "number" ? e : (typeof e === "object" && e !== null ? (e as { $type?: unknown }).$type : undefined);',
						'    if (typeof id === "number" && allowedKindIds.includes(id)) return e as _NodeData | number;',
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
						'  const raw = (entry as { $type?: unknown }).$type;',
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
			...(usesSplitElided
				? [
						'',
						'// Elidable separated-list positions (array elision, `[a, , b]`): the',
						'// raw wire array interleaves element entries with the separator token —',
						'// either as its bare numeric kind id (text-collapsed contexts) or as an',
						'// anonymous node stub `{ $type: <id>, $named: false }` (node-stub',
						'// contexts). Segment on those delimiters — each segment is one position',
						'// holding 0-or-1 element; an empty position stores `undefined`.',
						'// Idempotent over already-positional storage (a `$with` re-wrap carries',
						'// no delimiters): with no delimiter present every entry is its own',
						'// position, `undefined` holes intact.',
						'type _WireDelimiter = number | { readonly $type: number; readonly $named: false };',
						'function splitElidedWrapSlot<T>(',
						'  value: T | readonly (T | _WireDelimiter | undefined)[] | undefined,',
						'  separatorKindIds: readonly number[],',
						'  allowedKinds: readonly string[] | undefined',
						'): readonly (T | undefined)[] {',
						'  // Assumes T itself is never an array type — slot elements are node unions.',
						'  const isSlotList = (v: T | readonly (T | _WireDelimiter | undefined)[]): v is readonly (T | _WireDelimiter | undefined)[] => Array.isArray(v);',
						'  const items: readonly (T | _WireDelimiter | undefined)[] = value == null ? [] : isSlotList(value) ? value : [value];',
						'  if (items.length === 0) return [];',
						'  const isDelimiter = (e: unknown): e is _WireDelimiter => {',
						'    if (typeof e === "number") return separatorKindIds.includes(e);',
						'    if (typeof e === "object" && e !== null) {',
						'      const stub = e as { $type?: unknown; $named?: unknown };',
						'      return stub.$named === false && typeof stub.$type === "number" && separatorKindIds.includes(stub.$type);',
						'    }',
						'    return false;',
						'  };',
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
						'  for (const entry of items) {',
						'    if (isDelimiter(entry)) {',
						'      positions.push(keepFirst(segment));',
						'      segment = [];',
						'    } else {',
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
		const rows = new Map<string, { row: string; exact: boolean; typeExpr: string }>();
		const claimRow = (tableKey: string, row: string, exact: boolean, typeExpr: string): void => {
			const existing = rows.get(tableKey);
			if (existing === undefined || (exact && !existing.exact)) rows.set(tableKey, { row, exact, typeExpr });
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
				claimRow(
					this.#kindEntries ? memberName : kind,
					`  ${wrapTableKey(kind, memberName)}: (d, t) => wrap${node.typeName}(d as unknown as T.${node.typeName}, t),`,
					entry !== undefined && entry.kind === kind,
					`ReturnType<typeof wrap${node.typeName}>`
				);
			} else if (node.modelType === 'pattern' || node.modelType === 'enum' || node instanceof AssembledKeyword) {
				if (!node.factoryName) continue;
				if (this.#kindEntries) {
					const entry = findKindEntry(this.#kindEntries, kind);
					if (entry === undefined) continue;
					claimRow(
						entry.member,
						`  [TSKindId.${entry.member}]: (d) => ({ ...d, $type: TSKindId.${entry.member} as const }),`,
						entry.kind === kind,
						`_NodeData & { readonly $type: TSKindId.${entry.member} }`
					);
				} else {
					claimRow(kind, `  '${kind}': (d) => d,`, true, `_NodeData`);
				}
			}
		}
		for (const { row } of rows.values()) lines.push(row);
		lines.push('};');
		lines.push('');
		if (this.#kindEntries) {
			lines.push('interface _WrapReturnByKindId {');
			for (const [tableKey, { typeExpr }] of rows) {
				lines.push(`  [TSKindId.${tableKey}]: ${typeExpr};`);
			}
			lines.push('}');
			lines.push('');
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
					`export type ${this.#rootTreeTypeName} = _WrapReturnByKindId[TSKindId.${rootEntry.member}] & ParsedRoot;`
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
		lines.push('      out[key] = drillInAll(value, tree);');
		lines.push('    } else if (value != null) {');
		lines.push('      out[key] = drillIn(value, tree);');
		lines.push('    }');
		lines.push('  }');
		lines.push('  return out as unknown as _NodeData;');
		lines.push('}');
		lines.push('');

		lines.push('/** Wrap a NodeData into its lazy read-only view. */');
		if (this.#kindEntries) {
			lines.push('export function wrapNode<T extends _NodeData & { readonly $type: keyof _WrapReturnByKindId }>(');
			lines.push('  data: T,');
			lines.push('  tree: TreeHandle');
			lines.push(
				"): _WrapReturnByKindId[T['$type'] & keyof _WrapReturnByKindId] & Pick<T, Extract<keyof T, keyof ParsedRoot>>;"
			);
			lines.push('export function wrapNode(data: _NodeData, tree: TreeHandle): unknown;');
		}
		lines.push('export function wrapNode(data: _NodeData, tree: TreeHandle): unknown {');
		if (this.#kindEntries) {
			lines.push('  // The wire `$type` is the numeric grammar-symbol KindId — dispatch');
			lines.push('  // is a direct id-keyed lookup. A non-numeric `$type` can only be a');
			lines.push('  // catalog-less kind (the deprecated JS diagnostic lane stamps those');
			lines.push('  // as strings), which never had a table entry to reach.');
			lines.push('  const fn = typeof data.$type === "number" ? _wrapTable[data.$type] : undefined;');
		} else {
			lines.push('  const rawType = data.$type as unknown as string;');
			lines.push('  const fn = _wrapTable[rawType];');
		}
		lines.push(
			'  if (!fn) return _drillUnknownKindChildren(data, tree); // unknown kind — still drill in its kind-named-slot children'
		);
		lines.push('  return fn(data, tree);');
		lines.push('}');
		lines.push('');
		lines.push('/**');
		lines.push(' * Per-handle dispatching `readNode` — the architectural seam where');
		lines.push(' * the engine choice (JS vs native) lives. `readTreeNode`,');
		lines.push(' * and `drillIn` read through THIS function so the');
		lines.push(' * wrap layer is engine-agnostic. tree-sitter `Node::id()` is');
		lines.push(' * documented as "unique within a given syntax tree" and is a');
		lines.push(' * raw pointer cast — different parses yield different ids — so');
		lines.push(' * the engine that parsed the tree is the only thing that can');
		lines.push(' * dereference its ids. Native handles set `tree.read` to a');
		lines.push(' * closure that routes through napi; wasm/JS handles (used by');
		lines.push(' * retained diagnostic tooling — `tool walk`, `tool probe-kind');
		lines.push(' * --engine js`) leave it absent and fall back to `readNodeJs`');
		lines.push(' * (the in-process walker).');
		lines.push(' */');
		lines.push('function readNode(tree: TreeHandle, handle?: number, childIndex?: number): AnyNodeData {');
		lines.push('  // Per-handle dispatch: native-engine handles carry a `read`');
		lines.push('  // closure that routes through napi (engine owns the tree;');
		lines.push('  // navigation via handle + childIndex replaces nodeId).');
		lines.push('  // Wasm/JS handles (retained diagnostic tooling) leave `read`');
		lines.push('  // absent and fall back to the in-process JS walker.');
		lines.push('  return tree.read ? tree.read(handle, childIndex) : readNodeJs(tree, handle, childIndex);');
		lines.push('}');
		lines.push('');
		lines.push('/**');
		lines.push(' * Read a parsed tree node into a lazily-wrapped NodeData.');
		lines.push(' * One level deep — getters drill into subtrees on demand by');
		lines.push(' * recursing back through this same function. The wire `$type` is');
		lines.push(' * the grammar symbol (stamped by the read), so no per-site alias');
		lines.push(' * rewriting exists between the read and the wrap.');
		lines.push(' */');
		lines.push('export function readTreeNode(');
		lines.push('  tree: TreeHandle,');
		lines.push('  handle?: number,');
		lines.push('  childIndex?: number,');
		lines.push('): unknown {');
		lines.push('  return wrapNode(readNode(tree, handle, childIndex), tree);');
		lines.push('}');
		lines.push('');

		return lines.join('\n');
	}
}
