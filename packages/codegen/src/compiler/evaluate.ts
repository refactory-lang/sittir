import type { OptionsConfig } from '../dsl/wire/options-block.ts';
import { CHOICE, FIELD, PATTERN, STRING, SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts
import { sym } from '../types/rule.ts';
import type { AliasRule, FieldRule, PatternRule, Rule, StringRule, SymbolRule, TokenRule } from '../types/rule.ts';
import { structuralBuilder } from '../dsl/builders.ts';
import type { RawGrammar, EvaluatedGrammar, EvaluationStages, StageEvaluation } from './types.ts';
import { canonicalGrammar } from './canonical-rules.ts';
import { isRecord, optionalContentOf, ruleListEntryOf, type RuleListEntry } from '../dsl/rule-patterns.ts';
import { withRoleScope } from '../dsl/primitives/role.ts';
import { baseRulesOf } from '../dsl/shared.ts';
import { protectedWireRuleNames, wireWithoutConfig, type PatchSite, type WireContext, type RefineForm, type WiredOpts } from '../dsl/wire/wire.ts';
import { layerRecordOf } from '../dsl/layer-record.ts';
import type { GrammarResult } from '../dsl/enrich.ts';

type Input = string | RegExp | Rule<'evaluate'>;

function coerceToRule(input: unknown): Rule<'evaluate'> {
	if (input === undefined || input === null) {
		throw new Error('Undefined symbol');
	}

	if (input instanceof ReferenceError) throw input;

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

function undefinedSymbolOf(value: ReferenceError): unknown {
	return (value as ReferenceError & { readonly symbol?: unknown }).symbol;
}

function alias(rule: Input, value: string | Rule<'evaluate'> | ReferenceError): AliasRule<'evaluate'> {
	const content = coerceToRule(rule);
	const target = value instanceof ReferenceError ? undefinedSymbolOf(value) : value;
	if (typeof target === 'string' || (isRecord(target) && target.type === SYMBOL)) {
		return structuralBuilder.alias(content, target as string | SymbolRule<'evaluate'>);
	}
	throw new Error(`Invalid alias value: ${value}`);
}

function blank(): Rule<'evaluate'> {
	return { type: CHOICE, members: [] };
}

function string(value: string): StringRule<'evaluate'> {
	return structuralBuilder.string(value);
}

type GrammarOptions = WiredOpts;

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
	readonly evaluateSynthesized: Set<string>;
	readonly opts: GrammarOptions;
	readonly baseRules: Record<string, Rule<'evaluate'>>;
	readonly baseGrammar: unknown;
	readonly externals: readonly RuleListEntry[];
	readonly isExtension: boolean;
	readonly sinks: MetadataSinks;
	readonly setWord: (w: string) => void;
}

interface LayerCtx<T> {
	readonly previous: T | undefined;
}

function inheritedRecord<T>(
	current: Readonly<Record<string, T>> | undefined,
	ctx: LayerCtx<Readonly<Record<string, T>>>
): Record<string, T> | undefined {
	return ctx.previous === undefined && current === undefined ? undefined : { ...ctx.previous, ...current };
}

function inheritedMap<K, V>(current: ReadonlyMap<K, V> | undefined, ctx: LayerCtx<ReadonlyMap<K, V>>): Map<K, V> | undefined {
	return ctx.previous === undefined && current === undefined
		? undefined
		: new Map([...(ctx.previous ?? []), ...(current ?? [])]);
}

function inheritedPatchSites(
	current: readonly PatchSite[] | undefined,
	ctx: LayerCtx<readonly PatchSite[]>
): readonly PatchSite[] | undefined {
	if (ctx.previous === undefined && current === undefined) return undefined;
	return [
		...new Map(
			[...(ctx.previous ?? []), ...(current ?? [])].map((site) => [`${site.ownerKind}:${site.path}`, site])
		).values()
	];
}

function grammarFn(
	optionsOrBase: GrammarOptions | GrammarResult,
	options?: GrammarOptions
): { grammar: EvaluatedGrammar } {
	let baseGrammar: any = null;
	let base: GrammarResult | undefined;
	let opts: GrammarOptions;

	if (options === undefined) {
		if ('grammar' in optionsOrBase) throw new Error('grammar(): a base grammar is given without options');
		opts = optionsOrBase;
	} else {
		if (!('grammar' in optionsOrBase)) throw new Error(`grammar(base, options): '${options.name}' extends a base that is not a grammar() result`);
		base = optionsOrBase;
		baseGrammar = base.grammar;
		opts = options;
	}

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
	let inherited: Partial<EvaluatedGrammar> = {};
	let ctx!: EvaluateCtx;
	const { roles: collectedRoles } = withRoleScope(() => {
		evaluateExternalsCallback(opts, { baseGrammar, sinks });
		inherited = baseGrammar ?? {};
		const baseRules = { ...baseRulesOf<Rule<'evaluate'>>(baseGrammar) };
		ctx = {
			rules: { ...baseRules },
			evaluateSynthesized: new Set<string>(inherited.evaluateSynthesized),
			opts,
			baseRules,
			baseGrammar,
			externals,
			isExtension: baseGrammar !== null,
			sinks,
			setWord: (w) => {
				word = w;
			}
		};
		evaluateRuleFunctions(ctx.rules, ctx);
		evaluateMetadataCallbacksInScope(opts, ctx);
	});
	const { rules, evaluateSynthesized } = ctx;

	inheritBaseGrammarMetadata(opts, ctx);
	const wireCtx = getWireContext(opts);
	const bodyPatternZeroMatches = [...(inherited.bodyPatternZeroMatches ?? []), ...(wireCtx?.bodyPatternZeroMatches ?? [])];

	const refineForms = inheritedMap(drainRefineMetadata(opts), { previous: inherited.refineForms });
	const groups = inheritedRecord(drainGroupsMetadata(opts), { previous: inherited.groups });
	const expectDiagnostics = inheritedRecord(drainExpectDiagnosticsMetadata(opts), { previous: inherited.expectDiagnostics });
	const expectTestFailures = inheritedRecord(drainExpectTestFailuresMetadata(opts), { previous: inherited.expectTestFailures });
	const renderAs = inheritedRecord(drainRenderAsMetadata(opts, ctx), { previous: inherited.renderAs });
	const visibleExternals = inheritedRecord(drainVisibleExternalsMetadata(opts, ctx), { previous: inherited.visibleExternals });
	const optionsBlock = inheritedRecord(drainOptionsMetadata(opts), { previous: inherited.options });
	const reparseHosts = getWireContext(opts)?.reparseHosts ?? inherited.reparseHosts;
	const declarations = drainRuleCausesMetadata(opts);
	const ruleCauses = inheritedRecord(declarations.ruleCauses, { previous: inherited.ruleCauses });
	const undeclaredRules =
		inherited.undeclaredRules === undefined && declarations.undeclaredRules === undefined
			? undefined
			: [...new Set([...(inherited.undeclaredRules ?? []), ...(declarations.undeclaredRules ?? [])])];
	const patchSites = inheritedPatchSites(drainPatchSitesMetadata(opts), { previous: inherited.patchSites });
	const stages = base !== undefined && departsFromBase(ctx) ? evaluateStages(base, ctx) : undefined;

	const grammarResult = {
		name: opts.name,
		rules,
		evaluateSynthesized,
		protectedRuleNames: wireCtx
			? [...new Set([...(inherited.protectedRuleNames ?? []), ...protectedWireRuleNames(opts), ...supertypes])]
			: inherited.protectedRuleNames,
		extras,
		externals,
		supertypes,
		factoryInline,
		inline,
		conflicts,
		precedences,
		word,
		reserved,
		externalRoles: inheritedMap(collectedRoles.size > 0 ? collectedRoles : undefined, { previous: inherited.externalRoles }),
		refineForms,
		groups,
		renderAs,
		visibleExternals,
		whitespaceCollisions: wireCtx?.whitespaceCollisions?.length
			? wireCtx.whitespaceCollisions
			: inherited.whitespaceCollisions,
		options: optionsBlock,
		expectDiagnostics,
		expectTestFailures,
		reparseHosts,
		ruleCauses,
		undeclaredRules,
		patchSites,
		stages: inherited.stages ?? stages,
		automaticVariants: wireCtx?.automaticVariants,
		bodyPatternZeroMatches: bodyPatternZeroMatches.length > 0 ? [...bodyPatternZeroMatches] : undefined
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
	const edits = (ctx.opts as { edits?: Record<string, unknown> }).edits;
	return wireCtx.authoredRuleNames.size > 0 || Object.keys(edits ?? {}).length > 0;
}

function evaluateStages(enriched: GrammarResult, ctx: EvaluateCtx): EvaluationStages<EvaluatedGrammar> {
	const wireCtx = getWireContext(ctx.opts);
	if (!wireCtx) throw new Error(`evaluateStages('${ctx.opts.name}'): the grammar departs from its base but carries no wire context`);
	return { raw: evaluateStage(wireCtx.source as GrammarResult, ctx), enriched: evaluateStage(enriched, ctx) };
}

function evaluateStage(base: GrammarResult, ctx: EvaluateCtx): StageEvaluation<EvaluatedGrammar> {
	const stageOpts = wireWithoutConfig(ctx.opts.name, base);
	const { grammar } = grammarFn(base, stageOpts);
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

function drainRenderAsMetadata(opts: GrammarOptions, ctx: EvaluateCtx): Record<string, Rule<'evaluate'>> | undefined {
	const { rules, evaluateSynthesized } = ctx;
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
		evaluateSynthesized.add(name);
	}
	return result;
}

function drainVisibleExternalsMetadata(
	opts: GrammarOptions,
	ctx: EvaluateCtx
): Record<string, Rule<'evaluate'>> | undefined {
	const { rules, evaluateSynthesized } = ctx;
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
		evaluateSynthesized.add(name);
	}
	return result;
}

function evaluateMetadataCallbacksInScope(opts: GrammarOptions, ctx: EvaluateCtx): void {
	evaluateMetadataCallbacks(opts, ctx);
}

function evaluateRuleFunctions(rules: Record<string, Rule<'evaluate'>>, ctx: EvaluateCtx): void {
	const { opts, baseRules } = ctx;
	for (const [name, ruleFn] of Object.entries(opts.rules)) {
		const $ = createProxy();
		const baseRule = baseRules[name];
		const result = ruleFn.call($, $, baseRule);
		rules[name] = coerceToRule(result);
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

function evaluateExternalsCallback(opts: GrammarOptions, ctx: Pick<EvaluateCtx, 'baseGrammar' | 'sinks'>): void {
	if (!opts.externals) return;
	const $ = createProxy();
	const baseExternals = (ctx.baseGrammar as { externals?: RuleListEntry[] } | null)?.externals ?? [];
	appendMetadataRules(opts.externals.call($, $, baseExternals), {
		list: 'externals',
		accepts: [SYMBOL, STRING],
		sink: ctx.sinks.externals
	});
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
		const w = coerceToRule(opts.word.call($, $));
		if (w.type !== SYMBOL) throw new Error(`grammar '${opts.name}': word is a ${w.type}, not a symbol`);
		setWord(w.name);
	}
}

let evaluateMutex: Promise<void> = Promise.resolve();

export async function evaluate(entryPath: string, fileTypes: readonly string[]): Promise<RawGrammar> {
	return canonicalGrammar(await evaluateDsl(entryPath), fileTypes);
}

export async function evaluateDsl(entryPath: string): Promise<EvaluatedGrammar> {
	return withDslGlobals(() => importAndExtractGrammar(entryPath));
}

export async function withDslGlobals<T>(run: () => Promise<T>): Promise<T> {
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
			return await run();
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
		reserved: (contextName: string, content: Input) => structuralBuilder.reserved(contextName, coerceToRule(content)),
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
	const grammarObj = (result.grammar ?? result) as EvaluatedGrammar;
	const record = layerRecordOf(result);
	if (record === undefined) return { ...grammarObj };
	const { deadMints, derivationRecords, textTokens, diagnostics } = record;
	return {
		...grammarObj,
		...record.projections,
		...(deadMints.size === 0 ? {} : { orphanedSyntheticGroups: [...deadMints] }),
		derivationRecords,
		...(textTokens.length === 0 ? {} : { textTokens }),
		...(diagnostics.length === 0 ? {} : { layerDiagnostics: diagnostics })
	};
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
