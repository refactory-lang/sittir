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
	const content = printRecordLines({ ...sortedSection(file), bound: sortedSection(file.bound) });
	if (existsSync(path) && readFileSync(path, 'utf8') === content) return;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
}

function sortedSection<S extends ResolutionSection>(section: S): S {
	return {
		...section,
		resolutions: sortedBy(section.resolutions, (entry) => [entry.resolution.symbols, entry]),
		...(section.withdrawn === undefined ? {} : { withdrawn: sortedBy(section.withdrawn, (set) => set) })
	};
}

function sortedBy<T>(items: readonly T[], keyOf: (item: T) => unknown): T[] {
	const key = (item: T): string => JSON.stringify(keyOf(item));
	return [...items].sort((a, b) => compareOrdinal(key(a), key(b)));
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
