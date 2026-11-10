import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { chunkOf } from '@sittir/common/engine';
import { coordinateOf, decodeIndex, isCoordinate, nodeText, recordOf, treeOf } from '@sittir/common/utils';
import { stableGrammars } from '@sittir/codegen/grammars';
import type { NodeCoordinate } from '@sittir/types';
import regex from '../../regex/src/index.ts';
import rust from '../../rust/src/index.ts';
import { languageByName } from '../src/languages.ts';
import { layoutWorkOf } from '../src/validate/layout-runs.ts';
import {
	loadCorpusEntries,
	loadSlotAccessorOf,
	slotValuesOf,
	wrappedNodesOf,
	type SlotAccessorOf,
	type TypedNode
} from '../src/validate/common.ts';

const placeOf = (at: NodeCoordinate | undefined) =>
	at && { row: decodeIndex(at.$treeHandle), end: at.$end, span: at.$span, kind: at.$type };

/** What the public surface says of a read value: each node's kind, text and coordinate, and its slots as the slot readers read them. */
function surfaceOf(value: unknown, accessorOf: SlotAccessorOf): unknown {
	if (Array.isArray(value)) return value.map((item) => surfaceOf(item, accessorOf));
	if (value === null || typeof value !== 'object') return value;
	if (isCoordinate(value)) return { coordinate: placeOf(value) };
	const node = value as TypedNode;
	return {
		kind: node.$type,
		text: nodeText(node),
		at: placeOf(coordinateOf(node)),
		slots: slotValuesOf(node, accessorOf).map(([key, slot]) => [key, surfaceOf(slot, accessorOf)])
	};
}

type Queried = { readonly $descendants: Iterable<object> };

function facetOf(root: unknown): Queried {
	return (root as { $query(): Queried }).$query();
}

function queried(root: unknown): object[] {
	return [...facetOf(root).$descendants];
}

async function engines(grammar: string) {
	const language = await languageByName(grammar);
	return {
		object: await createEngine(language, { nodeStorage: 'object' }),
		arena: await createEngine(language, { nodeStorage: 'arena' }),
		accessorOf: await loadSlotAccessorOf(grammar)
	};
}

describe('a read on the arena wire says what the object wire says', () => {
	for (const grammar of stableGrammars()) {
		it(`${grammar}: public accessors are independent of runtime layout tables`, async () => {
			const { object, arena, accessorOf } = await engines(grammar);
			const { records } = await import(`../../${grammar}/src/records.ts`);
			const descriptors = Object.getOwnPropertyDescriptors(records);
			try {
				for (const key of Object.keys(descriptors)) {
					Object.defineProperty(records, key, {
						configurable: true,
						get() {
							throw new Error(`runtime record layout lookup: ${key}`);
						}
					});
				}
				for (const entry of loadCorpusEntries(grammar)) {
					expect(surfaceOf(arena.parse(entry.source), accessorOf), entry.name).toEqual(
						surfaceOf(object.parse(entry.source), accessorOf)
					);
				}
			} finally {
				Object.defineProperties(records, descriptors);
				object.dispose();
				arena.dispose();
			}
		}, 600_000);

		it(`${grammar}: every corpus node's kinds, texts, coordinates and slots`, async () => {
			const { object, arena, accessorOf } = await engines(grammar);
			let compared = 0;
			for (const entry of loadCorpusEntries(grammar)) {
				expect(surfaceOf(arena.parse(entry.source), accessorOf), entry.name).toEqual(
					surfaceOf(object.parse(entry.source), accessorOf)
				);
				compared++;
			}
			expect(compared).toBeGreaterThan(0);
			object.dispose();
			arena.dispose();
		}, 600_000);

		it(`${grammar}: every corpus node a query finds, leaves included`, async () => {
			const { object, arena, accessorOf } = await engines(grammar);
			const found = (engine: typeof arena, source: string): { readonly nodes: readonly object[]; readonly surface: unknown } => {
				try {
					const nodes = queried(engine.parse(source));
					return { nodes, surface: nodes.map((node) => surfaceOf(node, accessorOf)) };
				} catch (error) {
					return { nodes: [], surface: { refused: (error as Error).message } };
				}
			};
			let leaves = 0;
			for (const entry of loadCorpusEntries(grammar)) {
				const inArena = found(arena, entry.source);
				leaves += inArena.nodes.filter((node) => recordOf(node) === undefined).length;
				expect(inArena.surface, entry.name).toEqual(found(object, entry.source).surface);
			}
			expect(leaves).toBeGreaterThan(0);
			object.dispose();
			arena.dispose();
		}, 600_000);
	}

	for (const [grammar, source, leaf] of [
		['python', 'x = "é"\r\ny = 1\r\n', 'y'],
		['rust', 'let s = "é";\r\nlet y = 1;\r\n', 'y'],
		['typescript', 'const s = "é";\r\nconst y = 1;\r\n', 'y']
	] as const) {
		it(`${grammar}: a leaf after a multi-byte character and a CRLF reads the same text`, async () => {
			const { object, arena, accessorOf } = await engines(grammar);
			const texts = (root: unknown) =>
				wrappedNodesOf(root, accessorOf)
					.map(nodeText)
					.filter((text) => text !== undefined);
			const read = texts(arena.parse(source));
			expect(read).toEqual(texts(object.parse(source)));
			expect(read).toContain(leaf);
			expect(read).toContain('é');
			object.dispose();
			arena.dispose();
		});
	}
});

