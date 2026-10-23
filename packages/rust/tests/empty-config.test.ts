// An empty object given to a single-slot builder is its config with the slot
// left out, never the slot's content.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const fn = (parameters: unknown): string =>
	String(rs.build.functionItem({ name: 'f', parameters, body: rs.build.block({ statements: [] }) } as never));

describe('an empty config', () => {
	it('builds the kind with its slot absent', () => {
		expect(fn(rs.build.parameters({} as never))).toBe(fn(rs.build.parameters()));
	});

	it('builds an expression whose one slot is optional', () => {
		expect(String(rs.build.returnExpression({} as never))).toBe('return');
	});
});
