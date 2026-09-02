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
} from '../types/rule-types.ts'; // @rule-type-consts
import type {
	AliasRule,
	Rule,
	SymbolRef,
	FieldRule,
	SupertypeRule,
	EnumRule,
	GroupRule,
	SeqRule,
	ChoiceRule,
	Repeat1Rule,
	SymbolRule,
	StringRule,
	RepeatRule
} from '../types/rule.ts';
import { assertNever } from '../polymorph-variant.ts';
import {
	isSeq,
	isChoice,
	literalTextOf,
	sym,
	replaceAtPath,
	isSymbol,
	isRepeat1,
	isRepeat,
	isOptional,
	isField
} from '../types/rule.ts';
import { normalizeEnumMembers, makeRuleMetadata } from '../dsl/rule-metadata.ts';
import {
	collectGeneratedKindEntries,
	findEntryForKindName,
	findEntryForLiteralText,
	type GeneratedIdTables,
	type GeneratedKindEntry
} from './generated-metadata.ts';
import type {
	RawGrammar,
	LinkedGrammar,
	ExternalRole,
	IncludeFilter,
	DerivationLog,
	RepeatedShapeEntry,
	RefineForm,
	LinkedRefineForm,
	NarrowedField
} from './types.ts';
import { hasAnyField } from '../dsl/rule-transforms.ts';
import { loadGrammarJsonInlineList } from './inline-sets.ts';

import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import { compileWordMatcher, matchesWordShape } from '../util/word-matcher.ts';
import { rootRuleName } from '../util/reachable-rules.ts';
import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { deriveStructuralVariantChildren, isAliasMintedRef, prefixNamedSuffix } from './variant-structural.ts';
import {
	deriveComplexAliasTargetHidden,
	isEnumChoiceRule,
	isHiddenKind,
	isKindChoice,
	rulesEqual,
	separatorOf
} from '../dsl/rule-patterns.ts';
import { parsePath, type PathSegment } from '../dsl/transform/transform-path.ts';
import { DiagnosticSink, type CompilerDiagnostic } from '../types/diagnostics.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import { withId, rebaseRuleIds, withKindFacts } from '../dsl/rule-attrs.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

export interface LinkOptions {
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
	readonly diagnostics?: DiagnosticSink;
}

export class LinkCtx extends BaseCtx<'evaluate'> {
	readonly supertypes: ReadonlySet<string>;
	readonly externalRoles: Map<string, ExternalRole>;
	readonly inline?: readonly string[];
	readonly derivations: DerivationLog;
	readonly applyPromotedRules: boolean;
	readonly hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>;
	readonly kindEntries: readonly GeneratedKindEntry[];

	constructor(
		init: BaseCtxInit<'evaluate'> & {
			supertypes: ReadonlySet<string>;
			externalRoles: Map<string, ExternalRole>;
			inline?: readonly string[];
			derivations: DerivationLog;
			applyPromotedRules: boolean;
			hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>;
			kindEntries?: readonly GeneratedKindEntry[];
		}
	) {
		super(init);
		this.supertypes = init.supertypes;
		this.externalRoles = init.externalRoles;
		this.inline = init.inline;
		this.derivations = init.derivations;
		this.applyPromotedRules = init.applyPromotedRules;
		this.hiddenChoicesWithNamedAliasMembers = init.hiddenChoicesWithNamedAliasMembers;
		this.kindEntries = init.kindEntries ?? [];
	}

	get rules(): Record<string, Rule<'evaluate'>> {
		return this.grammar.rules;
	}
}

export function link(raw: RawGrammar, ctx?: LinkOptions): LinkedGrammar {
	const include = ctx?.include;
	const supertypes = new Set(raw.supertypes);
	const factoryInline = new Set(raw.factoryInline);
	const externalRoles = buildExternalRolesMap(raw.externalRoles);
	const references = [...raw.references];
	const kindEntries = collectGeneratedKindEntries(ctx?.generatedIdTables);

	const includeRules = new Set(include?.rules ?? (['promoted'] as const));
	const applyPromotedRules = includeRules.has('promoted');

	const derivations: DerivationLog = {
		inferredFields: [],
		promotedRules: [],
		repeatedShapes: []
	};

	const hiddenChoicesWithNamedAliasMembers = collectHiddenChoicesWithNamedAliasMembers(raw.rules);
	const wordMatcherRegex = compileWordMatcher(raw.word, raw.rules);

	const linkCtx = new LinkCtx({
		grammar: raw,
		diagnostics: ctx?.diagnostics ?? new DiagnosticSink(),
		wordMatcher: (s) => matchesWordShape(s, wordMatcherRegex),
		supertypes,
		externalRoles,
		inline: raw.inline,
		derivations,
		applyPromotedRules,
		hiddenChoicesWithNamedAliasMembers,
		kindEntries
	});
	const rules: Record<string, Rule<'link'>> = {};
	for (const [name, rule] of Object.entries(raw.rules)) {
		rules[name] = resolveRule(rule as Rule<'link'>, linkCtx, name);
	}
	pruneUnreachableRules(rules, linkCtx);
	const rawRules: Record<string, Rule<'evaluate'>> = Object.fromEntries(
		Object.entries(raw.rules).filter(([name]) => name in rules)
	);
	unhideAliasedTargets(rules);
	inlineReferences(rules, linkCtx);

	for (const name of Object.keys(rules)) {
		rules[name] = liftSeparators(rules[name]!, linkCtx);
	}

	stripResolvedRoleRules(rules);
	createSyntheticExternalRules(rules, raw.externals);
	if (raw.visibleInlineNames !== undefined && raw.visibleInlineNames.length > 0) {
		linkCtx.diagnostics.warn({
			code: 'inline-array-visible-name',
			message: `${raw.visibleInlineNames.length} inline: entry(ies) name a visible kind (no leading '_'); the parser inlines them, so they never surface as nodes`,
			canProceed: true,
			details: { kinds: [...raw.visibleInlineNames].sort() }
		});
	}

	const aliasedHiddenKinds = collectAliasedHiddenKinds(rawRules);

	const renderAs = (raw.renderAs ?? {}) as Record<string, Rule<'link'>>;
	if (Object.keys(renderAs).length > 0) {
		const stamped = stampStaticRenderAs(rules, renderAs);
		for (const key of Object.keys(rules)) {
			if (!(key in stamped)) delete rules[key];
		}
		Object.assign(rules, stamped);
	}

	const groupsConfig = raw.groups ?? {};
	if (Object.keys(groupsConfig).length > 0) {
		const lifted = applyGroupOverrides({
			rules,
			groups: groupsConfig,
			polymorphs: raw.polymorphsConfig ?? {}
		});
		for (const key of Object.keys(rules)) {
			if (!(key in lifted.rules)) delete rules[key];
		}
		Object.assign(rules, lifted.rules);
		for (const synthKind of lifted.synthesizedKinds) {
			const body = rules[synthKind];
			if (body && body.type !== GROUP) {
				rules[synthKind] = {
					type: GROUP,
					name: synthKind,
					content: liftSeparators(body, linkCtx)
				} satisfies GroupRule<'link'>;
			}
		}
	}

	const { parentAliasedKinds, visibleAliasTargets } = collectAliasedByParents(rawRules);

	classifyAndLogHiddenRules(rules, linkCtx);

	markSupertypeRefsNonInline(rules);

	applyOverridePolymorphs(rules, derivations);

	collectRepeatedShapes(rules, derivations.repeatedShapes);
	const complexAliasTargetHidden = deriveComplexAliasTargetHidden(rawRules);
	const topLevelAliasBodies = collectTopLevelAliasBodies(
		rules,
		linkCtx,
		complexAliasTargetHidden.size > 0 ? complexAliasTargetHidden : undefined
	);
	const stampMisses: KindIdStampMisses = { symbols: new Set(), literals: new Set(), aliasTargets: new Set() };
	const aliasBodies = new Map<string, AliasRule<'link'>>();
	for (const [name, rule] of Object.entries(rules)) {
		if (!name.startsWith('_')) continue;
		const body = topLevelAliasOf(rule);
		if (body !== undefined) aliasBodies.set(name, body);
	}
	const stampCtx: StampKindIdsCtx = { kindEntries, misses: stampMisses, aliasBodies };
	canonicalizeCatalogLiteralRefs(rules, stampCtx);
	canonicalizeCatalogLiteralRefsInMap(topLevelAliasBodies, stampCtx);
	pruneInlinedAliasBodies(rules, { ...stampCtx, topLevelAliasBodies });
	const terminalAliasWireIds = collectTerminalAliasWireIds(
		[rules, raw.rules as unknown as Record<string, Rule<'link'>>],
		stampCtx
	);
	const grammarJsonInline = new Set(loadGrammarJsonInlineList(raw.name) ?? raw.inline);
	const rootName = rootRuleName(raw.rules);
	const reachableFromRoot = rootName ? computeReachableFromRoot({ rules, rootName }) : new Set<string>();
	reportKindIdStampMisses(stampMisses, kindEntries, ctx?.diagnostics, grammarJsonInline, reachableFromRoot);

	stampLinkMintedVisibility(rules, linkCtx);
	const variantChildren = deriveStructuralVariantChildren(rules);
	const refineForms = new Map<string, readonly LinkedRefineForm[]>();
	for (const [kind, forms] of raw.refineForms ?? []) {
		const rule = rules[kind];
		if (!rule) {
			throw new Error(
				`refine(${kind}): no rule named '${kind}' found at link time — refine() target must be a top-level rule`
			);
		}
		validateRefineForms(kind, rule, forms, rules);
		refineForms.set(
			kind,
			forms.map((form) => ({ ...form, narrowedFields: narrowedFieldLiteralsForForm(rule, form, rules) }))
		);
	}

	return {
		name: raw.name,
		rules,
		supertypes,
		factoryInline,
		externalRoles,
		externals: raw.externals,
		extras: raw.extras,
		word: raw.word,
		wordMatcher: wordMatcherRegex,
		references,
		derivations,
		aliasedHiddenKinds,
		topLevelAliasBodies,
		terminalAliasWireIds: terminalAliasWireIds.size > 0 ? terminalAliasWireIds : undefined,
		refineForms: refineForms.size > 0 ? refineForms : undefined,
		parentAliasedKinds,
		visibleAliasTargets: visibleAliasTargets.size > 0 ? visibleAliasTargets : undefined,
		variantChildren: variantChildren.size > 0 ? variantChildren : undefined
	};
}

function buildExternalRolesMap(rawExternalRoles: Map<string, ExternalRole> | undefined): Map<string, ExternalRole> {
	return rawExternalRoles ? new Map<string, ExternalRole>(rawExternalRoles) : new Map<string, ExternalRole>();
}

function stripResolvedRoleRules(rules: Record<string, Rule<'link'>>): void {
	for (const name of Object.keys(rules)) {
		const r = rules[name]!;
		if (r.type === INDENT || r.type === DEDENT || r.type === NEWLINE) {
			delete rules[name];
		}
	}
}

