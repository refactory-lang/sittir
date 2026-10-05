/**
 * The transport probe against today's engine, per rust `function_item` read one level.
 *
 *   (cd proto && CARGO_TARGET_DIR=$PWD/target cargo build --release --offline)
 *   SITTIR_ROOT=<checkout> pnpm exec tsx --expose-gc <this file> [source file]
 *
 * Run from a checkout whose rust native is built (the engine side of the comparison). Prints:
 * the native read alone; each wire form (napi objects, JSON, arena words) in batch and one node
 * per call, with the members a wrap would still attach; the same nodes through today's engine
 * (query `ofType`, one-level read and wrap); and the render direction, each form decoded back.
 */
import { createRequire } from 'node:module';
import { copyFileSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const ROOT = process.env.SITTIR_ROOT ?? process.cwd();
const HERE = new URL('.', import.meta.url).pathname;
const sourcePath = process.argv[2] ?? `${HERE}inputs/engine.rs`;
process.env.NODE_ENV ??= 'production';

copyFileSync(`${HERE}proto/target/release/libtransport_probe.dylib`, `${HERE}proto/transport-probe.node`);
const req = createRequire(import.meta.url);
const { Probe } = req(`${HERE}proto/transport-probe.node`) as { Probe: new (source: string) => any };

const source = readFileSync(sourcePath, 'utf8');
const p = new Probe(source);

function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	return s[Math.floor(s.length / 2)]!;
}
function time<T>(n: number, fn: () => T, warm = 5): { ms: number; last: T } {
	let last!: T;
	for (let i = 0; i < warm; i++) last = fn();
	const samples: number[] = [];
	for (let i = 0; i < n; i++) {
		const t0 = performance.now();
		last = fn();
		samples.push(performance.now() - t0);
	}
	return { ms: median(samples), last };
}

const rows: number[] = p.rows();
const N = rows.length;
const per = (ms: number) => `${((ms * 1e6) / N).toFixed(0)} ns/node`;
console.log(`# ${sourcePath.split('/').slice(-1)[0]}: ${source.length} bytes, ${N} function_item nodes`);
console.log(p.describe());

// --- what a wrap still does once the projection is native: attach members -------------------
const SLOTS = ['visibility_modifier', 'function_modifiers', 'name', 'type_parameters', 'parameters', 'return_type', 'where_clause', 'body'] as const;
const child = (v: unknown) => v;
function attach(data: any) {
	const node = {
		...data,
		visibilityModifier() {
			return child(this._visibility_modifier);
		},
		functionModifiers() {
			return child(this._function_modifiers);
		},
		name() {
			return child(this._name);
		},
		typeParameters() {
			return child(this._type_parameters);
		},
		parameters() {
			return child(this._parameters);
		},
		returnType() {
			return child(this._return_type);
		},
		whereClause() {
			return child(this._where_clause);
		},
		body() {
			return child(this._body);
		},
		$with: {
			visibilityModifier: (v: unknown) => attach({ ...data, _visibility_modifier: v }),
			functionModifiers: (v: unknown) => attach({ ...data, _function_modifiers: v }),
			name: (v: unknown) => attach({ ...data, _name: v }),
			typeParameters: (v: unknown) => attach({ ...data, _type_parameters: v }),
			parameters: (v: unknown) => attach({ ...data, _parameters: v }),
			returnType: (v: unknown) => attach({ ...data, _return_type: v }),
			whereClause: (v: unknown) => attach({ ...data, _where_clause: v }),
			body: (v: unknown) => attach({ ...data, _body: v })
		},
		$render: () => node,
		$query: () => node,
		$engine: () => undefined
	};
	return node;
}

