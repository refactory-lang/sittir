import type { Rule, AnyRule } from '../types/rule.ts';
import { RuleWalker } from './rule-walker.ts';
import { makeRuleMetadata, normalizeEnumMembers } from './rule-metadata.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import type { EnrichRule } from '../grammar-shapes/enrich-type.ts';
import {
	isSeqType,
	isStringType,
	isSymbolType,
	isFieldType,
	isOptionalType,
	isChoiceType,
	isRepeatType,
	isPrecWrapper,
	typeEq
} from '../types/runtime-shapes.ts';
import type { RuntimeRule } from '../types/runtime-shapes.ts';
import {
	separatorOf,
	ruleMatchesEmpty,
	isInlineSafe,
	isSupertypeLike,
	isPermutationChoice,
	isEnumChoiceRule,
	exclusiveFieldChoiceBranches,
	normalizeMember,
	peelOptional,
	peelOptionalSeq,
	listSeparatorOfOptionalSeq,
	optionalStringLiteral,
	separatedListBodyInfo,
	armLeadingSymbolName,
	armStartsWithSymbol,
	armsDifferOnlyByLiteralChoice,
	type SeparatedListBodyInfo
} from './rule-patterns.ts';
import { ruleKey } from './shared.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from '../types/parsekind-collisions.ts';
import { setGroupLiftRuleMap } from './transform/transform-path.ts';
import { compileWordMatcher, matchesWordShape } from '../util/word-matcher.ts';

export interface GrammarResult {
	grammar: {
		name: string;
		rules: Record<string, Rule>;
		[other: string]: unknown;
	};
}

export type EnrichedGrammar<B> = B extends GrammarJson
	? {
			readonly [K in keyof B]: K extends 'rules'
				? { readonly [R in keyof B['rules']]: EnrichRule<B['rules'][R]> }
				: B[K];
		}
	: B;

export interface EnrichConfig {
	readonly skip?: readonly string[];
}

