import { describe, expect, it, vi } from 'vitest';
import type { AnyNodeData } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
import { liveHandle } from './support/fake-engine.ts';
import {
	withMethods,
	isNode,
	isParsedNode,
	isFactoryNode,
	Source,
	hasKind,
	coerceBooleanKeywordStorage,
	coerceBitflagStorage,
	isErrorNode,
	ERROR_KIND_ID
} from '../src/utils.ts';

describe('@sittir/common/utils runtime surface', () => {
	it('exports the shared runtime helpers', () => {
		expect(typeof withMethods).toBe('function');
		expect(typeof isNode).toBe('function');
		expect(typeof hasKind).toBe('function');
		expect(typeof coerceBooleanKeywordStorage).toBe('function');
		expect(typeof coerceBitflagStorage).toBe('function');
	});

	it('attaches render/edit helpers from the engine in scope', () => {
		const render = vi.fn(() => 'rendered');
		const trivia = { kindName: (type: AnyNodeData['$type']) => `k${type}`, kinds: new Set(['k1', 'k2', 'k3']), innerGaps: {} };
		const node = inEngine(liveHandle({ render, trivia }), () => withMethods({ $type: 1, $source: 2, _name: 'x' }));

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
		expect((node as unknown as Record<string, unknown>).$_trivia).toEqual({ trailing: [node] });
		const triviaNodeA: AnyNodeData = { $type: 2, $source: 2, $text: 'a' };
		const triviaNodeB: AnyNodeData = { $type: 3, $source: 2, $text: 'b' };
		expect(node.$trivia(triviaNodeA, triviaNodeB)).toBe(node);
		expect((node as unknown as Record<string, unknown>).$_trivia).toEqual({ leading: [triviaNodeA, triviaNodeB] });
		expect(render).toHaveBeenCalledTimes(3);
		expect(render).toHaveBeenCalledWith(node);
	});

	it('guards and coercers behave consistently', () => {
		expect(isNode({ $type: 1, $source: 2, _name: 'x' })).toBe(true);
		expect(isNode({ $type: 1 })).toBe(false);
		expect(isParsedNode({ $type: 1, $source: Source.Ts })).toBe(true);
		expect(isParsedNode({ $type: 1, $source: Source.Sg })).toBe(true);
		expect(isParsedNode({ $type: 1, $source: Source.Factory })).toBe(false);
		expect(isFactoryNode({ $type: 1, $source: Source.Factory })).toBe(true);
		expect(isFactoryNode({ $type: 1, $source: Source.Ts })).toBe(false);
		expect(isFactoryNode({ $type: 1, _name: 'x' })).toBe(true);
		expect(isParsedNode({ $type: 1 })).toBe(false);
		expect(isFactoryNode({ $type: 1 })).toBe(false);
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

describe('isErrorNode', () => {
	it('accepts a read ERROR node and nothing else', () => {
		const error = { $type: ERROR_KIND_ID, $source: Source.Ts, $named: true, $text: '1 $', $span: { start: 4, end: 7 } };
		expect(isErrorNode(error)).toBe(true);
		expect(isErrorNode({ ...error, $source: Source.Factory })).toBe(false);
		expect(isErrorNode({ $type: 1, $source: Source.Ts, $text: 'x' })).toBe(false);
		expect(isErrorNode(ERROR_KIND_ID)).toBe(false);
	});
});
