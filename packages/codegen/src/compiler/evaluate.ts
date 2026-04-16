/**
 * compiler/evaluate.ts — Phase 1: Evaluate
 *
 * Executes grammar.js DSL and produces a RawGrammar.
 * When overrides.ts exists, it uses tree-sitter's native grammar(base, { rules })
 * extension mechanism — each rule fn receives ($, original).
 */

import { readFileSync } from 'node:fs'
import type {
    Rule, SeqRule, ChoiceRule, OptionalRule, RepeatRule, Repeat1Rule,
    FieldRule, TokenRule, StringRule, PatternRule, SymbolRule, AliasRule,
    EnumRule, SymbolRef, RawGrammar, ExternalRole,
} from './rule.ts'
import { withRoleScope } from '../dsl/role.ts'
import { withSyntheticRuleScope, setCurrentRuleKind, drainPolymorphVariants } from '../dsl/synthetic-rules.ts'

// ---------------------------------------------------------------------------
// Input type — anything the DSL functions accept
// ---------------------------------------------------------------------------

type Input = string | RegExp | Rule

// Augmented SymbolRule that carries a ref for in-place enrichment
interface SymbolRuleWithRef extends SymbolRule {
    readonly _ref?: SymbolRef
}

// ---------------------------------------------------------------------------
// normalize — convert raw input to a Rule
// ---------------------------------------------------------------------------

export function normalize(input: Input): Rule {
    if (input === undefined || input === null) {
        throw new Error('Undefined symbol')
    }

    if (typeof input === 'string') {
        return { type: 'string', value: input } satisfies StringRule
    }

    if (input instanceof RegExp) {
        return { type: 'pattern', value: input.source } satisfies PatternRule
    }

    if (typeof input === 'object' && 'type' in input) {
        return input as Rule
    }

    throw new TypeError(`Invalid rule: ${input}`)
}

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

export function seq(...members: Input[]): Rule {
    const normalized = members.map(normalize)

    // Single-member seq([x]) collapses to x — a one-element seq has
    // the same parse semantics as its sole member but the extra layer
    // confuses walkers that count seq members for positional hints.
    if (normalized.length === 1) return normalized[0]!

    // commaSep1 patterns:
    //
    //   seq(x, repeat(seq(sep, x)))                     → repeat1 + sep
    //   seq(x, repeat(seq(sep, x)), optional(sep))      → repeat1 + sep + trailing
    //   seq(sep, x, repeat(seq(sep, x)))                → repeat1 + sep + leading
    //
    // The `repeat` form is the one `repeat()` already normalizes to
    // `{content: x, separator: sep}`, so we look for an inner shape
    // of `repeat(x, separator=sep)` whose element type matches the
    // outer seq's first/last element. Collapsing here gives downstream
    // passes a single `repeat1` node with a clean separator marker,
    // instead of five to six nested rules they have to pattern-match.
    const lifted = liftCommaSep(normalized)
    if (lifted) return lifted

    // Trailing-sep absorption for delimited commaSep patterns:
    //
    //   seq('(', sepBy1(sep, x), optional(sep), ')')
    //       where sepBy1 has already been lifted to `repeat1(x, sep)`
    //
    // The liftCommaSep pass above refuses 4+ member seqs because it
    // needs to match the canonical sepBy1 shape exactly. But once the
    // inner lift has run, the outer seq is `[..., repeat1(x, sep),
    // optional(sep), ...]` and the trailing-sep optional is redundant
    // — tree-sitter's repeat1 with `trailing: true` accepts it. Fold
    // the optional into the repeat1 node so the outer seq loses one
    // member and no phantom `optional(',')` survives into simplifyRule.
    const absorbed = absorbTrailingSeparator(normalized)
    if (absorbed) return { type: 'seq', members: absorbed }

    return { type: 'seq', members: normalized }
}

/**
 * Look for adjacent `repeat`/`repeat1` (with separator) + `optional(sepLit)`
 * pairs inside a seq and merge the trailing-sep optional into the
 * repeat by stamping `trailing: true` on it. Returns the new member
 * array if any absorption happened, else `null`.
 */
