/**
 * compiler/diagnose-slot-grouping.ts — Simplify-time propose-promotion diagnostic.
 *
 * Enforces the invariant: "a slot never contains multiple slots; a multi-slot
 * substructure must be a group." Walks each simplified rule and emits diagnostic
 * records for three violation shapes:
 *
 *   1. multi-slot-nested-seq   — a seq with countSlots≥2 that is in a genuine
 *      slot-creating position: inside repeat/optional content, or in the body of an
 *      auto-group helper that is in the grammar's inline set.
 *      Choice-arm position is SUPPRESSED (choice-distributed — collectSlots already
 *      treats the whole choice as a single union slot boundary; the seq arms are NOT
 *      separate slots and do NOT need grouping).
 *      → propose a visible `groups:` registration.
 *   2. supertype-list          — repeat/repeat1 of a single non-field-named
 *      symbol/supertype → propose `transforms: field()` rename.
 *   3. repeat-choice-with-literal — repeat/repeat1(choice(..., literal, ...))
 *      → flag as ambiguous; author decides.
 *
 * Key invariant for shape ①: the top-level rule BODY of a normal grammar kind
 * is NOT a "slot" — it is the kind itself. Shape ① fires only when a seq
 * occupies a slot-creating position:
 *
 *   a. As the content of a `repeat` / `repeat1` / `optional` (seq is the
 *      repeating element body — the whole point of the diagnostic).
 *   b. As the top-level body of an auto-group helper kind (a hidden kind whose
 *      name appears in `inlineKinds` — these are exactly the synthesized
 *      `_<parent>_repeat<N>` / `_<parent>_optional<N>` helpers that represent
 *      the seq content of an inlined `repeat(seq(...))`).
 *
 *   SUPPRESSED position — choice arms: collectSlots treats the whole choice as a
 *   single union slot boundary, so a multi-slot seq arm is already handled by the
 *   union — it is NOT a genuine group-lift violation. Firing on choice arms was a
 *   false positive (PR-P diagnostic narrowing).
 *
 *   Rules whose top-level body is a seq but are NOT in `inlineKinds` (normal
 *   branch kinds, already-registered group kinds) are SILENT at the top level
 *   because their seq is the rule body, not a slot.
 *
 * DIAGNOSTIC ONLY: records never drive codegen behavior
 * (feedback_metadata_not_behavior). They are surfaced via the derivation log
 * and console during regen so the author can act.
 */

import { CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, SUPERTYPE, SYMBOL, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, SimplifiedRule } from '../types/rule.ts';
import { isAllTextShape } from './assemble.ts';
import { countSlots, countContentSlots } from './slot-count.ts';
import type { Diagnostic } from '../types/diagnostics.ts';

// All-text shape predicate: `isAllTextShape` is imported from assemble.ts (the
// SAME predicate that classifies modelType === 'pattern'). DRY — no mirrored copy
// that could drift (the REPEAT1 case lives in exactly one place). Used to suppress
// content-collision false-positives on pattern kinds (identifier, float, …), which
// have all-text simplified rules and emit no structural slots.

// ---------------------------------------------------------------------------
// Polymorph skip-set construction
// ---------------------------------------------------------------------------

/**
 * Build the set of kind names that belong to the polymorph system and should
 * be skipped by shape ① detection.
 *
 * PolymorphRule was removed in PR-M-φ2; no rule ever has `type === 'polymorph'`
 * at runtime. This function now always returns an empty set.  It is retained for
 * API stability (callers still thread polymorphSkipExtra through the pipeline for
 * variant() skip-set entries added by the caller).
 */
