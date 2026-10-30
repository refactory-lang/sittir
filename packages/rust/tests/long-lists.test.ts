import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { cellFormatOf } from '@sittir/common/engine';
import { getActiveBackend } from '../src/backend.ts';
import rust from '../src/index.ts';

const backend = getActiveBackend();
if (backend.name !== 'native') throw new Error(`native backend unavailable: ${backend.reason}`);
const CHUNK_WORDS = 2 ** cellFormatOf(backend.native)!.chunkShift;
const LONG = { timeout: 30_000 };

const textOf = (n: number): string => Array.from({ length: n }, (_, at) => `x${at};\n`).join('');

describe('a list longer than an arena chunk, in arena storage', () => {
	const engine = createEngine(rust, { nodeStorage: 'arena' });

	it.each([
		{ items: CHUNK_WORDS - 1, run: 'fills a chunk' },
		{ items: CHUNK_WORDS, run: "takes a chunk of its own, opened after its holder's" },
		{ items: 3 * CHUNK_WORDS + 1, run: 'is several chunks long' }
	])('built of $items items, whose run $run, renders and reads back every item', LONG, async ({ items }) => {
		const rs = await engine;
		const statements = Array.from({ length: items }, (_, at) => rs.build.expressionStatement.withSemi(rs.build.identifier(`x${at}`)));
		const root = rs.build.sourceFile({ statements });
		expect(rs.render(root).toString()).toBe(textOf(items));
		const read = root.statements();
		expect(read.length).toBe(items);
		expect([read[0], read[items - 1]].map((statement) => rs.render(statement!).toString())).toEqual(['x0;', `x${items - 1};`]);
		const longer = root.$with.statements(...read, rs.build.expressionStatement.withSemi(rs.build.identifier('tail')));
		expect(rs.render(longer).toString()).toBe(`${textOf(items)}tail;\n`);
	});

	it.each([CHUNK_WORDS - 1, CHUNK_WORDS, 3 * CHUNK_WORDS + 1])('parsed of %i items, renders, reads back every item, and is built over and edited', LONG, async (items) => {
		const rs = await engine;
		const text = textOf(items);
		const root = rs.parse(text);
		expect(rs.render(root).toString()).toBe(text);
		const read = root.statements();
		expect(read.length).toBe(items);
		expect([read[0], read[items - 1]].map((statement) => rs.render(statement!).toString())).toEqual(['x0;', `x${items - 1};`]);
		expect(rs.render(rs.build.sourceFile({ statements: [...read] })).toString()).toBe(text);
		expect(rs.render(root.$with.statements(...read, rs.build.expressionStatement.withSemi(rs.build.identifier('tail')))).toString()).toBe(`${text}tail;\n`);
	});
});
