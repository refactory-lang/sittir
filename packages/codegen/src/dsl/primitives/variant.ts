/**
 * dsl/variant.ts — nested-alias polymorph sugar.
 *
 * `variant('block')` inside a rule callback for `closure_expression` mints a
 * kind name for that anonymous choice arm — equivalent to an author writing
 * an explicit `alias('closure_expression_block')` — and registers the hidden
 * rule plus a GLR conflict group so the arms remain distinguishable. It
 * carries NO classification metadata: the `WireContext` has no
 * `polymorphVariants`-style channel (deleted in the V2 wire-channel-deletion
 * work; see `dsl/wire/wire.ts`'s `WireContext`, which has only `deposits` /
 * `syntheticInline` / `conflictGroups` / `refineForms` / `groups`), per
 * `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`
 * decision 7.
 *
 * Usage in overrides.ts:
 *
 *     closure_expression: ($, original) => transform(original,
 *         { 0: field('static'), 1: field('async'), 2: field('move') },
 *         { '4/0': variant('block'), '4/1': variant('expr') },
 *     ),
 */

export interface VariantPlaceholder {
	readonly __sittirPlaceholder: 'variant';
	readonly name: string;
}

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant';
}

export function variant(name: string): VariantPlaceholder {
	return { __sittirPlaceholder: 'variant' as const, name };
}
