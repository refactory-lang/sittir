import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const readOf = (source: string): string => JSON.stringify(runtime.read(runtime.engine.parse(source, { errors: 'throw' })));

describe('a python type parameter is a name with an optional bound, as CPython requires', () => {
	it.each(['def f[1](): pass\n', 'def f[int[str]](): pass\n', 'class C[a.b]: pass\n', 'type a.b = int\n'])('refuses %j', (source) => {
		expect(() => runtime.engine.parse(source, { errors: 'throw' })).toThrow();
	});

	it.each([
		['type = 1\n', '{"$path":"file","statements":[{"$path":"statement.expression","content":{"$path":"declaration.variable","name":"type","value":{"$path":"literal.number.integer","$value":1}}}]}'],
		['type(x)\n', '{"$path":"file","statements":[{"$path":"statement.expression","content":{"$path":"expression.call","function":"type","arguments":["x"]}}]}'],
		['print(type)\n', '{"$path":"file","statements":[{"$path":"statement.print","arguments":[{"$path":"expression.parenthesized","expression":"type"}]}]}'],
		[
			'x: type[int]\n',
			'{"$path":"file","statements":[{"$path":"statement.expression","content":{"$path":"declaration.variable","name":"x","type":{"$path":"type","content":{"$path":"type.generic","name":"type","typeArguments":[{"$path":"type","content":"int"}]}}}}]}'
		]
	])('keeps the soft keyword in %j', (source, read) => {
		expect(readOf(source)).toBe(read);
	});

	it('reads a generic type\'s arguments as typeArguments', () => {
		expect(readOf('x: dict[str, int] = {}\n')).toBe(
			'{"$path":"file","statements":[{"$path":"statement.expression","content":{"$path":"declaration.variable","name":"x","type":{"$path":"type","content":{"$path":"type.generic","name":"dict","typeArguments":[{"$path":"type","content":"str"},{"$path":"type","content":"int"}]}},"value":{"$path":"expression.collection.map","elements":[]}}}]}'
		);
	});

	it('reads each declared parameter with its name and bound, and a starred one as variadic or parameters', () => {
		expect(readOf('def f[T, U: int, V: (str, bytes), *Ts, **P](): pass\n')).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.function","name":"f","parameters":[],"body":"pass","typeParameters":[{"$path":"declaration.type_parameter","name":"T","bounds":[]},{"$path":"declaration.type_parameter","name":"U","bounds":[{"$path":"type","content":"int"}]},{"$path":"declaration.type_parameter","name":"V","bounds":[{"$path":"type","content":{"$path":"expression.collection.tuple","elements":["str","bytes"]}}]},{"$path":"declaration.type_parameter.variadic","name":"Ts"},{"$path":"declaration.type_parameter.parameters","name":"P"}]}]}'
		);
	});

	it('reads a plain, a variadic and a parameters parameter in order', () => {
		expect(readOf('def f[T, *Ts, **P](): pass\n')).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.function","name":"f","parameters":[],"body":"pass","typeParameters":[{"$path":"declaration.type_parameter","name":"T","bounds":[]},{"$path":"declaration.type_parameter.variadic","name":"Ts"},{"$path":"declaration.type_parameter.parameters","name":"P"}]}]}'
		);
	});

	it('builds the variadic and parameters refinements through the portable surface', () => {
		const built = runtime.build({
			$path: 'declaration.function',
			name: 'f',
			parameters: [],
			body: 'pass',
			typeParameters: [
				{ $path: 'declaration.type_parameter', name: 'T', bounds: [] },
				{ $path: 'declaration.type_parameter.variadic', name: 'Ts' },
				{ $path: 'declaration.type_parameter.parameters', name: 'P' }
			]
		} as never);
		expect(String(runtime.engine.render(built as never))).toBe('def f[T, *Ts, **P](): pass\n');
	});

	it('reads a class\'s parameters', () => {
		expect(readOf('class C[T]: pass\n')).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.class","name":"C","body":["pass"],"typeParameters":[{"$path":"declaration.type_parameter","name":"T","bounds":[]}],"bases":[]}]}'
		);
	});

	it.each([
		[
			'type X[T] = list[T]\n',
			'{"$path":"file","statements":[{"$path":"declaration.type_alias","name":"X","value":{"$path":"type","content":{"$path":"type.generic","name":"list","typeArguments":[{"$path":"type","content":"T"}]}},"typeParameters":[{"$path":"declaration.type_parameter","name":"T","bounds":[]}]}]}'
		],
		['type X = int\n', '{"$path":"file","statements":[{"$path":"declaration.type_alias","name":"X","value":{"$path":"type","content":"int"},"typeParameters":[]}]}'],
		[
			'type X[T: int] = list[T]\n',
			'{"$path":"file","statements":[{"$path":"declaration.type_alias","name":"X","value":{"$path":"type","content":{"$path":"type.generic","name":"list","typeArguments":[{"$path":"type","content":"T"}]}},"typeParameters":[{"$path":"declaration.type_parameter","name":"T","bounds":[{"$path":"type","content":"int"}]}]}]}'
		]
	])('reads the alias %j as its name, parameters and value', (source, read) => {
		expect(readOf(source)).toBe(read);
	});

	it.each([
		'def f[T, U: int, V: (str, bytes), *Ts, **P](): pass\n',
		'def f[T, *Ts, **P](): pass\n',
		'class C[T]: pass\n',
		'type X[T] = list[T]\n',
		'type X = int\n',
		'type X[T: int] = list[T]\n'
	])('round-trips %j through wrap and through the portable read', (source) => {
		const tree = runtime.engine.parse(source, { errors: 'throw' });
		expect(String(runtime.engine.render(tree as never))).toBe(source);
		const read = runtime.read(tree);
		const rendered = String(runtime.engine.render(runtime.build(read as never) as never));
		expect(rendered).toBe(source);
		expect(JSON.stringify(runtime.read(runtime.engine.parse(rendered)))).toBe(JSON.stringify(read));
	});
});
