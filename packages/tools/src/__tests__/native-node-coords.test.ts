import { describe, expect, it } from 'vitest';

import {
	adaptNode,
	buildReadHandle,
	findFirst,
	findNativeNodeId,
	loadCorpusEntries,
	loadKindNameFromId,
	loadLanguageForGrammar,
	readNodeAt
} from '../validate/common.ts';

describe('native node coords', () => {
	it('finds nested rust nodes from the native parseAndRead snapshot', async () => {
		const grammar = 'rust';
		const entries = loadCorpusEntries(grammar);
		const entry =
			entries.find((candidate) => candidate.name === 'Async function') ??
			entries.find((candidate) => candidate.source.includes('fn '));
		if (!entry) throw new Error('expected a rust corpus entry containing a function');

		const { Parser, lang } = await loadLanguageForGrammar(grammar);
		const parser = new Parser();
		parser.setLanguage(lang);
		const tree = parser.parse(entry.source);
		if (!tree) throw new Error('expected parser to return a tree');
		const handle = buildReadHandle(grammar, tree, entry.source, 'native');
		const kindNameFromId = await loadKindNameFromId(grammar);
		if (!kindNameFromId) throw new Error('expected rust kindNameFromId resolver');

		for (const kind of ['function_item', 'block', 'identifier'] as const) {
			const coords = findNativeNodeId(handle, kind, kindNameFromId);
			expect(coords).not.toBeNull();

			const treeNode = findFirst(tree.rootNode, kind);
			expect(treeNode).not.toBeNull();
			if (!coords || !treeNode) continue;

			const data = readNodeAt(handle, adaptNode(treeNode), coords);
			const dataKind = typeof data.$type === 'number' ? kindNameFromId(data.$type) : data.$type;
			expect(dataKind).toBe(kind);
		}
	}, 30000);

	it('drills into shallow native python children to reach nested nodes', async () => {
		const grammar = 'python';
		const source = 'x = 1';
		const { Parser, lang } = await loadLanguageForGrammar(grammar);
		const parser = new Parser();
		parser.setLanguage(lang);
		const tree = parser.parse(source);
		if (!tree) throw new Error('expected parser to return a tree');
		const handle = buildReadHandle(grammar, tree, source, 'native');
		const kindNameFromId = await loadKindNameFromId(grammar);
		if (!kindNameFromId) throw new Error('expected python kindNameFromId resolver');

		for (const kind of ['expression_statement', 'assignment', 'identifier'] as const) {
			const coords = findNativeNodeId(handle, kind, kindNameFromId);
			expect(coords).not.toBeNull();

			const treeNode = findFirst(tree.rootNode, kind);
			expect(treeNode).not.toBeNull();
			if (!coords || !treeNode) continue;

			const data = readNodeAt(handle, adaptNode(treeNode), coords);
			const dataKind = typeof data.$type === 'number' ? kindNameFromId(data.$type) : data.$type;
			expect(dataKind).toBe(kind);
		}
	}, 30000);

	it('resolves root native coords without forcing a child drill-in', async () => {
		const grammar = 'python';
		const source = 'x = 1';
		const { Parser, lang } = await loadLanguageForGrammar(grammar);
		const parser = new Parser();
		parser.setLanguage(lang);
		const tree = parser.parse(source);
		if (!tree) throw new Error('expected parser to return a tree');
		const handle = buildReadHandle(grammar, tree, source, 'native');
		const kindNameFromId = await loadKindNameFromId(grammar);
		if (!kindNameFromId) throw new Error('expected python kindNameFromId resolver');

		const coords = findNativeNodeId(handle, 'module', kindNameFromId);
		expect(coords).not.toBeNull();
		expect(coords).toEqual({});

		const treeNode = findFirst(tree.rootNode, 'module');
		expect(treeNode).not.toBeNull();
		if (!coords || !treeNode) return;

		const data = readNodeAt(handle, adaptNode(treeNode), coords);
		const dataKind = typeof data.$type === 'number' ? kindNameFromId(data.$type) : data.$type;
		expect(dataKind).toBe('module');
	}, 30000);
});
