import { describe, expect, it, vi } from 'vitest';
import { nodeToConfig, type Hydrate } from '../validate/common.ts';

const slot = { unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false };
const leaf = { $type: 'word', $named: true, $text: 'x' };

describe('nodeToConfig hydrates a coordinate through the wrap', () => {
	it('reads the node a coordinate names before building its config', () => {
		const coordinate = { $type: 'clause', $treeHandle: 1, $span: { start: 0, end: 1 } };
		const hydrate: Hydrate = (entry) => (entry === coordinate ? { $type: 'clause', _value: leaf } : entry);
		const clause = vi.fn((config: unknown) => ({ $type: 'clause', config }));
		const config = nodeToConfig({ $type: 'owner', _body: coordinate } as never, {
			tree: { source: 'x' } as never,
			hydrate,
			factoryMap: { clause } as never,
			factoryShapes: { owner: 'config', clause: 'config', word: 'text' },
			factorySlots: { owner: { body: slot }, clause: { value: slot } }
		});
		expect(clause).toHaveBeenCalledWith(expect.objectContaining({ value: expect.objectContaining({ $text: 'x' }) }));
		expect(config).toMatchObject({ body: { $type: 'clause' } });
	});
});
