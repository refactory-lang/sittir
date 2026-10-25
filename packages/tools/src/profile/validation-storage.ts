import type { GrammarName } from '@sittir/codegen/grammars';
import { roundtripPhases, type RoundtripProfile } from '../validate/roundtrip-profile.ts';
import { median, type corpusFingerprint } from './storage-common.ts';
import type { Construction } from '../validate/common.ts';

export const validationBuckets = ['read-render-parse', 'factory-render-parse', 'ir-render-parse'] as const;
export const validationPhases = ['validator', ...roundtripPhases] as const;
export type ValidationBucket = (typeof validationBuckets)[number];
export type StorageMode = 'object' | 'arena';
export interface ValidationBucketSample extends ReturnType<RoundtripProfile['finish']> {
	bucket: ValidationBucket;
	resultSha256: string;
	counts: { total: number; pass: number; fail: number; skip: number; astMatchPass: number };
	timings: Record<(typeof validationPhases)[number], number[]>;
}
export interface ValidationStorageRun {
	grammar: GrammarName;
	storage: StorageMode;
	construction: Construction;
	pid: number;
	corpus: ReturnType<typeof corpusFingerprint>;
	buckets: ValidationBucketSample[];
	memory?: {
		baseline: NodeJS.MemoryUsage;
		after: NodeJS.MemoryUsage;
		peakRssBytes: number;
	};
}

export function bucketFingerprint(row: ValidationBucketSample, includeRenderedBytes = true): string {
	return JSON.stringify([
		row.bucket,
		row.resultSha256,
		row.counts,
		row.work,
		includeRenderedBytes ? row.render : { calls: row.render.calls },
		roundtripPhases.map((phase) => [phase, row.phases[phase].calls, row.phases[phase].throws])
	]);
}

export function summarizeValidationStorage(samples: readonly (ValidationStorageRun & { round: number })[]) {
	return [...new Set(samples.map((sample) => sample.grammar))].flatMap((grammar) => {
		const rows = samples.filter((sample) => sample.grammar === grammar);
		const first = rows[0]!;
		if (JSON.stringify(first.buckets.map((bucket) => bucket.bucket)) !== JSON.stringify(validationBuckets))
			throw new Error(`missing validation bucket for ${grammar}`);
		const byMode = (storage: StorageMode) => rows.filter((row) => row.storage === storage);
		const fingerprint = (row: ValidationStorageRun, exactOutput = true) =>
			JSON.stringify([
				row.corpus,
				row.buckets.map((bucket) => bucketFingerprint(bucket, exactOutput || bucket.bucket !== 'read-render-parse'))
			]);
		for (const row of rows) {
			if (
				fingerprint(row, false) !== fingerprint(first, false) ||
				fingerprint(row) !== fingerprint(byMode(row.storage)[0]!)
			)
				throw new Error(`validation workload mismatch for ${grammar}`);
		}
		const rounds = (storage: StorageMode) =>
			byMode(storage)
				.map((row) => row.round)
				.sort((a, b) => a - b);
		if (
			!byMode('object').length ||
			JSON.stringify(rounds('object')) !== JSON.stringify(rounds('arena')) ||
			new Set(rounds('object')).size !== byMode('object').length
		)
			throw new Error(`unpaired validation rounds for ${grammar}`);
		return first.buckets.map((bucket, index) => ({
			grammar,
			bucket: bucket.bucket,
			corpus: first.corpus,
			counts: bucket.counts,
			work: bucket.work,
			render: {
				object: byMode('object')[0]!.buckets[index]!.render,
				arena: byMode('arena')[0]!.buckets[index]!.render
			},
			resultSha256: bucket.resultSha256,
			timings: validationPhases.map((phase) => {
				const values = (storage: StorageMode) =>
					byMode(storage).map((row) => median(row.buckets[index]!.timings[phase]));
				const object = values('object'),
					arena = values('arena');
				const objectMs = median(object),
					arenaMs = median(arena);
				return {
					phase,
					calls: phase === 'validator' ? 1 : bucket.phases[phase].calls,
					throws: phase === 'validator' ? 0 : bucket.phases[phase].throws,
					objectMs,
					arenaMs,
					arenaOverObject: objectMs ? arenaMs / objectMs : null,
					objectRange: [Math.min(...object), Math.max(...object)],
					arenaRange: [Math.min(...arena), Math.max(...arena)]
				};
			})
		}));
	});
}
