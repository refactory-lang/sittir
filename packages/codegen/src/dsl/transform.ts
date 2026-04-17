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
import { isFieldLike, isPrecWrapper, isWrapperType, type RuntimeRule } from './runtime-shapes.ts'

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
        // Path mode triggers whenever a key isn't a pure non-negative
        // integer. Originally this predicate only checked for `/` or
        // `*`; extending it to the full "not-a-non-neg-integer" gate
        // is the behavior change that routes negative indices (`-1`)
        // and kind-name segments (`_expression`) through parsePath +
        // applyPath (they parsed as invalid in flat mode previously).
        // Flat mode stays reserved for simple positional patching of
        // seq members with plain `N: patch` entries.
        const hasPathKeys = Object.keys(patches).some(k => !/^\d+$/.test(k))
        const hasPlaceholderAlias = Object.values(patches).some(v => isAliasPlaceholder(v) || isVariantPlaceholder(v))
        if (hasPathKeys || hasPlaceholderAlias) {
            rule = applyPathPatches(rule, patches)
        } else {
            rule = applyFlatPatches(rule, patches as Record<number | string, RuntimeRule>)
        }
    }
    return rule
}

function applyPathPatches(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>,
): RuntimeRule {
    // Two-phase: apply non-variant patches first so field placements bake
    // into the original structure, then handle variant patches. If any
    // variant would extract an empty-matching body, hoist ALL sibling
    // variants to the nearest enclosing scaffolding (literals move into
    // each alias body so none match empty). Sequential per-patch
    // application can't do this because hoisting the first patch
    // restructures the rule so the second patch's path no longer resolves.
    const variantEntries: Array<[string, VariantPlaceholder]> = []
    const otherEntries: Array<[string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder]> = []
    for (const entry of Object.entries(patches)) {
        const v = entry[1]
        if (isVariantPlaceholder(v)) variantEntries.push([entry[0], v])
        else otherEntries.push(entry)
    }
    let rule = original
    for (const [key, value] of otherEntries) {
        const segments = parsePath(String(key))
        rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack))
    }
    if (variantEntries.length > 0) {
        const hoisted = tryHoistSiblingVariants(rule, variantEntries)
        if (hoisted) {
            rule = hoisted.rule
            for (const [key, value] of variantEntries) {
                if (hoisted.consumed.has(key)) continue
                const segments = parsePath(key)
                rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack))
            }
        } else {
            for (const [key, value] of variantEntries) {
                const segments = parsePath(key)
                rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack))
            }
        }
    }
    return rule
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
    // Peel off any prec wrapper(s) at the rule root so we can reach
    // the underlying seq. Grammars commonly wrap a polymorph in
    // `prec.left(N, seq(...))` / `prec.right(N, ...)` / `prec(tag,
    // ...)` to resolve intra-rule ambiguities. We reapply the same
    // prec to each hoisted variant's body below so the extracted
    // rules inherit the parent's conflict-resolution context;
    // otherwise tree-sitter's LR table sees unresolvable ambiguities
    // at the extracted-variant sites.
    // Each guard below returns null, falling back to per-patch variant
    // extraction. When SITTIR_DEBUG is set, log which guard failed so
    // authors can see why their hoist didn't take effect — "rule looks
    // right but only one form was split" is otherwise impossible to
    // diagnose without stepping into transform.ts.
    const dbg = typeof process !== 'undefined' && process?.env?.SITTIR_DEBUG
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
    const t = core?.type
    if (!t) return bail('core rule has no type after prec peeling')
    if (t !== 'seq' && t !== 'SEQ') return bail(`core rule type '${t}' is not seq/SEQ`)
    const parsed: Array<{ key: string; v: VariantPlaceholder; choicePos: number; altIdx: number }> = []
    for (const [key, v] of variantEntries) {
        const segs = parsePath(key)
        if (segs.length !== 2) return bail(`variant patch '${key}' has ${segs.length} segments (expected 2: N/M)`)
        if (segs[0]!.kind !== 'index' || segs[1]!.kind !== 'index') return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`)
        parsed.push({ key, v, choicePos: segs[0]!.value, altIdx: segs[1]!.value })
    }
    const choicePos = parsed[0]!.choicePos
    if (parsed.some(p => p.choicePos !== choicePos)) return bail(`variant patches target mixed choice positions (${parsed.map(p => p.choicePos).join(',')}) — hoist needs all siblings at one choice`)
    const seqMembers = [...membersOf(core)]
    const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos
    const choice = seqMembers[resolvedPos]
    if (!choice || (choice.type !== 'choice' && choice.type !== 'CHOICE')) return bail(`position ${resolvedPos} is '${choice?.type}', not choice/CHOICE`)
    const choiceMembers = membersOf(choice)
    const anyEmpty = parsed.some(p => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]!))
    if (!anyEmpty) return null  // non-empty variants fall through to per-patch extraction — not an error, just not a hoist candidate
    const parentKind = getCurrentRuleKind()
    if (!parentKind) return bail('no current rule kind (variant()/transform() called outside rule callback?)')
    const refs: RuntimeRule[] = []
    const isUpperCase = core.type === core.type.toUpperCase()
    // Reapply the captured prec stack inner-first so the outer-most
    // wrapper stays outermost — matches how path-descent reassembles
    // prec in applyPath.
    const wrapInPrecStack = (body: RuntimeRule): RuntimeRule => {
        let wrapped = body
        for (let i = precStack.length - 1; i >= 0; i--) {
            wrapped = reconstructPrec(precStack[i]!, wrapped)
        }
        return wrapped
    }
    for (const p of parsed) {
        const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx
        const altContent = choiceMembers[resolvedAlt]!
        const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m)
        const hoistedSeq = reconstructContainer(core, hoistedMembers)
        // Wrap each variant's body in the parent's prec context so
        // tree-sitter's conflict resolver sees the same precedence /
        // associativity the author declared on the parent rule.
        const hoistedBody = wrapInPrecStack(hoistedSeq)
        const visibleName = `${parentKind}_${p.v.name}`
        registerPolymorphVariant(parentKind, p.v.name)
        registerSyntheticRule(visibleName, hoistedBody)
        refs.push({
            type: isUpperCase ? 'SYMBOL' : 'symbol',
            name: visibleName,
        } as unknown as RuntimeRule)
    }
    // Hoisted variants inherit their parent seq's scaffolding, so they
    // share a token prefix (e.g. `[` + attribute_item repeat) that
    // defeats tree-sitter's LR(1) lookahead. Declare a conflict group
    // across all variant names so the parser-generator emits a GLR
    // state that forks on the prefix and picks the completing
    // interpretation at parse time. Also declare each variant as a
    // self-conflict — when the variant shares an internal repeat
    // helper with sibling grammar rules (tree-sitter dedups identical
    // repeat shapes across rules, producing a single `*_repeat1`),
    // multiple reduction paths through the same shared helper still
    // produce an unresolved state without the self-entry.
    const variantNames = parsed.map(p => `${parentKind}_${p.v.name}`)
    registerConflict(variantNames)
    for (const n of variantNames) registerConflict([n])
    const newChoice = reconstructContainer(choice, refs)
    return { rule: newChoice, consumed: new Set(parsed.map(p => p.key)) }
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
    // Seq: apply patches to members by RAW position. Accepts both
    // sittir lowercase 'seq' and tree-sitter uppercase 'SEQ' so the
    // same transform call works in both runtimes. Reconstructed via
    // native dsl so the result has the runtime-correct rule shape.
    const t = original.type
    if (t === 'seq' || t === 'SEQ') {
        const members = [...membersOf(original)]
        for (const [key, patch] of Object.entries(patches)) {
            // Reject non-pure-numeric keys up front — `Number('foo')` is
            // NaN and `Number('-0')` is 0. Typos like `'1a'` or `',0'`
            // would otherwise silently no-op. Match parsePath's strict
            // `/^\d+$/` gate so flat and path modes agree on validity.
            if (!/^\d+$/.test(key)) {
                throw new Error(
                    `transform: invalid flat-positional key '${key}' — keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`,
                )
            }
            const index = Number(key)
            if (index >= members.length) {
                // Out-of-bounds: throw to match path mode's behavior at
                // applyToMembers. Silently skipping was a footgun where
                // a typo looked like a no-op in sittir runtime.
                throw new Error(
                    `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`,
                )
            }
            members[index] = resolvePatch(patch, members[index]!)
        }
        return reconstructContainer(original, members)
    }

    // Choice: apply transform to each member recursively. Reconstruct
    // via native dsl so the choice keeps its runtime-correct shape.
    if (t === 'choice' || t === 'CHOICE') {
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

const wrapInPrec = (content: RuntimeRule, precStack?: readonly RuntimeRule[]): RuntimeRule =>
    wrapInPrecStack(content, precStack, reconstructPrec)

function resolvePatch(
    patch: RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder,
    originalMember: RuntimeRule,
    precStack?: readonly RuntimeRule[],
): RuntimeRule {
    // One-arg `field('name')` placeholder — wrap the original member
    // using the runtime's native field() so the resulting rule's type
    // case matches whatever runtime is loading us (sittir lowercase
    // 'field' vs tree-sitter uppercase 'FIELD').
    if (isFieldPlaceholder(patch)) {
        // Unwrap an enrich-inferred field on the original member to
        // avoid nested field('override', field('inferred', inner)).
        let content: unknown = originalMember
        if (isFieldLike(content) && content.source === 'inferred') {
            content = content.content
        }
        // Bare STRING content: tree-sitter strips FIELD wrappers around
        // anonymous string literals during grammar normalization (fields
        // must label structural content, not bare tokens). Mirror
        // variant()'s pattern below: synthesize a hidden `_kw_<name>`
        // rule that produces the string, register it, and wrap a SYMBOL
        // reference instead. FIELD around SYMBOL survives the normalizer.
        //
        // Wrap the hidden rule's body with high precedence so soft
        // keywords (e.g. python's `match`/`case`, which are also valid
        // identifiers) don't create parser conflicts. The precedence
        // tells tree-sitter to prefer the keyword interpretation when
        // the lexer sees this token at the position enrich promoted.
        // Bare STRING content: synthesize a hidden _kw_<name> rule and
        // substitute a SYMBOL reference so tree-sitter's normalizer
        // preserves the FIELD wrapper. Shared helper in synthetic-rules.ts
        // — called from both here (field placeholder) and dsl/field.ts
        // (two-arg field(name, 'literal')). Passes the prec stack so
        // synthetic rules inherit the outer precedence context.
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
    // Alias placeholder — alias('variant_name'): register a hidden
    // rule with the original content and return alias($._hidden, $.visible).
    // The hidden rule is picked up by evaluate.ts (sittir) or the
    // grammar wrapper (tree-sitter CLI) after all callbacks run.
    if (isAliasPlaceholder(patch)) {
        const hiddenName = '_' + patch.name
        return registerAliasedVariant(hiddenName, patch.name, originalMember, body => wrapInPrec(body, precStack))
    }
    return patch as RuntimeRule
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
    if (t !== 'seq' && t !== 'SEQ') {
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
    if (t !== 'seq' && t !== 'SEQ') {
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
