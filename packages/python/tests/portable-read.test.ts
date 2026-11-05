import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { Delimiter } from '@sittir/common/utils';
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

	it('reads a string\'s text and escapes by their paths, a format spec by its text, and builds them back', () => {
		const source = 'x = f"a{{b\\n{c:>3}"';
		expect(((firstOf(source) as Read).content as Read).value).toEqual({
			$path: 'literal.string.interpolated',
			elements: [
				{ $path: 'literal.string.text', $value: 'a' },
				{ $path: 'literal.string.escape', $value: '{{' },
				{ $path: 'literal.string.text', $value: 'b' },
				{ $path: 'literal.string.escape', content: 'n' },
				{ $path: 'expression.interpolation', expression: 'c', formatSpecifier: { $path: 'expression.interpolation.format', elements: ['>3'] } }
			]
		});
		expect(roundTrip(source)).toBe(`${source}\n`);
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

	it('reads a literal its seat would not build back from bare text as its path and text, and reads digit separators and exponent spellings by value', () => {
		expect(firstOf('x = 1j')).toMatchObject({ content: { value: { $path: 'literal.number.integer.imaginary', $value: '1j' } } });
		expect(roundTrip('x = 1j')).toBe('x = 1j\n');
		expect(roundTrip('x = 0B1_1')).toBe('x = 0b11\n');
		expect(roundTrip('x = 1e-3')).toBe('x = 1e-3\n');
	});

	it('reads a literal inside a pattern whose slot holds only containers as its path and text, and builds it back', () => {
		const source = 'match x:\n    case 3j as b1:\n        pass\n';
		expect(firstOf(source)).toMatchObject({ body: [{ pattern: { $path: 'pattern.as', pattern: { $path: 'literal.number.integer.imaginary', $value: '3j' }, name: 'b1' } }] });
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

	it.each(['def f():\n    yield from x\n', 'match x:\n    case -1:\n        pass\n', 'match x:\n    case C(x=-1):\n        pass\n', 'a,\n', 'a, b\n', '1, 2, 3,\n', 'a, b,\n'])(
		'reads a kind its holder mounts as its own path, carrying nothing, and builds it back through the mount: %j',
		(source) => {
			const parsed = read(source);
			expect(JSON.stringify(parsed, (_key, value: unknown) => (typeof value === 'bigint' ? String(value) : value))).not.toContain('"$type"');
			const built = runtime.build(parsed);
			expect(runtime.read(built as never)).toEqual(parsed);
			expect(String(runtime.engine.render(built as never))).toBe(source);
		}
	);

	it('reads a delegating yield at its holder, a negative pattern number in its seat and a statement tuple as their paths', () => {
		const negative = { $path: 'literal.number.negative', value: { $path: 'literal.number.integer', $value: 1 } };
		expect(firstOf('def f():\n    yield from x\n')).toMatchObject({ body: { statements: [{ content: { $path: 'expression.yield.delegate', expression: 'x' } }] } });
		expect(firstOf('match x:\n    case -1:\n        pass\n')).toMatchObject({ body: [{ pattern: negative }] });
		expect(firstOf('match x:\n    case C(x=-1):\n        pass\n')).toMatchObject({ body: [{ pattern: { fields: [{ $path: 'pattern.struct.field', pattern: negative }] } }] });
		expect(firstOf('a, b,\n')).toEqual({ $path: 'statement.expression', content: { $path: 'expression.collection.tuple.bare', $flags: ['trailingComma'], elements: ['a', 'b'] } });
		expect(() => runtime.build(negative as never)).toThrow('portable build: literal.number.negative has no root build in python; it builds in a holder slot of _simple_pattern, keyword_pattern');
	});

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

	it.each(['print a', 'print a,', 'print a, b,', 'print >> f', 'print >> f, a,'])('reads %j as one print statement and builds it back', (source) => {
		const statement = firstOf(source) as Read;
		expect(statement.$path).toBe('statement.print');
		expect(roundTrip(source)).toBe(`${source}\n`);
		expect(read(`${source}\n`).statements).toEqual([statement]);
	});

	it('reads a print statement\'s destination and arguments, and its trailing comma as a flag', () => {
		expect(firstOf('print a, b,')).toEqual({ $path: 'statement.print', arguments: ['a', 'b'], $flags: ['trailingComma'] });
		expect(firstOf('print >> f')).toEqual({ $path: 'statement.print', destination: 'f', arguments: [] });
		expect(firstOf('print >> f, a,')).toEqual({ $path: 'statement.print', destination: 'f', arguments: ['a'], $flags: ['trailingComma'] });
	});

	it('refuses a print statement\'s trailing comma after no arguments', () => {
		expect(() => runtime.build({ $path: 'statement.print', arguments: [], $flags: ['trailingComma'] } as never)).toThrow(/trailingComma is the trailing separator of the list at arguments, which holds nothing/);
	});

	it('renders a print statement\'s trailing comma by its flag, whatever the render options say', () => {
		const render = (flags: readonly string[], options?: object): string =>
			String(runtime.engine.render(runtime.build({ $path: 'statement.print', arguments: ['a'], $flags: flags } as never) as never, options as never));
		expect(render([])).toBe('print a');
		expect(render(['trailingComma'])).toBe('print a,');
		expect(render(['trailingComma'], { printArguments: { item: { delimiter: Delimiter.None } } })).toBe('print a,');
	});
});
