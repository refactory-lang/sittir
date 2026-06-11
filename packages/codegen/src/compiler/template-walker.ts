/**
 * compiler/template-walker.ts — lightweight helpers for inspecting repeat
 * metadata inside a Rule subtree.
 *
 * The legacy `renderRuleTemplate` / `deriveWalkSlots` / `walkRuleForTemplate`
 * pipeline was deleted in PR3 step 1. The authoritative template emitter is
 * `TemplateEmitter` in `emitters/templates.ts`.
 *
 * What remains here are three exported query functions that are LIVE callers:
 * - {@link findRepeatSeparator} — imported by `node-map.ts` (AssembledBranch /
 *   AssembledGroup) to discover the rule's separator for `joinBy` metadata.
 * - {@link findRepeatFlag} — imported by `node-map.ts` and tested in
 *   `rule-walker.test.ts` to detect `trailing`/`leading` repeat flags.
 * - {@link findFieldsWithRepeatFlag} — imported by `collect-slots.ts` for
 *   per-field trailing/leading flag derivation.
 */

import { CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, VARIANT } from './rule-types.ts'; // @rule-type-consts
import type { Rule } from './rule.ts';
// `findRepeatFlag` moved to transforms.ts (PR-O M1 de-scatter); imported for local use +
// re-exported for existing importers (collect-slots.ts, rule-walker.test.ts).
import { findRepeatFlag } from './transforms.ts';
export { findRepeatFlag } from './transforms.ts';

/**
 * Walk a rule tree looking for the first repeat-with-separator. Used by
 * structural nodes to propagate tree-sitter's `sepBy` / `repSeq`
 * separator hints onto their joinBy slot so `$$$CHILDREN` renders
 * with the right glue.
 */
export function findRepeatSeparator(rule: Rule): string | undefined {
	switch (rule.type) {
		case REPEAT:
		case REPEAT1:
			if (rule.separator) return rule.separator;
			return findRepeatSeparator(rule.content);
		case SEQ:
		case CHOICE:
			for (const m of rule.members) {
				const sep = findRepeatSeparator(m);
				if (sep) return sep;
			}
			return undefined;
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		case FIELD:
			return findRepeatSeparator(rule.content);
		default:
			return undefined;
	}
}

/**
 * Collect the names of named fields whose content contains a `repeat` /
 * `repeat1` with the given flag (`trailing` or `leading`). Returns a
 * `Set<string>` of field names — empty when no such field is found.
 *
 * Used by the template emitter to build a per-field trailing-separator
 * set so `selectJoinFilter` (emitters/templates.ts) can restrict
 * `joinWithTrailing` to the specific fields whose repeats carry the
 * flag, rather than applying it globally whenever the whole rule has
 * any trailing repeat.
 */
export function findFieldsWithRepeatFlag(rule: Rule, flag: 'trailing' | 'leading'): Set<string> {
	const out = new Set<string>();
	collectFieldsWithRepeatFlag(rule, flag, out);
	return out;
}

function collectFieldsWithRepeatFlag(rule: Rule, flag: 'trailing' | 'leading', acc: Set<string>): void {
	switch (rule.type) {
		case FIELD:
			if (findRepeatFlag(rule.content, flag)) acc.add(rule.name);
			return;
		case SEQ:
		case CHOICE:
			for (const m of rule.members) collectFieldsWithRepeatFlag(m, flag, acc);
			return;
		case REPEAT:
		case REPEAT1:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
			collectFieldsWithRepeatFlag(rule.content, flag, acc);
			return;
		default:
			return;
	}
}
