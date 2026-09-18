import type { NodeMap } from '../types.ts';
import { AssembledEnum, AssembledPolymorph, AssembledSupertype } from './node-map.ts';
import { SYMBOL } from '../../types/rule-types.ts';
import { publicKindName } from './render-rules.ts';

export type SupertypeMembers = ReadonlyMap<string, readonly string[]>;

export function buildSupertypeMembersMap(nodeMap: NodeMap): Map<string, string[]> {
	return buildMembersMap(nodeMap, (node) => (node instanceof AssembledSupertype ? node.subtypeNames : null));
}

export function supertypeMembersByPublicName(nodeMap: NodeMap): SupertypeMembers {
	const out = new Map<string, string[]>();
	for (const [union, members] of buildMembersMap(nodeMap, unionMemberNames)) {
		out.set(publicKindName(union), [...new Set(members.map(publicKindName))]);
	}
	return out;
}

function buildMembersMap(nodeMap: NodeMap, directMembers: (node: unknown) => readonly string[] | null): Map<string, string[]> {
	const expandMembers = (kind: string, seen: Set<string>): string[] => {
		if (seen.has(kind)) return [];
		seen.add(kind);
		const node = nodeMap.nodes.get(kind);
		if (!node) return [kind];
		if (node instanceof AssembledEnum) return node.resolvedKinds.length > 0 ? [...node.resolvedKinds] : [kind];
		const direct = directMembers(node);
		if (direct === null) return [kind];
		const members = new Set<string>();
		const transitive = node instanceof AssembledSupertype;
		for (const subtype of direct) {
			members.add(subtype);
			if (subtype.startsWith('_')) members.add(subtype.slice(1));
			if (!transitive) continue;
			for (const member of expandMembers(subtype, seen)) {
				members.add(member);
				if (member.startsWith('_')) members.add(member.slice(1));
			}
		}
		return [...members];
	};

	const out = new Map<string, string[]>();
	for (const [kind, node] of nodeMap.nodes) {
		if (directMembers(node) === null) continue;
		out.set(kind, expandMembers(kind, new Set()));
	}
	return out;
}

function unionMemberNames(node: unknown): readonly string[] | null {
	if (node instanceof AssembledSupertype) return node.subtypeNames;
	if (node instanceof AssembledPolymorph) return node.arms.flatMap((arm) => (arm.type === SYMBOL ? [arm.name] : []));
	return null;
}
