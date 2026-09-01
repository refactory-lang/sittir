import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import { AssembledKeyword, isNodeRef, storageKindOfRef } from '../compiler/model/node-map.ts';

export type RenderKindPath = 'template' | 'text' | 'dispatch' | 'none';

export interface RuleLookup {
	readonly kinds: ReadonlySet<string>;
	readonly renderable: ReadonlySet<string>;
	readonly templated: ReadonlySet<string>;
	readonly path: ReadonlyMap<string, RenderKindPath>;
}

export function buildRuleLookup(nodeMap: NodeMap): RuleLookup {
	const kinds = new Set<string>();
	const renderable = new Set<string>();
	const templated = new Set<string>();
	const path = new Map<string, RenderKindPath>();

	for (const [kind, node] of nodeMap.nodes) {
		kinds.add(kind);
		const p = classify(node);
		path.set(kind, p);
		if (p !== 'none') renderable.add(kind);
		if (p === 'template') templated.add(kind);
	}

	const labeledSources = new Set<string>();
	const addLabel = (label: string, source: string): void => {
		if (label === source) return;
		labeledSources.add(source);
		if (kinds.has(label)) return;
		const p = path.get(source) ?? 'none';
		kinds.add(label);
		path.set(label, p);
		if (p !== 'none') renderable.add(label);
		if (p === 'template') templated.add(label);
	};
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			for (const value of slot.values) {
				if (!isNodeRef(value) || value.parseKind?.name === undefined) continue;
				addLabel(value.parseKind.name, storageKindOfRef(value.node));
			}
		}
	}
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.userFacing || !kind.startsWith('_') || labeledSources.has(kind)) continue;
		addLabel(kind.slice(1), kind);
	}

	return { kinds, renderable, templated, path };
}

function classify(node: AssembledNode): RenderKindPath {
	switch (node.modelType) {
		case 'branch':
		case 'envelope':
		case 'list':
			return 'template';
		case 'polymorph':
			return 'template';
		case 'supertype':
			return 'dispatch';
		case 'pattern':
		case 'enum':
			return 'text';
		case 'token':
			return node instanceof AssembledKeyword ? 'text' : 'none';
		default:
			return 'none';
	}
}
