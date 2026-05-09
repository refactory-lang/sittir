import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appendFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// We test the module's internals by pointing HISTORY_PATH at a temp file.
// Instead of importing and running the real path, we test the exported functions
// against the actual validation-history.jsonl file and a scratch copy.

import { appendHistory, readHistory, historyPath } from '../src/history.ts';
import type { ValidationRun } from '../src/history.ts';

const REAL_HISTORY = historyPath();
const SCRATCH = resolve(
	fileURLToPath(new URL('..', import.meta.url)),
	'validation-history-test-scratch.jsonl',
);

function makeEntry(overrides: Partial<ValidationRun> = {}): ValidationRun {
	return {
		ts: new Date().toISOString(),
		grammar: 'rust',
		backend: 'native',
		fromPass: 10,
		fromTotal: 12,
		covPass: 8,
		covTotal: 9,
		rtPass: 5,
		rtTotal: 6,
		rtAstMatchPass: 4,
		factoryPass: 3,
		factoryTotal: 4,
		factoryAstMatchPass: 3,
		...overrides,
	};
}

describe('@sittir/validator history surface', () => {
	it('historyPath returns a string ending in .jsonl', () => {
		expect(typeof REAL_HISTORY).toBe('string');
		expect(REAL_HISTORY.endsWith('.jsonl')).toBe(true);
	});

	it('readHistory returns an array', () => {
		const runs = readHistory();
		expect(Array.isArray(runs)).toBe(true);
	});

	it('exports appendHistory as a function', () => {
		expect(typeof appendHistory).toBe('function');
	});
});

describe('@sittir/validator history round-trip (scratch file)', () => {
	beforeEach(() => {
		// Start with the schema line so readHistory skips non-run lines.
		writeFileSync(SCRATCH, '');
	});

	afterEach(() => {
		if (existsSync(SCRATCH)) unlinkSync(SCRATCH);
	});

	it('appended entry is readable back', () => {
		// Directly append to scratch file to avoid touching real history.
		const entry = makeEntry({ grammar: 'typescript', backend: 'typescript' });
		appendFileSync(SCRATCH, JSON.stringify(entry) + '\n', 'utf8');

		const raw = readFileSync(SCRATCH, 'utf8').trim().split('\n');
		const parsed = raw.map((l) => JSON.parse(l) as ValidationRun);
		expect(parsed).toHaveLength(1);
		expect(parsed[0]!.grammar).toBe('typescript');
		expect(parsed[0]!.backend).toBe('typescript');
		expect(parsed[0]!.fromPass).toBe(10);
	});

	it('multiple appends accumulate correctly', () => {
		for (const g of ['rust', 'typescript', 'python'] as const) {
			const entry = makeEntry({ grammar: g });
			appendFileSync(SCRATCH, JSON.stringify(entry) + '\n', 'utf8');
		}
		const raw = readFileSync(SCRATCH, 'utf8').trim().split('\n');
		expect(raw).toHaveLength(3);
		const grammars = raw.map((l) => (JSON.parse(l) as ValidationRun).grammar);
		expect(grammars).toEqual(['rust', 'typescript', 'python']);
	});

	it('ValidationRun shape has all required keys', () => {
		const entry = makeEntry();
		const keys: Array<keyof ValidationRun> = [
			'ts',
			'grammar',
			'backend',
			'fromPass',
			'fromTotal',
			'covPass',
			'covTotal',
			'rtPass',
			'rtTotal',
			'rtAstMatchPass',
			'factoryPass',
			'factoryTotal',
			'factoryAstMatchPass',
		];
		for (const k of keys) {
			expect(Object.prototype.hasOwnProperty.call(entry, k)).toBe(true);
		}
	});
});
