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
 * Walker picks one of these per multi-valued slot based on the
 * grammar's separator permission — one filter per call site, distinct
 * names per scenario so the template reads exactly what it does.
 *
 *   - `join` — plain array join. Overridden on the sittir env to
 *     tolerate undefined / non-array values (walker occasionally
 *     emits `$$$X` for a slot the factory returns as a single value;
 *     legacy pre-join swallowed the mismatch, we preserve that). The
 *     Askama port (Rust, Phase B) has typed `Vec<String>` inputs so
 *     built-in `join` suffices there without the coercion.
 *
 *   - `joinWithTrailing(sep)` — join; append `sep` when the parsed
 *     tree recorded a trailing anonymous separator matching it.
 *
 *   - `joinWithLeading(sep)` — join; prepend `sep` when the parsed
 *     tree recorded a leading anonymous separator matching it.
 *
 *   - `joinWithFlanks(sep)` — both directions. Reserved for rules
 *     that permit separators on BOTH ends of a repeat (rare — none
 *     of the three shipped grammars emit this form today). Kept so
 *     the walker can target it cleanly if a future grammar adopts
 *     the shape.
 *
 * Flank probes read `_leading_anon` / `_trailing_anon` properties the
 * core render context attaches to the children array. Delimiter anons
 * like `(` / `)` never match a real joinBy literal so they can't
 * spuriously flank.
 */
function registerSittirFilters(env: nunjucks.Environment): void {
	const coerceJoin = (value: unknown, s: string): { arr: unknown[] | null; str: string } => {
		if (Array.isArray(value)) return { arr: value, str: value.join(s) }
		if (value === undefined || value === null) return { arr: null, str: '' }
		return { arr: null, str: String(value) }
	}
	env.addFilter('join', (value: unknown, sep: unknown) => {
		const s = typeof sep === 'string' ? sep : ''
		return coerceJoin(value, s).str
	})
	const flankJoin = (value: unknown, sep: unknown, sides: { leading: boolean; trailing: boolean }): string => {
		const s = typeof sep === 'string' ? sep : ''
		const { arr, str } = coerceJoin(value, s)
		if (!arr) return str
		const leading = sides.leading ? (arr as { _leading_anon?: unknown })._leading_anon : undefined
		const trailing = sides.trailing ? (arr as { _trailing_anon?: unknown })._trailing_anon : undefined
		const prefix = typeof leading === 'string' && leading === s ? s : ''
		const suffix = typeof trailing === 'string' && trailing === s ? s : ''
		return prefix + str + suffix
	}
	env.addFilter('joinWithTrailing', (value: unknown, sep: unknown) =>
		flankJoin(value, sep, { leading: false, trailing: true }),
	)
	env.addFilter('joinWithLeading', (value: unknown, sep: unknown) =>
		flankJoin(value, sep, { leading: true, trailing: false }),
	)
	env.addFilter('joinWithFlanks', (value: unknown, sep: unknown) =>
		flankJoin(value, sep, { leading: true, trailing: true }),
	)
}
