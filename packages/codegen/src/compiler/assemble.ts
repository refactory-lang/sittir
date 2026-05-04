/**
 * compiler/assemble.ts — Phase 4: Assemble
 *
 * First time nodes appear. All metadata (required, multiple, contentTypes,
 * detectToken, modelType) derived from the rule tree — not carried on Rule nodes.
 */

import type {
	Rule,
	PolymorphRule,
	SymbolRule,
	SeqRule,
	ChoiceRule,
	RepeatRule,
	Repeat1Rule,
	PatternRule,
	TerminalRule,
	StringRule,
	EnumRule,
	SupertypeRule
} from './rule.ts';
import type {
	OptimizedGrammar,
	NodeMap,
	SignaturePool,
	PolymorphVariant
} from './types.ts';
import { computePolymorphFormKinds } from './types.ts';
import type {
	AssembledNode,
	AssembledField,
	AssembledChild
} from './node-map.ts';
import {
	AssembledBranch,
	AssembledPolymorph,
	AssembledPattern,
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	AssembledGroup,
	AssembledMulti,
	hasAnyField,
	hasAnyChild,
	nameNode,
	isRequired,
	isMultiple,
	isNodeRef,
	isTerminalValue,
	isUnresolvedRef
} from './node-map.ts';
import {
	simplifyRule,
	inlineGroupRefs,
	extractRepeatShape,
	hoistInnerFieldsForTemplate
} from './simplify.ts';
import { compileWordMatcher } from './common.ts';

// ---------------------------------------------------------------------------
// assemble() — main entry point
// ---------------------------------------------------------------------------

export function assemble(optimized: OptimizedGrammar): NodeMap {
	const nodes = new Map<string, AssembledNode>();
	// Parents that went through Link's variant() push-down keep their
	// original rule shape but should NOT T065-promote to polymorph —
	// each variant child renders via its own kind-template.
	const variantParents = new Set(
		optimized.polymorphVariants?.map((v) => v.parent) ?? []
	);
	const variantChildrenByParent = new Map<string, string[]>();
	for (const v of optimized.polymorphVariants ?? []) {
		const existing = variantChildrenByParent.get(v.parent) ?? [];
		existing.push(`${v.parent}_${v.child}`);
		variantChildrenByParent.set(v.parent, existing);
	}

	for (const [kind, rule] of Object.entries(optimized.rules)) {
		// `inlinedRule` still uses inlineGroupRefs here because the
		// RAW rule path (for template emission + classification) isn't
		// run through simplify. Only `simplifiedRule` (derivation view)
		// picks up inlining from the simplify fixpoint.
		//
		// `hoistInnerFieldsForTemplate` then drops outer
		// `field('outer', ...)` wrappers when their content carries an
		// inner field tree-sitter would expose at the top level of the
		// parent kind. The literal-stripping / single-member-collapsing
		// work that simplify also does is intentionally NOT applied
		// here — templates need anonymous delimiters (`,`, `(`, `;`,
		// …) to surface as template text. See
		// `project_simplify_template_walker_divergence.md`.
		const inlinedRule = hoistInnerFieldsForTemplate(
			inlineGroupRefs(rule, optimized.rules)
		);
		const modelType = classifyNode(kind, inlinedRule, { variantParents });
		// `simplifiedRules[kind]` is already inlined + fixpoint-reduced
		// by `simplifyRules` in optimize — pass through as-is.
		const simplifiedRule = optimized.simplifiedRules[kind]!;
		const variantChildKinds = variantChildrenByParent.get(kind);

		switch (modelType) {
			case 'branch': {
				nodes.set(
					kind,
					new AssembledBranch(
						kind,
						inlinedRule as
							| SeqRule
							| ChoiceRule
							| RepeatRule
							| Repeat1Rule,
						simplifiedRule,
						variantChildKinds ? { variantChildKinds } : undefined
					)
				);
				break;
			}
			case 'polymorph': {
				const polyForms = derivePolymorphForms(kind, rule);
				const polySource =
					rule.type === 'polymorph'
						? rule.source === 'override'
							? 'override'
							: 'promoted'
						: 'promoted';
				const forms = buildAssembledFormGroups(kind, polyForms, polySource);
				// Forms don't get top-level nodeMap entries — they're
				// nested inside the parent polymorph's forms array.
				// The polymorph itself + visible variant children (below)
				// are the nodeMap-level entries.
				for (const child of buildVisibleVariantChildGroups(
					polySource,
					polyForms,
					optimized
				)) {
					nodes.set(child.kind, child);
				}
				const variantChildKinds = collectOverrideVariantChildKinds(
					polySource,
					polyForms
				);
				nodes.set(
					kind,
					new AssembledPolymorph(
						kind,
						rule as PolymorphRule | ChoiceRule,
						forms,
						{
							source: polySource,
							variantChildKinds
						}
					)
				);
				break;
			}
			case 'leaf': {
				nodes.set(
					kind,
					new AssembledPattern(kind, rule as PatternRule | TerminalRule)
				);
				break;
			}
			case 'keyword': {
				nodes.set(kind, new AssembledKeyword(kind, rule as StringRule));
				break;
			}
			case 'token': {
				// Hidden — no factoryName; token kinds have StringRule bodies
				nodes.set(kind, new AssembledToken(kind, rule as StringRule));
				break;
			}
			case 'enum': {
				nodes.set(kind, new AssembledEnum(kind, rule as EnumRule));
				break;
			}
			case 'supertype': {
				const subtypes = resolveSupertypeSubtypes(rule, optimized);
				nodes.set(
					kind,
					new AssembledSupertype(
						kind,
						rule as SupertypeRule | ChoiceRule,
						subtypes
					)
				);
				break;
			}
			case 'group': {
				const { groupRule, groupSimplified } = unwrapGroupRuleAndSimplified(
					rule,
					simplifiedRule
				);
				nodes.set(kind, new AssembledGroup(kind, groupRule, groupSimplified));
				break;
			}
			case 'multi': {
				const shape = extractRepeatShape(inlinedRule);
				if (!shape) {
					throw new Error(
						`assemble: '${kind}' classified as 'multi' but extractRepeatShape ` +
							`returned null — classifier and extractor must agree on shape.`
					);
				}
				nodes.set(kind, new AssembledMulti(kind, shape.repeat));
				break;
			}
		}
	}

	const wordMatcher = compileWordMatcher(optimized.word, optimized.rules);
	collectAnonymousNodes(optimized.rules, nodes, wordMatcher);
	resolveCollidingNames(nodes);
	resolveIrKeys(nodes);
	markParameterlessKinds(nodes);
	markUserFacing(nodes);
	markVariantChildrenUserFacing(nodes, optimized.polymorphVariants ?? []);

	return {
		name: optimized.name,
		nodes,
		signatures: computeSignatures(nodes),
		derivations: optimized.derivations,
		rules: optimized.rules,
		word: optimized.word,
		externals: optimized.externals ? new Set(optimized.externals) : undefined,
		polymorphFormKinds: computePolymorphFormKinds(nodes),
		refineForms: optimized.refineForms
	};
}