// --- arena words: a view literal whose accessors read the record in place ------------------
const decoder = new TextDecoder();
function slotAt(words: Uint32Array, text: Uint8Array, at: number): unknown {
	switch (words[at]) {
		case 1:
			return { $type: words[at + 1], $row: words[at + 2], $start: words[at + 3], $end: words[at + 4] };
		case 2:
			return decoder.decode(text.subarray(words[at + 4], words[at + 4] + (words[at + 3] - words[at + 2])));
		case 3:
			return words[at + 1];
		default:
			return undefined;
	}
}
function view(words: Uint32Array, text: Uint8Array, off: number) {
	const node = {
		$type: words[off],
		visibilityModifier: () => slotAt(words, text, off + 1),
		functionModifiers: () => slotAt(words, text, off + 6),
		name: () => slotAt(words, text, off + 11),
		typeParameters: () => slotAt(words, text, off + 16),
		parameters: () => slotAt(words, text, off + 21),
		returnType: () => slotAt(words, text, off + 26),
		whereClause: () => slotAt(words, text, off + 31),
		body: () => slotAt(words, text, off + 36),
		$with: {} as Record<string, unknown>,
		$render: () => node,
		$query: () => node,
		$engine: () => undefined
	};
	return node;
}
const views = (w: { words: Uint32Array; text: Uint8Array; count: number }) => {
	const out = new Array(w.count);
	for (let i = 0; i < w.count; i++) out[i] = view(w.words, w.text, w.words[1 + i]);
	return out;
};

// --- sanity: the three forms carry the same transports --------------------------------------
const objs = p.allObjects();
const fromJson = JSON.parse(p.allJson());
const w = p.allWords();
const viaWords = views(w);
// napi objects leave an absent option out and write required fields first; JSON writes null in
// declaration order. Compare with absent dropped and keys sorted.
const normal = (v: unknown): unknown =>
	Array.isArray(v)
		? v.map(normal)
		: v !== null && typeof v === 'object'
			? Object.fromEntries(
					Object.entries(v)
						.filter(([, x]) => x !== null && x !== undefined)
						.sort(([a], [b]) => (a < b ? -1 : 1))
						.map(([k, x]) => [k, normal(x)])
				)
			: v;
const same =
	objs.length === N &&
	JSON.stringify(normal(objs)) === JSON.stringify(normal(fromJson)) &&
	viaWords.every((v: any, i: number) => {
		const name = objs[i]._name;
		return v.name() === (typeof name === 'object' && name !== null && '$text' in name ? name.$text : name);
	});
console.log(`forms agree: ${same}; slots per node: ${SLOTS.length} + trivia; arena ${w.words.length * 4} B words + ${w.text.length} B text for ${N} nodes`);

// --- 1. native only ------------------------------------------------------------------------
const [readNs, walkNs] = p.nativeNs(200) as number[];
const atNs = p.nativeAtNs(rows, 200) as number;
console.log('\n## native read, nothing crossing');
console.log(`walk the tree and read every function_item one level: ${readNs.toFixed(0)} ns/node (the walk alone ${walkNs.toFixed(0)} ns/node)`);
console.log(`read one function_item at its row (goto_descendant + read): ${atNs.toFixed(0)} ns/node`);
console.log(`tree-sitter parse: ${(p.parseMs(20) as number).toFixed(2)} ms`);

// --- 2. batch, one call -----------------------------------------------------------------------
console.log('\n## batch: every function_item in one call (cross; cross + attach members)');
for (const [label, cross, materialize] of [
	['napi objects', () => p.allObjects(), (x: any[]) => x.map(attach)],
	['JSON', () => JSON.parse(p.allJson()), (x: any[]) => x.map(attach)],
	['arena words', () => p.allWords(), (x: any) => views(x)]
] as const) {
	const c = time(200, cross as () => unknown);
	const a = time(200, () => (materialize as (x: unknown) => unknown)((cross as () => unknown)()));
	console.log(`${label.padEnd(13)} ${per(c.ms).padStart(13)}   with members ${per(a.ms).padStart(13)}`);
}

// --- 3. lazy, one node per call -------------------------------------------------------------
console.log('\n## lazy: one function_item per call, at its row (cross + attach members)');
for (const [label, one] of [
	['napi objects', (r: number) => attach(p.oneObject(r))],
	['JSON', (r: number) => attach(JSON.parse(p.oneJson(r)))],
	['arena words', (r: number) => views(p.oneWords(r))[0]]
] as const) {
	const t = time(100, () => rows.map(one as (r: number) => unknown));
	console.log(`${label.padEnd(13)} ${per(t.ms).padStart(13)}`);
}

