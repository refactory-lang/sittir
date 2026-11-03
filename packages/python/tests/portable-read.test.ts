import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(read(source)) as never));
const firstOf = (source: string): unknown => (read(source).statements as readonly Read[])[0];

describe('the portable read', () => {
	it('reads the wildcard case pattern as the wildcard pattern, by its text', () => {
		const source = 'match x:\n    case _:\n        pass\n';
		expect(firstOf(source)).toMatchObject({ body: [{ $path: 'clause.case.match', pattern: '_' }] });
		expect(roundTrip(source)).toBe(source);
		expect(python.is.portable.pattern.wildcard('_')).toBe(true);
	});

	it('reads True, None and the ellipsis as their path and value, `pass` as its text, and builds them back', () => {
		const value = (source: string) => ((firstOf(source) as Read).content as Read).value;
		expect(value('x = True')).toEqual({ $path: 'literal.boolean.true', $value: true });
		expect(value('x = None')).toEqual({ $path: 'literal.null' });
		expect(value('x = ...')).toEqual({ $path: 'literal.ellipsis' });
		expect(firstOf('pass')).toBe('pass');
		for (const source of ['x = True', 'x = None', 'x = ...', 'pass']) expect(roundTrip(source)).toBe(`${source}\n`);
		// @ts-expect-error a value token reads as its path and value, so its guard takes no text
		expect(python.is.portable.literal.boolean('True')).toBe(false);
	});

	it('reads a member through its deepest route that seats a value, as the build places it', () => {
		const items = { $path: 'clause.resource.item', value: 'a', name: 'b' };
		expect(firstOf('with a as b: pass')).toMatchObject({ withClause: { items: [items] } });
		expect(roundTrip('with a as b: pass')).toBe('with a as b: pass\n');
		expect(roundTrip('with a: pass')).toBe('with a: pass\n');
	});

	it('reads the legacy not-equal under its meaning, so `<>` builds back as `<>` and `!=` as `!=`', () => {
		expect(firstOf('a <> b')).toMatchObject({ content: { $path: 'expression.binary.comparison.not_equal.legacy' } });
		for (const source of ['a <> b', 'a != b', 'a < b <> c']) expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('reads one comparison operand as one value, though its route walks a list, and builds it back', () => {
		expect(firstOf('a not in b')).toMatchObject({ content: { $path: 'expression.binary.membership.not_in', left: 'a', right: 'b' } });
		expect(roundTrip('a not in b')).toBe('a not in b\n');
		expect(roundTrip('a < b <= c')).toBe('a < b <= c\n');
	});

	it('carries a literal its seat would not build back from text, and reads digit separators and exponent spellings by value', () => {
		expect(firstOf('x = 1j')).toMatchObject({ content: { value: { $type: python.kinds.IntegerDecimalImaginary } } });
		expect(roundTrip('x = 1j')).toBe('x = 1j\n');
		expect(roundTrip('x = 0B1_1')).toBe('x = 0b11\n');
		expect(roundTrip('x = 1e-3')).toBe('x = 1e-3\n');
	});

	it('carries a literal inside a pattern whose slot holds only containers, and builds it back', () => {
		const source = 'match x:\n    case 3j as b1:\n        pass\n';
		expect(firstOf(source)).toMatchObject({ body: [{ pattern: { $path: 'pattern.as', pattern: { $type: python.kinds.IntegerDecimalImaginary }, name: 'b1' } }] });
		expect(roundTrip(source)).toBe(source);
	});

	it('reads a bare tuple\'s trailing comma as its flag where it holds two items or more, and builds it back from the flag', () => {
		const tuple = (source: string) => ((firstOf(source) as Read).content as Read).value;
		expect(tuple('x = 1, 2,')).toMatchObject({ $path: 'expression.collection.tuple.bare', $flags: ['trailingComma'] });
		expect(tuple('x = 1, 2')).not.toHaveProperty('$flags');
		expect(tuple('x = 1,')).not.toHaveProperty('$flags');
		expect(((firstOf('a, b, = c') as Read).content as Read).name).toMatchObject({ $path: 'pattern.tuple.bare', $flags: ['trailingComma'] });
		for (const source of ['x = 1, 2,\n', 'x = 1, 2\n', 'x = 1,\n', 'a, b, = c\n', 'for a, b, in c: pass\n', 'match x:\n    case a, b,:\n        pass\n']) expect(roundTrip(source)).toBe(source);
		const built = (flags: readonly string[]) =>
			String(
				runtime.engine.render(
					runtime.build({
						$path: 'statement.expression',
						content: { $path: 'declaration.variable', name: 'x', value: { $path: 'expression.collection.tuple.bare', $flags: flags, elements: ['a', 'b'] } }
					} as never) as never
				)
			);
		expect(built(['trailingComma'])).toBe('x = a, b,');
		expect(built([])).toBe('x = a, b');
	});

	it.each(['x = a,\n', 'c[1,]\n', 'c[1]\n', 'c[1, 2,]\n', 'match x:\n    case a,:\n        pass\n', 'match a,:\n    case b:\n        pass\n', 'match a:\n    case b:\n        pass\n'])(
		'reads a one-item tuple back from its build without rendering, and a subscript or subject without its comma as its one value: %j',
		(source) => {
			const parsed = read(source);
			const built = runtime.build(parsed);
			expect(runtime.read(built as never)).toEqual(parsed);
			expect(String(runtime.engine.render(built as never))).toBe(source);
		}
	);

	it('reads a subscript or match subject list as the bare tuple by its comma, and builds its one item with the comma', () => {
		const content = (source: string) => (firstOf(source) as Read).content as Read;
		const one = { $path: 'literal.number.integer', $value: 1 };
		expect(content('c[1]\n')).toMatchObject({ $path: 'expression.subscript', index: one });
		expect(content('c[1,]\n').index).toEqual({ $path: 'expression.collection.tuple.bare', elements: [one] });
		expect(content('c[1, 2,]\n').index).toMatchObject({ $flags: ['trailingComma'] });
		expect((firstOf('match a:\n    case b:\n        pass\n') as Read).subject).toBe('a');
		expect((firstOf('match a,:\n    case b:\n        pass\n') as Read).subject).toEqual({ $path: 'expression.collection.tuple.bare', elements: ['a'] });
		const subscript = { $path: 'expression.subscript', object: 'c', index: { $path: 'expression.collection.tuple.bare', elements: ['b'] } };
		expect(String(runtime.engine.render(runtime.build(subscript as never) as never))).toBe('c[b,]');
		expect(runtime.read(runtime.build(subscript as never) as never)).toEqual(subscript);
	});

	it('builds a single statement as the one item of an inline suite', () => {
		for (const source of ['def f(): return 1\n', 'def f(): pass\n', 'class A: x = 1\n']) expect(roundTrip(source)).toBe(source);
	});

	it('reads a slice step whose group holds no expression as absent', () => {
		expect(roundTrip('c[::]')).toBe('c[:]\n');
	});

	it('reads the decorators of a decorated definition onto the definition, and builds them back around it', () => {
		const decorators = [{ $path: 'attribute.decorator', content: 'd' }];
		expect(firstOf('@d\ndef f():\n    pass\n')).toMatchObject({ $path: 'declaration.function', name: 'f', decorators });
		expect(firstOf('@d\nclass C:\n    pass\n')).toMatchObject({ $path: 'declaration.class', name: 'C', decorators });
		for (const source of ['@d\ndef f():\n    pass\n', '@d\nclass C:\n    pass\n', 'class C:\n    @staticmethod\n    def m():\n        pass\n']) expect(roundTrip(source)).toBe(source);
	});

	it.each(['except* A:', 'except* A as e:', 'except* (A, B):'])('builds an exception group handler %j back in its spelling', (handler) => {
		const source = `try:\n    pass\n${handler}\n    pass\n`;
		expect(roundTrip(source)).toBe(source);
	});
});
