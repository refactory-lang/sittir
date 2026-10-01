import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const ir = py.build;

describe('re-seating an untouched parsed wrapper', () => {
	it('keeps the line break a line-break-terminated arm ends in', () => {
		const matches = py.parse('match x:\nmatch y:\n').statements() as any[];
		const first = ir.matchStatement.coerce({ subjects: ir.subjects.coerce(ir.identifier('p')), body: matches[0].body() });
		const second = ir.matchStatement.coerce({ subjects: ir.subjects.coerce(ir.identifier('q')), body: matches[1].body() });
		expect(ir.module.coerce(first, second).$render()).toBe('match p:\nmatch q:\n');
	});

	it('keeps the line break around a parsed suite_empty as before', () => {
		const loops = py.parse('while x:\nwhile y:\n').statements() as any[];
		const first = ir.whileStatement.coerce({ condition: ir.identifier('p'), body: loops[0].body() });
		expect(ir.module.coerce(first, first).$render()).toBe('while p:\nwhile p:\n');
	});
});
