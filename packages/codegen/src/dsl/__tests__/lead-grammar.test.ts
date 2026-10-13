import { describe, expect, it } from 'vitest';
import { lead, leadGrammar, leadIssue, LeadRefusal, match, type GrammarRecord } from '../bind.ts';

const BLANK = { type: 'BLANK' };
const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const blankChoice = (content: unknown) => choice(content, BLANK);
const optional = (content: unknown) => ({ type: 'OPTIONAL', content });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const repeat1 = (content: unknown) => ({ type: 'REPEAT1', content });
const alias = (content: unknown, value: string) => ({ type: 'ALIAS', content, named: true, value });

const separatedList = (item: unknown, opt: (content: unknown) => unknown = blankChoice) =>
	seq(field('item', item), repeat(seq(str(','), field('item', item))), opt(str(',')));

const rust = (opt: (content: unknown) => unknown = blankChoice): GrammarRecord => ({
	name: 'rusty',
	rules: {
		source_file: repeat(choice(sym('function_item'), sym('closure'))),
		function_item: seq(str('fn'), sym('identifier'), field('parameters', sym('parameters'))),
		parameters: seq(str('('), opt(field('elements', sym('parameters_elements'))), str(')')),
		parameters_elements: separatedList(alias(sym('_attributed_parameter'), 'attributed_parameter'), opt),
		_attributed_parameter: seq(opt(sym('attribute')), choice(sym('parameter'), sym('self_parameter'), str('_'))),
		closure: seq(str('|'), sym('parameter'), str('|')),
		parameter: seq(field('name', choice(sym('identifier'), sym('self'))), str(':'), field('type', sym('identifier'))),
		self_parameter: str('&self'),
		attribute: str('#'),
		self: str('self'),
		identifier: { type: 'PATTERN', value: '[a-z]+' }
	},
	extras: [],
	externals: [],
	supertypes: [],
	inline: []
});

const typescript = (): GrammarRecord => ({
	name: 'scripty',
	rules: {
		program: repeat(sym('function_declaration')),
		function_declaration: seq(str('function'), field('parameters', sym('formal_parameters'))),
		formal_parameters: seq(str('('), blankChoice(field('elements', sym('formal_parameters_elements'))), str(')')),
		formal_parameters_elements: separatedList(sym('_formal_parameter')),
		_formal_parameter: choice(sym('required_parameter'), sym('optional_parameter')),
		required_parameter: seq(sym('_parameter_name'), blankChoice(field('type', sym('type_annotation')))),
		optional_parameter: seq(sym('_parameter_name'), str('?')),
		_parameter_name: seq(blankChoice(field('override', sym('override_modifier'))), field('pattern', choice(sym('pattern'), sym('this')))),
		type_annotation: seq(str(':'), sym('pattern')),
		override_modifier: str('override'),
		this: str('this'),
		pattern: { type: 'PATTERN', value: '[a-z]+' }
	},
	extras: [],
	externals: [],
	supertypes: [],
	inline: []
});

const named = (parameter: unknown): GrammarRecord => ({
	name: 'named',
	rules: {
		source_file: repeat(sym('function_item')),
		function_item: seq(str('fn'), field('parameters', sym('params'))),
		params: separatedList(sym('parameter')),
		parameter,
		_name: choice(sym('self'), sym('identifier'), sym('other')),
		self: str('self'),
		other: str('other'),
		identifier: { type: 'PATTERN', value: '[a-z]+' }
	},
	extras: [],
	externals: [],
	supertypes: [],
	inline: []
});

const NAMED_LEAD = lead('params', 'item', 'receiver', match('parameter', { name: [match('self')] }));

const RUST_LEAD = lead(
	'parameters_elements',
	'item',
	'receiver',
	match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'typed_self_parameter')])
);
const TS_LEAD = lead('formal_parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'));

const rulesOf = (grammar: GrammarRecord) => grammar.rules as Record<string, unknown>;

