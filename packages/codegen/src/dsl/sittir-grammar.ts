import { attachTextTokens, enrich, getEnrichTextTokens, stampWiredVariants, withEnrichSidecarsOf, type EnrichedGrammar, type GrammarResult } from './enrich.ts';
import { baseRulesOf } from './shared.ts';
import {
	authoredFieldSites,
	authoredGroupBodies,
	wire,
	wireBindings,
	wireBindingEffects,
	type OptionsCheck,
	type PatchesCheck,
	type PatchesConfig,
	type WireConfig,
	type WiredOpts
} from './wire/wire.ts';
import { blankDeadEnrichMints, DEAD_ENRICH_MINTS_KEY, getDeadEnrichMints } from './wire/dead-mints.ts';
import { attachDerivationRecords } from './wire/derivation-records.ts';
import { applyBoundConflictResolutions, applyConflictResolutions, type ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import { bindGrammar, checkBindingPatches, markBindingSet, type Bindings } from './bind.ts';

type GrammarFn = (base: unknown, options: WiredOpts) => GrammarResult;

export const UNBOUND_ENV = 'SITTIR_UNBOUND';

const unboundRequested = (): boolean => process.env[UNBOUND_ENV] === '1';

const patchSets = (entry: unknown): readonly unknown[] =>
	entry === undefined ? [] : Array.isArray(entry) ? entry : [entry];

function markedBindingPatches(bindingPatches: PatchesConfig): PatchesConfig {
	const out: Record<string, unknown> = {};
	for (const [kind, entry] of Object.entries(bindingPatches))
		out[kind] = patchSets(entry).map((set) => markBindingSet(set as object));
	return out as PatchesConfig;
}

function assertEnrichFixpoint(wired: GrammarResult, enriched: unknown): EnrichedGrammar<GrammarResult> {
	const before = baseRulesOf<unknown>(wired) ?? {};
	const checked = enrich(withEnrichSidecarsOf(wired, enriched));
	const after = baseRulesOf<unknown>(checked) ?? {};
	const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
		(name) => JSON.stringify(before[name]) !== JSON.stringify(after[name])
	);
	if (changed.length > 0)
		throw new Error(
			`grammar bindings: enrich changes ${changed.sort().join(', ')} in the wired grammar, so the bindings layer's base is not enrich's fixpoint`
		);
	return checked;
}

function completeLayer(
	enriched: unknown,
	opts: WiredOpts,
	previous?: GrammarResult,
	bindings?: Bindings
): GrammarResult {
	const grammar = (globalThis as unknown as { grammar: GrammarFn }).grammar;
	let result = grammar(enriched, opts);
	if (previous !== undefined) {
		for (const key of Reflect.ownKeys(previous.grammar)) {
			const descriptor = Object.getOwnPropertyDescriptor(previous.grammar, key);
			if (descriptor !== undefined && !descriptor.enumerable) Object.defineProperty(result.grammar, key, descriptor);
		}
	}
	if (bindings !== undefined)
		result = {
			...result,
			grammar: bindGrammar(result.grammar, bindings, wireBindingEffects(opts)) as GrammarResult['grammar']
		};
	const wireContext = opts.__wireContext__;
	if (wireContext !== undefined)
		stampWiredVariants(result, enriched, wireContext.automaticVariants, new Set(wireContext.elementSupertypes.keys()));
	const priorDead = getDeadEnrichMints(result.grammar);
	blankDeadEnrichMints(result.grammar, enriched, opts);
	const dead = new Set([...priorDead, ...getDeadEnrichMints(result.grammar)]);
	Object.defineProperty(result.grammar, DEAD_ENRICH_MINTS_KEY, {
		value: dead,
		enumerable: false,
		writable: false,
		configurable: true
	});
	attachTextTokens(
		result.grammar,
		[...getEnrichTextTokens(enriched).keys()].filter((name) => !dead.has(name))
	);
	return result;
}

export function sittirGrammar<
	B extends GrammarJson,
	const P = PatchesConfig<EnrichedGrammar<B>>,
	const O = OptionsConfig
>(
	base: B,
	config: WireConfig<EnrichedGrammar<B>> & {
		readonly patches?: P & PatchesCheck<EnrichedGrammar<B>, P>;
		readonly options?: O & OptionsCheck<EnrichedGrammar<B>, O>;
		readonly resolutions: ConflictResolutionsInput;
		readonly bindings?: Bindings;
	}
): GrammarResult {
	const { resolutions, bindings: grammarBindings, ...wireConfig } = config;
	const unbound = unboundRequested();
	const bindings = unbound ? undefined : grammarBindings;
	const enriched = enrich(base, {
		groupBodies: authoredGroupBodies(wireConfig.groups),
		extras: wireConfig.extras,
		fieldSites: authoredFieldSites(wireConfig.patches)
	});
	const opts = wire<EnrichedGrammar<B>, P, O>(wireConfig, enriched, base);
	let result = completeLayer(enriched, opts);
	if (bindings !== undefined) {
		const bindingBase = assertEnrichFixpoint(result, enriched);
		checkBindingPatches(bindingBase, bindings.patches);
		const bindingOpts = wireBindings(result.grammar.name, bindingBase, markedBindingPatches(bindings.patches ?? {}));
		result = completeLayer(bindingBase, bindingOpts, result, bindings);
		if (opts.__wireContext__ !== undefined) {
			for (const [name, entry] of bindingOpts.__wireContext__?.liftNames ?? [])
				opts.__wireContext__.liftNames.set(name, entry);
		}
	}
	attachDerivationRecords(result.grammar, base, opts, {
		resolutions: resolutions.resolutions,
		boundResolutions: unbound ? [] : resolutions.bound.resolutions,
		conflictsAuthored: wireConfig.conflicts !== undefined
	});
	applyConflictResolutions(result.grammar, resolutions);
	if (!unbound) applyBoundConflictResolutions(result.grammar, resolutions);
	return result;
}
