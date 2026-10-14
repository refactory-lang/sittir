import { attachTextTokens, enrich, getEnrichTextTokens, stampWiredVariants, type EnrichedGrammar, type GrammarResult } from './enrich.ts';
import { authoredFieldSites, authoredGroupBodies, wire, wireBindingEffects, type OptionsCheck, type PatchesCheck, type PatchesConfig, type WireConfig, type WiredOpts } from './wire/wire.ts';
import { blankDeadEnrichMints, getDeadEnrichMints } from './wire/dead-mints.ts';
import { attachDerivationRecords } from './wire/derivation-records.ts';
import { applyBoundConflictResolutions, applyConflictResolutions, type ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import { bindGrammar, checkBindingPatches, markBindingSet, type Bindings } from './bind.ts';

type GrammarFn = (base: unknown, options: WiredOpts) => GrammarResult;

export const UNBOUND_ENV = 'SITTIR_UNBOUND';

const unboundRequested = (): boolean => process.env[UNBOUND_ENV] === '1';

const patchSets = (entry: unknown): readonly unknown[] => (entry === undefined ? [] : Array.isArray(entry) ? entry : [entry]);

function withBindingPatches(authored: PatchesConfig | undefined, bindingPatches: PatchesConfig): PatchesConfig {
	const out: Record<string, unknown> = { ...authored };
	for (const [kind, entry] of Object.entries(bindingPatches)) out[kind] = [...patchSets(out[kind]), ...patchSets(entry).map((set) => markBindingSet(set as object))];
	return out as PatchesConfig;
}

export function sittirGrammar<B extends GrammarJson, const P = PatchesConfig<EnrichedGrammar<B>>, const O = OptionsConfig>(
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
	const enriched = enrich(base, { groupBodies: authoredGroupBodies(wireConfig.groups), extras: wireConfig.extras, fieldSites: authoredFieldSites(wireConfig.patches) });
	const grammar = (globalThis as unknown as { grammar: GrammarFn }).grammar;
	if (bindings?.patches !== undefined) checkBindingPatches(enriched, bindings.patches);
	const wiring = bindings?.patches === undefined ? wireConfig : ({ ...wireConfig, patches: withBindingPatches(wireConfig.patches, bindings.patches) } as typeof wireConfig);
	const opts = wire<EnrichedGrammar<B>, P, O>(wiring, enriched, base);
	const result = grammar(enriched, opts);
	const wireContext = opts.__wireContext__;
	if (wireContext !== undefined) stampWiredVariants(result, enriched, wireContext.automaticVariants, new Set(wireContext.elementSupertypes.keys()));
	blankDeadEnrichMints(result.grammar, enriched, opts);
	const dead = getDeadEnrichMints(result.grammar);
	attachTextTokens(result.grammar, [...getEnrichTextTokens(enriched).keys()].filter((name) => !dead.has(name)));
	attachDerivationRecords(result.grammar, base, opts, {
		resolutions: resolutions.resolutions,
		boundResolutions: unbound ? [] : resolutions.bound.resolutions,
		conflictsAuthored: wireConfig.conflicts !== undefined
	});
	applyConflictResolutions(result.grammar, resolutions);
	if (unbound) return result;
	const grammarRecord = result.grammar as unknown as Record<string, unknown>;
	const bound = bindings === undefined ? grammarRecord : bindGrammar(grammarRecord, bindings, wireBindingEffects(opts));
	applyBoundConflictResolutions(bound, resolutions);
	return { ...result, grammar: bound } as GrammarResult;
}
