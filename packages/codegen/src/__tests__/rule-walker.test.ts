/**
 * Regression tests for `renderRuleTemplate` (the template walker in
 * compiler/rule.ts). The walker has accumulated several edge-case fixes
 * on branch 005-five-phase-compiler with no dedicated coverage:
 *
 *   a106f34 — multi-valued fields + per-slot joinBy
 *   606b646 — synthetic outer-field wrappers
 *   (uncommitted) — choice-branch literal leakage
 *
 * Each test builds a minimal Rule tree, calls `renderRuleTemplate`, and
 * asserts on the returned `template` / `joinByField` / `clauses`. These
 * pin today's behaviour so future template-quality work can refactor
 * with a narrow regression guard instead of waiting on the slow corpus
 * validator to flag a coverage drop.
 */

import { describe, it, expect } from 'vitest'
import type { Rule } from '../compiler/rule.ts'
import { renderRuleTemplate, findRepeatFlag } from '../compiler/template-walker.ts'

// ---------------------------------------------------------------------------
// Tiny Rule-tree builders — keep tests readable.
// ---------------------------------------------------------------------------

const str = (value: string): Rule => ({ type: 'string', value })
const sym = (name: string): Rule => ({ type: 'symbol', name })
const sup = (name: string): Rule => ({ type: 'supertype', name, subtypes: [] })
const field = (name: string, content: Rule): Rule => ({ type: 'field', name, content })
const seq = (...members: Rule[]): Rule => ({ type: 'seq', members })
const choice = (...members: Rule[]): Rule => ({ type: 'choice', members })
const optional = (content: Rule): Rule => ({ type: 'optional', content })
const repeat = (content: Rule, separator?: string): Rule =>
    ({ type: 'repeat', content, separator })
const repeat1 = (content: Rule, separator?: string): Rule =>
    ({ type: 'repeat1', content, separator })
const aliasRule = (content: Rule, named: boolean, value: string): Rule =>
    ({ type: 'alias', content, named, value })

// ---------------------------------------------------------------------------
// Baselines
// ---------------------------------------------------------------------------

describe('renderRuleTemplate — baselines', () => {
    it('wraps a single field as $NAME', () => {
        const r = field('name', sym('identifier'))
        const { template, joinByField, clauses } = renderRuleTemplate(r)
        expect(template).toBe('$NAME')
        expect(joinByField).toEqual({})
        expect(clauses).toEqual({})
    })

    it('emits string literals outside repeats verbatim', () => {
        const r = seq(str('pub'), field('name', sym('identifier')))
        expect(renderRuleTemplate(r).template).toBe('pub $NAME')
    })

    it('supertype symbols render as $$$CHILDREN', () => {
        const r = sup('_expression')
        expect(renderRuleTemplate(r).template).toBe('$$$CHILDREN')
    })

    it('visible symbols fall through to $$$CHILDREN once', () => {
        const r = seq(sym('expression'), sym('statement'))
        // Only one $$$CHILDREN: the walker shares a single `children`
        // slot between un-fielded symbol references.
        expect(renderRuleTemplate(r).template).toBe('$$$CHILDREN')
    })

    it('optional pure-punctuation emits nothing — round-tripped via $$$CHILDREN', () => {
        // Updated in 016/walker-refactor-3: the synthesized
        // `<punct>_clause` companion variable is gone (per the
        // no-walker-synthesized-clauses directive). The standalone
        // optional-punct case can't be predicated on a Jinja-legal
        // identifier (the renderer keys `node.$fields` by the literal
        // text, but Jinja vars can't include `,`/`!`/`?`), so the
        // walker emits nothing here. Anon-comma round-trip flows
        // through `$$$CHILDREN` (or the parent's text-shape fallback)
        // for kinds that surface it as a child. Standalone optional-
        // punct round-trip remains a known gap (see specs/016 walker
        // plan).
        const r = seq(sym('expression'), optional(str(',')), str(':'))
        const result = renderRuleTemplate(r)
        expect(result.template).toBe('$$$CHILDREN:')
        expect(result.clauses).toEqual({})
    })
})

// ---------------------------------------------------------------------------
// a106f34 — multi-valued fields + per-slot joinBy
// ---------------------------------------------------------------------------

