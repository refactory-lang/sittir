/**
 * Jinja translator — maps AssembledNode render metadata to per-rule
 * .jinja template bodies. Feature 011 / Phase A.
 *
 * One entry point: `translateToJinja(node, rules, wordMatcher)` returns
 * the template body (without the @generated header, which the emitter
 * prepends) or `null` when the node has no template (leaves, keywords,
 * tokens, supertype dispatch points).
 *
 * Internally, the work splits two ways:
 *
 * 1. `node.renderTemplate()` produces the YAML-era template string
 *    (`$NAME` placeholders, etc.) — already stable, tested, and the
 *    single source of truth for render layout. We reuse it verbatim.
 * 2. `translateTemplateString()` is a pure string-to-string transform
 *    that maps `$VAR` → `{{ var }}`, `$$$VAR` → `{{ var }}`, etc.
 *    Exposed for unit testing; `translateToJinja` calls it internally.
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
 * Pure string-to-string transform from the sittir-internal `$VAR`
 * template syntax to Jinja `{{ var }}` interpolation.
 *
 * Handles:
 * - `$NAME`        → `{{ name }}`
 * - `$$$NAME`      → `{{ name }}` (pre-joined by prepare()'s TemplateContext)
 * - `$TEXT`        → `{{ text }}`
 * - `$NEWLINE`     → `\n` literal (structural placeholder for implicit newlines)
 * - `$INDENT`      → empty string (render-time column tracking handles indent)
 * - `$DEDENT`      → empty string (same)
 *
 * Other `$VAR` tokens → lowercased snake_case key inside `{{ }}`.
 *
 * Does NOT handle clauses (`{% if %}`) or variant branching — those
 * live at the AssembledNode level and are added by `translateToJinja`
 * in subsequent task implementations.
 */
export function translateTemplateString(tmpl: string): string {
	// Matches $$$NAME | $$NAME | $_NAME | $NAME (longest prefix first).
	// Same shape as core's DEFAULT_VAR_RE.
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g
	return tmpl.replace(varPattern, (_full, _pfx: string, name: string) => {
		const key = name.toLowerCase()
		// Structural placeholders (no Jinja mapping — directly resolved).
		if (key === 'newline') return '\n'
		if (key === 'indent') return ''
		if (key === 'dedent') return ''
		return `{{ ${key} }}`
	})
}

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
	rules: Record<string, Rule>,
	wordMatcher: RegExp,
): string | null {
	// T013: Rule 1 — single-template branch. Container, polymorph,
	// clauses, leaf, keyword/token, supertype paths land in T014–T017.
	if (node.modelType === 'branch') {
		const entry = node.renderTemplate(rules, wordMatcher)
		const template = (entry as { template?: string }).template
		if (typeof template !== 'string') {
			throw new Error(
				`translateToJinja: rule '${node.kind}' (branch) has no template string — ` +
				`renderTemplate() returned ${JSON.stringify(entry)}`,
			)
		}
		return translateTemplateString(template)
	}

	throw new Error(
		`translateToJinja: not yet implemented for node.modelType='${node.modelType}' (kind='${node.kind}')`,
	)
}
