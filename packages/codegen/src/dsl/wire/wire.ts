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
import { typeEq, isChoiceType, isBlankType } from '../runtime-shapes.ts';
import { variant as variantPlaceholder } from '../primitives/variant.ts';
import { transform as transformFn } from '../transform/transform.ts';
import { isFieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import { isVariantPlaceholder } from '../primitives/variant.ts';
import { applyAutoGroups } from './auto-groups.ts';
import type { Rule } from '../../compiler/rule.ts';
// Phase-2: tuple-precise base-grammar constraint + per-rule transform path keys.
import type { GrammarJson, GrammarNode, Sym, AuthoringRule } from '../../grammar-shapes/grammar-json.ts';
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
export type RenderAsConfig = (
	$: Record<string, unknown>
) => Record<string, unknown>;

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

let currentContext: WireContext | null = null;

/** Read the active wire context, or null if no `wire()`-wrapped rule
 *  fn is currently executing. DSL helpers use this to decide whether
 *  to route state into the wire closure or into the legacy module
 *  accumulator in `synthetic-rules.ts`. */
export function getCurrentWireContext(): WireContext | null {
	return currentContext;
}

/**
 * Register a hidden-rule body against the active wire context. Returns
 * `true` when the context absorbed the call, `false` when there is no
 * active context (caller falls back to the legacy accumulator).
 */
export function wireRegisterSyntheticRule(name: string, content: RuntimeRule): boolean {
	if (!currentContext) return false;
	currentContext.deposits.set(name, content);
	return true;
}

/**
 * Register a synthesized `_kw_*` helper for automatic inlining.
 *
 * @remarks
 * Only wire-authored helpers participate. If the grammar author declared
 * the rule explicitly in `config.rules`, they own its `inline:` policy.
 */
export function wireRegisterSyntheticInline(name: string): boolean {
	if (!currentContext) return false;
	if (currentContext.authoredRuleNames.has(name)) return false;
	currentContext.syntheticInline.add(name);
	return true;
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
	if (!currentContext) return false;
	const exists = currentContext.polymorphVariants.some((v) => v.parent === parent && v.child === child);
	if (!exists) {
		currentContext.polymorphVariants.push({ parent, child });
	}
	return true;
}

/**
 * Register a conflict group against the active wire context. Dedupes
 * by exact group membership (same names in same order).
 */
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
	if (!currentContext) return false;
	currentContext.refineForms.set(kind, forms);
	return true;
}

