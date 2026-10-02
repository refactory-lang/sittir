import { describe, expect, it } from 'vitest';
import { formatSpelledTrivia } from '../../src/census/spelled-trivia.ts';
import { readNodeModelFile } from '../../src/validate/common.ts';

const committed = (grammar: string): string => formatSpelledTrivia(grammar, JSON.parse(readNodeModelFile(grammar)!));

describe('the spelled-trivia census', () => {
	it('lists each kind with its spellings, in match order', () => {
		const model = {
			spelledTrivia: {
				forms: [
					{ kind: 'block', opens: ['/*'], closes: ['*/'] },
					{ kind: 'line', opens: ['//', '#'], closes: [''] }
				]
			}
		};
		expect(formatSpelledTrivia('g', model)).toBe('g: 2 kinds\n  block  "/*"…"*/"\n  line  "//"…"" | "#"…""\n');
	});

	it('says why a grammar has no table', () => {
		expect(formatSpelledTrivia('g', { spelledTrivia: { reason: 'one kind' } })).toBe('g: no table: one kind\n');
		expect(formatSpelledTrivia('g', { spelledTrivia: null })).toBe('g: no ir.comment\n');
	});

	it('reads the table codegen stamped for each grammar', () => {
		expect(committed('typescript')).toBe('typescript: 2 kinds\n  comment_block  "/*"…"*/"\n  comment_line  "//"…""\n');
		expect(committed('rust')).toBe('rust: 2 kinds\n  block_comment  "/*"…"*/"\n  line_comment  "//"…""\n');
		expect(committed('python')).toBe("python: no table: ir.comment is one kind, 'comment'\n");
		expect(committed('scm')).toBe("scm: no table: ir.comment is one kind, 'comment'\n");
		expect(committed('regex')).toBe('regex: no ir.comment\n');
	});
});
