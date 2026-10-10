import { WILDCARD, type BindingFacts, type ClaimFact, type EnumMember, type ModelNode, type ModelSlot, type SlotModel, type SlotSelector, type TemplateFact } from './facts.ts';
import { camel, snake } from './names.ts';

export interface LayoutSlot {
	readonly kind: string | null;
	readonly slot: string;
}

export interface GrammarInput {
	readonly grammar: string;
	readonly bindings: BindingFacts;
	readonly model: SlotModel;
	readonly textTokens: ReadonlySet<string>;
	readonly layoutSlots: readonly LayoutSlot[];
}

export interface SlotStep {
	readonly owner: string;
	readonly slot: string;
}

export interface Pin {
	readonly member: string;
	readonly slot: string;
	readonly text: string;
}

export interface ReadEntry {
	readonly kind: string;
	readonly claimed: string;
	readonly vocab: string;
	readonly claim: ClaimFact;
	readonly index: number;
	readonly pins: readonly Pin[];
	readonly template: TemplateFact | undefined;
}

export type MemberRoute =
	| {
			readonly route: 'slot';
			readonly name: string;
			readonly slot: ModelSlot;
			readonly except?: readonly string[];
			readonly path: readonly SlotStep[];
	  }
	| { readonly route: 'kind'; readonly name: string; readonly kind: string; readonly path: readonly SlotStep[] | undefined }
	| {
			readonly route: 'presence';
			readonly name: string;
			readonly via: readonly string[];
			readonly token: string;
			readonly path: readonly SlotStep[] | undefined;
	  }
	| {
			readonly route: 'nested';
			readonly name: string;
			readonly via: readonly string[];
			readonly parent: string;
			readonly selector: SlotSelector;
			readonly slot: ModelSlot | undefined;
			readonly multiple: boolean;
			readonly path: readonly SlotStep[] | undefined;
	  };

export interface ContainerUnwrap {
	readonly kinds: readonly string[];
	readonly terminals: readonly string[];
	readonly list: boolean;
}

export interface GrammarRoutes {
	readonly grammar: string;
	readonly readEntries: ReadonlyMap<string, readonly ReadEntry[]>;
	readonly vocabOf: ReadonlyMap<string, string>;
	readonly members: ReadonlyMap<string, readonly MemberRoute[]>;
	readonly containers: ReadonlyMap<string, ContainerUnwrap>;
}

export function slotByField(slots: readonly ModelSlot[], field: string): ModelSlot | undefined {
	return slots.find((s) => s.name === field || snake(s.propertyName) === field);
}

function reaches(model: SlotModel, from: string, kind: string, seen: Set<string> = new Set<string>()): boolean {
	if (from === kind) return true;
	if (seen.has(from)) return false;
	seen.add(from);
	return (modelNode(model, from)?.subtypes ?? []).some((subtype) => reaches(model, subtype, kind, seen));
}

export function slotByKind(model: SlotModel, slots: readonly ModelSlot[], kind: string): ModelSlot | undefined {
	return slots.find((s) => s.kinds.includes(kind)) ?? slots.find((s) => s.kinds.some((k) => reaches(model, k, kind)));
}

export const holdsNodes = (slot: ModelSlot): boolean => slot.storage !== 'boolean' && slot.kinds.length > 0;

export function slotFor(model: SlotModel, slots: readonly ModelSlot[], n: SlotSelector): ModelSlot | undefined {
	if (n.field !== null) return slotByField(slots, n.field);
	if (n.kind !== null) return slotByKind(model, slots, n.kind);
	const previous = n.after === null ? undefined : slotFor(model, slots, n.after);
	return slots.slice(previous === undefined ? 0 : slots.indexOf(previous) + 1).find(holdsNodes);
}

export function modelNode(model: SlotModel, kind: string): ModelNode | undefined {
	return model.get(kind) ?? model.get(`_${kind}`);
}

export function memberNameOf(renames: ReadonlyMap<string, string>, slotName: string, propertyName: string): string {
	return camel(renames.get(slotName) ?? propertyName.replace(/_$/, '').replace(/Modifier$/, ''));
}

export function isLayout(input: GrammarInput, owner: string, slot: ModelSlot): boolean {
	return (
		input.layoutSlots.some((l) => (l.kind === null || l.kind === owner) && l.slot === slot.name) ||
		(slot.kinds.length > 0 &&
			slot.terminals.length === 0 &&
			slot.kinds.every((k) => input.bindings.unclaimed.some((u) => u.kind === k)))
	);
}

const TRANSPARENT_MODEL_TYPES: ReadonlySet<string> = new Set(['envelope', 'alias', 'polymorph']);

