import { describe, it, expect } from 'vitest'
import { link, enrichPositions, computeParentSets, applyOverridePolymorphs } from '../compiler/link.ts'
import type { DerivationLog } from '../compiler/types.ts'
import type { Rule, SymbolRef } from '../compiler/rule.ts'
import type { RawGrammar, LinkedGrammar } from '../compiler/types.ts'

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
    it('leaves visible choice members un-wrapped — named variants are the grammar-author path', () => {
        // Pre-spec-013 Link ran `tagAllRulesVariants` to auto-wrap every
        // visible choice branch in `variant('form_N' | leading-literal)`.
        // That was a heuristic for polymorph-promotion candidacy; with the
        // simplify pipeline's cross-branch hoist + mergeChoiceBranches
        // handling same-shape merges directly, anonymous auto-tags
        // served only to block those passes and to mask the grammar
        // author's need to declare named `variant()` in overrides.ts.
        // Link now leaves the choice structure alone — promotion happens
        // via `applyOverridePolymorphs` on user-declared variants only.
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
        expect(stmt.type).toBe('choice')
        expect(stmt.members.every((m: any) => m.type === 'seq')).toBe(true)
    })

    it('promotePolymorph detects heterogeneous-field choices (suggestion-only, no mutation)', () => {
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
        expect(assignment.type).not.toBe('polymorph')
        expect(linked.derivations.promotedRules.some(
            (p: any) => p.kind === 'assignment' && p.classification === 'polymorph' && !p.applied
        )).toBe(true)
    })

    it('applyOverridePolymorphs pushes ambient scaffold into variant-child hidden rules when they live deep in the parent rule', () => {
        // visibility_modifier-shaped case: variant aliases buried in
        // `optional(seq('(', inner_choice, ')'))`. `findVariantChoice`
        // only sees the outermost (tagVariants-wrapped) choice whose
        // members do NOT reference the registered `${parent}_${child}`
        // symbols → push-down path runs. Each `_${parent}_${child}`
        // hidden rule gets flanking `(` / `)` wrapped around its body;
        // the parent rule's enclosing seq drops those literals so the
        // walker emits `$PUB$$$CHILDREN`. Parent stays as a choice
        // (assemble suppresses T065 polymorph promotion via
        // `variantParents`).
        //
        // Called directly to isolate the push-down behavior from Link's
        // other passes (tagVariants, hidden-rule classification) that
        // would otherwise restructure this fixture.
        const rules: Record<string, Rule> = {
            visibility_modifier: {
                type: 'choice',
                members: [
                    { type: 'variant', name: 'crate', content: { type: 'symbol', name: 'crate' } },
                    { type: 'variant', name: 'form1', content: { type: 'seq', members: [
                        { type: 'field', name: 'pub', content: { type: 'symbol', name: '_kw_pub' } },
                        { type: 'optional', content: { type: 'seq', members: [
                            { type: 'string', value: '(' },
                            { type: 'choice', members: [
                                { type: 'alias', named: true, value: 'visibility_modifier_pub_self',
                                    content: { type: 'symbol', name: '_visibility_modifier_pub_self' } },
                                { type: 'alias', named: true, value: 'visibility_modifier_pub_super',
                                    content: { type: 'symbol', name: '_visibility_modifier_pub_super' } },
                            ] },
                            { type: 'string', value: ')' },
                        ] } },
                    ] } },
                ],
            },
            _visibility_modifier_pub_self: { type: 'symbol', name: 'self' },
            _visibility_modifier_pub_super: { type: 'symbol', name: 'super' },
        }
        const derivations: DerivationLog = { inferredFields: [], promotedRules: [], repeatedShapes: [] }
        applyOverridePolymorphs(
            rules,
            [
                { parent: 'visibility_modifier', child: 'pub_self' },
                { parent: 'visibility_modifier', child: 'pub_super' },
            ],
            derivations,
        )
        // Parent rule stays as a choice (not replaced by flat polymorph).
        expect(rules['visibility_modifier']!.type).toBe('choice')
        // Each variant-child hidden rule now has its body wrapped in the
        // ambient `(` / `)` literals that used to flank the inner choice.
        const selfBody = rules['_visibility_modifier_pub_self']!
        expect(selfBody.type).toBe('seq')
        if (selfBody.type !== 'seq') throw new Error('unreachable')
        expect(selfBody.members.map(m => m.type === 'string' ? m.value : m.type))
            .toEqual(['(', 'symbol', ')'])
        const superBody = rules['_visibility_modifier_pub_super']!
        expect(superBody.type).toBe('seq')
        // Variant-child derivations emitted for downstream use.
        const derivedKinds = derivations.promotedRules
            .filter(p => p.kind === 'visibility_modifier_pub_self' || p.kind === 'visibility_modifier_pub_super')
            .map(p => p.kind)
            .sort()
        expect(derivedKinds).toEqual(['visibility_modifier_pub_self', 'visibility_modifier_pub_super'])
    })

    it('applyOverridePolymorphs replaces rule when registered variant children DO match found choice', () => {
        // Positive case mirroring python's `assignment` shape — the choice
        // IS at the top level after `tagVariants` strips its variant wraps,
        // and each member is `symbol(${parent}_${child})`. Expect the rule
        // to be replaced with a PolymorphRule(source='override').
        const raw = makeRaw({
            assignment: {
                type: 'choice',
                members: [
                    { type: 'symbol', name: 'assignment_eq' },
                    { type: 'symbol', name: 'assignment_type' },
                ],
            },
            assignment_eq: { type: 'seq', members: [
                { type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
                { type: 'string', value: '=' },
                { type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
            ] },
            assignment_type: { type: 'seq', members: [
                { type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
                { type: 'string', value: ':' },
                { type: 'field', name: 'typ', content: { type: 'symbol', name: 'expr' } },
            ] },
            expr: { type: 'pattern', value: '.*' },
        }, {
            polymorphVariants: [
                { parent: 'assignment', child: 'eq' },
                { parent: 'assignment', child: 'type' },
            ],
        })
        const linked = link(raw)
        expect(linked.rules['assignment']!.type).toBe('polymorph')
        const poly = linked.rules['assignment'] as { type: 'polymorph'; forms: { name: string }[]; source: string }
        expect(poly.source).toBe('override')
        expect(poly.forms.map(f => f.name).sort()).toEqual(['eq', 'type'])
    })

    it('applyOverridePolymorphs lifts field positions into forms when outer rule is choice(seq(field, inner_choice), symbol)', () => {
        // range_pattern-shaped case: outer rule is
        //   choice(
        //     seq(field('left', expr), inner_choice(
        //       symbol('range_pattern_left_with_right'),
        //       symbol('range_pattern_left_bare'),
        //     )),
        //     symbol('range_pattern_prefix'),
        //   )
        // The field('left') from arm 0's seq must be lifted into the
        // left_with_right and left_bare form content so the rendered
        // template includes $left for those forms.
        const leftField: Rule = {
            type: 'field',
            name: 'left',
            content: { type: 'symbol', name: 'expr' },
        }
        const innerChoice: Rule = {
            type: 'choice',
            members: [
                { type: 'symbol', name: 'range_pattern_left_with_right' },
                { type: 'symbol', name: 'range_pattern_left_bare' },
            ],
        }
        const rules: Record<string, Rule> = {
            range_pattern: {
                type: 'choice',
                members: [
                    { type: 'seq', members: [leftField, innerChoice] },
                    { type: 'symbol', name: 'range_pattern_prefix' },
                ],
            },
            range_pattern_left_with_right: {
                type: 'seq',
                members: [
                    { type: 'string', value: '..=' },
                    { type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
                ],
            },
            range_pattern_left_bare: { type: 'string', value: '..' },
            range_pattern_prefix: {
                type: 'seq',
                members: [
                    { type: 'string', value: '..' },
                    { type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
                ],
            },
            expr: { type: 'pattern', value: '[0-9]+' },
        }
        const derivations: DerivationLog = { inferredFields: [], promotedRules: [], repeatedShapes: [] }
        applyOverridePolymorphs(
            rules,
            [
                { parent: 'range_pattern', child: 'left_with_right' },
                { parent: 'range_pattern', child: 'left_bare' },
                { parent: 'range_pattern', child: 'prefix' },
            ],
            derivations,
        )

        // Rule IS replaced — outer choice had 'prefix' as a direct member.
        expect(rules['range_pattern']!.type).toBe('polymorph')
        const poly = rules['range_pattern'] as { type: 'polymorph'; forms: { name: string; content: Rule }[]; source: string }
        expect(poly.source).toBe('override')
        expect(poly.forms.map(f => f.name).sort()).toEqual(['left_bare', 'left_with_right', 'prefix'])

        // 'prefix' was a direct member — form content is bare symbol.
        const prefixForm = poly.forms.find(f => f.name === 'prefix')!
        expect(prefixForm.content.type).toBe('symbol')
        expect((prefixForm.content as any).name).toBe('range_pattern_prefix')

        // 'left_with_right' was NESTED — form content must be a seq that
        // preserves field('left') alongside the variant symbol.
        const lwrForm = poly.forms.find(f => f.name === 'left_with_right')!
        expect(lwrForm.content.type).toBe('seq')
        const lwrSeq = lwrForm.content as { type: 'seq'; members: Rule[] }
        expect(lwrSeq.members).toHaveLength(2)
        expect(lwrSeq.members[0]!.type).toBe('field')
        expect((lwrSeq.members[0] as any).name).toBe('left')
        expect(lwrSeq.members[1]!.type).toBe('symbol')
        expect((lwrSeq.members[1] as any).name).toBe('range_pattern_left_with_right')

        // 'left_bare' — same outer-seq shape, different inner symbol.
        const lbForm = poly.forms.find(f => f.name === 'left_bare')!
        expect(lbForm.content.type).toBe('seq')
        const lbSeq = lbForm.content as { type: 'seq'; members: Rule[] }
        expect(lbSeq.members[0]!.type).toBe('field')
        expect((lbSeq.members[0] as any).name).toBe('left')
        expect(lbSeq.members[1]!.type).toBe('symbol')
        expect((lbSeq.members[1] as any).name).toBe('range_pattern_left_bare')
    })

    it('homogeneous-field choices stay as raw choice (not polymorph)', () => {
        // Two branches, both with a single `value` field — same field set
        // → not a polymorph. Post-spec-013 Link doesn't auto-wrap them
        // in `variant(...)`; the downstream simplify `mergeChoiceBranches`
        // pass handles same-shape branches by collapsing them into a
        // flat seq with per-position unioned contents.
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
        expect(literal.type).toBe('choice')
        // No variant wrappers — branches travel as bare seqs through Link.
        expect(literal.members.every((m: any) => m.type === 'seq')).toBe(true)
    })
})
