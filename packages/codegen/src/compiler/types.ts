import type { AnyRule, PhaseName, Rule, RenderRule, SimplifiedRule, RuleId, SymbolRef } from '../types/rule.ts';
import type { AssembledNode, AssembledNonterminal } from './model/node-map.ts';
import type { SCCAnalysis } from './scc.ts';
import type { VariantChild } from './variant-structural.ts';

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
	TSGrammar: 1 << 0,
	TSNodeTypes: 1 << 1,
	TSInternals: 1 << 2
} as const;
export type KindPresenceFlag = number;

const KindUseFlag = {
	None: 0,
	Readable: 1 << 0,
	Buildable: 1 << 1,
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
	readonly factoryInline: string[];
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
	readonly visibleInlineNames?: readonly string[];

	readonly bodyPatternZeroMatches?: readonly string[];
	readonly desugarDivergences?: readonly DesugarDivergenceEvent[];
}

export interface DesugarDivergenceEvent {
	readonly site: 'inline-alias-source' | 'body-pattern-group';
	readonly name: string;
}

import type { RefineForm } from '../dsl/wire/wire.ts';
export type { RefineForm };

export interface NarrowedField {
	readonly fieldName: string;
	readonly literal: string;
}

export interface LinkedRefineForm extends RefineForm {
	readonly narrowedFields: readonly NarrowedField[];
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
	readonly factoryInline: ReadonlySet<string>;
	readonly externalRoles: Map<string, ExternalRole>;
	readonly externals?: readonly string[];
	readonly extras?: readonly string[];
	readonly word: string | null;
	readonly references: SymbolRef[];
	readonly derivations: DerivationLog;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly refineForms?: ReadonlyMap<string, readonly LinkedRefineForm[]>;
	readonly parentAliasedKinds?: ReadonlySet<string>;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly variantChildren?: ReadonlyMap<string, readonly VariantChild[]>;
	readonly contentAliasedFrom?: ReadonlyMap<string, string>;
	readonly contentAliasedTo?: ReadonlyMap<string, readonly string[]>;
	readonly terminalAliasWireIds?: ReadonlyMap<string, readonly number[]>;
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
	readonly supertypes: Set<string>;
	readonly word: string | null;
	readonly wordMatcher?: RegExp;
	readonly externals?: readonly string[];
	readonly extras?: readonly string[];
	readonly derivations: DerivationLog;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly parentAliasedKinds?: ReadonlySet<string>;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly variantChildren?: ReadonlyMap<string, readonly VariantChild[]>;
	readonly terminalAliasWireIds?: ReadonlyMap<string, readonly number[]>;
	readonly refineForms?: ReadonlyMap<string, readonly LinkedRefineForm[]>;
}

export interface SimplifiedGrammar {
	readonly name: string;
	readonly aliasedHiddenKinds?: Map<string, string>;
	readonly topLevelAliasBodies?: Map<string, Rule<'link'>>;
	readonly parentAliasedKinds?: ReadonlySet<string>;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly variantChildren?: ReadonlyMap<string, readonly VariantChild[]>;
	readonly terminalAliasWireIds?: ReadonlyMap<string, readonly number[]>;
	readonly rules: Record<string, SimplifiedRule>;
	readonly normalizedRules: Record<string, RenderRule>;
	readonly supertypes: Set<string>;
	readonly factoryInline: ReadonlySet<string>;
	readonly word: string | null;
	readonly wordMatcher?: RegExp;
	readonly externals?: readonly string[];
	readonly extras?: readonly string[];
	readonly derivations: DerivationLog;
	readonly refineForms?: ReadonlyMap<string, readonly LinkedRefineForm[]>;
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
	readonly terminalAliasWireIds?: ReadonlyMap<string, readonly number[]>;
	readonly signatures: SignaturePool;
	readonly derivations: DerivationLog;
	readonly normalizedRules?: Record<string, RenderRule>;
	readonly word?: string | null;
	readonly wordMatcher?: RegExp;
	readonly polymorphFormKinds: ReadonlySet<string>;
	readonly externals?: ReadonlySet<string>;
	readonly extras?: ReadonlySet<string>;
	readonly refineForms?: ReadonlyMap<string, readonly LinkedRefineForm[]>;
	scc?: SCCAnalysis;
}
