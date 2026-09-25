import { withAnnotations } from './annotations.ts';
import type { Rule, RuleAnnotations } from '../types/rule.ts';
import { armNameOf, undisplayedKindAddress } from './arm-names.ts';
import { hiddenChoiceClass, isNamedArmChoice, isParserHiddenName, throughPrec, unwrapPrec } from './rule-patterns.ts';

export const ENRICH_AUTOMATIC_VARIANTS_KEY = '__enrichedAutomaticVariants__' as const;

export interface AutomaticVariants {
	readonly keys: Set<string>;
	readonly supertypeOwners: ReadonlySet<string>;
}

interface ArmShape {
	readonly type?: string;
	readonly name?: string;
	readonly value?: unknown;
	readonly named?: boolean;
	readonly content?: ArmShape;
	readonly members?: readonly ArmShape[];
	readonly annotations?: RuleAnnotations;
}

const SLOT_BOUNDARIES = new Set(['FIELD', 'TOKEN', 'IMMEDIATE_TOKEN', 'ALIAS', 'PATTERN', 'STRING', 'SYMBOL', 'BLANK']);

function coreOf(arm: ArmShape): ArmShape {
	return unwrapPrec(arm) as ArmShape;
}

function armDisplayOf(arm: ArmShape): string | undefined {
	const core = coreOf(arm);
	if (core.type === 'SYMBOL' && typeof core.name === 'string') return undisplayedKindAddress(core.name);
	if (core.type === 'ALIAS' && core.named === true && typeof core.value === 'string' && core.content?.type === 'SYMBOL') return core.value;
	return undefined;
}

function isDisplayedLiteral(arm: ArmShape): boolean {
	return arm.type === 'ALIAS' && arm.named === true && arm.content?.type === 'STRING';
}

function annotationsOf(arm: ArmShape): RuleAnnotations | undefined {
	return arm.type === 'ALIAS' ? arm.content?.annotations : arm.annotations;
}

function refOf(arm: ArmShape): string {
	if (arm.type === 'ALIAS') return `${String(arm.value)}\u0000${arm.content?.name ?? ''}`;
	if (arm.type === 'SYMBOL') return String(arm.name);
	return JSON.stringify(arm.value);
}

export function automaticVariantKey(arm: unknown): string | undefined {
	const shape = arm as ArmShape;
	const annotations = annotationsOf(shape);
	if (annotations?.variantOf === undefined) return undefined;
	return `${annotations.variantOf}\u0000${annotations.variant ?? ''}\u0000${refOf(shape)}`;
}

function labelOf(owner: string, display: string | undefined, ownerIsSupertype: boolean): RuleAnnotations {
	return display === undefined ? { variantOf: owner } : { variant: armNameOf(owner, display, ownerIsSupertype), variantOf: owner };
}

function withAutomaticLabel(core: ArmShape, label: RuleAnnotations, automatic: AutomaticVariants): ArmShape {
	const out = withAnnotations(core, label) as ArmShape;
	automatic.keys.add(automaticVariantKey(out)!);
	return out;
}

function holdsChoice(node: ArmShape | undefined): boolean {
	if (node === undefined) return false;
	if (node.type === 'CHOICE') return (node.members ?? []).filter((m) => m.type !== 'BLANK').length >= 2 || (node.members ?? []).some(holdsChoice);
	if (node.type !== undefined && SLOT_BOUNDARIES.has(node.type)) return false;
	return (node.members ?? []).some(holdsChoice) || (node.content !== undefined && holdsChoice(node.content));
}

function isHoistedChoiceGroup(rule: ArmShape | undefined): boolean {
	return rule?.annotations?.hoisted === true && holdsChoice(rule);
}

export function isSupertypeOwner(
	owner: string,
	rules: Readonly<Record<string, unknown>>,
	supertypeNames: ReadonlySet<string>,
	inlineNames: ReadonlySet<string>
): boolean {
	if (supertypeNames.has(owner)) return true;
	if (!isParserHiddenName(owner) || inlineNames.has(owner)) return false;
	const rule = rules[owner];
	return hiddenChoiceClass(rule, (name) => rules[name], isNamedArmChoice(rule)) === 'supertype';
}

function stampRuleVariants(
	owner: string,
	rule: unknown,
	ruleOf: (name: string) => unknown,
	automatic: AutomaticVariants
): unknown {
	const ownerIsSupertype = automatic.supertypeOwners.has(owner);
	const label = (core: ArmShape): ArmShape => withAutomaticLabel(core, labelOf(owner, armDisplayOf(core), ownerIsSupertype), automatic);
	const stamp = (member: ArmShape): ArmShape => {
		const core = coreOf(member);
		if (annotationsOf(core)?.variantOf !== undefined || isDisplayedLiteral(core)) return member;
		return core.type === 'CHOICE' ? visit(member) : throughPrec(member, label);
	};
	const visit = (node: ArmShape): ArmShape => {
		if (node.type === 'CHOICE' && node.members !== undefined) {
			const choosable = node.members.filter((m) => m.type !== 'BLANK').length >= 2;
			const members = node.members.map((member) => (choosable && member.type !== 'BLANK' ? stamp(member) : visit(member)));
			return members.some((m, i) => m !== node.members![i]) ? { ...node, members } : node;
		}
		if (node.type === 'SYMBOL' && typeof node.name === 'string' && annotationsOf(node)?.variantOf === undefined) {
			return isHoistedChoiceGroup(ruleOf(node.name) as ArmShape | undefined) ? label(node) : node;
		}
		if (node.type !== undefined && SLOT_BOUNDARIES.has(node.type)) return node;
		if (node.members !== undefined) {
			const members = node.members.map(visit);
			return members.some((m, i) => m !== node.members![i]) ? { ...node, members } : node;
		}
		if (node.content !== undefined && typeof node.content === 'object') {
			const content = visit(node.content);
			return content === node.content ? node : { ...node, content };
		}
		return node;
	};
	return visit(rule as ArmShape);
}

