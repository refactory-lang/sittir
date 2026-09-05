/**
 * Deep read-render-parse floor test.
 *
 * The committed `packages/tools/baselines/native.json` (diffed by CI's
 * baseline regression check and refreshable via `sittir tool check-baseline
 * --collect --backend native`) is the single floor authority for the
 * shallow-read validators: from(), template coverage, shallow
 * read-render-parse, factory-render-parse, and parity fixtures. This file
 * deliberately asserts NONE of those — a second hardcoded copy of the same
 * floors drifts (this suite sat failing for weeks with numbers above AND
 * below measured reality).
 *
 * What the baseline does NOT capture is the DEEP (recursive-read) run:
 * collect-baseline's roundtrip validator is shallow-only. The deep floors
 * below are therefore the one set of counts still pinned here. Ratchet
 * discipline applies: when a fix raises a number, raise the floor in the
 * same commit; floors only ever move up.
 *
 * Source of truth for the pinned numbers: the deep `read-render-parse`
 * column of `packages/tools/validation-history.jsonl` (appended by every
 * `pnpm run validate:native`).
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { generate } from '../../../codegen/src/compiler/generate.ts';
import { validateReadProjection } from '../validate/read-projection.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';

/** Deep (recursive-read) floors per grammar. See header for why ONLY these live here. */
const FLOORS = {
	python: {
		rtTotal: 115,
		rtDeepPass: 105,
		rtDeepAstMatchPass: 100
	},
	rust: {
		rtTotal: 136,
		rtDeepPass: 131,
		rtDeepAstMatchPass: 128
	},
	typescript: {
		rtTotal: 111,
		rtDeepPass: 105,
		rtDeepAstMatchPass: 105
	}
} as const;

type GrammarName = keyof typeof FLOORS;

describe.each(Object.keys(FLOORS) as GrammarName[])('deep read-render-parse floor — %s', (grammar) => {
	const floors = FLOORS[grammar];

	it(`deep read-render-parse (recursive read → render → reparse) passes at least ${floors.rtDeepPass}/${floors.rtTotal}, AST match at least ${floors.rtDeepAstMatchPass}`, async () => {
		// Full recursive read — deep-reads ALL named kinds, not just
		// variant-adopted — then native render + reparse. `astMatchPass`
		// floors the strict-structural subset; its gap up to `pass` is
		// the deep fidelity debt.
		const result = await validateReadRenderParse(grammar, { backend: 'native', recursive: true });

		expect(result.total).toBeGreaterThanOrEqual(floors.rtTotal);
		expect(result.pass).toBeGreaterThanOrEqual(floors.rtDeepPass);
		expect(result.astMatchPass).toBeGreaterThanOrEqual(floors.rtDeepAstMatchPass);
	}, 120000);
});

