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

	it('names every claimed kind and placement by its bound kind, and leaves a wildcard claim as it is', () => {
		expect(bound.claims.map((c) => [c.kind, c.within])).toEqual([
			['bound_function_item', ['bound_impl_item']],
			['_', []]
		]);
	});

	it('names each member route\'s owner, path and selected kinds by their bound kinds', () => {
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

describe('refineClaims', () => {
	it('marks a claim that extends an earlier claim of the same kind and placement as its refinement', () => {
		const [parent, child] = refineClaims([
			claim('expression.binary', 'binary_expression'),
			claim('expression.binary.add', 'binary_expression', { fieldLiterals: { operator: '+' } })
		]);
		expect([parent?.refines, parent?.refinement]).toEqual([null, null]);
		expect([child?.refines, child?.refinement]).toEqual(['expression.binary', 'field-literal']);
	});

	it('refines the deepest earlier path, and not a claim placed elsewhere', () => {
		const claims = refineClaims([
			claim('literal.number', 'number'),
			claim('literal.number.integer', 'number', { tokens: ['0x'] }),
			claim('literal.number.integer.hex', 'number', { tokens: ['0x'] }),
			claim('literal.number.integer.big', 'number', { within: ['call'], tokens: ['n'] })
		]);
		expect(claims.map((c) => c.refines)).toEqual([null, 'literal.number', 'literal.number.integer', null]);
	});

	it('names how a refinement tells its nodes apart: predicate, field literal, token or child pattern', () => {
		const claims = refineClaims([
			claim('identifier', 'identifier'),
			claim('identifier.self', 'identifier', { predicates: [{ operator: 'eq', capture: 'identifier.self', arguments: [{ text: 'self' }], subject: { up: 0, down: [] } }] }),
			claim('identifier.self.token', 'identifier', { tokens: ['self'] }),
			claim('identifier.self.token.child', 'identifier')
		]);
		expect(claims.map((c) => c.refinement)).toEqual([null, 'predicate', 'token', 'child-pattern']);
	});

	it('keeps an unrefined claim\'s own predicate, field literal or token as its refinement kind', () => {
		const [claimed] = refineClaims([claim('identifier.self', 'identifier', { tokens: ['self'] })]);
		expect([claimed?.refines, claimed?.refinement]).toEqual([null, 'token']);
	});
});
