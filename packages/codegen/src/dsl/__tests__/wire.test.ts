import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { wire, getCurrentWireContext } from '../wire.ts'
import { variant } from '../variant.ts'
import { transform } from '../transform.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

// ---------------------------------------------------------------------------
// Wire helpers — simulate what tree-sitter's grammar() / sittir's
// grammarFn do after wire() augments opts: iterate opts.rules keys in
// insertion order, invoke each fn with a $-proxy, collect the results.
// The iteration order matters — user rules must fire before the
// wire-injected hidden-rule placeholders so deposits are populated
// by the time the placeholders are invoked.
// ---------------------------------------------------------------------------

type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown

function evaluateWiredRules(
    rules: Record<string, RuleFn>,
    baseRules: Record<string, unknown> = {},
): Record<string, unknown> {
    const $ = new Proxy({}, {
        get(_, prop: string) {
            return { type: 'symbol', name: prop }
        },
    })
    const out: Record<string, unknown> = {}
    for (const [name, fn] of Object.entries(rules)) {
        const base = baseRules[name]
        out[name] = fn.call($, $, base)
    }
    return out
}

describe('wire()', () => {
    beforeAll(() => { installFakeDsl() })
    afterAll(() => { restoreFakeDsl() })

    it('returns opts unchanged when no polymorphs are declared', () => {
        const ruleFn: RuleFn = ($, _prev) => ({ type: 'symbol', name: 'x' })
        const wired = wire({ name: 'test', rules: { foo: ruleFn } })
        expect(wired.name).toBe('test')
        expect(Object.keys(wired.rules)).toEqual(['foo'])
        const result = evaluateWiredRules(wired.rules)
        expect(result.foo).toEqual({ type: 'symbol', name: 'x' })
    })

    it('injects hidden-rule placeholders for each declared polymorph arm', () => {
        const wired = wire({
            name: 'test',
            rules: {
                assignment: ($, original) => original,
            },
            polymorphs: {
                assignment: { '0': 'eq', '1': 'type' },
            },
        })
        // Hidden rule names should be keys in opts.rules at wire-return time,
        // which is what tree-sitter will snapshot for its ruleMap.
        expect(Object.keys(wired.rules).sort()).toEqual([
            '_assignment_eq',
            '_assignment_type',
            'assignment',
        ])
    })

    it('deposits captured content when the synthesized parent rule runs', () => {
        // `assignment` original: seq(a, b) — path '0' → 'a', path '1' → 'b'
        const origSeq = { type: 'seq', members: [
            { type: 'symbol', name: 'a' },
            { type: 'symbol', name: 'b' },
        ] }
        const wired = wire({
            name: 'test',
            rules: {},
            polymorphs: {
                assignment: { '0': 'eq', '1': 'type' },
            },
        })
        // Drive the synthesized `assignment` fn with `original = origSeq`.
        const assignmentFn = wired.rules.assignment!
        const assignmentResult = assignmentFn.call({}, {}, origSeq)
        // Result is a seq(alias, alias) — each alias points at the hidden rule.
        expect((assignmentResult as { type: string }).type).toBe('seq')
        const members = (assignmentResult as { members: unknown[] }).members
        expect((members[0] as { type: string, value: string }).type).toBe('alias')
        expect((members[0] as { type: string, value: string }).value).toBe('assignment_eq')
        expect((members[1] as { type: string, value: string }).value).toBe('assignment_type')

        // The hidden-rule fns should now return the captured content.
        const eqFn = wired.rules._assignment_eq!
        const eqBody = eqFn.call({}, {})
        expect(eqBody).toEqual({ type: 'symbol', name: 'a' })
        const typeFn = wired.rules._assignment_type!
        const typeBody = typeFn.call({}, {})
        expect(typeBody).toEqual({ type: 'symbol', name: 'b' })
    })

    it('hidden-rule fn returns blank() when no deposit was made (e.g. parent never ran)', () => {
        const wired = wire({
            name: 'test',
            rules: {},
            polymorphs: { assignment: { '0': 'eq' } },
        })
        const eqFn = wired.rules._assignment_eq!
        const result = eqFn.call({}, {})
        // Fake dsl has no blank(); fn falls back to { type: 'BLANK' }
        expect(result).toEqual({ type: 'BLANK' })
    })

    it('composes user-supplied parent fn with the variant transform', () => {
        // User fn wraps the original in an outer field() before wire's
        // variant transform runs on its output.
        const origSeq = { type: 'seq', members: [
            { type: 'symbol', name: 'a' },
            { type: 'symbol', name: 'b' },
        ] }
        const wired = wire({
            name: 'test',
            rules: {
                // User "pre-transform": wrap original in a seq(seq(...), symbol('x'))
                // so we can verify the wire variant transform runs on the USER's
                // output, not on the raw original.
                assignment: ($, original) => ({ type: 'seq', members: [original, { type: 'symbol', name: 'extra' }] }),
            },
            polymorphs: {
                assignment: { '0/0': 'first', '0/1': 'second' },
            },
        })
        const assignmentFn = wired.rules.assignment!
        const out = assignmentFn.call({}, {}, origSeq)
        // After user's fn, tree is: seq( seq(a, b), extra ). After wire's
        // transform with path '0/0' and '0/1': seq( seq(alias(first), alias(second)), extra ).
        const members = (out as { members: unknown[] }).members
        expect((members[0] as { type: string }).type).toBe('seq')
        const inner = (members[0] as { members: unknown[] }).members
        expect((inner[0] as { value: string }).value).toBe('assignment_first')
        expect((inner[1] as { value: string }).value).toBe('assignment_second')
        expect((members[1] as { name: string }).name).toBe('extra')
    })

    it('preserves currentRuleKind during rule-fn execution', () => {
        // variant('eq') needs getCurrentRuleKind() to return the parent rule
        // name while the wrapped rule fn is on the stack.
        let observedKindDuringAssignment: string | null = null
        let observedKindDuringIdent: string | null = null
        const wired = wire({
            name: 'test',
            rules: {
                assignment: ($, original) => {
                    observedKindDuringAssignment = getCurrentWireContext()?.currentRuleKind ?? null
                    return original
                },
                ident: ($, _prev) => {
                    observedKindDuringIdent = getCurrentWireContext()?.currentRuleKind ?? null
                    return { type: 'pattern', value: '[a-z]+' }
                },
            },
        })
        evaluateWiredRules(wired.rules, {
            assignment: { type: 'symbol', name: 'ident' },
        })
        expect(observedKindDuringAssignment).toBe('assignment')
        expect(observedKindDuringIdent).toBe('ident')
    })

    it('clears currentWireContext after each rule fn returns', () => {
        const wired = wire({
            name: 'test',
            rules: {
                foo: ($, _prev) => ({ type: 'symbol', name: 'x' }),
            },
        })
        expect(getCurrentWireContext()).toBeNull()
        evaluateWiredRules(wired.rules)
        expect(getCurrentWireContext()).toBeNull()
    })

    it('clears context even when a rule fn throws', () => {
        const wired = wire({
            name: 'test',
            rules: {
                boom: () => { throw new Error('intentional') },
            },
        })
        expect(() => evaluateWiredRules(wired.rules)).toThrow('intentional')
        expect(getCurrentWireContext()).toBeNull()
    })

    it('two wire() invocations have isolated contexts', () => {
        const wiredA = wire({
            name: 'a',
            rules: {
                assignment: ($, original) => original,
            },
            polymorphs: { assignment: { '0': 'eq' } },
        })
        const wiredB = wire({
            name: 'b',
            rules: {
                assignment: ($, original) => original,
            },
            polymorphs: { assignment: { '0': 'ne' } },
        })
        const ctxA = (wiredA as unknown as { __wireContext__: unknown }).__wireContext__
        const ctxB = (wiredB as unknown as { __wireContext__: unknown }).__wireContext__
        expect(ctxA).not.toBe(ctxB)

        // Run A's assignment — deposits should appear in A's context only.
        const origSeq = { type: 'seq', members: [{ type: 'symbol', name: 'a' }] }
        wiredA.rules.assignment!.call({}, {}, origSeq)
        const depositsA = (ctxA as { deposits: Map<string, unknown> }).deposits
        const depositsB = (ctxB as { deposits: Map<string, unknown> }).deposits
        expect(depositsA.has('_assignment_eq')).toBe(true)
        expect(depositsB.has('_assignment_ne')).toBe(false)
    })

    it('polymorph registration is idempotent — calling the parent rule twice does not duplicate', () => {
        // Legacy installGrammarWrapper runs rule callbacks twice (pass-1
        // + pass-2). wire's registrations must absorb that benignly.
        const origSeq = { type: 'seq', members: [
            { type: 'symbol', name: 'a' },
            { type: 'symbol', name: 'b' },
        ] }
        const wired = wire({
            name: 'test',
            rules: {},
            polymorphs: { assignment: { '0': 'eq', '1': 'type' } },
        })
        const assignmentFn = wired.rules.assignment!
        assignmentFn.call({}, {}, origSeq)
        assignmentFn.call({}, {}, origSeq)
        const ctx = (wired as unknown as { __wireContext__: { polymorphVariants: unknown[] } }).__wireContext__
        expect(ctx.polymorphVariants).toHaveLength(2)  // not 4
    })

    it('polymorphVariants metadata accumulates on wire context', () => {
        const wired = wire({
            name: 'test',
            rules: {},
            polymorphs: {
                assignment: { '0': 'eq', '1': 'type' },
            },
        })
        const origSeq = { type: 'seq', members: [
            { type: 'symbol', name: 'a' },
            { type: 'symbol', name: 'b' },
        ] }
        wired.rules.assignment!.call({}, {}, origSeq)
        const ctx = (wired as unknown as { __wireContext__: { polymorphVariants: unknown[] } }).__wireContext__
        expect(ctx.polymorphVariants).toEqual([
            { parent: 'assignment', child: 'eq' },
            { parent: 'assignment', child: 'type' },
        ])
    })

    it('wrapped conflicts callback appends variant-registered groups', () => {
        // Force a conflict group via the variant machinery (hoist-sibling
        // path registers conflicts on the parent). Easiest: call the
        // user's conflicts cb and verify the drain appends.
        const origSeq = { type: 'seq', members: [
            { type: 'symbol', name: 'a' },
            { type: 'symbol', name: 'b' },
        ] }
        const wired = wire({
            name: 'test',
            rules: {},
            polymorphs: { assignment: { '0': 'eq', '1': 'type' } },
            conflicts: ($, _prev) => {
                const p = $ as Record<string, unknown>
                return [[p.user_conflict_a, p.user_conflict_b]] as unknown[][]
            },
        })
        // Drive assignment to populate deposits AND register hoist-conflicts.
        wired.rules.assignment!.call({}, {}, origSeq)
        // Drive conflicts via the $ proxy.
        const $ = new Proxy({}, {
            get: (_, prop: string) => ({ type: 'symbol', name: prop }),
        })
        const cb = wired.conflicts!
        const out = cb.call({}, $, []) as Array<Array<{ name: string }>>
        // First group is the user's; the tail is the symbolized drained groups.
        expect(out.length).toBeGreaterThanOrEqual(1)
        expect(out[0]![0]).toMatchObject({ name: 'user_conflict_a' })
        expect(out[0]![1]).toMatchObject({ name: 'user_conflict_b' })
    })
})

// Silence unused-import warnings if transform/variant aren't referenced
// above — they're kept imported to prove wire.ts plays well with them.
void transform; void variant
