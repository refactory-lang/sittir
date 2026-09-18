import { describe, it, expect } from 'vitest';
import { addressSites, matchAddress, matchAddressWith, resolveBindings } from '../site-addresses.ts';
import { parsePreferencePath } from '../../../dsl/primitives/preference-path.ts';
import type { KindEntryLike } from '../../generated-metadata.ts';
import type { RuleSpacingSite } from '../render-rules.ts';

const NO_SUPERTYPES = new Map<string, readonly string[]>();

describe('a supertype segment matches the sites of its members', () => {
	const members = new Map<string, readonly string[]>([['statement', ['block', 'if_statement']]]);
	const sites = addressSites(
		[
			{ kind: 'block', slot: 'x', address: 'x', label: 'x', path: parsePreferencePath('(block)/after') },
			{ kind: 'if_statement', slot: 'x', address: 'x', label: 'x', path: parsePreferencePath('(if_statement)/after') },
			{ kind: 'call', slot: 'x', address: 'x', label: 'x', path: parsePreferencePath('(call)/after') }
		],
		[]
	);
	it('reaches every member and nothing else', () => {
		expect(matchAddress(parsePreferencePath('(statement)/after'), sites, members).map((s) => s.kind)).toEqual(['block', 'if_statement']);
	});
	it('reaches nothing without the membership', () => {
		expect(matchAddress(parsePreferencePath('(statement)/after'), sites, NO_SUPERTYPES)).toEqual([]);
	});
});

describe('a kind-scoped declaration on an envelope reaches only its own edge, never a nested envelope’s own members', () => {
	// Models the rust regression: visibility_modifier_group is-a
	// visibility_modifier_pub_in_path (its own polymorph arm), and that arm's
	// OWN union separately admits scoped_identifier. The correct membership
	// map stops at each envelope's direct arms — it never transitively folds
	// an arm's own reachable content into its parent's membership.
	const correctMembers = new Map<string, readonly string[]>([
		['visibility_modifier_group', ['visibility_modifier_pub_in_path']],
		['visibility_modifier_pub_in_path', ['scoped_identifier']]
	]);
	const buggyMembers = new Map<string, readonly string[]>([
		['visibility_modifier_group', ['visibility_modifier_pub_in_path', 'scoped_identifier']],
		['visibility_modifier_pub_in_path', ['scoped_identifier']]
	]);
	const sites = addressSites(
		[
			{
				kind: 'visibility_modifier_group',
				slot: 'x',
				address: 'x',
				label: 'x',
				path: parsePreferencePath('(visibility_modifier_group)/before')
			},
			{ kind: 'scoped_identifier', slot: 'x', address: 'x', label: 'x', path: parsePreferencePath('(scoped_identifier)/before') }
		],
		[]
	);

	it('with correct membership, hits only its own edge', () => {
		expect(matchAddress(parsePreferencePath('(visibility_modifier_group)/before'), sites, correctMembers).map((s) => s.kind)).toEqual([
			'visibility_modifier_group'
		]);
	});

	it('with the buggy transitive membership, would also hit the unrelated kind', () => {
		expect(
			new Set(matchAddress(parsePreferencePath('(visibility_modifier_group)/before'), sites, buggyMembers).map((s) => s.kind))
		).toEqual(new Set(['visibility_modifier_group', 'scoped_identifier']));
	});
});

const ENTRIES: readonly KindEntryLike[] = [
	{ kind: 'lbrace', symbolName: '{', literalText: '{', anon: true },
	{ kind: 'rbrace', symbolName: '}', literalText: '}', anon: true },
	{ kind: 'lparen', symbolName: '(', literalText: '(', anon: true },
	{ kind: 'comma', symbolName: ',', literalText: ',', anon: true },
	{ kind: 'colon', symbolName: ':', literalText: ':', anon: true },
	{ kind: 'x', symbolName: 'x', literalText: 'x', anon: true },
	{ kind: 'y', symbolName: 'y', literalText: 'y', anon: true },
	{ kind: 'block', symbolName: 'block' }
];

const site = (kind: string, address: string, slot = 'x', label = address): RuleSpacingSite => ({
	kind,
	slot,
	address,
	label,
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

	it('gives a seam named for a field a field segment, not a literal', () => {
		const [addressed] = addressSites([site('token_binding_pattern', 'type_before', 'type')], ENTRIES);
		expect(addressed!.path).toEqual([
			{ kind: 'kind-match', name: 'token_binding_pattern' },
			{ kind: 'fieldName', name: 'type' },
			{ kind: 'name', name: 'before' }
		]);
	});
});

