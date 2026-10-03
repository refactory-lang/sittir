import { describe, expect, it } from 'vitest';
import { readBindings } from '../../src/inventory/bindings.ts';
import { type GrammarInput, derive } from '../../src/inventory/derive.ts';
import type { ModelNode, ModelSlot } from '../../src/inventory/model.ts';

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

const grammar = (bindings: string): GrammarInput => ({
	grammar: 'g',
	bindings: readBindings(bindings),
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
	it('land on the kinds the element slot names directly, not on kinds behind a supertype', () => {
		const d = derive([grammar([...CLAIMS, '(decorated (decorator)* @decorators body: (_) @element)'].join('\n'))]);
		expect(d.members.get('declaration.b')?.get('decorators')?.kinds).toEqual(new Set(['attribute.decorator']));
		expect(d.members.get('declaration.b')?.get('decorators')?.multiple).toBe(true);
		expect(d.members.get('declaration.a')?.has('decorators') ?? false).toBe(false);
		expect(d.untargeted).toEqual([]);
	});

	it('are reported, not spread, when the element slot names no kind directly', () => {
		const d = derive([grammar([...CLAIMS, '(declared "declare" @declare (_) @element)'].join('\n'))]);
		expect(d.untargeted).toEqual(['g: declared (declare)']);
		for (const [v, members] of d.members) expect(members.has('declare'), v).toBe(false);
	});

	it('leave no slot of the container behind unless the pattern drops it on purpose', () => {
		const silent = derive([grammar([...CLAIMS, '(marked body: (_) @element)'].join('\n'))]);
		expect(silent.uncaptured).toEqual([
			'g:4 (marked body: (_) @element) leaves async uncaptured',
			'g:4 (marked body: (_) @element) leaves marks uncaptured'
		]);
		const marked = derive([
			grammar(
				[
					...CLAIMS,
					'((marked (mark)* @dropped "async" @async body: (_) @element) (#set! reason "marks carry nothing portable"))'
				].join('\n')
			)
		]);
		expect(marked.uncaptured).toEqual([]);
		expect(marked.members.get('declaration.b')?.get('async')?.kinds).toEqual(new Set(['boolean']));
	});

	it('leave a claimed wrapper to its own members', () => {
		const d = derive([grammar([...CLAIMS, '(declared) @declaration.declared'].join('\n'))]);
		expect(d.untargeted).toEqual([]);
		expect([...(d.members.get('declaration.declared')?.keys() ?? [])]).toEqual(['content']);
	});
});
