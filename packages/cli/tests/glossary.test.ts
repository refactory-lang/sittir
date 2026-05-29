import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildProgram } from '../src/cli.ts';
import { allCommandNames } from '../src/glossary.ts';

describe('cli glossary', () => {
	it('documents every registered command', () => {
		const doc = readFileSync(new URL('../../../docs/cli-command-glossary.md', import.meta.url), 'utf8');
		const missing = allCommandNames(buildProgram()).filter((name) => {
			// match the command's leaf name in the doc
			const leaf = name.split(' ').pop()!;
			return !doc.includes(leaf);
		});
		expect(missing).toEqual([]);
	});
});
