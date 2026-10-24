import { describe, expect, it } from 'vitest';
import { type GrammarInput, type ModelNode, type ModelSlot, type Vocabulary, type VocabularyMember, canonicalFacts, derive, readBindings, resolveFlags, resolveRoutes, unenteredForms } from '../index.ts';

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
	node('predefined', [], {
		modelType: 'enum',
		enumMembers: [
			{ kind: 'unique_symbol', text: 'unique symbol' },
			{ kind: 'symbol_kw', text: 'symbol' }
		]
	}),
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
	node('cmp_op', [slot('operators', [], { terminals: ['==', '<'] }), slot('value', ['expr'])]),
	node('trio', [slot('head', ['expr']), slot('mid', ['identifier'], { required: false }), slot('tail', ['expr'], { multiple: true })]),
	node('rng', [slot('left', ['expr']), slot('content', ['rng_right', '_dots'])]),
	node('rng_right', [slot('op', [], { terminals: ['..=', '..'] }), slot('right', ['expr'])]),
	node('maybe_op', [slot('left', ['expr']), slot('operator', [], { required: false, terminals: ['+', '-'] }), slot('bang', [], { required: false, terminals: ['!'] })]),
	node('meth', [
		slot('access', ['access_mod'], { required: false }),
		slot('accessor', [], { required: false, terminals: ['get', 'set'] }),
		slot('name', ['identifier']),
		slot('deco', ['decorator'], { required: false })
	]),
	node('access_mod', [], {
		modelType: 'enum',
		enumMembers: [
			{ kind: 'public_kw', text: 'public' },
			{ kind: 'private_kw', text: 'private' },
			{ kind: 'protected_kw', text: 'protected' }
		]
	}),
	node('public_kw', [], { modelType: 'keyword', text: 'public' }),
	node('private_kw', [], { modelType: 'keyword', text: 'private' }),
	node('protected_kw', [], { modelType: 'keyword', text: 'protected' }),
	node('decorator'),
	node('fn_x', [slot('vis', ['vis_mod'], { required: false }), slot('name', ['identifier'])]),
	node('vis_mod', [slot('content', ['crate_kw', 'vis_pub'])], { modelType: 'polymorph' }),
	node('crate_kw', [], { modelType: 'keyword', text: 'crate' }),
	node('vis_pub', [slot('scope', ['identifier'], { required: false })], { modelType: 'envelope' }),
	node('fn_item', [slot('params', ['params_x'])]),
	node('params_x', [slot('elements', ['params_elements'], { required: false })]),
	node('params_elements', [slot('item', ['attr_param'], { propertyName: 'items', multiple: true })], { modelType: 'list', elementKinds: ['attr_param'] }),
	node('attr_param', [slot('element', ['recv_self', 'param_x'])]),
	node('recv_self'),
	node('param_x', [slot('name', ['self_kw', 'identifier'])]),
	node('self_kw', [], { modelType: 'keyword', text: 'self' })
];

const grammar = async (bindings: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(bindings),
	model: new Map(MODEL.map((n) => [n.kind, n])),
	textTokens: new Set(),
	layoutSlots: [{ kind: null, slot: 'comment' }]
});

describe('unenteredForms', () => {
	it("finds no form without its supertype's claim in the routes resolveRoutes enters", async () => {
		const input = await grammar(
			['(_struct) @declaration.struct', '((struct_named name: (_) @n) @declaration.struct.named (#eq? @n "N"))'].join(
				'\n'
			)
		);
		expect(unenteredForms(input, resolveRoutes(input))).toEqual([]);
	});

	it("reports a form left with no entry for its supertype's claim, naming the claim's path", async () => {
		const input = await grammar(
			['(_struct) @declaration.struct', '((struct_named name: (_) @n) @declaration.struct.named (#eq? @n "N"))'].join(
				'\n'
			)
		);
		const routes = resolveRoutes(input);
		const readEntries = new Map(routes.readEntries);
		readEntries.set('struct_named', (readEntries.get('struct_named') ?? []).filter((e) => e.claimed !== '_struct'));
		expect(unenteredForms(input, { ...routes, readEntries })).toEqual([
			"g: struct_named has no entry for its supertype _struct's claim @declaration.struct, so it reads by no path there when no claim of its own holds"
		]);
	});
});

