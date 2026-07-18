/**
 * compiler/types.ts — compiler pipeline output contracts.
 *
 * Each pipeline phase produces a typed container; this file collects
 * them.
 *
 * - Evaluate  produces {@link RawGrammar}.
 * - Link      produces {@link LinkedGrammar} plus a {@link DerivationLog}.
 * - Normalize produces {@link NormalizedGrammar}.
 * - Simplify  (a sub-stage of Normalize) produces {@link SimplifiedGrammar}.
 * - Assemble  produces {@link NodeMap}.
 *
 * Diagnostic / suggester-input types live here too ({@link DerivationLog}
 * and its entry types, {@link IncludeFilter}) because they flow between
 * Link and the suggester emitter, not through the rule tree itself.
 *
 * The Rule model (Rule union + type guards + SymbolRef) stays in
 * `./rule.ts`. The AssembledNode hierarchy currently stays in `rule.ts`
 * too; splitting it into `./node-map.ts` is a later step.
 */

import type { AnyRule, PhaseName, Rule, RenderRule, SimplifiedRule, RuleId, SymbolRef } from '../types/rule.ts';
import type { AssembledNode, AssembledNonterminal } from './model/node-map.ts';
import type { SCCAnalysis } from './scc.ts';

// ExternalRole lives in the IR type layer (R11) — re-exported here so
// existing compiler-side importers keep working. (R12/decision-7 V2 Task 2:
// PolymorphVariant, formerly re-exported alongside it, is deleted.)
import type { ExternalRole } from '../types/ir.ts';
export type { ExternalRole };

// ---------------------------------------------------------------------------
// Evaluate rule occurrence identity and classification
// ---------------------------------------------------------------------------

/**
 * (debt: source-homonym resolution, decision 6 — STOP, NOT migrated) Decision
 * 6 asks for `RuleProvenance`'s three values to fold into `RuleMetadataShape`'s
 * unified `author` field ('grammar-authored'→'grammar',
 * 'override-authored-or-replaced'→'override', 'evaluate-synthesized'→
 * 'evaluate'). That migration is NOT done here: `compiler/generate.ts`'s
 * `collectEvaluateSynthesizedKinds` reads
 * `RuleCatalogEntry.provenance === 'evaluate-synthesized'` and BRANCHES ON IT
 * to decide which kinds get factory/wrap emission skipped
 * (`emitters/shared.ts`'s `synthesizedKinds?.has(kind)` skip-gate) — a
 * genuine compiler-behavior read. `generate.ts` is not a sanctioned reader of
 * the opaque `RuleMetadata` bag (sanctioned set: dsl/enrich, dsl/wire incl.
 * transform machinery, diagnostics-emission code — see
 * `dsl/rule-metadata.ts`'s header). Moving this fact into `metadata.author`
 * would force that read through the restricted `readRuleMetadata` from a
 * non-sanctioned compiler file, which is exactly the doctrine violation
 * decision 3 forbids. Per decision 6's own instruction ("if a compiler-side
 * consumer BRANCHES ON IT for behavior, STOP and report"): `RuleProvenance`
 * stays a separate, already-well-layered, non-opaque, structurally-typed
 * field on `RuleCatalogEntry` (set once at rule-catalog construction time,
 * never stamped-then-reread) — it is a DIFFERENT, correctly-single-sourced
 * mechanism from the `metadata.source` / `FieldRule.source` / `SymbolRule.
 * source` homonym family decision 6 actually targets (see this research
 * doc's §1b table, which already marks "Rule catalog/provenance" as
 * "single" — not one of §5.4's five broken homonyms).
 */
export type RuleProvenance = 'grammar-authored' | 'override-authored-or-replaced' | 'evaluate-synthesized';

export type RulePathSegment =
	| { readonly edge: 'content' }
	| { readonly edge: 'members'; readonly index: number }
	| { readonly edge: 'forms'; readonly index: number };

export interface RuleCatalogEntry {
	readonly id: RuleId;
	readonly ownerKind: string;
	readonly ruleType: AnyRule['type'];
	readonly parentId?: RuleId;
	readonly path: readonly RulePathSegment[];
	readonly childIds: readonly RuleId[];
	readonly provenance: RuleProvenance;
}

export interface RuleClassification {
	readonly ruleId: RuleId;
	readonly kind: 'terminal' | 'nonterminal';
	readonly forcedBy?: 'intrinsic' | 'field' | 'named-alias';
	readonly edgeName?: string;
	readonly cstSurface?: 'named' | 'anonymous';
}

export interface RuleCatalog {
	readonly byId: ReadonlyMap<RuleId, RuleCatalogEntry>;
	readonly rootsByKind: ReadonlyMap<string, RuleId>;
	readonly classificationById: ReadonlyMap<RuleId, RuleClassification>;
}

