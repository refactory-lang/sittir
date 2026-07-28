/**
 * validate/rule-lookup.ts — shared rule-kind inventory.
 *
 * `validate-renderable` needs to answer "which kinds have a rule emit
 * path?" This module builds the inventory from a NodeMap — the
 * authoritative output of Assemble — rather than walking the generated
 * YAML's `rules:` map directly: that view is lossy (variant subtypes,
 * supertypes, and leaves that render via `node.text` aren't in the YAML at
 * all) and would be circular, since the YAML itself is the thing under
 * test.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';

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
		/* Hidden `_X` kinds whose `userFacing` flag is set are the
		   sittir-internal identity for CST kind `X` (via alias). node-types.json
		   lists `X`; the renderable / templated sets must include it so
		   validation passes. */
		if (node.userFacing && kind.startsWith('_')) {
			const visible = kind.slice(1);
			kinds.add(visible);
			if (p !== 'none') renderable.add(visible);
			if (p === 'template') templated.add(visible);
			path.set(visible, p);
		}
	}

	return { kinds, renderable, templated, path };
}

function classify(node: AssembledNode): RenderKindPath {
	switch (node.modelType) {
		case 'branch':
		case 'group':
		/* TEMPORARY: 'separatedList' shares 'branch'/'group's template render
		   path for byte-identical output pending real per-instance separator
		   capture — see isSlotBearingCompound's doc comment (emitters/shared.ts). */
		case 'separatedList':
			return 'template';
		case 'pattern':
		case 'keyword':
		case 'enum':
			return 'text';
		case 'supertype':
			return 'dispatch';
		case 'token':
			return 'none';
		default:
			return 'none';
	}
}
