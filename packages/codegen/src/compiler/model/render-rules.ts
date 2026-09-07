import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import type { RenderRule, Rule, RuleAnnotations, RuleId } from '../../types/rule.ts';
import { CHOICE, DEDENT, INDENT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { matchesWordShape } from '../../util/word-matcher.ts';
import { AbstractAssembledCompound } from './node-map.ts';
import { buildSupertypeMembersMap } from './supertype-members.ts';
import {
	EMPTY_SEPARATOR_TOKEN,
	FLANK_DEFAULT,
	SPACING_ARMS,
	SPACING_DEFAULT,
	WHITESPACE_ARMS,
	flankAddress,
	isDelimiterAddress,
	isDelimiterArm,
	isSeparatorAddress,
	isWhitespaceArm,
	parseSeamLabel,
	seamLabel,
	siteKey,
	spacingLabel,
	type FlankSide,
	type RenderDefaults,
	type SeparatorSide,
	type SiteDefault,
	type SpacingArm,
	type WhitespaceArm
} from '../../dsl/primitives/spacing.ts';

export type SpacingSide = 'before' | 'after' | 'gap' | 'seam' | FlankSide;

export interface SpacingPart {
	readonly fieldName: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: WhitespaceArm;
	readonly arms: readonly WhitespaceArm[];
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
	readonly arms: readonly WhitespaceArm[];
}

type Bag = {
	readonly type: string;
	readonly id?: RuleId;
	readonly name?: string;
	readonly value?: unknown;
	readonly fieldName?: string;
	readonly nonterminal?: boolean;
	readonly multiplicity?: string;
	readonly tokenized?: boolean;
	readonly immediate?: boolean;
	readonly literal?: string;
	readonly inline?: boolean;
	readonly staticSeamBefore?: 'glued' | 'spaced';
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
	if (r.separator !== undefined) return bag(r.separator.value).immediate === true;
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

function gapOf(kind: string, rule: RenderRule, kindEntries: readonly KindEntryLike[]): { readonly token?: string } | undefined {
	const sep = bag(rule).separator;
	if (sep === undefined) return {};
	const value = bag(sep.value);
	if (value.type === CHOICE && value.members !== undefined && value.members.every((m) => bag(m).type === STRING)) {
		return { token: publicKindName(kind) };
	}
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
			const gap = gapOf(kind, r, config.kindEntries);
			if (gap !== undefined) gaps.set(id, { kind, slot, id, ...gap });
			return undefined;
		});
	}
	return gaps;
}

function flankedSlots(gaps: ReadonlyMap<RuleId, Gap>): Map<string, Gap> {
	const byKind = new Map<string, Gap[]>();
	for (const gap of gaps.values()) byKind.set(gap.kind, [...(byKind.get(gap.kind) ?? []), gap]);
	const out = new Map<string, Gap>();
	for (const [kind, list] of byKind) {
		if (list.length === 1) out.set(kind, list[0]!);
	}
	return out;
}

class DefaultResolver {
	readonly #defaults: RenderDefaults;
	readonly #supertypesOf = new Map<string, string[]>();

	constructor(defaults: RenderDefaults | undefined, nodeMap: NodeMap) {
		const given = defaults ?? { labels: {}, sites: {} };
		checkDefaultArms(given);
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

	#resolve(kind: string, address: string, label: string, fallback: WhitespaceArm): WhitespaceArm {
		const site = this.#site(kind, address);
		if (site !== undefined) return site.arm as WhitespaceArm;
		const top = this.#defaults.labels[label];
		return top === undefined ? fallback : (top as WhitespaceArm);
	}

	resolveSeparator(kind: string, slot: string, label: string): SpacingArm {
		return this.#resolve(kind, siteKey(slot, label), label, SPACING_DEFAULT) as SpacingArm;
	}

