/**
 * compiler/types.ts — compiler pipeline output contracts.
 *
 * Each pipeline phase produces a typed container; this file collects
 * them.
 *
 * - Evaluate  produces {@link RawGrammar}.
 * - Link      produces {@link LinkedGrammar} plus a {@link DerivationLog}.
 * - Optimize  produces {@link OptimizedGrammar}.
 * - Assemble  produces {@link NodeMap}.
 *
 * Diagnostic / suggester-input types live here too ({@link DerivationLog}
 * and its entry types, {@link SuggestedOverride}, {@link IncludeFilter})
 * because they flow between Link and the suggester emitter, not through
 * the rule tree itself.
 *
 * The Rule model (Rule union + type guards + SymbolRef) stays in
 * `./rule.ts`. The AssembledNode hierarchy currently stays in `rule.ts`
 * too; splitting it into `./node-map.ts` is a later step.
 */

import type { Rule, RuleId, SymbolRef } from './rule.ts';
import type { AssembledNode } from './node-map.ts';

/**
 * One entry in the {@link LinkedGrammar.polymorphVariants} /
 * {@link OptimizedGrammar.polymorphVariants} /
 * {@link NodeMap.polymorphVariants} lists — records that a `variant('x')`
 * override inside rule `parent` produced a visible child kind
 * `parent_x` in the parse tree.
 *
 * Emitted by the DSL (`dsl/synthetic-rules.ts::registerPolymorphVariant`)
 * and propagated through the pipeline so Link, Assemble, and the
 * factory/from emitters can expose `parent_x` as a discriminable
 * variant form.
 */
export interface PolymorphVariant {
	readonly parent: string;
	readonly child: string;
}

// ---------------------------------------------------------------------------
// External-scanner role binding
// ---------------------------------------------------------------------------

export type ExternalRole = { role: 'indent' | 'dedent' | 'newline' };

// ---------------------------------------------------------------------------
// Evaluate rule occurrence identity and classification
// ---------------------------------------------------------------------------

export type RuleProvenance =
	| 'grammar-authored'
	| 'override-authored-or-replaced'
	| 'evaluate-synthesized';

export type RulePathSegment =
	| { readonly edge: 'content' }
	| { readonly edge: 'members'; readonly index: number }
	| { readonly edge: 'forms'; readonly index: number };

