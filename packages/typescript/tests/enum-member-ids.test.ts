// An enum member crosses as its kind id wherever it is stored: a field value, a list item, and a member spelled by
// more than one token alike.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

type Stored = Record<string, unknown>;

function read(source: string): unknown {
	return ts.parse(source, { depth: Infinity });
}

function storedOfKind(node: unknown, kind: number): Stored | undefined {
	if (node === null || typeof node !== 'object') return undefined;
	if (Array.isArray(node)) {
		for (const entry of node) {
			const found = storedOfKind(entry, kind);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	if ((node as Stored).$type === kind) return node as Stored;
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_')) continue;
		const found = storedOfKind((node as Stored)[key], kind);
		if (found !== undefined) return found;
	}
	return undefined;
}

describe('a read stores an enum member as its kind id', () => {
	it('in a field', () => {
		expect(storedOfKind(read('let y: number;\n'), ts.kinds.TypeAnnotation)?._type).toBe(ts.kinds.NumberKeyword);
	});

	it('in a list item', () => {
		const items = storedOfKind(read('let z: Array<number>;\n'), ts.kinds.Types)?._item as readonly unknown[] | undefined;
		expect(Array.from(items ?? [])).toEqual([ts.kinds.NumberKeyword]);
	});

	it('for a member spelled by two tokens', () => {
		expect(storedOfKind(read('declare const x: unique symbol;\n'), ts.kinds.TypeAnnotation)?._type).toBe(ts.kinds.Unique);
	});
});
