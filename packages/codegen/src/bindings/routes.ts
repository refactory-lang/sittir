import { WILDCARD, isFixedText, literalClaimOf, refineClaims, type RefinedClaim, isIdentifierPath, type Anchor, type BindingFacts, type CaptureSite, type ChildFact, type ClaimFact, type ContainerCapture, type ContainerFact, type EnumMember, type SlotFact, type NamedSlotFact, type ModelNode, type ModelSlot, type PredicateFact, type Sibling, type SlotModel, type SlotSelector, type TemplateFact } from './facts.ts';
import { Delimiter } from '@sittir/common/delimiter';
import { boundKindName, camel, snake } from './names.ts';
import { isParserHiddenName } from '../dsl/rule-patterns.ts';
import { textValued, type Vocabulary } from './vocabulary.ts';

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
	readonly vocabulary: Vocabulary;
}

export interface SlotStep {
	readonly owner: string;
	readonly slot: string;
	readonly anchor?: Anchor;
}

const stepOf = (owner: string, slot: string, anchor: Anchor | null): SlotStep =>
	anchor === null ? { owner, slot } : { owner, slot, anchor };

export interface Pin {
	readonly name: string;
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
	readonly absent: readonly string[];
	readonly present: readonly string[];
	readonly children: readonly ChildTest[];
	readonly template: TemplateFact | undefined;
	readonly slots: readonly SlotRoute[];
	readonly value?: SlotRoute;
	readonly separated?: true;
	readonly spelled?: true;
	readonly decided?: true;
	readonly empty?: true;
}

export type SlotRoute = (
	| {
			readonly route: 'slot';
			readonly name: string;
			readonly slot: ModelSlot;
			readonly except?: readonly string[];
			readonly kinds?: readonly string[];
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
			readonly kinds?: readonly string[];
			readonly slot: ModelSlot | undefined;
			readonly multiple: boolean;
			readonly path: readonly SlotStep[] | undefined;
	  }
	| { readonly route: 'delimiter'; readonly name: string; readonly delimiter: Delimiter; readonly items?: SlotStep; readonly path: readonly SlotStep[] | undefined }
) & { readonly flag?: true; readonly spelled?: true; readonly list?: boolean; readonly readOnly?: true };

export const readsList = (route: SlotRoute, slotHoldsList: boolean): boolean => route.list ?? slotHoldsList;

export const VALUE = '$value';

export const entryRoutes = (entry: Pick<ReadEntry, 'slots' | 'value'>): readonly SlotRoute[] => (entry.value === undefined ? entry.slots : [...entry.slots, entry.value]);

const declaredArity = (vocabulary: Vocabulary, path: string, route: SlotRoute): SlotRoute => {
	const declared = vocabulary.slots(path).get(route.name);
	return declared === undefined || declared.arity === 'either' ? route : { ...route, list: declared.arity === 'list' };
};

export interface ContainerUnwrap {
	readonly slot: string;
	readonly kinds: readonly string[];
	readonly terminals: readonly string[];
	readonly list: boolean;
	readonly slots?: readonly ContainerDataSlot[];
	readonly flags?: readonly string[];
	readonly flagged?: readonly string[];
	readonly refined?: true;
	readonly named?: true;
}

export interface ContainerDataSlot {
	readonly name: string;
	readonly slot: ModelSlot;
	readonly list?: boolean;
}

export interface StoppedRead {
	readonly kind: string;
	readonly vocab: string;
	readonly index: number;
}

export interface GrammarRoutes {
	readonly grammar: string;
	readonly readEntries: ReadonlyMap<string, readonly ReadEntry[]>;
	readonly vocabOf: ReadonlyMap<string, string>;
	readonly slots: ReadonlyMap<string, readonly SlotRoute[]>;
	readonly containers: ReadonlyMap<string, ContainerUnwrap>;
	readonly stopped: readonly StoppedRead[];
	readonly unplaced: readonly ClaimFact[];
	readonly claims: readonly RefinedClaim[];
}

export function slotByField(slots: readonly ModelSlot[], field: string): ModelSlot | undefined {
	return slots.find((s) => s.name === field || snake(s.propertyName) === field);
}

const shownKinds = (model: SlotModel, kind: string): readonly string[] => [kind, ...[...model.values()].filter((node) => node.shownAs.includes(kind)).map((node) => node.kind)];

const heldForms = (model: SlotModel, kind: string): readonly string[] => shownKinds(model, kind).flatMap((shown) => formsOf(model, shown));

function shownAsKind(model: SlotModel, from: string, kind: string): boolean {
	const node = modelNode(model, from);
	return from === kind || node?.shownAs.includes(kind) === true || (node?.splitFrom != null && shownAsKind(model, node.splitFrom, kind));
}

export function reachedBy(model: SlotModel, from: string, kind: string, seen: Set<string> = new Set<string>()): readonly string[] {
	if (shownAsKind(model, from, kind)) return [from];
	if (seen.has(from)) return [];
	seen.add(from);
	return (modelNode(model, from)?.subtypes ?? []).flatMap((subtype) => reachedBy(model, subtype, kind, seen));
}

export function slotByKind(model: SlotModel, slots: readonly ModelSlot[], kind: string): ModelSlot | undefined {
	return slots.find((s) => s.kinds.includes(kind)) ?? slots.find((s) => s.kinds.some((k) => reachedBy(model, k, kind).length > 0));
}

export const holdsNodes = (slot: ModelSlot): boolean => slot.storage !== 'boolean' && slot.kinds.length > 0;

export function listItems(node: ModelNode | undefined): ModelSlot | undefined {
	const held = node?.slots.filter(holdsNodes) ?? [];
	if (node !== undefined && held.length > 1)
		throw new Error(`bindings: ${node.kind} is a list whose items sit in ${held.length} slots (${held.map((slot) => slot.name).join(', ')}); a list holds its items in one slot`);
	return held.find((slot) => slot.multiple);
}

const separatedBy = (model: SlotModel, kind: string, claim: ClaimFact): boolean => {
	const separator = modelNode(model, kind)?.list?.separator;
	return separator !== undefined && claim.tokens.includes(separator);
};

type SlotCapture = Extract<SlotFact, { readonly route: 'rename' | 'dropped' }>;

const droppedToken = (capture: SlotCapture): string | undefined => (capture.route === 'dropped' && capture.field === null ? (capture.token ?? undefined) : undefined);

function capturedSlot(model: SlotModel, capture: SlotCapture, form: string): ModelSlot | undefined {
	const slots = shownSlots(model, form);
	const token = droppedToken(capture);
	return token === undefined ? slotFor(model, slots, capture) : slotHoldingText(model, slots, token);
}

export const holdsCapture = (model: SlotModel, capture: SlotCapture): boolean => heldForms(model, capture.owner).some((form) => capturedSlot(model, capture, form) !== undefined);

const tokenOf = (selector: SlotSelector | ContainerCapture): string | null => ('token' in selector ? selector.token : null);

function spellsToken(model: SlotModel, form: string, token: string): boolean {
	const node = modelNode(model, form);
	return node !== undefined && (node.spells.includes(token) || slotHoldingText(model, node.slots, token) !== undefined);
}

function holdsSelector(model: SlotModel, kind: string, selector: SlotSelector | ContainerCapture): boolean {
	const forms = heldForms(model, kind);
	const token = tokenOf(selector);
	if (token !== null) return forms.length > 0 && forms.every((form) => spellsToken(model, form, token));
	return forms.some((form) => slotFor(model, modelNode(model, form)?.slots ?? [], selector) !== undefined);
}

const containerSelectors = (container: ContainerFact): readonly (SlotSelector | ContainerCapture)[] => [container.element, ...container.captures, ...container.dropped];

export const holdsContainer = (model: SlotModel, container: ContainerFact): boolean => containerSelectors(container).every((selector) => holdsSelector(model, container.kind, selector));

function selectorText(selector: SlotSelector | ContainerCapture): string {
	const token = tokenOf(selector);
	if (token !== null) return `the token "${token}"`;
	return selector.field !== null ? `the field ${selector.field}` : selector.kind !== null ? `a ${selector.kind} child` : 'a child by position';
}

export function slotFor(model: SlotModel, slots: readonly ModelSlot[], n: SlotSelector): ModelSlot | undefined {
	if (n.field !== null) return slotByField(slots, n.field);
	if (n.kind !== null) return slotByKind(model, slots, n.kind);
	const previous = n.after === null ? undefined : slotFor(model, slots, n.after);
	return slots.slice(previous === undefined ? 0 : slots.indexOf(previous) + 1).find(holdsNodes);
}

export function slotAnchor(model: SlotModel, holder: string, selector: SlotSelector): Anchor | null {
	const slots = shownSlots(model, holder);
	const own = slotFor(model, slots, selector);
	const crosses = (neighbour: SlotSelector | undefined): boolean => neighbour !== undefined && slotFor(model, slots, neighbour) !== own;
	const first = selector.anchor === 'first' || selector.anchor === 'only' || crosses(selector.adjacent?.previous);
	const last = selector.anchor === 'last' || selector.anchor === 'only' || crosses(selector.adjacent?.next);
	return first && last ? 'only' : first ? 'first' : last ? 'last' : null;
}

const VALUE_NAMESPACE = 'literal';

export function valueTokensOf(routes: GrammarRoutes, fixedText: { has(kind: string): boolean }): ReadonlySet<string> {
	return new Set(
		[...routes.readEntries].flatMap(([kind, entries]) =>
			fixedText.has(kind) && entries.length > 0 && entries.every((entry) => entry.vocab.split('.')[0] === VALUE_NAMESPACE) ? [kind] : []
		)
	);
}

export function modelNode(model: SlotModel, kind: string): ModelNode | undefined {
	return model.get(kind) ?? model.get(`_${kind}`);
}

function shownNameOnly(model: SlotModel, kind: string): boolean {
	return !model.has(kind) && [...model.values()].some((node) => node.shownAs.includes(kind));
}

export function aliasContentSlot(node: ModelNode | undefined): ModelSlot | undefined {
	const [content, ...rest] = node?.modelType === 'alias' ? node.slots : [];
	return rest.length === 0 ? content : undefined;
}

export interface EnvelopeStorage {
	readonly content: ModelSlot;
	readonly storage: ModelNode;
}

export function envelopeStorage(model: SlotModel, kind: string): EnvelopeStorage | undefined {
	const content = aliasContentSlot(modelNode(model, kind));
	const [stored, ...others] = content?.kinds ?? [];
	const storage = stored === undefined || others.length > 0 ? undefined : modelNode(model, stored);
	return content !== undefined && storage !== undefined && storage.slots.length > 0 ? { content, storage } : undefined;
}

