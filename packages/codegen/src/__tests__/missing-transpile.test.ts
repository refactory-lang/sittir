import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { grammarPackage } from '../grammars.ts';
import { missingTranspileDiagnostics } from '../run-codegen.ts';
import { ensureConflictResolutions } from '../transpile/conflict-resolutions-file.ts';

const dirs: string[] = [];
afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function scratchPackage(name: string) {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-missing-transpile-'));
	dirs.push(dir);
	return grammarPackage(name, dir);
}

describe('a gen run that skipped the transpile chain', () => {
	it('is blocked with a diagnostic naming the missing resolutions file and the command that writes it', () => {
		const diagnostics = missingTranspileDiagnostics(scratchPackage('scratch'));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]).toMatchObject({ code: 'transpile-missing', canProceed: false, grammar: 'scratch' });
		expect(diagnostics[0]?.message).toContain('resolutions.json');
		expect(diagnostics[0]?.proposal).toContain('--all');
	});

	it('is silent once the chain has written the file', () => {
		const pkg = scratchPackage('scratch');
		ensureConflictResolutions(pkg);
		expect(missingTranspileDiagnostics(pkg)).toEqual([]);
	});
});
