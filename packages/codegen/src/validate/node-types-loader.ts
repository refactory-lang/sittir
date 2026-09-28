import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { grammarPackage, packageRequire, sittirDirOf, upstreamPackage, type GrammarPackage } from '../grammars.ts';


function loadJson(filePath: string): RawNodeEntry[] {
	return JSON.parse(readFileSync(filePath, 'utf8')) as RawNodeEntry[];
}

export interface RawFieldEntry {
	required: boolean;
	multiple: boolean;
	types: Array<{ type: string; named: boolean }>;
}

export interface RawNodeEntry {
	type: string;
	named: boolean;
	fields?: Record<string, RawFieldEntry>;
	children?: RawFieldEntry;
	subtypes?: Array<{ type: string; named: boolean }>;
}

const NODE_TYPES_SUBPATHS: Readonly<Record<string, string>> = {
	typescript: 'typescript/src/node-types.json'
};

export function loadPackageNodeTypes(pkg: GrammarPackage): RawNodeEntry[] {
	const overridePath = join(sittirDirOf(pkg), 'src', 'node-types.json');
	if (existsSync(overridePath)) return loadJson(overridePath);

	return loadJson(
		packageRequire(pkg).resolve(`${upstreamPackage(pkg.name)}/${NODE_TYPES_SUBPATHS[pkg.name] ?? 'src/node-types.json'}`)
	);
}

export function loadRawEntries(grammar: string, explicitPath?: string): RawNodeEntry[] {
	return explicitPath ? loadJson(explicitPath) : loadPackageNodeTypes(grammarPackage(grammar));
}
