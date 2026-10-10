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
	node('false_keyword', [], { modelType: 'keyword', text: 'false' })
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
			via: ['modifiers'],
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


	it('builds a nested member back from the owner outward, though the facts name its route nearest first', async () => {
		const routes = resolveRoutes(await grammar('(outer (middle (binary left: (_) @lhs))) @expression.outer'));
		const member = routes.members.get('outer')?.find((m) => m.name === 'lhs');
		expect(member?.route === 'nested' ? member.via : undefined).toEqual(['binary', 'middle']);
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

	it('enters a claim pinning an enum kind\'s token only on the member that is that token', async () => {
		const routes = resolveRoutes(await grammar(['(bool) @literal.boolean', '(bool "false") @literal.boolean.false'].join('\n')));
		expect(routes.readEntries.get('false_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean.false', 'literal.boolean']);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean']);
	});

	it('leaves a pattern test on a kind the reader stores as its member\'s kind id to every member, for the read to decide', async () => {
		const routes = resolveRoutes(await grammar('((bool) @literal.boolean.true (#match? @literal.boolean.true "^t"))'));
		expect([...routes.readEntries.keys()].filter((k) => k.endsWith('_keyword')).sort()).toEqual(['false_keyword', 'true_keyword']);
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
});

