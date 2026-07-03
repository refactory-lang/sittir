/**
 * transform-original.test-d.ts — proves the precise-`original` HAND-OFF
 * mechanism (the A-half deliverable surface for live overrides.ts) works
 * standalone, independent of the blocked rules-callback `$` wiring.
 *
 * When the in-flight wire.ts `RuleFn`→`RuleBuilder` refactor lands, an author
 * writes:
 *
 *   or_pattern: ($, original: EnrichRule<RustGrammarShape['rules']['or_pattern']>) =>
 *     transform(original, { '0/0': field('left') })   // '0/0' autocompletes, OOB rejected
 *
 * or, with the builder twin, `RecursiveRuleBuilder<RustGrammarShape, K>` types
 * `previous` to the rule's post-Enrich shape automatically. Both are proven
 * here against the concrete `RustGrammarShape` (cheap — no loose-union
 * recursion). The ONLY blocker to wiring this into the live config is that
 * wire.ts currently types `rules` callbacks via the permissive
 * `RuleFn = (this, $: unknown, previous?: unknown) => unknown` escape hatch
 * (another dev's mid-flight refactor) — once that becomes `RuleBuilder`, the
 * config flip yields precise `$` AND `original`.
 */
import { describe, it, expectTypeOf, assertType } from 'vitest';
import { rustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';
import type { RuleAtPath, TopLevelKeys } from '../path-type.ts';
import type { RecursiveRuleBuilder } from '../grammar-twin.ts';

type Shape = typeof rustGrammarShape;
type Rules = Shape['rules'];

describe('precise transform original (hand-off mechanism, standalone)', () => {
  it('a transform callback can type `original` as the rule post-Enrich shape', () => {
    // Simulating: or_pattern: ($, original) => transform(original, {...})
    type OriginalOf<K extends keyof Rules> = EnrichRule<Rules[K]>;
    type OrOriginal = OriginalOf<'or_pattern'>;
    // original is navigable:
    type N00 = RuleAtPath<OrOriginal, '0/0'>;
    expectTypeOf<(N00 & { name: string })['name']>().toEqualTypeOf<'_pattern'>();
    // and segment-1 keys autocomplete:
    expectTypeOf<TopLevelKeys<OrOriginal>>().toEqualTypeOf<'0' | '1'>();
    // @ts-expect-error — RuleAtPath of an out-of-bounds path is `never`.
    const _bad: RuleAtPath<OrOriginal, '5/0'> = { type: 'SYMBOL', name: 'x' } as const;
    void _bad;
  });

  it('RecursiveRuleBuilder narrows previous to the base rule shape', () => {
    type RB = RecursiveRuleBuilder<Shape, 'or_pattern'>;
    type Prev = Parameters<RB>[1];
    // previous IS the post-Enrich or_pattern shape (PREC_LEFT top node):
    expectTypeOf<(Prev & { type: string })['type']>().toEqualTypeOf<'PREC_LEFT'>();
  });
});
