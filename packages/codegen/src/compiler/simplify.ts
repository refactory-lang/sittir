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

import type { Rule, ChoiceRule, SeqRule, FieldRule, RepeatRule, Repeat1Rule } from './rule.ts'

/** Does this string lex as a "word" under the grammar's `word` rule? */
/**
 * Test whether a choice member matches the empty string — the canonical
 * signal for "this branch contributes nothing" so the enclosing choice
 * can be simplified to `optional(non-empty-branches)`.
 *
 * @remarks
 * Fires on two shapes:
 *   - `pattern("")` — what evaluate surfaces for tree-sitter external
 *     tokens that have no syntactic content. Appears in `block_comment`
 *     as the `_block_comment_content` placeholder arm.
 *   - Empty seq — `{type: 'seq', members: []}`. simplifyRule produces
 *     this sentinel when an optional/bare-string collapses out; when it
 *     ends up as a choice branch, the same semantics apply.
 */
function isEmptyMatchMember(rule: Rule): boolean {
    if (rule.type === 'pattern' && rule.value === '') return true
    if (rule.type === 'seq' && rule.members.length === 0) return true
    return false
}

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
            // Preserve variant wrappers — `mergeChoiceBranches` relies
            // on them to detect polymorph surfaces (if any branch is
            // variant-wrapped, the choice is intentionally
            // heterogeneous and must NOT be merged into a flat seq).
            // The `variant` case below recurses into variant content
            // normally, so wrappers survive without blocking inner
            // simplification.
            const members = rule.members.map(m => simplifyRule(m, wordMatcher, inField))
            // Fold empty-matching members out of the choice and wrap the
            // remainder in `optional`. Tree-sitter's external-token
            // placeholder surfaces as `pattern("")`, which matches the
            // empty string — structurally equivalent to BLANK. Leaving
            // it as a choice branch makes downstream derivation see a
            // heterogeneous shape; moving it to `optional` matches the
            // semantics exactly and keeps the rule canonical.
            const empty = members.findIndex(isEmptyMatchMember)
            if (empty >= 0 && members.length > 1) {
                const nonEmpty = members.filter((_, i) => i !== empty)
                const inner: Rule = nonEmpty.length === 1
                    ? nonEmpty[0]!
                    : { type: 'choice', members: nonEmpty }
                return simplifyRule({ type: 'optional', content: inner }, wordMatcher, inField)
            }
            if (members.length === 1) return members[0]!
            // Merge structurally-equivalent choice branches so same-
            // named fields across branches fuse into a single field
            // with union content (spec 013). Closes `BinaryExpression.
            // operator: AutoStamp<"&&">`-style bugs where derivation
            // walked an uncanonical tree and silently dropped
            // duplicate-named field occurrences across choice branches.
            const merged = mergeChoiceBranches({ type: 'choice', members })
            if (merged.type !== 'choice') return merged
            // Cross-branch field hoist: if every branch contains exactly
            // one `field(A, ...)` (directly or nested in a seq), lift A
            // out to an enclosing seq and union the contents. Handles
            // shapes where branches differ in length / extra fields
            // (`choice(field(A, X), seq(field(B, Y), field(A, X)))` →
            // `seq(optional(field(B, Y)), field(A, choice(X)))`) that
            // `mergeChoiceBranches` can't touch because it requires
            // same-length same-kind branches.
            return hoistSharedFieldAcrossChoiceBranches(merged)
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
            // Hoist a nested field out — `optional(field(n, X))` is
            // equivalent to `field(n, optional(X))` for derivation, and
            // fields belong at the top so the walker's trivial form
            // applies. See `hoistFieldOutOfSingleContentWrapper`.
            return hoistFieldOutOfSingleContentWrapper({ type: 'optional', content: inner })
        }
        case 'repeat': {
            // Preserve the repeat wrapper AND its metadata
            // (separator / trailing / leading) — derivation reads them
            // to stamp `multiple: true` and attach joinBy hints.
            const next = { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
            return hoistFieldOutOfSingleContentWrapper(next)
        }
        case 'repeat1': {
            const next = { ...rule, content: simplifyRule(rule.content, wordMatcher, inField) }
            return hoistFieldOutOfSingleContentWrapper(next)
        }
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
        out[name] = normalizeToFixpoint(rule, wordMatcher, rules)
    }
    return out
}

