/**
 * compiler/node-map.ts — AssembledNode class hierarchy and derivation
 * helpers.
 *
 * Split from `compiler/rule.ts` so the Rule IR file stays focused on
 * the Rule union itself. The classes here represent what an assembled
 * grammar node looks like after the full pipeline has classified and
 * enriched the Rule — each subclass corresponds to one ModelType
 * (`branch`, `container`, `polymorph`, `leaf`, `keyword`, `token`,
 * `enum`, `supertype`, `group`, `multi`).
 *
 * Exports:
 *
 * - **Class hierarchy:** {@link AssembledNodeBase} (abstract) +
 *   concrete subclasses + the {@link AssembledNode} discriminated
 *   union.
 * - **Derivation helpers:** {@link deriveFields}, {@link deriveChildren},
 *   {@link hasAnyField}, {@link hasAnyChild} — walk a Rule tree to
 *   produce the field / child metadata the emitters consume.
 * - **Structural predicates:** {@link isSyntheticFieldWrapper},
 *   {@link isVerbatimTokenStream}, {@link hasHiddenExternalRef} —
 *   classification hints used by classes' renderTemplate().
 *
 * Backward compatibility: `rule.ts` re-exports everything from this
 * file. New code should import from `./node-map.ts` directly.
 */

import type { Rule, RuleSource } from './rule.ts'
import { isSeq, isField } from './rule.ts'
import type { KindProjection } from './types.ts'
import {
    renderRuleTemplate,
    findRepeatSeparator,
    findRepeatFlag,
} from './template-walker.ts'

// ---------------------------------------------------------------------------
// Derivation helpers — walk a Rule to produce fields, children, content types
// ---------------------------------------------------------------------------

