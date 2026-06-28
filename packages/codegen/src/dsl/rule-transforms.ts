/**
 * compiler/transforms.ts — shared, idempotent rule transforms (#13a) +
 * the phase-context base type (#14 / §7.7). The transform BODIES move in via
 * the copilot LSP pass (PR-H Task 5); this file is born holding only the ctx
 * contract so signatures across normalize/simplify can thread it.
 */
import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RepeatRule, Repeat1Rule, SeqRule, ChoiceRule, FieldRule } from '../types/rule.ts';
import { withAttrsFrom, sharedArmAttrs } from './rule-attrs.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';

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
 * Simplify carries the same phase-shared state as TransformCtx.
 *
 * Note: `inField` was removed. It was set by `simplifyFieldRule` (now deleted)
 * to signal that simplify was descending into a field wrapper's content, which
 * suppressed stripping of anonymous strings inside `optional()`. Since
 * `applyWrapperDeletion` converts all field() nodes to fieldName attributes
 * before simplify runs, no field-wrapper context exists in simplify's input —
 * so `inField` was never set in the production path and is now gone entirely.
 */
export interface SimplifyCtx extends TransformCtx {
	/** Extra kinds the slot-grouping diagnostic skips (variant-resolved). */
	readonly polymorphSkipExtra?: ReadonlySet<string>;
}

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


/**
 * Ctx for the shared `inlineRefs` op (R3 / PR-O M1 closure). Self-contained
 * so non-phase callers (assemble's alias-body path) can construct it without
 * a full TransformCtx.
 */
export interface InlineRefsCtx {
	readonly rules: Readonly<Record<string, Rule>>;
	readonly inlineKinds?: ReadonlySet<string>;
}

const EMPTY_INLINE_KINDS: ReadonlySet<string> = new Set();

/**
 * Inline hidden symbol references by substituting their content. Two inlining
 * paths are applied in priority order:
 *
 *  1. GROUP / MULTI path (existing): hidden group rules (seq-with-fields) and
 *     hidden multi helpers (repeat / repeat1 wrappers) are always inlined so
 *     the referrer's field walker sees the fields / multi-slot directly.
 *
 *  2. grammar.inline path (new): hidden symbol refs whose target appears in the
 *     grammar's `inline:` array are inlined unconditionally — these are
 *     helpers tree-sitter itself expands at parse time (e.g., auto-synthesized
 *     `_type_arguments_repeat1` from applyAutoGroups). Sittir's derivation
 *     view must match what tree-sitter produces: if the parser inlines a helper,
 *     the simplified rule must too. References with `source === 'group-lift'` are
 *     still inlined when `inlineKinds` contains the target — the group-lift guard
 *     only applies to the group/multi path (where the assemble-side AssembledGroup
 *     should materialise as its own node rather than being collapsed away).
 *
 * Cycle-safe via visited set.
 */
