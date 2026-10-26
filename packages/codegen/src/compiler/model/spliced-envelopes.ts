import type { NodeMap } from '../types.ts';
import { AssembledEnvelope, type AssembledNode, type AssembledNonterminal } from './node-map.ts';

export function stampSplicedEnvelopes(nodeMap: NodeMap): void {
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			const envelope = slot.inlinedFrom === undefined ? undefined : nodeMap.nodes.get(slot.inlinedFrom);
			if (isMaterializedHiddenEnvelope(envelope)) slot.splicedEnvelope = envelope.kind;
		}
	}
}

export function splicedEnvelopeOf(slot: AssembledNonterminal, nodeMap: NodeMap): AssembledNode | undefined {
	return slot.splicedEnvelope === undefined ? undefined : nodeMap.nodes.get(slot.splicedEnvelope);
}

function isMaterializedHiddenEnvelope(node: AssembledNode | undefined): node is AssembledEnvelope {
	return node instanceof AssembledEnvelope && node.modelType === 'envelope' && node.surfaceHidden && node.irKey !== undefined && node.slots.length === 1;
}
