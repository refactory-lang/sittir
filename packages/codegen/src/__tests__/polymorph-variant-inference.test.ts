/**
 * polymorph-variant-inference.test.ts — targeted unit tests for polymorph
 * `$variant` stamping inside `nodeToConfig`.
 *
 * Exercises both the 'override' (named-child $type lookup) and
 * 'promoted' (field-presence on derived config) paths. The helper's
 * exported name may shift under the in-flight `PolymorphVariantDescriptor`
 * refactor — tests assert PUBLIC BEHAVIOR by calling `nodeToConfig` and
 * reading `config.$variant`.
 *
 * Phase D: $type is numeric. Tests use small integer IDs and a local
 * kindNameFromId resolver to keep fixtures readable.
 */

import { describe, it, expect } from 'vitest';
import { nodeToConfig, type NodeToConfigOpts } from '../validate/common.ts';

// ---------------------------------------------------------------------------
// Minimal numeric kind catalog for test fixtures
// ---------------------------------------------------------------------------
const KIND = {
	assignment: 1,
	assignment_eq: 2,
	assignment_type: 3,
	some_unregistered: 4,
	range_expression: 5,
	integer_literal: 6,
	plain_kind: 7,
	x: 8,
	dotdot: 9,
	token_tree: 10,
	delim_token_tree_paren: 11
} as const;

const kindNames: ReadonlyMap<number, string> = new Map(Object.entries(KIND).map(([name, id]) => [id, name]));

const kindNameFromId = (id: number): string | undefined => kindNames.get(id);

// ---------------------------------------------------------------------------
// Override path — $variant derives from the kind of a matching NAMED child.
// ---------------------------------------------------------------------------

describe('nodeToConfig — polymorph $variant (override source)', () => {
	const makeOpts = (childKind: Record<string, string>): NodeToConfigOpts => ({
		polymorphVariants: {
			assignment: { source: 'override', childKind }
		},
		kindNameFromId
	});

	it('stamps $variant when the first named child kind is registered', () => {
		const data = {
			$type: KIND.assignment,
			$children: [{ $type: KIND.assignment_eq, $named: true }]
		};
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: 'eq', assignment_type: 'type' }));
		expect(cfg.$variant).toBe('eq');
	});

	it('does NOT stamp $variant when the first child kind is absent from the map', () => {
		const data = {
			$type: KIND.assignment,
			$children: [{ $type: KIND.some_unregistered, $named: true }]
		};
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: 'eq' }));
		expect('$variant' in cfg).toBe(false);
	});

	it('skips anonymous tokens — uses the first NAMED child', () => {
		const data = {
			$type: KIND.assignment,
			$children: [
				{ $type: KIND.dotdot, $named: false },
				{ $type: KIND.assignment_eq, $named: true }
			]
		};
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: 'eq' }));
		expect(cfg.$variant).toBe('eq');
	});

	it('does NOT stamp $variant when the node has no children at all', () => {
		const data = { $type: KIND.assignment };
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: 'eq' }));
		expect('$variant' in cfg).toBe(false);
	});

	it('does NOT stamp $variant when $children is empty', () => {
		const data = { $type: KIND.assignment, $children: [] };
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: 'eq' }));
		expect('$variant' in cfg).toBe(false);
	});

	it('matches hidden helper child kinds by variant suffix when exact kind lookup misses', () => {
		const data = {
			$type: KIND.token_tree,
			$children: [{ $type: KIND.delim_token_tree_paren, $named: true }]
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				token_tree: {
					source: 'override',
					childKind: {
						token_tree_paren: 'paren',
						token_tree_bracket: 'bracket',
						token_tree_brace: 'brace'
					}
				}
			},
			kindNameFromId
		});
		expect(cfg.$variant).toBe('paren');
	});

	it('prefers the longest matching variant suffix when matches overlap', () => {
		const data = {
			$type: KIND.token_tree,
			$children: [{ $type: KIND.delim_token_tree_paren, $named: true }]
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				token_tree: {
					source: 'override',
					childKind: {
						token_tree_paren: 'paren',
						token_tree_tree_paren: 'tree_paren'
					}
				}
			},
			kindNameFromId
		});
		expect(cfg.$variant).toBe('tree_paren');
	});

	it('falls back to the CST wrapper child kind when native read collapsed the helper kind', () => {
		const data = {
			$type: KIND.token_tree,
			$children: [{ $type: KIND.some_unregistered, $named: true }]
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				token_tree: {
					source: 'override',
					childKind: {
						token_tree_paren: 'paren',
						token_tree_bracket: 'bracket'
					}
				}
			},
			firstNamedChildKindHint: 'token_tree_paren',
			kindNameFromId
		});
		expect(cfg.$variant).toBe('paren');
	});

	it('falls back to the CST node kind when the intermediate wrapper owns the discriminator', () => {
		const data = {
			$type: KIND.token_tree,
			$children: [{ $type: KIND.some_unregistered, $named: true }]
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				token_tree: {
					source: 'override',
					childKind: {
						token_tree_paren: 'paren',
						token_tree_bracket: 'bracket'
					}
				}
			},
			cstNodeKindHint: 'token_tree_paren',
			firstNamedChildKindHint: 'some_unregistered',
			namedChildKindHints: ['some_unregistered'],
			kindNameFromId
		});
		expect(cfg.$variant).toBe('paren');
	});

	it('falls back to later CST named children when the discriminating wrapper is not first', () => {
		const data = {
			$type: KIND.assignment,
			$children: [{ $type: KIND.some_unregistered, $named: true }]
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				assignment: {
					source: 'override',
					childKind: {
						assignment_eq: 'eq',
						assignment_type: 'type'
					}
				}
			},
			firstNamedChildKindHint: 'some_unregistered',
			namedChildKindHints: ['some_unregistered', 'assignment_type'],
			kindNameFromId
		});
		expect(cfg.$variant).toBe('type');
	});

	it('uses structural marker tokens from anonymous slots when wrapper kinds are absent', () => {
		const data = {
			$type: KIND.assignment,
			$children: [{ $type: KIND.some_unregistered, $named: true }],
			'_,': { $type: KIND.dotdot, $named: false }
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				assignment: {
					source: 'override',
					childKind: {
						assignment_with_comma: 'with_comma',
						assignment_block_ending: 'block_ending'
					}
				}
			},
			kindNameFromId
		});
		expect(cfg.$variant).toBe('with_comma');
	});

	it('uses weighted structural tokens from CST and child kinds to select the best variant', () => {
		const data = {
			$type: KIND.token_tree,
			_function: { $type: KIND.x, $named: true },
			_arguments: { $type: KIND.dotdot, $named: true }
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				token_tree: {
					source: 'override',
					childKind: {
						token_tree_call: 'call',
						token_tree_template_call: 'template_call',
						token_tree_member: 'member'
					}
				}
			},
			cstNodeKindHint: 'token_tree',
			namedChildKindHints: ['member_expression', 'arguments'],
			kindNameFromId
		});
		expect(cfg.$variant).toBe('member');
	});

	it('falls back to the first two-form variant when no shared marker token is present', () => {
		const data = {
			$type: KIND.token_tree,
			$children: [{ $type: KIND.some_unregistered, $named: true }]
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				token_tree: {
					source: 'override',
					childKind: {
						token_tree_typed: 'typed',
						token_tree_sequence: 'sequence'
					}
				}
			},
			cstNodeKindHint: 'token_tree',
			namedChildKindHints: ['member_expression'],
			kindNameFromId
		});
		expect(cfg.$variant).toBe('typed');
	});
});

