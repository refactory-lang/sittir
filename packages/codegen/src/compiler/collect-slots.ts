import {
	ALIAS,
	CHOICE,
	FIELD,
	GROUP,
	OPTIONAL,
	REPEAT,
	REPEAT1,
	SEQ,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, ChoiceRule, RuleBase, Multiplicity, SimplifiedRule } from '../types/rule.ts';
import type { GeneratedKindEntry } from './generated-metadata.ts';
import { isNonterminalRuleType } from '../dsl/rule-patterns.ts';
import { sharedArmAttrs } from '../dsl/rule-attrs.ts';
import {
	AssembledNonterminal,
	type NodeOrTerminal,
	deriveValuesForRule,
	dedupeValues,
	extractSeparatorString,
	mergeDelimiterMode,
	mergeSourceRuleIds,
	recordAssembleWarning,
	stampListFactsOnValues
} from './model/node-map.ts';
import { findRepeatFlag } from '../dsl/rule-transforms.ts';

function findNestedSeparator(rule: AnyRule): RuleBase<'normalize'>['separator'] {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep !== undefined) return sep;
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			for (const m of rule.members) {
				const found = findNestedSeparator(m);
				if (found !== undefined) return found;
			}
			return undefined;
		case OPTIONAL:
		case GROUP:
		case FIELD:
			return findNestedSeparator(rule.content);
		default:
			return undefined;
	}
}

const collectedUnnamedChoiceKinds = new Set<string>();
const _extraUnnamedChoiceListeners: Array<(kind: string | undefined) => void> = [];
let unnamedChoiceWarner: (kind: string | undefined) => void = (kind) => {
	collectedUnnamedChoiceKinds.add(kind ?? '(unknown)');
	for (const l of _extraUnnamedChoiceListeners) l(kind);
};

export function setUnnamedChoiceWarner(fn: (kind: string | undefined) => void): void {
	unnamedChoiceWarner = fn;
}

export function addUnnamedChoiceListener(fn: (kind: string | undefined) => void): () => void {
	_extraUnnamedChoiceListeners.push(fn);
	return () => {
		const idx = _extraUnnamedChoiceListeners.indexOf(fn);
		if (idx >= 0) _extraUnnamedChoiceListeners.splice(idx, 1);
	};
}

export function drainUnnamedChoiceSlots(): string[] {
	const out = [...collectedUnnamedChoiceKinds].sort();
	collectedUnnamedChoiceKinds.clear();
	return out;
}

function sharedArmFieldName(rule: AnyRule): string | undefined {
	return sharedArmAttrs(rule).fieldName;
}

function strongestArmMultiplicity(rule: AnyRule): Multiplicity | undefined {
	return sharedArmAttrs(rule).strongestMultiplicity;
}

function carriesNamedField(rule: AnyRule): boolean {
	if ((rule as { fieldName?: string }).fieldName !== undefined) return true;
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			return rule.members.some(carriesNamedField);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case GROUP:
		case TOKEN:
		case ALIAS:
			return carriesNamedField((rule as { content: AnyRule }).content);
		default:
			return false;
	}
}

export function isStructuralChoice(rule: ChoiceRule<'simplify'>): boolean {
	if (sharedArmFieldName(rule) !== undefined) return false;
	return rule.members.some((m) => (m.type === SEQ && m.members.length > 1) || carriesNamedField(m));
}

export interface ChoiceArmPartition {
	degenerateNamedArms: SimplifiedRule[];
	structuredNamedArms: SimplifiedRule[];
	unionArms: SimplifiedRule[];
	literalArms: SimplifiedRule[];
	structuredArms: SimplifiedRule[];
}

function isDegenerateFieldArm(m: SimplifiedRule): boolean {
	let node = m;
	while (node.type === SEQ && node.members.length === 1) node = node.members[0]!;
	if (node.type === SEQ || node.type === CHOICE) return false;
	return (node as { fieldName?: string }).fieldName !== undefined && isSlotNode(node);
}

function degenerateArmFieldName(m: SimplifiedRule): string | undefined {
	let node = m;
	while (node.type === SEQ && node.members.length === 1) node = node.members[0]!;
	return (node as { fieldName?: string }).fieldName;
}