function absorbTrailingSeparator(members: Rule[]): Rule[] | null {
    let changed = false
    const out: Rule[] = []
    for (let i = 0; i < members.length; i++) {
        const cur = members[i]!
        const next = members[i + 1]
        const isSepRepeat =
            (cur.type === 'repeat' || cur.type === 'repeat1')
            && cur.separator !== undefined
            && !cur.trailing
        const isOptionalSepLit = (r: Rule | undefined, sep: string): boolean =>
            !!r
            && r.type === 'optional'
            && r.content.type === 'string'
            && r.content.value === sep
        if (isSepRepeat && isOptionalSepLit(next, (cur as RepeatRule | Repeat1Rule).separator!)) {
            // Merge — stamp trailing on the repeat and skip the next member.
            const sepRule = cur as RepeatRule | Repeat1Rule
            out.push({ ...sepRule, trailing: true })
            i++
            changed = true
            continue
        }
        out.push(cur)
    }
    return changed ? out : null
}

/**
 * Detect the `commaSep1` family inside a normalized seq body and lift
 * it to a single `repeat1` node with `separator` plus optional
 * `leading` / `trailing` markers. Returns `null` if no lift applies.
 *
 * Relies on `repeat(seq(sep, x))` already having been normalized to
 * `repeat(x, separator=sep)` by the `repeat()` helper.
 */
function liftCommaSep(members: Rule[]): Rule | null {
    if (members.length < 2 || members.length > 3) return null

    // Locate the repeat-with-separator member. It's the only
    // repeat-node in the group; if we find zero or more than one,
    // this isn't a commaSep shape.
    const repeatIdx = members.findIndex(m => m.type === 'repeat' && m.separator !== undefined)
    if (repeatIdx === -1) return null
    const repeatNode = members[repeatIdx] as RepeatRule
    const sep = repeatNode.separator!
    const elem = repeatNode.content

    // Element agreement — the seq's leading/trailing element must
    // match the repeat's content so the whole group really is "one or
    // more `elem` separated by `sep`".
    const matchesElem = (r: Rule): boolean => rulesEqual(r, elem)
    const matchesOptionalSep = (r: Rule): boolean =>
        r.type === 'optional' && r.content.type === 'string' && r.content.value === sep

    // Case 1: [x, repeat(sep, x)]
    if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
        return { type: 'repeat1', content: elem, separator: sep }
    }

    // Case 2: [x, repeat(sep, x), optional(sep)] — trailing allowed.
    if (
        members.length === 3
        && repeatIdx === 1
        && matchesElem(members[0]!)
        && matchesOptionalSep(members[2]!)
    ) {
        return { type: 'repeat1', content: elem, separator: sep, trailing: true }
    }

    // Case 3: [sep, x, repeat(sep, x)] — leading separator.
    if (
        members.length === 3
        && repeatIdx === 2
        && members[0]!.type === 'string'
        && members[0]!.value === sep
        && matchesElem(members[1]!)
    ) {
        return { type: 'repeat1', content: elem, separator: sep, leading: true }
    }

    return null
}

/**
 * Structural equality for rule trees — used by the commaSep1 lift to
 * verify the seq's standalone element matches the repeat's content.
 * Intentionally limited to the subset of rule shapes evaluate can
 * produce at DSL-call time (no polymorph/supertype/terminal — those
 * appear only after Link).
 */
function rulesEqual(a: Rule, b: Rule): boolean {
    if (a.type !== b.type) return false
    switch (a.type) {
        case 'string':
            return a.value === (b as StringRule).value
        case 'pattern':
            return a.value === (b as PatternRule).value
        case 'symbol':
            return a.name === (b as SymbolRule).name
        case 'enum':
            return JSON.stringify(a.values) === JSON.stringify((b as EnumRule).values)
        case 'seq':
            return a.members.length === (b as SeqRule).members.length
                && a.members.every((m, i) => rulesEqual(m, (b as SeqRule).members[i]!))
        case 'choice':
            return a.members.length === (b as ChoiceRule).members.length
                && a.members.every((m, i) => rulesEqual(m, (b as ChoiceRule).members[i]!))
        case 'optional':
            return rulesEqual(a.content, (b as OptionalRule).content)
        case 'repeat':
            return a.separator === (b as RepeatRule).separator
                && rulesEqual(a.content, (b as RepeatRule).content)
        case 'repeat1':
            return a.separator === (b as Repeat1Rule).separator
                && rulesEqual(a.content, (b as Repeat1Rule).content)
        case 'field':
            return a.name === (b as FieldRule).name && rulesEqual(a.content, (b as FieldRule).content)
        default:
            return false
    }
}

