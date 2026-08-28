import {
	CHOICE,
	FIELD,
	GROUP,
	OPTIONAL,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	VARIANT
} from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule, SimplifiedRule } from '../../types/rule.ts';
import { isAllTextShape } from '../assemble.ts';
import { isStructuralChoice } from '../collect-slots.ts';
import { isNonterminalRuleType } from '../../dsl/rule-patterns.ts';
import type { Diagnostic } from '../../types/diagnostics.ts';

export type SlotGroupingShape =
	| 'multi-slot-nested-seq'
	| 'supertype-list'
	| 'repeat-choice-with-literal'
	| 'content-collision';

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
		walkRule(rule, ownerKind, records, topLevelInSlot,  false);
	}
	return records;
}

function walkRule(
	rule: Rule<'link'>,
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

		case REPEAT:
		case REPEAT1:
			checkRepeat(rule, ownerKind, records);
			walkRule(rule.content, ownerKind, records,  true,  false);
			break;

		case CHOICE:
			for (const m of rule.members) {
				walkRule(m, ownerKind, records,  true,  true);
			}
			break;

		case OPTIONAL:
		case FIELD:
			walkRule(
				(rule as { content: Rule<'link'> }).content,
				ownerKind,
				records,
				 true,
				 false
			);
			break;

		case VARIANT:
		case GROUP:
			walkRule((rule as { content: Rule<'link'> }).content, ownerKind, records, inSlotPosition, inChoiceArm);
			break;

		default:
			break;
	}
}

function checkSeq(
	rule: Extract<Rule<'link'>, { type: 'SEQ' }>,
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

function checkRepeat(
	rule: Extract<Rule<'link'>, { type: 'REPEAT' | 'REPEAT1' }>,
	ownerKind: string,
	records: SlotGroupingDiagnostic[]
): void {
	const content = rule.content;

	if (content.type === CHOICE) {
		const hasLiteral = content.members.some((m) => m.type === STRING);
		if (hasLiteral) {
			records.push({
				code: 'repeat-choice-with-literal',
				severity: 'warning',
				message: `Kind '${ownerKind}' has a repeat(choice(..., literal, ...)) — heterogeneous repeating content with interleaved literals.`,
				canProceed: true,
				ownerKind,
				slotCount: 1,
				proposal:
					`Kind '${ownerKind}' has a repeat(choice(..., literal, ...)) — ` +
					`heterogeneous repeating content with interleaved literals. ` +
					`Author decides: visible groups: registration or transforms: field() rename.`
			});
			return;
		}
		checkRepeatOfSymbol(rule, content, ownerKind, records);
		return;
	}

	checkRepeatOfSymbol(rule, content, ownerKind, records);
}

function checkRepeatOfSymbol(
	_repeatRule: Extract<Rule<'link'>, { type: 'REPEAT' | 'REPEAT1' }>,
	content: Rule<'link'>,
	ownerKind: string,
	records: SlotGroupingDiagnostic[]
): void {
	const isSymbolLike = content.type === SYMBOL || content.type === SUPERTYPE;
	const isChoiceOfSymbols =
		content.type === CHOICE &&
		content.members.length > 0 &&
		content.members.every((m) => m.type === SYMBOL || m.type === SUPERTYPE);

	if (!isSymbolLike && !isChoiceOfSymbols) return;

	const fieldName = (content as { fieldName?: string }).fieldName;
	if (fieldName !== undefined) return;

	const symName =
		content.type === SYMBOL || content.type === SUPERTYPE
			? content.name
			: content.members.map((m) => (m as { name: string }).name).join('|');

	records.push({
		code: 'supertype-list',
		severity: 'warning',
		message: `Kind '${ownerKind}' has a repeat(${symName}) without a field name.`,
		canProceed: true,
		ownerKind,
		slotCount: 1,
		proposal:
			`Kind '${ownerKind}' has a repeat(${symName}) without a field name. ` +
			`This fragments at read by concrete kind. ` +
			`Propose: add transforms: { '(${symName})': field('<name>') } in grammar.sittir.ts.`
	});
}

export function countSlots(rule: Rule<'link'>): number {
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

export function countContentSlots(rule: Rule<'link'>): number {
	switch (rule.type) {
		case SEQ:
			return (rule as { fieldName?: string }).fieldName !== undefined
				? 0
				: rule.members.reduce((sum, m) => sum + countContentSlots(m), 0);
		case VARIANT:
		case GROUP:
			return countContentSlots(rule.content);
		case CHOICE:
			if ((rule as { fieldName?: string }).fieldName === undefined && isStructuralChoice(rule)) {
				return rule.members.reduce((max, m) => Math.max(max, countContentSlots(m)), 0);
			}
			return isContentSlot(rule) ? 1 : 0;
		default:
			return isContentSlot(rule) ? 1 : 0;
	}
}

function isContentSlot(rule: Rule<'link'>): boolean {
	if (!isNonterminalRuleType(rule)) return false;
	if ((rule as { fieldName?: string }).fieldName !== undefined) return false;
	const { named, hasUnnamed } = slotKindProfile(rule);
	return !(named.size === 1 && !hasUnnamed);
}

function slotKindProfile(rule: Rule<'link'>): { named: Set<string>; hasUnnamed: boolean } {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return { named: new Set([(rule as { name: string }).name]), hasUnnamed: false };
		case CHOICE: {
			const named = new Set<string>();
			let hasUnnamed = false;
			for (const m of (rule as { members: Rule<'link'>[] }).members) {
				const p = slotKindProfile(m);
				for (const n of p.named) named.add(n);
				hasUnnamed = hasUnnamed || p.hasUnnamed;
			}
			return { named, hasUnnamed };
		}
		case REPEAT:
		case REPEAT1:
		case OPTIONAL:
		case FIELD:
			return slotKindProfile((rule as { content: Rule<'link'> }).content);
		default:
			return { named: new Set(), hasUnnamed: true };
	}
}