export function partitionChoiceArms(rule: ChoiceRule<'simplify'>): ChoiceArmPartition {
	const out: ChoiceArmPartition = {
		degenerateNamedArms: [],
		structuredNamedArms: [],
		unionArms: [],
		literalArms: [],
		structuredArms: []
	};
	const classify = (m: SimplifiedRule): void => {
		if (carriesNamedField(m)) {
			(isDegenerateFieldArm(m) ? out.degenerateNamedArms : out.structuredNamedArms).push(m);
			return;
		}
		if (m.type === SEQ) {
			if (m.members.length === 1) {
				classify(m.members[0]!);
				return;
			}
			out.structuredArms.push(m);
			return;
		}
		if (m.type === CHOICE) {
			out.structuredArms.push(m);
			return;
		}
		if (isSlotNode(m)) {
			out.unionArms.push(m);
			return;
		}
		out.literalArms.push(m);
	};
	for (const m of rule.members) classify(m);
	return out;
}

export function unionRoutingGateB(partition: ChoiceArmPartition): boolean {
	return partition.unionArms.length > 0 && partition.structuredArms.length === 0 && partition.literalArms.length === 0;
}

let unionSlotRouting = process.env['SITTIR_UNION_SLOT_ROUTING'] !== '0';

export function setUnionSlotRouting(on: boolean): boolean {
	const prev = unionSlotRouting;
	unionSlotRouting = on;
	return prev;
}

const _synthesizedUnionChoiceIds = new Set<string>();

export function drainSynthesizedUnionChoiceIds(): ReadonlySet<string> {
	const out = new Set(_synthesizedUnionChoiceIds);
	_synthesizedUnionChoiceIds.clear();
	return out;
}

function describeArmShape(m: SimplifiedRule): string {
	const fieldName = (m as { fieldName?: string }).fieldName;
	const prefix = fieldName !== undefined ? `field(${fieldName}):` : '';
	switch (m.type) {
		case SEQ:
			return `${prefix}seq[${m.members.length}](${m.members.map(describeArmLeaf).join(' ')})`;
		case CHOICE:
			return `${prefix}choice[${m.members.length}]`;
		default:
			return prefix + describeArmLeaf(m);
	}
}

function describeArmLeaf(m: SimplifiedRule): string {
	if (m.type === SYMBOL || m.type === SUPERTYPE) return m.name;
	const value = (m as { value?: string }).value;
	if (typeof value === 'string') return JSON.stringify(value);
	return m.type.toLowerCase();
}

function mergeByName(slots: AssembledNonterminal[]): AssembledNonterminal[] {
	if (slots.length <= 1) return slots;
	const out: AssembledNonterminal[] = [];
	const namedIndexByName = new Map<string, number>();
	for (const s of slots) {
		if (s.isUnnamed) {
			out.push(s);
			continue;
		}
		const idx = namedIndexByName.get(s.name);
		if (idx === undefined) {
			namedIndexByName.set(s.name, out.length);
			out.push(s);
			continue;
		}
		const prev = out[idx]!;
		out[idx] = prev.with({
			values: dedupeValues([...prev.values, ...s.values]),
			hasTrailingDelimiter: prev.hasTrailingDelimiter || s.hasTrailingDelimiter,
			hasLeadingDelimiter: prev.hasLeadingDelimiter || s.hasLeadingDelimiter,
			trailingDelimiter: mergeDelimiterMode([prev.trailingDelimiter, s.trailingDelimiter]),
			leadingDelimiter: mergeDelimiterMode([prev.leadingDelimiter, s.leadingDelimiter]),
			sourceRuleIds: mergeSourceRuleIds(prev.sourceRuleIds, s.sourceRuleIds)
		});
	}
	return out;
}

function mergeChoiceArms(arms: AssembledNonterminal[][]): AssembledNonterminal[] {
	const merged = new Map<string, AssembledNonterminal>();
	const presence = new Map<string, number>();
	const unnamedByName = new Map<string, AssembledNonterminal[]>();
	for (const arm of arms) {
		const namesSeenInArm = new Set<string>();
		for (const slot of arm) {
			if (!namesSeenInArm.has(slot.name)) {
				namesSeenInArm.add(slot.name);
				presence.set(slot.name, (presence.get(slot.name) ?? 0) + 1);
			}
			if (slot.isUnnamed) {
				const list = unnamedByName.get(slot.name) ?? [];
				list.push(slot);
				unnamedByName.set(slot.name, list);
				continue;
			}
			const prev = merged.get(slot.name);
			if (!prev) {
				merged.set(slot.name, slot);
				continue;
			}
			merged.set(
				slot.name,
				prev.with({
					values: dedupeValues([...prev.values, ...slot.values]),
					hasTrailingDelimiter: prev.hasTrailingDelimiter || slot.hasTrailingDelimiter,
					hasLeadingDelimiter: prev.hasLeadingDelimiter || slot.hasLeadingDelimiter,
					trailingDelimiter: mergeDelimiterMode([prev.trailingDelimiter, slot.trailingDelimiter]),
					leadingDelimiter: mergeDelimiterMode([prev.leadingDelimiter, slot.leadingDelimiter]),
					sourceRuleIds: mergeSourceRuleIds(prev.sourceRuleIds, slot.sourceRuleIds)
				})
			);
		}
	}
	const isPresentInEveryArm = (name: string) => (presence.get(name) ?? 0) >= arms.length;
	const namedOut = [...merged.values()].map((slot) => (isPresentInEveryArm(slot.name) ? slot : relaxToOptional(slot)));
	const unnamedOut = [...unnamedByName.values()].flatMap((instances) =>
		instances.map((slot) => (isPresentInEveryArm(slot.name) ? slot : relaxToOptional(slot)))
	);
	return [...namedOut, ...unnamedOut];
}

