import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { appendHistory, readHistory, historyPath } from '../src/history.ts';
import type { ValidationRun } from '../src/history.ts';

const REAL_HISTORY = historyPath();
const SCRATCH = resolve(fileURLToPath(new URL('..', import.meta.url)), 'validation-history-test-scratch.jsonl');

function makeEntry(overrides: Partial<ValidationRun> = {}): ValidationRun {
	return {
		ts: new Date().toISOString(),
		grammar: 'rust',
		backend: 'native',
		fromPass: 10,
		fromTotal: 12,
		covPass: 8,
		covTotal: 9,
		readRenderParsePass: 5,
		readRenderParseTotal: 6,
		readRenderParseAstMatchPass: 4,
		readRenderParseShallowPass: 4,
		readRenderParseShallowTotal: 6,
		readRenderParseShallowAstMatchPass: 3,
		factoryRenderParsePass: 3,
		factoryRenderParseTotal: 4,
		factoryRenderParseAstMatchPass: 3,
		...overrides
	};
}

describe('@sittir/validator history surface', () => {
	it('historyPath returns a string ending in .jsonl', () => {
		expect(typeof REAL_HISTORY).toBe('string');
		expect(REAL_HISTORY.endsWith('.jsonl')).toBe(true);
	});

	it('readHistory on the real file returns an array (no schema-header leak)', () => {
		const runs = readHistory();
		expect(Array.isArray(runs)).toBe(true);
		// Every element returned must look like a real ValidationRun — no schema-header objects.
		for (const r of runs) {
			expect(typeof r.ts).toBe('string');
			expect(typeof r.grammar).toBe('string');
		}
	});

	it('exports appendHistory as a function', () => {
		expect(typeof appendHistory).toBe('function');
	});
});

describe('@sittir/validator history round-trip (scratch file)', () => {
	beforeEach(() => {
		process.env['SITTIR_HISTORY_PATH'] = SCRATCH;
		writeFileSync(SCRATCH, '');
	});

	afterEach(() => {
		delete process.env['SITTIR_HISTORY_PATH'];
		if (existsSync(SCRATCH)) unlinkSync(SCRATCH);
	});

	it('appendHistory + readHistory round-trips a single entry', () => {
		const entry = makeEntry({ grammar: 'typescript', backend: 'js' });
		appendHistory(entry);
		const runs = readHistory();
		expect(runs).toHaveLength(1);
		expect(runs[0]!.grammar).toBe('typescript');
		expect(runs[0]!.backend).toBe('js');
		expect(runs[0]!.fromPass).toBe(10);
	});

	it('multiple appendHistory calls accumulate correctly', () => {
		for (const g of ['rust', 'typescript', 'python'] as const) {
			appendHistory(makeEntry({ grammar: g }));
		}
		const runs = readHistory();
		expect(runs).toHaveLength(3);
		expect(runs.map((r) => r.grammar)).toEqual(['rust', 'typescript', 'python']);
	});

	it('readHistory skips schema/header lines', () => {
		// Pre-populate the scratch file with a schema header line (as the real file has).
		const schemaLine = JSON.stringify({
			schema: 'v1',
			description: 'sittir validation history',
			fields: ['ts', 'grammar']
		});
		writeFileSync(SCRATCH, schemaLine + '\n');

		// Now append a real entry and verify only that entry is returned.
		appendHistory(makeEntry({ grammar: 'python' }));
		const runs = readHistory();
		expect(runs).toHaveLength(1);
		expect(runs[0]!.grammar).toBe('python');
	});

	it('readHistory returns empty array for empty file', () => {
		expect(readHistory()).toEqual([]);
	});

	it('readHistory returns empty array when file does not exist', () => {
		if (existsSync(SCRATCH)) unlinkSync(SCRATCH);
		expect(readHistory()).toEqual([]);
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
			'readRenderParsePass',
			'readRenderParseTotal',
			'readRenderParseAstMatchPass',
			'readRenderParseShallowPass',
			'readRenderParseShallowTotal',
			'readRenderParseShallowAstMatchPass',
			'factoryRenderParsePass',
			'factoryRenderParseTotal',
			'factoryRenderParseAstMatchPass'
		];
		for (const k of keys) {
			expect(Object.prototype.hasOwnProperty.call(entry, k)).toBe(true);
		}
	});
});
