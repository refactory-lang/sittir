// A kind whose one argument fills a slot that can hold the kind itself
// takes a node of its own kind as that slot's value: the call wraps it. No
// other reading is offered, because returning the node unchanged and
// rebuilding from its elements are both indistinguishable from wrapping at
// the call site. A list that cannot contain itself has no such ambiguity
// and still takes its own node as its elements.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const x = py.build.identifier('x');
const y = py.build.identifier('y');

describe('an argument of the builder\'s own kind', () => {
	it('is wrapped by a unary wrapper', () => {
		expect(py.build.await(py.build.await(x)).$render()).toBe('await await x');
		expect(py.build.notOperator(py.build.notOperator(x)).$render()).toBe('not not x');
	});

	it('is one element of a list that can hold itself', () => {
		const inner = py.build.tuple(x, y);
		expect(py.build.tuple(inner as never).collectionElements()?.elements()).toEqual([inner]);
		expect(py.build.list(py.build.list(x) as never).$render()).toBe('[[x]]');
	});

	it('is one element of a spread kind', () => {
		const inner = py.build.unionPattern(py.build.dottedName(x), py.build.dottedName(y));
		expect(py.build.unionPattern(inner as never).patterns().length).toBe(1);
	});

	it('is still the elements of a list that cannot hold itself', () => {
		expect(py.build.argumentList(py.build.argumentList(x) as never).$render()).toBe('(x)');
	});
});
