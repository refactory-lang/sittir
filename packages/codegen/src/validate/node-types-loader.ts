import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { grammarPackageDir, grammarRequire, upstreamPackage } from '../grammars.ts';


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

export function loadRawEntries(grammar: string, explicitPath?: string): RawNodeEntry[] {
	if (explicitPath) return loadJson(explicitPath);

	const overridePath = join(grammarPackageDir(grammar), '.sittir', 'src', 'node-types.json');
	if (existsSync(overridePath)) return loadJson(overridePath);

	return loadJson(
		grammarRequire(grammar).resolve(`${upstreamPackage(grammar)}/${NODE_TYPES_SUBPATHS[grammar] ?? 'src/node-types.json'}`)
	);
}
