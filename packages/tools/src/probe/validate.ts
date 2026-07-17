/**
 * probe/validate — probe a single tree-sitter corpus entry through the full
 * read → wrap → render → reparse pipeline, with `--trace` output for diagnosis.
 * Thin wrapper around probe-kind that resolves the source from the corpus by
 * entry name (or from the validator's first-failing entry).
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpusEntries, type CorpusEntry } from '../validate/common.ts';
import { run as runProbeKind } from './kind.ts';

type Engine = 'native' | 'js' | 'both';

export interface ProbeValidateOptions {
	grammar: string;
	engine: string;
	entry?: string;
	entryPattern?: string;
	firstFailing: boolean;
	source?: string;
	stdin: boolean;
	trace: boolean;
	pretty: boolean;
	noRender: boolean;
	noWrap: boolean;
}

export async function run(opts: ProbeValidateOptions): Promise<number> {
	const grammar = opts.grammar;
	const engine = (opts.engine as Engine) ?? 'native';

	let source = opts.source;
	let entryName: string | undefined;

	if (!source && !opts.stdin) {
		const selector =
			(opts.entry !== undefined && 'entry') ||
			(opts.entryPattern !== undefined && 'entry-pattern') ||
			(opts.firstFailing && 'first-failing') ||
			null;
		if (!selector) {
			process.stderr.write('probe-validate: provide --source, --stdin, --entry, --entry-pattern, or --first-failing\n');
			return 1;
		}

		const entries = loadCorpusEntries(grammar);
		let target: CorpusEntry | undefined;
		if (selector === 'entry') {
			target = entries.find((e) => e.name === opts.entry);
			if (!target) {
				process.stderr.write(`probe-validate: no corpus entry named ${JSON.stringify(opts.entry)} in ${grammar}\n`);
				return 1;
			}
		} else if (selector === 'entry-pattern') {
			const re = new RegExp(opts.entryPattern as string);
			target = entries.find((e) => re.test(e.name));
			if (!target) {
				process.stderr.write(`probe-validate: no corpus entry matching /${opts.entryPattern}/ in ${grammar}\n`);
				return 1;
			}
		} else if (selector === 'first-failing') {
			const { validateReadRenderParse } = await import('../validate/read-render-parse.ts');
			const templatesPath = defaultTemplatesPath(grammar);
			const result = await validateReadRenderParse(grammar, templatesPath, {
				backend: engine === 'native' ? 'native' : 'js',
				recursive: true
			});
			const firstFail = result.errors[0] ?? result.astMismatches[0];
			if (!firstFail) {
				process.stderr.write(`probe-validate: no failures found for ${grammar} (engine=${engine})\n`);
				return 0;
			}
			const stripKind = (name: string): string => name.replace(/\s*\[[^\]]+\]\s*$/, '');
			const failName = 'name' in firstFail ? firstFail.name : (firstFail.entry ?? firstFail.kind);
			target = entries.find((e) => e.name === failName) ?? entries.find((e) => e.name === stripKind(failName));
			if (!target) {
				process.stderr.write(
					`probe-validate: failing entry ${JSON.stringify(failName)} not found in corpus (renamed?)\n`
				);
				return 1;
			}
		}

		source = target!.source;
		entryName = target!.name;
	}

	if (!source && !opts.stdin) {
		process.stderr.write('probe-validate: failed to resolve source\n');
		return 1;
	}

	if (entryName) {
		process.stderr.write(`# probe-validate: ${grammar} / ${JSON.stringify(entryName)}\n`);
	}

	return await runProbeKind({
		grammar,
		source,
		stdin: opts.stdin,
		kind: undefined,
		range: undefined,
		noRender: opts.noRender,
		noWrap: opts.noWrap,
		reparse: false,
		pretty: opts.pretty,
		baseline: undefined,
		baselineParser: false,
		engine,
		trace: opts.trace,
		logParse: false,
		full: false
	});
}

function defaultTemplatesPath(grammar: string): string {
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	return resolve(packagesDir, grammar, 'templates');
}
