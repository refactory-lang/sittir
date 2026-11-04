import { describe, expect, it } from 'vitest';
import { expandHeldMembers, projectLeadFacts as projectWith } from '../lead-facts.ts';
import { readBindings } from '../read.ts';
import type { BindingFacts, ModelNode, ModelSlot, SlotModel } from '../facts.ts';
import type { LeadEffect } from '../../dsl/verbs/effects.ts';

const slot = (name: string, kinds: readonly string[], extra: Partial<ModelSlot> = {}): ModelSlot => ({
	name,
	propertyName: name,
	required: false,
	multiple: false,
	storage: 'verbatim',
	kinds,
	terminals: [],
	...extra
});

const node = (kind: string, slots: readonly ModelSlot[] = [], extra: Partial<ModelNode> = {}): ModelNode => ({
	kind,
	modelType: 'branch',
	unit: false,
	layout: false,
	seated: false,
	slots,
	subtypes: [],
	defaultSubtype: null,
	elementKinds: [],
	enumMembers: [],
	text: null,
	pattern: null,
	variantOf: null,
	splitFrom: null,
	aliasStorage: null,
	interiorPart: null,
	shownAs: [],
	...extra
});

const MODEL: SlotModel = new Map(
	[
		node('function', [slot('name', ['identifier']), slot('entries', ['entries', 'entries_receiver'])]),
		node('setter', [slot('entries', ['entries'])]),
		node('impl', [slot('clause', ['positive', 'negative', 'bare'])]),
		node('positive', [slot('trait', ['identifier'])]),
		node('negative', [slot('trait', ['identifier'])]),
		node('bare'),
		node('copy_first', [slot('mid', ['_copy', 'named'])]),
		node('named_first', [slot('mid', ['named', '_copy'])]),
		node('_copy', [slot('other', ['identifier'])], { shownAs: ['named'] }),
		node('named', [slot('value', ['identifier'])]),
		node('entries', [slot('parameter', ['parameter'], { multiple: true })], { modelType: 'list' }),
		node('entries_receiver', [slot('receiver', ['receiver_parameter']), slot('entries_receiver_group', ['entries_receiver_group'])]),
		node('entries_receiver_group', [slot('elements', ['entries'])]),
		node('parameter', [slot('attribute', ['attribute'], { required: false }), slot('name', ['identifier', 'self']), slot('type', ['type_identifier', 'identifier']), slot('default', ['identifier'])]),
		node('receiver_parameter', [slot('attribute', ['attribute'], { required: false }), slot('name', ['self']), slot('type', ['type_identifier', 'identifier'])]),
		node('attribute'),
		node('identifier'),
		node('self'),
		node('type_identifier')
	].map((n) => [n.kind, n])
);

const projectLeadFacts = (facts: BindingFacts, effects: readonly LeadEffect[]): BindingFacts => projectWith(facts, effects, MODEL);

const effect: LeadEffect = {
	kind: 'lead',
	list: 'entries',
	item: 'parameter',
	field: 'receiver',
	receiver: 'entries_receiver',
	group: 'entries_receiver_group',
	restField: 'elements',
	variants: { parameter: 'receiver_parameter' },
	admits: [{ kind: 'parameter', within: { field: 'name', admits: [{ kind: 'self' }] }, as: 'receiver_parameter' }]
};

describe('held member expansion', () => {
	it('expands a wildcard step into each kind its slot holds that has the next slot, naming that kind', async () => {
		const facts = await readBindings('(impl clause: (_ trait: (_) @implements))');
		const [member] = facts.members;
		expect(expandHeldMembers(facts, MODEL).members).toEqual(
			['negative', 'positive'].map((kind) => ({ ...member, parent: kind, via: [{ ...(member as { via: readonly object[] }).via[0], kind }] }))
		);
	});

	it.each(['copy_first', 'named_first'])("expands a wildcard step into the original %s holds beside a copy shown as it, when only the original takes the rest of the path", async (holder) => {
		const facts = await readBindings(`(${holder} mid: (_ value: (_) @value))`);
		const [member] = facts.members;
		expect(expandHeldMembers(facts, MODEL).members).toEqual([
			{ ...member, parent: 'named', via: [{ ...(member as { via: readonly object[] }).via[0], kind: 'named' }] }
		]);
	});

	it('leaves a member with no wildcard step as it is', async () => {
		const facts = await readBindings('(impl clause: (positive trait: (_) @implements))');
		expect(expandHeldMembers(facts, MODEL)).toEqual(facts);
	});
});