function snakeToCamel(name: string): string {
    return name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

// TypeScript reserved words that must be avoided as parameter names.
const TS_RESERVED = new Set([
    'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
    'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
    'interface', 'package', 'private', 'protected', 'public',
])

function safeParamName(name: string): string {
    return TS_RESERVED.has(name) ? `${name}_` : name
}

/**
 * Cheap existence predicate: does this rule's tree contain any field()?
 * Used by pre-assembly phases (classifier, optimizer) that only need to
 * know IF fields exist — not the full list. Shorter-circuits than
 * deriveFields.
 */
export function hasAnyField(rule: Rule): boolean {
    switch (rule.type) {
        case 'field':
            return true
        case 'seq':
        case 'choice':
            return rule.members.some(hasAnyField)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return hasAnyField(rule.content)
        default:
            return false
    }
}

/**
 * Cheap existence predicate: does this rule's tree contain any symbol
 * reference (visible OR hidden)? Hidden symbols dispatch to concrete
 * subtypes at parse time, so they DO contribute children.
 */
export function hasAnyChild(rule: Rule): boolean {
    switch (rule.type) {
        case 'symbol':
        case 'supertype':
            return true
        case 'seq':
        case 'choice':
            return rule.members.some(hasAnyChild)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return hasAnyChild(rule.content)
        default:
            return false
    }
}

export function deriveFields(rule: Rule, isOptional = false, isRepeated = false): AssembledField[] {
    const raw = deriveFieldsRaw(rule, isOptional, isRepeated, false)
    // Deduplicate by field name. If the same name appears multiple times
    // (e.g. once as single, once as repeat), merge into a multiple/optional
    // field with the union of content types.
    const byName = new Map<string, AssembledField>()
    for (const f of raw) {
        const existing = byName.get(f.name)
        if (!existing) {
            byName.set(f.name, { ...f })
            continue
        }
        const mergedAliasSources = (existing.aliasSources || f.aliasSources)
            ? { ...(existing.aliasSources ?? {}), ...(f.aliasSources ?? {}) }
            : undefined
        const merged: AssembledField = {
            ...existing,
            required: existing.required && f.required,
            multiple: existing.multiple || f.multiple,
            // nonEmpty survives only when every merged occurrence was
            // itself non-empty AND the merged shape is still multi.
            // A mixed "once as single, once as repeat1" field drops
            // to plain repeat semantics.
            nonEmpty: Boolean(existing.nonEmpty) && Boolean(f.nonEmpty),
            contentTypes: Array.from(new Set([...existing.contentTypes, ...f.contentTypes])),
            aliasSources: mergedAliasSources,
            literalValues: (existing.literalValues || f.literalValues)
                ? Array.from(new Set([...(existing.literalValues ?? []), ...(f.literalValues ?? [])]))
                : undefined,
            projection: {
                ...existing.projection,
                kinds: Array.from(new Set([...existing.projection.kinds, ...f.projection.kinds])),
            },
        }
        byName.set(f.name, merged)
    }
    return Array.from(byName.values())
}

function deriveFieldsRaw(
    rule: Rule,
    isOptional: boolean,
    isRepeated: boolean,
    isNonEmpty: boolean,
): AssembledField[] {
    switch (rule.type) {
        case 'field': {
            // Synthetic outer-field wrapper: the autogen wraps a multi-
            // member seq containing inner fields in `field('x', seq(...))`.
            // Tree-sitter doesn't produce a single runtime value for such
            // wrappers — the inner fields are the real data. The template
            // walker already descends into these; field derivation has to
            // match so factories don't emit phantom parameters that the
            // template can't reference.
            if (isSyntheticFieldWrapper(rule.content)) {
                return deriveFieldsRaw(rule.content, isOptional, isRepeated, isNonEmpty)
            }
            // Dedupe at the field boundary — inner walks via `flatMap`
            // over seq/choice members can legitimately produce duplicate
            // kind names when multiple variants reference the same
            // target (macro_definition's `rules: $$$MACRO_RULE` repeats
            // macro_rule across 6 variants; supertype expansions can
            // overlap with concrete sibling kinds).
            const contentTypes = [...new Set(deriveContentTypes(rule.content))]
            const aliasSources = deriveAliasSources(rule.content)
            const literalValues = deriveLiteralValues(rule.content)
            const propertyName = snakeToCamel(rule.name)
            // A field wrapping a repeat/optional carries that shape on
            // itself — `field('statements', repeat($._statement))` means
            // one field named `statements` whose value is many statements.
            const innerShape = fieldInnerShape(rule.content)
            const multiple = isRepeated || innerShape.repeated
            // Non-empty survives only when there's no outer `optional`
            // wrapper swallowing the empty case. `field('x',
            // optional(repeat1(...)))` is collapsed to
            // `field('x', repeat(...))` at evaluate anyway, so by the
            // time we get here the optional+repeat1 mix shouldn't
            // appear — but the guard keeps the derivation honest.
            const nonEmpty = multiple
                && !isOptional
                && !innerShape.optional
                && (isNonEmpty || innerShape.nonEmpty)
            const outerField: AssembledField = {
                name: rule.name,
                propertyName,
                paramName: safeParamName(propertyName),
                required: !isOptional && !innerShape.optional,
                multiple,
                nonEmpty: nonEmpty || undefined,
                contentTypes,
                aliasSources: Object.keys(aliasSources).length > 0 ? aliasSources : undefined,
                literalValues: literalValues.length > 0 ? literalValues : undefined,
                source: rule.source ?? 'grammar',
                projection: { typeName: '', kinds: contentTypes },
            }

            // Override-wrapper fields wrapping a choice whose branches
            // carry their own inner fields (e.g. Python's import_from_statement
            // where `field('wildcard_import', choice(wildcard_import,
            // _import_list, ...))` and `_import_list` expands to a commaSep1
            // of `field('name', ...)`). Tree-sitter at parse time assigns
            // whichever field the concrete branch declares, so BOTH the
            // outer wrapper name AND any inner field names can appear in
            // the live parse. The factory needs parameters for both so the
            // generated Config surface / fluent setters match runtime
            // reality. Descend into the choice and merge inner fields.
            // Duplicate-name drops silently (outer wins) — a field name
            // shared between inner and outer is the rare pathological case
            // and the outer wrapper's declared shape is canonical.
            if (rule.source === 'override' && rule.content.type === 'choice') {
                const innerFields = deriveFieldsRaw(rule.content, true, isRepeated, false)
                const seen = new Set([rule.name])
                const extras: AssembledField[] = []
                for (const f of innerFields) {
                    if (seen.has(f.name)) continue
                    seen.add(f.name)
                    // Inner branches are alternatives, so inner fields are
                    // structurally optional from the parent's perspective.
                    extras.push({ ...f, required: false })
                }
                if (extras.length > 0) return [outerField, ...extras]
            }
            return [outerField]
        }
        case 'seq':
            return rule.members.flatMap(m => deriveFieldsRaw(m, isOptional, isRepeated, isNonEmpty))
        case 'optional':
            return deriveFieldsRaw(rule.content, true, isRepeated, isNonEmpty)
        case 'repeat':
            return deriveFieldsRaw(rule.content, isOptional, true, false)
        case 'repeat1':
            return deriveFieldsRaw(rule.content, isOptional, true, true)
        case 'choice': {
            // Walk each branch independently, then merge: a field is
            // required (and non-empty) only if it appears in EVERY
            // branch. Fields present in only some branches are
            // optional from the parent's perspective — another branch
            // could be taken instead — so `required` / `nonEmpty` drop.
            // This distinguishes `update_expression`-style choices
            // (every branch contributes the same fields, all required)
            // from `function_modifiers`-style choices (each branch
            // contributes a different field, each optional).
            const perBranch = rule.members.map(m =>
                deriveFieldsRaw(m, isOptional, isRepeated, isNonEmpty),
            )
            const inAll = (name: string) =>
                perBranch.every(branch => branch.some(f => f.name === name))
            const result: AssembledField[] = []
            const seen = new Set<string>()
            for (const branch of perBranch) {
                for (const f of branch) {
                    if (seen.has(f.name)) continue
                    seen.add(f.name)
                    if (inAll(f.name)) {
                        result.push(f)
                    } else {
                        result.push({ ...f, required: false, nonEmpty: undefined })
                    }
                }
            }
            return result
        }
        case 'clause':
            return deriveFieldsRaw(rule.content, true, isRepeated, isNonEmpty)
        case 'variant':
            return deriveFieldsRaw(rule.content, isOptional, isRepeated, isNonEmpty)
        case 'group':
            return deriveFieldsRaw(rule.content, isOptional, isRepeated, isNonEmpty)
        default:
            return []
    }
}

export function deriveChildren(rule: Rule): AssembledChild[] {
    const raw: AssembledChild[] = []
    walkForChildren(rule, raw, false, false, false)
    // Deduplicate by child name; merge single+multiple into multiple.
    const byName = new Map<string, AssembledChild>()
    for (const c of raw) {
        const existing = byName.get(c.name)
        if (!existing) {
            byName.set(c.name, { ...c })
            continue
        }
        byName.set(c.name, {
            ...existing,
            required: existing.required && c.required,
            multiple: existing.multiple || c.multiple,
            nonEmpty: Boolean(existing.nonEmpty) && Boolean(c.nonEmpty),
            contentTypes: Array.from(new Set([...existing.contentTypes, ...c.contentTypes])),
        })
    }
    return Array.from(byName.values())
}

function walkForChildren(
    rule: Rule,
    out: AssembledChild[],
    isOptional: boolean,
    isRepeated: boolean,
    isNonEmpty: boolean,
): void {
    switch (rule.type) {
        case 'symbol':
            // Both visible and hidden symbols contribute to the runtime child
            // set: hidden symbols (supertypes) dispatch to their concrete
            // subtypes at parse time, so tree-sitter surfaces those children
            // under the parent. The child slot name we emit reflects the
            // symbol we referenced (stripped of any leading underscore so
            // `_expression` → `expression`).
            {
                const cleanName = rule.name.replace(/^_+/, '') || rule.name
                out.push({
                    name: cleanName,
                    propertyName: snakeToCamel(cleanName),
                    required: !isOptional,
                    multiple: isRepeated,
                    nonEmpty: (isRepeated && !isOptional && isNonEmpty) || undefined,
                    contentTypes: [rule.name],
                })
            }
            break
        case 'supertype':
            // Resolved supertype reference — dispatches to any subtype at
            // runtime. Emit one slot with the supertype's name.
            out.push({
                name: rule.name.replace(/^_+/, '') || rule.name,
                propertyName: snakeToCamel(rule.name.replace(/^_+/, '') || rule.name),
                required: !isOptional,
                multiple: isRepeated,
                nonEmpty: (isRepeated && !isOptional && isNonEmpty) || undefined,
                contentTypes: rule.subtypes,
            })
            break
        case 'seq': {
            // Sibling-duplicate symbol/supertype refs with the same
            // target (rust or_pattern: two `_pattern` refs) represent
            // the multi-children shape. Mark those occurrences as
            // multi so downstream merge keeps `multiple: true`.
            const targetCounts = new Map<string, number>()
            const childTarget = (r: Rule): string | null => {
                if (r.type === 'symbol') return r.name
                if (r.type === 'supertype') return r.name
                if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group') return childTarget(r.content)
                return null
            }
            for (const m of rule.members) {
                const t = childTarget(m)
                if (t) targetCounts.set(t, (targetCounts.get(t) ?? 0) + 1)
            }
            for (const m of rule.members) {
                const t = childTarget(m)
                const dup = t !== null && (targetCounts.get(t) ?? 0) > 1
                walkForChildren(m, out, isOptional, isRepeated || dup, isNonEmpty)
            }
            break
        }
        case 'optional':
            walkForChildren(rule.content, out, true, isRepeated, isNonEmpty)
            break
        case 'repeat':
            walkForChildren(rule.content, out, isOptional, true, false)
            break
        case 'repeat1':
            walkForChildren(rule.content, out, isOptional, true, true)
            break
        case 'choice': {
            // Walk each branch into a scratch bucket, then merge into
            // `out`: a child slot is only required / non-empty if it
            // appears in EVERY branch of the choice. Children in only
            // some branches are optional (another branch could be
            // taken) and lose their nonEmpty flag — matches how
            // `deriveFieldsRaw` handles choice-bound fields.
            const perBranch: AssembledChild[][] = rule.members.map(m => {
                const bucket: AssembledChild[] = []
                walkForChildren(m, bucket, isOptional, isRepeated, isNonEmpty)
                return bucket
            })
            const inAll = (name: string) =>
                perBranch.every(branch => branch.some(c => c.name === name))
            const seen = new Set<string>()
            for (const branch of perBranch) {
                for (const c of branch) {
                    if (seen.has(c.name)) continue
                    seen.add(c.name)
                    if (inAll(c.name)) {
                        out.push(c)
                    } else {
                        out.push({ ...c, required: false, nonEmpty: undefined })
                    }
                }
            }
            break
        }
        case 'field':
            // Fields are handled by deriveFields, not children
            break
        case 'variant':
            walkForChildren(rule.content, out, isOptional, isRepeated, isNonEmpty)
            break
        case 'clause':
            walkForChildren(rule.content, out, true, isRepeated, isNonEmpty)
            break
    }
}

/**
 * Walk a field's content and collect alias-source provenance: for each
 * symbol reference that was resolved from `alias($.source, $.target)`
 * (i.e. its `aliasedFrom` is set), record `{ [target]: source }`. The
 * wrap emitter consumes this to emit `drillAs(entry, tree, target, source)`
 * rewriting `$type` at drill-in per ADR-0006.
 */
function deriveAliasSources(rule: Rule): Record<string, string> {
    const out: Record<string, string> = {}
    const walk = (r: Rule): void => {
        switch (r.type) {
            case 'symbol':
                if ((r as { aliasedFrom?: string }).aliasedFrom) {
                    out[r.name] = (r as { aliasedFrom: string }).aliasedFrom
                }
                return
            case 'choice':
            case 'seq':
                r.members.forEach(walk); return
            case 'field':
            case 'variant':
            case 'optional':
            case 'repeat':
            case 'repeat1':
            case 'clause':
            case 'group':
                walk(r.content); return
            default: return
        }
    }
    walk(rule)
    return out
}

function deriveContentTypes(rule: Rule): string[] {
    switch (rule.type) {
        case 'symbol': return [rule.name]
        case 'choice': return rule.members.flatMap(m => deriveContentTypes(m))
        // Enum values are `text` contents, not distinct node kinds. A
        // field whose content is an inline enum should type as a
        // string-literal union (see deriveLiteralValues) — the parser
        // emits a single node whose `text` happens to match one of the
        // enum values, never a node whose `type` is `"u8"`, `"usize"`.
        case 'enum': return []
        case 'supertype': return rule.subtypes
        case 'field': return deriveContentTypes(rule.content)
        case 'variant': return deriveContentTypes(rule.content)
        case 'optional': return deriveContentTypes(rule.content)
        case 'repeat': return deriveContentTypes(rule.content)
        case 'seq': return rule.members.flatMap(m => deriveContentTypes(m))
        case 'clause': return deriveContentTypes(rule.content)
        case 'group': return deriveContentTypes(rule.content)
        default: return []
    }
}

/**
 * Inspect a field's inner content to infer optional/repeated flags.
 * Needed because overrides can wrap a `repeat(...)` or `optional(...)`
 * directly in a field — the outer `deriveFieldsRaw` walker only sees
 * the field wrapper and doesn't know its body's shape.
 */
function fieldInnerShape(rule: Rule): { optional: boolean; repeated: boolean; nonEmpty: boolean } {
    switch (rule.type) {
        case 'repeat': return { optional: false, repeated: true, nonEmpty: false }
        case 'repeat1': return { optional: false, repeated: true, nonEmpty: true }
        case 'optional': {
            const inner = fieldInnerShape(rule.content)
            return { optional: true, repeated: inner.repeated, nonEmpty: inner.nonEmpty }
        }
        default: return { optional: false, repeated: false, nonEmpty: false }
    }
}

/**
 * Detect an override-synthesized "outer field wrapper" that has no
 * corresponding runtime data. The autogen produced by v1's extractor
 * sometimes wraps a multi-member seq directly in an outer
 * `field('name', seq(...))` where the seq's TOP level contains another
 * named field. Tree-sitter doesn't produce a single node value for
 * such wrappers — the inner fields are the real runtime data.
 *
 * The check is deliberately narrow: only direct `field('x', seq(...))`
 * where the top-level seq contains an inner `field('y', ...)`. Deeper
 * nestings (`field('body', symbol(block))` where block's rule definition
 * contains fields) are NOT synthetic — those have real field values
 * that tree-sitter populates at parse time.
 */
export function isSyntheticFieldWrapper(content: Rule): boolean {
    if (content.type === 'repeat' || content.type === 'repeat1') {
        return isSyntheticFieldWrapper(content.content)
    }
    if (!isSeq(content)) return false
    return content.members.some(isField)
}

function deriveLiteralValues(rule: Rule): string[] {
    switch (rule.type) {
        case 'enum': return rule.values
        case 'string': return [rule.value]
        case 'choice': {
            const parts: string[] = []
            for (const m of rule.members) {
                const inner = m.type === 'variant' ? m.content : m
                if (inner.type === 'string') parts.push(inner.value)
                else return []  // not a pure string-choice — bail
            }
            return parts
        }
        case 'field': return deriveLiteralValues(rule.content)
        case 'variant': return deriveLiteralValues(rule.content)
        case 'optional': return deriveLiteralValues(rule.content)
        default: return []
    }
}

// ---------------------------------------------------------------------------
// Assembled node types — class hierarchy
//
// Abstract base + concrete subclasses per model type.
// Shape matches the previous interfaces exactly; methods/getters will be added
// as we collapse logic into the classes.
// ---------------------------------------------------------------------------

/**
 * JS reserved words that a raw factory function name collides with —
 * those get a trailing underscore so the emitted code parses.
 */
const JS_RESERVED_FACTORY_NAMES = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'null', 'return', 'static', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'async', 'await', 'arguments',
])

