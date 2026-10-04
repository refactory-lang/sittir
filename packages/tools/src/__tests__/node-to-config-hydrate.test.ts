import { describe, expect, it, vi } from 'vitest';
import { modelSlots } from '@sittir/common/utils';
import { nodeToConfig, type HydrateChild } from '../validate/common.ts';

const slot = { unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false };
const leaf = { $type: 'word', $named: true, $text: 'x' };

describe('nodeToConfig hydrates a read stub through the wrap', () => {
	it('maps a child the wrap routes from its parser key into the model slot', () => {
		const stub = { $type: 'clause', $parentHandle: 1, $childIndex: 0 };
		const hydrateChild: HydrateChild = (entry) =>
			entry === stub ? modelSlots({ $type: 'clause', _term: leaf }, ['_value'], { _term: '_value' }) : entry;
		const clause = vi.fn((config: unknown) => ({ $type: 'clause', config }));
		const config = nodeToConfig({ $type: 'owner', _body: stub } as never, {
			tree: { source: 'x' } as never,
			hydrateChild,
			factoryMap: { clause } as never,
			factoryShapes: { owner: 'config', clause: 'config', word: 'text' },
			factorySlots: { owner: { body: slot }, clause: { value: slot } }
		});
		expect(clause).toHaveBeenCalledWith(expect.objectContaining({ value: expect.objectContaining({ $text: 'x' }) }));
		expect(config).toMatchObject({ body: { $type: 'clause' } });
	});
});
