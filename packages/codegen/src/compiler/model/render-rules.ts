import type { NodeMap } from '../types.ts';
import { findAnonEntryForLiteralText, findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import type { RenderRule, Rule, RuleAnnotations, RuleId, SeamOrigin } from '../../types/rule.ts';
import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { matchesWordShape } from '../../util/word-matcher.ts';
import { type AssembledNode, AbstractAssembledCompound, AssembledEnum, AssembledKeyword, AssembledPolymorph, concreteKindsOf, isBoundaryLeftImmediate, isVisiblePunctuationLeaf, leftmostTerminalImmediate } from './node-map.ts';
import { slotElementKinds } from '../../emitters/transport-common.ts';
import { supertypeMembersByPublicName } from './supertype-members.ts';
import { addressSites, resolveBindings, type PreferenceOrigin } from './site-addresses.ts';
import type { PreferenceSegment } from '../../dsl/primitives/preference-path.ts';
import { readOptionsBlock, type OptionsConfig } from '../../dsl/wire/options-block.ts';
import { spacingArmsOf, whitespaceArmsOf } from './whitespace-arms.ts';
import {
	EMPTY_SEPARATOR_TOKEN,
	FLANK_DEFAULT,
	SPACING_DEFAULT,
	flankAddress,
	parseSeamLabel,
	seamLabel,
	siteKey,
	spacingLabel,
	type FlankSide,
	type SeparatorSide,
	type SpacingArm,
	type WhitespaceArm
} from '../../dsl/primitives/spacing.ts';

export type SpacingSide = 'before' | 'after' | 'gap' | 'seam' | FlankSide;

export interface SpacingPart {
	readonly fieldName: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: WhitespaceArm;
	readonly origin?: SeamOrigin;
	readonly edgeTokens?: readonly string[];
	readonly arms: readonly WhitespaceArm[];
}

export interface Flanks {
	readonly start: SpacingPart;
	readonly inner: RenderRule;
	readonly end: SpacingPart;
}

export function whitespaceTextOf(
	visibleExternals: Readonly<Record<string, Rule<'evaluate'>>> | undefined,
	nodeMap: NodeMap
): ReadonlyMap<string, string> {
	const arms = whitespaceArmsOf(nodeMap);
	const out = new Map<string, string>();
	for (const [name, rule] of Object.entries(visibleExternals ?? {})) {
		const kind = publicKindName(name);
		if (!arms.includes(kind)) continue;
		const r = rule as { type?: unknown; value?: unknown };
		if (r.type === STRING && typeof r.value === 'string') out.set(kind, r.value);
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
	readonly declared?: ReadonlyMap<string, DeclaredArm>;
}

export interface RenderRulesConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEntryLike[];
	readonly options?: OptionsConfig;
	readonly whitespaceText?: ReadonlyMap<string, string>;
	readonly normalizedRules?: Record<string, RenderRule>;
	readonly choiceArmNodes?: ReadonlySet<RenderRule>;
}

function isImmediateRight(rule: RenderRule | undefined, config: RenderRulesConfig): boolean {
	if (rule === undefined) return false;
	return leftmostTerminalImmediate(rule, { rules: config.normalizedRules ?? {}, visiting: new Set() });
}

function isBoundaryImmediateFrom(members: readonly RenderRule[], fromIndex: number, config: RenderRulesConfig): boolean {
	return isBoundaryLeftImmediate(members, fromIndex, { rules: config.normalizedRules ?? {}, visiting: new Set() });
}

export interface SeatedChild {
	readonly kind: string;
	readonly field: string;
}

export interface RuleSpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly side: SpacingSide;
	readonly defaultArm: WhitespaceArm;
	readonly arms: readonly WhitespaceArm[];
	readonly origin?: SeamOrigin;
	readonly seat?: SeatedChild;
	readonly path?: readonly PreferenceSegment[];
	readonly edgeTokens?: readonly string[];
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

export interface DeclaredArm {
	readonly arm: string;
	readonly origin: PreferenceOrigin;
}

class DefaultResolver {
	readonly #declared: ReadonlyMap<string, DeclaredArm>;

	constructor(declared?: ReadonlyMap<string, DeclaredArm>) {
		this.#declared = declared ?? new Map();
	}

	#resolve(kind: string, address: string, fallback: WhitespaceArm): { readonly arm: WhitespaceArm; readonly origin: SeamOrigin } {
		const hit = this.#declared.get(declaredKey(kind, address));
		return hit === undefined ? { arm: fallback, origin: 'fallback' } : { arm: hit.arm as WhitespaceArm, origin: hit.origin };
	}

	resolveSeparator(kind: string, slot: string, label: string): SpacingArm {
		return this.#resolve(kind, siteKey(slot, label), SPACING_DEFAULT).arm as SpacingArm;
	}

	resolveSeam(
		kind: string,
		address: string,
		fallback: WhitespaceArm,
		arms: readonly WhitespaceArm[],
		wordShaped: boolean = false
	): { readonly label: string; readonly arm: WhitespaceArm; readonly origin: SeamOrigin } {
		const resolved = this.#resolve(kind, address, fallback);
		const { arm, origin } = wordShaped && resolved.origin === 'fallback' ? { arm: resolved.arm, origin: 'word-default' as const } : resolved;
		if (!arms.includes(arm)) throw new Error(`options: '${address}' on ${publicKindName(kind)} is '${arm}', not one of ${arms.join(', ')}`);
		return { label: address, arm, origin };
	}

	resolveFlank(kind: string, side: FlankSide): { readonly label: string; readonly arm: WhitespaceArm } {
		const address = flankAddress(publicKindName(kind), side);
		return { label: address, arm: this.#resolve(kind, address, FLANK_DEFAULT).arm };
	}
}

type Symbols = Partial<Record<WhitespaceArm, string>>;

function whitespaceSymbols(nodeMap: NodeMap, arms: readonly WhitespaceArm[]): Symbols | undefined {
	if (arms.length === 0) return undefined;
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
	return whitespaceSymbols(config.nodeMap, whitespaceArmsOf(config.nodeMap));
}

function whitespaceChoice(part: SpacingPart, arms: readonly WhitespaceArm[], symbols: Symbols): RenderRule {
	return {
		type: CHOICE,
		nonterminal: true,
		fieldName: part.fieldName,
		...(part.edgeTokens === undefined ? {} : { annotations: { edgeTokens: part.edgeTokens } }),
		members: arms.map((arm) => ({
			type: SYMBOL,
			name: symbols[arm]!,
			nonterminal: true,
			annotations: {
				preference: part.label,
				...(arm === part.defaultArm ? { default: true as const, ...(part.origin === undefined ? {} : { origin: part.origin }) } : {})
			}
		}))
	} as unknown as RenderRule;
}

function isWhitespaceChoice(rule: RenderRule): boolean {
	const r = bag(rule);
	return (
		r.type === CHOICE &&
		r.members !== undefined &&
		r.members.length > 0 &&
		r.members.every((m) => {
			const b = bag(m);
			return b.type === SYMBOL && b.name !== undefined && b.annotations?.preference !== undefined;
		})
	);
}

const isSpacingChoice = isWhitespaceChoice;

function partOf(choice: RenderRule, side: SpacingSide): SpacingPart {
	const r = bag(choice);
	const members = r.members!.map(bag);
	const defaultMember = members.find((m) => m.annotations?.default === true);
	if (r.fieldName === undefined || defaultMember?.name === undefined) {
		throw new Error('render rules: a spacing choice names its field and marks its default arm');
	}
	const edgeTokens = r.annotations?.edgeTokens;
	return {
		fieldName: r.fieldName,
		label: members[0]!.annotations!.preference!,
		side,
		defaultArm: publicKindName(defaultMember.name) as WhitespaceArm,
		...(defaultMember.annotations?.origin === 'word-default' ? { origin: defaultMember.annotations.origin } : {}),
		...(edgeTokens === undefined ? {} : { edgeTokens }),
		arms: members.map((m) => publicKindName(m.name!) as WhitespaceArm)
	};
}

export function flanksOf(rule: RenderRule): Flanks | undefined {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length !== 3 || r.id !== undefined) return undefined;
	const [start, inner, end] = r.members as [RenderRule, RenderRule, RenderRule];
	if (!isWhitespaceChoice(start) || !isWhitespaceChoice(end)) return undefined;
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

function withFlanks(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols, arms: readonly WhitespaceArm[]): RenderRule {
	const part = (side: FlankSide): RenderRule => {
		const { label, arm } = resolver.resolveFlank(gap.kind, side);
		return whitespaceChoice({ fieldName: `${gap.slot}_${side}`, label, side, defaultArm: arm, arms }, arms, symbols);
	};
	return { type: SEQ, nonterminal: true, members: [part('start'), rule, part('end')] } as unknown as RenderRule;
}

function withSpacedSeparator(rule: RenderRule, gap: Gap, resolver: DefaultResolver, symbols: Symbols, arms: readonly SpacingArm[]): RenderRule {
	const parts = labelsOf(gap).map(({ label, side }) =>
		whitespaceChoice({ fieldName: siteKey(gap.slot, label), label, side, defaultArm: resolver.resolveSeparator(gap.kind, gap.slot, label), arms }, arms, symbols)
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
	const spacingArms = spacingArmsOf(config.nodeMap);
	const symbols = whitespaceSymbols(config.nodeMap, spacingArms);
	if (symbols === undefined) return { rules };
	const gaps = collectGaps(config, rules);
	const flankSyms = flankSymbols(config);
	const flanked = flankSyms === undefined ? new Map<string, Gap>() : flankedSlots(gaps);
	const resolver = new DefaultResolver(declared);
	const visit = (r: RenderRule): RenderRule => {
		const id = bag(r).id;
		const gap = id === undefined ? undefined : gaps.get(id);
		if (gap === undefined) return r;
		const spaced = withSpacedSeparator(r, gap, resolver, symbols, spacingArms);
		return flanked.get(gap.kind) === gap ? withFlanks(spaced, gap, resolver, flankSyms!, whitespaceArmsOf(config.nodeMap)) : spaced;
	};
	const out: Record<string, RenderRule> = {};
	for (const [kind, rule] of Object.entries(rules)) out[kind] = visit(walker.map(rule, visit));
	return { rules: out };
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
	return isWhitespaceChoice(rule);
}

export function isSeamChoice(rule: RenderRule): boolean {
	if (!isAnyWhitespaceChoice(rule)) return false;
	const label = bag(bag(rule).members![0]!).annotations?.preference;
	return label !== undefined && parseSeamLabel(label) !== undefined;
}

export function seamChoiceDefault(
	rule: RenderRule
): { readonly label: string; readonly origin: SeamOrigin | undefined; readonly arm: WhitespaceArm } | undefined {
	const label = bag(bag(rule).members![0]!).annotations?.preference;
	if (label === undefined) return undefined;
	for (const member of bag(rule).members ?? []) {
		const m = bag(member);
		if (m.annotations?.default === true) return { label, origin: m.annotations.origin, arm: publicKindName(m.name!) };
	}
	return undefined;
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

export function tokenNameOfText(text: string, kindEntries: readonly KindEntryLike[]): string | undefined {
	if (text.trim() === '') return undefined;
	const entry = findEntryForLiteralText(kindEntries, text);
	return entry === undefined ? undefined : publicKindName(entry.kind);
}

function literalTokenOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const text = literalTextOf(rule);
	return text === undefined ? undefined : tokenNameOfText(text, config.kindEntries);
}

export function punctuationTokenOfNode(node: AssembledNode | undefined, kindEntries: readonly KindEntryLike[]): string | undefined {
	return node !== undefined && isVisiblePunctuationLeaf(node) ? tokenNameOfText(node.text, kindEntries) : undefined;
}

function punctuationReferenceTokenOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	return r.type === SYMBOL && r.name !== undefined ? punctuationTokenOfNode(config.nodeMap.nodes.get(r.name), config.kindEntries) : undefined;
}

function isKeywordText(text: string, config: RenderRulesConfig): boolean {
	const entry = findEntryForLiteralText(config.kindEntries, text);
	const node = entry === undefined ? undefined : config.nodeMap.nodes.get(entry.kind);
	return node instanceof AssembledKeyword;
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

function isOptionalRule(rule: RenderRule): boolean {
	const r = bag(rule);
	return r.multiplicity === 'optional' || (r.type === CHOICE && (r.members ?? []).some(isOptionalRule));
}

function literalSlotOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	if (r.type === STRING && r.nonterminal !== true) return undefined;
	if (r.type !== CHOICE && (r.fieldName === undefined || literalLeafText(rule) === undefined)) return undefined;
	const fields = new Set<string | undefined>();
	const texts: string[] = [];
	if (!literalLeaves(rule, fields, texts, undefined) || fields.size !== 1) return undefined;
	if (!texts.some((text) => text.trim() !== '')) return undefined;
	const punctuated = texts.some((text) => text.trim() !== '' && !matchesWordShape(text, config.nodeMap.wordMatcher));
	if (!punctuated && isOptionalRule(rule)) return undefined;
	const [field] = fields;
	return field === undefined ? undefined : field.toLowerCase();
}

function enumSlotOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const r = bag(rule);
	if (r.type !== SYMBOL || r.fieldName === undefined || r.name === undefined) return undefined;
	const target = config.nodeMap.nodes.get(r.name);
	if (!(target instanceof AssembledEnum)) return undefined;
	const values = target.values;
	if (values.length === 0 || values.some((v) => !matchesWordShape(v, config.nodeMap.wordMatcher))) return undefined;
	return r.fieldName.toLowerCase();
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
	return target instanceof AssembledKeyword ? r.fieldName.toLowerCase() : undefined;
}

function seamNameOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	return literalTokenOf(rule, config) ?? punctuationReferenceTokenOf(rule, config) ?? literalSlotOf(rule, config) ?? enumSlotOf(rule, config) ?? keywordSlotOf(rule, config);
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

function seamChoice(
	kind: string,
	address: string,
	fallback: WhitespaceArm,
	resolver: DefaultResolver,
	seams: SeamArms,
	edgeTokens?: readonly string[],
	wordShaped: boolean = false
): RenderRule {
	const { label, arm, origin } = resolver.resolveSeam(kind, address, fallback, seams.arms, wordShaped);
	return whitespaceChoice(
		{ fieldName: address, label, side: 'seam', defaultArm: arm, origin, ...(edgeTokens === undefined ? {} : { edgeTokens }), arms: seams.arms },
		seams.arms,
		seams.symbols
	);
}

function edgeTokensOf(rule: RenderRule, side: 'first' | 'last', config: RenderRulesConfig): readonly string[] | undefined {
	const edge = edgeMember(rule, side);
	if (edge === undefined) return undefined;
	const token = (member: RenderRule): string | undefined => {
		const own = literalTokenOf(member, config) ?? punctuationReferenceTokenOf(member, config);
		if (own !== undefined || bag(member).type !== SEQ) return own;
		const bare = (bag(member).members ?? []).filter((m) => !isAnyWhitespaceChoice(m));
		return bare.length === 1 ? token(bare[0]!) : undefined;
	};
	const single = token(edge);
	if (single !== undefined) return [single];
	const r = bag(edge);
	if (r.type !== CHOICE || r.members === undefined || r.members.length === 0) return undefined;
	const tokens = r.members.map(token);
	return tokens.every((t) => t !== undefined) ? [...new Set(tokens as string[])] : undefined;
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

/** A choice whose arms end (or start) in a token gets that token's seam
 *  inside each such arm, since the token meets the member beside the choice
 *  only when its arm renders: `for (init; ...)` seats `semi/after` in the
 *  initializer's expression arm and nowhere else. */
function withArmEdgeSeams(
	choice: RenderRule,
	side: 'first' | 'last',
	kind: string,
	config: RenderRulesConfig,
	fallback: SpacingArm,
	resolver: DefaultResolver,
	seams: SeamArms
): RenderRule | undefined {
	const c = bag(choice);
	if (c.type !== CHOICE || c.members === undefined || isAnyWhitespaceChoice(choice)) return undefined;
	let changed = false;
	const members = c.members.map((arm) => {
		const edge = edgeMember(arm, side) ?? arm;
		if (isAnyWhitespaceChoice(edge)) return arm;
		if (side === 'first' && isImmediateRight(edge, config)) return arm;
		const token = literalTokenOf(edge, config) ?? punctuationReferenceTokenOf(edge, config);
		if (token === undefined) return arm;
		const seam = seamChoice(kind, seamLabel(token, side === 'last' ? 'after' : 'before'), fallback, resolver, seams, undefined, isKeywordSeam(edge, config));
		changed = true;
		if (edgeMember(arm, side) === undefined) {
			return { type: SEQ, nonterminal: true, members: side === 'last' ? [arm, seam] : [seam, arm] } as unknown as RenderRule;
		}
		return withEdgeSeam(arm, seam, side);
	});
	return changed ? ({ ...(choice as object), members } as unknown as RenderRule) : undefined;
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
			const fallback: SpacingArm = 'space';
			const leftArms =
				seamNameOf(left, config) === undefined ? withArmEdgeSeams(left, 'last', kind, config, fallback, resolver, seams) : undefined;
			if (leftArms !== undefined) {
				members[members.length - 1] = leftArms;
				changed = true;
			}
			const rightArms =
				seamNameOf(right, config) === undefined ? withArmEdgeSeams(right, 'first', kind, config, fallback, resolver, seams) : undefined;
			if (rightArms !== undefined) {
				right = rightArms;
				changed = true;
			}
			const leftNow = members[members.length - 1]!;
			const leftEdge = edgeMember(leftNow, 'last');
			const rightEdge = edgeMember(right, 'first');
			const rightImmediate = isBoundaryImmediateFrom(r.members, i, config);
			const leftToken = seamNameOf(leftEdge ?? leftNow, config);
			const rightToken = seamNameOf(rightEdge ?? right, config);
			if (!rightImmediate && leftToken !== undefined && !(leftEdge !== undefined && isAnyWhitespaceChoice(leftEdge))) {
				const seam = seamChoice(kind, seamLabel(leftToken, 'after'), fallback, resolver, seams, undefined, isKeywordSeam(leftEdge ?? leftNow, config));
				if (leftEdge === undefined) members.push(seam);
				else members[members.length - 1] = withEdgeSeam(leftNow, seam, 'last');
				changed = true;
			}
			if (!rightImmediate && rightToken !== undefined && !(rightEdge !== undefined && isAnyWhitespaceChoice(rightEdge))) {
				const seam = seamChoice(kind, seamLabel(rightToken, 'before'), fallback, resolver, seams, undefined, isKeywordSeam(rightEdge ?? right, config));
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
	const text = literalTextOf(rule);
	if (text === undefined || text.trim() === '' || (!includeWords && matchesWordShape(text, config.nodeMap.wordMatcher))) return undefined;
	const entry = findAnonEntryForLiteralText(config.kindEntries, text);
	return entry === undefined ? undefined : publicKindName(entry.kind);
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
		const seam = (side: SeparatorSide): RenderRule => seamChoice(kind, seamLabel(name, side), 'space', resolver, seams, undefined, wordShaped);
		const before = isImmediateRight(member, config) ? [] : [seam('before')];
		return { type: SEQ, nonterminal: true, members: [...before, member, seam('after')] } as unknown as RenderRule;
	});
	return { ...(rule as object), members } as unknown as RenderRule;
}

