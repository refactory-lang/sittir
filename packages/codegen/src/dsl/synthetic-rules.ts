/**
 * dsl/synthetic-rules.ts — accumulator for transform-generated hidden rules.
 *
 * When transform sees an `alias('variant_name')` placeholder, it:
 *   1. Captures the original content at the patch target
 *   2. Registers a hidden rule `_variant_name` with that content here
 *   3. Returns `alias($._variant_name, $.variant_name)` as the replacement
 *
 * The accumulated rules are injected into the grammar after all rule
 * callbacks have run. Same scoping pattern as `role()` in role.ts.
 */

import type { RuntimeRule } from './runtime-shapes.ts'

let currentSyntheticRules: Map<string, RuntimeRule> | null = null
let currentRuleKind: string | null = null
let currentOptsRules: Record<string, unknown> | null = null
let currentBlankFn: (() => unknown) | null = null
export interface PolymorphVariant {
    readonly parent: string
    readonly child: string
}

let currentPolymorphVariants: PolymorphVariant[] = []

export function setCurrentRuleKind(kind: string | null): void {
    currentRuleKind = kind
}

export function getCurrentRuleKind(): string | null {
    return currentRuleKind
}

export function registerSyntheticRule(name: string, content: RuntimeRule): void {
    if (!currentSyntheticRules) {
        currentSyntheticRules = new Map()
    }
    currentSyntheticRules.set(name, content)
    // When the grammar wrapper is active (pass 2 of tree-sitter CLI
    // evaluation), also add a blank placeholder directly to opts.rules
    // so tree-sitter's `$` proxy resolves the new name when subsequent
    // options like `conflicts:` reference it. drainSyntheticRules swaps
    // the blank for the real body after nativeGrammar returns.
    if (currentOptsRules && !(name in currentOptsRules)) {
        const blank = currentBlankFn
        currentOptsRules[name] = () => blank ? blank() : ({ type: 'BLANK' })
    }
}

/**
 * Shared `FIELD(name, bare-STRING)` → `FIELD(name, SYMBOL(_kw_<name>))`
 * transformation. Synthesizes a hidden `_kw_<name>: prec.left(1, 'kw')`
 * rule via registerSyntheticRule and returns a SYMBOL reference
 * matching the runtime's case. Callers receive the symbol to pass as
 * the FIELD's content — tree-sitter's normalizer preserves FIELD
 * around SYMBOL (unlike FIELD around bare STRING).
 *
 * Used by:
 *   - transform.ts resolvePatch (one-arg field() placeholder path)
 *   - dsl/field.ts two-arg field(name, 'literal') path
 *
 * Optional `wrapSyntheticBody` lets callers apply an extra wrap
 * (e.g., transform's accumulated prec stack) around the synthetic
 * rule's body before registration. Returns the content unchanged
 * when it isn't a bare STRING.
 */
export function maybeKeywordSymbol(
    fieldName: string,
    content: unknown,
    wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule,
): unknown {
    const c = content as { type?: string; value?: string }
    if (!c || typeof c.type !== 'string') return content
    const isString = c.type === 'STRING' || c.type === 'string'
    if (!isString) return content
    const isUpperCase = c.type === 'STRING'
    const hiddenName = `_kw_${fieldName}`
    const nativePrec = (globalThis as {
        prec?: { left?: (v: number, c: unknown) => unknown }
    }).prec
    let precBody: RuntimeRule = (typeof nativePrec?.left === 'function'
        ? nativePrec.left(1, content)
        : content) as RuntimeRule
    if (wrapSyntheticBody) precBody = wrapSyntheticBody(precBody)
    registerSyntheticRule(hiddenName, precBody)
    return {
        type: isUpperCase ? 'SYMBOL' : 'symbol',
        name: hiddenName,
    }
}

