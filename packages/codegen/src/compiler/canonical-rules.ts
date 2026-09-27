import { CHOICE, FIELD, IMMEDIATE_TOKEN, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { FieldRule, Rule } from '../types/rule.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
import { makeRuleMetadata } from '../dsl/rule-metadata.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { collectOrphanedRules } from '../util/reachable-rules.ts';
import { buildRuleCatalog, collectReferences } from './rule-catalog.ts';
import type { EvaluatedGrammar, RawGrammar, UpstreamEvaluation } from './types.ts';

type EvalRule = Rule<'evaluate'>;

const WRAPPER_FACT_KEYS = ['annotations', 'metadata'] as const;

export function peelWrapper(wrapper: EvalRule): EvalRule {
	const bag = wrapper as unknown as { content?: EvalRule; members?: readonly EvalRule[] };
	let out = bag.content ?? bag.members![0]!;
	for (const key of WRAPPER_FACT_KEYS) {
		const outer = (wrapper as unknown as Record<string, Record<string, unknown> | undefined>)[key];
		if (outer === undefined) continue;
		const inner = (out as unknown as Record<string, Record<string, unknown> | undefined>)[key] ?? {};
		for (const [fact, value] of Object.entries(outer)) {
			if (fact in inner && JSON.stringify(inner[fact]) !== JSON.stringify(value)) {
				throw new Error(
					`peelWrapper: ${key}.${fact} conflicts between a ${wrapper.type} wrapper (${JSON.stringify(value)}) and its content (${JSON.stringify(inner[fact])})`
				);
			}
		}
		out = { ...out, [key]: { ...inner, ...outer } } as EvalRule;
	}
	return out;
}

function canonicalOptionalRule(rule: EvalRule & { type: typeof OPTIONAL }): EvalRule {
	const content = rule.content;
	if (content.type === OPTIONAL || content.type === REPEAT) return peelWrapper(rule);
	if (content.type === REPEAT1) return { ...peelWrapper(rule), type: REPEAT } as EvalRule;
	return rule;
}

function canonicalRepeatRule(rule: EvalRule & { type: typeof REPEAT }): EvalRule {
	const content = rule.content;
	if (content.type === REPEAT && !content.separator) return peelWrapper(rule);
	if (content.type === OPTIONAL) return { ...rule, content: peelWrapper(content) } as EvalRule;
	return rule;
}

function canonicalRepeat1Rule(rule: EvalRule & { type: typeof REPEAT1 }): EvalRule {
	const content = rule.content;
	return content.type === REPEAT1 && !content.separator ? peelWrapper(rule) : rule;
}

function canonicalChoiceRule(rule: EvalRule & { type: typeof CHOICE }): EvalRule {
	const members = rule.members;
	if (members.length === 1) return peelWrapper(rule);
	if (members.length < 2 || !members.every((m) => m.type === FIELD)) return rule;
	const fields = members as readonly FieldRule<'evaluate'>[];
	const name = fields[0]!.name;
	if (fields.some((f) => f.content.type === 'ALIAS' || f.name !== name)) return rule;
	return peelWrapper({
		...rule,
		members: [
			{
				type: FIELD,
				name,
				content: { type: CHOICE, members: fields.map((f) => f.content) },
				metadata: makeRuleMetadata({ fieldSource: 'grammar' })
			}
		]
	} as EvalRule);
}

function canonicalTokenRule(rule: EvalRule): EvalRule {
	const content = (rule as unknown as { content: EvalRule }).content;
	if (rule.type === IMMEDIATE_TOKEN) return { ...rule, type: TOKEN, content, immediate: true } as EvalRule;
	return (rule as { immediate?: boolean }).immediate === undefined ? ({ ...rule, immediate: false } as EvalRule) : rule;
}

function canonicalRule(rule: EvalRule): EvalRule {
	if (isPrecWrapper(rule)) return canonicalRule(peelWrapper(rule));
	switch (rule.type) {
		case OPTIONAL:
			return canonicalOptionalRule(rule);
		case REPEAT:
			return canonicalRepeatRule(rule);
		case REPEAT1:
			return canonicalRepeat1Rule(rule);
		case CHOICE:
			return canonicalChoiceRule(rule);
		case SEQ:
			return rule.members.length === 1 ? peelWrapper(rule) : rule;
		case TOKEN:
		case IMMEDIATE_TOKEN:
			return canonicalTokenRule(rule);
		default:
			return rule;
	}
}

export function canonicalRuleTree(rule: EvalRule): EvalRule {
	const walker = new RuleWalker<EvalRule>({});
	return canonicalRule(walker.map(rule, canonicalRule));
}

function canonicalRuleBodies(bodies: Readonly<Record<string, EvalRule>>): Record<string, EvalRule> {
	return Object.fromEntries(Object.entries(bodies).map(([name, body]) => [name, canonicalRuleTree(body)]));
}

function canonicalUpstream(upstream: UpstreamEvaluation<EvaluatedGrammar> | undefined): UpstreamEvaluation | undefined {
	if (upstream === undefined || 'failure' in upstream) return upstream;
	return { ...upstream, raw: canonicalGrammar(upstream.raw) };
}

export function canonicalGrammar(evaluated: EvaluatedGrammar): RawGrammar {
	const { provenanceByKind, protectedRuleNames, upstream, renderAs, visibleExternals, ...rest } = evaluated;
	const rules = canonicalRuleBodies(evaluated.rules);
	if (protectedRuleNames !== undefined) {
		for (const name of collectOrphanedRules(rules, new Set(protectedRuleNames))) delete rules[name];
	}
	const identified = buildRuleCatalog(rules, { provenanceByKind, roots: evaluated.supertypes });
	return {
		...rest,
		rules: identified.rules,
		ruleCatalog: identified.ruleCatalog,
		references: collectReferences(identified.rules, { ruleCatalog: identified.ruleCatalog }),
		renderAs: renderAs && canonicalRuleBodies(renderAs),
		visibleExternals: visibleExternals && canonicalRuleBodies(visibleExternals),
		upstream: canonicalUpstream(upstream)
	};
}
