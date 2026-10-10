/**
 * The identity registry's retained heap per wrapper, runnable unchanged at either commit, with
 * `measure-heap.mts`'s method: one warm-up, then the median of 5, double gc around each.
 *
 *   cd <checkout> && SITTIR_ROOT=$PWD pnpm exec tsx --expose-gc <this file> <grammar> <source file>
 *
 * Populations, each over a whole-tree read:
 *   root alone     the root held, nothing touched
 *   walked, kept   every accessor touched once, every distinct wrapped node kept
 *   queried, kept  every `$query().$descendants` match held
 *
 * Per wrapper = (population − root alone) ÷ the wrappers the population holds. Run at the base and the
 * head: the head's excess per wrapper is what the registry costs (a `Map` entry, a `WeakRef` and a
 * finalization-registry cell per wrapper).
 */
import { readFileSync } from 'node:fs';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust', sourcePath = `${REPO}/rust/crates/sittir-core/src/engine.rs`] = process.argv.slice(2);
process.env.NODE_ENV ??= 'production';
const WHOLE_TREE = { deep: true, depth: Infinity };
const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error('run with --expose-gc');

const { createEngine } = (await import(`${REPO}/packages/common/src/index.ts`)) as {
	createEngine: (language: unknown) => Promise<any>;
};
const language = ((await import(`${REPO}/packages/${grammar}/src/index.ts`)) as { default: unknown }).default;
const source = readFileSync(sourcePath, 'utf8');
const engine = await createEngine(language);

const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Touch every accessor once, recursively, keeping each distinct wrapped node (numeric `$type`). */
function walk(node: any, seen: Set<object>, kept: object[]): void {
	if (node === null || typeof node !== 'object' || seen.has(node)) return;
	seen.add(node);
	if (Array.isArray(node)) {
		for (const entry of node) walk(entry, seen, kept);
		return;
	}
	if (typeof node.$type === 'number') kept.push(node);
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_') || node[key] == null) continue;
		const accessor = node[camel(key)];
		if (typeof accessor !== 'function') continue;
		let child: unknown;
		try {
			child = accessor.call(node);
		} catch {
			continue;
		}
		walk(child, seen, kept);
	}
}

let hold: unknown;
function retained(build: () => unknown): number {
	const samples: number[] = [];
	for (let i = 0; i < 6; i++) {
		hold = undefined;
		gc!();
		gc!();
		const before = process.memoryUsage().heapUsed;
		hold = build();
		gc!();
		gc!();
		if (i > 0) samples.push(process.memoryUsage().heapUsed - before);
	}
	hold = undefined;
	samples.sort((a, b) => a - b);
	return samples[Math.floor(samples.length / 2)]!;
}

const walkedCount = (() => {
	const kept: object[] = [];
	walk(engine.parse(source, WHOLE_TREE), new Set(), kept);
	return kept.length;
})();
const queriedCount = new Set(Array.from(engine.parse(source, WHOLE_TREE).$query().$descendants as Iterable<object>)).size;

const rootAlone = retained(() => engine.parse(source, WHOLE_TREE));
const walked = retained(() => {
	const root = engine.parse(source, WHOLE_TREE);
	const kept: object[] = [];
	walk(root, new Set(), kept);
	return [root, kept];
});
const queried = retained(() => {
	const root = engine.parse(source, WHOLE_TREE);
	return [root, Array.from(root.$query().$descendants as Iterable<object>)];
});

console.log(
	JSON.stringify({
		grammar,
		input: sourcePath.split('/').pop(),
		rootAloneKB: Math.round(rootAlone / 1024),
		walkedWrappers: walkedCount,
		walkedPerWrapperB: Math.round((walked - rootAlone) / walkedCount),
		queriedWrappers: queriedCount,
		queriedPerWrapperB: Math.round((queried - rootAlone) / queriedCount)
	})
);