export function inlineRefs(rule: Rule, ctx: InlineRefsCtx, visited: ReadonlySet<string> = new Set()): Rule {
	const rules = ctx.rules;
	const inlineKinds = ctx.inlineKinds ?? EMPTY_INLINE_KINDS;
	const recurse = (r: Rule, v: ReadonlySet<string>): Rule => inlineRefs(r, ctx, v);
	switch (rule.type) {
		case SYMBOL: {
			// grammar.inline is the single source of truth for inlining. Any
			// symbol ref whose target is listed in `grammar.inline` is inlined
			// here — REGARDLESS of `source` (group-lift or not) or `hidden` —
			// because tree-sitter inlines exactly those kinds at parse time. If
			// sittir's derivation view doesn't match (i.e. it keeps a ref to a
			// kind the parser expands away), `deriveSlots` mints a slot for a
			// node that never materialises at runtime → singular-vs-multi and
			// non-canonical-shape mismatches. Matching the parser's inlining is
			// a correctness invariant.
			//
			// Resolution: group/multi targets inline their CONTENT (the seq /
			// repeat wrapper) so the referrer's walker sees the fields / multi
			// slot directly and no bare `group` rule leaks into simplified
			// output; every other target inlines its body verbatim.
			// `inlineKinds` here is the pre-filtered inline-DECISION set (built in
			// generate.ts): grammar.inline membership minus supertype / keyword /
			// token / pattern / enum modelTypes. So a plain membership test is the
			// gate — supertypes and lexeme leaves were already excluded upstream.
			if (inlineKinds.has(rule.name)) {
				if (visited.has(rule.name)) return rule;
				const target = rules[rule.name];
				if (!target) return rule;
				const next = new Set(visited);
				next.add(rule.name);
				const inlineTarget = resolveGroupOrMultiInlineTarget(target);
				const inlined = inlineRefs(inlineTarget ?? target, ctx, next);
				// Preserve the referring symbol's pushed-down leaf attributes
				// (multiplicity / separator / fieldName) onto the inlined body.
				// wrapper-deletion stamped e.g. `repeat1(SYMBOL(_x_repeat1))` down
				// to `SYMBOL{multiplicity:nonEmptyArray, separator}`; replacing the
				// symbol with the target body would otherwise DROP that
				// multiplicity, collapsing a multi slot to singular. Re-wrap the
				// inlined body in the equivalent modifier and re-run the
				// (idempotent) deleteWrapper to re-push the attributes onto the
				// inlined leaves.
				return reapplyInlinedLeafAttrs(rule, inlined);
			}

			// Not inline-listed. Inline EVERY hidden helper ref, mirroring what
			// tree-sitter does at parse time: a `_`-prefixed rule produces no CST
			// node — its children flatten into the parent. So the derivation view
			// must inline hidden refs regardless of multiplicity or provenance.
			//
			// Hiddenness is AUTHORITATIVE via isHiddenKind (the `_`-convention oracle
			// in evaluate.ts), NOT the non-authoritative stamped `hidden` flag nor the
			// `source:'group-lift'` provenance tag (the §15 cleanup). The inner seq of a
			// `repeat(seq(...))` still becomes a group for slot pairing, but an INLINE
			// group with no named CST kind — matching the flattened CST. (This replaces
			// the old repeat-seq BOUNDARY behavior, which materialised a helper kind the
			// parser never emits → field leaks + size cycles. See
			// project_repeat_seq_group_synthesis / project_pr2b_source_irreducible.)
			// Read the authoritative per-ref `inline` flag (hidden && !aliased &&
			// !supertype && !self-recursive) rather than re-deriving hiddenness — the
			// same oracle the templates emit path uses. The GROUP/MULTI shape gate
			// below still excludes non-foldable shapes.
			if (rule.inline !== true) return rule;
			if (visited.has(rule.name)) return rule;
			const target = rules[rule.name];
			if (!target) return rule;

			// GROUP / MULTI path: inline hidden group and multi helpers.
			const inlineTarget = resolveGroupOrMultiInlineTarget(target);
			if (!inlineTarget) return rule;
			const next = new Set(visited);
			next.add(rule.name);
			// Combine the referring symbol's pushed-down attributes (multiplicity /
			// separator / fieldName) with the inlined target — same as the
			// inline-listed path above. wrapper-deletion stamps e.g.
			// `optional(SYMBOL(_initializer))` to `SYMBOL{multiplicity:'optional'}`;
			// without this the optional is dropped on inline and the spliced leaf
			// (e.g. required_parameter's `value`) collapses to a required single.
			return reapplyInlinedLeafAttrs(rule, inlineRefs(inlineTarget, ctx, next));
		}
		case SEQ:
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) };
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) };
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return {
				...rule,
				content: recurse((rule as { content: Rule }).content, visited)
			} as Rule;
		default:
			return rule;
	}
}

/**
 * Return the rule to inline for a hidden symbol target, or `null` if the
 * target should not be inlined. Two target shapes are inlined:
 *  - Hidden GROUP rules (`target.type === 'group'`): inline the group's
 *    `content` (the seq-with-fields) so the referrer's field walker
 *    sees the fields directly.
 *  - Hidden MULTI helpers (body unwraps to a `repeat` / `repeat1`):
 *    inline the whole target rule so the wrapper survives and the
 *    walker marks the child slot as multi-valued.
 * All other hidden rules stay as-is — they are distinct structural
 * nodes or dispatch points.
 */
export function resolveGroupOrMultiInlineTarget(target: Rule): Rule | null {
	const isGroup = target.type === GROUP;
	const isMulti = extractRepeatShape(target) !== null;
	if (!isGroup && !isMulti) return null;
	return isGroup ? (target as { content: Rule }).content : target;
}

/**
 * Re-apply a referring symbol's pushed-down leaf attributes onto the body
 * that replaced it during inlining.
 *
 * wrapper-deletion collapses modifier wrappers onto the innermost leaf
 * (e.g. `repeat1(SYMBOL(_x_repeat1))` → `SYMBOL{multiplicity:'nonEmptyArray',
 * separator}`). When `inlineRefs` substitutes that symbol with its target
 * body, the attributes on the symbol would be lost — collapsing a
 * multi-valued slot to singular and dropping the separator. We reconstruct
 * the equivalent modifier wrapper around the inlined body and re-run the
 * idempotent `deleteWrapper`, which re-pushes the attributes onto the
 * inlined body's leaves using the same "outer wins" rule wrapper-deletion
 * applied originally.
 *
 * The attributes are pushed onto the inlined body's *leaves* (symbols /
 * fields / terminals), not onto an enclosing seq node. A seq-level
 * multiplicity would be lost when `canonicalizeSeqOfLeaves` flattens the
 * inlined seq into its parent; leaf-level multiplicity survives flattening
 * and is what `deriveSlots` reads. Stamping descends through structural
 * nodes (seq / choice / group / variant / clause / token / alias) and stops
 * at leaves, where it sets the multiplicity (a leaf that is already
 * multi-valued keeps its stronger array/nonEmptyArray) and separator.
 *
 * No-op when the referring symbol carries no non-default leaf attributes.
 */
