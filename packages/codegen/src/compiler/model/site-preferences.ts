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
import { publicKindName, spacingSitesOf, type RenderRules, type SeatedChild, type SpacingSide } from './render-rules.ts';
import { readOptionsBlock, type OptionsConfig } from '../../dsl/wire/options-block.ts';
import { addressSegments, addressSites, matchAddress, resolveBindings } from './site-addresses.ts';
import type { PreferenceSegment } from '../../dsl/primitives/preference-path.ts';

export { publicKindName, type SpacingSide } from './render-rules.ts';

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
	readonly side?: SpacingSide;
	readonly seat?: SeatedChild;
	readonly path?: readonly PreferenceSegment[];
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
	readonly defaults?: RenderDefaults;
	readonly options?: OptionsConfig;
}

export function collectSitePreferences(config: SitePreferencesConfig): SitePreference[] {
	const out: SitePreference[] = [];
	const candidates: SiteCandidate[] = [];
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AbstractAssembledCompound)) continue;
		for (const slot of node.slots) {
			if (slot.name === undefined) continue;
			const candidate = choiceCandidate(kind, slot, config.kindEntries);
			if (candidate) candidates.push(candidate);
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
				side: site.side,
				...(site.seat === undefined ? {} : { seat: site.seat }),
				...(site.path === undefined ? {} : { path: site.path })
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
		if (arm !== undefined && !arms.includes(arm)) {
			throw new Error(`defaults: ${key.replace(' ', '.')} is '${arm}', not one of ${arms.join(', ')}`);
		}
		consumedSeparators.add(key);
		out.push({
			kind,
			slot,
			address,
			label: SEPARATOR_LABEL,
			arms: arms.map((value) => ({ value, kind: value })),
			defaultArm: arm ?? UNDECLARED_ARM,
			source: 'separator'
		});
	}
	for (const key of declaredSeparators.keys()) {
		if (!consumedSeparators.has(key)) throw new Error(`defaults: ${key.replace(' ', '.')} names no list with a choice separator`);
	}
	const resolved = withDeclaredArms(out, candidates, config);
	for (const site of resolved) {
		if (site.source !== 'separator' || site.defaultArm !== UNDECLARED_ARM) continue;
		throw new Error(
			`options: ${publicKindName(site.kind)}.${site.slot} chooses its separator per instance (${site.arms.map((a) => a.value).join(', ')}); declare its kind under options:`
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
	const kinds = new Set([...config.nodeMap.nodes.keys()].map(publicKindName));
	const { declarations, bindings } = readOptionsBlock(config.options, kinds);
	if (declarations.length === 0) return [...sites];

	const addressed = addressSites(
		[...sites.map((site, siteIndex) => ({ ...site, siteIndex })), ...candidates],
		config.kindEntries
	);
	const admits = (site: { readonly arms: readonly PreferenceArm[] }, arm: string): boolean =>
		site.arms.some((candidate) => candidate.value === arm);

	const armOfLabel = new Map(declarations.map((declaration) => [declaration.path, declaration.arm]));
	for (const { address, arm } of [
		...declarations.map((declaration) => ({ address: declaration.path, arm: declaration.arm })),
		...bindings.map((binding) => ({ address: binding.address, arm: armOfLabel.get(binding.label)! }))
	]) {
		const hits = matchAddress(addressSegments(address), addressed);
		if (hits.length > 0 && !hits.some((site) => admits(site, arm))) {
			throw new Error(
				`options: '${address}' is '${arm}', which no site it names admits (${[...new Set(hits.flatMap((site) => site.arms.map((a) => a.value)))].join(', ')})`
			);
		}
	}

	const out = [...sites];
	for (const [index, arm] of resolveBindings(declarations, bindings, addressed)) {
		const site = addressed[index]!;
		if (!admits(site, arm)) continue;
		if (site.siteIndex === undefined) {
			const { kind, slot, address, label, arms } = site;
			out.push({ kind, slot, address, label, arms, defaultArm: arm, source: 'choice' });
			continue;
		}
		out[site.siteIndex] = { ...sites[site.siteIndex]!, defaultArm: arm };
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

function choiceCandidate(
	kind: string,
	slot: AssembledNonterminal,
	kindEntries: readonly KindEntryLike[]
): SiteCandidate | undefined {
	if (slot.values.length < 2) return undefined;
	const arms: PreferenceArm[] = [];
	for (const v of slot.values) {
		const armK = armKind(v, kindEntries);
		const value = armValue(v, armK);
		if (value === undefined) return undefined;
		arms.push({ value, ...(armK === undefined ? {} : { kind: armK }) });
	}
	const name = slot.name!;
	return {
		kind,
		slot: name,
		address: name,
		label: name,
		arms,
		path: [
			{ kind: 'kind-match', name: publicKindName(kind) },
			{ kind: 'fieldName', name }
		]
	};
}