// ---------------------------------------------------------------------------
// Polymorph assembly helpers
// ---------------------------------------------------------------------------

/**
 * Derive the list of polymorph forms for the given kind and rule.
 *
 * @param kind - The kind name, used in error messages.
 * @param rule - The rule as it appears in `optimized.rules` (pre-inlining).
 * @returns The array of `{ name, content }` form descriptors from the
 *   `PolymorphRule`, or synthesised entries when the rule is a raw `choice`
 *   (T065 fallback path).
 * @throws {Error} When the rule is neither a `polymorph` nor a `choice`.
 * @remarks
 *   `PolymorphRule` is Link/Optimize's output — normally already has forms in
 *   declaration order. Under T065 the classifier may tag a raw `choice` as
 *   `polymorph` when promotion was held back (strict debug mode). In that case
 *   synthetic forms are created from the choice members with numerical names
 *   (`'form0'`, `'form1'`, …) rather than any variant label that might have
 *   been attached by `tagVariants`, so the form kinds stay collision-free and
 *   obviously generated.
 */
function derivePolymorphForms(
	kind: string,
	rule: Rule
): PolymorphRule['forms'] {
	if (rule.type === 'polymorph') return rule.forms;
	if (rule.type === 'choice') {
		return rule.members.map((m, i) => ({
			name: `form${i}`,
			content: m.type === 'variant' ? m.content : m
		}));
	}
	throw new Error(
		`assemble: kind '${kind}' classified as polymorph but rule.type=${rule.type}. ` +
			`promotePolymorph in Optimize should have wrapped it.`
	);
}

/**
 * Build `AssembledGroup` instances for each form of a polymorph, registering
 * disambiguated kind names and computing per-form simplified rules.
 *
 * @param parentKind - The kind string of the parent polymorph node.
 * @param polyForms - The form list from {@link derivePolymorphForms}.
 * @param polySource - Whether the polymorph was produced from a user override
 *   or by Optimize's promotion pass.
 * @returns One `AssembledGroup` per form, with unique kind names that never
 *   collide with visible variant-child kinds.
 * @remarks
 *   Duplicate form names (two variants with the same name over different shapes
 *   — e.g. python's `expression_statement`) are disambiguated with a numeric
 *   suffix. For `source='override'` polymorphs the form kind is
 *   `${parentKind}__form_${name}` to avoid colliding with the real visible
 *   variant-child kinds that carry the same base name.
 */
function buildAssembledFormGroups(
	parentKind: string,
	polyForms: PolymorphRule['forms'],
	polySource: 'override' | 'promoted'
): AssembledGroup[] {
	const nameCounts = new Map<string, number>();
	return polyForms.map((form) => {
		const seen = nameCounts.get(form.name) ?? 0;
		nameCounts.set(form.name, seen + 1);
		const disambiguated = seen === 0 ? form.name : `${form.name}${seen + 1}`;
		const formKind =
			polySource === 'override'
				? `${parentKind}__form_${disambiguated}`
				: `${parentKind}_${disambiguated}`;
		const formNames = nameNode(formKind);
		return new AssembledGroup(
			formKind,
			form.content,
			simplifyRule(form.content),
			{
				factoryName: formNames.factoryName,
				irKey: formNames.irKey,
				name: disambiguated,
				parentKind
			}
		);
	});
}

/**
 * Collect the real visible variant-child kind names referenced inside each
 * override-polymorph form's content.
 *
 * @param polySource - The origin of the polymorph; only `'override'` forms
 *   carry fused symbol references to real child kinds.
 * @param polyForms - The form list from {@link derivePolymorphForms}.
 * @returns An array of kind names for real parse-tree nodes referenced by the
 *   forms, or an empty array for promoted polymorphs.
 * @remarks
 *   For `source='override'` polymorphs each form's content is the fused
 *   `seq(prefix…, $.variant_child_kind, suffix…)` (or just `$.variant_child_kind`
 *   directly) produced by Link. These are the real visible kinds the children
 *   union on the parent polymorph references.
 */
function collectOverrideVariantChildKinds(
	polySource: 'override' | 'promoted',
	polyForms: PolymorphRule['forms']
): string[] {
	if (polySource !== 'override') return [];
	return polyForms
		.map((f) => extractVariantChildSymbol(f.content))
		.filter((s): s is string => !!s);
}

/**
 * Register visible variant-child kinds for override polymorphs as standalone
 * NodeMap entries backed by their hidden source rules.
 *
 * @remarks
 * `variant()` adoption rewrites the parent into an override polymorph whose
 * internal form groups use `${parent}__form_${child}` names to avoid colliding
 * with the real parse-tree kind `${parent}_${child}`. The parser still emits
 * that visible child kind, so NodeMap needs a concrete node entry for it when
 * the hidden source rule `_${parent}_${child}` exists. Without this entry the
 * generated template set omits kinds like `with_clause_bare` and
 * `expression_statement_tuple`, leaving them un-renderable even though the
 * structural source rule is present in `optimized.rules`.
 */
function buildVisibleVariantChildGroups(
	polySource: 'override' | 'promoted',
	polyForms: PolymorphRule['forms'],
	optimized: OptimizedGrammar
): AssembledNode[] {
	if (polySource !== 'override') return [];
	const groups: AssembledNode[] = [];
	for (const form of polyForms) {
		const visibleKind = extractVariantChildSymbol(form.content);
		if (!visibleKind) continue;
		const hiddenKind = `_${visibleKind}`;
		const sourceRule = optimized.rules[hiddenKind];
		if (!sourceRule) continue;
		const inlinedRule = hoistInnerFieldsForTemplate(
			inlineGroupRefs(sourceRule, optimized.rules)
		);
		const simplifiedRule =
			optimized.simplifiedRules[hiddenKind] ?? simplifyRule(sourceRule);
		const modelType = classifyNode(visibleKind, inlinedRule);
		switch (modelType) {
			case 'branch':
				groups.push(
					new AssembledBranch(
						visibleKind,
						inlinedRule as
							| SeqRule
							| ChoiceRule
							| RepeatRule
							| Repeat1Rule,
						simplifiedRule
					)
				);
				break;
			default:
				break;
		}
	}
	return groups;
}

