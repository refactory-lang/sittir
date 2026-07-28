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

import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { typeEq, isChoiceType, isBlankType } from '../../types/runtime-shapes.ts';
import { variant as variantPlaceholder } from '../primitives/variant.ts';
import { transform as transformFn } from '../transform/transform.ts';
import { isFieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import { isVariantPlaceholder } from '../primitives/variant.ts';
import { getEnrichClauseGroups, getEnrichClauseGroupOwners, getEnrichVisibleGroupSources } from '../enrich.ts';
// Phase-2: tuple-precise base-grammar constraint + per-rule transform path keys.
import type { GrammarJson, GrammarRule, SymbolRule, AuthoringRule } from '../../grammar-shapes/grammar-json.ts';
import type { FastKeys, TransformPatchMap } from '../../grammar-shapes/path-type.ts';

// ---------------------------------------------------------------------------
// RenderAsConfig — sittir-side rule bodies for external scanner symbols
// ---------------------------------------------------------------------------

/**
 * A function taking the grammar's `$` proxy and returning a record from
 * external-symbol-name to a sittir DSL rule body.
 *
 * The returned bodies are used by sittir's slot/render/factory pipeline
 * AS IF they were regular author-written rules. They are stripped from
 * the grammar that reaches tree-sitter (the external scanner still
 * produces the symbol). Supported body forms include `string(lit)` for
 * literal stamping and `blank()` for zero-width markers that collapse
 * the surrounding `choice(...)` into `optional(...)`.
 *
 * @example
 *   renderAs: ($) => ({
 *     _outer_block_doc_comment_marker: string('!'),
 *     _automatic_semicolon: blank(),
 *   })
 */
export type RenderAsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

// ---------------------------------------------------------------------------
// VisibleExternalsConfig — materialize hidden external-scanner symbols as
// named CST-visible aliases
// ---------------------------------------------------------------------------

/**
 * A function taking the grammar's `$` proxy and returning a record from
 * hidden (`_`-prefixed) external-scanner-symbol-name to a sittir DSL rule
 * body — the SAME value shape `renderAs:` accepts (`string(lit)`, `blank()`,
 * etc.).
 *
 * Unlike `renderAs:` (which inlines its literal at every reference site,
 * producing no CST node), `visibleExternals:` wraps EVERY `SYMBOL`
 * reference to a configured hidden name in a named visible alias
 * (`alias($._x, $.x)`, visible name = hidden name minus leading
 * underscores) under BOTH runtimes (tree-sitter CLI executing the bundled
 * grammar.js, and sittir's evaluate pipeline). Tree-sitter then compiles a
 * real parser kind for the visible name — a zero-width external token
 * (e.g. TypeScript's ASI `_automatic_semicolon`) materializes as an actual
 * CST node instead of vanishing into its referencing rule. The visible
 * kind's rule body (this config's value) becomes its sittir-side render
 * text — see `link.ts`'s `visibleExternals` registration.
 *
 * @example
 *   visibleExternals: ($) => ({
 *     _automatic_semicolon: string('\n'),
 *   })
 */
export type VisibleExternalsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

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
	readonly deposits: Map<string, RuntimeRule>;
	/** Hidden `_kw_*` helper names that should be appended to the
	 *  grammar's inline list after rule evaluation deposits their body. */
	readonly syntheticInline: Set<string>;
	/** Hidden source names behind enrich visible-group mints
	 *  (`alias($._src, $.visible)`) that must be FILTERED OUT of the
	 *  grammar's final `inline:` list. Tree-sitter erases inlined rules
	 *  before table construction, vaporizing the alias — and the minted
	 *  kind's entire parser identity — while the IR still models the kind
	 *  (the phantom-kind divergence). Populated from
	 *  `getEnrichVisibleGroupSources(base)`; applied by the wired inline
	 *  callback. */
	readonly inlineRemovals: Set<string>;
	/** Enrich-synthesized clause-hoist names (both inline-safe and
	 *  visible-aliased categories — see `getEnrichClauseGroupOwners`) whose
	 *  recorded owning parent is redeclared in THIS grammar's own
	 *  `rules:` config. An override author can never reference a
	 *  synthesized name by hand (it doesn't exist until enrich() mints it
	 *  from the base grammar's pre-override shape), so redeclaring the
	 *  owner unconditionally orphans it. Read by
	 *  `collectGrammarDiagnosticsForGrammar` to suppress the phantom
	 *  content-collision/storagename-collision diagnostic these orphans
	 *  would otherwise raise for a kind that can never occur in a parse. */
	readonly orphanedSyntheticGroups: Set<string>;
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
	/** Per-kind group-lift map from config. Link reads this to synthesize
	 *  nested sub-rules into hidden AssembledGroup kinds. See:
	 *  docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md */
	readonly groups?: GroupsConfig;
	/** Raw polymorphs path→variant-name config. Link passes this to
	 *  applyGroupOverrides so synthesized kind names include polymorph-
	 *  ancestor context segments. */
	readonly polymorphsConfig?: PolymorphsConfig;
	/** Sittir-side rule bodies for external scanner symbols. Each entry
	 *  gives sittir's slot/render/factory pipeline a structural body for
	 *  a symbol produced by the C external scanner. The body is used
	 *  sittir-side only; when the grammar reaches tree-sitter the entry
	 *  is stripped (the external scanner still produces the symbol).
	 *  See: renderAs mechanism. */
	readonly renderAs?: RenderAsConfig;
	/** Hidden-external → sittir-side render body map from `visibleExternals:`.
	 *  See {@link VisibleExternalsConfig} for the full mechanism. */
	readonly visibleExternals?: VisibleExternalsConfig;
	/** Per-kind, per-diagnostic-code exceptions from `expectDiagnostics:`.
	 *  See `WireConfig.expectDiagnostics` for the full description. */
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	/** Per-kind known-failing generated-test declarations from
	 *  `expectTestFailures:`. See `WireConfig.expectTestFailures`. */
	readonly expectTestFailures?: Partial<Record<string, string>>;
	/** Name of the rule currently being evaluated, for variant()'s
	 *  auto-prefix behavior (`variant('eq')` under `assignment` →
	 *  `_assignment_eq`). Set by the rule-fn wrapper. */
	currentRuleKind: string | null;
	/** Rule<'evaluate'> names explicitly authored in `config.rules`. Synthetic `_kw_*`
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

let currentContext: WireContext | null = null;

export function getCurrentWireContext(): WireContext | null {
	return currentContext;
}

export function wireRegisterSyntheticRule(name: string, content: RuntimeRule): boolean {
	if (!currentContext) return false;
	currentContext.deposits.set(name, content);
	return true;
}

export function wireRegisterSyntheticInline(name: string): boolean {
	if (!currentContext) return false;
	if (currentContext.authoredRuleNames.has(name)) return false;
	currentContext.syntheticInline.add(name);
	return true;
}

export function wireRegisterConflict(names: readonly string[]): boolean {
	if (!currentContext) return false;
	if (names.length === 0) return true;
	const key = names.join('\u0000');
	const exists = currentContext.conflictGroups.some((g) => g.join('\u0000') === key);
	if (!exists) {
		currentContext.conflictGroups.push([...names]);
	}
	return true;
}

export function wireRegisterRefineForms(kind: string, forms: RefineForm[]): boolean {
	if (!currentContext) return false;
	currentContext.refineForms.set(kind, forms);
	return true;
}

export function wireGetCurrentRuleKind(): string | null {
	return currentContext?.currentRuleKind ?? null;
}

export function withWireContext<T>(
	ruleKind: string | null,
	fn: (ctx: WireContext) => T
): { result: T; ctx: WireContext } {
	const ctx: WireContext = {
		deposits: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		orphanedSyntheticGroups: new Set(),
		conflictGroups: [],
		refineForms: new Map(),
		groups: undefined,
		polymorphsConfig: undefined,
		renderAs: undefined,
		currentRuleKind: ruleKind,
		authoredRuleNames: new Set()
	};
	const prev = currentContext;
	currentContext = ctx;
	try {
		const result = fn(ctx);
		return { result, ctx };
	} finally {
		currentContext = prev;
	}
}

// ---------------------------------------------------------------------------
// Public API: `wire(config)` — opts wrapper
// ---------------------------------------------------------------------------

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

/** @internal — extract the rule-kind string union from a base grammar.
 *  Handles both shapes: `{ rules: { … } }` (tree-sitter native) and
 *  flat top-level keys (sittir-emitted `<Lang>Grammar`). */
type BaseKind<Base extends GrammarJson = GrammarJson> = Base extends {
	readonly rules: infer R;
}
	? keyof R & string
	: keyof Base & string;

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
export type PolymorphsConfig<Base extends GrammarJson = GrammarJson> = Partial<
	Record<BaseKind<Base>, Record<string, string>>
>;

/**
 * Per-kind group-lift map. Each entry's key is either:
 *   1. A parent kind whose rule body contains a sub-rule to lift —
 *      the value is `path → discriminator`, same slash-separated path
 *      semantics as `polymorphs:` / `transforms:`, with the
 *      discriminator becoming the leaf segment of the synthesized
 *      hidden kind name. (Path-mode — existing behavior.)
 *   2. A visible kind name (NO leading underscore) whose value is a
 *      RuleFn (body-pattern function). Codegen synthesizes the hidden
 *      `_<key>` rule from the function body and rewrites every
 *      structurally-matching sub-tree in the grammar as
 *      `alias($._<key>, $.<key>)` so tree-sitter emits the visible kind
 *      as a CST node. (Body-pattern mode — for tree-sitter inlining
 *      workarounds where a hidden helper would otherwise vanish from
 *      the parse tree.)
 *
 * For path-mode entries the synthesized kind name follows polymorph-
 * ancestor context: each path segment that ALSO appears in `polymorphs:`
 * for the same kind contributes its variant name to the synthesized
 * kind. Non-polymorph segments don't contribute. See:
 *   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
 *
 * Keys are plain `string` rather than `BaseKind<Base>` because the
 * post-polymorph-aliased rule map contains synthesized variant kinds
 * (e.g. `_visibility_modifier_pub`) that aren't exported in the base
 * grammar's kind set. `BaseKind<Base>` was too narrow — it caused a
 * type error on those keys that was masked by `--noCheck` but would
 * fail when the build check is re-enabled.
 */
export type GroupsConfigValue = Record<string, string> | RuleFn;
export type GroupsConfig = Partial<Record<string, GroupsConfigValue>>;

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
export type TransformsConfig<Base extends GrammarJson = GrammarJson> = [GrammarRule] extends [
	Base['rules'][keyof Base['rules']]
]
	? // Loose default (`Base = GrammarJson`, rule values are the open
		// `GrammarRule` union): use the plain `PatchMap` form. Mapping
		// `PathKey<…>` over the OPEN union recurses unboundedly (TS2589); the
		// per-rule precise form is only meaningful — and only safe — when
		// `Base` is a CONCRETE `as const` schema (tuple rule bodies). The
		// internal pipeline always sees this loose form.
		Partial<Record<BaseKind<Base>, PatchMap | PatchMap[]>>
	: Base extends { readonly rules: infer R }
		? {
				// Concrete `Base` (e.g. `RustGrammarShape`): per rule K, keys are
				// segment-1-precise path strings. We derive them from the RAW rule
				// (`FastKeys` = PathKey<R[K]>) rather than the post-Enrich shape:
				// `PathKey` only consumes the FIRST segment (`TopLevelKeys`), and
				// enrich wraps top-level members IN PLACE (never adds/removes one),
				// so `PathKey<EnrichRule<X>> ≡ PathKey<X>` (proven in
				// wire-transforms.test-d.ts). FastKeys is therefore LOSSLESS for
				// keys and avoids instantiating EnrichRule over the loose union
				// (which is the TS2589 source). Array form = multi-patchset rules.
				readonly [K in keyof R]?: R[K] extends GrammarRule
					? TransformPatchMap<FastKeys<R[K]>> | TransformPatchMap<FastKeys<R[K]>>[]
					: PatchMap | PatchMap[];
			}
		: Partial<Record<BaseKind<Base>, PatchMap | PatchMap[]>>;

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
/**
 * Clean `$` proxy: rule-name → symbol reference, mapped over the schema's
 * CONCRETE rule names (including hidden `_`-prefixed rules). Crucially it has NO
 * index signature, so `$.x` does NOT leak `| undefined` under
 * `noUncheckedIndexedAccess` — unlike tree-sitter's `GrammarSymbols`, whose
 * index-signature leak makes `$.x: SymbolRule<'evaluate'> | undefined` and breaks
 * composition (`undefined ⊄ AuthoringRule`) in overrides.ts authoring.
 */
export type ShapedSymbols<B extends GrammarJson> = {
	readonly [R in keyof B['rules'] & string]: SymbolRule<R>;
} & {
	// Permissive fallback for alias-target / synthesized names not in the base
	// grammar.json (e.g. `$.wildcard_pattern`). Known rules resolve via the
	// mapped member above (precise `SymbolRule<R>`, no `undefined`); only unknown names
	// hit this index.
	readonly [name: string]: SymbolRule<string>;
};

export type WireConfig<B extends GrammarJson, NewRules extends string = string> = Omit<
	Grammar<NewRules, keyof B['rules'] & string>,
	'rules' | 'conflicts'
> & {
	/**
	 * Conflict sets — same clean-`$` typing as `rules`/`groups` (`ShapedSymbols<B>`,
	 * no `undefined` leak). `previous` is the base grammar's conflict list.
	 */
	readonly conflicts?: (
		$: ShapedSymbols<B>,
		previous: readonly (readonly AuthoringRule[])[]
	) => readonly (readonly AuthoringRule[])[];
	/**
	 * Rule<'evaluate'> bodies — clean-`$` builders. `previous`/`original` is typed PER RULE as
	 * `B['rules'][K]` directly — the input rule's exact shape, preserved not
	 * flattened. (`B` here is the ALREADY-ENRICHED schema from `enrich()`'s typed
	 * return, so `B['rules'][K]` is the post-enrich shape; no re-application of
	 * `EnrichRule`.) Keyed over the schema's CONCRETE rule names (mapping over
	 * `NewRules` would absorb to `string` and lose per-key precision). Loose
	 * `=> unknown` return accepts sittir DSL outputs.
	 */
	readonly rules?: {
		readonly [K in keyof B['rules'] & string]?: ($: ShapedSymbols<B>, previous: B['rules'][K]) => unknown;
	} & {
		// New rules the override ADDS (not in the base grammar.json, e.g. a
		// synthesized `_wildcard_pattern`): `$` stays typed; no base `previous`.
		// `any`-typed `previous` keeps the precise base-rule callbacks above
		// assignable here (bivariant), so known keys retain their precise shape.
		readonly [name: string]: ($: ShapedSymbols<B>, previous?: any) => unknown;
	};
	readonly polymorphs?: PolymorphsConfig<B>;
	/**
	 * Group-lift map — same `$` typing as `rules`. Path-mode entries are
	 * `path → discriminator` records; body-pattern-mode entries are clean-`$`
	 * builders (`($: ShapedSymbols<B>) => unknown`), not the untyped `RuleFn`.
	 */
	readonly groups?: Partial<
		Record<string, Record<string, string> | (($: ShapedSymbols<B>, previous?: GrammarRule) => unknown)>
	>;
	readonly transforms?: TransformsConfig<B>;
	/** Side-channel from `enrich()` — preserved unchanged. */
	readonly __enrichOverrides__?: Record<string, RuleFn>;
	/**
	 * Sittir-side render bodies for external scanner symbols.
	 * Takes the grammar's `$` proxy and returns a record from external-
	 * symbol-name to a sittir DSL rule body. Supported body forms include
	 * `string(lit)` for literal stamping and `blank()` for zero-width
	 * markers that collapse the surrounding `choice(...)` into
	 * `optional(...)`. Bodies enter sittir's slot/render/factory pipeline
	 * as regular rules and are stripped from the tree-sitter grammar
	 * output.
	 *
	 * @example
	 *   renderAs: ($) => ({
	 *     _outer_block_doc_comment_marker: string('!'),
	 *     _automatic_semicolon: blank(),
	 *   })
	 */
	readonly renderAs?: RenderAsConfig;
	/**
	 * Hidden-external → sittir-side render body map. See
	 * {@link VisibleExternalsConfig} for the full mechanism.
	 *
	 * @example
	 *   visibleExternals: ($) => ({
	 *     _automatic_semicolon: string('\n'),
	 *   })
	 */
	readonly visibleExternals?: VisibleExternalsConfig;
	/**
	 * Per-kind, per-diagnostic-code exceptions — declares that a specific
	 * grammar diagnostic (e.g. `'content-collision'`, `'storagename-collision'`)
	 * is EXPECTED and should stay non-blocking for the listed kind names,
	 * instead of the grammar-wide blocking default. Use this ONLY for a
	 * genuinely accepted, documented floor (see docs/KNOWN_ISSUES.md) — not
	 * as a way to silence a diagnostic you haven't investigated.
	 *
	 * @example
	 *   expectDiagnostics: { 'content-collision': ['_object_type_group1'] }
	 */
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	/**
	 * Per-kind known-failing declarations for the generated `nodes.test.ts`
	 * suite (`emitters/test.ts`). Each entry maps a kind name to a short
	 * reason string — REQUIRED to reference the tracking issue (e.g.
	 * `'#130 — factory returns wrong $type'`). Listed kinds are emitted as
	 * `describe.skip` with the reason inline, so `pnpm test` stays green
	 * without masking new regressions in other kinds. Remove the entry when
	 * the underlying defect is fixed; the next regen re-enables the tests.
	 * Use ONLY for tracked, documented defects — not to silence a failure
	 * you haven't investigated.
	 *
	 * @example
	 *   expectTestFailures: { mod_item: '#128 — lenient from-coercion wraps alternate branch' }
	 */
	readonly expectTestFailures?: Partial<Record<string, string>>;
};

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

// LOOSE-INTERNAL / NARROW-PUBLIC split (Phase-4 resolution to the
// contravariance wall):
//
// `SittirRuleFn` is the INTERNAL rules-map element type. wire's own builder
// fns — `makeDeferredContentFn`, `buildTransformParentFn`, `wiredPolymorphParent`,
// `patternReplacingRuleFn`, and auto-groups' `makeStaticRuleFn` — return
// sittir's dual-runtime raw rule shapes (lowercase + sittir-only variants,
// heterogeneous literals, typed `unknown`/`RuntimeRule`), BROADER than
// tree-sitter's `RuleOrLiteral`, so the return MUST stay `unknown`.
//
// The PARAMS are `any`, NOT `unknown` — this is load-bearing. The PUBLIC
// authoring callbacks `WireConfig.rules` exposes are narrow
// (`($: GrammarSymbols<…>) => unknown`). A narrow `$: GrammarSymbols` fn is
// assignable to a loose `$: any` param (any is bivariant-compatible) but NOT
// to `$: unknown` (function params are contravariant — `unknown` demands the
// fn accept anything, which a `GrammarSymbols`-typed `$` does not). With
// `$: unknown` the narrow public fns wouldn't flow into
// `WireContext.rules: Record<string, SittirRuleFn>` without a cast; `$: any`
// lets them flow with zero cast. The internal machinery still consumes this
// loose type unchanged.
type SittirRuleFn = ($: any, previous?: any) => unknown;
/** @internal alias for the internal rules-map element type (the dual-runtime seam). */
type RuleFn = SittirRuleFn;
type ConflictsFn = (this: unknown, $: unknown, previous?: unknown[][]) => unknown[][];
type DollarFn<T> = (this: unknown, $: unknown, previous?: T) => T;

/**
 * Wrap the user's grammar options with wire-managed polymorph plumbing.
 *
 * @param config - Options to pass to `grammar()` plus an optional
 *   `polymorphs` declaration.
 * @param base - Optional enriched-base grammar object. When supplied AND
 *   `config.groups` declares body-pattern entries (function values), wire
 *   walks every base rule and injects a pattern-replacing override for it.
 *   This is necessary because tree-sitter only invokes override rule fns
 *   for entries the author put in `config.rules`; unoverridden base rules
 *   would otherwise bypass pattern replacement entirely. Passing `base`
 *   keeps the body-pattern groups mechanism honest for grammars where the
 *   matching positions live in base rules. Pass `enrich(base)` (the same
 *   value handed to `grammar()` as the base arg) so the patterns match
 *   the same evaluated rule bodies tree-sitter will see.
 * @returns A new options object suitable for `grammar()`. Tree-sitter's
 *   own iteration observes the injected hidden-rule entries at its
 *   `Object.keys()` snapshot; content resolves via deferred-content fns
 *   as tree-sitter iterates.
 */
// `B` infers from `base` (the enriched-base grammar), so the config
// literal is contextually typed — and IntelliSense'd — against the
// precise `WireConfig<B>` (typed `$`, per-rule `previous`/`original`).
// No explicit `WireConfig` annotation is needed at the call site. When
// `base` is omitted, `B` defaults to `any` (the loose form, identical to
// the prior `C extends WireConfig<any>` behavior — there is nothing to
// infer grammar precision from).
//
// NOTE on TS2589: routing the literal through the generic `WireConfig<B>`
// is REQUIRED for base-present precision — but at a no-`base` call site
// (where `B` reaches the generic with nothing to pin it) TS may eagerly
// instantiate the precise `TransformsConfig<B>` mapped-type branch and
// report "excessively deep". A call site that pins `B` to a lazy alias —
// an explicit type-arg (`wire<EnrichedGrammar<RustGrammarShape>>(…)` in
// overrides.ts) or a concrete `base` — evaluates that branch lazily and
// stays shallow. The residual no-base artifact is editor-only typecheck
// noise; runtime is unaffected (`config` is aliased to a loose
// `WireConfig<any>` in the body below).
export function wire<B extends GrammarJson = any>(config: WireConfig<B>, base?: B): WiredOpts {
	// Generics are contained to the SIGNATURE so `B` infers from `base`
	// and the literal `config` is contextually checked against
	// `WireConfig<B>`. The BODY operates on the loose runtime shapes wire
	// has always worked on — alias to non-generic internal types ONCE
	// here so the body never instantiates `WireConfig<B>['rules']`
	// generically (which trips TS2589) nor reads `base.grammar` off a
	// generic `B`. The runtime is unchanged; these are the sanctioned
	// boundary casts (see the LOOSE-INTERNAL / NARROW-PUBLIC note above).
	const cfg = config as unknown as WireConfig<any>;
	const baseArg = base as unknown as
		| { grammar?: { rules?: Record<string, RuleFn> }; rules?: Record<string, RuleFn> }
		| undefined;
	const context: WireContext = {
		deposits: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		orphanedSyntheticGroups: new Set(),
		conflictGroups: [],
		refineForms: new Map(),
		groups: cfg.groups,
		polymorphsConfig: cfg.polymorphs,
		renderAs: cfg.renderAs,
		visibleExternals: cfg.visibleExternals,
		expectDiagnostics: cfg.expectDiagnostics,
		expectTestFailures: cfg.expectTestFailures,
		currentRuleKind: null,
		authoredRuleNames: new Set(Object.keys(cfg.rules ?? {}))
	};

	const polymorphs = cfg.polymorphs ?? {};
	const transforms = cfg.transforms ?? {};
	// `outRules` holds rule-authoring FUNCTIONS (tree-sitter invokes each with
	// `$`/`previous` to produce the rule body at grammar-compile time), not
	// `Rule<'evaluate'>` data nodes — see the SittirRuleFn "LOOSE-INTERNAL /
	// NARROW-PUBLIC" note above. The R12 sweep over-annotated this as
	// `Record<string, Rule<'evaluate'>>`, which doesn't structurally overlap
	// with the function-map shape `cfg.rules` actually has.
	const outRules: Record<string, RuleFn> = { ...cfg.rules } as Record<string, RuleFn>;

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
	composeOrSynthesizeTransformParents(outRules, transforms);
	composeOrSynthesizePolymorphParents(outRules, polymorphs, context);
	injectHiddenRulePlaceholders(outRules, polymorphs, context);
	injectTransformHiddenRulePlaceholders(outRules, transforms, context);
	// Body-pattern groups: when `base` is supplied AND the groups config has
	// function-valued entries, scan base rule names and inject a passthrough
	// override for any base rule not already overridden. Tree-sitter calls
	// each override with `previous` (the base body); our passthrough returns
	// `previous` unchanged but then `applyWirePatternReplacement` wraps the
	// passthrough so the body undergoes pattern replacement. Without this,
	// unoverridden base rules bypass replacement entirely.
	// visibleExternals needs the SAME passthrough treatment as body-pattern
	// groups: its SYMBOL→ALIAS rewrite (applyWireVisibleExternalsRewrite,
	// below) only reaches rule fns present in `outRules` — an unoverridden
	// base rule with no entry here never gets wrapped, so a `$._x` reference
	// buried in an un-overridden base rule would silently escape the
	// rewrite (the exact phantom-kind divergence class this file guards
	// against elsewhere).
	if (baseArg && ((cfg.groups && hasBodyPatternGroups(cfg.groups)) || cfg.visibleExternals)) {
		const baseRules = (baseArg.grammar?.rules ?? baseArg.rules ?? {}) as Record<string, RuleFn>;
		for (const baseName of Object.keys(baseRules)) {
			if (baseName in outRules) continue;
			outRules[baseName] = passthroughBaseRuleFn;
		}
	}
	wrapAllRuleFns(outRules, context);
	// Wire-phase pattern find-and-replace: runs after wrapAllRuleFns so
	// each candidate fn executes inside a proper wire context when eagerly
	// evaluated. This is the tree-sitter-runtime path; evaluate.ts has its
	// own post-evaluation pass for the sittir-pipeline path.
	applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context);
	// visibleExternals: SYMBOL→ALIAS rewrite (tree-sitter-CLI-runtime path).
	// evaluate.ts's applyVisibleExternalsRewrite is the sittir-pipeline twin
	// — both MUST produce structurally identical output.
	applyWireVisibleExternalsRewrite(outRules, cfg.visibleExternals);

	// Drain enrich-hoisted clause-group names into syntheticInline so they
	// appear in the grammar's inline: list. Enrich injects _<parent>_optionalN
	// rules directly into base.grammar.rules before wire runs; without
	// inlining, tree-sitter creates LR conflicts for those hidden rules.
	// getEnrichClauseGroups reads the __enrichedClauseGroups__ non-enumerable
	// property that enrich() attaches to the grammar result.
	//
	// (Auto-group-synthesis — `applyAutoGroups` — was retired physically in
	// auto-group-visibility Chunk 3 / PR-M φ2 Phase B. Enrich now hoists every
	// `optional(seq)`/`repeat(seq)`/`repeat1(seq)`: inline-SAFE into a hidden
	// `_<parent>_optional<N>` symbol, inline-UNSAFE into a visible content-alias
	// `alias(<content>, $._<parent>_group<N>)` that link's `mintContentAliasKinds`
	// registers as a real IR kind. The old wire-time pass ran BEFORE link and
	// pre-consumed the very inline-unsafe seqs link must see as inline content.)
	if (baseArg) {
		for (const name of getEnrichClauseGroups(base)) {
			context.syntheticInline.add(name);
		}
		// Visible-group mint SOURCES must not be inlined away — see
		// `WireContext.inlineRemovals` / `getEnrichVisibleGroupSources`.
		for (const name of getEnrichVisibleGroupSources(base)) {
			context.inlineRemovals.add(name);
		}
		// A synthesized clause-hoist name (recorded owner = the parent kind
		// enrich() hoisted it FROM) is orphaned once THIS grammar's own
		// `rules:` config redeclares that owner — the override text could
		// never reference a name that didn't exist until this enrich() call
		// minted it from the base grammar's pre-override shape, so replacing
		// the owner's body necessarily drops the only reference. See
		// `WireContext.orphanedSyntheticGroups`.
		// PR 3 (2026-07-21 union-slot design): a visible-aliased clause-hoist
		// mint (the inline-UNSAFE category — excluded from `syntheticInline`
		// above precisely because we WANT it to stay a distinguishable kind,
		// not get inlined away) can share a structural prefix with its own
		// owning parent rule (e.g. python's `expression_statement`, whose
		// arm 0 is `$.expression` and whose newly-hoisted arm 1
		// `_expression_statement_group1` also starts with `commaSep1($.expression)`
		// — both begin `expression • …`, an unresolved tree-sitter LR
		// conflict without an explicit GLR fork). Proactively register a
		// conflict between the owner and every such mint, mirroring the
		// hand-authored `conflicts: [$.expression_statement,
		// $._expression_statement_tuple]` pattern this codebase already used
		// for the pre-existing variant()-only mint path — but automatic, so
		// it covers every clause-hoist visible-group mint (this widened
		// bare-choice-arm gate included) without per-grammar hand-maintenance.
		// Harmless when the two rules don't actually conflict in a given
		// grammar: tree-sitter's `conflicts:` only enables a GLR fork; it
		// doesn't change accepted language and costs a little parse-table
		// size, not correctness, when unused.
		const inlineSafeNames = getEnrichClauseGroups(base);
		for (const [syntheticName, ownerKind] of getEnrichClauseGroupOwners(base)) {
			if (context.authoredRuleNames.has(ownerKind)) {
				context.orphanedSyntheticGroups.add(syntheticName);
			}
			if (!inlineSafeNames.has(syntheticName) && ownerKind !== syntheticName) {
				const pairKey = [ownerKind, syntheticName].join('\u0000');
				if (!context.conflictGroups.some((g) => g.join('\u0000') === pairKey)) {
					context.conflictGroups.push([ownerKind, syntheticName]);
				}
				// A minted group's own body can ALSO self-conflict — e.g. a
				// shared comma/element shape recurring across sibling rules
				// (python's `_expression_list_group1` vs `assert_statement`'s
				// own `commaSep1` repeat) confuses tree-sitter's LALR merge
				// independent of the owner pairing above. A single-rule
				// `conflicts` entry is tree-sitter's own documented way to
				// request a GLR self-fork for a rule (see its own error
				// resolution list: "Add a conflict for these rules:
				// `<rule>`" with just the one name).
				const selfKey = [syntheticName].join('\u0000');
				if (!context.conflictGroups.some((g) => g.join('\u0000') === selfKey)) {
					context.conflictGroups.push([syntheticName]);
				}
			}
		}
		// Re-run body-pattern replacement so any `groups:` body-pattern can match
		// rule bodies wrapped by the first pass above. Idempotent on already-aliased
		// bodies.
		applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context);
	}

	// Boundary casts to the internal loose (`unknown`-$, mutable-array)
	// callback shapes — same LOOSE-INTERNAL / NARROW-PUBLIC split as `cfg`
	// itself (see the block comment above `wire()`): the public config's
	// `conflicts`/`inline` callbacks are typed against the precise
	// `ShapedSymbols<B>` $ and readonly-array shapes for author ergonomics;
	// `wrapConflictsCallback`/`wrapInlineCallback` are internal machinery
	// that only ever calls them positionally, so the wider internal param
	// types are a safe narrowing-away, not a behavior change.
	const conflicts = wrapConflictsCallback(cfg.conflicts as ConflictsFn | undefined, context);
	const inline = wrapInlineCallback(cfg.inline as DollarFn<unknown[]> | undefined, context);

	// `...cfg` carries `cfg`'s own (narrow, public) `conflicts` field into the
	// inferred object-literal type even though the later spreads unconditionally
	// override it with the internal-shape `conflicts`/`inline` computed above;
	// TS still unions both possible shapes when inferring the literal's type,
	// so an explicit `WiredOpts` boundary cast is needed here (same pattern as
	// `cfg = config as unknown as WireConfig<any>` above).
	const wired = {
		...cfg,
		rules: outRules,
		...(conflicts === undefined ? {} : { conflicts }),
		...(inline === undefined ? {} : { inline })
	} as unknown as WiredOpts;
	Object.defineProperty(wired, '__wireContext__', {
		value: context,
		enumerable: false,
		configurable: true
	});
	return wired;
}

