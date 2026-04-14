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
    EnumRule, SymbolRef, RawGrammar,
} from './rule.ts'

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

export function seq(...members: Input[]): SeqRule {
    return { type: 'seq', members: members.map(normalize) }
}

export function choice(...members: Input[]): ChoiceRule | EnumRule {
    const normalized = members.map(normalize)

    // Detect all-string choice → EnumRule
    if (normalized.length > 0 && normalized.every(m => m.type === 'string')) {
        return {
            type: 'enum',
            values: normalized.map(m => (m as StringRule).value),
            source: 'grammar',
        }
    }

    return { type: 'choice', members: normalized }
}

export function optional(content: Input): OptionalRule {
    const resolved = normalize(content)
    walkRefs(resolved, ref => { ref.optional = true })
    return { type: 'optional', content: resolved }
}

export function repeat(content: Input): RepeatRule {
    const resolved = normalize(content)
    walkRefs(resolved, ref => { ref.repeated = true })

    // Detect separator pattern in seq(STRING, x) or seq(x, STRING)
    if (resolved.type === 'seq' && resolved.members.length === 2) {
        const first = resolved.members[0]!
        const second = resolved.members[1]!
        if (first.type === 'string' && second.type !== 'string') {
            return { type: 'repeat', content: second, separator: first.value }
        }
        if (second.type === 'string' && first.type !== 'string') {
            return { type: 'repeat', content: first, separator: second.value, trailing: true }
        }
    }

    return { type: 'repeat', content: resolved }
}

export function repeat1(content: Input): Repeat1Rule {
    const resolved = normalize(content)
    walkRefs(resolved, ref => { ref.repeated = true })
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
    const resolved = normalize(content)
    // Propagate the field name to every nested symbol ref. Stops at
    // inner field/alias boundaries — those own their own field name.
    // Don't overwrite a field name set by an inner wrapper.
    walkRefs(resolved, ref => {
        if (ref.fieldName === undefined) ref.fieldName = name
    })
    return { type: 'field', name, content: resolved }
}

// ---------------------------------------------------------------------------
// Override primitives — transform, insert, replace
// Operate on the `original` rule passed by tree-sitter's grammar(base) mechanism.
// ---------------------------------------------------------------------------

/**
 * Apply positional patches to a rule's members.
 * Patches are keyed by numeric index. Each patch value replaces the member
 * at that position. Field patches are marked with source: 'override'.
 */
export function transform(original: Rule, patches: Record<number | string, Rule>): Rule {
    // For seq: apply patches to members by RAW position. The override
    // author sees the rule tree as-is, including anonymous string
    // delimiters and already-labeled field wrappers, and can wrap any
    // position with a field() — that's the whole point of the primitive
    // being "add a name to an unnamed entry." No hidden remapping.
    if (original.type === 'seq') {
        const members = [...original.members]
        for (const [key, patch] of Object.entries(patches)) {
            const index = Number(key)
            if (isNaN(index) || index < 0 || index >= members.length) {
                // Skip out-of-bounds patches — the position may have been
                // computed against a different view of the rule.
                continue
            }
            members[index] = resolvePatch(patch, members[index]!)
        }
        return { type: 'seq', members }
    }

    // For choice: apply transform to each member recursively
    if (original.type === 'choice') {
        return {
            type: 'choice',
            members: original.members.map(m => transform(m, patches)),
        }
    }

    // For prec-like wrappers that were already stripped — just apply to content
    if ('content' in original && original.content) {
        return { ...original, content: transform(original.content as Rule, patches) } as Rule
    }

    // For other types, return as-is (patches don't apply)
    return original
}

function resolvePatch(patch: Rule, originalMember: Rule): Rule {
    if (patch.type === 'field' && patch._needsContent) {
        return { type: 'field', name: patch.name, content: originalMember, source: 'override' as const }
    }
    if (patch.type === 'field') {
        return { ...patch, source: 'override' as const }
    }
    return patch
}

/**
 * Wrap a member at a position using a wrapper function that receives
 * the original content. The wrapper's result is marked source: 'override'.
 */
export function insert(original: Rule, position: number, wrapper: (content: Rule) => Rule): Rule {
    if (original.type !== 'seq') {
        throw new Error(`insert() expects a seq rule, got '${original.type}'`)
    }

    const members = [...original.members]
    if (position < 0 || position >= members.length) {
        throw new Error(`insert(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    const wrapped = wrapper(members[position]!)
    members[position] = wrapped.type === 'field'
        ? { ...wrapped, source: 'override' as const }
        : wrapped

    return { type: 'seq', members }
}

/**
 * Replace content at a position. Pass null to suppress (remove the member).
 */
export function replace(original: Rule, position: number, replacement: Rule | null): Rule {
    if (original.type !== 'seq') {
        throw new Error(`replace() expects a seq rule, got '${original.type}'`)
    }

    const members = [...original.members]
    if (position < 0 || position >= members.length) {
        throw new Error(`replace(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    if (replacement === null) {
        members.splice(position, 1)
    } else {
        members[position] = replacement
    }

    return { type: 'seq', members }
}

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

    // Evaluate each rule function
    for (const [name, ruleFn] of Object.entries(opts.rules)) {
        const $ = createProxy(name, refs)
        const baseRule = baseRules[name]
        // tree-sitter passes ($, original) — original is the base rule for extensions.
        // `baseRule` is typed as `Rule` from our map but the DSL callback's
        // `previous` is `unknown` (tree-sitter permits arbitrary pass-through
        // shapes). The call-site treats it as opaque.
        const result = ruleFn.call($, $, baseRule)
        rules[name] = normalize(result)
    }

    // Extract metadata
    const extras: string[] = []
    const externals: string[] = []
    const supertypes: string[] = []
    const inline: string[] = []
    const conflicts: string[][] = []
    let word: string | null = null

    // All callbacks follow tree-sitter's pattern: fn($, baseValue)
    // where baseValue is the base grammar's version of that property

    if (opts.extras) {
        const $ = createProxy('_extras_', refs)
        const baseExtras = baseGrammar?.extras ?? []
        const result = opts.extras.call($, $, baseExtras)
        if (Array.isArray(result)) {
            for (const e of result) {
                const n = normalize(e)
                if (n.type === 'symbol') extras.push(n.name)
                else if (n.type === 'pattern') extras.push(n.value)
            }
        }
    }

    if (opts.externals) {
        const $ = createProxy('_externals_', refs)
        // Pass the base externals (already resolved to strings) so the
        // override callback's `previous.concat([...])` pattern preserves
        // them. Wrap each as a string rule so `normalize` round-trips.
        const baseExternals = baseGrammar?.externals ?? []
        const result = opts.externals.call($, $, baseExternals)
        if (Array.isArray(result)) {
            for (const e of result) {
                const n = normalize(e)
                if (n.type === 'symbol') externals.push(n.name)
                else if (n.type === 'string') externals.push(n.value)
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
                if (n.type === 'symbol') supertypes.push(n.name)
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
                if (n.type === 'symbol') inline.push(n.name)
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
                    conflicts.push(c.map(r => {
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
        word = w.name
    }

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
        } satisfies RawGrammar,
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
        transform,
        insert,
        replace,
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
