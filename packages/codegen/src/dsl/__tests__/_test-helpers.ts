/**
 * _test-helpers.ts — shared setup for DSL unit tests.
 *
 * The DSL wrappers (`transform`, `field`, `alias`, `insert`,
 * `replace`, and the path-mode reconstruction helpers) delegate to
 * runtime-injected globals (`globalThis.seq`, `globalThis.choice`,
 * `globalThis.optional`, `globalThis.repeat`, `globalThis.repeat1`,
 * `globalThis.field`, `globalThis.prec`, `globalThis.alias`). In
 * production sittir's `evaluate.ts` and tree-sitter's CLI both inject
 * these before any DSL call runs. Unit tests that import DSL
 * functions directly bypass that injection, so they have to install
 * fake globals themselves.
 *
 * Use `installFakeDsl()` in a `beforeAll` and `restoreFakeDsl()` in
 * the corresponding `afterAll`. The fakes mirror sittir's
 * lowercase-type Rule shape so assertions in the tests can use the
 * standard `Rule` union.
 */

import type { Rule } from '../../compiler/rule.ts'

type Globals = Record<string, unknown>

const DSL_KEYS = [
    'seq', 'choice', 'optional', 'repeat', 'repeat1',
    'field', 'alias', 'prec',
] as const

let savedGlobals: Globals | null = null

/**
 * Install minimal sittir-shape DSL fakes on `globalThis`. Call this
 * in `beforeAll`. Safe to nest — the saved-globals snapshot stacks.
 * (This is unusual in practice; prefer `afterAll` cleanup per file.)
 */
export function installFakeDsl(overrides?: Partial<Globals>): void {
    const g = globalThis as Globals
    const saved: Globals = {}
    for (const k of DSL_KEYS) saved[k] = g[k]
    savedGlobals = saved

    g.seq = (...members: Rule[]): Rule => ({ type: 'seq', members } as Rule)
    g.choice = (...members: Rule[]): Rule => ({ type: 'choice', members } as Rule)
    g.optional = (content: Rule): Rule => ({ type: 'optional', content } as Rule)
    g.repeat = (content: Rule): Rule => ({ type: 'repeat', content } as Rule)
    g.repeat1 = (content: Rule): Rule => ({ type: 'repeat1', content } as Rule)
    g.field = (name: string, content: Rule): Rule => ({ type: 'field', name, content } as Rule)
    g.alias = (rule: unknown, value: unknown): Rule => {
        if (typeof value === 'string') {
            return { type: 'alias', content: rule, named: false, value } as Rule
        }
        const sym = value as { type?: string; name?: string }
        if (sym && (sym.type === 'symbol' || sym.type === 'SYMBOL')) {
            return { type: 'alias', content: rule, named: true, value: sym.name } as Rule
        }
        throw new Error('fake alias: invalid value')
    }
    // prec/prec.left/prec.right/prec.dynamic all preserve the value
    // on the returned rule so tests can assert precedence round-trip.
    const makePrec = (variant: 'prec' | 'prec_left' | 'prec_right' | 'prec_dynamic') =>
        (value: number, content: Rule): Rule =>
            ({ type: variant, value, content } as unknown as Rule)
    const precFn = makePrec('prec') as ((value: number, content: Rule) => Rule) & {
        left: (value: number, content: Rule) => Rule
        right: (value: number, content: Rule) => Rule
        dynamic: (value: number, content: Rule) => Rule
    }
    precFn.left = makePrec('prec_left')
    precFn.right = makePrec('prec_right')
    precFn.dynamic = makePrec('prec_dynamic')
    g.prec = precFn

    if (overrides) {
        for (const [k, v] of Object.entries(overrides)) g[k] = v
    }
}

/**
 * Restore the globals saved by the most recent `installFakeDsl()`
 * call. Call this in `afterAll`.
 */
export function restoreFakeDsl(): void {
    if (savedGlobals === null) return
    const g = globalThis as Globals
    for (const [k, v] of Object.entries(savedGlobals)) {
        if (v === undefined) delete g[k]
        else g[k] = v
    }
    savedGlobals = null
}
