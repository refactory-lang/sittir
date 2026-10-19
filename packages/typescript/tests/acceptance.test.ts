import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

const errorsOf = (source: string): readonly unknown[] => ts.parse(source).$errors;

describe('accessor arity', () => {
	it.each([
		['getter with a parameter (class)', 'export class A { get x(a: number): number { return a; } }\n'],
		['setter with no parameter (class)', 'export class A { set y() {} }\n'],
		['setter with two parameters', 'export class A { set y(a: number, b: number) {} }\n'],
		['setter with a rest parameter', 'export class A { set y(...a: number[]) {} }\n'],
		['setter with an optional parameter', 'export class A { set y(a?: number) {} }\n'],
		['setter parameter with an initializer', 'export class A { set y(a = 1) {} }\n'],
		['getter with a parameter (object literal)', 'export const o = { get x(a: number) { return a; } };\n'],
		['setter with no parameter (object literal)', 'export const o = { set y() {} };\n'],
		['getter with a parameter (interface)', 'export interface I { get x(a: number): number }\n'],
		['getter with type parameters', 'export class A { get x<T>(): number { return 1; } }\n'],
		['setter with a return type', 'export class A { set x(v: number): void {} }\n'],
		['async getter', 'export class A { async get x() { return 1; } }\n']
	])('rejects the %s', (_, source) => {
		expect(errorsOf(source)).not.toEqual([]);
	});

	it.each([
		['getter', 'export class A { get x() {} }\n'],
		['getter with a return type', 'export class A { get x(): number { return 1; } }\n'],
		['setter with a destructuring parameter', 'export class A { set x({ a }) {} }\n'],
		['setter with a typed parameter', 'export class A { set x(v: number) {} }\n'],
		['async generator method', 'export class A { async *m() {} }\n'],
		['method named get', 'export class A { get?() {} }\n'],
		['static getter', 'export class A { static get x() { return 1; } }\n'],
		['object literal accessors', 'export const o = { get x() { return 1; }, set x(v) {} };\n'],
		['interface accessors', 'export interface I { get x(): number; set x(v: number); }\n'],
		['abstract accessors', 'export abstract class A { abstract get x(): number; abstract set x(v: number); }\n']
	])('accepts the %s', (_, source) => {
		expect(errorsOf(source)).toEqual([]);
	});
});

describe('class accessor modifiers', () => {
	it.each([
		['optional getter', 'export class A { get x?() {} }\n'],
		['readonly getter', 'export class A { readonly get x() {} }\n'],
		['declare accessor', 'export class A { declare accessor x: number }\n'],
		['readonly accessor', 'export class A { readonly accessor x: number }\n'],
		['optional accessor', 'export class A { accessor x?: number }\n']
	])('rejects the %s', (_, source) => {
		expect(errorsOf(source)).not.toEqual([]);
	});

	it.each([
		['abstract accessor in an abstract class', 'export abstract class A { abstract accessor x: number }\n'],
		['static accessor with an initializer', 'export class A { static accessor y = 1 }\n'],
		['private override accessor', 'export class B {}\nexport class A extends B { private override accessor x = 1 }\n'],
		// TS1243 (`static` with `abstract`) is a checker error, not a parse error: the grammar is context-free and the builder exclusions refuse it.
		['static abstract accessor', 'export abstract class A { static abstract accessor x: number }\n']
	])('accepts the %s', (_, source) => {
		expect(errorsOf(source)).toEqual([]);
	});

	it("parses a setter's parameter as a setter_parameter", () => {
		const found = [...ts.parse('export class A { set x(v: number) {} }\n').$query().$descendants.ofType(ts.kinds.SetterParameter)];
		expect(found).toHaveLength(1);
	});
});
