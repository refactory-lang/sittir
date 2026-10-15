import { describe, expect, it } from 'vitest';
import { projectLeadFacts } from '../lead-facts.ts';
import { readBindings } from '../read.ts';
import type { LeadEffect } from '../../dsl/bind.ts';

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
