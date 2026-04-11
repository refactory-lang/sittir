// @generated-header: false (hand-written core — preserved across regeneration)
import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { AnyNodeData, Edit, ByteRange, RulesConfig, TemplateRule, TemplateRuleObject } from './types.ts';

export type { RulesConfig };

// ---------------------------------------------------------------------------
// Variable scanner regex
// ---------------------------------------------------------------------------

// Matches $$$NAME, $$NAME, $_NAME, $NAME (longest prefix first)
// Captures: [1] prefix ($$$, $$, $_, $), [2] NAME
const DEFAULT_VAR_RE = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;

// ---------------------------------------------------------------------------
// Render context — precomputed once per createRenderer call
// ---------------------------------------------------------------------------

interface InternalRenderContext {
	config: RulesConfig;
	varPattern: RegExp;
	prefix: string;
}

function buildRenderContext(config: RulesConfig): InternalRenderContext {
	const prefix = config.expandoChar ?? '$';
	const varPattern = prefix === '$'
		? DEFAULT_VAR_RE
		: new RegExp(`(${escapeRegex(prefix)}{3}|${escapeRegex(prefix)}{2}|${escapeRegex(prefix)}_|${escapeRegex(prefix)})([A-Z][A-Z0-9_]*)`, 'g');
	return { config, varPattern, prefix };
}

// ---------------------------------------------------------------------------
// Template resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the template string for a node, handling all TemplateRule forms:
 * - string: return directly
 * - string[]: pick best variant by field presence (existing heuristic)
 * - object with `variants`: detect subtype from node.variant or anonymous tokens
 * - object with `template`: standard object form, may be string or string[]
 */
function resolveTemplate(rule: TemplateRule, node: AnyNodeData, varPattern: RegExp): string {
	if (typeof rule === 'string') return rule;
	if (Array.isArray(rule)) return pickTemplate(rule, node, varPattern) ?? rule[0]!;

	const obj = rule as TemplateRuleObject;

	if (obj.variants) {
		// 1. Explicit variant field (set by factory)
		if (node.variant && obj.variants[node.variant]) {
			return obj.variants[node.variant]!;
		}
		// 2. Detect from anonymous tokens in children
		if (obj.detect && node.children) {
			for (const child of node.children) {
				const c = child as AnyNodeData;
				if (c.named === false) {
					for (const [subtype, token] of Object.entries(obj.detect)) {
						if (c.text === token) return obj.variants[subtype]!;
					}
				}
			}
		}
		// 3. Fallback: first variant
		return Object.values(obj.variants)[0]!;
	}

	// Standard template (string or string[])
	const tmpl = obj.template;
	if (!tmpl) throw new Error(`Rule for '${node.type}' has neither template nor variants`);
	if (Array.isArray(tmpl)) return pickTemplate(tmpl, node, varPattern) ?? tmpl[0]!;
	return tmpl;
}

// ---------------------------------------------------------------------------
// Render engine
// ---------------------------------------------------------------------------

