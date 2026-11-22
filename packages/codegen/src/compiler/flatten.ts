import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
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
} from '../types/rule-types.ts'; // @rule-type-consts
import type { ChoiceRule, RenderRule, Rule, RuleId, RuleSeparator, SeqRule } from '../types/rule.ts';
import { fuseHeadRepeatLists } from '../dsl/rule-transforms.ts';
import { selfReferentialFoldOf, collectFixedLiteral } from '../dsl/rule-patterns.ts';
import { runToFixpoint } from './fixpoint.ts';
import { attributeBuilder, buildOptional, carryNodeFacts } from '../dsl/builders.ts';
import { withId, withKindFacts, withAttrsFrom, sharedArmAttrs, absorbIds, absorbAlignedIds, armsCanFactor, factoredSeqOf, nonPositionFactsOf, sharedSeqFacts, structuralKey, factoredAtRoot } from '../dsl/rule-attrs.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { reservedWordsetsOf, withReservedWordsets } from '../dsl/rule-metadata.ts';
import { supertypeArmsOf } from '../dsl/symbol-table.ts';
import { memberRuleId } from './rule-catalog.ts';
import { LAYOUT_SUPERTYPE } from '../dsl/primitives/spacing.ts';

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
			return carryNodeFacts(rebuilt, b.seq(...members));
		}
		case CHOICE: {
			const members = node.members.map(rebuild);
			const rebuilt: ChoiceRule<'normalize'> = { ...node, members };
			return carryNodeFacts(rebuilt, b.choice(...members));
		}
		case OPTIONAL:
			return buildOptional(rebuild(node.content));
		case REPEAT:
			return b.repeat(withSeparator(rebuild(node.content), node.separator));
		case REPEAT1:
			return b.repeat1(withSeparator(rebuild(node.content), node.separator));
		case FIELD:
			return b.field(node.name, rebuild(node.content));
		case ALIAS: {
			const aliased = b.alias(rebuild(node.content), node.named ? { ...b.symbol(node.value), kindId: node.kindId } : node.value);
			const reservedWordsets = reservedWordsetsOf(node.metadata);
			return reservedWordsets === undefined ? aliased : { ...aliased, metadata: withReservedWordsets(aliased.metadata, reservedWordsets) };
		}
		case TOKEN:
			return node.immediate ? b.token.immediate(rebuild(node.content)) : b.token(rebuild(node.content));
		case STRING:
			return rebuiltLeaf(node, b.string(node.value));
		case INDENT:
			return rebuiltLeaf(node, b.indent());
		case DEDENT:
			return rebuiltLeaf(node, b.dedent());
		case NEWLINE:
			return rebuiltLeaf(node, b.newline());
		case SYMBOL:
			return rebuiltLeaf(node, b.symbol(node.name));
		case PATTERN:
			return rebuiltLeaf(node, b.pattern(node.value));
		case SUPERTYPE:
			return rebuiltLeaf(node, b.supertype(node.name, node.subtypes));
		default:
			return node;
	}
}

function rebuiltLeaf<N extends Input, B extends Output>(node: N, built: B): N & B {
	return { ...node, ...built, ...(node.nonterminal === undefined ? {} : { nonterminal: node.nonterminal }) };
}

function rebuild(node: Input): Output {
	const built = withKindFacts(construct(node), node);
	return absorbIds(node.id === undefined ? built : withId(built, node.id), built, node);
}

export function flatten(rule: Input): Output {
	return rebuild(rule);
}

export function flattenRules(rules: Record<string, Rule<'link'>>, wordMatcher?: RegExp): Record<string, RenderRule> {
	const result: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		const flat = fuseHeadRepeatLists(flatten(applySelfReferentialFold(name, rule)));
		result[name] = withKindFacts(flat, rule);
	}
	const factored = stampTerminality(factorChoiceArmsToFixpoint(result), wordMatcher);
	return Object.fromEntries(Object.entries(factored).map(([name, rule]) => [name, withoutSelfVariant([name, rule])]));
}

function withoutSelfVariant([kind, rule]: readonly [string, RenderRule]): RenderRule {
	if (rule.type !== SEQ || rule.annotations?.variantOf !== kind) return rule;
	const { variantOf: _variantOf, definedBy: _definedBy, ...annotations } = rule.annotations;
	const { annotations: _annotations, ...bare } = rule;
	return Object.keys(annotations).length === 0 ? bare : { ...bare, annotations };
}

