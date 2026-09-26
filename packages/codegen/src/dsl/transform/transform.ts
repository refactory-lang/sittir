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
import { isRulePlaceholder, type RulePlaceholder } from '../primitives/rule.ts';
import { canonicalRuleText } from './token-forms.ts';
import { ABSENT_VARIANT_NAME, isVariantPlaceholder, variant, variantMintName } from '../primitives/variant.ts';
import type { VariantPlaceholder } from '../primitives/variant.ts';
import { isArmDefault } from '../primitives/arm.ts';
import type { ArmDefaultPlaceholder } from '../primitives/arm.ts';
import type { PreferencePlaceholder } from '../primitives/preference.ts';
import { isGroupPlaceholder } from '../primitives/group.ts';
import { isFlattenPlaceholder, type FlattenPlaceholder } from '../primitives/flatten.ts';
import { isRegexPlaceholder, type RegexPlaceholder } from '../primitives/regex.ts';
import type { GroupPlaceholder } from '../primitives/group.ts';
import { withAnnotations, withHoistedAnnotation } from '../annotations.ts';
import type { RuleAnnotations } from '../../types/rule.ts';
import {
	wireRegisterSymbolRename,
	wireHasAuthoredRule,
	wireRegisterSyntheticRule,
	wireRegisterConflict,
	wireGetCurrentRuleKind,
	wireIsExtraRule,
	wireIsPrecedenceRankedRule,
	wireRegisterFlattenedParent,
	wireHasDeposit,
	wireDeclareRuleBody,
	wireAutomaticVariants,
	makeSimpleDollarProxy
} from '../wire/wire.ts';
import { polymorphVisibleName } from '../arm-names.ts';
import {
	isFieldLike,
	isEnrichShapedFieldWrapper,
	isPrecWrapper,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isOptionalType,
	isPlainRepeatType,
	isSymbolType,
	matchesEmpty
} from '../../types/runtime-shapes.ts';
import type { RuntimeRule, FieldLike } from '../../types/runtime-shapes.ts';
import { makeRuleMetadata } from '../rule-metadata.ts';
import { isHiddenKind, lexesAsOneToken } from '../rule-patterns.ts';
import { nativeRuleFn } from '../enrich.ts';
import { relabelledArm, withAuthoredLabel, withoutAutomaticVariants } from '../automatic-variants.ts';

function withVariantAnnotation(rule: unknown, variantName: string, parentKind: string, arm?: unknown): RuntimeRule {
	return withAuthoredLabel(rule as RuntimeRule, { variant: variantName, variantOf: parentKind, ...(isDefaultArm(arm) ? { default: true } : {}) }, wireAutomaticVariants());
}

function isDefaultArm(arm: unknown): boolean {
	const node = arm as { type?: string; content?: { annotations?: RuleAnnotations }; annotations?: RuleAnnotations } | undefined;
	const annotations = node?.type === 'ALIAS' ? node.content?.annotations : node?.annotations;
	return annotations?.default === true;
}

function symbolRef(name: string): RuntimeRule {
	return nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol')(name);
}

function ruleRef(ruleName: string, nodeName: string): RuntimeRule {
	if (ruleName === nodeName) return symbolRef(nodeName);
	const alias = nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias');
	return alias(symbolRef(ruleName), symbolRef(nodeName));
}

export type PatchValue =
	| RuntimeRule
	| FieldPlaceholder
	| AliasPlaceholder
	| RulePlaceholder
	| VariantPlaceholder
	| ArmDefaultPlaceholder
	| PreferencePlaceholder
	| GroupPlaceholder
	| FlattenPlaceholder
	| RegexPlaceholder;

type PatchSet = Record<number | string, PatchValue>;

export function transform<_Base = unknown>(original: RuntimeRule, ...patchSets: PatchSet[]): RuntimeRule {
	let rule = original;
	for (const patches of patchSets) {
		const hasPathKeys = requiresPathMode(patches);
		const hasPlaceholderAlias = Object.values(patches).some(
			(v) => isAliasPlaceholder(v) || isRulePlaceholder(v) || isVariantPlaceholder(v) || isArmDefault(v) || isGroupPlaceholder(v) || isFlattenPlaceholder(v) || isRegexPlaceholder(v)
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
		rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, String(key), precStack));
		if (isArmDefault(value)) rule = clearSiblingDefaults(rule, segments);
	}
	if (variantEntries.length > 0) rule = applyVariantPatches(rule, variantEntries);
	for (const [key, value] of variantEntries) {
		if (value.default === true) rule = clearSiblingDefaults(rule, parsePath(key));
	}
	return rule;
}

