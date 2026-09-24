import { describe, expect, it } from 'vitest';
import { loadNodeModel } from '../src/validate/common.ts';

describe('loadNodeModel slot tables', () => {
	it('key a slot by the config key a factory input names it with, not its accessor name', async () => {
		const model = await loadNodeModel('rust');
		expect(Object.keys(model.slotKinds._attributed_argument!)).toEqual(['attributeItem', 'expression']);
		expect(model.slotMultiple._attributed_argument).toEqual({ attributeItem: true, expression: false });
		expect(model.slotRequired._attributed_argument).toEqual({ attributeItem: false, expression: true });
	});
});
