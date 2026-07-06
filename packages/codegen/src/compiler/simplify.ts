/**
 * compiler/simplify.ts — the derivation-only (SimplifiedRule) view of a rule
 * tree, consumed by slot derivation. Strips anonymous token delimiters,
 * collapses single-member wrappers, inlines parser-inlined helpers, and
 * canonicalizes toward the universal seq-of-leaves shape. Template emission
 * keeps reading the RAW rule (literals must still surface as template text).
 *
 * A string member is "anonymous" (stripped) iff it is NOT slot-promoted — see
 * `isSlotPromotedLiteral`; slot-valued keyword markers survive. Runs as the
 * final stage of `normalizeGrammar()`, producing `SimplifiedGrammar.rules`.
 * Per-function rationale: docs/compiler-phase-glossary.md (Phase 3.5: Simplify).
 */

import { CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, RenderRule, SimplifiedRule, ChoiceRule, SeqRule, FieldRule } from '../types/rule.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { deleteWrapper } from './wrapper-deletion.ts';
import { withAttrsFrom, sharedArmAttrs } from '../dsl/rule-attrs.ts';
import { diagnoseSlotGrouping, type SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import type { RuleBuilder } from '../dsl/rule-transforms.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import type { NormalizedGrammar } from './types.ts';

/**
 * Simplify phase context (S2, `BaseCtx<'normalize'>` — Simplify READS
 * `Grammar<'normalize'>` = {@link NormalizedGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2): simplify
 * operates on the wrapper-free render view, so its `ctx.rules` holds
 * `Record<string, RenderRule>` (`NormalizedGrammar.rules` — the map being
 * simplified). Adds the inline-decision set and the variant-resolved
 * polymorph skip-set the slot-grouping diagnostic consults. (Was an
 * interface extending the dsl `TransformCtx`; now a compiler-layer class —
 * see compiler/ctx.ts.)
 */
export class SimplifyCtx extends BaseCtx<'normalize'> {
	readonly inlineKinds: ReadonlySet<string>;
	/** Extra kinds the slot-grouping diagnostic skips (variant-resolved). */
	readonly polymorphSkipExtra?: ReadonlySet<string>;
	constructor(init: BaseCtxInit<'normalize'> & { inlineKinds?: ReadonlySet<string>; polymorphSkipExtra?: ReadonlySet<string> }) {
		// Default builder to attributeBuilder — simplify's wrapper-free output is
		// realized by the attribute-push strategy. Callers may override via
		// init.builder; the construction sites read ctx.builder, never a direct ref.
		super({ ...init, builder: init.builder ?? attributeBuilder });
		this.inlineKinds = init.inlineKinds ?? new Set();
		this.polymorphSkipExtra = init.polymorphSkipExtra;
	}

	get rules(): Record<string, RenderRule> {
		return this.grammar.rules;
	}
}

/**
 * Build a minimal `Grammar<'normalize'>` (= {@link NormalizedGrammar}) from a
 * bare wrapper-deleted rules map, defaulting every other phase-invariant
 * field to an empty/absent value. For call sites (tests, `makeDefaultCtx`)
 * that only have a rules map in hand — not a full linked-grammar bundle —
 * and need a `SimplifyCtx` (S2: `SimplifyCtx` now requires a full
 * `Grammar<'normalize'>` container, not a bare `rules` field). `linkRules`
 * is left empty: these callers have no distinct mid-normalize link-phase
 * view to carry (only that of a real `normalizeGrammar()` run), and only
 * `simplify`'s own `ctx.rules` read (→ `grammar.rules`) is exercised by
 * `computeSimplifiedRules` — the carried `linkRules` view is consumed
 * downstream by assemble, not by simplify itself.
 */
export function makeNormalizedGrammar(rules: Record<string, RenderRule>): NormalizedGrammar {
	return {
		name: '',
		rules,
		linkRules: {},
		supertypes: new Set(),
		word: null,
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] }
	};
}
import { structuralBuilder, inlineRefs, recurseChildren, fuseHeadRepeatLists, combineMultiplicity, type InlineRefsCtx, type LeafMultiplicity } from '../dsl/rule-transforms.ts';
import type { AssembledNode } from './model/node-map.ts';