function clearSiblingDefaults(rule: RuntimeRule, segments: readonly PathSegment[]): RuntimeRule {
	const last = segments[segments.length - 1];
	if (last?.kind !== 'index') return rule;
	return applyPath(rule, segments.slice(0, -1), (parent) => {
		const members = (parent as { members?: RuntimeRule[] }).members;
		if (members === undefined) return parent;
		return {
			...parent,
			members: members.map((m, i) => (i === last.value || !isDefaultArm(m) ? m : dropDefault(m)))
		} as RuntimeRule;
	});
}

function dropDefault(rule: RuntimeRule): RuntimeRule {
	const strip = (node: RuntimeRule): RuntimeRule => {
		const { default: _drop, ...rest } = (((node as { annotations?: RuleAnnotations }).annotations) ?? {}) as RuleAnnotations & { default?: true };
		return { ...node, annotations: rest } as RuntimeRule;
	};
	const node = rule as { type?: string; content?: RuntimeRule };
	return node.type === 'ALIAS' && node.content !== undefined ? ({ ...rule, content: strip(node.content) } as RuntimeRule) : strip(rule);
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
	if (hoisted === null) {
		const absent = ordered.find(([, v]) => v.absent === true);
		if (absent !== undefined) {
			throw new Error(
				`variant('${absent[1].name}', { absent: true }) at '${absent[0]}' on '${wireGetCurrentRuleKind()}': the absent case only exists when the sibling variants hoist whole-arm (run with SITTIR_DEBUG=1 for the reason they did not)`
			);
		}
	}
	let result = hoisted ? hoisted.rule : rule;
	for (const [key, value] of ordered) {
		if (hoisted?.consumed.has(key)) continue;
		const segments = parsePath(key);
		try {
			result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, key, precStack));
		} catch (error) {
			if (error instanceof Error) error.message = `${wireGetCurrentRuleKind()} patch ${key}: ${error.message}`;
			throw error;
		}
	}
	registerIfPureVariantChoice(result);
	return result;
}

function registerIfPureVariantChoice(rule: RuntimeRule): void {
	const parentKind = wireGetCurrentRuleKind();
	if (!parentKind || wireIsExtraRule(parentKind)) return;
	let core = rule;
	while (isPrecWrapper(core as { type: string })) core = contentOf(core);
	if (!isChoiceType(core.type)) return;
	const arms = membersOf(core);
	if (arms.length < 2 || !arms.every((arm) => isMintedVariantArm(arm, parentKind))) return;
	wireRegisterFlattenedParent(parentKind);
}

function isMintedVariantArm(arm: RuntimeRule, parentKind: string): boolean {
	let node = arm;
	while (isPrecWrapper(node as { type: string })) node = contentOf(node);
	const symbol = node as { type?: string; name?: string; annotations?: { variantOf?: string } };
	if (symbol.type !== 'SYMBOL' || typeof symbol.name !== 'string' || symbol.annotations?.variantOf !== parentKind) return false;
	return wireHasDeposit(symbol.name) || wireHasAuthoredRule(symbol.name);
}

interface SiblingVariantHoistPlan {
	readonly core: RuntimeRule;
	readonly precStack: ReadonlyArray<RuntimeRule>;
	readonly seqMembers: RuntimeRule[];
	readonly resolvedPos: number;
	readonly choice: RuntimeRule;
	readonly choiceMembers: RuntimeRule[];
	readonly parsed: HoistVariantPath[];
	readonly lifted: ReadonlyArray<{ altIdx: number; lift: NonNullable<ReturnType<typeof enrichLiftArmOf>> }>;
}

