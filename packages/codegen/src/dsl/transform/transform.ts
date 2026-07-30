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
	wrapInPrecStack,
	getGroupLiftRuleBody,
	ApplyPathSkip
} from './transform-path.ts';
import { isFieldPlaceholder, maybeKeywordSymbol } from '../primitives/field.ts';
import type { FieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import type { AliasPlaceholder } from '../primitives/alias.ts';
import { isVariantPlaceholder } from '../primitives/variant.ts';
import type { VariantPlaceholder } from '../primitives/variant.ts';
import {
	wireRegisterSyntheticRule,
	wireRegisterConflict,
	wireGetCurrentRuleKind,
	polymorphVisibleName,
	polymorphHiddenName
} from '../wire/wire.ts';
import {
	isFieldLike,
	isEnrichShapedFieldWrapper,
	isPrecWrapper,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isBlankType,
	isOptionalType,
	isPlainRepeatType
} from '../../types/runtime-shapes.ts';
import type { RuntimeRule, FieldLike } from '../../types/runtime-shapes.ts';
import { makeRuleMetadata } from '../rule-metadata.ts';
import { nativeRuleFn } from '../enrich.ts';

function makePolymorphAliasNode(hiddenName: string, visibleName: string): RuntimeRule {
	const alias = nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias');
	const sym = nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol');
	return alias(sym(hiddenName), sym(visibleName));
}

type PatchSet = Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>;

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
		if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
			throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
		}
		// Emit `alias($._hidden, $.visible)` so tree-sitter matches the
		// hidden rule but surfaces the visible kind name in parse trees.
		// Mirrors `registerAliasedVariant`'s output shape used by the
		// non-hoisted variant placeholder path.
		refs.push(makePolymorphAliasNode(hiddenName, visibleName));
	}
	// Conflicts MUST reference declared rules (tree-sitter rejects
	// symbol references to alias targets in the conflicts array with
	// "Undefined symbol"). Use the hidden rule names — those ARE
	// declared via wire's placeholder injection.
	registerHoistedVariantConflicts(parsed.map((p) => polymorphHiddenName(parentKind, p.v.name)));
	const newChoice = reconstructContainer(choice, refs);
	return { rule: newChoice, consumed: new Set(parsed.map((p) => p.key)) };
}

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

function countBodyAnchors(rule: RuntimeRule): { tokens: number; named: number } {
	const t = rule.type;
	if (t === 'STRING' || t === 'PATTERN' || t === 'TOKEN') return { tokens: 1, named: 0 };
	if (t === 'SYMBOL') return { tokens: 0, named: 1 };
	if (t === 'BLANK') return { tokens: 0, named: 0 };
	if (isSeqType(rule.type) || isChoiceType(rule.type)) {
		return membersOf(rule).reduce(
			(acc, m) => {
				const c = countBodyAnchors(m);
				return { tokens: acc.tokens + c.tokens, named: acc.named + c.named };
			},
			{ tokens: 0, named: 0 }
		);
	}
	const content = (rule as { content?: RuntimeRule }).content;
	if (content && typeof content === 'object') return countBodyAnchors(content);
	return { tokens: 0, named: 0 };
}

function variantBranchIsUnmaterializable(rule: RuntimeRule): boolean {
	const { tokens, named } = countBodyAnchors(rule);
	return tokens === 0 && named <= 1;
}

function deField(rule: RuntimeRule): RuntimeRule {
	const inner = isFieldLike(rule) ? contentOf(rule) : rule;
	const stripPropagated = (r: RuntimeRule): RuntimeRule => {
		const { fieldName: _drop, ...rest } = r as Record<string, unknown>;
		const content = (rest as { content?: RuntimeRule }).content;
		if (
			content &&
			typeof content === 'object' &&
			!isSeqType((rest as { type: string }).type) &&
			!isChoiceType((rest as { type: string }).type)
		) {
			return { ...rest, content: stripPropagated(content) } as unknown as RuntimeRule;
		}
		return rest as unknown as RuntimeRule;
	};
	return stripPropagated(inner);
}

