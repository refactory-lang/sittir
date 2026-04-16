import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { alias } from '../alias.ts'
import type { Rule } from '../../compiler/rule.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

const sym = (name: string): Rule => ({ type: 'symbol', name } as Rule)

beforeAll(() => { installFakeDsl() })
afterAll(() => { restoreFakeDsl() })

describe('alias()', () => {
    describe('one-arg shorthand', () => {
        it('expands alias($.name) to the named-self form', () => {
            const result = alias(sym('expression'))
            expect(result).toEqual({
                type: 'alias',
                content: { type: 'symbol', name: 'expression' },
                named: true,
                value: 'expression',
            })
        })

        it('throws when the single argument is not a symbol reference', () => {
            expect(() => alias({ type: 'string', value: 'foo' } as Rule))
                .toThrow(/symbol reference/)
        })
    })

    describe('two-arg form (baseline tree-sitter)', () => {
        it('handles string second arg as anonymous alias', () => {
            const result = alias(sym('foo'), 'bar')
            expect(result).toEqual({
                type: 'alias',
                content: { type: 'symbol', name: 'foo' },
                named: false,
                value: 'bar',
            })
        })

        it('handles symbol second arg as named alias', () => {
            const result = alias(sym('foo'), sym('renamed'))
            expect(result).toEqual({
                type: 'alias',
                content: { type: 'symbol', name: 'foo' },
                named: true,
                value: 'renamed',
            })
        })

        it('throws on invalid second arg via the fake native', () => {
            expect(() => alias(sym('foo'), 42 as unknown as string))
                .toThrow(/invalid value/)
        })
    })
})
