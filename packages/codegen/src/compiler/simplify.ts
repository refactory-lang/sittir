/**
 * compiler/simplify.ts — the derivation-only (SimplifiedRule) view of a rule
 * tree, consumed by slot derivation. Strips anonymous token delimiters,
 * collapses single-member wrappers, inlines parser-inlined helpers, and
 * canonicalizes toward the universal seq-of-leaves shape. Template emission
 * keeps reading the RAW rule (literals must still surface as template text).
 *
 * A string member is "anonymous" (stripped) iff it is NOT slot-promoted — see
 * `isSlotPromotedLiteral`; slot-valued keyword markers survive. Runs as the
 * final stage of `optimize()`, producing `simplifiedRules` on OptimizedGrammar.
 * Per-function rationale: docs/compiler-phase-glossary.md (Phase 3.5: Simplify).
 */

import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RenderRule, SimplifiedRule, ChoiceRule, SeqRule, FieldRule } from '../types/rule.ts';
import type { AssembledNode } from './model/node-map.ts';
import { deleteWrapper } from './wrapper-deletion.ts';
import { withAttrsFrom, combineMultiplicity, sharedArmAttrs, type LeafMultiplicity } from '../dsl/rule-attrs.ts';
import { diagnoseSlotGrouping, type SlotGroupingDiagnostic } from './diagnose-slot-grouping.ts';
import type { SimplifyCtx } from '../dsl/rule-transforms.ts';
import { inlineRefs, canonicalizeSeqOfLeaves, isLeaf, recurseChildren, type InlineRefsCtx } from '../dsl/rule-transforms.ts';
// `extractRepeatShape` and `pushAttrsToLeaves` moved to transforms.ts (PR-O M1 de-scatter).
// Re-export extractRepeatShape for assemble.ts which imports it from this module.
import { extractRepeatShape, pushAttrsToLeaves } from '../dsl/rule-transforms.ts';
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

export { extractRepeatShape } from '../dsl/rule-transforms.ts';

// ---------------------------------------------------------------------------
// Slot-grouping diagnostic accumulator (propose-promotion only).
//
// `computeSimplifiedRules` is invoked multiple times per grammar (main rules,
// alias bodies, polymorph forms — see optimize.ts), so records are deduped by
// (ownerKind, shape) as they accumulate, and the whole accumulator is reset
// once per `optimize()` run via `resetSlotGroupingDiagnostics()`. That keeps
// `drain` honest (one run's unique records) and bounds memory in long-lived
// processes. They NEVER drive codegen behavior (feedback_metadata_not_behavior).
// ---------------------------------------------------------------------------

const _slotGroupingDiagnostics: SlotGroupingDiagnostic[] = [];
const _slotGroupingSeen = new Set<string>();

const slotGroupingKey = (rec: SlotGroupingDiagnostic): string => `${rec.ownerKind} ${rec.code}`;

/**
 * Push a record if its (ownerKind, shape) hasn't been seen this run. Returns
 * true when newly added (so the caller can log only first occurrences).
 */
function recordSlotGroupingDiagnostic(rec: SlotGroupingDiagnostic): boolean {
	const key = slotGroupingKey(rec);
	if (_slotGroupingSeen.has(key)) return false;
	_slotGroupingSeen.add(key);
	_slotGroupingDiagnostics.push(rec);
	return true;
}

/**
 * Clear the accumulator. Called once at the start of each `optimize()` run so
 * diagnostics from one grammar never leak into the next (the multiple
 * `computeSimplifiedRules` calls within a run still accumulate into one batch).
 */
export function resetSlotGroupingDiagnostics(): void {
	_slotGroupingDiagnostics.length = 0;
	_slotGroupingSeen.clear();
}

/**
 * Return + clear the slot-grouping diagnostics accumulated during the current
 * `optimize()` run. The codegen CLI calls this after regen to print
 * propose-promotion suggestions; tests call it to verify the wiring.
 */
