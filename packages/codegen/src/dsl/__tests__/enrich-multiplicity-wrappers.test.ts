import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('enrichMultiplicityWrappers', () => {
	it('optional propagates multiplicity=optional + nonterminal onto content', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'optional', content: { type: 'symbol', name: 'X' } }
				}
			}
		};
		const e = enrich(grammar);
		const root = e.grammar.rules.root as { content: { multiplicity?: string; nonterminal?: boolean } };
		expect(root.content.multiplicity).toBe('optional');
		expect(root.content.nonterminal).toBe(true);
	});

	it('repeat propagates multiplicity=array + nonterminal', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'repeat', content: { type: 'symbol', name: 'X' } }
				}
			}
		};
		const e = enrich(grammar);
		const root = e.grammar.rules.root as { content: { multiplicity?: string; nonterminal?: boolean } };
		expect(root.content.multiplicity).toBe('array');
		expect(root.content.nonterminal).toBe(true);
	});

	it('repeat1 propagates multiplicity=nonEmptyArray + nonterminal', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'repeat1', content: { type: 'symbol', name: 'X' } }
				}
			}
		};
		const e = enrich(grammar);
		const root = e.grammar.rules.root as { content: { multiplicity?: string; nonterminal?: boolean } };
		expect(root.content.multiplicity).toBe('nonEmptyArray');
		expect(root.content.nonterminal).toBe(true);
	});

	it('composes with enrichFieldWrappers: optional(field(...)) propagates both', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'optional',
						content: {
							type: 'field',
							name: 'x',
							content: { type: 'symbol', name: 'X' }
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		const inner = (e.grammar.rules.root as any).content.content;
		expect(inner.fieldName).toBe('x');
		expect(inner.multiplicity).toBe('optional');
		expect(inner.nonterminal).toBe(true);
	});

	it('field+multiplicity ordering is idempotent across both orderings', () => {
		// Apply each ordering manually and assert identical output.
		// (Import enrichFieldWrappers + enrichMultiplicityWrappers from enrich.ts
		// if they're exported; otherwise verify via full enrich() composition.)
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					a: {
						type: 'optional',
						content: {
							type: 'field',
							name: 'x',
							content: { type: 'symbol', name: 'X' }
						}
					},
					b: {
						type: 'field',
						name: 'x',
						content: {
							type: 'optional',
							content: { type: 'symbol', name: 'X' }
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		// Both forms should produce the same inner attribute set on the leaf symbol.
		const aInner = (e.grammar.rules.a as any).content.content;
		const bInner = (e.grammar.rules.b as any).content;
		// a's inner should have fieldName, multiplicity, nonterminal
		expect(aInner.fieldName).toBe('x');
		expect(aInner.multiplicity).toBe('optional');
		expect(aInner.nonterminal).toBe(true);
		// b's inner (optional under field) should also have all three after composition
		// — verify both forms converge on the same attribute set
		expect(bInner.multiplicity).toBe('optional');
		expect(bInner.fieldName).toBe('x');
		expect(bInner.nonterminal).toBe(true);
	});
});
