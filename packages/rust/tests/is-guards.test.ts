/**
 * is × shape guard composition + assert throw behavior (spec 008 SC-006, SC-007).
 *
 * - Type-level: `is.functionItem(v) && isTree(v)` narrows to FunctionItem.Tree.
 * - Runtime: `is.functionItem(v)` returns true only on 'function_item' type.
 * - Runtime: `assert.functionItem(wrong)` throws TypeError with expected+actual.
 */

import { describe, it, expect } from 'vitest';
import { is, isTree, isNode, assert } from '../src/index.ts';
import type { FunctionItem, NamespaceMap } from '../src/index.ts';

type Equals<A, B> =
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

function expectTrue<_T extends true>(): void {}

describe('is / isTree / isNode guard composition', () => {
    it('is.functionItem narrows the type discriminant', () => {
        const v: { type: string } = { type: 'function_item' };
        if (is.functionItem(v)) {
            // Type-level: v.type narrowed to 'function_item'
            expectTrue<Equals<typeof v.type, 'function_item'>>();
        } else {
            throw new Error('is.functionItem should have returned true');
        }
    });

    it('is.functionItem returns false for non-matching kinds', () => {
        expect(is.functionItem({ type: 'block' })).toBe(false);
        expect(is.functionItem({ type: 'identifier' })).toBe(false);
    });

    it('is.kind generic form narrows identically to named form', () => {
        const v: { type: string } = { type: 'block' };
        if (is.kind(v, 'block')) {
            expectTrue<Equals<typeof v.type, 'block'>>();
        }
        expect(is.kind({ type: 'function_item' }, 'function_item')).toBe(true);
        expect(is.kind({ type: 'block' }, 'function_item')).toBe(false);
    });

    it('isNode returns true for NodeData shapes, false for loose bags', () => {
        // Using `as unknown as ...` so the test exercises the generic
        // fallback overload, not the kind-narrowing overload (which
        // requires a known NamespaceMap key at authoring time).
        expect(isNode({ type: 'identifier', text: 'foo' } as unknown as { readonly type: string })).toBe(true);
        expect(isNode({ type: 'block', fields: {} } as unknown as { readonly type: string })).toBe(true);
        // Loose bag without fields or text — looks like a config object.
        expect(isNode({ type: 'function_item' } as unknown as { readonly type: string })).toBe(false);
    });

    it('isTree returns true only when a range() method is present', () => {
        const withRange = { type: 'function_item', range: () => ({ start: { index: 0 }, end: { index: 1 } }) };
        const withoutRange = { type: 'function_item', fields: {} };
        expect(isTree(withRange as unknown as { readonly type: string })).toBe(true);
        expect(isTree(withoutRange as unknown as { readonly type: string })).toBe(false);
    });

    it('kind × shape composition narrows to NamespaceMap projection', () => {
        // This is a TYPE-level test — runtime just verifies the conditional runs.
        const v: FunctionItem = { type: 'function_item', fields: {} } as FunctionItem;
        if (is.functionItem(v) && isNode(v)) {
            // Type-level: v narrowed through NamespaceMap['function_item']['Node'].
            expectTrue<Equals<typeof v['type'], 'function_item'>>();
        }
    });
});

describe('assert throw behavior', () => {
    it('assert.functionItem throws TypeError with expected+actual on mismatch', () => {
        expect(() => assert.functionItem({ type: 'block' })).toThrow(TypeError);
        expect(() => assert.functionItem({ type: 'block' })).toThrow(
            /^assert\.functionItem: expected type 'functionItem', got 'block'$/,
        );
    });

    it('assert.functionItem passes silently on matching kind', () => {
        expect(() => assert.functionItem({ type: 'function_item' })).not.toThrow();
    });

    it('assert.kind throws with kind name in message', () => {
        expect(() => assert.kind({ type: 'block' }, 'function_item')).toThrow(TypeError);
    });

    // NOTE: assert.<kind>(v) narrowing via `asserts v is T` requires the
    // calling site to hoist `assert` to an explicitly-typed wrapper
    // function (TS2775 — assertion signatures can't be called through
    // object-property access at a const binding). The IsGuards/AssertGuards
    // interface types are emitted correctly — consumer code that imports
    // `assert.functionItem` directly and reassigns it to a typed binding
    // gets the narrowing. The runtime throw behavior verified above covers
    // the functional guarantee; the type-level narrowing is enforced by
    // the AssertGuards signature.
});
