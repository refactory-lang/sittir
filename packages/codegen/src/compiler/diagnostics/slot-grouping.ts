import { CHOICE, GROUP, SEQ, SUPERTYPE, SYMBOL, VARIANT } from '../../types/rule-types.ts'; // @rule-type-consts
import type { SeqRule, SimplifiedRule } from '../../types/rule.ts';
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

export function diagnoseSlotGrouping(
	rules: Record<string, SimplifiedRule>,
	inlineKinds: ReadonlySet<string> = new Set(),
	polymorphSkipExtra: ReadonlySet<string> = new Set()
): SlotGroupingDiagnostic[] {
	const polymorphSkip: ReadonlySet<string> = polymorphSkipExtra;

	const records: SlotGroupingDiagnostic[] = [];
	for (const [ownerKind, rule] of Object.entries(rules)) {
		if (!isAllTextShape(rule)) {
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

		if (polymorphSkip.has(ownerKind)) continue;

		const topLevelInSlot = inlineKinds.has(ownerKind);
		walkRule(rule, ownerKind, records, topLevelInSlot, false);
	}
	return records;
}

function walkRule(
	rule: SimplifiedRule,
	ownerKind: string,
	records: SlotGroupingDiagnostic[],
	inSlotPosition: boolean,
	inChoiceArm: boolean
): void {
	switch (rule.type) {
		case SEQ:
			if (inSlotPosition) {
				checkSeq(rule, ownerKind, records, inChoiceArm);
			}
			for (const m of rule.members) {
				walkRule(m, ownerKind, records, inSlotPosition, inChoiceArm);
			}
			break;

		case CHOICE:
			for (const m of rule.members) {
				walkRule(m, ownerKind, records, true, true);
			}
			break;

		case VARIANT:
		case GROUP:
			walkRule(rule.content, ownerKind, records, inSlotPosition, inChoiceArm);
			break;

		default:
			break;
	}
}

function checkSeq(
	rule: SeqRule<'simplify'>,
	ownerKind: string,
	records: SlotGroupingDiagnostic[],
	inChoiceArm: boolean
): void {
	const slotCount = countSlots(rule);
	if (slotCount < 2) return;

	if (inChoiceArm) return;

	records.push({
		code: 'multi-slot-nested-seq',
		severity: 'warning',
		message: `Kind '${ownerKind}' has a multi-slot seq with ${slotCount} slots in a repeat/optional slot position.`,
		canProceed: true,
		ownerKind,
		slotCount,
		proposal:
			`Kind '${ownerKind}' has a multi-slot seq with ${slotCount} slots in a repeat/optional slot position. ` +
			`Propose: register a visible groups: entry so this substructure ` +
			`becomes a single group slot in the parent.`
	});
}

export function countSlots(rule: SimplifiedRule): number {
	switch (rule.type) {
		case SEQ:
			return rule.members.reduce((sum, m) => sum + countSlots(m), 0);

		case VARIANT:
		case GROUP:
			return countSlots(rule.content);

		default:
			return isNonterminalRuleType(rule) ? 1 : 0;
	}
}

export function countContentSlots(rule: SimplifiedRule): number {
	switch (rule.type) {
		case SEQ:
			return rule.fieldName !== undefined ? 0 : rule.members.reduce((sum, m) => sum + countContentSlots(m), 0);
		case VARIANT:
		case GROUP:
			return countContentSlots(rule.content);
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
