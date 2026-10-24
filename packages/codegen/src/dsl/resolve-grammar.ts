import { existsSync } from 'node:fs';
import { grammarPackage, layerPath, packageRequire, upstreamPackage, type GrammarPackage } from '../grammars.ts';

const GRAMMAR_JS_SUBPATHS: Record<string, string> = {
	typescript: 'typescript/grammar.js'
};

export function packageGrammarJsPath(pkg: GrammarPackage): string {
	return packageRequire(pkg).resolve(`${upstreamPackage(pkg.name)}/${GRAMMAR_JS_SUBPATHS[pkg.name] ?? 'grammar.js'}`);
}

export interface PackageSourceOptions {
	readonly base?: boolean;
	readonly unbound?: boolean;
}

export function packageSourceEntry(pkg: GrammarPackage, { base = false, unbound = false }: PackageSourceOptions = {}): string {
	const entry = layerPath(pkg, unbound ? 'sittir' : 'top');
	return !base && existsSync(entry) ? entry : packageGrammarJsPath(pkg);
}

export function resolveGrammarJsPath(grammar: string): string {
	return packageGrammarJsPath(grammarPackage(grammar));
}
