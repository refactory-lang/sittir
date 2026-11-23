import { describe, it, expect } from 'vitest';

import { summarizeCargoTests } from '../src/scripts/cargo-test-tally.ts';

const LOG = [
	'     Running unittests src/lib.rs (target/debug/deps/sittir_rust-1a2b.d)',
	'running 3 tests',
	'test alpha::one ... ok',
	'test alpha::two ... ok',
	'test alpha::three ... ignored',
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

describe('summarizeCargoTests', () => {
	it('tallies a hand-counted log: 3 passed, 1 failed, 1 ignored across three binaries', () => {
		const tally = summarizeCargoTests(LOG, 'arena');
		expect(tally.storage).toBe('arena');
		expect([tally.passed, tally.failed, tally.ignored]).toEqual([3, 1, 1]);
		expect(tally.binaries.map((b) => b.binary)).toEqual([
			'unittests src/lib.rs (target/debug/deps/sittir_rust-1a2b.d)',
			'tests/parity.rs (target/debug/deps/parity-9f8e.d)',
			'sittir_rust'
		]);
	});

	it('refuses a log whose result lines do not match its per-test lines', () => {
		const dropped = LOG.replace('test alpha::two ... ok\n', '');
		expect(() => summarizeCargoTests(dropped, 'object')).toThrow(/result lines total 3 passed.*per-test lines total 2 ok/);
	});

	it('refuses text with no cargo test result lines', () => {
		expect(() => summarizeCargoTests('just some output\n', 'object')).toThrow(/no "test result:" lines/);
	});
});
