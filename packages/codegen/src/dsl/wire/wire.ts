/**
 * dsl/wire.ts — opts-wrapping helper for grammar() invocations.
 *
 * See `docs/adr/0007-wire-opts-declarative-polymorphs.md` for the full
 * design.
 *
 * `wire(config)` is a synchronous transformation of the options object
 * the author passes to `grammar()`. It:
 *
 *   1. Reads a declarative `polymorphs: { parent: { path: suffix } }`
 *      map and injects deferred-content placeholder rule fns for every
 *      `_<parent>_<suffix>` hidden rule into `opts.rules`. When the
 *      tree-sitter runtime later iterates those entries, each one
 *      reads captured content from the wire-scoped `deposits` map.
 *   2. Synthesizes or composes `opts.rules[parent]` so its body calls
 *      `transform(original, { path → variant(suffix) })` automatically.
 *   3. Wraps every rule fn so the wire context (and `currentRuleKind`)
 *      are set while the fn executes — `variant()` / `alias()` /
 *      `transform()` read those during their dispatch.
 *   4. Wraps the user's `conflicts` callback so accumulated variant
 *      conflict groups are symbolized through `$` and appended to the
 *      returned conflict list.
 *
 * State lives in a per-invocation `WireContext` captured in the closure
 * `wire()` creates. A module-level `currentContext` pointer is set by
 * the rule-fn wrapper so DSL helpers invoked synchronously during that
 * rule's evaluation can reach the context. No `globalThis` mutations.
 *
 * Fallback during migration: until all three grammars move to `wire()`,
 * the existing `dsl/synthetic-rules.ts` module state still handles
 * variant/alias for ungated paths. When `currentContext` is set, the
 * synthetic-rules helpers route to it instead. This lets each grammar
 * migrate independently.
 */

import type { PolymorphVariant } from '../../compiler/types.ts'
import type { RuntimeRule } from '../runtime-shapes.ts'
import { variant as variantPlaceholder } from '../primitives/variant.ts'
import { transform as transformFn } from '../transform/transform.ts'
import { isFieldPlaceholder } from '../primitives/field.ts'
import { isAliasPlaceholder } from '../primitives/alias.ts'
import { isVariantPlaceholder } from '../primitives/variant.ts'

// ---------------------------------------------------------------------------
// WireContext + module-level current pointer
// ---------------------------------------------------------------------------

/**
 * Per-`wire()`-invocation state. All fields are mutable so DSL helpers
 * (variant/alias/conflict registration) can push into them while the
 * rule-fn wrapper has this context installed.
 */
export interface WireContext {
    /** Hidden-rule name → captured content body. */
    readonly deposits: Map<string, RuntimeRule>
    /** `{parent, child}` pairs registered by variant(). Sittir's Link
     *  reads these to classify polymorphs — tree-sitter ignores them. */
    readonly polymorphVariants: PolymorphVariant[]
    /** Conflict groups (rule-name arrays) registered by variant() for
     *  sibling-variant ambiguity. Drained by the wrapped `conflicts`
     *  callback when tree-sitter invokes it. */
    readonly conflictGroups: string[][]
    /** Per-rule form declarations registered by refine(). Ordered list
     *  — the first form is the default the bare factory call routes to.
     *  Emitters consume this to generate namespace-keyed factories
     *  (`ir.interfaceBody.curly(...)`) with narrowed Configs. The rule
     *  tree itself is unchanged by refine(); tree-sitter parses with
     *  the original shape. */
    readonly refineForms: Map<string, RefineForm[]>
    /** Name of the rule currently being evaluated, for variant()'s
     *  auto-prefix behavior (`variant('eq')` under `assignment` →
     *  `_assignment_eq`). Set by the rule-fn wrapper. */
    currentRuleKind: string | null
}

/**
 * A single named form declared via `refine(original, { name: selections })`.
 * `selections` maps a path (into `original`) to a chosen branch — either
 * a numeric branch index or a literal string matching one of the choice
 * arm's string values. See ADR-0010 phase 2 for the full design.
 */
