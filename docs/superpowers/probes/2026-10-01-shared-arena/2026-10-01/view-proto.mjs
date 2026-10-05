// Feasibility probe: traverse a tree image through thin view objects.
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const W = 6;
const KIND = 0, FIELD_FLAGS = 1, START = 2, END = 3, PARENT = 4, SUBTREE_END = 5;

class View {
	constructor(image, row) {
		this.image = image;
		this.row = row;
	}
	get kind() {
		return this.image[this.row * W + KIND] & 0xffff;
	}
	get start() {
		return this.image[this.row * W + START];
	}
	get end() {
		return this.image[this.row * W + END];
	}
	get named() {
		return (this.image[this.row * W + FIELD_FLAGS] >>> 16) & 1;
	}
	/** Every child, as views. */
	children() {
		const out = [];
		const image = this.image;
		const stop = image[this.row * W + SUBTREE_END];
		for (let c = this.row + 1; c < stop; c = image[c * W + SUBTREE_END]) out.push(new View(image, c));
		return out;
	}
	/** The first child carrying `field`, the way a generated accessor would ask. */
	child(field) {
		const image = this.image;
		const stop = image[this.row * W + SUBTREE_END];
		for (let c = this.row + 1; c < stop; c = image[c * W + SUBTREE_END]) {
			if ((image[c * W + FIELD_FLAGS] & 0xffff) === field) return new View(image, c);
		}
		return undefined;
	}
}

function visit(view, acc) {
	acc.nodes++;
	acc.sum += view.kind + (view.end - view.start);
	for (const child of view.children()) visit(child, acc);
}

function fieldLookups(image, rows) {
	// For each node with a field, ask its parent for it by field id.
	let found = 0;
	for (let r = 1; r < rows; r++) {
		const field = image[r * W + FIELD_FLAGS] & 0xffff;
		if (field === 0) continue;
		const parent = new View(image, image[r * W + PARENT]);
		if (parent.child(field) !== undefined) found++;
	}
	return found;
}

function median(xs) {
	return [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
}
function time(n, fn) {
	let last;
	for (let i = 0; i < 20; i++) last = fn();
	const samples = [];
	for (let i = 0; i < n; i++) {
		const t0 = performance.now();
		last = fn();
		samples.push(performance.now() - t0);
	}
	return { ms: median(samples), last };
}

for (const path of process.argv.slice(2)) {
	const bytes = readFileSync(path);
	const image = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
	const rows = image.length / W;
	const walk = time(200, () => {
		const acc = { nodes: 0, sum: 0 };
		visit(new View(image, 0), acc);
		return acc;
	});
	const lookups = time(200, () => fieldLookups(image, rows));
	console.log(`# ${path.split('/').pop()} — ${rows} rows`);
	console.log(`full traversal, one view object per node: ${(walk.ms * 1000).toFixed(0)} us (${((walk.ms * 1e6) / walk.last.nodes).toFixed(0)} ns per node, ${walk.last.nodes} nodes)`);
	console.log(`accessor-style lookup of every fielded child by field id: ${(lookups.ms * 1000).toFixed(0)} us (${((lookups.ms * 1e6) / Math.max(1, lookups.last)).toFixed(0)} ns per lookup, ${lookups.last} lookups)`);
}
