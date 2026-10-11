import { describe, expect, it } from 'vitest';
import { type GrammarInput, type ModelNode, type ModelSlot, derive, readBindings, resolveRoutes } from '../index.ts';

const slot = (name: string, kinds: readonly string[], extra: Partial<ModelSlot> = {}): ModelSlot => ({
	name,
	propertyName: name,
	required: true,
	multiple: false,
	storage: 'verbatim',
	kinds,
	terminals: [],
	...extra
});

const node = (kind: string, slots: readonly ModelSlot[] = [], extra: Partial<ModelNode> = {}): ModelNode => ({
	kind,
	modelType: 'branch',
	slots,
	subtypes: [],
	elementKinds: [],
	enumMembers: [],
	text: null,
	pattern: null,
	variantOf: null,
	shownAs: [],
	...extra
});

const MODEL = [
	node('function_definition', [
		slot('name', ['identifier']),
		slot('modifiers', ['modifiers'], { required: false }),
		slot('body', ['block']),
		slot('comment', ['comment'], { required: false })
	]),
	node('modifiers', [slot('items', ['async_keyword', 'static_keyword'], { multiple: true, terminals: ['async', 'static'] })]),
	node('binary', [slot('left', ['expr']), slot('operator', [], { terminals: ['+', '-'] }), slot('right', ['expr'])]),
	node('list_of', [slot('items', ['identifier'], { multiple: true })]),
	node('wrapper', [slot('inner', ['identifier'])], { modelType: 'envelope' }),
	node('values', [slot('first', ['identifier']), slot('rest', ['identifier'], { multiple: true })], { modelType: 'list', elementKinds: ['identifier'] }),
	node('class_definition', [slot('body', ['block'])]),
	node('decorated', [slot('items', ['function_definition'], { multiple: true })]),
	node('block', [slot('statements', ['function_definition'], { multiple: true })]),
	node('comment'),
	node('outer', [slot('mid', ['middle'])]),
	node('holder', [slot('item', ['_operation'])]),
	node('_operation', [], { modelType: 'supertype', subtypes: ['binary'] }),
	node('middle', [slot('inner', ['binary'])]),
	node('identifier'),
	node('expr'),
	node('params', [slot('items', ['_param', 'parameter'], { multiple: true })]),
	node('_param', [], { modelType: 'supertype', subtypes: ['identifier', 'mut_pattern'] }),
	node('let_decl', [slot('pattern', ['_param']), slot('value', ['expr'])]),
	node('mut_pattern'),
	node('parameter'),
	node('members', [], { modelType: 'list', elementKinds: ['_param'] }),
	node('choice_holder', [slot('part', ['modifiers', 'identifier'])]),
	node('bool', [], {
		modelType: 'enum',
		enumMembers: [
			{ kind: 'true_keyword', text: 'true' },
			{ kind: 'false_keyword', text: 'false' }
		]
	}),
	node('true_keyword', [], { modelType: 'keyword', text: 'true' }),
	node('_struct', [], { modelType: 'supertype', subtypes: ['struct_unit', 'struct_tuple', 'struct_named'] }),
	node('struct_unit', [slot('name', ['identifier'])], { variantOf: '_struct' }),
	node('struct_tuple', [slot('name', ['identifier']), slot('fields', ['identifier'], { multiple: true })], { variantOf: '_struct' }),
	node('struct_named', [slot('name', ['identifier'])], { variantOf: '_struct' }),
	node('arrow', [slot('param', ['arrow_param'])]),
	node('arrow_param', [slot('name', ['identifier'])], { variantOf: 'arrow' }),
	node('_template_text', [], { modelType: 'pattern', shownAs: ['text_fragment'] }),
	node('_quoted_text', [], { modelType: 'pattern', shownAs: ['text_fragment'] }),
	node('text_fragment', [], { modelType: 'pattern' }),
	node('_plain_text', [], { modelType: 'pattern' }),
	node('plain_text', [], { modelType: 'pattern' }),
	node('plain_holder', [slot('text', ['_plain_text'])]),
	node('shown_holder', [slot('text', ['_template_text'])]),
	node('false_keyword', [], { modelType: 'keyword', text: 'false' }),
	node('_decl', [], { modelType: 'supertype', subtypes: ['decl_plain', '_decl_default'] }),
	node('decl_plain', [slot('name', ['identifier'])], { variantOf: '_decl' }),
	node('_decl_default', [], { modelType: 'supertype', subtypes: ['default_fn'], variantOf: '_decl' }),
	node('default_fn', [slot('declaration', ['identifier'])], { variantOf: '_decl_default' }),
	node('_clause', [], { modelType: 'supertype', subtypes: ['clause_bare', 'clause_paren'] }),
	node('clause_bare', [slot('item', ['identifier'], { propertyName: 'items', multiple: true })], { modelType: 'list', elementKinds: ['identifier'], variantOf: '_clause' }),
	node('clause_paren', [slot('wrapped', ['clause_items'])], { modelType: 'envelope', variantOf: '_clause' }),
	node('clause_items', [slot('item', ['identifier'], { propertyName: 'items', multiple: true })], { modelType: 'list', elementKinds: ['identifier'] }),
	node('range', [slot('start', ['expr']), slot('dots', ['_dots'])]),
	node('_dots', [], { modelType: 'punctuation', text: '..' }),
	node('span', [slot('lo', ['expr']), slot('op', ['_dotdot', '_dotdoteq'])]),
	node('_dotdot', [], { modelType: 'punctuation', text: '..' }),
	node('_dotdoteq', [], { modelType: 'punctuation', text: '..=' }),
	node('private_name', [slot('content', [])]),
	node('scoped_name', [slot('path', ['identifier']), slot('name', ['identifier'])]),
	node('char_text', [slot('content', [])]),
	node('call_x', [slot('function', ['field_expr', 'path_expr', 'identifier']), slot('args', ['expr'])]),
	node('field_expr'),
	node('path_expr'),
	node('impl_x', [slot('trait', ['type_x'], { required: false }), slot('body', ['block']), slot('clause', ['clause_pos', 'clause_neg'], { required: false })]),
	node('clause_pos', [slot('trait', ['type_x'])]),
	node('clause_neg', [slot('trait', ['type_x'])]),
	node('type_x'),
	node('cmp', [slot('left', ['expr']), slot('ops', ['cmp_op'], { multiple: true })]),
	node('cmp_op', [slot('operators', [], { terminals: ['==', '<'] })]),
	node('maybe_op', [slot('left', ['expr']), slot('operator', [], { required: false, terminals: ['+', '-'] }), slot('bang', [], { required: false, terminals: ['!'] })])
];

