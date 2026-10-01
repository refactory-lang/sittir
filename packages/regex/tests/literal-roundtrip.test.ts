import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';

const engine = await createEngine(regex);

describe('a parsed pattern renders the literal tokens the source wrote', () => {
	it.each([
		['a lazy quantifier', 'a*?'],
		['a lazy plus quantifier', 'a+?'],
		['a lazy optional quantifier', 'a??'],
		['a lazy count quantifier', 'a{2,3}?'],
		['a count quantifier with an open start', 'a{,5}'],
		['a count quantifier with an open end', 'a{2,}'],
		['a negated class', '[^a-]'],
		['a class with leading and trailing dashes', '[-a-]'],
		['empty alternatives', 'a||b'],
		['empty alternatives at the edges', '|a|']
	])('%s', (_name, source) => {
		expect(engine.parse(source).$render()).toBe(source);
	});
});
