import { beforeAll, expect, it } from 'vitest';
import { loadInputs } from '../../src/inventory/index.ts';
import { resolveRoutes, type GrammarInput } from '../../../codegen/src/bindings/routes.ts';

let inputs: readonly GrammarInput[];
beforeAll(async () => {
	inputs = await loadInputs(['rust', 'typescript']);
}, 120000);

for (const [grammar, owner] of [
	['rust', 'function_item'],
	['typescript', 'function_declaration']
] as const) {
	it(`${grammar}: both plain and receiver rest captures reach the repeated item slot`, () => {
		const input = inputs.find((input) => input.grammar === grammar)!;
		const entries = resolveRoutes(input).readEntries.get(owner) ?? [];
		const slots = entries
			.flatMap((entry) => entry.slots)
			.filter((slot) => slot.name === 'parameters' && slot.route === 'nested');
		expect(slots.length).toBeGreaterThanOrEqual(2);
		for (const slot of slots) {
			if (slot.route !== 'nested') throw new Error('expected a nested slot');
			expect(slot.multiple).toBe(true);
			expect(slot.slot).toMatchObject({ name: 'item', multiple: true });
			expect(slot.path).toBeDefined();
		}
	}, 120000);
}
