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
import { sym } from '../types/rule.ts';
import type {
	Rule,
	RuleId,
	SeqRule,
	ChoiceRule,
	OptionalRule,
	RepeatRule,
	Repeat1Rule,
	FieldRule,
	TokenRule,
	StringRule,
	PatternRule,
	SymbolRule,
	AliasRule,
	SymbolRef
} from '../types/rule.ts';
import { normalizeEnumMembers, makeRuleMetadata } from '../dsl/rule-metadata.ts';
import type { AnyRule } from '../types/rule.ts';
import type { RawGrammar, DesugarDivergenceEvent } from './types.ts';
import type { RuleCatalog, RuleCatalogEntry, RuleClassification, RulePathSegment, RuleProvenance } from './types.ts';
import { classifyByType } from '../dsl/rule-patterns.ts';
import { collectUnreachableHiddenRules } from '../util/reachable-rules.ts';
import { assertNever } from '../polymorph-variant.ts';
import { withRoleScope } from '../dsl/primitives/role.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { ENRICH_UNALIAS_DIAGNOSTICS_KEY, getEnrichUnaliasDiagnostics } from '../dsl/enrich.ts';
import type { WireContext, RefineForm } from '../dsl/wire/wire.ts';

type Input = string | RegExp | Rule<'evaluate'>;

interface SymbolRuleWithRef extends SymbolRule<'evaluate'> {
	readonly _ref?: SymbolRef;
}

