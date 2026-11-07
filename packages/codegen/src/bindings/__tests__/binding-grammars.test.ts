import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

const probeDir = mkdtempSync(join(tmpdir(), 'sittir-binding-grammars-'));
writeFileSync(join(probeDir, 'bindings.scm'), '(identifier) @identifier\n');

vi.mock('../../grammars.ts', async (original) => {
	const actual = await original<typeof import('../../grammars.ts')>();
	return {
		...actual,
		allGrammars: () => ['python', 'probe'],
		stableGrammars: () => ['python'],
		grammarPackageDir: (grammar: string) => (grammar === 'probe' ? probeDir : actual.grammarPackageDir(grammar as never))
	};
});

const { bindingGrammars } = await import('../facts.ts');

afterAll(() => rmSync(probeDir, { recursive: true, force: true }));

describe('bindingGrammars', () => {
	it('names only the stable grammars that ship bindings, so an unstable grammar with bindings stays outside every gate', () => {
		expect(bindingGrammars()).toEqual(['python']);
	});
});
