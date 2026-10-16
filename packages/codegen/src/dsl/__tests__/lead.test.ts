import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import { lead as leadRecord, leadGrammar, LeadRefusal } from '../bind.ts';
import { lead } from '../primitives/lead.ts';
import { match } from '../primitives/narrow.ts';
import type { GrammarRecord } from '../rule-patterns.ts';
import { makeRuleMetadata } from '../rule-metadata.ts';
import { verbCtxOf } from '../verbs/copy.ts';
import { provenanceOf, type Effect } from '../verbs/effects.ts';
import { applyLeads } from '../verbs/lead.ts';
import { wireImpl, type WireLayer } from '../wire/wire.ts';
import { enterWired, installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const BLANK = { type: 'BLANK' };
const sym = (name: string) => ({ type: 'SYMBOL', name });
const groupRef = (name: string) => ({ ...sym(name), metadata: makeRuleMetadata({ symbolSource: 'group-lift' }) });
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

const withRules = (grammar: GrammarRecord, rules: Record<string, unknown>): GrammarRecord => ({ ...grammar, rules: { ...rulesOf(grammar), ...rules } });

type Edits = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

const NAMED = { params: { '.': lead('item', 'receiver', match('parameter', { name: [match('self')] })) } };

const RUST = {
	parameters_elements: {
		'.': lead('item', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'typed_self_parameter')]))
	}
};
const TS = { formal_parameters_elements: { '.': lead('item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter')) } };

const rulesOf = (grammar: GrammarRecord) => grammar.rules as Record<string, unknown>;

interface Applied {
	readonly grammar: GrammarRecord;
	readonly rules: Record<string, unknown>;
	readonly effects: readonly Effect[];
	readonly diagnostics: readonly GrammarDiagnostic[];
}

function viaEdits(grammar: GrammarRecord, edits: Edits): Applied {
	const name = grammar.name as string;
	const layer: WireLayer = { name, diagnostics: [], narrows: [], leads: [] };
	enterWired(wireImpl({ name, edits }, grammar, grammar, layer));
	const ctx = verbCtxOf(grammar, { effects: [], diagnostics: layer.diagnostics });
	applyLeads(layer.leads, ctx);
	return {
		grammar: { ...grammar, rules: ctx.rules, supertypes: ctx.lists.supertypes, inline: ctx.lists.inline },
		rules: ctx.rules,
		effects: ctx.effects,
		diagnostics: ctx.diagnostics
	};
}

const refused = (grammar: GrammarRecord, edits: Edits): readonly (readonly [string, string])[] =>
	viaEdits(grammar, edits).diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.message] as const);

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
	const head = language(rulesOf(after), itemOf(rulesOf(after)[`_${list}_${field}`]));
	const rest = language(rulesOf(after), itemOf(rulesOf(after)[list]));
	expect([...head].filter((form) => rest.has(form))).toEqual([]);
	expect(new Set([...head, ...rest])).toEqual(original);
}

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

