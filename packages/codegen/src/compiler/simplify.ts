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
import { isSpliceableBareSeq } from '../dsl/rule-patterns.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { deleteWrapper } from './wrapper-deletion.ts';
import { withAttrsFrom, sharedArmAttrs } from '../dsl/rule-attrs.ts';
import { diagnoseSlotGrouping, type SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import { attributeBuilder, structuralBuilder, isSlotPromotedLiteral } from '../dsl/builders.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import type { NormalizedGrammar } from './types.ts';

export class SimplifyCtx extends BaseCtx<'normalize'> {
	readonly inlineKinds: ReadonlySet<string>;
	readonly polymorphSkipExtra?: ReadonlySet<string>;
	constructor(
		init: BaseCtxInit<'normalize'> & { inlineKinds?: ReadonlySet<string>; polymorphSkipExtra?: ReadonlySet<string> }
	) {
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
	inlineRefs,
	fuseHeadRepeatLists,
	combineMultiplicity,
	type InlineRefsCtx,
	type LeafMultiplicity
} from '../dsl/rule-transforms.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import type { AssembledNode } from './model/node-map.ts';

const seqOfLeavesWalker = new RuleWalker<AnyRule>();

function collapseSingleMemberSeq(recursed: AnyRule): AnyRule {
	if (recursed.type === SEQ && recursed.members.length === 1) {
		const survivor = recursed.members[0]!;
		const carried = withAttrsFrom(recursed, survivor);
		const outerMult = (recursed as { multiplicity?: LeafMultiplicity }).multiplicity;
		if (outerMult !== undefined) {
			const combined = combineMultiplicity(outerMult, (survivor as { multiplicity?: LeafMultiplicity }).multiplicity);
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
	if (content.type === FIELD) return rule;
	if (!hasInnerFieldAtExposableDepth(content)) return rule;
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
	if (rule.members.some((m) => m.type === VARIANT)) return rule;
	const unwrapped = rule.members.map(unwrapForMerge);
	if (unwrapped.every((br): br is FieldRule => br.type === FIELD)) {
		const first = unwrapped[0]!;
		if (unwrapped.every((f) => f.name === first.name)) {
			return mergePositionForChoice(unwrapped, ctx);
		}
	}
	if (!unwrapped.every((br): br is SeqRule => br.type === SEQ)) return liftSharedArmAttrs(rule);
	const len = unwrapped[0]!.members.length;
	if (!unwrapped.every((br) => br.members.length === len)) return liftSharedArmAttrs(rule);
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((br) => br.members[i]!);
		if (!positionsAreMergeable(position)) return liftSharedArmAttrs(rule);
	}
	let varyingPositions = 0;
	for (let i = 0; i < len; i++) {
		const position = unwrapped.map((br) => br.members[i]!);
		if (dedupeByJson(position).length > 1) {
			varyingPositions++;
			if (varyingPositions >= 2) return liftSharedArmAttrs(rule);
		}
	}
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
		case SEQ:
			return simplifySeqRule(rule, ctx) as RenderRule;
		case CHOICE:
			return simplifyChoiceRule(rule, ctx) as RenderRule;
		case GROUP:
		case VARIANT:
		case SYMBOL:
		case STRING:
		case PATTERN:
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return rule;
		default:
			throw new Error(
				`simplifyRule: unexpected rule type '${(rule as RenderRule).type}' — ` +
					`field/optional/repeat/repeat1 nodes must be converted to attributes ` +
					`by applyWrapperDeletion before reaching simplify`
			);
	}
}

function simplifyChoiceRule(rule: ChoiceRule, ctx: SimplifyCtx = makeDefaultCtx()): AnyRule {
	const b = ctx.builder ?? structuralBuilder;
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
	return withAttrsFrom(rule, hoistSharedFieldFromBranchesForChoice(merged as ChoiceRule, ctx));
}

export function simplifyRules(rules: Record<string, RenderRule>, ctx?: SimplifyCtx): Record<string, RenderRule> {
	const out: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		out[name] = simplifyToFixpoint(rule, ctx, rules);
	}
	return out;
}

export function computeSimplifiedRules(ctx: SimplifyCtx): Record<string, SimplifiedRule> {
	const normalizedRules = ctx.rules;
	const inlineKinds = ctx.inlineKinds;
	const polymorphSkipExtra = ctx.polymorphSkipExtra ?? new Set<string>();
	const simplified = simplifyRules(normalizedRules, ctx);
	const canonicalized: Record<string, SimplifiedRule> = {};
	for (const [kind, rule] of Object.entries(simplified)) {
		const wrapperFree = fuseHeadRepeatLists(
			deleteWrapper(canonicalizeSeqOfLeaves(rule) as Rule<'link'>) as AnyRule
		) as SimplifiedRule;
		canonicalized[kind] = wrapperFree;
	}
	if (process.env['SITTIR_ASSERT_UNIVERSAL_SHAPE'] === '1') {
		for (const [kind, rule] of Object.entries(canonicalized)) {
			assertUniversalShapeRule(rule, kind);
		}
	}

	const slotDiagnostics = diagnoseSlotGrouping(canonicalized, inlineKinds, polymorphSkipExtra);
	for (const rec of slotDiagnostics) {
		const isNew = recordSlotGroupingDiagnostic(rec);
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

function simplifyToFixpoint(
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
		`[simplify] simplifyToFixpoint: ${MAX_ITERS} iterations reached without convergence — returning last iteration`
	);
	return current;
}

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

function simplifySeqRule(rule: SeqRule, _ctx: SimplifyCtx = makeDefaultCtx()): AnyRule {
	const mapped: AnyRule[] = rule.members;
	const filtered: AnyRule[] = mapped.filter((m) => {
		if (m.type === STRING && !isSlotPromotedLiteral(m)) return false;
		if (m.type === SEQ && m.members.length === 0) return false;
		return true;
	});
	const members: AnyRule[] = filtered.flatMap((m): AnyRule[] => {
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
		if (combined !== undefined) return { ...carried, multiplicity: combined } as AnyRule;
		return carried;
	}
	return withAttrsFrom(rule, { type: SEQ, members });
}
