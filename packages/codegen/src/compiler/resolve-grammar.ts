import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const GRAMMAR_JS_PATHS: Record<string, string> = {
	typescript: 'tree-sitter-typescript/typescript/grammar.js',
	tsx: 'tree-sitter-typescript/tsx/grammar.js'
};

export function resolveGrammarJsPath(grammar: string): string {
	const wellKnown = GRAMMAR_JS_PATHS[grammar];
	if (wellKnown) {
		return require.resolve(wellKnown);
	}
	return require.resolve(`tree-sitter-${grammar}/grammar.js`);
}

export function resolveOverridesPath(grammar: string): string {
	const compilerDir = dirname(new URL(import.meta.url).pathname);
	const srcDir = dirname(compilerDir);
	const codegenDir = dirname(srcDir);
	const packagesDir = dirname(codegenDir);
	return join(packagesDir, grammar, 'grammar.sittir.ts');
}
