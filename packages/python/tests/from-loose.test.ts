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
import { TSKindId } from '../src/types.js';

describe('loose from() — string input for leaf-typed fields (T052d-i)', () => {
	it('identifier field accepts a bare string', () => {
		// dotted_name's leading and repeated `.`-separated occurrences are
		// both fielded as `names`, so dotted_name is a genuine tree-sitter
		// field-backed container: its `from()` takes the standard
		// `{names: [...]}` object shape, not a rest-args spread of
		// elements. The `names` field itself accepts bare strings via
		// leaf-shorthand resolution.
		const result = ir.dottedName({ names: ['foo'] } as any) as any;
		expect(result.$type).toBe(TSKindId.DottedName);
	});

	it('aliased_import accepts string for both name and alias', () => {
		// aliased_import: { name: dotted_name, alias: identifier }
		// Loose: `name` needs at least one identifier for its dotted_name
		// field; `alias` is a bare-string leaf field.
		const result = ir.aliasedImport({
			name: { names: ['os'] } as any,
			alias: 'system' as any
		}) as any;
		expect(result.$type).toBe(TSKindId.AliasedImport);
	});
});

describe('loose from() — kind-tagged object dispatch (T052d-ii)', () => {
	it('object with `kind` field routes through _resolveByKind', () => {
		// assignment is flattened into its variants; the eq variant's
		// `right` expression slot resolves a kind-tagged object through
		// _resolveByKind.
		const result = ir.assignment.eq({
			left: 'x' as any,
			right: { kind: 'integer', text: '42' } as any
		}) as any;
		expect(result.$type).toBe(TSKindId.AssignmentEq);
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
		const result = ir.assignment.eq({
			left: 'x' as any,
			right: nodeData
		}) as any;
		expect(result.$type).toBe(TSKindId.AssignmentEq);
		expect(result.right()).toBe(nodeData);
	});
});
