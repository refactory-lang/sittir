import { describe, expect, it } from 'vitest';
import { loadNodeModel } from '../src/validate/common.ts';

describe('loadNodeModel slot tables', () => {
	it('key a slot by its model name, which a factory input and its accessor share', async () => {
		const model = await loadNodeModel('rust');
		expect(Object.keys(model.slotKinds.argument!)).toEqual(['attributeItems', 'expression']);
		expect(model.slotMultiple.argument).toEqual({ attributeItems: true, expression: false });
		expect(model.slotRequired.argument).toEqual({ attributeItems: false, expression: true });
	});
});