export function stampAutomaticVariants(
	rules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>,
	inlineNames: ReadonlySet<string>
): AutomaticVariants {
	const supertypeOwners = new Set(Object.keys(rules).filter((owner) => isSupertypeOwner(owner, rules, supertypeNames, inlineNames)));
	const automatic: AutomaticVariants = { keys: new Set(), supertypeOwners };
	for (const owner of Object.keys(rules)) {
		const rule = rules[owner];
		if (rule === undefined) continue;
		rules[owner] = stampRuleVariants(owner, rule, (name) => rules[name], automatic) as Rule;
	}
	return automatic;
}

function isAutomaticVariants(value: unknown): value is AutomaticVariants {
	const record = value as Partial<AutomaticVariants> | undefined;
	return record?.keys instanceof Set && record.supertypeOwners instanceof Set;
}

export function getEnrichAutomaticVariants(grammar: unknown): AutomaticVariants | undefined {
	if (!grammar || typeof grammar !== 'object' || !(ENRICH_AUTOMATIC_VARIANTS_KEY in grammar)) return undefined;
	const value = (grammar as Record<string, unknown>)[ENRICH_AUTOMATIC_VARIANTS_KEY];
	if (!isAutomaticVariants(value)) throw new Error('enrich: the automatic-variant sidecar is malformed; expected { keys: Set, supertypeOwners: Set }');
	return value;
}

export function seedAutomaticVariants(grammar: unknown): AutomaticVariants {
	const enriched = getEnrichAutomaticVariants(grammar);
	return enriched === undefined
		? { keys: new Set(), supertypeOwners: new Set() }
		: { keys: new Set(enriched.keys), supertypeOwners: enriched.supertypeOwners };
}

export function withoutAutomaticVariants(rule: unknown, automatic: AutomaticVariants): unknown {
	if (automatic.keys.size === 0) return rule;
	const strip = (node: ArmShape): ArmShape => {
		const key = automaticVariantKey(node);
		const own = key !== undefined && automatic.keys.has(key) ? withoutLabel(node) : node;
		if (own.type !== undefined && SLOT_BOUNDARIES.has(own.type)) return own;
		if (own.members !== undefined) {
			const members = own.members.map(strip);
			return members.some((m, i) => m !== own.members![i]) ? { ...own, members } : own;
		}
		if (own.content !== undefined && typeof own.content === 'object') {
			const content = strip(own.content);
			return content === own.content ? own : { ...own, content };
		}
		return own;
	};
	return strip(rule as ArmShape);
}

export function withoutLabel<T>(rule: T): T {
	const arm = rule as ArmShape;
	const drop = (annotations: RuleAnnotations | undefined): RuleAnnotations | undefined => {
		if (annotations === undefined) return undefined;
		const { variant: _variant, variantOf: _variantOf, ...rest } = annotations;
		return Object.keys(rest).length === 0 ? undefined : rest;
	};
	const rebuild = (node: ArmShape): ArmShape => {
		const annotations = drop(node.annotations);
		const { annotations: _annotations, ...bare } = node;
		return annotations === undefined ? bare : { ...bare, annotations };
	};
	return (arm.type === 'ALIAS' && arm.content !== undefined ? { ...arm, content: rebuild(arm.content) } : rebuild(arm)) as T;
}

export function withAuthoredLabel<T>(site: T, label: RuleAnnotations, automatic: AutomaticVariants): T {
	const out = withAnnotations(site, label) as T;
	const key = automaticVariantKey(out);
	if (key !== undefined) automatic.keys.delete(key);
	return out;
}

export function relabelledArm(site: unknown, original: unknown, automatic: AutomaticVariants): unknown {
	const core = coreOf(original as ArmShape);
	const annotations = annotationsOf(core);
	const owner = annotations?.variantOf;
	if (owner === undefined) return site;
	const key = automaticVariantKey(core);
	if (key === undefined || !automatic.keys.has(key)) {
		const { variant, default: isDefault } = annotations!;
		return withAuthoredLabel(site, { variantOf: owner, ...(variant === undefined ? {} : { variant }), ...(isDefault === true ? { default: true } : {}) }, automatic);
	}
	const ownerIsSupertype = automatic.supertypeOwners.has(owner);
	return throughPrec(site as ArmShape, (siteCore) => withAutomaticLabel(siteCore, labelOf(owner, armDisplayOf(siteCore), ownerIsSupertype), automatic));
}
