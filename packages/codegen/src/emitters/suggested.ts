/**
 * Emits overrides.suggested.ts — a runnable TypeScript module that
 * exports every derivation Link produced as real data and (more
 * importantly) as copy-pasteable grammar-extension snippets.
 *
 * Two tiers of content:
 *   1. `export const` data arrays (`promotedRules`, `inferredFields`,
 *      `repeatedShapes`) for programmatic consumption.
 *   2. A `suggestedRules` object literal whose entries match the
 *      shape of `overrides.ts` — each entry is a real
 *      `transform(original, { ... })` / `choice(...)` expression
 *      ready to drop into your `grammar(base, { rules })` map.
 *
 * The file is syntactically valid TypeScript. Nothing is commented
 * out: the suggested rules sit alongside the data exports so a
 * curator can import either, or pull specific entries out by hand.
 */

import type { NodeMap, DerivationLog, InferredFieldEntry, PromotedRuleEntry, RepeatedShapeEntry, Rule } from '../compiler/rule.ts'

/**
 * Locate the first CHOICE reachable from the rule root through the
 * transparent composition wrappers that `variant()` can target — seq
 * members + single-content wrappers. Returns the path to that choice
 * (joinable with `/`) plus a suggested variant name per alternative.
 * Names come from `tagVariants` when present (`variant.name` — "semi",
 * "form_1", ...); fall back to `form_N` for untagged choices.
 *
 * Returns null if no choice is reachable — the rule isn't a polymorph
 * candidate despite Link's suggestion (rare but possible when multiple
 * passes run; defensive).
 */
function locateTopLevelChoice(
    rule: Rule,
): { choicePath: string; arms: string[] } | null {
    function walk(node: Rule, path: string): { choicePath: string; arms: string[] } | null {
        if (node.type === 'choice') {
            // Disambiguate duplicate variant names — `tagVariants`
            // assigns the same label to structurally-identical
            // alternatives (e.g. export_statement has three "export"
            // variants). Appending a 2/3/... suffix to collisions keeps
            // them unique for `registerPolymorphVariant`'s uniqueness
            // guard, which rejects same-parent duplicates at eval time.
            const counts = new Map<string, number>()
            const arms = node.members.map((m, i) => {
                const base = m.type === 'variant' ? m.name : `form${i}`
                const seen = counts.get(base) ?? 0
                counts.set(base, seen + 1)
                return seen === 0 ? base : `${base}${seen + 1}`
            })
            return { choicePath: path, arms }
        }
        if (node.type === 'seq') {
            for (let i = 0; i < node.members.length; i++) {
                const m = node.members[i]!
                const sub = walk(m, path === '' ? `${i}` : `${path}/${i}`)
                if (sub) return sub
            }
            return null
        }
        if (node.type === 'optional' || node.type === 'variant' || node.type === 'group' || node.type === 'clause') {
            return walk(node.content, path === '' ? '0' : `${path}/0`)
        }
        return null
    }
    return walk(rule, '')
}

/**
 * Find the position index of `targetSymbol` within a top-level SEQ rule.
 * Matches both the bare symbol (held inference — pipeline didn't rewrite)
 * and the already-wrapped `field(fieldName, symbol(targetSymbol))` shape
 * (applied inference). Returns null when the rule is not a SEQ at the
 * top level or the target can't be located as a direct member.
 */
function findSymbolPosition(
    rule: Rule,
    targetSymbol: string,
    fieldName: string,
): number | null {
    if (rule.type !== 'seq') return null
    const unwrap = (r: Rule): Rule => {
        switch (r.type) {
            case 'optional':
            case 'variant':
            case 'group':
            case 'clause':
                return unwrap(r.content)
            default:
                return r
        }
    }
    for (let i = 0; i < rule.members.length; i++) {
        const m = unwrap(rule.members[i]!)
        if (m.type === 'symbol' && m.name === targetSymbol) return i
        if (
            m.type === 'field'
            && m.name === fieldName
            && unwrap(m.content).type === 'symbol'
            && (unwrap(m.content) as { name: string }).name === targetSymbol
        ) {
            return i
        }
    }
    return null
}

/**
 * Round-trip diagnostic captured by corpus validation. One entry per
 * corpus case that failed parse → readNode → render → reparse: we
 * surface the offending rule kind plus an input/output diff so the
 * user can spot the drop (typically a missing `joinBy` separator, a
 * `transform()` patch that would wrap a repeated slot, or a render
 * template gap). Emitted as a dedicated section at the top of
 * overrides.suggested.ts.
 */
