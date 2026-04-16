/**
 * derive-overrides-json — synthesise the runtime OverridesConfig shape
 * (what `packages/{grammar}/overrides.json` contains today) from the
 * post-evaluate rule tree produced by `overrides.ts`.
 *
 * The runtime contract (see `packages/core/src/readNode.ts`) is:
 *
 *     OverridesConfig = Record<kind, { fields: Record<name, {
 *       types: Array<{ type: string; named: boolean }>
 *       multiple: boolean
 *       required: boolean
 *       position: number
 *     }>}>
 *
 * We walk each rule's top-level seq, pick out `field(name, content)`
 * wrappers, flatten `content` to its contributing kinds, and track
 * `position` as the index in the walk order (0-based; -1 if the field
 * is not anchored to a positional slot, e.g. nested inside a choice
 * variant where its position varies per branch).
 *
 * This is a WRITE-ONLY view for diffing against the hand-maintained
 * overrides.json — no other compiler pass consumes its output.
 */

import type { Rule } from './rule.ts'

export interface DerivedFieldSpec {
    types: Array<{ type: string; named: boolean }>
    multiple: boolean
    required: boolean
    position: number
}

export interface DerivedNodeOverrides {
    fields: Record<string, DerivedFieldSpec>
}

export type DerivedOverridesConfig = Record<string, DerivedNodeOverrides>

interface WalkContext {
    optional: boolean
    repeated: boolean
    /**
     * -1 when the caller is walking content not anchored to a fixed
     * positional slot (e.g. members of a choice variant where position
     * varies per branch). Otherwise the seq index the walk started at.
     */
    position: number
    /**
     * True when the rule being walked was explicitly defined in the
     * override (not inherited from the base grammar). Relaxes the
     * `source: 'override'` filter so full-replacement override rules
     * (which call `field()` directly rather than through `transform()`)
     * have their fields collected too.
     */
    inOverrideRule?: boolean
}

/**
 * Walk a rule tree and collect every `field()` wrapper found at or
 * below the root. Positions are assigned from the walker's entry seq
 * index; nested seqs inside variants/choices get -1 because their
 * positional meaning depends on which branch is taken at runtime.
 */
function collectFields(
    rule: Rule,
    ctx: WalkContext,
    out: Array<{ name: string; spec: DerivedFieldSpec }>,
): void {
    switch (rule.type) {
        case 'seq': {
            // Position counts NAMED slots only — matches readNode's
            // runtime child enumeration which skips anonymous tokens.
            // String literals, enums of strings, and other anonymous
            // content don't advance the counter.
            let namedIdx = 0
            for (const member of rule.members) {
                const memberPos = ctx.position === -1 ? -1 : namedIdx
                collectFields(member, { ...ctx, position: memberPos }, out)
                if (isNamedSlot(member)) namedIdx++
            }
            return
        }

        case 'field': {
            // Routing map kept for fields the parser doesn't surface:
            // - `override` — parser carries (transform/enrich.kindToName).
            //                 SKIPPED.
            // - `inferred` — enrich bareKeyword / optionalKeyword. Tree-
            //                 sitter strips these, so the routing map
            //                 still drives readNode's field promotion
            //                 for them. KEPT. readNode also has an
            //                 anonymous-token fallback (see
            //                 promoteAnonymousKeyword) but the routing
            //                 entries carry the canonical position/type
            //                 metadata needed by render's field lookup.
            // - `grammar`  — native field. SKIPPED.
            // - undefined  — full-replacement override rules. KEPT when
            //                 ctx.inOverrideRule.
            const isFirstPartyField =
                rule.source === 'inferred'
                || (ctx.inOverrideRule && rule.source !== 'override' && rule.source !== 'grammar')
            const isForeignField = !isFirstPartyField
            if (isForeignField) {
                collectFields(rule.content, ctx, out)
                return
            }
            const types = collectTypes(rule.content, { named: true })
            const innerOptional = isOptionalShape(rule.content)
            const innerRepeated = isRepeatedShape(rule.content)
            out.push({
                name: rule.name,
                spec: {
                    types,
                    multiple: ctx.repeated || innerRepeated,
                    required: !(ctx.optional || innerOptional),
                    position: ctx.position,
                },
            })
            // Don't descend into the field's content for nested field
            // extraction — readNode's OverridesConfig is flat per kind
            // and inner fields would collide on the same parent.
            return
        }

        case 'optional':
            collectFields(rule.content, { ...ctx, optional: true }, out)
            return

        case 'repeat':
        case 'repeat1':
            collectFields(rule.content, { ...ctx, repeated: true }, out)
            return

        case 'choice': {
            // Members of a choice are alternative shapes. A field that
            // only appears in some alternatives is `required: false`.
            // Position becomes -1 because the index is branch-dependent.
            // Reset `repeated` — a branch's field isn't multi just
            // because an outer repeat cycles the whole choice; each
            // cycle still picks one branch with one instance of each
            // inner field.
            for (const m of rule.members) {
                collectFields(
                    m,
                    { ...ctx, optional: true, position: -1, repeated: false },
                    out,
                )
            }
            return
        }

        case 'variant':
        case 'clause':
        case 'group':
            collectFields(rule.content, ctx, out)
            return

        case 'polymorph':
            // Recurse into each form — treat each form as an optional
            // alternative (same as a choice branch) with no positional anchor.
            for (const form of rule.forms) {
                collectFields(form.content, { ...ctx, optional: true, position: -1 }, out)
            }
            return

        default:
            return
    }
}

