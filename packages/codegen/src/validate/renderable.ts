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
	/** Count of kinds that are renderable via one of the three paths. */
	renderable: number;
	/** Kinds that have NO viable path. */
	missing: MissingKind[];
}

export interface MissingKind {
	kind: string;
	reason: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * C12: NodeMap-sourced variant. Skips the templates directory round-trip
 * entirely — renderability is a structural property, and the
 * shared `buildRuleLookup()` answers it directly from NodeMap.
 * Prefer this when you already have a NodeMap in hand (generate
 * returns one).
 *
 * Pure-leaf fallback: if an entry has no fields and no children in
 * node-types.json, `render()` returns `node.$text` directly via its
 * text fast-path — no template lookup needed. This covers:
 *   - Cluster A: visible STRING-rule kinds (`token`/`keyword` modelType)
 *     whose NodeMap path is `"none"` because `classify()` maps those
 *     to `"none"`.
 *   - Cluster B: visible alias targets absent from NodeMap entirely
 *     (e.g. `impl_item_semi`). `node-types.json` lists them as pure
 *     leaves; `readNode` captures `$text` and the fast-path renders.
 */
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

/**
 * Return `true` when a node-types.json entry is a pure leaf: no fields,
 * no children, and not a supertype. These kinds render via `render()`'s
 * text fast-path (`node.$text` present, no `$fields`/`$children` needed).
 *
 * @param entry A raw node-types.json entry.
 */
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