export function buildPolymorphSkipSetFromRules(_rules: Record<string, unknown>): ReadonlySet<string> {
	return new Set<string>();
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SlotGroupingShape =
	| 'multi-slot-nested-seq'
	| 'supertype-list'
	| 'repeat-choice-with-literal'
	| 'content-collision';

export interface SlotGroupingDiagnostic extends Diagnostic {
	readonly code: SlotGroupingShape;
	readonly severity: 'warning';
	readonly message: string;
	readonly canProceed: true;
	/** The kind that owns the rule containing the violation. */
	readonly ownerKind: string;
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
 * @param inlineKinds - The grammar's inline kind set (from wire phase). Auto-group
 *   helpers (`_<parent>_repeat<N>`, `_<parent>_optional<N>`) are in this set;
 *   their top-level bodies are treated as slot-position seqs and checked.
 *   All other kinds are only checked for NESTED slot-position seqs.
 * @param polymorphSkipExtra - Extra kind names to skip for shape ①/②/③.
 * @returns An array of diagnostic records (may be empty).
 */
export function diagnoseSlotGrouping(
	rules: Record<string, SimplifiedRule>,
	inlineKinds: ReadonlySet<string> = new Set(),
	polymorphSkipExtra: ReadonlySet<string> = new Set()
): SlotGroupingDiagnostic[] {
	// PolymorphRule was removed; the built-in skip-set is always empty.
	// Use only the caller-provided extra entries (variant() skip-set from
	// polymorphVariants metadata threaded through normalize.ts).
	const polymorphSkip: ReadonlySet<string> = polymorphSkipExtra;

	const records: SlotGroupingDiagnostic[] = [];
	for (const [ownerKind, rule] of Object.entries(rules)) {
		// §4c content-collision: count the UNNAMED content slots the kind's body
		// yields (field-named seqs are single named slots, NOT distributed). >1
		// means they'd share the `_content` storage key — an unemittable ambiguity
		// — so at least one needs a `field()` name. Counted on the simplified rule,
		// BEFORE mergeSlotsByName folds the duplicate `content` slots into one
		// (which masks the collision).
		//
		// FALSE POSITIVE guard: skip all-text-shape kinds (pure text leaves like
		// `identifier`, `integer_literal`, `float` whose modelType === 'pattern').
		// Their simplified rules contain unnamed slot-boundary choices-of-patterns
		// that all resolve to text content — no real storage-key collision exists
		// because the kind emits no structural slots. `isAllTextShape` is the SAME
		// predicate assemble.ts uses to classify 'pattern' (imported, not mirrored).
		if (!isAllTextShape(rule)) {
			const contentCount = countContentSlots(rule);
			if (contentCount > 1) {
				records.push({
					code: 'content-collision',
					severity: 'warning',
					message: `Kind '${ownerKind}' has ${contentCount} anonymous 'content' slots that would share the '_content' storage key.`,
					canProceed: true,
					ownerKind,
					slotCount: contentCount,
					proposal:
						`Kind '${ownerKind}' has ${contentCount} anonymous 'content' slots that would share ` +
						`the '_content' storage key (an unemittable ambiguity). ` +
						`field()-name at least one in overrides.ts.`,
				});
			}
		}

		// Skip any kind that belongs to the polymorph system (shape ①/②/③ below
		// treat the variant/promotePolymorph machinery as already-correct dispatch).
		if (polymorphSkip.has(ownerKind)) continue;

		// Determine whether the top-level rule body is in slot position.
		// Auto-group helpers (in inlineKinds) represent extracted seq content
		// of an inlined repeat(seq(...)) — their body IS the repeating element,
		// so it is in slot position. All other kinds: top-level body is NOT
		// in slot position (it is the rule itself, not a slot).
		const topLevelInSlot = inlineKinds.has(ownerKind);
		// Top-level body of an inline helper is in repeat/optional slot position
		// (not a choice arm), so inChoiceArm=false at the top level.
		walkRule(rule, ownerKind, records, topLevelInSlot, /* inChoiceArm= */ false);
	}
	return records;
}

// ---------------------------------------------------------------------------
// Walk — visits seq and repeat/repeat1 nodes tracking slot position
// ---------------------------------------------------------------------------

/**
 * @param inSlotPosition - True when `rule` occupies a slot-creating position:
 *   inside a repeat/optional content, inside a choice arm, or as the top-level
 *   body of an inline-listed (auto-group helper) kind.
 * @param inChoiceArm - True when `rule` is directly inside a choice arm.
 *   Multi-slot seqs in choice arms are handled by collectSlots' union semantics
 *   (a choice is a single slot boundary regardless of arm content) and are NOT
 *   genuine group-lift violations. Only repeat/optional positions are genuine.
 *   This flag lets checkSeq distinguish the two sources of inSlotPosition.
 */
function walkRule(
	rule: Rule,
	ownerKind: string,
	records: SlotGroupingDiagnostic[],
	inSlotPosition: boolean,
	inChoiceArm: boolean
): void {
	switch (rule.type) {
		case SEQ:
			// Only check if in a slot-creating position — a top-level rule body
			// seq is the rule itself, not a nested seq inside a slot.
			if (inSlotPosition) {
				checkSeq(rule, ownerKind, records, inChoiceArm);
			}
			// Recurse into members. A seq member's position context is inherited
			// from the current position (a nested seq inside another seq that is
			// already in slot position is also in slot position).
			for (const m of rule.members) {
				walkRule(m, ownerKind, records, inSlotPosition, inChoiceArm);
			}
			break;

		case REPEAT:
		case REPEAT1:
			// Content of a repeat is in slot position (genuine group-lift position).
			checkRepeat(rule, ownerKind, records);
			walkRule(rule.content, ownerKind, records, /* inSlotPosition= */ true, /* inChoiceArm= */ false);
			break;

		case CHOICE:
			// Each choice arm is in slot position per collectSlots' union semantics,
			// but this is a CHOICE-ARM position — seqs here are NOT genuine
			// group-lift violations (the choice already forms a single union slot).
			for (const m of rule.members) {
				walkRule(m, ownerKind, records, /* inSlotPosition= */ true, /* inChoiceArm= */ true);
			}
			break;

		case OPTIONAL:
		case FIELD:
			// Simplified rules normally have wrappers deleted, but handle
			// defensively. Content is in slot position (genuine group-lift position).
			walkRule((rule as unknown as { content: Rule }).content, ownerKind, records, /* inSlotPosition= */ true, /* inChoiceArm= */ false);
			break;

		case VARIANT:
		case GROUP:
			// Transparent structural wrappers — propagate current slot position.
			walkRule((rule as { content: Rule }).content, ownerKind, records, inSlotPosition, inChoiceArm);
			break;

		default:
			// Leaf — nothing to walk.
			break;
	}
}

// ---------------------------------------------------------------------------
// Shape ①: multi-slot seq in a slot position
// ---------------------------------------------------------------------------

function checkSeq(
	rule: Extract<Rule, { type: 'seq' }>,
	ownerKind: string,
	records: SlotGroupingDiagnostic[],
	inChoiceArm: boolean
): void {
	const slotCount = countSlots(rule);
	if (slotCount < 2) return;

	// FALSE POSITIVE guard: a multi-slot seq inside a CHOICE arm is NOT a genuine
	// group-lift violation. collectSlots treats the whole choice as a single union
	// slot boundary, so the seq's members are choice-distributed — each arm is a
	// variant of the union, not a separate slot. Only repeat/optional positions
	// (inChoiceArm === false) are genuine group-lift candidates.
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
				code: 'repeat-choice-with-literal',
				severity: 'warning',
				message: `Kind '${ownerKind}' has a repeat(choice(..., literal, ...)) — heterogeneous repeating content with interleaved literals.`,
				canProceed: true,
				ownerKind,
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
	const isSymbolLike = content.type === SYMBOL || content.type === SUPERTYPE;
	const isChoiceOfSymbols =
		content.type === CHOICE &&
		content.members.length > 0 &&
		content.members.every((m) => m.type === 'symbol' || m.type === 'supertype');

	if (!isSymbolLike && !isChoiceOfSymbols) return;

	// Already field-named → the author has already named this slot → silent.
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
			`Propose: add transforms: { '(${symName})': field('<name>') } in overrides.ts.`,
	});
}
