import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

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

const allGrammars = ['python', 'regex', 'rust', 'scm', 'typescript'];

it('profiles the canonical validation buckets in paired fresh storage workers', async () => {
	const report = await reportFor(['regex', '--validation', '--rounds', '2', '--warmup', '0', '--iterations', '1']);
	expect(report.mode).toBe('validation-storage');
	expect(report.validationSamples.map((row: { storage: string }) => row.storage)).toEqual([
		'object',
		'arena',
		'arena',
		'object'
	]);
	expect(new Set(report.validationSamples.map((row: { pid: number }) => row.pid)).size).toBe(4);
	expect(report.validationSummary.map((row: { bucket: string }) => row.bucket)).toEqual([
		'read-render-parse',
		'factory-render-parse',
		'ir-render-parse'
	]);
	for (const row of report.validationSummary) {
		expect(row.work.cases).toBeGreaterThan(0);
		expect(row.render.object.calls).toBeGreaterThan(0);
		expect(row.render.arena.calls).toBe(row.render.object.calls);
		expect(row.resultSha256).toMatch(/^[a-f\d]{64}$/);
		expect(row.timings.map((phase: { phase: string }) => phase.phase)).toEqual([
			'validator',
			'read',
			'build',
			'render',
			'parse'
		]);
	}
}, 90_000);

it.each([
	{ label: 'default', args: ['regex'], depth: 'all', grammars: ['regex'], rounds: 2 },
	{
		label: 'depth 2',
		args: ['--native-depth', '2'],
		depth: 2,
		grammars: allGrammars,
		rounds: 1
	},
	{
		label: 'depth all',
		args: ['--native-depth', 'all'],
		depth: 'all',
		grammars: allGrammars,
		rounds: 1
	}
])(
	'runs only native hydration with $label in fresh GC-enabled workers',
	async ({ args, depth, grammars, rounds }) => {
		const report = await reportFor([
			...args,
			'--rounds',
			String(rounds),
			'--warmup',
			'0',
			'--iterations',
			'1',
			'--limit',
			'2'
		]);
		expect(report.mode).toBe('native-hydration');
		expect(report.schemaVersion).toBe(3);
		expect(report).not.toHaveProperty('samples');
		expect(report).not.toHaveProperty('summary');
		expect(report.options.nativeDepth).toBe(depth);
		expect(report.nativeSamples).toHaveLength(grammars.length * rounds);
		expect(report.nativeSummary.map((row: { grammar: string }) => row.grammar)).toEqual(grammars);
		expect(new Set(report.nativeSamples.map((row: { pid: number }) => row.pid)).size).toBe(grammars.length * rounds);
		expect(report.environment.idleGated).toBe(false);
		for (const row of report.nativeSamples) {
			expect(row.depth).toBe(depth);
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