function render(node: AnyNodeData, ctx: InternalRenderContext): string {
	if (node.text !== undefined && !node.fields && !node.children) return node.text;

	if (!node.fields && !node.children) {
		throw new Error(`Node '${node.type}' has no 'fields' or 'children' — did you mean to set 'text' for a leaf node?`);
	}

	const rule = ctx.config.rules[node.type];
	if (!rule) throw new Error(`No render rule for '${node.type}'`);

	const isObject = typeof rule !== 'string' && !Array.isArray(rule);
	const ruleObj = isObject ? rule as unknown as Record<string, unknown> : undefined;

	const { varPattern, prefix } = ctx;

	// Resolve template — handles simple, string[], and variant subtypes
	const rawTemplate = resolveTemplate(rule, node, varPattern);

	// Trim trailing newline from YAML | block scalar
	const tmpl = rawTemplate.endsWith('\n') ? rawTemplate.slice(0, -1) : rawTemplate;

	// Consumption model: track which children indices have been used.
	// $$$CHILDREN renders only the unconsumed remainder.
	const consumed = new Set<number>();

	const result = tmpl.replace(varPattern, (_match: string, pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		const clauseKey = `${fieldKey}`;

		// 1. Clause reference (e.g., $RETURN_TYPE_CLAUSE → return_type_clause key in rule)
		if (ruleObj && clauseKey in ruleObj && clauseKey !== 'template' && clauseKey !== 'joinBy') {
			const clauseTemplate = ruleObj[clauseKey] as string;
			return renderClause(clauseTemplate, node, ctx, consumed);
		}

		// 2. Fields (tree-sitter FIELDs + promoted overrides)
		if (node.fields?.[fieldKey] !== undefined) {
			const value = node.fields[fieldKey];
			if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
				const items = Array.isArray(value) ? value : [value];
				const sep = resolveJoinBy(ruleObj, name);
				return items.map(item => renderValue(item as AnyNodeData | string | number, ctx)).join(sep);
			}
			if (Array.isArray(value)) {
				return value.length > 0 ? renderValue(value[0] as AnyNodeData | string | number, ctx) : '';
			}
			return renderValue(value as AnyNodeData | string | number, ctx);
		}

		// 3. $$$CHILDREN — unconsumed named children only
		// Anonymous tokens (delimiters, separators, keywords) are template-structural:
		// delimiters are in template text, separators are in joinBy, keywords are
		// in override fields. Only named children carry user content.
		if ((pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) && fieldKey === 'children') {
			if (!node.children) return '';
			const remaining = node.children.filter((c, i) =>
				!consumed.has(i) && (c as AnyNodeData).named !== false
			);
			const sep = resolveJoinBy(ruleObj, name);
			return remaining.map(c => renderValue(c as AnyNodeData | string | number, ctx)).join(sep);
		}

		// 4. Named child by kind — consume first unconsumed named match
		if (node.children && Array.isArray(node.children)) {
			const idx = node.children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.type === fieldKey && (c as AnyNodeData).named !== false
			);
			if (idx >= 0) {
				consumed.add(idx);
				const child = node.children[idx];
				if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
					// $$$ on a single matched child — collect all unconsumed named of this type
					const items: unknown[] = [child];
					for (let i = idx + 1; i < node.children.length; i++) {
						const c = node.children[i] as AnyNodeData;
						if (!consumed.has(i) && c?.type === fieldKey && c.named !== false) {
							consumed.add(i);
							items.push(node.children[i]);
						}
					}
					const sep = resolveJoinBy(ruleObj, name);
					return items.map(item => renderValue(item as AnyNodeData | string | number, ctx)).join(sep);
				}
				return renderValue(child as AnyNodeData | string | number, ctx);
			}
		}

		// 5. $CHILDREN (single) — first unconsumed named child
		if (fieldKey === 'children' && node.children) {
			for (let i = 0; i < node.children.length; i++) {
				const c = node.children[i] as AnyNodeData;
				if (!consumed.has(i) && c.named !== false) {
					consumed.add(i);
					return renderValue(c as AnyNodeData | string | number, ctx);
				}
			}
		}

		// 6. Absent → empty
		return '';
	});

	// FR-017: Absent-field space absorption — collapse runs of spaces left by
	// empty variable interpolations into single spaces, and trim edges.
	return result.replace(/ {2,}/g, ' ').trim();
}

/**
 * Pick the best variant template: the first where all $VARIABLES resolve.
 * Falls back to the first template with the most resolved variables.
 */
function pickTemplate(
	templates: string[],
	node: AnyNodeData,
	varPattern: RegExp,
): string | null {
	// Sort by specificity: more variables = more specific, try first.
	// This ensures variant templates with more fields are preferred
	// over fallback templates with fewer fields.
	const scored = templates.map(tmpl => {
		let total = 0;
		let resolved = 0;
		const tpl = tmpl.endsWith('\n') ? tmpl.slice(0, -1) : tmpl;
		tpl.replace(varPattern, (_match: string, _pfx: string, name: string) => {
			const fieldKey = name.toLowerCase();
			total++;
			if (node.fields?.[fieldKey] !== undefined) { resolved++; return ''; }
			if (fieldKey === 'children' && node.children) { resolved++; return ''; }
			if (node.children && Array.isArray(node.children)) {
				if (node.children.some((c: any) => c?.type === fieldKey)) { resolved++; return ''; }
			}
			return '';
		});
		return { tmpl, total, resolved };
	});

	// Sort: fully resolved first, then by total variable count descending (most specific first)
	scored.sort((a, b) => {
		const aFull = a.total > 0 && a.resolved === a.total ? 1 : 0;
		const bFull = b.total > 0 && b.resolved === b.total ? 1 : 0;
		if (aFull !== bFull) return bFull - aFull;
		return b.total - a.total;
	});

	// Return first fully resolved, or best partial
	for (const s of scored) {
		if (s.total > 0 && s.resolved === s.total) return s.tmpl;
	}
	return scored[0]?.tmpl ?? null;
}

