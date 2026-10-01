import { attachTextTokens, enrich, getEnrichTextTokens, type EnrichedGrammar, type GrammarResult } from './enrich.ts';
import { authoredFieldSites, authoredGroupBodies, wire, type OptionsCheck, type PatchesCheck, type PatchesConfig, type WireConfig, type WiredOpts } from './wire/wire.ts';
import { blankDeadEnrichMints, getDeadEnrichMints } from './wire/dead-mints.ts';
import { resolveLiftNames } from './wire/lift-names.ts';
import { attachDerivationRecords } from './wire/derivation-records.ts';
import { applyConflictResolutions, type ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';

type GrammarFn = (base: unknown, options: WiredOpts) => GrammarResult;

export function sittirGrammar<B extends GrammarJson, const P = PatchesConfig<EnrichedGrammar<B>>, const O = OptionsConfig>(
	base: B,
	config: WireConfig<EnrichedGrammar<B>> & {
		readonly patches?: P & PatchesCheck<EnrichedGrammar<B>, P>;
		readonly options?: O & OptionsCheck<EnrichedGrammar<B>, O>;
		readonly resolutions: ConflictResolutionsInput;
	}
): GrammarResult {
	const { resolutions, ...wireConfig } = config;
	const enriched = enrich(base, { groupBodies: authoredGroupBodies(wireConfig.groups), extras: wireConfig.extras, fieldSites: authoredFieldSites(wireConfig.patches) });
	const grammar = (globalThis as unknown as { grammar: GrammarFn }).grammar;
	const opts = wire<EnrichedGrammar<B>, P, O>(wireConfig, enriched, base);
	const result = grammar(enriched, opts);
	resolveLiftNames(result.grammar, enriched, opts);
	blankDeadEnrichMints(result.grammar, enriched, opts);
	const dead = getDeadEnrichMints(result.grammar);
	attachTextTokens(result.grammar, [...getEnrichTextTokens(enriched).keys()].filter((name) => !dead.has(name)));
	attachDerivationRecords(result.grammar, base, opts, {
		resolutions: resolutions.resolutions,
		conflictsAuthored: wireConfig.conflicts !== undefined
	});
	applyConflictResolutions(result.grammar, resolutions);
	return result;
}
