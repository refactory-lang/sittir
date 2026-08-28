import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packagesDir = fileURLToPath(new URL('../../../', import.meta.url));

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

const GRAMMAR_PATHS: Readonly<Record<string, string>> = {
	typescript: 'tree-sitter-typescript/typescript/src/node-types.json',
	tsx: 'tree-sitter-typescript/tsx/src/node-types.json'
};

export function loadRawEntries(grammar: string, explicitPath?: string): RawNodeEntry[] {
	if (explicitPath) return loadJson(explicitPath);

	const overridePath = join(packagesDir, grammar, '.sittir', 'src', 'node-types.json');
	if (existsSync(overridePath)) return loadJson(overridePath);

	const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`;
	return loadJson(fileURLToPath(import.meta.resolve(modulePath)));
}
