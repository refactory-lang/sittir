import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Query } from 'web-tree-sitter';
import { bindingPatterns } from '@sittir/codegen/bindings';
import { deriveVocabulary } from '../../src/inventory/index.ts';
import { loadLanguageForGrammar } from '../../src/validate/common.ts';

const forms = [
	{
		grammar: 'typescript',
		owner: 'interface_declaration',
		path: 'declaration.interface',
		clause: 'clause.extends.type',
		cases: [
			['interface A {}', []],
			['interface A extends B {}', ['B']],
			['interface A extends B<T>, N.C {}', ['B<T>', 'N.C']]
		]
	},
	{
		grammar: 'rust',
		owner: 'trait_item',
		path: 'declaration.interface.trait',
		clause: 'clause.bounds',
		cases: [
			['trait A {}', []],
			['trait A: B {}', ['B']],
			["trait A: B<T> + N::C + 'a {}", ['B<T>', 'N::C', "'a"]],
			['trait A: B + C { fn f() {} fn g() {} }', ['B', 'C']],
			["trait A: for<'a> B<'a> {}", ["for<'a> B<'a>"]]
		]
	}
] as const;

for (const form of forms) {
	describe(`${form.grammar}: interface extends`, () => {
		it('derives an optional array of parent types or bounds directly on the node', async () => {
			const d = await deriveVocabulary([form.grammar]);
			const member = d.members.get(form.path)?.get('extends');
			expect(member).toBeDefined();
			expect(member?.multiple).toBe(true);
			expect(member?.scalar).toBe(false);
			expect(member?.optional).toBe(true);
			expect(member?.kinds.has('identifier.type')).toBe(true);
			expect(member?.kinds.has(form.clause)).toBe(false);
		});

		for (const [source, expected] of form.cases) {
			it(`captures the extends elements in ${source}`, async () => {
				const text = readFileSync(new URL(`../../../${form.grammar}/bindings.scm`, import.meta.url), 'utf8');
				const patterns = (await bindingPatterns(text)).filter(
					(p) => p.source.includes('@extends') && p.references.some((r) => r.kind === 'node' && r.name === form.owner)
				);
				expect(patterns).toHaveLength(1);
				const { Parser, lang } = await loadLanguageForGrammar(form.grammar);
				const parser = new Parser();
				parser.setLanguage(lang);
				const tree = parser.parse(source);
				if (tree === null) throw new Error(`cannot parse ${source}`);
				const query = new Query(lang, patterns[0]!.source);
				try {
					expect(tree.rootNode.hasError).toBe(false);
					expect(
						query
							.captures(tree.rootNode)
							.filter((c) => c.name === 'extends')
							.map((c) => c.node.text)
					).toEqual(expected);
				} finally {
					query.delete();
					tree.delete();
					parser.delete();
				}
			});
		}
	});
}
