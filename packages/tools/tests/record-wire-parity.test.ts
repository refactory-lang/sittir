import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { chunkOf } from '@sittir/common/engine';
import { coordinateOf, decodeIndex, isCoordinate, nodeText, treeOf } from '@sittir/common/utils';
import { stableGrammars } from '@sittir/codegen/grammars';
import type { NodeCoordinate } from '@sittir/types';
import { languageByName } from '../src/languages.ts';
import {
	loadCorpusEntries,
	loadSlotReaders,
	slotValuesOf,
	wrappedNodesOf,
	type SlotReaders,
	type TypedNode
} from '../src/validate/common.ts';

const RECORD = Symbol.for('sittir.record');

const placeOf = (at: NodeCoordinate | undefined) =>
	at && { row: decodeIndex(at.$treeHandle), end: at.$end, span: at.$span, kind: at.$type };

/** What the public surface says of a read value: each node's kind, text and coordinate, and its slots as the slot readers read them. */
function surfaceOf(value: unknown, readers: SlotReaders): unknown {
	if (Array.isArray(value)) return value.map((item) => surfaceOf(item, readers));
	if (value === null || typeof value !== 'object') return value;
	if (isCoordinate(value)) return { coordinate: placeOf(value) };
	const node = value as TypedNode;
	return {
		kind: node.$type,
		text: nodeText(node),
		at: placeOf(coordinateOf(node)),
		slots: slotValuesOf(node, readers).map(([key, slot]) => [key, surfaceOf(slot, readers)])
	};
}

async function engines(grammar: string) {
	const language = await languageByName(grammar);
	return {
		object: await createEngine(language, { nodeStorage: 'object' }),
		arena: await createEngine(language, { nodeStorage: 'arena' }),
		readers: await loadSlotReaders(grammar)
	};
}

describe('a read on the arena wire says what the object wire says', () => {
	for (const grammar of stableGrammars()) {
		it(`${grammar}: public accessors are independent of runtime layout tables`, async () => {
			const { object, arena, readers } = await engines(grammar);
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
					expect(surfaceOf(arena.parse(entry.source), readers), entry.name).toEqual(
						surfaceOf(object.parse(entry.source), readers)
					);
				}
			} finally {
				Object.defineProperties(records, descriptors);
				object.dispose();
				arena.dispose();
			}
		}, 600_000);

		it(`${grammar}: every corpus node's kinds, texts, coordinates and slots`, async () => {
			const { object, arena, readers } = await engines(grammar);
			let compared = 0;
			for (const entry of loadCorpusEntries(grammar)) {
				expect(surfaceOf(arena.parse(entry.source), readers), entry.name).toEqual(
					surfaceOf(object.parse(entry.source), readers)
				);
				compared++;
			}
			expect(compared).toBeGreaterThan(0);
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
			const { object, arena, readers } = await engines(grammar);
			const texts = (root: unknown) =>
				wrappedNodesOf(root, readers)
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

describe('an arena view held across a later read', () => {
	it('reads its own record after a read adds a chunk, as a second view of the record does', async () => {
		const { arena, readers } = await engines('python');
		const source = Array.from({ length: 4000 }, (_, n) => `def f${n}(a, b):\n    return a + b * ${n}\n`).join('');
		const root = arena.parse(source, { depth: 1 }) as unknown as { statements(): readonly object[] };
		const format = treeOf(root)?.records?.format;
		if (format === undefined) throw new Error('an arena read names a tree read as records');
		const held = root.statements()[0]!;
		const before = surfaceOf(held, readers);
		const chunks = wrappedNodesOf(root, readers).flatMap((node) => {
			const at = (node as { readonly [RECORD]?: number })[RECORD];
			return at === undefined ? [] : [chunkOf(at, format)];
		});
		expect(Math.max(...chunks)).toBeGreaterThan(chunkOf((held as { readonly [RECORD]: number })[RECORD], format));
		expect(surfaceOf(held, readers)).toEqual(before);
		expect(surfaceOf(root.statements()[0], readers)).toEqual(before);
		arena.dispose();
	}, 120_000);
});