export interface RoundTripDiagnostic {
    /** Corpus entry name (e.g., "Async / await used as identifiers"). */
    readonly entry: string
    /** Rule kind the validator was testing. */
    readonly kind: string
    /**
     * Which validator raised the diagnostic:
     *  - 'render' — `parse → readNode → render → reparse`
     *    (template / routing / joinBy issues)
     *  - 'factory' — `parse → readNode → factory() → render → reparse`
     *    (factory API surface gaps: missing fields, wrong defaults)
     */
    readonly source: 'render' | 'factory'
    /** What broke — 'parse-error' (rendered text unparseable) or 'ast-mismatch' (structural drift). */
    readonly category: 'parse-error' | 'ast-mismatch'
    /** Input source text. */
    readonly input?: string
    /** Rendered text (what the renderer emitted). Absent when parse-error occurs before render. */
    readonly rendered?: string
    /** Human-readable message from the validator. */
    readonly message: string
}

export interface EmitSuggestedConfig {
    grammar: string
    nodeMap: NodeMap
    /** Corpus round-trip diagnostics, collected by CLI --roundtrip. */
    roundTripFailures?: readonly RoundTripDiagnostic[]
}

export function emitSuggested(config: EmitSuggestedConfig): string {
    const { grammar, nodeMap, roundTripFailures = [] } = config
    const log: DerivationLog = nodeMap.derivations
    const lines: string[] = []

    lines.push('// Auto-generated by @sittir/codegen — DO NOT EDIT')
    lines.push('//')
    lines.push(`// Derivation log for grammar '${grammar}' — copy-pasteable`)
    lines.push('// grammar extension snippets plus the raw data arrays they')
    lines.push('// came from. Every `suggestedRules` entry is a real')
    lines.push('// `transform(...)` or `choice(...)` expression; paste the')
    lines.push('// ones you want into your own overrides.ts.')
    lines.push('')
    lines.push('// @ts-nocheck — the DSL globals (grammar, transform, field,')
    lines.push("// choice, $) are injected by @sittir/codegen's evaluator at")
    lines.push('// runtime. This file is documentation / copy-paste source,')
    lines.push("// not a standalone module; it isn't imported at build time.")
    lines.push('')

    // ---------------------------------------------------------------
    // Summary
    // ---------------------------------------------------------------
    const inferredApplied = log.inferredFields.filter(e => e.applied).length
    const inferredHeld = log.inferredFields.length - inferredApplied
    const promotedApplied = log.promotedRules.filter(e => e.applied).length
    const promotedHeld = log.promotedRules.length - promotedApplied

    lines.push('// ---------------------------------------------------------------')
    lines.push('// Summary')
    lines.push('// ---------------------------------------------------------------')
    lines.push(`// Field inferences:  ${log.inferredFields.length}  (${inferredApplied} applied, ${inferredHeld} held)`)
    lines.push(`// Rule promotions:   ${log.promotedRules.length}  (${promotedApplied} applied, ${promotedHeld} held)`)
    lines.push(`// Repeated shapes:   ${log.repeatedShapes.length}  (advisory — suggested supertypes/groups)`)
    if (roundTripFailures.length > 0) {
        const parseErrors = roundTripFailures.filter(f => f.category === 'parse-error').length
        const astMismatches = roundTripFailures.filter(f => f.category === 'ast-mismatch').length
        const renderFails = roundTripFailures.filter(f => f.source === 'render').length
        const factoryFails = roundTripFailures.filter(f => f.source === 'factory').length
        lines.push(`// Round-trip fails: ${roundTripFailures.length}  (${parseErrors} parse errors, ${astMismatches} AST mismatches; ${renderFails} render, ${factoryFails} factory)`)
    }
    lines.push('')

    // ---------------------------------------------------------------
    // Round-trip failures (corpus diagnostics)
    // ---------------------------------------------------------------
    if (roundTripFailures.length > 0) {
        lines.push('// ---------------------------------------------------------------')
        lines.push('// Round-trip failures — corpus cases that didn\'t survive')
        lines.push('// parse → readNode → render → reparse. Each entry shows the')
        lines.push('// input and rendered text so you can spot what the renderer')
        lines.push('// dropped. Common causes:')
        lines.push('//   - Repeated slot missing a `joinBy` separator (renders only')
        lines.push('//     the first occurrence of a multi-valued field)')
        lines.push('//   - Missing `transform()` patch wrapping an anonymous token')
        lines.push('//     that should be a named field')
        lines.push('//   - Template gap — rule content has no renderable slot for')
        lines.push('//     some structural position')
        lines.push('// ---------------------------------------------------------------')
        // Group by rule kind so related failures cluster.
        const byKind = new Map<string, RoundTripDiagnostic[]>()
        for (const f of roundTripFailures) {
            const arr = byKind.get(f.kind) ?? []
            arr.push(f)
            byKind.set(f.kind, arr)
        }
        lines.push('export const roundTripFailures: Array<{')
        lines.push('  readonly entry: string;')
        lines.push('  readonly kind: string;')
        lines.push('  readonly source: "render" | "factory";')
        lines.push('  readonly category: "parse-error" | "ast-mismatch";')
        lines.push('  readonly input?: string;')
        lines.push('  readonly rendered?: string;')
        lines.push('  readonly message: string;')
        lines.push('}> = [')
        for (const [kind, failures] of byKind) {
            lines.push(`  // --- ${kind} (${failures.length}) ---`)
            for (const f of failures) {
                lines.push(`  {`)
                lines.push(`    entry: ${JSON.stringify(f.entry)},`)
                lines.push(`    kind: ${JSON.stringify(kind)},`)
                lines.push(`    source: ${JSON.stringify(f.source)},`)
                lines.push(`    category: ${JSON.stringify(f.category)},`)
                if (f.input !== undefined) lines.push(`    input:    ${JSON.stringify(f.input)},`)
                if (f.rendered !== undefined) lines.push(`    rendered: ${JSON.stringify(f.rendered)},`)
                lines.push(`    message: ${JSON.stringify(f.message)},`)
                lines.push(`  },`)
            }
        }
        lines.push('];')
        lines.push('')
    }

    // ---------------------------------------------------------------
    // Copy-paste ready rules block
    // ---------------------------------------------------------------
    lines.push('// ---------------------------------------------------------------')
    lines.push('// suggestedRules — drop entries into your overrides.ts rules map.')
    lines.push('// Each key is a rule kind; each value is a transform/choice call')
    lines.push('// that mirrors the shape you\'d hand-write yourself.')
    lines.push('// ---------------------------------------------------------------')
    lines.push('export const suggestedRules = {')

    // Track every kind already emitted at this level. The three
    // sections below (inferred / supertype / repeated shape) can each
    // propose a rule under the same name; object-literal duplicate
    // keys drop all but the last at runtime, so we keep the
    // first-emitted and skip later collisions.
    const emittedKinds = new Set<string>()
    const emit = (key: string, body: () => void): boolean => {
        if (emittedKinds.has(key)) return false
        emittedKinds.add(key)
        body()
        return true
    }
    const quoteKey = (k: string): string => JSON.stringify(k)

    // Group field-inference entries by parent kind so each rule
    // entry carries every inference Link would apply to it in one
    // shot. Every entry's position is resolved from the post-Optimize
    // rule tree so the emitted `transform(original, { POS: field(...) })`
    // snippet is a straight copy-paste (no `N:` TODO stub). Entries
    // on non-SEQ rules (e.g. ts `statement`, which is a CHOICE) don't
    // have a positional slot — those are emitted as a comment-only
    // block since `transform()` can't target a CHOICE arm.
    const inferredByKind = new Map<string, InferredFieldEntry[]>()
    for (const entry of log.inferredFields) {
        const list = inferredByKind.get(entry.kind) ?? []
        list.push(entry)
        inferredByKind.set(entry.kind, list)
    }
    const sortedKinds = [...inferredByKind.keys()].sort()
    for (const kind of sortedKinds) {
        const entries = inferredByKind.get(kind)!
        const parentRule = nodeMap.rules?.[kind]
        const resolved: Array<{ e: InferredFieldEntry; pos: number | null }> = []
        for (const e of entries) {
            const pos = parentRule
                ? findSymbolPosition(parentRule, e.targetSymbol, e.fieldName)
                : null
            resolved.push({ e, pos })
        }
        const positional = resolved.filter(r => r.pos !== null)
        const nonPositional = resolved.filter(r => r.pos === null)

        emit(kind, () => {
            lines.push(`  // ${kind}: ${entries.length} inferred field(s)`)
            if (positional.length > 0) {
                lines.push(`  ${quoteKey(kind)}: ($, original) => transform(original, {`)
                const seen = new Set<string>()
                for (const { e, pos } of positional) {
                    const dkey = `${e.fieldName}::${e.targetSymbol}`
                    if (seen.has(dkey)) continue
                    seen.add(dkey)
                    const tag = e.applied ? 'applied' : 'held'
                    const pct = (e.agreement * 100).toFixed(0)
                    lines.push(`    // [${tag}] ${pct}% agreement, ${e.sampleSize} parents`)
                    lines.push(`    ${pos}: field(${JSON.stringify(e.fieldName)}),  // $.${e.targetSymbol}`)
                }
                lines.push('  }),')
            }
            for (const { e } of nonPositional) {
                const tag = e.applied ? 'applied' : 'held'
                const pct = (e.agreement * 100).toFixed(0)
                lines.push(
                    `  // [${tag}] ${quoteKey(kind)} field '${e.fieldName}' on $.${e.targetSymbol}` +
                    ` — ${pct}% agreement, ${e.sampleSize} parents. Parent rule is not a top-level` +
                    ` SEQ so transform() can't target a position; inference is applied inside Link's` +
                    ` applyInferredFields pass (tree rewrite) rather than via overrides.ts.`,
                )
            }
            lines.push('')
        })
    }

    // Polymorph suggestions — Link's `promotePolymorph` flagged these
    // rules as "could be split into named forms" but left them alone
    // (applied: false) because splitting only runs when the user writes
    // `variant()` in their override. Emit a copy-pasteable snippet that
    // wraps each choice alternative with `variant('<name>')`, so the
    // author can drop it straight into overrides.ts.
    const polymorphHolds = log.promotedRules.filter(
        e => e.classification === 'polymorph' && !e.applied,
    )
    if (polymorphHolds.length > 0) {
        lines.push('  // --- Polymorph candidates (wrap each choice arm in variant()) ---')
    }
    for (const entry of polymorphHolds) {
        const rule = nodeMap.rules?.[entry.kind]
        const located = rule ? locateTopLevelChoice(rule) : null
        if (!located) continue
        const { choicePath, arms } = located
        emit(entry.kind, () => {
            lines.push(`  // [held] polymorph — ${arms.length} alternative(s)`)
            lines.push(`  ${quoteKey(entry.kind)}: ($, original) => transform(original, {`)
            arms.forEach((armName, i) => {
                const key = choicePath === '' ? `${i}` : `${choicePath}/${i}`
                lines.push(`    ${JSON.stringify(key)}: variant(${JSON.stringify(armName)}),`)
            })
            lines.push('  }),')
            lines.push('')
        })
    }

    // Promoted supertypes become `_name: $ => choice($.a, $.b, ...)`
    // rules and get a reminder to list them in the grammar's
    // `supertypes:` array.
    const promotedSupertypes = log.promotedRules.filter(e => e.classification === 'supertype')
    if (promotedSupertypes.length > 0) {
        lines.push('  // --- Promoted supertypes (add matching names to grammar.supertypes) ---')
    }
    for (const entry of promotedSupertypes) {
        const node = nodeMap.nodes.get(entry.kind)
        const subs = (node && node.modelType === 'supertype') ? node.subtypes : []
        emit(entry.kind, () => {
            const tag = entry.applied ? 'applied' : 'held'
            lines.push(`  // [${tag}] promoted supertype`)
            if (subs.length > 0) {
                const choices = subs.map(s => `$.${s}`).join(', ')
                lines.push(`  ${quoteKey(entry.kind)}: $ => choice(${choices}),`)
            } else {
                lines.push(`  ${quoteKey(entry.kind)}: $ => choice(/* no subtypes recorded */),`)
            }
            lines.push('')
        })
    }

    // Repeated-shape candidates — emit the proposed supertype rule
    // verbatim so the author can adopt it by pasting one line plus
    // the supertypes-array entry.
    if (log.repeatedShapes.length > 0) {
        lines.push('  // --- Repeated-shape candidates (reused across ≥2 parents) ---')
    }
    const sortedShapes = [...log.repeatedShapes].sort((a, b) => {
        if (b.parents.length !== a.parents.length) return b.parents.length - a.parents.length
        return a.kinds.length - b.kinds.length
    })
    for (const shape of sortedShapes) {
        emit(shape.suggestedName, () => {
            lines.push(`  // parents: ${shape.parents.join(', ')}`)
            const choices = shape.kinds.map(k => `$.${k}`).join(', ')
            lines.push(`  ${quoteKey(shape.suggestedName)}: $ => choice(${choices}),`)
            lines.push('')
        })
    }

    lines.push('};')
    lines.push('')

    // ---------------------------------------------------------------
    // Raw data exports — typed arrays for programmatic consumption
    // ---------------------------------------------------------------
    lines.push('// ---------------------------------------------------------------')
    lines.push('// Raw derivation data — typed arrays for tooling')
    lines.push('// ---------------------------------------------------------------')
    lines.push('export interface PromotedRule {')
    lines.push('  readonly kind: string;')
    lines.push("  readonly classification: 'enum' | 'supertype' | 'terminal' | 'polymorph';")
    lines.push('  readonly applied: boolean;')
    lines.push('}')
    lines.push('export const promotedRules: readonly PromotedRule[] = [')
    for (const entry of sortedPromotions(log.promotedRules)) {
        lines.push(`  { kind: ${JSON.stringify(entry.kind)}, classification: ${JSON.stringify(entry.classification)}, applied: ${entry.applied} },`)
    }
    lines.push('];')
    lines.push('')

    lines.push('export interface InferredField {')
    lines.push('  readonly kind: string;')
    lines.push('  readonly fieldName: string;')
    lines.push('  readonly targetSymbol: string;')
    lines.push("  readonly confidence: 'high' | 'medium' | 'low';")
    lines.push('  readonly agreement: number;')
    lines.push('  readonly sampleSize: number;')
    lines.push('  readonly applied: boolean;')
    lines.push('}')
    lines.push('export const inferredFields: readonly InferredField[] = [')
    for (const entry of sortedInferences(log.inferredFields)) {
        lines.push(
            '  { ' +
                `kind: ${JSON.stringify(entry.kind)}, ` +
                `fieldName: ${JSON.stringify(entry.fieldName)}, ` +
                `targetSymbol: ${JSON.stringify(entry.targetSymbol)}, ` +
                `confidence: ${JSON.stringify(entry.confidence)}, ` +
                `agreement: ${entry.agreement.toFixed(3)}, ` +
                `sampleSize: ${entry.sampleSize}, ` +
                `applied: ${entry.applied}` +
                ' },',
        )
    }
    lines.push('];')
    lines.push('')

    lines.push('export interface RepeatedShape {')
    lines.push('  readonly suggestedName: string;')
    lines.push('  readonly kinds: readonly string[];')
    lines.push('  readonly parents: readonly string[];')
    lines.push("  readonly shape: 'supertype' | 'group';")
    lines.push('}')
    lines.push('export const repeatedShapes: readonly RepeatedShape[] = [')
    for (const entry of sortedShapes) {
        lines.push(
            '  { ' +
                `suggestedName: ${JSON.stringify(entry.suggestedName)}, ` +
                `kinds: ${JSON.stringify(entry.kinds)}, ` +
                `parents: ${JSON.stringify(entry.parents)}, ` +
                `shape: ${JSON.stringify(entry.shape)}` +
                ' },',
        )
    }
    lines.push('];')
    lines.push('')

    return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Sort helpers — stable, skim-friendly ordering per section
// ---------------------------------------------------------------------------

function sortedPromotions(entries: readonly PromotedRuleEntry[]): PromotedRuleEntry[] {
    const order: Record<PromotedRuleEntry['classification'], number> = {
        supertype: 0, enum: 1, terminal: 2, polymorph: 3,
    }
    return [...entries].sort((a, b) => {
        if (order[a.classification] !== order[b.classification]) {
            return order[a.classification] - order[b.classification]
        }
        return a.kind.localeCompare(b.kind)
    })
}

function sortedInferences(entries: readonly InferredFieldEntry[]): InferredFieldEntry[] {
    return [...entries].sort((a, b) => {
        const aScore = a.agreement * a.sampleSize
        const bScore = b.agreement * b.sampleSize
        if (aScore !== bScore) return bScore - aScore
        return a.kind.localeCompare(b.kind)
    })
}
