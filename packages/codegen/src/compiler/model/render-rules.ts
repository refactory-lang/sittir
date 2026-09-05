import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import type { RenderRule, Rule, RuleAnnotations, RuleId } from '../../types/rule.ts';
import { CHOICE, DEDENT, INDENT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { buildSupertypeMembersMap } from './supertype-members.ts';
import {
	EMPTY_SEPARATOR_TOKEN,
	FLANK_DEFAULT,
	FLANK_END_ARMS,
	FLANK_START_ARMS,
	SPACING_ARMS,
	SPACING_DEFAULT,
	flankAddress,
	isSpacingArm,
	isWhitespaceArm,
	siteKey,
	spacingLabel,
	type FlankSide,
	type RenderDefaults,
	type SiteDefault,
	type SpacingArm,
	type WhitespaceArm
} from '../../dsl/primitives/spacing.ts';

export type SpacingSide = 'before' | 'after' | 'gap' | FlankSide;

export interface SpacingPart {
	readonly fieldName: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: WhitespaceArm;
}

export interface Flanks {
	readonly start: SpacingPart;
	readonly inner: RenderRule;
	readonly end: SpacingPart;
}

export type WhitespaceText = { readonly text: string } | { readonly constant: 'INDENT_NEWLINE' | 'DEDENT_NEWLINE' };

export function whitespaceTextOf(
	visibleExternals: Readonly<Record<string, Rule<'evaluate'>>> | undefined
): ReadonlyMap<string, WhitespaceText> {
	const out = new Map<string, WhitespaceText>();
	for (const [name, rule] of Object.entries(visibleExternals ?? {})) {
		const kind = publicKindName(name);
		if (!isWhitespaceArm(kind)) continue;
		const r = rule as { type?: unknown; value?: unknown };
		if (r.type === STRING && typeof r.value === 'string') out.set(kind, { text: r.value });
		else if (r.type === INDENT) out.set(kind, { constant: 'INDENT_NEWLINE' });
		else if (r.type === DEDENT) out.set(kind, { constant: 'DEDENT_NEWLINE' });
	}
	return out;
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
	readonly whitespaceText?: ReadonlyMap<string, WhitespaceText>;
}

export interface RuleSpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: WhitespaceArm;
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

function flankedSlots(gaps: ReadonlyMap<RuleId, Gap>): Map<string, Gap> {
	const byKind = new Map<string, Gap[]>();
	for (const gap of gaps.values()) {
		if (gap.token !== undefined) continue;
		byKind.set(gap.kind, [...(byKind.get(gap.kind) ?? []), gap]);
	}
	const out = new Map<string, Gap>();
	for (const [kind, list] of byKind) {
		if (list.length > 1) {
			throw new Error(
				`render rules: '${publicKindName(kind)}' holds ${list.length} unseparated arrays (${list.map((g) => g.slot).join(', ')}); a flank address names one`
			);
		}
		out.set(kind, list[0]!);
	}
	return out;
}

class DefaultResolver {
	readonly #defaults: RenderDefaults;
	readonly #supertypesOf = new Map<string, string[]>();

	constructor(defaults: RenderDefaults | undefined, nodeMap: NodeMap, gaps: ReadonlyMap<RuleId, Gap>, flanked: ReadonlyMap<string, Gap>) {
		const given = defaults ?? { labels: {}, sites: {} };
		this.#defaults = {
			labels: given.labels,
			sites: Object.fromEntries(Object.entries(given.sites).map(([kind, value]) => [publicKindName(kind), value]))
		};
		for (const [supertype, members] of buildSupertypeMembersMap(nodeMap)) {
			for (const member of members) {
				const list = this.#supertypesOf.get(publicKindName(member)) ?? [];
				list.push(publicKindName(supertype));
				this.#supertypesOf.set(publicKindName(member), list);
			}
		}
		this.#validate(gaps, flanked);
	}

	#validate(gaps: ReadonlyMap<RuleId, Gap>, flanked: ReadonlyMap<string, Gap>): void {
		const labels = new Set<string>();
		const addresses = new Map<string, Set<string>>();
		const claim = (kind: string, address: string): void => {
			const set = addresses.get(kind) ?? new Set<string>();
			set.add(address);
			addresses.set(kind, set);
		};
		for (const gap of gaps.values()) {
			for (const { label } of labelsOf(gap)) {
				labels.add(label);
				claim(publicKindName(gap.kind), siteKey(gap.slot, label));
			}
		}
		for (const kind of flanked.keys()) {
			claim(publicKindName(kind), 'start');
			claim(publicKindName(kind), 'end');
		}
		const membersOf = new Map<string, string[]>();
		for (const [member, supertypes] of this.#supertypesOf) {
			for (const s of supertypes) membersOf.set(s, [...(membersOf.get(s) ?? []), member]);
		}
		for (const [key, arm] of Object.entries(this.#defaults.labels)) {
			if (!labels.has(key)) throw new Error(`defaults: '${key}' is not a separator spacing preference of this grammar`);
			if (!isSpacingArm(arm)) throw new Error(`defaults: '${key}' is '${arm}', not one of ${SPACING_ARMS.join(', ')}`);
		}
		for (const [key, value] of Object.entries(this.#defaults.sites)) {
			const kinds = addresses.has(key) ? [key] : (membersOf.get(key) ?? []).filter((m) => addresses.has(m));
			if (kinds.length === 0) throw new Error(`defaults: '${key}' names no kind or supertype with a separator or an array`);
			for (const [address, site] of Object.entries(value)) {
				if (!kinds.some((k) => addresses.get(k)!.has(address))) {
					throw new Error(`defaults: ${key}.${address} names no site`);
				}
				const isFlank = address === 'start' || address === 'end';
				if (isFlank ? !isWhitespaceArm(site.arm) : !isSpacingArm(site.arm)) {
					throw new Error(`defaults: ${key}.${address} is '${site.arm}', not one of ${(isFlank ? FLANK_START_ARMS : SPACING_ARMS).join(', ')}`);
				}
			}
		}
	}

	#site(kind: string, address: string): SiteDefault | undefined {
		const own = this.#defaults.sites[publicKindName(kind)]?.[address];
		if (own !== undefined) return own;
		const inherited = new Map<string, SiteDefault>();
		for (const supertype of this.#supertypesOf.get(publicKindName(kind)) ?? []) {
			const v = this.#defaults.sites[supertype]?.[address];
			if (v !== undefined) inherited.set(`${v.label ?? ''}=${v.arm}`, v);
		}
		if (inherited.size > 1) {
			throw new Error(`defaults: ${publicKindName(kind)}.${address} inherits ${[...inherited.keys()].join(' and ')} from different supertypes`);
		}
		return inherited.size === 1 ? [...inherited.values()][0] : undefined;
	}

	resolveSeparator(kind: string, slot: string, label: string): SpacingArm {
		const site = this.#site(kind, siteKey(slot, label));
		if (site !== undefined) return site.arm as SpacingArm;
		const top = this.#defaults.labels[label];
		return top === undefined ? SPACING_DEFAULT : (top as SpacingArm);
	}

	resolveFlank(kind: string, side: FlankSide): { readonly label: string; readonly arm: WhitespaceArm } {
		const site = this.#site(kind, side);
		const address = flankAddress(publicKindName(kind), side);
		return { label: site?.label ?? address, arm: (site?.arm as WhitespaceArm | undefined) ?? FLANK_DEFAULT };
	}
}

