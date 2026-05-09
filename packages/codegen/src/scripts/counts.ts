/**
 * Compatibility shim — local wrapper for validator counts.
 *
 * Kept inside `@sittir/codegen` so historical script paths continue to work
 * without importing the separate `packages/validator` package into the codegen
 * build graph.
 */
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateFrom } from '../validate/from.ts';
import { validateTemplateCoverage } from '../validate/template-coverage.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';
import { validateFactoryRenderParse } from '../validate/factory-render-parse.ts';

type Grammar = 'rust' | 'typescript' | 'python';

const ALL_GRAMMARS: readonly Grammar[] = ['rust', 'typescript', 'python'];

function resolveGrammars(args: readonly string[]): Grammar[] {
	const valid = args.filter((arg): arg is Grammar => ALL_GRAMMARS.includes(arg as Grammar));
	return valid.length > 0 ? valid : [...ALL_GRAMMARS];
}

function defaultTemplatesPath(grammar: Grammar): string {
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	return resolve(packagesDir, grammar, 'templates');
}

export async function run(argv: string[]): Promise<number> {
	for (const grammar of resolveGrammars(argv)) {
		const templatesPath = defaultTemplatesPath(grammar);
		const [from, rt, cov, fac] = await Promise.all([
			validateFrom(grammar, 'native'),
			validateReadRenderParse(grammar, templatesPath, { backend: 'native' }),
			Promise.resolve(validateTemplateCoverage(grammar, templatesPath)),
			validateFactoryRenderParse(grammar, templatesPath, 'native')
		]);
		console.log([
			`${grammar}:`,
			`  fromPass=${from.pass}    fromTotal=${from.total}`,
			`  covPass=${cov.pass}    covTotal=${cov.total}`,
			`  rtPass=${rt.pass}    rtTotal=${rt.total}    rtAstMatchPass=${rt.astMatchPass}`,
			`  factoryPass=${fac.pass}    factoryTotal=${fac.total}    factoryAstMatchPass=${fac.astMatchPass}`
		].join('\n'));
	}
	return 0;
}

const isCli = (() => {
	if (process.argv[1] == null) return false;
	try {
		return pathToFileURL(process.argv[1]).href === import.meta.url;
	} catch {
		return false;
	}
})();

if (isCli) {
	await run(process.argv.slice(2));
}
