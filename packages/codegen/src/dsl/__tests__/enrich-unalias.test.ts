/**
 * enrich-unalias.test.ts — unit tests for the enrich base-grammar
 * un-aliasing pass (`applyUnaliasDistinct`, `dsl/enrich.ts`).
 *
 * The pass walks each rule's ALIAS nodes, groups them by target name, and
 * either drops or retargets any alias whose source rule is structurally
 * distinct from its siblings sharing that target — resolving the
 * `parsekind-noninjective` collision at the source instead of merging
 * distinct storage kinds onto one parse kind. Visible storage kinds are
 * dropped (they already surface under their own name once un-aliased);
 * hidden storage kinds (leading `_`) are retargeted to a non-colliding
 * alias name instead, since un-aliasing alone would not give them an
 * independent CST node.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich, drainUnaliasDiagnostics, resetUnaliasDiagnostics, clusterSignatures } from '../enrich.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

describe('enrich — base-grammar un-aliasing', () => {
	it('drops an alias when the colliding storage kinds are structurally distinct', () => {
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		// Mirrors the real rust collision: scoped_type_identifier.path
		// collapses [generic_type_with_turbofish, generic_type] onto parse
		// kind 'generic_type' — generic_type_with_turbofish has an extra
		// string member, making it structurally distinct from generic_type.
		const base = {
			grammar: {
				name: 'test',
				rules: {
					generic_type: g.seq(g.sym('type_identifier')),
					generic_type_with_turbofish: g.seq(g.sym('type_identifier'), '::<>'),
					scoped_type_identifier: g.choice(
						g.sym('generic_type'),
						g.alias(g.sym('generic_type_with_turbofish'), g.sym('generic_type'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		// The ALIAS wrapper is gone — the member now references the bare
		// symbol under its own name, not coerced into 'generic_type'.
		const scoped = result.grammar.rules.scoped_type_identifier as unknown as {
			members: Array<{ type: string; name?: string }>;
		};
		expect(scoped.members.some((m) => m.type === 'ALIAS')).toBe(false);
		expect(scoped.members.some((m) => m.name === 'generic_type_with_turbofish')).toBe(true);

		// A diagnostic was still emitted, at a downgraded (non-blocking) severity.
		const diagnostics = drainUnaliasDiagnostics();
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]!.code).toBe('parsekind-noninjective');
		expect(diagnostics[0]!.severity).not.toBe('error');
		expect(diagnostics[0]!.canProceed).toBe(true);
	});

	it('leaves a structurally-identical alias untouched, with no diagnostic', () => {
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				name: 'test',
				rules: {
					foo_a: 'x',
					foo_b: 'x',
					some_parent: g.choice(
						g.alias(g.sym('foo_a'), g.sym('shared_name')),
						g.alias(g.sym('foo_b'), g.sym('shared_name'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		const parent = result.grammar.rules.some_parent as unknown as { members: Array<{ type: string }> };
		expect(parent.members.every((m) => m.type === 'ALIAS')).toBe(true);
		expect(drainUnaliasDiagnostics()).toHaveLength(0);
	});

	it('leaves a bare optional(alias(...)) untouched when there is no collision', () => {
		// Regression guard for the OPTIONAL-descent case added to
		// collectAliasSites/rewriteAt: a single alias under a bare OPTIONAL
		// (sittir's own evaluate runtime shape, not yet lowered to
		// CHOICE[x,BLANK]) must not crash or be mistakenly dropped when
		// there is no colliding sibling.
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			optional: (content: unknown) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				name: 'test',
				rules: {
					lone_source: 'x',
					parent: g.seq(g.sym('identifier'), g.optional(g.alias(g.sym('lone_source'), g.sym('lone_target'))))
				}
			}
		};

		const result = enrich(base) as typeof base;

		const parent = result.grammar.rules.parent as unknown as {
			members: Array<{ type: string; content?: { type: string } }>;
		};
		const optionalMember = parent.members.find((m) => m.type === 'OPTIONAL')!;
		expect(optionalMember.content?.type).toBe('ALIAS');
		expect(drainUnaliasDiagnostics()).toHaveLength(0);
	});

	it('retargets (not drops) an alias whose storage kind is a HIDDEN rule', () => {
		// Mirrors the real typescript collision: primary_expression collapses
		// [_reserved_identifier, identifier] onto parse kind 'identifier'.
		// _reserved_identifier is hidden (leading '_') — its own rule body
		// produces no independent CST node if merely un-aliased (tree-sitter
		// inlines it wherever referenced), so dropping the alias (as a visible
		// storage kind would get) is wrong here. It must be RETARGETED to a
		// non-colliding name instead: alias($._reserved_identifier,
		// $.identifier) -> alias($._reserved_identifier, $.reserved_identifier).
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				name: 'test',
				rules: {
					_reserved_identifier: g.choice('declare', 'type'),
					identifier: g.seq(g.sym('word')),
					word: 'x',
					primary_expression: g.choice(
						g.sym('identifier'),
						g.alias(g.sym('_reserved_identifier'), g.sym('identifier'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		const primary = result.grammar.rules.primary_expression as unknown as {
			members: Array<{ type: string; value?: string; content?: { type: string; name?: string } }>;
		};
		const aliasMember = primary.members.find((m) => m.type === 'ALIAS')!;
		expect(aliasMember).toBeDefined();
		// Retargeted, not dropped: still an ALIAS, still wrapping the hidden
		// storage symbol, but under the stripped (non-colliding) name.
		expect(aliasMember.value).toBe('reserved_identifier');
		expect(aliasMember.content?.type).toBe('SYMBOL');
		expect(aliasMember.content?.name).toBe('_reserved_identifier');
		// The retargeted alias must stay NAMED — the whole point of retargeting
		// instead of dropping is to preserve the hidden rule's independent,
		// named CST visibility (a dropped/un-aliased hidden rule would produce
		// no node of its own at all, let alone a named one).
		expect((aliasMember as unknown as { named: boolean }).named).toBe(true);

		const diagnostics = drainUnaliasDiagnostics();
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]!.severity).not.toBe('error');
	});

	it('name-collision guard: declines to retarget when the stripped name already exists, leaving the alias untouched at original severity', () => {
		// Same shape as the retarget case above, but 'reserved_identifier'
		// (the stripped name) is already a real rule in the grammar — auto-
		// retargeting would collide with it, so this pass must decline: leave
		// the alias site exactly as-is and NOT downgrade the diagnostic (the
		// later assemble-time parsekind-noninjective check still fires at its
		// original 'error' severity, same as if this pass didn't exist for
		// this case).
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				name: 'test',
				rules: {
					_reserved_identifier: g.choice('declare', 'type'),
					identifier: g.seq(g.sym('word')),
					reserved_identifier: g.seq('already_taken'),
					word: 'x',
					primary_expression: g.choice(
						g.sym('identifier'),
						g.alias(g.sym('_reserved_identifier'), g.sym('identifier'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		const primary = result.grammar.rules.primary_expression as unknown as {
			members: Array<{ type: string; value?: string; content?: { type: string; name?: string } }>;
		};
		const aliasMember = primary.members.find((m) => m.type === 'ALIAS')!;
		expect(aliasMember).toBeDefined();
		// Untouched: still aliased to the ORIGINAL (colliding) target name.
		expect(aliasMember.value).toBe('identifier');
		expect(aliasMember.content?.name).toBe('_reserved_identifier');

		// No diagnostic recorded by this pass — it declined to act, so nothing
		// is downgraded (the assemble-time check keeps its own error severity).
		expect(drainUnaliasDiagnostics()).toHaveLength(0);
	});

	it('retargets multiple HIDDEN storage kinds independently when they collide on the same visible target', () => {
		// Mirrors the real python collision (no longer excluded — the
		// GRANULARITY_MISMATCH_EXCLUSIONS/'_suite' carve-out was removed
		// 2026-07-14, see docs/KNOWN_ISSUES.md): _suite collapses
		// [_simple_statements, block, _newline] onto parse kind 'block'.
		// Both _simple_statements and _newline are hidden — each gets its OWN
		// independent retarget (not a drop, and not a single shared target),
		// same as typescript's _reserved_identifier case.
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				name: 'test',
				rules: {
					_suite: g.choice(
						g.alias(g.sym('_simple_statements'), g.sym('block')),
						g.sym('block'),
						g.alias(g.sym('_newline'), g.sym('block'))
					),
					// Well-formed STRING leaves (not bare JS strings) — a bare string
					// as a raw SEQ member is not a real production shape (evaluate/
					// tree-sitter always wrap literals as `{type:'STRING',value}`)
					// and would crash rulesEqual's recursive descent, which expects
					// every member to be an already-typed Rule node.
					_simple_statements: g.seq({ type: 'STRING', value: 'a' }),
					block: g.seq({ type: 'STRING', value: 'b' }),
					_newline: g.seq({ type: 'STRING', value: 'c' })
				}
			}
		};

		const result = enrich(base) as typeof base;

		const suite = result.grammar.rules._suite as unknown as {
			members: Array<{ type: string; value?: string; content?: { name?: string } }>;
		};
		const aliasMembers = suite.members.filter((m) => m.type === 'ALIAS');
		expect(aliasMembers).toHaveLength(2);
		expect(aliasMembers.find((m) => m.content?.name === '_simple_statements')?.value).toBe('simple_statements');
		expect(aliasMembers.find((m) => m.content?.name === '_newline')?.value).toBe('newline');

		const diagnostics = drainUnaliasDiagnostics();
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]!.severity).not.toBe('error');
	});

	it('mixed-bucket guard: leaves a structurally-identical alias-bearing candidate untouched, acting only on the genuinely-distinct one', () => {
		// A 3-entry bucket sharing target 'generic_type': a bare (non-alias)
		// entry, an alias whose storage body is structurally IDENTICAL to the
		// bare entry's body (majority signature — 2 of 3), and an alias whose
		// storage body is genuinely distinct (minority signature — 1 of 3).
		// Only the genuinely-distinct alias should be dropped; the
		// identical-to-majority alias must be left untouched even though the
		// bucket as a whole still fires the collision diagnostic.
		resetUnaliasDiagnostics();
		const g = globalThis as unknown as {
			seq: (...m: unknown[]) => unknown;
			choice: (...m: unknown[]) => unknown;
			alias: (rule: unknown, value: unknown) => unknown;
			sym: (name: string) => unknown;
		};
		const base = {
			grammar: {
				name: 'test',
				rules: {
					generic_type: g.seq(g.sym('type_identifier')),
					generic_type_with_turbofish: g.seq(g.sym('type_identifier'), '::<>'),
					generic_type_alias_dup: g.seq(g.sym('type_identifier')),
					scoped_type_identifier: g.choice(
						g.sym('generic_type'),
						g.alias(g.sym('generic_type_with_turbofish'), g.sym('generic_type')),
						g.alias(g.sym('generic_type_alias_dup'), g.sym('generic_type'))
					)
				}
			}
		};

		const result = enrich(base) as typeof base;

		const scoped = result.grammar.rules.scoped_type_identifier as unknown as {
			members: Array<{ type: string; name?: string; content?: { name?: string } }>;
		};
		// The genuinely-distinct alias was dropped: bare reference now, no
		// ALIAS wrapper.
		expect(scoped.members.some((m) => m.type === 'ALIAS' && m.content?.name === 'generic_type_with_turbofish')).toBe(
			false
		);
		expect(scoped.members.some((m) => m.name === 'generic_type_with_turbofish')).toBe(true);
		// The structurally-identical-to-majority alias is untouched: still an
		// ALIAS wrapping its original storage kind.
		expect(scoped.members.some((m) => m.type === 'ALIAS' && m.content?.name === 'generic_type_alias_dup')).toBe(
			true
		);

		const diagnostics = drainUnaliasDiagnostics();
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]!.severity).not.toBe('error');
	});
});

describe('clusterSignatures', () => {
	// rulesEqual itself is pre-existing and already used/tested elsewhere
	// (dsl/list-patterns.ts) — this only tests the new clustering wrapper
	// applyUnaliasDistinct actually relies on: 3+ values, some equal to
	// each other and some not, must land in the correct number of distinct
	// clusters using rulesEqual's own equality, not any other proxy.
	it('groups structurally-equal values into the same cluster id, distinct ones apart', () => {
		const a = { type: 'STRING', value: 'x' } as unknown as RuntimeRule;
		const b = { type: 'STRING', value: 'x' } as unknown as RuntimeRule;
		const c = { type: 'STRING', value: 'y' } as unknown as RuntimeRule;
		const signatures = clusterSignatures([a, b, c]);
		expect(signatures[0]).toBe(signatures[1]); // a, b structurally equal
		expect(signatures[0]).not.toBe(signatures[2]); // c distinct
	});
});
