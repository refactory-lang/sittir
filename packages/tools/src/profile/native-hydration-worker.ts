import { fileURLToPath } from 'node:url';
import type { GrammarName } from '@sittir/codegen/grammars';
import { languageByName } from '../languages.ts';
import { loadCorpusEntries } from '../validate/common.ts';
import { nativeBackendOf } from '../validate/layout-runs.ts';
import { sampleNativeHydration, type HydrationDepth, type NativeHydrationSample } from './native-hydration.ts';
import { collectGarbage, corpusFingerprint } from './storage-common.ts';

export interface NativeHydrationOptions {
	grammar: GrammarName;
	depth: HydrationDepth;
	warmup: number;
	iterations: number;
	limit?: number;
}

export interface NativeHydrationRun extends NativeHydrationSample {
	grammar: GrammarName;
	pid: number;
	corpus: ReturnType<typeof corpusFingerprint>;
}

export async function sampleNative(options: NativeHydrationOptions): Promise<NativeHydrationRun> {
	await (await languageByName(options.grammar)).load();
	const entries = loadCorpusEntries(options.grammar).slice(0, options.limit);
	const sample = await sampleNativeHydration(
		await nativeBackendOf(options.grammar),
		entries,
		options.depth,
		options.warmup,
		options.iterations,
		collectGarbage
	);
	return { ...sample, grammar: options.grammar, pid: process.pid, corpus: corpusFingerprint(entries) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const options: NativeHydrationOptions = JSON.parse(process.argv[2]!);
	process.stdout.write(`${JSON.stringify(await sampleNative(options))}\n`);
}
