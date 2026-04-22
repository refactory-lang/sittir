/**
 * Jinja translator — maps AssembledNode render metadata to per-rule
 * .jinja template bodies. Feature 011 / Phase A.
 *
 * One entry point: `translateToJinja(node, rules, wordMatcher)` returns
 * the template body (without the @generated header, which the emitter
 * prepends) or `null` when the node has no template (leaves, keywords,
 * tokens, supertype dispatch points).
 *
 * See specs/011-jinja-template-migration/contracts/translator-mapping.md
 * for the full mapping table.
 *
 * Loud failure: when a rule's shape implies a construct outside the
 * Jinja authoring subset (see contracts/jinja-subset.md), throws with
 * rule kind + offending construct. Never emits a degraded template.
 */

import type { AssembledNode } from '../compiler/node-map.ts'
import type { Rule } from '../compiler/rule.ts'

/**
 * Translate a single AssembledNode to its `.jinja` template body, or
 * `null` when no template file should be emitted for this node.
 *
 * @param node - The assembled rule to translate.
 * @param rules - The grammar's rule map (same map passed to renderTemplate).
 * @param wordMatcher - Grammar's word-rule pattern for adjacency spacing.
 * @returns Template body string, or `null` to skip file emission.
 * @throws Error when the rule shape uses a construct outside the Jinja subset.
 */
export function translateToJinja(
	node: AssembledNode,
	_rules: Record<string, Rule>,
	_wordMatcher: RegExp,
): string | null {
	throw new Error(
		`translateToJinja: not yet implemented for node.modelType='${node.modelType}' (kind='${node.kind}')`,
	)
}
