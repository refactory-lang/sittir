// The engines the side tests render through, one per construction.
import { expect } from 'vitest';
import { createEngine } from '@sittir/common';
import { coordinateOf, recordOf } from '@sittir/common/utils';
import { builtRefOf } from '../../common/src/built-ref.ts';
import { carryTree } from '../../common/src/tree-token.ts';
import rust from '../src/index.ts';

export const objects = await createEngine(rust, { nodeStorage: 'object' });
export type Engine = typeof objects;
export const records = await createEngine(rust);
export const constructions: readonly [string, Engine][] = [
	['objects', objects],
	['records', records]
];

type Read = { readonly $type: number; $text?(): string };

// What a holder reads back for a child its builder was given: under object
// construction the given object itself; under record construction another
// handle of the given record, or for a leaf, which has no record, a leaf of
// the given kind and text.
export function expectGiven(read: unknown, given: object): void {
	if (builtRefOf(given) === undefined) {
		expect(read).toBe(given);
		return;
	}
	expect(recordOf(read as object)).toBe(recordOf(given));
	expect((read as Read).$type).toBe((given as Read).$type);
	expect((read as Read).$text?.()).toBe((given as Read).$text?.());
}

// A parsed node's coordinate as a lazy caller holds it: a copy that still holds its tree.
export const heldCoordinate = (node: object): object => carryTree(node, { ...coordinateOf(node)! });