function applyFlatPatches(original: RuntimeRule, patches: Record<number | string, RuntimeRule>): RuntimeRule {
	const t = original.type;
	if (isSeqType(t)) {
		return applyFlatPatchesToSeq(original, patches);
	}

	// Choice: apply transform to each member recursively, uniformly — the
	// same flat positions are attempted on every arm. Arms are heterogeneous
	// by construction (different lengths/shapes), so a member that doesn't
	// have one of the target positions is left UNCHANGED rather than
	// aborting the whole patch (mirrors applyWildcardToMembers's per-member
	// skip/require-at-least-one-match contract in transform-path.ts — same
	// "some siblings won't match, that's fine" semantics, just for flat
	// positional keys instead of path wildcards). Reconstruct via native
	// dsl so the choice keeps its runtime-correct shape.
	if (isChoiceType(t)) {
		const members = membersOf(original);
		let anyApplied = false;
		const newMembers = members.map((m) => {
			try {
				const patched = applyFlatPatches(m, patches);
				anyApplied = true;
				return patched;
			} catch (e) {
				if (e instanceof ApplyPathSkip) return m;
				throw e;
			}
		});
		if (!anyApplied) {
			throw new Error(
				`transform: flat-positional key(s) [${Object.keys(patches).join(', ')}] matched no choice arm out of ${members.length} — each arm was tried independently and none had all the target positions. Flat keys patch a position uniformly across every arm; they can't select ONE specific arm (a plain digit key on a choice does not mean "arm N"). To replace one specific arm, use path syntax instead (e.g. '${Object.keys(patches)[0]}' as a path segment, or '-1' for the last arm).`
			);
		}
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

function applyFlatPatchesThroughPrec(
	original: RuntimeRule,
	patches: Record<number | string, RuntimeRule>
): RuntimeRule {
	const newContent = applyFlatPatches(contentOf(original), patches);
	return reconstructPrec(original, newContent);
}

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
			// Skippable (not a hard Error): when this seq is one arm of an
			// enclosing choice's flat-patch fan-out, an out-of-bounds index
			// here just means THIS arm doesn't have that position — the
			// choice-level recursion above catches ApplyPathSkip and leaves
			// the arm unchanged. If this seq is the top-level patch target
			// (no enclosing choice fan-out), ApplyPathSkip is never caught
			// and still propagates out of transform() as an error, same as
			// before — genuinely out-of-bounds against the ONE target shape.
			throw new ApplyPathSkip(
				`transform: index ${index} out of bounds in ${original.type} of length ${members.length}`
			);
		}
		members[index] = resolvePatch(patch, members[index]!);
	}
	return reconstructContainer(original, members);
}

