import { ruleListParts } from '../../dsl/rule-patterns.ts';
import { ownRuleIds } from '../../dsl/rule-attrs.ts';
import { admitsWhitespaceMember, SPACE_MEMBER } from '../../dsl/whitespace.ts';
import { emitShapeFailure } from '../diagnostics/emit-diagnostics.ts';
import type { NodeMap } from '../types.ts';
import { findAnonEntryForLiteralText, findEntryForLiteralText, modelKindOfEntry, type KindEntryLike } from '../../dsl/symbol-table.ts';
import { aliasTargetOf, type RenderRule, type Rule, type RuleAnnotations, type RuleId, type SeamOrigin } from '../../types/rule.ts';
import { ALIAS, CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { matchesWordShape } from '../../util/word-matcher.ts';
import { type AssembledNode, AbstractAssembledCompound, AssembledLexedPattern, AssembledEnum, AssembledKeyword, AssembledPolymorph, concreteKindsOf, isFixedTextLeaf, isVisiblePunctuationLeaf, layoutNodeOf, literalLeafText, admitsOnlyTight, startsImmediateWhenPresent, leftmostTerminalImmediate } from './node-map.ts';
import { slotElementKinds } from '../../emitters/node-common.ts';
import { supertypeMembersByDisplayName } from './supertype-members.ts';
import { lineTerminatedKinds, triviaKinds } from './trivia.ts';
import { addressSites, resolveLabels, type PreferenceOrigin } from './site-addresses.ts';
import type { PreferenceSegment } from '../../dsl/primitives/preference-path.ts';
import { readOptionsBlock, type OptionsConfig } from '../../dsl/wire/options-block.ts';
import { defaultWhitespaceKindOf, lineBreakingKinds, rootEdgeKinds, whitespaceKindsOf, layoutKindsOf, layoutSymbolsOf } from './layout-kinds.ts';
import { displayNameOf, displayNameOfEntry, displayedKinds } from './display-name.ts';
import {
	EMPTY_SEPARATOR_TOKEN,
	siteKey,
	spacingLabelOf,
	type Whitespace,
	type Layout
} from '../../dsl/primitives/spacing.ts';
import type { FlankSide, SeamAddress, SeparatorSide, SpacingAddress } from '../../types/spacing.ts';

export interface SpacingPart {
	readonly fieldName: string;
	readonly spacing: SpacingAddress;
	readonly defaultArm: Layout;
	readonly origin?: SeamOrigin;
	readonly edgeLiterals?: readonly string[];
	readonly arms: readonly Layout[];
}

export interface Flanks {
	readonly start: SpacingPart;
	readonly inner: RenderRule;
	readonly end: SpacingPart;
}

export function whitespaceTextOf(
	renderAs: Readonly<Record<string, Rule<'evaluate'>>> | undefined,
	nodeMap: NodeMap
): ReadonlyMap<string, string> {
	const out = new Map<string, string>();
	for (const [arm, symbol] of layoutSymbolsOf(nodeMap)) {
		const r = renderAs?.[symbol] as { type?: unknown; value?: unknown } | undefined;
		if (r?.type === STRING && typeof r.value === 'string') out.set(arm, r.value);
	}
	return out;
}

export interface SpacedSeparator {
	readonly before?: SpacingPart;
	readonly token?: RenderRule;
	readonly after?: SpacingPart;
}

export interface EdgeArmDefault {
	readonly arm: Layout;
	readonly origin: SeamOrigin;
	readonly kindId?: number;
}

export interface RenderRules {
	readonly rules: Readonly<Record<string, RenderRule>>;
	readonly declared?: ReadonlyMap<string, DeclaredArm>;
	readonly edgeArms?: ReadonlyMap<string, EdgeArmDefault>;
	readonly unitEdges?: ReadonlyMap<string, SpacingPart>;
	readonly noExtrasLists?: ReadonlySet<RuleId>;
	readonly rootFlankOnly?: ReadonlySet<SeparatorSide>;
}

export interface RenderRulesConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly (KindEntryLike & { readonly id: number })[];
	readonly options?: OptionsConfig;
	readonly whitespaceText?: ReadonlyMap<string, string>;
	readonly normalizedRules?: Record<string, RenderRule>;
	readonly choiceArmNodes?: ReadonlySet<RenderRule>;
	readonly noExtrasLists?: ReadonlySet<RuleId>;
	readonly tight?: ReadonlySet<RuleId>;
	readonly tightAfter?: ReadonlyMap<RuleId, ReadonlySet<RuleId>>;
}

function isTightAfter(left: RenderRule, right: RenderRule, config: RenderRulesConfig): boolean {
	if (config.tightAfter === undefined) return false;
	const lefts = new Set(ownRuleIds(left));
	return ownRuleIds(right).some((id) => [...(config.tightAfter!.get(id) ?? [])].some((member) => lefts.has(member)));
}

function isImmediateRight(rule: RenderRule | undefined, config: RenderRulesConfig): boolean {
	if (rule === undefined) return false;
	return leftmostTerminalImmediate(rule, { rules: config.normalizedRules ?? {}, visiting: new Set(), ...(config.tight === undefined ? {} : { tight: config.tight }) });
}

function isImmediateArm(choice: RenderRule, arm: RenderRule, config: RenderRulesConfig): boolean {
	return isImmediateRight(choice, config) || isImmediateRight(arm, config);
}

function isImmediateWhenPresent(rule: RenderRule, config: RenderRulesConfig): boolean {
	return startsImmediateWhenPresent(rule, { rules: config.normalizedRules ?? {}, visiting: new Set(), ...(config.tight === undefined ? {} : { tight: config.tight }) });
}

export interface SeatedChild {
	readonly kind: string;
	readonly display: string;
}

export interface RuleSpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly spacing: SpacingAddress;
	readonly defaultArm: Layout;
	readonly arms: readonly Layout[];
	readonly origin?: SeamOrigin;
	readonly seat?: SeatedChild;
	readonly path?: readonly PreferenceSegment[];
	readonly edgeLiterals?: readonly string[];
	readonly edgeArm?: EdgeArm;
	readonly kindEdge?: true;
	readonly padding?: true;
}

export interface EdgeArm {
	readonly kindId?: number;
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
	readonly aliasedTo?: string;
	readonly inline?: boolean;
	readonly staticSeamBefore?: 'glued' | 'spaced';
	readonly inAbsentBranch?: true;
	readonly members?: readonly RenderRule[];
	readonly subtypes?: readonly RenderRule[];
	readonly content?: RenderRule;
	readonly separator?: { readonly value: RenderRule };
	readonly annotations?: RuleAnnotations;
};

const bag = (rule: RenderRule): Bag => rule as unknown as Bag;

function isRepeated(rule: RenderRule): boolean {
	const m = bag(rule).multiplicity;
	return m === 'array' || m === 'nonEmptyArray';
}

function admitsNoExtras(
	rule: RenderRule,
	rules: Readonly<Record<string, RenderRule>>,
	externals: ReadonlySet<string>,
	plainTokens: boolean,
	tight: ReadonlySet<RuleId> | undefined
): boolean {
	const r = bag(rule);
	if (admitsOnlyTight(r, { tight })) return true;
	if (r.tokenized === true) return plainTokens;
	if (r.separator !== undefined) return admitsOnlyTight(bag(r.separator.value), { tight });
	if (r.type === SYMBOL && r.name !== undefined) return isLexicalSymbol(r.name, rules, externals, new Set(), plainTokens);
	if (r.members !== undefined) return r.members.some((m) => admitsNoExtras(m, rules, externals, plainTokens, tight));
	if (r.content !== undefined) return admitsNoExtras(r.content, rules, externals, plainTokens, tight);
	return false;
}

function isLexicalSymbol(name: string, rules: Readonly<Record<string, RenderRule>>, externals: ReadonlySet<string>, seen: ReadonlySet<string>, plainTokens: boolean): boolean {
	if (externals.has(name)) return true;
	const target = rules[name];
	return target !== undefined && !seen.has(name) && isLexicalRule(target, rules, externals, new Set([...seen, name]), plainTokens);
}