const grammar = async (bindings: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(bindings),
	model: new Map(MODEL.map((n) => [n.kind, n])),
	textTokens: new Set(),
	layoutSlots: [{ kind: null, slot: 'comment' }]
});

describe('resolveRoutes', () => {
	it('orders a kind\'s read entries placed-and-predicate, predicate, placed, literals, then plain, ties in file order', async () => {
		const routes = resolveRoutes(
			await grammar(
				[
					'(function_definition) @declaration.function',
					'(class_definition body: (block (function_definition) @declaration.method))',
					'((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))',
					'((function_definition name: (identifier) @name) @declaration.method.dunder (#match? @name "^__(?<stem>.*)__$"))',
					'(decorated (function_definition name: (identifier) @name) @declaration.method.static (#eq? @name "staticmethod"))',
					'(binary operator: "+" @operator) @expression.binary.add',
					'(binary) @expression.binary'
				].join('\n')
			)
		);
		expect(routes.readEntries.get('function_definition')?.map((e) => e.vocab)).toEqual([
			'declaration.method.static',
			'declaration.constructor',
			'declaration.method.dunder',
			'declaration.method',
			'declaration.function'
		]);
		expect(routes.readEntries.get('binary')?.map((e) => e.vocab)).toEqual(['expression.binary.add', 'expression.binary']);
	});

	it('enters a placed wildcard claim on every concrete kind its holder admits there, in the ruled order', async () => {
		const routes = resolveRoutes(await grammar(['(identifier) @expression.identifier', '(params (_) @declaration.parameter)'].join('\n')));
		expect(routes.readEntries.has('_')).toBe(false);
		expect(routes.readEntries.get('identifier')?.map((e) => e.vocab)).toEqual(['declaration.parameter', 'expression.identifier']);
		expect(routes.readEntries.get('mut_pattern')?.map((e) => [e.kind, e.vocab])).toEqual([['mut_pattern', 'declaration.parameter']]);
		expect(routes.readEntries.get('parameter')?.map((e) => e.vocab)).toEqual(['declaration.parameter']);
	});

	it('leaves a wildcard claim off a kind that already claims the same path itself', async () => {
		const routes = resolveRoutes(await grammar(['(parameter) @declaration.parameter', '(params (_) @declaration.parameter)'].join('\n')));
		expect(routes.readEntries.get('parameter')?.map((e) => e.claim.kind)).toEqual(['parameter']);
		expect(routes.readEntries.get('identifier')?.map((e) => e.claim.kind)).toEqual(['_']);
	});

	it('enters a wildcard claim under a list on the list\'s element kinds', async () => {
		const routes = resolveRoutes(await grammar('(members (_) @declaration.member)'));
		expect([...routes.readEntries.keys()].sort()).toEqual(['identifier', 'mut_pattern']);
	});

	it('enters a wildcard claim under a field only on the kinds that field admits', async () => {
		const routes = resolveRoutes(await grammar('(let_decl pattern: (_) @declaration.variable)'));
		expect([...routes.readEntries.keys()].sort()).toEqual(['identifier', 'mut_pattern']);
	});

	it('names a kind by its first top-level claim with no predicate and no literal', async () => {
		const routes = resolveRoutes(
			await grammar(['(binary operator: "+") @expression.binary.add', '(binary) @expression.binary'].join('\n'))
		);
		expect(routes.vocabOf.get('binary')).toBe('expression.binary');
	});

	it('names a kind with only refining claims by their paths\' shared parent, whatever their order', async () => {
		const claims = ['(binary operator: "+") @expression.binary.add', '(binary operator: "-") @expression.binary.subtract'];
		for (const order of [claims, [...claims].reverse()])
			expect(resolveRoutes(await grammar(order.join('\n'))).vocabOf.get('binary')).toBe('expression.binary');
	});

	it('refuses a kind whose only claims refine different parents', async () => {
		const bindings = await grammar(['(binary operator: "+") @expression.binary.add', '(binary operator: "-") @expression.unary.negation'].join('\n'));
		expect(() => resolveRoutes(bindings)).toThrow(/binary.*expression\.binary.*expression\.unary/);
	});

	it('pins a field literal and a token held by a slot, each under the member name of its slot', async () => {
		const routes = resolveRoutes(
			await grammar(['(binary operator: "+") @expression.binary.add', '(binary left: (_) @lhs) @expression.binary'].join('\n'))
		);
		expect(routes.readEntries.get('binary')?.[0]?.pins).toEqual([{ member: 'operator', slot: 'operator', text: '+' }]);
	});

	it('routes every non-layout slot by its member name, renames applied, and builds each back through its own slot', async () => {
		const routes = resolveRoutes(await grammar('(binary left: (_) @lhs) @expression.binary'));
		expect(routes.members.get('binary')).toEqual([
			{ route: 'slot', name: 'lhs', slot: MODEL[2]!.slots[0], path: [{ owner: 'binary', slot: 'left' }] },
			{ route: 'slot', name: 'operator', slot: MODEL[2]!.slots[1], path: [{ owner: 'binary', slot: 'operator' }] },
			{ route: 'slot', name: 'right', slot: MODEL[2]!.slots[2], path: [{ owner: 'binary', slot: 'right' }] }
		]);
	});

	it('leaves out layout slots and the slots a deep member routes through, and routes a presence through its token', async () => {
		const routes = resolveRoutes(
			await grammar('(function_definition (modifiers "async" @isAsync)) @declaration.function')
		);
		const members = routes.members.get('function_definition') ?? [];
		expect(members.map((m) => m.name)).toEqual(['name', 'body', 'isAsync']);
		expect(members[2]).toEqual({
			route: 'presence',
			name: 'isAsync',
			via: [{ field: null, kind: 'modifiers', after: null, anchor: null }],
			token: 'async',
			path: [
				{ owner: 'function_definition', slot: 'modifiers' },
				{ owner: 'modifiers', slot: 'items' }
			]
		});
	});

	it('takes only the arm a deep member routes through, and keeps the slot\'s other arms', async () => {
		const routes = resolveRoutes(await grammar('(choice_holder (modifiers "async" @isAsync)) @declaration.function'));
		const members = routes.members.get('choice_holder') ?? [];
		expect(members.map((m) => m.name)).toEqual(['part', 'isAsync']);
		expect(members[0]).toEqual({
			route: 'slot',
			name: 'part',
			slot: slot('part', ['identifier']),
			except: ['modifiers'],
			path: [{ owner: 'choice_holder', slot: 'part' }]
		});
	});

	it('routes a flag through the slot its first capture names, testing that slot\'s kind', async () => {
		const routes = resolveRoutes(await grammar('(function_definition) @declaration.function\n(function_definition name: (identifier) @name @private)'));
		expect(routes.members.get('function_definition')?.find((m) => m.name === 'private')).toEqual({
			route: 'kind',
			name: 'private',
			kind: 'identifier',
			path: [{ owner: 'function_definition', slot: 'name' }]
		});
	});


	it('gives an alias envelope of a leaf no members: its text is its own value', async () => {
		const model = new Map(MODEL.map((n) => [n.kind, n]));
		model.set('word', node('word', [], { modelType: 'pattern', pattern: '[a-z]+' }));
		model.set('field_name', node('field_name', [slot('content', ['word'])], { modelType: 'alias' }));
		model.set('wrapped', node('wrapped', [slot('content', ['binary'])], { modelType: 'alias' }));
		const input = { ...(await grammar('(field_name) @identifier.field\n(wrapped) @expression.wrapped')), model };
		const routes = resolveRoutes(input);
		expect(routes.members.get('field_name')).toEqual([]);
		expect(routes.members.get('wrapped')?.map((m) => m.name)).toEqual(['content']);
	});

	it('builds a nested member back from the owner outward, though the facts name its route nearest first', async () => {
		const routes = resolveRoutes(await grammar('(outer (middle (binary left: (_) @lhs))) @expression.outer'));
		const member = routes.members.get('outer')?.find((m) => m.name === 'lhs');
		expect(member?.route === 'nested' ? member.via.map((step) => step.kind) : undefined).toEqual(['binary', 'middle']);
		expect(member?.path).toEqual([
			{ owner: 'outer', slot: 'mid' },
			{ owner: 'middle', slot: 'inner' },
			{ owner: 'binary', slot: 'left' }
		]);
	});

	it('steps through a slot that admits the next kind by a supertype', async () => {
		const routes = resolveRoutes(await grammar('(holder (binary left: (_) @lhs)) @expression.holder'));
		expect(routes.members.get('holder')?.find((m) => m.name === 'lhs')?.path).toEqual([
			{ owner: 'holder', slot: 'item' },
			{ owner: 'binary', slot: 'left' }
		]);
	});

	it('routes no member through a list\'s item slot: a claimed list\'s items are its container content', async () => {
		const routes = resolveRoutes(await grammar('(values) @expression.tuple'));
		expect(routes.members.get('values')).toEqual([]);
	});

	it('builds a deep member back through the anchored first node of a slot that holds many, a list\'s included', async () => {
		const routes = resolveRoutes(await grammar('(block . (function_definition name: (identifier) @first)) @statement.block'));
		expect(routes.members.get('block')?.find((m) => m.name === 'first')?.path).toEqual([
			{ owner: 'block', slot: 'statements', anchor: 'first' },
			{ owner: 'function_definition', slot: 'name' }
		]);
	});

	it('cannot build a deep member back through a slot that holds many', async () => {
		const routes = resolveRoutes(await grammar('(block (function_definition name: (identifier) @first)) @statement.block'));
		const member = routes.members.get('block')?.find((m) => m.name === 'first');
		expect(member?.route).toBe('nested');
		expect(member?.path).toBeUndefined();
	});

	it('unwraps a declared container through its element slot, a list through its elements, and a transparent kind through its one content slot', async () => {
		const routes = resolveRoutes(await grammar('(list_of (identifier) @element)'));
		expect(routes.containers.get('list_of')).toEqual({ kinds: ['identifier'], terminals: [], list: true });
		expect(routes.containers.get('values')).toEqual({ kinds: ['identifier'], terminals: [], list: true });
		expect(routes.containers.get('wrapper')).toEqual({ kinds: ['identifier'], terminals: [], list: false });
		expect(routes.containers.has('binary')).toBe(false);
	});

	it('enters a claim on a kind the reader stores as its member\'s kind id on each member, an equality on its text decided by the member\'s', async () => {
		const routes = resolveRoutes(
			await grammar(['(bool) @literal.boolean', '((bool) @literal.boolean.true (#eq? @literal.boolean.true "true"))'].join('\n'))
		);
		expect(routes.readEntries.has('bool')).toBe(false);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.claimed)).toEqual(['bool', 'bool']);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean.true', 'literal.boolean']);
		expect(routes.readEntries.get('false_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean']);
	});

	it('enters a claim on a kind on each variant the kind owns, unless the variant has a claim of its own', async () => {
		const routes = resolveRoutes(await grammar(['(_struct) @declaration.struct', '(struct_named) @declaration.struct.named'].join('\n')));
		expect(routes.readEntries.get('struct_unit')?.map((e) => [e.claimed, e.vocab])).toEqual([['_struct', 'declaration.struct']]);
		expect(routes.readEntries.get('struct_tuple')?.map((e) => [e.claimed, e.vocab])).toEqual([['_struct', 'declaration.struct']]);
		expect(routes.members.get('struct_tuple')?.map((r) => r.name)).toEqual(['name', 'fields']);
		expect(routes.readEntries.get('struct_named')?.map((e) => e.vocab)).toEqual(['declaration.struct.named']);
	});

	it('enters no claim on a variant of a branch: the variant is a part of its owner, not a form', async () => {
		const routes = resolveRoutes(await grammar('(arrow) @expression.lambda'));
		expect(routes.readEntries.has('arrow_param')).toBe(false);
	});

	it('carries a supertype claim\'s field renames to each form it reaches', async () => {
		const routes = resolveRoutes(await grammar('(_struct name: (_) @title) @declaration.struct'));
		expect(routes.members.get('struct_unit')?.map((r) => r.name)).toEqual(['title']);
		expect(routes.members.get('struct_tuple')?.map((r) => r.name)).toEqual(['title', 'fields']);
	});

	it('enters a claim on every kind the parser shows by the claimed name', async () => {
		const routes = resolveRoutes(await grammar('(text_fragment) @literal.string.text'));
		expect([...routes.readEntries.keys()].filter((k) => routes.readEntries.get(k)?.[0]?.vocab === 'literal.string.text').sort()).toEqual([
			'_quoted_text',
			'_template_text',
			'text_fragment'
		]);
		expect(routes.readEntries.get('_template_text')?.map((e) => e.claimed)).toEqual(['text_fragment']);
	});

	it('enters a claim pinning an enum kind\'s token only on the member that is that token', async () => {
		const routes = resolveRoutes(await grammar(['(bool) @literal.boolean', '(bool "false") @literal.boolean.false'].join('\n')));
		expect(routes.readEntries.get('false_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean.false', 'literal.boolean']);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean']);
	});

	it('leaves a pattern test on a kind the reader stores as its member\'s kind id to every member, for the read to decide', async () => {
		const routes = resolveRoutes(await grammar('((bool) @literal.boolean.true (#match? @literal.boolean.true "^t"))'));
		expect([...routes.readEntries.keys()].filter((k) => k.endsWith('_keyword')).sort()).toEqual(['false_keyword', 'true_keyword']);
	});

	it('enters a claim on the forms of a form that is itself a supertype', async () => {
		const routes = resolveRoutes(await grammar('(_decl) @statement.export'));
		expect(routes.readEntries.get('default_fn')?.map((e) => [e.claimed, e.vocab])).toEqual([['_decl', 'statement.export']]);
		expect(routes.members.get('default_fn')?.map((r) => r.name)).toEqual(['declaration']);
	});

	it('routes a list form\'s items as the member its sibling forms hold the same elements under', async () => {
		const routes = resolveRoutes(await grammar('(_clause wrapped: (_) @entries) @clause.with'));
		expect(routes.members.get('clause_paren')?.map((r) => r.name)).toEqual(['entries']);
		expect(routes.members.get('clause_bare')).toEqual([
			{ route: 'slot', name: 'entries', slot: slot('item', ['identifier'], { propertyName: 'items', multiple: true }), path: [{ owner: 'clause_bare', slot: 'item' }] }
		]);
	});

	it('routes no member through a required slot that can hold only one fixed text', async () => {
		const routes = resolveRoutes(await grammar('(range) @expression.range'));
		expect(routes.members.get('range')?.map((r) => r.name)).toEqual(['start']);
	});

	it('routes no member through a slot whose every value a refinement pins, and keeps one a refinement leaves open', async () => {
		const told = resolveRoutes(
			await grammar(['(binary) @expression.binary', '(binary operator: "+") @expression.binary.add', '(binary operator: "-") @expression.binary.subtract'].join('\n'))
		);
		expect(told.members.get('binary')?.map((r) => r.name)).toEqual(['left', 'right']);
		const open = resolveRoutes(await grammar(['(binary) @expression.binary', '(binary operator: "+") @expression.binary.add'].join('\n')));
		expect(open.members.get('binary')?.map((r) => r.name)).toEqual(['left', 'operator', 'right']);
	});

	it('routes no member through an optional slot whose every value a refinement pins, and keeps an optional one-value slot as its presence', async () => {
		const routes = resolveRoutes(
			await grammar(['(maybe_op) @expression.binary', '(maybe_op operator: "+") @expression.binary.add', '(maybe_op operator: "-") @expression.binary.subtract'].join('\n'))
		);
		expect(routes.members.get('maybe_op')?.map((r) => r.name)).toEqual(['left', 'bang']);
	});

	it('routes no member through a slot that holds only text on a kind read as an identifier, and keeps its node slots', async () => {
		const routes = resolveRoutes(await grammar(['(private_name) @identifier.property', '(scoped_name) @identifier.scoped', '(char_text) @literal.char'].join('\n')));
		expect(routes.members.get('private_name')).toEqual([]);
		expect(routes.members.get('scoped_name')?.map((r) => r.name)).toEqual(['path', 'name']);
		expect(routes.members.get('char_text')?.map((r) => r.name)).toEqual(['content']);
	});

	it('pins a token on the slot whose fixed-text kind is that text, and counts it as a value the refinement tells', async () => {
		const routes = resolveRoutes(
			await grammar(['(span) @expression.range', '(span "..") @expression.range.exclusive', '(span "..=") @expression.range.inclusive'].join('\n'))
		);
		expect(routes.readEntries.get('span')?.map((e) => e.pins)).toEqual([
			[{ member: 'op', slot: 'op', text: '..' }],
			[{ member: 'op', slot: 'op', text: '..=' }],
			[]
		]);
		expect(routes.members.get('span')?.map((r) => r.name)).toEqual(['lo']);
	});

	it('routes no member through a slot a claim marks @dropped, on each form the claim reaches', async () => {
		const routes = resolveRoutes(await grammar('(binary left: (_) @dropped) @expression.binary\n(_struct name: (_) @dropped) @declaration.struct'));
		expect(routes.members.get('binary')?.map((r) => r.name)).toEqual(['operator', 'right']);
		expect(routes.members.get('struct_tuple')?.map((r) => r.name)).toEqual(['fields']);
	});

	it('tests a child of a narrower kind than its slot holds, and orders that entry before the plain one', async () => {
		const routes = resolveRoutes(await grammar(['(call_x) @expression.call', '(call_x function: (field_expr)) @expression.call.member'].join('\n')));
		const entries = routes.readEntries.get('call_x') ?? [];
		expect(entries.map((e) => e.vocab)).toEqual(['expression.call.member', 'expression.call']);
		expect(entries[0]?.children).toEqual([{ subject: { up: 0, down: [{ field: 'function', kind: 'field_expr', after: null, anchor: null }] }, kinds: ['field_expr'] }]);
		expect(routes.vocabOf.get('call_x')).toBe('expression.call');
	});

	it('tests no child the model already guarantees: a required slot that holds only that kind, or a required field', async () => {
		const routes = resolveRoutes(await grammar('(call_x args: (expr)) @expression.call\n(impl_x body: (_)) @declaration.extension'));
		expect(routes.readEntries.get('call_x')?.[0]?.children).toEqual([]);
		expect(routes.readEntries.get('impl_x')?.[0]?.children).toEqual([]);
	});

	it('tests a member capture on an optional slot only against the other kinds the slot holds', async () => {
		const routes = resolveRoutes(await grammar('(impl_x trait: (type_x) @implements) @declaration.extension\n(impl_x clause: (clause_pos) @clause) @declaration.extension.positive'));
		const [positive, plain] = routes.readEntries.get('impl_x') ?? [];
		expect(plain?.children).toEqual([]);
		expect(positive?.children).toEqual([{ subject: { up: 0, down: [{ field: 'clause', kind: 'clause_pos', after: null, anchor: null }] }, excludes: ['clause_neg'] }]);
	});

	it('tests an optional field\'s presence as any kind it holds', async () => {
		const routes = resolveRoutes(await grammar('(impl_x trait: (_)) @declaration.extension.conformance'));
		expect(routes.readEntries.get('impl_x')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: 'trait', kind: null, after: null, anchor: null }] }, kinds: ['type_x'] }
		]);
	});

	it('tests nothing below a wildcard that every kind it may be guarantees, and gives a supertype\'s own entry no child test', async () => {
		const routes = resolveRoutes(await grammar('(impl_x clause: (_ trait: (_))) @declaration.extension.conformance\n(_struct (identifier)) @declaration.struct'));
		expect(routes.readEntries.get('impl_x')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: 'clause', kind: null, after: null, anchor: null }] }, kinds: ['clause_neg', 'clause_pos'] }
		]);
		expect(routes.readEntries.get('_struct')?.[0]?.children).toEqual([]);
	});

	it('tests a field literal through a child, and not the child the slot can only hold', async () => {
		const routes = resolveRoutes(await grammar('(cmp (cmp_op operators: "==")) @expression.binary.equal'));
		const step = { field: null, kind: 'cmp_op', after: null, anchor: null };
		expect(routes.readEntries.get('cmp')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [step, { field: 'operators', kind: null, after: null, anchor: null }] }, text: '==' }
		]);
	});

	it('keeps the template a templated claim builds from', async () => {
		const routes = resolveRoutes(
			await grammar('((function_definition name: (identifier) @name) @declaration.method.dunder (#match? @name "^__(?<stem>.*)__$"))')
		);
		expect(routes.readEntries.get('function_definition')?.[0]?.template).toMatchObject({ holes: ['stem'] });
	});
});

