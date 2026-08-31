import {
	ALIAS,
	CHOICE,
	FIELD,
	GROUP,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import { sym } from '../types/rule.ts';
import type {
	AliasRule,
	ChoiceRule,
	FieldRule,
	OptionalRule,
	PatternRule,
	Repeat1Rule,
	RepeatRule,
	Rule,
	SeqRule,
	StringRule,
	SymbolRef,
	SymbolRule,
	TokenRule
} from '../types/rule.ts';
import { normalizeEnumMembers } from '../dsl/rule-metadata.ts';
import { structuralBuilder } from '../dsl/builders.ts';
import type { RawGrammar, DesugarDivergenceEvent, RuleProvenance } from './types.ts';
import { attachReferenceRuleIds, buildRuleCatalog } from './rule-catalog.ts';
import { isComplexBody, isNonInlinableLeafShape, isParserHiddenName } from '../dsl/rule-patterns.ts';
import { collectUnreachableHiddenRules } from '../util/reachable-rules.ts';
import { withRoleScope } from '../dsl/primitives/role.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { ENRICH_UNALIAS_DIAGNOSTICS_KEY, getEnrichUnaliasDiagnostics } from '../dsl/enrich.ts';
import type { WireContext, RefineForm } from '../dsl/wire/wire.ts';

type Input = string | RegExp | Rule<'evaluate'>;

interface SymbolRuleWithRef extends SymbolRule<'evaluate'> {
	readonly _ref?: SymbolRef;
}

function coerceToRule(input: Input): Rule<'evaluate'> {
	if (input === undefined || input === null) {
		throw new Error('Undefined symbol');
	}

	if (typeof input === 'string') {
		return { type: STRING, value: input } satisfies StringRule<'evaluate'>;
	}

	if (input instanceof RegExp) {
		return { type: PATTERN, value: input.source } satisfies PatternRule<'evaluate'>;
	}

	if (typeof input === 'object' && 'type' in input) {
		return input as Rule<'evaluate'>;
	}

	throw new TypeError(`Invalid rule: ${input}`);
}

function seq(...members: Input[]): Rule<'evaluate'> {
	const normalized = members.map(coerceToRule);

	if (normalized.length === 1) return normalized[0]!;

	return structuralBuilder.seq(...normalized);
}

function choice(...members: Input[]): Rule<'evaluate'> {
	const normalized = members.map(coerceToRule);

	if (normalized.length === 1) return normalized[0]!;

	const isBlank = (r: Rule<'evaluate'>): boolean =>
		(r.type === SEQ && r.members.length === 0) || (r.type === CHOICE && r.members.length === 0);
	const blankIdx = normalized.findIndex(isBlank);
	if (blankIdx !== -1 && normalized.length === 2) {
		const other = normalized[1 - blankIdx]!;
		return optional(other);
	}

	if (normalized.length > 0 && normalized.every((m) => m.type === STRING)) {
		return normalizeEnumMembers(normalized as StringRule<'evaluate'>[], { author: 'grammar' });
	}

	return structuralBuilder.choice(...normalized);
}

function optional(content: Input): Rule<'evaluate'> {
	const resolved = coerceToRule(content);
	walkRefs(resolved, (ref) => {
		ref.optional = true;
	});
	return structuralBuilder.optional(resolved);
}

function repeat(content: Input): Rule<'evaluate'> {
	const resolved = coerceToRule(content);
	walkRefs(resolved, (ref) => {
		ref.repeated = true;
	});
	return structuralBuilder.repeat(resolved);
}

function repeat1(content: Input): Rule<'evaluate'> {
	const resolved = coerceToRule(content);
	walkRefs(resolved, (ref) => {
		ref.repeated = true;
	});
	return structuralBuilder.repeat1(resolved);
}

function createProxy(currentRule: string, refs: SymbolRef[]): Record<string, SymbolRuleWithRef> {
	return new Proxy({} as Record<string, SymbolRuleWithRef>, {
		get(_target, name: string): SymbolRuleWithRef {
			const ref: SymbolRef = { refType: 'symbol', from: currentRule, to: name };
			refs.push(ref);
			return { ...sym(name), _ref: ref };
		}
	});
}

function getRef(rule: Rule<'evaluate'>): SymbolRef | undefined {
	return (rule as SymbolRuleWithRef)._ref;
}

function walkRefs(rule: Rule<'evaluate'>, visit: (ref: SymbolRef) => void): void {
	const ref = getRef(rule);
	if (ref) visit(ref);
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			for (const m of (rule as { members: Rule<'evaluate'>[] }).members) walkRefs(m, visit);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case 'prec' as never:
			walkRefs((rule as { content: Rule<'evaluate'> }).content, visit);
			return;
		case FIELD:
		case ALIAS:
			return;
		default:
			return;
	}
}

function field(name: string, content?: Input): FieldRule<'evaluate'> {
	if (content === undefined) {
		return {
			type: FIELD,
			name,
			content: { type: STRING, value: '' },
			_needsContent: true
		};
	}
	const resolved = coerceToRule(content);
	const built = structuralBuilder.field(name, resolved);
	walkRefs(built.content, (ref) => {
		if (ref.fieldName === undefined) ref.fieldName = name;
	});
	return built;
}

