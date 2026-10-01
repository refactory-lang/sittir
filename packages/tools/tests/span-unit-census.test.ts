import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, allGrammars } from '@sittir/codegen/grammars';

// A span counts UTF-8 bytes; a string index counts UTF-16 code units. The
// span helper (`packages/common/src/span.ts`) is the only place the two may
// meet, so no other hand-written source slices a string by a span's fields
// or compares them with a parser node's `startIndex` / `endIndex`.
const SPAN_FIELD = String.raw`(\.(start|end)\b|startPos|endPos|\$span)`;
const NODE_INDEX = String.raw`(startIndex|endIndex)\b`;
const COMPARE = String.raw`(===|!==|[<>]=?)`;
const SLICED_BY_SPAN = new RegExp(String.raw`\.(slice|substring|substr)\((?!\{)[^;]*?${SPAN_FIELD}`);
const COMPARED_WITH_INDEX = new RegExp(
	`(${SPAN_FIELD}[^;]*?${COMPARE}[^;]*?${NODE_INDEX})|(${NODE_INDEX}[^;]*?${COMPARE}[^;]*?${SPAN_FIELD})`
);

function handWrittenSources(): string[] {
	const generated = allGrammars().map((grammar) => `packages/${grammar}/src/`);
	return execFileSync('git', ['ls-files', 'packages'], { cwd: REPO_ROOT, encoding: 'utf-8' })
		.split('\n')
		.filter((file) => file.endsWith('.ts') && file.includes('/src/'))
		.filter((file) => !file.includes('__tests__') && !file.endsWith('.test.ts'))
		.filter((file) => !generated.some((dir) => file.startsWith(dir)))
		.filter((file) => file !== 'packages/common/src/span.ts');
}

function offences(pattern: RegExp): string[] {
	const found: string[] = [];
	for (const file of handWrittenSources()) {
		const lines = readFileSync(join(REPO_ROOT, file), 'utf-8').split('\n');
		lines.forEach((line, index) => {
			const code = line.trimStart();
			if (code.startsWith('*') || code.startsWith('//') || code.startsWith('/*')) return;
			if (pattern.test(line)) found.push(`${file}:${index + 1}: ${code}`);
		});
	}
	return found;
}

describe('byte spans and string indices', () => {
	it('no source slices a string by a span outside the span helper', () => {
		expect(offences(SLICED_BY_SPAN)).toEqual([]);
	});

	it('no source compares a span with a parser node index outside the span helper', () => {
		expect(offences(COMPARED_WITH_INDEX)).toEqual([]);
	});

	it('the patterns catch the shapes they guard against', () => {
		expect(SLICED_BY_SPAN.test('const text = entry.source.slice(cand.start, cand.end);')).toBe(true);
		expect(SLICED_BY_SPAN.test('return source.slice(0, edit.startPos) + edit.insertedText;')).toBe(true);
		expect(SLICED_BY_SPAN.test('result += spans.slice({ start: cursor, end: edit.startPos });')).toBe(false);
		expect(COMPARED_WITH_INDEX.test('(c) => c.span?.start === node.startIndex && c.span?.end === node.endIndex')).toBe(true);
		expect(COMPARED_WITH_INDEX.test('if (node.startIndex === startIndex && node.endIndex === endIndex) return node;')).toBe(false);
	});
});
