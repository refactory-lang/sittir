import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const engine = await createEngine(typescript);

describe('a parsed program renders the literal tokens the source wrote', () => {
	it.each([
		['a delegating yield', 'function* f() {\n  yield* g();\n}\n'],
		['a plain yield', 'function* f() {\n  yield g();\n}\n'],
		['an optional-chained type query subscript', 'type T = typeof a?.["b"];\n'],
		['a type query subscript', 'type T = typeof a["b"];\n']
	])('%s', (_name, source) => {
		expect(engine.parse(source).$render()).toBe(source);
	});
});

describe('a delegating yield keeps its star when it is rendered without its source', () => {
	it('builds `yield * g` and a plain yield without the star', () => {
		const built = engine.build.yieldExpression;
		expect(built.delegate({ expression: 'g' }).$render()).toBe('yield * g');
		expect(built({ expression: 'g' }).$render()).toBe('yield g');
	});

	it('reads a delegating yield into the delegate form and renders it again from its parts', () => {
		type Parsed = { statements(): Parsed[]; body(): Parsed; expression(): Parsed; $type: number; $render(): string };
		const fn = (engine.parse('function* f() {\n  yield* g();\n}\n') as unknown as Parsed).statements()[0]!;
		const yielded = fn.body().statements()[0]!.expression();
		expect(yielded.$type).toBe(engine.kinds.YieldExpression);
		const rebuilt = engine.build.yieldExpression({ expression: yielded.expression() as never });
		expect(rebuilt.$render()).toBe('yield * g()');
	});
});
