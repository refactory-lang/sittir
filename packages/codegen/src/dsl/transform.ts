/**
 * dsl/transform.ts — sittir override primitives for rule patching.
 *
 * These are NOT tree-sitter baseline DSL. They are sittir-specific
 * extensions that operate on the `original` rule passed by tree-sitter's
 * `grammar(base)` mechanism to each rule callback.
 *
 * Override files import these explicitly:
 *
 *     import { transform, insert, replace } from '@sittir/codegen/dsl'
 *
 * The baseline shadow functions (`grammar`, `seq`, `choice`, `field`, ...)
 * are still injected as globals by `evaluate.ts` — don't import those.
 *
 * Types are deliberately `RuntimeRule` (not sittir's `Rule` union).
 * The `original` argument comes from tree-sitter's extension mechanism
 * at runtime — that's sittir-shaped under sittir's pipeline but
 * tree-sitter-native (uppercase types) under the CLI runtime. Typing
 * as `RuntimeRule` is honest in both directions and forces callers
 * that inspect the result to narrow via guards in `runtime-shapes.ts`.
 * Override files are `@ts-nocheck` so they're unaffected.
 */

import { parsePath, applyPath, reconstructWrapper, reconstructPrec, reconstructContainer } from './transform-path.ts'
import { isFieldPlaceholder, type FieldPlaceholder } from './field.ts'
import { isAliasPlaceholder, type AliasPlaceholder } from './alias.ts'
import { isVariantPlaceholder, type VariantPlaceholder } from './variant.ts'
import { getCurrentRuleKind, registerPolymorphVariant, maybeKeywordSymbol, registerAliasedVariant, registerSyntheticRule, registerConflict, wrapInPrecStack, matchesEmpty } from './synthetic-rules.ts'
import { isFieldLike, isPrecWrapper, isWrapperType, isSeqType, isChoiceType, type RuntimeRule } from './runtime-shapes.ts'

/**
 * Apply patches to a rule. Patches are an object with path-string keys
 * and Rule (or one-arg field placeholder) values:
 *
 *     transform(original, {
 *         0:       field('name'),       // flat numeric — single-segment path
 *         '0/1':   field('inner'),      // nested path
 *         '0/*\/0': field('items'),     // wildcard
 *     })
 *
 * Two evaluation modes, auto-detected by key shape:
 *
 * 1. **Flat positional** — every key is a pure numeric string. Patches
 *    apply to seq members at that position, recursively descending
 *    through choice alternatives and content wrappers (preserves
 *    legacy override behavior on rules where the original is a choice
 *    of equal-shape alternatives).
 *
 * 2. **Path-addressed** — at least one key contains `/` or `*`. Each
 *    key is parsed as a path and applied to exactly the position(s) it
 *    addresses. Precedence wrappers (prec/PREC_LEFT/...) are
 *    transparent so the same paths work in both sittir and tree-sitter
 *    runtimes.
 *
 * Field patches are marked `source: 'override'` so derive-overrides-json
 * recognizes them. One-arg `field('name')` placeholders are filled in
 * from the original member at the target position; an enrich-inferred
 * field wrapper on the original is unwrapped before re-wrapping to
 * avoid nested fields.
 */
type PatchSet = Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>

export function transform(
    original: RuntimeRule,
    ...patchSets: PatchSet[]
): RuntimeRule {
    let rule = original
    for (const patches of patchSets) {
        const hasPathKeys = requiresPathMode(patches)
        const hasPlaceholderAlias = Object.values(patches).some(v => isAliasPlaceholder(v) || isVariantPlaceholder(v))
        if (hasPathKeys || hasPlaceholderAlias) {
            rule = applyPathPatches(rule, patches)
        } else {
            rule = applyFlatPatches(rule, patches as Record<number | string, RuntimeRule>)
        }
    }
    return rule
}

/**
 * Determine whether a patch-set must be processed in path mode rather
 * than flat-positional mode.
 *
 * @remarks
 * Path mode triggers whenever a key is not a pure non-negative integer.
 * Originally the predicate only checked for `/` or `*`; extending it to
 * the full "not-a-non-neg-integer" gate routes negative indices (`-1`)
 * and kind-name segments (`_expression`) through parsePath + applyPath
 * (they parsed as invalid in flat mode previously). Flat mode stays
 * reserved for simple positional patching of seq members with plain
 * `N: patch` entries.
 *
 * @param patches - The patch-set whose keys are inspected.
 * @returns `true` if any key is not a pure non-negative integer string.
 */
