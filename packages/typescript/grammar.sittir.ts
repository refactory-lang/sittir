/**
 * grammar.sittir.ts — Grammar extension for typescript
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js';
import { transform, enrich, field, alias, wire, refine, variant } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'typescript',
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$.sequence_expression, $._parenthesized_expression_typed],
				[$.sequence_expression, $._parenthesized_expression_group1],
				[$.primary_expression, $.arrow_function],
				[$.readonly_type, $._kw_readonly_marker],
				[$.abstract_method_signature, $._kw_abstract_marker],
				[$.index_signature, $._kw_readonly_marker],
				[$.primary_expression, $._kw_async_marker],
				[$.primary_expression, $._property_name, $._kw_async_marker],
				[$.primary_expression, $._kw_static_marker],
				[$.primary_expression, $._kw_readonly_marker],
				[$.primary_expression, $._kw_abstract_marker],
				[$.primary_expression, $._kw_const_marker],
				[$.primary_expression, $._kw_using_marker],
				[$.primary_expression, $._property_name],
				[$.labeled_statement, $._property_name],
				[$.object, $.object_pattern],
				[$.primary_expression, $.method_definition],
				[$.primary_expression, $.arrow_function, $._property_name],
				[$.call_expression, $.binary_expression, $.unary_expression, $.instantiation_expression],
				[$.assignment_expression, $.pattern],
				[$.primary_expression, $.pattern],
				[$.primary_expression, $._parameter_name],
				[$.call_expression, $.await_expression, $.binary_expression, $.instantiation_expression],
				[$.array, $.array_pattern],
				[$.primary_type, $.type_parameter],
				[$.call_expression, $.binary_expression, $.update_expression, $.instantiation_expression],
				[$.primary_expression, $.rest_pattern],
				[$._for_header, $.primary_expression],
				[$.class],
				[$.class_static_block, $._property_name],
				[$.primary_expression, $.literal_type],
				[$.pattern, $.primary_type],
				[$.primary_expression, $.primary_type],
				[$.primary_expression, $.nested_identifier, $.nested_type_identifier],
				[$.primary_expression, $.generic_type],
				[$._parameter_name, $.primary_type],
				[$.primary_expression, $.predefined_type],
				[$._call_signature, $.function_type],
				[$.optional_tuple_parameter, $.primary_type],
				[$.call_expression, $.binary_expression, $.instantiation_expression],
				[$.object_assignment_pattern, $.assignment_expression],
				[$.array, $.computed_property_name],
				[$.variable_declarator, $._for_header],
				[$.object, $.object_pattern, $._property_name],
				[$.object_pattern, $.object_type],
				[$.object, $.object_type],
				[$.primary_expression, $.pattern, $.primary_type],
				[$.primary_expression, $._parameter_name, $.primary_type],
				[$.array, $.array_pattern, $.tuple_type],
				[$.array_pattern, $.tuple_type],
				[$.array, $.tuple_type],
				[$._call_signature, $.constructor_type],
				[$.template_string, $.template_literal_type],
				[$.object, $.object_pattern, $.object_type],
				[$.primary_expression, $.rest_pattern, $.primary_type],
				[$.primary_expression, $.rest_pattern, $.literal_type],
				[$.primary_expression, $.rest_pattern, $.predefined_type],
				[$.nested_identifier, $.nested_type_identifier],
				[$._initializer, $.binary_expression],
				[$.primary_expression, $._export_statement_namespace_export],
				[$.binary_expression, $.unary_expression, $.instantiation_expression, $._call_expression_call],
				[$.await_expression, $.binary_expression, $.instantiation_expression, $._call_expression_call],
				[$.binary_expression, $.update_expression, $.instantiation_expression, $._call_expression_call],
				[$.binary_expression, $.instantiation_expression, $._call_expression_call],
				[$._type_query_call_expression_in_type_annotation, $._call_expression_call],
				[$._type_query_call_expression, $._call_expression_call],
				[$.primary_expression, $._export_statement_default],
				[$.string],
				[$.await_expression, $._update_expression_postfix],
				[$.await_expression, $._update_expression_group1],
				[$.arrow_function, $._update_expression_group1],
				[$.await_expression, $._call_expression_call],
				[$.instantiation_expression, $._call_expression_call],
				[$.await_expression, $._binary_expression_group1],
				[$.as_expression, $._binary_expression_group1],
				[$._call_expression_call, $._binary_expression_group1],
				// _binary_expression_group1 (the `in`-operator arm, freshly extracted —
				// same PREC-descent mechanism as call_expression's arms above) mirrors
				// binary_expression's own conflict set: every continuation that used to
				// share LR state with the whole (unsplit) binary_expression choice needs
				// the same explicit GLR declaration now that this one arm has its own
				// symbol boundary.
				[$.call_expression, $._binary_expression_group1, $.unary_expression, $.instantiation_expression],
				[$.call_expression, $.await_expression, $._binary_expression_group1, $.instantiation_expression],
				[$.call_expression, $._binary_expression_group1, $.update_expression, $.instantiation_expression],
				[$.call_expression, $._binary_expression_group1, $.instantiation_expression],
				[$._initializer, $._binary_expression_group1],
				[$._binary_expression_group1, $.unary_expression, $.instantiation_expression, $._call_expression_call],
				[$.await_expression, $._binary_expression_group1, $.instantiation_expression, $._call_expression_call],
				[$._binary_expression_group1, $.update_expression, $.instantiation_expression, $._call_expression_call],
				[$._binary_expression_group1, $.instantiation_expression, $._call_expression_call],
				[$.subscript_expression, $._binary_expression_group1],
				[$.member_expression, $._binary_expression_group1],
				[$.member_expression, $.subscript_expression, $._binary_expression_group1],
				[$.binary_expression, $.instantiation_expression, $._call_expression_call, $._binary_expression_group1],
				[$.non_null_expression, $._binary_expression_group1],
				[$.satisfies_expression, $._binary_expression_group1],
				[$._binary_expression_group1, $._update_expression_postfix],
				[$._binary_expression_group1, $._update_expression_prefix],
				[$._binary_expression_group1, $._update_expression_group1],
				[$.ternary_expression, $._binary_expression_group1],
				[$.arrow_function, $._call_expression_call],
				[$.arrow_function, $._binary_expression_group1],
				[$.expression, $._call_expression_template_call],
				[$._variable_declarator_group1, $._for_header_group2],
				[$.primary_expression, $._for_header_group2],
				[$._variable_declarator_group1, $._for_header_let_const_kind],
				[$._class_body_group1, $._class_body_group2],
				[$.import, $._meta_property_group2],
				[$.primary_expression, $._meta_property_group1],
				[$._lhs_expression, $._export_statement_equals_export],
				[$.object_assignment_pattern, $._lhs_expression],
				[$.object_assignment_pattern, $._lhs_expression, $._export_statement_equals_export],
				[$.primary_expression, $._lhs_expression],
				[$._lhs_expression, $.primary_type],
				[$._lhs_expression, $.literal_type],
				[$._lhs_expression, $.readonly_type],
				[$._lhs_expression, $.predefined_type],
				[$.function_type, $._arrow_function__call_signature],
				[$.primary_expression, $._lhs_expression, $.primary_type],
				[$.primary_expression, $._lhs_expression, $.literal_type],
				[$.primary_expression, $._lhs_expression, $.predefined_type],
				[$.constructor_type, $._arrow_function__call_signature],
				[$._lhs_expression],
				[$.await_expression, $._update_expression_prefix],
				[$.arrow_function, $._update_expression_postfix],
				[$.arrow_function, $._update_expression_prefix],
				[$.primary_expression, $._export_statement_default_from_arm],
				[$.primary_expression, $._export_statement_default_decl_arm],
				[$.primary_expression, $._parameter_name, $.readonly_type],
				[$._class_body_method],
				[$._class_body_method_sig, $._class_body_member],
				[$._public_field_definition_declare_first],
				[$.method_definition, $._public_field_definition_readonly_first],
				[$.method_definition, $._public_field_definition_static_mods],
				[$.method_definition, $._public_field_definition_access_first],
				[$._public_field_definition_static_mods],
				[$._public_field_definition_abstract_first],
				[$.method_definition, $.method_signature, $._public_field_definition_readonly_first],
				[$.method_definition, $.method_signature, $._public_field_definition_static_mods],
				[$.abstract_method_signature, $._public_field_definition_access_first],
				[$.method_definition, $.method_signature, $._public_field_definition_access_first],
				[$.primary_expression, $._for_header_lhs],
				[$.primary_expression, $._for_header_var_kind],
				[$.primary_expression, $._for_header_let_const_kind],
				[$.variable_declarator, $._for_header_var_kind],
				[$.variable_declarator, $._for_header_let_const_kind]
			],
			inline: ($, previous) => [
				...(previous ?? []),
				$._object_group1,
				$._object_pattern_group1,
				$._reserved_identifier_group1,
				$._primary_expression_group1,
				$._meta_property_group1,
				$._meta_property_group2,
				$._lhs_expression_group1,
				$._method_definition_group1,
				$._public_field_definition_group2,
				$._public_field_definition_group3,
				$._public_field_definition_group4,
				$._export_statement_group1,
				$._export_statement_group2,
				$._export_statement_group3,
				$._export_statement_group4,
				$._export_statement_group5,
				$._export_statement_group6,
				$._export_statement_group7,
				$._export_statement_group8,
				$._public_field_definition_accessor_opt
			],
			polymorphs: {
				arrow_function: { '1/0': 'parameter', '1/1': '_call_signature' },
				class_heritage: { '0': 'extends_clause', '1': 'implements_clause' },
				import_clause: {
					'0': 'namespace_import',
					'1': 'named_imports',
					'2': 'default_import'
				},
				import_specifier: { '1/0': 'name', '1/1': 'as' },
				index_signature: { '2/0': 'colon', '2/1': 'mapped_type_clause' },
				ambient_declaration: {
					'1/0': 'declaration',
					'1/1': 'global',
					'1/2': 'module'
				},

				_export_statement_default: {
					0: 'from_arm',
					'0/1/0': 'star_from',
					'0/1/1': 'ns_from',
					'0/1/2': 'clause_from',
					1: 'decl_arm',
					'1/2/1': 'default_kw',
					'1/2/1/1/1': 'value'
				},

				class_body: {
					'1/0/0': 'method',
					'1/0/1': 'method_sig',
					'1/0/3': 'member'
				},

				_for_header: {
					'1/0': 'lhs',
					'1/1': 'var_kind',
					'1/2': 'let_const_kind'
				},

				public_field_definition: {
					'1/0/0/0': 'declare_first',
					'1/0/0/1': 'access_first',
					'2/0': 'static_mods',
					'2/1': 'abstract_first',
					'2/2': 'readonly_first',
					'2/3': 'accessor_opt'
				}
			},
			groups: {
				jsx_opening_element_content: ($) =>
					seq(
						choice(
							field('name', choice($._jsx_identifier, $.jsx_namespace_name)),
							alias($._jsx_start_opening_element_group1, $.jsx_start_opening_element_group1)
						),
						repeat(field('attribute', $._jsx_attribute))
					)
			},
			transforms: {
				arguments: {
					1: field('arguments')
				},
				array: {
					1: field('elements')
				},
				array_pattern: {
					1: field('elements')
				},
				object: {
					1: field('properties')
				},
				object_pattern: {
					1: field('properties')
				},
				switch_body: {
					1: field('cases')
				},
				jsx_expression: {
					1: field('expression')
				},

				class_body: {
					'1/0/1/1': field('terminator'),
					'1/0/3/1': field('terminator')
				},

				abstract_method_signature: {
					'3/0': field('accessor_kind'),
					'5/0': field('optional_marker')
				},

				ambient_declaration: ($, original) =>
					transform(original, {
						'1/0': variant('declaration'),
						'1/1': variant('global'),
						'1/2': variant('module')
					}),

				as_expression: {
					2: field('type_annotation')
				},

				class_declaration: {
					6: field('automatic_semicolon')
				},

				import_alias: {
					1: field('name'),
					3: field('value'),
					4: field('semicolon')
				},

				import_attribute: {
					0: field('attribute_kind')
				},

				import_statement: {
					1: field('import_clause'),
					2: field('from_clause'),
					4: field('semicolon')
				},

				infer_type: {
					1: field('type_identifier'),
					2: field('constraint')
				},

				intersection_type: {
					0: field('left'),
					2: field('right')
				},

				lexical_declaration: {
					1: field('declarators'),
					2: field('semicolon')
				},

				lookup_type: {
					2: field('index_type')
				},

				member_expression: {
					1: field('separator')
				},

				method_definition: {
					1: field('static_marker'),
					'3/0': field('readonly_marker'),
					'4/0': field('async_marker'),
					'5/0': field('accessor_kind'),
					'7/0': field('optional_marker')
				},

				method_signature: {
					1: field('static_marker'),
					'5/0': field('accessor_kind'),
					'7/0': field('optional_marker')
				},

				program: {
					0: field('hash_bang_line'),
					1: field('statements')
				},

				property_signature: {
					1: field('static_marker'),
					'5/0': field('optional_marker')
				},

				satisfies_expression: {
					2: field('type_annotation')
				},

				statement_block: {
					1: field('statements'),
					3: field('automatic_semicolon')
				},


				union_type: {
					0: field('left'),
					2: field('right')
				},

				variable_declaration: {
					1: field('declarators'),
					2: field('semicolon')
				},

				yield_expression: {
					1: field('expression')
				},

				expression_statement: {
					1: field('semicolon')
				},

				type_alias_declaration: {
					5: field('semicolon')
				},

				return_statement: {
					2: field('semicolon')
				},

				throw_statement: {
					2: field('semicolon')
				},

				function_signature: ($) =>
					choice(
						seq(
							optional(field('async_marker', 'async')),
							'function',
							field('name', $.identifier),
							$._call_signature,
							choice(field('semicolon', $._semicolon), field('semicolon', $._function_signature_automatic_semicolon))
						),
						seq(optional(field('async_marker', 'async')), 'function', field('name', $.identifier), $._call_signature)
					),

				function_expression: {
					'0/0': field('async_marker')
				},

				function_declaration: {
					'0/0': field('async_marker')
				},

				generator_function: {
					'0/0': field('async_marker')
				},

				generator_function_declaration: {
					'0/0': field('async_marker')
				},

				break_statement: {
					2: field('semicolon')
				},

				continue_statement: {
					2: field('semicolon')
				},

				debugger_statement: {
					1: field('semicolon')
				},

				do_statement: {
					4: field('semicolon')
				},

				constructor_type: {
					'0/0': field('abstract_marker')
				},

				enum_declaration: {
					'0/0': field('const_marker')
				},

				function_signature: {
					4: field('semicolon')
				},

				assignment_expression: {
					'0/0': field('using_marker')
				},

				export_specifier: {
					'0/0': field('export_kind')
				},

				import_specifier: {
					'0/0': field('import_kind')
				},

				public_field_definition: {
					'1': field('visibility_prefix'),
					'4/0': field('optionality_marker')
				},

				parenthesized_expression: {
					'1/0': variant('typed'),
					'1/1': variant('sequence')
				},

				// export_statement: variant() adoption on all four branches.
				// Path 0 is the JS-inherited `previous` (export default,
				// export function, export from, …); paths 1/2/3 are
				// `export type`, `export =`, `export as namespace`. Without
				// labeling path 0, its base-JS branches render without the
				// `export` prefix (parent template is just `$$$CHILDREN`,
				// which filters to named children) — the wrapper becomes
				// invisible at render time.
				//
				// `_export_statement_default`'s body is a top-level choice of
				// TWO structurally distinct shapes:
				//   arm 0 — `seq('export', choice(4 from-clause forms), _semicolon)`
				//   arm 1 — `seq(decorator, 'export', choice(declaration | default value))`
				// Splitting it further (e.g. `0/0` / `0/1` for these sub-arms)
				// just moves the non-canonical flag one level deeper — each
				// split arm STILL has inner choice-with-fields shapes
				// (specifiers, from-clause forms, default value). Adoption on
				// kinds synthesized by a parent polymorph adoption isn't
				// supported end-to-end, so deferred for future work. The
				// walker handles the shape via its per-branch + downgrade
				// logic correctly; the audit flag surfaces real adoption
				// opportunity but not a blocking bug.
				export_statement: {
					0: variant('default'),
					1: variant('type_export'),
					2: variant('equals_export'),
					3: variant('namespace_export')
				},

				call_expression: {
					0: variant('call'),
					1: variant('template_call'),
					2: variant('member')
				},

				string: {
					0: variant('double'),
					1: variant('single')
				},

				update_expression: {
					0: variant('postfix'),
					1: variant('prefix')
				}
			},
			visibleExternals: (_$) => ({
				_automatic_semicolon: string('\n'),
				_function_signature_automatic_semicolon: string('\n')
			}),
			expectTestFailures: {
				debugger_statement: '#170 — _resolveOneLeaf cannot resolve the _semicolon stub',
				import_require_clause: '#170 — Missing field _content on ImportRequireClauseTransport._source',
				object_type_content: '#170 (#172-adjacent) — Missing field _content through export-arm transport',
				string: '#170 — StringContentTransportSlot rejects stub ($type property missing)',
				enum_body_group1:
					'#170 — multi-field separatedList (name/enum_assignment); emitSeparatedListFactory only fixes the single-field-storage case, needs a real per-field partition of the flat elements array'
			},
			expectDiagnostics: {
				'storagename-collision': ['_export_statement_group2']
			},
			rules: {
				_reserved_identifier: ($, original) => {
					const members = original.members;
					const last = members[members.length - 1];
					const flatMembers =
						last && last.type === 'CHOICE' && Array.isArray(last.members)
							? [...members.slice(0, -1), ...last.members]
							: members;
					return {
						...original,
						members: flatMembers
					};
				},

				jsx_namespace_name: ($) => seq(field('namespace', $._jsx_identifier), ':', field('name', $._jsx_identifier)),

				// Upstream's `_extends_clause_single` (base grammar.js) carries two
				// fields (value, type_arguments) but is never aliased visible, so it
				// falls to the render layer's single-slot inline path and silently
				// drops `type_arguments`. Alias both occurrences (head + repeat) to a
				// visible kind so it gets its own slot surface, per the
				// single-slot-vs-visible rule.
				extends_clause: ($) =>
					seq(
						'extends',
						seq(
							alias($._extends_clause_single, $.extends_clause_single),
							repeat(seq(',', alias($._extends_clause_single, $.extends_clause_single)))
						)
					),

				_ambient_declaration_global: ($) => seq('global', field('body', $.statement_block)),
				_ambient_declaration_module: ($) =>
					prec.right(
						seq(
							'module',
							'.',
							field('name', alias($.identifier, $.property_identifier)),
							':',
							field('type', $.type),
							optional(field('semicolon', $._semicolon))
						)
					),
				optional_parameter: ($, original) => original,

				public_field_definition: ($, original) => original,

				required_parameter: ($, original) => original,

				object_type: ($) =>
					refine(
						seq(
							field('opening', choice('{', '{|')),
							field('members', optional($.object_type_content)),
							field('closing', choice('}', '|}'))
						),
						{
							curly: { 'opening:': '{', 'closing:': '}' },
							flow: { 'opening:': '{|', 'closing:': '|}' }
						}
					),

				object_type_content: ($) => {
					const SEP = () => choice(',', ';');
					const member = choice(
						$.export_statement,
						$.property_signature,
						$.call_signature,
						$.construct_signature,
						$.index_signature,
						$.method_signature
					);
					return seq(optional(SEP()), seq(member, repeat(seq(SEP(), member))), optional(SEP()));
				}
			}
		},
		enrichedBase
	)
);