const wrapInPrec = (content: RuntimeRule, precStack?: readonly RuntimeRule[]): RuntimeRule =>
	wrapInPrecStack(content, precStack, reconstructPrec);

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
	// Tag `metadata.fieldSource: 'override'` (debt PR-P1) so diagnostics
	// recognize it as user-authored.
	if (isFieldLike(patch)) {
		return { ...patch, metadata: makeRuleMetadata({ fieldSource: 'override' }) } as unknown as RuntimeRule;
	}
	// Variant placeholder — variant('suffix'): auto-prefix with current
	// rule kind → alias('parentKind_suffix'). Registers polymorph metadata.
	if (isVariantPlaceholder(patch)) {
		const parentKind = wireGetCurrentRuleKind();
		if (!parentKind) {
			throw new Error(`variant('${patch.name}'): no current rule kind — variant() must be used inside a rule callback`);
		}
		const visibleName = polymorphVisibleName(parentKind, patch.name);
		// PR 3 (2026-07-21 union-slot design): the arm may already be an
		// enrich-minted visible-group alias (`mintStructuredChoiceArm` /
		// `applyClauseHoist`, widened to fire at bare choice-arm positions —
		// see dsl/enrich.ts) by the time variant() sees it. Its target is,
		// by construction of that mint gate, already a materializing named
		// kind — checked here BEFORE `variantBranchIsUnmaterializable`
		// below, which can't see through a SYMBOL content to the hidden
		// rule's own body and would misjudge an alias-wrapped symbol ref as
		// a unit production. variant() just RENAMES the alias to the
		// friendlier `<parent>_<suffix>` identity instead of wrapping a
		// second hidden rule around the same content ("mint = promote, not
		// synthesize" — matches enrich's own convention, avoids a double mint).
		if ((originalMember as { type?: string }).type === 'ALIAS') {
			// Label-only rename: we can't safely delete a rule from the base
			// grammar's rules map (tree-sitter tolerates dead/unreferenced
			// entries, but relocating-then-deleting risks stranding OTHER
			// consumers keyed by the old name — e.g. enrich's own
			// getEnrichClauseGroupOwners snapshot, taken before this rename
			// runs). Just relabel the outer alias's visible identity to what
			// variant()/polymorphs intends; the underlying enrich-minted
			// hidden rule keeps its own name. Double-mint collisions this
			// could otherwise cause are prevented upstream now — enrich's
			// mintStructuredChoiceArm skips minting for a choice arm that
			// structurally recurses through a bare-symbol sibling arm (see
			// armStartsWithSymbol in dsl/enrich.ts) — so this rename only
			// ever relabels a mint that has no competing identity to collide
			// with.
			const content = (originalMember as { content?: unknown }).content as { type?: string; name?: string } | undefined;
			if (content?.type === 'SYMBOL' && typeof content.name === 'string') {
				const body = getGroupLiftRuleBody(content.name);
				if (body !== undefined) {
					// Deposit under the NESTED polymorph's own hidden name (not the
					// original enrich group-lift name) and repoint the alias's
					// `content` there too — a nested `polymorphs:` config keyed on
					// this exact deposit name (e.g. typescript's cascaded
					// `_export_statement_default_from_arm: {...}`) further splits the
					// deposited body IN PLACE under that name. Leaving `content`
					// pointing at the original group-lift symbol would strand this
					// alias on the pre-split raw mint while the real, fully-split
					// content lives — unreferenced by this alias — under the deposit
					// name (confirmed: `_export_statement_group2` vs. the properly
					// split `_export_statement_default_from_arm`, PR 3 storagename-
					// collision root cause).
					const depositName = polymorphHiddenName(parentKind, patch.name);
					wireRegisterSyntheticRule(depositName, body);
					return {
						...(originalMember as object),
						content: { ...content, name: depositName },
						value: visibleName
					} as unknown as RuntimeRule;
				}
			}
			return { ...(originalMember as object), value: visibleName } as unknown as RuntimeRule;
		}
		// A transparent unit-production branch (single named symbol via
		// fields/prec, no anonymous token) cannot become a CST node:
		// tree-sitter inlines it and bubbles the inner field up to the
		// parent. Skip the alias + polymorph registration and leave the
		// branch as its bare content, so we never promise a
		// `<parent>_<name>` kind that no parse tree contains. De-field it
		// (strip a leading `field(name, X)`): the field can't survive on
		// the CST anyway, and stripping it lets the bare nonterminal unify
		// with its materializable sibling into ONE unnamed body slot
		// (rendered `content`) instead of leaking a stray `value` field
		// the template would drop.
		if (variantBranchIsUnmaterializable(originalMember)) {
			return {
				...(deField(originalMember) as object),
				metadata: makeRuleMetadata({ fieldSource: 'override' })
			} as unknown as RuntimeRule;
		}
		const hiddenName = polymorphHiddenName(parentKind, patch.name);
		return registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack));
	}
	if (isAliasPlaceholder(patch)) {
		return resolveAliasPlaceholder(patch, originalMember, precStack);
	}
	return patch as RuntimeRule;
}

function findEnrichShapedFieldThroughTransparentWrappers(
	node: unknown
): { found: FieldLike; reconstruct: (newInner: unknown) => unknown } | null {
	const r = node as Record<string, unknown>;
	if (!r || typeof r !== 'object') return null;
	const t = r.type as string | undefined;
	if (!t) return null;

	// Shape A: the sittir/tree-sitter-native optional { type: 'OPTIONAL', content: ... }.
	const isSittirOptional = t === 'OPTIONAL';
	if (isSittirOptional) {
		const inner = r.content as unknown;
		if (!inner || typeof inner !== 'object') return null;
		if (isEnrichShapedFieldWrapper(inner)) {
			return {
				found: inner,
				reconstruct: (newInner: unknown) => ({ ...r, content: newInner })
			};
		}
		const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
		if (deeper) {
			return {
				found: deeper.found,
				reconstruct: (newInner: unknown) => ({ ...r, content: deeper.reconstruct(newInner) })
			};
		}
		return null;
	}

	// Shape B: tree-sitter CLI's CHOICE-with-BLANK — the canonical encoding of
	// optional(x) in tree-sitter's runtime: { type: 'CHOICE', members: [x, BLANK] }
	// or [BLANK, x]. Enrich's rebuildOptional preserves this shape.
	// Only treat as transparent when exactly 2 members and one is BLANK.
	if (isChoiceType(t)) {
		const members = r.members as unknown[] | undefined;
		if (!Array.isArray(members) || members.length !== 2) return null;
		const blankIdx = members.findIndex((m) => {
			const mt = (m as Record<string, unknown>).type;
			return mt === 'BLANK';
		});
		if (blankIdx === -1) return null; // a real choice, not an optional
		const contentIdx = 1 - blankIdx;
		const inner = members[contentIdx] as unknown;
		if (!inner || typeof inner !== 'object') return null;
		if (isEnrichShapedFieldWrapper(inner)) {
			return {
				found: inner,
				reconstruct: (newInner: unknown) => {
					const newMembers = [...members];
					newMembers[contentIdx] = newInner;
					return { ...r, members: newMembers };
				}
			};
		}
		const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
		if (deeper) {
			return {
				found: deeper.found,
				reconstruct: (newInner: unknown) => {
					const newMembers = [...members];
					newMembers[contentIdx] = deeper.reconstruct(newInner);
					return { ...r, members: newMembers };
				}
			};
		}
		return null;
	}

	// Shape C: prec wrappers — transparent in path-addressing; content carries
	// the actual rule (value is separate). PREC/PREC_LEFT/PREC_RIGHT/
	// PREC_DYNAMIC are tree-sitter-native-only shapes (sittir's `prec()`
	// strips the wrapper at evaluate — see `evaluate.ts::prec`), so only the
	// uppercase spellings ever appear here.
	if (isPrecWrapper(r as { type: string })) {
		const inner = r.content as unknown;
		if (!inner || typeof inner !== 'object') return null;
		if (isEnrichShapedFieldWrapper(inner)) {
			return {
				found: inner,
				reconstruct: (newInner: unknown) => ({ ...r, content: newInner })
			};
		}
		const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
		if (deeper) {
			return {
				found: deeper.found,
				reconstruct: (newInner: unknown) => ({ ...r, content: deeper.reconstruct(newInner) })
			};
		}
		return null;
	}

	return null;
}

