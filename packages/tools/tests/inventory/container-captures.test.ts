import { describe, expect, it } from 'vitest';
import { type GrammarInput, type ModelNode, type ModelSlot, derive, readBindings } from '@sittir/codegen/bindings';

const slot = (name: string, kinds: readonly string[], multiple = false): ModelSlot => ({
	name,
	propertyName: name,
	required: true,
	multiple,
	storage: 'verbatim',
	kinds,
	terminals: []
});

const flag = (name: string, text: string): ModelSlot => ({
	name,
	propertyName: name,
	required: false,
	multiple: false,
	storage: 'boolean',
	kinds: [],
	terminals: [text]
});

const node = (kind: string, slots: readonly ModelSlot[] = [], subtypes: readonly string[] = []): ModelNode => ({
	kind,
	modelType: 'branch',
	slots,
	subtypes,
	elementKinds: [],
	enumValues: [],
	text: null,
	pattern: null
});

const grammar = async (bindings: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(bindings),
	model: new Map(
		[
			node('decorated', [slot('decorators', ['decorator'], true), slot('body', ['_definition', 'leaf_b'])]),
			node('declared', [slot('content', ['_definition'])]),
			node('marked', [slot('marks', ['mark'], true), flag('async', 'async'), slot('body', ['leaf_b'])]),
			node('mark'),
			node('_definition', [], ['leaf_a']),
			node('leaf_a'),
			node('leaf_b'),
			node('decorator')
		].map((n) => [n.kind, n])
	),
	textTokens: new Set(),
	layoutSlots: []
});

const CLAIMS = ['(leaf_a) @declaration.a', '(leaf_b) @declaration.b', '(decorator) @attribute.decorator'];

describe('container captures', () => {
	it('land on the kinds the element slot names directly, not on kinds behind a supertype', async () => {
		const d = derive([await grammar([...CLAIMS, '(decorated (decorator)* @decorators body: (_) @element)'].join('\n'))]);
		expect(d.members.get('declaration.b')?.get('decorators')?.kinds).toEqual(new Set(['attribute.decorator']));
		expect(d.members.get('declaration.b')?.get('decorators')?.multiple).toBe(true);
		expect(d.members.get('declaration.a')?.has('decorators') ?? false).toBe(false);
		expect(d.untargeted).toEqual([]);
	});

	it('are reported, not spread, when the element slot names no kind directly', async () => {
		const d = derive([await grammar([...CLAIMS, '(declared "declare" @declare (_) @element)'].join('\n'))]);
		expect(d.untargeted).toEqual(['g: declared (declare)']);
		for (const [v, members] of d.members) expect(members.has('declare'), v).toBe(false);
	});

	it('leave no slot of the container behind unless the pattern drops it on purpose', async () => {
		const silent = derive([await grammar([...CLAIMS, '(marked body: (_) @element)'].join('\n'))]);
		expect(silent.uncaptured).toEqual([
			'g:4 (marked body: (_) @element) leaves async uncaptured',
			'g:4 (marked body: (_) @element) leaves marks uncaptured'
		]);
		const marked = derive([
			await grammar(
				[
					...CLAIMS,
					'((marked (mark)* @dropped "async" @async body: (_) @element) (#set! reason "marks carry nothing portable"))'
				].join('\n')
			)
		]);
		expect(marked.uncaptured).toEqual([]);
		expect(marked.members.get('declaration.b')?.get('async')?.kinds).toEqual(new Set(['boolean']));
	});

	it('refuse a drop with no reason, or a drop that names no slot', async () => {
		const pattern = '(marked (mark)* @dropped "async" @async body: (_) @element)';
		expect(derive([await grammar([...CLAIMS, pattern].join('\n'))]).uncaptured).toEqual([
			`g:4 ${pattern} drops marks without a #set! reason`
		]);
		const blank = `(${pattern} (#set! reason " "))`;
		expect(derive([await grammar([...CLAIMS, blank].join('\n'))]).uncaptured).toEqual([
			`g:4 ${blank} drops marks without a #set! reason`
		]);
		const stray =
			'((marked (mark)* @dropped (leaf_a) @dropped "async" @async body: (_) @element) (#set! reason "marks carry nothing portable"))';
		expect(derive([await grammar([...CLAIMS, stray].join('\n'))]).uncaptured).toEqual([
			`g:4 ${stray} marks a @dropped node that names no slot (leaf_a)`
		]);
	});

	it('leave a claimed wrapper to its own members', async () => {
		const d = derive([await grammar([...CLAIMS, '(declared) @declaration.declared'].join('\n'))]);
		expect(d.untargeted).toEqual([]);
		expect([...(d.members.get('declaration.declared')?.keys() ?? [])]).toEqual(['content']);
	});
});

describe('derive: predicates', () => {
	it('reports a claim predicate whose operator the derivation does not know, and accepts the known ones', async () => {
		const d = derive([
			await grammar(
				'((mark) @identifier.mark (#lua-match? @identifier.mark "%a"))\n((mark) @identifier.other (#match? @identifier.other "^a$"))'
			)
		]);
		expect(d.unknownPredicates).toEqual(['g: #lua-match? on @identifier.mark (identifier.mark)']);
		expect(derive([await grammar('((mark) @identifier.mark (#is-not? local))')]).unknownPredicates).toEqual([
			'g: #is-not? (identifier.mark)'
		]);
	});
});

describe('derive: wildcard claims', () => {
	it('reports a wildcard claim that lands on a list kind, since the list stands between the holder and its members', async () => {
		const input = await grammar('(holder (_) @declaration.member)');
		const model = new Map(input.model);
		model.set('holder', node('holder', [slot('items', ['holder_items'])]));
		model.set('holder_items', { ...node('holder_items'), modelType: 'list', elementKinds: ['leaf_a'] });
		expect(derive([{ ...input, model }]).wildcardContainers).toEqual(['g: (holder (_) @declaration.member) lands on list holder_items']);
	});

	it('accepts a wildcard claim that lands on the members themselves', async () => {
		const input = await grammar('(declared (_) @declaration.member)');
		expect(derive([input]).wildcardContainers).toEqual([]);
	});
});

describe('derive: wildcard claims and members', () => {
	const placedModel = async (bindings: string): Promise<GrammarInput> => {
		const input = await grammar(bindings);
		const model = new Map(input.model);
		model.set('holder', node('holder', [slot('items', ['shaped'], true)]));
		model.set('shaped', node('shaped', [slot('extra', ['leaf_a'])]));
		return { ...input, model };
	};

	it('folds no members from a kind a wildcard claim reaches; the path keeps its explicit claims\' members', async () => {
		const d = derive([await placedModel(['(declared) @declaration.d', '(holder (_) @declaration.d)'].join('\n'))]);
		expect([...(d.members.get('declaration.d')?.keys() ?? [])]).toEqual(['content']);
	});

	it('records each required member of the path a wildcard-reached kind has no route for', async () => {
		const d = derive([await placedModel(['(declared) @declaration.d', '(holder (_) @declaration.d)'].join('\n'))]);
		expect(d.wildcardUnrouted).toEqual(['g: shaped as declaration.d has no route for content']);
	});
});
