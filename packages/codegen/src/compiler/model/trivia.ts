import type { NodeMap } from '../types.ts';
import { AssembledSupertype } from './node-map.ts';

const triviaKindsByNodeMap = new WeakMap<NodeMap, ReadonlySet<string>>();
const lineTerminatedByNodeMap = new WeakMap<NodeMap, Map<string, boolean | undefined>>();

export function triviaKinds(nodeMap: NodeMap): ReadonlySet<string> {
	const cached = triviaKindsByNodeMap.get(nodeMap);
	if (cached !== undefined) return cached;
	const kinds = new Set<string>();
	const add = (kind: string): void => {
		const node = nodeMap.nodes.get(kind);
		if (node === undefined || kinds.has(kind)) return;
		kinds.add(kind);
		if (node instanceof AssembledSupertype) for (const subtype of node.subtypeNames) add(subtype);
	};
	for (const extra of nodeMap.extras ?? []) add(extra);
	triviaKindsByNodeMap.set(nodeMap, kinds);
	return kinds;
}

export function lineTerminated(nodeMap: NodeMap, kind: string): boolean | undefined {
	let byKind = lineTerminatedByNodeMap.get(nodeMap);
	if (byKind === undefined) lineTerminatedByNodeMap.set(nodeMap, (byKind = new Map()));
	if (!byKind.has(kind)) byKind.set(kind, verdict(resolvedLineEnds(nodeMap, kind, new Set())));
	return byKind.get(kind);
}

type ResolvedLineEnd = 'open' | 'closed' | 'empty' | 'unknown';

function resolvedLineEnds(nodeMap: NodeMap, kind: string, seen: ReadonlySet<string>): ResolvedLineEnd[] {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || seen.has(kind)) return ['unknown'];
	const within = new Set([...seen, kind]);
	return node.lineEnds.flatMap((end) => (typeof end === 'string' ? [end] : resolvedLineEnds(nodeMap, end.symbol, within)));
}

function verdict(ends: readonly ResolvedLineEnd[]): boolean | undefined {
	if (ends.includes('closed') || ends.includes('empty')) return false;
	if (ends.includes('unknown')) return undefined;
	return ends.length > 0;
}
