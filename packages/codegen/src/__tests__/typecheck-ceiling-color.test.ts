import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GRAMMAR_TSCONFIG } from '../grammars.ts';
import { typeCheckErrorLines } from './helpers/typecheck-ceiling.ts';

describe('the type-check ceiling helper reads tsc errors whatever the terminal asks for', () => {
	let forceColor: string | undefined;
	beforeEach(() => {
		forceColor = process.env.FORCE_COLOR;
		process.env.FORCE_COLOR = '3';
	});
	afterEach(() => {
		if (forceColor === undefined) delete process.env.FORCE_COLOR;
		else process.env.FORCE_COLOR = forceColor;
	});

	it('finds the error lines under FORCE_COLOR=3', () => {
		const errorLines = typeCheckErrorLines(['exec', 'tsc', '-p', GRAMMAR_TSCONFIG], join(import.meta.dirname, 'fixtures', 'non-erasable-grammar'));
		expect(errorLines.map((line) => line.split('(')[0])).toEqual(['kind.ts']);
		expect(errorLines.every((line) => !line.includes('\u001b['))).toBe(true);
	}, 120_000);
});
