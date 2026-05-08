/**
 * Per-grammar validator counts — reports raw totals (pass/total) for
 * every validator without the floor-based pass/fail noise. Run after
 * every codegen change when iterating.
 *
 * Usage: npx tsx packages/codegen/src/scripts/counts.ts [grammar...]
 * If no grammar args given, runs all three.
 */

import { resolve } from 'node:path';
import { validateFactoryRenderParse } from '../validate/factory-render-parse.ts';
import { validateFrom } from '../validate/from.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';
import { validateTemplateCoverage } from '../validate/template-coverage.ts';

function templatesPath(grammar: string): string {
	return resolve(new URL('../../../..', import.meta.url).pathname, `packages/${grammar}/templates`);
}

async function runGrammar(grammar: string): Promise<string> {
	const tp = templatesPath(grammar);
	const [from, rt, cov, fac] = await Promise.all([
		validateFrom(grammar, 'native'),
		validateReadRenderParse(grammar, tp, { backend: 'native' }),
		Promise.resolve(validateTemplateCoverage(grammar, tp)),
		validateFactoryRenderParse(grammar, tp, 'native')
	]);
	return [
		`${grammar}:`,
		`  fromPass=${from.pass}    fromTotal=${from.total}`,
		`  covPass=${cov.pass}    covTotal=${cov.total}`,
		`  rtPass=${rt.pass}    rtTotal=${rt.total}    rtAstMatchPass=${rt.astMatchPass}`,
		`  factoryPass=${fac.pass}    factoryTotal=${fac.total}    factoryAstMatchPass=${fac.astMatchPass}`
	].join('\n');
}

const args = process.argv.slice(2);
const grammars = args.length ? args : ['rust', 'typescript', 'python'];

for (const g of grammars) {
	try {
		const report = await runGrammar(g);
		console.log(report);
	} catch (e) {
		console.log(`${g}: ERROR ${(e as Error).message}`);
	}
}