function containerOf(input: GrammarInput, node: ModelNode): ContainerUnwrap | undefined {
	const declared = input.bindings.containers.find((c) => c.kind === node.kind);
	if (declared === undefined && node.modelType === 'list') return { kinds: node.elementKinds, terminals: [], list: true };
	const content = node.slots.filter((slot) => !isLayout(input, node.kind, slot));
	const element = declared
		? slotFor(input.model, node.slots, declared.element)
		: TRANSPARENT_MODEL_TYPES.has(node.modelType) && content.length === 1
			? content[0]
			: undefined;
	return element !== undefined && holdsNodes(element)
		? { kinds: element.kinds, terminals: element.terminals, list: element.multiple }
		: undefined;
}

function pinsOf(node: ModelNode | undefined, claim: ClaimFact, renames: ReadonlyMap<string, string>): Pin[] {
	const slots = node?.slots ?? [];
	const literals: [string, string][] = Object.entries(claim.fieldLiterals);
	for (const text of claim.tokens) {
		const pinned = slots.find((s) => s.terminals.includes(text));
		if (pinned && !literals.some(([field]) => field === pinned.name)) literals.push([pinned.name, text]);
	}
	return literals.map(([field, text]) => {
		const slot = slotByField(slots, field);
		return { member: memberNameOf(renames, slot?.name ?? field, slot?.propertyName ?? field), slot: slot?.name ?? field, text };
	});
}

const specificity = (entry: ReadEntry): number => {
	const placed = entry.claim.within.length > 0;
	const predicated = entry.claim.predicates.length > 0;
	const literal = entry.pins.length > 0 || entry.claim.tokens.length > 0;
	return placed && predicated ? 0 : predicated ? 1 : placed ? 2 : literal ? 3 : 4;
};

function viaPath(model: SlotModel, owner: string, via: readonly string[]): { readonly steps: SlotStep[]; readonly at: ModelNode } | undefined {
	let at = modelNode(model, owner);
	const steps: SlotStep[] = [];
	for (const kind of [...via].reverse()) {
		const slot = at === undefined ? undefined : slotByKind(model, at.slots, kind);
		const next = modelNode(model, kind);
		if (at === undefined || slot === undefined || next === undefined || slot.multiple) return undefined;
		steps.push({ owner: at.kind, slot: slot.name });
		at = next;
	}
	return at === undefined ? undefined : { steps, at };
}

function membersOf(input: GrammarInput, kind: string, renames: ReadonlyMap<string, string>): MemberRoute[] {
	const node = modelNode(input.model, kind);
	if (node === undefined) return [];
	const deep = input.bindings.members.filter((m) => m.owner === kind && m.route !== 'rename');
	const via = new Set(deep.flatMap((m) => (m.route === 'presence' || m.route === 'nested' ? m.via : [])));
	const routes: MemberRoute[] = [];
	for (const slot of node.slots) {
		if (isLayout(input, kind, slot)) continue;
		const except = slot.kinds.filter((k) => via.has(k));
		if (except.length > 0 && except.length === slot.kinds.length) continue;
		const name = memberNameOf(renames, slot.name, slot.propertyName);
		const path = [{ owner: kind, slot: slot.name }];
		routes.push(
			except.length === 0
				? { route: 'slot', name, slot, path }
				: { route: 'slot', name, slot: { ...slot, kinds: slot.kinds.filter((k) => !via.has(k)) }, except, path }
		);
	}
	for (const member of deep) {
		const chain = member.route === 'presence' || member.route === 'nested' ? viaPath(input.model, kind, member.via) : undefined;
		switch (member.route) {
			case 'kind': {
				const named = routes.find((r) => r.route === 'slot' && r.name === camel(member.member));
				routes.push({ route: 'kind', name: camel(member.name), kind: member.kind, path: named?.route === 'slot' ? named.path : undefined });
				break;
			}
			case 'presence': {
				const leaf = chain?.at.slots.find((s) => s.terminals.includes(member.token));
				routes.push({
					route: 'presence',
					name: camel(member.name),
					via: member.via,
					token: member.token,
					path: chain && leaf ? [...chain.steps, { owner: chain.at.kind, slot: leaf.name }] : undefined
				});
				break;
			}
			case 'nested': {
				const parent = modelNode(input.model, member.parent);
				const slot = parent ? slotFor(input.model, parent.slots, member) : undefined;
				routes.push({
					route: 'nested',
					name: camel(member.name),
					via: member.via,
					parent: member.parent,
					selector: member,
					slot,
					multiple: member.multiple,
					path: chain && parent && slot ? [...chain.steps, { owner: parent.kind, slot: slot.name }] : undefined
				});
				break;
			}
		}
	}
	return routes;
}

