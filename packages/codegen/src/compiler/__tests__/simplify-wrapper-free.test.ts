/**
 * Tests for PR2 Task 3.B-simplify-wrapper-free.
 *
 * User invariant: SimplifiedRule is wrapper-free — RenderRule → SimplifiedRule,
 * both wrapper-free. simplifyRules was re-introducing wrappers (optional / field /
 * repeat / repeat1) via hoist transformations and choice-empty-match folding.
 *
 * This test asserts that the output of computeSimplifiedRules contains no
 * FieldRule / OptionalRule / RepeatRule / Repeat1Rule nodes anywhere in the tree.
 */

import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { computeSimplifiedRules, SimplifyCtx } from '../simplify.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { applyWrapperDeletion } from '../wrapper-deletion.ts';
import type { AnyRule, Rule } from '../../types/rule.ts';

// ---------------------------------------------------------------------------
// Recursive wrapper scanner
// ---------------------------------------------------------------------------

const WRAPPER_TYPES = new Set(['optional', 'field', 'repeat', 'repeat1']);

function findWrappers(rule: AnyRule, path: string = ''): string[] {
	const out: string[] = [];
	if (WRAPPER_TYPES.has(rule.type)) {
		out.push(`${path}:${rule.type}`);
	}
	// Recurse into all children regardless of whether this node is a wrapper,
	// so we catch wrappers nested inside non-wrapper structural nodes too.
	// PR-P: ENUM case removed — enum-shaped ChoiceRules have type === CHOICE.
	if (rule.type === SEQ || rule.type === CHOICE) {
		for (let i = 0; i < rule.members.length; i++) {
			out.push(...findWrappers(rule.members[i]!, `${path}.members[${i}]`));
		}
	}
	if ('content' in rule && rule.content && typeof rule.content === 'object' && 'type' in rule.content) {
		out.push(...findWrappers(rule.content as AnyRule, `${path}.content`));
	}
	return out;
}

