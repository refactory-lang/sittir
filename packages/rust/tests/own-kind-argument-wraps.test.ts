// A kind whose one argument fills a slot that can hold the kind itself
// takes a node of its own kind as that slot's value: the call wraps it. No
// other reading is offered, because returning the node unchanged and
// rebuilding from its elements are both indistinguishable from wrapping at
// the call site. A list that cannot contain itself has no such ambiguity
// and still takes its own node as its elements.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const x = rs.build.identifier('x');
const y = rs.build.identifier('y');

describe('an argument of the builder\'s own kind', () => {
	it('is wrapped by a unary wrapper', () => {
		expect(rs.build.awaitExpression(rs.build.awaitExpression(x)).$render()).toBe('x.await.await');
	});

	it('is one element of a list that can hold itself', () => {
		const inner = rs.build.tuplePattern(x, y);
		expect(rs.build.tuplePattern(inner).elements()?.items()).toEqual([inner]);
	});

	it('is one element of a spread kind', () => {
		expect(rs.build.tokenTree.paren(rs.build.tokenTree.paren(x)).$render()).toBe('((x))');
	});

	it('is still the elements of a list that cannot hold itself', () => {
		expect(rs.build.arguments(rs.build.arguments(x)).$render()).toBe('(x)');
	});
});
