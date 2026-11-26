import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { roundWorkers } from '../src/profile/storage.ts';
import { reportFor, storageBenchTestTimeout } from './storage-bench.helpers.ts';

const allGrammars = ['python', 'regex', 'rust', 'scm', 'typescript'];

it(
	'profiles the canonical validation buckets in paired fresh storage workers',
	async () => {
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
				'copy',
				'build',
				'render',
				'parse'
			]);
		}
	},
	storageBenchTestTimeout
);

it.each([
	{ label: 'one grammar', args: ['regex'], grammars: ['regex'], rounds: 2 },
	{ label: 'every stable grammar', args: [], grammars: allGrammars, rounds: 1 }
])(
	'runs only native hydration of $label in fresh GC-enabled workers',
	async ({ args, grammars, rounds }) => {
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
		expect(report.schemaVersion).toBe(4);
		expect(report).not.toHaveProperty('samples');
		expect(report).not.toHaveProperty('summary');
		expect(report.options).not.toHaveProperty('nativeDepth');
		expect(report.nativeSamples).toHaveLength(grammars.length * rounds);
		expect(report.nativeSummary.map((row: { grammar: string }) => row.grammar)).toEqual(grammars);
		expect(new Set(report.nativeSamples.map((row: { pid: number }) => row.pid)).size).toBe(grammars.length * rounds);
		expect(report.environment.idleGated).toBe(false);
		for (const row of report.nativeSamples) {
			expect(row).not.toHaveProperty('depth');
			expect(row.entries).toBeGreaterThan(0);
			expect(row.entries + row.refused.length).toBe(2);
			expect(Object.keys(row.timings)).toEqual(['parse', 'render', 'pipeline']);
			for (const phase of ['parse', 'render', 'pipeline']) expect(row.timings[phase]).toHaveLength(1);
			expect(row.render.sha256).toMatch(/^[a-f\d]{64}$/);
			expect(row.timings.pipeline[0]).toBeCloseTo(row.timings.parse[0] + row.timings.render[0], 6);
		}
	},
	storageBenchTestTimeout
);

it('runs the branch and a baseline tree in the same rounds, turning the order each round', () => {
	const evenRound = [
		{ revision: 'branch', storage: 'object' },
		{ revision: 'branch', storage: 'arena' },
		{ revision: 'baseline', storage: 'object' },
		{ revision: 'baseline', storage: 'arena' },
		{ revision: 'branch', grammars: 'one' },
		{ revision: 'branch', grammars: 'all' },
		{ revision: 'baseline', grammars: 'one' },
		{ revision: 'baseline', grammars: 'all' }
	];
	expect(roundWorkers(0, ['branch', 'baseline'], true)).toEqual(evenRound);
	expect(roundWorkers(1, ['branch', 'baseline'], true)).toEqual([
		{ revision: 'baseline', storage: 'arena' },
		{ revision: 'baseline', storage: 'object' },
		{ revision: 'branch', storage: 'arena' },
		{ revision: 'branch', storage: 'object' },
		{ revision: 'baseline', grammars: 'all' },
		{ revision: 'baseline', grammars: 'one' },
		{ revision: 'branch', grammars: 'all' },
		{ revision: 'branch', grammars: 'one' }
	]);
	expect(roundWorkers(1, ['branch'], false)).toEqual([
		{ revision: 'branch', storage: 'arena' },
		{ revision: 'branch', storage: 'object' }
	]);
});

it(
	'measures a baseline tree beside the branch: its own validation workers, the memory of one and of every grammar, and what a host install costs',
	async () => {
		const report = await reportFor(['regex', '--validation', '--rounds', '2', '--warmup', '0', '--iterations', '1', '--baseline', REPO_ROOT]);
		expect(report.validationSamples.map((row: { storage: string }) => row.storage)).toEqual(['object', 'arena', 'arena', 'object']);
		expect(report.baseline.validationSamples.map((row: { storage: string }) => row.storage)).toEqual(['object', 'arena', 'arena', 'object']);
		expect(report.baseline.commit).toBe(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim());
		expect(report.baseline.harnessSha256).toBe(report.environment.harnessSha256);
		expect(report.library.memory.map((row: { revision: string; grammars: string[] }) => [row.revision, row.grammars.length])).toEqual([
			['branch', 1],
			['branch', 5],
			['baseline', 1],
			['baseline', 5],
			['baseline', 5],
			['baseline', 1],
			['branch', 5],
			['branch', 1]
		]);
		for (const row of report.library.memory) expect(row.rssBytes).toBeGreaterThan(0);
		const pids = [...report.validationSamples, ...report.baseline.validationSamples, ...report.library.memory].map((row: { pid: number }) => row.pid);
		expect(new Set(pids).size).toBe(16);
		for (const revision of ['branch', 'baseline']) {
			const install = report.library.install[revision].regex;
			expect(Object.keys(install.packages)[0]).toBe('@sittir/regex');
			expect(Object.keys(install.packages)).toHaveLength(2);
			expect(install.bytes).toBeGreaterThan(install.packages['@sittir/regex']);
		}
	},
	storageBenchTestTimeout
);
