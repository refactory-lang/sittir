import type { LeadEffect, LeadMatch } from '../dsl/verbs/effects.ts';
import { bindFacts, type BindingFacts, type CaptureSite, type ChildFact, type ClaimFact, type MemberFact, type SlotSelector } from './facts.ts';

const selector = (kind: string, field: string | null = null): SlotSelector => ({
	field,
	kind,
	after: null,
	anchor: null
});

function receiverSelector(step: SlotSelector, effect: LeadEffect): SlotSelector {
	return {
		field: effect.field,
		kind: step.kind === null ? null : (effect.variants[step.kind] ?? step.kind),
		after: null,
		anchor: null
	};
}

const isLead = (step: SlotSelector): boolean => step.anchor === 'first';

const restSelector = (step: SlotSelector): SlotSelector => ({
	...step,
	after: step.after !== null && isLead(step.after) ? null : step.after
});

const restPrefix = (effect: LeadEffect): readonly SlotSelector[] => [selector(effect.group), selector(effect.list, effect.restField)];

function headPath(path: readonly SlotSelector[], root: string | null, effect: LeadEffect): readonly SlotSelector[] {
	let parent = root;
	let inside = root !== null && root in effect.variants;
	return path.flatMap((step) => {
		const below = parent === effect.list;
		parent = step.kind;
		if (below) inside = isLead(step);
		if (below) return inside ? [receiverSelector(step, effect)] : [...restPrefix(effect), restSelector(step)];
		if (step.kind === effect.list) return [{ ...step, kind: effect.receiver }];
		return [inside && step.kind !== null ? { ...step, kind: effect.variants[step.kind] ?? step.kind } : step];
	});
}

const siteRoot = (site: CaptureSite, claim: ClaimFact): string | null =>
	site.up === 0 ? claim.kind : (claim.within[site.up - 1] ?? null);

function headSite(site: CaptureSite, claim: ClaimFact, effect: LeadEffect): CaptureSite {
	return {
		...site,
		down: headPath(site.down, siteRoot(site, claim), effect)
	};
}

function headChild(child: ChildFact, claim: ClaimFact, effect: LeadEffect): readonly ChildFact[] {
	const subject = headSite(child.subject, claim, effect);
	if ('siblings' in child) {
		if ((child.subject.down.at(-1)?.kind ?? siteRoot(child.subject, claim)) !== effect.list) return [{ ...child, subject }];
		const rest = child.siblings.filter((sibling) => !isLead(sibling.selector));
		return rest.length === 0 ? [] : [{ subject: { ...subject, down: [...subject.down, ...restPrefix(effect)] }, siblings: rest.map((sibling) => ({ ...sibling, selector: restSelector(sibling.selector) })) }];
	}
	const original = child.subject.down.at(-1)?.kind;
	const target = subject.down.at(-1)?.kind;
	return [
		{
			...child,
			subject,
			...('kinds' in child
				? {
						kinds: child.kinds.map((kind) =>
							kind === original && target !== null && target !== undefined ? target : kind
						)
					}
				: {})
		}
	];
}

const isHeadMember = (member: MemberFact, effect: LeadEffect): boolean =>
	member.route === 'nested' &&
	member.parent === effect.list &&
	member.name === effect.field &&
	member.leadMatch !== undefined;

function matchesNamed(admits: readonly LeadMatch[], kind: string): readonly LeadMatch[] {
	return admits.flatMap((match) => [
		...(match.kind === kind ? [match] : []),
		...matchesNamed(match.within?.admits ?? [], kind)
	]);
}

function guaranteedHeadChild(child: ChildFact, claim: ClaimFact, effect: LeadEffect): boolean {
	if (!('kinds' in child) || child.subject.up !== 0) return false;
	const path = child.subject.down;
	const listAt = path.findIndex((step) => step.kind === effect.list);
	let matches = listAt < 0 ? matchesNamed(effect.admits, claim.kind ?? '') : effect.admits;
	const remaining = listAt < 0 ? path : path.slice(listAt + 1);
	if (listAt >= 0 && remaining[0] !== undefined && !isLead(remaining[0])) return false;
	for (const [index, step] of remaining.entries()) {
		if (listAt >= 0 && index === 0) matches = matches.filter((match) => match.kind === step.kind);
		else {
			if (
				matches.length === 0 ||
				matches.some((match) => match.within === undefined || match.within.field !== step.field)
			)
				return false;
			const admitted = matches.flatMap((match) => match.within!.admits);
			if (index === remaining.length - 1)
				return admitted.length > 0 && admitted.every((match) => child.kinds.includes(match.kind));
			matches = admitted.filter((match) => match.kind === step.kind);
		}
		if (matches.length === 0) return false;
	}
	return false;
}

