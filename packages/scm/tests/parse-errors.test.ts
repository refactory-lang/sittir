import { describe, expect, it } from 'vitest';
import { ParseErrors } from '@sittir/common';
import { ERROR_KIND_ID } from '@sittir/common/utils';
import scm from '../src/index.ts';

const engine = await scm.createEngine();

const error = (start: number, end: number) => ({ kind: 'error', span: { start, end } });
const missing = (at: number) => ({ kind: 'missing', span: { start: at, end: at } });

describe('a parsed root reports the regions of its source that did not parse', () => {
	it.each([
		['(a) @b\n(c @d\n(e) @f\n', [error(7, 19)]],
		['(a [ (b)\n', [error(0, 8)]],
		['((a) (#eq? @x)\n', [error(0, 14)]],
		['(a b: )', [missing(5)]],
		['(identifier) @identifier (call #eq? @x "a"', [error(26, 30), missing(42)]]
	])('%j', (source, regions) => {
		expect(engine.parse(source).$errors).toEqual(regions);
	});

	it('reports none for a source that parsed cleanly', () => {
		expect(engine.parse('(a) @b\n(c (d) @e)\n').$errors).toEqual([]);
		expect(engine.parse('').$errors).toEqual([]);
	});
});

describe('a parse asked to throw on errors', () => {
	it('throws ParseErrors carrying the regions the root would list', () => {
		const source = '(a [ (b)\n';
		const regions = engine.parse(source).$errors;
		expect(() => engine.parse(source, { errors: 'throw' })).toThrow(ParseErrors);
		try {
			engine.parse(source, { errors: 'throw' });
		} catch (error) {
			expect((error as ParseErrors).errors).toEqual(regions);
		}
	});

	it('returns the root of a clean source', () => {
		expect(engine.parse('(a) @b\n', { errors: 'throw' }).$errors).toEqual([]);
	});
});

describe('an ERROR region read as trivia', () => {
	it('is an error node of the engine that parsed it', () => {
		const [first] = engine.parse('(a) @b\n(c @d\n(e) @f\n').definitions();
		const item = first!.$trivia.trailing().find((entry) => typeof entry !== 'number' && entry.$type === ERROR_KIND_ID);
		expect(item).toBeDefined();
		expect(engine.isErrorNode(item)).toBe(true);
	});

	it('is taken back as a trivia entry of another node and renders its source text', () => {
		const [first] = engine.parse('(a) @b\n(c @d\n(e) @f\n').definitions();
		const item = first!.$trivia.trailing().find((entry) => typeof entry !== 'number' && entry.$type === ERROR_KIND_ID);
		const [other] = engine.parse('(x) @y\n').definitions();
		expect(other!.$trivia.trailing(item!).$render()).toContain('(c @d\n(e) @f');
	});
});
