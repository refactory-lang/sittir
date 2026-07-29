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
 *
 * PIN-AT-LINK CONTRACT: within the main compiler pipeline, `compileWordMatcher`
 * is called EXACTLY ONCE per grammar —
 * in `compiler/link.ts`'s `link()`, over `raw.rules` (the evaluate-view rule
 * tree, where the `word` rule's authored wrappers, notably a trailing
 * `REPEAT`, are still intact). The result is carried forward unchanged as
 * `wordMatcher` on `LinkedGrammar` → `NormalizedGrammar` → `SimplifiedGrammar`
 * → `NodeMap`; every downstream consumer (`AssembleCtx.from`, `assemble()`,
 * `TemplateEmitter`) reads the carried field — none may call
 * `compileWordMatcher` again over a post-link rules view
 * (`linkRules`/`normalizedRules`/`rules`). Recompiling from a post-normalize
 * view is unsound in general: wrapper-deletion collapses `REPEAT`/`OPTIONAL`
 * wrappers into leaf `multiplicity` attributes that `ruleToRegexSource`
 * doesn't consult, so a post-link recompile can silently undercount the
 * regex — confirmed regression on typescript's `identifier` word rule, which
 * loses its trailing `REPEAT` under this hazard. (The separate `dsl/enrich.ts`
 * caller predates Link entirely — it runs during Evaluate's DSL-authoring
 * pass, over its own `rulesBag`, and is a distinct, earlier compilation; it is
 * not part of the pin-and-carry chain described here.)
 */

import { CHOICE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../types/rule.ts';

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

export function matchesWordShape(value: string, wordMatcher: RegExp | undefined): boolean {
	return wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value);
}

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
			/* No TERMINAL case: the Rule union has no TerminalRule variant.
			   (IMMEDIATE_TOKEN is a tree-sitter-native shape that never appears in
			   sittir's AnyRule union, so no case is needed for it either.) */
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
			/* symbol / field / variant / supertype / enum / indent / dedent /
			   newline — none of these have a single regex representation
			   without additional context. */
			return null;
	}
}

function escapeRegexLiteral(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
