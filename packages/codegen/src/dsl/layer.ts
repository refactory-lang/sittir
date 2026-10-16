import type { GrammarJson, SymbolRule } from '../grammar-shapes/grammar-json.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { Rule } from '../types/rule.ts';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionRecord, type ConflictResolutionsInput } from './conflict-resolutions.ts';
import {
	enrich,
	enrichSidecarsOf,
	getEnrichMints,
	getEnrichTextTokens,
	nativeRuleFn,
	stampWiredVariants,
	withEnrichSidecarsOf,
	type EnrichedGrammar,
	type EnrichSidecars,
	type GrammarResult
} from './enrich.ts';
import type { TransformPatchMap } from '../grammar-shapes/path-type.ts';
import type { ExternalRole } from '../types/ir.ts';
import { layerRecordOf, mergedRecords, synthesizedOf, withLayerRecord, type LayerRecord, type LayerRecords, type StageBases } from './layer-record.ts';
import { withRoleScope } from './primitives/role.ts';
import { isRecord, type GrammarRecord } from './rule-patterns.ts';
import { baseRulesOf } from './shared.ts';
import { verbCtxOf, type VerbCtx } from './verbs/copy.ts';
import { appendProvenance, effectsForOwners, provenanceOf, rewriteInherited, type AliasEffect, type Effect, type SegmentEffect } from './verbs/effects.ts';
import { applyLeads } from './verbs/lead.ts';
import { applyNarrows } from './verbs/narrow.ts';
import { deadEnrichMints, withoutDeadNames } from './wire/dead-mints.ts';
import { derivationRecordsOf } from './wire/derivation-records.ts';
import type { LiftName } from './wire/lift-names.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import {
	authoredFieldSites,
	evaluatedConfig,
	layerSymbols,
	namedSymbols,
	protectedWireRuleNames,
	symbolNamesOf,
	unmatchedGroupPatterns,
	wireImpl,
	type EditsCheck,
	type EvaluatedConfig,
	type IsShaped,
	type OptionsCheck,
	type WireConfig,
	type WireContext,
	type WiredOpts,
	type WireLayer
} from './wire/wire.ts';

declare const LAYER_BASE: unique symbol;

export type ContextsConfig = ($: Readonly<Record<string, SymbolRule<string>>>) => Readonly<Record<string, unknown>>;

export type LayerConfig<B extends GrammarJson = any> = Omit<WireConfig<EnrichedGrammar<B>>, 'name'> & {
	readonly name?: string;
	readonly resolutions?: ConflictResolutionsInput;
	readonly contexts?: ContextsConfig;
};

type LayerCallback = (this: unknown, $: unknown, previous?: unknown) => unknown;

export interface PendingBase<B = unknown> {
	readonly grammar: { readonly name: string; readonly externals: readonly unknown[]; readonly [key: string]: unknown };
	readonly [LAYER_BASE]?: B;
}

export interface LayerOptions<B = unknown> {
	readonly name?: string;
	readonly rules: Readonly<Record<string, LayerCallback>>;
	readonly externals: LayerCallback;
	readonly [LAYER_BASE]?: B;
}

export interface LayerLists {
	readonly externals: unknown;
	readonly reserved?: Readonly<Record<string, unknown>>;
	readonly extras?: unknown;
	readonly word?: unknown;
	readonly conflicts: readonly (readonly unknown[])[];
	readonly inline: readonly unknown[];
	readonly supertypes: readonly unknown[];
	readonly precedences?: unknown;
}

export interface LayerOutput {
	readonly name: string;
	readonly bodies: ReadonlyMap<string, unknown>;
	readonly lists: LayerLists;
	readonly record: LayerRecord;
	readonly wire: WireContext;
}

export interface LayerCtx extends VerbCtx {
	readonly depth: number;
	readonly inherited: LayerRecord | undefined;
	readonly upstream: GrammarJson;
	readonly base: GrammarResult;
	readonly resolutions: ConflictResolutionsInput;
	readonly conflictsAuthored: boolean;
	readonly wire: WireContext;
	readonly protectedNames: readonly string[];
	readonly rules: Record<string, Rule>;
	readonly symbols: Record<string, unknown>;
	readonly stageBases: StageBases | undefined;
}