/**
 * Where a kind/field exists across the pipeline. Per KindID runtime
 * migration design (2026-04-30): describes ontology / existence, kept
 * separate from `KindUseFlag` which describes operations.
 */
export const KindPresenceFlag = {
	None: 0,
	/** Rule appears in `grammar.js` (codegen rule catalog). */
	TSGrammar: 1 << 0,
	/** Kind appears in `node-types.json`. */
	TSNodeTypes: 1 << 1,
	/** Kind has a parser symbol — IDs come from `parser.c` internal metadata. */
	TSInternals: 1 << 2
} as const;
export type KindPresenceFlag = number;

/**
 * What sittir can do with a kind. Behavior-based; complements
 * `KindPresenceFlag`'s file-based / existence-based view.
 */
const KindUseFlag = {
	None: 0,
	/** Sittir can ingest/hydrate the kind from parsed runtime nodes. */
	Readable: 1 << 0,
	/** Sittir can produce/build it from factories or `.from()`. */
	Buildable: 1 << 1,
	/** Sittir can render/dispatch it. */
	Renderable: 1 << 2
} as const;
type KindUseFlag = number;

/**
 * Parser-origin metadata for a kind. Derived from the C symbol name.
 * `parserName` is the prefix-stripped form (the canonical join term);
 * `symbolName` is the lossy `ts_symbol_names[]` label, kept for
 * diagnostics only.
 */
export interface KindParserMetadata {
	readonly cSymbol: string;
	readonly parserName: string;
	readonly symbolName?: string;
	readonly anon: boolean;
	readonly aux: boolean;
	readonly alias: boolean;
	readonly hidden: boolean;
}

export interface GeneratedMetadata {
	readonly kindId?: number;
	readonly fieldId?: number;
	readonly sourceArtifact: string;
	/** Presence bitfield (`TSGrammar | TSNodeTypes | TSInternals`). */
	readonly presence?: KindPresenceFlag;
	/** Use bitfield (`Readable | Buildable | Renderable`). */
	readonly uses?: KindUseFlag;
	/** Parser-origin metadata; absent when the kind has no parser symbol. */
	readonly parser?: KindParserMetadata;
}

export interface GeneratedMetadataCatalog {
	readonly kindByName: ReadonlyMap<string, GeneratedMetadata>;
	readonly fieldByName: ReadonlyMap<string, GeneratedMetadata>;
}

// ---------------------------------------------------------------------------
// Evaluate output
// ---------------------------------------------------------------------------

export interface RawGrammar {
	readonly name: string;
	readonly rules: Record<string, Rule<'evaluate'>>;
	readonly ruleCatalog: RuleCatalog;
	readonly extras: string[];
	readonly externals: string[];
	readonly supertypes: string[];
	readonly inline: string[];
	readonly conflicts: string[][];
	readonly word: string | null;
	readonly references: SymbolRef[];
	/**
	 * External-symbol → structural-whitespace role mapping. Populated
	 * by the overrides extension via the `role()` DSL primitive —
	 * e.g. `_indent: ($) => role('indent')` in python's overrides.ts.
	 * Link reads this when resolving symbol references so indent-
	 * sensitive grammars surface their externals as `indent`/`dedent`/
	 * `newline` Rule nodes without the pipeline having to pattern-
	 * match on external names.
	 */
	readonly externalRoles?: Map<string, ExternalRole>;
	/**
	 * Per-rule form declarations registered by `refine()` in the
	 * override layer — authoring-only metadata that codegen reads to
	 * emit per-form namespace-keyed factories with narrowed Configs.
	 * Structurally transparent: the rule tree is unchanged by refine().
	 * See refine() DSL primitive for the full design.
	 */
	readonly refineForms?: Map<string, RefineForm[]>;
	/**
	 * Per-kind group-lift map from `groups:` in the override layer.
	 * Link reads this to synthesize nested sub-rules into hidden
	 * AssembledGroup kinds. See:
	 *   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
	 */
	readonly groups?: Record<string, Record<string, string> | undefined>;
	/**
	 * Raw polymorphs path→variant-name config from the override layer.
	 * Link passes this to applyGroupOverrides so synthesized kind names
	 * include polymorph-ancestor context segments.
	 */
	readonly polymorphsConfig?: Record<string, Record<string, string> | undefined>;
	/**
	 * Sittir-side render bodies for external scanner symbols. Populated
	 * by `renderAs:` in the override layer. The bodies enter sittir's
	 * slot/render/factory pipeline as if they were regular author-written
	 * rules; they are NOT present in the tree-sitter rules map (the
	 * external scanner still produces these symbols).
	 *
	 * Record keys are the external symbol names (e.g.
	 * `_outer_block_doc_comment_marker`); values are the sittir-side Rule
	 * bodies (e.g. `{ type: 'STRING', value: '!' }`).
	 */
	readonly renderAs?: Record<string, Rule<'evaluate'>>;
	/**
	 * Per-kind, per-diagnostic-code exceptions from `expectDiagnostics:` in
	 * the override layer — the grammar author's own declaration that a
	 * specific diagnostic code is EXPECTED (and accepted as non-blocking)
	 * for a specific kind, e.g. `{ 'content-collision': ['_object_type_group1'] }`.
	 * Read directly by `collectGrammarDiagnostics`/`collectGrammarDiagnosticsForGrammar`
	 * (`compiler/diagnostics/grammar-diagnostics.ts`) — grammar-scoped by
	 * construction, since only the grammar whose OWN overrides.ts declares an
	 * entry gets the exception. See docs/KNOWN_ISSUES.md for the canonical
	 * example (typescript's `_object_type_group1`).
	 */
	readonly expectDiagnostics?: Readonly<Record<string, readonly string[]>>;
	/**
	 * Enrich-synthesized clause-hoist rule names (`_<parent>_optional<N>` /
	 * `_<parent>_group<N>`) whose recorded owning parent this grammar's own
	 * `rules:` config redeclares — the override author could never reference
	 * a name that doesn't exist until enrich() mints it from the base
	 * grammar's pre-override shape, so redeclaring the owner unconditionally
	 * orphans it. Read by `collectGrammarDiagnosticsForGrammar` to suppress
	 * the phantom content-collision/storagename-collision diagnostic these
	 * orphans would otherwise raise for a kind that can never occur in a
	 * parse. See docs/KNOWN_ISSUES.md's `_object_type_group1` entry.
	 */
	readonly orphanedSyntheticGroups?: readonly string[];
}

