// A parsed tree's source stays native: JavaScript gets the text a span covers
// by one native call, one string of that span's characters. A span is counted
// in UTF-8 bytes, so text after a multi-byte character or a CRLF line ending
// reads at its own bytes, and a span that is not one of the source's is
// refused rather than read.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { spanOf, treeOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

const SOURCE = '// é ✓\r\nfn after() {}\r\n';

async function nameOfFirstFunction(): Promise<object> {
	const engine = await createEngine(rust);
	const root = engine.parse(SOURCE) as unknown as { statements(): { name(): object }[] };
	return root.statements()[0]!.name();
}

describe("a parsed tree's text", () => {
	it('reads a leaf after multi-byte characters and a CRLF line ending at its own bytes', async () => {
		const name = await nameOfFirstFunction();
		const span = spanOf(name)!;
		expect(span).toEqual({ start: Buffer.byteLength('// é ✓\r\nfn '), end: Buffer.byteLength('// é ✓\r\nfn after') });
		expect(treeOf(name)!.text!(span)).toBe('after');
		expect(treeOf(name)!.text!({ start: 0, end: span.end })).toBe('// é ✓\r\nfn after');
	});

	it('refuses a span past the source, reversed, or splitting a character, naming the span and the tree', async () => {
		const tree = treeOf(await nameOfFirstFunction())!;
		const inside = Buffer.byteLength('// ') + 1;
		for (const span of [
			{ start: 0, end: Buffer.byteLength(SOURCE) + 1 },
			{ start: 4, end: 2 },
			{ start: 0, end: inside }
		])
			expect(() => tree.text!(span)).toThrow(`${span.start}..${span.end} is not a span of tree ${tree.id}'s source`);
	});
});
