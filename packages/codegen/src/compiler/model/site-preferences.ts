import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import { DELIMITER_LABEL, FLANK_END_ARMS, FLANK_START_ARMS, SPACING_ARMS } from '../../dsl/primitives/spacing.ts';
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

export type PreferenceSource = 'declared' | 'spacing' | 'delimiter';

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
			const arms = site.side === 'start' ? FLANK_START_ARMS : site.side === 'end' ? FLANK_END_ARMS : SPACING_ARMS;
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
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledList)) continue;
		const slot = node.slots[0]?.name;
		const members = delimiterMembersFor(node);
		if (slot === undefined || members.length === 0) continue;
		out.push({
			kind,
			slot,
			address: `${slot}_${DELIMITER_LABEL}`,
			label: DELIMITER_LABEL,
			arms: members.map((value) => ({ value })),
			defaultArm: 'Delimiter.None',
			source: 'delimiter'
		});
	}
	return out;
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
