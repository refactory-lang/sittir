import { describe, expect, it } from 'vitest';
import { deriveAddressTables, hintEmitterOf, renderOptionsModule, type ArmTypeResolver } from '../options.ts';
import type { PreferenceArm, SitePreference } from '../../compiler/model/site-preferences.ts';
import { siteKey } from '../../dsl/primitives/spacing.ts';

const armType: ArmTypeResolver = (arm) => (arm.kind === undefined ? arm.value : `TSKindId.${arm.kind}`);
const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));

function spacing(kind: string, slot: string, label: string, defaultArm = 'space'): SitePreference {
	return { kind, slot, address: siteKey(slot, label), label, arms: SPACING, defaultArm, source: 'spacing' };
}

function terminator(kind: string): SitePreference {
	return {
		kind,
		slot: 'terminator',
		address: 'terminator_statement_terminator',
		label: 'statement_terminator',
		arms: [
			{ value: 'automatic_semicolon', kind: 'automatic_semicolon' },
			{ value: ';', kind: 'semi' }
		],
		defaultArm: ';',
		source: 'declared'
	};
}

describe('renderOptionsModule', () => {
	const kindEntries = [
		{ kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true },
		{ kind: 'semi', member: 'Semi', symbolName: ';', literalText: ';', anon: true },
		{ kind: 'tight', member: 'tight' },
		{ kind: 'space', member: 'space' },
		{ kind: 'newline', member: 'newline' }
	];

	it('derives Options from the kinds\' hint namespaces and the label roots; no address tables', () => {
		const spacingType = 'TSKindId.tight | TSKindId.space | TSKindId.newline';
		const delimiter: SitePreference = {
			kind: 'formal_parameters',
			slot: 'elements',
			address: 'elements_delimiter',
			label: 'delimiter',
			arms: [{ value: 'Delimiter.Trailing' }],
			defaultArm: 'Delimiter.None',
			source: 'delimiter'
		};
		const sites = [terminator('return_statement'), spacing('formal_parameters', 'elements', 'comma_separator_space_after'), delimiter];
		const arms = { spacingType, whitespaceType: spacingType };
		const addresses = deriveAddressTables(sites, kindEntries, armType, new Map());
		const hints = hintEmitterOf(addresses, kindEntries, arms, new Set(['formal_parameters']));
		expect(hints.roots.find((r) => r.name === 'formal_parameters')?.hint).toBe('{ readonly elements?: { readonly delimiter?: Delimiter.Trailing; readonly separator?: { readonly comma?: { readonly after?: SpacingArm } } } }');
		expect(hints.roots.filter((r) => r.label).map((r) => [r.name, r.key])).toEqual([['return_statement', 'returnStatement']]);
		const src = renderOptionsModule({ arms, hints });
		expect(src).toContain("import type { DerivedOptions } from '@sittir/types';");
		expect(src).toContain("import type { TSKindId, SpacingArm, WhitespaceArm } from './types.js';");
		expect(src).toContain('export type { SpacingArm, WhitespaceArm };');
		expect(src).toContain('export interface LabelOptions {\n\treadonly returnStatement?: { readonly terminator?: { readonly statementTerminator?: TSKindId.automatic_semicolon | TSKindId.semi } };\n}');
		expect(src).toContain('export type Options = DerivedOptions<T.OptionsHintMap> & LabelOptions;');
		expect(src).not.toMatch(/AddressRoot|AddressBranch|AddressLeaf|AddressedOptions|export const/);
	});

	it('spells every key camel-cased, including literal tokens and list kinds', () => {
		const entries = [...kindEntries, { kind: 'colon_colon', member: 'ColonColon', symbolName: '::', literalText: '::', anon: true }];
		const site: SitePreference = { kind: 'token_tree_punctuation', slot: 'colon_colon', address: 'colon_colon_after', label: 'colon_colon_after', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const hints = hintEmitterOf(deriveAddressTables([site], entries, armType, new Map()), entries, undefined, new Set());
		expect(hints.roots.map((r) => [r.key, r.label])).toEqual([['tokenTreePunctuation', true]]);
		expect(renderOptionsModule({ hints })).toContain('readonly tokenTreePunctuation?: { readonly colonColon?: { readonly after?: TSKindId.tight | TSKindId.space | TSKindId.newline } };');
	});

	it('types a site that admits indent and dedent by the wider union', () => {
		const spacingType = 'TSKindId.tight | TSKindId.space | TSKindId.newline';
		const whitespaceType = `${spacingType} | TSKindId.indent | TSKindId.dedent`;
		const WHITESPACE = ['tight', 'space', 'newline', 'indent', 'dedent'].map((k) => ({ value: k, kind: k }));
		const edge: SitePreference = { kind: 'block', slot: 'block', address: 'block_before', label: 'block_before', arms: WHITESPACE, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const hints = hintEmitterOf(deriveAddressTables([edge], kindEntries, armType, new Map()), kindEntries, { spacingType, whitespaceType }, new Set(['block']));
		expect(hints.roots.map((r) => [r.key, r.hint])).toEqual([['block', '{ readonly before?: WhitespaceArm }']]);
	});
});

describe('deriveAddressTables', () => {
	const addressArm = (arm: PreferenceArm): string => `TSKindId.${arm.kind ?? arm.value}`;
	const kindEntries = [
		{ kind: 'lbrace', member: 'Lbrace', symbolName: '{', literalText: '{', anon: true },
		{ kind: 'tight', member: 'Tight' },
		{ kind: 'space', member: 'Space' }
	];
	const arms = ['tight', 'space'].map((k) => ({ value: k, kind: k }));
	const site = (kind: string, slot: string, address: string): SitePreference => ({
		kind,
		slot,
		address,
		label: address,
		arms,
		defaultArm: 'tight',
		source: 'spacing',
		side: 'seam'
	});

	it('splits an address into the branches above a site and the site itself', () => {
		const tables = deriveAddressTables([site('block', 'lbrace', 'lbrace_after'), site('block', 'block', 'block_before')], kindEntries, addressArm, new Map());
		expect(tables.roots).toEqual(['block']);
		expect(tables.branches).toEqual([
			{ path: 'block', children: ['before', 'lbrace'], segments: [{ kind: 'kind-match', name: 'block' }] },
			{
				path: 'block/lbrace',
				children: ['after'],
				segments: [
					{ kind: 'kind-match', name: 'block' },
					{ kind: 'literal', text: '{' }
				]
			}
		]);
		expect(tables.leaves.map((l) => l.path)).toEqual(['block/before', 'block/lbrace/after']);
		expect(tables.depth).toBe(3);
	});


	it('rejects a literal segment whose text has no kind entry', () => {
		const orphanLiteral: SitePreference = {
			...site('block', 'lbrace', 'lbrace_after'),
			path: [{ kind: 'kind-match', name: 'block' }, { kind: 'literal', text: '\u00a4' }, { kind: 'name', name: 'after' }]
		};
		expect(() => deriveAddressTables([orphanLiteral], kindEntries, addressArm, new Map())).toThrow(
			'options: literal "\u00a4" has no kind name'
		);
	});

	it('rejects a literal and a same-spelled name segment at the same position', () => {
		const entries = [...kindEntries, { kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true }];
		const literalSite: SitePreference = {
			...site('block', 'lbrace', 'lbrace_after'),
			path: [{ kind: 'kind-match', name: 'block' }, { kind: 'literal', text: ',' }, { kind: 'name', name: 'after' }]
		};
		const nameSite: SitePreference = {
			...site('block', 'lbrace', 'lbrace_after'),
			path: [{ kind: 'kind-match', name: 'block' }, { kind: 'name', name: 'comma' }, { kind: 'name', name: 'after' }]
		};
		expect(() => deriveAddressTables([literalSite, nameSite], entries, addressArm, new Map())).toThrow(
			"options: address 'block/comma' names two segments"
		);
	});
});
