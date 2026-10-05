import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, findOwnKindEntry, type KindEntryLike } from '../../dsl/symbol-table.ts';
import { STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import type { SeamOrigin } from '../../types/rule.ts';
import { DELIMITER_LABEL, SEPARATOR_LABEL, VARIANT_LABEL } from '../../dsl/primitives/spacing.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	AssembledSupertype,
	AssembledNonterminal,
	delimiterMembersFor,
	isNodeRef,
	isRequired,
	isTerminalValue,
	storageKindOfRef,
	type NodeOrTerminal
} from './node-map.ts';
import { spacingSitesOf, type RenderRules, type SeatedChild, type SpacingSide } from './render-rules.ts';
import { readOptionsBlock, type OptionsConfig } from '../../dsl/wire/options-block.ts';
import { addressSegments, addressSites, matchAddress, resolveBindings } from './site-addresses.ts';
import { supertypeMembersByDisplayName } from './supertype-members.ts';
import type { PreferenceSegment } from '../../dsl/primitives/preference-path.ts';

export { type SpacingSide } from './render-rules.ts';
import { displayNameOf, displayNameOfEntry, displayOfParserName, displayedKinds } from './display-name.ts';

const UNDECLARED_ARM = '';
export const BLANK_ARM = 'blank';
export const BLANK_KIND_ID = 0;

export function admitsArm(site: { readonly arms: readonly PreferenceArm[] }, arm: string): boolean {
	return site.arms.some((candidate) => candidate.value === arm);
}

export function hasBlankArm(slot: AssembledNonterminal): boolean {
	return slot.registeredOption === 'choice' && !isRequired(slot);
}

export type PreferenceSource = 'declared' | 'spacing' | 'delimiter' | 'separator' | 'choice';

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
	readonly origin?: SeamOrigin;
	readonly side?: SpacingSide;
	readonly seat?: SeatedChild;
	readonly path?: readonly PreferenceSegment[];
	readonly edgeLiterals?: readonly string[];
}

export interface SiteCandidate {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly arms: readonly PreferenceArm[];
	readonly path: readonly PreferenceSegment[];
	readonly siteIndex?: number;
}

export interface SitePreferencesConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEntryLike[];
	readonly renderRules?: RenderRules;
	readonly options?: OptionsConfig;
}

export function collectSitePreferences(config: SitePreferencesConfig): SitePreference[] {
	const sites = resolveSitePreferences(config, true).filter((site) => !isUndeclaredSeparator(site));
	stampResolvedDefaults(sites, config.nodeMap);
	return sites;
}

export function undeclaredSeparatorSites(config: SitePreferencesConfig): SitePreference[] {
	return resolveSitePreferences(config, false).filter(isUndeclaredSeparator);
}

function isUndeclaredSeparator(site: SitePreference): boolean {
	return site.source === 'separator' && site.defaultArm === UNDECLARED_ARM;
}

function resolveSitePreferences(config: SitePreferencesConfig, requireHit: boolean): SitePreference[] {
	const out: SitePreference[] = [];
	const candidates: SiteCandidate[] = [];
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AbstractAssembledCompound)) continue;
		for (const slot of node.slots) {
			if (slot.name === undefined) continue;
			const candidate = choiceCandidate(kind, slot, config);
			if (candidate) candidates.push(candidate);
		}
	}
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		const candidate = variantChoiceCandidate(kind, node, config);
		if (candidate) candidates.push(candidate);
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
				side: site.side,
				...(site.origin === undefined ? {} : { origin: site.origin }),
				...(site.seat === undefined ? {} : { seat: site.seat }),
				...(site.path === undefined ? {} : { path: site.path }),
				...(site.edgeLiterals === undefined ? {} : { edgeLiterals: site.edgeLiterals })
			});
		}
	}
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledList)) continue;
		const slot = node.slots[0]?.name;
		const members = delimiterMembersFor(node);
		if (slot === undefined || members.length === 0) continue;
		const address = `${slot}_${DELIMITER_LABEL}`;
		out.push({ kind, slot, address, label: DELIMITER_LABEL, arms: members.map((value) => ({ value })), defaultArm: 'Delimiter.None', source: 'delimiter' });
	}
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledList) || node.separatorRule === undefined) continue;
		const slot = node.slots[0]?.name;
		if (slot === undefined) continue;
		const arms = separatorArmKinds(node, config);
		const address = `${slot}_${SEPARATOR_LABEL}`;
		out.push({
			kind,
			slot,
			address,
			label: SEPARATOR_LABEL,
			arms: arms.map((value) => ({ value, kind: value })),
			defaultArm: UNDECLARED_ARM,
			source: 'separator'
		});
	}
	return withDeclaredArms(out, candidates, config, requireHit);
}

