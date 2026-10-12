/**
 * Parses the receiver cases of one grammar with the parser tree-sitter generated for it
 * (packages/<grammar>/.sittir/parser.wasm), and prints each case's parameter list as tree-sitter's
 * s-expression, fields included: a receiver of every shape, the forms that are no receiver, and the
 * forms a receiver split rejects. It reads the parser alone, so it runs whether or not sittir's
 * codegen accepted the grammar.
 *
 *   pnpm exec tsx docs/superpowers/probes/2026-10-12-receiver-split/samples.mts <rust|typescript>
 *
 * Run from the root of the checkout whose parser it reads.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface SyntaxNode {
	readonly type: string;
	readonly namedChildren: readonly SyntaxNode[];
	toString(): string;
}

const grammar = process.argv[2] ?? 'rust';
const SAMPLES: Record<string, readonly string[]> = {
	rust: [
		'fn f() {}',
		'fn f(a: u8) {}',
		'fn f(&self) {}',
		"fn f(&'a mut self, a: u8,) {}",
		'fn f(mut self) {}',
		'fn f(self,) {}',
		'fn f(#[cfg(x)] self, b: u8) {}',
		'fn f(self: Box<Self>, a: u8) {}',
		'fn f(a: u8, self) {}',
		'trait T { fn f(&self); }',
		'type F = fn(u8, u16) -> u8;'
	],
	typescript: [
		'function f() {}',
		'function f(a, b?) {}',
		'function f(this: Window) {}',
		'function f(this: Window, a: number,) {}',
		'class C { m(this: C, a) {} get x(this: C) { return 1; } }',
		'let g = function (this: Foo) {};',
		'type F = (this: Foo, a: number) => void;',
		'interface I { (this: I): void; m(this: I): void }',
		'function f(this?: Foo) {}',
		'function f(a, this: Foo) {}',
		'let h = (this: Foo) => 1;',
		'function f(readonly) {}'
	]
};
const root = process.cwd();
const { loadWebTreeSitter } = (await import(pathToFileURL(join(root, 'packages/codegen/src/engine-loader.ts')).href)) as {
	loadWebTreeSitter(): Promise<{ Parser: new () => { setLanguage(l: unknown): void; parse(s: string): { rootNode: SyntaxNode } }; Language: { load(path: string): Promise<unknown> } }>;
};
const { Parser, Language } = await loadWebTreeSitter();
const parser = new Parser();
parser.setLanguage(await Language.load(join(root, `packages/${grammar}/.sittir/parser.wasm`)));
const listKind = grammar === 'rust' ? 'parameters' : 'formal_parameters';
const lists = (node: SyntaxNode): SyntaxNode[] => [...(node.type === listKind ? [node] : []), ...node.namedChildren.flatMap(lists)];
for (const source of SAMPLES[grammar] ?? []) {
	const tree = parser.parse(source).rootNode;
	const text = tree.toString();
	const error = text.includes('(ERROR') || text.includes('(MISSING');
	process.stdout.write(`${source}\n${error ? `  ERROR ${text}\n` : ''}${lists(tree).map((node) => `  ${node.toString()}\n`).join('')}`);
}
