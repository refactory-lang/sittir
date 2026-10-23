// Writes each grammar's corpus sources, as validation loads them, to
// <out>/<grammar>.json: the input throughput.mjs times.
//
//   tsx corpus.mts --out <dir> [--grammars rust,python]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadCorpusEntries } from '../../../../../packages/tools/src/validate/common.ts';

const { values } = parseArgs({ options: { out: { type: 'string' }, grammars: { type: 'string' } } });
if (!values.out) throw new Error('usage: corpus.mts --out <dir> [--grammars rust,python]');
mkdirSync(values.out, { recursive: true });
for (const grammar of (values.grammars ?? 'rust,typescript,python,scm,regex').split(',')) {
	const sources = loadCorpusEntries(grammar).map((entry) => entry.source);
	writeFileSync(join(values.out, `${grammar}.json`), JSON.stringify(sources));
	console.log(`${grammar}: ${sources.length} sources`);
}
