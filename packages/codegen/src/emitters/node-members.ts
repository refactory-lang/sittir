import { LIST_VIEW_MEMBERS } from '@sittir/common/utils';
import { emptyForms } from '../compiler/model/trivia.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { GroupSeatHint, ListViewPlan, SeatPlan } from './factories.ts';

export interface SetterEntry {
	readonly name: string;
	readonly params: string;
	readonly body: string;
}

export interface TriviaPositions {
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
	readonly trivia: TriviaPositions | undefined;
	readonly extra?: readonly string[];
	readonly tail?: readonly string[];
	readonly parsed?: true;
	readonly root?: boolean;
	readonly text?: string;
}

export const ROOT_ERRORS_LINE = '    $errors: (data as { readonly $errors?: unknown }).$errors,';

export function triviaPositionsOf(kind: string, nodeMap: NodeMap): TriviaPositions | undefined {
	return nodeMap.nodes.get(kind)?.triviaInterior ? undefined : { inner: emptyForms(nodeMap).has(kind) };
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

export function builtWithLines(name: string, kind: string, inputs: readonly string[], setters: readonly SetterEntry[]): string[] {
	return [
		`function ${name}(node: object, setter: string, args: readonly unknown[]): unknown {`,
		'  const handle = handleOf(node as RecordHandle);',
		...(inputs.length === 0 ? [] : ['  const inputs = builtInputs(node);', ...inputs]),
		'  switch (setter) {',
		...setters.flatMap((entry) => [`    case ${JSON.stringify(entry.name)}:`, `      return applySetter(args, (${entry.params}) => rebuilt(node, handle, () => ${entry.body}));`]),
		'  }',
		`  throw new Error(\`${kind} has no $with.\${setter}\`);`,
		'}'
	];
}

function withBlockLines(setters: readonly SetterEntry[] | undefined, entry: (setter: SetterEntry) => string): string[] {
	return setters === undefined ? [] : ['    $with: {', ...setters.map(entry), '    },'];
}

function triviaBlockLines(trivia: TriviaPositions | undefined): string[] {
	if (trivia === undefined) return [];
	return ['    $trivia: {', triviaMember('leading'), triviaMember('trailing'), ...(trivia.inner ? [triviaMember('inner')] : []), '    },'];
}

function triviaMember(side: 'leading' | 'trailing' | 'inner'): string {
	return side === 'inner'
		? '      inner: (...items: unknown[]) => triviaInner(node, handle, items),'
		: `      ${side}: (...items: unknown[]) => triviaSide(node, handle, '${side}', items),`;
}

export function nodeMemberLines(spec: NodeMemberSpec): string[] {
	const lines: string[] = [];
	lines.push(...withBlockLines(spec.setters, withEntry));
	for (const accessor of spec.accessors) lines.push(`    ${accessor.name}: () => ${accessorRead(accessor)},`);
	if (spec.text !== undefined) lines.push(`    $text: () => ${spec.text},`);
	lines.push(...(spec.extra ?? []));
	lines.push(
		'    $render: () => renderText(handle, node),',
		'    toString: () => node.$render(),',
		'    toJSON: refuseJSON,',
		...triviaBlockLines(spec.trivia),
		...(spec.parsed
			? [
					'    $query: handle && treeHandleOf(data) !== undefined ? () => queryOf(handle, node) : undefined,',
					'    $snapshot: handle && treeHandleOf(data) !== undefined ? () => snapshotOf(node) : undefined,'
				]
			: []),
		'    $engine: handle && (() => handle.current),',
		...(spec.root === true ? [ROOT_ERRORS_LINE] : []),
		...(spec.tail ?? []),
		...(spec.parsed ? ['    [TREE]: treeTokenOf(data),'] : []),
		`    [SOURCE]: ${spec.parsed ? 'treeTokenOf(data) === undefined ? Source.Factory : Source.Ts' : 'Source.Factory'}`
	);
	return lines;
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
	return [...seated, ...keyed];
}

export function groupSeatParts(
	plan: SeatPlan,
	readOf: (hint: GroupSeatHint) => string,
	absentOf: (stored: string) => string = (stored) => `${stored} === undefined`
): { readonly prelude: string[]; readonly members: string[] } {
	if (plan.groups.length === 0) return { prelude: [], members: [] };
	const prelude = plan.groups.map(({ hint }) => `  const ${readGroupName(hint.slot)} = ${readOf(hint)};`);
	const members = plan.groups.flatMap(({ hint }) =>
		hint.keys.map(
			(key) =>
				`    ${key.name}: ${absentOf(hint.stored)} ? undefined : () => groupField(${readGroupName(hint.slot)}.call(node), ${JSON.stringify(key.field ?? key.name)}),`
		)
	);
	return { prelude, members };
}

export const LIST_SURFACE_LINES: readonly string[] = LIST_VIEW_MEMBERS.filter((name) => name !== 'length' && name !== 'toString').map((name) => `    ${name}: LIST_METHODS.${name},`);

export const LIST_SYMBOL_LINES: readonly string[] = ['    [Symbol.iterator]: listIterator,', '    [Symbol.isConcatSpreadable]: true,'];

export interface ListViewParts {
	readonly prelude: string[];
	readonly members: string[];
	readonly tail: readonly string[];
	readonly postlude: string[];
}

function optionMember(key: string, value: string): string {
	return key === 'separator' ? `    separator: () => ${value},` : `    ${key}: ${value},`;
}

export function ownerViewParts(plan: ListViewPlan, storage: string, accessor: string, environment: 'factory' | 'wrap'): ListViewParts {
	const wrapper = plan.wrapper ?? 'undefined';
	const options = plan.options.map((option) =>
		environment !== 'factory' && option.key === 'separator'
			? optionMember(option.key, `(node.${accessor}() as { readonly separator?: () => unknown } | null | undefined)?.separator?.()`)
			: optionMember(option.key, `listOption(listView.list, ${JSON.stringify(option.key)}, ${option.default})`)
	);
	return {
		prelude:
			environment === 'factory'
				? [
						`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)});`,
						`  if (listView.length === undefined) refuseReadStub(${JSON.stringify(storage)});`
					]
				: [`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)}, (list) => hydrate(list, tree));`],
		members: ['    length: listView.length,', ...LIST_SURFACE_LINES, ...options],
		tail: LIST_SYMBOL_LINES,
		postlude: [`  holdListItems(node, listItems(ownerElements(node.${accessor}(), ${JSON.stringify(plan.elements)}), ${wrapper}));`]
	};
}

export type ListStored = { readonly elements: string } | { readonly length: string };

function selfListOption(key: string, environment: 'factory' | 'wrap'): string {
	return environment === 'factory' ? `_${key}` : `(data as { readonly _${key}?: unknown })._${key}`;
}

export function listSelfViewParts(
	plan: ListViewPlan,
	stored: ListStored,
	elementsReader: string,
	environment: 'factory' | 'wrap'
): ListViewParts {
	const wrapper = plan.wrapper ?? 'undefined';
	const options = plan.options.map((option) =>
		environment !== 'factory' && option.key === 'separator'
			? optionMember(option.key, 'listSeparatorOf(node)')
			: optionMember(option.key, `${selfListOption(option.key, environment)} ?? ${option.default}`)
	);
	return {
		prelude: ['elements' in stored ? `  const listedLength = storedElements(${stored.elements}).length;` : `  const listedLength = ${stored.length};`],
		members: ['    length: listedLength,', ...LIST_SURFACE_LINES, ...options],
		tail: LIST_SYMBOL_LINES,
		postlude: [`  holdListItems(node, listItems(ownerElements(node, ${JSON.stringify(elementsReader)}), ${wrapper}));`]
	};
}
