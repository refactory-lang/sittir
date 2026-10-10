import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ErrorRegion } from '@sittir/types';
import { allGrammars, grammarPackageDir, PACKAGES_DIR, type GrammarName } from '../grammars.ts';

export const WILDCARD = '_';

export interface SlotSelector {
	readonly field: string | null;
	readonly kind: string | null;
	readonly after: SlotSelector | null;
}

export type PredicateArgument = { readonly capture: string } | { readonly text: string };

export interface CaptureSite {
	readonly up: number;
	readonly down: readonly SlotSelector[];
}

export interface PredicateFact {
	readonly operator: string;
	readonly capture: string | null;
	readonly arguments: readonly PredicateArgument[];
	readonly subject: CaptureSite | null;
}

export interface ClaimFact {
	readonly vocab: string;
	readonly kind: string | null;
	readonly field: string | null;
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
	| { readonly route: 'kind'; readonly owner: string; readonly name: string; readonly member: string; readonly kind: string }
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

export type PatternReference = { readonly kind: 'field' | 'node' | 'token'; readonly name: string };

export interface BindingPattern extends PatternOrigin {
	readonly references: readonly PatternReference[];
}

export class BindingsSyntaxError extends Error {
	readonly lines: readonly number[];
	constructor(lines: readonly number[]) {
		super(`bindings.scm does not parse at line ${lines.join(', ')}`);
		this.lines = lines;
	}
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

export interface EnumMember {
	readonly kind: string;
	readonly text: string;
}
export interface ModelNode {
	readonly kind: string;
	readonly modelType: string;
	readonly slots: readonly ModelSlot[];
	readonly subtypes: readonly string[];
	readonly elementKinds: readonly string[];
	readonly enumMembers: readonly EnumMember[];
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

export const BINDINGS_FILE = 'bindings.scm';

export const bindingsPathIn = (packageDir: string): string => join(packageDir, BINDINGS_FILE);

export const bindingsPath = (grammar: GrammarName): string => bindingsPathIn(grammarPackageDir(grammar));

export interface BindingsRoundTrip {
	readonly errors: readonly ErrorRegion[];
	readonly rendered: string;
}

export const bindingGrammars = (): readonly GrammarName[] => allGrammars().filter((grammar) => existsSync(bindingsPath(grammar)));

export const VOCABULARY_DIR = join(PACKAGES_DIR, 'types', 'src', 'vocabulary');

export type RefinementKind = 'predicate' | 'field-literal' | 'token' | 'child-pattern';

export interface RefinedClaim extends ClaimFact {
	readonly refines: string | null;
	readonly refinement: RefinementKind | null;
}

function refinementKindOf(claim: ClaimFact): RefinementKind {
	if (claim.predicates.length > 0) return 'predicate';
	if (Object.keys(claim.fieldLiterals).length > 0) return 'field-literal';
	if (claim.tokens.length > 0) return 'token';
	return 'child-pattern';
}

export function refineClaims(claims: readonly ClaimFact[]): RefinedClaim[] {
	return claims.map((claim, index) => {
		const unrefined = { ...claim, refines: null, refinement: null };
		if (claim.kind === null || claim.kind === WILDCARD) return unrefined;
		const placement = claim.within.join('/');
		const parent = claims
			.slice(0, index)
			.filter((p) => p.kind === claim.kind && p.within.join('/') === placement && claim.vocab.startsWith(`${p.vocab}.`))
			.reduce<ClaimFact | undefined>((deepest, p) => (deepest === undefined || p.vocab.length > deepest.vocab.length ? p : deepest), undefined);
		const refinement = refinementKindOf(claim);
		if (parent !== undefined) return { ...claim, refines: parent.vocab, refinement };
		return refinement === 'child-pattern' ? unrefined : { ...claim, refines: null, refinement };
	});
}

function bindSelector<S extends SlotSelector>(selector: S, rename: (kind: string) => string): S {
	return {
		...selector,
		kind: selector.kind === null ? null : rename(selector.kind),
		after: selector.after === null ? null : bindSelector(selector.after, rename)
	};
}

export function bindFacts(facts: BindingFacts, rename: (kind: string) => string): BindingFacts {
	const kind = (k: string | null): string | null => (k === null || k === WILDCARD ? k : rename(k));
	return {
		claims: facts.claims.map((c) => ({ ...c, kind: kind(c.kind), within: c.within.map(rename) })),
		members: facts.members.map((m): MemberFact => {
			if (m.route === 'presence') return { ...m, owner: rename(m.owner), via: m.via.map(rename) };
			if (m.route === 'kind') return { ...m, owner: rename(m.owner), kind: rename(m.kind) };
			if (m.route === 'nested') return { ...bindSelector(m, rename), owner: rename(m.owner), parent: rename(m.parent), via: m.via.map(rename) };
			return { ...bindSelector(m, rename), owner: rename(m.owner) };
		}),
		containers: facts.containers.map((c) => ({
			...c,
			kind: rename(c.kind),
			element: bindSelector(c.element, rename),
			captures: c.captures.map((x) => bindSelector(x, rename)),
			dropped: c.dropped.map((x) => bindSelector(x, rename))
		})),
		templates: facts.templates,
		unclaimed: facts.unclaimed.map((u) => ({ ...u, kind: rename(u.kind) }))
	};
}