export function choice(...members: Input[]): Rule {
    const normalized = members.map(normalize)

    // Single-member choice([x]) collapses to x for the same reason
    // single-member seq does — the wrapper has no parse semantics.
    if (normalized.length === 1) return normalized[0]!

    // Detect `choice(x, blank)` shape and lower to `optional(x)`.
    // Tree-sitter grammars encode `blank()` two ways that both reach
    // here: as an empty `seq` (historical form still used by some
    // grammars) or as an empty `choice` (what our own `blank()`
    // helper returns on line ~626). Either shape marks "this branch
    // matches nothing", so the outer choice is really "x or nothing"
    // = `optional(x)`. Collapsing at DSL time means walkers only
    // ever see the optional shape, not both.
    const isBlank = (r: Rule): boolean =>
        (r.type === 'seq' && r.members.length === 0)
        || (r.type === 'choice' && r.members.length === 0)
    const blankIdx = normalized.findIndex(isBlank)
    if (blankIdx !== -1 && normalized.length === 2) {
        const other = normalized[1 - blankIdx]!
        // Recurse through optional() so `optional(optional(x))` keeps
        // collapsing per rule #5.
        return optional(other)
    }

    // Detect all-string choice → EnumRule
    if (normalized.length > 0 && normalized.every(m => m.type === 'string')) {
        return {
            type: 'enum',
            values: normalized.map(m => (m as StringRule).value),
            source: 'grammar',
        }
    }

    // Detect all-field choice. Two sub-cases:
    //
    //   1. All branches wrap the SAME field name (e.g.
    //      `choice(field('x', 'a'), field('x', 'z'))`) — factor the
    //      field outward to `field('x', choice('a', 'z'))`. The choice
    //      content may itself simplify to an enum when all inners are
    //      strings.
    //
    //   2. All branches have DIFFERENT field names (e.g.
    //      `choice(field('x', ...), field('y', ...))`) — retype each
    //      field node as a variant node. `FieldRule` and `VariantRule`
    //      share the same shape (`name` + `content`), so the rewrite
    //      is purely a discriminator change; the content is reused
    //      in place. This is the encoding overrides.ts uses for
    //      polymorphs: the author writes
    //      `choice(field('body', seq(...)), field('semi', seq(...)))`
    //      and evaluate retypes it to
    //      `choice(variant('body', seq(...)), variant('semi', seq(...)))`.
    //      Link's `promotePolymorph` pass already recognizes that
    //      shape at the top level and wraps the whole rule in a
    //      `PolymorphRule`; nested placement stays a plain
    //      choice-of-variants.
    //
    // Mixed branches (some fields, some not) fall through to the raw
    // choice — no clean single interpretation.
    if (normalized.length >= 2 && normalized.every(m => m.type === 'field')) {
        const fieldMembers = normalized as FieldRule[]
        // Skip tagging when any branch wraps an alias directly —
        // aliases are structural rename markers and downstream passes
        // (Link, assemble) depend on the alias appearing inside a
        // plain choice to route the synthetic kind into the NodeMap.
        // Tagging as a variant shifts classification and leaves the
        // alias target unregistered (observed on rust
        // `_line_doc_comment_marker` / `_block_doc_comment_marker`).
        const anyAlias = fieldMembers.some(f => f.content.type === 'alias')
        if (anyAlias) {
            return { type: 'choice', members: normalized }
        }
        const names = fieldMembers.map(f => f.name)
        const allSameName = names.every(n => n === names[0])
        if (allSameName) {
            // Factor: choice(field(x, A), field(x, B)) → field(x, choice(A, B))
            const inner = choice(...fieldMembers.map(f => f.content))
            return {
                type: 'field',
                name: names[0]!,
                content: inner,
                source: 'grammar',
            }
        }
        // Heterogeneous names → retype each field node as a variant
        // node. Same `name`, same `content`, only the discriminator
        // changes. Downstream (Link's `promotePolymorph`, walker,
        // assemble) consumes variants as polymorph-form markers when
        // they appear at the top level.
        const retyped: Rule[] = fieldMembers.map(f => ({
            type: 'variant' as const,
            name: f.name,
            content: f.content,
        }))
        return { type: 'choice', members: retyped }
    }

    return { type: 'choice', members: normalized }
}

