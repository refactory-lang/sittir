import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { CONFLICT_RESOLUTIONS_FILE, EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../dsl/conflict-resolutions.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';

export function conflictResolutionsPath(pkg: Pick<GrammarPackage, 'dir'>): string {
	return join(sittirDirOf(pkg), CONFLICT_RESOLUTIONS_FILE);
}

export function writeConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>, file: ConflictResolutionsFile): void {
	const path = conflictResolutionsPath(pkg);
	const content = `${JSON.stringify(file, null, '\t')}\n`;
	if (existsSync(path) && readFileSync(path, 'utf8') === content) return;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
}

export function ensureConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>): void {
	if (!existsSync(conflictResolutionsPath(pkg))) writeConflictResolutions(pkg, EMPTY_CONFLICT_RESOLUTIONS);
}

export function readConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>): ConflictResolutionsFile {
	ensureConflictResolutions(pkg);
	return JSON.parse(readFileSync(conflictResolutionsPath(pkg), 'utf8')) as ConflictResolutionsFile;
}