function reapplyInlinedLeafAttrs(ref: Rule, inlined: Rule): Rule {
	const r = ref as {
		multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
		separator?: unknown;
		fieldName?: string;
	};
	if (r.multiplicity === undefined && r.separator === undefined && r.fieldName === undefined) {
		return inlined;
	}
	return pushAttrsToLeaves(inlined, r.multiplicity, r.separator, r.fieldName);
}

/**
 * Generic post-order child recursion for the `Rule` IR. Mirrors
 * `dsl/enrich.ts:recurseChildren` but tightened to the canonical typed
 * Rule shape (no string-typed legacy variants like 'TOKEN' / 'ALIAS' /
 * 'IMMEDIATE_TOKEN' — those don't appear post-evaluate).
 *
 * Identity-preserving: returns the input rule unchanged when no child
 * was rewritten (`visit` returned the same reference for every child).
 */
export function recurseChildren(rule: Rule, visit: (r: Rule) => Rule): Rule {
	switch (rule.type) {
		case SEQ:
		case CHOICE: {
			const members = rule.members;
			let changed = false;
			const next = members.map((m) => {
				const out = visit(m);
				if (out !== m) changed = true;
				return out;
			});
			return changed ? ({ ...rule, members: next } as Rule) : rule;
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS: {
			const content = (rule as { content: Rule }).content;
			const out = visit(content);
			return out === content ? rule : ({ ...rule, content: out } as Rule);
		}
		default:
			return rule;
	}
}

/**
 * Canonicalize a rule toward the universal seq-of-leaves shape:
 *   - Recursively canonicalize children.
 *   - Flatten degenerate single-member seqs (`seq([X])` → `X`).
 *
 * Does NOT perform attribute push-down — applyWrapperDeletion in optimize
 * already did that. Does NOT synthesize groups — applyAutoGroups (wire
 * phase) already did that.
 *
 * This is the final structural cleanup pass that absorbs the trivial
 * `seq([X])` → `X` shapes left behind by upstream transformations.
 * Idempotent — running it twice produces the same result as running once.
 */
export function canonicalizeSeqOfLeaves(rule: Rule): Rule {
	const recursed = recurseChildren(rule, canonicalizeSeqOfLeaves);
	if (recursed.type === SEQ && recursed.members.length === 1) {
		const survivor = recursed.members[0]!;
		const carried = withAttrsFrom(recursed, survivor);
		const outerMult = (recursed as { multiplicity?: LeafMultiplicity }).multiplicity;
		// Only combine multiplicities when the seq itself carries an explicit one;
		// otherwise withAttrsFrom already transferred it (absent-only) and we
		// must not stamp 'single' onto nodes that had no explicit multiplicity.
		if (outerMult !== undefined) {
			const combined = combineMultiplicity(
				outerMult,
				(survivor as { multiplicity?: LeafMultiplicity }).multiplicity,
			);
			// Only stamp when non-default (single → undefined per combineMultiplicity).
			if (combined !== undefined) return { ...carried, multiplicity: combined } as Rule;
		}
		return carried;
	}
	return recursed;
}

/**
 * Leaf classification: a rule that contributes a single slot value (or a
 * literal) with no further structural content underneath. Used by
 * `assertUniversalShape` to validate seq members.
 *
 * Leaves:
 *   - symbol, alias  — slot-refs (resolved post-Link)
 *   - string, pattern, enum — literal / terminal content
 *   - terminal, token  — text-only terminals
 *   - indent, dedent, newline — structural whitespace markers
 *
 * Non-leaves (must be lifted into hidden groups before the invariant
 * holds): seq, choice, optional, repeat, repeat1, field, variant, group,
 * clause, polymorph, supertype.
 */
export function isLeaf(rule: Rule): boolean {
	switch (rule.type) {
		case SYMBOL:
		case ALIAS:
		case STRING:
		case PATTERN:
		// PR-P: ENUM case removed — enum-shaped ChoiceRules are not leaves.
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule union.
		case TOKEN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		default:
			return false;
	}
}

// ---------------------------------------------------------------------------
// List-fusion pass — fuse a separated-list's head + repeat occurrences into
// a single multi-valued slot (moved from list-fusion.ts in R7 de-scatter).
//
// tree-sitter grammars author `sepBy1`/`commaSep1` lists in shapes that
// `liftCommaSep` (evaluate) does not always collapse — notably when a choice
// arm is an alias (`argument_list`) or the trailing separator lives in a
// choice (`pattern_list`). After wrapper-deletion those survive as a HEAD
// element (single) plus a REPEAT of the same element (array). Two idioms
// are recognized inside a `seq` (after recursing children):
//
//   A. adjacent `[E, E{array|nonEmptyArray, sep?}]` where the two elements are
//      structurally identical ignoring leaf attributes → fuse to the array E.
//   B. `[E, choice(sepString, E{array|nonEmptyArray, sep?})]` → fuse to the
//      array E, taking the choice's separator string as the trailing separator.
// ---------------------------------------------------------------------------
type Mult = 'optional' | 'array' | 'nonEmptyArray' | undefined;
const isArrayMult = (m: Mult): boolean => m === 'array' || m === 'nonEmptyArray';
/**
 * Structural identity of two slot-bearing rules ignoring leaf attributes
 * (multiplicity / separator / fieldName / aliasedFrom). Used to decide that a
 * head element and a repeat element are "the same list element".
 */
function sameSlotShape(a: Rule, b: Rule): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
        case SYMBOL:
            return a.name === (b as typeof a).name && a.aliasedFrom === (b as typeof a).aliasedFrom;
        case STRING:
        case PATTERN:
            return a.value === (b as typeof a).value;
        case CHOICE: {
            const bm = (b as typeof a).members;
            return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
        }
        case SEQ: {
            const bm = (b as typeof a).members;
            return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
        }
        // PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to default.
        default:
            return false;
    }
}
/**
 * If `head` + `next` form a head+repeat list pair, return the fused multi
 * element; otherwise `null`.
 */