// ---------------------------------------------------------------------------
// wire() helpers
// ---------------------------------------------------------------------------

function composeOrSynthesizePolymorphParents(
	rules: Record<string, RuleFn>,
	polymorphs: PolymorphsConfig,
	context: WireContext
): void {
	for (const [parent, armMap] of Object.entries(polymorphs)) {
		if (!armMap) continue;
		const userFn = rules[parent];
		rules[parent] = buildPolymorphParentFn(parent, armMap, userFn, context);
	}
}

function buildPolymorphParentFn(
	parent: string,
	armMap: Record<string, string>,
	userFn: RuleFn | undefined,
	context: WireContext
): RuleFn {
	const patches: Record<string, unknown> = {};
	for (const [path, suffix] of Object.entries(armMap)) {
		patches[path] = variantPlaceholder(suffix);
	}
	const isHidden = parent.startsWith('_');
	return function wiredPolymorphParent($, original) {
		let base: unknown;
		if (userFn) {
			base = userFn($, original);
		} else if (isHidden && context.deposits.has(parent)) {
			base = context.deposits.get(parent);
		} else {
			base = original;
		}
		return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, patches);
	};
}

function injectHiddenRulePlaceholders(
	rules: Record<string, RuleFn>,
	polymorphs: PolymorphsConfig,
	context: WireContext
): void {
	for (const [parent, armMap] of Object.entries(polymorphs)) {
		if (!armMap) continue;
		for (const suffix of Object.values(armMap)) {
			const hiddenName = polymorphHiddenName(parent, suffix);
			if (hiddenName in rules) continue;
			rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
		}
	}
}

