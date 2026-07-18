/**
 * dsl/list-patterns.ts — pure, case-agnostic separated-list pattern detection.
 *
 * These are DETECTION primitives only: they inspect rule shapes and report
 * what they find (a separator string, structural equality) WITHOUT mutating
 * anything. What a caller DOES with a detected pattern is stage-specific —
 * enrich uses detection for GROUP CREATION, evaluate (today) for the
 * separator LIFT, link (future) likewise. Keeping detection pure lets every
 * stage share one source of truth for "what a separated list looks like".
 *
 * **Runtime-agnostic by design.** DSL-layer code runs under two runtimes
 * (sittir, tree-sitter CLI) that now agree on UPPERCASE discriminants;
 * enrich in particular sees both. Every type check goes through `typeEq`
 * (kept as the single spelling for a type-tag comparison, even though it
 * is now a plain equality check) so the same detector reads uniformly
 * across call sites. See `runtime-shapes.ts` for the boundary module's
 * remaining job (shape, not case, normalization).
 *
 * **Pre-pushdown only.** List/separator/trailing shapes are reconstructable
 * only while the wrappers (`optional`/`repeat`/`repeat1`/`field`) are intact
 * — i.e. enrich/wire/evaluate/link/normalize. Do NOT call these after
 * wrapper-deletion (simplify/assemble/emit), where the wrappers have already
 * been flattened to `nonterminal`/`multiplicity`/`separator` attributes.
 */

import { typeEq, type RuntimeRule } from '../types/runtime-shapes.ts';
import type { SeparatorFlankMode } from '../types/rule.ts';

/**
 * The nested separator fact's shape (`{value, trailing?, leading?}`, PR-S),
 * phrased structurally over `RuntimeRule` (rather than a specific
 * `RuleBase<Phase>['separator']`) so `separatorFactsEqual` accepts the fact
 * at ANY phase view (`RuleBase<'normalize'>.separator`,
 * `RepeatRule<'link'>.separator`, …) without a phase-widening cast at the
 * call site — they all share this identical structural shape post-PR-S.
 */
interface SeparatorFact {
	readonly value: RuntimeRule;
	readonly trailing?: SeparatorFlankMode;
	readonly leading?: SeparatorFlankMode;
}

/**
 * Structural equality for the nested separator fact
 * (`{value, trailing?, leading?}`, PR-S). The wrapper object itself has no
 * `.type` discriminant, so `rulesEqual` can't be called on it directly —
 * compare `trailing`/`leading` primitively and `value` (the inner Rule) via
 * `rulesEqual`.
 *
 * SSOT for this comparison: both `rulesEqual` below (repeat/repeat1 case) and
 * `normalize.ts`'s own `rulesEqual` (REPEAT case) delegate here instead of
 * `===`, which — post-PR-S — would compare object identity on a freshly
 * allocated wrapper per lift call rather than the separator's actual value.
 *
 * `rulesEqual(a.value, b.value)` runs on the separator's inner Rule, which is
 * always a terminal/simple rule (a literal string or a small choice/seq of
 * literals) even when this helper is reached post-wrapper-deletion (e.g. from
 * `rule-attrs.ts`'s `sharedArmAttrs`) — so it's safe despite `rulesEqual`'s own
 * "do NOT call after wrapper-deletion" doc note, which is about the STRUCTURAL
 * rule being compared, not this always-simple nested value.
 */
export function separatorFactsEqual(a: SeparatorFact | undefined, b: SeparatorFact | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return a.trailing === b.trailing && a.leading === b.leading && rulesEqual(a.value, b.value);
}

/**
 * Structural equality for rule trees. Limited to the rule shapes that exist
 * pre-link (no polymorph/supertype/terminal — those appear only after
 * Link). Used by the commaSep1 lift to verify a seq's standalone element
 * matches the repeat's content. Lowers both sides' `type` before comparing
 * so this stays correct regardless of case (both runtimes agree on
 * UPPERCASE today, but the lower-both-sides comparison needs no update if
 * that ever changes).
 */
