// Template-driven tree node → NodeData assignment
// Extracts field references from YAML template $VARIABLE syntax.

import type { AnyNodeData, AnyTreeNode, RulesConfig, TemplateRule } from './types.ts';

// ---------------------------------------------------------------------------
// Variable extraction from template strings
// ---------------------------------------------------------------------------

interface FieldRef {
	name: string;
	multi: boolean;
}

/** Cache extracted field refs per template string. */
const fieldRefCache = new Map<string, FieldRef[]>();

// Matches $$$NAME (multi), $$NAME (unnamed), $_NAME (non-capturing), $NAME (single)
const VAR_RE = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;

function extractFieldRefs(template: string): FieldRef[] {
	let cached = fieldRefCache.get(template);
	if (cached) return cached;

	const refs: FieldRef[] = [];
	const seen = new Set<string>();

	let match: RegExpExecArray | null;
	VAR_RE.lastIndex = 0;
	while ((match = VAR_RE.exec(template)) !== null) {
		const prefix = match[1]!;
		const name = match[2]!.toLowerCase();

		// Skip non-capturing wildcards and clause references
		if (prefix === '$_') continue;
		if (name.endsWith('_clause')) continue;

		if (!seen.has(name)) {
			seen.add(name);
			refs.push({ name, multi: prefix === '$$$' });
		}
	}

	fieldRefCache.set(template, refs);
	return refs;
}

// ---------------------------------------------------------------------------
// assign — generic, template-driven
// ---------------------------------------------------------------------------

/**
 * Recursively assign a parsed tree node into a plain NodeData object.
 *
 * Uses the YAML render template as the schema: field names are extracted
 * from $VARIABLE references. $$$NAME → multiple field, $NAME → single field.
 * Unnamed children ($$$CHILDREN or bare $$$) are collected from remaining
 * named children not covered by explicit fields.
 *
 * Branch nodes get `{ type, fields }`. Leaf nodes get `{ type, text }`.
 */
export function assign(node: AnyTreeNode, config: RulesConfig): AnyNodeData {
	const kind = node.type;
	const rule: TemplateRule | undefined = config.rules[kind];

	// No rule → leaf node
	if (!rule) {
		return { type: kind, text: node.text() };
	}

	const template = typeof rule === 'string' ? rule : rule.template;
	const refs = extractFieldRefs(template);

	const fields: Record<string, AnyNodeData | AnyNodeData[] | string | number> = {};
	let children: AnyNodeData[] | undefined;
	const fieldedIds = new Set<number>();

	for (const ref of refs) {
		if (ref.name === 'children') {
			// Handled after all named fields
			continue;
		}

		if (ref.multi) {
			// Multiple field
			const fieldChildren = node.fieldChildren(ref.name);
			if (fieldChildren.length > 0) {
				for (const c of fieldChildren) fieldedIds.add(c.id());
				fields[ref.name] = fieldChildren.map(c => assign(c, config));
			}
		} else {
			// Single field
			const child = node.field(ref.name);
			if (child) {
				fieldedIds.add(child.id());
				if (child.isNamed()) {
					fields[ref.name] = assign(child, config);
				} else {
					// Anonymous child in a named field (e.g. operator tokens)
					fields[ref.name] = child.text();
				}
			}
		}
	}

	// Collect unnamed children — named children not already covered by fields
	const hasChildrenRef = refs.some(r => r.name === 'children');
	if (hasChildrenRef) {
		const rest = node.children().filter(c => c.isNamed() && !fieldedIds.has(c.id()));
		if (rest.length > 0) {
			children = rest.map(c => assign(c, config));
		}
	}

	const result: AnyNodeData = { type: kind, fields: fields as Readonly<Record<string, unknown>> };
	if (children) (result as any).children = children;
	return result;
}
