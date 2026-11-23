import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readVitestReport } from '../src/scripts/vitest-report.ts';

function withFile(content: string, check: (path: string) => void): void {
	const dir = mkdtempSync(join(tmpdir(), 'vitest-report-test-'));
	try {
		const path = join(dir, 'report.json');
		writeFileSync(path, content);
		check(path);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

describe('readVitestReport', () => {
	it('reads a report with testResults and the test counts', () => {
		withFile(JSON.stringify({ numTotalTests: 1, numFailedTests: 0, testResults: [] }), (path) => {
			expect(readVitestReport(path).numTotalTests).toBe(1);
		});
	});

	it('refuses JSON that is not a vitest report', () => {
		withFile(JSON.stringify({ hello: 'world' }), (path) => {
			expect(() => readVitestReport(path)).toThrow(/is not a vitest JSON report/);
		});
	});

	it('refuses a file that is not JSON', () => {
		withFile('null', (path) => {
			expect(() => readVitestReport(path)).toThrow(/is not a vitest JSON report/);
		});
	});
});