/**
 * Run `inlineGroupRefs` + `simplifyRule` + `canonicalize` to fixpoint.
 * Each individual transformation is non-increasing on rule nesting
 * and designed to be idempotent on its own, but the three passes can
 * enable each other:
 *
 *   - `inlineGroupRefs` substitutes a hidden group/multi's body for
 *     its symbol reference. When the body is a seq and the ref sat
 *     inside another seq, the substitution creates a nested-seq
 *     shape `simplifyRule` can flatten.
 *   - `simplifyRule` strips anonymous delimiters and collapses
 *     single-member wrappers; a freshly-stripped branch may enable
 *     `canonicalize` to merge a sibling choice whose arms now agree.
 *   - `canonicalize` merges a choice of structurally-equivalent
 *     branches into a flat seq; the merged members may themselves
 *     be shapes `simplifyRule` can further collapse.
 *
 * The loop terminates because all three transformations are
 * non-increasing on the rule's structural size (member counts,
 * nesting depth); any change produces a strictly smaller tree by one
 * of those metrics. Safety cap at 16 iterations — a real grammar
 * converges in 2-3.
 */
function normalizeToFixpoint(rule: Rule, wordMatcher: RegExp | undefined, rules: Readonly<Record<string, Rule>>): Rule {
    const MAX_ITERS = 16
    let current = rule
    for (let i = 0; i < MAX_ITERS; i++) {
        const next = simplifyRule(inlineGroupRefs(current, rules), wordMatcher)
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
/**
 * Pull a `field()` wrapper OUT of a single-content structural wrapper
 * (`repeat` / `repeat1` / `optional`), so the field's name ends up at
 * the outer structural level:
 *
 *   repeat(field('name', X))   → field('name', repeat(X))
 *   repeat1(field('name', X))  → field('name', repeat1(X))
 *   optional(field('name', X)) → field('name', optional(X))
 *
 * Rationale: the derive walker's trivial form wants fields directly
 * under a seq (or as the top-level rule). Keeping fields buried under
 * structural wrappers forces the walker to thread multiplicity down
 * through each wrapper and unwrap on the way back up. Tree-sitter's
 * field semantics are insensitive to this rewrite — a field can match
 * zero, one, or many children either way — so it's a non-lossy
 * canonicalization.
 *
 * Interplay: after this fires, adjacent fields with the same name are
 * still distinct entries; `mergeChoiceBranches` + the fixpoint loop
 * further collapse `choice(field('n', X), field('n', Y))` into
 * `field('n', choice(X, Y))`, and eventually into unified top-level
 * field seqs. Preserves the repeat's `separator` / `trailing` /
 * `leading` metadata — the walker reads those when stamping joinBy
 * hints.
 */
function hoistFieldOutOfSingleContentWrapper(rule: Rule): Rule {
    if (rule.type !== 'optional' && rule.type !== 'repeat' && rule.type !== 'repeat1') return rule
    const inner = rule.content
    if (inner.type !== 'field') return rule
    const wrapper: Rule = { ...rule, content: inner.content }
    return { ...inner, content: wrapper }
}

/**
 * Cross-branch field hoist — lift a field name shared by every choice
 * branch out to an enclosing seq, unioning the field contents across
 * branches and keeping branch-specific residuals as a side choice:
 *
 *   choice(
 *     field(A, X1),
 *     seq(field(B, Y), field(A, X2)),
 *     seq(field(A, X3), field(C, Z)),
 *   )
 *   →
 *   seq(
 *     field(A, choice(X1, X2, X3)),
 *     optional(choice(field(B, Y), field(C, Z))),
 *   )
 *
 * Covers the `for_in_statement` / `jsx_opening_element` /
 * `except_clause` family of shapes: branches differ in length or
 * extra fields but share a field name. `mergeChoiceBranches` bails on
 * these (it requires same-length same-kind seq branches);
 * `hoistFieldOutOfSingleContentWrapper` doesn't see them (not a single-
 * content wrapper). This pass closes the gap.
 *
 * Position is canonical (hoisted field first in the resulting seq).
 * Template emission reads the RAW rule, not the simplified rule, so
 * reordering field positions here doesn't affect rendering — only
 * downstream derivation, which filter-and-projects over seq members
 * and doesn't care about member order.
 *
 * Safety bails:
 *   - Bails on any variant-wrapped branch (polymorph identity must
 *     be preserved).
 *   - Requires the shared field name to appear EXACTLY ONCE per
 *     branch (multiple same-named fields in one branch could lose
 *     sibling-duplicate semantics).
 *   - One field at a time — the fixpoint loop re-runs simplifyRule
 *     and picks up additional shared fields on subsequent iterations.
 */
function hoistSharedFieldAcrossChoiceBranches(rule: ChoiceRule): Rule {
    if (rule.members.length < 2) return rule
    // Bail on variant-wrapped branches — those are polymorph surfaces
    // and must preserve their identity for the walker's `$variant`
    // dispatch. Caveat: `tagVariants` auto-wraps many un-promoted
    // choices (`_for_header`, `_export_statement_default_form1`, …)
    // with heuristic `variant(form_N)` tags. Those tags block this
    // hoist from running even though no downstream polymorph
    // classification consumes them — leaving the choice non-canonical
    // at derivation. A follow-up (spec 013, unfinished) should strip
    // auto-tagged variants that didn't survive polymorph promotion.
    if (rule.members.some(m => m.type === 'variant')) return rule
    const perBranch = rule.members.map(normalizeBranchToMembers)
    const fieldNameCounts = perBranch.map(countFieldNames)
    const candidate = firstFieldNameSharedExactlyOncePerBranch(fieldNameCounts)
    if (candidate === null) return rule
    return extractFieldAcrossBranches(perBranch, candidate)
}

/**
 * Expand a choice branch into a flat array of its top-level members.
 * A bare non-seq branch becomes a single-element array; a seq branch
 * is returned verbatim so subsequent passes can scan for field
 * occurrences.
 */
function normalizeBranchToMembers(branch: Rule): Rule[] {
    if (branch.type === 'seq') return branch.members
    return [branch]
}

/**
 * Count occurrences of each field name in a branch's top-level
 * members. Nested fields (inside an inner optional / choice / seq)
 * aren't counted — they aren't directly hoistable without rewriting
 * the branch's structural frame.
 */
function countFieldNames(members: Rule[]): Map<string, number> {
    const counts = new Map<string, number>()
    for (const m of members) {
        if (m.type === 'field') counts.set(m.name, (counts.get(m.name) ?? 0) + 1)
    }
    return counts
}

/**
 * Return the first field name that appears EXACTLY ONCE in every
 * branch's top-level members, or null if no such name exists.
 * Deterministic tie-break: the field order of the first branch.
 */
function firstFieldNameSharedExactlyOncePerBranch(perBranchCounts: Map<string, number>[]): string | null {
    if (perBranchCounts.length === 0) return null
    const first = perBranchCounts[0]!
    outer: for (const [name, count] of first) {
        if (count !== 1) continue
        for (let i = 1; i < perBranchCounts.length; i++) {
            if (perBranchCounts[i]!.get(name) !== 1) continue outer
        }
        return name
    }
    return null
}

/**
 * Extract `field(name, ...)` from each branch, union their contents
 * into a single hoisted field, and keep branch-specific residuals as
 * a side choice wrapped in optional when any branch has nothing left.
 */
function extractFieldAcrossBranches(perBranch: Rule[][], name: string): Rule {
    const hoistedContents: Rule[] = []
    const residuals: Rule[] = []
    let hoistedFieldTemplate: FieldRule | null = null
    for (const members of perBranch) {
        const rest: Rule[] = []
        let extracted: FieldRule | null = null
        for (const m of members) {
            if (m.type === 'field' && m.name === name && extracted === null) {
                extracted = m
                continue
            }
            rest.push(m)
        }
        if (!extracted) return { type: 'choice', members: perBranch.map(b => b.length === 1 ? b[0]! : { type: 'seq', members: b }) }
        hoistedFieldTemplate = hoistedFieldTemplate ?? extracted
        hoistedContents.push(extracted.content)
        residuals.push(
            rest.length === 0 ? { type: 'seq', members: [] }
            : rest.length === 1 ? rest[0]!
            : { type: 'seq', members: rest },
        )
    }
    const unionedContent: Rule = hoistedContents.length === 1
        ? hoistedContents[0]!
        : { type: 'choice', members: hoistedContents }
    const hoistedField: Rule = { ...hoistedFieldTemplate!, content: unionedContent }
    const hasEmptyResidual = residuals.some(r => r.type === 'seq' && r.members.length === 0)
    const nonEmptyResiduals = residuals.filter(r => !(r.type === 'seq' && r.members.length === 0))
    if (nonEmptyResiduals.length === 0) return hoistedField
    const residualCore: Rule = nonEmptyResiduals.length === 1
        ? nonEmptyResiduals[0]!
        : { type: 'choice', members: nonEmptyResiduals }
    const residualPart: Rule = hasEmptyResidual
        ? { type: 'optional', content: residualCore }
        : residualCore
    return { type: 'seq', members: [hoistedField, residualPart] }
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

// ---------------------------------------------------------------------------
// Hidden group / multi inlining (moved from assemble.ts to participate in
// the simplify fixpoint).
// ---------------------------------------------------------------------------

/**
 * Inline symbol references to GROUP-classified hidden rules by
 * substituting each `symbol` ref with the group's content. Matches
 * tree-sitter's parse-time behavior: groups are "hidden seq with
 * fields" helpers (e.g. python's `_import_list`) whose fields surface
 * on the referencer's parse tree. Preserving the symbol reference
 * would force the NodeMap to claim a child slot that tree-sitter
 * never produces.
 *
 * Scope limited to GROUPS + MULTI helpers specifically (not all hidden
 * rules):
 *   - Supertypes — polymorph dispatch points; the reference IS the
 *     structural child slot. Stay as-is.
 *   - Other hidden rules (helpers that classify as branch/container
 *     because they lack fields, or leaves/tokens) — no field data
 *     to inline. Stay as-is.
 *   - Visible symbols — distinct parse-tree nodes with their own
 *     $type. Stay as-is.
 *
 * Cycles: visited set prevents infinite loops across chained groups.
 */
export function inlineGroupRefs(
    rule: Rule,
    rules: Readonly<Record<string, Rule>>,
    visited: ReadonlySet<string> = new Set(),
): Rule {
    const recurse = (r: Rule, v: ReadonlySet<string>): Rule => inlineGroupRefs(r, rules, v)
    switch (rule.type) {
        case 'symbol': {
            if (!rule.hidden) return rule
            if (visited.has(rule.name)) return rule
            const target = rules[rule.name]
            if (!target) return rule
            const inlineTarget = resolveGroupOrMultiInlineTarget(target)
            if (!inlineTarget) return rule
            const next = new Set(visited); next.add(rule.name)
            return inlineGroupRefs(inlineTarget, rules, next)
        }
        case 'seq':
            return { ...rule, members: rule.members.map(m => recurse(m, visited)) }
        case 'choice':
            return { ...rule, members: rule.members.map(m => recurse(m, visited)) }
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
            return { ...rule, content: recurse((rule as { content: Rule }).content, visited) } as Rule
        default:
            return rule
    }
}

/**
 * Return the rule to inline for a hidden symbol target, or `null` if the
 * target should not be inlined. Two target shapes are inlined:
 *  - Hidden GROUP rules (`target.type === 'group'`): inline the group's
 *    `content` (the seq-with-fields) so the referrer's field walker
 *    sees the fields directly.
 *  - Hidden MULTI helpers (body unwraps to a `repeat` / `repeat1`):
 *    inline the whole target rule so the wrapper survives and the
 *    walker marks the child slot as multi-valued.
 * All other hidden rules stay as-is — they are distinct structural
 * nodes or dispatch points.
 */
function resolveGroupOrMultiInlineTarget(target: Rule): Rule | null {
    const isGroup = target.type === 'group'
    const isMulti = extractRepeatShape(target) !== null
    if (!isGroup && !isMulti) return null
    return isGroup ? (target as { content: Rule }).content : target
}

/**
 * Unwrap structural wrappers around a repeat / repeat1 so the caller
 * can detect `optional(repeat(...))`, `group(repeat1(...))`, etc.
 * Returns `null` for anything that isn't ultimately a repeat shape.
 */
export function extractRepeatShape(rule: Rule): { repeat: RepeatRule | Repeat1Rule; nonEmpty: boolean } | null {
    switch (rule.type) {
        case 'repeat':
            return { repeat: rule, nonEmpty: false }
        case 'repeat1':
            return { repeat: rule, nonEmpty: true }
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
            return extractRepeatShape((rule as { content: Rule }).content)
        default:
            return null
    }
}
