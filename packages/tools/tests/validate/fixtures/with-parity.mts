// Run with `node --import tsx with-parity.mts <grammar> <default|runtime>`:
// runs one sequence of `$with` edits over the grammar's corpus in an arena
// engine of the given structure checking, and prints one JSON line per step
// with a digest of the built arena after it (the words and bytes of every
// live chunk, each chunk's counts, and the chunks freed so far, in order)
// and of the render, then one line once every handle is released. Two runs
// of the same sequence print the same lines when both modes write the same
// arena. A child process per mode, because tree ids come from one counter
// per process, and link records name them.
import { createHash } from 'node:crypto';
import { createEngine } from '@sittir/common';
import { loadCorpusEntries } from '../../../src/validate/common.ts';

const [grammar, mode, occurrences = '3'] = process.argv.slice(2);
if (grammar === undefined || (mode !== 'default' && mode !== 'runtime')) throw new Error('usage: with-parity.mts <grammar> <default|runtime> [occurrences]');

type Chunk = { readonly chunk: number; readonly data: ArrayBufferView; meta: Uint8Array; readonly freed: readonly number[]; readonly sealed?: { readonly chunk: number; readonly meta: Uint8Array } };
type Native = Record<'builtWords' | 'builtBytes', (handle: object, length: number) => Chunk> & { builtMemory(handle: object): { chunks: number; counts: number } };

const { getActiveBackend } = await import(`../../../../${grammar}/src/backend.ts`);
const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
const native = status.native as Native;

const live = new Map<number, Chunk>();
const freed: number[] = [];
let owner: object | undefined;
const capture = (name: 'builtWords' | 'builtBytes'): void => {
	const made = native[name];
	native[name] = (handle, length) => {
		owner = handle;
		const chunk = made(handle, length);
		for (const id of chunk.freed) {
			live.delete(id);
			freed.push(id);
		}
		if (chunk.sealed !== undefined) live.get(chunk.sealed.chunk)!.meta = chunk.sealed.meta;
		live.set(chunk.chunk, chunk);
		return chunk;
	};
};
capture('builtWords');
capture('builtBytes');

const lang = (await import(`../../../../${grammar}/src/index.ts`)).default;
const engine = await createEngine(lang, { nodeStorage: 'arena', ...(mode === 'runtime' ? { verifyStructure: 'runtime' } : {}) });

type Node = Record<string, unknown> & { readonly $type: number; readonly $with?: Record<string, (...args: unknown[]) => unknown> };
const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';
const settersOf = (node: Node): string[] =>
	Object.keys(node.$with ?? {})
		.filter((key) => typeof node.$with![key] === 'function' && typeof node[key] === 'function')
		.sort();
const read = (node: Node, key: string): unknown => (node[key] as () => unknown).call(node);

function arenaDigest(): string {
	const hash = createHash('sha1');
	for (const id of [...live.keys()].sort((a, b) => a - b)) {
		const { data, meta } = live.get(id)!;
		hash.update(`${id}:`);
		hash.update(data.byteLength === 0 ? 'detached' : new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
		hash.update(meta.byteLength === 0 ? 'detached' : meta);
	}
	hash.update(`freed:${freed.join(',')}`);
	return hash.digest('hex');
}

const steps: { readonly step: string; readonly arena?: string; readonly render?: string; readonly refused?: string }[] = [];
const held: object[] = [];

function step(label: string, op: () => unknown): Node | undefined {
	let result: unknown;
	try {
		result = op();
	} catch (error) {
		steps.push({ step: label, refused: (error as Error).message.split('\n')[0]!.slice(0, 160), arena: arenaDigest() });
		return undefined;
	}
	if (!isNode(result)) throw new Error(`${label}: a setter returned no node`);
	held.push(result);
	const render = createHash('sha1').update(String(engine.render(result as never))).digest('hex');
	steps.push({ step: label, arena: arenaDigest(), render });
	return result;
}

function set(node: Node, key: string, value: unknown): unknown {
	const setter = node.$with![key]!;
	return Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value);
}

const byKind = new Map<number, Node[]>();
const roots: Node[] = [];
function collect(value: unknown, depth: number): void {
	if (Array.isArray(value)) {
		for (const item of value) collect(item, depth);
		return;
	}
	if (!isNode(value) || depth > 64) return;
	const seen = byKind.get(value.$type) ?? [];
	if (seen.length < Number(occurrences)) seen.push(value);
	byKind.set(value.$type, seen);
	for (const key of settersOf(value)) collect(read(value, key), depth + 1);
}
for (const entry of loadCorpusEntries(grammar)) {
	const root = engine.parse(entry.source) as unknown as Node;
	roots.push(root);
	collect(root, 0);
}

let setters = 0;
for (const kind of [...byKind.keys()].sort((a, b) => a - b)) {
	const nodes = byKind.get(kind)!;
	for (let n = 0; n < nodes.length; n++) {
		const node = nodes[n]!;
		const other = nodes[(n + 1) % nodes.length]!;
		for (const key of settersOf(node)) {
			if (n === 0) setters++;
			const at = `${kind}.${key}#${n}`;
			const parsed = step(`${at} parsed same`, () => set(node, key, read(node, key)));
			if (other !== node) step(`${at} parsed changed`, () => set(node, key, read(other, key)));
			if (parsed === undefined) continue;
			step(`${at} built same`, () => set(parsed, key, read(parsed, key)));
			if (other !== node) step(`${at} built changed`, () => set(parsed, key, read(other, key)));
		}
	}
	for (const node of held.splice(0)) engine.release(node as never);
	steps.push({ step: `${kind} released`, arena: arenaDigest() });
}

for (const root of roots) engine.release(root as never);
if (owner !== undefined) native.builtWords(owner, 16);
const memory = owner === undefined ? undefined : native.builtMemory(owner);
const end = { step: 'released', arena: arenaDigest(), live: [...live.keys()].sort((a, b) => a - b), freed, memory };
for (const line of steps) console.log(JSON.stringify(line));
console.log(JSON.stringify(end));
console.log(JSON.stringify({ summary: { kinds: byKind.size, setters, steps: steps.length, refused: steps.filter((line) => line.refused !== undefined).length } }));
