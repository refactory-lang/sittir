/**
 * dsl/enrich.ts — mechanical grammar enrichment passes.
 *
 * `enrich(base)` is a pure function that takes a tree-sitter grammar
 * result (the shape returned by `grammar(...)`), runs a pipeline of
 * mechanical passes, and returns a new grammar. It is opt-in: authors
 * wrap the base in the extension call —
 *
 *     export default grammar(enrich(base), { rules: { ... } })
 *
 * The pipeline is a fixed list of passes applied in order. Each pass
 * is a pure `(GrammarResult) => GrammarResult` function. Adding a new
 * pass means appending to `PASSES`.
 *
 * Current passes:
 *
 *   1. Unambiguous kind-to-name field wrapping — when a top-level seq
 *      member is a bare `$.kind` symbol reference that appears exactly
 *      once in its parent rule and does not collide with an existing
 *      field name, wraps it as `field('kind', $.kind, source: 'inferred')`.
 *
 *   2. Keyword-prefix field promotion (both leading-string and
 *      optional(string) variants) — when a top-level seq member is an
 *      identifier-shaped string literal (or an `optional(...)` wrapper
 *      around one), wraps it as a named field using the literal text.
 *      Subsumes Link's `promoteOptionalKeywordFields`.
 *
 * All passes are collision-aware: skip (with a stderr notification)
 * when the promotion would shadow an existing field name on the same
 * rule. All are strictly local — no cross-rule analysis, no frequency
 * counts, no thresholds. Heuristic inference stays hand-authored.
 *
 * Skipped promotions are reported to stderr, non-fatal.
 *
 * Explicitly NOT included:
 *
 *   - Heuristic passes (frequency-based field inference, polymorph
 *     promotion, usage thresholds) — violate mechanical-only principle.
 *   - Hidden-kind references (names starting with `_`) — those are
 *     sittir's alias/supertype convention and are resolved by Link.
 */

import type {
    Rule, SeqRule, SymbolRule, FieldRule, OptionalRule, StringRule,
} from '../compiler/rule.ts'

// Shape of the tree-sitter grammar result that our grammarFn produces.
// The outer wrapper is `{ grammar: {...} }` because tree-sitter's
// top-level `grammar()` call wraps its result; we preserve that shape.
export interface GrammarResult {
    grammar: {
        name: string
        rules: Record<string, Rule>
        [other: string]: unknown
    }
}

type Pass = (g: GrammarResult) => GrammarResult

const PASSES: readonly Pass[] = [
    kindToNamePass,
    // keywordPrefixPass — disabled pending fidelity investigation.
    // When enabled, rust regresses from ~50 to 99 round-trip failures
    // and python from ~40 to 58. The wrapper produces field('async',
    // 'async') shapes that downstream passes apparently don't handle
    // as well as Link's post-Evaluate promoteOptionalKeywordFields.
    // Restore this pass after the root cause is identified.
]

export function enrich(base: GrammarResult): GrammarResult {
    if (!base || typeof base !== 'object') {
        throw new Error('enrich(): expected a grammar object, got ' + typeof base)
    }

    // Tree-sitter CLI compatibility path: when this code runs inside
    // tree-sitter's parser-generator runtime (loading the transpiled
    // .sittir/grammar.js), `base` has tree-sitter's native shape —
    // `{ name, rules, ... }` directly, with rules using uppercase
    // types (`SEQ`, `SYMBOL`, etc.). Sittir's enrich passes are
    // written for the sittir shape (`{ grammar: { rules } }` with
    // lowercase types) so they can't apply here. Pass through
    // unchanged — tree-sitter will compile the un-enriched grammar.
    //
    // Sittir's own pipeline still applies enrich properly because its
    // evaluate.ts injects sittir's grammarFn before importing the
    // override file, so `base` arrives in sittir's shape.
    //
    // The trade-off: the field wrappers enrich would add are present
    // when sittir generates its consumer code, but absent in
    // tree-sitter's compiled parser. Sittir's fidelity ceilings cover
    // this gap; a future follow-up can make enrich shape-aware so the
    // same transformations apply in both runtimes.
    if (!('grammar' in base)) {
        return base as GrammarResult
    }

    if (!base.grammar || typeof base.grammar.rules !== 'object') {
        throw new Error('enrich(): grammar is missing a rules record')
    }

    let result = base
    for (const pass of PASSES) {
        result = pass(result)
    }
    return result
}

