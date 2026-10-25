import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { GrammarName } from '@sittir/codegen/grammars';
import { loadCorpusEntries, loadNativeEngine, useValidationConstruction, useValidationNodeStorage, type Construction } from '../validate/common.ts';
import { validateFactoryStorage } from '../validate/factory-storage.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';
import { RoundtripProfile } from '../validate/roundtrip-profile.ts';
import { collectGarbage, corpusFingerprint } from './storage-common.ts';
import {
	bucketFingerprint,
	validationBuckets,
	validationPhases,
	type StorageMode,
	type ValidationBucketSample,
	type ValidationStorageRun
} from './validation-storage.ts';

export interface ValidationStorageOptions {
	grammar: GrammarName;
	storage: StorageMode;
	construction: Construction;
	warmup: number;
	iterations: number;
}

export async function sampleValidationStorage(options: ValidationStorageOptions): Promise<ValidationStorageRun> {
	useValidationNodeStorage(options.storage);
	useValidationConstruction(options.construction);
	await loadNativeEngine(options.grammar);
	const corpus = corpusFingerprint(loadCorpusEntries(options.grammar));
	await collectGarbage();
	const baseline = process.memoryUsage();
	const buckets: ValidationBucketSample[] = [];
	for (const bucket of validationBuckets) {
		const run = (profile: RoundtripProfile) =>
			bucket === 'read-render-parse'
				? validateReadRenderParse(options.grammar, { recursive: true, profile })
				: validateFactoryStorage(options.grammar, 'native', {
						surface: bucket === 'ir-render-parse' ? 'ir' : 'raw',
						profile
					});
		for (let i = 0; i < options.warmup; i++) await run(new RoundtripProfile());
		let first: ValidationBucketSample | undefined;
		for (let i = 0; i < options.iterations; i++) {
			await collectGarbage();
			const profile = new RoundtripProfile();
			const start = performance.now();
			const result = await run(profile);
			const elapsed = performance.now() - start;
			const recorded = profile.finish();
			const facts = 'render' in result ? result.render : result;
			const { total, pass, astMatchPass } = facts;
			const fail = 'fail' in facts ? facts.fail : total - pass;
			const skip = 'skip' in facts ? facts.skip : 0;
			const sample: ValidationBucketSample = {
				bucket,
				...recorded,
				resultSha256: createHash('sha256').update(JSON.stringify(result)).digest('hex'),
				counts: { total, pass, fail, skip, astMatchPass },
				timings: Object.fromEntries(
					validationPhases.map((phase) => [
						phase,
						[phase === 'validator' ? elapsed : recorded.phases[phase].milliseconds]
					])
				) as ValidationBucketSample['timings']
			};
			if (!sample.work.cases || !sample.render.calls || !sample.phases.parse.calls)
				throw new Error(`empty ${bucket} workload for ${options.grammar}`);
			if (first === undefined) first = sample;
			else {
				if (bucketFingerprint(first) !== bucketFingerprint(sample))
					throw new Error(`validation workload drift in ${options.grammar} ${bucket}`);
				for (const phase of validationPhases) first.timings[phase].push(sample.timings[phase][0]!);
			}
		}
		buckets.push(first!);
	}
	await collectGarbage();
	const memory = { baseline, after: process.memoryUsage(), peakRssBytes: process.resourceUsage().maxRSS * 1024 };
	return { grammar: options.grammar, storage: options.storage, construction: options.construction, pid: process.pid, corpus, buckets, memory };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const options = JSON.parse(process.argv[2] ?? '{}') as ValidationStorageOptions;
	process.stdout.write(`${JSON.stringify(await sampleValidationStorage(options))}\n`);
}
