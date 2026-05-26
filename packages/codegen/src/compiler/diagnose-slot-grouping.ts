/**
 * compiler/diagnose-slot-grouping.ts — Simplify-time propose-promotion diagnostic.
 *
 * Enforces the invariant: "a slot never contains multiple slots; a multi-slot
 * substructure must be a group." Walks each simplified rule and emits diagnostic
 * records for three violation shapes:
 *
 *   1. multi-slot-nested-seq   — a seq with countSlots≥2 that is in a slot-creating
 *      position (inside repeat/optional content, inside a choice arm, or in the body
 *      of an auto-group helper that is in the grammar's inline set).
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
 *   b. As a member of a `choice` arm (structural choice arms are each a slot
 *      boundary; a multi-slot seq arm needs grouping).
 *   c. As the top-level body of an auto-group helper kind (a hidden kind whose
 *      name appears in `inlineKinds` — these are exactly the synthesized
 *      `_<parent>_repeat<N>` / `_<parent>_optional<N>` helpers that represent
 *      the seq content of an inlined `repeat(seq(...))`).
 *
 *   Rules whose top-level body is a seq but are NOT in `inlineKinds` (normal
 *   branch kinds, already-registered group kinds) are SILENT at the top level
 *   because their seq is the rule body, not a slot.
 *
 * DIAGNOSTIC ONLY: records never drive codegen behavior
 * (feedback_metadata_not_behavior). They are surfaced via the derivation log
 * and console during regen so the author can act.
 */

import type { PolymorphRule, Rule, SimplifiedRule } from './rule.ts';
import { countSlots } from './slot-count.ts';

// ---------------------------------------------------------------------------
// Polymorph skip-set construction
// ---------------------------------------------------------------------------

/**
 * Build the set of kind names that belong to the polymorph system and should
 * be skipped by shape ① detection.  Includes:
 *
 *   - Every kind whose rule is a `PolymorphRule` (`rule.type === 'polymorph'`).
 *   - Every synthesized form kind name derived from those polymorphs using the
 *     same disambiguation formula as `optimize.ts` / `assemble.ts`:
 *       promoted  → `${parentKind}_${disambiguated}`
 *       override  → `${parentKind}__form_${disambiguated}`
 *   - Hidden (`_`-prefixed) kinds whose name starts with `_${parentKind}_` for
 *     any polymorph parent. These are the `polymorphs:`-config synthesized arms
 *     (e.g. `_public_field_definition_abstract_first`) that are inlined into the
 *     parent's body and already handled by the polymorph dispatch machinery.
 *
 * These are structural dispatch mechanisms — the variant() / promotePolymorph
 * machinery resolves them correctly; flagging them as "multi-slot nested seqs"
 * would be a false positive.
 *
 * Also exported so `optimize.ts` can pre-build the skip-set from the full
 * rules map and pass it to the polyform-bodies `computeSimplifiedRules` call,
 * where the rules map is a subset that lacks the parent polymorph entries.
 */
export function buildPolymorphSkipSetFromRules(rules: Record<string, unknown>): ReadonlySet<string> {
	return buildPolymorphSkipSet(rules as Record<string, SimplifiedRule>);
}

function buildPolymorphSkipSet(rules: Record<string, SimplifiedRule>): ReadonlySet<string> {
	const skip = new Set<string>();
	const polymorphParentKinds = new Set<string>();

	for (const [parentKind, rule] of Object.entries(rules)) {
		if (rule.type !== 'polymorph') continue;
		skip.add(parentKind);
		polymorphParentKinds.add(parentKind);
		const polySource = (rule as unknown as PolymorphRule).source === 'override' ? 'override' : 'promoted';
		const nameCounts = new Map<string, number>();
		for (const form of (rule as unknown as PolymorphRule).forms) {
			const seen = nameCounts.get(form.name) ?? 0;
			nameCounts.set(form.name, seen + 1);
			const disambiguated = seen === 0 ? form.name : `${form.name}${seen + 1}`;
			const formKind =
				polySource === 'override'
					? `${parentKind}__form_${disambiguated}`
					: `${parentKind}_${disambiguated}`;
			skip.add(formKind);
			// Also skip the visible child kind (the actual grammar rule name used by
			// variant() adoption, e.g. `_public_field_definition_abstract_first`).
			// These are inlined grammar rules that carry the form body directly and
			// are already handled by the polymorph dispatch machinery.
			if (form.visibleChildKind !== undefined) {
				skip.add(form.visibleChildKind);
			}
		}
	}

	// Second pass: add hidden (`_`-prefixed) rules whose name starts with
	// `_${parentKind}_` for any polymorph parent. These are `polymorphs:`-config
	// synthesized arm rules like `_public_field_definition_abstract_first` that
	// don't appear as explicit form entries (they're inlined by tree-sitter), but
	// ARE polymorph arms already handled by the dispatch machinery.
	if (polymorphParentKinds.size > 0) {
		for (const kind of Object.keys(rules)) {
			if (!kind.startsWith('_')) continue;
			const withoutLeadingUnderscore = kind.slice(1); // e.g. 'public_field_definition_abstract_first'
			for (const parentKind of polymorphParentKinds) {
				if (withoutLeadingUnderscore.startsWith(parentKind + '_')) {
					skip.add(kind);
					break;
				}
			}
		}
	}

	return skip;
}

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
 * @param inlineKinds - The grammar's inline kind set (from wire phase). Auto-group
 *   helpers (`_<parent>_repeat<N>`, `_<parent>_optional<N>`) are in this set;
 *   their top-level bodies are treated as slot-position seqs and checked.
 *   All other kinds are only checked for NESTED slot-position seqs.
 * @returns An array of diagnostic records (may be empty).
 */