export const shownSlots = (model: SlotModel, kind: string): readonly ModelSlot[] =>
	envelopeStorage(model, kind)?.storage.slots ?? modelNode(model, kind)?.slots ?? [];

export interface HeldStep {
	readonly holder: string;
	readonly slot: ModelSlot;
}

function heldBy(model: SlotModel, holder: string, find: (slots: readonly ModelSlot[]) => ModelSlot | undefined): readonly HeldStep[] | undefined {
	const envelope = envelopeStorage(model, holder);
	const slot = find(shownSlots(model, holder));
	if (slot === undefined) return undefined;
	return envelope === undefined ? [{ holder, slot }] : [{ holder, slot: envelope.content }, { holder: envelope.storage.kind, slot }];
}

export const heldSteps = (model: SlotModel, holder: string, selector: SlotSelector): readonly HeldStep[] | undefined =>
	heldBy(model, holder, (slots) => slotFor(model, slots, selector));

const heldPath = (held: readonly HeldStep[], anchor: Anchor | null): SlotStep[] =>
	held.map((step, i) => stepOf(step.holder, step.slot.name, i === held.length - 1 ? anchor : null));

export type SlotNames = ReadonlyMap<string, string | null>;

export function slotNameOf(renames: SlotNames, slotName: string, propertyName: string): string {
	return camel(renames.get(slotName) ?? propertyName.replace(/_$/, '').replace(/Modifier$/, ''));
}

export function isLayout(input: GrammarInput, owner: string, slot: ModelSlot): boolean {
	return (
		input.layoutSlots.some((l) => (l.kind === null || l.kind === owner) && l.slot === slot.name) ||
		(slot.kinds.length > 0 && slot.terminals.length === 0 && slot.kinds.every((k) => modelNode(input.model, k)?.layout === true)) ||
		(slot.kinds.length > 0 &&
			slot.terminals.length === 0 &&
			slot.kinds.every((k) => input.bindings.unclaimed.some((u) => u.kind === k)))
	);
}

const TRANSPARENT_MODEL_TYPES: ReadonlySet<string> = new Set(['envelope', 'alias', 'polymorph']);

export function layoutDefaultsOf(input: GrammarInput, readEntries: ReadonlyMap<string, readonly ReadEntry[]>): ReadonlyMap<string, string> {
	const readsAs = (kind: string): string | undefined => {
		if (readEntries.has(kind)) return kind;
		const node = modelNode(input.model, kind);
		const unwrap = node === undefined ? undefined : containerOf(input, node);
		return unwrap === undefined || unwrap.list || unwrap.kinds.length !== 1 ? undefined : readsAs(unwrap.kinds[0]!);
	};
	return new Map(
		[...input.model.values()].flatMap((node): (readonly [string, string])[] => {
			if (!node.seated || node.variantOf === null || readEntries.has(node.kind) || node.slots.length === 0 || !node.slots.every((slot) => isLayout(input, node.kind, slot))) return [];
			const fallback = modelNode(input.model, node.variantOf)?.defaultSubtype;
			const target = fallback == null || fallback === node.kind ? undefined : readsAs(fallback);
			return target === undefined ? [] : [[node.kind, target]];
		})
	);
}

const untested = (entry: ReadEntry): boolean =>
	entry.pins.length === 0 && entry.present.length === 0 && entry.children.length === 0 && entry.claim.predicates.length === 0 && entry.separated !== true;

function containerOf(input: GrammarInput, node: ModelNode): ContainerUnwrap | undefined {
	const containers = declaredContainersOf(input, node);
	const declared = containers[0];
	if (declared === undefined && node.modelType === 'list') {
		const items = node.slots.find((slot) => slot.multiple);
		return items === undefined ? undefined : { slot: items.name, kinds: node.elementKinds, terminals: [], list: true };
	}
	const content = node.slots.filter((slot) => !isLayout(input, node.kind, slot));
	const element = declared
		? slotFor(input.model, node.slots, declared.element)
		: TRANSPARENT_MODEL_TYPES.has(node.modelType) && content.length === 1
			? content[0]
			: undefined;
	const named = namedElementsOf(containers);
	return element !== undefined && holdsNodes(element)
		? named === undefined
			? { slot: element.name, kinds: element.kinds, terminals: element.terminals, list: element.multiple }
			: { slot: element.name, kinds: named, terminals: [], list: element.multiple, named: true as const }
		: undefined;
}

function elementExclusionsOf(input: GrammarInput, kind: string, claim: ClaimFact): ChildTest[] {
	const node = modelNode(input.model, kind);
	if (node === undefined) return [];
	const unwrap = containerOf(input, node);
	const element = declaredContainersOf(input, node)[0]?.element;
	if (unwrap?.named !== true || element === undefined) return [];
	const tested = claim.children.some((child) => 'subject' in child && child.subject.up === 0 && child.subject.down[0] !== undefined && slotFor(input.model, node.slots, child.subject.down[0])?.name === unwrap.slot);
	return tested ? [] : [{ subject: { up: 0, down: [{ ...element, kind: null }] }, excludes: concreteKinds(input.model, unwrap.kinds) }];
}

function declaredContainersIn(model: SlotModel, declared: readonly ContainerFact[], kind: string): readonly ContainerFact[] {
	const containers = declared.filter((c) => holdsContainer(model, c));
	return [...containers.filter((c) => c.kind === kind), ...containers.filter((c) => c.kind !== kind && formsOf(model, c.kind).includes(kind))];
}

function declaredContainersOf(input: GrammarInput, node: ModelNode): readonly ContainerFact[] {
	return declaredContainersIn(input.model, input.bindings.containers, node.kind);
}

function namedElementsOf(containers: readonly ContainerFact[]): readonly string[] | undefined {
	const named = containers.flatMap(({ element }) => (element.field !== null && element.kind !== null && element.kind !== WILDCARD ? [element.kind] : []));
	return containers.length > 0 && named.length === containers.length ? [...new Set(named)] : undefined;
}

function containerDataSlots(input: GrammarInput, node: ModelNode, vocabOf: ReadonlyMap<string, string>): NonNullable<ContainerUnwrap['slots']> {
	const slots = new Map<string, ContainerDataSlot>();
	for (const container of declaredContainersOf(input, node)) {
		const resolved = containerSlots(input, container, vocabOf);
		if (resolved.targets.length === 0) continue;
		for (const { name, slot, flag } of resolved.slots) {
			const own = slot === undefined || flag ? undefined : node.slots.find((candidate) => candidate.name === slot.name);
			if (own === undefined || slots.has(name)) continue;
			const list = declaredListAt(input.vocabulary, container.kind, resolved.targets, name);
			slots.set(name, { name, slot: own, ...(list === undefined ? {} : { list }) });
		}
	}
	return [...slots.values()];
}

function narrowedTo(model: SlotModel, node: ModelNode, element: SlotSelector): string | null {
	const { kind } = element;
	const slot = slotFor(model, node.slots, element);
	if (kind === null || kind === WILDCARD || slot === undefined) return null;
	const named = concreteKinds(model, [kind]);
	return concreteKinds(model, slot.kinds).every((held) => named.includes(held)) ? null : kind;
}

function containerFlags(input: GrammarInput, node: ModelNode, vocabOf: ReadonlyMap<string, string>): { readonly flags: readonly string[]; readonly flagged?: readonly string[] } {
	const lines: { readonly flags: readonly string[]; readonly scope: string | null }[] = [];
	for (const container of declaredContainersOf(input, node)) {
		const resolved = containerSlots(input, container, vocabOf);
		if (resolved.targets.length === 0) continue;
		const set = resolved.slots.filter(
			({ capture, slot, flag }) => flag && (slot === undefined || (slot.required && slot.kinds.length === 0 && slot.terminals.every((terminal) => terminal === capture.token)))
		);
		if (set.length > 0) lines.push({ flags: set.map(({ name }) => name), scope: narrowedTo(input.model, node, container.element) });
	}
	const scopes = lines.map(({ scope }) => scope);
	if (scopes.includes(null) && scopes.some((scope) => scope !== null))
		throw new Error(`bindings: ${node.kind}'s container lines set flags both on every element and on ${scopes.filter((scope) => scope !== null).join(', ')} alone; one container's flags land on one set of elements`);
	const flags = [...new Set(lines.flatMap((line) => line.flags))];
	const flagged = [...new Set(scopes.filter((scope): scope is string => scope !== null))];
	for (const flag of flags) {
		const on = new Set(lines.filter((line) => line.flags.includes(flag)).map(({ scope }) => scope));
		const missing = flagged.filter((scope) => !on.has(scope));
		if (missing.length > 0)
			throw new Error(`bindings: ${node.kind}'s container lines set ${flag} on ${[...on].join(', ')} but not on ${missing.join(', ')}; one container's flags land on one set of elements`);
	}
	return { flags, ...(flagged.length === 0 ? {} : { flagged }) };
}

function declaredListAt(vocabulary: Vocabulary, kind: string, targets: readonly string[], name: string): boolean | undefined {
	const lists = targets.flatMap((target) => {
		const declared = vocabulary.slots(target).get(name);
		return declared === undefined || declared.arity === 'either' ? [] : [{ target, list: declared.arity === 'list' }];
	});
	const listed = lists.filter((at) => at.list);
	if (listed.length > 0 && listed.length < lists.length)
		throw new Error(`bindings: ${kind}'s @${name} is a list at ${listed.map((at) => at.target).join(', ')} and one value at ${lists.filter((at) => !at.list).map((at) => at.target).join(', ')}; one slot has one arity`);
	return lists[0]?.list;
}

const textOfKind = (model: SlotModel, kind: string): string | undefined => {
	const node = modelNode(model, kind);
	return isFixedText(node) ? node.text : undefined;
};

const textsOfKind = (model: SlotModel, kind: string): readonly string[] => {
	const node = modelNode(model, kind);
	return isFixedText(node) ? [node.text] : (node?.enumMembers ?? []).map((member) => member.text);
};

function onlyTextOf(model: SlotModel, kinds: readonly string[]): string | undefined {
	const texts = kinds.map((kind) => textsOfKind(model, kind));
	const [only, ...more] = new Set(texts.flat());
	return kinds.length > 0 && texts.every((own) => own.length > 0) && more.length === 0 ? only : undefined;
}

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

function pinnedLiterals(model: SlotModel, slots: readonly ModelSlot[], claim: ClaimFact): [string, string][] {
	const literals: [string, string][] = Object.entries(claim.fieldLiterals);
	for (const text of claim.tokens) {
		const pinned = slotHoldingText(model, slots, text);
		if (pinned && !literals.some(([field]) => field === pinned.name)) literals.push([pinned.name, text]);
	}
	return literals;
}

