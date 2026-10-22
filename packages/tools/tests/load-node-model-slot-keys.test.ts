import { describe, expect, it } from 'vitest';
import { loadNodeModel } from '../src/validate/common.ts';

describe('loadNodeModel slot tables', () => {
	it('key a slot by its model name, which a factory input and its accessor share', async () => {
		const model = await loadNodeModel('rust');
		expect(Object.keys(model.slotKinds.attributed_argument!)).toEqual(['attributeItems', 'expression']);
		expect(model.slotMultiple.attributed_argument).toEqual({ attributeItems: true, expression: false });
		expect(model.slotRequired.attributed_argument).toEqual({ attributeItems: false, expression: true });
	});
});