function tryFusePair(head: Rule, next: Rule | undefined): Rule | null {
    if (!next) return null;
    const headMult = (head as { multiplicity?: Mult; }).multiplicity;
    if (isArrayMult(headMult)) return null; // head is already multi — not a head+repeat pair


    // Idiom A: [E, E{array}]
    const nextMult = (next as { multiplicity?: Mult; }).multiplicity;
    if (isArrayMult(nextMult) && sameSlotShape(head, next)) {
        return next; // the array element absorbs the single head occurrence
    }

    // Idiom B: [E, choice(sepString, E{array})]
    if (next.type === CHOICE && next.members.length === 2) {
        const sepArm = next.members.find((m) => m.type === 'string');
        const repArm = next.members.find(
            (m) => isArrayMult((m as { multiplicity?: Mult; }).multiplicity) && sameSlotShape(head, m)
        );
        if (sepArm && repArm) {
            const repSep = (repArm as { separator?: Rule['separator']; }).separator;
            if (repSep !== undefined) return repArm;
            // Fall back to the choice's separator-string arm, marking trailing.
            const sepStr = (sepArm as { value: string; }).value;
            return {
                ...repArm,
                separator: { rules: [{ type: 'string', value: sepStr }], trailing: true }
            } as Rule;
        }
    }

    return null;
}

/**
 * Fuse head+repeat separated-list pairs into a single multi slot, recursively.
 * Behaviour-preserving everywhere else — non-seq rules and seqs without the
 * head+repeat shape pass through unchanged (reference-identical when no fusion
 * applies).
 */

export function fuseHeadRepeatLists(rule: Rule): Rule {
    const recursed = recurseChildren(rule, fuseHeadRepeatLists);
    if (recursed.type !== SEQ) return recursed;
    const members = (recursed as SeqRule).members;
    const out: Rule[] = [];
    let changed = false;
    for (let i = 0; i < members.length; i++) {
        const fused = tryFusePair(members[i]!, members[i + 1]);
        if (fused) {
            out.push(fused);
            i++; // consume the repeat member too
            changed = true;
            continue;
        }
        out.push(members[i]!);
    }
    if (!changed) return recursed;
    return { ...recursed, members: out } as Rule;
}

/**
 * Test whether a choice member matches the empty string — the canonical
 * signal for "this branch contributes nothing" so the enclosing choice
 * can be simplified to `optional(non-empty-branches)`.
 *
 * @remarks
 * Fires on two shapes:
 *   - `pattern("")` — what evaluate surfaces for tree-sitter external
 *     tokens that have no syntactic content. Appears in `block_comment`
 *     as the `_block_comment_content` placeholder arm.
 *   - Empty seq — `{type: 'seq', members: []}`. simplifyRule produces
 *     this sentinel when an optional/bare-string collapses out; when it
 *     ends up as a choice branch, the same semantics apply.
 */
