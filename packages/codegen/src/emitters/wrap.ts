import { hasBlankArm } from '../compiler/model/site-preferences.ts';
import type { AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { AbstractAssembledCompound, AssembledAlias, AssembledList, AssembledNonterminal } from '../compiler/model/node-map.ts';
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
	warnSkippedParserSymbol,
	aliasEnvelopesOf,
	aliasEnvelopeIds,
	pruneUnusedImports,
	blankFromInput
} from './shared.ts';
import { builtTypeSurfaceOf, fieldElementType, listSelfViewPlan, seatPlanOf } from './factories.ts';
import { collectKindEntries, findKindEntry, collectCatalogKinds, type KindEnumEntry } from './kind-discriminant.ts';
import type { CodegenEmitter } from './emitter.ts';

export function listKindIds(nodeMap: NodeMap): number[] {
	return [...nodeMap.nodes.values()].flatMap((node) => (node instanceof AssembledList && node.kindId !== undefined ? [node.kindId] : [])).sort((a, b) => a - b);
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
		output.push(renameUnusedTreeParam(emitFieldCarryingWrap(node, kindEntries, nodeMap)));
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

interface SlotAccessorConfig {
	readonly elemType: string;
	readonly required: boolean;
	readonly storageInfo: ReturnType<typeof resolveFieldStorageInfo>;
}

function slotAccessorBody(slot: SlotModel, config: SlotAccessorConfig): string {
	const kind = config.storageInfo.kind;
	if (kind === 'boolean' || kind === 'bitflag' || kind === 'kindEnum') return `return this.${slot.storageKey}`;
	const key = JSON.stringify(slot.storageKey);
	if (slot.arity === 'many') return `return hydrateSlots<${config.elemType}>(this, ${key}, tree)`;
	return `return hydrateSlot<${config.required ? config.elemType : `${config.elemType} | undefined`}>(this, ${key}, tree)`;
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
	nodeMap: NodeMap
): string | undefined {
	if (!node.rawFactoryName) return undefined;
	const contentSlot = buildSeparatedListContentSlot(node);
	const canonical = canonicalSeparatedListField(node);
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const view = listSelfViewParts(listSelfViewPlan(node, nodeMap, kindEntries), dataAccessExpr('data', canonical.storageKey), canonical.propertyName, 'wrap');
	const lines = [
		`export function wrap${node.typeName}(data: T.${node.typeName}, tree: TreeHandle)${returnAnnotation(parsedType)} {`,
		'  const handle = currentHandle();',
		...view.prelude,
		'  const node = {',
		'    ...data,',
		...typeStampLines(node, kindEntries)
	];
	if (node.slots.length > 1) {
		lines.push(...fieldAccessorLines(node.slots, kindEntries, nodeMap, new Set()));
	} else {
		const body = slotAccessorBody(
			{ name: canonical.name, propertyName: canonical.propertyName, storageKey: canonical.storageKey, arity: 'many' },
			{
				elemType: fieldElementType(contentSlot, nodeMap, kindEntries),
				required: node.nonEmpty,
				storageInfo: resolveFieldStorageInfo(contentSlot, nodeMap, kindEntries)
			}
		);
		lines.push(`    ${canonical.propertyName}() { ${body}; },`);
	}
	lines.push(
		...nodeMemberLines({
			setters: seatedSetters([], plan),
			accessors: [],
			extra: view.members,
			inner: innerPositionsOf(node.kind, nodeMap),
			parsed: true
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
	skip: ReadonlySet<string>
): string[] {
	return slots
		.filter((f) => !skip.has(f.propertyName))
		.map((f) => {
			const body = slotAccessorBody(f, {
				elemType: fieldElementType(f, nodeMap, kindEntries),
				required: isRequired(f),
				storageInfo: resolveFieldStorageInfo(f, nodeMap, kindEntries)
			});
			return `    ${f.propertyName}() { ${body}; },`;
		});
}

function emitFieldCarryingWrap(node: AuthoredCompound, kindEntries: readonly KindEnumEntry[] | undefined, nodeMap: NodeMap): string {
	const parsedType = declaredParsedType(node, kindEntries);
	const plan = seatPlanOf(node, nodeMap, kindEntries, 'RAW.');
	const owner = plan.viewPlan?.owner;
	const view =
		plan.viewPlan !== undefined && owner !== undefined
			? ownerViewParts(plan.viewPlan, dataAccessExpr('data', owner.storage), owner.accessor, 'wrap')
			: undefined;
	const groups = groupSeatParts(
		plan,
		({ stored, group }) => `() => hydrateSlot<T.${group} | undefined>(node, ${JSON.stringify(stored)}, tree)`,
		(stored) => dataAccessExpr('data', stored)
	);
	return [
		`export function wrap${node.typeName}(data: T.${node.typeName}, tree: TreeHandle)${returnAnnotation(parsedType)} {`,
		'  const handle = currentHandle();',
		...(view?.prelude ?? []),
		...groups.prelude,
		'  const node = {',
		'    ...data,',
		...typeStampLines(node, kindEntries),
		...fieldAccessorLines(node.slots, kindEntries, nodeMap, spelledGroupSlots(plan)),
		...nodeMemberLines({
			setters: seatedSetters(inlineSetters(node, nodeMap, kindEntries), plan),
			accessors: [],
			extra: [...(view?.members ?? []), ...groups.members],
			inner: innerPositionsOf(node.kind, nodeMap),
			parsed: true
		}),
		'  };',
		...(view?.postlude ?? []),
		`  return ${castToParsed('node', parsedType)};`,
		'}'
	].join('\n');
}

function inlineSetters(node: AuthoredCompound, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): SetterEntry[] {
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
				body: `${wrapFn}({ ...$edited(data), ${f.storageKey}: restItems(${JSON.stringify(method)}, v) }, tree)`
			};
		}
		const setterValueType = `NonNullable<T.${node.typeName}['${f.storageKey}']>${hasBlankArm(f) ? ' | null' : ''}`;
		return {
			name: method,
			params: `v: ${setterValueType}`,
			body: `${wrapFn}({ ...$edited(data), ${f.storageKey}: ${blankFromInput(hasBlankArm(f), 'v')} }, tree)`
		};
	});
}

