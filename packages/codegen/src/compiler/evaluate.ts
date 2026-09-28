import type { OptionsConfig } from '../dsl/wire/options-block.ts';
import {
	ALIAS,
	CHOICE,
	FIELD,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SYMBOL
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
	SymbolRule,
	TokenRule
} from '../types/rule.ts';
import { structuralBuilder } from '../dsl/builders.ts';
import type { RawGrammar, DesugarDivergenceEvent, EvaluatedGrammar, EvaluationStages, RuleProvenance, StageEvaluation } from './types.ts';
import { canonicalGrammar } from './canonical-rules.ts';
import { isComplexBody, optionalContentOf, ruleListEntryOf, type RuleListEntry } from '../dsl/rule-patterns.ts';
import { withRoleScope } from '../dsl/primitives/role.ts';
import { baseRulesOf } from '../dsl/shared.ts';
import { wire, type PatchSite, type WireContext, type RefineForm } from '../dsl/wire/wire.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';

type Input = string | RegExp | Rule<'evaluate'>;

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
	return structuralBuilder.seq(...members.map(coerceToRule));
}

function choice(...members: Input[]): Rule<'evaluate'> {
	const normalized = members.map(coerceToRule);
	const optionalContent = optionalContentOf(structuralBuilder.choice(...normalized));
	return optionalContent !== undefined ? optional(optionalContent) : structuralBuilder.choice(...normalized);
}

function optional(content: Input): Rule<'evaluate'> {
	return structuralBuilder.optional(coerceToRule(content));
}

function repeat(content: Input): Rule<'evaluate'> {
	return structuralBuilder.repeat(coerceToRule(content));
}

function repeat1(content: Input): Rule<'evaluate'> {
	return structuralBuilder.repeat1(coerceToRule(content));
}

function createProxy(): Record<string, SymbolRule<'evaluate'>> {
	return new Proxy({} as Record<string, SymbolRule<'evaluate'>>, {
		get(_target, name: string): SymbolRule<'evaluate'> {
			return sym(name);
		}
	});
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
	return structuralBuilder.field(name, coerceToRule(content));
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
	function prec(precedence: number | string, content: Input): Rule<'evaluate'> {
		return structuralBuilder.prec(precedence, coerceToRule(content));
	},
	{
		left(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return structuralBuilder.prec.left(0, coerceToRule(precedenceOrContent as Input));
			return structuralBuilder.prec.left(precedenceOrContent as number, coerceToRule(content));
		},
		right(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return structuralBuilder.prec.right(0, coerceToRule(precedenceOrContent as Input));
			return structuralBuilder.prec.right(precedenceOrContent as number, coerceToRule(content));
		},
		dynamic(precedence: number, content: Input): Rule<'evaluate'> {
			return structuralBuilder.prec.dynamic(precedence, coerceToRule(content));
		}
	}
);

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
	rules: Record<string, ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input>;
	extras?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[];
	externals?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[];
	supertypes?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[];
	factoryInline?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[];
	inline?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[];
	conflicts?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[][];
	word?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => SymbolRule<'evaluate'>;
	precedences?: ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[][];
	reserved?: Record<string, ($: Record<string, SymbolRule<'evaluate'>>, previous?: unknown) => Input[]>;
}

interface MetadataSinks {
	extras: RuleListEntry[];
	externals: RuleListEntry[];
	supertypes: string[];
	factoryInline: string[];
	inline: string[];
	conflicts: string[][];
	precedences: string[][];
	reserved: Record<string, Rule<'evaluate'>[]>;
}

