import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import { CHOICE, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../../types/rule.ts';
import { DELIMITER_LABEL, SEPARATOR_LABEL, isDelimiterAddress, isSeparatorAddress, type RenderDefaults } from '../../dsl/primitives/spacing.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	AssembledNonterminal,
	delimiterMembersFor,
	isTerminalValue,
	type NodeOrTerminal
} from './node-map.ts';
import { publicKindName, spacingSitesOf, type RenderRules, type SpacingSide } from './render-rules.ts';

export { publicKindName, type SpacingSide } from './render-rules.ts';

export type PreferenceSource = 'declared' | 'spacing' | 'delimiter' | 'separator';

export interface PreferenceArm {
	readonly value: string;
	readonly kind?: string;
}

export interface SitePreference {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly arms: readonly PreferenceArm[];
	readonly defaultArm: string;
	readonly source: PreferenceSource;
	readonly side?: SpacingSide;
}

export interface SitePreferencesConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEntryLike[];
	readonly renderRules?: RenderRules;
	readonly defaults?: RenderDefaults;
}

export function collectSitePreferences(config: SitePreferencesConfig): SitePreference[] {
	const out: SitePreference[] = [];
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AbstractAssembledCompound)) continue;
		for (const slot of node.slots) {
			if (slot.name === undefined) continue;
			const declared = declaredPreference(kind, slot, config.kindEntries);
			if (declared) out.push(declared);
		}
	}
	if (config.renderRules !== undefined) {
		for (const site of spacingSitesOf(config.renderRules, config.nodeMap)) {
			const arms = site.arms;
			out.push({
				kind: site.kind,
				slot: site.slot,
				address: site.address,
				label: site.label,
				arms: arms.map((arm) => ({ value: arm, kind: arm })),
				defaultArm: site.defaultArm,
				source: 'spacing',
				side: site.side
			});
		}
	}
	const declared = new Map<string, string>();
	for (const [kind, sites] of Object.entries(config.defaults?.sites ?? {})) {
		for (const [address, site] of Object.entries(sites)) {
			if (isDelimiterAddress(address)) declared.set(`${publicKindName(kind)} ${address}`, site.arm);
		}
	}
	const consumed = new Set<string>();
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledList)) continue;
		const slot = node.slots[0]?.name;
		const members = delimiterMembersFor(node);
		if (slot === undefined || members.length === 0) continue;
		const address = `${slot}_${DELIMITER_LABEL}`;
		const key = `${publicKindName(kind)} ${address}`;
		const arm = declared.get(key) ?? 'Delimiter.None';
		if (arm !== 'Delimiter.None' && !members.includes(arm)) {
			throw new Error(`defaults: ${publicKindName(kind)}.${address} is '${arm}', which the list does not admit (${members.join(', ')})`);
		}
		consumed.add(key);
		out.push({ kind, slot, address, label: DELIMITER_LABEL, arms: members.map((value) => ({ value })), defaultArm: arm, source: 'delimiter' });
	}
	for (const key of declared.keys()) {
		if (!consumed.has(key)) throw new Error(`defaults: ${key.replace(' ', '.')} names no list with an optional delimiter`);
	}
	const declaredSeparators = new Map<string, string>();
	for (const [kind, sites] of Object.entries(config.defaults?.sites ?? {})) {
		for (const [address, site] of Object.entries(sites)) {
			if (isSeparatorAddress(address)) declaredSeparators.set(`${publicKindName(kind)} ${address}`, site.arm);
		}
	}
	const consumedSeparators = new Set<string>();
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledList) || node.separatorRule === undefined) continue;
		const slot = node.slots[0]?.name;
		if (slot === undefined) continue;
		const arms = separatorArmKinds(kind, node.separatorRule, config.kindEntries);
		const address = `${slot}_${SEPARATOR_LABEL}`;
		const key = `${publicKindName(kind)} ${address}`;
		const arm = declaredSeparators.get(key);
		if (arm === undefined) {
			throw new Error(
				`defaults: ${publicKindName(kind)}.${slot} chooses its separator per instance (${arms.join(', ')}); declare preference('separator', <kind>) under the slot`
			);
		}
		if (!arms.includes(arm)) throw new Error(`defaults: ${key.replace(' ', '.')} is '${arm}', not one of ${arms.join(', ')}`);
		consumedSeparators.add(key);
		out.push({ kind, slot, address, label: SEPARATOR_LABEL, arms: arms.map((value) => ({ value, kind: value })), defaultArm: arm, source: 'separator' });
	}
	for (const key of declaredSeparators.keys()) {
		if (!consumedSeparators.has(key)) throw new Error(`defaults: ${key.replace(' ', '.')} names no list with a choice separator`);
	}
	return out;
}

function separatorArmKinds(kind: string, rule: RenderRule, kindEntries: readonly KindEntryLike[]): string[] {
	const r = rule as { type: string; value?: string; members?: RenderRule[] };
	if (r.type === STRING && typeof r.value === 'string') {
		const name = tokenKind(r.value, kindEntries);
		if (name === undefined) throw new Error(`defaults: separator token '${r.value}' of ${publicKindName(kind)} has no kind in the catalog`);
		return [name];
	}
	if (r.type === CHOICE && r.members !== undefined) return r.members.flatMap((m) => separatorArmKinds(kind, m, kindEntries));
	throw new Error(`defaults: ${publicKindName(kind)} has a separator of shape ${r.type}; only a literal or a choice of literals is supported`);
}

function tokenKind(text: string, kindEntries: readonly KindEntryLike[]): string | undefined {
	const entry = findEntryForLiteralText(kindEntries, text);
	return entry === undefined ? undefined : publicKindName(entry.kind);
}

function armKind(v: NodeOrTerminal, kindEntries: readonly KindEntryLike[]): string | undefined {
	const node = v.node as { kind?: string; name?: string } | undefined;
	const raw = v.parseKind?.name ?? v.resolvedKind ?? node?.kind ?? node?.name;
	if (raw !== undefined) return publicKindName(raw);
	return isTerminalValue(v) ? tokenKind(v.value, kindEntries) : undefined;
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
	return { kind, slot: slot.name!, address: `${slot.name!}_${label}`, label, arms, defaultArm, source: 'declared' };
}
