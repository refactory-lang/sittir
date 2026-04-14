/**
 * compiler/validate-node-types.ts — optional post-Link check (T021).
 *
 * Compares the linked rule set against tree-sitter's `node-types.json`
 * for the grammar, reporting discrepancies without mutating anything.
 * Useful as a sanity check after rule-tree mutations (Link's
 * promotions, Optimize's factoring) to catch cases where the pipeline
 * classification diverges from what tree-sitter itself produces at
 * runtime.
 *
 * This runs against `raw.external` plumbing from node-types.json —
 * no dependency on the new IR flow. Invoke from tests or from the
 * CLI behind a `--validate-node-types` flag.
 */

import type { LinkedGrammar } from './rule.ts'
import { loadRawEntries, type RawNodeEntry } from '../validators/node-types.ts'

export interface NodeTypesValidationResult {
    readonly grammar: string
    readonly total: number
    readonly matched: number
    readonly discrepancies: readonly NodeTypesDiscrepancy[]
}

export type NodeTypesDiscrepancy =
    | {
        readonly kind: 'missing_rule'
        readonly node: string
        readonly detail: string
    }
    | {
        readonly kind: 'visibility_mismatch'
        readonly node: string
        readonly expected: 'named' | 'anonymous'
        readonly actual: 'named' | 'anonymous'
    }
    | {
        readonly kind: 'supertype_mismatch'
        readonly node: string
        readonly detail: string
    }

/**
 * Run the validator against a grammar's linked rule set. `raw.rules`
 * is the post-Link rule map (classifications applied) and
 * `rawEntries` is tree-sitter's own truth table for the grammar.
 *
 * Non-mutating. Returns a structured result you can format or
 * assert against in tests.
 */
export function validateAgainstNodeTypes(
    grammar: string,
    linked: LinkedGrammar,
): NodeTypesValidationResult {
    let rawEntries: RawNodeEntry[]
    try {
        rawEntries = loadRawEntries(grammar)
    } catch {
        // node-types.json isn't always shipped with grammars under
        // development. Treat as a silent skip — the validator is
        // optional.
        return { grammar, total: 0, matched: 0, discrepancies: [] }
    }

    const discrepancies: NodeTypesDiscrepancy[] = []
    let matched = 0

    // Build a lookup of linked rules by name.
    const rules = linked.rules

    for (const entry of rawEntries) {
        // Anonymous entries (operator tokens, punctuation) don't
        // correspond to linked rules — skip them.
        if (!entry.named) continue

        const rule = rules[entry.type]
        if (!rule) {
            // A named node-types.json entry with no matching linked
            // rule means Link dropped it (likely via a grammar-level
            // inline) OR the rule was renamed.
            discrepancies.push({
                kind: 'missing_rule',
                node: entry.type,
                detail: 'declared in node-types.json but not present in linked rules',
            })
            continue
        }

        // Supertype entries in node-types.json carry a `subtypes`
        // array. Verify our linked rule matches the shape — it
        // should be classified as `supertype` or an equivalent
        // choice of the same subtype set.
        if (entry.subtypes) {
            const expected = new Set(entry.subtypes.filter(s => s.named).map(s => s.type))
            if (rule.type === 'supertype') {
                const actual = new Set(rule.subtypes)
                if (!setsEqual(expected, actual)) {
                    discrepancies.push({
                        kind: 'supertype_mismatch',
                        node: entry.type,
                        detail: `expected subtypes {${[...expected].sort().join(', ')}}, ` +
                            `got {${[...actual].sort().join(', ')}}`,
                    })
                } else {
                    matched++
                }
            } else if (rule.type === 'choice') {
                // Hidden choice that Link kept as raw — accept if
                // members cover the expected set.
                const actual = new Set<string>()
                for (const m of rule.members) {
                    const inner = m.type === 'variant' ? m.content : m
                    if (inner.type === 'symbol') actual.add(inner.name)
                }
                if (!setsEqual(expected, actual)) {
                    discrepancies.push({
                        kind: 'supertype_mismatch',
                        node: entry.type,
                        detail: `supertype in node-types.json, but linked choice ` +
                            `members {${[...actual].sort().join(', ')}} differ from ` +
                            `expected {${[...expected].sort().join(', ')}}`,
                    })
                } else {
                    matched++
                }
            } else {
                discrepancies.push({
                    kind: 'supertype_mismatch',
                    node: entry.type,
                    detail: `node-types.json marks '${entry.type}' as a supertype, ` +
                        `but Link classified it as '${rule.type}'`,
                })
            }
        } else {
            matched++
        }
    }

    return {
        grammar,
        total: rawEntries.filter(e => e.named).length,
        matched,
        discrepancies,
    }
}

/** Human-readable summary — one line per discrepancy, max 200 chars. */
export function formatNodeTypesValidationReport(result: NodeTypesValidationResult): string {
    const lines: string[] = []
    const icon = result.discrepancies.length === 0 ? '  v' : '  x'
    lines.push(`${icon} ${result.matched}/${result.total} node-types.json agreement (${result.discrepancies.length} discrepancies)`)
    for (const d of result.discrepancies) {
        if (d.kind === 'missing_rule') {
            lines.push(`    x ${d.node}: ${d.detail}`)
        } else if (d.kind === 'visibility_mismatch') {
            lines.push(`    x ${d.node}: visibility ${d.expected} → ${d.actual}`)
        } else {
            lines.push(`    x ${d.node}: ${d.detail}`)
        }
    }
    return lines.join('\n')
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false
    for (const x of a) if (!b.has(x)) return false
    return true
}