interface LayerHandle {
	readonly pending: PendingBase;
	readonly source: GrammarResult;
	consumed: boolean;
}

const LAYER_HANDLE: unique symbol = Symbol.for('sittir.layerHandle') as never;

const VERIFIED_TREE_SITTER = '0.26.9';

const PENDING_KEYS = ['rules', 'extras', 'conflicts', 'precedences', 'inline', 'supertypes', 'word', 'reserved'] as const;

function handleOf(externals: unknown): LayerHandle | undefined {
	return Array.isArray(externals) ? (Reflect.get(externals, LAYER_HANDLE) as LayerHandle | undefined) : undefined;
}

function withHandle(externals: unknown, handle: LayerHandle): unknown[] {
	return Object.defineProperty([...((externals as readonly unknown[] | undefined) ?? [])], LAYER_HANDLE, { value: handle });
}

function grammarResultOf(base: unknown): GrammarResult {
	if (!isRecord(base)) throw new Error(`enrich(): a base is a grammar, not ${typeof base}`);
	return ('grammar' in base ? base : { grammar: base }) as unknown as GrammarResult;
}

export function pendingBase<B extends GrammarJson>(base: B | GrammarResult): PendingBase<B> {
	const source = grammarResultOf(base);
	if (handleOf(source.grammar.externals)?.consumed === false)
		throw new Error(`enrich(): '${source.grammar.name}' is a pending base no layer pass consumed; give enrich() the result of grammar()`);
	const grammar: Record<string, unknown> = { name: source.grammar.name };
	const pending = { grammar } as unknown as PendingBase<B>;
	grammar.externals = withHandle(source.grammar.externals, { pending, source, consumed: false });
	for (const key of PENDING_KEYS) {
		Object.defineProperty(grammar, key, {
			get() {
				throw new Error(
					`enrich(): the runtime read the base's ${key} before the layer pass completed it; the call order was verified against tree-sitter ${VERIFIED_TREE_SITTER}`
				);
			},
			enumerable: true,
			configurable: true
		});
	}
	return pending;
}

function copyProperties(target: object, source: object, skip: ReadonlySet<PropertyKey>): void {
	for (const key of Reflect.ownKeys(source)) {
		if (skip.has(key)) continue;
		const enumerable = Object.getOwnPropertyDescriptor(source, key)!.enumerable;
		Object.defineProperty(target, key, { value: Reflect.get(source, key), writable: true, enumerable, configurable: true });
	}
}

function completePendingBase(pending: PendingBase, completed: GrammarResult): void {
	const grammar = pending.grammar as Record<string, unknown>;
	const handle = handleOf(grammar.externals)!;
	for (const key of PENDING_KEYS) Object.defineProperty(grammar, key, { value: undefined, writable: true, enumerable: true, configurable: true });
	copyProperties(grammar, completed.grammar, new Set());
	grammar.externals = withHandle(completed.grammar.externals, handle);
	grammar.reserved = { ...(completed.grammar.reserved as Readonly<Record<string, unknown>> | undefined) };
	copyProperties(pending, completed, new Set(['grammar']));
}

type BaseEditsCheck<B, P> = IsShaped<B> extends true ? EditsCheck<EnrichedGrammar<B>, P> : unknown;

type BaseOptionsCheck<B, O> = B extends GrammarJson ? OptionsCheck<EnrichedGrammar<B>, O> : unknown;

type BaseLayerConfig<B> = Omit<B extends GrammarJson ? LayerConfig<B> : LayerConfig<GrammarJson>, 'edits' | 'options'>;

