import { withAnnotations } from './annotations.ts';
import type { Rule, RuleAnnotations } from '../types/rule.ts';
import { prefixNamedSuffix, supertypeMemberName } from '../compiler/variant-structural.ts';
import { isParserHiddenName, isSupertypeLike } from './rule-patterns.ts';
import { makeRuleMetadata } from './rule-metadata.ts';

export const ENRICH_AUTOMATIC_VARIANTS_KEY = '__enrichedAutomaticVariants__' as const;

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

function armDisplayOf(arm: ArmShape): string | undefined {
	if (arm.type === 'SYMBOL' && typeof arm.name === 'string') return arm.name.replace(/^_+/, '');
	if (arm.type === 'ALIAS' && arm.named === true && typeof arm.value === 'string' && arm.content?.type === 'SYMBOL') return arm.value;
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

function holdsChoice(node: ArmShape | undefined): boolean {
	if (node === undefined) return false;
	if (node.type === 'CHOICE') return (node.members ?? []).filter((m) => m.type !== 'BLANK').length >= 2 || (node.members ?? []).some(holdsChoice);
	if (node.type !== undefined && SLOT_BOUNDARIES.has(node.type)) return false;
	return (node.members ?? []).some(holdsChoice) || (node.content !== undefined && holdsChoice(node.content));
}

function isHoistedChoiceGroup(rule: ArmShape | undefined): boolean {
	return rule?.annotations?.hoisted === true && holdsChoice(rule);
}

function stampRuleVariants(
	owner: string,
	rule: unknown,
	ruleOf: (name: string) => unknown,
	stamped: Set<string>,
	isSupertype: boolean
): unknown {
	const nameOf = (display: string): string =>
		isSupertype ? supertypeMemberName(display, owner) : (prefixNamedSuffix(owner, display) ?? display);
	const label = (member: ArmShape): ArmShape => {
		const display = armDisplayOf(member);
		const annotations: RuleAnnotations = display === undefined ? { variantOf: owner } : { variant: nameOf(display), variantOf: owner };
		const annotated = withAnnotations(member, annotations) as unknown as ArmShape & { readonly metadata?: object };
		const out = { ...annotated, metadata: makeRuleMetadata({ ...annotated.metadata, author: 'enrich' }) } as ArmShape;
		stamped.add(automaticVariantKey(out)!);
		return out;
	};
	const stamp = (member: ArmShape): ArmShape => {
		if (annotationsOf(member)?.variantOf !== undefined || isDisplayedLiteral(member)) return member;
		return member.type === 'CHOICE' ? visit(member) : label(member);
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
): Set<string> {
	const stamped = new Set<string>();
	for (const owner of Object.keys(rules)) {
		const rule = rules[owner];
		if (rule === undefined) continue;
		const isSupertype = supertypeNames.has(owner) || (isParserHiddenName(owner) && !inlineNames.has(owner) && isSupertypeLike(rule));
		rules[owner] = stampRuleVariants(owner, rule, (name) => rules[name], stamped, isSupertype) as Rule;
	}
	return stamped;
}

export function getEnrichAutomaticVariants(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const value = (grammar as Record<string, unknown>)[ENRICH_AUTOMATIC_VARIANTS_KEY];
	return value instanceof Set ? (value as ReadonlySet<string>) : new Set();
}

export function withoutAutomaticVariants(rule: unknown, automatic: ReadonlySet<string>): unknown {
	if (automatic.size === 0) return rule;
	const strip = (node: ArmShape): ArmShape => {
		if (node.type === 'CHOICE' && node.members !== undefined) {
			const members = node.members.map((member) => {
				const key = automaticVariantKey(member);
				if (key !== undefined && automatic.has(key)) return withoutLabel(member);
				return strip(member);
			});
			return members.some((m, i) => m !== node.members![i]) ? { ...node, members } : node;
		}
		if (node.type !== undefined && SLOT_BOUNDARIES.has(node.type)) return node;
		if (node.members !== undefined) {
			const members = node.members.map(strip);
			return members.some((m, i) => m !== node.members![i]) ? { ...node, members } : node;
		}
		if (node.content !== undefined && typeof node.content === 'object') {
			const content = strip(node.content);
			return content === node.content ? node : { ...node, content };
		}
		return node;
	};
	return strip(rule as ArmShape);
}

function withoutLabel(arm: ArmShape): ArmShape {
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
	return arm.type === 'ALIAS' && arm.content !== undefined ? { ...arm, content: rebuild(arm.content) } : rebuild(arm);
}

export function withAuthoredLabel(site: unknown, label: RuleAnnotations): unknown {
	const annotated = withAnnotations(site, label) as unknown as { readonly metadata?: object };
	return { ...annotated, metadata: makeRuleMetadata({ ...annotated.metadata, author: 'override' }) };
}

export function relabelledArm(site: unknown, original: unknown): unknown {
	const owner = annotationsOf(original as ArmShape)?.variantOf;
	if (owner === undefined) return site;
	const display = armDisplayOf(site as ArmShape);
	return withAuthoredLabel(site, display === undefined ? { variantOf: owner } : { variant: prefixNamedSuffix(owner, display) ?? display, variantOf: owner });
}

export function unlabelled(rule: unknown): unknown {
	return withoutLabel(rule as ArmShape);
}
