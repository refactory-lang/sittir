/**
 * Measures: what a `$descendants.ofType(K).where(...)` query costs when its
 * condition is evaluated in each place a single evaluator could put it, on the
 * same files, conditions and population. Every variant ends with the passing
 * nodes hydrated and wrapped, so the columns compare like for like:
 *   native      today: the walk evaluates the plan natively (Plan::holds)
 *               before a stub crosses; only passing stubs come back;
 *   batch       the walk filters by kind only, then one more native call per
 *               batch answers the plan for every stub in it (planHolds by
 *               address), and only passing stubs are hydrated. This is the
 *               cost of a JavaScript evaluator fed each stub's slot texts by
 *               the walk: same batches, one answer per stub per batch (texts
 *               in place of booleans are a few bytes more per stub);
 *   span        every kind match is hydrated, each slot is read through its
 *               accessor and its values' text is the source slice of their
 *               byte span in the source (a leaf's `$text` where it has
 *               one); JavaScript `holds` (the query spec's "JavaScript
 *               filter" column, rerun);
 *   $text       as span, but a value's text is its `$text` (a leaf's text;
 *               a structured value has none), the provider portable `is`
 *               uses.
 * The result count of each variant is printed: a difference from `native` is
 * a divergence in what "a slot's text" means.
 * Also, per kind match already hydrated (what `is` would pay per call): one
 * native planHolds call on its address, against JavaScript `holds` with the
 * span provider.
 * Run (from the root of a checkout whose native addons are built):
 *   ./node_modules/.bin/tsx <this file> [runs]   default: 7
 * Prints: per file, one row per condition: kind matches, median ms per
 *   variant, result counts native/batch/span/$text, per-call µs native/JS.
 */
import { readFileSync } from 'node:fs';

const ROOT = `${process.cwd()}/`;
const RUNS = Number(process.argv[2] ?? 7);
const { createEngine } = await import(`${ROOT}packages/common/src/index.ts`);
const { treeOf } = await import(`${ROOT}packages/common/src/tree-token.ts`);
const { inTreeEngine } = await import(`${ROOT}packages/common/src/engine-scope.ts`);
const { holds, BATCH_LIMITS } = await import(`${ROOT}packages/common/src/query.ts`);
const { nodeAddressOf } = await import(`${ROOT}packages/common/src/utils.ts`);

const PY = '/opt/homebrew/opt/python@3.14/Frameworks/Python.framework/Versions/3.14/lib/python3.14';

type Cond =
	| readonly ['eq' | 'match', string, string]
	| readonly ['and' | 'or', Cond, Cond]
	| readonly ['not', Cond];
interface Query {
	readonly label: string;
	readonly kind: string;
	readonly cond: Cond;
}
interface Case {
	readonly grammar: string;
	readonly files: readonly string[];
	readonly queries: readonly Query[];
}

// The query spec's six argparse conditions, then one per other grammar file.
const PYTHON: readonly Query[] = [
	{ label: 'def: name eq format_help', kind: 'function_definition', cond: ['eq', 'name', 'format_help'] },
	{ label: 'def: name match ^_', kind: 'function_definition', cond: ['match', 'name', '^_'] },
	{ label: 'def: name match ^_ and not ^__', kind: 'function_definition', cond: ['and', ['match', 'name', '^_'], ['not', ['match', 'name', '^__']]] },
	{ label: 'def: name eq add_argument or returnType .', kind: 'function_definition', cond: ['or', ['eq', 'name', 'add_argument'], ['match', 'returnType', '.']] },
	{ label: 'call: function eq isinstance', kind: 'call', cond: ['eq', 'function', 'isinstance'] },
	{ label: 'call: function match ^self\\.', kind: 'call', cond: ['match', 'function', '^self\\.'] }
];
const CASES: readonly Case[] = [
	{ grammar: 'python', files: [`${PY}/argparse.py`, `${PY}/json/decoder.py`], queries: PYTHON },
	{
		grammar: 'typescript',
		files: [`${ROOT}packages/codegen/src/emitters/wrap.ts`, `${ROOT}packages/common/src/engine.ts`],
		queries: [
			{ label: 'member: property eq length', kind: 'member_expression', cond: ['eq', 'property', 'length'] },
			{ label: 'member: object match ^this\\.', kind: 'member_expression', cond: ['match', 'object', '^this\\.'] }
		]
	},
	{
		grammar: 'rust',
		files: [`${ROOT}rust/crates/sittir-core/src/read_untyped_node.rs`, `${ROOT}rust/crates/sittir-core/src/render.rs`],
		queries: [
			{ label: 'fn: name match ^read', kind: 'function_item', cond: ['match', 'name', '^read'] },
			{ label: 'field: field eq kind', kind: 'field_expression', cond: ['eq', 'field', 'kind'] }
		]
	}
];

