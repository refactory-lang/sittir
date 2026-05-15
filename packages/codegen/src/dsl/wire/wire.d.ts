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
import type { PolymorphVariant } from '../../compiler/types.ts';
import type { RuntimeRule } from '../runtime-shapes.ts';
/**
 * Per-`wire()`-invocation state. All fields are mutable so DSL helpers
 * (variant/alias/conflict registration) can push into them while the
 * rule-fn wrapper has this context installed.
 */
export interface WireContext {
    /** Hidden-rule name → captured content body. */
    readonly deposits: Map<string, RuntimeRule>;
    /** Hidden `_kw_*` helper names that should be appended to the
     *  grammar's inline list after rule evaluation deposits their body. */
    readonly syntheticInline: Set<string>;
    /** `{parent, child}` pairs registered by variant(). Sittir's Link
     *  reads these to classify polymorphs — tree-sitter ignores them. */
    readonly polymorphVariants: PolymorphVariant[];
    /** Conflict groups (rule-name arrays) registered by variant() for
     *  sibling-variant ambiguity. Drained by the wrapped `conflicts`
     *  callback when tree-sitter invokes it. */
    readonly conflictGroups: string[][];
    /** Per-rule form declarations registered by refine(). Ordered list
     *  — the first form is the default the bare factory call routes to.
     *  Emitters consume this to generate namespace-keyed factories
     *  (`ir.interfaceBody.curly(...)`) with narrowed Configs. The rule
     *  tree itself is unchanged by refine(); tree-sitter parses with
     *  the original shape. */
    readonly refineForms: Map<string, RefineForm[]>;
    /** Name of the rule currently being evaluated, for variant()'s
     *  auto-prefix behavior (`variant('eq')` under `assignment` →
     *  `_assignment_eq`). Set by the rule-fn wrapper. */
    currentRuleKind: string | null;
    /** Rule names explicitly authored in `config.rules`. Synthetic `_kw_*`
     *  auto-inline only applies to helpers wire synthesized itself. */
    readonly authoredRuleNames: ReadonlySet<string>;
}
/**
 * A single named form declared via `refine(original, { name: selections })`.
 * `selections` maps a path (into `original`) to a chosen branch — either
 * a numeric branch index or a literal string matching one of the choice
 * arm's string values. See the refine() DSL primitive for the full design.
 */
export interface RefineForm {
    readonly name: string;
    readonly selections: Record<string, number | string>;
}
/** Read the active wire context, or null if no `wire()`-wrapped rule
 *  fn is currently executing. DSL helpers use this to decide whether
 *  to route state into the wire closure or into the legacy module
 *  accumulator in `synthetic-rules.ts`. */
export declare function getCurrentWireContext(): WireContext | null;
/**
 * Register a hidden-rule body against the active wire context. Returns
 * `true` when the context absorbed the call, `false` when there is no
 * active context (caller falls back to the legacy accumulator).
 */
export declare function wireRegisterSyntheticRule(name: string, content: RuntimeRule): boolean;
/**
 * Register a synthesized `_kw_*` helper for automatic inlining.
 *
 * @remarks
 * Only wire-authored helpers participate. If the grammar author declared
 * the rule explicitly in `config.rules`, they own its `inline:` policy.
 */
export declare function wireRegisterSyntheticInline(name: string): boolean;
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
export declare function wireRegisterPolymorphVariant(parent: string, child: string): boolean;
/**
 * Register a conflict group against the active wire context. Dedupes
 * by exact group membership (same names in same order).
 */
export declare function wireRegisterConflict(names: readonly string[]): boolean;
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
export declare function wireRegisterRefineForms(kind: string, forms: RefineForm[]): boolean;
/** Current rule kind on the active wire context, or null when inactive. */
export declare function wireGetCurrentRuleKind(): string | null;
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
export declare function withWireContext<T>(ruleKind: string | null, fn: (ctx: WireContext) => T): {
    result: T;
    ctx: WireContext;
};
/**
 * Shape of the type parameter to `wire()` / `transform()` / the
 * polymorph & transform config interfaces. Two shapes accepted:
 *
 * 1. **Flat sittir-emitted grammar type** (preferred) — the
 *    `RustGrammar` / `TypeScriptGrammar` / `PythonGrammar` types
 *    emitted at `packages/{lang}/src/grammar.ts`. Top-level keys are
 *    the kind names (visible AND hidden, e.g. `_expression`,
 *    `_visibility_modifier_pub`). Authors write `wire<RustGrammar>(...)`.
 *
 * 2. **Tree-sitter native base grammar** — `typeof base` from
 *    `tree-sitter-<lang>/grammar.js`, shape `{ rules: { … } }`.
 *    Less authoritative (no hidden kinds added by overrides), but
 *    works for authors that already have `import base from
 *    '…/grammar.js'` in scope and want to bind to it directly.
 *
 * `BaseKind<Base>` projects the kind-name union out of either shape.
 * The default (`Record<string, unknown>`) collapses to plain `string`
 * keys, preserving the pre-generics behaviour of every call site that
 * doesn't supply a base type.
 */
