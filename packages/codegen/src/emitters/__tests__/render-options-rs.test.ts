import { describe, expect, it } from 'vitest';
import { planRenderOptions, renderOptionsRs } from '../render-options-rs.ts';
import { deriveAddressTables, kindIdArmType } from '../options.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';

const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));
const kindEntries = [
	{ kind: 'tight', member: 'Tight', id: 167 },
	{ kind: 'space', member: 'Space', id: 168 },
	{ kind: 'newline', member: 'Newline', id: 169 },
	{ kind: 'semi', member: 'Semi', id: 20, symbolName: ';', anon: true },
	{ kind: 'automatic_semicolon', member: 'AutomaticSemicolon', id: 160 },
	{ kind: 'lparen', member: 'Lparen', id: 21, symbolName: '(', anon: true },
	{ kind: 'rparen', member: 'Rparen', id: 22, symbolName: ')', anon: true }
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
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
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
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		expect(plan.sitePaths.map((p) => p.path)).toEqual([
			'(call_expression)/"("/before',
			'(formal_parameters)/elements:/delimiter',
			'(formal_parameters)/elements:/separator/before',
			'(formal_parameters)/elements:/separator/after',
			'(return_statement)/terminator:/statement_terminator',
			'(statement_block)/statements:/separator'
		]);
		expect(plan.sitePaths).toHaveLength(plan.spacingSites.length + plan.delimiterSites.length);
		expect(plan.sitePaths[1]).toEqual({ path: '(formal_parameters)/elements:/delimiter', site: 'delimiter', index: 0 });
		expect(plan.sitePaths[2]).toEqual({ path: '(formal_parameters)/elements:/separator/before', site: 'spacing', index: 1 });
	});

	it("orders a kind's own sides after everything nested beneath them", () => {
		const edge: SitePreference = { kind: 'call_expression', slot: 'call_expression', address: 'call_expression_after', label: 'call_expression_after', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const plan = planRenderOptions([edge, ...sites], kindEntries, whitespaceText);
		expect(plan.sitePaths.slice(0, 2).map((p) => p.path)).toEqual(['(call_expression)/"("/before', '(call_expression)/after']);
	});

	it('a declared preference site is a spacing-table site too, typed by its arms', () => {
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const term = plan.spacingSites.find((s) => s.label === 'statement_terminator')!;
		expect(term.allowedIds).toEqual([160, 20]);
		expect(term.defaultId).toBe(20);
	});

	it('a token seam site is numbered under its kind by its label', () => {
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const seam = plan.spacingSites.find((s) => s.label === 'lparen_before')!;
		expect([seam.constName, seam.fieldIdent, seam.wireKey, seam.defaultId, seam.side]).toEqual(['SITE_CALL_EXPRESSION_LPAREN_BEFORE', 'lparen_before', '_lparen_before', 167, 'seam']);
	});

	it('a separator site rides the spacing table under its kind and fills separator_kind', () => {
		const entries = [...kindEntries, { kind: 'comma', member: 'Comma', id: 14, symbolName: ',', anon: true }];
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
		const plan = planRenderOptions([...sites, site], entries, whitespaceText);
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
		const addresses = deriveAddressTables([...sites, site], entries, kindIdArmType(entries as never), (() => []) as never);
		expect(renderOptionsRs(plan, addresses, entries)).toContain('("object_type_content", "content_separator", "separator", 20, &[14, 20]),');
	});

	it('an arm without a kind id fails loudly', () => {
		const bad: SitePreference = { ...sites[4]!, arms: [{ value: 'nope', kind: 'nope' }], defaultArm: 'nope' };
		expect(() => planRenderOptions([bad], kindEntries, whitespaceText)).toThrow(/has no kind id/);
	});
});

describe('renderOptionsRs', () => {
	it('emits one struct per address branch, a strict deserializer and a straight-line resolver', () => {
		const kindEntries = [...BASE_KIND_ENTRIES, { kind: 'comma', member: 'Comma', id: 14, symbolName: ',', anon: true }];
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, kindIdArmType(kindEntries as never), (() => []) as never);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain(
			'pub struct Options {\n    pub indent: Option<String>,\n    pub call_expression: Option<CallExpressionOptions>,\n    pub formal_parameters: Option<FormalParametersOptions>,'
		);
		expect(source).toContain(
			'pub struct FormalParametersElementsSeparatorCommaOptions {\n    pub after: Option<u16>,\n    pub before: Option<u16>,\n}'
		);
		expect(source).toContain(
			'pub struct FormalParametersElementsOptions {\n    pub delimiter: Option<u8>,\n    pub separator: Option<FormalParametersElementsSeparatorOptions>,\n}'
		);
		expect(source).toContain(
			'::sittir_core::options::reject_unknown_keys(&obj, &["after", "before"], "(formal_parameters)/elements:/separator/\\",\\"")?;'
		);
		expect(source).toContain('separator: obj.get("separator")?,');
		expect(source).toContain('comma: obj.get(",")?,');
		expect(source).toContain(
			'if let Some(v) = options.formal_parameters.as_ref().and_then(|o| o.elements.as_ref()).and_then(|o| o.separator.as_ref()).and_then(|o| o.comma.as_ref()).and_then(|o| o.after) {\n        set_spacing(&mut table, SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER, SPACING_SITES[SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER].4, v, "(formal_parameters)/elements:/separator/\\",\\"/after")?;\n    }'
		);
		expect(source).not.toContain('SITE_PATHS');
		expect(source).not.toContain('serde_json');
	});

	it('emits the constants, the defaults, the resolver tables and spacing_text', () => {
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, kindIdArmType(kindEntries as never), (() => []) as never);
		const src = renderOptionsRs(plan, addresses, kindEntries);
		expect(src).toContain('pub const SPACING_SITE_COUNT: usize = 5;');
		expect(src).toContain('pub const DELIMITER_SITE_COUNT: usize = 1;');
		expect(src).toContain('pub const SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER: usize = 2;');
		expect(src).toContain('("formal_parameters", "elements_separator_space_after", "comma_separator_space_after", 168, &[167, 168, 169]),');
		expect(src).toContain('("formal_parameters", "elements_delimiter", 2, 0),');
		expect(src).toContain('delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),');
		expect(src).toContain('pub static DEPTH_SITES: &[(&str, &[usize])] = &[\n];');
		expect(src).toContain('opens an indent it never dedents');
		expect(src).toContain('dedents an indent it never opened');
		expect(src).toContain('167 => "",');
		expect(src).toContain('169 => "\\n",');
		expect(src).not.toContain('\\u{FDD2}');
		expect(src).toContain('pub fn resolve(options: &Options, base: &ResolvedOptions) -> Result<ResolvedOptions, String>');
	});

	it('emits the whitespace table with plain text and the depth ids', () => {
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, kindIdArmType(kindEntries as never), (() => []) as never);
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
		const plan = planRenderOptions([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')], entries, whitespaceText);
		expect(plan.spacingSites.slice(0, 3).map((s) => s.fieldIdent)).toEqual(['lparen_before', 'lparen_after', 'rparen_before']);
		expect(plan.depthSites).toEqual([{ kind: 'call_expression', sites: [2, 1] }]);
		const addresses = deriveAddressTables([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')], entries, kindIdArmType(entries as never), (() => []) as never);
		expect(renderOptionsRs(plan, addresses, entries)).toContain('    ("call_expression", &[2, 1]),');
	});
});
