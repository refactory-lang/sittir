// Writes every corpus entry of a grammar to <out>/<n>.<ext>, one file each, for a tree-sitter CLI parse.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCorpusEntries } from '../../../../packages/tools/src/validate/common.ts';
const [grammar = 'rust', out = 'corpus', ext = 'rs'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
loadCorpusEntries(grammar).forEach((e, i) => writeFileSync(join(out, `${String(i).padStart(4, '0')}.${ext}`), e.source));
