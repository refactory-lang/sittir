import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TemplateRule } from '@sittir/types';
import type { RenderBody } from '../codegen-surface.ts';
import { INDENT_TEXT, DEDENT_TEXT } from '../../../codegen/src/dsl/primitives/spacing.ts';

export function renderBodiesPath(grammar: string): string {
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	return resolve(packagesDir, grammar, '.sittir', 'render-bodies.json');
}

export function loadRenderBodies(grammar: string): Map<string, RenderBody> {
	const path = renderBodiesPath(grammar);
	if (!existsSync(path)) return new Map();
	const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, RenderBody>;
	return new Map(Object.entries(parsed));
}

export function deriveRuleKinds(grammar: string): Set<string> {
	return new Set(loadRenderBodies(grammar).keys());
}

export function bodyToLegacyRule(body: RenderBody): TemplateRule {
	const clauses: Record<string, string> = {};
	const legacy = (nodes: RenderBody): string => {
		let out = '';
		for (const node of nodes) {
			switch (node.kind) {
				case 'text':
					out += node.text;
					break;
				case 'tokenSeam':
					out += node.text;
					break;
				case 'indent':
					out += INDENT_TEXT;
					break;
				case 'dedent':
					out += DEDENT_TEXT;
					break;
				case 'space':
					out += ' ';
					break;
				case 'adjacent':
				case 'seam':
					break;
				case 'slot':
					out += `$${node.name.toUpperCase()}`;
					break;
				case 'if':
					for (const arm of node.arms) {
						clauses[`${arm.test}_clause`] = legacy(arm.body);
						out += `$${arm.test.toUpperCase()}_CLAUSE`;
					}
					if (node.fallback !== undefined) out += legacy(node.fallback);
					break;
				default: {
					const _exhaustive: never = node;
					throw new Error(`bodyToLegacyRule: unhandled node ${(_exhaustive as { kind: string }).kind}`);
				}
			}
		}
		return out;
	};
	const template = legacy(body);
	if (Object.keys(clauses).length === 0) return template;
	return { template, ...clauses } as TemplateRule;
}
