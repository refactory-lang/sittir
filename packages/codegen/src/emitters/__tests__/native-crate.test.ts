import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, nativeCrateDir } from '../../grammars.ts';
import { nativeCrateFiles } from '../native-crate.ts';

describe('a grammar crate builds its binding', () => {
	it('under the release profile for CI and publishing, and the gate profile for local regeneration', () => {
		const pkg = JSON.parse(nativeCrateFiles('rust').find((file) => file.path === 'package.json')!.contents) as { scripts: Record<string, string> };
		expect(pkg.scripts).toEqual({
			build: 'tsx ../../../scripts/build-native.mts rust --release',
			'build:debug': 'tsx ../../../scripts/build-native.mts rust',
			'build:gate': 'tsx ../../../scripts/build-native.mts rust --profile gate'
		});
	});
});

describe('every grammar crate holds the generated crate files', () => {
	for (const grammar of allGrammars()) {
		for (const file of nativeCrateFiles(grammar)) {
			it(`${grammar} ${file.path}`, () => {
				expect(readFileSync(join(nativeCrateDir(grammar), file.path), 'utf8')).toBe(file.contents);
			});
		}
	}
});