export function isEmptyMatchMember(rule: Rule): boolean {
	if (rule.type === PATTERN && rule.value === '') return true;
	if (rule.type === SEQ && rule.members.length === 0) return true;
	return false;
}

/**
 * Is this literal slot DATA (a value-marker like `static`/`crate`/`ref`) rather
 * than a bare render-only delimiter (`else`/`->`/`,`)? Slot data survives
 * simplify; bare delimiters are stripped.
 *
 * Keyed on `nonterminal` — the canonical slot-presence signal set by
 * `applyWrapperDeletion` (field/repeat/repeat1 force a slot on their content,
 * incl. terminals; a bare `optional(',')` does not). This matches collect-slots'
 * slot check; it became reliable once `enrichMultiplicityWrappers` was removed
 * (enrich no longer over-stamps `nonterminal` on bare optional delimiters).
 */
export function isSlotPromotedLiteral(rule: Rule): boolean {
	return (rule as { nonterminal?: boolean }).nonterminal === true;
}

// ---------------------------------------------------------------------------
// Canonicalization — merges structurally-equivalent choice
// branches so same-named fields fuse into field(name, choice(v1, v2, ...)).
// Bottom-up, idempotent. See compiler-phase-glossary.md for details.
// ---------------------------------------------------------------------------
/** `repeat(field('n', X))` → `field('n', repeat(X))` (non-lossy; keeps fields directly under seq, separator/trailing/leading preserved on the repeat). */
export function hoistFieldOutOfSingleContentWrapper(rule: Rule): Rule {
	if (rule.type !== OPTIONAL && rule.type !== REPEAT && rule.type !== REPEAT1) return rule;
	const inner = rule.content;
	if (inner.type !== 'field') return rule;
	const wrapper: Rule = { ...rule, content: inner.content };
	return { ...inner, content: wrapper };
}

/**
 * Drop an outer `field('outer', …)` wrapper when an inner `field()` sits at
 * exposable depth (tree-sitter flattens nested field paths, so the inner field
 * IS a top-level field of the parent). Bails on direct field nesting or a
 * named-symbol sibling that would lose its outer-field label.
 */
export function hoistInnerFieldOutOfFieldWrapper(rule: Rule): Rule {
	if (rule.type !== FIELD) return rule;
	const content = rule.content;
	if (content.type === 'field') return rule; // direct nesting handled elsewhere
	if (!hasInnerFieldAtExposableDepth(content)) return rule;
	// Bail if a named-symbol sibling would lose its outer-field label.
	if (hasNamedSiblingOfInnerField(content)) return rule;
	return content;
}

/**
 * Hoist guard: true when any seq inside `rule` mixes field() members
 * with named-symbol siblings. Dropping the outer field wrapper would
 * strip labels from those named siblings.
 */
function hasNamedSiblingOfInnerField(rule: Rule): boolean {
	switch (rule.type) {
		case SEQ: {
			const containsField = rule.members.some((m) => m.type === 'field');
			if (containsField) {
				for (const m of rule.members) {
					if (m.type === 'field') continue;
					if (isNamedReference(m)) return true;
				}
			}
			return rule.members.some(hasNamedSiblingOfInnerField);
		}
		case CHOICE:
			return rule.members.some(hasNamedSiblingOfInnerField);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case VARIANT:
			return hasNamedSiblingOfInnerField(rule.content);
		default:
			return false;
	}
}

/** True when `rule` is (or wraps) a symbol/supertype that tree-sitter would label. */
function isNamedReference(rule: Rule): boolean {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case VARIANT:
		case TOKEN:
			return isNamedReference(rule.content);
		default:
			return false;
	}
}

function hasInnerFieldAtExposableDepth(rule: Rule): boolean {
	switch (rule.type) {
		case FIELD:
			return true;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case VARIANT:
			return hasInnerFieldAtExposableDepth(rule.content);
		case SEQ:
		case CHOICE:
			return rule.members.some(hasInnerFieldAtExposableDepth);
		// symbol / supertype / enum / pattern / string / terminal /
		// token / polymorph / indent / dedent / newline / alias all
		// terminate the search — tree-sitter's field-flattening does
		// not cross these boundaries, so an inner field reached past
		// them is NOT a runtime top-level field of the containing kind.
		default:
			return false;
	}
}

