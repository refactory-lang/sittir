/**
 * auto-groups.test.ts — unit tests for wire's auto-group-synthesis pass.
 *
 * The pass lives in `dsl/wire/auto-groups.ts` and runs at wire() time
 * AFTER authored `groups:` synthesis. These tests exercise
 * `applyAutoGroups` directly with a minimal WireContext, matching the
 * shape the pass receives in production (an enriched-base grammar object
 * + the wire context whose `syntheticInline` set drains into the
 * grammar's inline list).
 *
 * SCOPE: synthesis only. The pass does NOT touch `separator` / `trailing`
 * / `leading` metadata — decomposition is a separate concern that belongs
 * in link/evaluate. Tests that previously asserted on separator-lift
 * behavior have been dropped along with that code path.
 */

import { describe, expect, it } from 'vitest';
import { applyAutoGroups } from '../wire/auto-groups.ts';
import { wire } from '../wire/wire.ts';
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

function applyToWrapped(
	grammar: { grammar: { rules: Record<string, unknown> } },
	authoredSynthesisKinds: ReadonlySet<string> = new Set()
): {
	ctx: WireContext;
	rules: Record<string, unknown>;
} {
	const ctx = makeContext();
	applyAutoGroups(
		grammar as unknown as Parameters<typeof applyAutoGroups>[0],
		ctx,
		authoredSynthesisKinds
	);
	return { ctx, rules: grammar.grammar.rules };
}

