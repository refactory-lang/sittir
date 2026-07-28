/**
 * validate-renderable — every named kind in tree-sitter's node-types.json
 * must be renderable by @sittir/legacy-core.
 *
 * A kind is renderable when one of these holds:
 *
 *   1. Supertype   — has `subtypes` in node-types.json. Supertypes are
 *                    abstract; `render()` dispatches to the concrete subtype,
 *                    so the supertype itself never reaches the rules lookup.
 *
 *   2. Pure leaf   — has no `fields` AND no `children` in node-types.json.
 *                    `render()` returns `node.text` directly without any
 *                    template lookup.
 *
 *   3. Has rule    — kind appears in the `rules` map of templates directory
 *                    (either as a top-level entry or as a variant target).
 *
 * Anything else is un-renderable: calling `render()` on an instance will
 * throw `No render rule for '<kind>'`. That's a codegen regression we
 * want surfaced as a first-class validation error.
 */

import { loadRawEntries } from './node-types-loader.ts';
import type { RawNodeEntry } from './node-types-loader.ts';
import type { NodeMap } from '../compiler/types.ts';
import { buildRuleLookup } from './rule-lookup.ts';

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface RenderableResult {
	grammar: string;
	total: number;
	renderable: number;
	missing: MissingKind[];
}

export interface MissingKind {
	kind: string;
	reason: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function validateRenderableFromNodeMap(grammar: string, nodeMap: NodeMap): RenderableResult {
	const rawEntries = loadRawEntries(grammar);
	const lookup = buildRuleLookup(nodeMap);

	const missing: MissingKind[] = [];
	let renderable = 0;
	let total = 0;

	for (const entry of rawEntries) {
		if (!isNamedEntry(entry)) continue;
		total++;

		if (lookup.renderable.has(entry.type) || isPureLeafEntry(entry)) {
			renderable++;
		} else {
			missing.push({
				kind: entry.type,
				reason:
					`no NodeMap render path for '${entry.type}' (kind is ` +
					(lookup.kinds.has(entry.type)
						? `modelType=${lookup.path.get(entry.type) ?? 'none'}`
						: `absent from NodeMap`) +
					')'
			});
		}
	}

	return { grammar, total, renderable, missing };
}

function isPureLeafEntry(entry: RawNodeEntry): boolean {
	if (entry.subtypes && entry.subtypes.length > 0) return false;
	const hasFields = entry.fields !== undefined && Object.keys(entry.fields).length > 0;
	const hasChildren = entry.children !== undefined;
	return !hasFields && !hasChildren;
}

// ---------------------------------------------------------------------------
// Entry filtering
// ---------------------------------------------------------------------------

function isNamedEntry(entry: RawNodeEntry): boolean {
	return entry.named;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatRenderableReport(result: RenderableResult): string {
	const lines: string[] = [];
	const icon = result.missing.length === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.renderable}/${result.total} kinds renderable` + ` (${result.missing.length} un-renderable)`
	);
	if (result.missing.length > 0) {
		for (const m of result.missing) {
			lines.push(`    x ${m.kind}: ${m.reason}`);
		}
	}
	return lines.join('\n');
}
