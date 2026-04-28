import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { wire, getCurrentWireContext } from '../wire/wire.ts';
import { variant } from '../primitives/variant.ts';
import { transform } from '../transform/transform.ts';
import { field } from '../primitives/field.ts';
import { alias } from '../primitives/alias.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

// ---------------------------------------------------------------------------
// Wire helpers — simulate what tree-sitter's grammar() / sittir's
// grammarFn do after wire() augments opts: iterate opts.rules keys in
// insertion order, invoke each fn with a $-proxy, collect the results.
// The iteration order matters — user rules must fire before the
// wire-injected hidden-rule placeholders so deposits are populated
// by the time the placeholders are invoked.
// ---------------------------------------------------------------------------

type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown;

function evaluateWiredRules(
	rules: Record<string, RuleFn>,
	baseRules: Record<string, unknown> = {}
): Record<string, unknown> {
	const $ = new Proxy(
		{},
		{
			get(_, prop: string) {
				return { type: 'symbol', name: prop };
			}
		}
	);
	const out: Record<string, unknown> = {};
	for (const [name, fn] of Object.entries(rules)) {
		const base = baseRules[name];
		out[name] = fn.call($, $, base);
	}
	return out;
}

describe('wire()', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	it('returns opts unchanged when no polymorphs are declared', () => {
		const ruleFn: RuleFn = ($, _prev) => ({ type: 'symbol', name: 'x' });
		const wired = wire({ name: 'test', rules: { foo: ruleFn } });
		expect(wired.name).toBe('test');
		expect(Object.keys(wired.rules)).toEqual(['foo']);
		const result = evaluateWiredRules(wired.rules);
		expect(result.foo).toEqual({ type: 'symbol', name: 'x' });
	});

	it('injects hidden-rule placeholders for each declared polymorph arm', () => {
		const wired = wire({
			name: 'test',
			rules: {
				assignment: ($, original) => original
			},
			polymorphs: {
				assignment: { '0': 'eq', '1': 'type' }
			}
		});
		// Hidden rule names should be keys in opts.rules at wire-return time,
		// which is what tree-sitter will snapshot for its ruleMap.
		expect(Object.keys(wired.rules).sort()).toEqual([
			'_assignment_eq',
			'_assignment_type',
			'assignment'
		]);
	});

	it('deposits captured content when the synthesized parent rule runs', () => {
		// `assignment` original: seq(a, b) — path '0' → 'a', path '1' → 'b'
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' }
			]
		};
		const wired = wire({
			name: 'test',
			rules: {},
			polymorphs: {
				assignment: { '0': 'eq', '1': 'type' }
			}
		});
		// Drive the synthesized `assignment` fn with `original = origSeq`.
		const assignmentFn = wired.rules.assignment!;
		const assignmentResult = assignmentFn.call({}, {}, origSeq);
		// Result is a seq(alias, alias) — each alias points at the hidden rule.
		expect((assignmentResult as { type: string }).type).toBe('seq');
		const members = (assignmentResult as { members: unknown[] }).members;
		expect((members[0] as { type: string; value: string }).type).toBe('alias');
		expect((members[0] as { type: string; value: string }).value).toBe(
			'assignment_eq'
		);
		expect((members[1] as { type: string; value: string }).value).toBe(
			'assignment_type'
		);

		// The hidden-rule fns should now return the captured content.
		const eqFn = wired.rules._assignment_eq!;
		const eqBody = eqFn.call({}, {});
		expect(eqBody).toEqual({ type: 'symbol', name: 'a' });
		const typeFn = wired.rules._assignment_type!;
		const typeBody = typeFn.call({}, {});
		expect(typeBody).toEqual({ type: 'symbol', name: 'b' });
	});

	it('hidden-rule fn returns blank() when no deposit was made (e.g. parent never ran)', () => {
		const wired = wire({
			name: 'test',
			rules: {},
			polymorphs: { assignment: { '0': 'eq' } }
		});
		const eqFn = wired.rules._assignment_eq!;
		const result = eqFn.call({}, {});
		// Fake dsl has no blank(); fn falls back to { type: 'BLANK' }
		expect(result).toEqual({ type: 'BLANK' });
	});

	it('composes user-supplied parent fn with the variant transform', () => {
		// User fn wraps the original in an outer field() before wire's
		// variant transform runs on its output.
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' }
			]
		};
		const wired = wire({
			name: 'test',
			rules: {
				// User "pre-transform": wrap original in a seq(seq(...), symbol('x'))
				// so we can verify the wire variant transform runs on the USER's
				// output, not on the raw original.
				assignment: ($, original) => ({
					type: 'seq',
					members: [original, { type: 'symbol', name: 'extra' }]
				})
			},
			polymorphs: {
				assignment: { '0/0': 'first', '0/1': 'second' }
			}
		});
		const assignmentFn = wired.rules.assignment!;
		const out = assignmentFn.call({}, {}, origSeq);
		// After user's fn, tree is: seq( seq(a, b), extra ). After wire's
		// transform with path '0/0' and '0/1': seq( seq(alias(first), alias(second)), extra ).
		const members = (out as { members: unknown[] }).members;
		expect((members[0] as { type: string }).type).toBe('seq');
		const inner = (members[0] as { members: unknown[] }).members;
		expect((inner[0] as { value: string }).value).toBe('assignment_first');
		expect((inner[1] as { value: string }).value).toBe('assignment_second');
		expect((members[1] as { name: string }).name).toBe('extra');
	});

	it('preserves currentRuleKind during rule-fn execution', () => {
		// variant('eq') needs getCurrentRuleKind() to return the parent rule
		// name while the wrapped rule fn is on the stack.
		let observedKindDuringAssignment: string | null = null;
		let observedKindDuringIdent: string | null = null;
		const wired = wire({
			name: 'test',
			rules: {
				assignment: ($, original) => {
					observedKindDuringAssignment =
						getCurrentWireContext()?.currentRuleKind ?? null;
					return original;
				},
				ident: ($, _prev) => {
					observedKindDuringIdent =
						getCurrentWireContext()?.currentRuleKind ?? null;
					return { type: 'pattern', value: '[a-z]+' };
				}
			}
		});
		evaluateWiredRules(wired.rules, {
			assignment: { type: 'symbol', name: 'ident' }
		});
		expect(observedKindDuringAssignment).toBe('assignment');
		expect(observedKindDuringIdent).toBe('ident');
	});

	it('clears currentWireContext after each rule fn returns', () => {
		const wired = wire({
			name: 'test',
			rules: {
				foo: ($, _prev) => ({ type: 'symbol', name: 'x' })
			}
		});
		expect(getCurrentWireContext()).toBeNull();
		evaluateWiredRules(wired.rules);
		expect(getCurrentWireContext()).toBeNull();
	});

	it('clears context even when a rule fn throws', () => {
		const wired = wire({
			name: 'test',
			rules: {
				boom: () => {
					throw new Error('intentional');
				}
			}
		});
		expect(() => evaluateWiredRules(wired.rules)).toThrow('intentional');
		expect(getCurrentWireContext()).toBeNull();
	});

	it('two wire() invocations have isolated contexts', () => {
		const wiredA = wire({
			name: 'a',
			rules: {
				assignment: ($, original) => original
			},
			polymorphs: { assignment: { '0': 'eq' } }
		});
		const wiredB = wire({
			name: 'b',
			rules: {
				assignment: ($, original) => original
			},
			polymorphs: { assignment: { '0': 'ne' } }
		});
		const ctxA = (wiredA as unknown as { __wireContext__: unknown })
			.__wireContext__;
		const ctxB = (wiredB as unknown as { __wireContext__: unknown })
			.__wireContext__;
		expect(ctxA).not.toBe(ctxB);

		// Run A's assignment — deposits should appear in A's context only.
		const origSeq = { type: 'seq', members: [{ type: 'symbol', name: 'a' }] };
		wiredA.rules.assignment!.call({}, {}, origSeq);
		const depositsA = (ctxA as { deposits: Map<string, unknown> }).deposits;
		const depositsB = (ctxB as { deposits: Map<string, unknown> }).deposits;
		expect(depositsA.has('_assignment_eq')).toBe(true);
		expect(depositsB.has('_assignment_ne')).toBe(false);
	});

	it('polymorph registration is idempotent — calling the parent rule twice does not duplicate', () => {
		// Legacy installGrammarWrapper runs rule callbacks twice (pass-1
		// + pass-2). wire's registrations must absorb that benignly.
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' }
			]
		};
		const wired = wire({
			name: 'test',
			rules: {},
			polymorphs: { assignment: { '0': 'eq', '1': 'type' } }
		});
		const assignmentFn = wired.rules.assignment!;
		assignmentFn.call({}, {}, origSeq);
		assignmentFn.call({}, {}, origSeq);
		const ctx = (
			wired as unknown as { __wireContext__: { polymorphVariants: unknown[] } }
		).__wireContext__;
		expect(ctx.polymorphVariants).toHaveLength(2); // not 4
	});

	it('polymorphVariants metadata accumulates on wire context', () => {
		const wired = wire({
			name: 'test',
			rules: {},
			polymorphs: {
				assignment: { '0': 'eq', '1': 'type' }
			}
		});
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' }
			]
		};
		wired.rules.assignment!.call({}, {}, origSeq);
		const ctx = (
			wired as unknown as { __wireContext__: { polymorphVariants: unknown[] } }
		).__wireContext__;
		expect(ctx.polymorphVariants).toEqual([
			{ parent: 'assignment', child: 'eq' },
			{ parent: 'assignment', child: 'type' }
		]);
	});

	it('wrapped conflicts callback appends variant-registered groups', () => {
		// Force a conflict group via the variant machinery (hoist-sibling
		// path registers conflicts on the parent). Easiest: call the
		// user's conflicts cb and verify the drain appends.
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' }
			]
		};
		const wired = wire({
			name: 'test',
			rules: {},
			polymorphs: { assignment: { '0': 'eq', '1': 'type' } },
			conflicts: ($, _prev) => {
				const p = $ as Record<string, unknown>;
				return [[p.user_conflict_a, p.user_conflict_b]] as unknown[][];
			}
		});
		// Drive assignment to populate deposits AND register hoist-conflicts.
		wired.rules.assignment!.call({}, {}, origSeq);
		// Drive conflicts via the $ proxy.
		const $ = new Proxy(
			{},
			{
				get: (_, prop: string) => ({ type: 'symbol', name: prop })
			}
		);
		const cb = wired.conflicts!;
		const out = cb.call({}, $, []) as Array<Array<{ name: string }>>;
		// First group is the user's; the tail is the symbolized drained groups.
		expect(out.length).toBeGreaterThanOrEqual(1);
		expect(out[0]![0]).toMatchObject({ name: 'user_conflict_a' });
		expect(out[0]![1]).toMatchObject({ name: 'user_conflict_b' });
	});

	// --------------------------------------------------------------------
	// ADR-0008: declarative transforms
	// --------------------------------------------------------------------

	it('transforms: entry synthesizes a rule fn that applies the patch-map', () => {
		// `async_block`-shaped original: seq(a, b, c) — user patches wrap
		// positions 0 and 2 as fields.
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' },
				{ type: 'symbol', name: 'c' }
			]
		};
		const wired = wire({
			name: 'test',
			rules: {},
			transforms: {
				async_block: {
					0: field('x'),
					2: field('z')
				}
			}
		});
		// wire() synthesized `async_block`.
		const fn = wired.rules.async_block!;
		const out = fn.call({}, {}, origSeq) as {
			type: string;
			members: Array<{ type: string; name?: string }>;
		};
		expect(out.type).toBe('seq');
		// Position 0 now wrapped in field('x'); position 2 in field('z').
		expect(out.members[0]).toMatchObject({ type: 'field', name: 'x' });
		expect(out.members[2]).toMatchObject({ type: 'field', name: 'z' });
	});

	it('transforms: entry composes with an existing rules: entry on the same key', () => {
		// User's rule fn wraps original in seq(original, sym(extra)); then
		// wire's transform appends field('x') at path '0/0' — i.e. inside
		// the user's output.
		const origSeq = { type: 'seq', members: [{ type: 'symbol', name: 'a' }] };
		const wired = wire({
			name: 'test',
			rules: {
				r: ($, original) => ({
					type: 'seq',
					members: [original, { type: 'symbol', name: 'extra' }]
				})
			},
			transforms: {
				r: {
					'0/0': field('wrapped')
				}
			}
		});
		const fn = wired.rules.r!;
		const out = fn.call({}, {}, origSeq) as { members: unknown[] };
		// Structure: seq(seq(field('wrapped', a)), symbol(extra))
		const inner = out.members[0] as unknown as {
			members: Array<{ type: string; name?: string }>;
		};
		expect(inner.members[0]).toMatchObject({ type: 'field', name: 'wrapped' });
		expect((out.members[1] as unknown as { name: string }).name).toBe('extra');
	});

	it('transforms: multi-patchset array form applies patches sequentially', () => {
		const origSeq = {
			type: 'seq',
			members: [
				{ type: 'symbol', name: 'a' },
				{ type: 'symbol', name: 'b' }
			]
		};
		const wired = wire({
			name: 'test',
			rules: {},
			transforms: {
				r: [{ 0: field('first') }, { 1: field('second') }]
			}
		});
		const fn = wired.rules.r!;
		const out = fn.call({}, {}, origSeq) as {
			members: Array<{ type: string; name?: string }>;
		};
		expect(out.members[0]).toMatchObject({ type: 'field', name: 'first' });
		expect(out.members[1]).toMatchObject({ type: 'field', name: 'second' });
	});

	it('transforms: pre-registers _kw_<fieldname> for each field() placeholder', () => {
		const wired = wire({
			name: 'test',
			rules: {},
			transforms: {
				r: { 0: field('async'), 1: field('move') }
			}
		});
		// Each field name produced a deferred `_kw_<name>` placeholder in opts.rules.
		expect('_kw_async' in wired.rules).toBe(true);
		expect('_kw_move' in wired.rules).toBe(true);
		// The deferred fns return blank when no deposit happened.
		const asyncFn = wired.rules._kw_async!;
		expect(asyncFn.call({}, {})).toEqual({ type: 'BLANK' });
	});

	it('transforms: pre-registers _<name> for alias() placeholders', () => {
		const wired = wire({
			name: 'test',
			rules: {},
			transforms: {
				r: { 0: alias('wildcard_pattern') }
			}
		});
		expect('_wildcard_pattern' in wired.rules).toBe(true);
	});

	it('transforms: pre-registers _<parent>_<suffix> for variant() placeholders in transforms', () => {
		const wired = wire({
			name: 'test',
			rules: {},
			transforms: {
				r: { 0: variant('a'), 1: variant('b') }
			}
		});
		expect('_r_a' in wired.rules).toBe(true);
		expect('_r_b' in wired.rules).toBe(true);
	});

	it('author-declared _kw_* wins over wire auto-pre-registration', () => {
		// User declares `_kw_async: $ => 'custom'` in rules. wire should
		// leave that entry alone even if a transforms entry's field('async')
		// would otherwise trigger a deferred _kw_async injection.
		const userFn: RuleFn = () => ({ type: 'string', value: 'custom' });
		const wired = wire({
			name: 'test',
			rules: { _kw_async: userFn },
			transforms: {
				r: { 0: field('async') }
			}
		});
		// Author's fn is wrapped but its identity is preserved as the inner
		// callee. Calling it produces 'custom', not a blank.
		const fn = wired.rules._kw_async!;
		expect(fn.call({}, {})).toEqual({ type: 'string', value: 'custom' });
	});
});

// Silence unused-import warnings if transform/variant aren't referenced
// above — they're kept imported to prove wire.ts plays well with them.
void transform;
void variant;
void field;
void alias;
