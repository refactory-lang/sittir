import type { LeadEffect, LeadMatch } from '../dsl/verbs/effects.ts';
import { bindFacts, type BindingFacts, type CaptureSite, type ChildFact, type ClaimFact, type SlotFact, type SlotModel, type SlotSelector } from './facts.ts';
import { concreteKinds, formsOf, heldInto, heldSteps, holdsCapture, holdsContainer, reachedBy, shownSlots } from './routes.ts';

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

const isHeadSlot = (slot: SlotFact, effect: LeadEffect): boolean =>
	slot.route === 'nested' &&
	slot.parent === effect.list &&
	slot.name === effect.field &&
	slot.leadMatch !== undefined;

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

const passesList = (slot: SlotFact, effect: LeadEffect): boolean => slot.route === 'nested' && slot.via.some((step) => step.kind === effect.list);

type SelectorPath = readonly SlotSelector[];

const distinctPaths = (paths: readonly SelectorPath[]): readonly SelectorPath[] => [...new Map(paths.map((path) => [JSON.stringify(path), path])).values()];

const nextKinds = (model: SlotModel, at: string, step: SlotSelector): readonly string[] => heldInto(model, at, step)?.next.map((next) => next.kind) ?? [];

const heldAlong = (model: SlotModel, at: string, steps: SelectorPath): readonly string[] =>
	steps.reduce<readonly string[]>((ats, step) => ats.flatMap((from) => nextKinds(model, from, step)), [at]);

function intoList(model: SlotModel, at: string, effect: LeadEffect, seen: ReadonlySet<string> = new Set([at])): readonly SelectorPath[] {
	const minted = [effect.receiver, effect.group];
	return shownSlots(model, at).flatMap((slot): SelectorPath[] =>
		slot.kinds.some((kind) => reachedBy(model, kind, effect.list).length > 0)
			? [[selector(effect.list, slot.name)]]
			: slot.kinds
					.filter((k) => minted.includes(k) && !seen.has(k))
					.flatMap((kind) => intoList(model, kind, effect, new Set([...seen, kind])).map((rest) => [selector(kind), ...rest]))
	);
}

function headWalk(model: SlotModel, form: string, path: SelectorPath, effect: LeadEffect): readonly SelectorPath[] {
	const walk = (at: string, parent: string | null, inside: boolean, index: number): readonly SelectorPath[] => {
		const step = path[index];
		if (step === undefined) return [[]];
		const below = parent === effect.list;
		const within = below ? isLead(step) : inside;
		const prefixes = below && !within ? intoList(model, at, effect) : [[]];
		const taken = below
			? within ? receiverSelector(step, effect) : restSelector(step)
			: step.kind === effect.list ? { ...step, kind: effect.receiver }
				: within && step.kind !== null ? { ...step, kind: effect.variants[step.kind] ?? step.kind } : step;
		return prefixes.flatMap((prefix) =>
			heldAlong(model, at, prefix).flatMap((held): SelectorPath[] =>
				index === path.length - 1
					? heldSteps(model, held, taken) === undefined ? [] : [[...prefix, taken]]
					: nextKinds(model, held, taken).flatMap((next) => walk(next, step.kind, within, index + 1).map((rest) => [...prefix, taken, ...rest]))
			)
		);
	};
	return distinctPaths(walk(form, form, form in effect.variants, 0));
}

function heldPaths(model: SlotModel, at: string, steps: SelectorPath): readonly SelectorPath[] {
	const [step, ...rest] = steps;
	if (step === undefined) return [[]];
	if (rest.length === 0) return heldSteps(model, at, step) === undefined ? [] : [[step]];
	const kinds = step.kind !== null ? [step.kind] : concreteKinds(model, heldSteps(model, at, step)?.at(-1)?.slot.kinds ?? []);
	return kinds.flatMap((kind) => {
		const taken = { ...step, kind };
		return nextKinds(model, at, taken).flatMap((next) => heldPaths(model, next, rest).map((path) => [taken, ...path]));
	});
}

const slotAlong = (slot: Extract<SlotFact, { readonly route: 'nested' }>, path: SelectorPath): SlotFact => ({
	...slot,
	parent: path.at(-2)?.kind ?? slot.parent,
	via: path.slice(0, -1).toReversed()
});