describe('leadGrammar', () => {
	it('mints the receiver form, which holds the lead and then the plain list after the separator', () => {
		const rules = rulesOf(leadGrammar(rust(), [RUST_LEAD]));
		expect(rules._parameters_elements_receiver).toEqual(
			seq(
				field('receiver', alias(sym('_attributed_parameter_receiver'), 'attributed_parameter_receiver')),
				blankChoice(seq(str(','), blankChoice(field('elements', sym('parameters_elements')))))
			)
		);
	});

	it('gives every field that held the list a choice of the plain list and the receiver form', () => {
		const rules = rulesOf(leadGrammar(rust(), [RUST_LEAD]));
		expect(rules.parameters).toEqual(
			seq(
				str('('),
				blankChoice(field('elements', choice(sym('parameters_elements'), alias(sym('_parameters_elements_receiver'), 'parameters_elements_receiver')))),
				str(')')
			)
		);
	});

	it('narrows the lead to what it admits, naming a visible variant by its as, or else by its kind and the lead field', () => {
		const rules = rulesOf(leadGrammar(rust(), [RUST_LEAD]));
		expect(rules._attributed_parameter_receiver).toEqual(
			seq(blankChoice(sym('attribute')), choice(alias(sym('_parameter_receiver'), 'typed_self_parameter'), sym('self_parameter')))
		);
		expect(rules._parameter_receiver).toEqual(seq(field('name', sym('self')), str(':'), field('type', sym('identifier'))));
	});

	it("narrows the rest in place where a rule is the list's own, and a shared visible kind in place too", () => {
		const rules = rulesOf(leadGrammar(rust(), [RUST_LEAD]));
		expect(rules.parameters_elements).toEqual(rulesOf(rust()).parameters_elements);
		expect(rules._attributed_parameter).toEqual(seq(blankChoice(sym('attribute')), choice(sym('parameter'), str('_'))));
		expect(rules.parameter).toEqual(seq(field('name', sym('identifier')), str(':'), field('type', sym('identifier'))));
		expect(rules.closure).toEqual(rulesOf(rust()).closure);
		expect(rules._attributed_parameter_item).toBeUndefined();
		expect(rules._parameter_item).toBeUndefined();
	});

	it('clones a hidden rule another kind shares, on each side, and narrows the visible kind that holds it in place', () => {
		const rules = rulesOf(leadGrammar(typescript(), [TS_LEAD]));
		expect(rules._formal_parameters_elements_receiver).toEqual(
			seq(
				field('receiver', alias(sym('_required_parameter_receiver'), 'this_parameter')),
				blankChoice(seq(str(','), blankChoice(field('elements', sym('formal_parameters_elements')))))
			)
		);
		expect(rules._required_parameter_receiver).toEqual(seq(sym('_parameter_name_receiver'), blankChoice(field('type', sym('type_annotation')))));
		expect(rules._parameter_name_receiver).toEqual(seq(blankChoice(field('override', sym('override_modifier'))), field('pattern', sym('this'))));
		expect(rules._parameter_name_item).toEqual(seq(blankChoice(field('override', sym('override_modifier'))), field('pattern', sym('pattern'))));
		expect(rules.required_parameter).toEqual(seq(sym('_parameter_name_item'), blankChoice(field('type', sym('type_annotation')))));
		expect(rules._parameter_name).toEqual(rulesOf(typescript())._parameter_name);
		expect(rules.optional_parameter).toEqual(rulesOf(typescript()).optional_parameter);
		expect(rules._formal_parameter).toEqual(rulesOf(typescript())._formal_parameter);
	});

	it('stamps each rule it mints with its origin in leadFrom, and nothing it narrows in place', () => {
		expect(leadGrammar(rust(), [RUST_LEAD]).leadFrom).toEqual({
			_parameter_receiver: 'parameter',
			_attributed_parameter_receiver: '_attributed_parameter',
			_parameters_elements_receiver: 'parameters_elements'
		});
		expect(leadGrammar(typescript(), [TS_LEAD]).leadFrom).toEqual({
			_parameter_name_receiver: '_parameter_name',
			_required_parameter_receiver: 'required_parameter',
			_parameter_name_item: '_parameter_name',
			_formal_parameters_elements_receiver: 'formal_parameters_elements'
		});
	});

	it("writes the optionals it builds in the list's own spelling", () => {
		const rules = rulesOf(leadGrammar(rust(optional), [RUST_LEAD]));
		expect(rules._parameters_elements_receiver).toEqual(
			seq(
				field('receiver', alias(sym('_attributed_parameter_receiver'), 'attributed_parameter_receiver')),
				optional(seq(str(','), optional(field('elements', sym('parameters_elements')))))
			)
		);
	});

	it('carries a minted rule into the supertypes and inline lists its origin sits in', () => {
		const out = leadGrammar({ ...typescript(), inline: ['_parameter_name'] }, [TS_LEAD]);
		expect(out.inline).toEqual(['_parameter_name', '_parameter_name_receiver', '_parameter_name_item']);
	});

	it('clones a hidden rule the lead\'s variant still holds at another position, rather than narrowing it in place under the variant', () => {
		const rules = rulesOf(leadGrammar(named(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('_name')))), [NAMED_LEAD]));
		expect(rules._parameter_receiver).toEqual(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('self'))));
		expect(rules.parameter).toEqual(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('_name_item'))));
		expect(rules._name).toEqual(choice(sym('self'), sym('identifier'), sym('other')));
		expect(rules._name_item).toEqual(choice(sym('identifier'), sym('other')));
	});

	it('keeps the field around a position whose hidden rule narrows in place', () => {
		const rules = rulesOf(leadGrammar(named(seq(str('x:'), field('name', sym('_name')))), [NAMED_LEAD]));
		expect(rules.parameter).toEqual(seq(str('x:'), field('name', sym('_name'))));
		expect(rules._name).toEqual(choice(sym('identifier'), sym('other')));
		expect(rules._parameter_receiver).toEqual(seq(str('x:'), field('name', sym('self'))));
	});

	it('keeps on the lead side only the alternatives that hold the restricted position, and leaves the rest every alternative', () => {
		const rules = rulesOf(leadGrammar(named(choice(seq(field('name', sym('_name')), str(':')), str('...'))), [NAMED_LEAD]));
		expect(rules._parameter_receiver).toEqual(seq(field('name', sym('self')), str(':')));
		expect(rules.parameter).toEqual(choice(seq(field('name', sym('_name')), str(':')), str('...')));
		expect(rules._name).toEqual(choice(sym('identifier'), sym('other')));
		const optionalName = rulesOf(leadGrammar(named(seq(blankChoice(field('name', sym('_name'))), str(':'))), [NAMED_LEAD]));
		expect(optionalName._parameter_receiver).toEqual(seq(field('name', sym('self')), str(':')));
		expect(optionalName.parameter).toEqual(seq(blankChoice(field('name', sym('_name'))), str(':')));
	});

	it('refuses a restriction whose position a kind holds more than once, since no lead and rest split it', () => {
		const twice = named(seq(field('name', sym('_name')), str(':'), field('name', sym('_name'))));
		expect(leadIssue(twice, [NAMED_LEAD])).toBe("the restriction of field 'name' names 2 positions in 'parameter'");
		const repeated = named(repeat1(field('name', sym('_name'))));
		expect(leadIssue(repeated, [NAMED_LEAD])).toBe("the restriction of field 'name' sits under a repeat in 'parameter'");
	});

	it('refuses a restriction a recursive hidden rule repeats, and passes one beside a recursive rule that does not hold it', () => {
		const recursive = { ...named(sym('_names')), rules: { ...rulesOf(named(sym('_names'))), _names: seq(field('name', sym('_name')), blankChoice(seq(str(','), sym('_names')))) } };
		expect(leadIssue(recursive, [NAMED_LEAD])).toBe("the restriction of field 'name' names 2 positions in 'parameter'");
		const beside = {
			...named(seq(field('name', sym('_name')), str(':'), sym('_type'))),
			rules: { ...rulesOf(named(seq(field('name', sym('_name')), str(':'), sym('_type')))), _type: choice(sym('identifier'), seq(str('['), sym('_type'), str(']'))) }
		};
		expect(leadIssue(beside, [NAMED_LEAD])).toBeUndefined();
	});

	it('renames an admitted alias of a literal by its as, and refuses a restriction of a kind with no rule', () => {
		const literal = { ...named(seq(field('name', sym('_name')), str(':'))), rules: { ...rulesOf(named(seq(field('name', sym('_name')), str(':')))), params: separatedList(choice(alias(str('&self'), 'self_parameter'), sym('parameter'))) } };
		const renamed = rulesOf(leadGrammar(literal, [lead('params', 'item', 'receiver', match('self_parameter', undefined, 'receiver_parameter'))]));
		expect(renamed._params_receiver).toEqual(
			seq(field('receiver', alias(str('&self'), 'receiver_parameter')), blankChoice(seq(str(','), blankChoice(field('parameters', sym('params'))))))
		);
		expect(leadIssue(literal, [lead('params', 'item', 'receiver', match('self_parameter', { name: [match('self')] }))])).toBe("'self_parameter' has no rule to narrow");
	});

	it('leaves a grammar with no leads as it is', () => {
		const grammar = rust();
		expect(leadGrammar(grammar, [])).toBe(grammar);
	});

	it('asserts a lead the derivation did not validate, naming the lead and the reason leadIssue gives', () => {
		const unfielded = { ...rust(), rules: { ...rulesOf(rust()), parameters: seq(str('('), sym('parameters_elements'), str(')')) } };
		expect(() => leadGrammar(unfielded, [RUST_LEAD])).toThrow(new LeadRefusal("'parameters' holds the list other than as a field's content", RUST_LEAD));
		expect(() => leadGrammar(unfielded, [RUST_LEAD])).toThrow("bind: lead 'parameters_elements.receiver': 'parameters' holds the list other than as a field's content");
		expect(leadIssue(unfielded, [RUST_LEAD])).toBe("'parameters' holds the list other than as a field's content");
		expect(leadIssue(rust(), [RUST_LEAD])).toBeUndefined();
	});
});
