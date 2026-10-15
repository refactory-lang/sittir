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
		const members = entries
			.flatMap((entry) => entry.members)
			.filter((member) => member.name === 'parameters' && member.route === 'nested');
		expect(members.length).toBeGreaterThanOrEqual(2);
		for (const member of members) {
			if (member.route !== 'nested') throw new Error('expected a nested member');
			expect(member.multiple).toBe(true);
			expect(member.slot).toMatchObject({ name: 'item', multiple: true });
			expect(member.path).toBeDefined();
		}
	});
}
