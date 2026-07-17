import { resolve } from 'node:path';

const VALID_WHICH = ['all', 'from', 'rt', 'cov', 'factory'] as const;
type Which = (typeof VALID_WHICH)[number];

export interface DiffFailuresOptions {
	grammar: string;
	which: string;
}

export async function run(opts: DiffFailuresOptions): Promise<number> {
	const { validateFactoryRenderParse } = await import('./factory-render-parse.ts');
	const { validateFrom } = await import('./from.ts');
	const { validateReadRenderParse } = await import('./read-render-parse.ts');
	const { validateTemplateCoverage } = await import('./template-coverage.ts');

	const which = (VALID_WHICH.includes(opts.which as Which) ? opts.which : 'all') as Which;
	const tp = resolve(new URL('../../../..', import.meta.url).pathname, `packages/${opts.grammar}/templates`);

	if (which === 'all' || which === 'from') {
		const r = await validateFrom(opts.grammar);
		console.log(`\n=== FROM (${r.pass}/${r.total}) ===`);
		for (const e of r.errors) console.log(`  ${e.severity === 'error' ? 'E' : 'W'} ${e.kind}: ${e.message}`);
	}
	if (which === 'all' || which === 'rt') {
		const r = await validateReadRenderParse(opts.grammar, tp, { backend: 'native' });
		console.log(`\n=== READ_RENDER_PARSE (${r.pass}/${r.total}, ast=${r.astMatchPass}) ===`);
		for (const e of r.errors) console.log(`  E ${e.name}: ${e.message}`);
		console.log(`-- AST mismatches --`);
		for (const e of r.astMismatches) console.log(`  M ${e.entry ? `${e.entry} (${e.kind})` : e.kind}: ${e.message}`);
	}
	if (which === 'all' || which === 'cov') {
		const r = validateTemplateCoverage(opts.grammar, tp);
		console.log(`\n=== COV (${r.pass}/${r.total}) ===`);
		for (const i of r.issues) console.log(`  ${i.type === 'literal-leak' ? 'W' : 'E'} ${i.kind}: ${i.message}`);
	}
	if (which === 'all' || which === 'factory') {
		const r = await validateFactoryRenderParse(opts.grammar, tp);
		console.log(`\n=== FACTORY_RENDER_PARSE (${r.pass}/${r.total}, ast=${r.astMatchPass}) ===`);
		for (const e of r.errors) console.log(`  E ${e.kind}: ${e.message}`);
	}
	return 0;
}