export function optional(content: Input): Rule {
    const resolved = normalize(content)
    walkRefs(resolved, ref => { ref.optional = true })
    // optional(optional(x)) → optional(x) — two layers of "zero or
    // one" is the same as one layer.
    if (resolved.type === 'optional') return resolved
    // optional(repeat(x)) → repeat(x) and
    // optional(repeat1(x)) → repeat(x). Canonical list rule:
    //   - `repeat` is ALWAYS optional in the config surface
    //     (`items?: T[]`, null-coalesced to `[]` in the factory)
    //     so `optional(repeat(x))` adds no information.
    //   - `optional(repeat1(x))` is parse-identical to `repeat(x)`
    //     because tree-sitter surfaces "optional didn't fire" and
    //     "repeat1 fired with zero items" the same way: an empty
    //     children list under the parent. The non-empty guarantee
    //     a bare `repeat1` carries only holds when there's no
    //     `optional` wrapper to swallow the empty case.
    if (resolved.type === 'repeat') return resolved
    if (resolved.type === 'repeat1') {
        return {
            type: 'repeat',
            content: resolved.content,
            separator: resolved.separator,
            trailing: resolved.trailing,
            leading: resolved.leading,
        }
    }
    return { type: 'optional', content: resolved }
}

/**
 * Detect the `seq(STRING, x)` / `seq(x, STRING)` pattern inside a
 * repeat/repeat1 wrapper and lift the string into a `separator` (and
 * `trailing`) field on the repeat rule. Shared between `repeat` and
 * `repeat1` so both wrappers hoist separators uniformly.
 *
 * Returns `null` if no separator shape is present.
 */
function extractRepeatSeparator(
    resolved: Rule,
): { content: Rule; separator: string; trailing?: boolean } | null {
    if (resolved.type !== 'seq' || resolved.members.length !== 2) return null
    const [first, second] = resolved.members as [Rule, Rule]
    if (first.type === 'string' && second.type !== 'string') {
        return { content: second, separator: first.value }
    }
    if (second.type === 'string' && first.type !== 'string') {
        return { content: first, separator: second.value, trailing: true }
    }
    return null
}

export function repeat(content: Input): Rule {
    const resolved = normalize(content)
    walkRefs(resolved, ref => { ref.repeated = true })
    // repeat(repeat(x)) → repeat(x) when neither layer carries a
    // distinct separator. The outer loop is redundant when the inner
    // already matches zero-or-more.
    if (resolved.type === 'repeat' && !resolved.separator) return resolved
    // repeat(optional(x)) → repeat(x) — repeat already handles zero
    // occurrences, so the optional is redundant.
    if (resolved.type === 'optional') {
        const inner = resolved.content
        walkRefs(inner, ref => { ref.repeated = true })
        const sep = extractRepeatSeparator(inner)
        if (sep) {
            return { type: 'repeat', content: sep.content, separator: sep.separator, trailing: sep.trailing }
        }
        return { type: 'repeat', content: inner }
    }
    const sep = extractRepeatSeparator(resolved)
    if (sep) {
        return { type: 'repeat', content: sep.content, separator: sep.separator, trailing: sep.trailing }
    }
    return { type: 'repeat', content: resolved }
}

export function repeat1(content: Input): Rule {
    const resolved = normalize(content)
    walkRefs(resolved, ref => { ref.repeated = true })
    // repeat1(repeat1(x)) → repeat1(x) — the outer "one or more"
    // of "one or more" accepts the same strings as the inner.
    if (resolved.type === 'repeat1' && !resolved.separator) return resolved
    // NOTE: `repeat1(repeat(x))` is NOT equivalent to `repeat1(x)`.
    // The inner `repeat(x)` can match empty, so `repeat1(repeat(x))`
    // accepts zero-or-more `x` (one outer iteration of zero inner
    // matches), which matches `repeat(x)`'s accepted language — but
    // `repeat1(x)` requires at least one literal `x`. Leave the
    // shape alone; if a grammar author wrote this, they probably
    // intended something and we'd rather preserve it than silently
    // change the accepted language.
    const sep = extractRepeatSeparator(resolved)
    if (sep) {
        return {
            type: 'repeat1',
            content: sep.content,
            separator: sep.separator,
            trailing: sep.trailing,
        }
    }
    return { type: 'repeat1', content: resolved }
}

// ---------------------------------------------------------------------------
// $ proxy — reference tracking
// ---------------------------------------------------------------------------

