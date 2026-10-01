/**
 * Loose-input from() tests — exercise the C6-prereq resolver scaffolding.
 *
 * These are the T052d-i / T052d-ii / T052d-iii cases that corpus-validation
 * doesn't cover (it feeds materialized UntypedNode both ways). Here we feed
 * developer-shaped loose input — strings, kind-tagged objects, primitive
 * coercion — and check the resolvers produce the right UntypedNode.
 */

import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('loose from() — string input for leaf-typed fields (T052d-i)', () => {
	it('identifier field accepts a bare string', () => {
		// dotted_name's leading and repeated `.`-separated occurrences are
		// both fielded as `names`, so dotted_name is a genuine tree-sitter
		// field-backed container: its `from()` takes the standard
		// `{names: [...]}` object shape, not a rest-args spread of
		// elements. The `names` field itself accepts bare strings via
		// leaf-shorthand resolution.
		const result = py.build.dottedName({ names: ['foo'] } as any) as any;
		expect(result.$type).toBe(py.kinds.DottedName);
	});

	it('aliased_import accepts string for both name and alias', () => {
		// aliased_import: { name: dotted_name, alias: identifier }
		// Loose: `name` needs at least one identifier for its dotted_name
		// field; `alias` is a bare-string leaf field.
		const result = py.build.aliasedImport({
			name: { names: ['os'] } as any,
			alias: 'system' as any
		}) as any;
		expect(result.$type).toBe(py.kinds.AliasedImport);
	});
});

describe('loose from() — kind-tagged object dispatch (T052d-ii)', () => {
	it('object with `$type` field routes through _resolveByKind', () => {
		// assignment is flattened into its variants; the eq variant's
		// `right` expression slot resolves a kind-tagged object through
		// _resolveByKind.
		const result = py.build.assignment.eq({
			left: 'x' as any,
			right: { $type: py.kinds.IntegerDecimalPlain, text: '42' } as any
		}) as any;
		expect(result.$type).toBe(py.kinds.AssignmentEq);
		expect(result.right().$type).toBe(py.kinds.IntegerDecimalPlain);
		expect(result.right().$text).toBe('42');
	});

	it('a leaf tag builds that leaf from its text', () => {
		const result = py.build.assignment.eq({ left: 'x' as any, right: { $type: py.kinds.Identifier, text: 'y' } as any }) as any;
		expect(result.right().$type).toBe(py.kinds.Identifier);
		expect(result.right().$text).toBe('y');
	});

	it('a leaf tag without its text throws naming the shape', () => {
		expect(() => py.build.assignment.eq({ left: 'x' as any, right: { $type: py.kinds.Identifier, value: 'y' } as any })).toThrow(
			/the identifier tag takes its text: \{ \$type: <kind id>, text: "…" \}/
		);
	});
});

describe('loose from() — a supertype kind tag', () => {
	it('is not a kind id of the candidates', () => {
		expect(() => py.build.expressionStatement({ $type: py.kinds.PrimaryExpression, text: '1' } as any)).toThrow(
			/the \$type tag \d+ is not a kind id of \[.*\binteger_decimal_plain\b/
		);
	});

	it('is not a kind id when it is a name string', () => {
		expect(() => py.build.expressionStatement({ $type: 'integer_decimal', text: '1' } as any)).toThrow(
			/the \$type tag "integer_decimal" is not a kind id of \[/
		);
	});
});

describe('loose from() — supertype subtype (T052d-iii)', () => {
	it('expression field accepts any concrete expression subtype as kind-tagged input', () => {
		// expression_statement has children of type expression. Loose:
		// pass a kind-tagged object — the resolver should route via
		// _resolveByKind to the integer factory.
		const result = py.build.expressionStatement({
			$type: py.kinds.IntegerDecimalPlain,
			text: '1'
		} as any) as any;
		expect(result.$type).toBe(py.kinds.ExpressionStatement);
		expect(result.content().$type).toBe(py.kinds.IntegerDecimalPlain);
	});
});

describe('loose from() — UntypedNode passthrough still works', () => {
	it('pre-built UntypedNode is passed through unchanged', () => {
		const untypedNode = py.build.integer('42') as any;
		const result = py.build.assignment.eq({
			left: 'x' as any,
			right: untypedNode
		}) as any;
		expect(result.$type).toBe(py.kinds.AssignmentEq);
		expect(result.right()).toBe(untypedNode);
	});
});
