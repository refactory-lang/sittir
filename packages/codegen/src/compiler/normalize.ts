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

import type { Rule, SeqRule } from './rule.ts';
import { isChoice } from './rule.ts';
import type { LinkedGrammar, OptimizedGrammar } from './types.ts';
import { computeSimplifiedRules, resetSlotGroupingDiagnostics } from './simplify.ts';
import { applyWrapperDeletion } from './wrapper-deletion.ts';
import { withAttrsFrom, combineMultiplicity, type LeafMultiplicity } from './rule-attrs.ts';
import { deriveComplexAliasTargetHidden } from './evaluate.ts';
import type { NormalizeCtx } from './transforms.ts';

/**
 * Run the full ordered pipeline of non-lossy normalization passes over the
 * raw rule map from the linked grammar.
 *
 * @param rawRules - The rule map produced by the Link phase.
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
function dbgChoiceId(label: string, rules: Record<string, Rule>): void {
	const target = process.env.DBG_ID_LOSS;
	if (!target) return;
	const r = rules[target];
	if (!r) return;
	const find = (x: Rule): string | undefined => {
		if (x.type === 'choice') return (x as { id?: string }).id ?? '<NONE>';
		const xs = x as { members?: readonly Rule[]; content?: Rule };
		for (const m of xs.members ?? []) {
			const g = find(m);
			if (g) return g;
		}
		if (xs.content) return find(xs.content);
		return undefined;
	};
	process.stderr.write(`[DBG_ID] ${label}: choice id=${find(r) ?? '<no-choice>'}\n`);
}

/**
 * §D-2a — structural `keepRef` predicate for the normalize inline hoist.
 *
 * A hidden seq/group helper `_x` is a fold candidate (its body may be spliced
 * into the referring parent) ONLY when it is referenced exactly once AND no
 * VISIBLE parse-kind rule's body resolves to it. `keepRef` is the complement:
 * the set of hidden kinds whose body ref must SURVIVE as a `symbol(_x)` (→
 * storageKind), because either
 *   - `refcount(_x) > 1` — the body is shared by several parents (inlining
 *     would duplicate it and lose the single shared kind), or
 *   - `hasVisibleTwin(_x)` — a parse-kind rule `x` (no leading `_`) is/contains
 *     `symbol(_x)` (e.g. `call_signature` ⇒ keep `_call_signature`); the twin
 *     is the surfaced CST kind and `_x` is its body.
 *
 * PURE rule traversal — derives ONLY from the rule tree
 * (`feedback_metadata_not_behavior`). Does NOT read `contentAliasedTo` /
 * `contentAliasedFrom` (those maps are empty on every grammar today and are
 * diagnostic-only). Invariant under folding: splices RELOCATE `symbol` refs
 * rather than remove them, so refcounts are conserved across passes.
 */
export function computeKeepRef(rules: Readonly<Record<string, Rule>>): Set<string> {
	const refcount = new Map<string, number>();
	// Hidden kinds `_x` that have a VISIBLE NAME-TWIN: a parse-kind rule named
	// exactly `x` (leading `_` stripped) whose body is/contains `symbol(_x)`.
	// The twin is the surfaced CST kind; `_x` is its shared body. (A visible
	// rule of a DIFFERENT name referencing `_x` does NOT twin it — that is the
	// ordinary single-use fold case, e.g. `extends_clause` → `_extends_clause_single`.)
	const twinned = new Set<string>();

	const isHidden = (name: string): boolean => name.startsWith('_');

	const walk = (rule: Rule, ownerTwinTarget: string | undefined): void => {
		if (rule.type === 'symbol') {
			const name = rule.name;
			if (isHidden(name)) {
				refcount.set(name, (refcount.get(name) ?? 0) + 1);
				if (ownerTwinTarget !== undefined && name === ownerTwinTarget) twinned.add(name);
			}
			return;
		}
		const xs = rule as { members?: readonly Rule[]; content?: Rule };
		for (const m of xs.members ?? []) walk(m, ownerTwinTarget);
		if (xs.content) walk(xs.content, ownerTwinTarget);
	};

	for (const [name, rule] of Object.entries(rules)) {
		// A visible rule `x` is the potential name-twin owner of hidden `_x`.
		const ownerTwinTarget = isHidden(name) ? undefined : `_${name}`;
		walk(rule, ownerTwinTarget);
	}

	const keep = new Set<string>();
	for (const [name, count] of refcount) {
		if (count > 1 || twinned.has(name)) keep.add(name);
	}
	return keep;
}