function heldSlots(slot: SlotFact, model: SlotModel): readonly SlotFact[] {
	if (slot.route !== 'nested' || slot.via.every((step) => step.kind !== null)) return [slot];
	const steps = [...slot.via.toReversed(), slot];
	const paths = distinctPaths(formsOf(model, slot.owner).flatMap((form) => heldPaths(model, form, steps)));
	return paths.length === 0 ? [slot] : paths.map((path) => slotAlong(slot, path));
}

export function expandHeldSlots(facts: BindingFacts, model: SlotModel): BindingFacts {
	return { ...facts, slots: facts.slots.flatMap((slot) => heldSlots(slot, model)) };
}

function headSlots(slot: SlotFact, effect: LeadEffect, model: SlotModel): readonly SlotFact[] {
	if (slot.route !== 'nested') return [];
	const steps = [...slot.via.toReversed(), slot];
	return distinctPaths(formsOf(model, slot.owner).flatMap((form) => headWalk(model, form, steps, effect))).flatMap((path) => {
		const last = path.at(-1);
		if (last === undefined) return [];
		const { field, kind, after, anchor, adjacent } = last;
		return [slotAlong({ ...slot, field, kind, after, anchor, adjacent }, path)];
	});
}

interface ClaimIndices {
	readonly plain: readonly number[];
	readonly head: readonly number[];
}

function slotWithClaims(slot: SlotFact, indices: ReadonlyMap<number, ClaimIndices>, side: keyof ClaimIndices | 'both'): SlotFact | undefined {
	if (slot.claims === undefined) return slot;
	const claims = [...new Set(slot.claims.flatMap((index) => {
		const projected = indices.get(index);
		return projected === undefined ? [] : side === 'both' ? [...projected.plain, ...projected.head] : projected[side];
	}))];
	return claims.length === 0 ? undefined : { ...slot, claims };
}

function projectedSlots(facts: BindingFacts, variants: BindingFacts, effect: LeadEffect, indices: ReadonlyMap<number, ClaimIndices>, model: SlotModel): readonly SlotFact[] {
	return facts.slots.flatMap((fact, index): SlotFact[] => {
		if (passesList(fact, effect)) {
			return [
				...(isHeadSlot(fact, effect) ? [] : [slotWithClaims(fact, indices, 'plain')]),
				...headSlots(fact, effect, model).map((head) => slotWithClaims(head, indices, 'head'))
			].filter((slot) => slot !== undefined);
		}
		if (fact.owner in effect.variants) {
			const copy = variants.slots[index]!;
			const held = !((copy.route === 'rename' && copy.flag !== true) || copy.route === 'dropped') || holdsCapture(model, copy);
			return [slotWithClaims(fact, indices, 'plain'), held ? slotWithClaims(copy, indices, 'head') : undefined].filter((slot) => slot !== undefined);
		}
		const unchanged = slotWithClaims(fact, indices, 'both');
		return unchanged === undefined ? [] : [unchanged];
	});
}

function projectLead(facts: BindingFacts, effect: LeadEffect, model: SlotModel, shortened: ReadonlySet<string>): BindingFacts {
	const variants = bindFacts(facts, (kind) => effect.variants[kind] ?? kind, shortened);
	const claims: ClaimFact[] = [];
	const indices = new Map<number, ClaimIndices>();
	const receiverClaims = new Set(
		facts.slots.filter((slot) => isHeadSlot(slot, effect)).flatMap((slot) => slot.claims ?? [])
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
		slots: projectedSlots(facts, variants, effect, indices, model),
		containers: [...facts.containers, ...variants.containers.filter((copy, index) => facts.containers[index]!.kind in effect.variants && holdsContainer(model, copy))],
		unclaimed: [...facts.unclaimed, ...variants.unclaimed.filter((_, index) => facts.unclaimed[index]!.kind in effect.variants)]
	};
}

export function projectLeadFacts(facts: BindingFacts, effects: readonly LeadEffect[], model: SlotModel, shortened: ReadonlySet<string>): BindingFacts {
	return effects.reduce((projected, effect) => projectLead(projected, effect, model, shortened), facts);
}