/**
 * Lift a field name shared by every choice branch into an enclosing seq,
 * unioning field contents across branches. Residuals become optional choice.
 *
 * @remarks
 * Bails on variant-wrapped branches. Requires the shared field to appear
 * exactly once per branch. One field per iteration; fixpoint picks up more.
 */
export function hoistSharedFieldAcrossChoiceBranches(rule: ChoiceRule): Rule {
	if (rule.members.length < 2) return rule;
	if (rule.members.some((m) => m.type === VARIANT)) return rule;
	const perBranch = rule.members.map(normalizeBranchToMembers);
	const fieldNameCounts = perBranch.map(countFieldNames);
	const candidate = firstFieldNameSharedExactlyOncePerBranch(fieldNameCounts);
	if (candidate === null) return rule;
	return extractFieldAcrossBranches(perBranch, candidate);
}

/**
 * Expand a choice branch into a flat array of its top-level members.
 * A bare non-seq branch becomes a single-element array; a seq branch
 * is returned verbatim so subsequent passes can scan for field
 * occurrences.
 */
function normalizeBranchToMembers(branch: Rule): Rule[] {
	if (branch.type === SEQ) return branch.members;
	return [branch];
}

/**
 * Count occurrences of each field name in a branch's top-level
 * members. Nested fields (inside an inner optional / choice / seq)
 * aren't counted — they aren't directly hoistable without rewriting
 * the branch's structural frame.
 */
function countFieldNames(members: Rule[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const m of members) {
		if (m.type === FIELD) counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
	}
	return counts;
}

/**
 * Return the first field name that appears EXACTLY ONCE in every
 * branch's top-level members, or null if no such name exists.
 * Deterministic tie-break: the field order of the first branch.
 */
function firstFieldNameSharedExactlyOncePerBranch(perBranchCounts: Map<string, number>[]): string | null {
	if (perBranchCounts.length === 0) return null;
	const first = perBranchCounts[0]!;
	outer: for (const [name, count] of first) {
		if (count !== 1) continue;
		for (let i = 1; i < perBranchCounts.length; i++) {
			if (perBranchCounts[i]!.get(name) !== 1) continue outer;
		}
		return name;
	}
	return null;
}

/**
 * Extract `field(name, ...)` from each branch, union their contents
 * into a single hoisted field, and keep branch-specific residuals as
 * a side choice wrapped in optional when any branch has nothing left.
 */
function extractFieldAcrossBranches(perBranch: Rule[][], name: string): Rule {
	const hoistedContents: Rule[] = [];
	const residuals: Rule[] = [];
	let hoistedFieldTemplate: FieldRule | null = null;
	for (const members of perBranch) {
		const rest: Rule[] = [];
		let extracted: FieldRule | null = null;
		for (const m of members) {
			if (m.type === FIELD && m.name === name && extracted === null) {
				extracted = m;
				continue;
			}
			rest.push(m);
		}
		if (!extracted)
			return {
				type: CHOICE,
				members: perBranch.map((b) => (b.length === 1 ? b[0]! : { type: 'seq', members: b }))
			};
		hoistedFieldTemplate = hoistedFieldTemplate ?? extracted;
		hoistedContents.push(extracted.content);
		residuals.push(
			rest.length === 0 ? { type: 'seq', members: [] } : rest.length === 1 ? rest[0]! : { type: 'seq', members: rest }
		);
	}
	const unionedContent: Rule =
		hoistedContents.length === 1 ? hoistedContents[0]! : { type: 'choice', members: hoistedContents };
	// Push fieldName + nonterminal onto the content directly — same as what
	// deleteWrapper(field(name, X)) produces — so no FieldRule node is created.
	const hoisted: Rule = { ...unionedContent, fieldName: hoistedFieldTemplate!.name, nonterminal: true };
	const hasEmptyResidual = residuals.some((r) => r.type === SEQ && r.members.length === 0);
	const nonEmptyResiduals = residuals.filter((r) => !(r.type === SEQ && r.members.length === 0));
	if (nonEmptyResiduals.length === 0) return hoisted;
	const residualCore: Rule =
		nonEmptyResiduals.length === 1 ? nonEmptyResiduals[0]! : { type: 'choice', members: nonEmptyResiduals };
	const residualPart: Rule = hasEmptyResidual ? { type: 'optional', content: residualCore } : residualCore;
	return { type: SEQ, members: [hoisted, residualPart] };
}

/**
 * Lift a slot-shape attribute shared by EVERY choice arm onto the choice node
 * (the one slot boundary), so slot derivation doesn't read the bare node's
 * absent attr and fall back (`fieldName` → `content`). Only lifts attrs the node
 * doesn't already carry; arms keep theirs. Full rationale: glossary (Phase 3.5).
 */