export function createProxy(currentRule: string, refs: SymbolRef[]): Record<string, SymbolRuleWithRef> {
    return new Proxy({} as Record<string, SymbolRuleWithRef>, {
        get(_target, name: string): SymbolRuleWithRef {
            const ref: SymbolRef = { refType: 'symbol', from: currentRule, to: name }
            refs.push(ref)
            return {
                type: 'symbol' as const,
                name,
                // `hidden` on the symbol ref is a hint for downstream
                // passes only — Link recomputes the authoritative
                // visibility decision via `isHiddenKind()` below,
                // consulting both the leading-underscore convention
                // and tree-sitter's explicit `inline` list.
                hidden: name.startsWith('_'),
                _ref: ref,
            }
        },
    })
}

/**
 * Authoritative "is this kind hidden?" check shared by Link and
 * downstream passes. Tree-sitter treats a rule as hidden when:
 *
 *   (a) its name begins with `_` (convention), OR
 *   (b) its name appears in the grammar's `inline:` array (explicit).
 *
 * Grammars that don't follow the leading-underscore convention can
 * still mark rules hidden via `inline`. Passing `undefined` for
 * `inlineList` falls back to convention-only, which is the safe
 * default when Link doesn't have grammar metadata at hand.
 */
export function isHiddenKind(name: string, inlineList?: readonly string[]): boolean {
    if (name.startsWith('_')) return true
    if (inlineList && inlineList.includes(name)) return true
    return false
}

// ---------------------------------------------------------------------------
// Ref enrichment helpers
// ---------------------------------------------------------------------------

function getRef(rule: Rule): SymbolRef | undefined {
    return (rule as SymbolRuleWithRef)._ref
}

/**
 * Walk a rule tree and call `visit` on every direct symbol reference
 * (`_ref`-bearing SymbolRule), including refs nested inside `seq`,
 * `choice`, `optional`, `repeat`, `repeat1`, and `prec` wrappers.
 *
 * Stops at nested `field` boundaries: a `field('y', $.foo)` inside a
 * `field('x', seq(..., field('y', $.foo)))` keeps its own field name
 * — `x` does not propagate over the inner `field`.
 *
 * Also stops at `alias` boundaries — an alias creates a distinct kind
 * with its own surface, so the inner reference doesn't inherit the
 * outer wrapper's modifiers.
 */
function walkRefs(rule: Rule, visit: (ref: SymbolRef) => void): void {
    const ref = getRef(rule)
    if (ref) visit(ref)
    switch (rule.type) {
        case 'seq':
        case 'choice':
            for (const m of (rule as { members: Rule[] }).members) walkRefs(m, visit)
            return
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'prec' as never: // prec wrappers are stripped by normalize but defensive
            walkRefs((rule as { content: Rule }).content, visit)
            return
        case 'field':
        case 'alias':
            // Stop — inner refs belong to the inner wrapper.
            return
        default:
            return
    }
}

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

export function field(name: string, content?: Input): FieldRule {
    if (content === undefined) {
        // No content — used in transform() patches where the content
        // comes from the original member. `_needsContent` flags this
        // placeholder for `resolvePatch` to swap out.
        return { type: 'field', name, content: { type: 'string', value: '' }, _needsContent: true }
    }
    let resolved = normalize(content)
    // Mirror the bare `optional()` helper's canonical collapse:
    //   field('x', optional(repeat(...)))  → field('x', repeat(...))
    //   field('x', optional(repeat1(...))) → field('x', repeat(...))
    // Both `optional(repeat(x))` and `optional(repeat1(x))` are
    // parse-identical to `repeat(x)` — tree-sitter surfaces any
    // empty case as an empty children list. Collapsing both here
    // keeps evaluate output canonical across all the equivalent
    // list encodings grammar authors write.
    if (resolved.type === 'optional') {
        const inner = resolved.content
        if (inner.type === 'repeat') {
            resolved = inner
        } else if (inner.type === 'repeat1') {
            resolved = {
                type: 'repeat',
                content: inner.content,
                separator: inner.separator,
                trailing: inner.trailing,
                leading: inner.leading,
            }
        }
    }
    // Propagate the field name to every nested symbol ref. Stops at
    // inner field/alias boundaries — those own their own field name.
    // Don't overwrite a field name set by an inner wrapper.
    walkRefs(resolved, ref => {
        if (ref.fieldName === undefined) ref.fieldName = name
    })
    return { type: 'field', name, content: resolved }
}

