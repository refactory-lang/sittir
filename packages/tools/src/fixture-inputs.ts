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

export async function fixtureInputs(root: string, grammar: string): Promise<Record<string, string>> {
	const [{ moduleClosure }, paths] = await Promise.all([load('moduleClosure'), load('renderModulePaths')]);
	const extractor = moduleClosure(root, [EXTRACTOR, ...codegenModuleFiles().map((file) => relative(REPO_ROOT, file))]);
	const outputs = [paths.renderModuleFixturesPath(grammar), paths.renderModuleLeftOutPath(grammar)];
	const files = [...new Set([...corpusFiles(root, grammar), ...extractor, ...outputs, LOCKFILE])].filter((rel) => existsSync(join(root, rel))).sort();
	return Object.fromEntries(files.map((rel) => [rel, createHash('sha256').update(readFileSync(join(root, rel))).digest('hex')]));
}
