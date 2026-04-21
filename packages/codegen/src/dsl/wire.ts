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

import type { PolymorphVariant } from '../compiler/types.ts'
import type { RuntimeRule } from './runtime-shapes.ts'
import { variant as variantPlaceholder } from './variant.ts'
import { transform as transformFn } from './transform.ts'
import { isFieldPlaceholder } from './field.ts'
import { isAliasPlaceholder } from './alias.ts'
import { isVariantPlaceholder } from './variant.ts'
import { forgetPolymorphVariantsFor, drainSyntheticRules } from './synthetic-rules.ts'

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
    /** Name of the rule currently being evaluated, for variant()'s
     *  auto-prefix behavior (`variant('eq')` under `assignment` →
     *  `_assignment_eq`). Set by the rule-fn wrapper. */
    currentRuleKind: string | null
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

/** Current rule kind on the active wire context, or null when inactive. */
export function wireGetCurrentRuleKind(): string | null {
    return currentContext?.currentRuleKind ?? null
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
        currentRuleKind: null,
    }

    const polymorphs = config.polymorphs ?? {}
    const transforms = config.transforms ?? {}
    const outRules: Record<string, RuleFn> = { ...config.rules }

    // Drain the module-load-time synthetic rule accumulator first.
    // Two-arg `field(name, 'literal')` calls inside the config object
    // literal fire `maybeKeywordSymbol` → `registerSyntheticRule`
    // during construction — before `wire()` even gets called. Their
    // content is fully known (no runtime capture needed), so inject
    // as static rule fns.
    absorbModuleLoadSyntheticRules(outRules)

    composeOrSynthesizePolymorphParents(outRules, polymorphs)
    composeOrSynthesizeTransformParents(outRules, transforms)
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
 */
function composeOrSynthesizePolymorphParents(
    rules: Record<string, RuleFn>,
    polymorphs: PolymorphsConfig,
): void {
    for (const [parent, armMap] of Object.entries(polymorphs)) {
        const userFn = rules[parent]
        rules[parent] = buildPolymorphParentFn(armMap, userFn)
    }
}

/**
 * Build a rule fn for a polymorph parent. If `userFn` is supplied, it
 * runs first (to do author-level field transforms on `original`); the
 * variant transform is then applied to its output.
 */
function buildPolymorphParentFn(
    armMap: Record<string, string>,
    userFn: RuleFn | undefined,
): RuleFn {
    const patches: Record<string, unknown> = {}
    for (const [path, suffix] of Object.entries(armMap)) {
        patches[path] = variantPlaceholder(suffix)
    }
    return function wiredPolymorphParent(this: unknown, $: unknown, original: unknown): unknown {
        const base = userFn ? userFn.call(this, $, original) : original
        return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, patches)
    }
}

/**
 * Inject one deferred-content rule fn per declared `_<parent>_<suffix>`
 * hidden rule. The fn reads captured content from `context.deposits` at
 * the moment tree-sitter iterates to it.
 */
function injectHiddenRulePlaceholders(
    rules: Record<string, RuleFn>,
    polymorphs: PolymorphsConfig,
    context: WireContext,
): void {
    for (const [parent, armMap] of Object.entries(polymorphs)) {
        for (const suffix of Object.values(armMap)) {
            const hiddenName = `_${parent}_${suffix}`
            rules[hiddenName] = makeDeferredContentFn(context, hiddenName)
        }
    }
}

/**
 * Drain every rule the DSL's `registerSyntheticRule` accumulated during
 * construction of the `wire()` config object literal — two-arg
 * `field(name, 'literal')` calls fire at module-load time via
 * `maybeKeywordSymbol` and register `_kw_<name>` into the synthetic-
 * rules module accumulator.
 *
 * Inject each accumulated entry as a static rule fn in `opts.rules`.
 * Content is fully known (no runtime capture needed), so no deferred-
 * content machinery is required for these. Tree-sitter's `ruleMap`
 * snapshot sees every `_kw_*` name from this path at `grammar()` entry.
 *
 * If a name already exists in `opts.rules` (e.g. the author hand-
 * declared `_kw_foo: $ => 'foo'`), the author's entry wins.
 */
function absorbModuleLoadSyntheticRules(rules: Record<string, RuleFn>): void {
    const drained = drainSyntheticRules()
    for (const [name, body] of drained) {
        if (name in rules) continue
        rules[name] = () => body
    }
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
 * `_kw_<name>` registrations are drained by
 * `absorbModuleLoadSyntheticRules`. This function only needs to handle
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
 * Build the deferred-content placeholder for a single hidden rule. The
 * returned fn is invoked by tree-sitter (or sittir's grammarFn) during
 * rule iteration; it returns the captured body from `context.deposits`
 * or a safe `blank()` fallback when the deposit hasn't happened yet
 * (e.g. during a unit test that doesn't drive the parent rule).
 */
function makeDeferredContentFn(context: WireContext, hiddenName: string): RuleFn {
    return function deferredHiddenRule(): unknown {
        const body = context.deposits.get(hiddenName)
        if (body) return body
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
        // Clear the legacy accumulator's entries for this rule so that
        // re-entry (wrapper pass-1 + pass-2, repeated test invocations,
        // nested grammar extension evaluation) doesn't trip the hard
        // duplicate-throw in `registerPolymorphVariant`. Wire's own
        // polymorph list is idempotent and keeps accumulating across
        // invocations for this wire context.
        forgetPolymorphVariantsFor(name)
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
    if (!userConflicts && context.conflictGroups.length === 0) {
        // User didn't supply one and nothing could have registered yet
        // — short-circuit to keep the returned opts minimal. We also
        // can't know at wire-time whether variants will register later,
        // so install a drainer below when variants are possible.
    }
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
