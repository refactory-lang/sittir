import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { ALIAS, SUPERTYPE, SYMBOL } from '../types/rule-types.ts';
import type { AliasRule, Rule, RuleAnnotations, SymbolRule } from '../types/rule.ts';

export { polymorphVisibleName };

export function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
	if (rule.type === ALIAS) return true;
	if (rule.type === SYMBOL) return !(rule.name in rules);
	return false;
}

export function prefixNamedSuffix(parentKind: string, targetName: string): string | null {
	const bareTarget = targetName.startsWith('_') ? targetName.slice(1) : targetName;
	const prefix = `${polymorphVisibleName(parentKind, '')}`;
	if (!bareTarget.startsWith(prefix)) return null;
	const suffix = bareTarget.slice(prefix.length);
	return suffix.length > 0 ? suffix : null;
}

export interface VariantChild {
	readonly kind: string;
	readonly name: string;
}

const walker = new RuleWalker<Rule<'link'>>();

function annotationsOf(rule: Rule<'link'>): RuleAnnotations | undefined {
	return (rule as { annotations?: RuleAnnotations }).annotations;
}

function variantArmOf(rule: Rule<'link'>, parentKind: string): VariantChild | null {
	if (rule.type === SYMBOL) {
		const annotations = annotationsOf(rule);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return { kind: (rule as SymbolRule<'link'>).name, name: annotations.variant };
	}
	if (rule.type === ALIAS) {
		const alias = rule as AliasRule<'link'>;
		const annotations = annotationsOf(alias) ?? annotationsOf(alias.content);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return typeof alias.value === 'string' && alias.named ? { kind: alias.value, name: annotations.variant } : null;
	}
	return null;
}

export function variantChildrenOf(parentKind: string, rule: Rule<'link'>): VariantChild[] {
	const out: VariantChild[] = [];
	const seen = new Set<string>();
	const visit = (node: Rule<'link'>): void => {
		const arm = variantArmOf(node, parentKind);
		if (arm !== null) {
			if (!seen.has(arm.kind)) {
				seen.add(arm.kind);
				out.push(arm);
			}
			return;
		}
		const children = node.type === SUPERTYPE ? node.subtypes : walker.childrenOf(node);
		for (const child of children) visit(child);
	};
	visit(rule);
	return out;
}

export function deriveVariantChildren(rules: Record<string, Rule<'link'>>): Map<string, VariantChild[]> {
	const out = new Map<string, VariantChild[]>();
	for (const [kind, rule] of Object.entries(rules)) {
		const children = variantChildrenOf(kind, rule);
		if (children.length > 0) out.set(kind, children);
	}
	return out;
}