export interface RefineForm {
    readonly name: string
    readonly selections: Record<string, number | string>
}

let currentContext: WireContext | null = null

/** Read the active wire context, or null if no `wire()`-wrapped rule
 *  fn is currently executing. DSL helpers use this to decide whether
 *  to route state into the wire closure or into the legacy module
 *  accumulator in `synthetic-rules.ts`. */
export function getCurrentWireContext(): WireContext | null {
    return currentContext
}

/**
 * Register a hidden-rule body against the active wire context. Returns
 * `true` when the context absorbed the call, `false` when there is no
 * active context (caller falls back to the legacy accumulator).
 */
export function wireRegisterSyntheticRule(name: string, content: RuntimeRule): boolean {
    if (!currentContext) return false
    currentContext.deposits.set(name, content)
    return true
}

/**
 * Register a `{parent, child}` polymorph pair against the active wire
 * context. Idempotent — re-registering the same pair is a no-op.
 *
 * @remarks
 * Idempotence matters because the rule callbacks can fire more than
 * once per grammar invocation during migration (e.g. under the legacy
 * `installGrammarWrapper`'s pass-1 dry-run + pass-2 real evaluation).
 * Each call would register the same pair; rejecting duplicates would
 * trip on benign retries. The semantic invariant "one parent never
 * has two DIFFERENT arms with the same suffix" is still upheld by the
 * declarative `polymorphs` config — the author can't write the same
 * suffix twice for one parent without the second entry overwriting
 * the first at JS object-literal level.
 */
export function wireRegisterPolymorphVariant(parent: string, child: string): boolean {
    if (!currentContext) return false
    const exists = currentContext.polymorphVariants.some(v => v.parent === parent && v.child === child)
    if (!exists) {
        currentContext.polymorphVariants.push({ parent, child })
    }
    return true
}

/**
 * Register a conflict group against the active wire context. Dedupes
 * by exact group membership (same names in same order).
 */
export function wireRegisterConflict(names: readonly string[]): boolean {
    if (!currentContext) return false
    if (names.length === 0) return true
    const key = names.join('\u0000')
    const exists = currentContext.conflictGroups.some(g => g.join('\u0000') === key)
    if (!exists) {
        currentContext.conflictGroups.push([...names])
    }
    return true
}

/**
 * Register per-rule form declarations against the active wire context.
 *
 * @remarks
 * Invoked by `refine(original, forms)`. The forms list is stored
 * as-is — validation (path resolves to a choice, selections are in
 * range, etc.) happens at codegen time inside `link.ts` or the
 * emitters, not here, because the rule tree may still be mid-transform
 * at refine() call time (enrich not yet fired, transform patches not
 * applied). Deferring validation avoids ordering hazards.
 *
 * Returns `true` when the context absorbed the call, `false` when
 * there is no active context.
 */
export function wireRegisterRefineForms(kind: string, forms: RefineForm[]): boolean {
    if (!currentContext) return false
    currentContext.refineForms.set(kind, forms)
    return true
}

/** Current rule kind on the active wire context, or null when inactive. */
export function wireGetCurrentRuleKind(): string | null {
    return currentContext?.currentRuleKind ?? null
}

/**
 * Install a fresh `WireContext` for the duration of `fn` and return
 * both the callback result and the context so tests can assert on
 * deposits / polymorphVariants / conflictGroups that were registered
 * during the call.
 *
 * Intended for unit tests of DSL helpers (variant/alias/transform/
 * hoist) that need a wire context without going through full wire()
 * composition. Production callers should use `wire()`.
 */
export function withWireContext<T>(
    ruleKind: string | null,
    fn: (ctx: WireContext) => T,
): { result: T; ctx: WireContext } {
    const ctx: WireContext = {
        deposits: new Map(),
        polymorphVariants: [],
        conflictGroups: [],
        refineForms: new Map(),
        currentRuleKind: ruleKind,
    }
    const prev = currentContext
    currentContext = ctx
    try {
        const result = fn(ctx)
        return { result, ctx }
    } finally {
        currentContext = prev
    }
}