// ---------------------------------------------------------------------------
// Override primitives — transform/insert/replace/role have moved to
// packages/codegen/src/dsl/. Override files import them explicitly
// from '@sittir/codegen/dsl'. They are no longer injected as globals
// here because they are sittir extensions, not tree-sitter baseline.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

interface TokenFn {
    (content: Input): TokenRule
    immediate: (content: Input) => TokenRule
}

export const token: TokenFn = Object.assign(
    function token(content: Input): TokenRule {
        return { type: 'token', content: normalize(content), immediate: false }
    },
    {
        immediate(content: Input): TokenRule {
            return { type: 'token', content: normalize(content), immediate: true }
        },
    },
)

// ---------------------------------------------------------------------------
// Precedence — stripped; returns the content Rule
// ---------------------------------------------------------------------------

interface PrecFn {
    (precedence: number, content: Input): Rule
    left: (precedence: number, content: Input) => Rule
    right: (precedence: number, content: Input) => Rule
    dynamic: (precedence: number, content: Input) => Rule
}

export const prec: PrecFn = Object.assign(
    function prec(precedenceOrContent: number | Input, content?: Input): Rule {
        if (content === undefined) return normalize(precedenceOrContent as Input)
        return normalize(content)
    },
    {
        left(precedenceOrContent: number | Input, content?: Input): Rule {
            if (content == null) return normalize(precedenceOrContent as Input)
            return normalize(content)
        },
        right(precedenceOrContent: number | Input, content?: Input): Rule {
            if (content == null) return normalize(precedenceOrContent as Input)
            return normalize(content)
        },
        dynamic(precedenceOrContent: number | Input, content?: Input): Rule {
            if (content == null) return normalize(precedenceOrContent as Input)
            return normalize(content)
        },
    },
)

// ---------------------------------------------------------------------------
// Alias + blank (needed for grammar.js compatibility)
// ---------------------------------------------------------------------------

export function alias(rule: Input, value: string | Rule): AliasRule {
    const content = normalize(rule)
    if (typeof value === 'string') {
        return { type: 'alias', content, named: false, value }
    }
    if (typeof value === 'object' && 'type' in value && value.type === 'symbol') {
        return { type: 'alias', content, named: true, value: (value as SymbolRule).name }
    }
    throw new Error(`Invalid alias value: ${value}`)
}

export function blank(): Rule {
    // BLANK is represented as choice() with no members — absorbed by choice()
    return { type: 'choice', members: [] }
}

// ---------------------------------------------------------------------------
// evaluate() — execute grammar.js and produce RawGrammar
// ---------------------------------------------------------------------------

interface GrammarOptions {
    name: string
    // tree-sitter's DSL passes `($, previous)` to every rule / metadata
    // callback — `previous` is the base grammar's version in
    // extension mode. We type the second arg loosely so extension
    // callbacks that forward it (`previous.concat([...])`) compile.
    rules: Record<string, ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input>
    extras?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[]
    externals?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[]
    supertypes?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[]
    inline?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[]
    conflicts?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[][]
    word?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => SymbolRuleWithRef
    precedences?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[][]
}

/**
 * The `grammar()` function — mirrors tree-sitter's DSL entry point.
 * When called with one arg: fresh grammar.
 * When called with two args: grammar extension (base + overrides).
 */
