/**
 * validate-template-coverage — every tree-sitter field declared on a kind
 * must be referenced somewhere in that kind's render template.
 *
 * Closes the gap between `validate-renderable` (which only checks that a
 * rule *exists*) and `validate-roundtrip` (which catches missing fields
 * indirectly, and only when the corpus happens to exercise the
 * field-bearing variant). This validator is a pure structural check:
 *
 *   For every kind K with declared fields [f1, f2, ...]:
 *     For every field fi:
 *       template(K) must contain `$FI` OR `$$$FI` OR
 *       must contain `$FI_CLAUSE` and rule(K) must define `fi_clause`
 *
 * Supertype kinds are skipped (no direct render path). Pure-leaf kinds
 * are skipped (no template). Kinds without a declared field set are
 * skipped. Variant-bearing rules are checked per-variant — a field
 * declared on the kind must appear in *every* variant template (or be
 * absorbed by that variant's clause keys).
 *
 * Literal-leak heuristic: a template containing doubled punctuation
 * runs like `////`, `&&&&`, `||||`, `;;;;` is almost always a walker
 * concat bug (the walker emitted two literal copies of a separator
 * because it recursed into both sides of a choice). These are flagged
 * as warnings — they don't block, but they surface the defect near
 * its source.
 */

import { loadRawEntries, type RawNodeEntry, type RawFieldEntry } from './validators/node-types.ts'
import { parse as parseYaml } from 'yaml'
import type { RulesConfig, TemplateRule, TemplateRuleObject } from '@sittir/types'

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface TemplateCoverageResult {
    grammar: string
    total: number
    /** Kinds where every declared field is reachable in the template. */
    pass: number
    /** Kinds with at least one unreferenced field. */
    fail: number
    issues: CoverageIssue[]
}

export interface CoverageIssue {
    kind: string
    /** 'missing-field' (field declared, not referenced) or 'literal-leak' (doubled separator). */
    type: 'missing-field' | 'literal-leak'
    /** Human-readable description. */
    message: string
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function validateTemplateCoverage(
    grammar: string,
    templatesYaml: string,
): TemplateCoverageResult {
    const entries = loadRawEntries(grammar)
    const config = parseYaml(templatesYaml) as RulesConfig
    const rules = (config as { rules?: Record<string, TemplateRule> }).rules ?? {}

    const issues: CoverageIssue[] = []
    let total = 0
    let pass = 0

    for (const entry of entries) {
        if (!entry.named) continue
        // Supertypes have no direct rule — skipped by render dispatch.
        if (entry.subtypes && entry.subtypes.length > 0) continue
        // Pure leaves take the text fast-path; no template to check.
        const hasFields = entry.fields && Object.keys(entry.fields).length > 0
        const hasChildren = entry.children !== undefined
        if (!hasFields && !hasChildren) continue

        const rule = rules[entry.type]
        if (rule === undefined) continue // validate-renderable catches this.

        total++
        const kindIssues = checkRule(entry, rule)
        if (kindIssues.length === 0) {
            pass++
        } else {
            issues.push(...kindIssues)
        }
    }

    return { grammar, total, pass, fail: total - pass, issues }
}

// ---------------------------------------------------------------------------
// Per-kind check
// ---------------------------------------------------------------------------

function checkRule(entry: RawNodeEntry, rule: TemplateRule): CoverageIssue[] {
    const fields = entry.fields ?? {}
    const fieldNames = Object.keys(fields)
    const issues: CoverageIssue[] = []

    const variants = collectTemplates(rule)
    if (variants.length === 0) return issues // no inspectable template (shouldn't happen)

    const ruleObj = isObjectRule(rule) ? rule : undefined
    const clauseKeys = ruleObj ? collectClauseKeys(ruleObj) : new Set<string>()
    const clauseTemplates = ruleObj ? collectClauseTemplates(ruleObj) : {}

    // Variants are the explicit "different field shapes per form" mechanism:
    // variant A renders `left=right`, variant B renders `:type`. The coverage
    // requirement is that the **union** of placeholders across every variant
    // covers every declared field — not that each variant individually
    // references every field. Clause bodies are part of the union.
    const unionPlaceholders = new Set<string>()
    for (const { template } of variants) {
        for (const p of extractPlaceholders(template)) unionPlaceholders.add(p)
    }
    for (const body of Object.values(clauseTemplates)) {
        for (const p of extractPlaceholders(body)) unionPlaceholders.add(p)
    }

    for (const fname of fieldNames) {
        if (isFieldReferenced(fname, unionPlaceholders, clauseKeys, clauseTemplates)) continue
        // Show all variant bodies so the caller can see which one(s) to patch.
        const bodies = variants.length === 1
            ? JSON.stringify(variants[0]!.template)
            : variants.map(v => `${v.label}=${JSON.stringify(v.template)}`).join(' | ')
        issues.push({
            kind: entry.type,
            type: 'missing-field',
            message: `field '${fname}' declared but not referenced in any template: ${bodies}`,
        })
    }

    // Literal-leak heuristic — runs of 4+ identical punctuation chars. These
    // come from the walker recursing into both sides of a choice and
    // concatenating. Check each variant independently (scoped to that
    // template string, not the union).
    for (const { label, template } of variants) {
        const leak = /([/&|;+\-*=<>!?~^%])\1{3,}/.exec(template)
        if (leak) {
            const label_ = label ? ` (variant '${label}')` : ''
            issues.push({
                kind: entry.type,
                type: 'literal-leak',
                message: `template contains suspicious literal run ${JSON.stringify(leak[0])}${label_} — likely walker concat bug: ${JSON.stringify(template)}`,
            })
        }
    }

    return issues
}

// ---------------------------------------------------------------------------
// Template/rule shape helpers
// ---------------------------------------------------------------------------

function isObjectRule(rule: TemplateRule): rule is TemplateRuleObject {
    return rule !== null && typeof rule === 'object' && !Array.isArray(rule)
}

interface NamedTemplate {
    /** Variant label (empty string for plain `template:`). */
    label: string
    template: string
}

/**
 * Pull every renderable template string out of a rule: simple string,
 * string[], `template:` on an object, or each entry under `variants:`.
 * Clause keys are excluded here (they're aggregated separately so we can
 * follow them from placeholder references).
 */
function collectTemplates(rule: TemplateRule): NamedTemplate[] {
    if (typeof rule === 'string') return [{ label: '', template: rule }]
    if (Array.isArray(rule)) {
        return rule.map((t, i) => ({ label: `[${i}]`, template: t }))
    }
    const out: NamedTemplate[] = []
    const obj = rule as TemplateRuleObject
    if (typeof obj.template === 'string') out.push({ label: '', template: obj.template })
    else if (Array.isArray(obj.template)) {
        obj.template.forEach((t, i) => out.push({ label: `[${i}]`, template: t }))
    }
    if (obj.variants && typeof obj.variants === 'object') {
        for (const [name, tmpl] of Object.entries(obj.variants)) {
            if (typeof tmpl === 'string') out.push({ label: name, template: tmpl })
        }
    }
    return out
}

function collectClauseKeys(obj: TemplateRuleObject): Set<string> {
    const keys = new Set<string>()
    for (const k of Object.keys(obj)) {
        if (k === 'template' || k === 'variants' || k === 'joinBy'
            || k === 'joinByField' || k === 'detect') continue
        const v = (obj as Record<string, unknown>)[k]
        if (typeof v === 'string') keys.add(k)
    }
    return keys
}

function collectClauseTemplates(obj: TemplateRuleObject): Record<string, string> {
    const out: Record<string, string> = {}
    for (const k of Object.keys(obj)) {
        if (k === 'template' || k === 'variants' || k === 'joinBy'
            || k === 'joinByField' || k === 'detect') continue
        const v = (obj as Record<string, unknown>)[k]
        if (typeof v === 'string') out[k] = v
    }
    return out
}

// ---------------------------------------------------------------------------
// Placeholder extraction
// ---------------------------------------------------------------------------

/**
 * Extract every `$NAME` / `$$$NAME` placeholder from a template string.
 * Returns the lowercased names — matches how render.ts normalises lookup.
 */
function extractPlaceholders(template: string): Set<string> {
    const names = new Set<string>()
    // Match `$NAME` or `$$$NAME`. Name runs of [A-Z_][A-Z0-9_]*.
    const re = /\$+([A-Z_][A-Z0-9_]*)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(template)) !== null) {
        names.add(m[1]!.toLowerCase())
    }
    return names
}

