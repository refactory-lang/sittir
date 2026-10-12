import { readFileSync } from 'node:fs';
import { loadLanguageForGrammar } from '../validate/common.ts';
import { astStructuralDiff } from '../validate/read-render-parse.ts';

export interface AstDiffOptions {
	grammar: string;
	a: string;
	b: string;
}

export async function run(opts: AstDiffOptions): Promise<number> {
	const { Parser, lang } = await loadLanguageForGrammar(opts.grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const root = (path: string) => {
		const tree = parser.parse(readFileSync(path, 'utf8'));
		if (tree === null) throw new Error(`${path}: tree-sitter returned no tree`);
		return tree.rootNode;
	};
	const diff = astStructuralDiff(root(opts.a), root(opts.b));
	console.log(diff === null ? 'AST identical' : `AST differs: ${diff}`);
	return diff === null ? 0 : 1;
}
