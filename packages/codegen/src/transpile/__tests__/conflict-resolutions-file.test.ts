import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
import { REPO_ROOT, grammarPackage } from '../../grammars.ts';
import { conflictResolutionsPath, ensureConflictResolutions, writeConflictResolutions } from '../conflict-resolutions-file.ts';

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

	it('is not rewritten when the content is unchanged', () => {
		writeConflictResolutions({ dir }, derived);
		const before = statSync(conflictResolutionsPath({ dir })).mtimeMs;
		writeConflictResolutions({ dir }, derived);
		expect(statSync(conflictResolutionsPath({ dir })).mtimeMs).toBe(before);
	});
});

describe.each(['python', 'rust', 'typescript', 'scm', 'regex'])('%s resolutions are a manifest-checked generated output', (grammar) => {
	it('the committed manifest records resolutions.json with its current content hash', () => {
		const pkg = grammarPackage(grammar);
		const path = conflictResolutionsPath(pkg);
		const manifest = JSON.parse(readFileSync(join(pkg.dir, '.sittir', 'generated.manifest.json'), 'utf8')) as {
			readonly files: Readonly<Record<string, string>>;
		};
		expect(manifest.files[relative(REPO_ROOT, path)]).toBe(createHash('sha256').update(readFileSync(path)).digest('hex'));
	});
});