function createSyntheticExternalRules(rules: Record<string, Rule<'link'>>, externals: readonly string[]): void {
	for (const ext of externals) {
		if (!rules[ext]) {
			rules[ext] = { type: TOKEN, content: { type: PATTERN, value: '' }, immediate: false };
		}
	}
}

export interface KindIdStampMisses {
	readonly symbols: Set<string>;
	readonly literals: Set<string>;
	readonly aliasTargets: Set<string>;
}

export interface StampKindIdsCtx {
	readonly kindEntries: readonly GeneratedKindEntry[];
	readonly misses: KindIdStampMisses;
	readonly aliasBodies?: ReadonlyMap<string, AliasRule<'link'>>;
	readonly topLevelAliasBodies?: ReadonlyMap<string, Rule<'link'>>;
}

function canonicalizeCatalogLiteralRefs(rules: Record<string, Rule<'link'>>, ctx: StampKindIdsCtx): void {
	for (const [name, rule] of Object.entries(rules)) {
		rules[name] = canonicalizeRuleLiterals(rule, ctx.kindEntries, false, ctx.misses, true, ctx.aliasBodies);
	}
}

function canonicalizeCatalogLiteralRefsInMap(rules: Map<string, Rule<'link'>>, ctx: StampKindIdsCtx): void {
	for (const [name, rule] of rules.entries()) {
		rules.set(name, canonicalizeRuleLiterals(rule, ctx.kindEntries, false, ctx.misses, true, ctx.aliasBodies));
	}
}

function stampAliasTargetId(rule: SymbolRule<'link'>, ctx: StampKindIdsCtx): SymbolRule<'link'> {
	if (rule.aliasedTo === undefined || rule.aliasedToId !== undefined) return rule;
	const targetEntry = findEntryForKindName(ctx.kindEntries, rule.aliasedTo);
	if (targetEntry === undefined || targetEntry.anon === true) {
		ctx.misses.aliasTargets.add(rule.aliasedTo);
		return rule;
	}
	return { ...rule, aliasedToId: targetEntry.parseId ?? targetEntry.id };
}

function stampSymbolRefKindIds(rule: SymbolRule<'link'>, ctx: StampKindIdsCtx): SymbolRule<'link'> {
	const { kindEntries, misses } = ctx;
	const stamped = stampAliasTargetId(rule, ctx);
	if (stamped.kindId !== undefined) return stamped;
	if (stamped.literal !== undefined) {
		const entry = findEntryForLiteralText(kindEntries, stamped.literal);
		if (entry === undefined) {
			misses.literals.add(stamped.literal);
			return stamped;
		}
		return { ...stamped, kindId: entry.parseId ?? entry.id };
	}
	const nameEntry = findEntryForKindName(kindEntries, stamped.name);
	if (nameEntry === undefined) {
		misses.symbols.add(stamped.name);
		return stamped;
	}
	return { ...stamped, kindId: nameEntry.id };
}

export function canonicalizeRuleLiterals(
	rule: Rule<'link'>,
	kindEntries: readonly GeneratedKindEntry[],
	allowLiteralRewrite: boolean,
	misses: KindIdStampMisses,
	stampable = true,
	aliasBodies?: ReadonlyMap<string, AliasRule<'link'>>
): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map((member) =>
					canonicalizeRuleLiterals(member, kindEntries, false, misses, stampable, aliasBodies)
				)
			};
		case CHOICE:
			return {
				...rule,
				members: rule.members.map((member) =>
					canonicalizeRuleLiterals(member, kindEntries, allowLiteralRewrite, misses, stampable, aliasBodies)
				)
			};
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
			return {
				...rule,
				content: canonicalizeRuleLiterals(
					rule.content,
					kindEntries,
					allowLiteralRewrite,
					misses,
					stampable,
					aliasBodies
				)
			};
		case TOKEN:
			return {
				...rule,
				content: canonicalizeRuleLiterals(rule.content, kindEntries, allowLiteralRewrite, misses, false, aliasBodies)
			};
		case FIELD:
			return {
				...rule,
				content: canonicalizeRuleLiterals(rule.content, kindEntries, true, misses, stampable, aliasBodies)
			};
		case ALIAS: {
			const content = canonicalizeRuleLiterals(
				rule.content,
				kindEntries,
				allowLiteralRewrite,
				misses,
				stampable,
				aliasBodies
			);
			if (!stampable || kindEntries.length === 0 || !rule.named || rule.kindId !== undefined) {
				return { ...rule, content };
			}
			const entry = findEntryForKindName(kindEntries, rule.value);
			if (entry === undefined || entry.anon === true) {
				misses.aliasTargets.add(rule.value);
				return { ...rule, content };
			}
			return { ...rule, content, kindId: entry.parseId ?? entry.id };
		}
		case SYMBOL:
			return !stampable || kindEntries.length === 0
				? rule
				: stampSymbolRefKindIds(rule, { kindEntries, misses, aliasBodies });
		case SUPERTYPE:
			return !stampable || kindEntries.length === 0
				? rule
				: {
						...rule,
						subtypes: rule.subtypes.map((s) => stampSymbolRefKindIds(s, { kindEntries, misses, aliasBodies }))
					};
		case STRING: {
			if (allowLiteralRewrite) {
				const entry = findEntryForLiteralText(kindEntries, rule.value);
				if (entry) {
					return {
						type: SYMBOL,
						name: entry.kind,
						literal: rule.value,
						inline: isHiddenKind(entry.kind),
						kindId: entry.parseId ?? entry.id,
						metadata: makeRuleMetadata({ symbolSource: 'link' })
					};
				}
			}
			if (!stampable || kindEntries.length === 0) return rule;
			const literalEntry = findEntryForLiteralText(kindEntries, rule.value);
			if (literalEntry === undefined) {
				misses.literals.add(rule.value);
				return rule;
			}
			return { ...rule, resolvedKindId: literalEntry.id };
		}
		case PATTERN: {
			if (!stampable || kindEntries.length === 0) return rule;
			const patternEntry = findEntryForLiteralText(kindEntries, rule.value);
			return patternEntry === undefined ? rule : { ...rule, resolvedKindId: patternEntry.id };
		}
		default:
			return rule;
	}
}

export function reportKindIdStampMisses(
	stampMisses: KindIdStampMisses,
	kindEntries: readonly GeneratedKindEntry[],
	diagnostics: DiagnosticSink | undefined,
	inlineKinds: ReadonlySet<string>,
	reachableFromRoot: ReadonlySet<string>
): void {
	if (kindEntries.length === 0 || !diagnostics) return;
	if (stampMisses.symbols.size > 0) {
		diagnostics.warn({
			code: 'kindid-unstamped-symbols',
			message: `${stampMisses.symbols.size} referenced kind(s) resolved no parser kindId`,
			canProceed: true,
			details: { kinds: [...stampMisses.symbols].sort() }
		});
	}
	if (stampMisses.literals.size > 0) {
		diagnostics.warn({
			code: 'kindid-unstamped-literals',
			message: `${stampMisses.literals.size} literal(s) resolved no parser kindId`,
			canProceed: true,
			details: { texts: [...stampMisses.literals].sort() }
		});
	}
	if (stampMisses.aliasTargets.size > 0) {
		diagnostics.warn({
			code: 'alias-target-unminted',
			message: `${stampMisses.aliasTargets.size} alias target(s) resolved no named parser kindId — the parser never mints the aliased node`,
			canProceed: true,
			details: { kinds: [...stampMisses.aliasTargets].sort() }
		});
	}
	reportVaporizedKinds(stampMisses, inlineKinds, reachableFromRoot, diagnostics);
}

function computeReachableFromRoot(input: {
	rules: Record<string, Rule<'link'>>;
	rootName: string;
}): ReadonlySet<string> {
	const { rules, rootName } = input;
	const reachable = new Set<string>();
	const visit = (name: string): void => {
		if (reachable.has(name)) return;
		reachable.add(name);
		const rule = rules[name];
		if (rule) for (const ref of walkRuleRefs(rule)) visit(ref);
	};
	visit(rootName);
	return reachable;
}

function walkRuleRefs(rule: Rule<'link'>): readonly string[] {
	switch (rule.type) {
		case SYMBOL:
			return [rule.name];
		case SUPERTYPE:
			return rule.subtypes.map((s) => s.name);
		case SEQ:
		case CHOICE:
			return rule.members.flatMap(walkRuleRefs);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case GROUP:
		case TOKEN:
		case ALIAS:
			return walkRuleRefs(rule.content);
		default:
			return [];
	}
}

function emitStampMissDiagnostic(entry: {
	diagnostics: DiagnosticSink;
	severity: 'info' | 'warning';
	code: string;
	message: string;
	detailsKey: 'kinds' | 'texts';
	items: readonly string[];
}): void {
	if (entry.items.length === 0) return;
	entry.diagnostics.emit({
		code: entry.code,
		message: entry.message,
		canProceed: true,
		severity: entry.severity,
		details: { [entry.detailsKey]: entry.items }
	});
}

function reportVaporizedKinds(
	stampMisses: KindIdStampMisses,
	inlineKinds: ReadonlySet<string>,
	reachableFromRoot: ReadonlySet<string>,
	diagnostics: DiagnosticSink
): void {
	const inlineExcludedSymbols = [...stampMisses.symbols].filter((k) => inlineKinds.has(k)).sort();
	const inlineExcludedLiterals = [...stampMisses.literals].filter((k) => inlineKinds.has(k)).sort();
	emitStampMissDiagnostic({
		diagnostics,
		severity: 'info',
		code: 'kindid-inline-excluded-symbols',
		message: `${inlineExcludedSymbols.length} referenced kind(s) have no parser symbol because they are in the grammar's inline: array (model-only, accepted exclusion)`,
		detailsKey: 'kinds',
		items: inlineExcludedSymbols
	});
	emitStampMissDiagnostic({
		diagnostics,
		severity: 'info',
		code: 'kindid-inline-excluded-literals',
		message: `${inlineExcludedLiterals.length} literal(s) have no parser symbol because they are in the grammar's inline: array (model-only, accepted exclusion)`,
		detailsKey: 'texts',
		items: inlineExcludedLiterals
	});

	const notInlineSymbols = [...stampMisses.symbols].filter((k) => !inlineKinds.has(k));
	const vaporizedSymbols = notInlineSymbols.filter((k) => !reachableFromRoot.has(k)).sort();
	const unclassifiedSymbols = notInlineSymbols.filter((k) => reachableFromRoot.has(k)).sort();
	const vaporizedLiterals = [...stampMisses.literals].filter((k) => !inlineKinds.has(k)).sort();

	emitStampMissDiagnostic({
		diagnostics,
		severity: 'info',
		code: 'kindid-vaporized-symbols',
		message: `${vaporizedSymbols.length} referenced kind(s) have no parser symbol, are not in the grammar's inline: array, and are unreachable from the grammar root (dead surface, accepted exclusion)`,
		detailsKey: 'kinds',
		items: vaporizedSymbols
	});
	emitStampMissDiagnostic({
		diagnostics,
		severity: 'info',
		code: 'kindid-vaporized-literals',
		message: `${vaporizedLiterals.length} literal(s) have no parser symbol and are not in the grammar's inline: array (dead surface, accepted exclusion)`,
		detailsKey: 'texts',
		items: vaporizedLiterals
	});
	emitStampMissDiagnostic({
		diagnostics,
		severity: 'warning',
		code: 'kindid-unclassified-symbols',
		message: `${unclassifiedSymbols.length} referenced kind(s) resolved no parser kindId, are reachable from the grammar root, and are not in the inline: array — genuine gap, not an accepted exclusion`,
		detailsKey: 'kinds',
		items: unclassifiedSymbols
	});
}

