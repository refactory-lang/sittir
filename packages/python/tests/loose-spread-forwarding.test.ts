import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const pyStrict = await createEngine(python, { api: 'strict' });
const statement = () => py.build.simpleStatements(py.build.passStatement);

describe('a loose entry whose one slot holds a child built from spread elements', () => {
	it('takes the spread elements the strict builder takes', () => {
		expect(py.build.suite.block(statement(), statement()).$render()).toBe(pyStrict.build.suite.block(statement(), statement()).$render());
	});

	it('passes its own node through when given one argument', () => {
		const own = py.build.suite.block(statement(), statement());
		expect(py.build.suite.block(own).$render()).toBe(own.$render());
	});
});
