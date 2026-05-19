/**
 * auto-decompose.test.ts — unit tests for wire's auto-decomposition pass.
 *
 * The pass lives in `dsl/wire/auto-decompose.ts` and runs at wire() time
 * AFTER authored `groups:` synthesis. These tests exercise
 * `applyAutoDecompose` directly with a minimal WireContext, matching the
 * shape the pass receives in production (an enriched-base grammar object
 * + the wire context whose `syntheticInline` set drains into the
 * grammar's inline list).
 *
 * The fixtures here previously lived in
 * `dsl/__tests__/decompose-{optional,repeat}.test.ts` and were exercised
 * via `enrich()`. They moved with the pass; the assertions are unchanged
 * apart from being routed through the new entry point.
 */

import { describe, expect, it } from 'vitest';
import { applyAutoDecompose } from '../wire/auto-decompose.ts';
import type { WireContext } from '../wire/wire.ts';

function makeContext(): WireContext {
	return {
		deposits: new Map(),
		syntheticInline: new Set<string>(),
		polymorphVariants: [],
		conflictGroups: [],
		refineForms: new Map(),
		groups: undefined,
		polymorphsConfig: undefined,
		renderAs: undefined,
		currentRuleKind: null,
		authoredRuleNames: new Set<string>()
	};
}

function applyToWrapped(grammar: { grammar: { rules: Record<string, unknown> } }): {
	ctx: WireContext;
	rules: Record<string, unknown>;
} {
	const ctx = makeContext();
	applyAutoDecompose(grammar as unknown as Parameters<typeof applyAutoDecompose>[0], ctx);
	return { ctx, rules: grammar.grammar.rules };
}

describe('decomposeOptional (wire-side auto-decomposition)', () => {
	it('leaf content: no synthesis (the multiplicity is stamped by enrich elsewhere)', () => {
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					root: { type: 'optional', content: { type: 'symbol', name: 'X' } }
				}
			}
		});
		expect(Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k))).toEqual([]);
	});

	it('single-slot seq with flanks: synthesizes a group containing the seq', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_optional1']);
		const synth = rules[synthKinds[0]!] as { type: string; members?: unknown[] };
		expect(synth.type).toBe('seq');
		expect(synth.members!.length).toBe(2);
		const parentContent = (rules.root as { content: { type: string; name: string } }).content;
		expect(parentContent.type).toBe('symbol');
		expect(parentContent.name).toBe(synthKinds[0]);
	});

	it('multi-slot seq: synthesizes a group (closes clause_multifield_gap)', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_optional1']);
	});

	it('pure-literal seq: no synthesis (no slots)', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('choice content: no synthesis (strict-seq trigger leaves authored choices alone)', () => {
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					root: {
						type: 'optional',
						content: {
							type: 'choice',
							members: [
								{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
								{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } }
							]
						}
					}
				}
			}
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('synthesized group name is deterministic across runs (stable per parent)', () => {
		const grammar = () => ({
			grammar: {
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
		});
		const { rules: r1 } = applyToWrapped(grammar());
		const { rules: r2 } = applyToWrapped(grammar());
		const s1 = Object.keys(r1).find((k) => /^_root_optional\d+$/.test(k))!;
		const s2 = Object.keys(r2).find((k) => /^_root_optional\d+$/.test(k))!;
		expect(s1).toBe('_root_optional1');
		expect(s1).toBe(s2);
	});

	it("cross-parent dedupe: identical content reuses the first parent's synthesized rule", () => {
		const sharedContent = () => ({
			type: 'seq',
			members: [
				{ type: 'field', name: 'x', content: { type: 'symbol', name: 'X' } },
				{ type: 'field', name: 'y', content: { type: 'symbol', name: 'Y' } }
			]
		});
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					a: { type: 'optional', content: sharedContent() },
					b: { type: 'optional', content: sharedContent() }
				}
			}
		});
		const synthKinds = Object.keys(rules).filter((k) => /_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_a_optional1']);
		const aContent = (rules.a as { content: { type: string; name: string } }).content;
		const bContent = (rules.b as { content: { type: string; name: string } }).content;
		expect(aContent.type).toBe('symbol');
		expect(aContent.name).toBe('_a_optional1');
		expect(bContent.type).toBe('symbol');
		expect(bContent.name).toBe('_a_optional1');
	});

	it('per-parent counter increments for distinct content within the same parent', () => {
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					root: {
						type: 'seq',
						members: [
							{
								type: 'optional',
								content: {
									type: 'seq',
									members: [{ type: 'field', name: 'a', content: { type: 'symbol', name: 'A' } }]
								}
							},
							{
								type: 'optional',
								content: {
									type: 'seq',
									members: [{ type: 'field', name: 'b', content: { type: 'symbol', name: 'B' } }]
								}
							}
						]
					}
				}
			}
		});
		const synthKinds = Object.keys(rules)
			.filter((k) => /^_root_optional\d+$/.test(k))
			.sort();
		expect(synthKinds).toEqual(['_root_optional1', '_root_optional2']);
	});
});

