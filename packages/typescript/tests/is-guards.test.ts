import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import { is } from '../src/is.ts';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const { kinds } = ts;

describe('typescript kind guards', () => {
	it('the engine guards read the language of the node and the package guards read the kind id only', () => {
		const node = ts.parse('let a = 1;\n').statements()[0] as unknown as { readonly $type: number };
		expect(ts.is.kind(node as never, node.$type)).toBe(true);
		expect(ts.is.kind({ $type: node.$type } as never, node.$type)).toBe(false);
		expect(is.kind({ $type: node.$type }, node.$type)).toBe(true);
	});

	it('a kind guard matches its own numeric kind only', () => {
		expect(is.classDeclaration({ $type: kinds.ClassDeclaration })).toBe(true);
		expect(is.classDeclaration({ $type: kinds.FunctionDeclaration })).toBe(false);
	});

	it('is.kind compares against the kind it is given', () => {
		expect(is.kind({ $type: kinds.ClassDeclaration }, kinds.ClassDeclaration)).toBe(true);
		expect(is.kind({ $type: kinds.FunctionDeclaration }, kinds.ClassDeclaration)).toBe(false);
	});

	it('a supertype guard matches its members', () => {
		expect(is.declaration({ $type: kinds.ClassDeclaration })).toBe(true);
	});
});
