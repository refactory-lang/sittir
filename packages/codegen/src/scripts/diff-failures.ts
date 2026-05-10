/**
 * Dump per-kind validator failures for a grammar.
 * Usage: npx tsx packages/codegen/src/scripts/diff-failures.ts <grammar> [which]
 *   which: from|rt|cov|factory (default: all)
 */

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateFactoryRenderParse } from '../validate/factory-render-parse.ts';
import { validateFrom } from '../validate/from.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';
import { validateTemplateCoverage } from '../validate/template-coverage.ts';

const VALID_WHICH = ['all', 'from', 'rt', 'cov', 'factory'] as const;
type Which = (typeof VALID_WHICH)[number];

export async function run(argv: string[]): Promise<number> {
	const [grammar, which = 'all'] = argv;
	if (!grammar || !VALID_WHICH.includes(which as Which)) {
		console.error('Usage: diff-failures.ts <grammar> [from|rt|cov|factory|all]');
		return 1;
	}
	const tp = resolve(new URL('../../../..', import.meta.url).pathname, `packages/${grammar}/templates`);

	if (which === 'all' || which === 'from') {
		const r = await validateFrom(grammar);
		console.log(`\n=== FROM (${r.pass}/${r.total}) ===`);
		for (const e of r.errors) console.log(`  ${e.severity === 'error' ? 'E' : 'W'} ${e.kind}: ${e.message}`);
	}
	if (which === 'all' || which === 'rt') {
		const r = await validateReadRenderParse(grammar, tp);
		console.log(`\n=== READ_RENDER_PARSE (${r.pass}/${r.total}, ast=${r.astMatchPass}) ===`);
		for (const e of r.errors) console.log(`  E ${e.name}: ${e.message}`);
		console.log(`-- AST mismatches --`);
		for (const e of r.astMismatches) console.log(`  M ${e.name}: ${e.message}`);
	}
	if (which === 'all' || which === 'cov') {
		const r = validateTemplateCoverage(grammar, tp);
		console.log(`\n=== COV (${r.pass}/${r.total}) ===`);
		for (const i of r.issues) console.log(`  ${i.type === 'literal-leak' ? 'W' : 'E'} ${i.kind}: ${i.message}`);
	}
	if (which === 'all' || which === 'factory') {
		const r = await validateFactoryRenderParse(grammar, tp);
		console.log(`\n=== FACTORY_RENDER_PARSE (${r.pass}/${r.total}, ast=${r.astMatchPass}) ===`);
		for (const e of r.errors) console.log(`  E ${e.kind}: ${e.message}`);
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
	process.exit(await run(process.argv.slice(2)));
}