function ownsKindEdges(kind: string, nodeMap: NodeMap): boolean {
	if (!(nodeMap.nodes.get(kind) instanceof AbstractAssembledCompound)) return false;
	return kind === publicKindName(kind) || !nodeMap.nodes.has(publicKindName(kind));
}

function withKindEdges(
	rule: RenderRule,
	kind: string,
	config: RenderRulesConfig,
	resolver: DefaultResolver,
	seams: SeamArms
): RenderRule {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined) return rule;
	const part = (side: SeparatorSide): RenderRule =>
		seamChoice(kind, seamLabel(publicKindName(kind), side), 'space', resolver, seams, edgeTokensOf(rule, side === 'before' ? 'first' : 'last', config));
	const before = isImmediateRight(rule, config) ? [] : [part('before')];
	if (flanksOf(rule) !== undefined) return { type: SEQ, nonterminal: true, members: [...before, rule, part('after')] } as unknown as RenderRule;
	return {
		...(rule as object),
		members: [...before, ...r.members, part('after')]
	} as unknown as RenderRule;
}

export function seamRenderRules(
	spaced: RenderRules,
	config: RenderRulesConfig,
	declared?: ReadonlyMap<string, DeclaredArm>
): RenderRules {
	const spacingArms = spacingArmsOf(config.nodeMap);
	const symbols = whitespaceSymbols(config.nodeMap, spacingArms);
	if (symbols === undefined) return spaced;
	const inlined = inlinedRuleNames(spaced.rules);
	const flankSyms = flankSymbols(config);
	const seams: SeamArms = flankSyms === undefined ? { arms: spacingArms, symbols } : { arms: whitespaceArmsOf(config.nodeMap), symbols: flankSyms };
	const immediateConfig: RenderRulesConfig = { ...config, normalizedRules: spaced.rules };
	const build = (): RenderRules => {
		const resolver = new DefaultResolver(declared);
		const out: Record<string, RenderRule> = {};
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
			const seamed = visit(walker.map(rule, visit));
			out[kind] = ownsKindEdges(kind, config.nodeMap) ? withKindEdges(seamed, kind, immediateConfig, resolver, seams) : seamed;
		}
		return { rules: out };
	};
	const result = build();
	const sites = spacingSitesOf(result, config.nodeMap);
	validateIndentDepth(sites);
	return result;
}