type Routes = { readonly fields: readonly string[]; readonly kinds: readonly string[] };
type Slots = Readonly<Record<number, readonly (readonly [string, Routes])[]>>;
type Node = { readonly $type: number; readonly $text?: string; readonly $span?: { start: number; end: number }; $query(): any };

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
const sameRoutes = (a: Routes, b: Routes): boolean => JSON.stringify(a.fields) === JSON.stringify(b.fields) && JSON.stringify(a.kinds) === JSON.stringify(b.kinds);

for (const { grammar, files, queries } of CASES) {
	const language = (await import(`${ROOT}packages/${grammar}/src/index.ts`)).default;
	const { wrapNode } = await import(`${ROOT}packages/${grammar}/src/wrap.ts`);
	const { TSKindId } = await import(`${ROOT}packages/${grammar}/src/types.ts`);
	const { querySlots } = (await import(`${ROOT}packages/${grammar}/src/utils.ts`)) as { querySlots: Slots };
	const engine = await createEngine(language);
	const kindIdOf = (kind: string): number | undefined => TSKindId[kind.replace(/(^|_)([a-z])/g, (_: string, __: string, c: string) => c.toUpperCase())];
	for (const file of files) {
		const source = readFileSync(file, 'utf-8');
		const bytes = Buffer.from(source, 'utf-8');
		const slice = (span: { start: number; end: number }): string => bytes.subarray(span.start, span.end).toString('utf-8');
		const root = engine.parse(source) as Node;
		const tree = treeOf(root);
		const from = nodeAddressOf(root);
		const hydrateStub = (parent: number, index: number): unknown => inTreeEngine(tree, () => wrapNode(tree.read(parent, index), tree));
		const sliceText = (item: any): string | undefined =>
			typeof item?.$text === 'string' ? item.$text : item?.$span ? slice(item.$span) : typeof item === 'string' ? item : undefined;
		const leafText = (item: any): string | undefined => (typeof item?.$text === 'string' ? item.$text : undefined);
		const provider = (node: Node, textOf: (item: unknown) => string | undefined) => (subject: Routes): readonly string[] => {
			const accessor = querySlots[node.$type]?.find(([, r]) => sameRoutes(r, subject))?.[0];
			if (accessor === undefined) return [];
			const read = (node as any)[accessor];
			const value = typeof read === 'function' ? read.call(node) : read;
			return (Array.isArray(value) ? value : value == null ? [] : [value]).flatMap((v: unknown) => textOf(v) ?? []);
		};
		console.log(`\n## ${grammar} ${file.split('/').slice(-2).join('/')} (${source.length} bytes), median of ${RUNS}`);
		console.log('| condition | kind matches | native ms | batch ms | span ms | $text ms | results native/batch/span/$text | per call native µs | per call JS µs |');
		console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
		for (const q of queries) {
			const kind = kindIdOf(q.kind);
			const routesOf = (slot: string): Routes => {
				const row = kind === undefined ? undefined : querySlots[kind]?.find(([accessor]) => accessor === slot);
				if (row === undefined) throw new Error(`${grammar}: ${q.kind} has no slot ${slot}`);
				return row[1];
			};
			if (kind === undefined) {
				console.log(`| ${q.label} | no kind ${q.kind} | | | | | | | |`);
				continue;
			}
			const planOf = (c: Cond): any =>
				c[0] === 'eq' ? { op: 'eq', text: c[2], ...routesOf(c[1]) }
				: c[0] === 'match' ? { op: 'match', pattern: c[2], ...routesOf(c[1]) }
				: c[0] === 'not' ? { op: 'not', of: planOf(c[1]) }
				: { op: c[0], of: [planOf(c[1]), planOf(c[2])] };
			const whereOf = (c: Cond, r: any): any =>
				c[0] === 'eq' ? r[c[1]].eq(c[2])
				: c[0] === 'match' ? r[c[1]].match(new RegExp(c[2], 'u'))
				: c[0] === 'not' ? whereOf(c[1], r).not()
				: whereOf(c[1], r)[c[0]](whereOf(c[2], r));
			const plan = planOf(q.cond);

			const native = time(() => [...root.$query().$descendants.ofType(kind).where((r: any) => whereOf(q.cond, r))].length);
			let matches = 0;
			const batch = time(() => {
				let kept = 0;
				matches = 0;
				let at = from;
				let resume: readonly number[] | undefined;
				for (let call = 0; ; call++) {
					const limit = BATCH_LIMITS[Math.min(call, BATCH_LIMITS.length - 1)];
					const b = tree.query.descendants({ from: at, limit, kinds: [kind], ...(resume === undefined ? {} : { resume }) });
					const addresses = b.stubs.map((s: any) => ({ parent: s.$parentHandle, index: s.$childIndex }));
					matches += addresses.length;
					if (addresses.length > 0) {
						const ok = tree.query.planHolds(addresses, plan);
						for (let i = 0; i < ok.length; i++) if (ok[i] && hydrateStub(addresses[i].parent, addresses[i].index) !== undefined) kept++;
					}
					if (b.resume === null) break;
					at = { handle: b.origin };
					resume = b.resume;
				}
				return kept;
			});
			const span = time(() => [...root.$query().$descendants.ofType(kind)].filter((n: Node) => holds(plan, provider(n, sliceText))).length);
			const leaf = time(() => [...root.$query().$descendants.ofType(kind)].filter((n: Node) => holds(plan, provider(n, leafText))).length);

			const nodes = [...root.$query().$descendants.ofType(kind)] as Node[];
			const addresses = nodes.map((n) => nodeAddressOf(n));
			const perCall = (fn: (i: number) => void): number => {
				for (let i = 0; i < nodes.length; i++) fn(i);
				const samples: number[] = [];
				for (let r = 0; r < RUNS; r++) {
					const t = performance.now();
					for (let i = 0; i < nodes.length; i++) fn(i);
					samples.push(((performance.now() - t) * 1000) / Math.max(nodes.length, 1));
				}
				return median(samples);
			};
			const firstDivergent = nodes.findIndex((n, i) => tree.query.planHolds([addresses[i]], plan)[0] !== holds(plan, provider(n, sliceText)));
			if (firstDivergent >= 0) {
				const n = nodes[firstDivergent] as any;
				const slot = JSON.stringify(q.cond).match(/"(?:eq|match)","(\w+)"/)?.[1] ?? '';
				const read = n[slot];
				const value = typeof read === 'function' ? read.call(n) : read;
				const shape = (v: any) => (v === null || typeof v !== 'object' ? JSON.stringify(v) : `{${Object.keys(v).filter((k) => k.startsWith('$')).join(',')}} $type=${v.$type} $text=${JSON.stringify(v.$text)}`);
				console.log(`<!-- ${q.label}: first divergence at ${JSON.stringify(n.$span ? slice(n.$span).slice(0, 60) : '?')}; ${slot}() = ${Array.isArray(value) ? `[${value.map(shape).join('; ')}]` : shape(value)} -->`);
			}
			const callNative = perCall((i) => tree.query.planHolds([addresses[i]], plan));
			const callJs = perCall((i) => holds(plan, provider(nodes[i]!, sliceText)));
			console.log(
				`| ${q.label} | ${matches} | ${native.ms.toFixed(2)} | ${batch.ms.toFixed(2)} | ${span.ms.toFixed(2)} | ${leaf.ms.toFixed(2)} | ${native.count}/${batch.count}/${span.count}/${leaf.count} | ${callNative.toFixed(2)} | ${callJs.toFixed(2)} |`
			);
		}
	}
}