function classifyAndLogHiddenRules(rules: Record<string, Rule<'link'>>, ctx: LinkCtx): void {
	const { inline, supertypes, derivations, applyPromotedRules } = ctx;
	for (const [name, rule] of Object.entries(rules)) {
		if (isHiddenKind(name, inline) || supertypes.has(name)) {
			const { rule: reclassified, classification } = classifyHiddenRule(rule, ctx, name, rules);
			const classified = reclassified === rule ? reclassified : withKindFacts(reclassified, rule);
			if (classified !== rule && classification !== undefined) {
				derivations.promotedRules.push({
					kind: name,
					classification,
					applied: applyPromotedRules
				});
				if (applyPromotedRules) rules[name] = classified;
			} else {
				rules[name] = classified;
			}
		}
	}
	foldAliasLiteralsIntoEnumRules(rules);
}

const aliasLiteralWalker = new RuleWalker<Rule<'link'>>();

function foldAliasLiteralsIntoEnumRules(rules: Record<string, Rule<'link'>>): void {
	const extras = new Map<string, Set<string>>();
	const considerSymbol = (r: Rule<'link'>): void => {
		const aliased =
			r.type === ALIAS && r.named && r.content.type === STRING
				? { kind: r.value, literal: r.content.value }
				: r.type === SYMBOL && r.literal !== undefined
					? { kind: r.aliasedTo ?? r.name, literal: r.literal }
					: undefined;
		if (aliased === undefined) return;
		const sym = aliased;
		const target =
			rules[sym.kind] !== undefined ? sym.kind : rules[`_${sym.kind}`] !== undefined ? `_${sym.kind}` : undefined;
		if (target === undefined) return;
		const targetRule = rules[target]!;
		if (!isEnumChoiceRule(targetRule)) return;
		const known = new Set(
			(targetRule as ChoiceRule<'link'>).members
				.map((m) => literalTextOf(m))
				.filter((t): t is string => t !== undefined)
		);
		if (!known.has(sym.literal)) {
			const set = extras.get(target) ?? new Set<string>();
			set.add(sym.literal);
			extras.set(target, set);
		}
	};
	for (const rule of Object.values(rules)) {
		if (rule.type === SUPERTYPE) {
			for (const sub of (rule as SupertypeRule<'link'>).subtypes) considerSymbol(sub);
			continue;
		}
		aliasLiteralWalker.find(rule, (r) => {
			considerSymbol(r);
			return false;
		});
	}
	for (const [target, texts] of extras) {
		const targetRule = rules[target] as ChoiceRule<'link'>;
		rules[target] = {
			...targetRule,
			members: [...targetRule.members, ...[...texts].map((value) => ({ type: STRING, value }) as Rule<'link'>)]
		} as Rule<'link'>;
	}
}

function markSupertypeRefsNonInline(rules: Record<string, Rule<'link'>>): void {
	const nonInlineKinds = new Set<string>();
	for (const [name, rule] of Object.entries(rules)) {
		if (rule.type === SUPERTYPE || referencesSelf(rule, name)) nonInlineKinds.add(name);
	}
	if (nonInlineKinds.size === 0) return;
	const walk = (rule: Rule<'link'>): Rule<'link'> => {
		if (rule.type === SYMBOL) {
			return nonInlineKinds.has(rule.name) && rule.inline !== false ? { ...rule, inline: false } : rule;
		}
		const xs = rule as { members?: readonly Rule<'link'>[]; content?: Rule<'link'> };
		if (xs.members) return { ...rule, members: xs.members.map(walk) } as Rule<'link'>;
		if (xs.content) return { ...rule, content: walk(xs.content) } as Rule<'link'>;
		return rule;
	};
	for (const name of Object.keys(rules)) rules[name] = walk(rules[name]!);
}

const selfRefWalker = new RuleWalker<Rule<'link'>>();

function referencesSelf(rule: Rule<'link'>, self: string): boolean {
	return selfRefWalker.find(rule, (r) => r.type === SYMBOL && r.name === self) !== undefined;
}

function topLevelAliasOf(rule: Rule<'link'>): AliasRule<'link'> | undefined {
	if (rule.type === ALIAS && rule.named) return rule;
	if (rule.type === GROUP || rule.type === TOKEN) return topLevelAliasOf(rule.content);
	return undefined;
}

const aliasedRefWalker = new RuleWalker<Rule<'link'>>();

function unhideAliasedTargets(rules: Record<string, Rule<'link'>>): void {
	for (const rule of Object.values(rules)) {
		aliasedRefWalker.find(rule, (r) => {
			if (r.type !== ALIAS || !r.named || r.content.type !== SYMBOL) return false;
			const target = rules[r.content.name];
			if (target !== undefined && target.hidden === true) rules[r.content.name] = { ...target, hidden: false };
			return false;
		});
	}
}

function stampLinkMintedVisibility(rules: Record<string, Rule<'link'>>, ctx: LinkCtx): void {
	for (const [name, rule] of Object.entries(rules)) {
		if (!(name in ctx.rules) && rule.hidden === undefined) rules[name] = { ...rule, hidden: name.startsWith('_') };
	}
}

function pruneInlinedAliasBodies(rules: Record<string, Rule<'link'>>, ctx: StampKindIdsCtx): void {
	const referenced = new Set<string>();
	for (const rule of Object.values(rules)) {
		aliasedRefWalker.find(rule, (r) => {
			if (r.type === SYMBOL) referenced.add(r.name);
			if (r.type === SUPERTYPE) for (const s of r.subtypes) referenced.add(s.name);
			return false;
		});
	}
	for (const [name, rule] of Object.entries(rules)) {
		if (rule.hidden !== true || ctx.topLevelAliasBodies?.has(name) || referenced.has(name)) continue;
		if (rule.type === SUPERTYPE || isKindChoice(rule)) continue;
		delete rules[name];
	}
}

function pruneUnreachableRules(rules: Record<string, Rule<'link'>>, ctx: LinkCtx): void {
	const rootName = rootRuleName(rules);
	if (rootName === undefined) return;
	const reachable = new Set(computeReachableFromRoot({ rules, rootName }));
	for (const keep of [...ctx.grammar.externals, ...ctx.grammar.extras]) {
		for (const name of computeReachableFromRoot({ rules, rootName: keep })) reachable.add(name);
	}
	for (const name of Object.keys(rules)) {
		if (!reachable.has(name)) delete rules[name];
	}
}

function inlineReferences(rules: Record<string, Rule<'link'>>, ctx: LinkCtx): void {
	const cyclic = cyclicInlineTargets(rules);
	const inlineOne = (r: Rule<'link'>): Rule<'link'> => {
		if (r.type !== SYMBOL || r.inline !== true || cyclic.has(r.name)) return r;
		const body = rules[r.name];
		if (body === undefined) return r;
		const { hidden: _sourceKindHidden, ...spliced } = body;
		return rebaseRuleIds({ ...spliced, inlinedFrom: r.name } as Rule<'link'>, r.id ?? body.id);
	};
	for (let pass = 0; pass < 64; pass++) {
		let changed = false;
		for (const [name, rule] of Object.entries(rules)) {
			const next = inlineOne(aliasedRefWalker.map(rule, inlineOne));
			if (next !== rule) {
				rules[name] = next;
				changed = true;
			}
		}
		if (!changed) return;
	}
	ctx.diagnostics.warn({
		code: 'inline-fixpoint-unreached',
		message: 'link inlining did not reach a fixed point in 64 passes',
		canProceed: true
	});
}

function cyclicInlineTargets(rules: Record<string, Rule<'link'>>): ReadonlySet<string> {
	const edges = new Map<string, Set<string>>();
	for (const [name, rule] of Object.entries(rules)) {
		const out = new Set<string>();
		aliasedRefWalker.find(rule, (r) => {
			if (r.type === SYMBOL && r.inline === true) out.add(r.name);
			return false;
		});
		edges.set(name, out);
	}
	const cyclic = new Set<string>();
	for (const start of edges.keys()) {
		const seen = new Set<string>();
		const stack = [...(edges.get(start) ?? [])];
		while (stack.length > 0) {
			const n = stack.pop()!;
			if (n === start) {
				cyclic.add(start);
				break;
			}
			if (seen.has(n)) continue;
			seen.add(n);
			for (const m of edges.get(n) ?? []) stack.push(m);
		}
	}
	return cyclic;
}

function collectAliasedHiddenKinds(rawRules: Record<string, Rule<'evaluate'>>): Map<string, string> {
	const out = new Map<string, string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		const target = extractTopLevelAliasTarget(rule as Rule<'link'>);
		if (target) out.set(name, target);
	}
	return out;
}

function extractTopLevelAliasTarget(rule: Rule<'link'>): string | undefined {
	if (rule.type === ALIAS && rule.named) return rule.value;
	if (rule.type === GROUP || rule.type === TOKEN) {
		return extractTopLevelAliasTarget((rule as { content: Rule<'link'> }).content);
	}
	return undefined;
}

function collectHiddenChoicesWithNamedAliasMembers(rawRules: Record<string, Rule<'evaluate'>>): ReadonlySet<string> {
	const out = new Set<string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		if (
			rule.type === CHOICE &&
			rule.members.length > 0 &&
			rule.members.every((m) => m.type === ALIAS && m.named && m.content.type === SYMBOL)
		) {
			out.add(name);
		}
	}
	return out;
}

function collectAliasedByParents(rawRules: Record<string, Rule<'evaluate'>>): {
	parentAliasedKinds: ReadonlySet<string>;
	visibleAliasTargets: ReadonlyMap<string, readonly string[]>;
} {
	const parentAliasedKinds = new Set<string>();
	const visibleAliasTargets = new Map<string, string[]>();
	function walk(rule: Rule<'link'>): void {
		if (rule.type === ALIAS) {
			if (rule.named && rule.content.type === SYMBOL) {
				const source = rule.content.name;
				if (source.startsWith('_')) {
					parentAliasedKinds.add(source);
				} else if (typeof rule.value === 'string' && !rule.value.startsWith('_')) {
					const arr = visibleAliasTargets.get(rule.value);
					if (arr) {
						if (!arr.includes(source)) arr.push(source);
					} else {
						visibleAliasTargets.set(rule.value, [source]);
					}
				}
			}
			walk(rule.content);
			return;
		}
		if ('members' in rule && Array.isArray((rule as ChoiceRule<'link'> | SeqRule<'link'>).members)) {
			for (const m of (rule as ChoiceRule<'link'> | SeqRule<'link'>).members) walk(m);
		}
		if ('content' in rule && (rule as { content?: Rule<'link'> }).content) {
			walk((rule as { content: Rule<'link'> }).content);
		}
	}
	for (const rule of Object.values(rawRules)) walk(rule as Rule<'link'>);
	return { parentAliasedKinds, visibleAliasTargets };
}

