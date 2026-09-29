import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import { is } from '../src/is.ts';
import python from '../src/index.ts';

const py = await createEngine(python);
const { kinds } = py;

describe('python kind guards', () => {
	it('the engine guards read the language of the node and the package guards read the kind id only', () => {
		const node = py.parse('def f():\n    pass\n').statements()[0] as unknown as { readonly $type: number };
		expect(py.is.kind(node as never, node.$type)).toBe(true);
		expect(py.is.kind({ $type: node.$type } as never, node.$type)).toBe(false);
		expect(is.kind({ $type: node.$type }, node.$type)).toBe(true);
	});

	it('a kind guard matches its own numeric kind only', () => {
		expect(is.functionDefinition({ $type: kinds.FunctionDefinition })).toBe(true);
		expect(is.functionDefinition({ $type: kinds.ClassDefinition })).toBe(false);
	});

	it('is.kind compares against the kind it is given', () => {
		expect(is.kind({ $type: kinds.FunctionDefinition }, kinds.FunctionDefinition)).toBe(true);
		expect(is.kind({ $type: kinds.ClassDefinition }, kinds.FunctionDefinition)).toBe(false);
	});

	it('a supertype guard matches its members', () => {
		expect(is.compoundStatement({ $type: kinds.FunctionDefinition })).toBe(true);
	});
});
