import { join } from 'node:path';
import { GRAMMAR_ENTRY, grammarPackageDir, grammarRequire, upstreamPackage } from '../grammars.ts';

const GRAMMAR_JS_SUBPATHS: Record<string, string> = {
	typescript: 'typescript/grammar.js'
};

export function resolveGrammarJsPath(grammar: string): string {
	return grammarRequire(grammar).resolve(`${upstreamPackage(grammar)}/${GRAMMAR_JS_SUBPATHS[grammar] ?? 'grammar.js'}`);
}

export function resolveOverridesPath(grammar: string): string {
	return join(grammarPackageDir(grammar), GRAMMAR_ENTRY);
}
