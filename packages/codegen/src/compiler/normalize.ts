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
import { isChoice } from '../types/rule.ts';
import { deriveComplexAliasTargetHidden, isEnumChoiceRule, isHiddenRule, separatorFactsEqual } from '../dsl/rule-patterns.ts';
import type { LinkedGrammar, NormalizedGrammar, SimplifiedGrammar } from './types.ts';
import { computeSimplifiedRules, resetSlotGroupingDiagnostics, SimplifyCtx } from './simplify.ts';
import { attributeBuilder } from '../dsl/builders.ts';
import { resolveGroupOrMultiInlineTarget, combineMultiplicity, type LeafMultiplicity } from '../dsl/rule-transforms.ts';
import { flattenRules } from './flatten.ts';
import { withAttrsFrom, withKindFacts, rebaseRuleIds } from '../dsl/rule-attrs.ts';
import { prefixNamedSuffix } from './variant-structural.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';

export class NormalizeCtx extends BaseCtx<'link'> {
	readonly inlineKinds: ReadonlySet<string>;
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
	const twinned = new Set<string>();
	const supertypeNamed = new Set<string>();

	const isHidden = (name: string): boolean => isHiddenRule(name, rules);

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
			for (const subRef of rule.subtypes) {
				const sub = subRef.name;
				if (isHidden(sub)) supertypeNamed.add(sub);
			}
			return;
		}
		const xs = rule as { members?: readonly Rule<'link'>[]; content?: Rule<'link'> };
		for (const m of xs.members ?? []) walk(m, ownerTwinTarget);
		if (xs.content) walk(xs.content, ownerTwinTarget);
	};

	for (const [name, rule] of Object.entries(rules)) {
		const ownerTwinTarget = isHidden(name) ? undefined : `_${name}`;
		walk(rule, ownerTwinTarget);
	}

	const keep = new Set<string>(supertypeNamed);
	for (const [name, count] of refcount) {
		if (count > 1 || twinned.has(name)) keep.add(name);
	}
	return keep;
}

