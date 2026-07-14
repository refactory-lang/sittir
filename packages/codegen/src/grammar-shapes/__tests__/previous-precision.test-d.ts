import { expectTypeOf } from 'vitest';
import type { WireConfig } from '../../dsl/wire/wire.ts';
import type { EnrichedGrammar } from '../../dsl/enrich.ts';
import type { RustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';

// `wire` receives the ENRICHED schema (`enrich(base)` emits `EnrichedGrammar<…>`),
// and `WireConfig` reads its schema's rules directly. So a rule callback's
// `previous`/`original` is the rule's POST-ENRICH shape — preserved precisely,
// not flattened to `any`/`GrammarRule`.
type Rules = NonNullable<WireConfig<EnrichedGrammar<RustGrammarShape>>['rules']>;
type BinPrev = Rules['binary_expression'] extends (($: any, p: infer P) => any) | undefined ? P : never;

expectTypeOf<BinPrev>().toEqualTypeOf<EnrichRule<RustGrammarShape['rules']['binary_expression']>>();