describe('a lead entry', () => {
	it('mints the receiver form, which holds the lead and then the plain list after the separator', () => {
		const { rules } = viaEdits(rust(), RUST);
		expect(rules._parameters_elements_receiver).toEqual(
			seq(
				field('receiver', alias(sym('_attributed_parameter_receiver'), 'attributed_parameter_receiver')),
				blankChoice(groupRef('parameters_elements_receiver_group'))
			)
		);
		expect(rules.parameters_elements_receiver_group).toEqual(
			expect.objectContaining(seq(str(','), blankChoice(field('elements', sym('parameters_elements')))))
		);
	});

	it('gives every field that held the list a choice of the plain list and the receiver form', () => {
		const { rules } = viaEdits(rust(), RUST);
		expect(rules.parameters).toEqual(
			seq(
				str('('),
				blankChoice(field('elements', choice(sym('parameters_elements'), alias(sym('_parameters_elements_receiver'), 'parameters_elements_receiver')))),
				str(')')
			)
		);
	});

	it('narrows the lead to what it admits, naming a visible variant by its as, or else by its kind and the lead field', () => {
		const { rules } = viaEdits(rust(), RUST);
		expect(rules._attributed_parameter_receiver).toEqual(
			seq(blankChoice(sym('attribute')), choice(alias(sym('_parameter_receiver'), 'typed_self_parameter'), sym('self_parameter')))
		);
		expect(rules._parameter_receiver).toEqual(seq(field('name', sym('self')), str(':'), field('type', sym('identifier'))));
	});

	it("narrows the rest in place where a rule is the list's own, and a shared visible kind in place too", () => {
		const { rules } = viaEdits(rust(), RUST);
		expect(rules.parameters_elements).toEqual(rulesOf(rust()).parameters_elements);
		expect(rules._attributed_parameter).toEqual(seq(blankChoice(sym('attribute')), choice(sym('parameter'), str('_'))));
		expect(rules.parameter).toEqual(seq(field('name', sym('identifier')), str(':'), field('type', sym('identifier'))));
		expect(rules.closure).toEqual(rulesOf(rust()).closure);
		expect(rules._attributed_parameter_item).toBeUndefined();
		expect(rules._parameter_item).toBeUndefined();
	});

	it('clones a hidden rule another kind shares, on each side, and narrows the visible kind that holds it in place', () => {
		const { rules } = viaEdits(typescript(), TS);
		expect(rules._formal_parameters_elements_receiver).toEqual(
			seq(field('receiver', alias(sym('_required_parameter_receiver'), 'this_parameter')), blankChoice(groupRef('formal_parameters_elements_receiver_group')))
		);
		expect(rules.formal_parameters_elements_receiver_group).toEqual(
			expect.objectContaining(seq(str(','), blankChoice(field('elements', sym('formal_parameters_elements')))))
		);
		expect(rules._required_parameter_receiver).toEqual(seq(sym('_parameter_name_receiver'), blankChoice(field('type', sym('type_annotation')))));
		expect(rules._parameter_name_receiver).toEqual(seq(blankChoice(field('override', sym('override_modifier'))), field('pattern', sym('this'))));
		expect(rules._parameter_name_item).toEqual(seq(blankChoice(field('override', sym('override_modifier'))), field('pattern', sym('pattern'))));
		expect(rules.required_parameter).toEqual(seq(sym('_parameter_name_item'), blankChoice(field('type', sym('type_annotation')))));
		expect(rules._parameter_name).toEqual(rulesOf(typescript())._parameter_name);
		expect(rules.optional_parameter).toEqual(rulesOf(typescript()).optional_parameter);
		expect(rules._formal_parameter).toEqual(rulesOf(typescript())._formal_parameter);
	});

	it('records a copy effect, whose origin is the entry, for each rule it mints, and none for what it narrows in place', () => {
		const copies = (applied: Applied) => applied.effects.map((effect) => (effect.kind === 'copy' ? [effect.copy, effect.source, effect.context, effect.origin.kind] : effect.kind));
		expect(copies(viaEdits(rust(), RUST))).toEqual([
			['_parameter_receiver', 'parameter', 'receiver', 'lead'],
			['_attributed_parameter_receiver', '_attributed_parameter', 'receiver', 'lead'],
			['_parameters_elements_receiver', 'parameters_elements', 'receiver', 'lead']
		]);
		const ts = viaEdits(typescript(), TS);
		expect(provenanceOf(ts.effects, ts.rules).leadFrom).toEqual({
			_parameter_name_receiver: '_parameter_name',
			_required_parameter_receiver: 'required_parameter',
			_parameter_name_item: '_parameter_name',
			_formal_parameters_elements_receiver: 'formal_parameters_elements'
		});
	});

	it('appends its groups after every lead copy, as the last rules', () => {
		expect(Object.keys(viaEdits(rust(), RUST).rules).slice(-4)).toEqual([
			'_parameter_receiver',
			'_attributed_parameter_receiver',
			'_parameters_elements_receiver',
			'parameters_elements_receiver_group'
		]);
	});

	it("writes the optionals it builds in the list's own spelling", () => {
		const { rules } = viaEdits(rust(optional), RUST);
		expect(rules._parameters_elements_receiver).toEqual(
			seq(field('receiver', alias(sym('_attributed_parameter_receiver'), 'attributed_parameter_receiver')), optional(groupRef('parameters_elements_receiver_group')))
		);
		expect(rules.parameters_elements_receiver_group).toEqual(expect.objectContaining(seq(str(','), optional(field('elements', sym('parameters_elements'))))));
	});

	it('carries a minted rule into the supertypes and inline lists its origin sits in', () => {
		expect(viaEdits({ ...typescript(), inline: ['_parameter_name'] }, TS).grammar.inline).toEqual(['_parameter_name', '_parameter_name_receiver', '_parameter_name_item']);
	});

	it("clones a hidden rule the lead's variant still holds at another position, rather than narrowing it in place under the variant", () => {
		const { rules } = viaEdits(named(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('_name')))), NAMED);
		expect(rules._parameter_receiver).toEqual(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('self'))));
		expect(rules.parameter).toEqual(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('_name_item'))));
		expect(rules._name).toEqual(choice(sym('self'), sym('identifier'), sym('other')));
		expect(rules._name_item).toEqual(choice(sym('identifier'), sym('other')));
	});

	it('keeps the field around a position whose hidden rule narrows in place', () => {
		const { rules } = viaEdits(named(seq(str('x:'), field('name', sym('_name')))), NAMED);
		expect(rules.parameter).toEqual(seq(str('x:'), field('name', sym('_name'))));
		expect(rules._name).toEqual(choice(sym('identifier'), sym('other')));
		expect(rules._parameter_receiver).toEqual(seq(str('x:'), field('name', sym('self'))));
	});

	it('keeps on the lead side only the alternatives that hold the restricted position, and leaves the rest every alternative', () => {
		const { rules } = viaEdits(named(choice(seq(field('name', sym('_name')), str(':')), str('...'))), NAMED);
		expect(rules._parameter_receiver).toEqual(seq(field('name', sym('self')), str(':')));
		expect(rules.parameter).toEqual(choice(seq(field('name', sym('_name')), str(':')), str('...')));
		expect(rules._name).toEqual(choice(sym('identifier'), sym('other')));
		const optionalName = viaEdits(named(seq(blankChoice(field('name', sym('_name'))), str(':'))), NAMED).rules;
		expect(optionalName._parameter_receiver).toEqual(seq(field('name', sym('self')), str(':')));
		expect(optionalName.parameter).toEqual(seq(blankChoice(field('name', sym('_name'))), str(':')));
	});

	it('renames an admitted alias of a literal by its as, recording the head form in the projected lead', () => {
		const literal = withRules(named(seq(field('name', sym('_name')), str(':'))), {
			params: separatedList(choice(alias(str('&self'), 'self_parameter'), sym('parameter')))
		});
		const applied = viaEdits(literal, { params: { '.': lead('item', 'receiver', match('self_parameter', undefined, 'receiver_parameter')) } });
		expect(applied.rules._params_receiver).toEqual(seq(field('receiver', alias(str('&self'), 'receiver_parameter')), blankChoice(groupRef('params_receiver_group'))));
		expect(applied.rules.params_receiver_group).toEqual(expect.objectContaining(seq(str(','), blankChoice(field('parameters', sym('params'))))));
		expect(provenanceOf(applied.effects, applied.rules).bindingEffects).toEqual([
			expect.objectContaining({ kind: 'lead', receiver: 'params_receiver', variants: { self_parameter: 'receiver_parameter' } })
		]);
	});

	it('counts each site of a hidden rule in the item, so two aliases of one rule keep the one the lead does not restrict', () => {
		const grammar = withRules(named(str('p')), {
			params: separatedList(choice(alias(sym('_atom'), 'a'), alias(sym('_atom'), 'b'))),
			_atom: field('value', choice(sym('self'), sym('other')))
		});
		const { rules } = viaEdits(grammar, { params: { '.': lead('item', 'receiver', match('a', { value: [match('self')] })) } });
		expect(rules._atom).toEqual(field('value', choice(sym('self'), sym('other'))));
		expect(rules._atom_item).toEqual(field('value', sym('other')));
		expect(rules.params).toEqual(separatedList(choice(alias(sym('_atom_item'), 'a'), alias(sym('_atom'), 'b'))));
	});

	it("keeps the list's separator flanks: no trailing separator after a lone receiver when the list takes none", () => {
		const untrailed = withRules(named(seq(field('name', sym('_name')), str(':'))), {
			params: seq(field('item', sym('parameter')), repeat(seq(str(','), field('item', sym('parameter')))))
		});
		const { rules } = viaEdits(untrailed, NAMED);
		expect(rules._params_receiver).toEqual(seq(field('receiver', alias(sym('_parameter_receiver'), 'parameter_receiver')), blankChoice(groupRef('params_receiver_group'))));
		expect(rules.params_receiver_group).toEqual(expect.objectContaining(seq(str(','), field('parameters', sym('params')))));
	});

	it('leaves a grammar with no lead entries as it is', () => {
		expect(viaEdits(rust(), {}).rules).toEqual(rulesOf(rust()));
	});

	describe("partitions the item's language exactly: the lead and the rest are disjoint, and together the original item", () => {
		const cases: readonly [string, () => GrammarRecord, Edits, string][] = [
			['rust', () => rust(), RUST, 'parameters_elements'],
			['rust, OPTIONAL spelling', () => rust(optional), RUST, 'parameters_elements'],
			['typescript', () => typescript(), TS, 'formal_parameters_elements'],
			['a field beside another of one hidden rule', () => named(seq(field('qualifier', sym('_name')), str(':'), field('name', sym('_name')))), NAMED, 'params'],
			['a field whose hidden rule narrows in place', () => named(seq(str('x:'), field('name', sym('_name')))), NAMED, 'params'],
			['alternatives without the position', () => named(choice(seq(field('name', sym('_name')), str(':')), str('...'))), NAMED, 'params'],
			['an optional position', () => named(seq(blankChoice(field('name', sym('_name'))), str(':'))), NAMED, 'params']
		];
		it.each(cases)('%s', (_, grammar, edits, list) => {
			expectPartition(grammar(), viaEdits(grammar(), edits).grammar, list, 'receiver');
		});
	});
});