// ---------------------------------------------------------------------------
// Public API: `wire(config)` — opts wrapper
// ---------------------------------------------------------------------------

/**
 * Declarative polymorph map: parent rule kind → (path-in-original → suffix).
 *
 * @example
 *   { assignment: { '1/0': 'eq', '1/1': 'type', '1/2': 'typed' } }
 */
export type PolymorphsConfig = Record<string, Record<string, string>>

/**
 * Declarative transforms map: each rule kind → a patch-map (or array
 * of patch-maps for multi-patchset rules). Values inside each patch-
 * map are DSL placeholders (`field`, `variant`, `alias`) or native
 * rule objects.
 *
 * @example
 *   {
 *     async_block: { '1/0': field('move'), 2: field('block') },
 *     array_expression: [
 *       { 1: field('attributes') },
 *       { '2/_expression': field('elements') },
 *     ],
 *   }
 *
 * wire() walks every patch value at config time, enumerates every
 * placeholder, and pre-registers the corresponding hidden rule names
 * (`_kw_<field>`, `_<parent>_<variant>`, `_<alias>`) in opts.rules as
 * deferred-content fns. The synthesized rule fn calls
 * `transform(original, ...patches)` at rule-fn-call time; placeholder
 * resolution deposits captured content into wire's context; the
 * deferred fns read deposits.
 */
export type TransformsConfig = Record<string, PatchMap | PatchMap[]>

/** A single patch-map — path-in-original → patch value. */
export type PatchMap = Record<string, unknown>

/**
 * Shape of an options argument passed to tree-sitter's `grammar()` — the
 * fields `wire()` knows about. Extra fields are passed through
 * unchanged.
 */
export interface WireConfig {
    readonly name?: string
    readonly rules: Record<string, RuleFn>
    readonly polymorphs?: PolymorphsConfig
    readonly transforms?: TransformsConfig
    readonly conflicts?: ConflictsFn
    readonly externals?: DollarFn<unknown[]>
    readonly extras?: DollarFn<unknown[]>
    readonly supertypes?: DollarFn<unknown[]>
    readonly inline?: DollarFn<unknown[]>
    readonly word?: DollarFn<unknown>
    readonly precedences?: DollarFn<unknown[][]>
    readonly reserved?: Record<string, DollarFn<unknown[]>>
    /** Side-channel from `enrich()` — preserved unchanged. */
    readonly __enrichOverrides__?: Record<string, RuleFn>
}

export interface WiredOpts {
    readonly name?: string
    readonly rules: Record<string, RuleFn>
    readonly conflicts?: ConflictsFn
    readonly externals?: DollarFn<unknown[]>
    readonly extras?: DollarFn<unknown[]>
    readonly supertypes?: DollarFn<unknown[]>
    readonly inline?: DollarFn<unknown[]>
    readonly word?: DollarFn<unknown>
    readonly precedences?: DollarFn<unknown[][]>
    readonly reserved?: Record<string, DollarFn<unknown[]>>
    readonly __enrichOverrides__?: Record<string, RuleFn>
    /**
     * Attached so sittir's compiler pipeline (evaluate → link) can read
     * the polymorph metadata without driving rule evaluation a second
     * time. Non-enumerable on the returned object so tree-sitter's
     * own iteration doesn't trip on it.
     */
    readonly __wireContext__?: WireContext
}

type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown
type ConflictsFn = (this: unknown, $: unknown, previous?: unknown[][]) => unknown[][]
type DollarFn<T> = (this: unknown, $: unknown, previous?: T) => T

/**
 * Wrap the user's grammar options with wire-managed polymorph plumbing.
 *
 * @param config - Options to pass to `grammar()` plus an optional
 *   `polymorphs` declaration.
 * @returns A new options object suitable for `grammar()`. Tree-sitter's
 *   own iteration observes the injected hidden-rule entries at its
 *   `Object.keys()` snapshot; content resolves via deferred-content fns
 *   as tree-sitter iterates.
 */
