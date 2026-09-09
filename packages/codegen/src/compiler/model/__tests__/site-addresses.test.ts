import { describe, it, expect } from 'vitest';
import { addressSites, matchAddress } from '../site-addresses.ts';
import { parsePreferencePath } from '../../../dsl/primitives/preference-path.ts';
import type { KindEntryLike } from '../../generated-metadata.ts';
import type { RuleSpacingSite } from '../render-rules.ts';

const ENTRIES: readonly KindEntryLike[] = [
	{ kind: 'lbrace', symbolName: '{', anon: true },
	{ kind: 'rbrace', symbolName: '}', anon: true },
	{ kind: 'lparen', symbolName: '(', anon: true },
	{ kind: 'block', symbolName: 'block' }
];

const site = (kind: string, address: string, slot = 'x'): RuleSpacingSite => ({
	kind,
	slot,
	address,
	label: address,
	side: 'before',
	defaultArm: 'tight',
	arms: ['tight', 'space']
});

describe('addressSites', () => {
	it('sorts sites into canonical path order', () => {
		const sorted = addressSites([site('block', 'rbrace_before'), site('block', 'lbrace_after')], ENTRIES);
		expect(sorted.map((s) => s.address)).toEqual(['lbrace_after', 'rbrace_before']);
	});

	it('gives a token seam a literal segment carrying the token text', () => {
		const [addressed] = addressSites([site('block', 'lbrace_after')], ENTRIES);
		expect(addressed!.path).toEqual([
			{ kind: 'kind-match', name: 'block' },
			{ kind: 'literal', text: '{' },
			{ kind: 'name', name: 'after' }
		]);
	});

	it("gives a kind edge the kind's own side, with no token segment", () => {
		const [addressed] = addressSites([site('block', 'block_before', 'block')], ENTRIES);
		expect(addressed!.path).toEqual([
			{ kind: 'kind-match', name: 'block' },
			{ kind: 'name', name: 'before' }
		]);
	});

	it('sorts a kind edge before the seams beneath it', () => {
		const sorted = addressSites(
			[site('block', 'lbrace_after'), site('block', 'block_before', 'block')],
			ENTRIES
		);
		expect(sorted.map((s) => s.address)).toEqual(['lbrace_after', 'block_before']);
	});

	it('refuses a seam token that names no anonymous token', () => {
		expect(() => addressSites([site('block', 'nosuch_after')], ENTRIES)).toThrow(/names no anonymous token/);
	});
});

describe('matchAddress', () => {
	it('matches every site beneath a prefix', () => {
		const sites = addressSites(
			[site('block', 'lbrace_after'), site('block', 'rbrace_before'), site('arguments', 'lparen_after')],
			ENTRIES
		);
		const matched = matchAddress(parsePreferencePath('(block)'), sites);
		expect(matched.map((s) => s.kind)).toEqual(['block', 'block']);
	});

	it('matches a single site for a full address', () => {
		const sites = addressSites([site('block', 'lbrace_after'), site('block', 'rbrace_before')], ENTRIES);
		const matched = matchAddress(parsePreferencePath('(block)/"{"/after'), sites);
		expect(matched).toHaveLength(1);
		expect(matched[0]!.address).toBe('lbrace_after');
	});

	it('matches a kind edge by its side alone', () => {
		const sites = addressSites(
			[site('block', 'block_before', 'block'), site('block', 'lbrace_after')],
			ENTRIES
		);
		const matched = matchAddress(parsePreferencePath('(block)/before'), sites);
		expect(matched.map((s) => s.address)).toEqual(['block_before']);
	});

	it('matches any token through a wildcard', () => {
		const sites = addressSites([site('block', 'lbrace_after'), site('block', 'rbrace_before')], ENTRIES);
		const matched = matchAddress(parsePreferencePath('(block)/_/after'), sites);
		expect(matched.map((s) => s.address)).toEqual(['lbrace_after']);
	});

	it('returns nothing for an address naming no site', () => {
		const sites = addressSites([site('block', 'lbrace_after')], ENTRIES);
		expect(matchAddress(parsePreferencePath('(nowhere)/"{"/after'), sites)).toEqual([]);
	});
});