/**
 * A single refine() form — duplicated from `dsl/wire/wire.ts::RefineForm`
 * as a plain type so the compiler tier doesn't import the DSL layer.
 */
export interface RefineForm {
	readonly name: string;
	readonly selections: Record<string, number | string>;
}

// ---------------------------------------------------------------------------
// Derivation log — sidecar of everything Link inferred / promoted
// ---------------------------------------------------------------------------

/**
 * DerivationLog — sidecar record of everything Link inferred / promoted.
 *
 * Populated unconditionally by Link's derivation passes. The emitter
 * for `overrides.suggested.ts` reads this to surface every
 * finding as a reviewable suggestion, regardless of whether Link
 * actually applied the mutation to the rule tree.
 *
 * Whether a derivation is ALSO applied (mutating the rule tree) is
 * governed by `IncludeFilter` — excluded sources still appear in the
 * log but don't land in the generated packages.
 */
export interface DerivationLog {
	/** Field-name inferences: parent wants a bare symbol wrapped in field(). */
	readonly inferredFields: InferredFieldEntry[];
	/** Rule-level promotions: enum, supertype, terminal, polymorph classifications. */
	readonly promotedRules: PromotedRuleEntry[];
	/**
	 * Repeated-shape candidates — sets of kinds that appear as field
	 * content unions in ≥2 distinct parent rules. Suggested as either
	 * a grammar-level supertype (choice-of-symbols) or a shared group
	 * so the grammar author can collapse the repetition with a single
	 * named rule. Non-mutating — these are suggestions only.
	 */
	readonly repeatedShapes: RepeatedShapeEntry[];
}

export interface InferredFieldEntry {
	/** The parent rule kind that contains the bare reference. */
	readonly kind: string;
	/** Name of the field to wrap the reference in. */
	readonly fieldName: string;
	/** Symbol being wrapped (the `to` in `field('name', $.to)`). */
	readonly targetSymbol: string;
	/** Confidence tier based on cross-parent agreement ratio. */
	readonly confidence: 'high' | 'medium' | 'low';
	/** Numeric agreement — e.g. 10/10 → 1.0, 6/7 → ~0.857. */
	readonly agreement: number;
	/** Total named refs that the inference was measured against. */
	readonly sampleSize: number;
	/** True if Link mutated the rule tree; false if held back by `include`. */
	readonly applied: boolean;
}

export interface RepeatedShapeEntry {
	/** Suggested name for the shared supertype/group (readable stub). */
	readonly suggestedName: string;
	/** The kind set — sorted, canonicalized. */
	readonly kinds: readonly string[];
	/** Parent rules whose fields carry this exact kind set. */
	readonly parents: readonly string[];
	/** Suggested shape: 'supertype' for choice-of-named, 'group' for heterogeneous. */
	readonly shape: 'supertype' | 'group';
}

