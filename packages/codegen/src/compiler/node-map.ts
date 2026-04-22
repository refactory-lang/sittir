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
 * - **Structural predicates:** {@link isSyntheticFieldWrapper} —
 *   classification hint used by template-walker.ts. `isVerbatimTokenStream`
 *   and `hasHiddenExternalRef` are file-private helpers used only by
 *   `AssembledNodeBase.isTextTemplate()` and the renderTemplate() methods.
 *
 * Backward compatibility: `rule.ts` re-exports everything from this
 * file. New code should import from `./node-map.ts` directly.
 */

import type {
    Rule, RuleSource,
    SeqRule, ChoiceRule, RepeatRule, Repeat1Rule,
    StringRule, PatternRule, TokenRule,
    GroupRule, EnumRule, SupertypeRule, PolymorphRule, TerminalRule,
} from './rule.ts'
import { isSeq, isField } from './rule.ts'
import type { KindProjection } from './types.ts'
import {
    renderRuleTemplate,
    findRepeatSeparator,
    findRepeatFlag,
} from './template-walker.ts'
import { tokenToName } from './optimize.ts'

// ---------------------------------------------------------------------------
// NodeOrTerminal — unified slot-content type (ADR-0010 Task 1.6)
// ---------------------------------------------------------------------------

/**
 * Per-value multiplicity tag. Each entry in a slot's `values` array carries
 * its own multiplicity derived from the grammar rule that produced it.
 *
 * - `optional`      → `T | undefined`        (field: `readonly x?: T`)
 * - `single`        → `T`                    (field: `readonly x: T`)
 * - `array`         → `readonly T[]`          (field: `readonly x: readonly T[]`)
 * - `nonEmptyArray` → `NonEmptyArray<T>`      (field: `readonly x: NonEmptyArray<T>`)
 */
export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray'

/**
 * Unresolved kind reference — used during derivation, before the
 * `resolveSlotRefs` pass replaces it with the actual AssembledNode.
 * Kept in the `NodeRef.node` union so diagnostic / serialization paths
 * can surface dangling references as typed values.
 */
export interface UnresolvedRef {
    readonly kind: 'unresolved-ref'
    readonly name: string
}

/**
 * A slot-content entry that references a grammar node kind. After
 * `resolveSlotRefs` the `.node` field holds the resolved `AssembledNode`;
 * before that pass (or for unresolvable dead-kind references) it holds
 * an `UnresolvedRef`.
 */
export interface NodeRef<T extends AssembledNode = AssembledNode> {
    readonly kind: 'node-ref'
    readonly node: T | UnresolvedRef
    readonly multiplicity: Multiplicity
}

/**
 * A slot-content entry that is an inline string literal (e.g. `'const'`,
 * `'pub'`, an enum member). The `value` is the exact grammar string.
 */
export interface TerminalValue {
    readonly kind: 'terminal'
    readonly value: string
    readonly multiplicity: Multiplicity
}

/**
 * Discriminated union of the two entry types inside a slot's `values` array.
 */
export type NodeOrTerminal = NodeRef | TerminalValue

export function isNodeRef(v: NodeOrTerminal): v is NodeRef {
    return v.kind === 'node-ref'
}

export function isTerminalValue(v: NodeOrTerminal): v is TerminalValue {
    return v.kind === 'terminal'
}

export function isUnresolvedRef(v: NodeRef['node']): v is UnresolvedRef {
    return typeof v === 'object' && (v as { kind?: unknown }).kind === 'unresolved-ref'
}

// ---------------------------------------------------------------------------
// Derived slot-level helpers (DRY: one derivation, not stored flags)
// ---------------------------------------------------------------------------

/**
 * True when EVERY value in the slot is `single`, `array`, or `nonEmptyArray`
 * (none are `optional`). A slot with ANY optional value is itself optional
 * at the slot level.
 */
export function isRequired(slot: { values: readonly NodeOrTerminal[] }): boolean {
    return slot.values.length > 0 && slot.values.every(v => v.multiplicity !== 'optional')
}

/**
 * True when ANY value has multiplicity `array` or `nonEmptyArray`.
 */