function planSiblingVariantHoist(
	rule: RuntimeRule,
	variantEntries: ReadonlyArray<[string, VariantPlaceholder]>,
	onBail: (reason: string) => void = () => {}
): SiblingVariantHoistPlan | null {
	const bail = (reason: string): null => {
		onBail(reason);
		return null;
	};
	const { precStack, core } = peelPrecWrappersFromRule(rule);
	const t = core.type;
	if (!t) return bail('core rule has no type after prec peeling');
	if (!isSeqType(t)) return bail(`core rule type '${t}' is not seq/SEQ`);
	const absentEntries = variantEntries.filter(([, v]) => v.absent === true);
	const parsed = parseVariantPathsForHoist(
		variantEntries.filter(([, v]) => v.absent !== true),
		bail
	);
	if (parsed === null) return null;
	if (parsed.length === 0) return bail('no variant arms to hoist');
	const { choicePos, throughOptional } = parsed[0]!;
	if (parsed.some((p) => p.choicePos !== choicePos))
		return bail(
			`variant patches target mixed choice positions (${parsed.map((p) => p.choicePos).join(',')}) — hoist needs all siblings at one choice`
		);
	if (parsed.some((p) => p.throughOptional !== throughOptional))
		return bail('variant patches mix N/M and N/0/M paths — hoist needs all siblings addressed the same way');
	const seqMembers = [...membersOf(core)];
	const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
	const hoistChoice = hoistChoiceOf(seqMembers[resolvedPos], throughOptional);
	if (!hoistChoice) return bail(`position ${resolvedPos} is '${seqMembers[resolvedPos]?.type}', not a hoistable choice`);
	const { choice, choiceMembers, absentIdx } = hoistChoice;
	const armCount = throughOptional ? choiceMembers.length - 1 : choiceMembers.length;
	for (const p of parsed) if (p.altIdx < 0) p.altIdx += armCount;
	if (absentEntries.length > 1) return bail(`more than one absent variant declared (${absentEntries.map(([k]) => k).join(', ')})`);
	for (const [key, v] of absentEntries) {
		const segs = parsePath(key);
		const head = segs[0];
		const at = head?.kind === 'index' ? (head.value < 0 ? seqMembers.length + head.value : head.value) : undefined;
		if (segs.length !== 1 || at !== resolvedPos) return bail(`absent variant '${v.name}' at '${key}' does not address the optional at ${resolvedPos}`);
		if (absentIdx === undefined) return bail(`absent variant '${v.name}' at '${key}' addresses a choice that is not optional`);
	}
	const declared = absentEntries[0];
	if (absentIdx !== undefined && (throughOptional || declared !== undefined) && !parsed.some((p) => p.altIdx === absentIdx)) {
		parsed.push({
			key: declared?.[0] ?? String(choicePos),
			v: declared?.[1] ?? variant(ABSENT_VARIANT_NAME),
			choicePos,
			altIdx: absentIdx,
			throughOptional
		});
	}
	const targeted = new Set(parsed.map((p) => p.altIdx));
	const lifted: { altIdx: number; lift: NonNullable<ReturnType<typeof enrichLiftArmOf>> }[] = [];
	for (const altIdx of choiceMembers.map((_, i) => i).filter((i) => !targeted.has(i))) {
		const lift = enrichLiftArmOf(choiceMembers[altIdx]!);
		if (lift === null) return bail(`arm ${altIdx} has no variant() and no enrich lift to carry it`);
		lifted.push({ altIdx, lift });
	}
	const scaffolding = seqMembers.filter((_, i) => i !== resolvedPos);
	const emptyArm = choiceMembers.findIndex(
		(arm) => (isBlank(arm) || matchesEmpty(arm)) && scaffolding.every((m) => matchesEmpty(m))
	);
	if (emptyArm >= 0) return bail(`arm ${emptyArm} would hoist to a variant that matches the empty string`);
	const bareArm = choiceMembers.findIndex((arm) =>
		variantBranchIsUnmaterializable({ type: 'SEQ', members: [...scaffolding, ...(isBlank(arm) ? [] : [arm])] } as unknown as RuntimeRule)
	);
	if (bareArm >= 0) return bail(`arm ${bareArm} would hoist to a variant with no token of its own and at most one named child`);
	return { core, precStack, seqMembers, resolvedPos, choice, choiceMembers, parsed, lifted };
}

function isBlank(rule: RuntimeRule): boolean {
	return (rule.type as string) === 'BLANK';
}

function hoistChoiceOf(
	rule: RuntimeRule | undefined,
	throughOptional: boolean
): { choice: RuntimeRule; choiceMembers: RuntimeRule[]; absentIdx: number | undefined } | null {
	if (!rule) return null;
	const blank = { type: 'BLANK' } as unknown as RuntimeRule;
	const content = optionalContentOf(rule);
	if (content !== undefined) {
		const members = throughOptional ? (isChoiceType(content.type) ? [...membersOf(content), blank] : null) : [content, blank];
		if (members === null) return null;
		return { choice: { type: 'CHOICE', members } as unknown as RuntimeRule, choiceMembers: members, absentIdx: members.length - 1 };
	}
	if (throughOptional || !isChoiceType(rule.type)) return null;
	return { choice: rule, choiceMembers: [...membersOf(rule)], absentIdx: undefined };
}

