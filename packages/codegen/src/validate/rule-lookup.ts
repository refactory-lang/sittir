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
import { allSlotsOf, isNodeRef, storageKindOfRef } from '../compiler/model/node-map.ts';

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

	// Alias labels: a reference site may surface a kind under a different
	// CST name (`alias($._import_list, $.names)`). node-types.json lists the
	// LABEL, while storage, wrap, and render are all keyed by the source
	// kind (wrap normalizes the label's raw key into the source's storage
	// key), so a label is renderable exactly when its source kind is. Read
	// the stamped per-reference pair (`parseKind` = label, `node` = storage)
	// rather than re-deriving it from spelling — a label need not be the
	// source's stripped name. A label that is itself a real kind keeps its
	// own classification.
	const labeledSources = new Set<string>();
	const addLabel = (label: string, source: string): void => {
		// A bare (unaliased) reference carries no label — only a differing
		// label records the source as labeled.
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
		for (const slot of allSlotsOf(node)) {
			for (const value of slot.values) {
				if (!isNodeRef(value) || value.parseKind?.name === undefined) continue;
				addLabel(value.parseKind.name, storageKindOfRef(value.node));
			}
		}
	}
	// User-facing hidden kinds reached by no labeled reference — polymorph
	// variant children (dispatched, never a slot value) and top-level alias
	// bodies. Their CST name is the stripped hidden name by construction:
	// enrich's mints register the hidden rule AS `_<visibleName>`, and a
	// base-authored alias body surfaces under its own stripped name. A
	// labeled reference, when one exists, takes precedence above.
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.userFacing || !kind.startsWith('_') || labeledSources.has(kind)) continue;
		addLabel(kind.slice(1), kind);
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