// ---------------------------------------------------------------------------
// attributeBuilder — compiler-side RuleBuilder that pushes attributes instead
// of constructing wrapper nodes, so simplify stays field/optional/repeat-free.
// ---------------------------------------------------------------------------

/**
 * Compiler-side `RuleBuilder` that converts wrapper-construction calls into
 * attribute pushes (via `deleteWrapper`), keeping simplify's output
 * field/optional/repeat/repeat1-node-free. Structural constructors (`seq` /
 * `choice`) delegate to the structural builder (same plain node literals).
 *
 * - `field(name, X)` → push `fieldName` + `nonterminal:true` onto X.
 * - `optional(X)` → empty-seq sentinel when X is already empty; strip bare
 *   anonymous delimiter string; otherwise `deleteWrapper(optional(X))` which
 *   pushes `multiplicity: 'optional'` onto the leaves.
 * - `repeat(X)` / `repeat1(X)` → `deleteWrapper({type:REPEAT|REPEAT1, content:X})`.
 * - `seq` / `choice` → plain structural nodes (same as structuralBuilder).
 */
export const attributeBuilder: RuleBuilder = {
	seq: (members) => ({ type: SEQ, members }),
	choice: (members) => ({ type: CHOICE, members }),
	optional: (content) => {
		// Mirror simplifyOptionalRule semantics (the handler this replaces):
		// empty-seq body → keep empty-seq; bare anonymous string → strip to empty-seq;
		// otherwise deleteWrapper pushes multiplicity:'optional' onto leaves.
		if (content.type === SEQ && content.members.length === 0) {
			return { type: SEQ, members: [] };
		}
		if (content.type === STRING && !isSlotPromotedLiteral(content)) {
			return { type: SEQ, members: [] };
		}
		return deleteWrapper({ type: OPTIONAL, content }) as RenderRule;
	},
	repeat: (content) => deleteWrapper({ type: REPEAT, content }) as RenderRule,
	repeat1: (content) => deleteWrapper({ type: REPEAT1, content }) as RenderRule,
	field: (name, content) => deleteWrapper({ type: FIELD, name, content }) as RenderRule,
};

// ---------------------------------------------------------------------------
// Simplify-only helpers (relocated from dsl/rule-transforms.ts).
// These are used exclusively by the simplify phase.
// ---------------------------------------------------------------------------

/**
 * Canonicalize a rule toward the universal seq-of-leaves shape:
 *   - Recursively canonicalize children.
 *   - Flatten degenerate single-member seqs (`seq([X])` → `X`).
 *
 * Does NOT perform attribute push-down — applyWrapperDeletion in normalize
 * already did that. Does NOT synthesize groups — applyAutoGroups (wire
 * phase) already did that.
 *
 * This is the final structural cleanup pass that absorbs the trivial
 * `seq([X])` → `X` shapes left behind by upstream transformations.
 * Idempotent — running it twice produces the same result as running once.
 *
 * Stays AnyRule-typed (phase-visibility-tightening finding): it delegates
 * recursion to `recurseChildren`, a genuinely phase-agnostic dsl utility that
 * still passes through wrapper nodes (FIELD/OPTIONAL/REPEAT/REPEAT1/TOKEN/
 * ALIAS) structurally — confirmed load-bearing by
 * `simplify-universal-shape.test.ts`'s "preserves leaf content inside
 * wrappers (does not push down attributes)" case, which feeds a FIELD-wrapped
 * rule directly and asserts the wrapper survives untouched. Every PRODUCTION
 * call (`computeSimplifiedRules`) passes RenderRule-shaped input (simplifyRule
 * already guarantees no wrapper nodes reach this point), but the function
 * itself is not restricted to that — narrowing the signature would make the
 * type dishonest in the other direction (claiming it can't handle a shape it
 * demonstrably does).
 */