function grammarFn(optionsOrBase: GrammarOptions | { grammar: any }, options?: GrammarOptions): { grammar: any } {
    let baseRules: Record<string, Rule> = {}
    let baseGrammar: any = null
    let opts: GrammarOptions

    if (options === undefined) {
        opts = optionsOrBase as GrammarOptions
    } else {
        // Extension mode: first arg is a base grammar result
        baseGrammar = (optionsOrBase as { grammar: any }).grammar
        baseRules = { ...baseGrammar.rules }
        opts = options
    }

    // Seed the refs array with the base grammar's references so the
    // diagnostic derivations in Link can see the full reference graph,
    // not just the handful of refs introduced by override callbacks.
    // Refs from rules the override REPLACES will be filtered below.
    const refs: SymbolRef[] = baseGrammar?.references
        ? [...baseGrammar.references]
        : []
    const rules: Record<string, Rule> = { ...baseRules }

    // Build the rule name set for proxy validation
    const ruleNames = new Set([
        ...Object.keys(opts.rules || {}),
        ...Object.keys(baseRules),
    ])

    // Extract metadata
    const extras: string[] = []
    const externals: string[] = []
    const supertypes: string[] = []
    const inline: string[] = []
    const conflicts: string[][] = []
    let word: string | null = null

    // Run the entire option-callback evaluation inside a fresh role
    // accumulator scope so any `role()` calls inside externals/rules
    // get attached to THIS grammar invocation. Save/restore in
    // withRoleScope guarantees nested grammar() calls (e.g. via
    // grammar(enrich(base), {...})) stay isolated.
    const { roles: collectedRoles } = withRoleScope(() => {
        const { syntheticRules } = withSyntheticRuleScope(() => {
            // Evaluate each rule function
            for (const [name, ruleFn] of Object.entries(opts.rules)) {
                const $ = createProxy(name, refs)
                const baseRule = baseRules[name]
                setCurrentRuleKind(name)
                const result = ruleFn.call($, $, baseRule)
                setCurrentRuleKind(null)
                rules[name] = normalize(result)
            }
        })

        // Inject synthetic rules created by alias() placeholders in
        // transform patches. These are hidden variant rules for
        // nested-alias polymorphs.
        for (const [name, content] of syntheticRules) {
            rules[name] = content as Rule
        }

        // The rest of the callbacks (extras, externals, supertypes,
        // inline, conflicts, word) stay inside this same role scope so
        // any role() calls in them attach to THIS grammar's accumulator.
        evaluateMetadataCallbacks(opts, baseGrammar, refs, {
            extras, externals, supertypes, inline, conflicts,
        }, (w) => { word = w })
    })

    // Extension inheritance — when extending a base grammar, inherit
    // metadata lists the override didn't explicitly re-declare. Tree-sitter
    // itself inherits externals/extras/supertypes/inline/conflicts/word
    // implicitly; we model the same behavior so downstream phases see the
    // full declaration set instead of an empty list.
    const inherited = baseGrammar?.grammar ?? baseGrammar
    if (inherited) {
        if (!opts.externals && Array.isArray(inherited.externals)) externals.push(...inherited.externals)
        if (!opts.extras && Array.isArray(inherited.extras)) extras.push(...inherited.extras)
        if (!opts.supertypes && Array.isArray(inherited.supertypes)) supertypes.push(...inherited.supertypes)
        if (!opts.inline && Array.isArray(inherited.inline)) inline.push(...inherited.inline)
        if (!opts.conflicts && Array.isArray(inherited.conflicts)) conflicts.push(...inherited.conflicts)
        if (!opts.word && inherited.word) word = inherited.word
    }

    // Expose which rule names were explicitly defined in this grammar/
    // override call — used by derive-overrides-json to detect full-
    // replacement override rules whose fields don't carry
    // `source: 'override'` (set only by `transform()`).
    const overrideRuleNames = Object.keys(opts.rules ?? {})

    const polymorphVariants = drainPolymorphVariants()

    return {
        grammar: {
            name: opts.name,
            rules,
            extras,
            externals,
            supertypes,
            inline,
            conflicts,
            word,
            references: refs,
            overrideRuleNames,
            // Per-grammar role bindings collected from inline `role()`
            // calls inside externals/rules. Empty when the grammar
            // declares no roles.
            externalRoles: collectedRoles.size > 0 ? collectedRoles : undefined,
            polymorphVariants: polymorphVariants.length > 0 ? polymorphVariants : undefined,
        } satisfies RawGrammar,
    }
}

/**
 * Run all the metadata callbacks (extras, externals, supertypes,
 * inline, conflicts, word) and write their results into the supplied
 * accumulators. Pulled out of grammarFn so the call site can wrap it
 * in `withRoleScope` cleanly.
 *
 * tree-sitter's pattern: each callback receives `($, baseValue)`
 * where `$` is a fresh proxy and `baseValue` is the base grammar's
 * version of that property.
 */
