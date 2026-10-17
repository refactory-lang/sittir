import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { codegenModuleFiles, load } from './codegen-surface.ts';
import { CORPUS_ROOT } from './corpus/layout.ts';

const EXTRACTOR = relative(REPO_ROOT, fileURLToPath(new URL('./post-generate.ts', import.meta.url)));
const LOCKFILE = 'pnpm-lock.yaml';

function corpusFiles(root: string, grammar: string): string[] {
	const dir = join(relative(REPO_ROOT, CORPUS_ROOT), grammar);
	if (!existsSync(join(root, dir))) return [];
	return readdirSync(join(root, dir), { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name !== '.DS_Store')
		.map((entry) => relative(root, join(entry.parentPath, entry.name)));
}

function contentHashes(root: string, files: readonly string[]): Record<string, string> {
	const present = [...new Set(files)].filter((rel) => existsSync(join(root, rel))).sort();
	return Object.fromEntries(present.map((rel) => [rel, createHash('sha256').update(readFileSync(join(root, rel))).digest('hex')]));
}

export async function fixtureSources(root: string, grammar: string): Promise<Record<string, string>> {
	const { moduleClosure } = await load('moduleClosure');
	const extractor = moduleClosure(root, [EXTRACTOR, ...codegenModuleFiles().map((file) => relative(REPO_ROOT, file))]);
	return contentHashes(root, [...corpusFiles(root, grammar), ...extractor, LOCKFILE]);
}

export async function fixtureOutputs(root: string, grammar: string): Promise<Record<string, string>> {
	const paths = await load('renderModulePaths');
	return contentHashes(root, [paths.renderModuleFixturesPath(grammar), paths.renderModuleLeftOutPath(grammar)]);
}

export async function fixtureInputs(root: string, grammar: string): Promise<Record<string, string>> {
	const [sources, outputs] = await Promise.all([fixtureSources(root, grammar), fixtureOutputs(root, grammar)]);
	return { ...sources, ...outputs };
}