	resolveSeam(kind: string, address: string, fallback: WhitespaceArm, arms: readonly WhitespaceArm[]): { readonly label: string; readonly arm: WhitespaceArm } {
		const label = this.#site(kind, address)?.label ?? address;
		const arm = this.#resolve(kind, address, label, fallback);
		if (!arms.includes(arm)) throw new Error(`defaults: '${address}' on ${publicKindName(kind)} is '${arm}', not one of ${arms.join(', ')}`);
		return { label, arm };
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
	return whitespaceSymbols(config.nodeMap, WHITESPACE_ARMS);
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
		defaultArm: publicKindName(defaultMember.name) as WhitespaceArm,
		arms: members.map((m) => publicKindName(m.name!) as WhitespaceArm)
	};
}

export function flanksOf(rule: RenderRule): Flanks | undefined {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length !== 3 || r.id !== undefined) return undefined;
	const [start, inner, end] = r.members as [RenderRule, RenderRule, RenderRule];
	if (!isWhitespaceChoice(start, WHITESPACE_ARMS) || !isWhitespaceChoice(end, WHITESPACE_ARMS)) return undefined;
	if (isSeamChoice(start) || isSeamChoice(end)) return undefined;
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
			{ fieldName: `${gap.slot}_${side}`, label, side, defaultArm: arm, arms: WHITESPACE_ARMS },
			WHITESPACE_ARMS,
			symbols
		);
	};
	return { type: SEQ, nonterminal: true, members: [part('start'), rule, part('end')] } as unknown as RenderRule;
}

function withSpacedSeparator(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols): RenderRule {
	const parts = labelsOf(gap).map(({ label, side }) =>
		whitespaceChoice(
			{ fieldName: siteKey(gap.slot, label), label, side, defaultArm: resolver.resolveSeparator(gap.kind, gap.slot, label), arms: SPACING_ARMS },
			SPACING_ARMS,
			symbols
		)
	);
	const separator = bag(rule).separator;
	const value: RenderRule =
		separator === undefined
			? parts[0]!
			: ({ type: SEQ, nonterminal: true, members: [parts[0]!, separator.value, parts[1]!] } as unknown as RenderRule);
	return { ...(rule as object), separator: { ...separator, value } } as unknown as RenderRule;
}