/** Current rule kind on the active wire context, or null when inactive. */
export function wireGetCurrentRuleKind(): string | null {
	return currentContext?.currentRuleKind ?? null;
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
	fn: (ctx: WireContext) => T
): { result: T; ctx: WireContext } {
	const ctx: WireContext = {
		deposits: new Map(),
		syntheticInline: new Set(),
		polymorphVariants: [],
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
export type TransformsConfig<Base extends GrammarJson = GrammarJson> = [GrammarNode] extends [Base['rules'][keyof Base['rules']]]
	? // Loose default (`Base = GrammarJson`, rule values are the open
		// `GrammarNode` union): use the plain `PatchMap` form. Mapping
		// `PathKey<…>` over the OPEN union recurses unboundedly (TS2589); the
		// per-rule precise form is only meaningful — and only safe — when
		// `Base` is a CONCRETE `as const` schema (tuple rule bodies). The
		// internal pipeline always sees this loose form.
		Partial<Record<BaseKind<Base>, PatchMap | PatchMap[]>>
	: Base extends { readonly rules: infer R }
		? {
				// Concrete `Base` (e.g. `RustGrammarShape`): per rule K, keys are
				// segment-1-precise path strings. We derive them from the RAW node
				// (`FastKeys` = PathKey<R[K]>) rather than the post-Enrich shape:
				// `PathKey` only consumes the FIRST segment (`TopLevelKeys`), and
				// enrich wraps top-level members IN PLACE (never adds/removes one),
				// so `PathKey<EnrichRule<X>> ≡ PathKey<X>` (proven in
				// wire-transforms.test-d.ts). FastKeys is therefore LOSSLESS for
				// keys and avoids instantiating EnrichRule over the loose union
				// (which is the TS2589 source). Array form = multi-patchset rules.
				readonly [K in keyof R]?: R[K] extends GrammarNode
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
 * index-signature leak makes `$.x: SymbolRule | undefined` and breaks
 * composition (`undefined ⊄ AuthoringRule`) in overrides.ts authoring.
 */
export type ShapedSymbols<B extends GrammarJson> = {
	readonly [R in keyof B['rules'] & string]: Sym<R>;
} & {
	// Permissive fallback for alias-target / synthesized names not in the base
	// grammar.json (e.g. `$.wildcard_pattern`). Known rules resolve via the
	// mapped member above (precise `Sym<R>`, no `undefined`); only unknown names
	// hit this index.
	readonly [name: string]: Sym<string>;
};

export type WireConfig< B extends GrammarJson, NewRules extends string = string> = Omit<Grammar<NewRules, keyof B['rules'] & string>, 'rules' | 'conflicts'> & {
	/**
	 * Conflict sets — same clean-`$` typing as `rules`/`groups` (`ShapedSymbols<B>`,
	 * no `undefined` leak). `previous` is the base grammar's conflict list.
	 */
	readonly conflicts?: (
		$: ShapedSymbols<B>,
		previous: readonly (readonly AuthoringRule[])[]
	) => readonly (readonly AuthoringRule[])[];
	/**
	 * Rule bodies — clean-`$` builders. `previous`/`original` is typed PER RULE as
	 * `B['rules'][K]` directly — the input rule's exact shape, preserved not
	 * flattened. (`B` here is the ALREADY-ENRICHED schema from `enrich()`'s typed
	 * return, so `B['rules'][K]` is the post-enrich shape; no re-application of
	 * `EnrichRule`.) Keyed over the schema's CONCRETE rule names (mapping over
	 * `NewRules` would absorb to `string` and lose per-key precision). Loose
	 * `=> unknown` return accepts sittir DSL outputs.
	 */
	readonly rules?: {
		readonly [K in keyof B['rules'] & string]?: (
			$: ShapedSymbols<B>,
			previous: B['rules'][K]
		) => unknown;
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
		Record<string, Record<string, string> | (($: ShapedSymbols<B>, previous?: GrammarNode) => unknown)>
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
export function wire<B extends GrammarJson = any> (
	config: WireConfig<B>,
	base?: B
): WiredOpts {
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
		polymorphVariants: [],
		conflictGroups: [],
		refineForms: new Map(),
		groups: cfg.groups,
		polymorphsConfig: cfg.polymorphs,
		renderAs: cfg.renderAs,
		currentRuleKind: null,
		authoredRuleNames: new Set(Object.keys(cfg.rules ?? {}))
	};

	const polymorphs = cfg.polymorphs ?? {};
	const transforms = cfg.transforms ?? {};
	const outRules: Record<string, Rule> = { ...cfg.rules } as Record<string, Rule>;

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
	if (baseArg && cfg.groups && hasBodyPatternGroups(cfg.groups)) {
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

	// Auto-group-synthesis: SYNTHESIS-ONLY. Creates hidden helper rules
	// for `optional(seq(...))` / `repeat(seq(...))` / `repeat1(seq(...))`
	// shapes and rewrites the parent's content to a SYMBOL ref. Runs AFTER
	// `applyWirePatternReplacement` so authored body-pattern `groups:`
	// have had their chance to reshape rule bodies; auto-synth also skips
	// any kind the author opted into via `transforms:`, `polymorphs:`, or
	// path-mode `groups:` (see `collectAuthoredSynthesisKinds`) so the
	// path-based machinery sees the rule body the author wrote.
	//
	// NOTE: this pass does NOT touch `separator` / `trailing` / `leading`
	// metadata or otherwise reshape Rule objects beyond the
	// optional/repeat → SYMBOL replacement. Decomposition (separator-lift,
	// attribute stamping) is a separate concern that belongs in
	// link/evaluate where it can operate on sittir's private rule-tree
	// copy without affecting tree-sitter's view.
	if (baseArg) {
		const authoredSynthesisKinds = collectAuthoredSynthesisKinds(
			transforms,
			polymorphs,
			cfg.groups
		);
		// DISABLED for PR0 close-out: activation introduces a downstream regression —
		// sittir's codegen pipeline (link → node-model → factories) does not yet
		// consult `context.syntheticInline` when emitting slots for synthesized
		// hidden kinds. Reader expects child nodes for `_<parent>_repeat<N>` that
		// tree-sitter inlined away → "repeated slot requires at least one value"
		// errors + rust RT 134→103 / cov 178→164 regression.
		//
		// Re-enabled PR2 Task 3.B5 — the new template emitter (fb889165)
		// consumes node.renderRule (RenderRule shape) which carries leaf
		// attributes, so synthesized hidden helpers integrate naturally
		// via the standard inline-handling path.
		applyAutoGroups(
			baseArg as Parameters<typeof applyAutoGroups>[0],
			outRules,
			context,
			authoredSynthesisKinds
		);
		// Re-run body-pattern replacement AFTER applyAutoGroups: the optional/
		// repeat helpers it synthesizes (e.g. `_parameters_optional1`) are created
		// after the first pass (above) wrapped the original rules, so the
		// param-element they now carry (e.g. rust `attributed_parameter` inside
		// `_parameters_optional1`) would otherwise never be matched and aliased
		// to its visible kind. The pass is idempotent on already-aliased bodies.
		applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context);
	}

	const conflicts = wrapConflictsCallback(cfg.conflicts, context);
	const inline = wrapInlineCallback(cfg.inline, context);

	const wired: WiredOpts = {
		...cfg,
		rules: outRules,
		...(conflicts === undefined ? {} : { conflicts }),
		...(inline === undefined ? {} : { inline })
	};
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

/**
 * Collect the set of rule kinds the author opted into the structured
 * authoring pipeline (`transforms:`, `polymorphs:`, or path-mode `groups:`).
 * `applyAutoGroups` skips these so the rule tree stays in the shape the
 * path-based machinery (`transform()`, polymorph splits, group lifts)
 * expects. Body-pattern `groups:` entries do NOT contribute — their keys
 * are NEW visible kind names, not existing base rules.
 */
function collectAuthoredSynthesisKinds(
	transforms: TransformsConfig,
	polymorphs: PolymorphsConfig,
	groups: GroupsConfig | undefined
): ReadonlySet<string> {
	const kinds = new Set<string>();
	for (const k of Object.keys(transforms)) kinds.add(k);
	for (const k of Object.keys(polymorphs)) kinds.add(k);
	if (groups) {
		for (const [k, v] of Object.entries(groups)) {
			// Body-pattern entries (function values) introduce a NEW visible
			// kind; they do NOT name an existing base rule that auto-groups
			// might mutate. Only path-mode entries (object values) skip.
			if (typeof v === 'function') continue;
			kinds.add(k);
		}
	}
	return kinds;
}

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
	context: WireContext
): void {
	for (const [parent, armMap] of Object.entries(polymorphs)) {
		if (!armMap) continue;
		const userFn = rules[parent];
		rules[parent] = buildPolymorphParentFn(parent, armMap, userFn, context);
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
	const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
	return `${visibleParent}_${suffix}`;
}

/** Hidden rule name for a polymorph variant — underscore-prefixed visible form. */
export function polymorphHiddenName(parentKind: string, suffix: string): string {
	return `_${polymorphVisibleName(parentKind, suffix)}`;
}

/**
 * For each transforms entry, wrap (or synthesize) its rule fn to apply
 * the declared patch-maps via `transform(original, ...patchSets)`. If
 * the author already has a `rules:` entry for the same kind, compose:
 * user fn runs first, transform patches apply on its output.
 */
function composeOrSynthesizeTransformParents(rules: Record<string, RuleFn>, transforms: TransformsConfig): void {
	for (const [kind, entry] of Object.entries(transforms)) {
		if (!entry) continue;
		const patchSets = Array.isArray(entry) ? entry : [entry];
		const userFn = rules[kind];
		rules[kind] = buildTransformParentFn(patchSets, userFn);
	}
}

/**
 * Build a rule fn for a transforms entry. Invokes the user-supplied
 * fn first (if present), then applies each patch-map sequentially via
 * `transform(original, ...patchSets)`. Matches `transform()`'s
 * rest-parameter signature so multi-patch-set rules behave exactly as
 * they did when the call was written inline in the rule body.
 */
function buildTransformParentFn(patchSets: readonly PatchMap[], userFn: SittirRuleFn | undefined): SittirRuleFn {
	return function wiredTransformParent($, original) {
		const base = userFn ? userFn($, original) : original;
		return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, ...patchSets);
	};
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
function makeDeferredContentFn(context: WireContext, hiddenName: string): SittirRuleFn {
	return function deferredHiddenRule(_$, previous) {
		const body = context.deposits.get(hiddenName);
		if (body) return body;
		if (previous !== undefined) return previous;
		const blankFn = (globalThis as { blank?: () => unknown }).blank;
		return blankFn ? blankFn() : { type: 'BLANK' };
	};
}

/**
 * Wrap every rule fn in the outgoing rules bag so the wire context is
 * active (and `currentRuleKind` set) while the fn runs. Saves and
 * restores both values so nested / re-entrant grammar calls don't leak
 * state into each other.
 */
function wrapAllRuleFns(rules: Record<string, RuleFn>, context: WireContext): void {
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = wrapOneRuleFn(name, fn, context);
	}
}

/**
 * Wrap a single rule fn. Captures the caller's previous context +
 * currentRuleKind, installs this context, runs the fn, restores.
 */
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
function wrapConflictsCallback(userConflicts: ConflictsFn | undefined, context: WireContext): ConflictsFn | undefined {
	return buildWiredConflictsFn(userConflicts, context);
}

/**
 * Wrap the user's `inline` callback so synthesized `_kw_*` helpers drain
 * into the returned inline list after rule evaluation deposits them.
 *
 * @remarks
 * Tree-sitter evaluates metadata callbacks after rules, so the set is
 * complete by the time this runs. `_kw_*` helpers are leaf token rules,
 * which satisfies tree-sitter's inline restrictions.
 */
function wrapInlineCallback(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return buildWiredInlineFn(userInline, context);
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
function buildWiredConflictsFn(userConflicts: ConflictsFn | undefined, context: WireContext): ConflictsFn {
	return function wiredConflicts(this: unknown, $: unknown, previous?: unknown[][]): unknown[][] {
		const base = userConflicts ? userConflicts.call(this, $, previous) : (previous ?? []);
		if (context.conflictGroups.length === 0) return base as unknown[][];
		const symbolized = context.conflictGroups.map((group) => group.map((name) => symbolizeRef($, name)));
		return [...(base as unknown[][]), ...symbolized];
	};
}

/**
 * Build the wired inline callback that appends synthesized keyword-helper
 * names to the grammar's inline list.
 *
 * @remarks
 * Name-based dedupe matters here for the same reason as `appendDedup` in
 * evaluate.ts: every `$._kw_x` lookup produces a fresh symbol object.
 */
function buildWiredInlineFn(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return function wiredInline(this: unknown, $: unknown, previous?: unknown[]): unknown[] {
		const base = userInline ? userInline.call(this, $, previous) : (previous ?? []);
		if (context.syntheticInline.size === 0) return base as unknown[];
		const existingNames = collectInlineNames(base as unknown[]);
		const appended: unknown[] = [];
		for (const name of context.syntheticInline) {
			if (existingNames.has(name)) continue;
			appended.push(nativeInlineRef($, name));
		}
		return appended.length === 0 ? (base as unknown[]) : [...(base as unknown[]), ...appended];
	};
}

/**
 * Extract rule names from an `inline:` callback result using the same
 * name semantics tree-sitter stores in the final grammar.
 */
function collectInlineNames(entries: readonly unknown[]): Set<string> {
	const names = new Set<string>();
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const symbol = entry as { type?: string; name?: string };
		if ((symbol.type === 'symbol' || symbol.type === 'SYMBOL') && typeof symbol.name === 'string') {
			names.add(symbol.name);
		}
	}
	return names;
}

/**
 * Resolve an inline entry through the runtime's native symbol constructor.
 *
 * @remarks
 * Sittir's evaluator injects `symbol(name)` as part of the baseline DSL
 * globals; tree-sitter metadata callbacks always receive the `$` proxy, so
 * falling back to `$[name]` keeps the callback native-shaped there too.
 */
function nativeInlineRef($: unknown, name: string): unknown {
	const nativeSymbol = (globalThis as { symbol?: (name: string) => unknown }).symbol;
	if (typeof nativeSymbol === 'function') return nativeSymbol(name);
	return ($ as Record<string, unknown>)[name];
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
	return { type: 'SYMBOL', name };
}

// ---------------------------------------------------------------------------
// Wire-phase pattern find-and-replace
// ---------------------------------------------------------------------------

/** True when any value in `groups` is a function (body-pattern entry). */
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
	/** True when the body type uses uppercase (tree-sitter CLI runtime). */
	readonly uppercase: boolean;
	/** When set, every replacement site emits
	 *  `alias($._<name>, $.<aliasAs>)` so tree-sitter produces a visible
	 *  `aliasAs` CST node at each substitution. Set by `groups:` body-
	 *  pattern entries; absent for legacy `_`-prefix candidates. */
	readonly aliasAs?: string;
}

/**
 * Build a minimal `$` proxy that returns `{ type: 'SYMBOL', name }` for any
 * property lookup. Used to eagerly evaluate pattern-candidate rule fns so we
 * can inspect their bodies without requiring the full sittir evaluate pipeline.
 *
 * The proxy works in both the sittir runtime (where `createProxy` would emit
 * lowercase `{ type: 'symbol', name }`) and in tree-sitter's CLI runtime
 * (where `$.<name>` normally returns a CLI-native object). We pass an explicit
 * uppercase SYMBOL so that subsequent `typeEq()` comparisons are shape-agnostic.
 * Eagerly evaluated bodies are only compared structurally — they don't enter
 * the grammar itself — so the uppercase/lowercase mismatch is harmless here.
 */
function makeSimpleDollarProxy(): Record<string, unknown> {
	return new Proxy({} as Record<string, unknown>, {
		get(_target, name: string): unknown {
			return { type: 'SYMBOL', name };
		}
	});
}

/**
 * Returns true when a RuntimeRule body is complex enough to be a meaningful
 * structural pattern. Excludes trivial single-terminal bodies.
 *
 * Uses `typeEq` for dual-case awareness (sittir lowercase ↔ tree-sitter
 * uppercase). Mirrors the `isComplexBody` check in evaluate.ts but operates
 * on RuntimeRule (unknown shape) rather than the typed sittir Rule.
 *
 * Exclusions:
 * - Single STRING / string literal → would match every identical literal
 * - Single SYMBOL reference → would match every reference to that rule
 * - Single PATTERN → would match every regex of the same value
 * - REPEAT/REPEAT1 wrapping a trivial STRING or SYMBOL (e.g. `repeat('x')`)
 *
 * Included:
 * - SEQ with ≥2 members (`_wildcard_pattern: ($) => '_'` is a STRING, excluded)
 * - CHOICE with ≥2 members
 * - REPEAT/REPEAT1 wrapping a non-trivial content node
 */
function isComplexBodyRt(rule: RuntimeRule): boolean {
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	const t = r.type;
	if (typeEq(t, 'seq') || typeEq(t, 'choice')) {
		return Array.isArray(r.members) && r.members.length >= 2;
	}
	if (typeEq(t, 'repeat') || typeEq(t, 'repeat1')) {
		const c = r.content as { type?: string } | undefined;
		if (!c || typeof c.type !== 'string') return false;
		return !typeEq(c.type, 'string') && !typeEq(c.type, 'symbol') && !typeEq(c.type, 'pattern');
	}
	return false;
}

/**
 * Structural equality for two RuntimeRule bodies. Recursive.
 *
 * Uses `typeEq` for dual-case awareness so a candidate body evaluated in the
 * sittir runtime (lowercase) can still match a rule body evaluated in
 * tree-sitter's runtime (uppercase), or vice versa.
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
/**
 * Normalize tree-sitter's `choice(x, BLANK)` to `optional(x)` so body-pattern
 * matching works on the wire/tree-sitter-CLI path, where the IR's later
 * `choice(x,BLANK)→optional(x)` normalization hasn't run yet. Without this,
 * an authored body fn that writes `optional($.x)` never matches the raw base
 * grammar's `choice($.x, BLANK)` form, so the alias-to-visible-kind never
 * fires (e.g. rust `attributed_parameter` stayed a phantom IR-only kind).
 */
function unwrapOptionalChoiceRt(node: unknown): unknown {
	if (!node || typeof node !== 'object') return node;
	const r = node as { type?: string; members?: unknown[] };
	// Shared dual-case detection (same `isChoiceType`/`isBlankType` that
	// auto-groups.ts uses for its `CHOICE[seq, BLANK]` → optional handling),
	// so the two wire passes recognize the tree-sitter-lowered optional form
	// identically.
	if (isChoiceType(r.type) && Array.isArray(r.members) && r.members.length === 2) {
		const blankIdx = r.members.findIndex((m) => isBlankType((m as { type?: string } | undefined)?.type));
		if (blankIdx !== -1) return { type: 'optional', content: r.members[1 - blankIdx] };
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
	// Types must match (dual-case: 'seq' == 'SEQ')
	if (!typeEq(ra.type, rb.type.toLowerCase())) return false;
	const t = ra.type.toLowerCase();
	if (t === 'string' || t === 'pattern') return ra.value === rb.value;
	if (t === 'symbol') return ra.name === rb.name;
	if (t === 'blank') return true; // BLANK is a singleton — type match is sufficient
	if (t === 'seq' || t === 'choice') {
		const ma = ra.members;
		const mb = rb.members;
		if (!Array.isArray(ma) || !Array.isArray(mb)) return false;
		if (ma.length !== mb.length) return false;
		return ma.every((m, i) => patternBodyEqual(m, mb[i]));
	}
	if (t === 'optional' || t === 'repeat' || t === 'repeat1') {
		return patternBodyEqual(ra.content, rb.content);
	}
	if (t === 'field') {
		return ra.name === rb.name && patternBodyEqual(ra.content, rb.content);
	}
	if (t === 'alias') {
		// ALIAS nodes carry `named` (bool) and `value` (the visible name string)
		// in addition to `content`. Two aliases are structurally equal when all
		// three match — e.g. `alias($._not_in, 'not in')` vs itself.
		const raa = ra as { type: string; content?: unknown; named?: boolean; value?: string };
		const rba = rb as { type: string; content?: unknown; named?: boolean; value?: string };
		return raa.named === rba.named && raa.value === rba.value && patternBodyEqual(raa.content, rba.content);
	}
	return false;
}

/**
 * Recursively walk a rule body and replace any sub-tree that structurally
 * matches a pattern candidate with a SYMBOL reference. Returns the original
 * object reference when nothing changed (cheap change-detection for the caller).
 *
 * @param rule - The rule body to search (RuntimeRule, any shape).
 * @param candidates - The list of detected pattern candidates.
 */
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
				return c.uppercase
					? {
							type: 'ALIAS',
							content: { type: 'SYMBOL', name: c.name },
							named: true,
							value: c.aliasAs
						}
					: {
							type: 'alias',
							content: { type: 'symbol', name: c.name, hidden: true },
							named: true,
							value: c.aliasAs
						};
			}
			return c.uppercase ? { type: 'SYMBOL', name: c.name } : { type: 'symbol', name: c.name, hidden: true };
		}
	}
	// Recurse into children.
	const t = r.type.toLowerCase();
	if (t === 'seq' || t === 'choice') {
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
	if (t === 'optional' || t === 'repeat' || t === 'repeat1' || t === 'field' || t === 'prec' || t === 'prec_left' || t === 'prec_right' || t === 'prec_dynamic' || t === 'token') {
		const newContent = replaceInBodyRt(r.content, candidates);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
}

/**
 * Wrap a rule fn so its return value has matching pattern sub-trees replaced.
 */
function buildPatternReplacingFn(fn: RuleFn, candidates: readonly WirePatternCandidate[]): RuleFn {
	return function patternReplacingRuleFn($, previous) {
		const result = fn($, previous);
		return replaceInBodyRt(result, candidates);
	};
}

/**
 * Detect author-declared pattern rules and wrap all non-pattern rule fns so
 * their outputs have matching sub-trees replaced with SYMBOL references.
 *
 * This is the tree-sitter-runtime counterpart of evaluate.ts's
 * `applyPatternReplacement`. Whereas evaluate.ts can run a post-evaluation
 * pass over already-computed Rule objects, wire.ts must wrap rule fns because
 * tree-sitter evaluates them lazily one by one.
 *
 * A candidate is an authored `_`-prefixed rule in `outRules` whose eagerly-
 * evaluated body is complex (SEQ ≥2, CHOICE ≥2, or REPEAT with non-trivial
 * content). We try-evaluate each fn with a synthetic `$` proxy and `previous`
 * = undefined; rules that depend on `original` (transform-based fns) will
 * return undefined or throw, and are safely skipped.
 *
 * Note: evaluate.ts's post-evaluation `applyPatternReplacement` pass already
 * handles the sittir-pipeline path (after all rule fns have run). This wire.ts
 * pass handles the tree-sitter-CLI path, where evaluate.ts does not run.
 */
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
		// Detect whether the body uses uppercase types (tree-sitter CLI) or
		// lowercase (sittir). The proxy always returns SYMBOL (uppercase), so
		// sub-nodes will be SYMBOL. Top-level seq/choice/repeat type case
		// reflects which runtime's DSL globals produced them.
		const uppercase = body.type === body.type.toUpperCase();
		candidates.push({ name, body, uppercase });
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
			const uppercase = body.type === body.type.toUpperCase();
			candidates.push({ name: hiddenName, body, uppercase, aliasAs: key });
			// Register the hidden rule body so tree-sitter has a definition
			// for the symbol the alias() wrappers will reference. Wrap via
			// wrapOneRuleFn directly (this fn runs after wrapAllRuleFns) so
			// the body fn evaluates inside a proper wire context.
			rules[hiddenName] = context
				? wrapOneRuleFn(hiddenName, value as RuleFn, context)
				: (value as RuleFn);
		}
	}

	if (candidates.length === 0) return;

	const candidateNames = new Set(candidates.map((c) => c.name));
	for (const [name, fn] of Object.entries(rules)) {
		if (candidateNames.has(name)) continue;
		rules[name] = buildPatternReplacingFn(fn, candidates);
	}
}
