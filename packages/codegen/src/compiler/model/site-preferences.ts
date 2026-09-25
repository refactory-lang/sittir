import type { NodeMap } from '../types.ts';
import { findEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import { CHOICE, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule, SeamOrigin } from '../../types/rule.ts';
import { DELIMITER_LABEL, SEPARATOR_LABEL, VARIANT_LABEL } from '../../dsl/primitives/spacing.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	AssembledSupertype,
	AssembledNonterminal,
	delimiterMembersFor,
	isNodeRef,
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
		const arms = separatorArmKinds(kind, node.separatorRule, config);
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
	const resolved = withDeclaredArms(out, candidates, config);
	for (const site of resolved) {
		if (site.source !== 'separator' || site.defaultArm !== UNDECLARED_ARM) continue;
		throw new Error(
			`options: ${displayNameOf(site.kind, config.nodeMap)}.${site.slot} chooses its separator per instance (${site.arms.map((a) => a.value).join(', ')}); declare its kind under options:`
		);
	}
	stampResolvedDefaults(resolved, config.nodeMap);
	return resolved;
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
	config: SitePreferencesConfig
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
	const admits = (site: { readonly arms: readonly PreferenceArm[] }, arm: string): boolean =>
		site.arms.some((candidate) => candidate.value === arm);

	const armOfLabel = new Map(declarations.map((declaration) => [declaration.path, declaration.arm]));
	for (const { address, arm } of [
		...declarations.map((declaration) => ({ address: declaration.path, arm: declaration.arm })),
		...bindings.map((binding) => ({ address: binding.address, arm: armOfLabel.get(binding.label)! }))
	]) {
		const hits = matchAddress(addressSegments(address), addressed, membersOf);
		if (hits.length > 0 && !hits.some((site) => admits(site, arm))) {
			throw new Error(
				`options: '${address}' is '${arm}', which no site it names admits (${[...new Set(hits.flatMap((site) => site.arms.map((a) => a.value)))].join(', ')})`
			);
		}
	}

	const out = [...sites];
	for (const [index, { arm, origin }] of resolveBindings(declarations, bindings, addressed, membersOf)) {
		const site = addressed[index]!;
		if (!admits(site, arm)) continue;
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
	slot.registeredOption = mode;
}

function separatorArmKinds(kind: string, rule: RenderRule, config: SitePreferencesConfig): string[] {
	const r = rule as { type: string; value?: string; members?: RenderRule[] };
	if (r.type === STRING && typeof r.value === 'string') {
		const name = tokenKind(r.value, config);
		if (name === undefined) throw new Error(`defaults: separator token '${r.value}' of ${displayNameOf(kind, config.nodeMap)} has no kind in the catalog`);
		return [name];
	}
	if (r.type === CHOICE && r.members !== undefined) return r.members.flatMap((m) => separatorArmKinds(kind, m, config));
	throw new Error(`defaults: ${displayNameOf(kind, config.nodeMap)} has a separator of shape ${r.type}; only a literal or a choice of literals is supported`);
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
	if (slot.values.length < 2) return undefined;
	const arms = armsOf(slot.values, config);
	if (arms === undefined) return undefined;
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