function stampResolvedDefaults(sites: readonly SitePreference[], nodeMap: NodeMap): void {
	for (const site of sites) {
		const node = nodeMap.nodes.get(site.kind);
		if (node instanceof AssembledList) {
			if (site.source === 'delimiter') node.resolvedDelimiterArm = site.defaultArm;
			else if (site.source === 'separator') node.resolvedSeparatorArm = site.defaultArm;
		}
		if (site.source !== 'choice' || !(node instanceof AbstractAssembledCompound)) continue;
		const slot = node.slots.find((candidate) => candidate.name === site.slot);
		if (slot !== undefined) slot.optionDefaultArm = site.defaultArm;
	}
}

function withDeclaredArms(
	sites: readonly SitePreference[],
	candidates: readonly SiteCandidate[],
	config: SitePreferencesConfig,
	requireHit: boolean
): SitePreference[] {
	if (config.options === undefined) return [...sites];
	const kinds = displayedKinds(config.nodeMap);
	const { declarations, bindings } = readOptionsBlock(config.options, kinds);
	if (declarations.length === 0) return [...sites];

	const addressed = addressSites(
		[...sites.map((site, siteIndex) => ({ ...site, siteIndex })), ...candidates],
		config.kindEntries,
		config.nodeMap
	);
	const membersOf = supertypeMembersByDisplayName(config.nodeMap);

	const armOfLabel = new Map(declarations.map((declaration) => [declaration.path, declaration.arm]));
	for (const { address, arm } of [
		...declarations.map((declaration) => ({ address: declaration.path, arm: declaration.arm })),
		...bindings.map((binding) => ({ address: binding.address, arm: armOfLabel.get(binding.label)! }))
	]) {
		const hits = matchAddress(addressSegments(address), addressed, membersOf);
		if (hits.length > 0 && !hits.some((site) => admitsArm(site, arm))) {
			throw new Error(
				`options: '${address}' is '${arm}', which no site it names admits (${[...new Set(hits.flatMap((site) => site.arms.map((a) => a.value)))].join(', ')})`
			);
		}
	}

	const out = [...sites];
	for (const [index, { arm, origin }] of resolveBindings(declarations, bindings, addressed, membersOf, requireHit)) {
		const site = addressed[index]!;
		if (!admitsArm(site, arm)) continue;
		if (site.siteIndex === undefined) {
			const isSpelling = site.arms.every((candidate) => candidate.kind === undefined);
			registerSlot(config.nodeMap, site, arm, isSpelling ? 'spelling' : 'choice');
			if (isSpelling) continue;
			const { kind, slot, address, label, arms, path } = site;
			out.push({ kind, slot, address, label, arms, path, defaultArm: arm, source: 'choice', origin });
			continue;
		}
		out[site.siteIndex] = { ...sites[site.siteIndex]!, defaultArm: arm, origin };
	}
	return out;
}

