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
		expect(Object.keys(rules).filter((k) => k.startsWith('_opt_grp_'))).toEqual([]);
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
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => k.startsWith('_opt_grp_'));
		expect(synthKinds.length).toBe(1);
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
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => k.startsWith('_opt_grp_'));
		expect(synthKinds.length).toBe(1);
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
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => k.startsWith('_opt_grp_'));
		expect(synthKinds).toEqual([]);
	});

	it('synthesized group name is deterministic across runs (hash-stable)', () => {
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
		const s1 = Object.keys(e1.grammar.rules).find((k) => k.startsWith('_opt_grp_'))!;
		const s2 = Object.keys(e2.grammar.rules).find((k) => k.startsWith('_opt_grp_'))!;
		expect(s1).toBe(s2);
	});
});