export function polymorphVisibleName(parentKind: string, suffix: string): string {
	const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
	return `${visibleParent}_${suffix}`;
}

export function polymorphHiddenName(parentKind: string, suffix: string): string {
	return `_${polymorphVisibleName(parentKind, suffix)}`;
}

function composeOrSynthesizeTransformParents(rules: Record<string, RuleFn>, transforms: TransformsConfig): void {
	for (const [kind, entry] of Object.entries(transforms)) {
		if (!entry) continue;
		const patchSets = Array.isArray(entry) ? entry : [entry];
		const userFn = rules[kind];
		rules[kind] = buildTransformParentFn(patchSets, userFn);
	}
}

function buildTransformParentFn(patchSets: readonly PatchMap[], userFn: SittirRuleFn | undefined): SittirRuleFn {
	return function wiredTransformParent($, original) {
		const base = userFn ? userFn($, original) : original;
		return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, ...patchSets);
	};
}

function injectTransformHiddenRulePlaceholders(
	rules: Record<string, RuleFn>,
	transforms: TransformsConfig,
	context: WireContext
): void {
	for (const [kind, entry] of Object.entries(transforms)) {
		if (!entry) continue;
		const patchSets = Array.isArray(entry) ? entry : [entry];
		for (const patchMap of patchSets) {
			for (const value of Object.values(patchMap)) {
				registerHiddenRuleForPlaceholder(value, kind, rules, context);
			}
		}
	}
}

