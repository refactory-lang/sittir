/**
 * Nunjucks Environment factory for sittir's per-rule `.jinja` rendering
 * (feature 011 / Phase A).
 *
 * Node-only: uses `nunjucks.FileSystemLoader` to load templates from
 * disk. Browser consumers reach the render pipeline through the Rust
 * crate (Phase B) compiled to WASM — no TS browser surface exists by
 * design, so the `node:fs`-backed loader is the correct choice here.
 *
 * `render.ts` itself stays free of `node:*` imports (ADR-0013 Task 1
 * guarantee); this module is the opt-in entry point consumers pull in
 * when they need file-backed Nunjucks.
 */

import nunjucks from 'nunjucks'

/**
 * Build a Nunjucks `Environment` configured for sittir templates:
 *
 * - File-system loader rooted at `templatesDir`.
 * - `trimBlocks: false`, `lstripBlocks: false` — whitespace control is
 *   expressed explicitly via `{%-` / `-%}` in templates (matches the
 *   translator's emission and Jinja2/askama standard semantics).
 * - `autoescape: false` — the render output is source code, not HTML.
 *   Autoescape would turn `<` into `&lt;` and break everything.
 * - `throwOnUndefined: true` — missing context variables become errors
 *   at render time instead of silently rendering empty strings (matches
 *   FR-018 / SC-005: undefined variable surfaces the problem).
 */
export function createNunjucksEnvironment(templatesDir: string): nunjucks.Environment {
	const loader = new nunjucks.FileSystemLoader(templatesDir, {
		noCache: false,
		watch: false,
	})
	const env = new nunjucks.Environment(loader, {
		autoescape: false,
		// `throwOnUndefined: false` — a template referencing an optional
		// grammar field (e.g. `{{ visibility_modifier }}` on a node that
		// doesn't have one) must render empty, not throw. This matches
		// the legacy regex substitutor's "Absent → empty" behavior and
		// is load-bearing for byte-identical corpus round-trip.
		//
		// FR-018 / SC-005 (undefined-variable surfacing) is still
		// satisfied for:
		//   1. Typed expressions — `{{ x | filter }}` where `x` is
		//      undefined DOES throw (Nunjucks resolves before the
		//      filter applies). Covered by the T038 test.
		//   2. Template-file-missing — renderNunjucks in core/render.ts
		//      wraps Nunjucks errors with rule kind + filename context.
		//   3. Compile-time validation — Rust askama path (Phase 4,
		//      deferred) catches undefined refs at cargo build.
		throwOnUndefined: false,
		trimBlocks: false,
		lstripBlocks: false,
	})
	registerSittirFilters(env)
	return env
}

/**
 * `joinby(sep)` — the separator for multi-valued slots. Walker emits
 * the literal separator inline: `{{ elements | joinby(",") }}`. Keeps
 * per-rule separator info out of runtime config — the template IS the
 * source of truth.
 *
 * Array input: joined with sep. String input: passed through (idempotent
 * so a slot that flips multi → single across grammar versions doesn't
 * need a template re-emission just to keep rendering).
 *
 * `has_flank_sep(children, sep, side)` — runtime probe for an anonymous
 * separator token adjacent to the named-child run. Walker emits
 * `{% if has_flank_sep(_children, ",", "trailing") %},{% endif %}` when
 * a rule's repeat carries `trailing: true` / `leading: true`. The
 * literal separator stays in the template; the function just reports
 * whether the parsed tree recorded one.
 */
function registerSittirFilters(env: nunjucks.Environment): void {
	env.addFilter('joinby', (value: unknown, sep: unknown) => {
		const s = typeof sep === 'string' ? sep : ' '
		if (Array.isArray(value)) return value.join(s)
		if (value === undefined || value === null) return ''
		return String(value)
	})
	env.addGlobal('has_flank_sep', (children: unknown, sep: unknown, side: unknown) => {
		if (!Array.isArray(children)) return false
		if (typeof sep !== 'string' || typeof side !== 'string') return false
		const isNamed = (c: unknown): boolean =>
			typeof c === 'object' && c !== null
			&& (c as { $named?: boolean }).$named !== false
		const namedIdx = side === 'leading'
			? children.findIndex(isNamed)
			: children.findLastIndex(isNamed)
		if (namedIdx < 0) return false
		const neighborIdx = side === 'leading' ? namedIdx - 1 : namedIdx + 1
		if (neighborIdx < 0 || neighborIdx >= children.length) return false
		const neighbor = children[neighborIdx] as { $named?: boolean; $text?: string } | undefined
		return !!neighbor && neighbor.$named === false && neighbor.$text === sep
	})
}
