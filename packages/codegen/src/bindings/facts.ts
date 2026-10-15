import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ErrorRegion } from '@sittir/types';
import { bindMatch, type LeadMatch } from '../dsl/bind.ts';
import { allGrammars, grammarPackageDir, PACKAGES_DIR, type GrammarName } from '../grammars.ts';

export const WILDCARD = '_';

export type Anchor = 'first' | 'last' | 'only';

export interface Adjacent {
	readonly previous?: SlotSelector;
	readonly next?: SlotSelector;
}

export interface SlotSelector {
	readonly field: string | null;
	readonly kind: string | null;
	readonly after: SlotSelector | null;
	readonly anchor: Anchor | null;
	readonly adjacent?: Adjacent;
}

export interface Sibling {
	readonly selector: SlotSelector;
	readonly bare: boolean;
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

export type ChildFact =
	| { readonly subject: CaptureSite; readonly kinds: readonly string[]; readonly captured: boolean }
	| { readonly subject: CaptureSite; readonly text: string }
	| { readonly subject: CaptureSite; readonly token: string }
	| { readonly subject: CaptureSite; readonly present: true }
	| { readonly subject: CaptureSite; readonly siblings: readonly Sibling[] };
export type MatchRead = { readonly match: LeadMatch } | { readonly refused: string };

export type LeadLeadMatch = { readonly line: number } & MatchRead;

export interface ClaimFact {
	readonly vocab: string;
	readonly kind: string | null;
	readonly field: string | null;
	readonly predicates: readonly PredicateFact[];
	readonly toplevel: boolean;
	readonly within: readonly string[];
	readonly fieldLiterals: Readonly<Record<string, string>>;
	readonly tokens: readonly string[];
	readonly children: readonly ChildFact[];
	readonly flag?: string;
	readonly match?: LeadMatch;
}

export interface UnclaimedFact {
	readonly kind: string;
	readonly reason: string | null;
}

export type MemberFact = MemberRouteFact & { readonly claims?: readonly number[]; readonly leadMatch?: LeadLeadMatch };

type MemberRouteFact =
	| ({
			readonly route: 'rename';
			readonly owner: string;
			readonly name: string;
			readonly token?: string;
			readonly flag?: boolean;
	  } & SlotSelector)
	| ({ readonly route: 'dropped'; readonly owner: string; readonly token?: string } & SlotSelector)
	| {
			readonly route: 'presence';
			readonly owner: string;
			readonly name: string;
			readonly token: string;
			readonly via: readonly SlotSelector[];
	  }
	| {
			readonly route: 'kind';
			readonly owner: string;
			readonly name: string;
			readonly member: string;
			readonly kind: string;
	  }
	| ({
			readonly route: 'nested';
			readonly owner: string;
			readonly name: string;
			readonly parent: string;
			readonly multiple: boolean;
			readonly via: readonly SlotSelector[];
	  } & SlotSelector);

export type NamedMemberFact = Exclude<MemberFact, { readonly route: 'dropped' }>;

export const isNamedMember = (member: MemberFact): member is NamedMemberFact => member.route !== 'dropped';

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
	readonly variantOf: string | null;
	readonly shownAs: readonly string[];
}

const FIXED_TEXT_MODEL_TYPES: ReadonlySet<string> = new Set(['keyword', 'punctuation']);

export const isFixedText = (node: ModelNode | undefined): node is ModelNode & { readonly text: string } =>
	node !== undefined && FIXED_TEXT_MODEL_TYPES.has(node.modelType) && node.text !== null;

const IDENTIFIER = 'identifier';

export const isIdentifierPath = (vocab: string): boolean => vocab === IDENTIFIER || vocab.startsWith(`${IDENTIFIER}.`);

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
	'not-any-of',
	'kind-eq',
	'not-kind-eq'
]);

export const KIND_PREDICATE_OPERATORS: ReadonlySet<string> = new Set(['kind-eq', 'not-kind-eq']);

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

const untested = (claim: ClaimFact): boolean =>
	claim.predicates.length === 0 && Object.keys(claim.fieldLiterals).length === 0 && claim.tokens.length === 0 && claim.children.length === 0;

function refinementKindOf(claim: ClaimFact): RefinementKind {
	if (claim.predicates.length > 0) return 'predicate';
	if (Object.keys(claim.fieldLiterals).length > 0) return 'field-literal';
	if (claim.tokens.length > 0) return 'token';
	return 'child-pattern';
}

export function refineClaims(claims: readonly ClaimFact[], formsOf: (kind: string) => readonly string[]): RefinedClaim[] {
	return claims.map((claim) => {
		const unrefined = { ...claim, refines: null, refinement: null };
		const kind = claim.kind;
		if (kind === null || kind === WILDCARD) return unrefined;
		const placement = claim.within.join('/');
		const parent = claims
			.filter((p) => p.kind !== null && p.kind !== WILDCARD && formsOf(p.kind).includes(kind) && p.within.join('/') === placement && claim.vocab.startsWith(`${p.vocab}.`))
			.reduce<ClaimFact | undefined>((deepest, p) => (deepest === undefined || p.vocab.length > deepest.vocab.length ? p : deepest), undefined);
		const refinement = refinementKindOf(claim);
		if (parent !== undefined) return { ...claim, refines: parent.vocab, refinement: parent.kind !== kind && untested(claim) ? null : refinement };
		return refinement === 'child-pattern' ? unrefined : { ...claim, refines: null, refinement };
	});
}

type FieldNameOf = (owner: string, field: string) => string;

const unchangedField: FieldNameOf = (_owner, field) => field;

