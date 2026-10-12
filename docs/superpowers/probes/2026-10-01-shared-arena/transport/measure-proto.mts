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
import { fileURLToPath } from 'node:url';

const ROOT = process.env.SITTIR_ROOT ?? process.cwd();
const HERE = fileURLToPath(new URL('.', import.meta.url));
const VIEWS = process.argv.includes('--views');
const sourcePath = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? `${HERE}inputs/engine.rs`;
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
// Every form gets the same members: an accessor and a `$with` setter per slot, `$trivia`, `$render`,
// `$query` and `$engine`.
const SLOTS = ['visibility_modifier', 'function_modifiers', 'name', 'type_parameters', 'parameters', 'return_type', 'where_clause', 'body'] as const;
const ACCESSORS = ['visibilityModifier', 'functionModifiers', 'name', 'typeParameters', 'parameters', 'returnType', 'whereClause', 'body'] as const;
const child = (v: unknown) => v;
function attach(data: any) {
	const { $trivia: trivia, ...slots } = data;
	const node = {
		...slots,
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
		$trivia: () => trivia,
		$render: () => node,
		$query: () => node,
		$engine: () => undefined
	};
	return node;
}

// --- arena words: a view literal whose accessors read the record in place ------------------
// A slot decodes to what the napi object carries for it: a coordinate, a leaf with its kind, text
// and span, or a kind id. The record is one header word, five words a slot, then the trivia's
// offset and count.
const decoder = new TextDecoder();
function slotAt(words: Uint32Array, text: Uint8Array, at: number): unknown {
	switch (words[at]) {
		case 1:
			return { $type: words[at + 1], $row: words[at + 2], $start: words[at + 3], $end: words[at + 4] };
		case 2:
			return {
				$type: words[at + 1],
				$text: decoder.decode(text.subarray(words[at + 4], words[at + 4] + (words[at + 3] - words[at + 2]))),
				$start: words[at + 2],
				$end: words[at + 3]
			};
		case 3:
			return words[at + 1];
		default:
			return undefined;
	}
}
function coordsAt(words: Uint32Array, at: number): unknown[] {
	const out = [];
	for (let i = 0, base = words[at]; i < words[at + 1]; i++, base += 5) {
		out.push({ $type: words[base + 1], $row: words[base + 2], $start: words[base + 3], $end: words[base + 4] });
	}
	return out;
}
function fieldsOf(words: Uint32Array, text: Uint8Array, off: number) {
	const out: Record<string, unknown> = { $type: words[off], $trivia: coordsAt(words, off + 41) };
	SLOTS.forEach((slot, i) => (out[`_${slot}`] = slotAt(words, text, off + 1 + 5 * i)));
	return out;
}
function view(words: Uint32Array, text: Uint8Array, off: number) {
	const draft = (slot: string, v: unknown) => attach({ ...fieldsOf(words, text, off), [`_${slot}`]: v });
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
		$with: {
			visibilityModifier: (v: unknown) => draft('visibility_modifier', v),
			functionModifiers: (v: unknown) => draft('function_modifiers', v),
			name: (v: unknown) => draft('name', v),
			typeParameters: (v: unknown) => draft('type_parameters', v),
			parameters: (v: unknown) => draft('parameters', v),
			returnType: (v: unknown) => draft('return_type', v),
			whereClause: (v: unknown) => draft('where_clause', v),
			body: (v: unknown) => draft('body', v)
		},
		$trivia: () => coordsAt(words, off + 41),
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
// Each form, with its members attached, must expose the same members, and every slot and the
// trivia must read the same through them, before anything is timed.
const memberNames = (node: any) =>
	JSON.stringify([
		Object.keys(node)
			.filter((key) => typeof node[key] === 'function')
			.sort(),
		Object.keys(node.$with).sort()
	]);
const reads = (node: any) => JSON.stringify(normal({ $type: node.$type, $trivia: node.$trivia(), ...Object.fromEntries(ACCESSORS.map((a) => [a, node[a]()])) }));
const forms = [objs.map(attach), fromJson.map(attach), viaWords];
const mismatch = (() => {
	if (objs.length !== N || fromJson.length !== N || viaWords.length !== N) return `node counts ${objs.length}, ${fromJson.length}, ${viaWords.length} against ${N}`;
	for (let i = 0; i < N; i++) {
		const [o, j, a] = forms.map((form) => form[i]);
		if (memberNames(o) !== memberNames(j) || memberNames(o) !== memberNames(a)) return `members differ at node ${i}: ${memberNames(o)} / ${memberNames(j)} / ${memberNames(a)}`;
		if (reads(o) !== reads(j) || reads(o) !== reads(a)) return `reads differ at node ${i}: ${reads(o)} / ${reads(j)} / ${reads(a)}`;
	}
	return undefined;
})();
if (mismatch !== undefined) throw new Error(`the three forms do not carry the same transport: ${mismatch}`);
console.log(`forms agree: every slot, the trivia and the members of all ${N} nodes; arena ${w.words.length * 4} B words + ${w.text.length} B text`);
const refusal = p.refusalWithoutBody() as string;
if (!/^function_item \(kind \d+\) has no route for its child block \(kind \d+\) at row \d+$/.test(refusal))
	throw new Error(`with the body route removed, the read must refuse function_item's block; got: ${refusal}`);
console.log(`refusal with the body route removed: ${refusal}`);

if (VIEWS) {
	measureViews();
	process.exit(0);
}

// --- `--views`: how a view's literal is built, against the object form ---------------------
// Every form carries the members master's generated wrap attaches: an accessor and a `$with`
// setter per slot, `$render`, `$trivia` with `leading` and `trailing`, `$query`, `$snapshot` and
// `$engine`. Accessors are methods and the rest arrows, as the wrap writes them; the forms differ
// only in how the literal reaches its data.
function measureViews(): void {
	const SETTERS = ACCESSORS;
	// The object form: the transport's fields spread into the literal.
	function objectNode(data: any): any {
		const { $trivia: trivia, ...slots } = data;
		const node: any = {
			...slots,
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
				visibilityModifier: (v: unknown) => objectNode({ ...data, _visibility_modifier: v }),
				functionModifiers: (v: unknown) => objectNode({ ...data, _function_modifiers: v }),
				name: (v: unknown) => objectNode({ ...data, _name: v }),
				typeParameters: (v: unknown) => objectNode({ ...data, _type_parameters: v }),
				parameters: (v: unknown) => objectNode({ ...data, _parameters: v }),
				returnType: (v: unknown) => objectNode({ ...data, _return_type: v }),
				whereClause: (v: unknown) => objectNode({ ...data, _where_clause: v }),
				body: (v: unknown) => objectNode({ ...data, _body: v })
			},
			$render: () => node,
			$trivia: { leading: () => trivia, trailing: () => [] },
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}
	// V0: the view as the probe first had it, its accessors arrows over the buffer and offset.
	function viewArrows(words: Uint32Array, text: Uint8Array, off: number): any {
		const draft = (slot: string, v: unknown) => objectNode({ ...fieldsOf(words, text, off), [`_${slot}`]: v });
		const node: any = {
			$type: words[off],
			visibilityModifier: () => slotAt(words, text, off + 1),
			functionModifiers: () => slotAt(words, text, off + 6),
			name: () => slotAt(words, text, off + 11),
			typeParameters: () => slotAt(words, text, off + 16),
			parameters: () => slotAt(words, text, off + 21),
			returnType: () => slotAt(words, text, off + 26),
			whereClause: () => slotAt(words, text, off + 31),
			body: () => slotAt(words, text, off + 36),
			$with: {
				visibilityModifier: (v: unknown) => draft('visibility_modifier', v),
				functionModifiers: (v: unknown) => draft('function_modifiers', v),
				name: (v: unknown) => draft('name', v),
				typeParameters: (v: unknown) => draft('type_parameters', v),
				parameters: (v: unknown) => draft('parameters', v),
				returnType: (v: unknown) => draft('return_type', v),
				whereClause: (v: unknown) => draft('where_clause', v),
				body: (v: unknown) => draft('body', v)
			},
			$render: () => node,
			$trivia: { leading: () => coordsAt(words, off + 41), trailing: () => [] },
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}
	// The record a view names, by one number: the batch's buffers in a table, as the engine's
	// arenas are per tree, and the record's word offset.
	const arenas: { words: Uint32Array; text: Uint8Array }[] = [];
	const WORD = 2 ** 20;
	const wordsOf = (r: number) => arenas[Math.floor(r / WORD)]!.words;
	const textOf = (r: number) => arenas[Math.floor(r / WORD)]!.text;
	const slotOf = (r: number, at: number) => slotAt(wordsOf(r), textOf(r), (r % WORD) + at);
	const draftOf = (r: number, slot: string, v: unknown) => objectNode({ ...fieldsOf(wordsOf(r), textOf(r), r % WORD), [`_${slot}`]: v });
	// V1: accessors as methods over three own fields, the buffers and the offset.
	function viewFields(words: Uint32Array, text: Uint8Array, off: number): any {
		const node: any = {
			$type: words[off],
			_words: words,
			_text: text,
			_at: off,
			visibilityModifier() {
				return slotAt(this._words, this._text, this._at + 1);
			},
			functionModifiers() {
				return slotAt(this._words, this._text, this._at + 6);
			},
			name() {
				return slotAt(this._words, this._text, this._at + 11);
			},
			typeParameters() {
				return slotAt(this._words, this._text, this._at + 16);
			},
			parameters() {
				return slotAt(this._words, this._text, this._at + 21);
			},
			returnType() {
				return slotAt(this._words, this._text, this._at + 26);
			},
			whereClause() {
				return slotAt(this._words, this._text, this._at + 31);
			},
			body() {
				return slotAt(this._words, this._text, this._at + 36);
			},
			$with: {
				visibilityModifier: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _visibility_modifier: v }),
				functionModifiers: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _function_modifiers: v }),
				name: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _name: v }),
				typeParameters: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _type_parameters: v }),
				parameters: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _parameters: v }),
				returnType: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _return_type: v }),
				whereClause: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _where_clause: v }),
				body: (v: unknown) => objectNode({ ...fieldsOf(words, text, off), _body: v })
			},
			$render: () => node,
			$trivia: { leading: () => coordsAt(words, off + 41), trailing: () => [] },
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}
	// V2: accessors as methods over one own number, the record's address.
	function viewAddress(r: number): any {
		const node: any = {
			$type: wordsOf(r)[r % WORD],
			_r: r,
			visibilityModifier() {
				return slotOf(this._r, 1);
			},
			functionModifiers() {
				return slotOf(this._r, 6);
			},
			name() {
				return slotOf(this._r, 11);
			},
			typeParameters() {
				return slotOf(this._r, 16);
			},
			parameters() {
				return slotOf(this._r, 21);
			},
			returnType() {
				return slotOf(this._r, 26);
			},
			whereClause() {
				return slotOf(this._r, 31);
			},
			body() {
				return slotOf(this._r, 36);
			},
			$with: {
				visibilityModifier: (v: unknown) => draftOf(r, 'visibility_modifier', v),
				functionModifiers: (v: unknown) => draftOf(r, 'function_modifiers', v),
				name: (v: unknown) => draftOf(r, 'name', v),
				typeParameters: (v: unknown) => draftOf(r, 'type_parameters', v),
				parameters: (v: unknown) => draftOf(r, 'parameters', v),
				returnType: (v: unknown) => draftOf(r, 'return_type', v),
				whereClause: (v: unknown) => draftOf(r, 'where_clause', v),
				body: (v: unknown) => draftOf(r, 'body', v)
			},
			$render: () => node,
			$trivia: { leading: () => coordsAt(wordsOf(r), (r % WORD) + 41), trailing: () => [] },
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}
	// V3: V2 with `$with` and `$trivia` made when first reached, each kept on the node; their
	// closures are still written in a literal.
	function viewLazy(r: number): any {
		const node: any = {
			$type: wordsOf(r)[r % WORD],
			_r: r,
			_with: undefined,
			_trivia: undefined,
			visibilityModifier() {
				return slotOf(this._r, 1);
			},
			functionModifiers() {
				return slotOf(this._r, 6);
			},
			name() {
				return slotOf(this._r, 11);
			},
			typeParameters() {
				return slotOf(this._r, 16);
			},
			parameters() {
				return slotOf(this._r, 21);
			},
			returnType() {
				return slotOf(this._r, 26);
			},
			whereClause() {
				return slotOf(this._r, 31);
			},
			body() {
				return slotOf(this._r, 36);
			},
			get $with() {
				return (this._with ??= {
					visibilityModifier: (v: unknown) => draftOf(r, 'visibility_modifier', v),
					functionModifiers: (v: unknown) => draftOf(r, 'function_modifiers', v),
					name: (v: unknown) => draftOf(r, 'name', v),
					typeParameters: (v: unknown) => draftOf(r, 'type_parameters', v),
					parameters: (v: unknown) => draftOf(r, 'parameters', v),
					returnType: (v: unknown) => draftOf(r, 'return_type', v),
					whereClause: (v: unknown) => draftOf(r, 'where_clause', v),
					body: (v: unknown) => draftOf(r, 'body', v)
				});
			},
			get $trivia() {
				return (this._trivia ??= { leading: () => coordsAt(wordsOf(r), (r % WORD) + 41), trailing: () => [] });
			},
			$render: () => node,
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}

	// V4: V2 with `$with` and `$trivia` as methods that build their object on first call and keep
	// it in a field the literal declares. Calling them is an API change.
	function viewMethods(r: number): any {
		const node: any = {
			$type: wordsOf(r)[r % WORD],
			_r: r,
			_with: undefined,
			_trivia: undefined,
			visibilityModifier() {
				return slotOf(this._r, 1);
			},
			functionModifiers() {
				return slotOf(this._r, 6);
			},
			name() {
				return slotOf(this._r, 11);
			},
			typeParameters() {
				return slotOf(this._r, 16);
			},
			parameters() {
				return slotOf(this._r, 21);
			},
			returnType() {
				return slotOf(this._r, 26);
			},
			whereClause() {
				return slotOf(this._r, 31);
			},
			body() {
				return slotOf(this._r, 36);
			},
			$with() {
				return (this._with ??= lazyWith(this._r));
			},
			$trivia() {
				return (this._trivia ??= lazyTrivia(this._r));
			},
			$render: () => node,
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}
	const lazyWith = (r: number) => ({
		visibilityModifier: (v: unknown) => draftOf(r, 'visibility_modifier', v),
		functionModifiers: (v: unknown) => draftOf(r, 'function_modifiers', v),
		name: (v: unknown) => draftOf(r, 'name', v),
		typeParameters: (v: unknown) => draftOf(r, 'type_parameters', v),
		parameters: (v: unknown) => draftOf(r, 'parameters', v),
		returnType: (v: unknown) => draftOf(r, 'return_type', v),
		whereClause: (v: unknown) => draftOf(r, 'where_clause', v),
		body: (v: unknown) => draftOf(r, 'body', v)
	});
	const lazyTrivia = (r: number) => ({ leading: () => coordsAt(wordsOf(r), (r % WORD) + 41), trailing: () => [] });
	// V5: V2 with `$with` and `$trivia` as getters on one prototype for the kind, building their
	// object on first access into a field the literal declares.
	const FUNCTION_ITEM_LAZY = {
		get $with() {
			const self = this as any;
			return (self._with ??= lazyWith(self._r));
		},
		get $trivia() {
			const self = this as any;
			return (self._trivia ??= lazyTrivia(self._r));
		}
	};
	function viewShared(r: number): any {
		const node: any = {
			__proto__: FUNCTION_ITEM_LAZY,
			$type: wordsOf(r)[r % WORD],
			_r: r,
			_with: undefined,
			_trivia: undefined,
			visibilityModifier() {
				return slotOf(this._r, 1);
			},
			functionModifiers() {
				return slotOf(this._r, 6);
			},
			name() {
				return slotOf(this._r, 11);
			},
			typeParameters() {
				return slotOf(this._r, 16);
			},
			parameters() {
				return slotOf(this._r, 21);
			},
			returnType() {
				return slotOf(this._r, 26);
			},
			whereClause() {
				return slotOf(this._r, 31);
			},
			body() {
				return slotOf(this._r, 36);
			},
			$render: () => node,
			$query: () => node,
			$snapshot: () => node,
			$engine: () => undefined
		};
		return node;
	}

	type Batch = { words: Uint32Array; text: Uint8Array; count: number };
	const addressed = (w: Batch, make: (r: number) => any) => {
		const base = arenas.push({ words: w.words, text: w.text }) - 1;
		const out = new Array(w.count);
		for (let i = 0; i < w.count; i++) out[i] = make(base * WORD + w.words[1 + i]!);
		return out;
	};
	const FORMS: [string, () => unknown, (x: any) => any[], (r: number) => any][] = [
		['objects', () => p.allObjects(), (x: any[]) => x.map(objectNode), (r) => objectNode(p.oneObject(r))],
		['V0 view, arrows', () => p.allWords(), (w: Batch) => Array.from({ length: w.count }, (_, i) => viewArrows(w.words, w.text, w.words[1 + i]!)), (r) => { const w = p.oneWords(r) as Batch; return viewArrows(w.words, w.text, w.words[1]!); }],
		['V1 view, fields', () => p.allWords(), (w: Batch) => Array.from({ length: w.count }, (_, i) => viewFields(w.words, w.text, w.words[1 + i]!)), (r) => { const w = p.oneWords(r) as Batch; return viewFields(w.words, w.text, w.words[1]!); }],
		['V2 view, address', () => p.allWords(), (w: Batch) => addressed(w, viewAddress), (r) => addressed(p.oneWords(r) as Batch, viewAddress)[0]],
		['V3 view, lazy', () => p.allWords(), (w: Batch) => addressed(w, viewLazy), (r) => addressed(p.oneWords(r) as Batch, viewLazy)[0]],
		['V4 view, lazy methods', () => p.allWords(), (w: Batch) => addressed(w, viewMethods), (r) => addressed(p.oneWords(r) as Batch, viewMethods)[0]],
		['V5 view, lazy prototype', () => p.allWords(), (w: Batch) => addressed(w, viewShared), (r) => addressed(p.oneWords(r) as Batch, viewShared)[0]]
	];

	const withOf = (node: any) => (typeof node.$with === 'function' ? node.$with() : node.$with);
	const triviaOf = (node: any) => (typeof node.$trivia === 'function' ? node.$trivia() : node.$trivia);
	const gc = (globalThis as { gc?: () => void }).gc;
	if (!gc) throw new Error('--views needs --expose-gc');
	const only = process.argv.find((arg) => arg.startsWith('--form='))?.slice('--form='.length);
	if (only !== undefined) {
		const form = FORMS.find(([label]) => label.split(' ')[0] === only);
		if (form === undefined) throw new Error(`--form=${only} names no form: ${FORMS.map(([label]) => label.split(' ')[0]).join(', ')}`);
		measureForm(form);
		return;
	}

	// Every form exposes the same members and reads the same through them, before timing.
	const viewMembers = (node: any) => JSON.stringify([ACCESSORS.filter((a) => typeof node[a] === 'function'), Object.keys(withOf(node)).sort(), Object.keys(triviaOf(node)).sort(), ['$render', '$query', '$snapshot', '$engine'].filter((m) => typeof node[m] === 'function')]);
	const viewReads = (node: any) => JSON.stringify(normal({ $type: node.$type, leading: triviaOf(node).leading(), ...Object.fromEntries(ACCESSORS.map((a) => [a, node[a]()])) }));
	const built = FORMS.map(([, cross, attachAll]) => attachAll(cross()));
	for (let i = 0; i < N; i++) {
		const [o, ...vs] = built.map((nodes) => nodes[i]);
		for (const [k, v] of vs.entries()) {
			if (viewMembers(o) !== viewMembers(v)) throw new Error(`${FORMS[k + 1]![0]}: members differ at node ${i}`);
			if (viewReads(o) !== viewReads(v)) throw new Error(`${FORMS[k + 1]![0]}: reads differ at node ${i}`);
			const draft = withOf(v)[SETTERS[2]](o._name);
			if (viewReads(draft) !== viewReads(o.$with[SETTERS[2]](o._name))) throw new Error(`${FORMS[k + 1]![0]}: a $with draft differs at node ${i}`);
		}
	}
	console.log(`views agree with the object form: members, every slot, leading trivia and a $with draft of all ${N} nodes`);

	// One form alone in this process (`--form=<V…|objects>`), so no other form's shapes exist:
	// the read times, the heap, and how many nodes keep fast properties (`%HasFastProperties`,
	// which needs --allow-natives-syntax) over 200 batches held, before and after every accessor,
	// `$with` and `$trivia` is reached. One JSON line.
	function measureForm([label, cross, attachAll, one]: (typeof FORMS)[number]): void {
		const hasFast = new Function('node', 'return %HasFastProperties(node)') as (node: unknown) => boolean;
		const batch = (time(200, () => attachAll(cross())).ms * 1e6) / N;
		arenas.length = 0;
		const oneNs = (time(100, () => rows.map(one)).ms * 1e6) / N;
		arenas.length = 0;
		gc!();
		gc!();
		const before = process.memoryUsage().heapUsed;
		const held: any[][] = [];
		for (let i = 0; i < 200; i++) held.push(attachAll(cross()));
		gc!();
		gc!();
		const heap = (process.memoryUsage().heapUsed - before) / (200 * N);
		const nodes = held.flat();
		const fast = nodes.filter(hasFast).length;
		const reach = () => {
			for (const node of nodes) {
				for (const accessor of ACCESSORS) node[accessor]();
				triviaOf(node).leading();
				withOf(node);
			}
		};
		const readMany = (time(5, reach, 1).ms * 1e6) / nodes.length;
		const fastAfter = nodes.filter(hasFast).length;
		gc!();
		gc!();
		const heapReached = (process.memoryUsage().heapUsed - before) / (200 * N);
		console.log(JSON.stringify({ form: label, input: sourcePath.split('/').slice(-1)[0], batchNs: batch, oneNs, heap, fast, nodes: nodes.length, readManyNs: readMany, fastAfter, heapReached }));
	}
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
		arenas.length = 0;
		return (after - before) / (COPIES * N);
	};
	const ROUNDS = Number(process.env.ROUNDS ?? 3);
	const results = new Map<string, { batch: number[]; one: number[]; heap: number[] }>(FORMS.map(([label]) => [label, { batch: [], one: [], heap: [] }]));
	for (let round = 0; round < ROUNDS; round++) {
		const order = round % 2 === 0 ? FORMS : [...FORMS].reverse();
		for (const [label, cross, attachAll, one] of order) {
			const r = results.get(label)!;
			r.batch.push((time(200, () => attachAll(cross())).ms * 1e6) / N);
			arenas.length = 0;
			r.one.push((time(100, () => rows.map(one)).ms * 1e6) / N);
			arenas.length = 0;
			r.heap.push(heldBy(() => attachAll(cross())));
		}
	}
	console.log(`\n## views, ${ROUNDS} rounds alternating, medians per function_item`);
	console.log('| form | every match in one call, with members | one node per call, with members | retained heap per node |');
	console.log('| --- | --- | --- | --- |');
	for (const [label] of FORMS) {
		const r = results.get(label)!;
		console.log(`| ${label} | ${(median(r.batch) / 1000).toFixed(2)} µs | ${(median(r.one) / 1000).toFixed(2)} µs | ${median(r.heap).toFixed(0)} B |`);
	}
}

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
