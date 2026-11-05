import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const ir = py.build;

describe('re-seating an untouched parsed wrapper', () => {
	it('keeps the line break a line-break-terminated arm ends in', () => {
		const [loop] = py.parse('while x: a\nwhile y: b\n').statements();
		if (!loop || !py.is.whileStatement(loop)) throw new Error('expected a while statement');
		const first = ir.whileStatement({ condition: ir.identifier('p'), body: loop.body() });
		expect(ir.module(first, first).$render()).toBe('while p: a\nwhile p: a\n');
	});

	it('keeps the line break around a parsed suite_empty as before', () => {
		const [loop] = py.parse('while x:\nwhile y:\n').statements();
		if (!loop || !py.is.whileStatement(loop)) throw new Error('expected a while statement');
		const first = ir.whileStatement({ condition: ir.identifier('p'), body: loop.body() });
		expect(ir.module(first, first).$render()).toBe('while p:\nwhile p:\n');
	});

	it.each([
		'while x:  # c\n',
		'while x:\n    # c\n',
		'a = 1  # c\nwhile x:\nb = 2\n',
		'while x:  # c\nwhile y:\n'
	])('does not gain a line break through trivia or deep reads in %j', (source) => {
		expect(py.parse(source).$render()).toBe(source);
	});
});