function registerHiddenRuleForPlaceholder(
	value: unknown,
	parentKind: string,
	rules: Record<string, RuleFn>,
	context: WireContext
): void {
	if (isFieldPlaceholder(value)) {
		const hiddenName = `_kw_${value.name}`;
		if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
		return;
	}
	if (isVariantPlaceholder(value)) {
		const hiddenName = `_${parentKind}_${value.name}`;
		if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
		return;
	}
	if (isAliasPlaceholder(value)) {
		const hiddenName = `_${value.name}`;
		if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
		return;
	}
}

function makeDeferredContentFn(context: WireContext, hiddenName: string): SittirRuleFn {
	return function deferredHiddenRule(_$, previous) {
		const body = context.deposits.get(hiddenName);
		if (body) return body;
		if (previous !== undefined) return previous;
		const blankFn = (globalThis as { blank?: () => unknown }).blank;
		return blankFn ? blankFn() : { type: 'BLANK' };
	};
}

function wrapAllRuleFns(rules: Record<string, RuleFn>, context: WireContext): void {
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = wrapOneRuleFn(name, fn, context);
	}
}

function wrapOneRuleFn(name: string, fn: RuleFn, context: WireContext): RuleFn {
	return function wiredRuleFn($, previous) {
		const prevContext = currentContext;
		const prevKind = context.currentRuleKind;
		currentContext = context;
		context.currentRuleKind = name;
		try {
			return fn($, previous);
		} finally {
			context.currentRuleKind = prevKind;
			currentContext = prevContext;
		}
	};
}