function relaxToOptional(slot: AssembledNonterminal): AssembledNonterminal {
	return slot.with({
		values: slot.values.map((v) =>
			v.multiplicity === 'single'
				? { ...v, multiplicity: 'optional' as const }
				: v.multiplicity === 'nonEmptyArray'
					? { ...v, multiplicity: 'array' as const }
					: v
		)
	});
}

function isSlotNode(rule: SimplifiedRule): boolean {
	if (rule.nonterminal !== undefined) return rule.nonterminal;
	return isNonterminalRuleType(rule);
}

function slotMultiplicity(rule: AnyRule, inherited: Multiplicity): Multiplicity {
	const own = (rule as { multiplicity?: Multiplicity }).multiplicity;
	if (own !== undefined) return own;
	if (inherited === 'nonEmptyArray') return 'array';
	return inherited;
}

function buildSlot(
	rule: SimplifiedRule,
	kindForName: string | undefined,
	kindEntries: readonly GeneratedKindEntry[] | undefined,
	inherited: Multiplicity,
	inheritedSeparator: RuleBase<'normalize'>['separator'],
	sanctionedUnion = false
): AssembledNonterminal | null {
	const armLifted =
		rule.type === CHOICE && (rule as { multiplicity?: Multiplicity }).multiplicity === undefined
			? strongestArmMultiplicity(rule)
			: undefined;
	const mult = armLifted ?? slotMultiplicity(rule, inherited);

	let baseName: string | undefined = (rule as { fieldName?: string }).fieldName;

	if (baseName === undefined) {
		switch (rule.type) {
			case SYMBOL: {
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				break;
			}
			case SUPERTYPE: {
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				break;
			}
			case CHOICE: {
				const sharedArm = sharedArmFieldName(rule);
				if (sharedArm !== undefined) {
					baseName = sharedArm;
					break;
				}
				if (rule.type === CHOICE && !sanctionedUnion) {
					unnamedChoiceWarner(rule.id ?? kindForName);
				}
				baseName = inlinedFromSlotName(rule) ?? 'content';
				break;
			}
			default:
				baseName = inlinedFromSlotName(rule) ?? 'content';
				break;
		}
	}

	const rawValues = deriveValuesForRule(rule, { kindEntries, stampArmFieldNamesAsParseName: sanctionedUnion }, mult);
	let dedupedValues = dedupeValues(rawValues);
	if (dedupedValues.length === 0) return null;

	if (baseName === 'content') {
		dedupedValues = dedupedValues.map((v) =>
			v.multiplicity === 'nonEmptyArray' ? { ...v, multiplicity: 'array' as const } : v
		);
	}

	const isMultiSlot = dedupedValues.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');

	const ownOrInheritedSep =
		(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator;
	const nestedScanSep = ownOrInheritedSep === undefined && isMultiSlot ? findNestedSeparator(rule) : undefined;
	const sep = ownOrInheritedSep ?? nestedScanSep;
	const trailingDelimiter: 'mandatory' | 'optional' | 'none' = !isMultiSlot
		? 'none'
		: (sep?.trailing ?? (findRepeatFlag(rule, 'trailing') ? 'mandatory' : 'none'));
	const leadingDelimiter: 'mandatory' | 'optional' | 'none' = !isMultiSlot
		? 'none'
		: (sep?.leading ?? (findRepeatFlag(rule, 'leading') ? 'mandatory' : 'none'));
	const hasTrailingDelimiter = trailingDelimiter !== 'none';
	const hasLeadingDelimiter = leadingDelimiter !== 'none';

	const separatorStr = isMultiSlot ? extractSeparatorString(sep) : undefined;
	if (isMultiSlot && nestedScanSep !== undefined && separatorStr === undefined) {
		recordAssembleWarning({
			code: 'nonterminal-separator-unstamped',
			ownerKind: kindForName,
			message:
				`[collect-slots] kind '${kindForName ?? '(unknown)'}': array slot carries a nonterminal (rule-shaped) ` +
				`separator that cannot be stamped as a literal — rendering would silently fall back to a hardcoded ` +
				`space. Extend the nonterminal-separator handling from emitListSlot's ruleSep path to the ` +
				`slot-value stamp path (see this guard's comment in collect-slots.ts).`
		});
	}
	const values: readonly NodeOrTerminal[] = stampListFactsOnValues([...dedupedValues], {
		separator: separatorStr,
		optionalElement: (rule as { optionalElement?: boolean }).optionalElement
	});

	const memberIds =
		rule.type === CHOICE ? rule.members.flatMap((m) => [...(m.id ? [m.id] : []), ...(m.absorbedIds ?? [])]) : [];
	const sourceRuleIds = [...new Set([...(rule.id ? [rule.id] : []), ...(rule.absorbedIds ?? []), ...memberIds])];

	return new AssembledNonterminal({
		values,
		fieldName: (rule as { fieldName?: string }).fieldName,
		inlinedFrom: rule.inlinedFrom,
		hasTrailingDelimiter,
		hasLeadingDelimiter,
		trailingDelimiter,
		leadingDelimiter,
		sourceRuleIds,
		ruleMetadata: rule.metadata
	});
}

export function collectSlots(
	rule: SimplifiedRule,
	kindForName?: string,
	kindEntries?: readonly GeneratedKindEntry[],
	inherited: Multiplicity = 'single',
	inheritedSeparator: RuleBase<'normalize'>['separator'] = undefined
): AssembledNonterminal[] {
	if (rule.type === SEQ) {
		const seqMult = (rule as { multiplicity?: Multiplicity }).multiplicity ?? inherited;
		const seqSep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator;
		return rule.members.flatMap((m) => resolveMember(m, kindForName, kindEntries, seqMult, seqSep));
	}
	return resolveMember(rule, kindForName, kindEntries, inherited, inheritedSeparator);
}

function recordUnclassifiableShape(kindForName: string | undefined, member: SimplifiedRule, bucket: string): void {
	recordAssembleWarning({
		code: 'unclassifiable-shape',
		ownerKind: kindForName,
		message:
			`[collect-slots] kind '${kindForName ?? '(unknown)'}': member ${member.id ?? '(no id)'} is not a leaf or a ` +
			`choice of leaves (${bucket}: ${describeArmShape(member)}) — resolved by structural recursion`,
		details: { bucket, shape: describeArmShape(member), ruleId: member.id }
	});
}

function resolveMember(
	rule: SimplifiedRule,
	kindForName: string | undefined,
	kindEntries: readonly GeneratedKindEntry[] | undefined,
	inherited: Multiplicity,
	inheritedSeparator: RuleBase<'normalize'>['separator']
): AssembledNonterminal[] {
	switch (rule.type) {
		case SEQ: {
			const isList =
				(rule as { multiplicity?: Multiplicity }).multiplicity !== undefined ||
				(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator !== undefined;
			if (!isList) recordUnclassifiableShape(kindForName, rule, 'nested-seq');
			return collectSlots(rule, kindForName, kindEntries, inherited, inheritedSeparator);
		}

		case GROUP:
			return collectSlots(
				rule.content,
				kindForName,
				kindEntries,
				(rule as { multiplicity?: Multiplicity }).multiplicity ?? inherited,
				(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator
			);

		case CHOICE: {
			if ((rule as { fieldName?: string }).fieldName === undefined && isStructuralChoice(rule)) {
				const armMult = (rule as { multiplicity?: Multiplicity }).multiplicity ?? inherited;
				const choiceSep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator;
				const partition = partitionChoiceArms(rule);
				if (partition.structuredArms.length > 0 || partition.structuredNamedArms.length > 0) {
					recordUnclassifiableShape(kindForName, rule, 'choice-with-structured-arms');
				}
				if (partition.unionArms.length > 0) {
					const ruleId = (rule as { id?: string }).id;
					const site = `choice ${ruleId ?? '(no id)'}`;
					const effectiveMult =
						((rule as { multiplicity?: Multiplicity }).multiplicity === undefined
							? strongestArmMultiplicity(rule)
							: undefined) ?? armMult;
					const repeated = effectiveMult === 'array' || effectiveMult === 'nonEmptyArray';
					if (unionRoutingGateB(partition) && partition.structuredNamedArms.length > 0) {
						recordAssembleWarning({
							code: 'union-slot-mixed-row',
							ownerKind: kindForName,
							message:
								`[collect-slots] kind '${kindForName ?? '(unknown)'}': ${site} is a ` +
								`${repeated ? 'REPEATED (order-lossy) ' : 'singular '}mixed row — structured named ` +
								`arm(s) [${partition.structuredNamedArms.map(describeArmShape).join(', ')}] alongside ` +
								`union arm(s) [${partition.unionArms.map(describeArmShape).join(', ')}]` +
								(partition.degenerateNamedArms.length > 0
									? ` and degenerate arm(s) [${partition.degenerateNamedArms.map(describeArmShape).join(', ')}]`
									: '') +
								`. Keeping status quo. END-STATE: structured named arm(s) get an inlined kind ` +
								`(PR 3 mint) and join one kind-dispatched union slot.`
						});
					} else if (unionRoutingGateB(partition) && ruleId === undefined) {
						recordAssembleWarning({
							code: 'union-slot-unaddressable',
							ownerKind: kindForName,
							message:
								`[collect-slots] kind '${kindForName ?? '(unknown)'}': fieldless structural choice ` +
								`qualifies for union routing but carries no rule id (rebuilt without id preservation) — ` +
								`union slot would be unaddressable at emit; keeping distribution. Fix the rebuild site ` +
								`to preserve ids.`
						});
					} else if (unionRoutingGateB(partition)) {
						recordAssembleWarning({
							code: 'union-slot-routed',
							ownerKind: kindForName,
							message:
								`[collect-slots] kind '${kindForName ?? '(unknown)'}': ${site} routes ` +
								`${partition.unionArms.length} unnamed-nonterminal arm(s) ` +
								`[${partition.unionArms.map(describeArmShape).join(', ')}] into one union slot` +
								(partition.degenerateNamedArms.length > 0
									? ` alongside ${partition.degenerateNamedArms.length} label-routed arm(s) ` +
										`[${partition.degenerateNamedArms.map(describeArmShape).join(', ')}] (PR 1.5)`
									: ' (pure union)'),
							details: {
								unionSlot: 'content',
								degenerateFields: partition.degenerateNamedArms
									.map((m) => degenerateArmFieldName(m))
									.filter((n): n is string => n !== undefined)
							}
						});
						if (unionSlotRouting) {
							const namedArmSlots = partition.structuredNamedArms.map((m) =>
								mergeByName(collectSlots(m, kindForName, kindEntries, armMult, choiceSep))
							);
							const restricted = {
								...rule,
								members: [...partition.unionArms, ...partition.degenerateNamedArms]
							};
							const unionSlot = buildSlot(restricted, kindForName, kindEntries, inherited, inheritedSeparator, true);
							if (unionSlot === null) return mergeChoiceArms(namedArmSlots);
							if (ruleId !== undefined) _synthesizedUnionChoiceIds.add(ruleId);
							return mergeChoiceArms([...namedArmSlots, [unionSlot]]);
						}
					} else {
						recordAssembleWarning({
							code: 'union-slot-nondegenerate-arm',
							ownerKind: kindForName,
							message:
								`[collect-slots] kind '${kindForName ?? '(unknown)'}': ${site} has unnamed-nonterminal ` +
								`arm(s) [${partition.unionArms.map(describeArmShape).join(', ')}] but cannot union-route — ` +
								`offending arm(s): ` +
								[
									...partition.structuredArms.map((m) => `structured ${describeArmShape(m)}`),
									...partition.literalArms.map((m) => `literal ${describeArmShape(m)}`)
								].join(', ') +
								`. Restructure via variant() / a real rule / field() in overrides, or await the ` +
								`PR 3 group-mint widening.`
						});
					}
				}
				const armSlots = rule.members.map((m) =>
					mergeByName(collectSlots(m, kindForName, kindEntries, armMult, choiceSep))
				);
				return mergeChoiceArms(armSlots);
			}
			if (!isSlotNode(rule)) return [];
			const slot = buildSlot(rule, kindForName, kindEntries, inherited, inheritedSeparator);
			return slot ? [slot] : [];
		}

		default: {
			if (!isSlotNode(rule)) return [];
			const slot = buildSlot(rule, kindForName, kindEntries, inherited, inheritedSeparator);
			return slot ? [slot] : [];
		}
	}
}

function inlinedFromSlotName(rule: { readonly inlinedFrom?: string }): string | undefined {
	return rule.inlinedFrom === undefined ? undefined : rule.inlinedFrom.replace(/^_+/, '') || undefined;
}
