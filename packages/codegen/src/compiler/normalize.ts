/**
 * compiler/normalize.ts — Normalize phase.
 *
 * Restructures seq/choice/optional/repeat for SIMPLIFICATION (fan-out,
 * factoring, prefix/suffix extraction, wrapper collapsing, dedupe,
 * single-use hidden-rule inlining). Does NOT change named content.
 * Non-lossy.
 *
 * Variant tagging lives in Link — that is classification, not simplification.
 * Pipeline order is fixed in
 * `normalizeGrammar()` below: collapse → fan-out → factor → dedupe → inline →
 * re-collapse.
 */

import {
	ALIAS,
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
import type { Rule, RuleBase, SeqRule } from '../types/rule.ts';
import { isChoice, isEnumChoiceRule } from '../types/rule.ts';
import type { LinkedGrammar, NormalizedGrammar, SimplifiedGrammar } from './types.ts';
import { computeSimplifiedRules, resetSlotGroupingDiagnostics, attributeBuilder, SimplifyCtx } from './simplify.ts';
import { resolveGroupOrMultiInlineTarget, combineMultiplicity, type LeafMultiplicity } from '../dsl/rule-transforms.ts';
import { applyWrapperDeletion } from './wrapper-deletion.ts';
import { withAttrsFrom } from '../dsl/rule-attrs.ts';
import { separatorFactsEqual } from '../dsl/list-patterns.ts';
import { deriveComplexAliasTargetHidden } from './evaluate.ts';
import { deriveStructuralVariantChildren, prefixNamedSuffix } from './variant-structural.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';

export class NormalizeCtx extends BaseCtx<'link'> {
	/** Inline-decision set (kinds emitters skip / normalize preserves). */
	readonly inlineKinds: ReadonlySet<string>;
	/** Kinds to exclude from the slot-grouping "propose-promotion" diagnostic. */
	readonly polymorphSkip?: ReadonlySet<string>;
	constructor(init: BaseCtxInit<'link'> & { inlineKinds?: ReadonlySet<string>; polymorphSkip?: ReadonlySet<string> }) {
		super(init);
		this.inlineKinds = init.inlineKinds ?? new Set();
		this.polymorphSkip = init.polymorphSkip;
	}

	get rules(): Record<string, Rule<'link'>> {
		return this.grammar.rules;
	}
}

/**
 * Run the full ordered pipeline of non-lossy normalization passes over the
 * raw rule map from the linked grammar.
 *
 * @param linkRules - The rule map produced by the Link phase.
 * @returns A new rule map after all normalization passes have been applied.
 * @remarks
 * Order matters: collapse wrappers first (smallest trees → cleaner
 * downstream), then fan-out (expose nested choices), then factor (pull
 * common prefixes/suffixes), then dedupe adjacent duplicates, then inline
 * single-use hidden helpers, then re-collapse to flatten any degenerate
 * wrappers introduced by the previous passes.
 *
 * Polymorph classification lives in Link (variant()-driven, with
 * suggestion-only heuristic detection). This pipeline is simplification
 * only — it MUST NOT silently classify rules as polymorphs because
 * tree-sitter's parser-generator doesn't see these mutations and the parse
 * tree wouldn't match the typed surface. Heuristic candidates that need
 * promotion are surfaced via suggested.ts; the user authors variant() in
 * overrides.ts to make them explicit.
 */
// DIAGNOSTIC (`DBG_ID_LOSS=<kind>`): print the first choice's id for <kind>
// after each normalization pass, to pinpoint where a rule id gets dropped.
function dbgChoiceId(label: string, rules: Record<string, Rule<'link'>>): void {
	const target = process.env.DBG_ID_LOSS;
	if (!target) return;
	const r = rules[target];
	if (!r) return;
	const find = (x: Rule<'link'>): string | undefined => {
		if (x.type === CHOICE) return (x as { id?: string }).id ?? '<NONE>';
		const xs = x as { members?: readonly Rule<'link'>[]; content?: Rule<'link'> };
		for (const m of xs.members ?? []) {
			const g = find(m);
			if (g) return g;
		}
		if (xs.content) return find(xs.content);
		return undefined;
	};
	process.stderr.write(`[DBG_ID] ${label}: choice id=${find(r) ?? '<no-choice>'}\n`);
}

export function computeKeepRef(rules: Readonly<Record<string, Rule<'link'>>>): Set<string> {
	const refcount = new Map<string, number>();
	// Hidden kinds `_x` that have a VISIBLE NAME-TWIN: a parse-kind rule named
	// exactly `x` (leading `_` stripped) whose body is/contains `symbol(_x)`.
	// The twin is the surfaced CST kind; `_x` is its shared body. (A visible
	// rule of a DIFFERENT name referencing `_x` does NOT twin it — that is the
	// ordinary single-use fold case, e.g. `extends_clause` → `_extends_clause_single`.)
	const twinned = new Set<string>();
	// Hidden kinds named in a `supertype.subtypes` array (referenced by NAME,
	// not a `symbol()` body ref — e.g. py `_key_value_pattern` ∈
	// `_dict_pattern_kv.subtypes`). Folding such a kind dangles the supertype,
	// which references it by name. Structural fact, not metadata (§D-2a).
	const supertypeNamed = new Set<string>();

	const isHidden = (name: string): boolean => name.startsWith('_');

	const walk = (rule: Rule<'link'>, ownerTwinTarget: string | undefined): void => {
		if (rule.type === SYMBOL) {
			const name = rule.name;
			if (isHidden(name)) {
				refcount.set(name, (refcount.get(name) ?? 0) + 1);
				if (ownerTwinTarget !== undefined && name === ownerTwinTarget) twinned.add(name);
			}
			return;
		}
		if (rule.type === SUPERTYPE) {
			for (const sub of rule.subtypes) {
				if (isHidden(sub)) supertypeNamed.add(sub);
			}
			return;
		}
		const xs = rule as { members?: readonly Rule<'link'>[]; content?: Rule<'link'> };
		for (const m of xs.members ?? []) walk(m, ownerTwinTarget);
		if (xs.content) walk(xs.content, ownerTwinTarget);
	};

	for (const [name, rule] of Object.entries(rules)) {
		// A visible rule `x` is the potential name-twin owner of hidden `_x`.
		const ownerTwinTarget = isHidden(name) ? undefined : `_${name}`;
		walk(rule, ownerTwinTarget);
	}

	const keep = new Set<string>(supertypeNamed);
	for (const [name, count] of refcount) {
		if (count > 1 || twinned.has(name)) keep.add(name);
	}
	return keep;
}

// ---------------------------------------------------------------------------
// inlineHiddenSeqRefs — §D-2a normalize inline hoist (v3: seq-unit multiplicity)
// ---------------------------------------------------------------------------

export function inlineHiddenSeqRefs(
	rules: Record<string, Rule<'link'>>,
	_ctx: NormalizeCtx | undefined,
	keepRef: ReadonlySet<string>
): boolean {
	// Which hidden kinds are fold-eligible THIS pass.
	const foldable = new Set<string>();
	for (const [name, rule] of Object.entries(rules)) {
		if (!name.startsWith('_')) continue;
		if (keepRef.has(name)) continue;
		if (name === '_import_list') continue; // deferred (Task 6)
		if (resolveGroupOrMultiInlineTarget(rule) !== null) foldable.add(name);
	}
	if (foldable.size === 0) return false;

	let changed = false;
	for (const [parentName, parentRule] of Object.entries(rules)) {
		// A foldable kind never inlines INTO itself (a group body referencing the
		// same hidden kind would recurse) — skip the entry itself.
		const spliced = spliceFoldableRefs(parentRule, foldable, rules);
		if (spliced !== parentRule) {
			rules[parentName] = spliced;
			changed = true;
		}
	}
	// NOTE: we deliberately do NOT delete the folded `_x` entry from the map.
	// `assemble` iterates the RAW `normalized.linkRules` keys and looks up the matching
	// `normalizedRules[kind]` / `rules[kind]` (SimplifiedGrammar's phase product) for
	// EACH — deleting `_x` from normalizedRules only would desync the maps and crash
	// assemble. The folded `_x` survives as a standalone entry (its parents simply no
	// longer reference it); emitters already skip it via `inlineKinds`. Dead-duplicate
	// cleanup of the orphaned `_x` kind + its transport is a separate concern (§D-2b),
	// not here.
	return changed;
}

function spliceFoldableRefs(
	rule: Rule<'link'>,
	foldable: ReadonlySet<string>,
	rules: Readonly<Record<string, Rule<'link'>>>
): Rule<'link'> {
	switch (rule.type) {
		case SYMBOL: {
			if (!foldable.has(rule.name)) return rule;
			// A ref the inline flag marks non-inline (aliased / supertype /
			// self-recursive) must NOT splice — it materializes as its own kind. The
			// flag is authoritative on this render path now that every ref-minting
			// site routes through `symbol()` (enrich `makeGroupLiftSymbol`,
			// group-synthesis), so the construction stamp reaches here.
			if ((rule as { inline?: boolean }).inline !== true) return rule;
			// Only fold OPTIONAL / REQUIRED seq-unit refs. ARRAY / nonEmptyArray
			// refs are `repeat(seq)` boundaries: the whole sequence repeats with a
			// separator, and the baseline renders each internal slot with `|
			// join(sep)` (leaf-level array multiplicity). A seq-unit array form is
			// not gated/joined by the existing emit path, so folding it here would
			// DROP the joins (extends_clause regression). Leave the `symbol(_x)` ref
			// intact — it renders correctly via the existing emit machinery — and
			// let the deliberate AssembledGroup boundary stand (plan §D-2a: "respect
			// resolveGroupOrMultiInlineTarget eligibility").
			const mult = (rule as { multiplicity?: LeafMultiplicity }).multiplicity;
			if (mult === 'array' || mult === 'nonEmptyArray') return rule;
			// A ref carrying a `fieldName` is a NAMED single slot whose body is
			// opaque content (e.g. `infer_type` → `field('constraint',
			// _infer_type_optional1)`); the baseline renders it as ONE `{{ constraint
			// }}` slot, hiding the group's internal literals/fields. Inlining it
			// would surface those internals (`extends {{ type }}`) and rename the
			// slot — a render + slot regression. Only STRUCTURAL (un-fielded) group
			// refs fold; field-wrapped groups stay as their single slot.
			if ((rule as { fieldName?: string }).fieldName !== undefined) return rule;
			const target = rules[rule.name];
			if (!target) return rule;
			const body = resolveGroupOrMultiInlineTarget(target);
			if (!body) return rule;
			// Cast, not narrow: `resolveGroupOrMultiInlineTarget` returns the
			// phase-erased `AnyRule` (dsl/rule-transforms.ts is phase-generic by
			// design), while `target`/`body` share THIS function's 'link' phase
			// by construction — same "narrow via AnyRule, cast back" convention
			// as rule-catalog.ts's `ruleChildren`.
			return materializeInlinedBody(rule, body as Rule<'link'>, rule.name);
		}
		case SEQ: {
			let touched = false;
			const members = rule.members.map((m) => {
				const r = spliceFoldableRefs(m, foldable, rules);
				if (r !== m) touched = true;
				return r;
			});
			return touched ? { ...rule, members } : rule;
		}
		case CHOICE: {
			let touched = false;
			const members = rule.members.map((m) => {
				const r = spliceFoldableRefs(m, foldable, rules);
				if (r !== m) touched = true;
				return r;
			});
			return touched ? { ...rule, members } : rule;
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case FIELD:
		case VARIANT:
		case GROUP: {
			const inner = spliceFoldableRefs((rule as { content: Rule<'link'> }).content, foldable, rules);
			return inner === (rule as { content: Rule<'link'> }).content
				? rule
				: ({ ...rule, content: inner } as Rule<'link'>);
		}
		default:
			return rule;
	}
}

function materializeInlinedBody(
	ref: Extract<Rule<'link'>, { type: 'SYMBOL' }>,
	body: Rule<'link'>,
	inlinedFrom: string
): Rule<'link'> {
	const r = ref as {
		multiplicity?: LeafMultiplicity;
		separator?: RuleBase<'normalize'>['separator'];
		fieldName?: string;
	};
	const carry: {
		multiplicity?: LeafMultiplicity;
		separator?: RuleBase<'normalize'>['separator'];
		fieldName?: string;
	} = {};
	if (r.multiplicity !== undefined) carry.multiplicity = r.multiplicity;
	if (r.separator !== undefined) carry.separator = r.separator;
	if (r.fieldName !== undefined) carry.fieldName = r.fieldName;

	const meta = { ...body.metadata, inlinedFrom };

	// The group body is normally a `seq`; tag it directly so the seq-unit
	// multiplicity rides the sequence (gated at emit on its single internal
	// slot). A non-seq body (single member group) is wrapped in a 1-member seq
	// so it carries the same seq-unit gating uniformly.
	//
	// `splicedBody: true` (debt PR-0c) is the DECLARED structural flag —
	// distinct from the `inlinedFrom` provenance value in `metadata` — that
	// `emitters/templates.ts`'s boundary walkers key on to keep this seq's
	// outer-boundary spacing like the opaque `symbol(_x)` ref it replaced.
	// See `RuleBase.splicedBody`'s doc comment (types/rule.ts).
	if (body.type === SEQ) {
		return { ...body, ...carry, metadata: meta, splicedBody: true } as Rule<'link'>;
	}
	return {
		type: SEQ,
		members: [body],
		...carry,
		metadata: meta,
		splicedBody: true
	} as Rule<'link'>;
}

function applyNormalizationPasses(
	linkRules: Record<string, Rule<'link'>>,
	ctx?: NormalizeCtx,
	preserveKinds?: ReadonlySet<string>
): Record<string, Rule<'link'>> {
	let rules: Record<string, Rule<'link'>> = {};
	for (const [name, rule] of Object.entries(linkRules)) {
		rules[name] = collapseWrappers(rule, ctx);
	}
	dbgChoiceId('after collapseWrappers#1', rules);
	for (const name of Object.keys(rules)) {
		rules[name] = fanOutSeqChoices(rules[name]!, ctx);
	}
	dbgChoiceId('after fanOutSeqChoices', rules);
	for (const name of Object.keys(rules)) {
		rules[name] = factorChoiceBranches(rules[name]!, ctx);
	}
	dbgChoiceId('after factorChoiceBranches', rules);
	for (const name of Object.keys(rules)) {
		rules[name] = dedupeSeqMembers(rules[name]!, ctx);
	}
	dbgChoiceId('after dedupeSeqMembers', rules);
	rules = inlineSingleUseHidden(rules, ctx, preserveKinds);
	dbgChoiceId('after inlineSingleUseHidden', rules);
	for (const name of Object.keys(rules)) {
		rules[name] = collapseWrappers(rules[name]!, ctx);
	}
	dbgChoiceId('after collapseWrappers#2', rules);
	return rules;
}

export function normalizeGrammar(linked: LinkedGrammar, ctx?: NormalizeCtx): SimplifiedGrammar {
	// Read phase-shared state from ctx; fall back to empty defaults when called
	// without ctx (e.g. existing tests that only pass `linked`).
	const inlineKinds: ReadonlySet<string> = ctx?.inlineKinds ?? new Set();
	const extraPolymorphSkip: ReadonlySet<string> = ctx?.polymorphSkip ?? new Set();

	// Slot-grouping diagnostics accumulate across the several computeSimplifiedRules
	// calls below; reset per run so one grammar's records never leak into the next.
	resetSlotGroupingDiagnostics();
	// Derive the preserve-set once from linked.rules — structural on-demand
	// replacement for the old patternReplacementKinds cache. Both
	// applyNormalizationPasses calls below share this single derived set so
	// they behave identically to the old code that threaded the same cached set.
	const preserveKinds = deriveComplexAliasTargetHidden(linked.rules);
	const rules = applyNormalizationPasses(linked.rules, ctx, preserveKinds.size > 0 ? preserveKinds : undefined);
	// §D-2a normalize inline hoist: wrapper-delete ONCE (multiplicity → leaf
	// attributes), then run the rule-tree group inline to a fixed point. Inlining
	// RELOCATES already-wrapper-deleted `symbol(_x)` refs (it splices the
	// already-deleted body of `_x` and re-homes the ref's seq-unit multiplicity
	// onto the spliced SEQ node) — it never introduces fresh modifier WRAPPERS, so
	// re-running wrapper-deletion is both unnecessary AND harmful: `case 'seq'`
	// would re-distribute the seq-unit multiplicity onto the leaves (the BLOCKED
	// v2 leaf-stamp regression). The loop exists because one inline pass can
	// EXPOSE a fresh hidden-seq ref (a hidden parent inlines, surfacing its own
	// group ref); `keepRef` is re-derived each pass (cheap; invariant under
	// folding — splices conserve refcounts).
	const normalizedRules = applyWrapperDeletion(rules);
	for (let pass = 0; pass < 8; pass++) {
		const keepRef = computeKeepRef(normalizedRules);
		const changed = inlineHiddenSeqRefs(normalizedRules, ctx, keepRef);
		if (!changed) break;
	}

	// Build a base variant skip-set STRUCTURALLY (R12/decision-7 V2 Task 2):
	// every variant-adoption parent/child is already resolved by variant
	// dispatch; flagging them as multi-slot seqs in the diagnostic would be
	// a false positive. Formerly derived from the wire-metadata channel's
	// `{parent, child}` pairs (`linked.polymorphVariants`); now derived from
	// `deriveStructuralVariantChildren(linked.rules)` — the SAME derivation
	// assemble.ts and link.ts's `applyOverridePolymorphs` consume, so this
	// skip-set can never drift from what actually adopted. Preserves the
	// exact two-string-per-child shape the old code added (`pv.parent` +
	// `pv.child`, the SHORT suffix): the short suffix is recovered from
	// each structural target's full name via `prefixNamedSuffix` (the
	// inverse of `polymorphVisibleName`, shared not re-derived).
	const variantSkip = extraPolymorphSkip.size === 0 ? new Set<string>() : new Set<string>(extraPolymorphSkip);
	for (const [parentKind, targetNames] of deriveStructuralVariantChildren(linked.rules)) {
		variantSkip.add(parentKind);
		for (const targetName of targetNames) {
			const suffix = prefixNamedSuffix(parentKind, targetName);
			if (suffix !== null) variantSkip.add(suffix);
		}
	}

	// S2: build the honest Grammar<'normalize'> view SimplifyCtx reads (§2 —
	// SimplifyCtx = BaseCtx<'normalize'>). `rules` (mid-normalize, wrapper-intact
	// link view) becomes NormalizedGrammar.linkRules; `normalizedRules`
	// (wrapper-deleted) is NormalizedGrammar.rules — the phase's own product.
	// Phase-invariant fields carry straight from `linked`.
	const normalizedGrammarView: NormalizedGrammar = {
		name: linked.name,
		rules: normalizedRules,
		linkRules: rules,
		supertypes: linked.supertypes,
		word: linked.word,
		wordMatcher: linked.wordMatcher,
		externals: linked.externals,
		derivations: linked.derivations,
		aliasedHiddenKinds: linked.aliasedHiddenKinds,
		topLevelAliasBodies: linked.topLevelAliasBodies,
		parentAliasedKinds: linked.parentAliasedKinds,
		visibleAliasTargets: linked.visibleAliasTargets,
		refineForms: linked.refineForms
	};
	const simplifiedRules = computeSimplifiedRules(
		new SimplifyCtx({
			grammar: normalizedGrammarView,
			diagnostics: ctx?.diagnostics ?? new DiagnosticSink(),
			wordMatcher: ctx?.wordMatcher,
			inlineKinds,
			polymorphSkipExtra: variantSkip,
			builder: attributeBuilder
		})
	);

	// Alias-body kinds: thread the alias-target bodies through the same pipeline
	// so normalizedRules / simplifiedRules cover them too. Eliminates the
	// assemble.ts simplifyRule(assemblyRule) fallback (PR1's TODO PR2).
	if (linked.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule<'link'>> = Object.fromEntries(linked.topLevelAliasBodies);
		const aliasBodiesNormalized = applyNormalizationPasses(
			aliasBodiesRaw,
			ctx,
			preserveKinds.size > 0 ? preserveKinds : undefined
		);
		const aliasBodiesRender = applyWrapperDeletion(aliasBodiesNormalized);
		const aliasBodiesGrammarView: NormalizedGrammar = {
			...normalizedGrammarView,
			rules: aliasBodiesRender,
			linkRules: aliasBodiesNormalized
		};
		const aliasBodiesSimplified = computeSimplifiedRules(
			new SimplifyCtx({
				grammar: aliasBodiesGrammarView,
				diagnostics: ctx?.diagnostics ?? new DiagnosticSink(),
				wordMatcher: ctx?.wordMatcher,
				inlineKinds,
				polymorphSkipExtra: variantSkip,
				builder: attributeBuilder
			})
		);
		for (const [kind, rule] of Object.entries(aliasBodiesRender)) {
			normalizedRules[kind] = rule;
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}

	return {
		name: linked.name,
		linkRules: rules,
		normalizedRules,
		rules: simplifiedRules,
		supertypes: linked.supertypes,
		word: linked.word,
		wordMatcher: linked.wordMatcher,
		externals: linked.externals,
		derivations: linked.derivations,
		aliasedHiddenKinds: linked.aliasedHiddenKinds,
		topLevelAliasBodies: linked.topLevelAliasBodies,
		refineForms: linked.refineForms,
		parentAliasedKinds: linked.parentAliasedKinds,
		visibleAliasTargets: linked.visibleAliasTargets
	};
}

// ---------------------------------------------------------------------------
// fanOutSeqChoices
// ---------------------------------------------------------------------------

export function fanOutSeqChoices(rule: Rule<'link'>, _ctx?: NormalizeCtx): Rule<'link'> {
	switch (rule.type) {
		case SEQ: {
			const members = rule.members.map((m) => fanOutSeqChoices(m));
			const choiceIdx = members.findIndex(isChoice);
			if (choiceIdx < 0) return { ...rule, members };
			// Only fan out when there's exactly one inner choice.
			if (members.filter(isChoice).length > 1) {
				return { ...rule, members };
			}
			const choice = members[choiceIdx]!;
			if (!isChoice(choice)) return { ...rule, members };
			const before = members.slice(0, choiceIdx);
			const after = members.slice(choiceIdx + 1);
			const branches: Rule<'link'>[] = choice.members.map((branch) => {
				const inner = branch.type === VARIANT ? branch.content : branch;
				const seqMembers = [...before, inner, ...after];
				if (seqMembers.length === 1) return seqMembers[0]!;
				// Preserve variant labels by re-wrapping.
				const flat: Rule<'link'> = { type: SEQ, members: seqMembers };
				return branch.type === VARIANT ? { type: VARIANT, name: branch.name, content: flat } : flat;
			});
			// The fanned choice replaces this seq 1:1 — carry the inner choice's
			// separator/multiplicity/etc. attrs (so comma-separated lists keep
			// their separator), then override id with the seq's id so downstream
			// slot resolution (slotByRuleId) still finds it. A fresh
			// `{ type: 'CHOICE', ... }` here drops both the id and the separator
			// (the source of the UNRESOLVED slotByRuleId misses AND the
			// space-join regression on type_arguments / future_import_statement).
			return { ...choice, type: CHOICE, members: branches, ...(rule.id !== undefined ? { id: rule.id } : {}) };
		}
		case CHOICE: {
			const members = rule.members.map((m) => fanOutSeqChoices(m));
			return { ...rule, members };
		}
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case FIELD:
		case VARIANT:
		case GROUP:
			return { ...rule, content: fanOutSeqChoices(rule.content) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// factorChoiceBranches
// ---------------------------------------------------------------------------

function isAtomForFactoring(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case SYMBOL:
		case STRING:
		case PATTERN:
		case FIELD:
		case TOKEN:
			return true;
		default:
			return false;
	}
}

function extractFactoredChoiceBody(
	members: Rule<'link'>[],
	seqs: Rule<'link'>[][],
	prefixLen: number,
	suffixLen: number
): { prefix: Rule<'link'>[]; suffix: Rule<'link'>[]; nonEmpty: Rule<'link'>[]; hasEmpty: boolean } {
	const prefix = seqs[0]!.slice(0, prefixLen);
	const suffix = prefixLen < seqs[0]!.length ? seqs[0]!.slice(seqs[0]!.length - suffixLen) : [];
	let hasEmpty = false;
	const nonEmpty: Rule<'link'>[] = [];
	for (let i = 0; i < members.length; i++) {
		const m = members[i]!;
		const s = seqs[i]!;
		const body = s.slice(prefixLen, s.length - suffixLen);
		if (body.length === 0) {
			hasEmpty = true;
			continue;
		}
		const bodyRule: Rule<'link'> = body.length === 1 ? body[0]! : { type: SEQ, members: body };
		nonEmpty.push(m.type === VARIANT ? { type: VARIANT, name: m.name, content: bodyRule } : bodyRule);
	}
	return { prefix, suffix, nonEmpty, hasEmpty };
}

export function factorChoiceBranches(rule: Rule<'link'>, _ctx?: NormalizeCtx): Rule<'link'> {
	switch (rule.type) {
		case CHOICE: {
			const members = rule.members.map((m) => factorChoiceBranches(m));
			const unwrapped = members.map((m) => (m.type === VARIANT ? m.content : m));
			// Bare atoms normalized to single-member seqs for uniform factoring.
			const canFactor = unwrapped.length >= 2 && unwrapped.every((b) => b.type === SEQ || isAtomForFactoring(b));
			if (!canFactor) return { ...rule, members };
			const seqs = unwrapped.map((b) => (b.type === SEQ ? (b as SeqRule<'link'>).members : [b]));
			const prefixLen = findCommonPrefix(seqs);
			const suffixLen = findCommonSuffix(seqs, prefixLen);
			if (prefixLen === 0 && suffixLen === 0) return { ...rule, members };
			const { prefix, suffix, nonEmpty, hasEmpty } = extractFactoredChoiceBody(members, seqs, prefixLen, suffixLen);
			if (nonEmpty.length === 0) {
				// Every branch was empty → prefix/suffix already cover it.
				return outerFromParts(prefix, suffix);
			}
			// Spread `rule` (the factored choice) to preserve separator/multiplicity/
			// etc., then override only `members`. When there's exactly one branch,
			// skip the choice wrapper (shape is already correct).
			const core: Rule<'link'> = nonEmpty.length === 1 ? nonEmpty[0]! : { ...rule, type: CHOICE, members: nonEmpty };
			const inner: Rule<'link'> = hasEmpty ? { type: OPTIONAL, content: core } : core;
			const outerMembers: Rule<'link'>[] = [...prefix, inner, ...suffix];
			return outerMembers.length === 1 ? outerMembers[0]! : { type: SEQ, members: outerMembers };
		}
		case SEQ: {
			const members = rule.members.map((m) => factorChoiceBranches(m));
			return { ...rule, members };
		}
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case FIELD:
		case VARIANT:
		case GROUP:
			return { ...rule, content: factorChoiceBranches(rule.content) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// dedupeSeqMembers
// ---------------------------------------------------------------------------

export function dedupeSeqMembers(rule: Rule<'link'>, _ctx?: NormalizeCtx): Rule<'link'> {
	switch (rule.type) {
		case SEQ: {
			const members = rule.members.map((m) => dedupeSeqMembers(m));
			const deduped: Rule<'link'>[] = [];
			for (const m of members) {
				const prev = deduped[deduped.length - 1];
				if (prev && rulesEqual(prev, m)) continue;
				deduped.push(m);
			}
			return { ...rule, members: deduped };
		}
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => dedupeSeqMembers(m)) };
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case FIELD:
		case VARIANT:
		case GROUP:
			return { ...rule, content: dedupeSeqMembers(rule.content) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// inlineSingleUseHidden
// ---------------------------------------------------------------------------

function inlineSingleUseHidden(
	rules: Record<string, Rule<'link'>>,
	ctx?: NormalizeCtx,
	preserveKinds?: ReadonlySet<string>
): Record<string, Rule<'link'>> {
	// Work on a shallow copy — we mutate entries and delete keys.
	// ctx is currently unused-but-uniform: it is threaded so the
	// future trace wrapper (#14) can intercept all normalize passes.
	void ctx;
	const work: Record<string, Rule<'link'>> = { ...rules };
	iterateInliningToFixedPoint(work, preserveKinds);
	return work;
}

function iterateInliningToFixedPoint(work: Record<string, Rule<'link'>>, preserveKinds?: ReadonlySet<string>): void {
	for (let pass = 0; pass < 4; pass++) {
		const refCounts = countReferences(work);
		let changed = false;
		for (const [name, rule] of Object.entries(work)) {
			// Only hidden helpers are candidates.
			if (!name.startsWith('_')) continue;
			if (isStructurallyMeaningfulHiddenRule(rule)) continue;
			// Pattern-replacement kinds are preserved as distinct rules so
			// downstream phases can treat them as atomic grouping units.
			if (preserveKinds?.has(name)) continue;
			const uses = refCounts.get(name) ?? 0;
			if (uses !== 1) continue;
			if (spliceHiddenRuleIntoSingleParent(work, name, rule)) {
				changed = true;
			}
		}
		if (!changed) break;
	}
}

function isTerminalShape(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		// PR-P: ENUM case removed — isEnumChoiceRule guard in CHOICE arm handles this.
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
		case SUPERTYPE:
		case GROUP:
			return false; // already has a structural classification

		case FIELD:
			return false; // a field means it's a branch

		case SYMBOL:
		case 'supertype' as never:
			return false; // a symbol means it carries children

		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			// Bare terminals don't need wrapping — they're already leaf-shaped
			// at the point Assemble inspects them. We only wrap composed
			// terminal structures.
			return false;

		case SEQ:
			return rule.members.every(isTerminalShape_allowBareTerm);
		case CHOICE:
			// PR-P: enum-shaped choices (all-STRING members) are classified as enum,
			// not terminal — guard here to prevent double-wrapping.
			if (isEnumChoiceRule(rule)) return false;
			return rule.members.every(isTerminalShape_allowBareTerm);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
			return isTerminalShape_allowBareTerm(rule.content);
		case VARIANT:
			return isTerminalShape_allowBareTerm(rule.content);
		case ALIAS:
		case TOKEN:
			// Should be resolved by Link, but handle defensively
			return isTerminalShape_allowBareTerm(rule.content);
	}
	return false;
}

function isTerminalShape_allowBareTerm(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		// PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE arm above.
		// All-STRING ChoiceRules are terminal-like but classified as enum, not terminal.
		case FIELD:
			return false;
		case SYMBOL:
			return false;
		case SUPERTYPE:
			return false;
		case GROUP:
			return false;
		case SEQ:
		case CHOICE:
			return rule.members.every(isTerminalShape_allowBareTerm);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
			return isTerminalShape_allowBareTerm(rule.content);
		case VARIANT:
			return isTerminalShape_allowBareTerm(rule.content);
		case ALIAS:
		case TOKEN:
			return isTerminalShape_allowBareTerm(rule.content);
	}
	return false;
}

function isStructurallyMeaningfulHiddenRule(rule: Rule<'link'>): boolean {
	// PR-P: rule.type === ENUM replaced with isEnumChoiceRule.
	// PR-P Task 2: rule.type === TERMINAL replaced with isTerminalShape — TerminalRule deleted;
	// terminal-shape rules now classify by shape at Assemble, but must still be preserved
	// during normalize so they remain top-level kinds for Assemble to dispatch on.
	return rule.type === SUPERTYPE || isEnumChoiceRule(rule) || isTerminalShape(rule) || rule.type === GROUP;
}

function spliceHiddenRuleIntoSingleParent(
	work: Record<string, Rule<'link'>>,
	name: string,
	rule: Rule<'link'>
): boolean {
	for (const [parentName, parentRule] of Object.entries(work)) {
		if (parentName === name) continue;
		const replaced = replaceSymbolRef(parentRule, name, rule);
		if (replaced !== parentRule) {
			work[parentName] = replaced;
			delete work[name];
			return true;
		}
	}
	return false;
}

function countReferences(rules: Record<string, Rule<'link'>>): Map<string, number> {
	const counts = new Map<string, number>();
	for (const rule of Object.values(rules)) {
		walkSymbols(rule, (name) => {
			counts.set(name, (counts.get(name) ?? 0) + 1);
		});
	}
	return counts;
}

function walkSymbols(rule: Rule<'link'>, visit: (name: string) => void): void {
	switch (rule.type) {
		case SYMBOL:
			visit(rule.name);
			return;
		case SEQ:
		case CHOICE:
			for (const m of rule.members) walkSymbols(m, visit);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case FIELD:
		case VARIANT:
		case GROUP:
			walkSymbols(rule.content, visit);
			return;
		case SUPERTYPE:
			for (const sub of rule.subtypes) visit(sub);
			return;
	}
}

function replaceSymbolRef(rule: Rule<'link'>, targetName: string, targetRule: Rule<'link'>): Rule<'link'> {
	switch (rule.type) {
		case SYMBOL:
			if (rule.name === targetName) return targetRule;
			return rule;
		case SEQ: {
			let changed = false;
			const members = rule.members.map((m) => {
				const r = replaceSymbolRef(m, targetName, targetRule);
				if (r !== m) changed = true;
				return r;
			});
			return changed ? { ...rule, members } : rule;
		}
		case CHOICE: {
			let changed = false;
			const members = rule.members.map((m) => {
				const r = replaceSymbolRef(m, targetName, targetRule);
				if (r !== m) changed = true;
				return r;
			});
			return changed ? { ...rule, members } : rule;
		}
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case FIELD:
		case VARIANT:
		case GROUP: {
			const inner = replaceSymbolRef(rule.content, targetName, targetRule);
			return inner === rule.content ? rule : { ...rule, content: inner };
		}
		default:
			return rule;
	}
}

export function collapseWrappers(rule: Rule<'link'>, _ctx?: NormalizeCtx): Rule<'link'> {
	switch (rule.type) {
		case OPTIONAL: {
			const inner = collapseWrappers(rule.content);
			// optional(optional(x)) → optional(x)
			if (inner.type === OPTIONAL) return inner;
			// optional(repeat(x)) → repeat(x) — repeat already matches zero
			if (inner.type === REPEAT) return inner;
			return { ...rule, content: inner };
		}
		case REPEAT: {
			const inner = collapseWrappers(rule.content);
			// repeat(repeat(x)) → repeat(x)
			if (inner.type === REPEAT && !rule.separator && !inner.separator) return inner;
			// repeat(optional(x)) → repeat(x) — the outer repeat already
			// handles zero occurrences.
			if (inner.type === OPTIONAL) return { ...rule, content: inner.content };
			return { ...rule, content: inner };
		}
		case SEQ: {
			const members = rule.members.map((m) => collapseWrappers(m));
			if (members.length === 1) {
				const survivor = members[0]!;
				const carried = withAttrsFrom(rule, survivor);
				const outerMult = (rule as { multiplicity?: LeafMultiplicity }).multiplicity;
				// Only combine multiplicities when the seq itself carries an explicit one;
				// otherwise withAttrsFrom already transferred it (absent-only) and we
				// must not stamp 'single' onto nodes that had no explicit multiplicity.
				if (outerMult !== undefined) {
					const combined = combineMultiplicity(
						outerMult,
						(survivor as { multiplicity?: LeafMultiplicity }).multiplicity
					);
					// Only stamp when non-default (single → undefined per combineMultiplicity).
					if (combined !== undefined) return { ...carried, multiplicity: combined } as unknown as Rule<'link'>;
				}
				return carried;
			}
			return { ...rule, members };
		}
		case CHOICE: {
			const members = rule.members.map((m) => collapseWrappers(m));
			if (members.length === 1) return withAttrsFrom(rule, members[0]!);
			return { ...rule, members };
		}
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return { ...rule, content: collapseWrappers(rule.content) };
		default:
			return rule;
	}
}

function outerFromParts(prefix: Rule<'link'>[], suffix: Rule<'link'>[]): Rule<'link'> {
	const members = [...prefix, ...suffix];
	if (members.length === 0) {
		// Unreachable: factorChoiceBranches early-returns on
		// prefixLen===0 && suffixLen===0, so an all-empty factoring
		// never calls this.
		throw new Error('outerFromParts: no prefix or suffix to wrap');
	}
	if (members.length === 1) return members[0]!;
	return { type: SEQ, members };
}

// ---------------------------------------------------------------------------
// rulesEqual — structural equality
// ---------------------------------------------------------------------------

export function rulesEqual(a: Rule<'link'>, b: Rule<'link'>): boolean {
	if (a.type !== b.type) return false;

	switch (a.type) {
		case STRING:
			return a.value === (b as typeof a).value;
		case PATTERN:
			return a.value === (b as typeof a).value;
		case SYMBOL:
			// Include aliasedFrom: two symbols with the same `.name` but
			// different alias provenance point at the same kind but carry
			// different drillAs metadata. Treating them as equal lets
			// factoring collapse to one branch and silently drop the
			// aliasSources entry from the other (see
			// node-model.json5 diff for `_index_signature_colon.name`).
			return a.name === (b as typeof a).name && a.aliasedFrom === (b as typeof a).aliasedFrom;
		case SEQ:
			return (
				a.members.length === (b as typeof a).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]!))
			);
		case CHOICE:
			return (
				a.members.length === (b as typeof a).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]!))
			);
		case OPTIONAL:
			return rulesEqual(a.content, (b as typeof a).content);
		case REPEAT:
			// `.separator` is the nested {value, trailing?, leading?} fact
			// (PR-S) — a freshly-allocated wrapper object per lift call, so
			// `===` incorrectly treats two structurally-identical separators
			// (e.g. two `repeat(seq(X, ','))`-shaped occurrences) as unequal.
			// Delegate to the shared SSOT comparator instead.
			return (
				rulesEqual(a.content, (b as typeof a).content) && separatorFactsEqual(a.separator, (b as typeof a).separator)
			);
		case FIELD:
			return a.name === (b as typeof a).name && rulesEqual(a.content, (b as typeof a).content);
		case VARIANT:
			return a.name === (b as typeof a).name && rulesEqual(a.content, (b as typeof a).content);
		// PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to default.
		case SUPERTYPE:
			return a.name === (b as typeof a).name;
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		default:
			return JSON.stringify(a) === JSON.stringify(b);
	}
}

// ---------------------------------------------------------------------------
// factorSeqChoice — extract common prefix/suffix from choice branches
// ---------------------------------------------------------------------------

export function factorSeqChoice(branches: Rule<'link'>[]): Rule<'link'>[] {
	// Check if all branches are seqs
	const seqs = branches.map((b) => (b.type === SEQ ? b.members : [b]));

	const prefixLen = findCommonPrefix(seqs);
	if (prefixLen === 0) return branches;

	const suffixLen = findCommonSuffix(seqs, prefixLen);

	// Extract factored branches (the parts that differ)
	return branches.map((b): Rule<'link'> => {
		if (b.type === SEQ) {
			const members = b.members.slice(prefixLen, b.members.length - suffixLen);
			return members.length === 1 ? members[0]! : { type: SEQ, members };
		}
		return b;
	});
}

function findCommonPrefix(seqs: Rule<'link'>[][]): number {
	if (seqs.length === 0) return 0;
	const first = seqs[0]!;
	let len = 0;
	for (let i = 0; i < first.length; i++) {
		if (seqs.every((s) => i < s.length && rulesEqual(s[i]!, first[i]!))) {
			len++;
		} else break;
	}
	return len;
}

function findCommonSuffix(seqs: Rule<'link'>[][], prefixLen: number): number {
	if (seqs.length === 0) return 0;
	const first = seqs[0]!;
	let len = 0;
	for (let i = 0; i < first.length - prefixLen; i++) {
		const fi = first.length - 1 - i;
		if (
			seqs.every((s) => {
				const si = s.length - 1 - i;
				return si >= prefixLen && rulesEqual(s[si]!, first[fi]!);
			})
		) {
			len++;
		} else break;
	}
	return len;
}

// wrapVariants / deduplicateVariants / nameVariant / tokenToName all
// moved to compiler/link.ts — they're classification, not simplification.
// Re-export from there if test files or callers still need them.
export { tokenToName } from './link.ts';