interface TokenFn {
	(content: Input): TokenRule<'evaluate'>;
	immediate: (content: Input) => Rule<'evaluate'>;
}

const token: TokenFn = Object.assign(
	function token(content: Input): TokenRule<'evaluate'> {
		return structuralBuilder.token(coerceToRule(content));
	},
	{
		immediate(content: Input): Rule<'evaluate'> {
			return structuralBuilder.token.immediate(coerceToRule(content));
		}
	}
);

interface PrecFn {
	(precedence: number | string, content: Input): Rule<'evaluate'>;
	left: (precedence: number | string, content: Input) => Rule<'evaluate'>;
	right: (precedence: number | string, content: Input) => Rule<'evaluate'>;
	dynamic: (precedence: number, content: Input) => Rule<'evaluate'>;
}

const prec: PrecFn = Object.assign(
	function prec(precedenceOrContent: number | string | Input, content?: Input): Rule<'evaluate'> {
		if (content === undefined) return coerceToRule(precedenceOrContent as Input);
		return structuralBuilder.prec(precedenceOrContent as number, coerceToRule(content));
	},
	{
		left(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return coerceToRule(precedenceOrContent as Input);
			return structuralBuilder.prec.left(precedenceOrContent as number, coerceToRule(content));
		},
		right(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return coerceToRule(precedenceOrContent as Input);
			return structuralBuilder.prec.right(precedenceOrContent as number, coerceToRule(content));
		},
		dynamic(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return coerceToRule(precedenceOrContent as Input);
			return structuralBuilder.prec.dynamic(precedenceOrContent as number, coerceToRule(content));
		}
	}
);

function stripPrecedenceWrappers(rules: Record<string, Rule<'evaluate'>>): void {
	const isPrecType = (t: string): boolean =>
		t === 'PREC' || t === 'PREC_LEFT' || t === 'PREC_RIGHT' || t === 'PREC_DYNAMIC';
	const peel = (r: Rule<'evaluate'>): Rule<'evaluate'> => {
		let out = r;
		while (isPrecType(out.type)) out = (out as unknown as { content: Rule<'evaluate'> }).content;
		return out;
	};
	const walker = new RuleWalker<Rule<'evaluate'>>(rules);
	for (const name of Object.keys(rules)) {
		const rule = rules[name];
		if (!rule) continue;
		const stripped = peel(walker.map(rule, peel));
		if (stripped !== rule) rules[name] = stripped;
	}
}

function foldImmediateTokenRule(rule: Rule<'evaluate'>): Rule<'evaluate'> {
	const toToken = (r: Rule<'evaluate'>): Rule<'evaluate'> =>
		r.type === 'IMMEDIATE_TOKEN'
			? ({
					type: TOKEN,
					content: (r as unknown as { content: Rule<'evaluate'> }).content,
					immediate: true
				} as Rule<'evaluate'>)
			: r;
	const walker = new RuleWalker<Rule<'evaluate'>>({});
	return toToken(walker.map(rule, toToken));
}

function normalizeImmediateTokens(rules: Record<string, Rule<'evaluate'>>): void {
	for (const name of Object.keys(rules)) {
		const rule = rules[name];
		if (!rule) continue;
		const normalized = foldImmediateTokenRule(rule);
		if (normalized !== rule) rules[name] = normalized;
	}
}

function alias(rule: Input, value: string | Rule<'evaluate'>): AliasRule<'evaluate'> {
	const content = coerceToRule(rule);
	if (typeof value === 'string' || (value !== null && typeof value === 'object' && value.type === SYMBOL)) {
		return structuralBuilder.alias(content, value);
	}
	throw new Error(`Invalid alias value: ${value}`);
}

function blank(): Rule<'evaluate'> {
	return { type: CHOICE, members: [] };
}

function string(value: string): StringRule<'evaluate'> {
	return structuralBuilder.string(value);
}

interface GrammarOptions {
	name: string;
	rules: Record<string, ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input>;
	extras?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	externals?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	supertypes?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	factoryInline?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	inline?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	conflicts?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[][];
	word?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => SymbolRuleWithRef;
	precedences?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[][];
}

interface MetadataSinks {
	extras: string[];
	externals: string[];
	supertypes: string[];
	factoryInline: string[];
	inline: string[];
	conflicts: string[][];
}

interface EvaluateCtx {
	readonly rules: Record<string, Rule<'evaluate'>>;
	readonly provenanceByKind: Map<string, RuleProvenance>;
	readonly refs: SymbolRef[];
	readonly opts: GrammarOptions;
	readonly baseRules: Record<string, Rule<'evaluate'>>;
	readonly baseGrammar: unknown;
	readonly externals: readonly string[];
	readonly isExtension: boolean;
	readonly sinks: MetadataSinks;
	readonly setWord: (w: string) => void;
	readonly bodyPatternZeroMatches: string[];
	readonly desugarDivergences: DesugarDivergenceEvent[];
}