export function isMultiple(slot: { values: readonly NodeOrTerminal[] }): boolean {
    return slot.values.some(v => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray')
}

/**
 * True when EVERY multi-valued value is `nonEmptyArray` (and there is at
 * least one multi-valued value). A mixed `array` + `nonEmptyArray` slot
 * returns `false` — the `array` form allows empty.
 */
export function isNonEmpty(slot: { values: readonly NodeOrTerminal[] }): boolean {
    const multis = slot.values.filter(v => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray')
    return multis.length > 0 && multis.every(v => v.multiplicity === 'nonEmptyArray')
}

// ---------------------------------------------------------------------------
// Derivation helpers — walk a Rule to produce fields, children, content types
// ---------------------------------------------------------------------------

/**
 * Convert a snake_case name to camelCase — the single source of truth for
 * this transformation in the codegen pipeline. Used by field/child
 * `propertyName` derivation here, and re-exported for emitters and
 * validators that need the same canonical form.
 */
export function snakeToCamel(name: string): string {
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

export function deriveFields(rule: Rule): AssembledField[] {
    const raw = deriveFieldsRaw(rule, 'single')
    // Deduplicate by field name. If the same name appears multiple times
    // (e.g. once as single, once as repeat, across choice arms), merge
    // by combining their `values` arrays.
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
            values: dedupeValues([...existing.values, ...f.values]),
            aliasSources: mergedAliasSources,
            projection: {
                ...existing.projection,
                kinds: Array.from(new Set([...existing.projection.kinds, ...f.projection.kinds])),
            },
        }
        byName.set(f.name, merged)
    }
    return Array.from(byName.values())
}

/**
 * Raw field derivation — produces one AssembledField per `field()` encounter.
 * Duplicates are merged by `deriveFields`. The `outerMultiplicity` threads
 * down from repeat/optional wrappers above the field.
 */
function deriveFieldsRaw(
    rule: Rule,
    outerMultiplicity: Multiplicity,
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
                return deriveFieldsRaw(rule.content, outerMultiplicity)
            }

            const aliasSources = deriveAliasSources(rule.content)
            const propertyName = snakeToCamel(rule.name)

            // Determine the multiplicity for this field's content. The
            // field's own content rule (repeat/optional wrapper) takes
            // precedence over any outer multiplicity from a surrounding
            // repeat(field('x', ...)).
            const innerMult = fieldContentMultiplicity(rule.content, outerMultiplicity)

            // Derive values — each NodeOrTerminal entry carries its own multiplicity.
            const rawValues = deriveValuesForRule(rule.content, innerMult)
            const values = dedupeValues(rawValues)

            // Compute projection.kinds from node-ref values only (for backwards-
            // compat with emitters that call projection.kinds).
            const kindNames = values
                .filter(isNodeRef)
                .map(v => isUnresolvedRef(v.node) ? (v.node as UnresolvedRef).name : (v.node as AssembledNode).kind)
            const projectionKinds = [...new Set(kindNames)]

            const outerField: AssembledField = {
                name: rule.name,
                propertyName,
                paramName: safeParamName(propertyName),
                values,
                aliasSources: Object.keys(aliasSources).length > 0 ? aliasSources : undefined,
                source: rule.source ?? 'grammar',
                projection: { typeName: '', kinds: projectionKinds },
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
                const innerFields = deriveFieldsRaw(rule.content, 'optional')
                const seen = new Set([rule.name])
                const extras: AssembledField[] = []
                for (const f of innerFields) {
                    if (seen.has(f.name)) continue
                    seen.add(f.name)
                    // Inner branches are alternatives, so inner fields are
                    // structurally optional from the parent's perspective.
                    // Downgrade any 'single'/'nonEmptyArray' values to optional/array.
                    const optValues = f.values.map(v => ({ ...v, multiplicity: toOptionalMultiplicity(v.multiplicity) }))
                    extras.push({ ...f, values: optValues })
                }
                if (extras.length > 0) return [outerField, ...extras]
            }
            return [outerField]
        }
        case 'seq':
            return rule.members.flatMap(m => deriveFieldsRaw(m, outerMultiplicity))
        case 'optional':
            return deriveFieldsRaw(rule.content, 'optional')
        case 'repeat':
            return deriveFieldsRaw(rule.content, 'array')
        case 'repeat1':
            return deriveFieldsRaw(rule.content, 'nonEmptyArray')
        case 'choice': {
            // Walk each branch independently, then merge: a field is
            // required (and non-empty) only if it appears in EVERY
            // branch. Fields present in only some branches are
            // optional from the parent's perspective — another branch
            // could be taken instead — so values of absent-branch
            // fields get their multiplicity downgraded to 'optional'.
            // This distinguishes `update_expression`-style choices
            // (every branch contributes the same fields, all required)
            // from `function_modifiers`-style choices (each branch
            // contributes a different field, each optional).
            const perBranch = rule.members.map(m =>
                deriveFieldsRaw(m, outerMultiplicity),
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
                        // Not in all branches → optional slot: downgrade multiplicities
                        const optValues = f.values.map(v => ({ ...v, multiplicity: toOptionalMultiplicity(v.multiplicity) }))
                        result.push({ ...f, values: optValues })
                    }
                }
            }
            return result
        }
        case 'clause':
            return deriveFieldsRaw(rule.content, 'optional')
        case 'variant':
        case 'group':
            return deriveFieldsRaw(rule.content, outerMultiplicity)
        default:
            return []
    }
}