export function spaceRenderRules(config: RenderRulesConfig): RenderRules {
	const rules = config.nodeMap.normalizedRules ?? {};
	const symbols = whitespaceSymbols(config.nodeMap, SPACING_ARMS);
	if (symbols === undefined) return { rules };
	const gaps = collectGaps(config, rules);
	const flankSyms = flankSymbols(config);
	const flanked = flankSyms === undefined ? new Map<string, Gap>() : flankedSlots(gaps);
	const resolver = new DefaultResolver(config.defaults, config.nodeMap);
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

export function validateRenderDefaults(defaults: RenderDefaults | undefined, sites: readonly RuleSpacingSite[], nodeMap: NodeMap): void {
	if (defaults === undefined) return;
	const labels = new Set<string>();
	const addresses = new Map<string, Set<string>>();
	for (const site of sites) {
		const kind = publicKindName(site.kind);
		const isFlank = site.side === 'start' || site.side === 'end';
		if (!isFlank) labels.add(site.label);
		const set = addresses.get(kind) ?? new Set<string>();
		set.add(isFlank ? site.side : site.address);
		addresses.set(kind, set);
	}
	const membersOf = new Map<string, string[]>();
	for (const [supertype, members] of buildSupertypeMembersMap(nodeMap)) {
		membersOf.set(publicKindName(supertype), members.map(publicKindName));
	}
	for (const key of Object.keys(defaults.labels)) {
		if (!labels.has(key)) throw new Error(`defaults: '${key}' is not a spacing preference of this grammar`);
	}
	for (const [key, value] of Object.entries(defaults.sites)) {
		const kind = publicKindName(key);
		const kinds = addresses.has(kind) ? [kind] : (membersOf.get(kind) ?? []).filter((m) => addresses.has(m));
		if (kinds.length === 0) throw new Error(`defaults: '${key}' names no kind or supertype with a spacing site`);
		for (const address of Object.keys(value)) {
			if (isDelimiterAddress(address) || isSeparatorAddress(address)) continue;
			if (!kinds.some((k) => addresses.get(k)!.has(address))) throw new Error(`defaults: ${key}.${address} names no site`);
		}
	}
}

function checkDefaultArms(defaults: RenderDefaults): void {
	for (const [key, arm] of Object.entries(defaults.labels)) {
		if (!isWhitespaceArm(arm)) throw new Error(`defaults: '${key}' is '${arm}', not one of ${WHITESPACE_ARMS.join(', ')}`);
	}
	for (const [key, value] of Object.entries(defaults.sites)) {
		for (const [address, site] of Object.entries(value)) {
			if (isDelimiterAddress(address)) {
				if (!isDelimiterArm(site.arm)) throw new Error(`defaults: ${key}.${address} is '${site.arm}', not a Delimiter member`);
				continue;
			}
			if (isSeparatorAddress(address)) continue;
			if (!isWhitespaceArm(site.arm)) throw new Error(`defaults: ${key}.${address} is '${site.arm}', not one of ${WHITESPACE_ARMS.join(', ')}`);
		}
	}
}

export function admitsDepth(site: { readonly arms: readonly string[] }): boolean {
	return site.arms.includes('indent') || site.arms.includes('dedent');
}

export function siteAt(site: RuleSpacingSite): string {
	const kind = publicKindName(site.kind);
	return site.side === 'start' || site.side === 'end' ? `${kind}.${site.slot}_${site.side}` : `${kind}.${site.address}`;
}

export function validateIndentDepth(sites: readonly RuleSpacingSite[]): void {
	const depth = new Map<string, number>();
	for (const site of sites) {
		const kind = publicKindName(site.kind);
		const current = depth.get(kind) ?? 0;
		if (site.defaultArm === 'indent') depth.set(kind, current + 1);
		if (site.defaultArm === 'dedent') {
			if (current === 0) throw new Error(`defaults: ${siteAt(site)} dedents an indent it never opened; indent and dedent are a pair on one kind`);
			depth.set(kind, current - 1);
		}
	}
	for (const [kind, open] of depth) {
		if (open > 0) throw new Error(`defaults: ${kind} opens an indent it never dedents; indent and dedent are a pair on one kind`);
	}
}

function isAnyWhitespaceChoice(rule: RenderRule): boolean {
	return isSpacingChoice(rule) || isWhitespaceChoice(rule, WHITESPACE_ARMS);
}

export function isSeamChoice(rule: RenderRule): boolean {
	if (!isAnyWhitespaceChoice(rule)) return false;
	const label = bag(bag(rule).members![0]!).annotations?.preference;
	return label !== undefined && parseSeamLabel(label) !== undefined;
}

export function seamPartOf(rule: RenderRule): SpacingPart {
	return partOf(rule, 'seam');
}

function literalTextOf(rule: RenderRule): string | undefined {
	const r = bag(rule);
	if (r.type === STRING) {
		if (r.multiplicity === 'optional' || (r.nonterminal === true && r.fieldName !== undefined)) return undefined;
		return typeof r.value === 'string' ? r.value : undefined;
	}
	if (r.type === SYMBOL && r.literal !== undefined && r.fieldName === undefined) return r.literal;
	return undefined;
}

function literalTokenOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const text = literalTextOf(rule);
	if (text === undefined || text.trim() === '') return undefined;
	const entry = findEntryForLiteralText(config.kindEntries, text);
	return entry === undefined ? undefined : publicKindName(entry.kind);
}

function literalLeafText(rule: RenderRule): string | undefined {
	const r = bag(rule);
	if (r.type === STRING) return r.multiplicity === 'optional' || typeof r.value !== 'string' ? undefined : r.value;
	if (r.type === SYMBOL) return r.literal;
	return undefined;
}

function literalLeaves(rule: RenderRule, fields: Set<string | undefined>, texts: string[], inherited: string | undefined): boolean {
	const r = bag(rule);
	const field = r.fieldName ?? inherited;
	if (r.type === CHOICE) return r.members !== undefined && r.members.length > 0 && r.members.every((m) => literalLeaves(m, fields, texts, field));
	const text = literalLeafText(rule);
	if (text === undefined) return false;
	fields.add(field);
	texts.push(text);
	return true;
}

function literalSlotOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	if (r.type === STRING && r.nonterminal !== true) return undefined;
	if (r.type !== CHOICE && (r.fieldName === undefined || literalLeafText(rule) === undefined)) return undefined;
	const fields = new Set<string | undefined>();
	const texts: string[] = [];
	if (!literalLeaves(rule, fields, texts, undefined) || fields.size !== 1) return undefined;
	if (!texts.some((text) => text.trim() !== '' && !matchesWordShape(text, config.nodeMap.wordMatcher))) return undefined;
	const [field] = fields;
	return field === undefined ? undefined : field.toLowerCase();
}

function seamNameOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	return literalTokenOf(rule, config) ?? literalSlotOf(rule, config);
}

function inlinedRuleNames(rules: Readonly<Record<string, RenderRule>>): ReadonlySet<string> {
	const out = new Set<string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, undefined, (_, r) => {
			const b = bag(r);
			if (b.type === SYMBOL && b.inline === true && b.name !== undefined) out.add(b.name);
			return undefined;
		});
	}
	return out;
}

interface SeamArms {
	readonly arms: readonly WhitespaceArm[];
	readonly symbols: Symbols;
}

function seamChoice(kind: string, address: string, fallback: WhitespaceArm, resolver: DefaultResolver, seams: SeamArms): RenderRule {
	const { label, arm } = resolver.resolveSeam(kind, address, fallback, seams.arms);
	return whitespaceChoice({ fieldName: address, label, side: 'seam', defaultArm: arm, arms: seams.arms }, seams.arms, seams.symbols);
}

function edgeMember(rule: RenderRule, side: 'first' | 'last'): RenderRule | undefined {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length === 0 || flanksOf(rule) !== undefined) return undefined;
	return side === 'first' ? r.members[0] : r.members[r.members.length - 1];
}

function withEdgeSeam(group: RenderRule, seam: RenderRule, side: 'first' | 'last'): RenderRule {
	const members = bag(group).members!;
	return { ...(group as object), members: side === 'first' ? [seam, ...members] : [...members, seam] } as unknown as RenderRule;
}

function withTokenSeams(rule: RenderRule, kind: string, config: RenderRulesConfig, resolver: DefaultResolver, seams: SeamArms): RenderRule {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length < 2 || flanksOf(rule) !== undefined) return rule;
	const members: RenderRule[] = [r.members[0]!];
	let changed = false;
	for (let i = 1; i < r.members.length; i++) {
		const left = members[members.length - 1]!;
		let right = r.members[i]!;
		if (!isAnyWhitespaceChoice(left) && !isAnyWhitespaceChoice(right)) {
			const fallback: SpacingArm = bag(right).staticSeamBefore === 'spaced' ? 'space' : 'tight';
			const leftEdge = edgeMember(left, 'last');
			const rightEdge = edgeMember(right, 'first');
			const leftToken = seamNameOf(leftEdge ?? left, config);
			const rightToken = seamNameOf(rightEdge ?? right, config);
			if (leftToken !== undefined && !(leftEdge !== undefined && isAnyWhitespaceChoice(leftEdge))) {
				const seam = seamChoice(kind, seamLabel(leftToken, 'after'), fallback, resolver, seams);
				if (leftEdge === undefined) members.push(seam);
				else members[members.length - 1] = withEdgeSeam(left, seam, 'last');
				changed = true;
			}
			if (rightToken !== undefined && !(rightEdge !== undefined && isAnyWhitespaceChoice(rightEdge))) {
				const seam = seamChoice(kind, seamLabel(rightToken, 'before'), fallback, resolver, seams);
				if (rightEdge === undefined) members.push(seam);
				else right = withEdgeSeam(right, seam, 'first');
				changed = true;
			}
		}
		members.push(right);
	}
	return changed ? ({ ...(rule as object), members } as unknown as RenderRule) : rule;
}

function ownsKindEdges(kind: string, nodeMap: NodeMap): boolean {
	if (!(nodeMap.nodes.get(kind) instanceof AbstractAssembledCompound)) return false;
	return kind === publicKindName(kind) || !nodeMap.nodes.has(publicKindName(kind));
}

