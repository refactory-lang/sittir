/**
 * grammar.sittir.ts — Grammar extension for python
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import type { AuthoringRule } from '../codegen/src/grammar-shapes/grammar-json.ts';
import {
	role,
	field,
	alias,
	variant,
	preference,
	rule,
	prec,
	token,
	spellings,
	reauthored,
	vocabulary,
	enrich,
	wire,
	edit
} from '../codegen/src/dsl/dsl-authoring.ts';

const ANY_CASE_EITHER_ORDER = { case: true, order: true } as const;

const INTERPOLATING = { ...ANY_CASE_EITHER_ORDER, interpolating: true } as const;

const STRING_PREFIXES = {
	r: ANY_CASE_EITHER_ORDER,
	b: ANY_CASE_EITHER_ORDER,
	f: INTERPOLATING,
	t: INTERPOLATING,
	u: ANY_CASE_EITHER_ORDER,
	rb: ANY_CASE_EITHER_ORDER,
	rf: INTERPOLATING,
	rt: INTERPOLATING,
	ur: { case: true, readOnly: true }
} as const;

const STRING_QUOTES = { '"': { singleLine: true }, "'": { singleLine: true }, '"""': {}, "'''": {}, '`': { readOnly: true } } as const;

const STRING_ESCAPE = { escape: '\\' } as const;

const comprehensionClauses = rule('comprehension_clauses', ($) =>
	field('content', repeat1(choice($.for_in_clause, $.if_clause)))
);

function tupleElements(element: AuthoringRule) {
	return seq(seq(element, ','), repeat(seq(element, ',')), optional(element));
}

const MATCH_BLOCK_WITNESSES = [
	{
		text: 'match x:\n',
		form: ['match', { symbol: 'expression' }, ':', { symbol: '_newline' }],
		kind: 'match_statement',
		production: 'CPython match_stmt: "match" subject_expr \':\' NEWLINE INDENT case_block+ DEDENT'
	}
] as const;

const TYPE_PARAM_PRODUCTION = 'CPython type_params: "[" ",".type_param+ [","] "]"; type_param: NAME [type_param_bound] | "*" NAME | "**" NAME';

const FUNCTION_TYPE_PARAMS_WITNESSES = [
	{
		text: 'def f[1](): pass\n',
		form: ['def', { symbol: 'identifier' }, { symbol: 'type_parameter' }, { symbol: 'parameters' }, ':', { symbol: '_suite' }],
		kind: 'function_definition',
		production: TYPE_PARAM_PRODUCTION
	},
	{
		text: 'def f[int[str]](): pass\n',
		form: ['def', { symbol: 'identifier' }, { symbol: 'type_parameter' }, { symbol: 'parameters' }, ':', { symbol: '_suite' }],
		kind: 'function_definition',
		production: TYPE_PARAM_PRODUCTION
	}
] as const;

const CLASS_TYPE_PARAMS_WITNESSES = [
	{
		text: 'class C[a.b]: pass\n',
		form: ['class', { symbol: 'identifier' }, { symbol: 'type_parameter' }, ':', { symbol: '_suite' }],
		kind: 'class_definition',
		production: TYPE_PARAM_PRODUCTION
	}
] as const;

const SPLAT_TYPE_PRODUCTION = 'CPython starred_expression: "*" expression; star_annotation: ":" star_expression; no type takes "**"';

const SPLAT_TYPE_WITNESSES = [
	{ text: 'x: tuple[int, **P]\n', form: ['**', { symbol: 'identifier' }], kind: 'splat_type', production: SPLAT_TYPE_PRODUCTION },
	{ text: 'def f(**kw: **P): pass\n', form: ['**', { symbol: 'identifier' }], kind: 'splat_type', production: SPLAT_TYPE_PRODUCTION },
	{ text: 'x: Callable[**P, int]\n', form: ['**', { symbol: 'identifier' }], kind: 'splat_type', production: SPLAT_TYPE_PRODUCTION }
] as const;

const TYPE_ALIAS_WITNESSES = [
	{
		text: 'type a.b = int\n',
		form: ['type', { symbol: 'type' }, '=', { symbol: 'type' }],
		kind: 'type_alias_statement',
		production: 'CPython type_alias: "type" NAME [type_params] "=" expression'
	}
] as const;

export default grammar(enrich(base), wire({
	resolutions,
	name: 'python',
	supertypes: ($, previous) => [...(previous ?? []), $._statement!],
	externals: ($, prev) => {
		role($._indent, 'indent');
		role($._dedent, 'dedent');
		role($._newline, 'newline');
		return prev ?? [];
	},
	visibleExternals: (_$) => ({
		_indent: indent(),
		_dedent: dedent()
	}),
	inline: ($, previous) => [...(previous ?? []), $._except_clause_exception_as_optional1],

	// See docs/python-grammar-sittir-glossary.md::renderAs
	renderAs: (_$) => ({
		string_start: token(seq(field('prefix', optional(spellings(STRING_PREFIXES))), field('quote', spellings(STRING_QUOTES, STRING_ESCAPE)))),
		_string_content: token.immediate(/[\s\S]+/),
		escape_interpolation: token.immediate(/\{\{|\}\}/),
		string_end: token.immediate(seq(field('content', /(?:\\[\s\S])*/), field('quote', spellings(STRING_QUOTES, STRING_ESCAPE))))
	}),
	reparseHosts: {
		hosts: {
			expression: '_ = ($r)',
			type: '_: $r = None',
			pattern: 'for $r in _: pass',
			_simple_statement: '$r',
			_compound_statement: '$r',
			expression_statement: '$r',
			assignment: '$r',
			function_definition: '$r',
			parameters: 'def _f$r:\n    pass',
			parameters_elements: 'def _f($r):\n    pass',
			argument_list: '_f$r',
			dotted_name: 'import $r',
			list_splat: '_f($r)',
			list_splat_pattern: '$r = (1,)',
			attribute: '[$r]',
			subscript: '[$r]',
			parenthesized_expression: 'f($r)'
		}
	},
	groups: {
		comparison_operator_comparator: ($) =>
			seq(
				field(
					'operators',
					choice(
						'<',
						'<=',
						'==',
						'!=',
						'>=',
						'>',
						'<>',
						'in',
						alias($._not_in, 'not in'),
						'is',
						alias($._is_not, 'is not')
					)
				),
				$.primary_expression
			),
		yield_from_clause: ($) => seq('from', $.expression)
	},
	options: {
		decorator: { '"@"/after': preference('tight') },
		indent: preference('    '),
		gap: { separator: preference('tight') },
		string_start: { 'quote:': preference('"') },
		integer_hex: { 'radix_prefix:': preference('0x') },
		integer_octal: { 'radix_prefix:': preference('0o') },
		integer_binary: { 'radix_prefix:': preference('0b') },
		float_point: { 'marker:': preference('e') },
		float_leading_point: { 'marker:': preference('e') },
		float_scientific: { 'marker:': preference('e') },
		for_in_clause: { 'trailing_comma:': preference('blank') },
		module: {
			'statements:/separator': preference('tight'),
			'statements:/(function_definition)/after': preference('double_blankline'),
			'statements:/(class_definition)/after': preference('double_blankline'),
			'statements:/(decorated_definition)/after': preference('double_blankline')
		},

		_: {
			'"("/before': preference('tight'),
			'"("/after': preference('tight'),
			'")"/before': preference('tight'),
			'"["/before': preference('tight'),
			'"["/after': preference('tight'),
			'"]"/before': preference('tight'),
			'"{"/after': preference('tight'),
			'"}"/before': preference('tight'),
			'"."/before': preference('tight'),
			'"."/after': preference('tight'),
			'","/before': preference('tight'),
			'_/separator/","/before': preference('tight'),
			'_/separator/";"/before': preference('tight'),
			'":"/before': preference('tight'),
			'":"/after': preference('space'),
			'"->"/before': preference('space'),
			'"->"/after': preference('space'),
			'"="/before': preference('space'),
			'"="/after': preference('space'),
			'":="/before': preference('space'),
			'":="/after': preference('space'),
			'operator:/before': preference('space'),
			'operator:/after': preference('space'),
			'operators:/after': preference('space')
		},
		keyword_argument: { '"="/before': preference('tight'), '"="/after': preference('tight') },
		default_parameter: { '"="/before': preference('tight'), '"="/after': preference('tight') },
		keyword_pattern: { '"="/before': preference('tight'), '"="/after': preference('tight') },
		slice: { '":"/before': preference('tight'), '":"/after': preference('tight') },
		except_clause: { 'group:/before': preference('tight'), 'group:/after': preference('space') },
		splat_pattern_list: { '"*"/after': preference('tight') },
		splat_pattern_dictionary: { '"**"/after': preference('tight') },
		list_splat: { '"*"/after': preference('tight') },
		list_splat_pattern: { '"*"/after': preference('tight') },
		dictionary_splat: { '"**"/after': preference('tight') },
		dictionary_splat_pattern: { '"**"/after': preference('tight') },
		splat_type: { '"*"/after': preference('tight') },
		type_param_type_var_tuple: { '"*"/after': preference('tight') },
		type_param_param_spec: { '"**"/after': preference('tight') },
		unary_operator: { 'operator:/after': preference('tight') },
		interpolation: {
			before: preference('tight'),
			after: preference('tight'),
			'debug:/before': preference('tight'),
			'debug:/after': preference('tight')
		},
		comprehension_clauses: { 'content:/separator': preference('space') },
		comparison_operator: { 'comparators:/separator': preference('space') },
		concatenated_string: { 'string:/separator': preference('space') },
		union_pattern: { '"|"/after': preference('space') },
		union_type: { '"|"/after': preference('space') },
		simple_pattern_negative: { '"-"/after': preference('tight') },
		complex_pattern: { 'sign:/after': preference('tight') },
		chevron: { '">>"/after': preference('space'), after: preference('tight') },

		_labels: {
			'block/statements:/separator': 'gap/separator',
			'decorated_definition/decorator:/separator': 'gap/separator',
			'if_statement/alternative:/separator': 'gap/separator',
			'match_block/alternative:/separator': 'gap/separator',
			'try_statement/except_clauses:/separator': 'gap/separator'
		}
	},

	edits: {
		parenthesized_list_splat: { 1: field('content') },
		list_splat_pattern: { 1: field('target') },
		dictionary_splat_pattern: { 1: field('target') },
		typed_parameter: { 0: field('name') },
		parenthesized_expression: { 1: field('expression') },
		// See docs/python-grammar-sittir-glossary.md::case_pattern
		case_pattern: { 0: alias('case_as_pattern') },
		// See docs/python-grammar-sittir-glossary.md::comprehension_clauses
		list_comprehension: [{ 2: comprehensionClauses }, { 2: field('clauses') }],
		dictionary_comprehension: [{ 2: comprehensionClauses }, { 2: field('clauses') }],
		set_comprehension: [{ 2: comprehensionClauses }, { 2: field('clauses') }],
		generator_expression: [{ 2: comprehensionClauses }, { 2: field('clauses') }],
		integer: {
			'0/0/0': field('radix_prefix'),
			'1/0/0': field('radix_prefix'),
			'2/0/0': field('radix_prefix'),
			0: variant('hex'),
			1: variant('octal'),
			2: variant('binary'),
			3: variant('decimal', { default: true }),
			'3/0': variant('long'),
			'3/1': variant('imaginary'),
			'3/2': variant('plain', { default: true })
		},
		float: {
			'0/0/0/0': field('integer'),
			'0/0/0/2': field('fraction'),
			'0/0/0/3/0/0': seq(field('marker', choice('e', 'E')), field('exponent_sign', optional(choice('-', '+')))),
			'0/0/0/3/0/1': field('exponent'),
			'0/0/1': field('imaginary'),
			'1/0/0/0': field('integer'),
			'1/0/0/2': field('fraction'),
			'1/0/0/3/0/0': seq(field('marker', choice('e', 'E')), field('exponent_sign', optional(choice('-', '+')))),
			'1/0/0/3/0/1': field('exponent'),
			'1/0/1': field('imaginary'),
			'2/0/0/0': field('integer'),
			'2/0/0/1/0': seq(field('marker', choice('e', 'E')), field('exponent_sign', optional(choice('-', '+')))),
			'2/0/0/1/1': field('exponent'),
			'2/0/1': field('imaginary'),
			0: variant('point', { default: true }),
			1: variant('leading_point'),
			2: variant('scientific')
		},
		escape_sequence: {
			0: variant('unicode_fixed'),
			1: variant('unicode_wide'),
			2: variant('hex'),
			3: variant('octal'),
			4: variant('line_break'),
			5: variant('simple', { default: true }),
			6: variant('named')
		},
		line_continuation: {
			0: variant('newline', { default: true }),
			1: variant('nul')
		},
		// See docs/python-grammar-sittir-glossary.md::parameters
		parameters: [{ '1/0': alias('parameters_elements') }, { '1/0': field('elements') }],
		lambda_parameters: {
			'.': alias('parameters_elements')
		},
		set: {
			1: alias('collection_elements')
		},

		argument_list: {
			1: field('arguments')
		},

		class_pattern: {
			0: field('name'),
			2: field('arguments')
		},

		comparison_operator: {
			0: field('left'),
			1: field('comparators')
		},

		complex_pattern: {
			0: field('sign'),
			1: field('real'),
			2: field('operator'),
			3: field('imaginary')
		},

		conditional_expression: {
			0: field('body'),
			2: field('condition'),
			4: field('alternative')
		},

		// See docs/python-grammar-sittir-glossary.md::_simple_pattern
		_simple_pattern: [
			{ '11': ($) => choice($.integer, $.float, seq('-', field('value', choice($.integer, $.float)))) },
			{ '11/2': variant('negative') }
		],

		constrained_type: {
			0: field('base_type'),
			2: field('constraint')
		},

		decorator: {
			2: field('newline')
		},

		dictionary: {
			1: field('elements')
		},

		except_clause: [
			{ '1/0': field('group') },
			{ '2/0/0': variant('as'), '2/0/1': variant('list') },
			{ '2/0': variant('exception') },
			{ 2: field('exception'), 4: field('body') }
		],

		exec_statement: {
			2: field('in_clause')
		},

		for_in_clause: {
			'5/0': field('trailing_comma')
		},

		finally_clause: {
			2: field('block')
		},

		generic_type: {
			0: field('name')
		},

		// See docs/python-grammar-sittir-glossary.md::import_from_statement
		import_from_statement: [
			{ '3/2': alias('parenthesized_import_list') }
		],
		future_import_statement: { '3/1': alias('parenthesized_import_list') },
		// See docs/python-grammar-sittir-glossary.md::_parenthesized_import_list
		_parenthesized_import_list: { 1: alias('import_list') },

		interpolation: {
			'2/0': field('debug')
		},

		keyword_pattern: {
			0: field('name'),
			2: field('value')
		},

		member_type: {
			0: field('base_type'),
			2: field('name')
		},

		slice: {
			0: field('start'),
			2: field('stop'),
			3: field('step')
		},

		splat_pattern: {
			'0/0': variant('list'),
			'0/1': variant('dictionary'),
			1: field('name')
		},

		string: {
			1: field('content')
		},
		format_specifier: [{ '1/0/0': token.immediate(prec(1, /[^{}\n]+/)) }, { '1/0': field('elements') }],

		try_statement: {
			3: field('except_clauses')
		},

		union_type: {
			0: field('left'),
			2: field('right')
		},

		relative_import: { 0: field('dots'), '1/0': field('name') },
		global_statement: { 1: field('names') },
		nonlocal_statement: { 1: field('names') },
		dotted_name: {
			0: ($) => field('qualifier', optional(seq($.dotted_name, '.'))),
			1: ($) => field('name', $.identifier)
		},
		union_pattern: { 0: field('left'), 1: ($) => seq('|', field('right', $._simple_pattern)) },
		if_clause: { 1: field('condition') },
		await: { 1: field('expression') },

		assignment: { '1/0': variant('eq'), '1/1': variant('type'), '1/2': variant('typed') },

		expression_statement: {
			1: variant('tuple')
		},

		with_clause: {
			0: variant('bare', { default: true }),
			1: variant('paren')
		},

		// See docs/python-grammar-sittir-glossary.md::_suite
		_suite: { 0: variant('inline'), 1: variant('block', { default: true }), 2: variant('empty') }
	},
	expectDiagnostics: {
		'patch-without-cause': [
			'dictionary_comprehension',
			'generator_expression',
			'list_comprehension',
			'set_comprehension'
		],
		'rule-reauthored-without-cause': [
			'_simple_pattern',
			'primary_expression',
			'print_statement',
			'string_content'
		]
	},
	rules: {
		_match_block: reauthored('accepts-invalid-syntax', MATCH_BLOCK_WITNESSES, ($, original) => original.members[0]),
		function_definition: reauthored('accepts-invalid-syntax', FUNCTION_TYPE_PARAMS_WITNESSES, ($, original) =>
			edit(original, { 3: field('type_parameters', optional($.type_params)) })
		),
		class_definition: reauthored('accepts-invalid-syntax', CLASS_TYPE_PARAMS_WITNESSES, ($, original) =>
			edit(original, { 2: field('type_parameters', optional($.type_params)) })
		),
		type_param: vocabulary(($) =>
			choice(
				variant('type_var', seq(field('name', $.identifier), optional($._type_param_optional1))),
				variant('type_var_tuple', seq('*', field('name', $.identifier))),
				variant('param_spec', seq('**', field('name', $.identifier)))
			)
		),
		_type_param_optional1: vocabulary(($) => seq(':', $.type)),
		type_params: vocabulary(($) => seq('[', field('items', $.type_params_items), ']')),
		type_params_items: vocabulary(($) =>
			seq(field('item', $.type_param), repeat(seq(',', field('item', $.type_param))), optional(','))
		),
		splat_type: reauthored('accepts-invalid-syntax', SPLAT_TYPE_WITNESSES, ($) => prec(1, seq('*', field('name', $.identifier)))),
		type_alias_statement: reauthored('accepts-invalid-syntax', TYPE_ALIAS_WITNESSES, ($) =>
			prec.dynamic(1, seq('type', field('name', $.identifier), optional(field('type_parameters', $.type_params)), '=', field('value', $.type)))
		),
		_tuple_pattern_elements: vocabulary(($) => tupleElements(field('item', $.pattern))),
		tuple_pattern: reauthored(
			'semantic-gap',
			[{ text: '(x) = y\n', form: ['(', { symbol: 'pattern' }, ')'], kind: 'tuple_pattern', meaning: 'Binds the entire value, rather than unpacking a one-element tuple (#550).' }],
			($, original) => edit(original, { 1: field('elements', optional(alias($._tuple_pattern_elements, $.tuple_pattern_elements))) })
		),
		case_pattern_list: vocabulary(($) => tupleElements(field('item', $.case_pattern))),
		case_clause: reauthored(
			'semantic-gap',
			[
				{
					text: 'match x:\n    case a,:\n        pass\n',
					form: ['case', { symbol: 'case_pattern' }, ',', ':', { symbol: '_suite' }],
					kind: 'case_clause',
					meaning: 'Matches a one-element sequence, rather than capturing the whole value as the case without the comma does.'
				}
			],
			($) =>
				seq(
					'case',
					field('pattern', choice($.case_pattern, $.case_pattern_list)),
					optional(field('guard', $.if_clause)),
					':',
					field('consequence', $._suite)
				)
		),
		// See docs/python-grammar-sittir-glossary.md::tuple
		_tuple_elements: vocabulary(($) => tupleElements(field('item', choice($.expression, $.yield, $.list_splat, $.parenthesized_list_splat)))),
		tuple: reauthored(
			'accepts-other-kind',
			[{ text: '(a)', form: ['(', { symbol: 'expression' }, ')'], kind: 'parenthesized_expression' }],
			($) => seq('(', optional(field('elements', alias($._tuple_elements, $.tuple_elements))), ')')
		),
		// See docs/python-grammar-sittir-glossary.md::primary_expression
		primary_expression: reauthored('ambiguity', ($, original) => {
			let base = original.members;

			return choice(...base.slice(0, -1), prec.dynamic(-1, $.list_splat_pattern));
		}),
		except_clause_exception_as: vocabulary(($) =>
			seq(field('value', $.expression), optional($._except_clause_exception_as_optional1))
		),
		_except_clause_exception_as_optional1: vocabulary(($) => seq('as', field('alias', $.expression))),

		// See docs/python-grammar-sittir-glossary.md::string_content
		string_content: reauthored('alias-shape', ($) =>
			prec.right(
				field(
					'elements',
					repeat1(
						choice(
							$.escape_interpolation,
							$.escape_sequence,
							alias($._not_escape_sequence, $.not_escape_sequence),
							alias($._string_content, $.string_fragment)
						)
					)
				)
			)
		),

		// See docs/python-grammar-sittir-glossary.md::format_specifier
		// See docs/python-grammar-sittir-glossary.md::case_tuple_pattern
		case_tuple_pattern: vocabulary(($) => seq('(', optional(field('elements', $.list_pattern_case_patterns)), ')')),
		case_list_pattern: vocabulary(($) => seq('[', optional(field('elements', $.list_pattern_case_patterns)), ']')),

		_print_arguments: vocabulary(($) =>
			seq(field('item', $.expression), repeat(seq(',', field('item', $.expression))), optional(','))
		),
		_print_chevron_arguments: vocabulary(($) =>
			seq(repeat1(seq(',', field('item', $.expression))), optional(','))
		),
		print_statement_chevron: vocabulary(($) =>
			seq('print', field('chevron', $.chevron), optional(alias($._print_chevron_arguments, $.print_chevron_arguments)))
		),
		print_statement_plain: vocabulary(($) => seq('print', alias($._print_arguments, $.print_arguments))),
		print_statement: reauthored('alias-shape', ($) =>
			choice(prec(1, $.print_statement_chevron), prec(-3, prec.dynamic(-1, $.print_statement_plain)))
		),
		// See docs/python-grammar-sittir-glossary.md::_simple_pattern
		_simple_pattern: reauthored('alias-shape', ($) =>
			prec(
				1,
				choice(
					$.class_pattern,
					$.splat_pattern,
					$.union_pattern,
					$.case_list_pattern,
					$.case_tuple_pattern,
					$.dict_pattern,
					$.string,
					$.concatenated_string,
					$.true,
					$.false,
					$.none,
					seq(optional('-'), choice($.integer, $.float)),
					$.complex_pattern,
					$.dotted_name,
					alias($._wildcard_pattern, $.wildcard_pattern)
				)
			)
		),

		_wildcard_pattern: vocabulary(($) => '_')
	}
}));
