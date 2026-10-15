// Each witness against three judges: sittir's parser (packages/<g>/.sittir/parser.wasm), the
// upstream parser the grammar is built from (tree-sitter-<g>.wasm), and the language's compiler
// (tsc, CPython's compile, rustc). Writes results/<grammar>.tsv and prints the over-accepted rows.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
type Witness = [cls: string, name: string, source: string];
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

const scratch = mkdtempSync(join(tmpdir(), 'over-acceptance-'));

function tscVerdicts(sources: string[]): string[] {
	// One program per witness: tsc skips the checker's grammar errors (TS1054 and its kin)
	// for the whole program once any file has a syntax error.
	writeFileSync(join(scratch, 'm.ts'), 'export type A = { x: 1 };\nexport type B<T = unknown> = T;\nexport default 0;\n');
	return sources.map((s, i) => {
		const f = join(scratch, `w${i}.ts`);
		writeFileSync(f, s);
		const r = spawnSync(join(ROOT, 'node_modules/.bin/tsc'), ['--ignoreConfig', '--noEmit', '--pretty', 'false', '--strict', '--target', 'esnext', '--module', 'esnext', '--moduleResolution', 'bundler', '--experimentalDecorators', '--skipLibCheck', f], { encoding: 'utf8' });
		const errors = `${r.stdout}${r.stderr}`
			.split('\n')
			.map((line) => /w\d+\.ts\(\d+,\d+\): error (TS\d+): (.*)$/.exec(line))
			.filter((m): m is RegExpExecArray => m !== null)
			.map((m) => `${m[1]} ${m[2]}`);
		return errors.join(' | ') || 'accepted';
	});
}

function pythonVerdicts(sources: string[]): string[] {
	const out = execFileSync('python3', ['-I', '-c', 'import json,sys\nr=[]\nfor s in json.load(sys.stdin):\n  try:\n    compile(s,"<w>","exec"); r.append("accepted")\n  except SyntaxError as e:\n    r.append(f"SyntaxError: {e.msg}")\nprint(json.dumps(r))'], { input: JSON.stringify(sources), encoding: 'utf8' });
	return JSON.parse(out) as string[];
}

function rustVerdicts(sources: string[]): string[] {
	return sources.map((s, i) => {
		const f = join(scratch, `w${i}.rs`);
		writeFileSync(f, s);
		const r = spawnSync('rustc', ['--edition', '2024', '--crate-type', 'lib', '--emit=metadata', '-o', join(scratch, `w${i}.rmeta`), f], { encoding: 'utf8' });
		const errors = r.stderr.split('\n').filter((l) => l.startsWith('error')).filter((l) => !l.startsWith('error: aborting'));
		return errors.join(' | ') || 'accepted';
	});
}

const judges: Record<string, (s: string[]) => string[]> = { typescript: tscVerdicts, python: pythonVerdicts, rust: rustVerdicts };
const upstream = (g: string) => createRequire(join(ROOT, `packages/${g}/package.json`)).resolve(`tree-sitter-${g}/tree-sitter-${g}.wasm`);

for (const [grammar, list] of Object.entries(witnesses)) {
	const sittir = await parserFor(join(ROOT, `packages/${grammar}/.sittir/parser.wasm`));
	const base = await parserFor(upstream(grammar));
	const verdicts = judges[grammar]!(list.map(([, , s]) => s));
	const rows = list.map(([cls, name, source], i) => ({ cls, name, source, sittir: sittir(source), upstream: base(source), compiler: verdicts[i]! }));
	const tsv = ['class\twitness\tsittir\tupstream\tcompiler\tsource', ...rows.map((r) => [r.cls, r.name, r.sittir, r.upstream, r.compiler, JSON.stringify(r.source)].join('\t'))].join('\n');
	writeFileSync(join(HERE, 'results', `${grammar}.tsv`), `${tsv}\n`);
	const over = rows.filter((r) => r.cls !== 'control' && r.sittir === 'clean' && r.compiler !== 'accepted');
	const control = rows.filter((r) => r.cls === 'control');
	console.log(`${grammar}: ${rows.length - control.length} witnesses, ${over.length} over-accepted by sittir's parser; control ${control.map((r) => `${r.sittir}/${r.compiler}`).join(', ')}`);
}
// The upstream rows: issues and open PRs from the four trackers, each with a witness where one can
// be written. Only the compiler's syntax errors count here, so a witness's unresolved names do not
// read as a rejection.
type UpstreamRow = { grammar: string; refs: string[]; class: string; title: string; witness: string | null; route: number; note?: string };
const syntaxOnly: Record<string, (verdict: string) => boolean> = {
	typescript: (v) => v.split(' | ').some((e) => /^TS(1\d{3}|17\d{3}|18\d{3}|618[89]) /.test(e)),
	python: (v) => v.startsWith('SyntaxError'),
	rust: (v) => v.split(' | ').some((e) => e.startsWith('error:'))
};
const upstreamRows = JSON.parse(readFileSync(join(HERE, 'upstream-rows.json'), 'utf8')) as UpstreamRow[];
const upstreamOut = ['grammar\tclass\trefs\ttitle\troute\tsittir\tupstream\tcompiler\tobserved\tnote'];
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
		upstreamOut.push([grammar, r.class, r.refs.join(', '), r.title, r.route, parse, r.witness === null ? '-' : base(r.witness), rejects === undefined ? '-' : rejects ? `rejects: ${verdict}` : 'accepts', observed, r.note ?? ''].join('\t'));
	}
}
writeFileSync(join(HERE, 'results', 'upstream.tsv'), `${upstreamOut.join('\n')}\n`);
console.log(`upstream: ${upstreamOut.length - 1} rows`);
rmSync(scratch, { recursive: true, force: true });
