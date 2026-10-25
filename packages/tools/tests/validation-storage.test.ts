import { expect, it } from 'vitest';
import { RoundtripProfile } from '../src/validate/roundtrip-profile.ts';
import {
	summarizeValidationStorage,
	validationBuckets,
	validationPhases,
	type StorageMode,
	type ValidationBucketSample,
	type ValidationStorageRun
} from '../src/profile/validation-storage.ts';

function sample(storage: StorageMode, round = 0): ValidationStorageRun & { round: number } {
	return {
		grammar: 'regex',
		storage,
		construction: 'objects',
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

it('retains different deep-read formatting across storages when work and canonical results agree', () => {
	const object = sample('object'),
		arena = sample('arena');
	arena.buckets[0]!.render.bytes++;
	arena.buckets[0]!.render.sha256 = 'native-source-formatting';
	const rows = summarizeValidationStorage([object, arena]);
	expect(rows[0]!.render).toEqual({ object: object.buckets[0]!.render, arena: arena.buckets[0]!.render });
});

it.each(['read-render-parse', 'factory-render-parse', 'ir-render-parse'] as const)(
	'refuses output drift within %s storage rounds',
	(bucket) => {
		const rows = [sample('object'), sample('arena'), sample('object', 1), sample('arena', 1)];
		rows[3]!.buckets.find((row) => row.bucket === bucket)!.render.sha256 = 'unstable-output';
		expect(() => summarizeValidationStorage(rows)).toThrow('workload mismatch');
	}
);

it.each([1, 2])('requires exact built output for bucket index %s across storages', (index) => {
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

it('requires all three canonical buckets even if both storages omit the same one', () => {
	const object = sample('object'),
		arena = sample('arena');
	object.buckets.pop();
	arena.buckets.pop();
	expect(() => summarizeValidationStorage([object, arena])).toThrow('missing validation bucket');
});
