import { addressOf, chunkOf, wordOf, decodeCell } from '../../../../../packages/common/src/record-cell.ts';
import { RECORD_HEADER_WORDS } from '../../../../../packages/rust/src/records.ts';

const nodes = new WeakMap();
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

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
	#chunks = [];
	#open = -1;
	#width;
	#first;
	#Type;
	used = [];

	constructor(Type, width, first, reserve) {
		this.#Type = Type;
		this.#width = width;
		this.#first = first;
		if (reserve) this.alloc(1);
	}

	alloc(size) {
		if (!Number.isSafeInteger(size) || size < 0 || size > 0xffffffff) throw new Error('invalid allocation size');
		let chunk = this.#open;
		const own = size > this.#width;
		if (own || chunk < 0 || this.used[chunk] >= this.#width || this.used[chunk] + size > this.#chunks[chunk].length) {
			const previous = chunk < 0 ? this.#first : this.#chunks[chunk].length;
			const capacity = own ? size : Math.max(size, Math.min(this.#width, previous * (chunk < 0 ? 1 : 2)));
			chunk = this.#chunks.length;
			if (chunk >= 2 ** 32 / this.#width) throw new Error('arena is full');
			this.#chunks.push(new this.#Type(capacity));
			this.used.push(0);
			if (!own) this.#open = chunk;
		}
		const word = this.used[chunk];
		this.used[chunk] += size;
		return { chunk, word, data: this.#chunks[chunk] };
	}

	chunk(n) {
		const chunk = this.#chunks[n];
		if (chunk === undefined) throw new Error('unknown chunk');
		return chunk;
	}

	views() {
		return this.#chunks.map((chunk, n) => chunk.subarray(0, this.used[n]));
	}
	registryViews() {
		return {
			chunks: this.#chunks.map((chunk, n) => (n === this.#open ? chunk : chunk.subarray(0, this.used[n]))),
			open: this.#open < 0 ? undefined : this.#open
		};
	}
	written() {
		return this.used[this.#open] ?? 0;
	}
	capacity() {
		return this.#chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
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
	#wrap;
	#native;
	#packet;
	#registration;
	#registeredWords = -1;
	#registeredStrings = -1;
	#textByValue = new Map();
	#textByOffset = new Map();
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
			this.#words = new Chunks(Uint32Array, width, firstWords, true);
			this.#strings = new Chunks(Uint8Array, width, firstWords, false);
		}
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
		return this.ref(node)._r;
	}

	address(ref) {
		return this.#mode === 'arena' ? ref.at : ref.data;
	}

	#location(at) {
		return { data: this.#words.chunk(chunkOf(at, this.#format)), word: wordOf(at, this.#format) };
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
		cursor.data[cursor.word] = kind;
		return cursor;
	}

	leaf(kind, text) {
		if (typeof text !== 'string') throw new Error('a leaf needs text');
		const ref = this.begin(kind, RECORD_HEADER_WORDS);
		if (this.#mode === 'object') ref.data.$text = text;
		else Object.assign(ref, this.#text(text));
		return ref;
	}

	#text(text) {
		const known = this.#textByValue.get(text);
		if (known !== undefined) return known;
		const target = this.#strings.alloc(text.length * 3);
		const { read, written } = encoder.encodeInto(text, target.data.subarray(target.word));
		if (read !== text.length) throw new Error('string did not fit its reservation');
		this.#strings.used[target.chunk] = target.word + written;
		this.#packet = undefined;
		const entry = { offset: addressOf(target.chunk, target.word, this.#format), len: written, text };
		this.#textByValue.set(text, entry);
		if (written !== 0) this.#textByOffset.set(entry.offset, entry);
		return entry;
	}

	text(ref) {
		if (this.#mode === 'object') return ref.data.$text;
		if (ref.text !== undefined) return ref.text;
		if (ref.len === 0) return '';
		const known = this.#textByOffset.get(ref.offset);
		if (known?.len === ref.len) return known.text;
		const chunk = this.#strings.chunk(chunkOf(ref.offset, this.#format));
		const at = wordOf(ref.offset, this.#format);
		return decoder.decode(chunk.subarray(at, at + ref.len));
	}

	copy(ref, size) {
		this.records++;
		if (this.#mode === 'object') return { kind: ref._r.$type, data: { ...ref._r } };
		const before = this.#location(ref._r);
		const after = this.#allocate(size);
		after.data.set(before.data.subarray(before.word, before.word + size), after.word);
		after.kind = before.data[before.word];
		return after;
	}

	prepare(value, run) {
		if (run === undefined || this.#mode === 'object') return value;
		if (value.length === 0) return { at: 0, len: 0 };
		const location = this.#allocate(value.length * run);
		for (let i = 0; i < value.length; i++) this.#cell(location.data, location.word + i * run, run, value[i]);
		return { at: location.at, len: value.length };
	}

	#raw(value) {
		if (value === undefined || typeof value !== 'object') return value;
		if (Array.isArray(value)) return value.map((item) => this.#raw(item));
		return this.ref(value)._r;
	}

	put(ref, key, word, width, run, bit, value) {
		if (bit !== undefined) value ??= false;
		if (this.#mode === 'object') {
			ref.data[key] = this.#raw(value);
			return;
		}
		const at = ref;
		if (bit !== undefined) {
			const mask = 2 ** bit;
			at.data[at.word + word] = (at.data[at.word + word] & ~mask) | (value ? mask : 0);
		} else if (run !== undefined) {
			at.data[at.word + word] = value.at;
			at.data[at.word + word + 1] = value.len;
		} else this.#cell(at.data, at.word + word, width, value);
	}

	#cell(data, at, width, value) {
		data.fill(0, at, at + width);
		if (value === undefined) return;
		if (typeof value === 'number') {
			if (width < 3) throw new Error('unit cell is too narrow');
			data[at] = this.#format.unit;
			data[at + 1] = value;
			return;
		}
		const text = typeof value === 'string';
		const ref = text ? this.#text(value) : this.ref(value);
		const leaf = text || ref._offset !== undefined;
		const words = leaf ? (text ? 4 : 5) : 5;
		if (width < words) throw new Error('cell is too narrow');
		data[at] = leaf ? this.#format.builtLeaf : this.#format.child;
		data[at + 1] = text ? 0 : ref.$type;
		data[at + 2] = leaf ? (text ? ref.offset : ref._offset) : ref._r;
		if (leaf) {
			data[at + 3] = text ? ref.len : ref._len;
			if (!text) data[at + 4] = ref._r;
		}
	}

	#fromRaw(value) {
		if (value === undefined || typeof value !== 'object') return value;
		if (Array.isArray(value)) return value.map((item) => this.#fromRaw(item));
		return this.#wrap(this, { kind: value.$type, data: value });
	}

	#fromCell(data, word) {
		const cell = decodeCell(data, word, this.#format);
		switch (cell.form) {
			case 'absent':
				return undefined;
			case 'unit':
				return cell.kind;
			case 'builtText':
				return this.text(cell);
			case 'builtLeaf':
				return this.#wrap(this, { kind: cell.kind, at: cell.record, offset: cell.offset, len: cell.len });
			case 'child':
				if (cell.link !== undefined) throw new Error('the construction probe does not own parsed links');
				return this.#wrap(this, { kind: cell.kind, at: cell.at });
			default:
				throw new Error(`unexpected built cell ${cell.form}`);
		}
	}

	get(ref, key, word, run, bit) {
		if (this.#mode === 'object') return this.#fromRaw(ref._r[key]);
		const at = this.#location(ref._r);
		if (bit !== undefined) return (at.data[at.word + word] & (2 ** bit)) !== 0;
		if (run === undefined) return this.#fromCell(at.data, at.word + word);
		const start = at.data[at.word + word];
		const len = at.data[at.word + word + 1];
		if (len === 0) return [];
		const list = this.#location(start);
		return Array.from({ length: len }, (_, item) => this.#fromCell(list.data, list.word + item * run));
	}

	packet() {
		if (this.#mode !== 'arena') throw new Error('objects have no chunk packet');
		return (this.#packet ??= { chunks: this.#words.views(), strings: this.#strings.views() });
	}

	renderRef(ref) {
		if (this.#mode === 'object') return this.#native.renderObject(ref._r);
		if (this.#registeredWords !== this.#words.used.length || this.#registeredStrings !== this.#strings.used.length) {
			const words = this.#words.registryViews();
			const strings = this.#strings.registryViews();
			const previous = this.#registration;
			this.#registration = this.#native.registerArena(words.chunks, strings.chunks, words.open, strings.open);
			this.#registeredWords = this.#words.used.length;
			this.#registeredStrings = this.#strings.used.length;
			previous?.dispose();
		}
		const words = this.#words.written();
		const bytes = this.#strings.written();
		return ref._offset === undefined
			? this.#registration.renderRecord(ref._r, words, bytes)
			: this.#registration.render(ref._r, ref._offset, ref._len, words, bytes);
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
			chunks: this.#words.used.length,
			stringChunks: this.#strings.used.length
		};
	}
}
