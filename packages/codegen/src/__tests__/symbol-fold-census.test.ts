import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { foldedSymbols } from '../compiler/generated-metadata.ts';
import { grammarPackage, sittirDirOf } from '../grammars.ts';

/**
 * Fold census — the raw symbols a grammar's parser folds onto another public
 * symbol (`ts_symbol_map`), counted from parser.c. A token the grammar writes
 * twice (a `token(prec(1, '<'))` beside the plain `'<'`) gets a second raw
 * symbol the parser reports under the first one's id.
 *
 * Each pin is exact. A count above its pin means a change folded a new symbol
 * and the read facts must account for it; a count below means a fold went away
 * and the pin is lowered in the same commit.
 */
const PINS: Record<string, number> = {
	rust: 4,
	typescript: 7,
	python: 1,
	scm: 4,
	regex: 1
};

describe('symbol fold census', () => {
	for (const [grammar, pin] of Object.entries(PINS)) {
		it(`${grammar}: the parser folds exactly ${pin} raw symbols onto another public symbol`, () => {
			const parserC = readFileSync(join(sittirDirOf(grammarPackage(grammar)), 'src', 'parser.c'), 'utf8');
			const folds = [...foldedSymbols(parserC)].map(([raw, publicSymbol]) => `${raw} -> ${publicSymbol}`);
			expect(folds.length, `${grammar} folds:\n${folds.join('\n')}`).toBe(pin);
		});
	}
});
