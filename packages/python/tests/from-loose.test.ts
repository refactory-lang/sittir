/**
 * Loose-input from() tests — exercise the C6-prereq resolver scaffolding.
 *
 * These are the T052d-i / T052d-ii / T052d-iii cases that corpus-validation
 * doesn't cover (it feeds materialized NodeData both ways). Here we feed
 * developer-shaped loose input — strings, kind-tagged objects, primitive
 * coercion — and check the resolvers produce the right NodeData.
 */

import { describe, it, expect } from 'vitest';
import { ir } from '../src/ir.js';
import * as F from '../src/factories.js';
import { TSKindId } from '../src/types.js';

describe('loose from() — string input for leaf-typed fields (T052d-i)', () => {
	it('identifier field accepts a bare string', () => {
		// dotted_name is a container of Identifier children — after
		// T063 inlining the rule no longer carries a `name` field,
		// so the loose-input shape is "an Identifier element" at
		// the slot position. The container's `from()` is a rest-args
		// function and doesn't auto-resolve bare strings to
		// identifier nodes (that resolution lives in field-level
		// from()), so the test passes a constructed identifier.
		const result = ir.dottedName.from(ir.identifier('foo') as any) as any;
		expect(result.$type).toBe(TSKindId.DottedName);
	});

	it('aliased_import accepts string for both name and alias', () => {
		// aliased_import: { name: dotted_name, alias: identifier }
		// Loose: both as strings.
		const result = ir.aliasedImport.from({
			name: 'os' as any,
			alias: 'system' as any
		}) as any;
		expect(result.$type).toBe(TSKindId.AliasedImport);
	});
});

describe('loose from() — kind-tagged object dispatch (T052d-ii)', () => {
	it('object with `kind` field routes through _resolveByKind', () => {
		// assignment's `content` field resolves across 3 hidden branch
		// kinds (_assignment_eq/_assignment_type/_assignment_typed) —
		// hidden kinds have no entry in _fromMap, so bare `{ kind: ... }`
		// tagging can't reach them (see _resolveOne/_isFromKind in
		// from.ts); the loose resolver's other path — a pre-built
		// NodeData passed straight through (isNodeData check) — is how
		// a caller supplies one. `ir.assignment.eq(...)` (a synthesized
		// per-form factory) no longer exists; F.buildAssignmentEq is the
		// current way to construct that branch's NodeData directly.
		const result = ir.assignment.from({
			left: 'x' as any,
			content: F.buildAssignmentEq({ right: { kind: 'integer', text: '42' } as any })
		}) as any;
		expect(result.$type).toBe(TSKindId.Assignment);
	});
});

describe('loose from() — supertype subtype (T052d-iii)', () => {
	it('expression field accepts any concrete expression subtype as kind-tagged input', () => {
		// expression_statement has children of type expression. Loose:
		// pass a kind-tagged object — the resolver should route via
		// _resolveByKind to the integer factory.
		const result = ir.expressionStatement({
			kind: 'integer',
			text: '1'
		} as any) as any;
		expect(result.$type).toBe(TSKindId.ExpressionStatement);
	});
});

describe('loose from() — NodeData passthrough still works', () => {
	it('pre-built NodeData is passed through unchanged', () => {
		const nodeData = ir.integer('42') as any;
		// See the T052d-ii test above for why F.buildAssignmentEq (not
		// ir.assignment.eq, which no longer exists) is how a caller
		// supplies assignment's hidden-branch-kind `content` field.
		const child = F.buildAssignmentEq({ right: nodeData });
		const result = ir.assignment.from({
			left: 'x' as any,
			content: child
		}) as any;
		expect(result.$type).toBe(TSKindId.Assignment);
	});
});
