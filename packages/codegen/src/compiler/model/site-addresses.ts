import { parseSeamLabel, parseSpacingLabel, parseFlankAddress } from '../../dsl/primitives/spacing.ts';
import {
	comparePreferencePaths,
	parsePreferencePath,
	type PreferenceSegment
} from '../../dsl/primitives/preference-path.ts';
import { findEntryForKindName, type KindEntryLike } from '../generated-metadata.ts';
import { publicKindName, type RuleSpacingSite } from './render-rules.ts';

export interface AddressedSite extends RuleSpacingSite {
	readonly path: readonly PreferenceSegment[];
}

export function addressSites(
	sites: readonly RuleSpacingSite[],
	kindEntries: readonly KindEntryLike[]
): AddressedSite[] {
	return sites
		.map((site) => ({ ...site, path: pathOf(site, kindEntries) }))
		.sort((a, b) => comparePreferencePaths(a.path, b.path));
}

function pathOf(site: RuleSpacingSite, kindEntries: readonly KindEntryLike[]): readonly PreferenceSegment[] {
	const own = publicKindName(site.kind);
	const kind: PreferenceSegment = { kind: 'kind-match', name: own };

	const seam = parseSeamLabel(site.address);
	if (seam !== undefined) {
		const side: PreferenceSegment = { kind: 'name', name: seam.side };
		if (seam.token === own) return [kind, side];
		const text = anonTokenText(kindEntries, seam.token);
		if (text === undefined) {
			throw new Error(`render options: seam '${site.address}' on '${own}' names no anonymous token '${seam.token}'`);
		}
		return [kind, { kind: 'literal', text }, side];
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