export function registerPolymorphVariant(parentKind: string, childSuffix: string): void {
    // T029a — variant-name uniqueness within a parent. Two variant('eq')
    // calls on the same parent rule would produce duplicate alias
    // targets in the grammar and ambiguous form names downstream.
    // Throw at registration so the error surfaces at evaluate time
    // with a clear message instead of as a cryptic codegen failure.
    const dup = currentPolymorphVariants.find(v => v.parent === parentKind && v.child === childSuffix)
    if (dup) {
        throw new Error(
            `variant('${childSuffix}'): duplicate variant name on rule '${parentKind}'. ` +
            `Each variant() within a rule must have a unique name — change one or merge the patches.`,
        )
    }
    currentPolymorphVariants.push({ parent: parentKind, child: childSuffix })
}

export function drainPolymorphVariants(): PolymorphVariant[] {
    const variants = currentPolymorphVariants
    currentPolymorphVariants = []
    return variants
}

export function drainSyntheticRules(): Map<string, RuntimeRule> {
    const rules = currentSyntheticRules ?? new Map()
    currentSyntheticRules = null
    return rules
}

let currentConflicts: string[][] = []

/**
 * Register a tree-sitter conflict group. Each call adds one entry to
 * the grammar's `conflicts: [[...]]` list. Used by auto-hoist to tell
 * tree-sitter that a newly-synthesized rule may structurally overlap
 * with an auto-generated internal helper (e.g. shared `_repeat1`
 * factorings) — without this, the parser-generator's static analysis
 * refuses to resolve the conflict and fails grammar compilation.
 */
export function registerConflict(names: readonly string[]): void {
    if (names.length === 0) return
    currentConflicts.push([...names])
}

export function drainConflicts(): string[][] {
    const conflicts = currentConflicts
    currentConflicts = []
    return conflicts
}

// ---------------------------------------------------------------------------
// Aliased-variant synthesis — shared between variant() and alias()
// placeholders in transform.ts. Handles the mechanics of "extract an
// arbitrary sub-rule into a hidden named rule, return an alias node
// that points at it, wrap in prec where needed, and factor out empty-
// matching content tree-sitter won't accept as a syntactic rule."
// ---------------------------------------------------------------------------

/**
 * Wrap `content` in the accumulated prec stack collected during path
 * descent. Each entry in `precStack` is the original prec wrapper the
 * path crossed; we reapply them inner-first so the outer-most prec is
 * the outermost in the result.
 */
export function wrapInPrecStack(
    content: RuntimeRule,
    precStack: readonly RuntimeRule[] | undefined,
    reconstructPrec: (wrapper: RuntimeRule, newContent: RuntimeRule) => RuntimeRule,
): RuntimeRule {
    if (!precStack?.length) return content
    let result = content
    for (let i = precStack.length - 1; i >= 0; i--) {
        result = reconstructPrec(precStack[i]!, result)
    }
    return result
}

/**
 * Build the `alias($._hidden, $.visible)` node AND register the
 * hidden rule's body. Shared between variant() and alias() placeholders
 * because both need the same empty-match / prec handling.
 *
 * Tree-sitter refuses to compile a named syntactic rule whose body
 * matches the empty string (it can't decide which copy-count to choose
 * while parsing). A raw variant extraction can easily produce such a
 * body — e.g. rust's `array_expression` list form is
 * `repeat(elem, sep=',')` which matches zero or more, including zero.
 *
 * When the content is empty-matchable AND we can factor out a non-empty
 * core, extract the core and wrap the call-site alias in `optional()`.
 * The language is preserved (`optional(repeat1(X))` = `repeat(X)`) and
 * the hidden rule is guaranteed non-empty so tree-sitter accepts it.
 *
 * Patterns handled:
 *   - `repeat(X)`     → register `repeat1(X)`, alias wrapped in optional
 *   - `optional(X)`   → register X, alias wrapped in optional
 *   - `choice(X, BLANK)` or `choice(BLANK, X)` with X non-empty
 *                     → register X, alias wrapped in optional
 *   - `seq(A, B, ...)` with all members empty-matchable — rewrite the
 *                     first factorable member; still wrap in optional
 */
