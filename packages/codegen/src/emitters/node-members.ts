import { emptyForms, innerGapsKeyed } from '../compiler/model/trivia.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeatPlan } from './factories.ts';

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