function wrapConflictsCallback(userConflicts: ConflictsFn | undefined, context: WireContext): ConflictsFn | undefined {
	return buildWiredConflictsFn(userConflicts, context);
}

function wrapInlineCallback(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return buildWiredInlineFn(userInline, context);
}

function buildWiredConflictsFn(userConflicts: ConflictsFn | undefined, context: WireContext): ConflictsFn {
	return function wiredConflicts(this: unknown, $: unknown, previous?: unknown[][]): unknown[][] {
		const base = userConflicts ? userConflicts.call(this, $, previous) : (previous ?? []);
		if (context.conflictGroups.length === 0) return base as unknown[][];
		const symbolized = context.conflictGroups.map((group) => group.map((name) => symbolizeRef($, name)));
		return [...(base as unknown[][]), ...symbolized];
	};
}

function buildWiredInlineFn(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return function wiredInline(this: unknown, $: unknown, previous?: unknown[]): unknown[] {
		let base = userInline ? userInline.call(this, $, previous) : (previous ?? []);
		// Filter OUT visible-group mint sources (see WireContext.inlineRemovals):
		// leaving `_src` in `inline:` makes tree-sitter erase the rule before
		// table construction, vaporizing `alias($._src, $.visible)` — and with
		// it the minted kind's entire parser identity — while the IR still
		// models the kind. Un-inlining keeps the mint real on both sides.
		if (context.inlineRemovals.size > 0) {
			base = (base as unknown[]).filter((entry) => {
				const symbol = entry as { type?: string; name?: string } | null;
				return !(
					symbol &&
					typeof symbol === 'object' &&
					symbol.type === 'SYMBOL' &&
					typeof symbol.name === 'string' &&
					context.inlineRemovals.has(symbol.name)
				);
			});
		}
		if (context.syntheticInline.size === 0) return base as unknown[];
		const existingNames = collectInlineNames(base as unknown[]);
		const appended: unknown[] = [];
		for (const name of context.syntheticInline) {
			if (existingNames.has(name)) continue;
			if (context.inlineRemovals.has(name)) continue;
			appended.push(nativeInlineRef($, name));
		}
		return appended.length === 0 ? (base as unknown[]) : [...(base as unknown[]), ...appended];
	};
}

