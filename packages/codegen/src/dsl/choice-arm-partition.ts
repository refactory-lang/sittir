import { ALIAS, CHOICE, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, SimplifiedRule } from '../types/rule.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
import { isNonterminalRuleType, optionalContentOf } from './rule-patterns.ts';

export interface ArmStage {
	fieldName(rule: AnyRule): string | undefined;
	fieldBody(rule: AnyRule): AnyRule;
	isSlotNode(rule: AnyRule): boolean;
	unwrap(rule: AnyRule): AnyRule;
}

export const simplifyArmStage: ArmStage = {
	fieldName: (rule) => (rule as { fieldName?: string }).fieldName,
	fieldBody: (rule) => rule,
	isSlotNode: (rule) => {
		const stamped = (rule as SimplifiedRule).nonterminal;
		return stamped !== undefined ? stamped : isNonterminalRuleType(rule);
	},
	unwrap: (rule) => rule
};

function unwrapPrecAndOptional(rule: AnyRule): AnyRule {
	let node = rule;
	for (;;) {
		if (isPrecWrapper(node)) {
			node = (node as { content: AnyRule }).content;
			continue;
		}
		const optional = optionalContentOf(node);
		if (optional === undefined) return node;
		node = optional;
	}
}

export const dslArmStage: ArmStage = {
	fieldName: (rule) => (rule.type === FIELD ? rule.name : undefined),
	fieldBody: (rule) => (rule.type === FIELD ? unwrapPrecAndOptional(rule.content) : rule),
	isSlotNode: (rule) => isNonterminalRuleType(rule),
	unwrap: unwrapPrecAndOptional
};

export function carriesNamedField(rule: AnyRule, stage: ArmStage): boolean {
	const node = stage.unwrap(rule);
	if (stage.fieldName(node) !== undefined) return true;
	switch (node.type) {
		case SEQ:
		case CHOICE:
			return node.members.some((m) => carriesNamedField(m, stage));
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case ALIAS:
			return carriesNamedField((node as { content: AnyRule }).content, stage);
		default:
			return false;
	}
}

export interface ChoiceArmPartition<R extends AnyRule = AnyRule> {
	degenerateNamedArms: R[];
	structuredNamedArms: R[];
	unionArms: R[];
	literalArms: R[];
	structuredArms: R[];
}

function soleMember(rule: AnyRule, stage: ArmStage): AnyRule {
	let node = stage.unwrap(rule);
	while (node.type === SEQ && node.members.length === 1) node = stage.unwrap(node.members[0]!);
	return node;
}

function isDegenerateFieldArm(rule: AnyRule, stage: ArmStage): boolean {
	const node = soleMember(rule, stage);
	if (node.type === SEQ || node.type === CHOICE) return false;
	if (stage.fieldName(node) === undefined) return false;
	const body = stage.fieldBody(node);
	if (body.type === SEQ || body.type === CHOICE) return false;
	return stage.isSlotNode(body);
}

export function degenerateArmFieldName(rule: AnyRule, stage: ArmStage): string | undefined {
	return stage.fieldName(soleMember(rule, stage));
}

export function partitionChoiceArms<R extends AnyRule>(
	rule: { readonly members: readonly AnyRule[] },
	stage: ArmStage
): ChoiceArmPartition<R> {
	const out: ChoiceArmPartition<R> = {
		degenerateNamedArms: [],
		structuredNamedArms: [],
		unionArms: [],
		literalArms: [],
		structuredArms: []
	};
	const classify = (arm: R): void => {
		if (carriesNamedField(arm, stage)) {
			(isDegenerateFieldArm(arm, stage) ? out.degenerateNamedArms : out.structuredNamedArms).push(arm);
			return;
		}
		const node = stage.unwrap(arm);
		if (node.type === SEQ) {
			if (node.members.length === 1) {
				classify(node.members[0] as R);
				return;
			}
			out.structuredArms.push(arm);
			return;
		}
		if (node.type === CHOICE) {
			out.structuredArms.push(arm);
			return;
		}
		if (stage.isSlotNode(node)) {
			out.unionArms.push(arm);
			return;
		}
		out.literalArms.push(arm);
	};
	for (const m of rule.members as R[]) classify(m);
	return out;
}

export function unionRoutingGateB(partition: ChoiceArmPartition<AnyRule>): boolean {
	return partition.unionArms.length > 0 && partition.structuredArms.length === 0 && partition.literalArms.length === 0;
}

export type ArmTopology = 'field-routed' | 'union-routed' | 'structured';

export function armTopologies(partition: ChoiceArmPartition<AnyRule>): ReadonlySet<ArmTopology> {
	const out = new Set<ArmTopology>();
	if (partition.degenerateNamedArms.length > 0) out.add('field-routed');
	if (partition.unionArms.length > 0) out.add('union-routed');
	if (partition.structuredNamedArms.length > 0 || partition.structuredArms.length > 0) out.add('structured');
	return out;
}

export function isTopologyMixed(partition: ChoiceArmPartition<AnyRule>): boolean {
	return armTopologies(partition).size > 1;
}