function headClaim(claim: ClaimFact, effect: LeadEffect): ClaimFact {
	return {
		...claim,
		kind:
			claim.kind === effect.list
				? effect.receiver
				: claim.kind === null
					? null
					: (effect.variants[claim.kind] ?? claim.kind),
		within: claim.within.map((kind) => (kind === effect.list ? effect.receiver : (effect.variants[kind] ?? kind))),
		children: claim.children
			.filter((child) => !guaranteedHeadChild(child, claim, effect))
			.flatMap((child) => headChild(child, claim, effect)),
		predicates: claim.predicates.map((predicate) => ({
			...predicate,
			subject: predicate.subject === null ? null : headSite(predicate.subject, claim, effect)
		}))
	};
}

function headMember(member: MemberFact, effect: LeadEffect): MemberFact | undefined {
	if (member.route !== 'nested' || !member.via.some((step) => step.kind === effect.list)) return undefined;
	const path = headPath([...member.via.toReversed(), member], member.owner, effect);
	const { field, kind, after, anchor, adjacent } = path.at(-1)!;
	return { ...member, field, kind, after, anchor, adjacent, parent: path.at(-2)?.kind ?? member.parent, via: path.slice(0, -1).toReversed() };
}

interface ClaimIndices {
	readonly plain: readonly number[];
	readonly head: readonly number[];
}

function memberWithClaims(member: MemberFact, indices: ReadonlyMap<number, ClaimIndices>, side: keyof ClaimIndices | 'both'): MemberFact | undefined {
	if (member.claims === undefined) return member;
	const claims = [...new Set(member.claims.flatMap((index) => {
		const projected = indices.get(index);
		return projected === undefined ? [] : side === 'both' ? [...projected.plain, ...projected.head] : projected[side];
	}))];
	return claims.length === 0 ? undefined : { ...member, claims };
}

function projectedMembers(facts: BindingFacts, variants: BindingFacts, effect: LeadEffect, indices: ReadonlyMap<number, ClaimIndices>): readonly MemberFact[] {
	return facts.members.flatMap((member, index): MemberFact[] => {
		const head = headMember(member, effect);
		if (head !== undefined) return [
			...(isHeadMember(member, effect) ? [] : [memberWithClaims(member, indices, 'plain')]),
			memberWithClaims(head, indices, 'head')
		].filter((member) => member !== undefined);
		if (member.owner in effect.variants) return [
			memberWithClaims(member, indices, 'plain'), memberWithClaims(variants.members[index]!, indices, 'head')
		].filter((member) => member !== undefined);
		const unchanged = memberWithClaims(member, indices, 'both');
		return unchanged === undefined ? [] : [unchanged];
	});
}

function projectLead(facts: BindingFacts, effect: LeadEffect): BindingFacts {
	const variants = bindFacts(facts, (kind) => effect.variants[kind] ?? kind);
	const claims: ClaimFact[] = [];
	const indices = new Map<number, ClaimIndices>();
	const receiverClaims = new Set(
		facts.members.filter((member) => isHeadMember(member, effect)).flatMap((member) => member.claims ?? [])
	);
	for (const [index, claim] of facts.claims.entries()) {
		const projected = receiverClaims.has(index)
			? [headClaim(claim, effect)]
			: claim.kind !== null && claim.kind in effect.variants
				? [claim, headClaim(claim, effect)]
				: [claim];
		indices.set(
			index,
			receiverClaims.has(index) ? { plain: [], head: [claims.length] }
				: projected.length === 2 ? { plain: [claims.length], head: [claims.length + 1] }
					: { plain: [claims.length], head: [claims.length] }
		);
		claims.push(...projected);
	}
	return {
		...facts,
		claims,
		members: projectedMembers(facts, variants, effect, indices),
		containers: [...facts.containers, ...variants.containers.filter((_, index) => facts.containers[index]!.kind in effect.variants)],
		unclaimed: [...facts.unclaimed, ...variants.unclaimed.filter((_, index) => facts.unclaimed[index]!.kind in effect.variants)]
	};
}

export function projectLeadFacts(facts: BindingFacts, effects: readonly LeadEffect[]): BindingFacts {
	return effects.reduce(projectLead, facts);
}
