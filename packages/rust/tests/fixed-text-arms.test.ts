import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const ir = rs.build;

describe('an arm whose slot holds a fixed-text token takes no argument for it', () => {
	it('builds a lower-bounded range pattern from its start bound alone', () => {
		expect(ir.rangePattern.lowerBounded({ start: ir.integerLiteral('1') }).$render()).toBe('1..');
	});
});