function grammarFn(optionsOrBase: GrammarOptions | { grammar: any }, options?: GrammarOptions): { grammar: any } {
	let baseRules: Record<string, Rule<'evaluate'>> = {};
	let baseGrammar: any = null;
	let opts: GrammarOptions;

	if (options === undefined) {
		opts = optionsOrBase as GrammarOptions;
	} else {
		baseGrammar = (optionsOrBase as { grammar: any }).grammar;
		baseRules = { ...baseGrammar.rules };
		opts = options;
	}

	mergeEnrichOverridesIntoOptions(optionsOrBase, opts);

	const refs: SymbolRef[] = seedRefsFromBaseGrammar(baseGrammar);
	const rules: Record<string, Rule<'evaluate'>> = { ...baseRules };
	const provenanceByKind = new Map<string, RuleProvenance>();

	const extras: string[] = [];
	const externals: string[] = [];
	const supertypes: string[] = [];
	const factoryInline: string[] = [];
	const inline: string[] = [];
	const conflicts: string[][] = [];
	let word: string | null = null;

	const sinks: MetadataSinks = { extras, externals, supertypes, factoryInline, inline, conflicts };
	const ctx: EvaluateCtx = {
		rules,
		provenanceByKind,
		refs,
		opts,
		baseRules,
		baseGrammar,
		externals,
		isExtension: baseGrammar !== null,
		sinks,
		setWord: (w) => {
			word = w;
		},
		bodyPatternZeroMatches: [],
		desugarDivergences: []
	};

	const { roles: collectedRoles } = withRoleScope(() => {
		evaluateRulesAndInjectSynthetics(rules, ctx);
		stripPrecedenceWrappers(rules);
		normalizeImmediateTokens(rules);
		evaluateMetadataCallbacksInScope(opts, ctx);
	});

	inheritBaseGrammarMetadata(opts, ctx);

	const refineForms = drainRefineMetadata(opts);
	const groups = drainGroupsMetadata(opts);
	const polymorphsConfig = drainPolymorphsConfigMetadata(opts);
	const expectDiagnostics = drainExpectDiagnosticsMetadata(opts);
	const expectTestFailures = drainExpectTestFailuresMetadata(opts);
	const orphanedSyntheticGroups = drainOrphanedSyntheticGroupsMetadata(opts);
	const renderAs = drainRenderAsMetadata(opts, ctx);
	const visibleExternals = drainVisibleExternalsMetadata(opts, ctx);

	synthesizeInlineAliasSources(rules, ctx);
	const identified = buildRuleCatalog(rules, { provenanceByKind });
	const references = attachReferenceRuleIds(refs, { ruleCatalog: identified.ruleCatalog });

	const grammarResult = {
		name: opts.name,
		rules: identified.rules,
		extras,
		externals,
		supertypes,
		factoryInline,
		inline,
		conflicts,
		word,
		references,
		ruleCatalog: identified.ruleCatalog,
		externalRoles: collectedRoles.size > 0 ? collectedRoles : undefined,
		refineForms,
		groups,
		polymorphsConfig,
		renderAs,
		visibleExternals,
		expectDiagnostics,
		expectTestFailures,
		orphanedSyntheticGroups,
		bodyPatternZeroMatches: ctx.bodyPatternZeroMatches.length > 0 ? [...ctx.bodyPatternZeroMatches] : undefined,
		desugarDivergences: ctx.desugarDivergences.length > 0 ? [...ctx.desugarDivergences] : undefined
	} satisfies RawGrammar;
	const inheritedUnaliasDiagnostics = getEnrichUnaliasDiagnostics(optionsOrBase);
	if (inheritedUnaliasDiagnostics.length > 0) {
		Object.defineProperty(grammarResult, ENRICH_UNALIAS_DIAGNOSTICS_KEY, {
			value: inheritedUnaliasDiagnostics,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	return { grammar: grammarResult };
}

const canonicalWalker = new RuleWalker<Rule<'evaluate'>>({});

function canonicalizeRawGrammar(raw: RawGrammar): RawGrammar {
	const inlineNames = new Set(raw.inline);
	const supertypes = new Set(raw.supertypes);
	const stampRef = (rule: Rule<'evaluate'>): Rule<'evaluate'> => {
		if (rule.type === ALIAS) {
			return rule.content.type === SYMBOL && rule.content.inline !== false
				? { ...rule, content: { ...rule.content, inline: false } }
				: rule;
		}
		if (rule.type !== SYMBOL) return rule;
		const hidden = isParserHiddenName(rule.name);
		const target = raw.rules[rule.name];
		const boundary =
			supertypes.has(rule.name) ||
			(!inlineNames.has(rule.name) && target !== undefined && isNonInlinableLeafShape(target));
		const inline = !boundary && (hidden || inlineNames.has(rule.name));
		return rule.inline === inline ? rule : { ...rule, inline };
	};
	const rules: Record<string, Rule<'evaluate'>> = {};
	for (const [name, rule] of Object.entries(raw.rules)) {
		rules[name] = { ...stampRef(canonicalWalker.map(rule, stampRef)), hidden: isParserHiddenName(name) };
	}
	return { ...raw, rules, visibleInlineNames: raw.inline.filter((name) => !name.startsWith('_')) };
}

function synthesizeInlineAliasSources(rules: Record<string, Rule<'evaluate'>>, ctx: EvaluateCtx): void {
	const externalSet = new Set(ctx.externals);
	const ruleEntries = Object.entries(rules);
	for (const [name, rule] of ruleEntries) {
		rules[name] = rewriteInlineAliases(rule, ctx, externalSet);
	}
}

function rewriteInlineAliases(
	rule: Rule<'evaluate'>,
	ctx: EvaluateCtx,
	externals: ReadonlySet<string>
): Rule<'evaluate'> {
	const { rules, provenanceByKind } = ctx;
	const recurse = (r: Rule<'evaluate'>): Rule<'evaluate'> => rewriteInlineAliases(r, ctx, externals);
	switch (rule.type) {
		case ALIAS: {
			if (rule.named && rule.value) {
				const inner = rule.content;
				const isBareSymbolToKnownSource =
					inner.type === SYMBOL && (rules[inner.name] !== undefined || externals.has(inner.name));
				const targetAlreadyExists = rules[rule.value] !== undefined;
				if (!targetAlreadyExists && !isBareSymbolToKnownSource && inner.type !== STRING) {
					const syntheticHiddenName = `_${rule.value}`;
					if (!rules[syntheticHiddenName]) {
						rules[syntheticHiddenName] = recurse(rule.content);
						provenanceByKind.set(syntheticHiddenName, 'evaluate-synthesized');
						ctx.desugarDivergences.push({ site: 'inline-alias-source', name: syntheticHiddenName });
					}
					return { ...rule, content: { type: SYMBOL, name: syntheticHiddenName } };
				}
			}
			return { ...rule, content: recurse(rule.content) };
		}
		case SEQ:
			return { ...rule, members: rule.members.map((m) => recurse(m)) } as Rule<'evaluate'>;
		case CHOICE:
			return {
				...rule,
				members: rule.members.map((m) => recurse(m))
			} as Rule<'evaluate'>;
		case OPTIONAL:
			return {
				...rule,
				content: recurse((rule as { content: Rule<'evaluate'> }).content)
			} as Rule<'evaluate'>;
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case VARIANT:
		case GROUP:
			return {
				...rule,
				content: recurse((rule as { content: Rule<'evaluate'> }).content)
			} as Rule<'evaluate'>;
		default:
			return rule;
	}
}

function getWireContext(opts: GrammarOptions): WireContext | undefined {
	return (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
}

function drainRefineMetadata(opts: GrammarOptions): Map<string, RefineForm[]> | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || wireCtx.refineForms.size === 0) return undefined;
	return new Map(wireCtx.refineForms);
}

function drainGroupsMetadata(opts: GrammarOptions): Record<string, Record<string, string> | undefined> | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.groups) return undefined;
	const raw = wireCtx.groups as Record<string, unknown>;
	const g: Record<string, Record<string, string> | undefined> = {};
	for (const [k, v] of Object.entries(raw)) {
		if (v === undefined || typeof v === 'function') continue;
		g[k] = v as Record<string, string>;
	}
	if (Object.keys(g).length === 0) return undefined;
	return g;
}