export function wire(config: WireConfig): WiredOpts {
    const context: WireContext = {
        deposits: new Map(),
        polymorphVariants: [],
        conflictGroups: [],
        refineForms: new Map(),
        currentRuleKind: null,
    }

    const polymorphs = config.polymorphs ?? {}
    const transforms = config.transforms ?? {}
    const outRules: Record<string, RuleFn> = { ...config.rules }

    // Transforms first, polymorphs second — transforms wrap the user
    // fn innermost and see the base-shape rule tree; polymorphs wrap
    // the transforms-wrapped fn outermost and split what remains.
    // Reversing this (polymorphs first) made inline transforms that
    // address base-shape paths (e.g. 'N/_expression' kind-match) break
    // because the polymorph already aliased the choice arms.
    //
    // Compose runs BEFORE inject so iteration order at runtime puts
    // polymorph parents ahead of their hidden arms — parents populate
    // deposits via transformFn; arms read those deposits when their
    // deferred-content fn later runs. The injection pass is careful not
    // to clobber a polymorph-parent fn already installed by compose:
    // when a hidden name is BOTH an arm of one polymorph AND itself a
    // polymorph parent (e.g. `_visibility_modifier_pub`), compose wins
    // and the parent fn reads the outer's deposit at run time (see
    // `buildPolymorphParentFn`).
    composeOrSynthesizeTransformParents(outRules, transforms)
    composeOrSynthesizePolymorphParents(outRules, polymorphs, context)
    injectHiddenRulePlaceholders(outRules, polymorphs, context)
    injectTransformHiddenRulePlaceholders(outRules, transforms, context)
    wrapAllRuleFns(outRules, context)

    const conflicts = wrapConflictsCallback(config.conflicts, context)

    const wired: WiredOpts = {
        ...config,
        rules: outRules,
        ...(conflicts === undefined ? {} : { conflicts }),
    }
    Object.defineProperty(wired, '__wireContext__', {
        value: context,
        enumerable: false,
        configurable: true,
    })
    return wired
}

// ---------------------------------------------------------------------------
// wire() helpers
// ---------------------------------------------------------------------------

/**
 * For every polymorph parent, either wrap the author's rule fn (compose
 * — user runs first, variant transform on the result) or synthesize a
 * fresh rule fn that applies the variant patches to `original` directly.
 *
 * `context` is threaded in so parents whose name is a hidden rule (starts
 * with `_`) can fall back to reading their own body from
 * `context.deposits` — this is the case when a parent was synthesized as
 * an arm of an OUTER polymorph (e.g. `_visibility_modifier_pub` produced
 * by `visibility_modifier: {1:'pub'}` and then adopted as its own inner
 * polymorph parent). The outer runs first at iteration time and deposits
 * its arm body; the inner's parent fn reads that deposit as its base.
 */
function composeOrSynthesizePolymorphParents(
    rules: Record<string, RuleFn>,
    polymorphs: PolymorphsConfig,
    context: WireContext,
): void {
    for (const [parent, armMap] of Object.entries(polymorphs)) {
        const userFn = rules[parent]
        rules[parent] = buildPolymorphParentFn(parent, armMap, userFn, context)
    }
}

/**
 * Build a rule fn for a polymorph parent. Base-body resolution order:
 *
 *   1. User-supplied `userFn` (from config.rules) — runs first, so any
 *      author-level field/keyword transforms see the base-shape rule
 *      tree and the variant transform applies on that output.
 *   2. For hidden-name parents (leading `_`) produced by an outer
 *      polymorph, read the body from `context.deposits` — the outer
 *      rule fn (which iterates at its base-grammar position, ahead of
 *      the injected hidden name) populates that deposit when its own
 *      variant transform resolves.
 *   3. Otherwise use `original` (the `previous` arg tree-sitter passes —
 *      the base grammar's body of this rule).
 */
