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
import type { Rule } from '../types/rule.ts';
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
 * Pure, children-free terminality predicate over a {@link Rule<'evaluate'>}.
 *
 * Shares the per-rule-type decision table with {@link classifyIntrinsic} (in
 * evaluate.ts) via {@link classifyByType}, but recurses on the rule's own
 * children instead of pre-classified `BuildResult`s, so it can be called
 * outside the catalog build (e.g. wrapper-deletion push-down).
 *
 * Returns `true` when the rule is intrinsically a slot-bearing nonterminal.
 */
export function isNonterminalRuleType(rule: Rule<'evaluate'>): boolean {
	const anyChildNonterminal = ruleChildren(rule).some(isNonterminalRuleType);
	return classifyByType(rule.type, anyChildNonterminal) === 'nonterminal';
}

function ruleChildren(rule: Rule<'evaluate'>): readonly Rule<'evaluate'>[] {
	switch (rule.type) {
		case TOKEN:
		case FIELD:
		case ALIAS:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'evaluate'> union.
			return [rule.content];
		case SEQ:
			return rule.members;
		default:
			return [];
	}
}
