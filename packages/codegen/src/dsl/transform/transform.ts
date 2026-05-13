/**
 * dsl/transform.ts — sittir override primitives for rule patching.
 *
 * These are NOT tree-sitter baseline DSL. They are sittir-specific
 * extensions that operate on the `original` rule passed by tree-sitter's
 * `grammar(base)` mechanism to each rule callback.
 *
 * Override files import these explicitly:
 *
 *     import { transform, insert, replace } from '@sittir/codegen/dsl'
 *
 * The baseline shadow functions (`grammar`, `seq`, `choice`, `field`, ...)
 * are still injected as globals by `evaluate.ts` — don't import those.
 *
 * Types are deliberately `RuntimeRule` (not sittir's `Rule` union).
 * The `original` argument comes from tree-sitter's extension mechanism
 * at runtime — that's sittir-shaped under sittir's pipeline but
 * tree-sitter-native (uppercase types) under the CLI runtime. Typing
 * as `RuntimeRule` is honest in both directions and forces callers
 * that inspect the result to narrow via guards in `runtime-shapes.ts`.
 * Override files are `@ts-nocheck` so they're unaffected.
 */

import {
	parsePath,
	applyPath,
	reconstructWrapper,
	reconstructPrec,
	reconstructContainer,
	wrapInPrecStack
} from './transform-path.ts';
import { isFieldPlaceholder, maybeKeywordSymbol } from '../primitives/field.ts';
import type { FieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import type { AliasPlaceholder } from '../primitives/alias.ts';
import { isVariantPlaceholder } from '../primitives/variant.ts';
import type { VariantPlaceholder } from '../primitives/variant.ts';
import {
	wireRegisterSyntheticRule,
	wireRegisterPolymorphVariant,
	wireRegisterConflict,
	wireGetCurrentRuleKind,
	polymorphVisibleName,
	polymorphHiddenName
} from '../wire/wire.ts';
import {
	isFieldLike,
	isPrecWrapper,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isBlankType,
	isOptionalType,
	isPlainRepeatType
} from '../runtime-shapes.ts';
import type { RuntimeRule } from '../runtime-shapes.ts';

/**
 * Apply patches to a rule. Patches are an object with path-string keys
 * and Rule (or one-arg field placeholder) values:
 *
 *     transform(original, {
 *         0:       field('name'),       // flat numeric — single-segment path
 *         '0/1':   field('inner'),      // nested path
 *         '0/*\/0': field('items'),     // wildcard
 *     })
 *
 * Two evaluation modes, auto-detected by key shape:
 *
 * 1. **Flat positional** — every key is a pure numeric string. Patches
 *    apply to seq members at that position, recursively descending
 *    through choice alternatives and content wrappers (preserves
 *    legacy override behavior on rules where the original is a choice
 *    of equal-shape alternatives).
 *
 * 2. **Path-addressed** — at least one key contains `/` or `*`. Each
 *    key is parsed as a path and applied to exactly the position(s) it
 *    addresses. Precedence wrappers (prec/PREC_LEFT/...) are
 *    transparent so the same paths work in both sittir and tree-sitter
 *    runtimes.
 *
 * Field patches are marked `source: 'override'` so derive-overrides-json
 * recognizes them. One-arg `field('name')` placeholders are filled in
 * from the original member at the target position; an enrich-inferred
 * field wrapper on the original is unwrapped before re-wrapping to
 * avoid nested fields.
 */
type PatchSet = Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>;

/**
 * @typeparam Base - The base tree-sitter grammar's type (typically
 *   `typeof base` from `tree-sitter-<lang>/grammar.js`). Reserved for
 *   future grammar-aware path validation; currently a phantom parameter
 *   that lets call sites write `transform<typeof base>(original, ...)`
 *   so the generic surface is uniform with `wire<Base>` /
 *   `PolymorphsConfig<Base>` / `TransformsConfig<Base>`.
 */
export function transform<_Base = unknown>(original: RuntimeRule, ...patchSets: PatchSet[]): RuntimeRule {
	let rule = original;
	for (const patches of patchSets) {
		const hasPathKeys = requiresPathMode(patches);
		const hasPlaceholderAlias = Object.values(patches).some((v) => isAliasPlaceholder(v) || isVariantPlaceholder(v));
		if (hasPathKeys || hasPlaceholderAlias) {
			rule = applyPathPatches(rule, patches);
		} else {
			rule = applyFlatPatches(rule, patches as Record<number | string, RuntimeRule>);
		}
	}
	return rule;
}

/**
 * Determine whether a patch-set must be processed in path mode rather
 * than flat-positional mode.
 *
 * @remarks
 * Path mode triggers whenever a key is not a pure non-negative integer.
 * Originally the predicate only checked for `/` or `*`; extending it to
 * the full "not-a-non-neg-integer" gate routes negative indices (`-1`)
 * and kind-name segments (`_expression`) through parsePath + applyPath
 * (they parsed as invalid in flat mode previously). Flat mode stays
 * reserved for simple positional patching of seq members with plain
 * `N: patch` entries.
 *
 * @param patches - The patch-set whose keys are inspected.
 * @returns `true` if any key is not a pure non-negative integer string.
 */
function requiresPathMode(patches: PatchSet): boolean {
	return Object.keys(patches).some((k) => !/^\d+$/.test(k));
}

function applyPathPatches(
	original: RuntimeRule,
	patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>
): RuntimeRule {
	const { variantEntries, otherEntries } = partitionPatchesByVariant(patches);
	let rule = original;
	for (const [key, value] of otherEntries) {
		const segments = parsePath(String(key));
		rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
	}
	if (variantEntries.length > 0) {
		rule = applyVariantPatches(rule, variantEntries);
	}
	return rule;
}

/**
 * Separate a patch-set into variant patches and all other patches so
 * they can be applied in the correct two-phase order.
 *
 * @remarks
 * Variant patches must be applied after all other patches have baked
 * their field placements into the structure. Sequential per-patch
 * application can't handle hoisting because hoisting the first patch
 * restructures the rule so the second patch's path no longer resolves.
 *
 * @param patches - The full patch-set to partition.
 * @returns Two arrays: `variantEntries` for variant() patches and
 *   `otherEntries` for everything else.
 */
function partitionPatchesByVariant(
	patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>
): {
	variantEntries: Array<[string, VariantPlaceholder]>;
	otherEntries: Array<[string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder]>;
} {
	const variantEntries: Array<[string, VariantPlaceholder]> = [];
	const otherEntries: Array<[string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder]> = [];
	for (const entry of Object.entries(patches)) {
		const v = entry[1];
		if (isVariantPlaceholder(v)) variantEntries.push([entry[0], v]);
		else otherEntries.push(entry);
	}
	return { variantEntries, otherEntries };
}

/**
 * Apply variant patches to a rule, using hoisting when any variant
 * targets an empty-matching alternative, falling back to per-patch
 * application otherwise.
 *
 * @remarks
 * If any variant would extract an empty-matching body, hoist ALL sibling
 * variants to the nearest enclosing scaffolding so none match empty.
 * Literals move into each alias body so tree-sitter accepts the extracted
 * hidden rules (named syntactic rules can't match empty).
 *
 * @param rule - The rule (after non-variant patches) to apply variants to.
 * @param variantEntries - Array of [pathKey, VariantPlaceholder] pairs.
 * @returns The rule with all variant patches applied.
 */
function applyVariantPatches(
	rule: RuntimeRule,
	variantEntries: ReadonlyArray<[string, VariantPlaceholder]>
): RuntimeRule {
	// Sort deepest-first so variants at greater path depth run before
	// shallower ones. Without this, a shallower variant that aliases
	// an ancestor position would block later descents through it
	// (ALIAS wrappers only allow index 0/-1). Also unblocks the common
	// case where mixed numeric + path keys coexist in one polymorph:
	// JS object iteration places pure-numeric keys first in numeric
	// order regardless of insertion order, so relying on author-
	// specified ordering isn't portable.
	const ordered = [...variantEntries].sort(([a], [b]) => parsePath(b).length - parsePath(a).length);
	const hoisted = tryHoistSiblingVariants(rule, ordered);
	if (hoisted) {
		let result = hoisted.rule;
		for (const [key, value] of ordered) {
			if (hoisted.consumed.has(key)) continue;
			const segments = parsePath(key);
			result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, precStack));
		}
		return result;
	}
	let result = rule;
	for (const [key, value] of ordered) {
		const segments = parsePath(key);
		result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, precStack));
	}
	return result;
}

