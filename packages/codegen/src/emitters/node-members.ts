import { LIST_VIEW_MEMBERS } from '@sittir/common/utils';
import { emptyForms } from '../compiler/model/trivia.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNonterminal } from '../compiler/model/node-map.ts';
import { spelledReadExpr } from './shared.ts';
import type { GroupSeatHint, ListViewPlan, SeatPlan } from './factories.ts';

export interface SetterEntry {
	readonly name: string;
	readonly params: string;
	readonly body: string;
	readonly reads?: readonly string[];
}

export interface HeldRead {
	readonly local: string;
	readonly line: string;
}

export interface TriviaPositions {
	readonly inner: boolean;
}

export interface StoredAccessor {
	readonly name: string;
	readonly read: string;
	readonly hydrates?: 'one' | 'many';
	readonly slot?: AssembledNonterminal;
}

export type HeldKey = 'INPUT' | 'OPTIONS' | 'READ_TREE';

export interface HeldLocal {
	readonly local: string;
	readonly type: string;
	readonly key: HeldKey;
}

export interface SharedSetters {
	readonly kind: string;
	readonly prefix: string;
	readonly entries: readonly SetterEntry[];
	readonly held: readonly HeldLocal[];
	readonly readers?: readonly string[];
}

export interface NodeMemberSpec {
	readonly setters?: SharedSetters;
	readonly accessors: readonly StoredAccessor[];
	readonly trivia: TriviaPositions | undefined;
	readonly extra?: readonly string[];
	readonly tail?: readonly string[];
	readonly parsed?: true;
	readonly root?: boolean;
	readonly text?: string;
}

export const ROOT_ERRORS_LINE = '    $errors: (data as { readonly $errors?: unknown }).$errors,';
export const ROOT_SAVE_LINE = '    $save: handleSave,';

export function triviaPositionsOf(kind: string, nodeMap: NodeMap): TriviaPositions | undefined {
	return nodeMap.nodes.get(kind)?.triviaInterior ? undefined : { inner: emptyForms(nodeMap).has(kind) };
}

export function triviaInnerImports(nodeMap: NodeMap): readonly string[] {
	if (emptyForms(nodeMap).size === 0) return [];
	return ['objectInner'];
}

function accessorRead(accessor: StoredAccessor): string {
	if (accessor.hydrates === undefined) return accessor.read;
	const read = `${accessor.hydrates === 'many' ? 'hydrateStoredSlots' : 'hydrateStoredSlot'}(node, ${JSON.stringify(accessor.read)})`;
	return accessor.slot === undefined ? read : spelledReadExpr(accessor.slot, read);
}

export type TriviaSide = 'leading' | 'trailing' | 'inner';

export function triviaSides(trivia: TriviaPositions): readonly TriviaSide[] {
	return trivia.inner ? ['leading', 'trailing', 'inner'] : ['leading', 'trailing'];
}

export function receivedMembers(member: '$with' | '$trivia', entries: readonly string[]): string {
	return `  node.${member} = { ${[...entries, '[RECEIVER]: node'].join(', ')} };`;
}

function sharedSetterName(prefix: string, entry: SetterEntry): string {
	return `${prefix}$with$${entry.name}`;
}

function appliedSetter(entry: SetterEntry): string {
	return `applySetter(args, (${entry.params}) => rebuilt(node, handle, () => ${entry.body}))`;
}

function withLines(name: string, kind: string, nodeType: string, prelude: readonly string[], setters: readonly SetterEntry[], caseLines: (entry: SetterEntry) => readonly string[] = () => []): string[] {
	const unread = setters.length === 0 ? '_' : '';
	return [
		`function ${name}(${unread}node: ${nodeType}, setter: string, ${unread}args: readonly unknown[]): unknown {`,
		...(setters.length === 0
			? []
			: [
					...prelude,
					'  switch (setter) {',
					...setters.flatMap((entry) => {
						const lines = caseLines(entry);
						const applied = `      return ${appliedSetter(entry)};`;
						return lines.length === 0 ? [`    case ${JSON.stringify(entry.name)}:`, applied] : [`    case ${JSON.stringify(entry.name)}: {`, ...lines.map((line) => `    ${line}`), applied, '    }'];
					}),
					'  }'
				]),
		`  throw new Error(\`${kind} has no $with.\${setter}\`);`,
		'}'
	];
}

export function builtWithLines(name: string, kind: string, inputs: readonly HeldRead[], readers: readonly string[], setters: readonly SetterEntry[]): string[] {
	return withLines(name, kind, 'object', ['  const handle = handleOf(node as RecordHandle);', ...readers], setters, (entry) => {
		const read = inputs.filter(({ local }) => entry.reads === undefined || entry.reads.includes(local));
		return read.length === 0 ? [] : ['  const inputs = builtInputs(node);', ...read.map(({ line }) => line)];
	});
}

