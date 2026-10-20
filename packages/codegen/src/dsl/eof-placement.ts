import { EOF, SEQ, SYMBOL } from '../types/rule-types.ts';
import type { Rule } from '../types/rule.ts';
import { isRepeatType } from '../types/runtime-shapes.ts';
import { rootRuleName } from '../util/reachable-rules.ts';
import { isBlank } from './rule-patterns.ts';
import { isLexedBoundary, RuleWalker, SyntacticRuleWalker } from './rule-walker.ts';
import { isEnrichGroupLiftSymbol } from './transform/transform-path.ts';

export interface EofPlacement {
	readonly inToken: boolean;
	readonly notLast: boolean;
}

export function eofPlacements(
	rules: Readonly<Record<string, Rule<'evaluate'>>>,
	textTokens: readonly string[]
): ReadonlyMap<string, EofPlacement> {
	const walker = new RuleWalker<Rule<'evaluate'>>(rules);
	const syntactic = new SyntacticRuleWalker<Rule<'evaluate'>>();
	const empty = (rule: Rule<'evaluate'>): boolean => {
		if (isBlank(rule)) return true;
		if (isRepeatType(rule.type)) return false;
		const children = syntactic.childrenOf(rule);
		return children.length > 0 && children.every(empty);
	};
	const texts = new Set(textTokens.filter((name) => rules[name] !== undefined && isLexedBoundary(rules[name])));
	const lifted = new Set<string>();
	const named = new Set<string>();
	for (const rule of Object.values(rules)) {
		walker.find(rule, (inner) => {
			if (inner.type === SYMBOL) (isEnrichGroupLiftSymbol(inner) ? lifted : named).add((inner as { name: string }).name);
			return false;
		});
	}
	const mintRef = (rule: Rule<'evaluate'>): boolean =>
		rule.type === SYMBOL && (isEnrichGroupLiftSymbol(rule) || texts.has((rule as { name: string }).name));
	const judgedAlone = (name: string): boolean => !texts.has(name) && (!lifted.has(name) || named.has(name));
	const placements = new Map<string, { inToken: boolean; notLast: boolean }>();
	const refuse = (owner: string, inToken: boolean): void => {
		const placement = placements.get(owner) ?? { inToken: false, notLast: false };
		if (inToken) placement.inToken = true;
		else placement.notLast = true;
		placements.set(owner, placement);
	};
	const visit = (owner: string, rule: Rule<'evaluate'>, last: boolean, token: boolean, seen: ReadonlySet<string>): void => {
		if (rule.type === EOF) {
			if (token || !last) refuse(owner, token);
			return;
		}
		const target = mintRef(rule) ? walker.deref(rule) : undefined;
		if (target !== undefined) {
			const name = (rule as { name: string }).name;
			if (!seen.has(name)) visit(owner, target, last, token, new Set([...seen, name]));
			return;
		}
		const edges = walker.childEdgesOf(rule);
		edges.forEach(({ child }, index) =>
			visit(
				owner,
				child,
				last && !isRepeatType(rule.type) && (rule.type !== SEQ || edges.slice(index + 1).every((after) => empty(after.child))),
				token || isLexedBoundary(rule),
				seen
			)
		);
	};
	const start = rootRuleName(rules);
	for (const [name, rule] of Object.entries(rules)) if (judgedAlone(name)) visit(name, rule, name === start, false, new Set([name]));
	return placements;
}