export function registerAliasedVariant(
    hiddenName: string,
    aliasValue: string,
    originalMember: RuntimeRule,
    bodyWrapper: (body: RuntimeRule) => RuntimeRule,
): RuntimeRule {
    const isUpperCase = originalMember.type === originalMember.type.toUpperCase()
    const wasEmpty = matchesEmpty(originalMember)
    const factored = factorOutEmptiness(originalMember)
    if (wasEmpty && !factored) {
        throw new Error(
            `variant()/alias(): can't extract '${hiddenName}' — its content matches the empty string and no non-empty core could be factored out. ` +
            `Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`,
        )
    }
    const body = factored ? factored.nonEmpty : originalMember
    registerSyntheticRule(hiddenName, bodyWrapper(body as RuntimeRule))
    const aliasNode = {
        type: isUpperCase ? 'ALIAS' : 'alias',
        content: { type: isUpperCase ? 'SYMBOL' : 'symbol', name: hiddenName },
        named: true,
        value: aliasValue,
    } as unknown as RuntimeRule
    if (factored) {
        const optional = (globalThis as { optional?: (c: unknown) => unknown }).optional
        if (typeof optional !== 'function') {
            throw new Error('synthetic-rules: no global optional() found — variant()/alias() on empty-matching content needs runtime optional()')
        }
        return optional(aliasNode) as RuntimeRule
    }
    return aliasNode
}

/**
 * If `rule` matches the empty string but has a factorable non-empty
 * core, return `{ nonEmpty }` — the caller wraps the call site in
 * `optional()` so the language stays the same. Returns null when the
 * rule is either non-empty already or can't be factored.
 */
function factorOutEmptiness(rule: RuntimeRule): { nonEmpty: unknown } | null {
    if (!matchesEmpty(rule)) return null
    return extractNonEmpty(rule)
}

/**
 * Recursively strip empty-matching branches from transparent
 * composition nodes (SEQ / CHOICE / OPTIONAL / REPEAT) until the
 * result is guaranteed non-empty. Returns null when the whole rule
 * is unconditionally empty or the shape is too pathological to
 * factor cleanly — caller surfaces the limitation upstream.
 */
function extractNonEmpty(rule: RuntimeRule): { nonEmpty: unknown } | null {
    const t = rule.type
    // repeat(X, ...) → repeat1(X, ...) — preserves sep / trailing /
    // leading metadata by direct spread (native repeat1() can't take
    // those as arguments).
    if (t === 'repeat' || t === 'REPEAT') {
        const r = rule as unknown as Record<string, unknown>
        const nonEmpty: Record<string, unknown> = { ...r, type: t === 'REPEAT' ? 'REPEAT1' : 'repeat1' }
        return { nonEmpty }
    }
    if (t === 'optional') {
        const inner = (rule as unknown as { content: RuntimeRule }).content
        return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner }
    }
    if (t === 'choice' || t === 'CHOICE') {
        const members = (rule as unknown as { members: RuntimeRule[] }).members
        const nonEmpty = members.filter(m => !matchesEmpty(m))
        if (nonEmpty.length === 0) return null
        if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] }
        return { nonEmpty: { type: t, members: nonEmpty } }
    }
    if (t === 'seq' || t === 'SEQ') {
        // A SEQ matches empty only when EVERY member does. Replacing
        // any one member with its non-empty core makes the whole SEQ
        // non-empty; we rewrite members one at a time from the first
        // factorable position. The outer `optional()` at the call
        // site restores the original empty-path semantics.
        const members = [...(rule as unknown as { members: RuntimeRule[] }).members]
        for (let i = 0; i < members.length; i++) {
            const factored = extractNonEmpty(members[i]!)
            if (factored) {
                members[i] = factored.nonEmpty as RuntimeRule
                return { nonEmpty: { type: t, members } }
            }
        }
        return null
    }
    return null
}

