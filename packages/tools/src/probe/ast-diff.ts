import { readFileSync } from 'node:fs';
import { loadLanguageForGrammar, treeParser } from '../validate/common.ts';
import { astStructuralDiff } from '../validate/read-render-parse.ts';

export interface AstDiffOptions {
	grammar: string;
	a: string;
	b: string;
}

export async function run(opts: AstDiffOptions): Promise<number> {
	using parser = treeParser(await loadLanguageForGrammar(opts.grammar));
	using a = parser.parse(readFileSync(opts.a, 'utf8'));
	using b = parser.parse(readFileSync(opts.b, 'utf8'));
	const diff = astStructuralDiff(a.root, b.root);
	console.log(diff === null ? 'AST identical' : `AST differs: ${diff}`);
	return diff === null ? 0 : 1;
}
