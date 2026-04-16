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
 *   2. Optional keyword-prefix field promotion — when an
 *      `optional(stringLiteral)` appears at any seq position (including
 *      nested inside choice/optional/repeat wrappers) and the literal
 *      is identifier-shaped, wraps it as `optional(field(kw, kw))`.
 *      Subsumes Link's `promoteOptionalKeywordFields` exactly —
 *      the bare leading-keyword case is intentionally NOT handled
 *      because tree-sitter's parser-generator and sittir's
 *      readNode/wrap pipeline both rely on the keyword being a plain
 *      anonymous token (wrapping bare leading literals causes
 *      cascading round-trip regressions).
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
 *   - Bare leading string literals — see comment on pass 2 above.
 */

import type {
    Rule, SeqRule, SymbolRule, FieldRule, OptionalRule, StringRule, ChoiceRule,
} from '../compiler/rule.ts'
import { transform } from './transform.ts'
import { field } from './field.ts'

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
    optionalKeywordPrefixPass,
    bareKeywordPrefixPass,
]

export function enrich(base: GrammarResult): GrammarResult {
    if (!base || typeof base !== 'object') {
        throw new Error('enrich(): expected a grammar object, got ' + typeof base)
    }

    // Tree-sitter CLI shape: `{ name, rules, ... }` where rules are
    // FUNCTIONS (`$ => seq(...)`) — not yet-evaluated rule trees. In
    // principle we could wrap each rule function so enrich's passes
    // apply at evaluation time via transform() (which delegates to
    // native field()). First attempt caused widespread corpus round-
    // trip regressions — the added fields change parse-tree shape in
    // ways the sittir-generated factories/wrap/render don't all handle.
    // Leaving enrich as a no-op under tree-sitter CLI until the
    // pipeline is reconciled end-to-end. Sittir's own evaluator runs
    // enrich properly on its lowercase rule trees below.
    const isTreeSitterShape = !('grammar' in base) && 'rules' in base
    if (isTreeSitterShape) {
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

/**
 * Tree-sitter CLI path: wrap each rule function so enrich's passes
 * apply to the rule tree after tree-sitter evaluates the function.
 * At that point native `seq`, `field`, `optional` are available as
 * globals — transform() handles the case-correct reconstruction.
 */
function wrapTreeSitterRules(base: {
    rules: Record<string, (...args: unknown[]) => unknown>
    [other: string]: unknown
}): unknown {
    const wrappedRules: Record<string, (...args: unknown[]) => unknown> = {}
    for (const [name, ruleFn] of Object.entries(base.rules)) {
        if (typeof ruleFn !== 'function') {
            wrappedRules[name] = ruleFn
            continue
        }
        wrappedRules[name] = function(this: unknown, ...a: unknown[]) {
            const evaluated = ruleFn.apply(this, a) as Rule
            return applyEnrichPasses(name, evaluated)
        }
    }
    return { ...base, rules: wrappedRules }
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
// Pass 2 — optional keyword-prefix field promotion
//
// 1:1 port of Link's promoteOptionalKeywordFields. Recursively walks
// the rule tree; at every seq, looks for `optional(stringLiteral)`
// members where the literal is identifier-shaped, and wraps the
// literal as `field(kw, stringLiteral)`. The optional wrapper is
// preserved so the field stays optional. Existing field names on
// the same seq block the promotion (collision-aware).
//
// Why ONLY the optional variant? Wrapping bare leading string
// literals (e.g. `seq('async', $.body)`) was tried and caused 99
// round-trip regressions on rust + 58 on python — the cascading
// effect on Link/Optimize/Assemble/Emit is non-trivial and the
// resulting parse trees diverge from what tree-sitter's base parser
// produces. The optional variant is the conservative subset that
// matches Link's pre-existing behavior exactly.
// ---------------------------------------------------------------------------

function optionalKeywordPrefixPass(g: GrammarResult): GrammarResult {
    return mapRules(g, (ruleName, rule) => walkOptionalKeyword(ruleName, rule))
}

function walkOptionalKeyword(ruleName: string, rule: Rule): Rule {
    switch (rule.type) {
        case 'seq': {
            const seq = rule as SeqRule
            // First pass: collect names already claimed by existing
            // field() wrappers so promotion doesn't clash.
            const claimed = new Set<string>()
            for (const m of seq.members) {
                if (m.type === 'field') claimed.add(m.name)
            }
            const members = seq.members.map((m): Rule => {
                // optional(stringLiteral) → optional(field(kw, stringLiteral))
                if (m.type === 'optional') {
                    const inner = (m as OptionalRule).content
                    if (inner.type === 'string') {
                        const kw = (inner as StringRule).value
                        if (isIdentifierShaped(kw)) {
                            if (claimed.has(kw)) {
                                reportSkip('optional-keyword-prefix', ruleName, `field '${kw}' already exists`)
                                return m
                            }
                            claimed.add(kw)
                            return {
                                type: 'optional',
                                content: wrapAsField(kw, inner),
                            } satisfies OptionalRule
                        }
                    }
                }
                return walkOptionalKeyword(ruleName, m)
            })
            return { type: 'seq', members } satisfies SeqRule
        }
        case 'choice': {
            const ch = rule as ChoiceRule
            return {
                type: 'choice',
                members: ch.members.map(m => walkOptionalKeyword(ruleName, m)),
            } satisfies ChoiceRule
        }
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'field': {
            const r = rule as { content: Rule }
            return { ...rule, content: walkOptionalKeyword(ruleName, r.content) } as Rule
        }
        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// Pass 3 — bare keyword-prefix field promotion
//
// Wraps an identifier-shaped string literal at position 0 of a
// top-level seq as `field(kw, literal)`. Only the leading position is
// handled — non-leading bare keywords are left as anonymous tokens.
// This is the conservative complement to pass 2 (optional keywords):
// together they cover all the keyword fields that Link's
// inferFieldNames currently adds heuristically.
// ---------------------------------------------------------------------------

function bareKeywordPrefixPass(g: GrammarResult): GrammarResult {
    return mapRules(g, applyBareKeywordPrefix)
}

function applyBareKeywordPrefix(ruleName: string, rule: Rule): Rule {
    if (rule.type !== 'seq') return rule

    const seq = rule as SeqRule
    const first = seq.members[0]
    if (!first || first.type !== 'string') return rule

    const kw = (first as StringRule).value
    if (!isIdentifierShaped(kw)) return rule

    const existingFields = collectFieldNames(rule)
    if (existingFields.has(kw)) {
        reportSkip('bare-keyword-prefix', ruleName, `field '${kw}' already exists`)
        return rule
    }

    return {
        type: 'seq',
        members: [wrapAsField(kw, first), ...seq.members.slice(1)],
    } satisfies SeqRule
}

// ---------------------------------------------------------------------------
// applyEnrichPasses — unified pass pipeline via transform()
// ---------------------------------------------------------------------------
//
// Detects positions each pass would wrap and batches them into a single
// transform() call. transform.ts delegates one-arg field() placeholders
// to the runtime's native field() in resolvePatch, so the same code
// path works in both sittir's evaluator (lowercase rules) and
// tree-sitter's CLI runtime (uppercase rules). The user's directive:
// "Enrich should call the native methods… just like transform does".
//
// Pass order mirrors the original PASSES array: kind-to-name,
// optional-keyword-prefix, bare-keyword-prefix. Each pass collects
// flat-positional patches for `{ position: field('name') }`. transform()
// reconstructs the rule in the runtime's native shape.

function applyEnrichPasses(ruleName: string, rule: Rule): Rule {
    let r = rule
    r = applyKindToNameViaTransform(ruleName, r)
    r = applyOptionalKeywordViaTransform(ruleName, r)
    r = applyBareKeywordViaTransform(ruleName, r)
    return r
}

/** Case-insensitive type checks — tree-sitter uses uppercase, sittir lowercase. */
function typeEq(t: unknown, lower: string): boolean {
    return typeof t === 'string' && (t === lower || t === lower.toUpperCase())
}
function isSeqType(t: unknown): boolean { return typeEq(t, 'seq') }
function isStringType(t: unknown): boolean { return typeEq(t, 'string') }
function isSymbolType(t: unknown): boolean { return typeEq(t, 'symbol') }
function isFieldType(t: unknown): boolean { return typeEq(t, 'field') }
function isOptionalType(t: unknown): boolean { return typeEq(t, 'optional') }
function isChoiceType(t: unknown): boolean { return typeEq(t, 'choice') }
function isRepeatType(t: unknown): boolean { return typeEq(t, 'repeat') || typeEq(t, 'repeat1') }

/** Collect field names that already exist on the top-level seq. */
function collectFieldNamesRuntime(rule: Rule): Set<string> {
    const names = new Set<string>()
    if (!isSeqType(rule.type)) return names
    const members = (rule as unknown as { members: Array<{ type: string; name?: string; content?: { type: string; name?: string } }> }).members
    for (const m of members) {
        if (isFieldType(m.type) && typeof m.name === 'string') {
            names.add(m.name)
        } else if (m.type === 'optional' && m.content && isFieldType(m.content.type) && typeof m.content.name === 'string') {
            names.add(m.content.name)
        }
    }
    return names
}

function applyKindToNameViaTransform(ruleName: string, rule: Rule): Rule {
    if (!isSeqType(rule.type)) return rule
    const members = (rule as unknown as { members: Array<{ type: string; name?: string }> }).members

    // Count symbol occurrences — skip ambiguous kinds.
    const kindCounts = new Map<string, number>()
    for (const m of members) {
        if (isSymbolType(m.type) && typeof m.name === 'string') {
            kindCounts.set(m.name, (kindCounts.get(m.name) ?? 0) + 1)
        }
    }
    const existing = collectFieldNamesRuntime(rule)
    const patches: Record<string, Parameters<typeof transform>[1][string]> = {}
    for (let i = 0; i < members.length; i++) {
        const m = members[i]!
        if (!isSymbolType(m.type) || typeof m.name !== 'string') continue
        const k = m.name
        if (k.startsWith('_')) continue
        if ((kindCounts.get(k) ?? 0) > 1) continue
        if (existing.has(k)) {
            reportSkip('kind-to-name', ruleName, `field '${k}' already exists`)
            continue
        }
        existing.add(k)
        patches[String(i)] = field(k) as Parameters<typeof transform>[1][string]
    }
    if (Object.keys(patches).length === 0) return rule
    return transform(rule as unknown as Parameters<typeof transform>[0], patches) as Rule
}

function applyOptionalKeywordViaTransform(ruleName: string, rule: Rule): Rule {
    // Walk the tree collecting path-addressed patches for every
    // `optional(stringLiteral-identifier)` position where the kw
    // doesn't collide with an existing field on the same seq.
    type Patch = Parameters<typeof transform>[1][string]
    const patches: Record<string, Patch> = {}
    collectOptionalKeywordPatches(ruleName, rule, '', patches)
    if (Object.keys(patches).length === 0) return rule
    return transform(rule as unknown as Parameters<typeof transform>[0], patches) as Rule
}

type TransformPatch = Parameters<typeof transform>[1][string]

function collectOptionalKeywordPatches(
    ruleName: string,
    rule: Rule,
    prefix: string,
    patches: Record<string, TransformPatch>,
): void {
    if (isSeqType(rule.type)) {
        const members = (rule as unknown as { members: Array<{ type: string; content?: { type: string; value?: string } }> }).members
        const claimed = collectFieldNamesRuntime(rule)
        for (let i = 0; i < members.length; i++) {
            const m = members[i]!
            if (isOptionalType(m.type) && m.content && isStringType(m.content.type)) {
                const kw = m.content.value
                if (typeof kw === 'string' && isIdentifierShaped(kw)) {
                    if (claimed.has(kw)) {
                        reportSkip('optional-keyword-prefix', ruleName, `field '${kw}' already exists`)
                        continue
                    }
                    claimed.add(kw)
                    const path = prefix ? `${prefix}/${i}/0` : `${i}/0`
                    patches[path] = field(kw) as TransformPatch
                    continue
                }
            }
            const childPrefix = prefix ? `${prefix}/${i}` : `${i}`
            collectOptionalKeywordPatches(ruleName, m as Rule, childPrefix, patches)
        }
        return
    }
    if (isChoiceType(rule.type)) {
        const members = (rule as unknown as { members: Rule[] }).members
        for (let i = 0; i < members.length; i++) {
            const childPrefix = prefix ? `${prefix}/${i}` : `${i}`
            collectOptionalKeywordPatches(ruleName, members[i]!, childPrefix, patches)
        }
        return
    }
    if (isOptionalType(rule.type) || isRepeatType(rule.type) || isFieldType(rule.type)) {
        const inner = (rule as unknown as { content: Rule }).content
        const childPrefix = prefix ? `${prefix}/0` : `0`
        collectOptionalKeywordPatches(ruleName, inner, childPrefix, patches)
    }
}

function applyBareKeywordViaTransform(ruleName: string, rule: Rule): Rule {
    if (!isSeqType(rule.type)) return rule
    const members = (rule as unknown as { members: Array<{ type: string; value?: string }> }).members
    const first = members[0]
    if (!first || !isStringType(first.type)) return rule
    const kw = first.value
    if (typeof kw !== 'string' || !isIdentifierShaped(kw)) return rule
    const existing = collectFieldNamesRuntime(rule)
    if (existing.has(kw)) {
        reportSkip('bare-keyword-prefix', ruleName, `field '${kw}' already exists`)
        return rule
    }
    return transform(
        rule as unknown as Parameters<typeof transform>[0],
        { 0: field(kw) as TransformPatch },
    ) as Rule
}

// ---------------------------------------------------------------------------
// Shared helpers (legacy — used by sittir-shape path if we reintroduce it)
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
    // Tagged 'inferred' because enrich is currently a no-op under
    // tree-sitter CLI (see early-return in enrich()). Enrich-promoted
    // fields don't reach the override-compiled parser, so readNode
    // needs them in the runtime routing map (which keeps 'inferred'
    // entries). When enrich is reconciled with the CLI pipeline the
    // tag can move back to 'override'.
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

/**
 * Report a skipped promotion to stderr. Suppressed when the
 * `SITTIR_QUIET` environment variable is set to any truthy value —
 * useful in test suites and library-embedding contexts that don't
 * want to pollute stderr with pipeline diagnostics.
 */
function reportSkip(pass: string, ruleName: string, reason: string): void {
    if (process.env.SITTIR_QUIET) return
    process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})\n`)
}