export abstract class AssembledNodeBase<R extends Rule = Rule> {
    readonly kind: string
    // typeName / factoryName are writable so assemble()'s post-pass
    // (resolveCollidingNames) can rename hidden kinds that clashed with
    // a visible sibling — same pattern as `irKey`.
    typeName: string
    factoryName?: string
    /**
     * Short key for the ir namespace (`ir.x`). Populated by assemble()
     * via resolveIrKeys() AFTER every node is constructed so that the
     * collision-resolution pass sees the whole NodeMap at once. Emitters
     * should read this rather than recomputing their own shortening.
     *
     * Writable (not readonly) so assemble's post-pass can install the
     * resolved key — the rest of the pipeline should treat it as
     * effectively immutable.
     */
    irKey?: string
    /**
     * Rule-level provenance. Mirrors the `source` field on the
     * underlying Rule (EnumRule, SupertypeRule, TerminalRule,
     * PolymorphRule). Undefined for branches/containers/groups, which
     * don't have a rule-level classification. The suggested.ts emitter
     * surfaces nodes whose source is `'promoted'` as rule-level
     * override candidates.
     */
    readonly source?: RuleSource
    abstract readonly modelType: string
    /**
     * The grammar rule that produced this assembled node. Set by concrete
     * subclasses that carry rule-level structure (branch, container, group,
     * multi). Absent / undefined on terminal subclasses (leaf, keyword,
     * token, enum, supertype, polymorph) that don't need rule access.
     *
     * The generic parameter `R` narrows this to the exact Rule subset each
     * subclass accepts — currently all rule-bearing subclasses use the
     * wide `Rule` union (default), leaving room for future narrowing
     * without changing callers.
     */
    declare readonly rule: R

