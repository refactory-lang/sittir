import { describe, it, expect } from 'vitest';

import { summarizeCargoTests } from '../src/scripts/cargo-test-tally.ts';

const LOG = [
	'     Running unittests src/lib.rs (target/debug/deps/sittir_rust-1a2b.d)',
	'running 3 tests',
	'test alpha::one ... ok',
	'test alpha::two ... ok',
	'test alpha::three ... ignored, reads a corpus that is not checked out',
	'test result: ok. 2 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.01s',
	'',
	'     Running tests/parity.rs (target/debug/deps/parity-9f8e.d)',
	'running 2 tests',
	'test beta::four ... ok',
	'test beta::five ... FAILED',
	'test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s',
	'',
	'   Doc-tests sittir_rust',
	'running 0 tests',
	'test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s',
	''
].join('\n');

const FILTERED = [
	'     Running unittests src/lib.rs (target/debug/deps/sittir_rust-1a2b.d)',
	'test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s',
	'',
	'     Running tests/parity.rs (target/debug/deps/parity-9f8e.d)',
	'test result: FAILED. 2 passed; 3 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.20s',
	''
].join('\n');

describe('summarizeCargoTests', () => {
	it('tallies a hand-counted log: 3 passed, 1 failed, 1 ignored across three binaries, per-test check run', () => {
		const tally = summarizeCargoTests(LOG, 'arena');
		expect(tally.storage).toBe('arena');
		expect([tally.passed, tally.failed, tally.ignored]).toEqual([3, 1, 1]);
		expect(tally.perTestChecked).toBe(true);
		expect(tally.binaries.map((b) => b.binary)).toEqual([
			'unittests src/lib.rs (target/debug/deps/sittir_rust-1a2b.d)',
			'tests/parity.rs (target/debug/deps/parity-9f8e.d)',
			'sittir_rust'
		]);
	});

	it('tallies a log with no per-test lines from its result lines, marking the per-test check as not run', () => {
		const tally = summarizeCargoTests(FILTERED, 'object');
		expect([tally.passed, tally.failed, tally.ignored]).toEqual([7, 3, 1]);
		expect(tally.perTestChecked).toBe(false);
	});

	it('refuses a log whose result lines do not match its per-test lines', () => {
		const dropped = LOG.replace('test alpha::two ... ok\n', '');
		expect(() => summarizeCargoTests(dropped, 'object')).toThrow(/result lines total 3 passed.*per-test lines total 2 ok/);
	});

	it('refuses text with no cargo test result lines', () => {
		expect(() => summarizeCargoTests('just some output\n', 'object')).toThrow(/no "test result:" lines/);
	});
});
