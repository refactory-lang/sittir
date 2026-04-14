/**
 * validate-renderable — every named kind in tree-sitter's node-types.json
 * must be renderable by @sittir/core.
 *
 * A kind is renderable when one of these holds:
 *
 *   1. Supertype   — has `subtypes` in node-types.json. Supertypes are
 *                    abstract; `render()` dispatches to the concrete subtype,
 *                    so the supertype itself never reaches the rules lookup.
 *
 *   2. Pure leaf   — has no `fields` AND no `children` in node-types.json.
 *                    `render()` returns `node.text` directly without any
 *                    template lookup.
 *
 *   3. Has rule    — kind appears in the `rules` map of templates.yaml
 *                    (either as a top-level entry or as a variant target).
 *
 * Anything else is un-renderable: calling `render()` on an instance will
 * throw `No render rule for '<kind>'`. That's a codegen regression we
 * want surfaced as a first-class validation error.
 */

import { loadRawEntries, type RawNodeEntry } from './validators/node-types.ts'
import { parse as parseYaml } from 'yaml'
import type { RulesConfig, TemplateRule } from '@sittir/types'
import type { NodeMap } from './compiler/rule.ts'
import { buildRuleLookup } from './validators/rule-lookup.ts'

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface RenderableResult {
    grammar: string
    total: number
    /** Count of kinds that are renderable via one of the three paths. */
    renderable: number
    /** Kinds that have NO viable path. */
    missing: MissingKind[]
}

export interface MissingKind {
    kind: string
    reason: string
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Validate that every named entry in node-types.json is renderable.
 *
 * @param grammar       Grammar name (rust, typescript, python).
 * @param templatesYaml Parsed text of the generated templates.yaml.
 */
export function validateRenderable(grammar: string, templatesYaml: string): RenderableResult {
    const rawEntries = loadRawEntries(grammar)
    const rulesConfig = parseYaml(templatesYaml) as RulesConfig
    const ruleKinds = collectRuleKinds(rulesConfig)

    const missing: MissingKind[] = []
    let renderable = 0
    let total = 0

    for (const entry of rawEntries) {
        // Skip anonymous tokens (tree-sitter's string literals aren't addressable
        // by `render(node)` because their instances never appear as top-level nodes
        // with their own render call — they're text content of their parent).
        if (!entry.named) continue
        total++

        const path = classifyRenderability(entry, ruleKinds)
        if (path === null) {
            missing.push({
                kind: entry.type,
                reason: reasonFor(entry, ruleKinds),
            })
        } else {
            renderable++
        }
    }

    return { grammar, total, renderable, missing }
}

/**
 * C12: NodeMap-sourced variant. Skips the templates.yaml round-trip
 * entirely — renderability is a structural property, and the
 * shared `buildRuleLookup()` answers it directly from NodeMap.
 * Prefer this when you already have a NodeMap in hand (generateV2
 * returns one).
 */
export function validateRenderableFromNodeMap(grammar: string, nodeMap: NodeMap): RenderableResult {
    const rawEntries = loadRawEntries(grammar)
    const lookup = buildRuleLookup(nodeMap)

    const missing: MissingKind[] = []
    let renderable = 0
    let total = 0

    for (const entry of rawEntries) {
        if (!entry.named) continue
        total++

        if (lookup.renderable.has(entry.type)) {
            renderable++
        } else {
            missing.push({
                kind: entry.type,
                reason: `no NodeMap render path for '${entry.type}' (kind is `
                    + (lookup.kinds.has(entry.type) ? `modelType=${lookup.path.get(entry.type) ?? 'none'}` : `absent from NodeMap`)
                    + ')',
            })
        }
    }

    return { grammar, total, renderable, missing }
}

// ---------------------------------------------------------------------------
// Renderability decision
// ---------------------------------------------------------------------------

type Path = 'supertype' | 'leaf' | 'rule'

function classifyRenderability(entry: RawNodeEntry, ruleKinds: Set<string>): Path | null {
    // 1. Supertype — dispatched, never rendered directly.
    if (entry.subtypes && entry.subtypes.length > 0) return 'supertype'

    // 2. Pure leaf — `render()` returns node.text directly.
    const hasFields = entry.fields && Object.keys(entry.fields).length > 0
    const hasChildren = entry.children !== undefined
    if (!hasFields && !hasChildren) return 'leaf'

    // 3. Has a template rule in templates.yaml.
    if (ruleKinds.has(entry.type)) return 'rule'

    return null
}

function reasonFor(entry: RawNodeEntry, ruleKinds: Set<string>): string {
    const hasFields = entry.fields && Object.keys(entry.fields).length > 0
    const hasChildren = entry.children !== undefined
    const parts: string[] = []
    if (hasFields) parts.push(`fields=[${Object.keys(entry.fields!).join(',')}]`)
    if (hasChildren) parts.push('children')
    return `structural node (${parts.join(', ')}) but no rule in templates.yaml`
}

// ---------------------------------------------------------------------------
// Rule-map extraction
// ---------------------------------------------------------------------------

/**
 * Collect every kind addressable via the rules map: both top-level entries
 * and variant subtypes (a variant template selects based on child kind, so
 * the variant-subtype itself is renderable through the parent's rule).
 */
function collectRuleKinds(config: RulesConfig): Set<string> {
    const kinds = new Set<string>()
    const rules = (config as { rules?: Record<string, TemplateRule> }).rules ?? {}
    for (const [kind, rule] of Object.entries(rules)) {
        kinds.add(kind)

        // Variant-bearing rules: extract each variant's matcher kind so
        // that subtypes dispatched through the parent also count as
        // renderable. Variant shape: { variants: [{ name, template, ... }, ...] }
        if (rule && typeof rule === 'object' && !Array.isArray(rule)) {
            const variants = (rule as { variants?: Array<{ name?: string }> }).variants
            if (Array.isArray(variants)) {
                for (const v of variants) {
                    if (v?.name) kinds.add(v.name)
                }
            }
        }
    }
    return kinds
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatRenderableReport(result: RenderableResult): string {
    const lines: string[] = []
    const icon = result.missing.length === 0 ? 'v' : 'x'
    lines.push(
        `  ${icon} ${result.renderable}/${result.total} kinds renderable` +
        ` (${result.missing.length} un-renderable)`
    )
    if (result.missing.length > 0) {
        for (const m of result.missing) {
            lines.push(`    x ${m.kind}: ${m.reason}`)
        }
    }
    return lines.join('\n')
}
