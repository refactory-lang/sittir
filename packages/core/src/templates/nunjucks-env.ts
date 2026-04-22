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
	return new nunjucks.Environment(loader, {
		autoescape: false,
		throwOnUndefined: false,
		trimBlocks: false,
		lstripBlocks: false,
	})
}
