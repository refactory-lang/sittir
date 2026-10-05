/**
 * What today's engine holds for each rust `function_item` read one level, split three ways: the
 * engine tree's read, the same read wrapped by `wrapNode`, and what `$query().$descendants.ofType`
 * yields; then the native reads made while wrapping, and the nodes and wrappers the wrapped node
 * reaches through its stored slots, by kind.
 *
 *   cd <checkout> && SITTIR_ROOT=$PWD pnpm exec tsx --expose-gc <this file> <rust source file>
 */
import { readFileSync } from 'node:fs';

const ROOT = process.env.SITTIR_ROOT ?? process.cwd();
const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error('run with --expose-gc');
const { createEngine } = (await import(`${ROOT}/packages/common/src/index.ts`)) as { createEngine: (l: unknown) => Promise<any> };
const { treeOf } = (await import(`${ROOT}/packages/common/src/tree-token.ts`)) as { treeOf: (n: object) => any };
const { wrapNode } = (await import(`${ROOT}/packages/rust/src/wrap.ts`)) as { wrapNode: (d: unknown, t: unknown) => any };
const language = ((await import(`${ROOT}/packages/rust/src/index.ts`)) as { default: unknown }).default;
const { TSKindId } = (await import(`${ROOT}/packages/rust/src/types.ts`)) as { TSKindId: Record<string, number> };
const kindName = new Map(Object.entries(TSKindId).map(([k, v]) => [v as number, k]));
const source = readFileSync(process.argv[2]!, 'utf8');
const kind = TSKindId.FunctionItem!;

const engine = await createEngine(language);
const root = engine.parse(source);
const tree = treeOf(root);
const stubs = tree.query.descendants({ from: { handle: root.$handle }, kinds: [kind], limit: 1_000_000 }).stubs as any[];
const N = stubs.length;

const COPIES = 100;
function perNode(make: () => unknown[]): number {
	let held: unknown[] = [];
	make();
	gc!();
	gc!();
	const before = process.memoryUsage().heapUsed;
	for (let i = 0; i < COPIES; i++) held.push(make());
	gc!();
	gc!();
	const after = process.memoryUsage().heapUsed;
	held = [];
	return (after - before) / (COPIES * N);
}

const realRead = tree.read;
const read = () => stubs.map((s) => realRead(s.$parentHandle, s.$childIndex));
console.log(`# ${process.argv[2]!.split('/').pop()}: ${N} function_items, retained heap per node`);
console.log(`engine tree read, one level:        ${perNode(read).toFixed(0)} B`);
console.log(`the same read, wrapped by wrapNode: ${perNode(() => read().map((d) => wrapNode(d, tree))).toFixed(0)} B`);
console.log(`what ofType yields:                 ${perNode(() => [...root.$query().$descendants.ofType(kind)]).toFixed(0)} B`);

let nativeReads = 0;
tree.read = (...args: unknown[]) => {
	nativeReads++;
	return realRead(...args);
};
const datas = read();
nativeReads = 0;
const wrapped = datas.map((d) => wrapNode(d, tree));
tree.read = realRead;

let nodes = 0;
const wrappersByKind = new Map<string, number>();
const seen = new Set<object>();
const visit = (v: unknown) => {
	if (v === null || typeof v !== 'object' || seen.has(v)) return;
	seen.add(v);
	const rec = v as Record<string, unknown>;
	if (typeof rec.$type === 'number' && !('$parentHandle' in rec)) {
		nodes++;
		if (typeof rec.$render === 'function') {
			const k = kindName.get(rec.$type as number) ?? String(rec.$type);
			wrappersByKind.set(k, (wrappersByKind.get(k) ?? 0) + 1);
		}
	}
	for (const [key, child] of Object.entries(rec)) if (typeof child !== 'function' && key !== '$with' && key !== '$trivia') visit(child);
};
for (const w of wrapped) visit(w);
const wrappers = [...wrappersByKind.values()].reduce((a, b) => a + b, 0);
console.log(`native reads while wrapping: ${nativeReads}`);
console.log(`reached through stored slots, per function_item: ${(nodes / N).toFixed(1)} nodes, ${(wrappers / N).toFixed(1)} wrapped`);
console.log('wrappers by kind:', Object.fromEntries([...wrappersByKind].sort((a, b) => b[1] - a[1]).slice(0, 10)));