function drainPolymorphsConfigMetadata(
	opts: GrammarOptions
): Record<string, Record<string, string> | undefined> | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.polymorphsConfig) return undefined;
	const p = wireCtx.polymorphsConfig as Record<string, Record<string, string> | undefined>;
	if (Object.keys(p).length === 0) return undefined;
	return { ...p };
}

function drainExpectDiagnosticsMetadata(opts: GrammarOptions): Record<string, readonly string[]> | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.expectDiagnostics) return undefined;
	const e: Record<string, readonly string[]> = {};
	for (const [code, kinds] of Object.entries(wireCtx.expectDiagnostics)) {
		if (kinds !== undefined) e[code] = kinds;
	}
	if (Object.keys(e).length === 0) return undefined;
	return e;
}

function drainExpectTestFailuresMetadata(opts: GrammarOptions): Record<string, string> | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.expectTestFailures) return undefined;
	const e: Record<string, string> = {};
	for (const [kind, reason] of Object.entries(wireCtx.expectTestFailures)) {
		if (reason !== undefined) e[kind] = reason;
	}
	if (Object.keys(e).length === 0) return undefined;
	return e;
}

function drainOrphanedSyntheticGroupsMetadata(opts: GrammarOptions): readonly string[] | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || wireCtx.orphanedSyntheticGroups.size === 0) return undefined;
	return [...wireCtx.orphanedSyntheticGroups];
}

function drainRenderAsMetadata(opts: GrammarOptions, ctx: EvaluateCtx): Record<string, Rule<'evaluate'>> | undefined {
	const { rules, refs, provenanceByKind } = ctx;
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.renderAs) return undefined;

	const $ = createProxy('_renderAs_', refs);
	const rawEntries = wireCtx.renderAs($);
	if (!rawEntries || Object.keys(rawEntries).length === 0) return undefined;

	const result: Record<string, Rule<'evaluate'>> = {};
	for (const [name, rawBody] of Object.entries(rawEntries)) {
		const rule = foldImmediateTokenRule(coerceToRule(rawBody as Input));
		result[name] = rule;
		rules[name] = rule;
		provenanceByKind.set(name, 'evaluate-synthesized');
	}
	return result;
}

