import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import type { RenderRule, RuleAnnotations, RuleId } from '../../types/rule.ts';
import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { buildSupertypeMembersMap } from './supertype-members.ts';
import {
	EMPTY_SEPARATOR_TOKEN,
	SPACING_ARMS,
	SPACING_DEFAULT,
	isSpacingArm,
	spacingLabel,
	type RenderDefaults,
	type SpacingArm
} from '../../dsl/primitives/spacing.ts';

export type SpacingSide = 'before' | 'after' | 'gap';

export interface SpacingPart {
	readonly fieldName: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: SpacingArm;
}

export interface SpacedSeparator {
	readonly before?: SpacingPart;
	readonly token?: RenderRule;
	readonly after?: SpacingPart;
}

export interface RenderRules {
	readonly rules: Readonly<Record<string, RenderRule>>;
}

export interface RenderRulesConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEntryLike[];
	readonly defaults?: RenderDefaults;
}

export interface RuleSpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: SpacingArm;
}

type Bag = {
	readonly type: string;
	readonly id?: RuleId;
	readonly name?: string;
	readonly value?: unknown;
	readonly fieldName?: string;
	readonly multiplicity?: string;
	readonly tokenized?: boolean;
	readonly immediate?: boolean;
	readonly members?: readonly RenderRule[];
	readonly content?: RenderRule;
	readonly separator?: { readonly value: RenderRule };
	readonly annotations?: RuleAnnotations;
};

const bag = (rule: RenderRule): Bag => rule as unknown as Bag;

export function publicKindName(kind: string): string {
	return kind.replace(/^_+/, '');
}

function isRepeated(rule: RenderRule): boolean {
	const m = bag(rule).multiplicity;
	return m === 'array' || m === 'nonEmptyArray';
}

function admitsNoExtras(rule: RenderRule, rules: Readonly<Record<string, RenderRule>>, externals: ReadonlySet<string>): boolean {
	const r = bag(rule);
	if (r.tokenized === true || r.immediate === true) return true;
	if (r.type === SYMBOL && r.name !== undefined) {
		if (externals.has(r.name) || externals.has(`_${publicKindName(r.name)}`)) return true;
		const target = rules[r.name];
		return target !== undefined && (bag(target).tokenized === true || bag(target).immediate === true);
	}
	if (r.members !== undefined) return r.members.some((m) => admitsNoExtras(m, rules, externals));
	if (r.content !== undefined) return admitsNoExtras(r.content, rules, externals);
	return false;
}

interface Gap {
	readonly kind: string;
	readonly slot: string;
	readonly id: RuleId;
	readonly token?: string;
}

function gapOf(rule: RenderRule, kindEntries: readonly KindEntryLike[]): { readonly token?: string } | undefined {
	const sep = bag(rule).separator;
	if (sep === undefined) return {};
	const value = bag(sep.value);
	if (value.type !== STRING || typeof value.value !== 'string' || value.value === '') return undefined;
	const entry = findEntryForLiteralText(kindEntries, value.value);
	if (entry === undefined) throw new Error(`separator token '${value.value}' has no kind in the catalog`);
	return { token: publicKindName(entry.kind) };
}

function labelsOf(gap: { readonly token?: string }): readonly { readonly label: string; readonly side: SpacingSide }[] {
	return gap.token === undefined
		? [{ label: spacingLabel(EMPTY_SEPARATOR_TOKEN), side: 'gap' }]
		: [
				{ label: spacingLabel(gap.token, 'before'), side: 'before' },
				{ label: spacingLabel(gap.token, 'after'), side: 'after' }
			];
}

const walker = new RuleWalker<RenderRule>();

function collectGaps(config: RenderRulesConfig, rules: Readonly<Record<string, RenderRule>>): Map<RuleId, Gap> {
	const externals = config.nodeMap.externals ?? new Set<string>();
	const gaps = new Map<RuleId, Gap>();
	for (const [kind, rule] of Object.entries(rules)) {
		walker.fold(rule, undefined, (_, r) => {
			const id = bag(r).id;
			if (id === undefined || !isRepeated(r) || gaps.has(id)) return undefined;
			const slot = config.nodeMap.slotByRuleId.get(id)?.name;
			if (slot === undefined || admitsNoExtras(r, rules, externals)) return undefined;
			const gap = gapOf(r, config.kindEntries);
			if (gap !== undefined) gaps.set(id, { kind, slot, id, ...gap });
			return undefined;
		});
	}
	return gaps;
}