/**
 * Detect and apply "hoisted variant" restructuring when any variant()
 * patch targets an empty-matching choice alternative. Without hoisting,
 * tree-sitter rejects the extracted hidden rule (named syntactic rules
 * can't match empty). With hoisting, the surrounding rule scaffolding
 * (e.g. `[` and `]` literals around the choice) moves INTO each alias
 * body — guarantees non-empty AND disambiguates from sibling rules with
 * similar inner shapes.
 *
 * Only handles the common case: top-level seq containing a choice whose
 * alternatives are the variant targets. Paths must all be `N/M` with
 * the same `N` (the choice's position in the seq). For more complex
 * nestings, the caller falls back to per-patch variant extraction.
 */
function tryHoistSiblingVariants(
	rule: RuntimeRule,
	variantEntries: ReadonlyArray<[string, VariantPlaceholder]>
): { rule: RuntimeRule; consumed: Set<string> } | null {
	const { bail, precStack, core } = peelPrecWrappersFromRule(rule);
	const t = core.type;
	if (!t) return bail('core rule has no type after prec peeling');
	if (!isSeqType(t)) return bail(`core rule type '${t}' is not seq/SEQ`);
	const parsed = parseVariantPathsForHoist(variantEntries, bail);
	if (parsed === null) return null;
	const choicePos = parsed[0]!.choicePos;
	if (parsed.some((p) => p.choicePos !== choicePos))
		return bail(
			`variant patches target mixed choice positions (${parsed.map((p) => p.choicePos).join(',')}) — hoist needs all siblings at one choice`
		);
	const seqMembers = [...membersOf(core)];
	const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
	const choice = seqMembers[resolvedPos];
	if (!choice || !isChoiceType(choice.type))
		return bail(`position ${resolvedPos} is '${choice?.type}', not choice/CHOICE`);
	const choiceMembers = membersOf(choice);
	const anyEmpty = parsed.some((p) =>
		matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]!)
	);
	if (!anyEmpty) return null; // non-empty variants fall through to per-patch extraction — not an error, just not a hoist candidate
	const parentKind = wireGetCurrentRuleKind();
	if (!parentKind) return bail('no current rule kind (variant()/transform() called outside rule callback?)');
	return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, parentKind, precStack);
}