export function layerOptions<B = any, const P = unknown, const O = unknown>(
	config: BaseLayerConfig<NoInfer<B>> & {
		readonly edits?: P & BaseEditsCheck<NoInfer<B>, P> & Readonly<Record<string, TransformPatchMap | readonly TransformPatchMap[]>>;
		readonly options?: O & BaseOptionsCheck<NoInfer<B>, O> & OptionsConfig;
	}
): LayerOptions<B> {
	const layer = config as LayerConfig;
	let output: LayerOutput | undefined;
	const options: Record<string, unknown> = {
		...(layer.name === undefined ? {} : { name: layer.name }),
		...(layer.edits === undefined ? {} : { edits: layer.edits }),
		...(layer.factoryInline === undefined ? {} : { factoryInline: layer.factoryInline }),
		externals: function layerEntry(this: unknown, _$: unknown, previous?: unknown): unknown {
			const handle = handleOf(previous);
			if (handle === undefined) throw new Error(`wire(): the runtime gave externals that carry no pending base; a layer's base is given through enrich()`);
			if (handle.consumed) throw new Error(`wire(): a layer pass already consumed the pending base of '${handle.source.grammar.name}'`);
			handle.consumed = true;
			output = runLayerPass(handle.pending, layer);
			fillLayerOptions(options, output);
			return output.lists.externals;
		}
	};
	Object.defineProperty(options, 'rules', {
		get() {
			if (output === undefined)
				throw new Error(
					`wire(): the runtime read options.rules before it called externals, where the layer pass runs; the call order was verified against tree-sitter ${VERIFIED_TREE_SITTER}`
				);
			return ruleCallbacksOf(output);
		},
		enumerable: true,
		configurable: true
	});
	return options as unknown as LayerOptions<B>;
}

function returning(value: unknown): LayerCallback {
	return function layerValue(): unknown {
		return value;
	};
}

function ruleCallbacksOf(output: LayerOutput): Record<string, LayerCallback> {
	return Object.fromEntries([...output.bodies].map(([name, body]) => [name, returning(body)]));
}

function fillLayerOptions(options: Record<string, unknown>, output: LayerOutput): void {
	const { lists } = output;
	options.name ??= output.name;
	if (lists.reserved !== undefined)
		options.reserved = Object.fromEntries(Object.entries(lists.reserved).map(([set, words]) => [set, returning(words)]));
	if (lists.extras !== undefined) options.extras = returning(lists.extras);
	if (lists.word !== undefined) options.word = returning(lists.word);
	options.conflicts = returning(lists.conflicts);
	options.inline = returning(lists.inline);
	options.supertypes = returning(lists.supertypes);
	if (lists.precedences !== undefined) options.precedences = returning(lists.precedences);
	Object.defineProperty(options, '__wireContext__', { value: output.wire, enumerable: false, configurable: true });
}

export function enrichFixpoint(result: GrammarResult, sidecars: EnrichSidecars): { readonly checked: GrammarResult; readonly changed: readonly string[] } {
	const before = baseRulesOf<unknown>(result) ?? {};
	const checked = enrich(withEnrichSidecarsOf(result, sidecars)) as unknown as GrammarResult;
	const after = baseRulesOf<unknown>(checked) ?? {};
	const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
		(name) => JSON.stringify(before[name]) !== JSON.stringify(after[name])
	);
	return { checked, changed: changed.sort() };
}

interface IntakeCtx {
	readonly config: LayerConfig;
	readonly name: string;
	readonly inherited: LayerRecord | undefined;
	readonly diagnostics: GrammarDiagnostic[];
	readonly declared: EvaluatedConfig;
}

function intake(source: GrammarResult, ctx: IntakeCtx): GrammarResult {
	const { config, inherited } = ctx;
	if (inherited === undefined)
		return enrich(source, {
			groupBodies: ctx.declared.patterns.map((pattern) => pattern.body),
			extras: config.extras,
			fieldSites: authoredFieldSites(config.edits)
		}) as unknown as GrammarResult;
	if (config.resolutions !== undefined)
		throw new Error(`wire(): '${ctx.name}' gives resolutions, which belong to the first layer; its layer applies its section of the first layer's file`);
	const { checked, changed } = enrichFixpoint(source, inherited.sidecars);
	if (changed.length > 0)
		ctx.diagnostics.push({
			scope: 'grammar',
			code: 'layer-not-enrich-fixpoint',
			severity: 'fail',
			canProceed: false,
			grammar: ctx.name,
			message: `enrich changes ${changed.join(', ')} in the layer below '${ctx.name}', so that layer is not enrich's fixpoint`,
			details: { layer: ctx.name, depth: inherited.depth + 1, rules: changed }
		});
	return checked;
}