export function coerceToRule(input: Input): Rule<'evaluate'> {
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

export function seq(...members: Input[]): Rule<'evaluate'> {
	const normalized = members.map(coerceToRule);

	if (normalized.length === 1) return normalized[0]!;

	return { type: SEQ, members: normalized };
}

export function choice(...members: Input[]): Rule<'evaluate'> {
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

	if (normalized.length >= 2 && normalized.every((m) => m.type === FIELD)) {
		return collapseAllFieldChoiceMembers(normalized as FieldRule<'evaluate'>[]);
	}

	return { type: CHOICE, members: normalized };
}

function collapseAllFieldChoiceMembers(fieldMembers: FieldRule<'evaluate'>[]): Rule<'evaluate'> {
	const anyAlias = fieldMembers.some((f) => f.content.type === ALIAS);
	if (anyAlias) {
		return { type: CHOICE, members: fieldMembers };
	}
	const names = fieldMembers.map((f) => f.name);
	const allSameName = names.every((n) => n === names[0]);
	if (allSameName) {
		const inner = choice(...fieldMembers.map((f) => f.content));
		return {
			type: FIELD,
			name: names[0]!,
			content: inner,
			metadata: makeRuleMetadata({ fieldSource: 'grammar' })
		};
	}
	return { type: CHOICE, members: fieldMembers };
}

export function optional(content: Input): Rule<'evaluate'> {
	const resolved = coerceToRule(content);
	walkRefs(resolved, (ref) => {
		ref.optional = true;
	});
	if (resolved.type === OPTIONAL) return resolved;
	if (resolved.type === REPEAT) return resolved;
	if (resolved.type === REPEAT1) {
		return {
			type: REPEAT,
			content: resolved.content,
			separator: resolved.separator,
			trailing: resolved.trailing,
			leading: resolved.leading
		};
	}
	return { type: OPTIONAL, content: resolved };
}

export function repeat(content: Input): Rule<'evaluate'> {
	const resolved = coerceToRule(content);
	walkRefs(resolved, (ref) => {
		ref.repeated = true;
	});
	if (resolved.type === REPEAT && !resolved.separator) return resolved;
	if (resolved.type === OPTIONAL) {
		const inner = resolved.content;
		walkRefs(inner, (ref) => {
			ref.repeated = true;
		});
		return { type: REPEAT, content: inner };
	}
	return { type: REPEAT, content: resolved };
}

export function repeat1(content: Input): Rule<'evaluate'> {
	const resolved = coerceToRule(content);
	walkRefs(resolved, (ref) => {
		ref.repeated = true;
	});
	if (resolved.type === REPEAT1 && !resolved.separator) return resolved;
	return { type: REPEAT1, content: resolved };
}

export function createProxy(currentRule: string, refs: SymbolRef[]): Record<string, SymbolRuleWithRef> {
	return new Proxy({} as Record<string, SymbolRuleWithRef>, {
		get(_target, name: string): SymbolRuleWithRef {
			const ref: SymbolRef = { refType: 'symbol', from: currentRule, to: name };
			refs.push(ref);
			return {
				type: SYMBOL,
				name,
				hidden: name.startsWith('_'),
				inline: name.startsWith('_'),
				_ref: ref
			};
		}
	});
}

export function isHiddenKind(name: string, inlineList?: readonly string[]): boolean {
	if (name.startsWith('_')) return true;
	if (inlineList && inlineList.includes(name)) return true;
	return false;
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

export function field(name: string, content?: Input): FieldRule<'evaluate'> {
	if (content === undefined) {
		return {
			type: FIELD,
			name,
			content: { type: STRING, value: '' },
			_needsContent: true
		};
	}
	let resolved = coerceToRule(content);
	resolved = collapseOptionalRepeatInField(resolved);
	walkRefs(resolved, (ref) => {
		if (ref.fieldName === undefined) ref.fieldName = name;
	});
	return { type: FIELD, name, content: resolved };
}

function collapseOptionalRepeatInField(resolved: Rule<'evaluate'>): Rule<'evaluate'> {
	if (resolved.type !== OPTIONAL) return resolved;
	const inner = resolved.content;
	if (inner.type === REPEAT) {
		return inner;
	}
	if (inner.type === REPEAT1) {
		return {
			type: REPEAT,
			content: inner.content,
			separator: inner.separator,
			trailing: inner.trailing,
			leading: inner.leading
		};
	}
	return resolved;
}

interface TokenFn {
	(content: Input): TokenRule<'evaluate'>;
	immediate: (content: Input) => Rule<'evaluate'>;
}

export const token: TokenFn = Object.assign(
	function token(content: Input): TokenRule<'evaluate'> {
		return { type: TOKEN, content: coerceToRule(content), immediate: false };
	},
	{
		immediate(content: Input): Rule<'evaluate'> {
			return { type: 'IMMEDIATE_TOKEN', content: coerceToRule(content) } as Rule<'evaluate'>;
		}
	}
);

interface PrecFn {
	(precedence: number, content: Input): Rule<'evaluate'>;
	left: (precedence: number, content: Input) => Rule<'evaluate'>;
	right: (precedence: number, content: Input) => Rule<'evaluate'>;
	dynamic: (precedence: number, content: Input) => Rule<'evaluate'>;
}

function makePrecRule(
	type: 'PREC' | 'PREC_LEFT' | 'PREC_RIGHT' | 'PREC_DYNAMIC',
	value: number,
	content: Input
): Rule<'evaluate'> {
	return { type, content: coerceToRule(content), value } as Rule<'evaluate'>;
}

export const prec: PrecFn = Object.assign(
	function prec(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
		if (content === undefined) return coerceToRule(precedenceOrContent as Input);
		return makePrecRule('PREC', precedenceOrContent as number, content);
	},
	{
		left(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return coerceToRule(precedenceOrContent as Input);
			return makePrecRule('PREC_LEFT', precedenceOrContent as number, content);
		},
		right(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return coerceToRule(precedenceOrContent as Input);
			return makePrecRule('PREC_RIGHT', precedenceOrContent as number, content);
		},
		dynamic(precedenceOrContent: number | Input, content?: Input): Rule<'evaluate'> {
			if (content == null) return coerceToRule(precedenceOrContent as Input);
			return makePrecRule('PREC_DYNAMIC', precedenceOrContent as number, content);
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

export function alias(rule: Input, value: string | Rule<'evaluate'>): AliasRule<'evaluate'> {
	const content = coerceToRule(rule);
	if (typeof value === 'string') {
		return { type: ALIAS, content, named: false, value };
	}
	if (
		typeof value === 'object' &&
		'type' in value &&
		typeof (value as { type: unknown }).type === 'string' &&
		(value as { type: string }).type === SYMBOL
	) {
		return {
			type: ALIAS,
			content,
			named: true,
			value: (value as SymbolRule<'evaluate'>).name
		};
	}
	throw new Error(`Invalid alias value: ${value}`);
}

export function blank(): Rule<'evaluate'> {
	return { type: CHOICE, members: [] };
}

export function string(value: string): StringRule<'evaluate'> {
	return { type: STRING, value };
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

export interface EvaluateCtx {
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
		case ALIAS:
			if (rule.named && rule.value) {
				const inner = rule.content;
				const isBareSymbolToKnownSource =
					inner.type === SYMBOL && (rules[inner.name] !== undefined || externals.has(inner.name));
				const targetAlreadyExists = rules[rule.value] !== undefined;
				const isStringBody = inner.type === STRING;
				if (!targetAlreadyExists && !isBareSymbolToKnownSource && !isStringBody) {
					const syntheticHiddenName = `_${rule.value}`;
					if (!rules[syntheticHiddenName]) {
						rules[syntheticHiddenName] = recurse(rule.content);
						provenanceByKind.set(syntheticHiddenName, 'evaluate-synthesized');
						ctx.desugarDivergences.push({ site: 'inline-alias-source', name: syntheticHiddenName });
					}
					return {
						...rule,
						content: { type: SYMBOL, name: syntheticHiddenName } as SymbolRule<'evaluate'>
					};
				}
			}
			return { ...rule, content: recurse(rule.content) };
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
				} catch {
				}
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

export function isComplexBody(rule: Rule<'evaluate'>): boolean {
	switch (rule.type) {
		case SEQ:
			return (rule as SeqRule<'evaluate'>).members.length >= 2;
		case CHOICE:
			return (rule as ChoiceRule<'evaluate'>).members.length >= 2;
		case REPEAT:
		case REPEAT1: {
			const content = (rule as RepeatRule<'evaluate'>).content;
			return content.type !== STRING && content.type !== SYMBOL && content.type !== PATTERN;
		}
		default:
			return false;
	}
}

export function deriveComplexAliasTargetHidden(rules: Record<string, AnyRule>): ReadonlySet<string> {
	const walker = new RuleWalker<AnyRule>();
	const candidates = new Set<string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, candidates, (acc, r) => {
			if (r.type === ALIAS && r.named && r.content.type === SYMBOL && r.content.name.startsWith('_')) {
				acc.add(r.content.name);
			}
			if (r.type === SYMBOL && (r as { aliasedFrom?: string }).aliasedFrom?.startsWith('_')) {
				acc.add((r as { aliasedFrom?: string }).aliasedFrom!);
			}
			return acc;
		});
	}

	const out = new Set<string>();
	for (const name of candidates) {
		const body = rules[name];
		if (body && isComplexBody(body as Rule<'evaluate'>)) out.add(name);
	}
	return out;
}

function replacePatterns(rule: Rule<'evaluate'>, candidates: PatternCandidate[]): Rule<'evaluate'> {
	for (const c of candidates) {
		if (patternRulesEqual(rule, c.body)) {
			const symRef: SymbolRule<'evaluate'> = { type: SYMBOL, name: c.name, hidden: true };
			if (c.aliasAs !== undefined) {
				return { type: ALIAS, content: symRef, named: true, value: c.aliasAs } satisfies AliasRule<'evaluate'>;
			}
			return symRef;
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
		return { type: ALIAS, content: rule, named: true, value: visibleName } satisfies AliasRule<'evaluate'>;
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
		return await importAndExtractGrammar(entryPath);
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

interface BuildResult {
	readonly rule: Rule<'evaluate'>;
	readonly id: RuleId;
	readonly classification: RuleClassification;
}

interface ClassificationForce {
	readonly forcedBy?: RuleClassification['forcedBy'];
	readonly edgeName?: string;
	readonly cstSurface?: RuleClassification['cstSurface'];
}

export interface RuleCatalogBuildResult {
	readonly rules: Record<string, Rule<'evaluate'>>;
	readonly ruleCatalog: RuleCatalog;
}

export interface BuildRuleCatalogCtx {
	readonly provenanceByKind?: ReadonlyMap<string, RuleProvenance>;
}

function computeReachableRuleNames(rules: Record<string, Rule<'evaluate'>>): Set<string> {
	const walker = new RuleWalker<Rule<'evaluate'>>(rules);
	const reachable = new Set<string>();
	for (const name of Object.keys(rules)) {
		if (!name.startsWith('_')) reachable.add(name);
	}
	if (reachable.size === 0) return new Set(Object.keys(rules));
	for (const name of Object.keys(rules)) {
		if (name.startsWith('_')) continue;
		const rule = rules[name];
		if (!rule) continue;
		walker.foldDeep<null>(rule, null, (acc, r) => {
			if (r.type === SYMBOL) reachable.add(r.name);
			return acc;
		});
	}
	return reachable;
}

export function buildRuleCatalog(
	rules: Record<string, Rule<'evaluate'>>,
	ctx: BuildRuleCatalogCtx = {}
): RuleCatalogBuildResult {
	const provenanceByKind = ctx.provenanceByKind ?? new Map<string, RuleProvenance>();
	const byId = new Map<RuleId, RuleCatalogEntry>();
	const rootsByKind = new Map<string, RuleId>();
	const classificationById = new Map<RuleId, RuleClassification>();
	const identifiedRules: Record<string, Rule<'evaluate'>> = {};
	const reachable = computeReachableRuleNames(rules);

	for (const ownerKind of Object.keys(rules)) {
		const rule = rules[ownerKind];
		if (!rule) continue;
		if (ownerKind.startsWith('_') && !reachable.has(ownerKind)) continue;
		const provenance = provenanceByKind.get(ownerKind) ?? 'grammar-authored';
		const result = identifyRule({
			rule,
			ownerKind,
			parentId: undefined,
			path: [],
			provenance,
			force: {},
			byId,
			classificationById
		});
		identifiedRules[ownerKind] = result.rule;
		rootsByKind.set(ownerKind, result.id);
	}

	return {
		rules: identifiedRules,
		ruleCatalog: { byId, rootsByKind, classificationById }
	};
}

export interface AttachReferenceRuleIdsCtx {
	readonly ruleCatalog: RuleCatalog;
}

export function attachReferenceRuleIds(references: readonly SymbolRef[], ctx: AttachReferenceRuleIdsCtx): SymbolRef[] {
	return references.map((ref) => {
		const fromRuleId = ctx.ruleCatalog.rootsByKind.get(ref.from);
		return fromRuleId ? { ...ref, fromRuleId } : { ...ref };
	});
}

interface IdentifyParams {
	readonly rule: Rule<'evaluate'>;
	readonly ownerKind: string;
	readonly parentId: RuleId | undefined;
	readonly path: readonly RulePathSegment[];
	readonly provenance: RuleProvenance;
	readonly force: ClassificationForce;
	readonly byId: Map<RuleId, RuleCatalogEntry>;
	readonly classificationById: Map<RuleId, RuleClassification>;
}

function identifyRule(params: IdentifyParams): BuildResult {
	const id = createRuleId(params.ownerKind, { path: params.path });
	const children = identifyChildren({ ...params, selfId: id });
	const childIds = children.map((child) => child.id);
	const rule = withIdentifiedChildren({ rule: params.rule, id, children });
	const classification = classifyRule(rule, { id, children, force: params.force });

	params.byId.set(id, {
		id,
		ownerKind: params.ownerKind,
		ruleType: params.rule.type,
		parentId: params.parentId,
		path: params.path,
		childIds,
		provenance: params.provenance
	});
	params.classificationById.set(id, classification);

	return { rule, id, classification };
}

function identifyChildren(args: IdentifyParams & { readonly selfId: RuleId }): BuildResult[] {
	const { selfId, ...params } = args;

	const childParams = (childArgs: { rule: Rule<'evaluate'>; segment: RulePathSegment; force?: ClassificationForce }) =>
		identifyRule({
			rule: childArgs.rule,
			ownerKind: params.ownerKind,
			parentId: selfId,
			path: [...params.path, childArgs.segment],
			provenance: params.provenance,
			force: childArgs.force ?? {},
			byId: params.byId,
			classificationById: params.classificationById
		});

	switch (params.rule.type) {
		case SEQ:
		case CHOICE:
			return params.rule.members.map((member, index) =>
				childParams({ rule: member, segment: { edge: 'members', index } })
			);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			return [childParams({ rule: params.rule.content, segment: { edge: 'content' } })];
		case FIELD:
			return [
				childParams({
					rule: params.rule.content,
					segment: { edge: 'content' },
					force: {
						forcedBy: 'field',
						edgeName: params.rule.name
					}
				})
			];
		case ALIAS:
			return [
				childParams({
					rule: params.rule.content,
					segment: { edge: 'content' },
					force: {
						forcedBy: params.rule.named ? 'named-alias' : undefined,
						cstSurface: params.rule.named ? 'named' : 'anonymous'
					}
				})
			];
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		case SYMBOL:
			return [];
		default:
			return assertNever(params.rule);
	}
}

function withIdentifiedChildren(args: {
	rule: Rule<'evaluate'>;
	id: RuleId;
	children: readonly BuildResult[];
}): Rule<'evaluate'> {
	const { rule, id, children } = args;
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			return { ...rule, id, members: children.map((child) => child.rule) };
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case FIELD:
		case ALIAS:
		case TOKEN:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			return { ...rule, id, content: children[0]!.rule };
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		case SYMBOL:
			return { ...rule, id };
		default:
			return assertNever(rule);
	}
}

function classifyRule(
	rule: Rule<'evaluate'>,
	ctx: {
		readonly id: RuleId;
		readonly children: readonly BuildResult[];
		readonly force: ClassificationForce;
	}
): RuleClassification {
	const intrinsicKind = classifyIntrinsic(rule, { children: ctx.children });
	const forcedKind =
		ctx.force.forcedBy === 'field' || ctx.force.forcedBy === 'named-alias' ? 'nonterminal' : intrinsicKind;
	return {
		ruleId: ctx.id,
		kind: forcedKind,
		...(ctx.force.forcedBy ? { forcedBy: ctx.force.forcedBy } : {}),
		...(ctx.force.edgeName ? { edgeName: ctx.force.edgeName } : {}),
		...(ctx.force.cstSurface ? { cstSurface: ctx.force.cstSurface } : {})
	};
}

function classifyIntrinsic(
	rule: Rule<'evaluate'>,
	ctx: { readonly children: readonly BuildResult[] }
): RuleClassification['kind'] {
	const anyChildNonterminal = ctx.children.some((child) => child.classification.kind === 'nonterminal');
	return classifyByType(rule.type, anyChildNonterminal);
}

function createRuleId(ownerKind: string, ctx: { readonly path: readonly RulePathSegment[] }): RuleId {
	if (ctx.path.length === 0) return `rule:${encodeURIComponent(ownerKind)}:root`;
	return `rule:${encodeURIComponent(ownerKind)}:${ctx.path.map(formatPathSegment).join('/')}`;
}

function formatPathSegment(segment: RulePathSegment): string {
	switch (segment.edge) {
		case 'content':
			return 'content';
		case 'members':
		case 'forms':
			return `${segment.edge}.${segment.index}`;
		default:
			return assertNever(segment);
	}
}