/**
 * Peel prec wrappers from a rule root and set up the debug/bail context for
 * hoist analysis.
 *
 * @remarks
 * Grammars commonly wrap a polymorph in `prec.left(N, seq(...))` /
 * `prec.right(N, ...)` / `prec(tag, ...)` to resolve intra-rule ambiguities.
 * The same prec is reapplied to each hoisted variant's body so the extracted
 * rules inherit the parent's conflict-resolution context; otherwise
 * tree-sitter's LR table sees unresolvable ambiguities at the
 * extracted-variant sites. When SITTIR_DEBUG is set, the bail helper logs
 * which guard failed so authors can diagnose why a hoist didn't take effect —
 * "rule looks right but only one form was split" is otherwise impossible to
 * diagnose without stepping into transform.ts.
 *
 * @param rule - The rule to peel prec wrappers from.
 * @returns `bail` helper that logs + returns null, accumulated `precStack`, and
 *   the unwrapped `core` rule.
 */
function peelPrecWrappersFromRule(rule: RuntimeRule): {
	bail: (reason: string) => null;
	precStack: RuntimeRule[];
	core: RuntimeRule;
} {
	const dbg = typeof process !== 'undefined' ? process?.env?.SITTIR_DEBUG : undefined;
	const kindFor = wireGetCurrentRuleKind() ?? '(unknown)';
	const bail = (reason: string): null => {
		if (dbg) console.error(`[sittir] hoist skipped on '${kindFor}': ${reason}`);
		return null;
	};
	const precStack: RuntimeRule[] = [];
	let core = rule;
	while (core && isPrecWrapper(core)) {
		precStack.push(core);
		core = contentOf(core);
	}
	return { bail, precStack, core };
}

/**
 * Parse variant patch entries into structured records for hoist analysis.
 *
 * @remarks
 * Each entry must be a two-segment `N/M` path with both segments being
 * plain indices. Kind-match and wildcard paths are not supported for
 * hoisting; the caller falls back to per-patch extraction if any entry
 * fails validation.
 *
 * @param variantEntries - Array of [pathKey, VariantPlaceholder] pairs.
 * @param bail - Bail function to call (and return) on validation failure.
 * @returns Parsed array or `null` if bail was invoked.
 */
