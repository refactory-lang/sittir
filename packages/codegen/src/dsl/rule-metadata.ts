import type { RuleMetadata } from '../types/rule-metadata-brand.ts';
import type { ChoiceRule, StringRule } from '../types/rule.ts';
import { CHOICE } from '../types/rule-types.ts'; // @rule-type-consts

export interface RuleMetadataShape {
	author?: 'grammar' | 'override' | 'enrich' | 'evaluate';
	classifiedBy?: 'grammar' | 'link';
	fieldSource?: 'grammar' | 'override' | 'enriched';
	symbolSource?: 'grammar' | 'link' | 'group-lift';
}

export function makeRuleMetadata(shape: RuleMetadataShape): RuleMetadata {
	return shape as unknown as RuleMetadata;
}

export function readRuleMetadata(meta: unknown): RuleMetadataShape | undefined {
	return meta as RuleMetadataShape | undefined;
}

export function normalizeEnumMembers(
	members: readonly StringRule[],
	provenance?: { author?: RuleMetadataShape['author']; classifiedBy?: RuleMetadataShape['classifiedBy'] }
): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return {
		type: CHOICE,
		members: members as StringRule[],
		...(provenance !== undefined ? { metadata: makeRuleMetadata(provenance) } : {})
	} satisfies ChoiceRule;
}