describe('resolveRoutes', () => {
	it('reads a receiver claimed once per arm exactly: a first parameter not named self is no method', async () => {
		const routes = resolveRoutes(
			await grammar(
				[
					'(fn_item (params_x (params_elements . (attr_param (recv_self)) @receiver))) @declaration.method',
					'(fn_item (params_x (params_elements . (attr_param (param_x name: (self_kw))) @receiver))) @declaration.method'
				].join('\n')
			)
		);
		const tests = (routes.readEntries.get('fn_item') ?? []).map((entry) =>
			entry.children.flatMap((child) =>
				'kinds' in child ? [{ field: child.subject.down.at(-1)?.field ?? null, kinds: child.kinds }] : []
			)
		);
		expect(tests).toContainEqual(expect.arrayContaining([{ field: null, kinds: ['recv_self'] }]));
		expect(tests).toContainEqual(expect.arrayContaining([{ field: 'name', kinds: ['self_kw'] }]));
		expect(tests.every((entry) => entry.some(({ kinds }) => kinds.includes('recv_self') || kinds.includes('self_kw')))).toBe(true);
	});

	it("orders a kind's read entries placed-and-predicate, predicate, placed, literals, then plain, ties in file order", async () => {
		const routes = resolveRoutes(
			await grammar(
				[
					'(function_definition) @declaration.function',
					'(class_definition body: (block (function_definition) @declaration.method))',
					'((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))',
					'((function_definition name: (identifier) @name) @declaration.method.special (#match? @name "^__(?<stem>.*)__$"))',
					'(decorated (function_definition name: (identifier) @name) @declaration.method.static (#eq? @name "staticmethod"))',
					'(binary operator: "+" @operator) @expression.binary.add',
					'(binary) @expression.binary'
				].join('\n')
			)
		);
		expect(routes.readEntries.get('function_definition')?.map((e) => e.vocab)).toEqual([
			'declaration.method.static',
			'declaration.constructor',
			'declaration.method.special',
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

	it("enters a wildcard claim under a list on the list's element kinds", async () => {
		const routes = resolveRoutes(await grammar('(members (_) @declaration.member)'));
		expect([...routes.readEntries.keys()].sort()).toEqual(['identifier', 'mut_pattern']);
	});

	it('enters a wildcard claim under a field only on the kinds that field admits', async () => {
		const routes = resolveRoutes(await grammar('(let_decl pattern: (_) @declaration.variable)'));
		expect([...routes.readEntries.keys()].sort()).toEqual(['identifier', 'mut_pattern']);
	});

	it("tries an entry whose tests include another's ahead of it, the refinement before the claim it refines, whatever their file order", async () => {
		const routes = resolveRoutes(
			await grammar(
				[
					'(meth) @declaration.method',
					'(meth accessor: "get") @declaration.method.getter',
					'(meth accessor: "get" (decorator)) @declaration.method.getter.decorated',
					'((meth name: (identifier) @name) @declaration.constructor (#eq? @name "constructor"))',
					'((meth name: (identifier) @name (decorator)) @declaration.constructor.decorated (#eq? @name "constructor"))',
					'(decorated (function_definition name: (identifier) @name) @declaration.method.static (#eq? @name "staticmethod"))',
					'(decorated (function_definition name: (identifier) @name (modifiers)) @declaration.method.static.modified (#eq? @name "staticmethod"))'
				].join('\n')
			)
		);
		expect(routes.readEntries.get('meth')?.map((e) => e.vocab)).toEqual([
			'declaration.constructor.decorated',
			'declaration.constructor',
			'declaration.method.getter.decorated',
			'declaration.method.getter',
			'declaration.method'
		]);
		expect(routes.readEntries.get('function_definition')?.map((e) => e.vocab)).toEqual(['declaration.method.static.modified', 'declaration.method.static']);
	});

	it('names a kind by its first top-level claim with no predicate and no literal', async () => {
		const routes = resolveRoutes(
			await grammar(['(binary operator: "+") @expression.binary.add', '(binary) @expression.binary'].join('\n'))
		);
		expect(routes.vocabOf.get('binary')).toBe('expression.binary');
	});

	it("names a kind with only refining claims by their paths' shared parent, whatever their order", async () => {
		const claims = [
			'(binary operator: "+") @expression.binary.add',
			'(binary operator: "-") @expression.binary.subtract'
		];
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

	it("takes only the arm a deep member routes through, and keeps the slot's other arms", async () => {
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

	it("keeps the kinds a slot's captures name and lists the others in except", async () => {
		const routes = resolveRoutes(await grammar("(choice_holder (identifier) @part_name) @declaration.function"));
		expect(routes.members.get("choice_holder")?.find((m) => m.name === "partName")).toEqual({
			route: "slot",
			name: "partName",
			slot: slot("part", ["identifier"]),
			except: ["modifiers"],
			path: [{ owner: "choice_holder", slot: "part" }]
		});
	});

	it("keeps every kind of a slot when its capture is by field", async () => {
		const routes = resolveRoutes(await grammar("(choice_holder part: (identifier) @x) @declaration.function"));
		expect(routes.members.get("choice_holder")).toEqual([
			{ route: "slot", name: "x", slot: slot("part", ["modifiers", "identifier"]), path: [{ owner: "choice_holder", slot: "part" }] }
		]);
	});

	it("keeps every kind of a slot when its capture is a wildcard", async () => {
		const routes = resolveRoutes(await grammar("(choice_holder (_) @x) @declaration.function"));
		expect(routes.members.get("choice_holder")).toEqual([
			{ route: "slot", name: "x", slot: slot("part", ["modifiers", "identifier"]), path: [{ owner: "choice_holder", slot: "part" }] }
		]);
	});

	it("leaves a single-kind slot unnarrowed", async () => {
		const routes = resolveRoutes(await grammar("(function_definition (identifier) @x) @declaration.function"));
		expect(routes.members.get("function_definition")?.find((m) => m.name === "x")).toEqual({
			route: "slot",
			name: "x",
			slot: slot("name", ["identifier"]),
			path: [{ owner: "function_definition", slot: "name" }]
		});
	});

describe("keptKinds over a flag capture", () => {
	const KEPT_MODEL = new Map(
		[
			node("holder", [slot("part", ["a_kind", "b_kind"])]),
			node("s_kind", [], { modelType: "supertype", subtypes: ["a_kind"] }),
			node("a_kind"),
			node("b_kind")
		].map((n) => [n.kind, n])
	);
	const KEPT_VOCABULARY: Vocabulary = {
		kinds: new Map([["declaration.function", { name: "declaration.function", own: new Map([["marked", { optional: true, flag: true }]]), parent: undefined, refines: undefined }]]),
		flags: new Set(["marked"]),
		synonyms: { levels: new Map(), flags: new Map() },
		members: (path) => (path === "declaration.function" ? new Map([["marked", { optional: true, flag: true }]]) : new Map())
	};
	const kept = async (bindings: string): Promise<GrammarInput> => ({
		grammar: "g",
		bindings: resolveFlags(await readBindings(bindings), KEPT_VOCABULARY, KEPT_MODEL),
		model: KEPT_MODEL,
		textTokens: new Set(),
		layoutSlots: []
	});
	it("ignores a flag capture, so the kind capture alone decides what the slot keeps", async () => {
		const members = resolveRoutes(await kept("(holder (a_kind) @x @marked) @declaration.function")).members.get("holder") ?? [];
		expect(members[0]).toEqual({ route: "slot", name: "x", slot: slot("part", ["a_kind"]), except: ["b_kind"], path: [{ owner: "holder", slot: "part" }] });
		expect(members[1]).toMatchObject({ name: "marked", flag: true, kind: "a_kind" });
	});
});

describe("keptKinds over a supertype the slot holds", () => {
	const SUPER_MODEL = new Map(
		[
			node("holder", [slot("part", ["s_kind", "b_kind"])]),
			node("s_kind", [], { modelType: "supertype", subtypes: ["a_kind", "c_kind"] }),
			node("a_kind"),
			node("b_kind"),
			node("c_kind")
		].map((n) => [n.kind, n])
	);
	const superGrammar = async (bindings: string): Promise<GrammarInput> => ({
		grammar: "g",
		bindings: await readBindings(bindings),
		model: SUPER_MODEL,
		textTokens: new Set(),
		layoutSlots: []
	});

	it("keeps the supertype the slot holds when the capture names one of its subtypes, and lists the other kind in except", async () => {
		const members = resolveRoutes(await superGrammar("(holder (a_kind) @x) @declaration.function")).members.get("holder");
		expect(members).toEqual([{ route: "slot", name: "x", slot: slot("part", ["s_kind"]), except: ["b_kind"], path: [{ owner: "holder", slot: "part" }] }]);
	});
});

	it("routes a flag through the slot its first capture names, testing that slot's kind", async () => {
		const routes = resolveRoutes(
			await grammar(
				'(function_definition) @declaration.function\n(function_definition name: (identifier) @name @private)'
			)
		);
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

	it("reads a claim pattern on an alias envelope of a structured kind in the stored kind's slots, through its content", async () => {
		const model = new Map(MODEL.map((n) => [n.kind, n]));
		model.set('call_env', node('call_env', [slot('content', ['call_x'])], { modelType: 'alias' }));
		model.set('bin_env', node('bin_env', [slot('content', ['binary'])], { modelType: 'alias' }));
		model.set('outer_env', node('outer_env', [slot('content', ['outer'])], { modelType: 'alias' }));
		const bindings = [
			'(call_env args: (expr)) @expression.call',
			'(bin_env) @expression.binary',
			'(bin_env "+") @expression.binary.add',
			'(outer_env (middle (binary left: (_) @lhs))) @expression.outer'
		].join('\n');
		const routes = resolveRoutes({ ...(await grammar(bindings)), model });
		expect(routes.readEntries.get('call_env')?.[0]?.children).toEqual([]);
		expect(routes.readEntries.get('bin_env')?.[0]?.pins).toEqual([{ member: 'operator', slot: 'operator', text: '+' }]);
		expect(routes.members.get('outer_env')?.find((m) => m.name === 'lhs')?.path).toEqual([
			{ owner: 'outer_env', slot: 'content' },
			{ owner: 'outer', slot: 'mid' },
			{ owner: 'middle', slot: 'inner' },
			{ owner: 'binary', slot: 'left' }
		]);
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

	it("routes no member through a list's item slot: a claimed list's items are its container content", async () => {
		const routes = resolveRoutes(await grammar('(values) @expression.tuple'));
		expect(routes.members.get('values')).toEqual([]);
	});

	it("builds a deep member back through the anchored first node of a slot that holds many, a list's included", async () => {
		const routes = resolveRoutes(
			await grammar('(block . (function_definition name: (identifier) @first)) @statement.block')
		);
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

	it("enters a claim on a kind the reader stores as its member's kind id on each member, an equality on its text decided by the member's", async () => {
		const routes = resolveRoutes(
			await grammar(['(bool) @literal.boolean', '((bool) @literal.boolean.true (#eq? @literal.boolean.true "true"))'].join('\n'))
		);
		expect(routes.readEntries.has('bool')).toBe(false);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.claimed)).toEqual(['bool', 'bool']);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean.true', 'literal.boolean']);
		expect(routes.readEntries.get('false_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean']);
	});

	it('decides a match on an enum kind\'s own text by each member\'s fixed text, as tree-sitter\'s unanchored match reads it, and stamps the members it keeps', async () => {
		const routes = resolveRoutes(
			await grammar(['(predefined) @type.primitive.symbol', '((predefined) @type.primitive.symbol.unique (#match? @type.primitive.symbol.unique "^unique"))'].join('\n'))
		);
		expect(routes.readEntries.get('unique_symbol')?.map((e) => [e.vocab, e.spelled])).toEqual([
			['type.primitive.symbol.unique', true],
			['type.primitive.symbol', undefined]
		]);
		expect(routes.readEntries.get('symbol_kw')?.map((e) => e.vocab)).toEqual(['type.primitive.symbol']);
	});

	it('stamps a member an equality on its own text keeps, and no member of a claim that tests no own text', async () => {
		const routes = resolveRoutes(
			await grammar(['(bool) @literal.boolean', '((bool) @literal.boolean.true (#eq? @literal.boolean.true "true"))'].join('\n'))
		);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.spelled)).toEqual([true, undefined]);
	});

	it('enters a claim on a kind on each variant the kind owns, and on a variant with claims of its own as its least specific entry', async () => {
		const routes = resolveRoutes(await grammar(['(_struct) @declaration.struct', '(struct_named) @declaration.struct.named'].join('\n')));
		expect(routes.readEntries.get('struct_unit')?.map((e) => [e.claimed, e.vocab])).toEqual([['_struct', 'declaration.struct']]);
		expect(routes.readEntries.get('struct_tuple')?.map((e) => [e.claimed, e.vocab])).toEqual([['_struct', 'declaration.struct']]);
		expect(routes.members.get('struct_tuple')?.map((r) => r.name)).toEqual(['name', 'fields']);
		expect(routes.readEntries.get('struct_named')?.map((e) => [e.claimed, e.vocab])).toEqual([
			['struct_named', 'declaration.struct.named'],
			['_struct', 'declaration.struct']
		]);
		expect(routes.vocabOf.get('struct_named')).toBe('declaration.struct.named');
	});

	it("keeps a kind's claim on a variant whose own claims all refine it, so the variant reads by the kind's path when no refinement holds", async () => {
		const routes = resolveRoutes(
			await grammar(
				['(_struct) @declaration.struct', '((struct_named name: (_) @n) @declaration.struct.named (#eq? @n "N"))'].join(
					'\n'
				)
			)
		);
		expect(routes.readEntries.get('struct_named')?.map((e) => e.vocab)).toEqual([
			'declaration.struct.named',
			'declaration.struct'
		]);
		expect(routes.vocabOf.get('struct_named')).toBe('declaration.struct');
	});

	it("names a variant whose own claims refine paths with no common parent by the kind's claim", async () => {
		const routes = resolveRoutes(
			await grammar(['(_struct) @declaration.struct', '((struct_named name: (_) @n) @declaration.struct.private (#eq? @n "P"))', '((struct_named name: (_) @n) @declaration.struct.public.internal (#eq? @n "I"))'].join('\n'))
		);
		expect(routes.vocabOf.get('struct_named')).toBe('declaration.struct');
	});

	it("names a variant by its own plain claim, and tries the kind's claim after it, wherever the kind's claim stands in the file", async () => {
		const routes = resolveRoutes(
			await grammar(['(_struct) @declaration.struct', '(struct_named) @declaration.record'].join('\n'))
		);
		expect(routes.readEntries.get('struct_named')?.map((e) => e.vocab)).toEqual([
			'declaration.record',
			'declaration.struct'
		]);
		expect(routes.vocabOf.get('struct_named')).toBe('declaration.record');
	});

	it('enters no claim on a variant of a branch: the variant is a part of its owner, not a form', async () => {
		const routes = resolveRoutes(await grammar('(arrow) @expression.lambda'));
		expect(routes.readEntries.has('arrow_param')).toBe(false);
	});

	it("carries a supertype claim's field renames to each form it reaches", async () => {
		const routes = resolveRoutes(await grammar('(_struct name: (_) @title) @declaration.struct'));
		expect(routes.members.get('struct_unit')?.map((r) => r.name)).toEqual(['title']);
		expect(routes.members.get('struct_tuple')?.map((r) => r.name)).toEqual(['title', 'fields']);
	});

	it("carries a supertype claim's field renames to a form with claims of its own", async () => {
		const routes = resolveRoutes(
			await grammar(
				['(_struct name: (_) @title) @declaration.struct', '(struct_named) @declaration.struct.named'].join('\n')
			)
		);
		expect(routes.members.get('struct_named')?.map((r) => r.name)).toEqual(['title']);
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

	it("enters a claim pinning an enum kind's token only on the member that is that token", async () => {
		const routes = resolveRoutes(
			await grammar(['(bool) @literal.boolean', '(bool "false") @literal.boolean.false'].join('\n'))
		);
		expect(routes.readEntries.get('false_keyword')?.map((e) => e.vocab)).toEqual([
			'literal.boolean.false',
			'literal.boolean'
		]);
		expect(routes.readEntries.get('true_keyword')?.map((e) => e.vocab)).toEqual(['literal.boolean']);
	});

	it('enters a pattern test on a kind the reader stores as its member\'s kind id only on the members whose fixed text it matches', async () => {
		const routes = resolveRoutes(await grammar('((bool) @literal.boolean.true (#match? @literal.boolean.true "^t"))'));
		expect([...routes.readEntries.keys()].filter((k) => k.endsWith('_keyword')).sort()).toEqual(['true_keyword']);
	});

	it('enters a claim on the forms of a form that is itself a supertype', async () => {
		const routes = resolveRoutes(await grammar('(_decl) @statement.export'));
		expect(routes.readEntries.get('default_fn')?.map((e) => [e.claimed, e.vocab])).toEqual([['_decl', 'statement.export']]);
		expect(routes.members.get('default_fn')?.map((r) => r.name)).toEqual(['declaration']);
	});

	it("routes a list form's items as the member its sibling forms hold the same elements under", async () => {
		const routes = resolveRoutes(await grammar('(_clause wrapped: (_) @entries) @clause.resource'));
		expect(routes.members.get('clause_paren')?.map((r) => r.name)).toEqual(['entries']);
		expect(routes.members.get('clause_bare')).toEqual([
			{ route: 'slot', name: 'entries', slot: slot('item', ['identifier'], { propertyName: 'items', multiple: true }), path: [{ owner: 'clause_bare', slot: 'item' }] }
		]);
	});

	it('refuses a capture on a layout slot: it reaches no member, so it names the capture, its kind, the slot and why', async () => {
		await expect(grammar('(function_definition (comment) @note) @declaration.function').then(resolveRoutes)).rejects.toThrow(
			/function_definition's capture @note.*comment slot.*layout/
		);
	});

	it('refuses a capture on a slot that holds only text on a kind read as an identifier', async () => {
		await expect(grammar('(private_name content: _ @content) @identifier.property').then(resolveRoutes)).rejects.toThrow(
			/private_name's capture @content.*content slot.*only text.*identifier/
		);
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
		const routes = resolveRoutes(await grammar(['(private_name) @identifier.property', '(scoped_name) @identifier.scoped', '(char_text) @literal.character'].join('\n')));
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

	it.each([
		{ kind: 'binary', token: '+', vocab: 'expression.binary', members: ['left', 'right'] },
		{ kind: 'span', token: '..', vocab: 'expression.range', members: ['lo'] }
	])('drops the slot holding the anonymous token $token on $kind, keeping its other members', async ({ kind, token, vocab, members }) => {
		const routes = resolveRoutes(await grammar(`(${kind}) @${vocab}\n(${kind} "${token}" @dropped)`));
		expect(routes.members.get(kind)?.map((route) => route.name)).toEqual(members);
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

	it('reads a child by the name the parser shows it by, so a slot holding only kinds shown by that name guarantees it', async () => {
		const routes = resolveRoutes(await grammar('(shown_holder text: (text_fragment)) @literal.shown'));
		expect(routes.readEntries.get('shown_holder')?.[0]?.children).toEqual([]);
	});

	it('tests a member capture on an optional slot only against the other kinds the slot holds', async () => {
		const routes = resolveRoutes(await grammar('(impl_x trait: (type_x) @implements) @declaration.extension\n(impl_x clause: (clause_pos) @clause) @declaration.extension.positive'));
		const [positive, plain] = routes.readEntries.get('impl_x') ?? [];
		expect(plain?.children).toEqual([]);
		expect(positive?.children).toEqual([{ subject: { up: 0, down: [{ field: 'clause', kind: 'clause_pos', after: null, anchor: null }] }, excludes: ['clause_neg'] }]);
	});

	it("tests an optional field's presence as any kind it holds", async () => {
		const routes = resolveRoutes(await grammar('(impl_x trait: (_)) @declaration.extension.conformance'));
		expect(routes.readEntries.get('impl_x')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: 'trait', kind: null, after: null, anchor: null }] }, kinds: ['type_x'] }
		]);
	});

	it("tests nothing below a wildcard that every kind it may be guarantees, and gives a supertype's own entry no child test", async () => {
		const routes = resolveRoutes(
			await grammar(
				'(impl_x clause: (_ trait: (_))) @declaration.extension.conformance\n(_struct (identifier)) @declaration.struct'
			)
		);
		expect(routes.readEntries.get('impl_x')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: 'clause', kind: null, after: null, anchor: null }] }, kinds: ['clause_neg', 'clause_pos'] }
		]);
		expect(routes.readEntries.get('_struct')?.[0]?.children).toEqual([]);
	});

	it('routes no slot whose values, beside the kinds a member path leads through, a child test of a refinement tells', async () => {
		const rows = ['(rng) @pattern.range', '(rng (rng_right "..=")) @pattern.range.inclusive', '(rng (rng_right right: (_) @right))'];
		const told = resolveRoutes(await grammar([...rows, '(rng (_dots)) @pattern.range.exclusive'].join('\n')));
		expect(told.members.get('rng')?.map((r) => r.name)).toEqual(['left', 'right']);
		const untold = resolveRoutes(await grammar(rows.join('\n')));
		expect(untold.members.get('rng')?.map((r) => r.name)).toEqual(['left', 'content', 'right']);
	});

	it('tests a fieldless token below the claimed node in the slot that holds its text, as a pin finds its slot', async () => {
		const routes = resolveRoutes(await grammar('(cmp (cmp_op "<")) @expression.binary.less'));
		const step = { field: null, kind: 'cmp_op', after: null, anchor: null };
		expect(routes.readEntries.get('cmp')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [step, { field: 'operators', kind: null, after: null, anchor: null }] }, text: '<' }
		]);
	});

	it('refuses a fieldless token below the claimed node that no slot of its holder holds', async () => {
		await expect(grammar('(cmp (cmp_op "+")) @expression.binary.plus').then(resolveRoutes)).rejects.toThrow(/cmp.*"\+".*no slot/);
	});

	it("tests a token below a child whose own text is that token on the child itself: an enum kind's value is its text", async () => {
		const routes = resolveRoutes(await grammar('(meth (access_mod "public")) @declaration.method.public'));
		expect(routes.readEntries.get('meth')?.[0]?.children).toContainEqual({ subject: { up: 0, down: [{ field: null, kind: 'access_mod', after: null, anchor: null }] }, text: 'public' });
	});

	it('routes no member through a slot of an enum kind whose every value a refinement tells on the child, and keeps it while one is open', async () => {
		const claims = (...levels: readonly string[]): Promise<GrammarInput> =>
			grammar(['(meth) @declaration.method', ...levels.map((level) => `(meth (access_mod "${level}")) @declaration.method.${level}`)].join('\n'));
		const told = resolveRoutes(await claims('public', 'private', 'protected'));
		expect(told.members.get('meth')?.map((r) => r.name)).not.toContain('access');
		const open = resolveRoutes(await claims('public', 'private'));
		expect(open.members.get('meth')?.map((r) => r.name)).toContain('access');
	});

	it("routes no member through a slot whose node's every kind a refinement tests one level below, and keeps it while one is open", async () => {
		const claims = (...lines: readonly string[]): Promise<GrammarInput> =>
			grammar(['(fn_x) @declaration.function', ...lines].join('\n'));
		const told = resolveRoutes(
			await claims(
				'(fn_x (vis_mod (vis_pub (identifier) @scope)))',
				'(fn_x (vis_mod (vis_pub))) @declaration.function.public',
				'(fn_x (vis_mod (crate_kw))) @declaration.function.public.internal'
			)
		);
		expect(told.members.get('fn_x')?.map((r) => r.name)).toEqual(['name', 'scope']);
		const open = resolveRoutes(await claims('(fn_x (vis_mod (vis_pub))) @declaration.function.public'));
		expect(open.members.get('fn_x')?.map((r) => r.name)).toEqual(['vis', 'name']);
	});

	it('refuses to hide a slot whose covered kind holds content no claim captures, naming the owner, the slot, the kind and its slots', async () => {
		const input = await grammar(
			['(fn_x) @declaration.function', '(fn_x (vis_mod (vis_pub))) @declaration.function.public', '(fn_x (vis_mod (crate_kw))) @declaration.function.public.internal'].join('\n')
		);
		expect(() => resolveRoutes(input)).toThrow(/fn_x.*vis.*vis_pub.*scope/);
	});

	it("routes a slot a capture names though refinements test every kind its node holds: a kind leaves the node's content open", async () => {
		const routes = resolveRoutes(
			await grammar(
				[
					'(fn_x) @declaration.function',
					'(fn_x (vis_mod) @visibility)',
					'(fn_x (vis_mod (vis_pub))) @declaration.function.public',
					'(fn_x (vis_mod (crate_kw))) @declaration.function.public.internal'
				].join('\n')
			)
		);
		expect(routes.members.get('fn_x')?.map((r) => r.name)).toEqual(['visibility', 'name']);
	});

	it('tests a field literal through a child, and not the child the slot can only hold', async () => {
		const routes = resolveRoutes(await grammar('(cmp (cmp_op operators: "==")) @expression.binary.equal'));
		const step = { field: null, kind: 'cmp_op', after: null, anchor: null };
		expect(routes.readEntries.get('cmp')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [step, { field: 'operators', kind: null, after: null, anchor: null }] }, text: '==' }
		]);
	});

	it("tests no more for a node anchored to its holder's only slot of nodes after a required one: the model places it there", async () => {
		const routes = resolveRoutes(await grammar('(cmp . (_) . (cmp_op operators: "<") .) @expression.binary.less'));
		const op = { field: null, kind: 'cmp_op', after: null, anchor: 'last', adjacent: { previous: { field: null, kind: null, after: null, anchor: null } } };
		expect(routes.readEntries.get('cmp')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [op, { field: 'operators', kind: null, after: null, anchor: null }] }, text: '<' }
		]);
	});

	it("tests a node anchored as its slot's only one though the model guarantees its kind: the slot holds many", async () => {
		const routes = resolveRoutes(await grammar('(block . (function_definition) .) @statement.block.single'));
		expect(routes.readEntries.get('block')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: null, kind: 'function_definition', after: null, anchor: 'only' }] }, kinds: ['function_definition'] }
		]);
	});

	it("tests a guaranteed only node by nothing more when another test reaches through it, a token's included", async () => {
		const routes = resolveRoutes(await grammar('(cmp . (_) . (cmp_op "<") .) @expression.binary.less'));
		expect(routes.readEntries.get('cmp')?.[0]?.children.map((c) => 'text' in c)).toEqual([true]);
	});

	it('tests two adjacent bare nodes of one slot as the slot holding more than one node', async () => {
		const routes = resolveRoutes(await grammar('(cmp (cmp_op) . (cmp_op)) @expression.binary.chain'));
		expect(routes.readEntries.get('cmp')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: 'ops', kind: null, after: null, anchor: 'only' }] }, excludes: ['cmp_op'] }
		]);
	});

	it('tests an optional slot an anchor steps over as holding no node', async () => {
		const routes = resolveRoutes(await grammar('(trio head: (_) . tail: (_)) @expression.trio'));
		expect(routes.readEntries.get('trio')?.[0]?.children).toEqual([
			{ subject: { up: 0, down: [{ field: 'mid', kind: null, after: null, anchor: null }] }, excludes: ['identifier'] }
		]);
	});

	it.each([
		['a required slot lies between an anchor and its node', '(trio . tail: (_)) @expression.trio', /trio.*never matches.*head/],
		['its nodes come in an order the slots do not', '(trio tail: (_) head: (_)) @expression.trio', /trio.*never matches.*order/],
		['two nodes of one slot carry their own tests', '(cmp (cmp_op operators: "<") . (cmp_op)) @expression.binary.chain', /cmp.*ops.*own tests/]
	])('refuses a claim whose children cannot match or be tested when %s', async (_why, pattern, message) => {
		await expect(grammar(pattern).then(resolveRoutes)).rejects.toThrow(message);
	});

	it("routes each entry the members its own tests guarantee: a path through a slot's only node only where the entry tests that node", async () => {
		const rows = [
			'(cmp) @expression.binary',
			'(cmp (cmp_op) . (cmp_op)) @expression.binary.chain',
			'(cmp . (_) . (cmp_op operators: "<") .) @expression.binary.less',
			'(cmp . (_) . (cmp_op (_) @right) .)'
		];
		const routes = resolveRoutes(await grammar(rows.join('\n')));
		const byPath = Object.fromEntries((routes.readEntries.get('cmp') ?? []).map((e) => [e.vocab, e.members.map((m) => m.name)]));
		expect(byPath).toEqual({ 'expression.binary': ['left'], 'expression.binary.chain': ['left', 'ops'], 'expression.binary.less': ['left', 'right'] });
		expect(routes.members.get('cmp')?.map((m) => m.name).sort()).toEqual(['left', 'ops', 'right']);
	});

	it("routes on each entry the captures of its own claim and of member-only patterns, never a sibling claim's", async () => {
		const routes = resolveRoutes(
			await grammar(
				[
					'(outer) @expression.outer',
					'(outer (middle (binary) @operation)) @expression.outer.nested',
					'(outer (middle (binary left: (expr) @left)))'
				].join('\n')
			)
		);
		const deep = (vocab: string): readonly string[] | undefined =>
			routes.readEntries
				.get('outer')
				?.find((e) => e.vocab === vocab)
				?.members.flatMap((r) => (r.route === 'slot' ? [] : [r.name]));
		expect(deep('expression.outer.nested')).toEqual(['operation', 'left']);
		expect(deep('expression.outer')).toEqual(['left']);
	});

	it("routes no slot a refinement's deep capture leads through on any entry: that slot is a path, not a member", async () => {
		const routes = resolveRoutes(
			await grammar(
				['(outer) @expression.outer', '(outer (middle (binary) @operation)) @expression.outer.nested'].join('\n')
			)
		);
		for (const entry of routes.readEntries.get('outer') ?? [])
			expect(entry.members.map((r) => r.name)).not.toContain('mid');
	});

	it('keeps every route a member has, though several share its name', async () => {
		const routes = resolveRoutes(await grammar('(function_definition (modifiers "async" @flag)) @declaration.function\n(function_definition (modifiers "static" @flag))'));
		expect(routes.members.get('function_definition')?.filter((m) => m.name === 'flag')).toHaveLength(2);
	});

	it('routes a slot no member counts through on every entry', async () => {
		const routes = resolveRoutes(await grammar('(cmp) @expression.binary\n(cmp (cmp_op) . (cmp_op)) @expression.binary.chain'));
		for (const entry of routes.readEntries.get('cmp') ?? []) expect(entry.members.map((m) => m.name)).toEqual(['left', 'ops']);
	});

	it("routes a path through a slot's first node on every entry: a first node is no count", async () => {
		const routes = resolveRoutes(
			await grammar(
				'(block . (function_definition name: (identifier) @first)) @statement.block\n(block (function_definition)) @statement.block.defs'
			)
		);
		for (const entry of routes.readEntries.get('block') ?? [])
			expect(entry.members.map((m) => m.name)).toContain('first');
	});

	it('inherits a capture of the claim a refinement refines with the conditions its pattern put on the path, so another first node reads no member', async () => {
		const routes = resolveRoutes(await grammar('(block . (function_definition name: (identifier) @first)) @statement.block\n(block (function_definition)) @statement.block.defs'));
		const first = (vocab: string) => routes.readEntries.get('block')?.find((e) => e.vocab === vocab)?.members.find((m) => m.name === 'first');
		expect(first('statement.block.defs')).toEqual(first('statement.block'));
		expect(first('statement.block.defs')).toMatchObject({
			via: [{ kind: 'function_definition', anchor: 'first' }],
			path: [{ owner: 'block', slot: 'statements', anchor: 'first' }, { owner: 'function_definition', slot: 'name' }]
		});
	});

	it('keeps the template a templated claim builds from', async () => {
		const routes = resolveRoutes(
			await grammar('((function_definition name: (identifier) @name) @declaration.method.special (#match? @name "^__(?<stem>.*)__$"))')
		);
		expect(routes.readEntries.get('function_definition')?.[0]?.template).toMatchObject({ holes: ['stem'] });
	});
});