function wireConfigOf(config: LayerConfig, ctx: Pick<IntakeCtx, 'name' | 'inherited'>): WireConfig<any> {
	if (ctx.inherited !== undefined) return { ...config, name: ctx.name } as WireConfig<any>;
	const { extras: _intakeExtras, ...wired } = config;
	return { ...wired, name: ctx.name } as WireConfig<any>;
}

export function runLayerPass(base: PendingBase<unknown>, config: LayerConfig): LayerOutput {
	const handle = handleOf(base.grammar.externals);
	if (handle?.pending !== base) throw new Error(`runLayerPass(): the base is not a pending base enrich() made`);
	const { result, roles } = withRoleScope(() => evaluatedLayer(base, handle.source, config));
	return completeLayer(result.evaluated, result.ctx, roles);
}

function evaluatedLayer(base: PendingBase<unknown>, source: GrammarResult, config: LayerConfig): { readonly evaluated: Omit<LayerLists, 'conflicts'>; readonly ctx: LayerCtx } {
	const inherited = layerRecordOf(source);
	const name = config.name ?? source.grammar.name;
	const diagnostics = [...(inherited?.diagnostics ?? [])];
	const declared = evaluatedConfig(config);
	const completed = intake(source, { config, name, inherited, diagnostics, declared });
	completePendingBase(base, completed);
	const depth = (inherited?.depth ?? 0) + 1;
	const layer: WireLayer = { name, depth, diagnostics, narrows: [], leads: [] };
	const wired = wireImpl(wireConfigOf(config, { name, inherited }), completed, source, layer, declared);
	const wire = wired.__wireContext__!;
	const anyName = layerSymbols();
	const externals = wired.externals!.call(anyName, anyName, completed.grammar.externals as unknown[]);
	const bodies = wire.evaluatedBodies!;
	const baseRules = baseRulesOf<Rule>(completed) ?? {};
	const rules: Record<string, Rule> = { ...baseRules };
	for (const [ruleName, body] of bodies) rules[ruleName] = normalizedBody(body, ruleName);
	const symbols = layerSymbols(new Set([...Object.keys(rules), ...symbolNamesOf(externals)]));
	const evaluated = evaluatedLists(wired, { base: completed, symbols, externals });
	const view = layerView(name, rules, evaluated, completed);
	const ctx: LayerCtx = {
		...verbCtxOf(view, { effects: [...resolvedEffects(view, wire)], diagnostics }, rules),
		rules,
		created: [...bodies.keys()].filter((ruleName) => !(ruleName in baseRules)),
		depth,
		inherited,
		upstream: inherited?.upstream ?? (source.grammar as unknown as GrammarJson),
		base: completed,
		resolutions: inherited?.resolutions ?? config.resolutions ?? EMPTY_CONFLICT_RESOLUTIONS,
		conflictsAuthored: (inherited?.derivationRecords.conflictsAuthored ?? false) || config.conflicts !== undefined,
		wire,
		protectedNames: protectedWireRuleNames(wire),
		symbols,
		stageBases: inherited?.stageBases ?? (departsFromBase(wire, config) ? { name, raw: source, enriched: completed, inherited } : undefined)
	};
	applyNarrows(layer.narrows, ctx);
	applyLeads(layer.leads, ctx);
	return { evaluated, ctx };
}

function departsFromBase(wire: WireContext, config: LayerConfig): boolean {
	return wire.authoredRuleNames.size > 0 || Object.keys(config.edits ?? {}).length > 0;
}

function layerView(name: string, rules: Record<string, Rule>, evaluated: Omit<LayerLists, 'conflicts'>, base: GrammarResult): GrammarRecord {
	return {
		name,
		rules,
		externals: evaluated.externals,
		extras: evaluated.extras ?? base.grammar.extras,
		supertypes: evaluated.supertypes,
		inline: evaluated.inline,
		word: evaluated.word === undefined ? base.grammar.word : symbolNamesOf([evaluated.word]).values().next().value
	};
}

function resolvedEffects(view: GrammarRecord, wire: WireContext): readonly Effect[] {
	const own = wire.bindingEffects.filter((effect): effect is SegmentEffect | AliasEffect => effect.kind === 'segment' || effect.kind === 'alias');
	return effectsForOwners(view, own) as readonly Effect[];
}

