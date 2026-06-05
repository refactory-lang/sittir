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

import { describe, it, expect } from 'vitest';
import { computeSimplifiedRules, simplifyRules } from '../simplify.ts';
import { applyWrapperDeletion } from '../wrapper-deletion.ts';
import type { Rule } from '../rule.ts';

// ---------------------------------------------------------------------------
// Recursive wrapper scanner
// ---------------------------------------------------------------------------

const WRAPPER_TYPES = new Set(['optional', 'field', 'repeat', 'repeat1']);

function findWrappers(rule: Rule, path: string = ''): string[] {
	const out: string[] = [];
	if (WRAPPER_TYPES.has(rule.type)) {
		out.push(`${path}:${rule.type}`);
	}
	// Recurse into all children regardless of whether this node is a wrapper,
	// so we catch wrappers nested inside non-wrapper structural nodes too.
	if (rule.type === 'seq' || rule.type === 'choice' || rule.type === 'enum') {
		for (let i = 0; i < rule.members.length; i++) {
			out.push(...findWrappers(rule.members[i]!, `${path}.members[${i}]`));
		}
	}
	if ('content' in rule && rule.content && typeof rule.content === 'object' && 'type' in rule.content) {
		out.push(...findWrappers(rule.content as Rule, `${path}.content`));
	}
	if (rule.type === 'polymorph') {
		for (let i = 0; i < rule.forms.length; i++) {
			out.push(...findWrappers(rule.forms[i]!.content, `${path}.forms[${i}].content`));
		}
	}
	return out;
}

function findWrappersInMap(rules: Record<string, Rule>): Array<{ kind: string; path: string; type: string }> {
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
		const input: Record<string, Rule> = {
			r1: {
				type: 'choice',
				members: [
					{ type: 'pattern', value: '' },
					{ type: 'symbol', name: 'a' },
				],
			},
		};
		const renderRules = applyWrapperDeletion(input);
		const simplified = computeSimplifiedRules(renderRules);
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);
		expect(
			wrappers,
			`Wrappers re-introduced by computeSimplifiedRules: ${JSON.stringify(wrappers)}`
		).toEqual([]);
	});

	it('hoistFieldOutOfSingleContentWrapper does not produce field/repeat in output', () => {
		// A seq containing repeat(field('items', symbol('x'))) — after wrapper
		// deletion the repeat and field are gone; simplify should not re-introduce them.
		// After applyWrapperDeletion: { type: 'symbol', name: 'x', fieldName: 'items', multiplicity: 'array' }
		// computeSimplifiedRules must preserve these leaf-level attributes, not re-wrap.
		const input: Record<string, Rule> = {
			r1: {
				type: 'seq',
				members: [
					{ type: 'string', value: 'fn' },
					{
						type: 'repeat',
						content: {
							type: 'field',
							name: 'items',
							content: { type: 'symbol', name: 'item' },
						},
					},
				],
			},
		};
		const renderRules = applyWrapperDeletion(input);
		const simplified = computeSimplifiedRules(renderRules);
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);
		expect(
			wrappers,
			`Wrappers re-introduced by computeSimplifiedRules: ${JSON.stringify(wrappers)}`
		).toEqual([]);
	});

	it('extractFieldAcrossBranches does not produce optional or field in output', () => {
		// choice(field('a', X), seq(field('b', Y), field('a', X))) — hoistSharedFieldAcrossChoiceBranches
		// extracts field('a') and wraps the residual in optional. After the fix, the
		// optional must be pushed to leaf attrs, not left as a wrapper node.
		const input: Record<string, Rule> = {
			r1: {
				type: 'choice',
				members: [
					{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
					{
						type: 'seq',
						members: [
							{ type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } },
							{ type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
						],
					},
				],
			},
		};
		const renderRules = applyWrapperDeletion(input);
		const simplified = computeSimplifiedRules(renderRules);
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
		const inputRules: Record<string, Rule> = {
			// seq with a field-wrapped symbol
			function_decl: {
				type: 'seq',
				members: [
					{ type: 'string', value: 'fn' },
					{ type: 'field', name: 'name', content: { type: 'symbol', name: 'identifier' } },
					{
						type: 'optional',
						content: {
							type: 'field',
							name: 'type_params',
							content: { type: 'symbol', name: 'type_parameters' },
						},
					},
					{ type: 'field', name: 'body', content: { type: 'symbol', name: 'block' } },
				],
			},
			// choice with empty-match branch (becomes optional)
			visibility: {
				type: 'choice',
				members: [
					{ type: 'pattern', value: '' },
					{ type: 'string', value: 'pub' },
					{ type: 'string', value: 'priv' },
				],
			},
			// repeat of a field (exercices hoistFieldOutOfSingleContentWrapper)
			parameter_list: {
				type: 'repeat',
				content: {
					type: 'field',
					name: 'parameter',
					content: { type: 'symbol', name: 'parameter' },
				},
			},
			// choice where all branches share a field (exercices extractFieldAcrossBranches)
			binary_expr: {
				type: 'choice',
				members: [
					{
						type: 'seq',
						members: [
							{ type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
							{ type: 'field', name: 'op', content: { type: 'string', value: '+' } },
							{ type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
						],
					},
					{
						type: 'seq',
						members: [
							{ type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
							{ type: 'field', name: 'op', content: { type: 'string', value: '-' } },
							{ type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
						],
					},
				],
			},
			// leaf rules
			identifier: { type: 'pattern', value: '[a-zA-Z_][a-zA-Z0-9_]*' },
			block: { type: 'symbol', name: 'block_inner' },
			block_inner: { type: 'seq', members: [{ type: 'string', value: '{' }, { type: 'string', value: '}' }] },
			type_parameters: { type: 'symbol', name: 'identifier' },
			parameter: { type: 'symbol', name: 'identifier' },
			expr: { type: 'symbol', name: 'identifier' },
		};

		const renderRules = applyWrapperDeletion(inputRules);
		const simplified = computeSimplifiedRules(renderRules);
		const wrappers = findWrappersInMap(simplified as Record<string, Rule>);

		expect(
			wrappers,
			`Wrappers found in computeSimplifiedRules output:\n${wrappers.map(w => `  ${w.kind}${w.path.slice(w.kind.length)}: ${w.type}`).join('\n')}`
		).toEqual([]);
	});
});