function parseVariantPathsForHoist(
	variantEntries: ReadonlyArray<[string, VariantPlaceholder]>,
	bail: (reason: string) => null
): Array<{
	key: string;
	v: VariantPlaceholder;
	choicePos: number;
	altIdx: number;
}> | null {
	const parsed: Array<{
		key: string;
		v: VariantPlaceholder;
		choicePos: number;
		altIdx: number;
	}> = [];
	for (const [key, v] of variantEntries) {
		const segs = parsePath(key);
		if (segs.length !== 2) return bail(`variant patch '${key}' has ${segs.length} segments (expected 2: N/M)`);
		if (segs[0]!.kind !== 'index' || segs[1]!.kind !== 'index')
			return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`);
		parsed.push({ key, v, choicePos: segs[0]!.value, altIdx: segs[1]!.value });
	}
	return parsed;
}

/**
 * Build hoisted variant rules and register all required metadata.
 *
 * @remarks
 * Hoisted variants inherit their parent seq's scaffolding, so they
 * share a token prefix (e.g. `[` + attribute_item repeat) that defeats
 * tree-sitter's LR(1) lookahead. A conflict group is declared across all
 * variant names so the parser-generator emits a GLR state that forks on
 * the prefix and picks the completing interpretation at parse time. Each
 * variant is also declared as a self-conflict — when the variant shares
 * an internal repeat helper with sibling grammar rules (tree-sitter
 * dedups identical repeat shapes across rules, producing a single
 * `*_repeat1`), multiple reduction paths through the same shared helper
 * still produce an unresolved state without the self-entry.
 *
 * @param core - The unwrapped seq rule (after prec peeling).
 * @param seqMembers - Current members of the seq.
 * @param choiceMembers - Members of the targeted choice node.
 * @param resolvedPos - Resolved index of the choice inside the seq.
 * @param choice - The choice rule being replaced.
 * @param parsed - Pre-parsed variant path records.
 * @param parentKind - The kind name of the enclosing rule.
 * @param precStack - Accumulated prec wrappers to reapply around each
 *   variant body.
 * @returns The collapsed choice rule replacing the old seq member, plus
 *   the set of path keys consumed by hoisting.
 */
function buildHoistedVariants(
	core: RuntimeRule,
	seqMembers: RuntimeRule[],
	choiceMembers: RuntimeRule[],
	resolvedPos: number,
	choice: RuntimeRule,
	parsed: ReadonlyArray<{
		key: string;
		v: VariantPlaceholder;
		choicePos: number;
		altIdx: number;
	}>,
	parentKind: string,
	precStack: ReadonlyArray<RuntimeRule>
): { rule: RuntimeRule; consumed: Set<string> } {
	const refs: RuntimeRule[] = [];
	const isUpperCase = core.type === core.type.toUpperCase();
	for (const p of parsed) {
		const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
		const altContent = choiceMembers[resolvedAlt]!;
		const hoistedMembers = seqMembers.map((m, i) => (i === resolvedPos ? altContent : m));
		const hoistedSeq = reconstructContainer(core, hoistedMembers);
		const hoistedBody = wrapVariantBodyInParentPrec(hoistedSeq, precStack);
		// Hidden rule name (underscore-prefixed) — MUST match wire's
		// `injectHiddenRulePlaceholders` naming (`_<parent>_<suffix>`)
		// so the deferred-content fn can read this deposit. Previously
		// this code deposited under the VISIBLE name (`parent_suffix`)
		// which wire's placeholder never looked up, leaving the hidden
		// rule BLANK → tree-sitter "Undefined symbol" on compile.
		// Nested-variant naming: when `parentKind` is already a hidden
		// rule (e.g. `_visibility_modifier_pub`, produced as an arm of
		// an outer polymorph), strip its leading underscore before
		// building the variant's visible kind name. Without stripping,
		// the inner visible name inherits the leading `_` and
		// tree-sitter treats the alias target as hidden, collapsing
		// the variant's contribution.
		const visibleName = polymorphVisibleName(parentKind, p.v.name);
		const hiddenName = polymorphHiddenName(parentKind, p.v.name);
		if (!wireRegisterPolymorphVariant(parentKind, p.v.name)) {
			throw new Error(
				`variant('${p.v.name}'): no active wire() context — variant() must run inside a rule callback under wire()`
			);
		}
		if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
			throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
		}
		// Emit `alias($._hidden, $.visible)` so tree-sitter matches the
		// hidden rule but surfaces the visible kind name in parse trees.
		// Mirrors `registerAliasedVariant`'s output shape used by the
		// non-hoisted variant placeholder path.
		refs.push({
			type: isUpperCase ? 'ALIAS' : 'alias',
			content: { type: isUpperCase ? 'SYMBOL' : 'symbol', name: hiddenName },
			named: true,
			value: visibleName
		} as unknown as RuntimeRule);
	}
	// Conflicts MUST reference declared rules (tree-sitter rejects
	// symbol references to alias targets in the conflicts array with
	// "Undefined symbol"). Use the hidden rule names — those ARE
	// declared via wire's placeholder injection.
	registerHoistedVariantConflicts(parsed.map((p) => polymorphHiddenName(parentKind, p.v.name)));
	const newChoice = reconstructContainer(choice, refs);
	return { rule: newChoice, consumed: new Set(parsed.map((p) => p.key)) };
}

/**
 * Register the GLR conflict groups required for hoisted sibling variants.
 *
 * @remarks
 * Hoisted variants share a token prefix from their parent seq's scaffolding,
 * defeating tree-sitter's LR(1) lookahead. A cross-variant conflict group
 * causes the parser-generator to emit a GLR state that forks on the shared
 * prefix. Each variant is also registered as a self-conflict because
 * tree-sitter deduplicates identical repeat shapes across rules into a
 * single `*_repeat1` helper; without the self-entry, multiple reduction
 * paths through the shared helper produce an unresolved state.
 *
 * @param variantNames - Fully-qualified names of all hoisted variants.
 */
function registerHoistedVariantConflicts(variantNames: string[]): void {
	if (variantNames.length > 0 && !wireRegisterConflict(variantNames)) {
		throw new Error(`registerConflict: no active wire() context`);
	}
	for (const n of variantNames) {
		if (!wireRegisterConflict([n])) {
			throw new Error(`registerConflict: no active wire() context`);
		}
	}
}

// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through the function body.
const membersOf = (r: RuntimeRule): RuntimeRule[] => (r as unknown as { members: RuntimeRule[] }).members;
const contentOf = (r: RuntimeRule): RuntimeRule => (r as unknown as { content: RuntimeRule }).content;

function applyFlatPatches(original: RuntimeRule, patches: Record<number | string, RuntimeRule>): RuntimeRule {
	const t = original.type;
	if (isSeqType(t)) {
		return applyFlatPatchesToSeq(original, patches);
	}

	// Choice: apply transform to each member recursively. Reconstruct
	// via native dsl so the choice keeps its runtime-correct shape.
	if (isChoiceType(t)) {
		const newMembers = membersOf(original).map((m) => applyFlatPatches(m, patches));
		return reconstructContainer(original, newMembers);
	}

	if (isPrecWrapper(original)) {
		return applyFlatPatchesThroughPrec(original, patches);
	}

	// Single-content wrappers (optional/repeat/repeat1/field) — descend
	// and reconstruct via native dsl.
	if (isWrapperType(t)) {
		const newContent = applyFlatPatches(contentOf(original), patches);
		return reconstructWrapper(original, newContent);
	}

	// For other types, return as-is (patches don't apply)
	return original;
}

/**
 * Descend through a precedence wrapper during flat-positional patching,
 * preserving the precedence value on the way back out.
 *
 * @remarks
 * Reconstructing via native `prec` rather than spreading the original
 * wrapper is critical: tree-sitter's parser-generator resolves conflicts
 * using the precedence value that appears in the compiled grammar. If we
 * dropped or changed that value, the parser would resolve ambiguities
 * differently from the base grammar author's intent.
 *
 * @param original - The prec-wrapped rule to descend into.
 * @param patches - Flat-positional patches forwarded to the recursive call.
 * @returns Reconstructed prec wrapper with the inner content patched.
 */
function applyFlatPatchesThroughPrec(
	original: RuntimeRule,
	patches: Record<number | string, RuntimeRule>
): RuntimeRule {
	const newContent = applyFlatPatches(contentOf(original), patches);
	return reconstructPrec(original, newContent);
}

/**
 * Apply flat-positional patches to a seq rule's members by raw index.
 *
 * @remarks
 * Accepts both sittir lowercase `'seq'` and tree-sitter uppercase `'SEQ'`
 * so the same transform call works in both runtimes. Reconstructed via
 * native dsl so the result has the runtime-correct rule shape.
 *
 * Non-pure-numeric keys are rejected up front — `Number('foo')` is NaN
 * and `Number('-0')` is 0. Typos like `'1a'` or `',0'` would otherwise
 * silently no-op. Matches parsePath's strict `/^\d+$/` gate so flat and
 * path modes agree on validity.
 *
 * Out-of-bounds indices throw to match path mode's behavior at
 * applyToMembers. Silently skipping was a footgun where a typo looked
 * like a no-op in sittir runtime.
 *
 * @param original - The seq rule to patch.
 * @param patches - Map of non-negative integer key strings to replacement rules.
 * @returns A new seq rule with the patched members.
 * @throws {Error} If a key is not a non-negative integer or an index is out of bounds.
 */
function applyFlatPatchesToSeq(original: RuntimeRule, patches: Record<number | string, RuntimeRule>): RuntimeRule {
	const members = [...membersOf(original)];
	for (const [key, patch] of Object.entries(patches)) {
		if (!/^\d+$/.test(key)) {
			throw new Error(
				`transform: invalid flat-positional key '${key}' — keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`
			);
		}
		const index = Number(key);
		if (index >= members.length) {
			throw new Error(`transform: index ${index} out of bounds in ${original.type} of length ${members.length}`);
		}
		members[index] = resolvePatch(patch, members[index]!);
	}
	return reconstructContainer(original, members);
}

const wrapInPrec = (content: RuntimeRule, precStack?: readonly RuntimeRule[]): RuntimeRule =>
	wrapInPrecStack(content, precStack, reconstructPrec);

/**
 * Wrap a hoisted variant's body in the parent rule's accumulated prec
 * context, preserving the conflict-resolution intent the grammar author
 * declared on the parent rule.
 *
 * @remarks
 * `wrapInPrec` reapplies the prec stack inner-first so the outermost
 * prec wrapper remains outermost in the result — matching path-descent's
 * reassembly order in `applyPath`. Without this wrapping, tree-sitter's
 * conflict resolver would see the extracted variant without any precedence
 * or associativity annotation, and could resolve ambiguities differently
 * from the base grammar.
 *
 * @param hoistedSeq - The reconstructed seq for a single variant arm.
 * @param precStack - Prec wrappers collected during `peelPrecWrappersFromRule`.
 * @returns The variant body with the full prec stack reapplied.
 */
function wrapVariantBodyInParentPrec(hoistedSeq: RuntimeRule, precStack: ReadonlyArray<RuntimeRule>): RuntimeRule {
	return wrapInPrec(hoistedSeq, precStack);
}

function resolvePatch(
	patch: RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder,
	originalMember: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	if (isFieldPlaceholder(patch)) {
		return resolveFieldPlaceholder(patch, originalMember, precStack);
	}
	// Two-arg field passed through directly — accept either case.
	// Tag `source: 'override'` so derive-overrides-json and template
	// walker recognize it as user-authored.
	if (isFieldLike(patch)) {
		return { ...patch, source: 'override' as const } as unknown as RuntimeRule;
	}
	// Variant placeholder — variant('suffix'): auto-prefix with current
	// rule kind → alias('parentKind_suffix'). Registers polymorph metadata.
	if (isVariantPlaceholder(patch)) {
		const parentKind = wireGetCurrentRuleKind();
		if (!parentKind) {
			throw new Error(`variant('${patch.name}'): no current rule kind — variant() must be used inside a rule callback`);
		}
		if (!wireRegisterPolymorphVariant(parentKind, patch.name)) {
			throw new Error(
				`variant('${patch.name}'): no active wire() context — variant() must run inside a rule callback under wire()`
			);
		}
		const visibleName = polymorphVisibleName(parentKind, patch.name);
		const hiddenName = polymorphHiddenName(parentKind, patch.name);
		return registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack));
	}
	if (isAliasPlaceholder(patch)) {
		return resolveAliasPlaceholder(patch, originalMember, precStack);
	}
	return patch as RuntimeRule;
}

/**
 * Resolve a one-arg field() placeholder against the original member at
 * its target position.
 *
 * @remarks
 * One-arg `field('name')` placeholder — wrap the original member using
 * the runtime's native field() so the resulting rule's type case matches
 * whatever runtime is loading us (sittir lowercase `'field'` vs
 * tree-sitter uppercase `'FIELD'`).
 *
 * An enrich-inferred field on the original member is unwrapped to avoid
 * nested `field('override', field('enriched', inner))`.
 *
 * Bare STRING content is handled specially: tree-sitter strips FIELD
 * wrappers around anonymous string literals during grammar normalization
 * (fields must label structural content, not bare tokens).
 * `maybeKeywordSymbol` synthesizes a hidden `_kw_<name>` rule that
 * produces the original token and returns a SYMBOL reference — FIELD
 * around SYMBOL survives the normalizer. wire() then auto-inlines the
 * helper back into the grammar's LR state machine so parse behavior
 * stays aligned with the pre-promotion bare token. Shared helper used
 * by both this one-arg field() placeholder and dsl/field.ts's two-arg
 * form; receives the prec stack so synthetic rules inherit any OUTER
 * precedence wrapper the original position lived under.
 *
 * @param patch - The one-arg FieldPlaceholder with the desired field name.
 * @param originalMember - The rule currently at the target position.
 * @param precStack - Accumulated prec wrappers for keyword symbol synthesis.
 * @returns A new field rule marked `source: 'override'`.
 * @throws {Error} If no global `field()` function is available in the runtime.
 */
function resolveFieldPlaceholder(
	patch: FieldPlaceholder,
	originalMember: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	let content: unknown = originalMember;
	if (isFieldLike(content) && (content.source === 'enriched' || content.source === 'inferred')) {
		// Override landing on an already-enriched/inferred position is
		// redundant — the one-line entry could be deleted and the
		// enrich/link auto-inference pass would produce the same FIELD
		// automatically. Warn so the author can clean it up on the next
		// cycle. Gated on SITTIR_QUIET like the enrich reportSkip helper.
		// Both 'enriched' (dsl/enrich.ts) and 'inferred' (compiler/link.ts)
		// mark fields we synthesized — neither should leak into the override
		// result as a nested wrapper.
		if (!process.env.SITTIR_QUIET) {
			const parentKind = wireGetCurrentRuleKind() ?? '(unknown)';
			const overrideName = patch.name;
			const enrichName = (content as { name?: string }).name ?? '(unknown)';
			const tag =
				overrideName === enrichName
					? `duplicate name ('${overrideName}')`
					: `override renames '${enrichName}' → '${overrideName}'`;
			process.stderr.write(
				`transform: override field('${overrideName}') on '${parentKind}' wraps an enrich-labeled FIELD — ${tag}. ` +
					`Drop the override entry if the names match; enrich will cover it automatically.\n`
			);
		}
		content = content.content;
	}
	const maybeSymbolized = maybeKeywordSymbol(patch.name, content, (body) => wrapInPrec(body, precStack));
	if (maybeSymbolized !== content) {
		content = maybeSymbolized;
	}
	const native = (globalThis as { field?: (n: string, c: unknown) => unknown }).field;
	if (typeof native !== 'function') {
		throw new Error(
			'transform: no global field() found — patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)'
		);
	}
	const result = native(patch.name, content) as object;
	return { ...result, source: 'override' as const } as unknown as RuntimeRule;
}

/**
 * Resolve an alias() placeholder by registering a hidden rule with the
 * original content and returning an alias reference.
 *
 * @remarks
 * alias('variant_name'): registers a hidden rule with the original
 * content and returns `alias($._hidden, $.visible)`. The hidden rule is
 * picked up by evaluate.ts (sittir) or the grammar wrapper (tree-sitter
 * CLI) after all callbacks run.
 *
 * @param patch - The AliasPlaceholder with the desired alias name.
 * @param originalMember - The rule currently at the target position.
 * @param precStack - Accumulated prec wrappers for the hidden rule body.
 * @returns A new alias rule wrapping the hidden rule.
 */
function resolveAliasPlaceholder(
	patch: AliasPlaceholder,
	originalMember: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	const hiddenName = '_' + patch.name;
	return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
}

/**
 * Wrap a member at a position using a wrapper function that receives
 * the original content. The wrapper's result is marked `source: 'override'`.
 *
 * Reconstructs via the runtime's native `seq()` so the result has the
 * runtime-correct rule shape (sittir lowercase vs tree-sitter
 * uppercase) — same cross-runtime contract as `transform()`.
 */
export function insert(
	original: RuntimeRule,
	position: number,
	wrapper: (content: RuntimeRule) => RuntimeRule
): RuntimeRule {
	const t = original.type;
	if (!isSeqType(t)) {
		throw new Error(`insert() expects a seq rule, got '${original.type}'`);
	}

	const members = [...membersOf(original)];
	if (position < 0 || position >= members.length) {
		throw new Error(`insert(): position ${position} out of bounds (rule has ${members.length} members)`);
	}

	const wrapped = wrapper(members[position]!);
	members[position] = isFieldLike(wrapped)
		? ({ ...wrapped, source: 'override' as const } as unknown as RuntimeRule)
		: wrapped;

	return reconstructContainer(original, members);
}

/**
 * Replace content at a position. Pass `null` to suppress (remove the
 * member). Reconstructs via the runtime's native `seq()`.
 */
export function replace(original: RuntimeRule, position: number, replacement: RuntimeRule | null): RuntimeRule {
	const t = original.type;
	if (!isSeqType(t)) {
		throw new Error(`replace() expects a seq rule, got '${original.type}'`);
	}

	const members = [...membersOf(original)];
	if (position < 0 || position >= members.length) {
		throw new Error(`replace(): position ${position} out of bounds (rule has ${members.length} members)`);
	}

	if (replacement === null) {
		members.splice(position, 1);
	} else {
		members[position] = replacement;
	}

	return reconstructContainer(original, members);
}

// ---------------------------------------------------------------------------
// Aliased-variant synthesis — shared between variant() and alias()
// placeholders. Handles the mechanics of "extract an arbitrary sub-rule
// into a hidden named rule, return an alias node that points at it,
// wrap in prec where needed, and factor out empty-matching content
// tree-sitter won't accept as a syntactic rule."
// ---------------------------------------------------------------------------

/**
 * Build the `alias($._hidden, $.visible)` node AND register the
 * hidden rule's body. Shared between variant() and alias() placeholders
 * because both need the same empty-match / prec handling.
 *
 * Tree-sitter refuses to compile a named syntactic rule whose body
 * matches the empty string (it can't decide which copy-count to choose
 * while parsing). A raw variant extraction can easily produce such a
 * body — e.g. rust's `array_expression` list form is
 * `repeat(elem, sep=',')` which matches zero or more, including zero.
 *
 * When the content is empty-matchable AND we can factor out a non-empty
 * core, extract the core and wrap the call-site alias in `optional()`.
 * The language is preserved (`optional(repeat1(X))` = `repeat(X)`) and
 * the hidden rule is guaranteed non-empty so tree-sitter accepts it.
 */
export function registerAliasedVariant(
	hiddenName: string,
	aliasValue: string,
	originalMember: RuntimeRule,
	bodyWrapper: (body: RuntimeRule) => RuntimeRule
): RuntimeRule {
	const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
	const wasEmpty = matchesEmpty(originalMember);
	const factored = factorOutEmptiness(originalMember);
	if (wasEmpty && !factored) {
		throw new Error(
			`variant()/alias(): can't extract '${hiddenName}' — its content matches the empty string and no non-empty core could be factored out. ` +
				`Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`
		);
	}
	const body = factored ? factored.nonEmpty : originalMember;
	if (!wireRegisterSyntheticRule(hiddenName, bodyWrapper(body as RuntimeRule))) {
		throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
	}
	const aliasNode = {
		type: isUpperCase ? 'ALIAS' : 'alias',
		content: { type: isUpperCase ? 'SYMBOL' : 'symbol', name: hiddenName },
		named: true,
		value: aliasValue
	} as unknown as RuntimeRule;
	if (factored) {
		const optional = (globalThis as { optional?: (c: unknown) => unknown }).optional;
		if (typeof optional !== 'function') {
			throw new Error(
				'transform: no global optional() found — variant()/alias() on empty-matching content needs runtime optional()'
			);
		}
		return optional(aliasNode) as RuntimeRule;
	}
	return aliasNode;
}