    constructor(init: { kind: string; typeName: string; factoryName?: string; irKey?: string; source?: RuleSource }) {
        this.kind = init.kind
        this.typeName = init.typeName
        this.factoryName = init.factoryName
        this.irKey = init.irKey
        this.source = init.source
    }

    /** A node is hidden when it has no factory (supertype, group, token). */
    get hidden(): boolean {
        return this.factoryName === undefined
    }

    /**
     * Factory function name to emit in factories.ts — factoryName with a
     * trailing `_` when the bare name collides with a JS reserved word.
     * Returns `undefined` for hidden nodes.
     */
    get rawFactoryName(): string | undefined {
        if (this.factoryName === undefined) return undefined
        return JS_RESERVED_FACTORY_NAMES.has(this.factoryName)
            ? `${this.factoryName}_`
            : this.factoryName
    }

    /** Tree interface name: `${typeName}Tree`. */
    get treeTypeName(): string {
        return `${this.typeName}Tree`
    }

    /** Config type alias: `${typeName}Config`. */
    get configTypeName(): string {
        return `${this.typeName}Config`
    }

    /** Loose-input type alias: `Loose${typeName}` — the camelCase
     *  bag shape accepted by `from()` for programmatic construction. */
    get fromInputTypeName(): string {
        return `Loose${this.typeName}`
    }

