/**
 * compiler/optimize.ts — Phase 3: Optimize
 *
 * Restructures seq/choice/optional/repeat. Does NOT change named content.
 * Adds variant wrappers around choice members. Non-lossy.
 */

import type {
    Rule, LinkedGrammar, OptimizedGrammar,
    VariantRule, ChoiceRule,
} from './rule.ts'

// ---------------------------------------------------------------------------
// optimize() — main entry point
// ---------------------------------------------------------------------------

export function optimize(linked: LinkedGrammar): OptimizedGrammar {
    const rules: Record<string, Rule> = {}

    for (const [name, rule] of Object.entries(linked.rules)) {
        rules[name] = optimizeRule(rule, name)
    }

    return {
        name: linked.name,
        rules,
        supertypes: linked.supertypes,
        word: linked.word,
    }
}

function optimizeRule(rule: Rule, name: string): Rule {
    switch (rule.type) {
        case 'seq':
            return { type: 'seq', members: rule.members.map(m => optimizeRule(m, name)) }

        case 'choice': {
            // Wrap visible choice members in variants
            if (!name.startsWith('_')) {
                return wrapVariants(rule)
            }
            return { type: 'choice', members: rule.members.map(m => optimizeRule(m, name)) }
        }

        case 'optional':
            return { type: 'optional', content: optimizeRule(rule.content, name) }

        case 'repeat':
            return { ...rule, content: optimizeRule(rule.content, name) }

        case 'field':
            return { ...rule, content: optimizeRule(rule.content, name) }

        case 'clause':
            return { ...rule, content: optimizeRule(rule.content, name) }

        case 'group':
            return { ...rule, content: optimizeRule(rule.content, name) }

        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// rulesEqual — structural equality
// ---------------------------------------------------------------------------

export function rulesEqual(a: Rule, b: Rule): boolean {
    if (a.type !== b.type) return false

    switch (a.type) {
        case 'string':
            return a.value === (b as typeof a).value
        case 'pattern':
            return a.value === (b as typeof a).value
        case 'symbol':
            return a.name === (b as typeof a).name
        case 'seq':
            return a.members.length === (b as typeof a).members.length &&
                a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]))
        case 'choice':
            return a.members.length === (b as typeof a).members.length &&
                a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]))
        case 'optional':
            return rulesEqual(a.content, (b as typeof a).content)
        case 'repeat':
            return rulesEqual(a.content, (b as typeof a).content) &&
                a.separator === (b as typeof a).separator
        case 'field':
            return a.name === (b as typeof a).name &&
                rulesEqual(a.content, (b as typeof a).content)
        case 'variant':
            return a.name === (b as typeof a).name &&
                rulesEqual(a.content, (b as typeof a).content)
        case 'enum':
            return JSON.stringify(a.values) === JSON.stringify((b as typeof a).values)
        case 'supertype':
            return a.name === (b as typeof a).name
        case 'indent':
        case 'dedent':
        case 'newline':
            return true
        default:
            return JSON.stringify(a) === JSON.stringify(b)
    }
}

// ---------------------------------------------------------------------------
// factorSeqChoice — extract common prefix/suffix from choice branches
// ---------------------------------------------------------------------------

export function factorSeqChoice(branches: Rule[]): Rule[] {
    // Check if all branches are seqs
    const seqs = branches.map(b => b.type === 'seq' ? b.members : [b])

    const prefixLen = findCommonPrefix(seqs)
    if (prefixLen === 0) return branches

    const suffixLen = findCommonSuffix(seqs, prefixLen)

    // Extract factored branches (the parts that differ)
    return branches.map(b => {
        if (b.type === 'seq') {
            const members = b.members.slice(prefixLen, b.members.length - suffixLen)
            return members.length === 1 ? members[0] : { type: 'seq' as const, members }
        }
        return b
    })
}

function findCommonPrefix(seqs: Rule[][]): number {
    if (seqs.length === 0) return 0
    const first = seqs[0]
    let len = 0
    for (let i = 0; i < first.length; i++) {
        if (seqs.every(s => i < s.length && rulesEqual(s[i], first[i]))) {
            len++
        } else break
    }
    return len
}

