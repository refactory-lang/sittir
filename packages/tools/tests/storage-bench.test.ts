import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
import { summarize, validatePair } from '../src/profile/storage.ts';
import { STORAGE_PHASES, type StorageSample } from '../src/profile/storage-worker.ts';

function sample(storage: 'object' | 'arena'): StorageSample {
	const memory = { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
	return {
		grammar: 'regex',
		storage,
		corpus: { entries: 2, bytes: 10, sha256: 'same-corpus' },
		nodes: 7,
		walk: { nodes: 7, kinds: 10, textUnits: 3 },
		pid: 1,
		memory: { baseline: memory, structure: memory, text: memory },
		timings: STORAGE_PHASES.map((phase) => ({ phase, milliseconds: [1], work: 7 })),
		render: { entries: 2, sha256: 'same-output', refused: [] }
	};
}

it('refuses timing comparisons that performed different amounts of work', () => {
	const object = sample('object');
	const arena = sample('arena');
	arena.timings[0]!.work++;
	expect(() => validatePair(object, arena)).toThrow('workload mismatch');
});

it('refuses workload drift between rounds even when each pair matches', () => {
	const first = [sample('object'), sample('arena')];
	const second = [sample('object'), sample('arena')];
	for (const row of second) {
		row.corpus.sha256 = 'changed-between-rounds';
		for (const timing of row.timings) timing.work *= 10;
	}
	expect(() => validatePair(first[0]!, first[1]!)).not.toThrow();
	expect(() => validatePair(second[0]!, second[1]!)).not.toThrow();
	expect(() => summarize([...first, ...second])).toThrow('workload mismatch');
});

async function reportFor(args: string[]) {
	const directory = await mkdtemp(join(tmpdir(), 'sittir-storage-smoke-'));
	try {
		const output = join(directory, 'report.json');
		await promisify(execFile)(
			process.execPath,
			[
				'--import',
				'tsx',
				fileURLToPath(new URL('../../cli/src/cli.ts', import.meta.url)),
				'tool',
				'bench-storage',
				...args,
				'--output',
				output
			],
			{ timeout: 60_000 }
		);
		return JSON.parse(await readFile(output, 'utf8'));
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

it('runs the CLI in fresh GC-enabled workers, alternating storage order', async () => {
	const report = await reportFor(['regex', '--rounds', '2', '--warmup', '0', '--iterations', '1', '--limit', '2']);
	expect(report.samples.map((row: StorageSample) => row.storage)).toEqual(['object', 'arena', 'arena', 'object']);
	expect(report.samples.every((row: StorageSample) => row.nodes > 0 && row.corpus.entries === 2)).toBe(true);
	expect(new Set(report.samples.map((row: StorageSample) => row.pid)).size).toBe(4);
	expect(report.samples[0].timings.map((row: { phase: string }) => row.phase)).toEqual(STORAGE_PHASES);
	expect(report.summary[0].timings).toHaveLength(STORAGE_PHASES.length);
	expect(report.environment.idleGated).toBe(false);
}, 90_000);

it.each(['2', 'all'])(
	'runs native hydration at depth %s through all five native addons',
	async (depth) => {
		const report = await reportFor([
			'--native-depth',
			depth,
			'--rounds',
			'1',
			'--warmup',
			'0',
			'--iterations',
			'1',
			'--limit',
			'2'
		]);
		expect(report.mode).toBe('native-hydration');
		expect(report.samples).toEqual([]);
		expect(report.summary).toEqual([]);
		expect(report.nativeSamples).toHaveLength(5);
		expect(report.nativeSummary).toHaveLength(5);
		expect(new Set(report.nativeSamples.map((row: { pid: number }) => row.pid)).size).toBe(5);
		for (const row of report.nativeSamples) {
			expect(row.depth).toBe(depth === 'all' ? 'all' : 2);
			expect(row.entries).toBeGreaterThan(0);
			expect(row.entries + row.refused.length).toBe(2);
			for (const phase of ['parse', 'hydrate', 'render', 'pipeline', 'afterShallow'])
				expect(row.timings[phase]).toHaveLength(1);
			expect(row.render.sha256).toMatch(/^[a-f\d]{64}$/);
			expect(row.timings.pipeline[0]).toBeCloseTo(
				row.timings.parse[0] + row.timings.hydrate[0] + row.timings.render[0],
				6
			);
		}
	},
	90_000
);
