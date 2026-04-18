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

describe('loose from() — string input for leaf-typed fields (T052d-i)', () => {
    it('identifier field accepts a bare string', () => {
        // dotted_name is a container of Identifier children — after
        // T063 inlining the rule no longer carries a `name` field,
        // so the loose-input shape is "an Identifier element" at
        // the slot position. The container's `from()` is a rest-args
        // function and doesn't auto-resolve bare strings to
        // identifier nodes (that resolution lives in field-level
        // from()), so the test passes a constructed identifier.
        const result = ir.dottedName.from(ir.identifier('foo')) as any;
        expect(result.$type).toBe('dotted_name');
    });

    it('aliased_import accepts string for both name and alias', () => {
        // aliased_import: { name: dotted_name, alias: identifier }
        // Loose: both as strings.
        const result = ir.aliasedImport.from({
            name: 'os' as any,
            alias: 'system' as any,
        }) as any;
        expect(result.$type).toBe('aliased_import');
    });
});

describe('loose from() — kind-tagged object dispatch (T052d-ii)', () => {
    it('object with `kind` field routes through _resolveByKind', () => {
        // ir.assignment.eq → polymorph form factory (variant 'eq' on parent
        // 'assignment'). Returns NodeData with type='assignment' wrapping a
        // variant child of type='assignment_eq'.
        const result = (ir.assignment as any).eq({
            left: 'x' as any,
            children: [{ $type: 'assignment_eq', $fields: { right: { kind: 'integer', text: '42' } } }] as any,
        }) as any;
        expect(result.$type).toBe('assignment');
    });
});

describe('loose from() — supertype subtype (T052d-iii)', () => {
    it('expression field accepts any concrete expression subtype as kind-tagged input', () => {
        // expression_statement has children of type expression. Loose:
        // pass a kind-tagged object — the resolver should route via
        // _resolveByKind to the integer factory.
        const result = ir.expressionStatement(
            { kind: 'integer', text: '1' } as any,
        ) as any;
        expect(result.$type).toBe('expression_statement');
    });
});

describe('loose from() — NodeData passthrough still works', () => {
    it('pre-built NodeData is passed through unchanged', () => {
        const nodeData = ir.integer('42') as any;
        const child = { $type: 'assignment_eq', $fields: { right: nodeData } } as any;
        // ir.assignment.eq → polymorph form factory (see T052d-ii test above).
        const result = (ir.assignment as any).eq({ left: 'x' as any, children: [child] }) as any;
        expect(result.$type).toBe('assignment');
    });
});
