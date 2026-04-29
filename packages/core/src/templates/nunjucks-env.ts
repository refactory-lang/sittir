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

import nunjucks from 'nunjucks';
import type { FlankedChildArray } from '../render.ts';

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
export function createNunjucksEnvironment(
	templatesDir: string
): nunjucks.Environment {
	const loader = new nunjucks.FileSystemLoader(templatesDir, {
		noCache: false,
		watch: false
	});
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
		//   1. Unknown / unregistered filter — `{{ x | no_such }}`
		//      throws with filename context via the renderNunjucks
		//      wrap. Covered by the T038 test. (Our registered join*
		//      filters deliberately tolerate undefined to model the
		//      "optional multi-slot" case; other filters don't.)
		//   2. Template-file-missing — renderNunjucks in core/render.ts
		//      wraps Nunjucks errors with rule kind + filename context.
		//   3. Compile-time validation — Rust askama path (Phase 4,
		//      deferred) catches undefined refs at cargo build.
		throwOnUndefined: false,
		trimBlocks: false,
		lstripBlocks: false
	});
	registerSittirFilters(env);
	return env;
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
	 * Normalize the value a `join*` filter receives. Returns an array
	 * (happy path; caller joins with its sep) or a string (already-
	 * rendered scalar — passed through verbatim to cover the walker's
	 * legacy `$$$NAME` classification of single-slot container fields).
	 * Nullish becomes `''`. Any other shape (object, symbol, NodeData)
	 * is a context-builder bug: throw with filter name and value preview
	 * instead of silently rendering `"[object Object]"`.
	 */
	const normalizeJoinValue = (
		value: unknown,
		filterName: string
	): readonly string[] | string => {
		if (value === undefined || value === null) return '';
		if (Array.isArray(value)) return value as readonly string[];
		if (typeof value === 'string') return value;
		if (typeof value === 'number' || typeof value === 'boolean')
			return String(value);
		throw new TypeError(
			`${filterName}: unsupported value type ${typeof value} ` +
				`(value = ${JSON.stringify(value)?.slice(0, 120)}). Expected array / string / nullish; ` +
				`a foreign shape here indicates a context-builder bug.`
		);
	};
	const sepOf = (sep: unknown): string => (typeof sep === 'string' ? sep : '');
	// Line-comment-aware join. When a child ends with a `//` or `#`
	// line-terminated comment, force the following separator to be `\n`
	// instead of the configured one — otherwise joining with ` ` (block's
	// default) folds the next sibling into the comment at reparse time.
	// Mirrors the legacy `$$$CHILDREN` path's `endsLineComment` fixup in
	// `render.ts`, lifted here so the Jinja-driven `{{ children | join }}`
	// path handles it too. Cluster J (016): block round-trip on fixtures
	// containing `// comment` followed by a statement.
	const endsLineComment = (s: string): boolean => {
		const trimmed = s.replace(/[ \t]+$/, '');
		if (trimmed.endsWith('\n')) return false;
		return /(?:^|\n)\s*(?:\/\/|#)[^\n]*$/.test(trimmed);
	};
	const joinWithLineCommentFix = (
		parts: readonly string[],
		sep: string
	): string => {
		if (parts.length === 0) return '';
		if (parts.length === 1) return parts[0]!;
		const out: string[] = [];
		for (let i = 0; i < parts.length; i++) {
			out.push(parts[i]!);
			if (i < parts.length - 1) {
				out.push(endsLineComment(parts[i]!) ? '\n' : sep);
			}
		}
		return out.join('');
	};
	env.addFilter('join', (value: unknown, sep: unknown) => {
		const v = normalizeJoinValue(value, 'join');
		return Array.isArray(v) ? joinWithLineCommentFix(v, sepOf(sep)) : v;
	});
	const flankJoin = (
		value: unknown,
		sep: unknown,
		filterName: string,
		sides: { leading: boolean; trailing: boolean }
	): string => {
		const v = normalizeJoinValue(value, filterName);
		// `Array.isArray` widens `readonly string[]` to `any[]`, so the
		// negative branch here leaves `v` typed as `string | readonly
		// string[]` instead of `string`. An explicit string narrowing
		// matches the runtime shape — normalizeJoinValue only returns
		// array-or-string — without a cast.
		if (typeof v === 'string') return v;
		const s = sepOf(sep);
		const flanked = v as FlankedChildArray;
		const prefix = sides.leading && flanked._leading_anon === s ? s : '';
		const suffix = sides.trailing && flanked._trailing_anon === s ? s : '';
		return prefix + joinWithLineCommentFix(v, s) + suffix;
	};
	const joinWithTrailing = (value: unknown, sep: unknown) =>
		flankJoin(value, sep, 'joinWithTrailing', {
			leading: false,
			trailing: true
		})
	;
	env.addFilter('joinWithTrailing', joinWithTrailing);
	env.addFilter('join_with_trailing', joinWithTrailing);
	const joinWithLeading = (value: unknown, sep: unknown) =>
		flankJoin(value, sep, 'joinWithLeading', { leading: true, trailing: false })
	;
	env.addFilter('joinWithLeading', joinWithLeading);
	env.addFilter('join_with_leading', joinWithLeading);
	const joinWithFlanks = (value: unknown, sep: unknown) =>
		flankJoin(value, sep, 'joinWithFlanks', { leading: true, trailing: true })
	;
	env.addFilter('joinWithFlanks', joinWithFlanks);
	env.addFilter('join_with_flanks', joinWithFlanks);

	// Presence-check filters — templates use `{% if foo | isBlank %}`
	// (or the negated `{% if foo | isPresent %}`) for optional-field
	// rendering. The pair gives cross-renderer-compatible semantics:
	// nunjucks accepts undefined/null/empty-string/whitespace-only as
	// "blank"; askama's mirror filter (sittir-core::filters) applies
	// the same rule to its String-typed context fields.
	//
	// Why not `{% if foo %}` + askama's truthy-String check:
	//   askama requires bool expressions; String isn't bool. A custom
	//   filter converts the question ("is this present?") into a
	//   uniform bool regardless of renderer.
	const isBlank = (value: unknown): boolean => {
		if (value === undefined || value === null) return true;
		if (typeof value === 'string') return value.trim().length === 0;
		if (Array.isArray(value)) return value.length === 0;
		return false;
	};
	env.addFilter('isBlank', isBlank);
	env.addFilter('is_blank', isBlank);
	const isPresent = (value: unknown) => !isBlank(value);
	env.addFilter('isPresent', isPresent);
	env.addFilter('is_present', isPresent);

	// `value` filter — render an optional field as its inner value
	// when present, or empty string when absent. Pairs with `isPresent`
	// so templates can be:
	//
	//   {% if foo | isPresent %}{{ foo | value }}{% endif %}
	//
	// Cross-renderer semantics:
	//   - Nunjucks side: `foo` may be undefined/null/NodeData/string.
	//     Returns `""` for absent; otherwise coerces to string.
	//   - Askama side: `foo: Option<String>`. The sibling
	//     `sittir-core::filters::value` returns `""` for None, the
	//     inner String for Some(_). Optional fields stay typed as
	//     `Option<String>` so they preserve the absent-vs-present-empty
	//     distinction at the struct level.
	env.addFilter('value', (value: unknown): string => {
		if (value === undefined || value === null) return '';
		if (typeof value === 'string') return value;
		// NodeData / object — coerce via String() (most templates have
		// rendered-string children, so this path rarely fires).
		return String(value);
	});
}