// ---------------------------------------------------------------------------
// Supertype + group assembly helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the subtype kind list for a supertype node from its rule.
 *
 * @param rule - The rule as it appears in `optimized.rules` (pre-inlining).
 * @param optimized - The full optimized grammar, used for hidden-rule resolution.
 * @returns The ordered list of concrete kind names that are members of this
 *   supertype union after resolving any hidden-rule indirections.
 * @remarks
 *   Sources in priority order:
 *   1. `SupertypeRule.subtypes` — Link's pre-computed list.
 *   2. `choice` members — each `symbol` child's name (T065 fallback).
 *   3. Empty list — for any other rule shape (best-effort).
 *
 *   Hidden names (`_foo`) are then resolved to the concrete kinds that
 *   tree-sitter actually surfaces at runtime via {@link resolveHiddenSubtypes}.
 */
function resolveSupertypeSubtypes(
	rule: Rule,
	optimized: OptimizedGrammar
): string[] {
	let subtypes: string[];
	if (rule.type === 'supertype') {
		subtypes = rule.subtypes;
	} else if (rule.type === 'choice') {
		subtypes = rule.members
			.map((m) => (m.type === 'variant' ? m.content : m))
			.filter((m): m is SymbolRule => m.type === 'symbol')
			.map((m) => m.name);
	} else {
		subtypes = [];
	}
	return resolveHiddenSubtypes(
		subtypes,
		optimized.rules,
		optimized.aliasedHiddenKinds ?? new Map()
	);
}

/**
 * Unwrap a `GroupRule` to obtain the inner content rule and its simplified view.
 *
 * @param rule - The raw rule from `optimized.rules`.
 * @param simplifiedRule - The pre-computed simplified rule for the same kind.
 * @returns `groupRule` — the inner seq-with-fields content; `groupSimplified` —
 *   the simplified view of that inner content.
 * @remarks
 *   When the rule is a `GroupRule` the pre-computed `simplifiedRule` applies to
 *   the outer group wrapper; we want the inner content's simplified view to match
 *   what we're passing as `rule`. For the wrapper case the inner content's
 *   simplified view is computed on-the-fly. Non-group rules pass through as-is
 *   (the T065 fallback path — groups that didn't get the GroupRule wrapper).
 */
function unwrapGroupRuleAndSimplified(
	rule: Rule,
	simplifiedRule: Rule
): { groupRule: Rule; groupSimplified: Rule } {
	const groupRule = rule.type === 'group' ? rule.content : rule;
	const groupSimplified =
		rule.type === 'group' ? simplifyRule(groupRule) : simplifiedRule;
	return { groupRule, groupSimplified };
}

// ---------------------------------------------------------------------------
// resolveIrKeys — dedupe-aware short-name pass over the whole NodeMap
// ---------------------------------------------------------------------------

/**
 * Assign a deduplicated short ir-namespace key to every factory-bearing node.
 *
 * @param nodes - The full assembled node map; `irKey` on each node is mutated.
 * @remarks
 *   The ir namespace (`import { ir } from './ir.js'`) exposes each kind under a
 *   short ergonomic key. Collisions on the short form fall back to the full
 *   `factoryName`; JS reserved words get a `_` suffix. This pass claims keys in
 *   nodeMap iteration order.
 *
 *   Two-phase algorithm: supertypes are pre-claimed first so they block suffix-
 *   stripped collisions. Within each factory-bearing phase, hidden kinds sort
 *   after non-hidden so visible kinds always claim the short key first.
 */
function resolveIrKeys(nodes: Map<string, AssembledNode>): void {
	const claimed = new Set<string>();
	preclaimSupertypeIrKeys(nodes, claimed);
	const { phase1, phase2 } = partitionNodesIntoIrKeyPhases(nodes);
	for (const node of phase1) assignIrKeyWithFallback(node, claimed);
	for (const node of phase2) assignIrKeyWithFallback(node, claimed);
}

// ---------------------------------------------------------------------------
// markParameterlessKinds — fixpoint pass (ADR-0010 Task 1.5)
// ---------------------------------------------------------------------------

/**
 * Determine whether a single slot (field or child) is auto-stamp-eligible.
 *
 * A slot is eligible when:
 * - It is optional (`isRequired(slot) === false`) — user can omit it; we
 *   treat it as a non-blocking empty slot.
 * - It is required, non-repeated, and its value is fixed:
 *   (a) exactly one TerminalValue in values
 *   (b) exactly one NodeRef pointing to a parameterless kind (already marked)
 *
 * Required repeated slots are NOT eligible — their cardinality is
 * user-determined.
 */
function isAutoStampSlot(
	slot: AssembledChild,
	nodes: Map<string, AssembledNode>
): boolean {
	if (!isRequired(slot)) return true; // optional slots never block parameterless
	if (isMultiple(slot)) return false; // required repeated slot needs user input

	// Must be single-value to auto-stamp
	if (slot.values.length !== 1) return false;
	const v = slot.values[0]!;

	// Source A: inline literal
	if (isTerminalValue(v)) return true;

	// Source B/C: single NodeRef whose target is parameterless
	if (isNodeRef(v)) {
		const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		const ref = nodes.get(kindName);
		if (ref?.isParameterless) return true;
	}

	return false;
}

/**
 * Get all slots (fields + children) for compound-like nodes that support
 * the parameterless fixpoint. Returns `undefined` for nodes that have no
 * slot model (supertypes, tokens, multis — these are never parameterless
 * compounds).
 */
function getSlotsForParameterless(
	node: AssembledNode
):
	| { fields: readonly AssembledField[]; children: readonly AssembledChild[] }
	| undefined {
	switch (node.modelType) {
		case 'branch':
			return { fields: node.fields, children: node.children ?? [] };
		case 'group':
			return { fields: node.fields, children: node.children ?? [] };
		default:
			return undefined;
	}
}

/**
 * Compute the stamp expression for a single auto-stamp-eligible REQUIRED slot.
 *
 * Returns `undefined` when the slot is optional (optional slots produce no
 * stamp — we simply omit them from the factory call for parameterless
 * compounds).
 */
