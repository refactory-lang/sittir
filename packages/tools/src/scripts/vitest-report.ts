import { readFileSync } from 'node:fs';

import type { VitestJsonReport } from './record-test-run.ts';

export function readVitestReport(path: string): VitestJsonReport {
	const report = JSON.parse(readFileSync(path, 'utf8')) as Partial<VitestJsonReport> | null;
	if (
		report === null ||
		typeof report !== 'object' ||
		!Array.isArray(report.testResults) ||
		typeof report.numFailedTests !== 'number' ||
		typeof report.numTotalTests !== 'number'
	) {
		throw new Error(`${path} is not a vitest JSON report (testResults, numTotalTests and numFailedTests are required)`);
	}
	return report as VitestJsonReport;
}
