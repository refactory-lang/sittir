// Run with `SITTIR_CHUNK_POOL=1 node --expose-gc --import tsx`:
// prints one JSON line reporting a released tree's views once a second tree
// reuses its record chunks: whether the pool reused a chunk, whether the
// first tree's chunk buffer reads as empty, what a view over its record does,
// and the second tree's first name.
// A child process, because the pool switch is read once per process and a
// collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { nodeText, treeOf } from '../../src/utils.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';
import rust from '../../../rust/src/index.ts';

if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;
const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
type PoolStats = { fresh: number; reused: number; freed: number; pooled: number };
const native = status.native as typeof status.native & { chunk(treeId: number, chunk: number): Uint32Array; chunkPoolStats(): PoolStats };

type Named = { name(): unknown };
const source = (prefix: string): string => Array.from({ length: 40 }, (_, n) => `fn ${prefix}${n}(a: u8) -> u8 { a + ${n} }\n`).join('');
const attempt = (f: () => unknown): string => {
	try {
		return String(f());
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 90)}`;
	}
};
async function settle(): Promise<void> {
	for (let round = 0; round < 5; round += 1) {
		collect();
		await new Promise((resolve) => setImmediate(resolve));
	}
}

const rs = await createEngine(rust, { nodeStorage: 'arena' });
const first = rs.parse(source('a'));
const name = (first.statements()[0] as unknown as Named).name();
const tree = treeOf(first)?.id;
if (tree === undefined) throw new Error('a parsed tree has an id');
const buffer = native.chunk(tree, 0);
const words = buffer.length;
const before = native.chunkPoolStats();
native.disposeTree(tree);
await settle();
const second = rs.parse(source('b'));
const secondName = nodeText((second.statements()[0] as unknown as Named).name() as never);
const after = native.chunkPoolStats();
process.stdout.write(
	`${JSON.stringify({
		reused: after.reused > before.reused,
		bufferWords: words > 0,
		bufferEmpty: buffer.length === 0 && buffer.byteLength === 0,
		staleRead: attempt(() => nodeText(name as never)),
		secondName
	})}\n`
);
