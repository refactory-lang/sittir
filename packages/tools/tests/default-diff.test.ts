import { describe, expect, it } from 'vitest';
import { type DefaultDiffReport, type Token, aggregate, alignTokens, differences, gapClassOf, optionsOf, sitesOf } from '../src/exercise/default-diff.ts';

function tokensOfText(text: string): Token[] {
	return [...text.matchAll(/\S+/g)].map((match) => ({ text: match[0], from: match.index, to: match.index + match[0].length }));
}

const report = (file: string, rows: DefaultDiffReport['attributions']): DefaultDiffReport & { readonly file: string } => ({
	file,
	grammar: 'rust',
	gaps: 0,
	differing: 0,
	indentOnly: 0,
	tokenMismatches: 0,
	unattributed: [],
	attributions: rows,
	rendered: ''
});

describe('gapClassOf', () => {
	it('classes a gap by its line breaks, then by emptiness', () => {
		expect(gapClassOf('')).toBe('tight');
		expect(gapClassOf('  ')).toBe('space');
		expect(gapClassOf('\n    ')).toBe('newline');
		expect(gapClassOf('\n\n')).toBe('blankline');
		expect(gapClassOf('\n\n\n')).toBe('double_blankline');
	});
});

describe('alignTokens', () => {
	it('pairs every token of equal sequences', () => {
		const a = tokensOfText('a b c');
		expect(alignTokens(a, a)).toEqual({ pairs: [[0, 0], [1, 1], [2, 2]], mismatches: 0 });
	});

	it('resyncs after an inserted token, with repeated tokens around it', () => {
		const { pairs, mismatches } = alignTokens(tokensOfText('x x y x'), tokensOfText('x x z y x'));
		expect(mismatches).toBe(1);
		expect(pairs).toEqual([[0, 0], [1, 1], [2, 3], [3, 4]]);
	});

	it('resyncs after a deleted token', () => {
		const { pairs, mismatches } = alignTokens(tokensOfText('a b c d'), tokensOfText('a c d'));
		expect(mismatches).toBe(1);
		expect(pairs).toEqual([[0, 0], [2, 1], [3, 2]]);
	});

	it('stops when no pair is found inside the window', () => {
		const a = tokensOfText(`a ${Array.from({ length: 20 }, (_, i) => `p${i}`).join(' ')} z`);
		const b = tokensOfText(`a ${Array.from({ length: 20 }, (_, i) => `q${i}`).join(' ')} z`);
		const { pairs, mismatches } = alignTokens(a, b);
		expect(pairs).toEqual([[0, 0]]);
		expect(mismatches).toBe(1);
	});
});

describe('differences', () => {
	it('reports only the gaps the render spells differently, with their classes and line', () => {
		const source = 'a b\nc';
		const rendered = 'a\nb c';
		const { list, gaps } = differences(tokensOfText(source), source, tokensOfText(rendered), rendered);
		expect(gaps).toBe(2);
		expect(list.map((d) => [d.line, d.before, d.after, d.sourceClass, d.renderedClass])).toEqual([
			[1, 'a', 'b', 'space', 'newline'],
			[1, 'b', 'c', 'newline', 'space']
		]);
	});

	it('marks a gap that differs only in indentation', () => {
		const source = 'a\n  b';
		const rendered = 'a\n    b';
		const { list } = differences(tokensOfText(source), source, tokensOfText(rendered), rendered);
		expect(list.map((d) => d.indentOnly)).toEqual([true]);
	});

	it('does not compare the gaps next to a token that differs', () => {
		const source = 'a b c';
		const rendered = 'a x c';
		const { list, gaps, mismatches } = differences(tokensOfText(source), source, tokensOfText(rendered), rendered);
		expect(list).toEqual([]);
		expect(gaps).toBe(0);
		expect(mismatches).toBe(1);
	});
});

describe('optionsOf', () => {
	it('nests the key chain and ends in the arm kind id', () => {
		expect(optionsOf({ keys: ['tryExpression', 'qmark', 'before'], paths: ['(try_expression)/"?"/before'] }, 7)).toEqual({ tryExpression: { qmark: { before: 7 } } });
	});
});

describe('sitesOf', () => {
	it('keeps every address a shared option leaf controls', () => {
		const sites = sitesOf('rust');
		expect(sites.length).toBeGreaterThan(0);
		const shared = sites.filter((site) => site.paths.length > 1);
		expect(shared.length).toBeGreaterThan(0);
		for (const site of sites) expect(site.paths.length).toBeGreaterThan(0);
	});
});

describe('aggregate', () => {
	it('sums a site and arm across files and ranks by fixed minus broken', () => {
		const row = (path: string, arm: 'tight' | 'space', fixed: number, broken: number) => ({ path, arm, fixed, broken, examples: [`1: "${path}"`] });
		const table = aggregate([
			report('a/one.rs', [row('(x)/before', 'tight', 3, 0), row('(y)/after', 'space', 5, 4)]),
			report('a/two.rs', [row('(x)/before', 'tight', 2, 1)])
		]);
		expect(table.map((r) => [r.path, r.arm, r.fixed, r.broken, r.files])).toEqual([
			['(x)/before', 'tight', 5, 1, 2],
			['(y)/after', 'space', 5, 4, 1]
		]);
		expect(table[0]!.examples).toEqual(['one.rs:1: "(x)/before"', 'two.rs:1: "(x)/before"']);
	});
});
