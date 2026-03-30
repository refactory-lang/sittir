// @generated-header: false (hand-written core — preserved across regeneration)
import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { AnyNodeData, Edit, ByteRange, RulesConfig, TemplateRule } from './types.ts';

export type { RulesConfig };

// ---------------------------------------------------------------------------
// Variable scanner regex
// ---------------------------------------------------------------------------

// Matches $$$NAME, $$NAME, $_NAME, $NAME (longest prefix first)
// Captures: [1] prefix ($$$, $$, $_, $), [2] NAME
const VAR_RE = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;

// ---------------------------------------------------------------------------
// Render engine
// ---------------------------------------------------------------------------

function render(node: AnyNodeData, config: RulesConfig): string {
	if (node.text !== undefined) return node.text;

	if (!node.fields) {
		throw new Error(`Branch node '${node.type}' has no 'fields' — did you mean to set 'text' for a leaf node?`);
	}

	const rule = config.rules[node.type];
	if (!rule) throw new Error(`No render rule for '${node.type}'`);

	const isObject = typeof rule !== 'string';
	const template = isObject ? (rule as { template: string }).template : rule;
	const ruleObj = isObject ? rule as unknown as Record<string, unknown> : undefined;

	// Resolve expandoChar: if set, the template uses expandoChar instead of $
	const prefix = config.expandoChar ?? '$';

	// Build the regex dynamically if expandoChar differs from $
	const varPattern = prefix === '$'
		? VAR_RE
		: new RegExp(`(${escapeRegex(prefix)}{3}|${escapeRegex(prefix)}{2}|${escapeRegex(prefix)}_|${escapeRegex(prefix)})([A-Z][A-Z0-9_]*)`, 'g');

	// Trim trailing newline from YAML | block scalar
	const tmpl = template.endsWith('\n') ? template.slice(0, -1) : template;

	const result = tmpl.replace(varPattern, (_match: string, pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		const clauseKey = `${fieldKey}`;

		// Check if this is a clause reference (e.g., $RETURN_TYPE_CLAUSE → return_type_clause key in rule)
		if (ruleObj && clauseKey in ruleObj && clauseKey !== 'template' && clauseKey !== 'joinBy') {
			const clauseTemplate = ruleObj[clauseKey] as string;
			return renderClause(clauseTemplate, node, config, varPattern);
		}

		// For CHILDREN, check node.children (unnamed children array) in addition to fields
		const value = fieldKey === 'children'
			? (node.fields?.[fieldKey] ?? node.children)
			: node.fields?.[fieldKey];

		// $$$ — multi (zero or more)
		if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
			if (value === undefined) return '';
			const items = Array.isArray(value) ? value : [value];
			const sep = resolveJoinBy(ruleObj, name);
			return items.map(item => renderValue(item as AnyNodeData | string | number, config)).join(sep);
		}

		// $$ — unnamed single
		if (pfx.length === 2 && !pfx.endsWith('_')) {
			if (value === undefined) return '';
			return renderValue(value as AnyNodeData | string | number, config);
		}

		// $_ — non-capturing wildcard (renders the value but doesn't capture)
		if (pfx.endsWith('_')) {
			if (value === undefined) return '';
			return renderValue(value as AnyNodeData | string | number, config);
		}

		// $ — single named field
		if (value === undefined) return '';
		return renderValue(value as AnyNodeData | string | number, config);
	});

	return result;
}

/** Render a clause sub-template. If any variable is absent, omit the entire clause. */
function renderClause(
	clauseTemplate: string,
	node: AnyNodeData,
	config: RulesConfig,
	varPattern: RegExp,
): string {
	// First pass: check if all variables resolve
	let allPresent = true;
	clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		const value = node.fields?.[fieldKey];
		if (value === undefined) allPresent = false;
		return '';
	});

	if (!allPresent) return '';

	// Second pass: actually render
	return clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		const value = node.fields?.[fieldKey] as AnyNodeData | string | number | undefined;
		if (value === undefined) return '';
		return renderValue(value, config);
	});
}

/** Resolve joinBy for a $$$ variable. */
function resolveJoinBy(ruleObj: Record<string, unknown> | undefined, varName: string): string {
	if (!ruleObj) return ' ';
	const joinBy = ruleObj['joinBy'] as string | Record<string, string> | undefined;
	if (joinBy === undefined) return ' ';
	if (typeof joinBy === 'string') return joinBy;
	return joinBy[varName] ?? ' ';
}

/** Render a field value — handles AnyNodeData, string, and number. */
function renderValue(value: AnyNodeData | string | number, config: RulesConfig): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return render(value, config);
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

	function boundRender(node: AnyNodeData): string {
		return render(node, config);
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
