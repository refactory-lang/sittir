import { EOF, FIELD, PATTERN, STRING, SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts
import { sym } from '../types/rule.ts';
import type { AliasRule, FieldRule, PatternRule, Rule, StringRule, SymbolRule, TokenRule } from '../types/rule.ts';
import { structuralBuilder } from './builders.ts';
import type { RawGrammar, EvaluatedGrammar, EvaluationStages, StageEvaluation } from '../compiler/types.ts';
import { canonicalGrammar } from '../compiler/canonical-rules.ts';
import { isRecord, optionalContentOf, ruleListEntryOf, type RuleListEntry } from './rule-patterns.ts';
import { baseRulesOf } from './shared.ts';
import { wireWithoutConfig, type WiredOpts } from './wire/wire.ts';
import { ownRecordsOf } from './layer.ts';
import { layerRecordOf, mergedRecords, synthesizedOf, type LayerRecords, type StageBases, type SynthesizedRules } from './layer-record.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { GrammarResult } from './enrich.ts';
import type { ProjectedGrammar } from './verbs/effects.ts';

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
	return structuralBuilder.blank();
}

function eof(): Rule<'evaluate'> {
	return { type: EOF };
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
	readonly opts: GrammarOptions;
	readonly baseRules: Record<string, Rule<'evaluate'>>;
	readonly baseGrammar: unknown;
	readonly sinks: MetadataSinks;
	readonly setWord: (w: string) => void;
}

function grammarFn(
	optionsOrBase: GrammarOptions | GrammarResult,
	options?: GrammarOptions
): { grammar: EvaluatedGrammar } {
	let baseGrammar: any = null;
	let opts: GrammarOptions;

	if (options === undefined) {
		if ('grammar' in optionsOrBase) throw new Error('grammar(): a base grammar is given without options');
		opts = optionsOrBase;
	} else {
		if (!('grammar' in optionsOrBase)) throw new Error(`grammar(base, options): '${options.name}' extends a base that is not a grammar() result`);
		baseGrammar = optionsOrBase.grammar;
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
	evaluateExternalsCallback(opts, { baseGrammar, sinks });
	const baseRules = { ...baseRulesOf<Rule<'evaluate'>>(baseGrammar) };
	const ctx: EvaluateCtx = {
		opts,
		baseRules,
		baseGrammar,
		sinks,
		setWord: (w) => {
			word = w;
		}
	};
	const rules = { ...baseRules };
	evaluateRuleFunctions(rules, ctx);
	evaluateMetadataCallbacks(opts, ctx);
	inheritBaseGrammarMetadata(opts, ctx);

	const grammarResult = {
		name: opts.name,
		rules,
		evaluateSynthesized: new Set<string>(),
		extras,
		externals,
		supertypes,
		factoryInline,
		inline,
		conflicts,
		precedences,
		word,
		reserved
	} satisfies EvaluatedGrammar;
	return { grammar: grammarResult };
}

function withRecords(grammar: EvaluatedGrammar, records: LayerRecords, synthesized: readonly SynthesizedRules[]): EvaluatedGrammar {
	const bodies: Readonly<Record<string, Rule<'evaluate'>>> = { ...records.renderAs, ...records.visibleExternals };
	return { ...grammar, ...records, rules: withSynthesizedRules(grammar.rules, synthesized, bodies), evaluateSynthesized: new Set(Object.keys(bodies)) };
}

function withSynthesizedRules(
	rules: Readonly<Record<string, Rule<'evaluate'>>>,
	synthesized: readonly SynthesizedRules[],
	bodies: Readonly<Record<string, Rule<'evaluate'>>>
): Record<string, Rule<'evaluate'>> {
	const names = Object.keys(rules);
	let inserted = 0;
	for (const { after, names: own } of synthesized) {
		const fresh = own.filter((name) => !names.includes(name));
		names.splice(after + inserted, 0, ...fresh);
		inserted += fresh.length;
	}
	return Object.fromEntries(names.map((name) => [name, bodies[name] ?? rules[name]!]));
}

function evaluatedStages(bases: StageBases): EvaluationStages<EvaluatedGrammar> {
	return { raw: evaluatedStage(bases.raw, bases), enriched: evaluatedStage(bases.enriched, bases) };
}

function evaluatedStage(base: GrammarResult, bases: StageBases): StageEvaluation<EvaluatedGrammar> {
	const stageOpts = wireWithoutConfig(bases.name, base);
	const wire = stageOpts.__wireContext__!;
	const { grammar } = grammarFn(base, stageOpts);
	const own = ownRecordsOf(wire, { supertypes: grammar.supertypes, roles: new Map(), unmatchedGroups: [] });
	const synthesized = [...(bases.inherited?.synthesized ?? []), ...synthesizedOf(Object.keys(grammar.rules).length, own)];
	const baseRules = baseRulesOf<Rule<'evaluate'>>(base.grammar) ?? {};
	const ruleNames = [...new Set([...Object.keys(baseRules), ...Object.keys(stageOpts.rules)])].sort();
	return {
		grammar: { ...withRecords(grammar, mergedRecords(bases.inherited?.records, own), synthesized), automaticVariants: wire.automaticVariants },
		ruleNames
	};
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

export async function evaluate(entryPath: string, fileTypes: readonly string[]): Promise<ProjectedGrammar<RawGrammar>> {
	const evaluated = await evaluateDsl(entryPath);
	const { leadFrom, bindingEffects } = evaluated;
	return { ...canonicalGrammar(evaluated, fileTypes), ...(leadFrom === undefined ? {} : { leadFrom }), ...(bindingEffects === undefined ? {} : { bindingEffects }) };
}

export async function evaluateDsl(entryPath: string): Promise<ProjectedGrammar<EvaluatedGrammar>> {
	return withDslGlobals(() => importAndExtractGrammar(entryPath));
}

export function generatedLayerDiagnostics(entryPath: string): Promise<readonly GrammarDiagnostic[]> {
	return withDslGlobals(async () => {
		const record = layerRecordOf(await importedGrammar(entryPath));
		return record?.generated === true ? record.fixpoint().diagnostics : [];
	});
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
		eof,
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

async function importedGrammar(entryPath: string): Promise<unknown> {
	const mod = (await import(entryPath)) as {
		default?: unknown;
		grammar?: unknown;
	};
	return mod.default ?? mod;
}

async function importAndExtractGrammar(entryPath: string): Promise<ProjectedGrammar<EvaluatedGrammar>> {
	return evaluatedGrammarOf(await importedGrammar(entryPath));
}

export function evaluatedGrammarOf(result: unknown): ProjectedGrammar<EvaluatedGrammar> {
	const grammarObj = ((result as { grammar?: unknown }).grammar ?? result) as EvaluatedGrammar;
	const record = layerRecordOf(result);
	if (record === undefined) return { ...grammarObj };
	const { deadMints, derivationRecords, textTokens, diagnostics } = record;
	return {
		...withRecords(grammarObj, record.records, record.synthesized),
		automaticVariants: record.automaticVariants,
		...(record.stageBases === undefined ? {} : { stages: evaluatedStages(record.stageBases) }),
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
