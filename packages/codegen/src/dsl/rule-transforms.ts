/**
 * compiler/transforms.ts — shared, idempotent rule transforms (#13a) +
 * the phase-context base type (#14 / §7.7). The transform BODIES move in via
 * the copilot LSP pass (PR-H Task 5); this file is born holding only the ctx
 * contract so signatures across normalize/simplify can thread it.
 */
import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RepeatRule, Repeat1Rule, SymbolRule, SeqRule, ChoiceRule } from '../types/rule.ts';
import { withAttrsFrom } from './rule-attrs.ts';
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
export interface SimplifyCtx extends TransformCtx {
	/** Extra kinds the slot-grouping diagnostic skips (variant-resolved). */
	readonly polymorphSkipExtra?: ReadonlySet<string>;
	/**
	 * True while simplifying inside a `field(...)` wrapper. Threaded through the
	 * per-rule-type handlers (folded in from the former `inField` parameter):
	 * `simplifyFieldRule` recurses with `{ ...ctx, inField: true }`, and
	 * `simplifyOptionalRule` keeps `optional(anonymous-string)` when set (inside a
	 * field a bare string is structural content, not a strippable delimiter).
	 */
	readonly inField?: boolean;
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