export interface EvaluateCtx {
	readonly rules: Record<string, Rule<'evaluate'>>;
	readonly provenanceByKind: Map<string, RuleProvenance>;
	readonly opts: GrammarOptions;
	readonly baseRules: Record<string, Rule<'evaluate'>>;
	readonly baseGrammar: unknown;
	readonly externals: readonly RuleListEntry[];
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
		baseRules = { ...baseRulesOf<Rule<'evaluate'>>(baseGrammar) };
		opts = options;
	}

	mergeEnrichOverridesIntoOptions(optionsOrBase, opts);

	const rules: Record<string, Rule<'evaluate'>> = { ...baseRules };
	const provenanceByKind = new Map<string, RuleProvenance>();

	const extras: RuleListEntry[] = [];
	const externals: RuleListEntry[] = [];
	const supertypes: string[] = [];
	const factoryInline: string[] = [];
	const inline: string[] = [];
	const conflicts: string[][] = [];
	const precedences: string[][] = [];
	const reserved: Record<string, Rule<'evaluate'>[]> = {};
	let word: string | null = null;

	const sinks: MetadataSinks = {
		extras,
		externals,
		supertypes,
		factoryInline,
		inline,
		conflicts,
		precedences,
		reserved
	};
	const ctx: EvaluateCtx = {
		rules,
		provenanceByKind,
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
		evaluateMetadataCallbacksInScope(opts, ctx);
	});

	inheritBaseGrammarMetadata(opts, ctx);
	const wireCtx = getWireContext(opts);

	const refineForms = drainRefineMetadata(opts);
	const groups = drainGroupsMetadata(opts);
	const expectDiagnostics = drainExpectDiagnosticsMetadata(opts);
	const expectTestFailures = drainExpectTestFailuresMetadata(opts);
	const orphanedSyntheticGroups = drainOrphanedSyntheticGroupsMetadata(opts);
	const renderAs = drainRenderAsMetadata(opts, ctx);
	const visibleExternals = drainVisibleExternalsMetadata(opts, ctx);
	const optionsBlock = drainOptionsMetadata(opts);
	const { ruleCauses, undeclaredRules } = drainRuleCausesMetadata(opts);
	const patchSites = drainPatchSitesMetadata(opts);
	const stages = departsFromBase(ctx) ? evaluateStages(optionsOrBase, ctx) : undefined;

	const grammarResult = {
		name: opts.name,
		rules,
		provenanceByKind,
		protectedRuleNames: wireCtx ? [...wireCtx.deposits.keys(), ...supertypes, ...Object.keys(renderAs ?? {}), ...Object.keys(visibleExternals ?? {})] : undefined,
		extras,
		externals,
		supertypes,
		factoryInline,
		inline,
		conflicts,
		precedences,
		word,
		reserved,
		externalRoles: collectedRoles.size > 0 ? collectedRoles : undefined,
		refineForms,
		groups,
		renderAs,
		visibleExternals,
		whitespaceCollisions: wireCtx?.whitespaceCollisions?.length ? wireCtx.whitespaceCollisions : undefined,
		options: optionsBlock,
		expectDiagnostics,
		expectTestFailures,
		ruleCauses,
		undeclaredRules,
		patchSites,
		stages,
		orphanedSyntheticGroups,
		automaticVariants: wireCtx?.automaticVariants,
		bodyPatternZeroMatches: ctx.bodyPatternZeroMatches.length > 0 ? [...ctx.bodyPatternZeroMatches] : undefined,
		desugarDivergences: ctx.desugarDivergences.length > 0 ? [...ctx.desugarDivergences] : undefined
	} satisfies EvaluatedGrammar;
	return { grammar: grammarResult };
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

function drainRuleCausesMetadata(opts: GrammarOptions): Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules'> {
	const wireCtx = getWireContext(opts);
	if (!wireCtx) return {};
	const undeclaredRules = [...wireCtx.undeclaredRules].sort();
	return {
		ruleCauses: wireCtx.ruleCauses.size > 0 ? Object.fromEntries(wireCtx.ruleCauses) : undefined,
		undeclaredRules: undeclaredRules.length > 0 ? undeclaredRules : undefined
	};
}

function drainPatchSitesMetadata(opts: GrammarOptions): readonly PatchSite[] | undefined {
	const wireCtx = getWireContext(opts);
	if (!wireCtx || wireCtx.patchSites.size === 0) return undefined;
	const sites = [...wireCtx.patchSites].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return sites.map(([key, site]) => {
		const lifts = wireCtx.liftClaims.get(key);
		return lifts === undefined ? site : { ...site, lifts: [...lifts].sort() };
	});
}

function departsFromBase(ctx: EvaluateCtx): boolean {
	const wireCtx = getWireContext(ctx.opts);
	if (!ctx.isExtension || !wireCtx) return false;
	const patches = (ctx.opts as { patches?: Record<string, unknown> }).patches;
	return wireCtx.authoredRuleNames.size > 0 || Object.keys(patches ?? {}).length > 0;
}

function evaluateStages(enriched: GrammarOptions | { grammar: any }, ctx: EvaluateCtx): EvaluationStages<EvaluatedGrammar> {
	const wireCtx = getWireContext(ctx.opts);
	if (!wireCtx) throw new Error(`evaluateStages('${ctx.opts.name}'): the grammar departs from its base but carries no wire context`);
	return { raw: evaluateStage(wireCtx.source as { grammar: any }, ctx), enriched: evaluateStage(enriched, ctx) };
}