export interface RuleCatalogEntry {
	readonly id: RuleId;
	readonly ownerKind: string;
	readonly ruleType: Rule['type'];
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

export interface GeneratedMetadata {
	readonly kindId?: number;
	readonly fieldId?: number;
	readonly sourceArtifact: string;
}

export interface GeneratedMetadataCatalog {
	readonly kindByName: ReadonlyMap<string, GeneratedMetadata>;
	readonly fieldByName: ReadonlyMap<string, GeneratedMetadata>;
}

// ---------------------------------------------------------------------------
// Phase 1 — Evaluate output
// ---------------------------------------------------------------------------

export interface RawGrammar {
	readonly name: string;
	readonly rules: Record<string, Rule>;
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
	 * Nested-alias polymorph metadata: each entry pairs a parent kind
	 * with a short variant suffix. The full alias name is
	 * `${parent}_${child}`. Populated by alias() placeholders in
	 * transform patches during evaluate.
	 */
	readonly polymorphVariants?: PolymorphVariant[];
	/**
	 * Per-rule form declarations registered by `refine()` in the
	 * override layer — authoring-only metadata that codegen reads to
	 * emit per-form namespace-keyed factories with narrowed Configs.
	 * Structurally transparent: the rule tree is unchanged by refine().
	 * See ADR-0010 phase 2 for the full design.
	 */
	readonly refineForms?: Map<string, RefineForm[]>;
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
 * Suggested override entry — emitted by the suggested.ts emitter from
 * fields whose `source` is `'enriched'` or `'inlined'`, and from rules
 * whose `source` is `'promoted'`. The classification work happens in
 * Link; this type is just the wire shape the emitter consumes.
 */
export interface SuggestedOverride {
	/** The parent kind that needs the override applied. */
	readonly kind: string;
	/**
	 * Position within the parent rule the override would target. Empty
	 * array when the suggestion applies at the symbol level (e.g.
	 * global-optionality, naming-consistency diagnostics) rather than
	 * at a specific position.
	 */
	readonly path: (string | number)[];
	/** The rule fragment the override would emit (typically a `field()` wrapper). */
	readonly rule: Rule;
	/** Human-readable derivation tag — `field-name-inference: 6/6 ...`. */
	readonly derivation: string;
	/** Confidence based on agreement ratio. */
	readonly confidence: 'high' | 'medium' | 'low';
}

/**
 * DerivationLog — sidecar record of everything Link inferred / promoted.
 *
 * Populated unconditionally by Link's derivation passes. The emitter
 * for `overrides.suggested.ts` (T042f) reads this to surface every
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
	 * For `polymorph` classifications: pre-Optimize candidates suitable
	 * for emitting a copy-pasteable `variant()` snippet. Computed at
	 * Link time because Optimize's `fanOutSeqChoices` pass flattens
	 * nested `seq(_, seq(choice, _))` shapes — post-Optimize the choice
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
// Phase 2 — Link output
// ---------------------------------------------------------------------------

export interface LinkedGrammar {
	readonly name: string;
	readonly rules: Record<string, Rule>;
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
	readonly polymorphVariants?: PolymorphVariant[];
	readonly refineForms?: Map<string, RefineForm[]>;
}

/**
 * Derived source tags that can be toggled via GenerateConfig.include.
 * `grammar` and `override` are always-on — user-authored content cannot
 * be filtered out.
 */
export type DerivedRuleSource = 'promoted';
export type DerivedFieldSource = 'enriched' | 'inlined' | 'inferred';

export interface IncludeFilter {
	/** Derived rule classifications to KEEP. Defaults to all. */
	readonly rules?: readonly DerivedRuleSource[];
	/** Derived field provenances to KEEP. Defaults to all. */
	readonly fields?: readonly DerivedFieldSource[];
}

// ---------------------------------------------------------------------------
// Phase 3 — Optimize output
// ---------------------------------------------------------------------------

export interface OptimizedGrammar {
	readonly name: string;
	readonly rules: Record<string, Rule>;
	readonly aliasedHiddenKinds?: Map<string, string>;
	/**
	 * Derivation-only view of every rule in `rules`, produced by
	 * `simplifyRule` as the final pass in `optimize()`. Downstream
	 * consumers (`assemble` → `AssembledBranch/Container/Group`) read
	 * from this map instead of re-simplifying per-node. Raw
	 * templates still read `rules` because they need anonymous
	 * delimiters to surface as template literals.
	 */
	readonly simplifiedRules: Record<string, Rule>;
	readonly supertypes: Set<string>;
	readonly word: string | null;
	readonly externals?: readonly string[];
	readonly derivations: DerivationLog;
	readonly polymorphVariants?: PolymorphVariant[];
	readonly refineForms?: Map<string, RefineForm[]>;
}

// ---------------------------------------------------------------------------
// Phase 4 — Assemble output
// ---------------------------------------------------------------------------

export interface KindProjection {
	readonly typeName: string;
	readonly kinds: string[];
}

export interface SignaturePool {
	readonly signatures: Map<string, string>;
}

export interface ProjectionContext {
	readonly projections: Map<string, KindProjection>;
}

export interface NodeMap {
	readonly name: string;
	readonly nodes: Map<string, AssembledNode>;
	readonly signatures: SignaturePool;
	readonly projections: ProjectionContext;
	/**
	 * Sidecar log of every derivation Link produced. Emitters read
	 * this to surface suggestions regardless of whether the mutation
	 * was applied to the rule tree (governed by IncludeFilter).
	 */
	readonly derivations: DerivationLog;
	/**
	 * Post-Optimize rule map — the template walker needs this so its
	 * `symbol` case can inline hidden helper rules (e.g. python's
	 * `_import_list`) directly into the emitted template. Without it
	 * the walker falls back to `$$$CHILDREN` which is wrong for hidden
	 * helpers whose fields get promoted onto the parent node.
	 */
	readonly rules?: Record<string, Rule>;
	/**
	 * Pre-Optimize rules (from Link). The suggester needs these for
	 * polymorph-path computation: `findAllPolymorphCandidates` paths
	 * must match what the override author's `transform()` call would
	 * see at evaluate time — BEFORE `fanOutSeqChoices` flattens nested
	 * seq(choice) into top-level seq[choice]. Using post-Optimize
	 * rules collapses `seq(_, seq(choice, _))` into `seq(_, choice, _)`,
	 * shifting the choice's logical path from `1/0` to `1`, and the
	 * emitted `variant()` keys then fail when applied to the base
	 * grammar's prec-wrapped-seq-of-choice shape.
	 */
	readonly linkedRules?: Record<string, Rule>;
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
	 * Config types — see ADR-0010 phase 2. Undefined when no refine()
	 * calls fired in this grammar's overrides.
	 */
	readonly refineForms?: Map<string, RefineForm[]>;
}

export function computePolymorphFormKinds(
	nodes: Map<string, AssembledNode>
): Set<string> {
	const result = new Set<string>();
	for (const [, node] of nodes) {
		if (node.modelType !== 'polymorph') continue;
		// All polymorph form kinds need to be skipped from direct kind
		// iteration — both promoted (synthesized `${parent}_${variant}`)
		// and override (disambiguated `${parent}__form_${variant}`).
		// The variant child kinds for source='override' polymorphs are
		// distinct from form kinds (after disambiguation) and remain
		// in nodes Map for normal branch emission.
		for (const form of node.forms) result.add(form.kind);
	}
	return result;
}
