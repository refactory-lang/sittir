/**
 * grammar.sittir.ts — Grammar extension for typescript
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import {
	field,
	alias,
	refine,
	variant,
	preference,
	regex,
	prec,
	token,
	reauthored,
	vocabulary,
	sittirGrammar
} from '../codegen/src/dsl/dsl-authoring.ts';


export default sittirGrammar(base, {
	resolutions,
	name: 'typescript',
	groups: {
		jsx_opening_element_content: ($) =>
			seq(
				choice(field('name', choice($._jsx_identifier, $.jsx_namespace_name)), $.jsx_start_opening_element_arm),
				repeat(field('attribute', $._jsx_attribute))
			)
	},
	options: {
		indent: preference('  '),
		body: { before: preference('indent'), after: preference('dedent') },
		case_body: { start: preference('indent'), end: preference('dedent') },
		gap: { separator: preference('newline') },
		number_hex: { 'prefix:': preference('0x') },
		number_octal: { 'prefix:': preference('0o') },
		number_binary: { 'prefix:': preference('0b') },
		number_float_point: { 'marker:': preference('e') },
		number_float_leading_point: { 'marker:': preference('e') },
		number_float_scientific: { 'marker:': preference('e') },
		statements: { terminator: preference(';') },
		quotes: { style: preference('double') },
		enum_body_elements: {
			'element:/separator/","/after': preference('newline'),
			'element:/delimiter': preference('Delimiter.Trailing')
		},
		program: { 'statements:/separator': preference('tight'), 'statements:/(_)/after': preference('blankline') },

		_: {
			'decorator:/separator': preference('tight'),
			'decorator:/(_)/after': preference('newline'),
			'decorator:/end': preference('newline'),
			'"("/before': preference('tight'),
			'"("/after': preference('tight'),
			'")"/before': preference('tight'),
			'"["/before': preference('tight'),
			'"["/after': preference('tight'),
			'"]"/before': preference('tight'),
			'"{"/after': preference('tight'),
			'"}"/before': preference('tight'),
			'"${"/after': preference('tight'),
			'"<"/before': preference('tight'),
			'"<"/after': preference('tight'),
			'">"/before': preference('tight'),
			'"."/before': preference('tight'),
			'"."/after': preference('tight'),
			'","/before': preference('tight'),
			'";"/before': preference('tight'),
			'"++"/before': preference('tight'),
			'"++"/after': preference('tight'),
			'"--"/before': preference('tight'),
			'"--"/after': preference('tight'),
			'"?."/before': preference('tight'),
			'"?."/after': preference('tight'),
			'"..."/after': preference('tight'),
			'":"/before': preference('tight'),
			'":"/after': preference('space'),
			'"="/before': preference('space'),
			'"="/after': preference('space'),
			'"=>"/before': preference('space'),
			'"=>"/after': preference('space'),
			'"|"/before': preference('space'),
			'"|"/after': preference('space'),
			'"&"/before': preference('space'),
			'"&"/after': preference('space'),
			'operator:/before': preference('space'),
			'operator:/after': preference('space'),
			'_/separator/","/before': preference('tight')
		},

		// A space after the substitution's `}` changes the template text. The edge
		// sits in every string-interior context, so no neighbour immediacy reaches it.
		template_substitution: { after: preference('tight') },
		template_type: { after: preference('tight') },

		literal_type_negative_number: { 'operator:/after': preference('tight') },
		unary_expression: { 'operator:/after': preference('tight') },
		update_expression_postfix: { 'operator:/before': preference('tight') },
		update_expression_prefix: { 'operator:/after': preference('tight') },

		object_type_content: {
			'members:/separator/before': preference('tight'),
			'members:/separator/after': preference('newline'),
			'members:/separator/kind': preference('semi'),
			'members:/delimiter': preference('Delimiter.Trailing')
		},

		statement_block: { before: preference('space') },
		class_body: { before: preference('space') },
		switch_body: { before: preference('space') },
		named_imports: { before: preference('space'), after: preference('space') },
		import_specifiers: { 'import_specifier:/start': preference('space'), 'import_specifier:/end': preference('space') },
		export_clause: { before: preference('space'), after: preference('space') },
		export_specifiers: { 'export_specifier:/start': preference('space'), 'export_specifier:/end': preference('space') },
		object: { 'properties:/start': preference('space'), 'properties:/end': preference('space') },
		object_pattern: { 'properties:/start': preference('space'), 'properties:/end': preference('space') },
		ternary_expression: { '":"/before': preference('space') },
		for_statement: { '"("/before': preference('space'), '";"/after': preference('space') },
		lexical_declaration: { after: preference('space') },
		variable_declaration: { after: preference('space') },
		required_parameter: { 'decorator:/(_)/after': preference('space'), 'decorator:/end': preference('space') },
		optional_parameter: { 'decorator:/(_)/after': preference('space'), 'decorator:/end': preference('space') },

		_bindings: {
			'_/terminator:': 'statements/terminator',
			'_/automatic_semicolon:': 'statements/terminator',
			'string/variant': 'quotes/style',
			'class_body/"{"/after': 'body/before',
			'class_body/"}"/before': 'body/after',
			'statement_block/"{"/after': 'body/before',
			'statement_block/"}"/before': 'body/after',
			'switch_body/"{"/after': 'body/before',
			'switch_body/"}"/before': 'body/after',
			'enum_body/"{"/after': 'body/before',
			'enum_body/"}"/before': 'body/after',
			'object_type/opening:/after': 'body/before',
			'object_type/closing:/before': 'body/after',
			'switch_case/body:/start': 'case_body/start',
			'switch_case/body:/end': 'case_body/end',
			'switch_default/body:/start': 'case_body/start',
			'switch_default/body:/end': 'case_body/end',
			'class_body/members:/separator': 'gap/separator',
			'statement_block/statements:/separator': 'gap/separator',
			'switch_body/cases:/separator': 'gap/separator',
			'switch_case/body:/separator': 'gap/separator',
			'switch_default/body:/separator': 'gap/separator'
		}
	},

	patches: {
		decorator: { 1: field('expression') },
		decorator_parenthesized_expression: { 1: field('expression') },
		asserts: { 1: field('value') },
		type_query: { 1: field('expression') },
		comment: {
			'1/0/1': regex(/([^*]|\*+[^*\/])*\**/),
			'1/0/2': { type: 'STRING', value: '*/' } as never,
			0: variant('line'),
			1: variant('block')
		},
		literal_type: { 0: variant('negative_number') },
		number: {
			'1/0/0': field('integer'),
			'1/0/2': field('fraction'),
			'1/0/3/0/0': field('marker'),
			'1/0/3/0/1/0': field('sign'),
			'1/0/3/0/1/1': field('exponent'),
			'2/0/1': field('fraction'),
			'2/0/2/0/0': field('marker'),
			'2/0/2/0/1/0': field('sign'),
			'2/0/2/0/1/1': field('exponent'),
			'3/0/0': field('integer'),
			'3/0/1/0': field('marker'),
			'3/0/1/1/0': field('sign'),
			'3/0/1/1/1': field('exponent'),
			0: variant('hex'),
			1: variant('float_point'),
			2: variant('float_leading_point'),
			3: variant('float_scientific'),
			4: variant('decimal', { default: true }),
			5: variant('binary'),
			6: variant('octal'),
			7: variant('bigint'),
			'7/0': variant('hex'),
			'7/1': variant('binary'),
			'7/2': variant('octal'),
			'7/3': variant('decimal', { default: true })
		},
		hash_bang_line: { '.': regex(/#!(?<content>.*)/) },
		binary_expression: {
			24: variant('in')
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
		object_type: {},
		enum_body: {},

		jsx_expression: {
			1: field('expression')
		},

		// Patch sets apply in order. The second fields the member repeat
		// AFTER the arm-level paths of the first resolve against the
		// un-fielded shape: with the stray `';'` arm minted as its own kind
		// `empty_member`, every element — members and stray semicolons
		// alike — keys into one ordered `_members` array. The third's
		// variant paths then traverse the `members` field the second added.
		class_body: [
			{
				'1/0/4': alias('empty_member'),
				'1/0/0/2': field('terminator'),
				'1/0/1/1': field('terminator'),
				'1/0/3/0': field('member'),
				'1/0/3/1': field('terminator')
			},
			{ 1: field('members') },
			{
				'1/members:/0/0': variant('method'),
				'1/members:/0/1': variant('method_sig'),
				'1/members:/0/3': variant('declaration')
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

		jsx_namespace_name: { 0: field('namespace'), 2: field('name') },

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
			'5/0': field('accessor_kind'),
			'7/0': field('optional_marker')
		},

		method_signature: {
			'5/0': field('accessor_kind'),
			'7/0': field('optional_marker')
		},

		property_signature: {
			'5/0': field('optional_marker')
		},

		satisfies_expression: {
			2: field('type_annotation')
		},

		statement_block: {
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

		yield_expression: [{ '1/0': variant('delegate') }, { 1: field('expression') }],
		_type_query_subscript_expression: { '1/0': alias('optional_chain_marker') },

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

		function_signature: {
			4: field('terminator')
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
		// `export_statement_default`'s body is a top-level choice of
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

		string: [
			{ '0/2': token.immediate('"'), '1/2': token.immediate("'") },
			{ 0: variant('double'), 1: variant('single') }
		],
		template_string: { 2: token.immediate('`') },
		template_literal_type: { 2: token.immediate('`') },
		template_type: { 0: token.immediate('${'), 1: field('type') },
		template_substitution: { 0: token.immediate('${'), 1: field('expression') },

		update_expression: {
			0: variant('postfix', { default: true }),
			1: variant('prefix')
		},

		arrow_function: { '1/0': variant('parameter') },

		class_heritage: { '0': variant('extends_clause'), '1': variant('implements_clause') },

		extends_clause: { '1/0': alias('extends_clause_single'), '1/1/0/1': alias('extends_clause_single') },

		import_clause: {
			'0': variant('namespace_import'),
			'1': variant('named_imports'),
			'2': variant('default_import')
		},

		export_statement_default: {
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
		export_statement_namespace_export: { 3: field('name'), 4: field('terminator') },
		export_statement_type_export: { 4: field('terminator') },
		export_statement_equals_export: { 3: field('terminator') },

		_for_header: {
			'1/0': variant('lhs'),
			'1/1': variant('var_kind'),
			'1/2': variant('let_const_kind')
		}
	},
	extras: ($, previous) => [...(previous ?? [])],
	visibleExternals: (_$) => ({
		_automatic_semicolon: string('\n'),
		_function_signature_automatic_semicolon: string('\n'),
	}),

	expectTestFailures: {
		debugger_statement: '#170 — _resolveOneLeaf cannot resolve the _semicolon stub',
		import_require_clause: '#170 — Missing field _content on ImportRequireClauseTransport._source',
		object_type_content: '#170 (#172-adjacent) — Missing field _content through export-arm transport',
		string: '#170 — StringContentTransportSlot rejects stub ($type property missing)'
	},
	expectDiagnostics: {
		'unclassifiable-shape': ['binary_expression', 'public_field_definition'],
		'union-slot-mixed-row': ['binary_expression'],
		'rule-reauthored-without-cause': ['object_type']
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
		// The signature arm of an arrow function is upstream's hidden
		// `_call_signature`, whose fields inline into the parent. Upstream
		// typescript already declares that body as the visible kind
		// `call_signature`, so the arm references that kind directly:
		// storage and parse are one symbol, the arm seats through the
		// existing factory, and no per-parent form kind is minted for a
		// body that has a name of its own. Positions are unchanged, so the
		// `parameter` polymorph path above stays valid.
		arrow_function: reauthored('alias-shape', ($, original) => ({
			...original,
			members: original.members.map((m: object, i: number) =>
				i === 1
					? {
							...m,
							members: (m as { members: unknown[] }).members.map((arm, j) => (j === 1 ? $.call_signature : arm))
						}
					: m
			)
		})),

		ambient_declaration_global: vocabulary(($) => seq('global', field('body', $.statement_block))),
		ambient_declaration_module: vocabulary(($) =>
			prec.right(
				seq(
					'module',
					'.',
					field('name', alias($.identifier, $.property_identifier)),
					':',
					field('type', $.type),
					optional(field('terminator', $._semicolon))
				)
			)
		),
		object_type: reauthored('ambiguity', ($) =>
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
			)
		),

		object_type_content: vocabulary(($) => {
			const SEP = () => choice(',', ';');
			const member = choice(
				$.export_statement,
				$.property_signature,
				$.call_signature,
				$.construct_signature,
				$.index_signature,
				$.method_signature
			);
			return seq(
				optional(SEP()),
				seq(field('members', member), repeat(seq(SEP(), field('members', member)))),
				optional(SEP())
			);
		})
	},
	renderAs: (_$) => ({
		html_comment: /<!--[\s\S]*?-->/,
		jsx_text: /[^{}<>]+/,
		_template_chars: token.immediate(/[^`\\$]+/)
	})
});
