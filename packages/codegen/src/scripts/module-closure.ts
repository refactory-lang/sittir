import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { REPO_ROOT, allGrammars, grammarPackageDir } from '../grammars.ts';

const STATIC_MODULE_REFERENCE = /(?:^|[\n;])\s*(?:import|export)\s+(?!type[\s{])(?:[^'"`;]*?\sfrom\s*)?['"]([^'"\n]+)['"]/g;

const DYNAMIC_MODULE_REFERENCE = /(?<!typeof\s+)\bimport\(\s*(['"])([^'"\n]+)\1\s*\)(?!\.(?!then\b))/g;

const WORKSPACE_DIR = 'packages';

type PackageExport = string | { readonly source?: string; readonly import?: string; readonly default?: string } | undefined;

interface WorkspacePackage {
	readonly dir: string;
	readonly exports: Readonly<Record<string, PackageExport>>;
}

export function runtimeSpecifiers(source: string): string[] {
	return [...[...source.matchAll(STATIC_MODULE_REFERENCE)].map((match) => match[1]!), ...[...source.matchAll(DYNAMIC_MODULE_REFERENCE)].map((match) => match[2]!)];
}

function workspacePackages(root: string): Map<string, WorkspacePackage> {
	const generated = new Set(allGrammars().map((grammar) => relative(REPO_ROOT, grammarPackageDir(grammar))));
	const packages = new Map<string, WorkspacePackage>();
	const workspace = join(root, WORKSPACE_DIR);
	if (!existsSync(workspace)) return packages;
	for (const name of readdirSync(workspace).sort()) {
		const dir = `${WORKSPACE_DIR}/${name}`;
		const manifest = join(root, dir, 'package.json');
		if (generated.has(dir) || !existsSync(manifest)) continue;
		const json = JSON.parse(readFileSync(manifest, 'utf8')) as { name?: string; exports?: Record<string, PackageExport> };
		if (json.name !== undefined) packages.set(json.name, { dir, exports: json.exports ?? {} });
	}
	return packages;
}

function packageEntry(packages: ReadonlyMap<string, WorkspacePackage>, specifier: string): string | undefined {
	for (const [name, pkg] of packages) {
		if (specifier !== name && !specifier.startsWith(`${name}/`)) continue;
		const target = pkg.exports[specifier === name ? '.' : `.${specifier.slice(name.length)}`];
		const path = typeof target === 'string' ? target : (target?.source ?? target?.import ?? target?.default);
		if (path === undefined) return undefined;
		return `${pkg.dir}/${path.replace(/^\.\//, '').replace(/^dist\//, 'src/').replace(/\.js$/, '.ts')}`;
	}
	return undefined;
}

export function moduleClosure(root: string, entries: readonly string[]): string[] {
	const packages = workspacePackages(root);
	const seen = new Set<string>();
	const pending: string[] = [];
	const visit = (rel: string | undefined): void => {
		if (rel === undefined || seen.has(rel) || !existsSync(join(root, rel))) return;
		seen.add(rel);
		pending.push(rel);
	};
	for (const entry of entries) visit(entry);
	while (pending.length > 0) {
		const rel = pending.shift()!;
		for (const specifier of runtimeSpecifiers(readFileSync(join(root, rel), 'utf8'))) {
			visit(specifier.startsWith('.') ? normalize(join(dirname(rel), specifier)) : packageEntry(packages, specifier));
		}
	}
	return [...seen].sort();
}