    /** `from()` resolver function name: `${factoryName}From` for non-hidden nodes. */
    get fromFunctionName(): string | undefined {
        if (this.factoryName === undefined) return undefined
        return `${this.factoryName}From`
    }

    /**
     * Emit the templates.yaml entry for this node. Returns `undefined`
     * for nodes that don't need a template (leaves/keywords/enums/tokens
     * render via `.text` directly; supertypes dispatch through their
     * concrete subtype). Structural subclasses (AssembledBranch,
     * AssembledContainer, AssembledGroup, AssembledPolymorph) override
     * this to walk their rule tree and produce the right shape.
     */
    renderTemplate(_rules?: Record<string, Rule>, _wordMatcher?: RegExp): Record<string, unknown> | undefined {
        return undefined
    }
}

export interface AssembledChild {
    readonly name: string
    readonly propertyName: string
    readonly required: boolean
    readonly multiple: boolean
    /**
     * True when the slot originates from `repeat1(...)` — a list with a
     * grammar-enforced `length >= 1` guarantee. Emitters render the field
     * type as a non-empty tuple `readonly [T, ...(readonly T[])]` in
     * interfaces/config, and `T | [T, ...T[]]` in from-input (single-value
     * sugar). Only meaningful when `multiple` is true.
     */
    readonly nonEmpty?: boolean
    readonly contentTypes: string[]
}

export interface AssembledField extends AssembledChild {
    readonly paramName: string
    /**
     * Alias provenance per content type. When a content element was
     * declared at the call site via `alias($.source, $.target)` —
     * tree-sitter erases `source` at parse time, so the runtime $type
     * is `target` even though the body follows `source`'s shape — we
     * preserve that pairing so the wrap emitter can emit a drillAs()
     * call that rewrites $type back to source at drill-in.
     *
     * Keyed by the runtime target kind-name; value is the declared
     * source kind-name the codegen wants to present as the canonical
     * `$type`. Multiple entries when the same target maps from several
     * sources is theoretical — keep as a map for extensibility.
     *
     * Absent / empty when the field has no aliased content (the
     * common case). See ADR-0006.
     */
    readonly aliasSources?: Readonly<Record<string, string>>
    /**
     * Literal values when the field's content is an inline enum
     * (choice-of-strings). Empty for normal fields. When populated,
     * types emits the field as a string-literal union instead of
     * a kind-reference union.
     */
    readonly literalValues?: readonly string[]
    readonly source: 'grammar' | 'override' | 'inlined' | 'inferred'
    readonly projection: KindProjection
}

/**
 * @deprecated AssembledForm is replaced by AssembledGroup.
 * A polymorph's forms are now hidden groups synthesized from the choice branches.
 * This type alias is kept temporarily for backwards-compat with adapters/emitters.
 */
export type AssembledForm = AssembledGroup

// --- Concrete classes per model type ---

export class AssembledBranch extends AssembledNodeBase {
    readonly modelType = 'branch' as const
    // rule: Rule — inherited from AssembledNodeBase<Rule>
    /**
     * Rule with anonymous tokens / structural wrappers stripped.
     * Computed once by assemble() via `simplifyRule(init.rule)` and
     * stored here so derivation walks (`deriveFields`, `deriveChildren`,
     * separator discovery) don't have to re-navigate past delimiter
     * literals on every call. Template emission still reads the raw
     * `rule` because templates need the literals to surface as
     * template text. Stage 1: populated but not yet read.
     */
    readonly simplifiedRule: Rule

