import { describe, expect, it } from 'vitest';
import { lead, leadGrammar, leadIssue, LeadRefusal, match, type GrammarRecord, type Lead } from '../bind.ts';

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

type Node = { readonly type: string; readonly [key: string]: unknown };

function language(rules: Record<string, unknown>, rule: unknown, depth = 0): Set<string> {
	const node = rule as Node;
	if (depth > 16) return new Set();
	const join = (left: Set<string>, right: Set<string>): Set<string> => new Set([...left].flatMap((a) => [...right].map((b) => [a, b].filter(Boolean).join(' '))));
	const inner = (r: unknown): Set<string> => language(rules, r, depth + 1);
	switch (node.type) {
		case 'STRING':
			return new Set([node.value as string]);
		case 'PATTERN':
			return new Set([`<${node.value as string}>`]);
		case 'BLANK':
			return new Set(['']);
		case 'SYMBOL':
			return inner(rules[node.name as string]);
		case 'CHOICE':
			return new Set((node.members as unknown[]).flatMap((m) => [...inner(m)]));
		case 'OPTIONAL':
			return new Set(['', ...inner(node.content)]);
		case 'SEQ':
			return (node.members as unknown[]).reduce<Set<string>>((acc, m) => join(acc, inner(m)), new Set(['']));
		case 'REPEAT':
		case 'REPEAT1': {
			const once = inner(node.content);
			return new Set([...(node.type === 'REPEAT' ? [''] : []), ...once, ...join(once, once)]);
		}
		default:
			return inner(node.content);
	}
}

const itemOf = (list: unknown): unknown => ((list as { members: { content: unknown }[] }).members[0] as { content: unknown }).content;