function _stampExpressionForSlot(
	slot: AssembledChild,
	nodes: Map<string, AssembledNode>
): string | undefined {
	if (!isRequired(slot)) return undefined; // optional — no stamp needed
	if (slot.values.length !== 1) return undefined;
	const v = slot.values[0]!;

	// Source A: inline literal
	if (isTerminalValue(v)) {
		return JSON.stringify(v.value);
	}

	// Source B/C: single referenced parameterless kind
	if (isNodeRef(v)) {
		const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
		const ref = nodes.get(kindName);
		if (ref?.isParameterless && ref.stampExpression !== undefined) {
			return ref.stampExpression;
		}
	}

	return undefined;
}

/**
 * Mark a node as parameterless and set its stampExpression.
 */
function markNode(node: AssembledNode, stamp: string): void {
	node.isParameterless = true;
	node.stampExpression = stamp;
}

/**
 * Fixpoint pass: propagate parameterless status from terminals up to compounds.
 *
 * Phase 1: mark AssembledKeyword nodes. These are the "roots" — a keyword
 * factory already takes `()` and emits a fixed text. Their stamp expression
 * (as seen by parent factories) is the JSON literal of their text.
 *
 * Phase 2 (fixpoint): iteratively mark any compound whose every required
 * slot auto-stamps. Converges in ≤ O(depth) passes — for real grammars
 * typically 2–3 passes. Safety cap at 20 iterations.
 *
 * After the pass: `node.isParameterless === true` iff the kind needs no
 * user-supplied arguments. `node.stampExpression` is the code-gen string
 * a parent factory emits to produce a value for a slot pointing at this kind.
 */
function markParameterlessKinds(nodes: Map<string, AssembledNode>): void {
	// Phase 1: single-literal terminals self-initialize `isParameterless`
	// and `stampExpression` in their constructors — see
	// `AssembledKeyword` and `AssembledToken` in node-map.ts. No work
	// needed here.

	// Phase 2: fixpoint over compounds.
	const MAX_ITERS = 20;
	let changed = true;
	let iters = 0;
	while (changed) {
		if (iters++ >= MAX_ITERS) {
			throw new Error(
				`markParameterlessKinds: fixpoint did not converge after ${MAX_ITERS} iterations. ` +
					`Possible circular dependency in auto-stamp slot resolution.`
			);
		}
		changed = false;
		for (const [kind, node] of nodes) {
			if (node.isParameterless) continue; // already marked

			const slots = getSlotsForParameterless(node);
			if (!slots) continue; // not a compound with fields/children

			const allSlots = [...slots.fields, ...slots.children];

			// A compound is parameterless iff it has at least ONE required slot AND
			// every required slot auto-stamps. Vacuous truth (no required slots at
			// all, or only optional slots) does NOT qualify — such kinds are
			// "callable without args" but not "structurally determined," so stamping
			// their factory call produces an empty/arbitrary node rather than a
			// fixed one. Optional slots are permitted (they can be omitted at the
			// stamp site) as long as they're not the only content.
			const requiredSlots = allSlots.filter((s) => isRequired(s));
			if (requiredSlots.length === 0) continue; // no determined content — not parameterless

			const allAutoStamp = allSlots.every((s) => isAutoStampSlot(s, nodes));
			if (!allAutoStamp) continue;

			const fn = node.rawFactoryName;
			if (!fn) continue; // hidden nodes have no factory; skip
			markNode(node, `${fn}()`);
			changed = true;
			void kind; // suppress unused warning
		}
	}
}

/**
 * Resolve hidden rule names (`_foo`) referenced as subtypes to the
 * concrete kinds that actually appear in the parse tree.
 *
 * @param names - Raw subtype names from the rule tree (may include `_`-prefixed hidden names).
 * @param rules - The full optimized rule map, used to resolve hidden rule bodies.
 * @param aliasedHiddenKinds - Pre-Link alias map from hidden kind to its aliased target.
 * @returns The resolved list of concrete kind names, deduplicated and in visitation order.
 * @remarks
 *   Tree-sitter inlines hidden rules at parse time — a `_type_identifier` defined as
 *   `alias($.identifier, $.type_identifier)` shows up as `type_identifier` at runtime,
 *   never as `_type_identifier`. Supertype expansion maps built from raw rule-tree names
 *   would miss those kinds and the runtime routing map would fail to promote them.
 *
 *   Handled shapes:
 *   - `alias(x, y)` → `y` (the alias label)
 *   - `symbol(target)` → recurse on target (follow chains)
 *   - `choice(a, b, …)` → flatten each branch
 *   - everything else → keep the hidden name as-is (best-effort)
 *
 *   Non-hidden names pass through unchanged.
 */
function resolveHiddenSubtypes(
	names: readonly string[],
	rules: Record<string, Rule>,
	_aliasedHiddenKinds: ReadonlyMap<string, string>
): string[] {
	// Post-synthesis-removal: the rules map is keyed by SOURCE kinds
	// only (hidden `_X`). Subtype names surface as source kinds; we
	// no longer redirect through the aliasedHiddenKinds table (which
	// pointed at visible alias targets). Hidden kinds that have their
	// own rule body are resolved via the rules map directly; the
	// chain terminates at a concrete symbol.
	const out: string[] = [];
	const seen = new Set<string>();
	const visit = (name: string): void => {
		if (seen.has(name)) return;
		seen.add(name);
		if (!name.startsWith('_')) {
			out.push(name);
			return;
		}
		const rule = rules[name];
		if (!rule) {
			out.push(name);
			return;
		}
		const resolved = resolveHiddenRuleContent(rule, rules, new Set([name]));
		if (resolved.length === 0) {
			out.push(name);
			return;
		}
		for (const r of resolved) {
			// Recurse in case a hidden rule resolves to another hidden rule.
			if (r.startsWith('_')) {
				visit(r);
				continue;
			}
			if (!seen.has(r)) {
				seen.add(r);
				out.push(r);
			}
		}
	};
	for (const n of names) visit(n);
	return out;
}

