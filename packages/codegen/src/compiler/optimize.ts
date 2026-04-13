/**
 * compiler/optimize.ts — Phase 3: Optimize
 *
 * Restructures seq/choice/optional/repeat for SIMPLIFICATION (fan-out,
 * factoring, prefix/suffix extraction). Does NOT change named content.
 * Non-lossy.
 *
 * Variant tagging and polymorph promotion live in Link (Phase 2) — those
 * are classification, not simplification. Optimize is currently a
 * passthrough; the helpers below (`fanOutChoices`, `factorSeqChoice`,
 * `rulesEqual`, `needsSpace`, `buildWordBoundary`) are exported for
 * future fan-out/factoring work and for tests but are not part of the
 * current pipeline traversal.
 */

import type {
    Rule, LinkedGrammar, OptimizedGrammar,
} from './rule.ts'

// ---------------------------------------------------------------------------
// optimize() — currently a passthrough
// ---------------------------------------------------------------------------

export function optimize(linked: LinkedGrammar): OptimizedGrammar {
    return {
        name: linked.name,
        rules: linked.rules,
        supertypes: linked.supertypes,
        word: linked.word,
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

// wrapVariants / deduplicateVariants / nameVariant / tokenToName all
// moved to compiler/link.ts — they're classification, not simplification.
// Re-export from there if test files or callers still need them.
export { wrapVariants, deduplicateVariants, nameVariant, tokenToName } from './link.ts'

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
