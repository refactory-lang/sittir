import { EMPTY_SEPARATOR_TOKEN, SEPARATOR_LABEL, parseSeamLabel, parseSpacingLabel, parseFlankAddress } from '../../dsl/primitives/spacing.ts';
import {
	comparePreferencePaths,
	parsePreferencePath,
	type PreferenceSegment
} from '../../dsl/primitives/preference-path.ts';
import { findEntryForKindName, type KindEntryLike } from '../generated-metadata.ts';
import { publicKindName } from './render-rules.ts';
import type { AddressBinding, PathDeclaration } from '../../dsl/wire/options-block.ts';
import type { SupertypeMembers } from './supertype-members.ts';
import type { SeamOrigin } from '../../types/rule.ts';

export interface SiteAddressInput {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly path?: readonly PreferenceSegment[];
	readonly edgeToken?: string;
}

export type AddressedSite<T extends SiteAddressInput = SiteAddressInput> = T & {
	readonly path: readonly PreferenceSegment[];
	readonly cascadePath?: readonly PreferenceSegment[];
};

export function addressSites<T extends SiteAddressInput>(
	sites: readonly T[],
	kindEntries: readonly KindEntryLike[]
): AddressedSite<T>[] {
	return sites
		.map((site) => {
			const cascadePath = cascadePathOf(site, kindEntries);
			return { ...site, path: pathOf(site, kindEntries), ...(cascadePath === undefined ? {} : { cascadePath }) };
		})
		.sort((a, b) => comparePreferencePaths(a.path, b.path));
}

export function cascadePathOf(site: SiteAddressInput, kindEntries: readonly KindEntryLike[]): readonly PreferenceSegment[] | undefined {
	if (site.edgeToken === undefined) return undefined;
	const own = publicKindName(site.kind);
	const seam = parseSeamLabel(site.address);
	if (seam === undefined || seam.token !== own) return undefined;
	const text = anonTokenText(kindEntries, site.edgeToken);
	const token: PreferenceSegment = text === undefined ? { kind: 'fieldName', name: site.edgeToken } : { kind: 'literal', text };
	return [{ kind: 'kind-match', name: own }, token, { kind: 'name', name: seam.side }];
}

export function pathOf(site: SiteAddressInput, kindEntries: readonly KindEntryLike[]): readonly PreferenceSegment[] {
	if (site.path !== undefined) return site.path;
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

	const declared = parseSpacingLabel(site.label);
	if (declared !== undefined) {
		const text =
			declared.token === EMPTY_SEPARATOR_TOKEN || declared.token === own ? undefined : anonTokenText(kindEntries, declared.token);
		const token: readonly PreferenceSegment[] = text === undefined ? [] : [{ kind: 'literal', text }];
		const separator: readonly PreferenceSegment[] = [
			{ kind: 'fieldName', name: site.slot },
			{ kind: 'name', name: 'separator' },
			...token
		];
		return declared.side === undefined ? [kind, ...separator] : [kind, ...separator, { kind: 'name', name: declared.side }];
	}

	if (site.address === `${site.slot}_${site.label}`) {
		const label: PreferenceSegment = { kind: 'name', name: site.label };
		const slot: PreferenceSegment = { kind: 'fieldName', name: site.slot };
		return site.label === SEPARATOR_LABEL ? [kind, slot, label, { kind: 'name', name: 'kind' }] : [kind, slot, label];
	}

	const flank = parseFlankAddress(site.address);
	if (flank !== undefined) {
		return [kind, { kind: 'fieldName', name: site.slot }, { kind: 'name', name: flank.side }];
	}

	return [kind, ...parsePreferencePath(site.address)];
}

function anonTokenText(kindEntries: readonly KindEntryLike[], token: string): string | undefined {
	const entry = findEntryForKindName(kindEntries, token);
	return entry?.anon === true ? entry.literalText : undefined;
}

export function matchAddress<T extends SiteAddressInput>(
	address: readonly PreferenceSegment[],
	sites: readonly AddressedSite<T>[],
	membersOf: SupertypeMembers
): AddressedSite<T>[] {
	return matchAddressWith(address, sites, membersOf).map((hit) => hit.site);
}

export interface AddressHit<T extends SiteAddressInput> {
	readonly site: AddressedSite<T>;
	readonly cascade: boolean;
}

export function matchAddressWith<T extends SiteAddressInput>(
	address: readonly PreferenceSegment[],
	sites: readonly AddressedSite<T>[],
	membersOf: SupertypeMembers
): AddressHit<T>[] {
	const out: AddressHit<T>[] = [];
	const cascades = isWildcardHead(address);
	for (const site of sites) {
		if (isPrefixOf(address, site.path, membersOf)) out.push({ site, cascade: false });
		else if (cascades && site.cascadePath !== undefined && isPrefixOf(address, site.cascadePath, membersOf)) out.push({ site, cascade: true });
	}
	return out;
}

