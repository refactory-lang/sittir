import { isBlank } from '../../dsl/rule-patterns.ts';
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { CHOICE, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Multiplicity, RenderRule, RuleId } from '../../types/rule.ts';
import type { EmitShapeFailure } from '../diagnostics/emit-diagnostics.ts';
import { concreteKindsOf, isFixedTextLeaf, isMultiple, slotWrittenAt, type AssembledNode, type AssembledNonterminal } from './node-map.ts';
import { isSeamChoice } from './render-rules.ts';

export interface ArmTest {
	readonly slots: readonly string[];
	readonly kinds?: readonly string[];
}

export type PartitionTree = { readonly group: readonly number[] } | { readonly test: ArmTest; readonly present: PartitionTree; readonly absent: PartitionTree };

export type ChoicePartition =
	| { readonly form: 'flat' }
	| { readonly form: 'chain'; readonly tree: PartitionTree }
	| { readonly form: 'refused'; readonly failure: EmitShapeFailure };

export interface ChoicePartitionInput {
	readonly nodes: ReadonlyMap<string, AssembledNode>;
	readonly rules: Readonly<Record<string, RenderRule>>;
	readonly slotByRuleId: ReadonlyMap<string, ReadonlyMap<RuleId, AssembledNonterminal>>;
}

interface ArmGroup {
	readonly shape: string;
	readonly indices: number[];
	readonly held: Set<string>;
	required: readonly (readonly string[])[];
	readonly kindsAt: Map<string, readonly string[]>;
}

const EMPTY_ARM = '{"q":[]}';
const SLOT_SET_LIMIT = 4096;
const walker = new RuleWalker<RenderRule>();

export function slotNameInBody(slot: AssembledNonterminal): string {
	return slot.storageName.replace(/^_+/, '') || 'children';
}

export function flatSlotOrder(armOrders: readonly (readonly string[])[]): string[] {
	const first: string[] = [];
	for (const order of armOrders) for (const name of order) if (!first.includes(name)) first.push(name);
	const after = new Map(first.map((name) => [name, new Set<string>()]));
	const waiting = new Map(first.map((name) => [name, 0]));
	for (const order of armOrders) {
		order.forEach((name, i) => {
			const next = order[i + 1];
			if (next === undefined || after.get(name)!.has(next)) return;
			after.get(name)!.add(next);
			waiting.set(next, waiting.get(next)! + 1);
		});
	}
	const placed: string[] = [];
	while (placed.length < first.length) {
		const ready = first.find((name) => !placed.includes(name) && waiting.get(name) === 0);
		if (ready === undefined) return first;
		placed.push(ready);
		for (const next of after.get(ready)!) waiting.set(next, waiting.get(next)! - 1);
	}
	return placed;
}

export function flatOrderParses(armOrders: readonly (readonly string[])[], order: readonly string[]): boolean {
	const isSubsequence = (needle: readonly string[], hay: readonly string[]): boolean => {
		let i = 0;
		for (const name of hay) if (i < needle.length && needle[i] === name) i++;
		return i === needle.length;
	};
	return armOrders.every((arm) => {
		const held = new Set(arm);
		const projected = order.filter((name) => held.has(name));
		return armOrders.some((other) => isSubsequence(projected, other));
	});
}

