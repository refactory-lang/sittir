/**
 * compiler/transforms.ts — shared, idempotent rule transforms (#13a) +
 * the phase-context base type (#14 / §7.7). The transform BODIES move in via
 * the copilot LSP pass (PR-H Task 5); this file is born holding only the ctx
 * contract so signatures across normalize/simplify can thread it.
 */
import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RepeatRule, Repeat1Rule } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';

// `'single'` is the canonical required-one value (rule.ts `Multiplicity`); a
// missing multiplicity defaults to it (`combineMultiplicity` null-coalesces).
// Moved here from rule-attrs.ts so combineMultiplicity (also here) owns its type.
// rule-attrs.ts re-exports this for existing importers.
export type LeafMultiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray' | undefined;

/** The shared base ctx, declared ONCE (spec §7.7 / CW5). */
export interface TransformCtx {
  readonly rules: Record<string, Rule>;
  readonly inlineKinds: ReadonlySet<string>;
  readonly wordMatcher?: (s: string) => boolean;
  readonly diagnostics: DiagnosticSink;
}

/**
 * Normalize adds one optional extra: the polymorph skip-set for the
 * slot-grouping diagnostic. Kept optional (not on TransformCtx base) so the
 * Task-1 test's bare TransformCtx literal still satisfies NormalizeCtx.
 */
export interface NormalizeCtx extends TransformCtx {
  /** Kinds to exclude from the slot-grouping "propose-promotion" diagnostic. */
  readonly polymorphSkip?: ReadonlySet<string>;
}

/**
 * Simplify carries the same phase-shared state as TransformCtx. (`inField` is
 * NOT here — it is recursion-LOCAL traversal state, kept an explicit recursion
 * param, CW6.)
 */
export type SimplifyCtx = TransformCtx;

// ---------------------------------------------------------------------------
// Shared, idempotent rule transforms (PR-O M1 — de-scatter, not de-dup).
// Each body is moved verbatim from its origin file; no logic changes.
// ---------------------------------------------------------------------------

/**
 * Combine an OUTER multiplicity (pushed down from an enclosing wrapper) with
 * a leaf's own INNER multiplicity into the effective slot multiplicity.
 *
 * `undefined` means "single / exactly one". The lattice:
 *   - nothing pushed (`outer === undefined`) → keep `inner`.
 *   - either side is a collection (array / nonEmptyArray) → the result is a
 *     collection. It is `nonEmptyArray` only when BOTH sides guarantee ≥1
 *     element (a side guarantees ≥1 iff it is single (`undefined`) or
 *     `nonEmptyArray`); otherwise `array` (allows empty).
 *   - neither is a collection → `optional` if either is optional, else single.
 *
 * Examples (the cases this fixes):
 *   combine('nonEmptyArray', undefined)  → 'nonEmptyArray'  (type_arguments union: ≥1)
 *   combine('nonEmptyArray', 'optional') → 'array'          (trait_bounds: 0-or-more)
 *   combine('array', 'optional')         → 'array'
 *   combine('optional', 'optional')      → 'optional'
 *
 * This replaces the prior "outer wins unless inner is already an array" rule,
 * which clobbered an inner `optional` with the outer `nonEmptyArray` and
 * produced `NonEmptyArray<T>` where the runtime slot is 0-or-more.
 *
 * Moved from rule-attrs.ts (origin: rule-attrs.ts:70).
 */
export function combineMultiplicity(outerIn: LeafMultiplicity, innerIn: LeafMultiplicity): LeafMultiplicity {
	// `'single'` is the canonical required-one value (rule.ts `Multiplicity`);
	// a missing multiplicity defaults to it (null-coalesce). The lattice then
	// operates in `'single'` terms: `optional` trumps single
	// (`combine(optional, single) → optional`), and `guaranteesOne('single')`
	// is true (`combine(nonEmptyArray, single) → nonEmptyArray`, not `array`).
	const outer = outerIn ?? 'single';
	const inner = innerIn ?? 'single';
	const isCollection = (m: LeafMultiplicity): boolean => m === 'array' || m === 'nonEmptyArray';
	const guaranteesOne = (m: LeafMultiplicity): boolean => m === 'single' || m === 'nonEmptyArray';
	if (isCollection(outer) || isCollection(inner)) {
		return guaranteesOne(outer) && guaranteesOne(inner) ? 'nonEmptyArray' : 'array';
	}
	// Neither side is a collection.
	if (outer === 'optional' || inner === 'optional') return 'optional';
	// Both are 'single' → required-one / default. Return `undefined` rather
	// than the explicit string so callers that only stamp non-default values
	// don't write a spurious `multiplicity: 'single'` onto clean nodes (codex P1).
	return undefined;
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
 *
 * Moved from template-walker.ts (origin: template-walker.ts:65).
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
		case REPEAT:
		case REPEAT1:
			if (rule[flag]) return true;
			return findRepeatFlag(rule.content, flag);
		case SEQ:
		case CHOICE:
			return rule.members.some((m) => findRepeatFlag(m, flag));
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		case FIELD:
			return findRepeatFlag(rule.content, flag);
		default:
			return false;
	}
}

