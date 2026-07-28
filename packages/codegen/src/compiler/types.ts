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

// ExternalRole lives in the IR type layer — re-exported here so existing
// compiler-side importers keep working.
import type { ExternalRole } from '../types/ir.ts';
export type { ExternalRole };

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
	readonly presence?: KindPresenceFlag;
	readonly uses?: KindUseFlag;
	readonly parser?: KindParserMetadata;
}

export interface GeneratedMetadataCatalog {
	readonly kindByName: ReadonlyMap<string, GeneratedMetadata>;
	readonly fieldByName: ReadonlyMap<string, GeneratedMetadata>;
}

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
	readonly externalRoles?: Map<string, ExternalRole>;
	readonly refineForms?: Map<string, RefineForm[]>;
	readonly groups?: Record<string, Record<string, string> | undefined>;
	readonly polymorphsConfig?: Record<string, Record<string, string> | undefined>;
	readonly renderAs?: Record<string, Rule<'evaluate'>>;
	readonly visibleExternals?: Record<string, Rule<'evaluate'>>;
	readonly expectDiagnostics?: Readonly<Record<string, readonly string[]>>;
	readonly expectTestFailures?: Readonly<Record<string, string>>;
	readonly orphanedSyntheticGroups?: readonly string[];

	readonly bodyPatternZeroMatches?: readonly string[];
}

export interface RefineForm {
	readonly name: string;
	readonly selections: Record<string, number | string>;
}

export interface DerivationLog {
	readonly inferredFields: InferredFieldEntry[];
	readonly promotedRules: PromotedRuleEntry[];
	readonly repeatedShapes: RepeatedShapeEntry[];
}

export interface InferredFieldEntry {
	readonly kind: string;
	readonly fieldName: string;
	readonly targetSymbol: string;
	readonly confidence: 'high' | 'medium' | 'low';
	readonly agreement: number;
	readonly sampleSize: number;
	readonly applied: boolean;
}

export interface RepeatedShapeEntry {
	readonly suggestedName: string;
	readonly kinds: readonly string[];
	readonly parents: readonly string[];
	readonly shape: 'supertype' | 'group';
}

export interface PromotedRuleEntry {
	readonly kind: string;
	readonly classification: 'enum' | 'supertype' | 'terminal' | 'polymorph';
	readonly applied: boolean;
	readonly polymorphCandidates?: readonly {
		readonly choiceArmCount: number;
		readonly armNames: readonly string[];
		readonly path: string;
		readonly fieldWrapperName?: string;
	}[];
}

export interface LinkedGrammar {
	readonly name: string;
	readonly rules: Record<string, Rule<'link'>>;
	readonly supertypes: Set<string>;
	readonly externalRoles: Map<string, ExternalRole>;
	readonly externals?: readonly string[];
	readonly word: string | null;
	readonly references: SymbolRef[];
	readonly derivations: DerivationLog;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly refineForms?: Map<string, RefineForm[]>;
	readonly parentAliasedKinds?: ReadonlySet<string>;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly contentAliasedFrom?: ReadonlyMap<string, string>;
	readonly contentAliasedTo?: ReadonlyMap<string, readonly string[]>;
	readonly wordMatcher?: RegExp;
}

type DerivedFieldSource = 'enriched' | 'inferred';

export interface IncludeFilter {
	readonly rules?: readonly 'promoted'[];
	readonly fields?: readonly DerivedFieldSource[];
}

export interface NormalizedGrammar {
	readonly name: string;
	readonly rules: Record<string, RenderRule>;
	readonly linkRules: Record<string, Rule<'link'>>;
	readonly supertypes: Set<string>;
	readonly word: string | null;
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
	readonly linkRules: Record<string, Rule<'link'>>;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly parentAliasedKinds?: ReadonlySet<string>;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly rules: Record<string, SimplifiedRule>;
	readonly normalizedRules: Record<string, RenderRule>;
	readonly supertypes: Set<string>;
	readonly word: string | null;
	readonly wordMatcher?: RegExp;
	readonly externals?: readonly string[];
	readonly derivations: DerivationLog;
	readonly refineForms?: Map<string, RefineForm[]>;
}

export type PhaseRuleOf<P extends PhaseName> = P extends 'simplify'
	? SimplifiedRule
	: P extends 'normalize'
		? RenderRule
		: Rule<P>;

export type Grammar<P extends PhaseName> = P extends 'evaluate'
	? RawGrammar
	: P extends 'link'
		? LinkedGrammar
		: P extends 'normalize'
			? NormalizedGrammar
			: SimplifiedGrammar;

export interface SignaturePool {
	readonly signatures: Map<string, string>;
}

export interface NodeMap {
	readonly name: string;
	readonly nodes: Map<string, AssembledNode>;
	readonly nodeByRuleId: ReadonlyMap<RuleId, AssembledNode>;
	readonly slotByRuleId: ReadonlyMap<RuleId, AssembledNonterminal>;
	readonly aliasedHiddenKinds?: ReadonlyMap<string, string>;
	readonly signatures: SignaturePool;
	readonly derivations: DerivationLog;
	readonly linkRules?: Record<string, Rule<'link'>>;
	readonly normalizedRules?: Record<string, RenderRule>;
	readonly word?: string | null;
	readonly wordMatcher?: RegExp;
	readonly polymorphFormKinds: ReadonlySet<string>;
	readonly externals?: ReadonlySet<string>;
	readonly refineForms?: Map<string, RefineForm[]>;
	scc?: SCCAnalysis;
}
