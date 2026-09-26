import { describe, expect, it } from 'vitest';
import { SEAM_DECLARED, planRenderOptions, renderOptionsRs, seatTableName, seatTablesOf } from '../render-options-rs.ts';
import { deriveAddressTables, kindIdArmType } from '../options.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';
import { makeSiteKindsNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));
const kindEntries = [
	{ kind: 'tight', member: 'Tight', id: 167 },
	{ kind: 'space', member: 'Space', id: 168 },
	{ kind: 'newline', member: 'Newline', id: 169 },
	{ kind: 'semi', member: 'Semi', id: 20, symbolName: ';', literalText: ';', anon: true },
	{ kind: 'automatic_semicolon', member: 'AutomaticSemicolon', id: 160 },
	{ kind: 'lparen', member: 'Lparen', id: 21, symbolName: '(', literalText: '(', anon: true },
	{ kind: 'rparen', member: 'Rparen', id: 22, symbolName: ')', literalText: ')', anon: true }
];
const BASE_KIND_ENTRIES = kindEntries;

const sites: SitePreference[] = [
	{ kind: 'formal_parameters', slot: 'elements', address: 'elements_separator_space_before', label: 'comma_separator_space_before', arms: SPACING, defaultArm: 'tight', source: 'spacing' },
	{ kind: 'formal_parameters', slot: 'elements', address: 'elements_separator_space_after', label: 'comma_separator_space_after', arms: SPACING, defaultArm: 'space', source: 'spacing' },
	{ kind: 'formal_parameters', slot: 'elements', address: 'elements_delimiter', label: 'delimiter', arms: [{ value: 'Delimiter.Trailing' }], defaultArm: 'Delimiter.None', source: 'delimiter' },
	{ kind: '_statement_block', slot: 'statements', address: 'statements_separator_space', label: 'empty_separator_space', arms: SPACING, defaultArm: 'newline', source: 'spacing' },
	{
		kind: 'return_statement',
		slot: 'terminator',
		address: 'terminator_statement_terminator',
		label: 'statement_terminator',
		arms: [
			{ value: 'automatic_semicolon', kind: 'automatic_semicolon' },
			{ value: ';', kind: 'semi' }
		],
		defaultArm: ';',
		source: 'declared'
	},
	{ kind: 'call_expression', slot: 'lparen', address: 'lparen_before', label: 'lparen_before', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' }
];
const whitespaceText = new Map([
	['tight', ''],
	['space', ' '],
	['newline', '\n']
]);

describe('planRenderOptions', () => {
	it('numbers spacing and flank sites densely, in canonical path order', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		expect(plan.spacingSites.map((s) => [s.constName, s.defaultId, s.fieldIdent, s.wireKey])).toEqual([
			['SITE_CALL_EXPRESSION_LPAREN_BEFORE', 167, 'lparen_before', '_lparen_before'],
			['SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_BEFORE', 167, 'elements_separator_space_before', '_elements_separator_space_before'],
			['SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER', 168, 'elements_separator_space_after', '_elements_separator_space_after'],
			['SITE_RETURN_STATEMENT_TERMINATOR_STATEMENT_TERMINATOR', 20, 'terminator_statement_terminator', '_terminator_statement_terminator'],
			['SITE_STATEMENT_BLOCK_STATEMENTS_SEPARATOR_SPACE', 169, 'statements_separator_space', '_statements_separator_space']
		]);
		expect(plan.delimiterSites.map((s) => [s.constName, s.allowed, s.defaultBits])).toEqual([['DELIM_FORMAL_PARAMETERS_ELEMENTS', 2, 0]]);
	});

	it('carries a path table over every site, spacing and delimiter together, in canonical order', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		expect(plan.sitePaths.map((p) => p.path)).toEqual([
			'(call_expression)/"("/before',
			'(formal_parameters)/elements:/delimiter',
			'(formal_parameters)/elements:/separator/before',
			'(formal_parameters)/elements:/separator/after',
			'(return_statement)/terminator:/statement_terminator',
			'(statement_block)/statements:/separator'
		]);
		expect(plan.sitePaths).toHaveLength(plan.spacingSites.length + plan.delimiterSites.length);
		expect(plan.sitePaths[1]).toMatchObject({ path: '(formal_parameters)/elements:/delimiter', site: 'delimiter', index: 0 });
		expect(plan.sitePaths[2]).toMatchObject({ path: '(formal_parameters)/elements:/separator/before', site: 'spacing', index: 1 });
	});

	it("orders a kind's own sides after everything nested beneath them", () => {
		const edge: SitePreference = { kind: 'call_expression', slot: 'call_expression', address: 'call_expression_after', label: 'call_expression_after', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const plan = planRenderOptions([edge, ...sites], kindEntries, makeSiteKindsNodeMap([edge, ...sites]), whitespaceText);
		expect(plan.sitePaths.slice(0, 2).map((p) => p.path)).toEqual(['(call_expression)/"("/before', '(call_expression)/after']);
	});

	it('a declared preference site is a spacing-table site too, typed by its arms', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const term = plan.spacingSites.find((s) => s.label === 'statement_terminator')!;
		expect(term.allowedIds).toEqual([160, 20]);
		expect(term.defaultId).toBe(20);
	});

	it('a token seam site is numbered under its kind by its label', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const seam = plan.spacingSites.find((s) => s.label === 'lparen_before')!;
		expect([seam.constName, seam.fieldIdent, seam.wireKey, seam.defaultId, seam.side]).toEqual(['SITE_CALL_EXPRESSION_LPAREN_BEFORE', 'lparen_before', '_lparen_before', 167, 'seam']);
	});

	it('a separator site rides the spacing table under its kind and fills separator_kind', () => {
		const entries = [...kindEntries, { kind: 'comma', member: 'Comma', id: 14, symbolName: ',', literalText: ',', anon: true }];
		const site: SitePreference = {
			kind: 'object_type_content',
			slot: 'content',
			address: 'content_separator',
			label: 'separator',
			arms: [
				{ value: 'comma', kind: 'comma' },
				{ value: 'semi', kind: 'semi' }
			],
			defaultArm: 'semi',
			source: 'separator'
		};
		const plan = planRenderOptions([...sites, site], entries, makeSiteKindsNodeMap([...sites, site]), whitespaceText);
		const row = plan.spacingSites.find((s) => s.role === 'separator')!;
		expect([row.constName, row.fieldIdent, row.wireKey, row.defaultId, row.allowedIds, row.side, row.defaultText]).toEqual([
			'SITE_OBJECT_TYPE_CONTENT_CONTENT_SEPARATOR',
			'separator_kind',
			'_separator',
			20,
			[14, 20],
			undefined,
			';'
		]);
		const addresses = deriveAddressTables([...sites, site], entries, makeSiteKindsNodeMap([...sites, site]), kindIdArmType(entries as never), (() => []) as never);
		expect(renderOptionsRs(plan, addresses, entries)).toContain('("object_type_content", "content_separator", "separator", &[14, 20]),');
	});

	it('an arm without a kind id fails loudly', () => {
		const bad: SitePreference = { ...sites[4]!, arms: [{ value: 'nope', kind: 'nope' }], defaultArm: 'nope' };
		expect(() => planRenderOptions([bad], kindEntries, makeSiteKindsNodeMap([bad]), whitespaceText)).toThrow(/has no kind id/);
	});
});

