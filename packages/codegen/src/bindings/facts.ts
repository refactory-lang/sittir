import { join } from 'node:path';
import { grammarPackageDir, type GrammarName } from '../grammars.ts';

export const WILDCARD = '_';

export interface SlotSelector {
	readonly field: string | null;
	readonly kind: string | null;
	readonly after: SlotSelector | null;
}

export type PredicateArgument = { readonly capture: string } | { readonly text: string };

export interface PredicateFact {
	readonly operator: string;
	readonly capture: string | null;
	readonly arguments: readonly PredicateArgument[];
}

export interface ClaimFact {
	readonly vocab: string;
	readonly kind: string | null;
	readonly predicates: readonly PredicateFact[];
	readonly toplevel: boolean;
	readonly within: readonly string[];
	readonly fieldLiterals: Readonly<Record<string, string>>;
	readonly tokens: readonly string[];
}

export interface UnclaimedFact {
	readonly kind: string;
	readonly reason: string | null;
}

export type MemberFact =
	| ({ readonly route: 'rename'; readonly owner: string; readonly name: string } & SlotSelector)
	| {
			readonly route: 'presence';
			readonly owner: string;
			readonly name: string;
			readonly token: string;
			readonly via: readonly string[];
	  }
	| ({
			readonly route: 'nested';
			readonly owner: string;
			readonly name: string;
			readonly parent: string;
			readonly multiple: boolean;
			readonly via: readonly string[];
	  } & SlotSelector);

export interface ContainerCapture extends SlotSelector {
	readonly name: string;
	readonly token: string | null;
	readonly multiple: boolean;
}

export interface PatternOrigin {
	readonly line: number;
	readonly source: string;
}

export interface ContainerFact {
	readonly kind: string;
	readonly element: SlotSelector;
	readonly captures: readonly ContainerCapture[];
	readonly dropped: readonly SlotSelector[];
	readonly reason: string | null;
	readonly pattern: PatternOrigin;
}

export interface TemplateFact {
	readonly vocabs: readonly string[];
	readonly target: string;
	readonly template: string;
	readonly holes: readonly string[];
}

export interface BindingFacts {
	readonly claims: readonly ClaimFact[];
	readonly members: readonly MemberFact[];
	readonly containers: readonly ContainerFact[];
	readonly templates: readonly TemplateFact[];
	readonly unclaimed: readonly UnclaimedFact[];
}

export interface ModelSlot {
	readonly name: string;
	readonly propertyName: string;
	readonly required: boolean;
	readonly multiple: boolean;
	readonly storage: string;
	readonly kinds: readonly string[];
	readonly terminals: readonly string[];
}

export interface ModelNode {
	readonly kind: string;
	readonly modelType: string;
	readonly slots: readonly ModelSlot[];
	readonly subtypes: readonly string[];
	readonly elementKinds: readonly string[];
	readonly enumValues: readonly string[];
	readonly text: string | null;
	readonly pattern: string | null;
}

export type SlotModel = ReadonlyMap<string, ModelNode>;

export const KNOWN_PREDICATE_OPERATORS: ReadonlySet<string> = new Set([
	'eq',
	'not-eq',
	'any-eq',
	'any-not-eq',
	'match',
	'not-match',
	'any-match',
	'any-not-match',
	'any-of',
	'not-any-of'
]);

export const bindingsPath = (grammar: GrammarName): string => join(grammarPackageDir(grammar), 'bindings.scm');
