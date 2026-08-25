/**
 * Supertype membership flattened through nested supertypes.
 *
 * A supertype arm may itself be a supertype (python's
 * `expression → primary_expression → parenthesized_expression`), so
 * `subtypeNames` — the immediate arm list — answers "is this an arm of THIS
 * union", never "does this union reach that kind". Both facts below come from
 * one walk, so the two vocabularies of a subtype reference can never drift:
 *
 *   - the storage identity of every kind reachable at any depth, returned to
 *     the callers that ask reachability questions about the model;
 *   - the parse (`$type`) identity of the same set, stamped on the supertype
 *     as `transitiveParseKinds` for wrap's storage-key routing — hidden arms
 *     normalized to the visible name tree-sitter actually reports.
 */

import type { AssembledNode, NodeOrTerminal } from './model/node-map.ts';

export function stampSupertypeClosures(
	nodes: ReadonlyMap<string, AssembledNode>
): ReadonlyMap<string, ReadonlySet<string>> {
	const storageClosures = new Map<string, ReadonlySet<string>>();
	for (const [, root] of nodes) {
		if (root.modelType !== 'supertype') continue;
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
			if (node?.modelType !== 'supertype') {
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
