import { attachTextTokens, enrich, enrichSidecarsOf, getEnrichTextTokens, stampWiredVariants, type EnrichedGrammar, type GrammarResult } from './enrich.ts';
import { enrichFixpoint } from './layer.ts';
import {
	authoredFieldSites,
	authoredGroupBodies,
	wire,
	wireBindings,
	wireBindingEffects,
	type EditsCheck,
	type EditsConfig,
	type OptionsCheck,
	type WireConfig,
	type WiredOpts
} from './wire/wire.ts';
import { blankDeadEnrichMints, DEAD_ENRICH_MINTS_KEY, getDeadEnrichMints } from './wire/dead-mints.ts';
import { attachDerivationRecords } from './wire/derivation-records.ts';
import { applyBoundConflictResolutions, applyConflictResolutions, type ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import { bindGrammar, checkBindingPatches, type Bindings } from './bind.ts';

type GrammarFn = (base: unknown, options: WiredOpts) => GrammarResult;

export const UNBOUND_ENV = 'SITTIR_UNBOUND';

const unboundRequested = (): boolean => process.env[UNBOUND_ENV] === '1';

function assertEnrichFixpoint(wired: GrammarResult, enriched: unknown): GrammarResult {
	const { checked, changed } = enrichFixpoint(wired, enrichSidecarsOf(enriched));
	if (changed.length > 0)
		throw new Error(
			`grammar bindings: enrich changes ${changed.join(', ')} in the wired grammar, so the bindings layer's base is not enrich's fixpoint`
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
	const P = EditsConfig<EnrichedGrammar<B>>,
	const O = OptionsConfig
>(
	base: B,
	config: WireConfig<EnrichedGrammar<B>> & {
		readonly edits?: P & EditsCheck<EnrichedGrammar<B>, P>;
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
		fieldSites: authoredFieldSites(wireConfig.edits)
	});
	const { extras: _enrichExtras, ...wiredConfig } = wireConfig;
	const opts = wire<EnrichedGrammar<B>, P, O>(wiredConfig, enriched, base);
	let result = completeLayer(enriched, opts);
	if (bindings !== undefined) {
		const bindingBase = assertEnrichFixpoint(result, enriched);
		checkBindingPatches(bindingBase, bindings.patches);
		const bindingOpts = wireBindings(result.grammar.name, bindingBase, bindings.patches ?? {});
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