function sharedSetterLines(setters: SharedSetters): string[] {
	const dispatch = `${setters.prefix}$with`;
	return [
		...withLines(dispatch, setters.kind, 'Held', ['  const handle = node[HANDLE];', ...setters.held.map((field) => `  const ${field.local} = node[${field.key}] as ${field.type};`), ...(setters.readers ?? [])], setters.entries),
		...setters.entries.flatMap((entry) => [
			`function ${sharedSetterName(setters.prefix, entry)}(this: Received<Held>, ...args: unknown[]): unknown {`,
			`  return ${dispatch}(receiverOf(this, ${JSON.stringify(`$with.${entry.name}`)}), ${JSON.stringify(entry.name)}, args);`,
			'}'
		])
	];
}

const OBJECT_TRIVIA: Readonly<Record<TriviaSide, string>> = { leading: 'objectLeading', trailing: 'objectTrailing', inner: 'objectInner' };

export interface NodeMemberParts {
	readonly members: readonly string[];
	readonly after: readonly string[];
	readonly hoisted: readonly string[];
}

export function nodeMemberParts(spec: NodeMemberSpec): NodeMemberParts {
	const setters = spec.setters;
	const sets = setters !== undefined && setters.entries.length > 0;
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
		...(spec.root === true ? [ROOT_SAVE_LINE, ...(spec.parsed ? [ROOT_ERRORS_LINE] : [])] : []),
		...(spec.tail ?? []),
		...(spec.parsed ? ['    [TREE]: treeTokenOf(data) ?? null,'] : []),
		`    [SOURCE]: ${spec.parsed ? 'treeTokenOf(data) === undefined ? Source.Factory : Source.Ts' : 'Source.Factory'},`,
		...(sets || spec.trivia !== undefined ? ['    [HANDLE]: handle,'] : []),
		...(sets ? setters.held.map((field) => `    [${field.key}]: ${field.local},`) : []),
		'    [Symbol.dispose]: releaseNothing'
	);
	const after = [
		...(setters === undefined ? [] : [receivedMembers('$with', setters.entries.map((entry) => `${entry.name}: ${sharedSetterName(setters.prefix, entry)}`))]),
		...(spec.trivia === undefined ? [] : [receivedMembers('$trivia', triviaSides(spec.trivia).map((side) => `${side}: ${OBJECT_TRIVIA[side]}`))])
	];
	return { members: lines, after, hoisted: sets ? sharedSetterLines(setters) : [] };
}

const readGroupName = (slot: string): string => `readGroup_${slot}`;

export function seatedSetters(setters: readonly SetterEntry[], plan: SeatPlan): SetterEntry[] {
	const seated = setters.map((entry) => {
		const base = `(${entry.params}) => ${entry.body}`;
		const element = plan.elements.find((candidate) => candidate.slot === entry.name);
		const slot = plan.slots.find((candidate) => candidate.slot === entry.name);
		const elementSet = element === undefined ? base : `(...args: never[]) => elementsWith(args, { slot: ${JSON.stringify(entry.name)}, ${element.spec} }, ${base})`;
		if (slot !== undefined) {
			return { name: entry.name, params: '...args: unknown[]', body: `listSlotWith(args, { ${slot.spec} }, ${elementSet})`, reads: entry.reads };
		}
		if (element !== undefined) {
			return { name: entry.name, params: '...args: unknown[]', body: `elementsWith(args, { slot: ${JSON.stringify(entry.name)}, ${element.spec} }, ${base})`, reads: entry.reads };
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
				body: `seatWith(${spec}, ${JSON.stringify(key.name)}, args, ${base}, () => ${readGroupName(hint.slot)}.call(node))`,
				reads: seat.reads
			});
		}
	}
	return [...seated, ...keyed];
}

export function groupSeatReaders(plan: SeatPlan, readOf: (hint: GroupSeatHint) => string): string[] {
	return plan.groups.filter(({ hint }) => hint.keys.length > 0).map(({ hint }) => `  const ${readGroupName(hint.slot)} = () => ${readOf(hint)};`);
}

export function groupSeatMembers(plan: SeatPlan, readOf: (hint: GroupSeatHint) => string, absentOf: (stored: string) => string = (stored) => `${stored} === undefined`): string[] {
	return plan.groups.flatMap(({ hint }) =>
		hint.keys.map((key) => `    ${key.name}: ${absentOf(hint.stored)} ? undefined : () => groupField(${readOf(hint)}, ${JSON.stringify(key.field ?? key.name)}),`)
	);
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