    // Cached derivations — lazy, computed on first access
    #fields?: AssembledField[]
    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
        simplifiedRule: Rule
    }) {
        super(init)
        this.rule = init.rule
        this.simplifiedRule = init.simplifiedRule
    }

    get fields(): AssembledField[] {
        return this.#fields ??= deriveFields(this.simplifiedRule)
    }

    get children(): AssembledChild[] | undefined {
        return this.#children ??= deriveChildren(this.simplifiedRule)
    }

    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp, externals?: ReadonlySet<string>): Record<string, unknown> {
        // Rules whose structure depends on hidden external-scanner
        // tokens (e.g. rust's raw_string_literal, whose `r#"` and `"#`
        // are produced by `_raw_string_literal_start` and
        // `_raw_string_literal_end`) can't be rendered slot-by-slot
        // because the delimiters never appear as children. Render as
        // `$TEXT` — emits the node's raw source span verbatim.
        if (externals && hasHiddenExternalRef(this.rule, externals)) {
            return { template: '$TEXT' }
        }
        // Token-stream shape — choice of `seq(delim, repeat(hidden), delim)`
        // variants. rust's token_tree / delim_token_tree are the canonical
        // cases: children can be any mix of named symbols and anonymous
        // punctuation (`=`, `=>`, `,`, etc.), and field-by-field rendering
        // drops the anonymous ones because readNode's promoteAnonymousKeyword
        // routes them through $fields keyed by text (not reachable from
        // `$$$CHILDREN`). The whole content is authored to be verbatim —
        // macro tokens are supposed to pass through — so emit `$TEXT`
        // which preserves the source span.
        if (isVerbatimTokenStream(this.rule)) {
            return { template: '$TEXT' }
        }
        // Template walking stays on the RAW rule — templates need the
        // anonymous delimiters ('(', '{', ';', etc.) to surface as
        // template text. Only derivations use simplifiedRule.
        const { template, clauses, joinByField } = renderRuleTemplate(this.rule, false, rules, wordMatcher)
        if (!template) {
            throw new Error(
                `AssembledBranch.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        // Separator discovery runs on simplifiedRule — the anonymous
        // delimiter layer is gone, so any remaining repeat/repeat1 is
        // reachable without navigating past literals.
        const sep = findRepeatSeparator(this.simplifiedRule)
        if (sep) entry.joinBy = sep
        // `trailing: true` on the repeat → grammar permits a trailing
        // separator. Render uses this to know it should look for a
        // trailing anon-separator token in `$$$CHILDREN` and preserve
        // it when present.
        if (findRepeatFlag(this.simplifiedRule, 'trailing')) entry.joinByTrailing = true
        if (findRepeatFlag(this.simplifiedRule, 'leading')) entry.joinByLeading = true
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
    }
}

/**
 * Detect "verbatim token stream" shape — a rule whose body is a choice
 * of `seq(delim, repeat(hidden_symbol), delim)` variants. Canonical
 * case: rust's `token_tree` / `delim_token_tree`, whose children are
 * any mix of named and anonymous tokens (including punctuation like
 * `=`, `=>`, `,` that readNode promotes into $fields rather than
 * $children). Field-by-field rendering can't reassemble these losslessly
 * — the anonymous tokens would drop out of `$$$CHILDREN`.
 *
 * Emitting `$TEXT` for these rules preserves the source span verbatim
 * on readNode-derived data. Factory construction requires the kind to
 * use the text-shape factory (receives a `text: string`), same path
 * we already use for `$TEXT` kinds via `hasHiddenExternalRef`.
 *
 * Shape criteria: rule is a `choice` (possibly wrapped in `variant`
 * markers from tagVariants). Every member has exactly three elements:
 * string-literal, repeat/repeat1 of a hidden symbol, string-literal.
 */
export function isVerbatimTokenStream(rule: Rule): boolean {
    if (rule.type !== 'choice') return false
    if (rule.members.length === 0) return false
    return rule.members.every(m => {
        const core = m.type === 'variant' ? m.content : m
        if (core.type !== 'seq' || core.members.length !== 3) return false
        const [start, mid, end] = core.members
        if (!start || !mid || !end) return false
        if (start.type !== 'string' || end.type !== 'string') return false
        if (mid.type !== 'repeat' && mid.type !== 'repeat1') return false
        const inner = mid.content
        return inner.type === 'symbol' && inner.hidden === true
    })
}

export function hasHiddenExternalRef(rule: Rule, externals: ReadonlySet<string>): boolean {
    // Unwrap transparent wrappers to find the structural core.
    let core = rule
    while (
        core.type === 'optional'
        || core.type === 'variant'
        || core.type === 'clause'
        || core.type === 'group'
        || core.type === 'alias'
    ) {
        core = (core as { content: Rule }).content
    }
    if (core.type !== 'seq') return false
    // A member is "all external" if it's a symbol ref whose target is
    // in the externals list, OR a wrapper (alias/optional/…) whose
    // eventual symbol is external. String literals like `{` / `}` /
    // `;` make the rule walkable via template text and disqualify the
    // $TEXT fallback.
    const isExternalMember = (r: Rule): boolean => {
        switch (r.type) {
            case 'symbol':
                return externals.has((r as { name: string }).name)
            // Link inlines external-token rule bodies as `pattern('')`
            // stubs in place of symbol references; enrich then wraps
            // those in `field('<stripped_name>', pattern(''))`
            // (leading underscore stripped). A match requires BOTH
            // conditions: (1) the unique Link stub shape — `content`
            // is empty-value pattern — AND (2) the field name (or its
            // `_`-prefixed form) is in the externals list. Either
            // alone would misfire: a non-external rule could
            // coincidentally have an empty-pattern child, and a field
            // named after an external might legitimately carry real
            // content. Otherwise fall through to walking the content.
            case 'field': {
                const f = r as { name: string; content: Rule }
                if (
                    f.content.type === 'pattern'
                    && (f.content as { value: string }).value === ''
                    && (externals.has(f.name) || externals.has('_' + f.name))
                ) return true
                return isExternalMember(f.content)
            }
            case 'alias':
            case 'optional':
            case 'variant':
            case 'clause':
            case 'group':
            case 'token':
            case 'terminal':
                return isExternalMember((r as { content: Rule }).content)
            default:
                return false
        }
    }
    // Also ignore pure-boundary optionals (e.g. the trailing
    // `optional($._automatic_semicolon)` in javascript's
    // `statement_block`) so they don't disqualify the rule from
    // slot-by-slot rendering but also don't count toward the
    // "all external" tally.
    const isIgnorableBoundaryExternal = (r: Rule): boolean => {
        if (r.type !== 'optional') return false
        const inner = r.content
        return inner.type === 'symbol' && externals.has((inner as { name: string }).name)
    }
    let hasContent = false
    for (const m of core.members) {
        if (isIgnorableBoundaryExternal(m)) continue
        hasContent = true
        if (!isExternalMember(m)) return false
    }
    return hasContent
}

export class AssembledContainer extends AssembledNodeBase {
    readonly modelType = 'container' as const
    // rule: Rule — inherited from AssembledNodeBase<Rule>
    /** See `AssembledBranch.simplifiedRule`. */
    readonly simplifiedRule: Rule

    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
        simplifiedRule: Rule
    }) {
        super(init)
        this.rule = init.rule
        this.simplifiedRule = init.simplifiedRule
    }

    get children(): AssembledChild[] {
        return this.#children ??= deriveChildren(this.simplifiedRule)
    }

    get separator(): string | undefined {
        // Separator is captured on the repeat / repeat1 rule by Evaluate.
        // Read from the simplified rule — if an anonymous-delimiter seq
        // wrapped the repeat in the raw form, it's gone now and the
        // repeat is at the root.
        const r = this.simplifiedRule
        if (r.type === 'repeat' || r.type === 'repeat1') {
            return r.separator
        }
        return undefined
    }

    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp, externals?: ReadonlySet<string>): Record<string, unknown> {
        if (externals && hasHiddenExternalRef(this.rule, externals)) {
            return { template: '$TEXT' }
        }
        if (isVerbatimTokenStream(this.rule)) {
            return { template: '$TEXT' }
        }
        // Template walking stays on RAW rule (needs literals); derivations
        // and separator discovery use simplifiedRule.
        const { template, clauses, joinByField } = renderRuleTemplate(this.rule, false, rules, wordMatcher)
        if (!template) {
            throw new Error(
                `AssembledContainer.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = this.separator ?? findRepeatSeparator(this.simplifiedRule)
        if (sep) entry.joinBy = sep
        if (findRepeatFlag(this.simplifiedRule, 'trailing')) entry.joinByTrailing = true
        if (findRepeatFlag(this.simplifiedRule, 'leading')) entry.joinByLeading = true
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
    }

}

export class AssembledPolymorph extends AssembledNodeBase {
    readonly modelType = 'polymorph' as const
    readonly #forms: AssembledGroup[]
    readonly source: 'promoted' | 'override'
    /**
     * For source='override' polymorphs: the visible variant child kinds
     * (e.g., ['assignment_eq', 'assignment_type', 'assignment_typed']).
     * These are real kinds in the parse tree (created by the alias() in
     * transform patches) and need to appear as the children union on
     * the parent polymorph's interface. Empty for source='promoted'.
     */
    readonly variantChildKinds: readonly string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        forms: AssembledGroup[]
        source?: 'promoted' | 'override'
        variantChildKinds?: readonly string[]
    }) {
        super(init)
        this.#forms = init.forms
        this.source = init.source ?? 'promoted'
        this.variantChildKinds = init.variantChildKinds ?? []
    }

    /** A polymorph's forms are hidden groups synthesized from the choice branches. */
    get forms(): AssembledGroup[] { return this.#forms }

    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp): Record<string, unknown> {
        if (this.#forms.length === 0) {
            throw new Error(
                `AssembledPolymorph.renderTemplate: '${this.kind}' has zero synthesised forms. ` +
                `Classifier bug — rule should have been classified as branch/container/leaf.`,
            )
        }
        // Variants as a record, detect as a sibling record, per-form
        // clauses merged into the outer rule object (the renderer looks
        // them up there regardless of which variant is active).
        const variants: Record<string, string> = {}
        const detect: Record<string, string> = {}
        const mergedClauses: Record<string, string> = {}
        const mergedJoinByField: Record<string, string> = {}
        for (const form of this.#forms) {
            const { template, clauses, joinByField } = renderRuleTemplate(form.rule, false, rules, wordMatcher)
            if (!template) {
                throw new Error(
                    `AssembledPolymorph.renderTemplate: '${this.kind}' form '${form.name}' ` +
                    `produced an empty template.`,
                )
            }
            variants[form.name] = template
            if (form.detectToken) detect[form.name] = form.detectToken
            Object.assign(mergedClauses, clauses)
            Object.assign(mergedJoinByField, joinByField)
        }
        const entry: Record<string, unknown> = { variants, ...mergedClauses }
        if (Object.keys(detect).length > 0) entry.detect = detect
        if (Object.keys(mergedJoinByField).length > 0) entry.joinByField = mergedJoinByField
        return entry
    }

}

