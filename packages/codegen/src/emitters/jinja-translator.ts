/**
 * Final `$VAR` → `{{ var }}` pass for per-rule `.jinja` emission
 * (feature 011, follow-up T1).
 *
 * Post-T1 refactor: clause inlining (`{% if x %}body{% endif %}`) and
 * polymorph variant branching (`{% if variant == "X" %}...{% endif %}`)
 * now happen inside the `AssembledNode.renderTemplate` methods. By the
 * time this translator runs, the template string is already Jinja-
 * shaped — it just still uses the internal `$VAR` / `$$$VAR`
 * placeholder convention for scalar substitutions. This module does
 * the one remaining conversion: `$NAME` → `{{ name }}`.
 *
 * One entry point: `translateToJinja(node, rules, wordMatcher)` returns
 * the template body (without the `@generated` header, which the
 * emitter prepends) or `null` when the node has no template (leaves,
 * keywords, tokens, supertype dispatch points).
 *
 * Loud failure: `node.renderTemplate()` throws when a rule shape
 * can't produce a template; we re-throw with translator-layer context.
 */

import type { AssembledNode } from '../compiler/node-map.ts'
import type { Rule } from '../compiler/rule.ts'

/**
 * Pure string-to-string transform from the sittir-internal `$VAR`
 * placeholder convention to Jinja `{{ var }}` interpolation.
 *
 * Handles:
 * - `$NAME`        → `{{ name }}`
 * - `$$$NAME`      → `{{ name | join("<sep>") }}` — separator literal
 *                    comes from the rule's joinByField[name] ?? joinBy
 *                    (default space). Walker-time knowledge, inlined
 *                    so the render path needs no sidecar config.
 * - `$$$CHILDREN`  → one of four filter forms, selected by the rule's
 *                    leading / trailing separator permission. Built-in
 *                    `join` stays pristine (cross-engine parity with
 *                    Askama); the other three are sittir-registered:
 *                      neither  → `{{ children | join("<sep>") }}`
 *                      trailing → `{{ children | joinWithTrailing("<sep>") }}`
 *                      leading  → `{{ children | joinWithLeading("<sep>") }}`
 *                      both     → `{{ children | joinWithFlanks("<sep>") }}`
 *                    Flank probes read `_trailing_anon` /
 *                    `_leading_anon` properties the core render
 *                    context attaches to the children array.
 * - `$TEXT`        → `{{ text }}`
 * - `$NEWLINE`     → literal `\n`
 * - `$INDENT`      → empty string (render-time column tracking handles indent)
 * - `$DEDENT`      → empty string
 *
 * Other `$VAR` tokens → lowercased snake_case key inside `{{ }}`.
 *
 * Clauses (`$X_CLAUSE`) and polymorph variants are inlined into the
 * template string upstream by `AssembledNode.renderTemplate`; this
 * module no longer handles them.
 */
export interface TranslateMeta {
	joinBy?: string
	joinByField?: Record<string, string>
	joinByLeading?: boolean
	joinByTrailing?: boolean
}

export function translateTemplateString(tmpl: string, meta: TranslateMeta = {}): string {
	// Matches $$$NAME | $$NAME | $_NAME | $NAME (longest prefix first).
	// Same shape as core's DEFAULT_VAR_RE.
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g
	const defaultSep = meta.joinBy ?? ' '
	const translated = tmpl.replace(varPattern, (_full, pfx: string, name: string) => {
		const key = name.toLowerCase()
		// Structural placeholders (no Jinja mapping — directly resolved).
		if (key === 'newline') return '\n'
		if (key === 'indent') return ''
		if (key === 'dedent') return ''
		// Multi-valued ($$$NAME / $$$CHILDREN). Built-in `join` for the
		// simple case; `joinWithTrailing` / `joinWithLeading` / both
		// when the rule's repeat permitted those separator markers. One
		// filter per slot — no secondary `{% if %}` clauses or extra
		// children references. Per-field slots never flank (legacy
		// behavior), so they always use the built-in `join`.
		if (pfx === '$$$') {
			const sep = key === 'children'
				? defaultSep
				: meta.joinByField?.[key] ?? defaultSep
			const filter = filterForFlanks(key, meta)
			return `{{ ${key} | ${filter}(${jsonStringLiteral(sep)}) }}`
		}
		return `{{ ${key} }}`
	})
	return escapeJinjaBraceCollisions(translated)
}

