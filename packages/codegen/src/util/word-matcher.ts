/**
 * util/word-matcher.ts — grammar-aware word/identifier-shape matching.
 *
 * Foundational utility layer: depends only on the Rule IR (`types/`), so it can
 * be shared by dsl, compiler, and emitters without a layering cycle
 * (`types <- util <- dsl <- compiler <- emitters`). Relocated from the former
 * `compiler/common.ts` so the dsl layer can consume it too.
 *
 * Single source of truth for "does this string lex as a word under the
 * grammar's `word` rule?" — `compileWordMatcher` builds the grammar-derived
 * RegExp; `matchesWordShape` is the canonical predicate that bakes the
 * `/^\w+$/` fallback so call sites never re-spell it.
 */

import { CHOICE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../types/rule.ts';

/**
 * Compile the grammar's `word` rule into a full-match RegExp so callers can
 * check whether an arbitrary string matches the grammar's identifier shape
 * (e.g. "does `match` look like an identifier under python's soft-keyword
 * rules?").
 *
 * Returns `undefined` when:
 * - `word` is null / missing / not a known rule name.
 * - The rule's tree references shapes the walker doesn't understand (e.g. a
 *   symbol ref into another rule). Callers should route through
 *   {@link matchesWordShape}, which applies the `/^\w+$/` fallback in that case.
 *
 * @remarks
 *   First tries the `u` flag (needed for `\p{...}` property escapes); if that
 *   fails, retries flag-less so older grammars keep working.
 */
export function compileWordMatcher(
	word: string | null | undefined,
	rules: Record<string, AnyRule>
): RegExp | undefined {
	if (!word) return undefined;
	const wordRule = rules[word];
	if (!wordRule) return undefined;
	const src = ruleToRegexSource(wordRule);
	if (src === null) return undefined;
	const full = `^(?:${src})$`;
	try {
		return new RegExp(full, 'u');
	} catch {
		try {
			return new RegExp(full);
		} catch {
			return undefined;
		}
	}
}

/**
 * The canonical "does this literal lex as a word?" predicate — i.e. whether
 * tree-sitter will lex it as a word token under the grammar's `word` rule.
 *
 * Single source of truth for the keyword/word-shape test: pass the grammar's
 * compiled matcher (from {@link compileWordMatcher}) when available; when it is
 * `undefined` (no `word` declaration, or the rule shape isn't expressible as a
 * single regex), this falls back to the conservative `/^\w+$/` heuristic.
 * Call sites MUST route through this rather than re-spelling the fallback.
 *
 * @param value - The literal text from the grammar (e.g. `"if"`, `"+"`, `"->"`).
 * @param wordMatcher - The compiled word-rule pattern, or `undefined`.
 * @returns `true` when `value` has word shape (→ `AssembledKeyword`); `false`
 *   for punctuation / operators (→ `AssembledToken`).
 */
export function matchesWordShape(value: string, wordMatcher: RegExp | undefined): boolean {
	return wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value);
}

/**
 * Convert a Rule subtree to a regex source fragment. Returns `null`
 * for shapes that can't be expressed as a single regex — notably
 * symbol references (which would need another rule lookup) and
 * anything outside the supported text-terminal shapes.
 *
 * This walker runs in BOTH the sittir pipeline and the tree-sitter CLI path
 * (where enrich() sees the native DSL objects), but both now agree on
 * UPPERCASE discriminants (`'PATTERN'`, `'TOKEN'`, `'IMMEDIATE_TOKEN'`, …) —
 * no case normalization needed. (Previously the CLI path silently fell back
 * to `/^\w+$/` while the sittir path used the real grammar word rule,
 * letting keyword-promotion diverge between parser and IR — PR #111 review
 * finding; the dual-case boundary that caused that is now dissolved.)
 */
function ruleToRegexSource(rule: AnyRule): string | null {
	const shaped = rule as {
		value?: string;
		content?: AnyRule;
		members?: readonly AnyRule[];
	};
	switch (rule.type) {
		case PATTERN:
			return shaped.value ?? null;
		case STRING:
			return shaped.value === undefined ? null : escapeRegexLiteral(shaped.value);
		case TOKEN:
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule union.
			// (IMMEDIATE_TOKEN is a tree-sitter-native shape that never appears in
			// sittir's AnyRule union, so no case is needed for it here.)
			return shaped.content ? ruleToRegexSource(shaped.content) : null;
		case SEQ: {
			const parts: string[] = [];
			for (const m of shaped.members ?? []) {
				const p = ruleToRegexSource(m);
				if (p === null) return null;
				parts.push(`(?:${p})`);
			}
			return parts.join('');
		}
		case CHOICE: {
			const parts: string[] = [];
			for (const m of shaped.members ?? []) {
				const p = ruleToRegexSource(m);
				if (p === null) return null;
				parts.push(p);
			}
			return `(?:${parts.join('|')})`;
		}
		case OPTIONAL: {
			const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
			if (p === null) return null;
			return `(?:${p})?`;
		}
		case REPEAT: {
			const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
			if (p === null) return null;
			return `(?:${p})*`;
		}
		case REPEAT1: {
			const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
			if (p === null) return null;
			return `(?:${p})+`;
		}
		default:
			// symbol / field / variant / supertype / enum / indent /
			// dedent / newline — none of these have a single regex
			// representation without additional context.
			return null;
	}
}

function escapeRegexLiteral(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