function partitionTree(groups: readonly ArmGroup[]): PartitionTree | readonly ArmGroup[] {
	if (groups.length === 1) return { group: groups[0]!.indices };
	const admits = (group: ArmGroup, slot: string, kinds: readonly string[] | undefined): boolean => {
		const own = group.kindsAt.get(slot);
		return kinds === undefined || own === undefined || own.some((kind) => kinds.includes(kind));
	};
	const confined = (group: ArmGroup, slot: string, kinds: readonly string[] | undefined): boolean => {
		const own = group.kindsAt.get(slot);
		return kinds === undefined || (own !== undefined && own.every((kind) => kinds.includes(kind)));
	};
	const holds = (group: ArmGroup, test: ArmTest): boolean => test.slots.some((slot) => group.held.has(slot) && admits(group, slot, test.kinds));
	const requires = (group: ArmGroup, test: ArmTest): boolean =>
		group.required.some((own) => own.every((slot) => test.slots.includes(slot) && confined(group, slot, test.kinds)));
	const testsOf = (group: ArmGroup, byKind: boolean): ArmTest[] =>
		byKind
			? group.required.flatMap((part) => (part.length === 1 && group.kindsAt.has(part[0]!) ? [{ slots: part, kinds: group.kindsAt.get(part[0]!)! }] : []))
			: group.required.map((part) => ({ slots: part }));
	const split = (single: boolean, byKind: boolean) => {
		for (const group of groups) {
			for (const test of testsOf(group, byKind)) {
				const present = groups.filter((other) => holds(other, test));
				const absent = groups.filter((other) => !requires(other, test));
				if (present.length < groups.length && absent.length < groups.length && (!single || present.length === 1)) return { test, present, absent };
			}
		}
		return undefined;
	};
	const chosen = split(true, false) ?? split(true, true) ?? split(false, false) ?? split(false, true);
	if (chosen === undefined) return groups;
	const present = partitionTree(chosen.present);
	if (isUnsplit(present)) return present;
	const absent = partitionTree(chosen.absent);
	if (isUnsplit(absent)) return absent;
	return { test: chosen.test, present, absent };
}

function isUnsplit(tree: PartitionTree | readonly ArmGroup[]): tree is readonly ArmGroup[] {
	return Array.isArray(tree);
}

function sharedSlotFailure(kind: string, rule: RuleId, groups: readonly ArmGroup[]): EmitShapeFailure {
	const slots = [...new Set(groups.flatMap((group) => [...group.held]))].sort();
	const arms = groups.flatMap((group) => group.indices);
	return {
		code: 'shared-slot-choice',
		ownerKind: kind,
		message: `${kind}: arms ${arms.join(', ')} of its choice hold slots (${slots.join(', ')}), and neither a slot's presence nor its kind tells them apart, so a node's slots can't say which arm to render`,
		proposal: `name each arm's form: edits: { ${kind}: { <path of each arm>: variant('<name>') } }`,
		details: { rule, arms, slots }
	};
}