describe('applyAutoGroups — optional(seq(...))', () => {
	it('leaf content: no synthesis (strict-seq trigger only)', () => {
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

	it('multi-slot seq: synthesizes a group', () => {
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

	it('pure-literal seq: synthesizes (strict-seq trigger does not filter by slot-bearing members)', () => {
		// The strict-seq trigger fires unconditionally on seq content. The
		// prior `hasSlotBearingMember` filter has been removed — that was an
		// artifact of the conflated decompose+synthesis module. Whether the
		// seq contains slots is irrelevant to the synthesis decision.
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
		expect(synthKinds).toEqual(['_root_optional1']);
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

describe('applyAutoGroups — repeat(seq(...)) / repeat1(seq(...))', () => {
	it('leaf content: no synthesis (strict-seq trigger only)', () => {
		const { rules } = applyToWrapped({
			grammar: {
				rules: {
					root: { type: 'repeat', content: { type: 'symbol', name: 'X' } }
				}
			}
		});
		expect(Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k))).toEqual([]);
	});

	it('seq content (single slot + delimiter): synthesizes a group containing the seq', () => {
		// Synthesis-only behavior: the seq content moves into a hidden
		// helper rule and the parent's content becomes a SYMBOL ref. The
		// pass does NOT lift the literal delimiter into a separator
		// attribute — that is decomposition's job, in link/evaluate.
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
		const synthKinds = Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_repeat1']);
		const root = rules.root as {
			content: { type: string; name: string };
			separator?: unknown;
		};
		expect(root.content.type).toBe('symbol');
		expect(root.content.name).toBe('_root_repeat1');
		// Synthesis must not touch separator metadata.
		expect(root.separator).toBeUndefined();
		const synth = rules._root_repeat1 as { type: string; members?: unknown[] };
		expect(synth.type).toBe('seq');
		expect(synth.members!.length).toBe(2);
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

	it('repeat1 seq content: same synthesis behavior as repeat', () => {
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
		const synthKinds = Object.keys(rules).filter((k) => /^_root_repeat\d+$/.test(k));
		expect(synthKinds).toEqual(['_root_repeat1']);
		const root = rules.root as { content: { type: string; name: string } };
		expect(root.content.type).toBe('symbol');
		expect(root.content.name).toBe('_root_repeat1');
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
});

describe('applyAutoGroups — regressions and invariants', () => {
	it('repeat1(field(modifier, choice(...))): no synthesis (function_modifiers shape)', () => {
		// This is rust's `function_modifiers` rule. The repeat1's content is
		// a FIELD, not a SEQ — the strict-seq trigger does not fire, so the
		// shape is left alone. Without this, the synthesis pass would rewrite
		// the modifier field's content to a SYMBOL ref pointing at a hidden
		// helper that no one ever generated, breaking rust's function-
		// attribute parsing.
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
		const synthKinds = Object.keys(rules).filter((k) =>
			/^_function_modifiers_(optional|repeat)\d+$/.test(k)
		);
		expect(synthKinds).toEqual([]);
		expect(ctx.syntheticInline.size).toBe(0);
		// And the rule body must be structurally unchanged — modifier field
		// still wraps the inline choice exactly as the author wrote it.
		const r = rules.function_modifiers as {
			type: string;
			content: { type: string; name: string; content: { type: string } };
		};
		expect(r.type).toBe('repeat1');
		expect(r.content.type).toBe('field');
		expect(r.content.name).toBe('modifier');
		expect(r.content.content.type).toBe('choice');
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
		// author, auto-groups leaves it alone — it neither overwrites the
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
		applyAutoGroups(grammar as unknown as Parameters<typeof applyAutoGroups>[0], ctx);
		const preserved = grammar.grammar.rules._root_optional1 as {
			type: string;
			value?: string;
		};
		expect(preserved.type).toBe('string');
		expect(preserved.value).toBe('PRESERVED');
		expect(ctx.syntheticInline.has('_root_optional1')).toBe(false);
	});

	it('skips parents in authoredSynthesisKinds (transforms/polymorphs/path-mode groups)', () => {
		// Authored synthesis wins. When the author has opted a kind into the
		// structured authoring pipeline, auto-groups must leave it alone so
		// the `'1/0/2'`-style path patches that pipeline drives still address
		// the rule body the author wrote.
		const { rules, ctx } = applyToWrapped(
			{
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
			},
			new Set(['root'])
		);
		expect(Object.keys(rules).filter((k) => /^_root_optional\d+$/.test(k))).toEqual([]);
		expect(ctx.syntheticInline.size).toBe(0);
		// And the rule body is structurally unchanged.
		const r = rules.root as { type: string; content: { type: string } };
		expect(r.type).toBe('optional');
		expect(r.content.type).toBe('seq');
	});
});

// PR2: re-enable when applyAutoGroups is wired into wire() (currently disabled
// via `void (() => { applyAutoGroups(...) })()` in wire.ts). Until then this
// integration test cannot pass.
describe.skip('applyAutoGroups — wire() integration', () => {
	it('runs AFTER authored groups: with both authored and auto-synthesized rules surviving', () => {
		// Grammar with TWO parent kinds:
		//   - `xKind` — author registered a path-mode `groups:` lift, so
		//     auto-groups should leave it alone (no synthetic inline entry
		//     for `_xKind_optional1`).
		//   - `yKind` — pure optional(seq(...)), not opted in. Auto-groups
		//     should synthesize `_yKind_optional1` and rewrite the parent
		//     content to a SYMBOL ref.
		// Both behaviors must coexist.
		//
		// The `base` arg to wire() carries already-evaluated rule objects
		// (this is what enrich(...) produces in production). wire() reads
		// those objects directly when invoking auto-groups, so we don't
		// need rule fns here — only the structured rule bodies.
		const xKindBody = {
			type: 'optional',
			content: {
				type: 'seq',
				members: [
					{ type: 'string', value: '->' },
					{ type: 'field', name: 'x', content: { type: 'symbol', name: 'A' } }
				]
			}
		};
		const yKindBody = {
			type: 'optional',
			content: {
				type: 'seq',
				members: [
					{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
					{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } }
				]
			}
		};

		const base = {
			grammar: {
				rules: {
					xKind: xKindBody,
					yKind: yKindBody,
					A: { type: 'string', value: 'a' },
					X: { type: 'string', value: 'x' },
					Y: { type: 'string', value: 'y' }
				}
			}
		};

		const noopFn = (() => ({ type: 'string', value: '' })) as (
			this: unknown,
			$: unknown
		) => unknown;

		// Path-mode `groups:` entry for xKind. Object-valued (not a function),
		// so it counts toward authoredSynthesisKinds and auto-groups skips
		// xKind. The presence of the other rule fns is required by wire's
		// own config shape; their bodies are immaterial to this assertion.
		const wired = wire(
			{
				name: 'test',
				rules: {
					xKind: noopFn,
					yKind: noopFn,
					A: noopFn,
					X: noopFn,
					Y: noopFn
				},
				groups: {
					xKind: { '0/1': 'authoredX' }
				} as Record<string, unknown>
			} as Parameters<typeof wire>[0],
			base as unknown as Parameters<typeof wire>[1]
		);

		// Inspect the wire context attached to the wired result.
		const ctx = (wired as unknown as { __wireContext__: WireContext }).__wireContext__;
		expect(ctx).toBeDefined();

		// Auto-groups should have skipped xKind (authored).
		expect(ctx.syntheticInline.has('_xKind_optional1')).toBe(false);

		// Auto-groups should have synthesized yKind's optional(seq(...)) into
		// a hidden helper and registered it for inlining.
		expect(ctx.syntheticInline.has('_yKind_optional1')).toBe(true);

		// And the base grammar's yKind body should now reference the
		// synthesized helper via a SYMBOL ref, while xKind is untouched.
		const rulesBag = base.grammar.rules as unknown as Record<string, unknown>;
		const yKindRule = rulesBag.yKind as { type: string; content: { type: string; name?: string } };
		expect(yKindRule.type).toBe('optional');
		expect(yKindRule.content.type).toBe('symbol');
		expect(yKindRule.content.name).toBe('_yKind_optional1');

		const xKindRule = rulesBag.xKind as { type: string; content: { type: string } };
		expect(xKindRule.type).toBe('optional');
		// xKind's content remains a seq — auto-groups skipped it.
		expect(xKindRule.content.type).toBe('seq');
	});
});
