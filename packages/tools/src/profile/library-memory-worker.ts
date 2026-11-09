import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Language, LanguageAPI } from '@sittir/types';
import { SAMPLE_SOURCE } from '../sample-source.ts';
import { collectGarbage } from './storage-common.ts';

export interface LibraryMemoryOptions {
	readonly tree: string;
	readonly grammars: readonly string[];
}

export interface LibraryMemoryRun {
	readonly grammars: readonly string[];
	readonly pid: number;
	readonly rssBytes: number;
}

export async function sampleLibraryMemory(options: LibraryMemoryOptions): Promise<LibraryMemoryRun> {
	for (const grammar of options.grammars) {
		const source = SAMPLE_SOURCE[grammar];
		if (source === undefined) throw new Error(`no sample source for grammar '${grammar}'`);
		const entry = pathToFileURL(join(options.tree, 'packages', grammar, 'dist', 'index.js')).href;
		const language = ((await import(entry)) as { readonly default: Language<LanguageAPI> }).default;
		if (language.createEngine === undefined) throw new Error(`${entry} exports no createEngine`);
		const engine = await language.createEngine();
		engine.render(engine.parse(source));
	}
	await collectGarbage();
	return { grammars: options.grammars, pid: process.pid, rssBytes: process.memoryUsage().rss };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const options = JSON.parse(process.argv[2] ?? '{}') as LibraryMemoryOptions;
	process.stdout.write(`${JSON.stringify(await sampleLibraryMemory(options))}\n`);
}
