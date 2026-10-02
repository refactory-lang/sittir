import { emptyForms, innerGapsKeyed } from '../compiler/model/trivia.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { ListViewPlan, SeatPlan } from './factories.ts';

export interface SetterEntry {
	readonly name: string;
	readonly params: string;
	readonly body: string;
}

export interface InnerPositions {
	readonly inner: boolean;
	readonly keyed: boolean;
}

export interface NodeMemberSpec {
	readonly setters?: readonly SetterEntry[];
	readonly accessors: readonly { readonly name: string; readonly read: string }[];
	readonly inner: InnerPositions;
	readonly extra?: readonly string[];
}

export function innerPositionsOf(kind: string, nodeMap: NodeMap): InnerPositions {
	const inner = emptyForms(nodeMap).has(kind);
	return { inner, keyed: inner && innerGapsKeyed(nodeMap) };
}

export function triviaInnerImports(nodeMap: NodeMap): readonly string[] {
	if (emptyForms(nodeMap).size === 0) return [];
	return innerGapsKeyed(nodeMap) ? ['triviaInner', 'triviaInnerAt'] : ['triviaInner'];
}

export function withEntry(entry: SetterEntry): string {
	return `      ${entry.name}: (${entry.params}) => rebuilt(node, handle, () => ${entry.body}),`;
}

export function nodeMemberLines(spec: NodeMemberSpec): string[] {
	const lines: string[] = [];
	if (spec.setters !== undefined) {
		lines.push('    $with: {', ...spec.setters.map(withEntry), '    },');
	}
	for (const accessor of spec.accessors) lines.push(`    ${accessor.name}: () => ${accessor.read},`);
	lines.push(...(spec.extra ?? []));
	lines.push(
		'    $render: () => renderText(handle, node),',
		'    $toEdit: (startOrRange: number | StringIndexRange, endPos?: number) => toEditAt(renderText(handle, node), startOrRange, endPos),',
		'    $replace: (target: { range(): StringIndexRange }) => toEditAt(renderText(handle, node), target.range()),',
		'    $trivia: {',
		"      leading: (...items: unknown[]) => triviaSide(node, handle, 'leading', items),",
		"      trailing: (...items: unknown[]) => triviaSide(node, handle, 'trailing', items),",
		...(spec.inner.inner ? ['      inner: (...items: unknown[]) => triviaInner(node, handle, items),'] : []),
		...(spec.inner.keyed ? ['      innerAt: (gap: string, ...items: unknown[]) => triviaInnerAt(node, handle, gap, items),'] : []),
		'    },',
		'    $engine: handle && (() => handle.current)'
	);
	return lines;
}

export function seatedSetters(setters: readonly SetterEntry[], plan: SeatPlan): SetterEntry[] {
	return setters.map((entry) => {
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
}

export interface ListViewParts {
	readonly prelude: string[];
	readonly members: string[];
	readonly postlude: string[];
}

export function ownerViewParts(plan: ListViewPlan, storage: string, accessor: string, environment: 'factory' | 'wrap'): ListViewParts {
	const wrapper = plan.wrapper ?? 'undefined';
	const options = plan.options.map(
		(option) => `    ${option.key}: listOption(listView.list, ${JSON.stringify(option.key)}, ${option.default}),`
	);
	const shared = [
		'    ...LIST_METHODS,',
		'    [Symbol.iterator]: listIterator,',
		'    [Symbol.isConcatSpreadable]: true,',
		'    [Symbol.unscopables]: Array.prototype[Symbol.unscopables],',
		...options
	];
	if (environment === 'factory') {
		return {
			prelude: [
				`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)});`,
				`  const listedItems = listView.stored === undefined ? undefined : listItems(ownerElements(listView.list, ${JSON.stringify(plan.elements)}), ${wrapper});`
			],
			members: ['    length: listedItems?.length,', '    [LIST_ITEMS]: listedItems,', ...shared],
			postlude: [
				`  if (listedItems === undefined) readStubLength(node, ${JSON.stringify(storage)});`,
				'  else for (let index = 0; index < listedItems.length; index++) (node as Record<number, unknown>)[index] = listedItems[index];'
			]
		};
	}
	return {
		prelude: [`  const listView = ownerView(${storage}, ${JSON.stringify(plan.count)}, tree);`],
		members: [
			'    length: listView.stored?.length,',
			'    [LIST_ITEMS]: undefined,',
			`    [LIST_READ]: () => listItems(ownerElements(node.${accessor}(), ${JSON.stringify(plan.elements)}), ${wrapper}),`,
			...shared
		],
		postlude: ['  defineListIndices(node, listView.stored?.length ?? 0);']
	};
}

export function listSelfViewParts(
	plan: ListViewPlan,
	content: string,
	elementsReader: string,
	environment: 'factory' | 'wrap'
): ListViewParts {
	const wrapper = plan.wrapper ?? 'undefined';
	const options = plan.options.map((option) => `    ${option.key}: _${option.key} ?? ${option.default},`);
	const shared = [
		'    ...LIST_METHODS,',
		'    [Symbol.iterator]: listIterator,',
		'    [Symbol.isConcatSpreadable]: true,',
		'    [Symbol.unscopables]: Array.prototype[Symbol.unscopables],',
		...options
	];
	return {
		prelude: [`  const listedStored = storedElements(${content});`],
		members: [
			'    length: listedStored.length,',
			'    [LIST_ITEMS]: undefined,',
			`    [LIST_READ]: () => listItems(${environment === 'factory' ? 'listedStored' : `ownerElements(node, ${JSON.stringify(elementsReader)})`}, ${wrapper}),`,
			...shared
		],
		postlude: ['  defineListIndices(node, listedStored.length);']
	};
}