function collectTopLevelAliasBodies(
	resolvedRules: Record<string, Rule<'link'>>,
	ctx: LinkCtx,
	complexAliasTargetHidden?: ReadonlySet<string>
): Map<string, Rule<'link'>> {
	const rawRules = ctx.rules;
	const out = new Map<string, Rule<'link'>>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!(name in resolvedRules)) continue;
		if (!name.startsWith('_')) continue;
		const content = extractTopLevelNamedAliasContent(rule as Rule<'link'>);
		if (!content) continue;
		if (complexAliasTargetHidden && content.type === SYMBOL && complexAliasTargetHidden.has(content.name)) {
			continue;
		}
		const resolvedContent = resolveRule(content, ctx, name);
		out.set(name, dereferenceTopLevelAliasBody(resolvedContent, ctx, resolvedRules, new Set()));
	}
	return out;
}

function collectTerminalAliasWireIds(
	ruleBags: readonly Record<string, Rule<'link'>>[],
	ctx: StampKindIdsCtx
): Map<string, readonly number[]> {
	const { kindEntries } = ctx;
	const out = new Map<string, number[]>();
	const add = (kind: string, id: number): void => {
		const ids = out.get(kind);
		if (ids === undefined) out.set(kind, [id]);
		else if (!ids.includes(id)) ids.push(id);
	};
	const addBothSpellings = (kind: string, id: number): void => {
		add(kind, id);
		add(kind.startsWith('_') ? kind.replace(/^_+/, '') : `_${kind}`, id);
	};
	const terminalTexts = (rule: Rule<'link'>): string[] | undefined => {
		if (rule.type === STRING) return [rule.value];
		if (rule.type === CHOICE) {
			const texts: string[] = [];
			for (const m of (rule as { members: Rule<'link'>[] }).members) {
				const inner = terminalTexts(m);
				if (inner === undefined) return undefined;
				texts.push(...inner);
			}
			return texts;
		}
		const content = (rule as { content?: Rule<'link'> }).content;
		if (content !== undefined) return terminalTexts(content);
		return undefined;
	};
	const visit = (rule: Rule<'link'>): void => {
		if (rule.type === SYMBOL) {
			if (rule.literal !== undefined && rule.kindId !== undefined && rule.aliasedTo !== undefined) {
				addBothSpellings(rule.aliasedTo, rule.kindId);
			}
			return;
		}
		if (rule.type === ALIAS && rule.named) {
			const texts = terminalTexts(rule.content);
			if (texts !== undefined) {
				for (const text of texts) {
					const entry = findEntryForLiteralText(kindEntries, text);
					if (entry !== undefined) addBothSpellings(rule.value, entry.parseId ?? entry.id);
				}
				return;
			}
		}
		const members = (rule as { members?: Rule<'link'>[] }).members;
		if (Array.isArray(members)) for (const m of members) visit(m);
		const content = (rule as { content?: Rule<'link'> }).content;
		if (content !== undefined) visit(content);
	};
	for (const bag of ruleBags) for (const rule of Object.values(bag)) visit(rule);
	return out;
}

function extractTopLevelNamedAliasContent(rule: Rule<'link'>): Rule<'link'> | undefined {
	if (rule.type === ALIAS && rule.named) return rule.content;
	if (rule.type === GROUP || rule.type === TOKEN) {
		return extractTopLevelNamedAliasContent((rule as { content: Rule<'link'> }).content);
	}
	return undefined;
}

function dereferenceTopLevelAliasBody(
	rule: Rule<'link'>,
	ctx: LinkCtx,
	resolvedRules: Record<string, Rule<'link'>>,
	seen: Set<string>
): Rule<'link'> {
	const supertypes = ctx.supertypes;
	if (rule.type !== SYMBOL) return rule;
	const refName = rule.name;
	if (supertypes.has(refName)) return rule;
	if (seen.has(refName)) return rule;
	const target = resolvedRules[refName];
	if (!target) return rule;
	seen.add(refName);
	return { ...dereferenceTopLevelAliasBody(target, ctx, resolvedRules, seen), inlinedFrom: refName };
}

function _wouldInlineAtAssemble(kindName: string, rules: Record<string, Rule<'link'>>): boolean {
	const target = rules[kindName];
	if (!target) return false;
	if (target.type === GROUP) return true;
	const unwrap = (r: Rule<'link'>): Rule<'link'> => (r.type === OPTIONAL ? unwrap(r.content) : r);
	const bare = unwrap(target);
	return bare.type === REPEAT || bare.type === REPEAT1;
}

export interface VariantChoiceLocation {
	choice: ChoiceRule<'link'>;
	prefix: Rule<'link'>[];
	suffix: Rule<'link'>[];
}

export function applyOverridePolymorphs(rules: Record<string, Rule<'link'>>, derivations: DerivationLog): void {
	const structural = deriveStructuralVariantChildren(rules);
	const parentToChildren = new Map<string, string[]>();
	for (const [parentKind, variantChildren] of structural) {
		const names = variantChildren.map((c) => c.name);
		if (names.length > 0) parentToChildren.set(parentKind, names);
	}

	for (const [parentKind, children] of parentToChildren) {
		const rule = rules[parentKind];
		if (!rule) continue;

		const found = findVariantChoice(rule);
		if (!found) continue;

		emitVariantChildDerivations(parentKind, children, derivations);

		const variantChildSymbolNames = new Set(children.map((c) => polymorphVisibleName(parentKind, c)));
		const symbolInNames = (r: Rule<'link'>): boolean => {
			let inner = r;
			if (inner.type === OPTIONAL) inner = inner.content;
			if (inner.type === ALIAS) return variantChildSymbolNames.has(inner.value);
			return inner.type === SYMBOL && variantChildSymbolNames.has(inner.name);
		};
		const symbolInRule = (r: Rule<'link'>): boolean => {
			if (symbolInNames(r)) return true;
			const inner = r;
			if (inner.type === CHOICE) return inner.members.some(symbolInNames);
			if (inner.type === SEQ)
				return inner.members.some((m) => symbolInNames(m) || (m.type === CHOICE && m.members.some(symbolInNames)));
			return false;
		};
		const anyChildMemberInFoundChoice = found.choice.members.some(symbolInRule);
		if (!anyChildMemberInFoundChoice) {
			pushAmbientScaffoldIntoVariantChildren(rules, parentKind, children);
			continue;
		}
	}
}

function emitVariantChildDerivations(parentKind: string, children: string[], derivations: DerivationLog): void {
	for (const child of children) {
		const variantChildKind = `${parentKind}_${child}`;
		derivations.promotedRules.push({
			kind: variantChildKind,
			classification: 'polymorph',
			applied: true
		});
	}
}

function pushAmbientScaffoldIntoVariantChildren(
	rules: Record<string, Rule<'link'>>,
	parentKind: string,
	children: readonly string[]
): void {
	const variantChildVisibleNames = new Set(children.map((c) => `${parentKind}_${c}`));
	const parentRule = rules[parentKind];
	if (!parentRule) return;

	const rewritten = rewriteSeqWithVariantAliasChoice(parentRule, rules, variantChildVisibleNames);
	if (rewritten !== parentRule) rules[parentKind] = rewritten;
}