describe('matchAddress', () => {
	it('matches every site beneath a prefix', () => {
		const sites = addressSites(
			[site('block', 'lbrace_after'), site('block', 'rbrace_before'), site('arguments', 'lparen_after')],
			ENTRIES
		);
		const matched = matchAddress(parsePreferencePath('(block)'), sites, NO_SUPERTYPES);
		expect(matched.map((s) => s.kind)).toEqual(['block', 'block']);
	});

	it('matches a single site for a full address', () => {
		const sites = addressSites([site('block', 'lbrace_after'), site('block', 'rbrace_before')], ENTRIES);
		const matched = matchAddress(parsePreferencePath('(block)/"{"/after'), sites, NO_SUPERTYPES);
		expect(matched).toHaveLength(1);
		expect(matched[0]!.address).toBe('lbrace_after');
	});

	it('matches a kind edge by its side alone', () => {
		const sites = addressSites(
			[site('block', 'block_before', 'block'), site('block', 'lbrace_after')],
			ENTRIES
		);
		const matched = matchAddress(parsePreferencePath('(block)/before'), sites, NO_SUPERTYPES);
		expect(matched.map((s) => s.address)).toEqual(['block_before']);
	});

	it('matches any token through a wildcard', () => {
		const sites = addressSites([site('block', 'lbrace_after'), site('block', 'rbrace_before')], ENTRIES);
		const matched = matchAddress(parsePreferencePath('(block)/_/after'), sites, NO_SUPERTYPES);
		expect(matched.map((s) => s.address)).toEqual(['lbrace_after']);
	});

	it('returns nothing for an address naming no site', () => {
		const sites = addressSites([site('block', 'lbrace_after')], ENTRIES);
		expect(matchAddress(parsePreferencePath('(nowhere)/"{"/after'), sites, NO_SUPERTYPES)).toEqual([]);
	});
});

describe('resolveBindings', () => {
	const punctuation = (): ReturnType<typeof addressSites> =>
		addressSites(
			[site('token_tree_punctuation', 'comma_after'), site('token_tree_punctuation', 'colon_after')],
			ENTRIES
		);
	const armsOf = (out: ReturnType<typeof resolveBindings>, sites: ReturnType<typeof addressSites>): Map<string, string> =>
		new Map([...out].map(([i, { arm }]) => [sites[i]!.address, arm]));

	it('applies a broad binding to every site it matches', () => {
		const sites = punctuation();
		const out = resolveBindings(
			[{ path: 'punctuation/after', arm: 'space' }],
			[{ address: 'token_tree_punctuation', label: 'punctuation/after' }],
			sites, NO_SUPERTYPES
		);
		expect([...out.values()].map((v) => v.arm)).toEqual(['space', 'space']);
	});

	it('lets a narrower declaration win over a broader binding', () => {
		const sites = punctuation();
		const out = resolveBindings(
			[
				{ path: 'punctuation/after', arm: 'space' },
				{ path: 'token_tree_punctuation/":"/after', arm: 'tight' }
			],
			[{ address: 'token_tree_punctuation', label: 'punctuation/after' }],
			sites, NO_SUPERTYPES
		);
		const arms = armsOf(out, sites);
		expect(arms.get('comma_after')).toBe('space');
		expect(arms.get('colon_after')).toBe('tight');
	});

	it('lets a declaration win over a binding at the identical address', () => {
		const sites = addressSites([site('keyword_argument', 'eq_before')], [...ENTRIES, { kind: 'eq', symbolName: '=', literalText: '=', anon: true }]);
		const out = resolveBindings(
			[
				{ path: 'assignment/before', arm: 'space' },
				{ path: 'keyword_argument/"="/before', arm: 'tight' }
			],
			[{ address: 'keyword_argument/"="/before', label: 'assignment/before' }],
			sites, NO_SUPERTYPES
		);
		expect([...out.values()].map((v) => v.arm)).toEqual(['tight']);
	});

	it('rejects two addresses whose site sets overlap without nesting', () => {
		const wide = addressSites([site('a', 'x_after'), site('a', 'y_after'), site('b', 'x_after')], ENTRIES);
		expect(() =>
			resolveBindings(
				[
					{ path: 'a/after', arm: 'space' },
					{ path: 'wildcard/after', arm: 'tight' }
				],
				[
					{ address: 'a', label: 'a/after' },
					{ address: '_/"x"/after', label: 'wildcard/after' }
				],
				wide, NO_SUPERTYPES
			)
		).toThrow(/overlap/);
	});

	it('rejects a binding naming no site', () => {
		expect(() =>
			resolveBindings([{ path: 'l/after', arm: 'space' }], [{ address: 'nowhere', label: 'l/after' }], punctuation(), NO_SUPERTYPES)
		).toThrow(/names no site/);
	});

	it('rejects a declaration naming no site and bound to nothing', () => {
		expect(() => resolveBindings([{ path: 'nowhere/after', arm: 'space' }], [], punctuation(), NO_SUPERTYPES)).toThrow(
			/names no site/
		);
	});

	it('allows a label declaration to name no site', () => {
		const sites = punctuation();
		const out = resolveBindings(
			[{ path: 'punctuation/after', arm: 'space' }],
			[{ address: 'token_tree_punctuation', label: 'punctuation/after' }],
			sites, NO_SUPERTYPES
		);
		expect(out.size).toBe(2);
	});
});