function isLexicalRule(rule: RenderRule, rules: Readonly<Record<string, RenderRule>>, externals: ReadonlySet<string>, seen: ReadonlySet<string>, plainTokens: boolean): boolean {
	const r = bag(rule);
	if (r.immediate === true) return true;
	if (r.tokenized === true) return plainTokens;
	if (r.type === SYMBOL && r.name !== undefined) return isLexicalSymbol(r.name, rules, externals, seen, plainTokens);
	const parts = r.members ?? r.subtypes;
	if (parts !== undefined) return parts.length > 0 && parts.every((m) => isLexicalRule(m, rules, externals, seen, plainTokens));
	if (r.content !== undefined) return isLexicalRule(r.content, rules, externals, seen, plainTokens);
	return false;
}

interface Gap {
	readonly kind: string;
	readonly slot: string;
	readonly id: RuleId;
	readonly token?: string;
}

function gapOf(kind: string, rule: RenderRule, config: RenderRulesConfig): { readonly token?: string } | undefined {
	const sep = bag(rule).separator;
	if (sep === undefined) return {};
	const value = bag(sep.value);
	if (value.type === CHOICE && value.members !== undefined && value.members.every((m) => bag(m).type === STRING || bag(m).type === SYMBOL || bag(m).type === ALIAS)) {
		return { token: displayNameOf(kind, config.nodeMap) };
	}
	if (value.type !== STRING || typeof value.value !== 'string' || value.value === '') return undefined;
	const entry = findEntryForLiteralText(config.kindEntries, value.value);
	if (entry === undefined) throw new Error(`separator token '${value.value}' has no kind in the catalog`);
	return { token: displayNameOfEntry(entry, config.kindEntries) };
}

function gapAddressesOf(gap: { readonly token?: string }): readonly SpacingAddress[] {
	return gap.token === undefined
		? [{ at: 'separator', token: EMPTY_SEPARATOR_TOKEN }]
		: [
				{ at: 'separator', token: gap.token, side: 'before' },
				{ at: 'separator', token: gap.token, side: 'after' }
			];
}

const walker = new RuleWalker<RenderRule>();

function collectGaps(
	config: RenderRulesConfig,
	rules: Readonly<Record<string, RenderRule>>
): { readonly gaps: ReadonlyMap<RuleId, Gap>; readonly noExtrasLists: ReadonlySet<RuleId> } {
	const externals = new Set(ruleListParts(config.nodeMap.externals ?? []).names);
	const gaps = new Map<RuleId, Gap>();
	const noExtrasLists = new Set<RuleId>();
	const spaceIsExtra = admitsWhitespaceMember(config.nodeMap.nodelessExtrasRun, SPACE_MEMBER, ' ');
	for (const [kind, rule] of Object.entries(rules)) {
		walker.fold(rule, undefined, (_, r) => {
			const id = bag(r).id;
			if (id === undefined || !isRepeated(r) || gaps.has(id)) return undefined;
			const slot = config.nodeMap.slotByRuleId.get(kind)?.get(id);
			if (slot === undefined) return undefined;
			if (admitsNoExtras(r, rules, externals, true, config.tight)) {
				if (bag(r).tokenized === true || !spaceIsExtra || admitsNoExtras(r, rules, externals, false, config.tight)) for (const listed of [id, ...slot.sourceRuleIds]) noExtrasLists.add(listed);
				return undefined;
			}
			const gap = gapOf(kind, r, config);
			if (gap !== undefined) gaps.set(id, { kind, slot: slot.name, id, ...gap });
			return undefined;
		});
	}
	return { gaps, noExtrasLists };
}

function holdsNoExtrasList(rule: RenderRule, side: 'first' | 'last', lists: ReadonlySet<RuleId> | undefined): boolean {
	const r = bag(rule);
	if (isRepeated(rule)) return r.id !== undefined && lists?.has(r.id) === true;
	if (r.content !== undefined) return holdsNoExtrasList(r.content, side, lists);
	if (r.members === undefined || r.members.length === 0) return false;
	if (r.type === CHOICE) return r.members.some((member) => holdsNoExtrasList(member, side, lists));
	return r.type === SEQ && holdsNoExtrasList(r.members[side === 'first' ? 0 : r.members.length - 1]!, side, lists);
}

function edgeChoicesOf(rule: RenderRule, side: 'first' | 'last'): readonly RenderRule[] {
	const r = bag(rule);
	if (isRepeated(rule)) return [];
	if (r.content !== undefined) return edgeChoicesOf(r.content, side);
	if (r.members === undefined || r.members.length === 0) return [];
	if (r.type === CHOICE) return [rule, ...r.members.flatMap((member) => edgeChoicesOf(member, side))];
	return r.type === SEQ ? edgeChoicesOf(r.members[side === 'first' ? 0 : r.members.length - 1]!, side) : [];
}

