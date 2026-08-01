/**
 * dsl/shared.ts — canonical structural-identity key for rule shapes.
 *
 * `ruleKey` gives every distinguishable rule shape a stable string, so a
 * many-way "have I already seen a rule structurally identical to this one"
 * lookup is a single `Map<string, ...>` pass (O(n)) instead of a pairwise
 * scan against every candidate seen so far (O(n^2)). `list-patterns.ts`'s
 * `rulesEqual` is defined in terms of it: `ruleKey(a) === ruleKey(b)` iff
 * `rulesEqual(a, b)`. `enrich.ts`'s group/clause-hoist dedupe
 * (`visibleGroupSynthName`/`clauseHoistSynthName`) key their dedupe maps
 * with it too, in place of a former standalone `canonicalStringifyClause`.
 *
 * Deliberately minimal traversal: `type`, `name`, `value`, `named`,
 * `separator`, and children (`.members` or `.content`, whichever is present)
 * are the only fields read. DSL-layer rules are materialized by two
 * different runtimes (sittir's own `evaluate()`, tree-sitter's CLI) that
 * agree on these but aren't guaranteed to agree on every shape a field can
 * take, or on which extra bookkeeping fields get stamped onto a rule object
 * along the way — e.g. `.separator` is a plain string pre-lift and a
 * `{value,trailing,leading}` fact post-lift for the exact same logical
 * rule; a raw string literal used directly inside `seq(...)`/`choice(...)`
 * is still a bare string (not yet coerced to a `STRING` rule node) at the
 * point enrich runs; and sittir's own `evaluate()` runtime stamps every
 * `$.foo` reference with a `_ref: {refType, from, to}` provenance field
 * that tree-sitter's CLI runtime never adds. That last one is exactly what
 * broke group-dedupe before this key existed: hashing a rule by its whole
 * object (minus a hand-maintained exclusion list of known-bad fields like
 * `_ref`) meant every NEW provenance stamp added anywhere in the Rule shape
 * was a fresh way for the same logical body to hash differently under the
 * two runtimes, re-opening the exact bug — a rust `slice_pattern`/
 * `tuple_struct_pattern` shared group body minted as two silently-empty
 * phantom duplicates instead of one. Reading a small, fixed, INCLUSION list
 * of fields is immune to that failure mode by construction: an unlisted
 * field, however it got stamped or by whichever runtime, is never read, so
 * it can never affect the key.
 *
 * Only fields a shape's identity depends on are read — never the whole rule
 * object. `metadata`, `id`, `inline`, and other `RuleBase` bookkeeping are
 * diagnostic-only and must not affect whether two rules count as "the same"
 * (see `.claude/coding-standards.md` on metadata never driving behavior).
 *
 * `SYMBOL` has no `.content`/`.members` — it's a leaf keyed by `.name` alone,
 * never recursing into the rule it references, which is also what keeps
 * this cycle-safe on self-referential (recursive) grammar rules.
 */

import type { RuntimeRule } from '../types/runtime-shapes.ts';

type CanonicalForm = string | number | boolean | null | readonly CanonicalForm[];

export function ruleKey(rule: RuntimeRule): string {
	return JSON.stringify(canonicalize(rule));
}

function canonicalize(rule: unknown): CanonicalForm {
	if (typeof rule !== 'object' || rule === null) return rule as CanonicalForm;
	const r = rule as Record<string, unknown>;
	const type = (r.type as string | undefined) ?? null;
	const name = typeof r.name === 'string' ? r.name : null;
	const value = typeof r.value === 'string' || typeof r.value === 'number' ? r.value : null;
	const named = typeof r.named === 'boolean' ? r.named : null;
	const separator = 'separator' in r ? canonicalizeSeparator(r.separator) : null;

	const members = r.members as readonly unknown[] | undefined;
	if (members !== undefined) return [type, name, value, named, separator, members.map(canonicalize)];

	const content = r.content;
	if (content !== undefined) return [type, name, value, named, separator, [canonicalize(content)]];

	return [type, name, value, named, separator, null];
}

function canonicalizeSeparator(separator: unknown): CanonicalForm {
	if (typeof separator !== 'object' || separator === null) return separator as CanonicalForm;
	const sep = separator as { readonly value?: unknown; readonly trailing?: unknown; readonly leading?: unknown };
	return [
		'fact',
		typeof sep.trailing === 'string' ? sep.trailing : null,
		typeof sep.leading === 'string' ? sep.leading : null,
		canonicalize(sep.value)
	];
}
