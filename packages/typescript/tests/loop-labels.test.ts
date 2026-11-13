import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await sharedEngine(() => createEngine(typescript, { api: 'strict' })));
const render = (node: unknown): string => String(runtime.engine.render(node as never));
const firstOf = (source: string): Read => ((runtime.read(runtime.engine.parse(source)) as Read).statements as readonly Read[])[0]!;
const roundTrip = (source: string): string => render(runtime.build(runtime.read(runtime.engine.parse(source)) as never));
const condition = { $path: 'expression.parenthesized', expression: 'x' };
const block = (statements: readonly unknown[] = []) => ({ $path: 'statement.block', statements });
const labeledWhile = { $path: 'statement.loop.while', label: 'a', condition, body: block() };

describe('a label belongs to the loop or block it names', () => {
	it.each([
		['a: for (;;) {}', 'statement.loop.counted'],
		['a: for (x of y) {}', 'statement.loop.for_each'],
		['a: while (x) {}', 'statement.loop.while'],
		['a: do {} while (x);', 'statement.loop.do_while'],
		['a: {}', 'statement.block']
	] as const)('reads %s as %s with its label', (source, path) => {
		expect(firstOf(source)).toMatchObject({ $path: path, label: 'a' });
	});

	it('reads a label around any other statement as statement.labeled, the outer of two labels included', () => {
		expect(firstOf('a: x++;')).toMatchObject({ $path: 'statement.labeled', label: 'a', body: { $path: 'statement.expression' } });
		expect(firstOf('a: if (x) {}')).toMatchObject({ $path: 'statement.labeled', label: 'a', body: { $path: 'statement.if' } });
		expect(firstOf('a: b: for (;;) {}')).toMatchObject({ $path: 'statement.labeled', label: 'a', body: { $path: 'statement.loop.counted', label: 'b' } });
	});

	it.each(['a: for (;;) {}', 'a: for (x of y) {}', 'a: while (x) {}', 'a: do {} while (x);', 'a: {}', 'a: x++;', 'a: b: for (;;) {}', 'a: if (x) {}'])(
		'rebuilds %s as written',
		(source) => {
			expect(roundTrip(source)).toBe(`${source}\n`);
		}
	);

	it('builds a labeled loop wherever a statement is seated', () => {
		expect(render(runtime.build({ $path: 'file', statements: [{ ...labeledWhile, body: block([{ $path: 'statement.break', label: 'a' }]) }] } as never))).toBe(
			'a: while (x) {\n  break a;\n}\n'
		);
		expect(render(runtime.build({ $path: 'statement.block', statements: [labeledWhile] } as never))).toBe('{\n  a: while (x) {}\n}');
		expect(render(runtime.build({ $path: 'statement.if', condition: { ...condition, expression: 'y' }, consequence: labeledWhile } as never))).toBe(
			'if (y) a: while (x) {}'
		);
		expect(render(runtime.build({ $path: 'file', statements: [{ ...block(), label: 'a' }] } as never))).toBe('a: {}\n');
	});

	it("keeps break's own label, and refuses a statement.labeled whose body would read back as the labeled loop", () => {
		expect(render(runtime.build({ $path: 'statement.break', label: 'a' } as never))).toBe('break a;');
		expect(() => runtime.build({ $path: 'statement.labeled', label: 'a', body: { ...labeledWhile, label: undefined } } as never)).toThrow(
			/does not read as statement.labeled/
		);
	});

	it('refuses a labeled loop built as the root, since its label is its envelope', () => {
		expect(() => runtime.build(labeledWhile as never)).toThrow(/while_statement has no member label/);
	});
});
