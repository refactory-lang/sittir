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