describe('renderRuleTemplate — multi-valued fields (a106f34)', () => {
    it('field whose content wraps a repeat emits $$$NAME', () => {
        // override pattern: field('items', repeat1(expr))
        const r = field('items', repeat1(sym('expression')))
        const result = renderRuleTemplate(r)
        expect(result.template).toBe('$$$ITEMS')
        // Default separator for bare repeats is '\n'.
        expect(result.joinByField.items).toBe('\n')
    })

    it('wrapped repeat with explicit separator populates joinByField', () => {
        const r = field('rest', repeat(sym('expression'), ','))
        const { joinByField } = renderRuleTemplate(r)
        expect(joinByField.rest).toBe(',')
    })

    it('two sibling multi-valued fields get distinct joinBy entries', () => {
        // rust tuple_expression: attributes join by newline, rest by comma.
        const r = seq(
            field('attributes', repeat(sym('attribute'), '\n')),
            field('rest', repeat(sym('expression'), ',')),
        )
        const { template, joinByField } = renderRuleTemplate(r)
        expect(template).toContain('$$$ATTRIBUTES')
        expect(template).toContain('$$$REST')
        expect(joinByField.attributes).toBe('\n')
        expect(joinByField.rest).toBe(',')
    })

    it('sibling duplicate field refs share one $$$NAME slot with joinBy', () => {
        // inferFields pattern: two refs tagged with the same field name.
        const r = seq(
            field('pattern', sym('_pattern')),
            str('|'),
            field('pattern', sym('_pattern')),
        )
        const { template, joinByField } = renderRuleTemplate(r)
        // Only ONE $$$PATTERN slot — the duplicate is absorbed and the
        // '|' between them becomes the per-slot joinBy.
        expect(template).toBe('$$$PATTERN')
        expect(joinByField.pattern).toBe('|')
    })

    it('sibling duplicate symbol refs share $$$CHILDREN with joinBy', () => {
        // rust or_pattern shape without the field wrapping.
        const r = seq(sym('_pattern'), str('|'), sym('_pattern'))
        const { template, joinByField } = renderRuleTemplate(r)
        expect(template).toBe('$$$CHILDREN')
        expect(joinByField.children).toBe('|')
    })
})

// ---------------------------------------------------------------------------
// 606b646 — synthetic outer-field wrappers
// ---------------------------------------------------------------------------

describe('renderRuleTemplate — synthetic outer-field wrappers (606b646)', () => {
    it('walks INTO a field whose content is a seq containing inner fields', () => {
        // Autogen override: field('outer', seq(field('name', sym), field('value', sym)))
        // The outer field is synthetic — no runtime node corresponds to it —
        // so the walker descends and emits the inner slots directly.
        const r = field('outer', seq(
            field('name', sym('identifier')),
            str('='),
            field('value', sym('expression')),
        ))
        const { template } = renderRuleTemplate(r)
        // needsSpace only inserts spaces between word-like chars, so `=`
        // doesn't get flanking spaces in the template. The renderer adds
        // them at format time if needed.
        expect(template).toBe('$NAME=$VALUE')
        // The outer slot must NOT appear — it has no runtime representation.
        expect(template).not.toContain('$OUTER')
    })

    it('does not walk into a field whose content is a bare symbol', () => {
        // Not synthetic — one real field wrapping one real value.
        const r = field('name', sym('identifier'))
        expect(renderRuleTemplate(r).template).toBe('$NAME')
    })

    it('extractFlankingLiterals lifts trailing comma out of the field', () => {
        // rust tuple_expression override: field('first', seq(_expression, ',')).
        // The comma is lifted so `$FIRST,` survives instead of `$FIRST`.
        // NOTE: this seq is NOT synthetic (no inner fields), so flanking
        // extraction kicks in instead of the walk-into path.
        const r = field('first', seq(sym('_expression'), str(',')))
        const { template } = renderRuleTemplate(r)
        expect(template).toBe('$FIRST,')
    })
})

// ---------------------------------------------------------------------------
// Choice branch literal leakage (uncommitted fix)
// ---------------------------------------------------------------------------

