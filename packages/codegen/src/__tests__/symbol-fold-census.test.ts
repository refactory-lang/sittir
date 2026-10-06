import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { foldedSymbols } from '../compiler/generated-metadata.ts';
import { grammarPackage, sittirDirOf } from '../grammars.ts';

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
