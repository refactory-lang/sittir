import { isTextEnum, resolveFieldStorageInfo } from '../../emitters/shared.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { NodeMap } from '../types.ts';
import { AbstractAssembledCompound, isMultiple, type AssembledNonterminal } from './node-map.ts';

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

const isNodePair = (classes: ReadonlyMap<AccessorValueClass, unknown>): boolean =>
	classes.size === 2 && classes.has('single') && classes.has('list');

export function accessorClassClashes(nodeMap: NodeMap): AccessorClassClash[] {
	const byName = new Map<string, Map<AccessorValueClass, string[]>>();
	for (const node of nodeMap.nodes.values()) {
		if (!(node instanceof AbstractAssembledCompound) || !node.userFacing) continue;
		for (const slot of node.slots) {
			const classes = byName.get(slot.propertyName) ?? byName.set(slot.propertyName, new Map()).get(slot.propertyName)!;
			const valueClass = accessorValueClassOf(slot, nodeMap);
			(classes.get(valueClass) ?? classes.set(valueClass, []).get(valueClass)!).push(node.kind);
		}
	}
	return [...byName].filter(([, classes]) => classes.size > 1 && !isNodePair(classes)).map(([name, classes]) => ({ name, classes }));
}

export function accessorClassDiagnostics(nodeMap: NodeMap, grammar: string): GrammarDiagnostic[] {
	return accessorClassClashes(nodeMap).map(({ name, classes }) => ({
		scope: 'grammar',
		grammar,
		code: 'accessor-class-clash',
		severity: 'warning',
		canProceed: true,
		message: `accessor '${name}' holds ${[...classes].map(([valueClass, kinds]) => `${valueClass} (${kinds.join(', ')})`).join('; ')}; rename the choice side, or name the slot for what it holds`,
		details: { name, classes: Object.fromEntries(classes) }
	}));
}
