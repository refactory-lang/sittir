import type { NodeMap } from '../types.ts';
import { findEntryForKindName, findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import type { PreferenceDeclaration } from '../../dsl/primitives/preference.ts';
import {
	DELIMITER_LABEL,
	EMPTY_SEPARATOR_TOKEN,
	SPACING_ARMS,
	SPACING_DEFAULT,
	isSpacingArm,
	spacingPhantomKind,
	type SpacingPhantom
} from '../../dsl/primitives/spacing.ts';
import { RuleWalker } from '../../dsl/rule-walker.ts';
import type { AnyRule } from '../../types/rule.ts';
import {
	AbstractAssembledCompound,
	AssembledLeaf,
	AssembledList,
	AssembledNonterminal,
	delimiterMembersFor,
	isTerminalValue,
	type NodeOrTerminal
} from './node-map.ts';

export type PreferenceSource = 'declared' | 'spacing' | 'delimiter';

export interface PreferenceArm {
	readonly value: string;
	readonly kind?: string;
}

export type SpacingSide = 'before' | 'after' | 'gap';

export interface SitePreference {
	readonly kind: string;
	readonly slot: string;
	readonly label: string;
	readonly arms: readonly PreferenceArm[];
	readonly defaultArm: string;
	readonly source: PreferenceSource;
	readonly side?: SpacingSide;
}

export interface SitePreferencesConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEntryLike[];
	readonly spacingPreferences?: Readonly<Record<string, PreferenceDeclaration>>;
}

export function publicKindName(kind: string): string {
	return kind.replace(/^_+/, '');
}

export function collectSitePreferences(config: SitePreferencesConfig): SitePreference[] {
	const out: SitePreference[] = [];
	const usedPhantoms = new Set<string>();
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AbstractAssembledCompound) || node instanceof AssembledList) continue;
		for (const slot of node.slots) {
			if (slot.name === undefined) continue;
			const declared = declaredPreference(kind, slot, config.kindEntries);
			if (declared) out.push(declared);
			out.push(...separatorPreferences(kind, node, slot, config, usedPhantoms));
		}
	}
	for (const phantom of Object.keys(config.spacingPreferences ?? {})) {
		if (!usedPhantoms.has(phantom)) {
			throw new Error(`patches: '${phantom}' declares spacing for a separator no eligible list uses`);
		}
	}
	return out;
}

function armKind(v: NodeOrTerminal, kindEntries: readonly KindEntryLike[]): string | undefined {
	const node = v.node as { kind?: string; name?: string } | undefined;
	const raw = v.parseKind?.name ?? v.resolvedKind ?? node?.kind ?? node?.name;
	if (raw !== undefined) return publicKindName(raw);
	return isTerminalValue(v) ? tokenKind(v.value, kindEntries, false) : undefined;
}

function armValue(v: NodeOrTerminal, kind: string | undefined): string | undefined {
	return v.variant ?? (isTerminalValue(v) ? v.value : undefined) ?? kind;
}

function declaredPreference(
	kind: string,
	slot: AssembledNonterminal,
	kindEntries: readonly KindEntryLike[]
): SitePreference | undefined {
	const labelled = slot.values.filter((v) => v.preferenceLabel !== undefined);
	if (labelled.length === 0) return undefined;
	const labels = new Set(labelled.map((v) => v.preferenceLabel!));
	if (labels.size > 1) {
		throw new Error(`preference: slot ${kind}.${slot.name} mixes labels (${[...labels].join(', ')})`);
	}
	const label = labelled[0]!.preferenceLabel!;
	const arms: PreferenceArm[] = [];
	let defaultArm: string | undefined;
	for (const v of labelled) {
		const armK = armKind(v, kindEntries);
		const value = armValue(v, armK);
		if (value === undefined) continue;
		arms.push({ value, ...(armK === undefined ? {} : { kind: armK }) });
		if (v.default === true) defaultArm = value;
	}
	if (defaultArm === undefined) {
		throw new Error(`preference '${label}' at ${kind}.${slot.name} names no default arm`);
	}
	return { kind, slot: slot.name!, label, arms, defaultArm, source: 'declared' };
}