/**
 * Conservative empty-match detector. Returns true when `rule` can
 * produce a zero-length match. Used only to decide whether the
 * factored non-empty core is actually non-empty — errs on the side of
 * saying "true" for unknown shapes so callers don't wrongly claim a
 * body is non-empty.
 */
export function matchesEmpty(rule: RuntimeRule): boolean {
	const t = rule.type;
	if (isBlankType(t)) return true;
	if (isOptionalType(t)) return true;
	if (isPlainRepeatType(t)) return true;
	if (isChoiceType(t)) {
		const members = (rule as unknown as { members: RuntimeRule[] }).members;
		return members.some((m) => matchesEmpty(m));
	}
	if (isSeqType(t)) {
		const members = (rule as unknown as { members: RuntimeRule[] }).members;
		return members.every((m) => matchesEmpty(m));
	}
	return false;
}

/**
 * If `rule` matches the empty string but has a factorable non-empty
 * core, return `{ nonEmpty }` — the caller wraps the call site in
 * `optional()` so the language stays the same. Returns null when the
 * rule is either non-empty already or can't be factored.
 */
function factorOutEmptiness(rule: RuntimeRule): { nonEmpty: unknown } | null {
	if (!matchesEmpty(rule)) return null;
	return extractNonEmpty(rule);
}

