import { describe, expect, it } from 'vitest';
import { editedWithin, markIndexEdited, register, registered } from '../src/identity.ts';
import type { TreeHandle } from '../src/read.ts';

describe('the registry', () => {
	it('answers what was registered, per tree, index and role', () => {
		const a: TreeHandle = { id: 1 };
		const b: TreeHandle = { id: 2 };
		const envelope = {};
		const content = {};
		register(a, 7, 'node', envelope);
		register(a, 7, 'aliasContent', content);
		expect(registered(a, 7, 'node')).toBe(envelope);
		expect(registered(a, 7, 'aliasContent')).toBe(content);
		expect(registered(b, 7, 'node')).toBeUndefined();
		expect(registered(a, 8, 'node')).toBeUndefined();
	});
});

describe('the edited set', () => {
	it('answers whether an inside edit lies in a half-open range', () => {
		const tree: TreeHandle = { id: 3 };
		markIndexEdited(tree, 10, 'inside');
		markIndexEdited(tree, 4, 'inside');
		markIndexEdited(tree, 10, 'inside');
		expect(editedWithin(tree, 0, 4)).toBe(false);
		expect(editedWithin(tree, 0, 5)).toBe(true);
		expect(editedWithin(tree, 5, 10)).toBe(false);
		expect(editedWithin(tree, 10, 11)).toBe(true);
		expect(editedWithin({ id: 4 }, 0, 100)).toBe(false);
	});

	it('an outside edit edits the ranges that strictly contain its index, not its own', () => {
		const tree: TreeHandle = { id: 5 };
		markIndexEdited(tree, 7, 'outside');
		expect(editedWithin(tree, 7, 9)).toBe(false);
		expect(editedWithin(tree, 6, 9)).toBe(true);
		expect(editedWithin(tree, 8, 9)).toBe(false);
	});
});
