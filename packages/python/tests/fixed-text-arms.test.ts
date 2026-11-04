import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const ir = py.build;

describe('an arm whose only slot holds a fixed-text token takes no argument', () => {
	it('builds an empty except clause and renders its newline in context', () => {
		const statement = ir.tryStatement({
			body: ir.suite.empty(),
			handlers: [ir.exceptClause({ body: ir.suite.empty() })]
		});
		expect(ir.module(statement, statement).$render()).toBe('try:\nexcept:\ntry:\nexcept:\n');
	});
});