function normalizedBody(body: unknown, name: string): Rule {
	if (body === undefined) throw new Error(`Rule '${name}' returned undefined.`);
	if (typeof body === 'string') return { type: 'STRING', value: body } as Rule;
	if (body instanceof RegExp) return (body.flags ? { type: 'PATTERN', value: body.source, flags: body.flags } : { type: 'PATTERN', value: body.source }) as Rule;
	if (body instanceof ReferenceError) throw body;
	if (isRecord(body) && typeof body.type === 'string') return body as unknown as Rule;
	throw new TypeError(`Invalid rule: ${String(body)}`);
}

interface ListsCtx {
	readonly base: GrammarResult;
	readonly symbols: Record<string, unknown>;
	readonly externals: unknown;
}

function evaluatedLists(wired: WiredOpts, ctx: ListsCtx): Omit<LayerLists, 'conflicts'> {
	const $ = ctx.symbols;
	const base = ctx.base.grammar as Readonly<Record<string, unknown>>;
	const reserved = base.reserved as Readonly<Record<string, unknown>> | undefined;
	return {
		externals: ctx.externals,
		...(wired.reserved === undefined
			? {}
			: { reserved: Object.fromEntries(Object.entries(wired.reserved).map(([set, words]) => [set, words.call($, $, reserved?.[set] as unknown[])])) }),
		...(wired.extras === undefined ? {} : { extras: wired.extras.call($, $, base.extras as unknown[]) }),
		...(wired.word === undefined ? {} : { word: wired.word.call($, $) }),
		inline: wired.inline?.call($, $, namedSymbols(base.inline)) ?? [],
		supertypes: wired.supertypes?.call($, $, namedSymbols(base.supertypes)) ?? [],
		...(wired.precedences === undefined ? {} : { precedences: wired.precedences.call($, $, base.precedences as unknown[][]) })
	};
}

function resolutionSections(resolutions: ConflictResolutionsInput): readonly (readonly ConflictResolutionRecord[])[] {
	return [resolutions.resolutions, resolutions.bound.resolutions];
}

function layerConflicts(ctx: LayerCtx): readonly (readonly unknown[])[] {
	const own = (resolutionSections(ctx.resolutions)[ctx.depth - 1] ?? []).map((record) => namedSymbols(record.resolution.symbols));
	if (ctx.depth === 1) return own;
	const given = ((ctx.base.grammar.conflicts as readonly (readonly unknown[])[] | undefined) ?? []).map((set) => namedSymbols(set));
	return [...given, ...own];
}

