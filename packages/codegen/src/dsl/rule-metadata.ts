import type { RuleMetadata } from '../types/rule-metadata-brand.ts';
import type { ChoiceRule, StringRule } from '../types/rule.ts';
import { ALIAS, CHOICE, SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts

export const GLOBAL_WORDSET = 'global';

export interface RuleMetadataShape {
	fieldSource?: 'grammar' | 'override' | 'enriched';
	symbolSource?: 'grammar' | 'link' | 'group-lift';
	aliasSource?: 'visible-group';
	reservedWordsets?: readonly string[];
	aliasStorage?: string;
}

export function makeRuleMetadata(shape: RuleMetadataShape): RuleMetadata {
	return shape as unknown as RuleMetadata;
}

export function readRuleMetadata(meta: unknown): RuleMetadataShape | undefined {
	return meta as RuleMetadataShape | undefined;
}

export function reservedWordsetsOf(meta: unknown): readonly string[] | undefined {
	return readRuleMetadata(meta)?.reservedWordsets;
}

export function isVisibleGroupAlias(rule: unknown): boolean {
	const shown = rule as { readonly type?: unknown; readonly metadata?: unknown } | null | undefined;
	return shown?.type === ALIAS && readRuleMetadata(shown.metadata)?.aliasSource === 'visible-group';
}

export function isGroupLiftReference(rule: unknown): boolean {
	const shown = rule as { readonly type?: unknown; readonly metadata?: unknown; readonly annotations?: unknown } | null | undefined;
	const annotations = shown?.annotations;
	return (
		shown?.type === SYMBOL &&
		readRuleMetadata(shown.metadata)?.symbolSource === 'group-lift' &&
		!(typeof annotations === 'object' && annotations !== null && 'variant' in annotations)
	);
}

export function groupLiftNames(rules: Readonly<Record<string, unknown>>): ReadonlySet<string> {
	const names = new Set<string>();
	const visit = (rule: unknown): void => {
		if (Array.isArray(rule)) return rule.forEach(visit);
		if (typeof rule !== 'object' || rule === null) return;
		const name = (rule as { readonly name?: unknown }).name;
		if (isGroupLiftReference(rule) && typeof name === 'string') names.add(name);
		Object.values(rule).forEach(visit);
	};
	Object.values(rules).forEach(visit);
	return names;
}

export function aliasStorageOf(meta: unknown): string | undefined {
	return readRuleMetadata(meta)?.aliasStorage;
}

export function withReservedWordsets(meta: unknown, reservedWordsets: readonly string[]): RuleMetadata {
	return makeRuleMetadata({ ...readRuleMetadata(meta), reservedWordsets });
}

export function normalizeEnumMembers(members: readonly StringRule[]): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return { type: CHOICE, members: members as StringRule[] } satisfies ChoiceRule;
}
