import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface CargoTestTallyOptions {
	log: string;
	storage: string;
	json?: boolean;
}

export interface CargoTestBinaryTally {
	binary: string;
	passed: number;
	failed: number;
	ignored: number;
}

export interface CargoTestTally {
	storage: string;
	passed: number;
	failed: number;
	ignored: number;
	binaries: CargoTestBinaryTally[];
}

const RUNNING = /^\s*Running (.+)$/;
const DOC_TESTS = /^\s*Doc-tests (.+)$/;
const RESULT = /^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored;/;
const TEST_LINE = /^test .+ \.\.\. (ok|FAILED|ignored)(?:, .*)?\s*$/;

export function summarizeCargoTests(output: string, storage: string): CargoTestTally {
	const binaries: CargoTestBinaryTally[] = [];
	let current = '(no binary named)';
	let perTest = { ok: 0, failed: 0, ignored: 0 };
	let resultLines = 0;
	for (const line of output.split('\n')) {
		const running = RUNNING.exec(line) ?? DOC_TESTS.exec(line);
		if (running !== null) {
			current = running[1]!.trim();
			continue;
		}
		const test = TEST_LINE.exec(line);
		if (test !== null) {
			if (test[1] === 'ok') perTest.ok += 1;
			else if (test[1] === 'FAILED') perTest.failed += 1;
			else perTest.ignored += 1;
			continue;
		}
		const result = RESULT.exec(line);
		if (result !== null) {
			resultLines += 1;
			binaries.push({
				binary: current,
				passed: Number(result[2]),
				failed: Number(result[3]),
				ignored: Number(result[4])
			});
		}
	}
	if (resultLines === 0) {
		throw new Error('the log has no "test result:" lines, so it is not a cargo test log');
	}
	const passed = binaries.reduce((sum, b) => sum + b.passed, 0);
	const failed = binaries.reduce((sum, b) => sum + b.failed, 0);
	const ignored = binaries.reduce((sum, b) => sum + b.ignored, 0);
	if (passed !== perTest.ok || failed !== perTest.failed || ignored !== perTest.ignored) {
		throw new Error(
			`result lines total ${passed} passed, ${failed} failed, ${ignored} ignored, but the per-test lines total ${perTest.ok} ok, ${perTest.failed} FAILED, ${perTest.ignored} ignored`
		);
	}
	return { storage, passed, failed, ignored, binaries };
}

function formatCargoTestTally(tally: CargoTestTally): string {
	const lines = tally.binaries.map(
		(b) => `${String(b.passed).padStart(6)} ${String(b.failed).padStart(6)} ${String(b.ignored).padStart(6)}  ${b.binary}`
	);
	lines.push(`${String(tally.passed).padStart(6)} ${String(tally.failed).padStart(6)} ${String(tally.ignored).padStart(6)}  total (${tally.storage})`);
	return lines.join('\n');
}

export async function run(opts: CargoTestTallyOptions): Promise<number> {
	try {
		const tally = summarizeCargoTests(readFileSync(resolve(opts.log), 'utf8'), opts.storage);
		console.log(opts.json ? JSON.stringify(tally, null, 2) : formatCargoTestTally(tally));
		return 0;
	} catch (error) {
		console.error(`cargo-test-tally: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}