/**
 * Conservative empty-match detector. Returns true when `rule` can
 * produce a zero-length match. Used only to decide whether the
 * factored non-empty core is actually non-empty — errs on the side of
 * saying "true" for unknown shapes so callers don't wrongly claim a
 * body is non-empty.
 */
export function matchesEmpty(rule: RuntimeRule): boolean {
    const t = rule.type
    if (t === 'blank' || t === 'BLANK') return true
    if (t === 'optional') return true
    if (t === 'repeat' || t === 'REPEAT') return true
    if (t === 'choice' || t === 'CHOICE') {
        const members = (rule as unknown as { members: RuntimeRule[] }).members
        return members.some(m => matchesEmpty(m))
    }
    if (t === 'seq' || t === 'SEQ') {
        const members = (rule as unknown as { members: RuntimeRule[] }).members
        return members.every(m => matchesEmpty(m))
    }
    return false
}

export function withSyntheticRuleScope<T>(fn: () => T): { result: T; syntheticRules: Map<string, RuntimeRule> } {
    const prev = currentSyntheticRules
    currentSyntheticRules = new Map()
    try {
        const result = fn()
        const syntheticRules = currentSyntheticRules
        return { result, syntheticRules }
    } finally {
        currentSyntheticRules = prev
    }
}

/**
 * Wrap tree-sitter's `grammar()` to inject synthetic rules.
 *
 * Problem: tree-sitter builds its $ proxy (RuleBuilder) from
 * opts.rules keys BEFORE evaluating callbacks. Synthetic rule
 * names (from alias placeholders) aren't known until callbacks run.
 *
 * Solution: two-pass evaluation. First pass with a permissive $
 * proxy collects synthetic names. Second pass with those names
 * pre-registered runs the real grammar.
 */