export interface PromotedRuleEntry {
	/** Kind whose rule was classified via promotion. */
	readonly kind: string;
	/** What it was promoted to. */
	readonly classification: 'enum' | 'supertype' | 'terminal' | 'polymorph';
	/** True if Link kept the promotion; false if held back by `include`. */
	readonly applied: boolean;
	/**
	 * For `polymorph` classifications: pre-Normalize candidates suitable
	 * for emitting a copy-pasteable `variant()` snippet. Computed at
	 * Link time because Normalize's `fanOutSeqChoices` pass flattens
	 * nested `seq(_, seq(choice, _))` shapes — post-Normalize the choice
	 * moves up a level, so paths computed then don't match what
	 * `transform()`'s `applyPath` sees at evaluate time on the base
	 * grammar. Captured here once, referenced by the suggester.
	 */
	readonly polymorphCandidates?: readonly {
		readonly choiceArmCount: number;
		readonly armNames: readonly string[];
		readonly path: string;
		readonly fieldWrapperName?: string;
	}[];
}

// ---------------------------------------------------------------------------
// Link output
// ---------------------------------------------------------------------------

export interface LinkedGrammar {
	readonly name: string;
	readonly rules: Record<string, Rule<'link'>>;
	readonly supertypes: Set<string>;
	readonly externalRoles: Map<string, ExternalRole>;
	readonly externals?: readonly string[];
	readonly word: string | null;
	readonly references: SymbolRef[];
	readonly derivations: DerivationLog;
	/**
	 * Hidden-rule → alias-target mapping. When a hidden rule like
	 * `_type_identifier: $ => alias($.identifier, $.type_identifier)`
	 * is collapsed by Link (the alias wrapper is stripped so the rule
	 * tree downstream sees just `symbol('identifier')`), the alias's
	 * rename — the name tree-sitter actually emits at parse time —
	 * would be lost. This map records those collapses so Assemble
	 * can rewrite supertype subtype lists from `_type_identifier` to
	 * `type_identifier`. Optional so unit tests that construct a
	 * LinkedGrammar directly don't have to fill in an empty map.
	 */
	readonly aliasedHiddenKinds?: Map<string, string>;
	/**
	 * Hidden top-level alias-source kind → structural body to use for
	 * assembly/classification.
	 *
	 * Link collapses named aliases to `symbol(targetName, aliasedFrom?)`
	 * so downstream passes preserve runtime alias identity, but that
	 * erases the source body's shape for kinds like
	 * `_type_identifier: alias($.identifier, $.type_identifier)`.
	 * This map restores the original structural body for the alias
	 * source kind so Assemble can derive the hidden kind's model from
	 * the aliased content instead of the collapsed symbol.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly refineForms?: Map<string, RefineForm[]>;
	/**
	 * Set of hidden (`_`-prefixed) kind names that appear as the CONTENT of a
	 * named alias (`alias(symbol(_X), $.visible)`) in any parent rule body.
	 *
	 * These hidden kinds produce REAL runtime CST nodes (the parser exposes
	 * them under the alias target name). They must NOT be classified as
	 * `multi` (inlined repeat helpers) even when their rule body is a
	 * `repeat1` after normalization — they need their own `branch` type so
	 * the transport can match on their kind ID at decode time.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
	readonly parentAliasedKinds?: ReadonlySet<string>;
	/**
	 * Visible→visible alias target map: for each `alias($.source, $.target)` in
	 * any grammar rule body where BOTH source and target are visible (non-`_`-prefixed
	 * named kinds), records `target → [source, ...]`.
	 *
	 * Used downstream (assemble → buildSlotsRecord) to augment a kind's slot values
	 * with the concrete parse-surface children of any visible source aliased to it.
	 * Example: `alias($.delim_token_tree, $.token_tree)` adds `delim_token_tree_paren/
	 * bracket/brace` parseKinds to the `token_tree.content` slot so the wrap accept-set
	 * covers macro invocations that surface `delim_token_tree_*` nodes.
	 *
	 * Optional so hand-constructed test fixtures can omit it.
	 */
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	/**
	 * §D-2a content-alias provenance — DIAGNOSTIC-ONLY (the §D-2c non-injective
	 * fan-in check is their sole consumer). `contentAliasedFrom` maps a visible
	 * twin minted by {@link mintContentAliasKinds} to the hidden body kind it
	 * was minted from; `contentAliasedTo` is the inverse (hidden body → visible
	 * twins). NOTHING in the fold path may branch on these
	 * (`feedback_metadata_not_behavior`). Empty on every grammar today (no enrich
	 * `alias($._name,$.name)` nodes exist) — they guard a FUTURE violation.
	 */
	readonly contentAliasedFrom?: ReadonlyMap<string, string>;
	readonly contentAliasedTo?: ReadonlyMap<string, readonly string[]>;
	/**
	 * Link-time-pinned word-shape matcher, compiled ONCE from `raw.rules` (the
	 * evaluate-view rule tree, where the `word` rule's authored wrappers —
	 * notably a trailing `REPEAT` — are still intact). `undefined` when the
	 * grammar declares no `word` rule, or the rule's shape isn't expressible as
	 * a single regex (see `util/word-matcher.ts`'s `compileWordMatcher`).
	 *
	 * Every later phase CARRIES this value forward (`NormalizedGrammar` →
	 * `SimplifiedGrammar` → `NodeMap`) rather than recompiling from its own
	 * `rules`/`linkRules` view: compiling from a post-normalize view is
	 * unsound in general — normalize's wrapper-deletion collapses
	 * `REPEAT`/`OPTIONAL` wrappers into leaf `multiplicity` attributes that
	 * `ruleToRegexSource`'s walker doesn't consult, so a post-link recompile
	 * can silently undercount the regex (confirmed regression: typescript's
	 * `identifier` word rule loses its trailing `REPEAT`). Pinning at link
	 * time — where the wrapper is still a real node — and carrying the single
	 * compiled result is the fix; see
	 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md (PR-137
	 * follow-on) for the falsifying probe.
	 */
	readonly wordMatcher?: RegExp;
}