/**
 * Unwrap structural wrappers around a repeat / repeat1 so the caller
 * can detect `optional(repeat(...))`, `group(repeat1(...))`, etc.
 * Returns `null` for anything that isn't ultimately a repeat shape.
 *
 * Moved from simplify.ts (origin: simplify.ts:1164).
 */
export function extractRepeatShape(rule: Rule): { repeat: RepeatRule | Repeat1Rule; nonEmpty: boolean } | null {
	switch (rule.type) {
		case REPEAT:
			return { repeat: rule, nonEmpty: false };
		case REPEAT1:
			return { repeat: rule, nonEmpty: true };
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return extractRepeatShape((rule as { content: Rule }).content);
		default:
			return null;
	}
}

/**
 * Stamp `multiplicity` / `separator` / `fieldName` onto the slot-bearing
 * leaves of a (wrapper-free) rule body. Structural nodes are descended;
 * leaves are stamped. An existing array / nonEmptyArray multiplicity on a
 * leaf is preserved (it is already at least as multi as the pushed value).
 * `fieldName` is only applied to a leaf that has no field name yet.
 *
 * Moved from simplify.ts (origin: simplify.ts:1101). Was file-local; now exported.
 */
export function pushAttrsToLeaves(
	rule: Rule,
	multiplicity: 'optional' | 'array' | 'nonEmptyArray' | undefined,
	separator: unknown,
	fieldName: string | undefined
): Rule {
	const recurse = (r: Rule): Rule => pushAttrsToLeaves(r, multiplicity, separator, fieldName);
	switch (rule.type) {
		case SEQ:
			// A seq is flattened into its parent by `canonicalizeSeqOfLeaves`, so
			// a seq-level multiplicity would be lost. Push into members instead.
			return { ...rule, members: (rule as { members: Rule[] }).members.map(recurse) } as Rule;
		case CHOICE: {
			// A choice at a seq position is a SINGLE slot boundary (the field
			// walker unions its arms into one slot). `deriveSlotsRaw`'s choice
			// case reads multiplicity from the choice NODE (effectiveMultiplicity),
			// then overrides each arm value with it — so stamp the node itself.
			// The node survives flattening (only seqs flatten), so leaf-level
			// stamping of the arms is unnecessary here.
			const cur = (rule as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
			const nextMult = combineMultiplicity(multiplicity, cur);
			const patch: Record<string, unknown> = {};
			if (nextMult !== undefined) patch['multiplicity'] = nextMult;
			if (separator !== undefined) patch['separator'] = separator;
			// Propagate the pushed-down fieldName onto the choice NODE too (the
			// leaf case does this; the choice case forgot). A choice is the slot
			// boundary, so without this an inlined `field('body', _suite)` whose
			// `_suite` is a choice loses the `body` name → buildSlot falls back to
			// an arbitrary arm kind (`block`). See python `function_definition.body`.
			if (fieldName !== undefined && (rule as { fieldName?: string }).fieldName === undefined) {
				patch['fieldName'] = fieldName;
			}
			return { ...rule, ...patch } as Rule;
		}
		case GROUP:
		case VARIANT:
		case TOKEN:
		case ALIAS:
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
			return { ...rule, content: recurse((rule as { content: Rule }).content) } as Rule;
		default: {
			// Leaf: symbol / string / pattern / terminal / enum / supertype / etc.
			const cur = (rule as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
			const nextMult = combineMultiplicity(multiplicity, cur);
			const patch: Record<string, unknown> = {};
			if (nextMult !== undefined) patch['multiplicity'] = nextMult;
			if (separator !== undefined) patch['separator'] = separator;
			if (fieldName !== undefined && (rule as { fieldName?: string }).fieldName === undefined) {
				patch['fieldName'] = fieldName;
			}
			return { ...rule, ...patch } as Rule;
		}
	}
}
