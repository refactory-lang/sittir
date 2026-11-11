import { describe, expect, it } from 'vitest';
import { loadLanguageForGrammar, treeParser } from '../src/validate/common.ts';

async function parse(source: string): Promise<string> {
	using parser = treeParser(await loadLanguageForGrammar('typescript'));
	using tree = parser.parse(source);
	return tree.root.toString();
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

	it('parses `for (let [a] of b)` with a pattern', async () => {
		expect(await parse('for (let [a] of b) {}')).toContain('(for_header_let_const_kind left: (array_pattern');
	});

	it('matches upstream tree-sitter-typescript on `for await (let [a] of b)`, which is a subscript there (parity, not ECMAScript correctness)', async () => {
		const awaited = await parse('for await (let [a] of b) {}');
		expect(awaited).toContain('left: (lhs_expression (subscript_expression');
		expect(awaited).not.toContain('array_pattern');
	});
});