/**
 * Derived source tags that can be toggled via GenerateConfig.include.
 * `grammar` and `override` are always-on — user-authored content cannot
 * be filtered out.
 *
 * (debt: source-homonym resolution, decision 6) `DerivedRuleSource` (the
 * type alias formerly here, `= 'promoted'`) is deleted — a single-literal
 * alias adds nothing, and the name invited confusion with the unrelated
 * `RuleSource`/`author` authorship vocabulary. This `IncludeFilter.rules`
 * knob is a different axis (an opt-in include/exclude filter for link's
 * INFERRED classifications, declared by the caller), not a provenance fact.
 */
type DerivedFieldSource = 'enriched' | 'inferred';

export interface IncludeFilter {
	/** Derived rule classifications to KEEP. Defaults to all. */
	readonly rules?: readonly 'promoted'[];
	/** Derived field provenances to KEEP. Defaults to all. */
	readonly fields?: readonly DerivedFieldSource[];
}

// ---------------------------------------------------------------------------
// Normalize output
// ---------------------------------------------------------------------------

/**
 * Normalize-phase view of the grammar (`Grammar<'normalize'>`): `rules` IS
 * the wrapper-deleted set (`applyWrapperDeletion` output + the §D-2a inline
 * hoist), i.e. what the phase PRODUCES — per the 2026-07-04 design decision
 * that "normalize's output rules are the normalized rules" (the map formerly
 * known as `renderRules`). `linkRules` is the carried mid-normalize
 * link-phase view (post-`applyNormalizationPasses`, pre-wrapper-deletion —
 * wrappers intact) that hidden-rule resolution in assemble still needs.
 *
 * Today this view exists as locals inside `normalizeGrammar()` (which runs
 * simplify as its final stage and returns the {@link SimplifiedGrammar}
 * bundle directly); it is reified here so `SimplifyCtx` (S2) can be
 * `BaseCtx<'normalize'>` reading exactly this shape. See
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md.
 */
export interface NormalizedGrammar {
	readonly name: string;
	/** The normalize-phase rules — wrapper-free, attribute-stamped. */
	readonly rules: Record<string, RenderRule>;
	/** Carried mid-normalize link-phase view (wrappers intact). */
	readonly linkRules: Record<string, Rule<'link'>>;
	readonly supertypes: Set<string>;
	readonly word: string | null;
	/** Carried from {@link LinkedGrammar.wordMatcher} — link-time-pinned, never recompiled. See that field's doc comment. */
	readonly wordMatcher?: RegExp;
	readonly externals?: readonly string[];
	readonly derivations: DerivationLog;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly parentAliasedKinds?: ReadonlySet<string>;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly refineForms?: Map<string, RefineForm[]>;
}

