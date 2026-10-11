import { WILDCARD, isFixedText, isIdentifierPath, type Anchor, type BindingFacts, type CaptureSite, type ChildFact, type ClaimFact, type EnumMember, type ModelNode, type ModelSlot, type SlotModel, type SlotSelector, type TemplateFact } from './facts.ts';
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
	readonly anchor?: Anchor;
}

const stepOf = (owner: string, slot: string, anchor: Anchor | null): SlotStep =>
	anchor === null ? { owner, slot } : { owner, slot, anchor };

export interface Pin {
	readonly member: string;
	readonly slot: string;
	readonly text: string;
}

export type ChildTest =
	| { readonly subject: CaptureSite; readonly kinds: readonly string[] }
	| { readonly subject: CaptureSite; readonly excludes: readonly string[] }
	| { readonly subject: CaptureSite; readonly text: string };

export interface ReadEntry {
	readonly kind: string;
	readonly claimed: string;
	readonly vocab: string;
	readonly claim: ClaimFact;
	readonly index: number;
	readonly pins: readonly Pin[];
	readonly children: readonly ChildTest[];
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
			readonly via: readonly SlotSelector[];
			readonly token: string;
			readonly path: readonly SlotStep[] | undefined;
	  }
	| {
			readonly route: 'nested';
			readonly name: string;
			readonly via: readonly SlotSelector[];
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

const shownKinds = (model: SlotModel, kind: string): readonly string[] => [kind, ...[...model.values()].filter((node) => node.shownAs.includes(kind)).map((node) => node.kind)];

function reaches(model: SlotModel, from: string, kind: string, seen: Set<string> = new Set<string>()): boolean {
	if (from === kind || modelNode(model, from)?.shownAs.includes(kind)) return true;
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

export type SlotNames = ReadonlyMap<string, string | null>;

export function memberNameOf(renames: SlotNames, slotName: string, propertyName: string): string {
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

const textOfKind = (model: SlotModel, kind: string): string | undefined => {
	const node = modelNode(model, kind);
	return isFixedText(node) ? node.text : undefined;
};

function fixedValues(model: SlotModel, slot: ModelSlot): readonly string[] | undefined {
	const texts = slot.kinds.flatMap((kind) => textOfKind(model, kind) ?? []);
	return texts.length === slot.kinds.length ? [...slot.terminals, ...texts] : undefined;
}

function toldByRead(model: SlotModel, slot: ModelSlot, pinned: ReadonlySet<string>): boolean {
	const values = fixedValues(model, slot);
	if (slot.multiple || values === undefined || values.length === 0) return false;
	return values.every((v) => pinned.has(v)) || (slot.required && values.length === 1);
}

const slotHoldingText = (model: SlotModel, slots: readonly ModelSlot[], text: string): ModelSlot | undefined =>
	slots.find((s) => s.terminals.includes(text) || s.kinds.some((kind) => textOfKind(model, kind) === text));

function pinsOf(model: SlotModel, node: ModelNode | undefined, claim: ClaimFact, renames: SlotNames): Pin[] {
	const slots = node?.slots ?? [];
	const literals: [string, string][] = Object.entries(claim.fieldLiterals);
	for (const text of claim.tokens) {
		const pinned = slotHoldingText(model, slots, text);
		if (pinned && !literals.some(([field]) => field === pinned.name)) literals.push([pinned.name, text]);
	}
	return literals.map(([field, text]) => {
		const slot = slotByField(slots, field);
		return { member: memberNameOf(renames, slot?.name ?? field, slot?.propertyName ?? field), slot: slot?.name ?? field, text };
	});
}

function reachedAt(model: SlotModel, kind: string, site: CaptureSite): { readonly slots: readonly ModelSlot[]; readonly holders: readonly string[] } | undefined {
	if (site.up !== 0) return undefined;
	let holders: readonly string[] = [kind];
	let slots: ModelSlot[] = [];
	for (const selector of site.down) {
		slots = holders.flatMap((holder) => {
			const slot = slotFor(model, modelNode(model, holder)?.slots ?? [], selector);
			return slot === undefined ? [] : [slot];
		});
		if (slots.length < holders.length) return undefined;
		holders = selector.kind !== null ? matchedKinds(model, [selector.kind]) : concreteKinds(model, slots.flatMap((slot) => slot.kinds));
	}
	return { slots, holders };
}

function tokenSite(model: SlotModel, kind: string, child: { readonly subject: CaptureSite; readonly token: string }): CaptureSite {
	const holders = reachedAt(model, kind, child.subject)?.holders ?? [];
	const names = new Set(holders.map((holder) => slotHoldingText(model, modelNode(model, holder)?.slots ?? [], child.token)?.name));
	const [name] = names;
	if (holders.length === 0 || names.size > 1 || name === undefined)
		throw new Error(`bindings: ${kind}'s claim tests a token "${child.token}" that no slot of ${holders.join(', ') || 'the node holding it'} holds`);
	return { ...child.subject, down: [...child.subject.down, { field: name, kind: null, after: null, anchor: null }] };
}

const matchedKinds = (model: SlotModel, kinds: readonly string[]): string[] => concreteKinds(model, kinds.flatMap((kind) => shownKinds(model, kind)));

function guarantees(model: SlotModel, slot: ModelSlot, child: Exclude<ChildFact, { readonly token: string }>): boolean {
	if (!slot.required) return false;
	if ('present' in child) return true;
	if ('text' in child) {
		const values = fixedValues(model, slot);
		return values?.length === 1 && values[0] === child.text;
	}
	const kinds = matchedKinds(model, child.kinds);
	return concreteKinds(model, slot.kinds).every((k) => kinds.includes(k));
}

function childTestOf(model: SlotModel, kind: string, fact: ChildFact): ChildTest | undefined {
	const child = 'token' in fact ? { subject: tokenSite(model, kind, fact), text: fact.token } : fact;
	const slots = reachedAt(model, kind, child.subject)?.slots ?? [];
	if (slots.length > 0 && slots.every((slot) => guarantees(model, slot, child))) return undefined;
	if ('text' in child) return child;
	const held = concreteKinds(model, slots.flatMap((slot) => slot.kinds));
	if ('present' in child) return { subject: child.subject, kinds: held };
	if (!child.captured || slots.length === 0 || slots.every((slot) => slot.required)) return { subject: child.subject, kinds: concreteKinds(model, child.kinds) };
	const matched = matchedKinds(model, child.kinds);
	const excludes = held.filter((k) => !matched.includes(k));
	return excludes.length === 0 ? undefined : { subject: child.subject, excludes };
}

const specificity = (entry: ReadEntry): number => {
	const placed = entry.claim.within.length > 0;
	const predicated = entry.claim.predicates.length > 0;
	const literal = entry.pins.length > 0 || entry.claim.tokens.length > 0 || entry.children.length > 0;
	return placed && predicated ? 0 : predicated ? 1 : placed ? 2 : literal ? 3 : 4;
};

function viaPath(model: SlotModel, owner: string, via: readonly SlotSelector[]): { readonly steps: SlotStep[]; readonly at: ModelNode } | undefined {
	let at = modelNode(model, owner);
	const steps: SlotStep[] = [];
	for (const step of [...via].reverse()) {
		const slot = at === undefined ? undefined : slotFor(model, at.slots, step);
		const next = step.kind === null ? undefined : modelNode(model, step.kind);
		if (at === undefined || slot === undefined || next === undefined || (slot.multiple && step.anchor === null)) return undefined;
		steps.push(stepOf(at.kind, slot.name, step.anchor));
		at = next;
	}
	return at === undefined ? undefined : { steps, at };
}

function isLeafAlias(input: GrammarInput, node: ModelNode): boolean {
	return node.modelType === 'alias' && node.slots.every((slot) => slot.kinds.length > 0 && slot.kinds.every((k) => modelNode(input.model, k)?.modelType === 'pattern'));
}

function heldElements(input: GrammarInput, slot: ModelSlot): readonly string[] {
	return slot.kinds.flatMap((kind) => {
		const node = modelNode(input.model, kind);
		const unwrap = node === undefined ? undefined : containerOf(input, node);
		return unwrap?.list ? unwrap.kinds : slot.multiple ? [kind] : [];
	});
}

function listFormItems(input: GrammarInput, node: ModelNode, slotNamesOf: (kind: string) => SlotNames): MemberRoute[] {
	const owner = node.variantOf;
	const items = node.slots.find((slot) => slot.multiple && holdsNodes(slot));
	if (owner === null || items === undefined || !formsOf(input.model, owner).includes(node.kind)) return [];
	for (const sibling of formsOf(input.model, owner)) {
		const at = modelNode(input.model, sibling);
		if (at === undefined || at.modelType === 'list') continue;
		const holder = at.slots.find((slot) => {
			const held = heldElements(input, slot);
			return held.length > 0 && node.elementKinds.every((kind) => held.includes(kind));
		});
		if (holder !== undefined)
			return [{ route: 'slot', name: memberNameOf(slotNamesOf(sibling), holder.name, holder.propertyName), slot: items, path: [{ owner: node.kind, slot: items.name }] }];
	}
	return [];
}

const holdsOnlyText = (slot: ModelSlot): boolean => slot.storage !== 'boolean' && slot.kinds.length === 0 && slot.terminals.length === 0;

function membersOf(input: GrammarInput, kind: string, entries: readonly ReadEntry[], slotNamesOf: (kind: string) => SlotNames): MemberRoute[] {
	const node = modelNode(input.model, kind);
	if (node === undefined) return [];
	if (node.modelType === 'list') return listFormItems(input, node, slotNamesOf);
	const names = slotNamesOf(kind);
	const told = new Map<string, Set<string>>();
	const tell = (slot: string, text: string): void => void (told.get(slot) ?? told.set(slot, new Set<string>()).get(slot))?.add(text);
	for (const pin of entries.flatMap((entry) => entry.pins)) tell(pin.slot, pin.text);
	for (const child of entries.flatMap((entry) => entry.children)) {
		const [step, ...deeper] = child.subject.down;
		const slot = child.subject.up === 0 && step !== undefined && deeper.length === 0 ? slotFor(input.model, node.slots, step) : undefined;
		if (slot === undefined) continue;
		if ('text' in child) tell(slot.name, child.text);
		else if ('kinds' in child) for (const text of child.kinds.flatMap((k) => textOfKind(input.model, k) ?? [])) tell(slot.name, text);
	}
	const identifier = entries.some((entry) => isIdentifierPath(entry.vocab));
	const deep = input.bindings.members.filter((m) => m.owner === kind && m.route !== 'rename' && m.route !== 'dropped');
	const via = new Set(deep.flatMap((m) => (m.route === 'presence' || m.route === 'nested' ? m.via.flatMap((step) => step.kind ?? []) : [])));
	const routes: MemberRoute[] = [];
	for (const slot of isLeafAlias(input, node) ? [] : node.slots) {
		if (
			isLayout(input, kind, slot) ||
			names.get(slot.name) === null ||
			(identifier && holdsOnlyText(slot))
		)
			continue;
		const except = slot.kinds.filter((k) => via.has(k));
		if (except.length > 0 && except.length === slot.kinds.length) continue;
		const rest = except.length === 0 ? slot : { ...slot, kinds: slot.kinds.filter((k) => !via.has(k)), required: false };
		if (toldByRead(input.model, rest, told.get(slot.name) ?? new Set<string>())) continue;
		const name = memberNameOf(names, slot.name, slot.propertyName);
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
					path: chain && leaf ? [...chain.steps, stepOf(chain.at.kind, leaf.name, null)] : undefined
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
					path: chain && parent && slot ? [...chain.steps, stepOf(parent.kind, slot.name, member.anchor)] : undefined
				});
				break;
			}
		}
	}
	return routes;
}

