import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import python from '../../../python/src/index.ts';
import rust from '../../../rust/src/index.ts';
import typescript from '../../../typescript/src/index.ts';

type Read = { readonly $path: string; readonly [slot: string]: unknown };
type Leading = { readonly $trivia: { leading(): readonly unknown[] } };
interface Runtime {
	readonly engine: { parse(source: string): { statements(): readonly unknown[] }; render(value: never): unknown };
	read(value: never): unknown;
	build(value: never): unknown;
}

const runtimes: Readonly<Record<'python' | 'rust' | 'typescript', Runtime>> = {
	python: await portableRuntime(await sharedEngine(() => createEngine(python, { api: 'strict' }))),
	rust: await portableRuntime(await sharedEngine(() => createEngine(rust, { api: 'strict' }))),
	typescript: await portableRuntime(await sharedEngine(() => createEngine(typescript, { api: 'strict' })))
};

const isRead = (value: unknown): value is Read => typeof value === 'object' && value !== null && '$path' in value;
const hasTrivia = (value: unknown): value is Leading => typeof value === 'object' && value !== null && '$trivia' in value;
const reads = (value: unknown): readonly Read[] =>
	Array.isArray(value) ? value.flatMap(reads) : isRead(value) ? [value, ...Object.values(value).flatMap(reads)] : [];
const readOf = (runtime: Runtime, source: string): Read => runtime.read(runtime.engine.parse(source) as never) as Read;
const found = (runtime: Runtime, source: string, path: string): Read => {
	const hit = reads(readOf(runtime, source)).find((read) => read.$path === path);
	if (hit === undefined) throw new Error(`${JSON.stringify(source)} reads no ${path}`);
	return hit;
};
const rendered = (runtime: Runtime, structure: unknown): string => String(runtime.engine.render(runtime.build(structure as never) as never));
const leading = (runtime: Runtime, source: string): Read => {
	const [statement] = runtime.engine.parse(source).statements();
	if (!hasTrivia(statement)) throw new Error(`${JSON.stringify(source)} opens with no statement`);
	const [comment] = statement.$trivia.leading().filter((item) => typeof item !== 'number');
	if (comment === undefined) throw new Error(`${JSON.stringify(source)} holds no leading comment`);
	return runtime.read(comment as never) as Read;
};

describe('a wrapper around one slot reads as that slot', () => {
	it.each([
		['python', '@cache\ndef f():\n    pass\n', 'declaration.function', { decorators: ['cache'] }],
		['python', '@functools.cache\ndef f():\n    pass\n', 'declaration.function', { decorators: [{ $path: 'expression.member', object: 'functools', property: 'cache' }] }],
		['typescript', '@x\nclass A {}\n', 'declaration.type.class', { decorators: ['x'] }],
		['python', 'def f(x: int) -> int:\n    pass\n', 'declaration.function', { returnType: 'int', parameters: [expect.objectContaining({ type: 'int' })] }],
		['python', 'x: int\n', 'declaration.variable', { type: 'int' }],
		['rust', 'struct S {\n    #[a]\n    x: u8,\n}\n', 'declaration.member.field', { attributes: [{ $path: 'attribute', path: 'a' }] }]
	] as const)('%s reads %j as %s holding %j, and builds it back', (grammar, source, path, slots) => {
		const runtime = runtimes[grammar];
		expect(found(runtime, source, path)).toMatchObject(slots);
		expect(reads(readOf(runtime, source)).map((read) => read.$path)).not.toContain('attribute.decorator');
		expect(rendered(runtime, readOf(runtime, source))).toBe(source);
	});

	it("reads rust's inner attribute as its attribute with inner set, and an outer one without it, and builds both back", () => {
		const { rust: runtime } = runtimes;
		const source = '#![a]\n#[b]\nfn f() {}\n';
		const [inner, outer] = readOf(runtime, source).statements as readonly Read[];
		expect(inner).toEqual({ $path: 'attribute', $flags: ['inner'], path: 'a' });
		expect(outer).toEqual({ $path: 'attribute', path: 'b' });
		expect(rendered(runtime, readOf(runtime, source))).toBe(source);
		expect(rendered(runtime, { $path: 'file', statements: [{ $path: 'attribute', $flags: ['inner'], path: 'c' }] }).trimEnd()).toBe('#![c]');
	});
});