export interface SimplifiedGrammar {
	readonly name: string;
	/**
	 * Carried mid-normalize link-phase view (wrappers intact) — see
	 * {@link NormalizedGrammar.linkRules}'s doc comment for the pipeline
	 * provenance. Carried through assemble onto {@link NodeMap.linkRules};
	 * see THAT field's doc comment for the current (2026-07-05, post-PR-137-
	 * follow-on-3) consumer list — now exclusively the two by-design
	 * authoring-shape diagnostics (`emitters/suggested.ts`,
	 * `emitters/refine-emit.ts` via `compiler/link.ts`'s refine-path
	 * resolution). `compiler/assemble.ts`'s hidden-body/subtype-resolution
	 * family migrated off this view onto `normalizedRules` (below); this
	 * field's sole remaining purpose is feeding `NodeMap.linkRules` for those
	 * two diagnostics — a candidate for a diagnostics-scoped carry in a future
	 * pass (not restructured here; see PR-137 follow-on-3 notes).
	 */
	readonly linkRules: Record<string, Rule<'link'>>;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	/** Propagated from {@link LinkedGrammar.parentAliasedKinds}. */
	readonly parentAliasedKinds?: ReadonlySet<string>;
	/** Propagated from {@link LinkedGrammar.visibleAliasTargets}. */
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	/**
	 * `SimplifiedGrammar`'s phase product — uniformly named `rules` like
	 * every other `Grammar<P>` member (2026-07-05: SimplifiedGrammar's
	 * former `simplifiedRules` field name was the one exception to the
	 * family's `rules` convention; renamed to close it). Derivation-only
	 * view of every rule, produced by `simplifyRule` as the final pass in
	 * `normalizeGrammar()`. Downstream consumers (`assemble` →
	 * `AssembledBranch/Container/Group`) read from this map instead of
	 * re-simplifying per-node. Raw templates still read `normalizedRules` /
	 * `linkRules` because they need anonymous delimiters to surface as
	 * template literals.
	 */
	readonly rules: Record<string, SimplifiedRule>;
	/**
	 * Wrapper-deleted view of every rule in `rules`, produced by
	 * `applyWrapperDeletion` as the new last pass in `normalizeGrammar()`.
	 * Modifier wrappers (optional / field / repeat / repeat1) have been
	 * pushed down to leaf attributes (fieldName / multiplicity / separator)
	 * on RuleBase. Structural rules (seq / choice / variant / group /
	 * polymorph) are preserved and recursed into.
	 *
	 * The new template emitter (PR1) reads from `normalizedRules` instead of
	 * `rules` so it never has to look through a wrapper to get modifier
	 * metadata. Task 2.A3 switches `computeSimplifiedRules` to use this
	 * map as input.
	 */
	readonly normalizedRules: Record<string, RenderRule>;
	readonly supertypes: Set<string>;
	readonly word: string | null;
	/** Carried from {@link LinkedGrammar.wordMatcher} — link-time-pinned, never recompiled. See that field's doc comment. */
	readonly wordMatcher?: RegExp;
	readonly externals?: readonly string[];
	readonly derivations: DerivationLog;
	readonly refineForms?: Map<string, RefineForm[]>;
}

// ---------------------------------------------------------------------------
// The Grammar<Phase> family (2026-07-04 design)
// ---------------------------------------------------------------------------

/**
 * The rule value type each phase's `rules` map carries. Mirrors
 * `Rule<Phase>`'s phase progression, adding the two brands where the
 * pipeline stores branded maps ({@link RenderRule}, {@link SimplifiedRule}).
 */
export type PhaseRuleOf<P extends PhaseName> = P extends 'simplify'
	? SimplifiedRule
	: P extends 'normalize'
		? RenderRule
		: Rule<P>;

/**
 * Phase-parameterized grammar container — the single lookup point for
 * "which container does a phase read", mirroring `Rule<Phase>`:
 *
 *   link      reads Grammar<'evaluate'>  (= {@link RawGrammar})
 *   normalize reads Grammar<'link'>      (= {@link LinkedGrammar})
 *   simplify  reads Grammar<'normalize'> (= {@link NormalizedGrammar})
 *   assemble  reads Grammar<'simplify'>  (= {@link SimplifiedGrammar})
 *
 * Deliberately a conditional ALIAS over the per-phase interfaces rather
 * than one interface with conditional fields: the per-phase interfaces
 * remain the SSOT for their field sets (they diverge well beyond `rules` —
 * e.g. `supertypes: string[]` on Raw vs `Set<string>` on Linked), and this
 * type gives `BaseCtx<P>` (S2) one parameter that keys grammar, rules,
 * walker, and builder together. Uniform invariant every alias satisfies
 * (2026-07-05: closed the former `SimplifiedGrammar` exception — its phase
 * product field is named `rules` like every other family member now):
 * `Grammar<P>['rules'] extends Record<string, PhaseRuleOf<P>>` for ALL `P`.
 * `SimplifiedGrammar` additionally carries `normalizedRules` / `linkRules`
 * as extra (non-`rules`) views alongside its `rules` product. See
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §1.
 */
export type Grammar<P extends PhaseName> = P extends 'evaluate'
	? RawGrammar
	: P extends 'link'
		? LinkedGrammar
		: P extends 'normalize'
			? NormalizedGrammar
			: SimplifiedGrammar;

