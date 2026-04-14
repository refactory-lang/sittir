/**
 * compiler/simplify.ts — derivation-only view of a rule tree.
 *
 * Strips anonymous token delimiters, collapses single-member wrappers,
 * and normalizes idempotent nestings so downstream walkers
 * (`deriveFields`, `deriveChildren`, separator discovery) see a
 * semantic-only view of each rule. Template emission continues to
 * read the raw rule — literals still need to surface as template
 * text.
 *
 * Preserves metadata that carries derivation meaning:
 *   - `optional` wrapper around non-vanishing content (required/optional flag)
 *   - `repeat` / `repeat1` separator / leading / trailing
 *   - `field` / `group` / `variant` / `clause` names
 *
 * Elides shapes that contribute nothing to derivation:
 *   - Anonymous-string members inside seqs
 *   - Empty-seq sentinels (from collapsed optional wrappers)
 *   - `optional(anonymous-string)` hints
 *   - Single-member seqs / choices
 *
 * Runs as a dedicated pipeline stage at the end of `optimize()` and
 * produces a full `simplifiedRules` map on `OptimizedGrammar`.
 */

import type { Rule } from './rule.ts'

export function simplifyRule(rule: Rule): Rule {
    switch (rule.type) {
        case 'seq': {
            // Remove non-alphanumeric string nodes (anonymous tokens)
            // and empty-seq sentinels left behind by collapsed
            // `optional` wrappers whose inner content vanished (e.g.
            // `optional(',')` — the trailing-comma hint — becomes an
            // empty seq after the string is stripped). Keyword-shaped
            // strings like 'pub' / 'return' stay — they carry identity
            // that downstream paths key on.
            const members = rule.members
                .map(m => simplifyRule(m))
                .filter(m => {
                    if (m.type === 'string' && !/^\w+$/.test(m.value)) return false
                    if (m.type === 'seq' && m.members.length === 0) return false
                    return true
                })
            if (members.length === 0) return { type: 'seq', members: [] }
            if (members.length === 1) return members[0]!
            return { type: 'seq', members }
        }
        case 'choice': {
            const members = rule.members.map(m =>
                m.type === 'variant' ? simplifyRule(m.content) : simplifyRule(m)
            )
            if (members.length === 1) return members[0]!
            return { type: 'choice', members }
        }
        case 'optional': {
            const inner = simplifyRule(rule.content)
            // If the body vanished after simplification — either an
            // empty seq sentinel OR a bare anonymous string literal
            // left behind (`optional(',')` for trailing-separator
            // hints, `optional(';')` for statement terminators) — the
            // whole optional contributes nothing derivation cares
            // about. Fold to the empty-seq sentinel so enclosing seqs
            // filter it out.
            if (inner.type === 'seq' && inner.members.length === 0) {
                return { type: 'seq', members: [] }
            }
            if (inner.type === 'string' && !/^\w+$/.test(inner.value)) {
                return { type: 'seq', members: [] }
            }
            // Preserve the optional wrapper — `deriveFieldsRaw` /
            // `walkForChildren` thread an `isOptional` flag from this
            // node to mark the downstream slot as non-required.
            return { type: 'optional', content: inner }
        }
        case 'repeat':
            // Preserve the repeat wrapper AND its metadata
            // (separator / trailing / leading) — derivation reads them
            // to stamp `multiple: true` and attach joinBy hints.
            return { ...rule, content: simplifyRule(rule.content) }
        case 'repeat1':
            return { ...rule, content: simplifyRule(rule.content) }
        case 'field':
            // Recurse into the field's content so inner anonymous
            // delimiters get stripped. The field wrapper itself stays
            // intact — its `name` is the derivation anchor.
            return { ...rule, content: simplifyRule(rule.content) }
        case 'group':
            return { ...rule, content: simplifyRule(rule.content) }
        case 'variant':
            // Variants carry a name that polymorph promotion reads.
            // Preserve the wrapper around the simplified content.
            return { ...rule, content: simplifyRule(rule.content) }
        case 'clause':
            return { ...rule, content: simplifyRule(rule.content) }
        default:
            // string / pattern / enum / symbol / supertype / token /
            // terminal / polymorph / indent / dedent / newline all
            // pass through unchanged: atomic leaves or opaque text.
            return rule
    }
}

/** Simplify every rule in an OptimizedGrammar's rules map. */
export function simplifyRules(rules: Record<string, Rule>): Record<string, Rule> {
    const out: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(rules)) {
        out[name] = simplifyRule(rule)
    }
    return out
}