export function diagnoseSlotGrouping(
	rules: Record<string, SimplifiedRule>,
	inlineKinds: ReadonlySet<string> = new Set(),
	polymorphSkipExtra: ReadonlySet<string> = new Set()
): SlotGroupingDiagnostic[] {
	// Build polymorph skip-set once for the whole rules map, then merge any
	// caller-provided extra entries (used when the rules map is a subset that
	// lacks the parent polymorph entries, e.g. the polyform-bodies pass in
	// optimize.ts).
	const polymorphSkipLocal = buildPolymorphSkipSet(rules);
	const polymorphSkip: ReadonlySet<string> =
		polymorphSkipExtra.size === 0
			? polymorphSkipLocal
			: new Set([...polymorphSkipLocal, ...polymorphSkipExtra]);

	const records: SlotGroupingDiagnostic[] = [];
	for (const [ownerKind, rule] of Object.entries(rules)) {
		// Skip any kind that belongs to the polymorph system.
		if (polymorphSkip.has(ownerKind)) continue;

		// Determine whether the top-level rule body is in slot position.
		// Auto-group helpers (in inlineKinds) represent extracted seq content
		// of an inlined repeat(seq(...)) — their body IS the repeating element,
		// so it is in slot position. All other kinds: top-level body is NOT
		// in slot position (it is the rule itself, not a slot).
		const topLevelInSlot = inlineKinds.has(ownerKind);
		walkRule(rule, ownerKind, records, topLevelInSlot);
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
 */
function walkRule(rule: Rule, ownerKind: string, records: SlotGroupingDiagnostic[], inSlotPosition: boolean): void {
	switch (rule.type) {
		case 'seq':
			// Only check if in a slot-creating position — a top-level rule body
			// seq is the rule itself, not a nested seq inside a slot.
			if (inSlotPosition) {
				checkSeq(rule, ownerKind, records);
			}
			// Recurse into members. A seq member's position context is inherited
			// from the current position (a nested seq inside another seq that is
			// already in slot position is also in slot position).
			for (const m of rule.members) {
				walkRule(m, ownerKind, records, inSlotPosition);
			}
			break;

		case 'repeat':
		case 'repeat1':
			// Content of a repeat is in slot position.
			checkRepeat(rule, ownerKind, records);
			walkRule(rule.content, ownerKind, records, /* inSlotPosition= */ true);
			break;

		case 'choice':
			// Each choice arm is in slot position — a multi-slot seq arm is a
			// slot-position violation.
			for (const m of rule.members) {
				walkRule(m, ownerKind, records, /* inSlotPosition= */ true);
			}
			break;

		case 'optional':
		case 'field':
			// Simplified rules normally have wrappers deleted, but handle
			// defensively. Content is in slot position.
			walkRule((rule as unknown as { content: Rule }).content, ownerKind, records, /* inSlotPosition= */ true);
			break;

		case 'variant':
		case 'group':
		case 'clause':
			// Transparent structural wrappers — propagate current slot position.
			walkRule((rule as { content: Rule }).content, ownerKind, records, inSlotPosition);
			break;

		default:
			// Leaf — nothing to walk.
			break;
	}
}

// ---------------------------------------------------------------------------
// Shape ①: multi-slot seq in a slot position
// ---------------------------------------------------------------------------

function checkSeq(rule: Extract<Rule, { type: 'seq' }>, ownerKind: string, records: SlotGroupingDiagnostic[]): void {
	const slotCount = countSlots(rule);
	if (slotCount < 2) return;

	records.push({
		ownerKind,
		shape: 'multi-slot-nested-seq',
		slotCount,
		proposal:
			`Kind '${ownerKind}' has a multi-slot seq with ${slotCount} slots in a slot-creating position. ` +
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