/**
 * Convert a non-optional multiplicity to its optional equivalent.
 * Used when a field appears in only some choice branches.
 *
 * - `single` → `optional`
 * - `nonEmptyArray` → `array` (can now be empty from parent's perspective)
 * - `array` → `array` (already allows empty)
 * - `optional` → `optional` (already optional)
 */
function toOptionalMultiplicity(m: Multiplicity): Multiplicity {
    switch (m) {
        case 'single': return 'optional'
        case 'nonEmptyArray': return 'array'
        default: return m
    }
}

/**
 * Determine the effective multiplicity for a field's content rule, threading
 * any outer multiplicity through field-level wrappers (repeat/optional directly
 * inside the field).
 *
 * `field('items', repeat($._item))` → content is `repeat` → `'array'`
 * `field('items', repeat1($._item))` → content is `repeat1` → `'nonEmptyArray'`
 * `field('x', optional($.foo))` → content is `optional` → `'optional'`
 * `field('x', $.foo)` → content is `symbol`, outerMultiplicity is `single` → `'single'`
 */
function fieldContentMultiplicity(content: Rule, outerMultiplicity: Multiplicity): Multiplicity {
    switch (content.type) {
        case 'repeat': return 'array'
        case 'repeat1': return 'nonEmptyArray'
        case 'optional': {
            const inner = fieldContentMultiplicity(content.content, outerMultiplicity)
            // optional(repeat1(...)) → repeat (the optional makes nonEmpty drop)
            if (inner === 'nonEmptyArray') return 'array'
            return 'optional'
        }
        default: return outerMultiplicity
    }
}

export function deriveChildren(rule: Rule): AssembledChild[] {
    const raw: AssembledChild[] = []
    walkForChildren(rule, raw, 'single')
    // Deduplicate by child name — merge values arrays.
    const byName = new Map<string, AssembledChild>()
    for (const c of raw) {
        const existing = byName.get(c.name)
        if (!existing) {
            byName.set(c.name, { ...c })
            continue
        }
        byName.set(c.name, {
            ...existing,
            values: dedupeValues([...existing.values, ...c.values]),
        })
    }
    return Array.from(byName.values())
}

function walkForChildren(
    rule: Rule,
    out: AssembledChild[],
    multiplicity: Multiplicity,
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
                    values: [{ kind: 'node-ref', node: { kind: 'unresolved-ref', name: rule.name }, multiplicity }],
                })
            }
            break
        case 'supertype':
            // Resolved supertype reference — dispatches to any subtype at
            // runtime. Emit one slot with the supertype's name.
            {
                const cleanName = rule.name.replace(/^_+/, '') || rule.name
                out.push({
                    name: cleanName,
                    propertyName: snakeToCamel(cleanName),
                    values: rule.subtypes.map(name => ({
                        kind: 'node-ref' as const,
                        node: { kind: 'unresolved-ref' as const, name },
                        multiplicity,
                    })),
                })
            }
            break
        case 'seq': {
            // Sibling-duplicate symbol/supertype refs with the same
            // target (rust or_pattern: two `_pattern` refs) represent
            // the multi-children shape. Mark those occurrences as
            // multi so downstream merge keeps multiplicity `array`.
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
                // If this target is duplicated, force 'array' multiplicity.
                const childMult: Multiplicity = dup ? 'array' : multiplicity
                walkForChildren(m, out, childMult)
            }
            break
        }
        case 'optional':
            walkForChildren(rule.content, out, 'optional')
            break
        case 'repeat':
            walkForChildren(rule.content, out, 'array')
            break
        case 'repeat1':
            walkForChildren(rule.content, out, 'nonEmptyArray')
            break
        case 'choice': {
            // Walk each branch into a scratch bucket, then merge into
            // `out`: a child slot is only required / non-empty if it
            // appears in EVERY branch of the choice. Children in only
            // some branches get their multiplicity downgraded to optional.
            const perBranch: AssembledChild[][] = rule.members.map(m => {
                const bucket: AssembledChild[] = []
                walkForChildren(m, bucket, multiplicity)
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
                        // Not in every branch → downgrade multiplicities to optional
                        const optValues = c.values.map(v => ({ ...v, multiplicity: toOptionalMultiplicity(v.multiplicity) }))
                        out.push({ ...c, values: optValues })
                    }
                }
            }
            break
        }
        case 'field':
            // Fields are handled by deriveFields, not children
            break
        case 'variant':
            walkForChildren(rule.content, out, multiplicity)
            break
        case 'clause':
            walkForChildren(rule.content, out, 'optional')
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