function requiresPathMode(patches: PatchSet): boolean {
    return Object.keys(patches).some(k => !/^\d+$/.test(k))
}

function applyPathPatches(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>,
): RuntimeRule {
    const { variantEntries, otherEntries } = partitionPatchesByVariant(patches)
    let rule = original
    for (const [key, value] of otherEntries) {
        const segments = parsePath(String(key))
        rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack))
    }
    if (variantEntries.length > 0) {
        rule = applyVariantPatches(rule, variantEntries)
    }
    return rule
}

/**
 * Separate a patch-set into variant patches and all other patches so
 * they can be applied in the correct two-phase order.
 *
 * @remarks
 * Variant patches must be applied after all other patches have baked
 * their field placements into the structure. Sequential per-patch
 * application can't handle hoisting because hoisting the first patch
 * restructures the rule so the second patch's path no longer resolves.
 *
 * @param patches - The full patch-set to partition.
 * @returns Two arrays: `variantEntries` for variant() patches and
 *   `otherEntries` for everything else.
 */
function partitionPatchesByVariant(
    patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>,
): {
    variantEntries: Array<[string, VariantPlaceholder]>
    otherEntries: Array<[string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder]>
} {
    const variantEntries: Array<[string, VariantPlaceholder]> = []
    const otherEntries: Array<[string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder]> = []
    for (const entry of Object.entries(patches)) {
        const v = entry[1]
        if (isVariantPlaceholder(v)) variantEntries.push([entry[0], v])
        else otherEntries.push(entry)
    }
    return { variantEntries, otherEntries }
}

/**
 * Apply variant patches to a rule, using hoisting when any variant
 * targets an empty-matching alternative, falling back to per-patch
 * application otherwise.
 *
 * @remarks
 * If any variant would extract an empty-matching body, hoist ALL sibling
 * variants to the nearest enclosing scaffolding so none match empty.
 * Literals move into each alias body so tree-sitter accepts the extracted
 * hidden rules (named syntactic rules can't match empty).
 *
 * @param rule - The rule (after non-variant patches) to apply variants to.
 * @param variantEntries - Array of [pathKey, VariantPlaceholder] pairs.
 * @returns The rule with all variant patches applied.
 */
function applyVariantPatches(
    rule: RuntimeRule,
    variantEntries: ReadonlyArray<[string, VariantPlaceholder]>,
): RuntimeRule {
    const hoisted = tryHoistSiblingVariants(rule, variantEntries)
    if (hoisted) {
        let result = hoisted.rule
        for (const [key, value] of variantEntries) {
            if (hoisted.consumed.has(key)) continue
            const segments = parsePath(key)
            result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, precStack))
        }
        return result
    }
    let result = rule
    for (const [key, value] of variantEntries) {
        const segments = parsePath(key)
        result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, precStack))
    }
    return result
}

/**
 * Detect and apply "hoisted variant" restructuring when any variant()
 * patch targets an empty-matching choice alternative. Without hoisting,
 * tree-sitter rejects the extracted hidden rule (named syntactic rules
 * can't match empty). With hoisting, the surrounding rule scaffolding
 * (e.g. `[` and `]` literals around the choice) moves INTO each alias
 * body — guarantees non-empty AND disambiguates from sibling rules with
 * similar inner shapes.
 *
 * Only handles the common case: top-level seq containing a choice whose
 * alternatives are the variant targets. Paths must all be `N/M` with
 * the same `N` (the choice's position in the seq). For more complex
 * nestings, the caller falls back to per-patch variant extraction.
 */
