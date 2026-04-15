import { describe, it, expect } from 'vitest'
import { role, withRoleScope } from '../role.ts'
import type { Rule } from '../../compiler/rule.ts'

const sym = (name: string): Rule => ({ type: 'symbol', name } as Rule)

describe('role()', () => {
    it('returns the symbol reference unchanged', () => {
        const ref = sym('_indent')
        const { result, roles } = withRoleScope(() => role(ref, 'indent'))
        expect(result).toBe(ref)
        expect(roles.get('_indent')).toEqual({ role: 'indent' })
    })

    it('captures multiple role calls in the same scope', () => {
        const { roles } = withRoleScope(() => {
            role(sym('_indent'), 'indent')
            role(sym('_dedent'), 'dedent')
            role(sym('_newline'), 'newline')
        })
        expect(roles.size).toBe(3)
        expect(roles.get('_indent')).toEqual({ role: 'indent' })
        expect(roles.get('_dedent')).toEqual({ role: 'dedent' })
        expect(roles.get('_newline')).toEqual({ role: 'newline' })
    })

    it('returns the symbol unchanged when called outside any scope (tree-sitter CLI compat)', () => {
        // No withRoleScope wrapper — simulating tree-sitter CLI
        // loading the transpiled grammar.js. The binding is silently
        // dropped (tree-sitter doesn't need it), but the symbol
        // passthrough still works so externals receives a valid token.
        const ref = sym('_indent')
        const result = role(ref, 'indent')
        expect(result).toBe(ref)
    })

    it('throws when first arg is not a symbol reference', () => {
        withRoleScope(() => {
            expect(() => role('_indent' as unknown as Rule, 'indent')).toThrow(/symbol reference/)
            expect(() => role({ type: 'string', value: '_indent' } as Rule, 'indent')).toThrow(/symbol reference/)
        })
    })

    describe('nested scopes (FR-012 — per-grammar isolation)', () => {
        it('inner scope does not leak into outer', () => {
            const { roles: outer } = withRoleScope(() => {
                role(sym('_outer_indent'), 'indent')
                withRoleScope(() => {
                    role(sym('_inner_indent'), 'indent')
                })
                // outer accumulator should still only see its own entry
            })
            expect(outer.size).toBe(1)
            expect(outer.has('_outer_indent')).toBe(true)
            expect(outer.has('_inner_indent')).toBe(false)
        })

        it('outer scope does not leak into inner', () => {
            withRoleScope(() => {
                role(sym('_outer'), 'indent')
                const { roles: inner } = withRoleScope(() => {
                    role(sym('_inner'), 'dedent')
                })
                expect(inner.size).toBe(1)
                expect(inner.has('_inner')).toBe(true)
                expect(inner.has('_outer')).toBe(false)
            })
        })

        it('inner scope is restored on exception', () => {
            withRoleScope(() => {
                role(sym('_outer'), 'indent')
                try {
                    withRoleScope(() => {
                        role(sym('_inner'), 'dedent')
                        throw new Error('boom')
                    })
                } catch {
                    // swallow
                }
                // After the inner scope unwinds, outer accumulator is intact
                // and `role()` still works (we're back in outer scope).
                expect(() => role(sym('_outer2'), 'newline')).not.toThrow()
            })
        })
    })
})
