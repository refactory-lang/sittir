import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const ir = py.build;

describe('re-seating an untouched parsed wrapper', () => {
	it('keeps the line break a line-break-terminated arm ends in', () => {
		const [m1, m2] = py.parse('match x:\nmatch y:\n').statements();
		if (!m1 || !m2 || !py.is.matchStatement(m1) || !py.is.matchStatement(m2)) throw new Error('expected match statements');
		const first = ir.matchStatement.coerce({ subjects: ir.subjects.coerce(ir.identifier('p')), body: m1.body() });
		const second = ir.matchStatement.coerce({ subjects: ir.subjects.coerce(ir.identifier('q')), body: m2.body() });
		expect(ir.module.coerce(first, second).$render()).toBe('match p:\nmatch q:\n');
	});

	it('keeps the line break around a parsed suite_empty as before', () => {
		const [loop] = py.parse('while x:\nwhile y:\n').statements();
		if (!loop || !py.is.whileStatement(loop)) throw new Error('expected a while statement');
		const first = ir.whileStatement.coerce({ condition: ir.identifier('p'), body: loop.body() });
		expect(ir.module.coerce(first, first).$render()).toBe('while p:\nwhile p:\n');
	});

	it.each([
		'match x:  # c\n',
		'match x:\n    # c\n',
		'a = 1  # c\nmatch x:\nb = 2\n',
		'while x:  # c\nwhile y:\n'
	])('does not gain a line break through trivia or deep reads in %j', (source) => {
		expect(py.parse(source).$render()).toBe(source);
	});
});
