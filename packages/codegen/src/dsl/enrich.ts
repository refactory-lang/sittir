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
 *      field name, wraps it as `field('kind', $.kind, source: 'override')`.
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

import type { Rule } from '../compiler/rule.ts'
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

export function enrich(base: GrammarResult): GrammarResult {
    if (!base || typeof base !== 'object') {
        throw new Error('enrich(): expected a grammar object, got ' + typeof base)
    }

    // Emit enrich as a set of OVERRIDE callbacks (one per base rule),
    // matching how variant() is handled: each override runs at rule
    // evaluation time, inspects `original`, and calls transform() with
    // enrich-computed patches. Synthetic rules registered during
    // transform.ts:resolvePatch land in the same scope as variant()'s
    // synthetic rules — discovered by installGrammarWrapper's pass 1
    // dry-run (tree-sitter CLI) or by withSyntheticRuleScope (sittir
    // evaluate). No rule-function wrapping; same path in both runtimes.
    //
    // Attach the generated overrides to the returned base via a
    // sentinel property. grammar() (wrappedGrammar for tree-sitter CLI,
    // grammarFn for sittir) merges them into opts.rules before
    // evaluating — user overrides win on name collisions.
    const rulesBag: Record<string, unknown> = ('grammar' in base ? base.grammar?.rules : (base as unknown as { rules?: unknown }).rules) as Record<string, unknown> ?? {}
    const enrichOverrides: Record<string, (...args: unknown[]) => unknown> = {}
    for (const name of Object.keys(rulesBag)) {
        enrichOverrides[name] = function(this: unknown, _$: unknown, original: unknown): unknown {
            return applyEnrichPasses(name, original as Rule)
        }
    }
    Object.defineProperty(base, '__enrichOverrides__', {
        value: enrichOverrides,
        enumerable: false,
        configurable: true,
        writable: false,
    })
    return base
}

// ---------------------------------------------------------------------------
// Legacy mapRules-based passes deleted — the sittir-shape path now goes
// through applyEnrichPasses (transform()-based) for bit-identical
// behavior with the tree-sitter CLI wrapper path.
// ---------------------------------------------------------------------------

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
    // bare + optional keyword passes use symbol-alias trick: register
    // a hidden helper rule `_kw_<kw>: 'kw'` and emit FIELD(kw, SYM)
    // instead of FIELD(kw, STRING). Tree-sitter preserves FIELD around
    // SYMBOL, so these fields land in the parse tree natively.
    r = applyBareKeywordViaTransform(ruleName, r)
    r = applyOptionalKeywordViaTransform(ruleName, r)
    return r
}

// fieldOverKeywordSymbol — removed. Bare and optional keyword passes
// now use the exact same pattern as kindToName: transform() with a
// field() placeholder wrapping the original member. Tree-sitter
// strips FIELD around bare STRING during grammar normalization, but
// readNode's promoteAnonymousKeyword picks these up at runtime (the
// anonymous token's type IS its text, so the promotion is direct).

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

/**
 * Normalize a rule member to a structured form. Tree-sitter's DSL lets
 * rule functions pass BARE JS values (plain strings for STRING, plain
 * regexes for PATTERN) as sequence members — they're interpreted when
 * tree-sitter builds the grammar. Our walker operates on the OUTPUT of
 * the rule function before tree-sitter's normalization, so we see the
 * raw mixed shape. Normalize to a virtual `{type:'STRING', value}` /
 * `{type:'PATTERN', value}` so downstream code can treat the member
 * uniformly. For objects with a type, return as-is.
 */
function normalizeMember(m: unknown): { type: string; value?: string; content?: unknown; members?: unknown[]; name?: string } {
    if (typeof m === 'string') return { type: 'STRING', value: m }
    if (m instanceof RegExp) return { type: 'PATTERN', value: m.source }
    return (m as { type: string }) ?? { type: 'UNKNOWN' }
}

/** Collect field names that already exist on the top-level seq. */
function collectFieldNamesRuntime(rule: Rule): Set<string> {
    const names = new Set<string>()
    if (!isSeqType(rule.type)) return names
    const members = (rule as unknown as { members: unknown[] }).members
    for (const raw of members) {
        const m = normalizeMember(raw)
        if (isFieldType(m.type) && typeof m.name === 'string') {
            names.add(m.name)
            continue
        }
        // optional(field(...))
        const peeled = peelOptional(m as unknown as Rule)
        if (peeled.isOptional) {
            const innerN = normalizeMember(peeled.inner)
            if (isFieldType(innerN.type) && typeof innerN.name === 'string') {
                names.add(innerN.name)
            }
        }
    }
    return names
}