type Symbols = Partial<Record<WhitespaceArm, string>>;

function whitespaceSymbols(nodeMap: NodeMap, arms: readonly WhitespaceArm[]): Symbols | undefined {
	const out: Symbols = {};
	for (const arm of arms) {
		const name = nodeMap.nodes.has(arm) ? arm : nodeMap.nodes.has(`_${arm}`) ? `_${arm}` : undefined;
		if (name === undefined) return undefined;
		out[arm] = name;
	}
	return out;
}

function flankSymbols(config: RenderRulesConfig): Symbols | undefined {
	const text = config.whitespaceText;
	if (text === undefined || !text.has('indent') || !text.has('dedent')) return undefined;
	return whitespaceSymbols(config.nodeMap, [...FLANK_START_ARMS, ...FLANK_END_ARMS]);
}

function whitespaceChoice(part: SpacingPart, arms: readonly WhitespaceArm[], symbols: Symbols): RenderRule {
	return {
		type: CHOICE,
		nonterminal: true,
		fieldName: part.fieldName,
		members: arms.map((arm) => ({
			type: SYMBOL,
			name: symbols[arm]!,
			nonterminal: true,
			annotations: { preference: part.label, ...(arm === part.defaultArm ? { default: true as const } : {}) }
		}))
	} as unknown as RenderRule;
}

function isWhitespaceChoice(rule: RenderRule, arms: readonly WhitespaceArm[]): boolean {
	const r = bag(rule);
	return (
		r.type === CHOICE &&
		r.members !== undefined &&
		r.members.length === arms.length &&
		r.members.every((m, i) => {
			const b = bag(m);
			return b.type === SYMBOL && b.name !== undefined && publicKindName(b.name) === arms[i] && b.annotations?.preference !== undefined;
		})
	);
}

