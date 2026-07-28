/**
 * overrides.ts — Grammar extension for typescript
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
// Use the typescript (non-tsx) grammar so the codegen surface matches
// the reparse target (`WASM_PATHS.typescript` loads the non-tsx wasm).
// Previously imported `tsx/grammar.js` — harmless for the current
// non-JSX corpus but a latent mismatch: anything JSX-shaped would
// reparse-fail. Pick one grammar and stick with it end-to-end.
import base from '../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js';
import { transform, enrich, field, alias, wire, refine, variant } from '../codegen/src/dsl/index.ts';

// Unified composition (matches rust): bind `enrich(base)` once and pass the
// SAME enriched grammar to both grammar() and wire(). wire needs the enriched
// base so its base-dependent passes (auto-group synthesis, body-pattern groups,
// and the enrich-hoisted-clause inline registration) operate on the post-enrich
// shape. Without the 2nd arg those passes silently no-op (the historical
// migration gap that left enrich-hoisted clause groups un-inlined → LR conflicts).
const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'typescript',
			conflicts: ($, previous) => [
				...(previous ?? []),
				// PR 3 (2026-07-21 union-slot design): object's and
				// object_pattern's widened choice-arm mints both route
				// through _reserved_identifier (shorthand-property position,
				// e.g. `{let}`) — a cross-rule collision the leading-symbol
				// check (dsl/enrich.ts's armLeadingSymbolName, per-choice
				// only) can't see, same class as this session's other
				// reserved-identifier cross-rule collisions.
				// parenthesized_expression split: `( expression )` vs
				// `( sequence_expression )` share the expression prefix. The
				// typed variant's hidden rule (`_parenthesized_expression_typed`)
				// competes with `sequence_expression` when the parser sees
				// `( expression •`. GLR resolves based on what follows.
				[$.sequence_expression, $._parenthesized_expression_typed],
				// PR 3 (2026-07-21 union-slot design): same class — the widened
				// mint's own `_parenthesized_expression_group1` shares the
				// `expression` prefix with sequence_expression too.
				[$.sequence_expression, $._parenthesized_expression_group1],
				// Also exposes a latent `async` ambiguity — before the split,
				// tree-sitter resolved `async (` via state shared between the
				// typed parenthesized expression and arrow_function's call
				// signature. With the typed variant lifted to its own hidden
				// rule, the parser needs explicit GLR to decide whether `async
				// (` starts a call (primary_expression) or an arrow function.
				[$.primary_expression, $.arrow_function],
				// `export` as `primary_expression` vs as `_property_name`
				// surfaces once the typed-parenthesized variant brings more
				// expression contexts into the same state.
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
				// string refine rewrite: one fielded `seq` with a correlated
				// `contents` choice replaces the old top-level variant split.
				// Both content arms accept `escape_sequence`, so after the
				// opening quote tree-sitter needs GLR to defer which repeat arm
				// owns the fragment stream until more input arrives.
				[$.string],
				// update_expression variant extraction: the hoisted
				// `_update_expression_postfix` / `_update_expression_prefix`
				// hidden rules inherit the outer `prec.left(0, ...)`, but after
				// extraction they compete with `await_expression` (prec
				// 'unary_void') on the `await expr • '++' …` / `'++' • expr`
				// sequences. Before the split, one `update_expression` rule
				// carried the whole choice under one prec declaration;
				// tree-sitter's LR table handled disambiguation internally.
				// After splitting, both hidden rules each have `prec 0` and
				// compete with `await_expression` individually — GLR is the
				// only resolver. Declare the conflict groups explicitly.
				[$.await_expression, $._update_expression_postfix],
				// PR 3 (2026-07-21 union-slot design): same class — the widened
				// mint's own `_update_expression_group1` inherits the same
				// prec-0-vs-await_expression ambiguity.
				[$.await_expression, $._update_expression_group1],
				[$.arrow_function, $._update_expression_group1],
				[$._variable_declarator_group1, $._for_header_group2],
				[$.primary_expression, $._for_header_group2],
				// PR 3 (2026-07-21 union-slot design): repointing
				// `_export_statement_default`'s nested `from_arm` alias onto its
				// fully-split polymorph home (transform.ts's ALIAS-rename deposit
				// fix) shifted rule registration order enough to expose this
				// `for (let x` shared-prefix ambiguity between
				// `_variable_declarator_group1` and `_for_header_let_const_kind` —
				// tree-sitter's own suggested resolution #4.
				[$._variable_declarator_group1, $._for_header_let_const_kind],
				[$._class_body_group1, $._class_body_group2],
				// (Removed: `[$.computed_property_name, $._array_group1]` — the
				// `_array_group1` mint no longer exists under the
				// `isSupertypeLike` structural mint decline.)
				// `import.meta` arm mint vs the `import` rule share the `import`
				// keyword prefix — tree-sitter's own suggested resolution #4,
				// replacing the retired inline-dissolution workaround.
				[$.import, $._meta_property_group2],
				// `new.target` twin of the pair above: the mint shares the `new`
				// keyword prefix with primary_expression's new_expression arm.
				[$.primary_expression, $._meta_property_group1],
				// `export = <lhs>` arm vs a bare lhs expression statement share
				// the expression prefix once the export-statement mints are no
				// longer inline-dissolved — tree-sitter suggestion #4.
				[$._lhs_expression, $._export_statement_equals_export],
				// Cascade of the same un-dissolution: `{ x` may open an object
				// assignment pattern or a bare lhs — tree-sitter suggestion #4,
				// plus the 3-way superset with the `export =` arm it suggested
				// on the following iteration.
				[$.object_assignment_pattern, $._lhs_expression],
				[$.object_assignment_pattern, $._lhs_expression, $._export_statement_equals_export],
				[$.primary_expression, $._lhs_expression],
				[$._lhs_expression, $.primary_type],
				[$._lhs_expression, $.literal_type],
				[$._lhs_expression, $.readonly_type],
				[$._lhs_expression, $.predefined_type],
				// Post-un-dissolution cascade, arrow-function family: the
				// `_call_signature` polymorph helper vs function_type share the
				// `( params )` prefix in type position — suggestion #4.
				[$.function_type, $._arrow_function__call_signature],
				[$.primary_expression, $._lhs_expression, $.primary_type],
				[$.primary_expression, $._lhs_expression, $.literal_type],
				[$.primary_expression, $._lhs_expression, $.predefined_type],
				[$.constructor_type, $._arrow_function__call_signature],
				// The `_lhs_expression` cascade walks the whole type family one
				// pairwise suggestion at a time (primary_type → literal_type →
				// readonly_type → …) — declare GLR on the union itself as well,
				// the same singleton pattern as `[$.class]`/`[$.string]` above.
				[$._lhs_expression],
				[$.await_expression, $._update_expression_prefix],
				[$.arrow_function, $._update_expression_postfix],
				[$.arrow_function, $._update_expression_prefix],
				// _export_statement_default outer split inherits the outer
				// `_export_statement_default` vs primary_expression conflict on
				// the `export` prefix, propagated to the two outer variants.
				[$.primary_expression, $._export_statement_default_from_arm],
				[$.primary_expression, $._export_statement_default_decl_arm],
				// Wave-3 follow-up (016 task #28): inlining `_kw_readonly_marker`
				// into `_parameter_name` makes the bare `'readonly'` token visible
				// in `_parameter_name`'s state machine. At `'<' '(' 'readonly' • '('`
				// (a generic-typed function-type parameter), the parser now sees three
				// possible interpretations: `_parameter_name 'readonly' • pattern`,
				// `primary_expression 'readonly'` (treating `readonly` as identifier),
				// and `readonly_type 'readonly' • type`. Tree-sitter cannot
				// disambiguate via static precedence; declare the conflict so it
				// forks via GLR.
				[$.primary_expression, $._parameter_name, $.readonly_type],
				// class_body repeat-choice split: the `method` arm ends with
				// `optional(_semicolon)` — tree-sitter can't decide whether to
				// consume the `;` as part of `_class_body_method` or as the
				// next iteration's start. Self-conflict tells it to fork.
				[$._class_body_method],
				// class_body repeat-choice: `method_signature` can appear both
				// in the `method_sig` arm (followed by `_function_signature_…`
				// or `,`) and in the `member` arm (wrapped in a choice-of-
				// member-kinds). Shared prefix requires a GLR fork.
				[$._class_body_method_sig, $._class_body_member],
				// _for_header variant splits: each sub-variant inherits the
				// for-header's identifier-prefix ambiguity.
				[$.primary_expression, $._for_header_lhs],
				[$.primary_expression, $._for_header_var_kind],
				[$.primary_expression, $._for_header_let_const_kind],
				[$.variable_declarator, $._for_header_var_kind],
				[$.variable_declarator, $._for_header_let_const_kind]
			],
			inline: ($, previous) => [
				...(previous ?? []),
				// PR 3 mint-workaround inline block. Names whose mints were
				// retired by the `isSupertypeLike` structural decline are now
				// DEAD entries — tree-sitter warns 'inline rule not defined'
				// (non-fatal) and they are kept only until the next overrides
				// sweep. The SURVIVING structured mints here are load-bearing:
				// un-inlining them re-opens the non-convergent
				// `_lhs_expression`/reserved-identifier conflict cascade.
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
				$._public_field_definition_declare_first,
				$._public_field_definition_access_first,
				$._public_field_definition_static_mods,
				$._public_field_definition_abstract_first,
				$._public_field_definition_readonly_first,
				$._public_field_definition_accessor_opt
				// `_kw_readonly_marker` / `_kw_async_marker` are now
				// auto-inlined by wire() whenever field promotion synthesizes
				// them, so only the polymorph helpers remain explicitly listed
				// here.
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
					'1/0/0': 'method', // seq(repeat(field(decorator,…)), method_definition, optional(_semicolon))
					'1/0/1': 'method_sig', // seq(method_signature, choice(…))
					'1/0/3': 'member' // seq(choice(4 member kinds), choice(_semicolon, ','))
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

				abstract_class_declaration: {},

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

				array_type: {},

				as_expression: {
					2: field('type_annotation') // type [struct=1]
				},

				asserts_annotation: {
					0: field('asserts') // asserts [struct=0]
				},

				await_expression: {},

				class: {},

				class_declaration: {
					6: field('automatic_semicolon')
				},

				computed_property_name: {},

				else_clause: {},

				enum_body: {},

				flow_maybe_type: {},

				import_alias: {
					1: field('name'), // identifier [struct=0]
					3: field('value'), // identifier | nested_identifier [struct=1]
					4: field('semicolon') //  [struct=2]
				},

				import_attribute: {
					0: field('object') // object [struct=0]
				},

				import_require_clause: {},

				import_statement: {
					1: field('import_clause'), // import_clause | import_require_clause [struct=0]
					2: field('from_clause'), //  [struct=1]
					4: field('semicolon') //  [struct=3]
				},

				index_type_query: {},

				infer_type: {
					1: field('type_identifier'), // _type_identifier | type_identifier [struct=0]
					2: field('constraint') // type | type_identifier [struct=1]
				},

				instantiation_expression: {},

				interface_declaration: {},

				intersection_type: {
					0: field('left'), // type [struct=0]
					2: field('right') // type [struct=1]
				},

				lexical_declaration: {
					1: field('declarators'), // variable_declarator [struct=0]
					2: field('semicolon') //  [struct=1]
				},

				lookup_type: {
					2: field('index_type') // type [struct=1]
				},

				method_definition: {
					1: field('static_marker'), // 'static' [pos=1] — T048: fixed from override_modifier
					'3/0': field('readonly_marker'),
					'4/0': field('async_marker'),
					'5/0': field('accessor_kind'),
					'7/0': field('optional_marker')
				},

				method_signature: {
					1: field('static_marker'), // 'static' [pos=1] — T048: fixed from override_modifier
					'5/0': field('accessor_kind'),
					'7/0': field('optional_marker')
				},

				namespace_import: {},

				non_null_expression: {},

				// object_type: handled by refine() in rules: — see below.

				program: {
					0: field('hash_bang_line'), // hash_bang_line [struct=0]
					1: field('statements') // statement [struct=1]
				},

				property_signature: {
					1: field('static_marker'), // 'static' [pos=1] — T048: fixed from override_modifier
					'5/0': field('optional_marker')
				},

				satisfies_expression: {
					2: field('type_annotation') // type [struct=1]
				},

				spread_element: {},

				statement_block: {
					1: field('statements'), // statement [struct=0]
					3: field('automatic_semicolon') //  [struct=1]
				},

				type_assertion: {},

				type_predicate_annotation: {
					0: field('type_predicate') // type_predicate [struct=0]
				},

				union_type: {
					0: field('left'), // type [struct=0]
					2: field('right') // type [struct=1]
				},

				variable_declaration: {
					1: field('declarators'), // variable_declarator [struct=0]
					2: field('semicolon') //  [struct=1]
				},

				yield_expression: {
					1: field('expression') // expression [struct=0]
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

				// JS-inherited function family — all start with `optional('async')` at pos 0.
				//
				// Wave-3 follow-up (016 task #28): label pos 0/0 in each as
				// `async_marker` so render preserves `async function …` /
				// `async function* …` / `async () =>` shapes. Resolved via
				// inlining `_kw_async_marker` into every reference site (see
				// `inline:` above) — without inlining, the synthesized hidden
				// rule's prec(-1) body collides with `primary_expression` /
				// `_property_name` on `{ async (` (method-shorthand vs
				// async-function ambiguity) and with sibling function rules on
				// `'async' • 'function'`. Inlining folds the body into each
				// function rule's state machine — same shape as the
				// pre-promotion grammar — while the FIELD wrapper survives the
				// inlining so the parse tree still labels the marker.
				//
				// function_expression / function_declaration / generator_function /
				// generator_function_declaration are wrapped in `prec(...)`. Enrich's
				// optional-keyword pass doesn't descend through prec, so these
				// positions still need hand-promotion. arrow_function is bare-seq
				// → enrich auto-promotes it; the manual entry is now redundant.

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

				// arrow_function: seq(optional('async'), choice(field('parameter',…),
				//   $._call_signature), '=>', field('body', …)).
				// Auto-promoted by enrich (bare seq); manual entry now redundant.

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

				// -------------------------------------------------------------------
				// Field-promotion wave 3 (016 task #25) — standalone optional-punct
				// → semantic field markers. After enrich auto-promotion (016 task
				// #30), only the prec-wrapped sites need hand-promotion (enrich's
				// walker doesn't descend through `prec(...)`); bare-seq sites are
				// covered by enrich and the wave-3 entries become redundant.
				// -------------------------------------------------------------------

				constructor_type: {
					'0/0': field('abstract_marker')
				},

				// construct_signature / type_parameter / for_in_statement /
				// _parameter_name are bare-seq rules — their standalone optional
				// markers (`abstract`, `const`, `await`, `readonly`) are
				// auto-promoted by enrich. Wave 3's manual entries are now
				// redundant.

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

				// _type_query_subscript_expression: DEFERRED. Tree-sitter aliases
				// this hidden rule to the public `subscript_expression` kind via
				// `alias($._type_query_subscript_expression, $.subscript_expression)`.
				// The base JS `subscript_expression` already labels its `?.` with
				// `optional(field('optional_chain', $.optional_chain))`. Adding
				// `optional_chain_marker` on the hidden alias source extends the
				// merged kind's field set, but the merged template (emitted from
				// the canonical `subscript_expression` rule) only references
				// `optional_chain` — coverage validator flags the unreferenced
				// `optional_chain_marker` field. Promotion at the alias source
				// requires either coalescing both field names downstream or
				// overriding the canonical rule too. Tracked as a follow-up.

				parenthesized_expression: {
					'1/0': variant('typed'),
					'1/1': variant('sequence')
				},

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

				// parenthesized_expression: held. Base is plain `seq('(',
				// _expressions, ')')` with no outer prec — my hoist's prec
				// preservation captures OUTER wrappers, not per-alt prec. The
				// real conflict is that sequence_expression has its OWN
				// `prec.right(commaSep1(...))` that wins against a bare
				// expression alt; splitting exposes this as an unresolvable
				// tie. Fix would need the DSL to recognize per-alt prec inside
				// the choice and lift it to the variant rule — another
				// iteration.

				// export_statement: held. Base has no prec wrapper so prec-
				// preservation doesn't help. The conflict is deeper: `export`
				// as a keyword overlaps with its use as an identifier in
				// primary_expression, and tree-sitter resolves this via
				// internal state in the unsplit grammar. Splitting forces
				// the decision earlier, exposing the ambiguity.

				// call_expression: held. Each alt has its own per-branch prec
				// tag ('call'/'template_call'/'member') which prec-preservation
				// captures correctly, but the split exposes the base grammar's
				// call_expression vs binary_expression vs instantiation_
				// expression ambiguity on `typeof expr <` that the unsplit
				// rule resolves via LR state the base intentionally left
				// ambiguous. Fix would need explicit conflicts entries with
				// external rules — out of scope for variant() adoption.

				jsx_namespace_name: ($) => seq(field('namespace', $._jsx_identifier), ':', field('name', $._jsx_identifier)),

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
				// interface_body is a tree-sitter alias target of object_type —
				// it has no base rule of its own, so there's nothing to refine
				// via an override callback. It inherits the parse shape from
				// object_type. If per-form factory support for `interface_body`
				// is needed, a follow-up can add a codegen pass that mirrors
				// `object_type`'s refineForms onto the alias-target kind.
			}
		},
		enrichedBase
	)
);