function tryHoistSiblingVariants(
    rule: RuntimeRule,
    variantEntries: ReadonlyArray<[string, VariantPlaceholder]>,
): { rule: RuntimeRule; consumed: Set<string> } | null {
    const { bail, precStack, core } = peelPrecWrappersFromRule(rule)
    const t = core.type
    if (!t) return bail('core rule has no type after prec peeling')
    if (!isSeqType(t)) return bail(`core rule type '${t}' is not seq/SEQ`)
    const parsed = parseVariantPathsForHoist(variantEntries, bail)
    if (parsed === null) return null
    const choicePos = parsed[0]!.choicePos
    if (parsed.some(p => p.choicePos !== choicePos)) return bail(`variant patches target mixed choice positions (${parsed.map(p => p.choicePos).join(',')}) — hoist needs all siblings at one choice`)
    const seqMembers = [...membersOf(core)]
    const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos
    const choice = seqMembers[resolvedPos]
    if (!choice || !isChoiceType(choice.type)) return bail(`position ${resolvedPos} is '${choice?.type}', not choice/CHOICE`)
    const choiceMembers = membersOf(choice)
    const anyEmpty = parsed.some(p => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]!))
    if (!anyEmpty) return null  // non-empty variants fall through to per-patch extraction — not an error, just not a hoist candidate
    const parentKind = getCurrentRuleKind()
    if (!parentKind) return bail('no current rule kind (variant()/transform() called outside rule callback?)')
    return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, parentKind, precStack)
}

/**
 * Peel prec wrappers from a rule root and set up the debug/bail context for
 * hoist analysis.
 *
 * @remarks
 * Grammars commonly wrap a polymorph in `prec.left(N, seq(...))` /
 * `prec.right(N, ...)` / `prec(tag, ...)` to resolve intra-rule ambiguities.
 * The same prec is reapplied to each hoisted variant's body so the extracted
 * rules inherit the parent's conflict-resolution context; otherwise
 * tree-sitter's LR table sees unresolvable ambiguities at the
 * extracted-variant sites. When SITTIR_DEBUG is set, the bail helper logs
 * which guard failed so authors can diagnose why a hoist didn't take effect —
 * "rule looks right but only one form was split" is otherwise impossible to
 * diagnose without stepping into transform.ts.
 *
 * @param rule - The rule to peel prec wrappers from.
 * @returns `bail` helper that logs + returns null, accumulated `precStack`, and
 *   the unwrapped `core` rule.
 */
function peelPrecWrappersFromRule(rule: RuntimeRule): {
    bail: (reason: string) => null
    precStack: RuntimeRule[]
    core: RuntimeRule
} {
    const dbg = typeof process !== 'undefined' ? process?.env?.SITTIR_DEBUG : undefined
    const kindFor = getCurrentRuleKind() ?? '(unknown)'
    const bail = (reason: string): null => {
        if (dbg) console.error(`[sittir] hoist skipped on '${kindFor}': ${reason}`)
        return null
    }
    const precStack: RuntimeRule[] = []
    let core = rule
    while (core && isPrecWrapper(core)) {
        precStack.push(core)
        core = contentOf(core)
    }
    return { bail, precStack, core }
}

/**
 * Parse variant patch entries into structured records for hoist analysis.
 *
 * @remarks
 * Each entry must be a two-segment `N/M` path with both segments being
 * plain indices. Kind-match and wildcard paths are not supported for
 * hoisting; the caller falls back to per-patch extraction if any entry
 * fails validation.
 *
 * @param variantEntries - Array of [pathKey, VariantPlaceholder] pairs.
 * @param bail - Bail function to call (and return) on validation failure.
 * @returns Parsed array or `null` if bail was invoked.
 */
