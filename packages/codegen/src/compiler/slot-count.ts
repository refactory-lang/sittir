/**
 * compiler/slot-count.ts — shared recursive slot counter.
 *
 * Mirrors `collectSlots`' distribution semantics, built on
 * `isNonterminalRuleType` from rule-catalog.ts (Table 1). This is the
 * single source of truth for "how many slots does this rule contribute."
 *
 * Distribution table (matches the spec design doc):
 *
 *   seq                       → recurse + sum members (distribute)
 *   choice / symbol / supertype /
 *   pattern / enum / repeat /
 *   repeat1 / optional / field → 1 (slot boundary — one union/array/single slot)
 *   variant / group / clause   → transparent — recurse into content
 *   string / terminal /
 *   indent / dedent / newline  → 0
 *
 * Note: `choice`, `repeat`, `repeat1`, `optional`, and `field` each count as
 * exactly ONE slot regardless of their contents — they are slot BOUNDARIES, not
 * transparent containers. A seq distributes across its members because seqs
 * themselves emit no slot.
 *
 * `variant` / `group` / `clause` are transparent because they are purely
 * structural wrappers; their content's slot count IS this node's slot count.
 */

import type { Rule } from './rule.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';

/**
 * Count the number of slots contributed by `rule`.
 *
 * This is the shared primitive for the slot-grouping diagnostic and any
 * future consumer that needs a count without building full `AssembledNonterminal`
 * records. Consumers must NOT re-derive terminality — call this function.
 */
export function countSlots(rule: Rule): number {
	switch (rule.type) {
		case 'seq':
			// Distribute: the seq itself emits no slot; sum its members.
			return rule.members.reduce((sum, m) => sum + countSlots(m), 0);

		case 'variant':
		case 'group':
			// Transparent wrappers — their content's count is this node's count.
			return countSlots(rule.content);

		default:
			// Everything else is either a slot boundary (nonterminal → 1) or a
			// terminal (string / indent / dedent / newline / terminal → 0).
			// `isNonterminalRuleType` encodes Table 1 and is the authoritative
			// terminality predicate — do not re-derive here.
			return isNonterminalRuleType(rule) ? 1 : 0;
	}
}

/**
 * Count the CONTENT slots a rule's body yields — UNNAMED nonterminal slots that
 * resolve to the generic `content` storage name (no `fieldName`, not a single
 * named parse kind). A node whose body yields >1 of these cannot emit (they'd
 * share the `_content` storage key) — at least one needs a `field()` name.
 *
 * Mirrors `countSlots`' distribution with two refinements:
 *   - A FIELD-NAMED seq is ONE named slot (its `fieldName` makes it a single
 *     slot); it is NOT distributed into (its inner unnamed slots belong to that
 *     named group, not the enclosing node).
 *   - Only slot boundaries that resolve to `content` count (single named kind →
 *     named by its kind, not `content`; a string literal inside a choice/optional
 *     /repeat IS a slot value and makes the boundary unnamed-multi → `content`).
 *
 * Counted on the simplified rule BEFORE `mergeSlotsByName` folds duplicate
 * `content` slots into one (which would mask the collision).
 */
export function countContentSlots(rule: Rule): number {
	switch (rule.type) {
		case 'seq':
			// A field-named seq is a single named slot — do not distribute. Only an
			// UNNAMED seq distributes (sums its members' content slots).
			return (rule as { fieldName?: string }).fieldName !== undefined
				? 0
				: rule.members.reduce((sum, m) => sum + countContentSlots(m), 0);
		case 'variant':
		case 'group':
			return countContentSlots(rule.content);
		default:
			return isContentSlot(rule) ? 1 : 0;
	}
}

/** A slot boundary that resolves to the generic `content` storage name. */
function isContentSlot(rule: Rule): boolean {
	if (!isNonterminalRuleType(rule)) return false; // terminal — emits no slot
	if ((rule as { fieldName?: string }).fieldName !== undefined) return false; // named slot
	const { named, hasUnnamed } = slotKindProfile(rule);
	// storageName is the single named kind iff exactly one named kind AND no
	// unnamed value present; otherwise it falls back to `content`.
	return !(named.size === 1 && !hasUnnamed);
}

/**
 * The distinct named parse kinds a slot-boundary rule would expose, plus whether
 * it carries any unnamed value (literal / pattern / enum / anonymous token).
 * Mirrors `projectSlotNaming`'s storageName inputs at the rule level.
 */
function slotKindProfile(rule: Rule): { named: Set<string>; hasUnnamed: boolean } {
	switch (rule.type) {
		case 'symbol':
		case 'supertype':
			return { named: new Set([(rule as { name: string }).name]), hasUnnamed: false };
		case 'choice': {
			const named = new Set<string>();
			let hasUnnamed = false;
			for (const m of (rule as { members: Rule[] }).members) {
				const p = slotKindProfile(m);
				for (const n of p.named) named.add(n);
				hasUnnamed = hasUnnamed || p.hasUnnamed;
			}
			return { named, hasUnnamed };
		}
		case 'repeat':
		case 'repeat1':
		case 'optional':
		case 'field':
			return slotKindProfile((rule as { content: Rule }).content);
		default:
			// string / pattern / enum / indent / dedent / newline / terminal / token
			// — no named kind, contributes an unnamed value.
			return { named: new Set(), hasUnnamed: true };
	}
}