function resolveHiddenRuleContent(
	rule: Rule,
	rules: Record<string, Rule>,
	seen: Set<string>
): string[] {
	switch (rule.type) {
		case 'alias':
			// Resolve to the SOURCE kind (what's in the rules map).
			// Evaluate's `synthesizeInlineAliasSources` pass ensures
			// every named alias has a bare-symbol source that's a
			// real rule. Fall back to the value when that invariant
			// doesn't hold (pre-evaluate / test fixtures).
			if (rule.named && rule.content.type === 'symbol') {
				return [rule.content.name];
			}
			return [rule.value];
		case 'symbol': {
			// Post-synthesis-removal: resolve visible-via-alias symbols
			// (`aliasedFrom` set) to their SOURCE kind name, which is
			// what's in the rules map and nodeMap.
			const refName = rule.aliasedFrom ?? rule.name;
			if (!refName.startsWith('_')) return [refName];
			if (seen.has(refName)) return [];
			seen.add(refName);
			const target = rules[refName];
			return target ? resolveHiddenRuleContent(target, rules, seen) : [refName];
		}
		case 'supertype':
			return rule.subtypes.flatMap((s) => {
				if (seen.has(s)) return [];
				seen.add(s);
				if (!s.startsWith('_')) return [s];
				const target = rules[s];
				return target ? resolveHiddenRuleContent(target, rules, seen) : [s];
			});
		case 'choice':
			return rule.members.flatMap((m) =>
				resolveHiddenRuleContent(m, rules, seen)
			);
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'terminal':
			return resolveHiddenRuleContent(
				(rule as { content: Rule }).content,
				rules,
				seen
			);
		default:
			return [];
	}
}

/**
 * Find `typeName` collisions between hidden (`_`-prefixed) kinds and their visible
 * siblings, and disambiguate by renaming the hidden kinds.
 *
 * @param nodes - The full assembled node map; `typeName` and `factoryName` on
 *   colliding hidden nodes are mutated.
 * @remarks
 *   Non-colliding hidden kinds keep their clean names. Emits a warning for every
 *   rename so the run log surfaces which grammar rules are sharing names.
 *
 *   Three collision patterns are handled:
 *   - `visible ≥ 1` AND `hidden ≥ 1` → rename hidden(s) via {@link renameCollidingHiddenKinds}
 *   - `visible ≥ 2` → rename lower-priority visible(s) via {@link renameCollidingVisibleKinds}
 *   - `hidden ≥ 2` → rename lower-priority hidden(s) via {@link renameCollidingHiddenOnlyKinds}
 */
/**
 * Populate each node's `userFacing` flag — the single source of truth
 * for whether emitters (templates, factories, types, IR) should
 * produce output for the kind.
 *
 * - `token` / `multi` modelTypes: never user-facing (structural helpers).
 * - Visible kinds (not `_`-prefixed): user-facing.
 * - Hidden kinds: user-facing only when they're alias sources
 *   (referenced elsewhere via `aliasedFrom`, meaning factories
 *   stamp this kind as `$type`).
 *
 * Alias-source detection: walk every node's field / child value
 * slots and collect unresolved-ref names starting with `_`. Those
 * references only exist in the emitted NodeMap when
 * `walkForChildren` / `deriveValuesForRule` stamped the source
 * (`aliasedFrom`) rather than the visible target.
 */
function markUserFacing(nodes: Map<string, AssembledNode>): void {
	const aliasSourceKinds = new Set<string>();
	for (const [, n] of nodes) {
		const fieldSlots =
			n.modelType === 'polymorph'
				? n.allFormFields
				: n.modelType === 'branch' || n.modelType === 'group'
					? n.fields
					: [];
		const childSlots =
			n.modelType === 'branch' || n.modelType === 'group'
				? (n.children ?? [])
				: [];
		for (const slot of [...fieldSlots, ...childSlots]) {
			for (const v of slot.values) {
				if (!isNodeRef(v)) continue;
				const name = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
				if (name.startsWith('_')) aliasSourceKinds.add(name);
			}
		}
	}
	for (const [kind, n] of nodes) {
		if (n.modelType === 'token' || n.modelType === 'multi') {
			n.userFacing = false;
			continue;
		}
		if (!kind.startsWith('_')) {
			n.userFacing = true;
			continue;
		}
		// Hidden — user-facing only when referenced as alias source,
		// or when it's a polymorph (dispatched into via $variant).
		n.userFacing = aliasSourceKinds.has(kind) || n.modelType === 'polymorph';
	}
}

/**
 * Ensure hidden variant-child rules are marked user-facing so the template
 * and factory emitters include them.
 *
 * @param nodes - Assembled node map; modified in place.
 * @param variants - Polymorph variant registrations from the grammar.
 * @remarks
 *   When the variant parent is classified as a supertype (e.g. python's
 *   `_simple_pattern`), `markUserFacing`'s slot walker never iterates
 *   supertype subtypes, so the hidden variant-child rule
 *   (`_${parent}_${child}`, e.g. `_simple_pattern_negative`) never enters
 *   `aliasSourceKinds` and stays `userFacing=false`. This pass explicitly
 *   marks each hidden child so its `.jinja` template, wrap-table entry,
 *   and `_aliasTargetToSource` remap are emitted by downstream emitters.
 */
function markVariantChildrenUserFacing(
	nodes: Map<string, AssembledNode>,
	variants: readonly PolymorphVariant[]
): void {
	for (const v of variants) {
		const hiddenChildKind = `${v.parent}_${v.child}`;
		const childNode = nodes.get(hiddenChildKind);
		if (childNode && !childNode.userFacing) {
			childNode.userFacing = true;
		}
	}
}

function resolveCollidingNames(nodes: Map<string, AssembledNode>): void {
	// Group nodes by typeName. Preferred winner: the non-hidden kind.
	const byType = new Map<string, AssembledNode[]>();
	for (const node of nodes.values()) {
		const bucket = byType.get(node.typeName) ?? [];
		bucket.push(node);
		byType.set(node.typeName, bucket);
	}
	for (const [typeName, group] of byType) {
		if (group.length < 2) continue;
		const visible = group.filter((n) => !n.kind.startsWith('_'));
		const hidden = group.filter((n) => n.kind.startsWith('_'));
		if (visible.length >= 1 && hidden.length >= 1) {
			renameCollidingHiddenKinds(visible, hidden, typeName);
		} else if (visible.length >= 2) {
			renameCollidingVisibleKinds(visible, typeName);
		} else if (hidden.length >= 2) {
			renameCollidingHiddenOnlyKinds(hidden, typeName);
		}
	}
}

/**
 * Rename hidden kinds that share a `typeName` with at least one non-token visible kind
 * by adding a `_` prefix to their `typeName` and `factoryName`.
 *
 * @param visible - Nodes with non-hidden kinds that share the same `typeName`.
 * @param hidden - Nodes with hidden (`_`-prefixed) kinds that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Only renames when a visible sibling actually gets an exported TypeScript declaration.
 *   Token nodes (`modelType === 'token'`) are anonymous structural delimiters that only
 *   appear as exported type aliases if they are referenced in a field/child union — many
 *   aren't. If ALL visible siblings are tokens, there is no actual TypeScript collision
 *   and the hidden kind's name is left unchanged.
 *
 *   Visible wins. Hidden kinds are renamed with a `_` prefix to preserve the tree-sitter
 *   convention that hidden/internal kinds start with an underscore.
 */
