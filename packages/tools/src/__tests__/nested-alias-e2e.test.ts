import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { loadLanguageForGrammar, treeParser } from '../validate/common.ts';

const wasmPath = join(__dirname, '../../../python/.sittir/parser.wasm');

describe('flattened polymorph — python assignment e2e', () => {
	for (const [source, variant] of [
		['x = 1', 'assignment_eq'],
		['x: int', 'assignment_type'],
		['x: int = 1', 'assignment_typed']
	] as const) {
		it.skipIf(!existsSync(wasmPath))(`\`${source}\` parses to the ${variant} node itself`, async () => {
			using parser = treeParser(await loadLanguageForGrammar('python'));
			using tree = parser.parse(source);
			expect(tree.root.descendantsOfType(variant)).toHaveLength(1);
			expect(tree.root.descendantsOfType('assignment')).toHaveLength(0);
		});
	}

	it.skipIf(!existsSync(wasmPath))('assignment is a supertype over its variants, so queries on it still match', async () => {
		const { language } = await loadLanguageForGrammar('python');
		const id = language.idForNodeType('assignment', true);
		if (id === null) throw new Error('expected an `assignment` kind id');
		const subtypes = language.subtypes(id).map((s) => language.nodeTypeForId(s)).sort();
		expect(subtypes).toEqual(['assignment_eq', 'assignment_type', 'assignment_typed']);
	});
});