/**
 * Recursively strip empty-matching branches from transparent
 * composition nodes (SEQ / CHOICE / OPTIONAL / REPEAT) until the
 * result is guaranteed non-empty. Returns null when the whole rule
 * is unconditionally empty or the shape is too pathological to
 * factor cleanly — caller surfaces the limitation upstream.
 */
function extractNonEmpty(rule: RuntimeRule): { nonEmpty: unknown } | null {
	const t = rule.type;
	if (isPlainRepeatType(t)) {
		const r = rule as unknown as Record<string, unknown>;
		const nonEmpty: Record<string, unknown> = {
			...r,
			type: t === 'REPEAT' ? 'REPEAT1' : 'repeat1'
		};
		return { nonEmpty };
	}
	if (isOptionalType(t)) {
		const inner = (rule as unknown as { content: RuntimeRule }).content;
		return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
	}
	if (isChoiceType(t)) {
		const members = (rule as unknown as { members: RuntimeRule[] }).members;
		const nonEmpty = members.filter((m) => !matchesEmpty(m));
		if (nonEmpty.length === 0) return null;
		if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
		return { nonEmpty: { type: t, members: nonEmpty } };
	}
	if (isSeqType(t)) {
		const members = [...(rule as unknown as { members: RuntimeRule[] }).members];
		for (let i = 0; i < members.length; i++) {
			const factored = extractNonEmpty(members[i]!);
			if (factored) {
				members[i] = factored.nonEmpty as RuntimeRule;
				return { nonEmpty: { type: t, members } };
			}
		}
		return null;
	}
	return null;
}
