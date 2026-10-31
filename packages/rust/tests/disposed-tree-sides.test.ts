import { createRequire } from 'node:module';
import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { builtRefOf } from '../../common/src/built-ref.ts';
import rust from '../src/index.ts';

const native = createRequire(import.meta.url)('../native/index.cjs') as { disposeTree(treeId: number): void };
const rs = await createEngine(rust);

afterAll(() => rs.dispose());

const wordsOf = (node: object): Uint32Array => (node as { readonly $words: Uint32Array }).$words;
const comment = (text: string) => rs.build.blockComment(rs.build.blockCommentRegular(` ${text} `));

describe('disposing a tree no read made records of', () => {
	it('frees the sealed chunk whose last count a side of it held', () => {
		const tree = rs.diagnostics.parseTree('fn f() {}\n');
		const held = comment('held');
		const words = wordsOf(held);
		tree.writeTriviaSide!(0, 'leading', [{ $type: held.$type, $record: builtRefOf(held)!.at }]);
		const fillers = [comment('filler')];
		while (wordsOf(fillers.at(-1)!) === words) fillers.push(comment('filler'));
		for (const filler of fillers) rs.release(filler);
		rs.release(held);
		expect(words.length).not.toBe(0);
		native.disposeTree(tree.id);
		expect(words.length).toBe(0);
	});
});
