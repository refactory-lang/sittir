import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import rust from '../src/index.ts';

type Node = { readonly $type: number };

const runtime = await portableRuntime(await createEngine(rust, { api: 'strict' }));
const render = (node: unknown): string => String(runtime.engine.render(node as never));
const fn = { $path: 'declaration.function', name: 'f', parameters: [], body: { $path: 'statement.block', statements: [] } };
const parameter = (type: unknown) => ({ $path: 'declaration.parameter', name: 'x', type });

describe('the portable build through the strict table', () => {
	it('builds a function from its members, an empty parameter list leaving out the optional list it would fill', () => {
		expect(render(runtime.build(fn))).toBe('fn f() {}');
	});

	it('sets a flag through the intermediate kind that holds its token', () => {
		expect(render(runtime.build({ ...fn, $flags: ['async'] }))).toBe('async fn f() {}');
	});

	it('writes the literals a refinement pins', () => {
		expect(render(runtime.build({ ...fn, $path: 'declaration.function.public' }))).toBe('pub fn f() {}');
	});

	it("builds a visibility refinement through its holder's mount, a scope's token or path through the scope's", () => {
		expect(render(runtime.build({ ...fn, $path: 'declaration.function.private' }))).toBe('pub(self) fn f() {}');
		expect(render(runtime.build({ ...fn, $path: 'declaration.function.public.internal' }))).toBe('pub(crate) fn f() {}');
		expect(render(runtime.build({ $path: 'declaration.struct.public.restricted', name: 'S', scope: 'a', body: [] }))).toBe('pub(in a) struct S {}');
	});

	it('builds an expression statement through the form its content takes', () => {
		expect(render(runtime.build({ $path: 'statement.expression', content: 'x' }))).toBe('x;');
	});

	it("presets an arithmetic refinement's operator, and builds text members through their slot's leaf", () => {
		expect(render(runtime.build({ $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' }))).toBe('a + b');
	});

	it('builds a struct with a body as the brace form, and one without as the unit form', () => {
		expect((runtime.build({ $path: 'declaration.struct', name: 'S', body: [] }) as Node).$type).toBe(rust.kinds.StructItemBrace);
		expect((runtime.build({ $path: 'declaration.struct', name: 'S' }) as Node).$type).toBe(rust.kinds.StructItemUnit);
	});

	it('places a parameter in the container its list holds, and hands a kind id to its slot as it is', () => {
		expect(render(runtime.build({ ...fn, parameters: [parameter(rust.kinds.U8Keyword)] }))).toBe('fn f(x: u8) {}');
	});

	it('picks a qualified identifier by the slot that holds it, and refuses to build one with no holder', () => {
		const qualified = { $path: 'identifier.qualified', qualifier: 'a', name: 'B' };
		expect(render(runtime.build({ ...fn, parameters: [parameter(qualified)] }))).toBe('fn f(x: a::B) {}');
		expect(() => runtime.build(qualified)).toThrow(/identifier\.qualified.*holder/);
	});

	it("merges a range form's members into its holder's through the form's mount, and builds a range without a left through the prefix form", () => {
		expect(render(runtime.build({ $path: 'pattern.range.inclusive', left: 'a', right: 'b' }))).toBe('a..=b');
		expect(render(runtime.build({ $path: 'pattern.range.exclusive', left: 'a', right: 'b' }))).toBe('a..b');
		expect(render(runtime.build({ $path: 'pattern.range.inclusive', right: 'b' }))).toBe('..=b');
	});

	it('refuses a bare range, whose operator only a refinement presets, naming the path', () => {
		expect(() => runtime.build({ $path: 'pattern.range', left: 'a', right: 'b' })).toThrow(/pattern\.range does not build in rust/);
	});

	it("builds a function type's trait form through the mount that seats the form's input at its holder's key", () => {
		expect(render(runtime.build({ $path: 'type.function', trait: 'Fn', parameters: [] }))).toBe('Fn()');
	});

	it("builds a function type with no trait through the fn form, which its sibling arm presets", () => {
		expect(render(runtime.build({ $path: 'type.function', parameters: [], returnType: rust.kinds.U8Keyword }))).toBe('fn() -> u8');
		expect(render(runtime.build({ $path: 'type.function', $flags: ['unsafe'], parameters: [] }))).toBe('unsafe fn()');
		expect(() => runtime.build({ $path: 'type.function', trait: 'Fn', extern: 'x', parameters: [] })).toThrow(/no rust form of type\.function/);
	});

	it("builds a restricted visibility's scope as given, a path through the scope's path form in place of the token the first claim fixes", () => {
		expect(render(runtime.build({ $path: 'modifier.visibility.public.restricted', scope: rust.kinds.Super }))).toBe('pub(super)');
		expect(render(runtime.build({ $path: 'modifier.visibility.public.restricted', scope: 'a' }))).toBe('pub(in a)');
	});

	it("takes the route whose slot seats the value: an attribute's delimited token tree as its arguments, and refuses a token tree no route seats", () => {
		expect(render(runtime.build({ $path: 'attribute.content', path: 'derive', input: { $path: 'element.macro.token_tree.delimited', tokens: [] } }))).toBe('derive()');
		expect(render(runtime.build({ $path: 'attribute.content', path: 'cfg', input: { $path: 'element.macro.token_tree.delimited.bracket', tokens: [] } }))).toBe('cfg[]');
		expect(() => runtime.build({ $path: 'attribute.content', path: 'derive', input: { $path: 'element.macro.token_tree', tokens: [] } })).toThrow(
			/element\.macro\.token_tree sits in attribute_input\.arguments, attribute_input\.value/
		);
	});

	it('refuses text where no seat builds text, and a list where the slot holds one value', () => {
		expect(() => runtime.build({ ...fn, body: 'x' })).toThrow(/declaration\.function's body has no route that seats the text "x"/);
		expect(() => runtime.build({ ...fn, name: ['f'] })).toThrow(/declaration\.function's name holds one value, not a list/);
	});

	it('builds a number $value through the arm that takes its type, and literal.number through its nearest descendants', () => {
		expect(render(runtime.build({ $path: 'literal.number', $value: 42 }))).toBe('42');
		expect(render(runtime.build({ $path: 'literal.number', $value: 1.5 }))).toBe('1.5');
		expect(render(runtime.build({ $path: 'literal.number', $value: 2n ** 70n }))).toBe('1180591620717411303424');
		expect(render(runtime.build({ $path: 'literal.number.integer.hex', $value: 255 }))).toBe('0xff');
		expect(() => runtime.build({ $path: 'literal.number.integer', $value: 1.5 })).toThrow(/literal\.number\.integer takes an integer .* not 1\.5/);
		expect(() => runtime.build({ $path: 'literal.number', content: '1' })).toThrow(/literal\.number is not a path rust builds/);
	});

	it('refuses NaN, the infinities and a negative number, since no rust literal spells them', () => {
		expect(() => runtime.build({ $path: 'literal.number', $value: Number.NaN })).toThrow(/literal\.number: no rust literal spells NaN/);
		expect(() => runtime.build({ $path: 'literal.number.float', $value: -Infinity })).toThrow(/literal\.number\.float: no rust literal spells -Infinity/);
		expect(() => runtime.build({ $path: 'literal.number', $value: -5 })).toThrow(/literal\.number: integer_literal_decimal spells no sign, so it cannot build -5/);
		expect(() => runtime.build({ $path: 'literal.number.float', $value: -1.5 })).toThrow(/float_literal spells no sign, so it cannot build -1\.5/);
	});

	it('builds a boolean by the value its binding declares, and a primitive type by its text', () => {
		expect(runtime.build({ $path: 'literal.boolean', $value: true })).toBe(rust.kinds.TrueKeyword);
		expect(runtime.build({ $path: 'literal', $value: false })).toBe(rust.kinds.FalseKeyword);
		expect(runtime.build({ $path: 'type.primitive', $value: 'u8' })).toBe(rust.kinds.U8Keyword);
		expect(() => runtime.build({ $path: 'type.primitive', $value: 'u9' })).toThrow(/type\.primitive builds this structure \(value "u9"\)/);
	});

	it('refuses a path the language does not build, naming the path and the language', () => {
		expect(() => runtime.build({ $path: 'declaration.class', name: 'C' })).toThrow(/declaration\.class.*rust/);
	});

	it('refuses a flag the picked kind has no step for, naming the flag and the kind', () => {
		expect(() => runtime.build({ ...fn, $flags: ['static'] })).toThrow(/static.*function_item/);
	});
});