describe('flag captures', () => {
	const FLAGGED = [
		node('method', [slot('accessor_kind', [], { required: false, terminals: ['get', 'set', '*'] }), slot('name', ['identifier'])]),
		node('param', [slot('pattern', ['identifier']), slot('mutable_specifier', ['mutable_specifier'], { required: false })]),
		node('mutable_specifier', [], { modelType: 'keyword', text: 'mut' }),
		node('for_in', [slot('await', [], { required: false, terminals: ['await'] }), slot('body', ['block'])]),
		node('static_item', [slot('ref', [], { required: false, terminals: ['ref', 'mut'] }), slot('name', ['identifier'])]),
		node('fn_item', [slot('mods', ['mods'], { required: false }), slot('name', ['identifier'])]),
		node('mods', [slot('modifier', [], { multiple: true, terminals: ['async', 'const'] })]),
		node('ref_expr', [], { modelType: 'supertype' }),
		node('ref_expr_raw', [slot('value', ['identifier'])], { variantOf: 'ref_expr' }),
		node('ref_expr_mut', [slot('value', ['identifier'])], { variantOf: 'ref_expr' }),
		node('def', [slot('async', [], { required: false, storage: 'boolean', terminals: ['async'] }), slot('name', ['identifier'])])
	];
	const member = (flag: boolean): VocabularyMember => ({ optional: true, flag });
	const vocabulary = (own: Readonly<Record<string, Readonly<Record<string, boolean>>>>): Vocabulary => {
		const kinds = new Map(Object.entries(own).map(([path, members]) => [path, { name: path, own: new Map(Object.entries(members).map(([n, flag]) => [n, member(flag)])), parent: undefined, refines: undefined }]));
		return { kinds, flags: new Set(Object.values(own).flatMap((m) => Object.entries(m).flatMap(([n, flag]) => (flag ? [n] : [])))), synonyms: { levels: new Map(), flags: new Map() }, members: (path) => kinds.get(path)?.own ?? new Map() };
	};
	const VOCABULARY = vocabulary({
		'declaration.method': { generator: true },
		'declaration.method.getter': {},
		'declaration.parameter': { mutable: true },
		'statement.loop.for_each': { async: true },
		'declaration.variable': { byReference: true },
		'declaration.function': { async: true },
		'expression.reference': { raw: true, exclusive: true }
	});
	const FLAGGED_MODEL = new Map([...MODEL, ...FLAGGED].map((n) => [n.kind, n]));
	const flagged = async (bindings: string): Promise<GrammarInput> => ({
		grammar: 'g',
		bindings: resolveFlags(await readBindings(bindings), VOCABULARY, FLAGGED_MODEL),
		model: FLAGGED_MODEL,
		textTokens: new Set(),
		layoutSlots: []
	});
	const membersOf = async (bindings: string, kind: string) => resolveRoutes(await flagged(bindings)).members.get(kind);

	it('routes a flag captured on a token in a slot to that token\'s presence, not to the slot', async () => {
		expect(await membersOf(['(method) @declaration.method', '(method accessor_kind: "*" @generator)'].join('\n'), 'method')).toEqual([
			{ route: 'slot', name: 'name', slot: expect.objectContaining({ name: 'name' }), path: [{ owner: 'method', slot: 'name' }] },
			{ route: 'presence', name: 'generator', via: [], token: '*', path: [{ owner: 'method', slot: 'accessor_kind' }], flag: true }
		]);
	});

	it('routes a flag captured on a node to the presence of its kind, and the slot is no member', async () => {
		expect(await membersOf(['(param) @declaration.parameter', '(param (mutable_specifier) @mutable)'].join('\n'), 'param')).toEqual([
			{ route: 'slot', name: 'pattern', slot: expect.objectContaining({ name: 'pattern' }), path: [{ owner: 'param', slot: 'pattern' }] },
			{ route: 'kind', name: 'mutable', kind: 'mutable_specifier', path: [{ owner: 'param', slot: 'mutable_specifier' }], flag: true }
		]);
	});

	it('routes a flag captured on a keyword slot to the presence of the one token the slot holds', async () => {
		expect((await membersOf(['(for_in) @statement.loop.for_each', '(for_in await: _ @async)'].join('\n'), 'for_in'))?.filter((r) => r.name === 'async')).toEqual([
			{ route: 'presence', name: 'async', via: [], token: 'await', path: [{ owner: 'for_in', slot: 'await' }], flag: true }
		]);
	});

	it('marks a flag reached through a wrapper child, and leaves a data member unmarked', async () => {
		const members = await membersOf(['(fn_item) @declaration.function', '(fn_item (mods "async" @async))'].join('\n'), 'fn_item');
		expect(members?.find((r) => r.name === 'async')).toEqual({
			route: 'presence',
			name: 'async',
			via: [{ field: null, kind: 'mods', after: null, anchor: null }],
			token: 'async',
			path: [{ owner: 'fn_item', slot: 'mods' }, { owner: 'mods', slot: 'modifier' }],
			flag: true
		});
		expect(members?.find((r) => r.name === 'name')).not.toHaveProperty('flag');
	});

	it('marks a flag captured on a form of a claimed supertype as the supertype\'s flag', async () => {
		const members = await membersOf(['(ref_expr) @expression.reference', '(ref_expr_raw "raw" @raw)'].join('\n'), 'ref_expr_raw');
		expect(members?.find((r) => r.name === 'raw')).toEqual({ route: 'presence', name: 'raw', via: [], token: 'raw', path: undefined, flag: true, spelled: true });
	});

	it('routes a flag spelled by its synonym as the canonical flag, on whichever side of a supertype the capture and the claim sit', async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('binding', [], { modelType: 'supertype' }),
				node('binding_plain', [slot('pattern', ['identifier']), slot('mutable_specifier', ['mutable_specifier'], { required: false })], { variantOf: 'binding' })
			].map((n) => [n.kind, n])
		);
		const synonymous: Vocabulary = { ...VOCABULARY, synonyms: { levels: new Map(), flags: new Map([['mutable', ['mut']]]) } };
		const routed = async (bindings: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(canonicalFacts(await readBindings(bindings), synonymous, model), synonymous, model),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).members.get('binding_plain');
		for (const [claim, capture] of [
			['(binding)', '(binding_plain (mutable_specifier) @NAME)'],
			['(binding_plain)', '(binding (mutable_specifier) @NAME)']
		] as const) {
			const of = (name: string) => routed([`${claim} @declaration.parameter`, capture.replace('NAME', name)].join('\n'));
			const canonical = await of('mutable');
			expect(canonical?.find((r) => r.name === 'mutable'), claim).toMatchObject({ name: 'mutable', flag: true });
			expect(await of('mut'), claim).toEqual(canonical);
		}
	});

	it('gives a capture on a supertype only the paths of forms that hold what it selects', async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('binding', [], { modelType: 'supertype' }),
				node('binding_data', [slot('value', ['identifier'])], { variantOf: 'binding' }),
				node('binding_flag', [slot('pattern', ['identifier'])], { variantOf: 'binding' })
			].map((n) => [n.kind, n])
		);
		const both = vocabulary({ 'declaration.parameter': { mutable: true }, 'declaration.variable': { mutable: false } });
		const bindings = await readBindings(['(binding_flag) @declaration.parameter', '(binding_data) @declaration.variable', '(binding value: (_) @mutable)'].join('\n'));
		const routes = resolveRoutes({ grammar: 'g', bindings: resolveFlags(canonicalFacts(bindings, both, model), both, model), model, textTokens: new Set(), layoutSlots: [] });
		const data = routes.members.get('binding_data')?.find((r) => r.name === 'mutable');
		expect(data).toMatchObject({ route: 'slot', name: 'mutable' });
		expect(data).not.toHaveProperty('flag');
	});

	it('routes a flag spelled by its synonym as the canonical flag through a wildcard claim', async () => {
		const model = new Map([...FLAGGED_MODEL.values(), node('holder', [slot('item', ['param'])])].map((n) => [n.kind, n]));
		const synonymous: Vocabulary = { ...VOCABULARY, synonyms: { levels: new Map(), flags: new Map([['mutable', ['mut']]]) } };
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(canonicalFacts(await readBindings(['(holder item: (_) @declaration.parameter)', `(param (mutable_specifier) @${name})`].join('\n')), synonymous, model), synonymous, model),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).members.get('param');
		const canonical = await of('mutable');
		expect(canonical?.find((r) => r.name === 'mutable')).toMatchObject({ name: 'mutable', flag: true });
		expect(await of('mut')).toEqual(canonical);
	});

	it("resolves a capture on a supertype's claim against the paths its forms' claims refine it to", async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('binding', [], { modelType: 'supertype' }),
				node('binding_plain', [slot('pattern', ['identifier']), slot('mutable_specifier', ['mutable_specifier'], { required: false })], { variantOf: 'binding' })
			].map((n) => [n.kind, n])
		);
		const refined: Vocabulary = {
			...vocabulary({ 'declaration.parameter': {}, 'declaration.parameter.special': { mutable: true } }),
			synonyms: { levels: new Map(), flags: new Map([['mutable', ['mut']]]) }
		};
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(
					canonicalFacts(await readBindings([`(binding (mutable_specifier) @${name}) @declaration.parameter`, '(binding_plain) @declaration.parameter.special'].join('\n')), refined, model),
					refined,
					model
				),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).members.get('binding_plain');
		const canonical = await of('mutable');
		expect(canonical?.find((r) => r.name === 'mutable')).toMatchObject({ name: 'mutable', flag: true });
		expect(await of('mut')).toEqual(canonical);
	});

	it('resolves an anchored capture against the paths whose claims guarantee its anchor', async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('outer', [slot('parts', ['part'], { multiple: true })]),
				node('part', [slot('static', [], { required: false, storage: 'boolean', terminals: ['static'] }), slot('name', ['identifier'])])
			].map((n) => [n.kind, n])
		);
		const anchored: Vocabulary = {
			...vocabulary({ 'expression.container': { shared: false }, 'declaration.function': { shared: true } }),
			synonyms: { levels: new Map(), flags: new Map([['shared', ['static']]]) }
		};
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(
					canonicalFacts(
						await readBindings(['(outer) @expression.container', '(outer . parts: (part) .) @declaration.function', `(outer . parts: (part "static" @${name}) .)`].join('\n')),
						anchored,
						model
					),
					anchored,
					model
				),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).readEntries.get('outer');
		const canonical = await of('shared');
		const routesAt = (path: string) => canonical?.find((entry) => entry.vocab === path)?.members.filter((r) => r.name === 'shared');
		expect(routesAt('declaration.function')).toMatchObject([{ route: 'presence', name: 'shared', flag: true }]);
		expect(routesAt('expression.container')).toEqual([]);
		expect(await of('static')).toEqual(canonical);
	});

	it("reads a capture's word only at the forms that can take it, so a sibling form's member does not refuse it", async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('binding', [], { modelType: 'supertype' }),
				node('binding_flag', [slot('pattern', ['identifier']), slot('mutable_specifier', ['mutable_specifier'], { required: false })], { variantOf: 'binding' }),
				node('binding_data', [slot('value', ['identifier'])], { variantOf: 'binding' })
			].map((n) => [n.kind, n])
		);
		const disjoint: Vocabulary = {
			...vocabulary({ 'declaration.parameter': { mutable: true }, 'declaration.variable': { mut: false } }),
			synonyms: { levels: new Map(), flags: new Map([['mutable', ['mut']]]) }
		};
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(
					canonicalFacts(await readBindings(['(binding_flag) @declaration.parameter', '(binding_data) @declaration.variable', `(binding (mutable_specifier) @${name})`].join('\n')), disjoint, model),
					disjoint,
					model
				),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).members;
		const canonical = await of('mutable');
		expect(canonical.get('binding_flag')?.find((r) => r.name === 'mutable')).toMatchObject({ name: 'mutable', flag: true });
		expect(await of('mut')).toEqual(canonical);
	});

	it("reads a claim's own deep capture only where the claim attaches it, not at another claim of the kind", async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('holder', [slot('item', ['outer'])]),
				node('outer', [slot('parts', ['part'])]),
				node('part', [slot('static', [], { required: false, storage: 'boolean', terminals: ['static'] }), slot('name', ['identifier'])])
			].map((n) => [n.kind, n])
		);
		const scoped: Vocabulary = {
			...vocabulary({ 'declaration.function': { shared: true }, 'declaration.parameter': { static: false } }),
			synonyms: { levels: new Map(), flags: new Map([['shared', ['static']]]) }
		};
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(
					canonicalFacts(await readBindings([`(outer parts: (part "static" @${name})) @declaration.function`, '(holder item: (outer) @declaration.parameter)'].join('\n')), scoped, model),
					scoped,
					model
				),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).readEntries.get('outer');
		const canonical = await of('shared');
		expect(canonical?.find((entry) => entry.vocab === 'declaration.function')?.members.filter((r) => r.name === 'shared')).toMatchObject([{ route: 'presence', flag: true }]);
		expect(await of('static')).toEqual(canonical);
	});

	it('reads a rename that spells a flag where it attaches only there, since a flag capture renames no slot', async () => {
		const model = new Map(
			[
				...FLAGGED_MODEL.values(),
				node('holder', [slot('item', ['entry'])]),
				node('entry', [slot('storage_class', ['storage_class'], { required: false }), slot('name', ['identifier'])]),
				node('storage_class', [], { modelType: 'keyword', text: 'static' })
			].map((n) => [n.kind, n])
		);
		const scoped: Vocabulary = {
			...vocabulary({ 'declaration.method': { static: true }, 'declaration.parameter': { shared: false } }),
			synonyms: { levels: new Map(), flags: new Map([['static', ['shared']]]) }
		};
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(
					canonicalFacts(await readBindings([`(entry (storage_class) @${name}) @declaration.method`, '(holder item: (entry) @declaration.parameter)'].join('\n')), scoped, model),
					scoped,
					model
				),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).readEntries.get('entry');
		const canonical = await of('static');
		expect(canonical?.find((entry) => entry.vocab === 'declaration.method')?.members.filter((r) => r.name === 'static')).toMatchObject([{ flag: true }]);
		expect(await of('shared')).toEqual(canonical);
	});

	it("keeps a second capture on a node pointed at the first capture's canonical name", async () => {
		const model = new Map(
			[...FLAGGED_MODEL.values(), node('holder', [slot('item', ['entry'])]), node('entry', [slot('value', ['identifier'])])].map((n) => [n.kind, n])
		);
		const dual: Vocabulary = {
			...vocabulary({ 'declaration.parameter': { default: false, optional: true }, 'declaration.method': { default: true } }),
			synonyms: { levels: new Map(), flags: new Map([['default', ['provided']]]) }
		};
		const of = async (name: string) =>
			resolveRoutes({
				grammar: 'g',
				bindings: resolveFlags(
					canonicalFacts(await readBindings([`(entry value: (identifier) @${name} @optional) @declaration.parameter`, '(holder item: (entry) @declaration.method)'].join('\n')), dual, model),
					dual,
					model
				),
				model,
				textTokens: new Set(),
				layoutSlots: []
			}).readEntries.get('entry');
		const canonical = await of('default');
		const optional = canonical?.find((entry) => entry.vocab === 'declaration.parameter')?.members.find((r) => r.name === 'optional');
		expect(optional).toMatchObject({ route: 'kind', path: [{ owner: 'entry', slot: 'value' }] });
		expect(await of('provided')).toEqual(canonical);
	});

	it('refuses a capture whose word is a member at one path its owner is claimed under and a flag synonym at another', async () => {
		const synonymous: Vocabulary = {
			...vocabulary({ 'declaration.parameter': { mutable: true }, 'declaration.variable': { mut: false } }),
			synonyms: { levels: new Map(), flags: new Map([['mutable', ['mut']]]) }
		};
		const bindings = await readBindings(['(param) @declaration.parameter', '((param) @declaration.variable (#eq? @declaration.variable "x"))', '(param (mutable_specifier) @mut)'].join('\n'));
		expect(() => canonicalFacts(bindings, synonymous, FLAGGED_MODEL)).toThrow(/param's capture @mut is a member at declaration\.variable and spells the flag mutable at declaration\.parameter/);
	});

	it('marks a flag a variant form spells, captured as a node no slot of the form holds', async () => {
		const members = await membersOf(['(ref_expr) @expression.reference', '(ref_expr_mut (mutable_specifier) @exclusive)'].join('\n'), 'ref_expr_mut');
		expect(members?.find((r) => r.name === 'exclusive')).toEqual({ route: 'kind', name: 'exclusive', kind: 'mutable_specifier', path: undefined, flag: true, spelled: true });
	});

	it('marks a slot member whose name is a flag of the claimed path, though no capture names it', async () => {
		const members = await membersOf('(def) @declaration.function', 'def');
		expect(members?.find((r) => r.name === 'async')).toMatchObject({ route: 'slot', name: 'async', flag: true });
		expect(members?.find((r) => r.name === 'name')).not.toHaveProperty('flag');
	});

	it('refuses a node flag no slot holds on an owner that is no variant form', async () => {
		await expect(membersOf(['(fn_item) @declaration.function', '(fn_item (mutable_specifier) @async)'].join('\n'), 'fn_item')).rejects.toThrow(/fn_item's flag @async.*mutable_specifier/);
	});

	it('refuses a flag captured on a slot that holds more than one token', async () => {
		await expect(membersOf(['(static_item) @declaration.variable', '(static_item ref: _ @byReference)'].join('\n'), 'static_item')).rejects.toThrow(/static_item.*byReference.*ref.*ref, mut/);
	});

	it('refuses a flag captured on a field the model does not have, naming the kind, the flag and the field', async () => {
		await expect(membersOf(['(method) @declaration.method', '(method typo: _ @generator)'].join('\n'), 'method')).rejects.toThrow(/method's flag @generator.*typo/);
	});

	it('names a pin by the member holding its slot, never by a flag captured in that slot', async () => {
		const routes = resolveRoutes(
			await flagged(['(method) @declaration.method', '(method accessor_kind: "*" @generator)', '(method accessor_kind: "get") @declaration.method.getter'].join('\n'))
		);
		expect(routes.readEntries.get('method')?.find((e) => e.vocab === 'declaration.method.getter')?.pins).toEqual([{ member: 'accessorKind', slot: 'accessor_kind', text: 'get' }]);
	});

	it('keeps a capture that is data on its path a member that names its slot', async () => {
		expect((await membersOf(['(method) @declaration.method', '(method name: (_) @label)'].join('\n'), 'method'))?.find((r) => r.name === 'label')).toMatchObject({ route: 'slot', name: 'label' });
	});

	it('refuses a name that is a flag on one claimed path and data on another', async () => {
		const input = async () => resolveFlags(await readBindings(['(param) @declaration.parameter', '(param) @statement.loop.for_each', '(param (mutable_specifier) @async)'].join('\n')), vocabulary({ 'declaration.parameter': { async: false }, 'statement.loop.for_each': { async: true } }), FLAGGED_MODEL);
		await expect(input()).rejects.toThrow(/async.*flag.*data|one name/);
	});
});

describe('derive', () => {
	it('keeps a nested repeated capture required even when its list wrapper is absent', async () => {
		const d = derive([
			await grammar('(fn_item (params_x (params_elements item: (_)* @parameters)?)) @declaration.function')
		]);
		expect(d.members.get('declaration.function')?.get('parameters')).toMatchObject({
			multiple: true,
			scalar: false,
			optional: false
		});
	});

	it('keeps a nested singleton capture optional', async () => {
		const d = derive([
			await grammar('(fn_item (params_x (params_elements . (attr_param) @first))) @declaration.function')
		]);
		expect(d.members.get('declaration.function')?.get('first')).toMatchObject({
			multiple: false,
			scalar: true,
			optional: true
		});
	});

	it('keeps an optional single capture of a list wrapper optional', async () => {
		const d = derive([await grammar('(fn_item (params_x (params_elements) @parameters)?) @declaration.function')]);
		expect(d.members.get('declaration.function')?.get('parameters')).toMatchObject({ multiple: true, optional: true });
	});

	it('does not infer a required capture from a repeated target slot alone', async () => {
		const d = derive([
			await grammar('(fn_item (params_x (params_elements item: (_) @parameters)?)) @declaration.function')
		]);
		expect(d.members.get('declaration.function')?.get('parameters')).toMatchObject({ multiple: true, optional: true });
	});

	it('keeps a repeated member optional if another claimed kind has no capture for it', async () => {
		const d = derive([
			await grammar(
				'(fn_item (params_x (params_elements item: (_)* @parameters)?)) @declaration.function\n(function_definition) @declaration.function'
			)
		]);
		expect(d.members.get('declaration.function')?.get('parameters')).toMatchObject({ multiple: true, optional: true });
	});

	it('gives each path the members of its own entries', async () => {
		const rows = ['(cmp (cmp_op) . (cmp_op)) @expression.binary.chain', '(cmp . (_) . (cmp_op operators: "<") .) @expression.binary.less', '(cmp . (_) . (cmp_op (_) @right) .)'];
		const d = derive([await grammar(rows.join('\n'))]);
		expect([...(d.members.get('expression.binary.less')?.keys() ?? [])].sort()).toEqual(['left', 'right']);
		expect([...(d.members.get('expression.binary.chain')?.keys() ?? [])].sort()).toEqual(['left', 'ops']);
	});

	it('types a flag as an optional boolean member of the claimed kind', async () => {
		const d = derive([await grammar('(function_definition) @declaration.function\n(function_definition name: (identifier) @name @private)')]);
		const flag = d.members.get('declaration.function')?.get('private');
		expect([...(flag?.kinds ?? [])]).toEqual(['boolean']);
		expect(flag?.optional).toBe(true);
	});

	it("gives a supertype's path no member of a form that its own claim names by another path", async () => {
		const d = derive([
			await grammar(['(_struct) @declaration.struct', '(struct_tuple) @declaration.struct.tuple'].join('\n'))
		]);
		expect([...(d.members.get('declaration.struct')?.keys() ?? [])]).toEqual(['name']);
		expect(d.members.get('declaration.struct')?.get('name')?.optional).toBe(false);
		expect([...(d.members.get('declaration.struct.tuple')?.keys() ?? [])].sort()).toEqual(['fields', 'name']);
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
