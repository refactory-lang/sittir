/**
 * validate-renderable — every named kind in tree-sitter's node-types.json
 * must be renderable by @sittir/core.
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
 *   3. Has rule    — kind appears in the `rules` map of templates.yaml
 *                    (either as a top-level entry or as a variant target).
 *
 * Anything else is un-renderable: calling `render()` on an instance will
 * throw `No render rule for '<kind>'`. That's a codegen regression we
 * want surfaced as a first-class validation error.
 */

import { loadRawEntries } from './node-types-loader.ts';
import type { RawNodeEntry } from './node-types-loader.ts';
import type { TemplateRule } from '@sittir/types';
import type { NodeMap } from '../compiler/types.ts';
import { buildRuleLookup } from './rule-lookup.ts';
import { deriveRuleKinds, loadRulesFromPath } from './templates-path.ts';

/**
 * Derive the set of rule kinds the renderer can handle. For a directory
 * of `.jinja` files (feature 011 layout) the set is the filename stems.
 * For a legacy YAML file we ALSO expand variant subtypes (a variant
 * template selects by child kind, so each variant's subtype is
 * renderable through the parent rule). The Jinja layout inlines
 * variant branching into the template body, so no expansion is
 * possible or needed.
 */
function collectRuleKindsFromPath(templatesPath: string): Set<string> {
	const base = deriveRuleKinds(templatesPath);
	if (!templatesPath.endsWith('.yaml') && !templatesPath.endsWith('.yml'))
		return base;
	// YAML path — expand variant subtypes recorded in the rule objects.
	const rules = loadRulesFromPath(templatesPath) as Record<
		string,
		TemplateRule
	>;
	for (const rule of Object.values(rules))
		collectVariantKindsFromRule(rule, base);
	return base;
}

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
 * Validate that every named entry in node-types.json is renderable.
 *
 * @param grammar        Grammar name (rust, typescript, python).
 * @param templatesPath  Path to either a `.jinja` templates directory
 *                       (feature 011) or a legacy `templates.yaml` file.
 */
export function validateRenderable(
	grammar: string,
	templatesPath: string
): RenderableResult {
	const rawEntries = loadRawEntries(grammar);
	const ruleKinds = collectRuleKindsFromPath(templatesPath);

	// Post-synthesis-removal: every CST-visible kind `X` produced via
	// `alias($._X, $.X)` has its template emitted under the SOURCE
	// name `_X.jinja`. At runtime the renderer only sees source-kind
	// `$type` values (drillAs remaps CST's `X` to sittir's `_X` at
	// read time). Validation is at the top level — node-types.json
	// lists visible `X` — so we treat `X` as renderable when `_X` is
	// a known rule.
	const expandedRuleKinds = new Set<string>(ruleKinds);
	for (const kind of ruleKinds) {
		if (kind.startsWith('_')) expandedRuleKinds.add(kind.slice(1));
	}

	const missing: MissingKind[] = [];
	let renderable = 0;
	let total = 0;

	for (const entry of rawEntries) {
		if (!isNamedEntry(entry)) continue;
		total++;

		const path = classifyRenderability(entry, expandedRuleKinds);
		if (path === null) {
			missing.push({
				kind: entry.type,
				reason: reasonFor(entry, expandedRuleKinds)
			});
		} else {
			renderable++;
		}
	}

	return { grammar, total, renderable, missing };
}

/**
 * C12: NodeMap-sourced variant. Skips the templates.yaml round-trip
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
export function validateRenderableFromNodeMap(
	grammar: string,
	nodeMap: NodeMap
): RenderableResult {
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
	const hasFields =
		entry.fields !== undefined && Object.keys(entry.fields).length > 0;
	const hasChildren = entry.children !== undefined;
	return !hasFields && !hasChildren;
}

// ---------------------------------------------------------------------------
// Entry filtering
// ---------------------------------------------------------------------------

/**
 * Determine whether a node-types.json entry should be counted for renderability.
 *
 * @param entry A raw node-types.json entry.
 * @returns `true` when the entry is a named (non-anonymous) token. Anonymous
 *   tokens are tree-sitter string literals that are never addressable by
 *   `render(node)` — they appear as text content inside their parent and have
 *   no render call of their own.
 */
function isNamedEntry(entry: RawNodeEntry): boolean {
	return entry.named;
}

// ---------------------------------------------------------------------------
// Renderability decision
// ---------------------------------------------------------------------------

type Path = 'supertype' | 'leaf' | 'rule';

function classifyRenderability(
	entry: RawNodeEntry,
	ruleKinds: Set<string>
): Path | null {
	// 1. Supertype — dispatched, never rendered directly.
	if (entry.subtypes && entry.subtypes.length > 0) return 'supertype';

	// 2. Pure leaf — `render()` returns node.text directly.
	const hasFields = entry.fields && Object.keys(entry.fields).length > 0;
	const hasChildren = entry.children !== undefined;
	if (!hasFields && !hasChildren) return 'leaf';

	// 3. Has a template rule in templates.yaml.
	if (ruleKinds.has(entry.type)) return 'rule';

	return null;
}

function reasonFor(entry: RawNodeEntry, ruleKinds: Set<string>): string {
	const hasFields = entry.fields && Object.keys(entry.fields).length > 0;
	const hasChildren = entry.children !== undefined;
	const parts: string[] = [];
	if (hasFields) parts.push(`fields=[${Object.keys(entry.fields!).join(',')}]`);
	if (hasChildren) parts.push('children');
	return `structural node (${parts.join(', ')}) but no rule in templates.yaml`;
}

// ---------------------------------------------------------------------------
// Rule-map extraction
// ---------------------------------------------------------------------------

/**
 * Extract variant matcher kinds from a single rule entry and add them to the
 * accumulator set.
 *
 * @param rule   A single entry from the `rules` map (may be any shape).
 * @param kinds  Accumulator set to which discovered variant names are added.
 * @remarks Variant-bearing rules list subtypes dispatched through the parent,
 *   so each variant's `name` field also counts as renderable. Variant shape:
 *   `{ variants: [{ name, template, ... }, ...] }`.
 */
function collectVariantKindsFromRule(
	rule: TemplateRule,
	kinds: Set<string>
): void {
	if (rule && typeof rule === 'object' && !Array.isArray(rule)) {
		const variants = (rule as { variants?: Array<{ name?: string }> }).variants;
		if (Array.isArray(variants)) {
			for (const v of variants) {
				if (v?.name) kinds.add(v.name);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatRenderableReport(result: RenderableResult): string {
	const lines: string[] = [];
	const icon = result.missing.length === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.renderable}/${result.total} kinds renderable` +
			` (${result.missing.length} un-renderable)`
	);
	if (result.missing.length > 0) {
		for (const m of result.missing) {
			lines.push(`    x ${m.kind}: ${m.reason}`);
		}
	}
	return lines.join('\n');
}
