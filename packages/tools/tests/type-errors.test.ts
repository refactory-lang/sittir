import { describe, it, expect } from 'vitest';

import { summarizeTypeErrors } from '../src/scripts/type-errors.ts';

const LOG = [
	'packages/tools/src/a.ts(3,7): error TS2322: Type string is not assignable to number.',
	'packages/tools/src/b.ts(9,1): error TS2304: Cannot find name x.',
	'  detail line under the second error',
	'packages/cli/src/c.ts(1,1): error TS2307: Cannot find module y.',
	''
].join('\n');

describe('summarizeTypeErrors', () => {
	it('counts three hand-counted errors as two in tools and one in cli, totalling three', () => {
		const summary = summarizeTypeErrors(LOG);
		expect(summary.errors).toBe(3);
		expect(summary.packages).toEqual([
			{ package: 'tools', errors: 2 },
			{ package: 'cli', errors: 1 }
		]);
	});

	it('groups an error with no file under (root)', () => {
		const summary = summarizeTypeErrors('error TS5023: Unknown compiler option x.\n');
		expect(summary.packages).toEqual([{ package: '(root)', errors: 1 }]);
		expect(summary.errors).toBe(1);
	});

	it('refuses a log with an error record that does not parse, rather than undercounting', () => {
		const malformed = `${LOG}weird error TS9999: this line has a prefix the parser does not read.\n`;
		expect(() => summarizeTypeErrors(malformed)).toThrow(/error TS records but 3 parse as diagnostics/);
	});

	it('reports zero errors for a clean log', () => {
		expect(summarizeTypeErrors('')).toEqual({ errors: 0, packages: [] });
	});
});
