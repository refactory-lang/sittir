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

import { loadRawEntries } from './node-types-loader.ts'
import type { RawNodeEntry, RawFieldEntry } from './node-types-loader.ts'
import { loadRulesFromPath as loadRulesFromTemplatesPath } from './templates-path.ts'

/**
 * Load the rules map from either a legacy YAML file or a directory of
 * per-rule `.jinja` files (feature 011). For the Jinja layout each
 * file's body becomes the `template` string; clauses, variants, and
 * joinBy metadata aren't available at this level (they're baked into
 * the file body). So the coverage checker's detailed structural
 * assertions fall back gracefully when the Jinja layout is in use.
 */
/**
 * Convert a Jinja template body back to the legacy rule-object shape
 * the template-coverage checker expects. Preserves clause bodies as
 * sibling entries alongside the main `template` string so the
 * checker's `$FI_CLAUSE` + `fi_clause: body` references resolve.
 *
 * This is a read-only adapter — Jinja is authoritative on disk; we
 * never round-trip through this path for emission.
 */
function jinjaBodyToLegacyRule(body: string): TemplateRule {
    const clauses: Record<string, string> = {}
    // Extract `{% if <stem> %}<body>{% endif %}` blocks; capture the
    // body (with `{{ name }}` → `$NAME` applied) as a `<stem>_clause`
    // entry; replace the block with `$<STEM>_CLAUSE` in the main
    // template string.
    const withClauseRefs = body.replace(
        /\{%-?\s*if\s+([a-z_][a-z0-9_]*)\s*%\}([\s\S]*?)\{%\s*endif\s*-?%\}/g,
        (_m, stem: string, clauseBody: string) => {
            clauses[`${stem}_clause`] = jinjaInterpolationsToLegacy(clauseBody)
            return `$${stem.toUpperCase()}_CLAUSE`
        },
    )
    const template = jinjaInterpolationsToLegacy(withClauseRefs)
    if (Object.keys(clauses).length === 0) return template
    return { template, ...clauses } as TemplateRule
}

/**
 * Replace Jinja `{{ name }}` and `{{ name | join("<sep>") }}`
 * interpolations with the legacy `$NAME` / `$$$NAME` placeholders the
 * coverage checker's regex-based field scanner understands. The
 * `join` filter signals a multi-valued slot (maps to `$$$`); the
 * bare form is single-valued (`$`).
 */
function jinjaInterpolationsToLegacy(body: string): string {
    return body.replace(
        /\{\{\s*([a-z_][a-z0-9_]*)(\s*\|\s*join\([^)]*\))?\s*\}\}/g,
        (_m, name: string, filter: string | undefined) => {
            const prefix = filter ? '$$$' : '$'
            return `${prefix}${name.toUpperCase()}`
        },
    )
}