/**
 * Unified walker that produces `NodeOrTerminal[]` directly from a field's
 * content rule. Each entry carries its own per-value `multiplicity` — this
 * preserves information that the old parallel `deriveContentTypes` +
 * `deriveLiteralValues` pair silently dropped (e.g. `choice('const',
 * $.mutable_specifier)` previously produced `contentTypes=['mutable_specifier']`
 * and `literalValues=[]` because the old bail-on-mixed logic gave up;
 * now it produces `[TerminalValue('const','single'), NodeRef('mutable_specifier','single')]`).
 *
 * Multiplicity is threaded through the walker:
 *   - outer `optional(...)` → entries from content get `optional` multiplicity
 *   - outer `repeat(...)` → entries from content get `array` multiplicity
 *   - outer `repeat1(...)` → entries from content get `nonEmptyArray` multiplicity
 *   - no wrapper → entries get `single` multiplicity
 *
 * A `choice` produces MULTIPLE entries — one per arm (with deduplication).
 */
function deriveValuesForRule(
    rule: Rule,
    multiplicity: Multiplicity,
): NodeOrTerminal[] {
    switch (rule.type) {
        case 'symbol':
            return [{ kind: 'node-ref', node: { kind: 'unresolved-ref', name: rule.name }, multiplicity }]
        case 'supertype':
            // Supertype refs expand to their subtype list — each subtype is a
            // valid concrete kind the slot can hold.
            return rule.subtypes.map(name => ({
                kind: 'node-ref' as const,
                node: { kind: 'unresolved-ref' as const, name },
                multiplicity,
            }))
        case 'string':
            return [{ kind: 'terminal', value: rule.value, multiplicity }]
        case 'enum':
            // Enum: each enum member is a TerminalValue
            return rule.members.map(m => ({ kind: 'terminal' as const, value: m.value, multiplicity }))
        case 'choice':
            // Each arm is independent — union all entries. Arms may differ in
            // their own multiplicity if they wrap repeat/optional differently.
            return rule.members.flatMap(m => deriveValuesForRule(m, multiplicity))
        case 'optional':
            // Optional wrapper forces multiplicity to 'optional'. If the
            // inner rule already produces multi entries (repeat inside optional),
            // that case shouldn't arise after evaluate (optional(repeat) →
            // repeat with trailing semantics), but handle gracefully.
            return deriveValuesForRule(rule.content, 'optional')
        case 'repeat':
            return deriveValuesForRule(rule.content, 'array')
        case 'repeat1':
            return deriveValuesForRule(rule.content, 'nonEmptyArray')
        case 'field':
            // Nested field inside a choice — recurse into its content
            return deriveValuesForRule(rule.content, multiplicity)
        case 'variant':
        case 'clause':
        case 'group':
            return deriveValuesForRule(rule.content, multiplicity)
        case 'seq':
            // Seq inside a choice arm — flatten all members (rare, but
            // handles seq-of-symbols within choice arms).
            return rule.members.flatMap(m => deriveValuesForRule(m, multiplicity))
        default:
            return []
    }
}

/**
 * Compute the merged `values: NodeOrTerminal[]` for an AssembledChild or
 * AssembledField. Deduplicates by (kind+name/value, multiplicity) pair so
 * that two choice arms referencing the same kind with the same multiplicity
 * produce a single entry.
 *
 * The merge strategy for name-conflicts: if the same node name appears with
 * different multiplicities in different choice arms, keep BOTH entries — the
 * per-value shape is the point.
 */