export function mixedSeamChoices({ rules, noExtrasLists }: RenderRules): readonly { readonly kind: string; readonly side: SeparatorSide }[] {
	const mixes = (rule: RenderRule, side: 'first' | 'last'): boolean =>
		edgeChoicesOf(rule, side).some((choice) => {
			const arms = bag(choice).members!.map((arm) => holdsNoExtrasList(arm, side, noExtrasLists));
			return arms.includes(true) && arms.includes(false);
		});
	const found = new Map<string, { readonly kind: string; readonly side: SeparatorSide }>();
	for (const [kind, rule] of Object.entries(rules)) {
		walker.fold(rule, undefined, (_, r) => {
			const { type, members } = bag(r);
			if (type !== SEQ || members === undefined || flanksOf(r) !== undefined) return undefined;
			for (let i = 1; i < members.length; i++) {
				const [left, right] = [members[i - 1]!, members[i]!];
				if (isAnyWhitespaceChoice(left) || isAnyWhitespaceChoice(right)) continue;
				if (mixes(right, 'first')) found.set(`${kind} before`, { kind, side: 'before' });
				if (mixes(left, 'last')) found.set(`${kind} after`, { kind, side: 'after' });
			}
			return undefined;
		});
	}
	return [...found.values()];
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

export interface DeclaredArm {
	readonly arm: string;
	readonly origin: PreferenceOrigin;
}

class DefaultResolver {
	readonly #nodeMap: NodeMap;
	readonly #declared: ReadonlyMap<string, DeclaredArm>;
	readonly #defaultArm: Layout;

	constructor(nodeMap: NodeMap, declared?: ReadonlyMap<string, DeclaredArm>) {
		this.#nodeMap = nodeMap;
		this.#declared = declared ?? new Map();
		this.#defaultArm = defaultWhitespaceKindOf(nodeMap);
	}

	#resolve(kind: string, address: string): { readonly arm: Layout; readonly origin: SeamOrigin } {
		const hit = this.#declared.get(declaredKey(kind, address));
		return hit === undefined ? { arm: this.#defaultArm, origin: 'fallback' } : { arm: hit.arm as Layout, origin: hit.origin };
	}

	resolveSeparator(kind: string, slot: string, address: SpacingAddress): Whitespace {
		return this.#resolve(kind, siteKey(slot, address)).arm;
	}

	resolveSeam(
		kind: string,
		address: SeamAddress,
		seams: Pick<SeamArms, 'arms' | 'defaultArm'>,
		wordShaped: boolean = false
	): { readonly arm: Layout; readonly origin: SeamOrigin } {
		const { arms } = seams;
		const label = spacingLabelOf(address);
		const declared = this.#resolve(kind, label);
		const resolved = declared.origin === 'fallback' && seams.defaultArm !== undefined ? { ...declared, arm: seams.defaultArm } : declared;
		const { arm, origin } = wordShaped && resolved.origin === 'fallback' ? { arm: resolved.arm, origin: 'word-default' as const } : resolved;
		if (!arms.includes(arm)) throw emitShapeFailure({ code: 'option-arm-invalid', message: `options: '${label}' on ${displayNameOf(kind, this.#nodeMap)} is '${arm}', not one of ${arms.join(', ')}` });
		return { arm, origin };
	}

	resolveFlank(kind: string, side: FlankSide): { readonly spacing: SpacingAddress; readonly arm: Layout } {
		const spacing: SpacingAddress = { at: 'flank', kind: displayNameOf(kind, this.#nodeMap), side };
		return { spacing, arm: this.#resolve(kind, spacingLabelOf(spacing)).arm };
	}
}

type Symbols = Partial<Record<Layout, string>>;

function whitespaceSymbols(nodeMap: NodeMap, arms: readonly Layout[]): Symbols | undefined {
	if (arms.length === 0) return undefined;
	const symbolOf = layoutSymbolsOf(nodeMap);
	const out: Symbols = {};
	for (const arm of arms) {
		const name = symbolOf.get(arm);
		if (name === undefined) return undefined;
		out[arm] = name;
	}
	return out;
}

function flankSymbols(config: RenderRulesConfig): Symbols | undefined {
	const text = config.whitespaceText;
	if (text === undefined || !text.has('indent') || !text.has('dedent')) return undefined;
	return whitespaceSymbols(config.nodeMap, layoutKindsOf(config.nodeMap));
}

function whitespaceChoice(part: SpacingPart, arms: readonly Layout[], symbols: Symbols): RenderRule {
	return {
		type: CHOICE,
		nonterminal: true,
		fieldName: part.fieldName,
		...(part.edgeLiterals === undefined ? {} : { annotations: { edgeLiterals: part.edgeLiterals } }),
		members: arms.map((arm) => ({
			type: SYMBOL,
			name: symbols[arm]!,
			nonterminal: true,
			annotations: {
				spacing: part.spacing,
				arm,
				...(arm === part.defaultArm ? { default: true as const, ...(part.origin === undefined ? {} : { origin: part.origin }) } : {})
			}
		}))
	} as unknown as RenderRule;
}

export function isWhitespaceChoice(rule: RenderRule): boolean {
	const r = bag(rule);
	return (
		r.type === CHOICE &&
		r.members !== undefined &&
		r.members.length > 0 &&
		r.members.every((m) => {
			const b = bag(m);
			return b.type === SYMBOL && b.name !== undefined && b.annotations?.spacing !== undefined;
		})
	);
}

const isSpacingChoice = isWhitespaceChoice;

function armOf(member: Bag): Layout {
	const arm = member.annotations?.arm;
	if (arm === undefined) throw new Error(`render rules: whitespace choice member '${member.name}' carries no arm`);
	return arm as Layout;
}

function partOf(choice: RenderRule): SpacingPart {
	const r = bag(choice);
	const members = r.members!.map(bag);
	const defaultMember = members.find((m) => m.annotations?.default === true);
	if (r.fieldName === undefined || defaultMember?.name === undefined) {
		throw new Error('render rules: a spacing choice names its field and marks its default arm');
	}
	const edgeLiterals = r.annotations?.edgeLiterals;
	return {
		fieldName: r.fieldName,
		spacing: members[0]!.annotations!.spacing!,
		defaultArm: armOf(defaultMember),
		...(defaultMember.annotations?.origin === 'word-default' ? { origin: defaultMember.annotations.origin } : {}),
		...(edgeLiterals === undefined ? {} : { edgeLiterals }),
		arms: members.map(armOf)
	};
}

export function flanksOf(rule: RenderRule): Flanks | undefined {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length !== 3 || r.id !== undefined) return undefined;
	const [start, inner, end] = r.members as [RenderRule, RenderRule, RenderRule];
	if (!isWhitespaceChoice(start) || !isWhitespaceChoice(end)) return undefined;
	const [head, tail] = [partOf(start), partOf(end)];
	if (head.spacing.at !== 'flank' || tail.spacing.at !== 'flank') return undefined;
	return { start: head, inner, end: tail };
}

export function spacedSeparatorOf(rule: RenderRule): SpacedSeparator | undefined {
	const sep = bag(rule).separator?.value;
	if (sep === undefined) return undefined;
	if (isSpacingChoice(sep)) return { after: partOf(sep) };
	const s = bag(sep);
	if (s.type !== SEQ || s.members === undefined || s.members.length !== 3) return undefined;
	const [before, token, after] = s.members as [RenderRule, RenderRule, RenderRule];
	if (!isSpacingChoice(before) || !isSpacingChoice(after)) return undefined;
	return { before: partOf(before), token, after: partOf(after) };
}

function withFlanks(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols, arms: readonly Layout[]): RenderRule {
	const part = (side: FlankSide): RenderRule => {
		const { spacing, arm } = resolver.resolveFlank(gap.kind, side);
		return whitespaceChoice({ fieldName: `${gap.slot}_${side}`, spacing, defaultArm: arm, arms }, arms, symbols);
	};
	return { type: SEQ, nonterminal: true, members: [part('start'), rule, part('end')] } as unknown as RenderRule;
}

function withSpacedSeparator(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols, arms: readonly Whitespace[]): RenderRule {
	const parts = gapAddressesOf(gap).map((spacing) =>
		whitespaceChoice({ fieldName: siteKey(gap.slot, spacing), spacing, defaultArm: resolver.resolveSeparator(gap.kind, gap.slot, spacing), arms }, arms, symbols)
	);
	const separator = bag(rule).separator;
	const value: RenderRule =
		separator === undefined
			? parts[0]!
			: ({ type: SEQ, nonterminal: true, members: [parts[0]!, separator.value, parts[1]!] } as unknown as RenderRule);
	return { ...(rule as object), separator: { ...separator, value } } as unknown as RenderRule;
}

export function spaceRenderRules(config: RenderRulesConfig, declared?: ReadonlyMap<string, DeclaredArm>): RenderRules {
	const rules = config.nodeMap.normalizedRules ?? {};
	const whitespaceKinds = whitespaceKindsOf(config.nodeMap);
	const symbols = whitespaceSymbols(config.nodeMap, whitespaceKinds);
	if (symbols === undefined) return { rules };
	const { gaps, noExtrasLists } = collectGaps(config, rules);
	const flankSyms = flankSymbols(config);
	const flanked = flankSyms === undefined ? new Map<string, Gap>() : flankedSlots(gaps);
	const resolver = new DefaultResolver(config.nodeMap, declared);
	const visit = (r: RenderRule): RenderRule => {
		const id = bag(r).id;
		const gap = id === undefined ? undefined : gaps.get(id);
		if (gap === undefined) return r;
		const spaced = withSpacedSeparator(r, gap, resolver, symbols, whitespaceKinds);
		return flanked.get(gap.kind) === gap ? withFlanks(spaced, gap, resolver, flankSyms!, layoutKindsOf(config.nodeMap)) : spaced;
	};
	const out: Record<string, RenderRule> = {};
	for (const [kind, rule] of Object.entries(rules)) out[kind] = visit(walker.map(rule, visit));
	return { rules: out, noExtrasLists };
}

export function admitsDepth(site: { readonly arms: readonly string[] }): boolean {
	return site.arms.includes('indent') || site.arms.includes('dedent');
}

export function siteAt(site: RuleSpacingSite, nodeMap: NodeMap): string {
	const kind = displayNameOf(site.kind, nodeMap);
	return site.spacing.at === 'flank' ? `${kind}.${site.slot}_${site.spacing.side}` : `${kind}.${site.address}`;
}

export function validateIndentDepth(sites: readonly RuleSpacingSite[], nodeMap: NodeMap): void {
	const depth = new Map<string, number>();
	for (const site of sites) {
		const kind = displayNameOf(site.kind, nodeMap);
		const current = depth.get(kind) ?? 0;
		if (site.defaultArm === 'indent') depth.set(kind, current + 1);
		if (site.defaultArm === 'dedent') {
			if (current === 0) throw emitShapeFailure({ code: 'indent-dedent-unpaired', message: `defaults: ${siteAt(site, nodeMap)} dedents an indent it never opened; indent and dedent are a pair on one kind` });
			depth.set(kind, current - 1);
		}
	}
	for (const [kind, open] of depth) {
		if (open > 0) throw emitShapeFailure({ code: 'indent-dedent-unpaired', message: `defaults: ${kind} opens an indent it never dedents; indent and dedent are a pair on one kind` });
	}
}

function isAnyWhitespaceChoice(rule: RenderRule): boolean {
	return isWhitespaceChoice(rule);
}

export function isSeamChoice(rule: RenderRule): boolean {
	return isAnyWhitespaceChoice(rule) && bag(bag(rule).members![0]!).annotations?.spacing?.at === 'seam';
}

export function seamChoiceDefault(
	rule: RenderRule
): { readonly label: string; readonly origin: SeamOrigin | undefined; readonly arm: Layout } | undefined {
	const spacing = bag(bag(rule).members![0]!).annotations?.spacing;
	if (spacing === undefined) return undefined;
	const label = spacingLabelOf(spacing);
	for (const member of bag(rule).members ?? []) {
		const m = bag(member);
		if (m.annotations?.default === true) return { label, origin: m.annotations.origin, arm: armOf(m) };
	}
	return undefined;
}

export function seamPartOf(rule: RenderRule): SpacingPart & { readonly spacing: SeamAddress } {
	const part = partOf(rule);
	if (part.spacing.at !== 'seam') throw new Error(`render rules: '${part.fieldName}' is not a seam choice`);
	return { ...part, spacing: part.spacing };
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

function tokenEntryOfText<T extends KindEntryLike>(text: string, kindEntries: readonly T[]): T | undefined {
	return text.trim() === '' ? undefined : findEntryForLiteralText(kindEntries, text);
}

function tokenNameOfEntry(entry: KindEntryLike | undefined, kindEntries: readonly KindEntryLike[]): string | undefined {
	return entry === undefined ? undefined : displayNameOfEntry(entry, kindEntries);
}

export function tokenNameOfText(text: string, kindEntries: readonly KindEntryLike[]): string | undefined {
	return tokenNameOfEntry(tokenEntryOfText(text, kindEntries), kindEntries);
}

function isDisplayedLiteral(rule: RenderRule): boolean {
	if (rule.type === SYMBOL) return rule.literal !== undefined && aliasTargetOf(rule) !== undefined;
	return rule.type === STRING && bag(rule).aliasedTo !== undefined;
}
function literalTokenEntryOf(rule: RenderRule, config: RenderRulesConfig): RenderRulesConfig['kindEntries'][number] | undefined {
	if (isDisplayedLiteral(rule)) return undefined;
	const text = literalTextOf(rule);
	return text === undefined ? undefined : tokenEntryOfText(text, config.kindEntries);
}
function literalTokenOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	return tokenNameOfEntry(literalTokenEntryOf(rule, config), config.kindEntries);
}

export function slotPunctuationTokenOfNode(
	node: AssembledNode | undefined,
	kindEntries: readonly KindEntryLike[],
	wordMatcher: RegExp | undefined
): string | undefined {
	return punctuationTokenOfNode(node, kindEntries) ?? (node !== undefined && isFixedTextLeaf(node) && !matchesWordShape(node.text, wordMatcher) ? tokenNameOfText(node.text, kindEntries) : undefined);
}
function punctuationEntryOfNode<T extends KindEntryLike>(node: AssembledNode | undefined, kindEntries: readonly T[]): T | undefined {
	return node !== undefined && isVisiblePunctuationLeaf(node) ? tokenEntryOfText(node.text, kindEntries) : undefined;
}
export function punctuationTokenOfNode(node: AssembledNode | undefined, kindEntries: readonly KindEntryLike[]): string | undefined {
	return tokenNameOfEntry(punctuationEntryOfNode(node, kindEntries), kindEntries);
}

function punctuationReferenceEntryOf(rule: RenderRule, config: RenderRulesConfig): RenderRulesConfig['kindEntries'][number] | undefined {
	if (isDisplayedLiteral(rule)) return undefined;
	const r = bag(rule);
	return r.type === SYMBOL && r.name !== undefined ? punctuationEntryOfNode(config.nodeMap.nodes.get(r.name), config.kindEntries) : undefined;
}
function punctuationReferenceTokenOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	return tokenNameOfEntry(punctuationReferenceEntryOf(rule, config), config.kindEntries);
}

export function keywordKindOfLiteral(text: string, nodeMap: NodeMap, kindEntries: readonly KindEntryLike[]): string | undefined {
	const entry = findEntryForLiteralText(kindEntries, text);
	if (entry === undefined) return undefined;
	const kind = modelKindOfEntry(entry, kindEntries);
	return nodeMap.nodes.get(kind) instanceof AssembledKeyword ? kind : undefined;
}

function isKeywordText(text: string, config: RenderRulesConfig): boolean {
	return keywordKindOfLiteral(text, config.nodeMap, config.kindEntries) !== undefined;
}

function isKeywordSeam(rule: RenderRule, config: RenderRulesConfig): boolean {
	const text = literalTextOf(rule);
	if (text !== undefined) return isKeywordText(text, config);
	const r = bag(rule);
	const target = r.type === SYMBOL && r.name !== undefined ? config.nodeMap.nodes.get(r.name) : undefined;
	if (target instanceof AssembledKeyword) return r.fieldName !== undefined;
	if (target instanceof AssembledEnum) return target.values.length > 0 && target.values.every((value) => isKeywordText(value, config));
	const texts: string[] = [];
	return literalLeaves(rule, new Set(), texts, undefined) && texts.every((leaf) => leaf.trim() === '' || isKeywordText(leaf, config));
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

function isOptionalRule(rule: RenderRule): boolean {
	const r = bag(rule);
	return r.multiplicity === 'optional' || (r.type === CHOICE && (r.members ?? []).some(isOptionalRule));
}

function literalSlotOf(rule: RenderRule, kind: string, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	if (r.type === STRING && r.nonterminal !== true) return undefined;
	if (r.type !== CHOICE && (r.fieldName === undefined || literalLeafText(rule) === undefined)) return undefined;
	const fields = new Set<string | undefined>();
	const texts: string[] = [];
	if (!literalLeaves(rule, fields, texts, undefined) || fields.size !== 1) return undefined;
	if (!texts.some((text) => text.trim() !== '')) return undefined;
	const punctuated = texts.some((text) => text.trim() !== '' && !matchesWordShape(text, config.nodeMap.wordMatcher));
	if (!punctuated && isOptionalRule(rule)) return undefined;
	if (r.id !== undefined && config.nodeMap.slotByRuleId.get(kind)?.get(r.id)?.registeredOption === 'choice') {
		const spellings = new Set(texts.filter((text) => text.trim() !== ''));
		return spellings.size === 1 ? tokenNameOfText([...spellings][0]!, config.kindEntries) : undefined;
	}
	const [field] = fields;
	return field;
}

function enumSlotOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	if (r.type !== SYMBOL || r.fieldName === undefined || r.name === undefined) return undefined;
	const target = config.nodeMap.nodes.get(r.name);
	if (!(target instanceof AssembledEnum)) return undefined;
	const values = target.values;
	if (values.length === 0 || values.some((v) => !matchesWordShape(v, config.nodeMap.wordMatcher))) return undefined;
	return r.fieldName;
}

function choiceArmNodesOf(rule: RenderRule): Set<RenderRule> {
	const out = new Set<RenderRule>();
	walker.fold(rule, undefined, (_, node) => {
		if (bag(node).type !== CHOICE) return undefined;
		for (const arm of bag(node).members ?? []) {
			out.add(arm);
			walker.fold(arm, undefined, (__, inner) => {
				out.add(inner);
				return undefined;
			});
		}
		return undefined;
	});
	return out;
}

function keywordSlotOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	if (r.type !== SYMBOL || r.fieldName === undefined || r.name === undefined || config.choiceArmNodes?.has(rule) === true) return undefined;
	const target = config.nodeMap.nodes.get(r.name);
	return target instanceof AssembledKeyword ? r.fieldName : undefined;
}

function seamNameOf(rule: RenderRule, kind: string, config: RenderRulesConfig): string | undefined {
	if (isDisplayedLiteral(rule)) return undefined;
	return literalTokenOf(rule, config) ?? punctuationReferenceTokenOf(rule, config) ?? literalSlotOf(rule, kind, config) ?? enumSlotOf(rule, config) ?? keywordSlotOf(rule, config);
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
	readonly arms: readonly Layout[];
	readonly symbols: Symbols;
	readonly defaultArm?: Layout;
}

function seamChoice(
	kind: string,
	address: SeamAddress,
	resolver: DefaultResolver,
	seams: SeamArms,
	edgeLiterals?: readonly string[],
	wordShaped: boolean = false
): RenderRule {
	const { arm, origin } = resolver.resolveSeam(kind, address, seams, wordShaped);
	return whitespaceChoice(
		{ fieldName: spacingLabelOf(address), spacing: address, defaultArm: arm, origin, ...(edgeLiterals === undefined ? {} : { edgeLiterals }), arms: seams.arms },
		seams.arms,
		seams.symbols
	);
}

interface EdgeToken {
	readonly token: string;
	readonly kindId: number;
	readonly literalText?: string;
	readonly member: RenderRule;
}

function edgeTokensOf(
	rule: RenderRule,
	side: 'first' | 'last',
	config: RenderRulesConfig
): readonly EdgeToken[] | undefined {
	const edge = edgeMember(rule, side);
	if (edge === undefined) return undefined;
	const entryOf = (member: RenderRule): RenderRulesConfig['kindEntries'][number] | undefined => {
		const own = literalTokenEntryOf(member, config) ?? punctuationReferenceEntryOf(member, config);
		if (own !== undefined || bag(member).type !== SEQ) return own;
		const bare = (bag(member).members ?? []).filter((m) => !isAnyWhitespaceChoice(m));
		return bare.length === 1 ? entryOf(bare[0]!) : undefined;
	};
	const tokenOf = (member: RenderRule): EdgeToken | undefined => {
		const entry = entryOf(member);
		return entry === undefined ? undefined : { token: displayNameOfEntry(entry, config.kindEntries), kindId: entry.id, literalText: entry.literalText, member };
	};
	const single = tokenOf(edge);
	if (single !== undefined) return [single];
	const r = bag(edge);
	if (r.type !== CHOICE || r.members === undefined || r.members.length === 0) return undefined;
	const tokens = r.members.map(tokenOf);
	return tokens.every((t) => t !== undefined) ? (tokens as EdgeToken[]) : undefined;
}

function edgeLiteralsOf(rule: RenderRule, side: 'first' | 'last', config: RenderRulesConfig): readonly string[] | undefined {
	const tokens = edgeTokensOf(rule, side, config);
	return tokens === undefined ? undefined : [...new Set(tokens.map((t) => t.token))];
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

function withArmEdgeSeams(
	choice: RenderRule,
	side: 'first' | 'last',
	kind: string,
	config: RenderRulesConfig,
	resolver: DefaultResolver,
	seams: SeamArms
): RenderRule | undefined {
	const c = bag(choice);
	if (c.type !== CHOICE || c.members === undefined || isAnyWhitespaceChoice(choice)) return undefined;
	let changed = false;
	const members = c.members.map((arm) => {
		const nested = withArmEdgeSeams(arm, side, kind, config, resolver, seams);
		if (nested !== undefined) {
			changed = true;
			return nested;
		}
		const edge = edgeMember(arm, side) ?? arm;
		if (isAnyWhitespaceChoice(edge)) return arm;
		if (side === 'first' && isImmediateArm(choice, edge, config)) return arm;
		const token = literalTokenOf(edge, config) ?? punctuationReferenceTokenOf(edge, config);
		if (token === undefined) return arm;
		const seam = seamChoice(kind, { at: 'seam', token, side: side === 'last' ? 'after' : 'before' }, resolver, seams, undefined, isKeywordSeam(edge, config));
		changed = true;
		if (edgeMember(arm, side) === undefined) {
			return { type: SEQ, nonterminal: true, members: side === 'last' ? [arm, seam] : [seam, arm] } as unknown as RenderRule;
		}
		return withEdgeSeam(arm, seam, side);
	});
	return changed ? ({ ...(choice as object), members } as unknown as RenderRule) : undefined;
}

export function hasArmEdgeSeams(rule: RenderRule, side: 'first' | 'last'): boolean {
	const r = bag(rule);
	if (r.type !== CHOICE || r.members === undefined || isAnyWhitespaceChoice(rule)) return false;
	return r.members.some((arm) => {
		const edge = edgeMember(arm, side);
		return (edge !== undefined && isSeamChoice(edge)) || hasArmEdgeSeams(arm, side);
	});
}

function admitsNoSeam(left: RenderRule, right: RenderRule, config: RenderRulesConfig): boolean {
	return isImmediateWhenPresent(right, config) || holdsNoExtrasList(left, 'last', config.noExtrasLists) || holdsNoExtrasList(right, 'first', config.noExtrasLists);
}

function gluedBefore(rule: RenderRule): RenderRule {
	return { ...(rule as object), staticSeamBefore: 'glued' } as unknown as RenderRule;
}

function withTokenSeams(rule: RenderRule, kind: string, config: RenderRulesConfig, resolver: DefaultResolver, seams: SeamArms): RenderRule {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length < 2 || flanksOf(rule) !== undefined) return rule;
	const members: RenderRule[] = [r.members[0]!];
	let changed = false;
	for (let i = 1; i < r.members.length; i++) {
		const left = members[members.length - 1]!;
		let right = r.members[i]!;
		if (isTightAfter(r.members[i - 1]!, right, config)) {
			const multiplicity = bag(left).multiplicity;
			if (multiplicity === 'optional') {
				const rightEdge = edgeMember(right, 'first');
				const rightToken = seamNameOf(rightEdge ?? right, kind, config);
				if (rightToken !== undefined) {
					const seam = seamChoice(kind, { at: 'seam', token: rightToken, side: 'before' }, resolver, seams, undefined, isKeywordSeam(rightEdge ?? right, config));
					members.push({ ...(seam as object), inAbsentBranch: true } as unknown as RenderRule);
					changed = true;
				}
			} else if (multiplicity !== undefined)
				throw emitShapeFailure({
					code: 'tight-boundary-shape',
					message: `render rules: ${kind}: the boundary after ${bag(left).id ?? 'a member'} is tight, but a ${multiplicity} member has no absent branch to hold the next token's seam`
				});
			else right = gluedBefore(right);
			members.push(right);
			changed = true;
			continue;
		}
		if (!isAnyWhitespaceChoice(left) && !isAnyWhitespaceChoice(right) && admitsNoSeam(r.members[i - 1]!, r.members[i]!, config)) {
			right = gluedBefore(right);
			changed = true;
		} else if (!isAnyWhitespaceChoice(left) && !isAnyWhitespaceChoice(right)) {
			const leftArms =
				seamNameOf(left, kind, config) === undefined ? withArmEdgeSeams(left, 'last', kind, config, resolver, seams) : undefined;
			if (leftArms !== undefined) {
				members[members.length - 1] = leftArms;
				changed = true;
			}
			const rightArms =
				seamNameOf(right, kind, config) === undefined ? withArmEdgeSeams(right, 'first', kind, config, resolver, seams) : undefined;
			if (rightArms !== undefined) {
				right = rightArms;
				changed = true;
			}
			const leftNow = members[members.length - 1]!;
			const leftEdge = edgeMember(leftNow, 'last');
			const rightEdge = edgeMember(right, 'first');
			const leftToken = seamNameOf(leftEdge ?? leftNow, kind, config);
			const rightToken = seamNameOf(rightEdge ?? right, kind, config);
			if (leftToken !== undefined && !(leftEdge !== undefined && isAnyWhitespaceChoice(leftEdge))) {
				const seam = seamChoice(kind, { at: 'seam', token: leftToken, side: 'after' }, resolver, seams, undefined, isKeywordSeam(leftEdge ?? leftNow, config));
				if (leftEdge === undefined) members.push(seam);
				else members[members.length - 1] = withEdgeSeam(leftNow, seam, 'last');
				changed = true;
			}
			if (rightToken !== undefined && !(rightEdge !== undefined && isAnyWhitespaceChoice(rightEdge))) {
				const seam = seamChoice(kind, { at: 'seam', token: rightToken, side: 'before' }, resolver, seams, undefined, isKeywordSeam(rightEdge ?? right, config));
				if (rightEdge === undefined) members.push(seam);
				else right = withEdgeSeam(right, seam, 'first');
				changed = true;
			}
		}
		members.push(right);
	}
	return changed ? ({ ...(rule as object), members } as unknown as RenderRule) : rule;
}

function armSeamName(rule: RenderRule, config: RenderRulesConfig, includeWords: boolean): string | undefined {
	if (isDisplayedLiteral(rule)) return undefined;
	const text = literalTextOf(rule);
	if (text === undefined || text.trim() === '' || (!includeWords && matchesWordShape(text, config.nodeMap.wordMatcher))) return undefined;
	return anonTokenNameOfText(text, config.kindEntries);
}

export function anonTokenNameOfText(text: string, kindEntries: readonly KindEntryLike[]): string | undefined {
	const entry = findAnonEntryForLiteralText(kindEntries, text);
	return entry === undefined ? undefined : displayNameOfEntry(entry, kindEntries);
}

function withArmSeams(rule: RenderRule, kind: string, config: RenderRulesConfig, resolver: DefaultResolver, seams: SeamArms): RenderRule {
	const r = bag(rule);
	if (r.type !== CHOICE || r.members === undefined || r.members.length === 0) return rule;
	const punctuation = r.members.map((m) => armSeamName(m, config, false));
	if (punctuation.every((name) => name === undefined)) return rule;
	const names = r.members.map((m, i) => punctuation[i] ?? armSeamName(m, config, true));
	const members = r.members.map((member, i) => {
		const name = names[i];
		if (name === undefined) return member;
		const wordShaped = isKeywordSeam(member, config);
		const seam = (side: SeparatorSide): RenderRule => seamChoice(kind, { at: 'seam', token: name, side }, resolver, seams, undefined, wordShaped);
		const before = isImmediateArm(rule, member, config) ? [] : [seam('before')];
		return { type: SEQ, nonterminal: true, members: [...before, member, seam('after')] } as unknown as RenderRule;
	});
	return { ...(rule as object), members } as unknown as RenderRule;
}

function isLexedKind(kind: string, nodeMap: NodeMap): boolean {
	return nodeMap.nodes.get(kind) instanceof AssembledLexedPattern;
}

function ownsKindEdges(kind: string, nodeMap: NodeMap): boolean {
	const node = nodeMap.nodes.get(kind);
	if (!(node instanceof AbstractAssembledCompound) || layoutNodeOf(node) !== node || isLexedKind(kind, nodeMap)) return false;
	const display = displayNameOf(kind, nodeMap);
	return kind === display || !nodeMap.nodes.has(display);
}

function edgeSeamArms(kind: string, side: SeparatorSide, config: RenderRulesConfig, seams: SeamArms): SeamArms {
	if (config.nodeMap.nodes.get(kind)?.grammarRoot === true) return { ...seams, defaultArm: rootEdgeKinds(config.nodeMap)[side] };
	if (side !== 'after' || !lineTerminatedKinds(config.nodeMap).has(kind)) return seams;
	const breaking = lineBreakingKinds(config.nodeMap);
	return { ...seams, arms: seams.arms.filter((arm) => breaking.arms.includes(arm)), defaultArm: breaking.defaultArm };
}

function kindEdgeSeam(rule: RenderRule, kind: string, side: SeparatorSide, config: RenderRulesConfig, resolver: DefaultResolver, seams: SeamArms): RenderRule {
	return seamChoice(
		kind,
		{ at: 'seam', token: displayNameOf(kind, config.nodeMap), side },
		resolver,
		edgeSeamArms(kind, side, config, seams),
		edgeLiteralsOf(rule, side === 'before' ? 'first' : 'last', config)
	);
}

export interface TightKindEdges {
	readonly before: ReadonlyMap<string, ReadonlySet<string>>;
	readonly after: ReadonlyMap<string, ReadonlySet<string>>;
}

export function tightKindEdgesOf(rules: Readonly<Record<string, RenderRule>>, config: RenderRulesConfig): TightKindEdges {
	const { nodeMap } = config;
	const owns = (kind: string): boolean => ownsKindEdges(kind, nodeMap) || nodeMap.nodes.get(kind)?.grammarRoot === true;
	const nullable = (rule: RenderRule, seen: ReadonlySet<string>): boolean => {
		const r = bag(rule);
		if (r.multiplicity === 'optional' || r.multiplicity === 'array') return true;
		if (r.type === SYMBOL && r.name !== undefined)
			return !owns(r.name) && rules[r.name] !== undefined && !seen.has(r.name) && nullable(rules[r.name]!, new Set([...seen, r.name]));
		if (r.type === SEQ) return (r.members ?? []).every((member) => nullable(member, seen));
		if (r.type === CHOICE) return (r.members ?? []).some((member) => nullable(member, seen));
		return r.content !== undefined && nullable(r.content, seen);
	};
	const ends = (rule: RenderRule, side: 'first' | 'last', seen: ReadonlySet<string>): Set<string> => {
		const r = bag(rule);
		if (r.type === SYMBOL && r.name !== undefined) {
			if (owns(r.name)) return new Set([r.name]);
			const target = rules[r.name];
			return target === undefined || seen.has(r.name) ? new Set() : ends(target, side, new Set([...seen, r.name]));
		}
		if (r.type === CHOICE) return new Set((r.members ?? []).flatMap((member) => [...ends(member, side, seen)]));
		if (r.type === SEQ) {
			const members = side === 'first' ? (r.members ?? []) : [...(r.members ?? [])].reverse();
			const out = new Set<string>();
			for (const member of members) {
				for (const kind of ends(member, side, seen)) out.add(kind);
				if (!nullable(member, seen)) break;
			}
			return out;
		}
		return r.content === undefined ? new Set() : ends(r.content, side, seen);
	};
	const before = new Map<string, Set<string>>();
	const after = new Map<string, Set<string>>();
	const note = (map: Map<string, Set<string>>, kinds: Iterable<string>, positions: Iterable<string>): boolean => {
		let grew = false;
		for (const kind of kinds) {
			let tight = map.get(kind);
			if (tight === undefined) map.set(kind, (tight = new Set()));
			for (const position of positions) {
				if (tight.has(position)) continue;
				tight.add(position);
				grew = true;
			}
		}
		return grew;
	};
	const none = new Set<string>();
	for (const [kind, rule] of Object.entries(rules)) {
		walker.fold(rule, undefined, (_, node) => {
			const r = bag(node);
			if (r.type === SEQ && r.members !== undefined) {
				r.members.forEach((left, i) => {
					for (let j = i + 1; j < r.members!.length; j++) {
						const right = r.members![j]!;
						if (admitsNoSeam(left, right, config) || isTightAfter(left, right, config)) {
							const position = [`${kind}:${bag(right).id ?? `member ${j}`}`];
							note(after, ends(left, 'last', none), position);
							note(before, ends(right, 'first', none), position);
						}
						if (!nullable(right, none)) break;
					}
				});
			}
			if (isRepeated(node) && r.id !== undefined && config.noExtrasLists?.has(r.id) === true) {
				const iteration = [`${kind}:${r.id} repeated`];
				note(after, ends(node, 'last', none), iteration);
				note(before, ends(node, 'first', none), iteration);
			}
			return undefined;
		});
	}
	for (let changed = true; changed; ) {
		changed = false;
		for (const [kind, rule] of Object.entries(rules))
			for (const [map, side] of [[before, 'first'], [after, 'last']] as const) {
				const own = map.get(kind);
				if (own === undefined) continue;
				const inner = [...ends(rule, side, new Set([kind]))].filter((name) => name !== kind);
				if (note(map, inner, [...own])) changed = true;
			}
	}
	return { before, after };
}

function withKindEdges(
	rule: RenderRule,
	kind: string,
	config: RenderRulesConfig,
	resolver: DefaultResolver,
	seams: SeamArms,
	edgeArms: Map<string, EdgeArmDefault>,
	tightEdges: TightKindEdges
): RenderRule {
	const r = bag(rule);
	const root = config.nodeMap.nodes.get(kind)?.grammarRoot === true;
	if (!root && (r.type !== SEQ || r.members === undefined)) return rule;
	const seamsOf = (side: SeparatorSide): SeamArms => edgeSeamArms(kind, side, config, seams);
	const part = (side: SeparatorSide): RenderRule => kindEdgeSeam(rule, kind, side, config, resolver, seams);
	const recordArms = (side: SeparatorSide): void => {
		if (r.type !== SEQ || r.members === undefined || flanksOf(rule) !== undefined) return;
		const beside = side === 'before' ? r.members[0] : r.members[r.members.length - 1];
		const slot = beside === undefined || bag(beside).multiplicity !== undefined ? undefined : bag(beside).id;
		if (slot === undefined || !config.nodeMap.slotByRuleId.get(kind)?.has(slot)) return;
		const first = new Map<string, EdgeToken>();
		for (const edgeToken of edgeTokensOf(rule, side === 'before' ? 'first' : 'last', config) ?? []) if (!first.has(edgeToken.token)) first.set(edgeToken.token, edgeToken);
		if (first.size < 2) return;
		for (const { token, kindId, literalText } of first.values()) {
			const address: SeamAddress = { at: 'seam', token, side };
			const { arm, origin } = resolver.resolveSeam(kind, address, seamsOf(side), literalText !== undefined && isKeywordText(literalText, config));
			edgeArms.set(edgeArmKey(kind, spacingLabelOf(address)), { arm, origin, kindId });
		}
	};
	const tight = tightEdgeSides(rule, kind, config, tightEdges);
	const dropsBefore = !root && tight.has('before');
	const dropsAfter = !root && tight.has('after');
	if (!dropsBefore) recordArms('before');
	if (!dropsAfter) recordArms('after');
	const before = dropsBefore ? [] : [part('before')];
	const after = dropsAfter ? [] : [part('after')];
	if (flanksOf(rule) !== undefined || r.type !== SEQ || r.members === undefined)
		return { type: SEQ, nonterminal: true, members: [...before, rule, ...after] } as unknown as RenderRule;
	return {
		...(rule as object),
		members: [...before, ...r.members, ...after]
	} as unknown as RenderRule;
}

function tightEdgeSides(rule: RenderRule, kind: string, config: RenderRulesConfig, tightEdges: TightKindEdges): Set<SeparatorSide> {
	const sides = new Set<SeparatorSide>();
	if (isImmediateRight(rule, config) || tightEdges.before.has(kind)) sides.add('before');
	if (tightEdges.after.has(kind)) sides.add('after');
	return sides;
}

export function seamRenderRules(
	spaced: RenderRules,
	config: RenderRulesConfig,
	declared?: ReadonlyMap<string, DeclaredArm>
): RenderRules {
	const whitespaceKinds = whitespaceKindsOf(config.nodeMap);
	const symbols = whitespaceSymbols(config.nodeMap, whitespaceKinds);
	if (symbols === undefined) return spaced;
	const inlined = inlinedRuleNames(spaced.rules);
	const flankSyms = flankSymbols(config);
	const seams: SeamArms = flankSyms === undefined ? { arms: whitespaceKinds, symbols } : { arms: layoutKindsOf(config.nodeMap), symbols: flankSyms };
	const noExtrasLists = spaced.noExtrasLists ?? new Set<RuleId>();
	const immediateConfig: RenderRulesConfig = { ...config, normalizedRules: spaced.rules, noExtrasLists };
	const tokenInterior = (kind: string): boolean => config.nodeMap.nodes.get(kind)?.triviaInterior === true;
	const tightEdges = tightKindEdgesOf(spaced.rules, immediateConfig);
	const build = (): RenderRules => {
		const resolver = new DefaultResolver(config.nodeMap, declared);
		const out: Record<string, RenderRule> = {};
		const edgeArms = new Map<string, EdgeArmDefault>();
		const seatedUnits = seatedUnitKinds(spaced.rules, config.nodeMap, (kind) => config.nodeMap.nodes.get(kind)?.grammarRoot === true || ownsKindEdges(kind, config.nodeMap));
		const unitEdges = new Map<string, SpacingPart>();
		let rootFlankOnly: ReadonlySet<SeparatorSide> = new Set();
		for (const [kind, rule] of Object.entries(spaced.rules)) {
			if (inlined.has(kind)) {
				out[kind] = rule;
				continue;
			}
			if (config.nodeMap.nodes.get(kind) instanceof AssembledEnum) {
				out[kind] = withArmSeams(rule, kind, immediateConfig, resolver, seams);
				continue;
			}
			const kindConfig: RenderRulesConfig = { ...immediateConfig, choiceArmNodes: choiceArmNodesOf(rule) };
			const visit = (r: RenderRule): RenderRule => withTokenSeams(r, kind, kindConfig, resolver, seams);
			const seamed = isLexedKind(kind, config.nodeMap) || tokenInterior(kind) ? rule : visit(walker.map(rule, visit));
			const insideTrivia = tokenInterior(kind) && !triviaKinds(config.nodeMap).has(kind);
			const grammarRoot = config.nodeMap.nodes.get(kind)?.grammarRoot === true;
			if (grammarRoot) rootFlankOnly = tightEdgeSides(seamed, kind, immediateConfig, tightEdges);
			if (seatedUnits.has(kind) && !tightEdges.after.has(kind)) unitEdges.set(kind, seamPartOf(kindEdgeSeam(seamed, kind, 'after', immediateConfig, resolver, seams)));
			out[kind] = (ownsKindEdges(kind, config.nodeMap) || grammarRoot) && !insideTrivia ? withKindEdges(seamed, kind, immediateConfig, resolver, seams, edgeArms, tightEdges) : seamed;
		}
		return { rules: out, edgeArms, unitEdges, noExtrasLists, rootFlankOnly };
	};
	const result = build();
	const sites = spacingSitesOf(result, config.nodeMap);
	validateIndentDepth(sites, config.nodeMap);
	return result;
}

export function resolveRenderRules(
	config: RenderRulesConfig,
	stamp: (spaced: RenderRules) => void
): { spaced: RenderRules; seamed: RenderRules } {
	const spaced = spaceRenderRules(config);
	stamp(spaced);
	const seamed = seamRenderRules(spaced, config);
	if (config.options === undefined) return { spaced, seamed };
	const declared = declaredOptionArms(config, spacingSitesOf(seamed, config.nodeMap));
	if (declared === undefined) return { spaced, seamed };
	const respaced = spaceRenderRules(config, declared);
	stamp(respaced);
	return { spaced: respaced, seamed: { ...seamRenderRules(respaced, config, declared), declared } };
}

function edgeArmKey(kind: string, address: string): string {
	return `${kind} ${address}`;
}

function declaredKey(kind: string, address: string): string {
	return `${kind}\u0000${address}`;
}

export function declaredOptionArms(
	config: RenderRulesConfig,
	sites: readonly RuleSpacingSite[]
): ReadonlyMap<string, DeclaredArm> | undefined {
	const block: OptionsConfig | undefined = config.options;
	if (block === undefined) return undefined;
	const kinds = displayedKinds(config.nodeMap);
	const { declarations, labels } = readOptionsBlock(block, kinds);
	if (declarations.length === 0) return undefined;
	const addressed = addressSites(sites, config.kindEntries, config.nodeMap);
	const arms = new Map<string, DeclaredArm>();
	for (const [index, { arm, origin }] of resolveLabels(declarations, labels, addressed, supertypeMembersByDisplayName(config.nodeMap), false)) {
		const site = addressed[index]!;
		arms.set(declaredKey(site.kind, site.address), { arm, origin });
	}
	return arms;
}

export function spacingSitesOf(renderRules: RenderRules, nodeMap: NodeMap): RuleSpacingSite[] {
	const out = new Map<string, RuleSpacingSite>();
	const add = (kind: string, slot: string, part: SpacingPart, address: string, stamp: Pick<RuleSpacingSite, 'edgeArm' | 'kindEdge' | 'padding'> = {}): void => {
		const key = `${kind} ${part.fieldName}`;
		const prior = out.get(key);
		const label = spacingLabelOf(part.spacing);
		if (prior !== undefined && prior.defaultArm !== part.defaultArm) {
			throw emitShapeFailure({ code: 'option-label-arm-conflict', message: `render rules: ${displayNameOf(kind, nodeMap)}.${slot} resolves '${label}' to both ${prior.defaultArm} and ${part.defaultArm}` });
		}
		if (prior === undefined) {
			out.set(key, {
				kind,
				slot,
				address,
				label,
				spacing: part.spacing,
				defaultArm: part.defaultArm,
				arms: part.arms,
				...(part.origin === 'word-default' ? { origin: part.origin } : {}),
				...(part.edgeLiterals === undefined ? {} : { edgeLiterals: part.edgeLiterals }),
				...stamp
			});
		}
	};
	const visit = (kind: string, r: RenderRule): void => {
		const flanks = flanksOf(r);
		if (flanks !== undefined) {
			const slot = slotOf(kind, flanks.inner, nodeMap);
			add(kind, slot, flanks.start, spacingLabelOf(flanks.start.spacing));
			visit(kind, flanks.inner);
			add(kind, slot, flanks.end, spacingLabelOf(flanks.end.spacing));
			return;
		}
		const b = bag(r);
		for (const m of b.members ?? []) {
			if (!isSeamChoice(m)) {
				visit(kind, m);
				continue;
			}
			const part = seamPartOf(m);
			const seam = part.spacing;
			const kindEdge = seam.token === displayNameOf(kind, nodeMap);
			add(kind, seam.token, part, part.fieldName, kindEdge ? { kindEdge } : seamChoiceDefault(m)?.origin === 'preference' && part.defaultArm === 'space' ? { padding: true } : {});
			if (!kindEdge) continue;
			for (const token of part.edgeLiterals ?? []) {
				const spacing: SeamAddress = { at: 'seam', token, side: seam.side };
				const address = spacingLabelOf(spacing);
				const armDefault = renderRules.edgeArms?.get(edgeArmKey(kind, address));
				if (armDefault === undefined) continue;
				add(
					kind,
					token,
					{ ...part, fieldName: address, spacing, defaultArm: armDefault.arm, origin: armDefault.origin, edgeLiterals: undefined },
					address,
					{ edgeArm: armDefault.kindId === undefined ? {} : { kindId: armDefault.kindId } }
				);
			}
		}
		if (b.content !== undefined) visit(kind, b.content);
		const spaced = isRepeated(r) ? spacedSeparatorOf(r) : undefined;
		if (spaced === undefined) return;
		const slot = slotOf(kind, r, nodeMap);
		for (const part of [spaced.before, spaced.after]) {
			if (part !== undefined) add(kind, slot, part, siteKey(slot, part.spacing));
		}
	};
	for (const [kind, rule] of Object.entries(renderRules.rules)) visit(kind, rule);
	const sites = [...out.values()];
	return [...sites, ...seatedSites(seatsOf(renderRules.rules, nodeMap), sites, nodeMap, renderRules.declared, renderRules.unitEdges)];
}

function slotOf(kind: string, rule: RenderRule, nodeMap: NodeMap): string {
	const id = bag(rule).id;
	const slot = id === undefined ? undefined : nodeMap.slotByRuleId.get(kind)?.get(id)?.name;
	if (slot === undefined) throw new Error(`render rules: the spaced separator in '${kind}' belongs to no slot`);
	return slot;
}

function seatsOf(rules: Readonly<Record<string, RenderRule>>, nodeMap: NodeMap): Seat[] {
	const seats: Seat[] = [];
	const visit = (kind: string, r: RenderRule): void => {
		const flanks = flanksOf(r);
		if (flanks !== undefined) {
			visit(kind, flanks.inner);
			return;
		}
		const b = bag(r);
		for (const m of b.members ?? []) if (!isSeamChoice(m)) visit(kind, m);
		if (b.content !== undefined) visit(kind, b.content);
		if (isRepeated(r) && spacedSeparatorOf(r) !== undefined) seats.push({ kind, slot: slotOf(kind, r, nodeMap), id: bag(r).id! });
	};
	for (const [kind, rule] of Object.entries(rules)) visit(kind, rule);
	return seats;
}

function renderedElementKinds(kind: string, nodeMap: NodeMap, edged: (kind: string) => boolean, seen: Set<string>): string[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	if (edged(kind)) return [kind];
	const node = nodeMap.nodes.get(kind);
	if (node instanceof AssembledPolymorph) {
		return node.slots.flatMap((slot) => slotElementKinds(slot, nodeMap)).flatMap((arm) => renderedElementKinds(arm, nodeMap, edged, seen));
	}
	return concreteKindsOf(kind, nodeMap).flatMap((concrete) => (concrete === kind ? [kind] : renderedElementKinds(concrete, nodeMap, edged, seen)));
}

function seatedElementKinds(seats: readonly Seat[], nodeMap: NodeMap, edged: (kind: string) => boolean): Map<string, { kind: string; slot: string; children: Set<string> }> {
	const admitted = new Map<string, { kind: string; slot: string; children: Set<string> }>();
	for (const seat of seats) {
		const slot = nodeMap.slotByRuleId.get(seat.kind)?.get(seat.id);
		if (slot === undefined) continue;
		const key = `${seat.kind}\u0000${seat.slot}`;
		const entry = admitted.get(key) ?? { kind: seat.kind, slot: seat.slot, children: new Set<string>() };
		for (const c of slotElementKinds(slot, nodeMap)) {
			for (const rendered of renderedElementKinds(c, nodeMap, edged, new Set())) entry.children.add(rendered);
		}
		admitted.set(key, entry);
	}
	return admitted;
}

function seatedUnitKinds(rules: Readonly<Record<string, RenderRule>>, nodeMap: NodeMap, ownEdges: (kind: string) => boolean): ReadonlySet<string> {
	const unit = (kind: string): boolean => {
		const node = nodeMap.nodes.get(kind);
		return node !== undefined && isFixedTextLeaf(node) && node.aliasStorageNode === undefined;
	};
	const out = new Set<string>();
	for (const seat of seatedElementKinds(seatsOf(rules, nodeMap), nodeMap, (kind) => ownEdges(kind) || unit(kind)).values()) {
		for (const child of seat.children) if (unit(child)) out.add(child);
	}
	return out;
}

interface Seat {
	readonly kind: string;
	readonly slot: string;
	readonly id: RuleId;
}

function seatedSites(
	seats: readonly Seat[],
	sites: readonly RuleSpacingSite[],
	nodeMap: NodeMap,
	declared: ReadonlyMap<string, DeclaredArm> | undefined,
	unitEdges: ReadonlyMap<string, SpacingPart> | undefined
): RuleSpacingSite[] {
	const edgeOf = new Map<string, Pick<RuleSpacingSite, 'spacing' | 'defaultArm' | 'arms'>>();
	for (const site of sites) {
		const { spacing } = site;
		if (spacing.at === 'seam' && spacing.side === 'after' && spacing.token === displayNameOf(site.kind, nodeMap)) edgeOf.set(site.kind, site);
	}
	for (const [kind, part] of unitEdges ?? []) edgeOf.set(kind, part);
	const admitted = seatedElementKinds(seats, nodeMap, (kind) => edgeOf.has(kind));
	const out: RuleSpacingSite[] = [];
	for (const seat of admitted.values()) {
		const children = [...seat.children].sort();
		const parent = displayNameOf(seat.kind, nodeMap);
		for (const child of children) {
			const edge = edgeOf.get(child);
			if (edge === undefined) continue;
			const address = siteKey(seat.slot, edge.spacing);
			const arm = declared?.get(declaredKey(seat.kind, address))?.arm;
			if (arm !== undefined && !edge.arms.includes(arm)) {
				throw emitShapeFailure({ code: 'option-arm-invalid', message: `options: ${displayNameOf(seat.kind, nodeMap)}.${address} is '${arm}', not one of ${edge.arms.join(', ')}` });
			}
			out.push({
				kind: seat.kind,
				slot: seat.slot,
				address,
				label: spacingLabelOf(edge.spacing),
				spacing: edge.spacing,
				defaultArm: arm === undefined ? edge.defaultArm : (arm as Layout),
				arms: edge.arms,
				seat: { kind: child, display: displayNameOf(child, nodeMap) },
				path: [
					{ kind: 'kind-match', name: parent },
					{ kind: 'fieldName', name: seat.slot },
					{ kind: 'kind-match', name: displayNameOf(child, nodeMap) },
					{ kind: 'name', name: 'after' }
				]
			});
		}
	}
	return out;
}