function rewriteSeqWithVariantAliasChoice(
	rule: Rule<'link'>,
	rules: Record<string, Rule<'link'>>,
	variantChildVisibleNames: Set<string>
): Rule<'link'> {
	switch (rule.type) {
		case SEQ: {
			const choiceIdx = rule.members.findIndex((m) => isAllAliasChoice(m, variantChildVisibleNames));
			if (choiceIdx !== -1) {
				return applyVariantScaffoldPushDown(rule, choiceIdx, rules);
			}
			const members = rule.members.map((m) => rewriteSeqWithVariantAliasChoice(m, rules, variantChildVisibleNames));
			return { ...rule, members };
		}
		case CHOICE: {
			const members = rule.members.map((m) => rewriteSeqWithVariantAliasChoice(m, rules, variantChildVisibleNames));
			return { ...rule, members };
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case FIELD:
		case TOKEN: {
			const content = rewriteSeqWithVariantAliasChoice(
				(rule as { content: Rule<'link'> }).content,
				rules,
				variantChildVisibleNames
			);
			return { ...(rule as object), content } as Rule<'link'>;
		}
		default:
			return rule;
	}
}

function isAllAliasChoice(rule: Rule<'link'>, variantChildVisibleNames: Set<string>): boolean {
	if (rule.type !== CHOICE || rule.members.length === 0) return false;
	return rule.members.every((m) => {
		const core = m;
		if (core.type === ALIAS) return variantChildVisibleNames.has(core.value);
		if (core.type === SYMBOL) return variantChildVisibleNames.has(core.name);
		return false;
	});
}

function applyVariantScaffoldPushDown(
	seq: SeqRule<'link'>,
	choiceIdx: number,
	rules: Record<string, Rule<'link'>>
): Rule<'link'> {
	const prefix = seq.members.slice(0, choiceIdx).filter((m) => m.type === STRING) as StringRule<'link'>[];
	const suffix = seq.members.slice(choiceIdx + 1).filter((m) => m.type === STRING) as StringRule<'link'>[];
	if (prefix.length === 0 && suffix.length === 0) return seq;
	const choice = seq.members[choiceIdx] as ChoiceRule<'link'>;
	for (const member of choice.members) {
		const core = member;
		let visibleName: string | null = null;
		if (core.type === ALIAS) {
			visibleName = core.value;
		} else if (core.type === SYMBOL) {
			visibleName = core.name;
		}
		if (!visibleName) continue;
		const hiddenName = `_${visibleName}`;
		const body = rules[hiddenName] ?? rules[visibleName];
		if (!body) continue;
		const wrapped: Rule<'link'> = {
			type: SEQ,
			members: [...prefix, body, ...suffix]
		};
		if (hiddenName in rules) rules[hiddenName] = wrapped;
		if (visibleName in rules) rules[visibleName] = wrapped;
	}
	const remaining = seq.members.filter((m, i) => i === choiceIdx || m.type !== STRING);
	if (remaining.length === 1) return remaining[0]!;
	return { type: SEQ, members: remaining };
}

export function findVariantChoice(rule: Rule<'link'>): VariantChoiceLocation | null {
	if (isChoice(rule)) {
		return { choice: rule, prefix: [], suffix: [] };
	}
	if (rule.type === SEQ) {
		const choiceIdx = rule.members.findIndex((m) => m.type === CHOICE);
		if (choiceIdx !== -1) {
			const more = rule.members.findIndex((m, i) => i !== choiceIdx && m.type === CHOICE);
			if (more !== -1) return null;
			return {
				choice: rule.members[choiceIdx] as ChoiceRule<'link'>,
				prefix: rule.members.slice(0, choiceIdx),
				suffix: rule.members.slice(choiceIdx + 1)
			};
		}

		const innerSeqIdx = rule.members.findIndex(
			(m) => m.type === SEQ && (m as SeqRule<'link'>).members.some((mm) => mm.type === CHOICE)
		);
		if (innerSeqIdx === -1) return null;
		const outerChoiceCount = rule.members.filter((m) => m.type === CHOICE).length;
		if (outerChoiceCount > 0) return null;
		const innerSeq = rule.members[innerSeqIdx] as SeqRule<'link'>;
		const innerChoiceIdx = innerSeq.members.findIndex((m) => m.type === CHOICE);
		if (innerChoiceIdx === -1) return null;
		const innerChoiceCount = innerSeq.members.filter((m) => m.type === CHOICE).length;
		const otherSeqChoiceCount = rule.members
			.filter((m, i) => i !== innerSeqIdx && m.type === SEQ)
			.reduce((acc, m) => acc + (m as SeqRule<'link'>).members.filter((mm) => mm.type === CHOICE).length, 0);
		if (innerChoiceCount !== 1 || otherSeqChoiceCount > 0) return null;
		const outerPrefix = rule.members.slice(0, innerSeqIdx);
		const outerSuffix = rule.members.slice(innerSeqIdx + 1);
		const innerPrefix = innerSeq.members.slice(0, innerChoiceIdx);
		const innerSuffix = innerSeq.members.slice(innerChoiceIdx + 1);
		return {
			choice: innerSeq.members[innerChoiceIdx] as ChoiceRule<'link'>,
			prefix: [...outerPrefix, ...innerPrefix],
			suffix: [...innerSuffix, ...outerSuffix]
		};
	}
	return null;
}

const TOKEN_NAMES: Record<string, string> = {
	';': 'semi',
	'{': 'brace',
	'}': 'close_brace',
	'(': 'paren',
	')': 'close_paren',
	'[': 'bracket',
	']': 'close_bracket',
	',': 'comma',
	':': 'colon',
	'.': 'dot',
	'::': 'path',
	'->': 'arrow',
	'=>': 'fat_arrow',
	'=': 'eq',
	'!': 'bang',
	'?': 'question',
	'<': 'lt',
	'>': 'gt',
	'+': 'plus',
	'-': 'minus',
	'*': 'star',
	'/': 'slash',
	'%': 'percent',
	'&': 'amp',
	'|': 'pipe',
	'^': 'caret',
	'~': 'tilde',
	'#': 'hash',
	'@': 'at',
	'==': 'eqeq',
	'!=': 'neq',
	'<=': 'le',
	'>=': 'ge',
	'&&': 'andand',
	'||': 'oror',
	'<<': 'shl',
	'>>': 'shr',
	'**': 'starstar',
	'...': 'ellipsis',
	'..': 'dotdot',
	'..=': 'dotdoteq',
	'+=': 'pluseq',
	'-=': 'minuseq',
	'*=': 'stareq',
	'/=': 'slasheq',
	'%=': 'percenteq',
	'&=': 'ampeq',
	'|=': 'pipeeq',
	'^=': 'careteq',
	'<<=': 'shleq',
	'>>=': 'shreq',
	'**=': 'starstareq',
	'//': 'slashslash',
	'//=': 'slashslasheq',
	'++': 'plusplus',
	'--': 'minusminus',
	':=': 'coloneq',
	'<>': 'ltgt',
	'@=': 'ateq',
	'0b': 'tok_0b',
	'0B': 'tok_0B',
	'0o': 'tok_0o',
	'0O': 'tok_0O',
	'0x': 'tok_0x',
	'0X': 'tok_0X'
};

function charFallback(token: string): string {
	const CHAR_NAMES: Record<string, string> = {
		'!': 'bang',
		'"': 'dq',
		'#': 'hash',
		$: 'dollar',
		'%': 'pct',
		'&': 'amp',
		"'": 'sq',
		'(': 'lp',
		')': 'rp',
		'*': 'star',
		'+': 'plus',
		',': 'comma',
		'-': 'minus',
		'.': 'dot',
		'/': 'slash',
		':': 'colon',
		';': 'semi',
		'<': 'lt',
		'=': 'eq',
		'>': 'gt',
		'?': 'q',
		'@': 'at',
		'[': 'lb',
		'\\': 'bs',
		']': 'rb',
		'^': 'caret',
		'`': 'bt',
		'{': 'lbr',
		'|': 'pipe',
		'}': 'rbr',
		'~': 'tilde',
		' ': 'sp',
		'\t': 'tab',
		'\n': 'nl',
		'\r': 'cr'
	};
	return 'tok_' + [...token].map((c) => CHAR_NAMES[c] ?? (/[\w]/.test(c) ? c : 'x')).join('_');
}

export function tokenToName(token: string): string {
	if (TOKEN_NAMES[token]) return TOKEN_NAMES[token];
	if (/^[\w_]+$/.test(token)) return token;
	return charFallback(token);
}

function resolveRule(rule: Rule<'link'>, ctx: LinkCtx, currentName: string): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, ctx, currentName))
			};

		case CHOICE: {
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, ctx, currentName))
			};
		}

		case OPTIONAL: {
			const content = resolveRule(rule.content, ctx, currentName);
			return { ...rule, content };
		}

		case REPEAT:
			return {
				...rule,
				content: resolveRule(rule.content, ctx, currentName)
			};

		case REPEAT1:
			return resolveRepeat1PreservingNonEmpty(rule, ctx, currentName);

		case FIELD:
			return {
				...rule,
				content: resolveRule(rule.content, ctx, currentName)
			};

		case TOKEN:
			return {
				...rule,
				content: resolveRule(rule.content, ctx, currentName)
			};

		case ALIAS: {
			if (rule.named && rule.value && !rule.value.startsWith('_')) {
				const content = resolveRule(rule.content, ctx, currentName);
				if (content.type === STRING || aliasedSymbolWithin(content) !== undefined) return { ...rule, content };
				if (ctx.rules[rule.value] === undefined) return { ...rule, content };
				return withId({ type: SYMBOL, name: rule.value, inline: false }, rule.id);
			}
			if (
				!rule.named &&
				typeof rule.value === 'string' &&
				rule.value.length > 0 &&
				!rule.value.startsWith('_') &&
				!/^[A-Za-z_]\w*$/.test(rule.value)
			) {
				return { type: STRING, value: rule.value };
			}
			return resolveRule(rule.content, ctx, currentName);
		}

		case SYMBOL:
			return rule.inline === true ? resolveSymbolRoleOrPass(rule, ctx) : rule;

		case STRING:
		case PATTERN:
		case SUPERTYPE:
		case GROUP:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return rule;

		default:
			return rule;
	}
}

function resolveRepeat1PreservingNonEmpty(rule: Repeat1Rule, ctx: LinkCtx, currentName: string): Rule<'link'> {
	return {
		...rule,
		content: resolveRule(rule.content, ctx, currentName)
	};
}

function aliasedSymbolWithin(content: Rule<'link'>): SymbolRule<'link'> | undefined {
	if (content.type === SYMBOL) return content;
	if (content.type === GROUP || content.type === TOKEN) {
		return aliasedSymbolWithin(content.content);
	}
	return undefined;
}

const ROLE_TO_RULE_TYPE = {
	indent: INDENT,
	dedent: DEDENT,
	newline: NEWLINE
} as const;
const RULE_TYPE_TO_ROLE = {
	[INDENT]: 'indent',
	[DEDENT]: 'dedent',
	[NEWLINE]: 'newline'
} as const;

function resolveSymbolRoleOrPass(rule: SymbolRule<'link'>, ctx: LinkCtx): Rule<'link'> {
	const { rules: allRules, externalRoles } = ctx;
	const preBound = externalRoles.get(rule.name);
	if (preBound) {
		return { type: ROLE_TO_RULE_TYPE[preBound.role], inlinedFrom: rule.name } as Rule<'link'>;
	}
	const target = allRules[rule.name];
	if (target && (target.type === INDENT || target.type === DEDENT || target.type === NEWLINE)) {
		externalRoles.set(rule.name, { role: RULE_TYPE_TO_ROLE[target.type] });
		return { ...target, inlinedFrom: rule.name };
	}
	return rule;
}

interface ClassifyResult {
	readonly rule: Rule<'link'>;
	readonly classification?: 'enum' | 'supertype';
	readonly classifiedBy?: 'grammar' | 'link';
}

function classifyHiddenRule(
	rule: Rule<'link'>,
	ctx: LinkCtx,
	name: string,
	rules: Record<string, Rule<'link'>>
): ClassifyResult {
	if (isEnumChoiceRule(rule) || rule.type === SUPERTYPE || rule.type === GROUP) {
		return { rule };
	}

	if (rule.type === CHOICE) {
		return classifyHiddenChoiceRule(rule, ctx, name, rules);
	}

	if (isSeq(rule)) {
		return { rule: classifyHiddenSeqRule(name, rule) };
	}

	return { rule };
}

function flattenNestedChoiceMembers(members: readonly Rule<'link'>[]): Rule<'link'>[] {
	const flat: Rule<'link'>[] = [];
	for (const m of members) {
		if (m.type === CHOICE) {
			flat.push(...flattenNestedChoiceMembers(m.members));
		} else {
			flat.push(m);
		}
	}
	return flat;
}

