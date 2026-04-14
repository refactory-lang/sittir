import { describe, it, expect } from 'vitest'
import { link, enrichPositions, computeParentSets } from '../compiler/link.ts'
import type { RawGrammar, Rule, LinkedGrammar, SymbolRef } from '../compiler/rule.ts'

function makeRaw(rules: Record<string, Rule>, overrides?: Partial<RawGrammar>): RawGrammar {
    return {
        name: 'test',
        rules,
        extras: [],
        externals: [],
        supertypes: [],
        inline: [],
        conflicts: [],
        word: null,
        references: [],
        ...overrides,
    }
}

describe('Link — reference resolution', () => {

    it('resolves symbol references to their content', () => {
        const raw = makeRaw({
            source_file: {
                type: 'repeat',
                content: { type: 'symbol', name: 'statement' },
            },
            statement: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'x' },
                    { type: 'string', value: ';' },
                ],
            },
        })
        const linked = link(raw)
        // source_file's repeat content should reference 'statement' as a symbol
        // Link keeps visible symbol references (they become named children)
        // Hidden symbols get inlined
        expect(linked.rules['source_file']).toBeDefined()
        expect(linked.rules['statement']).toBeDefined()
    })

    it('produces a LinkedGrammar with no alias or token nodes', () => {
        const raw = makeRaw({
            root: {
                type: 'seq',
                members: [
                    { type: 'token', content: { type: 'string', value: '//' }, immediate: false },
                    { type: 'repeat1', content: { type: 'string', value: 'x' } },
                ],
            },
        })
        const linked = link(raw)

        function assertNoRefTypes(rule: Rule): void {
            if ('type' in rule) {
                expect(rule.type).not.toBe('alias')
                expect(rule.type).not.toBe('token')
                // NOTE: `repeat1` is intentionally preserved through
                // Link so the downstream field / child derivation can
                // stamp `nonEmpty: true` on the resulting slot and the
                // types emitter can render a non-empty tuple type.
            }
            if ('content' in rule && rule.content) assertNoRefTypes(rule.content as Rule)
            if ('members' in rule && Array.isArray((rule as any).members)) {
                for (const m of (rule as any).members) assertNoRefTypes(m)
            }
        }

        for (const rule of Object.values(linked.rules)) {
            assertNoRefTypes(rule)
        }
    })

    it('preserves repeat1 through Link for non-empty signal', () => {
        const raw = makeRaw({
            items: { type: 'repeat1', content: { type: 'string', value: 'x' } },
        })
        const linked = link(raw)
        // `items` is a pure-terminal subtree (only string literals) so Link
        // wraps it as TerminalRule; unwrap to verify the repeat1 survived.
        const rule = linked.rules['items']
        const inner = rule!.type === 'terminal' ? (rule as any).content : rule
        expect(inner.type).toBe('repeat1')
    })

    it('flattens token to its content', () => {
        const raw = makeRaw({
            comment: { type: 'token', content: { type: 'string', value: '//' }, immediate: false },
        })
        const linked = link(raw)
        expect(linked.rules['comment']).toEqual({ type: 'string', value: '//' })
    })
})

describe('Link — hidden rule classification', () => {

    it('classifies hidden choice-of-symbols in supertypes as supertype', () => {
        const raw = makeRaw({
            _expression: {
                type: 'choice',
                members: [
                    { type: 'symbol', name: 'binary_expression' },
                    { type: 'symbol', name: 'identifier' },
                ],
            },
            binary_expression: { type: 'string', value: 'binexpr' },
            identifier: { type: 'pattern', value: '[a-z]+' },
        }, { supertypes: ['_expression'] })
        const linked = link(raw)
        expect(linked.rules['_expression']).toEqual({
            type: 'supertype',
            name: '_expression',
            subtypes: ['binary_expression', 'identifier'],
            source: 'grammar',
        })
    })

    it('classifies hidden choice-of-strings as enum', () => {
        const raw = makeRaw({
            _visibility: {
                type: 'choice',
                members: [
                    { type: 'string', value: 'pub' },
                    { type: 'string', value: 'crate' },
                ],
            },
        })
        const linked = link(raw)
        // Hidden choice of strings → already an enum from Evaluate
        // But if it arrives as a choice, Link should detect it
        expect(linked.rules['_visibility']!.type).toBe('enum')
    })
})

