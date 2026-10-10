import { attachTextTokens, enrich, getEnrichTextTokens, type EnrichedGrammar, type GrammarResult } from './enrich.ts';
import { authoredFieldSites, authoredGroupBodies, wire, wireBindingEffects, type OptionsCheck, type PatchesCheck, type PatchesConfig, type WireConfig, type WiredOpts } from './wire/wire.ts';
import { blankDeadEnrichMints, getDeadEnrichMints } from './wire/dead-mints.ts';
import { attachDerivationRecords } from './wire/derivation-records.ts';
import { applyConflictResolutions, type ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import { bindGrammar, checkBindingPatches, markBindingSet, type Bindings } from './bind.ts';

type GrammarFn = (base: unknown, options: WiredOpts) => GrammarResult;

export const UNBOUND_ENV = 'SITTIR_UNBOUND';

const unboundRequested = (): boolean => process.env[UNBOUND_ENV] === '1';

const patchSets = (entry: unknown): readonly unknown[] => (entry === undefined ? [] : Array.isArray(entry) ? entry : [entry]);

function withBindingPatches(authored: PatchesConfig | undefined, overlay: PatchesConfig): PatchesConfig {
	const out: Record<string, unknown> = { ...authored };
	for (const [kind, entry] of Object.entries(overlay)) out[kind] = [...patchSets(out[kind]), ...patchSets(entry).map((set) => markBindingSet(set as object))];
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
	const { resolutions, bindings: overlay, ...wireConfig } = config;
	const bindings = unboundRequested() ? undefined : overlay;
	const enriched = enrich(base, { groupBodies: authoredGroupBodies(wireConfig.groups), extras: wireConfig.extras, fieldSites: authoredFieldSites(wireConfig.patches) });
	const grammar = (globalThis as unknown as { grammar: GrammarFn }).grammar;
	if (bindings?.patches !== undefined) checkBindingPatches(enriched, bindings.patches);
	const wiring = bindings?.patches === undefined ? wireConfig : ({ ...wireConfig, patches: withBindingPatches(wireConfig.patches, bindings.patches) } as typeof wireConfig);
	const opts = wire<EnrichedGrammar<B>, P, O>(wiring, enriched, base);
	const result = grammar(enriched, opts);
	blankDeadEnrichMints(result.grammar, enriched, opts);
	const dead = getDeadEnrichMints(result.grammar);
	attachTextTokens(result.grammar, [...getEnrichTextTokens(enriched).keys()].filter((name) => !dead.has(name)));
	attachDerivationRecords(result.grammar, base, opts, {
		resolutions: resolutions.resolutions,
		conflictsAuthored: wireConfig.conflicts !== undefined
	});
	applyConflictResolutions(result.grammar, resolutions);
	if (bindings === undefined) return result;
	return { ...result, grammar: bindGrammar(result.grammar as unknown as Record<string, unknown>, bindings, wireBindingEffects(opts)) } as GrammarResult;
}
