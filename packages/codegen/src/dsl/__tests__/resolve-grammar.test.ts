import { describe, expect, it } from 'vitest';
import { grammarPackage, topLayerPath } from '../../grammars.ts';
import { packageGrammarJsPath, packageSourceEntry } from '../resolve-grammar.ts';

describe('the entry a grammar package is evaluated from', () => {
	it('takes the top layer unless the base is asked for', () => {
		const pkg = grammarPackage('rust');
		expect(packageSourceEntry(pkg)).toBe(topLayerPath(pkg));
		expect(packageSourceEntry(pkg, { base: true })).toBe(packageGrammarJsPath(pkg));
	});
});
