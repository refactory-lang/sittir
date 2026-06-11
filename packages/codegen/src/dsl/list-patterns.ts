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
 * **Case-agnostic by design.** DSL-layer code runs under two runtimes
 * (sittir lowercase `'seq'`/`'string'`…, tree-sitter CLI uppercase
 * `'SEQ'`/`'STRING'`…); enrich in particular sees both. Every type check
 * goes through `typeEq` so the same detector works in either runtime. See
 * `runtime-shapes.ts` for the dual-case predicate rationale.
 *
 * **Pre-pushdown only.** List/separator/trailing shapes are reconstructable
 * only while the wrappers (`optional`/`repeat`/`repeat1`/`field`) are intact
 * — i.e. enrich/wire/evaluate/link/optimize. Do NOT call these after
 * wrapper-deletion (simplify/assemble/emit), where the wrappers have already
 * been flattened to `nonterminal`/`multiplicity`/`separator` attributes.
 */

import { typeEq, type RuntimeRule } from '../types/runtime-shapes.ts';

/**
 * Structural equality for rule trees, across both runtime casings. Limited to
 * the rule shapes that exist pre-link (no polymorph/supertype/terminal — those
 * appear only after Link). Used by the commaSep1 lift to verify a seq's
 * standalone element matches the repeat's content.
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
			return A.separator === B.separator && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
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
	if (!typeEq(r.type, 'choice')) return null;
	const members = ((r as { members?: RuntimeRule[] }).members ?? []) as RuntimeRule[];
	const lit = members.find((m) => typeEq(m.type, 'string'));
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
	if (!typeEq(resolved.type, 'seq')) return null;
	const members = (resolved as { members?: R[] }).members;
	if (!members || members.length !== 2) return null;
	const [first, second] = members as [R, R];

	const firstStr = typeEq(first.type, 'string') ? ((first as { value?: unknown }).value as string) : null;
	const secondStr = typeEq(second.type, 'string') ? ((second as { value?: unknown }).value as string) : null;

	// Canonical: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing).
	if (firstStr !== null && secondStr === null) return { content: second, separator: firstStr };
	if (secondStr !== null && firstStr === null) return { content: first, separator: secondStr, trailing: true };

	// Choice-of-separators in the separator position.
	const firstSepChoice = typeEq(first.type, 'choice') ? firstStringOfChoice(first) : null;
	const secondSepChoice = typeEq(second.type, 'choice') ? firstStringOfChoice(second) : null;
	if (firstSepChoice !== null && secondStr === null) return { content: second, separator: firstSepChoice };
	if (secondSepChoice !== null && firstStr === null) return { content: first, separator: secondSepChoice, trailing: true };

	return null;
}
