import { describe, expect, it, vi } from 'vitest';
import type { AnyNodeData } from '@sittir/types';
import {
	withMethods,
	isNodeData,
	isTreeNode,
	hasKind,
	coerceBooleanKeywordStorage,
	coerceBitflagStorage,
} from '../src/utils.ts';

describe('@sittir/common/utils runtime surface', () => {
	it('exports the shared runtime helpers', () => {
		expect(typeof withMethods).toBe('function');
		expect(typeof isNodeData).toBe('function');
		expect(typeof isTreeNode).toBe('function');
		expect(typeof hasKind).toBe('function');
		expect(typeof coerceBooleanKeywordStorage).toBe('function');
		expect(typeof coerceBitflagStorage).toBe('function');
	});

	it('attaches render/edit helpers from the explicit engine surface', () => {
		const render = vi.fn(() => 'rendered');
		const toEdit = vi.fn((_node, startOrRange, endPos) => ({
			startPos: typeof startOrRange === 'number' ? startOrRange : startOrRange.start.index,
			endPos:
				typeof startOrRange === 'number' ? (endPos ?? startOrRange) : startOrRange.end.index,
			insertedText: 'rendered'
		}));
		const node = withMethods({ $type: 1, $source: 2, _name: 'x' }, { render, toEdit });

		expect(node.$render()).toBe('rendered');
		expect(node.$toEdit({ start: { index: 0 }, end: { index: 3 } })).toEqual({
			startPos: 0,
			endPos: 3,
			insertedText: 'rendered'
		});
		expect(
			node.$replace({
				range: () => ({ start: { index: 4 }, end: { index: 7 } })
			})
		).toEqual({
			startPos: 4,
			endPos: 7,
			insertedText: 'rendered'
		});
		expect(node.$trivia({ trailing: [node] })).toBe(node);
		expect((node as Record<string, unknown>).$triviaData).toEqual({ trailing: [node] });
		const triviaNodeA: AnyNodeData = { $type: 2, $source: 2, $text: 'a' };
		const triviaNodeB: AnyNodeData = { $type: 3, $source: 2, $text: 'b' };
		expect(node.$trivia(triviaNodeA, triviaNodeB)).toBe(node);
		expect((node as Record<string, unknown>).$triviaData).toEqual({ leading: [triviaNodeA, triviaNodeB] });
		expect(render).toHaveBeenCalledTimes(1);
		expect(render).toHaveBeenCalledWith(node);
		expect(toEdit).toHaveBeenCalledTimes(2);
		expect(toEdit).toHaveBeenNthCalledWith(1, node, { start: { index: 0 }, end: { index: 3 } }, undefined);
		expect(toEdit).toHaveBeenNthCalledWith(2, node, { start: { index: 4 }, end: { index: 7 } });
	});

	it('guards and coercers behave consistently', () => {
		expect(isNodeData({ $type: 1, $source: 2, _name: 'x' })).toBe(true);
		expect(isNodeData({ $type: 1 })).toBe(false);
		expect(isTreeNode({ type: 'x', field: () => undefined, text: () => 'x' })).toBe(true);
		expect(isTreeNode({ type: 'x' })).toBe(false);
		expect(hasKind({ kind: 'node' })).toBe(true);
		expect(hasKind({ kind: 1 })).toBe(false);
		expect(coerceBooleanKeywordStorage(undefined)).toBeUndefined();
		expect(coerceBooleanKeywordStorage([])).toBeUndefined();
		expect(coerceBooleanKeywordStorage(['x'])).toBe(true);
		expect(coerceBitflagStorage('a', ['a', 'b'])).toBe(1);
		expect(coerceBitflagStorage(['a', 'b'], ['a', 'b'])).toBe(3);
		expect(coerceBitflagStorage(false, ['a'])).toBeUndefined();
	});
});
