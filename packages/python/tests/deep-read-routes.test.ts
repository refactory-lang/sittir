import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { readNode } from '../src/wrap.ts';
import { createEngine } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';

const py = await createEngine(python);

type Stored = Record<string, unknown>;

function readDeep(source: string): unknown {
	const { tree } = (py.diagnostics as unknown as { parseAndRead(source: string): { tree: TreeHandle } }).parseAndRead(source);
	return readNode(tree, undefined, undefined, 8);
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

const typed = (value: unknown): boolean => typeof (value as { $render?: unknown } | undefined)?.$render === 'function';

describe('a child read ahead of its parent reaches the model slot through the wrap', () => {
	it('a list the reader keys by its kind is stored, wrapped, under the slot the wrap routes it to', () => {
		const statement = storedOfKind(readDeep('from a import b, c\n'), py.kinds.ImportFromStatement);
		expect(typed(statement)).toBe(true);
		expect(statement).not.toHaveProperty('_import_list');
		const list = statement!._content as ArrayLike<unknown>;
		expect(typed(list)).toBe(true);
		expect(list.length).toBe(2);
	});

	it('a list owner sizes its view from the list read ahead with it', () => {
		const parameters = storedOfKind(readDeep('def f(a, b): pass\n'), py.kinds.Parameters);
		expect(typed(parameters)).toBe(true);
		expect(typed(parameters!._elements)).toBe(true);
		expect((parameters as unknown as ArrayLike<unknown>).length).toBe(2);
	});
});