describe('renderRuleTemplate — choice branch diagnostic', () => {
    it('heterogeneous branches with different literal prefixes fall back to primary (diagnostic surfaces under SITTIR_DEBUG)', () => {
        // Ideal fix is `variant()` adoption per arm. Absent that,
        // walker logs a diagnostic and picks the first non-empty
        // branch — drops the 'while' keyword from branch 1.
        const r = choice(
            seq(str('if'), field('cond', sym('expression'))),
            seq(str('while'), field('body', sym('block'))),
        )
        const { template } = renderRuleTemplate(r)
        expect(template).toContain('if')
        expect(template).not.toContain('while')
        expect(template).toContain('$COND')
        expect(template).toContain('$BODY')
    })

    it('bare-symbol branch + field-bearing branch falls back to declaration order', () => {
        // visibility_modifier-shaped heterogeneity: first-branch pick
        // emits $$$CHILDREN$PUB, which is structurally wrong for
        // rendering but is the pre-Option-3 baseline the walker has
        // always used. Visible in the diagnostic so authors know to
        // variant()-adopt.
        const r = choice(
            sym('crate'),
            seq(
                field('pub', sym('_kw_pub')),
                optional(choice(sym('self'), sym('super'))),
            ),
        )
        const { template } = renderRuleTemplate(r)
        expect(template).toContain('$$$CHILDREN')
        expect(template).toContain('$PUB')
    })

    it('homogeneous branches collapse silently — choice of bare symbols', () => {
        // All three branches walk to $$$CHILDREN — identical parts, safe
        // to collapse to a single template.
        const r = choice(sym('a'), sym('b'), sym('c'))
        expect(renderRuleTemplate(r).template).toBe('$$$CHILDREN')
    })

    it('homogeneous branches collapse — matched field placeholders', () => {
        // Both branches emit $X (same field name, same shape). Single
        // template covers both parse shapes.
        const r = choice(field('x', sym('a')), field('x', sym('b')))
        expect(renderRuleTemplate(r).template).toBe('$X')
    })

    it('function_modifiers-shaped: different field names, no literal differences → merges all $-placeholders', () => {
        // rust function_modifiers: `choice(field('async', _kw_async),
        // field('const', _kw_const), field('unsafe', _kw_unsafe))`.
        // All branches have empty literal signatures (only field
        // placeholders) — walker merges them into one template with
        // all slots. Absent fields render empty; space absorption
        // handles the whitespace.
        const r = choice(
            field('async', sym('_kw_async')),
            field('const', sym('_kw_const')),
            field('unsafe', sym('_kw_unsafe')),
        )
        const { template } = renderRuleTemplate(r)
        expect(template).toContain('$ASYNC')
        expect(template).toContain('$CONST')
        expect(template).toContain('$UNSAFE')
    })
})

// ---------------------------------------------------------------------------
// Hidden helper inlining
// ---------------------------------------------------------------------------

describe('renderRuleTemplate — hidden helper inlining', () => {
    it('walks into a hidden `_helper` symbol when rules map is supplied', () => {
        // The walker mirrors tree-sitter's parse-time inlining of hidden
        // rules — their content surfaces under the parent.
        const rules: Record<string, Rule> = {
            _header: seq(str('#'), field('title', sym('identifier'))),
        }
        const r = seq(sym('_header'), field('body', sym('expression')))
        // No space after `#` because `#` is not word-like.
        expect(renderRuleTemplate(r, false, rules).template).toBe('#$TITLE $BODY')
    })

    it('ignores hidden helper with no matching rule (fallback to $$$CHILDREN)', () => {
        const r = sym('_missing')
        expect(renderRuleTemplate(r, false, {}).template).toBe('$$$CHILDREN')
    })

    it('self-recursive hidden helper does not duplicate separator literals', () => {
        // rust `_let_chain`: choice(seq(_let_chain, '&&', let_condition), ...)
        // A self-recursive hidden helper is a left-recursive list pattern.
        // The walker must NOT recursively inline its body — doing so
        // doubles the separator ('&&' from the inline + '&&' from the
        // caller's own seq → `&&&&`). Treat as opaque `$$$CHILDREN`.
        const rules: Record<string, Rule> = {
            _let_chain: choice(
                seq(sym('_let_chain'), str('&&'), sym('let_condition')),
                seq(sym('let_condition'), str('&&'), sym('let_condition')),
            ),
        }
        const r = seq(sym('_let_chain'), str('&&'), sym('let_condition'))
        const { template } = renderRuleTemplate(r, false, rules)
        // Exactly one '&&' in the template (or zero — joinBy handles it).
        // The regression was `$$$CHILDREN&&&&`.
        expect(template).not.toContain('&&&&')
    })

    it('pattern literal matching adjacent seq string is not duplicated', () => {
        // rust `line_comment`: seq('//', choice(seq(pattern('//'), pattern('.*')), ...))
        // The inner pattern `\\/\\/` resolves to the literal `//` via
        // representativeLiteral, but it's a lookahead disambiguator — not
        // a renderable token. Emitting it duplicates the outer `//`,
        // producing `////`. Drop choice-branch primary when its literal
        // duplicates an adjacent seq string.
        const r = seq(
            str('//'),
            choice(
                seq({ type: 'pattern', value: '\\/\\/' } as Rule, { type: 'pattern', value: '.*' } as Rule),
                seq(field('outer', str('/')), field('doc', sym('text'))),
            ),
        )
        const { template } = renderRuleTemplate(r)
        expect(template).not.toContain('////')
        expect(template).toContain('$OUTER')
        expect(template).toContain('$DOC')
    })
})

