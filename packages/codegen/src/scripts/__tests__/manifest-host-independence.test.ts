import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, REPO_ROOT } from '../../grammars.ts';

describe('the committed generated manifest', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: holds nothing that depends on the host that generated it`, () => {
			const manifest = JSON.parse(readFileSync(join(REPO_ROOT, `packages/${grammar}/.sittir/generated.manifest.json`), 'utf8')) as Record<string, unknown>;
			expect(Object.keys(manifest).sort()).toEqual(['files', 'grammar', 'source_hash']);
			expect(Object.keys(manifest.files as object).filter((path) => path.endsWith('.node'))).toEqual([]);
		});
	}
});
