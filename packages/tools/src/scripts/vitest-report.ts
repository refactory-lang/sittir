import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';

import type { VitestJsonReport } from './record-test-run.ts';

function enclosingCheckout(file: string): string | undefined {
	let dir = dirname(file);
	for (;;) {
		if (existsSync(join(dir, '.git'))) return dir;
		const parent = dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}

export function checkoutRelativeNames(report: VitestJsonReport): Map<string, string> {
	const names = report.testResults.map((result) => result.name);
	const keys = new Map<string, string>();
	if (names.length === 0) return keys;
	const live = names.filter((name) => existsSync(name));
	if (live.length === 0) {
		throw new Error(
			`none of the ${names.length} files the report names exists, so the checkout it ran in cannot be determined`
		);
	}
	const checkouts = new Set(
		live.map((name) => {
			const root = enclosingCheckout(name);
			if (root === undefined) throw new Error(`${name} is not inside a git checkout`);
			return root;
		})
	);
	if (checkouts.size > 1) {
		throw new Error(
			`the report's files exist in ${checkouts.size} checkouts (${[...checkouts].join(', ')}), so it did not run in one checkout`
		);
	}
	const [root] = checkouts;
	for (const name of names) {
		const path = relative(root as string, name);
		if (path === '' || isAbsolute(path) || path.split(sep)[0] === '..') {
			throw new Error(`${name} is outside the checkout ${root} that the report ran in`);
		}
		keys.set(name, path.split(sep).join('/'));
	}
	return keys;
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
