import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ProbeParityOptions {
	grammar: string;
	target: string;
}

export async function run(opts: ProbeParityOptions): Promise<number> {
	const { validateReadRenderParse } = await import('../validate/read-render-parse.ts');
	const packagesDir = fileURLToPath(new URL('../../../', import.meta.url));
	const templatesPath = resolve(packagesDir, opts.grammar, 'templates');

	const covered = new Set<string>();
	const r = await validateReadRenderParse(opts.grammar, templatesPath, {
		backend: 'native',
		onFixture: (fx) => {
			if (fx.kind === 'roundtrip') covered.add(fx.pattern);
		}
	});

	console.log(`[${opts.grammar}] read-render-parse kinds covered: ${covered.size}`);
	console.log(`  target '${opts.target}' covered: ${covered.has(opts.target)}`);
	const variantChildren = [...covered].filter((k) => k.startsWith(`_${opts.target}_`));
	console.log(`  variant children covered:`, variantChildren);
	console.log(
		`  all errors involving '${opts.target}':`,
		r.errors
			.filter((e) => e.name.includes(opts.target))
			.slice(0, 5)
			.map((e) => e.name)
	);
	console.log(
		`  all astMismatches involving '${opts.target}':`,
		r.astMismatches
			.filter((e) => e.name.includes(opts.target))
			.slice(0, 5)
			.map((e) => e.name)
	);
	console.log(`  pass=${r.pass}/${r.total} astMatchPass=${r.astMatchPass} skip=${r.skip}`);
	console.log();
	console.log(`Sample of covered kinds:`, [...covered].slice(0, 20).sort());
	return 0;
}
