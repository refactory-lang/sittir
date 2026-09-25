import { RuleWalker } from '../dsl/rule-walker.ts';
import { ALIAS, SUPERTYPE, SYMBOL } from '../types/rule-types.ts';
import type { AliasRule, Rule, RuleAnnotations, SymbolRule } from '../types/rule.ts';
import { automaticVariantKey, type AutomaticVariants } from '../dsl/automatic-variants.ts';

export function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
	if (rule.type === ALIAS) return true;
	if (rule.type === SYMBOL) return !(rule.name in rules);
	return false;
}

export interface VariantChild {
	readonly kind: string;
	readonly name: string;
	readonly definedBy: 'enrich' | 'override';
}

const walker = new RuleWalker<Rule<'link'>>();

function annotationsOf(rule: Rule<'link'>): RuleAnnotations | undefined {
	return (rule as { annotations?: RuleAnnotations }).annotations;
}

function definedByOf(rule: Rule<'link'>, automatic: AutomaticVariants | undefined): VariantChild['definedBy'] {
	const key = automaticVariantKey(rule);
	return key !== undefined && automatic?.keys.has(key) === true ? 'enrich' : 'override';
}

function variantArmOf(rule: Rule<'link'>, parentKind: string, automatic: AutomaticVariants | undefined): VariantChild | null {
	if (rule.type === SYMBOL) {
		const annotations = annotationsOf(rule);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return { kind: (rule as SymbolRule<'link'>).name, name: annotations.variant, definedBy: definedByOf(rule, automatic) };
	}
	if (rule.type === ALIAS) {
		const alias = rule as AliasRule<'link'>;
		const annotations = annotationsOf(alias) ?? annotationsOf(alias.content);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return typeof alias.value === 'string' && alias.named ? { kind: alias.value, name: annotations.variant, definedBy: definedByOf(alias, automatic) } : null;
	}
	return null;
}

export function variantChildrenOf(parentKind: string, rule: Rule<'link'>, automatic: AutomaticVariants | undefined): VariantChild[] {
	const out: VariantChild[] = [];
	const seen = new Set<string>();
	const visit = (node: Rule<'link'>): void => {
		const arm = variantArmOf(node, parentKind, automatic);
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

export function deriveVariantChildren(rules: Record<string, Rule<'link'>>, automatic: AutomaticVariants | undefined): Map<string, VariantChild[]> {
	const out = new Map<string, VariantChild[]>();
	for (const [kind, rule] of Object.entries(rules)) {
		const children = variantChildrenOf(kind, rule, automatic);
		if (children.length > 0) out.set(kind, children);
	}
	return out;
}
