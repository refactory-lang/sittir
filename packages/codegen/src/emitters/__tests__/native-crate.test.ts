import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, nativeCrateDir } from '../../grammars.ts';
import { nativeCrateFiles } from '../native-crate.ts';

describe('every grammar crate holds the generated crate files', () => {
	for (const grammar of allGrammars()) {
		for (const file of nativeCrateFiles(grammar).filter((file) => !file.scaffoldOnly)) {
			it(`${grammar} ${file.path}`, () => {
				expect(readFileSync(join(nativeCrateDir(grammar), file.path), 'utf8')).toBe(file.contents);
			});
		}
	}
});

describe('a scaffolded crate reproduces the python crate', () => {
	for (const file of nativeCrateFiles('python')) {
		it(file.path, () => {
			expect(file.contents).toBe(readFileSync(join(nativeCrateDir('python'), file.path), 'utf8'));
		});
	}
});