function findWrappersInMap(rules: Record<string, AnyRule>): Array<{ kind: string; path: string; type: string }> {
	const result: Array<{ kind: string; path: string; type: string }> = [];
	for (const [kind, rule] of Object.entries(rules)) {
		const wrappers = findWrappers(rule, kind);
		for (const w of wrappers) {
			const lastColon = w.lastIndexOf(':');
			result.push({ kind, path: w.slice(0, lastColon), type: w.slice(lastColon + 1) });
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Unit-level: wrapper shapes that hoist transformations are known to produce.
//
// These test computeSimplifiedRules (the public API) since that is the function
// that applies deleteWrapper as a final pass to guarantee wrapper-free output.
// simplifyRules is an internal helper that may produce intermediate wrappers;
// the invariant is enforced at the computeSimplifiedRules boundary.
// ---------------------------------------------------------------------------

describe('computeSimplifiedRules wrapper-free output — unit shapes', () => {
	it('choice-with-empty-match does not produce optional in output', () => {
		// choice(pattern(""), symbol('a')) folds to optional(symbol('a'))
		// but that optional must be pushed to leaf attribute (multiplicity: optional)
		const input: Record<string, Rule<'link'>> = {
			r1: {
				type: CHOICE,
				members: [
					{ type: PATTERN, value: '' },
					{ type: SYMBOL, name: 'a' },
				],
			},
		};
		const renderRules = applyWrapperDeletion(input);
		const simplified = computeSimplifiedRules(new SimplifyCtx({ rules: renderRules, diagnostics: new DiagnosticSink() }));
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);
		expect(
			wrappers,
			`Wrappers re-introduced by computeSimplifiedRules: ${JSON.stringify(wrappers)}`
		).toEqual([]);
	});

	it('repeat/optional of a field does not produce field/repeat nodes in output', () => {
		// A seq containing repeat(field('items', symbol('x'))) — after wrapper
		// deletion the repeat and field are gone; simplify should not re-introduce them.
		// After applyWrapperDeletion: { type: 'SYMBOL', name: 'x', fieldName: 'items', multiplicity: 'array' }
		// computeSimplifiedRules must preserve these leaf-level attributes, not re-wrap.
		const input: Record<string, Rule<'link'>> = {
			r1: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{
						type: REPEAT,
						content: {
							type: FIELD,
							name: 'items',
							content: { type: SYMBOL, name: 'item' },
						},
					},
				],
			},
		};
		const renderRules = applyWrapperDeletion(input);
		const simplified = computeSimplifiedRules(new SimplifyCtx({ rules: renderRules, diagnostics: new DiagnosticSink() }));
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);
		expect(
			wrappers,
			`Wrappers re-introduced by computeSimplifiedRules: ${JSON.stringify(wrappers)}`
		).toEqual([]);
	});

	it('extractFieldFromBranchesForChoice does not produce optional or field in output', () => {
		// choice(field('a', X), seq(field('b', Y), field('a', X))) — hoistSharedFieldFromBranchesForChoice
		// extracts field('a') and wraps the residual in optional. After the fix, the
		// optional must be pushed to leaf attrs, not left as a wrapper node.
		const input: Record<string, Rule<'link'>> = {
			r1: {
				type: CHOICE,
				members: [
					{ type: FIELD, name: 'a', content: { type: SYMBOL, name: 'X' } },
					{
						type: SEQ,
						members: [
							{ type: FIELD, name: 'b', content: { type: SYMBOL, name: 'Y' } },
							{ type: FIELD, name: 'a', content: { type: SYMBOL, name: 'X' } },
						],
					},
				],
			},
		};
		const renderRules = applyWrapperDeletion(input);
		const simplified = computeSimplifiedRules(new SimplifyCtx({ rules: renderRules, diagnostics: new DiagnosticSink() }));
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);
		expect(
			wrappers,
			`Wrappers re-introduced by computeSimplifiedRules: ${JSON.stringify(wrappers)}`
		).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// Integration: computeSimplifiedRules must produce wrapper-free output
// ---------------------------------------------------------------------------

describe('computeSimplifiedRules — wrapper-free invariant', () => {
	it('wrapper-free minimal grammar produces no wrappers in output', () => {
		// Construct a minimal set of rule shapes that exercises seq, choice,
		// optional (via empty-match), repeat, field, and the hoist functions.
		const inputRules: Record<string, Rule<'link'>> = {
			// seq with a field-wrapped symbol
			function_decl: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{ type: FIELD, name: 'name', content: { type: SYMBOL, name: 'identifier' } },
					{
						type: OPTIONAL,
						content: {
							type: FIELD,
							name: 'type_params',
							content: { type: SYMBOL, name: 'type_parameters' },
						},
					},
					{ type: FIELD, name: 'body', content: { type: SYMBOL, name: 'block' } },
				],
			},
			// choice with empty-match branch (becomes optional)
			visibility: {
				type: CHOICE,
				members: [
					{ type: PATTERN, value: '' },
					{ type: STRING, value: 'pub' },
					{ type: STRING, value: 'priv' },
				],
			},
			// repeat of a field — wrapper-deletion turns it into a fieldName+multiplicity leaf
			parameter_list: {
				type: REPEAT,
				content: {
					type: FIELD,
					name: 'parameter',
					content: { type: SYMBOL, name: 'parameter' },
				},
			},
			// choice where all branches share a field (exercices extractFieldFromBranchesForChoice)
			binary_expr: {
				type: CHOICE,
				members: [
					{
						type: SEQ,
						members: [
							{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'expr' } },
							{ type: FIELD, name: 'op', content: { type: STRING, value: '+' } },
							{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'expr' } },
						],
					},
					{
						type: SEQ,
						members: [
							{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'expr' } },
							{ type: FIELD, name: 'op', content: { type: STRING, value: '-' } },
							{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'expr' } },
						],
					},
				],
			},
			// leaf rules
			identifier: { type: PATTERN, value: '[a-zA-Z_][a-zA-Z0-9_]*' },
			block: { type: SYMBOL, name: 'block_inner' },
			block_inner: { type: SEQ, members: [{ type: STRING, value: '{' }, { type: STRING, value: '}' }] },
			type_parameters: { type: SYMBOL, name: 'identifier' },
			parameter: { type: SYMBOL, name: 'identifier' },
			expr: { type: SYMBOL, name: 'identifier' },
		};

		const renderRules = applyWrapperDeletion(inputRules);
		const simplified = computeSimplifiedRules(new SimplifyCtx({ rules: renderRules, diagnostics: new DiagnosticSink() }));
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);

		expect(
			wrappers,
			`Wrappers found in computeSimplifiedRules output:\n${wrappers.map(w => `  ${w.kind}${w.path.slice(w.kind.length)}: ${w.type}`).join('\n')}`
		).toEqual([]);
	});
});
