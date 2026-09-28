import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diagnoseEntry, run } from '../src/inspect/grammar-diagnostics.ts';

const RULE_CAUSE_FIXTURE = resolve(__dirname, '../../codegen/src/__tests__/fixtures/rule-cause-grammar.ts');

describe('tool grammar-diagnostics runs the gate generation runs', () => {
	let stdout: string[];
	let stderr: string[];
	beforeEach(() => {
		stdout = [];
		stderr = [];
		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => (stdout.push(String(chunk)), true));
		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => (stderr.push(String(chunk)), true));
	});
	afterEach(() => vi.restoreAllMocks());

	it('reports the rule-cause records that block the fixture and exits 1', async () => {
		expect(await diagnoseEntry('rule_cause', RULE_CAUSE_FIXTURE)).toBe(1);
		expect(stdout.join('')).toMatch(/rule-cause-missing/);
		expect(stdout.join('')).not.toMatch(/No grammar diagnostics/);
		expect(stderr.join('')).toMatch(/rule_cause: generation is blocked by \d+ diagnostic\(s\): .*rule-cause-missing/);
	}, 60_000);

	it('exits 0 for a grammar generation accepts', async () => {
		expect(await run({ grammar: 'python' })).toBe(0);
		expect(stderr.join('')).not.toMatch(/generation is blocked/);
	}, 120_000);
});
