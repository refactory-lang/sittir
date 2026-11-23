import { resolve } from 'node:path';

import type { VitestJsonReport } from './record-test-run.ts';
import { checkoutRelativeFile, readVitestReport } from './vitest-report.ts';

export interface TestDurationsOptions {
	report?: string;
	json?: boolean;
	slowest?: number;
}

export interface FileDuration {
	file: string;
	durationMs: number;
	tests: number;
}

export interface SlowTest {
	name: string;
	durationMs: number;
}

export interface DurationSummary {
	files: FileDuration[];
	workerMs: number;
	slowestTests: SlowTest[];
}

function byText(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

function fileDuration(result: VitestJsonReport['testResults'][number]): number {
	if (typeof result.startTime !== 'number' || typeof result.endTime !== 'number') {
		throw new Error(`${checkoutRelativeFile(result.name)} has no start and end time in the report`);
	}
	const durationMs = result.endTime - result.startTime;
	if (!(durationMs >= 0)) {
		throw new Error(`${checkoutRelativeFile(result.name)} ends before it starts in the report`);
	}
	return durationMs;
}

export function summarizeDurations(report: VitestJsonReport, slowest: number): DurationSummary {
	const files = report.testResults
		.map((result) => ({
			file: checkoutRelativeFile(result.name),
			durationMs: fileDuration(result),
			tests: result.assertionResults.length
		}))
		.sort((a, b) => b.durationMs - a.durationMs || byText(a.file, b.file));
	const workerMs = files.reduce((sum, row) => sum + row.durationMs, 0);
	const independentWorkerMs = report.testResults.reduce((sum, result) => sum + fileDuration(result), 0);
	if (workerMs !== independentWorkerMs) {
		throw new Error(`per-file durations sum to ${workerMs} ms but the report's files sum to ${independentWorkerMs} ms`);
	}
	const slowestTests = report.testResults
		.flatMap((result) =>
			result.assertionResults
				.filter((assertion) => typeof assertion.duration === 'number')
				.map((assertion) => ({
					name: `${checkoutRelativeFile(result.name)} > ${assertion.fullName}`,
					durationMs: assertion.duration as number
				}))
		)
		.sort((a, b) => b.durationMs - a.durationMs || byText(a.name, b.name))
		.slice(0, slowest);
	return { files, workerMs, slowestTests };
}

function seconds(ms: number): string {
	return (ms / 1000).toFixed(3);
}

function formatDurationSummary(summary: DurationSummary): string {
	const lines = [`per-file durations (${summary.files.length} files):`];
	for (const row of summary.files) {
		lines.push(`  ${seconds(row.durationMs).padStart(9)}s  ${row.file}  (${row.tests} tests)`);
	}
	lines.push('');
	lines.push('slowest tests:');
	for (const test of summary.slowestTests) {
		lines.push(`  ${seconds(test.durationMs).padStart(9)}s  ${test.name}`);
	}
	lines.push('');
	lines.push(`worker-seconds: ${seconds(summary.workerMs)} (the sum of the ${summary.files.length} per-file durations above)`);
	return lines.join('\n');
}

export async function run(opts: TestDurationsOptions): Promise<number> {
	try {
		const report = readVitestReport(resolve(opts.report ?? '.vitest-report.json'));
		const summary = summarizeDurations(report, opts.slowest ?? 10);
		console.log(opts.json ? JSON.stringify(summary, null, 2) : formatDurationSummary(summary));
		return 0;
	} catch (error) {
		console.error(`test-durations: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}
