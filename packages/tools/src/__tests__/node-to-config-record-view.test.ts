import { describe, expect, it } from 'vitest';
import type { QuerySlotEntry } from '@sittir/types';
import { RECORD } from '../../../common/src/record-view.ts';
import { buildFactoryNodeFromReference, type FactoryDispatchArtifacts, type FactoryEntry, type SlotAccessorOf } from '../validate/common.ts';

const KINDS = ['envelope', 'word'];
const id = (kind: string): number => KINDS.indexOf(kind) + 1;
const kindNameFromId = (kindId: number): string | undefined => KINDS[kindId - 1];
const slots: Readonly<Record<string, readonly QuerySlotEntry[]>> = { envelope: [['content', 0, undefined, '_content']] };
const accessors: Readonly<Record<string, Readonly<Record<string, string>>>> = { envelope: { _content: 'content' } };
const accessorOf: SlotAccessorOf = (typeId) => {
	const kind = kindNameFromId(typeId) ?? String(typeId);
	return { kind, slots: slots[kind] ?? [], accessors: accessors[kind] ?? {}, separator: false };
};
const artifacts = (factoryMap: Record<string, FactoryEntry>): FactoryDispatchArtifacts => ({
	factoryMap,
	factoryShapes: { envelope: 'text', word: 'text' },
	fieldAliasMap: {},
	factoryFields: {},
	factorySlots: {}
});

describe('a record view handed to a text builder', () => {
	it('gives the text of its sole slot when it holds no text of its own', () => {
		const word = { $type: id('word'), $text: 'abc' };
		const envelope = { $type: id('envelope'), [RECORD]: 8, content: () => word };
		const built = buildFactoryNodeFromReference(envelope, 'envelope', artifacts({ envelope: (text: string) => ({ text }) }), { kindNameFromId, accessorOf });
		expect(built).toEqual({ text: 'abc' });
	});
});
