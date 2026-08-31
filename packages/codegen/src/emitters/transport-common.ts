import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNonterminal } from '../compiler/model/node-map.ts';
import { AssembledSupertype, isNodeRef, storageKindOfRef } from '../compiler/model/node-map.ts';

export type SlotClass =
	| { readonly tag: 'concrete'; readonly kind: string; readonly typeName: string }
	| { readonly tag: 'supertype'; readonly supertypeName: string }
	| { readonly tag: 'heterogeneous'; readonly useBox?: boolean };

export function classifySlot(
	kinds: readonly string[],
	supertypeMap: ReadonlyMap<string, ReadonlySet<string>> = new Map()
): SlotClass {
	if (kinds.length === 1) {
		const kind = kinds[0]!;
		return { tag: 'concrete', kind, typeName: kind };
	}
	if (kinds.length === 0) {
		return { tag: 'heterogeneous' };
	}
	const kindSet = new Set(kinds);
	let bestMatch: { supertypeName: string; size: number } | undefined;
	for (const [supertypeName, subtypes] of supertypeMap) {
		if (!coversExactly(kindSet, subtypes)) continue;
		if (bestMatch === undefined || subtypes.size < bestMatch.size) {
			bestMatch = { supertypeName, size: subtypes.size };
		}
	}
	if (bestMatch !== undefined) {
		return { tag: 'supertype', supertypeName: bestMatch.supertypeName };
	}
	return { tag: 'heterogeneous' };
}

function coversExactly(kindSet: ReadonlySet<string>, subtypes: ReadonlySet<string>): boolean {
	return kindSet.size === subtypes.size && [...kindSet].every((k) => subtypes.has(k));
}

function addVisibleAliasNameOfHiddenKind(out: Set<string>, nodeMap: NodeMap, kind: string): void {
	const aliasTarget = nodeMap.aliasedHiddenKinds?.get(kind);
	if (aliasTarget !== undefined) out.add(aliasTarget);
}

export function buildSupertypeTransportSet(nodeMap: NodeMap): Map<string, ReadonlySet<string>> {
	const result = new Map<string, ReadonlySet<string>>();
	const expandSupertypeKinds = (kind: string, seen: Set<string> = new Set()): Set<string> => {
		if (seen.has(kind)) return new Set();
		seen.add(kind);
		const members = new Set<string>([kind]);
		const node = nodeMap.nodes.get(kind);
		if (!(node instanceof AssembledSupertype)) return members;
		for (const subtype of node.subtypeNames) {
			members.add(subtype);
			for (const nested of expandSupertypeKinds(subtype, seen)) members.add(nested);
		}
		return members;
	};
	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		result.set(node.typeName, expandSupertypeKinds(node.kind));
	}
	return result;
}

function expandWrapRuntimeKinds(kind: string, nodeMap: NodeMap | undefined, seen: Set<string>): string[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	if (!nodeMap) return [kind];
	const node = nodeMap.nodes.get(kind);
	if (!node) return [kind];
	if (node instanceof AssembledSupertype) {
		const members = new Set<string>([kind]);
		for (const subtype of node.subtypeNames) {
			members.add(subtype);
			for (const member of expandWrapRuntimeKinds(subtype, nodeMap, seen)) members.add(member);
		}
		return [...members];
	}
	return [kind];
}

export function acceptedTransportKinds(
	kind: string,
	nodeMap?: NodeMap,
	parseAliases?: Readonly<Record<string, string>>
): string[] {
	if (!nodeMap) return [kind];
	const node = nodeMap.nodes.get(kind);
	if (!node) return [kind];
	const out = new Set<string>([kind]);
	addVisibleAliasNameOfHiddenKind(out, nodeMap, kind);
	if (parseAliases) {
		for (const [target, source] of Object.entries(parseAliases)) {
			if (source === kind) out.add(target);
		}
	}
	return [...out];
}

export function deriveChildrenKinds(
	child: AssembledNonterminal,
	nodeMap?: NodeMap,
	seen: Set<string> = new Set()
): string[] {
	const kinds = new Set<string>();
	for (const v of child.values) {
		if (!isNodeRef(v)) continue;
		const kind = storageKindOfRef(v.node);
		for (const expanded of expandWrapRuntimeKinds(kind, nodeMap, seen)) kinds.add(expanded);
	}
	return [...kinds];
}
