import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_TSCONFIG, GRAMMAR_TYPECHECK_CEILING, GRAMMAR_TYPECHECK_SCRIPT, grammarPackages } from '../grammars.ts';
import { expectWithinTypecheckCeiling, typeCheckErrorLines } from './helpers/typecheck-ceiling.ts';

const nonErasable = (errorLines: readonly string[]): string[] => errorLines.filter((line) => line.includes('error TS1294:'));

describe('grammar type-check ratchet', () => {
	for (const pkg of grammarPackages()) {
		it(`${pkg.name}: no non-erasable syntax, type errors within ${GRAMMAR_TYPECHECK_CEILING}`, () => {
			const ceilingPath = join(pkg.dir, GRAMMAR_TYPECHECK_CEILING);
			expect(existsSync(ceilingPath), ceilingPath).toBe(true);
			const errorLines = typeCheckErrorLines(['run', GRAMMAR_TYPECHECK_SCRIPT], pkg.dir);
			expect(nonErasable(errorLines)).toEqual([]);
			expectWithinTypecheckCeiling(errorLines, ceilingPath);
		}, 120_000);
	}

	it('refuses an enum reachable from a grammar entry', () => {
		const fixture = join(import.meta.dirname, 'fixtures', 'non-erasable-grammar');
		expect(nonErasable(typeCheckErrorLines(['exec', 'tsc', '-p', GRAMMAR_TSCONFIG], fixture))).toHaveLength(1);
	}, 120_000);
});
