import { WILDCARD, isFixedText, isIdentifierPath, type Anchor, type BindingFacts, type CaptureSite, type ChildFact, type ClaimFact, type EnumMember, type MemberFact, type ModelNode, type ModelSlot, type PredicateFact, type Sibling, type SlotModel, type SlotSelector, type TemplateFact } from './facts.ts';
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
	readonly members: readonly MemberRoute[];
	readonly spelled?: true;
}

export type MemberRoute = (
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
	  }
) & { readonly flag?: true; readonly spelled?: true };

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

export function slotAnchor(model: SlotModel, holder: string, selector: SlotSelector): Anchor | null {
	const slots = modelNode(model, holder)?.slots ?? [];
	const own = slotFor(model, slots, selector);
	const crosses = (neighbour: SlotSelector | undefined): boolean => neighbour !== undefined && slotFor(model, slots, neighbour) !== own;
	const first = selector.anchor === 'first' || selector.anchor === 'only' || crosses(selector.adjacent?.previous);
	const last = selector.anchor === 'last' || selector.anchor === 'only' || crosses(selector.adjacent?.next);
	return first && last ? 'only' : first ? 'first' : last ? 'last' : null;
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

const textsOfKind = (model: SlotModel, kind: string): readonly string[] => {
	const node = modelNode(model, kind);
	return isFixedText(node) ? [node.text] : (node?.enumMembers ?? []).map((member) => member.text);
};

function fixedValues(model: SlotModel, slot: ModelSlot): readonly string[] | undefined {
	const texts = slot.kinds.map((kind) => textsOfKind(model, kind));
	return texts.every((own) => own.length > 0) ? [...slot.terminals, ...texts.flat()] : undefined;
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

interface Reached {
	readonly slots: readonly ModelSlot[];
	readonly owners: readonly string[];
	readonly holders: readonly string[];
}

function reachedAt(model: SlotModel, kind: string, site: CaptureSite): Reached | undefined {
	if (site.up !== 0) return undefined;
	let holders: readonly string[] = [kind];
	let owners: readonly string[] = [];
	let slots: ModelSlot[] = [];
	for (const selector of site.down) {
		slots = holders.flatMap((holder) => {
			const slot = slotFor(model, modelNode(model, holder)?.slots ?? [], selector);
			return slot === undefined ? [] : [slot];
		});
		if (slots.length < holders.length) return undefined;
		owners = holders;
		holders = selector.kind !== null ? matchedKinds(model, [selector.kind]) : concreteKinds(model, slots.flatMap((slot) => slot.kinds));
	}
	return { slots, owners, holders };
}

function countsOne(model: SlotModel, reached: Reached | undefined, site: CaptureSite): boolean {
	const last = site.down.at(-1);
	return last !== undefined && (reached?.owners ?? []).some((owner, i) => reached?.slots[i]?.multiple === true && slotAnchor(model, owner, last) === 'only');
}

function tokenSite(model: SlotModel, kind: string, child: { readonly subject: CaptureSite; readonly token: string }): CaptureSite {
	const holders = reachedAt(model, kind, child.subject)?.holders ?? [];
	const names = new Set(holders.map((holder) => slotHoldingText(model, modelNode(model, holder)?.slots ?? [], child.token)?.name));
	const [name] = names;
	if (holders.length > 0 && name === undefined && names.size === 1 && holders.every((holder) => textsOfKind(model, holder).includes(child.token))) return child.subject;
	if (holders.length === 0 || names.size > 1 || name === undefined)
		throw new Error(`bindings: ${kind}'s claim tests a token "${child.token}" that no slot of ${holders.join(', ') || 'the node holding it'} holds`);
	return { ...child.subject, down: [...child.subject.down, { field: name, kind: null, after: null, anchor: null }] };
}

const matchedKinds = (model: SlotModel, kinds: readonly string[]): string[] => concreteKinds(model, kinds.flatMap((kind) => shownKinds(model, kind)));

function guarantees(model: SlotModel, slot: ModelSlot, child: Exclude<ChildFact, { readonly token: string } | { readonly siblings: readonly Sibling[] }>): boolean {
	if (!slot.required) return false;
	if ('present' in child) return true;
	if ('text' in child) {
		const values = fixedValues(model, slot);
		return values?.length === 1 && values[0] === child.text;
	}
	const kinds = matchedKinds(model, child.kinds);
	return concreteKinds(model, slot.kinds).every((k) => kinds.includes(k));
}

function siblingTestsAt(model: SlotModel, kind: string, holder: string, fact: { readonly subject: CaptureSite; readonly siblings: readonly Sibling[] }): ChildTest[] {
	const slots = modelNode(model, holder)?.slots ?? [];
	const placed = fact.siblings.flatMap((sibling) => {
		const slot = slotFor(model, slots, sibling.selector);
		return slot === undefined ? [] : [{ ...sibling, slot, index: slots.indexOf(slot) }];
	});
	if (placed.length < fact.siblings.length) return [];
	const never = (why: string): never => {
		throw new Error(`bindings: ${kind}'s claim never matches: ${why}`);
	};
	const skipped = new Set<ModelSlot>();
	const skip = (from: number, to: number): void => slots.slice(from, to).filter(holdsNodes).forEach((slot) => skipped.add(slot));
	placed.forEach(({ selector, slot, index }, i) => {
		const previous = placed[i - 1];
		if (previous !== undefined && index < previous.index) never(`its children come in an order ${holder}'s slots do not (${previous.slot.name} before ${slot.name})`);
		if (selector.anchor === 'first' || selector.anchor === 'only') skip(0, index);
		if (selector.anchor === 'last' || selector.anchor === 'only') skip(index + 1, slots.length);
		if (selector.adjacent?.previous !== undefined && previous !== undefined) skip(previous.index + 1, index);
	});
	const site = (slot: ModelSlot, anchor: Anchor | null): CaptureSite => ({ ...fact.subject, down: [...fact.subject.down, { field: slot.name, kind: null, after: null, anchor }] });
	const tests: ChildTest[] = [];
	for (const slot of skipped) {
		if (slot.required) never(`${holder}'s required slot ${slot.name} lies between an anchor and its node`);
		tests.push({ subject: site(slot, null), excludes: concreteKinds(model, slot.kinds) });
	}
	for (const slot of new Set(placed.map((p) => p.slot))) {
		const shared = placed.filter((p) => p.slot === slot);
		if (shared.length < 2) continue;
		if (!slot.multiple) never(`${shared.length} of its children sit in ${holder}'s slot ${slot.name}, which holds one node`);
		const held = concreteKinds(model, slot.kinds);
		const guaranteed = ({ bare, selector: { kind } }: Sibling): boolean => bare && (kind === null || held.every((k) => matchedKinds(model, [kind]).includes(k)));
		if (shared.length > 2 || !shared.every(guaranteed))
			throw new Error(`bindings: ${kind}'s claim tests ${shared.length} nodes of ${holder}'s slot ${slot.name} with their own tests; a read test counts only two nodes the slot guarantees`);
		tests.push({ subject: site(slot, 'only'), excludes: held });
	}
	return tests;
}

function siblingTests(model: SlotModel, kind: string, fact: { readonly subject: CaptureSite; readonly siblings: readonly Sibling[] }): ChildTest[] {
	const tests = (reachedAt(model, kind, fact.subject)?.holders ?? []).map((holder) => siblingTestsAt(model, kind, holder, fact));
	const [first = []] = tests;
	if (tests.some((t) => JSON.stringify(t) !== JSON.stringify(first)))
		throw new Error(`bindings: ${kind}'s claim orders children below a node of several kinds whose slots differ`);
	return first;
}

const reachesThrough = (outer: CaptureSite, inner: CaptureSite): boolean =>
	outer.up === inner.up && outer.down.length > inner.down.length && inner.down.every((step, i) => JSON.stringify(step) === JSON.stringify(outer.down[i]));

function childTestsOf(model: SlotModel, kind: string, fact: ChildFact, facts: readonly ChildFact[]): ChildTest[] {
	if ('siblings' in fact) return siblingTests(model, kind, fact);
	const child = 'token' in fact ? { subject: tokenSite(model, kind, fact), text: fact.token } : fact;
	const reached = reachedAt(model, kind, child.subject);
	const slots = reached?.slots ?? [];
	const through = (other: ChildFact): boolean =>
		other !== fact && !('siblings' in other) && (reachesThrough(other.subject, child.subject) || ('token' in other && JSON.stringify(other.subject) === JSON.stringify(child.subject)));
	const counted = countsOne(model, reached, child.subject) && !facts.some(through);
	if (slots.length > 0 && !counted && slots.every((slot) => guarantees(model, slot, child))) return [];
	if ('text' in child) return [child];
	const held = concreteKinds(model, slots.flatMap((slot) => slot.kinds));
	if ('present' in child) return [{ subject: child.subject, kinds: held }];
	if (!child.captured || slots.every((slot) => slot.required)) return [{ subject: child.subject, kinds: concreteKinds(model, child.kinds) }];
	const matched = matchedKinds(model, child.kinds);
	const excludes = held.filter((k) => !matched.includes(k));
	return excludes.length === 0 ? [] : [{ subject: child.subject, excludes }];
}

const inheritedClaims = (entry: ReadEntry, entries: readonly ReadEntry[]): ReadonlySet<number> =>
	new Set(entries.filter((other) => entry.vocab === other.vocab || entry.vocab.startsWith(`${other.vocab}.`)).map((other) => other.index));

const testCount = ({ claim }: ReadEntry): number =>
	Object.keys(claim.fieldLiterals).length + claim.tokens.length + claim.children.length + claim.predicates.length + claim.within.length;

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
		const anchor = at === undefined ? null : slotAnchor(model, at.kind, step);
		if (at === undefined || slot === undefined || next === undefined || (slot.multiple && anchor === null)) return undefined;
		steps.push(stepOf(at.kind, slot.name, anchor));
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

type DeepMember = Extract<MemberFact, { readonly route: 'presence' | 'nested' }>;

function deepRouteOf(input: GrammarInput, kind: string, member: DeepMember): MemberRoute {
	const chain = viaPath(input.model, kind, member.via);
	if (member.route === 'presence') {
		const leaf = chain?.at.slots.find((s) => s.terminals.includes(member.token));
		const spelled = member.flag === true && member.via.length === 0 && chain !== undefined && leaf === undefined;
		return {
			route: 'presence',
			name: camel(member.name),
			via: member.via,
			token: member.token,
			path: chain && leaf ? [...chain.steps, stepOf(chain.at.kind, leaf.name, null)] : undefined,
			...flagOf(member),
			...(spelled ? { spelled: true } : {})
		};
	}
	const parent = modelNode(input.model, member.parent);
	const slot = parent ? slotFor(input.model, parent.slots, member) : undefined;
	return {
		route: 'nested',
		name: camel(member.name),
		via: member.via,
		parent: member.parent,
		selector: member,
		slot,
		multiple: member.multiple,
		path: chain && parent && slot ? [...chain.steps, stepOf(parent.kind, slot.name, slotAnchor(input.model, parent.kind, member))] : undefined,
		...flagOf(member)
	};
}

interface Guaranteed {
	readonly holds: (path: readonly SlotStep[] | undefined) => boolean;
	readonly many: (step: SlotStep) => boolean;
}

const stepKey = (step: SlotStep): string => `${step.owner} ${step.slot} ${step.anchor ?? ''}`;

function guaranteedBy(model: SlotModel, entry: ReadEntry): Guaranteed {
	const one = new Set<string>();
	const many = new Set<string>();
	for (const child of entry.children) {
		if (child.subject.up !== 0) continue;
		let holder: string | null = entry.kind;
		for (const [i, selector] of child.subject.down.entries()) {
			const slot = holder === null ? undefined : slotFor(model, modelNode(model, holder)?.slots ?? [], selector);
			if (holder === null || slot === undefined) break;
			const key = stepKey(stepOf(holder, slot.name, slotAnchor(model, holder, selector)));
			if (!('excludes' in child)) one.add(key);
			else if (i === child.subject.down.length - 1) many.add(key);
			holder = selector.kind;
		}
	}
	return {
		holds: (path) => (path ?? []).every((step) => step.anchor !== 'only' || one.has(stepKey(step))),
		many: (step) => many.has(stepKey(step))
	};
}

function membersOf(
	input: GrammarInput,
	kind: string,
	entries: readonly ReadEntry[],
	slotNamesOf: (kind: string) => SlotNames,
	guaranteed: Guaranteed,
	inherited: ReadonlySet<number>
): MemberRoute[] {
	const node = modelNode(input.model, kind);
	if (node === undefined) return [];
	if (node.modelType === 'list') return listFormItems(input, node, slotNamesOf);
	const names = slotNamesOf(kind);
	const told = new Map<string, Set<string>>();
	const tell = (slot: string, text: string): void => void (told.get(slot) ?? told.set(slot, new Set<string>()).get(slot))?.add(text);
	for (const pin of entries.flatMap((entry) => entry.pins)) tell(pin.slot, pin.text);
	const below = new Map<string, Set<string>>();
	const innerSlot = (holder: string, step: SlotSelector): ModelSlot | undefined => slotFor(input.model, modelNode(input.model, holder)?.slots ?? [], step);
	const beneath = new Map<string, Set<string>>();
	for (const child of entries.flatMap((entry) => entry.children)) {
		const [step, inner, third, ...deeper] = child.subject.down;
		const slot = child.subject.up === 0 && step !== undefined && deeper.length === 0 ? slotFor(input.model, node.slots, step) : undefined;
		if (slot === undefined) continue;
		if (third !== undefined) {
			const at = inner?.kind ?? null;
			const held = at === null ? undefined : innerSlot(at, third);
			if (at === null || held === undefined) continue;
			const key = `${at} ${held.name}`;
			const told = beneath.get(key) ?? beneath.set(key, new Set<string>()).get(key);
			for (const value of 'text' in child ? [child.text] : 'kinds' in child ? concreteKinds(input.model, child.kinds) : []) told?.add(value);
		} else if (inner !== undefined) {
			if (!('kinds' in child)) continue;
			for (const holder of slot.kinds) {
				const name = innerSlot(holder, inner)?.name;
				if (name === undefined) continue;
				const key = `${slot.name} ${holder} ${name}`;
				const told = below.get(key) ?? below.set(key, new Set<string>()).get(key);
				for (const kind of concreteKinds(input.model, child.kinds)) told?.add(kind);
			}
		} else if ('text' in child) tell(slot.name, child.text);
		else if ('kinds' in child) for (const text of child.kinds.flatMap((k) => textOfKind(input.model, k) ?? [])) tell(slot.name, text);
	}
	const hiddenBelow = (slot: ModelSlot): readonly ModelSlot[] | undefined => {
		if (slot.multiple || slot.kinds.length === 0) return undefined;
		const covered = slot.kinds.map((holder) =>
			(modelNode(input.model, holder)?.slots ?? []).find((inner) => {
				const told = below.get(`${slot.name} ${holder} ${inner.name}`);
				return told !== undefined && inner.required && !inner.multiple && concreteKinds(input.model, inner.kinds).every((kind) => told.has(kind));
			})
		);
		return covered.every((inner) => inner !== undefined) ? (covered as ModelSlot[]) : undefined;
	};
	const accounted = (at: string, held: ModelSlot): boolean => {
		const told = beneath.get(`${at} ${held.name}`) ?? new Set<string>();
		const values = fixedValues(input.model, held);
		return (
			isLayout(input, at, held) ||
			slotNamesOf(at).get(held.name) === null ||
			input.bindings.members.some((m) => m.owner === kind && m.route === 'nested' && m.parent === at && slotFor(input.model, modelNode(input.model, at)?.slots ?? [], m) === held) ||
			(values !== undefined && values.every((value) => told.has(value))) ||
			concreteKinds(input.model, held.kinds).every((k) => told.has(k))
		);
	};
	const refuseHidden = (slot: ModelSlot, covered: readonly ModelSlot[]): void => {
		for (const at of concreteKinds(input.model, covered.flatMap((inner) => inner.kinds))) {
			const held = modelNode(input.model, at);
			if (isFixedText(held) || (held?.enumMembers.length ?? 0) > 0) continue;
			const open = held === undefined || held.slots.length === 0 ? ['its text'] : held.slots.filter((s) => !accounted(at, s)).map((s) => s.name);
			if (open.length > 0)
				throw new Error(
					`bindings: ${kind}'s read entries test every kind its ${slot.name} slot's node can hold, so the slot is no member, but ${at} there holds ${open.join(', ')}, which no claim on ${kind} captures or tests; capture it or test it`
				);
		}
	};
	const identifier = entries.some((entry) => isIdentifierPath(entry.vocab));
	const shaping = input.bindings.members.filter((m) => m.owner === kind && m.route !== 'rename' && m.route !== 'dropped');
	const deep = shaping.filter((m) => m.claims === undefined || m.claims.some((index) => inherited.has(index)));
	const paths = new Map(shaping.flatMap((m) => (m.route === 'presence' || m.route === 'nested' ? [[m, deepRouteOf(input, kind, m)] as const] : [])));
	const counted = new Set([...paths.values()].flatMap((route) => route.path?.filter((step) => step.owner === kind && step.anchor === 'only').map((step) => step.slot) ?? []));
	const reached = new Map([...paths].filter(([, route]) => guaranteed.holds(route.path)));
	const via = new Set([...reached.keys()].flatMap((m) => m.via.flatMap((step) => step.kind ?? [])));
	const captures: readonly Extract<MemberFact, { readonly route: 'rename' }>[] = input.bindings.members.flatMap((m) =>
		m.route === 'rename' && (m.claims === undefined || m.claims.some((index) => inherited.has(index))) && formsOf(input.model, m.owner).includes(kind) ? [m] : []
	);
	const flags = captures.filter((m) => m.flag === true);
	const spelledFlags: MemberRoute[] = [];
	const flagSlots = new Map(flags.flatMap((m) => {
		const slot = slotFor(input.model, node.slots, m);
		if (slot === undefined && formsOf(input.model, m.owner).every((form) => slotFor(input.model, modelNode(input.model, form)?.slots ?? [], m) === undefined)) {
			const spelled = m.field === null && modelNode(input.model, m.owner)?.variantOf != null ? spelledFlagRouteOf(m) : undefined;
			if (spelled !== undefined) {
				spelledFlags.push(spelled);
				return [];
			}
			const selector = m.field !== null ? `the field ${m.field}` : m.kind !== null ? `a ${m.kind} child` : 'a child by position';
			throw new Error(`bindings: ${m.owner}'s flag @${m.name} captures ${selector}, which no form of ${m.owner} holds`);
		}
		return slot === undefined ? [] : [[m, slot] as const];
	}));
	const capturesOf = (slot: ModelSlot) => captures.filter((m) => slotFor(input.model, node.slots, m) === slot);
	const unrouted = (slot: ModelSlot, why: string): void => {
		const [capture] = capturesOf(slot);
		if (capture !== undefined) throw new Error(`bindings: ${kind}'s capture @${capture.name} reaches no member: its ${slot.name} slot ${why}; capture a slot a member reads, or mark it @dropped`);
	};
	const routes: MemberRoute[] = [];
	for (const slot of isLeafAlias(input, node) ? [] : node.slots) {
		if (([...flagSlots.values()].includes(slot) && !names.has(slot.name)) || names.get(slot.name) === null) continue;
		if (isLayout(input, kind, slot)) {
			unrouted(slot, 'is layout');
			continue;
		}
		if (identifier && holdsOnlyText(slot)) {
			unrouted(slot, 'holds only text on a kind read as an identifier');
			continue;
		}
		if (counted.has(slot.name) && !guaranteed.many({ owner: kind, slot: slot.name, anchor: 'only' })) {
			unrouted(slot, 'is counted by a member anchored as its only node');
			continue;
		}
		const kept = keptKinds(input.model, slot, capturesOf(slot));
		const except = slot.kinds.filter((k) => via.has(k) || !kept.has(k));
		if (except.length > 0 && except.length === slot.kinds.length) {
			unrouted(slot, 'is the path of a deeper member');
			continue;
		}
		const read = except.length === 0 ? slot : { ...slot, kinds: slot.kinds.filter((k) => !except.includes(k)) };
		const rest = except.length === 0 ? slot : { ...read, required: false };
		const captured = capturesOf(slot).length > 0;
		if (toldByRead(input.model, rest, told.get(slot.name) ?? new Set<string>())) {
			unrouted(slot, 'is told by the read');
			continue;
		}
		const hidden = captured ? undefined : hiddenBelow(slot);
		if (hidden !== undefined) {
			refuseHidden(slot, hidden);
			continue;
		}
		const name = memberNameOf(names, slot.name, slot.propertyName);
		const path = [{ owner: kind, slot: slot.name }];
		const flag = entries.some((entry) => input.bindings.flagsByPath?.get(entry.vocab)?.has(name) === true) ? { flag: true as const } : {};
		routes.push(except.length === 0 ? { route: 'slot', name, slot, path, ...flag } : { route: 'slot', name, slot: read, except, path, ...flag });
	}
	for (const [member, slot] of flagSlots) routes.push(flagRouteOf(kind, member, slot));
	routes.push(...spelledFlags);
	for (const member of deep) {
		if (member.route === 'kind') {
			const named = routes.find((r) => r.route === 'slot' && r.name === camel(member.member));
			routes.push({ route: 'kind', name: camel(member.name), kind: member.kind, path: named?.route === 'slot' ? named.path : undefined, ...flagOf(member) });
			continue;
		}
		const route = member.route === 'presence' || member.route === 'nested' ? reached.get(member) : undefined;
		if (route !== undefined) routes.push(route);
	}
	return routes;
}

function flagRouteOf(kind: string, member: Extract<MemberFact, { readonly route: 'rename' }>, slot: ModelSlot): MemberRoute {
	const name = camel(member.name);
	const path = [{ owner: kind, slot: slot.name }];
	if (member.kind !== null && member.kind !== WILDCARD) return { route: 'kind', name, kind: member.kind, path, flag: true };
	const [only, ...more] = slot.terminals;
	const token = member.token ?? (more.length === 0 ? only : undefined);
	if (token === undefined)
		throw new Error(`bindings: ${kind}'s flag ${name} captures its ${slot.name} slot, which holds ${slot.terminals.join(', ')}; capture the one token the flag tests`);
	return { route: 'presence', name, via: [], token, path, flag: true };
}

function spelledFlagRouteOf(member: Extract<MemberFact, { readonly route: 'rename' }>): MemberRoute | undefined {
	const name = camel(member.name);
	if (member.kind !== null && member.kind !== WILDCARD) return { route: 'kind', name, kind: member.kind, path: undefined, flag: true, spelled: true };
	return member.token === undefined ? undefined : { route: 'presence', name, via: [], token: member.token, path: undefined, flag: true, spelled: true };
}

const flagOf = (member: MemberFact): { readonly flag?: true } => (member.flag === true ? { flag: true } : {});

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

function keptKinds(model: SlotModel, slot: ModelSlot, captures: readonly Extract<MemberFact, { readonly route: 'rename' }>[]): ReadonlySet<string> {
	const members = captures.filter((m) => m.flag !== true);
	const named = members.flatMap((m) => (m.field === null && m.kind !== null && m.kind !== WILDCARD ? [m.kind] : []));
	if (slot.kinds.length < 2 || members.length === 0 || named.length < members.length) return new Set(slot.kinds);
	const concrete = new Set(concreteKinds(model, named));
	return new Set(slot.kinds.filter((k) => named.includes(k) || concreteKinds(model, [k]).some((c) => concrete.has(c))));
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

export function comparesOwnText(predicate: PredicateFact): boolean {
	const [argument, ...rest] = predicate.arguments;
	const own = predicate.subject !== null && predicate.subject.up === 0 && predicate.subject.down.length === 0;
	return own && (predicate.operator === 'eq' || predicate.operator === 'match') && argument !== undefined && 'text' in argument && rest.length === 0;
}

function ownTextAdmits(claim: ClaimFact, text: string): boolean {
	return (
		claim.tokens.every((token) => token === text) &&
		claim.predicates.filter(comparesOwnText).every((p) => {
			const [argument] = p.arguments as [{ readonly text: string }];
			return p.operator === 'eq' ? argument.text === text : new RegExp(argument.text).test(text);
		})
	);
}

export function formsOf(model: SlotModel, kind: string): readonly string[] {
	if (modelNode(model, kind)?.modelType !== 'supertype') return [kind];
	return [kind, ...[...model.values()].filter((node) => node.variantOf === kind).flatMap((node) => formsOf(model, node.kind))];
}

interface ReadKind {
	readonly kind: string;
	readonly spelled: boolean;
}

function readKinds(model: SlotModel, kind: string, claim: ClaimFact): readonly ReadKind[] {
	const [, ...shown] = shownKinds(model, kind).map((k) => ({ kind: k, spelled: false }));
	const members = modelNode(model, kind)?.enumMembers ?? [];
	if (members.length === 0) return [{ kind, spelled: false }, ...shown];
	const decides = claim.tokens.length > 0 || claim.predicates.some(comparesOwnText);
	return [...members.filter((member: EnumMember) => ownTextAdmits(claim, member.text)).map((member) => ({ kind: member.kind, spelled: decides })), ...shown];
}

export function resolveRoutes(input: GrammarInput): GrammarRoutes {
	const claimsOwn = new Set(input.bindings.claims.flatMap((c) => (c.kind === null || c.kind === WILDCARD ? [] : [`${c.kind} ${c.vocab}`])));

	const slotNames = new Map<string, Map<string, string | null>>();
	for (const member of input.bindings.members) {
		if ((member.route !== 'rename' && member.route !== 'dropped') || (member.route === 'rename' && member.flag === true)) continue;
		for (const form of formsOf(input.model, member.owner)) {
			const slots = modelNode(input.model, form)?.slots ?? [];
			const token = member.route === 'dropped' && member.field === null ? member.token : undefined;
			const slot = token === undefined ? slotFor(input.model, slots, member) : slotHoldingText(input.model, slots, token);
			if (slot !== undefined)
				(slotNames.get(form) ?? slotNames.set(form, new Map<string, string | null>()).get(form))?.set(slot.name, member.route === 'rename' ? member.name : null);
		}
	}
	const slotNamesOf = (kind: string): SlotNames => slotNames.get(kind) ?? new Map<string, string | null>();

	const readEntries = new Map<string, ReadEntry[]>();
	const inherited = new Set<ReadEntry>();
	input.bindings.claims.forEach((claim, index) => {
		const owner = claim.kind;
		if (owner === null) return;
		const forms =
			owner === WILDCARD
				? admittedKinds(input.model, claim).filter((kind) => !claimsOwn.has(`${kind} ${claim.vocab}`))
				: formsOf(input.model, owner);
		for (const [form, { kind, spelled }] of forms.flatMap((form) => readKinds(input.model, form, claim).map((read) => [form, read] as const))) {
			const claimed = owner === WILDCARD ? form : owner;
			const entry: ReadEntry = {
				kind,
				claimed,
				vocab: claim.vocab,
				claim,
				index,
				pins: pinsOf(input.model, modelNode(input.model, kind), claim, slotNamesOf(kind)),
				children: modelNode(input.model, kind)?.modelType === 'supertype' ? [] : claim.children.flatMap((child) => childTestsOf(input.model, kind, child, claim.children)),
				template: input.bindings.templates.find((t) => t.vocabs.includes(claim.vocab)),
				members: [],
				...(spelled ? { spelled: true as const } : {})
			};
			if (form !== claimed) inherited.add(entry);
			(readEntries.get(kind) ?? readEntries.set(kind, []).get(kind))?.push(entry);
		}
	});

	const isPlain = (e: ReadEntry): boolean => e.claim.predicates.length === 0 && e.pins.length === 0 && e.children.length === 0;
	const vocabOf = new Map<string, string>();
	for (const [kind, entries] of readEntries) {
		const top = entries.filter((e) => e.claim.toplevel);
		const own = top.filter((e) => !inherited.has(e));
		const vocab = own.find(isPlain)?.vocab ?? top.find(isPlain)?.vocab ?? refinedParent(kind, own.length > 0 ? own : top);
		if (vocab !== undefined) vocabOf.set(kind, vocab);
	}
	const rank = (e: ReadEntry): number => (inherited.has(e) ? 1 : 0);
	for (const entries of readEntries.values())
		entries.sort((a, b) => specificity(a) - specificity(b) || rank(a) - rank(b) || testCount(b) - testCount(a) || a.index - b.index);

	const members = new Map<string, MemberRoute[]>();
	for (const [kind, entries] of readEntries) {
		const routed = entries.map((entry) => ({ ...entry, members: membersOf(input, kind, entries, slotNamesOf, guaranteedBy(input.model, entry), inheritedClaims(entry, entries)) }));
		readEntries.set(kind, routed);
		const [first, ...rest] = routed.map((entry) => entry.members);
		const union = [...(first ?? [])];
		const held = new Set(union.map((route) => JSON.stringify(route)));
		for (const route of rest.flat()) {
			const key = JSON.stringify(route);
			if (held.has(key)) continue;
			held.add(key);
			union.push(route);
		}
		members.set(kind, union);
	}

	const containers = new Map<string, ContainerUnwrap>();
	for (const node of input.model.values()) {
		const unwrap = containerOf(input, node);
		if (unwrap !== undefined) containers.set(node.kind, unwrap);
	}

	return { grammar: input.grammar, readEntries, vocabOf, members, containers };
}

export function unenteredForms(input: GrammarInput, routes: GrammarRoutes): string[] {
	return input.bindings.claims.flatMap((claim, index) => {
		const owner = claim.kind;
		if (owner === null || owner === WILDCARD) return [];
		return formsOf(input.model, owner)
			.filter((form) => form !== owner)
			.flatMap((form) => readKinds(input.model, form, claim).flatMap(({ kind }) => ((routes.readEntries.get(kind) ?? []).some((e) => e.index === index) ? [] : [kind])))
			.map((kind) => `${input.grammar}: ${kind} has no entry for its supertype ${owner}'s claim @${claim.vocab}, so it reads by no path there when no claim of its own holds`);
	});
}