/// Both render-rule passes, with the `options:` block resolved between them.
/// `stamp` runs on the spaced rules before each seam pass: seam fallbacks read
/// the static-spacing stamp, and a declared separator arm can move it.
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

function declaredKey(kind: string, address: string): string {
	return `${publicKindName(kind)}\u0000${address}`;
}

export function declaredOptionArms(
	config: RenderRulesConfig,
	sites: readonly RuleSpacingSite[]
): ReadonlyMap<string, DeclaredArm> | undefined {
	const block: OptionsConfig | undefined = config.options;
	if (block === undefined) return undefined;
	const kinds = new Set([...config.nodeMap.nodes.keys()].map(publicKindName));
	const { declarations, bindings } = readOptionsBlock(block, kinds);
	if (declarations.length === 0) return undefined;
	const addressed = addressSites(sites, config.kindEntries);
	const arms = new Map<string, DeclaredArm>();
	for (const [index, { arm, origin }] of resolveBindings(declarations, bindings, addressed, supertypeMembersByPublicName(config.nodeMap), false)) {
		const site = addressed[index]!;
		arms.set(declaredKey(site.kind, site.address), { arm, origin });
	}
	return arms;
}

export function spacingSitesOf(renderRules: RenderRules, nodeMap: NodeMap): RuleSpacingSite[] {
	const out = new Map<string, RuleSpacingSite>();
	const seats: Seat[] = [];
	const add = (kind: string, slot: string, part: SpacingPart, address: string): void => {
		const key = `${kind} ${part.fieldName}`;
		const prior = out.get(key);
		if (prior !== undefined && prior.defaultArm !== part.defaultArm) {
			throw new Error(`render rules: ${publicKindName(kind)}.${slot} resolves '${part.label}' to both ${prior.defaultArm} and ${part.defaultArm}`);
		}
		if (prior === undefined) {
			out.set(key, {
				kind,
				slot,
				address,
				label: part.label,
				side: part.side,
				defaultArm: part.defaultArm,
				arms: part.arms,
				...(part.origin === 'word-default' ? { origin: part.origin } : {}),
				...(part.edgeTokens === undefined ? {} : { edgeTokens: part.edgeTokens })
			});
		}
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
		seats.push({ kind, slot, id: bag(r).id! });
	};
	for (const [kind, rule] of Object.entries(renderRules.rules)) visit(kind, rule);
	const sites = [...out.values()];
	return [...sites, ...seatedSites(seats, sites, nodeMap, renderRules.declared)];
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
	declared: ReadonlyMap<string, DeclaredArm> | undefined
): RuleSpacingSite[] {
	const edgeOf = new Map<string, RuleSpacingSite>();
	for (const site of sites) {
		const own = publicKindName(site.kind);
		if (site.side === 'seam' && site.address === seamLabel(own, 'after')) edgeOf.set(own, site);
	}
	const renderedKinds = (kind: string, seen: Set<string>): string[] => {
		if (seen.has(kind)) return [];
		seen.add(kind);
		if (edgeOf.has(publicKindName(kind))) return [kind];
		const node = nodeMap.nodes.get(kind);
		if (node instanceof AssembledPolymorph) {
			return node.slots.flatMap((slot) => slotElementKinds(slot, nodeMap)).flatMap((arm) => renderedKinds(arm, seen));
		}
		return concreteKindsOf(kind, nodeMap).flatMap((concrete) => (concrete === kind ? [kind] : renderedKinds(concrete, seen)));
	};
	const admitted = new Map<string, { kind: string; slot: string; children: Set<string> }>();
	for (const seat of seats) {
		const slot = nodeMap.slotByRuleId.get(seat.id);
		if (slot === undefined) continue;
		const key = `${seat.kind}\u0000${seat.slot}`;
		const entry = admitted.get(key) ?? { kind: seat.kind, slot: seat.slot, children: new Set<string>() };
		for (const c of slotElementKinds(slot, nodeMap)) {
			for (const rendered of renderedKinds(c, new Set())) entry.children.add(publicKindName(rendered));
		}
		admitted.set(key, entry);
	}
	const out: RuleSpacingSite[] = [];
	for (const seat of admitted.values()) {
		const children = [...seat.children].sort();
		const parent = publicKindName(seat.kind);
		for (const child of children) {
			const edge = edgeOf.get(child);
			if (edge === undefined) continue;
			const address = `${seat.slot}_${edge.address}`;
			const arm = declared?.get(declaredKey(seat.kind, address))?.arm;
			if (arm !== undefined && !edge.arms.includes(arm)) {
				throw new Error(`options: ${publicKindName(seat.kind)}.${address} is '${arm}', not one of ${edge.arms.join(', ')}`);
			}
			out.push({
				kind: seat.kind,
				slot: seat.slot,
				address,
				label: edge.label,
				side: edge.side,
				defaultArm: arm === undefined ? edge.defaultArm : (arm as WhitespaceArm),
				arms: edge.arms,
				seat: { kind: child, field: edge.address },
				path: [
					{ kind: 'kind-match', name: parent },
					{ kind: 'fieldName', name: seat.slot },
					{ kind: 'kind-match', name: child },
					{ kind: 'name', name: 'after' }
				]
			});
		}
	}
	return out;
}
