import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);

describe('a python match body holds a case, as CPython requires', () => {
	it.each(['match x:\n', 'match x:\n    # c\n', 'match x:\ny = 0\n'])('refuses %j', (source) => {
		expect(() => py.parse(source, { errors: 'throw' })).toThrow();
	});

	it('reads a match body as one match block holding its cases', () => {
		const statement = py.parse('match x:\n    case 1:\n        pass\n', { errors: 'throw' }).statements()[0]!;
		if (!py.is.matchStatement(statement)) throw new Error('expected a match statement');
		const body = statement.body();
		expect(body.$type).toBe(py.kinds.MatchBlock);
		expect(body.alternatives()).toHaveLength(1);
	});

	it('builds no empty match block', () => {
		expect(Object.keys(py.build).filter((name) => /^(matchBlockEmpty|matchBlockBlock)$/.test(name))).toEqual([]);
	});
});
