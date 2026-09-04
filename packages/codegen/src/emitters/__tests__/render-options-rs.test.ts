import { describe, expect, it } from 'vitest';
import { planRenderOptions, renderOptionsRs } from '../render-options-rs.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';

const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));
const kindEntries = [
	{ kind: 'tight', member: 'Tight', id: 167 },
	{ kind: 'space', member: 'Space', id: 168 },
	{ kind: 'newline', member: 'Newline', id: 169 },
	{ kind: 'semi', member: 'Semi', id: 20, symbolName: ';', anon: true },
	{ kind: 'automatic_semicolon', member: 'AutomaticSemicolon', id: 160 }
];

const sites: SitePreference[] = [
	{ kind: 'formal_parameters', slot: 'elements', label: 'comma_separator_space_before', arms: SPACING, defaultArm: 'tight', source: 'spacing' },
	{ kind: 'formal_parameters', slot: 'elements', label: 'comma_separator_space_after', arms: SPACING, defaultArm: 'space', source: 'spacing' },
	{ kind: 'formal_parameters', slot: 'elements', label: 'delimiter', arms: [{ value: 'Delimiter.Trailing' }], defaultArm: 'Delimiter.None', source: 'delimiter' },
	{ kind: '_statement_block', slot: 'statements', label: 'empty_separator_space', arms: SPACING, defaultArm: 'newline', source: 'spacing' },
	{
		kind: 'return_statement',
		slot: 'terminator',
		label: 'statement_terminator',
		arms: [
			{ value: 'automatic_semicolon', kind: 'automatic_semicolon' },
			{ value: ';', kind: 'semi' }
		],
		defaultArm: ';',
		source: 'declared'
	}
];
const supertypes = new Map([['statement', ['return_statement', '_statement_block']]]);
const whitespaceText = new Map([
	['tight', ''],
	['space', ' '],
	['newline', '\n']
]);

describe('planRenderOptions', () => {
	it('numbers spacing and flank sites densely, in kind then slot then label order', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		expect(plan.spacingSites.map((s) => [s.constName, s.defaultId, s.fieldIdent, s.wireKey])).toEqual([
			['SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_AFTER', 168, 'elements_comma_separator_space_after', '_elements_comma_separator_space_after'],
			['SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_BEFORE', 167, 'elements_comma_separator_space_before', '_elements_comma_separator_space_before'],
			['SITE_RETURN_STATEMENT_TERMINATOR_STATEMENT_TERMINATOR', 20, 'terminator_statement_terminator', '_terminator_statement_terminator'],
			['SITE_STATEMENT_BLOCK_STATEMENTS_EMPTY_SEPARATOR_SPACE', 169, 'statements_empty_separator_space', '_statements_empty_separator_space']
		]);
		expect(plan.delimiterSites.map((s) => [s.constName, s.allowed])).toEqual([['DELIM_FORMAL_PARAMETERS_ELEMENTS', 2]]);
	});

	it('a declared preference site is a spacing-table site too, typed by its arms', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		const term = plan.spacingSites.find((s) => s.label === 'statement_terminator')!;
		expect(term.allowedIds).toEqual([160, 20]);
		expect(term.defaultId).toBe(20);
	});

	it('an arm without a kind id fails loudly', () => {
		const bad: SitePreference = { ...sites[4]!, arms: [{ value: 'nope', kind: 'nope' }], defaultArm: 'nope' };
		expect(() => planRenderOptions([bad], kindEntries, supertypes, whitespaceText)).toThrow(/has no kind id/);
	});
});

describe('renderOptionsRs', () => {
	it('emits the constants, the defaults, the resolver tables and spacing_text', () => {
		const src = renderOptionsRs(planRenderOptions(sites, kindEntries, supertypes, whitespaceText));
		expect(src).toContain('pub const SPACING_SITE_COUNT: usize = 4;');
		expect(src).toContain('pub const DELIMITER_SITE_COUNT: usize = 1;');
		expect(src).toContain('pub const SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_AFTER: usize = 0;');
		expect(src).toContain('("formal_parameters", "elements_comma_separator_space_after", "comma_separator_space_after", 168, &[167, 168, 169]),');
		expect(src).toContain('("formal_parameters", "elements_delimiter", 2),');
		expect(src).toContain('("statement", &["return_statement", "statement_block"]),');
		expect(src).toContain('167 => "",');
		expect(src).toContain('169 => "\\n",');
		expect(src).toContain('pub fn resolve(json: &str, base: &ResolvedOptions) -> Result<ResolvedOptions, String>');
	});
});
