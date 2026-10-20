import { hasBlankArm } from '../compiler/model/site-preferences.ts';
import { continuationTriviaKinds, emptyForms, layoutTriviaKinds } from '../compiler/model/trivia.ts';
import type { AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { AbstractAssembledCompound, AssembledAlias, AssembledList, AssembledNonterminal, isPatternLeaf, storesNodes } from '../compiler/model/node-map.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { groupSeatParts, innerPositionsOf, listSelfViewParts, nodeMemberLines, ownerViewParts, seatedSetters, spelledGroupSlots, type SetterEntry } from './node-members.ts';
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
import { builtTypeSurfaceOf, fieldElementType, listOptionKeys, listSelfViewPlan, seatPlanOf, separatedListSurface } from './factories.ts';
import { collectKindEntries, findKindEntry, collectCatalogKinds, type KindEnumEntry } from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';
import { nodeRecordLayout, rustNodeStructName } from './render-module.ts';
import { rustFieldIdent } from './node-common.ts';

export function listKindIds(nodeMap: NodeMap): number[] {
	return [...nodeMap.nodes.values()].flatMap((node) => (node instanceof AssembledList && node.kindId !== undefined ? [node.kindId] : [])).sort((a, b) => a - b);
}

export function unitKindIds(nodeMap: NodeMap): number[] {
	return [...nodeMap.nodes.values()]
		.flatMap((node) => ((node.modelType === 'keyword' || node.modelType === 'punctuation') && node.kindId !== undefined ? [node.kindId] : []))
		.sort((a, b) => a - b);
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
	generatedIdTables?: GeneratedIdTables;
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	kindEntries?: readonly KindEnumEntry[];
	rootKind?: string;
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

function typeStampLines(node: { readonly kind: string }, kindEntries: readonly KindEnumEntry[] | undefined): string[] {
	const entry = kindEntries === undefined ? undefined : findKindEntry(kindEntries, node.kind);
	return entry === undefined ? [] : [`    $type: TSKindId.${entry.member} as const,`];
}

export namespace wrap {
	export function branch(
		output: string[],
		node: AuthoredCompound,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		if (!node.rawFactoryName) return;
		output.push(renameUnusedTreeParam(emitFieldCarryingWrap(node, kindEntries, nodeMap, OBJECT)));
	}

	export function separatedList(
		output: string[],
		node: AssembledList,
		kindEntries: readonly KindEnumEntry[] | undefined,
		nodeMap: NodeMap
	): void {
		const result = emitSeparatedListWrap(node, kindEntries, nodeMap, OBJECT);
		if (result !== undefined) output.push(renameUnusedTreeParam(result));
	}

	export function view(output: string[], node: AuthoredCompound | AssembledList, kindEntries: readonly KindEnumEntry[] | undefined, nodeMap: NodeMap): boolean {
		if (!node.rawFactoryName) return false;
		const storage = recordStorageOf(node, nodeMap, kindEntries);
		if (storage === undefined) return false;
		const source = node instanceof AssembledList ? emitSeparatedListWrap(node, kindEntries, nodeMap, storage) : emitFieldCarryingWrap(node, kindEntries, nodeMap, storage);
		if (source === undefined) return false;
		output.push(source);
		return true;
	}
}

type WrapStorage = { readonly mode: 'object' } | { readonly mode: 'record'; readonly places: ReadonlyMap<string, string> };

const OBJECT: WrapStorage = { mode: 'object' };

function recordStorageOf(node: AuthoredCompound | AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): WrapStorage | undefined {
	if (seatPlanOf(node, nodeMap, kindEntries, 'RAW.').groups.length > 0) return undefined;
	const layout = nodeRecordLayout(node, nodeMap);
	if (layout === undefined) return undefined;
	const fields = new Set(layout.places.map((place) => place.field));
	const struct = rustNodeStructName(node);
	const places = new Map<string, string>();
	for (const slot of node.slots) {
		const field = rustFieldIdent(slot.storageName);
		if (!fields.has(field)) return undefined;
		places.set(slot.storageKey, `R.${struct}.${field}`);
	}
	return { mode: 'record', places };
}

function placeOf(storage: WrapStorage & { readonly mode: 'record' }, storageKey: string): string {
	const place = storage.places.get(storageKey);
	if (place === undefined) throw new Error(`emitWrap: slot '${storageKey}' has no record place`);
	return place;
}

function wrapHeader(node: { readonly typeName: string }, storage: WrapStorage, parsedType: string | undefined): string {
	return storage.mode === 'object'
		? `export function wrap${node.typeName}(data: T.${node.typeName}, tree: TreeHandle)${returnAnnotation(parsedType)} {`
		: `function view${node.typeName}(data: RecordStub, tree: TreeHandle)${returnAnnotation(parsedType)} {`;
}

interface SlotAccessorConfig {
	readonly elemType: string;
	readonly required: boolean;
	readonly storageInfo: ReturnType<typeof resolveFieldStorageInfo>;
	readonly aliasContent?: boolean;
}

function slotAccessorBody(slot: SlotModel, config: SlotAccessorConfig, storage: WrapStorage): string {
	const one = config.required ? config.elemType : `${config.elemType} | undefined`;
	if (storage.mode === 'record') {
		const place = placeOf(storage, slot.storageKey);
		if (!storesNodes(config.storageInfo)) return `return recordValue(this, tree, ${place})`;
		if (slot.arity === 'many') return `return viewSlots<${config.elemType}>(this, ${place}, tree)`;
		const role = config.aliasContent === true ? `, contentRole(this, recordSlot(this, tree, ${place}))` : '';
		return `return viewSlot<${one}>(this, ${place}, tree${role})`;
	}
	if (!storesNodes(config.storageInfo)) return `return this.${slot.storageKey}`;
	const key = JSON.stringify(slot.storageKey);
	if (slot.arity === 'many') return `return hydrateSlots<${config.elemType}>(this, ${key}, tree)`;
	const role = config.aliasContent === true ? `, contentRole(this, ${dataAccessExpr('this', slot.storageKey)})` : '';
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

function emitSeparatedListWrap(
	node: AssembledList,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	storage: WrapStorage
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const contentSlot = buildSeparatedListContentSlot(node);
	const canonical = canonicalSeparatedListField(node);
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const view = listSelfViewParts(
		listSelfViewPlan(node, nodeMap, kindEntries),
		storage.mode === 'object'
			? { elements: dataAccessExpr('data', canonical.storageKey) }
			: { length: `recordLength(data, tree, ${placeOf(storage, canonical.storageKey)})` },
		canonical.propertyName,
		storage.mode === 'object' ? 'wrap' : 'view'
	);
	const lines = [
		wrapHeader(node, storage, parsedType),
		'  const handle = currentHandle();',
		...view.prelude,
		'  const node = {',
		'    ...data,',
		...typeStampLines(node, kindEntries)
	];
	if (node.slots.length > 1) {
		lines.push(...fieldAccessorLines(node.slots, kindEntries, nodeMap, new Set(), storage));
	} else {
		const body = slotAccessorBody(
			{ name: canonical.name, propertyName: canonical.propertyName, storageKey: canonical.storageKey, arity: 'many' },
			{
				elemType: fieldElementType(contentSlot, nodeMap, kindEntries),
				required: node.nonEmpty,
				storageInfo: resolveFieldStorageInfo(contentSlot, nodeMap, kindEntries)
			},
			storage
		);
		lines.push(`    ${canonical.propertyName}() { ${body}; },`);
	}
	lines.push(
		...nodeMemberLines({
			setters: seatedSetters([...inlineSetters(node, nodeMap, kindEntries), ...listOptionSetters(node, nodeMap, kindEntries)], plan),
			accessors: [],
			extra: view.members,
			inner: innerPositionsOf(node.kind, nodeMap),
			parsed: true,
			...(storage.mode === 'record' ? { row: true as const } : {})
		}),
		'  };',
		...view.postlude,
		`  return ${castToParsed('node', parsedType)};`,
		'}'
	);
	return lines.join('\n');
}

function fieldAccessorLines(
	slots: readonly AssembledNonterminal[],
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	skip: ReadonlySet<string>,
	storage: WrapStorage,
	aliasContent = false
): string[] {
	return slots
		.filter((f) => !skip.has(f.propertyName))
		.map((f) => {
			const body = slotAccessorBody(f, {
				elemType: fieldElementType(f, nodeMap, kindEntries),
				required: isRequired(f),
				storageInfo: resolveFieldStorageInfo(f, nodeMap, kindEntries),
				aliasContent
			}, storage);
			return `    ${f.propertyName}() { ${body}; },`;
		});
}

function emitFieldCarryingWrap(node: AuthoredCompound, kindEntries: readonly KindEnumEntry[] | undefined, nodeMap: NodeMap, storage: WrapStorage): string {
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const owner = plan.viewPlan?.owner;
	const view =
		plan.viewPlan !== undefined && owner !== undefined
			? storage.mode === 'object'
				? ownerViewParts(plan.viewPlan, dataAccessExpr('data', owner.storage), owner.accessor, 'wrap')
				: ownerViewParts(plan.viewPlan, `recordSlot(data, tree, ${placeOf(storage, owner.storage)})`, owner.accessor, 'view')
			: undefined;
	const groups = groupSeatParts(
		plan,
		({ stored, group }) => `() => hydrateSlot<T.${group} | undefined>(node, ${JSON.stringify(stored)}, tree)`,
		(stored) => dataAccessExpr('data', stored)
	);
	return [
		wrapHeader(node, storage, parsedType),
		'  const handle = currentHandle();',
		...(view?.prelude ?? []),
		...groups.prelude,
		'  const node = {',
		'    ...data,',
		...typeStampLines(node, kindEntries),
		...fieldAccessorLines(node.slots, kindEntries, nodeMap, spelledGroupSlots(plan), storage, node instanceof AssembledAlias),
		...nodeMemberLines({
			setters: seatedSetters(inlineSetters(node, nodeMap, kindEntries), plan),
			accessors: [],
			extra: [...(view?.members ?? []), ...groups.members],
			inner: innerPositionsOf(node.kind, nodeMap),
			parsed: true,
			...(storage.mode === 'record' ? { row: true as const } : {})
		}),
		'  };',
		...(view?.postlude ?? []),
		`  return ${castToParsed('node', parsedType)};`,
		'}'
	].join('\n');
}

function admittedSlot(kind: string, slot: string, value: string): string {
	return `admitSlot(handle, ${JSON.stringify(kind)}, ${JSON.stringify(slot)}, ${value})`;
}

function inlineSetters(node: AuthoredCompound | AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): SetterEntry[] {
	const wrapFn = `wrap${node.typeName}`;
	const restSlots = new Set(
		(builtTypeSurfaceOf(nodeMap.nodes.get(node.kind)!, nodeMap, kindEntries)?.setters ?? [])
			.filter((setter) => setter.rest)
			.map((setter) => setter.name)
	);
	return node.slots.map((f) => {
		const method = f.propertyName;
		if (isMultiple(f) && restSlots.has(method)) {
			const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>[number]`;
			const setterRestElement = setterValueType.includes(' | ') ? `(${setterValueType})` : setterValueType;
			const restType = isNonEmpty(f) ? `NonEmptyArray<${setterValueType}>` : `${setterRestElement}[]`;
			return {
				name: method,
				params: `...v: ${restType}`,
				body: `${wrapFn}({ ...$edited(data), ${f.storageKey}: ${admittedSlot(node.kind, method, `restItems(${JSON.stringify(method)}, v)`)} }, tree)`
			};
		}
		const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>${hasBlankArm(f) ? ' | null' : ''}`;
		return {
			name: method,
			params: `v: ${setterValueType}`,
			body: `${wrapFn}({ ...$edited(data), ${f.storageKey}: ${admittedSlot(node.kind, method, blankFromInput(hasBlankArm(f), 'v'))} }, tree)`
		};
	});
}

function listOptionSetters(node: AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): SetterEntry[] {
	const surface = separatedListSurface(node, nodeMap, kindEntries);
	return listOptionKeys(surface).map((key) => ({
		name: key,
		params: `v: NonNullable<(${surface.optionsType})[${JSON.stringify(key)}]>`,
		body: `wrap${node.typeName}({ ...$edited(data), _${key}: v }, tree)`
	}));
}

export class WrapEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #canonicalAliasSourceKinds: ReadonlySet<string>;
	readonly #rootKind: string | undefined;
	readonly #output: string[] = [];
	readonly #views: string[] = [];
	readonly #emittedStructuralKinds = new Set<string>();
	readonly #viewKinds = new Set<string>();
	#rootTreeTypeName: string | undefined;
	#rootMember: string | undefined;

	get rootTreeTypeName(): string | undefined {
		return this.#rootTreeTypeName;
	}

	constructor(config: EmitWrapConfig) {
		const { nodeMap, generatedIdTables, inlineKinds, synthesizedKinds, kindEntries: providedKindEntries, rootKind } = config;
		this.#nodeMap = nodeMap;
		this.#kindEntries =
			providedKindEntries ??
			(generatedIdTables ? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables) : undefined);
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
		if (this.#kindEntries === undefined) return;
		if (wrap.view(this.#views, node, this.#kindEntries, this.#nodeMap)) this.#viewKinds.add(node.kind);
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
			const entry = this.#kindEntries ? findKindEntry(this.#kindEntries, kind) : undefined;
			if (this.#kindEntries && entry === undefined) {
				console.warn(
					`[codegen] wrap dispatch: '${kind}' resolves to no catalog entry — no numeric dispatch row emitted (no parser-issued $type can reach it)`
				);
				continue;
			}
			if (node instanceof AssembledAlias && (entry === undefined || (entry.parseId ?? entry.id) !== node.aliasTypeId)) {
				throw new Error(
					`emitWrap: alias envelope '${kind}' has no catalog entry for its type id ${node.aliasTypeId} — the reader stamps that id and nothing could dispatch it`
				);
			}
			const memberName = entry?.member ?? node.typeName;
			const tableKey = this.#kindEntries ? `[TSKindId.${memberName}]` : `'${kind}'`;
			const row = `  ${tableKey}: (d, t) => wrap${node.typeName}(d as unknown as T.${node.typeName}, t),`;
			const view = this.#viewKinds.has(kind) ? `  ${tableKey}: view${node.typeName},` : undefined;
			const exact = node instanceof AssembledAlias || (entry !== undefined && entry.kind === kind);
			const existing = rows.get(memberName);
			if (existing === undefined || (exact && !existing.exact)) rows.set(memberName, { row, view, exact });
		}
		const table = new Map([...rows].map(([member, { row }]) => [member, row]));
		const views = new Map([...rows].flatMap(([member, { view }]) => (view === undefined ? [] : [[member, view] as const])));
		for (const [kind, node] of this.#nodeMap.nodes) {
			if (!isPatternLeaf(node)) continue;
			const entry = this.#kindEntries ? findKindEntry(this.#kindEntries, kind) : undefined;
			if (this.#kindEntries && entry === undefined) continue;
			const memberName = entry?.member ?? kind;
			if (table.has(memberName)) continue;
			table.set(memberName, `  ${this.#kindEntries ? `[TSKindId.${memberName}]` : `'${kind}'`}: (d, t) => wrapLeaf(d, t),`);
		}
		return { wraps: table, views };
	}

	#rootTreeLines(rows: ReadonlyMap<string, string>): string[] {
		if (!this.#kindEntries || this.#rootKind === undefined) return [];
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
		const keyed = this.#kindEntries !== undefined;
		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'',
			"import { restItems, admitSlot, markEdited as $edited, asTextNode, carryRead, treeHandleOf, hydrateWith, hydrateSlotWith, hydrateSlotsWith, contentRole, inTreeEngine, currentHandle, listSlotWith, elementsWith, seatWith, groupField, STORED_SLOT_READERS, LIST_ITEMS, LIST_READ, LIST_METHODS, listIterator, listItems, storedElements, ownerView, ownerElements, listOption, defineListIndices, defineListSeparator, rebuilt, renderText, queryOf, snapshotOf, triviaSide, triviaInner, textOf, recordOf, recordSlot, recordItems, recordLength, recordValue, recordDelimiter, rowData, rowOf, rowWith, rowTrivia } from '@sittir/common/utils';",
			"import type { RecordPlace, RecordStub, Role, TreeHandle } from '@sittir/common/utils';",
			"import type { ParsedRoot } from '@sittir/common/engine';",
			"import type { AnyUntypedNode as _UntypedNode, NonEmptyArray } from '@sittir/types';",
			...(keyed ? ["import { TSKindId } from './kinds.js';"] : []),
			...(keyed && this.#rootEmptyForm() !== undefined ? [`import type { ${this.#rootEmptyForm()} } from './types.js';`] : []),
			DELIMITER_IMPORT,
			"import type * as T from './types-internal.js';",
			"import * as RAW from './factories/raw.js';",
			...(keyed ? ["import { records as R } from './records.js';"] : []),
			'',
			...(keyed
				? [
						'export type ParsedOfData<D> = D extends { readonly $type: infer Id }',
						'  ? Id extends keyof T.ParsedByKindId',
						'    ? T.ParsedByKindId[Id]',
						'    : D',
						'  : D;'
					]
				: ['export type ParsedOfData<D> = D;']),
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
			...(keyed
				? [
						'function viewSlot<T>(view: object, place: RecordPlace, tree: TreeHandle, role?: Role): ParsedOfData<T> {',
						'  return hydrateWith(recordSlot(view, tree, place), tree, _wrap, undefined, role) as ParsedOfData<T>;',
						'}',
						'function viewSlots<T>(view: object, place: RecordPlace, tree: TreeHandle): readonly ParsedOfData<T>[] {',
						'  return recordItems(view, tree, place, (data) => hydrateWith(data, tree, _wrap)) as readonly ParsedOfData<T>[];',
						'}'
					]
				: []),
			''
		];
		for (const source of this.#output) lines.push(source, '');
		for (const source of this.#views) lines.push(source, '');
		lines.push(
			'function wrapLeaf(data: _UntypedNode, _tree: TreeHandle): unknown {',
			'  const handle = currentHandle();',
			'  const node = {',
			'    ...data,',
			...nodeMemberLines({ accessors: [], parsed: true, inner: { inner: false }, text: 'textOf(data)' }).map((line) => line.slice(2)),
			'  };',
			'  return node;',
			'}',
			''
		);
		lines.push(
			`const _wrapTable: Record<${keyed ? 'number' : 'string'}, (data: _UntypedNode, tree: TreeHandle) => unknown> = {`,
			...rows.values(),
			'};',
			'',
			...(keyed
				? ['const _viewTable: Record<number, (data: RecordStub, tree: TreeHandle) => unknown> = {', ...views.values(), '};', '']
				: []),
			...this.#rootTreeLines(rows),
			'/** Wrap a node into its kind\'s node: the node as it crossed, with the kind\'s members attached. */'
		);
		if (keyed) {
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
		}
		lines.push(
			'export function wrapNode(data: _UntypedNode, tree: TreeHandle): unknown {',
			...(keyed
				? [
						'  if (recordOf(data) !== undefined) {',
						'    const view = _viewTable[data.$type as unknown as number];',
						'    if (view === undefined) return wrapNode(rowData(data, tree) as _UntypedNode, tree);',
						'    return carryRead(data, inTreeEngine(tree, () => view(data as unknown as RecordStub, tree)));',
						'  }'
					]
				: []),
			`  const fn = _wrapTable[data.$type as unknown as ${keyed ? 'number' : 'string'}];`,
			'  return fn === undefined ? asTextNode(data) : carryRead(data, inTreeEngine(tree, () => fn(data, tree)));',
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
			'STORED_SLOT_READERS',
			'LIST_ITEMS',
			'LIST_READ',
			'LIST_METHODS',
			'listIterator',
			'listItems',
			'storedElements',
			'ownerView',
			'ownerElements',
			'listOption',
			'defineListSeparator',
			'defineListIndices',
			'triviaInner',
			'recordSlot',
			'recordLength',
			'recordValue',
			'recordDelimiter',
			'rowOf',
			'rowWith',
			'rowTrivia',
			'NonEmptyArray',
			'RAW',
			'ParsedRoot'
		]).join('\n');
	}
}
