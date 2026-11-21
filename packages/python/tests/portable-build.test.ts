import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const render = (node: unknown): string => String(runtime.engine.render(node as never));

describe('the portable build through the strict table', () => {
	it("reads a function's, a method's, a constructor's and an accessor's indented and inline suites alike as their statements, and builds each indented", () => {
		const firstOf = (source: string): Readonly<Record<string, unknown>> => (runtime.read(runtime.engine.parse(source)) as { readonly statements: readonly Readonly<Record<string, unknown>>[] }).statements[0]!;
		const inline = firstOf('def f(): x\n');
		expect(inline).toEqual(firstOf('def f():\n    x\n'));
		expect(inline).toEqual({ $path: 'declaration.function', name: 'f', parameters: [], statements: ['x'] });
		expect(render(runtime.build(inline as never))).toBe('def f():\n    x\n');
		const source = ['class C:', '    def __init__(self):', '        a', '    def m(self):', '        b', '    @property', '    def p(self):', '        c', '    @p.setter', '    def p(self, v):', '        d', ''].join('\n');
		const members = firstOf(source).members as readonly Readonly<Record<string, unknown>>[];
		expect(members.map((member) => [member.$path, member.statements, 'body' in member])).toEqual([
			['declaration.constructor', ['a'], false],
			['declaration.method', ['b'], false],
			['declaration.property.getter', ['c'], false],
			['declaration.property.setter', ['d'], false]
		]);
	});
	it("reads an if's, an elif's and an else's indented and inline suites alike as their statements, and builds each as the indented block", () => {
		const ifOf = (source: string): unknown => (runtime.read(runtime.engine.parse(source)) as { readonly statements: readonly unknown[] }).statements[0];
		const inline = ifOf('if a: x()\nelif b: y()\nelse: z()\n');
		expect(inline).toEqual(ifOf('if a:\n    x()\nelif b:\n    y()\nelse:\n    z()\n'));
		expect(inline).toMatchObject({
			$path: 'statement.if',
			statements: [{ function: 'x' }],
			alternatives: [{ $path: 'clause.else_if', statements: [{ function: 'y' }] }, { $path: 'clause.else', statements: [{ function: 'z' }] }]
		});
		expect(render(runtime.build(inline as never))).toBe('if a:\n    x()\nelif b:\n    y()\nelse:\n    z()\n');
	});

	it("reads a loop's indented and inline suites alike as its statements, and builds both as the indented block, the suite's default form", () => {
		const loopOf = (source: string): unknown => (runtime.read(runtime.engine.parse(source)) as { readonly statements: readonly unknown[] }).statements[0];
		const inline = loopOf('for i in a: x(); y()\n');
		expect(inline).toEqual(loopOf('for i in a:\n    x()\n    y()\n'));
		expect(render(runtime.build(inline as never))).toBe('for i in a:\n    x()\n    y()\n');
		expect(render(runtime.build({ $path: 'statement.loop.while', condition: 'a', statements: [{ $path: 'statement.empty' }] }))).toBe('while a:\n    pass\n');
	});

	it("builds a function's statements in the block its suite holds, and a simple statement in the list that holds it", () => {
		expect(render(runtime.build({ $path: 'declaration.function', name: 'f', parameters: [], statements: [{ $path: 'statement.empty' }] }))).toBe('def f():\n    pass\n');
	});

	it("builds an except clause's exception through the mount that seats it at the clause's key, and a list of exceptions through the nested mount", () => {
		const body = { $path: 'statement.block', statements: [{ $path: 'statement.empty' }] };
		expect(render(runtime.build({ $path: 'clause.catch', type: 'E', body }))).toBe('except E:\n    pass\n');
		expect(render(runtime.build({ $path: 'clause.catch', type: 'E', name: 'e', body }))).toBe('except E as e:\n    pass\n');
		expect(render(runtime.build({ $path: 'clause.catch', type: ['E', 'F'], body }))).toBe('except E, F:\n    pass\n');
	});

	it('builds an except clause with and without a name through the form that takes its slots, in any order, and refuses a name beside a list of exceptions', () => {
		const body = { $path: 'statement.block', statements: [{ $path: 'statement.empty' }] };
		expect(render(runtime.build({ $path: 'clause.catch', body, type: 'E' }))).toBe('except E:\n    pass\n');
		for (const structure of [{ type: 'E', body, name: 'e' }, { name: 'e', body, type: 'E' }, { body, name: 'e', type: 'E' }])
			expect(render(runtime.build({ $path: 'clause.catch', ...structure }))).toBe('except E as e:\n    pass\n');
		expect(() => runtime.build({ $path: 'clause.catch', type: ['E', 'F'], name: 'e', body })).toThrow(/no python form of except_clause takes .* together/);
	});

	it('builds a float $value split into its form\'s parts, and a boolean by its declared value', () => {
		expect(render(runtime.build({ $path: 'literal.number.float', $value: 2 }))).toBe('2.0');
		expect(render(runtime.build({ $path: 'literal.number.float', $value: 1.5 }))).toBe('1.5');
		expect(render(runtime.build({ $path: 'literal.number.float.scientific', $value: 1e21 }))).toBe('1e21');
		expect(render(runtime.build({ $path: 'literal.number.integer.hex', $value: 255 }))).toBe('0xff');
		expect(runtime.build({ $path: 'literal.boolean', $value: false })).toBe(python.kinds.False);
		expect(() => runtime.build({ $path: 'literal.number.float', $value: Number.NaN })).toThrow(/literal\.number\.float: no python literal spells NaN/);
	});

	it('builds a scientific $value with an integer mantissa, its trailing zeros moved into the exponent, and rebuilds a read the same way', () => {
		for (const [value, text] of [[1000, '1e3'], [1500, '15e2'], [0.5, '5e-1'], [1, '1e0'], [1.5e-7, '15e-8'], [0, '0e0']] as const)
			expect(render(runtime.build({ $path: 'literal.number.float.scientific', $value: value }))).toBe(text);
		for (const [source, text] of [['1E3', '1e3'], ['1e+3', '1e3'], ['15e2', '15e2']])
			expect(render(runtime.build(runtime.read(runtime.engine.parse(`x = ${source}\n`)) as never))).toBe(`x = ${text}\n`);
		expect(render(runtime.build({ $path: 'literal.number.float', $value: 1500 }))).toBe('1500.0');
	});

	it('refuses a bigint at a float form that takes its parts, keeping every digit in the refusal', () => {
		expect(() => runtime.build({ $path: 'literal.number.float', $value: 2n ** 60n + 1n })).toThrow(/literal\.number\.float takes a float \(a number\) in python, not 1152921504606846977n/);
	});

	it('refuses an option or a slot its value is written from, stated beside its $value or without it', () => {
		expect(() => runtime.build({ $path: 'literal.number.float', $value: 1.5, marker: 'e', exponent: '8' })).toThrow(/literal\.number\.float: marker is an option of float_point; the build writes it from its preference default/);
		expect(() => runtime.build({ $path: 'literal.number.float', integer: '1', fraction: '5' })).toThrow(/it needs \$value$/);
	});

	it('takes text as given at a slot that holds text', () => {
		expect(render(runtime.build({ $path: 'literal.number.float', $value: 1.5, imaginary: 'j' }))).toBe('1.5j');
	});

	it('takes a route only beside the slots that complete the kind it enters', () => {
		expect(() => runtime.build({ $path: 'clause.catch', name: 'e', body: [{ $path: 'statement.empty' }] })).toThrow(/clause\.catch: name builds only beside type/);
		expect(render(runtime.build({ $path: 'clause.resource.item', value: 'a', name: 'b' }))).toBe('a as b');
		expect(render(runtime.build({ $path: 'clause.resource.item', value: 'a' }))).toBe('a');
		expect(() => runtime.build({ $path: 'clause.resource.item', name: 'b' })).toThrow(/clause\.resource\.item builds this structure \(slots name\); it needs value/);
	});

	it('builds a body from its block of statements, indented by the default form, and refuses a bare statement or a list for it', () => {
		expect(render(runtime.build({ $path: 'clause.catch', type: 'E', body: { $path: 'statement.block', statements: [{ $path: 'statement.empty' }] } }))).toBe('except E:\n    pass\n');
		expect(() => runtime.build({ $path: 'clause.catch', type: 'E', body: [{ $path: 'statement.empty' }] })).toThrow(/clause\.catch's body holds one value, not a list/);
		expect(() => runtime.build({ $path: 'clause.catch', type: 'E', body: 'pass' })).toThrow(/clause\.catch's body has no route that seats the text "pass"/);
	});

	it("builds one comparison operand through the comparator list its route walks, and a float through the exponent spelling its form takes", () => {
		expect(render(runtime.build({ $path: 'expression.binary.membership.in', left: 'a', right: 'b' }))).toBe('a in b');
		expect(render(runtime.build({ $path: 'literal.number.float.scientific', $value: 0.001 }))).toBe('1e-3');
	});

	it('refuses a path from a feature the grammar does not compose, naming the feature', () => {
		expect(() => runtime.build({ $path: 'declaration.struct', name: 'S' })).toThrow(/declaration\.struct is a path of Structs, which python lacks/);
	});
});