function registerSlot(nodeMap: NodeMap, site: SiteCandidate, arm: string, mode: 'spelling' | 'choice'): void {
	const node = nodeMap.nodes.get(site.kind);
	if (node instanceof AssembledSupertype) {
		node.optionDefaultArm = arm;
		return;
	}
	const slot = node instanceof AbstractAssembledCompound ? node.slots.find((candidate) => candidate.name === site.slot) : undefined;
	if (slot === undefined) return;
	slot.optionDefaultArm = arm;
	slot.optionDefaultKind = site.arms.find((candidate) => candidate.value === arm)?.kind;
	slot.registeredOption = mode;
	if (mode === 'choice') slot.storageInfo = undefined;
}

function separatorArmKinds(node: AssembledList, config: SitePreferencesConfig): string[] {
	return node.separatorTokenArms.map((arm) => {
		if (arm.type === STRING) {
			const name = tokenKind(arm.value, config);
			if (name === undefined) throw new Error(`defaults: separator token '${arm.value}' of ${displayNameOf(node.kind, config.nodeMap)} has no kind in the catalog`);
			return name;
		}
		const entry = findOwnKindEntry(config.kindEntries, arm.name);
		if (entry === undefined) throw new Error(`defaults: separator token '${arm.name}' of ${displayNameOf(node.kind, config.nodeMap)} has no kind in the catalog`);
		return displayNameOfEntry(entry, config.kindEntries);
	});
}

function tokenKind(text: string, config: SitePreferencesConfig): string | undefined {
	const entry = findEntryForLiteralText(config.kindEntries, text);
	return entry === undefined ? undefined : displayNameOfEntry(entry, config.kindEntries);
}

function armKind(v: NodeOrTerminal, config: SitePreferencesConfig): string | undefined {
	if (v.parseKind !== undefined) return displayOfParserName(v.parseKind.name);
	const storage = v.resolvedKind ?? (isNodeRef(v) ? storageKindOfRef(v.node) : undefined);
	if (storage !== undefined) return displayNameOf(storage, config.nodeMap);
	return isTerminalValue(v) ? tokenKind(v.value, config) : undefined;
}

function armValue(v: NodeOrTerminal, kind: string | undefined): string | undefined {
	return isTerminalValue(v) ? v.value : (v.variant ?? kind);
}

function armsOf(values: readonly NodeOrTerminal[], config: SitePreferencesConfig): PreferenceArm[] | undefined {
	const arms: PreferenceArm[] = [];
	for (const v of values) {
		const armK = armKind(v, config);
		const value = armValue(v, armK);
		if (value === undefined) return undefined;
		arms.push({ value, ...(armK === undefined ? {} : { kind: armK }) });
	}
	return arms;
}

function variantChoiceCandidate(
	kind: string,
	node: AssembledSupertype,
	config: SitePreferencesConfig
): SiteCandidate | undefined {
	const variants = node.variantSubtypes;
	const arms = variants === undefined ? undefined : armsOf(variants, config);
	if (arms === undefined) return undefined;
	const name = displayNameOf(kind, config.nodeMap);
	return {
		kind,
		slot: '',
		address: VARIANT_LABEL,
		label: VARIANT_LABEL,
		arms,
		path: [
			{ kind: 'kind-match', name },
			{ kind: 'name', name: VARIANT_LABEL }
		]
	};
}

function choiceCandidate(
	kind: string,
	slot: AssembledNonterminal,
	config: SitePreferencesConfig
): SiteCandidate | undefined {
	const valued = armsOf(slot.values, config);
	if (valued === undefined) return undefined;
	const blank = !isRequired(slot) && valued.every((arm) => arm.kind !== undefined);
	const arms = blank ? [...valued, { value: BLANK_ARM }] : valued;
	if (arms.length < 2) return undefined;
	const name = slot.name!;
	return {
		kind,
		slot: name,
		address: name,
		label: name,
		arms,
		path: [
			{ kind: 'kind-match', name: displayNameOf(kind, config.nodeMap) },
			{ kind: 'fieldName', name }
		]
	};
}
