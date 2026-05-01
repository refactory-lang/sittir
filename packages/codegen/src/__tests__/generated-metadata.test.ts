import { describe, it, expect } from 'vitest';
import { field, seq } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import {
	deriveGeneratedIdTablesFromLanguage,
	deriveGeneratedIdTablesFromParserCSource,
	deriveGeneratedMetadata,
	type TreeSitterLanguageMetadata
} from '../compiler/generated-metadata.ts';
import { KindPresenceFlag } from '../compiler/types.ts';

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

		const sourceFileEntry = metadata.kindByName.get('source_file');
		expect(sourceFileEntry?.kindId).toBe(1);
		expect(sourceFileEntry?.sourceArtifact).toBe('parser.c');
		expect(sourceFileEntry?.presence).toBe(
			KindPresenceFlag.TSGrammar | KindPresenceFlag.TSInternals
		);
		expect(metadata.kindByName.has('missing')).toBe(false);

		const itemEntry = metadata.fieldByName.get('item');
		expect(itemEntry?.fieldId).toBe(7);
		expect(itemEntry?.sourceArtifact).toBe('parser.c');
	});

	it('emits TSGrammar-only catalog rows for kinds without parser symbols', () => {
		// `_inlined_helper` exists in the grammar but no parser symbol —
		// per the symbol catalog design (2026-04-30), it must still appear
		// in the catalog with `presence: TSGrammar` only.
		const { ruleCatalog } = buildRuleCatalog({
			source_file: seq({ type: 'symbol', name: '_inlined_helper' }),
			_inlined_helper: { type: 'string', value: 'x' }
		});
		const metadata = deriveGeneratedMetadata(ruleCatalog, {
			kindIds: { source_file: 1 },
			fieldIds: {},
			sourceArtifact: 'parser.c'
		});
		const inlined = metadata.kindByName.get('_inlined_helper');
		expect(inlined?.kindId).toBeUndefined();
		expect(inlined?.parser).toBeUndefined();
		expect(inlined?.presence).toBe(KindPresenceFlag.TSGrammar);
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

	it('derives generated IDs and C names from generated parser.c', async () => {
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  sym_identifier = 1,
  anon_sym_BANG_EQ_EQ = 2,
};

static const char * const ts_symbol_names[] = {
  [sym_identifier] = "identifier",
  [anon_sym_BANG_EQ_EQ] = "!==",
};

enum ts_field_identifiers {
  field_name = 1,
};

static const char * const ts_field_names[] = {
  [0] = NULL,
  [field_name] = "name",
};
`,
			'parser.c'
		);

		type CatalogRow = {
			readonly id: number;
			readonly parser: {
				readonly cSymbol: string;
				readonly parserName: string;
				readonly anon: boolean;
				readonly alias: boolean;
				readonly hidden: boolean;
				readonly symbolName?: string;
			};
		};
		const kindIds = tables.kindIds as ReadonlyMap<string, CatalogRow>;
		const fieldIdsMap = tables.fieldIds as ReadonlyMap<string, CatalogRow>;

		const identifier = kindIds.get('identifier');
		expect(identifier?.id).toBe(1);
		expect(identifier?.parser.cSymbol).toBe('sym_identifier');
		expect(identifier?.parser.parserName).toBe('identifier');
		expect(identifier?.parser.hidden).toBe(false);
		expect(identifier?.parser.anon).toBe(false);

		const bangEq = kindIds.get('BANG_EQ_EQ');
		expect(bangEq?.id).toBe(2);
		expect(bangEq?.parser.cSymbol).toBe('anon_sym_BANG_EQ_EQ');
		expect(bangEq?.parser.parserName).toBe('BANG_EQ_EQ');
		expect(bangEq?.parser.anon).toBe(true);
		// Display label survives as a diagnostic field; it never participates
		// in identity (the lossy `ts_symbol_names[]` table maps both
		// `sym__as_pattern` and `sym_as_pattern` to the same string, so it
		// can't be used as the join key).
		expect(bangEq?.parser.symbolName).toBe('!==');

		const nameField = fieldIdsMap.get('name');
		expect(nameField?.id).toBe(1);
		expect(nameField?.parser.cSymbol).toBe('field_name');
		expect(nameField?.parser.parserName).toBe('name');
	});
});