// ---------------------------------------------------------------------------
// Repeat semantics
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Alias dispatch — variant()-adopted choice members surface as visible
// parse-tree kinds; the walker must treat them as named children.
// ---------------------------------------------------------------------------

describe('renderRuleTemplate — alias rules', () => {
    it('named alias emits $$$CHILDREN like a visible symbol', () => {
        // `alias($._hidden, $.visible)` — tree-sitter surfaces a visible
        // kind at parse time. Walker must render it as a named child slot.
        const r = aliasRule(sym('_visibility_modifier_pub_crate'), true, 'visibility_modifier_pub_crate')
        expect(renderRuleTemplate(r).template).toBe('$$$CHILDREN')
    })

    it('named alias inside a choice contributes to $$$CHILDREN', () => {
        // visibility_modifier-shaped inner choice after variant() adoption.
        const r = choice(
            aliasRule(sym('_vm_pub_self'), true, 'vm_pub_self'),
            aliasRule(sym('_vm_pub_super'), true, 'vm_pub_super'),
        )
        expect(renderRuleTemplate(r).template).toBe('$$$CHILDREN')
    })

    it('named alias inside seq preserves ambient literals', () => {
        // `pub(inner_alias)` shape — ambient `(`/`)` must survive so the
        // parent template doesn't collapse to just `$$$CHILDREN`.
        const r = seq(
            str('('),
            aliasRule(sym('_inner'), true, 'visible_inner'),
            str(')'),
        )
        expect(renderRuleTemplate(r).template).toBe('($$$CHILDREN)')
    })

    it('unnamed alias walks into its content (relabel only)', () => {
        // `alias($.x, 'display_name')` with named=false — no new parse-tree
        // kind is introduced; content dictates the template slot.
        const r = aliasRule(str('literal'), false, 'display_name')
        expect(renderRuleTemplate(r).template).toBe('literal')
    })
})

describe('renderRuleTemplate — repeats', () => {
    it('string members inside a repeat do not leak into the template', () => {
        // joinBy handles the separator at render time.
        const r = repeat1(seq(sym('expression'), str(',')))
        const { template } = renderRuleTemplate(r)
        // No literal comma in the template output.
        expect(template).not.toContain(',')
        expect(template).toBe('$$$CHILDREN')
    })

    it('fields nested inside a repeat emit as $$$NAME', () => {
        const r = repeat1(field('item', sym('expression')))
        const { template } = renderRuleTemplate(r)
        expect(template).toBe('$$$ITEM')
    })
})

describe('findRepeatFlag', () => {
    // Direct unit coverage for the metadata walker that feeds the
    // joinByTrailing / joinByLeading template hints. Previously only
    // observable via templates.yaml diffs — a refactor that breaks
    // the nested-wrapper traversal would silently drop the hint.
    const repeatWith = (extras: Partial<Rule>): Rule =>
        ({ type: 'repeat', content: sym('X'), separator: ',', ...extras }) as Rule

    it('returns true for `repeat.trailing = true`', () => {
        expect(findRepeatFlag(repeatWith({ trailing: true }), 'trailing')).toBe(true)
        expect(findRepeatFlag(repeatWith({ trailing: true }), 'leading')).toBe(false)
    })

    it('returns true for `repeat.leading = true`', () => {
        expect(findRepeatFlag(repeatWith({ leading: true }), 'leading')).toBe(true)
        expect(findRepeatFlag(repeatWith({ leading: true }), 'trailing')).toBe(false)
    })

    it('returns false for plain repeat with no flag', () => {
        expect(findRepeatFlag(repeatWith({}), 'trailing')).toBe(false)
        expect(findRepeatFlag(repeatWith({}), 'leading')).toBe(false)
    })

    it('descends through seq / choice / optional / field wrappers', () => {
        const trailingRepeat = repeatWith({ trailing: true })
        const shape = field('list', optional(seq(str('['), trailingRepeat, str(']'))))
        expect(findRepeatFlag(shape, 'trailing')).toBe(true)
        const choiceShape = choice(sym('other'), trailingRepeat)
        expect(findRepeatFlag(choiceShape, 'trailing')).toBe(true)
    })

    it('returns false when no repeat is reachable', () => {
        const shape = seq(str('('), sym('X'), str(')'))
        expect(findRepeatFlag(shape, 'trailing')).toBe(false)
        expect(findRepeatFlag(shape, 'leading')).toBe(false)
    })
})
