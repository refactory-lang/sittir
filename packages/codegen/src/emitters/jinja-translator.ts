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
 * Rule-object meta-keys that are NOT clauses. Clauses are any other
 * string-valued key in the rule object (snake_case names matching
 * `$X_CLAUSE` placeholders in the template).
 */
const NON_CLAUSE_KEYS = new Set([
	'template',
	'variants',
	'detect',
	'joinBy',
	'joinByField',
	'joinByTrailing',
	'joinByLeading',
])

/**
 * Translate a template body that may contain `$X_CLAUSE` references
 * plus plain `$VAR` placeholders. Clauses become
 * `{%- if x %}<body>{% endif -%}` wrappers whose body is itself
 * translated (recursively) — the clause body can reference `$X` which
 * becomes `{{ x }}`.
 *
 * Whitespace control: we strip leading whitespace on the opening tag
 * and trailing whitespace on the closing tag so an absent clause
 * doesn't leave orphan spaces in the output — matching the YAML-era
 * FR-017 absent-field space absorption.
 */
function translateBodyWithClauses(template: string, entry: Record<string, unknown>): string {
	// Collect clause bodies keyed by their base name (snake_case).
	// Walker-emitted clauses live on the rule object alongside
	// `template`, `joinBy`, etc. Any string-valued key that is not a
	// reserved meta-key is a clause.
	const clauses: Record<string, string> = {}
	for (const [k, v] of Object.entries(entry)) {
		if (NON_CLAUSE_KEYS.has(k)) continue
		if (typeof v === 'string') clauses[k] = v
	}
	if (Object.keys(clauses).length === 0) {
		return translateTemplateString(template)
	}
	// Walk the template's `$VAR` placeholders; when a placeholder's
	// lowercased name matches a clause key, substitute the clause's
	// translated body inside an `{%- if <stem> %}...{% endif -%}`
	// wrapper (where stem = clause name minus the trailing `_clause`).
	// Other placeholders pass through translateTemplateString's
	// standard mapping.
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g
	return template.replace(varPattern, (_full, _pfx: string, name: string) => {
		const key = name.toLowerCase()
		if (key in clauses) {
			const stem = key.endsWith('_clause') ? key.slice(0, -'_clause'.length) : key
			const body = translateTemplateString(clauses[key]!)
			return `{%- if ${stem} %}${body}{% endif -%}`
		}
		// Structural placeholders + normal vars handled by the shared
		// string-transform helper.
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
	// T017: Rules 4, 5, 6 — no-file cases. Leaves (regex-shaped,
	// e.g. identifiers), keywords (bare strings the parent template
	// inlines), tokens (hidden structural literals), supertypes
	// (dispatch points — recursive render hits the concrete subtype),
	// enums (render as $text), multis + non-polymorph groups (hidden
	// helpers inlined at referrers). None of these need a dedicated
	// .jinja file; return null so the emitter skips file emission.
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
	// Groups are "no-file" EXCEPT when they're polymorph forms with
	// their own parent kind — those get their own .jinja file because
	// tree-sitter surfaces the form as a real parse node. Non-form
	// groups (hidden helpers) return null.
	if (node.modelType === 'group') {
		const grp = node as unknown as { parentKind?: string }
		if (!grp.parentKind) return null
		// Polymorph-form group: same body as a branch/container.
		const entry = node.renderTemplate(rules, wordMatcher)
		const template = (entry as { template?: string } | undefined)?.template
		if (typeof template !== 'string') {
			throw new Error(
				`translateToJinja: polymorph-form group '${node.kind}' produced no template — ` +
				`renderTemplate() returned ${JSON.stringify(entry)}`,
			)
		}
		return translateTemplateString(template)
	}

	// T013/T014: Rule 1 — single-template branch or container.
	// Both resolve through node.renderTemplate(), which returns an
	// entry with a `template` key plus joinBy / joinByField / clauses
	// metadata. joinBy metadata is consumed by prepare() when building
	// TemplateContext.children; the Jinja body just references
	// `{{ children }}`. Clauses become `{% if %}` blocks in T015.
	if (node.modelType === 'branch' || node.modelType === 'container') {
		const entry = node.renderTemplate(rules, wordMatcher)
		const template = (entry as { template?: string }).template
		if (typeof template !== 'string') {
			throw new Error(
				`translateToJinja: rule '${node.kind}' (${node.modelType}) has no template string — ` +
				`renderTemplate() returned ${JSON.stringify(entry)}`,
			)
		}
		return translateBodyWithClauses(template, entry as Record<string, unknown>)
	}

	// T016: Rule 3 — polymorph variant branching. AssembledPolymorph's
	// renderTemplate() returns either `{ template: "..." }` (when all
	// forms collapsed to one — ADR-0013 Task 2, post-cleanup) or
	// `{ variants: { form_a: "...", form_b: "..." } }` when forms
	// genuinely differ (5 such rules across 3 grammars). The collapsed
	// case renders identically to a branch; the variants case becomes
	// an `{% if variant == "form_a" %}…{% elif variant == "form_b" %}…{% endif %}`
	// chain.
	if (node.modelType === 'polymorph') {
		const entry = node.renderTemplate(rules, wordMatcher) as {
			template?: string
			variants?: Record<string, string>
		}
		if (typeof entry.template === 'string') {
			return translateTemplateString(entry.template)
		}
		if (!entry.variants || Object.keys(entry.variants).length === 0) {
			throw new Error(
				`translateToJinja: polymorph '${node.kind}' has neither template nor variants — ` +
				`renderTemplate() returned ${JSON.stringify(entry)}`,
			)
		}
		const formNames = Object.keys(entry.variants)
		const parts: string[] = []
		for (let i = 0; i < formNames.length; i++) {
			const formName = formNames[i]!
			const body = translateTemplateString(entry.variants[formName]!)
			const keyword = i === 0 ? 'if' : 'elif'
			parts.push(`{%- ${keyword} variant == ${JSON.stringify(formName)} -%}`)
			parts.push(body)
		}
		parts.push('{%- endif -%}')
		return parts.join('\n')
	}

	throw new Error(
		`translateToJinja: not yet implemented for node.modelType='${node.modelType}' (kind='${node.kind}')`,
	)
}