function refinedParent(kind: string, entries: readonly ReadEntry[]): string | undefined {
	if (entries.length === 0) return undefined;
	const parents = new Set(entries.map((e) => e.vocab.slice(0, Math.max(0, e.vocab.lastIndexOf('.')))));
	const [parent] = parents;
	if (parents.size > 1 || !parent)
		throw new Error(`bindings: ${kind} has only refining claims, and their paths share no parent (${entries.map((e) => e.vocab).join(', ')}); claim the kind itself`);
	return parent;
}

function concreteKindsOf(model: SlotModel, kind: string, seen: Set<string>): string[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	const subtypes = modelNode(model, kind)?.subtypes ?? [];
	return subtypes.length === 0 ? [kind] : subtypes.flatMap((subtype) => concreteKindsOf(model, subtype, seen));
}

function concreteKinds(model: SlotModel, kinds: readonly string[]): string[] {
	const seen = new Set<string>();
	return [...new Set(kinds.flatMap((kind) => concreteKindsOf(model, kind, seen)))].sort();
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
	return concreteKinds(model, admitted);
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

export function formsOf(model: SlotModel, kind: string): readonly string[] {
	if (modelNode(model, kind)?.modelType !== 'supertype') return [kind];
	return [kind, ...[...model.values()].filter((node) => node.variantOf === kind).flatMap((node) => formsOf(model, node.kind))];
}

function readKinds(model: SlotModel, kind: string, claim: ClaimFact): readonly string[] {
	const [, ...shown] = shownKinds(model, kind);
	const members = modelNode(model, kind)?.enumMembers ?? [];
	if (members.length === 0) return [kind, ...shown];
	const texts = ownTextEquals(claim);
	return [...members.filter((member: EnumMember) => texts.every((text) => text === member.text)).map((member) => member.kind), ...shown];
}

export function resolveRoutes(input: GrammarInput): GrammarRoutes {
	const named = input.bindings.claims.flatMap((c) => (c.kind === null || c.kind === WILDCARD ? [] : [c]));
	const claimsOwn = new Set(named.map((c) => `${c.kind} ${c.vocab}`));
	const selfClaimed = new Set(named.map((c) => c.kind));
	const reached = (owner: string): readonly string[] => formsOf(input.model, owner).filter((form) => form === owner || !selfClaimed.has(form));

	const slotNames = new Map<string, Map<string, string | null>>();
	for (const member of input.bindings.members) {
		if (member.route !== 'rename' && member.route !== 'dropped') continue;
		for (const form of reached(member.owner)) {
			const slot = slotFor(input.model, modelNode(input.model, form)?.slots ?? [], member);
			if (slot !== undefined)
				(slotNames.get(form) ?? slotNames.set(form, new Map<string, string | null>()).get(form))?.set(slot.name, member.route === 'rename' ? member.name : null);
		}
	}
	const slotNamesOf = (kind: string): SlotNames => slotNames.get(kind) ?? new Map<string, string | null>();

	const readEntries = new Map<string, ReadEntry[]>();
	input.bindings.claims.forEach((claim, index) => {
		const owner = claim.kind;
		if (owner === null) return;
		const forms =
			owner === WILDCARD
				? admittedKinds(input.model, claim).filter((kind) => !claimsOwn.has(`${kind} ${claim.vocab}`))
				: reached(owner);
		for (const [claimed, kind] of forms.flatMap((form) => readKinds(input.model, form, claim).map((read) => [owner === WILDCARD ? form : owner, read] as const))) {
			const entry: ReadEntry = {
				kind,
				claimed,
				vocab: claim.vocab,
				claim,
				index,
				pins: pinsOf(input.model, modelNode(input.model, kind), claim, slotNamesOf(kind)),
				children: modelNode(input.model, kind)?.modelType === 'supertype' ? [] : claim.children.flatMap((child) => childTestOf(input.model, kind, child) ?? []),
				template: input.bindings.templates.find((t) => t.vocabs.includes(claim.vocab))
			};
			(readEntries.get(kind) ?? readEntries.set(kind, []).get(kind))?.push(entry);
		}
	});

	const vocabOf = new Map<string, string>();
	for (const [kind, entries] of readEntries) {
		const top = entries.filter((e) => e.claim.toplevel);
		const plain = top.find((e) => e.claim.predicates.length === 0 && e.pins.length === 0 && e.children.length === 0);
		const vocab = plain?.vocab ?? refinedParent(kind, top);
		if (vocab !== undefined) vocabOf.set(kind, vocab);
	}
	for (const entries of readEntries.values()) entries.sort((a, b) => specificity(a) - specificity(b) || b.pins.length - a.pins.length || a.index - b.index);

	const members = new Map<string, MemberRoute[]>();
	for (const [kind, entries] of readEntries) members.set(kind, membersOf(input, kind, entries, slotNamesOf));

	const containers = new Map<string, ContainerUnwrap>();
	for (const node of input.model.values()) {
		const unwrap = containerOf(input, node);
		if (unwrap !== undefined) containers.set(node.kind, unwrap);
	}

	return { grammar: input.grammar, readEntries, vocabOf, members, containers };
}