/**
 * JSON-string-encode a separator literal for inline use in a Jinja
 * filter call — handles `"` / backslash / newline / tab safely.
 */
function jsonStringLiteral(s: string): string {
	return JSON.stringify(s)
}

/**
 * Pick the right join-variant filter for a slot. `$$$CHILDREN` is the
 * only slot that carries flank permission (legacy per-field flank
 * behavior was never ported to the Jinja path); everything else uses
 * the built-in `join`.
 */
function filterForFlanks(key: string, meta: TranslateMeta): string {
	if (key !== 'children') return 'join'
	if (meta.joinByLeading && meta.joinByTrailing) return 'joinWithFlanks'
	if (meta.joinByTrailing) return 'joinWithTrailing'
	if (meta.joinByLeading) return 'joinWithLeading'
	return 'join'
}

/**
 * Jinja brace-escape: a literal `{` immediately before `{{` or a
 * literal `}` immediately after `}}` creates `{{{` / `}}}` which
 * Jinja parses as `{{ { … }` (dict literal) and fails. Insert a
 * single space to separate the literal brace from the Jinja
 * interpolation. Rust's `block` template (`{$$$CHILDREN}` →
 * `{{{ children }}}`) is the canonical case.
 *
 * Applied iteratively until fixed point so stacked triples
 * (`{{{{ x }}}}`) resolve cleanly in one pass.
 */
function escapeJinjaBraceCollisions(s: string): string {
	let prev = s
	for (let i = 0; i < 4; i++) {
		const next = prev
			.replace(/\{(\{\{[^}]+\}\})/g, '{ $1')
			.replace(/(\{\{[^}]+\}\})\}/g, '$1 }')
		if (next === prev) return next
		prev = next
	}
	return prev
}

/**
 * Translate a single AssembledNode to its `.jinja` template body, or
 * `null` when no template file should be emitted for this node.
 *
 * @param node - The assembled rule to translate.
 * @param rules - The grammar's rule map (same map passed to renderTemplate).
 * @param wordMatcher - Grammar's word-rule pattern for adjacency spacing.
 * @returns Template body string, or `null` to skip file emission.
 * @throws Error with rule kind + detail when renderTemplate fails.
 */
export function translateToJinja(
	node: AssembledNode,
	rules: Record<string, Rule>,
	wordMatcher: RegExp,
): string | null {
	// No-file cases: leaves (regex-shaped identifiers), keywords
	// (bare strings the parent template inlines), tokens (hidden
	// structural literals), supertypes (recursive render hits the
	// concrete subtype), enums (render as $text), multis and non-
	// polymorph-form groups (hidden helpers inlined at referrers).
	if (
		node.modelType === 'leaf'
		|| node.modelType === 'keyword'
		|| node.modelType === 'token'
		|| node.modelType === 'supertype'
		|| node.modelType === 'enum'
		|| node.modelType === 'multi'
	) {
		return null
	}
	if (node.modelType === 'group') {
		const grp = node as unknown as { parentKind?: string }
		if (!grp.parentKind) return null
	}

	// Everything else (branch / container / polymorph / polymorph-form
	// group) produced a Jinja-ready template string via renderTemplate
	// — clauses and variants already inlined. Final step: convert the
	// remaining `$VAR` placeholders.
	const entry = node.renderTemplate(rules, wordMatcher)
	const template = (entry as { template?: string }).template
	if (typeof template !== 'string') {
		throw new Error(
			`translateToJinja: rule '${node.kind}' (${node.modelType}) produced no template string — ` +
			`renderTemplate() returned ${JSON.stringify(entry)}`,
		)
	}
	const meta: TranslateMeta = {
		joinBy: (entry as { joinBy?: string }).joinBy,
		joinByField: (entry as { joinByField?: Record<string, string> }).joinByField,
		joinByLeading: (entry as { joinByLeading?: boolean }).joinByLeading,
		joinByTrailing: (entry as { joinByTrailing?: boolean }).joinByTrailing,
	}
	return translateTemplateString(template, meta)
}
