import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REPO_ROOT, allGrammars } from '@sittir/codegen/grammars';
import { bootstrapGrammar, plannedRegistrations } from '../src/bootstrap/grammar.ts';

const SCRATCH = 'zzprobe';
const REGISTRATION_FILES = ['tsconfig.json', 'packages/tools/package.json', 'packages/tools/src/languages.ts'];

describe('grammar registrations', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar} is already registered everywhere every grammar must be named`, () => {
			expect(plannedRegistrations(grammar).map((edit) => edit.path)).toEqual([]);
		});
	}

	it('plans a new grammar into the root tsconfig, the tools dependencies and the LanguageApis map', () => {
		const edits = new Map(plannedRegistrations(SCRATCH).map((edit) => [edit.path, edit.contents]));
		expect([...edits.keys()]).toEqual(REGISTRATION_FILES);
		expect(edits.get('tsconfig.json')).toContain(`{ "path": "./packages/${SCRATCH}/tsconfig.build.json" },`);
		const manifest = JSON.parse(edits.get('packages/tools/package.json')!) as { dependencies: Record<string, string> };
		expect(manifest.dependencies[`@sittir/${SCRATCH}`]).toBe('workspace:*');
		expect(Object.keys(manifest.dependencies)).toEqual(Object.keys(manifest.dependencies).sort());
		const languages = edits.get('packages/tools/src/languages.ts')!;
		expect(languages).toContain(`import type { ZzprobeAPI } from '@sittir/${SCRATCH}';\n`);
		expect(languages).toContain(`\treadonly ${SCRATCH}: ZzprobeAPI;\n`);
	});
});

describe('bootstrap-grammar --dry-run', () => {
	afterEach(() => vi.restoreAllMocks());

	it('lists the registration edits and writes nothing', async () => {
		const before = REGISTRATION_FILES.map((path) => readFileSync(join(REPO_ROOT, path), 'utf8'));
		const lines: string[] = [];
		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			lines.push(String(chunk));
			return true;
		});
		await expect(bootstrapGrammar({ name: SCRATCH, range: '*', dryRun: true })).resolves.toBe(0);
		for (const path of REGISTRATION_FILES) expect(lines).toContain(`would write ${join(REPO_ROOT, path)}\n`);
		expect(REGISTRATION_FILES.map((path) => readFileSync(join(REPO_ROOT, path), 'utf8'))).toEqual(before);
	});
});