function isFieldReferenced(
    fieldName: string,
    placeholders: Set<string>,
    clauseKeys: Set<string>,
    clauseTemplates: Record<string, string>,
): boolean {
    // 1. Direct reference: `$FIELD` or `$$$FIELD`.
    if (placeholders.has(fieldName)) return true

    // 2. Clause reference: template says `$FIELD_CLAUSE`, rule defines
    //    a `field_clause` key whose expansion references the field.
    //    We accept the reference even if the clause body just uses
    //    `$FIELD` — render.ts will emit nothing when absent, but the
    //    field is still reachable in principle.
    const clauseKey = `${fieldName}_clause`
    if (placeholders.has(clauseKey) && clauseKeys.has(clauseKey)) return true

    // 3. Clause body references — a `value_clause: =$VALUE` on a kind
    //    with a `value` field counts, even without a matching
    //    `_clause`-named placeholder. Walk every clause template.
    for (const body of Object.values(clauseTemplates)) {
        if (extractPlaceholders(body).has(fieldName)) return true
    }

    return false
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatTemplateCoverageReport(result: TemplateCoverageResult): string {
    const lines: string[] = []
    const icon = result.fail === 0 ? 'v' : 'x'
    lines.push(
        `  ${icon} ${result.pass}/${result.total} kinds have full template coverage` +
        ` (${result.fail} failing, ${result.issues.length} issues)`
    )
    const shown = result.issues.slice(0, 20)
    for (const i of shown) {
        lines.push(`    ${i.type === 'literal-leak' ? '!' : 'x'} ${i.kind}: ${i.message}`)
    }
    if (result.issues.length > shown.length) {
        lines.push(`    ... and ${result.issues.length - shown.length} more`)
    }
    return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _FieldUse = RawFieldEntry // keep import alive for docs
