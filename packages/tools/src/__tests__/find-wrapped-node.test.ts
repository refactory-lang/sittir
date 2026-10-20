import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';

import { languageByName } from '../languages.ts';
import { findWrappedNode, loadCorpusEntries, loadKindNameFromId, loadSlotReaders, wrappedNodesOfKind } from '../validate/common.ts';

async function finder(grammar: string, nodeStorage: 'object' | 'arena') {
	const engine = await createEngine(await languageByName(grammar), { nodeStorage });
	const readers = await loadSlotReaders(grammar);
	const kindNameFromId = (await loadKindNameFromId(grammar))!;
	return { engine, readers, kindNameFromId };
}

describe('finding a read node by its kind', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`rust (${nodeStorage}): reaches nested nodes through the slot readers`, async () => {
			const { engine, readers, kindNameFromId } = await finder('rust', nodeStorage);
			const entry = loadCorpusEntries('rust').find((candidate) => candidate.name === 'Async function');
			if (!entry) throw new Error('expected the rust corpus entry "Async function"');
			const root = engine.parse(entry.source);
			for (const kind of ['function_item', 'block', 'parameters'] as const) {
				const found = findWrappedNode(root, readers, kind, kindNameFromId);
				expect(found && kindNameFromId(found.$type)).toBe(kind);
			}
			engine.dispose();
		});

		it(`python (${nodeStorage}): finds a node at its source span`, async () => {
			const { engine, readers, kindNameFromId } = await finder('python', nodeStorage);
			const root = engine.parse('f(1)\nf(2)\n');
			const calls = wrappedNodesOfKind(root, readers, 'call', kindNameFromId);
			expect(calls.map((candidate) => candidate.span)).toEqual([
				{ start: 0, end: 4 },
				{ start: 5, end: 9 }
			]);
			expect(findWrappedNode(root, readers, 'call', kindNameFromId, { start: 5, end: 9 })).toBe(calls[1]!.node);
			engine.dispose();
		});

		it(`rust (${nodeStorage}): finds a comment among a node's trivia`, async () => {
			const { engine, readers, kindNameFromId } = await finder('rust', nodeStorage);
			const root = engine.parse('// a\nfn f() {}\n');
			const comments = wrappedNodesOfKind(root, readers, 'line_comment', kindNameFromId);
			expect(comments.map((candidate) => candidate.span)).toEqual([{ start: 0, end: 4 }]);
			engine.dispose();
		});

		it(`python (${nodeStorage}): the root is found as itself`, async () => {
			const { engine, readers, kindNameFromId } = await finder('python', nodeStorage);
			const root = engine.parse('x = 1\n');
			expect(findWrappedNode(root, readers, 'module', kindNameFromId)).toBe(root);
			engine.dispose();
		});
	}
});
