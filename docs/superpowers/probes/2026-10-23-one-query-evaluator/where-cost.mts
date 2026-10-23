/**
 * One QueryPlan evaluator: the candidates measured on the same corpus rows,
 * conditions and population, each ending with the passing nodes hydrated
 * and wrapped.
 *
 *   tsx where-cost.mts --out <dir> [--runs 7] [--only rows,node,dialect,coverage,built]
 *
 * Variants of a `$descendants.ofType(K).where(…)` row:
 *   native      today's public path: the walk evaluates the plan, recompiled per batch
 *   native-id   the walk evaluates a plan compiled once and held by id
 *   native-es   the same, its patterns in ECMAScript `u` (regress)
 *   spans       the approved spec: the walk returns each kind match's subject
 *               spans, JavaScript slices them and evaluates the plan compiled once
 *   scm         the plan compiled to a tree-sitter query, Rust `regex` predicates
 *   scm-es      the same, its patterns evaluated by regress
 *   js          no pushdown: every kind match hydrated, `holds` through its accessors
 * Writes <out>/where-cost.json and <out>/where-cost.md.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = `${process.cwd()}/`;
const BASE = '5bc3c68cf';
const { values } = parseArgs({ options: { out: { type: 'string' }, runs: { type: 'string' }, only: { type: 'string' } } });
const OUT = resolve(values.out ?? 'where-cost-out');
const RUNS = Number(values.runs ?? 7);
const ONLY = new Set((values.only ?? 'rows,node,dialect,coverage,built').split(','));
mkdirSync(OUT, { recursive: true });

const { createEngine } = await import(`${ROOT}packages/common/src/index.ts`);
const { treeOf } = await import(`${ROOT}packages/common/src/tree-token.ts`);
const { inTreeEngine } = await import(`${ROOT}packages/common/src/engine-scope.ts`);
const { BATCH_LIMITS } = await import(`${ROOT}packages/common/src/query.ts`);
const { holds, slotItems } = await import(`${ROOT}packages/common/src/query-holds.ts`);
const { nodeAddressOf, hydrateWith } = await import(`${ROOT}packages/common/src/utils.ts`);
const { nodeText, spanOf } = await import(`${ROOT}packages/common/src/node-data.ts`);
const { spanSlicer } = await import(`${ROOT}packages/common/src/span.ts`);

type Plan = any;
type Cond = readonly ['eq' | 'match', string, string] | readonly ['and' | 'or', Cond, Cond] | readonly ['not', Cond];
interface Row {
	readonly label: string;
	readonly kind: string;
	readonly cond: Cond;
}

const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
function time(fn: () => number): { ms: number; count: number } {
	let count = fn();
	const samples: number[] = [];
	for (let i = 0; i < RUNS; i++) {
		const t = performance.now();
		count = fn();
		samples.push(performance.now() - t);
	}
	return { ms: median(samples), count };
}
const pascal = (kind: string): string => kind.replace(/(^|_)([a-z])/g, (_: string, __: string, c: string) => c.toUpperCase());

// --- grammars ---------------------------------------------------------------

async function grammarOf(name: string) {
	const language = (await import(`${ROOT}packages/${name}/src/index.ts`)).default;
	const engine = await createEngine(language);
	const { wrapNode } = await import(`${ROOT}packages/${name}/src/wrap.ts`);
	const { TSKindId } = await import(`${ROOT}packages/${name}/src/types.ts`);
	const { querySlots } = await import(`${ROOT}packages/${name}/src/utils.ts`);
	const { getActiveBackend } = await import(`${ROOT}packages/${name}/src/backend.ts`);
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`${name}: native backend not active`);
	const probe = new status.native.SittirEngine();
	const kindId = (kind: string): number => {
		const id = TSKindId[pascal(kind)];
		if (id === undefined) throw new Error(`${name}: no kind ${kind}`);
		return id;
	};
	const slot = (kind: number, accessor: string): number => {
		const entry = querySlots[kind]?.find((e: any) => e[0] === accessor);
		if (entry === undefined) throw new Error(`${name}: kind ${kind} has no slot ${accessor}`);
		return entry[1];
	};
	const accessorOf = (kind: number, slotNumber: number): string | undefined => querySlots[kind]?.find((e: any) => e[1] === slotNumber)?.[0];
	return { name, language, engine, wrapNode, TSKindId, querySlots, probe, kindId, slot, accessorOf };
}
type Grammar = Awaited<ReturnType<typeof grammarOf>>;

function planOf(g: Grammar, kind: number, cond: Cond): Plan {
	if (cond[0] === 'eq') return { op: 'eq', text: cond[2], slots: { [kind]: g.slot(kind, cond[1]) } };
	if (cond[0] === 'match') return { op: 'match', pattern: cond[2], slots: { [kind]: g.slot(kind, cond[1]) } };
	if (cond[0] === 'not') return { op: 'not', of: planOf(g, kind, cond[1]) };
	return { op: cond[0], of: [planOf(g, kind, cond[1]), planOf(g, kind, cond[2])] };
}
function whereOf(cond: Cond, r: any): any {
	if (cond[0] === 'eq') return r[cond[1]].eq(cond[2]);
	if (cond[0] === 'match') return r[cond[1]].match(new RegExp(cond[2], 'u'));
	if (cond[0] === 'not') return whereOf(cond[1], r).not();
	return whereOf(cond[1], r)[cond[0]](whereOf(cond[2], r));
}

// A value's text, one definition, as the portable classifier reads it: its
// `$text`, else the slice its span covers in its tree's source; undefined for
// a built or edited compound, which has no span.
const slicers = new WeakMap<object, (span: { start: number; end: number }) => string>();
const sourceText = (value: unknown): string | undefined => {
	const own = nodeText(value);
	if (own !== undefined || value === null || typeof value !== 'object') return own;
	const tree = treeOf(value);
	const span = spanOf(value);
	if (tree?.source === undefined || span === undefined) return undefined;
	let slice = slicers.get(tree);
	if (slice === undefined) slicers.set(tree, (slice = spanSlicer(tree.source)));
	return slice(span);
};

// The texts a slot subject reads on a node, through the node's accessors; a
// keyword's presence reads as the keyword.
const accessorTexts = (g: Grammar, node: any) => (subject: any): string[] => {
	const entry = g.querySlots[node.$type]?.find((e: any) => e[1] === subject.slots[node.$type]);
	if (entry === undefined) return [];
	const [accessor, , keyword] = entry;
	const items = slotItems(node, accessor);
	return keyword == null ? items.flatMap((v: unknown) => sourceText(v) ?? []) : items.flatMap((v: unknown) => (v === true ? [keyword] : []));
};

// A plan compiled once: each `match` holds its RegExp, each subject its index.
type Compiled = (texts: (subject: number) => readonly string[]) => boolean;
function compilePlan(plan: Plan, subjects: any[], keys: string[] = []): Compiled {
	switch (plan.op) {
		case 'eq':
		case 'match':
		case 'present': {
			const key = JSON.stringify(plan.slots);
			let at = keys.indexOf(key);
			if (at < 0) {
				at = keys.push(key) - 1;
				subjects.push({ slots: plan.slots });
			}
			if (plan.op === 'eq') return (texts) => texts(at).includes(plan.text);
			if (plan.op === 'present') return (texts) => texts(at).length > 0;
			const pattern = new RegExp(plan.pattern, 'u');
			return (texts) => texts(at).some((text) => pattern.test(text));
		}
		case 'not': {
			const of = compilePlan(plan.of, subjects, keys);
			return (texts) => !of(texts);
		}
		case 'and':
		case 'or': {
			const of = plan.of.map((p: Plan) => compilePlan(p, subjects, keys));
			return plan.op === 'and' ? (texts) => of.every((p: Compiled) => p(texts)) : (texts) => of.some((p: Compiled) => p(texts));
		}
	}
	throw new Error(`compilePlan: op ${plan.op}`);
}

function scmOf(g: Grammar, from: string, kinds: number[], plan: Plan | null, dialect: 'rust' | 'es'): { id?: number; scm?: string; notes?: string[]; gap?: string } {
	return JSON.parse(g.probe.probeScm(from, kinds, plan === null ? null : JSON.stringify(plan), dialect));
}

// --- corpus -----------------------------------------------------------------

function pythonStdlib(): { dir: string; version: string } {
	const fromEnv = process.env.PY_STDLIB;
	for (const python of ['python3.14', 'python3']) {
		const run = spawnSync(python, ['-c', 'import sysconfig, sys; print(sysconfig.get_paths()["stdlib"]); print(sys.version.split()[0])'], { encoding: 'utf8' });
		if (run.status === 0) {
			const [dir, version] = run.stdout.trim().split('\n');
			return { dir: fromEnv ?? dir!, version: version! };
		}
	}
	throw new Error('no python3 to locate the standard library');
}
const PY = pythonStdlib();
const atBase = (path: string): string => execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', maxBuffer: 1 << 26 });

const PYTHON: readonly Row[] = [
	{ label: 'def: name eq format_help', kind: 'function_definition', cond: ['eq', 'name', 'format_help'] },
	{ label: 'def: name match ^_', kind: 'function_definition', cond: ['match', 'name', '^_'] },
	{ label: 'def: name match ^_ and not ^__', kind: 'function_definition', cond: ['and', ['match', 'name', '^_'], ['not', ['match', 'name', '^__']]] },
	{ label: 'def: name eq add_argument or returnType .', kind: 'function_definition', cond: ['or', ['eq', 'name', 'add_argument'], ['match', 'returnType', '.']] },
	{ label: 'call: function eq isinstance', kind: 'call', cond: ['eq', 'function', 'isinstance'] },
	{ label: 'call: function match ^self\\.', kind: 'call', cond: ['match', 'function', '^self\\.'] }
];
const CASES = [
	{ grammar: 'python', files: [['argparse.py', () => readFileSync(join(PY.dir, 'argparse.py'), 'utf8')], ['json/decoder.py', () => readFileSync(join(PY.dir, 'json/decoder.py'), 'utf8')]], rows: PYTHON },
	{
		grammar: 'typescript',
		files: [
			['emitters/wrap.ts', () => atBase('packages/codegen/src/emitters/wrap.ts')],
			['common/src/engine.ts', () => atBase('packages/common/src/engine.ts')]
		],
		rows: [
			{ label: 'member: property eq length', kind: 'member_expression', cond: ['eq', 'property', 'length'] },
			{ label: 'member: object match ^this\\.', kind: 'member_expression', cond: ['match', 'object', '^this\\.'] }
		]
	},
	{
		grammar: 'rust',
		files: [
			['sittir-core/src/read.rs', () => atBase('rust/crates/sittir-core/src/read.rs')],
			['sittir-core/src/render.rs', () => atBase('rust/crates/sittir-core/src/render.rs')]
		],
		rows: [
			{ label: 'fn: name match ^read', kind: 'function_item', cond: ['match', 'name', '^read'] },
			{ label: 'field: field eq kind', kind: 'field_expression', cond: ['eq', 'field', 'kind'] }
		]
	}
] as const;

const grammars = new Map<string, Grammar>();
const grammar = async (name: string): Promise<Grammar> => grammars.get(name) ?? grammars.set(name, await grammarOf(name)).get(name)!;

const report: Record<string, unknown> = { base: BASE, python: PY.version, runs: RUNS };
const md: string[] = [`Corpus: python ${PY.version} standard library; repository files at ${BASE}. Median of ${RUNS} runs.`, ''];

// --- rows -------------------------------------------------------------------

const VARIANTS = ['native', 'native-id', 'native-es', 'spans', 'scm', 'scm-es', 'js'] as const;
if (ONLY.has('rows') || ONLY.has('node')) {
	const rows: any[] = [];
	const perNode: any[] = [];
	for (const { grammar: name, files, rows: conditions } of CASES) {
		const g = await grammar(name);
		const wrap = (root: unknown, tree: unknown) => g.wrapNode(root, tree);
		for (const [file, read] of files) {
			const source = read();
			const root = g.engine.parse(source);
			const tree = treeOf(root);
			const fromAddress = nodeAddressOf(root);
			const from = JSON.stringify(fromAddress);
			const hydrate = (coordinate: any) => inTreeEngine(tree, () => hydrateWith(coordinate, tree, wrap));
			const slicer = spanSlicer(source);
			const walk = (call: (from: string, resume: number[] | null, limit: number) => any, keep: (batch: any, i: number) => boolean): number => {
				let kept = 0;
				let at = from;
				let resume: number[] | null = null;
				for (let n = 0; ; n++) {
					const batch = JSON.parse(call(at, resume, BATCH_LIMITS[Math.min(n, BATCH_LIMITS.length - 1)]));
					for (let i = 0; i < batch.items.length; i++) if (keep(batch, i) && hydrate(batch.items[i]) !== undefined) kept++;
					if (batch.resume === null) return kept;
					at = JSON.stringify({ handle: batch.origin });
					resume = batch.resume;
				}
			};
			for (const row of conditions) {
				const kind = g.kindId(row.kind);
				const plan = planOf(g, kind, row.cond);
				const planJson = JSON.stringify(plan);
				const idRust = g.probe.probeCompilePlan(planJson, 'rust');
				const idEs = g.probe.probeCompilePlan(planJson, 'es');
				const subjects: any[] = [];
				const compiled = compilePlan(plan, subjects);
				const subjectsJson = JSON.stringify(subjects);
				const scm = scmOf(g, from, [kind], plan, 'rust');
				const scmEs = scmOf(g, from, [kind], plan, 'es');
				const result: Record<string, { ms: number; count: number } | null> = {};
				const matches = JSON.parse(g.probe.probeDescendants(from, [kind], null, 1 << 30, null, null, null)).items.length;
				if (ONLY.has('rows')) {
					result.native = time(() => [...root.$query().$descendants.ofType(kind).where((r: any) => whereOf(row.cond, r))].length);
					result['native-id'] = time(() => walk((at, resume, limit) => g.probe.probeDescendants(at, [kind], resume, limit, idRust, null, null), () => true));
					result['native-es'] = time(() => walk((at, resume, limit) => g.probe.probeDescendants(at, [kind], resume, limit, idEs, null, null), () => true));
					result.spans = time(() =>
						walk(
							(at, resume, limit) => g.probe.probeDescendants(at, [kind], resume, limit, null, subjectsJson, null),
							(batch, i) => compiled((s) => batch.spans[i][s].map(([start, end]: number[]) => slicer({ start, end })))
						)
					);
					result.scm = scm.id === undefined ? null : time(() => JSON.parse(g.probe.probeScmDescendants(from, scm.id)).items.filter((c: any) => hydrate(c) !== undefined).length);
					result['scm-es'] = scmEs.id === undefined ? null : time(() => JSON.parse(g.probe.probeScmDescendants(from, scmEs.id)).items.filter((c: any) => hydrate(c) !== undefined).length);
					result.js = time(() => [...root.$query().$descendants.ofType(kind)].filter((n: any) => holds(plan, { texts: accessorTexts(g, n) })).length);
					const evalOnly = {
						'native-id walk': time(() => walk((at, resume, limit) => g.probe.probeDescendants(at, [kind], resume, limit, idRust, null, null), () => false)),
						'scm query': scm.id === undefined ? null : time(() => g.probe.probeScmCount(from, scm.id))
					};
					rows.push({ grammar: name, file, label: row.label, matches, result, evalOnly, scm: scm.scm ?? scm.gap, notes: scm.notes ?? [] });
				}
				if (ONLY.has('node')) {
					const nodes = [...root.$query().$descendants.ofType(kind)] as any[];
					const addresses = nodes.map((n) => nodeAddressOf(n));
					const addressJson = addresses.map((a) => JSON.stringify([a]));
					const perCall = (fn: (i: number) => unknown): number => {
						for (let i = 0; i < nodes.length; i++) fn(i);
						const samples: number[] = [];
						for (let r = 0; r < RUNS; r++) {
							const t = performance.now();
							for (let i = 0; i < nodes.length; i++) fn(i);
							samples.push(((performance.now() - t) * 1000) / Math.max(nodes.length, 1));
						}
						return median(samples);
					};
					const answers = {
						native: nodes.map((_, i) => tree.query.planHolds([addresses[i]], plan)[0]),
						'native-id': nodes.map((_, i) => g.probe.probePlanHolds(addressJson[i], idRust)[0]),
						scm: scm.id === undefined ? null : nodes.map((_, i) => g.probe.probeScmHolds(addressJson[i], scm.id)[0]),
						'js holds': nodes.map((n) => holds(plan, { texts: accessorTexts(g, n) })),
						'js compiled': nodes.map((n) => compiled((s) => accessorTexts(g, n)(subjects[s])))
					};
					const disagree = Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, a === null ? null : a.filter((v, i) => v !== answers.native[i]).length]));
					perNode.push({
						grammar: name,
						file,
						label: row.label,
						nodes: nodes.length,
						disagree,
						us: {
							native: perCall((i) => tree.query.planHolds([addresses[i]], plan)),
							'native-id': perCall((i) => g.probe.probePlanHolds(addressJson[i], idRust)),
							scm: scm.id === undefined ? null : perCall((i) => g.probe.probeScmHolds(addressJson[i], scm.id)),
							'js holds': perCall((i) => holds(plan, { texts: accessorTexts(g, nodes[i]) })),
							'js compiled': perCall((i) => compiled((s) => accessorTexts(g, nodes[i])(subjects[s])))
						}
					});
				}
			}
		}
	}
	report.rows = rows;
	report.perNode = perNode;
	if (rows.length > 0) {
		md.push('### Rows (ms; results)', '');
		md.push(`| row | kind matches | ${VARIANTS.join(' | ')} | native-id walk only | scm query only |`);
		md.push(`| --- | --- | ${VARIANTS.map(() => '---').join(' | ')} | --- | --- |`);
		for (const r of rows) {
			const cell = (v: any) => (v === null ? 'gap' : `${v.ms.toFixed(2)} (${v.count})`);
			md.push(`| ${r.grammar} ${r.file}: ${r.label} | ${r.matches} | ${VARIANTS.map((v) => cell(r.result[v])).join(' | ')} | ${cell(r.evalOnly['native-id walk'])} | ${cell(r.evalOnly['scm query'])} |`);
		}
		md.push('');
	}
	if (perNode.length > 0) {
		const keys = ['native', 'native-id', 'scm', 'js holds', 'js compiled'];
		md.push('### Per node in hand (µs per node; nodes answering differently from native)', '');
		md.push(`| row | nodes | ${keys.join(' | ')} |`);
		md.push(`| --- | --- | ${keys.map(() => '---').join(' | ')} |`);
		for (const r of perNode) md.push(`| ${r.grammar} ${r.file}: ${r.label} | ${r.nodes} | ${keys.map((k) => (r.us[k] === null ? 'gap' : `${r.us[k].toFixed(2)} (${r.disagree[k]})`)).join(' | ')} |`);
		md.push('');
	}
}

// --- dialect ----------------------------------------------------------------

if (ONLY.has('dialect')) {
	const g = await grammar('python');
	const names = ['café', 'x٣', 'plain', 'naïve_ünïcode'];
	const source = `${names.map((n) => `def ${n}(): pass`).join('\n')}\n`;
	const root = g.engine.parse(source);
	const tree = treeOf(root);
	const from = JSON.stringify(nodeAddressOf(root));
	const kind = g.kindId('function_definition');
	const nodes = [...root.$query().$descendants.ofType(kind)] as any[];
	const addresses = JSON.stringify(nodes.map((n) => nodeAddressOf(n)));
	const { loadWebTreeSitter } = await import(`${ROOT}packages/codegen/src/engine-loader.ts`);
	const { Parser, Language } = await loadWebTreeSitter();
	const web = await import('web-tree-sitter');
	const Query = (web as any).Query ?? (web as any).default?.Query;
	const wasm = await Language.load(`${ROOT}packages/python/.sittir/parser.wasm`);
	const parser = new Parser();
	parser.setLanguage(wasm);
	const webTree = parser.parse(source)!;
	const scmString = (pattern: string) => pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	const dialect: any[] = [];
	for (const pattern of ['^\\w+$', '\\d', '\\b\\w', '^[\\p{L}\\p{N}_]+$', '\\p{Nd}', '^na', '^[a-z]+$']) {
		const plan = { op: 'match', pattern, slots: { [kind]: g.slot(kind, 'name') } };
		const count = (answers: boolean[]) => answers.filter(Boolean).length;
		const compile = (d: string) => {
			try {
				return g.probe.probeCompilePlan(JSON.stringify(plan), d);
			} catch (e) {
				return e instanceof Error ? e.message : String(e);
			}
		};
		const rustId = compile('rust');
		const esId = compile('es');
		const scmRust = scmOf(g, from, [kind], plan, 'rust');
		const scmEs = scmOf(g, from, [kind], plan, 'es');
		let webCount: number | string;
		try {
			webCount = new Query(wasm, `((function_definition name: (_) @n) @node (#match? @n "${scmString(pattern)}"))`).matches(webTree.rootNode).length;
		} catch (e) {
			webCount = `refused: ${e instanceof Error ? e.message.split('\n')[0] : e}`;
		}
		let js: number | string;
		try {
			js = nodes.filter((n) => holds(plan, { texts: accessorTexts(g, n) })).length;
		} catch (e) {
			js = `refused: ${e instanceof Error ? e.message : e}`;
		}
		dialect.push({
			pattern,
			'native (Rust regex)': typeof rustId === 'number' ? count(g.probe.probePlanHolds(addresses, rustId)) : `refused`,
			'native (regress, u)': typeof esId === 'number' ? count(g.probe.probePlanHolds(addresses, esId)) : `refused`,
			'JavaScript holds (u)': js,
			'scm #match? (Rust binding)': scmRust.id === undefined ? `gap: ${scmRust.gap}` : g.probe.probeScmCount(from, scmRust.id),
			'scm #es-match? (regress)': scmEs.id === undefined ? `gap: ${scmEs.gap}` : g.probe.probeScmCount(from, scmEs.id),
			'scm #match? (web-tree-sitter)': webCount
		});
	}
	report.dialect = dialect;
	const keys = Object.keys(dialect[0]).filter((k) => k !== 'pattern');
	md.push(`### Regex dialect: python function names ${names.join(', ')}`, '');
	md.push(`| pattern | ${keys.join(' | ')} |`, `| --- | ${keys.map(() => '---').join(' | ')} |`);
	for (const d of dialect) md.push(`| \`${d.pattern}\` | ${keys.map((k) => d[k]).join(' | ')} |`);
	md.push('');
	void tree;
}

// --- coverage ---------------------------------------------------------------

if (ONLY.has('coverage')) {
	const cases: { label: string; grammar: string; source: string; kind: string; plan: (g: Grammar, k: number) => Plan }[] = [];
	const py = 'python';
	const defs = 'def _a(): pass\ndef __b__(): pass\ndef c() -> int: return 1\ndef d(): pass\n';
	const s = (g: Grammar, k: number, a: string) => ({ [k]: g.slot(k, a) });
	cases.push(
		{ label: 'field eq', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'eq', text: 'c', slots: s(g, k, 'name') }) },
		{ label: 'field match', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'match', pattern: '^_', slots: s(g, k, 'name') }) },
		{ label: 'not match, one value', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'not', of: { op: 'match', pattern: '^_', slots: s(g, k, 'name') } }) },
		{ label: 'present (field)', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'present', slots: s(g, k, 'returnType') }) },
		{ label: 'not present (field)', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'not', of: { op: 'present', slots: s(g, k, 'returnType') } }) },
		{ label: 'not match, optional slot', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'not', of: { op: 'match', pattern: 'int', slots: s(g, k, 'returnType') } }) },
		{ label: 'and across slots', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'and', of: [{ op: 'match', pattern: '^[a-z]', slots: s(g, k, 'name') }, { op: 'present', slots: s(g, k, 'returnType') }] }) },
		{ label: 'or across slots', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'or', of: [{ op: 'eq', text: 'd', slots: s(g, k, 'name') }, { op: 'present', slots: s(g, k, 'returnType') }] }) },
		{ label: 'and on one slot, one value', grammar: py, source: defs, kind: 'function_definition', plan: (g, k) => ({ op: 'and', of: [{ op: 'match', pattern: '^_', slots: s(g, k, 'name') }, { op: 'not', of: { op: 'match', pattern: '^__', slots: s(g, k, 'name') } }] }) },
		{ label: 'not match, several values', grammar: py, source: 'from m import os, sys\nfrom m import sys\nfrom m import os\n', kind: 'import_list', plan: (g, k) => ({ op: 'not', of: { op: 'match', pattern: '^os$', slots: s(g, k, 'names') } }) },
		{ label: 'and on one slot, several values', grammar: py, source: 'from m import os, sys\nfrom m import sys\nfrom m import os\n', kind: 'import_list', plan: (g, k) => ({ op: 'and', of: [{ op: 'eq', text: 'os', slots: s(g, k, 'names') }, { op: 'eq', text: 'sys', slots: s(g, k, 'names') }] }) },
		{ label: 'present (unfielded)', grammar: py, source: '@a\ndef f(): pass\nclass C:\n    @property\n    def g(self): pass\n', kind: 'decorated_definition', plan: (g, k) => ({ op: 'match', pattern: 'property', slots: s(g, k, 'decorators') }) },
		{ label: 'not present (unfielded)', grammar: py, source: '@a\ndef f(): pass\n', kind: 'decorated_definition', plan: (g, k) => ({ op: 'not', of: { op: 'present', slots: s(g, k, 'decorators') } }) },
		{ label: 'is on a slot\'s values', grammar: py, source: 'f(1)\nself.g(2)\n', kind: 'call', plan: (g, k) => ({ op: 'is', types: [g.kindId('attribute')], slots: s(g, k, 'function') }) },
		{ label: 'is on the node itself', grammar: py, source: 'f(1)\nself.g(2)\n', kind: 'call', plan: (g, k) => ({ op: 'is', self: true, types: [k] }) },
		{
			label: 'child step',
			grammar: py,
			source: 'f(1)\nself.g(2)\nother.g(3)\n',
			kind: 'call',
			plan: (g, k) => ({ op: 'child', slots: s(g, k, 'function'), of: { op: 'eq', text: 'self', slots: s(g, g.kindId('attribute'), 'object') } })
		},
		{
			label: 'anchored child step',
			grammar: py,
			source: 'f(1)\nself.g(2)\n',
			kind: 'call',
			plan: (g, k) => ({ op: 'child', anchor: 'first', slots: s(g, k, 'function'), of: { op: 'eq', text: 'self', slots: s(g, g.kindId('attribute'), 'object') } })
		}
	);
	const coverage: any[] = [];
	for (const c of cases) {
		const g = await grammar(c.grammar);
		const root = g.engine.parse(c.source);
		const from = JSON.stringify(nodeAddressOf(root));
		const kind = g.kindId(c.kind);
		let plan: Plan;
		try {
			plan = c.plan(g, kind);
		} catch (e) {
			coverage.push({ label: c.label, grammar: c.grammar, error: String(e) });
			continue;
		}
		const id = g.probe.probeCompilePlan(JSON.stringify(plan), 'rust');
		const native = JSON.parse(g.probe.probeDescendants(from, [kind], null, 1 << 30, id, null, null)).items.length;
		const scm = scmOf(g, from, [kind], plan, 'rust');
		const scmCount = scm.id === undefined ? null : g.probe.probeScmCount(from, scm.id);
		coverage.push({ label: c.label, grammar: c.grammar, source: c.source, native, scm: scmCount, query: scm.scm ?? null, gap: scm.gap ?? null, notes: scm.notes ?? [] });
	}
	// Census: every (kind, slot) of each grammar's slot table, as a presence test.
	const census: any[] = [];
	for (const name of ['python', 'typescript', 'rust']) {
		const g = await grammar(name);
		const root = g.engine.parse(name === 'python' ? 'x = 1\n' : name === 'rust' ? 'fn a() {}\n' : 'let a = 1;\n');
		const from = JSON.stringify(nodeAddressOf(root));
		const reasons = new Map<string, number>();
		let ok = 0;
		let noted = 0;
		let pairs = 0;
		for (const [kind, entries] of Object.entries(g.querySlots) as [string, any[]][]) {
			for (const entry of entries) {
				pairs++;
				const scm = scmOf(g, from, [Number(kind)], { op: 'present', slots: { [kind]: entry[1] } }, 'rust');
				if (scm.gap !== undefined) {
					const reason = scm.gap.replace(/^[^:]+:\s*/, '').replace(/^slot \d+: /, '').split('\n')[0]!.replace(/at \d+:\d+/, '');
					reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
				} else {
					ok++;
					if ((scm.notes ?? []).length > 0) noted++;
				}
			}
		}
		census.push({ grammar: name, pairs, compiled: ok, withNotes: noted, gaps: Object.fromEntries([...reasons].sort((a, b) => b[1] - a[1])) });
	}
	report.coverage = coverage;
	report.census = census;
	md.push('### scm coverage (python cases; counts native / scm)', '');
	md.push('| construct | native | scm | refused or noted |', '| --- | --- | --- | --- |');
	for (const c of coverage) md.push(`| ${c.label} | ${c.native ?? ''} | ${c.scm ?? 'gap'} | ${(c.gap ?? c.error ?? c.notes.join('; ')).replace(/\n/g, ' ').replace(/\|/g, '\\|').slice(0, 300)} |`);
	md.push('', '### scm census: every (kind, slot) of the slot tables, as a presence test', '');
	md.push('| grammar | pairs | compiled | with a note | refused, by reason |', '| --- | --- | --- | --- | --- |');
	for (const c of census) md.push(`| ${c.grammar} | ${c.pairs} | ${c.compiled} | ${c.withNotes} | ${Object.entries(c.gaps).map(([r, n]) => `${n}× ${r}`).join('; ').replace(/\|/g, '\\|')} |`);
	md.push('');
}

