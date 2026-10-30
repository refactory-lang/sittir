import { isTextEnum, resolveFieldStorageInfo } from '../../emitters/shared.ts';
import type { LeadEffect } from '../../dsl/verbs/effects.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { NodeMap } from '../types.ts';
import { AbstractAssembledCompound, AssembledList, isMultiple, valueParseKindsOf, type AssembledNonterminal } from './node-map.ts';

export type AccessorValueClass = 'boolean' | 'flags' | 'choice' | 'single' | 'list';

export interface AccessorClassClash {
	readonly name: string;
	readonly classes: ReadonlyMap<AccessorValueClass, readonly string[]>;
}

export function accessorValueClassOf(slot: AssembledNonterminal, nodeMap: NodeMap): AccessorValueClass {
	const info = resolveFieldStorageInfo(slot, nodeMap);
	if (info.kind === 'boolean') return 'boolean';
	if (info.kind === 'bitflag') return 'flags';
	if (isMultiple(slot)) return 'list';
	if (info.kind === 'kindEnum' || isTextEnum(info)) return 'choice';
	return 'single';
}

type LedLists = ReadonlyMap<string, string>;

function listItemsOf(kind: string, nodeMap: NodeMap, led: LedLists, seen: ReadonlySet<string> = new Set()): readonly string[] | undefined {
	const node = nodeMap.nodes.get(kind);
	if (!(node instanceof AbstractAssembledCompound) || seen.has(kind)) return undefined;
	const leadList = led.get(kind);
	if (leadList !== undefined) return listItemsOf(leadList, nodeMap, led, new Set([...seen, kind]));
	if (node instanceof AssembledList) return node.slots.filter(isMultiple).flatMap(valueParseKindsOf);
	const [slot, ...rest] = node.slots;
	if (slot === undefined || rest.length > 0) return undefined;
	if (isMultiple(slot)) return valueParseKindsOf(slot);
	const within = new Set([...seen, kind]);
	const values = valueParseKindsOf(slot);
	const items: string[] = [];
	for (const value of values) {
		const inner = listItemsOf(value, nodeMap, led, within);
		if (inner === undefined) return undefined;
		items.push(...inner);
	}
	return values.length > 0 ? items : undefined;
}

function holdsAContainer(slot: AssembledNonterminal, nodeMap: NodeMap, led: LedLists): boolean {
	const values = valueParseKindsOf(slot);
	const items = new Set(values.flatMap((value) => listItemsOf(value, nodeMap, led) ?? []));
	return values.length > 0 && values.every((value) => listItemsOf(value, nodeMap, led) !== undefined || items.has(value));
}

const isNodePair = (
	classes: ReadonlyMap<AccessorValueClass, unknown>,
	singles: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	led: LedLists
): boolean => classes.size === 2 && classes.has('single') && classes.has('list') && singles.every((slot) => holdsAContainer(slot, nodeMap, led));

export function accessorClassClashes(nodeMap: NodeMap, leads: readonly LeadEffect[] = []): AccessorClassClash[] {
	const led: LedLists = new Map(leads.map((lead) => [lead.receiver, lead.list]));
	const byName = new Map<string, Map<AccessorValueClass, string[]>>();
	const singlesByName = new Map<string, AssembledNonterminal[]>();
	for (const node of nodeMap.nodes.values()) {
		if (!(node instanceof AbstractAssembledCompound) || !node.userFacing) continue;
		for (const slot of node.slots) {
			const classes = byName.get(slot.propertyName) ?? byName.set(slot.propertyName, new Map()).get(slot.propertyName)!;
			const valueClass = accessorValueClassOf(slot, nodeMap);
			(classes.get(valueClass) ?? classes.set(valueClass, []).get(valueClass)!).push(node.kind);
			if (valueClass === 'single') (singlesByName.get(slot.propertyName) ?? singlesByName.set(slot.propertyName, []).get(slot.propertyName)!).push(slot);
		}
	}
	return [...byName]
		.filter(([name, classes]) => classes.size > 1 && !isNodePair(classes, singlesByName.get(name) ?? [], nodeMap, led))
		.map(([name, classes]) => ({ name, classes }));
}

export function accessorClassDiagnostics(nodeMap: NodeMap, grammar: string, leads: readonly LeadEffect[]): GrammarDiagnostic[] {
	return accessorClassClashes(nodeMap, leads).map(({ name, classes }) => ({
		scope: 'grammar',
		grammar,
		code: 'accessor-class-clash',
		severity: 'warning',
		canProceed: true,
		message: `accessor '${name}' holds ${[...classes].map(([valueClass, kinds]) => `${valueClass} (${kinds.join(', ')})`).join('; ')}; rename the choice side, or name the slot for what it holds`,
		details: { name, classes: Object.fromEntries(classes) }
	}));
}
