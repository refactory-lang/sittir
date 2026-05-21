/**
 * compiler/simplify.ts — derivation-only view of a rule tree.
 *
 * Strips anonymous token delimiters, collapses single-member wrappers,
 * and normalizes idempotent nestings so downstream walkers
 * (`deriveFields`, `deriveChildren`, separator discovery) see a
 * semantic-only view of each rule. Template emission continues to
 * read the raw rule — literals still need to surface as template
 * text.
 *
 * "Keyword-shaped" string detection is driven by the grammar's own
 * `word` rule — the lexer production that tree-sitter uses to
 * recognize words at parse time. Strings whose text matches the
 * grammar's word pattern are preserved (they carry lexical identity
 * the downstream paths key on); strings that don't (punctuation,
 * operators, delimiters) are stripped. When the grammar has no
 * `word` declaration, fall back to `/^\w+$/` as a generic heuristic.
 *
 * Preserves metadata that carries derivation meaning:
 *   - `optional` wrapper around non-vanishing content (required/optional flag)
 *   - `repeat` / `repeat1` separator / leading / trailing
 *   - `field` / `group` / `variant` / `clause` names
 *
 * Elides shapes that contribute nothing to derivation:
 *   - Anonymous-string members inside seqs
 *   - Empty-seq sentinels (from collapsed optional wrappers)
 *   - `optional(anonymous-string)` hints
 *   - Single-member seqs / choices
 *
 * Runs as a dedicated pipeline stage at the end of `optimize()` and
 * produces a full `simplifiedRules` map on `OptimizedGrammar`.
 */

import type { Rule, RenderRule, SimplifiedRule, ChoiceRule, SeqRule, FieldRule, RepeatRule, Repeat1Rule } from './rule.ts';
import type { AssembledNode } from './node-map.ts';
import { compileWordMatcher } from './common.ts';
import { deleteWrapper } from './wrapper-deletion.ts';

/** Does this string lex as a "word" under the grammar's `word` rule? */
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
	if (rule.type === 'pattern' && rule.value === '') return true;
	if (rule.type === 'seq' && rule.members.length === 0) return true;
	return false;
}

function isKeywordShape(value: string, wordMatcher: RegExp | undefined): boolean {
	if (wordMatcher) return wordMatcher.test(value);
	return /^\w+$/.test(value);
}

/**
 * Copy `fieldName` / `multiplicity` / `separator` from `original` onto
 * `result` when `original` carries those attributes and `result` does not
 * already have them. Used by `simplifyRule` rewrite branches that create new
 * rule objects (e.g. `case 'seq':` filtering members, `case 'choice':`
 * merging branches) to ensure RuleBase modifier attributes stamped by
 * `applyWrapperDeletion` are not silently dropped during simplification.
 *
 * Only non-undefined values are transferred; `result`'s own values always
 * win (non-overriding).
 */
function withAttrsFrom(original: Rule, result: Rule): Rule {
	const { fieldName, multiplicity, separator } = original;
	if (fieldName === undefined && multiplicity === undefined && separator === undefined) return result;
	const patch: Record<string, unknown> = {};
	if (fieldName !== undefined && !Object.prototype.hasOwnProperty.call(result, 'fieldName'))
		patch['fieldName'] = fieldName;
	if (multiplicity !== undefined && !Object.prototype.hasOwnProperty.call(result, 'multiplicity'))
		patch['multiplicity'] = multiplicity;
	if (separator !== undefined && !Object.prototype.hasOwnProperty.call(result, 'separator'))
		patch['separator'] = separator;
	if (Object.keys(patch).length === 0) return result;
	return { ...result, ...patch };
}

