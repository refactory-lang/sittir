import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { ALIAS, SUPERTYPE, SYMBOL } from '../types/rule-types.ts';
import type { AliasRule, Rule, RuleAnnotations, SymbolRule } from '../types/rule.ts';
import { isEnrichAuthored } from '../dsl/transform/transform-path.ts';

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

const GROUP_TOKEN_SYNONYMS: Readonly<Record<string, string>> = {
	item: 'statement',
	stmt: 'statement',
	expr: 'expression',
	decl: 'declaration',
	impl: 'implementation'
};

const CATEGORY_TOKENS: ReadonlySet<string> = new Set([
	'expression',
	'statement',
	'literal',
	'declaration',
	'definition',
	'operator',
	'pattern',
	'type'
]);

function normalizeGroupToken(token: string): string {
	return GROUP_TOKEN_SYNONYMS[token] ?? token;
}

function tokensOf(name: string): string[] {
	return name.split('_').filter((t) => t.length > 0);
}

export function supertypeMemberName(memberKind: string, supertypeKind: string): string {
	const parts = tokensOf(memberKind);
	const bareMember = parts.join('_');
	const groupTokens = new Set(tokensOf(supertypeKind).map(normalizeGroupToken));
	let kept = parts.filter((t) => !groupTokens.has(normalizeGroupToken(t)));
	if (kept.length === parts.length && parts.length >= 2) {
		const tail = normalizeGroupToken(parts[parts.length - 1]!);
		if (CATEGORY_TOKENS.has(tail)) kept = parts.slice(0, -1);
	}
	if (kept.length === 0 || kept.join('_') === tokensOf(supertypeKind).join('_')) return bareMember;
	return kept.join('_');
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

function definedByOf(rule: Rule<'link'>): VariantChild['definedBy'] {
	return isEnrichAuthored(rule) ? 'enrich' : 'override';
}

function variantArmOf(rule: Rule<'link'>, parentKind: string): VariantChild | null {
	if (rule.type === SYMBOL) {
		const annotations = annotationsOf(rule);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return { kind: (rule as SymbolRule<'link'>).name, name: annotations.variant, definedBy: definedByOf(rule) };
	}
	if (rule.type === ALIAS) {
		const alias = rule as AliasRule<'link'>;
		const annotations = annotationsOf(alias) ?? annotationsOf(alias.content);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return typeof alias.value === 'string' && alias.named ? { kind: alias.value, name: annotations.variant, definedBy: definedByOf(alias) } : null;
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
