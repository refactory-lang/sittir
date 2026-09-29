import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('arms follow the slot', () => {
	it('a fielded slot mounts no automatic arm: tuple_parameter `name` has none', () => {
		expect((ts.build.tupleParameter as unknown as Record<string, unknown>).restPattern).toBeUndefined();
	});

	it("mounts the default export's from form on the export statement", () => {
		expect(typeof ts.build.exportStatement.default.from).toBe('function');
	});
});