// ---------------------------------------------------------------------------
// Promoted path — $variant derives from field-presence on the derived config.
// ---------------------------------------------------------------------------

describe('nodeToConfig — polymorph $variant (promoted source)', () => {
	const makeOpts = (fields: Record<string, readonly string[]>): NodeToConfigOpts => ({
		polymorphVariants: {
			range_expression: { source: 'promoted', fields }
		},
		kindNameFromId
	});

	it('stamps the form whose every listed field appears on the derived config', () => {
		const data = {
			$type: KIND.range_expression,
			_start: { $type: KIND.integer_literal, $text: '0', $named: true },
			_end: { $type: KIND.integer_literal, $text: '10', $named: true }
		};
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ['start', 'end'],
				prefix: ['end']
			})
		);
		expect(cfg.$variant).toBe('binary');
	});

	it('picks the MOST-SPECIFIC form when one fields set is a superset of another', () => {
		const data = {
			$type: KIND.range_expression,
			_start: { $type: KIND.integer_literal, $text: '0', $named: true },
			_end: { $type: KIND.integer_literal, $text: '10', $named: true },
			_operator: { $type: KIND.dotdot, $named: false }
		};
		// Both `binary` (2 fields) and `ternary` (3 fields) match; ternary wins.
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ['start', 'end'],
				ternary: ['start', 'end', 'operator']
			})
		);
		expect(cfg.$variant).toBe('ternary');
	});

	it('falls back to the zero-field form when no other form matches', () => {
		const data = {
			$type: KIND.range_expression,
			_nomatch: { $type: KIND.integer_literal, $text: '1', $named: true }
		};
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ['start', 'end'],
				bare: []
			})
		);
		expect(cfg.$variant).toBe('bare');
	});

	it('does NOT stamp $variant when no form matches and no zero-field fallback exists', () => {
		const data = {
			$type: KIND.range_expression,
			_nomatch: { $type: KIND.integer_literal, $text: '1', $named: true }
		};
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ['start', 'end'],
				prefix: ['end']
			})
		);
		expect('$variant' in cfg).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Descriptor absence / non-polymorph kinds — never stamp.
// ---------------------------------------------------------------------------

describe('nodeToConfig — polymorph $variant (no descriptor)', () => {
	it('does NOT stamp $variant when polymorphVariants is absent', () => {
		const data = {
			$type: KIND.assignment,
			$children: [{ $type: KIND.assignment_eq, $named: true }]
		};
		const cfg = nodeToConfig(data, { kindNameFromId });
		expect('$variant' in cfg).toBe(false);
	});

	it('does NOT stamp $variant when the parent kind has no descriptor entry', () => {
		const data = {
			$type: KIND.plain_kind,
			_x: { $type: KIND.x, $text: 'x', $named: true }
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				// different kind — should not fire
				assignment: { source: 'override', childKind: { assignment_eq: 'eq' } }
			},
			kindNameFromId
		});
		expect('$variant' in cfg).toBe(false);
	});
});