describe('a separator gap names its token', () => {
	it('puts the separator token between the position and the side', () => {
		const [addressed] = addressSites(
			[site('arguments', 'elements_separator_space_before', 'elements', 'comma_separator_space_before')],
			ENTRIES
		);
		expect(addressed!.path).toEqual([
			{ kind: 'kind-match', name: 'arguments' },
			{ kind: 'fieldName', name: 'elements' },
			{ kind: 'name', name: 'separator' },
			{ kind: 'literal', text: ',' },
			{ kind: 'name', name: 'before' }
		]);
	});

	it('lets one address reach every comma separator, whatever kind holds it', () => {
		const sites = addressSites(
			[
				site('arguments', 'elements_separator_space_before', 'elements', 'comma_separator_space_before'),
				site('tuple_type', 'types_separator_space_before', 'types', 'comma_separator_space_before'),
				site('object_type', 'content_separator_space_before', 'content', 'colon_separator_space_before')
			],
			ENTRIES
		);
		const matched = matchAddress(parsePreferencePath('_/_/separator/","/before'), sites, NO_SUPERTYPES);
		expect(matched.map((s) => s.kind)).toEqual(['arguments', 'tuple_type']);
	});

	it('lets one kind take an exception to that rule', () => {
		const sites = addressSites(
			[
				site('arguments', 'elements_separator_space_before', 'elements', 'comma_separator_space_before'),
				site('tuple_type', 'types_separator_space_before', 'types', 'comma_separator_space_before')
			],
			ENTRIES
		);
		const arms = resolveBindings(
			[
				{ path: 'comma/before', arm: 'tight' },
				{ path: 'tuple_type/types:/separator/","/before', arm: 'space' }
			],
			[{ address: '_/_/separator/","/before', label: 'comma/before' }],
			sites, NO_SUPERTYPES
		);
		const bySite = new Map([...arms].map(([i, { arm }]) => [sites[i]!.kind, arm]));
		expect(bySite.get('arguments')).toBe('tight');
		expect(bySite.get('tuple_type')).toBe('space');
	});
});

describe('a kind edge answers to its edge token’s face as a cascaded address', () => {
	const kindEntries = [{ kind: 'lparen', anon: true, symbolName: '(', literalText: '(', member: 'Lparen', id: 7 }] as unknown as KindEntryLike[];
	const sites = addressSites(
		[
			{ kind: 'args', slot: 'args', address: 'args_before', label: 'args_before', edgeToken: 'lparen' },
			{ kind: 'args', slot: 'args', address: 'args_after', label: 'args_after' },
			{ kind: 'call', slot: 'lparen', address: 'lparen_before', label: 'lparen_before' }
		],
		kindEntries
	);
	it('matches the grammar-wide token face through the cascade path and marks the hit as cascaded', () => {
		const hits = matchAddressWith(parsePreferencePath('_/"("/before'), sites, NO_SUPERTYPES);
		expect(hits.map((h) => `${h.site.address}${h.cascade ? '~' : ''}`)).toEqual(['args_before~', 'lparen_before']);
		expect(matchAddress(parsePreferencePath('_/"("/after'), sites, NO_SUPERTYPES)).toEqual([]);
	});
	it('never cascades a kind-scoped literal row onto that kind’s own edge', () => {
		const hits = matchAddressWith(parsePreferencePath('args/"("/before'), sites, NO_SUPERTYPES);
		expect(hits).toEqual([]);
	});
	it('resolves a cascaded hit with origin cascade and lets the kind’s own row win over it', () => {
		const resolved = resolveBindings(
			[
				{ path: '_/"("/before', arm: 'tight' },
				{ path: 'args/before', arm: 'space' }
			],
			[],
			sites,
			NO_SUPERTYPES,
			false
		);
		const byAddress = new Map([...resolved].map(([i, v]) => [sites[i]!.address, v]));
		expect(byAddress.get('args_before')).toEqual({ arm: 'space', origin: 'preference' });
		expect(byAddress.get('lparen_before')).toEqual({ arm: 'tight', origin: 'token-default' });
		const cascadedOnly = resolveBindings([{ path: '_/"("/before', arm: 'tight' }], [], sites, NO_SUPERTYPES, false);
		expect(new Map([...cascadedOnly].map(([i, v]) => [sites[i]!.address, v])).get('args_before')).toEqual({ arm: 'tight', origin: 'cascade' });
	});
});