function buildPolymorphParentFn(
    parent: string,
    armMap: Record<string, string>,
    userFn: RuleFn | undefined,
    context: WireContext,
): RuleFn {
    const patches: Record<string, unknown> = {}
    for (const [path, suffix] of Object.entries(armMap)) {
        patches[path] = variantPlaceholder(suffix)
    }
    const isHidden = parent.startsWith('_')
    return function wiredPolymorphParent(this: unknown, $: unknown, original: unknown): unknown {
        let base: unknown
        if (userFn) {
            base = userFn.call(this, $, original)
        } else if (isHidden && context.deposits.has(parent)) {
            base = context.deposits.get(parent)
        } else {
            base = original
        }
        return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, patches)
    }
}

/**
 * Inject one deferred-content rule fn per declared `_<parent>_<suffix>`
 * hidden rule. The fn reads captured content from `context.deposits` at
 * the moment tree-sitter iterates to it.
 *
 * Skips keys already filled by `composeOrSynthesizePolymorphParents` —
 * that happens when a hidden name is BOTH an arm of one polymorph AND
 * itself a polymorph parent (e.g. `_visibility_modifier_pub` = the
 * `pub` arm of `visibility_modifier` AND its own polymorph parent
 * splitting the inner `choice(self, super, crate, seq('in', _path))`).
 * Compose installs the parent fn there; its body-resolution logic reads
 * the outer's deposit directly (see `buildPolymorphParentFn`), so this
 * overwrite would drop the inner split.
 */
function injectHiddenRulePlaceholders(
    rules: Record<string, RuleFn>,
    polymorphs: PolymorphsConfig,
    context: WireContext,
): void {
    for (const [parent, armMap] of Object.entries(polymorphs)) {
        for (const suffix of Object.values(armMap)) {
            const hiddenName = polymorphHiddenName(parent, suffix)
            if (hiddenName in rules) continue
            rules[hiddenName] = makeDeferredContentFn(context, hiddenName)
        }
    }
}

/**
 * Compute the visible-kind name for a polymorph variant.
 *
 * When the parent is itself a hidden rule (name starts with `_`) —
 * e.g. `_visibility_modifier_pub`, produced as an arm of an outer
 * polymorph — the leading underscore is stripped so the generated
 * variant kind (`visibility_modifier_pub_in_path`) is visible in the
 * parse tree. Without stripping, the visible alias target would also
 * lead with `_` and tree-sitter would hide it, collapsing the variant.
 *
 * Used by wire's injectHiddenRulePlaceholders AND transform.ts's
 * variant-resolution paths so both agree on the rule name.
 */
export function polymorphVisibleName(parentKind: string, suffix: string): string {
    const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind
    return `${visibleParent}_${suffix}`
}

/** Hidden rule name for a polymorph variant — underscore-prefixed visible form. */
export function polymorphHiddenName(parentKind: string, suffix: string): string {
    return `_${polymorphVisibleName(parentKind, suffix)}`
}

/**
 * For each transforms entry, wrap (or synthesize) its rule fn to apply
 * the declared patch-maps via `transform(original, ...patchSets)`. If
 * the author already has a `rules:` entry for the same kind, compose:
 * user fn runs first, transform patches apply on its output.
 */
function composeOrSynthesizeTransformParents(
    rules: Record<string, RuleFn>,
    transforms: TransformsConfig,
): void {
    for (const [kind, entry] of Object.entries(transforms)) {
        const patchSets = Array.isArray(entry) ? entry : [entry]
        const userFn = rules[kind]
        rules[kind] = buildTransformParentFn(patchSets, userFn)
    }
}

/**
 * Build a rule fn for a transforms entry. Invokes the user-supplied
 * fn first (if present), then applies each patch-map sequentially via
 * `transform(original, ...patchSets)`. Matches `transform()`'s
 * rest-parameter signature so multi-patch-set rules behave exactly as
 * they did when the call was written inline in the rule body.
 */
function buildTransformParentFn(
    patchSets: readonly PatchMap[],
    userFn: RuleFn | undefined,
): RuleFn {
    return function wiredTransformParent(this: unknown, $: unknown, original: unknown): unknown {
        const base = userFn ? userFn.call(this, $, original) : original
        return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, ...patchSets)
    }
}

