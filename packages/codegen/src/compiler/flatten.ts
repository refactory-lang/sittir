import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	REPEAT,
	REPEAT1,
	PATTERN,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule, Rule, RuleSeparator, SeqRule } from '../types/rule.ts';
import { fuseHeadRepeatLists } from '../dsl/rule-transforms.ts';
import { selfReferentialFoldOf, collectFixedLiteral } from '../dsl/rule-patterns.ts';
import { attributeBuilder, buildOptional, overlaySeq } from '../dsl/builders.ts';
import { withId, withKindFacts, withAttrsFrom, sharedArmAttrs, absorbIds, structuralKey } from '../dsl/rule-attrs.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

function applySelfReferentialFold(ownName: string, rule: Rule<'link'>): Rule<'link'> {
	if (rule.type !== CHOICE) return rule;
	const fold = selfReferentialFoldOf(ownName, rule);
	if (fold === undefined) return rule;
	const members = rule.members.map((m) => {
		if (m.type !== SEQ || m.members.length !== 3) return m;
		const ext = m.members[2]!;
		if (ext.type !== FIELD) return m;
		const rewrittenExt: Rule<'link'> = {
			...ext,
			content: { type: REPEAT, content: ext.content, separator: { value: fold.separator } }
		};
		return { ...m, members: [m.members[0]!, m.members[1]!, rewrittenExt] };
	});
	return { ...rule, members };
}

type Input = Rule<'link' | 'normalize'>;
type Output = Rule<'normalize'>;

const b = attributeBuilder;

function withSeparator(content: Output, separator: RuleSeparator<Input> | undefined): Output {
	return separator === undefined
		? content
		: { ...content, separator: { ...separator, value: rebuild(separator.value) } };
}

function construct(node: Input): Output {
	switch (node.type) {
		case SEQ: {
			const members = node.members.map(rebuild);
			const rebuilt: SeqRule<'normalize'> = { ...node, members };
			return overlaySeq(rebuilt, b.seq(...members));
		}
		case CHOICE:
			return { ...node, ...b.choice(...node.members.map(rebuild)) };
		case OPTIONAL:
			return buildOptional(rebuild(node.content));
		case REPEAT:
			return b.repeat(withSeparator(rebuild(node.content), node.separator));
		case REPEAT1:
			return b.repeat1(withSeparator(rebuild(node.content), node.separator));
		case FIELD:
			return b.field(node.name, rebuild(node.content));
		case ALIAS:
			return b.alias(rebuild(node.content), node.named ? { ...b.symbol(node.value), kindId: node.kindId } : node.value);
		case TOKEN:
			return node.immediate ? b.token.immediate(rebuild(node.content)) : b.token(rebuild(node.content));
		case VARIANT:
			return { ...node, ...b.variant(node.name, rebuild(node.content)) };
		case GROUP:
			return { ...node, ...b.group(node.name, rebuild(node.content)) };
		case STRING:
			return { ...node, ...b.string(node.value) };
		case INDENT:
			return { ...node, ...b.indent() };
		case DEDENT:
			return { ...node, ...b.dedent() };
		case NEWLINE:
			return { ...node, ...b.newline() };
		case SYMBOL:
			return { ...node, ...b.symbol(node.name) };
		case PATTERN:
			return { ...node, ...b.pattern(node.value) };
		case SUPERTYPE:
			return { ...node, ...b.supertype(node.name, node.subtypes) };
		default:
			return node;
	}
}

function rebuild(node: Input): Output {
	const built = construct(node);
	return withId(built, node.id ?? built.id);
}

export function flatten(rule: Input): Output {
	return rebuild(rule);
}

export function flattenRules(rules: Record<string, Rule<'link'>>): Record<string, RenderRule> {
	const result: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		const flat = fuseHeadRepeatLists(flatten(applySelfReferentialFold(name, rule)));
		result[name] = withKindFacts(flat, rule);
	}
	return stampTerminality(factorChoiceArmsToFixpoint(result));
}

function stampTerminality(rules: Record<string, RenderRule>): Record<string, RenderRule> {
	const isLiteralRule = (name: string): boolean => {
		const target = rules[name];
		return target !== undefined && collectFixedLiteral(target) !== undefined;
	};
	const stamp = (rule: RenderRule): RenderRule => {
		if (rule.type === SYMBOL && rule.nonterminal === true && isSingle(rule) && (rule.literal !== undefined || isLiteralRule(rule.name)))
			return { ...rule, nonterminal: false };
		if (rule.type === SEQ) {
			const nonterminal = rule.members.some((m) => m.nonterminal === true);
			return rule.nonterminal === nonterminal ? rule : { ...rule, nonterminal };
		}
		return rule;
	};
	const isSingle = (rule: RenderRule): boolean => rule.multiplicity === undefined || rule.multiplicity === 'single';
	const out: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) out[name] = stamp(ruleWalker.map(rule, stamp));
	return out;
}