function applyKindToNameViaTransform(ruleName: string, rule: Rule): Rule {
    if (!isSeqType(rule.type)) return rule
    const raw = (rule as unknown as { members: unknown[] }).members
    const members = raw.map(normalizeMember)

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

/**
 * Detect `optional(content)` across both runtimes:
 * - sittir shape: `{ type: 'optional', content }`
 * - tree-sitter post-evaluation: `{ type: 'CHOICE', members: [content, {BLANK}] }`
 *
 * Returns the inner content + whether the rule is "optional-shaped".
 */
function peelOptional(rule: Rule): { inner: Rule; isOptional: boolean } {
    if (isOptionalType(rule.type)) {
        return { inner: (rule as unknown as { content: Rule }).content, isOptional: true }
    }
    if (isChoiceType(rule.type)) {
        const members = (rule as unknown as { members: Array<{ type: string }> }).members
        if (members.length === 2) {
            const blankIdx = members.findIndex(m => m.type === 'BLANK' || m.type === 'blank')
            if (blankIdx !== -1) {
                const inner = members[1 - blankIdx] as unknown as Rule
                return { inner, isOptional: true }
            }
        }
    }
    return { inner: rule, isOptional: false }
}

function collectOptionalKeywordPatches(
    ruleName: string,
    rule: Rule,
    prefix: string,
    patches: Record<string, TransformPatch>,
): void {
    if (isSeqType(rule.type)) {
        const raw = (rule as unknown as { members: unknown[] }).members
        const claimed = collectFieldNamesRuntime(rule)
        for (let i = 0; i < raw.length; i++) {
            const m = normalizeMember(raw[i])
            const peeled = peelOptional(m as unknown as Rule)
            if (peeled.isOptional) {
                const innerN = normalizeMember(peeled.inner)
                if (isStringType(innerN.type)) {
                    const kw = innerN.value
                    if (typeof kw === 'string' && isIdentifierShaped(kw)) {
                        if (claimed.has(kw)) {
                            reportSkip('optional-keyword-prefix', ruleName, `field '${kw}' already exists`)
                            continue
                        }
                        claimed.add(kw)
                        // Path to the inner string:
                        //   sittir optional: `${i}/0` (content is child 0 of optional)
                        //   tree-sitter CHOICE(content, BLANK) or (BLANK, content):
                        //     use the member index where non-BLANK lives.
                        let innerPath: string
                        if (isOptionalType(m.type)) {
                            innerPath = '0'
                        } else {
                            const cm = (m as unknown as { members: unknown[] }).members
                            const strIdx = cm.findIndex(x => {
                                const n = normalizeMember(x)
                                return n.type !== 'BLANK' && n.type !== 'blank'
                            })
                            innerPath = String(strIdx)
                        }
                        const fullPath = prefix ? `${prefix}/${i}/${innerPath}` : `${i}/${innerPath}`
                        patches[fullPath] = field(kw) as TransformPatch
                        continue
                    }
                }
            }
            const childPrefix = prefix ? `${prefix}/${i}` : `${i}`
            collectOptionalKeywordPatches(ruleName, m as unknown as Rule, childPrefix, patches)
        }
        return
    }
    if (isChoiceType(rule.type)) {
        const raw = (rule as unknown as { members: unknown[] }).members
        for (let i = 0; i < raw.length; i++) {
            const childPrefix = prefix ? `${prefix}/${i}` : `${i}`
            const m = normalizeMember(raw[i])
            collectOptionalKeywordPatches(ruleName, m as unknown as Rule, childPrefix, patches)
        }
        return
    }
    if (isOptionalType(rule.type) || isRepeatType(rule.type) || isFieldType(rule.type)) {
        const inner = normalizeMember((rule as unknown as { content: unknown }).content)
        const childPrefix = prefix ? `${prefix}/0` : `0`
        collectOptionalKeywordPatches(ruleName, inner as unknown as Rule, childPrefix, patches)
    }
}

function applyBareKeywordViaTransform(ruleName: string, rule: Rule): Rule {
    if (!isSeqType(rule.type)) return rule
    const raw = (rule as unknown as { members: unknown[] }).members
    const first = raw[0]
    if (first === undefined) return rule
    const normFirst = normalizeMember(first)
    if (!isStringType(normFirst.type)) return rule
    const kw = normFirst.value
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
// Shared helpers
// ---------------------------------------------------------------------------

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