function nested(defaults: RenderDefaults, key: string): Readonly<Record<string, string>> | undefined {
	const v = defaults[key];
	return typeof v === 'object' ? v : undefined;
}

function checkArm(at: string, value: string): SpacingArm {
	if (!isSpacingArm(value)) throw new Error(`defaults: ${at} is '${value}', not one of ${SPACING_ARMS.join(', ')}`);
	return value;
}

class DefaultResolver {
	readonly #defaults: RenderDefaults;
	readonly #supertypesOf = new Map<string, string[]>();

	constructor(defaults: RenderDefaults | undefined, nodeMap: NodeMap, gaps: ReadonlyMap<RuleId, Gap>) {
		this.#defaults = defaults ?? {};
		for (const [supertype, members] of buildSupertypeMembersMap(nodeMap)) {
			for (const member of members) {
				const list = this.#supertypesOf.get(publicKindName(member)) ?? [];
				list.push(publicKindName(supertype));
				this.#supertypesOf.set(publicKindName(member), list);
			}
		}
		this.#validate(gaps);
	}

	#validate(gaps: ReadonlyMap<RuleId, Gap>): void {
		const labels = new Set<string>();
		const siteKeys = new Map<string, Set<string>>();
		for (const gap of gaps.values()) {
			const kind = publicKindName(gap.kind);
			const keys = siteKeys.get(kind) ?? new Set<string>();
			for (const { label } of labelsOf(gap)) {
				labels.add(label);
				keys.add(`${gap.slot}_${label}`);
			}
			siteKeys.set(kind, keys);
		}
		const membersOf = new Map<string, string[]>();
		for (const [member, supertypes] of this.#supertypesOf) {
			for (const s of supertypes) membersOf.set(s, [...(membersOf.get(s) ?? []), member]);
		}
		for (const [key, value] of Object.entries(this.#defaults)) {
			if (typeof value === 'string') {
				if (!labels.has(key)) throw new Error(`defaults: '${key}' is not a separator spacing preference of this grammar`);
				checkArm(`'${key}'`, value);
				continue;
			}
			const kinds = siteKeys.has(key) ? [key] : (membersOf.get(key) ?? []).filter((m) => siteKeys.has(m));
			if (kinds.length === 0) throw new Error(`defaults: '${key}' names no kind or supertype with a separator`);
			for (const [siteKey, arm] of Object.entries(value)) {
				if (!kinds.some((k) => siteKeys.get(k)!.has(siteKey))) {
					throw new Error(`defaults: ${key}.${siteKey} names no separator site`);
				}
				checkArm(`${key}.${siteKey}`, arm);
			}
		}
	}