type Gap =
	| { readonly shape: 'token'; readonly token: string; readonly eligible: boolean; readonly list?: AssembledList }
	| { readonly shape: 'empty'; readonly eligible: boolean }
	| { readonly shape: 'other'; readonly eligible: boolean; readonly list?: AssembledList };

function isRepeated(v: NodeOrTerminal): boolean {
	return v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray';
}

function admitsNoExtras(v: NodeOrTerminal, externals: ReadonlySet<string>): boolean {
	if (v.immediate === true || v.tokenized === true) return true;
	if (v.node instanceof AssembledLeaf && (v.node.immediate || v.node.tokenized)) return true;
	const kind = (v.node as { kind?: string; name?: string } | undefined)?.kind ?? v.resolvedKind;
	return kind !== undefined && (externals.has(kind) || externals.has(`_${publicKindName(kind)}`));
}

function tokenKind(text: string, kindEntries: readonly KindEntryLike[], required: true): string;
function tokenKind(text: string, kindEntries: readonly KindEntryLike[], required: false): string | undefined;
function tokenKind(text: string, kindEntries: readonly KindEntryLike[], required: boolean): string | undefined {
	const entry = findEntryForLiteralText(kindEntries, text);
	if (entry === undefined) {
		if (required) throw new Error(`separator token '${text}' has no kind in the catalog`);
		return undefined;
	}
	return publicKindName(entry.kind);
}

function listNodeOf(v: NodeOrTerminal, nodeMap: NodeMap): AssembledList | undefined {
	if (v.node instanceof AssembledList) return v.node;
	const ref = v.node as { name?: string; kind?: string } | undefined;
	const name = v.parseKind?.name ?? v.resolvedKind ?? ref?.kind ?? ref?.name;
	if (name === undefined) return undefined;
	const node = nodeMap.nodes.get(name) ?? nodeMap.nodes.get(`_${name}`);
	return node instanceof AssembledList ? node : undefined;
}

function gapOf(v: NodeOrTerminal, config: SitePreferencesConfig): Gap | undefined {
	const kindEntries = config.kindEntries;
	const externals = config.nodeMap.externals ?? new Set<string>();
	const listNode = listNodeOf(v, config.nodeMap);
	if (listNode !== undefined) {
		const list = listNode;
		const eligible = !list.elements.some((e) => admitsNoExtras(e, externals));
		const text = list.separator;
		return text === undefined
			? { shape: 'other', eligible, list }
			: { shape: 'token', token: tokenKind(text, kindEntries, true), eligible, list };
	}
	if (!isRepeated(v)) return undefined;
	const eligible = !admitsNoExtras(v, externals);
	return v.separator === undefined
		? { shape: 'empty', eligible }
		: { shape: 'token', token: tokenKind(v.separator, kindEntries, true), eligible };
}

function spacingSite(
	kind: string,
	slot: string,
	phantom: SpacingPhantom,
	config: SitePreferencesConfig,
	usedPhantoms: Set<string>,
	siteSpacing: Readonly<Record<string, string>>,
	usedSiteLabels: Set<string>
): SitePreference {
	const phantomKind = spacingPhantomKind(phantom);
	usedPhantoms.add(phantomKind);
	const declared = config.spacingPreferences?.[phantomKind];
	const label = declared?.label ?? phantomKind;
	const siteDefault = siteSpacing[label];
	if (siteDefault !== undefined) usedSiteLabels.add(label);
	const defaultArm = siteDefault ?? declared?.default ?? SPACING_DEFAULT;
	if (!isSpacingArm(defaultArm)) {
		throw new Error(
			`${siteDefault === undefined ? 'patches' : `${publicKindName(kind)}.${slot}`}: '${label}' default '${defaultArm}' is not one of ${SPACING_ARMS.join(', ')}`
		);
	}
	for (const arm of SPACING_ARMS) {
		if (findEntryForKindName(config.kindEntries, arm) === undefined) {
			throw new Error(`spacing: the grammar registers no '${arm}' kind; declare it as a visible external`);
		}
	}
	return {
		kind,
		slot,
		label,
		arms: SPACING_ARMS.map((arm) => ({ value: arm, kind: arm })),
		defaultArm,
		source: 'spacing',
		side: phantom.side ?? 'gap'
	};
}

