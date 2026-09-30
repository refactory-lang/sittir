import { describe, expect, it } from 'vitest';
import { loadLanguageForGrammar } from '../src/validate/common.ts';

async function parse(source: string): Promise<string> {
	const { lang } = await loadLanguageForGrammar('typescript');
	const { Parser } = await import('web-tree-sitter');
	const parser = new Parser();
	parser.setLanguage(lang);
	return parser.parse(source)!.rootNode.toString();
}

describe('typescript keeps `let` an identifier only where a declaration cannot start', () => {
	it('parses `let [p] = [1];` as a lexical declaration with an array pattern', async () => {
		const tree = await parse('let [p] = [1];');
		expect(tree).toContain('(lexical_declaration');
		expect(tree).toContain('name: (array_pattern');
		expect(tree).not.toContain('subscript_expression');
	});

	it('still parses `let` as an identifier in expression positions', async () => {
		const tree = await parse('let = 1; let.a;');
		expect(tree).not.toContain('lexical_declaration');
		expect(tree).toContain('(assignment_expression left: (lhs_expression (identifier))');
		expect(tree).toContain('(member_expression object: (identifier)');
	});

	it('parses `for (let [a] of b)` with a pattern, and `for await (let [a] of b)` as upstream does', async () => {
		expect(await parse('for (let [a] of b) {}')).toContain('(for_header_let_const_kind left: (array_pattern');
		const awaited = await parse('for await (let [a] of b) {}');
		expect(awaited).toContain('left: (lhs_expression (subscript_expression');
		expect(awaited).not.toContain('array_pattern');
	});
});
