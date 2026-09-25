import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nativeCrateDir } from '../../grammars.ts';
import { nativeCrateFiles } from '../native-crate.ts';

describe('nativeCrateFiles reproduces an existing grammar crate', () => {
	for (const file of nativeCrateFiles('python')) {
		it(file.path, () => {
			expect(file.contents).toBe(readFileSync(join(nativeCrateDir('python'), file.path), 'utf8'));
		});
	}
});