function evaluateStage(base: GrammarOptions | { grammar: any }, ctx: EvaluateCtx): StageEvaluation<EvaluatedGrammar> {
	const stageOpts = wire({ name: ctx.opts.name }, base as unknown as GrammarJson) as GrammarOptions;
	const grammar = grammarFn(base, stageOpts).grammar as EvaluatedGrammar;
	const baseRules = ('grammar' in base ? baseRulesOf<Rule<'evaluate'>>(base.grammar) : undefined) ?? {};
	const ruleNames = [...new Set([...Object.keys(baseRules), ...Object.keys(stageOpts.rules)])].sort();
	return { grammar, ruleNames };
}

function drainOptionsMetadata(opts: GrammarOptions): OptionsConfig | undefined {
	const declared = getWireContext(opts)?.options;
	return declared === undefined || Object.keys(declared).length === 0 ? undefined : declared;
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
	const { rules, provenanceByKind } = ctx;
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.renderAs) return undefined;

	const $ = createProxy();
	const rawEntries = wireCtx.renderAs($);
	if (!rawEntries || Object.keys(rawEntries).length === 0) return undefined;

	const result: Record<string, Rule<'evaluate'>> = {};
	for (const [name, rawBody] of Object.entries(rawEntries)) {
		const rule = coerceToRule(rawBody as Input);
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
	const { rules, provenanceByKind } = ctx;
	const wireCtx = getWireContext(opts);
	if (!wireCtx || !wireCtx.visibleExternals) return undefined;

	const $ = createProxy();
	const rawEntries = wireCtx.visibleExternals($);
	if (!rawEntries || Object.keys(rawEntries).length === 0) return undefined;

	const result: Record<string, Rule<'evaluate'>> = {};
	for (const [name, rawBody] of Object.entries(rawEntries)) {
		const rule = coerceToRule(rawBody as Input);
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

function evaluateRulesAndInjectSynthetics(rules: Record<string, Rule<'evaluate'>>, ctx: EvaluateCtx): void {
	const { opts, provenanceByKind } = ctx;
	evaluateRuleFunctions(rules, ctx);
	const wireCtx = getWireContext(opts);
	if (wireCtx) {
		injectSyntheticRules(rules, ctx, wireCtx.deposits);
		if (wireCtx.groups) {
			for (const [key, value] of Object.entries(wireCtx.groups)) {
				if (typeof value !== 'function') continue;
				const hiddenName = `_${key}`;
				if (hiddenName in rules) continue;
				const $ = createProxy();
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
		applyVisibleExternalsRewrite(rules, { wireCtx });
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
	readonly wireCtx: WireContext;
}

function applyVisibleExternalsRewrite(rules: Record<string, Rule<'evaluate'>>, ctx: ApplyVisibleExternalsCtx): void {
	const { wireCtx } = ctx;
	if (!wireCtx.visibleExternals) return;
	const $ = createProxy();
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
	const { opts, baseRules, provenanceByKind, isExtension } = ctx;
	for (const [name, ruleFn] of Object.entries(opts.rules)) {
		const $ = createProxy();
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
		extras?: RuleListEntry[];
		externals?: RuleListEntry[];
		supertypes?: string[];
		factoryInline?: string[];
		inline?: string[];
		conflicts?: string[][];
		precedences?: string[][];
		word?: string;
		reserved?: Record<string, Rule<'evaluate'>[]>;
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
		if (!opts.precedences && Array.isArray(inherited.precedences)) sinks.precedences.push(...inherited.precedences);
		if (!opts.word && inherited.word) setWord(inherited.word);
		if (!opts.reserved && inherited.reserved) Object.assign(sinks.reserved, inherited.reserved);
	}
}

interface MetadataRuleListCtx {
	readonly list: string;
	readonly accepts: readonly RuleListEntry['type'][];
	readonly sink: RuleListEntry[];
}

function appendMetadataRules(result: unknown, ctx: MetadataRuleListCtx): void {
	if (!Array.isArray(result)) return;
	for (const entry of result) {
		const accepted = ruleListEntryOf(coerceToRule(entry));
		if (accepted === undefined || !ctx.accepts.includes(accepted.type)) {
			throw new Error(`evaluate: an entry of ${ctx.list} is a ${ctx.accepts.join(', ')}, not a ${coerceToRule(entry).type}`);
		}
		const key = ruleListEntryKey(accepted);
		if (!ctx.sink.some((existing) => ruleListEntryKey(existing) === key)) ctx.sink.push(accepted);
	}
}

function ruleListEntryKey(rule: RuleListEntry): string {
	return rule.type === SYMBOL ? `${rule.type}:${rule.name}` : `${rule.type}:${rule.value}`;
}

function appendDedup(sink: string[], value: string): void {
	if (!sink.includes(value)) sink.push(value);
}

function baseNameSymbols(names: readonly unknown[] | undefined): unknown[] {
	return (names ?? []).map((name) => (typeof name === 'string' ? sym(name) : name));
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
	const { sinks, setWord } = ctx;
	const baseGrammar = ctx.baseGrammar as {
		extras?: RuleListEntry[];
		externals?: RuleListEntry[];
		supertypes?: string[];
		factoryInline?: string[];
		inline?: string[];
		conflicts?: string[][];
		precedences?: string[][];
		word?: string;
		reserved?: Record<string, Rule<'evaluate'>[]>;
	} | null;
	if (opts.extras) {
		const $ = createProxy();
		appendMetadataRules(opts.extras.call($, $, baseGrammar?.extras ?? []), {
			list: 'extras',
			accepts: [SYMBOL, STRING, PATTERN],
			sink: sinks.extras
		});
	}

	if (opts.externals) {
		const $ = createProxy();
		appendMetadataRules(opts.externals.call($, $, baseGrammar?.externals ?? []), {
			list: 'externals',
			accepts: [SYMBOL, STRING],
			sink: sinks.externals
		});
	}

	if (opts.supertypes) {
		const $ = createProxy();
		const baseSupertypes = baseNameSymbols(baseGrammar?.supertypes);
		appendCallbackMetadataNames(sinks.supertypes, opts.supertypes.call($, $, baseSupertypes));
	}

	if (opts.factoryInline) {
		const $ = createProxy();
		const baseFactoryInline = baseGrammar?.factoryInline ?? [];
		appendCallbackMetadataNames(sinks.factoryInline, opts.factoryInline.call($, $, baseFactoryInline));
	}

	if (opts.inline) {
		const $ = createProxy();
		const baseInline = baseNameSymbols(baseGrammar?.inline);
		appendCallbackMetadataNames(sinks.inline, opts.inline.call($, $, baseInline));
	}

	if (opts.conflicts) {
		const $ = createProxy();
		const baseConflicts = (baseGrammar?.conflicts ?? []).map((group) => baseNameSymbols(group));
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

	if (opts.reserved) {
		for (const [wordset, members] of Object.entries(opts.reserved)) {
			const $ = createProxy();
			const result = members.call($, $, baseGrammar?.reserved?.[wordset] ?? []);
			sinks.reserved[wordset] = Array.isArray(result) ? result.map(coerceToRule) : [];
		}
	}

	if (opts.precedences) {
		const $ = createProxy();
		const basePrecedences = baseGrammar?.precedences ?? [];
		const result = opts.precedences.call($, $, basePrecedences);
		if (Array.isArray(result)) {
			for (const group of result) {
				if (!Array.isArray(group)) continue;
				sinks.precedences.push(
					group
						.map((entry) => {
							if (typeof entry === 'string') return entry;
							const n = coerceToRule(entry);
							return n.type === SYMBOL ? n.name : '';
						})
						.filter(Boolean)
				);
			}
		}
	}

	if (opts.word) {
		const $ = createProxy();
		const w = opts.word.call($, $);
		setWord(w.name);
	}
}

let evaluateMutex: Promise<void> = Promise.resolve();

export async function evaluate(entryPath: string): Promise<RawGrammar> {
	return canonicalGrammar(await evaluateDsl(entryPath));
}

export async function evaluateDsl(entryPath: string): Promise<EvaluatedGrammar> {
	let release!: () => void;
	const previous = evaluateMutex;
	evaluateMutex = new Promise<void>((resolve) => {
		release = resolve;
	});
	await previous;
	try {
		const g = globalThis as Record<string, unknown>;
		const savedGlobals = saveAndInjectDslGlobals(g);
		try {
			return await importAndExtractGrammar(entryPath);
		} finally {
			restoreSavedGlobals(g, savedGlobals);
		}
	} finally {
		release();
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
		blank,
		indent: () => structuralBuilder.indent(),
		dedent: () => structuralBuilder.dedent()
	};
	const savedGlobals: Record<string, unknown> = {};
	for (const [name, fn] of Object.entries(dslFunctions)) {
		savedGlobals[name] = g[name];
		g[name] = fn;
	}
	return savedGlobals;
}

async function importAndExtractGrammar(entryPath: string): Promise<EvaluatedGrammar> {
	const mod = (await import(entryPath)) as {
		default?: unknown;
		grammar?: unknown;
	};
	const result = (mod.default ?? mod) as { grammar?: unknown };
	const grammarObj = result.grammar ?? result;
	return grammarObj as EvaluatedGrammar;
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
