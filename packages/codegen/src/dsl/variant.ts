/**
 * dsl/variant.ts — nested-alias polymorph sugar.
 *
 * `variant('block')` inside a rule callback for `closure_expression`
 * expands to `alias('closure_expression_block')` and registers the
 * polymorph relationship. Only variant() calls register polymorph
 * metadata — plain alias() is for general-purpose aliasing.
 *
 * Usage in overrides.ts:
 *
 *     closure_expression: ($, original) => transform(original,
 *         { 0: field('static'), 1: field('async'), 2: field('move') },
 *         { '4/0': variant('block'), '4/1': variant('expr') },
 *     ),
 */

export interface VariantPlaceholder {
    readonly __sittirPlaceholder: 'variant'
    readonly name: string
}

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
    return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant'
}

export function variant(name: string): VariantPlaceholder {
    return { __sittirPlaceholder: 'variant' as const, name }
}