function classifyHiddenChoiceRule(
	rule: ChoiceRule<'link'>,
	ctx: LinkCtx,
	name: string,
	rules: Record<string, Rule<'link'>>
): ClassifyResult {
	const { supertypes, hiddenChoicesWithNamedAliasMembers } = ctx;
	const enumMembers = rule.members.map((m): StringRule<'link'> | SymbolRule<'link'> | undefined => {
		if (m.type === STRING) return m;
		if (m.type === SYMBOL) {
			const sym = m as SymbolRule<'link'>;
			if (sym.literal !== undefined) return sym;
		}
		if (m.type === ALIAS && m.named) {
			if (m.content.type === STRING) {
				return withId({ type: SYMBOL, name: m.value, literal: m.content.value, inline: false }, m.id);
			}
			if (m.content.type === SYMBOL) {
				const storageBody = rules[m.content.name];
				if (storageBody !== undefined && storageBody.type === STRING) {
					return withId({ type: SYMBOL, name: m.value, literal: storageBody.value, inline: false }, m.id);
				}
			}
		}
		return undefined;
	});
	if (enumMembers.every((m): m is StringRule<'link'> | SymbolRule<'link'> => m !== undefined)) {
		const allStrings = enumMembers.every((m): m is StringRule<'link'> => m.type === STRING);
		return {
			rule: allStrings
				? normalizeEnumMembers(enumMembers as StringRule<'link'>[], { classifiedBy: 'link' })
				: ({
						type: CHOICE,
						members: enumMembers,
						metadata: makeRuleMetadata({ classifiedBy: 'link' })
					} as ChoiceRule<'link'>),
			classification: 'enum',
			classifiedBy: 'link'
		};
	}

	if (hiddenChoicesWithNamedAliasMembers.has(name) && !supertypes.has(name)) {
		return { rule };
	}

	const flatMembers = flattenNestedChoiceMembers(rule.members);
	const supertypeCompatible = (m: Rule<'link'>): boolean =>
		m.type === SYMBOL ||
		isEnumChoiceRule(m) ||
		m.type === STRING ||
		(m.type === ALIAS && m.named && (m.content.type === STRING || aliasedSymbolWithin(m.content) !== undefined));
	const allCompatible = flatMembers.every(supertypeCompatible);
	if (allCompatible || supertypes.has(name)) {
		const subtypes = collectSubtypeRefs(rule, ctx);
		if (subtypes.length > 0) {
			const classifiedBy = supertypes.has(name) ? 'grammar' : 'link';
			const variantArms = flatMembers
				.map((m): string | null => {
					const core = m;
					if (!isAliasMintedRef(core, rules)) return null;
					if (core.type === ALIAS) {
						return core.named && core.content.type === SYMBOL ? core.content.name : null;
					}
					if (core.type === SYMBOL) return core.name;
					return null;
				})
				.filter((n): n is string => n !== null);
			return {
				rule: {
					type: SUPERTYPE,
					name,
					subtypes,
					...(variantArms.length > 0 ? { variantArms } : {})
				} satisfies SupertypeRule<'link'>,
				classification: 'supertype',
				classifiedBy
			};
		}
	}

	return { rule };
}

function classifyHiddenSeqRule(name: string, rule: SeqRule<'link'>): Rule<'link'> {
	if (hasAnyField(rule)) {
		return {
			type: GROUP,
			name,
			content: rule
		} satisfies GroupRule<'link'>;
	}
	return rule;
}

function collectSubtypeRefs(rule: Rule<'link'>, ctx: LinkCtx): SymbolRule<'link'>[] {
	const subtypes: SymbolRule<'link'>[] = [];
	const visit = (current: Rule<'link'>): void => {
		switch (current.type) {
			case SYMBOL:
				subtypes.push(current);
				return;
			case ALIAS:
				if (!current.named) return;
				if (current.content.type === SYMBOL) {
					const storageName = current.content.name;
					const parseName = typeof current.value === 'string' && current.value.length > 0 ? current.value : undefined;
					subtypes.push(
						parseName !== undefined && parseName !== storageName
							? { type: SYMBOL, name: storageName, aliasedTo: parseName }
							: { type: SYMBOL, name: storageName }
					);
				} else if (current.content.type === STRING) {
					const entry = findEntryForLiteralText(ctx.kindEntries, current.content.value);
					subtypes.push({
						type: SYMBOL,
						name: entry?.kind ?? current.content.value,
						literal: current.content.value,
						aliasedTo: current.value
					});
				} else {
					visit(current.content);
				}
				return;
			case STRING: {
				const isWordShape = ctx.wordMatcher
					? ctx.wordMatcher(current.value)
					: matchesWordShape(current.value, undefined);
				if (isWordShape) return;
				const entry = findEntryForLiteralText(ctx.kindEntries, current.value);
				subtypes.push({ type: SYMBOL, name: entry?.kind ?? current.value, literal: current.value });
				return;
			}
			case CHOICE:
			case SEQ:
				for (const member of current.members) visit(member);
				return;
			case GROUP:
			case TOKEN:
			case OPTIONAL:
			case REPEAT:
			case REPEAT1:
				visit(current.content);
				return;
			default:
				return;
		}
	};
	visit(rule);
	return subtypes;
}

export function enrichPositions(rules: Record<string, Rule<'link'>>, refs: SymbolRef[]): void {
	for (const ref of refs) {
		const rule = rules[ref.from];
		if (!rule || rule.type !== SEQ) continue;
		const idx = rule.members.findIndex((m) => m.type === SYMBOL && m.name === ref.to);
		if (idx >= 0) ref.position = idx;
	}
}

export function computeParentSets(refs: SymbolRef[]): Map<string, SymbolRef[]> {
	const parents = new Map<string, SymbolRef[]>();
	for (const ref of refs) {
		const existing = parents.get(ref.to);
		if (existing) {
			existing.push(ref);
		} else {
			parents.set(ref.to, [ref]);
		}
	}
	return parents;
}

function collectRepeatedShapes(rules: Record<string, Rule<'link'>>, out: RepeatedShapeEntry[]): void {
	const existingSupertypeKeys = new Set<string>();
	for (const rule of Object.values(rules)) {
		if (rule.type === SUPERTYPE) {
			existingSupertypeKeys.add(
				rule.subtypes
					.map((s) => s.name)
					.sort()
					.join('\n')
			);
		}
	}

	const parentsByKey = new Map<string, Set<string>>();
	for (const [parentName, rule] of Object.entries(rules)) {
		collectFieldKindSets(rule, (kinds) => {
			if (kinds.length < 2) return;
			const key = [...kinds].sort().join('\n');
			let bucket = parentsByKey.get(key);
			if (!bucket) {
				bucket = new Set<string>();
				parentsByKey.set(key, bucket);
			}
			bucket.add(parentName);
		});
	}

	for (const [key, parents] of parentsByKey) {
		if (parents.size < 2) continue;
		if (existingSupertypeKeys.has(key)) continue;
		const kinds = key.split('\n');
		const shape: 'supertype' | 'group' = kinds.every((k) => /^[\w]+$/.test(k)) ? 'supertype' : 'group';
		out.push({
			suggestedName: suggestSharedName(kinds),
			kinds,
			parents: [...parents].sort(),
			shape
		});
	}
}

function collectFieldKindSets(rule: Rule<'link'>, yield_: (kinds: readonly string[]) => void): void {
	switch (rule.type) {
		case FIELD: {
			const kinds = directContentKinds(rule.content);
			if (kinds.length > 0) yield_(kinds);
			collectFieldKindSets(rule.content, yield_);
			return;
		}
		case SEQ:
		case CHOICE:
			for (const m of rule.members) collectFieldKindSets(m, yield_);
			return;
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case GROUP:
			collectFieldKindSets(rule.content, yield_);
			return;
	}
}

function directContentKinds(rule: Rule<'link'>): string[] {
	switch (rule.type) {
		case SYMBOL:
			return [rule.name];
		case SUPERTYPE:
			return rule.subtypes.map((s) => s.name);
		case CHOICE:
			return rule.members.flatMap(directContentKinds);
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case GROUP:
			return directContentKinds(rule.content);
		default:
			return [];
	}
}

function suggestSharedName(kinds: readonly string[]): string {
	const words = kinds.map((k) => k.split('_').filter(Boolean));
	if (words.length === 0) return '_shared';
	const first = words[0]!;
	let suffix: string[] = [];
	for (let i = 1; i <= first.length; i++) {
		const tail = first.slice(first.length - i);
		if (words.every((w) => w.length >= i && w.slice(w.length - i).join('_') === tail.join('_'))) {
			suffix = tail;
		} else break;
	}
	if (suffix.length > 0) return '_' + suffix.join('_');
	return `_shared_${kinds.length}`;
}

export function absorbSuffixSeparatedList(members: Rule<'link'>[]): Rule<'link'>[] | null {
	let changed = false;
	const out: Rule<'link'>[] = [];
	let i = 0;
	while (i < members.length) {
		const cur = members[i]!;
		const repeatAt = (idx: number): RepeatRule<'link'> | Repeat1Rule<'link'> | undefined => {
			const m = members[idx];
			return m && (m.type === REPEAT || m.type === REPEAT1) && m.separator?.trailing === 'mandatory'
				? (m as RepeatRule<'link'> | Repeat1Rule<'link'>)
				: undefined;
		};
		const tailMatches = (repeat: RepeatRule<'link'> | Repeat1Rule<'link'>, idx: number): boolean => {
			const tail = members[idx];
			return tail !== undefined && tail.type === OPTIONAL && rulesEqual(tail.content, repeat.content);
		};
		if (cur.type === SEQ && cur.members.length === 2) {
			const [head, headSep] = cur.members;
			const repeat = repeatAt(i + 1);
			if (
				repeat &&
				head !== undefined &&
				headSep !== undefined &&
				headSep.type === STRING &&
				rulesEqual(head, repeat.content) &&
				rulesEqual(headSep, repeat.separator!.value) &&
				tailMatches(repeat, i + 2)
			) {
				out.push({
					type: REPEAT1,
					content: repeat.content,
					separator: { ...repeat.separator!, trailing: 'optional', terminated: true }
				});
				i += 3;
				changed = true;
				continue;
			}
		}
		const repeat = repeatAt(i);
		if (repeat && tailMatches(repeat, i + 1)) {
			out.push({ ...repeat, separator: { ...repeat.separator!, trailing: 'optional' } });
			i += 2;
			changed = true;
			continue;
		}
		out.push(cur);
		i++;
	}
	return changed ? out : null;
}

export function absorbTrailingSeparator(members: Rule<'link'>[]): Rule<'link'>[] | null {
	let changed = false;
	const out: Rule<'link'>[] = [];
	for (let i = 0; i < members.length; i++) {
		const cur = members[i]!;
		const next = members[i + 1];
		const curSep = cur.type === REPEAT || cur.type === REPEAT1 ? cur.separator : undefined;
		const isSepRepeat = curSep !== undefined && !curSep.trailing;
		const isOptionalSepLit = (r: Rule<'link'> | undefined, sep: { value: Rule<'link'> }): boolean => {
			if (!r || r.type !== OPTIONAL) return false;
			return rulesEqual(r.content, sep.value);
		};
		if (isSepRepeat && isOptionalSepLit(next, curSep!)) {
			out.push({ ...(cur as RepeatRule | Repeat1Rule), separator: { ...curSep!, trailing: 'optional' } });
			i++;
			changed = true;
			continue;
		}
		out.push(cur);
	}
	return changed ? out : null;
}

