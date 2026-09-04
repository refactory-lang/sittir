import {
	parsePath,
	applyPath,
	reconstructWrapper,
	reconstructPrec,
	reconstructContainer,
	wrapInPrecStack,
	getGroupLiftRuleBody,
	setGroupLiftRuleBody,
	isEnrichGroupLiftSymbol,
	ApplyPathSkip
} from './transform-path.ts';
import type { PathSegment } from './transform-path.ts';
import { isFieldPlaceholder, maybeKeywordSymbol } from '../primitives/field.ts';
import type { FieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import type { AliasPlaceholder } from '../primitives/alias.ts';
import { isVariantPlaceholder } from '../primitives/variant.ts';
import type { VariantPlaceholder } from '../primitives/variant.ts';
import { isArmDefault } from '../primitives/arm.ts';
import type { ArmDefaultPlaceholder } from '../primitives/arm.ts';
import { isPreference } from '../primitives/preference.ts';
import type { PreferencePlaceholder } from '../primitives/preference.ts';
import {
	wireRegisterSymbolRename,
	wireHasAuthoredRule,
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
import type { RuleAnnotations } from '../../types/rule.ts';
import { nativeRuleFn } from '../enrich.ts';

function armNamesOf(arm: unknown): string[] {
	const node = arm as {
		type?: string;
		value?: unknown;
		name?: string;
		content?: unknown;
		annotations?: RuleAnnotations;
	};
	const names: string[] = [];
	if (node.annotations?.variant !== undefined) names.push(node.annotations.variant);
	if (node.type === 'STRING' && typeof node.value === 'string') names.push(node.value);
	if (node.type === 'ALIAS') {
		const value = node.value as { name?: string } | string | undefined;
		const target = typeof value === 'string' ? value : value?.name;
		if (target !== undefined) names.push(target, target.replace(/^_+/, ''));
		names.push(...armNamesOf(node.content));
	}
	if (node.type === 'SYMBOL' && typeof node.name === 'string') names.push(node.name, node.name.replace(/^_+/, ''));
	if (isPrecWrapper(node as { type: string })) names.push(...armNamesOf(node.content));
	return names;
}

export function applyPreference(rule: RuntimeRule, patch: PreferencePlaceholder, kind: string): RuntimeRule {
	const node = rule as { type?: string; content?: unknown; members?: unknown[] };
	if (node.type === 'CHOICE' && Array.isArray(node.members)) {
		let matched = false;
		const members = node.members.map((arm) => {
			const isDefault = armNamesOf(arm).includes(patch.default);
			matched ||= isDefault;
			return withAnnotations(arm, { preference: patch.label, ...(isDefault ? { default: true as const } : {}) });
		});
		if (!matched) {
			throw new Error(
				`preference('${patch.label}', '${patch.default}') on '${kind}': no arm is spelled '${patch.default}' (arms: ${node.members.map((m) => armNamesOf(m)[0] ?? '?').join(', ')})`
			);
		}
		return { ...(node as object), members } as unknown as RuntimeRule;
	}
	if (node.content !== undefined && node.content !== null && typeof node.content === 'object') {
		return {
			...(node as object),
			content: applyPreference(node.content as RuntimeRule, patch, kind)
		} as unknown as RuntimeRule;
	}
	throw new Error(`preference('${patch.label}', '${patch.default}') on '${kind}': the rule is not a choice`);
}

function withAnnotations(rule: unknown, extra: RuleAnnotations): RuntimeRule {
	const node = rule as { type?: string; content?: unknown; annotations?: RuleAnnotations };
	if (node?.type === 'ALIAS' && node.content !== null && typeof node.content === 'object') {
		const content = node.content as { annotations?: RuleAnnotations };
		return {
			...(node as object),
			content: { ...(content as object), annotations: { ...content.annotations, ...extra } }
		} as unknown as RuntimeRule;
	}
	return { ...(node as object), annotations: { ...node.annotations, ...extra } } as unknown as RuntimeRule;
}

function withVariantAnnotation(rule: unknown, variantName: string, parentKind: string): RuntimeRule {
	return withAnnotations(rule, { variant: variantName, variantOf: parentKind });
}

function makePolymorphAliasNode(hiddenName: string, visibleName: string): RuntimeRule {
	const alias = nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias');
	const sym = nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol');
	return alias(sym(hiddenName), sym(visibleName));
}

export type PatchValue =
	| RuntimeRule
	| FieldPlaceholder
	| AliasPlaceholder
	| VariantPlaceholder
	| ArmDefaultPlaceholder
	| PreferencePlaceholder;

type PatchSet = Record<number | string, PatchValue>;

export function transform<_Base = unknown>(original: RuntimeRule, ...patchSets: PatchSet[]): RuntimeRule {
	let rule = original;
	for (const patches of patchSets) {
		const hasPathKeys = requiresPathMode(patches);
		const hasPlaceholderAlias = Object.values(patches).some(
			(v) => isAliasPlaceholder(v) || isVariantPlaceholder(v) || isArmDefault(v)
		);
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

function applyPathPatches(original: RuntimeRule, patches: Record<number | string, PatchValue>): RuntimeRule {
	const { variantEntries, otherEntries } = partitionPatchesByVariant(patches);
	let rule = original;
	for (const [key, value] of otherEntries) {
		const segments = parsePath(String(key));
		if (isArmDefault(value)) assertChoiceArmPath(rule, String(key), segments);
		rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
	}
	if (variantEntries.length > 0) {
		rule = applyVariantPatches(rule, variantEntries);
	}
	return rule;
}

function assertChoiceArmPath(rule: RuntimeRule, key: string, segments: readonly PathSegment[]): void {
	applyPath(rule, segments.slice(0, -1), (parent) => {
		if (!isChoiceType(parent.type)) {
			throw new Error(`arm.default: path '${key}' is not a choice arm — its parent is '${parent.type}'`);
		}
		return parent;
	});
}

function partitionPatchesByVariant(patches: Record<number | string, PatchValue>): {
	variantEntries: Array<[string, VariantPlaceholder]>;
	otherEntries: Array<[string, PatchValue]>;
} {
	const variantEntries: Array<[string, VariantPlaceholder]> = [];
	const otherEntries: Array<[string, PatchValue]> = [];
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
	if (!anyEmpty) return null;
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
		const altMember = choiceMembers[resolvedAlt]!;
		const visibleName = polymorphVisibleName(parentKind, p.v.name);
		const hiddenName = polymorphHiddenName(parentKind, p.v.name);
		const lift = enrichLiftArmOf(altMember);
		if (lift !== null) wireRegisterSymbolRename(lift.liftName, hiddenName);
		const altContent = lift === null ? altMember : lift.body;
		const hoistedMembers = seqMembers.map((m, i) => (i === resolvedPos ? altContent : m));
		const hoistedSeq = reconstructContainer(core, hoistedMembers);
		const hoistedBody = wrapVariantBodyInParentPrec(hoistedSeq, precStack);
		if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
			throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
		}
		refs.push(withVariantAnnotation(makePolymorphAliasNode(hiddenName, visibleName), p.v.name, parentKind));
	}
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

function enrichLiftArmOf(
	member: RuntimeRule
): { body: RuntimeRule; liftName: string; symbol: { type?: string; name?: string } } | null {
	if ((member as { type?: string }).type !== 'ALIAS') return null;
	const symbol = (member as { content?: unknown }).content as { type?: string; name?: string } | undefined;
	if (symbol?.type !== 'SYMBOL' || typeof symbol.name !== 'string' || !isEnrichGroupLiftSymbol(symbol as RuntimeRule)) {
		return null;
	}
	const body = getGroupLiftRuleBody(symbol.name);
	return body === undefined ? null : { body, liftName: symbol.name, symbol };
}

function renameEnrichLift(
	aliasMember: RuntimeRule,
	lift: NonNullable<ReturnType<typeof enrichLiftArmOf>>,
	hiddenName: string,
	visibleName: string
): RuntimeRule {
	if (!wireHasAuthoredRule(hiddenName)) wireRegisterSyntheticRule(hiddenName, lift.body);
	wireRegisterSymbolRename(lift.liftName, hiddenName);
	return {
		...(aliasMember as object),
		content: { ...lift.symbol, name: hiddenName },
		value: visibleName
	} as unknown as RuntimeRule;
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

	if (isWrapperType(t)) {
		const newContent = applyFlatPatches(contentOf(original), patches);
		return reconstructWrapper(original, newContent);
	}

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

function resolvePatch(patch: PatchValue, originalMember: RuntimeRule, precStack?: readonly RuntimeRule[]): RuntimeRule {
	if (isFieldPlaceholder(patch)) {
		return resolveFieldPlaceholder(patch, originalMember, precStack);
	}
	if (isFieldLike(patch)) {
		return { ...patch, metadata: makeRuleMetadata({ fieldSource: 'override' }) } as unknown as RuntimeRule;
	}
	if (isArmDefault(patch)) {
		return withAnnotations(originalMember, { default: true });
	}
	if (isPreference(patch)) {
		return applyPreference(originalMember, patch, wireGetCurrentRuleKind() ?? '(unknown)');
	}
	if (isVariantPlaceholder(patch)) {
		const parentKind = wireGetCurrentRuleKind();
		if (!parentKind) {
			throw new Error(`variant('${patch.name}'): no current rule kind — variant() must be used inside a rule callback`);
		}
		const visibleName = polymorphVisibleName(parentKind, patch.name);
		const annotated = (rule: unknown): RuntimeRule => withVariantAnnotation(rule, patch.name, parentKind);
		if ((originalMember as { type?: string }).type === 'ALIAS') {
			const lift = enrichLiftArmOf(originalMember);
			if (lift !== null) {
				return annotated(
					renameEnrichLift(originalMember, lift, polymorphHiddenName(parentKind, patch.name), visibleName)
				);
			}
			return annotated({ ...(originalMember as object), value: visibleName });
		}
		if (variantBranchIsUnmaterializable(originalMember)) {
			return annotated({
				...(deField(originalMember) as object),
				metadata: makeRuleMetadata({ fieldSource: 'override' })
			});
		}
		const hiddenName = polymorphHiddenName(parentKind, patch.name);
		return annotated(
			registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack))
		);
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

	if (isChoiceType(t)) {
		const members = r.members as unknown[] | undefined;
		if (!Array.isArray(members) || members.length !== 2) return null;
		const blankIdx = members.findIndex((m) => {
			const mt = (m as Record<string, unknown>).type;
			return mt === 'BLANK';
		});
		if (blankIdx === -1) return null;
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

function unifyChoiceArmFieldNames(content: unknown, unifiedName: string): unknown {
	const r = content as Record<string, unknown>;
	if (!r || typeof r !== 'object' || !isChoiceType(r.type as string)) return content;
	const members = r.members as unknown[] | undefined;
	if (!Array.isArray(members)) return content;
	let anyChanged = false;
	const newMembers = members.map((m) => {
		if (isFieldLike(m) && m.name !== unifiedName) {
			anyChanged = true;
			return { ...m, name: unifiedName, metadata: makeRuleMetadata({ fieldSource: 'override' }) };
		}
		return m;
	});
	if (!anyChanged) return content;
	return { ...r, members: newMembers };
}

function relabelUniformFieldSet(content: unknown, newName: string): unknown | null {
	const names = new Set<string>();
	let anyRepeatedOccurrence = false;
	let sawUnfieldedSymbol = false;
	const liftBodies = new Map<string, RuntimeRule>();
	const collect = (n: unknown, inRepeat: boolean): void => {
		if (!n || typeof n !== 'object') return;
		if (isFieldLike(n)) {
			names.add(n.name);
			if (inRepeat) anyRepeatedOccurrence = true;
			return;
		}
		if (isEnrichGroupLiftSymbol(n as RuntimeRule)) {
			const liftName = (n as { name?: string }).name;
			const body = liftName === undefined ? undefined : getGroupLiftRuleBody(liftName);
			if (liftName !== undefined && body !== undefined && !liftBodies.has(liftName)) {
				liftBodies.set(liftName, body);
				collect(body, inRepeat);
			}
			return;
		}
		const t = (n as { type?: string }).type;
		if (t === 'SYMBOL' || t === 'ALIAS') {
			sawUnfieldedSymbol = true;
			return;
		}
		const entersRepeat = inRepeat || t === 'REPEAT' || t === 'REPEAT1';
		const r = n as { members?: unknown[]; content?: unknown };
		if (Array.isArray(r.members)) {
			for (const m of r.members) collect(m, entersRepeat);
		} else if (r.content && typeof r.content === 'object') {
			collect(r.content, entersRepeat);
		}
	};
	collect(content, false);
	if (names.size !== 1 || names.has(newName) || !anyRepeatedOccurrence || sawUnfieldedSymbol) return null;
	const rewrite = (n: unknown): unknown => {
		if (!n || typeof n !== 'object') return n;
		if (isFieldLike(n)) {
			return { ...n, name: newName, metadata: makeRuleMetadata({ fieldSource: 'override' }) };
		}
		if (isEnrichGroupLiftSymbol(n as RuntimeRule)) return n;
		const r = n as { members?: unknown[]; content?: unknown };
		if (Array.isArray(r.members)) return { ...(n as object), members: r.members.map(rewrite) };
		if (r.content && typeof r.content === 'object') return { ...(n as object), content: rewrite(r.content) };
		return n;
	};
	for (const [liftName, body] of liftBodies) {
		setGroupLiftRuleBody(liftName, rewrite(body) as RuntimeRule);
	}
	return rewrite(content);
}

function resolveFieldPlaceholder(
	patch: FieldPlaceholder,
	originalMember: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	let content: unknown = originalMember;
	if (isFieldLike(content)) {
		const overrideName = patch.name;
		const existingName = (content as { name?: string }).name ?? '(unknown)';
		const isEnrichShaped = isEnrichShapedFieldWrapper(content);
		if (overrideName === existingName && !process.env.SITTIR_QUIET) {
			const parentKind = wireGetCurrentRuleKind() ?? '(unknown)';
			const label = isEnrichShaped ? 'an enrich-labeled FIELD' : 'an existing FIELD';
			const advice = isEnrichShaped ? 'enrich will cover it automatically.' : 'it already has this name.';
			process.stderr.write(
				`transform: override field('${overrideName}') on '${parentKind}' wraps ${label} — ` +
					`duplicate name ('${overrideName}'). Drop the override entry; ${advice}\n`
			);
		}
		content = content.content;
	} else {
		const nested = findEnrichShapedFieldThroughTransparentWrappers(originalMember);
		if (nested !== null) {
			const overrideName = patch.name;
			const renamedField = {
				...nested.found,
				name: overrideName,
				metadata: makeRuleMetadata({ fieldSource: 'override' })
			};
			const reconstructed = nested.reconstruct(renamedField) as RuntimeRule;
			return reconstructed;
		}
		const relabeled = relabelUniformFieldSet(content, patch.name);
		if (relabeled !== null) {
			return relabeled as RuntimeRule;
		}
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
	if ((originalMember as { type?: string }).type === 'ALIAS') {
		const lift = enrichLiftArmOf(originalMember);
		if (lift !== null) return renameEnrichLift(originalMember, lift, hiddenName, patch.name);
		return { ...(originalMember as object), value: patch.name } as unknown as RuntimeRule;
	}
	return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
}

export function registerAliasedVariant(
	hiddenName: string,
	aliasValue: string,
	originalMember: RuntimeRule,
	bodyWrapper: (body: RuntimeRule) => RuntimeRule
): RuntimeRule {
	const single = originalMember as { type?: string; name?: string };
	if (single.type === 'SYMBOL' && typeof single.name === 'string') {
		const alias = nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias');
		const sym = nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol');
		return alias(originalMember, sym(aliasValue));
	}
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
