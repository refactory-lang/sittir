import { describe, expect, it } from 'vitest';
import { asReadOutput, holdReadTree } from '../src/node-data.ts';
import { erred, framed, touch } from '../src/portable/project.ts';
import { mintTreeToken } from '../src/tree-token.ts';
import { ERROR_KIND_ID } from '../src/utils.ts';

const erredNode = { $type: ERROR_KIND_ID, $text: '@@@', $_layout: { at: { $treeHandle: 2, $span: { start: 6, end: 9 }, $type: ERROR_KIND_ID } } };
holdReadTree(asReadOutput(erredNode), mintTreeToken(1));
const clean = { $type: 1 };

describe('a read frame', () => {
	it('keeps its node when the read touched an erred node and built a structure', () => {
		expect(erred(erredNode)).toBe(true);
		expect(framed(clean, undefined, () => (touch(erredNode), { $path: 'statement' }))).toBe(clean);
		expect(framed(clean, undefined, () => (touch(erredNode), { $path: 'literal.number', $value: 1 }))).toEqual({ $path: 'literal.number', $value: 1 });
		expect(framed(clean, undefined, () => ({ $path: 'statement' }))).toEqual({ $path: 'statement' });
	});

	it('comes back as it was when a read inside it throws', () => {
		const structure = { $path: 'statement' };
		const read = framed(clean, undefined, () => {
			expect(() =>
				framed(erredNode, undefined, () => {
					touch(erredNode);
					throw new Error('the read failed');
				})
			).toThrow('the read failed');
			return structure;
		});
		expect(read).toBe(structure);
	});
});