describe('a node a query finds on the arena wire', () => {
	it('is read from its records with no tree read: a parsed leaf and a number literal with parts', async () => {
		const arena = await createEngine(rust, { nodeStorage: 'arena' });
		const work = await layoutWorkOf('rust');
		const root = arena.parse('fn f() { let x = 0x1Fu8; g(x) }\n', { depth: Infinity });
		const facet = facetOf(root);
		const before = work(root).treeReads;
		const found = [...facet.$descendants];
		expect(found.map(nodeText)).toContain('x');
		expect(found.map((node) => (node as { readonly $type?: unknown }).$type)).toContain(arena.kinds.IntegerLiteralHex);
		expect(work(root).treeReads).toBe(before);
		arena.dispose();
	});
});

describe('a query finds only the nodes a read takes', () => {
	const ESCAPES = [
		'atom escapes - control escapes',
		'Unicode escape',
		'\\u without hex codes treated as identity escape',
		'Unicode escaped characters as atoms in character classes',
		'Hexadecimal digits escape sequence'
	];
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: a regex escape's captures are part of its token, not nodes`, async () => {
			const rx = await createEngine(regex, { nodeStorage });
			const captures: readonly unknown[] = [rx.kinds.ControlEscapeText1, rx.kinds.ControlEscapeText2, rx.kinds.UnicodeCharacterEscapeText1, rx.kinds.UnicodeCharacterEscapeText2];
			const tokens: readonly unknown[] = [rx.kinds.ControlEscape, rx.kinds.UnicodeCharacterEscape];
			const entries = loadCorpusEntries('regex').filter((entry) => ESCAPES.includes(entry.name));
			expect(entries.map((entry) => entry.name).sort()).toEqual([...ESCAPES].sort());
			for (const entry of entries) {
				const kinds = queried(rx.parse(entry.source)).map((node) => (node as { readonly $type?: unknown }).$type);
				expect(kinds.filter((kind) => captures.includes(kind)), entry.name).toEqual([]);
				expect(kinds.some((kind) => tokens.includes(kind)), entry.name).toBe(true);
			}
			rx.dispose();
		});
	}
});

describe('an arena view held across a later read', () => {
	it('reads its own record after a read adds a chunk, as a second view of the record does', async () => {
		const { arena, accessorOf } = await engines('python');
		const source = Array.from({ length: 4000 }, (_, n) => `def f${n}(a, b):\n    return a + b * ${n}\n`).join('');
		const root = arena.parse(source, { depth: 1 }) as unknown as { statements(): readonly object[] };
		const format = treeOf(root)?.records?.format;
		if (format === undefined) throw new Error('an arena read names a tree read as records');
		const held = root.statements()[0]!;
		const before = surfaceOf(held, accessorOf);
		const chunks = wrappedNodesOf(root, accessorOf).flatMap((node) => {
			const at = recordOf(node);
			return at === undefined ? [] : [chunkOf(at, format)];
		});
		expect(Math.max(...chunks)).toBeGreaterThan(chunkOf(recordOf(held)!, format));
		expect(surfaceOf(held, accessorOf)).toEqual(before);
		expect(surfaceOf(root.statements()[0], accessorOf)).toEqual(before);
		arena.dispose();
	}, 120_000);
});
