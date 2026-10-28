import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import rust from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await createEngine(rust, { api: 'strict' }));
const statementsOf = (source: string) => runtime.engine.parse(source).statements();
const readFirst = (source: string): Read => runtime.read(statementsOf(source)[0]!) as Read;
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(source)) as Read) as never));

describe('the portable read', () => {
	it('reads a function as its most specific path, the flags that hold, its name and one parameter structure', () => {
		const fn = readFirst('pub async fn f(a: u8) {}');
		expect(fn).toMatchObject({ $path: 'declaration.function.public', $flags: ['async'], name: 'f' });
		expect(fn.parameters).toEqual([{ $path: 'declaration.parameter', name: 'a', type: rust.kinds.U8Keyword }]);
	});

	it.each([
		['pub async fn f(a: u8) {}', 'pub async fn f(a: u8) {}\n'],
		['a + b;', 'a + b;\n'],
		['|a, mut b, _| a;', '|a, mut b, _| a;\n'],
		['struct S { x: u8 }', 'struct S {\n    x: u8,\n}\n']
	])('builds %j back from its read', (source, rendered) => {
		expect(roundTrip(source)).toBe(rendered);
	});

	it('reads a value no path claims as its node, which builds back as it is', () => {
		const statement = statementsOf('r"x";')[0];
		if (statement === undefined || !runtime.engine.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const content = statement.content();
		if (!runtime.engine.is.expressionStatementWithSemi(content)) throw new Error('expected a statement with its semicolon');
		expect((runtime.read(statement) as Read).content).toBe(content.expression());
		expect(roundTrip('r"x";')).toBe('r"x";\n');
	});

	it('reads an empty list as an empty list, so its form builds back', () => {
		expect(readFirst('struct S {}')).toEqual({ $path: 'declaration.struct', name: 'S', body: [] });
		expect(roundTrip('struct S {}')).toBe('struct S {}\n');
		expect(roundTrip('f();')).toBe('f();\n');
	});

	it('reads a receiver and the parameters after it, and a scope through the containers its mount stands in for', () => {
		expect(roundTrip('impl S { fn f(&self, a: u8) {} }')).toBe('impl S {\n    fn f(&self, a: u8) {}\n}\n');
		expect(roundTrip('pub(in a::b) struct S {}')).toBe('pub(in a::b) struct S {}\n');
	});

	it('reads an integer through its digit separators, and carries one whose value it cannot read', () => {
		const read = readFirst('let x = 1_000 + 1_000u32;');
		expect(read.value).toMatchObject({ left: { $path: 'literal.number.integer', $value: 1000 }, right: { $type: rust.kinds.IntegerLiteralDecimal } });
		expect(roundTrip('let x = 1_000 + 1_000u32;')).toBe('let x = 1000 + 1_000u32;\n');
	});

	it('builds back a method call, and an enum whose variants take a tuple or a brace list', () => {
		expect(roundTrip('a.b(c);')).toBe('a.b(c);\n');
		expect(roundTrip('enum O { A, B(T), C { x: u8 } }')).toBe('enum O {\n    A,\n    B(T),\n    C {\n        x: u8,\n    },\n}\n');
	});

	it('carries a node whose flags its path cannot build: a byte literal stays a byte', () => {
		expect(readFirst("let c = b'a';").value).toMatchObject({ $type: rust.kinds.CharLiteralPlain });
		expect(roundTrip("let c = b'a';")).toBe("let c = b'a';\n");
	});
});
