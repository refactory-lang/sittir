import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, nativeCrateDir } from '../../grammars.ts';
import { nativeCrateFiles } from '../native-crate.ts';

describe('every grammar crate holds the generated crate files', () => {
	for (const grammar of allGrammars()) {
		for (const file of nativeCrateFiles(grammar)) {
			it(`${grammar} ${file.path}`, () => {
				expect(readFileSync(join(nativeCrateDir(grammar), file.path), 'utf8')).toBe(file.contents);
			});
		}
	}
});