function applyNormalizationPasses(
	rawRules: Record<string, Rule>,
	preserveKinds?: ReadonlySet<string>,
	ctx?: NormalizeCtx
): Record<string, Rule> {
	let rules: Record<string, Rule> = {};
	for (const [name, rule] of Object.entries(rawRules)) {
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

export function normalizeGrammar(
	linked: LinkedGrammar,
	ctx?: NormalizeCtx
): OptimizedGrammar {
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
	const rules = applyNormalizationPasses(linked.rules, preserveKinds.size > 0 ? preserveKinds : undefined, ctx);
	const renderRules = applyWrapperDeletion(rules);

	// Build a base variant skip-set from polymorphVariants metadata.
	// `polymorphVariants` records every `variant('x')` override as
	// `{parent, child}` — these kinds are already resolved by variant dispatch;
	// flagging them as multi-slot seqs in the diagnostic would be a false positive.
	const variantSkip = extraPolymorphSkip.size === 0 ? new Set<string>() : new Set<string>(extraPolymorphSkip);
	for (const pv of linked.polymorphVariants ?? []) {
		variantSkip.add(pv.parent);
		variantSkip.add(pv.child);
	}

	const simplifiedRules = computeSimplifiedRules(renderRules, inlineKinds, variantSkip, ctx);

	// Alias-body kinds: thread the alias-target bodies through the same pipeline
	// so renderRules / simplifiedRules cover them too. Eliminates the
	// assemble.ts simplifyRule(assemblyRule) fallback (PR1's TODO PR2).
	if (linked.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule> = Object.fromEntries(linked.topLevelAliasBodies);
		const aliasBodiesNormalized = applyNormalizationPasses(aliasBodiesRaw, preserveKinds.size > 0 ? preserveKinds : undefined, ctx);
		const aliasBodiesRender = applyWrapperDeletion(aliasBodiesNormalized);
		const aliasBodiesSimplified = computeSimplifiedRules(aliasBodiesRender, inlineKinds, variantSkip, ctx);
		for (const [kind, rule] of Object.entries(aliasBodiesRender)) {
			renderRules[kind] = rule;
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}

	return {
		name: linked.name,
		rules,
		renderRules,
		simplifiedRules,
		supertypes: linked.supertypes,
		word: linked.word,
		externals: linked.externals,
		derivations: linked.derivations,
		aliasedHiddenKinds: linked.aliasedHiddenKinds,
		topLevelAliasBodies: linked.topLevelAliasBodies,
		polymorphVariants: linked.polymorphVariants,
		refineForms: linked.refineForms,
		parentAliasedKinds: linked.parentAliasedKinds,
		visibleAliasTargets: linked.visibleAliasTargets
	};
}

// ---------------------------------------------------------------------------
// fanOutSeqChoices
// ---------------------------------------------------------------------------

/**
 * Distribute a `seq` over an inner `choice` so downstream passes see
 * top-level choices:
 *
 *   seq(a, choice(b, c), d) → choice(seq(a, b, d), seq(a, c, d))
 *
 * Only applies when the seq contains EXACTLY ONE choice member —
 * distributing over multiple choices multiplies branches
 * combinatorially and rarely produces useful shapes. Recurses
 * through `optional`, `repeat`, `field`, `variant`, `clause`,
 * `group`, `token` wrappers. Non-lossy.
 */
export function fanOutSeqChoices(rule: Rule, _ctx?: NormalizeCtx): Rule {
	switch (rule.type) {
		case 'seq': {
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
			const branches: Rule[] = choice.members.map((branch) => {
				const inner = branch.type === 'variant' ? branch.content : branch;
				const seqMembers = [...before, inner, ...after];
				if (seqMembers.length === 1) return seqMembers[0]!;
				// Preserve variant labels by re-wrapping.
				const flat: Rule = { type: 'seq', members: seqMembers };
				return branch.type === 'variant' ? { type: 'variant', name: branch.name, content: flat } : flat;
			});
			// The fanned choice replaces this seq 1:1 — carry the inner choice's
			// separator/multiplicity/etc. attrs (so comma-separated lists keep
			// their separator), then override id with the seq's id so downstream
			// slot resolution (slotByRuleId) still finds it. A fresh
			// `{ type: 'choice', ... }` here drops both the id and the separator
			// (the source of the UNRESOLVED slotByRuleId misses AND the
			// space-join regression on type_arguments / future_import_statement).
			return { ...choice, type: 'choice', members: branches, ...(rule.id !== undefined ? { id: rule.id } : {}) };
		}
		case 'choice': {
			const members = rule.members.map((m) => fanOutSeqChoices(m));
			return { ...rule, members };
		}
		case 'optional':
		case 'repeat':
		case 'token':
		case 'field':
		case 'variant':
		case 'group':
			return { ...rule, content: fanOutSeqChoices(rule.content) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// factorChoiceBranches
// ---------------------------------------------------------------------------

/**
 * Identify rules that can be normalized as single-member seqs for
 * prefix/suffix factoring purposes.
 *
 * @param rule - A choice branch (already variant-unwrapped).
 * @returns `true` when the rule is a leaf / simple wrapper that `findCommonPrefix` can reliably compare against a seq member.
 * @remarks
 * Symbol / string / pattern are grammar leaves — exact structural equality
 * via `rulesEqual` behaves predictably. `field` and `token` carry
 * structural identity but are single-slot wrappers; treating them as
 * single-member seqs lets `choice(seq(A, B), A)` factor to `seq(A,
 * optional(B))` even when one branch is the bare atom rather than a
 * `seq([atom])`.
 *
 * Excluded: `optional`, `repeat`, `choice`, `variant`, `clause`, `group`,
 * `supertype`, `enum`, `terminal`, `indent`, `dedent`,
 * `newline`. Those either carry composite structure that the factor
 * extractor would mis-align, or already represent the "zero-or-more"
 * semantics that factoring produces.
 */
function isAtomForFactoring(rule: Rule): boolean {
	switch (rule.type) {
		case 'symbol':
		case 'string':
		case 'pattern':
		case 'field':
		case 'token':
			return true;
		default:
			return false;
	}
}

/**
 * Partition the bodies of factored choice branches by emptiness and build the
 * shared prefix and suffix slices.
 *
 * @param members - The original choice branch rules (may include variant wrappers).
 * @param seqs - Each branch's member list, already unwrapped from variant.
 * @param prefixLen - Number of leading elements shared across all branches.
 * @param suffixLen - Number of trailing elements shared across all branches.
 * @returns The common prefix, suffix, non-empty body rules, and an emptiness flag.
 * @remarks
 * `choice(seq(a,b,c), seq(a,c))` factors prefix=[a], suffix=[c], bodies=[[b], []];
 * the empty body means "no b" → the caller wraps the inner choice in `optional`.
 * Variant labels on branches are preserved in the returned nonEmpty rules.
 */
function extractFactoredChoiceBody(
	members: Rule[],
	seqs: Rule[][],
	prefixLen: number,
	suffixLen: number
): { prefix: Rule[]; suffix: Rule[]; nonEmpty: Rule[]; hasEmpty: boolean } {
	const prefix = seqs[0]!.slice(0, prefixLen);
	const suffix = prefixLen < seqs[0]!.length ? seqs[0]!.slice(seqs[0]!.length - suffixLen) : [];
	let hasEmpty = false;
	const nonEmpty: Rule[] = [];
	for (let i = 0; i < members.length; i++) {
		const m = members[i]!;
		const s = seqs[i]!;
		const body = s.slice(prefixLen, s.length - suffixLen);
		if (body.length === 0) {
			hasEmpty = true;
			continue;
		}
		const bodyRule: Rule = body.length === 1 ? body[0]! : { type: 'seq', members: body };
		nonEmpty.push(m.type === 'variant' ? { type: 'variant', name: m.name, content: bodyRule } : bodyRule);
	}
	return { prefix, suffix, nonEmpty, hasEmpty };
}

/**
 * Pull common prefixes / suffixes out of a choice of seqs:
 *
 *   choice(seq(a, b, x), seq(a, b, y), seq(a, b, z))
 *      → seq(a, b, choice(x, y, z))
 *
 * Uses `findCommonPrefix` / `findCommonSuffix` (structural equality
 * via `rulesEqual`). Only applies at the top level of a `choice`;
 * recurses through wrappers for nested choices. Non-lossy.
 */
export function factorChoiceBranches(rule: Rule, _ctx?: NormalizeCtx): Rule {
	switch (rule.type) {
		case 'choice': {
			const members = rule.members.map((m) => factorChoiceBranches(m));
			const unwrapped = members.map((m) => (m.type === 'variant' ? m.content : m));
			// Bare atoms normalized to single-member seqs for uniform factoring.
			const canFactor = unwrapped.length >= 2 && unwrapped.every((b) => b.type === 'seq' || isAtomForFactoring(b));
			if (!canFactor) return { ...rule, members };
			const seqs = unwrapped.map((b) => (b.type === 'seq' ? (b as SeqRule).members : [b]));
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
			const core: Rule =
				nonEmpty.length === 1
					? nonEmpty[0]!
					: { ...rule, type: 'choice', members: nonEmpty };
			const inner: Rule = hasEmpty ? { type: 'optional', content: core } : core;
			const outerMembers: Rule[] = [...prefix, inner, ...suffix];
			return outerMembers.length === 1 ? outerMembers[0]! : { type: 'seq', members: outerMembers };
		}
		case 'seq': {
			const members = rule.members.map((m) => factorChoiceBranches(m));
			return { ...rule, members };
		}
		case 'optional':
		case 'repeat':
		case 'token':
		case 'field':
		case 'variant':
		case 'group':
			return { ...rule, content: factorChoiceBranches(rule.content) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// dedupeSeqMembers
// ---------------------------------------------------------------------------

/**
 * Collapse adjacent duplicates inside a `seq`:
 *
 *   seq(x, x, y) → seq(x, y)
 *
 * Uses `rulesEqual` for structural equality. Only collapses
 * adjacent duplicates; non-adjacent duplicates are almost always
 * intentional repetition in the grammar.
 */
export function dedupeSeqMembers(rule: Rule, _ctx?: NormalizeCtx): Rule {
	switch (rule.type) {
		case 'seq': {
			const members = rule.members.map((m) => dedupeSeqMembers(m));
			const deduped: Rule[] = [];
			for (const m of members) {
				const prev = deduped[deduped.length - 1];
				if (prev && rulesEqual(prev, m)) continue;
				deduped.push(m);
			}
			return { ...rule, members: deduped };
		}
		case 'choice':
			return { ...rule, members: rule.members.map((m) => dedupeSeqMembers(m)) };
		case 'optional':
		case 'repeat':
		case 'token':
		case 'field':
		case 'variant':
		case 'group':
			return { ...rule, content: dedupeSeqMembers(rule.content) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// inlineSingleUseHidden
// ---------------------------------------------------------------------------

/**
 * Inline hidden (`_`-prefixed) rules that are referenced from exactly
 * one parent. The parent's symbol ref is replaced with the hidden
 * rule's content; the hidden entry is deleted from the map.
 *
 * Iterates to a fixed point: inlining can expose new single-use
 * refs when nested helpers reference each other. Rules classified
 * as `supertype`, `enum`, `terminal`, or `group` are
 * skipped — those already carry explicit structural meaning that
 * downstream classification relies on. Only raw `seq` / `choice` /
 * `optional` / `repeat` helpers get inlined.
 *
 * Architecture claim (per discussion): if the rule graph has no
 * unresolved references, inlining is observationally a no-op —
 * field / child derivations walk the resulting tree directly and
 * produce the same downstream shape whether the helper exists as
 * its own entry or as an expansion in its parent.
 */
function inlineSingleUseHidden(rules: Record<string, Rule>, ctx?: NormalizeCtx, preserveKinds?: ReadonlySet<string>): Record<string, Rule> {
	// Work on a shallow copy — we mutate entries and delete keys.
	// ctx is currently unused-but-uniform: it is threaded so the
	// future trace wrapper (#14) can intercept all normalize passes.
	void ctx;
	const work: Record<string, Rule> = { ...rules };
	iterateInliningToFixedPoint(work, preserveKinds);
	return work;
}

/**
 * Repeatedly scan the rule map for single-use hidden rules and inline them
 * into their one parent, iterating until no further inlining is possible.
 *
 * @param work - The mutable rule map to update in place.
 * @remarks
 * One pass is usually enough; up to four iterations catch cascading
 * opportunities where a parent being inlined exposes a new single-use child.
 * The loop breaks early when a full pass produces no changes.
 */
function iterateInliningToFixedPoint(work: Record<string, Rule>, preserveKinds?: ReadonlySet<string>): void {
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

/**
 * Determine whether a hidden rule carries explicit structural classification
 * that downstream phases rely on, making it ineligible for inlining.
 *
 * @param rule - The rule to test.
 * @returns `true` when the rule must be preserved as its own map entry.
 * @remarks
 * Rules of type `supertype`, `enum`, `terminal`, and `group`
 * already have explicit structural meaning. Only raw `seq`, `choice`,
 * `optional`, and `repeat` helpers get inlined.
 */
function isStructurallyMeaningfulHiddenRule(rule: Rule): boolean {
	return (
		rule.type === 'supertype' ||
		rule.type === 'enum' ||
		rule.type === 'terminal' ||
		rule.type === 'group'
	);
}

/**
 * Find the single parent that holds a symbol reference to a hidden rule,
 * replace the symbol ref with the hidden rule's body, and delete the hidden
 * entry from the map.
 *
 * @param work - The mutable rule map to update in place.
 * @param name - The name of the hidden rule to inline.
 * @param rule - The hidden rule's current content.
 * @returns `true` when a parent was found and the inline succeeded.
 */
function spliceHiddenRuleIntoSingleParent(work: Record<string, Rule>, name: string, rule: Rule): boolean {
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

/**
 * Count outgoing references per kind across the rule map. Walks
 * symbol refs (via `walkSymbols`) and also includes names carried
 * in `SupertypeRule.subtypes` — those aren't wrapped in a symbol
 * node but downstream classification needs the entry to survive.
 */
function countReferences(rules: Record<string, Rule>): Map<string, number> {
	const counts = new Map<string, number>();
	for (const rule of Object.values(rules)) {
		walkSymbols(rule, (name) => {
			counts.set(name, (counts.get(name) ?? 0) + 1);
		});
	}
	return counts;
}

function walkSymbols(rule: Rule, visit: (name: string) => void): void {
	switch (rule.type) {
		case 'symbol':
			visit(rule.name);
			return;
		case 'seq':
		case 'choice':
			for (const m of rule.members) walkSymbols(m, visit);
			return;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'token':
		case 'field':
		case 'variant':
		case 'group':
		case 'terminal':
			walkSymbols(rule.content, visit);
			return;
		case 'supertype':
			for (const sub of rule.subtypes) visit(sub);
			return;
	}
}

/**
 * Replace every symbol ref to `targetName` inside `rule` with the
 * content of `targetRule`. Returns the same reference when nothing
 * changed so callers can do identity comparison.
 */
function replaceSymbolRef(rule: Rule, targetName: string, targetRule: Rule): Rule {
	switch (rule.type) {
		case 'symbol':
			if (rule.name === targetName) return targetRule;
			return rule;
		case 'seq': {
			let changed = false;
			const members = rule.members.map((m) => {
				const r = replaceSymbolRef(m, targetName, targetRule);
				if (r !== m) changed = true;
				return r;
			});
			return changed ? { ...rule, members } : rule;
		}
		case 'choice': {
			let changed = false;
			const members = rule.members.map((m) => {
				const r = replaceSymbolRef(m, targetName, targetRule);
				if (r !== m) changed = true;
				return r;
			});
			return changed ? { ...rule, members } : rule;
		}
		case 'optional':
		case 'repeat':
		case 'token':
		case 'field':
		case 'variant':
		case 'group': {
			const inner = replaceSymbolRef(rule.content, targetName, targetRule);
			return inner === rule.content ? rule : { ...rule, content: inner };
		}
		default:
			return rule;
	}
}

/**
 * Recursive wrapper-collapse pass. Traverses the rule tree
 * bottom-up and rewrites degenerate wrappers into their simpler
 * equivalents. Non-lossy — every collapse preserves the set of
 * strings the rule matches.
 */
export function collapseWrappers(rule: Rule, _ctx?: NormalizeCtx): Rule {
	switch (rule.type) {
		case 'optional': {
			const inner = collapseWrappers(rule.content);
			// optional(optional(x)) → optional(x)
			if (inner.type === 'optional') return inner;
			// optional(repeat(x)) → repeat(x) — repeat already matches zero
			if (inner.type === 'repeat') return inner;
			return { ...rule, content: inner };
		}
		case 'repeat': {
			const inner = collapseWrappers(rule.content);
			// repeat(repeat(x)) → repeat(x)
			if (inner.type === 'repeat' && !rule.separator && !inner.separator) return inner;
			// repeat(optional(x)) → repeat(x) — the outer repeat already
			// handles zero occurrences.
			if (inner.type === 'optional') return { ...rule, content: inner.content };
			return { ...rule, content: inner };
		}
		case 'seq': {
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
						(survivor as { multiplicity?: LeafMultiplicity }).multiplicity,
					);
					// Only stamp when non-default (single → undefined per combineMultiplicity).
					if (combined !== undefined) return { ...carried, multiplicity: combined } as Rule;
				}
				return carried;
			}
			return { ...rule, members };
		}
		case 'choice': {
			const members = rule.members.map((m) => collapseWrappers(m));
			if (members.length === 1) return withAttrsFrom(rule, members[0]!);
			return { ...rule, members };
		}
		case 'field':
		case 'variant':
		case 'group':
		case 'token':
			return { ...rule, content: collapseWrappers(rule.content) };
		default:
			return rule;
	}
}

function outerFromParts(prefix: Rule[], suffix: Rule[]): Rule {
	const members = [...prefix, ...suffix];
	if (members.length === 0) {
		// Unreachable: factorChoiceBranches early-returns on
		// prefixLen===0 && suffixLen===0, so an all-empty factoring
		// never calls this.
		throw new Error('outerFromParts: no prefix or suffix to wrap');
	}
	if (members.length === 1) return members[0]!;
	return { type: 'seq', members };
}

// ---------------------------------------------------------------------------
// rulesEqual — structural equality
// ---------------------------------------------------------------------------

export function rulesEqual(a: Rule, b: Rule): boolean {
	if (a.type !== b.type) return false;

	switch (a.type) {
		case 'string':
			return a.value === (b as typeof a).value;
		case 'pattern':
			return a.value === (b as typeof a).value;
		case 'symbol':
			// Include aliasedFrom: two symbols with the same `.name` but
			// different alias provenance point at the same kind but carry
			// different drillAs metadata. Treating them as equal lets
			// factoring collapse to one branch and silently drop the
			// aliasSources entry from the other (see
			// node-model.json5 diff for `_index_signature_colon.name`).
			return a.name === (b as typeof a).name && a.aliasedFrom === (b as typeof a).aliasedFrom;
		case 'seq':
			return (
				a.members.length === (b as typeof a).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]!))
			);
		case 'choice':
			return (
				a.members.length === (b as typeof a).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]!))
			);
		case 'optional':
			return rulesEqual(a.content, (b as typeof a).content);
		case 'repeat':
			return rulesEqual(a.content, (b as typeof a).content) && a.separator === (b as typeof a).separator;
		case 'field':
			return a.name === (b as typeof a).name && rulesEqual(a.content, (b as typeof a).content);
		case 'variant':
			return a.name === (b as typeof a).name && rulesEqual(a.content, (b as typeof a).content);
		case 'enum': {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => m.value === bm[i]!.value);
		}
		case 'supertype':
			return a.name === (b as typeof a).name;
		case 'indent':
		case 'dedent':
		case 'newline':
			return true;
		default:
			return JSON.stringify(a) === JSON.stringify(b);
	}
}

// ---------------------------------------------------------------------------
// factorSeqChoice — extract common prefix/suffix from choice branches
// ---------------------------------------------------------------------------

export function factorSeqChoice(branches: Rule[]): Rule[] {
	// Check if all branches are seqs
	const seqs = branches.map((b) => (b.type === 'seq' ? b.members : [b]));

	const prefixLen = findCommonPrefix(seqs);
	if (prefixLen === 0) return branches;

	const suffixLen = findCommonSuffix(seqs, prefixLen);

	// Extract factored branches (the parts that differ)
	return branches.map((b): Rule => {
		if (b.type === 'seq') {
			const members = b.members.slice(prefixLen, b.members.length - suffixLen);
			return members.length === 1 ? members[0]! : { type: 'seq' as const, members };
		}
		return b;
	});
}

function findCommonPrefix(seqs: Rule[][]): number {
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

function findCommonSuffix(seqs: Rule[][], prefixLen: number): number {
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
export { wrapVariants, deduplicateVariants, nameVariant, tokenToName } from './link.ts';

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

const WORD_CHAR = /\w/;

export function needsSpace(prev: string, next: string): boolean {
	if (prev.length === 0 || next.length === 0) return false;
	const lastChar = prev[prev.length - 1]!;
	const firstChar = next[0]!;
	return WORD_CHAR.test(lastChar) && WORD_CHAR.test(firstChar);
}
