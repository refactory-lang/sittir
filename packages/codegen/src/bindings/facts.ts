import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
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
	readonly capture: string;
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

export const BINDING_FACTS_VERSION = 1;

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

export interface BindingFactsArtifact {
	readonly bindingsHash: string;
	readonly facts: BindingFacts;
}

export const WRITE_FACTS_COMMAND = 'sittir tool bindings-inventory --write-facts';

export function bindingsHash(bindingsText: string, version: number = BINDING_FACTS_VERSION): string {
	return createHash('sha256').update(`${version}\0${bindingsText}`).digest('hex');
}

export const bindingsPath = (grammar: GrammarName): string => join(grammarPackageDir(grammar), 'bindings.scm');
export const bindingFactsPath = (grammar: GrammarName): string => join(grammarPackageDir(grammar), '.sittir', 'bindings.json');

export class StaleBindingFactsError extends Error {
	constructor(readonly grammar: GrammarName, reason: string) {
		super(`${grammar}: ${reason}; regenerate it with \`${WRITE_FACTS_COMMAND}\``);
	}
}

export function verifiedBindingFacts(grammar: GrammarName, artifact: BindingFactsArtifact, bindingsText: string): BindingFacts {
	if (artifact.bindingsHash !== bindingsHash(bindingsText))
		throw new StaleBindingFactsError(grammar, `its bindings facts were read from another bindings.scm or derivation`);
	return artifact.facts;
}

export function readBindingFacts(grammar: GrammarName): BindingFacts {
	const artifactPath = bindingFactsPath(grammar);
	if (!existsSync(artifactPath)) throw new StaleBindingFactsError(grammar, `${artifactPath} is missing`);
	const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as BindingFactsArtifact;
	return verifiedBindingFacts(grammar, artifact, readFileSync(bindingsPath(grammar), 'utf8'));
}
