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
import type { AuthoringRule, ChoiceRule, GrammarRule, SymbolRule } from '../codegen/src/grammar-shapes/grammar-json.ts';
import {
	field,
	alias,
	refine,
	variant,
	preference,
	regex,
	prec,
	reserved,
	token,
	reauthored,
	vocabulary,
	copy,
	edit,
	replace,
	enrich,
	wire
} from '../codegen/src/dsl/dsl-authoring.ts';


const AUTO_ACCESSOR_RULING = 'An auto-accessor takes no declare, readonly or ?: its arm admits an accessibility modifier, static, abstract and override, then accessor.';

const PUBLIC_FIELD_DEFINITION_ACCEPTED = [
	{ text: 'export abstract class A { abstract accessor x: number; }\n', form: ['abstract', 'accessor', { symbol: 'identifier' }, { symbol: 'type_annotation' }], kind: 'public_field_definition' },
	{ text: 'export class A { static accessor y: number; }\n', form: ['static', 'accessor', { symbol: 'identifier' }, { symbol: 'type_annotation' }], kind: 'public_field_definition' }
] as const;

const PUBLIC_FIELD_DEFINITION_NARROWED = [
	{ text: 'export class A { declare accessor x: number; }\n', form: ['declare', 'accessor', { symbol: 'identifier' }, { symbol: 'type_annotation' }], kind: 'public_field_definition', ruling: AUTO_ACCESSOR_RULING },
	{ text: 'export class A { accessor x?: number; }\n', form: ['accessor', { symbol: 'identifier' }, '?', { symbol: 'type_annotation' }], kind: 'public_field_definition', ruling: AUTO_ACCESSOR_RULING }
] as const;