export class AssembledLeaf extends AssembledNodeBase {
    readonly modelType = 'leaf' as const
    readonly #pattern?: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        pattern?: string
    }) {
        super(init)
        this.#pattern = init.pattern
    }

    get pattern(): string | undefined { return this.#pattern }
}

export class AssembledKeyword extends AssembledNodeBase {
    readonly modelType = 'keyword' as const
    readonly #text: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        text: string
    }) {
        super(init)
        this.#text = init.text
    }

    get text(): string { return this.#text }
}

export class AssembledToken extends AssembledNodeBase {
    readonly modelType = 'token' as const

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
    }) {
        super(init)
    }
    // No emitFactory — tokens are hidden, no factoryName.
}

export class AssembledEnum extends AssembledNodeBase {
    readonly modelType = 'enum' as const
    readonly #values: string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        values: string[]
    }) {
        super(init)
        this.#values = init.values
    }

    get values(): string[] { return this.#values }
}

export class AssembledSupertype extends AssembledNodeBase {
    readonly modelType = 'supertype' as const
    readonly #subtypes: string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        subtypes: string[]
    }) {
        super(init)
        this.#subtypes = init.subtypes
    }

    get subtypes(): string[] { return this.#subtypes }
}

/**
 * AssembledMulti — hidden repeat helpers that tree-sitter inlines at
 * parse time.
 *
 * Shape: a hidden rule whose top-level content is `repeat` or `repeat1`
 * (possibly wrapped in `optional` / `variant`). Canonical case: python
 *   `_collection_elements: repeat1(choice(expression, yield, list_splat, ...))`
 * used inside `tuple`, `list`, `set`, etc.
 *
 * These never surface as parse-tree nodes — tree-sitter expands the
 * repeat in-place at every referrer. Our codegen therefore:
 *   - Emits NO interface / factory / from-resolver / wrap function /
 *     render template for the helper itself.
 *   - Emits a TYPE ALIAS naming the element union:
 *       `export type CollectionElements = Expression | Yield | ListSplat | …`
 *   - Inlines the repeat at every referrer (`inlineGroupRefs` extends
 *     to cover `multi` alongside `group`), so the referrer's walker
 *     sees `repeat1(...)` directly and sets `multiple: true` on the
 *     child slot → rest-params factory.
 *
 * Mirrors the existing "hidden helper" story:
 *   group    — hidden seq with fields  (inline fields)
 *   supertype — hidden choice of symbols (dispatch to one subtype)
 *   multi    — hidden repeat of union    (inline as multi child slot)
 */