	resolve(kind: string, slot: string, label: string): SpacingArm {
		const key = `${slot}_${label}`;
		const own = nested(this.#defaults, publicKindName(kind))?.[key];
		if (own !== undefined) return own as SpacingArm;
		const inherited = new Set<string>();
		for (const supertype of this.#supertypesOf.get(publicKindName(kind)) ?? []) {
			const v = nested(this.#defaults, supertype)?.[key];
			if (v !== undefined) inherited.add(v);
		}
		if (inherited.size > 1) {
			throw new Error(`defaults: ${publicKindName(kind)}.${key} inherits ${[...inherited].join(' and ')} from different supertypes`);
		}
		if (inherited.size === 1) return [...inherited][0] as SpacingArm;
		const top = this.#defaults[label];
		return typeof top === 'string' ? (top as SpacingArm) : SPACING_DEFAULT;
	}
}

function whitespaceSymbols(nodeMap: NodeMap): Readonly<Record<SpacingArm, string>> | undefined {
	const out: Partial<Record<SpacingArm, string>> = {};
	for (const arm of SPACING_ARMS) {
		const name = nodeMap.nodes.has(arm) ? arm : nodeMap.nodes.has(`_${arm}`) ? `_${arm}` : undefined;
		if (name === undefined) return undefined;
		out[arm] = name;
	}
	return out as Readonly<Record<SpacingArm, string>>;
}

function spacingChoice(part: SpacingPart, symbols: Readonly<Record<SpacingArm, string>>): RenderRule {
	return {
		type: CHOICE,
		nonterminal: true,
		fieldName: part.fieldName,
		members: SPACING_ARMS.map((arm) => ({
			type: SYMBOL,
			name: symbols[arm],
			nonterminal: true,
			annotations: { preference: part.label, ...(arm === part.defaultArm ? { default: true as const } : {}) }
		}))
	} as unknown as RenderRule;
}

function isSpacingChoice(rule: RenderRule): boolean {
	const r = bag(rule);
	return (
		r.type === CHOICE &&
		r.members !== undefined &&
		r.members.length === SPACING_ARMS.length &&
		r.members.every((m) => {
			const b = bag(m);
			return b.type === SYMBOL && b.name !== undefined && isSpacingArm(publicKindName(b.name)) && b.annotations?.preference !== undefined;
		})
	);
}

function partOf(choice: RenderRule, side: SpacingSide): SpacingPart {
	const r = bag(choice);
	const members = r.members!.map(bag);
	const defaultMember = members.find((m) => m.annotations?.default === true);
	if (r.fieldName === undefined || defaultMember?.name === undefined) {
		throw new Error('render rules: a spacing choice names its field and marks its default arm');
	}
	return {
		fieldName: r.fieldName,
		label: members[0]!.annotations!.preference!,
		side,
		defaultArm: publicKindName(defaultMember.name) as SpacingArm
	};
}

export function spacedSeparatorOf(rule: RenderRule): SpacedSeparator | undefined {
	const sep = bag(rule).separator?.value;
	if (sep === undefined) return undefined;
	if (isSpacingChoice(sep)) return { after: partOf(sep, 'gap') };
	const s = bag(sep);
	if (s.type !== SEQ || s.members === undefined || s.members.length !== 3) return undefined;
	const [before, token, after] = s.members as [RenderRule, RenderRule, RenderRule];
	if (!isSpacingChoice(before) || !isSpacingChoice(after)) return undefined;
	return { before: partOf(before, 'before'), token, after: partOf(after, 'after') };
}

function withSpacedSeparator(
	rule: RenderRule,
	gap: Gap,
	resolver: DefaultResolver,
	symbols: Readonly<Record<SpacingArm, string>>
): RenderRule {
	const parts = labelsOf(gap).map(({ label, side }) =>
		spacingChoice(
			{ fieldName: `${gap.slot}_${label}`, label, side, defaultArm: resolver.resolve(gap.kind, gap.slot, label) },
			symbols
		)
	);
	const separator = bag(rule).separator;
	const value: RenderRule =
		separator === undefined
			? parts[0]!
			: ({ type: SEQ, nonterminal: true, members: [parts[0]!, separator.value, parts[1]!] } as unknown as RenderRule);
	return { ...(rule as object), separator: { ...(separator ?? {}), value } } as unknown as RenderRule;
}

export function spaceRenderRules(config: RenderRulesConfig): RenderRules {
	const rules = config.nodeMap.normalizedRules ?? {};
	const symbols = whitespaceSymbols(config.nodeMap);
	if (symbols === undefined) return { rules };
	const gaps = collectGaps(config, rules);
	const resolver = new DefaultResolver(config.defaults, config.nodeMap, gaps);
	const visit = (r: RenderRule): RenderRule => {
		const id = bag(r).id;
		const gap = id === undefined ? undefined : gaps.get(id);
		return gap === undefined ? r : withSpacedSeparator(r, gap, resolver, symbols);
	};
	const out: Record<string, RenderRule> = {};
	for (const [kind, rule] of Object.entries(rules)) out[kind] = visit(walker.map(rule, visit));
	return { rules: out };
}

export function spacingSitesOf(renderRules: RenderRules, nodeMap: NodeMap): RuleSpacingSite[] {
	const out = new Map<string, RuleSpacingSite>();
	for (const [kind, rule] of Object.entries(renderRules.rules)) {
		walker.fold(rule, undefined, (_, r) => {
			if (!isRepeated(r)) return undefined;
			const spaced = spacedSeparatorOf(r);
			const id = bag(r).id;
			if (spaced === undefined || id === undefined) return undefined;
			const slot = nodeMap.slotByRuleId.get(id)?.name;
			if (slot === undefined) throw new Error(`render rules: the spaced separator in '${kind}' belongs to no slot`);
			for (const part of [spaced.before, spaced.after]) {
				if (part === undefined) continue;
				const key = `${kind} ${slot} ${part.label}`;
				const prior = out.get(key);
				if (prior !== undefined && prior.defaultArm !== part.defaultArm) {
					throw new Error(`render rules: ${publicKindName(kind)}.${slot} resolves '${part.label}' to both ${prior.defaultArm} and ${part.defaultArm}`);
				}
				if (prior === undefined) out.set(key, { kind, slot, label: part.label, side: part.side, defaultArm: part.defaultArm });
			}
			return undefined;
		});
	}
	return [...out.values()];
}
