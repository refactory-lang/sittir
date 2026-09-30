import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, '../../__tests__/fixtures', name);

describe('extension-point dedupe (Phase 6)', () => {
	it('collapses duplicate externals entries to a single occurrence', async () => {
		const raw = await evaluate(fixture('extension-dedup-grammar.js'), NO_FILE_TYPES);
		// Source listed `_indent` twice and `_dedent` once. After
		// appendDedup, externals should have each exactly once.
		const indentCount = ruleListParts(raw.externals).names.filter((e) => e === '_indent').length;
		const dedentCount = ruleListParts(raw.externals).names.filter((e) => e === '_dedent').length;
		expect(indentCount).toBe(1);
		expect(dedentCount).toBe(1);
	});

	it('collapses duplicate extras entries to a single occurrence', async () => {
		const raw = await evaluate(fixture('extension-dedup-grammar.js'), NO_FILE_TYPES);
		// Source listed /\s/ twice. The pattern's source string is `\\s`.
		const whitespaceCount = ruleListParts(raw.extras).patterns.filter((e) => e === '\\s').length;
		expect(whitespaceCount).toBe(1);
	});
});
