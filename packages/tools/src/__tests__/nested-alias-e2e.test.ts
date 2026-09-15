import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { loadLanguageForGrammar } from '../validate/common.ts';

const wasmPath = join(__dirname, '../../../python/.sittir/parser.wasm');

async function parsePython(source: string) {
	const { Parser, lang } = await loadLanguageForGrammar('python');
	const parser = new Parser();
	parser.setLanguage(lang as any);
	return { lang: lang as any, tree: (parser as any).parse(source) };
}

describe('flattened polymorph — python assignment e2e', () => {
	for (const [source, variant] of [
		['x = 1', 'assignment_eq'],
		['x: int', 'assignment_type'],
		['x: int = 1', 'assignment_typed']
	] as const) {
		it.skipIf(!existsSync(wasmPath))(`\`${source}\` parses to the ${variant} node itself`, async () => {
			const { tree } = await parsePython(source);
			expect(tree.rootNode.descendantsOfType(variant)).toHaveLength(1);
			expect(tree.rootNode.descendantsOfType('assignment')).toHaveLength(0);
		});
	}

	it.skipIf(!existsSync(wasmPath))('assignment is a supertype over its variants, so queries on it still match', async () => {
		const { lang } = await parsePython('');
		const id = lang.idForNodeType('assignment', true);
		const subtypes = (lang.subtypes(id) as number[]).map((s) => lang.nodeTypeForId(s)).sort();
		expect(subtypes).toEqual(['assignment_eq', 'assignment_type', 'assignment_typed']);
	});
});
