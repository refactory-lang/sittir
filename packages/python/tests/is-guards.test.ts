import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const { is, kinds } = py;

describe('python kind guards', () => {
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
