import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { packageEntryPath, packageGrammarJsPath, packageSourceEntry } from '../resolve-grammar.ts';

describe('the entry a grammar package is evaluated from', () => {
	it('takes the overrides entry unless the base is asked for', () => {
		const pkg = grammarPackage('rust');
		expect(packageSourceEntry(pkg)).toBe(packageEntryPath(pkg));
		expect(packageSourceEntry(pkg, { base: true })).toBe(packageGrammarJsPath(pkg));
	});
});
