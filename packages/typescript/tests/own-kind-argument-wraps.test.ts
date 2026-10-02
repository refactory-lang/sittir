// A kind whose one argument fills a slot that can hold the kind itself
// takes a node of its own kind as that slot's value: the call wraps it. No
// other reading is offered, because returning the node unchanged and
// rebuilding from its elements are both indistinguishable from wrapping at
// the call site. A list that cannot contain itself has no such ambiguity
// and still takes its own node as its elements.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const x = ts.build.identifier('x');

describe('an argument of the builder\'s own kind', () => {
	it('is wrapped by a unary wrapper', () => {
		expect(ts.build.awaitExpression(ts.build.awaitExpression(x)).$render()).toBe('await await x');
	});

	it('is one element of a list that can hold itself', () => {
		expect(ts.build.tupleType(ts.build.tupleType('A', 'B')).$render()).toBe('[[A, B]]');
	});

	it('is one element of a spread kind', () => {
		expect(ts.build.array(ts.build.array(x)).$render()).toBe('[[x]]');
	});

	it('is still the elements of a list that cannot hold itself', () => {
		expect(ts.build.arguments(ts.build.arguments(x)).$render()).toBe('(x)');
	});
});
