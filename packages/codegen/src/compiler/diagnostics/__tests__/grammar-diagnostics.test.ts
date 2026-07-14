import { describe, expect, it } from 'vitest';
import { writeGrammarDiagnosticsJson } from '../grammar-diagnostics.ts';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('writeGrammarDiagnosticsJson', () => {
	it('writes an array of diagnostics as JSON with code/severity/location/message/proposal fields', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-diag-test-'));
		const outPath = join(dir, 'grammar-diagnostics.json');
		const diagnostics = [
			{
				scope: 'grammar' as const,
				code: 'non-literal-separator',
				severity: 'warning' as const,
				grammar: 'typescript',
				ownerKind: 'interface_body',
				slotName: '-',
				message: 'Separator is not a literal string.',
				proposal: 'See PR-T.',
				canProceed: true
			}
		];
		writeGrammarDiagnosticsJson(diagnostics, outPath);
		const written = JSON.parse(readFileSync(outPath, 'utf8'));
		expect(written).toEqual(diagnostics);
		rmSync(dir, { recursive: true, force: true });
	});

	it('writes an empty array when there are no diagnostics', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-diag-test-'));
		const outPath = join(dir, 'grammar-diagnostics.json');
		writeGrammarDiagnosticsJson([], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual([]);
		rmSync(dir, { recursive: true, force: true });
	});
});