/**
 * Flatten a rule's content down to the concrete kinds it contributes
 * to a field slot. Symbols and supertypes emit one entry each (using
 * the referenced name); string literals emit an anonymous entry; enums
 * emit one anonymous entry per value.
 *
 * This intentionally does NOT follow symbol definitions — we only look
 * at the rule's immediate subtree, matching what tree-sitter encodes
 * in node-types.json `fields[].types[]`.
 */
function collectTypes(
    rule: Rule,
    hint: { named: boolean },
): Array<{ type: string; named: boolean }> {
    switch (rule.type) {
        case 'symbol':
            // Hidden (`_`-prefixed) symbols are still NAMED types — tree-sitter's
            // node-types.json lists them under fields.types with `named: true`.
            // `named: false` is reserved for anonymous literal tokens.
            return [{ type: rule.name, named: true }]

        case 'supertype':
            return [{ type: rule.name, named: true }]

        case 'string':
            return [{ type: rule.value, named: false }]

        case 'enum':
            return rule.values.map(v => ({ type: v, named: false }))

        case 'choice':
            // Each branch is a real alternative — keep both named symbols
            // AND anonymous literals so routing can promote either kind
            // to the field slot. e.g. `field('mutable_specifier',
            // choice('const', $.mutable_specifier))` must promote BOTH the
            // `const` token and the `mutable_specifier` symbol.
            return dedupeTypes(rule.members.flatMap(m => collectTypes(m, hint)))

        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'terminal':
            return collectTypes((rule as { content: Rule }).content, hint)

        case 'alias':
            // Aliases rename a target symbol. The renamed label is what
            // shows up in the parse tree, so emit that.
            return [{ type: rule.value, named: rule.named }]

        case 'seq': {
            // A seq inside a field slot — tree-sitter's node-types.json
            // lists only NAMED children under fields.types; anonymous
            // delimiters (`,`, `::`, `:`, `for`, etc.) never appear.
            // Descend into members that can contribute a named type and
            // drop pure anonymous ones. Fall back to the raw flattened
            // list if nothing named exists.
            const all = dedupeTypes(rule.members.flatMap(m => collectTypes(m, hint)))
            const named = all.filter(t => t.named)
            return named.length > 0 ? named : all
        }

        default:
            return []
    }
}

