import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('decomposeOptional (universal-shape canonicalization)', () => {
	it('leaf content: no synthesis, multiplicity already on leaf via enrichMultiplicityWrappers', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'optional', content: { type: 'symbol', name: 'X' } }
				}
			}
		};
		const e = enrich(grammar);
		const rules = e.grammar.rules;
		expect(Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k))).toEqual([]);
		const inner = (rules.root as any).content;
		expect(inner.multiplicity).toBe('optional');
	});

	it('single-slot seq with flanks: synthesizes a group containing the seq', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'optional',
						content: {
							type: 'seq',
							members: [
								{ type: 'string', value: '->' },
								{ type: 'field', name: 'x', content: { type: 'symbol', name: 'A' } }
							]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_optional1']);
		const synth = e.grammar.rules[synthKinds[0]!] as { type: string; members?: unknown[] };
		expect(synth.type).toBe('seq');
		expect(synth.members!.length).toBe(2);
		// Parent's optional content is now a symbol ref to the synthesized group
		const parentContent = (e.grammar.rules.root as any).content;
		expect(parentContent.type).toBe('symbol');
		expect(parentContent.name).toBe(synthKinds[0]);
	});

	it('multi-slot seq: synthesizes a group (closes clause_multifield_gap)', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'optional',
						content: {
							type: 'seq',
							members: [
								{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
								{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } }
							]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_optional1']);
	});

	it('pure-literal seq: no synthesis (no slots)', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'optional',
						content: {
							type: 'seq',
							members: [
								{ type: 'string', value: '(' },
								{ type: 'string', value: ')' }
							]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('synthesized group name is deterministic across runs (stable per parent)', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'optional',
						content: {
							type: 'seq',
							members: [{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } }]
						}
					}
				}
			}
		};
		const e1 = enrich(grammar);
		const e2 = enrich(JSON.parse(JSON.stringify(grammar)));
		const s1 = Object.keys(e1.grammar.rules).find((k) => /^_root_optional\d+$/.test(k))!;
		const s2 = Object.keys(e2.grammar.rules).find((k) => /^_root_optional\d+$/.test(k))!;
		expect(s1).toBe('_root_optional1');
		expect(s1).toBe(s2);
	});

	it('cross-parent dedupe: identical content reuses the first parent\'s synthesized rule', () => {
		// Both rules `a` and `b` wrap structurally identical content in an
		// optional. Expectation: `a` (iterated first) synthesizes
		// `_a_optional1`; `b` reuses that name via the cross-parent dedupe
		// map instead of allocating `_b_optional1`.
		const sharedContent = () => ({
			type: 'seq',
			members: [
				{ type: 'field', name: 'x', content: { type: 'symbol', name: 'X' } },
				{ type: 'field', name: 'y', content: { type: 'symbol', name: 'Y' } }
			]
		});
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					a: { type: 'optional', content: sharedContent() },
					b: { type: 'optional', content: sharedContent() }
				}
			}
		};
		const e = enrich(grammar);
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => /_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_a_optional1']);
		const aContent = (e.grammar.rules.a as any).content;
		const bContent = (e.grammar.rules.b as any).content;
		expect(aContent.type).toBe('symbol');
		expect(aContent.name).toBe('_a_optional1');
		expect(bContent.type).toBe('symbol');
		expect(bContent.name).toBe('_a_optional1');
	});

	it('per-parent counter increments for distinct content within the same parent', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'seq',
						members: [
							{
								type: 'optional',
								content: {
									type: 'seq',
									members: [
										{ type: 'field', name: 'a', content: { type: 'symbol', name: 'A' } }
									]
								}
							},
							{
								type: 'optional',
								content: {
									type: 'seq',
									members: [
										{ type: 'field', name: 'b', content: { type: 'symbol', name: 'B' } }
									]
								}
							}
						]
					}
				}
			}
		};
		const e = enrich(grammar);
		const synthKinds = Object.keys(e.grammar.rules)
			.filter((k) => /^_root_optional\d+$/.test(k))
			.sort();
		expect(synthKinds).toEqual(['_root_optional1', '_root_optional2']);
	});
});
