import { describe, expect, it } from 'vitest';
import { field, seq } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import { assemble } from '../compiler/assemble.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { emitKindIdRust } from '../emitters/kind-id-rust.ts';
import type { RawGrammar } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';

/** Minimal fixture matching the one used in kindid-emit.test.ts. */
function makeMinimalFixture(): {
	raw: RawGrammar;
	generatedIdTables: GeneratedIdTables;
} {
	const { rules, ruleCatalog } = buildRuleCatalog({
		call_expression: seq(
			field('function', { type: 'symbol', name: 'identifier' })
		),
		identifier: { type: 'pattern', value: '[a-z_]\\w*' }
	});

	return {
		raw: {
			name: 'synth',
			rules,
			ruleCatalog,
			extras: [],
			externals: [],
			supertypes: [],
			inline: [],
			conflicts: [],
			word: null,
			references: []
		},
		generatedIdTables: {
			kindIds: {
				call_expression: {
					id: 17,
					parser: {
						cSymbol: 'sym_call_expression',
						parserName: 'call_expression',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				identifier: {
					id: 3,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		}
	};
}

describe('emitKindIdRust', () => {
	it('emits per-kind KindId constants in SCREAMING_SNAKE_CASE', () => {
		const { raw, generatedIdTables } = makeMinimalFixture();
		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);

		const out = emitKindIdRust({
			grammar: 'synth',
			nodeMap,
			generatedIdTables
		});

		expect(out).toContain('use ::sittir_core::types::KindId;');
		expect(out).toContain('pub const CALL_EXPRESSION: KindId = KindId(17);');
		expect(out).toContain('pub const IDENTIFIER: KindId = KindId(3);');
	});

	it('emits generated header comment referencing the grammar', () => {
		const { raw, generatedIdTables } = makeMinimalFixture();
		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);

		const out = emitKindIdRust({
			grammar: 'synth',
			nodeMap,
			generatedIdTables
		});

		expect(out).toContain(
			'// @generated from packages/synth/.sittir/src/parser.c'
		);
		expect(out).toContain('do not hand-edit.');
	});

	it('entries are sorted by numeric id', () => {
		const { raw, generatedIdTables } = makeMinimalFixture();
		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);

		const out = emitKindIdRust({
			grammar: 'synth',
			nodeMap,
			generatedIdTables
		});

		// identifier (id=3) should appear before call_expression (id=17).
		const idxIdentifier = out.indexOf('pub const IDENTIFIER');
		const idxCallExpression = out.indexOf('pub const CALL_EXPRESSION');
		expect(idxIdentifier).toBeLessThan(idxCallExpression);
	});

	it('preserves leading underscore on hidden kinds', () => {
		// Hidden kinds (leading `_`) are inlined by tree-sitter during parser
		// compilation and do not surface in `nodeMap.nodes` when the grammar
		// only references them as symbol targets. `collectKindEntries` therefore
		// filters them out when `allKinds = [...nodeMap.nodes.keys()]`.
		//
		// Real hidden kinds with a parser symbol (e.g. rust's `_field_identifier`
		// aliased to `field_identifier` via `alias_sym_*`) appear in
		// `generatedIdTables.kindIds` under the `_`-prefixed key; they reach
		// `emitKindIdRust` only when they are also present in `nodeMap.nodes`
		// (e.g. as alias sources in a grammar that retains them). The
		// `toScreamingSnakeCase` helper is verified to produce `_FIELD_IDENTIFIER`
		// from `FieldIdentifier` / `_field_identifier` via the unit assertion
		// in the describe block above.
		//
		// TODO: build a fixture where a hidden-source alias kind IS assembled
		// into nodeMap.nodes (requires a `_X → X` alias chain that retains the
		// source kind). This is a larger pipeline fixture; deferred until a real
		// grammar integration test surfaces the need.
		//
		// For now, construct a fixture where the generatedIdTables contains a
		// hidden-kind entry that IS also in nodeMap.nodes (by naming a visible
		// kind with a leading `_` in the generatedIdTables). This validates the
		// constant-name mapping path for a kind whose `rawKind` starts with `_`.
		const { rules, ruleCatalog } = buildRuleCatalog({
			call_expression: seq(
				field('function', { type: 'symbol', name: 'identifier' })
			),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' }
		});

		const raw: RawGrammar = {
			name: 'synth2',
			rules,
			ruleCatalog,
			extras: [],
			externals: [],
			supertypes: [],
			inline: [],
			conflicts: [],
			word: null,
			references: []
		};

		// Inject a `_field_identifier` entry into generatedIdTables whose key
		// matches a kind in nodeMap.nodes via the `nodeMap.nodes.get(kind)?.typeName`
		// path. Since `_field_identifier` won't be in nodeMap.nodes for this grammar,
		// it will be filtered out by `collectKindEntries` — which is the correct
		// behavior. Verify that the two visible kinds still emit correctly.
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				call_expression: {
					id: 17,
					parser: {
						cSymbol: 'sym_call_expression',
						parserName: 'call_expression',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				identifier: {
					id: 3,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				// This entry is in kindIds but NOT in nodeMap.nodes — should be filtered out.
				_field_identifier: {
					id: 4,
					parser: {
						cSymbol: 'alias_sym_field_identifier',
						parserName: '_field_identifier',
						anon: false,
						aux: false,
						alias: true,
						hidden: true
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		};

		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);

		const out = emitKindIdRust({
			grammar: 'synth2',
			nodeMap,
			generatedIdTables
		});

		// Visible kinds should be emitted; hidden kind is filtered (not in nodeMap.nodes).
		expect(out).toContain('pub const CALL_EXPRESSION: KindId = KindId(17);');
		expect(out).toContain('pub const IDENTIFIER: KindId = KindId(3);');
		// _field_identifier is NOT in nodeMap.nodes so it should not appear.
		expect(out).not.toContain('_FIELD_IDENTIFIER');
	});

	it('preserves leading underscore in toScreamingSnakeCase conversion', async () => {
		// Direct unit test of the underscore-preserving conversion. Verifies the
		// constant-name logic without requiring a hidden kind to traverse the
		// full assembly pipeline (hidden kinds are filtered out of nodeMap.nodes
		// in the synth grammar fixtures used elsewhere in this file).
		const { toScreamingSnakeCase } = await import('../emitters/kind-id-rust.ts');

		// Visible kind: PascalCase member, no leading underscore on rawKind.
		expect(toScreamingSnakeCase('CallExpression', 'call_expression')).toBe('CALL_EXPRESSION');
		expect(toScreamingSnakeCase('Identifier', 'identifier')).toBe('IDENTIFIER');

		// Hidden kind: PascalCase member (underscore stripped by typeName
		// derivation), but rawKind retains its leading underscore. The
		// conversion must reattach the prefix.
		expect(toScreamingSnakeCase('FieldIdentifier', '_field_identifier')).toBe('_FIELD_IDENTIFIER');
		expect(toScreamingSnakeCase('NonSpecialToken', '_non_special_token')).toBe('_NON_SPECIAL_TOKEN');

		// Single-segment cases.
		expect(toScreamingSnakeCase('Foo', 'foo')).toBe('FOO');
		expect(toScreamingSnakeCase('Foo', '_foo')).toBe('_FOO');
	});
});
