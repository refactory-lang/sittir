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
import type { FlankedChildArray } from '../render.ts'

/**
 * Build a Nunjucks `Environment` configured for sittir templates:
 *
 * - File-system loader rooted at `templatesDir`.
 * - `trimBlocks: false`, `lstripBlocks: false` — whitespace control is
 *   expressed explicitly via `{%-` / `-%}` in templates (matches the
 *   walker's emission and Jinja2/askama standard semantics).
 * - `autoescape: false` — the render output is source code, not HTML.
 *   Autoescape would turn `<` into `&lt;` and break everything.
 * - `throwOnUndefined: false` — a template referencing an optional
 *   grammar field (e.g. `{{ visibility_modifier }}` on a node that
 *   doesn't have one) must render empty rather than throw. The inline
 *   comment at the option itself captures how FR-018 / SC-005 is still
 *   met for the typed-expression and template-file-missing channels.
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
	/**
	 * Normalize the value a `join*` filter receives.
	 *
	 * - `undefined` / `null`           — absent optional multi-slot; render `''`.
	 * - `readonly string[]`            — the happy path; caller joins with sep.
	 * - `string` / `number` / `boolean` — legacy walker behavior: some rules
	 *   classify a single-slot container field with `$$$NAME` (emits
	 *   `| join(sep)`); the factory-produced value is a pre-rendered scalar.
	 *   Coerce to string and return unwrapped — matches the legacy
	 *   regex-substitutor's `String(value)` fallback.
	 * - anything else (object, symbol, NodeData) — throw. A non-coerceable
	 *   value reaching a `join*` filter is a context-builder bug; silent
	 *   `"[object Object]"` in the rendered output only surfaces later
	 *   as a reparse failure.
	 */
	const scalarJoin = (value: unknown, filterName: string): { arr: readonly string[] | null; scalar: string | null } => {
		if (value === undefined || value === null) return { arr: null, scalar: null }
		if (Array.isArray(value)) return { arr: value as readonly string[], scalar: null }
		if (typeof value === 'string') return { arr: null, scalar: value }
		if (typeof value === 'number' || typeof value === 'boolean') return { arr: null, scalar: String(value) }
		throw new TypeError(
			`${filterName}: unsupported value type ${typeof value} ` +
			`(value = ${JSON.stringify(value)?.slice(0, 120)}). Expected array / string / nullish; ` +
			`a foreign shape here indicates a context-builder bug.`,
		)
	}
	const sepOf = (sep: unknown): string => typeof sep === 'string' ? sep : ''
	env.addFilter('join', (value: unknown, sep: unknown) => {
		const { arr, scalar } = scalarJoin(value, 'join')
		if (arr) return arr.join(sepOf(sep))
		return scalar ?? ''
	})
	const flankJoin = (
		value: unknown,
		sep: unknown,
		filterName: string,
		sides: { leading: boolean; trailing: boolean },
	): string => {
		const s = sepOf(sep)
		const { arr, scalar } = scalarJoin(value, filterName)
		if (!arr) return scalar ?? ''
		const flanked = arr as FlankedChildArray
		const leading = sides.leading ? flanked._leading_anon : undefined
		const trailing = sides.trailing ? flanked._trailing_anon : undefined
		const prefix = leading === s ? s : ''
		const suffix = trailing === s ? s : ''
		return prefix + arr.join(s) + suffix
	}
	env.addFilter('joinWithTrailing', (value: unknown, sep: unknown) =>
		flankJoin(value, sep, 'joinWithTrailing', { leading: false, trailing: true }),
	)
	env.addFilter('joinWithLeading', (value: unknown, sep: unknown) =>
		flankJoin(value, sep, 'joinWithLeading', { leading: true, trailing: false }),
	)
	env.addFilter('joinWithFlanks', (value: unknown, sep: unknown) =>
		flankJoin(value, sep, 'joinWithFlanks', { leading: true, trailing: true }),
	)
}
