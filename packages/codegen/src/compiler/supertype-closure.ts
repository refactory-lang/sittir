import { AssembledSupertype } from './model/node-map.ts';
import type { AssembledNode, NodeOrTerminal } from './model/node-map.ts';

export function stampSupertypeClosures(
	nodes: ReadonlyMap<string, AssembledNode>
): ReadonlyMap<string, ReadonlySet<string>> {
	const storageClosures = new Map<string, ReadonlySet<string>>();
	for (const [, root] of nodes) {
		if (!(root instanceof AssembledSupertype)) continue;
		const seenLeaves = new Set<string>();
		const visitingSupertypes = new Set<string>();
		const storageKinds = new Set<string>();
		const out: NodeOrTerminal[] = [];
		const add = (parseKind: string, storageKind: string): void => {
			if (seenLeaves.has(parseKind)) return;
			seenLeaves.add(parseKind);
			out.push({
				node: { kind: 'unresolved-ref', name: storageKind },
				parseKind: { kind: 'unresolved-ref', name: parseKind },
				multiplicity: 'single'
			});
		};
		const visit = (name: string): void => {
			const normalized = name.startsWith('_') ? name.slice(1) : name;
			if (seenLeaves.has(normalized) || visitingSupertypes.has(normalized)) return;
			const node = nodes.get(name) ?? nodes.get(normalized);
			if (!(node instanceof AssembledSupertype)) {
				add(normalized, normalized);
				return;
			}
			visitingSupertypes.add(normalized);
			for (const [storageKind, parseKind] of Object.entries(node.subtypeParseNames ?? {})) add(parseKind, storageKind);
			for (const subtype of node.subtypeNames) {
				storageKinds.add(subtype);
				visit(subtype);
			}
			visitingSupertypes.delete(normalized);
		};
		visit(root.kind);
		root.transitiveParseKinds = out;
		storageClosures.set(root.kind, storageKinds);
	}
	return storageClosures;
}
