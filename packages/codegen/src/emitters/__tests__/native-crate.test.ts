import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, nativeCrateDir } from '../../grammars.ts';
import { NATIVE_RENDER_TRANSPORT_ABI, nativeCrateFiles } from '../native-crate.ts';

describe('nativeCrateFiles reproduces an existing grammar crate', () => {
	for (const file of nativeCrateFiles('python')) {
		it(file.path, () => {
			expect(file.contents).toBe(readFileSync(join(nativeCrateDir('python'), file.path), 'utf8'));
		});
	}
});

describe('every grammar crate declares the codegen transport ABI', () => {
	for (const grammar of allGrammars()) {
		const lib = join(nativeCrateDir(grammar), 'src/lib.rs');
		it.skipIf(!existsSync(lib))(grammar, () => {
			expect(readFileSync(lib, 'utf8')).toContain(
				`const NATIVE_RENDER_TRANSPORT_ABI: u32 = ${NATIVE_RENDER_TRANSPORT_ABI};`
			);
		});
	}
});
