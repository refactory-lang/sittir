import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeDiagnostics, writeGrammarDiagnosticsJson } from '../grammar-diagnostics.ts';
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

describe('writeDiagnostics', () => {
	afterEach(() => vi.restoreAllMocks());

	it('writes info diagnostics to stdout and every other severity to stderr, each formatted once', () => {
		const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
		const format = (ds: readonly { code: string }[]) => ds.map((d) => d.code).join('|');
		writeDiagnostics(
			[
				{ code: 'a', severity: 'info' },
				{ code: 'b', severity: 'error' },
				{ code: 'c', severity: 'info' },
				{ code: 'd', severity: 'warning' },
				{ code: 'e', severity: 'fail' }
			],
			format
		);
		expect(out.mock.calls).toEqual([['a|c\n']]);
		expect(err.mock.calls).toEqual([['b|d|e\n']]);
	});

	it('writes nothing for a side with no diagnostics', () => {
		const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
		writeDiagnostics([{ code: 'a', severity: 'warning' }], (ds) => ds.map((d) => d.code).join('|'));
		expect(out).not.toHaveBeenCalled();
		expect(err.mock.calls).toEqual([['a\n']]);
	});
});