describe('derive', () => {
	it('types a flag as an optional boolean member of the claimed kind', async () => {
		const d = derive([await grammar('(function_definition) @declaration.function\n(function_definition name: (identifier) @name @private)')]);
		const flag = d.members.get('declaration.function')?.get('private');
		expect([...(flag?.kinds ?? [])]).toEqual(['boolean']);
		expect(flag?.optional).toBe(true);
	});

	it('types a member optional unless every kind the path is read from carries it', async () => {
		const d = derive([await grammar('(_struct) @declaration.struct')]);
		expect(d.members.get('declaration.struct')?.get('fields')?.optional).toBe(true);
		expect(d.members.get('declaration.struct')?.get('name')?.optional).toBe(false);
	});

	it('types a member by the kind the parser shows, never by a name with its underscores stripped', async () => {
		const d = derive([
			await grammar(
				['(plain_text) @literal.string.plain', '(text_fragment) @literal.string.text', '(plain_holder) @statement.plain', '(shown_holder) @statement.shown'].join('\n')
			)
		]);
		expect([...(d.members.get('statement.shown')?.get('text')?.kinds ?? [])]).toEqual(['literal.string.text']);
		expect([...(d.members.get('statement.plain')?.get('text')?.kinds ?? [])]).toEqual(['<g:_plain_text>']);
	});
});

