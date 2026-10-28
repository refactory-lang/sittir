import { addressOf, chunkOf, wordOf, withKind, kindField, headerKind, decodeListCell } from '../../../../../packages/common/src/record-cell.ts';
import { builtCell, decodeBuiltCell, unitCell } from '../../../../../packages/common/src/built-arena.ts';

export { builtCell, unitCell };

const nodes = new WeakMap();
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const ENTRY_HEAD_BYTES = 4;
const NO_WORDS = new Uint32Array(0);
const NO_BYTES = new Uint8Array(0);

export function ownerOf(node) {
	const owner = nodes.get(node);
	if (owner === undefined) throw new Error('a view has no storage owner');
	return owner;
}

export function check(store, value, admitted, shape, required, many) {
	if (many) {
		if (!Array.isArray(value) || (required && value.length === 0)) throw new Error('expected a nonempty list');
		for (const item of value) check(store, item, admitted, shape, true, false);
		return;
	}
	if (value === undefined) {
		if (required) throw new Error('required slot is absent');
		return;
	}
	if (shape === 'presence') {
		if (typeof value !== 'boolean') throw new Error('expected a presence flag');
		return;
	}
	if (shape === 'text') {
		if (typeof value !== 'string') throw new Error('expected text');
		return;
	}
	const kind = typeof value === 'number' ? value : store.ref(value).$type;
	if (!admitted.includes(kind)) throw new Error(`kind ${kind} is not admitted by this slot`);
}

class Chunks {
	#open = -1;
	#width;
	#first;
	#Type;
	#other;
	#none;
	chunks;
	used = [];
	count = 0;

	constructor(Type, width, first, chunks, other, none) {
		this.#Type = Type;
		this.#width = width;
		this.#first = first;
		this.chunks = chunks;
		this.#other = other;
		this.#none = none;
	}