function liftSharedArmAttrs(rule: ChoiceRule): Rule {
	// Hoist the UNANIMOUS arm attrs (shared by EVERY arm) onto the choice node,
	// but only those the choice doesn't already carry. Shares the arm-walk with
	// collect-slots via `sharedArmAttrs` — the single source for shared-arm facts.
	const shared = sharedArmAttrs(rule);
	let result: ChoiceRule = rule;
	if (result.fieldName === undefined && shared.fieldName !== undefined)
		result = { ...result, fieldName: shared.fieldName };
	if (result.multiplicity === undefined && shared.multiplicity !== undefined)
		result = { ...result, multiplicity: shared.multiplicity };
	if (result.nonterminal === undefined && shared.nonterminal !== undefined)
		result = { ...result, nonterminal: shared.nonterminal };
	if (result.separator === undefined && shared.separator !== undefined)
		result = { ...result, separator: shared.separator };
	return result;
}

/**
 * Merge a choice of structurally-equivalent branches into a flat seq with
 * per-position unioned field contents (`choice(seq(field('op','&&')), …)` →
 * `seq(field('op', choice('&&', …)))`). Bails (→ `liftSharedArmAttrs`) when
 * branches aren't same-length mergeable seqs; NEVER unwraps `variant()`
 * (intentional polymorph branches). See glossary (Phase 3.5).
 */
export function mergeChoiceBranches(rule: ChoiceRule): Rule {
	if (rule.members.length === 0) return rule;
	// variant() marks polymorph-distinct branches — bail, this is a polymorph surface.
	if (rule.members.some((m) => m.type === VARIANT)) return rule;
	const unwrapped = rule.members.map(unwrapForMerge); // group/clause only (structural)
	// All branches a bare field of the same name (post factorSeqChoice peeling a
	// shared prefix/suffix off a homogeneous-seq choice) → field(name, choice(contents)).
	if (unwrapped.every((b): b is FieldRule => b.type === FIELD)) {
		const first = unwrapped[0]!;
		if (unwrapped.every((f) => f.name === first.name)) {
			return mergePosition(unwrapped);
		}
	}
	// Every branch must be a seq of the same length. When the branches are
	// NOT mergeable seqs (e.g. a choice of leaf arms — the wrapper-free operator
	// case), still lift any attribute all arms share onto the choice node.
	if (!unwrapped.every((b): b is SeqRule => b.type === SEQ)) return liftSharedArmAttrs(rule);
	const len = unwrapped[0]!.members.length;
	if (!unwrapped.every((b) => b.members.length === len)) return liftSharedArmAttrs(rule);
	// Check position-by-position structural equivalence.
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((b) => b.members[i]!);
		if (!positionsAreMergeable(position)) return liftSharedArmAttrs(rule);
	}
	// All positions mergeable. Build the merged seq.
	const mergedMembers: Rule[] = [];
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((b) => b.members[i]!);
		mergedMembers.push(mergePosition(position));
	}
	if (mergedMembers.length === 0) return { type: SEQ, members: [] };
	if (mergedMembers.length === 1) return mergedMembers[0]!;
	return { type: SEQ, members: mergedMembers };
}

/**
 * Peel `group` wrappers to expose the seq inside.
 *
 * **Only sequences and groups are mergeable.** `variant` wrappers mark
 * intentional polymorph-distinct branches and must never be unwrapped
 * here (the caller bails before reaching us if any member is variant).
 * `clause` carries semantic identity too — leave as-is.
 */
function unwrapForMerge(rule: Rule): Rule {
	if (rule.type === GROUP) return unwrapForMerge(rule.content);
	return rule;
}

/**
 * Are these positions (one per branch, all at the same seq index)
 * structurally equivalent — same kind, same discriminator (field name /
 * symbol name)? If yes they can be merged by unioning contents. If no,
 * the enclosing choice is structurally heterogeneous and stays as-is.
 */
function positionsAreMergeable(position: readonly Rule[]): boolean {
	if (position.length === 0) return true;
	const first = position[0]!;
	if (first.type === FIELD) {
		return position.every((p) => p.type === FIELD && p.name === first.name);
	}
	if (first.type === SYMBOL) {
		return position.every((p) => p.type === SYMBOL && p.name === first.name);
	}
	if (first.type === SUPERTYPE) {
		return position.every((p) => p.type === SUPERTYPE && p.name === first.name);
	}
	if (first.type === STRING) {
		// Same literal at same position is fine. Different literals at
		// same position means the literal itself is the discriminator
		// — that's the "choice of literals" case (handled by
		// separator / enum detection; leave for now).
		return position.every((p) => p.type === STRING && p.value === first.value);
	}
	// Other kinds: structurally identical means equal by shape.
	// Conservative: require literal JSON equality.
	const firstJson = JSON.stringify(first);
	return position.every((p) => JSON.stringify(p) === firstJson);
}

