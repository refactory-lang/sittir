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

import type { Rule, ChoiceRule, SeqRule, FieldRule } from './rule.ts'

/** Does this string lex as a "word" under the grammar's `word` rule? */
function isKeywordShape(value: string, wordMatcher: RegExp | undefined): boolean {
    if (wordMatcher) return wordMatcher.test(value)
    return /^\w+$/.test(value)
}

export function simplifyRule(rule: Rule, wordMatcher?: RegExp, inField: boolean = false): Rule {
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
            //
            // Flatten nested-seq members (`seq(a, seq(b, c), d)` →
            // `seq(a, b, c, d)`). Grammar authors occasionally wrap
            // a sub-sequence inline — canonical form has a flat
            // top-level seq so derivation can filter-and-project
            // without descending. Canonical example from rust:
            // `_array_expression_semi` wraps `seq(elements, ';',
            // length)` inside the outer bracketed-seq.
            const members = rule.members
                .map(m => simplifyRule(m, wordMatcher, inField))
                .filter(m => {
                    if (m.type === 'string' && !isKeywordShape(m.value, wordMatcher)) return false
                    if (m.type === 'seq' && m.members.length === 0) return false
                    return true
                })
                .flatMap(m => m.type === 'seq' ? m.members : [m])
            if (members.length === 0) return { type: 'seq', members: [] }
            if (members.length === 1) return members[0]!
            return { type: 'seq', members }
        }
        case 'choice': {
            const members = rule.members.map(m =>
                m.type === 'variant' ? simplifyRule(m.content, wordMatcher, inField) : simplifyRule(m, wordMatcher, inField)
            )
            if (members.length === 1) return members[0]!
            return { type: 'choice', members }
        }
        case 'optional': {
            const inner = simplifyRule(rule.content, wordMatcher, inField)
            // If the body vanished after simplification — either an
            // empty seq sentinel OR a bare non-word-shaped string
            // literal left behind (`optional(',')` for trailing-separator
            // hints, `optional(';')` for statement terminators) — the
            // whole optional contributes nothing derivation cares
            // about. Fold to the empty-seq sentinel so enclosing seqs
            // filter it out.
            //
            // Exception: inside a FIELD, a bare anonymous string is
            // structural content the field explicitly labels (e.g.
            // `field('lifetime', optional('&'))` in rust's
            // self_parameter). Preserve the optional(string) so the
            // field slot sees the `&` terminal in its values.
            if (inner.type === 'seq' && inner.members.length === 0) {
                return { type: 'seq', members: [] }
            }
            if (!inField && inner.type === 'string' && !isKeywordShape(inner.value, wordMatcher)) {
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
            return { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
        case 'repeat1':
            return { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
        case 'field':
            // Recurse into the field's content so inner anonymous
            // delimiters get stripped. The field wrapper itself stays
            // intact — its `name` is the derivation anchor. Thread
            // `inField=true` so `optional(anonymous-string)` inside
            // the field survives (it's labelled content, not a hint).
            return { ...rule, content: simplifyRule(rule.content, wordMatcher, true) }
        case 'group':
            return { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
        case 'variant':
            // Variants carry a name that polymorph promotion reads.
            // Preserve the wrapper around the simplified content.
            return { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
        case 'clause':
            return { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
        default:
            // string / pattern / enum / symbol / supertype / token /
            // terminal / polymorph / indent / dedent / newline all
            // pass through unchanged: atomic leaves or opaque text.
            return rule
    }
}

/**
 * Simplify every rule in an OptimizedGrammar's rules map.
 *
 * Pipeline per rule (spec 013):
 *   1. `simplifyRule` — strip anon delimiters, collapse single-member
 *      wrappers (legacy behavior).
 *   2. `canonicalize` — merge structurally-equivalent choice branches
 *      so same-named fields across branches fuse into a single
 *      `field(name, choice(v1, v2, …))`. Closes the root cause of
 *      `BinaryExpression.operator: AutoStamp<"&&">`-style bugs where
 *      derivation walked an uncanonical tree and silently dropped
 *      duplicate-named field occurrences across choice branches.
 */
export function simplifyRules(
    rules: Record<string, Rule>,
    wordMatcher?: RegExp,
): Record<string, Rule> {
    const out: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(rules)) {
        out[name] = normalizeToFixpoint(rule, wordMatcher)
    }
    return out
}

/**
 * Run `simplifyRule` + `canonicalize` to fixpoint. Each individual
 * transformation is non-increasing on rule nesting and designed to be
 * idempotent on its own, but the two passes can enable each other —
 * e.g. canonicalize may merge a choice into a seq whose inner members
 * are shapes simplifyRule can further collapse (single-member seqs,
 * empty-seq sentinels from freshly-stripped literals, etc.). A single
 * forward pass misses those cascaded simplifications.
 *
 * The loop terminates because both transformations are non-increasing
 * on the rule's structural size (member counts, nesting depth); any
 * change produces a strictly smaller tree by one of those metrics.
 * Safety cap at 16 iterations — a real grammar converges in 2-3.
 */
function normalizeToFixpoint(rule: Rule, wordMatcher?: RegExp): Rule {
    const MAX_ITERS = 16
    let current = rule
    for (let i = 0; i < MAX_ITERS; i++) {
        const next = canonicalize(simplifyRule(current, wordMatcher))
        if (rulesStructurallyEqual(current, next)) return next
        current = next
    }
    console.warn(`[simplify] normalizeToFixpoint: ${MAX_ITERS} iterations reached without convergence — returning last iteration`)
    return current
}

/**
 * Structural Rule equality — compares all discriminant + content fields
 * recursively. Used by the simplify fixpoint loop to detect
 * convergence. JSON-stringify is deterministic enough for this: Rule
 * nodes are plain data (no Maps, Sets, or symbols), order of keys is
 * stable because we control their construction, and nested arrays /
 * objects are compared element-wise via stringify. Slightly wasteful
 * at O(n) per iteration, but n is small (a grammar's rules are in the
 * hundreds) and the loop runs once per codegen.
 */
function rulesStructurallyEqual(a: Rule, b: Rule): boolean {
    return JSON.stringify(a) === JSON.stringify(b)
}

// ---------------------------------------------------------------------------
// Canonicalization (spec 013)
// ---------------------------------------------------------------------------
//
// After `simplifyRule`'s strip-and-collapse, a rule may still sit in a
// shape that mixes structural ambiguity into the top-level surface — most
// notably `choice(seq(field('a', x1), ...), seq(field('a', x2), ...))`
// where every branch carries the same field names but DIFFERENT contents.
// Derivation today handles this with per-case merge logic in
// `deriveFieldsRaw`, and gets it subtly wrong (drops duplicates, misses
// nested choice coverage, silently auto-stamps constants that should be
// literal unions).
//
// `canonicalize(rule)` — the 013 normalization — transforms the rule into
// a canonical flat form whose TOP-LEVEL members map 1:1 to the node's
// surface (fields + unnamed children). Derivation post-canonicalization
// reduces to a filter-and-project over the top-level seq members.
//
// The pipeline is bottom-up: each transformation recurses into
// content/members first, then applies at the current level. Composition
// is deterministic; running canonicalize twice is a no-op (idempotent).
//
// Additive: Phase 1 lands this function without wiring it into the main
// simplify pipeline — callers that want the canonical form invoke it
// explicitly. Phase 2 (separate commit) flips `simplifyRules` to apply
// canonicalize after simplifyRule, at which point downstream derivation
// gets the bug fixes automatically.
//
// Shape example (after canonicalize, a rule's top-level seq directly
// reflects its fields + unnamed children; derivation becomes a
// filter/project over members):
//
//   before (post-simplifyRule, still ambiguous):
//     choice(
//       seq(field('left', E), field('operator', '&&'), field('right', E)),
//       seq(field('left', E), field('operator', '||'), field('right', E)),
//       seq(field('left', E), field('operator', '+'),  field('right', E)),
//     )
//
//   after (canonicalize):
//     seq(
//       field('left', E),
//       field('operator', choice('&&', '||', '+')),
//       field('right', E),
//     )
export function canonicalize(rule: Rule): Rule {
    // Recurse into content / members FIRST (bottom-up), then apply the
    // transformations at this level. Each pass expects its input to
    // already be in canonical form below.
    const recursed = recurseCanonicalize(rule)
    if (recursed.type === 'choice') return mergeChoiceBranches(recursed)
    return recursed
}

/**
 * Recurse canonicalize into a rule's content / members. Leaves atomic
 * rules (strings, patterns, symbols, supertypes, enums, terminals,
 * indent/dedent/newline) untouched.
 */
function recurseCanonicalize(rule: Rule): Rule {
    switch (rule.type) {
        case 'seq':
        case 'choice':
            return { ...rule, members: rule.members.map(canonicalize) } as Rule
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'field':
        case 'group':
        case 'variant':
        case 'clause':
        case 'token':
        case 'terminal':
        case 'alias':
            return { ...rule, content: canonicalize((rule as { content: Rule }).content) } as Rule
        case 'polymorph':
            return {
                ...rule,
                forms: rule.forms.map(f => ({ ...f, content: canonicalize(f.content) })),
            }
        default:
            return rule
    }
}

/**
 * Merge a choice-of-structurally-equivalent-branches into a flat seq
 * with per-position unioned contents.
 *
 * Shape example:
 *
 *   before:
 *     choice(
 *       seq(field('op', '&&'), …),
 *       seq(field('op', '||'), …),
 *       seq(field('op', '+'),  …),
 *     )
 *
 *   after:
 *     seq(field('op', choice('&&', '||', '+')), …)
 *
 * Fires when every branch:
 *   - Is a seq (or is a variant/group-wrapped seq, which
 *     `recurseCanonicalize` has left visible).
 *   - Has the same LENGTH as every other branch.
 *   - At each position: same member kind (field / symbol / supertype /
 *     etc.), and same field name (for fields) / same symbol name
 *     (for symbols).
 *
 * For field positions the merged content is `choice(branch0_content,
 * branch1_content, …)` — the union of per-branch contents. Derivation
 * post-merge sees ONE `field('op', choice(...))` instead of N
 * `field('op', …)` occurrences across branches, and
 * `deriveValuesForRule` on the choice emits all literal / symbol
 * values cleanly.
 *
 * For non-field positions (symbol, supertype, bare string) the content
 * is already identical across branches (shape equivalence check), so
 * we pick the first branch's occurrence as canonical.
 *
 * When the shape-equivalence check fails — branches differ in length,
 * kind, or field name — returns the input unchanged. Polymorph /
 * supertype / enum classification handles those cases downstream.
 *
 * Called bottom-up: branches passed in have already been
 * canonicalized, so nested choice-of-equivalent-branches inside a
 * branch has already been flattened.
 */
function mergeChoiceBranches(rule: ChoiceRule): Rule {
    if (rule.members.length === 0) return rule
    // NEVER unwrap variant() — variants mark intentional polymorph-
    // distinct branches that must retain their identity. If ANY
    // member is variant-wrapped, bail: this choice is a polymorph
    // surface, not a mergeable same-shape choice.
    if (rule.members.some(m => m.type === 'variant')) return rule
    // Unwrap only group/clause wrappers (purely structural).
    const unwrapped = rule.members.map(unwrapForMerge)
    // Special case: every branch is a bare `field` of the same name.
    // Emerges after optimize's factorSeqChoice peels a shared
    // prefix/suffix off a homogeneous-seq choice, leaving a choice
    // over just the discriminator field — e.g. rust binary_expression
    // post-factor: `choice(field('operator', '&&'), field('operator',
    // '||'), …)`. Merge into a single `field(name, choice(contents))`.
    if (unwrapped.every((b): b is FieldRule => b.type === 'field')) {
        const first = unwrapped[0]!
        if (unwrapped.every(f => f.name === first.name)) {
            return mergePosition(unwrapped)
        }
    }
    // Every branch must be a seq of the same length.
    if (!unwrapped.every((b): b is SeqRule => b.type === 'seq')) return rule
    const len = unwrapped[0]!.members.length
    if (!unwrapped.every(b => b.members.length === len)) return rule
    // Check position-by-position structural equivalence.
    for (let i = 0; i < len; i++) {
        const position = unwrapped.map(b => b.members[i]!)
        if (!positionsAreMergeable(position)) return rule
    }
    // All positions mergeable. Build the merged seq.
    const mergedMembers: Rule[] = []
    for (let i = 0; i < len; i++) {
        const position = unwrapped.map(b => b.members[i]!)
        mergedMembers.push(mergePosition(position))
    }
    if (mergedMembers.length === 0) return { type: 'seq', members: [] }
    if (mergedMembers.length === 1) return mergedMembers[0]!
    return { type: 'seq', members: mergedMembers }
}

/**
 * Peel `group` wrappers to expose the seq inside.
 *
 * **Only sequences and groups are mergeable.** `variant` wrappers mark
 * intentional polymorph-distinct branches and must never be unwrapped
 * here (the caller bails before reaching us if any member is variant).
 * `clause` carries semantic identity too — leave as-is.
 */
function unwrapForMerge(rule: Rule): Rule {
    if (rule.type === 'group') return unwrapForMerge(rule.content)
    return rule
}

/**
 * Are these positions (one per branch, all at the same seq index)
 * structurally equivalent — same kind, same discriminator (field name /
 * symbol name)? If yes they can be merged by unioning contents. If no,
 * the enclosing choice is structurally heterogeneous and stays as-is.
 */
function positionsAreMergeable(position: readonly Rule[]): boolean {
    if (position.length === 0) return true
    const first = position[0]!
    if (first.type === 'field') {
        return position.every(p => p.type === 'field' && p.name === first.name)
    }
    if (first.type === 'symbol') {
        return position.every(p => p.type === 'symbol' && p.name === first.name)
    }
    if (first.type === 'supertype') {
        return position.every(p => p.type === 'supertype' && p.name === first.name)
    }
    if (first.type === 'string') {
        // Same literal at same position is fine. Different literals at
        // same position means the literal itself is the discriminator
        // — that's the "choice of literals" case (handled by
        // separator / enum detection; leave for now).
        return position.every(p => p.type === 'string' && p.value === first.value)
    }
    // Other kinds: structurally identical means equal by shape.
    // Conservative: require literal JSON equality.
    const firstJson = JSON.stringify(first)
    return position.every(p => JSON.stringify(p) === firstJson)
}

/**
 * Merge N same-position rules (already verified as mergeable) into a
 * single canonical rule.
 *
 * - Fields: same name, possibly different content → `field(name,
 *   choice(content1, content2, …))`. Deduplicate equal contents.
 * - Symbols / supertypes / strings: return the first — all are
 *   identical by the mergeability check.
 */
function mergePosition(position: readonly Rule[]): Rule {
    const first = position[0]!
    if (first.type === 'field') {
        const fields = position.filter((p): p is FieldRule => p.type === 'field')
        const contents = dedupeByJson(fields.map(f => f.content))
        const mergedContent: Rule = contents.length === 1
            ? contents[0]!
            : { type: 'choice', members: contents }
        return { ...first, content: mergedContent }
    }
    return first
}

/** Deduplicate rules by JSON equality, preserving first-seen order. */
function dedupeByJson(rules: readonly Rule[]): Rule[] {
    const seen = new Set<string>()
    const out: Rule[] = []
    for (const r of rules) {
        const key = JSON.stringify(r)
        if (seen.has(key)) continue
        seen.add(key)
        out.push(r)
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
// compileWordMatcher moved to ./common.ts — it is consumed by assemble,
// optimize, and emitters/templates.ts, so it belongs in a shared utility
// module rather than in the "simplify" phase file.