export function drainSlotGroupingDiagnostics(): SlotGroupingDiagnostic[] {
	const out = [..._slotGroupingDiagnostics];
	resetSlotGroupingDiagnostics();
	return out;
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
function isEmptyMatchMember(rule: Rule): boolean {
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
function isSlotPromotedLiteral(rule: Rule): boolean {
	return (rule as { nonterminal?: boolean }).nonterminal === true;
}

export function simplifyRule(rule: Rule, ctx?: SimplifyCtx, inField: boolean = false): Rule {
	switch (rule.type) {
		case SEQ:
			return collapseSeq(rule, ctx, inField);
		case CHOICE: {
			// Variant wrappers preserved for polymorph surface detection.
			const members = rule.members.map((m) => simplifyRule(m, ctx, inField));
			// Fold empty-match members (pattern(""), empty seq) into optional.
			const empty = members.findIndex(isEmptyMatchMember);
			if (empty >= 0 && members.length > 1) {
				const nonEmpty = members.filter((_, i) => i !== empty);
				const inner: Rule = nonEmpty.length === 1 ? nonEmpty[0]! : withAttrsFrom(rule, { type: CHOICE, members: nonEmpty });
				return simplifyRule(withAttrsFrom(rule, { type: OPTIONAL, content: inner }), ctx, inField);
			}
			if (members.length === 1) return withAttrsFrom(rule, members[0]!);
			// Fuse same-named fields across structurally-equivalent branches, then
			// hoist a field shared by every branch out to an enclosing seq.
			const merged = mergeChoiceBranches({ type: CHOICE, members });
			if (merged.type !== CHOICE) return withAttrsFrom(rule, merged);
			return withAttrsFrom(rule, hoistSharedFieldAcrossChoiceBranches(merged));
		}
		case OPTIONAL: {
			const inner = simplifyRule(rule.content, ctx, inField);
			// Fold to empty-seq when body vanished. Exception: inside
			// a field, anonymous strings are structural content.
			if (inner.type === SEQ && inner.members.length === 0) {
				return { type: SEQ, members: [] };
			}
			if (!inField && inner.type === STRING && !isSlotPromotedLiteral(inner)) {
				return { type: SEQ, members: [] };
			}
			return hoistFieldOutOfSingleContentWrapper({
				type: OPTIONAL,
				content: inner
			});
		}
		case REPEAT: {
			const next = {
				...rule,
				content: simplifyRule(rule.content, ctx, inField)
			};
			return hoistFieldOutOfSingleContentWrapper(next);
		}
		case REPEAT1: {
			const next = {
				...rule,
				content: simplifyRule(rule.content, ctx, inField)
			};
			return hoistFieldOutOfSingleContentWrapper(next);
		}
		case FIELD: {
			// Recurse with inField=true so optional(anon-string) survives.
			const recursed: Rule = {
				...rule,
				content: simplifyRule(rule.content, ctx, true)
			};
			return hoistInnerFieldOutOfFieldWrapper(recursed);
		}
		case GROUP:
			return {
				...rule,
				content: simplifyRule(rule.content, ctx, inField)
			};
		case VARIANT:
			return {
				...rule,
				content: simplifyRule(rule.content, ctx, inField)
			};
		default:
			return rule;
	}
}

/** Simplify every rule in the map, each run to fixpoint (see `normalizeToFixpoint`). */
export function simplifyRules(rules: Record<string, Rule>, ctx?: SimplifyCtx): Record<string, Rule> {
	const out: Record<string, Rule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		out[name] = normalizeToFixpoint(rule, ctx, rules);
	}
	return out;
}

/**
 * Compute the derivation-only simplified view of every rule in the map.
 *
 * Relocated from optimize.ts as part of PR1 — all simplification logic lives
 * in simplify.ts. Input type widened to RenderRule: applyWrapperDeletion in
 * optimize.ts produces a wrapper-less map, and simplify operates on that.
 *
 * @param renderRules - Wrapper-less rule map (output of applyWrapperDeletion).
 * @returns A new map containing the simplified form of each rule.
 */
export function computeSimplifiedRules(
	renderRules: Record<string, RenderRule>,
	ctx?: SimplifyCtx
): Record<string, SimplifiedRule> {
	const inlineKinds = ctx?.inlineKinds ?? new Set<string>();
	const polymorphSkipExtra = ctx?.polymorphSkipExtra ?? new Set<string>();
	const simplified = simplifyRules(renderRules as Record<string, Rule>, ctx);
	const canonicalized: Record<string, SimplifiedRule> = {};
	for (const [kind, rule] of Object.entries(simplified)) {
		// Final wrapper-free pass: simplify's hoists + choice-folding can
		// re-introduce wrapper nodes, so deleteWrapper pushes them back to leaf
		// attrs (SimplifiedRule = wrapper-free; idempotent on wrapper-free input).
		// Re-fuse head+repeat list pairs too — inlineRefs can splice a helper body
		// and re-expose a non-adjacent head-single + tail-array of the same element.
		const wrapperFree = fuseHeadRepeatLists(
			deleteWrapper(canonicalizeSeqOfLeaves(rule) as Rule) as Rule
		) as SimplifiedRule;
		canonicalized[kind] = wrapperFree;
	}
	// Gate universal-shape assertion behind an env var so we can ramp
	// without breaking existing kinds that still violate the invariant.
	// Tasks 3.B-derive-rewrite / 3.B3 / 3.B4 enable it for testing;
	// Task 3.B6 flips the default once all kinds pass.
	if (process.env['SITTIR_ASSERT_UNIVERSAL_SHAPE'] === '1') {
		for (const [kind, rule] of Object.entries(canonicalized)) {
			assertUniversalShapeRule(rule, kind);
		}
	}

	// Slot-grouping diagnostic: propose-promotion only. Records never drive
	// codegen behavior (feedback_metadata_not_behavior) — they surface for the
	// author via the derivation log and regen console output.
	// Pass inlineKinds so auto-group helpers (_*_repeat1/_*_optional1) are
	// treated as slot-position bodies (they represent seq content of inlined
	// repeats), while normal branch kinds are silent at the top level.
	const slotDiagnostics = diagnoseSlotGrouping(canonicalized, inlineKinds, polymorphSkipExtra);
	for (const rec of slotDiagnostics) {
		// Dedup by (ownerKind, shape) across the multiple computeSimplifiedRules
		// calls per run (and any repeated hits within one walk); log only the
		// first occurrence.
		const isNew = recordSlotGroupingDiagnostic(rec);
		// Also emit into ctx.diagnostics so the DiagnosticSink (PR-G) carries them.
		// Only new (first-seen) records are emitted to avoid double-counting the
		// module-level dedup's effect on the sink.
		if (isNew && ctx?.diagnostics) {
			ctx.diagnostics.info({
				code: rec.code,
				message: rec.message,
				canProceed: true,
				proposal: rec.proposal,
			});
		}
	}

	return canonicalized;
}

/**
 * Run `inlineRefs` + `simplifyRule` to fixpoint. The two passes enable each
 * other (an inline can expose a nested seq for simplifyRule to flatten, a
 * stripped branch can let a sibling choice merge), and each is non-increasing on
 * structural size (member count / nesting depth), so the loop converges — real
 * grammars in 2-3 iters; the 16-iter cap guards a non-converging shape.
 */
function normalizeToFixpoint(
	rule: Rule,
	ctx: SimplifyCtx | undefined,
	rules: Readonly<Record<string, Rule>>
): Rule {
	const ictx: InlineRefsCtx = { rules, inlineKinds: ctx?.inlineKinds };
	const MAX_ITERS = 16;
	let current = rule;
	for (let i = 0; i < MAX_ITERS; i++) {
		const next = simplifyRule(inlineRefs(current, ictx), ctx);
		if (rulesStructurallyEqual(current, next)) return next;
		current = next;
	}
	console.warn(
		`[simplify] normalizeToFixpoint: ${MAX_ITERS} iterations reached without convergence — returning last iteration`
	);
	return current;
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
function rulesStructurallyEqual(a: Rule, b: Rule): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Canonicalization — merges structurally-equivalent choice
// branches so same-named fields fuse into field(name, choice(v1, v2, ...)).
// Bottom-up, idempotent. See compiler-phase-glossary.md for details.
// ---------------------------------------------------------------------------
/** `repeat(field('n', X))` → `field('n', repeat(X))` (non-lossy; keeps fields directly under seq, separator/trailing/leading preserved on the repeat). */
function hoistFieldOutOfSingleContentWrapper(rule: Rule): Rule {
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
function hoistSharedFieldAcrossChoiceBranches(rule: ChoiceRule): Rule {
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
	const hoistedField: Rule = {
		...hoistedFieldTemplate!,
		content: unionedContent
	};
	const hasEmptyResidual = residuals.some((r) => r.type === SEQ && r.members.length === 0);
	const nonEmptyResiduals = residuals.filter((r) => !(r.type === SEQ && r.members.length === 0));
	if (nonEmptyResiduals.length === 0) return hoistedField;
	const residualCore: Rule =
		nonEmptyResiduals.length === 1 ? nonEmptyResiduals[0]! : { type: 'choice', members: nonEmptyResiduals };
	const residualPart: Rule = hasEmptyResidual ? { type: 'optional', content: residualCore } : residualCore;
	return { type: SEQ, members: [hoistedField, residualPart] };
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
function mergeChoiceBranches(rule: ChoiceRule): Rule {
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
 * - Fields: same name, possibly different content → `field(name,
 *   choice(content1, content2, …))`. Deduplicate equal contents.
 * - Symbols / supertypes / strings: return the first — all are
 *   identical by the mergeability check.
 */
function mergePosition(position: readonly Rule[]): Rule {
	const first = position[0]!;
	if (first.type === FIELD) {
		const fields = position.filter((p): p is FieldRule => p.type === FIELD);
		const contents = dedupeByJson(fields.map((f) => f.content));
		const mergedContent: Rule = contents.length === 1 ? contents[0]! : { type: 'choice', members: contents };
		return { ...first, content: mergedContent };
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

// compileWordMatcher moved to ./common.ts (shared by assemble, optimize, emitters).

// ---------------------------------------------------------------------------
// Template-side hoist — inner-field hoist WITHOUT stripping anonymous
// delimiters. Templates need literals to survive; only outer field
// wrappers with inner fields at exposable depth are dropped.
// ---------------------------------------------------------------------------

/**
 * Bottom-up inner-field hoist for template emission. Preserves all
 * literals and structure; only drops outer field wrappers with exposable
 * inner fields. Idempotent.
 */
export function hoistInnerFieldsForTemplate(rule: Rule): Rule {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map(hoistInnerFieldsForTemplate)
			};
		case CHOICE:
			return {
				...rule,
				members: rule.members.map(hoistInnerFieldsForTemplate)
			};
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case VARIANT:
		case TOKEN:
			return {
				...rule,
				content: hoistInnerFieldsForTemplate((rule as { content: Rule }).content)
			} as Rule;
		case FIELD: {
			const recursed: Rule = {
				...rule,
				content: hoistInnerFieldsForTemplate(rule.content)
			};
			return hoistInnerFieldOutOfFieldWrapper(recursed);
		}
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// Hidden group / multi inlining (moved from assemble.ts to participate in
// the simplify fixpoint).
// ---------------------------------------------------------------------------

/**
 * Collapse a `seq`, carrying the seq node's slot attrs onto the survivor when
 * the node is discarded (`seq(x) → x` / multi-member flatten) — else
 * multiplicity/separator/fieldName are lost. `multiplicity` COMBINES via the
 * lattice (survivor `optional` + seq `array` → `array`); the rest ride along
 * absent-only (`withAttrsFrom`). See glossary (Phase 3.5).
 */
function collapseSeq(rule: SeqRule, ctx?: SimplifyCtx, inField: boolean = false): Rule {
	const members = rule.members
		.map((m) => simplifyRule(m, ctx, inField))
		.filter((m) => {
			// Strip bare string delimiters (not slot-promoted) + empty-seq sentinels.
			if (m.type === STRING && !isSlotPromotedLiteral(m)) return false;
			if (m.type === SEQ && m.members.length === 0) return false;
			return true;
		})
		.flatMap((m) => {
			if (m.type !== SEQ) return [m];
			// Keep a nested seq that carries its OWN cardinality as one member:
			// splicing would lose that cardinality and hoist an inner choice to
			// the parent's seq position (a non-canonical choice-at-seq). A bare
			// seq (no own attrs) is spliced/flattened.
			const sm = m as SeqRule & { multiplicity?: LeafMultiplicity; separator?: unknown; fieldName?: string };
			if (sm.multiplicity !== undefined || sm.separator !== undefined || sm.fieldName !== undefined) {
				return [m];
			}
			return sm.members;
		});
	if (members.length === 0) return withAttrsFrom(rule, { type: SEQ, members: [] });
	if (members.length === 1) {
		const survivor = members[0]!;
		const carried = withAttrsFrom(rule, survivor);
		const combined = combineMultiplicity(
			(rule as { multiplicity?: LeafMultiplicity }).multiplicity,
			(survivor as { multiplicity?: LeafMultiplicity }).multiplicity
		);
		// Only stamp when non-default (single → undefined per combineMultiplicity).
		if (combined !== undefined) return { ...carried, multiplicity: combined } as Rule;
		return carried;
	}
	return withAttrsFrom(rule, { type: SEQ, members });
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