function dedupeTypes(
    list: Array<{ type: string; named: boolean }>,
): Array<{ type: string; named: boolean }> {
    const seen = new Set<string>()
    const out: Array<{ type: string; named: boolean }> = []
    for (const t of list) {
        const key = `${t.type}|${t.named}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push(t)
    }
    return out
}

function isOptionalShape(rule: Rule): boolean {
    if (rule.type === 'optional') return true
    if (rule.type === 'choice') {
        // A choice is "optional-shaped" if any branch is a blank / empty
        // seq — tree-sitter's way of encoding `optional(x)` historically.
        return rule.members.some(m => m.type === 'seq' && m.members.length === 0)
    }
    return false
}

function isRepeatedShape(rule: Rule): boolean {
    if (rule.type === 'repeat' || rule.type === 'repeat1') return true
    if (rule.type === 'optional' || rule.type === 'variant' ||
        rule.type === 'clause' || rule.type === 'group' ||
        rule.type === 'token' || rule.type === 'terminal') {
        return isRepeatedShape((rule as { content: Rule }).content)
    }
    if (rule.type === 'seq') {
        // sep-style patterns (`seq(elem, repeat(seq(',', elem)))`) are
        // repeated even though the seq itself isn't a repeat node.
        return rule.members.some(m => isRepeatedShape(m))
    }
    // Don't propagate repetition through `choice` alternatives. Each
    // branch is an independent shape that occurs once per choice match —
    // a `repeat1(choice(field('async','async'), …))` makes the CHOICE
    // repeatable, not any single branch's field. Tree-sitter's own
    // node-types.json marks these as single-valued.
    return false
}

/**
 * A "named slot" is a seq member that contributes a named child at
 * parse time. Anonymous strings, pure-string enums, and terminals
 * don't — they're inlined tokens. Symbols, supertypes, fields, and
 * wrappers around those do.
 */
function isNamedSlot(rule: Rule): boolean {
    switch (rule.type) {
        case 'symbol':
            // Hidden symbols (leading `_`) are inlined by tree-sitter
            // at parse time — their children surface under the parent,
            // so the symbol site itself doesn't occupy a named slot.
            // But we conservatively count it because a supertype hidden
            // symbol DOES dispatch one concrete subtype child.
            return true
        case 'supertype':
        case 'field':
        case 'alias':
            return true
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'terminal':
            return isNamedSlot((rule as { content: Rule }).content)
        case 'choice':
            return rule.members.some(isNamedSlot)
        case 'seq':
            return rule.members.some(isNamedSlot)
        case 'string':
        case 'pattern':
        case 'enum':
        case 'indent':
        case 'dedent':
        case 'newline':
            return false
        default:
            return false
    }
}

/**
 * Merge multiple collected occurrences of the same field name within
 * one rule. Readnode's OverridesConfig is flat per kind, so a field
 * that appears in several variant branches must be collapsed into one
 * entry. Union the `types`, OR the `multiple` flag, AND the `required`
 * flag (present-only-in-some-branches makes it not required), and keep
 * the first positional anchor (or -1 if any occurrence is branch-bound).
 */
function mergeFieldOccurrences(
    entries: Array<{ name: string; spec: DerivedFieldSpec }>,
): Record<string, DerivedFieldSpec> {
    const merged: Record<string, DerivedFieldSpec> = {}
    for (const { name, spec } of entries) {
        const existing = merged[name]
        if (!existing) {
            merged[name] = { ...spec, types: [...spec.types] }
            continue
        }
        existing.types = dedupeTypes([...existing.types, ...spec.types])
        existing.multiple = existing.multiple || spec.multiple
        existing.required = existing.required && spec.required
        if (existing.position !== spec.position) existing.position = -1
    }
    return merged
}

/**
 * Return true when the rule tree has evidence that the user ran a
 * transform() with source-tagging patches:
 * - A field wrapper explicitly tagged `source: 'override'` (from
 *   transform's field placeholder or dsl/field.ts two-arg field()).
 * - An `alias` node (variant() / alias() placeholder products) —
 *   these indicate transform() patches were applied even if no
 *   field wrapper ended up source-tagged (e.g., polymorph-only
 *   overrides that leave base fields intact).
 * When this returns false AND the rule is in overrideKinds, we treat
 * it as a full-replacement rule and relax the field collector so
 * its untagged field() calls still enter the routing map.
 */
function hasOverrideSourceField(rule: Rule): boolean {
    if (rule.type === 'field' && rule.source === 'override') return true
    if (rule.type === 'alias') return true
    // Polymorph rules produced by Link's applyOverridePolymorphs carry
    // `source: 'override'` — variant()-driven classification from the
    // user's transform patches. Link collapses the alias wrappers
    // inside so no `type: 'alias'` nodes remain; the polymorph's own
    // source tag is the surviving evidence.
    if (rule.type === 'polymorph' && rule.source === 'override') return true
    const children: Rule[] = []
    if ('members' in rule) children.push(...(rule as any).members)
    if ('content' in rule) children.push((rule as any).content)
    if ('forms' in rule) children.push(...(rule as any).forms.map((f: any) => f.content))
    return children.some(hasOverrideSourceField)
}

/**
 * Derive the runtime OverridesConfig from a post-evaluate rules dict.
 * Only kinds that carry at least one field wrapper end up in the map;
 * everything else is implicitly a pass-through (readNode default).
 *
 * @param overrideKinds - Rule names explicitly defined in the override
 *   file (not inherited from the base grammar). For these rules, if none
 *   of their fields carry `source: 'override'` (full-replacement rules
 *   that call `field()` directly rather than via `transform()`), the
 *   source filter is relaxed so their fields are still collected.
 */
export function deriveOverridesConfig(
    rules: Record<string, Rule>,
    overrideKinds?: ReadonlySet<string>,
    rawRules?: Record<string, Rule>,
): DerivedOverridesConfig {
    const out: DerivedOverridesConfig = {}
    for (const [kind, rule] of Object.entries(rules)) {
        // Relax the source filter only for fully-replaced override rules:
        // rules that ARE in the override set but have NO source='override'
        // fields (which transform() produces). Such rules define fields
        // entirely through direct field() calls and need the relaxed path.
        const isOverrideKind = overrideKinds?.has(kind) ?? false
        const isFullReplacement = isOverrideKind && !hasOverrideSourceField(rule)
        const collected: Array<{ name: string; spec: DerivedFieldSpec }> = []
        collectFields(rule, { optional: false, repeated: false, position: 0, inOverrideRule: isFullReplacement }, collected)
        if (collected.length === 0) continue
        const merged = mergeFieldOccurrences(collected)

        // Inline-alias rewrite: tree-sitter renames nodes at parse time
        // via `alias($.x, $.y)`. Link collapses the alias wrapper so the
        // linked rule tree surfaces `symbol('x')` where the parse tree
        // will actually produce `y`. Walk the pre-Link `rawRules[kind]`
        // rule looking for `field(fieldName, …alias($.*, $.y)…)` pairs
        // and rewrite the collected `types` lists to match runtime.
        if (rawRules && rawRules[kind]) {
            const fieldAliases = collectFieldAliasTargets(rawRules[kind])
            for (const [fieldName, targets] of fieldAliases) {
                const spec = merged[fieldName]
                if (!spec) continue
                // Replace any type that matches a raw-content symbol in
                // the alias. Prefer the alias targets when the current
                // types list contains only names that were aliased.
                const aliasTargetEntries = targets.map(t => ({ type: t, named: true }))
                spec.types = dedupeTypes([
                    ...spec.types.filter(t => !targets.includes(t.type) || !t.named),
                    ...aliasTargetEntries,
                ])
            }
        }

        out[kind] = { fields: merged }
    }
    return out
}

/**
 * Walk a raw (pre-Link) rule looking for every `field(name, …alias(x, y)…)`
 * pair. Returns `fieldName → [aliasTargetName, ...]`. Used to patch
 * post-Link type lists where the alias wrapper has been collapsed.
 */
function collectFieldAliasTargets(rule: Rule): Map<string, string[]> {
    const out = new Map<string, string[]>()
    walkForFieldAliases(rule, out, null)
    return out
}

function walkForFieldAliases(
    rule: Rule,
    out: Map<string, string[]>,
    currentField: string | null,
): void {
    switch (rule.type) {
        case 'field':
            walkForFieldAliases(rule.content, out, rule.name)
            return
        case 'alias':
            if (rule.named && currentField) {
                const existing = out.get(currentField) ?? []
                if (!existing.includes(rule.value)) existing.push(rule.value)
                out.set(currentField, existing)
            }
            walkForFieldAliases(rule.content, out, currentField)
            return
        case 'seq':
        case 'choice':
            for (const m of rule.members) walkForFieldAliases(m, out, currentField)
            return
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'terminal':
            walkForFieldAliases((rule as { content: Rule }).content, out, currentField)
            return
        default:
            return
    }
}
