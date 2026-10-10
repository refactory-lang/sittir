import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NEWLINE_ARMS, canonicalText, enrichWhitespace, whitespaceMemberRule } from '../whitespace.ts';
import { nodelessExtrasRun } from '../rule-patterns.ts';
import { enrich, getEnrichWhitespace } from '../enrich.ts';
import { DEDENT_TEXT, INDENT_TEXT } from '../primitives/spacing.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const S = (value: string) => ({ type: 'STRING' as const, value });
const P = (value: string) => ({ type: 'PATTERN' as const, value });
const sym = (name: string) => ({ type: 'SYMBOL' as const, name });
const ALL = ['_tight', '_space', '_tab', '_newline', '_blankline', '_double_blankline', '_indent', '_dedent'];

describe('nodelessExtrasRun', () => {
	it('matches a whole run of pattern and literal extras, with literals taken as text', () => {
		const run = nodelessExtrasRun([P('\\n'), S('.')], {})!;
		expect(run.test('\n\n.')).toBe(true);
		expect(run.test('a')).toBe(false);
		expect(run.test('\n ')).toBe(false);
	});

	it('resolves a symbol extra through its lexical rule', () => {
		const run = nodelessExtrasRun([sym('_ws')], { _ws: P('\\s') })!;
		expect(run.test(' \n')).toBe(true);
	});

	it('leaves out a visible symbol extra, which lexes as a node, even when its rule is lexical', () => {
		expect(nodelessExtrasRun([sym('comment')], { comment: P('//.*') })).toBeUndefined();
		const run = nodelessExtrasRun([P('\\s'), sym('comment')], { comment: P('//.*') })!;
		expect(run.test(' ')).toBe(true);
		expect(run.test('// tail')).toBe(false);
	});

	it('is undefined when the grammar has no lexical extras', () => {
		expect(nodelessExtrasRun([sym('comment')], { comment: { type: 'SEQ', members: [S('#'), sym('text')] } as never })).toBeUndefined();
	});

	it('rejects an extra that is not a JavaScript RegExp', () => {
		expect(() => nodelessExtrasRun([P('(')], {})).toThrow(/do not compile/);
	});
});

describe('enrichWhitespace', () => {
	it('admits only the tight mark when nothing in the extras is whitespace', () => {
		const out = enrichWhitespace([], [sym('comment')], {});
		expect(out.members).toEqual(['_tight']);
		expect(out.bodies).toEqual({ _tight: S('') });
	});

	it('admits every member the extras accept, indentation riding on a horizontal space', () => {
		const out = enrichWhitespace([], [P('\\s')], {});
		expect(out.members).toEqual(ALL);
		expect(out.addedExternals).toEqual(ALL);
		expect(out.bodies._indent).toEqual(S(INDENT_TEXT));
		expect(out.bodies._dedent).toEqual(S(DEDENT_TEXT));
		expect(out.rule).toEqual({ type: 'CHOICE', members: ALL.map(sym) });
	});

	it('drops space and indentation when the extras accept only line breaks', () => {
		expect(enrichWhitespace([], [P('\\r?\\n')], {}).members).toEqual(['_tight', '_newline', '_blankline', '_double_blankline']);
	});

	it('reuses a same-named upstream external, keeping a body only for its text members', () => {
		const out = enrichWhitespace([sym('_newline'), sym('_indent'), sym('_dedent')], [P('\\s')], {});
		expect(out.addedExternals).toEqual(['_tight', '_space', '_tab', '_blankline', '_double_blankline']);
		expect(Object.keys(out.bodies)).toEqual(['_tight', '_space', '_tab', '_newline', '_blankline', '_double_blankline']);
	});

	it('reports an upstream rule that defines a minted name differently, and not one that defines it the same', () => {
		const rules = { _layout: S(' '), _space: S(' '), _newline: S('\n'), _tight: S('') };
		const out = enrichWhitespace([sym('_newline')], [P('\\s')], rules);
		expect(out.collisions).toEqual([{ name: '_layout', site: 'upstream' }]);
		expect(enrichWhitespace([], [P('\\s')], { _space: S('  ') }).collisions).toEqual([{ name: '_space', site: 'upstream' }]);
	});
});

describe('enrich mints the layout supertype', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	const grammar = (rules: Record<string, unknown>) => ({ name: 'demo', rules, extras: [P('\\n')], externals: [sym('_newline')], supertypes: [] });

	it('adds the rule, the supertype, the missing externals and the bodies', () => {
		const out = enrich(grammar({ source: S('x') })) as { rules: Record<string, unknown>; supertypes: unknown[]; externals: unknown[] };
		expect(out.rules['_layout']).toEqual({ type: 'CHOICE', members: ['_tight', '_newline', '_blankline', '_double_blankline'].map(sym) });
		expect(out.supertypes).toContain('_layout');
		expect(out.externals).toEqual([sym('_newline'), sym('_tight'), sym('_blankline'), sym('_double_blankline')]);
		expect(getEnrichWhitespace(out)).toEqual({
			bodies: { _tight: S(''), _newline: S('\n'), _blankline: S('\n\n'), _double_blankline: S('\n\n\n') },
			collisions: []
		});
	});

	it('replaces an upstream definition of a minted name with the minted one and records the collision', () => {
		const out = enrich(grammar({ source: S('x'), _layout: S(' '), _tight: S('t') })) as { rules: Record<string, unknown> };
		expect(out.rules['_layout']).toEqual({ type: 'CHOICE', members: ['_tight', '_newline', '_blankline', '_double_blankline'].map(sym) });
		expect(out.rules['_tight']).toBeUndefined();
		expect(getEnrichWhitespace(out).collisions).toEqual([
			{ name: '_layout', site: 'upstream' },
			{ name: '_tight', site: 'upstream' }
		]);
	});

	it('is idempotent: its own supertype passes through a second enrich without a collision', () => {
		expect(getEnrichWhitespace(enrich(enrich(grammar({ source: S('x') })))).collisions).toEqual([]);
	});
});

describe('the newline member owns the line-ending arms', () => {
	it('spells each member in its canonical form', () => {
		expect(canonicalText('_newline')).toBe('\n');
		expect(canonicalText('_blankline')).toBe('\n\n');
		expect(canonicalText('_double_blankline')).toBe('\n\n\n');
	});

	it('makes blank lines references to newline and nothing else', () => {
		for (const name of ['_blankline', '_double_blankline']) {
			const rule = whitespaceMemberRule(name);
			expect(rule.type).toBe('SEQ');
			if (rule.type !== 'SEQ') continue;
			expect(rule.members.every((ref) => ref.name === '_newline')).toBe(true);
		}
	});

	it('declares the arms once, in order, on newline', () => {
		expect(NEWLINE_ARMS).toEqual(['\n', '\r\n', '\r']);
		const rule = whitespaceMemberRule('_newline');
		expect(rule.type).toBe('CHOICE');
		if (rule.type !== 'CHOICE') return;
		expect(rule.members.map((arm) => arm.value)).toEqual([...NEWLINE_ARMS]);
		expect(rule.preferred).toBe('\n');
	});

	it('refuses a name outside the vocabulary', () => {
		expect(() => canonicalText('_nothing')).toThrow(/_nothing/);
	});
});