function collectInlineNames(entries: readonly unknown[]): Set<string> {
	const names = new Set<string>();
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const symbol = entry as { type?: string; name?: string };
		if (symbol.type === 'SYMBOL' && typeof symbol.name === 'string') {
			names.add(symbol.name);
		}
	}
	return names;
}

function nativeInlineRef($: unknown, name: string): unknown {
	const nativeSym = (globalThis as { sym?: (name: string) => unknown }).sym;
	if (typeof nativeSym === 'function') return nativeSym(name);
	return ($ as Record<string, unknown>)[name];
}

function symbolizeRef(_$: unknown, name: string): unknown {
	return { type: 'SYMBOL', name };
}

// ---------------------------------------------------------------------------
// Wire-phase pattern find-and-replace
// ---------------------------------------------------------------------------

function hasBodyPatternGroups(groups: GroupsConfig): boolean {
	for (const value of Object.values(groups)) {
		if (typeof value === 'function') return true;
	}
	return false;
}

/**
 * Passthrough rule fn for base rules that wire couldn't otherwise reach.
 * Returns `previous` unchanged; the pattern-replacement pass wraps this
 * fn so the returned body is structurally walked and substituted.
 */
const passthroughBaseRuleFn: SittirRuleFn = function passthroughBaseRuleFn(_$, previous) {
	return previous;
};