export function simplifyRule(rule: Rule, wordMatcher?: RegExp, inField: boolean = false): Rule {
	switch (rule.type) {
		case 'seq': {
			// Strip non-keyword strings, remove empty-seq sentinels, flatten nested seqs.
			const members = rule.members
				.map((m) => simplifyRule(m, wordMatcher, inField))
				.filter((m) => {
					if (m.type === 'string' && !isKeywordShape(m.value, wordMatcher)) return false;
					if (m.type === 'seq' && m.members.length === 0) return false;
					return true;
				})
				.flatMap((m) => {
					if (m.type !== 'seq') return [m];
					// Splicing a nested seq into the parent drops the seq NODE.
					// That is only safe when the seq carries no cardinality of its
					// own. A seq with a pushed-down `multiplicity` / `separator` /
					// `fieldName` (e.g. a `repeat(seq(...))` whose wrapper-deletion
					// stamped the seq) is a distinct repeated/optional GROUP whose
					// members share a cardinality that differs from the surrounding
					// seq — splicing would both lose that cardinality and hoist any
					// inner choice to the parent's seq position (creating a
					// non-canonical choice-at-seq). Keep such a seq as one member.
					const sm = m as SeqRule & { multiplicity?: LeafMultiplicity; separator?: unknown; fieldName?: string };
					if (sm.multiplicity !== undefined || sm.separator !== undefined || sm.fieldName !== undefined) {
						return [m];
					}
					return sm.members;
				});
			if (members.length === 0) return withAttrsFrom(rule, { type: 'seq', members: [] });
			if (members.length === 1) return withAttrsFrom(rule, members[0]!);
			return withAttrsFrom(rule, { type: 'seq', members });
		}
		case 'choice': {
			// Variant wrappers preserved for polymorph surface detection.
			const members = rule.members.map((m) => simplifyRule(m, wordMatcher, inField));
			// Fold empty-match members (pattern(""), empty seq) into optional.
			const empty = members.findIndex(isEmptyMatchMember);
			if (empty >= 0 && members.length > 1) {
				const nonEmpty = members.filter((_, i) => i !== empty);
				const inner: Rule = nonEmpty.length === 1 ? nonEmpty[0]! : withAttrsFrom(rule, { type: 'choice', members: nonEmpty });
				return simplifyRule(withAttrsFrom(rule, { type: 'optional', content: inner }), wordMatcher, inField);
			}
			if (members.length === 1) return withAttrsFrom(rule, members[0]!);
			// Merge structurally-equivalent choice branches so same-
			// named fields across branches fuse into a single field
			// with union content. Closes `BinaryExpression.
			// operator: AutoStamp<"&&">`-style bugs where derivation
			// walked an uncanonical tree and silently dropped
			// duplicate-named field occurrences across choice branches.
			const merged = mergeChoiceBranches({ type: 'choice', members });
			if (merged.type !== 'choice') return withAttrsFrom(rule, merged);
			// Cross-branch field hoist: if every branch contains exactly
			// one `field(A, ...)` (directly or nested in a seq), lift A
			// out to an enclosing seq and union the contents. Handles
			// shapes where branches differ in length / extra fields
			// (`choice(field(A, X), seq(field(B, Y), field(A, X)))` →
			// `seq(optional(field(B, Y)), field(A, choice(X)))`) that
			// `mergeChoiceBranches` can't touch because it requires
			// same-length same-kind branches.
			return withAttrsFrom(rule, hoistSharedFieldAcrossChoiceBranches(merged));
		}
		case 'optional': {
			const inner = simplifyRule(rule.content, wordMatcher, inField);
			// Fold to empty-seq when body vanished. Exception: inside
			// a field, anonymous strings are structural content.
			if (inner.type === 'seq' && inner.members.length === 0) {
				return { type: 'seq', members: [] };
			}
			if (!inField && inner.type === 'string' && !isKeywordShape(inner.value, wordMatcher)) {
				return { type: 'seq', members: [] };
			}
			return hoistFieldOutOfSingleContentWrapper({
				type: 'optional',
				content: inner
			});
		}
		case 'repeat': {
			const next = {
				...rule,
				content: simplifyRule(rule.content, wordMatcher, inField)
			};
			return hoistFieldOutOfSingleContentWrapper(next);
		}
		case 'repeat1': {
			const next = {
				...rule,
				content: simplifyRule(rule.content, wordMatcher, inField)
			};
			return hoistFieldOutOfSingleContentWrapper(next);
		}
		case 'field': {
			// Recurse with inField=true so optional(anon-string) survives.
			const recursed: Rule = {
				...rule,
				content: simplifyRule(rule.content, wordMatcher, true)
			};
			return hoistInnerFieldOutOfFieldWrapper(recursed);
		}
		case 'group':
			return {
				...rule,
				content: simplifyRule(rule.content, wordMatcher, inField)
			};
		case 'variant':
			return {
				...rule,
				content: simplifyRule(rule.content, wordMatcher, inField)
			};
		case 'clause':
			return {
				...rule,
				content: simplifyRule(rule.content, wordMatcher, inField)
			};
		default:
			return rule;
	}
}

