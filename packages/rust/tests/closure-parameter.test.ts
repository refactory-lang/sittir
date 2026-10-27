import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portable } from '@sittir/common/portable';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const isParameter = portable.is.declaration.parameter as unknown as (node: unknown) => boolean;

describe("a closure's untyped parameter is the closure_parameter envelope", () => {
	it('reads as a parameter by its own kind, with no placement', () => {
		const parameters = [
			...rs.parse('fn f() { let g = |a, mut b, _, c: u8| a; }').$query().$descendants.ofType(rust.kinds.ClosureParameter)
		];
		expect(parameters.map((parameter) => parameter.$render())).toEqual(['a', 'mut b', '_']);
		expect(parameters.every(isParameter)).toBe(true);
	});

	it('lifts a bare string and a pattern node into the envelope on the loose surface', () => {
		const closure = rs.build.closureExpressionExpr({
			parameters: ['a', rs.build.mutPattern('b'), '_'],
			body: 'a'
		});
		expect(closure.$render()).toBe('|a, mut b, _| a');
		expect(closure.parameters().parameters().map((parameter) => parameter.$type)).toEqual([
			rust.kinds.ClosureParameter,
			rust.kinds.ClosureParameter,
			rust.kinds.ClosureParameter
		]);
	});
});