// The regex dialect: the native plan runs under Rust's `regex` crate, the
// JavaScript `holds` under ECMAScript with the `u` flag. Same source, same
// pattern, both evaluators; a row whose counts differ is a dialect divergence.
{
	const language = (await import(`${ROOT}packages/python/src/index.ts`)).default;
	const { TSKindId } = await import(`${ROOT}packages/python/src/types.ts`);
	const { querySlots } = (await import(`${ROOT}packages/python/src/utils.ts`)) as { querySlots: Slots };
	const engine = await createEngine(language);
	const source = ['def café(): pass', 'def x٣(): pass', 'def plain(): pass', 'def naïve_ünïcode(): pass', ''].join('\n');
	const root = engine.parse(source) as Node;
	const tree = treeOf(root);
	const kind = TSKindId.FunctionDefinition as number;
	const routes = querySlots[kind]!.find(([a]) => a === 'name')![1];
	const nodes = [...root.$query().$descendants.ofType(kind)] as any[];
	console.log('\n## regex dialect, python function names: café, x٣, plain, naïve_ünïcode');
	console.log('| pattern | native (Rust regex) | JavaScript (u flag) |');
	console.log('| --- | --- | --- |');
	for (const pattern of ['^\\w+$', '\\d', '^na', '^[a-z]+$']) {
		const plan = { op: 'match', pattern, ...routes };
		const native = tree.query.planHolds(nodes.map((n) => nodeAddressOf(n)), plan).filter(Boolean).length;
		const js = nodes.filter((n) => holds(plan, () => [n.name().$text])).length;
		console.log(`| \`${pattern}\` | ${native} | ${js} |`);
	}
}
