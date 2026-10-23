import { emptyForms } from '../compiler/model/trivia.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { GroupSeatHint, ListViewPlan, SeatPlan } from './factories.ts';

export interface SetterEntry {
	readonly name: string;
	readonly params: string;
	readonly body: string;
}

export interface InnerPositions {
	readonly inner: boolean;
}

export interface StoredAccessor {
	readonly name: string;
	readonly read: string;
	readonly hydrates?: 'one' | 'many';
}

export interface NodeMemberSpec {
	readonly setters?: readonly SetterEntry[];
	readonly accessors: readonly StoredAccessor[];
	readonly inner: InnerPositions;
	readonly extra?: readonly string[];
	readonly parsed?: true;
	readonly text?: string;
	readonly row?: true;
}

export function innerPositionsOf(kind: string, nodeMap: NodeMap): InnerPositions {
	return { inner: emptyForms(nodeMap).has(kind) };
}

export function triviaInnerImports(nodeMap: NodeMap): readonly string[] {
	if (emptyForms(nodeMap).size === 0) return [];
	return ['triviaInner'];
}

function accessorRead(accessor: StoredAccessor): string {
	if (accessor.hydrates === undefined) return accessor.read;
	return `${accessor.hydrates === 'many' ? 'hydrateStoredSlots' : 'hydrateStoredSlot'}(node, ${JSON.stringify(accessor.read)})`;
}

export function withEntry(entry: SetterEntry): string {
	return `      ${entry.name}: (${entry.params}) => rebuilt(node, handle, () => ${entry.body}),`;
}

export function builtRowLines(setters: readonly SetterEntry[] | undefined, inner: InnerPositions): string[] {
	return ['  bindRow(node, {', ...withBlockLines(setters, withEntry), ...triviaBlockLines(false, inner), '  });'];
}

function withBlockLines(setters: readonly SetterEntry[] | undefined, entry: (setter: SetterEntry) => string): string[] {
	return setters === undefined ? [] : ['    $with: {', ...setters.map(entry), '    },'];
}

function triviaBlockLines(row: boolean, inner: InnerPositions): string[] {
	return ['    $trivia: {', triviaMember(row, 'leading'), triviaMember(row, 'trailing'), ...(inner.inner ? [triviaMember(row, 'inner')] : []), '    },'];
}

function rowWithEntry(entry: SetterEntry): string {
	return `      ${entry.name}: (...args: unknown[]) => rowWith(node, tree, _wrap, ${JSON.stringify(entry.name)}, args),`;
}

function triviaMember(row: boolean, side: 'leading' | 'trailing' | 'inner'): string {
	if (row) return `      ${side}: (...items: unknown[]) => rowTrivia(node, tree, _wrap, '${side}', items),`;
	return side === 'inner'
		? '      inner: (...items: unknown[]) => triviaInner(node, handle, items),'
		: `      ${side}: (...items: unknown[]) => triviaSide(node, handle, '${side}', items),`;
}

export function nodeMemberLines(spec: NodeMemberSpec): string[] {
	const lines: string[] = [];
	const row = spec.row === true;
	const target = row ? 'rowOf(node, tree, _wrap)' : 'node';
	lines.push(...withBlockLines(spec.setters, row ? rowWithEntry : withEntry));
	for (const accessor of spec.accessors) lines.push(`    ${accessor.name}: () => ${accessorRead(accessor)},`);
	if (spec.text !== undefined) lines.push(`    $text: () => ${spec.text},`);
	lines.push(...(spec.extra ?? []));
	lines.push(
		'    $render: () => renderText(handle, node),',
		'    toString: () => node.$render(),',
		'    toJSON: () => nodeJSON(node, jsonFacts),',
		...triviaBlockLines(row, spec.inner),
		...(spec.parsed
			? [
					`    $query: handle && treeHandleOf(data) !== undefined ? () => queryOf(handle, ${target}) : undefined,`,
					`    $snapshot: handle && treeHandleOf(data) !== undefined ? () => snapshotOf(${target}) : undefined,`
				]
			: []),
		'    $engine: handle && (() => handle.current)'
	);
	return lines;
}

export function spelledGroupSlots(plan: SeatPlan): ReadonlySet<string> {
	return new Set(plan.groups.filter(({ hint }) => hint.keys.some((key) => key.name === hint.slot)).map(({ hint }) => hint.slot));
}

const readGroupName = (slot: string): string => `readGroup_${slot}`;

export function seatedSetters(setters: readonly SetterEntry[], plan: SeatPlan): SetterEntry[] {
	const seated = setters.map((entry) => {
		const base = `(${entry.params}) => ${entry.body}`;
		const element = plan.elements.find((candidate) => candidate.slot === entry.name);
		const slot = plan.slots.find((candidate) => candidate.slot === entry.name);
		const elementSet = element === undefined ? base : `(...args: never[]) => elementsWith(args, { slot: ${JSON.stringify(entry.name)}, ${element.spec} }, ${base})`;
		if (slot !== undefined) {
			return { name: entry.name, params: '...args: unknown[]', body: `listSlotWith(args, { ${slot.spec} }, ${elementSet})` };
		}
		if (element !== undefined) {
			return { name: entry.name, params: '...args: unknown[]', body: `elementsWith(args, { slot: ${JSON.stringify(entry.name)}, ${element.spec} }, ${base})` };
		}
		return entry;
	});
	const keyed: SetterEntry[] = [];
	for (const { hint, spec } of plan.groups) {
		const seat = seated.find((entry) => entry.name === hint.slot);
		if (seat === undefined) continue;
		const base = `(${seat.params}) => ${seat.body}`;
		for (const key of hint.keys) {
			keyed.push({
				name: key.name,
				params: '...args: unknown[]',
				body: `seatWith(${spec}, ${JSON.stringify(key.name)}, args, ${base}, () => ${readGroupName(hint.slot)}.call(node))`
			});
		}
	}
	const replaced = new Set(keyed.map((entry) => entry.name));
	return [...seated.filter((entry) => !replaced.has(entry.name)), ...keyed];
}