export class AssembledMulti extends AssembledNodeBase {
    readonly modelType = 'multi' as const
    // rule: Rule — inherited from AssembledNodeBase<Rule>
    /** The repeat's inner content type — raw Rule, for downstream
     * consumers that need the element union (types emitter maps this
     * to a union of TypeNames, inlineGroupRefs hands the whole repeat
     * back to referrers). */
    readonly elementRule: Rule
    /** `true` when the source rule is `repeat1` (at least one element);
     * `false` for plain `repeat` (zero-or-more). Referrers thread this
     * into AssembledChild.nonEmpty. */
    readonly nonEmpty: boolean

    constructor(init: {
        kind: string; typeName: string; irKey?: string
        rule: Rule
        elementRule: Rule
        nonEmpty: boolean
    }) {
        super(init)
        this.rule = init.rule
        this.elementRule = init.elementRule
        this.nonEmpty = init.nonEmpty
    }
}

export class AssembledGroup extends AssembledNodeBase {
    readonly modelType = 'group' as const
    // rule: Rule — inherited from AssembledNodeBase<Rule>
    /** See `AssembledBranch.simplifiedRule`. */
    readonly simplifiedRule: Rule
    readonly detectToken?: string
    /** Short label (e.g., variant name like 'pub' or 'tuple'). Defaults to kind. */
    readonly name: string
    /**
     * When this group is a polymorph form, the parent polymorph's kind —
     * what tree-sitter actually produces for this node. Form factories
     * must emit `type: parentKind` so the runtime NodeData matches the
     * tree-sitter kind, not the synthesized form kind. Undefined for
     * standalone groups (inlined hidden seqs).
     */
    readonly parentKind?: string

    #fields?: AssembledField[]
    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
        simplifiedRule: Rule
        detectToken?: string
        name?: string
        parentKind?: string
    }) {
        super(init)
        this.rule = init.rule
        this.simplifiedRule = init.simplifiedRule
        this.detectToken = init.detectToken
        this.name = init.name ?? init.kind
        this.parentKind = init.parentKind
    }

    get fields(): AssembledField[] {
        return this.#fields ??= deriveFields(this.simplifiedRule)
    }

    get children(): AssembledChild[] {
        return this.#children ??= deriveChildren(this.simplifiedRule)
    }

    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp, externals?: ReadonlySet<string>): Record<string, unknown> {
        if (externals && hasHiddenExternalRef(this.rule, externals)) {
            return { template: '$TEXT' }
        }
        // Template walking stays on RAW rule (needs literals); derivations
        // and separator discovery use simplifiedRule.
        const { template, clauses, joinByField } = renderRuleTemplate(this.rule, false, rules, wordMatcher)
        if (!template) {
            throw new Error(
                `AssembledGroup.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = findRepeatSeparator(this.simplifiedRule)
        if (sep) entry.joinBy = sep
        if (findRepeatFlag(this.simplifiedRule, 'trailing')) entry.joinByTrailing = true
        if (findRepeatFlag(this.simplifiedRule, 'leading')) entry.joinByLeading = true
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
    }

}

export type AssembledNode =
    | AssembledBranch
    | AssembledContainer
    | AssembledPolymorph
    | AssembledLeaf
    | AssembledKeyword
    | AssembledToken
    | AssembledEnum
    | AssembledSupertype
    | AssembledGroup
    | AssembledMulti