const walker = new RuleWalker<AnyRule>();

function findWithin(rule: AnyRule, pred: (r: AnyRule) => boolean): AnyRule | undefined {
	if (pred(rule)) return rule;
	for (const child of walker.childrenOf(rule)) {
		const hit = findWithin(child, pred);
		if (hit !== undefined) return hit;
	}
	return undefined;
}

function slotSourceRule(node: AbstractAssembledCompound, slot: AssembledNonterminal): AnyRule | undefined {
	const ids = new Set(slot.sourceRuleIds);
	if (ids.size === 0) return undefined;
	return findWithin(node.renderRule as AnyRule, (r) => r.id !== undefined && ids.has(r.id));
}

function declaredSiteSpacing(values: readonly (readonly NodeOrTerminal[])[]): Readonly<Record<string, string>> {
	const out: Record<string, string> = {};
	for (const group of values) {
		for (const v of group) if (v.spacing !== undefined) Object.assign(out, v.spacing);
	}
	return out;
}

function slotRuleAdmitsNoExtras(node: AbstractAssembledCompound, slot: AssembledNonterminal): boolean {
	const owned = slotSourceRule(node, slot);
	if (owned === undefined) return false;
	return (
		findWithin(owned, (r) => {
			const flags = r as { immediate?: boolean; tokenized?: boolean };
			return flags.immediate === true || flags.tokenized === true;
		}) !== undefined
	);
}

function separatorPreferences(
	kind: string,
	node: AbstractAssembledCompound,
	slot: AssembledNonterminal,
	config: SitePreferencesConfig,
	usedPhantoms: Set<string>
): SitePreference[] {
	if (slot.values.length === 0) return [];
	const ruleAdmitsNoExtras = slotRuleAdmitsNoExtras(node, slot);
	const gaps: Gap[] = [];
	for (const v of slot.values) {
		const gap = gapOf(v, config);
		if (gap === undefined) return [];
		gaps.push(gap);
	}
	const out: SitePreference[] = [];
	const slotName = slot.name!;
	const siteSpacing = declaredSiteSpacing([
		slot.values,
		...gaps.map((g) => (g.shape !== 'empty' && g.list !== undefined ? g.list.elements : []))
	]);
	const usedSiteLabels = new Set<string>();
	if (!ruleAdmitsNoExtras && gaps.every((g) => g.eligible)) {
		const shapes = new Set(gaps.map((g) => (g.shape === 'token' ? `token:${g.token}` : g.shape)));
		if (shapes.size === 1) {
			const gap = gaps[0]!;
			if (gap.shape === 'empty') {
				out.push(spacingSite(kind, slotName, { token: EMPTY_SEPARATOR_TOKEN }, config, usedPhantoms, siteSpacing, usedSiteLabels));
			} else if (gap.shape === 'token') {
				out.push(spacingSite(kind, slotName, { token: gap.token, side: 'before' }, config, usedPhantoms, siteSpacing, usedSiteLabels));
				out.push(spacingSite(kind, slotName, { token: gap.token, side: 'after' }, config, usedPhantoms, siteSpacing, usedSiteLabels));
			}
		}
	}
	for (const label of Object.keys(siteSpacing)) {
		if (!usedSiteLabels.has(label)) {
			throw new Error(`${publicKindName(kind)}.${slotName}: spacing preference '${label}' names no separator of this slot`);
		}
	}
	const members = new Set<string>();
	for (const gap of gaps) {
		if (gap.shape !== 'empty' && gap.list !== undefined) {
			for (const m of delimiterMembersFor(gap.list)) members.add(m);
		}
	}
	if (members.size > 0) {
		out.push({
			kind,
			slot: slotName,
			label: DELIMITER_LABEL,
			arms: [...members].map((value) => ({ value })),
			defaultArm: 'Delimiter.None',
			source: 'delimiter'
		});
	}
	return out;
}