export function groupSeatParts(
	plan: SeatPlan,
	readOf: (hint: GroupSeatHint) => string,
	storedOf: (stored: string) => string = (stored) => stored
): { readonly prelude: string[]; readonly members: string[] } {
	if (plan.groups.length === 0) return { prelude: [], members: [] };
	const prelude = plan.groups.map(({ hint }) => `  const ${readGroupName(hint.slot)} = ${readOf(hint)};`);
	const members = plan.groups.flatMap(({ hint }) =>
		hint.keys.map(
			(key) =>
				`    ${key.name}: ${storedOf(hint.stored)} === undefined ? undefined : () => groupField(${readGroupName(hint.slot)}.call(node), ${JSON.stringify(key.field ?? key.name)}),`
		)
	);
	members.push(`    [STORED_SLOT_READERS]: { ${plan.groups.map(({ hint }) => `${hint.slot}: ${readGroupName(hint.slot)}`).join(', ')} },`);
	return { prelude, members };
}

export interface ListViewParts {
	readonly prelude: string[];
	readonly members: string[];
	readonly postlude: string[];
}

export function ownerViewParts(plan: ListViewPlan, storage: string, accessor: string, environment: 'factory' | 'wrap' | 'view'): ListViewParts {
	const wrapper = plan.wrapper ?? 'undefined';
	const options = plan.options
		.filter((option) => !(environment !== 'factory' && option.key === 'separator'))
		.map((option) => `    ${option.key}: listOption(listView.list, ${JSON.stringify(option.key)}, ${option.default}),`);
	const separator = environment !== 'factory' && plan.options.some((option) => option.key === 'separator');
	const shared = [
		'    ...LIST_METHODS,',
		'    [Symbol.iterator]: listIterator,',
		'    [Symbol.isConcatSpreadable]: true,',
		'    [Symbol.unscopables]: Array.prototype[Symbol.unscopables],',
		...options
	];
	return {
		prelude:
			environment === 'factory'
				? [
						`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)});`,
						`  if (listView.length === undefined) refuseReadStub(${JSON.stringify(storage)});`
					]
				: [`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)}, (list) => hydrate(list, tree));`],
		members: [
			'    length: listView.length,',
			'    [LIST_ITEMS]: undefined,',
			`    [LIST_READ]: () => listItems(ownerElements(node.${accessor}(), ${JSON.stringify(plan.elements)}), ${wrapper}),`,
			...shared
		],
		postlude: [
			'  defineListIndices(node, listView.length ?? 0);',
			...(separator ? [`  defineListSeparator(node, ${JSON.stringify(accessor)});`] : [])
		]
	};
}

export type ListStored = { readonly elements: string } | { readonly length: string };

function selfListOption(key: string, environment: 'factory' | 'wrap' | 'view'): string {
	if (environment === 'factory') return `_${key}`;
	if (environment === 'wrap') return `(data as { readonly _${key}?: unknown })._${key}`;
	if (key === 'delimiter') return 'recordDelimiter(data, tree)';
	throw new Error(`a record view's list option '${key}' is its shared getter (defineListSeparator), not a member: a parsed list's separator is its tree's`);
}

export function listSelfViewParts(
	plan: ListViewPlan,
	stored: ListStored,
	elementsReader: string,
	environment: 'factory' | 'wrap' | 'view'
): ListViewParts {
	const wrapper = plan.wrapper ?? 'undefined';
	const options = plan.options
		.filter((option) => !(environment !== 'factory' && option.key === 'separator'))
		.map((option) => `    ${option.key}: ${selfListOption(option.key, environment)} ?? ${option.default},`);
	const separator = environment !== 'factory' && plan.options.some((option) => option.key === 'separator');
	const shared = [
		'    ...LIST_METHODS,',
		'    [Symbol.iterator]: listIterator,',
		'    [Symbol.isConcatSpreadable]: true,',
		'    [Symbol.unscopables]: Array.prototype[Symbol.unscopables],',
		...options
	];
	return {
		prelude: ['elements' in stored ? `  const listedLength = storedElements(${stored.elements}).length;` : `  const listedLength = ${stored.length};`],
		members: [
			'    length: listedLength,',
			'    [LIST_ITEMS]: undefined,',
			`    [LIST_READ]: () => listItems(ownerElements(node, ${JSON.stringify(elementsReader)}), ${wrapper}),`,
			...shared
		],
		postlude: ['  defineListIndices(node, listedLength);', ...(separator ? ['  defineListSeparator(node);'] : [])]
	};
}
