import { relative, resolve, sep } from 'node:path';

import { REPO_ROOT } from '@sittir/codegen/grammars';

import type { VitestJsonReport } from './record-test-run.ts';
import { readVitestReport } from './vitest-report.ts';

export interface TestFailuresOptions {
	report?: string;
	json?: boolean;
	examples?: number;
	against?: string;
}

export interface FailureComparison {
	current: number;
	older: number;
	new: string[];
	fixed: string[];
	unchanged: number;
}

export interface FailureGroup {
	signature: string;
	count: number;
	packages: Record<string, number>;
	examples: string[];
}

export interface FailureSummary {
	failures: number;
	groups: FailureGroup[];
	failedTests: number;
	failedFiles: number;
}

interface TestFailure {
	file: string;
	fullName: string | undefined;
	message: string;
}

const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*[A-Za-z]`, 'g');
const FILE_PATH = /(?:\/|\b[\w.-]+\/)[\w.@~/-]*\.\w+(?::\d+)*/g;
const PATH_LIST = /<path>(?:, <path>)+/g;
const DEFECT_LOCATION = / on \w+\._\w+.*$/;
const DIGIT_RUN = /\d+/g;
const COMMAND_FAILED = /^Error: Command failed:/;
const ERROR_LINE = /^[A-Za-z]*Error:/;

function byText(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

function headline(message: string): string {
	const lines = message
		.replace(ANSI_ESCAPE, '')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');
	const first = lines[0] ?? '(no message)';
	if (!COMMAND_FAILED.test(first)) return first;
	return lines.slice(1).find((line) => ERROR_LINE.test(line)) ?? first;
}

function failureSignature(message: string): string {
	return headline(message)
		.replace(FILE_PATH, '<path>')
		.replace(DEFECT_LOCATION, '')
		.replace(PATH_LIST, '<path>')
		.replace(DIGIT_RUN, '#');
}

function repoRelative(name: string): string {
	return relative(REPO_ROOT, name).split(sep).join('/');
}

function packageOf(file: string): string {
	return /(?:^|\/)packages\/([^/]+)\//.exec(file)?.[1] ?? '(root)';
}

function collectFailures(report: VitestJsonReport): TestFailure[] {
	const failures: TestFailure[] = [];
	for (const result of report.testResults) {
		const file = repoRelative(result.name);
		for (const assertion of result.assertionResults) {
			if (assertion.status !== 'failed') continue;
			failures.push({ file, fullName: assertion.fullName, message: assertion.failureMessages[0] ?? '' });
		}
		if (result.status === 'failed' && result.assertionResults.length === 0) {
			failures.push({ file, fullName: undefined, message: result.message ?? '' });
		}
	}
	return failures;
}

function groupFailures(failures: TestFailure[], examples: number): FailureGroup[] {
	const groups = new Map<string, FailureGroup>();
	for (const failure of failures) {
		const signature = failureSignature(failure.message);
		const group = groups.get(signature) ?? { signature, count: 0, packages: {}, examples: [] };
		groups.set(signature, group);
		group.count += 1;
		const pkg = packageOf(failure.file);
		group.packages[pkg] = (group.packages[pkg] ?? 0) + 1;
		if (group.examples.length < examples) {
			group.examples.push(failure.fullName === undefined ? failure.file : `${failure.file} > ${failure.fullName}`);
		}
	}
	return [...groups.values()]
		.map((group) => ({
			...group,
			packages: Object.fromEntries(Object.entries(group.packages).sort(([a], [b]) => byText(a, b)))
		}))
		.sort((a, b) => b.count - a.count || byText(a.signature, b.signature));
}

export function summarizeFailures(report: VitestJsonReport, examples: number): FailureSummary {
	const failures = collectFailures(report);
	const failedTests = failures.filter((failure) => failure.fullName !== undefined).length;
	if (failedTests !== report.numFailedTests) {
		throw new Error(
			`failed assertions in the report (${failedTests}) do not match numFailedTests (${report.numFailedTests})`
		);
	}
	return {
		failures: failures.length,
		groups: groupFailures(failures, examples),
		failedTests,
		failedFiles: failures.length - failedTests
	};
}

export function formatFailureSummary(summary: FailureSummary): string {
	const lines: string[] = [];
	for (const group of summary.groups) {
		lines.push(`${group.count}  ${group.signature}`);
		const packages = Object.entries(group.packages)
			.map(([name, count]) => `${name} ${count}`)
			.join(', ');
		lines.push(`    packages: ${packages}`);
		for (const example of group.examples) lines.push(`    - ${example}`);
		lines.push('');
	}
	lines.push(
		`${summary.failures} failures in ${summary.groups.length} groups (${summary.failedTests} failed tests, ${summary.failedFiles} failed files with no tests)`
	);
	return lines.join('\n');
}

function failureKey(failure: TestFailure): string {
	if (failure.fullName !== undefined) return `${failure.file} | ${failure.fullName}`;
	return `${failure.file} | (file) ${failure.message.split('\n')[0]?.trim() ?? ''}`;
}

function failureKeys(report: VitestJsonReport, label: string): Set<string> {
	const keys = new Set<string>();
	for (const failure of collectFailures(report)) {
		const key = failureKey(failure);
		if (keys.has(key)) {
			throw new Error(`duplicate failure key in the ${label} report: ${key}`);
		}
		keys.add(key);
	}
	return keys;
}

export function compareFailures(current: VitestJsonReport, older: VitestJsonReport): FailureComparison {
	const now = failureKeys(current, 'current');
	const before = failureKeys(older, 'older');
	const added = [...now].filter((key) => !before.has(key)).sort(byText);
	const removed = [...before].filter((key) => !now.has(key)).sort(byText);
	const unchanged = now.size - added.length;
	const currentFailures = summarizeFailures(current, 0).failures;
	const olderFailures = summarizeFailures(older, 0).failures;
	if (added.length + unchanged !== currentFailures) {
		throw new Error(
			`new ${added.length} + unchanged ${unchanged} does not equal the ${currentFailures} failures in the current report`
		);
	}
	if (removed.length + unchanged !== olderFailures) {
		throw new Error(
			`fixed ${removed.length} + unchanged ${unchanged} does not equal the ${olderFailures} failures in the older report`
		);
	}
	return { current: currentFailures, older: olderFailures, new: added, fixed: removed, unchanged };
}

function formatFailureComparison(comparison: FailureComparison): string {
	const lines: string[] = [`new: ${comparison.new.length} (failing now, not failing in the older report)`];
	for (const key of comparison.new) lines.push(`    + ${key}`);
	lines.push(`fixed: ${comparison.fixed.length} (failing in the older report, passing now)`);
	for (const key of comparison.fixed) lines.push(`    - ${key}`);
	lines.push(`unchanged: ${comparison.unchanged}`);
	lines.push(
		`reconciles: ${comparison.current} failures now = ${comparison.new.length} new + ${comparison.unchanged} unchanged; ${comparison.older} failures in the older report = ${comparison.fixed.length} fixed + ${comparison.unchanged} unchanged`
	);
	return lines.join('\n');
}

export async function run(opts: TestFailuresOptions): Promise<number> {
	try {
		const report = readVitestReport(resolve(opts.report ?? '.vitest-report.json'));
		if (opts.against !== undefined) {
			const comparison = compareFailures(report, readVitestReport(resolve(opts.against)));
			console.log(opts.json ? JSON.stringify(comparison, null, 2) : formatFailureComparison(comparison));
			return 0;
		}
		const summary = summarizeFailures(report, opts.examples ?? 3);
		console.log(opts.json ? JSON.stringify(summary, null, 2) : formatFailureSummary(summary));
		return 0;
	} catch (error) {
		console.error(`test-failures: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}
