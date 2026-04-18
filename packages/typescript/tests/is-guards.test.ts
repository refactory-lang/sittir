/**
 * is / assert / isTree / isNode guard composition on typescript grammar.
 * Mirrors the rust counterpart.
 */

import { describe, it, expect } from 'vitest'
import { is, isNode, isTree, assert } from '../src/index.ts'

describe('typescript is / isTree / isNode composition', () => {
    it('is.classDeclaration narrows on matching kind', () => {
        const v = { $type: 'class_declaration' }
        expect(is.classDeclaration(v)).toBe(true)
        expect(is.classDeclaration({ $type: 'function_declaration' })).toBe(false)
    })

    it('is.kind generic form accepts arbitrary kinds', () => {
        expect(is.kind({ $type: 'function_declaration' }, 'function_declaration')).toBe(true)
        expect(is.kind({ $type: 'function_declaration' }, 'class_declaration')).toBe(false)
    })

    it('isNode returns true for NodeData shapes', () => {
        expect(isNode({ $type: 'identifier', $text: 'foo' } as unknown as { readonly $type: string })).toBe(true)
        expect(isNode({ $type: 'class_declaration', $fields: {} } as unknown as { readonly $type: string })).toBe(true)
        expect(isNode({ $type: 'function_declaration' } as unknown as { readonly $type: string })).toBe(false)
    })

    it('isTree returns true only when a range() method is present', () => {
        const withRange = { $type: 'identifier', range: () => ({ start: { index: 0 }, end: { index: 1 } }) }
        const withoutRange = { $type: 'identifier', $fields: {} }
        expect(isTree(withRange)).toBe(true)
        expect(isTree(withoutRange)).toBe(false)
    })

    it('assert.kind throws on mismatch', () => {
        expect(() => assert.functionDeclaration({ $type: 'class_declaration' })).toThrow(TypeError)
    })
})
