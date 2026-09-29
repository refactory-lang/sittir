import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_ENTRY, GRAMMAR_TSCONFIG, GRAMMAR_TYPECHECK_CEILING, GRAMMAR_TYPECHECK_SCRIPT, grammarPackages } from '../grammars.ts';
import { expectWithinTypecheckCeiling, typeCheckErrorLines } from './helpers/typecheck-ceiling.ts';

const SUPPRESSION = /@ts-(nocheck|ignore|expect-error)\b/;

const nonErasable = (errorLines: readonly string[]): string[] => errorLines.filter((line) => line.includes('error TS1294:'));

describe('grammar type-check ratchet', () => {
	for (const pkg of grammarPackages()) {
		it(`${pkg.name}: no non-erasable syntax, type errors within ${GRAMMAR_TYPECHECK_CEILING}`, () => {
			expect(readFileSync(join(pkg.dir, GRAMMAR_ENTRY), 'utf8')).not.toMatch(SUPPRESSION);
			const ceilingPath = join(pkg.dir, GRAMMAR_TYPECHECK_CEILING);
			expect(existsSync(ceilingPath), ceilingPath).toBe(true);
			const errorLines = typeCheckErrorLines(['run', GRAMMAR_TYPECHECK_SCRIPT], pkg.dir);
			expect(nonErasable(errorLines)).toEqual([]);
			expectWithinTypecheckCeiling(errorLines, ceilingPath);
		}, 120_000);
	}

	for (const [fixture, site] of [
		['non-erasable-grammar', 'kind.ts'],
		['non-erasable-entry', GRAMMAR_ENTRY]
	] as const) {
		it(`refuses an enum in ${site}, reached from a grammar entry`, () => {
			const errorLines = typeCheckErrorLines(['exec', 'tsc', '-p', GRAMMAR_TSCONFIG], join(import.meta.dirname, 'fixtures', fixture));
			expect(nonErasable(errorLines).map((line) => line.split('(')[0])).toEqual([site]);
		}, 120_000);
	}
});
