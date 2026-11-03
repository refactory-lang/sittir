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

export type TriviaSide = 'leading' | 'trailing' | 'inner';

export function triviaSides(trivia: TriviaPositions): readonly TriviaSide[] {
	return trivia.inner ? ['leading', 'trailing', 'inner'] : ['leading', 'trailing'];
}

export function receivedMembers(member: '$with' | '$trivia', entries: readonly string[]): string {
	return `  node.${member} = { ${[...entries, '[RECEIVER]: node'].join(', ')} };`;
}

function withEntry(entry: SetterEntry): string {
	return `${entry.name}: (${entry.params}) => rebuilt(node, handle, () => ${entry.body})`;
}

export function builtWithLines(name: string, kind: string, inputs: readonly string[], setters: readonly SetterEntry[]): string[] {
	const unread = setters.length === 0 ? '_' : '';
	return [
		`function ${name}(${unread}node: object, setter: string, ${unread}args: readonly unknown[]): unknown {`,
		...(setters.length === 0
			? []
			: [
					'  const handle = handleOf(node as RecordHandle);',
					...(inputs.length === 0 ? [] : ['  const inputs = builtInputs(node);', ...inputs]),
					'  switch (setter) {',
					...setters.flatMap((entry) => [`    case ${JSON.stringify(entry.name)}:`, `      return applySetter(args, (${entry.params}) => rebuilt(node, handle, () => ${entry.body}));`]),
					'  }'
				]),
		`  throw new Error(\`${kind} has no $with.\${setter}\`);`,
		'}'
	];
}

function triviaMember(side: TriviaSide): string {
	return side === 'inner' ? 'inner: (...items: unknown[]) => triviaInner(node, handle, items)' : `${side}: (...items: unknown[]) => triviaSide(node, handle, '${side}', items)`;
}

export interface NodeMemberParts {
	readonly members: readonly string[];
	readonly after: readonly string[];
}

export function nodeMemberParts(spec: NodeMemberSpec): NodeMemberParts {
	const lines: string[] = spec.parsed ? [] : ['    $_layout: undefined,'];
	if (spec.setters !== undefined) lines.push('    $with: undefined as unknown as object,');
	for (const accessor of spec.accessors) lines.push(`    ${accessor.name}: () => ${accessorRead(accessor)},`);
	if (spec.text !== undefined) lines.push(`    $text: () => ${spec.text},`);
	lines.push(...(spec.extra ?? []));
	lines.push(
		'    $render: () => renderText(handle, node),',
		'    toString: () => node.$render(),',
		'    toJSON: refuseJSON,',
		...(spec.trivia === undefined ? [] : ['    $trivia: undefined as unknown as object,']),
		...(spec.parsed
			? [
					'    $query: handle && treeHandleOf(data) !== undefined ? () => queryOf(handle, node) : undefined,',
					'    $snapshot: handle && treeHandleOf(data) !== undefined ? () => snapshotOf(node) : undefined,'
				]
			: []),
		'    $engine: handle && (() => handle.current),',
		...(spec.root === true ? [ROOT_ERRORS_LINE] : []),
		...(spec.tail ?? []),
		...(spec.parsed ? ['    [TREE]: treeTokenOf(data) ?? null,'] : []),
		`    [SOURCE]: ${spec.parsed ? 'treeTokenOf(data) === undefined ? Source.Factory : Source.Ts' : 'Source.Factory'},`,
		'    [Symbol.dispose]: releaseNothing'
	);
	const plain = (member: string, entries: readonly string[]): string => `  node.${member} = { ${entries.join(', ')} };`;
	const after = [
		...(spec.setters === undefined ? [] : [plain('$with', spec.setters.map(withEntry))]),
		...(spec.trivia === undefined ? [] : [plain('$trivia', triviaSides(spec.trivia).map(triviaMember))])
	];
	return { members: lines, after };
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
	readonly hoisted: readonly string[];
	readonly prelude: string[];
	readonly members: string[];
	readonly tail: readonly string[];
	readonly postlude: string[];
}