/**
 * When an override wraps a REAL (non-optional-shaped) CHOICE in a field —
 * e.g. `member_expression: { 1: field('separator') }` around
 * `choice('.', field('optional_chain', $.optional_chain))` — tree-sitter's
 * own field-wrapper-collapse semantics give a BARE arm the outer field name
 * for free (nothing competes with it) but leave an ALREADY-fielded arm
 * under its OWN inner name (the innermost field wins). That produces TWO
 * different CST field names for what the override intends as one unified
 * slot: the already-fielded arm silently keeps producing data under its old
 * name, which no generated reader for the new field ever looks at (this is
 * exactly what broke ts `member_expression`'s `optional_chain` arm — see
 * docs/KNOWN_ISSUES.md).
 *
 * Relabel every enrich-shaped fielded arm to the override's chosen name so
 * every arm converges on ONE field — matching sittir's own IR-side
 * precedence (`wrapper-deletion.ts` stamps the OUTER field name) instead of
 * diverging from it. A no-op for choices whose arms are all bare (pure
 * kindEnum literal choices already get the outer name correctly with no
 * help needed here) — this only fires when relabeling is actually required.
 * Shallow — one level of arm descent, matching enrich's own
 * `applyChoiceArmFieldWrap` convention; arms that are themselves nested
 * choices are left alone.
 */
function unifyChoiceArmFieldNames(content: unknown, unifiedName: string): unknown {
	const r = content as Record<string, unknown>;
	if (!r || typeof r !== 'object' || !isChoiceType(r.type as string)) return content;
	const members = r.members as unknown[] | undefined;
	if (!Array.isArray(members)) return content;
	let anyChanged = false;
	const newMembers = members.map((m) => {
		if (isEnrichShapedFieldWrapper(m) && m.name !== unifiedName) {
			anyChanged = true;
			return { ...m, name: unifiedName, metadata: makeRuleMetadata({ fieldSource: 'override' }) };
		}
		return m;
	});
	if (!anyChanged) return content;
	return { ...r, members: newMembers };
}