/** Minimal candidate record for wire-phase pattern replacement. */
interface WirePatternCandidate {
	readonly name: string;
	readonly body: RuntimeRule;
	/** When set, every replacement site emits
	 *  `alias($._<name>, $.<aliasAs>)` so tree-sitter produces a visible
	 *  `aliasAs` CST node at each substitution. Set by `groups:` body-
	 *  pattern entries; absent for legacy `_`-prefix candidates. */
	readonly aliasAs?: string;
}

function makeSimpleDollarProxy(): Record<string, unknown> {
	return new Proxy({} as Record<string, unknown>, {
		get(_target, name: string): unknown {
			return { type: 'SYMBOL', name };
		}
	});
}

function isComplexBodyRt(rule: RuntimeRule): boolean {
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	const t = r.type;
	if (typeEq(t, 'SEQ') || typeEq(t, 'CHOICE')) {
		return Array.isArray(r.members) && r.members.length >= 2;
	}
	if (typeEq(t, 'REPEAT') || typeEq(t, 'REPEAT1')) {
		const c = r.content as { type?: string } | undefined;
		if (!c || typeof c.type !== 'string') return false;
		return !typeEq(c.type, 'STRING') && !typeEq(c.type, 'SYMBOL') && !typeEq(c.type, 'PATTERN');
	}
	return false;
}

/**
 * Structural equality for two RuntimeRule bodies. Recursive.
 *
 * A candidate body evaluated in the sittir runtime matches a rule body
 * evaluated in tree-sitter's runtime because both agree on UPPERCASE
 * discriminants — no case reconciliation needed.
 *
 * Edge cases:
 * - PREC/PREC_LEFT/PREC_RIGHT wrappers: sittir's `prec()` helper strips the
 *   wrapper before storing the rule, so they won't appear in sittir-runtime
 *   bodies. Tree-sitter preserves them. We treat them as non-matching (return
 *   false for unknown types) — prec-wrapped patterns are more specific than
 *   the declared body and should NOT be replaced.
 * - FIELD wrappers: name AND content must match. A field carrying the same
 *   content but a different name is a different structural pattern.
 * - ALIAS: not handled — an alias is semantically distinct from its content.
 */
function unwrapOptionalChoiceRt(node: unknown): unknown {
	if (!node || typeof node !== 'object') return node;
	const r = node as { type?: string; members?: unknown[] };
	// Shared detection (same `isChoiceType`/`isBlankType` that auto-groups.ts
	// uses for its `CHOICE[seq, BLANK]` → optional handling), so the two wire
	// passes recognize the tree-sitter-lowered optional form identically.
	if (isChoiceType(r.type) && Array.isArray(r.members) && r.members.length === 2) {
		const blankIdx = r.members.findIndex((m) => isBlankType((m as { type?: string } | undefined)?.type));
		if (blankIdx !== -1) return { type: 'OPTIONAL', content: r.members[1 - blankIdx] };
	}
	return node;
}

function patternBodyEqual(aIn: unknown, bIn: unknown): boolean {
	const a = unwrapOptionalChoiceRt(aIn);
	const b = unwrapOptionalChoiceRt(bIn);
	if (!a || typeof a !== 'object') return a === b;
	if (!b || typeof b !== 'object') return false;
	const ra = a as { type: string; members?: unknown[]; content?: unknown; name?: string; value?: string };
	const rb = b as { type: string; members?: unknown[]; content?: unknown; name?: string; value?: string };
	// Types must match.
	if (ra.type !== rb.type) return false;
	const t = ra.type;
	if (t === 'STRING' || t === 'PATTERN') return ra.value === rb.value;
	if (t === 'SYMBOL') return ra.name === rb.name;
	if (t === 'BLANK') return true; // BLANK is a singleton — type match is sufficient
	if (t === 'SEQ' || t === 'CHOICE') {
		const ma = ra.members;
		const mb = rb.members;
		if (!Array.isArray(ma) || !Array.isArray(mb)) return false;
		if (ma.length !== mb.length) return false;
		return ma.every((m, i) => patternBodyEqual(m, mb[i]));
	}
	if (t === 'OPTIONAL' || t === 'REPEAT' || t === 'REPEAT1') {
		return patternBodyEqual(ra.content, rb.content);
	}
	if (t === 'FIELD') {
		return ra.name === rb.name && patternBodyEqual(ra.content, rb.content);
	}
	if (t === 'ALIAS') {
		// ALIAS nodes carry `named` (bool) and `value` (the visible name string)
		// in addition to `content`. Two aliases are structurally equal when all
		// three match — e.g. `alias($._not_in, 'not in')` vs itself.
		const raa = ra as { type: string; content?: unknown; named?: boolean; value?: string };
		const rba = rb as { type: string; content?: unknown; named?: boolean; value?: string };
		return raa.named === rba.named && raa.value === rba.value && patternBodyEqual(raa.content, rba.content);
	}
	return false;
}

function replaceInBodyRt(rule: unknown, candidates: readonly WirePatternCandidate[]): unknown {
	if (!rule || typeof rule !== 'object') return rule;
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	// Check if THIS node matches any candidate.
	for (const c of candidates) {
		if (patternBodyEqual(rule, c.body)) {
			// Emit a SYMBOL reference in the shape matching the candidate's body.
			// When the candidate has an aliasAs target, wrap the symbol in an
			// ALIAS so tree-sitter emits the visible kind at every match site
			// (otherwise tree-sitter inlines the hidden `_<name>` body and the
			// kind never appears as a CST node).
			if (c.aliasAs !== undefined) {
				return {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: c.name },
					named: true,
					value: c.aliasAs
				};
			}
			return { type: 'SYMBOL', name: c.name };
		}
	}
	// Recurse into children.
	const t = r.type;
	if (t === 'SEQ' || t === 'CHOICE') {
		const members = r.members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const replaced = replaceInBodyRt(m, candidates);
			if (replaced !== m) changed = true;
			return replaced;
		});
		return changed ? { ...r, members: newMembers } : rule;
	}
	if (
		t === 'OPTIONAL' ||
		t === 'REPEAT' ||
		t === 'REPEAT1' ||
		t === 'FIELD' ||
		t === 'PREC' ||
		t === 'PREC_LEFT' ||
		t === 'PREC_RIGHT' ||
		t === 'PREC_DYNAMIC' ||
		t === 'TOKEN'
	) {
		const newContent = replaceInBodyRt(r.content, candidates);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
}