export function liftCommaSep(members: Rule<'link'>[]): Rule<'link'> | null {
	if (members.length < 2 || members.length > 3) return null;

	const repeatIdx = findRepeatWithSeparator(members);
	if (repeatIdx === -1) return null;
	const repeatNode = members[repeatIdx] as RepeatRule | Repeat1Rule;
	const sep = repeatNode.separator!;
	const elem = repeatNode.content;

	const matchesElem = (r: Rule<'link'>): boolean => rulesEqual(r, elem);
	const matchesOptionalSep = (r: Rule<'link'>): boolean => {
		if (r.type !== OPTIONAL) return false;
		return rulesEqual(r.content, sep.value);
	};

	if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
		return { type: REPEAT1, content: elem, separator: { ...sep, leading: undefined } };
	}
	if (members.length === 3 && repeatIdx === 1 && matchesElem(members[0]!) && matchesOptionalSep(members[2]!)) {
		return { type: REPEAT1, content: elem, separator: { ...sep, leading: undefined, trailing: 'optional' } };
	}
	if (members.length === 3 && repeatIdx === 2 && rulesEqual(members[0]!, sep.value) && matchesElem(members[1]!)) {
		return { type: REPEAT1, content: elem, separator: { ...sep, leading: 'mandatory' } };
	}
	if (repeatIdx === 1 && matchesOptionalSep(members[0]!)) {
		if (members.length === 2) {
			return { type: REPEAT1, content: elem, separator: { ...sep, leading: 'optional' } };
		}
		if (members.length === 3 && matchesOptionalSep(members[2]!)) {
			return { type: REPEAT1, content: elem, separator: { ...sep, leading: 'optional', trailing: 'optional' } };
		}
	}
	return null;
}
function findRepeatWithSeparator(members: Rule<'link'>[]): number {
	return members.findIndex((m) => (m.type === REPEAT || m.type === REPEAT1) && m.separator !== undefined);
}
function liftSeqMembers(seq: SeqRule<'link'>, members: Rule<'link'>[]): Rule<'link'> {
	const lifted = liftCommaSep(members);
	if (lifted) return { ...carrySeqAttrs(seq), ...lifted };
	const suffixLifted = absorbSuffixSeparatedList(members);
	const absorbed = absorbTrailingSeparator(suffixLifted ?? members);
	return { ...seq, members: absorbed ?? suffixLifted ?? members };
}
function carrySeqAttrs(seq: SeqRule<'link'>): Partial<SeqRule<'link'>> {
	const { members: _members, ...rest } = seq;
	return rest;
}

export function liftSeparators(rule: Rule<'link'>, ctx: LinkCtx): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return liftSeqMembers(
				rule,
				rule.members.map((m) => liftSeparators(m, ctx))
			);
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => liftSeparators(m, ctx)) };
		case REPEAT:
		case REPEAT1: {
			const content = liftSeparators(rule.content, ctx);
			const sep = separatorOf(content);
			if (sep) {
				if (sep.separator.type !== STRING) {
					const diagnostic: CompilerDiagnostic = {
						code: 'non-literal-separator',
						severity: 'warning',
						message: `Rule '${rule.type === REPEAT ? 'repeat' : 'repeat1'}' has a non-literal separator (${sep.separator.type}); rendering this shape is not yet supported (tracked: PR-T, docs/superpowers/specs/2026-05-26-non-slot-separator-rules-design.md).`,
						canProceed: true,
						scope: 'compiler',
						phase: 'link'
					};
					ctx.diagnostics.emit(diagnostic);
				}
				return {
					...rule,
					content: sep.content,
					separator: {
						value: sep.separator,
						trailing: sep.trailing ? 'mandatory' : undefined,
						leading: sep.trailing ? undefined : 'mandatory'
					}
				};
			}
			return { ...rule, content };
		}
		case OPTIONAL:
		case FIELD:
		case TOKEN:
		case ALIAS:
			return { ...rule, content: liftSeparators(rule.content, ctx) };
		default:
			return rule;
	}
}

export function resolveGroupPath(rule: Rule<'link'>, path: string): Rule<'link'> {
	const segments = path.split('/').filter((s) => s.length > 0);
	let cur: Rule<'link'> = rule;
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		const idx = parseInt(seg, 10);
		if (Number.isNaN(idx)) {
			throw new Error(`group path '${path}' has non-numeric segment '${seg}' at position ${i}`);
		}
		cur = stepInto(cur, idx, path);
	}
	return cur;
}
function stepInto(rule: Rule<'link'>, idx: number, fullPath: string): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
		case CHOICE: {
			const m = rule.members[idx];
			if (!m) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} out of range in ${rule.type} of ${rule.members.length} members`
				);
			}
			return m;
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case ALIAS:
		case GROUP:
			if (idx !== 0) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} invalid for wrapper '${rule.type}' (only 0 is content)`
				);
			}
			return (rule as { content: Rule<'link'> }).content;
		default:
			throw new Error(`group path '${fullPath}' does not resolve: cannot descend into rule of type '${rule.type}'`);
	}
}

export interface DeriveSynthesizedNameArgs {
	parentKind: string;
	path: string;
	discriminator: string;
	polymorphs: Record<string, Record<string, string> | undefined>;
}

export function deriveSynthesizedName(args: DeriveSynthesizedNameArgs): string {
	const { parentKind, path, discriminator, polymorphs } = args;
	const polymorphsForKind = polymorphs[parentKind] ?? {};
	const segments = path.split('/').filter((s) => s.length > 0);

	const contributions: string[] = [];
	for (let i = 1; i <= segments.length; i++) {
		const prefix = segments.slice(0, i).join('/');
		if (prefix in polymorphsForKind) {
			contributions.push(polymorphsForKind[prefix]!);
		}
	}

	const base = parentKind.startsWith('_') ? parentKind : '_' + parentKind;
	return [base, ...contributions, discriminator].join('_');
}

export interface ValidateGroupsArgs {
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	rules: Record<string, Rule<'link'>>;
	warn?: (msg: string) => void;
}

function resolveGroupsConfigKey(kind: string, rules: Record<string, Rule<'link'>>): string | undefined {
	if (kind in rules) return kind;
	if (!kind.startsWith('_')) return undefined;
	const visibleName = kind.slice(1);
	return visibleName in rules ? visibleName : undefined;
}

export function validateGroupsConfig(args: ValidateGroupsArgs): void {
	const { groups, polymorphs, rules, warn } = args;
	const emitWarn = warn ?? ((msg: string) => console.warn(`[groups] ${msg}`));

	for (const [kind, lifts] of Object.entries(groups)) {
		if (!lifts) continue;
		const resolvedKey = resolveGroupsConfigKey(kind, rules);
		const root = resolvedKey !== undefined ? rules[resolvedKey] : undefined;
		if (!root) {
			throw new Error(`groups['${kind}']: kind not in rule map`);
		}
		const polysForKind = polymorphs[kind] ?? {};
		const liftPaths = Object.keys(lifts);

		for (const path of liftPaths) {
			const discriminator = lifts[path]!;

			let target: Rule<'link'>;
			try {
				target = resolveGroupPath(root, path);
			} catch (e) {
				throw new Error(`groups['${kind}']['${path}']: ${(e as Error).message}`);
			}

			if (discriminator.length === 0) {
				throw new Error(`groups['${kind}']['${path}']: discriminator must be a non-empty identifier`);
			}
			if (!isAsciiIdentifier(discriminator)) {
				throw new Error(`groups['${kind}']['${path}']: discriminator '${discriminator}' is not a valid identifier`);
			}

			for (const polyPath of Object.keys(polysForKind)) {
				if (polyPath === path) {
					throw new Error(
						`groups['${kind}']['${path}'] and polymorphs['${kind}']['${polyPath}'] target the same position; pick one`
					);
				}
				if (isAncestorPath(path, polyPath)) {
					const synName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
					throw new Error(
						`groups['${kind}']['${path}'] would lift content containing polymorphs['${kind}']['${polyPath}']; ` +
							`rewrite the inner polymorph relative to the lifted kind (${synName}) or remove the overlapping entry`
					);
				}
			}

			for (const otherPath of liftPaths) {
				if (otherPath === path) continue;
				if (isAncestorPath(path, otherPath)) {
					throw new Error(
						`groups['${kind}']['${path}'] contains another group lift at '${otherPath}'; nested group lifts are not supported`
					);
				}
			}

			const synthName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
			if (synthName in rules) {
				throw new Error(
					`groups['${kind}']['${path}'] would synthesize ${synthName}, but a rule with that name already exists; pick a different discriminator`
				);
			}

			if (!hasStructuralMember(target)) {
				emitWarn(
					`groups['${kind}']['${path}']: lifted body has no structural members (purely literal/punctuation content)`
				);
			}
		}
	}
}
function isAncestorPath(ancestor: string, descendant: string): boolean {
	if (ancestor === descendant) return false;
	const a = ancestor.split('/');
	const d = descendant.split('/');
	if (a.length >= d.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== d[i]) return false;
	}
	return true;
}
function hasStructuralMember(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case FIELD:
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasStructuralMember);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case ALIAS:
		case GROUP:
			return hasStructuralMember((rule as { content: Rule<'link'> }).content);
		default:
			return false;
	}
}

export interface ApplyGroupOverridesArgs {
	rules: Record<string, Rule<'link'>>;
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	warn?: (msg: string) => void;
}

export interface ApplyGroupOverridesResult {
	rules: Record<string, Rule<'link'>>;
	synthesizedKinds: readonly string[];
}

export function applyGroupOverrides(args: ApplyGroupOverridesArgs): ApplyGroupOverridesResult {
	validateGroupsConfig(args);

	const newRules: Record<string, Rule<'link'>> = { ...args.rules };
	const synthesizedKinds: string[] = [];

	for (const [kind, lifts] of Object.entries(args.groups)) {
		if (!lifts || Object.keys(lifts).length === 0) continue;
		const resolvedKey = resolveGroupsConfigKey(kind, newRules) ?? kind;
		const sortedPaths = Object.keys(lifts).sort((a, b) => b.length - a.length);
		let parentBody = clone(newRules[resolvedKey]!);

		for (const path of sortedPaths) {
			const discriminator = lifts[path]!;
			const synName = deriveSynthesizedName({
				parentKind: kind,
				path,
				discriminator,
				polymorphs: args.polymorphs
			});
			const target = resolveGroupPath(parentBody, path);
			const aliasFace = namedAliasFaceOf(target);
			if (aliasFace !== undefined) {
				console.warn(
					`[codegen] group-lift ${kind}/${path} (${discriminator}) rides the visible alias '${aliasFace}' — no hidden kind minted`
				);
				continue;
			}
			const { liftedBody, replacement } = liftRule(target, synName, discriminator);

			parentBody = replaceAtPath(parentBody, path, replacement);
			newRules[synName] = liftedBody;
			synthesizedKinds.push(synName);
		}

		newRules[resolvedKey] = parentBody;
	}

	return { rules: newRules, synthesizedKinds };
}
function namedAliasFaceOf(target: Rule<'link'>): string | undefined {
	switch (target.type) {
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
			return namedAliasFaceOf(target.content);
		case CHOICE: {
			const arms = target.members.filter((m) => !isBlankRule(m));
			return arms.length === 1 ? namedAliasFaceOf(arms[0]!) : undefined;
		}
		case ALIAS:
			return target.named === true ? target.value : undefined;
		case SEQ:
		case FIELD:
		case SUPERTYPE:
		case GROUP:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		case SYMBOL:
		case TOKEN:
			return undefined;
		default:
			return assertNever(target);
	}
}