function drainVisibleExternalsMetadata(
	opts: GrammarOptions,
	ctx: EvaluateCtx
): Record<string, Rule<'evaluate'>> | undefined {
	const { rules, refs, provenanceByKind } = ctx;
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.visibleExternals) return undefined;

	const $ = createProxy('_visibleExternals_', refs);
	const rawEntries = wireCtx.visibleExternals($);
	if (!rawEntries || Object.keys(rawEntries).length === 0) return undefined;

	const result: Record<string, Rule<'evaluate'>> = {};
	for (const [name, rawBody] of Object.entries(rawEntries)) {
		const rule = foldImmediateTokenRule(coerceToRule(rawBody as Input));
		result[name] = rule;
		rules[name] = rule;
		provenanceByKind.set(name, 'evaluate-synthesized');
	}
	return result;
}

function mergeEnrichOverridesIntoOptions(optionsOrBase: GrammarOptions | { grammar: any }, opts: GrammarOptions): void {
	const enrichOverrides = (
		optionsOrBase as {
			__enrichOverrides__?: Record<string, (...a: any[]) => any>;
		}
	).__enrichOverrides__;
	if (enrichOverrides && opts) {
		if (!opts.rules) opts.rules = {} as Record<string, (...a: any[]) => any>;
		for (const [name, fn] of Object.entries(enrichOverrides)) {
			if (!(name in opts.rules)) opts.rules[name] = fn;
		}
	}
}

function seedRefsFromBaseGrammar(baseGrammar: any): SymbolRef[] {
	return baseGrammar?.references ? [...baseGrammar.references] : [];
}

function evaluateRulesAndInjectSynthetics(rules: Record<string, Rule<'evaluate'>>, ctx: EvaluateCtx): void {
	const { opts, refs, provenanceByKind } = ctx;
	evaluateRuleFunctions(rules, ctx);
	const wireCtx = getWireContext(opts);
	if (wireCtx) {
		injectSyntheticRules(rules, ctx, wireCtx.deposits);
		adoptFinalBaseRules(rules, ctx, wireCtx);
		if (wireCtx.groups) {
			for (const [key, value] of Object.entries(wireCtx.groups)) {
				if (typeof value !== 'function') continue;
				const hiddenName = `_${key}`;
				if (hiddenName in rules) continue;
				const $ = createProxy(hiddenName, refs);
				try {
					const result = (value as ($: unknown, previous: unknown) => unknown).call($, $, undefined);
					if (result && typeof result === 'object' && typeof (result as { type?: unknown }).type === 'string') {
						rules[hiddenName] = coerceToRule(result as Input);
						provenanceByKind.set(hiddenName, 'evaluate-synthesized');
						ctx.desugarDivergences.push({ site: 'body-pattern-group', name: hiddenName });
					}
				} catch {}
			}
		}
		applyPatternReplacement(rules, ctx, wireCtx);
		applyVisibleExternalsRewrite(rules, { evaluateCtx: ctx, wireCtx });
		prunePlaceholderOrphans(rules, wireCtx);
	}
}

function adoptFinalBaseRules(
	rules: Record<string, Rule<'evaluate'>>,
	ctx: EvaluateCtx,
	wireCtx: WireContext | undefined
): void {
	const { baseGrammar, baseRules } = ctx;
	if (baseGrammar === null || baseGrammar === undefined) return;
	const finalBase = (baseGrammar as { rules: Record<string, Rule<'evaluate'>> }).rules;
	for (const name of Object.keys(finalBase)) {
		const finalRule = finalBase[name];
		const entry = baseRules[name];
		if (finalRule === entry) continue;
		if (rules[name] !== entry && wireCtx?.authoredRuleNames.has(name)) continue;
		rules[name] = coerceToRule(finalRule as Input);
	}
}

function prunePlaceholderOrphans(rules: Record<string, Rule<'evaluate'>>, wireCtx: WireContext): void {
	const protectedNames = new Set<string>(wireCtx.deposits.keys());
	for (const name of collectUnreachableHiddenRules(rules, protectedNames)) {
		delete rules[name];
	}
}

interface PatternCandidate {
	readonly name: string;
	readonly body: Rule<'evaluate'>;
	readonly aliasAs?: string;
}

