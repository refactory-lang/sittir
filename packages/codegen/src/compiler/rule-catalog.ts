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
			/* No separate ENUM case: enum-shaped ChoiceRules are classified under
			   the CHOICE arm below. */
			return 'nonterminal';
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			/* Unconditionally nonterminal: a choice is a single union slot
			   (literal-only = enum); a repeat captures a variable-length sequence
			   (array slot) even when its content is terminal. */
			return 'nonterminal';
		case STRING:
		/* No TERMINAL case: the Rule<'evaluate'> union has no TerminalRule
		   variant. */
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
		/* PREC family is stripped by evaluate.ts's `stripPrecedenceWrappers`
		   before this runs — see that function's doc comment — so these
		   cases are unreachable at runtime. Transparent single-child wrapper,
		   same as TOKEN/FIELD above. String literals (not rule-types.ts
		   consts): that module is deprecated for new imports — see its
		   header. */
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		/* IMMEDIATE_TOKEN is folded into TOKEN+immediate by evaluate.ts's
		   `normalizeImmediateTokens` before this runs — unreachable at
		   runtime, transparent single-child wrapper like TOKEN. */
		case 'IMMEDIATE_TOKEN':
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
	/* See isNonterminalRuleType's @remarks: narrow via AnyRule, cast back —
	   children share the parent's phase by construction. Exhaustive over
	   every AnyRule variant (no default fallthrough) so a newly added rule
	   type fails compilation here instead of silently contributing no
	   children — see classifyByType's own exhaustive switch for the sibling
	   convention. */
	const anyRule = rule as AnyRule;
	switch (anyRule.type) {
		case TOKEN:
		case FIELD:
		case ALIAS:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		/* PREC family: stripped before this runs (see classifyByType's PREC
		   comment) — unreachable at runtime, transparent single-child
		   wrapper for exhaustiveness. */
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			/* No TERMINAL case: the Rule<'evaluate'> union has no TerminalRule
			   variant. */
			return [anyRule.content as Rule<Phase>];
		case SEQ:
			return anyRule.members as Rule<Phase>[];
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			/* Unconditionally nonterminal per classifyByType — these children
			   never actually feed a classification decision — but returned for
			   real (not `[]`) so `ruleChildren` stays structurally honest about
			   what each rule type's children are. */
			return (anyRule.type === CHOICE ? anyRule.members : [anyRule.content]) as Rule<Phase>[];
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		case STRING:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			/* Genuinely childless: SYMBOL/PATTERN/STRING/INDENT/DEDENT/NEWLINE are
			   leaves; SUPERTYPE's `subtypes` are kind-name strings, not
			   Rule<Phase> nodes. */
			return [];
		default:
			return assertNever(anyRule);
	}
}
