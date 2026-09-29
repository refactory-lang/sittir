import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { packageRequire, upstreamPackage, type GrammarPackage } from '../grammars.ts';

export const NO_FILE_TYPES: readonly string[] = Object.freeze([]);

interface UpstreamGrammarEntry {
	readonly name?: unknown;
	readonly 'file-types'?: unknown;
}

export function upstreamFileTypes(pkg: GrammarPackage): readonly string[] {
	const packageDir = dirname(packageRequire(pkg).resolve(`${upstreamPackage(pkg.name)}/package.json`));
	const configPath = join(packageDir, 'tree-sitter.json');
	if (!existsSync(configPath)) {
		throw new Error(`upstreamFileTypes: ${upstreamPackage(pkg.name)} has no tree-sitter.json at ${configPath}`);
	}
	const config = JSON.parse(readFileSync(configPath, 'utf8')) as { grammars?: readonly UpstreamGrammarEntry[] };
	const entries = config.grammars ?? [];
	const entry = entries.length === 1 ? entries[0] : entries.find((candidate) => candidate.name === pkg.name);
	if (entry === undefined) {
		throw new Error(
			`upstreamFileTypes: ${configPath} declares ${entries.length} grammars and none is named "${pkg.name}"`
		);
	}
	const declared = entry['file-types'];
	if (declared === undefined || declared === null) return [];
	if (!Array.isArray(declared) || declared.some((type) => typeof type !== 'string')) {
		throw new Error(`upstreamFileTypes: the file-types of "${pkg.name}" in ${configPath} are not a list of strings`);
	}
	return declared as readonly string[];
}
