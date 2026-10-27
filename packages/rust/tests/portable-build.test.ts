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

	it("builds a function type's trait form through the mount that seats the form's input at its holder's key", () => {
		expect(render(runtime.build({ $path: 'type.function', trait: 'Fn', parameters: [] }))).toBe('Fn()');
	});

	it('refuses a path the language does not build, naming the path and the language', () => {
		expect(() => runtime.build({ $path: 'declaration.class', name: 'C' })).toThrow(/declaration\.class.*rust/);
	});

	it('refuses a flag the picked kind has no step for, naming the flag and the kind', () => {
		expect(() => runtime.build({ ...fn, $flags: ['static'] })).toThrow(/static.*function_item/);
	});
});