describe('an unnamed slot reads under the name of what it holds', () => {
	it.each([
		['python', 'from a import b, c\n', 'statement.import.from', 'names'],
		['python', 'from __future__ import annotations\n', 'statement.import.future', 'names'],
		['python', 'from a import *\n', 'statement.import.from', 'names'],
		['python', 'def g():\n    yield 1\n', 'expression.yield', 'expression'],
		['typescript', 'import a, { b } from "m";\n', 'clause.import.names', 'specifiers'],
		['typescript', 'import { b } from "m";\n', 'clause.import.names', 'specifiers'],
		['typescript', 'declare const x: number;\n', 'declaration.ambient', 'body'],
		['typescript', 'type T = "a";\n', 'type.literal', 'value'],
		['rust', 'fn f() {\n    g::<T>();\n}\n', 'element.type_argument', 'argument'],
		['rust', 'fn f() {\n    S { a: 1 };\n}\n', 'element.struct.field', 'name']
	] as const)('%s reads %j as %s with its %s, never content, and builds it back', (grammar, source, path, slot) => {
		const runtime = runtimes[grammar];
		const read = found(runtime, source, path);
		expect(read).toHaveProperty(slot);
		expect(read).not.toHaveProperty('content');
		expect(rendered(runtime, readOf(runtime, source))).toBe(source);
	});
});

describe('an expression in a statement list reads as itself', () => {
	it.each([
		['python', 'f()\n', { $path: 'expression.call', function: 'f', arguments: [] }],
		['typescript', 'f();\n', { $path: 'expression.call', function: 'f' }],
		['rust', 'fn f() {\n    g();\n}\n', { $path: 'expression.call', function: 'g' }]
	] as const)('%s reads %j with no statement.expression around its call, and builds it back', (grammar, source, call) => {
		const runtime = runtimes[grammar];
		const paths = reads(readOf(runtime, source)).map((read) => read.$path);
		expect(paths).not.toContain('statement.expression');
		expect(found(runtime, source, 'expression.call')).toMatchObject(call);
		expect(rendered(runtime, readOf(runtime, source))).toBe(source);
	});

	it.each([
		['python', 'f()\n'],
		['rust', 'g();\n']
	] as const)("%s reads the statement node of %j on its own as the call it holds", (grammar, source) => {
		const runtime = runtimes[grammar];
		const [statement] = grammar === 'python' ? (runtime.engine.parse(source).statements()[0] as { statements(): readonly unknown[] }).statements() : runtime.engine.parse(source).statements();
		expect(runtime.read(statement as never)).toMatchObject({ $path: 'expression.call' });
	});
});

describe('a comment or an escape is its text', () => {
	it.each([
		['python', '# x\npass\n', 'comment.line', ' x', '# x'],
		['typescript', '// x\nlet a;\n', 'comment.line', ' x', '// x'],
		['typescript', '/* x */\nlet a;\n', 'comment.block', ' x ', '/* x */'],
		['rust', '// x\nfn f() {}\n', 'comment.line', ' x', '// x'],
		['rust', '/* x */\nfn f() {}\n', 'comment.block', ' x ', '/* x */']
	] as const)('%s reads the comment opening %j as %s with $value %j, and builds it from that $value', (grammar, source, path, value, text) => {
		const runtime = runtimes[grammar];
		expect(leading(runtime, source)).toEqual({ $path: path, $value: value });
		expect(rendered(runtime, { $path: path, $value: value }).trimEnd()).toBe(text);
	});

	it("reads rust's doc comments as their text, and builds them back", () => {
		const { rust: runtime } = runtimes;
		for (const [source, path] of [
			['/// x\nfn f() {}\n', 'comment.line.doc'],
			['//! x\nfn f() {}\n', 'comment.line.doc.inner'],
			['/** x */\nfn f() {}\n', 'comment.block.doc'],
			['/*! x */\nfn f() {}\n', 'comment.block.doc.inner']
		] as const) {
			const read = leading(runtime, source);
			expect(read).toMatchObject({ $path: path, $value: expect.stringContaining(' x') });
			expect(Object.keys(read).sort()).toEqual(['$path', '$value']);
			expect(rendered(runtime, read).trimEnd()).toBe(source.split('\n')[0]);
		}
	});

	it.each([
		['python', '"a\\nb"\n'],
		['typescript', '"a\\nb";\n'],
		['rust', 'fn f() {\n    "a\\nb";\n}\n']
	] as const)('%s reads the escape in %j as its text, and builds it back', (grammar, source) => {
		const runtime = runtimes[grammar];
		const escape = found(runtime, source, 'literal.string.escape');
		expect(Object.keys(escape).sort()).toEqual(['$path', '$value']);
		expect(typeof escape.$value).toBe('string');
		expect(rendered(runtime, readOf(runtime, source))).toBe(source);
	});
});