// --- built nodes ------------------------------------------------------------

if (ONLY.has('built')) {
	const g = await grammar('python');
	const { build } = g.engine;
	const call = g.kindId('call');
	const N = 1000;
	const built = Array.from({ length: 2 * N }, (_, i) =>
		build.call({
			function: i % 2 === 0 ? build.attribute({ object: build.identifier('self'), attribute: build.identifier(`g${i}`) } as never) : build.identifier(`g${i}`),
			arguments: build.argumentList()
		} as never)
	) as any[];
	const plan = { op: 'match', pattern: '^self\\.', slots: { [call]: g.slot(call, 'function') } };
	const per = (fn: (n: any) => unknown): { us: number; count: number } => {
		let count = 0;
		for (const n of built) if (fn(n)) count++;
		const samples: number[] = [];
		for (let r = 0; r < RUNS; r++) {
			const t = performance.now();
			for (const n of built) fn(n);
			samples.push(((performance.now() - t) * 1000) / built.length);
		}
		return { us: median(samples), count };
	};
	const renderedTexts = (n: any) => (subject: any) => {
		const accessor = g.accessorOf(n.$type, subject.slots[n.$type]);
		return accessor === undefined ? [] : slotItems(n, accessor).map((v: any) => String(g.engine.render(v)));
	};
	let queryId: number | undefined;
	const reparse = (n: any) => {
		const text = String(g.engine.render(n));
		const root = g.engine.parse(`${text}\n`);
		const found = root.$query().$descendants.ofType(call).at(0);
		if (found === undefined) return false;
		if (queryId === undefined) queryId = scmOf(g, JSON.stringify(nodeAddressOf(root)), [call], plan, 'rust').id;
		return g.probe.probeScmHolds(JSON.stringify([nodeAddressOf(found)]), queryId)[0];
	};
	const results = {
		'js holds, one text meaning ($text, else span; none for a built compound)': per((n) => holds(plan, { texts: accessorTexts(g, n) })),
		'js holds, rendered text': per((n) => holds(plan, { texts: renderedTexts(n) })),
		'render only': per((n) => g.engine.render(n) !== ''),
		'render + parse': per((n) => g.engine.parse(`${g.engine.render(n)}\n`) !== undefined),
		'render + parse + scm': per(reparse)
	};
	// Reparse context: which corpus kinds parse back to themselves standalone.
	const standalone: any[] = [];
	for (const [name, kind, sample] of [
		['python', 'call', () => readFileSync(join(PY.dir, 'argparse.py'), 'utf8')],
		['python', 'function_definition', () => readFileSync(join(PY.dir, 'argparse.py'), 'utf8')],
		['python', 'keyword_argument', () => readFileSync(join(PY.dir, 'argparse.py'), 'utf8')],
		['typescript', 'member_expression', () => atBase('packages/codegen/src/emitters/wrap.ts')],
		['rust', 'function_item', () => atBase('rust/crates/sittir-core/src/render.rs')],
		['rust', 'field_expression', () => atBase('rust/crates/sittir-core/src/render.rs')]
	] as const) {
		const gg = await grammar(name);
		const source = sample();
		const bytes = Buffer.from(source);
		const k = gg.kindId(kind);
		const nodes = [...gg.engine.parse(source).$query().$descendants.ofType(k)] as any[];
		let same = 0;
		for (const n of nodes) {
			const span = spanOf(n)!;
			const text = bytes.subarray(span.start, span.end).toString();
			const again = gg.engine.parse(`${text}\n`);
			const hit = [...again.$query().$descendants.ofType(k)].find((m: any) => spanOf(m)?.start === 0 && spanOf(m)?.end === Buffer.byteLength(text));
			if (hit !== undefined && (again.$errors ?? []).length === 0) same++;
		}
		standalone.push({ grammar: name, kind, nodes: nodes.length, reparsed: same });
	}
	report.built = { nodes: built.length, results, standalone };
	md.push(`### Built nodes: ${built.length} built python calls, half \`self.gN()\`, condition \`function match ^self\\.\``, '');
	md.push('| evaluation | µs per node | holds on |', '| --- | --- | --- |');
	for (const [k, v] of Object.entries(results)) md.push(`| ${k} | ${v.us.toFixed(2)} | ${v.count} |`);
	md.push('', '### Reparse alone: corpus nodes whose source text parses back, alone, to one node of the same kind with no error', '');
	md.push('| grammar | kind | nodes | reparsed |', '| --- | --- | --- | --- |');
	for (const s of standalone) md.push(`| ${s.grammar} | ${s.kind} | ${s.nodes} | ${s.reparsed} |`);
	md.push('');
}

writeFileSync(join(OUT, 'where-cost.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(join(OUT, 'where-cost.md'), `${md.join('\n')}\n`);
console.log(md.join('\n'));
