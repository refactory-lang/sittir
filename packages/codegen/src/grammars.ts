import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type GrammarName = string;

export interface GrammarPackage {
	readonly name: GrammarName;
	readonly dir: string;
	readonly stable: boolean;
}

export const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');
export const PACKAGES_DIR = join(REPO_ROOT, 'packages');
export const GRAMMAR_ENTRY = 'grammar.sittir.ts';

let discovered: readonly GrammarPackage[] | undefined;

export function grammarPackages(): readonly GrammarPackage[] {
	discovered ??= readdirSync(PACKAGES_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(PACKAGES_DIR, entry.name, GRAMMAR_ENTRY)))
		.map((entry) => {
			const dir = join(PACKAGES_DIR, entry.name);
			const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
				sittir?: { stable?: boolean };
			};
			return { name: entry.name, dir, stable: manifest.sittir?.stable === true };
		})
		.sort((a, b) => a.name.localeCompare(b.name));
	return discovered;
}

export function allGrammars(): readonly GrammarName[] {
	return grammarPackages().map((g) => g.name);
}

export function stableGrammars(): readonly GrammarName[] {
	return grammarPackages()
		.filter((g) => g.stable)
		.map((g) => g.name);
}

export function isGrammar(name: string): boolean {
	return grammarPackages().some((g) => g.name === name);
}

export function isStableGrammar(name: string): boolean {
	return grammarPackages().some((g) => g.name === name && g.stable);
}

export function assertGrammar(name: string): GrammarName {
	if (!isGrammar(name)) {
		throw new Error(`unknown grammar '${name}' — known: ${allGrammars().join(', ')}`);
	}
	return name;
}

export function grammarPackageDir(name: GrammarName): string {
	return join(PACKAGES_DIR, name);
}

export function grammarDisplayName(name: GrammarName): string {
	return name
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

export function upstreamPackage(name: GrammarName): string {
	return `tree-sitter-${name}`;
}

export function grammarRequire(name: GrammarName): NodeJS.Require {
	return createRequire(join(grammarPackageDir(name), 'package.json'));
}

export function nativeCrateRelDir(name: GrammarName): string {
	return `rust/crates/sittir-${name}`;
}

export function nativeCrateDir(name: GrammarName): string {
	return join(REPO_ROOT, nativeCrateRelDir(name));
}

interface ExportTarget {
	readonly import?: string;
}

export function sourceAliases(): { find: string; replacement: string }[] {
	const aliases: { find: string; replacement: string }[] = [];
	for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const dir = join(PACKAGES_DIR, entry.name);
		const manifestPath = join(dir, 'package.json');
		if (!existsSync(manifestPath)) continue;
		const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
			name?: string;
			exports?: Record<string, ExportTarget>;
		};
		if (!manifest.name || !manifest.exports) continue;
		for (const [subpath, target] of Object.entries(manifest.exports)) {
			if (!target.import) continue;
			const source = target.import.replace(/^\.\/dist\//, 'src/').replace(/\.js$/, '.ts');
			if (!existsSync(join(dir, source))) continue;
			aliases.push({
				find: subpath === '.' ? manifest.name : `${manifest.name}/${subpath.replace(/^\.\//, '')}`,
				replacement: join(dir, source)
			});
		}
	}
	return aliases.sort((a, b) => b.find.length - a.find.length);
}
