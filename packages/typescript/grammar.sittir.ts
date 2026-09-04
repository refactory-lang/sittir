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
import { enrich, field, alias, wire, refine, variant, preference } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base, {
	// `lexical_declaration` and `variable_declaration` already field their
	// separated declarator list's WHOLE span at positional index 1 as
	// 'declarators' below. applyNodeChoiceFieldWrap's separated-list target
	// fielding the leading/repeated element positions too nests a second,
	// inner field under that outer one — tree-sitter keeps only the
	// innermost field name, so 'declarators' ends up matching nothing
	// (`accessor-throw: repeated slot "declarators" requires at least one
	// value`).
	// `_enum_body_elements`'s element is a choice of a `name`-fielded arm
	// and a bare `enum_assignment` arm — a single uniform 'element' field
	// would erase that distinction (the fielded arm routes by its field
	// label at read time; the classifier merges the arms into one union
	// content slot as-is): `accessor-throw: repeated slot "element"
	// requires at least one value`.
	// `object`, `object_pattern`, `array`, `array_pattern`, and `arguments`
	// already field their separated list's WHOLE span at a positional
	// index below ('properties', 'elements', 'arguments' respectively) —
	// same outer/inner nested-field collision as
	// `lexical_declaration`/`variable_declaration`.
	skip: [
		'lexical_declaration',
		'variable_declaration',
		'_enum_body_elements',
		'object',
		'object_pattern',
		'array',
		'array_pattern',
		'arguments'
	]
});
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'typescript',
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$.sequence_expression, $._parenthesized_expression_typed],
				[$.sequence_expression, $._parenthesized_expression_arm],
				[$.primary_expression, $.arrow_function],
				[$.readonly_type, $._kw_readonly_marker],
				[$.abstract_method_signature, $._kw_abstract_marker],
				[$.index_signature, $._kw_readonly_marker],
				// The fielded `readonly` in index_signature's modifier group makes
				// `'class' '{' 'readonly' • '['` ambiguous with the sibling
				// class-member rules that also start with a readonly modifier.
				[$.method_definition, $.method_signature, $.index_signature, $.public_field_definition],
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
				[$.await_expression, $._update_expression_arm1],
				[$.arrow_function, $._update_expression_arm1],
				[$.await_expression, $._call_expression_call],
				[$.instantiation_expression, $._call_expression_call],
				[$.await_expression, $._binary_expression_arm],
				[$.as_expression, $._binary_expression_arm],
				[$._call_expression_call, $._binary_expression_arm],
				// _binary_expression_arm (the `in`-operator arm, freshly extracted —
				// same PREC-descent mechanism as call_expression's arms above) mirrors
				// binary_expression's own conflict set: every continuation that used to
				// share LR state with the whole (unsplit) binary_expression choice needs
				// the same explicit GLR declaration now that this one arm has its own
				// symbol boundary.
				[$.call_expression, $._binary_expression_arm, $.unary_expression, $.instantiation_expression],
				[$.call_expression, $.await_expression, $._binary_expression_arm, $.instantiation_expression],
				[$.call_expression, $._binary_expression_arm, $.update_expression, $.instantiation_expression],
				[$.call_expression, $._binary_expression_arm, $.instantiation_expression],
				[$._initializer, $._binary_expression_arm],
				[$._binary_expression_arm, $.unary_expression, $.instantiation_expression, $._call_expression_call],
				[$.await_expression, $._binary_expression_arm, $.instantiation_expression, $._call_expression_call],
				[$._binary_expression_arm, $.update_expression, $.instantiation_expression, $._call_expression_call],
				[$._binary_expression_arm, $.instantiation_expression, $._call_expression_call],
				[$.subscript_expression, $._binary_expression_arm],
				[$.member_expression, $._binary_expression_arm],
				[$.member_expression, $.subscript_expression, $._binary_expression_arm],
				[$.binary_expression, $.instantiation_expression, $._call_expression_call, $._binary_expression_arm],
				[$.non_null_expression, $._binary_expression_arm],
				[$.satisfies_expression, $._binary_expression_arm],
				[$._binary_expression_arm, $._update_expression_postfix],
				[$._binary_expression_arm, $._update_expression_prefix],
				[$._binary_expression_arm, $._update_expression_arm1],
				[$.ternary_expression, $._binary_expression_arm],
				[$.arrow_function, $._call_expression_call],
				[$.arrow_function, $._binary_expression_arm],
				[$.expression, $._call_expression_template_call],
				[$._variable_declarator_arm1, $._for_header_arm2],
				[$.primary_expression, $._for_header_arm2],
				[$._variable_declarator_arm1, $._for_header_let_const_kind],
				[$._class_body_arm1, $._class_body_arm2],
				[$.import, $._meta_property_arm2],
				[$.primary_expression, $._meta_property_arm1],
				[$._lhs_expression, $._export_statement_equals_export],
				[$.object_assignment_pattern, $._lhs_expression],
				[$.object_assignment_pattern, $._lhs_expression, $._export_statement_equals_export],
				[$.primary_expression, $._lhs_expression],
				[$._lhs_expression, $.primary_type],
				[$._lhs_expression, $.literal_type],
				[$._lhs_expression, $.readonly_type],
				[$._lhs_expression, $.predefined_type],
				[$.function_type, $._call_signature],
				[$.primary_expression, $._lhs_expression, $.primary_type],
				[$.primary_expression, $._lhs_expression, $.literal_type],
				[$.primary_expression, $._lhs_expression, $.predefined_type],
				[$.constructor_type, $._call_signature],
				[$._lhs_expression],
				[$.await_expression, $._update_expression_prefix],
				[$.arrow_function, $._update_expression_postfix],
				[$.arrow_function, $._update_expression_prefix],
				[$.primary_expression, $._export_statement_default_from],
				[$.primary_expression, $._export_statement_default_declaration],
				[$.primary_expression, $._parameter_name, $.readonly_type],
				[$._class_body_method],
				[$._class_body_method_sig, $._class_body_member],
				[$.public_field_definition],
				[$.method_definition, $.public_field_definition],
				[$.method_definition, $.method_signature, $.public_field_definition],
				[$.abstract_method_signature, $.public_field_definition],
				[$.primary_expression, $._for_header_lhs],
				[$.primary_expression, $._for_header_var_kind],
				[$.primary_expression, $._for_header_let_const_kind],
				[$.variable_declarator, $._for_header_var_kind],
				[$.variable_declarator, $._for_header_let_const_kind]
			],
			groups: {
				jsx_opening_element_content: ($) =>
					seq(
						choice(
							field('name', choice($._jsx_identifier, $.jsx_namespace_name)),
							alias($._jsx_start_opening_element_arm, $.jsx_start_opening_element_arm)
						),
						repeat(field('attribute', $._jsx_attribute))
					)
			},
			patches: {
				binary_expression: {
					24: variant('in')
				},
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

				// Patch sets apply in order. The second fields the member repeat
				// AFTER the arm-level paths of the first resolve against the
				// un-fielded shape: with the `';'` arm alias-identified (see the
				// `class_body` rules: override), every element — members and stray
				// semicolons alike — keys into one ordered `_content` array,
				// retiring this kind's per-kind bucket merge. The third's variant
				// paths then traverse the `content` field the second added.
				class_body: [
					{
						'1/0/0/2': field('terminator'),
						'1/0/1/1': field('terminator'),
						'1/0/3/1': field('terminator')
					},
					{ 1: field('content') },
					{
						'1/content:/0/0': variant('method'),
						'1/content:/0/1': variant('method_sig'),
						'1/content:/0/3': variant('member')
					}
				],

				abstract_method_signature: {
					'3/0': field('accessor_kind'),
					'5/0': field('optional_marker')
				},

				ambient_declaration: {
					'1/0': variant('declaration'),
					'1/1': variant('global'),
					'1/2': variant('module')
				},

				as_expression: {
					2: field('type_annotation')
				},

				class_declaration: {
					'4/0': field('heritage'),
					6: field('automatic_semicolon')
				},

				import_alias: {
					1: field('name'),
					3: field('value'),
					4: field('terminator')
				},

				import_attribute: {
					0: field('attribute_kind')
				},

				index_signature: [
					{
						// Presence carrier for the bare `readonly` modifier: the
						// enclosing optional group's only other slot (`sign`) is
						// itself optional, so without this field a sign-less
						// `readonly [k: string]: T` has nothing recording the
						// group's occurrence and render drops the keyword.
						'0/0/1': field('readonly_marker')
					},
					{ '2/0': variant('colon'), '2/1': variant('mapped_type_clause') }
				],

				import_statement: [
					{ '2/0': variant('clause_from') },
					{
						1: field('import_clause'),
						2: field('from_clause'),
						4: field('terminator')
					}
				],

				infer_type: {
					// No field on position 2 (the optional `extends` clause group):
					// an outer field on an inlined hidden group makes tree-sitter tag
					// every spliced child with the OUTER name, while the slot model
					// names the slot from the inner field — the wire and the model
					// then disagree and the clause never renders. The enrich-supplied
					// inner field('type') is the single naming source.
					1: field('name')
				},

				intersection_type: {
					0: field('left'),
					2: field('right')
				},

				lexical_declaration: {
					1: field('declarators'),
					2: field('terminator')
				},

				lookup_type: {
					0: field('type'),
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
					2: field('terminator')
				},

				yield_expression: {
					1: field('expression')
				},

				expression_statement: {
					0: field('expression'),
					1: field('terminator')
				},

				type_alias_declaration: {
					5: field('terminator')
				},

				// `_expressions` is one expression or a sequence_expression; the
				// slot holds one value, so it is named for that, not for the
				// hidden rule's plural.
				return_statement: {
					1: field('expression'),
					2: field('terminator')
				},

				throw_statement: {
					1: field('expression'),
					2: field('terminator')
				},

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
					2: field('terminator')
				},

				continue_statement: {
					2: field('terminator')
				},

				debugger_statement: {
					1: field('terminator')
				},

				do_statement: {
					4: field('terminator')
				},

				constructor_type: {
					'0/0': field('abstract_marker')
				},

				enum_declaration: {
					'0/0': field('const_marker')
				},

				function_signature: {
					4: field('terminator')
				},

				assignment_expression: {
					'0/0': field('using_marker')
				},

				export_specifier: {
					'0/0': field('export_kind')
				},

				import_specifier: [{ '0/0': field('import_kind') }, { '1/0': variant('name'), '1/1': variant('as') }],

				public_field_definition: {
					// Both spellings of the accessibility position (declare-first
					// and access-first modifier orders) carry ONE shared field so
					// the exclusive occurrences merge into a single slot, same as
					// the enrich-promoted `*_marker` fields merge across the
					// permutation arms.
					'1/0/0/1/0': field('accessibility_modifier'),
					'1/0/1/0': field('accessibility_modifier'),
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

				string: [{ 0: variant('double'), 1: variant('single') }, preference('quote_style', 'double')],

				_semicolon: preference('statement_terminator', ';'),

				update_expression: {
					0: variant('postfix'),
					1: variant('prefix')
				},

				arrow_function: { '1/0': variant('parameter') },

				class_heritage: { '0': variant('extends_clause'), '1': variant('implements_clause') },

				import_clause: {
					'0': variant('namespace_import'),
					'1': variant('named_imports'),
					'2': variant('default_import')
				},

				_export_statement_default: {
					0: variant('from'),
					'0/1/0': variant('star_from'),
					'0/1/1': variant('ns_from'),
					'0/1/2': variant('clause_from'),
					1: variant('declaration'),
					'1/2/1': variant('default_kw'),
					'1/2/1/1/1': variant('value')
				},

				variable_declarator: { 0: variant('plain'), 1: variant('definite') },
				meta_property: { 0: variant('new_target'), 1: variant('import_meta') },

				namespace_import: { 2: field('name') },
				else_clause: { 1: field('body') },
				jsx_element: { 1: field('children') },
				class: { '4/0': field('heritage') },
				abstract_class_declaration: { '5/0': field('heritage') },
				import_require_clause: { 0: field('name') },
				index_type_query: { 1: field('type') },
				flow_maybe_type: { 1: field('type') },
				array_type: { 0: field('type') },
				_export_statement_namespace_export: { 3: field('name'), 4: field('terminator') },
				_export_statement_type_export: { 4: field('terminator') },
				_export_statement_equals_export: { 3: field('terminator') },

				_for_header: {
					'1/0': variant('lhs'),
					'1/1': variant('var_kind'),
					'1/2': variant('let_const_kind')
				}
			},
			externals: ($, previous) => [...(previous ?? []), $._comma_space, $._comma_newline, $._space, $._newline],
			visibleExternals: (_$) => ({
				_automatic_semicolon: string('\n'),
				_function_signature_automatic_semicolon: string('\n'),
				_comma_space: string(', '),
				_comma_newline: string(',\n'),
				_space: string(' '),
				_newline: string('\n')
			}),
			expectTestFailures: {
				debugger_statement: '#170 — _resolveOneLeaf cannot resolve the _semicolon stub',
				import_require_clause: '#170 — Missing field _content on ImportRequireClauseTransport._source',
				object_type_content: '#170 (#172-adjacent) — Missing field _content through export-arm transport',
				string: '#170 — StringContentTransportSlot rejects stub ($type property missing)'
			},
			rules: {
				// `template_substitution` sits only in string-interior contexts
				// (template_string / template_literal_type elements), where any
				// preceding characters are absorbed into a fragment token — no
				// whitespace can ever precede its `${`, but upstream writes a
				// plain string. Declaring `token.immediate` matters for
				// RENDERING: `$` is word-class in typescript, so without the
				// declared fact the seam check injects a hazard space after a
				// word-ending fragment or escape (`mid\n ${`), which reparses
				// as a spurious one-space string_fragment. The stamp makes the
				// kind left-immediate (its leftmost terminal), so structural
				// references render seam-free. Parser-neutral by the absorption
				// argument above.
				template_substitution: ($) => seq(token.immediate('${'), field('expression', $._expressions), '}'),

				// The class-body repeat's bare `';'` arm (stray member-separator
				// semicolons) has no kind identity, so the read's array capture
				// cannot materialize it. Alias the STRING in place to the visible
				// `semicolon` kind — the existing `_semicolon` enum (values
				// `'\n'`/`';'`) already owns that name and member text, so the
				// canonical-hidden lookup and enum transport serve it with no new
				// machinery. An alias on a string renames the node only — no
				// lexing/LR change — and the arm keeps its position, so the
				// `class_body` path patches below stay valid. (NOT the one-arg
				// `alias('semicolon')` patch helper — that synthesizes/reuses a
				// `_semicolon` RULE for the arm, which would make class bodies
				// accept automatic semicolons.)
				// The signature arm of an arrow function is upstream's hidden
				// `_call_signature`, whose fields inline into the parent. Upstream
				// typescript already declares that body as the visible kind
				// `call_signature`, so the arm references that kind directly:
				// storage and parse are one symbol, the arm seats through the
				// existing factory, and no per-parent form kind is minted for a
				// body that has a name of its own. Positions are unchanged, so the
				// `parameter` polymorph path above stays valid.
				arrow_function: ($, original) => ({
					...original,
					members: original.members.map((m, i) =>
						i === 1
							? {
									...m,
									members: (m as { members: unknown[] }).members.map((arm, j) => (j === 1 ? $.call_signature : arm))
								}
							: m
					)
				}),

				class_body: ($, original) => ({
					...original,
					members: original.members.map((m) =>
						(m as { type?: string; content?: { type?: string; members?: unknown[] } }).type === 'REPEAT'
							? {
									...m,
									content: {
										...(m as { content: { members: unknown[] } }).content,
										members: (m as { content: { members: unknown[] } }).content.members.map((arm) =>
											(arm as { type?: string; value?: string }).type === 'STRING' &&
											(arm as { value?: string }).value === ';'
												? { type: 'ALIAS', content: arm, named: true, value: 'semicolon' }
												: arm
										)
									}
								}
							: m
					)
				}),

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
							optional(field('terminator', $._semicolon))
						)
					),
				optional_parameter: ($, original) => original,

				public_field_definition: ($, original) => original,

				required_parameter: ($, original) => original, //TODO: remove?

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
