import { RuleWalker } from '../dsl/rule-walker.ts';
import { ALIAS, SUPERTYPE, SYMBOL } from '../types/rule-types.ts';
import type { AliasRule, LabelProvenance, Rule, RuleAnnotations, SymbolRef, SymbolRule } from '../types/rule.ts';
import { automaticVariantKey, type AutomaticVariants, type CopyBase } from '../dsl/automatic-variants.ts';

export function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
	if (rule.type === ALIAS) return true;
	if (rule.type === SYMBOL) return !(rule.name in rules);
	return false;
}

export interface VariantChild {
	readonly kind: string;
	readonly name: string;
	readonly definedBy: LabelProvenance;
}

const walker = new RuleWalker<Rule<'link'>>();

function annotationsOf(rule: Rule<'link'>): RuleAnnotations | undefined {
	return (rule as { annotations?: RuleAnnotations }).annotations;
}

function provenanceOf(rule: Rule<'link'>, automatic: AutomaticVariants | undefined): LabelProvenance {
	const key = automaticVariantKey(rule);
	return key !== undefined && automatic?.keys.has(key) === true ? 'enrich' : 'override';
}

function withProvenance(annotations: RuleAnnotations, definedBy: LabelProvenance): RuleAnnotations {
	return annotations.definedBy === definedBy ? annotations : { ...annotations, definedBy };
}

function stampedArm(rule: Rule<'link'>, automatic: AutomaticVariants | undefined): Rule<'link'> {
	if (rule.type === ALIAS) {
		const own = annotationsOf(rule);
		const inner = annotationsOf(rule.content);
		if (own?.variantOf === undefined && inner?.variantOf === undefined) return rule;
		const definedBy = provenanceOf(rule, automatic);
		const content = inner?.variantOf === undefined ? rule.content : ({ ...rule.content, annotations: withProvenance(inner, definedBy) } as Rule<'link'>);
		return { ...rule, content, ...(own?.variantOf === undefined ? {} : { annotations: withProvenance(own, definedBy) }) } as Rule<'link'>;
	}
	const own = annotationsOf(rule);
	if (own?.variantOf === undefined || own.definedBy !== undefined) return rule;
	return { ...rule, annotations: withProvenance(own, provenanceOf(rule, automatic)) } as Rule<'link'>;
}

export function stampLabelProvenance(rules: Record<string, Rule<'link'>>, automatic: AutomaticVariants | undefined): void {
	const stamp = (rule: Rule<'link'>): Rule<'link'> => stampedArm(walker.map(rule, (r) => stampedArm(r, automatic)), automatic);
	for (const [kind, rule] of Object.entries(rules)) {
		rules[kind] = rule.type === SUPERTYPE ? ({ ...rule, subtypes: rule.subtypes.map(stamp) } as Rule<'link'>) : stamp(rule);
	}
}

function provenanceStamped(annotations: RuleAnnotations, parentKind: string): LabelProvenance {
	if (annotations.definedBy === undefined) throw new Error(`link: the '${annotations.variant}' label of '${parentKind}' has no provenance stamp`);
	return annotations.definedBy;
}

function variantArmOf(rule: Rule<'link'>, parentKind: string): VariantChild | null {
	if (rule.type === SYMBOL) {
		const annotations = annotationsOf(rule);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return { kind: (rule as SymbolRule<'link'>).name, name: annotations.variant, definedBy: provenanceStamped(annotations, parentKind) };
	}
	if (rule.type === ALIAS) {
		const alias = rule as AliasRule<'link'>;
		const annotations = annotationsOf(alias) ?? annotationsOf(alias.content);
		if (annotations?.variant === undefined || annotations.variantOf !== parentKind) return null;
		return typeof alias.value === 'string' && alias.named ? { kind: alias.value, name: annotations.variant, definedBy: provenanceStamped(annotations, parentKind) } : null;
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

export function deriveVariantChildren(rules: Record<string, Rule<'link'>>, baseOf: CopyBase = (kind) => kind): Map<string, VariantChild[]> {
	const out = new Map<string, VariantChild[]>();
	for (const [kind, rule] of Object.entries(rules)) {
		const owner = baseOf(kind);
		const held = out.get(owner) ?? [];
		const children = variantChildrenOf(owner, rule).filter((child) => !held.some((h) => h.kind === child.kind));
		if (children.length > 0) out.set(owner, [...held, ...children]);
	}
	return out;
}

export function ownedVariants(
	children: ReadonlyMap<string, readonly VariantChild[]>,
	references: readonly SymbolRef[],
	baseOf: CopyBase
): Readonly<Record<string, string>> | undefined {
	const parents = new Map<string, Map<string, number>>();
	for (const ref of references) {
		const counts = parents.get(ref.to) ?? parents.set(ref.to, new Map()).get(ref.to)!;
		counts.set(ref.from, (counts.get(ref.from) ?? 0) + 1);
	}
	const soleOwner = (kind: string): string | undefined => {
		const counts = [...(parents.get(kind) ?? [])];
		const bases = new Set(counts.map(([from]) => baseOf(from)));
		return bases.size === 1 && counts.every(([, count]) => count === 1) ? [...bases][0] : undefined;
	};
	const out: Record<string, string> = {};
	for (const [owner, arms] of children)
		for (const arm of arms) if (soleOwner(arm.kind) === owner) out[arm.kind] = owner;
	return Object.keys(out).length > 0 ? out : undefined;
}
