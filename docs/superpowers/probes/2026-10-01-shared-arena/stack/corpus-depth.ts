// The deepest entries of a grammar's corpus, by parse-tree depth: the source
// the typed read's stack gate measures at depth, beside the synthetic nesting.
// With --write it saves the deepest entry's source as inputs/<grammar>-deepest.txt,
// the file typed_read_nesting.rs reads.
// Usage (from the repo root): pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/stack/corpus-depth.ts [grammar] [top] [--write]
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadCorpusEntries, loadLanguageForGrammar, type TSNode, type TSTree } from '../../../../../packages/tools/src/validate/common.ts';

const grammar = process.argv[2] ?? 'rust';
const top = Number(process.argv[3] ?? 5);
const depth = (node: TSNode): number => 1 + Math.max(0, ...node.children.map(depth));
const { Parser, lang } = await loadLanguageForGrammar(grammar);
const parser = new Parser();
parser.setLanguage(lang);
const rows = loadCorpusEntries(grammar).map((entry) => ({ name: entry.name, source: entry.source, depth: depth((parser.parse(entry.source) as TSTree).rootNode), bytes: Buffer.byteLength(entry.source, 'utf8') }));
rows.sort((a, b) => b.depth - a.depth);
for (const row of rows.slice(0, top)) console.log(`${row.depth}\t${row.bytes}\t${row.name}`);
if (process.argv.includes('--write') && rows[0] !== undefined) {
	const dir = new URL('./inputs/', import.meta.url);
	mkdirSync(dir, { recursive: true });
	writeFileSync(new URL(`${grammar}-deepest.txt`, dir), rows[0].source);
	console.log(`wrote inputs/${grammar}-deepest.txt: ${rows[0].name}`);
}