// --- 4. today's engine: the same nodes through the query API --------------------------------
const { createEngine } = (await import(`${ROOT}/packages/common/src/index.ts`)) as { createEngine: (l: unknown) => Promise<any> };
const language = ((await import(`${ROOT}/packages/rust/src/index.ts`)) as { default: unknown }).default;
const engine = await createEngine(language);
const kind = (objs[0] as { $type: number }).$type;
const parseOnly = time(40, () => engine.parse(source));
const lazyAll = time(40, () => [...engine.parse(source).$query().$descendants.ofType(kind)]);
const today = lazyAll.last as any[];
console.log('\n## today: engine.parse, then $query().$descendants.ofType(function_item)');
console.log(`nodes: ${today.length}; parse ${parseOnly.ms.toFixed(2)} ms; parse + ofType walk + one-level read and wrap of each: ${lazyAll.ms.toFixed(2)} ms`);
console.log(`=> per function_item, walk + read + wrap: ${per(lazyAll.ms - parseOnly.ms)}`);

// The same split on today's raw native surface: the kind-filtered walk alone (one batch), then
// the one-level read of each match (`readUntypedNode` + JSON.parse). The rest is the wrap and the
// query's batching.
const nativeMod = req(`${ROOT}/packages/rust/native/index.cjs`) as { SittirEngine: new () => any; disposeTree(id: number): void };
const raw = new nativeMod.SittirEngine();
const rootRead = JSON.parse(raw.parseAndRead(source)) as { untypedNode: { $handle: number }; treeId: number };
const from = JSON.stringify({ handle: rootRead.untypedNode.$handle });
const walkOnly = time(40, () => JSON.parse(raw.descendants(from, [kind], null, 1_000_000, null, null)) as { stubs: any[] });
const stubs = walkOnly.last.stubs;
const hydrate = time(40, () => stubs.map((s) => JSON.parse(raw.readUntypedNode(s.$parentHandle, s.$childIndex))));
console.log(`raw native: kind-filtered walk ${per(walkOnly.ms)} (${stubs.length} stubs); one-level read + JSON.parse of each ${per(hydrate.ms)}`);
console.log(`=> the wrap and query plumbing, by difference: ${per(lazyAll.ms - parseOnly.ms - walkOnly.ms - hydrate.ms)}`);
nativeMod.disposeTree(rootRead.treeId);

// --- 4c. retained JS heap per node, members attached ------------------------------------------
const gc = (globalThis as { gc?: () => void }).gc;
if (gc) {
	const COPIES = 200;
	const heldBy = (make: () => unknown[]) => {
		gc();
		gc();
		const before = process.memoryUsage().heapUsed;
		const held: unknown[] = [];
		for (let i = 0; i < COPIES; i++) held.push(make());
		gc();
		gc();
		const after = process.memoryUsage().heapUsed;
		void held.length;
		return `${((after - before) / (COPIES * N)).toFixed(0)} B/node`;
	};
	console.log('\n## retained JS heap per function_item, members attached');
	console.log(`napi objects ${heldBy(() => p.allObjects().map(attach))}; JSON ${heldBy(() => JSON.parse(p.allJson()).map(attach))}; arena views ${heldBy(() => views(p.allWords()))} (words and text shared per batch)`);
	const root = engine.parse(source);
	const yields = () => [...root.$query().$descendants.ofType(kind)];
	const fresh = yields()[0] !== yields()[0];
	console.log(`today, the wrapped nodes ofType yields, one root parsed outside the window: ${heldBy(yields)} (each copy reads fresh nodes: ${fresh})`);
}

// --- 5. the render direction: each form decoded back natively -------------------------------
const json = p.allJson();
console.log('\n## render direction: decode into the typed transport (native), and what JS writes first');
console.log(`napi objects  decode ${per(time(200, () => p.decodeObjects(objs)).ms).padStart(13)}   (JS writes nothing: the objects are the wire)`);
console.log(`JSON          decode ${per(time(200, () => p.decodeJson(json)).ms).padStart(13)}   JSON.stringify ${per(time(200, () => JSON.stringify(objs)).ms)}`);
console.log(`arena words   decode ${per(time(200, () => p.decodeWords(w.words, w.text)).ms).padStart(13)}   (a parsed node's record already exists)`);
engine.dispose();