function pinsOf(model: SlotModel, kind: string, claim: ClaimFact, renames: SlotNames): Pin[] {
	const slots = shownSlots(model, kind);
	const separator = modelNode(model, kind)?.list?.separator;
	const unheld = claim.tokens.filter((text) => text !== separator && slotHoldingText(model, slots, text) === undefined && !textsOfKind(model, kind).includes(text));
	if (unheld.length > 0)
		throw new Error(`bindings: ${kind}'s claim as ${claim.vocab} tests ${unheld.map((text) => `"${text}"`).join(', ')}, which no slot of ${kind} holds and its own text does not spell`);
	return pinnedLiterals(model, slots, claim).map(([field, text]) => {
		const slot = slotByField(slots, field);
		return { name: slotNameOf(renames, slot?.name ?? field, slot?.propertyName ?? field), slot: slot?.name ?? field, text };
	});
}

function absentSlotsOf(model: SlotModel, kind: string, claim: ClaimFact): string[] {
	const slots = shownSlots(model, kind);
	return claim.absent.flatMap((field) => slotByField(slots, field)?.name ?? []);
}

const negatesOneSlot = (entry: ReadEntry): boolean =>
	entry.absent.length === 1 &&
	entry.pins.length === 0 &&
	entry.children.length === 0 &&
	entry.claim.predicates.length === 0 &&
	entry.claim.tokens.length === 0 &&
	Object.keys(entry.claim.fieldLiterals).length === 0;