const isSpacingChoice = (rule: RenderRule): boolean => isWhitespaceChoice(rule, SPACING_ARMS);

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
		defaultArm: publicKindName(defaultMember.name) as WhitespaceArm
	};
}

export function flanksOf(rule: RenderRule): Flanks | undefined {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length !== 3 || r.id !== undefined) return undefined;
	const [start, inner, end] = r.members as [RenderRule, RenderRule, RenderRule];
	if (!isWhitespaceChoice(start, FLANK_START_ARMS) || !isWhitespaceChoice(end, FLANK_END_ARMS)) return undefined;
	return { start: partOf(start, 'start'), inner, end: partOf(end, 'end') };
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

function withFlanks(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols): RenderRule {
	const part = (side: FlankSide): RenderRule => {
		const { label, arm } = resolver.resolveFlank(gap.kind, side);
		return whitespaceChoice(
			{ fieldName: `${gap.slot}_${side}`, label, side, defaultArm: arm },
			side === 'start' ? FLANK_START_ARMS : FLANK_END_ARMS,
			symbols
		);
	};
	return { type: SEQ, nonterminal: true, members: [part('start'), rule, part('end')] } as unknown as RenderRule;
}

function withSpacedSeparator(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols): RenderRule {
	const parts = labelsOf(gap).map(({ label, side }) =>
		whitespaceChoice(
			{ fieldName: siteKey(gap.slot, label), label, side, defaultArm: resolver.resolveSeparator(gap.kind, gap.slot, label) },
			SPACING_ARMS,
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
	const symbols = whitespaceSymbols(config.nodeMap, SPACING_ARMS);
	if (symbols === undefined) return { rules };
	const gaps = collectGaps(config, rules);
	const flankSyms = flankSymbols(config);
	const flanked = flankSyms === undefined ? new Map<string, Gap>() : flankedSlots(gaps);
	const resolver = new DefaultResolver(config.defaults, config.nodeMap, gaps, flanked);
	const visit = (r: RenderRule): RenderRule => {
		const id = bag(r).id;
		const gap = id === undefined ? undefined : gaps.get(id);
		if (gap === undefined) return r;
		const spaced = withSpacedSeparator(r, gap, resolver, symbols);
		return flanked.get(gap.kind) === gap ? withFlanks(spaced, gap, resolver, flankSyms!) : spaced;
	};
	const out: Record<string, RenderRule> = {};
	for (const [kind, rule] of Object.entries(rules)) out[kind] = visit(walker.map(rule, visit));
	return { rules: out };
}

export function spacingSitesOf(renderRules: RenderRules, nodeMap: NodeMap): RuleSpacingSite[] {
	const out = new Map<string, RuleSpacingSite>();
	const add = (kind: string, slot: string, part: SpacingPart, address: string): void => {
		const key = `${kind} ${slot} ${part.label}`;
		const prior = out.get(key);
		if (prior !== undefined && prior.defaultArm !== part.defaultArm) {
			throw new Error(`render rules: ${publicKindName(kind)}.${slot} resolves '${part.label}' to both ${prior.defaultArm} and ${part.defaultArm}`);
		}
		if (prior === undefined) out.set(key, { kind, slot, address, label: part.label, side: part.side, defaultArm: part.defaultArm });
	};
	const slotOf = (kind: string, rule: RenderRule): string => {
		const id = bag(rule).id;
		const slot = id === undefined ? undefined : nodeMap.slotByRuleId.get(id)?.name;
		if (slot === undefined) throw new Error(`render rules: the spaced separator in '${kind}' belongs to no slot`);
		return slot;
	};
	for (const [kind, rule] of Object.entries(renderRules.rules)) {
		walker.fold(rule, undefined, (_, r) => {
			const flanks = flanksOf(r);
			if (flanks !== undefined) {
				const slot = slotOf(kind, flanks.inner);
				add(kind, slot, flanks.start, flankAddress(publicKindName(kind), 'start'));
				add(kind, slot, flanks.end, flankAddress(publicKindName(kind), 'end'));
				return undefined;
			}
			if (!isRepeated(r)) return undefined;
			const spaced = spacedSeparatorOf(r);
			if (spaced === undefined) return undefined;
			const slot = slotOf(kind, r);
			for (const part of [spaced.before, spaced.after]) {
				if (part !== undefined) add(kind, slot, part, siteKey(slot, part.label));
			}
			return undefined;
		});
	}
	return [...out.values()];
}
