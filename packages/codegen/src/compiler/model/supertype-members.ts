import type { NodeMap } from '../types.ts';
import { AssembledEnum, AssembledSupertype } from './node-map.ts';

export function buildSupertypeMembersMap(nodeMap: NodeMap): Map<string, string[]> {
	const expandMembers = (kind: string, seen: Set<string>): string[] => {
		if (seen.has(kind)) return [];
		seen.add(kind);
		const node = nodeMap.nodes.get(kind);
		if (!node) return [kind];
		if (node instanceof AssembledEnum) return node.resolvedKinds.length > 0 ? [...node.resolvedKinds] : [kind];
		if (!(node instanceof AssembledSupertype)) return [kind];
		const members = new Set<string>();
		for (const subtype of node.subtypeNames) {
			members.add(subtype);
			if (subtype.startsWith('_')) members.add(subtype.slice(1));
			for (const member of expandMembers(subtype, seen)) {
				members.add(member);
				if (member.startsWith('_')) members.add(member.slice(1));
			}
		}
		return [...members];
	};

	const out = new Map<string, string[]>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		out.set(kind, expandMembers(kind, new Set()));
	}
	return out;
}