function partitionOfChoice(kind: string, choice: Extract<RenderRule, { type: 'CHOICE' }>, input: ChoicePartitionInput): ChoicePartition | undefined {
	const owned = { owned: input.slotByRuleId.get(kind) };
	const slotOf = (rule: RenderRule): AssembledNonterminal | undefined => slotWrittenAt(rule, owned);
	const multiplicityOf = (rule: RenderRule): Multiplicity | undefined => (rule as { multiplicity?: Multiplicity }).multiplicity;
	const requiredParts = (rule: RenderRule): readonly (readonly string[])[] => {
		const multiplicity = multiplicityOf(rule);
		if (isSeamChoice(rule) || multiplicity === 'optional' || multiplicity === 'array') return [];
		if (rule.type === SEQ) return rule.members.flatMap((member) => requiredParts(member as RenderRule));
		if (rule.type !== SYMBOL && rule.type !== CHOICE) return [];
		const slot = slotOf(rule);
		const own = slot === undefined ? undefined : slotNameInBody(slot);
		if (rule.type === SYMBOL) return own === undefined ? [] : [[own]];
		const firsts = rule.members.map((member) => requiredParts(member as RenderRule)[0] ?? (own === undefined ? undefined : [own]));
		if (firsts.some((part) => part === undefined)) return own === undefined ? [] : [[own]];
		return [[...new Set(firsts.flatMap((part) => part!))]];
	};
	const kindsAtSlots = (rule: RenderRule): Map<string, readonly string[]> => {
		const kinds = new Map<string, string[]>();
		const textual = new Set<string>();
		const walk = (r: RenderRule, inside: string | undefined): void => {
			if (isSeamChoice(r)) return;
			const own = r.type === SYMBOL || r.type === CHOICE ? slotOf(r) : undefined;
			const slot = inside ?? (own === undefined ? undefined : slotNameInBody(own));
			if (slot !== undefined && r.type === SYMBOL) {
				const names = kinds.get(slot) ?? [];
				if (!names.includes(r.name)) names.push(r.name);
				kinds.set(slot, names);
				return;
			}
			if (slot !== undefined && (r.type === STRING || r.type === PATTERN)) textual.add(slot);
			if (r.type === SEQ || r.type === CHOICE) for (const member of r.members) walk(member as RenderRule, slot);
		};
		walk(rule, undefined);
		for (const slot of textual) kinds.delete(slot);
		return new Map([...kinds].map(([slot, names]) => [slot, [...new Set(names.flatMap((name) => concreteKindsOf(name, { nodes: input.nodes as Map<string, AssembledNode> })))]] as const));
	};
	const slotsIn = (rule: RenderRule): AssembledNonterminal[] => {
		if (isSeamChoice(rule)) return [];
		const slot = rule.type === SEQ ? undefined : slotOf(rule);
		if (slot !== undefined) return [slot];
		return rule.type === SEQ || rule.type === CHOICE ? rule.members.flatMap((member) => slotsIn(member as RenderRule)) : [];
	};
	const slotsInOrder = (rule: RenderRule): string[] => [...new Set(slotsIn(rule).map(slotNameInBody))];
	const shapeOf = (rule: RenderRule): unknown => {
		if (isSeamChoice(rule)) return undefined;
		const slot = rule.type === SEQ ? undefined : slotOf(rule);
		const m = multiplicityOf(rule);
		if (slot !== undefined) return { s: slotNameInBody(slot), m };
		if (rule.type === SEQ) {
			const parts = rule.members.map((member) => shapeOf(member as RenderRule)).filter((part) => part !== undefined);
			return parts.length === 1 && m === undefined ? parts[0] : { q: parts, m };
		}
		if (rule.type === CHOICE) return { c: rule.members.map((member) => shapeOf(member as RenderRule)), m };
		if (rule.type === STRING) return { t: rule.value, m };
		return { r: rule.type, n: (rule as { name?: string }).name, m };
	};
	const slotOnly = (rule: RenderRule): boolean => isSeamChoice(rule) || (rule.type !== SEQ && slotOf(rule) !== undefined) || (rule.type === SEQ && rule.members.every((member) => slotOnly(member as RenderRule)));
	const slotSetsOf = (rule: RenderRule): ReadonlySet<string> | undefined => {
		const multiplicity = multiplicityOf(rule);
		const orAbsent = (sets: ReadonlySet<string> | undefined): ReadonlySet<string> | undefined =>
			sets === undefined || (multiplicity !== 'optional' && multiplicity !== 'array') ? sets : new Set([...sets, '']);
		if (isSeamChoice(rule)) return new Set(['']);
		const slot = rule.type === SEQ ? undefined : slotOf(rule);
		if (slot !== undefined) return orAbsent(new Set([slotNameInBody(slot)]));
		if (rule.type === CHOICE) {
			const arms = rule.members.map((member) => slotSetsOf(member as RenderRule));
			return arms.some((sets) => sets === undefined) ? undefined : orAbsent(new Set(arms.flatMap((sets) => [...sets!])));
		}
		if (rule.type !== SEQ) return orAbsent(new Set(['']));
		let product: ReadonlySet<string> | undefined = new Set(['']);
		for (const member of rule.members) {
			const sets = slotSetsOf(member as RenderRule);
			if (sets === undefined || product.size * sets.size > SLOT_SET_LIMIT) return undefined;
			product = new Set([...product].flatMap((held) => [...sets].map((more) => [...new Set([...held.split(','), ...more.split(',')].filter((name) => name !== ''))].sort().join(','))));
		}
		return orAbsent(product);
	};
	const holdsOnlyKeywords = (rule: RenderRule): boolean => {
		const kinds = kindsAtSlots(rule);
		const slots = slotsIn(rule);
		return slots.length > 0 && slots.every((slot) => {
			const held = kinds.get(slotNameInBody(slot)) ?? [];
			return !isMultiple(slot) && held.length > 0 && held.every((name) => {
				const node = input.nodes.get(name);
				return node !== undefined && isFixedTextLeaf(node);
			});
		});
	};
	const isOtherOrder = (later: RenderRule, earlier: RenderRule): boolean => {
		if (!holdsOnlyKeywords(later)) return false;
		const written = new Set(fixedTextsOf(earlier));
		if (!fixedTextsOf(later).every((text) => written.has(text))) return false;
		const admitted = slotSetsOf(earlier);
		const sets = slotSetsOf(later);
		return admitted !== undefined && sets !== undefined && [...sets].every((set) => admitted.has(set));
	};
	const listed = choice.members
		.map((member, index) => ({ index, rule: member as RenderRule, shape: JSON.stringify(shapeOf(member as RenderRule)), order: slotsInOrder(member as RenderRule) }))
		.filter((arm) => arm.shape !== EMPTY_ARM);
	const arms = listed.filter((arm, i) => !listed.slice(0, i).some((earlier) => isOtherOrder(arm.rule, earlier.rule)));
	const shared = arms.some((arm, i) => arm.order.some((slot) => arms.some((other, j) => j !== i && other.order.includes(slot))));
	const ordered = arms.length < listed.length;
	if (!shared && !ordered) return undefined;
	if (!ordered && arms.every((arm) => slotOnly(arm.rule))) {
		const orders = arms.map((arm) => arm.order);
		if (flatOrderParses(orders, flatSlotOrder(orders))) return { form: 'flat' };
	}
	const groups: ArmGroup[] = [];
	for (const arm of arms) {
		const required = requiredParts(arm.rule);
		const kindsAt = kindsAtSlots(arm.rule);
		const same = groups.find((group) => group.shape === arm.shape);
		if (same === undefined) {
			groups.push({ shape: arm.shape, indices: [arm.index], held: new Set(arm.order), required, kindsAt });
			continue;
		}
		for (const [slot, kinds] of kindsAt) same.kindsAt.set(slot, [...new Set([...(same.kindsAt.get(slot) ?? []), ...kinds])]);
		same.indices.push(arm.index);
		for (const slot of arm.order) same.held.add(slot);
		same.required = same.required.filter((part) => required.some((other) => other.length === part.length && other.every((slot) => part.includes(slot))));
	}
	const tree = partitionTree(groups);
	return isUnsplit(tree) ? { form: 'refused', failure: sharedSlotFailure(kind, choice.id!, tree) } : { form: 'chain', tree };
}