function renameCollidingHiddenKinds(
	visible: AssembledNode[],
	hidden: AssembledNode[],
	typeName: string
): void {
	const hasNonTokenVisible = visible.some((n) => n.modelType !== 'token');
	if (!hasNonTokenVisible) return;
	for (const h of hidden) {
		const newType = `_${typeName}`;
		console.warn(
			`[assemble] typeName collision: kind '${h.kind}' renamed ` +
				`'${typeName}' → '${newType}' (visible sibling(s): ${visible.map((v) => `'${v.kind}'`).join(', ')})`
		);
		h.typeName = newType;
		if (h.factoryName !== undefined) {
			// _TypeName → _typeName (camelCase with leading _)
			h.factoryName = `_${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}`;
		}
	}
}

/**
 * Rename all but the first (alphabetically) of multiple visible kinds that have
 * collapsed to the same `typeName`, appending a numeric disambiguator to the rest.
 *
 * @param visible - Two or more visible (non-hidden) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two visible kinds collapse to the same typeName when grammar symbols differ only
 *   in case (e.g. python's `true` keyword + `True` named node). The first kind (sorted
 *   by kind string) keeps the original name; subsequent ones receive a numeric suffix.
 *   A warning is emitted so the situation is visible in the run log.
 */
function renameCollidingVisibleKinds(
	visible: AssembledNode[],
	typeName: string
): void {
	const sorted = [...visible].sort((a, b) => a.kind.localeCompare(b.kind));
	for (let i = 1; i < sorted.length; i++) {
		const n = sorted[i]!;
		const newType = `${typeName}${i + 1}`;
		console.warn(
			`[assemble] typeName collision between visible kinds: '${n.kind}' renamed ` +
				`'${typeName}' → '${newType}' (siblings: ${sorted
					.slice(0, i)
					.map((s) => `'${s.kind}'`)
					.join(', ')})`
		);
		n.typeName = newType;
		if (n.factoryName !== undefined) {
			n.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1);
		}
	}
}

/**
 * Rename all but the first of multiple hidden kinds that have normalised to the same
 * `typeName`, appending a numeric suffix to each after the first.
 *
 * @param hidden - Two or more hidden (`_`-prefixed) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two hidden kinds both normalized to the same name receive numeric suffixes on every
 *   node after the first. A warning is emitted for each rename.
 */
function renameCollidingHiddenOnlyKinds(
	hidden: AssembledNode[],
	typeName: string
): void {
	for (let i = 1; i < hidden.length; i++) {
		const h = hidden[i]!;
		const newType = `${typeName}${i + 1}`;
		console.warn(
			`[assemble] typeName collision among hidden kinds: '${h.kind}' renamed '${typeName}' → '${newType}'`
		);
		h.typeName = newType;
		if (h.factoryName !== undefined) {
			h.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1);
		}
	}
}

/**
 * Pre-claim the short ir-namespace key for every supertype node in the map.
 *
 * @param nodes - The full assembled node map.
 * @param claimed - Mutable set of already-claimed ir keys; modified in place.
 * @remarks
 *   Supertypes don't get factories but they DO occupy a name in the ir namespace
 *   (as a type alias). Pre-claiming their short form ensures that a factoryless
 *   supertype like python `expression` still blocks `expression_statement` from
 *   collapsing its irKey onto `expression`.
 */
function preclaimSupertypeIrKeys(
	nodes: Map<string, AssembledNode>,
	claimed: Set<string>
): void {
	for (const node of nodes.values()) {
		if (node.modelType !== 'supertype') continue;
		claimed.add(shortenIrKey(node.kind));
	}
}

/**
 * Partition factory-bearing nodes into two priority phases for ir-key assignment.
 *
 * @param nodes - The full assembled node map.
 * @returns Two arrays — `phase1` contains nodes whose short form equals their
 *   factoryName (they have no distinct fallback), `phase2` contains nodes whose
 *   short form is a suffix-stripped abbreviation of their factoryName (they have
 *   a longer factoryName to fall back to on collision). Within each phase, hidden
 *   kinds sort after non-hidden so visible kinds claim the short key first.
 * @remarks
 *   Phase 1 — "short form is the full name". Any node whose short irKey equals its
 *   own factoryName gets first dibs (it has nothing to fall back to that wouldn't
 *   also collide). Examples: `expression`, `as_pattern` (→ `asPattern`), `module`
 *   (→ `module`). This forces suffix-stripped collisions (e.g. `expression_statement`
 *   → `expression`) to lose to the genuinely-short kind.
 *   Phase 2 — "short form is a strip of the full name". These have a distinct
 *   factoryName fallback (e.g. `expression_statement` → `expressionStatement`).
 */
function partitionNodesIntoIrKeyPhases(nodes: Map<string, AssembledNode>): {
	phase1: AssembledNode[];
	phase2: AssembledNode[];
} {
	const phase1: AssembledNode[] = [];
	const phase2: AssembledNode[] = [];
	for (const node of nodes.values()) {
		if (!node.factoryName) continue;
		if (node.modelType === 'group') continue;
		const short = shortenIrKey(node.kind);
		if (short === node.factoryName) phase1.push(node);
		else phase2.push(node);
	}
	const hiddenSort = (a: AssembledNode, b: AssembledNode) => {
		const aHidden = a.kind.startsWith('_') ? 1 : 0;
		const bHidden = b.kind.startsWith('_') ? 1 : 0;
		return aHidden - bHidden;
	};
	phase1.sort(hiddenSort);
	phase2.sort(hiddenSort);
	return { phase1, phase2 };
}

/**
 * Assign an ir-namespace key to a single node, falling back to the full factory
 * name (and then a numeric suffix) when the short form is already claimed.
 *
 * @param node - The node whose `irKey` property is assigned.
 * @param claimed - Mutable set of already-claimed ir keys; modified in place.
 * @remarks
 *   On collision, falls back to the full factory name. For hidden kinds this is
 *   `hiddenX`, distinct from the visible short form. In the extremely rare case
 *   where even the full name collides (two kinds normalise to the same factoryName),
 *   a numeric suffix is appended to guarantee uniqueness.
 */
function assignIrKeyWithFallback(
	node: AssembledNode,
	claimed: Set<string>
): void {
	const short = shortenIrKey(node.kind);
	if (!claimed.has(short)) {
		claimed.add(short);
		node.irKey = short;
		return;
	}
	let full = node.factoryName!;
	let candidate = full;
	let n = 2;
	while (claimed.has(candidate)) {
		candidate = `${full}${n++}`;
	}
	claimed.add(candidate);
	node.irKey = candidate;
}