/// Only a grammar-wide (`_`-scope) token face cascades onto a kind edge: a
/// kind-scoped literal row names the token's interior seam in that kind, and
/// must not reach the exterior edge of a kind that closes with the same
/// literal it opened with.
function isWildcardHead(address: readonly PreferenceSegment[]): boolean {
	const head = address[0];
	return head !== undefined && (head.kind === 'wildcard' || (head.kind === 'kind-match' && head.name === '_'));
}

function isPrefixOf(
	address: readonly PreferenceSegment[],
	path: readonly PreferenceSegment[],
	membersOf: SupertypeMembers
): boolean {
	if (address.length > path.length) return false;
	for (let i = 0; i < address.length; i++) {
		if (!segmentMatches(address[i]!, path[i]!, membersOf)) return false;
	}
	return true;
}

function segmentMatches(a: PreferenceSegment, b: PreferenceSegment, membersOf: SupertypeMembers): boolean {
	if (a.kind === 'wildcard') return true;
	if (a.kind !== b.kind) return false;
	switch (a.kind) {
		case 'index':
			return a.value === (b as { value: number }).value;
		case 'literal':
			return a.text === (b as { text: string }).text;
		case 'kind-match': {
			const name = (b as { name: string }).name;
			return a.name === '_' || a.name === name || (membersOf.get(a.name)?.includes(name) ?? false);
		}
		case 'fieldName':
		case 'name':
			return a.name === (b as { name: string }).name;
		default:
			return true;
	}
}

export type PreferenceOrigin = Exclude<SeamOrigin, 'fallback' | 'word-default'>;

function originOf(address: string): PreferenceOrigin {
	return addressSegments(address)[0]?.kind === 'wildcard' ? 'token-default' : 'preference';
}

export function resolveBindings(
	declarations: readonly PathDeclaration[],
	bindings: readonly AddressBinding[],
	sites: readonly AddressedSite[],
	membersOf: SupertypeMembers,
	requireHit: boolean = true
): Map<number, { readonly arm: string; readonly origin: PreferenceOrigin }> {
	const indexOf = new Map(sites.map((site, i) => [site, i]));
	const armOfLabel = new Map(declarations.map((declaration) => [declaration.path, declaration.arm]));
	const labelled = new Set(bindings.map((binding) => binding.label));

	const hitsOf = (address: string): { hits: Set<number>; cascaded: Set<number> } => {
		const hits = new Set<number>();
		const cascaded = new Set<number>();
		for (const { site, cascade } of matchAddressWith(addressSegments(address), sites, membersOf)) {
			const index = indexOf.get(site)!;
			hits.add(index);
			if (cascade) cascaded.add(index);
		}
		return { hits, cascaded };
	};

	const entries: { address: string; arm: string; declared: boolean; hits: Set<number>; cascaded: Set<number> }[] = [];

	for (const binding of bindings) {
		const arm = armOfLabel.get(binding.label);
		if (arm === undefined) throw new Error(`options: '${binding.address}' resolves to no arm`);
		const { hits, cascaded } = hitsOf(binding.address);
		if (hits.size === 0) {
			if (!requireHit) continue;
			throw new Error(`options: '${binding.address}' names no site`);
		}
		entries.push({ address: binding.address, arm, declared: false, hits, cascaded });
	}

	for (const declaration of declarations) {
		const { hits, cascaded } = hitsOf(declaration.path);
		if (hits.size === 0) {
			if (labelled.has(declaration.path) || !requireHit) continue;
			throw new Error(`options: '${declaration.path}' names no site`);
		}
		entries.push({ address: declaration.path, arm: declaration.arm, declared: true, hits, cascaded });
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

	const out = new Map<number, { readonly arm: string; readonly origin: PreferenceOrigin }>();
	const order = [...entries].sort((a, b) => b.hits.size - a.hits.size || Number(a.declared) - Number(b.declared));
	for (const { arm, hits, cascaded, address } of order) {
		const origin = originOf(address);
		for (const site of hits) out.set(site, { arm, origin: cascaded.has(site) ? 'cascade' : origin });
	}
	return out;
}

export function addressSegments(text: string): readonly PreferenceSegment[] {
	const segments = parsePreferencePath(text);
	const head = segments[0];
	return head !== undefined && head.kind === 'name'
		? [{ kind: 'kind-match', name: head.name }, ...segments.slice(1)]
		: segments;
}
