import { fileURLToPath } from 'node:url';
import { DOGFOOD_REBUILDS } from '../emit/dogfood-targets.ts';
import { run } from '../emit/factory-source.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

let code = 0;
for (const { grammar, source, surface, exportName, file } of DOGFOOD_REBUILDS) {
	code = Math.max(code, await run({ grammar, file: ROOT + source, surface, exportName, out: ROOT + file }));
	process.stdout.write(`${file} ← ${surface} ${source}\n`);
}
process.exitCode = code;