// ---------------------------------------------------------------------------
// Pass 1 — unambiguous kind-to-name field wrapping
// ---------------------------------------------------------------------------

function kindToNamePass(g: GrammarResult): GrammarResult {
    return mapRules(g, applyKindToName)
}

function applyKindToName(ruleName: string, rule: Rule): Rule {
    if (rule.type !== 'seq') return rule

    // Count occurrences of each kind name at the top level — a kind
    // that appears more than once is ambiguous ("which $.expression is
    // THE expression?") and gets skipped silently.
    const kindCounts = new Map<string, number>()
    for (const m of rule.members) {
        if (m.type === 'symbol') {
            kindCounts.set(m.name, (kindCounts.get(m.name) ?? 0) + 1)
        }
    }

    const existingFields = collectFieldNames(rule)
    let changed = false

    const newMembers = rule.members.map((m): Rule => {
        if (m.type !== 'symbol') return m
        const sym = m as SymbolRule
        const kindName = sym.name

        // Hidden kinds are sittir's alias/supertype convention.
        if (kindName.startsWith('_')) return m
        // Ambiguous — multiple siblings of the same kind.
        if ((kindCounts.get(kindName) ?? 0) > 1) return m
        // Collision with an existing field on the same rule.
        if (existingFields.has(kindName)) {
            reportSkip('kind-to-name', ruleName, `field '${kindName}' already exists`)
            return m
        }

        existingFields.add(kindName)
        changed = true
        return wrapAsField(kindName, sym)
    })

    if (!changed) return rule
    return { type: 'seq', members: newMembers } satisfies SeqRule
}

// ---------------------------------------------------------------------------
// Pass 2 — keyword-prefix field promotion
// ---------------------------------------------------------------------------

function keywordPrefixPass(g: GrammarResult): GrammarResult {
    return mapRules(g, applyKeywordPrefix)
}

function applyKeywordPrefix(ruleName: string, rule: Rule): Rule {
    if (rule.type !== 'seq') return rule

    const existingFields = collectFieldNames(rule)
    let changed = false

    const newMembers = rule.members.map((m): Rule => {
        // Case A: bare string literal `seq('async', ...)`
        if (m.type === 'string') {
            const s = m as StringRule
            if (!isIdentifierShaped(s.value)) return m
            if (existingFields.has(s.value)) {
                reportSkip('keyword-prefix', ruleName, `field '${s.value}' already exists`)
                return m
            }
            existingFields.add(s.value)
            changed = true
            return wrapAsField(s.value, s)
        }

        // Case B: `optional(stringLiteral)` — subsumes Link's
        // promoteOptionalKeywordFields.
        if (m.type === 'optional') {
            const inner = (m as OptionalRule).content
            if (inner.type !== 'string') return m
            const s = inner as StringRule
            if (!isIdentifierShaped(s.value)) return m
            if (existingFields.has(s.value)) {
                reportSkip('optional-keyword-prefix', ruleName, `field '${s.value}' already exists`)
                return m
            }
            existingFields.add(s.value)
            changed = true
            return {
                type: 'optional',
                content: wrapAsField(s.value, s),
            } satisfies OptionalRule
        }

        return m
    })

    if (!changed) return rule
    return { type: 'seq', members: newMembers } satisfies SeqRule
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function mapRules(g: GrammarResult, fn: (ruleName: string, rule: Rule) => Rule): GrammarResult {
    const newRules: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(g.grammar.rules)) {
        newRules[name] = fn(name, rule)
    }
    return {
        ...g,
        grammar: {
            ...g.grammar,
            rules: newRules,
        },
    }
}

function wrapAsField(name: string, content: Rule): FieldRule {
    return {
        type: 'field',
        name,
        content,
        source: 'inferred',
    }
}

/**
 * Collect field names already present at the top level of a seq rule.
 * Used for collision detection — mechanical-only promotion must skip
 * any kind that would collide with an authored or pre-existing field.
 * Also peeks inside `optional(field(...))`.
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
 * Check whether a string is identifier-shaped — starts with a letter
 * or underscore, contains only identifier characters. Keywords
 * ('async', 'for', 'return') match; punctuation ('(', '->', '::') does
 * not. Only identifier-shaped literals are promoted because field
 * names have to be valid identifiers in the generated factory API.
 */
function isIdentifierShaped(value: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
}

function reportSkip(pass: string, ruleName: string, reason: string): void {
    process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})\n`)
}