function fixedTextsOf(rule: RenderRule): string[] {
	if (isSeamChoice(rule)) return [];
	if (rule.type === STRING) return (rule as { nonterminal?: boolean }).nonterminal === true ? [] : [rule.value];
	return rule.type === SEQ || rule.type === CHOICE ? rule.members.flatMap((member) => fixedTextsOf(member as RenderRule)) : [];
}

function symbolNamesOf(rule: RenderRule): string[] {
	if (isSeamChoice(rule)) return [];
	if (rule.type === SYMBOL) return [rule.name];
	return rule.type === SEQ || rule.type === CHOICE ? rule.members.flatMap((member) => symbolNamesOf(member as RenderRule)) : [];
}

function slotChoiceTextFailure(kind: string, choice: Extract<RenderRule, { type: 'CHOICE' }>, slot: AssembledNonterminal, input: ChoicePartitionInput): EmitShapeFailure | undefined {
	const arms = choice.members
		.map((member) => member as RenderRule)
		.filter((rule) => !isBlank(rule))
		.map((rule) => {
			const kinds = [...new Set(symbolNamesOf(rule).flatMap((name) => concreteKindsOf(name, { nodes: input.nodes as Map<string, AssembledNode> })))];
			const written = rule.type === SEQ ? fixedTextsOf(rule) : [];
			return { kinds, texts: kinds.length === 0 && written.length < 2 ? [] : written };
		});
	const spellings = new Set(arms.map((arm) => JSON.stringify(arm.texts)));
	if (spellings.size < 2 || !arms.some((arm) => arm.texts.length > 0)) return undefined;
	const told = (a: (typeof arms)[number], b: (typeof arms)[number]): boolean => JSON.stringify(a.texts) === JSON.stringify(b.texts) || !a.kinds.some((name) => b.kinds.includes(name));
	if (slot.arity === 'one' && arms.every((arm) => arm.kinds.length > 0) && arms.every((a, i) => arms.slice(i + 1).every((b) => told(a, b)))) return undefined;
	const texts = [...new Set(arms.flatMap((arm) => arm.texts))];
	const name = slotNameInBody(slot);
	const tokensOnly = slot.arity === 'one' && arms.filter((arm) => arm.texts.length > 0).every((arm) => arm.kinds.length === 0);
	const spelled = arms.filter((arm) => arm.texts.length > 0).map((arm) => `'${arm.texts.join(' ')}'`).join(', ');
	return {
		code: 'slot-choice-text-lost',
		ownerKind: kind,
		message: tokensOnly
			? `${kind}: slot '${name}' holds one value, and arms of its choice are several fixed tokens (${spelled}), so a read would have to join those tokens into that value, which nothing shows it does`
			: `${kind}: slot '${name}' holds a choice whose arms write different fixed text (${texts.map((text) => `'${text}'`).join(', ')}), and no test on one value of the slot tells which arm a node took, so a render would lose that text`,
		proposal: `name each arm's form: edits: { ${kind}: { <path of each arm>: variant('<name>') } }`,
		details: { rule: choice.id, slot: name, texts }
	};
}

