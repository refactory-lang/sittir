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

import type { Rule } from './rule.ts';

/**
 * Walk a rule tree looking for the first repeat-with-separator. Used by
 * structural nodes to propagate tree-sitter's `sepBy` / `repSeq`
 * separator hints onto their joinBy slot so `$$$CHILDREN` renders
 * with the right glue.
 */
export function findRepeatSeparator(rule: Rule): string | undefined {
	switch (rule.type) {
		case 'repeat':
		case 'repeat1':
			if (rule.separator) return rule.separator;
			return findRepeatSeparator(rule.content);
		case 'seq':
		case 'choice':
			for (const m of rule.members) {
				const sep = findRepeatSeparator(m);
				if (sep) return sep;
			}
			return undefined;
		case 'optional':
		case 'variant':
		case 'group':
		case 'field':
			return findRepeatSeparator(rule.content);
		default:
			return undefined;
	}
}

/**
 * Does `rule` contain a repeat/repeat1 that declares the given flag?
 *
 * `trailing: true` marks `sepBy` shapes where the final separator is
 * optional (e.g. rust's `{ a, b, }`). `leading: true` marks the
 * mirror shape `sep, x, (sep x)*` (rust's or_pattern `| a | b`, if
 * written as a single repeat). Evaluate's `liftCommaSep` captures
 * both from their canonical seq patterns. Render reads each flag via
 * the `joinByTrailing` / `joinByLeading` template hints to know
 * whether to probe for a flanking anon-separator token when emitting
 * `$$$CHILDREN`.
 *
 * Walks the same transparent-wrapper set as `findRepeatSeparator`
 * (seq / choice / optional / variant / clause / group / field).
 */
export function findRepeatFlag(rule: Rule, flag: 'trailing' | 'leading'): boolean {
	// RenderRule leaf-attribute path: applyWrapperDeletion stamps the
	// separator info as an object `{ rules, trailing?, leading? }` onto the
	// leaf when the repeat wrapper carries the flag. Check this FIRST so
	// RenderRule input (no repeat/repeat1 wrappers) still returns correctly.
	const sep = rule.separator;
	if (typeof sep === 'object' && !Array.isArray(sep) && sep !== null) {
		if ((sep as { trailing?: boolean; leading?: boolean })[flag] === true) return true;
	}

	switch (rule.type) {
		case 'repeat':
		case 'repeat1':
			if (rule[flag]) return true;
			return findRepeatFlag(rule.content, flag);
		case 'seq':
		case 'choice':
			return rule.members.some((m) => findRepeatFlag(m, flag));
		case 'optional':
		case 'variant':
		case 'group':
		case 'field':
			return findRepeatFlag(rule.content, flag);
		default:
			return false;
	}
}

/**
 * Collect the names of named fields whose content contains a `repeat` /
 * `repeat1` with the given flag (`trailing` or `leading`). Returns a
 * `Set<string>` of field names — empty when no such field is found.
 *
 * Used by the template emitter to build a per-field trailing-separator
 * set so `filterForFlanks` can restrict `joinWithTrailing` to the
 * specific fields whose repeats carry the flag, rather than applying it
 * globally whenever the whole rule has any trailing repeat.
 */
export function findFieldsWithRepeatFlag(rule: Rule, flag: 'trailing' | 'leading'): Set<string> {
	const out = new Set<string>();
	collectFieldsWithRepeatFlag(rule, flag, out);
	return out;
}

function collectFieldsWithRepeatFlag(rule: Rule, flag: 'trailing' | 'leading', acc: Set<string>): void {
	switch (rule.type) {
		case 'field':
			if (findRepeatFlag(rule.content, flag)) acc.add(rule.name);
			return;
		case 'seq':
		case 'choice':
			for (const m of rule.members) collectFieldsWithRepeatFlag(m, flag, acc);
			return;
		case 'repeat':
		case 'repeat1':
		case 'optional':
		case 'variant':
		case 'group':
			collectFieldsWithRepeatFlag(rule.content, flag, acc);
			return;
		default:
			return;
	}
}
