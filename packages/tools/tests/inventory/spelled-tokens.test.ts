import { describe, expect, it } from 'vitest';
import { loadInputs } from '../../src/inventory/index.ts';

describe("a grammar's model", () => {
	it('records the tokens every parse of a kind spells outside its slots', async () => {
		const [rust] = await loadInputs(['rust']);
		expect(rust!.model.get('expression_statement_with_semi')?.spells).toEqual([';']);
		expect(rust!.model.get('inner_attribute_item')?.spells).toEqual(['#', '!', '[', ']']);
		expect(rust!.model.get('expression_statement')?.spells).toEqual([]);
	}, 300_000);
});
