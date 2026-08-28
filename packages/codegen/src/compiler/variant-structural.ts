import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { ALIAS, CHOICE, OPTIONAL, SEQ, SYMBOL, VARIANT } from '../types/rule-types.ts';
import type { AliasRule, ChoiceRule, Rule, SeqRule, SymbolRule } from '../types/rule.ts';

export { polymorphVisibleName };

function stripHiddenPrefix(name: string): string {
	return name.startsWith('_') ? name.slice(1) : name;
}

export function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
	if (rule.type === ALIAS) return true;
	if (rule.type === SYMBOL) return !(rule.name in rules);
	return false;
}

function namedKindRefTarget(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): string | null {
	let core: Rule<'link'> = rule;
	while (core.type === VARIANT || core.type === OPTIONAL) {
		core = (core as { content: Rule<'link'> }).content;
	}
	if (core.type !== ALIAS && core.type !== SYMBOL) return null;
	if (!isAliasMintedRef(core, rules)) return null;
	if (core.type === ALIAS) return (core as AliasRule<'link'>).value;
	return (core as SymbolRule<'link'>).name;
}

function namedKindArmTarget(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): string | null {
	const direct = namedKindRefTarget(rule, rules);
	if (direct !== null) return direct;
	if (rule.type === SEQ) {
		const seq = rule as SeqRule<'link'>;
		const first = seq.members[0];
		if (first) return namedKindRefTarget(first, rules);
	}
	return null;
}

export function prefixNamedSuffix(parentKind: string, targetName: string): string | null {
	const bareTarget = stripHiddenPrefix(targetName);
	const prefix = `${polymorphVisibleName(parentKind, '')}`;
	if (!bareTarget.startsWith(prefix)) return null;
	const suffix = bareTarget.slice(prefix.length);
	return suffix.length > 0 ? suffix : null;
}

export interface StructuralVariantChoice {
	readonly choice: ChoiceRule<'link'>;
	readonly arms: readonly { readonly suffix: string; readonly targetName: string }[];
}

function matchStructuralVariantChoice(
	rule: Rule<'link'>,
	parentKind: string,
	rules: Record<string, Rule<'link'>>
): { readonly match: StructuralVariantChoice; readonly matchedIndices: ReadonlySet<number> } | null {
	if (rule.type !== CHOICE || rule.members.length === 0) return null;
	const arms: { suffix: string; targetName: string }[] = [];
	const matchedIndices = new Set<number>();
	rule.members.forEach((member, i) => {
		const targetName = namedKindArmTarget(member, rules);
		if (targetName === null) return;
		const suffix = prefixNamedSuffix(parentKind, targetName);
		if (suffix === null) return;
		arms.push({ suffix, targetName });
		matchedIndices.add(i);
	});
	return arms.length > 0 ? { match: { choice: rule, arms }, matchedIndices } : null;
}

function collectStructuralVariantChoices(
	rule: Rule<'link'>,
	parentKind: string,
	rules: Record<string, Rule<'link'>>,
	out: StructuralVariantChoice[]
): void {
	if (rule.type === CHOICE) {
		const found = matchStructuralVariantChoice(rule, parentKind, rules);
		if (found) {
			out.push(found.match);
			rule.members.forEach((m, i) => {
				if (!found.matchedIndices.has(i)) collectStructuralVariantChoices(m, parentKind, rules, out);
			});
			return;
		}
		for (const m of rule.members) collectStructuralVariantChoices(m, parentKind, rules, out);
		return;
	}
	switch (rule.type) {
		case SEQ: {
			for (const m of (rule as SeqRule<'link'>).members) collectStructuralVariantChoices(m, parentKind, rules, out);
			return;
		}
		default: {
			const content = (rule as { content?: Rule<'link'> }).content;
			if (content) collectStructuralVariantChoices(content, parentKind, rules, out);
		}
	}
}

export function findStructuralVariantChoices(
	kind: string,
	rule: Rule<'link'>,
	rules: Record<string, Rule<'link'>>
): readonly StructuralVariantChoice[] {
	const out: StructuralVariantChoice[] = [];
	collectStructuralVariantChoices(rule, kind, rules, out);
	return out;
}

export function deriveStructuralVariantChildren(rules: Record<string, Rule<'link'>>): Map<string, string[]> {
	const out = new Map<string, string[]>();
	for (const [kind, rule] of Object.entries(rules)) {
		const choices = findStructuralVariantChoices(kind, rule, rules);
		if (choices.length === 0) continue;
		const targetNames: string[] = [];
		const seen = new Set<string>();
		for (const c of choices) {
			for (const arm of c.arms) {
				if (seen.has(arm.targetName)) continue;
				seen.add(arm.targetName);
				targetNames.push(arm.targetName);
			}
		}
		out.set(kind, targetNames);
	}
	return out;
}