function optionalContentOf(rule: RuntimeRule): RuntimeRule | undefined {
	if ((rule.type as string) === 'OPTIONAL') return contentOf(rule);
	if (!isChoiceType(rule.type)) return undefined;
	const members = membersOf(rule);
	return members.length === 2 && isBlank(members[1]!) && !isBlank(members[0]!) ? members[0] : undefined;
}

function tryHoistSiblingVariants(
	rule: RuntimeRule,
	variantEntries: ReadonlyArray<[string, VariantPlaceholder]>
): { rule: RuntimeRule; consumed: Set<string> } | null {
	const { bail } = peelPrecWrappersFromRule(rule);
	const parentKind = wireGetCurrentRuleKind();
	if (!parentKind) return bail('no current rule kind (variant()/transform() called outside rule callback?)');
	const plan = planSiblingVariantHoist(rule, variantEntries, (reason) => bail(reason));
	if (plan === null) return null;
	const { core, precStack, seqMembers, resolvedPos, choice, choiceMembers, parsed, lifted } = plan;
	if (wireIsExtraRule(parentKind)) return bail(`'${parentKind}' is an extra; a non-token rule may not appear inside an extra`);
	if (wireIsPrecedenceRankedRule(parentKind))
		return bail(`'${parentKind}' is ranked by name in the grammar's precedences; its variants would reduce unranked`);
	const authored = parsed.map((p) => polymorphVisibleName(parentKind, variantMintName(p.v))).find((name) => wireHasAuthoredRule(name));
	if (authored !== undefined) return bail(`'${authored}' is an authored rule and would not carry the hoisted scaffolding`);
	return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, lifted, parentKind, precStack);
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

interface HoistVariantPath {
	key: string;
	v: VariantPlaceholder;
	choicePos: number;
	altIdx: number;
	throughOptional: boolean;
}

