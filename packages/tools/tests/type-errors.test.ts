import { describe, it, expect } from 'vitest';

import { summarizeTypeErrors } from '../src/scripts/type-errors.ts';

const LOG = [
	'packages/tools/src/a.ts(3,7): error TS2322: Type string is not assignable to number.',
	'packages/tools/src/b.ts(9,1): error TS2304: Cannot find name x.',
	'  detail line under the second error',
	'packages/cli/src/c.ts(1,1): error TS2307: Cannot find module y.',
	''
].join('\n');

const SHARED = "Cannot find module 'x' or its corresponding type declarations.";

const REPEATED = [
	`packages/c type-check: src/api.ts(14,36): error TS2307: ${SHARED}`,
	`packages/cli type-check: ../c/src/api.ts(14,36): error TS2307: ${SHARED}`,
	`packages/tools type-check: ../c/src/api.ts(14,36): error TS2307: ${SHARED}`,
	''
].join('\n');

describe('summarizeTypeErrors', () => {
	it('counts three hand-counted errors as two in tools and one in cli, with no repeats', () => {
		expect(summarizeTypeErrors(LOG)).toEqual({
			records: 3,
			errors: 3,
			repeats: 0,
			packages: [
				{ package: 'tools', errors: 2, projects: 1 },
				{ package: 'cli', errors: 1, projects: 1 }
			]
		});
	});

	it('counts the same error reported by three projects once, in the package that holds its file', () => {
		expect(summarizeTypeErrors(REPEATED)).toEqual({
			records: 3,
			errors: 1,
			repeats: 2,
			packages: [{ package: 'c', errors: 1, projects: 3 }]
		});
	});

	it('keeps two errors in one file apart when they are at different lines', () => {
		const twoLines = [
			`packages/c type-check: src/api.ts(14,36): error TS2307: ${SHARED}`,
			`packages/c type-check: src/api.ts(15,36): error TS2307: ${SHARED}`,
			''
		].join('\n');
		expect(summarizeTypeErrors(twoLines)).toEqual({
			records: 2,
			errors: 2,
			repeats: 0,
			packages: [{ package: 'c', errors: 2, projects: 1 }]
		});
	});

	it('groups an error with no file under (root)', () => {
		expect(summarizeTypeErrors('error TS5023: Unknown compiler option x.\n')).toEqual({
			records: 1,
			errors: 1,
			repeats: 0,
			packages: [{ package: '(root)', errors: 1, projects: 1 }]
		});
	});

	it('refuses a log with an error record that does not parse, rather than undercounting', () => {
		const malformed = `${LOG}weird error TS9999: this line has a prefix the parser does not read.\n`;
		expect(() => summarizeTypeErrors(malformed)).toThrow(/error TS records but 3 parse as diagnostics/);
	});

	it('reports zero errors for a clean log', () => {
		expect(summarizeTypeErrors('')).toEqual({ records: 0, errors: 0, repeats: 0, packages: [] });
	});
});
