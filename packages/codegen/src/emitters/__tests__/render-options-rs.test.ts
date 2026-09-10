import { describe, expect, it } from 'vitest';
import { planRenderOptions, renderOptionsRs } from '../render-options-rs.ts';
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
const supertypes = new Map([['statement', ['return_statement', '_statement_block']]]);
const whitespaceText = new Map([
	['tight', { text: '' }],
	['space', { text: ' ' }],
	['newline', { text: '\n' }]
]);

describe('planRenderOptions', () => {
	it('numbers spacing and flank sites densely, in canonical path order', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		expect(plan.spacingSites.map((s) => [s.constName, s.defaultId, s.fieldIdent, s.wireKey])).toEqual([
			['SITE_CALL_EXPRESSION_LPAREN_BEFORE', 167, 'lparen_before', '_lparen_before'],
			['SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_BEFORE', 167, 'elements_separator_space_before', '_elements_separator_space_before'],
			['SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER', 168, 'elements_separator_space_after', '_elements_separator_space_after'],
			['SITE_RETURN_STATEMENT_TERMINATOR_STATEMENT_TERMINATOR', 20, 'terminator_statement_terminator', '_terminator_statement_terminator'],
			['SITE_STATEMENT_BLOCK_STATEMENTS_SEPARATOR_SPACE', 169, 'statements_separator_space', '_statements_separator_space']
		]);
		expect(plan.delimiterSites.map((s) => [s.constName, s.allowed, s.defaultBits])).toEqual([['DELIM_FORMAL_PARAMETERS_ELEMENTS', 2, 0]]);
	});

	it('carries a path table parallel to the sites, in the order that numbers them', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		expect(plan.sitePaths).toEqual([
			'(call_expression)/"("/before',
			'(formal_parameters)/elements:/separator/before',
			'(formal_parameters)/elements:/separator/after',
			'(return_statement)/terminator:/statement_terminator',
			'(statement_block)/statements:/separator'
		]);
		expect(plan.sitePaths).toHaveLength(plan.spacingSites.length);
	});

	it("orders a kind's own sides after everything nested beneath them", () => {
		const edge: SitePreference = { kind: 'call_expression', slot: 'call_expression', address: 'call_expression_after', label: 'call_expression_after', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const plan = planRenderOptions([edge, ...sites], kindEntries, supertypes, whitespaceText);
		expect(plan.sitePaths.slice(0, 2)).toEqual(['(call_expression)/"("/before', '(call_expression)/after']);
	});

	it('a declared preference site is a spacing-table site too, typed by its arms', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		const term = plan.spacingSites.find((s) => s.label === 'statement_terminator')!;
		expect(term.allowedIds).toEqual([160, 20]);
		expect(term.defaultId).toBe(20);
	});

	it('a token seam site is numbered under its kind by its label, with no flank entry', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		const seam = plan.spacingSites.find((s) => s.label === 'lparen_before')!;
		expect([seam.constName, seam.fieldIdent, seam.wireKey, seam.defaultId, seam.side]).toEqual(['SITE_CALL_EXPRESSION_LPAREN_BEFORE', 'lparen_before', '_lparen_before', 167, 'seam']);
		expect(plan.labels.map((l) => l.label)).toContain('lparen_before');
	});

	it('a separator site rides the spacing table under its kind, fills separator_kind, and registers no label', () => {
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
		const plan = planRenderOptions([...sites, site], entries, supertypes, whitespaceText);
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
		expect(plan.labels.map((l) => l.label)).not.toContain('separator');
		expect(renderOptionsRs(plan)).toContain('("object_type_content", "content_separator", "separator", 20, &[14, 20]),');
	});

	it('an arm without a kind id fails loudly', () => {
		const bad: SitePreference = { ...sites[4]!, arms: [{ value: 'nope', kind: 'nope' }], defaultArm: 'nope' };
		expect(() => planRenderOptions([bad], kindEntries, supertypes, whitespaceText)).toThrow(/has no kind id/);
	});
});

describe('renderOptionsRs', () => {
	it('emits the constants, the defaults, the resolver tables and spacing_text', () => {
		const src = renderOptionsRs(planRenderOptions(sites, kindEntries, supertypes, whitespaceText));
		expect(src).toContain('pub const SPACING_SITE_COUNT: usize = 5;');
		expect(src).toContain('pub const DELIMITER_SITE_COUNT: usize = 1;');
		expect(src).toContain('pub const SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER: usize = 2;');
		expect(src).toContain('    "(formal_parameters)/elements:/separator/after",');
		expect(src).toContain('("formal_parameters", "elements_separator_space_after", "comma_separator_space_after", 168, &[167, 168, 169]),');
		expect(src).toContain('("formal_parameters", "elements_delimiter", 2, 0),');
		expect(src).toContain('delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),');
		expect(src).toContain('pub static DEPTH_SITES: &[(&str, &[usize])] = &[\n];');
		expect(src).toContain('opens an indent it never dedents');
		expect(src).toContain('dedents an indent it never opened');
		expect(src).toContain('("statement", &["return_statement", "statement_block"]),');
		expect(src).toContain('167 => "\\u{FDD2}",');
		expect(src).toContain('169 => "\\u{FDD2}\\n",');
		expect(src).toContain('pub fn resolve(json: &str, base: &ResolvedOptions) -> Result<ResolvedOptions, String>');
	});

	it('lists each kind\'s indent-capable sites in rule order for the resolver\'s depth walk', () => {
		const WHITESPACE = ['tight', 'space', 'newline', 'indent', 'dedent'].map((k) => ({ value: k, kind: k }));
		const entries = [...kindEntries, { kind: 'indent', member: 'Indent', id: 170 }, { kind: 'dedent', member: 'Dedent', id: 171 }];
		const depth = (slot: string, address: string): SitePreference => ({ kind: 'call_expression', slot, address, label: address, arms: WHITESPACE, defaultArm: 'tight', source: 'spacing', side: 'seam' });
		const plan = planRenderOptions([...sites, depth('rparen', 'rparen_before'), depth('lparen', 'lparen_after')], entries, supertypes, whitespaceText);
		expect(plan.spacingSites.slice(0, 3).map((s) => s.fieldIdent)).toEqual(['lparen_before', 'lparen_after', 'rparen_before']);
		expect(plan.depthSites).toEqual([{ kind: 'call_expression', sites: [2, 1] }]);
		expect(renderOptionsRs(plan)).toContain('    ("call_expression", &[2, 1]),');
	});
});
