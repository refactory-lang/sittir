import { describe, expect, it } from 'vitest';
import { findSpanNode, loadLanguageForGrammar, loadStorageKindNameFromId, treeParser } from '../../src/validate/common.ts';
import { validateReadRenderParse } from '../../src/validate/read-render-parse.ts';

describe('findSpanNode', () => {
	it('picks a folded display node by its storage kind, not the parent that spans the same text', async () => {
		using parser = treeParser(await loadLanguageForGrammar('rust'));
		const source = 'unsafe impl Trait for dyn (::std::any::Any) + Send { }\n';
		using tree = parser.parse(source);
		const start = source.indexOf('::std');
		const end = source.indexOf(')');
		const storageKindOf = await loadStorageKindNameFromId('rust');
		const found = findSpanNode(tree.root, start, end, 'scoped_type_identifier', storageKindOf);
		expect(found?.type).toBe('qualified_identifier');
		expect(storageKindOf(found!.grammarId)).toBe('scoped_type_identifier');
		expect(findSpanNode(tree.root, start, end, 'scoped_type_identifier')?.type).not.toBe('qualified_identifier');
	}, 120_000);

	it('lets read-render-parse host a statement list that spans the same text as the merged block holding it', async () => {
		const result = await validateReadRenderParse('python', { backend: 'native' });
		expect(result.excluded.filter((excluded) => excluded.kind === '_simple_statements')).toEqual([]);
	}, 300_000);
});
