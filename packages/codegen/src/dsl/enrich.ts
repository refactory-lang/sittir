/**
 * dsl/enrich.ts — mechanical grammar enrichment passes.
 *
 * `enrich(base)` is a pure function that takes a tree-sitter grammar
 * result (the shape returned by `grammar(...)`), applies mechanical-only
 * transformations to its rules, and returns a new grammar. It is
 * opt-in: authors wrap the base in the extension call —
 *
 *     export default grammar(enrich(base), { rules: { ... } })
 *
 * Passes (all collision-aware, all deterministic, no thresholds):
 *
 *   1. Keyword-prefix field promotion — when a rule's top-level seq
 *      begins with a literal keyword (e.g. `seq('async', ...)`),
 *      promotes the literal to `field(kw, literal)` so factories
 *      expose it as a named parameter. Skipped on name collision with
 *      an existing field on the same rule.
 *
 *   2. Optional keyword-prefix field promotion — same pattern but
 *      where the literal is wrapped in `optional(...)`. Subsumes
 *      Link's `promoteOptionalKeywordFields` at the tree-sitter
 *      grammar level (pre-Evaluate).
 *
 * Skipped promotions are reported to stderr, non-fatal.
 *
 * Explicitly NOT included: heuristic passes (frequency-based field
 * inference, polymorph promotion, usage thresholds) — those stay
 * hand-authored.
 */

import type { Rule, SeqRule, OptionalRule, StringRule, FieldRule } from '../compiler/rule.ts'

// Shape of the tree-sitter grammar result that our grammarFn produces.
// The outer wrapper is `{ grammar: {...} }` because tree-sitter's
// top-level `grammar()` call wraps its result; we preserve that shape.
interface GrammarResult {
    grammar: {
        name: string
        rules: Record<string, Rule>
        [other: string]: unknown
    }
}

export function enrich(base: GrammarResult): GrammarResult {
    if (!base || typeof base !== 'object' || !('grammar' in base)) {
        throw new Error('enrich(): expected a tree-sitter grammar result (shape { grammar: { rules } })')
    }

    const g = base.grammar
    if (!g || typeof g.rules !== 'object') {
        throw new Error('enrich(): grammar is missing a rules record')
    }

    const newRules: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(g.rules)) {
        newRules[name] = applyPasses(name, rule)
    }

    return {
        ...base,
        grammar: {
            ...g,
            rules: newRules,
        },
    }
}

function applyPasses(ruleName: string, rule: Rule): Rule {
    // Only top-level seq rules are candidates — keyword-prefix
    // promotion has no meaning on bare symbols, choices, etc.
    if (rule.type !== 'seq') return rule

    const existingFields = collectFieldNames(rule)
    const newMembers = [...rule.members]
    let changed = false

    for (let i = 0; i < newMembers.length; i++) {
        const member = newMembers[i]!

        // Case 1: bare string literal — `seq('async', ...)`
        if (member.type === 'string' && isIdentifierShaped(member.value)) {
            const kw = member.value
            if (existingFields.has(kw)) {
                reportSkip('keyword-prefix', ruleName, `field '${kw}' already exists`)
                continue
            }
            newMembers[i] = wrapAsField(kw, member, 'inferred')
            existingFields.add(kw)
            changed = true
            continue
        }

        // Case 2: `optional(stringLiteral)` — subsumes Link's
        // promoteOptionalKeywordFields.
        if (member.type === 'optional') {
            const inner = (member as OptionalRule).content
            if (inner.type === 'string' && isIdentifierShaped(inner.value)) {
                const kw = inner.value
                if (existingFields.has(kw)) {
                    reportSkip('optional-keyword-prefix', ruleName, `field '${kw}' already exists`)
                    continue
                }
                newMembers[i] = {
                    type: 'optional',
                    content: wrapAsField(kw, inner, 'inferred'),
                } satisfies OptionalRule
                existingFields.add(kw)
                changed = true
            }
        }
    }

    if (!changed) return rule
    return { type: 'seq', members: newMembers } satisfies SeqRule
}

/**
 * Collect field names already present at the top level of a seq rule.
 * Used for collision detection — mechanical-only promotion must skip
 * any keyword that would collide with an authored or pre-existing
 * field.
 */
function collectFieldNames(rule: Rule): Set<string> {
    const names = new Set<string>()
    if (rule.type !== 'seq') return names
    for (const m of rule.members) {
        if (m.type === 'field') {
            names.add(m.name)
        } else if (m.type === 'optional' && (m as OptionalRule).content.type === 'field') {
            names.add(((m as OptionalRule).content as FieldRule).name)
        }
    }
    return names
}

/**
 * Check whether a string value is identifier-shaped — starts with a
 * letter or underscore, contains only identifier characters. Keywords
 * ('async', 'for', 'return') match; punctuation ('(', '->', '::') does
 * not. Only identifier-shaped literals are promoted, because a field
 * name has to be a valid identifier in the generated factory API.
 */
function isIdentifierShaped(value: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
}

function wrapAsField(name: string, content: StringRule, source: 'inferred'): FieldRule {
    return {
        type: 'field',
        name,
        content,
        source,
    }
}

function reportSkip(pass: string, ruleName: string, reason: string): void {
    // eslint-disable-next-line no-console
    process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})\n`)
}
