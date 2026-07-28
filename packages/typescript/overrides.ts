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
			// Conflict markers for variant() adoption on kinds where splitting
			// exposes LR(1) ambiguities the unsplit grammar resolved via shared
			// state. Each entry names two or more rules tree-sitter should
			// treat as requiring a GLR state so it can defer the decision
			// until more input disambiguates. Hidden (`_foo`) and visible
			// (`$.foo`) names are both valid here.
			// `previous` is the TS grammar's own conflicts list (which
			// itself concats the JS base's conflicts). Concat so we don't
			// drop the base entries — we only ADD the new ones required by
			// variant() adoption.
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
			// Inline `public_field_definition`'s polymorph-synthesized variant
			// bodies at the alias site. Why inline instead of `conflicts:` —
			// `access_first` reduces to "just accessibility_modifier" and
			// conflicts unrecoverably with method_definition / method_signature
			// / abstract_method_signature that share the prefix. Inlining
			// folds the body into public_field_definition's LR state machine
			// so the pre-split parser states are restored; the alias wrapper
			// survives inlining so the parse tree still surfaces the named
			// variant kind.
			//
			// Experimentally tried moving _for_header and _export_statement_default
			// variants here too — tree-sitter accepted the build, but 1 corpus
			// round-trip dropped to 92 and the typescript factory round-trip
			// started failing. The difference: those variants are referenced
			// through multi-level paths (cascaded polymorph adoption) where
			// inlining changes how tree-sitter resolves alias boundaries at
			// parse time, in ways that slightly alter tree output. Kept as
			// `conflicts:` entries which preserve the exact pre-inline shape.
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

				// PR 3 (2026-07-21 union-slot design): `_export_statement_default`
				// used to be split via 3 SEPARATE, CASCADED polymorphs entries
				// (itself, then `_export_statement_default_from_arm`, then
				// `_export_statement_default_decl_arm`/`..._default_kw`) — each a
				// distinct resolvePatch call materializing its own name. Enrich's
				// widened clause-hoist mint gate raw-mints EVERY one of those
				// intermediate positions (from the RAW base grammar, before any
				// override runs) under its own `_export_statement_group<N>` name;
				// once a NESTED cascade level's config replaces that raw mint's
				// alias content with the properly-split polymorph body (transform.ts's
				// ALIAS-rename deposit + repoint), the ORIGINAL raw mint becomes a
				// provably-unreachable orphan that still reaches codegen (nothing
				// prunes `rules` map entries by reachability — see
				// docs/KNOWN_ISSUES.md's "Assemble-time grammar diagnostics scan
				// every `rules` map entry..." entry) and can trip real bugs
				// downstream (confirmed: a duplicate `AnyTransport` impl, a hard
				// `cargo build` failure, from `_export_statement_default_from_arm`'s
				// nested raw mint). Folding the ENTIRE `_export_statement_default`
				// cascade into ONE polymorphs entry with deep, multi-level string
				// paths — same idiom `class_body`'s
				// `'1/0/0'`/`'1/0/1'`/`'1/0/3'` entry above already uses — means
				// `_export_statement_default` is fully materialized in ONE
				// resolvePatch call, so wire()'s existing orphan-detection
				// (`getEnrichClauseGroupOwners`/`context.authoredRuleNames`) marks
				// its raw enrich mint as orphaned in that ONE pass, instead of
				// leaving a nested raw mint behind for a LATER, separate
				// resolvePatch call to orphan. Produces the exact same final kind
				// names as the 3 cascaded entries did (verified against
				// `conflicts:`'s existing `$._export_statement_default_from_arm` /
				// `..._decl_arm` references above, which still resolve to these
				// names).
				//
				// Body (unchanged from the 3-entry cascade this replaces):
				//   `choice(
				//     seq('export', choice(         // path 0 — from_arm
				//       seq('*', _from_clause),                    // 0/1/0 — star_from
				//       seq(namespace_export, _from_clause),       // 0/1/1 — ns_from
				//       seq(export_clause, _from_clause),          // 0/1/2 — clause_from
				//       export_clause,                             // 0/1/3 — left unlabeled
				//     ), _semicolon),
				//     seq(repeat(field('decorator',…)), 'export', choice(  // path 1 — decl_arm
				//       field('declaration', declaration),
				//       seq('default', choice(                     // 1/2/1 — default_kw
				//         field('declaration', declaration),
				//         seq(field('value', expression), _semicolon),  // 1/2/1/1/1 — value
				//       )),
				//     )),
				//   )`
				_export_statement_default: {
					0: 'from_arm',
					'0/1/0': 'star_from',
					'0/1/1': 'ns_from',
					'0/1/2': 'clause_from',
					1: 'decl_arm',
					'1/2/1': 'default_kw',
					'1/2/1/1/1': 'value'
				},

				// class_body body: `seq('{', repeat(choice(5 arms)), '}')`.
				// Inner repeat-choice has 3 heterogeneous seqs, 1 bare symbol
				// (class_static_block), 1 bare literal (';'). Split the 3 seqs
				// so the choice becomes symbol-like across all arms.
				class_body: {
					'1/0/0': 'method', // seq(repeat(field(decorator,…)), method_definition, optional(_semicolon))
					'1/0/1': 'method_sig', // seq(method_signature, choice(…))
					'1/0/3': 'member' // seq(choice(4 member kinds), choice(_semicolon, ','))
				},

				// _for_header body (base-grammar hidden):
				//   seq('(', choice(3 arms), field('operator', choice('in','of')),
				//       field('right', _expressions), ')')
				//   arm 0: field('left', choice(_lhs_expression, parenthesized_expression))
				//   arm 1: seq(field('kind','var'), field('left',…), optional(_initializer))
				//   arm 2: seq(field('kind', choice('let','const')), field('left',…),
				//              optional(_automatic_semicolon))
				// Split each arm so the outer choice becomes all symbol-like.
				_for_header: {
					'1/0': 'lhs',
					'1/1': 'var_kind',
					'1/2': 'let_const_kind'
				},

				// public_field_definition body position 1:
				//   optional(choice(
				//     seq('declare', optional(accessibility_modifier)),
				//     seq(accessibility_modifier, optional(field('declare', _kw_declare))),
				//   ))
				// Split both arms and INLINE the synthesized hidden rules (see
				// `inline:` below). Inlining is critical here: the `access_first`
				// arm reduces to "just accessibility_modifier" which conflicts
				// with every class-member rule sharing that prefix
				// (`method_definition`, `method_signature`,
				// `abstract_method_signature`). Keeping them as standalone
				// hidden rules produces an unresolvable LR state that
				// tree-sitter can't disambiguate via conflict groups alone.
				// Inlining folds each arm's body back into `public_field_definition`'s
				// state machine — the LR table looks exactly like the pre-split
				// grammar at the conflict site, while sittir's derive-audit
				// still sees the post-polymorph shape (all-alias choice) as
				// canonical. Variant adoption stays a pure sittir-side concern;
				// tree-sitter parses the same tree as before.
				public_field_definition: {
					// Paths carry an extra '/0' hop at position 1 vs. the raw base
					// shape ('1/0/0/0' not '1/0/0') because `transforms:` below wraps
					// position 1 in `field('visibility_prefix', …)` — transforms
					// compose innermost, polymorphs outermost (see wire.ts), so these
					// polymorph paths address the ALREADY-field-wrapped tree. FIELD is
					// a single-content wrapper (like OPTIONAL) that consumes one
					// index-0 hop to descend into its content, shifting every path
					// under position 1 by one segment.
					'1/0/0/0': 'declare_first',
					'1/0/0/1': 'access_first',
					// Position 2: a four-arm modifier choice (heterogeneous).
					'2/0': 'static_mods',
					'2/1': 'abstract_first',
					'2/2': 'readonly_first',
					'2/3': 'accessor_opt'
				}
			},
			groups: {
				// __jsx_start_opening_element_optional1 is the inline two-slot helper for
				// JSX element head content: choice(name / name+type_args) + repeat(attribute).
				// The two-slot seq causes the template to flatten both slots, losing the
				// name–attribute distinction. Registering as a visible group collapses the
				// parent's optional to a single `jsx_opening_element_content` slot so each
				// field renders from its own slot. Also fixes _jsx_start_opening_element's
				// multi-slot-nested-seq diagnostic (it inlines __jsx_start_opening_element_optional1).
				// The name+type_arguments arm is NOT written out inline: enrich's group
				// lift has already hoisted it into `_jsx_start_opening_element_group1`
				// (aliased visible) by the time pattern replacement compares bodies, so
				// the post-enrich sub-tree this pattern must equal holds that alias ref.
				// The old inline-seq form silently matched nothing (caught by
				// `body-pattern-zero-match`).
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
				// Naked-choice field names (was unresolvable `content` slots).
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

				// class_body: repeat-choice arm 3 is the upstream inline
				// `seq(choice(4 sigs), choice(_semicolon | ','))` that sittir extracts
				// into the hidden `_class_body_member` — both positions unnamed → 2
				// `content` slots (content-collision). Name the terminator by its path
				// in the parent (fields are applied before the extraction): pos 0 (the
				// member) keeps `content`, pos 1 (the `;`/`,` choice) → `terminator`.
				// Path `1/0/3/1`: seq pos 1 (repeat) → `/0` repeat content (choice) →
				// arm 3 → arm-seq pos 1 (terminator choice).
				class_body: {
					// Arm 1 (method_signature) terminates with the unnamed mixed
					// row `choice(_function_signature_automatic_semicolon, ',')`
					// — same shape as arm 3's, but with one arm ANONYMOUS: the
					// bare `,` lands in `$other` where the kind-derived slot
					// can't reach it, so a comma-terminated signature leaves the
					// `function_signature_automatic_semicolon` slot empty and
					// wrap throws. Field both arms under the same `terminator`
					// name as arm 3 (the expression_list/pattern_list precedent).
					'1/0/1/1': field('terminator'),
					'1/0/3/1': field('terminator')
				},

				// abstract_class_declaration: wrap pos 5 (class_heritage choice).
				// pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
				// base-grammar field and the original override clobbered it.
				abstract_class_declaration: {},

				// abstract_method_signature: seq(
				//   optional($.accessibility_modifier),    // pos 0
				//   'abstract',                             // pos 1 (literal, not optional)
				//   optional($.override_modifier),          // pos 2
				//   optional(choice('get','set','*')),     // pos 3  →  '3/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),        // pos 4
				//   optional('?'),                          // pos 5  →  '5/0'  (optional_marker)
				//   $._call_signature)                      // pos 6
				// Field-promotion wave 3 (016 task #25): symmetric to
				// method_definition / method_signature for the trailing `?` plus
				// the accessor keyword. NOTE: no readonly_marker — `'abstract'` is
				// a required literal at pos 1, not optional.
				abstract_method_signature: {
					'3/0': field('accessor_kind'),
					'5/0': field('optional_marker')
				},

				// ambient_declaration: split the heterogeneous declaration choice
				// so each arm owns its own literal scaffold (`declare global …`,
				// `declare module.<name>: <type>;`, or direct declaration).
				ambient_declaration: ($, original) =>
					transform(original, {
						'1/0': variant('declaration'),
						'1/1': variant('global'),
						'1/2': variant('module')
					}),

				// array_type: 1 field(s)
				array_type: {},

				// as_expression: 2 field(s)
				as_expression: {
					2: field('type_annotation') // type [struct=1]
				},

				// asserts_annotation: 1 field(s)
				asserts_annotation: {
					0: field('asserts') // asserts [struct=0]
				},

				// await_expression: 1 field(s)
				await_expression: {},

				// class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
				class: {},

				// class_declaration: wrap pos 4 (class_heritage choice) and pos 6
				// (automatic_semicolon choice). pos 0 is decorator repeat — leave it
				// alone so the base 'decorator' field survives.
				class_declaration: {
					6: field('automatic_semicolon')
				},

				// computed_property_name: 1 field(s)
				computed_property_name: {},

				// else_clause: 1 field(s)
				else_clause: {},

				// enum_body — NO override field. Upstream each member is already
				// `choice(field('name', $._property_name), $.enum_assignment)`, so the
				// members carry their own fields. The auto-generated `field('opening')`
				// wrapped the list in a SPURIOUS outer field that nested over the inner
				// `name`; the reader keyed members under the innermost (`name`) while the
				// model only knew `opening`, dropping every member on render (`{ }`).
				// The fix is to add no field at all — pass the upstream rule through.
				// (Tried aliasing the bare-name arm to a node kind to force one union
				// slot; `carriesNamedField` sees through the alias to the inner field and
				// distributes anyway, and the alias-of-hidden-rule got stripped — no gain.
				// A separate visible `enum_property` rule would work but is a parser
				// change for the uncorpused mixed-enum case; left as a latent gap.)
				enum_body: {},

				// flow_maybe_type: 1 field(s)
				flow_maybe_type: {},

				// import_alias: 3 field(s)
				import_alias: {
					1: field('name'), // identifier [struct=0]
					3: field('value'), // identifier | nested_identifier [struct=1]
					4: field('semicolon') //  [struct=2]
				},

				// import_attribute: 1 field(s)
				import_attribute: {
					0: field('object') // object [struct=0]
				},

				// import_require_clause: 1 field(s)
				import_require_clause: {},

				// import_statement: 4 field(s)
				import_statement: {
					1: field('import_clause'), // import_clause | import_require_clause [struct=0]
					2: field('from_clause'), //  [struct=1]
					4: field('semicolon') //  [struct=3]
				},

				// index_type_query: 1 field(s)
				index_type_query: {},

				// infer_type: 2 field(s)
				infer_type: {
					1: field('type_identifier'), // _type_identifier | type_identifier [struct=0]
					2: field('constraint') // type | type_identifier [struct=1]
				},

				// instantiation_expression: 1 field(s)
				instantiation_expression: {},

				// interface_declaration: 1 field(s)
				interface_declaration: {},

				// intersection_type: 2 field(s)
				intersection_type: {
					0: field('left'), // type [struct=0]
					2: field('right') // type [struct=1]
				},

				// lexical_declaration: 2 field(s)
				lexical_declaration: {
					1: field('declarators'), // variable_declarator [struct=0]
					2: field('semicolon') //  [struct=1]
				},

				// lookup_type: 2 field(s)
				lookup_type: {
					2: field('index_type') // type [struct=1]
				},

				// method_definition: prec.left(seq(
				//   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                    // pos 1  →  'static_marker' (T048: was wrongly labeled
				//                                          //         override_modifier; _kw_static_marker synthesized
				//                                          //         here; add to inline: if parse drift emerges)
				//   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
				//   optional('readonly'),                  // pos 3  →  '3/0'  (readonly_marker)
				//   optional('async'),                     // pos 4  →  '4/0'  (async_marker)
				//   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),       // pos 6
				//   optional('?'),                         // pos 7  →  '7/0'  (optional_marker)
				//   $._call_signature,                     // pos 8
				//   field('body', $.statement_block)))    // pos 9
				// Field-promotion wave 3 (016 task #25): label `async`, the
				// accessor `get`/`set`/`*`, and trailing `?` so render preserves
				// `async get foo?(): T {}` shapes. Naming follows `<token>_marker`
				// (016 task #30); enrich's CHOICE-form-of-optional path doesn't
				// fire on tree-sitter-evaluated rules so these positions are
				// hand-promoted. Wave-3 follow-up (016 task #28): `readonly_marker`
				// was deferred in wave 3 because the synthesized
				// `_kw_readonly_marker` hidden symbol's parse precedence diverges
				// from the bare `'readonly'` token in sibling rules — `class Foo
				// { readonly bar?(): T {} }` regressed to ERROR (parser took
				// `readonly` as the property identifier instead of the marker).
				// Resolved by adding `_kw_readonly_marker` to the top-level
				// `inline:` array (see above), which folds the hidden rule's body
				// into every reference site at LR-table generation while preserving
				// the FIELD wrapper for the parse tree.
				method_definition: {
					1: field('static_marker'), // 'static' [pos=1] — T048: fixed from override_modifier
					'3/0': field('readonly_marker'),
					'4/0': field('async_marker'),
					'5/0': field('accessor_kind'),
					'7/0': field('optional_marker')
				},

				// method_signature: seq(
				//   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                    // pos 1  →  'static_marker' (T048: was wrongly labeled
				//                                          //         override_modifier; pos 2 override_modifier
				//                                          //         auto-promoted by enrich)
				//   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly_marker by enrich)
				//   optional('async'),                     // pos 4  (auto-promoted: async_marker by enrich)
				//   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),       // pos 6
				//   optional('?'),                         // pos 7  →  '7/0'  (optional_marker)
				//   $._call_signature)                     // pos 8
				// Standalone `optional('readonly')` / `optional('async')` are
				// auto-promoted by enrich. Kept entries: accessor_kind
				// (choice-of-strings, enrich skips), optional_marker
				// (`?` not identifier-shaped).
				method_signature: {
					1: field('static_marker'), // 'static' [pos=1] — T048: fixed from override_modifier
					'5/0': field('accessor_kind'),
					'7/0': field('optional_marker')
				},

				// namespace_import: 1 field(s)
				namespace_import: {},

				// non_null_expression: 1 field(s)
				non_null_expression: {},

				// object_type: handled by refine() in rules: — see below.

				// program: 2 field(s)
				program: {
					0: field('hash_bang_line'), // hash_bang_line [struct=0]
					1: field('statements') // statement [struct=1]
				},

				// property_signature: seq(
				//   optional($.accessibility_modifier),  // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                   // pos 1  →  'static_marker' (T048: was wrongly labeled
				//                                         //         override_modifier; pos 2 override_modifier
				//                                         //         auto-promoted by enrich)
				//   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly_marker by enrich)
				//   field('name', $._property_name),       // pos 4
				//   optional('?'),                         // pos 5  →  '5/0'  (optional_marker)
				//   field('type', optional($.type_annotation)))  // pos 6
				// Standalone `optional('readonly')` is auto-promoted by enrich.
				// Kept entries: optional_marker (`?` non-identifier).
				property_signature: {
					1: field('static_marker'), // 'static' [pos=1] — T048: fixed from override_modifier
					'5/0': field('optional_marker')
				},

				// satisfies_expression: 2 field(s)
				satisfies_expression: {
					2: field('type_annotation') // type [struct=1]
				},

				// spread_element: 1 field(s)
				spread_element: {},

				// statement_block: 2 field(s)
				statement_block: {
					1: field('statements'), // statement [struct=0]
					3: field('automatic_semicolon') //  [struct=1]
				},

				// type_assertion: 2 field(s)
				type_assertion: {},

				// type_predicate_annotation: 1 field(s)
				type_predicate_annotation: {
					0: field('type_predicate') // type_predicate [struct=0]
				},

				// union_type: 2 field(s)
				union_type: {
					0: field('left'), // type [struct=0]
					2: field('right') // type [struct=1]
				},

				// variable_declaration: 2 field(s)
				variable_declaration: {
					1: field('declarators'), // variable_declarator [struct=0]
					2: field('semicolon') //  [struct=1]
				},

				// yield_expression: 1 field(s)
				yield_expression: {
					1: field('expression') // expression [struct=0]
				},

				// expression_statement: label the trailing `_semicolon` so the
				// template emits `{{ semicolon }}`. Without the label, readNode
				// captures the anon `;` child but the parent template's
				// `{{ children | join(" ") }}` filters to NAMED-only children
				// and the `;` drops. Grammar: `seq(_expressions, _semicolon)`.
				expression_statement: {
					1: field('semicolon')
				},

				// type_alias_declaration: same semicolon-drop pattern. Grammar:
				// `seq('type', field('name'), optional(type_parameters), '=',
				// field('value'), _semicolon)` — label pos 5.
				type_alias_declaration: {
					5: field('semicolon')
				},

				// return_statement: seq('return', optional(_expressions),
				// _semicolon). Label pos 2.
				return_statement: {
					2: field('semicolon')
				},

				// throw_statement: seq('throw', _expressions, _semicolon).
				throw_statement: {
					2: field('semicolon')
				},

				// function_signature: seq(
				//   optional('async'),
				//   'function',
				//   field('name'),
				//   _call_signature,
				//   choice(_semicolon, _function_signature_automatic_semicolon))
				// Keep the trailing semicolon field optional in the override
				// surface. The declarations corpus includes EOF-terminated
				// ambient exports like `export async function …` that parse as a
				// function_signature without surfacing either semicolon token.
				// Model the real read surface instead of forcing a missing slot.
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

				// function_expression: prec('literal', seq(
				//   optional('async'), 'function', field('name', optional($.identifier)),
				//   $._call_signature, field('body', $.statement_block)))
				function_expression: {
					'0/0': field('async_marker')
				},

				// function_declaration: prec.right('declaration', seq(
				//   optional('async'), 'function', field('name', $.identifier),
				//   $._call_signature, field('body', $.statement_block),
				//   optional($._automatic_semicolon)))
				function_declaration: {
					'0/0': field('async_marker')
				},

				// generator_function: prec('literal', seq(
				//   optional('async'), 'function', '*',
				//   field('name', optional($.identifier)),
				//   $._call_signature, field('body', $.statement_block)))
				generator_function: {
					'0/0': field('async_marker')
				},

				// generator_function_declaration: prec.right('declaration', seq(
				//   optional('async'), 'function', '*', field('name', $.identifier),
				//   $._call_signature, field('body', $.statement_block),
				//   optional($._automatic_semicolon)))
				generator_function_declaration: {
					'0/0': field('async_marker')
				},

				// arrow_function: seq(optional('async'), choice(field('parameter',…),
				//   $._call_signature), '=>', field('body', …)).
				// Auto-promoted by enrich (bare seq); manual entry now redundant.

				// break_statement: seq('break', field('label', optional(...)),
				// _semicolon). Label the trailing `;` at pos 2.
				break_statement: {
					2: field('semicolon')
				},

				// continue_statement: seq('continue', field('label', ...), _semicolon).
				continue_statement: {
					2: field('semicolon')
				},

				// debugger_statement: seq('debugger', _semicolon).
				debugger_statement: {
					1: field('semicolon')
				},

				// do_statement: seq('do', field('body'), 'while', field('condition'),
				// optional(_semicolon)). Optional wrapper at pos 4; labeling as
				// a semicolon field lets the template emit it when present.
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

				// constructor_type: prec.left(seq(
				//   optional('abstract'),  // pos 0  →  '0/0'  (abstract_marker)
				//   'new', type_parameters?, parameters, '=>', type))
				// prec.left wrapper hides the seq from enrich; hand-promoted here.
				constructor_type: {
					'0/0': field('abstract_marker')
				},

				// construct_signature / type_parameter / for_in_statement /
				// _parameter_name are bare-seq rules — their standalone optional
				// markers (`abstract`, `const`, `await`, `readonly`) are
				// auto-promoted by enrich. Wave 3's manual entries are now
				// redundant.

				// enum_declaration: seq(
				//   optional('const'),  // pos 0  →  '0/0'  (const_marker)
				//   'enum', name, body)
				// Kept hand-promoted because the factoryRoundtrip AST match fails
				// when only enrich auto-promotes (synthesized `_kw_const_marker`
				// content shape diverges).
				enum_declaration: {
					'0/0': field('const_marker')
				},

				// function_signature: seq(optional('async'), 'function',
				//   field('name', ...), _call_signature,
				//   choice(_semicolon, alias(_function_signature_automatic_semicolon, ...)))
				// pos 4 is the UNNAMED terminator choice. visibleExternals makes
				// the ASI arm a real kind-keyed node, but the explicit-';' arm is
				// an anonymous token that lands in $other where the derived
				// singular slot can't reach it ("singular slot 'content' ...
				// got undefined"). Field it like type_alias_declaration's
				// grammar-authored `semicolon:` field — both arms then arrive
				// field-keyed and the terminator classifies as the same enum.
				function_signature: {
					4: field('semicolon')
				},

				// assignment_expression: prec.right('assign', seq(
				//   optional('using'),  // pos 0  →  '0/0'  (using_marker)
				//   field('left', ...), '=', field('right', ...)))
				// prec.right wrapper hides the seq from enrich; hand-promoted here.
				assignment_expression: {
					'0/0': field('using_marker')
				},

				// export_specifier: seq(
				//   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (export_kind)
				//   previous)
				// Choice-of-strings: tree-sitter strips FIELD wrappers around bare
				// STRING but retains FIELD around CHOICE. The synthesized
				// `_kw_<name>` indirection in maybeKeywordSymbol only targets bare
				// STRING / OPTIONAL(STRING) shapes — falls through here unchanged
				// (CHOICE without BLANK is not handled). Risk: tree-sitter may
				// strip the FIELD around the bare-STRING choice arms.
				export_specifier: {
					'0/0': field('export_kind')
				},

				// import_specifier: seq(
				//   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (import_kind)
				//   choice(...))
				// Same caveat as export_specifier above re: choice-of-strings.
				import_specifier: {
					'0/0': field('import_kind')
				},

				// public_field_definition: seq(
				//   repeat(field('decorator', ...)),                // pos 0
				//   optional(choice(...)),                           // pos 1 (POLYMORPHED — declare_first / access_first)
				//   choice(...),                                     // pos 2 (POLYMORPHED — static_mods / abstract_first / readonly_first / accessor_opt)
				//   field('name', $._property_name),                 // pos 3
				//   optional(choice('?', '!')),                     // pos 4  →  '4/0'  (optionality_marker)
				//   field('type', optional($.type_annotation)),     // pos 5
				//   optional($._initializer))                        // pos 6
				// Field-promotion wave 3 (016 task #25): label the `?`/`!` choice
				// as `optionality_marker`. Different semantics in one slot
				// (`?` = optional field, `!` = definite-assignment) — keep as one
				// discriminator field; the literal value distinguishes.
				//
				// content-collision (PR-L task 4): positions 1 and 2 are both
				// unnamed POLYMORPHED unions (declare/access-first, and the
				// 4-arm modifier choice) — 2 anonymous 'content' slots sharing
				// the `_content` storage key. Name position 1's outer union
				// `visibility_prefix` (>1 drops to 1, silencing the diagnostic;
				// position 2 stays unnamed, no collision remains since only one
				// unnamed content slot is left). The polymorphs map above adds
				// an extra '/0' hop under position 1 to compensate — this
				// field() wrap runs BEFORE polymorphs (transforms innermost,
				// polymorphs outermost), so it shifts every path under
				// position 1 by one segment.
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

				// parenthesized_expression: variant() adoption. Shape is
				// `seq('(', choice(typed_expr, sequence_expression), ')')`.
				// The inner choice's alternatives become variant-child kinds
				// that own the surrounding `(` / `)` scaffold via Link's
				// push-down; the parent template collapses to $$$CHILDREN.
				// Path 1/N targets choice alt N inside the seq's member 1.
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

				// call_expression: variant() adoption on three per-prec
				// branches. Each branch is wrapped in `prec('call' |
				// 'template_call' | 'member')` and Link's variant hoist
				// re-wraps each extracted hidden rule in the same prec so the
				// base grammar's conflict resolution carries through.
				call_expression: {
					0: variant('call'),
					1: variant('template_call'),
					2: variant('member')
				},

				// string: variant() adoption on the quote-style choice. Base
				// grammar: `choice(seq('"', …, '"'), seq("'", …, "'"))`. The
				// walker's primary-branch-wins would always pick the first
				// (double-quoted) branch as the template, so `'x'` source
				// round-trips as `"x"` — AST mismatch. Splitting into variant
				// children (`string_double` / `string_single`) gives each its
				// own template that preserves the quote style.
				//
				// Restored 2026-07-20 (was removed in c5f7f88ff, 2026-05-12,
				// in favor of a `rules:` rewrite using `refine()` to
				// correlate an uncorrelated flat seq — see that rule's
				// former doc comment for the intent). refine() is
				// authoring-only metadata (packages/codegen/src/dsl/primitives/refine.ts)
				// and never constrains the actual generated parser: the
				// rewritten grammar left `unescaped_double_string_fragment`
				// and `unescaped_single_string_fragment` lexically reachable
				// in the SAME parser state regardless of which quote char
				// opened the string, so tree-sitter's longest-match lexer
				// could pick the wrong fragment token and consume past the
				// intended closing quote — every plain string literal
				// produced ERROR (rust/crates/sittir-parity-tests/tests/native_parser.rs's
				// `typescript_lexical_declaration_reads_override_named_fields`,
				// confirmed via `tree-sitter parse` on the compiled parser
				// directly, no read/transport layer involved). This variant
				// split leaves the base grammar's already-correlated
				// `choice(seq('"',…,'"'), seq("'",…,"'"))` untouched — the
				// quote literal and its matching fragment token are baked
				// into the same seq branch, so there's no cross-branch
				// lexical ambiguity for tree-sitter to resolve at runtime.
				string: {
					0: variant('double'),
					1: variant('single')
				},

				// update_expression: postfix vs prefix `++` / `--`.
				update_expression: {
					0: variant('postfix'),
					1: variant('prefix')
				}
			},
			// Sittir-side rule bodies for external scanner symbols. The grammar's
			// external scanner triggers ASI (Automatic Semicolon Insertion) by
			// producing `_automatic_semicolon` and `_function_signature_automatic_semicolon`
			// as zero-width terminator tokens. Every `SYMBOL` reference to
			// either name gets wrapped in a named visible alias
			// (`alias($._automatic_semicolon, $.automatic_semicolon)`, etc.)
			// under both runtimes, so tree-sitter materializes a real CST node
			// for the ASI marker instead of it vanishing invisibly into its
			// referencing rule (proven via a scratch parser: aliasing a
			// zero-width external to a named node yields a
			// `[0,15]-[0,15]`-spanning CST node at every insertion point, with
			// no change to the LR tables). `string('\n')` (not `';'`) is the
			// round-trip-stable render — it re-parses to the SAME
			// automatic_semicolon node, whereas `';'` would flip the node type
			// on re-parse.
			visibleExternals: (_$) => ({
				_automatic_semicolon: string('\n'),
				_function_signature_automatic_semicolon: string('\n')
			}),
			// Known-failing generated nodes.test.ts kinds — tracked defects, not
			// silenced mysteries. Remove an entry + regen when its issue is fixed.
			expectTestFailures: {
				debugger_statement: '#170 — _resolveOneLeaf cannot resolve the _semicolon stub',
				import_require_clause: '#170 — Missing field _content on ImportRequireClauseTransport._source',
				object_type_content: '#170 (#172-adjacent) — Missing field _content through export-arm transport',
				string: '#170 — StringContentTransportSlot rejects stub ($type property missing)',
				enum_body_group1: '#170 — multi-field separatedList (name/enum_assignment); emitSeparatedListFactory only fixes the single-field-storage case, needs a real per-field partition of the flat elements array'
			},
			// PR 3 (2026-07-21 union-slot design): `_export_statement_group2` is an
			// orphaned duplicate — enrich's raw clause-hoist mint of
			// `_export_statement_default`'s `from_arm` position, superseded once
			// the nested `polymorphs:` config below (`_export_statement_default`
			// → `_export_statement_default_from_arm`) properly splits the SAME
			// content under its own name (transform.ts's ALIAS-rename deposit now
			// repoints the live alias there). `_export_statement_group2` is
			// provably unreachable from `export_statement` but assemble's
			// diagnostics still scan it like live structure — see
			// docs/KNOWN_ISSUES.md's "Assemble-time grammar diagnostics scan
			// every `rules` map entry, including ones unreachable from any
			// top-level kind" for the principled (reachability-based) fix,
			// tracked there rather than implemented here.
			expectDiagnostics: {
				'storagename-collision': ['_export_statement_group2']
			},
			rules: {
				// _reserved_identifier — upstream shape is
				// `(_, previous) => choice(...18 TS-specific bare strings,
				// previous)`, where `previous` is the base JS grammar's own
				// `_reserved_identifier` (get/set/async/static/export/let),
				// left NESTED as a sub-CHOICE member rather than flattened.
				// That nesting blocks classifyHiddenChoiceRule's ENUM
				// admission (requires flat SYMBOL/STRING/named-ALIAS members
				// only — mirrors rust's `_non_special_token` REPEAT1 case,
				// specs/026), so `_reserved_identifier` stays unclassified
				// (rule.type=CHOICE, "mixed/structural — survive as-is") and
				// inlines directly into `_property_identifier`'s occurrence
				// with no node of its own — which is what lets
				// `_property_identifier`'s alias (`statement_identifier_group1`)
				// collapse into a text-only leaf when the matched alternative
				// is one of these bare reserved words, hitting the same
				// anonymous-token-fusion path the wrap.ts fallback exists for.
				// Flatten programmatically (not hardcoding the string list,
				// so this stays correct if upstream's own list ever changes).
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

				// optional_parameter: position 0 is the hidden `_parameter_name`
				// helper which tree-sitter inlines — its `decorator`, `pattern`, and
				// `name` fields promote onto the parent at parse time. The former
				// override wrapped pos 0 as a synthetic `parameter_name` slot that
				// doesn't exist at runtime, clobbering all five declared fields.
				// Positions 1/2/3 (the `?`, the type field, and the initializer)
				// are already correctly structured in the base rule.
				// jsx_namespace_name — base is `seq($._jsx_identifier, ':',
				// $._jsx_identifier)`: an XML-namespace-style `<ns:name>` JSX
				// tag/attribute head where BOTH positions are the same
				// `_jsx_identifier` kind but distinct structural roles. Neither
				// is field-named upstream, so both collapse to the same
				// kind-derived storageName. Field them by role (`namespace` /
				// `name`) — two genuinely distinct positions, not a union.
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

				// public_field_definition: pos 0 is decorator repeat (real base
				// field). The original override labeled pos 0 as
				// accessibility_modifier, clobbering decorator. Dropped entirely —
				// the internal accessibility/override-modifier slots are deep inside
				// nested choices and don't have stable raw positions.
				public_field_definition: ($, original) => original,

				// required_parameter: same shape as optional_parameter modulo the
				// `?` — drop the synthetic `parameter_name` wrapper override and
				// let the walker inline the `_parameter_name` helper's fields.
				required_parameter: ($, original) => original,

				// object_type — full manual rewrite (deviates from author intent).
				// Upstream is
				//   seq(brace,
				//       optional(seq(
				//         optional(choice(',', ';')),                       // leading sep
				//         sepBy1(choice(',', $._semicolon), member),        // the list
				//         optional(choice(',', $._semicolon)))),            // trailing sep
				//       brace)
				// which folds the `,`-vs-`;` delimiter choice AND both flanking
				// separators into one opaque body. Under the value-bearing-slot
				// model the flanking `optional(choice(...))` survive as phantom
				// unnamed `content` slots (a choice is a nonterminal), so the
				// renderer emits stray separators (`{ , … , }`).
				//
				// Re-express the intent explicitly: a curly/flow brace pair around
				// an optional `object_type_content`, where the content is a
				// comma-delimited OR semicolon-delimited member list. Splitting the
				// two delimiter forms makes each form's flanking separators BARE
				// strings (`optional(',')` / `optional(';')`), which the
				// leading/trailing separator fold absorbs into the list repeat's
				// `leading`/`trailing` flags — no phantom content slot. A VISIBLE
				// `object_type_content` rule (not a hidden group) gives tree-sitter
				// real LR states to disambiguate `,` vs `;` at parse time.
				//
				// The brace pair is modeled with `refine` curly/flow forms (NOT a
				// bare `choice(seq(...), seq(...))` and NOT `variant()`): a bare
				// choice distributes to just the shared `content` slot and DROPS
				// the `{`/`{|`/`}`/`|}` differentiating literals from the render
				// template, and `variant()` does not transpile to grammar.js in a
				// full rule replacement (`Invalid rule: [object Object]`). `refine`
				// declares two correlated named forms so the opening/closing brace
				// pair agrees (`{ }` curly, `{| |}` flow) and both literals are
				// auto-stamped, restoring `ir.objectType.curly()` / `.flow()`.
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

				// object_type_content — a single visible rule whose separator is
				// itself a nonterminal `choice(',', ';')`. Under the separator-as-
				// slot model (docs/superpowers/specs/2026-07-12-separator-as-slot-
				// design.md), a rule-shaped separator's per-instance kind is
				// captured on the wire (`_separator_kind`) and resynthesized at
				// render time from a compile-time KindId→literal match — so one
				// shared rule can correctly preserve either delimiter, unlike the
				// old comma/semi split this replaces (which needed two rules only
				// because the previous model could store just one compile-time-
				// constant separator string per rule). This also lets a genuinely
				// mixed-delimiter instance (`{ a, b; c }`, legal upstream) parse
				// and round-trip instead of hitting an ERROR node, though a mixed
				// instance's per-gap delimiter choice isn't individually preserved
				// (`_separator_kind` assumes a uniform separator — out of scope,
				// see the design doc).
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
