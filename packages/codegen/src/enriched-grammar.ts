/**
 * Layer 2: Enriched Grammar — grammar.json introspection only
 *
 * Classifies grammar rules into a 6-variant discriminated union.
 * Does not touch node-types.json. Classification and extraction
 * happen together — the extraction result determines the modelType.
 */

import type { GrammarRule } from './grammar.ts';

// ---------------------------------------------------------------------------
// EnrichedRule — 6-variant discriminated union
// ---------------------------------------------------------------------------

export interface SupertypeRule {
	modelType: 'supertype';
	subtypes: string[];
	rule: GrammarRule;
}

export interface EnrichedFieldInfo {
	name: string;
	kinds: string[];
	required: boolean;
	multiple: boolean;
}

export interface EnrichedChildInfo {
	kinds: string[];
	required: boolean;
	multiple: boolean;
}

export interface BranchRule {
	modelType: 'branch';
	fields: EnrichedFieldInfo[];
	children?: EnrichedChildInfo[];
	separators: Map<string, string>;
	rule: GrammarRule;
}

export interface ContainerRule {
	modelType: 'container';
	children: EnrichedChildInfo[];
	separators: Map<string, string>;
	rule: GrammarRule;
}

export interface KeywordRule {
	modelType: 'keyword';
	text: string;
	rule: GrammarRule;
}

export interface EnumRule {
	modelType: 'enum';
	values: string[];
	rule: GrammarRule;
}

export interface LeafRule {
	modelType: 'leaf';
	pattern: string | null;
	rule: GrammarRule;
}

export type EnrichedRule =
	| SupertypeRule
	| BranchRule
	| ContainerRule
	| KeywordRule
	| EnumRule
	| LeafRule;