function applyPatternReplacement(
	rules: Record<string, Rule<'evaluate'>>,
	ctx: EvaluateCtx,
	wireCtx: WireContext
): void {
	const { baseRules, provenanceByKind } = ctx;
	const candidates: PatternCandidate[] = [];
	for (const name of wireCtx.authoredRuleNames) {
		if (!name.startsWith('_')) continue;
		if (name in baseRules) continue;
		const body = rules[name];
		if (!body) continue;
		if (!isComplexBody(body)) continue;
		candidates.push({ name, body });
	}
	if (wireCtx.groups) {
		for (const [key, value] of Object.entries(wireCtx.groups)) {
			if (typeof value !== 'function') continue;
			const hiddenName = `_${key}`;
			const body = rules[hiddenName];
			if (!body) continue;
			if (!isComplexBody(body)) continue;
			candidates.push({ name: hiddenName, body, aliasAs: key });
		}
	}
	if (candidates.length === 0) return;

	const candidateNames = new Set(candidates.map((c) => c.name));
	for (const [name, body] of Object.entries(rules)) {
		if (candidateNames.has(name)) continue;
		const rewritten = replacePatterns(body, candidates);
		if (rewritten !== body) {
			rules[name] = rewritten;
		}
	}
	const pathBNames = candidates.filter((c) => c.aliasAs !== undefined).map((c) => c.name);
	if (pathBNames.length > 0) {
		const referenced = new Set<string>();
		const collect = (rule: Rule<'evaluate'>): void => {
			if (rule.type === SYMBOL) {
				referenced.add((rule as SymbolRule<'evaluate'>).name);
				return;
			}
			const r = rule as { members?: Rule<'evaluate'>[]; content?: Rule<'evaluate'> };
			if (Array.isArray(r.members)) r.members.forEach(collect);
			if (r.content) collect(r.content);
		};
		for (const [ruleName, body] of Object.entries(rules)) {
			if (candidateNames.has(ruleName)) continue;
			collect(body);
		}
		for (const name of pathBNames) {
			if (!referenced.has(name)) ctx.bodyPatternZeroMatches.push(name);
		}
	}
	for (const c of candidates) {
		if (!provenanceByKind.has(c.name)) {
			provenanceByKind.set(c.name, 'override-authored-or-replaced');
		}
	}
}

