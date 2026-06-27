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

import { CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, STRING, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RenderRule, SimplifiedRule, ChoiceRule, SeqRule, OptionalRule, RepeatRule, Repeat1Rule, GroupRule, VariantRule, FieldRule } from '../types/rule.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { deleteWrapper } from './wrapper-deletion.ts';
import { withAttrsFrom, combineMultiplicity, type LeafMultiplicity } from '../dsl/rule-attrs.ts';
import { diagnoseSlotGrouping, type SlotGroupingDiagnostic } from './diagnose-slot-grouping.ts';
import type { SimplifyCtx } from '../dsl/rule-transforms.ts';
import { inlineRefs, canonicalizeSeqOfLeaves, type InlineRefsCtx } from '../dsl/rule-transforms.ts';
// `extractRepeatShape` and `pushAttrsToLeaves` moved to transforms.ts (PR-O M1 de-scatter).
// Moved functions — imported from their new home in rule-transforms.ts.
import {
	fuseHeadRepeatLists,
	isEmptyMatchMember,
	isSlotPromotedLiteral,
	hoistFieldOutOfSingleContentWrapper,
	hoistInnerFieldOutOfFieldWrapper,
	hoistSharedFieldAcrossChoiceBranches,
	mergeChoiceBranches,
	rulesStructurallyEqual,
	assertUniversalShapeRule,
} from '../dsl/rule-transforms.ts';

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
 * Minimal `SimplifyCtx` for the public boundary when no ctx is supplied (e.g.
 * direct `simplifyRule(rule)` calls in tests). The per-rule-type handlers take a
 * concrete `ctx: SimplifyCtx`; this normalizes once so they never see `undefined`.
 */
function makeDefaultCtx(): SimplifyCtx {
	return { rules: {}, inlineKinds: new Set(), diagnostics: new DiagnosticSink() };
}

/**
 * Dispatch a rule to its per-type simplify handler. Thin switch over the Rule
 * union. The public entry keeps `ctx?` optional (normalized via `makeDefaultCtx`)
 * so direct callers needn't build a ctx; each handler takes `(rule: <Type>Rule,
 * ctx: SimplifyCtx)`. `inField` rides on `ctx` (see `SimplifyCtx.inField`).
 */
export function simplifyRule(rule: Rule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	switch (rule.type) {
		case SEQ:
			return simplifySeqRule(rule, ctx);
		case CHOICE:
			return simplifyChoiceRule(rule, ctx);
		case OPTIONAL:
			return simplifyOptionalRule(rule, ctx);
		case REPEAT:
		case REPEAT1:
			return simplifyRepeatRule(rule, ctx);
		case FIELD:
			return simplifyFieldRule(rule, ctx);
		case GROUP:
			return simplifyGroupRule(rule, ctx);
		case VARIANT:
			return simplifyVariantRule(rule, ctx);
		default:
			return rule;
	}
}

/**
 * CHOICE: fold an empty-match member (`pattern("")`, empty seq) into `optional`;
 * collapse a single member; fuse same-named fields across structurally-equivalent
 * branches (`mergeChoiceBranches`), then hoist a field shared by every branch out
 * to an enclosing seq. Variant wrappers are preserved for polymorph detection.
 */
function simplifyChoiceRule(rule: ChoiceRule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	const members = rule.members.map((m) => simplifyRule(m, ctx));
	const empty = members.findIndex(isEmptyMatchMember);
	if (empty >= 0 && members.length > 1) {
		const nonEmpty = members.filter((_, i) => i !== empty);
		const inner: Rule = nonEmpty.length === 1 ? nonEmpty[0]! : withAttrsFrom(rule, { type: CHOICE, members: nonEmpty });
		return simplifyRule(withAttrsFrom(rule, { type: OPTIONAL, content: inner }), ctx);
	}
	if (members.length === 1) return withAttrsFrom(rule, members[0]!);
	const merged = mergeChoiceBranches({ type: CHOICE, members });
	if (merged.type !== CHOICE) return withAttrsFrom(rule, merged);
	return withAttrsFrom(rule, hoistSharedFieldAcrossChoiceBranches(merged));
}

/**
 * OPTIONAL: recurse; fold to empty-seq when the body vanished. Inside a field
 * (`ctx.inField`), a bare anonymous string is structural content and survives;
 * outside, it's a strippable delimiter. Then hoist field out of the wrapper.
 */
function simplifyOptionalRule(rule: OptionalRule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	const inner = simplifyRule(rule.content, ctx);
	if (inner.type === SEQ && inner.members.length === 0) {
		return { type: SEQ, members: [] };
	}
	if (!ctx.inField && inner.type === STRING && !isSlotPromotedLiteral(inner)) {
		return { type: SEQ, members: [] };
	}
	return hoistFieldOutOfSingleContentWrapper({ type: OPTIONAL, content: inner });
}

/** REPEAT / REPEAT1: recurse; hoist field out of the single-content wrapper. */
function simplifyRepeatRule(rule: RepeatRule | Repeat1Rule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	const next = { ...rule, content: simplifyRule(rule.content, ctx) };
	return hoistFieldOutOfSingleContentWrapper(next);
}

/** FIELD: recurse with `inField:true` (so `optional(anon-string)` survives), then hoist inner field out. */
function simplifyFieldRule(rule: FieldRule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	const recursed: Rule = { ...rule, content: simplifyRule(rule.content, { ...ctx, inField: true }) };
	return hoistInnerFieldOutOfFieldWrapper(recursed);
}

/** GROUP: recurse into content (structural wrapper preserved). */
function simplifyGroupRule(rule: GroupRule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	return { ...rule, content: simplifyRule(rule.content, ctx) };
}

/** VARIANT: recurse into content (polymorph surface preserved). */
function simplifyVariantRule(rule: VariantRule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	return { ...rule, content: simplifyRule(rule.content, ctx) };
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
function simplifySeqRule(rule: SeqRule, ctx: SimplifyCtx = makeDefaultCtx()): Rule {
	const members = rule.members
		.map((m) => simplifyRule(m, ctx))
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
