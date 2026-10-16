// Each witness against three judges: sittir's parser (packages/<g>/.sittir/parser.wasm), the
// upstream parser the grammar is built from (`upstreamWasmPath`: .sittir/upstream.wasm, built from
// base.ts by the same CLI), and the language's compiler
// (tsc, CPython's compile, rustc). Writes results/<grammar>.tsv and prints the over-accepted rows.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judges, removeScratch } from './judges.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
// An over-accepted witness carries its line: `production` when the language's grammar productions
// exclude it, `early-error` when a later check does (early errors, symtable, AST validation).
type Witness = [cls: string, name: string, source: string, line?: string, cite?: string];
const witnesses = JSON.parse(readFileSync(join(HERE, 'witnesses.json'), 'utf8')) as Record<string, Witness[]>;

const toolsRequire = createRequire(join(ROOT, 'packages/tools/package.json'));
const { Parser, Language } = toolsRequire('web-tree-sitter') as typeof import('web-tree-sitter');
await Parser.init();

async function parserFor(wasm: string) {
	const parser = new Parser();
	parser.setLanguage(await Language.load(wasm));
	return (source: string): string => {
		const tree = parser.parse(source);
		if (!tree) return 'no-tree';
		if (!tree.rootNode.hasError) return 'clean';
		const bad: string[] = [];
		const walk = (n: import('web-tree-sitter').Node): void => {
			if (n.isError) bad.push(`ERROR@${n.startPosition.row + 1}:${n.startPosition.column + 1}`);
			else if (n.isMissing) bad.push(`MISSING ${n.type}@${n.startPosition.row + 1}:${n.startPosition.column + 1}`);
			for (const c of n.children) if (c) walk(c);
		};
		walk(tree.rootNode);
		return bad.slice(0, 2).join(' ') || 'error';
	};
}

const { upstreamWasmPath } = await import(join(ROOT, 'packages/tools/src/validate/common.ts'));
const upstream = (g: string): string => upstreamWasmPath(g)!;

for (const [grammar, list] of Object.entries(witnesses)) {
	const sittir = await parserFor(join(ROOT, `packages/${grammar}/.sittir/parser.wasm`));
	const base = await parserFor(upstream(grammar));
	const verdicts = judges[grammar]!(list.map(([, , s]) => s));
	const rows = list.map(([cls, name, source, line = '', cite = ''], i) => ({ cls, name, source, line, cite, sittir: sittir(source), upstream: base(source), compiler: verdicts[i]! }));
	const tsv = ['class\twitness\tsittir\tupstream\tcompiler\tline\tcite\tsource', ...rows.map((r) => [r.cls, r.name, r.sittir, r.upstream, r.compiler, r.line, r.cite, JSON.stringify(r.source)].join('\t'))].join('\n');
	writeFileSync(join(HERE, 'results', `${grammar}.tsv`), `${tsv}\n`);
	const over = rows.filter((r) => r.cls !== 'control' && r.sittir === 'clean' && r.compiler !== 'accepted');
	const control = rows.filter((r) => r.cls === 'control');
	const unsorted = over.filter((r) => !r.line);
	if (unsorted.length > 0) throw new Error(`${grammar}: over-accepted without a line: ${unsorted.map((r) => r.name).join('; ')}`);
	const byLine = Object.groupBy(over, (r) => r.line);
	console.log(`${grammar}: ${rows.length - control.length} witnesses, ${over.length} over-accepted by sittir's parser (${Object.entries(byLine).map(([l, rs]) => `${l} ${rs!.length}`).join(', ')}); control ${control.map((r) => `${r.sittir}/${r.compiler}`).join(', ')}`);
}
// The upstream rows: issues and open PRs from the four trackers, each with a witness where one can
// be written. Only the compiler's syntax errors count here, so a witness's unresolved names do not
// read as a rejection.
type UpstreamRow = { grammar: string; refs: string[]; class: string; title: string; witness: string | null; route: number; line?: string; note?: string };
const syntaxOnly: Record<string, (verdict: string) => boolean> = {
	typescript: (v) => v.split(' | ').some((e) => /^TS(1\d{3}|17\d{3}|18\d{3}|618[89]) /.test(e)),
	python: (v) => v.startsWith('SyntaxError'),
	rust: (v) => v.split(' | ').some((e) => e.startsWith('error:'))
};
const upstreamRows = JSON.parse(readFileSync(join(HERE, 'upstream-rows.json'), 'utf8')) as UpstreamRow[];
const upstreamOut = ['grammar\tclass\trefs\ttitle\troute\tline\tsittir\tupstream\tcompiler\tobserved\tnote'];
for (const grammar of ['typescript', 'rust', 'python']) {
	const rows = upstreamRows.filter((r) => r.grammar === grammar);
	const sittir = await parserFor(join(ROOT, `packages/${grammar}/.sittir/parser.wasm`));
	const base = await parserFor(upstream(grammar));
	const withWitness = rows.filter((r) => r.witness !== null);
	const verdicts = judges[grammar]!(withWitness.map((r) => r.witness!));
	for (const r of rows) {
		const i = withWitness.indexOf(r);
		const parse = r.witness === null ? '-' : sittir(r.witness);
		const verdict = i < 0 ? '-' : verdicts[i]!;
		const rejects = i < 0 ? undefined : syntaxOnly[grammar]!(verdict);
		const observed =
			r.witness === null ? 'not witnessed'
			: parse === 'clean' && rejects ? 'over-accepted'
			: parse !== 'clean' && !rejects ? 'under-accepted'
			: parse === 'clean' ? 'parses clean'
			: 'both reject';
		upstreamOut.push([grammar, r.class, r.refs.join(', '), r.title, r.route, r.line ?? 'production', parse, r.witness === null ? '-' : base(r.witness), rejects === undefined ? '-' : rejects ? `rejects: ${verdict}` : 'accepts', observed, r.note ?? ''].join('\t'));
	}
}
writeFileSync(join(HERE, 'results', 'upstream.tsv'), `${upstreamOut.join('\n')}\n`);
console.log(`upstream: ${upstreamOut.length - 1} rows`);
removeScratch();
