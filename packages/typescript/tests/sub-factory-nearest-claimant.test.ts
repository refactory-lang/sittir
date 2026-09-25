import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';

describe('sub-factory flattening follows the slot', () => {
	it('mounts no grand arm through a fielded slot: tuple_parameter `name` keeps only its direct arms', () => {
		expect(typeof ir.tupleParameter.restPattern).toBe('function');
		expect((ir.tupleParameter.restPattern as unknown as Record<string, unknown>).memberExpression).toBeUndefined();
	});

	it("mounts the default export's from form on the export statement", () => {
		expect(typeof ir.exportStatement.default.from).toBe('function');
	});
});