/**
 * Simplify every rule in an OptimizedGrammar's rules map.
 *
 * Pipeline per rule:
 *   1. `simplifyRule` — strip anon delimiters, collapse single-member
 *      wrappers (legacy behavior).
 *   2. `canonicalize` — merge structurally-equivalent choice branches
 *      so same-named fields across branches fuse into a single
 *      `field(name, choice(v1, v2, …))`. Closes the root cause of
 *      `BinaryExpression.operator: AutoStamp<"&&">`-style bugs where
 *      derivation walked an uncanonical tree and silently dropped
 *      duplicate-named field occurrences across choice branches.
 */
export function simplifyRules(
	rules: Record<string, Rule>,
	wordMatcher?: RegExp,
	inlineKinds: ReadonlySet<string> = new Set()
): Record<string, Rule> {
	const out: Record<string, Rule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		out[name] = normalizeToFixpoint(rule, wordMatcher, rules, inlineKinds);
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
 * @param word - The grammar's word rule name (or null), for keyword-shape detection.
 * @returns A new map containing the simplified form of each rule.
 */
export function computeSimplifiedRules(
	renderRules: Record<string, RenderRule>,
	word: string | null,
	inlineKinds: ReadonlySet<string> = new Set()
): Record<string, SimplifiedRule> {
	const wordMatcher = compileWordMatcher(word, renderRules as Record<string, Rule>);
	const simplified = simplifyRules(renderRules as Record<string, Rule>, wordMatcher, inlineKinds);
	const canonicalized: Record<string, SimplifiedRule> = {};
	for (const [kind, rule] of Object.entries(simplified)) {
		// simplifyRules can re-introduce wrapper nodes (optional / field /
		// repeat / repeat1) via hoist transformations (hoistFieldOutOfSingleContentWrapper,
		// extractFieldAcrossBranches) and choice-empty-match folding. Apply
		// deleteWrapper as a final pass to push any surviving wrapper attributes
		// back down to leaf attributes, satisfying the SimplifiedRule = RenderRule
		// (wrapper-free) invariant. deleteWrapper is idempotent on wrapper-free input.
		const wrapperFree = deleteWrapper(canonicalizeSeqOfLeaves(rule) as Rule) as SimplifiedRule;
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
	return canonicalized;
}

/**
 * Run `inlineRefs` + `simplifyRule` + `canonicalize` to fixpoint.
 * Each individual transformation is non-increasing on rule nesting
 * and designed to be idempotent on its own, but the three passes can
 * enable each other:
 *
 *   - `inlineRefs` substitutes a hidden group/multi's body for
 *     its symbol reference. When the body is a seq and the ref sat
 *     inside another seq, the substitution creates a nested-seq
 *     shape `simplifyRule` can flatten.
 *   - `simplifyRule` strips anonymous delimiters and collapses
 *     single-member wrappers; a freshly-stripped branch may enable
 *     `canonicalize` to merge a sibling choice whose arms now agree.
 *   - `canonicalize` merges a choice of structurally-equivalent
 *     branches into a flat seq; the merged members may themselves
 *     be shapes `simplifyRule` can further collapse.
 *
 * The loop terminates because all three transformations are
 * non-increasing on the rule's structural size (member counts,
 * nesting depth); any change produces a strictly smaller tree by one
 * of those metrics. Safety cap at 16 iterations — a real grammar
 * converges in 2-3.
 */
function normalizeToFixpoint(
	rule: Rule,
	wordMatcher: RegExp | undefined,
	rules: Readonly<Record<string, Rule>>,
	inlineKinds: ReadonlySet<string> = new Set()
): Rule {
	const MAX_ITERS = 16;
	let current = rule;
	for (let i = 0; i < MAX_ITERS; i++) {
		const next = simplifyRule(inlineRefs(current, rules, inlineKinds), wordMatcher);
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
/**
 * Hoist `field()` out of `repeat`/`repeat1`/`optional`:
 * `repeat(field('n', X))` -> `field('n', repeat(X))`.
 *
 * @remarks
 * Non-lossy -- tree-sitter field semantics are insensitive to this swap.
 * Keeps the derive walker's trivial form (fields directly under seq).
 * Preserves separator/trailing/leading metadata on the repeat.
 */
function hoistFieldOutOfSingleContentWrapper(rule: Rule): Rule {
	if (rule.type !== 'optional' && rule.type !== 'repeat' && rule.type !== 'repeat1') return rule;
	const inner = rule.content;
	if (inner.type !== 'field') return rule;
	const wrapper: Rule = { ...rule, content: inner.content };
	return { ...inner, content: wrapper };
}

/**
 * Drop an outer `field('outer', ...)` wrapper when its content contains
 * an inner `field()` at exposable depth. Tree-sitter flattens nested
 * field paths, so the inner field IS a top-level field of the parent
 * kind -- keeping the outer wrapper makes the template walker miss it.
 *
 * @remarks
 * Bails when: content is a bare field (handled by hoistField...), no
 * inner field at exposable depth, or a named-symbol sibling would lose
 * its label from the outer field.
 */
export function hoistInnerFieldOutOfFieldWrapper(rule: Rule): Rule {
	if (rule.type !== 'field') return rule;
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
		case 'seq': {
			const containsField = rule.members.some((m) => m.type === 'field');
			if (containsField) {
				for (const m of rule.members) {
					if (m.type === 'field') continue;
					if (isNamedReference(m)) return true;
				}
			}
			return rule.members.some(hasNamedSiblingOfInnerField);
		}
		case 'choice':
			return rule.members.some(hasNamedSiblingOfInnerField);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'clause':
		case 'group':
		case 'variant':
			return hasNamedSiblingOfInnerField(rule.content);
		default:
			return false;
	}
}

/** True when `rule` is (or wraps) a symbol/supertype that tree-sitter would label. */
function isNamedReference(rule: Rule): boolean {
	switch (rule.type) {
		case 'symbol':
		case 'supertype':
			return true;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'clause':
		case 'group':
		case 'variant':
		case 'token':
		case 'terminal':
			return isNamedReference(rule.content);
		default:
			return false;
	}
}

function hasInnerFieldAtExposableDepth(rule: Rule): boolean {
	switch (rule.type) {
		case 'field':
			return true;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'clause':
		case 'group':
		case 'variant':
			return hasInnerFieldAtExposableDepth(rule.content);
		case 'seq':
		case 'choice':
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
	if (rule.members.some((m) => m.type === 'variant')) return rule;
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
	if (branch.type === 'seq') return branch.members;
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
		if (m.type === 'field') counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
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
			if (m.type === 'field' && m.name === name && extracted === null) {
				extracted = m;
				continue;
			}
			rest.push(m);
		}
		if (!extracted)
			return {
				type: 'choice',
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
	const hasEmptyResidual = residuals.some((r) => r.type === 'seq' && r.members.length === 0);
	const nonEmptyResiduals = residuals.filter((r) => !(r.type === 'seq' && r.members.length === 0));
	if (nonEmptyResiduals.length === 0) return hoistedField;
	const residualCore: Rule =
		nonEmptyResiduals.length === 1 ? nonEmptyResiduals[0]! : { type: 'choice', members: nonEmptyResiduals };
	const residualPart: Rule = hasEmptyResidual ? { type: 'optional', content: residualCore } : residualCore;
	return { type: 'seq', members: [hoistedField, residualPart] };
}

/**
 * Merge a choice-of-structurally-equivalent-branches into a flat seq
 * with per-position unioned contents.
 *
 * Shape example:
 *
 *   before:
 *     choice(
 *       seq(field('op', '&&'), …),
 *       seq(field('op', '||'), …),
 *       seq(field('op', '+'),  …),
 *     )
 *
 *   after:
 *     seq(field('op', choice('&&', '||', '+')), …)
 *
 * Fires when every branch:
 *   - Is a seq (or is a variant/group-wrapped seq, which
 *     `recurseCanonicalize` has left visible).
 *   - Has the same LENGTH as every other branch.
 *   - At each position: same member kind (field / symbol / supertype /
 *     etc.), and same field name (for fields) / same symbol name
 *     (for symbols).
 *
 * For field positions the merged content is `choice(branch0_content,
 * branch1_content, …)` — the union of per-branch contents. Derivation
 * post-merge sees ONE `field('op', choice(...))` instead of N
 * `field('op', …)` occurrences across branches, and
 * `deriveValuesForRule` on the choice emits all literal / symbol
 * values cleanly.
 *
 * For non-field positions (symbol, supertype, bare string) the content
 * is already identical across branches (shape equivalence check), so
 * we pick the first branch's occurrence as canonical.
 *
 * When the shape-equivalence check fails — branches differ in length,
 * kind, or field name — returns the input unchanged. Polymorph /
 * supertype / enum classification handles those cases downstream.
 *
 * Called bottom-up: branches passed in have already been
 * canonicalized, so nested choice-of-equivalent-branches inside a
 * branch has already been flattened.
 */
function mergeChoiceBranches(rule: ChoiceRule): Rule {
	if (rule.members.length === 0) return rule;
	// NEVER unwrap variant() — variants mark intentional polymorph-
	// distinct branches that must retain their identity. If ANY
	// member is variant-wrapped, bail: this choice is a polymorph
	// surface, not a mergeable same-shape choice.
	if (rule.members.some((m) => m.type === 'variant')) return rule;
	// Unwrap only group/clause wrappers (purely structural).
	const unwrapped = rule.members.map(unwrapForMerge);
	// Special case: every branch is a bare `field` of the same name.
	// Emerges after optimize's factorSeqChoice peels a shared
	// prefix/suffix off a homogeneous-seq choice, leaving a choice
	// over just the discriminator field — e.g. rust binary_expression
	// post-factor: `choice(field('operator', '&&'), field('operator',
	// '||'), …)`. Merge into a single `field(name, choice(contents))`.
	if (unwrapped.every((b): b is FieldRule => b.type === 'field')) {
		const first = unwrapped[0]!;
		if (unwrapped.every((f) => f.name === first.name)) {
			return mergePosition(unwrapped);
		}
	}
	// Every branch must be a seq of the same length.
	if (!unwrapped.every((b): b is SeqRule => b.type === 'seq')) return rule;
	const len = unwrapped[0]!.members.length;
	if (!unwrapped.every((b) => b.members.length === len)) return rule;
	// Check position-by-position structural equivalence.
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((b) => b.members[i]!);
		if (!positionsAreMergeable(position)) return rule;
	}
	// All positions mergeable. Build the merged seq.
	const mergedMembers: Rule[] = [];
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((b) => b.members[i]!);
		mergedMembers.push(mergePosition(position));
	}
	if (mergedMembers.length === 0) return { type: 'seq', members: [] };
	if (mergedMembers.length === 1) return mergedMembers[0]!;
	return { type: 'seq', members: mergedMembers };
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
	if (rule.type === 'group') return unwrapForMerge(rule.content);
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
	if (first.type === 'field') {
		return position.every((p) => p.type === 'field' && p.name === first.name);
	}
	if (first.type === 'symbol') {
		return position.every((p) => p.type === 'symbol' && p.name === first.name);
	}
	if (first.type === 'supertype') {
		return position.every((p) => p.type === 'supertype' && p.name === first.name);
	}
	if (first.type === 'string') {
		// Same literal at same position is fine. Different literals at
		// same position means the literal itself is the discriminator
		// — that's the "choice of literals" case (handled by
		// separator / enum detection; leave for now).
		return position.every((p) => p.type === 'string' && p.value === first.value);
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
	if (first.type === 'field') {
		const fields = position.filter((p): p is FieldRule => p.type === 'field');
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
		case 'seq':
			return {
				...rule,
				members: rule.members.map(hoistInnerFieldsForTemplate)
			};
		case 'choice':
			return {
				...rule,
				members: rule.members.map(hoistInnerFieldsForTemplate)
			};
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'group':
		case 'variant':
		case 'clause':
		case 'token':
		case 'terminal':
			return {
				...rule,
				content: hoistInnerFieldsForTemplate((rule as { content: Rule }).content)
			} as Rule;
		case 'field': {
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
export function inlineRefs(
	rule: Rule,
	rules: Readonly<Record<string, Rule>>,
	inlineKinds: ReadonlySet<string> = new Set(),
	visited: ReadonlySet<string> = new Set()
): Rule {
	const recurse = (r: Rule, v: ReadonlySet<string>): Rule => inlineRefs(r, rules, inlineKinds, v);
	switch (rule.type) {
		case 'symbol': {
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
				const inlined = inlineRefs(inlineTarget ?? target, rules, inlineKinds, next);
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

			// Not inline-listed. Visible symbols are never inlined.
			if (!rule.hidden) return rule;
			if (visited.has(rule.name)) return rule;
			const target = rules[rule.name];
			if (!target) return rule;

			// Don't inline group-lift synthesized symbol refs via the group/multi
			// path — those are deliberate structural boundaries: the referenced kind
			// should materialise as its own AssembledGroup, not be inlined away.
			if ((rule as { source?: string }).source === 'group-lift') return rule;

			// GROUP / MULTI path: inline hidden group and multi helpers.
			const inlineTarget = resolveGroupOrMultiInlineTarget(target);
			if (!inlineTarget) return rule;
			const next = new Set(visited);
			next.add(rule.name);
			return inlineRefs(inlineTarget, rules, inlineKinds, next);
		}
		case 'seq':
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) };
		case 'choice':
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) };
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
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
function resolveGroupOrMultiInlineTarget(target: Rule): Rule | null {
	const isGroup = target.type === 'group';
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

type LeafMultiplicity = 'optional' | 'array' | 'nonEmptyArray' | undefined;

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
 */
function combineMultiplicity(outer: LeafMultiplicity, inner: LeafMultiplicity): LeafMultiplicity {
	if (outer === undefined) return inner;
	const isCollection = (m: LeafMultiplicity): boolean => m === 'array' || m === 'nonEmptyArray';
	const guaranteesOne = (m: LeafMultiplicity): boolean => m === undefined || m === 'nonEmptyArray';
	if (isCollection(outer) || isCollection(inner)) {
		return guaranteesOne(outer) && guaranteesOne(inner) ? 'nonEmptyArray' : 'array';
	}
	return outer === 'optional' || inner === 'optional' ? 'optional' : undefined;
}

/**
 * Stamp `multiplicity` / `separator` / `fieldName` onto the slot-bearing
 * leaves of a (wrapper-free) rule body. Structural nodes are descended;
 * leaves are stamped. An existing array / nonEmptyArray multiplicity on a
 * leaf is preserved (it is already at least as multi as the pushed value).
 * `fieldName` is only applied to a leaf that has no field name yet.
 */
function pushAttrsToLeaves(
	rule: Rule,
	multiplicity: 'optional' | 'array' | 'nonEmptyArray' | undefined,
	separator: unknown,
	fieldName: string | undefined
): Rule {
	const recurse = (r: Rule): Rule => pushAttrsToLeaves(r, multiplicity, separator, fieldName);
	switch (rule.type) {
		case 'seq':
			// A seq is flattened into its parent by `canonicalizeSeqOfLeaves`, so
			// a seq-level multiplicity would be lost. Push into members instead.
			return { ...rule, members: (rule as { members: Rule[] }).members.map(recurse) } as Rule;
		case 'choice': {
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
			return { ...rule, ...patch } as Rule;
		}
		case 'group':
		case 'variant':
		case 'clause':
		case 'token':
		case 'alias':
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
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
 * Unwrap structural wrappers around a repeat / repeat1 so the caller
 * can detect `optional(repeat(...))`, `group(repeat1(...))`, etc.
 * Returns `null` for anything that isn't ultimately a repeat shape.
 */
export function extractRepeatShape(rule: Rule): { repeat: RepeatRule | Repeat1Rule; nonEmpty: boolean } | null {
	switch (rule.type) {
		case 'repeat':
			return { repeat: rule, nonEmpty: false };
		case 'repeat1':
			return { repeat: rule, nonEmpty: true };
		case 'optional':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
			return extractRepeatShape((rule as { content: Rule }).content);
		default:
			return null;
	}
}

// ---------------------------------------------------------------------------
// Universal-shape canonicalization + post-condition check (Task 1.9 / PR0)
// ---------------------------------------------------------------------------
//
// Per the rule-attributes refactor spec's "Universal canonical shape"
// decision: every AssembledBranch / AssembledGroup body, after
// simplification, should be a `SeqRule` whose members are leaves (literals
// + slot-refs). No nested structural rules (seq / choice / optional /
// repeat / repeat1 / field / variant / group / polymorph / clause) with
// slot content.
//
// Post-PR2 the invariant is established by:
//   - applyWrapperDeletion (optimize.ts) pushes modifier wrappers
//     (optional / field / repeat / repeat1) down to leaf RuleBase
//     attributes (multiplicity, fieldName, separator). Output: RenderRule.
//   - applyAutoGroups (dsl/wire/auto-groups.ts) synthesizes hidden helpers
//     for optional(seq(...)) / repeat(seq(...)) at wire time and registers
//     them in grammar.inline.
//   - inlineRefs (this file) inlines GROUP / MULTI hidden refs AND any
//     group-lift-sourced ref whose target is in grammar.inline, matching
//     tree-sitter's parse-time inlining.
//   - simplifyRules + canonicalizeSeqOfLeaves run to fixpoint and a final
//     deleteWrapper pass enforces wrapper-free output (SimplifiedRule).
//
// assertUniversalShape(node) remains test-only. The above sequence holds
// the invariant on real grammars, but wiring as a production fail-fast
// gate is deferred — flagged as a follow-up post-PR2.

/**
 * Generic post-order child recursion for the `Rule` IR. Mirrors
 * `dsl/enrich.ts:recurseChildren` but tightened to the canonical typed
 * Rule shape (no string-typed legacy variants like 'TOKEN' / 'ALIAS' /
 * 'IMMEDIATE_TOKEN' — those don't appear post-evaluate).
 *
 * Identity-preserving: returns the input rule unchanged when no child
 * was rewritten (`visit` returned the same reference for every child).
 */
function recurseChildren(rule: Rule, visit: (r: Rule) => Rule): Rule {
	switch (rule.type) {
		case 'seq':
		case 'choice': {
			const members = rule.members;
			let changed = false;
			const next = members.map((m) => {
				const out = visit(m);
				if (out !== m) changed = true;
				return out;
			});
			return changed ? ({ ...rule, members: next } as Rule) : rule;
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'alias':
		case 'terminal': {
			const content = (rule as { content: Rule }).content;
			const out = visit(content);
			return out === content ? rule : ({ ...rule, content: out } as Rule);
		}
		case 'polymorph': {
			const forms = rule.forms;
			let changed = false;
			const next = forms.map((f) => {
				const out = visit(f.content);
				if (out !== f.content) changed = true;
				return out === f.content ? f : { ...f, content: out };
			});
			return changed ? ({ ...rule, forms: next } as Rule) : rule;
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
	if (recursed.type === 'seq' && recursed.members.length === 1) {
		return recursed.members[0]!;
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
function isLeaf(rule: Rule): boolean {
	switch (rule.type) {
		case 'symbol':
		case 'alias':
		case 'string':
		case 'pattern':
		case 'enum':
		case 'terminal':
		case 'token':
		case 'indent':
		case 'dedent':
		case 'newline':
			return true;
		default:
			return false;
	}
}

/**
 * Post-condition check for the universal canonical shape: every
 * AssembledBranch / AssembledGroup body must be a `SeqRule` whose members
 * are leaves (literals + slot-refs), or a single bare leaf. No nested
 * structural rules with slot content.
 *
 * No-ops for non-branch / non-group nodes (patterns, keywords, tokens,
 * enums, supertypes, multis, polymorphs — these have their own shape
 * invariants).
 *
 * Throws with kind name + offending sub-rule type when the invariant
 * doesn't hold.
 *
 * **NOT yet wired into the production pipeline** — exposed for test use
 * only. See module-level note above.
 */
export function assertUniversalShape(node: AssembledNode): void {
	if (node.modelType !== 'branch' && node.modelType !== 'group') return;
	// Read the body from `simplifiedRule` — the public surface that branch
	// and group expose for downstream consumers. The protected `rule`
	// field is the raw pre-simplify shape; the invariant is about the
	// simplified form.
	const body = node.simplifiedRule;
	if (!body) return;
	if (body.type !== 'seq') {
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
 * Rule-level universal-shape assertion. Mirrors {@link assertUniversalShape}
 * (which checks AssembledNode.simplifiedRule) but operates on a Rule
 * directly — used by computeSimplifiedRules to fail-fast at the simplify
 * boundary rather than at assembly time.
 *
 * Called (gated) inside `computeSimplifiedRules` when the env var
 * `SITTIR_ASSERT_UNIVERSAL_SHAPE=1` is set. Not yet wired unconditionally
 * because many kinds still violate the invariant; the env-var gate lets
 * Tasks 3.B-derive-rewrite / 3.B3 / 3.B4 enable it incrementally and
 * Task 3.B6 flip the default once every kind passes.
 */
export function assertUniversalShapeRule(rule: Rule, kind: string): void {
	if (rule.type !== 'seq') {
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
