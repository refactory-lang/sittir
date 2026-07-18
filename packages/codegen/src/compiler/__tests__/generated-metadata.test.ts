import { describe, it, expect } from 'vitest';
import {
	collectGeneratedKindEntries,
	deriveGeneratedIdTablesFromLanguage,
	deriveGeneratedIdTablesFromParserCSource,
	type TreeSitterLanguageMetadata
} from '../generated-metadata.ts';

describe('generated metadata', () => {
	it('derives generated kind and field IDs from the tree-sitter language API', () => {
		const language = {
			nodeTypeCount: 5,
			fieldCount: 2,
			nodeTypeForId: (id: number) => ['end', 'identifier', ';', 'hidden', 'identifier'][id] ?? null,
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

	it.skip('derives generated IDs and C names from generated parser.c', async () => {
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

	it('preserves an alias symbol\'s display name when it collides with its hidden-source counterpart', async () => {
		// Regression test: `sym__newline` (the hidden source rule) and
		// `alias_sym_newline` (its visible alias, e.g. python's `_suite`
		// role-aliasing) both fallback-derive to the same catalog key
		// `_newline` (`deriveSymbolRuntimeName` maps `alias_sym_X` back to
		// `_X`). Before the fix, `joinIdNames` silently dropped whichever
		// of the two lost `shouldReplaceSymbol` — losing the alias's
		// display name (`"newline"`) entirely, so `kindIdFromName('newline')`
		// would throw at runtime even though the kind IS cataloged under
		// its hidden name `_newline`.
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  sym__newline = 101,
  alias_sym_newline = 291,
};

static const char * const ts_symbol_names[] = {
  [sym__newline] = "_newline",
  [alias_sym_newline] = "newline",
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

		const entries = collectGeneratedKindEntries(tables);
		const newlineEntry = entries.find((entry) => entry.kind === '_newline');

		expect(newlineEntry).toBeDefined();
		expect(newlineEntry?.id).toBe(101);
		// The alias's display name ("newline") survives on the surviving
		// `_newline` row instead of being dropped — this is what lets
		// `kindIdFromName('newline')` resolve at runtime.
		expect(newlineEntry?.symbolName).toBe('newline');

		// No separate `alias_sym_newline`-derived entry — it was merged
		// into `_newline`, not kept as its own catalog row.
		expect(entries.find((entry) => entry.kind === 'newline')).toBeUndefined();
	});
});