function parseVariantPathsForHoist(
	variantEntries: ReadonlyArray<[string, VariantPlaceholder]>,
	bail: (reason: string) => null
): HoistVariantPath[] | null {
	const parsed: HoistVariantPath[] = [];
	for (const [key, v] of variantEntries) {
		const segs = parsePath(key);
		if (segs.some((s) => s.kind !== 'index'))
			return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`);
		const values = segs.map((s) => (s as { value: number }).value);
		if (values.length === 2) {
			parsed.push({ key, v, choicePos: values[0]!, altIdx: values[1]!, throughOptional: false });
		} else if (values.length === 3 && values[1] === 0) {
			parsed.push({ key, v, choicePos: values[0]!, altIdx: values[2]!, throughOptional: true });
		} else {
			return bail(`variant patch '${key}' has ${segs.length} segments (expected N/M, or N/0/M through an optional)`);
		}
	}
	return parsed;
}

function buildHoistedVariants(
	core: RuntimeRule,
	seqMembers: RuntimeRule[],
	choiceMembers: RuntimeRule[],
	resolvedPos: number,
	choice: RuntimeRule,
	parsed: ReadonlyArray<HoistVariantPath>,
	lifted: SiblingVariantHoistPlan['lifted'],
	parentKind: string,
	precStack: ReadonlyArray<RuntimeRule>
): { rule: RuntimeRule; consumed: Set<string> } {
	const hoist = (altContent: RuntimeRule): RuntimeRule => {
		const hoistedMembers = seqMembers.flatMap((m, i) => (i !== resolvedPos ? [m] : isBlank(altContent) ? [] : [altContent]));
		return wrapVariantBodyInParentPrec(withHoistedAnnotation(reconstructContainer(core, hoistedMembers)), precStack);
	};
	const refs: { altIdx: number; ref: RuntimeRule; name: string }[] = [];
	for (const p of parsed) {
		const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
		const altMember = choiceMembers[resolvedAlt]!;
		const name = polymorphVisibleName(parentKind, variantMintName(p.v));
		const lift = enrichLiftArmOf(altMember);
		if (lift !== null) wireRegisterSymbolRename(lift.liftName, name);
		if (!wireRegisterSyntheticRule(name, hoist(lift === null ? altMember : lift.body))) {
			throw new Error(`registerSyntheticRule('${name}'): no active wire() context`);
		}
		refs.push({ altIdx: resolvedAlt, ref: withVariantAnnotation(symbolRef(name), p.v.name, parentKind, altMember), name });
	}
	for (const { altIdx, lift } of lifted) {
		setGroupLiftRuleBody(lift.liftName, hoist(lift.body));
		refs.push({ altIdx, ref: choiceMembers[altIdx]!, name: lift.liftName });
	}
	refs.sort((a, b) => a.altIdx - b.altIdx);
	registerHoistedVariantConflicts(refs.map((r) => r.name));
	const newChoice = reconstructContainer(
		choice,
		refs.map((r) => r.ref)
	);
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
	const t = (member as { type?: string }).type;
	if (t !== 'ALIAS' && t !== 'SYMBOL') return null;
	const symbol = (t === 'SYMBOL' ? member : (member as { content?: unknown }).content) as { type?: string; name?: string } | undefined;
	if (symbol?.type !== 'SYMBOL' || typeof symbol.name !== 'string' || !isEnrichGroupLiftSymbol(symbol as RuntimeRule)) {
		return null;
	}
	const body = getGroupLiftRuleBody(symbol.name);
	return body === undefined ? null : { body, liftName: symbol.name, symbol };
}

function renameEnrichLift(
	member: RuntimeRule,
	lift: NonNullable<ReturnType<typeof enrichLiftArmOf>>,
	ruleName: string,
	nodeName: string
): RuntimeRule {
	if (!wireHasAuthoredRule(ruleName)) wireRegisterSyntheticRule(ruleName, withHoistedAnnotation(lift.body));
	wireRegisterSymbolRename(lift.liftName, ruleName);
	if (ruleName === nodeName) return { ...lift.symbol, name: nodeName } as unknown as RuntimeRule;
	if ((member as { type?: string }).type !== 'ALIAS') return ruleRef(ruleName, nodeName);
	return {
		...(member as object),
		content: { ...lift.symbol, name: ruleName },
		value: nodeName
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
		members[index] = resolvePatch(patch, members[index]!, key);
	}
	return reconstructContainer(original, members);
}

function resolveRulePlaceholder(patch: RulePlaceholder, key: string): RuntimeRule {
	const parentKind = wireGetCurrentRuleKind();
	if (!parentKind) throw new Error(`rule('${patch.name}'): no current rule kind — rule() must be used inside a rule callback`);
	const site = `${parentKind}/${key}`;
	const text = canonicalRuleText(patch.body(makeSimpleDollarProxy()));
	const prior = wireDeclareRuleBody(patch.name, text, site);
	if (prior !== undefined) throw new Error(`rule('${patch.name}'): bodies differ at ${prior} and ${site}`);
	return symbolRef(patch.name);
}

const wrapInPrec = (content: RuntimeRule, precStack?: readonly RuntimeRule[]): RuntimeRule =>
	wrapInPrecStack(content, precStack, reconstructPrec);

function wrapVariantBodyInParentPrec(hoistedSeq: RuntimeRule, precStack: ReadonlyArray<RuntimeRule>): RuntimeRule {
	return wrapInPrec(hoistedSeq, precStack);
}

function resolvePatch(patch: PatchValue, originalMember: RuntimeRule, key: string, precStack?: readonly RuntimeRule[]): RuntimeRule {
	if (isRulePlaceholder(patch)) {
		return resolveRulePlaceholder(patch, key);
	}
	if (isFieldPlaceholder(patch)) {
		return resolveFieldPlaceholder(patch, originalMember, precStack);
	}
	if (isFieldLike(patch)) {
		return { ...patch, metadata: makeRuleMetadata({ fieldSource: 'override' }) } as unknown as RuntimeRule;
	}
	if (isArmDefault(patch)) {
		return withAnnotations(originalMember, { default: true });
	}
	if (isGroupPlaceholder(patch)) {
		return withAnnotations(originalMember, { hoisted: true });
	}
	if (isFlattenPlaceholder(patch)) {
		return withAnnotations(originalMember, { flattened: true });
	}
	if (isRegexPlaceholder(patch)) {
		if ((originalMember as { type?: string }).type !== 'PATTERN') {
			throw new Error(`regex(): the patched member is a '${(originalMember as { type?: string }).type}', not a pattern`);
		}
		return { ...originalMember, value: patch.source } as RuntimeRule;
	}
	if (isVariantPlaceholder(patch)) {
		const parentKind = wireGetCurrentRuleKind();
		if (!parentKind) {
			throw new Error(`variant('${patch.name}'): no current rule kind — variant() must be used inside a rule callback`);
		}
		const name = polymorphVisibleName(parentKind, variantMintName(patch));
		const annotated = (rule: unknown): RuntimeRule => withVariantAnnotation(rule, patch.name, parentKind, patch.default === true ? { annotations: { default: true } } : undefined);
		const lift = enrichLiftArmOf(originalMember);
		if (lift !== null) return annotated(renameEnrichLift(originalMember, lift, name, name));
		if ((originalMember as { type?: string }).type === 'ALIAS') {
			const content = (originalMember as { content?: { type?: string; name?: string } }).content;
			if (content?.type === 'SYMBOL' && content.name?.startsWith('_')) {
				if (!wireRegisterSyntheticRule(name, withHoistedAnnotation(content as RuntimeRule))) {
					throw new Error(`registerSyntheticRule('${name}'): no active wire() context`);
				}
				return annotated(symbolRef(name));
			}
			return annotated({ ...(originalMember as object), value: name });
		}
		if (variantBranchIsUnmaterializable(originalMember)) {
			return annotated({
				...(deField(originalMember) as object),
				metadata: makeRuleMetadata({ fieldSource: 'override' })
			});
		}
		return annotated(registerAliasedVariant(name, name, originalMember, (body) => wrapInPrec(body, precStack)));
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
		if (isEnrichGroupLiftSymbol(n as RuntimeRule) && isHiddenKind((n as { name?: string }).name ?? '')) {
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
	content = withoutAutomaticVariants(content, wireAutomaticVariants());
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
	site: RuntimeRule,
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	const originalMember = isEnrichShapedFieldWrapper(site) ? (site.content as RuntimeRule) : site;
	const labelled = (resolved: RuntimeRule): RuntimeRule => relabelledArm(resolved, originalMember, wireAutomaticVariants()) as RuntimeRule;
	const ruleName = '_' + patch.name;
	const lift = enrichLiftArmOf(originalMember);
	if (lift !== null) return labelled(renameEnrichLift(originalMember, lift, ruleName, patch.name));
	const mint = (body: RuntimeRule): RuntimeRule => registerAliasedVariant(ruleName, patch.name, body, (b) => wrapInPrec(b, precStack));
	if ((originalMember as { type?: string }).type === 'ALIAS') {
		const content = contentOf(originalMember);
		if (!isSymbolType(content.type)) return labelled(mint(content));
		const renamed = { ...originalMember, named: true, value: patch.name };
		return labelled(renamed);
	}
	return labelled(mint(originalMember));
}

export function registerAliasedVariant(
	ruleName: string,
	nodeName: string,
	originalMember: RuntimeRule,
	bodyWrapper: (body: RuntimeRule) => RuntimeRule
): RuntimeRule {
	const single = originalMember as { type?: string; name?: string };
	if (single.type === 'SYMBOL' && typeof single.name === 'string') {
		if (ruleName === nodeName && single.name.startsWith('_')) {
			if (!wireRegisterSyntheticRule(ruleName, withHoistedAnnotation(originalMember))) {
				throw new Error(`registerSyntheticRule('${ruleName}'): no active wire() context`);
			}
			return symbolRef(nodeName);
		}
		const alias = nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias');
		return alias(originalMember, symbolRef(nodeName));
	}
	const wasEmpty = matchesEmpty(originalMember);
	const factored = factorOutEmptiness(originalMember);
	if (wasEmpty && !factored) {
		throw new Error(
			`variant()/alias(): can't extract '${ruleName}' — its content matches the empty string and no non-empty core could be factored out. ` +
				`Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`
		);
	}
	const body = factored ? factored.nonEmpty : originalMember;
	if (!wireRegisterSyntheticRule(ruleName, bodyWrapper(hoistedUnlessToken(body as RuntimeRule)))) {
		throw new Error(`registerSyntheticRule('${ruleName}'): no active wire() context`);
	}
	const aliasNode = ruleRef(ruleName, nodeName);
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

function hoistedUnlessToken(body: RuntimeRule): RuntimeRule {
	return lexesAsOneToken(body) ? body : withHoistedAnnotation(body);
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
