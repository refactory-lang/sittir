import { describe, expect, it, vi } from 'vitest';
import { nodeToConfig, type Hydrate, type SlotAccessorOf } from '../validate/common.ts';

const accessorOf: SlotAccessorOf = (typeId) => ({ kind: String(typeId), accessors: {}, delimiter: false });

const slot = (propertyName: string) => ({ propertyName, unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false });
const KINDS = ['owner', 'clause', 'word'];
const id = (kind: string): number => KINDS.indexOf(kind) + 1;
const kindNameFromId = (kindId: number): string | undefined => KINDS[kindId - 1];
const leaf = { $type: id('word'), $named: true, $text: 'x' };

describe('nodeToConfig hydrates a coordinate through the wrap', () => {
	it('reads the node a coordinate names before building its config', () => {
		const coordinate = { $type: id('clause'), $treeHandle: 1, $span: { start: 0, end: 1 } };
		const hydrate: Hydrate = (entry) => (entry === coordinate ? { $type: id('clause'), _value: leaf } : entry);
		const clause = vi.fn((config: unknown) => ({ $type: id('clause'), config }));
		const word = (text: string) => ({ $type: id('word'), $text: text });
		const config = nodeToConfig({ $type: id('owner'), _body: coordinate } as never, {
			kindNameFromId,
			accessorOf,
			tree: { source: 'x' } as never,
			hydrate,
			factoryMap: { clause, word } as never,
			factoryShapes: { owner: 'config', clause: 'config', word: 'text' },
			factorySlots: { owner: { body: slot('body') }, clause: { value: slot('value') } }
		});
		expect(clause).toHaveBeenCalledWith(expect.objectContaining({ value: expect.objectContaining({ $text: 'x' }) }));
		expect(config).toMatchObject({ body: { $type: id('clause') } });
	});
});