function replacePatterns(rule: Rule<'evaluate'>, candidates: PatternCandidate[]): Rule<'evaluate'> {
	for (const c of candidates) {
		if (patternRulesEqual(rule, c.body)) {
			const symRef = sym(c.name);
			return c.aliasAs !== undefined ? structuralBuilder.alias(symRef, sym(c.aliasAs)) : symRef;
		}
	}
	switch (rule.type) {
		case SEQ: {
			const r = rule as SeqRule<'evaluate'>;
			const members = replaceInArray(r.members, candidates);
			return members === r.members ? rule : ({ ...r, members } as Rule<'evaluate'>);
		}
		case CHOICE: {
			const r = rule as ChoiceRule<'evaluate'>;
			const members = replaceInArray(r.members, candidates);
			return members === r.members ? rule : ({ ...r, members } as Rule<'evaluate'>);
		}
		case OPTIONAL: {
			const r = rule as OptionalRule<'evaluate'>;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		case REPEAT: {
			const r = rule as RepeatRule<'evaluate'>;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		case REPEAT1: {
			const r = rule as Repeat1Rule<'evaluate'>;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		case FIELD: {
			const r = rule as FieldRule<'evaluate'>;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		default:
			return rule;
	}
}

function replaceInArray(members: Rule<'evaluate'>[], candidates: PatternCandidate[]): Rule<'evaluate'>[] {
	let changed = false;
	const out: Rule<'evaluate'>[] = members.map((m) => {
		const r = replacePatterns(m, candidates);
		if (r !== m) changed = true;
		return r;
	});
	return changed ? out : members;
}

function patternRulesEqual(a: Rule<'evaluate'>, b: Rule<'evaluate'>): boolean {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case STRING:
			return a.value === (b as StringRule<'evaluate'>).value;
		case PATTERN:
			return a.value === (b as PatternRule<'evaluate'>).value;
		case SYMBOL:
			return a.name === (b as SymbolRule<'evaluate'>).name;
		case SEQ: {
			const bSeq = b as SeqRule<'evaluate'>;
			return (
				a.members.length === bSeq.members.length && a.members.every((m, i) => patternRulesEqual(m, bSeq.members[i]!))
			);
		}
		case CHOICE: {
			const bCh = b as ChoiceRule<'evaluate'>;
			return (
				a.members.length === bCh.members.length && a.members.every((m, i) => patternRulesEqual(m, bCh.members[i]!))
			);
		}
		case OPTIONAL:
			return patternRulesEqual(a.content, (b as OptionalRule<'evaluate'>).content);
		case REPEAT: {
			const bRep = b as RepeatRule<'evaluate'>;
			return a.separator === bRep.separator && patternRulesEqual(a.content, bRep.content);
		}
		case REPEAT1: {
			const bRep = b as Repeat1Rule<'evaluate'>;
			return a.separator === bRep.separator && patternRulesEqual(a.content, bRep.content);
		}
		case FIELD: {
			const bFld = b as FieldRule<'evaluate'>;
			return a.name === bFld.name && patternRulesEqual(a.content, bFld.content);
		}
		case ALIAS: {
			const bAl = b as AliasRule<'evaluate'>;
			return a.named === bAl.named && a.value === bAl.value && patternRulesEqual(a.content, bAl.content);
		}
		default:
			return false;
	}
}

interface VisibleExternalsRewriteCtx {
	readonly hiddenToVisible: ReadonlyMap<string, string>;
}

function rewriteVisibleExternalRefs(rule: Rule<'evaluate'>, ctx: VisibleExternalsRewriteCtx): Rule<'evaluate'> {
	const { hiddenToVisible } = ctx;
	if (rule.type === SYMBOL) {
		const visibleName = hiddenToVisible.get((rule as SymbolRule<'evaluate'>).name);
		if (visibleName === undefined) return rule;
		return structuralBuilder.alias(rule, sym(visibleName));
	}
	switch (rule.type) {
		case SEQ: {
			const r = rule;
			const members = rewriteVisibleExternalRefsInArray(rule.members, ctx);
			return members === r.members ? rule : { ...rule, members };
		}
		case CHOICE: {
			const r = rule as ChoiceRule<'evaluate'>;
			const members = rewriteVisibleExternalRefsInArray(r.members, ctx);
			return members === r.members ? rule : ({ ...r, members } as Rule<'evaluate'>);
		}
		case OPTIONAL: {
			const r = rule as OptionalRule<'evaluate'>;
			const content = rewriteVisibleExternalRefs(r.content, ctx);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		case REPEAT: {
			const r = rule as RepeatRule<'evaluate'>;
			const content = rewriteVisibleExternalRefs(r.content, ctx);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		case REPEAT1: {
			const r = rule as Repeat1Rule<'evaluate'>;
			const content = rewriteVisibleExternalRefs(r.content, ctx);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		case FIELD: {
			const r = rule as FieldRule<'evaluate'>;
			const content = rewriteVisibleExternalRefs(r.content, ctx);
			return content === r.content ? rule : ({ ...r, content } as Rule<'evaluate'>);
		}
		default:
			return rule;
	}
}

function rewriteVisibleExternalRefsInArray(
	members: Rule<'evaluate'>[],
	ctx: VisibleExternalsRewriteCtx
): Rule<'evaluate'>[] {
	let changed = false;
	const out: Rule<'evaluate'>[] = members.map((m) => {
		const r = rewriteVisibleExternalRefs(m, ctx);
		if (r !== m) changed = true;
		return r;
	});
	return changed ? out : members;
}

interface ApplyVisibleExternalsCtx {
	readonly evaluateCtx: EvaluateCtx;
	readonly wireCtx: WireContext;
}

function applyVisibleExternalsRewrite(rules: Record<string, Rule<'evaluate'>>, ctx: ApplyVisibleExternalsCtx): void {
	const { evaluateCtx, wireCtx } = ctx;
	if (!wireCtx.visibleExternals) return;
	const $ = createProxy('_visibleExternals_', evaluateCtx.refs);
	const rawEntries = wireCtx.visibleExternals($);
	if (!rawEntries) return;
	const hiddenToVisible = new Map<string, string>();
	for (const hiddenName of Object.keys(rawEntries)) {
		hiddenToVisible.set(hiddenName, hiddenName.replace(/^_+/, ''));
	}
	if (hiddenToVisible.size === 0) return;
	const rewriteCtx: VisibleExternalsRewriteCtx = { hiddenToVisible };
	for (const [name, body] of Object.entries(rules)) {
		const rewritten = rewriteVisibleExternalRefs(body, rewriteCtx);
		if (rewritten !== body) rules[name] = rewritten;
	}
}

function evaluateMetadataCallbacksInScope(opts: GrammarOptions, ctx: EvaluateCtx): void {
	evaluateMetadataCallbacks(opts, ctx);
}

function evaluateRuleFunctions(rules: Record<string, Rule<'evaluate'>>, ctx: EvaluateCtx): void {
	const { opts, baseRules, refs, provenanceByKind, isExtension } = ctx;
	for (const [name, ruleFn] of Object.entries(opts.rules)) {
		const $ = createProxy(name, refs);
		const baseRule = baseRules[name];
		const result = ruleFn.call($, $, baseRule);
		rules[name] = coerceToRule(result);
		provenanceByKind.set(name, isExtension ? 'override-authored-or-replaced' : 'grammar-authored');
	}
}

function injectSyntheticRules(
	rules: Record<string, Rule<'evaluate'>>,
	ctx: EvaluateCtx,
	syntheticRules: Map<string, unknown>
): void {
	for (const [name, content] of syntheticRules) {
		if (name in rules) continue;
		rules[name] = content as Rule<'evaluate'>;
		ctx.provenanceByKind.set(name, 'evaluate-synthesized');
	}
}

function inheritBaseGrammarMetadata(opts: GrammarOptions, ctx: EvaluateCtx): void {
	const { sinks, setWord } = ctx;
	const inherited = ((ctx.baseGrammar as { grammar?: unknown } | null | undefined)?.grammar ?? ctx.baseGrammar) as {
		extras?: string[];
		externals?: string[];
		supertypes?: string[];
		factoryInline?: string[];
		inline?: string[];
		conflicts?: string[][];
		word?: string;
	} | null;
	if (inherited) {
		if (!opts.externals && Array.isArray(inherited.externals)) sinks.externals.push(...inherited.externals);
		if (!opts.extras && Array.isArray(inherited.extras)) sinks.extras.push(...inherited.extras);
		if (!opts.supertypes && Array.isArray(inherited.supertypes)) sinks.supertypes.push(...inherited.supertypes);
		if (!opts.factoryInline && Array.isArray(inherited.factoryInline)) {
			sinks.factoryInline.push(...inherited.factoryInline);
		}
		if (!opts.inline && Array.isArray(inherited.inline)) sinks.inline.push(...inherited.inline);
		if (!opts.conflicts && Array.isArray(inherited.conflicts)) sinks.conflicts.push(...inherited.conflicts);
		if (!opts.word && inherited.word) setWord(inherited.word);
	}
}

function appendDedup(sink: string[], value: string): void {
	if (!sink.includes(value)) sink.push(value);
}

function appendCallbackMetadataNames(sink: string[], result: unknown): void {
	if (!Array.isArray(result)) return;
	for (const item of result) {
		if (typeof item === 'string') {
			appendDedup(sink, item);
			continue;
		}
		const n = coerceToRule(item);
		if (n.type === SYMBOL) appendDedup(sink, n.name);
	}
}

function evaluateMetadataCallbacks(opts: GrammarOptions, ctx: EvaluateCtx): void {
	const { refs, sinks, setWord } = ctx;
	const baseGrammar = ctx.baseGrammar as {
		extras?: string[];
		externals?: string[];
		supertypes?: string[];
		factoryInline?: string[];
		inline?: string[];
		conflicts?: string[][];
		word?: string;
	} | null;
	if (opts.extras) {
		const $ = createProxy('_extras_', refs);
		const baseExtras = baseGrammar?.extras ?? [];
		const result = opts.extras.call($, $, baseExtras);
		if (Array.isArray(result)) {
			for (const e of result) {
				const n = coerceToRule(e);
				if (n.type === SYMBOL) appendDedup(sinks.extras, n.name);
				else if (n.type === PATTERN) appendDedup(sinks.extras, n.value);
			}
		}
	}

	if (opts.externals) {
		const $ = createProxy('_externals_', refs);
		const baseExternals = baseGrammar?.externals ?? [];
		const result = opts.externals.call($, $, baseExternals);
		if (Array.isArray(result)) {
			for (const e of result) {
				const n = coerceToRule(e);
				if (n.type === SYMBOL) appendDedup(sinks.externals, n.name);
				else if (n.type === STRING) appendDedup(sinks.externals, n.value);
			}
		}
	}

	if (opts.supertypes) {
		const $ = createProxy('_supertypes_', refs);
		const baseSupertypes = baseGrammar?.supertypes ?? [];
		appendCallbackMetadataNames(sinks.supertypes, opts.supertypes.call($, $, baseSupertypes));
	}

	if (opts.factoryInline) {
		const $ = createProxy('_factory_inline_', refs);
		const baseFactoryInline = baseGrammar?.factoryInline ?? [];
		appendCallbackMetadataNames(sinks.factoryInline, opts.factoryInline.call($, $, baseFactoryInline));
	}

	if (opts.inline) {
		const $ = createProxy('_inline_', refs);
		const baseInline = baseGrammar?.inline ?? [];
		appendCallbackMetadataNames(sinks.inline, opts.inline.call($, $, baseInline));
	}

	if (opts.conflicts) {
		const $ = createProxy('_conflicts_', refs);
		const baseConflicts = baseGrammar?.conflicts ?? [];
		const result = opts.conflicts.call($, $, baseConflicts);
		if (Array.isArray(result)) {
			for (const c of result) {
				if (Array.isArray(c)) {
					sinks.conflicts.push(
						c
							.map((r) => {
								const n = coerceToRule(r);
								return n.type === SYMBOL ? n.name : '';
							})
							.filter(Boolean)
					);
				}
			}
		}
	}

	if (opts.word) {
		const $ = createProxy('_word_', refs);
		const w = opts.word.call($, $);
		setWord(w.name);
	}
}

export async function evaluate(entryPath: string): Promise<RawGrammar> {
	const g = globalThis as Record<string, unknown>;
	const savedGlobals = saveAndInjectDslGlobals(g);

	try {
		return canonicalizeRawGrammar(await importAndExtractGrammar(entryPath));
	} finally {
		restoreSavedGlobals(g, savedGlobals);
	}
}

function saveAndInjectDslGlobals(g: Record<string, unknown>): Record<string, unknown> {
	const dslFunctions: Record<string, unknown> = {
		grammar: grammarFn,
		seq,
		choice,
		optional,
		repeat,
		repeat1,
		sym,
		string,
		field,
		token,
		prec,
		alias,
		blank
	};
	const savedGlobals: Record<string, unknown> = {};
	for (const [name, fn] of Object.entries(dslFunctions)) {
		savedGlobals[name] = g[name];
		g[name] = fn;
	}
	return savedGlobals;
}

async function importAndExtractGrammar(entryPath: string): Promise<RawGrammar> {
	const mod = (await import(entryPath)) as {
		default?: unknown;
		grammar?: unknown;
	};
	const result = (mod.default ?? mod) as { grammar?: unknown };
	const grammarObj = result.grammar ?? result;
	return grammarObj as RawGrammar;
}

function restoreSavedGlobals(g: Record<string, unknown>, savedGlobals: Record<string, unknown>): void {
	for (const [name, original] of Object.entries(savedGlobals)) {
		if (original === undefined) {
			delete g[name];
		} else {
			g[name] = original;
		}
	}
}
