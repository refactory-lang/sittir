import { describe, it, expect } from 'vitest';
import {
	collectGeneratedKindEntries,
	deriveGeneratedIdTablesFromLanguage,
	deriveGeneratedIdTablesFromParserCSource,
	findEntryForLiteralText,
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

	it("preserves an alias symbol's display name when it collides with its hidden-source counterpart", async () => {
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
		// `_newline` row as the parse name beside the parse id, instead of
		// being dropped — this is what lets `kindIdFromName('newline')`
		// resolve at runtime.
		expect(newlineEntry?.parseName).toBe('newline');
		expect(newlineEntry?.parseId).toBe(291);

		// No separate `alias_sym_newline`-derived entry — it was merged
		// into `_newline`, not kept as its own catalog row.
		expect(entries.find((entry) => entry.kind === 'newline')).toBeUndefined();
	});

	it("names a keyword-shaped anonymous token by its own text, suffixed '_keyword'", async () => {
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  anon_sym_if = 10,
};

static const char * const ts_symbol_names[] = {
  [anon_sym_if] = "if",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c'
		);
		const entries = collectGeneratedKindEntries(tables);
		expect(entries.find((entry) => entry.id === 10)).toMatchObject({ kind: 'if_keyword', literalText: 'if', keyword: true });
	});

	it('marks a symbol listed in the non-terminal alias map as an aliased non-terminal', async () => {
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  sym__lhs_expression = 20,
  sym_object_type = 21,
  sym_pattern = 22,
  alias_sym_lhs_expression = 30,
  alias_sym_interface_body = 31,
};

static const char * const ts_symbol_names[] = {
  [sym__lhs_expression] = "_lhs_expression",
  [sym_object_type] = "object_type",
  [sym_pattern] = "pattern",
  [alias_sym_lhs_expression] = "lhs_expression",
  [alias_sym_interface_body] = "interface_body",
};

static const uint16_t ts_non_terminal_alias_map[] = {
  sym__lhs_expression, 2,
    sym__lhs_expression,
    alias_sym_lhs_expression,
  sym_object_type, 2,
    sym_object_type,
    alias_sym_interface_body,
  0,
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c'
		);
		const byId = new Map(collectGeneratedKindEntries(tables).map((entry) => [entry.id, entry]));
		expect(byId.get(20)?.aliasedNonTerminal).toBe(true);
		expect(byId.get(21)?.aliasedNonTerminal).toBe(true);
		expect(byId.get(22)?.aliasedNonTerminal).toBeUndefined();
		expect(byId.get(30)?.aliasedNonTerminal).toBeUndefined();
		expect(byId.get(31)?.aliasedNonTerminal).toBeUndefined();
	});

	it('marks a symbol whose id is below TOKEN_COUNT as a terminal', async () => {
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
#define TOKEN_COUNT 3

enum ts_symbol_identifiers {
  sym_identifier = 1,
  sym__block_comment_content = 2,
  sym__let_chain = 3,
  sym_let_condition = 4,
};

static const char * const ts_symbol_names[] = {
  [sym_identifier] = "identifier",
  [sym__block_comment_content] = "_block_comment_content",
  [sym__let_chain] = "_let_chain",
  [sym_let_condition] = "let_condition",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c'
		);
		const byId = new Map(collectGeneratedKindEntries(tables).map((entry) => [entry.id, entry]));
		expect(byId.get(1)?.terminal).toBe(true);
		expect(byId.get(2)?.terminal).toBe(true);
		expect(byId.get(3)?.terminal).toBeUndefined();
		expect(byId.get(4)?.terminal).toBeUndefined();
	});

	it('leaves a symbolic (non-keyword-shaped) anonymous token under its plain derived name', async () => {
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  anon_sym_COMMA = 11,
};

static const char * const ts_symbol_names[] = {
  [anon_sym_COMMA] = ",",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c'
		);
		const entries = collectGeneratedKindEntries(tables);
		expect(entries.find((entry) => entry.id === 11)?.kind).toBe('comma');
		expect(entries.find((entry) => entry.id === 11)?.keyword).toBeUndefined();
	});

	it("names the underscore token 'underscore', not a keyword — it has no non-underscore character", async () => {
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  anon_sym__ = 12,
  anon_sym___ = 13,
};

static const char * const ts_symbol_names[] = {
  [anon_sym__] = "_",
  [anon_sym___] = "__",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c'
		);
		const entries = collectGeneratedKindEntries(tables);
		expect(entries.find((entry) => entry.id === 12)?.kind).toBe('underscore');
		expect(entries.find((entry) => entry.id === 13)?.kind).toBe('underscore2');
	});

	it("a literal rule's display name naming a NAMED alias elsewhere is the parser-stated alias case; a display name with no named-alias claimant is the plain literal-rule case", async () => {
		const grammarJson = {
			rules: {
				_wildcard_pattern: { type: 'STRING', value: '_' },
				_kw_pass: { type: 'STRING', value: 'pass' },
				complex_pattern: {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: '_wildcard_pattern' },
					named: true,
					value: 'wildcard_pattern'
				}
			}
		};
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  sym__wildcard_pattern = 265,
  sym__kw_pass = 266,
  anon_sym__ = 12,
};

static const char * const ts_symbol_names[] = {
  [sym__wildcard_pattern] = "wildcard_pattern",
  [sym__kw_pass] = "_kw_pass",
  [anon_sym__] = "_",
};

