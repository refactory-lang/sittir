import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('decomposeRepeat (universal-shape canonicalization)', () => {
	it('leaf content: no synthesis, multiplicity already on leaf via enrich', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'repeat', content: { type: 'symbol', name: 'X' } }
				}
			}
		};
		const e = enrich(grammar);
		expect(Object.keys(e.grammar.rules).filter((k) => k.startsWith('_rep_grp_'))).toEqual([]);
		const inner = (e.grammar.rules.root as any).content;
		expect(inner.multiplicity).toBe('array');
	});

	it('single-slot seq with separator literals: lifts separator to Rule[]', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'repeat',
						content: {
							type: 'seq',
							members: [
								{ type: 'symbol', name: 'X' },
								{ type: 'string', value: ',' }
							]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		expect(Object.keys(e.grammar.rules).filter((k) => k.startsWith('_rep_grp_'))).toEqual([]);
		const root = e.grammar.rules.root as any;
		// The bare symbol may be field-promoted by enrichFieldWrappers in the
		// same fixed-point pass; what we care about is that the seq has been
		// dissolved (content is no longer a seq) and the separator is lifted.
		expect(root.content.type).not.toBe('seq');
		// Underlying slot — either a bare symbol or a field-wrapped symbol —
		// resolves to symbol 'X'.
		const slot = root.content;
		const inner = slot.type === 'field' ? slot.content : slot;
		expect(inner.type).toBe('symbol');
		expect(inner.name).toBe('X');
		// separator lifted as Rule[]
		expect(root.separator).toBeDefined();
		expect(Array.isArray(root.separator)).toBe(true);
		expect(root.separator.length).toBe(1);
		expect(root.separator[0].type).toBe('string');
		expect(root.separator[0].value).toBe(',');
	});

	it('multi-slot seq: synthesizes a hidden group', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'repeat',
						content: {
							type: 'seq',
							members: [
								{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
								{ type: 'string', value: ',' },
								{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } }
							]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => k.startsWith('_rep_grp_'));
		expect(synthKinds.length).toBe(1);
		const root = e.grammar.rules.root as any;
		expect(root.content.type).toBe('symbol');
		expect(root.content.name).toBe(synthKinds[0]);
	});

	it('repeat1 single-slot seq: same separator-lift behavior', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'repeat1',
						content: {
							type: 'seq',
							members: [
								{ type: 'symbol', name: 'X' },
								{ type: 'string', value: ',' }
							]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		expect(Object.keys(e.grammar.rules).filter((k) => k.startsWith('_rep_grp_'))).toEqual([]);
		const root = e.grammar.rules.root as any;
		// Seq is dissolved; underlying slot resolves to symbol 'X'
		// (may be wrapped by enrichFieldWrappers within the fixed-point loop).
		expect(root.content.type).not.toBe('seq');
		const slot = root.content;
		const inner = slot.type === 'field' ? slot.content : slot;
		expect(inner.type).toBe('symbol');
		expect(inner.name).toBe('X');
		expect(root.separator).toBeDefined();
	});

	it('repeat1 multi-slot seq: synthesizes group same as repeat', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'repeat1',
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
		const synthKinds = Object.keys(e.grammar.rules).filter((k) => k.startsWith('_rep_grp_'));
		expect(synthKinds.length).toBe(1);
	});

	it('pure-literal seq: no synthesis', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'repeat',
						content: {
							type: 'seq',
							members: [{ type: 'string', value: '-' }]
						}
					}
				}
			}
		};
		const e = enrich(grammar);
		expect(Object.keys(e.grammar.rules).filter((k) => k.startsWith('_rep_grp_'))).toEqual([]);
	});

	it('synthesized group name is hash-stable', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: {
						type: 'repeat',
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
		const e1 = enrich(grammar);
		const e2 = enrich(JSON.parse(JSON.stringify(grammar)));
		const s1 = Object.keys(e1.grammar.rules).find((k) => k.startsWith('_rep_grp_'))!;
		const s2 = Object.keys(e2.grammar.rules).find((k) => k.startsWith('_rep_grp_'))!;
		expect(s1).toBe(s2);
	});
});