function shortenIrKey(kind: string): string {
	const stripped = kind
		.replace(/_item$/, '')
		.replace(/_expression$/, '')
		.replace(/_statement$/, '')
		.replace(/_declaration$/, '')
		.replace(/_definition$/, '');
	const parts = stripped.split('_').filter(Boolean);
	if (parts.length === 0) return nameNode(kind).factoryName;
	const camel = parts
		.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
		.join('');
	// Reserved-word names fall back to the factory name, which already
	// carries the `_` suffix from nameNode.
	if (IR_KEY_RESERVED.has(camel)) return nameNode(kind).factoryName;
	return camel;
}

const IR_KEY_RESERVED = new Set([
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'let',
	'new',
	'null',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'async',
	'await'
]);

// ---------------------------------------------------------------------------
// collectAnonymousNodes — extract string literals from rules as token/keyword entries
// ---------------------------------------------------------------------------

/**
 * Test whether a grammar string literal has "keyword shape" — i.e., whether
 * tree-sitter will lex it as a word token under the grammar's `word` rule.
 *
 * @param value - The literal text from the grammar (e.g., `"if"`, `"+"`, `"->"`).
 * @param wordMatcher - The compiled word-rule pattern from {@link compileWordMatcher},
 *   or `undefined` when the grammar has no `word` declaration.
 * @returns `true` when `value` matches the word pattern (or `/^\w+$/` as fallback),
 *   indicating the literal is an `AssembledKeyword`; `false` for punctuation /
 *   operators that become `AssembledToken`.
 * @remarks
 *   Keyword-shape is "lexes as a word under the grammar's `word` rule". When the
 *   grammar declares no `word` (or we can't extract its pattern), falls back to
 *   the conservative `/^\w+$/` heuristic.
 */
function detectKeywordShape(
	value: string,
	wordMatcher: RegExp | undefined
): boolean {
	return wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value);
}

function collectAnonymousNodes(
	rules: Record<string, Rule>,
	nodes: Map<string, AssembledNode>,
	wordMatcher: RegExp | undefined
): void {
	const seen = new Set<string>();

	for (const rule of Object.values(rules)) {
		walkForStrings(rule, seen);
	}

	for (const value of seen) {
		if (nodes.has(value)) continue; // Already classified as a named rule
		if (value === '' || /^\s+$/.test(value)) continue; // Skip whitespace/empty

		const isWordShape = detectKeywordShape(value, wordMatcher);
		// Synthetic StringRule for anonymous tokens — the kind IS the literal value.
		const syntheticStringRule: StringRule = { type: 'string', value };

		if (isWordShape) {
			// Keyword token (e.g., "if", "class", "pub")
			// Anonymous keywords from grammar — no factory (hidden: no user construction path)
			nodes.set(
				value,
				new AssembledKeyword(value, syntheticStringRule, { hidden: true })
			);
		} else {
			// Operator/punctuation token (e.g., "+", "->", "{")
			nodes.set(value, new AssembledToken(value, syntheticStringRule));
		}
	}
}

/**
 * Recursively collect all string literals from a rule tree into `out`.
 *
 * @param rule - The rule to walk.
 * @param out - Mutable set that receives each string literal value.
 * @remarks
 *   `enum` rules are deliberately **not** descended. Enum values are the `text`
 *   content of the parent kind, not distinct node kinds — the parser produces a
 *   single node (e.g. `primitive_type` with text `"usize"`), never a `usize`
 *   node, so collecting the enum member strings as anonymous token kinds would
 *   be incorrect.
 */
function walkForStrings(rule: Rule, out: Set<string>): void {
	switch (rule.type) {
		case 'string':
			out.add(rule.value);
			break;
		case 'enum':
			// Enum values are text content — do NOT descend (see JSDoc).
			break;
		case 'seq':
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case 'choice':
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case 'optional':
			walkForStrings(rule.content, out);
			break;
		case 'repeat':
			walkForStrings(rule.content, out);
			break;
		case 'field':
			walkForStrings(rule.content, out);
			break;
		case 'variant':
			walkForStrings(rule.content, out);
			break;
		case 'clause':
			walkForStrings(rule.content, out);
			break;
		case 'group':
			walkForStrings(rule.content, out);
			break;
	}
}

// ---------------------------------------------------------------------------
// classifyNode — structural simplification + visibility
// ---------------------------------------------------------------------------

type ModelType = AssembledNode['modelType'];

// `inlineGroupRefs` / `resolveGroupOrMultiInlineTarget` moved to
// `simplify.ts` so the group-inlining happens inside the simplify
// fixpoint (enables flatten + canonicalize to re-fire on inlined
// content). Imported above; no longer defined here.

/**
 * Classify a rule into a model type by pure rule.type dispatch.
 *
 * By the time rules reach Assemble, Link and Optimize have already
 * pre-classified the interesting cases via dedicated rule types:
 *
 *   EnumRule       — Link: choice-of-strings
 *   SupertypeRule  — Link: hidden choice-of-symbols (grammar or promoted)
 *   GroupRule      — Link: hidden seq with fields
 *   TerminalRule   — Link: subtree with no fields and no symbol refs
 *   PolymorphRule  — Optimize: choice-of-variants with heterogeneous fields
 *
 * Assemble just dispatches on rule.type. The only structural inspection
 * left is distinguishing branch (has fields) from container (has children
 * only) for ordinary seq rules — that's a one-level check.
 */
export function classifyNode(
	kind: string,
	rule: Rule,
	opts?: { variantParents?: ReadonlySet<string> }
): ModelType {
	switch (rule.type) {
		case 'enum':
			return 'enum';
		case 'supertype':
			return 'supertype';
		case 'group':
			return 'group';
		case 'terminal':
			return 'leaf';
		case 'polymorph':
			return 'polymorph';
		case 'pattern':
			return 'leaf';
		case 'string':
			return /^\w+$/.test(rule.value) ? 'keyword' : 'token';
	}

	// T065 auto-polymorph promotion removed (spec 013 cleanup).
	// Grammar authors declare polymorph shapes explicitly via
	// `polymorphs: { parent: { 'path': 'name' } }` in overrides.ts.
	// Kinds without an adoption classify as plain branches /
	// containers; the derive walker's cross-branch merging handles
	// heterogeneous-field-per-arm shapes without inventing anonymous
	// polymorph identities.
	void opts;
	if (isHiddenRepeatHelper(kind, rule)) return 'multi';
	const branchOrContainer = classifyBranchOrContainer(rule);
	if (branchOrContainer !== null) return branchOrContainer;
	return classifyT065TerminalFallback(kind, rule);
}