// Kinds with known readNode discrepancies when the override-compiled
// parser is active. These kinds have fields in the override parser
// that the generated routing map doesn't know about yet. Will be
// removed when T023 switches node-types.json to the override version.
const OVERRIDE_PARSER_KNOWN_ISSUES: Record<string, Set<string>> = {
	python: new Set([
		'complex_pattern',
		'pattern_list',
		'expression_list',
		'concatenated_string',
		'splat_type',
		// Phase D (KindID migration): codegen-synthesized variant/form/alias
		// kinds that exist in nodeMap but not in parser.c's symbol table.
		// These get $type=0 under numeric dispatch.
		'as_pattern_target',
		'assignment_eq',
		'assignment_type',
		'assignment_typed',
		'expression_statement_tuple',
		'format_expression',
		'match_block_block',
		'simple_pattern_negative',
		'statement_group1',
		'with_clause_bare',
		'with_clause_paren'
	]),
	rust: new Set([
		'pattern_list',
		'expression_list',
		'tuple_struct_pattern',
		// Phase D: codegen-synthesized kinds without parser.c symbols
		'array_expression_list',
		'array_expression_semi',
		'closure_expression_block',
		'closure_expression_expr',
		'delim_token_tree_brace',
		'delim_token_tree_bracket',
		'delim_token_tree_paren',
		'expression_statement_block_ending',
		'expression_statement_with_semi',
		'field_identifier',
		'field_pattern_named',
		'field_pattern_shorthand',
		'function_type_fn_form',
		'function_type_trait_form',
		'impl_item_body',
		'impl_item_semi',
		'let_chain',
		'line_comment_content',
		'macro_definition_brace',
		'macro_definition_bracket',
		'match_arm_block_ending',
		'match_arm_with_comma',
		'mod_item_external',
		'mod_item_inline',
		'or_pattern_binary',
		'or_pattern_prefix',
		'pointer_type_const',
		'pointer_type_mut',
		'primitive_type',
		'range_expression_bare',
		'range_expression_binary',
		'range_expression_postfix',
		'range_expression_prefix',
		'range_pattern_left_bare',
		'range_pattern_left_with_right',
		'range_pattern_prefix',
		'reference_expression_raw_const',
		'reference_expression_raw_mut',
		'shorthand_field_identifier',
		'struct_item_brace',
		'struct_item_tuple',
		'struct_item_unit',
		'token_tree_brace',
		'token_tree_paren',
		'token_tree_pattern_bracket',
		'token_tree_pattern_paren',
		'type_identifier',
		'visibility_modifier_crate',
		'visibility_modifier_in_path',
		'visibility_modifier_pub',
		'wildcard_pattern'
	]),
	typescript: new Set([
		'import_attribute',
		// Phase D: codegen-synthesized kinds without parser.c symbols
		'arrow_function__call_signature',
		'arrow_function_parameter',
		'call_expression_call',
		'call_expression_member',
		'class_body_member',
		'class_body_method',
		'class_body_method_sig',
		'class_heritage_extends_clause',
		'export_statement_default',
		'export_statement_default_decl_arm',
		'export_statement_default_decl_arm_default_kw',
		'export_statement_equals_export',
		'export_statement_type_export',
		'for_header_lhs',
		'import_clause_default_import',
		'import_clause_named_imports',
		'import_specifier_as',
		'import_specifier_name',
		'index_signature_colon',
		'index_signature_mapped_type_clause',
		'interface_body',
		'parenthesized_expression_typed',
		'property_identifier',
		'public_field_definition_access_first',
		'public_field_definition_readonly_first',
		'public_field_definition_static_mods',
		'shorthand_property_identifier',
		'shorthand_property_identifier_pattern',
		'string_double',
		'string_fragment',
		'string_single',
		'type_identifier',
		'update_expression_postfix'
	])
};

describe('read projection — structural', () => {
	it.each(['python', 'rust', 'typescript'] as const)(
		'%s: every kind in the corpus passes the structural check',
		async (grammar) => {
			const result = await validateReadProjection(grammar);
			const known = OVERRIDE_PARSER_KNOWN_ISSUES[grammar] ?? new Set();
			const unexpected = result.issues.filter((i) => !known.has(i.kind));
			if (unexpected.length > 0) {
				const lines = unexpected
					.slice(0, 10)
					.map((i) => `  - ${i.kind} [${i.instance}]: ${i.message}`)
					.join('\n');
				throw new Error(`readNode lost content on ${unexpected.length} kind(s) in ${grammar}:\n${lines}`);
			}
			expect(result.pass + known.size).toBeGreaterThanOrEqual(result.total);
			expect(result.total).toBeGreaterThan(0);
		},
		60000
	);
});

describe('corpus validation — generator produces usable output', () => {
	it.each(Object.keys(FLOORS) as GrammarName[])(
		'%s generate emits all files + sane NodeMap',
		async (grammar) => {
			const result = await generate({
				grammar,
				outputDir: `/tmp/sittir-floor-${grammar}/src`
			});
			expect(result.factories).toContain('_factoryMap');
			expect(result.from).toContain('_fromMap');
			expect(result.nodeMap.nodes.size).toBeGreaterThan(0);
		},
		30000
	);
});