function parseVariantPathsForHoist(
    variantEntries: ReadonlyArray<[string, VariantPlaceholder]>,
    bail: (reason: string) => null,
): Array<{ key: string; v: VariantPlaceholder; choicePos: number; altIdx: number }> | null {
    const parsed: Array<{ key: string; v: VariantPlaceholder; choicePos: number; altIdx: number }> = []
    for (const [key, v] of variantEntries) {
        const segs = parsePath(key)
        if (segs.length !== 2) return bail(`variant patch '${key}' has ${segs.length} segments (expected 2: N/M)`)
        if (segs[0]!.kind !== 'index' || segs[1]!.kind !== 'index') return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`)
        parsed.push({ key, v, choicePos: segs[0]!.value, altIdx: segs[1]!.value })
    }
    return parsed
}

/**
 * Build hoisted variant rules and register all required metadata.
 *
 * @remarks
 * Hoisted variants inherit their parent seq's scaffolding, so they
 * share a token prefix (e.g. `[` + attribute_item repeat) that defeats
 * tree-sitter's LR(1) lookahead. A conflict group is declared across all
 * variant names so the parser-generator emits a GLR state that forks on
 * the prefix and picks the completing interpretation at parse time. Each
 * variant is also declared as a self-conflict — when the variant shares
 * an internal repeat helper with sibling grammar rules (tree-sitter
 * dedups identical repeat shapes across rules, producing a single
 * `*_repeat1`), multiple reduction paths through the same shared helper
 * still produce an unresolved state without the self-entry.
 *
 * @param core - The unwrapped seq rule (after prec peeling).
 * @param seqMembers - Current members of the seq.
 * @param choiceMembers - Members of the targeted choice node.
 * @param resolvedPos - Resolved index of the choice inside the seq.
 * @param choice - The choice rule being replaced.
 * @param parsed - Pre-parsed variant path records.
 * @param parentKind - The kind name of the enclosing rule.
 * @param precStack - Accumulated prec wrappers to reapply around each
 *   variant body.
 * @returns The collapsed choice rule replacing the old seq member, plus
 *   the set of path keys consumed by hoisting.
 */
function buildHoistedVariants(
    core: RuntimeRule,
    seqMembers: RuntimeRule[],
    choiceMembers: RuntimeRule[],
    resolvedPos: number,
    choice: RuntimeRule,
    parsed: ReadonlyArray<{ key: string; v: VariantPlaceholder; choicePos: number; altIdx: number }>,
    parentKind: string,
    precStack: ReadonlyArray<RuntimeRule>,
): { rule: RuntimeRule; consumed: Set<string> } {
    const refs: RuntimeRule[] = []
    const isUpperCase = core.type === core.type.toUpperCase()
    for (const p of parsed) {
        const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx
        const altContent = choiceMembers[resolvedAlt]!
        const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m)
        const hoistedSeq = reconstructContainer(core, hoistedMembers)
        // Wrap each variant's body in the parent's prec context so
        // tree-sitter's conflict resolver sees the same precedence /
        // associativity the author declared on the parent rule.
        // `wrapInPrec` reapplies precStack inner-first so the outer-
        // most wrapper stays outermost — matches path-descent's
        // reassembly in applyPath.
        const hoistedBody = wrapInPrec(hoistedSeq, precStack)
        const visibleName = `${parentKind}_${p.v.name}`
        registerPolymorphVariant(parentKind, p.v.name)
        registerSyntheticRule(visibleName, hoistedBody)
        refs.push({
            type: isUpperCase ? 'SYMBOL' : 'symbol',
            name: visibleName,
        } as unknown as RuntimeRule)
    }
    registerHoistedVariantConflicts(parsed.map(p => `${parentKind}_${p.v.name}`))
    const newChoice = reconstructContainer(choice, refs)
    return { rule: newChoice, consumed: new Set(parsed.map(p => p.key)) }
}

/**
 * Register the GLR conflict groups required for hoisted sibling variants.
 *
 * @remarks
 * Hoisted variants share a token prefix from their parent seq's scaffolding,
 * defeating tree-sitter's LR(1) lookahead. A cross-variant conflict group
 * causes the parser-generator to emit a GLR state that forks on the shared
 * prefix. Each variant is also registered as a self-conflict because
 * tree-sitter deduplicates identical repeat shapes across rules into a
 * single `*_repeat1` helper; without the self-entry, multiple reduction
 * paths through the shared helper produce an unresolved state.
 *
 * @param variantNames - Fully-qualified names of all hoisted variants.
 */
function registerHoistedVariantConflicts(variantNames: string[]): void {
    registerConflict(variantNames)
    for (const n of variantNames) registerConflict([n])
}

// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through the function body.
const membersOf = (r: RuntimeRule): RuntimeRule[] =>
    (r as unknown as { members: RuntimeRule[] }).members
const contentOf = (r: RuntimeRule): RuntimeRule =>
    (r as unknown as { content: RuntimeRule }).content

function applyFlatPatches(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule>,
): RuntimeRule {
    const t = original.type
    if (isSeqType(t)) {
        return applyFlatPatchesToSeq(original, patches)
    }

    // Choice: apply transform to each member recursively. Reconstruct
    // via native dsl so the choice keeps its runtime-correct shape.
    if (isChoiceType(t)) {
        const newMembers = membersOf(original).map(m => applyFlatPatches(m, patches))
        return reconstructContainer(original, newMembers)
    }

    // Precedence wrappers — descend into content and reconstruct via
    // native prec to preserve the precedence value (critical for
    // tree-sitter's parser-generator to resolve conflicts the same way
    // as the base grammar).
    if (isPrecWrapper(original)) {
        const newContent = applyFlatPatches(contentOf(original), patches)
        return reconstructPrec(original, newContent)
    }

    // Single-content wrappers (optional/repeat/repeat1/field) — descend
    // and reconstruct via native dsl.
    if (isWrapperType(t)) {
        const newContent = applyFlatPatches(contentOf(original), patches)
        return reconstructWrapper(original, newContent)
    }

    // For other types, return as-is (patches don't apply)
    return original
}

/**
 * Apply flat-positional patches to a seq rule's members by raw index.
 *
 * @remarks
 * Accepts both sittir lowercase `'seq'` and tree-sitter uppercase `'SEQ'`
 * so the same transform call works in both runtimes. Reconstructed via
 * native dsl so the result has the runtime-correct rule shape.
 *
 * Non-pure-numeric keys are rejected up front — `Number('foo')` is NaN
 * and `Number('-0')` is 0. Typos like `'1a'` or `',0'` would otherwise
 * silently no-op. Matches parsePath's strict `/^\d+$/` gate so flat and
 * path modes agree on validity.
 *
 * Out-of-bounds indices throw to match path mode's behavior at
 * applyToMembers. Silently skipping was a footgun where a typo looked
 * like a no-op in sittir runtime.
 *
 * @param original - The seq rule to patch.
 * @param patches - Map of non-negative integer key strings to replacement rules.
 * @returns A new seq rule with the patched members.
 * @throws {Error} If a key is not a non-negative integer or an index is out of bounds.
 */
function applyFlatPatchesToSeq(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule>,
): RuntimeRule {
    const members = [...membersOf(original)]
    for (const [key, patch] of Object.entries(patches)) {
        if (!/^\d+$/.test(key)) {
            throw new Error(
                `transform: invalid flat-positional key '${key}' — keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`,
            )
        }
        const index = Number(key)
        if (index >= members.length) {
            throw new Error(
                `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`,
            )
        }
        members[index] = resolvePatch(patch, members[index]!)
    }
    return reconstructContainer(original, members)
}

const wrapInPrec = (content: RuntimeRule, precStack?: readonly RuntimeRule[]): RuntimeRule =>
    wrapInPrecStack(content, precStack, reconstructPrec)

function resolvePatch(
    patch: RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder,
    originalMember: RuntimeRule,
    precStack?: readonly RuntimeRule[],
): RuntimeRule {
    if (isFieldPlaceholder(patch)) {
        return resolveFieldPlaceholder(patch, originalMember, precStack)
    }
    // Two-arg field passed through directly — accept either case.
    if (isFieldLike(patch)) {
        return { ...patch, source: 'override' as const } as unknown as RuntimeRule
    }
    // Variant placeholder — variant('suffix'): auto-prefix with current
    // rule kind → alias('parentKind_suffix'). Registers polymorph metadata.
    if (isVariantPlaceholder(patch)) {
        const parentKind = getCurrentRuleKind()
        if (!parentKind) {
            throw new Error(`variant('${patch.name}'): no current rule kind — variant() must be used inside a rule callback`)
        }
        registerPolymorphVariant(parentKind, patch.name)
        const fullName = `${parentKind}_${patch.name}`
        const hiddenName = '_' + fullName
        return registerAliasedVariant(hiddenName, fullName, originalMember, body => wrapInPrec(body, precStack))
    }
    if (isAliasPlaceholder(patch)) {
        return resolveAliasPlaceholder(patch, originalMember, precStack)
    }
    return patch as RuntimeRule
}

/**
 * Resolve a one-arg field() placeholder against the original member at
 * its target position.
 *
 * @remarks
 * One-arg `field('name')` placeholder — wrap the original member using
 * the runtime's native field() so the resulting rule's type case matches
 * whatever runtime is loading us (sittir lowercase `'field'` vs
 * tree-sitter uppercase `'FIELD'`).
 *
 * An enrich-inferred field on the original member is unwrapped to avoid
 * nested `field('override', field('inferred', inner))`.
 *
 * Bare STRING content is handled specially: tree-sitter strips FIELD
 * wrappers around anonymous string literals during grammar normalization
 * (fields must label structural content, not bare tokens).
 * `maybeKeywordSymbol` synthesizes a hidden `_kw_<name>` rule that
 * produces the string and returns a SYMBOL reference — FIELD around
 * SYMBOL survives the normalizer. The hidden rule's body is wrapped in
 * high precedence so soft keywords (python `match`/`case` that are also
 * valid identifiers) win the keyword interpretation at the position
 * enrich promoted. Shared helper used by both this one-arg field()
 * placeholder and dsl/field.ts's two-arg form; receives the prec stack
 * so synthetic rules inherit the outer precedence context.
 *
 * @param patch - The one-arg FieldPlaceholder with the desired field name.
 * @param originalMember - The rule currently at the target position.
 * @param precStack - Accumulated prec wrappers for keyword symbol synthesis.
 * @returns A new field rule marked `source: 'override'`.
 * @throws {Error} If no global `field()` function is available in the runtime.
 */
function resolveFieldPlaceholder(
    patch: FieldPlaceholder,
    originalMember: RuntimeRule,
    precStack?: readonly RuntimeRule[],
): RuntimeRule {
    let content: unknown = originalMember
    if (isFieldLike(content) && content.source === 'inferred') {
        content = content.content
    }
    const maybeSymbolized = maybeKeywordSymbol(
        patch.name,
        content,
        (body) => wrapInPrec(body, precStack),
    )
    if (maybeSymbolized !== content) {
        content = maybeSymbolized
    }
    const native = (globalThis as { field?: (n: string, c: unknown) => unknown }).field
    if (typeof native !== 'function') {
        throw new Error('transform: no global field() found — patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)')
    }
    // Mark as override so derive-overrides-json sees it. Spread to
    // preserve whatever shape (lowercase/uppercase) the native produced.
    const reconstructed = native(patch.name, content) as object
    return { ...reconstructed, source: 'override' as const } as unknown as RuntimeRule
}

/**
 * Resolve an alias() placeholder by registering a hidden rule with the
 * original content and returning an alias reference.
 *
 * @remarks
 * alias('variant_name'): registers a hidden rule with the original
 * content and returns `alias($._hidden, $.visible)`. The hidden rule is
 * picked up by evaluate.ts (sittir) or the grammar wrapper (tree-sitter
 * CLI) after all callbacks run.
 *
 * @param patch - The AliasPlaceholder with the desired alias name.
 * @param originalMember - The rule currently at the target position.
 * @param precStack - Accumulated prec wrappers for the hidden rule body.
 * @returns A new alias rule wrapping the hidden rule.
 */
function resolveAliasPlaceholder(
    patch: AliasPlaceholder,
    originalMember: RuntimeRule,
    precStack?: readonly RuntimeRule[],
): RuntimeRule {
    const hiddenName = '_' + patch.name
    return registerAliasedVariant(hiddenName, patch.name, originalMember, body => wrapInPrec(body, precStack))
}

/**
 * Wrap a member at a position using a wrapper function that receives
 * the original content. The wrapper's result is marked `source: 'override'`.
 *
 * Reconstructs via the runtime's native `seq()` so the result has the
 * runtime-correct rule shape (sittir lowercase vs tree-sitter
 * uppercase) — same cross-runtime contract as `transform()`.
 */
export function insert(
    original: RuntimeRule,
    position: number,
    wrapper: (content: RuntimeRule) => RuntimeRule,
): RuntimeRule {
    const t = original.type
    if (!isSeqType(t)) {
        throw new Error(`insert() expects a seq rule, got '${original.type}'`)
    }

    const members = [...membersOf(original)]
    if (position < 0 || position >= members.length) {
        throw new Error(`insert(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    const wrapped = wrapper(members[position]!)
    members[position] = isFieldLike(wrapped)
        ? { ...wrapped, source: 'override' as const } as unknown as RuntimeRule
        : wrapped

    return reconstructContainer(original, members)
}

/**
 * Replace content at a position. Pass `null` to suppress (remove the
 * member). Reconstructs via the runtime's native `seq()`.
 */
export function replace(
    original: RuntimeRule,
    position: number,
    replacement: RuntimeRule | null,
): RuntimeRule {
    const t = original.type
    if (!isSeqType(t)) {
        throw new Error(`replace() expects a seq rule, got '${original.type}'`)
    }

    const members = [...membersOf(original)]
    if (position < 0 || position >= members.length) {
        throw new Error(`replace(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    if (replacement === null) {
        members.splice(position, 1)
    } else {
        members[position] = replacement
    }

    return reconstructContainer(original, members)
}
