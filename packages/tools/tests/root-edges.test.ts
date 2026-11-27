import { afterAll, describe, expect, it } from 'vitest';
import { sharedEngine } from '@sittir/common/testing';
import type { AnyUntypedNode } from '@sittir/types';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import { fixtureReplayOf, kindViewOf, loadIsLeafKind, loadNativeEngine, loadSlotAccessorOf, materializeDetached, nativeLanguageEngineOf, parseNativeTree, readNodeOf, disposeNativeEngines } from '../src/validate/common.ts';
import { selfContainedRenderInput } from '../src/validate/read-render-parse.ts';

afterAll(disposeNativeEngines);

const parsed = await sharedEngine(() => createEngine(rust));
const K = parsed.kinds;
const engine = await loadNativeEngine('rust');
const native = await nativeLanguageEngineOf('rust');
const isLeafKind = await loadIsLeafKind('rust');
const accessorOf = await loadSlotAccessorOf('rust');
const readNode = await readNodeOf('rust');

function detachedInput(source: string): AnyUntypedNode {
	const tree = parseNativeTree(engine, source);
	return selfContainedRenderInput(materializeDetached(readNode(tree), accessorOf), source, isLeafKind, kindViewOf(engine)) as AnyUntypedNode;
}

function detached(source: string, edges: { readonly before?: number; readonly after?: number }): string {
	const options = { sourceFile: edges };
	return native.render(detachedInput(source), options).toString();
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
		const root = parsed.parse(source, { adoptStyle: true });
		const [first, second] = root.statements();
		if (first === undefined || second === undefined) throw new Error('expected two statements');
		return root.$with.statements(second, first).$render();
	}

	it('keeps them on an edit: a file without a final line break, and its trailing blank lines up to the widest arm', () => {
		expect(swapped('use x;\nuse y;')).toBe('use y;\nuse x;');
		expect(swapped('use x;\nuse y;\n\n')).toBe('use y;\nuse x;\n\n');
		expect(swapped('use x;\nuse y;\n\n\n\n')).toBe('use y;\nuse x;\n\n\n');
	});

	it('are adopted by a parse that adopts its style, and reproduce the source from a detached copy', async () => {
		const source = '\n// a';
		const input = detachedInput(source);
		expect(native.render(input).toString()).toBe('// a\n');
		expect((await fixtureReplayOf('rust'))(input, source)).toBe(source);
	});
});
