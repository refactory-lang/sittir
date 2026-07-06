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
	readonly trailing?: boolean;
	readonly leading?: boolean;
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
		case 'repeat1':
			// `.separator` is either a plain string (evaluate-phase, unlifted) or
			// the nested {value, trailing?, leading?} fact (link-phase, PR-S) — a
			// freshly-allocated wrapper object per lift call, so `===` incorrectly
			// treats two structurally-identical separators as unequal. Compare via
			// separatorFactsEqual for the object form; `===` still handles the
			// plain-string form (and the `undefined`/mixed cases) correctly since
			// separatorFactsEqual only applies to the object shape.
			return (
				(typeof A.separator === 'object' && A.separator !== null
					? separatorFactsEqual(A.separator as SeparatorFact, B.separator as SeparatorFact)
					: A.separator === B.separator) && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule)
			);
		case 'field':
			return A.name === B.name && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
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
 * repeat/repeat1 content body, where `SEP` is a string literal (or a
 * choice-of-literals — see {@link firstStringOfChoice}). Returns the
 * non-separator content, the separator string, and whether the separator
 * was trailing (`seq(X, SEP)`); or `null` when no separator shape is present.
 *
 * Pure: reports the shape; the caller decides whether to lift it onto a
 * `repeat` (evaluate) or read it for group creation (enrich).
 */
export function detectRepeatSeparator<R extends RuntimeRule>(
	resolved: R
): { content: R; separator: string; trailing?: boolean } | null {
	if (!typeEq(resolved.type, 'SEQ')) return null;
	const members = (resolved as { members?: R[] }).members;
	if (!members || members.length !== 2) return null;
	const [first, second] = members as [R, R];

	const firstStr = typeEq(first.type, 'STRING') ? ((first as { value?: unknown }).value as string) : null;
	const secondStr = typeEq(second.type, 'STRING') ? ((second as { value?: unknown }).value as string) : null;

	// Canonical: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing).
	if (firstStr !== null && secondStr === null) return { content: second, separator: firstStr };
	if (secondStr !== null && firstStr === null) return { content: first, separator: secondStr, trailing: true };

	// Choice-of-separators in the separator position.
	const firstSepChoice = typeEq(first.type, 'CHOICE') ? firstStringOfChoice(first) : null;
	const secondSepChoice = typeEq(second.type, 'CHOICE') ? firstStringOfChoice(second) : null;
	if (firstSepChoice !== null && secondStr === null) return { content: second, separator: firstSepChoice };
	if (secondSepChoice !== null && firstStr === null) return { content: first, separator: secondSepChoice, trailing: true };

	return null;
}