/**
 * Walk every patch value in the transforms config at wire() time and
 * pre-register the hidden-rule name each placeholder would generate
 * at rule-fn-call time. Placeholders map to hidden names as follows:
 *
 * - `field('x')` (one-arg) → potentially `_kw_x` (only if captured
 *   content is a bare string at runtime; pre-register regardless — an
 *   unused deferred fn is harmless).
 * - `variant('y')` under rule kind `K` → `_K_y` (plus polymorph
 *   metadata captured at runtime via `registerPolymorphVariant`).
 * - `alias('z')` (one-arg) → `_z`.
 *
 * Two-arg `field(name, content)` calls are already resolved to native
 * rules at module-load time (by `field.ts::field`) and their
 * `_kw_<name>` registrations route through the wire context directly
 * when a context is active. This function only needs to handle
 * placeholder objects that remain unresolved until `transform()` fires.
 */
function injectTransformHiddenRulePlaceholders(
    rules: Record<string, RuleFn>,
    transforms: TransformsConfig,
    context: WireContext,
): void {
    for (const [kind, entry] of Object.entries(transforms)) {
        const patchSets = Array.isArray(entry) ? entry : [entry]
        for (const patchMap of patchSets) {
            for (const value of Object.values(patchMap)) {
                registerHiddenRuleForPlaceholder(value, kind, rules, context)
            }
        }
    }
}

/**
 * Inspect a single patch value. If it's a recognised placeholder,
 * compute the hidden rule name it would produce and inject a deferred-
 * content fn in `rules` for that name. No-op for non-placeholder
 * values (already-resolved native rules, two-arg field results, etc.).
 *
 * @param parentKind - For variant placeholders: the rule kind the
 *   placeholder lives under, used for the auto-prefix `_<parent>_<suffix>`.
 */
function registerHiddenRuleForPlaceholder(
    value: unknown,
    parentKind: string,
    rules: Record<string, RuleFn>,
    context: WireContext,
): void {
    if (isFieldPlaceholder(value)) {
        const hiddenName = `_kw_${value.name}`
        if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName)
        return
    }
    if (isVariantPlaceholder(value)) {
        const hiddenName = `_${parentKind}_${value.name}`
        if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName)
        return
    }
    if (isAliasPlaceholder(value)) {
        const hiddenName = `_${value.name}`
        if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName)
        return
    }
}

/**
 * Build the deferred-content placeholder for a single hidden rule.
 *
 * @remarks
 * The returned fn is invoked by tree-sitter (or sittir's grammarFn)
 * during rule iteration. Resolution order — first match wins:
 *
 *   1. **Wire deposit** — content captured at `transform()` /
 *      `variant()` / `alias()` resolve time via
 *      `wireRegisterSyntheticRule`. This is the authoritative source
 *      when a placeholder actually synthesizes.
 *
 *   2. **Pre-existing base rule (`previous`)** — when the hidden name
 *      already exists in the base grammar (e.g. rust's `_kw_move`
 *      registered by `dsl/enrich.ts` as `STRING('move')`, then
 *      referenced via `$._kw_move` inside async_block / gen_block /
 *      closure_expression). The deferred fn receives the pre-existing
 *      base rule as its second argument — returning it preserves the
 *      base body when no deposit overrides it. Without this fallback,
 *      the deferred fn would overwrite enrich's good content with
 *      `blank()`, breaking every rule that uses the hidden symbol.
 *
 *   3. **`blank()` fallback** — when neither source has content.
 *      Normally consumed by `evaluate`'s `prunePlaceholderOrphans` so
 *      BLANK orphans don't pollute the grammar.
 */
function makeDeferredContentFn(context: WireContext, hiddenName: string): RuleFn {
    return function deferredHiddenRule(this: unknown, _$: unknown, previous?: unknown): unknown {
        const body = context.deposits.get(hiddenName)
        if (body) return body
        if (previous !== undefined) return previous
        const blankFn = (globalThis as { blank?: () => unknown }).blank
        return blankFn ? blankFn() : { type: 'BLANK' }
    }
}

