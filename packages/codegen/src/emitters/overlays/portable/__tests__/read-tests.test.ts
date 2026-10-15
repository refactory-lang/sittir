import { describe, expect, it } from 'vitest';
import type { SlotSubject } from '@sittir/types';
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
	enumMembers: [],
	text: null,
	pattern: null,
	variantOf: null,
	shownAs: []
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
		{ ...node('type_identifier', [slot('content', ['identifier'])]), modelType: 'alias' },
		node('fn', [slot('params', ['params'])]),
		node('params', [slot('items', ['param'], { multiple: true })]),
		node('param', [slot('element', ['self', 'plain'])]),
		node('self'),
		node('plain'),
		node('annotated', [slot('type', ['type_identifier', 'identifier'])]),
		node('cmp', [slot('left', ['identifier']), slot('ops', ['cmp_op'], { multiple: true })]),
		node('cmp_op', [slot('operators', [], { terminals: ['==', '<'] }), slot('right', ['identifier'])]),
		node('field_def', [slot('accessor', [], { required: false, storage: 'boolean', terminals: ['accessor'] }), slot('name', ['identifier'])]),
		node('member', [slot('modifier', ['modifier'], { required: false })]),
		{ ...node('modifier'), modelType: 'enum', enumMembers: [{ kind: 'private_keyword', text: 'private' }, { kind: 'public_keyword', text: 'public' }] }
	].map((n) => [n.kind, n])
);

const SLOTS = {
	'function_definition.name': { slots: { 100: 0 } },
	'decorated_definition.decorators': { slots: { 101: 1 } },
	'decorator.expression': { slots: { 102: 2 } },
	'string.start': { slots: { 103: 0 } },
	'binary.operator': { slots: { 104: 1 } },
	'type_identifier.content': { slots: { 105: 2 } },
	'fn.params': { slots: { 106: 0 } },
	'params.items': { slots: { 107: 1 } },
	'param.element': { slots: { 108: 2 } },
	'annotated.type': { slots: { 109: 0 } },
	'cmp.ops': { slots: { 110: 1 } },
	'cmp_op.operators': { slots: { 111: 2 } },
	'field_def.accessor': { slots: { 112: 0 } },
	'member.modifier': { slots: { 113: 1 } }
} as const satisfies Readonly<Record<string, SlotSubject>>;
const BY_KEY: Readonly<Record<string, SlotSubject>> = SLOTS;

const PRESENCE: Readonly<Record<string, string>> = { 'field_def.accessor': 'accessor' };

const presenceKeywordOf = (owner: string, name: string): string | undefined => PRESENCE[`${owner}.${name}`];

const TYPES: Readonly<Record<string, number>> = { param: 30, self: 31, plain: 32, type_identifier: 33, cmp_op: 34, modifier: 35, private_keyword: 36, public_keyword: 37 };