describe("a lead entry's refusals carry the verb's code and today's reason, and drop the entry", () => {
	const lead_ = (list: string, ...admits: Parameters<typeof match>[]) => ({ [list]: { '.': lead('item', 'receiver', ...admits.map((args) => match(...args))) } });

	it('refuses a restriction whose position a kind holds more than once, since no lead and rest split it', () => {
		expect(refused(named(seq(field('name', sym('_name')), str(':'), field('name', sym('_name')))), NAMED)).toEqual([
			['narrow-invalid', "lead 'params.receiver': the restriction of field 'name' names 2 positions in 'parameter'"]
		]);
		expect(refused(named(repeat1(field('name', sym('_name')))), NAMED)).toEqual([
			['narrow-invalid', "lead 'params.receiver': the restriction of field 'name' sits under a repeat in 'parameter'"]
		]);
	});

	it('refuses a restriction a recursive hidden rule repeats, and passes one beside a recursive rule that does not hold it', () => {
		const recursive = withRules(named(sym('_names')), { _names: seq(field('name', sym('_name')), blankChoice(seq(str(','), sym('_names')))) });
		expect(refused(recursive, NAMED)).toEqual([['narrow-invalid', "lead 'params.receiver': the restriction of field 'name' names 2 positions in 'parameter'"]]);
		const beside = withRules(named(seq(field('name', sym('_name')), str(':'), sym('_type'))), { _type: choice(sym('identifier'), seq(str('['), sym('_type'), str(']'))) });
		expect(refused(beside, NAMED)).toEqual([]);
	});

	it('refuses a restriction of a kind with no rule', () => {
		const literal = withRules(named(seq(field('name', sym('_name')), str(':'))), {
			params: separatedList(choice(alias(str('&self'), 'self_parameter'), sym('parameter')))
		});
		expect(refused(literal, lead_('params', ['self_parameter', { name: [match('self')] }]))).toEqual([
			['narrow-invalid', "lead 'params.receiver': 'self_parameter' has no rule to narrow"]
		]);
	});

	it('refuses a list with a leading separator or a mandatory trailing one', () => {
		const withList = (params: unknown) => withRules(named(seq(field('name', sym('_name')), str(':'))), { params });
		const item = field('item', sym('parameter'));
		expect(refused(withList(seq(blankChoice(str(',')), item, repeat(seq(str(','), item)))), NAMED)).toEqual([
			['edit-entry-invalid', "lead 'params.receiver': the list takes a leading separator"]
		]);
		expect(refused(withList(seq(item, repeat(seq(str(','), item)), str(','))), NAMED)).toEqual([
			['edit-entry-invalid', "lead 'params.receiver': the list takes a mandatory trailing separator"]
		]);
	});

	it('refuses a list that is no separated list of the field the entry names', () => {
		expect(refused(named(str('p')), { params: { '.': lead('element', 'receiver', match('parameter')) } })).toEqual([
			['edit-entry-invalid', "lead 'params.receiver': the list is no separated list of field 'element'"]
		]);
	});

	it('refuses a list that sits in no field, in two fields, or other than as a field', () => {
		const owners = (body: unknown) => withRules(named(seq(field('name', sym('_name')), str(':'))), { function_item: body });
		expect(refused(owners(seq(str('fn'), sym('params'))), NAMED)).toEqual([
			['edit-entry-invalid', "lead 'params.receiver': 'function_item' holds the list other than as a field's content"]
		]);
		expect(refused(owners(seq(str('fn'), field('a', sym('params')), field('b', sym('params')))), NAMED)).toEqual([
			['edit-entry-invalid', "lead 'params.receiver': the list sits in fields a, b"]
		]);
		expect(refused(withRules(owners(str('fn')), { source_file: repeat(str('fn')) }), NAMED)).toEqual([
			['edit-entry-invalid', "lead 'params.receiver': the list sits in no field of another rule"]
		]);
	});

	it('refuses a receiver group it cannot name', () => {
		const taken = withRules(named(seq(field('name', sym('_name')), str(':'))), { params_receiver_group1: str('x') });
		expect(refused(taken, NAMED)).toEqual([['edit-entry-invalid', "lead 'params.receiver': the receiver rest group could not be named"]]);
	});

	it('refuses an admit that names a kind twice, admits no item, or leaves the list none', () => {
		const grammar = named(seq(field('name', sym('_name')), str(':')));
		expect(refused(grammar, lead_('params', ['parameter'], ['parameter']))).toEqual([['narrow-invalid', "lead 'params.receiver': it admits 'parameter' twice"]]);
		expect(refused(grammar, lead_('params', ['other']))).toEqual([['narrow-invalid', "lead 'params.receiver': it admits no item of the list"]]);
		expect(refused(grammar, lead_('params', ['parameter']))).toEqual([['narrow-invalid', "lead 'params.receiver': it leaves the list no item"]]);
		expect(refused(grammar, lead_('params', ['parameter', { name: [match('missing')] }]))).toEqual([
			['narrow-invalid', "lead 'params.receiver': it leaves field 'name' of 'parameter' empty"]
		]);
	});

	it('refuses a mint the grammar already names', () => {
		const taken = withRules(named(seq(field('name', sym('_name')), str(':'))), { _parameter_receiver: str('x') });
		expect(refused(taken, NAMED)).toEqual([['rule-name-taken', "lead 'params.receiver': 'parameter' mints '_parameter_receiver', which the grammar already names"]]);
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
		const ROW = { rows: { '.': lead('item', 'receiver', match('row', { right: [match('atom', { value: [match('self')] })] })) } };
		const refusal = (reason: string) => [['narrow-invalid', `lead 'rows.receiver': ${reason}`]];

		it('at a second field of the kind that holds the restriction', () => {
			expect(refused(rows(seq(field('left', sym('atom')), str(':'), field('right', sym('atom')))), ROW)).toEqual(
				refusal("'atom' narrows in place, but the item holds it at 2 positions (in row)")
			);
		});

		it('through a hidden rule the item holds at two positions', () => {
			const slots = rows(seq(field('left', sym('_slot')), str(':'), field('right', sym('_slot'))), { _slot: choice(sym('atom'), sym('filler')) });
			expect(refused(slots, ROW)).toEqual(refusal("'atom' narrows in place, but the item holds it at 2 positions (in _slot)"));
		});

		it('through a hidden rule the narrowing does not walk', () => {
			const beside = rows(seq(field('left', sym('_other')), str(':'), field('right', sym('atom'))), { _other: seq(str('<'), sym('atom'), str('>')) });
			expect(refused(beside, ROW)).toEqual(refusal("'atom' narrows in place, but the item holds it at 2 positions (in _other, row)"));
		});

		it('through a supertype the narrowing does not walk', () => {
			const grammar = { ...rows(seq(field('left', sym('_other')), str(':'), field('right', sym('atom'))), { _other: choice(sym('atom'), sym('filler')) }), supertypes: ['_other'] };
			expect(refused(grammar, ROW)).toEqual(refusal("'atom' narrows in place, but the item holds it at 2 positions (in _other, row)"));
		});

		it.each([
			['a supertype', { supertypes: ['wrapper'] }],
			['an inline rule', { inline: [{ type: 'SYMBOL', name: 'wrapper' }] }]
		])('through %s of any name, which the parse tree does not show', (_, lists) => {
			const grammar = { ...rows(seq(field('left', sym('wrapper')), str(':'), field('right', sym('atom'))), { wrapper: choice(sym('atom'), sym('filler')) }), ...lists };
			expect(refused(grammar, ROW)).toEqual(refusal("'atom' narrows in place, but the item holds it at 2 positions (in row, wrapper)"));
		});

		it('under a recursive hidden rule, which is a sequence the split cannot divide', () => {
			const nested = rows(seq(field('right', sym('_nest'))), { _nest: choice(sym('atom'), seq(str('('), sym('_nest'), str(')'))) });
			expect(refused(nested, ROW)).toEqual(refusal("'atom' sits where the split cannot divide it"));
		});

		it('inside itself, recursively', () => {
			const recursive = rows(seq(field('right', sym('atom'))), { atom: field('value', choice(sym('self'), sym('other'), seq(str('('), sym('atom'), str(')')))) });
			expect(refused(recursive, ROW)).toEqual(refusal("'atom' narrows in place, but the item holds it at 2 positions (in atom, row)"));
		});
	});

	describe('two leads over one grammar', () => {
		const twoLists = withRules(named(field('name', choice(sym('self'), sym('other'), sym('plain')))), {
			source_file: repeat(choice(sym('function_item'), sym('method_item'))),
			method_item: seq(str('m'), field('parameters', sym('method_params'))),
			method_params: separatedList(sym('parameter')),
			plain: str('plain')
		});

		it('refuses narrowing in place a kind an earlier lead holds in its item, and keeps the earlier lead', () => {
			const applied = viaEdits(twoLists, {
				method_params: { '.': lead('item', 'receiver', match('parameter', { name: [match('self')] })) },
				params: { '.': lead('item', 'context', match('parameter', { name: [match('other')] })) }
			});
			expect(applied.diagnostics.map((d) => [d.code, d.message])).toEqual([
				['edit-site-conflict', "lead 'params.context': 'parameter' narrows in place, but the lead on 'method_params' holds it in its item"]
			]);
			expect(applied.rules._method_params_receiver).toBeDefined();
			expect(applied.rules._params_context).toBeUndefined();
			expect(applied.rules._parameter_context).toBeUndefined();
		});

		it('refuses one copy narrowed two ways', () => {
			expect(
				refused(twoLists, {
					method_params: { '.': lead('item', 'receiver', match('parameter', { name: [match('self')] })) },
					params: { '.': lead('item', 'receiver', match('parameter', { name: [match('other')] })) }
				})
			).toEqual([['edit-site-conflict', "lead 'params.receiver': 'parameter' narrows two ways to '_parameter_receiver'"]]);
		});
	});

	it('refuses an admitted kind inside a hidden sequence, which the split cannot divide', () => {
		const prefixed = withRules(named(field('name', sym('_name'))), {
			_name: choice(sym('self'), sym('_prefixed_self'), sym('other')),
			_prefixed_self: seq(blankChoice(str('&')), sym('self'))
		});
		expect(refused(prefixed, NAMED)).toEqual([['narrow-invalid', "lead 'params.receiver': 'self' sits where the split cannot divide it"]]);
	});

	it('refuses an admitted kind inside a supertype or inline rule of any name, which the narrowing does not walk', () => {
		const wrapped = (lists: Record<string, unknown>) => ({
			...withRules(named(field('name', sym('_name'))), { _name: choice(sym('wrapper'), sym('other')), wrapper: choice(sym('self'), sym('identifier')) }),
			...lists
		});
		const refusal = [['narrow-invalid', "lead 'params.receiver': 'self' sits where the split cannot divide it"]];
		expect(refused(wrapped({ supertypes: ['wrapper'] }), NAMED)).toEqual(refusal);
		expect(refused(wrapped({ inline: ['wrapper'] }), NAMED)).toEqual(refusal);
	});

	it.each(['PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC'])('refuses an admitted kind inside a transparent rule under %s', (type) => {
		const grammar = {
			...withRules(named(seq(field('name', sym('_name')), str(':'))), {
				_name: choice(sym('self'), sym('_prefixed'), sym('other')),
				_prefixed: seq(blankChoice(str('&')), { type, value: 1, content: sym('wrapper') }),
				wrapper: choice(sym('self'), sym('identifier'))
			}),
			inline: ['wrapper']
		};
		expect(refused(grammar, NAMED)).toEqual([['narrow-invalid', "lead 'params.receiver': 'self' sits where the split cannot divide it"]]);
	});

	it("is edit-site-missing for a list that names no rule, through wire's key check", () => {
		expect(refused(rust(), { parameter_list: { '.': lead('item', 'receiver', match('parameter')) } }).map(([code]) => code)).toEqual(['edit-site-missing']);
	});

	it('is edit-entry-invalid at any path but the list itself', () => {
		const applied = viaEdits(rust(), { parameters: { '1': lead('item', 'receiver', match('parameter')) } });
		expect(applied.diagnostics).toEqual([
			expect.objectContaining({ code: 'edit-entry-invalid', severity: 'fail', grammar: 'rusty', ownerKind: 'parameters', details: { kind: 'parameters', path: '1' } })
		]);
		expect(applied.rules).toEqual(rulesOf(rust()));
	});
});