function resolveFieldPlaceholder(
	patch: FieldPlaceholder,
	originalMember: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	let content: unknown = originalMember;
	if (isEnrichShapedFieldWrapper(content)) {
		// Override landing on a position that is already structurally
		// enrich-shaped (see `isEnrichShapedFieldWrapper`) is redundant —
		// the one-line entry could be deleted and enrich's auto-inference
		// pass would produce the same FIELD automatically. Warn so the
		// author can clean it up on the next cycle. Gated on SITTIR_QUIET
		// like the enrich reportSkip helper. Per the 2026-07-02 user
		// decision, transparency is structural: a user-authored wrapper
		// shape-identical to enrich's output is treated the same as one
		// enrich actually produced — neither should leak into the override
		// result as a nested wrapper.
		const overrideName = patch.name;
		const enrichName = (content as { name?: string }).name ?? '(unknown)';
		// Only warn for the redundant-duplicate case (override matches enrich's
		// auto-name). The rename case (override picks a different name like
		// 'object'/'index' instead of enrich's 'expression1'/'expression2') is
		// the intended override-trumps-enrich behavior — silent by design.
		if (overrideName === enrichName && !process.env.SITTIR_QUIET) {
			const parentKind = wireGetCurrentRuleKind() ?? '(unknown)';
			process.stderr.write(
				`transform: override field('${overrideName}') on '${parentKind}' wraps an enrich-labeled FIELD — ` +
					`duplicate name ('${overrideName}'). Drop the override entry; enrich will cover it automatically.\n`
			);
		}
		content = content.content;
	} else {
		// Not a direct enrich-shaped field — check for one nested inside
		// field-transparent wrappers (optional, prec/*). This handles the case
		// where enrich placed an auto-numbered field INSIDE an optional:
		//   optional(field('where_clause1', $.where_clause))
		// and the override wants to rename it via field('where_clause') at
		// that position. Without this descent, resolveFieldPlaceholder wraps
		// the entire optional with the new field name, producing:
		//   field('where_clause', optional(field('where_clause1', ...)))
		// tree-sitter collapses nested field wrappers to the innermost name,
		// so the intended rename never reaches the parser.
		const nested = findEnrichShapedFieldThroughTransparentWrappers(originalMember);
		if (nested !== null) {
			const overrideName = patch.name;
			// findEnrichShapedFieldThroughTransparentWrappers only returns for
			// structurally enrich-shaped fields, so this is always a safe rename.
			// Rename the inferred field in place and reconstruct the wrappers.
			// Result: optional(field('trailing_where_clause', $.where_clause))
			// instead of: field('trailing_where_clause', optional(field('where_clause2', ...)))
			const renamedField = {
				...nested.found,
				name: overrideName,
				metadata: makeRuleMetadata({ fieldSource: 'override' })
			};
			const reconstructed = nested.reconstruct(renamedField) as RuntimeRule;
			return reconstructed;
		}
		// Not optional-shaped either — if this is a REAL choice (2+ real
		// arms, no BLANK), any arm that's already its own enrich-shaped
		// field under a DIFFERENT name needs relabeling to this override's
		// name before wrapping, or it silently diverges from the other
		// arms (see unifyChoiceArmFieldNames' doc comment).
		const unified = unifyChoiceArmFieldNames(content, patch.name);
		if (unified !== content) {
			content = unified;
		}
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
	return { ...result, metadata: makeRuleMetadata({ fieldSource: 'override' }) } as unknown as RuntimeRule;
}

function resolveAliasPlaceholder(
	patch: AliasPlaceholder,
	originalMember: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	const hiddenName = '_' + patch.name;
	return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
}

// ---------------------------------------------------------------------------
// Aliased-variant synthesis — shared between variant() and alias()
// placeholders. Handles the mechanics of "extract an arbitrary sub-rule
// into a hidden named rule, return an alias node that points at it,
// wrap in prec where needed, and factor out empty-matching content
// tree-sitter won't accept as a syntactic rule."
// ---------------------------------------------------------------------------

export function registerAliasedVariant(
	hiddenName: string,
	aliasValue: string,
	originalMember: RuntimeRule,
	bodyWrapper: (body: RuntimeRule) => RuntimeRule
): RuntimeRule {
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
	const aliasNode = makePolymorphAliasNode(hiddenName, aliasValue);
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

export function matchesEmpty(rule: RuntimeRule): boolean {
	const t = rule.type;
	if (isBlankType(t)) return true;
	if (isOptionalType(t)) return true;
	if (isPlainRepeatType(t)) return true;
	if (isChoiceType(t)) {
		return membersOf(rule).some((m) => matchesEmpty(m));
	}
	if (isSeqType(t)) {
		return membersOf(rule).every((m) => matchesEmpty(m));
	}
	return false;
}

function factorOutEmptiness(rule: RuntimeRule): { nonEmpty: unknown } | null {
	if (!matchesEmpty(rule)) return null;
	return extractNonEmpty(rule);
}

function extractNonEmpty(rule: RuntimeRule): { nonEmpty: unknown } | null {
	const t = rule.type;
	if (isPlainRepeatType(t)) {
		const r = rule as unknown as Record<string, unknown>;
		const nonEmpty: Record<string, unknown> = {
			...r,
			type: 'REPEAT1'
		};
		return { nonEmpty };
	}
	if (isOptionalType(t)) {
		const inner = contentOf(rule);
		return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
	}
	if (isChoiceType(t)) {
		const members = membersOf(rule);
		const nonEmpty = members.filter((m) => !matchesEmpty(m));
		if (nonEmpty.length === 0) return null;
		if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
		return { nonEmpty: { type: t, members: nonEmpty } };
	}
	if (isSeqType(t)) {
		const members = [...membersOf(rule)];
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