export function installGrammarWrapper(): void {
    const g = globalThis as { grammar?: (...args: unknown[]) => unknown; blank?: () => unknown }
    const nativeGrammar = g.grammar
    if (typeof nativeGrammar !== 'function') return

    g.grammar = function wrappedGrammar(...args: unknown[]): unknown {
        // Pass 1: dry-run to collect synthetic rule names.
        // Evaluate all rule callbacks with a permissive proxy that
        // doesn't throw on unknown names. alias() placeholders
        // register names via registerSyntheticRule.
        currentSyntheticRules = new Map()
        const base = args.length > 1 ? (args[0] as {
            rules?: Record<string, (...a: unknown[]) => unknown>
            __enrichOverrides__?: Record<string, (...a: unknown[]) => unknown>
        }) : undefined
        const opts = (args.length > 1 ? args[1] : args[0]) as { rules?: Record<string, (...a: unknown[]) => unknown> } | undefined
        // Merge enrich-generated overrides from base into opts.rules.
        // enrich() emits these as a side-channel; wrappedGrammar splices
        // them into the override bag so pass 1 dry-run sees them and
        // discovers synthetic rules registered during transform().
        // User overrides (already in opts.rules) win on name collisions.
        //
        // Capture the USER-AUTHORED override names BEFORE the merge so
        // downstream (derive-overrides-json via raw.overrideRuleNames)
        // doesn't treat enrich-injected rules as full-replacement
        // overrides. Stashed as a non-enumerable property on opts.
        if (opts) {
            const userNames = Object.keys(opts.rules ?? {})
            Object.defineProperty(opts, '__userOverrideRuleNames__', {
                value: userNames,
                enumerable: false,
                configurable: true,
                writable: false,
            })
        }
        if (base?.__enrichOverrides__ && opts) {
            if (!opts.rules) opts.rules = {}
            for (const [name, fn] of Object.entries(base.__enrichOverrides__)) {
                if (!(name in opts.rules)) opts.rules[name] = fn
            }
        }
        if (opts?.rules) {
            const permissive = new Proxy({}, {
                get(_: unknown, name: string) {
                    return { type: 'SYMBOL', name }
                },
            })
            for (const [name, ruleFn] of Object.entries(opts.rules)) {
                if (typeof ruleFn === 'function') {
                    currentRuleKind = name
                    // Pre-evaluate the corresponding base rule so the
                    // override's `original` arg is an inspectable tree.
                    // Needed for enrich-generated overrides that call
                    // transform(original, ...) with position-dependent
                    // patches — without a real original they can't
                    // register synthetic rules in pass 1.
                    let baseOriginal: unknown = undefined
                    const baseFn = base?.rules?.[name]
                    if (typeof baseFn === 'function') {
                        try { baseOriginal = baseFn.call(permissive, permissive, undefined) }
                        catch (e) {
                            // Pass 1 runs with a permissive proxy so most DSL
                            // lookups succeed; a throw here means the base's
                            // rule body calls a helper the permissive proxy
                            // can't fake (common for grammars using custom
                            // `sepBy` / `commaSep` closures). Safe to continue
                            // — the override gets `undefined` for `original`,
                            // so its transform() calls bail out of hoisting
                            // paths. Surface for SITTIR_DEBUG only; a chatty
                            // stderr on every run would drown real errors.
                            if (typeof process !== 'undefined' && process?.env?.SITTIR_DEBUG) {
                                console.error(`[sittir] pass1 base '${name}' threw: ${(e as Error)?.message?.slice(0, 120) ?? e}`)
                            }
                        }
                    }
                    try { ruleFn.call(permissive, permissive, baseOriginal) }
                    catch (e) {
                        // Override threw during pass 1. Possible causes:
                        // (a) permissive proxy returned a symbol placeholder
                        //     the override's transform() can't descend into;
                        // (b) variant-name uniqueness guard hit (duplicate
                        //     `variant('name')` in a single rule — the real
                        //     pass 2 will re-throw this cleanly);
                        // (c) a real bug in the override code.
                        // (a) is expected and benign. (b) + (c) will resurface
                        // in pass 2 with full context; here we just log under
                        // SITTIR_DEBUG so silent swallowing doesn't hide (c)
                        // during investigation.
                        if (typeof process !== 'undefined' && process?.env?.SITTIR_DEBUG) {
                            console.error(`[sittir] pass1 override '${name}' threw: ${(e as Error)?.message?.slice(0, 120) ?? e}`)
                        }
                    }
                    finally { currentRuleKind = null }
                }
            }
        }

        // Collect names discovered in pass 1
        const discoveredNames = new Map(currentSyntheticRules)
        currentSyntheticRules = new Map()
        // Capture conflicts registered during pass 1 (if any). The
        // post-nativeGrammar step below appends these to the result's
        // conflicts array, alongside whatever pass 2 (real rule
        // evaluation) contributes. We can't just wrap opts.conflicts
        // because tree-sitter's `$` at that invocation point doesn't
        // resolve base-scoped rule names — calling `base.conflicts($)`
        // from the wrap produces `[null, null, …]` entries. Appending
        // to the resolved result sidesteps that entirely.
        const pendingConflictsAfterGrammar = drainConflicts()

        // Wrap rule functions to track currentRuleKind during pass 2.
        // tree-sitter's native grammar() calls each rule fn — we need
        // the rule name context for variant() auto-prefixing.
        if (opts?.rules) {
            for (const [name, ruleFn] of Object.entries(opts.rules)) {
                if (typeof ruleFn !== 'function') continue
                opts.rules[name] = function(this: unknown, ...a: unknown[]) {
                    currentRuleKind = name
                    try { return ruleFn.apply(this, a) }
                    finally { currentRuleKind = null }
                }
            }
        }

        // Pass 2: add hidden rules as blank() entries to opts.rules
        // so tree-sitter's RuleBuilder includes them in the ruleMap.
        // Warn (stderr) when pass 1 discovered zero names — usually
        // means the dry-run's permissive proxy couldn't reach the real
        // rule tree shape, which leaves conflicts() unable to resolve
        // `$.variantName` symbols at grammar-gen time.
        if (opts?.rules && discoveredNames.size > 0) {
            const blank = g.blank
            for (const [name] of discoveredNames) {
                if (!(name in opts.rules)) {
                    opts.rules[name] = () => blank ? blank() : ({ type: 'BLANK' })
                }
            }
        }

        // Expose opts.rules + blank() to registerSyntheticRule so any
        // rule name registered during pass 2 (tree-sitter's real grammar
        // evaluation, where hoisted variants get discovered because
        // `original` is a real rule tree instead of a permissive proxy)
        // is immediately backed by a blank placeholder in opts.rules.
        // Without this, conflicts() — which runs inside nativeGrammar
        // AFTER rule evaluation but BEFORE our drain step — would fail
        // to resolve `$.<variantName>` references.
        if (opts?.rules) {
            currentOptsRules = opts.rules as Record<string, unknown>
            currentBlankFn = g.blank ?? null
        }
        // try/catch is load-bearing: if nativeGrammar throws (e.g. a
        // tree-sitter-level grammar error), the module-level state
        // (`currentOptsRules`, `currentBlankFn`, `currentSyntheticRules`,
        // `currentConflicts`) must reset so the next invocation doesn't
        // inherit ghost registrations from the failed run. The SUCCESS
        // path intentionally leaves `currentSyntheticRules` / conflicts
        // populated — the code below this block drains them when
        // building the result, and draining here would hide them from
        // the post-nativeGrammar assembly.
        let result: Record<string, unknown> | null
        try {
            result = nativeGrammar.apply(this, args) as Record<string, unknown> | null
        } catch (e) {
            currentOptsRules = null
            currentBlankFn = null
            drainSyntheticRules()
            drainConflicts()
            drainPolymorphVariants()
            currentRuleKind = null
            throw e
        }
        currentOptsRules = null
        currentBlankFn = null

        // Append hoist-registered conflicts + swap blank synthetic-rule
        // placeholders for real captured content. Wrapped in try/finally
        // so a throw anywhere in this post-nativeGrammar assembly still
        // drains accumulator state — without the finally, a throw here
        // would leak `currentSyntheticRules` / `currentConflicts` /
        // `currentPolymorphVariants` into the NEXT invocation's state,
        // producing confusing "ghost registrations" downstream.
        try {
            const allConflicts = [...pendingConflictsAfterGrammar, ...drainConflicts()]
            if (result && allConflicts.length > 0 && typeof result === 'object') {
                const grammar = (result as { grammar?: Record<string, unknown> }).grammar ?? result
                const current = Array.isArray(grammar.conflicts) ? grammar.conflicts as unknown[] : []
                // tree-sitter's serialized conflicts use bare rule-name
                // strings (not SYMBOL-shaped objects), so match that shape.
                for (const group of allConflicts) {
                    current.push([...group])
                }
                grammar.conflicts = current
            }

            // Replace blank entries with real captured content
            const synthetic = drainSyntheticRules()
            if (result && synthetic.size > 0 && typeof result === 'object') {
                const grammar = (result as { grammar?: Record<string, unknown> }).grammar ?? result
                if ('rules' in grammar) {
                    const rules = grammar.rules as Record<string, unknown>
                    for (const [name, content] of synthetic) {
                        rules[name] = content
                    }
                }
            }
            return result
        } finally {
            // Belt-and-suspenders: the drains above already emptied
            // these on the success path, but a throw mid-assembly would
            // leak state. Unconditional drain here is idempotent.
            drainSyntheticRules()
            drainConflicts()
            drainPolymorphVariants()
            currentRuleKind = null
        }
    }
}