function findCommonSuffix(seqs: Rule[][], prefixLen: number): number {
    if (seqs.length === 0) return 0
    const first = seqs[0]
    let len = 0
    for (let i = 0; i < first.length - prefixLen; i++) {
        const fi = first.length - 1 - i
        if (seqs.every(s => {
            const si = s.length - 1 - i
            return si >= prefixLen && rulesEqual(s[si], first[fi])
        })) {
            len++
        } else break
    }
    return len
}

// ---------------------------------------------------------------------------
// wrapVariants — wrap choice members in variant nodes
// ---------------------------------------------------------------------------

export function wrapVariants(choice: Rule): Rule {
    if (choice.type !== 'choice') return choice

    const members = choice.members.map((member, i) => {
        const name = nameVariant(member, i, choice.members)
        return {
            type: 'variant' as const,
            name,
            content: member,
        } satisfies VariantRule
    })

    return { type: 'choice', members: deduplicateVariants(members) }
}

// ---------------------------------------------------------------------------
// deduplicateVariants — remove structurally identical variants (non-lossy)
// ---------------------------------------------------------------------------

export function deduplicateVariants(variants: Rule[]): Rule[] {
    const seen: Rule[] = []
    const result: Rule[] = []

    for (const v of variants) {
        const content = v.type === 'variant' ? v.content : v
        const isDuplicate = seen.some(s => rulesEqual(s, content))
        if (!isDuplicate) {
            seen.push(content)
            result.push(v)
        }
    }

    return result
}

// ---------------------------------------------------------------------------
// nameVariant — derive a name for a choice branch
// ---------------------------------------------------------------------------

export function nameVariant(variant: Rule, index: number, all: Rule[]): string {
    // Find a distinguishing string literal in this branch
    const detectToken = findDetectToken(variant)
    if (detectToken) return tokenToName(detectToken)

    // Find a distinguishing symbol name
    const detectSymbol = findDetectSymbol(variant)
    if (detectSymbol) return detectSymbol

    return `form_${index}`
}

function findDetectToken(rule: Rule): string | null {
    if (rule.type === 'string') return rule.value
    if (rule.type === 'seq' && rule.members.length > 0) {
        for (const m of rule.members) {
            if (m.type === 'string') return m.value
        }
    }
    return null
}

function findDetectSymbol(rule: Rule): string | null {
    if (rule.type === 'symbol') return rule.name
    if (rule.type === 'field') return rule.name
    if (rule.type === 'seq') {
        for (const m of rule.members) {
            const sym = findDetectSymbol(m)
            if (sym) return sym
        }
    }
    return null
}

// ---------------------------------------------------------------------------
// tokenToName — map punctuation to readable names
// ---------------------------------------------------------------------------

const TOKEN_NAMES: Record<string, string> = {
    ';': 'semi',
    '{': 'brace',
    '}': 'close_brace',
    '(': 'paren',
    ')': 'close_paren',
    '[': 'bracket',
    ']': 'close_bracket',
    ',': 'comma',
    ':': 'colon',
    '.': 'dot',
    '::': 'path',
    '->': 'arrow',
    '=>': 'fat_arrow',
    '=': 'eq',
    '!': 'bang',
    '?': 'question',
    '<': 'lt',
    '>': 'gt',
    '+': 'plus',
    '-': 'minus',
    '*': 'star',
    '/': 'slash',
    '%': 'percent',
    '&': 'amp',
    '|': 'pipe',
    '^': 'caret',
    '~': 'tilde',
    '#': 'hash',
    '@': 'at',
}

export function tokenToName(token: string): string {
    return TOKEN_NAMES[token] ?? token
}

// ---------------------------------------------------------------------------
// fanOutChoices — expand nested choices (for use by callers)
// ---------------------------------------------------------------------------

export function fanOutChoices(rule: Rule): Rule[] {
    if (rule.type === 'choice') {
        return rule.members.flatMap(m => fanOutChoices(m))
    }
    return [rule]
}

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

const WORD_CHAR = /\w/

export function needsSpace(prev: string, next: string): boolean {
    if (prev.length === 0 || next.length === 0) return false
    const lastChar = prev[prev.length - 1]
    const firstChar = next[0]
    return WORD_CHAR.test(lastChar) && WORD_CHAR.test(firstChar)
}
