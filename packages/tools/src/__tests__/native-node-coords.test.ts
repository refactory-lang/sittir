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

		// NOTE: 'identifier' was dropped from this list — under the
		// VerbatimTransport design, text-only kinds degrade to bare strings
		// in the native NodeData snapshot (function_item reads as
		// `_name: "abc"`, not a nested identifier NodeData), so there is no
		// identifier node to find. 'parameters' replaces it as a nested
		// compound that survives transport.
		for (const kind of ['function_item', 'block', 'parameters'] as const) {
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
		// NOTE: source was 'x = 1' with a drill target of 'identifier'.
		// Under the VerbatimTransport design, text-only kinds degrade to
		// bare strings in the native snapshot (assignment reads as
		// `_left: "x"`, not a nested identifier NodeData), so 'identifier'
		// is unfindable by design. Use a call expression instead — 'call'
		// (depth 3) and 'argument_list' (depth 4) survive transport and
		// exercise a deeper drill than the original.
		const source = 'x = f(1)';
		const { Parser, lang } = await loadLanguageForGrammar(grammar);
		const parser = new Parser();
		parser.setLanguage(lang);
		const tree = parser.parse(source);
		if (!tree) throw new Error('expected parser to return a tree');
		const handle = buildReadHandle(grammar, tree, source, 'native');
		const kindNameFromId = await loadKindNameFromId(grammar);
		if (!kindNameFromId) throw new Error('expected python kindNameFromId resolver');

		for (const kind of ['expression_statement', 'assignment', 'call', 'argument_list'] as const) {
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