function liftRule(
	target: Rule<'link'>,
	synName: string,
	_discriminator: string
): { liftedBody: Rule<'link'>; replacement: Rule<'link'> } {
	const synSym = { ...sym(synName), metadata: makeRuleMetadata({ symbolSource: 'group-lift' }) };
	switch (target.type) {
		case OPTIONAL:
			return {
				liftedBody: target.content,
				replacement: { type: OPTIONAL, content: synSym } as Rule<'link'>
			};
		case REPEAT:
			return {
				liftedBody: target.content,
				replacement: { type: REPEAT, content: synSym, separator: target.separator } as Rule<'link'>
			};
		case REPEAT1:
			return {
				liftedBody: target.content,
				replacement: { type: REPEAT1, content: synSym, separator: target.separator } as Rule<'link'>
			};
		default:
			return { liftedBody: target, replacement: synSym };
	}
}
function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export function stampStaticRenderAs(
	rules: Record<string, Rule<'link'>>,
	renderAs: Record<string, Rule<'link'>>
): Record<string, Rule<'link'>> {
	const renderStamps: Record<string, string> = {};
	const blankStamps = new Set<string>();
	for (const [sym, body] of Object.entries(renderAs)) {
		if (body.type === STRING) renderStamps[sym] = body.value;
		else if (isBlankRule(body)) blankStamps.add(sym);
	}
	if (Object.keys(renderStamps).length === 0 && blankStamps.size === 0) return rules;

	const symToLit: Record<string, string> = { ...renderStamps };
	for (const [sym, body] of Object.entries(rules)) {
		if (sym in symToLit) continue;
		if (body.type !== STRING) continue;
		for (const [renderKey, lit] of Object.entries(renderStamps)) {
			if (sym.endsWith(renderKey) && body.value === lit) {
				symToLit[sym] = lit;
				break;
			}
		}
	}
	if (Object.keys(symToLit).length === 0 && blankStamps.size === 0) return rules;

	const out: Record<string, Rule<'link'>> = {};
	for (const [name, rule] of Object.entries(rules)) {
		if (blankStamps.has(name)) continue;
		out[name] = rewriteRuleForStamp(rule, symToLit, blankStamps);
	}
	return out;
}
function isBlankRule(rule: Rule<'link'>): boolean {
	return (rule.type === CHOICE && rule.members.length === 0) || (rule.type === SEQ && rule.members.length === 0);
}
function rewriteRuleForStamp(
	rule: Rule<'link'>,
	symToLit: Record<string, string>,
	blankStamps: ReadonlySet<string>
): Rule<'link'> {
	switch (rule.type) {
		case SYMBOL: {
			const lit = symToLit[rule.name];
			if (lit !== undefined) return withId({ type: STRING, value: lit }, rule.id);
			if (blankStamps.has(rule.name)) return withId({ type: CHOICE, members: [] }, rule.id);
			return rule;
		}

		case FIELD: {
			const inner = unwrapAliasForCheck(rule.content);
			if (inner.type === SYMBOL) {
				const lit = symToLit[inner.name];
				if (lit !== undefined) return withId({ type: STRING, value: lit }, rule.id ?? inner.id);
				if (blankStamps.has(inner.name)) return withId({ type: CHOICE, members: [] }, rule.id);
			}
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) };
		}

		case ALIAS:
			return rule;

		case TOKEN:
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) } as Rule<'link'>;

		case SEQ:
			return { ...rule, members: rule.members.map((m) => rewriteRuleForStamp(m, symToLit, blankStamps)) };

		case CHOICE: {
			const members = rule.members.map((m) => rewriteRuleForStamp(m, symToLit, blankStamps));
			const nonBlank = members.filter((m) => !isBlankRule(m));
			const hadBlank = nonBlank.length < members.length;
			if (!hadBlank) return { ...rule, members };
			if (nonBlank.length === 0) return withId({ type: CHOICE, members: [] }, rule.id);
			if (nonBlank.length === 1) return withId({ type: OPTIONAL, content: nonBlank[0]! }, rule.id);
			return withId({ type: OPTIONAL, content: { type: CHOICE, members: nonBlank } }, rule.id);
		}

		default:
			return rule;
	}
}
function unwrapAliasForCheck(rule: Rule<'link'>): Rule<'link'> {
	if (rule.type === TOKEN) return unwrapAliasForCheck(rule.content);
	return rule;
}

export interface RefinePathResolution {
	readonly fieldName: string | undefined;
	readonly choice: ChoiceRule<'link'> | EnumRule<'link'>;
}

export function validateRefineForms(
	kind: string,
	rule: Rule<'link'>,
	forms: readonly RefineForm[],
	rules?: Readonly<Record<string, Rule<'link'>>>
): void {
	for (const form of forms) {
		for (const [pathStr, selection] of Object.entries(form.selections)) {
			const resolution = resolveRefinePath(kind, form.name, pathStr, rule, rules);
			validateSelection(kind, form.name, pathStr, resolution.choice, selection);
		}
	}
}

export function resolveRefinePath(
	kind: string,
	formName: string,
	pathStr: string,
	rule: Rule<'link'>,
	rules?: Readonly<Record<string, Rule<'link'>>>
): RefinePathResolution {
	const segments = parsePath(pathStr);
	if (segments.length === 0) {
		throw new Error(`refine(${kind}) form '${formName}': path '${pathStr}' is empty`);
	}
	let cur: Rule<'link'> = rule;
	let fieldName: string | undefined;
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		const res = stepPath(cur, seg, kind, formName, pathStr);
		cur = res.next;
		if (seg.kind === 'fieldName') fieldName = seg.name;
	}
	const final = unwrapToChoice(cur, rules);
	if (!final) {
		throw new Error(
			`refine(${kind}) form '${formName}': path '${pathStr}' does not resolve to a choice (got '${cur.type}')`
		);
	}
	return { fieldName, choice: final };
}
function stepPath(
	rule: Rule<'link'>,
	seg: PathSegment,
	kind: string,
	formName: string,
	pathStr: string
): { next: Rule<'link'> } {
	switch (seg.kind) {
		case 'fieldName': {
			const target = findFieldByName(rule, seg.name);
			if (!target) {
				throw new Error(
					`refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.name}:' does not match any field in rule (type '${rule.type}')`
				);
			}
			return { next: target.content };
		}
		case 'index': {
			const members = membersOf(rule);
			if (!members) {
				throw new Error(
					`refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.value}' cannot descend into '${rule.type}'`
				);
			}
			const idx = seg.value < 0 ? members.length + seg.value : seg.value;
			if (idx < 0 || idx >= members.length) {
				throw new Error(
					`refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.value}' out of bounds for ${rule.type} (length ${members.length})`
				);
			}
			return { next: members[idx]! };
		}
		case 'wildcard': {
			const members = membersOf(rule);
			if (members && members.length > 0) {
				return { next: members[0]! };
			}
			const content = singleContentOf(rule);
			if (content) return { next: content };
			throw new Error(
				`refine(${kind}) form '${formName}': path '${pathStr}' wildcard cannot descend into '${rule.type}'`
			);
		}
		case 'kind-match':
			throw new Error(
				`refine(${kind}) form '${formName}': path '${pathStr}' uses kind-match '(${seg.name})' — refine paths only support positional indices and 'name:' field traversal`
			);
	}
}
function unwrapToChoice(
	rule: Rule<'link'>,
	rules?: Readonly<Record<string, Rule<'link'>>>
): ChoiceRule<'link'> | EnumRule<'link'> | undefined {
	let cur = rule;
	const visitedSymbols = new Set<string>();
	for (;;) {
		if (isChoice(cur)) return cur;
		if (isOptional(cur) || isRepeat(cur) || isRepeat1(cur)) {
			cur = cur.content;
			continue;
		}
		if (isSymbol(cur) && rules !== undefined) {
			if (visitedSymbols.has(cur.name)) return undefined;
			visitedSymbols.add(cur.name);
			const target = rules[cur.name];
			if (target !== undefined) {
				cur = target;
				continue;
			}
		}
		return undefined;
	}
}
function findFieldByName(rule: Rule<'link'>, fieldName: string): FieldRule | undefined {
	if (isField(rule)) return rule.name === fieldName ? rule : undefined;
	if (isSeq(rule)) {
		for (const m of rule.members) {
			const hit = findFieldByName(m, fieldName);
			if (hit) return hit;
		}
		return undefined;
	}
	if (isOptional(rule) || isRepeat(rule) || isRepeat1(rule)) {
		return findFieldByName(rule.content, fieldName);
	}
	return undefined;
}
function validateSelection(
	kind: string,
	formName: string,
	pathStr: string,
	choice: ChoiceRule<'link'> | EnumRule<'link'>,
	selection: number | string
): void {
	const arms: readonly Rule<'link'>[] = choice.members;
	if (typeof selection === 'number') {
		if (selection < 0 || selection >= arms.length) {
			throw new Error(
				`refine(${kind}) form '${formName}': path '${pathStr}' selection index ${selection} out of range (choice has ${arms.length} branches)`
			);
		}
		return;
	}
	const stringValues = arms.map(unwrapToStringValue).filter((v): v is string => v !== undefined);
	if (!stringValues.includes(selection)) {
		throw new Error(
			`refine(${kind}) form '${formName}': path '${pathStr}' selection '${selection}' does not match any string branch of the choice (available: ${stringValues.map((v) => `'${v}'`).join(', ') || '<none>'})`
		);
	}
}
function unwrapToStringValue(rule: Rule<'link'>): string | undefined {
	return literalTextOf(rule);
}

export function narrowedFieldLiteralsForForm(
	rule: Rule<'link'>,
	form: RefineForm,
	rules?: Readonly<Record<string, Rule<'link'>>>
): NarrowedField[] {
	const out: NarrowedField[] = [];
	for (const [pathStr, selection] of Object.entries(form.selections)) {
		const resolution = resolveRefinePath('<emit>', form.name, pathStr, rule, rules);
		if (!resolution.fieldName) continue;
		const literal = resolveSelectionLiteral(resolution.choice, selection);
		if (literal === undefined) continue;
		out.push({ fieldName: resolution.fieldName, literal });
	}
	return out;
}

export function resolveSelectionLiteral(
	choice: ChoiceRule<'link'> | EnumRule<'link'>,
	selection: number | string
): string | undefined {
	if (typeof selection === 'string') return selection;
	const arm = choice.members[selection];
	if (!arm) return undefined;
	return unwrapToStringValue(arm);
}
function membersOf(rule: Rule<'link'>): Rule<'link'>[] | undefined {
	if (rule.type === SEQ || rule.type === CHOICE) return rule.members;
	return undefined;
}
function singleContentOf(rule: Rule<'link'>): Rule<'link'> | undefined {
	switch (rule.type) {
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case GROUP:
			return rule.content;
		default:
			return undefined;
	}
}
