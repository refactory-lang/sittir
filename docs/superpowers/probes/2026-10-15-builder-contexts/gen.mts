// Writes a workload of N functions to <out>/workload-<variant>.ts, each nesting loops, conditions,
// awaits and calls to depth D, then prints tsc's diagnostics for both signature variants.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [out, N = '300', D = '4'] = process.argv.slice(2);
const n = Number(N), d = Number(D);
const nest = (k: number): string =>
	k === 0
		? `exprS(awaitE(call(ident('g'), bin(ident('a'), ident('b')))))`
		: `whileS({ condition: paren(bin(ident('i'), ident('n'))), body: block(ifS({ condition: paren(awaitE(call(ident('h'), ident('x')))), consequence: block(breakS()) }), ${nest(k - 1)}) })`;
mkdirSync(out, { recursive: true });
const here = resolve(import.meta.dirname);
for (const variant of ['plain', 'contexts']) {
	const lines = [`import { awaitE, bin, block, breakS, call, exprS, fn, ident, ifS, paren, returnS, whileS } from '${join(here, `signatures-${variant}.ts`)}';`];
	for (let i = 0; i < n; i++) lines.push(`export const f${i} = fn({ name: 'f${i}', async: true, body: block(${nest(d)}, returnS(bin(ident('a'), awaitE(ident('p'))))) });`);
	writeFileSync(join(out, `workload-${variant}.ts`), `${lines.join('\n')}\n`);
}