describe('leadGrammar, the bindings adapter over the lead verb', () => {
	const RUST_LEAD = leadRecord(
		'parameters_elements',
		'item',
		'receiver',
		match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'typed_self_parameter')])
	);

	it('gives the rules, rule order and provenance the entry gives', () => {
		const bound = leadGrammar(rust(), [RUST_LEAD]);
		const entries = viaEdits(rust(), RUST);
		expect(JSON.stringify(bound.rules)).toBe(JSON.stringify(entries.rules));
		const provenance = provenanceOf(entries.effects, entries.rules);
		expect(bound.leadFrom).toEqual(provenance.leadFrom);
		expect(bound.bindingEffects).toEqual(provenance.bindingEffects);
	});

	it('leaves a grammar with no leads as it is', () => {
		const grammar = rust();
		expect(leadGrammar(grammar, [])).toBe(grammar);
	});

	it('throws a refusal naming the lead and the reason, which leadIssue returns', () => {
		const unfielded = withRules(rust(), { parameters: seq(str('('), sym('parameters_elements'), str(')')) });
		expect(() => leadGrammar(unfielded, [RUST_LEAD])).toThrow(new LeadRefusal("'parameters' holds the list other than as a field's content", RUST_LEAD));
		expect(() => leadGrammar(unfielded, [RUST_LEAD])).toThrow("bind: lead 'parameters_elements.receiver': 'parameters' holds the list other than as a field's content");
	});
});