describe('Link — clause detection', () => {

    it('detects optional(seq(STRING, FIELD, ...)) as a clause', () => {
        const raw = makeRaw({
            function_def: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'fn' },
                    { type: 'optional', content: {
                        type: 'seq',
                        members: [
                            { type: 'string', value: '->' },
                            { type: 'field', name: 'return_type', content: { type: 'symbol', name: 'type' } },
                        ],
                    }},
                ],
            },
            type: { type: 'pattern', value: '[A-Z]\\w*' },
        })
        const linked = link(raw)
        const fnDef = linked.rules['function_def'] as any
        // The optional should be detected as a clause
        const optionalMember = fnDef.members[1]
        expect(optionalMember.type).toBe('clause')
    })
})

describe('Link — field provenance', () => {

    it('preserves field source from override', () => {
        const raw = makeRaw({
            item: {
                type: 'seq',
                members: [
                    { type: 'field', name: 'body', content: { type: 'symbol', name: 'block' }, source: 'override' },
                ],
            },
            block: { type: 'string', value: '{}' },
        })
        const linked = link(raw)
        const item = linked.rules['item'] as any
        expect(item.members[0].source).toBe('override')
    })
})

describe('Link — output contract', () => {

    it('returns supertypes as a Set', () => {
        const raw = makeRaw({
            _expression: {
                type: 'choice',
                members: [
                    { type: 'symbol', name: 'id' },
                ],
            },
            id: { type: 'pattern', value: '[a-z]+' },
        }, { supertypes: ['_expression'] })
        const linked = link(raw)
        expect(linked.supertypes).toBeInstanceOf(Set)
        expect(linked.supertypes.has('_expression')).toBe(true)
    })

    it('returns word from raw grammar', () => {
        const raw = makeRaw({ id: { type: 'pattern', value: '[a-z]+' } }, { word: 'id' })
        const linked = link(raw)
        expect(linked.word).toBe('id')
    })
})

describe('Link — reference graph enrichment', () => {

    it('enrichPositions assigns position to refs by walking seq members', () => {
        const rules: Record<string, Rule> = {
            item: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'fn' },
                    { type: 'symbol', name: 'name' },
                    { type: 'symbol', name: 'body' },
                ],
            },
        }
        const refs: SymbolRef[] = [
            { refType: 'symbol', from: 'item', to: 'name' },
            { refType: 'symbol', from: 'item', to: 'body' },
        ]
        enrichPositions(rules, refs)
        expect(refs[0]!.position).toBe(1)
        expect(refs[1]!.position).toBe(2)
    })

    it('computeParentSets groups refs by target symbol', () => {
        const refs: SymbolRef[] = [
            { refType: 'symbol', from: 'a', to: 'block' },
            { refType: 'symbol', from: 'b', to: 'block' },
            { refType: 'symbol', from: 'a', to: 'expr' },
        ]
        const parents = computeParentSets(refs)
        expect(parents.get('block')).toHaveLength(2)
        expect(parents.get('expr')).toHaveLength(1)
    })
})

describe('Link — T019a cycle detection', () => {

    it('detects self-referential hidden rule without crashing', () => {
        const raw = makeRaw({
            _recursive: {
                type: 'choice',
                members: [
                    { type: 'symbol', name: '_recursive' },
                    { type: 'string', value: 'base' },
                ],
            },
        })
        // Should not throw — cycles are flagged, not fatal
        const linked = link(raw)
        expect(linked.rules['_recursive']).toBeDefined()
    })
})

