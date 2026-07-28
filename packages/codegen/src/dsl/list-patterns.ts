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

interface SeparatorFact {
	readonly value: RuntimeRule;
	readonly trailing?: SeparatorFlankMode;
	readonly leading?: SeparatorFlankMode;
}

export function separatorFactsEqual(a: SeparatorFact | undefined, b: SeparatorFact | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return a.trailing === b.trailing && a.leading === b.leading && rulesEqual(a.value, b.value);
}

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
			return true;
		case 'token':
		case 'immediate_token':
			return rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		case 'prec':
		case 'prec_left':
		case 'prec_right':
		case 'prec_dynamic':
			// `.value` is a number for PREC_DYNAMIC, number-or-name for the others.
			return A.value === B.value && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule);
		case 'alias':
			// ALIAS renames its `.content` to the display name `.value`, with
			// `.named` toggling named-vs-anonymous CST visibility.
			return (
				A.value === B.value && A.named === B.named && rulesEqual(A.content as RuntimeRule, B.content as RuntimeRule)
			);
		default:
			return false;
	}
}

export function firstStringOfChoice(r: RuntimeRule): string | null {
	if (!typeEq(r.type, 'CHOICE')) return null;
	const members = ((r as { members?: RuntimeRule[] }).members ?? []) as RuntimeRule[];
	const lit = members.find((m) => typeEq(m.type, 'STRING'));
	return lit ? ((lit as { value?: unknown }).value as string) : null;
}

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
