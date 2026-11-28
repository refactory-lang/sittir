import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { writeUnitSides } from '../../common/src/utils.ts';
import rust from '../src/index.ts';

const addon = createRequire(import.meta.url)('../native/index.cjs') as Record<string, unknown>;
const opened = { words: 0, bytes: 0 };
for (const [name, form] of [
	['builtWords', 'words'],
	['builtBytes', 'bytes']
] as const) {
	const open = addon[name] as (...args: unknown[]) => unknown;
	addon[name] = function (this: unknown, ...args: unknown[]) {
		opened[form]++;
		return open.apply(this, args);
	};
}

const SOURCE = 'fn f() {\n    a;\n}\n/* c */ ;\n';

/** One write of each kind of side, every entry's text `text` long, each read back as its render. */
function writeEachSide(rs: any, root: any, n: number, text: number): void {
	const body = (tag: string): string => `${tag}${n} ${'x'.repeat(text)}`;
	const own = rs.build.expressionStatement(rs.build.identifier('a')).$trivia.leading(`/* ${body('own')} */`);
	expect(String(own.$render())).toBe(`/* ${body('own')} */ a;`);
	const leaf = rs.build.identifier('b');
	const holder = rs.build.expressionStatement(leaf);
	leaf.$trivia.leading(`/* ${body('site')} */`);
	expect(String(holder.$render())).toBe(`/* ${body('site')} */ b;`);
	const parsed = root.$query().$descendants.ofType(rust.kinds.ExpressionStatement).at(0);
	parsed.$trivia.trailing(`/* ${body('parsed')} */`);
	writeUnitSides(root, [{ slot: '_statements', item: 1, trailing: [rs.build.lineComment(` ${body('unit')}`)] }]);
	expect(String(root.$render())).toBe(`fn f() {\n    a; /* ${body('parsed')} */\n}\n/* c */ ; // ${body('unit')}\n`);
	const lone = rs.build.identifier('c');
	lone.$trivia.leading(`/* ${body('text')} */`, rs.build.blockComment(rs.build.blockCommentRegular(` ${body('record')} `)));
	expect(String(lone.$render())).toBe(`/* ${body('text')} */ /* ${body('record')} */ c`);
}

describe('JavaScript opens every chunk of the built arena a side is written in', () => {
	it('writes each kind of side, and renders a lone built leaf with a text and a record side, before any build opened a chunk', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse(SOURCE);
		const before = { ...opened };
		writeEachSide(rs, root, 0, 8);
		expect(opened.words).toBeGreaterThan(before.words);
		expect(opened.bytes).toBeGreaterThan(before.bytes);
	});

	it('writes each kind of side, and renders a lone built leaf with a text and a record side, while the chunks JavaScript has open are full', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse(SOURCE);
		writeEachSide(rs, root, 0, 8);
		const first = { ...opened };
		let n = 1;
		while ((opened.words < first.words + 2 || opened.bytes < first.bytes + 2) && n < 2000) writeEachSide(rs, root, n++, 600);
		expect([opened.words - first.words, opened.bytes - first.bytes].every((count) => count >= 2)).toBe(true);
	});
});