function hoistedWrapper(plan: ListViewPlan, prefix: string, used: boolean): { readonly ref: string; readonly hoisted: readonly string[] } {
	return plan.wrapper === undefined || !used ? { ref: 'undefined', hoisted: [] } : { ref: `${prefix}$wrapper`, hoisted: [`const ${prefix}$wrapper = ${plan.wrapper};`] };
}

export function listReadLines(prefix: string, owner: string | undefined, elements: string, wrapper: string): readonly string[] {
	const receiver = owner === undefined ? 'object' : `{ readonly ${owner}: () => unknown }`;
	const list = owner === undefined ? 'this' : `this.${owner}()`;
	return [`function ${prefix}$listRead(this: ${receiver}): readonly unknown[] {`, `  return listItems(ownerElements(${list}, ${JSON.stringify(elements)}), ${wrapper});`, '}'];
}

export function listReadPostlude(prefix: string): string {
	return `  holdReadItems(node, ${prefix}$listRead);`;
}

function optionMember(key: string, value: string): string {
	return key === 'separator' ? `    separator: () => ${value},` : `    ${key}: ${value},`;
}

export function ownerViewParts(plan: ListViewPlan, storage: string, accessor: string, environment: 'factory' | 'wrap', prefix: string): ListViewParts {
	const wrapper = hoistedWrapper(plan, prefix, environment === 'wrap');
	const options = plan.options.map((option) =>
		environment !== 'factory' && option.key === 'separator'
			? optionMember(option.key, `(node.${accessor}() as { readonly separator?: () => unknown } | null | undefined)?.separator?.()`)
			: optionMember(option.key, `listOption(listView.list, ${JSON.stringify(option.key)}, ${option.default})`)
	);
	return {
		hoisted: environment === 'factory' ? wrapper.hoisted : [...wrapper.hoisted, ...listReadLines(prefix, accessor, plan.elements, wrapper.ref)],
		prelude:
			environment === 'factory'
				? [
						`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)});`,
						`  if (listView.length === undefined) refuseReadStub(${JSON.stringify(storage)});`
					]
				: [`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)}, (list) => (isCoordinate(list) ? readNode(tree, list) : hydrate(list, tree)));`],
		members: ['    length: listView.length,', ...LIST_SURFACE_LINES, ...options],
		tail: LIST_SYMBOL_LINES,
		postlude: [
			environment === 'factory'
				? '  holdListItems(node, heldItems(listView.list));'
				: `  holdReadItems(node, ownerRead(listView, (value) => hydrate(value, tree), ${wrapper.ref}, ${prefix}$listRead));`
		]
	};
}

export type ListStored = { readonly elements: string; readonly listed?: string } | { readonly length: string };

function selfListOption(key: string, environment: 'factory' | 'wrap'): string {
	return environment === 'factory' ? `_${key}` : `(data as { readonly _${key}?: unknown })._${key}`;
}

export function listSelfViewParts(
	plan: ListViewPlan,
	stored: ListStored,
	elementsReader: string,
	environment: 'factory' | 'wrap',
	prefix: string
): ListViewParts {
	const built = environment === 'factory' && 'elements' in stored;
	const wrapper = hoistedWrapper(plan, prefix, true);
	const options = plan.options.map((option) =>
		environment !== 'factory' && option.key === 'separator'
			? optionMember(option.key, 'listSeparatorOf(node)')
			: optionMember(option.key, `${selfListOption(option.key, environment)} ?? ${option.default}`)
	);
	return {
		hoisted: built ? wrapper.hoisted : [...wrapper.hoisted, ...listReadLines(prefix, undefined, elementsReader, wrapper.ref)],
		prelude:
			'elements' in stored
				? [`  const listedItems = storedElements(${stored.elements});`, '  const listedLength = listedItems.length;']
				: [`  const listedLength = ${stored.length};`],
		members: ['    length: listedLength,', ...LIST_SURFACE_LINES, ...options],
		tail: LIST_SYMBOL_LINES,
		postlude: [built ? `  holdBuiltItems(node, ${stored.listed ?? 'listedItems'}${plan.wrapper === undefined ? '' : `, ${wrapper.ref}`});` : listReadPostlude(prefix)]
	};
}
