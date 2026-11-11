import type { NodeStorage } from '@sittir/types';
import { expect, it } from 'vitest';
import { RoundtripProfile } from '../src/validate/roundtrip-profile.ts';
import {
	summarizeValidationStorage,
	validationBuckets,
	validationPhases,
	type ValidationBucketSample,
	type ValidationStorageRun
} from '../src/profile/validation-storage.ts';

function sample(storage: NodeStorage, round = 0): ValidationStorageRun & { round: number } {
	return {
		grammar: 'regex',
		storage,
		round,
		pid: storage === 'object' ? 1 : 2,
		corpus: { entries: 1, bytes: 6, sha256: 'corpus' },
		buckets: validationBuckets.map((bucket) => {
			const profile = new RoundtripProfile();
			profile.candidate('entry', 'source', 'kind', 0, 6);
			profile.output('kind', 'kind', 'source');
			return {
				bucket,
				...profile.finish(),
				resultSha256: 'semantic-result',
				counts: { total: 1, pass: 1, fail: 0, skip: 0, astMatchPass: 1 },
				timings: Object.fromEntries(
					validationPhases.map((phase) => [phase, [storage === 'object' ? 1 : 2]])
				) as ValidationBucketSample['timings']
			};
		})
	};
}

it('summarizes identical validation populations across paired rounds', () => {
	const rows = summarizeValidationStorage([sample('object'), sample('arena'), sample('arena', 1), sample('object', 1)]);
	expect(rows).toHaveLength(3);
	expect(rows[0]!.timings[0]).toMatchObject({ objectMs: 1, arenaMs: 2, arenaOverObject: 2 });
});

it('summarizes samples by the phases their own harness timed', () => {
	const without = <T,>(record: Readonly<Record<string, T>>) => Object.fromEntries(Object.entries(record).filter(([phase]) => phase !== 'copy'));
	const older = (storage: NodeStorage, round = 0) => {
		const run = sample(storage, round);
		for (const bucket of run.buckets) Object.assign(bucket, { phases: without(bucket.phases), timings: without(bucket.timings) });
		return run;
	};
	const rows = summarizeValidationStorage([older('object'), older('arena'), older('arena', 1), older('object', 1)]);
	for (const row of rows) expect(row.timings.map((timing) => timing.phase)).toEqual(['validator', 'read', 'build', 'render', 'parse']);
});

it.each(['result', 'cases', 'output', 'calls', 'corpus'] as const)(
	'refuses %s drift even when aggregate pass counts agree',
	(field) => {
		const object = sample('object'),
			arena = sample('arena');
		const bucket = arena.buckets[0]!;
		if (field === 'result') bucket.resultSha256 = 'changed-result';
		else if (field === 'cases') bucket.work.sha256 = 'different-cases';
		else if (field === 'output') bucket.render.calls++;
		else if (field === 'calls') bucket.phases.render.calls++;
		else arena.corpus.sha256 = 'different-corpus';
		expect(() => summarizeValidationStorage([object, arena])).toThrow('workload mismatch');
	}
);

it.each(['read-render-parse', 'factory-render-parse', 'ir-render-parse'] as const)(
	'refuses output drift within %s storage rounds',
	(bucket) => {
		const rows = [sample('object'), sample('arena'), sample('object', 1), sample('arena', 1)];
		rows[3]!.buckets.find((row) => row.bucket === bucket)!.render.sha256 = 'unstable-output';
		expect(() => summarizeValidationStorage(rows)).toThrow('workload mismatch');
	}
);

it.each([0, 1, 2])('requires exact output for bucket index %s across storages', (index) => {
	const object = sample('object'),
		arena = sample('arena');
	arena.buckets[index]!.render.bytes++;
	expect(() => summarizeValidationStorage([object, arena])).toThrow('workload mismatch');
});

it('refuses mismatched or duplicated worker rounds', () => {
	expect(() => summarizeValidationStorage([sample('object'), sample('arena', 1)])).toThrow('unpaired');
	expect(() =>
		summarizeValidationStorage([sample('object'), sample('object'), sample('arena'), sample('arena')])
	).toThrow('unpaired');
});

it.each([
	{ which: 'the first', at: 0 },
	{ which: 'a later', at: 3 }
])('refuses $which sample whose timings miss a phase its profile measured', ({ at }) => {
	const rows = [sample('object'), sample('arena'), sample('arena', 1), sample('object', 1)];
	delete (rows[at]!.buckets[0]!.timings as Partial<ValidationBucketSample['timings']>).render;
	expect(() => summarizeValidationStorage(rows)).toThrow('but its profile measured');
});

it('refuses a sample that times a phase its profile did not measure', () => {
	const rows = [sample('object'), sample('arena')];
	(rows[1]!.buckets[2]!.timings as Record<string, number[]>).extra = [1];
	expect(() => summarizeValidationStorage(rows)).toThrow('but its profile measured');
});

it('summarizes a harness that measures no copy phase', () => {
	const rows = [sample('object'), sample('arena')];
	for (const row of rows)
		for (const bucket of row.buckets) {
			delete (bucket.phases as Partial<typeof bucket.phases>).copy;
			delete (bucket.timings as Partial<ValidationBucketSample['timings']>).copy;
		}
	expect(summarizeValidationStorage(rows)[0]!.timings.map((row) => row.phase)).toEqual(['validator', 'read', 'build', 'render', 'parse']);
});

it('requires all three canonical buckets even if both storages omit the same one', () => {
	const object = sample('object'),
		arena = sample('arena');
	object.buckets.pop();
	arena.buckets.pop();
	expect(() => summarizeValidationStorage([object, arena])).toThrow('missing validation bucket');
});
