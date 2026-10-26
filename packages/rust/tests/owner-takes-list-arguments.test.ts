import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const rsStrict = await createEngine(rust, { api: 'strict' });
const x = rs.build.identifier('x');
const y = rs.build.identifier('y');

describe('a list owner takes every argument list its list takes', () => {
	it('seats a config element on the strict surface', () => {
		const list = rsStrict.build.argumentsElements({ attributeItems: [], expression: x }, { expression: y });
		expect(list.$render()).toBe('x, y');
		expect(rsStrict.build.arguments({ attributeItems: [], expression: x }, { expression: y }).$render()).toBe('(x, y)');
	});

	it('seats a config element on the loose surface', () => {
		expect(rs.build.arguments({ attributeItems: [], expression: x }, { expression: y }).$render()).toBe('(x, y)');
		expect(rs.build.arguments({ expression: x }).$render()).toBe('(x)');
	});

	it('takes an options bag first on both surfaces', () => {
		expect(rsStrict.build.arguments({ delimiter: Delimiter.Trailing }, x).$render()).toBe('(x,)');
		expect(rs.build.arguments({ delimiter: Delimiter.Trailing }, x, y).$render()).toBe('(x, y,)');
	});

	it('takes an options bag with a seated config element', () => {
		expect(rsStrict.build.arguments({ delimiter: Delimiter.Trailing }, { expression: x }).$render()).toBe('(x,)');
		expect(rs.build.arguments({ delimiter: Delimiter.Trailing }, { expression: x }).$render()).toBe('(x,)');
	});

	it('takes an options bag first when its list seats nothing', () => {
		const a = rs.build.identifier('a');
		expect(rsStrict.build.useList({ delimiter: Delimiter.Trailing }, a).$render()).toBe('{a,}');
		expect(rs.build.useList({ delimiter: Delimiter.Trailing }, a).$render()).toBe('{a,}');
	});

	it('still takes a built list and no argument', () => {
		expect(rsStrict.build.arguments(rsStrict.build.argumentsElements(x, y)).$render()).toBe('(x, y)');
		expect(rsStrict.build.arguments().$render()).toBe('()');
	});
});
