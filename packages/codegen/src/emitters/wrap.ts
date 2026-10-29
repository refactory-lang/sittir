import { hasBlankArm } from '../compiler/model/site-preferences.ts';
import { continuationTriviaKinds, emptyForms, layoutTriviaKinds } from '../compiler/model/trivia.ts';
import type { AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { AbstractAssembledCompound, AssembledAlias, AssembledList, AssembledNonterminal, storesNodes } from '../compiler/model/node-map.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import { storedTextKinds } from './built-from-text.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { groupSeatParts, LIST_SURFACE_LINES, LIST_SYMBOL_LINES, triviaPositionsOf, listSelfViewParts, nodeMemberLines, ownerViewParts, seatedSetters, type SetterEntry, type TriviaPositions } from './node-members.ts';
import {
	DELIMITER_IMPORT,
	collectAliasTargetToSourceMap,
	isMultiple,
	isNonEmpty,
	isRequired,
	resolveFieldStorageInfo,
	classifyWrapEmission,
	isSlotBearingCompound,
	canonicalSeparatedListField,
	reportSkippedParserSymbol,
	aliasEnvelopesOf,
	aliasEnvelopeIds,
	pruneUnusedImports,
	blankFromInput
} from './shared.ts';
import { builtTypeSurfaceOf, fieldElementType, listOptionKeys, listSelfViewPlan, seatPlanOf, separatedListSurface, splicedEnvelopeAdmission, splicedEnvelopeType, type ListViewPlan, type SeatPlan } from './factories.ts';
import { collectKindEntries, findKindEntry, type KindEnumEntry } from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';
import { recordPlacesOf } from './record-construction.ts';
import type { RecordPlace } from './record-layout.ts';

export function listKindIds(nodeMap: NodeMap): number[] {
	return [...nodeMap.nodes.values()].flatMap((node) => (node instanceof AssembledList && node.kindId !== undefined ? [node.kindId] : [])).sort((a, b) => a - b);
}

function unitKindIdsWhere(nodeMap: NodeMap, keep: (node: AssembledNode) => boolean): number[] {
	return [...nodeMap.nodes.values()]
		.flatMap((node) => (node.unit && node.kindId !== undefined && keep(node) ? [node.kindId] : []))
		.sort((a, b) => a - b);
}

export function unitKindIds(nodeMap: NodeMap): number[] {
	return unitKindIdsWhere(nodeMap, () => true);
}

export function namedUnitKindIds(nodeMap: NodeMap): number[] {
	return unitKindIdsWhere(nodeMap, (node) => node.kindEntry?.anon !== true && node.kindEntry?.hidden !== true);
}

export function layoutMemberKindIds(nodeMap: NodeMap): number[] {
	return kindIdsOf(nodeMap, continuationTriviaKinds(nodeMap));
}

export function layoutTriviaKindIds(nodeMap: NodeMap): number[] {
	return kindIdsOf(nodeMap, layoutTriviaKinds(nodeMap));
}

function kindIdsOf(nodeMap: NodeMap, kinds: readonly string[]): number[] {
	return kinds
		.flatMap((kind) => {
			const id = nodeMap.nodes.get(kind)?.kindId;
			return id === undefined ? [] : [id];
		})
		.sort((a, b) => a - b);
}

export function rootKindIds(nodeMap: NodeMap): number[] {
	return [...nodeMap.nodes.values()].flatMap((node) => (node.grammarRoot === true && node.kindId !== undefined ? [node.kindId] : [])).sort((a, b) => a - b);
}

export function rebuildWrapperKindIds(nodeMap: NodeMap): number[] {
	const hoisted = [...nodeMap.nodes.values()].flatMap((node) =>
		node instanceof AbstractAssembledCompound && node.seated && node.kindId !== undefined ? [node.kindId] : []
	);
	return [...new Set([...aliasEnvelopeIds(aliasEnvelopesOf(nodeMap)), ...hoisted])].sort((a, b) => a - b);
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
	generatedIdTables: GeneratedIdTables;
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	rootKind?: string;
}

function declaredParsedType(
	node: { readonly kind: string; readonly typeName: string },
	kindEntries: readonly KindEnumEntry[]
): string | undefined {
	return findKindEntry(kindEntries, node.kind) !== undefined
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

function typeStampLines(node: { readonly kind: string }, kindEntries: readonly KindEnumEntry[]): string[] {
	const entry = findKindEntry(kindEntries, node.kind);
	return entry === undefined ? [] : [`    $type: TSKindId.${entry.member} as const,`];
}

export namespace wrap {
	export function branch(
		output: string[],
		node: AuthoredCompound,
		kindEntries: readonly KindEnumEntry[],
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		output.push(renameUnusedTreeParam(emitFieldCarryingWrap(node, kindEntries, nodeMap)));
	}

	export function separatedList(
		output: string[],
		node: AssembledList,
		kindEntries: readonly KindEnumEntry[],
		nodeMap: NodeMap
	): void {
		const result = emitSeparatedListWrap(node, kindEntries, nodeMap);
		if (result !== undefined) output.push(renameUnusedTreeParam(result));
	}

	export function view(
		output: string[],
		node: AuthoredCompound | AssembledList,
		kindEntries: readonly KindEnumEntry[],
		nodeMap: NodeMap,
		shared: HandleShared
	): boolean {
		if (!node.rawFactoryName) return false;
		const places = recordPlacesOf(node, nodeMap);
		if (places === undefined) return false;
		output.push(emitRecordHandle(node, kindEntries, nodeMap, places, shared));
		return true;
	}
}

type RecordPlaces = ReadonlyMap<string, RecordPlace>;

function placeIn(places: RecordPlaces, storageKey: string): RecordPlace {
	const place = places.get(storageKey);
	if (place === undefined) throw new Error(`emitWrap: slot '${storageKey}' has no record place`);
	return place;
}

function cellArgs(place: RecordPlace, list = false): string {
	if ('bit' in place) throw new Error(`emitWrap: presence word ${place.word} bit ${place.bit} is not a cell`);
	if (!list && place.run !== undefined) throw new Error(`emitWrap: the list cell at word ${place.word} is read as one item`);
	return `${place.word}, ${place.width}, ${list ? `${place.run ?? 'undefined'}, ` : ''}${place.forms}, ${place.inline ?? 0}, ${place.built}`;
}

interface SlotAccessorConfig {
	readonly elemType: string;
	readonly required: boolean;
	readonly storageInfo: ReturnType<typeof resolveFieldStorageInfo>;
	readonly aliasContent?: boolean;
}

function slotAccessorBody(slot: SlotModel, config: SlotAccessorConfig): string {
	const one = config.required ? config.elemType : `${config.elemType} | undefined`;
	if (!storesNodes(config.storageInfo)) return `return this.${slot.storageKey}`;
	const key = JSON.stringify(slot.storageKey);
	if (slot.arity === 'many') return `return hydrateSlots<${config.elemType}>(this, ${key}, tree)`;
	const role = config.aliasContent === true ? `, contentRole(this, () => ${dataAccessExpr('this', slot.storageKey)})` : '';
	return `return hydrateSlot<${one}>(this, ${key}, tree${role})`;
}

const SAFE_IDENT_KEY = /^_[A-Za-z_$][A-Za-z0-9_$]*$/;

function dataAccessExpr(dataExpr: string, storageKey: string): string {
	return SAFE_IDENT_KEY.test(storageKey) ? `${dataExpr}.${storageKey}` : `${dataExpr}[${JSON.stringify(storageKey)}]`;
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

interface AccessorSlot {
	readonly slot: SlotModel;
	readonly config: SlotAccessorConfig;
}

function fieldAccessorSlots(
	slots: readonly AssembledNonterminal[],
	kindEntries: readonly KindEnumEntry[],
	nodeMap: NodeMap,
	aliasContent = false
): AccessorSlot[] {
	return slots.map((slot) => ({
		slot,
		config: { elemType: fieldElementType(slot, nodeMap, kindEntries), required: isRequired(slot), storageInfo: resolveFieldStorageInfo(slot, nodeMap), aliasContent }
	}));
}

function listAccessorSlots(node: AssembledList, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap): AccessorSlot[] {
	if (node.slots.length > 1) return fieldAccessorSlots(node.slots, kindEntries, nodeMap);
	const content = buildSeparatedListContentSlot(node);
	const canonical = canonicalSeparatedListField(node);
	return [
		{
			slot: { name: canonical.name, propertyName: canonical.propertyName, storageKey: canonical.storageKey, arity: 'many' },
			config: { elemType: fieldElementType(content, nodeMap, kindEntries), required: node.nonEmpty, storageInfo: resolveFieldStorageInfo(content, nodeMap) }
		}
	];
}

function accessorSlotsOf(node: AuthoredCompound | AssembledList, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap): AccessorSlot[] {
	return node instanceof AssembledList ? listAccessorSlots(node, kindEntries, nodeMap) : fieldAccessorSlots(node.slots, kindEntries, nodeMap, node instanceof AssembledAlias);
}

function settersOf(node: AuthoredCompound | AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[], plan: SeatPlan): SetterEntry[] {
	const own = node instanceof AssembledList ? [...inlineSetters(node, nodeMap, kindEntries), ...listOptionSetters(node, nodeMap, kindEntries)] : inlineSetters(node, nodeMap, kindEntries);
	return seatedSetters(own, plan);
}

function objectAccessorLines(node: AuthoredCompound | AssembledList, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap): string[] {
	return accessorSlotsOf(node, kindEntries, nodeMap).map(({ slot, config }) => `    ${slot.propertyName}() { ${slotAccessorBody(slot, config)}; },`);
}

function emitSeparatedListWrap(node: AssembledList, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const canonical = canonicalSeparatedListField(node);
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const view = listSelfViewParts(listSelfViewPlan(node, nodeMap, kindEntries), { elements: dataAccessExpr('data', canonical.storageKey) }, canonical.propertyName, 'wrap');
	return [
		`export function wrap${node.typeName}(data: T.${node.typeName}, tree: TreeHandle)${returnAnnotation(parsedType)} {`,
		'  const handle = currentHandle();',
		...view.prelude,
		'  const node = {',
		'    ...data,',
		...typeStampLines(node, kindEntries),
		...objectAccessorLines(node, kindEntries, nodeMap),
		...nodeMemberLines({ setters: settersOf(node, nodeMap, kindEntries, plan), accessors: [], extra: view.members, tail: view.tail, trivia: triviaPositionsOf(node.kind, nodeMap), parsed: true }),
		'  };',
		...view.postlude,
		`  return ${castToParsed('node', parsedType)};`,
		'}'
	].join('\n');
}

function emitFieldCarryingWrap(node: AuthoredCompound, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap): string {
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const owner = plan.viewPlan?.owner;
	const view = plan.viewPlan !== undefined && owner !== undefined ? ownerViewParts(plan.viewPlan, dataAccessExpr('data', owner.storage), owner.accessor, 'wrap') : undefined;
	const groups = groupSeatParts(
		plan,
		({ stored, group }) => `() => hydrateSlot<T.${group} | undefined>(node, ${JSON.stringify(stored)}, tree)`,
		(stored) => `${dataAccessExpr('data', stored)} === undefined`
	);
	return [
		`export function wrap${node.typeName}(data: T.${node.typeName}, tree: TreeHandle)${returnAnnotation(parsedType)} {`,
		'  const handle = currentHandle();',
		...(view?.prelude ?? []),
		...groups.prelude,
		'  const node = {',
		'    ...data,',
		...typeStampLines(node, kindEntries),
		...objectAccessorLines(node, kindEntries, nodeMap),
		...nodeMemberLines({
			setters: settersOf(node, nodeMap, kindEntries, plan),
			accessors: [],
			extra: [...(view?.members ?? []), ...groups.members],
			tail: view?.tail,
			trivia: triviaPositionsOf(node.kind, nodeMap),
			parsed: true
		}),
		'  };',
		...(view?.postlude ?? []),
		`  return ${castToParsed('node', parsedType)};`,
		'}'
	].join('\n');
}

export interface HandleShared {
	readonly setters: Set<string>;
	inner: boolean;
}

function handleAccessorBody({ slot, config }: AccessorSlot, places: RecordPlaces): string {
	const one = config.required ? config.elemType : `${config.elemType} | undefined`;
	const place = placeIn(places, slot.storageKey);
	if ('bit' in place) return `return recordFlag(this, ${place.word}, ${place.bit})`;
	if (!storesNodes(config.storageInfo)) return place.run === undefined ? `return childSlot(this, ${cellArgs(place)})` : `return childItems(this, ${cellArgs(place, true)})`;
	if (slot.arity === 'many') return `return viewSlots<${config.elemType}>(this, ${cellArgs(place, true)})`;
	const args = cellArgs(place);
	const role = config.aliasContent === true ? ', true' : '';
	return `return viewSlot<${one}>(this, ${args}${role})`;
}

interface HandleListParts {
	readonly functions: readonly string[];
	readonly fields: readonly string[];
	readonly tail: readonly string[];
	readonly after: readonly string[];
}

const NO_LIST: HandleListParts = { functions: [], fields: [], tail: [], after: [] };

interface ListSeparatorMember {
	readonly functions: readonly string[];
	readonly value: string;
}

function listSurface(view: ListViewPlan, prefix: string, read: readonly string[], optionValue: (key: string) => string, after: readonly string[], separator: ListSeparatorMember): HandleListParts {
	const wrapper = view.wrapper === undefined ? [] : [`const ${prefix}$wrapper = ${view.wrapper};`];
	const options = view.options.filter((option) => option.key !== 'separator');
	const separated = view.options.some((option) => option.key === 'separator');
	return {
		functions: [...wrapper, ...read, ...(separated ? separator.functions : [])],
		fields: [
			'    length: 0,',
			...LIST_SURFACE_LINES,
			...options.map((option) => `    ${option.key}: undefined as unknown,`),
			...(separated ? [`    separator: ${separator.value},`] : [])
		],
		tail: LIST_SYMBOL_LINES,
		after: [
			...after,
			...options.map((option) => `  node.${option.key} = ${optionValue(option.key)} ?? ${option.default};`),
			`  holdListItems(node, ${prefix}$listRead.call(node));`
		]
	};
}

function listWrapperOf(view: ListViewPlan, prefix: string): string {
	return view.wrapper === undefined ? 'undefined' : `${prefix}$wrapper`;
}

function selfListParts(node: AssembledList, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap, places: RecordPlaces, prefix: string): HandleListParts {
	const self = canonicalSeparatedListField(node);
	const view = listSelfViewPlan(node, nodeMap, kindEntries);
	return listSurface(
		view,
		prefix,
		[`function ${prefix}$listRead(this: object): readonly unknown[] {`, `  return listItems(ownerElements(this, ${JSON.stringify(self.propertyName)}), ${listWrapperOf(view, prefix)});`, '}'],
		(key) => {
			if (key === 'delimiter') return 'recordDelimiter(node)';
			throw new Error(`a record handle's list option '${key}' has no record reader: a parsed list's separator is its tree's`);
		},
		[`  node.length = recordLength(node, ${cellArgs(placeIn(places, self.storageKey), true)});`],
		{ functions: [], value: 'listSeparator' }
	);
}

function ownerListParts(view: ListViewPlan, owner: NonNullable<ListViewPlan['owner']>, places: RecordPlaces, prefix: string): HandleListParts {
	return listSurface(
		view,
		prefix,
		[
			`function ${prefix}$listRead(this: { readonly ${owner.accessor}: () => unknown }): readonly unknown[] {`,
			`  return listItems(ownerElements(this.${owner.accessor}(), ${JSON.stringify(view.elements)}), ${listWrapperOf(view, prefix)});`,
			'}'
		],
		(key) => `listOption(listView.list, ${JSON.stringify(key)}, undefined)`,
		[
			`  const listView = ownerView(childSlot(node, ${cellArgs(placeIn(places, owner.storage))}, _wrap), ${JSON.stringify(view.count)}, (list) => hydrate(list, tree));`,
			'  node.length = listView.length ?? 0;'
		],
		{
			functions: [
				`function ${prefix}$separator(this: { readonly ${owner.accessor}: () => unknown }): unknown {`,
				`  return (this.${owner.accessor}() as { readonly separator?: () => unknown } | null | undefined)?.separator?.();`,
				'}'
			],
			value: `${prefix}$separator`
		}
	);
}

function handleListParts(node: AuthoredCompound | AssembledList, plan: SeatPlan, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap, places: RecordPlaces, prefix: string): HandleListParts {
	if (node instanceof AssembledList) return selfListParts(node, kindEntries, nodeMap, places, prefix);
	const owner = plan.viewPlan?.owner;
	return plan.viewPlan === undefined || owner === undefined ? NO_LIST : ownerListParts(plan.viewPlan, owner, places, prefix);
}

function emitRecordHandle(node: AuthoredCompound | AssembledList, kindEntries: readonly KindEnumEntry[], nodeMap: NodeMap, places: RecordPlaces, shared: HandleShared): string {
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const prefix = `view${node.typeName}`;
	const functions: string[] = [];
	const member = (name: string, body: string): string => {
		const fn = `${prefix}$${name}`;
		functions.push(`function ${fn}(this: RecordHandle) {`, `  ${body};`, '}');
		return fn;
	};
	const fields = accessorSlotsOf(node, kindEntries, nodeMap).map((accessor) => `    ${accessor.slot.propertyName}: ${member(accessor.slot.propertyName, handleAccessorBody(accessor, places))},`);
	const presence: string[] = [];
	for (const { hint } of plan.groups) {
		const args = cellArgs(placeIn(places, hint.stored));
		for (const key of hint.keys) {
			const fn = member(key.name, `return groupField(viewSlot<T.${hint.group} | undefined>(this, ${args}), ${JSON.stringify(key.field ?? key.name)})`);
			fields.push(`    ${key.name}: undefined as typeof ${fn} | undefined,`);
			presence.push(`  node.${key.name} = recordPresent(node, ${args}) ? ${fn} : undefined;`);
		}
	}
	const list = handleListParts(node, plan, kindEntries, nodeMap, places, prefix);
	const setters = settersOf(node, nodeMap, kindEntries, plan).map((setter) => setter.name);
	for (const name of setters) shared.setters.add(name);
	const trivia = triviaPositionsOf(node.kind, nodeMap);
	if (trivia?.inner === true) shared.inner = true;
	const stamp = typeStampLines(node, kindEntries);
	return [
		...functions,
		...list.functions,
		`function ${prefix}(data: RecordPosition, tree: TreeHandle)${returnAnnotation(parsedType)} {`,
		'  const node = {',
		...(stamp.length === 0 ? ['    $type: data.$type,'] : stamp),
		'    $tree: tree,',
		'    $at: data.$at,',
		'    $words: positionWords(data),',
		'    $cache: undefined as Record<number, unknown> | undefined,',
		'    $_layout: data.$_layout,',
		...fields,
		...list.fields,
		...(setters.length === 0 ? [] : ['    $with: undefined as unknown as object,']),
		'    $render: handleRender,',
		'    toString: handleToString,',
		'    toJSON: refuseJSON,',
		...(trivia === undefined ? [] : ['    $trivia: undefined as unknown as object,']),
		'    $query: data.$_layout === undefined ? undefined : $handleQuery,',
		'    $snapshot: data.$_layout === undefined ? undefined : $handleSnapshot,',
		'    $engine: handleEngine,',
		...list.tail,
		'    [Symbol.dispose]: handleDispose',
		'  };',
		...(setters.length === 0 ? [] : [`  node.$with = { node, ${setters.map((name) => `${name}: $with$${name}`).join(', ')} };`]),
		...(trivia === undefined ? [] : [`  node.$trivia = { node, leading: $trivia$leading, trailing: $trivia$trailing${trivia.inner ? ', inner: $trivia$inner' : ''} };`]),
		...presence,
		...list.after,
		`  return ${castToParsed('node', parsedType)};`,
		'}'
	].join('\n');
}

function handleSharedLines(shared: HandleShared): string[] {
	const trivia = (side: string): string[] => [
		`function $trivia$${side}(this: { readonly node: RecordPosition }, ...items: unknown[]): unknown {`,
		`  return handleTrivia(this.node, _wrap, '${side}', items);`,
		'}'
	];
	return [
		'function $handleQuery(this: RecordPosition): object {',
		'  return handleQuery(this, rowOf(this, _wrap));',
		'}',
		'function $handleSnapshot(this: RecordPosition): unknown {',
		'  return snapshotOf(rowOf(this, _wrap));',
		'}',
		...trivia('leading'),
		...trivia('trailing'),
		...(shared.inner ? trivia('inner') : []),
		...[...shared.setters].sort().flatMap((name) => [
			`function $with$${name}(this: { readonly node: RecordPosition }, ...args: unknown[]): unknown {`,
			`  return rowWith(this.node, _wrap, ${JSON.stringify(name)}, args);`,
			'}'
		])
	];
}

function admittedSlot(kind: string, slot: string, value: string): string {
	return `admitSlot(handle, ${JSON.stringify(kind)}, ${JSON.stringify(slot)}, ${value})`;
}

function inlineSetters(node: AuthoredCompound | AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): SetterEntry[] {
	const wrapFn = `wrap${node.typeName}`;
	const restSlots = new Set(
		(builtTypeSurfaceOf(nodeMap.nodes.get(node.kind)!, nodeMap, kindEntries)?.setters ?? [])
			.filter((setter) => setter.rest)
			.map((setter) => setter.name)
	);
	return node.slots.map((f) => {
		const method = f.propertyName;
		const envelopeType = splicedEnvelopeType(f, nodeMap);
		const admitted = envelopeType === undefined ? '' : ` | ${envelopeType}`;
		if (isMultiple(f) && restSlots.has(method)) {
			const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>[number]${admitted}`;
			const setterRestElement = setterValueType.includes(' | ') ? `(${setterValueType})` : setterValueType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${setterValueType}>` : `${setterRestElement}[]`;
			return {
				name: method,
				params: `...v: ${restType}`,
				body: `${wrapFn}({ ...$edited(data), ${f.storageKey}: ${admittedSlot(node.kind, method, splicedEnvelopeAdmission(f, `restItems(${JSON.stringify(method)}, v)`, nodeMap, kindEntries, node.typeName))} }, tree)`
			};
		}
		const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>${admitted}${hasBlankArm(f) ? ' | null' : ''}`;
		return {
			name: method,
			params: `v: ${setterValueType}`,
			body: `${wrapFn}({ ...$edited(data), ${f.storageKey}: ${admittedSlot(node.kind, method, splicedEnvelopeAdmission(f, blankFromInput(hasBlankArm(f), 'v'), nodeMap, kindEntries, node.typeName))} }, tree)`
		};
	});
}

function listOptionSetters(node: AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): SetterEntry[] {
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	return listOptionKeys(surface).map((key) => ({
		name: key,
		params: `v: NonNullable<(${surface.optionsType})[${JSON.stringify(key)}]>`,
		body: `wrap${node.typeName}({ ...$edited(data), _${key}: v }, tree)`
	}));
}

const LEAF_WRAPS: Readonly<Record<'wrapLeaf' | 'wrapInteriorLeaf', TriviaPositions | undefined>> = { wrapLeaf: { inner: false }, wrapInteriorLeaf: undefined };

export class WrapEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[];
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #canonicalAliasSourceKinds: ReadonlySet<string>;
	readonly #rootKind: string | undefined;
	readonly #output: string[] = [];
	readonly #views: string[] = [];
	readonly #emittedStructuralKinds = new Set<string>();
	readonly #viewKinds = new Set<string>();
	readonly #leafWraps = new Set<keyof typeof LEAF_WRAPS>();
	readonly #shared: HandleShared = { setters: new Set(), inner: false };
	#rootTreeTypeName: string | undefined;
	#rootMember: string | undefined;

	get rootTreeTypeName(): string | undefined {
		return this.#rootTreeTypeName;
	}

	constructor(config: EmitWrapConfig) {
		const { nodeMap, generatedIdTables, inlineKinds, synthesizedKinds, rootKind } = config;
		this.#nodeMap = nodeMap;
		this.#kindEntries = collectKindEntries(nodeMap, generatedIdTables);
		this.#inlineKinds = inlineKinds;
		this.#synthesizedKinds = synthesizedKinds;
		this.#canonicalAliasSourceKinds = new Set(collectAliasTargetToSourceMap(nodeMap).values());
		this.#rootKind = rootKind;
	}

	emitBranch(node: AuthoredCompound): void {
		wrap.branch(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
		this.#emitView(node);
	}

	emitSeparatedList(node: AssembledList): void {
		wrap.separatedList(this.#output, node, this.#kindEntries, this.#nodeMap);
		this.#emittedStructuralKinds.add(node.kind);
		this.#emitView(node);
	}

	#emitView(node: AuthoredCompound | AssembledList): void {
		if (wrap.view(this.#views, node, this.#kindEntries, this.#nodeMap, this.#shared)) this.#viewKinds.add(node.kind);
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
			reportSkippedParserSymbol(kind, 'wrap', emission);
		}
		if (emission !== 'emit') return;
		switch (node.modelType) {
			case 'envelope':
			case 'branch':
			case 'polymorph':
			case 'alias':
				this.emitBranch(node);
				break;
			case 'list':
				this.emitSeparatedList(node);
				break;
			default:
				break;
		}
	}

	#wrapTableRows(): { readonly wraps: Map<string, string>; readonly views: Map<string, string> } {
		const rows = new Map<string, { row: string; view: string | undefined; exact: boolean }>();
		for (const [kind, node] of this.#nodeMap.nodes) {
			if (!isSlotBearingCompound(node) || !this.#emittedStructuralKinds.has(kind)) continue;
			const entry = findKindEntry(this.#kindEntries, kind);
			if (entry === undefined) {
				console.warn(
					`[codegen] wrap dispatch: '${kind}' resolves to no catalog entry — no numeric dispatch row emitted (no parser-issued $type can reach it)`
				);
				continue;
			}
			if (node instanceof AssembledAlias && (entry.parseId ?? entry.id) !== node.aliasTypeId) {
				throw new Error(
					`emitWrap: alias envelope '${kind}' has no catalog entry for its type id ${node.aliasTypeId} — the reader stamps that id and nothing could dispatch it`
				);
			}
			const memberName = entry.member;
			const row = `  [TSKindId.${memberName}]: (d, t) => wrap${node.typeName}(d as unknown as T.${node.typeName}, t),`;
			const view = this.#viewKinds.has(kind) ? `  [TSKindId.${memberName}]: view${node.typeName},` : undefined;
			const exact = node instanceof AssembledAlias || entry.kind === kind;
			const existing = rows.get(memberName);
			if (existing === undefined || (exact && !existing.exact)) rows.set(memberName, { row, view, exact });
		}
		const table = new Map([...rows].map(([member, { row }]) => [member, row]));
		const views = new Map([...rows].flatMap(([member, { view }]) => (view === undefined ? [] : [[member, view] as const])));
		for (const { kind } of storedTextKinds(this.#nodeMap, this.#kindEntries)) {
			const entry = findKindEntry(this.#kindEntries, kind);
			if (entry === undefined) continue;
			const memberName = entry.member;
			if (table.has(memberName)) continue;
			const leaf = triviaPositionsOf(kind, this.#nodeMap) === undefined ? 'wrapInteriorLeaf' : 'wrapLeaf';
			this.#leafWraps.add(leaf);
			table.set(memberName, `  [TSKindId.${memberName}]: (d, t) => ${leaf}(d, t),`);
		}
		return { wraps: table, views };
	}

	#rootTreeLines(rows: ReadonlyMap<string, string>): string[] {
		if (this.#rootKind === undefined) return [];
		const rootEntry = findKindEntry(this.#kindEntries, this.#rootKind);
		if (rootEntry === undefined || !rows.has(rootEntry.member)) {
			throw new Error(`emitWrap: root kind '${this.#rootKind}' has no wrap-table row — cannot name the wrapped root surface`);
		}
		this.#rootTreeTypeName = `${rootEntry.member}Tree`;
		this.#rootMember = rootEntry.member;
		const empty = this.#rootEmptyForm();
		return [
			'/** The wrapped root of a whole-source parse — what `engine.parse()` returns. */',
			`export type ${this.#rootTreeTypeName} = ${empty === undefined ? `T.ParsedByKindId[TSKindId.${rootEntry.member}]` : `${empty}.Parsed`} & ParsedRoot;`,
			''
		];
	}

	#rootEmptyForm(): string | undefined {
		return this.#rootKind === undefined ? undefined : emptyForms(this.#nodeMap).get(this.#rootKind)?.typeName;
	}

	finalize(): string {
		const { wraps: rows, views } = this.#wrapTableRows();
		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'',
			"import { restItems, admitSplicedEnvelope, admitSlot, markEdited as $edited, asTextNode, carryReadTree, treeHandleOf, hydrateWith, hydrateSlotWith, hydrateSlotsWith, contentRole, inTreeEngine, currentHandle, listSlotWith, elementsWith, seatWith, groupField, LIST_METHODS, listIterator, listItems, holdListItems, listSeparatorOf, listSeparator, storedElements, ownerView, ownerElements, listOption, rebuilt, renderText, refuseJSON, SOURCE, Source, treeTokenOf, queryOf, snapshotOf, triviaSide, triviaInner, textOf, isRecordPosition, positionWords, recordSlot, recordPresent, recordFlag, childSlot, childItems, recordLength, recordDelimiter, rowData, rowOf, rowWith, handleTrivia, handleRender, handleToString, handleEngine, handleDispose, handleQuery } from '@sittir/common/utils';",
			"import type { RecordHandle, RecordPosition, Role, TreeHandle } from '@sittir/common/utils';",
			"import type { ParsedRoot } from '@sittir/common/engine';",
			"import type { Admit, AnyUntypedNode as _UntypedNode, NonEmptyArray } from '@sittir/types';",
			"import { TSKindId } from './kinds.js';",
			...(this.#rootEmptyForm() !== undefined ? [`import type { ${this.#rootEmptyForm()} } from './types.js';`] : []),
			DELIMITER_IMPORT,
			"import type * as T from './types-internal.js';",
			"import * as RAW from './factories/raw.js';",
			'',
			'export type ParsedOfData<D> = D extends { readonly $type: infer Id }',
			'  ? Id extends keyof T.ParsedByKindId',
			'    ? T.ParsedByKindId[Id]',
			'    : D',
			'  : D;',
			'const _wrap = (data: object, tree: TreeHandle): unknown => wrapNode(data as _UntypedNode, tree);',
			'/** A stored value as an accessor returns it: a coordinate read `depth` levels down and wrapped, a node wrapped, anything else as it is. */',
			'export function hydrate<T>(value: T, tree: TreeHandle, depth?: number): ParsedOfData<T> {',
			'  return hydrateWith(value, tree, _wrap, depth) as ParsedOfData<T>;',
			'}',
			'function hydrateSlot<T>(node: object, key: string, tree: TreeHandle, role?: Role): ParsedOfData<T> {',
			'  return hydrateSlotWith(node, key, tree, _wrap, role) as ParsedOfData<T>;',
			'}',
			'function hydrateSlots<T>(node: object, key: string, tree: TreeHandle): readonly ParsedOfData<T>[] {',
			'  return hydrateSlotsWith(node, key, tree, _wrap) as readonly ParsedOfData<T>[];',
			'}',
			'function viewSlot<T>(view: RecordHandle, word: number, width: number, forms: number, inline: number, built: number, aliasContent = false): ParsedOfData<T> {',
			'  return childSlot(view, word, width, forms, inline, built, _wrap, aliasContent) as ParsedOfData<T>;',
			'}',
			'function viewSlots<T>(view: RecordHandle, word: number, width: number, run: number | undefined, forms: number, inline: number, built: number): readonly ParsedOfData<T>[] {',
			'  return childItems(view, word, width, run, forms, inline, built, _wrap) as readonly ParsedOfData<T>[];',
			'}',
			''
		];
		for (const source of this.#output) lines.push(source, '');
		for (const source of this.#views) lines.push(source, '');
		if (this.#views.length > 0) lines.push(...handleSharedLines(this.#shared), '');
		for (const [leaf, trivia] of Object.entries(LEAF_WRAPS) as [keyof typeof LEAF_WRAPS, TriviaPositions | undefined][]) {
			if (!this.#leafWraps.has(leaf)) continue;
			lines.push(
				`function ${leaf}(data: _UntypedNode, _tree: TreeHandle): object {`,
				'  const handle = currentHandle();',
				'  const node = {',
				'    ...data,',
				...nodeMemberLines({ accessors: [], parsed: true, trivia, text: 'textOf(data)' }).map((line) => line.slice(2)),
				'  };',
				'  return node;',
				'}',
				''
			);
		}
		lines.push(
			'const _wrapTable: Record<number, (data: _UntypedNode, tree: TreeHandle) => object> = {',
			...rows.values(),
			'};',
			'',
			'const _viewTable: Record<number, (data: RecordPosition, tree: TreeHandle) => object> = {',
			...views.values(),
			'};',
			'',
			...this.#rootTreeLines(rows),
			"/** Wrap a node into its kind's node: the node as it crossed, with the kind's members attached. */"
		);
		if (this.#rootTreeTypeName !== undefined) {
			lines.push(
				`export function wrapNode(data: _UntypedNode & { readonly $type: TSKindId.${this.#rootMember} } & ParsedRoot, tree: TreeHandle): ${this.#rootTreeTypeName};`
			);
		}
		lines.push(
			'export function wrapNode<D extends _UntypedNode & { readonly $type: keyof T.ParsedByKindId }>(',
			'  data: D,',
			'  tree: TreeHandle',
			"): T.ParsedByKindId[D['$type'] & keyof T.ParsedByKindId] & Pick<D, Extract<keyof D, keyof ParsedRoot>>;",
			'export function wrapNode(data: _UntypedNode, tree: TreeHandle): unknown;'
		);
		lines.push(
			'export function wrapNode(data: _UntypedNode, tree: TreeHandle): unknown {',
			'  if (isRecordPosition(data)) {',
			'    const view = _viewTable[data.$type];',
			'    if (view === undefined) return wrapNode(rowData(data) as _UntypedNode, tree);',
			'    return inTreeEngine(tree, () => view(data, tree));',
			'  }',
			'  const fn = _wrapTable[data.$type as unknown as number];',
			'  return fn === undefined ? asTextNode(data) : carryReadTree(data, inTreeEngine(tree, () => fn(data, tree)));',
			'}',
			''
		);
		return pruneUnusedImports(lines, [
			'Delimiter',
			'contentRole',
			'restItems',
			'admitSlot',
			'listSlotWith',
			'elementsWith',
			'seatWith',
			'groupField',
			'LIST_METHODS',
			'listIterator',
			'listItems',
			'holdListItems',
			'listSeparatorOf',
			'listSeparator',
			'storedElements',
			'ownerView',
			'ownerElements',
			'listOption',
			'SOURCE',
			'Source',
			'treeTokenOf',
			'triviaInner',
			'recordSlot',
			'recordPresent',
			'childSlot',
			'childItems',
			'recordLength',
			'recordFlag',
			'recordDelimiter',
			'rowOf',
			'rowWith',
			'handleTrivia',
			'positionWords',
			'handleRender',
			'handleToString',
			'handleEngine',
			'handleDispose',
			'handleQuery',
			'RecordHandle',
			'RecordPosition',
			'admitSplicedEnvelope',
			'Admit',
			'NonEmptyArray',
			'RAW',
			'ParsedRoot'
		]).join('\n');
	}
}