/**
 * Wrap every rule fn in the outgoing rules bag so the wire context is
 * active (and `currentRuleKind` set) while the fn runs. Saves and
 * restores both values so nested / re-entrant grammar calls don't leak
 * state into each other.
 */
function wrapAllRuleFns(rules: Record<string, RuleFn>, context: WireContext): void {
    for (const [name, fn] of Object.entries(rules)) {
        rules[name] = wrapOneRuleFn(name, fn, context)
    }
}

/**
 * Wrap a single rule fn. Captures the caller's previous context +
 * currentRuleKind, installs this context, runs the fn, restores.
 */
function wrapOneRuleFn(name: string, fn: RuleFn, context: WireContext): RuleFn {
    return function wiredRuleFn(this: unknown, $: unknown, previous?: unknown): unknown {
        const prevContext = currentContext
        const prevKind = context.currentRuleKind
        currentContext = context
        context.currentRuleKind = name
        try {
            return fn.call(this, $, previous)
        } finally {
            context.currentRuleKind = prevKind
            currentContext = prevContext
        }
    }
}

/**
 * Wrap the user's `conflicts` callback so accumulated variant conflict
 * groups drain into its return list, each group's names symbolized
 * through the provided `$` proxy.
 *
 * If the user didn't supply a `conflicts`, return a fresh one that just
 * drains the accumulator. If the accumulator is empty when tree-sitter
 * invokes the callback, the wrapped fn still passes the user's list
 * through unchanged.
 */
function wrapConflictsCallback(
    userConflicts: ConflictsFn | undefined,
    context: WireContext,
): ConflictsFn | undefined {
    return buildWiredConflictsFn(userConflicts, context)
}

/**
 * Build the wired conflicts callback that drains accumulated variant
 * conflict groups into the returned conflict list.
 *
 * @remarks
 * Always returns a drainer, even when the user didn't supply a conflicts
 * callback and no groups have registered yet. We can't know at wire-time
 * whether variants will register later (they're registered lazily when
 * rule fns run), so we install the drainer unconditionally. The drainer
 * short-circuits at call-time when `conflictGroups` is still empty,
 * keeping the overhead minimal when no variants are declared.
 *
 * @param userConflicts - The author's original conflicts callback, if any.
 * @param context - The active wire context whose `conflictGroups` are drained.
 * @returns A wrapped conflicts callback that appends symbolized group entries.
 */
function buildWiredConflictsFn(
    userConflicts: ConflictsFn | undefined,
    context: WireContext,
): ConflictsFn {
    return function wiredConflicts(this: unknown, $: unknown, previous?: unknown[][]): unknown[][] {
        const base = userConflicts ? userConflicts.call(this, $, previous) : (previous ?? [])
        if (context.conflictGroups.length === 0) return base as unknown[][]
        const symbolized = context.conflictGroups.map(group => group.map(name => symbolizeRef($, name)))
        return [...(base as unknown[][]), ...symbolized]
    }
}

/**
 * Produce a symbol-shaped object for a variant-child kind name that
 * isn't a declared tree-sitter rule.
 *
 * @remarks
 * Variant conflict names (e.g. `array_expression_semi`) are parse-tree
 * node kinds produced by `alias($._rule, $.kind)` — they never appear
 * as declared rules in `opts.rules`, so tree-sitter's `RuleBuilder`
 * proxy returns a `ReferenceError` when we try `$[name]`.
 *
 * We construct the SYMBOL object directly. Tree-sitter's `normalize()`
 * accepts any object with a string `type` property (the default branch
 * of its switch), so `{type: 'SYMBOL', name}` passes through and its
 * `.name` is what gets stored in `grammar.conflicts`. This mirrors
 * what the legacy `installGrammarWrapper` did by post-appending bare
 * strings to the already-normalized conflicts array.
 *
 * `$` is unused but kept in the signature so any future caller that
 * wants to fall back to the proxy lookup for real rule names can do so
 * without changing the surface.
 */
function symbolizeRef(_$: unknown, name: string): unknown {
    return { type: 'SYMBOL', name }
}