function bindField(owner: string | null, field: string, fieldNameOf: FieldNameOf): string {
	return owner === null ? field : fieldNameOf(owner, field);
}

function bindSelector<S extends SlotSelector>(
	selector: S,
	rename: (kind: string) => string,
	fieldNameOf: FieldNameOf,
	owner: string | null
): S {
	const { adjacent } = selector;
	return {
		...selector,
		field: selector.field === null ? null : bindField(owner, selector.field, fieldNameOf),
		kind: selector.kind === null ? null : rename(selector.kind),
		after: selector.after === null ? null : bindSelector(selector.after, rename, fieldNameOf, owner),
		...(adjacent === undefined
			? {}
			: {
					adjacent: {
						...(adjacent.previous && { previous: bindSelector(adjacent.previous, rename, fieldNameOf, owner) }),
						...(adjacent.next && { next: bindSelector(adjacent.next, rename, fieldNameOf, owner) })
					}
				})
	};
}

function bindPath(
	path: readonly SlotSelector[],
	owner: string | null,
	rename: (kind: string) => string,
	fieldNameOf: FieldNameOf
): readonly SlotSelector[] {
	let parent = owner;
	return path.map((step) => {
		const bound = bindSelector(step, rename, fieldNameOf, parent);
		parent = step.kind;
		return bound;
	});
}

function siteRootKind(site: CaptureSite, claim: ClaimFact): string | null {
	return site.up === 0 ? claim.kind : (claim.within[site.up - 1] ?? null);
}

function siteTargetKind(site: CaptureSite, claim: ClaimFact): string | null {
	return site.down.length === 0 ? siteRootKind(site, claim) : site.down[site.down.length - 1]!.kind;
}

function bindSite(
	site: CaptureSite,
	claim: ClaimFact,
	rename: (kind: string) => string,
	fieldNameOf: FieldNameOf
): CaptureSite {
	return { ...site, down: bindPath(site.down, siteRootKind(site, claim), rename, fieldNameOf) };
}

function bindMember(m: MemberFact, rename: (kind: string) => string, fieldNameOf: FieldNameOf): MemberFact {
	if (m.route === 'presence')
		return { ...m, owner: rename(m.owner), via: bindPath(m.via, m.owner, rename, fieldNameOf) };
	if (m.route === 'kind') return { ...m, owner: rename(m.owner), kind: rename(m.kind) };
	if (m.route === 'nested')
		return {
			...bindSelector(m, rename, fieldNameOf, m.parent),
			owner: rename(m.owner),
			parent: rename(m.parent),
			via: bindPath(m.via, m.owner, rename, fieldNameOf)
		};
	return { ...bindSelector(m, rename, fieldNameOf, m.owner), owner: rename(m.owner) };
}

const bindLeadMatch = (
	lead: LeadLeadMatch,
	rename: (kind: string) => string,
	fieldNameOf: FieldNameOf
): LeadLeadMatch => ('match' in lead ? { ...lead, match: bindMatch(lead.match, rename, fieldNameOf) } : lead);

function bindClaim(claim: ClaimFact, rename: (kind: string) => string, fieldNameOf: FieldNameOf): ClaimFact {
	return {
		...claim,
		...(claim.match === undefined ? {} : { match: bindMatch(claim.match, rename, fieldNameOf) }),
		kind: claim.kind === null || claim.kind === WILDCARD ? claim.kind : rename(claim.kind),
		field: claim.field === null ? null : bindField(claim.within[0] ?? null, claim.field, fieldNameOf),
		within: claim.within.map(rename),
		fieldLiterals: Object.fromEntries(
			Object.entries(claim.fieldLiterals).map(([name, value]) => [bindField(claim.kind, name, fieldNameOf), value])
		),
		predicates: claim.predicates.map((p) => ({
			...p,
			subject: p.subject === null ? null : bindSite(p.subject, claim, rename, fieldNameOf),
			arguments: KIND_PREDICATE_OPERATORS.has(p.operator)
				? p.arguments.map((a) => ('text' in a ? { text: rename(a.text) } : a))
				: p.arguments
		})),
		children: claim.children.map((child) => ({
			...child,
			subject: bindSite(child.subject, claim, rename, fieldNameOf),
			...('kinds' in child ? { kinds: child.kinds.map(rename) } : {}),
			...('siblings' in child
				? {
						siblings: child.siblings.map((sibling) => ({
							...sibling,
							selector: bindSelector(sibling.selector, rename, fieldNameOf, siteTargetKind(child.subject, claim))
						}))
					}
				: {})
		}))
	};
}

export function bindFacts(
	facts: BindingFacts,
	rename: (kind: string) => string,
	fieldNameOf: FieldNameOf = unchangedField
): BindingFacts {
	return {
		claims: facts.claims.map((claim) => bindClaim(claim, rename, fieldNameOf)),
		members: facts.members.map(
			(m): MemberFact =>
				m.leadMatch === undefined
					? bindMember(m, rename, fieldNameOf)
					: { ...bindMember(m, rename, fieldNameOf), leadMatch: bindLeadMatch(m.leadMatch, rename, fieldNameOf) }
		),
		containers: facts.containers.map((c) => ({
			...c,
			kind: rename(c.kind),
			element: bindSelector(c.element, rename, fieldNameOf, c.kind),
			captures: c.captures.map((x) => bindSelector(x, rename, fieldNameOf, c.kind)),
			dropped: c.dropped.map((x) => bindSelector(x, rename, fieldNameOf, c.kind))
		})),
		templates: facts.templates,
		unclaimed: facts.unclaimed.map((u) => ({ ...u, kind: rename(u.kind) }))
	};
}
