/**
 * Children classification — simplify grammar rules to determine template patterns.
 *
 * Two representations:
 *   simplifyRule()  — GrammarRule → GrammarRule (same AST type, stored on BranchRule/ContainerRule)
 *   classifyRule()  — GrammarRule → ClassifiedPattern (lightweight union for template decisions)
 *
 * simplifyRule strips tokens from SEQs, unwraps single-member SEQs,
 * collapses SEQ(X, X*) → REPEAT1(X), and leaves CHOICEs intact.
 */

import type { GrammarRule, Grammar } from './grammar.ts';

// ---------------------------------------------------------------------------
// simplifyRule — GrammarRule → GrammarRule (stored on enriched rules)
// ---------------------------------------------------------------------------

/**
 * Simplify a grammar rule in-place (returns new tree):
 * 1. Strip STRING/PATTERN/TOKEN/IMMEDIATE_TOKEN from SEQs
 * 2. Unwrap single-member SEQs
 * 3. Strip PREC/FIELD/ALIAS wrappers (keep content)
 * 4. Collapse SEQ(X, REPEAT(X)) → REPEAT1(X) and SEQ(REPEAT(X), X) → REPEAT1(X)
 * 5. Leave CHOICEs intact
 */
export function simplifyRule(rule: GrammarRule): GrammarRule {
	switch (rule.type) {
		case 'SYMBOL':
			return rule;

		case 'STRING':
		case 'PATTERN':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			return { type: 'BLANK' };

		case 'BLANK':
			return rule;

		case 'FIELD':
			// Preserve FIELD wrappers — downstream can use them to distinguish
			// field-owned children from positional children
			return { type: 'FIELD', name: rule.name, content: simplifyRule(rule.content) };

		case 'ALIAS':
			// Named aliases produce a named child node with the alias value as kind
			if (rule.named) return { type: 'SYMBOL', name: rule.value };
			// Unnamed aliases are just tokens
			return { type: 'BLANK' };

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			return simplifyRule(rule.content);

		case 'REPEAT':
			return { type: 'REPEAT', content: simplifyRule(rule.content) };

		case 'REPEAT1':
			return { type: 'REPEAT1', content: simplifyRule(rule.content) };

		case 'SEQ': {
			const members = rule.members
				.map(m => simplifyRule(m))
				.filter(m => m.type !== 'BLANK');
			if (members.length === 0) return { type: 'BLANK' };
			if (members.length === 1) return members[0]!;

			// Collapse SEQ(X, REPEAT/REPEAT1(X)) and SEQ(REPEAT/REPEAT1(X), X) → REPEAT1(X)
			if (members.length === 2) {
				const [a, b] = members;
				if ((b!.type === 'REPEAT' || b!.type === 'REPEAT1') && grammarRulesEqual(a!, b!.content)) {
					return { type: 'REPEAT1', content: a! };
				}
				if ((a!.type === 'REPEAT' || a!.type === 'REPEAT1') && grammarRulesEqual(b!, a!.content)) {
					return { type: 'REPEAT1', content: b! };
				}
			}

			return { type: 'SEQ', members };
		}

		case 'CHOICE': {
			const members = rule.members.map(m => simplifyRule(m));
			// Filter duplicates and collapse all-blank choices
			const nonBlank = members.filter(m => m.type !== 'BLANK');
			if (nonBlank.length === 0) return { type: 'BLANK' };
			const hasBlank = members.length > nonBlank.length;
			if (nonBlank.length === 1) {
				if (hasBlank) {
					// CHOICE(BLANK, REPEAT1(X)) → REPEAT(X)
					if (nonBlank[0]!.type === 'REPEAT1') {
						return { type: 'REPEAT', content: nonBlank[0]!.content };
					}
					// CHOICE(BLANK, X) — X is optional, keep as CHOICE for optionality tracking
					return { type: 'CHOICE', members: [{ type: 'BLANK' }, nonBlank[0]!] };
				}
				return nonBlank[0]!;
			}
			// Deduplicate structurally identical members
			const unique: GrammarRule[] = [];
			for (const m of members) {
				if (!unique.some(u => grammarRulesEqual(u, m))) unique.push(m);
			}
			if (unique.length === 1) return unique[0]!;
			const uniqueNonBlank = unique.filter(m => m.type !== 'BLANK');
			if (uniqueNonBlank.length === 1 && unique.length > uniqueNonBlank.length) {
				if (uniqueNonBlank[0]!.type === 'REPEAT1') {
					return { type: 'REPEAT', content: uniqueNonBlank[0]!.content };
				}
				return { type: 'CHOICE', members: [{ type: 'BLANK' }, uniqueNonBlank[0]!] };
			}
			return { type: 'CHOICE', members: unique };
		}

		default:
			return { type: 'BLANK' };
	}
}

/** Check if two grammar rules are structurally equal (post-simplification). */
function grammarRulesEqual(a: GrammarRule, b: GrammarRule): boolean {
	if (a.type !== b.type) return false;
	if (a.type === 'SYMBOL' && b.type === 'SYMBOL') return a.name === b.name;
	if (a.type === 'BLANK' && b.type === 'BLANK') return true;
	if (a.type === 'REPEAT' && b.type === 'REPEAT') return grammarRulesEqual(a.content, b.content);
	if (a.type === 'REPEAT1' && b.type === 'REPEAT1') return grammarRulesEqual(a.content, b.content);
	if (a.type === 'SEQ' && b.type === 'SEQ') {
		if (a.members.length !== b.members.length) return false;
		return a.members.every((m, i) => grammarRulesEqual(m, b.members[i]!));
	}
	if (a.type === 'CHOICE' && b.type === 'CHOICE') {
		if (a.members.length !== b.members.length) return false;
		return a.members.every((m, i) => grammarRulesEqual(m, b.members[i]!));
	}
	return false;
}

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

			// SEQ(X, X*) → X+ and SEQ(X*, X) → X+
			if (members.length === 2) {
				const [a, b] = members;
				// SEQ(X, REPEAT(X)) → REPEAT(X)
				if (a!.type === 'symbol' && b!.type === 'repeat' && patternsEqual(a!, b!.content)) {
					return { type: 'repeat', content: a! };
				}
				// SEQ(REPEAT(X), X) → REPEAT(X)
				if (b!.type === 'symbol' && a!.type === 'repeat' && patternsEqual(b!, a!.content)) {
					return { type: 'repeat', content: b! };
				}
			}

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

/** Check if two classified patterns are structurally equal. */
function patternsEqual(a: ClassifiedPattern, b: ClassifiedPattern): boolean {
	if (a.type !== b.type) return false;
	if (a.type === 'symbol' && b.type === 'symbol') return a.name === b.name;
	if (a.type === 'repeat' && b.type === 'repeat') return patternsEqual(a.content, b.content);
	if (a.type === 'empty' && b.type === 'empty') return true;
	if (a.type === 'seq' && b.type === 'seq') {
		if (a.members.length !== b.members.length) return false;
		return a.members.every((m, i) => patternsEqual(m, b.members[i]!));
	}
	if (a.type === 'choice' && b.type === 'choice') {
		if (a.members.length !== b.members.length) return false;
		return a.members.every((m, i) => patternsEqual(m, b.members[i]!));
	}
	return false;
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
