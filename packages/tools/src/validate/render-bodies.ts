/**
 * The generated render bodies of a grammar — `packages/<grammar>/.sittir/render-bodies.json`,
 * one body IR per emitted kind — are the validators' catalog of renderable
 * kinds and the source the coverage checker reads a kind's body from.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TemplateRule } from '@sittir/types';
import type { RenderBody } from '../codegen-surface.ts';

export function renderBodiesPath(grammar: string): string {
	// packages/tools/src/validate/ → ../../.. → packages/
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	return resolve(packagesDir, grammar, '.sittir', 'render-bodies.json');
}

/** Every emitted kind's body; an absent file (a grammar never generated) is an empty catalog. */
export function loadRenderBodies(grammar: string): Map<string, RenderBody> {
	const path = renderBodiesPath(grammar);
	if (!existsSync(path)) return new Map();
	const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, RenderBody>;
	return new Map(Object.entries(parsed));
}

/** The kinds the renderer can handle: those with an emitted body. */
export function deriveRuleKinds(grammar: string): Set<string> {
	return new Set(loadRenderBodies(grammar).keys());
}

/**
 * A body in the coverage checker's placeholder shape: a slot reference is
 * `$NAME`, a gated arm is a `$TEST_CLAUSE` placeholder whose clause body is
 * the arm, and literal text is itself. The fallback of a gate chain and an
 * indented block inline into the surrounding template.
 */
export function bodyToLegacyRule(body: RenderBody): TemplateRule {
	const clauses: Record<string, string> = {};
	const legacy = (nodes: RenderBody): string => {
		let out = '';
		for (const node of nodes) {
			switch (node.kind) {
				case 'text':
				case 'whitespace':
					out += node.text;
					break;
				case 'space':
					out += ' ';
					break;
				case 'adjacent':
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
				case 'indent':
					out += legacy(node.body);
					break;
			}
		}
		return out;
	};
	const template = legacy(body);
	if (Object.keys(clauses).length === 0) return template;
	return { template, ...clauses } as TemplateRule;
}