const ruleWalker = new RuleWalker<RenderRule>();

function factorChoiceArms(rule: RenderRule): RenderRule {
	if (rule.type !== CHOICE) return rule;
	const seqArms = rule.members.filter((arm): arm is SeqRule<'normalize'> => arm.type === SEQ);
	if (seqArms.length < 2) return rule;
	const len = seqArms[0]!.members.length;
	if (len === 0 || !seqArms.every((arm) => arm.members.length === len)) return rule;
	const differing: number[] = [];
	for (let i = 0; i < len; i++) {
		const first = structuralKey(seqArms[0]!.members[i]!);
		if (seqArms.some((arm) => structuralKey(arm.members[i]!) !== first)) differing.push(i);
	}
	if (differing.length !== 1) return rule;
	const at = differing[0]!;
	const seen = new Set<string>();
	const variants: RenderRule[] = [];
	for (const arm of seqArms) {
		const m = arm.members[at]!;
		const key = structuralKey(m);
		if (seen.has(key)) continue;
		seen.add(key);
		variants.push(m);
	}
	const shared = sharedArmAttrs({ type: CHOICE, members: variants });
	const choice: RenderRule = {
		...b.choice(...variants),
		...(shared.fieldName !== undefined ? { fieldName: shared.fieldName } : {}),
		...(shared.multiplicity !== undefined ? { multiplicity: shared.multiplicity } : {})
	};
	const members = seqArms[0]!.members.map((m, i) => (i === at ? choice : m));
	const factored = absorbIds({ ...seqArms[0]!, members }, ...seqArms.slice(1));
	if (seqArms.length === rule.members.length) return withAttrsFrom(rule, factored);
	let placed = false;
	const rebuilt: RenderRule[] = [];
	for (const arm of rule.members) {
		if (arm.type !== SEQ) rebuilt.push(arm);
		else if (!placed) {
			rebuilt.push(factored);
			placed = true;
		}
	}
	return { ...rule, members: rebuilt };
}

function permutationKey(rule: RenderRule): string {
	return JSON.stringify(rule, (key, value: unknown) =>
		key === 'id' || key === 'absorbedIds' || key === 'multiplicity' ? undefined : value
	);
}

function foldPermutationArms(rule: RenderRule): RenderRule {
	if (rule.type !== CHOICE) return rule;
	const seqArms = rule.members.filter((arm): arm is SeqRule<'normalize'> => arm.type === SEQ);
	if (seqArms.length < 2 || seqArms.length !== rule.members.length) return rule;
	const len = seqArms[0]!.members.length;
	if (len < 2 || !seqArms.every((arm) => arm.members.length === len)) return rule;
	const isSingle = (m: RenderRule): boolean => m.multiplicity === undefined || m.multiplicity === 'single';
	const isOptional = (m: RenderRule): boolean => m.multiplicity === 'optional';
	if (!seqArms.every((arm) => arm.members.every((m) => isSingle(m) || isOptional(m)))) return rule;
	const first = seqArms[0]!;
	const keys = first.members.map(permutationKey);
	if (new Set(keys).size !== len) return rule;
	const sortedKeys = [...keys].sort().join('\u0000');
	for (const arm of seqArms.slice(1)) {
		const armKeys = arm.members.map(permutationKey);
		if ([...armKeys].sort().join('\u0000') !== sortedKeys) return rule;
	}
	if (seqArms.every((arm) => arm.members.map(permutationKey).join('\u0000') === keys.join('\u0000'))) return rule;
	const members = first.members.map((m, i) => {
		const key = keys[i]!;
		const occurrences = seqArms.map((arm) => arm.members[arm.members.findIndex((x) => permutationKey(x) === key)]!);
		const requiredEverywhere = occurrences.every(isSingle);
		const base = { ...m, multiplicity: undefined } as RenderRule;
		delete (base as { multiplicity?: unknown }).multiplicity;
		return requiredEverywhere ? base : b.optional(base);
	});
	const folded = withAttrsFrom(rule, absorbIds({ ...first, ...b.seq(...members) }, ...seqArms.slice(1)));
	if (folded.multiplicity === 'optional' && members.every(isOptional)) {
		const { multiplicity: _dropped, ...rest } = folded;
		return rest as RenderRule;
	}
	return folded;
}

function factorChoiceArmsToFixpoint(rules: Record<string, RenderRule>): Record<string, RenderRule> {
	const out: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		let current = rule;
		for (let i = 0; i < 16; i++) {
			const step = (r: RenderRule): RenderRule => foldPermutationArms(factorChoiceArms(r));
			const next = step(ruleWalker.map(current, step));
			if (next === current || structuralKey(next) === structuralKey(current)) break;
			current = next;
		}
		out[name] = current;
	}
	return out;
}