describe('renderOptionsRs', () => {
	it('emits a static address trie over the site constants and no per-address structs', () => {
		const kindEntries = [...BASE_KIND_ENTRIES, { kind: 'comma', member: 'Comma', id: 14, symbolName: ',', literalText: ',', anon: true }];
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, makeSiteKindsNodeMap(sites), kindIdArmType(kindEntries as never), (() => []) as never);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain('pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[');
		expect(source).toContain('::sittir_core::options::AddressNode::Branch { key: "formalParameters", path: "(formal_parameters)", children: &[');
		expect(source).toContain('::sittir_core::options::AddressNode::Delimiter { key: "delimiter", sites: &[::sittir_core::options::SiteRef { site: DELIM_FORMAL_PARAMETERS_ELEMENTS, path: "(formal_parameters)/elements:/delimiter" }] },');
		expect(source).toContain(
			'::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER, path: "(formal_parameters)/elements:/separator/\\",\\"/after" }] },'
		);
		expect(source).toContain('pub type Options = ::sittir_core::options::Options<Sites>;');
		expect(source).not.toContain('pub struct Options {');
		expect(source).not.toContain('FromNapiValue');
		expect(source).not.toContain('pub fn resolve(');
	});

	it('emits smoke tests for the admitted, unknown-key and refused-value shapes', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, makeSiteKindsNodeMap(sites), kindIdArmType(kindEntries as never), (() => []) as never);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain('fn an_unknown_key_is_refused()');
		expect(source).toContain('fn an_unknown_key_beneath_a_branch_names_the_branch()');
		expect(source).toContain('fn a_differing_admitted_value_changes_only_its_own_sites()');
		expect(source).toContain('fn a_value_the_site_does_not_admit_is_refused_with_its_path()');
	});

	it('emits the constants, the defaults, the resolver tables and spacing_text', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, makeSiteKindsNodeMap(sites), kindIdArmType(kindEntries as never), (() => []) as never);
		const src = renderOptionsRs(plan, addresses, kindEntries);
		expect(src).toContain('pub const SPACING_SITE_COUNT: usize = 5;');
		expect(src).toContain('pub const DELIMITER_SITE_COUNT: usize = 1;');
		expect(src).toContain('pub const SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER: usize = 2;');
		expect(src).toContain('("formal_parameters", "elements_separator_space_after", "comma_separator_space_after", &[167, 168, 169]),');
		expect(src).toContain('("formal_parameters", "elements_delimiter", 2, 0),');
		expect(src).toContain('delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),');
		expect(src).toContain('pub static DEPTH_SITES: &[(&str, &[usize])] = &[\n];');
		expect(src).toContain('167 => "",');
		expect(src).toContain('169 => "\\n",');
		expect(src).not.toContain('\\u{FDD2}');
		expect(src).toContain('        depth_sites: DEPTH_SITES,');
	});

	it('emits a SiteSpec per spacing site in vector order and wires it into the resolved options', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, makeSiteKindsNodeMap(sites), kindIdArmType(kindEntries as never), (() => []) as never);
		const src = renderOptionsRs(plan, addresses, kindEntries);
		expect(src).toContain('pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[');
		const specs = src.slice(src.indexOf('pub static SITE_SPECS'), src.indexOf('];', src.indexOf('pub static SITE_SPECS')));
		expect(specs.split('::sittir_core::options::SiteSpec {').length - 1).toBe(plan.spacingSites.length);
		expect(specs).toContain(`::sittir_core::options::SiteSpec { default_arm: ${plan.spacingSites[0]!.defaultId}, strength: ${plan.spacingSites[0]!.strength} },`);
		expect(src).toContain('        spacing: ResolvedOptions::default_spacing(SITE_SPECS),');
		expect(src).toContain('        sites: SITE_SPECS,');
	});

	it('gives a list flank declared strength, the strength the list view writes it at', () => {
		const flank: SitePreference = { kind: 'arguments', slot: 'elements', address: 'elements_start', label: 'start', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'start' };
		const plan = planRenderOptions([...sites, flank], kindEntries, makeSiteKindsNodeMap([...sites, flank]), whitespaceText);
		const row = plan.spacingSites.find((s) => s.kind === 'arguments' && s.side === 'start');
		expect(row?.strength).toBe(SEAM_DECLARED);
	});

	it('builds a dense seat table per (kind, slot) indexed by the seated kind id, and fails on a seat whose kind has no id', () => {
		const seat = (child: string): SitePreference => ({
			kind: 'arguments',
			slot: 'elements',
			address: `elements_${child}_after`,
			label: `${child}_after`,
			arms: SPACING,
			defaultArm: 'space',
			source: 'spacing',
			seat: { kind: child, field: `${child}_after` }
		});
		const entries = [...kindEntries, { kind: 'zeta', member: 'Zeta', id: 300 }, { kind: 'alpha', member: 'Alpha', id: 200 }];
		const plan = planRenderOptions([...sites, seat('zeta'), seat('alpha')], entries, makeSiteKindsNodeMap([...sites, seat('zeta'), seat('alpha')]), whitespaceText);
		const tables = seatTablesOf(plan, entries);
		expect(tables).toHaveLength(1);
		expect(tables[0]!.name).toBe(seatTableName('arguments', 'elements'));
		expect(tables[0]!.rows.map((r) => r.kindId)).toEqual([200, 300]);
		const src = renderOptionsRs(plan, deriveAddressTables([...sites, seat('zeta'), seat('alpha')], entries, makeSiteKindsNodeMap([...sites, seat('zeta'), seat('alpha')]), kindIdArmType(entries as never), (() => []) as never), entries);
		const dense = src.slice(src.indexOf(`pub static ${tables[0]!.name}: &[u16] = &[`));
		const cells = dense.slice(dense.indexOf('\n') + 1, dense.indexOf('];')).split(',').map((c) => c.trim()).filter(Boolean);
		expect(cells).toHaveLength(301);
		expect(cells[200]).toBe(String(tables[0]!.rows[0]!.site));
		expect(cells[300]).toBe(String(tables[0]!.rows[1]!.site));
		expect(cells[250]).toBe('NO_SITE');
		const missing = planRenderOptions([...sites, seat('nokind')], entries, makeSiteKindsNodeMap([...sites, seat('nokind')]), whitespaceText);
		expect(() => seatTablesOf(missing, entries)).toThrow(/nokind/);
	});

	it("exposes each site's admitted arms to the prepare walk", () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, makeSiteKindsNodeMap(sites), kindIdArmType(kindEntries as never), (() => []) as never);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain("pub fn allowed(site: usize) -> &'static [u16] {\n    SPACING_SITES[site].3\n}");
	});

	it('emits the whitespace table with plain text and the depth ids', () => {
		const plan = planRenderOptions(sites, kindEntries, makeSiteKindsNodeMap(sites), whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, makeSiteKindsNodeMap(sites), kindIdArmType(kindEntries as never), (() => []) as never);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain('        169 => "\\n",');
		expect(source).not.toContain('\\u{FDD2}');
		expect(source).toContain(
			'pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND };'
		);
	});

	it('lists each kind\'s indent-capable sites in rule order for the resolver\'s depth walk', () => {
		const WHITESPACE = ['tight', 'space', 'newline', 'indent', 'dedent'].map((k) => ({ value: k, kind: k }));
		const entries = [...kindEntries, { kind: 'indent', member: 'Indent', id: 170 }, { kind: 'dedent', member: 'Dedent', id: 171 }];
		const depth = (slot: string, address: string): SitePreference => ({ kind: 'call_expression', slot, address, label: address, arms: WHITESPACE, defaultArm: 'tight', source: 'spacing', side: 'seam' });
		const plan = planRenderOptions([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')], entries, makeSiteKindsNodeMap([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')]), whitespaceText);
		expect(plan.spacingSites.slice(0, 3).map((s) => s.fieldIdent)).toEqual(['lparen_before', 'lparen_after', 'rparen_before']);
		expect(plan.depthSites).toEqual([{ kind: 'call_expression', sites: [2, 1] }]);
		const addresses = deriveAddressTables([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')], entries, makeSiteKindsNodeMap([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')]), kindIdArmType(entries as never), (() => []) as never);
		expect(renderOptionsRs(plan, addresses, entries)).toContain('    ("call_expression", &[2, 1]),');
	});
});
