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
