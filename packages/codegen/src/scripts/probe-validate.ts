/**
 * probe-validate — probe a single tree-sitter test corpus entry through the
 * full read → wrap → render → reparse pipeline, with `--trace` output for
 * diagnosis. Thin wrapper around `probe-kind` that resolves the source from
 * the corpus by entry name (or from the validator's first-failing entry).
 *
 * ## Usage
 *
 * Probe a specific corpus entry by name:
 * ```sh
 * npx tsx packages/codegen/src/scripts/probe-validate.ts \
 *     --grammar python --entry 'Identifiers with Greek letters' --trace --pretty
 * ```
 *
 * Probe by regex (first match):
 * ```sh
 * npx tsx packages/codegen/src/scripts/probe-validate.ts \
 *     --grammar typescript --entry-pattern '^Flow.*ambient' --trace --pretty
 * ```
 *
 * Probe the first RT-failing entry for a grammar:
 * ```sh
 * npx tsx packages/codegen/src/scripts/probe-validate.ts \
 *     --grammar rust --first-failing --trace --pretty
 * ```
 *
 * Plain inline source (same as probe-kind):
 * ```sh
 * npx tsx packages/codegen/src/scripts/probe-validate.ts \
 *     --grammar rust --source 'fn f() {}' --trace --pretty
 * ```
 *
 * ## Output
 *
 * Same trace output as `probe-kind --trace`. The corpus entry name is printed
 * to stderr as a header so it can be redirected separately from the trace JSON.
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpusEntries, type CorpusEntry } from '../validate/common.ts';
import { run as runProbeKind } from './probe-kind.ts';

type Engine = 'native' | 'typescript' | 'both';

async function main(argv: string[]): Promise<number> {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string', short: 'g' },
			engine: { type: 'string', short: 'E', default: 'native' },
			entry: { type: 'string', short: 'e' },
			'entry-pattern': { type: 'string' },
			'first-failing': { type: 'boolean', default: false },
			source: { type: 'string', short: 's' },
			stdin: { type: 'boolean', default: false },
			trace: { type: 'boolean', default: true },
			pretty: { type: 'boolean', default: true },
			json: { type: 'boolean', default: false },
			'no-render': { type: 'boolean', default: false },
			'no-wrap': { type: 'boolean', default: false }
		},
		strict: true,
		allowPositionals: false
	});

	if (!values.grammar) {
		process.stderr.write('probe-validate: --grammar <rust|typescript|python> required\n');
		return 1;
	}
	const grammar = values.grammar as string;
	const engine = (values.engine as Engine | undefined) ?? 'native';

	let source = values.source as string | undefined;
	let entryName: string | undefined;

	if (!source && !values.stdin) {
		const selector =
			(values.entry && 'entry') ||
			(values['entry-pattern'] && 'entry-pattern') ||
			(values['first-failing'] && 'first-failing') ||
			null;
		if (!selector) {
			process.stderr.write(
				'probe-validate: provide --source, --stdin, --entry, --entry-pattern, or --first-failing\n'
			);
			return 1;
		}

		const entries = loadCorpusEntries(grammar);
		let target: CorpusEntry | undefined;
		if (selector === 'entry') {
			target = entries.find((e) => e.name === values.entry);
			if (!target) {
				process.stderr.write(
					`probe-validate: no corpus entry named ${JSON.stringify(values.entry)} in ${grammar}\n`
				);
				return 1;
			}
		} else if (selector === 'entry-pattern') {
			const re = new RegExp(values['entry-pattern'] as string);
			target = entries.find((e) => re.test(e.name));
			if (!target) {
				process.stderr.write(
					`probe-validate: no corpus entry matching /${values['entry-pattern']}/ in ${grammar}\n`
				);
				return 1;
			}
		} else if (selector === 'first-failing') {
			const { validateReadRenderParse } = await import('../validate/read-render-parse.ts');
			const templatesPath = defaultTemplatesPath(grammar);
			const result = await validateReadRenderParse(grammar, templatesPath, {
				backend: engine === 'native' ? 'native' : 'typescript',
				recursive: true
			});
			const firstFail = result.errors[0] ?? result.astMismatches[0];
			if (!firstFail) {
				process.stderr.write(
					`probe-validate: no failures found for ${grammar} (engine=${engine})\n`
				);
				return 0;
			}
			// Validator's error.name is formatted as "<corpus entry> [<kind>]".
			// Try exact match first, then strip the `[<kind>]` suffix.
			const stripKind = (name: string): string => name.replace(/\s*\[[^\]]+\]\s*$/, '');
			const failName = firstFail.name;
			target =
				entries.find((e) => e.name === failName) ??
				entries.find((e) => e.name === stripKind(failName));
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

	if (!source && !values.stdin) {
		process.stderr.write('probe-validate: failed to resolve source\n');
		return 1;
	}

	if (entryName) {
		process.stderr.write(`# probe-validate: ${grammar} / ${JSON.stringify(entryName)}\n`);
	}

	const probeArgv: string[] = ['--grammar', grammar, '--engine', engine];
	if (source !== undefined) {
		probeArgv.push('--source', source);
	} else if (values.stdin) {
		probeArgv.push('--stdin');
	}
	if (values.trace) probeArgv.push('--trace');
	if (values.pretty) probeArgv.push('--pretty');
	if (values.json) probeArgv.push('--json');
	if (values['no-render']) probeArgv.push('--no-render');
	if (values['no-wrap']) probeArgv.push('--no-wrap');

	return await runProbeKind(probeArgv);
}

function defaultTemplatesPath(grammar: string): string {
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	return resolve(packagesDir, grammar, 'templates');
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
	main(process.argv.slice(2))
		.then((code) => process.exit(code))
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}

export async function run(argv: string[]): Promise<number> {
	return main(argv);
}