export function slotChoiceTextFailuresOf(input: ChoicePartitionInput): ReadonlyMap<string, readonly EmitShapeFailure[]> {
	const out = new Map<string, readonly EmitShapeFailure[]>();
	for (const [kind, rule] of Object.entries(input.rules)) {
		if (!input.nodes.has(kind)) continue;
		const own: EmitShapeFailure[] = [];
		walker.fold(rule, undefined, (_, r) => {
			if (r.type !== CHOICE || r.id === undefined || isSeamChoice(r)) return undefined;
			const slot = slotWrittenAt(r, { owned: input.slotByRuleId.get(kind) });
			const failure = slot === undefined ? undefined : slotChoiceTextFailure(kind, r, slot, input);
			if (failure !== undefined) own.push(failure);
			return undefined;
		});
		if (own.length > 0) out.set(kind, own);
	}
	return out;
}

export function choicePartitionsOf(input: ChoicePartitionInput): ReadonlyMap<string, ReadonlyMap<RuleId, ChoicePartition>> {
	const out = new Map<string, ReadonlyMap<RuleId, ChoicePartition>>();
	for (const [kind, rule] of Object.entries(input.rules)) {
		if (!input.nodes.has(kind)) continue;
		const own = new Map<RuleId, ChoicePartition>();
		walker.fold(rule, undefined, (_, r) => {
			if (r.type !== CHOICE || r.id === undefined || isSeamChoice(r) || slotWrittenAt(r, { owned: input.slotByRuleId.get(kind) }) !== undefined) return undefined;
			const partition = partitionOfChoice(kind, r, input);
			if (partition !== undefined) own.set(r.id, partition);
			return undefined;
		});
		if (own.size > 0) out.set(kind, own);
	}
	return out;
}