function dedupeValues(values: NodeOrTerminal[]): NodeOrTerminal[] {
    const seen = new Set<string>()
    const result: NodeOrTerminal[] = []
    for (const v of values) {
        const key = v.kind === 'node-ref'
            ? `node-ref:${(v.node as UnresolvedRef).name ?? '?'}:${v.multiplicity}`
            : `terminal:${v.value}:${v.multiplicity}`
        if (!seen.has(key)) {
            seen.add(key)
            result.push(v)
        }
    }
    return result
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

// Reserved or restricted identifiers that cannot be top-level function names
// in strict-mode TypeScript (or would shadow globals in problematic ways).
const FACTORY_NAME_RESERVED = new Set([
    'arguments', 'eval', 'yield', 'await', 'async', 'function', 'class',
    'import', 'export', 'default', 'return', 'throw', 'new', 'delete',
    'typeof', 'instanceof', 'in', 'of', 'let', 'const', 'var', 'null',
    'true', 'false', 'undefined', 'NaN', 'Infinity', 'static', 'public',
    'private', 'protected', 'interface', 'package', 'implements',
])

/**
 * Strip the leading underscore (hidden-rule marker) from a normalized kind string
 * and collapse internal double-underscores into `_U_` so they survive PascalCase
 * flattening.
 */
function prepareKindForPascalCase(normalized: string): string {
    return normalized.replace(/^_+/, '').replace(/__+/g, '_U_')
}

/**
 * Derive `typeName`, `factoryName`, and `irKey` from a raw grammar kind string.
 *
 * Moved here from assemble.ts so the `AssembledNodeBase` constructor can call
 * it directly, eliminating the need for callers to pre-compute and pass these
 * derived fields.
 */
export function nameNode(kind: string): { typeName: string; factoryName: string; irKey: string } {
    const normalized = /^[\w_]+$/.test(kind) ? kind : tokenToName(kind)
    const marked = prepareKindForPascalCase(normalized)
    let typeName = marked
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('') || 'Anonymous'
    if (/^\d/.test(typeName)) typeName = `Tok_${typeName}`
    let factoryName = typeName.charAt(0).toLowerCase() + typeName.slice(1)
    if (FACTORY_NAME_RESERVED.has(factoryName)) factoryName = `${factoryName}_`
    const irKey = factoryName
    return { typeName, factoryName, irKey }
}

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
     * True when this kind requires NO user-supplied arguments to construct.
     *
     * Populated by the `markParameterlessKinds` fixpoint pass in
     * `assemble.ts`. Two classes of parameterless kinds:
     *
     * - **Single-literal terminals** (`AssembledKeyword`): factory takes
     *   `()` and emits a fixed `$text` value. Stamp via `stampExpression`.
     * - **Parameterless compounds**: every required field/child slot
     *   either auto-stamps (literal or referenced keyword) OR references
     *   another parameterless kind. The whole compound can be constructed
     *   by calling its factory with no arguments: `stampExpression` holds
     *   the call expression string (e.g. `"breakExpression()"`).
     *
     * Emitters use this to decide whether a slot pointing at this kind
     * can be auto-stamped in parent factories and omitted from parent
     * Config types.
     */
    isParameterless?: boolean

    /**
     * Code-gen stamp expression for this parameterless kind.
     *
     * Defined iff `isParameterless` is true. Two shapes:
     *
     * - **Keyword / terminal**: JSON-encoded literal, e.g. `"'break'"`.
     *   Parent factory stamps the field as the literal value.
     * - **Parameterless compound**: factory-call string, e.g.
     *   `"breakExpression()"`. Parent factory stamps the field by calling
     *   the referenced kind's factory with no arguments, producing the
     *   expected NodeData.
     *
     * Populated by `markParameterlessKinds` alongside `isParameterless`.
     */
    stampExpression?: string
    /**
     * The grammar rule that produced this assembled node. All 10 concrete
     * subclasses store their rule here. The generic parameter `R` narrows
     * this to the exact Rule subset each subclass accepts — the narrowing
     * is truthful at runtime (not just documentation) because every
     * subclass constructor stores its rule argument here.
     *
     * **Protected — no external consumer reaches in.** The project
     * convention: only `renderTemplate()` methods (and other in-class
     * behaviors) read `this.rule` directly. Outside consumers (emitters,
     * assemble/link phases, tests) must go through the class's public
     * getters (`members`, `content`, `separator`, `text`, `values`,
     * `subtypes`, `forms`, `pattern`, `elementRule`, `isTextTemplate`,
     * ...) — if a new use case needs raw rule access, add the
     * corresponding getter here instead of widening this field.
     */
    protected readonly rule: R

    constructor(kind: string, rule: R, opts?: { factoryName?: string; irKey?: string; source?: RuleSource; hidden?: boolean }) {
        this.kind = kind
        this.rule = rule
        const derived = nameNode(kind)
        this.typeName = derived.typeName
        // `hidden: true` suppresses factoryName derivation (node has no factory).
        // `factoryName: string` overrides the derived name.
        // Default: use the derived factoryName.
        this.factoryName = (opts?.hidden === true) ? undefined : (opts?.factoryName ?? derived.factoryName)
        this.irKey = opts?.irKey ?? derived.irKey
        this.source = opts?.source
    }

    /** A node is hidden when it has no factory (supertype, group, token). */
    get hidden(): boolean {
        return this.factoryName === undefined
    }

    /**
     * True when this node's rule shape is a text template — a rule whose
     * parse result is emitted as a single string of text rather than a
     * structured config/children value. Two sources: verbatim-token-stream
     * rules (bare-literal sequences with no fields / symbols), and rules
     * that reach an external hidden token.
     *
     * Consumers (emitters) use this instead of reading `node.rule` directly —
     * per the project convention that only renderTemplate() methods on
     * AssembledNode subclasses reach into the raw rule.
     */
    isTextTemplate(externals: ReadonlySet<string> | undefined): boolean {
        if (externals !== undefined && externals.size > 0 && hasHiddenExternalRef(this.rule, externals)) {
            return true
        }
        return isVerbatimTokenStream(this.rule)
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
    /**
     * Unified per-value content. Each entry carries its own `multiplicity`
     * so that mixed-cardinality choices (e.g. `choice(optional($.foo),
     * repeat($.bar))`) are represented faithfully.
     *
     * Use the derived helpers (`isRequired`, `isMultiple`, `isNonEmpty`)
     * to compute slot-level booleans rather than reading flags directly.
     */
    readonly values: readonly NodeOrTerminal[]
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

/**
 * Inline `$X_CLAUSE` references into the template as Jinja
 * `{% if x %}<body>{% endif %}` blocks. The body's `$VAR`
 * placeholders stay in `$`-dialect; the final emitter pass converts
 * them to `{{ var }}` in one go.
 *
 * This is the single chokepoint where the walker-era `clauses` record
 * collapses into the template string. After this helper runs, the
 * returned template is Jinja-shaped (save for `$VAR`) — no separate
 * metadata record needs to travel downstream.
 */
function inlineJinjaClauses(template: string, clauses: Record<string, string>): string {
    if (Object.keys(clauses).length === 0) return template
    // Match `$VAR_CLAUSE` placeholders (uppercase). The stem is the
    // full key lowercased with `_clause` still attached — e.g.
    // `$RETURN_TYPE_CLAUSE` matches key `return_type_clause`.
    return template.replace(/\$([A-Z][A-Z0-9_]*_CLAUSE)/g, (full, marker: string) => {
        const key = marker.toLowerCase()
        const body = clauses[key]
        if (body === undefined) return full  // not a clause we emitted — leave as-is
        const stem = key.slice(0, -'_clause'.length)
        return `{% if ${stem} %}${body}{% endif %}`
    })
}

export class AssembledBranch extends AssembledNodeBase<SeqRule | ChoiceRule> {
    readonly modelType = 'branch' as const
    // rule narrowed to SeqRule | ChoiceRule — branches classify from
    // compositional rules that carry fields / ordered children; the
    // classifier routes only these two shapes here.
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

    constructor(kind: string, rule: SeqRule | ChoiceRule, simplifiedRule: Rule, opts?: { factoryName?: string; irKey?: string }) {
        super(kind, rule, opts)
        this.simplifiedRule = simplifiedRule
    }

    /** Direct access to the rule's ordered members (seq or choice). */
    get members(): readonly Rule[] { return this.rule.members }

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
        // Inline clauses as `{% if x %}body{% endif %}` directly into
        // the template. Drops the sibling-key pattern (template + per-
        // clause keys on the same object) in favor of a single Jinja
        // template string — eliminates an intermediate translation
        // layer the Jinja emitter would otherwise have to perform.
        const entry: Record<string, unknown> = { template: inlineJinjaClauses(template, clauses) }
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
function isVerbatimTokenStream(rule: Rule): boolean {
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

function hasHiddenExternalRef(rule: Rule, externals: ReadonlySet<string>): boolean {
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

export class AssembledContainer extends AssembledNodeBase<SeqRule | ChoiceRule | RepeatRule | Repeat1Rule> {
    readonly modelType = 'container' as const
    // rule narrowed — containers hold ordered or repeated unnamed
    // children (no fields). Classifier routes seq/choice/repeat/repeat1
    // shapes here when the rule has children but no fields.
    /** See `AssembledBranch.simplifiedRule`. */
    readonly simplifiedRule: Rule

    #children?: AssembledChild[]

    constructor(kind: string, rule: SeqRule | ChoiceRule | RepeatRule | Repeat1Rule, simplifiedRule: Rule, opts?: { factoryName?: string; irKey?: string }) {
        super(kind, rule, opts)
        this.simplifiedRule = simplifiedRule
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
        const entry: Record<string, unknown> = { template: inlineJinjaClauses(template, clauses) }
        const sep = this.separator ?? findRepeatSeparator(this.simplifiedRule)
        if (sep) entry.joinBy = sep
        if (findRepeatFlag(this.simplifiedRule, 'trailing')) entry.joinByTrailing = true
        if (findRepeatFlag(this.simplifiedRule, 'leading')) entry.joinByLeading = true
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
    }

}

export class AssembledPolymorph extends AssembledNodeBase<PolymorphRule> {
    readonly modelType = 'polymorph' as const
    // #forms is stored separately because AssembledGroup instances are
    // constructed by assemble.ts and passed in — they don't live on the rule.
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

    constructor(kind: string, rule: PolymorphRule | ChoiceRule, forms: AssembledGroup[], opts?: { source?: 'promoted' | 'override'; variantChildKinds?: readonly string[]; factoryName?: string; irKey?: string }) {
        const ruleSource = rule.type === 'polymorph' ? rule.source : undefined
        super(kind, rule as PolymorphRule, { factoryName: opts?.factoryName, irKey: opts?.irKey, source: ruleSource })
        this.#forms = forms
        this.source = opts?.source ?? 'promoted'
        this.variantChildKinds = opts?.variantChildKinds ?? []
    }

    /** A polymorph's forms are hidden groups synthesized from the choice branches. */
    get forms(): AssembledGroup[] { return this.#forms }

    /**
     * Flattened field list across all forms — the union of every form's
     * `fields` array. Used by emitters that need "all fields this polymorph
     * may carry" without caring which form owns each one.
     *
     * Single derivation point for the `forms.flatMap(f => f.fields)` pattern
     * that multiple emitters previously duplicated.
     */
    get allFormFields(): AssembledField[] {
        return this.#forms.flatMap(f => f.fields)
    }

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
            const { template, clauses, joinByField } = form.renderParts(rules, wordMatcher)
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
        // Collapse identical-across-forms variants to a single template
        // string (ADR-0013 Task 2). Post-collapse the five rules that
        // genuinely branch on form emit a Jinja `{% if variant == "X" %}`
        // chain inline (populated from the per-form templates), so the
        // emitter never sees a `variants:` map — the downstream
        // translator pass just converts `$VAR` → `{{ var }}` without
        // knowing about variants at all.
        const formNames = Object.keys(variants)
        const normalizeTrailingNewline = (s: string): string => s.endsWith('\n') ? s.slice(0, -1) : s
        const allEqual = formNames.length > 1
            && formNames.every(n => normalizeTrailingNewline(variants[n]!) === normalizeTrailingNewline(variants[formNames[0]!]!))
        let templateStr: string
        if (allEqual) {
            templateStr = variants[formNames[0]!]!
        } else {
            // Build the `{%- if variant == "a" -%}A:$NAME{%- elif … -%}…{%- endif -%}`
            // chain. Whitespace-controls suppress the newlines between
            // the template fragments so the output joins cleanly.
            const parts: string[] = []
            for (let i = 0; i < formNames.length; i++) {
                const formName = formNames[i]!
                const keyword = i === 0 ? 'if' : 'elif'
                parts.push(`{%- ${keyword} variant == ${JSON.stringify(formName)} -%}`)
                parts.push(variants[formName]!)
            }
            parts.push('{%- endif -%}')
            templateStr = parts.join('\n')
        }
        // Inline the merged per-form clauses as `{% if x %}body{% endif %}`
        // just like the branch/container renderTemplate methods.
        const entry: Record<string, unknown> = {
            template: inlineJinjaClauses(templateStr, mergedClauses),
        }
        if (Object.keys(mergedJoinByField).length > 0) entry.joinByField = mergedJoinByField
        return entry
    }

}

export class AssembledLeaf extends AssembledNodeBase<PatternRule | TerminalRule> {
    readonly modelType = 'leaf' as const

    constructor(kind: string, rule: PatternRule | TerminalRule, opts?: { factoryName?: string; irKey?: string }) {
        super(kind, rule, opts)
    }

    /** The leaf's regex pattern value when the rule is a PatternRule; undefined for TerminalRule. */
    get pattern(): string | undefined {
        return this.rule.type === 'pattern' ? (this.rule.value || undefined) : undefined
    }
}

export class AssembledKeyword extends AssembledNodeBase<StringRule> {
    readonly modelType = 'keyword' as const

    constructor(kind: string, rule: StringRule, opts?: { factoryName?: string; irKey?: string; hidden?: boolean }) {
        super(kind, rule, opts)
    }

    /** The literal text this keyword produces (read from the StringRule). */
    get text(): string { return this.rule.value }
}

export class AssembledToken extends AssembledNodeBase<StringRule | TokenRule> {
    readonly modelType = 'token' as const

    constructor(kind: string, rule: StringRule | TokenRule) {
        super(kind, rule, { hidden: true })
    }
    // No emitFactory — tokens are always hidden, no factoryName.

    /**
     * The literal text this token produces when its rule body is a
     * single string (post-optimize inline of `token(string)` or
     * `prec(n, string)` wrappers around a bare literal). Returns
     * `undefined` when the body is a `TokenRule` wrapping pattern-based
     * content — those don't have a single user-visible string.
     */
    get text(): string | undefined {
        if (this.rule.type === 'string') return this.rule.value
        return undefined
    }
}

export class AssembledEnum extends AssembledNodeBase<EnumRule> {
    readonly modelType = 'enum' as const

    constructor(kind: string, rule: EnumRule, opts?: { factoryName?: string; irKey?: string }) {
        super(kind, rule, opts)
    }

    /** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
    get values(): string[] { return this.rule.members.map(m => m.value) }
}

export class AssembledSupertype extends AssembledNodeBase<SupertypeRule | ChoiceRule> {
    readonly modelType = 'supertype' as const
    // #subtypes stores the RESOLVED subtype list (hidden names expanded to
    // their concrete kinds) — this differs from rule.subtypes which carries
    // the raw names as declared in the grammar. Do NOT replace with rule.subtypes.
    readonly #subtypes: string[]

    constructor(kind: string, rule: SupertypeRule | ChoiceRule, subtypes: string[]) {
        // Supertypes are always hidden — they're dispatch points, not user-constructable nodes.
        super(kind, rule as SupertypeRule, { hidden: true })
        this.#subtypes = subtypes
    }

    /** Resolved concrete kind names in this supertype union. */
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
export class AssembledMulti extends AssembledNodeBase<RepeatRule | Repeat1Rule> {
    readonly modelType = 'multi' as const
    // rule narrowed — multis are hidden repeat helpers. Classifier
    // routes repeat / repeat1 shapes here when the hidden rule's
    // top-level content is a repeat.

    constructor(kind: string, rule: RepeatRule | Repeat1Rule, opts?: { irKey?: string }) {
        // Multi nodes are always hidden (no factoryName)
        super(kind, rule, { hidden: true, irKey: opts?.irKey })
    }

    /** The repeat's inner content type — raw Rule, for downstream
     * consumers that need the element union (types emitter maps this
     * to a union of TypeNames, inlineGroupRefs hands the whole repeat
     * back to referrers). */
    get elementRule(): Rule { return this.rule.content }

    /** `true` when the source rule is `repeat1` (at least one element);
     * `false` for plain `repeat` (zero-or-more). Referrers thread this
     * into AssembledChild.nonEmpty. */
    get nonEmpty(): boolean { return this.rule.type === 'repeat1' }

    /** Separator string from the repeat rule, if any. */
    get separator(): string | undefined { return this.rule.separator }

    /** Whether a trailing separator is permitted. */
    get trailing(): boolean | undefined { return this.rule.trailing }

    /** Whether a leading separator is permitted. */
    get leading(): boolean | undefined { return this.rule.leading }
}

export class AssembledGroup extends AssembledNodeBase<Rule> {
    readonly modelType = 'group' as const
    // rule typed as Rule — groups can carry GroupRule (pre-unwrap),
    // SeqRule/ChoiceRule after unwrapGroupRuleAndSimplified(), or any
    // Rule when constructed as polymorph forms (form.content can be
    // any Rule type).
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

    constructor(kind: string, rule: Rule, simplifiedRule: Rule, opts?: { factoryName?: string; irKey?: string; detectToken?: string; name?: string; parentKind?: string }) {
        // Groups are hidden unless factoryName is explicitly provided (polymorph forms pass it).
        const hidden = !opts?.factoryName
        super(kind, rule, { hidden, factoryName: opts?.factoryName, irKey: opts?.irKey })
        this.simplifiedRule = simplifiedRule
        this.detectToken = opts?.detectToken
        this.name = opts?.name ?? kind
        this.parentKind = opts?.parentKind
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
        const entry: Record<string, unknown> = { template: inlineJinjaClauses(template, clauses) }
        const sep = findRepeatSeparator(this.simplifiedRule)
        if (sep) entry.joinBy = sep
        if (findRepeatFlag(this.simplifiedRule, 'trailing')) entry.joinByTrailing = true
        if (findRepeatFlag(this.simplifiedRule, 'leading')) entry.joinByLeading = true
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
    }

    /**
     * Raw template walk — used by `AssembledPolymorph.renderTemplate` to
     * collect per-form template/clauses/joinByField parts without the
     * outer entry-packaging that `renderTemplate` adds.
     *
     * Returns the walker's raw output so the polymorph can merge multiple
     * forms' clauses into a single parent entry. Keeps `this.rule`
     * encapsulated — the sibling class doesn't reach in.
     */
    renderParts(rules?: Record<string, Rule>, wordMatcher?: RegExp): { template: string; clauses: Record<string, string>; joinByField: Record<string, string> } {
        return renderRuleTemplate(this.rule, false, rules, wordMatcher)
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
