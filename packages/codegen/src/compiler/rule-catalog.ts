/**
 * compiler/rule-catalog.ts — Shared rule-type terminality classification.
 *
 * `buildRuleCatalog`/`attachReferenceRuleIds` (Evaluate-owned rule occurrence
 * identity) moved to evaluate.ts — Evaluate is the only phase that assigns
 * foundational occurrence identity and rule classification. This module
 * retains `classifyByType`, the shared per-rule-type terminality decision
 * table, and `isNonterminalRuleType`, the children-free predicate built on
 * it that later phases (e.g. wrapper-deletion) call directly.
 */

import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import { assertNever } from '../polymorph-variant.ts';
import type { AnyRule, PhaseName, Rule } from '../types/rule.ts';
import type { RuleClassification } from './types.ts';

/**
 * Single source of truth for the rule-type → terminality decision
 * (Table 1 in the nonterminal-driven-slot-derivation design).
 *
 * Both {@link classifyIntrinsic} (in evaluate.ts's catalog build, classifies
 * pre-built `BuildResult` children) and {@link isNonterminalRuleType} (children-free
 * predicate over a bare `Rule<'evaluate'>`) call this with their own computation of
 * `anyChildNonterminal`, so the per-rule-type table lives in one place.
 */
export function classifyByType(
	ruleType: Rule<'evaluate'>['type'],
	anyChildNonterminal: boolean
): RuleClassification['kind'] {
	switch (ruleType) {
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
			// PR-P: ENUM case removed — enum-shaped ChoiceRules use CHOICE arm.
			return 'nonterminal';
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			// Unconditionally nonterminal: a choice is a single union slot
			// (literal-only = enum); a repeat captures a variable-length
			// sequence (array slot) even when its content is terminal.
			return 'nonterminal';
		case STRING:
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'evaluate'> union.
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return 'terminal';
		case TOKEN:
		case FIELD:
		case ALIAS:
		case SEQ:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
			// Recursive: nonterminal iff any child is.
			return anyChildNonterminal ? 'nonterminal' : 'terminal';
		default:
			return assertNever(ruleType);
	}
}

/**
 * Pure, children-free terminality predicate over a {@link Rule}, generic
 * over its phase so callers keep their own `Rule<P>` precision (not widened
 * to {@link AnyRule} at the call site).
 *
 * @remarks
 * The body routes through `AnyRule` internally, then casts back: narrowing
 * `rule.type` on a `Rule<Phase>` with an UNRESOLVED generic `Phase` doesn't
 * work, because `Rule<Phase>` unions in a conditional member
 * (`OptionalRule<T> = T extends WrapperPhase ? ... : never`) that
 * TypeScript can't distribute over a generic — the switch below produces an
 * unresolvable `Rule<'evaluate'> | Rule<'link'> | Rule<Phase>` type instead
 * of collapsing to the matched arm if written directly against `Rule<Phase>`.
 * `AnyRule` is a fully resolved union (every phase already substituted), so
 * narrowing on it works. The cast back to `Rule<Phase>` is sound because a
 * rule's structural children are always the SAME phase as their parent —
 * phase is a whole-tree property, not a per-node one — so `AnyRule`'s
 * narrowed `.content`/`.members` really are `Rule<Phase>` values here, just
 * not something TypeScript can verify through the conditional type.
 *
 * Shares the per-rule-type decision table with {@link classifyIntrinsic} (in
 * evaluate.ts) via {@link classifyByType}, but recurses on the rule's own
 * children instead of pre-classified `BuildResult`s, so it can be called
 * outside the catalog build (e.g. wrapper-deletion push-down).
 *
 * Returns `true` when the rule is intrinsically a slot-bearing nonterminal.
 */
export function isNonterminalRuleType<Phase extends PhaseName>(rule: Rule<Phase>): boolean {
	const anyChildNonterminal = ruleChildren(rule).some((child) => isNonterminalRuleType(child));
	return classifyByType(rule.type, anyChildNonterminal) === 'nonterminal';
}

function ruleChildren<Phase extends PhaseName>(rule: Rule<Phase>): readonly Rule<Phase>[] {
	// See isNonterminalRuleType's @remarks: narrow via AnyRule, cast back —
	// children share the parent's phase by construction. Exhaustive over
	// every AnyRule variant (no default fallthrough) so a newly added rule
	// type fails compilation here instead of silently contributing no
	// children — see classifyByType's own exhaustive switch for the sibling
	// convention.
	const anyRule = rule as AnyRule;
	switch (anyRule.type) {
		case TOKEN:
		case FIELD:
		case ALIAS:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'evaluate'> union.
			return [anyRule.content as Rule<Phase>];
		case SEQ:
			return anyRule.members as Rule<Phase>[];
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			// Unconditionally nonterminal per classifyByType — these children
			// never actually feed a classification decision — but returned
			// for real (not `[]`) so `ruleChildren` stays structurally honest
			// about what each rule type's children are.
			return (anyRule.type === CHOICE ? anyRule.members : [anyRule.content]) as Rule<Phase>[];
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		case STRING:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			// Genuinely childless: SYMBOL/PATTERN/STRING/INDENT/DEDENT/NEWLINE
			// are leaves; SUPERTYPE's `subtypes` are kind-name strings, not
			// Rule<Phase> nodes.
			return [];
		default:
			return assertNever(anyRule);
	}
}
