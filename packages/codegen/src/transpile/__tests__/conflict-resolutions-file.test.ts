import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
import { REPO_ROOT, allGrammars, grammarPackage } from '../../grammars.ts';
import { generatedRootsFor, worktreeSource } from '../../scripts/generated-manifest.ts';
import {
	conflictResolutionsPath,
	ensureConflictResolutions,
	readConflictResolutions,
	writeConflictResolutions
} from '../conflict-resolutions-file.ts';

const derived: ConflictResolutionsFile = {
	grammarHash: 'abc',
	resolutions: [
		{
			resolution: { kind: 'AddConflict', symbols: ['a', 'b'] },
			step: 'default',
			sourceChains: [['a'], ['b']],
			conflict: { symbolSequence: ['x'], lookahead: "';'", interpretations: ['a', 'b'] }
		}
	]
};

describe('the resolutions file of a package', () => {
	let dir: string;
	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'sittir-resolutions-'));
	});
	afterEach(() => rmSync(dir, { recursive: true, force: true }));

	it('is seeded with the empty set when missing, and left alone when present', () => {
		ensureConflictResolutions({ dir });
		expect(JSON.parse(readFileSync(conflictResolutionsPath({ dir }), 'utf8'))).toEqual(EMPTY_CONFLICT_RESOLUTIONS);
		writeConflictResolutions({ dir }, derived);
		ensureConflictResolutions({ dir });
		expect(JSON.parse(readFileSync(conflictResolutionsPath({ dir }), 'utf8'))).toEqual(derived);
	});

	it('reads back what was written, and the empty set when missing', () => {
		expect(readConflictResolutions({ dir })).toEqual(EMPTY_CONFLICT_RESOLUTIONS);
		writeConflictResolutions({ dir }, derived);
		expect(readConflictResolutions({ dir })).toEqual(derived);
	});

	it('is not rewritten when the content is unchanged', () => {
		writeConflictResolutions({ dir }, derived);
		const before = statSync(conflictResolutionsPath({ dir })).mtimeMs;
		writeConflictResolutions({ dir }, derived);
		expect(statSync(conflictResolutionsPath({ dir })).mtimeMs).toBe(before);
	});
});

describe.each(allGrammars())('%s resolutions are a verified generated output', (grammar) => {
	it('resolutions.json is a tracked file under one of the grammar\'s generated roots', () => {
		const path = relative(REPO_ROOT, conflictResolutionsPath(grammarPackage(grammar)));
		expect(generatedRootsFor(grammar).some((root) => path.startsWith(`${root}/`))).toBe(true);
		expect(worktreeSource().visible.has(path)).toBe(true);
	});
});