export function canonicalizeSeqOfLeaves(rule: AnyRule): AnyRule {
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
			if (combined !== undefined) return { ...carried, multiplicity: combined } as AnyRule;
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
 * ALIAS/TOKEN cases deleted (phase-visibility-tightening): both are
 * WrapperPhase-only (types/rule.ts) and collapse to `never` under the
 * RenderRule/SimplifiedRule values this function actually receives (always
 * post-`applyWrapperDeletion`) — `default: false` already covers them.
 */
function isLeaf(rule: RenderRule): boolean {
	switch (rule.type) {
		case SYMBOL:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		default:
			return false;
	}
}

/**
 * Test whether a choice member matches the empty string — the canonical
 * signal for "this branch contributes nothing" so the enclosing choice
 * can be simplified to `optional(non-empty-branches)`.
 */
export function isEmptyMatchMember(rule: RenderRule): boolean {
	if (rule.type === PATTERN && rule.value === '') return true;
	if (rule.type === SEQ && rule.members.length === 0) return true;
	return false;
}

/**
 * Is this literal slot DATA (a value-marker like `static`/`crate`/`ref`) rather
 * than a bare render-only delimiter (`else`/`->`/`,`)? Slot data survives
 * simplify; bare delimiters are stripped.
 */
export function isSlotPromotedLiteral(rule: RenderRule): boolean {
	return (rule as { nonterminal?: boolean }).nonterminal === true;
}

/**
 * Hoist guard: true when any seq inside `rule` mixes field() members
 * with named-symbol siblings.
 */
function hasNamedSiblingOfInnerField(rule: AnyRule): boolean {
	switch (rule.type) {
		case SEQ: {
			const containsField = rule.members.some((m) => m.type === FIELD);
			if (containsField) {
				for (const m of rule.members) {
					if (m.type === FIELD) continue;
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
function isNamedReference(rule: AnyRule): boolean {
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

function hasInnerFieldAtExposableDepth(rule: AnyRule): boolean {
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
		default:
			return false;
	}
}

/**
 * Drop an outer `field('outer', …)` wrapper when an inner `field()` sits at
 * exposable depth (tree-sitter flattens nested field paths, so the inner field
 * IS a top-level field of the parent). Bails on direct field nesting or a
 * named-symbol sibling that would lose its outer-field label.
 *
 */
export function hoistInnerFieldFromWrapperForField(rule: AnyRule): AnyRule {
	if (rule.type !== FIELD) return rule;
	const content = rule.content;
	if (content.type === FIELD) return rule; // direct nesting handled elsewhere
	if (!hasInnerFieldAtExposableDepth(content)) return rule;
	// Bail if a named-symbol sibling would lose its outer-field label.
	if (hasNamedSiblingOfInnerField(content)) return rule;
	return content;
}

/**
 * Expand a choice branch into a flat array of its top-level members.
 */
function normalizeBranchToMembers(branch: AnyRule): AnyRule[] {
	if (branch.type === SEQ) return branch.members;
	return [branch];
}

/**
 * Count occurrences of each field name in a branch's top-level members.
 */
function countFieldNames(members: AnyRule[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const m of members) {
		if (m.type === FIELD) counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
	}
	return counts;
}

/**
 * Return the first field name that appears EXACTLY ONCE in every
 * branch's top-level members, or null if no such name exists.
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
 *
 * Stays AnyRule-typed (phase-visibility-tightening finding): its
 * `m.type === FIELD` check is production-dead (0 hits, all 3 grammars,
 * instrumented regen) — every production caller reaches this only through
 * `simplifyRule`'s FIELD-free guarantee — but `simplify-canonical.test.ts`
 * calls the exported `hoistSharedFieldFromBranchesForChoice` (and therefore
 * this) directly with FIELD-bearing fixtures, bypassing that guarantee by
 * design (its header comment documents the intent: exercise this function
 * on pre-wrapper-deleted input). Narrowing to RenderRule would break a
 * genuine, intentional test surface, not just a dead branch — same
 * classification as the sibling `mergeBranchesForChoice`/
 * `mergePositionForChoice`/`liftSharedArmAttrs` family.
 */
function extractFieldFromBranchesForChoice(perBranch: AnyRule[][], name: string, ctx?: SimplifyCtx): AnyRule {
	const b = ctx?.builder ?? structuralBuilder;
	const hoistedContents: AnyRule[] = [];
	const residuals: AnyRule[] = [];
	let hoistedFieldTemplate: FieldRule | null = null;
	for (const members of perBranch) {
		const rest: AnyRule[] = [];
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
				members: perBranch.map((br) => (br.length === 1 ? br[0]! : { type: SEQ, members: br }))
			};
		hoistedFieldTemplate = hoistedFieldTemplate ?? extracted;
		hoistedContents.push(extracted.content);
		residuals.push(
			rest.length === 0 ? { type: SEQ, members: [] } : rest.length === 1 ? rest[0]! : { type: SEQ, members: rest }
		);
	}
	const unionedContent: AnyRule =
		hoistedContents.length === 1 ? hoistedContents[0]! : { type: CHOICE, members: hoistedContents };
	const hoisted: AnyRule = b.field(hoistedFieldTemplate!.name, unionedContent);
	const hasEmptyResidual = residuals.some((r) => r.type === SEQ && r.members.length === 0);
	const nonEmptyResiduals = residuals.filter((r) => !(r.type === SEQ && r.members.length === 0));
	if (nonEmptyResiduals.length === 0) return hoisted;
	const residualCore: AnyRule =
		nonEmptyResiduals.length === 1 ? nonEmptyResiduals[0]! : { type: CHOICE, members: nonEmptyResiduals };
	const residualPart: AnyRule = hasEmptyResidual ? b.optional(residualCore) : residualCore;
	return { type: SEQ, members: [hoisted, residualPart] };
}

/**
 * Lift a field name shared by every choice branch into an enclosing seq,
 * unioning field contents across branches. Residuals become optional choice.
 *
 * AnyRule-typed for the same reason as {@link extractFieldFromBranchesForChoice}.
 */
export function hoistSharedFieldFromBranchesForChoice(rule: ChoiceRule, ctx?: SimplifyCtx): AnyRule {
	if (rule.members.length < 2) return rule;
	if (rule.members.some((m) => m.type === VARIANT)) return rule;
	const perBranch = rule.members.map(normalizeBranchToMembers);
	const fieldNameCounts = perBranch.map(countFieldNames);
	const candidate = firstFieldNameSharedExactlyOncePerBranch(fieldNameCounts);
	if (candidate === null) return rule;
	return extractFieldFromBranchesForChoice(perBranch, candidate, ctx);
}

/**
 * Lift a slot-shape attribute shared by EVERY choice arm onto the choice node.
 */
function liftSharedArmAttrs(rule: ChoiceRule): AnyRule {
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
 * Peel `group` wrappers to expose the seq inside.
 */
function unwrapForMerge(rule: AnyRule): AnyRule {
	if (rule.type === GROUP) return unwrapForMerge(rule.content);
	return rule;
}

/**
 * Are these positions (one per branch, all at the same seq index)
 * structurally equivalent?
 */
function positionsAreMergeable(position: readonly AnyRule[]): boolean {
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
		return position.every((p) => p.type === STRING && p.value === first.value);
	}
	const firstJson = JSON.stringify(first);
	return position.every((p) => JSON.stringify(p) === firstJson);
}

/**
 * Merge N same-position rules (already verified as mergeable) into a single canonical rule.
 *
 */
function mergePositionForChoice(position: readonly AnyRule[], ctx?: SimplifyCtx): AnyRule {
	const b = ctx?.builder ?? structuralBuilder;
	const first = position[0]!;
	if (first.type === FIELD) {
		const fields = position.filter((p): p is FieldRule => p.type === FIELD);
		const contents = dedupeByJson(fields.map((f) => f.content));
		const mergedContent: AnyRule = contents.length === 1 ? contents[0]! : { type: CHOICE, members: contents };
		return b.field(first.name, mergedContent);
	}
	return first;
}

/** Deduplicate rules by JSON equality, preserving first-seen order. */
function dedupeByJson(rules: readonly AnyRule[]): AnyRule[] {
	const seen = new Set<string>();
	const out: AnyRule[] = [];
	for (const r of rules) {
		const key = JSON.stringify(r);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(r);
	}
	return out;
}

/**
 * Structural AnyRule equality — compares all discriminant + content fields recursively.
 */
export function rulesStructurallyEqual(a: AnyRule, b: AnyRule): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Merge a choice of structurally-equivalent branches into a flat seq with
 * per-position unioned field contents. Bails (→ `liftSharedArmAttrs`) when
 * branches aren't same-length mergeable seqs; NEVER unwraps `variant()`.
 *
 * AnyRule-typed (phase-visibility-tightening finding, verified empirically):
 * its `br.type === FIELD` check is production-dead (0 hits across all 3
 * grammars, instrumented regen), but `simplify-canonical.test.ts` calls this
 * exported function directly with FIELD-bearing fixtures, bypassing
 * `simplifyRule`'s FIELD-free guarantee by design — a genuine, intentional
 * test surface (not just dead code), so narrowing to RenderRule would break
 * it. `mergePositionForChoice` (called from here) and `liftSharedArmAttrs`
 * (the bail-out path) share this classification.
 */
export function mergeBranchesForChoice(rule: ChoiceRule, ctx?: SimplifyCtx): AnyRule {
	if (rule.members.length === 0) return rule;
	// variant() marks polymorph-distinct branches — bail, this is a polymorph surface.
	if (rule.members.some((m) => m.type === VARIANT)) return rule;
	const unwrapped = rule.members.map(unwrapForMerge); // group/clause only (structural)
	// All branches a bare field of the same name → field(name, choice(contents)).
	if (unwrapped.every((br): br is FieldRule => br.type === FIELD)) {
		const first = unwrapped[0]!;
		if (unwrapped.every((f) => f.name === first.name)) {
			return mergePositionForChoice(unwrapped, ctx);
		}
	}
	// Every branch must be a seq of the same length.
	if (!unwrapped.every((br): br is SeqRule => br.type === SEQ)) return liftSharedArmAttrs(rule);
	const len = unwrapped[0]!.members.length;
	if (!unwrapped.every((br) => br.members.length === len)) return liftSharedArmAttrs(rule);
	// Check position-by-position structural equivalence.
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((br) => br.members[i]!);
		if (!positionsAreMergeable(position)) return liftSharedArmAttrs(rule);
	}
	// All positions mergeable. Build the merged seq.
	const mergedMembers: AnyRule[] = [];
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((br) => br.members[i]!);
		mergedMembers.push(mergePositionForChoice(position, ctx));
	}
	if (mergedMembers.length === 0) return { type: SEQ, members: [] };
	if (mergedMembers.length === 1) return mergedMembers[0]!;
	return { type: SEQ, members: mergedMembers };
}

/**
 * Test-only post-condition check. Throws with kind + offending sub-rule type
 * if a branch/group body isn't a seq-of-leaves (or a bare leaf).
 */
export function assertUniversalShape(node: AssembledNode): void {
	if (node.modelType !== 'branch' && node.modelType !== 'group') return;
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
 * SimplifiedRule-level mirror of {@link assertUniversalShape}, operating on
 * a rule directly so `computeSimplifiedRules` can fail-fast at the simplify
 * boundary (called on `canonicalized[kind]`, the final SimplifiedRule map
 * entry, before it's returned).
 */
export function assertUniversalShapeRule(rule: SimplifiedRule, kind: string): void {
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

// ---------------------------------------------------------------------------
// Slot-grouping diagnostic accumulator (propose-promotion only).
//
// `computeSimplifiedRules` is invoked multiple times per grammar (main rules,
// alias bodies, polymorph forms — see normalize.ts), so records are deduped by
// (ownerKind, shape) as they accumulate, and the whole accumulator is reset
// once per `normalizeGrammar()` run via `resetSlotGroupingDiagnostics()`. That keeps
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
 * Clear the accumulator. Called once at the start of each `normalizeGrammar()` run so
 * diagnostics from one grammar never leak into the next (the multiple
 * `computeSimplifiedRules` calls within a run still accumulate into one batch).
 */
export function resetSlotGroupingDiagnostics(): void {
	_slotGroupingDiagnostics.length = 0;
	_slotGroupingSeen.clear();
}

/**
 * Return + clear the slot-grouping diagnostics accumulated during the current
 * `normalizeGrammar()` run. The codegen CLI calls this after regen to print
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
 * Injects `attributeBuilder` so even bare `simplifyRule(rule)` calls use the
 * attribute-push strategy.
 */
export function makeDefaultCtx(): SimplifyCtx {
	return new SimplifyCtx({ grammar: makeNormalizedGrammar({}), diagnostics: new DiagnosticSink(), builder: attributeBuilder });
}

/**
 * Dispatch a rule to its per-type simplify handler. Recurses ONCE via
 * `ctx.walker.map` (RuleWalker's canonical `members`/`content`/`separator.value`
 * child-edge relation, R12 PR-6) — bottom-up over every child edge, INCLUDING
 * a rule's `.separator.value` (a real Rule, PR-S) — then dispatches on the
 * already-recursed node. This replaces five places (this switch plus
 * `simplifySeqRule`/`simplifyChoiceRule`/`simplifyGroupRule`/`simplifyVariantRule`,
 * each previously recursing into its own subset of children directly) with one
 * walker-driven recursion, so a rule carrying a non-literal separator gets its
 * `.separator.value` simplified exactly like any other rule position instead
 * of being skipped by all five (PR-S task 4). The public entry keeps `ctx?`
 * optional (normalized via `makeDefaultCtx`) so direct callers needn't build a
 * ctx; each per-type handler still takes `(rule: <Type>Rule, ctx: SimplifyCtx)`
 * but no longer recurses into its own children — it receives them already
 * simplified.
 *
 * By simplify-time, FIELD / OPTIONAL / REPEAT / REPEAT1 / ALIAS / TOKEN nodes
 * must never appear in the input:
 *  - `applyWrapperDeletion` (which runs before this in the production pipeline)
 *    converts FIELD/OPTIONAL/REPEAT/REPEAT1 to `fieldName` / `multiplicity`
 *    attributes and pushes ALIAS down to `aliasedFrom`+`aliasNamed` leaf
 *    attributes. TOKEN is the exception: wrapper-deletion PRESERVES the node
 *    (`{...rule, content}`, wrapper-deletion.ts) — its absence here is a
 *    type-level assertion (`TokenRule` → `never` under `RenderRule`) backed
 *    empirically (0 surviving top-level token rules across all 3 grammars),
 *    not a mechanism guarantee; see the preserve-token-wrappers debt. All
 *    six still collapse to `never` under `RenderRule` (types/rule.ts).
 *  - Construction sites inside `mergePositionForChoice` / `extractFieldFromBranchesForChoice`
 *    and the empty-match fold in `simplifyChoiceRule` now delegate to
 *    `ctx.builder` (= `attributeBuilder` in production) which pushes attributes
 *    instead of building wrapper nodes.
 * The `default` branch throws so any stray wrapper node is caught immediately.
 */
export function simplifyRule(rule: RenderRule, ctx: SimplifyCtx = makeDefaultCtx()): RenderRule {
	const recursed = ctx.walker.map(rule, (r) => simplifyRule(r as RenderRule, ctx)) as RenderRule;
	switch (recursed.type) {
		// simplifySeqRule/simplifyChoiceRule are typed AnyRule-out (see the
		// comment on simplifyChoiceRule) because they route construction
		// through the AnyRule-generic RuleBuilder — but every production call
		// passes RenderRule-shaped input through attributeBuilder, which never
		// emits a wrapper node, so the AnyRule return is always ACTUALLY
		// RenderRule-shaped; the cast bridges that real (not type-provable)
		// invariant rather than laundering past it.
		case SEQ:
			return simplifySeqRule(recursed, ctx) as RenderRule;
		case CHOICE:
			return simplifyChoiceRule(recursed, ctx) as RenderRule;
		// GROUP / VARIANT: structural wrapper preserved, no case-specific
		// logic remains once recursion moved onto ctx.walker.map (their
		// former bodies were pure `{ ...rule, content: simplifyRule(rule.content, ctx) }`
		// recursions — now redundant with the walker.map call above).
		case GROUP:
		case VARIANT:
		// Leaf / terminal types — pass through as-is (no structural transformation).
		case SYMBOL:
		case STRING:
		case PATTERN:
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return recursed;
		default:
			// FIELD / OPTIONAL / REPEAT / REPEAT1 and any unknown type hitting this
			// branch is a bug: all wrappers must be converted to fieldName/multiplicity
			// attributes by applyWrapperDeletion before reaching simplify, and
			// construction sites within simplify use ctx.builder (attributeBuilder)
			// which pushes attributes rather than creating wrapper nodes.
			throw new Error(
				`simplifyRule: unexpected rule type '${(recursed as RenderRule).type}' — ` +
					`field/optional/repeat/repeat1 nodes must be converted to attributes ` +
					`by applyWrapperDeletion before reaching simplify`
			);
	}
}

/**
 * CHOICE: fold an empty-match member (`pattern("")`, empty seq) into `optional`;
 * collapse a single member; fuse same-named fields across structurally-equivalent
 * branches (`mergeBranchesForChoice`), then hoist a field shared by every branch out
 * to an enclosing seq. Variant wrappers are preserved for polymorph detection.
 *
 * Uses `b.optional` / `b.choice` so the phase builder decides whether to produce
 * a wrapper node or push attributes (attributeBuilder → attributes; structuralBuilder
 * → nodes). The empty-match fold no longer routes through `simplifyRule` for the
 * optional wrapper — `b.optional` applies the same semantics directly.
 */
// simplifyChoiceRule (and simplifySeqRule below) stay AnyRule-in AnyRule-out
// (not narrowed to RenderRule) — phase-visibility-tightening finding:
// narrowing them forces new `as RenderRule` casts at their
// `withAttrsFrom(rule, b.choice(...))` / `b.optional(...)` call sites, because
// `RuleBuilder` (dsl/rule-transforms.ts) is DELIBERATELY AnyRule-generic (one
// interface serving both `structuralBuilder`, which legitimately builds
// WrapperPhase wrapper nodes, and `attributeBuilder`, which never does).
// Forcing these call sites to a narrower phase would launder past the
// checker rather than reflect a real invariant the builder abstraction
// enforces — left generic per the "no new cast to satisfy the checker" rule.
// `simplifyRule` (the public dispatcher immediately above) is still the
// honest RenderRule-in/RenderRule-out boundary; these are its AnyRule-typed
// internal helpers, called only with RenderRule-shaped values in production.
// (GROUP/VARIANT no longer have dedicated handlers — recursion into their
// `.content` now happens once, via simplifyRule's ctx.walker.map call, and
// they had no case-specific logic beyond that recursion.)
function simplifyChoiceRule(rule: ChoiceRule, ctx: SimplifyCtx = makeDefaultCtx()): AnyRule {
	const b = ctx.builder ?? structuralBuilder;
	// Members already simplified by simplifyRule's ctx.walker.map recursion —
	// this function no longer recurses into its own children (PR-S task 4).
	const members = rule.members;
	const empty = members.findIndex(isEmptyMatchMember);
	if (empty >= 0 && members.length > 1) {
		const nonEmpty = members.filter((_, i) => i !== empty);
		const inner: AnyRule = nonEmpty.length === 1 ? nonEmpty[0]! : withAttrsFrom(rule, b.choice(nonEmpty));
		return withAttrsFrom(rule, b.optional(inner));
	}
	if (members.length === 1) return withAttrsFrom(rule, members[0]!);
	const merged = mergeBranchesForChoice(b.choice(members) as ChoiceRule, ctx);
	if (merged.type !== CHOICE) return withAttrsFrom(rule, merged);
	// Structurally still a ChoiceRule at this point (only `.type` was checked
	// above); `mergeBranchesForChoice`'s AnyRule return type is wider than what
	// it actually produces for a CHOICE-shaped input.
	return withAttrsFrom(rule, hoistSharedFieldFromBranchesForChoice(merged as ChoiceRule, ctx));
}

/** Simplify every rule in the map, each run to fixpoint (see `normalizeToFixpoint`). */
export function simplifyRules(rules: Record<string, RenderRule>, ctx?: SimplifyCtx): Record<string, RenderRule> {
	const out: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		out[name] = normalizeToFixpoint(rule, ctx, rules);
	}
	return out;
}

/**
 * Compute the derivation-only simplified view of every rule in the map.
 *
 * Relocated from normalize.ts as part of PR1 — all simplification logic lives
 * in simplify.ts. Input type widened to RenderRule: applyWrapperDeletion in
 * normalize.ts produces a wrapper-less map, and simplify operates on that.
 *
 * @param normalizedRules - Wrapper-less rule map (output of applyWrapperDeletion).
 * @returns A new map containing the simplified form of each rule.
 */
export function computeSimplifiedRules(
	ctx: SimplifyCtx
): Record<string, SimplifiedRule> {
	// Option 2 (R12): the operated-on render-rule map lives on ctx.rules.
	// Construction sites delegate wrapper-vs-attribute to ctx.builder (SimplifyCtx
	// defaults it to attributeBuilder — simplify's wrapper-free strategy); we
	// never reach for a builder directly here.
	const normalizedRules = ctx.rules;
	const inlineKinds = ctx.inlineKinds;
	const polymorphSkipExtra = ctx.polymorphSkipExtra ?? new Set<string>();
	const simplified = simplifyRules(normalizedRules, ctx);
	const canonicalized: Record<string, SimplifiedRule> = {};
	for (const [kind, rule] of Object.entries(simplified)) {
		// Final wrapper-free pass: simplify's hoists + choice-folding can
		// re-introduce wrapper nodes, so deleteWrapper pushes them back to leaf
		// attrs (SimplifiedRule = wrapper-free; idempotent on wrapper-free input).
		// Re-fuse head+repeat list pairs too — inlineRefs can splice a helper body
		// and re-expose a non-adjacent head-single + tail-array of the same element.
		const wrapperFree = fuseHeadRepeatLists(
			deleteWrapper(canonicalizeSeqOfLeaves(rule) as AnyRule) as AnyRule
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
	rule: RenderRule,
	ctx: SimplifyCtx | undefined,
	rules: Readonly<Record<string, RenderRule>>
): RenderRule {
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

// compileWordMatcher moved to ../util/word-matcher.ts (shared by assemble, emitters, dsl).

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
export function hoistInnerFieldsForTemplate(rule: AnyRule): AnyRule {
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
				content: hoistInnerFieldsForTemplate((rule as { content: AnyRule }).content)
			} as AnyRule;
		case FIELD: {
			const recursed: AnyRule = {
				...rule,
				content: hoistInnerFieldsForTemplate(rule.content)
			};
			return hoistInnerFieldFromWrapperForField(recursed);
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
function simplifySeqRule(rule: SeqRule, ctx: SimplifyCtx = makeDefaultCtx()): AnyRule {
	// Members already simplified by simplifyRule's ctx.walker.map recursion —
	// this function no longer recurses into its own children (PR-S task 4).
	const mapped: AnyRule[] = rule.members;
	const filtered: AnyRule[] = mapped.filter((m) => {
		// Strip bare string delimiters (not slot-promoted) + empty-seq sentinels.
		if (m.type === STRING && !isSlotPromotedLiteral(m)) return false;
		if (m.type === SEQ && m.members.length === 0) return false;
		return true;
	});
	const members: AnyRule[] = filtered.flatMap((m): AnyRule[] => {
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
		if (combined !== undefined) return { ...carried, multiplicity: combined } as AnyRule;
		return carried;
	}
	return withAttrsFrom(rule, { type: SEQ, members });
}