export function inlineHiddenSeqRefs(
	rules: Record<string, Rule<'link'>>,
	_ctx: NormalizeCtx | undefined,
	keepRef: ReadonlySet<string>
): boolean {
	const foldable = new Set<string>();
	for (const [name, rule] of Object.entries(rules)) {
		if (!isHiddenRule(name, rules)) continue;
		if (keepRef.has(name)) continue;
		if (name === '_import_list') continue;
		if (resolveGroupOrMultiInlineTarget(rule) !== null) foldable.add(name);
	}
	if (foldable.size === 0) return false;

	let changed = false;
	for (const [parentName, parentRule] of Object.entries(rules)) {
		const spliced = spliceFoldableRefs(parentRule, foldable, rules);
		if (spliced !== parentRule) {
			rules[parentName] = spliced;
			changed = true;
		}
	}
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
			if ((rule as { inline?: boolean }).inline !== true) return rule;
			const mult = (rule as { multiplicity?: LeafMultiplicity }).multiplicity;
			if (mult === 'array' || mult === 'nonEmptyArray') return rule;
			if ((rule as { fieldName?: string }).fieldName !== undefined) return rule;
			const target = rules[rule.name];
			if (!target) return rule;
			const body = resolveGroupOrMultiInlineTarget(target);
			if (!body) return rule;
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

	const { hidden: _sourceKindHidden, ...spliced } = body;
	if (spliced.type === SEQ) {
		return { ...spliced, ...carry, inlinedFrom, splicedBody: true } as Rule<'link'>;
	}
	return {
		type: SEQ,
		members: [spliced as Rule<'link'>],
		...carry,
		inlinedFrom,
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
	const inlineKinds: ReadonlySet<string> = ctx?.inlineKinds ?? new Set();
	const extraPolymorphSkip: ReadonlySet<string> = ctx?.polymorphSkip ?? new Set();

	resetSlotGroupingDiagnostics();
	const preserveKinds = deriveComplexAliasTargetHidden(linked.rules);
	const rules = applyNormalizationPasses(linked.rules, ctx, preserveKinds.size > 0 ? preserveKinds : undefined);
	const normalizedRules = flattenRules(rules);
	for (let pass = 0; pass < 8; pass++) {
		const keepRef = computeKeepRef(normalizedRules);
		const changed = inlineHiddenSeqRefs(normalizedRules, ctx, keepRef);
		if (!changed) break;
	}

	const variantSkip = extraPolymorphSkip.size === 0 ? new Set<string>() : new Set<string>(extraPolymorphSkip);
	for (const [parentKind, targetNames] of linked.variantChildren ?? []) {
		variantSkip.add(parentKind);
		for (const targetName of targetNames) {
			const suffix = prefixNamedSuffix(parentKind, targetName);
			if (suffix !== null) variantSkip.add(suffix);
		}
	}

	const normalizedGrammarView: NormalizedGrammar = {
		name: linked.name,
		rules: normalizedRules,
		supertypes: linked.supertypes,
		word: linked.word,
		wordMatcher: linked.wordMatcher,
		externals: linked.externals,
		extras: linked.extras,
		derivations: linked.derivations,
		aliasedHiddenKinds: linked.aliasedHiddenKinds,
		topLevelAliasBodies: linked.topLevelAliasBodies,
		terminalAliasWireIds: linked.terminalAliasWireIds,
		parentAliasedKinds: linked.parentAliasedKinds,
		visibleAliasTargets: linked.visibleAliasTargets,
		variantChildren: linked.variantChildren,
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

	if (linked.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule<'link'>> = Object.fromEntries(linked.topLevelAliasBodies);
		const aliasBodiesNormalized = applyNormalizationPasses(
			aliasBodiesRaw,
			ctx,
			preserveKinds.size > 0 ? preserveKinds : undefined
		);
		const aliasBodiesRender = flattenRules(aliasBodiesNormalized);
		const aliasBodiesGrammarView: NormalizedGrammar = {
			...normalizedGrammarView,
			rules: aliasBodiesRender
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
			const own = normalizedRules[kind];
			normalizedRules[kind] = own === undefined ? rule : withKindFacts(rule, own);
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}

	return {
		name: linked.name,
		normalizedRules,
		rules: simplifiedRules,
		supertypes: linked.supertypes,
		factoryInline: linked.factoryInline,
		word: linked.word,
		wordMatcher: linked.wordMatcher,
		externals: linked.externals,
		extras: linked.extras,
		derivations: linked.derivations,
		aliasedHiddenKinds: linked.aliasedHiddenKinds,
		topLevelAliasBodies: linked.topLevelAliasBodies,
		terminalAliasWireIds: linked.terminalAliasWireIds,
		refineForms: linked.refineForms,
		parentAliasedKinds: linked.parentAliasedKinds,
		visibleAliasTargets: linked.visibleAliasTargets,
		variantChildren: linked.variantChildren
	};
}

export function fanOutSeqChoices(rule: Rule<'link'>, _ctx?: NormalizeCtx): Rule<'link'> {
	switch (rule.type) {
		case SEQ: {
			const members = rule.members.map((m) => fanOutSeqChoices(m));
			const choiceIdx = members.findIndex(isChoice);
			if (choiceIdx < 0) return { ...rule, members };
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
				const flat: Rule<'link'> = { type: SEQ, members: seqMembers };
				return branch.type === VARIANT ? { type: VARIANT, name: branch.name, content: flat } : flat;
			});
			return {
				...choice,
				type: CHOICE,
				members: branches,
				...(rule.id !== undefined ? { id: rule.id } : {})
			};
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
			const canFactor = unwrapped.length >= 2 && unwrapped.every((b) => b.type === SEQ || isAtomForFactoring(b));
			if (!canFactor) return { ...rule, members };
			const seqs = unwrapped.map((b) => (b.type === SEQ ? (b as SeqRule<'link'>).members : [b]));
			const prefixLen = findCommonPrefix(seqs);
			const suffixLen = findCommonSuffix(seqs, prefixLen);
			if (prefixLen === 0 && suffixLen === 0) return { ...rule, members };
			const { prefix, suffix, nonEmpty, hasEmpty } = extractFactoredChoiceBody(members, seqs, prefixLen, suffixLen);
			if (nonEmpty.length === 0) {
				return withAttrsFrom(rule, outerFromParts(prefix, suffix));
			}
			const core: Rule<'link'> = nonEmpty.length === 1 ? nonEmpty[0]! : { ...rule, type: CHOICE, members: nonEmpty };
			const inner: Rule<'link'> = hasEmpty ? { type: OPTIONAL, content: core } : core;
			const outerMembers: Rule<'link'>[] = [...prefix, inner, ...suffix];
			return outerMembers.length === 1
				? withAttrsFrom(rule, outerMembers[0]!)
				: withAttrsFrom(rule, { type: SEQ, members: outerMembers });
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

function inlineSingleUseHidden(
	rules: Record<string, Rule<'link'>>,
	ctx?: NormalizeCtx,
	preserveKinds?: ReadonlySet<string>
): Record<string, Rule<'link'>> {
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
			if (!isHiddenRule(name, work)) continue;
			if (isStructurallyMeaningfulHiddenRule(rule)) continue;
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
		case SUPERTYPE:
		case GROUP:
			return false;

		case FIELD:
			return false;

		case SYMBOL:
		case 'supertype' as never:
			return false;

		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return false;

		case SEQ:
			return rule.members.every(isTerminalShape_allowBareTerm);
		case CHOICE:
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
			for (const subRef of rule.subtypes) visit(subRef.name);
			return;
	}
}

function replaceSymbolRef(rule: Rule<'link'>, targetName: string, targetRule: Rule<'link'>): Rule<'link'> {
	switch (rule.type) {
		case SYMBOL:
			if (rule.name === targetName && rule.inline === true) {
				const { hidden: _sourceKindHidden, ...spliced } = targetRule;
				return rebaseRuleIds(spliced as Rule<'link'>, rule.id ?? targetRule.id);
			}
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
			if (inner.type === OPTIONAL) return inner;
			if (inner.type === REPEAT) return inner;
			return { ...rule, content: inner };
		}
		case REPEAT: {
			const inner = collapseWrappers(rule.content);
			if (inner.type === REPEAT && !rule.separator && !inner.separator) return inner;
			if (inner.type === OPTIONAL) return { ...rule, content: inner.content };
			return { ...rule, content: inner };
		}
		case SEQ: {
			const members = rule.members.map((m) => collapseWrappers(m));
			if (members.length === 1) {
				const survivor = members[0]!;
				const carried = withAttrsFrom(rule, survivor);
				const outerMult = (rule as { multiplicity?: LeafMultiplicity }).multiplicity;
				if (outerMult !== undefined) {
					const combined = combineMultiplicity(
						outerMult,
						(survivor as { multiplicity?: LeafMultiplicity }).multiplicity
					);
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
		throw new Error('outerFromParts: no prefix or suffix to wrap');
	}
	if (members.length === 1) return members[0]!;
	return { type: SEQ, members };
}

export function rulesEqual(a: Rule<'link'>, b: Rule<'link'>): boolean {
	if (a.type !== b.type) return false;

	switch (a.type) {
		case STRING:
			return a.value === (b as typeof a).value;
		case PATTERN:
			return a.value === (b as typeof a).value;
		case SYMBOL:
			return a.name === (b as typeof a).name && a.aliasedTo === (b as typeof a).aliasedTo;
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
			return (
				rulesEqual(a.content, (b as typeof a).content) && separatorFactsEqual(a.separator, (b as typeof a).separator)
			);
		case FIELD:
			return a.name === (b as typeof a).name && rulesEqual(a.content, (b as typeof a).content);
		case VARIANT:
			return a.name === (b as typeof a).name && rulesEqual(a.content, (b as typeof a).content);
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

export function factorSeqChoice(branches: Rule<'link'>[]): Rule<'link'>[] {
	const seqs = branches.map((b) => (b.type === SEQ ? b.members : [b]));

	const prefixLen = findCommonPrefix(seqs);
	if (prefixLen === 0) return branches;

	const suffixLen = findCommonSuffix(seqs, prefixLen);

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

export { tokenToName } from './link.ts';
