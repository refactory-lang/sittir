/**
 * Feasibility probe: write rebuilt node data into a flat u32 buffer plus a UTF-8 string pool,
 * and compare with today's projection (`toTransportData`), which builds a second object tree.
 *
 * The encoder here is generic (it enumerates keys and looks slot ids up in a map); generated
 * per-kind writers would know each kind's slots and skip both, so this is an upper bound.
 */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust'] = process.argv.slice(2);
const { toTransportData } = await import(`${REPO}/packages/common/src/transport-data.ts`);

const fixtures = (
	JSON.parse(readFileSync(`${REPO}/rust/crates/sittir-${grammar}/test-fixtures.json`, 'utf8')) as {
		kind: string;
		input: unknown;
	}[]
).filter((f) => f.kind === 'render');
const inputs = fixtures.map((f) => f.input);

const TAG_NODE = 1 << 28;
const TAG_LIST = 2 << 28;
const TAG_TEXT = 3 << 28;
const TAG_INT = 4 << 28;
const TAG_BOOL = 5 << 28;

class Arena {
	words = new Uint32Array(1 << 16);
	next = 1; // 0 is "absent"
	bytes = new Uint8Array(1 << 16);
	nextByte = 0;
	encoder = new TextEncoder();
	slotIds = new Map<string, number>();

	reset(): void {
		this.next = 1;
		this.nextByte = 0;
	}
	bump(n: number): number {
		const at = this.next;
		if (at + n > this.words.length) {
			const grown = new Uint32Array(Math.max(this.words.length * 2, at + n));
			grown.set(this.words);
			this.words = grown;
		}
		this.next = at + n;
		return at;
	}
	text(value: string): number {
		const need = value.length * 3;
		if (this.nextByte + need > this.bytes.length) {
			const grown = new Uint8Array(Math.max(this.bytes.length * 2, this.nextByte + need));
			grown.set(this.bytes);
			this.bytes = grown;
		}
		const start = this.nextByte;
		const { written } = this.encoder.encodeInto(value, this.bytes.subarray(start));
		this.nextByte = start + written;
		const at = this.bump(2);
		this.words[at] = start;
		this.words[at + 1] = written;
		return TAG_TEXT | at;
	}
	slotId(key: string): number {
		let id = this.slotIds.get(key);
		if (id === undefined) {
			id = this.slotIds.size + 1;
			this.slotIds.set(key, id);
		}
		return id;
	}
	value(value: unknown): number {
		if (value === undefined || value === null) return 0;
		if (typeof value === 'string') return this.text(value);
		if (typeof value === 'number') return TAG_INT | (value & 0x0fffffff);
		if (typeof value === 'boolean') return TAG_BOOL | (value ? 1 : 0);
		if (Array.isArray(value)) {
			const at = this.bump(1 + value.length);
			this.words[at] = value.length;
			for (let i = 0; i < value.length; i++) this.words[at + 1 + i] = this.value(value[i]);
			return TAG_LIST | at;
		}
		return TAG_NODE | this.node(value as Record<string, unknown>);
	}
	node(record: Record<string, unknown>): number {
		let slots = 0;
		for (const key in record) if (key.charCodeAt(0) === 95 /* _ */ || key === '$other' || key === '$text') slots++;
		const at = this.bump(2 + slots * 2);
		this.words[at] = record.$type as number;
		this.words[at + 1] = slots;
		let i = at + 2;
		for (const key in record) {
			if (!(key.charCodeAt(0) === 95 || key === '$other' || key === '$text')) continue;
			const slot = this.slotId(key);
			const word = this.value(record[key]);
			this.words[i] = slot;
			this.words[i + 1] = word;
			i += 2;
		}
		return at;
	}
}

function countValues(value: unknown): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countValues(v), 0);
	if (value === null || typeof value !== 'object') return typeof value === 'string' || typeof value === 'number' ? 1 : 0;
	let n = 1;
	for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
		if (key.startsWith('_') || key === '$other') n += countValues(child);
	}
	return n;
}
const values = inputs.reduce((n: number, i) => n + countValues(i), 0);

function loop(n: number, fn: () => void): number {
	for (let i = 0; i < 5; i++) fn();
	const t0 = performance.now();
	for (let i = 0; i < n; i++) fn();
	return (performance.now() - t0) / n;
}

const arena = new Arena();
let words = 0;
let poolBytes = 0;
const encode = loop(60, () => {
	words = 0;
	poolBytes = 0;
	for (const input of inputs) {
		arena.reset();
		arena.node(input as Record<string, unknown>);
		words += arena.next;
		poolBytes += arena.nextByte;
	}
});
const project = loop(60, () => {
	for (const input of inputs) toTransportData(input);
});

console.log(`# ${grammar}: ${inputs.length} fixtures, ${values} slot values`);
console.log(`today, projection to a second object tree: ${((project * 1e6) / values).toFixed(0)} ns per slot value`);
console.log(`generic arena encoder (upper bound):       ${((encode * 1e6) / values).toFixed(0)} ns per slot value`);
console.log(`arena size: ${words * 4 + poolBytes} bytes for all fixtures (${((words * 4 + poolBytes) / values).toFixed(0)} bytes per slot value)`);
