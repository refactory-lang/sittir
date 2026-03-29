// Template-driven tree node → NodeData assignment
// Uses parsed render templates as the schema — no per-kind codegen needed.

import type { AnyNodeData, AnyTreeNode, ParsedTemplate, RulesRegistry } from './types.ts';
import { parseTemplate } from './sexpr.ts';

// ---------------------------------------------------------------------------
// Template cache (shared with render.ts via same parseTemplate)
// ---------------------------------------------------------------------------

const templateCache = new Map<string, ParsedTemplate>();

function getParsed(template: string): ParsedTemplate {
	let parsed = templateCache.get(template);
	if (!parsed) {
		parsed = parseTemplate(template);
		templateCache.set(template, parsed);
	}
	return parsed;
}

// ---------------------------------------------------------------------------
// assign — generic, template-driven
// ---------------------------------------------------------------------------

/**
 * Recursively assign a parsed tree node into a plain NodeData object.
 *
 * Uses the render template as the schema: field names and quantifiers
 * are extracted from the S-expression, so no per-kind metadata is needed.
 *
 * Branch nodes get `{ type, fields }`. Leaf nodes get `{ type, text }`.
 */
export function assign(node: AnyTreeNode, rules: RulesRegistry): AnyNodeData {
	const kind = node.type;
	const template = rules[kind];

	// No template → leaf node
	if (!template) {
		return { type: kind, text: node.text() };
	}

	const parsed = getParsed(template);
	const fields: Record<string, unknown> = {};
	const fieldedIds = new Set<number>();

	for (const el of parsed.elements) {
		switch (el.type) {
			case 'token':
				// Anonymous token — skip (render reconstructs these from template)
				break;

			case 'field': {
				if (el.quantifier === '*' || el.quantifier === '+') {
					// Multiple field
					const children = node.fieldChildren(el.name);
					if (children.length > 0) {
						for (const c of children) fieldedIds.add(c.id());
						fields[el.name] = children.map(c => assign(c, rules));
					}
				} else {
					// Single field
					const child = node.field(el.name);
					if (child) {
						fieldedIds.add(child.id());
						if (child.isNamed()) {
							fields[el.name] = assign(child, rules);
						} else {
							// Anonymous child in a named field (e.g. operator tokens)
							fields[el.name] = child.text();
						}
					}
				}
				break;
			}

			case 'children': {
				// Unnamed children — named children not already covered by fields
				const rest = node.children().filter(c => c.isNamed() && !fieldedIds.has(c.id()));
				if (rest.length > 0) {
					fields['children'] = rest.map(c => assign(c, rules));
				}
				break;
			}
		}
	}

	return { type: kind, fields };
}
