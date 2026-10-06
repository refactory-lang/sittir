// A comparison operator spelled by two tokens is stored as its own kind id, never as the id of the operator its text
// starts with.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { readNode } from '../src/wrap.ts';
import { createEngine } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';

const py = await createEngine(python);

function operatorsOf(source: string): unknown {
	const { tree } = (py.diagnostics as unknown as { parseAndRead(source: string): { tree: TreeHandle } }).parseAndRead(source);
	const found: unknown[] = [];
	const walk = (node: unknown): void => {
		if (node === null || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach(walk);
		const stored = node as Record<string, unknown>;
		if ('_operators' in stored) found.push(stored._operators);
		for (const key of Object.keys(stored)) if (key.startsWith('_')) walk(stored[key]);
	};
	walk(readNode(tree, undefined, undefined, 12));
	return found;
}

describe('comparison operators are stored by their own kind id', () => {
	it('`is not` and `is` are told apart', () => {
		expect(operatorsOf('a is not b\n')).toEqual([py.kinds.IsNot]);
		expect(operatorsOf('a is b\n')).toEqual([py.kinds.IsKeyword]);
	});
});