function withKindEdges(rule: RenderRule, kind: string, resolver: DefaultResolver, seams: SeamArms): RenderRule {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined) return rule;
	const part = (side: SeparatorSide): RenderRule => seamChoice(kind, seamLabel(publicKindName(kind), side), 'tight', resolver, seams);
	if (flanksOf(rule) !== undefined) return { type: SEQ, nonterminal: true, members: [part('before'), rule, part('after')] } as unknown as RenderRule;
	return { ...(rule as object), members: [part('before'), ...r.members, part('after')] } as unknown as RenderRule;
}

export function seamRenderRules(spaced: RenderRules, config: RenderRulesConfig): RenderRules {
	const symbols = whitespaceSymbols(config.nodeMap, SPACING_ARMS);
	if (symbols === undefined) return spaced;
	const resolver = new DefaultResolver(config.defaults, config.nodeMap);
	const inlined = inlinedRuleNames(spaced.rules);
	const flankSyms = flankSymbols(config);
	const seams: SeamArms = flankSyms === undefined ? { arms: SPACING_ARMS, symbols } : { arms: WHITESPACE_ARMS, symbols: flankSyms };
	const out: Record<string, RenderRule> = {};
	for (const [kind, rule] of Object.entries(spaced.rules)) {
		if (inlined.has(kind)) {
			out[kind] = rule;
			continue;
		}
		const visit = (r: RenderRule): RenderRule => withTokenSeams(r, kind, config, resolver, seams);
		const seamed = visit(walker.map(rule, visit));
		out[kind] = ownsKindEdges(kind, config.nodeMap) ? withKindEdges(seamed, kind, resolver, seams) : seamed;
	}
	const result: RenderRules = { rules: out };
	const sites = spacingSitesOf(result, config.nodeMap);
	validateRenderDefaults(config.defaults, sites, config.nodeMap);
	validateIndentDepth(sites);
	return result;
}

export function spacingSitesOf(renderRules: RenderRules, nodeMap: NodeMap): RuleSpacingSite[] {
	const out = new Map<string, RuleSpacingSite>();
	const add = (kind: string, slot: string, part: SpacingPart, address: string): void => {
		const key = `${kind} ${part.fieldName}`;
		const prior = out.get(key);
		if (prior !== undefined && prior.defaultArm !== part.defaultArm) {
			throw new Error(`render rules: ${publicKindName(kind)}.${slot} resolves '${part.label}' to both ${prior.defaultArm} and ${part.defaultArm}`);
		}
		if (prior === undefined) out.set(key, { kind, slot, address, label: part.label, side: part.side, defaultArm: part.defaultArm, arms: part.arms });
	};
	const slotOf = (kind: string, rule: RenderRule): string => {
		const id = bag(rule).id;
		const slot = id === undefined ? undefined : nodeMap.slotByRuleId.get(id)?.name;
		if (slot === undefined) throw new Error(`render rules: the spaced separator in '${kind}' belongs to no slot`);
		return slot;
	};
	const visit = (kind: string, r: RenderRule): void => {
		const flanks = flanksOf(r);
		if (flanks !== undefined) {
			const slot = slotOf(kind, flanks.inner);
			add(kind, slot, flanks.start, flankAddress(publicKindName(kind), 'start'));
			visit(kind, flanks.inner);
			add(kind, slot, flanks.end, flankAddress(publicKindName(kind), 'end'));
			return;
		}
		const b = bag(r);
		for (const m of b.members ?? []) {
			if (!isSeamChoice(m)) {
				visit(kind, m);
				continue;
			}
			const part = seamPartOf(m);
			add(kind, parseSeamLabel(part.fieldName)!.token, part, part.fieldName);
		}
		if (b.content !== undefined) visit(kind, b.content);
		const spaced = isRepeated(r) ? spacedSeparatorOf(r) : undefined;
		if (spaced === undefined) return;
		const slot = slotOf(kind, r);
		for (const part of [spaced.before, spaced.after]) {
			if (part !== undefined) add(kind, slot, part, siteKey(slot, part.label));
		}
	};
	for (const [kind, rule] of Object.entries(renderRules.rules)) visit(kind, rule);
	return [...out.values()];
}
