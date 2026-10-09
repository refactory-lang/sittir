import { describe, expect, it, vi } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
import { holdReadTree } from '../src/transport-data.ts';
import { mintTreeToken } from '../src/tree-token.ts';
import { liveHandle } from './support/fake-engine.ts';
import { withMembers as withMethods } from './support/members.ts';
import {
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
		expect(typeof isNode).toBe('function');
		expect(typeof hasKind).toBe('function');
		expect(typeof coerceBooleanKeywordStorage).toBe('function');
		expect(typeof coerceBitflagStorage).toBe('function');
	});

	it('renders through the engine in scope', () => {
		const render = vi.fn(() => 'rendered');
		const trivia = { kindName: (type: AnyUntypedNode['$type']) => `k${type}`, kinds: new Set(['k1', 'k2', 'k3']), innerGaps: {}, rebuildWrappers: new Set<number>(), listKinds: new Set<number>() };
		const node = inEngine(liveHandle({ render, trivia }), () => withMethods({ $type: 1, $source: 2, _name: 'x' }));

		expect(node.$render()).toBe('rendered');
		expect(node.$trivia.trailing(node)).toBe(node);
		expect((node as unknown as { $_layout?: { trivia?: unknown } }).$_layout?.trivia).toEqual({ trailing: [node] });
		const triviaNodeA: AnyUntypedNode = { $type: 2, $source: 2, $text: 'a' };
		const triviaNodeB: AnyUntypedNode = { $type: 3, $source: 2, $text: 'b' };
		expect(node.$trivia.leading(triviaNodeA, triviaNodeB)).toBe(node);
		expect((node as unknown as { $_layout?: { trivia?: unknown } }).$_layout?.trivia).toEqual({ trailing: [node], leading: [triviaNodeA, triviaNodeB] });
		expect(render).toHaveBeenCalledTimes(1);
		expect(render).toHaveBeenCalledWith(node);
	});

	it('guards and coercers behave consistently', () => {
		expect(isNode({ $type: 1, $source: 2, _name: 'x' })).toBe(true);
		expect(isNode({ $type: 1 })).toBe(false);
		const read = { $type: 1, $text: 'x' };
		holdReadTree(read, mintTreeToken(1));
		expect(isParsedNode(read)).toBe(true);
		expect(isParsedNode({ ...read })).toBe(false);
		expect(isParsedNode({ $type: 1, $source: Source.Ts })).toBe(false);
		expect(isFactoryNode({ $type: 1, $source: Source.Factory })).toBe(true);
		expect(isFactoryNode(read)).toBe(false);
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
		const error = { $type: ERROR_KIND_ID, $text: '1 $', $_layout: { at: { $treeHandle: 2, $span: { start: 4, end: 7 }, $type: ERROR_KIND_ID } } };
		holdReadTree(error, mintTreeToken(1));
		expect(isErrorNode(error)).toBe(true);
		expect(isErrorNode({ ...error, $source: Source.Factory })).toBe(false);
		expect(isErrorNode({ $type: 1, $source: Source.Ts, $text: 'x' })).toBe(false);
		expect(isErrorNode(ERROR_KIND_ID)).toBe(false);
	});
});
