import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';

describe('arms follow the slot', () => {
	it('a fielded slot mounts no automatic arm: tuple_parameter `name` has none', () => {
		expect((ir.tupleParameter as unknown as Record<string, unknown>).restPattern).toBeUndefined();
	});

	it("mounts the default export's from form on the export statement", () => {
		expect(typeof ir.exportStatement.default.from).toBe('function');
	});
});
