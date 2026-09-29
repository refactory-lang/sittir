import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { enrichWhitespace } from '../dsl/whitespace.ts';
import type { RuleListEntry } from '../dsl/rule-patterns.ts';
import type { Rule } from '../types/rule.ts';
import { evaluatePackage } from '../compiler/evaluate-package.ts';
import { grammarPackage } from '../grammars.ts';

const SCANNED_CONTROL: Record<string, string> = {
	rust: 'identifier',
	typescript: '_automatic_semicolon',
	python: '_newline',
	scm: 'identifier',
	regex: 'pattern_character'
};

async function mintedExternals(grammar: string): Promise<readonly string[]> {
	const raw = await evaluatePackage(grammarPackage(grammar));
	const upstream = raw.stages!.raw.grammar as {
		externals?: readonly RuleListEntry[];
		extras?: readonly RuleListEntry[];
		rules: Readonly<Record<string, Rule>>;
	};
	return enrichWhitespace(upstream.externals ?? [], upstream.extras ?? [], upstream.rules).addedExternals;
}

function parserSource(grammar: string): string {
	return readFileSync(fileURLToPath(new URL(`../../../${grammar}/.sittir/src/parser.c`, import.meta.url)), 'utf8');
}

function count(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe('whitespace externals are catalogued but never parsed', () => {
	for (const grammar of Object.keys(SCANNED_CONTROL)) {
		it(`${grammar}: each minted symbol has an id and no parse-table entry`, async () => {
			const names = await mintedExternals(grammar);
			expect(names.length).toBeGreaterThan(0);
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
		}, 60_000);
	}
});