export class WrapEmitter implements CodegenEmitter<string> {
	readonly #nodeMap: NodeMap;
	readonly #kindEntries: readonly KindEnumEntry[] | undefined;
	readonly #inlineKinds: readonly string[] | undefined;
	readonly #synthesizedKinds: ReadonlySet<string> | undefined;
	readonly #canonicalAliasSourceKinds: ReadonlySet<string>;
	readonly #rootKind: string | undefined;
	readonly #output: string[] = [];
	readonly #emittedStructuralKinds = new Set<string>();
	#rootTreeTypeName: string | undefined;

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

	#wrapTableRows(): Map<string, string> {
		const rows = new Map<string, { row: string; exact: boolean }>();
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
			const exact = node instanceof AssembledAlias || (entry !== undefined && entry.kind === kind);
			const existing = rows.get(memberName);
			if (existing === undefined || (exact && !existing.exact)) rows.set(memberName, { row, exact });
		}
		return new Map([...rows].map(([member, { row }]) => [member, row]));
	}

	#rootTreeLines(rows: ReadonlyMap<string, string>): string[] {
		if (!this.#kindEntries || this.#rootKind === undefined) return [];
		const rootEntry = findKindEntry(this.#kindEntries, this.#rootKind);
		if (rootEntry === undefined || !rows.has(rootEntry.member)) {
			throw new Error(`emitWrap: root kind '${this.#rootKind}' has no wrap-table row — cannot name the wrapped root surface`);
		}
		this.#rootTreeTypeName = `${rootEntry.member}Tree`;
		return [
			'/** The wrapped root of a whole-source parse — what `engine.parse()` returns. */',
			`export type ${this.#rootTreeTypeName} = T.ParsedByKindId[TSKindId.${rootEntry.member}] & ParsedRoot;`,
			''
		];
	}

	finalize(): string {
		const rows = this.#wrapTableRows();
		const keyed = this.#kindEntries !== undefined;
		const lines: string[] = [
			'// Auto-generated by @sittir/codegen — do not edit',
			'',
			"import { restItems, markEdited as $edited, carryRead, treeHandleOf, hydrateWith, hydrateSlotWith, hydrateSlotsWith, inTreeEngine, currentHandle, listSlotWith, elementsWith, seatWith, groupField, STORED_SLOT_READERS, LIST_ITEMS, LIST_READ, LIST_METHODS, listIterator, listItems, storedElements, ownerView, ownerElements, listOption, defineListIndices, rebuilt, renderText, queryOf, triviaSide, triviaInner, triviaInnerAt } from '@sittir/common/utils';",
			"import type { TreeHandle } from '@sittir/common/utils';",
			"import type { ParsedRoot } from '@sittir/common/engine';",
			"import type { AnyUntypedNode as _UntypedNode, NonEmptyArray } from '@sittir/types';",
			...(keyed ? ["import { TSKindId } from './types.js';"] : []),
			DELIMITER_IMPORT,
			"import type * as T from './types-internal.js';",
			"import * as RAW from './factories/raw.js';",
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
			'/** A stored value as an accessor returns it: a coordinate read `depth` levels down and wrapped, a transport wrapped, anything else as it is. */',
			'export function hydrate<T>(value: T, tree: TreeHandle, depth?: number): ParsedOfData<T> {',
			'  return hydrateWith(value, tree, _wrap, depth) as ParsedOfData<T>;',
			'}',
			'function hydrateSlot<T>(node: object, key: string, tree: TreeHandle): ParsedOfData<T> {',
			'  return hydrateSlotWith(node, key, tree, _wrap) as ParsedOfData<T>;',
			'}',
			'function hydrateSlots<T>(node: object, key: string, tree: TreeHandle): readonly ParsedOfData<T>[] {',
			'  return hydrateSlotsWith(node, key, tree, _wrap) as readonly ParsedOfData<T>[];',
			'}',
			''
		];
		for (const source of this.#output) lines.push(source, '');
		lines.push(
			`const _wrapTable: Record<${keyed ? 'number' : 'string'}, (data: _UntypedNode, tree: TreeHandle) => unknown> = {`,
			...rows.values(),
			'};',
			'',
			...this.#rootTreeLines(rows),
			'/** Wrap a transport into its kind\'s node: the transport as it crossed, with the kind\'s members attached. */'
		);
		if (keyed) {
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
			`  const fn = _wrapTable[data.$type as unknown as ${keyed ? 'number' : 'string'}];`,
			'  return fn === undefined ? data : carryRead(data, inTreeEngine(tree, () => fn(data, tree)));',
			'}',
			''
		);
		return pruneUnusedImports(lines, [
			'Delimiter',
			'restItems',
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
			'defineListIndices',
			'triviaInner',
			'triviaInnerAt',
			'NonEmptyArray',
			'RAW',
			'ParsedRoot'
		]).join('\n');
	}
}
