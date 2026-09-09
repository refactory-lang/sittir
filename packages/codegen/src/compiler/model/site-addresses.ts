import { parseSeamLabel, parseSpacingLabel, parseFlankAddress } from '../../dsl/primitives/spacing.ts';
import {
	comparePreferencePaths,
	parsePreferencePath,
	type PreferenceSegment
} from '../../dsl/primitives/preference-path.ts';
import { findEntryForKindName, type KindEntryLike } from '../generated-metadata.ts';
import { publicKindName } from './render-rules.ts';
import type { AddressBinding, PathDeclaration } from '../../dsl/wire/options-block.ts';

export interface SiteAddressInput {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
}

export type AddressedSite<T extends SiteAddressInput = SiteAddressInput> = T & {
	readonly path: readonly PreferenceSegment[];
};

export function addressSites<T extends SiteAddressInput>(
	sites: readonly T[],
	kindEntries: readonly KindEntryLike[]
): AddressedSite<T>[] {
	return sites
		.map((site) => ({ ...site, path: pathOf(site, kindEntries) }))
		.sort((a, b) => comparePreferencePaths(a.path, b.path));
}

export function pathOf(site: SiteAddressInput, kindEntries: readonly KindEntryLike[]): readonly PreferenceSegment[] {
	const own = publicKindName(site.kind);
	const kind: PreferenceSegment = { kind: 'kind-match', name: own };

	const seam = parseSeamLabel(site.address);
	if (seam !== undefined) {
		const side: PreferenceSegment = { kind: 'name', name: seam.side };
		if (seam.token === own) return [kind, side];
		const text = anonTokenText(kindEntries, seam.token);
		return text === undefined
			? [kind, { kind: 'fieldName', name: seam.token }, side]
			: [kind, { kind: 'literal', text }, side];
	}

	const spacing = parseSpacingLabel(site.address);
	if (spacing !== undefined) {
		const separator: readonly PreferenceSegment[] = [
			{ kind: 'fieldName', name: site.slot },
			{ kind: 'name', name: 'separator' }
		];
		return spacing.side === undefined ? [kind, ...separator] : [kind, ...separator, { kind: 'name', name: spacing.side }];
	}

	const flank = parseFlankAddress(site.address);
	if (flank !== undefined) {
		return [kind, { kind: 'fieldName', name: site.slot }, { kind: 'name', name: flank.side }];
	}

	return [kind, ...parsePreferencePath(site.address)];
}

function anonTokenText(kindEntries: readonly KindEntryLike[], token: string): string | undefined {
	const entry = findEntryForKindName(kindEntries, token);
	return entry?.anon === true ? entry.symbolName : undefined;
}

export function matchAddress(
	address: readonly PreferenceSegment[],
	sites: readonly AddressedSite[]
): AddressedSite[] {
	return sites.filter((site) => isPrefixOf(address, site.path));
}

function isPrefixOf(address: readonly PreferenceSegment[], path: readonly PreferenceSegment[]): boolean {
	if (address.length > path.length) return false;
	for (let i = 0; i < address.length; i++) {
		if (!segmentMatches(address[i]!, path[i]!)) return false;
	}
	return true;
}

function segmentMatches(a: PreferenceSegment, b: PreferenceSegment): boolean {
	if (a.kind === 'wildcard') return true;
	if (a.kind !== b.kind) return false;
	switch (a.kind) {
		case 'index':
			return a.value === (b as { value: number }).value;
		case 'literal':
			return a.text === (b as { text: string }).text;
		case 'kind-match':
			return a.name === '_' || a.name === (b as { name: string }).name;
		case 'fieldName':
		case 'name':
			return a.name === (b as { name: string }).name;
		default:
			return true;
	}
}

export function resolveBindings(
	declarations: readonly PathDeclaration[],
	bindings: readonly AddressBinding[],
	sites: readonly AddressedSite[]
): Map<number, string> {
	const indexOf = new Map(sites.map((site, i) => [site, i]));
	const armOfLabel = new Map(declarations.map((declaration) => [declaration.path, declaration.arm]));
	const labelled = new Set(bindings.map((binding) => binding.label));

	const hitsOf = (address: string): Set<number> =>
		new Set(matchAddress(addressSegments(address), sites).map((site) => indexOf.get(site)!));

	const entries: { address: string; arm: string; declared: boolean; hits: Set<number> }[] = [];

	for (const binding of bindings) {
		const arm = armOfLabel.get(binding.label);
		if (arm === undefined) throw new Error(`options: '${binding.address}' resolves to no arm`);
		const hits = hitsOf(binding.address);
		if (hits.size === 0) throw new Error(`options: '${binding.address}' names no site`);
		entries.push({ address: binding.address, arm, declared: false, hits });
	}

	for (const declaration of declarations) {
		const hits = hitsOf(declaration.path);
		if (hits.size === 0) {
			if (labelled.has(declaration.path)) continue;
			throw new Error(`options: '${declaration.path}' names no site`);
		}
		entries.push({ address: declaration.path, arm: declaration.arm, declared: true, hits });
	}

	for (let i = 0; i < entries.length; i++) {
		for (let j = i + 1; j < entries.length; j++) {
			const a = entries[i]!.hits;
			const b = entries[j]!.hits;
			if (![...a].some((site) => b.has(site))) continue;
			const nests = [...a].every((site) => b.has(site)) || [...b].every((site) => a.has(site));
			if (!nests) {
				throw new Error(
					`options: '${entries[i]!.address}' and '${entries[j]!.address}' overlap without one containing the other`
				);
			}
		}
	}

	const out = new Map<number, string>();
	const order = [...entries].sort((a, b) => b.hits.size - a.hits.size || Number(a.declared) - Number(b.declared));
	for (const { arm, hits } of order) {
		for (const site of hits) out.set(site, arm);
	}
	return out;
}

function addressSegments(text: string): readonly PreferenceSegment[] {
	const segments = parsePreferencePath(text);
	const head = segments[0];
	return head !== undefined && head.kind === 'name'
		? [{ kind: 'kind-match', name: head.name }, ...segments.slice(1)]
		: segments;
}
