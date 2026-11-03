import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grammarPackage, sittirDirOf } from '../grammars.ts';

const CEILINGS: Record<string, number> = {
	rust: 0,
	typescript: 0,
	python: 0,
	scm: 0,
	regex: 0
};

function clashesOf(grammar: string): string[] {
	const path = join(sittirDirOf(grammarPackage(grammar)), 'grammar-diagnostics.json');
	if (!existsSync(path)) return [];
	const diagnostics = JSON.parse(readFileSync(path, 'utf8')) as { readonly code: string; readonly message: string }[];
	return diagnostics.filter((d) => d.code === 'accessor-class-clash').map((d) => d.message);
}

describe('accessor value-class ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: accessor names holding more than one value class stay at or below ${ceiling}`, () => {
			const clashes = clashesOf(grammar);
			expect(clashes.length, `${grammar} accessor class clashes (${clashes.length} > ${ceiling}):\n${clashes.join('\n')}`).toBeLessThanOrEqual(ceiling);
		});
	}
});