export type GrammarBase = Record<string, unknown> | {
    readonly rules: Record<string, unknown>;
};
/** @internal — extract the rule-kind string union from a base grammar.
 *  Handles both shapes: `{ rules: { … } }` (tree-sitter native) and
 *  flat top-level keys (sittir-emitted `<Lang>Grammar`). */
type BaseKind<Base extends GrammarBase> = Base extends {
    readonly rules: infer R;
} ? keyof R & string : keyof Base & string;
/**
 * Declarative polymorph map: parent rule kind → (path-in-original → suffix).
 *
 * @example
 *   { assignment: { '1/0': 'eq', '1/1': 'type', '1/2': 'typed' } }
 *
 * Keys are typed as `keyof Base['rules']` when a base grammar is
 * supplied; else fall back to plain `string`. Path strings and suffix
 * names stay untyped — paths describe runtime descents into the rule
 * tree (`seq`/`choice` indices), suffixes are author-introduced.
 */
export type PolymorphsConfig<Base extends GrammarBase = GrammarBase> = Partial<Record<BaseKind<Base>, Record<string, string>>>;
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
export type TransformsConfig<Base extends GrammarBase = GrammarBase> = Partial<Record<BaseKind<Base>, PatchMap | PatchMap[]>>;
/** A single patch-map — path-in-original → patch value. */
export type PatchMap = Record<string, unknown>;
/**
 * Shape of an options argument passed to tree-sitter's `grammar()` — the
 * fields `wire()` knows about. Extra fields are passed through
 * unchanged.
 *
 * `Base` is the base tree-sitter grammar's type (typically `typeof base`
 * imported from `tree-sitter-<lang>/grammar.js`). Constrains
 * `polymorphs` / `transforms` keys to base rule kinds; `rules` stays
 * permissive (`Partial<Record<BaseKind, RuleFn>> & Record<string, RuleFn>`)
 * to keep the hidden-name escape hatch for synthesized rules
 * (`_kw_<field>`, `_<parent>_<variant>`, `_<alias>`).
 */
export interface WireConfig<Base extends GrammarBase = GrammarBase> {
    readonly name?: string;
    readonly rules: Partial<Record<BaseKind<Base>, RuleFn>> & Record<string, RuleFn>;
    readonly polymorphs?: PolymorphsConfig<Base>;
    readonly transforms?: TransformsConfig<Base>;
    readonly conflicts?: ConflictsFn;
    readonly externals?: DollarFn<unknown[]>;
    readonly extras?: DollarFn<unknown[]>;
    readonly supertypes?: DollarFn<unknown[]>;
    readonly inline?: DollarFn<unknown[]>;
    readonly word?: DollarFn<unknown>;
    readonly precedences?: DollarFn<unknown[][]>;
    readonly reserved?: Record<string, DollarFn<unknown[]>>;
    /** Side-channel from `enrich()` — preserved unchanged. */
    readonly __enrichOverrides__?: Record<string, RuleFn>;
}
export interface WiredOpts {
    readonly name?: string;
    readonly rules: Record<string, RuleFn>;
    readonly conflicts?: ConflictsFn;
    readonly externals?: DollarFn<unknown[]>;
    readonly extras?: DollarFn<unknown[]>;
    readonly supertypes?: DollarFn<unknown[]>;
    readonly inline?: DollarFn<unknown[]>;
    readonly word?: DollarFn<unknown>;
    readonly precedences?: DollarFn<unknown[][]>;
    readonly reserved?: Record<string, DollarFn<unknown[]>>;
    readonly __enrichOverrides__?: Record<string, RuleFn>;
    /**
     * Attached so sittir's compiler pipeline (evaluate → link) can read
     * the polymorph metadata without driving rule evaluation a second
     * time. Non-enumerable on the returned object so tree-sitter's
     * own iteration doesn't trip on it.
     */
    readonly __wireContext__?: WireContext;
}
type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown;
type ConflictsFn = (this: unknown, $: unknown, previous?: unknown[][]) => unknown[][];
type DollarFn<T> = (this: unknown, $: unknown, previous?: T) => T;
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
export declare function wire<Base extends GrammarBase = GrammarBase>(config: WireConfig<Base>): WiredOpts;
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
export declare function polymorphVisibleName(parentKind: string, suffix: string): string;
/** Hidden rule name for a polymorph variant — underscore-prefixed visible form. */
export declare function polymorphHiddenName(parentKind: string, suffix: string): string;
export {};
//# sourceMappingURL=wire.d.ts.map