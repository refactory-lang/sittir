import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import rust from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(rust, { api: 'strict' }));
const readOf = (source: string): unknown => runtime.read(runtime.engine.parse(source, { errors: 'throw' }));
const rebuilt = (source: string): string => String(runtime.engine.render(runtime.build(readOf(source) as never) as never));
const attribute = (path: string) => ({ $path: 'attribute', content: { $path: 'attribute.content', path } });

describe("a parameter's attributes are a list, read and built through its attributed parameter", () => {
	it("reads a parameter's attribute as a one-element list", () => {
		expect(JSON.stringify(readOf('fn g(#[cfg(x)] y: u8) {}\n'))).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.function","name":"g","body":{"$path":"statement.block","statements":[]},"parameters":[{"$path":"declaration.parameter","name":"y","type":"u8","attributes":[{"$path":"attribute","content":{"$path":"attribute.content","path":"cfg","input":{"$path":"element.macro.token_tree.delimited.paren","tokens":["x"]}}}]}]}]}'
		);
	});

	it("reads a receiver's attribute as a one-element list", () => {
		expect(JSON.stringify(readOf('impl S { fn f(#[a] &self) {} }\n'))).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.extension","type":"S","body":[{"$path":"declaration.method","name":"f","body":{"$path":"statement.block","statements":[]},"receiver":{"$path":"declaration.parameter.receiver","reference":true,"attributes":[{"$path":"attribute","content":{"$path":"attribute.content","path":"a"}}]},"parameters":[]}],"typeParameters":[]}]}'
		);
	});

	it.each([
		['fn g(#[cfg(x)] y: u8) {}\n', 'fn g(#[cfg(x)] y: u8) {}\n'],
		['extern "C" { fn p(#[a] x: u8, #[b] ...); }\n', 'extern "C" {\n    fn p(#[a] x: u8, #[b] ...);\n}\n'],
		['impl S { fn f(#[a] &self) {} }\n', 'impl S {\n    fn f(#[a] &self) {}\n}\n'],
		['impl S { fn f(#[a] self: &Self) {} }\n', 'impl S {\n    fn f(#[a] self: &Self) {}\n}\n'],
		['impl S { fn f(#[a] mut self, #[b] x: u8) {} }\n', 'impl S {\n    fn f(#[a] mut self, #[b] x: u8) {}\n}\n'],
		['trait T { fn f(#[a] &self); }\n', 'trait T {\n    fn f(#[a] &self);\n}\n']
	])('builds %j back with its attributes', (source, rendered) => {
		expect(rebuilt(source)).toBe(rendered);
	});

	const parameter = (attributes: readonly unknown[]) => ({
		$path: 'declaration.function',
		name: 'g',
		body: { $path: 'statement.block', statements: [] },
		parameters: [{ $path: 'declaration.parameter', name: 'y', type: 'u8', attributes }]
	});

	it('builds an empty attribute list as no attribute', () => {
		expect(String(runtime.engine.render(runtime.build(parameter([]) as never) as never))).toBe('fn g(y: u8) {}');
	});

	it('refuses two attributes on one parameter, which tree-sitter-rust parses one of', () => {
		expect(() => runtime.build(parameter([attribute('a'), attribute('b')]) as never)).toThrow(
			"portable build: declaration.parameter's attributes holds one value in rust, not 2"
		);
	});
});