static const TSSymbolMetadata ts_symbol_metadata[] = {
  [sym__wildcard_pattern] = {
    .visible = false,
    .named = true,
  },
  [sym__kw_pass] = {
    .visible = false,
    .named = true,
  },
  [anon_sym__] = {
    .visible = true,
    .named = false,
  },
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c',
			grammarJson
		);
		const entries = collectGeneratedKindEntries(tables);

		// 'wildcard_pattern' is a NAMED alias target elsewhere in the grammar:
		// the alias's own display name survives, not clobbered by the literal
		// text of the hidden rule it wraps.
		const wildcardEntry = entries.find((entry) => entry.kind === '_wildcard_pattern');
		expect(wildcardEntry?.id).toBe(265);
		expect(wildcardEntry?.symbolName).toBe('wildcard_pattern');
		expect(wildcardEntry?.literalRule).toBeUndefined();

		// '_kw_pass' names no alias anywhere: it is the plain literal-rule
		// case, and stamps its own text even though its display name
		// ('_kw_pass') differs from nothing (it equals the rule name here).
		const kwPassEntry = entries.find((entry) => entry.kind === '_kw_pass');
		expect(kwPassEntry?.id).toBe(266);
		expect(kwPassEntry?.literalText).toBe('pass');
		expect(kwPassEntry?.literalRule).toBe(true);

		// The plain underscore token keeps its own row and text, unaffected by
		// the alias sharing the same literal character.
		const underscoreEntry = entries.find((entry) => entry.kind === 'underscore');
		expect(underscoreEntry?.id).toBe(12);
		expect(underscoreEntry?.anon).toBe(true);
	});

	it('finds a string token by its text when every use aliases it to a named kind', async () => {
		const grammarJson = {
			rules: {
				atom: { type: 'ALIAS', content: { type: 'STRING', value: 'x' }, named: true, value: 'identity_escape' }
			}
		};
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
#define TOKEN_COUNT 6

enum ts_symbol_identifiers {
  anon_sym_x = 5,
};

static const char * const ts_symbol_names[] = {
  [anon_sym_x] = "identity_escape",
};

static const TSSymbolMetadata ts_symbol_metadata[] = {
  [anon_sym_x] = {
    .visible = true,
    .named = true,
  },
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c',
			grammarJson
		);
		const entries = collectGeneratedKindEntries(tables);
		const token = entries.find((entry) => entry.id === 5);
		expect(token?.anon).toBeUndefined();
		expect(token?.terminal).toBe(true);
		expect(findEntryForLiteralText(entries, 'x')).toBe(token);
	});

	it('stamps a literal rule whose display name differs from its rule name via an UNNAMED alias site elsewhere (no named-alias claimant)', async () => {
		const grammarJson = {
			rules: {
				_is_not: { type: 'SEQ', members: [{ type: 'STRING', value: 'is' }, { type: 'STRING', value: 'not' }] },
				comparator: {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: '_is_not' },
					named: false,
					value: 'is not'
				}
			}
		};
		const tables = await deriveGeneratedIdTablesFromParserCSource(
			`
enum ts_symbol_identifiers {
  sym__is_not = 195,
};

static const char * const ts_symbol_names[] = {
  [sym__is_not] = "is not",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`,
			'parser.c',
			grammarJson
		);
		const entries = collectGeneratedKindEntries(tables);
		const isNotEntry = entries.find((entry) => entry.kind === '_is_not');
		expect(isNotEntry?.id).toBe(195);
		expect(isNotEntry?.literalText).toBe('is not');
		expect(isNotEntry?.literalRule).toBe(true);
	});

	it('throws when two distinct anonymous symbols derive the same key', async () => {
		const source = `
enum ts_symbol_identifiers {
  anon_sym_False = 20,
  anon_sym_false = 21,
};

static const char * const ts_symbol_names[] = {
  [anon_sym_False] = "False",
  [anon_sym_false] = "false",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`;
		await expect(deriveGeneratedIdTablesFromParserCSource(source, 'parser.c')).rejects.toThrow(
			"generated-metadata: key 'false_keyword' names both 'anon_sym_False' and 'anon_sym_false'"
		);
	});

	it('throws when an anonymous token and a named rule derive the same key', async () => {
		const source = `
enum ts_symbol_identifiers {
  sym_true_keyword = 30,
  anon_sym_true = 31,
};

static const char * const ts_symbol_names[] = {
  [sym_true_keyword] = "true_keyword",
  [anon_sym_true] = "true",
};

static const TSSymbolMetadata ts_symbol_metadata[] = {
  [sym_true_keyword] = {
    .visible = true,
    .named = true,
  },
  [anon_sym_true] = {
    .visible = true,
    .named = false,
  },
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`;
		await expect(deriveGeneratedIdTablesFromParserCSource(source, 'parser.c')).rejects.toThrow(
			"generated-metadata: key 'true_keyword' names both anonymous token \"true\" (anon_sym_true) and kind 'true_keyword' (sym_true_keyword)"
		);
	});

	it('throws when an aliased anonymous token has no matching verbatim literal anywhere in the grammar', async () => {
		const grammarJson = {
			rules: {
				renamed_thing: {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: '_raw_thing' },
					named: true,
					value: 'renamed_thing'
				}
			}
		};
		const source = `
enum ts_symbol_identifiers {
  anon_sym_UNVERIFIED = 40,
};

static const char * const ts_symbol_names[] = {
  [anon_sym_UNVERIFIED] = "renamed_thing",
};

enum ts_field_identifiers {
};

static const char * const ts_field_names[] = {
  [0] = NULL,
};
`;
		await expect(deriveGeneratedIdTablesFromParserCSource(source, 'parser.c', grammarJson)).rejects.toThrow(
			'generated-metadata: aliased token anon_sym_UNVERIFIED (display "renamed_thing") has no verbatim literal'
		);
	});
});
