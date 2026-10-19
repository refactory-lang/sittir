import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { CONFLICT_RESOLUTIONS_FILE, EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile, type ResolutionSection } from '../dsl/conflict-resolutions.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import { printRecordLines } from '../emitters/record-lines.ts';
import { compareOrdinal } from '../emitters/shared.ts';

export function conflictResolutionsPath(pkg: Pick<GrammarPackage, 'dir'>): string {
	return join(sittirDirOf(pkg), CONFLICT_RESOLUTIONS_FILE);
}

export function writeConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>, file: ConflictResolutionsFile): void {
	const path = conflictResolutionsPath(pkg);
	const content = printRecordLines({ ...file, resolutions: sortedBySymbols(file.resolutions), bound: { ...file.bound, resolutions: sortedBySymbols(file.bound.resolutions) } });
	if (existsSync(path) && readFileSync(path, 'utf8') === content) return;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
}

function sortedBySymbols(resolutions: ResolutionSection['resolutions']): ResolutionSection['resolutions'] {
	const keyOf = (entry: ResolutionSection['resolutions'][number]): string => JSON.stringify([entry.resolution.symbols, entry]);
	return [...resolutions].sort((a, b) => compareOrdinal(keyOf(a), keyOf(b)));
}

export function ensureConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>): void {
	if (!existsSync(conflictResolutionsPath(pkg))) writeConflictResolutions(pkg, EMPTY_CONFLICT_RESOLUTIONS);
}

export function rewriteConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>): void {
	writeConflictResolutions(pkg, readConflictResolutions(pkg));
}

export function readConflictResolutions(pkg: Pick<GrammarPackage, 'dir'>): ConflictResolutionsFile {
	ensureConflictResolutions(pkg);
	return JSON.parse(readFileSync(conflictResolutionsPath(pkg), 'utf8')) as ConflictResolutionsFile;
}
