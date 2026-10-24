import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import { kindViewOf, loadIsLeafKind, loadNativeEngine, loadSlotAccessorOf, materializeDetached, nativeLanguageEngineOf, readNativeTree, readNodeOf } from '../src/validate/common.ts';
import { selfContainedRenderInput } from '../src/validate/read-render-parse.ts';

const parsed = await createEngine(rust);
const K = parsed.kinds;
const engine = await loadNativeEngine('rust');
const native = await nativeLanguageEngineOf('rust');
const isLeafKind = await loadIsLeafKind('rust');
const accessorOf = await loadSlotAccessorOf('rust');
const readNode = await readNodeOf('rust');

function detachedInput(source: string): { readonly input: AnyUntypedNode; readonly options: Readonly<Record<string, unknown>> } {
	const { tree } = readNativeTree(engine, source);
	const input = selfContainedRenderInput(materializeDetached(readNode(tree), accessorOf), source, isLeafKind, kindViewOf(engine)) as AnyUntypedNode;
	return { input, options: tree.options ?? {} };
}

function detached(source: string, edges: { readonly before?: number; readonly after?: number }): string {
	const options = { sourceFile: edges };
	return native.render(detachedInput(source).input, options).toString();
}

describe("a detached root's edges are its options, whether it holds items or only trivia", () => {
	it('opens a file of items and a file of comments alike with the before arm', () => {
		expect(detached('fn f() {}\n', { before: K.Newline })).toBe('\nfn f() {}\n');
		expect(detached('// a\n', { before: K.Newline })).toBe('\n// a\n');
	});

	it('ends a root render with the after arm, over a line comment that ends the file', () => {
		expect(detached('fn f() {}\n', { after: K.Tight })).toBe('fn f() {}');
		expect(detached('// a\n', { after: K.Tight })).toBe('// a');
		expect(detached('fn f() {}\n// a\n', { after: K.Tight })).toBe('fn f() {}\n// a');
	});
});

describe("a parsed root's edges are the ones its source infers", () => {
	function swapped(source: string): string {
		const root = parsed.parse(source);
		const [first, second] = root.statements();
		if (first === undefined || second === undefined) throw new Error('expected two statements');
		return root.$with.statements(second, first).$render();
	}

	it('keeps them on an edit: a file without a final line break, and its trailing blank lines up to the widest arm', () => {
		expect(swapped('use x;\nuse y;')).toBe('use y;\nuse x;');
		expect(swapped('use x;\nuse y;\n\n')).toBe('use y;\nuse x;\n\n');
		expect(swapped('use x;\nuse y;\n\n\n\n')).toBe('use y;\nuse x;\n\n\n');
	});

	it("records them in the tree's options, which reproduce the source from a detached copy", () => {
		const source = '\n// a';
		const { input, options } = detachedInput(source);
		expect(options).toEqual({ sourceFile: { before: K.Newline, after: K.Tight } });
		expect(native.render(input, options).toString()).toBe(source);
		expect(native.render(input).toString()).toBe('// a\n');
	});
});
