import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NEVER_SCANNED: Record<string, readonly string[]> = {
	rust: ['_comma_space', '_comma_newline', '_semicolon_space', '_semicolon_newline', '_space', '_newline'],
	typescript: ['_comma_space', '_comma_newline', '_space', '_newline'],
	python: ['_comma_space', '_comma_newline', '_semicolon_space', '_semicolon_newline', '_space']
};

const SCANNED_CONTROL: Record<string, string> = {
	rust: 'identifier',
	typescript: '_automatic_semicolon',
	python: '_newline'
};

function parserSource(grammar: string): string {
	return readFileSync(fileURLToPath(new URL(`../../../${grammar}/.sittir/src/parser.c`, import.meta.url)), 'utf8');
}

function count(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe('whitespace externals are catalogued but never parsed', () => {
	for (const [grammar, names] of Object.entries(NEVER_SCANNED)) {
		it(`${grammar}: each symbol has an id and no parse-table entry`, () => {
			const source = parserSource(grammar);
			const tableStart = source.indexOf('static const uint16_t ts_parse_table');
			const mapStart = source.indexOf('ts_external_scanner_symbol_map', tableStart);
			expect(tableStart).toBeGreaterThan(0);
			expect(mapStart).toBeGreaterThan(tableStart);
			const parseTables = source.slice(tableStart, mapStart);
			for (const name of names) {
				const sym = `sym_${name}`;
				expect(source, `${sym} missing from ts_symbol_identifiers`).toMatch(new RegExp(`${sym} = \\d+,`));
				expect(count(parseTables, `[${sym}]`), `${sym} has parse-table entries beyond state 0`).toBe(1);
			}
			const control = `sym_${SCANNED_CONTROL[grammar]!}`;
			expect(count(parseTables, `[${control}]`), `${control} should be a real transition symbol`).toBeGreaterThan(1);
		});
	}
});
