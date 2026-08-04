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

import {
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, RenderRule, Rule, SimplifiedRule, ChoiceRule, SeqRule, FieldRule } from '../types/rule.ts';
import { isSpliceableBareSeq } from '../types/rule.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { deleteWrapper } from './wrapper-deletion.ts';
import { withAttrsFrom, sharedArmAttrs } from '../dsl/rule-attrs.ts';
import { diagnoseSlotGrouping, type SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import type { RuleBuilder } from '../dsl/rule-transforms.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import type { NormalizedGrammar } from './types.ts';

export class SimplifyCtx extends BaseCtx<'normalize'> {
	readonly inlineKinds: ReadonlySet<string>;
	/** Extra kinds the slot-grouping diagnostic skips (variant-resolved). */
	readonly polymorphSkipExtra?: ReadonlySet<string>;
	constructor(
		init: BaseCtxInit<'normalize'> & { inlineKinds?: ReadonlySet<string>; polymorphSkipExtra?: ReadonlySet<string> }
	) {
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
import {
	structuralBuilder,
	inlineRefs,
	fuseHeadRepeatLists,
	combineMultiplicity,
	type InlineRefsCtx,
	type LeafMultiplicity
} from '../dsl/rule-transforms.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import type { AssembledNode } from './model/node-map.ts';

// ---------------------------------------------------------------------------
// attributeBuilder — compiler-side RuleBuilder that pushes attributes instead
// of constructing wrapper nodes, so simplify stays field/optional/repeat-free.
// ---------------------------------------------------------------------------

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
		// Cast, not narrow: `content: AnyRule` (RuleBuilder's phase-generic
		// param) vs `deleteWrapper`'s `Rule<'link'>` — same "narrow via
		// AnyRule, cast back" convention as rule-catalog.ts's `ruleChildren`.
		return deleteWrapper({ type: OPTIONAL, content } as Rule<'link'>) as RenderRule;
	},
	repeat: (content) => deleteWrapper({ type: REPEAT, content } as Rule<'link'>) as RenderRule,
	repeat1: (content) => deleteWrapper({ type: REPEAT1, content } as Rule<'link'>) as RenderRule,
	field: (name, content) => deleteWrapper({ type: FIELD, name, content } as Rule<'link'>) as RenderRule
};

// ---------------------------------------------------------------------------
// Simplify-only helpers (relocated from dsl/rule-transforms.ts).
// These are used exclusively by the simplify phase.
// ---------------------------------------------------------------------------

const seqOfLeavesWalker = new RuleWalker<AnyRule>();

function collapseSingleMemberSeq(recursed: AnyRule): AnyRule {
	if (recursed.type === SEQ && recursed.members.length === 1) {
		const survivor = recursed.members[0]!;
		const carried = withAttrsFrom(recursed, survivor);
		const outerMult = (recursed as { multiplicity?: LeafMultiplicity }).multiplicity;
		// Only combine multiplicities when the seq itself carries an explicit one;
		// otherwise withAttrsFrom already transferred it (absent-only) and we
		// must not stamp 'single' onto nodes that had no explicit multiplicity.
		if (outerMult !== undefined) {
			const combined = combineMultiplicity(outerMult, (survivor as { multiplicity?: LeafMultiplicity }).multiplicity);
			// Only stamp when non-default (single → undefined per combineMultiplicity).
			if (combined !== undefined) return { ...carried, multiplicity: combined } as AnyRule;
		}
		return carried;
	}
	return recursed;
}

export function canonicalizeSeqOfLeaves(rule: AnyRule): AnyRule {
	return collapseSingleMemberSeq(seqOfLeavesWalker.map(rule, collapseSingleMemberSeq));
}

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

export function isEmptyMatchMember(rule: RenderRule): boolean {
	if (rule.type === PATTERN && rule.value === '') return true;
	if (rule.type === SEQ && rule.members.length === 0) return true;
	return false;
}

export function isSlotPromotedLiteral(rule: RenderRule): boolean {
	return (rule as { nonterminal?: boolean }).nonterminal === true;
}

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

export function hoistInnerFieldFromWrapperForField(rule: AnyRule): AnyRule {
	if (rule.type !== FIELD) return rule;
	const content = rule.content;
	if (content.type === FIELD) return rule; // direct nesting handled elsewhere
	if (!hasInnerFieldAtExposableDepth(content)) return rule;
	// Bail if a named-symbol sibling would lose its outer-field label.
	if (hasNamedSiblingOfInnerField(content)) return rule;
	return content;
}

function normalizeBranchToMembers(branch: AnyRule): AnyRule[] {
	if (branch.type === SEQ) return branch.members;
	return [branch];
}

function countFieldNames(members: AnyRule[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const m of members) {
		if (m.type === FIELD) counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
	}
	return counts;
}

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
				// Cast, not narrow: `AnyRule` distributes across every phase,
				// while `FieldRule` (bare) defaults to a single phase — same
				// "narrow via AnyRule, cast back" convention as
				// rule-catalog.ts's `ruleChildren`.
				extracted = m as FieldRule;
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

export function hoistSharedFieldFromBranchesForChoice(rule: ChoiceRule, ctx?: SimplifyCtx): AnyRule {
	if (rule.members.length < 2) return rule;
	if (rule.members.some((m) => m.type === VARIANT)) return rule;
	const perBranch = rule.members.map(normalizeBranchToMembers);
	const fieldNameCounts = perBranch.map(countFieldNames);
	const candidate = firstFieldNameSharedExactlyOncePerBranch(fieldNameCounts);
	if (candidate === null) return rule;
	return extractFieldFromBranchesForChoice(perBranch, candidate, ctx);
}

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

function unwrapForMerge(rule: AnyRule): AnyRule {
	if (rule.type === GROUP) return unwrapForMerge(rule.content);
	return rule;
}

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

export function rulesStructurallyEqual(a: AnyRule, b: AnyRule): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

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
	// Soundness guard (#171): merging unions each position INDEPENDENTLY,
	// which is only sound when at most one position actually varies across
	// branches. Two or more co-varying positions are correlated by branch
	// construction (e.g. a string rule's opening/contents/closing arms) —
	// independent unioning would produce a decorrelated grammar accepting
	// combinations no branch authored. Bail to the attr-lift path instead.
	let varyingPositions = 0;
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((br) => br.members[i]!);
		if (dedupeByJson(position).length > 1) {
			varyingPositions++;
			if (varyingPositions >= 2) return liftSharedArmAttrs(rule);
		}
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

export function assertUniversalShapeRule(rule: SimplifiedRule, kind: string): void {
	if (rule.type !== SEQ) {
		if (!isLeaf(rule)) {
			throw new Error(`Universal-shape violation in kind '${kind}': body is not a seq of leaves; found ${rule.type}`);
		}
		return;
	}
	for (const member of rule.members) {
		if (!isLeaf(member)) {
			throw new Error(`Universal-shape violation in kind '${kind}': seq member is not a leaf; found ${member.type}`);
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

function recordSlotGroupingDiagnostic(rec: SlotGroupingDiagnostic): boolean {
	const key = slotGroupingKey(rec);
	if (_slotGroupingSeen.has(key)) return false;
	_slotGroupingSeen.add(key);
	_slotGroupingDiagnostics.push(rec);
	return true;
}

export function resetSlotGroupingDiagnostics(): void {
	_slotGroupingDiagnostics.length = 0;
	_slotGroupingSeen.clear();
}

export function drainSlotGroupingDiagnostics(): SlotGroupingDiagnostic[] {
	const out = [..._slotGroupingDiagnostics];
	resetSlotGroupingDiagnostics();
	return out;
}

export function makeDefaultCtx(): SimplifyCtx {
	return new SimplifyCtx({
		grammar: makeNormalizedGrammar({}),
		diagnostics: new DiagnosticSink(),
		builder: attributeBuilder
	});
}

export function simplifyRule(rule: RenderRule, ctx: SimplifyCtx = makeDefaultCtx()): RenderRule {
	const withSimplifiedChildren = ctx.walker.map(rule, (r) => simplifyDispatch(r as RenderRule, ctx)) as RenderRule;
	return simplifyDispatch(withSimplifiedChildren, ctx);
}

function simplifyDispatch(rule: RenderRule, ctx: SimplifyCtx): RenderRule {
	switch (rule.type) {
		// simplifySeqRule/simplifyChoiceRule are typed AnyRule-out (see the
		// comment on simplifyChoiceRule) because they route construction
		// through the AnyRule-generic RuleBuilder — but every production call
		// passes RenderRule-shaped input through attributeBuilder, which never
		// emits a wrapper node, so the AnyRule return is always ACTUALLY
		// RenderRule-shaped; the cast bridges that real (not type-provable)
		// invariant rather than laundering past it.
		case SEQ:
			return simplifySeqRule(rule, ctx) as RenderRule;
		case CHOICE:
			return simplifyChoiceRule(rule, ctx) as RenderRule;
		// GROUP / VARIANT: structural wrapper preserved, no case-specific
		// logic remains once recursion moved onto ctx.walker.map (their
		// former bodies were pure `{ ...rule, content: simplifyRule(rule.content, ctx) }`
		// recursions — now redundant with the walker.map call in simplifyRule).
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
			return rule;
		default:
			// FIELD / OPTIONAL / REPEAT / REPEAT1 and any unknown type hitting this
			// branch is a bug: all wrappers must be converted to fieldName/multiplicity
			// attributes by applyWrapperDeletion before reaching simplify, and
			// construction sites within simplify use ctx.builder (attributeBuilder)
			// which pushes attributes rather than creating wrapper nodes.
			throw new Error(
				`simplifyRule: unexpected rule type '${(rule as RenderRule).type}' — ` +
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

export function simplifyRules(rules: Record<string, RenderRule>, ctx?: SimplifyCtx): Record<string, RenderRule> {
	const out: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		out[name] = normalizeToFixpoint(rule, ctx, rules);
	}
	return out;
}

export function computeSimplifiedRules(ctx: SimplifyCtx): Record<string, SimplifiedRule> {
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
			deleteWrapper(canonicalizeSeqOfLeaves(rule) as Rule<'link'>) as AnyRule
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
				proposal: rec.proposal
			});
		}
	}

	return canonicalized;
}

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
			// `hoistInnerFieldsForTemplate` widens its return to `AnyRule`
			// regardless of the phase `rule.content` narrowed to, so the
			// rebuilt object no longer structurally matches this FIELD
			// variant's own `content: Rule<P>` slot — same widening every
			// other case in this switch handles with `as AnyRule` below.
			const recursed = {
				...rule,
				content: hoistInnerFieldsForTemplate(rule.content)
			} as AnyRule;
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

function simplifySeqRule(rule: SeqRule, _ctx: SimplifyCtx = makeDefaultCtx()): AnyRule {
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
		// Keep a nested seq that carries its OWN cardinality as one member:
		// splicing would lose that cardinality and hoist an inner choice to
		// the parent's seq position (a non-canonical choice-at-seq). A bare
		// seq (no own attrs) is spliced/flattened — shared predicate with
		// wrapper-deletion.ts's SEQ case (see isSpliceableBareSeq's doc).
		if (!isSpliceableBareSeq(m)) return [m];
		return (m as SeqRule).members;
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