describe('Link — T016a hidden choice classification', () => {

    it('classifies hidden choice of symbols as supertype', () => {
        const refs: SymbolRef[] = [
            { refType: 'symbol', from: 'a', to: '_helper' },
            { refType: 'symbol', from: 'b', to: '_helper' },
            { refType: 'symbol', from: 'c', to: '_helper' },
        ]
        const raw = makeRaw({
            _helper: {
                type: 'choice',
                members: [
                    { type: 'symbol', name: 'x' },
                    { type: 'symbol', name: 'y' },
                ],
            },
            a: { type: 'symbol', name: '_helper' },
            b: { type: 'symbol', name: '_helper' },
            c: { type: 'symbol', name: '_helper' },
            x: { type: 'pattern', value: 'x' },
            y: { type: 'pattern', value: 'y' },
        }, { references: refs })
        const linked = link(raw)
        // All hidden choices → supertype (Link classifies, Assemble passes through)
        expect(linked.rules['_helper']!.type).toBe('supertype')
    })
})

describe('Link — variant tagging + polymorph promotion', () => {
    it('tagVariants wraps visible choice members in variant rules', () => {
        // Moved from optimize.test.ts after variant tagging relocated to
        // Link. Variant wrapping is classification (it adds wrapper nodes
        // that name each branch) — not simplification.
        const raw = makeRaw({
            statement: {
                type: 'choice',
                members: [
                    { type: 'seq', members: [{ type: 'string', value: 'if' }, { type: 'symbol', name: 'expr' }] },
                    { type: 'seq', members: [{ type: 'string', value: 'while' }, { type: 'symbol', name: 'expr' }] },
                ],
            },
            expr: { type: 'pattern', value: '.*' },
        })
        const linked = link(raw)
        const stmt = linked.rules['statement'] as any
        // Both branches have the same (empty) field shape, so promotePolymorph
        // leaves this as a choice with variant-wrapped members.
        expect(stmt.type).toBe('choice')
        expect(stmt.members.every((m: any) => m.type === 'variant')).toBe(true)
        expect(stmt.members[0].name).toBe('if')
        expect(stmt.members[1].name).toBe('while')
    })

    it('promotePolymorph wraps heterogeneous-field choices', () => {
        const raw = makeRaw({
            assignment: {
                type: 'choice',
                members: [
                    { type: 'seq', members: [
                        { type: 'string', value: '=' },
                        { type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
                    ] },
                    { type: 'seq', members: [
                        { type: 'string', value: ':' },
                        { type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
                    ] },
                ],
            },
            expr: { type: 'pattern', value: '.*' },
        })
        const linked = link(raw)
        const assignment = linked.rules['assignment'] as any
        expect(assignment.type).toBe('polymorph')
        expect(assignment.forms).toHaveLength(2)
        expect(assignment.forms[0].name).toBe('eq')
        expect(assignment.forms[1].name).toBe('colon')
    })

    it('homogeneous-field choices stay as choice + variants (not polymorph)', () => {
        // Two variants, both with a single `value` field — same field set
        // → not a polymorph. Must carry symbol refs so promoteTerminals
        // doesn't kick in first.
        const raw = makeRaw({
            literal: {
                type: 'choice',
                members: [
                    { type: 'seq', members: [
                        { type: 'string', value: 'int' },
                        { type: 'field', name: 'value', content: { type: 'symbol', name: 'num' } },
                    ] },
                    { type: 'seq', members: [
                        { type: 'string', value: 'float' },
                        { type: 'field', name: 'value', content: { type: 'symbol', name: 'num' } },
                    ] },
                ],
            },
            num: { type: 'pattern', value: '[0-9]+' },
        })
        const linked = link(raw)
        const literal = linked.rules['literal'] as any
        // Same field shape across variants — stays as choice+variants,
        // not a polymorph.
        expect(literal.type).toBe('choice')
        expect(literal.members.every((m: any) => m.type === 'variant')).toBe(true)
    })
})
