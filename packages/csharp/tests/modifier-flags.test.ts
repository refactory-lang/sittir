import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

type Engine = (typeof engines)['arena'];
type Accessors = Record<string, () => unknown>;

function firstOf(engine: Engine, source: string, kind: number): Accessors {
	const parsed = engine.parse(source);
	const node = [...parsed.$query().$descendants.ofType(kind as never)][0];
	expect(node).toBeDefined();
	return node as unknown as Accessors;
}

function rendered(engine: Engine, node: unknown): string {
	return String(engine.render(node as never)).replace(/\s+/g, ' ').trim();
}

describe.each(Object.entries(engines))('C# modifiers are flags in %s storage', (_, engine) => {
	const kinds = engine.kinds as unknown as Record<string, number>;

	it.each([
		['using System;', false, false],
		['using static System.Math;', true, false],
		['using unsafe System.Runtime;', false, true],
		['using static unsafe System.Math;', true, true]
	])('%s reads static and unsafe as flags', (source, isStatic, isUnsafe) => {
		const node = firstOf(engine, source, kinds.UsingDirective!);
		expect([node.static!(), node.unsafe!()]).toEqual([isStatic, isUnsafe]);
		expect(rendered(engine, node)).toBe(source);
	});

	it.each([
		['var f = x => x;', false, false],
		['var f = static x => x;', true, false],
		['var f = async x => x;', false, true],
		['var f = static async x => x;', true, true],
		['var f = async static x => x;', true, true]
	])('%s reads a lambda\'s static and async as flags', (source, isStatic, isAsync) => {
		const node = firstOf(engine, source, kinds.LambdaExpression!);
		expect([node.static!(), node.async!()]).toEqual([isStatic, isAsync]);
		expect(rendered(engine, node)).toBe(source.replace(/^var f = |;$/g, ''));
	});

	it.each([
		['var d = delegate { };', false, false],
		['var d = static async delegate { };', true, true],
		['var d = async static delegate { };', true, true]
	])('%s reads an anonymous method\'s static and async as flags', (source, isStatic, isAsync) => {
		const node = firstOf(engine, source, kinds.AnonymousMethodExpression!);
		expect([node.static!(), node.async!()]).toEqual([isStatic, isAsync]);
		expect(rendered(engine, node)).toBe(source.replace(/^var d = |;$/g, ''));
	});

	it.each([
		['int x', false, false],
		['this int x', true, false],
		['scoped ref int x', false, true],
		['this scoped ref readonly int x', true, true],
		['out int x', false, false],
		['in int x', false, false],
		['ref this int x', true, false],
		['in this int x', true, false]
	])('a parameter %s reads this and scoped as flags and one mode', (parameter, isThis, isScoped) => {
		const parsed = engine.parse(`static class C { static void M(${parameter}) {} }`);
		expect(parsed.$errors).toHaveLength(0);
		const node = firstOf(engine, `static class C { static void M(${parameter}) {} }`, kinds.Parameter!);
		expect([node.this!(), node.scoped!()]).toEqual([isThis, isScoped]);
		expect(rendered(engine, node)).toBe(parameter);
	});

	it('builds the flags in their one order', () => {
		const ir = engine.build as unknown as Record<string, ((config: unknown) => unknown) & Record<string, (config: unknown) => unknown>>;
		const id = (text: string) => ir.identifier!(text);
		const tokens = (node: unknown) => rendered(engine, node).replace(/\s+/g, '');
		expect(tokens(ir.usingDirective!({ unsafe: true, static: true, content: id('Math') }))).toBe('usingstaticunsafeMath;');
		expect(tokens(ir.usingDirective!({ content: id('Math') }))).toBe('usingMath;');
		expect(tokens(ir.usingDirective!.alias!({ unsafe: true, name: id('P'), type: id('T') }))).toBe('usingunsafeP=T;');
		expect(rendered(engine, ir.lambdaExpression!({ async: true, static: true, parameters: ir.implicitParameter!('x'), body: id('x') }))).toBe('static async x => x');
		expect(rendered(engine, ir.anonymousMethodExpression!({ async: true, static: true, block: ir.block!([]) }))).toBe('static async delegate { }');
		expect(rendered(engine, ir.parameter!({ mode: 'ref readonly', scoped: true, this: true, type: id('T'), name: id('x') }))).toBe('this scoped ref readonly T x');
		expect(rendered(engine, ir.parameter!({ mode: 'ref', this: true, type: id('int'), name: id('x') }))).toBe('this ref int x');
		expect(rendered(engine, ir.parameter!({ mode: 'in', this: true, type: id('int'), name: id('x') }))).toBe('this in int x');
	});
});