describe('decomposeRepeat (wire-side auto-decomposition)', () => {
	it('leaf content: no synthesis (multiplicity is stamped by enrich elsewhere)', () => {
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					root: { type: 'repeat', content: { type: 'symbol', name: 'X' } }
				}
			}
		});
		expect(Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k))).toEqual([]);
	});

	it('single-slot seq with separator literals: stamps separator marker, preserves content', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		expect(Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k))).toEqual([]);
		const root = rules.root as {
			content: { type: string; members?: unknown[] };
			separator?: unknown[];
		};
		// Content shape is preserved so tree-sitter sees the original seq.
		// Mutating `content` reaches tree-sitter and changes the recognized
		// language for every comma-list rule, which destabilized LR(1)
		// tables across the grammar (rust regressed with `_pattern /
		// range_pattern` conflicts). Only the metadata marker is added.
		expect(root.content.type).toBe('seq');
		expect(root.content.members!.length).toBe(2);
		expect(root.separator).toBeDefined();
		expect(Array.isArray(root.separator)).toBe(true);
		expect(root.separator!.length).toBe(1);
		expect((root.separator![0] as { type: string; value: string }).type).toBe('string');
		expect((root.separator![0] as { type: string; value: string }).value).toBe(',');
	});

	it('multi-slot seq: synthesizes a hidden group', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k));
		expect(synthKinds.length).toBe(1);
		const root = rules.root as { content: { type: string; name: string } };
		expect(root.content.type).toBe('symbol');
		expect(root.content.name).toBe(synthKinds[0]);
	});

	it('repeat1 single-slot seq: same separator-lift behavior', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		expect(Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k))).toEqual([]);
		const root = rules.root as {
			content: { type: string; members?: unknown[] };
			separator?: unknown;
		};
		// Same content-preserving behavior as the repeat case above.
		expect(root.content.type).toBe('seq');
		expect(root.content.members!.length).toBe(2);
		expect(root.separator).toBeDefined();
	});

	it('repeat1 multi-slot seq: synthesizes group same as repeat', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k));
		expect(synthKinds.length).toBe(1);
	});

	it('pure-literal seq: no synthesis', () => {
		const { rules } = applyToWrapped({
			grammar: {
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
		});
		expect(Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k))).toEqual([]);
	});

	it('synthesized group name is deterministic across runs (stable per parent)', () => {
		const grammar = () => ({
			grammar: {
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
		});
		const { rules: r1 } = applyToWrapped(grammar());
		const { rules: r2 } = applyToWrapped(grammar());
		const s1 = Object.keys(r1).find((k) => /^_root_repeat\d+$/.test(k))!;
		const s2 = Object.keys(r2).find((k) => /^_root_repeat\d+$/.test(k))!;
		expect(s1).toBe('_root_repeat1');
		expect(s1).toBe(s2);
	});

	it("cross-parent dedupe: identical content reuses the first parent's synthesized rule", () => {
		const sharedContent = () => ({
			type: 'seq',
			members: [
				{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
				{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } }
			]
		});
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					a: { type: 'repeat', content: sharedContent() },
					b: { type: 'repeat', content: sharedContent() }
				}
			}
		});
		const synthKinds = Object.keys(rules).filter((k) => /_repeat\d+$/.test(k));
		expect(synthKinds).toEqual(['_a_repeat1']);
		const aContent = (rules.a as { content: { type: string; name: string } }).content;
		const bContent = (rules.b as { content: { type: string; name: string } }).content;
		expect(aContent.type).toBe('symbol');
		expect(aContent.name).toBe('_a_repeat1');
		expect(bContent.type).toBe('symbol');
		expect(bContent.name).toBe('_a_repeat1');
	});

	it('per-parent counter increments for distinct content within the same parent', () => {
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					root: {
						type: 'seq',
						members: [
							{
								type: 'repeat',
								content: {
									type: 'seq',
									members: [
										{ type: 'field', name: 'a', content: { type: 'symbol', name: 'A' } },
										{ type: 'field', name: 'b', content: { type: 'symbol', name: 'B' } }
									]
								}
							},
							{
								type: 'repeat',
								content: {
									type: 'seq',
									members: [
										{ type: 'field', name: 'c', content: { type: 'symbol', name: 'C' } },
										{ type: 'field', name: 'd', content: { type: 'symbol', name: 'D' } }
									]
								}
							}
						]
					}
				}
			}
		});
		const synthKinds = Object.keys(rules)
			.filter((k) => /^_root_repeat\d+$/.test(k))
			.sort();
		expect(synthKinds).toEqual(['_root_repeat1', '_root_repeat2']);
	});

	// Regression cases
	// ---------------------------------------------------------------------

	it('repeat1(field(modifier, choice(...))): no synthesis (function_modifiers shape)', () => {
		// This is rust's `function_modifiers` rule. The repeat1's content is
		// a FIELD, not a SEQ — the strict-seq trigger does not fire, so the
		// shape is left alone. Prior to the trigger tightening, the choice
		// inside the field was being lifted via the slot-bearing-choice path
		// and rewrote the modifier field's content to a SYMBOL ref pointing
		// at a hidden helper that no one ever generated, breaking rust's
		// function-attribute parsing.
		const { rules, ctx } = applyToWrapped({
			grammar: {
				rules: {
					function_modifiers: {
						type: 'repeat1',
						content: {
							type: 'field',
							name: 'modifier',
							content: {
								type: 'choice',
								members: [
									{ type: 'string', value: 'async' },
									{ type: 'string', value: 'default' },
									{ type: 'string', value: 'const' },
									{ type: 'string', value: 'unsafe' },
									{ type: 'symbol', name: 'extern_modifier' }
								]
							}
						}
					}
				}
			}
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_function_modifiers_(optional|repeat)\d+$/.test(k));
		expect(synthKinds).toEqual([]);
		expect(ctx.syntheticInline.size).toBe(0);
		// And the rule body must be structurally unchanged — modifier field
		// still wraps the inline choice exactly as the author wrote it.
		const r = rules.function_modifiers as { type: string; content: { type: string; name: string; content: { type: string } } };
		expect(r.type).toBe('repeat1');
		expect(r.content.type).toBe('field');
		expect(r.content.name).toBe('modifier');
		expect(r.content.content.type).toBe('choice');
	});

	it('repeat(seq(...)) with separator already populated: no synthesis (carve-out)', () => {
		// When the base grammar (or an earlier pass) already lifted the
		// repeat's content into structured {content, separator} metadata,
		// auto-decomp must not re-wrap the seq in a hidden helper —
		// doing so would lose the separator. Same for `trailing` /
		// `leading`.
		const { rules, ctx } = applyToWrapped({
			grammar: {
				rules: {
					root: {
						type: 'repeat',
						content: {
							type: 'seq',
							members: [
								{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
								{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } }
							]
						},
						separator: [{ type: 'string', value: ',' }]
					}
				}
			}
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k));
		expect(synthKinds).toEqual([]);
		expect(ctx.syntheticInline.size).toBe(0);
		// Body untouched
		const r = rules.root as { content: { type: string } };
		expect(r.content.type).toBe('seq');
	});

	it('synthesized helper names are registered in WireContext.syntheticInline', () => {
		const { rules, ctx } = applyToWrapped({
			grammar: {
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
		});
		const synthKinds = Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_optional1']);
		// Drained into the context for the wired inline callback to pick up.
		expect(ctx.syntheticInline.has('_root_optional1')).toBe(true);
	});

	it('respects authored declared rules: does NOT clobber an existing rule with the synthesized name', () => {
		// If a rule named `_root_optional1` is already declared by the
		// author, auto-decomp leaves it alone — it neither overwrites the
		// body nor registers it for synthetic inlining (authored intent
		// wins by construction).
		const ctx = makeContext();
		const grammar = {
			grammar: {
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
					},
					_root_optional1: { type: 'string', value: 'PRESERVED' }
				}
			}
		};
		applyAutoDecompose(grammar as unknown as Parameters<typeof applyAutoDecompose>[0], ctx);
		const preserved = grammar.grammar.rules._root_optional1 as { type: string; value?: string };
		expect(preserved.type).toBe('string');
		expect(preserved.value).toBe('PRESERVED');
		expect(ctx.syntheticInline.has('_root_optional1')).toBe(false);
	});
});