function completeLayer(evaluated: Omit<LayerLists, 'conflicts'>, ctx: LayerCtx, roles: ReadonlyMap<string, ExternalRole>): LayerOutput {
	const { rules, wire, depth } = ctx;
	const projections = ctx.inherited === undefined ? undefined : appendProvenance(ctx.inherited.projections, provenanceOf(ctx.effects, rules));
	const view = { grammar: { ...ctx.grammar, rules, supertypes: ctx.lists.supertypes, inline: ctx.lists.inline } };
	stampWiredVariants(view, ctx.base, wire.automaticVariants, new Set(wire.elementSupertypes.keys()));
	const dead = deadEnrichMints(view.grammar, { mints: getEnrichMints(ctx.base), protectedNames: ctx.protectedNames });
	const blank = nativeRuleFn<() => Rule>('blank');
	for (const name of dead) rules[name] = blank();
	const deadMints = new Set([...(ctx.inherited?.deadMints ?? []), ...dead]);
	const liftNames = new Map<string, LiftName>([...(ctx.inherited?.liftNames ?? []), ...wire.liftNames]);
	const sections = resolutionSections(ctx.resolutions);
	const supertypes = withoutDeadNames(ctx.lists.supertypes, dead) as readonly unknown[];
	const baseRules = baseRulesOf(ctx.base) ?? {};
	const start = Object.keys(rules)[0];
	const bodies = new Map<string, unknown>();
	for (const [name, body] of wire.evaluatedBodies!) bodies.set(name, name === start || dead.has(name) || isRecord(body) ? rules[name] : body);
	for (const name of ctx.created) if (!bodies.has(name)) bodies.set(name, rules[name]);
	const own = ownRecordsOf(wire, { supertypes: [...symbolNamesOf(supertypes)], roles, unmatchedGroups: unmatchedGroupPatterns(rules, baseRules, wire) });
	const record: LayerRecord = {
		depth,
		upstream: ctx.upstream,
		sidecars: enrichSidecarsOf(ctx.base),
		resolutions: ctx.resolutions,
		deadMints,
		textTokens: [...getEnrichTextTokens(ctx.base).keys()].filter((name) => !deadMints.has(name)),
		liftNames,
		effects: [...(ctx.inherited?.effects ?? []), ...ctx.effects],
		records: mergedRecords(ctx.inherited === undefined ? undefined : rewriteInherited(ctx.inherited.records, { effects: ctx.effects, rules }), own),
		synthesized: [...(ctx.inherited?.synthesized ?? []), ...synthesizedOf(new Set([...Object.keys(baseRules), ...bodies.keys()]).size, own)],
		automaticVariants: wire.automaticVariants,
		stageBases: ctx.stageBases,
		projections,
		derivationRecords: derivationRecordsOf(rules, {
			upstream: ctx.upstream,
			liftNames,
			conflicts: { resolutions: sections[0]!, boundResolutions: sections.slice(1, depth).flat(), conflictsAuthored: ctx.conflictsAuthored }
		}),
		diagnostics: ctx.diagnostics
	};
	if (start !== undefined) bodies.set(start, withLayerRecord(rules[start]!, record));
	return {
		name: ctx.name,
		bodies,
		lists: {
			...evaluated,
			conflicts: layerConflicts(ctx),
			inline: withoutDeadNames(ctx.lists.inline, dead) as readonly unknown[],
			supertypes
		},
		record,
		wire
	};
}

export interface OwnRecordFacts {
	readonly supertypes: readonly string[];
	readonly roles: ReadonlyMap<string, ExternalRole>;
	readonly unmatchedGroups: readonly string[];
}

export function ownRecordsOf(wire: WireContext, facts: OwnRecordFacts): LayerRecords {
	const undeclaredRules = [...wire.undeclaredRules].sort();
	const patchSites = [...wire.patchSites]
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		.map(([key, site]) => {
			const lifts = wire.liftClaims.get(key);
			return lifts === undefined ? site : { ...site, lifts: [...lifts].sort() };
		});
	return {
		options: nonEmpty(wire.options),
		renderAs: normalizedBodies(wire.renderAs),
		visibleExternals: normalizedBodies(wire.visibleExternals),
		reparseHosts: wire.reparseHosts,
		refineForms: wire.refineForms.size === 0 ? undefined : new Map(wire.refineForms),
		ruleCauses: wire.ruleCauses.size === 0 ? undefined : Object.fromEntries(wire.ruleCauses),
		undeclaredRules: undeclaredRules.length === 0 ? undefined : undeclaredRules,
		patchSites: patchSites.length === 0 ? undefined : patchSites,
		externalRoles: facts.roles.size === 0 ? undefined : new Map(facts.roles),
		expectDiagnostics: definedEntries(wire.expectDiagnostics),
		expectTestFailures: definedEntries(wire.expectTestFailures),
		protectedRuleNames: [...protectedWireRuleNames(wire), ...facts.supertypes],
		whitespaceCollisions: wire.whitespaceCollisions?.length ? wire.whitespaceCollisions : undefined,
		bodyPatternZeroMatches: facts.unmatchedGroups.length === 0 ? undefined : facts.unmatchedGroups
	};
}

function nonEmpty<T extends object>(value: T | undefined): T | undefined {
	return value === undefined || Object.keys(value).length === 0 ? undefined : value;
}

function definedEntries<V>(entries: Partial<Record<string, V>> | undefined): Record<string, V> | undefined {
	return nonEmpty(Object.fromEntries(Object.entries(entries ?? {}).filter((entry): entry is [string, V] => entry[1] !== undefined)));
}

function normalizedBodies(bodies: Readonly<Record<string, unknown>> | undefined): Record<string, Rule> | undefined {
	return nonEmpty(Object.fromEntries(Object.entries(bodies ?? {}).map(([name, body]) => [name, normalizedBody(body, name)])));
}