function stampTerminality(rules: Record<string, RenderRule>, wordMatcher: RegExp | undefined): Record<string, RenderRule> {
	const isLiteralRule = (name: string): boolean => {
		const target = rules[name];
		return (
			target !== undefined &&
			collectFixedLiteral(target, { tokenized: false, deterministic: false, wordMatcher }) !== undefined
		);
	};
	const stamp = (rule: RenderRule): RenderRule => {
		if (
			rule.type === SYMBOL &&
			rule.nonterminal === true &&
			isSingle(rule) &&
			(rule.literal !== undefined || isLiteralRule(rule.name))
		)
			return { ...rule, nonterminal: false };
		if (rule.type === SEQ) {
			const nonterminal = rule.members.some((m) => m.nonterminal === true);
			return rule.nonterminal === nonterminal ? rule : { ...rule, nonterminal };
		}
		if (rule.type === CHOICE) {
			const labels = (field: string): number => rule.members.filter((m) => m.fieldName === field).length;
			const labelled = (m: RenderRule): boolean => m.type === SYMBOL && m.nonterminal === false && m.fieldName !== undefined && isSingle(m) && labels(m.fieldName) === 1;
			if (!rule.members.some(labelled)) return rule;
			return { ...rule, members: rule.members.map((m) => (labelled(m) ? { ...m, nonterminal: true } : m)) };
		}
		return rule;
	};
	const isSingle = (rule: RenderRule): boolean => rule.multiplicity === undefined || rule.multiplicity === 'single';
	const layoutMembers = supertypeArmsOf([LAYOUT_SUPERTYPE], rules);
	const isLayoutBody = (rule: RenderRule): boolean => rule.type === SYMBOL && layoutMembers.has(rule.name);
	const out: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) out[name] = isLayoutBody(rule) ? rule : stamp(ruleWalker.map(rule, stamp));
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
	if (differing.length !== 1 || !armsCanFactor(rule, seqArms)) return rule;
	const at = differing[0]!;
	const variantAt = new Map<string, number>();
	const variants: RenderRule[] = [];
	for (const arm of seqArms) {
		const m = arm.members[at]!;
		const key = structuralKey(m);
		const seen = variantAt.get(key);
		if (seen !== undefined) {
			variants[seen] = absorbAlignedIds(variants[seen]!, m);
			continue;
		}
		variantAt.set(key, variants.length);
		variants.push(m);
	}
	const whole = seqArms.length === rule.members.length;
	const seqId = whole || rule.id === undefined ? undefined : memberRuleId(rule.id, seqArms.map((arm) => rule.members.indexOf(arm)));
	const choice = factoredChoiceOf(variants, whole ? rule : seqId === undefined ? undefined : { id: memberRuleId(seqId, [at]) });
	const others = seqArms.slice(1);
	const members = seqArms[0]!.members.map((m, i) => (i === at ? choice : absorbAlignedIds(m, ...others.map((arm) => arm.members[i]!))));
	const factored = seqId === undefined ? factoredSeqOf([members, seqArms]) : absorbIds({ type: SEQ, id: seqId, ...sharedSeqFacts(seqArms), members }, ...seqArms);
	if (whole) return withAttrsFrom(withoutIdentity(rule), factored);
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

function factorSharedLiterals(rule: RenderRule): RenderRule {
	if (rule.type !== CHOICE || rule.members.length < 2) return rule;
	const seqArms = rule.members.filter((arm): arm is SeqRule<'normalize'> => arm.type === SEQ);
	if (seqArms.length !== rule.members.length || !armsCanFactor(rule, seqArms)) return rule;
	const isLiteral = (m: RenderRule): boolean => m.type === STRING && m.nonterminal === false;
	const shortest = Math.min(...seqArms.map((arm) => arm.members.length));
	const sharedAt = (from: (arm: SeqRule<'normalize'>, offset: number) => RenderRule, offset: number): boolean => {
		const first = from(seqArms[0]!, offset);
		return isLiteral(first) && seqArms.every((arm) => structuralKey(from(arm, offset)) === structuralKey(first));
	};
	let prefix = 0;
	while (prefix < shortest - 1 && sharedAt((arm, i) => arm.members[i]!, prefix)) prefix++;
	let suffix = 0;
	while (prefix + suffix < shortest - 1 && sharedAt((arm, i) => arm.members[arm.members.length - 1 - i]!, suffix)) suffix++;
	if (prefix + suffix === 0) return rule;
	const middle = (arm: SeqRule<'normalize'>): RenderRule => {
		const members = arm.members.slice(prefix, arm.members.length - suffix);
		return members.length === 1 ? members[0]! : { type: SEQ, members };
	};
	const first = seqArms[0]!;
	const others = seqArms.slice(1);
	const inner = factoredChoiceOf(seqArms.map(middle), rule);
	const sharedMembers = (from: (arm: SeqRule<'normalize'>, offset: number) => RenderRule, count: number): RenderRule[] =>
		Array.from({ length: count }, (_, offset) => absorbAlignedIds(from(first, offset), ...others.map((arm) => from(arm, offset))));
	const head = sharedMembers((arm, i) => arm.members[i]!, prefix);
	const tail = sharedMembers((arm, i) => arm.members[arm.members.length - 1 - i]!, suffix).reverse();
	return withAttrsFrom(withoutIdentity(rule), factoredSeqOf([[...head, inner, ...tail], seqArms]));
}

function factoredChoiceOf(variants: RenderRule[], source: { readonly id?: RuleId } | undefined): RenderRule {
	const shared = sharedArmAttrs({ type: CHOICE, members: variants });
	return {
		...b.choice(...variants),
		...(source === undefined ? {} : nonPositionFactsOf(source)),
		...(shared.fieldName !== undefined ? { fieldName: shared.fieldName } : {}),
		...(shared.multiplicity !== undefined ? { multiplicity: shared.multiplicity } : {})
	};
}

function withoutIdentity(rule: RenderRule): RenderRule {
	const { id: _id, absorbedIds: _absorbedIds, ...attrs } = rule;
	return attrs;
}

function permutationKey(rule: RenderRule): string {
	return JSON.stringify(rule, (key, value: unknown) =>
		key === 'id' || key === 'absorbedIds' || key === 'multiplicity' ? undefined : value
	);
}

function foldPermutationArms(rule: RenderRule): RenderRule {
	if (rule.type !== CHOICE) return rule;
	const seqArms = rule.members.filter((arm): arm is SeqRule<'normalize'> => arm.type === SEQ);
	if (seqArms.length < 2 || seqArms.length !== rule.members.length || !armsCanFactor(rule, seqArms)) return rule;
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
		runToFixpoint({
			name: 'flatten.factorChoiceArmsToFixpoint',
			cap: 16,
			step: () => {
				const step = (r: RenderRule): RenderRule => foldPermutationArms(factorSharedLiterals(factorChoiceArms(r)));
				const next = factoredAtRoot(current, (bare) => step(ruleWalker.map(bare, step)));
				if (next === current) return false;
				current = next;
				return true;
			}
		});
		out[name] = current;
	}
	return out;
}