function concreteKinds(model: SlotModel, kind: string, seen: Set<string> = new Set<string>()): string[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	const subtypes = modelNode(model, kind)?.subtypes ?? [];
	return subtypes.length === 0 ? [kind] : subtypes.flatMap((subtype) => concreteKinds(model, subtype, seen));
}

function admittedKinds(model: SlotModel, claim: ClaimFact): string[] {
	const holder = claim.within[0];
	if (holder === undefined || holder === WILDCARD)
		throw new Error(`bindings: the wildcard claim @${claim.vocab} has no enclosing kind to read its kinds from`);
	const node = modelNode(model, holder);
	const slots = node?.slots ?? [];
	const admitted =
		claim.field === null
			? [...slots.filter(holdsNodes).flatMap((slot) => slot.kinds), ...(node?.elementKinds ?? [])]
			: (slotByField(slots, claim.field)?.kinds ?? []);
	const seen = new Set<string>();
	return [...new Set(admitted.flatMap((kind) => concreteKinds(model, kind, seen)))].sort();
}

function ownTextEquals(claim: ClaimFact): readonly string[] {
	return [
		...claim.tokens,
		...claim.predicates.flatMap((p) => {
			const [argument, ...rest] = p.arguments;
			const own = p.subject !== null && p.subject.up === 0 && p.subject.down.length === 0;
			return own && p.operator === 'eq' && argument !== undefined && 'text' in argument && rest.length === 0 ? [argument.text] : [];
		})
	];
}

function readKinds(model: SlotModel, kind: string, claim: ClaimFact): readonly string[] {
	const members = modelNode(model, kind)?.enumMembers ?? [];
	if (members.length === 0) return [kind];
	const texts = ownTextEquals(claim);
	return members.filter((member: EnumMember) => texts.every((text) => text === member.text)).map((member) => member.kind);
}

export function resolveRoutes(input: GrammarInput): GrammarRoutes {
	const renames = new Map<string, Map<string, string>>();
	for (const member of input.bindings.members) {
		if (member.route !== 'rename') continue;
		const slot = slotFor(input.model, modelNode(input.model, member.owner)?.slots ?? [], member);
		if (slot !== undefined)
			(renames.get(member.owner) ?? renames.set(member.owner, new Map<string, string>()).get(member.owner))?.set(slot.name, member.name);
	}
	const renamesOf = (kind: string): ReadonlyMap<string, string> => renames.get(kind) ?? new Map<string, string>();

	const readEntries = new Map<string, ReadEntry[]>();
	const claimsOwn = new Set(input.bindings.claims.flatMap((c) => (c.kind === null || c.kind === WILDCARD ? [] : [`${c.kind} ${c.vocab}`])));
	input.bindings.claims.forEach((claim, index) => {
		if (claim.kind === null) return;
		const kinds = claim.kind === WILDCARD ? admittedKinds(input.model, claim).filter((kind) => !claimsOwn.has(`${kind} ${claim.vocab}`)) : [claim.kind];
		for (const [claimed, kind] of kinds.flatMap((k) => readKinds(input.model, k, claim).map((read) => [k, read] as const))) {
			const entry: ReadEntry = {
				kind,
				claimed,
				vocab: claim.vocab,
				claim,
				index,
				pins: pinsOf(modelNode(input.model, kind), claim, renamesOf(kind)),
				template: input.bindings.templates.find((t) => t.vocabs.includes(claim.vocab))
			};
			(readEntries.get(kind) ?? readEntries.set(kind, []).get(kind))?.push(entry);
		}
	});

	const vocabOf = new Map<string, string>();
	for (const [kind, entries] of readEntries) {
		const top = entries.filter((e) => e.claim.toplevel);
		const plain = top.find((e) => e.claim.predicates.length === 0 && e.pins.length === 0);
		const first = plain ?? top[0];
		if (first) vocabOf.set(kind, first.vocab);
	}
	for (const entries of readEntries.values()) entries.sort((a, b) => specificity(a) - specificity(b) || b.pins.length - a.pins.length || a.index - b.index);

	const members = new Map<string, MemberRoute[]>();
	for (const kind of readEntries.keys()) members.set(kind, membersOf(input, kind, renamesOf(kind)));

	const containers = new Map<string, ContainerUnwrap>();
	for (const node of input.model.values()) {
		const unwrap = containerOf(input, node);
		if (unwrap !== undefined) containers.set(node.kind, unwrap);
	}

	return { grammar: input.grammar, readEntries, vocabOf, members, containers };
}
