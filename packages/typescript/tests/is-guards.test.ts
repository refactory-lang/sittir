import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const { is, kinds } = ts;

describe('typescript kind guards', () => {
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
