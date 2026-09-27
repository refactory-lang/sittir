import { enrich, type EnrichedGrammar, type GrammarResult } from './enrich.ts';
import { authoredGroupBodies, wire, type OptionsCheck, type PatchesCheck, type PatchesConfig, type WireConfig, type WiredOpts } from './wire/wire.ts';
import type { OptionsConfig } from './wire/options-block.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';

type GrammarFn = (base: unknown, options: WiredOpts) => GrammarResult;

export function sittirGrammar<B extends GrammarJson, const P = PatchesConfig<EnrichedGrammar<B>>, const O = OptionsConfig>(
	base: B,
	config: WireConfig<EnrichedGrammar<B>> & {
		readonly patches?: P & PatchesCheck<EnrichedGrammar<B>, P>;
		readonly options?: O & OptionsCheck<EnrichedGrammar<B>, O>;
	}
): GrammarResult {
	const enriched = enrich(base, { groupBodies: authoredGroupBodies(config.groups) });
	const grammar = (globalThis as unknown as { grammar: GrammarFn }).grammar;
	return grammar(enriched, wire<EnrichedGrammar<B>, P, O>(config, enriched));
}
