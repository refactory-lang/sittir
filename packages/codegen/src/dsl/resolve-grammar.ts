import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GRAMMAR_ENTRY, grammarPackage, packageRequire, upstreamPackage, type GrammarPackage } from '../grammars.ts';

const GRAMMAR_JS_SUBPATHS: Record<string, string> = {
	typescript: 'typescript/grammar.js'
};

export function packageGrammarJsPath(pkg: GrammarPackage): string {
	return packageRequire(pkg).resolve(`${upstreamPackage(pkg.name)}/${GRAMMAR_JS_SUBPATHS[pkg.name] ?? 'grammar.js'}`);
}

export function packageEntryPath(pkg: Pick<GrammarPackage, 'dir'>): string {
	return join(pkg.dir, GRAMMAR_ENTRY);
}

export interface PackageSourceOptions {
	readonly base?: boolean;
}

export function packageSourceEntry(pkg: GrammarPackage, { base = false }: PackageSourceOptions = {}): string {
	const overridesPath = packageEntryPath(pkg);
	return !base && existsSync(overridesPath) ? overridesPath : packageGrammarJsPath(pkg);
}

export function resolveGrammarJsPath(grammar: string): string {
	return packageGrammarJsPath(grammarPackage(grammar));
}

export function resolveOverridesPath(grammar: string): string {
	return packageEntryPath(grammarPackage(grammar));
}
