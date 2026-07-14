/**
 * enrich-unalias.test.ts — unit tests for the enrich base-grammar
 * un-aliasing pass (`applyUnaliasDistinct`, `dsl/enrich.ts`).
 *
 * The pass walks each rule's ALIAS nodes, groups them by target name, and
 * drops any alias whose source rule is structurally distinct from its
 * siblings sharing that target — resolving the `parsekind-noninjective`
 * collision at the source instead of merging distinct storage kinds onto
 * one parse kind.
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

	it('skips a rule name in GRANULARITY_MISMATCH_EXCLUSIONS even with a synthetic distinct-alias collision', () => {
		// _suite's real python collision ([_simple_statements, block, _newline])
		// disagrees with the assemble-time check's post-simplify comparison
		// (see docs/KNOWN_ISSUES.md) — this rule name is excluded entirely, so
		// even an otherwise-clear-cut structurally-distinct collision must be
		// left untouched, not just the real _suite shape specifically.
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
					_simple_statements: g.seq('a'),
					block: g.seq('b'),
					_newline: g.seq('c')
				}
			}
		};

		const result = enrich(base) as typeof base;

		const suite = result.grammar.rules._suite as unknown as { members: Array<{ type: string }> };
		expect(suite.members.filter((m) => m.type === 'ALIAS')).toHaveLength(2);
		expect(drainUnaliasDiagnostics()).toHaveLength(0);
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
