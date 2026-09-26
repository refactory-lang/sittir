import { CHOICE, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { PhaseName, Rule, SimplifiedRule } from '../../types/rule.ts';
import { isAllTextShape } from '../assemble.ts';
import { isStructuralChoice } from '../collect-slots.ts';
import { isNonterminalRuleType } from '../../dsl/rule-patterns.ts';
import type { Diagnostic } from '../../types/diagnostics.ts';

export type SlotGroupingShape = 'multi-slot-nested-seq' | 'content-collision';

export interface SlotGroupingDiagnostic extends Diagnostic {
	readonly code: SlotGroupingShape;
	readonly severity: 'warning';
	readonly message: string;
	readonly canProceed: boolean;
	readonly ownerKind: string;
	readonly slotCount: number;
	readonly proposal: string;
}

export function diagnoseSlotGrouping(rules: Record<string, SimplifiedRule>): SlotGroupingDiagnostic[] {
	const records: SlotGroupingDiagnostic[] = [];
	for (const [ownerKind, rule] of Object.entries(rules)) {
		if (isAllTextShape(rule)) continue;
		const contentCount = countContentSlots(rule);
		if (contentCount > 1) {
			records.push({
				code: 'content-collision',
				severity: 'warning',
				message: `Kind '${ownerKind}' has ${contentCount} anonymous 'content' slots that would share the '_content' storage key.`,
				canProceed: false,
				ownerKind,
				slotCount: contentCount,
				proposal:
					`Kind '${ownerKind}' has ${contentCount} anonymous 'content' slots that would share ` +
					`the '_content' storage key (an unemittable ambiguity). ` +
					`field()-name at least one in grammar.sittir.ts.`
			});
		}
	}
	return records;
}

export function diagnoseRepeatedSeqGrouping(
	rules: Readonly<Record<string, Rule<'link'>>>,
	inlineKinds: ReadonlySet<string>
): SlotGroupingDiagnostic[] {
	const records: SlotGroupingDiagnostic[] = [];
	for (const [ownerKind, rule] of Object.entries(rules)) {
		const slotCount = repeatedSeqSlotCount(rule, rules, inlineKinds);
		if (slotCount < 2) continue;
		const message = `Kind '${ownerKind}' has a multi-slot seq with ${slotCount} slots in a repeat slot position.`;
		records.push({
			code: 'multi-slot-nested-seq',
			severity: 'warning',
			message,
			canProceed: true,
			ownerKind,
			slotCount,
			proposal:
				`${message} Its slots become parallel arrays that lose the per-repetition pairing. ` +
				`Propose: register a visible groups: entry so each repetition becomes one group node.`
		});
	}
	return records;
}

function repeatedSeqSlotCount(
	rule: Rule<'link'>,
	rules: Readonly<Record<string, Rule<'link'>>>,
	inlineKinds: ReadonlySet<string>
): number {
	switch (rule.type) {
		case REPEAT:
		case REPEAT1: {
			const body = spliceBody(rule.content, rules, inlineKinds, new Set());
			if (body.type === SEQ) {
				const slotCount = countSlots(body);
				if (slotCount >= 2) return slotCount;
			}
			return repeatedSeqSlotCount(rule.content, rules, inlineKinds);
		}
		case SEQ:
		case CHOICE:
			return rule.members.reduce((max, m) => Math.max(max, repeatedSeqSlotCount(m, rules, inlineKinds)), 0);
		case OPTIONAL:
		case FIELD:
			return repeatedSeqSlotCount(rule.content, rules, inlineKinds);
		default:
			return 0;
	}
}

function spliceBody(
	rule: Rule<'link'>,
	rules: Readonly<Record<string, Rule<'link'>>>,
	inlineKinds: ReadonlySet<string>,
	seen: Set<string>
): Rule<'link'> {
	if (rule.type !== SYMBOL || !inlineKinds.has(rule.name) || seen.has(rule.name)) return rule;
	const target = rules[rule.name];
	if (target === undefined) return rule;
	seen.add(rule.name);
	return spliceBody(target, rules, inlineKinds, seen);
}

export function countSlots<P extends PhaseName>(rule: Rule<P>): number {
	switch (rule.type) {
		case SEQ:
			return rule.members.reduce((sum, m) => sum + countSlots(m), 0);

		default:
			return isNonterminalRuleType(rule) ? 1 : 0;
	}
}

export function countContentSlots(rule: SimplifiedRule): number {
	switch (rule.type) {
		case SEQ:
			return rule.fieldName !== undefined ? 0 : rule.members.reduce((sum, m) => sum + countContentSlots(m), 0);
		case CHOICE:
			if (rule.fieldName === undefined && isStructuralChoice(rule)) {
				return rule.members.reduce((max, m) => Math.max(max, countContentSlots(m)), 0);
			}
			return isContentSlot(rule) ? 1 : 0;
		default:
			return isContentSlot(rule) ? 1 : 0;
	}
}

function isContentSlot(rule: SimplifiedRule): boolean {
	if (!isNonterminalRuleType(rule)) return false;
	if (rule.fieldName !== undefined || rule.inlinedFrom !== undefined) return false;
	const { named, hasUnnamed } = slotKindProfile(rule);
	return !(named.size === 1 && !hasUnnamed);
}

function slotKindProfile(rule: SimplifiedRule): { named: Set<string>; hasUnnamed: boolean } {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return { named: new Set([rule.name]), hasUnnamed: false };
		case CHOICE: {
			const named = new Set<string>();
			let hasUnnamed = false;
			for (const m of rule.members) {
				const p = slotKindProfile(m);
				for (const n of p.named) named.add(n);
				hasUnnamed = hasUnnamed || p.hasUnnamed;
			}
			return { named, hasUnnamed };
		}
		default:
			return { named: new Set(), hasUnnamed: true };
	}
}