function loadRulesFromPath(templatesPath: string): Record<string, TemplateRule> {
    return loadRulesFromTemplatesPath(templatesPath, (_kind, body) => jinjaBodyToLegacyRule(body))
}
import type { TemplateRule, TemplateRuleObject } from '@sittir/types'

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
    templatesPath: string,
): TemplateCoverageResult {
    const entries = loadRawEntries(grammar)
    const rules = loadRulesFromPath(templatesPath)

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

/**
 * Compute the union of all placeholder names across every variant template
 * and every clause template body for a rule.
 *
 * @remarks
 * The coverage requirement is that the union of placeholders across every
 * variant covers every declared field — not that each variant individually
 * references every field. Clause bodies are part of the union because a field
 * can be referenced inside a clause expansion rather than in the top-level
 * template string.
 *
 * @param variants - The collected named template strings for the rule.
 * @param clauseTemplates - The clause key → template body map for the rule.
 * @returns A set of lowercased placeholder names found across all templates.
 */
function computeUnionPlaceholders(
    variants: NamedTemplate[],
    clauseTemplates: Record<string, string>,
): Set<string> {
    const unionPlaceholders = new Set<string>()
    for (const { template } of variants) {
        for (const p of extractPlaceholders(template)) unionPlaceholders.add(p)
    }
    for (const body of Object.values(clauseTemplates)) {
        for (const p of extractPlaceholders(body)) unionPlaceholders.add(p)
    }
    return unionPlaceholders
}

/**
 * Check each variant template for suspicious literal runs that indicate a
 * walker concat bug.
 *
 * @remarks
 * Runs of 4+ identical punctuation chars (e.g. `////`, `&&&&`) come from the
 * walker recursing into both sides of a choice and concatenating. Each variant
 * is checked independently, scoped to that template string rather than the
 * union, so the issue is reported with its variant label.
 *
 * @param entry - The raw node entry (for `kind` in the issue message).
 * @param variants - The named template variants to inspect.
 * @returns An array of `literal-leak` CoverageIssues, one per offending variant.
 */
function checkVariantsForLiteralLeaks(
    entry: RawNodeEntry,
    variants: NamedTemplate[],
): CoverageIssue[] {
    const issues: CoverageIssue[] = []
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

function checkRule(entry: RawNodeEntry, rule: TemplateRule): CoverageIssue[] {
    const fields = entry.fields ?? {}
    const fieldNames = Object.keys(fields)
    const issues: CoverageIssue[] = []

    const variants = collectTemplates(rule)
    if (variants.length === 0) return issues // no inspectable template (shouldn't happen)

    const ruleObj = isObjectRule(rule) ? rule : undefined
    const clauseKeys = ruleObj ? collectClauseKeys(ruleObj) : new Set<string>()
    const clauseTemplates = ruleObj ? collectClauseTemplates(ruleObj) : {}

    const unionPlaceholders = computeUnionPlaceholders(variants, clauseTemplates)

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

    issues.push(...checkVariantsForLiteralLeaks(entry, variants))

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
    const out: NamedTemplate[] = []
    const obj = rule as TemplateRuleObject
    if (typeof obj.template === 'string') out.push({ label: '', template: obj.template })
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

/**
 * Check whether a field is referenced via the `$FIELD_CLAUSE` placeholder
 * pattern, where both the placeholder and its clause key are present.
 *
 * @remarks
 * A clause reference is accepted even if the clause body just uses `$FIELD` —
 * render.ts will emit nothing when the field is absent, but the field is still
 * reachable in principle.
 *
 * @param fieldName - The snake_case field name to check.
 * @param placeholders - The union set of placeholder names from the template.
 * @param clauseKeys - The set of clause key names defined on the rule object.
 * @returns True if the field is referenced via a `_clause` placeholder + key pair.
 */
function isReferencedViaClausePlaceholder(
    fieldName: string,
    placeholders: Set<string>,
    clauseKeys: Set<string>,
): boolean {
    const clauseKey = `${fieldName}_clause`
    return placeholders.has(clauseKey) && clauseKeys.has(clauseKey)
}

/**
 * Check whether a field is referenced inside any clause body template,
 * even without a matching `_clause`-named placeholder in the top-level template.
 *
 * @remarks
 * A `value_clause: =$VALUE` on a kind with a `value` field counts as a
 * reference even without a `$VALUE_CLAUSE` placeholder in the main template.
 * Walk every clause template body and check for the field name as a placeholder.
 *
 * @param fieldName - The snake_case field name to check.
 * @param clauseTemplates - Map of clause key → clause body template string.
 * @returns True if any clause body template references the field.
 */
function isReferencedInClauseBody(
    fieldName: string,
    clauseTemplates: Record<string, string>,
): boolean {
    for (const body of Object.values(clauseTemplates)) {
        if (extractPlaceholders(body).has(fieldName)) return true
    }
    return false
}

function isFieldReferenced(
    fieldName: string,
    placeholders: Set<string>,
    clauseKeys: Set<string>,
    clauseTemplates: Record<string, string>,
): boolean {
    // 1. Direct reference: `$FIELD` or `$$$FIELD`.
    if (placeholders.has(fieldName)) return true

    // 2. Clause placeholder reference.
    if (isReferencedViaClausePlaceholder(fieldName, placeholders, clauseKeys)) return true

    // 3. Clause body reference.
    if (isReferencedInClauseBody(fieldName, clauseTemplates)) return true

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
