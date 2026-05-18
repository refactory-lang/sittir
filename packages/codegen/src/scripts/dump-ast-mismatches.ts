import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';

async function main() {
	const grammar = process.argv[2] ?? 'rust';
	const mode = (process.argv[3] ?? 'deep') as 'deep' | 'shallow';
	const packagesDir = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
	const templatesPath = resolve(packagesDir, grammar, 'templates');
	const r = await validateReadRenderParse(grammar, templatesPath, {
		backend: 'native',
		recursive: mode === 'deep'
	});
	console.log(
		`# ${mode} rrp ${grammar}: pass=${r.pass}/${r.total} astMatchPass=${r.astMatchPass} astMismatches=${r.astMismatches.length}`
	);
	const filter = process.argv[4];
	for (const e of r.astMismatches) {
		if (filter && !e.name.includes(filter)) continue;
		console.log(`MISMATCH\t${e.name}\t${e.message}`);
		if (filter) {
			console.log(`  INPUT:    ${JSON.stringify(e.input ?? '')}`);
			console.log(`  RENDERED: ${JSON.stringify(e.rendered ?? '')}`);
		}
	}
	for (const e of r.errors) {
		console.log(`ERROR\t${e.name}\t${e.message.split('\n')[0]}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
