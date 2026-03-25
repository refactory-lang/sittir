// @generated-header: false (hand-written core — preserved across regeneration)
import type { NodeData, RenderRule, ParsedTemplate, TemplateElement, RulesRegistry, JoinByMap } from './types.ts';
import { parseTemplate } from './sexpr.ts';

export type { RulesRegistry, JoinByMap };

// ---------------------------------------------------------------------------
// Template cache
// ---------------------------------------------------------------------------

const templateCache = new Map<string, ParsedTemplate>();

function getParsed(template: RenderRule): ParsedTemplate {
	let parsed = templateCache.get(template);
	if (!parsed) {
		parsed = parseTemplate(template);
		templateCache.set(template, parsed);
	}
	return parsed;
}

// ---------------------------------------------------------------------------
// Render engine
// ---------------------------------------------------------------------------

export function render(node: NodeData, registry: RulesRegistry, joinBy?: JoinByMap): string {
	if (node.text !== undefined) return node.text;

	const template = registry[node.type];
	if (!template) throw new Error(`No render rules for '${node.type}'`);

	const parsed = getParsed(template);
	const sep = joinBy?.[node.type] ?? ' ';
	const parts: string[] = [];

	for (const el of parsed.elements) {
		switch (el.type) {
			case 'token':
				parts.push(el.value);
				break;

			case 'field': {
				const value = node.fields[el.name];

				if (value === undefined) {
					if (!el.quantifier) {
						throw new Error(`Required field '${el.name}' missing on '${node.type}'`);
					}
					break;
				}

				if ((el.quantifier === '*' || el.quantifier === '+') && Array.isArray(value)) {
					parts.push(value.map(c => renderValue(c, registry, joinBy)).join(sep));
				} else if (Array.isArray(value)) {
					// Array value for non-multiple field — error
					throw new Error(`Field '${el.name}' on '${node.type}' received array but is not multiple (* or +)`);
				} else {
					parts.push(renderValue(value, registry, joinBy));
				}
				break;
			}

			case 'children': {
				const children = node.fields['children'];
				if (children === undefined) break;

				if (Array.isArray(children)) {
					parts.push(children.map(c => renderValue(c, registry, joinBy)).join(sep));
				} else {
					parts.push(renderValue(children, registry, joinBy));
				}
				break;
			}

			default: {
				const _exhaustive: never = el;
				throw new Error(`Unknown template element type: ${(_exhaustive as TemplateElement).type}`);
			}
		}
	}

	return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Render a field value — handles NodeData, string, and number. */
function renderValue(value: NodeData | string | number, registry: RulesRegistry, joinBy?: JoinByMap): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return render(value, registry, joinBy);
}
