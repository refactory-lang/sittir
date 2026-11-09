import { describe, expect, it } from 'vitest';
import { pieceAt, pieces, withoutCaptures } from '../pattern-pieces.ts';

const shape = (source: string) => [...pieces(source)].map((piece) => [piece.kind, piece.at, piece.text, 'group' in piece ? piece.group : undefined]);

describe('pieces', () => {
	it('reads escapes, classes, group openings and single characters with their offsets', () => {
		expect(shape('a\\.[b\\]c](?<n>d)(?:e)(f)(?=g)')).toEqual([
			['char', 0, 'a', undefined],
			['escape', 1, '\\.', undefined],
			['class', 3, '[b\\]c]', undefined],
			['open', 9, '(?<n>', 'named'],
			['char', 14, 'd', undefined],
			['char', 15, ')', undefined],
			['open', 16, '(?:', 'plain'],
			['char', 19, 'e', undefined],
			['char', 20, ')', undefined],
			['open', 21, '(', 'capture'],
			['char', 22, 'f', undefined],
			['char', 23, ')', undefined],
			['open', 24, '(?', 'other'],
			['char', 26, '=', undefined],
			['char', 27, 'g', undefined],
			['char', 28, ')', undefined]
		]);
	});

	it('ends a class at its first unescaped bracket and runs an unclosed one to the end', () => {
		expect(shape('[]]')).toEqual([
			['class', 0, '[]', undefined],
			['char', 2, ']', undefined]
		]);
		expect(shape('[(a')).toEqual([['class', 0, '[(a', undefined]]);
	});

	it('reads a backslash that ends the source as an escape of nothing', () => {
		expect(shape('a\\')).toEqual([
			['char', 0, 'a', undefined],
			['escape', 1, '\\', undefined]
		]);
	});

	it('names a named group and leaves an opening whose name is not an identifier to the other groups', () => {
		expect(pieceAt('(?<slot_1>x)', 0)).toEqual({ kind: 'open', at: 0, text: '(?<slot_1>', group: 'named', name: 'slot_1' });
		expect(pieceAt('(?<=x)', 0)).toEqual({ kind: 'open', at: 0, text: '(?', group: 'other' });
		expect(pieceAt('(?<$x>y)', 0)).toEqual({ kind: 'open', at: 0, text: '(?', group: 'other' });
	});
});

describe('withoutCaptures', () => {
	it('turns every capturing and named group into a group that captures nothing', () => {
		expect(withoutCaptures('\\d(_?\\d)*')).toBe('\\d(?:_?\\d)*');
		expect(withoutCaptures('(?<x>a)(?:b)(c)')).toBe('(?:a)(?:b)(?:c)');
	});

	it('leaves escaped parentheses, parentheses in a class and lookarounds as they are', () => {
		for (const source of ['\\(a\\)', '[()]', '[\\]()]x', '(?=a)(?!b)(?<=c)(?<!d)', 'a\\', '[(a']) expect(withoutCaptures(source)).toBe(source);
	});

	it('reads named, capturing and non-capturing groups as one form', () => {
		const forms = ['(?<content>a|b)*', '(a|b)*', '(?:a|b)*'].map(withoutCaptures);
		expect(new Set(forms).size).toBe(1);
		expect(withoutCaptures('(a|b)+')).not.toBe(forms[0]);
	});
});