/**
 * Merge N same-position rules (already verified as mergeable) into a
 * single canonical rule.
 *
 * - Fields: same name, possibly different content → push `fieldName`+`nonterminal`
 *   onto the unified content (instead of wrapping in a `field()` node), producing
 *   the same shape that `deleteWrapper(field(name, X))` yields. This keeps
 *   simplify field-node-free: no FieldRule is constructed here.
 * - Symbols / supertypes / strings: return the first — all are
 *   identical by the mergeability check.
 */
function mergePosition(position: readonly Rule[]): Rule {
	const first = position[0]!;
	if (first.type === FIELD) {
		const fields = position.filter((p): p is FieldRule => p.type === FIELD);
		const contents = dedupeByJson(fields.map((f) => f.content));
		const mergedContent: Rule = contents.length === 1 ? contents[0]! : { type: 'choice', members: contents };
		// Push fieldName + nonterminal onto the content directly — same as what
		// deleteWrapper(field(name, X)) produces — so no FieldRule node is created.
		return { ...mergedContent, fieldName: first.name, nonterminal: true };
	}
	return first;
}

/** Deduplicate rules by JSON equality, preserving first-seen order. */
function dedupeByJson(rules: readonly Rule[]): Rule[] {
	const seen = new Set<string>();
	const out: Rule[] = [];
	for (const r of rules) {
		const key = JSON.stringify(r);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(r);
	}
	return out;
}

/**
 * Structural Rule equality — compares all discriminant + content fields
 * recursively. Used by the simplify fixpoint loop to detect
 * convergence. JSON-stringify is deterministic enough for this: Rule
 * nodes are plain data (no Maps, Sets, or symbols), order of keys is
 * stable because we control their construction, and nested arrays /
 * objects are compared element-wise via stringify. Slightly wasteful
 * at O(n) per iteration, but n is small (a grammar's rules are in the
 * hundreds) and the loop runs once per codegen.
 */
export function rulesStructurallyEqual(a: Rule, b: Rule): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Universal-shape post-condition check (test-only).
//
// Invariant: every AssembledBranch / AssembledGroup body, after simplify, is a
// SeqRule of leaves (literals + slot-refs) — no nested structural rules with
// slot content. Established by applyWrapperDeletion → applyAutoGroups →
// inlineRefs → simplifyRules + canonicalizeSeqOfLeaves (see glossary, Phase 3 /
// 3.5). Wiring these asserts as a production fail-fast gate is DEFERRED (many
// kinds still violate); env-gated via SITTIR_ASSERT_UNIVERSAL_SHAPE.
// ---------------------------------------------------------------------------

/**
 * Test-only post-condition check (see section note). Throws with kind + offending
 * sub-rule type if a branch/group body isn't a seq-of-leaves (or a bare leaf);
 * no-ops for non-branch/group nodes (they have their own shape invariants).
 */
export function assertUniversalShape(node: AssembledNode): void {
	if (node.modelType !== 'branch' && node.modelType !== 'group') return;
	// Read the body from `simplifiedRule` — the public surface that branch
	// and group expose for downstream consumers. The protected `rule`
	// field is the raw pre-simplify shape; the invariant is about the
	// simplified form.
	const body = node.simplifiedRule;
	if (!body) return;
	if (body.type !== SEQ) {
		if (!isLeaf(body)) {
			throw new Error(
				`Universal-shape violation in kind '${node.kind}': body is not a seq of leaves; found ${body.type}`
			);
		}
		return;
	}
	for (const member of body.members) {
		if (!isLeaf(member)) {
			throw new Error(
				`Universal-shape violation in kind '${node.kind}': seq member is not a leaf; found ${member.type}`
			);
		}
	}
}

/**
 * Rule-level mirror of {@link assertUniversalShape}, operating on a Rule directly
 * so `computeSimplifiedRules` can fail-fast at the simplify boundary. Gated on
 * `SITTIR_ASSERT_UNIVERSAL_SHAPE=1` (not yet unconditional — many kinds still violate).
 */
export function assertUniversalShapeRule(rule: Rule, kind: string): void {
	if (rule.type !== SEQ) {
		if (!isLeaf(rule)) {
			throw new Error(
				`Universal-shape violation in kind '${kind}': body is not a seq of leaves; found ${rule.type}`
			);
		}
		return;
	}
	for (const member of rule.members) {
		if (!isLeaf(member)) {
			throw new Error(
				`Universal-shape violation in kind '${kind}': seq member is not a leaf; found ${member.type}`
			);
		}
	}
}