/**
 * Test whether a kind should be classified as a hidden `multi` helper.
 *
 * @param kind - The rule kind name (snake_case, may start with `_`).
 * @param rule - The rule body for that kind.
 * @returns `true` when the kind is hidden and its body unwraps to a repeat.
 * @remarks
 *   Hidden repeat helpers are inlined by tree-sitter at parse time, so they never
 *   surface as concrete nodes. Classifying them as `multi` lets downstream emitters
 *   skip the interface/factory/resolver and the walker inlines the repeat at
 *   referrers (rest-params factory, multi-valued child slot). See AssembledMulti doc.
 */
function isHiddenRepeatHelper(kind: string, rule: Rule): boolean {
	return kind.startsWith('_') && extractRepeatShape(rule) !== null;
}

/**
 * Classify a rule as `branch` based on presence of fields or children,
 * or return `null` when neither applies.
 *
 * Phase 1d.vii (spec 022) collapsed the prior `'container'` model into
 * `'branch'`: nodes that carry only unnamed children (no `field()` on
 * the rule) are still `AssembledBranch` instances, distinguishable at
 * the call site via `AssembledBranch.isContainerShape`. The single
 * classification arm reflects that there is one runtime class for
 * both shapes.
 *
 * @param rule - The rule to inspect.
 * @returns `'branch'` if the rule has any named field or unnamed child,
 *   or `null` when neither applies.
 * @remarks
 *   Only existence checks are performed — not full extraction. The class
 *   getters (`AssembledBranch.fields`, `AssembledBranch.children`) do
 *   the full walk later, once.
 */
function classifyBranchOrContainer(rule: Rule): ModelType | null {
	if (hasAnyField(rule) || hasAnyChild(rule)) return 'branch';
	return null;
}

/**
 * Apply the T065 terminal fallback classification after all structural checks
 * have failed to assign a model type.
 *
 * @param kind - The rule kind name, used in the error message.
 * @param rule - The rule body for that kind.
 * @returns `'leaf'` for all-text subtrees, `'enum'` for pure choice-of-strings.
 * @throws {Error} When the rule cannot be classified by any heuristic — indicates
 *   that Link should have wrapped it as a `TerminalRule`.
 * @remarks
 *   All-text subtree → leaf; pure choice-of-strings → enum. Anything still
 *   unclassifiable after this is a real pipeline error.
 */
function classifyT065TerminalFallback(kind: string, rule: Rule): ModelType {
	if (isAllTextShape(rule)) return 'leaf';
	if (rule.type === 'choice' && rule.members.every((m) => m.type === 'string'))
		return 'enum';
	throw new Error(
		`classifyNode: '${kind}' has no fields, no children, and no rule-type ` +
			`classification. Link should have wrapped it as TerminalRule. rule.type=${rule.type}`
	);
}

/**
 * Shape-inspection helper for the classifier fallback. A rule is
 * "all text" when every leaf is a string or pattern and there are
 * no symbol references. Walked recursively through seq/choice/
 * optional/repeat/token/variant/clause/group wrappers.
 */
function isAllTextShape(rule: Rule): boolean {
	switch (rule.type) {
		case 'string':
		case 'pattern':
			return true;
		case 'symbol':
		case 'field':
			return false;
		case 'seq':
		case 'choice':
			return rule.members.length > 0 && rule.members.every(isAllTextShape);
		case 'optional':
		case 'repeat':
		case 'token':
		case 'variant':
		case 'clause':
		case 'group':
			return isAllTextShape(rule.content);
		default:
			return false;
	}
}

// ---------------------------------------------------------------------------
// simplifyRule lives in compiler/simplify.ts and now runs as a
// dedicated pipeline stage at the end of `optimize()`. Re-exported
// here so the existing assemble.test.ts import site keeps working.
// ---------------------------------------------------------------------------

export { simplifyRule };

// ---------------------------------------------------------------------------
// extractFields — walk rule tree, collect fields with derived metadata
// ---------------------------------------------------------------------------

// extractForms — deleted. PolymorphRule.forms is built by Optimize's
// promotePolymorph pass; assemble builds AssembledGroup instances from
// those forms directly (see the 'polymorph' case of the switch above).

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------
// nameNode has moved to node-map.ts (imported above); re-exported here for
// backwards compatibility with assemble.test.ts and any other callers that
// import it from this module.
export { nameNode } from './node-map.ts';

// Reserved words that cannot be used as parameter/method names in TypeScript.
const TS_RESERVED_WORDS = new Set([
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'new',
	'null',
	'return',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'let',
	'static',
	'implements',
	'interface',
	'package',
	'private',
	'protected',
	'public'
]);

export function nameField(fieldName: string): {
	propertyName: string;
	paramName: string;
} {
	let propertyName = fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
	// Avoid TS reserved keywords for param names by suffixing with '_'
	let paramName = propertyName;
	if (TS_RESERVED_WORDS.has(paramName)) paramName = `${paramName}_`;
	return { propertyName, paramName };
}

// `extractRepeatShape` moved to `simplify.ts` (needed by the inlining
// fixpoint and re-exported for the remaining assemble call sites). The
// function's own semantics are unchanged — peels optional / variant /
// clause / group / token wrappers to expose a `repeat` / `repeat1`.

// ---------------------------------------------------------------------------
// extractVariantChildSymbol — recover the variant child kind name from a
// source='override' polymorph form's content. Each form's content is
// `seq(prefix..., $.variant_child_kind, suffix...)` (after Link's fuse)
// or just `$.variant_child_kind` directly. Returns the symbol's name.
// ---------------------------------------------------------------------------

function extractVariantChildSymbol(rule: Rule): string | null {
	if (rule.type === 'symbol') return rule.name;
	if (rule.type === 'seq') {
		for (const m of rule.members) {
			if (m.type === 'symbol') return m.name;
			if (m.type === 'variant' && m.content.type === 'symbol')
				return m.content.name;
		}
	}
	if (rule.type === 'variant' && rule.content.type === 'symbol')
		return rule.content.name;
	return null;
}

// ---------------------------------------------------------------------------
// Signatures & Projections (stubs — full implementation in refinement)
// ---------------------------------------------------------------------------

function computeSignatures(_nodes: Map<string, AssembledNode>): SignaturePool {
	return { signatures: new Map() };
}