	alloc(size) {
		if (!Number.isSafeInteger(size) || size < 0 || size > 0xffffffff) throw new Error('invalid allocation size');
		let chunk = this.#open;
		const own = size > this.#width;
		if (own || chunk < 0 || this.used[chunk] + size > this.chunks[chunk].length) {
			const previous = chunk < 0 ? this.#first : this.chunks[chunk].length;
			const capacity = own ? size : Math.max(size, Math.min(this.#width, previous * (chunk < 0 ? 1 : 2)));
			chunk = this.chunks.length;
			if (chunk >= 2 ** 30 / this.#width) throw new Error('arena is full');
			this.chunks.push(new this.#Type(capacity));
			this.#other.push(this.#none);
			this.used[chunk] = 0;
			this.count++;
			if (!own) this.#open = chunk;
		}
		const word = this.used[chunk];
		this.used[chunk] += size;
		return { chunk, word, data: this.chunks[chunk] };
	}

	holds(n) {
		return this.chunks[n] !== undefined && this.chunks[n].length !== 0;
	}

	chunk(n) {
		if (!this.holds(n)) throw new Error(`no chunk ${n} of this table`);
		return this.chunks[n];
	}

	views() {
		return this.chunks.map((chunk, n) => chunk.subarray(0, this.used[n] ?? 0));
	}
	registryViews() {
		return {
			chunks: this.chunks.map((chunk, n) => (n === this.#open ? chunk : chunk.subarray(0, this.used[n] ?? 0))),
			open: this.#open < 0 ? undefined : this.#open
		};
	}
	written() {
		return this.used[this.#open] ?? 0;
	}
	capacity() {
		return this.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
	}
	occupied() {
		return this.used.reduce((sum, used) => sum + used * this.#Type.BYTES_PER_ELEMENT, 0);
	}
}

export class Storage {
	#mode;
	#format;
	#words;
	#strings;
	#heads = [];
	#wrap;
	#native;
	#packet;
	#registration;
	#handle;
	#registered = -1;
	#entries = [];
	#entryAt = new Map();
	#reader;
	records = 0;
	wrappers = 0;

	constructor(mode, format, wrap, native, firstWords = 4096) {
		if (mode !== 'arena' && mode !== 'object') throw new Error('unknown storage mode');
		this.#mode = mode;
		this.#format = format;
		this.#wrap = wrap;
		this.#native = native;
		if (mode === 'arena') {
			const width = 2 ** format.chunkShift;
			const words = [NO_WORDS];
			const bytes = [NO_BYTES];
			this.#words = new Chunks(Uint32Array, width, firstWords, words, bytes, NO_BYTES);
			this.#strings = new Chunks(Uint8Array, width, firstWords, bytes, words, NO_WORDS);
			this.#reader = {
				format,
				holdsRecords: (chunk) => this.#words.holds(chunk),
				words: (at) => this.#words.chunk(chunkOf(at, format)),
				entryAt: (at) => this.#entryOf(at)
			};
		}
	}

	get format() {
		return this.#format;
	}

	register(node, record = true) {
		nodes.set(node, this);
		if (record) this.wrappers++;
		return node;
	}

	ref(node) {
		const known = nodes.get(node);
		if (known !== this) throw new Error('a builder child belongs to another storage owner');
		return node;
	}

	identity(node) {
		const ref = this.ref(node);
		return ref._r ?? `leaf:${ref._entry}`;
	}

	address(ref) {
		return this.#mode === 'arena' ? ref.at : ref.data;
	}

	#location(at) {
		return { data: this.#words.chunk(chunkOf(at, this.#format)), word: wordOf(at, this.#format) };
	}

	location(at) {
		return this.#location(at);
	}

	#allocate(size) {
		const location = this.#words.alloc(size);
		this.#packet = undefined;
		location.at = addressOf(location.chunk, location.word, this.#format);
		return location;
	}

	begin(kind, size) {
		this.records++;
		if (this.#mode === 'object') return { kind, data: { $type: kind } };
		const cursor = this.#allocate(size);
		cursor.kind = kind;
		cursor.data[cursor.word] = withKind(kind, this.#format.kindBits);
		return cursor;
	}

	leaf(kind, text) {
		if (typeof text !== 'string') throw new Error('a leaf needs text');
		if (this.#mode === 'arena') {
			const entry = this.#entry(kind, text);
			return { kind, entry: entry.at, len: entry.len, text };
		}
		const ref = this.begin(kind, 0);
		ref.data.$text = text;
		return ref;
	}

	#entry(kind, text) {
		const texts = (this.#entries[kind] ??= new Map());
		const known = texts.get(text);
		if (known !== undefined) return known;
		const target = this.#strings.alloc((ENTRY_HEAD_BYTES + text.length * 3 + 3) & ~3);
		const start = target.word + ENTRY_HEAD_BYTES;
		const { read, written } = encoder.encodeInto(text, target.data.subarray(start));
		if (read !== text.length) throw new Error('string did not fit its reservation');
		const { kindBits } = this.#format;
		if (written >= 2 ** (32 - kindBits)) throw new Error(`a leaf's text of ${written} bytes is past what an entry's length holds`);
		this.#strings.used[target.chunk] = target.word + ((ENTRY_HEAD_BYTES + written + 3) & ~3);
		this.#headsOf(target.chunk)[target.word >>> 2] = (withKind(kind, kindBits) | (written * 2 ** kindBits)) >>> 0;
		this.#packet = undefined;
		const entry = { at: addressOf(target.chunk, target.word, this.#format), kind, len: written, text };
		texts.set(text, entry);
		this.#entryAt.set(entry.at, entry);
		return entry;
	}

	#headsOf(chunk) {
		const data = this.#strings.chunk(chunk);
		return (this.#heads[chunk] ??= new Uint32Array(data.buffer, data.byteOffset, data.byteLength >>> 2));
	}

	#entryOf(at) {
		const known = this.#entryAt.get(at);
		if (known !== undefined) return { kind: known.kind, len: known.len, entry: known };
		const chunk = chunkOf(at, this.#format);
		const byte = wordOf(at, this.#format);
		const head = this.#headsOf(chunk)[byte >>> 2];
		const { kindBits } = this.#format;
		const kind = kindField(head, kindBits);
		const len = Math.floor(head / 2 ** kindBits);
		const data = this.#strings.chunk(chunk);
		const text = decoder.decode(data.subarray(byte + ENTRY_HEAD_BYTES, byte + ENTRY_HEAD_BYTES + len));
		const entry = { at, kind, len, text };
		this.#entryAt.set(at, entry);
		return { kind, len, entry };
	}

	text(ref) {
		if (this.#mode === 'object') return ref.data.$text;
		return ref.text ?? this.#entryOf(ref.entry).entry.text;
	}

	textCell(text) {
		return builtCell(this.#entry(0, text).at);
	}

	copy(ref, size) {
		this.records++;
		if (this.#mode === 'object') return { kind: ref._r.$type, data: { ...ref._r } };
		const before = this.#location(ref._r);
		const after = this.#allocate(size);
		after.data.set(before.data.subarray(before.word, before.word + size), after.word);
		after.kind = headerKind(before.data[before.word], this.#format.kindBits);
		return after;
	}

	get isArena() {
		return this.#mode === 'arena';
	}

	run(length) {
		const cursor = this.#allocate(length + 1);
		cursor.data[cursor.word] = length;
		return cursor;
	}

	#fromRaw(value) {
		if (value === undefined || typeof value !== 'object') return value;
		if (Array.isArray(value)) return value.map((item) => this.#fromRaw(item));
		return this.#wrap(this, { kind: value.$type, data: value });
	}

	#fromCell(word) {
		const cell = decodeBuiltCell(this.#reader, word);
		switch (cell.form) {
			case 'absent':
				return undefined;
			case 'unit':
				return cell.kind;
			case 'builtText':
				return this.#entryOf(cell.offset).entry.text;
			case 'builtLeaf':
				return this.#wrap(this, { kind: cell.kind, entry: cell.offset, len: cell.len });
			case 'child':
				if (cell.link !== undefined) throw new Error('the construction probe does not own parsed links');
				return this.#wrap(this, { kind: cell.kind, at: cell.at });
			default:
				throw new Error(`unexpected built cell ${cell.form}`);
		}
	}

	get(ref, key, cell, list, bit) {
		if (this.#mode === 'object') return this.#fromRaw(ref._r[key]);
		const at = this.#location(ref._r);
		if (bit !== undefined) return (at.data[at.word + cell] & (2 ** bit)) !== 0;
		const word = at.data[at.word + cell];
		if (!list) return this.#fromCell(word);
		const { run, len } = decodeListCell(this.#reader, word);
		if (len === 0) return [];
		const items = this.#location(run);
		return Array.from({ length: len }, (_, item) => this.#fromCell(items.data[items.word + item]));
	}

	packet() {
		if (this.#mode !== 'arena') throw new Error('objects have no chunk packet');
		return (this.#packet ??= { chunks: this.#words.views(), strings: this.#strings.views() });
	}

	renderRef(ref) {
		if (this.#mode === 'object') return this.#native.renderObject(ref._r);
		if (this.#registered !== this.#words.chunks.length) {
			const words = this.#words.registryViews();
			const strings = this.#strings.registryViews();
			const previous = this.#registration;
			this.#registration = this.#native.registerArena(words.chunks, strings.chunks, words.open, strings.open);
			this.#handle = this.#registration.handle;
			this.#registered = this.#words.chunks.length;
			previous?.dispose();
		}
		const words = this.#words.written();
		const bytes = this.#strings.written();
		return ref._entry === undefined
			? this.#native.renderRegisteredRecord(this.#handle, ref._r, words, bytes)
			: this.#native.renderRegisteredLeaf(this.#handle, ref.$type, ref._entry, words, bytes);
	}

	render(node) {
		return this.renderRef(this.ref(node));
	}
	memory() {
		if (this.#mode === 'object') return { records: this.records, wrappers: this.wrappers };
		return {
			records: this.records,
			wrappers: this.wrappers,
			recordBytes: this.#words.occupied(),
			recordCapacity: this.#words.capacity(),
			stringBytes: this.#strings.occupied(),
			stringCapacity: this.#strings.capacity(),
			chunks: this.#words.count,
			stringChunks: this.#strings.count
		};
	}
}
