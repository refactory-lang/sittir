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
 * Override `join` to:
 *   - tolerate undefined (optional multi-slots render empty),
 *   - auto-apply flank markers baked into the array by the context
 *     builder. Arrays carry `_leading_anon` / `_trailing_anon` string
 *     properties holding the text of any anonymous separator token
 *     adjacent to the named-child run. When that text matches the
 *     filter's separator argument, `join` prepends / appends it —
 *     so templates with optional trailing separators stay simple:
 *       `{{ children | join(",") }}`
 *     The flank is emitted automatically when the parsed tree had
 *     one, and silently skipped when it didn't (or when the grammar
 *     doesn't permit flank, since the tree wouldn't contain such an
 *     anon in the first place). Delimiter anons like `(` / `)` never
 *     match a joinBy literal, so they don't spuriously flank.
 */
function registerSittirFilters(env: nunjucks.Environment): void {
	env.addFilter('join', (value: unknown, sep: unknown) => {
		const s = typeof sep === 'string' ? sep : ''
		if (value === undefined || value === null) return ''
		if (!Array.isArray(value)) return String(value)
		const joined = value.join(s)
		const leading = (value as { _leading_anon?: unknown })._leading_anon
		const trailing = (value as { _trailing_anon?: unknown })._trailing_anon
		const prefix = typeof leading === 'string' && leading === s ? s : ''
		const suffix = typeof trailing === 'string' && trailing === s ? s : ''
		return prefix + joined + suffix
	})
}