function presentSlotsOf(entry: ReadEntry, entries: readonly ReadEntry[]): string[] {
	const placement = entry.claim.within.join('/');
	const refinements = entries.filter(
		(other) => other !== entry && other.vocab.startsWith(`${entry.vocab}.`) && other.claim.toplevel === entry.claim.toplevel && other.claim.within.join('/') === placement && negatesOneSlot(other)
	);
	return [...new Set(refinements.flatMap((other) => other.absent))].filter((slot) => !entry.absent.includes(slot));
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
		const held = holders.flatMap((holder) => heldSteps(model, holder, selector)?.slice(-1) ?? []);
		if (held.length < holders.length) return undefined;
		slots = held.map((step) => step.slot);
		owners = held.map((step) => step.holder);
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
	const names = new Set(holders.map((holder) => slotHoldingText(model, shownSlots(model, holder), child.token)?.name));
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
	const slots = shownSlots(model, holder);
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

const claimChildTests = (model: SlotModel, kind: string, claim: ClaimFact): ChildTest[] => claim.children.flatMap((child) => childTestsOf(model, kind, child, claim.children));

const atOrUnder = (path: string, other: string): boolean => path === other || path.startsWith(`${other}.`);

const inheritedClaims = (entry: { readonly vocab: string }, entries: readonly { readonly vocab: string; readonly index: number }[]): ReadonlySet<number> =>
	new Set(entries.filter((other) => atOrUnder(entry.vocab, other.vocab)).map((other) => other.index));

const unconditional = (entry: ReadEntry): boolean =>
	entry.claim.toplevel &&
	entry.claim.within.length === 0 &&
	entry.claim.predicates.length === 0 &&
	entry.claim.absent.length === 0 &&
	entry.pins.length === 0 &&
	entry.separated !== true &&
	entry.children.length === 0;

const attaches = (slot: SlotFact, inherited: ReadonlySet<number>): boolean => slot.claims === undefined || slot.claims.some((index) => inherited.has(index));

type Declares = (path: string, slot: string) => boolean;

const names = (slot: SlotFact, entry: { readonly vocab: string }, inherited: ReadonlySet<number>, declares: Declares): boolean =>
	attaches(slot, inherited) || (slot.route === 'rename' && declares(entry.vocab, slot.name));

export const namesEvery = (slot: SlotFact, entries: readonly { readonly vocab: string; readonly index: number }[], declares: Declares): boolean =>
	entries.every((entry) => names(slot, entry, inheritedClaims(entry, entries), declares));

const declaredBy =
	(vocabulary: Vocabulary): Declares =>
	(path, slot) =>
		vocabulary.kinds.has(path) && vocabulary.slots(path).has(slot);

const testCount = ({ claim }: ReadEntry): number =>
	Object.keys(claim.fieldLiterals).length + claim.tokens.length + claim.children.length + claim.predicates.length + claim.within.length;

const specificity = (entry: ReadEntry): number => {
	const placed = entry.claim.within.length > 0;
	const predicated = entry.claim.predicates.length > 0;
	const literal = entry.pins.length > 0 || entry.claim.tokens.length > 0 || entry.children.length > 0;
	return placed && predicated ? 0 : predicated ? 1 : placed ? 2 : literal ? 3 : 4;
};

const PREDICATED = 2;

export function heldInto(model: SlotModel, at: string, step: SlotSelector): { readonly held: readonly HeldStep[]; readonly next: readonly ModelNode[] } | undefined {
	const held = heldSteps(model, at, step);
	const last = held?.at(-1);
	const named = step.kind;
	if (held === undefined || last === undefined || named === null) return undefined;
	const reached = [...new Set(last.slot.kinds.flatMap((k) => reachedBy(model, k, named)))];
	const next = (reached.length === 0 ? [named] : reached).flatMap((kind) => modelNode(model, kind) ?? []);
	return next.length === 0 ? undefined : { held, next };
}

function stepInto(model: SlotModel, at: string, step: SlotSelector): { readonly steps: readonly SlotStep[]; readonly next: readonly ModelNode[] } | undefined {
	const into = heldInto(model, at, step);
	const last = into?.held.at(-1);
	if (into === undefined || last === undefined) return undefined;
	const anchor = slotAnchor(model, last.holder, step);
	return last.slot.multiple && anchor === null ? undefined : { steps: heldPath(into.held, anchor), next: into.next };
}

interface Chain {
	readonly steps: readonly SlotStep[];
	readonly at: ModelNode;
}

function viaPath(model: SlotModel, owner: string, via: readonly SlotSelector[]): readonly Chain[] {
	const start = modelNode(model, owner);
	return via.toReversed().reduce<readonly Chain[]>(
		(chains, step) =>
			chains.flatMap(({ steps, at }) => {
				const into = stepInto(model, at.kind, step);
				return into === undefined ? [] : into.next.map((next) => ({ steps: [...steps, ...into.steps], at: next }));
			}),
		start === undefined ? [] : [{ steps: [], at: start }]
	);
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

function listFormItems(input: GrammarInput, node: ModelNode, slotNamesOf: (kind: string) => SlotNames): SlotRoute[] {
	const owner = node.variantOf;
	const items = listItems(node);
	if (items === undefined) return [];
	const own: SlotRoute[] = [{ route: 'slot', name: slotNameOf(slotNamesOf(node.kind), items.name, items.propertyName), slot: items, path: [{ owner: node.kind, slot: items.name }] }];
	if (owner === null || !formsOf(input.model, owner).includes(node.kind)) return own;
	for (const sibling of formsOf(input.model, owner)) {
		const at = modelNode(input.model, sibling);
		if (at === undefined || at.modelType === 'list') continue;
		const holder = at.slots.find((slot) => {
			const held = heldElements(input, slot);
			return held.length > 0 && node.elementKinds.every((kind) => held.includes(kind));
		});
		if (holder !== undefined)
			return [{ route: 'slot', name: slotNameOf(slotNamesOf(sibling), holder.name, holder.propertyName), slot: items, path: [{ owner: node.kind, slot: items.name }] }];
	}
	return own;
}

function interiorPartOf(model: SlotModel, slot: ModelSlot, claimed: (kind: string) => boolean): { readonly slot: ModelSlot; readonly step: SlotStep } | undefined {
	const [held, ...more] = slot.terminals.length === 0 ? concreteKinds(model, slot.kinds) : [];
	const node = held === undefined || more.length > 0 || claimed(held) ? undefined : modelNode(model, held);
	const part = node?.slots.find((inner) => inner.name === node.interiorPart);
	return node === undefined || part === undefined ? undefined : { slot: part, step: stepOf(node.kind, part.name, null) };
}

const holdsOnlyText = (slot: ModelSlot): boolean => slot.storage !== 'boolean' && slot.kinds.length === 0 && slot.terminals.length === 0;

type DeepSlot = Extract<SlotFact, { readonly route: 'presence' | 'nested' }>;

const isDeep = (slot: SlotFact): slot is DeepSlot => slot.route === 'presence' || slot.route === 'nested';

const isListDelimiter = (model: SlotModel, slot: SlotFact, kind: string): slot is Extract<DeepSlot, { readonly route: 'presence' }> =>
	slot.route === 'presence' && slot.anchor !== undefined && reachedBy(model, kind, slot.owner).length > 0;

function deepRoutesOf(model: SlotModel, kind: string, slot: DeepSlot): readonly SlotRoute[] {
	const chains = viaPath(model, kind, slot.via);
	const routes = (chains.length === 0 ? [undefined] : chains).map((chain) => deepRouteAt(model, slot, chain));
	const reached = routes.filter((route) => route.path !== undefined);
	return reached.length > 0 ? reached : routes.slice(0, 1);
}

function deepRouteAt(model: SlotModel, fact: DeepSlot, chain: Chain | undefined): SlotRoute {
	if (fact.route === 'presence' && fact.anchor !== undefined) return delimiterRouteOf(fact, chain);
	if (fact.route === 'presence') {
		const held = chain === undefined ? undefined : heldBy(model, chain.at.kind, (slots) => slots.find((s) => s.terminals.includes(fact.token)));
		const spelled = fact.flag === true && fact.via.length === 0 && chain !== undefined && held === undefined;
		return {
			route: 'presence',
			name: camel(fact.name),
			via: fact.via,
			token: fact.token,
			path: chain && held ? [...chain.steps, ...heldPath(held, null)] : undefined,
			...flagOf(fact),
			...(spelled ? { spelled: true } : {})
		};
	}
	const parent = chain?.at ?? modelNode(model, fact.parent);
	const held = parent === undefined ? undefined : heldSteps(model, parent.kind, fact);
	const last = held?.at(-1);
	const slot = last?.slot;
	return {
		route: 'nested',
		name: camel(fact.name),
		via: fact.via,
		parent: fact.parent,
		selector: slotSelectorOf(fact),
		slot,
		multiple: fact.multiple,
		path: chain && held && last ? [...chain.steps, ...heldPath(held, slotAnchor(model, last.holder, fact))] : undefined,
		...flagOf(fact)
	};
}

function delimiterRouteOf(slot: Extract<DeepSlot, { readonly route: 'presence' }>, chain: Chain | undefined): SlotRoute {
	const name = camel(slot.name);
	const list = chain?.at;
	const separated = list?.list?.trailing === 'optional' && list.list.separator === slot.token;
	if (list === undefined || chain === undefined || slot.anchor !== 'last' || !separated)
		throw new Error(`bindings: ${list?.kind ?? slot.owner}'s ${name} anchors the token "${slot.token}"; an anchored token names a list's own optional separator after its last item`);
	const items = list.list?.singleElementNeedsTrailing === true ? listItems(list) : undefined;
	return {
		route: 'delimiter',
		name,
		delimiter: Delimiter.Trailing,
		path: slot.via.length === 0 ? undefined : chain.steps,
		...(items === undefined ? {} : { items: stepOf(list.kind, items.name, null) }),
		...flagOf(slot)
	};
}

export interface Guaranteed {
	readonly holds: (path: readonly SlotStep[] | undefined) => boolean;
	readonly many: (path: readonly SlotStep[]) => boolean;
	readonly present: (path: readonly SlotStep[]) => readonly string[] | undefined;
	readonly pinned: (path: readonly SlotStep[]) => string | undefined;
	readonly absent: (path: readonly SlotStep[]) => boolean;
}

const pathKey = (path: readonly SlotStep[]): string => path.map((step) => `${step.owner} ${step.slot} ${step.anchor ?? ''}`).join(' > ');

export function guaranteedBy(
	model: SlotModel,
	entry: {
		readonly kind: string;
		readonly children: readonly ChildTest[];
		readonly pins?: readonly Pin[];
		readonly absent?: readonly string[];
		readonly present?: readonly string[];
		readonly claim?: { readonly predicates: readonly PredicateFact[] };
	}
): Guaranteed {
	const one = new Map<string, Set<string>>();
	const many = new Set<string>();
	const walk = (child: ChildTest, holder: string, path: readonly SlotStep[], i: number): void => {
		const selector = child.subject.down[i];
		const held = selector === undefined ? undefined : heldSteps(model, holder, selector);
		const last = held?.at(-1);
		if (selector === undefined || held === undefined || last === undefined) return;
		const at = [...path, ...heldPath(held, slotAnchor(model, last.holder, selector))];
		const key = pathKey(at);
		const final = i === child.subject.down.length - 1;
		if (!('excludes' in child)) {
			const kinds = one.get(key) ?? one.set(key, new Set<string>()).get(key)!;
			for (const kind of final && 'kinds' in child ? child.kinds : selector.kind === null ? [] : [selector.kind]) kinds.add(kind);
		} else if (final) many.add(key);
		for (const next of heldInto(model, holder, selector)?.next ?? []) walk(child, next.kind, at, i + 1);
	};
	for (const child of entry.children) if (child.subject.up === 0) walk(child, entry.kind, [], 0);
	const heldSlot = (slot: string): readonly (readonly [string, ModelSlot])[] => {
		const held = heldSteps(model, entry.kind, { field: slot, kind: null, after: null, anchor: null });
		return held === undefined ? [] : [[pathKey(heldPath(held, null)), held.at(-1)!.slot]];
	};
	const spelled = (entry.claim?.predicates ?? []).flatMap((predicate) => {
		const [step, ...deeper] = predicate.subject?.down ?? [];
		const [argument, ...more] = predicate.arguments;
		if (predicate.operator !== 'eq' || predicate.capture?.startsWith('_') !== true || predicate.subject?.up !== 0 || step === undefined || deeper.length > 0 || argument === undefined || more.length > 0 || !('text' in argument)) return [];
		const held = heldSteps(model, entry.kind, step);
		return held === undefined ? [] : [[pathKey(heldPath(held, null)), argument.text] as const];
	});
	const pinned = new Map([...(entry.pins ?? []).flatMap((pin) => heldSlot(pin.slot).map(([key]) => [key, pin.text] as const)), ...spelled]);
	const absent = new Set((entry.absent ?? []).flatMap((slot) => heldSlot(slot).map(([key]) => key)));
	for (const [key, slot] of (entry.present ?? []).flatMap(heldSlot)) if (!one.has(key)) one.set(key, new Set(slot.kinds));
	return {
		pinned: (path) => pinned.get(pathKey(path)),
		absent: (path) => absent.has(pathKey(path)),
		holds: (path = []) => path.every((step, i) => step.anchor !== 'only' || one.has(pathKey(path.slice(0, i + 1)))),
		many: (path) => many.has(pathKey(path)),
		present: (path) => {
			const kinds = one.get(pathKey(path));
			return kinds === undefined ? undefined : concreteKinds(model, [...kinds]);
		}
	};
}

function slotsOf(
	input: GrammarInput,
	kind: string,
	entries: readonly ReadEntry[],
	entry: ReadEntry,
	slotNamesOf: (kind: string) => SlotNames,
	claimed: (kind: string) => boolean
): SlotRoute[] {
	const guaranteed = guaranteedBy(input.model, entry);
	const inherited = inheritedClaims(entry, entries);
	const node = modelNode(input.model, kind);
	if (node === undefined) return [];
	if (node.modelType === 'list') {
		const delimiters = input.bindings.slots.filter((slot) => isListDelimiter(input.model, slot, kind));
		const items = listItems(node);
		const counted = items !== undefined && entries.some((entry) => entry.separated === true);
		const routes = delimiters
			.flatMap((slot) => deepRoutesOf(input.model, kind, { ...slot, owner: kind }))
			.map((route) => (counted && route.route === 'delimiter' ? { ...route, items: stepOf(kind, items.name, null) } : route));
		return [...listFormItems(input, node, slotNamesOf), ...routes.filter((route, i) => routes.findIndex((other) => other.name === route.name) === i)];
	}
	const envelope = envelopeStorage(input.model, kind);
	const holder = envelope?.storage.kind ?? kind;
	const claims = envelope?.storage.kind ?? node.aliasStorage ?? kind;
	const slots = envelope?.storage.slots ?? node.slots;
	const through: readonly SlotStep[] = envelope === undefined ? [] : [{ owner: kind, slot: envelope.content.name }];
	const pathTo = (slot: ModelSlot): readonly SlotStep[] => [...through, { owner: holder, slot: slot.name }];
	const kindNames = claims === kind ? slotNamesOf(kind) : new Map([...slotNamesOf(claims), ...slotNamesOf(kind)]);
	const owns = (fact: { readonly owner: string }): boolean => fact.owner === kind || fact.owner === claims;
	const routesHere = (slot: SlotFact): boolean =>
		owns(slot) || (isDeep(slot) && attaches(slot, inherited) && captureReaches(input.model, slot, kind));
	const deepRoutes = (slot: DeepSlot): readonly SlotRoute[] => {
		if (slot.owner === kind) return deepRoutesOf(input.model, kind, slot);
		if (envelope === undefined) return deepRoutesOf(input.model, kind, slot.route === 'nested' && slot.parent === slot.owner ? { ...slot, parent: kind } : slot);
		return deepRoutesOf(input.model, holder, slot).map((route) => (route.path === undefined ? route : { ...route, path: [...through, ...route.path] }));
	};
	const told = new Map<string, Set<string>>();
	const tell = (slot: string, text: string): void => void (told.get(slot) ?? told.set(slot, new Set<string>()).get(slot))?.add(text);
	for (const pin of entries.flatMap((entry) => entry.pins)) tell(pin.slot, pin.text);
	const below = new Map<string, Set<string>>();
	const innerSlot = (at: string, step: SlotSelector): ModelSlot | undefined => slotFor(input.model, shownSlots(input.model, at), step);
	const beneath = new Map<string, Set<string>>();
	for (const child of entries.flatMap((entry) => entry.children)) {
		const [step, inner, third, ...deeper] = child.subject.down;
		const slot = child.subject.up === 0 && step !== undefined && deeper.length === 0 ? slotFor(input.model, slots, step) : undefined;
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
			for (const at of slot.kinds) {
				const name = innerSlot(at, inner)?.name;
				if (name === undefined) continue;
				const key = `${slot.name} ${at} ${name}`;
				const told = below.get(key) ?? below.set(key, new Set<string>()).get(key);
				for (const kind of concreteKinds(input.model, child.kinds)) told?.add(kind);
			}
		} else if ('text' in child) tell(slot.name, child.text);
		else if ('kinds' in child) for (const text of child.kinds.flatMap((k) => textOfKind(input.model, k) ?? [])) tell(slot.name, text);
	}
	const hiddenBelow = (slot: ModelSlot): readonly ModelSlot[] | undefined => {
		if (slot.multiple || slot.kinds.length === 0) return undefined;
		const covered = slot.kinds.map((at) =>
			shownSlots(input.model, at).find((inner) => {
				const told = below.get(`${slot.name} ${at} ${inner.name}`);
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
			input.bindings.slots.some((m) => routesHere(m) && m.route === 'nested' && m.parent === at && slotFor(input.model, shownSlots(input.model, at), m) === held) ||
			(values !== undefined && values.every((value) => told.has(value))) ||
			concreteKinds(input.model, held.kinds).every((k) => told.has(k))
		);
	};
	const refuseHidden = (slot: ModelSlot, covered: readonly ModelSlot[]): void => {
		for (const at of concreteKinds(input.model, covered.flatMap((inner) => inner.kinds))) {
			const held = modelNode(input.model, at);
			if (isFixedText(held) || (held?.enumMembers.length ?? 0) > 0) continue;
			const open = held === undefined || held.slots.length === 0 ? ['its text'] : shownSlots(input.model, at).filter((s) => !accounted(at, s)).map((s) => s.name);
			if (open.length > 0)
				throw new Error(
					`bindings: ${kind}'s read entries test every kind its ${slot.name} slot's node can hold, so no slot of the path reads it, but ${at} there holds ${open.join(', ')}, which no claim on ${kind} captures or tests; capture it or test it`
				);
		}
	};
	const identifier = entries.some((entry) => isIdentifierPath(entry.vocab));
	const textual = !identifier && textValued(input.vocabulary, entry.vocab);
	const scalarValued = input.vocabulary.kinds.has(entry.vocab) && input.vocabulary.slots(entry.vocab).get(VALUE)?.scalar !== undefined;
	const shaping = input.bindings.slots.filter((m) => routesHere(m) && m.route !== 'rename' && m.route !== 'dropped');
	const deep = shaping.filter((m) => attaches(m, inherited));
	const paths = new Map(shaping.flatMap((m) => (isDeep(m) ? [[m, deepRoutes(m)] as const] : [])));
	const counted = new Set([...paths.values()].flat().flatMap((route) => route.path?.filter((step) => step.owner === holder && step.anchor === 'only').map((step) => step.slot) ?? []));
	const reached = new Map([...paths].flatMap(([m, routes]) => {
		const held = routes.filter((route) => guaranteed.holds(route.path));
		return held.length === 0 ? [] : [[m, held] as const];
	}));
	const via = new Set(
		[...reached].flatMap(([m, routes]) => routes.flatMap((route) => (route.path === undefined ? m.via.flatMap((step) => step.kind ?? []) : [])))
	);
	const entered = new Map<string, Set<string>>();
	for (const route of [...reached.values()].flat())
		(route.path ?? []).forEach((step, i, path) => {
			const next = path[i + 1];
			if ((step.owner === kind || step.owner === holder) && next !== undefined && next.owner !== kind && next.owner !== holder)
				(entered.get(`${step.slot} ${next.owner}`) ?? entered.set(`${step.slot} ${next.owner}`, new Set<string>()).get(`${step.slot} ${next.owner}`)!).add(route.name);
		});
	const captures: readonly Extract<SlotFact, { readonly route: 'rename' }>[] = input.bindings.slots.flatMap((m) =>
		m.route === 'rename' && attaches(m, inherited) && (captureReaches(input.model, m, kind) || (claims !== kind && captureReaches(input.model, m, claims))) ? [m] : []
	);
	const declares = declaredBy(input.vocabulary);
	const named = input.bindings.slots.flatMap((m) =>
		m.route === 'rename' && m.flag !== true && names(m, entry, inherited, declares) && (captureReaches(input.model, m, kind) || (claims !== kind && captureReaches(input.model, m, claims))) ? [m] : []
	);
	const byPrecedence = [...named.filter((m) => !attaches(m, inherited)), ...named.filter((m) => attaches(m, inherited))];
	const slotNames: SlotNames = new Map([...kindNames, ...byPrecedence.flatMap((m) => {
		const slot = slotFor(input.model, slots, m);
		return slot === undefined ? [] : [[slot.name, m.name] as const];
	})]);
	const flags = captures.filter((m) => m.flag === true);
	const spelledFlags: SlotRoute[] = [];
	const flagSlots = new Map(flags.flatMap((m) => {
		const slot = slotFor(input.model, slots, m);
		if (slot === undefined && formsOf(input.model, m.owner).every((form) => slotFor(input.model, modelNode(input.model, form)?.slots ?? [], m) === undefined)) {
			const spelled = m.field === null && modelNode(input.model, m.owner)?.variantOf != null ? spelledFlagRouteOf(m) : undefined;
			if (spelled !== undefined) {
				spelledFlags.push(spelled);
				return [];
			}
			throw new Error(`bindings: ${m.owner}'s flag @${m.name} captures ${selectorText(m)}, which no form of ${m.owner} holds`);
		}
		return slot === undefined ? [] : [[m, slot] as const];
	}));
	const capturesOf = (slot: ModelSlot) => captures.filter((m) => slotFor(input.model, slots, m) === slot);
	const unrouted = (slot: ModelSlot, why: string, [capture] = capturesOf(slot)): void => {
		if (capture !== undefined) throw new Error(`bindings: ${kind}'s capture @${capture.name} reaches no slot of its path: its ${slot.name} slot ${why}; capture a grammar slot a route reads, or mark it @dropped`);
	};
	const routes: SlotRoute[] = [];
	const namedKinds = new Map<SlotRoute, readonly string[]>();
	for (const slot of isLeafAlias(input, node) ? [] : slots) {
		if (([...flagSlots.values()].includes(slot) && !slotNames.has(slot.name)) || slotNames.get(slot.name) === null || guaranteed.absent(pathTo(slot))) continue;
		if (isLayout(input, holder, slot)) {
			unrouted(slot, 'is layout');
			continue;
		}
		if (scalarValued && (slot.valueSource === true || slot.registered === true)) {
			unrouted(slot, 'is an option, or a slot the scalar its $value holds is written from');
			continue;
		}
		if (identifier && holdsOnlyText(slot)) {
			unrouted(slot, 'holds only text on a kind read as an identifier');
			continue;
		}
		if (counted.has(slot.name) && !guaranteed.many([...through, { owner: holder, slot: slot.name, anchor: 'only' }])) {
			unrouted(slot, 'is counted by a slot anchored as its only node');
			continue;
		}
		const kept = keptKinds(input.model, slot, capturesOf(slot));
		const own = slotNameOf(slotNames, slot.name, slot.propertyName);
		const taken = (k: string): boolean => via.has(k) || entered.has(`${slot.name} ${k}`);
		const form = (k: string): boolean => entered.get(`${slot.name} ${k}`)?.has(own) === true;
		const below = concreteKinds(input.model, slot.kinds).some((k) => form(k) && !slot.kinds.includes(k));
		const keptBelow = new Set(concreteKinds(input.model, [...kept]));
		const out = (k: string): boolean => form(k) || !keptBelow.has(k);
		const opened = (kinds: readonly string[]): readonly string[] =>
			kinds.flatMap((k) => {
				const under = concreteKinds(input.model, [k]);
				const subtypes = modelNode(input.model, k)?.subtypes ?? [];
				return subtypes.length > 0 && under.some(out) && !under.every(out) ? opened(subtypes) : [k];
			});
		const arms = below ? [...new Set(opened(slot.kinds))] : slot.kinds;
		const except = below
			? arms.filter((k) => (slot.kinds.includes(k) && taken(k)) || concreteKinds(input.model, [k]).every(out))
			: arms.filter((k) => taken(k) || !kept.has(k));
		if (except.length > 0 && except.length === arms.length) {
			unrouted(slot, 'is the path of a deeper slot');
			continue;
		}
		const read = except.length === 0 ? slot : { ...slot, kinds: arms.filter((k) => !except.includes(k)) };
		const rest = except.length === 0 ? slot : { ...read, required: false };
		const captured = capturesOf(slot).length > 0;
		const present = concreteKinds(input.model, rest.kinds).filter((k) => guaranteed.present(pathTo(slot))?.includes(k) === true);
		const pin = guaranteed.pinned(pathTo(slot));
		const narrowed =
			present.length > 0
				? { ...rest, required: true, terminals: [], kinds: present }
				: pin !== undefined
					? { ...rest, required: true, terminals: rest.terminals.filter((t) => t === pin), kinds: concreteKinds(input.model, rest.kinds).filter((k) => textOfKind(input.model, k) === pin) }
					: undefined;
		const named = slotNameOf(slotNames, slot.name, slot.propertyName);
		const name = textual && (!captured || !input.vocabulary.slots(entry.vocab).has(named)) ? VALUE : named;
		const flag = entries.some((entry) => input.bindings.flagsByPath?.get(entry.vocab)?.has(name) === true) ? { flag: true as const } : {};
		if (captured && flag.flag !== true && !slot.multiple && (pin ?? onlyTextOf(input.model, guaranteed.present(pathTo(slot)) ?? [])) !== undefined) {
			unrouted(slot, 'is pinned to one fixed text by the same claim', capturesOf(slot).filter((m) => m.claims?.includes(entry.index) === true));
			continue;
		}
		if (!captured && pin !== undefined && !slot.multiple && narrowed !== undefined && narrowed.kinds.length === 0 && narrowed.terminals.length === 0) continue;
		const tested = captured ? rest : (narrowed ?? rest);
		if (toldByRead(input.model, tested, told.get(slot.name) ?? new Set<string>())) {
			unrouted(slot, 'is told by the read');
			continue;
		}
		const hidden = captured ? undefined : hiddenBelow(slot);
		if (hidden !== undefined) {
			refuseHidden(slot, hidden);
			continue;
		}
		const path = pathTo(slot);
		const part = interiorPartOf(input.model, read, claimed);
		if (part !== undefined) {
			routes.push({ route: 'slot', name, slot: part.slot, path: [...path, part.step], ...flag });
			continue;
		}
		const route: SlotRoute = except.length === 0 ? { route: 'slot', name, slot, path, ...flag } : { route: 'slot', name, slot: read, except, path, ...flag };
		routes.push(route);
		const landed = concreteKinds(input.model, read.kinds);
		const kinds = concreteKinds(input.model, capturesOf(slot).flatMap((m) => (m.flag === true || m.kind === null || m.kind === WILDCARD ? [] : [m.kind]))).filter((k) => landed.includes(k));
		if (kinds.length > 0) namedKinds.set(route, kinds);
	}
	for (const [fact, slot] of flagSlots) routes.push(flagRouteOf(kind, fact, slot, pathTo(slot)));
	routes.push(...spelledFlags);
	const ownPaths = [...reached].flatMap(([m, held]) => (m.claims?.includes(entry.index) === true ? held.flatMap((route) => (route.path === undefined ? [] : [route.path])) : []));
	const beneathOwn = (route: SlotRoute): boolean =>
		route.path !== undefined && ownPaths.some((path) => path.length > route.path!.length && stepPast(route.path, path) !== undefined);
	for (const slot of deep) {
		if (slot.route === 'kind') {
			const named = routes.find((r) => r.route === 'slot' && r.name === camel(slot.slot));
			routes.push({ route: 'kind', name: camel(slot.name), kind: slot.kind, path: named?.route === 'slot' ? named.path : undefined, ...flagOf(slot) });
			continue;
		}
		if (!isDeep(slot)) continue;
		const known = new Set(routes.map((route) => JSON.stringify(route)));
		const own = slot.claims?.includes(entry.index) === true;
		const held = reached.get(slot) ?? [];
		const modelled = (at: string | null): boolean => at === null || at === WILDCARD || modelNode(input.model, at) !== undefined;
		if (held.some((route) => route.route === 'nested' && route.path === undefined && modelled(route.parent) && route.via.every((step) => modelled(step.kind))))
			throw new Error(
				`bindings: ${kind}'s capture @${slot.name} reaches no slot of its path: its route enters one of the many nodes a grammar slot holds with no anchor, or names a node no grammar slot on its way holds; anchor that node, capture the grammar slot itself, or mark it @dropped`
			);
		routes.push(...held.filter((route) => !known.has(JSON.stringify(route)) && (own || !beneathOwn(route))));
	}
	const joined = oneRoutePerPath(routes);
	for (const route of joined) {
		const landed = landedKinds(input.model, route);
		const deeper = joined.find((other) => {
			const next = other !== route && other.name === route.name ? stepPast(route.path, other.path) : undefined;
			return next !== undefined && landed.includes(next.owner);
		});
		if (deeper !== undefined)
			throw new Error(`bindings: ${kind}'s slot ${route.name} is routed both through ${pathText(route.path)} and deeper through ${pathText(deeper.path)}; one slot has one route through a grammar slot`);
	}
	return oneBuildPerSlot(input.model, joined, (route) => declaredArity(input.vocabulary, entry.vocab, route).list !== false, (route) => namedKinds.get(route) ?? []);
}

function oneBuildPerSlot(model: SlotModel, routes: readonly SlotRoute[], listed: (route: SlotRoute) => boolean, named: (route: SlotRoute) => readonly string[]): SlotRoute[] {
	const groups = new Map<string, SlotRoute[]>();
	for (const route of routes)
		if ((route.route === 'slot' || route.route === 'nested') && route.path !== undefined && route.path.length > 0 && route.flag !== true)
			(groups.get(route.name) ?? groups.set(route.name, []).get(route.name)!).push(route);
	const readOnly = new Set<SlotRoute>();
	const split = new Map<SlotRoute, readonly SlotRoute[]>();
	const captureOf = (route: SlotRoute): string => (route.route === 'nested' ? JSON.stringify([route.parent, route.via, route.selector]) : route.route);
	for (const group of groups.values()) {
		if (group.length < 2 || new Set(group.map(captureOf)).size < group.length) continue;
		const paths = group.map((route) => route.path!);
		const same = (i: number): boolean => paths.every((path) => path[i] !== undefined && path[i]!.owner === paths[0]![i]!.owner && path[i]!.slot === paths[0]![i]!.slot);
		let shared = 0;
		while (same(shared)) shared++;
		if (shared === 0) continue;
		const formOf = (route: SlotRoute): readonly string[] => concreteKinds(model, route.path!.length > shared ? [route.path![shared]!.owner] : landedKinds(model, route));
		const forms = group.map(formOf);
		if (forms.some((form, i) => forms.some((other, j) => j > i && form.some((k) => other.includes(k))))) continue;
		const many = (slot: ModelSlot | undefined): boolean => slot !== undefined && (slot.multiple || slot.chain?.list === true);
		const holdsMany = (route: SlotRoute): boolean => listed(route) && (route.route === 'nested' ? route.multiple || many(route.slot) : route.route === 'slot' && many(route.slot));
		if (!group.some(holdsMany)) continue;
		for (const route of group) {
			if (holdsMany(route)) continue;
			const kinds = named(route);
			if (route.route !== 'slot' || kinds.length === 0) {
				readOnly.add(route);
				continue;
			}
			const except = route.except ?? [];
			const others = route.slot.kinds.filter((kind) => !kinds.includes(kind) && !except.includes(kind));
			split.set(route, [
				{ ...route, slot: { ...route.slot, kinds }, except: [...except, ...others], kinds },
				...(others.length === 0 ? [] : [{ ...route, slot: { ...route.slot, kinds: others }, except: [...except, ...kinds], readOnly: true as const }])
			]);
		}
	}
	return routes.flatMap((route) => split.get(route) ?? [readOnly.has(route) ? { ...route, readOnly: true as const } : route]);
}

type NestedRoute = Extract<SlotRoute, { readonly route: 'nested' }>;

export const capturedKinds = (route: NestedRoute): readonly string[] | null => route.kinds ?? (route.selector.kind === null ? null : [route.selector.kind]);

function oneRoutePerPath(routes: readonly SlotRoute[]): SlotRoute[] {
	const kinded = (route: SlotRoute): route is NestedRoute => route.route === 'nested' && route.path !== undefined && route.selector.kind !== null && route.selector.kind !== WILDCARD;
	const joined: SlotRoute[] = [];
	for (const route of routes) {
		const at = kinded(route) ? joined.findIndex((other) => kinded(other) && other.name === route.name && other.multiple === route.multiple && JSON.stringify(other.path) === JSON.stringify(route.path)) : -1;
		if (at < 0) {
			joined.push(route);
			continue;
		}
		const held = joined[at] as NestedRoute;
		joined[at] = { ...held, kinds: [...new Set([...capturedKinds(held)!, ...capturedKinds(route as NestedRoute)!])] };
	}
	return joined;
}

const slotSelectorOf = ({ field, kind, after, anchor, adjacent }: SlotSelector): SlotSelector => ({ field, kind, after, anchor, ...(adjacent === undefined ? {} : { adjacent }) });

function landedKinds(model: SlotModel, route: SlotRoute): readonly string[] {
	switch (route.route) {
		case 'slot':
			return route.slot.kinds.filter((kind) => !(route.except ?? []).includes(kind));
		case 'nested': {
			const named = capturedKinds(route);
			const held = route.slot?.kinds ?? [];
			return named === null || named.includes(WILDCARD) ? held : held.filter((kind) => named.some((at) => reachedBy(model, kind, at).length > 0));
		}
		case 'kind':
			return [route.kind];
		case 'presence':
		case 'delimiter':
			return [];
	}
}

const stepPast = (path: readonly SlotStep[] | undefined, longer: readonly SlotStep[] | undefined): SlotStep | undefined =>
	path === undefined || longer === undefined || !path.every((step, i) => step.owner === longer[i]?.owner && step.slot === longer[i]?.slot) ? undefined : longer[path.length];

const pathText = (path: readonly SlotStep[] | undefined): string => (path ?? []).map((step) => `${step.owner}.${step.slot}`).join(' > ');

function flagRouteOf(kind: string, fact: Extract<SlotFact, { readonly route: 'rename' }>, slot: ModelSlot, path: readonly SlotStep[]): SlotRoute {
	const name = camel(fact.name);
	if (fact.kind !== null && fact.kind !== WILDCARD) return { route: 'kind', name, kind: fact.kind, path, flag: true };
	const [only, ...more] = slot.terminals;
	const token = fact.token ?? (more.length === 0 ? only : undefined);
	if (token === undefined)
		throw new Error(`bindings: ${kind}'s flag ${name} captures its ${slot.name} slot, which holds ${slot.terminals.join(', ')}; capture the one token the flag tests`);
	return { route: 'presence', name, via: [], token, path, flag: true };
}

function spelledFlagRouteOf(fact: Extract<SlotFact, { readonly route: 'rename' }>): SlotRoute | undefined {
	const name = camel(fact.name);
	if (fact.kind !== null && fact.kind !== WILDCARD) return { route: 'kind', name, kind: fact.kind, path: undefined, flag: true, spelled: true };
	return fact.token === undefined ? undefined : { route: 'presence', name, via: [], token: fact.token, path: undefined, flag: true, spelled: true };
}

const flagOf = (slot: SlotFact): { readonly flag?: true } => (slot.flag === true ? { flag: true } : {});

const flaggedDelimiter = (kind: string, route: SlotRoute): SlotRoute => {
	if (route.route === 'delimiter' && route.flag !== true) throw new Error(`bindings: ${kind}'s ${route.name} reads a list's trailing separator, which is a flag`);
	return route;
};

function refinedParent(kind: string, entries: readonly { readonly vocab: string }[]): string | undefined {
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

export function readEntriesLookup(routes: GrammarRoutes, model: SlotModel): (kind: string, seen?: Set<string>) => readonly ReadEntry[] | undefined {
	const supertypesOf = new Map<string, string[]>();
	for (const n of model.values()) for (const s of n.subtypes) (supertypesOf.get(s) ?? supertypesOf.set(s, []).get(s)!).push(n.kind);
	const entriesFor = (kind: string, seen = new Set<string>()): readonly ReadEntry[] | undefined => {
		const found = routes.readEntries.get(kind);
		if (found !== undefined && found.length > 0) return found;
		for (const s of supertypesOf.get(kind) ?? []) {
			if (seen.has(s)) continue;
			seen.add(s);
			const up = entriesFor(s, seen);
			if (up !== undefined) return up;
		}
		return undefined;
	};
	return entriesFor;
}

export function portableClaims(routes: GrammarRoutes, model: SlotModel): (kind: string, listed: boolean) => boolean {
	const entriesFor = readEntriesLookup(routes, model);
	return (kind, listed) => entriesFor(kind) !== undefined || (!listed && routes.containers.has(kind));
}

export function concreteKinds(model: SlotModel, kinds: readonly string[]): string[] {
	const seen = new Set<string>();
	return [...new Set(kinds.flatMap((kind) => concreteKindsOf(model, kind, seen)))].sort();
}

function keptKinds(model: SlotModel, slot: ModelSlot, captures: readonly Extract<SlotFact, { readonly route: 'rename' }>[]): ReadonlySet<string> {
	const dataCaptures = captures.filter((m) => m.flag !== true);
	const named = dataCaptures.flatMap((m) => (m.field === null && m.kind !== null && m.kind !== WILDCARD ? [m.kind] : []));
	if (slot.kinds.length < 2 || dataCaptures.length === 0 || named.length < dataCaptures.length) return new Set(slot.kinds);
	const concrete = new Set(concreteKinds(model, named));
	return new Set(slot.kinds.filter((k) => named.includes(k) || concreteKinds(model, [k]).some((c) => concrete.has(c))));
}

function admittedKinds(model: SlotModel, claim: ClaimFact): string[] {
	const holder = claim.within[0];
	if (holder === undefined || holder === WILDCARD)
		throw new Error(`bindings: the wildcard claim @${claim.vocab} has no enclosing kind to read its kinds from`);
	const admitted = heldForms(model, holder).flatMap((form) => {
		const node = modelNode(model, form);
		const slots = node?.slots ?? [];
		return claim.field === null
			? [...slots.filter(holdsNodes).flatMap((slot) => slot.kinds), ...(node?.elementKinds ?? [])]
			: (slotByField(slots, claim.field)?.kinds ?? []);
	});
	return concreteKinds(model, admitted);
}

function claimFormsOf(model: SlotModel, owner: string, claim: ClaimFact): readonly string[] {
	const forms = formsOf(model, owner);
	const [holder] = claim.within;
	if (holder === undefined || holder === WILDCARD) return forms;
	const admitted = new Set(admittedKinds(model, claim));
	return forms.filter((form) => form === owner || shownKinds(model, form).some((kind) => admitted.has(kind)));
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

export interface MountHolder {
	readonly holder: string;
	readonly slot: string;
}

const mountHolders = new WeakMap<SlotModel, ReadonlyMap<string, readonly MountHolder[]>>();

export function mountHoldersOf(model: SlotModel, kind: string): readonly MountHolder[] {
	let byKind = mountHolders.get(model);
	if (byKind === undefined) {
		const built = new Map<string, MountHolder[]>();
		for (const node of model.values())
			for (const slot of node.slots)
				for (const mounted of Object.keys(slot.mounts ?? {})) (built.get(mounted) ?? built.set(mounted, []).get(mounted)!).push({ holder: node.kind, slot: slot.name });
		mountHolders.set(model, (byKind = built));
	}
	return byKind.get(kind) ?? [];
}

export function formsOf(model: SlotModel, kind: string, seen: ReadonlySet<string> = new Set()): readonly string[] {
	if (seen.has(kind)) return [];
	const within = new Set([...seen, kind]);
	const node = modelNode(model, kind);
	const supertype = node?.modelType === 'supertype';
	const nested = [...model.values()].filter((other) => other.splitFrom === kind || (supertype && other.variantOf === kind));
	const source = node?.splitFrom != null && isParserHiddenName(kind) ? formsOf(model, node.splitFrom, within) : [];
	return [...new Set([kind, ...nested.flatMap((other) => formsOf(model, other.kind, within)), ...source])];
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

interface ClaimRead {
	readonly form: string;
	readonly claimed: string;
	readonly vocab: string;
	readonly claim: ClaimFact;
	readonly index: number;
	readonly spelled: boolean;
	readonly decided: boolean;
}

type ClaimReads = ReadonlyMap<string, readonly ClaimRead[]>;

function tokenKindOf(model: SlotModel, token: string): string | null {
	const [kind, ...more] = [...model.values()].filter((node) => isFixedText(node) && node.slots.length === 0 && node.text === token);
	return kind === undefined || more.length > 0 ? null : kind.kind;
}

const parsedForm =
	(model: SlotModel) =>
	(form: string): boolean =>
		modelNode(model, form)?.modelType !== 'supertype' && shownKinds(model, form).some((kind) => modelNode(model, kind) !== undefined);

export function readsByKind(model: SlotModel, claims: readonly ClaimFact[]): ClaimReads {
	const claimsOwn = new Set(claims.flatMap((c) => (c.kind === null || c.kind === WILDCARD ? [] : [`${c.kind} ${c.vocab}`])));
	const reads = new Map<string, ClaimRead[]>();
	claims.forEach((claim, index) => {
		const owner = claim.kind ?? (claim.token === undefined ? null : tokenKindOf(model, claim.token));
		if (owner === null) return;
		const forms = owner === WILDCARD ? admittedKinds(model, claim).filter((kind) => !claimsOwn.has(`${kind} ${claim.vocab}`)) : claimFormsOf(model, owner, claim);
		const literal = owner !== WILDCARD && literalClaimOf(claim) !== undefined;
		for (const form of forms.filter(parsedForm(model)))
			for (const { kind, spelled } of readKinds(model, form, claim)) {
				const decided = literal && modelNode(model, form)?.splitFrom != null && form === boundKindName(claim.vocab, isParserHiddenName(form));
				const read = { form, claimed: owner === WILDCARD ? form : owner, vocab: claim.vocab, claim, index, spelled, decided };
				(reads.get(kind) ?? reads.set(kind, []).get(kind))?.push(read);
			}
	});
	return reads;
}

const plainRead =
	(model: SlotModel, kind: string) =>
	({ claim }: ClaimRead): boolean =>
		claim.predicates.length === 0 &&
		!separatedBy(model, kind, claim) &&
		pinnedLiterals(model, modelNode(model, kind)?.slots ?? [], claim).length === 0 &&
		claimChildTests(model, kind, claim).length === 0;

export const declaredContainerKinds = (model: SlotModel, containers: readonly ContainerFact[]): ReadonlySet<string> =>
	new Set(containers.flatMap((container) => formsOf(model, container.kind)));

export function refinedContainers(model: SlotModel, reads: ClaimReads, containers: readonly ContainerFact[]): ReadonlySet<string> {
	const declared = declaredContainerKinds(model, containers);
	return new Set(
		[...reads].flatMap(([kind, at]) => {
			const plain = plainRead(model, kind);
			const named = namedElementsOf(declaredContainersIn(model, containers, kind)) !== undefined;
			return declared.has(kind) && (named || !at.some((read) => read.claim.toplevel && plain(read))) ? [kind] : [];
		})
	);
}

export function kindVocabs(model: SlotModel, reads: ClaimReads, refined: ReadonlySet<string>): ReadonlyMap<string, string> {
	const vocabOf = new Map<string, string>();
	for (const [kind, at] of reads) {
		if (refined.has(kind)) continue;
		const plain = plainRead(model, kind);
		const top = at.filter((read) => read.claim.toplevel);
		const own = top.filter((read) => read.form === read.claimed);
		const vocab = own.find(plain)?.vocab ?? top.find(plain)?.vocab ?? refinedParent(kind, own.length > 0 ? own : top);
		if (vocab !== undefined) vocabOf.set(kind, vocab);
	}
	return vocabOf;
}

type ReadPick = (slot: NamedSlotFact, kind: string, at: readonly ClaimRead[]) => readonly ClaimRead[];

const pathsOfReads = (model: SlotModel, reads: ClaimReads, pick: ReadPick) =>
	(slot: NamedSlotFact): string[] => [
		...new Set([...reads].flatMap(([kind, at]) => (modelNode(model, kind) !== undefined && captureReaches(model, slot, kind) ? pick(slot, kind, at).map((read) => read.vocab) : [])))
	];

const attachedReads = (model: SlotModel): ReadPick => (slot, kind, at) => {
	if (modelNode(model, kind)?.modelType === 'list') return isListDelimiter(model, slot, kind) ? at : [];
	const paths = isDeep(slot) ? deepRoutesOf(model, kind, slot).map((route) => route.path) : [undefined];
	return at.filter((read) => {
		const guaranteed = guaranteedBy(model, { kind, children: claimChildTests(model, kind, read.claim) });
		return attaches(slot, inheritedClaims(read, at)) && paths.some((path) => guaranteed.holds(path));
	});
};

export function capturePaths(model: SlotModel, reads: ClaimReads): (slot: NamedSlotFact) => string[] {
	const attached = attachedReads(model);
	return pathsOfReads(model, reads, (slot, kind, at) => (slot.route === 'rename' ? at : attached(slot, kind, at)));
}

export function slotTargets(model: SlotModel, reads: ClaimReads): (slot: NamedSlotFact) => string[] {
	return pathsOfReads(model, reads, attachedReads(model));
}

export function envelopeTargets(model: SlotModel, container: ContainerFact, vocabOf: ReadonlyMap<string, string>): string[] {
	const named = container.element.kind;
	const elements = formsOf(model, container.kind).flatMap((holder) => {
		const held = slotFor(model, modelNode(model, holder)?.slots ?? [], container.element)?.kinds ?? [];
		return named === null || named === WILDCARD ? held : held.some((kind) => reachedBy(model, kind, named).length > 0) ? [named] : [];
	});
	return [
		...new Set(
			elements.flatMap((kind) =>
				formsOf(model, kind).flatMap((form) => {
					const vocab = vocabOf.get(form);
					return vocab === undefined ? [] : [vocab];
				})
			)
		)
	];
}

export interface ContainerSlot {
	readonly capture: ContainerCapture;
	readonly name: string;
	readonly slot: ModelSlot | undefined;
	readonly flag: boolean;
}

export function containerCaptureSlot(model: SlotModel, slots: readonly ModelSlot[], capture: ContainerCapture): ModelSlot | undefined {
	const { token } = capture;
	return token !== null ? slotHoldingText(model, slots, token) : slotFor(model, slots, capture);
}

export function containerSlots(
	input: GrammarInput,
	container: ContainerFact,
	vocabOf: ReadonlyMap<string, string>
): { readonly targets: readonly string[]; readonly slots: readonly ContainerSlot[] } {
	const modelSlots = modelNode(input.model, container.kind)?.slots ?? [];
	const targets = envelopeTargets(input.model, container, vocabOf);
	const slots = container.captures.map((capture) => {
		const name = camel(capture.name);
		const flagged = targets.filter((target) => input.bindings.flagsByPath?.get(target)?.has(name) === true);
		if (flagged.length > 0 && flagged.length < targets.length)
			throw new Error(`bindings: ${container.kind}'s capture @${capture.name} is a flag at ${flagged.join(', ')} and data at ${targets.filter((target) => !flagged.includes(target)).join(', ')}; one name names one thing`);
		return { capture, name, slot: containerCaptureSlot(input.model, modelSlots, capture), flag: capture.token !== null || flagged.length > 0 };
	});
	return { targets, slots };
}

export function captureReaches(model: SlotModel, slot: NamedSlotFact, kind: string): boolean {
	if (isListDelimiter(model, slot, kind)) return true;
	if (slot.route !== 'rename' && !(isDeep(slot) && slot.claims !== undefined)) return slot.owner === kind;
	const forms = formsOf(model, slot.owner);
	if (!forms.includes(kind)) return false;
	const holds = (form: string): boolean =>
		slot.route === 'rename' ? slotFor(model, shownSlots(model, form), slot) !== undefined : isDeep(slot) && viaPath(model, form, slot.via).length > 0;
	return holds(kind) || !forms.some(holds);
}

function liftMounted(model: SlotModel, refined: readonly RefinedClaim[], readEntries: Map<string, ReadEntry[]>, order: (kind: string, entries: ReadEntry[]) => void): void {
	const lifts = [...readEntries].flatMap(([kind, entries]) => entries.flatMap((entry) => (refined[entry.index]?.mountedIn == null ? [] : [{ kind, entry, holder: refined[entry.index]!.mountedIn! }])));
	for (const { kind, entry, holder } of lifts) {
		const [mount, other] = mountHoldersOf(model, kind).filter((at) => at.holder === holder);
		if (mount === undefined) throw new Error(`bindings: ${entry.vocab} reads ${kind} at its holder ${holder}, which mounts no form ${kind} reads as`);
		if (other !== undefined) throw new Error(`bindings: ${entry.vocab} reads ${kind} at its holder ${holder}, which mounts it in both ${mount.slot} and ${other.slot}`);
		const tests = entry.pins.length + entry.absent.length + entry.children.length;
		if (tests > 0 || entry.separated === true || entry.template !== undefined)
			throw new Error(`bindings: ${entry.vocab} reads ${kind} at its holder ${holder}, so its claim tests nothing of ${kind} itself`);
		const at = stepOf(holder, mount.slot, null);
		const lift = (route: SlotRoute): SlotRoute => {
			if ((route.route !== 'slot' && route.route !== 'kind') || route.path === undefined)
				throw new Error(`bindings: ${entry.vocab} reads ${kind} at its holder ${holder}, which routes no slot ${route.name} (a ${route.route} route) through ${kind}`);
			return { ...route, path: [at, ...route.path] };
		};
		const subject: CaptureSite = { up: 0, down: [{ field: mount.slot, kind: null, after: null, anchor: null }] };
		const children = childTestsOf(model, holder, { subject, kinds: [kind], captured: false }, []);
		const into = readEntries.get(holder);
		if (into === undefined) throw new Error(`bindings: ${entry.vocab} reads ${kind} at its holder ${holder}, which no claim reads`);
		into.push({ ...entry, kind: holder, children, present: [], slots: entry.slots.map(lift), ...(entry.value === undefined ? {} : { value: lift(entry.value) }) });
		order(holder, into);
	}
	for (const { kind, entry } of lifts) {
		const kept = (readEntries.get(kind) ?? []).filter((other) => other !== entry);
		if (kept.length === 0) readEntries.delete(kind);
		else readEntries.set(kind, kept);
	}
}

function slotNamedThroughContainer(input: GrammarInput, claimed: (kind: string) => boolean, fact: Extract<SlotFact, { readonly route: 'nested' }>): string | undefined {
	if (fact.via.length !== 1 || fact.via[0]!.field === null || fact.kind !== null || fact.anchor !== null || fact.after !== null || fact.adjacent !== undefined) return undefined;
	const through = fact.via[0]!;
	const slot = slotFor(input.model, shownSlots(input.model, fact.owner), through);
	const container = modelNode(input.model, fact.parent);
	if (slot?.chain?.list !== true || container === undefined || slot.chain.storage[0] !== container.kind || slot.chain.storage.some((kind) => claimed(kind))) return undefined;
	const sole = input.bindings.slots.every((other) => other === fact || other.route !== 'nested' || other.owner !== fact.owner || other.via[0]?.field !== through.field);
	return sole && slotFor(input.model, shownSlots(input.model, container.kind), fact)?.name === slot.chain.slots[0] ? slot.name : undefined;
}

export function resolveRoutes(given: GrammarInput): GrammarRoutes {
	const reads = readsByKind(given.model, given.bindings.claims);
	const throughContainers = new Map<SlotFact, { readonly slot: string; readonly name: string }>(
		given.bindings.slots.flatMap((fact) => {
			if (fact.route !== 'nested') return [];
			const slot = slotNamedThroughContainer(given, (kind) => reads.has(kind), fact);
			return slot === undefined ? [] : [[fact, { slot, name: fact.name }] as const];
		})
	);
	const input: GrammarInput = { ...given, bindings: { ...given.bindings, slots: given.bindings.slots.filter((fact) => !throughContainers.has(fact)) } };

	const heldLines = new Set(input.bindings.containers.filter((container) => holdsContainer(input.model, container)).map((container) => container.pattern.line));
	for (const container of input.bindings.containers.filter((container) => !heldLines.has(container.pattern.line)))
		for (const selector of containerSelectors(container))
			if (!holdsSelector(input.model, container.kind, selector))
				throw new Error(`bindings: ${container.kind}'s container selects ${selectorText(selector)}, which no form of ${container.kind} holds`);

	const slotNames = new Map<string, Map<string, string | null>>();
	for (const fact of input.bindings.slots) {
		if ((fact.route !== 'rename' && fact.route !== 'dropped') || (fact.route === 'rename' && fact.flag === true)) continue;
		for (const form of formsOf(input.model, fact.owner)) {
			const slot = capturedSlot(input.model, fact, form);
			if (slot !== undefined && (fact.route === 'dropped' || namesEvery(fact, reads.get(form) ?? [], declaredBy(input.vocabulary)))) (slotNames.get(form) ?? slotNames.set(form, new Map<string, string | null>()).get(form))?.set(slot.name, fact.route === 'rename' ? fact.name : null);
		}
		if (heldForms(input.model, fact.owner).some((form) => modelNode(input.model, form) !== undefined) && !holdsCapture(input.model, fact)) {
			const token = droppedToken(fact);
			const capture = fact.route === 'rename' ? `@${fact.name}` : '@dropped';
			throw new Error(`bindings: ${fact.owner}'s ${capture} captures ${token === undefined ? selectorText(fact) : `the token "${token}"`}, which no form of ${fact.owner} holds`);
		}
	}
	for (const [fact, { slot, name }] of throughContainers)
		for (const form of formsOf(input.model, fact.owner))
			if (namesEvery(fact, reads.get(form) ?? [], declaredBy(input.vocabulary))) (slotNames.get(form) ?? slotNames.set(form, new Map<string, string | null>()).get(form))?.set(slot, name);
	const slotNamesOf = (kind: string): SlotNames => slotNames.get(kind) ?? new Map<string, string | null>();

	const readEntries = new Map<string, ReadEntry[]>();
	const inherited = new Set<ReadEntry>();
	const cloned = new Set<ReadEntry>();
	for (const [kind, at] of reads)
		if (!shownNameOnly(input.model, kind))
			readEntries.set(
				kind,
				at.map(({ form, claimed, vocab, claim, index, spelled, decided }) => {
					const entry: ReadEntry = {
						kind,
						claimed,
						vocab,
						claim,
						index,
						pins: pinsOf(input.model, kind, claim, slotNamesOf(kind)),
						absent: absentSlotsOf(input.model, kind, claim),
						present: [],
						children: [...claimChildTests(input.model, kind, claim), ...elementExclusionsOf(input, kind, claim)],
						template: claim.template,
						slots: [],
						...(separatedBy(input.model, kind, claim) ? { separated: true as const } : {}),
						...(spelled ? { spelled: true as const } : {}),
						...(decided ? { decided: true as const } : {})
					};
					if (form !== claimed) inherited.add(entry);
					if (form !== claimed && modelNode(input.model, form)?.splitFrom != null) cloned.add(entry);
					return entry;
				})
			);

	const refined = refinedContainers(input.model, reads, input.bindings.containers);
	const vocabOf = kindVocabs(input.model, reads, refined);
	const rank = (e: ReadEntry): number => (inherited.has(e) ? 1 : 0);
	const order = (kind: string, entries: ReadEntry[]): void => {
		const named = (e: ReadEntry): number => (boundKindName(e.vocab, isParserHiddenName(kind)) === kind ? 0 : 1);
		const tested = (e: ReadEntry): number => Math.min(specificity(e), PREDICATED);
		entries.sort((a, b) => tested(a) - tested(b) || named(a) - named(b) || specificity(a) - specificity(b) || rank(a) - rank(b) || testCount(b) - testCount(a) || a.index - b.index);
	};
	for (const [kind, entries] of readEntries) order(kind, entries);
	const stopped: StoppedRead[] = [];
	for (const [kind, entries] of readEntries) {
		const own = entries.filter((entry) => !inherited.has(entry) && unconditional(entry));
		const stops = (entry: ReadEntry): boolean => cloned.has(entry) && own.some((o) => !atOrUnder(entry.vocab, o.vocab) && !atOrUnder(o.vocab, entry.vocab));
		for (const entry of entries.filter(stops)) stopped.push({ kind, vocab: entry.vocab, index: entry.index });
		readEntries.set(kind, entries.filter((entry) => !stops(entry)));
	}

	for (const [kind, entries] of readEntries) readEntries.set(kind, entries.map((entry) => ({ ...entry, present: presentSlotsOf(entry, entries) })));

	const declares = declaredBy(input.vocabulary);
	const restricted = (kind: string, entry: ReadEntry): boolean =>
		entry.claimed !== kind && modelNode(input.model, entry.claimed)?.modelType === 'supertype' && input.vocabulary.kinds.has(entry.vocab);
	const routesDeclared = (kind: string, entry: ReadEntry) => (route: SlotRoute): boolean => !restricted(kind, entry) || declares(entry.vocab, route.name);
	for (const [kind, entries] of readEntries)
		readEntries.set(
			kind,
			entries.map((entry) => {
				const routed = slotsOf(input, kind, entries, entry, slotNamesOf, (held) => reads.has(held));
				const value = routed.find((route) => route.name === VALUE);
				return {
					...entry,
					slots: routed
						.filter((route) => route !== value)
						.filter(routesDeclared(kind, entry))
						.map((route) => declaredArity(input.vocabulary, entry.vocab, flaggedDelimiter(kind, route))),
					...(value === undefined ? {} : { value })
				};
			})
		);
	const claims = refineClaims(input.bindings.claims, (kind) => formsOf(input.model, kind), (kind) => mountHoldersOf(input.model, kind).map(({ holder }) => holder));
	liftMounted(input.model, claims, readEntries, order);
	for (const [kind, target] of layoutDefaultsOf(input, readEntries)) {
		const entries = (readEntries.get(target) ?? []).filter(untested).map((entry): ReadEntry => ({ ...entry, kind, absent: [], template: undefined, slots: [], empty: true }));
		if (entries.length > 0) readEntries.set(kind, entries);
	}

	const slotRoutes = new Map<string, SlotRoute[]>();
	for (const [kind, routed] of readEntries) {
		const union: SlotRoute[] = [];
		const keys: string[] = [];
		for (const entry of routed) {
			let at = -1;
			for (const route of entry.slots) {
				const key = JSON.stringify(route);
				const found = keys.indexOf(key);
				if (found >= 0) {
					at = found;
					continue;
				}
				at += 1;
				keys.splice(at, 0, key);
				union.splice(at, 0, route);
			}
		}
		slotRoutes.set(kind, union);
	}

	const containers = new Map<string, ContainerUnwrap>();
	for (const node of input.model.values()) {
		const unwrap = containerOf(input, node);
		if (unwrap === undefined) continue;
		const slots = containerDataSlots(input, node, vocabOf);
		const { flags, flagged } = containerFlags(input, node, vocabOf);
		const isRefined = refined.has(node.kind);
		const separated = (readEntries.get(node.kind) ?? []).some((entry) => entry.separated === true);
		if (isRefined && unwrap.list && !separated)
			throw new Error(`bindings: ${node.kind} is claimed and also unwraps to its elements, a list; only a list claimed by its own separator holds one element when the claim fails`);
		containers.set(node.kind, { ...unwrap, ...(isRefined && separated ? { list: false } : {}), ...(slots.length === 0 ? {} : { slots }), ...(flags.length === 0 ? {} : { flags }), ...(flagged === undefined ? {} : { flagged }), ...(isRefined ? { refined: true as const } : {}) });
	}

	const placed = new Set([...readEntries.values()].flatMap((entries) => entries.map((entry) => entry.claim)));
	const unplaced = input.bindings.claims.filter((claim) => !placed.has(claim));

	return { grammar: input.grammar, readEntries, vocabOf, slots: slotRoutes, containers, stopped, unplaced, claims };
}

export function unenteredForms(input: GrammarInput, routes: GrammarRoutes): string[] {
	return input.bindings.claims.flatMap((claim, index) => {
		const owner = claim.kind;
		if (owner === null || owner === WILDCARD) return [];
		return claimFormsOf(input.model, owner, claim)
			.filter((form) => form !== owner && parsedForm(input.model)(form))
			.flatMap((form) =>
				readKinds(input.model, form, claim).flatMap(({ kind }) =>
					shownNameOnly(input.model, kind) || (routes.readEntries.get(kind) ?? []).some((e) => e.index === index) || routes.stopped.some((s) => s.kind === kind && s.index === index) ? [] : [kind]
				)
			)
			.map((kind) => `${input.grammar}: ${kind} has no entry for its supertype ${owner}'s claim @${claim.vocab}, so it reads by no path there when no claim of its own holds`);
	});
}
