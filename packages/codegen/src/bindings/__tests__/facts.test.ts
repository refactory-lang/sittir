import { describe, expect, it } from 'vitest';
import { type BindingFacts, type ClaimFact, bindFacts, refineClaims } from '../index.ts';

const claim = (vocab: string, kind: string | null, extra: Partial<ClaimFact> = {}): ClaimFact => ({
	vocab,
	kind,
	field: null,
	predicates: [],
	toplevel: true,
	within: [],
	fieldLiterals: {},
	tokens: [],
	children: [],
	...extra
});

describe('bindFacts', () => {
	const facts: BindingFacts = {
		claims: [claim('declaration.function', 'function_item', { within: ['impl_item'] }), claim('expression', '_')],
		members: [
			{ route: 'rename', owner: 'function_item', name: 'name', field: 'name', kind: 'identifier', after: { field: null, kind: 'fn', after: null, anchor: null }, anchor: null },
			{ route: 'presence', owner: 'function_item', name: 'isAsync', token: 'async', via: [{ field: null, kind: 'function_modifiers', after: null, anchor: null }] },
			{ route: 'nested', owner: 'function_item', name: 'body', parent: 'block', multiple: false, via: [{ field: null, kind: 'block', after: null, anchor: null }], field: null, kind: 'statement', after: null, anchor: null }
		],
		containers: [
			{
				kind: 'impl_item',
				element: { field: null, kind: 'function_item', after: null, anchor: null },
				captures: [{ name: 'attributes', token: null, multiple: true, field: null, kind: 'attribute_item', after: null, anchor: null }],
				dropped: [{ field: null, kind: 'line_comment', after: null, anchor: null }],
				reason: null,
				pattern: { line: 1, source: '(impl_item)' }
			}
		],
		templates: [{ vocabs: ['declaration.function'], target: 'function_item', template: '', holes: [] }],
		unclaimed: [{ kind: 'line_comment', reason: null }]
	};
	const bound = bindFacts(facts, (kind) => `bound_${kind}`);

	it('binds field selectors against their owning kinds through nested routes', () => {
		const step = (field: string, kind: string) => ({ field, kind, after: null, anchor: null });
		const fields: Record<string, Record<string, string>> = {
			function_item: { name: 'declaration_name', body: 'suite' },
			block: { name: 'block_name', value: 'expression' },
			impl_item: { name: 'implementation_name' }
		};
		const mapped = bindFacts(
			{
				...facts,
				members: [
					{ route: 'rename', owner: 'function_item', name: 'name', ...step('name', 'identifier') },
					{
						route: 'nested',
						owner: 'function_item',
						name: 'body',
						parent: 'block',
						multiple: false,
						via: [step('body', 'block')],
						...step('value', 'identifier')
					}
				],
				claims: [
					claim('declaration.function', 'function_item', {
						within: ['impl_item'],
						field: 'name',
						fieldLiterals: { name: 'f' },
						predicates: [
							{
								operator: 'eq',
								capture: 'v',
								arguments: [{ text: 'x' }],
								subject: { up: 0, down: [step('body', 'block'), step('name', 'identifier')] }
							}
						]
					})
				]
			},
			(kind) => kind,
			(owner: string, field: string) => fields[owner]?.[field] ?? field
		);
		expect(mapped.members).toEqual([
			{ route: 'rename', owner: 'function_item', name: 'name', ...step('declaration_name', 'identifier') },
			{
				route: 'nested',
				owner: 'function_item',
				name: 'body',
				parent: 'block',
				multiple: false,
				via: [step('suite', 'block')],
				...step('expression', 'identifier')
			}
		]);
		expect(mapped.claims[0]?.field).toBe('implementation_name');
		expect(mapped.claims[0]?.fieldLiterals).toEqual({ declaration_name: 'f' });
		expect(mapped.claims[0]?.predicates[0]?.subject).toEqual({
			up: 0,
			down: [step('suite', 'block'), step('block_name', 'identifier')]
		});
	});

	it('binds each step of a member’s via against the kind that holds it, walking from the owner outward though via is nearest first', () => {
		const step = (field: string, kind: string) => ({ field, kind, after: null, anchor: null });
		const fields: Record<string, Record<string, string>> = {
			required_parameter: { pattern: 'name' },
			object_pattern: { elements: 'items' }
		};
		const via = [step('elements', 'pair_pattern'), step('pattern', 'object_pattern')];
		const mapped = bindFacts(
			{
				...facts,
				members: [
					{ route: 'nested', owner: 'required_parameter', name: 'key', parent: 'pair_pattern', multiple: false, via, ...step('key', 'property_identifier') },
					{ route: 'presence', owner: 'required_parameter', name: 'shorthand', token: '...', via }
				]
			},
			(kind) => kind,
			(owner: string, field: string) => fields[owner]?.[field] ?? field
		);
		const bound = [step('items', 'pair_pattern'), step('name', 'object_pattern')];
		expect(mapped.members.map((m) => ('via' in m ? m.via : undefined))).toEqual([bound, bound]);
	});

	it('names every claimed kind and placement by its bound kind, and leaves a wildcard claim as it is', () => {
		expect(bound.claims.map((c) => [c.kind, c.within])).toEqual([
			['bound_function_item', ['bound_impl_item']],
			['_', []]
		]);
	});

	it("names the kinds each claim's child tests and predicates read, and the steps to them, by their bound kinds", () => {
		const step = { field: null, kind: 'block', after: null, anchor: null };
		const [claimed] = bindFacts(
			{
				...facts,
				claims: [
					claim('declaration.function', 'function_item', {
						predicates: [{ operator: 'kind-eq', capture: 'r', arguments: [{ text: 'self' }], subject: { up: 0, down: [step] } }],
						children: [
							{ subject: { up: 0, down: [step] }, kinds: ['block'], captured: false },
							{ subject: { up: 0, down: [step] }, text: '+' }
						]
					})
				]
			},
			(kind) => `bound_${kind}`
		).claims;
		const boundStep = { ...step, kind: 'bound_block' };
		expect(claimed?.predicates).toEqual([{ operator: 'kind-eq', capture: 'r', arguments: [{ text: 'bound_self' }], subject: { up: 0, down: [boundStep] } }]);
		expect(claimed?.children).toEqual([
			{ subject: { up: 0, down: [boundStep] }, kinds: ['bound_block'], captured: false },
			{ subject: { up: 0, down: [boundStep] }, text: '+' }
		]);
	});

	it("names the kinds a claim's sibling order and its anchors' neighbours select by their bound kinds", () => {
		const op = { field: null, kind: 'cmp_op', after: null, anchor: null };
		const [claimed] = bindFacts(
			{
				...facts,
				claims: [
					claim('expression.binary.chain', 'cmp', {
						children: [{ subject: { up: 0, down: [] }, siblings: [{ selector: op, bare: true }, { selector: { ...op, adjacent: { previous: op } }, bare: true }] }]
					})
				]
			},
			(kind) => `bound_${kind}`
		).claims;
		const boundOp = { ...op, kind: 'bound_cmp_op' };
		expect(claimed?.children).toEqual([
			{ subject: { up: 0, down: [] }, siblings: [{ selector: boundOp, bare: true }, { selector: { ...boundOp, adjacent: { previous: boundOp } }, bare: true }] }
		]);
	});

	it("names each member route's owner, path and selected kinds by their bound kinds", () => {
		expect(bound.members).toEqual([
			{ route: 'rename', owner: 'bound_function_item', name: 'name', field: 'name', kind: 'bound_identifier', after: { field: null, kind: 'bound_fn', after: null, anchor: null }, anchor: null },
			{ route: 'presence', owner: 'bound_function_item', name: 'isAsync', token: 'async', via: [{ field: null, kind: 'bound_function_modifiers', after: null, anchor: null }] },
			{ route: 'nested', owner: 'bound_function_item', name: 'body', parent: 'bound_block', multiple: false, via: [{ field: null, kind: 'bound_block', after: null, anchor: null }], field: null, kind: 'bound_statement', after: null, anchor: null }
		]);
	});

	it('names each container, its element, its captures and its dropped slots by their bound kinds', () => {
		const [container] = bound.containers;
		expect(container?.kind).toBe('bound_impl_item');
		expect(container?.element.kind).toBe('bound_function_item');
		expect(container?.captures.map((c) => c.kind)).toEqual(['bound_attribute_item']);
		expect(container?.dropped.map((c) => c.kind)).toEqual(['bound_line_comment']);
		expect(bound.unclaimed).toEqual([{ kind: 'bound_line_comment', reason: null }]);
	});
});

