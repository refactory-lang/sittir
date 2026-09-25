import type { RuleMetadata } from '../types/rule-metadata-brand.ts';
import type { ChoiceRule, StringRule } from '../types/rule.ts';
import { CHOICE } from '../types/rule-types.ts'; // @rule-type-consts

export interface RuleMetadataShape {
	fieldSource?: 'grammar' | 'override' | 'enriched';
	symbolSource?: 'grammar' | 'link' | 'group-lift';
	aliasSource?: 'visible-group';
}

export function makeRuleMetadata(shape: RuleMetadataShape): RuleMetadata {
	return shape as unknown as RuleMetadata;
}

export function readRuleMetadata(meta: unknown): RuleMetadataShape | undefined {
	return meta as RuleMetadataShape | undefined;
}

export function normalizeEnumMembers(members: readonly StringRule[]): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return { type: CHOICE, members: members as StringRule[] } satisfies ChoiceRule;
}
