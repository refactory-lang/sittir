import { describe, it, expect } from 'vitest'
import { resolveEffectiveLiteral, isAutoStampField } from '../emitters/shared.ts'
import type { NodeMap } from '../compiler/types.ts'
import type { AssembledField } from '../compiler/node-map.ts'
import { AssembledKeyword, AssembledLeaf } from '../compiler/node-map.ts'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeNodeMap(nodes: [string, any][]): NodeMap {
    return {
        name: 'test',
        nodes: new Map(nodes),
        signatures: { signatures: new Map() },
        projections: { projections: new Map() },
        derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
        polymorphFormKinds: new Set(),
    }
}

function makeField(overrides: Partial<AssembledField>): AssembledField {
    return {
        name: 'field',
        propertyName: 'field',
        paramName: 'field',
        required: true,
        multiple: false,
        contentTypes: [],
        source: 'grammar',
        projection: { typeName: '', kinds: [] },
        ...overrides,
    }
}

function makeKeyword(kind: string, text: string): AssembledKeyword {
    return new AssembledKeyword(kind, { type: 'string', value: text })
}

function makeLeaf(kind: string): AssembledLeaf {
    return new AssembledLeaf(kind, { type: 'pattern', value: '' })
}

// ---------------------------------------------------------------------------
// resolveEffectiveLiteral
// ---------------------------------------------------------------------------

describe('resolveEffectiveLiteral', () => {
    describe('Source A — inline literal', () => {
        it('returns the single literal value when literalValues has exactly one entry (required)', () => {
            const field = makeField({ literalValues: ['break'], required: true })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBe('break')
        })

        it('returns the literal for a single-char punctuation literal (required)', () => {
            const field = makeField({ literalValues: ['::'], required: true })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBe('::')
        })

        it('returns undefined for optional single-literal field', () => {
            const field = makeField({ literalValues: ['in'], required: false })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined for multi-literal (choice-of-strings)', () => {
            const field = makeField({ literalValues: ['{', '{|'], required: true })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined for empty literalValues', () => {
            const field = makeField({ literalValues: [], required: true })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })
    })

    describe('Source B — referenced constant kind', () => {
        it('returns the keyword text when contentTypes has exactly one hidden AssembledKeyword (required)', () => {
            const field = makeField({ contentTypes: ['_kw_break'], required: true })
            const nodeMap = makeNodeMap([
                ['_kw_break', makeKeyword('_kw_break', 'break')],
            ])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBe('break')
        })

        it('returns undefined for optional single-keyword ref', () => {
            const field = makeField({ contentTypes: ['_kw_async'], required: false })
            const nodeMap = makeNodeMap([
                ['_kw_async', makeKeyword('_kw_async', 'async')],
            ])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined for visible (non-hidden) keyword kinds to avoid mixed-choice false-positives', () => {
            // e.g. pointer_type.mutable_specifier where the choice also includes 'const'
            const field = makeField({ contentTypes: ['mutable_specifier'], required: true })
            const nodeMap = makeNodeMap([
                ['mutable_specifier', makeKeyword('mutable_specifier', 'mut')],
            ])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined for multi-kind contentTypes', () => {
            const field = makeField({ contentTypes: ['_kw_a', '_kw_b'], required: true })
            const nodeMap = makeNodeMap([
                ['_kw_a', makeKeyword('_kw_a', 'a')],
                ['_kw_b', makeKeyword('_kw_b', 'b')],
            ])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined when the single referenced kind is not AssembledKeyword', () => {
            const field = makeField({ contentTypes: ['_hidden_leaf'], required: true })
            const nodeMap = makeNodeMap([
                ['_hidden_leaf', makeLeaf('_hidden_leaf')],
            ])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined when the referenced kind is not in the nodeMap', () => {
            const field = makeField({ contentTypes: ['_unknown_kind'], required: true })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })
    })

    describe('multiple: true guard', () => {
        it('returns undefined for a repeated field even if literalValues has one entry', () => {
            const field = makeField({ literalValues: ['async'], multiple: true, required: true })
            const nodeMap = makeNodeMap([])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })

        it('returns undefined for a repeated field with single AssembledKeyword ref', () => {
            const field = makeField({ contentTypes: ['_kw_async'], multiple: true, required: true })
            const nodeMap = makeNodeMap([
                ['_kw_async', makeKeyword('_kw_async', 'async')],
            ])
            expect(resolveEffectiveLiteral(field, nodeMap)).toBeUndefined()
        })
    })

    describe('isAutoStampField convenience wrapper', () => {
        it('returns true when resolveEffectiveLiteral would return a value', () => {
            const field = makeField({ literalValues: ['pub'], required: true })
            const nodeMap = makeNodeMap([])
            expect(isAutoStampField(field, nodeMap)).toBe(true)
        })

        it('returns false when resolveEffectiveLiteral would return undefined (optional)', () => {
            const field = makeField({ literalValues: ['pub'], required: false })
            const nodeMap = makeNodeMap([])
            expect(isAutoStampField(field, nodeMap)).toBe(false)
        })

        it('returns false when resolveEffectiveLiteral would return undefined (non-literal kind)', () => {
            const field = makeField({ contentTypes: ['identifier'], required: true })
            const nodeMap = makeNodeMap([
                ['identifier', makeLeaf('identifier')],
            ])
            expect(isAutoStampField(field, nodeMap)).toBe(false)
        })
    })
})
