import { describe, expect, it } from 'vitest';
import type { SlotRoutes } from '@sittir/types';
import { type GrammarInput, type ModelNode, type ModelSlot, readBindings, resolveRoutes } from '../../../../bindings/index.ts';
import { readTestOf } from '../read-tests.ts';

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

const node = (kind: string, slots: readonly ModelSlot[] = []): ModelNode => ({
	kind,
	modelType: 'branch',
	slots,
	subtypes: [],
	elementKinds: [],
	enumValues: [],
	text: null,
	pattern: null
});

const MODEL = new Map(
	[
		node('function_definition', [slot('name', ['identifier']), slot('body', ['block'])]),
		node('decorated_definition', [slot('decorators', ['decorator'], { multiple: true }), slot('definition', ['function_definition'])]),
		node('decorator', [slot('expression', ['identifier'])]),
		node('string', [slot('start', ['string_start']), slot('content', ['string_content'], { multiple: true })]),
		node('binary', [slot('left', ['identifier']), slot('operator', [], { terminals: ['+', '-'] }), slot('right', ['identifier'])]),
		node('identifier'),
		node('boolean'),
		{ ...node('type_identifier', [slot('content', ['identifier'])]), modelType: 'alias' }
	].map((n) => [n.kind, n])
);

const ROUTES: Readonly<Record<string, SlotRoutes>> = {
	'function_definition.name': { fields: ['name'], kinds: [] },
	'decorated_definition.decorators': { fields: [], kinds: ['decorator'] },
	'decorator.expression': { fields: [], kinds: ['identifier'] },
	'string.start': { fields: [], kinds: ['string_start'] },
	'binary.operator': { fields: ['operator'], kinds: [] },
	'type_identifier.content': { fields: [], kinds: ['identifier'] }
};

const testsOf = async (bindings: string, kind: string) => {
	const input: GrammarInput = { grammar: 'g', bindings: await readBindings(bindings), model: MODEL, textTokens: new Set(), layoutSlots: [] };
	const entries = resolveRoutes(input).readEntries.get(kind) ?? [];
	return entries.map((entry) => [entry.vocab, readTestOf(entry, MODEL, (owner, name) => ROUTES[`${owner}.${name}`])]);
};

describe('readTestOf', () => {
	it('tests a plain claim by nothing', async () => {
		expect(await testsOf('(boolean) @literal.boolean', 'boolean')).toEqual([['literal.boolean', []]]);
	});

	it('compares the claimed node\'s own text when the predicate tests the claim\'s capture', async () => {
		expect(await testsOf('((boolean) @literal.boolean.true (#eq? @literal.boolean.true "true"))', 'boolean')).toEqual([
			['literal.boolean.true', [{ up: 0, via: [], plan: { op: 'eq', text: 'true', self: true } }]]
		]);
	});

	it('compares an alias\'s own text through the content it wraps', async () => {
		expect(await testsOf('((type_identifier) @type.named.prelude (#match? @type.named.prelude "^Option$"))', 'type_identifier')).toEqual([
			['type.named.prelude', [{ up: 0, via: [{ fields: [], kinds: ['identifier'] }], plan: { op: 'match', pattern: '^Option$', self: true } }]]
		]);
	});

	it('compares a member slot by its parser routes, and a pin by its slot\'s', async () => {
		expect(
			await testsOf(
				[
					'((function_definition name: (identifier) @name) @declaration.method.dunder (#match? @name "^__(?<stem>.*)__$"))',
					'(binary operator: "+") @expression.binary.add'
				].join('\n'),
				'function_definition'
			)
		).toEqual([
			['declaration.method.dunder', [{ up: 0, via: [], plan: { op: 'match', pattern: '^__(?<stem>.*)__$', fields: ['name'], kinds: [] } }]]
		]);
		expect(await testsOf('(binary operator: "+") @expression.binary.add', 'binary')).toEqual([
			['expression.binary.add', [{ up: 0, via: [], plan: { op: 'eq', text: '+', fields: ['operator'], kinds: [] } }]]
		]);
	});

	it('compares a hidden capture under the claimed node through the slot that holds it', async () => {
		expect(await testsOf('((string (string_start) @_p) @literal.string.f (#match? @_p "^[fF]"))', 'string')).toEqual([
			['literal.string.f', [{ up: 0, via: [], plan: { op: 'match', pattern: '^[fF]', fields: [], kinds: ['string_start'] } }]]
		]);
	});

	it('runs a placed predicate on the enclosing node that holds its capture, stepping down to the compared slot', async () => {
		expect(
			await testsOf(
				'((decorated_definition (decorator (identifier) @_d) (function_definition) @declaration.method.static) (#eq? @_d "staticmethod"))',
				'function_definition'
			)
		).toEqual([
			[
				'declaration.method.static',
				[
					{
						up: 1,
						via: [{ fields: [], kinds: ['decorator'] }],
						plan: { op: 'eq', text: 'staticmethod', fields: [], kinds: ['identifier'] }
					}
				]
			]
		]);
	});

	it('refuses a predicate it cannot compile, naming the claim', async () => {
		await expect(testsOf('((boolean) @literal.boolean.x (#not-eq? @literal.boolean.x "x"))', 'boolean')).rejects.toThrow(
			/literal\.boolean\.x.*not-eq/
		);
	});
});
