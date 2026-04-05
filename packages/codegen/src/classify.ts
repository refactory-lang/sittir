/**
 * Children classification — simplify grammar rules to determine template patterns.
 *
 * Strips anonymous tokens from SEQs, unwraps single-member SEQs, and leaves
 * CHOICEs intact. Used by the template emitter and wrap heuristics to decide
 * which template pattern each node kind gets.
 */

import type { GrammarRule, Grammar } from './grammar.ts';

// ---------------------------------------------------------------------------
// Classification result
// ---------------------------------------------------------------------------

export type ClassifiedPattern =
	| { type: 'symbol'; name: string }
	| { type: 'repeat'; content: ClassifiedPattern }
	| { type: 'seq'; members: ClassifiedPattern[] }
	| { type: 'choice'; members: ClassifiedPattern[] }
	| { type: 'empty' };

/**
 * Classify a grammar rule by simplifying it:
 * 1. Strip STRING (anonymous token) nodes from SEQs
 * 2. Unwrap single-member SEQs
 * 3. Strip PREC/PREC_LEFT/PREC_RIGHT/PREC_DYNAMIC wrappers
 * 4. Strip FIELD wrappers (keep content)
 * 5. Leave CHOICEs intact
 * 6. Convert REPEAT/REPEAT1 to 'repeat'
 * 7. Convert SYMBOL to 'symbol'
 * 8. Convert BLANK to 'empty'
 */
export function classifyRule(rule: GrammarRule): ClassifiedPattern {
	switch (rule.type) {
		case 'SYMBOL':
			return { type: 'symbol', name: rule.name };

		case 'STRING':
		case 'PATTERN':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			// Anonymous tokens are stripped
			return { type: 'empty' };

		case 'BLANK':
			return { type: 'empty' };

		case 'FIELD':
			return classifyRule(rule.content);

		case 'ALIAS':
			return classifyRule(rule.content);

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			return classifyRule(rule.content);

		case 'REPEAT':
		case 'REPEAT1':
			return { type: 'repeat', content: classifyRule(rule.content) };

		case 'SEQ': {
			const members = rule.members
				.map(m => classifyRule(m))
				.filter(m => m.type !== 'empty');
			if (members.length === 0) return { type: 'empty' };
			if (members.length === 1) return members[0]!;
			return { type: 'seq', members };
		}

		case 'CHOICE': {
			const members = rule.members.map(m => classifyRule(m));
			// Don't filter empty from CHOICE — BLANK branches are meaningful
			return { type: 'choice', members };
		}

		default:
			return { type: 'empty' };
	}
}

/**
 * Collect anonymous token values from a grammar rule (for heuristic 3/4/5).
 * Returns tokens in order of appearance.
 */
export function collectAnonymousTokenValues(rule: GrammarRule): string[] {
	const tokens: string[] = [];
	walkRuleOrdered(rule, r => {
		if (r.type === 'STRING') tokens.push(r.value);
	});
	return tokens;
}

/**
 * Collect the top-level positional structure of a SEQ rule.
 * Returns array of { kind: 'symbol'|'token', value: string } in order.
 * Used by heuristic 4 (token-positional) to determine split points.
 */
export interface PositionalElement {
	kind: 'symbol' | 'token' | 'field';
	value: string;
}

export function collectPositionalElements(rule: GrammarRule): PositionalElement[] {
	const elements: PositionalElement[] = [];
	collectPositionalInner(rule, elements);
	return elements;
}

function collectPositionalInner(rule: GrammarRule, elements: PositionalElement[]): void {
	switch (rule.type) {
		case 'SEQ':
			for (const m of rule.members) collectPositionalInner(m, elements);
			break;
		case 'SYMBOL':
			elements.push({ kind: 'symbol', value: rule.name });
			break;
		case 'STRING':
			elements.push({ kind: 'token', value: rule.value });
			break;
		case 'FIELD':
			elements.push({ kind: 'field', value: rule.name });
			collectPositionalInner(rule.content, elements);
			break;
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			collectPositionalInner(rule.content, elements);
			break;
		case 'REPEAT':
		case 'REPEAT1':
			collectPositionalInner(rule.content, elements);
			break;
		default:
			break;
	}
}

function walkRuleOrdered(rule: GrammarRule, fn: (r: GrammarRule) => void): void {
	fn(rule);
	if ('members' in rule && Array.isArray((rule as any).members)) {
		for (const m of (rule as any).members as GrammarRule[]) walkRuleOrdered(m, fn);
	}
	if ('content' in rule && (rule as any).content) walkRuleOrdered((rule as any).content as GrammarRule, fn);
}