function evaluateMetadataCallbacks(
    opts: GrammarOptions,
    baseGrammar: any,
    refs: SymbolRef[],
    sinks: {
        extras: string[]
        externals: string[]
        supertypes: string[]
        inline: string[]
        conflicts: string[][]
    },
    setWord: (w: string) => void,
): void {
    // Helper: append entries to a sink array, deduping by string value.
    // Spec FR-019a: when an override does `[...prev, $._foo]` and the
    // base already has `$._foo`, collapse to a single entry. Symbol
    // refs from `$.foo` are NEW objects on each access (createProxy
    // doesn't cache), so reference equality fails — dedupe by name.
    const appendDedup = (sink: string[], value: string): void => {
        if (!sink.includes(value)) sink.push(value)
    }

    if (opts.extras) {
        const $ = createProxy('_extras_', refs)
        const baseExtras = baseGrammar?.extras ?? []
        const result = opts.extras.call($, $, baseExtras)
        if (Array.isArray(result)) {
            for (const e of result) {
                const n = normalize(e)
                if (n.type === 'symbol') appendDedup(sinks.extras, n.name)
                else if (n.type === 'pattern') appendDedup(sinks.extras, n.value)
            }
        }
    }

    if (opts.externals) {
        const $ = createProxy('_externals_', refs)
        const baseExternals = baseGrammar?.externals ?? []
        const result = opts.externals.call($, $, baseExternals)
        if (Array.isArray(result)) {
            for (const e of result) {
                const n = normalize(e)
                if (n.type === 'symbol') appendDedup(sinks.externals, n.name)
                else if (n.type === 'string') appendDedup(sinks.externals, n.value)
            }
        }
    }

    if (opts.supertypes) {
        const $ = createProxy('_supertypes_', refs)
        const baseSupertypes = baseGrammar?.supertypes ?? []
        const result = opts.supertypes.call($, $, baseSupertypes)
        if (Array.isArray(result)) {
            for (const s of result) {
                const n = normalize(s)
                if (n.type === 'symbol') appendDedup(sinks.supertypes, n.name)
            }
        }
    }

    if (opts.inline) {
        const $ = createProxy('_inline_', refs)
        const baseInline = baseGrammar?.inline ?? []
        const result = opts.inline.call($, $, baseInline)
        if (Array.isArray(result)) {
            for (const i of result) {
                const n = normalize(i)
                if (n.type === 'symbol') appendDedup(sinks.inline, n.name)
            }
        }
    }

    if (opts.conflicts) {
        const $ = createProxy('_conflicts_', refs)
        const baseConflicts = baseGrammar?.conflicts ?? []
        const result = opts.conflicts.call($, $, baseConflicts)
        if (Array.isArray(result)) {
            for (const c of result) {
                if (Array.isArray(c)) {
                    sinks.conflicts.push(c.map(r => {
                        const n = normalize(r)
                        return n.type === 'symbol' ? n.name : ''
                    }).filter(Boolean))
                }
            }
        }
    }

    if (opts.word) {
        const $ = createProxy('_word_', refs)
        const w = opts.word.call($, $)
        setWord(w.name)
    }
}

/**
 * Evaluate a grammar.js (or overrides.ts) file and return a RawGrammar.
 *
 * Injects DSL functions as globals, then imports the module.
 * Tree-sitter's grammar(base, { rules }) handles extension merging natively.
 */
export async function evaluate(entryPath: string): Promise<RawGrammar> {
    // Inject DSL functions into globalThis. `globalThis` is typed as
    // `typeof globalThis`, which doesn't include our DSL props —
    // `Record<string, unknown>` is the honest shape for the bag we
    // mutate inside this scope.
    const g = globalThis as unknown as Record<string, unknown>
    const savedGlobals: Record<string, unknown> = {}
    // Only inject tree-sitter baseline DSL shadows as globals.
    // Sittir extensions (transform/insert/replace/role/enrich) are
    // explicitly imported from '@sittir/codegen/dsl' by override files.
    const dslFunctions: Record<string, unknown> = {
        grammar: grammarFn,
        seq,
        choice,
        optional,
        repeat,
        repeat1,
        field,
        token,
        prec,
        alias,
        blank,
    }

    // Save existing globals and inject ours
    for (const [name, fn] of Object.entries(dslFunctions)) {
        savedGlobals[name] = g[name]
        g[name] = fn
    }

    try {
        // Import the grammar module
        const mod = await import(entryPath) as { default?: unknown; grammar?: unknown }
        const result = (mod.default ?? mod) as { grammar?: unknown }
        const grammarObj = result.grammar ?? result
        return grammarObj as RawGrammar
    } finally {
        for (const [name, original] of Object.entries(savedGlobals)) {
            if (original === undefined) {
                delete g[name]
            } else {
                g[name] = original
            }
        }
    }
}