export function enrich<B = GrammarResult>(baseInput: B, config?: EnrichConfig): EnrichedGrammar<B> {
	const base = baseInput as unknown as GrammarResult;
	const enrichSkip = new Set(config?.skip ?? []);
	if (!base || typeof base !== 'object') {
		throw new Error('enrich(): expected a grammar object, got ' + typeof base);
	}
	const hasWrapper = 'grammar' in base;
	const rulesBag = (hasWrapper ? base.grammar?.rules : (base as unknown as { rules?: unknown }).rules) as
		| Record<string, Rule>
		| undefined;
	if (!rulesBag) return base as unknown as EnrichedGrammar<B>;
	const grammarMeta = (hasWrapper ? base.grammar : base) as
		| { word?: string | null | ((dollar: unknown) => unknown) }
		| undefined;
	const wordMatcher = compileWordMatcher(extractWordName(grammarMeta?.word), rulesBag);
	const supertypeNames = extractSupertypeNames(base, hasWrapper);
	const kwRules: Record<string, Rule> = {};
	const clauseGroupRules: Record<string, Rule> = {};
	const clauseDedupeMap: Record<string, string> = {};
	const groupDedupeMap: Record<string, string> = {};
	const visibleGroupHiddenNames = new Set<string>();
	const clauseGroupOwners = new Map<string, string>();
	const unaliasSink: UnaliasDiagnosticSink = { diagnostics: [], seen: new Set() };
	const enrichedRules: Record<string, Rule> = {};
	for (const name of Object.keys(rulesBag)) {
		const rule = rulesBag[name];
		enrichedRules[name] =
			rule && !enrichSkip.has(name)
				? applyFieldWrapPasses(name, rule, kwRules, supertypeNames, rulesBag, wordMatcher)
				: rule!;
	}
	for (const name of Object.keys(enrichedRules)) {
		const rule = enrichedRules[name];
		if (!rule || enrichSkip.has(name)) continue;
		if (!isSeqType((rule as { type?: string }).type)) continue;
		const info = separatedListBodyInfo(rule);
		if (!info?.flankCarrying || info.form !== 'head') continue;
		const members = (rule as unknown as { members: Rule[] }).members;
		if (info.flatMembers === members) continue;
		enrichedRules[name] = { ...rule, members: info.flatMembers } as Rule;
	}
	for (const name of Object.keys(enrichedRules)) {
		const rule = enrichedRules[name];
		if (!rule || enrichSkip.has(name)) continue;
		enrichedRules[name] = distributeExclusiveFieldChoices(rule, enrichedRules);
	}
	separatedListNameCounts = collectSeparatedListNameProposals(enrichedRules);
	separatedListEnrichSkip = enrichSkip;
	hiddenListPromotionNames = new Map();
	hoistKwRules = kwRules;
	hoistWordMatcher = wordMatcher;
	try {
		for (const name of Object.keys(enrichedRules)) {
			const rule = enrichedRules[name];
			if (!rule || enrichSkip.has(name)) continue;
			enrichedRules[name] = applyHoistAndUnalias(
				name,
				rule,
				kwRules,
				supertypeNames,
				rulesBag,
				clauseGroupRules,
				clauseDedupeMap,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				unaliasSink
			);
		}
	} finally {
		separatedListNameCounts = null;
		separatedListEnrichSkip = null;
		hiddenListPromotionNames = null;
		hoistKwRules = null;
		hoistWordMatcher = undefined;
	}
	for (const groupName of Object.keys(clauseGroupRules)) {
		const groupBody = clauseGroupRules[groupName];
		if (!groupBody) continue;
		const groupUnaliasResult = applyUnaliasDistinct(
			groupName,
			groupBody,
			rulesBag,
			kwRules,
			clauseGroupRules,
			supertypeNames
		);
		clauseGroupRules[groupName] = groupUnaliasResult.rule;
		for (const diagnostic of groupUnaliasResult.diagnostics) {
			recordUnaliasDiagnostic(unaliasSink, diagnostic);
		}
	}
	const mergedRules = { ...enrichedRules, ...kwRules, ...clauseGroupRules };
	collapseSingletonMintOrdinals(mergedRules, clauseGroupRules, visibleGroupHiddenNames, clauseGroupOwners);
	for (const name of Object.keys(mergedRules)) {
		if (enrichSkip.has(name)) continue;
		const rule = mergedRules[name];
		if (rule) mergedRules[name] = applyNodeChoiceFieldWrap(name, rule, mergedRules, supertypeNames);
	}
	synthesizeFieldEnumRules(mergedRules);
	setGroupLiftRuleMap({
		get: (n) => mergedRules[n] as unknown as RuntimeRule | undefined,
		set: (n, b) => {
			mergedRules[n] = b as unknown as Rule;
		}
	});
	const clauseGroupNames = new Set(Object.keys(clauseGroupRules).filter((n) => !visibleGroupHiddenNames.has(n)));
	const result: unknown = hasWrapper
		? { ...base, grammar: { ...base.grammar, rules: mergedRules } }
		: { ...(base as unknown as object), rules: mergedRules };
	if (clauseGroupNames.size > 0) {
		Object.defineProperty(result, ENRICH_CLAUSE_GROUPS_KEY, {
			value: clauseGroupNames,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	if (clauseGroupOwners.size > 0) {
		Object.defineProperty(result, ENRICH_CLAUSE_GROUP_OWNERS_KEY, {
			value: clauseGroupOwners,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	if (unaliasSink.diagnostics.length > 0) {
		Object.defineProperty(result, ENRICH_UNALIAS_DIAGNOSTICS_KEY, {
			value: unaliasSink.diagnostics,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	if (visibleGroupHiddenNames.size > 0) {
		Object.defineProperty(result, ENRICH_VISIBLE_GROUP_SOURCES_KEY, {
			value: visibleGroupHiddenNames,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	return result as unknown as EnrichedGrammar<B>;
}

export const ENRICH_CLAUSE_GROUPS_KEY = '__enrichedClauseGroups__' as const;

export function getEnrichClauseGroups(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const names = (grammar as Record<string, unknown>)[ENRICH_CLAUSE_GROUPS_KEY];
	if (names instanceof Set) return names as ReadonlySet<string>;
	return new Set();
}

export const ENRICH_CLAUSE_GROUP_OWNERS_KEY = '__enrichedClauseGroupOwners__' as const;

export function getEnrichClauseGroupOwners(grammar: unknown): ReadonlyMap<string, string> {
	if (!grammar || typeof grammar !== 'object') return new Map();
	const owners = (grammar as Record<string, unknown>)[ENRICH_CLAUSE_GROUP_OWNERS_KEY];
	if (owners instanceof Map) return owners as ReadonlyMap<string, string>;
	return new Map();
}

export const ENRICH_VISIBLE_GROUP_SOURCES_KEY = '__enrichedVisibleGroupSources__' as const;

export function getEnrichVisibleGroupSources(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const names = (grammar as Record<string, unknown>)[ENRICH_VISIBLE_GROUP_SOURCES_KEY];
	if (names instanceof Set) return names as ReadonlySet<string>;
	return new Set();
}

function applyFieldWrapPasses(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule {
	const MAX_ITERATIONS = 8;
	let r = rule;
	let converged = false;
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const before = r;
		r = applySymbolToField(ruleName, r, supertypeNames);
		r = applyChoiceArmFieldWrap(ruleName, r, supertypeNames, rulesBag);
		r = applyRepeatUnionFieldPromotion(ruleName, r, rulesBag);
		r = applyOptionalKeyword(ruleName, r, kwRules, rulesBag, wordMatcher);
		if (r === before) {
			converged = true;
			break;
		}
	}
	if (!converged && !process.env.SITTIR_QUIET) {
		process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations\n`);
	}
	return r;
}

function applyHoistAndUnalias(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	clauseDedupeMap: Record<string, string>,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>,
	unaliasSink: UnaliasDiagnosticSink
): Rule {
	let r = rule;
	const clauseHoistCounter: ClauseHoistCounter = { opt: 0, grp: 0, arm: 0, supertypeNames };
	r = applyClauseHoist(
		ruleName,
		r,
		rulesBag,
		clauseGroupRules,
		clauseDedupeMap,
		clauseHoistCounter,
		groupDedupeMap,
		visibleGroupHiddenNames,
		clauseGroupOwners
	);
	const unaliasResult = applyUnaliasDistinct(ruleName, r, rulesBag, kwRules, clauseGroupRules, supertypeNames);
	r = unaliasResult.rule;
	for (const diagnostic of unaliasResult.diagnostics) {
		recordUnaliasDiagnostic(unaliasSink, diagnostic);
	}
	return r;
}

function extractSupertypeNames(base: unknown, hasWrapper: boolean): ReadonlySet<string> {
	const root = hasWrapper ? (base as { grammar?: Record<string, unknown> }).grammar : (base as Record<string, unknown>);
	const supertypes = root?.supertypes;
	if (typeof supertypes === 'function') {
		const dollar = new Proxy(
			{},
			{
				get(_t, prop) {
					if (typeof prop === 'string') return { type: 'SYMBOL', name: prop };
					return undefined;
				}
			}
		);
		let result: unknown;
		try {
			result = (supertypes as (proxy: unknown) => unknown)(dollar);
		} catch {
			return new Set();
		}
		return harvestSupertypeNames(result);
	}
	if (Array.isArray(supertypes)) return harvestSupertypeNames(supertypes);
	return new Set();
}

function isAnonymousLiteralShapedRule(name: string, rulesBag: Record<string, Rule>, seen: Set<string>): boolean {
	if (seen.has(name)) return false;
	seen.add(name);
	const rule = rulesBag[name];
	if (!rule) return true;
	return isAnonymousLiteralShapedContent(rule, rulesBag, seen);
}

function isAnonymousLiteralShapedContent(rule: Rule, rulesBag: Record<string, Rule>, seen: Set<string>): boolean {
	if (isStringType(rule.type) || rule.type === 'PATTERN') return true;
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		return members.every((m) => isAnonymousLiteralShapedContent(m, rulesBag, seen));
	}
	if (isSymbolType(rule.type) && typeof (rule as { name?: unknown }).name === 'string') {
		return isAnonymousLiteralShapedRule((rule as { name: string }).name, rulesBag, seen);
	}
	return false;
}

function applyChoiceArmFieldWrap(
	ruleName: string,
	rule: Rule,
	supertypeNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>
): Rule {
	if (ruleName.startsWith('_')) return rule;
	let cursor: Rule = rule;
	const precStack: Rule[] = [];
	while (isPrecWrapper(cursor as { type: string })) {
		precStack.push(cursor);
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	if (!isChoiceType(cursor.type)) return rule;
	const armMembers = (cursor as unknown as { members: Rule[] }).members;
	let anyArmChanged = false;
	const newArms = armMembers.map((arm) => {
		let armCursor: Rule = arm;
		const armPrecStack: Rule[] = [];
		while (isPrecWrapper(armCursor as { type: string })) {
			armPrecStack.push(armCursor);
			armCursor = (armCursor as unknown as { content: Rule }).content;
		}
		if (!isSeqType(armCursor.type)) return arm;
		const seqMembers = (armCursor as unknown as { members: Rule[] }).members;
		const existing = collectFieldNamesRuntime(armCursor);
		let armChanged = false;
		const newSeqMembers = seqMembers.map((m) => {
			const t = detectSymbolTarget(m);
			if (!t) return m;
			if (!isBareShapeTarget(m, t)) return m;
			let fieldName = t.name;
			if (t.name.startsWith('_')) {
				const eligible = supertypeNames.has(t.name) || isAnonymousLiteralShapedRule(t.name, rulesBag, new Set());
				if (!eligible) return m;
				fieldName = t.name.slice(1);
			}
			if (existing.has(fieldName)) {
				reportSkip('choice-arm-field', ruleName, `field '${fieldName}' already exists`);
				return m;
			}
			existing.add(fieldName);
			armChanged = true;
			const fieldNode = makeField(fieldName, t.symbolRule);
			return t.wrap(fieldNode);
		});
		if (!armChanged) return arm;
		anyArmChanged = true;
		let rebuiltArm: Rule = { ...armCursor, members: newSeqMembers } as Rule;
		for (let i = armPrecStack.length - 1; i >= 0; i--) {
			rebuiltArm = { ...armPrecStack[i]!, content: rebuiltArm } as Rule;
		}
		return rebuiltArm;
	});
	if (!anyArmChanged) return rule;
	let result: Rule = { ...cursor, members: newArms } as Rule;
	for (let i = precStack.length - 1; i >= 0; i--) {
		result = { ...precStack[i]!, content: result } as Rule;
	}
	return result;
}

function collectAllFieldNamesDeep(rule: Rule, into: Set<string>): void {
	if (isFieldType((rule as { type: string }).type) && typeof (rule as { name?: unknown }).name === 'string') {
		into.add((rule as { name: string }).name);
	}
	const bag = rule as unknown as { members?: readonly Rule[]; content?: Rule };
	if (Array.isArray(bag.members)) {
		for (const m of bag.members) collectAllFieldNamesDeep(m, into);
	} else if (bag.content && typeof bag.content === 'object') {
		collectAllFieldNamesDeep(bag.content, into);
	}
}

function isAllArmsNodeShaped(choiceRule: Rule): boolean {
	const members = (choiceRule as unknown as { members: readonly Rule[] }).members;
	return members.every((arm) => {
		let cursor = arm;
		while (isPrecWrapper(cursor as { type: string })) {
			cursor = (cursor as unknown as { content: Rule }).content;
		}
		const t = (cursor as { type: string }).type;
		return t === 'SYMBOL' || t === 'ALIAS';
	});
}

function isAllArmsNodeOrLiteralShaped(choiceRule: Rule): boolean {
	const members = (choiceRule as unknown as { members: readonly Rule[] }).members;
	return members.every((arm) => {
		let cursor = arm;
		while (isPrecWrapper(cursor as { type: string })) {
			cursor = (cursor as unknown as { content: Rule }).content;
		}
		const t = (cursor as { type: string }).type;
		return t === 'SYMBOL' || t === 'ALIAS' || isStringType(t) || t === 'PATTERN';
	});
}

const LITERAL_ARM_NAMES: Record<string, string> = {
	';': 'semi'
};

function literalArmNameHint(text: string): string {
	return LITERAL_ARM_NAMES[text] ?? text.replace(/[^\w]+/g, '');
}

function promoteLiteralChoiceArms(choiceRule: Rule, mergedRules: Record<string, Rule>): Rule | null {
	const members = (choiceRule as unknown as { members: readonly Rule[] }).members;
	let changed = false;
	let declined = false;
	const newMembers = members.map((arm) => {
		let cursor = arm;
		const precStack: Rule[] = [];
		while (isPrecWrapper(cursor as { type: string })) {
			precStack.push(cursor);
			cursor = (cursor as unknown as { content: Rule }).content;
		}
		const t = (cursor as { type: string }).type;
		if (!isStringType(t) && t !== 'PATTERN') return arm;
		const text = (cursor as unknown as { value: string }).value;
		const nameHint = literalArmNameHint(text);
		const symbol = nameHint ? registerKwRule(cursor, nameHint, mergedRules, mergedRules) : null;
		if (!symbol) {
			declined = true;
			return arm;
		}
		changed = true;
		let rebuilt: Rule = symbol;
		for (let i = precStack.length - 1; i >= 0; i--) {
			rebuilt = { ...(precStack[i] as object), content: rebuilt } as Rule;
		}
		return rebuilt;
	});
	if (!changed || declined) return null;
	return { ...(choiceRule as object), members: newMembers } as Rule;
}

function pluralizeFieldName(name: string): string {
	if (name.endsWith('s')) return name;
	if (name.endsWith('y') && !/[aeiou]y$/.test(name)) return name.slice(0, -1) + 'ies';
	return name + 's';
}

function isHiddenPureUnionRule(name: string, mergedRules: Record<string, Rule>): boolean {
	if (!name.startsWith('_')) return false;
	const target = mergedRules[name];
	if (!target) return false;
	let core = target;
	while (isPrecWrapper(core as { type: string })) {
		core = (core as unknown as { content: Rule }).content;
	}
	return isChoiceType((core as { type: string }).type) && isAllArmsNodeShaped(core);
}

function isEligibleFieldReferent(
	name: string,
	mergedRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
): boolean {
	return supertypeNames.has(name) || isHiddenPureUnionRule(name, mergedRules);
}

function sameElementShape(a: Rule, b: Rule): boolean {
	return ruleKey(a as unknown as RuntimeRule) === ruleKey(b as unknown as RuntimeRule);
}

function peelTransparentElementWrappers(rule: Rule): Rule {
	if (isPrecWrapper(rule as { type: string })) {
		return peelTransparentElementWrappers((rule as unknown as { content: Rule }).content);
	}
	const members = (rule as unknown as { members?: Rule[] }).members;
	if (isChoiceType((rule as { type: string }).type) && members?.length === 1) {
		return peelTransparentElementWrappers(members[0]!);
	}
	return rule;
}

function deriveElementFieldName(elementRule: Rule): string {
	const cursor = peelTransparentElementWrappers(elementRule);
	const t = (cursor as { type: string }).type;
	if (t === 'SYMBOL') {
		return (cursor as unknown as { name: string }).name.replace(/^_/, '');
	}
	if (t === 'ALIAS') {
		const value = (cursor as unknown as { value?: string }).value;
		if (typeof value === 'string') return value;
	}
	return 'element';
}

function fieldSeparatedListElements(seqRule: Rule, reserve: (base: string) => string): Rule | null {
	const members = (seqRule as unknown as { members?: Rule[] }).members;
	if (!Array.isArray(members)) return null;
	for (let i = 0; i < members.length - 1; i++) {
		const leading = members[i]!;
		if (isFieldType((leading as { type: string }).type)) continue;
		let repeatCursor: Rule = members[i + 1]!;
		const outerPrecStack: Rule[] = [];
		while (isPrecWrapper(repeatCursor as { type: string })) {
			outerPrecStack.push(repeatCursor);
			repeatCursor = (repeatCursor as unknown as { content: Rule }).content;
		}
		if (!isRepeatType((repeatCursor as { type: string }).type)) continue;
		let inner = (repeatCursor as unknown as { content: RuntimeRule }).content;
		const innerPrecStack: Rule[] = [];
		while (isPrecWrapper(inner as unknown as { type: string })) {
			innerPrecStack.push(inner as unknown as Rule);
			inner = (inner as unknown as { content: RuntimeRule }).content;
		}
		const detected = separatorOf(inner);
		if (!detected || detected.trailing) continue;
		const innerElement = detected.content as unknown as Rule;
		if (!sameElementShape(leading, innerElement)) continue;
		const fieldName = reserve(deriveElementFieldName(leading));

		const innerMembers = (inner as unknown as { members: Rule[] }).members;
		const newInnerMembers = innerMembers.slice();
		const elementIdx = innerMembers.indexOf(innerElement as unknown as Rule);
		newInnerMembers[elementIdx] = makeField(fieldName, innerElement);
		let rebuiltInner: Rule = { ...(inner as unknown as object), members: newInnerMembers } as Rule;
		for (let j = innerPrecStack.length - 1; j >= 0; j--) {
			rebuiltInner = { ...(innerPrecStack[j] as object), content: rebuiltInner } as Rule;
		}
		let rebuiltRepeat: Rule = { ...(repeatCursor as object), content: rebuiltInner } as Rule;
		for (let j = outerPrecStack.length - 1; j >= 0; j--) {
			rebuiltRepeat = { ...(outerPrecStack[j] as object), content: rebuiltRepeat } as Rule;
		}

		const newMembers = members.slice();
		newMembers[i] = makeField(fieldName, leading);
		newMembers[i + 1] = rebuiltRepeat;
		return { ...(seqRule as object), members: newMembers } as Rule;
	}
	return null;
}

function applyNodeChoiceFieldWrap(
	ruleName: string,
	rule: Rule,
	mergedRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
): Rule {
	const usedNames = new Set<string>();
	collectAllFieldNamesDeep(rule, usedNames);
	let changed = false;

	const reserve = (base: string): string => {
		if (!usedNames.has(base)) {
			usedNames.add(base);
			return base;
		}
		let n = 2;
		while (usedNames.has(`${base}_${n}`)) n++;
		const name = `${base}_${n}`;
		usedNames.add(name);
		return name;
	};

	const refCounts = new Map<string, number>();
	const countEligibleRefs = (r: Rule): void => {
		if (isFieldType((r as { type: string }).type)) return;
		if (isSymbolType((r as { type: string }).type)) {
			const name = (r as unknown as { name: string }).name;
			if (isEligibleFieldReferent(name, mergedRules, supertypeNames)) {
				refCounts.set(name, (refCounts.get(name) ?? 0) + 1);
			}
			return;
		}
		const bag = r as unknown as { members?: readonly Rule[]; content?: Rule };
		if (Array.isArray(bag.members)) {
			for (const m of bag.members) countEligibleRefs(m);
		} else if (bag.content && typeof bag.content === 'object') {
			countEligibleRefs(bag.content);
		}
	};
	countEligibleRefs(rule);

	const visit = (r: Rule, suppressed: boolean = false): Rule => {
		if (isFieldType((r as { type: string }).type)) return r;

		if (!suppressed && isRepeatType((r as { type: string }).type)) {
			const content = (r as unknown as { content: Rule }).content;
			const precStack: Rule[] = [];
			let inner = content;
			while (isPrecWrapper(inner as { type: string })) {
				precStack.push(inner);
				inner = (inner as unknown as { content: Rule }).content;
			}
			const rebuildRepeat = (newInner: Rule): Rule => {
				let rebuiltInner = newInner;
				for (let i = precStack.length - 1; i >= 0; i--) {
					rebuiltInner = { ...(precStack[i] as object), content: rebuiltInner } as Rule;
				}
				return { ...(r as object), content: rebuiltInner } as Rule;
			};
			if (isSymbolType((inner as { type: string }).type)) {
				const refName = (inner as unknown as { name: string }).name;
				if (isEligibleFieldReferent(refName, mergedRules, supertypeNames) && refCounts.get(refName) === 1) {
					changed = true;
					const fieldName = pluralizeFieldName(refName.replace(/^_/, ''));
					return makeField(reserve(fieldName), rebuildRepeat(inner));
				}
			}
			let visitedInner = visit(inner, true);
			if (
				isChoiceType((visitedInner as { type: string }).type) &&
				!isAllArmsNodeShaped(visitedInner) &&
				isAllArmsNodeOrLiteralShaped(visitedInner)
			) {
				const promoted = promoteLiteralChoiceArms(visitedInner, mergedRules);
				if (promoted) visitedInner = promoted;
			}
			if (isChoiceType((visitedInner as { type: string }).type) && isAllArmsNodeShaped(visitedInner)) {
				changed = true;
				return makeField(reserve('elements'), rebuildRepeat(visitedInner));
			}
			if (visitedInner === inner) return r;
			return rebuildRepeat(visitedInner);
		}

		if (isSeqType((r as { type: string }).type)) {
			const sepListRewrite = fieldSeparatedListElements(r, reserve);
			if (sepListRewrite) {
				changed = true;
				r = sepListRewrite;
			}
		}

		const bag = r as unknown as { members?: readonly Rule[]; content?: Rule };
		if (Array.isArray(bag.members)) {
			const memberSuppressed = isChoiceType((r as { type: string }).type);
			let memberChanged = false;
			const newMembers = bag.members.map((m) => {
				const nm = visit(m, memberSuppressed);
				if (nm !== m) memberChanged = true;
				return nm;
			});
			return memberChanged ? ({ ...(r as object), members: newMembers } as Rule) : r;
		}
		if (bag.content && typeof bag.content === 'object') {
			const nc = visit(bag.content, suppressed);
			return nc !== bag.content ? ({ ...(r as object), content: nc } as Rule) : r;
		}
		return r;
	};

	const result = visit(rule);
	return changed ? result : rule;
}

function extractWordName(word: unknown): string | null {
	if (typeof word === 'string') return word;
	if (typeof word !== 'function') return null;
	const dollar = new Proxy(
		{},
		{
			get(_t, prop) {
				if (typeof prop === 'string') return { type: 'SYMBOL', name: prop };
				return undefined;
			}
		}
	);
	try {
		const result = (word as (proxy: unknown) => unknown)(dollar);
		const name = (result as { name?: unknown } | undefined)?.name;
		return typeof name === 'string' ? name : null;
	} catch {
		return null;
	}
}

function harvestSupertypeNames(result: unknown): Set<string> {
	const names = new Set<string>();
	if (!Array.isArray(result)) return names;
	for (const r of result) {
		if (typeof r === 'string') {
			names.add(r);
			continue;
		}
		const n = (r as { name?: unknown })?.name;
		if (typeof n === 'string') names.add(n);
	}
	return names;
}

export function nativeRuleFn<F>(...names: string[]): F {
	const g = globalThis as Record<string, unknown>;
	for (const name of names) {
		if (typeof g[name] === 'function') return g[name] as F;
	}
	throw new Error(
		`enrich: no global ${names.join('()/')}() — enrich must run inside a DSL runtime ` +
			`(sittir evaluate.ts or tree-sitter CLI; tests inject via _test-helpers.ts)`
	);
}

function makeField(name: string, content: unknown): Rule {
	const field = nativeRuleFn<(n: string, c: unknown) => Rule>('field');
	return { ...field(name, content), metadata: makeRuleMetadata({ fieldSource: 'enriched' }) };
}

function distributeExclusiveFieldChoices(rule: Rule, rulesBag: Record<string, Rule>): Rule {
	const seqFn = nativeRuleFn<(...args: unknown[]) => Rule>('seq');
	const choiceFn = nativeRuleFn<(...args: unknown[]) => Rule>('choice');

	const collapse = (alts: readonly Rule[]): Rule =>
		alts.length === 1 ? alts[0]! : ({ ...choiceFn(...alts), metadata: makeRuleMetadata({ author: 'enrich' }) } as Rule);

	const expand = (node: Rule): readonly Rule[] => {
		if (!node || typeof node !== 'object') return [node];
		let out: Rule = node;
		const members = (node as unknown as { members?: Rule[] }).members;
		const content = (node as unknown as { content?: Rule }).content;
		if (Array.isArray(members)) {
			const next = isChoiceType((node as { type?: string }).type)
				? members.flatMap((m) => expand(m))
				: members.map((m) => collapse(expand(m)));
			if (next.length !== members.length || next.some((m, i) => m !== members[i]))
				out = { ...node, members: next } as Rule;
		} else if (content && typeof content === 'object') {
			const next = collapse(expand(content));
			if (next !== content) out = { ...node, content: next } as Rule;
		}

		if (!isSeqType((out as { type?: string }).type)) return [out];
		const seqMembers = (out as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(seqMembers)) return [out];
		for (let i = 0; i < seqMembers.length; i += 1) {
			const branches = exclusiveFieldChoiceBranches(seqMembers[i]!, rulesBag);
			if (!branches) continue;
			return branches.flatMap((branch) => {
				const swapped = [...seqMembers];
				swapped[i] = branch;
				return expand(seqFn(...swapped));
			});
		}
		return [out];
	};

	return collapse(expand(rule));
}

function applyRepeatUnionFieldPromotion(ruleName: string, rule: Rule, rulesBag: Record<string, Rule>): Rule {
	const preExistingFieldNames = new Set<string>();
	const collectNames = (node: Rule): void => {
		const n = node as unknown as {
			type: string;
			name?: unknown;
			content?: Rule;
			members?: Rule[];
			metadata?: { fieldSource?: string };
		};
		if (isFieldType(n.type) && typeof n.name === 'string' && n.metadata?.fieldSource !== 'enriched') {
			preExistingFieldNames.add(n.name);
		}
		if (n.members) for (const m of n.members) collectNames(m);
		else if (n.content) collectNames(n.content);
	};
	collectNames(rule);
	const mintedBySymbol = new Map<string, string>();
	const mintedNames = new Set<string>();

	const rebuild = (node: Rule): Rule => {
		const n = node as unknown as { type: string; content?: Rule; members?: Rule[] };
		if (isFieldType(n.type)) return node;
		if (isRepeatType(n.type) && n.content) {
			let inner: Rule = n.content;
			while (isPrecWrapper(inner as { type: string })) inner = (inner as unknown as { content: Rule }).content;
			const sym = inner as unknown as { type: string; name?: unknown };
			if (sym.type === 'SYMBOL' && typeof sym.name === 'string' && sym.name.startsWith('_')) {
				const target = rulesBag[sym.name];
				if (target !== undefined && isChoiceType((target as { type: string }).type)) {
					const fieldName = mintedBySymbol.get(sym.name) ?? pluralizeFieldName(sym.name.replace(/^_+/, ''));
					const mintedForOther = mintedNames.has(fieldName) && mintedBySymbol.get(sym.name) !== fieldName;
					if (preExistingFieldNames.has(fieldName) || mintedForOther) {
						reportSkip('repeat-union-field', ruleName, `field '${fieldName}' already exists`);
						return node;
					}
					mintedBySymbol.set(sym.name, fieldName);
					mintedNames.add(fieldName);
					return makeField(fieldName, node);
				}
			}
			const content = rebuild(n.content);
			return content === n.content ? node : ({ ...node, content } as Rule);
		}
		if (n.members) {
			let changed = false;
			const members = n.members.map((m) => {
				const r = rebuild(m);
				if (r !== m) changed = true;
				return r;
			});
			return changed ? ({ ...node, members } as Rule) : node;
		}
		if (n.content) {
			const content = rebuild(n.content);
			return content === n.content ? node : ({ ...node, content } as Rule);
		}
		return node;
	};
	return rebuild(rule);
}

function makeSymbol(name: string): Rule {
	const symFn = nativeRuleFn<(n: string) => Rule>('sym');
	return symFn(name);
}

function registerKwRule(
	stringLiteral: Rule,
	keyword: string,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>
): Rule | null {
	const hiddenName = `_kw_${keyword}`;
	if (hiddenName in kwRules) return makeSymbol(hiddenName);
	const existing = rulesBag[hiddenName];
	if (existing === undefined) {
		kwRules[hiddenName] = stringLiteral;
		return makeSymbol(hiddenName);
	}
	if (ruleKey(existing as RuntimeRule) === ruleKey(stringLiteral as RuntimeRule)) {
		return makeSymbol(hiddenName);
	}
	return null;
}

function collectFieldNamesRuntime(rule: Rule): Set<string> {
	const names = new Set<string>();
	if (!isSeqType(rule.type)) return names;
	const members = (rule as unknown as { members: unknown[] }).members;
	for (const raw of members) {
		const m = normalizeMember(raw);
		if (isFieldType(m.type) && typeof m.name === 'string') {
			names.add(m.name);
			continue;
		}
		const peeled = peelOptional(m as unknown as Rule);
		if (peeled.isOptional) {
			const innerN = normalizeMember(peeled.inner);
			if (isFieldType(innerN.type) && typeof innerN.name === 'string') {
				names.add(innerN.name);
			}
		}
	}
	return names;
}

function reportSkip(pass: string, ruleName: string, reason: string): void {
	if (process.env.SITTIR_QUIET) return;
	process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})\n`);
}

interface SymbolTarget {
	readonly name: string;
	readonly symbolRule: Rule;
	wrap(fieldNode: Rule): Rule;
}

function isBareShapeTarget(member: Rule, target: SymbolTarget): boolean {
	return target.symbolRule === member;
}

function detectSymbolTarget(member: Rule): SymbolTarget | null {
	if (isSymbolType(member.type) && typeof (member as { name?: unknown }).name === 'string') {
		const name = (member as { name: string }).name;
		return {
			name,
			symbolRule: member,
			wrap: (fieldNode) => fieldNode
		};
	}
	const peeled = peelOptional(member);
	if (!peeled.isOptional) return null;
	const innerN = normalizeMember(peeled.inner);
	if (isSymbolType(innerN.type) && typeof innerN.name === 'string') {
		return {
			name: innerN.name,
			symbolRule: peeled.inner,
			wrap: (fieldNode) => rebuildOptional(member, fieldNode)
		};
	}
	if (!isSeqType(innerN.type)) return null;
	const seqMembers = (peeled.inner as unknown as { members: Rule[] }).members;
	let symIdx = -1;
	for (let i = 0; i < seqMembers.length; i++) {
		const sn = normalizeMember(seqMembers[i]!);
		if (isSymbolType(sn.type) && typeof sn.name === 'string') {
			if (symIdx !== -1) return null;
			symIdx = i;
		} else if (!isStringType(sn.type) && sn.type !== 'PATTERN') {
			return null;
		}
	}
	if (symIdx === -1) return null;
	const symMember = seqMembers[symIdx]!;
	const sn = normalizeMember(symMember);
	if (!isSymbolType(sn.type) || typeof sn.name !== 'string') return null;
	const seqRule = peeled.inner;
	return {
		name: sn.name,
		symbolRule: symMember,
		wrap: (fieldNode) => {
			const newSeqMembers = seqMembers.map((mm, i) => (i === symIdx ? fieldNode : mm));
			const newSeq = { ...seqRule, members: newSeqMembers } as Rule;
			return rebuildOptional(member, newSeq);
		}
	};
}

function countSymbolsInRepeat(
	node: Rule | undefined | null,
	kindCounts: Map<string, number>,
	inRepeat: boolean = false
): void {
	if (!node) return;
	const t = (node as { type?: string }).type;
	if (!t) return;
	if (isFieldType(t)) return;
	if (t === 'ALIAS') return;
	if (isSymbolType(t)) {
		if (!inRepeat) return;
		const name = (node as unknown as { name?: string }).name;
		if (typeof name === 'string') {
			kindCounts.set(name, (kindCounts.get(name) ?? 0) + 1);
		}
		return;
	}
	if (isRepeatType(t)) {
		const content = (node as unknown as { content?: Rule }).content;
		countSymbolsInRepeat(content, kindCounts, true);
		return;
	}
	if (isSeqType(t) || isChoiceType(t)) {
		const members = (node as unknown as { members?: Rule[] }).members;
		if (Array.isArray(members)) {
			for (const m of members) countSymbolsInRepeat(m, kindCounts, inRepeat);
		}
		return;
	}
	if (isOptionalType(t) || isPrecWrapper(node as { type: string })) {
		const content = (node as unknown as { content?: Rule }).content;
		countSymbolsInRepeat(content, kindCounts, inRepeat);
		return;
	}
}

function applySymbolToField(ruleName: string, rule: Rule, supertypeNames: ReadonlySet<string>): Rule {
	if (ruleName.startsWith('_')) return rule;
	const precStack: Rule[] = [];
	let cursor: Rule = rule;
	while (isPrecWrapper(cursor as { type: string })) {
		precStack.push(cursor);
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	if (!isSeqType(cursor.type)) {
		return tryPromoteInRepeatSeq(ruleName, rule, cursor, precStack, supertypeNames);
	}
	const members = (cursor as unknown as { members: Rule[] }).members;
	const directKindCounts = new Map<string, number>();
	const targetByIdx: Array<SymbolTarget | null> = members.map((m) => {
		const t = detectSymbolTarget(m);
		if (!t) return null;
		if (t.name.startsWith('_') && !isBareShapeTarget(m, t)) return null;
		return t;
	});
	for (const t of targetByIdx) {
		if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
	}
	const nestedRepeatCounts = new Map<string, number>();
	for (const m of members) {
		countSymbolsInRepeat(m, nestedRepeatCounts);
	}
	const existing = collectFieldNamesRuntime(cursor);
	const sequenceCounters = new Map<string, number>();
	let changed = false;
	const newMembers = members.map((m, i) => {
		const t = targetByIdx[i];
		if (!t) return m;
		let baseFieldName = t.name;
		if (t.name.startsWith('_')) {
			if (!supertypeNames.has(t.name)) return m;
			baseFieldName = t.name.slice(1);
		}
		if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
		const directCount = directKindCounts.get(t.name) ?? 0;
		let fieldName = baseFieldName;
		if (directCount > 1) {
			const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
			sequenceCounters.set(t.name, seqIdx);
			fieldName = `${baseFieldName}${seqIdx}`;
		}
		if (existing.has(fieldName)) {
			reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists`);
			return m;
		}
		existing.add(fieldName);
		changed = true;
		const fieldNode = makeField(fieldName, t.symbolRule);
		return t.wrap(fieldNode);
	});
	const combinedKindCounts = new Map<string, number>(directKindCounts);
	for (const [k, v] of nestedRepeatCounts) {
		combinedKindCounts.set(k, (combinedKindCounts.get(k) ?? 0) + v);
	}
	const finalMembers = promoteInsideRepeatMembers(ruleName, newMembers, supertypeNames, existing, combinedKindCounts);
	if (finalMembers === newMembers && !changed) return rule;
	let result: Rule = { ...cursor, members: finalMembers } as Rule;
	for (let i = precStack.length - 1; i >= 0; i--) {
		result = { ...precStack[i]!, content: result } as Rule;
	}
	return result;
}

function promoteInsideRepeatMembers(
	ruleName: string,
	members: Rule[],
	supertypeNames: ReadonlySet<string>,
	existing: Set<string>,
	outerKindCounts: Map<string, number>
): Rule[] {
	let anyRepeatChanged = false;
	const result = members.map((m) => {
		const rebuilt = tryPromoteInRepeatMember(ruleName, m, supertypeNames, existing, outerKindCounts);
		if (rebuilt === null) return m;
		anyRepeatChanged = true;
		return rebuilt;
	});
	if (!anyRepeatChanged) return members;
	return result;
}

function tryPromoteInRepeatMember(
	ruleName: string,
	member: Rule,
	supertypeNames: ReadonlySet<string>,
	existing: Set<string>,
	outerKindCounts: Map<string, number>
): Rule | null {
	let cursor: Rule = member;
	const memberPrecStack: Rule[] = [];
	while (isPrecWrapper(cursor as { type: string })) {
		memberPrecStack.push(cursor);
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	if (!isRepeatType(cursor.type)) return null;

	let inner = (cursor as unknown as { content: Rule }).content;
	const innerPrecStack: Rule[] = [];
	while (isPrecWrapper(inner as { type: string })) {
		innerPrecStack.push(inner);
		inner = (inner as unknown as { content: Rule }).content;
	}
	if (!isSeqType(inner.type)) return null;

	const innerMembers = (inner as unknown as { members: Rule[] }).members;
	const innerTargets: Array<SymbolTarget | null> = innerMembers.map((m) => {
		const t = detectSymbolTarget(m);
		if (!t) return null;
		if (t.name.startsWith('_') && !isBareShapeTarget(m, t)) return null;
		return t;
	});

	const directKindCounts = new Map<string, number>();
	for (const t of innerTargets) {
		if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
	}
	const nestedRepeatCounts = new Map<string, number>();
	for (const im of innerMembers) {
		countSymbolsInRepeat(im, nestedRepeatCounts);
	}

	const innerExisting = collectFieldNamesRuntime(inner);
	const sequenceCounters = new Map<string, number>();

	let innerChanged = false;
	const newInnerMembers = innerMembers.map((im, i) => {
		const t = innerTargets[i];
		if (!t) return im;
		let baseFieldName = t.name;
		if (t.name.startsWith('_')) {
			if (!supertypeNames.has(t.name)) return im;
			baseFieldName = t.name.slice(1);
		}
		if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return im;
		if ((outerKindCounts.get(t.name) ?? 0) > 0) return im;
		const directCount = directKindCounts.get(t.name) ?? 0;
		let fieldName = baseFieldName;
		if (directCount > 1) {
			const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
			sequenceCounters.set(t.name, seqIdx);
			fieldName = `${baseFieldName}${seqIdx}`;
		}
		if (innerExisting.has(fieldName)) return im;
		if (existing.has(fieldName)) {
			reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists (outer seq)`);
			return im;
		}
		innerExisting.add(fieldName);
		innerChanged = true;
		const fieldNode = makeField(fieldName, t.symbolRule);
		return t.wrap(fieldNode);
	});

	if (!innerChanged) return null;

	let rebuilt: Rule = { ...inner, members: newInnerMembers } as Rule;
	for (let i = innerPrecStack.length - 1; i >= 0; i--) {
		rebuilt = { ...innerPrecStack[i]!, content: rebuilt } as Rule;
	}
	rebuilt = { ...cursor, content: rebuilt } as Rule;
	for (let i = memberPrecStack.length - 1; i >= 0; i--) {
		rebuilt = { ...memberPrecStack[i]!, content: rebuilt } as Rule;
	}
	return rebuilt;
}

function tryPromoteInRepeatSeq(
	ruleName: string,
	rule: Rule,
	cursor: Rule,
	outerPrecStack: Rule[],
	supertypeNames: ReadonlySet<string>
): Rule {
	if (!isRepeatType(cursor.type)) return rule;
	let inner = (cursor as unknown as { content: Rule }).content;
	const innerPrecStack: Rule[] = [];
	while (isPrecWrapper(inner as { type: string })) {
		innerPrecStack.push(inner);
		inner = (inner as unknown as { content: Rule }).content;
	}
	if (!isSeqType(inner.type)) return rule;
	const members = (inner as unknown as { members: Rule[] }).members;
	const directKindCounts = new Map<string, number>();
	const targetByIdx: Array<SymbolTarget | null> = members.map((m) => {
		const t = detectSymbolTarget(m);
		if (!t) return null;
		if (t.name.startsWith('_') && !isBareShapeTarget(m, t)) return null;
		return t;
	});
	for (const t of targetByIdx) {
		if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
	}
	const nestedRepeatCounts = new Map<string, number>();
	for (const m of members) {
		countSymbolsInRepeat(m, nestedRepeatCounts);
	}
	const existing = collectFieldNamesRuntime(inner);
	const sequenceCounters = new Map<string, number>();
	let changed = false;
	const newMembers = members.map((m, i) => {
		const t = targetByIdx[i];
		if (!t) return m;
		let baseFieldName = t.name;
		if (t.name.startsWith('_')) {
			if (!supertypeNames.has(t.name)) return m;
			baseFieldName = t.name.slice(1);
		}
		if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
		const directCount = directKindCounts.get(t.name) ?? 0;
		let fieldName = baseFieldName;
		if (directCount > 1) {
			const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
			sequenceCounters.set(t.name, seqIdx);
			fieldName = `${baseFieldName}${seqIdx}`;
		}
		if (existing.has(fieldName)) {
			reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists`);
			return m;
		}
		existing.add(fieldName);
		changed = true;
		const fieldNode = makeField(fieldName, t.symbolRule);
		return t.wrap(fieldNode);
	});
	if (!changed) return rule;
	let result: Rule = { ...inner, members: newMembers } as Rule;
	for (let i = innerPrecStack.length - 1; i >= 0; i--) {
		result = { ...innerPrecStack[i]!, content: result } as Rule;
	}
	result = { ...cursor, content: result } as Rule;
	for (let i = outerPrecStack.length - 1; i >= 0; i--) {
		result = { ...outerPrecStack[i]!, content: result } as Rule;
	}
	return result;
}

function applyOptionalKeyword(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule {
	const inner = peelPrec(rule);
	const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : new Set<string>();
	return walkOptionalKeyword(ruleName, rule, claimed, kwRules, rulesBag, wordMatcher) ?? rule;
}

function peelPrec(rule: Rule): Rule {
	let cursor: Rule = rule;
	while (isPrecWrapper(cursor as { type: string })) {
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	return cursor;
}

function tryPromoteOptionalNode(
	ruleName: string,
	rule: Rule,
	claimedAtSeqLevel: Set<string>,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): { matched: boolean; result: Rule | null } {
	const peeled = peelOptional(rule);
	if (!peeled.isOptional) return { matched: false, result: null };
	const replacement = tryPromoteInnerKeyword(
		ruleName,
		rule,
		peeled.inner,
		claimedAtSeqLevel,
		kwRules,
		rulesBag,
		wordMatcher
	);
	if (replacement !== null) return { matched: true, result: replacement };
	const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
	if (innerRewritten !== null) {
		return { matched: true, result: rebuildOptional(rule, innerRewritten) };
	}
	return { matched: true, result: null };
}

function walkOptionalKeyword(
	ruleName: string,
	rule: Rule,
	claimedAtSeqLevel: Set<string>,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule | null {
	if (isSeqType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	if (isChoiceType(rule.type)) {
		const promoted = tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
		if (promoted.matched) return promoted.result;
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	const promoted = tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
	if (promoted.matched) return promoted.result;
	if (isRepeatType(rule.type) || isFieldType(rule.type)) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
		if (out === null) return null;
		return { ...rule, content: out } as Rule;
	}
	if (isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
		if (out === null) return null;
		return { ...rule, content: out } as Rule;
	}
	return null;
}

function tryPromoteInnerKeyword(
	ruleName: string,
	optionalRule: Rule,
	inner: Rule,
	claimed: Set<string>,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule | null {
	const innerNorm = normalizeMember(inner);
	if (!isStringType(innerNorm.type)) return null;
	const kw = innerNorm.value;
	if (typeof kw !== 'string' || !matchesWordShape(kw, wordMatcher)) return null;
	const fieldName = `${kw}_marker`;
	if (claimed.has(fieldName)) {
		reportSkip('optional-keyword-prefix', ruleName, `field '${fieldName}' already exists`);
		return null;
	}
	claimed.add(fieldName);
	const symbolRef = registerKwRule(inner, fieldName, kwRules, rulesBag);
	if (symbolRef === null) {
		reportSkip(
			'optional-keyword-prefix',
			ruleName,
			`rule '_kw_${fieldName}' already exists in base.grammar.rules with different content`
		);
		return null;
	}
	const fieldNode = makeField(fieldName, symbolRef);
	return rebuildOptional(optionalRule, fieldNode);
}

function rebuildOptional(optionalRule: Rule, newInner: Rule): Rule {
	if (isOptionalType(optionalRule.type)) {
		return { ...optionalRule, content: newInner } as Rule;
	}
	const members = (optionalRule as unknown as { members: Rule[] }).members;
	const newMembers = members.map((m) => {
		const t = (m as { type?: string }).type;
		return t === 'BLANK' ? m : newInner;
	});
	return { ...optionalRule, members: newMembers } as Rule;
}

interface ClauseHoistCounter {
	opt: number;
	grp: number;
	arm: number;
	readonly supertypeNames?: ReadonlySet<string>;
}

function appendTrailingMemberToOptionalSeq(optSeqRule: Rule, trailingOptional: Rule): Rule {
	const peeled = peelOptionalSeq(optSeqRule)!;
	const seqBody = peeled.seqBody;
	const seqMembers = (seqBody as unknown as { members: Rule[] }).members;
	const newSeqBody = { ...seqBody, members: [...seqMembers, trailingOptional] } as Rule;
	return rebuildOptional(optSeqRule, newSeqBody);
}

interface InlineSeparatedListRun {
	info: SeparatedListBodyInfo;
	key: string;
	body: Rule;
	start: number;
	size: number;
}

function detectInlineSeparatedListRuns(members: Rule[]): InlineSeparatedListRun[] {
	const carriesRepeat = (m: Rule): boolean => {
		if (isRepeatType((m as { type?: string }).type)) return true;
		if (!isSeqType((m as { type?: string }).type)) return false;
		const inner = (m as unknown as { members?: Rule[] }).members;
		return Array.isArray(inner) && inner.some((im) => isRepeatType((im as { type?: string }).type));
	};
	const runs: InlineSeparatedListRun[] = [];
	let i = 0;
	while (i < members.length) {
		let consumed = 0;
		for (const size of [3, 2, 1]) {
			if (i + size > members.length || size === members.length) continue;
			const window = members.slice(i, i + size);
			if (!window.some(carriesRepeat)) continue;
			const synthetic =
				size === 1 && isSeqType((window[0] as { type?: string }).type)
					? window[0]!
					: ({ type: 'SEQ', members: window } as unknown as Rule);
			const info = separatedListBodyInfo(synthetic);
			if (info?.flankCarrying) {
				if (info.form === 'tail') {
					const repeatMember = window[0]!;
					const prev = i > 0 ? members[i - 1] : undefined;
					const prevIsPair =
						prev !== undefined &&
						ruleKey(prev as RuntimeRule) === ruleKey((repeatMember as { content?: RuntimeRule }).content!);
					if (typeEq((repeatMember as { type?: string }).type, 'REPEAT1') || prevIsPair) continue;
				}
				runs.push({ info, key: ruleKey(synthetic as RuntimeRule), body: synthetic, start: i, size });
				consumed = size;
				break;
			}
		}
		i += consumed || 1;
	}
	return runs;
}

function collectSeparatedListNameProposals(rules: Record<string, Rule>): Map<string, number> {
	const keysByName = new Map<string, Set<string>>();
	const record = (info: SeparatedListBodyInfo, key: string) => {
		if (info.elementName === null) return;
		const plural = pluralizeFieldName(info.elementName);
		let keys = keysByName.get(plural);
		if (!keys) keysByName.set(plural, (keys = new Set()));
		keys.add(key);
	};
	const visit = (rule: Rule | undefined): void => {
		if (!rule || typeof rule !== 'object') return;
		const t = (rule as { type?: string }).type;
		if (typeof t !== 'string') return;
		if (isSeqType(t)) {
			const rawMembers = (rule as unknown as { members?: Rule[] }).members;
			if (Array.isArray(rawMembers)) {
				const members = absorbTrailingListSeparators(rawMembers) ?? rawMembers;
				const folded = members === rawMembers ? rule : ({ ...rule, members } as Rule);
				const whole = separatedListBodyInfo(folded);
				if (whole?.flankCarrying) {
					record(whole, ruleKey(folded as RuntimeRule));
				} else {
					for (const run of detectInlineSeparatedListRuns(members)) record(run.info, run.key);
				}
				for (const m of members) visit(m);
				return;
			}
		}
		const content = (rule as { content?: Rule }).content;
		if (content) visit(content);
		const members = (rule as { members?: Rule[] }).members;
		if (Array.isArray(members)) for (const m of members) visit(m);
	};
	for (const name of Object.keys(rules)) visit(rules[name]);
	return new Map([...keysByName].map(([name, keys]) => [name, keys.size]));
}

let separatedListNameCounts: Map<string, number> | null = null;

let separatedListEnrichSkip: ReadonlySet<string> | null = null;

let hiddenListPromotionNames: Map<string, string> | null = null;

let hoistKwRules: Record<string, Rule> | null = null;
let hoistWordMatcher: RegExp | undefined;

function promoteHiddenListRef(member: Rule, rulesBag: Record<string, Rule>): Rule {
	if (separatedListNameCounts === null || hiddenListPromotionNames === null) return member;
	if (!isSymbolType((member as { type?: string }).type)) return member;
	const name = (member as { name?: unknown }).name;
	if (typeof name !== 'string' || !name.startsWith('_')) return member;
	if (separatedListEnrichSkip?.has(name)) return member;
	let visibleName = hiddenListPromotionNames.get(name);
	if (visibleName === undefined) {
		const body = rulesBag[name];
		if (!body || !isSeqType((body as { type?: string }).type)) return member;
		const info = separatedListBodyInfo(body);
		if (!info?.flankCarrying || info.form !== 'head') return member;
		const base = name.replace(/^_+/, '');
		const bare = info.elementName !== null ? pluralizeFieldName(info.elementName) : null;
		const candidates: string[] = [];
		if (bare !== null && separatedListNameCounts.get(bare) === 1) candidates.push(bare);
		if (bare !== null && base !== bare && !base.endsWith(`_${bare}`)) candidates.push(`${base}_${bare}`);
		candidates.push(base.endsWith('_elements') ? base : `${base}_elements`);
		visibleName = candidates.find((c) => !(c in rulesBag) && !(`_${c}` in rulesBag));
		if (visibleName === undefined) return member;
		hiddenListPromotionNames.set(name, visibleName);
	}
	return makeVisibleGroupAlias(member, visibleName);
}

function absorbTrailingListSeparators(members: Rule[]): Rule[] | null {
	let changed = false;
	const out: Rule[] = [];
	for (let i = 0; i < members.length; i++) {
		const cur = members[i]!;
		const next = members[i + 1];
		const sep = next ? listSeparatorOfOptionalSeq(cur) : null;
		if (sep !== null && optionalStringLiteral(next!) === sep) {
			out.push(appendTrailingMemberToOptionalSeq(cur, next!));
			i++;
			changed = true;
			continue;
		}
		out.push(cur);
	}
	return changed ? out : null;
}

function applyClauseHoist(
	parentKind: string,
	rule: Rule,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	dedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>,
	ambientPrec?: Rule,
	enclosingFieldName?: string
): Rule {
	const peeled = peelOptionalSeq(rule);
	if (peeled !== null) {
		const recursedSeqBody = applyClauseHoist(
			parentKind,
			peeled.seqBody,
			rulesBag,
			clauseGroupRules,
			dedupeMap,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			ambientPrec,
			enclosingFieldName
		);

		if (ruleMatchesEmpty(recursedSeqBody)) {
			counter.opt += 1;
			if (recursedSeqBody === peeled.seqBody) return rule;
			if (peeled.form === 'optional') {
				return rebuildOptional(rule, recursedSeqBody);
			} else {
				const members = (rule as unknown as { members: Rule[] }).members;
				const newMembers = members.slice() as Rule[];
				newMembers[peeled.seqIdx] = recursedSeqBody;
				return { ...rule, members: newMembers } as Rule;
			}
		} else if (isInlineSafe(recursedSeqBody, rulesBag)) {
			const name = clauseHoistSynthName(recursedSeqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules);
			if (name !== null) {
				if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
				const symbolRef = makeGroupLiftSymbol(rule, name);
				if (peeled.form === 'optional') {
					return rebuildOptional(rule, symbolRef);
				} else {
					const members = (rule as unknown as { members: Rule[] }).members;
					const newMembers = members.slice() as Rule[];
					newMembers[peeled.seqIdx] = symbolRef;
					return { ...rule, members: newMembers } as Rule;
				}
			}
			return rule;
		} else {
			counter.opt += 1;
			const names = visibleGroupSynthName(
				recursedSeqBody,
				parentKind,
				groupDedupeMap,
				counter,
				rulesBag,
				clauseGroupRules,
				ambientPrec,
				enclosingFieldName
			);
			if (names !== null) {
				visibleGroupHiddenNames.add(names.hiddenName);
				if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
				const symbolRef = makeGroupLiftSymbol(rule, names.hiddenName);
				const aliasRule = makeVisibleGroupAlias(symbolRef, names.visibleName);
				if (peeled.form === 'optional') {
					return rebuildOptional(rule, aliasRule);
				} else {
					const members = (rule as unknown as { members: Rule[] }).members;
					const newMembers = members.slice() as Rule[];
					newMembers[peeled.seqIdx] = aliasRule;
					return { ...rule, members: newMembers } as Rule;
				}
			}
			if (recursedSeqBody === peeled.seqBody) return rule;
			if (peeled.form === 'optional') {
				return rebuildOptional(rule, recursedSeqBody);
			} else {
				const members = (rule as unknown as { members: Rule[] }).members;
				const newMembers = members.slice() as Rule[];
				newMembers[peeled.seqIdx] = recursedSeqBody;
				return { ...rule, members: newMembers } as Rule;
			}
		}
	}

	{
		const opt = peelOptional(rule);
		if (opt.isOptional) {
			const recursed = applyClauseHoist(
				parentKind,
				opt.inner,
				rulesBag,
				clauseGroupRules,
				dedupeMap,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				ambientPrec,
				enclosingFieldName
			);
			const promoted = mintStructuredChoiceArm(
				recursed,
				parentKind,
				rulesBag,
				clauseGroupRules,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				new Set(),
				ambientPrec,
				enclosingFieldName
			);
			const final = promoted ?? recursed;
			if (final === opt.inner) return rule;
			if (isOptionalType(rule.type)) {
				return { ...rule, content: final } as Rule;
			}
			const members = (rule as unknown as { members: Rule[] }).members;
			const idx = members.findIndex((m) => (m as { type: string }).type !== 'BLANK');
			const newMembers = members.slice();
			newMembers[idx] = final;
			return { ...rule, members: newMembers } as Rule;
		}
	}

	if (isSeqType(rule.type)) {
		const rawMembers = (rule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(rawMembers)) return rule;
		const absorbed = absorbTrailingListSeparators(rawMembers);
		const members = absorbed ?? rawMembers;
		let changed = absorbed !== null;
		const newMembers = members.map((m) => {
			let out = applyClauseHoist(
				parentKind,
				m,
				rulesBag,
				clauseGroupRules,
				dedupeMap,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				ambientPrec
			);
			out = promoteHiddenListRef(out, rulesBag);
			if (out !== m) changed = true;
			return out;
		});
		if (separatedListNameCounts !== null && separatedListBodyInfo({ ...rule, members: newMembers } as Rule) === null) {
			const runs = detectInlineSeparatedListRuns(newMembers);
			for (let r = runs.length - 1; r >= 0; r--) {
				const run = runs[r]!;
				const isTail = run.info.form === 'tail';
				const seqFn = nativeRuleFn<(...m: unknown[]) => Rule>('seq');
				const repeatFn = nativeRuleFn<(r: unknown) => Rule>('repeat');
				const optionalFn = nativeRuleFn<(r: unknown) => Rule>('optional', 'opt');
				const body = isTail
					? seqFn(
							run.info.element,
							repeatFn(seqFn(run.info.separatorRule, run.info.element)),
							optionalFn(run.info.separatorRule)
						)
					: seqFn(...run.info.flatMembers);
				const names = visibleGroupSynthName(
					body,
					parentKind,
					groupDedupeMap,
					counter,
					rulesBag,
					clauseGroupRules,
					ambientPrec
				);
				if (names === null) continue;
				visibleGroupHiddenNames.add(names.hiddenName);
				if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
				const symbolRef = makeGroupLiftSymbol(body, names.hiddenName);
				const aliasRule = makeVisibleGroupAlias(symbolRef, names.visibleName);
				const replacement = isTail ? optionalFn(aliasRule) : aliasRule;
				newMembers.splice(run.start, run.size, replacement);
				changed = true;
			}
		}
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
	}

	if (isChoiceType(rule.type)) {
		let choiceRule = rule;
		const permutationChoice = isPermutationChoice(rule, rulesBag, hoistKwRules ?? undefined, hoistWordMatcher);
		if (permutationChoice && hoistKwRules !== null) {
			choiceRule = promotePermutationArmKeywords(rule, hoistKwRules, rulesBag, hoistWordMatcher);
		}
		const members = (choiceRule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(members)) return rule;
		const leadingNameCounts = new Map<string, number>();
		for (const m of members) {
			const name = armLeadingSymbolName(m, rulesBag);
			if (name !== undefined) leadingNameCounts.set(name, (leadingNameCounts.get(name) ?? 0) + 1);
		}
		const collidingLeadingNames = new Set<string>();
		for (const [name, count] of leadingNameCounts) {
			if (count >= 2) collidingLeadingNames.add(name);
		}
		let changed = false;
		const newMembers = members.map((m) => {
			const out = applyClauseHoist(
				parentKind,
				m,
				rulesBag,
				clauseGroupRules,
				dedupeMap,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				ambientPrec
			);
			const literalOnlySplit = members.some((sib) => sib !== m && armsDifferOnlyByLiteralChoice(out, sib));
			const promoted =
				permutationChoice || literalOnlySplit
					? null
					: mintStructuredChoiceArm(
							out,
							parentKind,
							rulesBag,
							clauseGroupRules,
							counter,
							groupDedupeMap,
							visibleGroupHiddenNames,
							clauseGroupOwners,
							collidingLeadingNames,
							ambientPrec
						);
			const final = promoteHiddenListRef(promoted ?? out, rulesBag);
			if (final !== m) changed = true;
			return final;
		});
		return changed || choiceRule !== rule ? ({ ...choiceRule, members: newMembers } as Rule) : rule;
	}

	if (isRepeatType(rule.type) || isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (!content) return rule;
		const innerAmbientPrec = isPrecWrapper(rule as { type: string }) ? rule : ambientPrec;
		const newContent = applyClauseHoist(
			parentKind,
			content,
			rulesBag,
			clauseGroupRules,
			dedupeMap,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			innerAmbientPrec,
			enclosingFieldName
		);
		if (newContent === content) return rule;
		return { ...rule, content: newContent } as Rule;
	}

	if (isFieldType(rule.type)) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (!content) return rule;
		const newContent = applyClauseHoist(
			parentKind,
			content,
			rulesBag,
			clauseGroupRules,
			dedupeMap,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			ambientPrec,
			(rule as unknown as { name: string }).name
		);
		if (newContent === content) return rule;
		return { ...rule, content: newContent } as Rule;
	}

	return rule;
}

export function clusterSignatures(values: readonly RuntimeRule[]): string[] {
	const indexByKey = new Map<string, number>();
	const clusterOf: string[] = [];
	for (const value of values) {
		const key = ruleKey(value);
		let idx = indexByKey.get(key);
		if (idx === undefined) {
			idx = indexByKey.size;
			indexByKey.set(key, idx);
		}
		clusterOf.push(String(idx));
	}
	return clusterOf;
}

export const ENRICH_UNALIAS_DIAGNOSTICS_KEY = '__enrichUnaliasDiagnostics__' as const;

function unaliasDiagnosticKey(diagnostic: ParseKindCollisionDiagnostic): string {
	return [
		diagnostic.code,
		diagnostic.ownerKind,
		diagnostic.slotName,
		diagnostic.parseKind,
		diagnostic.storageKinds.join(',')
	].join(' ');
}

interface UnaliasDiagnosticSink {
	readonly diagnostics: ParseKindCollisionDiagnostic[];
	readonly seen: Set<string>;
}

function recordUnaliasDiagnostic(sink: UnaliasDiagnosticSink, diagnostic: ParseKindCollisionDiagnostic): void {
	const key = unaliasDiagnosticKey(diagnostic);
	if (sink.seen.has(key)) return;
	sink.seen.add(key);
	sink.diagnostics.push(diagnostic);
}

export function getEnrichUnaliasDiagnostics(grammar: unknown): readonly ParseKindCollisionDiagnostic[] {
	if (!grammar || typeof grammar !== 'object') return [];
	const diagnostics = (grammar as Record<string, unknown>)[ENRICH_UNALIAS_DIAGNOSTICS_KEY];
	return Array.isArray(diagnostics) ? (diagnostics as ParseKindCollisionDiagnostic[]) : [];
}

interface UnaliasCandidate {
	readonly targetName: string;
	readonly slotKey: string | undefined;
	readonly storageKind: string | undefined;
	readonly resolvedBody: RuntimeRule;
	readonly aliasSite?: { readonly path: readonly (string | number)[]; readonly content: Rule; readonly named: boolean };
}

function collectUnaliasCandidates(
	node: Rule,
	path: readonly (string | number)[],
	slotKey: string | undefined,
	rulesBag: Record<string, Rule>,
	out: UnaliasCandidate[],
	walker: RuleWalker,
	visited: Set<string> = new Set(),
	supertypeNames: ReadonlySet<string> = new Set(),
	rewritable = true
): void {
	const t = (node as { type?: string }).type;
	if (!t) return;
	if (t === 'ALIAS') {
		const aliasRule = node as unknown as { content: Rule; value: string; named: boolean };
		const storageKind = isSymbolType(aliasRule.content.type)
			? (aliasRule.content as unknown as { name?: string }).name
			: undefined;
		const resolvedBody = normalizeMember(
			(storageKind !== undefined ? rulesBag[storageKind] : undefined) ?? aliasRule.content
		);
		out.push({
			targetName: aliasRule.value,
			slotKey,
			storageKind,
			resolvedBody,
			aliasSite: rewritable ? { path, content: aliasRule.content, named: aliasRule.named } : undefined
		});
		return;
	}
	if (isSymbolType(t)) {
		const name = (node as unknown as { name?: string }).name;
		if (typeof name === 'string') {
			const target = rulesBag[name];
			const resolvedBody = normalizeMember(target ?? node);
			const erasesToArms = name.startsWith('_') || supertypeNames.has(name);
			if (target !== undefined && erasesToArms && isChoiceType(resolvedBody.type) && !visited.has(name)) {
				visited.add(name);
				collectUnaliasCandidates(target, path, slotKey, rulesBag, out, walker, visited, supertypeNames, false);
				return;
			}
			out.push({ targetName: name, slotKey, storageKind: name, resolvedBody });
		}
		return;
	}
	const nextSlotKey = isFieldType(t) ? ((node as unknown as { name?: string }).name ?? slotKey) : slotKey;
	for (const { segment, child } of walker.childEdgesOf(node as unknown as AnyRule)) {
		collectUnaliasCandidates(
			child as unknown as Rule,
			[...path, ...segment],
			nextSlotKey,
			rulesBag,
			out,
			walker,
			visited,
			supertypeNames,
			rewritable
		);
	}
}

function rewriteUnaliasAt(node: Rule, path: readonly (string | number)[], replacement: Rule): Rule {
	if (path.length === 0) return replacement;
	const [key, ...rest] = path;
	if (key === 'members') {
		const idx = rest[0] as number;
		const members = (node as unknown as { members: Rule[] }).members.slice();
		members[idx] = rest.length > 1 ? rewriteUnaliasAt(members[idx]!, rest.slice(1), replacement) : replacement;
		return { ...node, members } as Rule;
	}
	const k = key as string;
	const child = (node as unknown as Record<string, Rule>)[k]!;
	return { ...node, [k]: rest.length > 0 ? rewriteUnaliasAt(child, rest, replacement) : replacement } as Rule;
}

function applyUnaliasDistinct(
	ruleName: string,
	rule: Rule,
	rulesBag: Record<string, Rule>,
	kwRules: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
): { rule: Rule; diagnostics: ParseKindCollisionDiagnostic[] } {
	const candidates: UnaliasCandidate[] = [];
	collectUnaliasCandidates(rule, [], undefined, rulesBag, candidates, new RuleWalker(), new Set(), supertypeNames);
	if (candidates.length === 0) return { rule, diagnostics: [] };

	const byBucket = new Map<string, { slotName: string; targetName: string; bucket: UnaliasCandidate[] }>();
	for (const candidate of candidates) {
		const slotName = candidate.slotKey ?? candidate.targetName;
		const key = `${slotName} ${candidate.targetName}`;
		const entry = byBucket.get(key) ?? { slotName, targetName: candidate.targetName, bucket: [] };
		entry.bucket.push(candidate);
		byBucket.set(key, entry);
	}

	const toDrop = new Set<UnaliasCandidate>();
	const toRetarget = new Map<UnaliasCandidate, string>();
	const diagnostics: ParseKindCollisionDiagnostic[] = [];
	const claimedRetargetNames = new Set<string>();

	for (const { slotName, targetName, bucket } of byBucket.values()) {
		if (bucket.length < 2 || !bucket.some((c) => c.aliasSite)) continue;
		const signatures = clusterSignatures(bucket.map((c) => c.resolvedBody));
		const values: ParseKindCollisionValue<UnaliasCandidate>[] = bucket.map((candidate, i) => ({
			original: candidate,
			parseKind: targetName,
			storageKind: candidate.storageKind,
			structuralSignature: signatures[i]!
		}));
		let representativeSignature: string | undefined;
		const nativeIndex = bucket.findIndex((c) => c.storageKind !== undefined && c.storageKind === targetName);
		if (nativeIndex !== -1) {
			representativeSignature = signatures[nativeIndex];
		} else {
			const signatureCounts = new Map<string, number>();
			for (const signature of signatures) signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
			let representativeCount = 1;
			for (const [signature, count] of signatureCounts) {
				if (count > representativeCount) {
					representativeSignature = signature;
					representativeCount = count;
				}
			}
		}
		const resolution = diagnoseParseKindCollisions({ ownerKind: ruleName, slotName, values });
		for (const diagnostic of resolution.diagnostics) {
			let anyActed = false;
			for (const [index, candidate] of bucket.entries()) {
				if (!candidate.aliasSite || candidate.storageKind === undefined) continue;
				if (representativeSignature !== undefined && signatures[index] === representativeSignature) continue;
				const isHidden = candidate.storageKind.startsWith('_');
				if (!isHidden) {
					toDrop.add(candidate);
					anyActed = true;
					continue;
				}
				const strippedName = candidate.storageKind.replace(/^_+/, '');
				const collides =
					strippedName === '' ||
					claimedRetargetNames.has(strippedName) ||
					Object.hasOwn(rulesBag, strippedName) ||
					Object.hasOwn(kwRules, strippedName) ||
					Object.hasOwn(clauseGroupRules, strippedName);
				if (collides) {
					continue;
				}
				claimedRetargetNames.add(strippedName);
				toRetarget.set(candidate, strippedName);
				anyActed = true;
			}
			if (anyActed) {
				diagnostics.push({
					...diagnostic,
					severity: 'info',
					message: `${diagnostic.message} Found in the base grammar; automatically resolved by giving each colliding arm its own distinct alias.`,
					proposal: 'Already resolved by enrich() — no action needed.'
				});
			}
		}
	}

	if (toDrop.size === 0 && toRetarget.size === 0) return { rule, diagnostics: [] };

	let result = rule;
	for (const candidate of toDrop) {
		result = rewriteUnaliasAt(result, candidate.aliasSite!.path, candidate.aliasSite!.content);
	}
	for (const [candidate, strippedName] of toRetarget) {
		const retargeted = {
			type: 'ALIAS',
			content: candidate.aliasSite!.content,
			named: candidate.aliasSite!.named,
			value: strippedName
		} as unknown as Rule;
		result = rewriteUnaliasAt(result, candidate.aliasSite!.path, retargeted);
	}
	return { rule: result, diagnostics };
}

function clauseHoistSynthName(
	seqBody: Rule,
	parentKind: string,
	dedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>
): string | null {
	const key = ruleKey(seqBody as RuntimeRule);
	const existing = dedupeMap[key];
	if (existing !== undefined) {
		if (!(existing in clauseGroupRules)) {
			clauseGroupRules[existing] = seqBody;
		}
		return existing;
	}
	counter.opt += 1;
	const name = `_${parentKind}_optional${counter.opt}`;
	if (name in rulesBag) {
		process.stderr.write(
			`enrich: clause-hoist skipped for '${parentKind}' — rule '${name}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	dedupeMap[key] = name;
	clauseGroupRules[name] = seqBody;
	return name;
}

function collapseSingletonMintOrdinals(
	mergedRules: Record<string, Rule>,
	mintedRules: Record<string, Rule>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>
): void {
	const byParentFlavor = new Map<string, string[]>();
	for (const hidden of Object.keys(mintedRules)) {
		const m = /^_(.+)_(arm|group)(\d+)$/.exec(hidden);
		if (!m) continue;
		const key = `${m[1]}_${m[2]}`;
		const bucket = byParentFlavor.get(key);
		if (bucket) bucket.push(hidden);
		else byParentFlavor.set(key, [hidden]);
	}
	const renames = new Map<string, string>();
	for (const [bare, hiddens] of byParentFlavor) {
		if (hiddens.length !== 1) continue;
		const oldHidden = hiddens[0]!;
		const newHidden = `_${bare}`;
		if (newHidden in mergedRules || bare in mergedRules) continue;
		renames.set(oldHidden, newHidden);
		renames.set(oldHidden.replace(/^_/, ''), bare);
	}
	if (renames.size === 0) return;
	for (const [oldName, newName] of renames) {
		if (oldName.startsWith('_') && oldName in mergedRules) {
			mergedRules[newName] = mergedRules[oldName]!;
			delete mergedRules[oldName];
		}
		if (oldName.startsWith('_') && oldName in mintedRules) {
			mintedRules[newName] = mintedRules[oldName]!;
			delete mintedRules[oldName];
		}
		if (visibleGroupHiddenNames.delete(oldName)) visibleGroupHiddenNames.add(newName);
		const owner = clauseGroupOwners.get(oldName);
		if (owner !== undefined) {
			clauseGroupOwners.delete(oldName);
			clauseGroupOwners.set(newName, owner);
		}
	}
	const rewrite = (node: unknown): void => {
		if (Array.isArray(node)) {
			for (const m of node) rewrite(m);
			return;
		}
		if (node === null || typeof node !== 'object') return;
		const r = node as { type?: string; name?: string; value?: unknown } & Record<string, unknown>;
		if (typeof r.name === 'string' && renames.has(r.name)) r.name = renames.get(r.name)!;
		if (r.type === 'ALIAS' && typeof r.value === 'string' && renames.has(r.value)) r.value = renames.get(r.value)!;
		for (const v of Object.values(r)) rewrite(v);
	};
	for (const name of Object.keys(mergedRules)) rewrite(mergedRules[name]);
}
function visibleGroupSynthName(
	content: Rule,
	parentKind: string,
	groupDedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	ambientPrec?: Rule,
	enclosingFieldName?: string,
	flavor: 'group' | 'arm' = 'group'
): { visibleName: string; hiddenName: string } | null {
	if (process.env.SITTIR_DEBUG_LISTNAME) {
		const info = separatedListBodyInfo(content);
		process.stderr.write(
			`[listname] mint for parent='${parentKind}' list=${JSON.stringify(info)} counts=${
				info?.elementName ? separatedListNameCounts?.get(pluralizeFieldName(info.elementName)) : '-'
			}\n`
		);
	}
	const registeredBody = ambientPrec ? ({ ...ambientPrec, content } as Rule) : content;
	const key = ruleKey(registeredBody as RuntimeRule);
	const existing = groupDedupeMap[key];
	if (existing !== undefined) {
		const hiddenName = `_${existing}`;
		if (!(hiddenName in clauseGroupRules)) clauseGroupRules[hiddenName] = registeredBody;
		return { visibleName: existing, hiddenName };
	}
	const base = parentKind.replace(/^_+/, '');
	const register = (visibleName: string, body: Rule = registeredBody): { visibleName: string; hiddenName: string } => {
		const hiddenName = `_${visibleName}`;
		groupDedupeMap[key] = visibleName;
		clauseGroupRules[hiddenName] = body;
		return { visibleName, hiddenName };
	};
	const listInfo = separatedListNameCounts !== null ? separatedListBodyInfo(content) : null;
	if (listInfo?.flankCarrying) {
		const nameFree = (n: string) =>
			!(n in rulesBag) && !(`_${n}` in rulesBag) && !(n in clauseGroupRules) && !(`_${n}` in clauseGroupRules);
		const bare = listInfo.elementName !== null ? pluralizeFieldName(listInfo.elementName) : null;
		const candidates: string[] = [];
		if (bare !== null && separatedListNameCounts!.get(bare) === 1) candidates.push(bare);
		if (bare !== null && base !== bare && !base.endsWith(`_${bare}`)) candidates.push(`${base}_${bare}`);
		if (bare !== `${base}_elements`) candidates.push(base.endsWith('_elements') ? base : `${base}_elements`);
		const flatBody = { ...content, members: listInfo.flatMembers } as Rule;
		const registeredFlat = ambientPrec ? ({ ...ambientPrec, content: flatBody } as Rule) : flatBody;
		for (const candidate of candidates) {
			if (!nameFree(candidate)) continue;
			const skipped =
				separatedListEnrichSkip !== null &&
				(separatedListEnrichSkip.has(candidate) || separatedListEnrichSkip.has(`_${candidate}`));
			return register(candidate, skipped ? registeredBody : registeredFlat);
		}
	}
	if (enclosingFieldName !== undefined) {
		const visibleName = `${base}_${enclosingFieldName}`;
		if (!(visibleName in rulesBag) && !(`_${visibleName}` in rulesBag) && !(`_${visibleName}` in clauseGroupRules)) {
			return register(visibleName);
		}
	}
	const ordinal = flavor === 'arm' ? ++counter.arm : ++counter.grp;
	const visibleName = `${base}_${flavor}${ordinal}`;
	const hiddenName = `_${visibleName}`;
	if (visibleName in rulesBag || hiddenName in rulesBag) {
		process.stderr.write(
			`enrich: visible-group skipped for '${parentKind}' — rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	return register(visibleName);
}

function promoteExistingHiddenRuleName(
	existingHiddenName: string,
	parentKind: string,
	groupDedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	flavor: 'group' | 'arm' = 'group'
): { visibleName: string } | null {
	const existing = groupDedupeMap[existingHiddenName];
	if (existing !== undefined) return { visibleName: existing };
	const natural = existingHiddenName.replace(/^_+/, '');
	if (natural.length > 0 && !(natural in rulesBag)) {
		groupDedupeMap[existingHiddenName] = natural;
		return { visibleName: natural };
	}
	const ordinal = flavor === 'arm' ? ++counter.arm : ++counter.grp;
	const visibleName = `${parentKind.replace(/^_+/, '')}_${flavor}${ordinal}`;
	if (visibleName in rulesBag) {
		process.stderr.write(
			`enrich: visible-group promotion skipped for '${parentKind}' — rule '${visibleName}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	groupDedupeMap[existingHiddenName] = visibleName;
	return { visibleName };
}

function promotePermutationArmKeywords(
	choiceRule: Rule,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule {
	const members = (choiceRule as unknown as { members: Rule[] }).members;
	let changed = false;
	const newMembers = members.map((arm) => {
		if (!isSeqType((arm as { type?: string }).type as string)) return arm;
		const seqMembers = (arm as unknown as { members: Rule[] }).members;
		let armChanged = false;
		const newSeq = seqMembers.map((m) => {
			const norm = normalizeMember(m);
			if (!isStringType(norm.type) || typeof norm.value !== 'string') return m;
			if (!matchesWordShape(norm.value, wordMatcher)) return m;
			const fieldName = `${norm.value}_marker`;
			const symbolRef = registerKwRule(m, fieldName, kwRules, rulesBag);
			if (symbolRef === null) return m;
			armChanged = true;
			return makeField(fieldName, symbolRef);
		});
		if (!armChanged) return arm;
		changed = true;
		return { ...arm, members: newSeq } as Rule;
	});
	return changed ? ({ ...choiceRule, members: newMembers } as Rule) : choiceRule;
}

function mintStructuredChoiceArm(
	arm: Rule,
	parentKind: string,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	counter: ClauseHoistCounter,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>,
	collidingLeadingNames: ReadonlySet<string>,
	ambientPrec?: Rule,
	enclosingFieldName?: string
): Rule | null {
	const t = (arm as { type?: string }).type;
	if (typeof t !== 'string') return null;
	if (armStartsWithSymbol(arm, collidingLeadingNames, rulesBag)) return null;

	if (isPrecWrapper(arm as { type: string })) {
		const content = (arm as { content?: Rule }).content;
		if (!content) return null;
		const minted = mintStructuredChoiceArm(
			content,
			parentKind,
			rulesBag,
			clauseGroupRules,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			collidingLeadingNames,
			arm,
			enclosingFieldName
		);
		if (!minted) return null;
		return { ...arm, content: minted } as Rule;
	}

	if (isSymbolType(t)) {
		const name = (arm as { name?: string }).name;
		if (typeof name !== 'string' || !name.startsWith('_')) return null;
		if (counter.supertypeNames?.has(name)) return null;
		if (Object.hasOwn(clauseGroupRules, name)) return null;
		const body = rulesBag[name];
		if (!body || ruleMatchesEmpty(body) || isInlineSafe(body, rulesBag)) return null;
		if (isSupertypeLike(body)) return null;
		const promoted = promoteExistingHiddenRuleName(name, parentKind, groupDedupeMap, counter, rulesBag, 'arm');
		if (!promoted) return null;
		visibleGroupHiddenNames.add(name);
		if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
		return makeVisibleGroupAlias(arm, promoted.visibleName);
	}

	if (isSeqType(t) || isChoiceType(t)) {
		if (ruleMatchesEmpty(arm) || isInlineSafe(arm, rulesBag)) return null;
		if (isSupertypeLike(arm)) return null;
		if (isPermutationChoice(arm, rulesBag, hoistKwRules ?? undefined, hoistWordMatcher)) return null;
		const names = visibleGroupSynthName(
			arm,
			parentKind,
			groupDedupeMap,
			counter,
			rulesBag,
			clauseGroupRules,
			ambientPrec,
			enclosingFieldName,
			'arm'
		);
		if (!names) return null;
		visibleGroupHiddenNames.add(names.hiddenName);
		if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
		const symbolRef = makeGroupLiftSymbol(arm, names.hiddenName);
		return makeVisibleGroupAlias(symbolRef, names.visibleName);
	}

	return null;
}

function makeGroupLiftSymbol(_referenceRule: Rule, name: string): Rule {
	const symbol = nativeRuleFn<(n: string) => Rule>('symbol', 'sym');
	const base = symbol(name);
	return {
		...base,
		metadata: makeRuleMetadata({ author: 'enrich', symbolSource: 'group-lift' })
	} as unknown as Rule;
}

function makeVisibleGroupAlias(symbolRef: Rule, name: string): Rule {
	const aliasFn = nativeRuleFn<(r: unknown, v: unknown) => Rule>('alias');
	const symbol = nativeRuleFn<(n: string) => Rule>('symbol', 'sym');
	return { ...aliasFn(symbolRef, symbol(name)), metadata: makeRuleMetadata({ author: 'enrich' }) };
}

function synthesizeFieldEnumRules(rules: Record<string, Rule>): void {
	const fieldOccurrences = collectFieldEnumOccurrences(rules);
	const conflictingSites = collectConflictingFieldEnumSites(fieldOccurrences);
	const memberKeyToCanonicalName = buildCanonicalEnumNames(fieldOccurrences, rules);

	const rewrites = new Map<string, Rule>();
	const newRules = new Map<string, Rule>();
	const sweep: FieldEnumSweepState = { rules, newRules, memberKeyToCanonicalName, conflictingSites };
	for (const [parentKind, rule] of Object.entries(rules)) {
		const rewritten = rewriteFieldEnums(rule, parentKind, sweep);
		if (rewritten !== rule) rewrites.set(parentKind, rewritten);
	}

	for (const [kind, newRule] of rewrites) {
		rules[kind] = newRule;
	}
	for (const [kindName, enumRule] of newRules) {
		if (!rules[kindName]) {
			rules[kindName] = enumRule;
		}
	}
}

interface FieldEnumOccurrence {
	readonly parentKind: string;
	readonly fieldName: string;
	readonly memberKey: string;
	readonly members: StringRule[];
}

function collectFieldEnumOccurrences(rules: Record<string, Rule>): FieldEnumOccurrence[] {
	const occurrences: FieldEnumOccurrence[] = [];
	for (const [parentKind, rule] of Object.entries(rules)) {
		walkFieldEnums(rule, rules, parentKind, occurrences);
	}
	return occurrences;
}

function walkFieldEnums(rule: Rule, rules: Record<string, Rule>, parentKind: string, out: FieldEnumOccurrence[]): void {
	switch (rule.type as string) {
		case 'FIELD': {
			const fieldRule = rule as unknown as { name: string; content: Rule };
			const enumContent = peelRepeatWrapper(fieldRule.content);
			const members = resolveToEnumMembers(enumContent, rules);
			if (members !== null && members.length > 0) {
				const memberKey = buildEnumMemberKey(members);
				out.push({ parentKind, fieldName: fieldRule.name, memberKey, members });
			}
			walkFieldEnums(fieldRule.content, rules, parentKind, out);
			return;
		}
		case 'SEQ':
		case 'CHOICE':
			for (const m of (rule as unknown as { members: Rule[] }).members) walkFieldEnums(m, rules, parentKind, out);
			return;
		case 'OPTIONAL':
		case 'REPEAT':
		case 'REPEAT1':
		case 'VARIANT':
		case 'GROUP':
		case 'TOKEN':
			walkFieldEnums((rule as unknown as { content: Rule }).content, rules, parentKind, out);
			return;
		default:
			return;
	}
}

function buildCanonicalEnumNames(occurrences: FieldEnumOccurrence[], rules: Record<string, Rule>): Map<string, string> {
	const byKey = new Map<string, FieldEnumOccurrence[]>();
	for (const occ of occurrences) {
		let group = byKey.get(occ.memberKey);
		if (!group) {
			group = [];
			byKey.set(occ.memberKey, group);
		}
		group.push(occ);
	}

	const existingNameCandidatesByMemberKey = new Map<string, string[]>();
	for (const [name, rule] of Object.entries(rules)) {
		const resolved = resolveToEnumMembersOneLevelDeep(rule);
		if (resolved === null) continue;
		const key = buildEnumMemberKey(resolved);
		let candidates = existingNameCandidatesByMemberKey.get(key);
		if (!candidates) {
			candidates = [];
			existingNameCandidatesByMemberKey.set(key, candidates);
		}
		candidates.push(name);
	}
	const existingRuleNameByMemberKey = new Map<string, string>();
	for (const [key, candidates] of existingNameCandidatesByMemberKey) {
		existingRuleNameByMemberKey.set(key, candidates.sort()[0]!);
	}

	const result = new Map<string, string>();
	const groups = Array.from(byKey.entries()).map(([memberKey, group], index) => {
		const first = group[0]!;
		const candidate = deriveCandidateName(group, existingRuleNameByMemberKey, first);
		return { memberKey, group, first, index, ...candidate };
	});

	groups.sort((a, b) => a.priority - b.priority || a.index - b.index);

	const claimedNames = new Set<string>();
	for (const group of groups) {
		const chosenName = claimUniqueEnumName(group.name, rules, group.memberKey, claimedNames);
		claimedNames.add(chosenName);
		result.set(group.memberKey, chosenName);
	}

	return result;
}

function fallbackName(occ: FieldEnumOccurrence): string {
	return `_${occ.parentKind}_${occ.fieldName}`;
}

function fieldEnumSiteKey(parentKind: string, fieldName: string): string {
	return `${parentKind} ${fieldName}`;
}

function collectConflictingFieldEnumSites(occurrences: readonly FieldEnumOccurrence[]): ReadonlySet<string> {
	const memberKeysBySite = new Map<string, Set<string>>();
	for (const occ of occurrences) {
		const siteKey = fieldEnumSiteKey(occ.parentKind, occ.fieldName);
		let keys = memberKeysBySite.get(siteKey);
		if (!keys) {
			keys = new Set<string>();
			memberKeysBySite.set(siteKey, keys);
		}
		keys.add(occ.memberKey);
	}
	const conflicting = new Set<string>();
	for (const [siteKey, keys] of memberKeysBySite) {
		if (keys.size > 1) conflicting.add(siteKey);
	}
	return conflicting;
}

function claimUniqueEnumName(
	baseName: string,
	rules: Record<string, Rule>,
	memberKey: string,
	claimedNames: ReadonlySet<string>
): string {
	if (!claimedNames.has(baseName) && canReuseExistingEnumName(baseName, rules, memberKey)) {
		return baseName;
	}
	const slug = enumMemberKeySlug(memberKey);
	let candidate = `${baseName}__${slug}`;
	let attempt = 2;
	while (
		claimedNames.has(candidate) ||
		(!canReuseExistingEnumName(candidate, rules, memberKey) && Object.prototype.hasOwnProperty.call(rules, candidate))
	) {
		candidate = `${baseName}__${slug}_${attempt}`;
		attempt++;
	}
	return candidate;
}

function canReuseExistingEnumName(name: string, rules: Record<string, Rule>, memberKey: string): boolean {
	const existing = rules[name];
	if (existing === undefined) return true;
	const members = resolveToEnumMembersOneLevelDeep(existing);
	if (members === null) return false;
	return buildEnumMemberKey(members) === memberKey;
}

function buildEnumMemberKey(members: readonly StringRule[]): string {
	return [...members]
		.map((m) => m.value)
		.sort()
		.join(',');
}

function enumMemberKeySlug(memberKey: string): string {
	return memberKey
		.split(',')
		.map((member) => {
			const encoded = Array.from(member)
				.map((ch) => (/[A-Za-z0-9]/.test(ch) ? ch.toLowerCase() : `x${ch.codePointAt(0)!.toString(16)}`))
				.join('');
			return encoded.length > 0 ? encoded : 'empty';
		})
		.join('__');
}

function deriveCandidateName(
	group: FieldEnumOccurrence[],
	existingRuleNameByMemberKey: ReadonlyMap<string, string>,
	first: FieldEnumOccurrence
): { name: string; priority: number } {
	const existingName = existingRuleNameByMemberKey.get(first.memberKey);
	if (existingName !== undefined) {
		if (existingName !== first.fieldName && !process.env.SITTIR_QUIET) {
			process.stderr.write(
				`enrich: field '${first.fieldName}' on '${first.parentKind}' reuses existing rule '${existingName}' (identical member set) instead of minting a new one\n`
			);
		}
		return { name: existingName, priority: 0 };
	}

	const allSameFieldName = group.every((o) => o.fieldName === first.fieldName);
	if (allSameFieldName) {
		const distinctParents = new Set(group.map((o) => o.parentKind)).size;
		if (distinctParents >= 2) {
			return { name: `_${first.fieldName}`, priority: 2 };
		}
	}

	return { name: fallbackName(first), priority: 3 };
}

interface FieldEnumSweepState {
	readonly rules: Record<string, Rule>;
	readonly newRules: Map<string, Rule>;
	readonly memberKeyToCanonicalName: Map<string, string>;
	readonly conflictingSites: ReadonlySet<string>;
}

function rewriteFieldEnums(rule: Rule, parentKind: string, sweep: FieldEnumSweepState): Rule {
	const { rules, newRules, memberKeyToCanonicalName, conflictingSites } = sweep;
	const recurse = (r: Rule): Rule => rewriteFieldEnums(r, parentKind, sweep);

	switch (rule.type as string) {
		case 'FIELD': {
			const fieldRule = rule as unknown as { name: string; content: Rule; metadata?: unknown };
			const synthesized = conflictingSites.has(fieldEnumSiteKey(parentKind, fieldRule.name))
				? null
				: tryExtractFieldEnum(fieldRule.content, rules, memberKeyToCanonicalName);
			if (synthesized !== null) {
				const { enumKindName, synthesizedRule, replacementContent } = synthesized;
				if (!newRules.has(enumKindName)) {
					newRules.set(enumKindName, synthesizedRule);
				}
				return {
					type: 'FIELD',
					name: fieldRule.name,
					content: replacementContent,
					metadata: fieldRule.metadata
				} as unknown as Rule;
			}
			const newContent = recurse(fieldRule.content);
			if (newContent === fieldRule.content) return rule;
			return { ...rule, content: newContent } as unknown as Rule;
		}
		case 'SEQ':
		case 'CHOICE': {
			const members = (rule as unknown as { members: Rule[] }).members;
			const newMembers = members.map(recurse);
			if (newMembers.every((m, i) => m === members[i])) return rule;
			return { ...rule, members: newMembers } as unknown as Rule;
		}
		case 'OPTIONAL':
		case 'REPEAT':
		case 'REPEAT1':
		case 'VARIANT':
		case 'GROUP':
		case 'TOKEN': {
			const content = (rule as unknown as { content: Rule }).content;
			const newContent = recurse(content);
			if (newContent === content) return rule;
			return { ...rule, content: newContent } as unknown as Rule;
		}
		default:
			return rule;
	}
}

function tryExtractFieldEnum(
	content: Rule,
	rules: Record<string, Rule>,
	memberKeyToCanonicalName: Map<string, string>
): { enumKindName: string; synthesizedRule: Rule; replacementContent: Rule } | null {
	const contentType = content.type as string;
	const repeatWrapperType = contentType === 'REPEAT' || contentType === 'REPEAT1' ? contentType : null;
	const innerContent = repeatWrapperType !== null ? (content as unknown as { content: Rule }).content : content;

	const members = resolveToEnumMembers(innerContent, rules);
	if (members === null || members.length === 0) return null;

	const memberKey = buildEnumMemberKey(members);
	const enumKindName = memberKeyToCanonicalName.get(memberKey);
	if (enumKindName === undefined) return null;

	const synthesizedRule = {
		type: 'PREC',
		content: normalizeEnumMembers(members, { author: 'enrich' }),
		value: -1
	} as unknown as Rule;

	if (innerContent.type === 'SYMBOL' && (innerContent as unknown as { name: string }).name === enumKindName) {
		return null;
	}

	const symRule = makeSymbol(enumKindName);
	const replacementContent: Rule =
		repeatWrapperType === null ? symRule : ({ ...(content as object), content: symRule } as unknown as Rule);

	return { enumKindName, synthesizedRule, replacementContent };
}

function peelRepeatWrapper(rule: Rule): Rule {
	const ruleType = rule.type as string;
	if (ruleType === 'REPEAT' || ruleType === 'REPEAT1') return (rule as unknown as { content: Rule }).content;
	return rule;
}

function resolveToEnumMembers(rule: Rule, rules: Record<string, Rule>): StringRule[] | null {
	switch (rule.type as string) {
		case 'CHOICE': {
			return isEnumChoiceRule(rule as AnyRule)
				? ((rule as unknown as { members: Rule[] }).members as unknown as StringRule[])
				: null;
		}
		case 'SYMBOL': {
			const name = (rule as unknown as { name: string }).name;
			const target = rules[name];
			if (target === undefined) return null;
			return resolveToEnumMembersOneLevelDeep(target);
		}
		default:
			return null;
	}
}

function resolveToEnumMembersOneLevelDeep(target: Rule): StringRule[] | null {
	const unwrapped = isPrecWrapper(target as { type: string })
		? (target as unknown as { content: Rule }).content
		: target;
	switch (unwrapped.type as string) {
		case 'CHOICE':
			return isEnumChoiceRule(unwrapped as AnyRule)
				? ((unwrapped as unknown as { members: Rule[] }).members as unknown as StringRule[])
				: null;
		default:
			return null;
	}
}