const METHOD_DEFINITION_WITNESSES = [
	{ text: 'export class A { get x(a: number): number { return a; } }\n', form: ['get', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'type_annotation' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 MethodDefinition: get ClassElementName ( )' },
	{ text: 'export class A { set y() {} }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 MethodDefinition: set ClassElementName ( PropertySetParameterList ), one FormalParameter' },
	{ text: 'export class A { set y(a: number, b: number) {} }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 PropertySetParameterList: FormalParameter' },
	{ text: 'export class A { set y(...a: number[]) {} }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 PropertySetParameterList: FormalParameter, not FunctionRestParameter' },
	{ text: 'export class A { set y(a?: number) {} }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 4.5 SetAccessor: set PropertyName ( BindingIdentifierOrPattern TypeAnnotation? )' },
	{ text: 'export class A { set y(a = 1) {} }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 4.5 SetAccessor has no Initializer (ECMAScript allows one)' },
	{ text: 'export const o = { get x(a: number) { return a; } };\n', form: ['get', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 MethodDefinition: get ClassElementName ( )' },
	{ text: 'export const o = { set y() {} };\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 PropertySetParameterList: FormalParameter' },
	{ text: 'export class A { get x<T>(): number { return 1; } }\n', form: ['get', { symbol: 'identifier' }, { symbol: 'type_parameters' }, { symbol: 'formal_parameters' }, { symbol: 'type_annotation' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 4.5 GetAccessor: get PropertyName ( ) TypeAnnotation?' },
	{ text: 'export class A { set x(v: number): void {} }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'type_annotation' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 4.5 SetAccessor has no TypeAnnotation after the parameters' },
	{ text: 'export class A { async get x() { return 1; } }\n', form: ['async', 'get', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'ECMAScript 15.4 and 15.8 AsyncMethod: no production joins async and get' },
	{ text: 'export class A { get x?() { return 1; } }\n', form: ['get', { symbol: 'identifier' }, '?', { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 4.5 GetAccessor: get PropertyName ( ), no ? after the name' },
	{ text: 'export class A { readonly get x() { return 1; } }\n', form: ['readonly', 'get', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 8.4.3 MemberAccessorDeclaration: AccessibilityModifier? static? GetAccessor' },
	{ text: 'export class A { set x?(v) {} }\n', form: ['set', { symbol: 'identifier' }, '?', { symbol: 'formal_parameters' }, { symbol: 'statement_block' }], kind: 'method_definition', production: 'TypeScript 1.8 spec 4.5 SetAccessor: set PropertyName ( ... ), no ? after the name' }
] as const;
const METHOD_SIGNATURE_WITNESSES = [
	{ text: 'export interface I { get x(a: number): number }\n', form: ['get', { symbol: 'identifier' }, { symbol: 'formal_parameters' }, { symbol: 'type_annotation' }], kind: 'method_signature', production: "the class form's production (ECMAScript 15.4) in a signature" },
	{ text: 'export interface I { set x(...a: number[]); }\n', form: ['set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }], kind: 'method_signature', production: 'ECMAScript 15.4 PropertySetParameterList: FormalParameter, not FunctionRestParameter, in a signature' }
] as const;
const ABSTRACT_METHOD_SIGNATURE_WITNESSES = [
	{ text: 'export abstract class A { abstract set x(a, b); }\n', form: ['abstract', 'set', { symbol: 'identifier' }, { symbol: 'formal_parameters' }], kind: 'abstract_method_signature', production: 'ECMAScript 15.4 PropertySetParameterList: FormalParameter, in an abstract signature' }
] as const;

interface AccessorPositions {
	readonly override: number;
	readonly dropped: readonly number[];
	readonly kind: number;
	readonly optional: number;
	readonly signature: number;
}

function accessorArms($: Readonly<Record<string, SymbolRule<string>>>, original: GrammarRule, at: AccessorPositions) {
	const accessor = (kind: string, signature: AuthoringRule) =>
		edit(original, {
			[`${at.override}/0`]: field('override'),
			...Object.fromEntries(at.dropped.map((i) => [i, blank()])),
			[at.kind]: field('accessor_kind', kind),
			[at.optional]: blank(),
			[at.signature]: signature
		});
	return choice(
		variant('plain', edit(original, { [`${at.override}/0`]: field('override'), [`${at.kind}/0`]: field('accessor_kind', '*'), [`${at.optional}/0`]: field('optional') })),
		variant('getter', accessor('get', $._get_accessor_signature)),
		variant('setter', accessor('set', $._set_accessor_signature))
	);
}

export default grammar(enrich(base), wire({
	resolutions,
	name: 'typescript',
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
			'item:/separator/","/after': preference('newline'),
			'item:/delimiter': preference('Delimiter.Trailing')
		},
		program: {
			'statements:/separator': preference('tight'),
			'statements:/(_)/after': preference('newline'),
			'statements:/(function_declaration)/after': preference('blankline'),
			'statements:/(class_declaration)/after': preference('blankline'),
			'statements:/(abstract_class_declaration)/after': preference('blankline'),
			'statements:/(interface_declaration)/after': preference('blankline'),
			'statements:/(enum_declaration)/after': preference('blankline'),
			'statements:/(export_statement_default_declaration)/after': preference('blankline')
		},
		property_signature: { 'optional:/before': preference('tight') },

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
			'item:/separator/before': preference('tight'),
			'item:/separator/after': preference('newline'),
			'item:/separator/kind': preference('semi'),
			'item:/delimiter': preference('Delimiter.Trailing')
		},

		statement_block: { before: preference('space'), 'terminator:': preference('blank') },
		class_static_block: { 'terminator:': preference('blank') },
		class_declaration: { 'terminator:': preference('blank') },
		function_declaration: { 'terminator:': preference('blank') },
		generator_function_declaration: { 'terminator:': preference('blank'), '"*"/before': preference('tight') },
		for_header_let_const_kind: { 'terminator:': preference('blank') },
		class_body_member_method: { 'terminator:': preference('blank') },
		class_body:{ before: preference('space') },
		switch_body: { before: preference('space') },
		named_imports: { before: preference('space'), after: preference('space') },
		import_specifiers: { 'item:/start': preference('space'), 'item:/end': preference('space') },
		export_clause: { before: preference('space'), after: preference('space') },
		export_specifiers: { 'item:/start': preference('space'), 'item:/end': preference('space') },
		object: { 'properties:/start': preference('space'), 'properties:/end': preference('space') },
		object_pattern: { 'properties:/start': preference('space'), 'properties:/end': preference('space') },
		ternary_expression: { '":"/before': preference('space') },
		conditional_type: { '":"/before': preference('space') },
		index_signature_colon: { '"["/before': preference('space') },
		index_signature_mapped_type_clause: { '"["/before': preference('space'), 'sign:/after': preference('tight') },
		for_statement: { '"("/before': preference('space'), '";"/after': preference('space') },
		decorator: { '"@"/after': preference('tight') },
		generator_function: { '"*"/before': preference('tight') },
		lexical_declaration: { after: preference('space') },
		variable_declaration: { after: preference('space') },
		required_parameter: { 'decorator:/(_)/after': preference('space'), 'decorator:/end': preference('space') },
		optional_parameter: {
			'decorator:/(_)/after': preference('space'),
			'decorator:/end': preference('space'),
			'"?"/before': preference('tight')
		},

		_labels: {
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

	edits: {
		decorator: { 1: field('expression') },
		decorator_parenthesized_expression: { 1: field('expression') },
		asserts: { 1: field('value') },
		type_query: { 1: field('expression') },
		comment: {
			'1/0/1': regex(/([^*]|\*+[^*\/])*\**/),
			'1/0/2': { type: 'STRING', value: '*/' },
			0: variant('line'),
			1: variant('block')
		},
		literal_type: { 0: variant('negative_number') },
		_number: { '0/0': { type: 'STRING', value: '-' } },
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
			6: field('terminator')
		},

		function_declaration: {
			5: field('terminator')
		},

		generator_function_declaration: {
			6: field('terminator')
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
				'0/0/1': field('readonly')
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

		property_signature: {
			'2/0': field('override'),
			'5/0': field('optional')
		},

		satisfies_expression: {
			2: field('type_annotation')
		},

		statement_block: {
			3: field('terminator')
		},

		class_static_block: {
			1: field('terminator')
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
		_type_query_subscript_expression: [{ '1/0': alias('optional_chain_marker') }, { '1/0': field('optional_chain') }],

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

		_parameter_name: { '2/0': field('override') },

		parenthesized_expression: {
			'1/0': variant('typed'),
			'1/1': variant('sequence')
		},

		// export_statement: variant() adoption on all three branches.
		// Path 0 is the JS-inherited `previous` (export default,
		// export function, export from, …) with TypeScript's optional
		// `type` before the from-forms; paths 1/2 are
		// `export =`, `export as namespace`. Without
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
			1: variant('equals_export'),
			2: variant('namespace_export')
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

		extends_clause: [
			{ '1/0': alias('extends_clause_single'), '1/1/0/1': alias('extends_clause_single') },
			{ '1/0': field('types'), '1/1/0/1': field('types') }
		],

		import_clause: {
			'0': variant('namespace_import'),
			'1': variant('named_imports'),
			'2': variant('default_import')
		},

		// See docs/typescript-grammar-sittir-glossary.md::export_statement_default unfielded declaration arms
		export_statement_default: {
			0: variant('from'),
			'0/1': field('type'),
			'0/2/0': variant('star_from'),
			'0/2/1': variant('ns_from'),
			'0/2/2': variant('clause_from'),
			'0/3': field('terminator'),
			1: variant('declaration'),
			'1/2/0': { type: 'SYMBOL', name: 'declaration' },
			'1/2/1': variant('default_kw'),
			'1/2/1/1/0': { type: 'SYMBOL', name: 'declaration' },
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
		export_statement_equals_export: { 3: field('terminator') },

		for_in_statement: { 2: field('header') },

		_for_header: {
			'1/0': variant('lhs'),
			'1/1': variant('var_kind'),
			'1/2': variant('let_const_kind'),
			'1/2/2': field('terminator'),
			'1/3': variant('using_kind'),
			'1/3/2': field('terminator')
		}
	},
	extras: ($, previous) => [...(previous ?? [])],
	visibleExternals: (_$) => ({
		_automatic_semicolon: string('\n'),
		_function_signature_automatic_semicolon: string('\n'),
	}),

	expectDiagnostics: {
		'unclassifiable-shape': ['binary_expression', 'public_field_definition_plain'],
		'union-slot-mixed-row': ['binary_expression'],
		'rule-reauthored-without-cause': ['object_type']
	},
	rules: {
		_get_accessor_signature: vocabulary(() => edit(copy('_call_signature'), { 0: blank(), 'parameters:': replace(copy('formal_parameters'), '1', blank()) })),
		_set_accessor_signature: vocabulary(($) =>
			field(
				'parameters',
				replace(
					copy('formal_parameters'),
					'1',
					field(
						'elements',
						edit(copy('formal_parameters_elements'), {
							1: blank(),
							2: blank(),
							'item:': alias(
								edit(copy('required_parameter'), { 0: replace(copy('_parameter_name'), 'pattern:/0', copy('pattern', '0')), 2: blank() }),
								$.setter_parameter
							)
						})
					)
				)
			)
		),
		method_definition: reauthored('accepts-invalid-syntax', METHOD_DEFINITION_WITNESSES, ($, original) =>
			accessorArms($, original, { override: 2, dropped: [3, 4], kind: 5, optional: 7, signature: 8 })
		),
		method_signature: reauthored('accepts-invalid-syntax', METHOD_SIGNATURE_WITNESSES, ($, original) =>
			accessorArms($, original, { override: 2, dropped: [3, 4], kind: 5, optional: 7, signature: 8 })
		),
		abstract_method_signature: reauthored('accepts-invalid-syntax', ABSTRACT_METHOD_SIGNATURE_WITNESSES, ($, original) =>
			accessorArms($, original, { override: 2, dropped: [], kind: 3, optional: 5, signature: 6 })
		),
		public_field_definition: reauthored(
			[
				['rejects-valid-syntax', PUBLIC_FIELD_DEFINITION_ACCEPTED],
				['ruled-narrowing', PUBLIC_FIELD_DEFINITION_NARROWED]
			],
			($, original) =>
				choice(
					// Both spellings of the accessibility position (declare-first and
					// access-first) carry one field, so they merge into one slot.
					variant(
						'plain',
						edit(
							original,
							{ '1/0/0/1/0': field('accessibility_modifier'), '1/0/1/0': field('accessibility_modifier'), '2/0/1/0': field('override'), '4/0': field('optionality') },
							{ 2: (_$: unknown, member: ChoiceRule) => choice(...(member.members.slice(0, 3) as [GrammarRule, ...GrammarRule[]])) }
						)
					),
					// static and abstract are independent flags, as in the plain arm;
					// a builder type rejects the two together.
					variant(
						'accessor',
						edit(original, {
							1: optional(field('accessibility_modifier', $.accessibility_modifier)),
							2: seq(optional(field('static', 'static')), optional(field('abstract', 'abstract')), optional(field('override', $.override_modifier)), field('accessor', 'accessor')),
							4: blank()
						})
					)
				)
		),
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

		member_expression: reauthored(
			'rejects-valid-syntax',
			[
				{
					text: 'a?.for;',
					form: [{ symbol: 'expression' }, { symbol: 'optional_chain' }, 'for'],
					kind: 'member_expression'
				}
			],
			($, original) => {
				const keywordProperties = ['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'get', 'set', 'async', 'await', 'static', 'let'];
				const widen = (rule: any): any => {
					if (rule.type === 'ALIAS' && rule.value === 'property_identifier') {
						return choice(rule, ...keywordProperties.map((value) => ({ ...rule, content: { type: 'STRING', value } })));
					}
					if (Array.isArray(rule.members)) return { ...rule, members: rule.members.map(widen) };
					if (rule.content !== undefined) return { ...rule, content: widen(rule.content) };
					return rule;
				};
				return widen(original);
			}
		),

		decorator_member_expression: reauthored(
			'rejects-valid-syntax',
			[
				{
					text: '@(super.decorate) method() {}',
					form: ['super', '.', { symbol: 'identifier' }],
					kind: 'decorator_member_expression'
				}
			],
			($) =>
				prec(
					'member',
					seq(
						field('object', choice($.identifier, $.super, $.decorator_member_expression)),
						'.',
						field('property', alias($.identifier, $.property_identifier))
					)
				)
		),

		export_statement: reauthored(
			'rejects-valid-syntax',
			[
				{
					text: "export type * from './x.ts';",
					form: ['export', 'type', '*', 'from', { symbol: 'string' }, ';'],
					kind: 'export_statement'
				}
			],
			($) =>
				choice(
					choice(
						seq(
							'export',
							optional('type'),
							choice(
								seq('*', $._from_clause),
								seq($.namespace_export, $._from_clause),
								seq($.export_clause, optional($._from_clause))
							),
							$._semicolon
						),
						seq(
							repeat(field('decorator', $.decorator)),
							'export',
							choice(
								field('declaration', $.declaration),
								seq(
									'default',
									choice(field('declaration', $.declaration), seq(field('value', $.expression), $._semicolon))
								)
							)
						)
					),
					seq('export', '=', field('expression', $.expression), $._semicolon),
					seq('export', 'as', 'namespace', $.identifier, $._semicolon)
				)
		),

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
			return seq(optional(SEP()), field('item', member), repeat(seq(SEP(), field('item', member))), optional(SEP()));
		})
	},
	renderAs: (_$) => ({
		html_comment: /<!--[\s\S]*?-->/,
		jsx_text: /[^{}<>]+/,
		_template_chars: token.immediate(/[^`\\$]+/)
	}),
	reparseHosts: {
		hosts: {
			expression: 'let _ = $r;',
			type: 'type _X = $r;',
			pattern: 'let $r = null;',
			declaration: '$r',
			statement: '$r',
			formal_parameters: 'function _f$r {}',
			required_parameter: 'function _f($r) {}',
			arguments: '_f$r;',
			type_parameters: 'function _f$r() {}',
			variable_declarator: 'let $r;',
			type_annotation: 'let _$r;',
			class_body: 'class _C $r',
			property_signature: 'interface _I { $r }',
			index_signature: 'type _T = { $r }',
			interface_body: 'interface _I $r',
			decorator_member_expression: '@$r\nclass _W {}',
			decorator_call_expression: '@$r\nclass _W {}',
			decorator_parenthesized_expression: '@$r\nclass _W {}',
			rest_pattern: 'const [$r] = [];',
			lhs_expression: '($r = null);'
		}
	},
}));
