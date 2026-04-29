import { describe, it, expect } from 'vitest';
import { field, seq } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import {
	deriveGeneratedIdTablesFromLanguage,
	deriveGeneratedMetadata,
	type TreeSitterLanguageMetadata
} from '../compiler/generated-metadata.ts';

describe('generated metadata', () => {
	it('attaches generated kind and field IDs as late metadata', () => {
		const { ruleCatalog } = buildRuleCatalog({
			source_file: seq(field('item', { type: 'symbol', name: 'identifier' })),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' }
		});

		const metadata = deriveGeneratedMetadata(ruleCatalog, {
			kindIds: { source_file: 1, identifier: 2, missing: 99 },
			fieldIds: { item: 7, missing: 99 },
			sourceArtifact: 'parser.c'
		});

		expect(metadata.kindByName.get('source_file')).toEqual({
			kindId: 1,
			sourceArtifact: 'parser.c'
		});
		expect(metadata.kindByName.has('missing')).toBe(false);
		expect(metadata.fieldByName.get('item')).toEqual({
			fieldId: 7,
			sourceArtifact: 'parser.c'
		});
	});

	it('does not use generated metadata as foundational rule identity', () => {
		const { ruleCatalog } = buildRuleCatalog({
			source_file: seq(field('item', { type: 'symbol', name: 'identifier' }))
		});
		const beforeIds = [...ruleCatalog.byId.keys()];

		deriveGeneratedMetadata(ruleCatalog, {
			kindIds: { source_file: 42 },
			fieldIds: { item: 3 },
			sourceArtifact: 'parser.c'
		});

		expect([...ruleCatalog.byId.keys()]).toEqual(beforeIds);
		expect([...ruleCatalog.classificationById.keys()]).toEqual(beforeIds);
	});

	it('derives generated kind and field IDs from the tree-sitter language API', () => {
		const language = {
			nodeTypeCount: 5,
			fieldCount: 2,
			nodeTypeForId: (id: number) =>
				['end', 'identifier', ';', 'hidden', 'identifier'][id] ?? null,
			nodeTypeIsVisible: (id: number) => id === 1 || id === 2 || id === 4,
			nodeTypeIsNamed: (id: number) => id === 1 || id === 4,
			fieldNameForId: (id: number) => [null, 'item', 'name'][id] ?? null
		} satisfies TreeSitterLanguageMetadata;

		const tables = deriveGeneratedIdTablesFromLanguage(language, 'parser.wasm');

		expect(tables.sourceArtifact).toBe('parser.wasm');
		expect(tables.kindIds).toEqual(
			new Map([
				['identifier', 1],
				[';', 2]
			])
		);
		expect(tables.fieldIds).toEqual(
			new Map([
				['item', 1],
				['name', 2]
			])
		);
	});
});
