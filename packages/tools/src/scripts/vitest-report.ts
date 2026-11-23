import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import type { VitestJsonReport } from './record-test-run.ts';

export function checkoutRootOf(file: string): string {
	if (!existsSync(file)) {
		throw new Error(`${file} does not exist, so the checkout that holds it cannot be determined`);
	}
	let dir = dirname(file);
	for (;;) {
		if (existsSync(join(dir, '.git'))) return dir;
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error(`${file} is not inside a git checkout, so its path cannot be made checkout-relative`);
		}
		dir = parent;
	}
}

export function checkoutRelativeFile(name: string): string {
	return relative(checkoutRootOf(name), name).split(sep).join('/');
}

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