const testsOf = async (bindings: string, kind: string) => {
	const input: GrammarInput = { grammar: 'g', bindings: await readBindings(bindings), model: MODEL, textTokens: new Set(), layoutSlots: [] };
	const entries = resolveRoutes(input).readEntries.get(kind) ?? [];
	return entries.map((entry) => [entry.vocab, readTestOf(entry, MODEL, (owner, name) => BY_KEY[`${owner}.${name}`], presenceKeywordOf, (kind) => TYPES[kind])]);
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
			['type.named.prelude', [{ up: 0, via: [SLOTS['type_identifier.content']], plan: { op: 'match', pattern: '^Option$', self: true } }]]
		]);
	});

	it('tests an alias child\'s own kind, not the content it wraps', async () => {
		expect(await testsOf('(annotated type: (type_identifier)) @type.annotated.named', 'annotated')).toEqual([
			['type.annotated.named', [{ up: 0, via: [], plan: { op: 'is', types: [33], ...SLOTS['annotated.type'] } }]]
		]);
	});

	it('compares a member slot by its parser routes, and a pin by its slot\'s', async () => {
		expect(
			await testsOf(
				[
					'((function_definition name: (identifier) @name) @declaration.method.special (#match? @name "^__(?<stem>.*)__$"))',
					'(binary operator: "+") @expression.binary.add'
				].join('\n'),
				'function_definition'
			)
		).toEqual([
			['declaration.method.special', [{ up: 0, via: [], plan: { op: 'match', pattern: '^__(?<stem>.*)__$', ...SLOTS['function_definition.name'] } }]]
		]);
		expect(await testsOf('(binary operator: "+") @expression.binary.add', 'binary')).toEqual([
			['expression.binary.add', [{ up: 0, via: [], plan: { op: 'eq', text: '+', ...SLOTS['binary.operator'] } }]]
		]);
	});

	it('compares a hidden capture under the claimed node through the slot that holds it', async () => {
		expect(await testsOf('((string (string_start) @_p) @literal.string.interpolated (#match? @_p "^[a-zA-Z]*[fFtT]"))', 'string')).toEqual([
			['literal.string.interpolated', [{ up: 0, via: [], plan: { op: 'match', pattern: '^[a-zA-Z]*[fFtT]', ...SLOTS['string.start'] } }]]
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
						via: [SLOTS['decorated_definition.decorators']],
						plan: { op: 'eq', text: 'staticmethod', ...SLOTS['decorator.expression'] }
					}
				]
			]
		]);
	});

	it('tests the type of a captured node, stepping through the anchored first child of a list', async () => {
		expect(await testsOf('((fn (params . (param (self) @r))) @declaration.method (#kind-eq? @r "self"))', 'fn')).toEqual([
			[
				'declaration.method',
				[{ up: 0, via: [SLOTS['fn.params'], { ...SLOTS['params.items'], anchor: 'first' }], plan: { op: 'is', types: [31], ...SLOTS['param.element'] } }]
			]
		]);
	});

	it('negates a type test over every node a list step reaches', async () => {
		expect(await testsOf('((fn (params (param (_) @r))) @declaration.method.static (#not-kind-eq? @r "self" "plain"))', 'fn')).toEqual([
			[
				'declaration.method.static',
				[{ up: 0, via: [SLOTS['fn.params'], SLOTS['params.items']], plan: { op: 'not', of: { op: 'is', types: [31, 32], ...SLOTS['param.element'] } } }]
			]
		]);
	});

	it('steps to a slot\'s only node when the anchors place it after a node of another slot and last', async () => {
		expect(await testsOf('(cmp . (_) . (cmp_op operators: "<") .) @expression.binary.less', 'cmp')).toEqual([
			['expression.binary.less', [{ up: 0, via: [{ ...SLOTS['cmp.ops'], anchor: 'only' }], plan: { op: 'eq', text: '<', ...SLOTS['cmp_op.operators'] } }]]
		]);
	});

	it('tests two adjacent nodes of one slot as the slot not holding exactly one', async () => {
		expect(await testsOf('(cmp (cmp_op) . (cmp_op)) @expression.binary.chain', 'cmp')).toEqual([
			['expression.binary.chain', [{ up: 0, via: [{ ...SLOTS['cmp.ops'], anchor: 'only' }], plan: { op: 'not', of: { op: 'is', types: [34], self: true } } }]]
		]);
	});

	it('keeps an anchored last step as a step, and tests the node it reaches', async () => {
		expect(await testsOf('((params . (param) @p) @list.parameters (#kind-eq? @p "param"))', 'params')).toEqual([
			['list.parameters', [{ up: 0, via: [{ ...SLOTS['params.items'], anchor: 'first' }], plan: { op: 'is', types: [30], self: true } }]]
		]);
	});

	it('tests a child the pattern names by the type of its kind, once though a predicate restates it', async () => {
		expect(await testsOf('(param (self)) @declaration.parameter.receiver', 'param')).toEqual([
			['declaration.parameter.receiver', [{ up: 0, via: [], plan: { op: 'is', types: [31], ...SLOTS['param.element'] } }]]
		]);
		expect(await testsOf('((param (self) @r) @declaration.parameter.receiver (#kind-eq? @r "self"))', 'param')).toEqual([
			['declaration.parameter.receiver', [{ up: 0, via: [], plan: { op: 'is', types: [31], ...SLOTS['param.element'] } }]]
		]);
	});

	it('tests a member capture on an optional slot as holding no node of another kind', async () => {
		const model = new Map([...MODEL, ['opt', node('opt', [slot('element', ['self', 'plain'], { required: false })])]]);
		const input: GrammarInput = { grammar: 'g', bindings: await readBindings('(opt (self) @receiver) @declaration.parameter.receiver'), model, textTokens: new Set(), layoutSlots: [] };
		const [entry] = resolveRoutes(input).readEntries.get('opt') ?? [];
		expect(readTestOf(entry!, model, (owner, name) => (owner === 'opt' ? SLOTS['param.element'] : BY_KEY[`${owner}.${name}`]), presenceKeywordOf, (kind) => TYPES[kind])).toEqual([
			{ up: 0, via: [], plan: { op: 'not', of: { op: 'is', types: [32], ...SLOTS['param.element'] } } }
		]);
	});

	it('tests an enum kind\'s child by the kind and every member kind, since the reader holds the node as its member', async () => {
		expect(await testsOf('(member (modifier "private")) @declaration.member.private', 'member')).toEqual([
			[
				'declaration.member.private',
				[
					{ up: 0, via: [], plan: { op: 'is', types: [35, 36, 37], ...SLOTS['member.modifier'] } },
					{ up: 0, via: [], plan: { op: 'eq', text: 'private', ...SLOTS['member.modifier'] } }
				]
			]
		]);
	});

	it('tests a pin on a boolean slot by the keyword\'s presence, since the slot holds true, not the keyword\'s text', async () => {
		expect(await testsOf('(field_def accessor: "accessor") @declaration.property', 'field_def')).toEqual([
			['declaration.property', [{ up: 0, via: [], plan: { op: 'present', ...SLOTS['field_def.accessor'] } }]]
		]);
	});

	it('leaves out a comparison of an enum member\'s own text its fixed text decides', async () => {
		expect(await testsOf('((modifier) @access.private (#eq? @access.private "private"))', 'private_keyword')).toEqual([['access.private', []]]);
		expect(await testsOf('((modifier) @access.private (#eq? @access.private "private"))', 'public_keyword')).toEqual([]);
	});

	it('refuses a pin on a boolean slot whose text is not the slot\'s keyword, which no node could hold', async () => {
		await expect(testsOf('(field_def accessor: "readonly") @declaration.property', 'field_def')).rejects.toThrow(
			/declaration\.property.*accessor.*keyword 'accessor'/
		);
	});

	it('refuses a type test that names a kind with no type', async () => {
		await expect(testsOf('((fn (params (param (self) @r))) @declaration.method (#kind-eq? @r "nope"))', 'fn')).rejects.toThrow(
			/declaration\.method.*nope/
		);
	});

	it('refuses a predicate it cannot compile, naming the claim', async () => {
		await expect(testsOf('((boolean) @literal.boolean.x (#not-eq? @literal.boolean.x "x"))', 'boolean')).rejects.toThrow(
			/literal\.boolean\.x.*not-eq/
		);
	});
});
