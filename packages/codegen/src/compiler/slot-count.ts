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
		case 'clause':
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