/** Render a clause sub-template. If any variable is absent, omit the entire clause. */
function renderClause(
	clauseTemplate: string,
	node: AnyNodeData,
	ctx: InternalRenderContext,
	consumed: Set<number>,
): string {
	const { varPattern } = ctx;

	// First pass: check if all variables resolve
	let allPresent = true;
	clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		if (node.fields?.[fieldKey] !== undefined) return '';
		// Also check children by kind
		if (node.children && Array.isArray(node.children)) {
			const idx = node.children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.type === fieldKey
			);
			if (idx >= 0) return '';
		}
		allPresent = false;
		return '';
	});

	if (!allPresent) return '';

	// Second pass: actually render (consuming children)
	return clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		if (node.fields?.[fieldKey] !== undefined) {
			const value = node.fields[fieldKey] as AnyNodeData | string | number;
			return renderValue(value, ctx);
		}
		// Children by kind fallback
		if (node.children && Array.isArray(node.children)) {
			const idx = node.children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.type === fieldKey
			);
			if (idx >= 0) {
				consumed.add(idx);
				return renderValue(node.children[idx] as AnyNodeData | string | number, ctx);
			}
		}
		return '';
	});
}

/** Resolve joinBy for a $$$ variable. */
function resolveJoinBy(ruleObj: Record<string, unknown> | undefined, _varName: string): string {
	if (!ruleObj) return ' ';
	const joinBy = ruleObj['joinBy'] as string | undefined;
	return joinBy ?? ' ';
}

/** Render a field value — handles AnyNodeData, string, and number. */
function renderValue(value: AnyNodeData | string | number, ctx: InternalRenderContext): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return render(value, ctx);
}

/** Escape a string for use in a RegExp. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// YAML loading
// ---------------------------------------------------------------------------

/** Load and parse a templates.yaml file into a RulesConfig. */
export function loadTemplates(yamlPath: string): RulesConfig {
	const content = fs.readFileSync(yamlPath, 'utf-8');
	return parseYaml(content) as RulesConfig;
}

// ---------------------------------------------------------------------------
// createRenderer — close over rules once, return bound helpers
// ---------------------------------------------------------------------------

export interface BoundRenderer {
	render(node: AnyNodeData): string;
	toEdit(node: AnyNodeData, start: number, end: number): Edit;
	toEdit(node: AnyNodeData, range: ByteRange): Edit;
}

/**
 * Create a renderer bound to a specific YAML templates file.
 * Loads and parses the YAML once — no need to pass config on every render() call.
 */
export function createRenderer(yamlPath: string): BoundRenderer;
/**
 * Create a renderer from a pre-parsed RulesConfig.
 */
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig): BoundRenderer {
	const config = typeof pathOrConfig === 'string' ? loadTemplates(pathOrConfig) : pathOrConfig;
	const ctx = buildRenderContext(config);

	function boundRender(node: AnyNodeData): string {
		return render(node, ctx);
	}

	function boundToEdit(node: AnyNodeData, startOrRange: number | ByteRange, end?: number): Edit {
		if (typeof startOrRange === 'number') {
			if (typeof end !== 'number') {
				throw new Error('endPos is required when startPos is a number');
			}
			if (startOrRange < 0 || end < 0) {
				throw new Error(`Edit positions must be non-negative (got start=${startOrRange}, end=${end})`);
			}
			if (startOrRange > end) {
				throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${end})`);
			}
			return { startPos: startOrRange, endPos: end, insertedText: boundRender(node) };
		}
		return {
			startPos: startOrRange.start.index,
			endPos: startOrRange.end.index,
			insertedText: boundRender(node),
		};
	}

	return { render: boundRender, toEdit: boundToEdit as BoundRenderer['toEdit'] };
}