// ---------------------------------------------------------------------------
// Assemble output
// ---------------------------------------------------------------------------

// `KindProjection` and `ProjectionContext` interfaces removed (parallel-cache
// anti-pattern per DRY — one source, one derivation). The kind
// set previously stored on `AssembledField.projection.kinds` is now derived
// on demand from `slot.values` via the `kindsOf(slot)` helper in node-map.ts.
// `NodeMap.projections` was unused (zero consumers) — also removed.

export interface SignaturePool {
	readonly signatures: Map<string, string>;
}

export interface NodeMap {
	readonly name: string;
	readonly nodes: Map<string, AssembledNode>;
	/**
	 * Rule-id → AssembledNode back-pointer. Populated at assembly when the
	 * root rule for each kind is registered. Lets consumers walking a rule
	 * tree look up the owning AssembledNode without owner traversal.
	 * See feedback_ruleid_backpointer.
	 */
	readonly nodeByRuleId: ReadonlyMap<RuleId, AssembledNode>;
	/**
	 * Rule-id → AssembledNonterminal back-pointer. Populated at assembly when
	 * each slot's source-rule positions are registered. Lets consumers walking a
	 * rule tree look up the slot's propertyName / storageName / paramName directly.
	 * See feedback_ruleid_backpointer.
	 */
	readonly slotByRuleId: ReadonlyMap<RuleId, AssembledNonterminal>;
	/**
	 * Carried from {@link SimplifiedGrammar.aliasedHiddenKinds} (itself
	 * carried from `LinkedGrammar`) — hidden alias-source kind → visible
	 * alias-target name, e.g. `_wrapped_item` → `wrapped_item`. The
	 * hidden/subtype-resolution family in `compiler/assemble.ts`
	 * (`resolveHiddenSubtypes`) migrated off this map for ITS purpose
	 * (see that function's doc comment), but the underlying fact — a
	 * hidden kind sharing its runtime numeric kind id with a visible
	 * alias — is still needed by transport emission: the generated id
	 * catalog (KIND_NAMES, `emitters/types.ts`) records that id under
	 * the visible name only, so per-slot child enum id-dispatch
	 * (`emitters/transport-common.ts`'s `acceptedTransportKinds`) must
	 * resolve a hidden kind to its alias target before looking up its id.
	 */
	readonly aliasedHiddenKinds?: ReadonlyMap<string, string>;
	readonly signatures: SignaturePool;
	/**
	 * Sidecar log of every derivation Link produced. Emitters read
	 * this to surface suggestions regardless of whether the mutation
	 * was applied to the rule tree (governed by IncludeFilter).
	 */
	readonly derivations: DerivationLog;
	/**
	 * `SimplifiedGrammar.linkRules` carried through assemble — the
	 * pre-simplify, wrapper-bearing view (`applyNormalizationPasses`'
	 * output, BEFORE `applyWrapperDeletion` strips modifier wrappers).
	 *
	 * PR-137 narrowed this to its JUSTIFIED-EXCEPTION consumers; the PR-137
	 * follow-on-3 migration (2026-07-05) closed out the LAST render/derivation
	 * consumer — `compiler/assemble.ts`'s hidden-body/subtype-resolution
	 * family (`resolveHiddenSubtypes` / `includeAliasMemberKinds` /
	 * `isAliasMemberKind` / `isCompatibleSubtypeMember` /
	 * `resolveHiddenRuleContent`) now reads `AssembleCtx.normalizedRules`
	 * instead, with the former "no REPEAT1 case = opaque" switch behavior
	 * translated into explicit `multiplicity`/`fieldName`/`aliasedFrom`
	 * attribute checks run BEFORE the type switch (see
	 * `resolveHiddenRuleContent`'s doc comment in assemble.ts for the full
	 * translation table and the regression fixture this closes — rust's
	 * `_delim_tokens` supertype chain resolving `%` as a bogus subtype and
	 * crashing `emitSupertypeUnionDeclarations`). `AssembleCtx.linkRules` (the
	 * getter this family used to read) is DELETED — zero assemble consumers
	 * remain. The PR-137 follow-on-4 investigation (same day) tried migrating
	 * this family from `AssembleCtx.normalizedRules` to `AssembleCtx.rules`
	 * (`SimplifiedGrammar`'s own phase product — the map `assemble()`'s input
	 * container is actually named for, so `normalizedRules` wasn't obviously
	 * justified over it) and found it EMPIRICALLY UNSAFE: python's
	 * `_simple_pattern` supertype loses its `_simple_pattern_negative` subtype
	 * entry under `rules` (simplify's SEQ-collapse unmasks an intentionally
	 * opaque SEQ shape into a dispatchable CHOICE, discarding the variant-
	 * adopted kind's own name) — see `AssembleCtx`'s class doc comment for the
	 * full root-cause. The family stays on `normalizedRules`; the getter is
	 * NOT deleted. `topLevelAliasBodies` stays a distinct field (its presence
	 * test — "is this hidden kind an alias-mint target" — has no rule-
	 * attribute equivalent; its VALUES are redundant with `normalizedRules[name]`
	 * and no longer read directly).
	 *
	 * The word-matcher consumer came OFF this list in the PR-137 follow-on: it
	 * no longer compiles from `linkRules` (or any post-link view) at all —
	 * it's pinned once at Link time from `raw.rules` and carried on
	 * `wordMatcher` (below) instead. Remaining consumers are exclusively the
	 * two BY-DESIGN authoring-shape diagnostics (not render/derivation paths —
	 * see docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md's
	 * end-state table, row "emitters"):
	 *   - `emitters/suggested.ts`'s `findSymbolPosition` (via `parentRule`)
	 *     and `detectGroupCandidates`/`walkBodyForGroups` (via `groupRules`):
	 *     both explicitly pattern-match `FIELD`/`OPTIONAL`/`REPEAT`/
	 *     `REPEAT1`/`ALIAS`/`TOKEN`/`VARIANT`/`GROUP` wrapper shapes by
	 *     design — these are propose-diagnostics over the grammar's
	 *     natural (pre-wrapper-deletion) authoring shape, not render
	 *     consumers.
	 *   - `compiler/link.ts`'s `resolveRefinePath`/`narrowedFieldLiteralsForForm`
	 *     (via `emitters/refine-emit.ts`'s `collectRefineKindInfos`):
	 *     `refine()` selection paths are authored against the pre-normalize
	 *     tree, so path resolution must walk the same wrapper shapes.
	 */
	readonly linkRules?: Record<string, Rule<'link'>>;
	/**
	 * `SimplifiedGrammar.normalizedRules` carried through assemble — the
	 * wrapper-deleted `RenderRule` view (modifier wrappers pushed down to
	 * leaf attributes). PR-137: added so `emitters/templates.ts`'s
	 * `EmitCtx.rules` (hidden-helper inlining fallback in `emitSymbol`) can
	 * read the honest post-normalize view directly instead of bridging
	 * through `deleteWrapper(linkRules[name])` per call — verified
	 * byte-identical to the former bridge for every hidden ref the
	 * fallback actually reaches, across all 3 grammars.
	 */
	readonly normalizedRules?: Record<string, RenderRule>;
	/**
	 * Grammar's `word` rule kind — the lexer's word-recognition
	 * production. Tree-sitter uses this to disambiguate keywords
	 * from identifiers at parse time: anything that lexes as the
	 * word rule and matches a keyword string becomes the keyword
	 * instead. Factories for this kind reject text that's a
	 * registered keyword, since constructing such a node would
	 * round-trip back to the keyword and lose the kind.
	 */
	readonly word?: string | null;
	/**
	 * Link-time-pinned word-shape matcher, carried from
	 * `SimplifiedGrammar.wordMatcher` (itself carried from
	 * `LinkedGrammar.wordMatcher`) — see that field's doc comment for the
	 * pin-at-link rationale. `undefined` when the grammar declares no `word`
	 * rule; consumers fall back to `matchesWordShape`'s `/^\w+$/` heuristic
	 * in that case, same as before.
	 */
	readonly wordMatcher?: RegExp;
	readonly polymorphFormKinds: ReadonlySet<string>;
	/**
	 * External-token symbols declared by the grammar (`externals: $ =>
	 * [...]`). The template emitter uses this to detect rules whose
	 * structure depends on scanner-generated tokens (e.g. rust's
	 * `raw_string_literal` delimiters) — those rules can't be rendered
	 * slot-by-slot and fall back to `$TEXT` which emits the node's
	 * native text verbatim.
	 */
	readonly externals?: ReadonlySet<string>;
	/**
	 * Per-kind refine() form declarations, keyed by rule kind. Emitters
	 * read this to generate namespace-keyed factories and narrowed
	 * Config types for per-form factories. Undefined when no refine()
	 * calls fired in this grammar's overrides.
	 */
	readonly refineForms?: Map<string, RefineForm[]>;
	/**
	 * SCC analysis over the singular transport-reference graph. Populated
	 * post-assemble (see `compiler/scc.ts`). Emitters consult `scc.sameSCC`
	 * for the Box decision on per-slot / supertype enum variants — Box
	 * only when a variant and its enum's owner kind are in the same SCC.
	 * Undefined for callers that never compute it (legacy fixtures, etc.).
	 */
	scc?: SCCAnalysis;
}
