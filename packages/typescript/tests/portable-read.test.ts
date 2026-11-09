import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import typescript from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await createEngine(typescript, { api: 'strict', verifyStructure: 'runtime' }));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(read(source)) as never));
const firstOf = (source: string): unknown => (read(source).statements as readonly Read[])[0];

describe('the portable read', () => {
	it.each(['function* f() {\n  yield* x;\n}\n', 'type T = -1;\n'])('reads a kind its holder mounts as its own path, carrying nothing, and builds it back through the mount: %j', (source) => {
		const parsed = read(source);
		expect(JSON.stringify(parsed)).not.toContain('"$type"');
		const built = runtime.build(parsed);
		expect(runtime.read(built as never)).toEqual(parsed);
		expect(String(runtime.engine.render(built as never))).toBe(source);
	});

	it('reads a delegating yield at its holder and a negative literal type in its seat, and builds the delegate only with its operand', () => {
		expect(firstOf('function* f() {\n  yield* x;\n}\n')).toMatchObject({ body: { statements: [{ expression: { $path: 'expression.yield.delegate', expression: 'x' } }] } });
		expect(firstOf('type T = -1;\n')).toMatchObject({ value: { $path: 'type.literal', content: { $path: 'literal.number.negative', value: { $path: 'literal.number.integer', $value: 1 } } } });
		expect(() => runtime.build({ $path: 'expression.yield.delegate' } as never)).toThrow('it needs expression');
	});

	it('reads the members a binding captures from its slot, and builds an import back', () => {
		const clause = { $path: 'clause.import.names', content: [{ $path: 'clause.import.specifier', name: 'a' }, { $path: 'clause.import.specifier', name: 'b', alias: 'c' }] };
		expect(firstOf('import {a, b as c} from "x";')).toMatchObject({ importClause: clause });
		expect(roundTrip('import {a, b as c} from "x";')).toBe('import { a, b as c } from "x";\n');
	});

	it('builds text through the seat whose leaf builds it back: a parameter name in its pattern, an object key as itself', () => {
		expect(roundTrip('function f(a: number) {}')).toBe('function f(a: number) {}\n');
		expect(roundTrip('const o = {a: 1};')).toBe('const o = { a: 1 };\n');
	});

	it('builds an exported declaration, and a catch clause whose parameter the clause takes flattened', () => {
		expect(roundTrip('export function g() {}')).toBe('export function g() {}\n');
		expect(roundTrip('try {} catch (e: unknown) {}')).toBe('try {} catch (e: unknown) {}\n');
	});

	it('reads a static readonly field as a value with both flags, each set through the slot that holds its token, and builds it back', () => {
		const field = (firstOf('class C { static readonly x = 1; }') as { readonly body: readonly unknown[] }).body[0];
		expect(field).toEqual({ $path: 'declaration.field', $flags: ['static', 'readonly'], decorators: [], name: 'x', value: { $path: 'literal.number.integer', $value: 1 } });
		expect(roundTrip('class C { static readonly x = 1; }')).toBe('class C {\n  static readonly x = 1;\n}\n');
	});

	it('reads a construct call without parentheses as the bare refinement with no arguments, and one with empty parentheses as the call with none, and builds each back', () => {
		expect(firstOf('new X;')).toEqual({ $path: 'statement.expression', expression: { $path: 'expression.call.construct.bare', function: 'X', typeArguments: [] } });
		expect(firstOf('new X();')).toEqual({ $path: 'statement.expression', expression: { $path: 'expression.call.construct', function: 'X', arguments: [], typeArguments: [] } });
		for (const source of ['new X;', 'new X();', 'new X(a);', 'new X<T>;', 'new X<T>();', 'new new X()();']) expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('builds a string in the quote form whose spelling admits its text, and in the default form when both do', () => {
		expect(roundTrip(`let s = 'say "hi"';`)).toBe(`let s = 'say "hi"';\n`);
		expect(roundTrip("let s = 'a';")).toBe('let s = "a";\n');
	});

	it('builds a class method signature with the terminator its grammar declares by default', () => {
		expect(roundTrip('declare class C { foo(): void; }')).toBe('declare class C {\n  foo(): void\n}\n');
	});

	it('builds a debugger statement, whose only slot is a token choice its grammar defaults', () => {
		expect(roundTrip('debugger;')).toBe('debugger;\n');
		expect(String(runtime.engine.render(runtime.engine.build.debuggerStatement()))).toBe('debugger;');
	});

	it('builds a type parameter constraint through its grammar default keyword, `extends`', () => {
		for (const source of ['function f<T extends U>() {}', 'type A<T extends string> = T;']) expect(roundTrip(source)).toBe(`${source}\n`);
		const bound = typescript.kinds.StringKeyword;
		expect(String(runtime.engine.render(runtime.engine.build.constraint(bound)))).toBe('extends string');
		expect(String(runtime.engine.render(runtime.engine.build.constraint(bound, { operator: typescript.kinds.Colon })))).toBe(': string');
	});

	it('leaves out a member whose route needs a member the node does not have', () => {
		expect(firstOf('import x = require("y");')).not.toHaveProperty('source');
		expect(roundTrip('import x = require("y");')).toBe('import x = require("y");\n');
	});

	it('reads a method decorator onto the method, and builds it back', () => {
		const source = 'class C {\n  @d\n  m() {}\n}\n';
		expect(firstOf(source)).toMatchObject({ body: [{ $path: 'declaration.method', name: 'm', decorators: [{ $path: 'attribute.decorator', content: 'd' }] }] });
		expect(roundTrip(source)).toBe(source);
	});

	it('reads the implemented interfaces beside the extended class, and without one', () => {
		expect(firstOf('class C extends B implements I {}')).toMatchObject({ extends: { $path: 'clause.extends' }, implements: ['I'] });
		expect(firstOf('class C implements I, J {}')).toMatchObject({ implements: ['I', 'J'] });
		for (const source of ['class C extends B implements I {}', 'class C implements I, J {}']) expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it("reads an interface body as its members, empty or not, and builds the braces back", () => {
		expect(firstOf('interface I {\n  a: string;\n  m(): void;\n}')).toMatchObject({
			$path: 'declaration.interface',
			body: [
				{ $path: 'declaration.field.signature', name: 'a', type: 'string' },
				{ $path: 'declaration.method.signature', name: 'm' }
			]
		});
		expect(firstOf('interface I {}')).toMatchObject({ $path: 'declaration.interface', body: [] });
		for (const source of ['interface I {\n  a: string;\n  m(): void;\n}', 'interface I {}', 'interface J extends I {\n  b: number;\n}']) {
			expect(roundTrip(source)).toBe(`${source}\n`);
		}
	});

	it("keeps an interface with a Flow exact body whole: its claim tests the opening brace", () => {
		const source = 'interface I {| a: string |}';
		const carried: unknown[] = [];
		runtime.read(runtime.engine.parse(source), (_, carry) => carried.push(carry));
		expect(carried).toEqual([{ reason: 'unclaimed' }]);
		expect(roundTrip(source)).toBe(source);
	});

	it('reads a list member no route finds as an empty list, parsed and built alike', () => {
		expect(firstOf('function f() {}')).toMatchObject({ $path: 'declaration.function', parameters: [] });
		expect(firstOf('class C { m() {} }')).toMatchObject({ body: [{ $path: 'declaration.method', name: 'm', parameters: [] }] });
		const built = runtime.build(firstOf('function f() {}') as Read) as { readonly $type: number };
		expect((runtime.read(built) as Read).parameters).toEqual([]);
		for (const source of ['function f() {}', 'class C {\n  m() {}\n}']) expect(roundTrip(source)).toBe(`${source}\n`);
		expect(firstOf('function f(a) {}')).toMatchObject({ parameters: [{ $path: 'declaration.parameter', name: 'a' }] });
	});

	it('reads a word token as its text and a value token as its path and value, and builds both back', () => {
		const declarators = (source: string) => ((firstOf(source) as Read).declarators as readonly Read[])[0];
		expect(declarators('let a: any = null;')).toMatchObject({ type: 'any', value: { $path: 'literal.null' } });
		expect(declarators('let b = undefined;')).toMatchObject({ value: { $path: 'literal.null.undefined' } });
		expect(declarators('let c = true;')).toMatchObject({ value: { $path: 'literal.boolean.true', $value: true } });
		for (const source of ['let a: any = null;', 'let b = undefined;', 'let c = true;']) expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('tests a token by its text, and refuses the text of a value token', () => {
		const is = typescript.is.portable;
		expect(is.type.primitive.unchecked('any')).toBe(true);
		expect(is.type.primitive('number')).toBe(true);
		expect(is.type.primitive('u8')).toBe(false);
		// @ts-expect-error a value token reads as its path and value, so its guard takes no text
		expect(is.literal.null('null')).toBe(false);
	});

	it('reads a `this` parameter as the receiver with no name, and builds the `this` back', () => {
		const source = 'function f(this: T, x: number) {}\n';
		const receiver = (firstOf(source) as Read).receiver;
		expect(receiver).toMatchObject({ $path: 'declaration.parameter.receiver', type: 'T' });
		expect(receiver).not.toHaveProperty('name');
		expect(roundTrip(source)).toBe(source);
	});

	it('reads the `this` type as the receiver type, by its text', () => {
		const source = 'class C {\n  m(): this {\n    return this;\n  }\n}\n';
		expect(firstOf(source)).toMatchObject({ body: [{ $path: 'declaration.method', returnType: 'this' }] });
		expect(roundTrip(source)).toBe(source);
		expect(typescript.is.portable.type.receiver('this')).toBe(true);
	});

	it('reads the `default` keyword as an identifier where a specifier names it, and builds it back as the keyword', () => {
		const exported = (source: string) => ((firstOf(source) as Read).exportClause as Read).exportSpecifiers;
		expect(exported('export { x as default };')).toEqual([{ $path: 'clause.export.specifier', name: 'x', alias: 'default' }]);
		expect(exported('export { default } from "y";')).toEqual([{ $path: 'clause.export.specifier', name: 'default' }]);
		expect(((firstOf('import { default as z } from "y";') as Read).importClause as Read).content).toEqual([{ $path: 'clause.import.specifier', name: 'default', alias: 'z' }]);
		for (const source of ['export { x as default };', 'export { default } from "y";', 'import { default as z } from "y";']) expect(roundTrip(source)).toBe(`${source}\n`);
		expect(typescript.is.portable.identifier('default')).toBe(true);
	});

	it('reads an import type as its one source string, a member of it as a qualified name, and builds each back', () => {
		const typeOf = (source: string) => ((firstOf(source) as Read).declarators as readonly Read[])[0]!.type;
		const imported = { $path: 'type.import', source: { $path: 'literal.string', elements: ['./m'] } };
		expect(typeOf('let a: import("./m");')).toEqual(imported);
		expect(typeOf('let b: import("./m").T;')).toEqual({ $path: 'identifier.qualified', qualifier: imported, name: 'T' });
		expect(typeOf('let c: import("./m").A.B;')).toEqual({ $path: 'identifier.qualified', qualifier: { $path: 'identifier.qualified', qualifier: imported, name: 'A' }, name: 'B' });
		expect(typeOf('let d: typeof import("./m");')).toEqual({ $path: 'type.query', expression: imported });
		for (const source of ['let a: import("./m");', 'let b: import("./m").T;', 'let c: import("./m").A.B;', 'let d: typeof import("./m");']) expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('carries an import type whose argument is not one string', () => {
		for (const source of ['let f: import(x);', 'let g: typeof import("./m", { with: {} });']) {
			const carried: unknown[] = [];
			runtime.read(runtime.engine.parse(source), (_, carry) => carried.push(carry));
			expect(carried).toEqual([{ reason: 'unclaimed' }]);
		}
	});

	it('reads a typeof operand as the entity name it is, a qualified name over an identifier, this or an import type, and builds each back', () => {
		const queried = (source: string) => (((firstOf(source) as Read).declarators as readonly Read[])[0]!.type as Read).expression;
		expect(queried('let a: typeof Person.P;')).toEqual({ $path: 'identifier.qualified', qualifier: 'Person', name: 'P' });
		expect(queried('let b: typeof this.colors;')).toEqual({ $path: 'identifier.qualified', qualifier: 'this', name: 'colors' });
		expect(queried('let c: typeof f<T>;')).toEqual({ $path: 'expression.instantiation', function: 'f', typeArguments: ['T'] });
		expect(queried('let d: typeof import("./m").T;')).toEqual({
			$path: 'identifier.qualified',
			qualifier: { $path: 'type.import', source: { $path: 'literal.string', elements: ['./m'] } },
			name: 'T'
		});
		for (const source of ['let a: typeof Person.P;', 'let b: typeof this.colors;', 'let c: typeof f<T>;', 'let d: typeof import("./m").T;', 'let e: A.B;', 'let f: import("./m").T;'])
			expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('carries a node a parse error sits beside, or a node whose read passes through one, so the error text survives the round trip', () => {
		for (const [source, rendered] of [
			['let x: 2 | +4;', 'let x: 2 | +4;\n'],
			['export class A { set y(a: number, b: number) {} }', 'export class A {\n  set y(a: number, b: number) {}\n}\n']
		] as const) {
			const carried: unknown[] = [];
			runtime.read(runtime.engine.parse(source), (_, carry) => carried.push(carry));
			expect(carried, source).toEqual([{ reason: 'error' }]);
			expect(roundTrip(source)).toBe(rendered);
		}
	});

	it('carries the node a parser-inserted token sits in, so its rebuild writes no token the source lacks', () => {
		for (const [source, rendered] of [
			["let x: import('a')();", "let x: import('a')();\n"],
			['export class A { set y() {} }\n', 'export class A {\n  set y() {}\n}\n'],
			['export class A { set y(a = 1) {} }\n', 'export class A {\n  set y(a = 1) {}\n}\n']
		] as const) {
			const carried: unknown[] = [];
			runtime.read(runtime.engine.parse(source), (_, carry) => carried.push(carry));
			expect(carried, source).toEqual([{ reason: 'error' }]);
			expect(roundTrip(source)).toBe(rendered);
		}
	});

	it('carries a typeof operand typescript does not accept: a call, an optional chain', () => {
		for (const source of ['let g: typeof a.b();', 'let h: typeof a?.b;']) {
			const carried: unknown[] = [];
			runtime.read(runtime.engine.parse(source), (_, carry) => carried.push(carry));
			expect(carried, source).toEqual([{ reason: 'unclaimed' }]);
			expect(roundTrip(source)).toBe(`${source}\n`);
		}
	});

	it('reads the return type of an arrow function, and builds it back', () => {
		const source = 'const f = (x): number => x;';
		expect(firstOf(source)).toMatchObject({ declarators: [{ value: { $path: 'expression.lambda', returnType: 'number' } }] });
		expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('reads the type parameters of an arrow function', () => {
		const source = 'const f = <T>(x: T) => x;';
		expect(firstOf(source)).toMatchObject({ declarators: [{ value: { $path: 'expression.lambda', typeParameters: [{ $path: 'declaration.type_parameter', name: 'T' }] } }] });
		expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it("reads a hash-bang line as the file's shebang text, and builds it back", () => {
		const source = '#!/usr/bin/env node\nlet x = 1;\n';
		expect(read(source)).toMatchObject({ $path: 'file', shebang: '/usr/bin/env node' });
		expect(roundTrip(source)).toBe(source);
	});

	it('reads an instantiation by its function, as rust does, in an expression and in a type query, and builds each back', () => {
		const instantiation = { $path: 'expression.instantiation', function: 'f', typeArguments: ['T'] };
		expect(firstOf('f<T>;')).toMatchObject({ expression: instantiation });
		expect(firstOf('type X = typeof f<T>;')).toMatchObject({ value: { $path: 'type.query', expression: instantiation } });
		expect(roundTrip('f<T>;')).toBe('f<T>;\n');
		expect(roundTrip('type X = typeof f<T>;')).toBe('type X = typeof f<T>;\n');
	});

	it.each(['private', 'protected', 'public'])('keeps a receiver whole that states %s, which no receiver member holds, and builds it back as written', (modifier) => {
		const source = `class K { m(${modifier} this: K) {} }`;
		const carries: unknown[] = [];
		runtime.read(runtime.engine.parse(source), (_, carry) => carries.push(carry));
		expect(carries).toEqual([{ reason: 'unread', slot: 'accessibilityModifier' }]);
		expect(roundTrip(source)).toBe(`class K {\n  m(${modifier} this: K) {}\n}\n`);
	});

	it.each(['a + b;', '-a;', 'a.f(x);', 'a in b;', 'import type X from "m";', 'class K { m(this: K) {} }'])('carries nothing for %j, whose tokens its own entry reads or tests', (source) => {
		const carries: unknown[] = [];
		runtime.read(runtime.engine.parse(source), (_, carry) => carries.push(carry));
		expect(carries).toEqual([]);
	});

	it.each([
		['class C implements A, B {}', 'implements', ['A', 'B']],
		['class C implements A {}', 'implements', ['A']],
		['interface I extends A, B {}', 'extends', ['A', 'B']],
		['interface I extends A {}', 'extends', ['A']]
	])('reads the heritage of %j as a list, one type or many, and builds it back', (source, member, types) => {
		expect((firstOf(source) as Read)[member]).toEqual(types);
		expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('reads the implements of a class expression as a list', () => {
		expect(((firstOf('const c = class implements A, B {};') as Read).declarators as readonly Read[])[0]!.value).toMatchObject({ $path: 'expression.class', implements: ['A', 'B'] });
		expect(roundTrip('const c = class implements A, B {};')).toBe('const c = class implements A, B {};\n');
	});

	it('refuses a destructuring declarator given no pattern', () => {
		const declarator = ((firstOf('let { a } = b;') as Read).declarators as readonly Read[])[0]!;
		expect(declarator.$path).toBe('declaration.variable.pattern');
		const { name: _name, ...rest } = declarator;
		expect(() => runtime.build(rest as Read)).toThrow('no typescript form of declaration.variable.pattern builds this structure');
	});
});