describe('lead fact projection', () => {
	it('carries a cloned receiver wrapper\'s declared container and dropped layout', async () => {
		const facts = await readBindings('((parameter (attribute)? @dropped (_) @element) (#set! reason "layout"))');
		expect(facts.containers).toHaveLength(1);
		const projected = projectLeadFacts(facts, [effect]);
		expect(projected.containers).toEqual([
			facts.containers[0],
			{ ...facts.containers[0], kind: 'receiver_parameter' }
		]);
	});
	it('copies a declared container onto the receiver form only where the form holds its selectors', async () => {
		const facts = await readBindings('(parameter (attribute)? @attributes default: (_) @element)');
		expect(projectLeadFacts(facts, [effect]).containers).toEqual([facts.containers[0]]);
	});
	it('keeps all captures sharing the receiver-qualified claim attached to its projected index', async () => {
		const facts = await readBindings('(function name: (identifier) @name (entries . (parameter name: (self)) @receiver parameter: (_)* @parameters)) @declaration.method');
		const projected = projectLeadFacts(facts, [effect]);
		expect(projected.claims).toHaveLength(1);
		for (const member of projected.members) expect(member.claims).toEqual([0]);
		expect(projected.members).toContainEqual(expect.objectContaining({ route: 'rename', name: 'name', owner: 'function', field: 'name' }));
		expect(projected.members).toContainEqual(expect.objectContaining({ route: 'nested', name: 'receiver', parent: 'entries_receiver' }));
	});

	it('projects a cloned claim\'s owned capture with its owner and branch-specific index', async () => {
		const facts = await readBindings('(parameter type: (type_identifier) @type) @declaration.parameter');
		const projected = projectLeadFacts(facts, [effect]);
		expect(projected.claims.map((claim) => claim.kind)).toEqual(['parameter', 'receiver_parameter']);
		expect(projected.members).toEqual([
			expect.objectContaining({ owner: 'parameter', claims: [0], name: 'type' }),
			expect.objectContaining({ owner: 'receiver_parameter', claims: [1], name: 'type' })
		]);
	});

	it("copies a cloned claim's member onto the receiver form only where the form holds its slot", async () => {
		const facts = await readBindings('(parameter default: (_) @default type: (_) @type) @declaration.parameter');
		const projected = projectLeadFacts(facts, [effect]);
		expect(projected.members.map((member) => [member.owner, 'name' in member ? member.name : null])).toEqual([
			['parameter', 'default'],
			['parameter', 'type'],
			['receiver_parameter', 'type']
		]);
	});

	it('projects receiver child tests and its capture through the exact minted form', async () => {
		const facts = await readBindings('(function (entries . (parameter name: (self)) @receiver)) @declaration.method');
		const projected = projectLeadFacts(facts, [effect]);
		const claim = projected.claims[0]!;
		expect(claim.children).toContainEqual(
			expect.objectContaining({
				subject: {
					up: 0,
					down: [
						expect.objectContaining({ kind: 'entries_receiver' }),
						expect.objectContaining({ kind: 'receiver_parameter', field: 'receiver', anchor: null })
					]
				},
				kinds: ['receiver_parameter']
			})
		);
		expect(projected.members).toContainEqual(
			expect.objectContaining({
				route: 'nested',
				parent: 'entries_receiver',
				kind: 'receiver_parameter',
				field: 'receiver',
				anchor: null,
				via: [expect.objectContaining({ kind: 'entries_receiver' })]
			})
		);
		expect(claim.children.some((child) => child.subject.down.some((step) => step.kind === 'entries'))).toBe(false);
	});

	it('keeps the plain rest route and adds its route through the canonical group', async () => {
		const facts = await readBindings('(function (entries parameter: (_)* @parameters))');
		const projected = projectLeadFacts(facts, [effect]);
		expect(projected.members).toHaveLength(2);
		expect(projected.members[0]).toEqual(facts.members[0]);
		expect(projected.members[1]).toEqual(
			expect.objectContaining({
				parent: 'entries',
				via: [
					expect.objectContaining({ kind: 'entries', field: 'elements' }),
					expect.objectContaining({ kind: 'entries_receiver_group' }),
					expect.objectContaining({ kind: 'entries_receiver' })
				]
			})
		);
	});

	it('adds no route through the receiver for an owner that holds no receiver form', async () => {
		const facts = await readBindings('(setter (entries parameter: (_)* @parameters))');
		expect(projectLeadFacts(facts, [effect]).members).toEqual(facts.members);
	});

	it('routes the tests, predicates and sibling order of ordinary parameters through the rest list, not the receiver', async () => {
		const facts = await readBindings(
			'((function (entries . (parameter name: (self)) @receiver (parameter name: (self)) . (parameter name: (identifier) @rest))) @declaration.method (#eq? @rest "x"))'
		);
		const projected = projectLeadFacts(facts, [effect]);
		const claim = projected.claims[0]!;
		const rest = [
			expect.objectContaining({ kind: 'entries_receiver' }),
			expect.objectContaining({ kind: 'entries_receiver_group' }),
			expect.objectContaining({ kind: 'entries', field: 'elements' })
		];
		const restParameter = expect.objectContaining({ kind: 'parameter', field: null, anchor: null });
		expect(claim.predicates[0]?.subject?.down).toEqual([...rest, restParameter, expect.objectContaining({ kind: 'identifier', field: 'name' })]);
		expect(claim.children).toContainEqual({ subject: { up: 0, down: [...rest, restParameter, expect.objectContaining({ kind: 'self', field: 'name' })] }, kinds: ['self'], captured: false });
		expect(claim.children).toContainEqual({
			subject: { up: 0, down: rest },
			siblings: [
				{ selector: { field: null, kind: 'parameter', after: null, anchor: null, adjacent: { next: expect.objectContaining({ kind: 'parameter' }) } }, bare: false },
				{ selector: expect.objectContaining({ kind: 'parameter', adjacent: { previous: expect.objectContaining({ kind: 'parameter' }) } }), bare: false }
			]
		});
		const steps = claim.children.flatMap((child) => child.subject.down);
		expect(steps.filter((step) => step.field === 'receiver')).toEqual(steps.filter((step) => step.field === 'receiver' && step.adjacent === undefined));
		expect(projected.members).toContainEqual(
			expect.objectContaining({ name: 'rest', parent: 'parameter', via: [restParameter, ...rest.toReversed()] })
		);
	});

	it('discharges only the kind restriction guaranteed by the minted receiver', async () => {
		const facts = await readBindings(
			'(function (entries . (parameter name: (self) type: (identifier)) @receiver)) @declaration.method'
		);
		const claim = projectLeadFacts(facts, [effect]).claims[0]!;
		expect(claim.children.some((child) => 'kinds' in child && child.kinds.includes('self'))).toBe(false);
		expect(claim.children).toContainEqual(expect.objectContaining({ kinds: ['identifier'] }));
	});

	it('retains a test that distinguishes alternatives inside the receiver', async () => {
		const facts = await readBindings('(function (entries . (parameter name: (self)) @receiver)) @declaration.method');
		const union = {
			...effect,
			admits: [{ kind: 'parameter', within: { field: 'name', admits: [{ kind: 'self' }, { kind: 'other_receiver' }] } }]
		};
		const claim = projectLeadFacts(facts, [union]).claims[0]!;
		expect(claim.children).toContainEqual(expect.objectContaining({ kinds: ['self'] }));
	});

	it('does not identify an unrelated anchored capture as the receiver declaration', async () => {
		const facts = await readBindings('(function (entries . (parameter) @first)) @declaration.function');
		expect(projectLeadFacts(facts, [effect]).claims).toEqual(facts.claims);
	});
});