function expectPartition(before: GrammarRecord, after: GrammarRecord, list: string, field: string): void {
	const original = language(rulesOf(before), itemOf(rulesOf(before)[list]));
	const lead = language(rulesOf(after), itemOf(rulesOf(after)[`_${list}_${field}`]));
	const rest = language(rulesOf(after), itemOf(rulesOf(after)[list]));
	expect([...lead].filter((form) => rest.has(form))).toEqual([]);
	expect(new Set([...lead, ...rest])).toEqual(original);
}

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

	it('counts each site of a hidden rule in the item, so two aliases of one rule keep the one the lead does not restrict', () => {
		const grammar = {
			...named(str('p')),
			rules: {
				...rulesOf(named(str('p'))),
				params: separatedList(choice(alias(sym('_atom'), 'a'), alias(sym('_atom'), 'b'))),
				_atom: field('value', choice(sym('self'), sym('other')))
			}
		};
		const rules = rulesOf(leadGrammar(grammar, [lead('params', 'item', 'receiver', match('a', { value: [match('self')] }))]));
		expect(rules._atom).toEqual(field('value', choice(sym('self'), sym('other'))));
		expect(rules._atom_item).toEqual(field('value', sym('other')));
		expect(rules.params).toEqual(separatedList(choice(alias(sym('_atom_item'), 'a'), alias(sym('_atom'), 'b'))));
	});

	it('keeps the list\'s separator flanks: no trailing separator after a lone receiver when the list takes none', () => {
		const untrailed = { ...named(seq(field('name', sym('_name')), str(':'))), rules: { ...rulesOf(named(seq(field('name', sym('_name')), str(':')))), params: seq(field('item', sym('parameter')), repeat(seq(str(','), field('item', sym('parameter'))))) } };
		expect(rulesOf(leadGrammar(untrailed, [NAMED_LEAD]))._params_receiver).toEqual(
			seq(field('receiver', alias(sym('_parameter_receiver'), 'parameter_receiver')), blankChoice(seq(str(','), field('parameters', sym('params')))))
		);
	});

	it('refuses a list with a leading separator or a mandatory trailing one', () => {
		const withList = (params: unknown) => ({ ...named(seq(field('name', sym('_name')), str(':'))), rules: { ...rulesOf(named(seq(field('name', sym('_name')), str(':')))), params } });
		const item = field('item', sym('parameter'));
		expect(leadIssue(withList(seq(blankChoice(str(',')), item, repeat(seq(str(','), item)))), [NAMED_LEAD])).toBe('the list takes a leading separator');
		expect(leadIssue(withList(seq(item, repeat(seq(str(','), item)), str(','))), [NAMED_LEAD])).toBe('the list takes a mandatory trailing separator');
	});

	describe('refuses narrowing a visible kind in place where the item holds it at another position too, since the item would lose forms on both sides', () => {
		const rows = (row: unknown, extra: Record<string, unknown> = {}): GrammarRecord => ({
			name: 'rows',
			rules: {
				source_file: repeat(sym('table')),
				table: seq(str('{'), field('rows', sym('rows')), str('}')),
				rows: separatedList(sym('row')),
				row,
				atom: field('value', choice(sym('self'), sym('other'))),
				self: str('self'),
				other: str('other'),
				filler: str('x'),
				...extra
			},
			extras: [],
			externals: [],
			supertypes: [],
			inline: []
		});
		const ROW_LEAD = lead('rows', 'item', 'receiver', match('row', { right: [match('atom', { value: [match('self')] })] }));

		it('at a second field of the kind that holds the restriction', () => {
			expect(leadIssue(rows(seq(field('left', sym('atom')), str(':'), field('right', sym('atom')))), [ROW_LEAD])).toBe(
				"'atom' narrows in place, but the item holds it at 2 positions (in row)"
			);
		});

		it('through a hidden rule the item holds at two positions', () => {
			const slots = rows(seq(field('left', sym('_slot')), str(':'), field('right', sym('_slot'))), { _slot: choice(sym('atom'), sym('filler')) });
			expect(leadIssue(slots, [ROW_LEAD])).toBe("'atom' narrows in place, but the item holds it at 2 positions (in _slot)");
		});

		it('through a hidden rule the narrowing does not walk', () => {
			const beside = rows(seq(field('left', sym('_other')), str(':'), field('right', sym('atom'))), { _other: seq(str('<'), sym('atom'), str('>')) });
			expect(leadIssue(beside, [ROW_LEAD])).toBe("'atom' narrows in place, but the item holds it at 2 positions (in _other, row)");
		});

		it('through a supertype the narrowing does not walk', () => {
			const grammar = { ...rows(seq(field('left', sym('_other')), str(':'), field('right', sym('atom'))), { _other: choice(sym('atom'), sym('filler')) }), supertypes: ['_other'] };
			expect(leadIssue(grammar, [ROW_LEAD])).toBe("'atom' narrows in place, but the item holds it at 2 positions (in _other, row)");
		});

		it.each([
			['a supertype', { supertypes: ['wrapper'] }],
			['an inline rule', { inline: [{ type: 'SYMBOL', name: 'wrapper' }] }]
		])('through %s of any name, which the parse tree does not show', (_, lists) => {
			const grammar = { ...rows(seq(field('left', sym('wrapper')), str(':'), field('right', sym('atom'))), { wrapper: choice(sym('atom'), sym('filler')) }), ...lists };
			expect(leadIssue(grammar, [ROW_LEAD])).toBe("'atom' narrows in place, but the item holds it at 2 positions (in row, wrapper)");
		});

		it('under a recursive hidden rule, which is a sequence the split cannot divide', () => {
			const nested = rows(seq(field('right', sym('_nest'))), { _nest: choice(sym('atom'), seq(str('('), sym('_nest'), str(')'))) });
			expect(leadIssue(nested, [ROW_LEAD])).toBe("'atom' sits where the split cannot divide it");
		});

		it('inside itself, recursively', () => {
			const recursive = rows(seq(field('right', sym('atom'))), { atom: field('value', choice(sym('self'), sym('other'), seq(str('('), sym('atom'), str(')')))) });
			expect(leadIssue(recursive, [ROW_LEAD])).toBe("'atom' narrows in place, but the item holds it at 2 positions (in atom, row)");
		});

		it('in the item of a lead applied before it', () => {
			const twoLists: GrammarRecord = {
				...named(field('name', choice(sym('self'), sym('other'), sym('plain')))),
				rules: {
					...rulesOf(named(field('name', choice(sym('self'), sym('other'), sym('plain'))))),
					source_file: repeat(choice(sym('function_item'), sym('method_item'))),
					method_item: seq(str('m'), field('parameters', sym('method_params'))),
					method_params: separatedList(sym('parameter')),
					plain: str('plain')
				}
			};
			const leads = [
				lead('method_params', 'item', 'receiver', match('parameter', { name: [match('self')] })),
				lead('params', 'item', 'context', match('parameter', { name: [match('other')] }))
			];
			expect(leadIssue(twoLists, leads)).toBe("'parameter' narrows in place, but the lead on 'method_params' holds it in its item");
		});
	});

	describe('partitions the item\'s language exactly: the lead and the rest are disjoint, and together the original item', () => {
		const cases: readonly [string, () => GrammarRecord, Lead][] = [
			['rust', () => rust(), RUST_LEAD],
			['rust, OPTIONAL spelling', () => rust(optional), RUST_LEAD],
			['typescript', () => typescript(), TS_LEAD],
			['a field beside another of one hidden rule', () => named(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('_name')))), NAMED_LEAD],
			['a field whose hidden rule narrows in place', () => named(seq(str('x:'), field('name', sym('_name')))), NAMED_LEAD],
			['alternatives without the position', () => named(choice(seq(field('name', sym('_name')), str(':')), str('...'))), NAMED_LEAD],
			['an optional position', () => named(seq(blankChoice(field('name', sym('_name'))), str(':'))), NAMED_LEAD]
		];
		it.each(cases)('%s', (_, grammar, entry) => {
			expectPartition(grammar(), leadGrammar(grammar(), [entry]), entry.list, entry.field);
		});
	});

	it('refuses an admitted kind inside a hidden sequence, which the split cannot divide', () => {
		const prefixed = {
			...named(field('name', sym('_name'))),
			rules: {
				...rulesOf(named(field('name', sym('_name')))),
				_name: choice(sym('self'), sym('_prefixed_self'), sym('other')),
				_prefixed_self: seq(blankChoice(str('&')), sym('self'))
			}
		};
		expect(leadIssue(prefixed, [NAMED_LEAD])).toBe("'self' sits where the split cannot divide it");
	});

	it('refuses an admitted kind inside a supertype or inline rule of any name, which the narrowing does not walk', () => {
		const wrapped = (lists: Record<string, unknown>) => ({
			...named(field('name', sym('_name'))),
			rules: { ...rulesOf(named(field('name', sym('_name')))), _name: choice(sym('wrapper'), sym('other')), wrapper: choice(sym('self'), sym('identifier')) },
			...lists
		});
		expect(leadIssue(wrapped({ supertypes: ['wrapper'] }), [NAMED_LEAD])).toBe("'self' sits where the split cannot divide it");
		expect(leadIssue(wrapped({ inline: ['wrapper'] }), [NAMED_LEAD])).toBe("'self' sits where the split cannot divide it");
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