const SAME = (kind: string): readonly string[] => [kind];

describe('refineClaims', () => {
	it('marks a claim that extends another claim of the same kind and placement as its refinement', () => {
		const [parent, child] = refineClaims(
			[claim('expression.binary', 'binary_expression'), claim('expression.binary.add', 'binary_expression', { fieldLiterals: { operator: '+' } })],
			SAME
		);
		expect([parent?.refines, parent?.refinement]).toEqual([null, null]);
		expect([child?.refines, child?.refinement]).toEqual(['expression.binary', 'field-literal']);
	});

	it('refines the deepest claimed ancestor path in either order, and not a claim placed elsewhere', () => {
		const claims = [
			claim('literal.number', 'number'),
			claim('literal.number.integer', 'number', { tokens: ['0x'] }),
			claim('literal.number.integer.hex', 'number', { tokens: ['0x'] }),
			claim('literal.number.integer.big', 'number', { within: ['call'], tokens: ['n'] })
		];
		const expected = [null, 'literal.number', 'literal.number.integer', null];
		expect(refineClaims(claims, SAME).map((c) => c.refines)).toEqual(expected);
		expect(refineClaims([...claims].reverse(), SAME).map((c) => c.refines)).toEqual([...expected].reverse());
	});

	it('names how a refinement tells its nodes apart: predicate, field literal, token or child pattern', () => {
		const claims = refineClaims(
			[
				claim('identifier', 'identifier'),
				claim('identifier.receiver', 'identifier', { predicates: [{ operator: 'eq', capture: 'identifier.receiver', arguments: [{ text: 'self' }], subject: { up: 0, down: [] } }] }),
				claim('identifier.receiver.token', 'identifier', { tokens: ['self'] }),
				claim('identifier.receiver.token.child', 'identifier')
			],
			SAME
		);
		expect(claims.map((c) => c.refinement)).toEqual([null, 'predicate', 'token', 'child-pattern']);
	});

	it("refines a form's claim by its supertype's claim: a claim with a test of its own is a refinement, a plain one names the form", () => {
		const formsOf = (kind: string): readonly string[] =>
			kind === '_struct' ? ['_struct', 'struct_named', 'struct_unit'] : [kind];
		const unit = { subject: { up: 0, down: [] }, kinds: ['unit_marker'], captured: false };
		const claims = refineClaims(
			[claim('declaration.struct', '_struct'), claim('declaration.struct.named', 'struct_named'), claim('declaration.struct.unit', 'struct_unit', { children: [unit] })],
			formsOf
		);
		expect(claims.map((c) => [c.refines, c.refinement])).toEqual([
			[null, null],
			['declaration.struct', null],
			['declaration.struct', 'child-pattern']
		]);
	});

	it("keeps an unrefined claim's own predicate, field literal or token as its refinement kind", () => {
		const [claimed] = refineClaims([claim('identifier.receiver', 'identifier', { tokens: ['self'] })], SAME);
		expect([claimed?.refines, claimed?.refinement]).toEqual([null, 'token']);
	});
});
