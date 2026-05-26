/**
 * compiler/diagnose-slot-grouping.ts — Simplify-time propose-promotion diagnostic.
 *
 * Enforces the invariant: "a slot never contains multiple slots; a multi-slot
 * substructure must be a group." Walks each simplified rule and emits diagnostic
 * records for three violation shapes:
 *
 *   1. multi-slot-nested-seq   — a seq with countSlots≥2 that is not already a
 *      group → propose a visible `groups:` registration.
 *   2. supertype-list          — repeat/repeat1 of a single non-field-named
 *      symbol/supertype → propose `transforms: field()` rename.
 *   3. repeat-choice-with-literal — repeat/repeat1(choice(..., literal, ...))
 *      → flag as ambiguous; author decides.
 *
 * DIAGNOSTIC ONLY: records never drive codegen behavior
 * (feedback_metadata_not_behavior). They are surfaced via the derivation log
 * and console during regen so the author can act.
 */

import type { Rule, SimplifiedRule } from './rule.ts';
import { countSlots } from './slot-count.ts';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SlotGroupingShape = 'multi-slot-nested-seq' | 'supertype-list' | 'repeat-choice-with-literal';

export interface SlotGroupingDiagnostic {
	/** The kind that owns the rule containing the violation. */
	readonly ownerKind: string;
	/** Which violation shape was detected. */
	readonly shape: SlotGroupingShape;
	/** The slot count of the offending sub-rule (for multi-slot-nested-seq). */
	readonly slotCount: number;
	/** Human-readable propose-promotion text for the author. */
	readonly proposal: string;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Walk every simplified rule in the map and emit a diagnostic record for each
 * violation of the "one slot per structural boundary" invariant.
 *
 * @param rules - The simplified rule map (output of `computeSimplifiedRules`).
 * @returns An array of diagnostic records (may be empty).
 */
export function diagnoseSlotGrouping(rules: Record<string, SimplifiedRule>): SlotGroupingDiagnostic[] {
	const records: SlotGroupingDiagnostic[] = [];
	for (const [ownerKind, rule] of Object.entries(rules)) {
		walkRule(rule, ownerKind, records);
	}
	return records;
}

// ---------------------------------------------------------------------------
// Walk — visits seq and repeat/repeat1 nodes at any depth
// ---------------------------------------------------------------------------

function walkRule(rule: Rule, ownerKind: string, records: SlotGroupingDiagnostic[]): void {
	switch (rule.type) {
		case 'seq':
			checkSeq(rule, ownerKind, records);
			// Also recurse into members so nested seqs at deeper levels are visited.
			for (const m of rule.members) {
				walkRule(m, ownerKind, records);
			}
			break;

		case 'repeat':
		case 'repeat1':
			checkRepeat(rule, ownerKind, records);
			// Recurse into the content so nested structures are visited.
			walkRule(rule.content, ownerKind, records);
			break;

		case 'choice':
			// Recurse into each choice arm — nested seqs / repeats inside choice
			// arms are still subject to the invariant.
			for (const m of rule.members) {
				walkRule(m, ownerKind, records);
			}
			break;

		case 'optional':
		case 'field':
			// These should not appear in simplified rules (deleteWrapper removes
			// them), but handle defensively.
			walkRule((rule as unknown as { content: Rule }).content, ownerKind, records);
			break;

		case 'variant':
		case 'group':
		case 'clause':
			walkRule((rule as { content: Rule }).content, ownerKind, records);
			break;

		default:
			// Leaf — nothing to walk.
			break;
	}
}

// ---------------------------------------------------------------------------
// Shape ①: multi-slot nested seq
// ---------------------------------------------------------------------------

function checkSeq(rule: Extract<Rule, { type: 'seq' }>, ownerKind: string, records: SlotGroupingDiagnostic[]): void {
	// Already a group → silent. (`seq` with `type: 'group'` is impossible since
	// they are separate rule types, but a group wrapping a seq is handled by
	// walkRule descending into the group's content before calling checkSeq.)
	const slotCount = countSlots(rule);
	if (slotCount < 2) return;

	// Not already a group — emit the proposal.
	records.push({
		ownerKind,
		shape: 'multi-slot-nested-seq',
		slotCount,
		proposal:
			`Kind '${ownerKind}' has a nested seq with ${slotCount} slots. ` +
			`Propose: register a visible groups: entry so this substructure ` +
			`becomes a single group slot in the parent.`,
	});
}

// ---------------------------------------------------------------------------
// Shape ② and ③: repeat / repeat1 of symbol/supertype or choice-with-literal
// ---------------------------------------------------------------------------

function checkRepeat(
	rule: Extract<Rule, { type: 'repeat' | 'repeat1' }>,
	ownerKind: string,
	records: SlotGroupingDiagnostic[]
): void {
	const content = rule.content;

	// Shape ③: repeat(choice(..., literal, ...)) — heterogeneous; flag as ambiguous.
	if (content.type === 'choice') {
		const hasLiteral = content.members.some((m) => m.type === 'string');
		if (hasLiteral) {
			records.push({
				ownerKind,
				shape: 'repeat-choice-with-literal',
				slotCount: 1,
				proposal:
					`Kind '${ownerKind}' has a repeat(choice(..., literal, ...)) — ` +
					`heterogeneous repeating content with interleaved literals. ` +
					`Author decides: visible groups: registration or transforms: field() rename.`,
			});
			return;
		}
		// No literal in the choice → single union slot → shape ②.
		checkRepeatOfSymbol(rule, content, ownerKind, records);
		return;
	}

	// Shape ②: repeat/repeat1 of a single symbol or supertype (not field-named).
	checkRepeatOfSymbol(rule, content, ownerKind, records);
}

function checkRepeatOfSymbol(
	_repeatRule: Extract<Rule, { type: 'repeat' | 'repeat1' }>,
	content: Rule,
	ownerKind: string,
	records: SlotGroupingDiagnostic[]
): void {
	// Only symbol or supertype, or a choice of symbols/supertypes (all union, no literals).
	const isSymbolLike = content.type === 'symbol' || content.type === 'supertype';
	const isChoiceOfSymbols =
		content.type === 'choice' &&
		content.members.length > 0 &&
		content.members.every((m) => m.type === 'symbol' || m.type === 'supertype');

	if (!isSymbolLike && !isChoiceOfSymbols) return;

	// Already field-named → the author has already named this slot → silent.
	const fieldName = (content as { fieldName?: string }).fieldName;
	if (fieldName !== undefined) return;

	const symName =
		content.type === 'symbol' || content.type === 'supertype'
			? content.name
			: content.members.map((m) => (m as { name: string }).name).join('|');

	records.push({
		ownerKind,
		shape: 'supertype-list',
		slotCount: 1,
		proposal:
			`Kind '${ownerKind}' has a repeat(${symName}) without a field name. ` +
			`This fragments at read by concrete kind. ` +
			`Propose: add transforms: { '(${symName})': field('<name>') } in overrides.ts.`,
	});
}
