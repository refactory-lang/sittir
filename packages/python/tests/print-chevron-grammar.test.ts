import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';

const engine = await python.createEngine();

describe("the print chevron follows CPython 2's grammar, '>>' test [ (',' test)+ [','] ]", () => {
	it('parses a destination alone, or followed by values with or without a trailing comma', () => {
		for (const source of ['print >> f\n', 'print >> f, x\n', 'print >> f, x,\n', 'print >> f, x, y\n']) expect(engine.parse(source).$errors).toEqual([]);
	});

	it('does not parse a comma with no value after the destination', () => {
		expect(engine.parse('print >> f,\n').$errors).not.toEqual([]);
	});
});
