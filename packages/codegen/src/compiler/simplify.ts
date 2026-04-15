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
 * "Keyword-shaped" string detection is driven by the grammar's own
 * `word` rule — the lexer production that tree-sitter uses to
 * recognize words at parse time. Strings whose text matches the
 * grammar's word pattern are preserved (they carry lexical identity
 * the downstream paths key on); strings that don't (punctuation,
 * operators, delimiters) are stripped. When the grammar has no
 * `word` declaration, fall back to `/^\w+$/` as a generic heuristic.
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

/** Does this string lex as a "word" under the grammar's `word` rule? */
function isKeywordShape(value: string, wordMatcher: RegExp | undefined): boolean {
    if (wordMatcher) return wordMatcher.test(value)
    return /^\w+$/.test(value)
}

export function simplifyRule(rule: Rule, wordMatcher?: RegExp): Rule {
    switch (rule.type) {
        case 'seq': {
            // Remove string nodes that don't lex as words under the
            // grammar's `word` rule (anonymous delimiters / operators)
            // and empty-seq sentinels left behind by collapsed
            // `optional` wrappers whose inner content vanished (e.g.
            // `optional(',')` — the trailing-comma hint — becomes an
            // empty seq after the string is stripped). Word-shaped
            // strings like 'pub' / 'return' stay — they carry identity
            // that downstream paths key on.
            const members = rule.members
                .map(m => simplifyRule(m, wordMatcher))
                .filter(m => {
                    if (m.type === 'string' && !isKeywordShape(m.value, wordMatcher)) return false
                    if (m.type === 'seq' && m.members.length === 0) return false
                    return true
                })
            if (members.length === 0) return { type: 'seq', members: [] }
            if (members.length === 1) return members[0]!
            return { type: 'seq', members }
        }
        case 'choice': {
            const members = rule.members.map(m =>
                m.type === 'variant' ? simplifyRule(m.content, wordMatcher) : simplifyRule(m, wordMatcher)
            )
            if (members.length === 1) return members[0]!
            return { type: 'choice', members }
        }
        case 'optional': {
            const inner = simplifyRule(rule.content, wordMatcher)
            // If the body vanished after simplification — either an
            // empty seq sentinel OR a bare non-word-shaped string
            // literal left behind (`optional(',')` for trailing-separator
            // hints, `optional(';')` for statement terminators) — the
            // whole optional contributes nothing derivation cares
            // about. Fold to the empty-seq sentinel so enclosing seqs
            // filter it out.
            if (inner.type === 'seq' && inner.members.length === 0) {
                return { type: 'seq', members: [] }
            }
            if (inner.type === 'string' && !isKeywordShape(inner.value, wordMatcher)) {
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
            return { ...rule, content: simplifyRule(rule.content, wordMatcher) }
        case 'repeat1':
            return { ...rule, content: simplifyRule(rule.content, wordMatcher) }
        case 'field':
            // Recurse into the field's content so inner anonymous
            // delimiters get stripped. The field wrapper itself stays
            // intact — its `name` is the derivation anchor.
            return { ...rule, content: simplifyRule(rule.content, wordMatcher) }
        case 'group':
            return { ...rule, content: simplifyRule(rule.content, wordMatcher) }
        case 'variant':
            // Variants carry a name that polymorph promotion reads.
            // Preserve the wrapper around the simplified content.
            return { ...rule, content: simplifyRule(rule.content, wordMatcher) }
        case 'clause':
            return { ...rule, content: simplifyRule(rule.content, wordMatcher) }
        default:
            // string / pattern / enum / symbol / supertype / token /
            // terminal / polymorph / indent / dedent / newline all
            // pass through unchanged: atomic leaves or opaque text.
            return rule
    }
}

/** Simplify every rule in an OptimizedGrammar's rules map. */
export function simplifyRules(
    rules: Record<string, Rule>,
    wordMatcher?: RegExp,
): Record<string, Rule> {
    const out: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(rules)) {
        out[name] = simplifyRule(rule, wordMatcher)
    }
    return out
}

/**
 * Compile the grammar's `word` rule into a full-string matcher.
 * Tree-sitter's `word:` declaration points at the lexer production
 * used for word recognition (typically an identifier pattern). Any
 * string whose text fully matches this pattern lexes as a word at
 * parse time; everything else is a delimiter or operator token.
 *
 * Handles the common word-rule shapes:
 *   - direct pattern rule — an identifier with a regex value
 *   - token(seq(alpha, repeat(alphanumeric))) — js/ts style
 *   - any composition of seq, choice, optional, repeat, repeat1,
 *     string, pattern, token, terminal
 *
 * Returns `undefined` when the grammar has no `word` rule or when
 * the rule contains shapes this walker doesn't understand (e.g.
 * symbol references into other rules). Callers fall back to a
 * generic `/^\w+$/` heuristic in that case.
 */
export function compileWordMatcher(
    word: string | null | undefined,
    rules: Record<string, Rule>,
): RegExp | undefined {
    if (!word) return undefined
    const wordRule = rules[word]
    if (!wordRule) return undefined
    const src = ruleToRegexSource(wordRule)
    if (src === null) return undefined
    const full = `^(?:${src})$`
    try { return new RegExp(full, 'u') }
    catch {
        try { return new RegExp(full) }
        catch { return undefined }
    }
}

/**
 * Convert a Rule subtree to a regex source fragment. Returns `null`
 * for shapes that can't be expressed as a single regex — notably
 * symbol references (which would need another rule lookup) and
 * anything outside the supported text-terminal shapes.
 */
function ruleToRegexSource(rule: Rule): string | null {
    switch (rule.type) {
        case 'pattern':
            return rule.value
        case 'string':
            return escapeRegexLiteral(rule.value)
        case 'token':
        case 'terminal':
            return ruleToRegexSource((rule as { content: Rule }).content)
        case 'seq': {
            const parts: string[] = []
            for (const m of rule.members) {
                const p = ruleToRegexSource(m)
                if (p === null) return null
                parts.push(`(?:${p})`)
            }
            return parts.join('')
        }
        case 'choice': {
            const parts: string[] = []
            for (const m of rule.members) {
                const p = ruleToRegexSource(m)
                if (p === null) return null
                parts.push(p)
            }
            return `(?:${parts.join('|')})`
        }
        case 'optional': {
            const p = ruleToRegexSource(rule.content)
            if (p === null) return null
            return `(?:${p})?`
        }
        case 'repeat': {
            const p = ruleToRegexSource(rule.content)
            if (p === null) return null
            return `(?:${p})*`
        }
        case 'repeat1': {
            const p = ruleToRegexSource(rule.content)
            if (p === null) return null
            return `(?:${p})+`
        }
        default:
            // symbol / field / variant / supertype / enum / indent /
            // dedent / newline — none of these have a single regex
            // representation without additional context.
            return null
    }
}

function escapeRegexLiteral(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
