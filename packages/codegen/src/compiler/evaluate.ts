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
    const ref = getRef(resolved)
    if (ref) ref.optional = true
    return { type: 'optional', content: resolved }
}

export function repeat(content: Input): RepeatRule {
    const resolved = normalize(content)
    const ref = getRef(resolved)
    if (ref) ref.repeated = true

    // Detect separator pattern in seq(STRING, x) or seq(x, STRING)
    if (resolved.type === 'seq' && resolved.members.length === 2) {
        const [first, second] = resolved.members
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
    const ref = getRef(resolved)
    if (ref) ref.repeated = true
    return { type: 'repeat1', content: resolved }
}

// ---------------------------------------------------------------------------
// $ proxy — reference tracking
// ---------------------------------------------------------------------------

export function createProxy(currentRule: string, refs: SymbolRef[]): Record<string, SymbolRuleWithRef> {
    return new Proxy({} as Record<string, SymbolRuleWithRef>, {
        get(_target, name: string): SymbolRuleWithRef {
            const ref: SymbolRef = { from: currentRule, to: name }
            refs.push(ref)
            return {
                type: 'symbol' as const,
                name,
                hidden: name.startsWith('_'),
                _ref: ref,
            }
        },
    })
}

// ---------------------------------------------------------------------------
// Ref enrichment helper
// ---------------------------------------------------------------------------

function getRef(rule: Rule): SymbolRef | undefined {
    return (rule as SymbolRuleWithRef)._ref
}

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

export function field(name: string, content: Input): FieldRule {
    const resolved = normalize(content)
    const ref = getRef(resolved)
    if (ref) ref.fieldName = name
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
    if (original.type !== 'seq') {
        throw new Error(`transform() expects a seq rule, got '${original.type}'`)
    }

    const members = [...original.members]
    for (const [key, patch] of Object.entries(patches)) {
        const index = Number(key)
        if (isNaN(index) || index < 0 || index >= members.length) {
            throw new Error(`transform(): position ${key} out of bounds (rule has ${members.length} members)`)
        }
        // Mark field patches with override provenance
        const marked = patch.type === 'field'
            ? { ...patch, source: 'override' as const }
            : patch
        members[index] = marked
    }

    return { type: 'seq', members }
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

    const wrapped = wrapper(members[position])
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
    function prec(_precedence: number, content: Input): Rule {
        return normalize(content)
    },
    {
        left(_precedence: number, content: Input): Rule {
            return normalize(content)
        },
        right(_precedence: number, content: Input): Rule {
            return normalize(content)
        },
        dynamic(_precedence: number, content: Input): Rule {
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
    rules: Record<string, ($: Record<string, SymbolRuleWithRef>) => Input>
    extras?: ($: Record<string, SymbolRuleWithRef>) => Input[]
    externals?: ($: Record<string, SymbolRuleWithRef>) => Input[]
    supertypes?: ($: Record<string, SymbolRuleWithRef>) => Input[]
    inline?: ($: Record<string, SymbolRuleWithRef>) => Input[]
    conflicts?: ($: Record<string, SymbolRuleWithRef>) => Input[][]
    word?: ($: Record<string, SymbolRuleWithRef>) => SymbolRuleWithRef
    precedences?: ($: Record<string, SymbolRuleWithRef>) => Input[][]
}

/**
 * The `grammar()` function — mirrors tree-sitter's DSL entry point.
 * When called with one arg: fresh grammar.
 * When called with two args: grammar extension (base + overrides).
 */
function grammarFn(optionsOrBase: GrammarOptions | { grammar: any }, options?: GrammarOptions): { grammar: any } {
    let baseRules: Record<string, Rule> = {}
    let opts: GrammarOptions

    if (options === undefined) {
        opts = optionsOrBase as GrammarOptions
    } else {
        // Extension mode: first arg is a base grammar result
        const base = (optionsOrBase as { grammar: any }).grammar
        baseRules = { ...base.rules }
        opts = options
    }

    const refs: SymbolRef[] = []
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
        // tree-sitter passes ($, original) — original is the base rule for extensions
        const result = ruleFn.call($, $, baseRule as any)
        rules[name] = normalize(result)
    }

    // Extract metadata
    const extras: string[] = []
    const externals: string[] = []
    const supertypes: string[] = []
    const inline: string[] = []
    const conflicts: string[][] = []
    let word: string | null = null

    if (opts.extras) {
        const $ = createProxy('_extras_', refs)
        for (const e of opts.extras($)) {
            const n = normalize(e)
            if (n.type === 'symbol') extras.push(n.name)
            else if (n.type === 'pattern') extras.push(n.value)
        }
    }

    if (opts.externals) {
        const $ = createProxy('_externals_', refs)
        for (const e of opts.externals($)) {
            const n = normalize(e)
            if (n.type === 'symbol') externals.push(n.name)
        }
    }

    if (opts.supertypes) {
        const $ = createProxy('_supertypes_', refs)
        for (const s of opts.supertypes($)) {
            const n = normalize(s)
            if (n.type === 'symbol') supertypes.push(n.name)
        }
    }

    if (opts.inline) {
        const $ = createProxy('_inline_', refs)
        for (const i of opts.inline($)) {
            const n = normalize(i)
            if (n.type === 'symbol') inline.push(n.name)
        }
    }

    if (opts.conflicts) {
        const $ = createProxy('_conflicts_', refs)
        for (const c of opts.conflicts($)) {
            conflicts.push(c.map(r => {
                const n = normalize(r)
                return n.type === 'symbol' ? n.name : ''
            }).filter(Boolean))
        }
    }

    if (opts.word) {
        const $ = createProxy('_word_', refs)
        const w = opts.word($)
        word = w.name
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
    // Inject DSL functions into globalThis
    const g = globalThis as any
    const savedGlobals: Record<string, any> = {}
    const dslFunctions: Record<string, any> = {
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
        const mod = await import(entryPath)
        const result = mod.default ?? mod

        // Extract the grammar from the result
        const grammarObj = result.grammar ?? result
        return grammarObj as RawGrammar
    } finally {
        // Restore globals
        for (const [name, original] of Object.entries(savedGlobals)) {
            if (original === undefined) {
                delete g[name]
            } else {
                g[name] = original
            }
        }
    }
}