function buildPatternReplacingFn(fn: RuleFn, candidates: readonly WirePatternCandidate[]): RuleFn {
	return function patternReplacingRuleFn($, previous) {
		const result = fn($, previous);
		return replaceInBodyRt(result, candidates);
	};
}

// ---------------------------------------------------------------------------
// visibleExternals — SYMBOL→ALIAS rewrite (tree-sitter-CLI-runtime path)
// ---------------------------------------------------------------------------

function withStringGlobalShim<T>(fn: () => T): T {
	const g = globalThis as Record<string, unknown>;
	const hadString = 'string' in g;
	const previous = g.string;
	if (!hadString) {
		g.string = (value: string) => ({ type: 'STRING', value });
	}
	try {
		return fn();
	} finally {
		if (!hadString) delete g.string;
		else g.string = previous;
	}
}

function rewriteVisibleExternalRefsRt(rule: unknown, hiddenToVisible: ReadonlyMap<string, string>): unknown {
	if (!rule || typeof rule !== 'object') return rule;
	const r = rule as { type: string; members?: unknown[]; content?: unknown; name?: string };
	const t = r.type;
	if (t === 'SYMBOL') {
		const visibleName = hiddenToVisible.get(r.name ?? '');
		if (visibleName === undefined) return rule;
		return { type: 'ALIAS', content: rule, named: true, value: visibleName };
	}
	if (t === 'SEQ' || t === 'CHOICE') {
		const members = r.members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const replaced = rewriteVisibleExternalRefsRt(m, hiddenToVisible);
			if (replaced !== m) changed = true;
			return replaced;
		});
		return changed ? { ...r, members: newMembers } : rule;
	}
	if (
		t === 'OPTIONAL' ||
		t === 'REPEAT' ||
		t === 'REPEAT1' ||
		t === 'FIELD' ||
		t === 'PREC' ||
		t === 'PREC_LEFT' ||
		t === 'PREC_RIGHT' ||
		t === 'PREC_DYNAMIC' ||
		t === 'TOKEN' ||
		t === 'ALIAS'
	) {
		const newContent = rewriteVisibleExternalRefsRt(r.content, hiddenToVisible);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
}

function buildVisibleExternalsRewritingFn(fn: RuleFn, hiddenToVisible: ReadonlyMap<string, string>): RuleFn {
	return function visibleExternalsRewritingRuleFn($, previous) {
		const result = fn($, previous);
		return rewriteVisibleExternalRefsRt(result, hiddenToVisible);
	};
}

function applyWireVisibleExternalsRewrite(
	rules: Record<string, RuleFn>,
	config: VisibleExternalsConfig | undefined
): void {
	if (!config) return;
	const $ = makeSimpleDollarProxy();
	const entries = withStringGlobalShim(() => config($));
	if (!entries) return;
	const hiddenToVisible = new Map<string, string>();
	for (const hiddenName of Object.keys(entries)) {
		hiddenToVisible.set(hiddenName, hiddenName.replace(/^_+/, ''));
	}
	if (hiddenToVisible.size === 0) return;
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = buildVisibleExternalsRewritingFn(fn, hiddenToVisible);
	}
}

function applyWirePatternReplacement(
	rules: Record<string, RuleFn>,
	authoredRuleNames: ReadonlySet<string>,
	groups?: GroupsConfig,
	context?: WireContext
): void {
	const candidates: WirePatternCandidate[] = [];
	const $ = makeSimpleDollarProxy();

	// Legacy auto-detection: any `_`-prefixed rule the author declared in
	// `rules:` is a structural pattern candidate. Maintained for the
	// TypeScript `_ambient_declaration_*` entries that still rely on this
	// path; new patterns should go in `groups:` with a body fn.
	for (const name of authoredRuleNames) {
		if (!name.startsWith('_')) continue;
		const fn = rules[name];
		if (!fn) continue;
		// Eagerly evaluate with a null previous. Rules whose body depends on
		// `original` (transform-based overrides) will likely return undefined,
		// null, or throw — all safely skipped.
		let body: RuntimeRule;
		try {
			const result = fn.call(undefined, $, undefined);
			if (!result || typeof result !== 'object' || typeof (result as { type?: unknown }).type !== 'string') continue;
			body = result as RuntimeRule;
		} catch {
			continue;
		}
		if (!isComplexBodyRt(body)) continue;
		candidates.push({ name, body });
	}

	// New body-pattern groups path: each `groups:` entry whose value is a
	// function is a body-pattern candidate. The KEY is the visible kind
	// name; internally we synthesize a hidden `_<key>` rule with the body,
	// and emit `alias($._<key>, $.<key>)` at every match site so tree-
	// sitter exposes the visible kind as a CST node.
	if (groups) {
		for (const [key, value] of Object.entries(groups)) {
			if (typeof value !== 'function') continue;
			if (key.startsWith('_')) {
				throw new Error(
					`groups['${key}']: body-pattern keys must be visible kind names (no leading underscore); codegen will create '_${key}' internally`
				);
			}
			const hiddenName = `_${key}`;
			let body: RuntimeRule;
			try {
				const result = (value as RuleFn).call(undefined, $, undefined);
				if (!result || typeof result !== 'object' || typeof (result as { type?: unknown }).type !== 'string') {
					throw new Error(`groups['${key}']: body fn did not return a rule object`);
				}
				body = result as RuntimeRule;
			} catch (e) {
				throw new Error(`groups['${key}']: failed to evaluate body fn: ${(e as Error).message}`);
			}
			if (!isComplexBodyRt(body)) {
				throw new Error(
					`groups['${key}']: body is not a complex structural pattern (need SEQ ≥2, CHOICE ≥2, or REPEAT with non-trivial content)`
				);
			}
			candidates.push({ name: hiddenName, body, aliasAs: key });
			// Register the hidden rule body so tree-sitter has a definition
			// for the symbol the alias() wrappers will reference. Wrap via
			// wrapOneRuleFn directly (this fn runs after wrapAllRuleFns) so
			// the body fn evaluates inside a proper wire context.
			rules[hiddenName] = context ? wrapOneRuleFn(hiddenName, value as RuleFn, context) : (value as RuleFn);
		}
	}

	if (candidates.length === 0) return;

	const candidateNames = new Set(candidates.map((c) => c.name));
	for (const [name, fn] of Object.entries(rules)) {
		if (candidateNames.has(name)) continue;
		rules[name] = buildPatternReplacingFn(fn, candidates);
	}
}
