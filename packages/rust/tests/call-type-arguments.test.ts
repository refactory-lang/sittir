import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await sharedEngine(() => createEngine(rust, { api: 'strict' })));
const render = (node: unknown): string => String(runtime.engine.render(node as never));
const expressionOf = (source: string): Read => {
	const file = runtime.read(runtime.engine.parse(`fn m() { ${source}; }`)) as Read;
	const body = (file.statements as readonly Read[])[0]!.body as Read;
	return ((body.statements as readonly Read[])[0]!.content ?? (body.statements as readonly Read[])[0]) as Read;
};
const roundTrip = (source: string): string => render(runtime.build(runtime.read(runtime.engine.parse(source)) as never));
const argument = (content: string) => ({ $path: 'element.type_argument', content, bounds: [] });
const member = { $path: 'expression.member', object: 'x', property: 'f' };
const qualified = { $path: 'identifier.qualified', qualifier: 'a', name: 'f' };

describe("a turbofish call's type arguments are the call's member", () => {
	it.each([
		['f::<T>()', 'expression.call', 'f'],
		['x.f::<T>()', 'expression.call.member', member],
		['a::f::<T>()', 'expression.call.qualified', qualified]
	] as const)('reads %s as %s, its function the callee before the turbofish', (source, path, callee) => {
		expect(expressionOf(source)).toMatchObject({ $path: path, function: callee, typeArguments: [argument('T')] });
	});

	it('reads a call with no turbofish with no type arguments, and an uncalled turbofish as an instantiation', () => {
		expect(expressionOf('x.f()')).toMatchObject({ $path: 'expression.call.member', function: member, typeArguments: [] });
		expect(expressionOf('f::<T>')).toMatchObject({ $path: 'expression.instantiation', function: 'f', typeArguments: [argument('T')] });
	});

	it.each(['f::<T>();', 'x.f::<T, U>(1);', 'a::f::<T>();', 'f();', 'x.f();', 'a::f();', 'f::<T>;', 'a::b::<T>::c();'])('rebuilds %s as written', (source) => {
		expect(roundTrip(`fn m() {\n    ${source}\n}`)).toBe(`fn m() {\n    ${source}\n}\n`);
	});

	it('builds the turbofish form when type arguments are given, and the plain form when they are absent or empty', () => {
		expect(render(runtime.build({ $path: 'expression.call', function: 'f', arguments: [], typeArguments: [argument('T')] } as never))).toBe('f::<T>()');
		expect(render(runtime.build({ $path: 'expression.call.member', function: member, arguments: [], typeArguments: [argument('T')] } as never))).toBe('x.f::<T>()');
		expect(render(runtime.build({ $path: 'expression.call.qualified', function: qualified, arguments: [], typeArguments: [argument('T')] } as never))).toBe('a::f::<T>()');
		expect(render(runtime.build({ $path: 'expression.call', function: 'f', arguments: [] } as never))).toBe('f()');
		expect(render(runtime.build({ $path: 'expression.call.member', function: member, arguments: [], typeArguments: [] } as never))).toBe('x.f()');
	});

	it("refuses a callee another call path owns, and a macro's type arguments, which no route seats", () => {
		const typed = { arguments: [], typeArguments: [argument('T')] };
		expect(() => runtime.build({ $path: 'expression.call', function: member, ...typed } as never)).toThrow(/no rust form of expression.member sits in/);
		expect(() => runtime.build({ $path: 'expression.call.member', function: 'f', ...typed } as never)).toThrow(/function has no route that seats the text "f"/);
		expect(() => runtime.build({ $path: 'expression.call.macro', function: 'm', ...typed } as never)).toThrow(/macro_invocation has no member typeArguments/);
	});
});