export function rulesEqual(a: RuntimeRule, b: RuntimeRule): boolean {
	const ta = a.type.toLowerCase();
	if (ta !== b.type.toLowerCase()) return false;
	const A = a as Record<string, unknown>;
	const B = b as Record<string, unknown>;
	switch (ta) {
		case 'string':
		case 'pattern':
			return A.value === B.value;
		case 'symbol':
			return A.name === B.name;
		case 'enum': {
			const am = A.members as { value: unknown }[];
			const bm = B.members as { value: unknown }[];
			return am.length === bm.length && am.every((m, i) => m.value === bm[i]!.value);
		}
		case 'seq':
		case 'choice': {
			const am = A.members as RuntimeRule[];
			const bm = B.members as RuntimeRule[];
			return am.length === bm.length && am.every((m, i) => rulesEqual(m, bm[i]!));
		}
		case 'optional':
			return rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		case 'repeat':
		case 'repeat1': {
			// `.separator` is either a plain string (evaluate-phase, unlifted) or
			// the nested {value, trailing?, leading?} fact (link-phase, PR-S) — a
			// freshly-allocated wrapper object per lift call, so `===` incorrectly
			// treats two structurally-identical separators as unequal. Compare via
			// separatorFactsEqual only when BOTH sides are the object form; a
			// mixed object-vs-string comparison (one side already lifted, the
			// other not) falls through to `===` (correctly `false`) instead of
			// casting the string side to SeparatorFact and crashing inside
			// separatorFactsEqual reading `.value`/`.trailing` off a string.
			const aObj = typeof A.separator === 'object' && A.separator !== null;
			const bObj = typeof B.separator === 'object' && B.separator !== null;
			const sepEqual =
				aObj && bObj
					? separatorFactsEqual(A.separator as SeparatorFact, B.separator as SeparatorFact)
					: A.separator === B.separator;
			return sepEqual && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		}
		case 'field':
			return A.name === B.name && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		case 'blank':
			// No fields to compare — two BLANKs are always structurally equal
			// (the type-tag match above already confirmed both are BLANK).
			return true;
		case 'token':
		case 'immediate_token':
			// Wrapper types: `.content` is the wrapped rule. `immediate` is a
			// TYPE distinction (TOKEN vs IMMEDIATE_TOKEN), already separated by
			// the type-tag match above, so only `.content` remains to compare.
			return rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		case 'prec':
		case 'prec_left':
		case 'prec_right':
		case 'prec_dynamic':
			// Precedence wrappers carry the precedence level/number as `.value`
			// (number for PREC_DYNAMIC, number-or-name for the others) plus the
			// wrapped `.content`. Both must match — two identical bodies at
			// different precedence levels are NOT interchangeable.
			return A.value === B.value && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		case 'alias':
			// ALIAS renames its `.content` to the display name `.value`, with
			// `.named` toggling named-vs-anonymous CST visibility. All three
			// (content shape, target name, named-ness) must match for two
			// ALIAS nodes to be structurally equal.
			return (
				A.value === B.value && A.named === B.named && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule)
			);
		default:
			return false;
	}
}

/**
 * Extract the first string literal from a choice rule, if any.
 *
 * Handles the choice-of-separators pattern (e.g. tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`): the separator position is a choice
 * of a literal and an external symbol. The first string member is the
 * canonical render-side separator; parse still accepts either form.
 */
export function firstStringOfChoice(r: RuntimeRule): string | null {
	if (!typeEq(r.type, 'CHOICE')) return null;
	const members = ((r as { members?: RuntimeRule[] }).members ?? []) as RuntimeRule[];
	const lit = members.find((m) => typeEq(m.type, 'STRING'));
	return lit ? ((lit as { value?: unknown }).value as string) : null;
}

/**
 * Detect the `seq(SEP, X)` / `seq(X, SEP)` separated-list shape inside a
 * repeat/repeat1 content body, where `SEP` is a string literal or a choice
 * whose arms may include non-literal (symbol/external-scanner) members —
 * not just a choice-of-literals. Returns the non-separator content, the FULL
 * detected separator rule (a `StringRule` for the literal case, the whole
 * `ChoiceRule` for a choice-shaped one — no longer narrowed to its first arm,
 * PR-S, and no longer required to contain a string arm at all), and whether
 * the separator was trailing (`seq(X, SEP)`); or `null` when no separator
 * shape is present.
 *
 * Callers that need a literal string out of a returned CHOICE separator
 * (e.g. `enrich.ts`'s `listSeparatorOfOptionalSeq`) must handle the
 * no-string-arm case themselves — `firstStringOfChoice` returns `null` for
 * an all-symbol choice, which is not the same as "no separator shape here".
 *
 * Pure: reports the shape; the caller decides whether to lift it onto a
 * `repeat` (link) or read it for group creation (enrich).
 */
export function detectRepeatSeparator<R extends RuntimeRule>(
	resolved: R
): { content: R; separator: R; trailing?: boolean } | null {
	if (!typeEq(resolved.type, 'SEQ')) return null;
	const members = (resolved as { members?: R[] }).members;
	if (!members || members.length !== 2) return null;
	const [first, second] = members as [R, R];

	const firstIsStr = typeEq(first.type, 'STRING');
	const secondIsStr = typeEq(second.type, 'STRING');

	// Canonical: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing).
	if (firstIsStr && !secondIsStr) return { content: second, separator: first };
	if (secondIsStr && !firstIsStr) return { content: first, separator: second, trailing: true };

	// Choice-of-separators in the separator position — preserve the FULL
	// choice; the caller (and everything downstream, per PR-S) now knows how
	// to handle a non-literal separator rule. No literal-presence check here
	// by design: a choice with zero STRING arms (all-symbol/external-scanner)
	// still counts as a detected separator shape — it's up to the caller to
	// decide what to do when it can't extract a literal from it.
	const firstIsChoice = typeEq(first.type, 'CHOICE');
	const secondIsChoice = typeEq(second.type, 'CHOICE');
	if (firstIsChoice && !secondIsStr) return { content: second, separator: first };
	if (secondIsChoice && !firstIsStr) return { content: first, separator: second, trailing: true };

	return null;
}
