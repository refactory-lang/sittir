/**
 * types/ir.ts — IR-level metadata types shared by the DSL and the compiler
 * (R11). Both sides import DOWN into this layer; neither imports the other.
 */

/**
 * (R12/decision-7 V2 Task 2) `PolymorphVariant` — the wire-registered
 * `{parent, child}` pair type — is DELETED. Variant-adoption pairs are now
 * discovered structurally from the post-link rule tree
 * (`deriveStructuralVariantChildren`, compiler/variant-structural.ts)
 * instead of a metadata channel. This comment marks the historical
 * deletion site; do not resurrect the type.
 */

/** External-scanner role binding (indent / dedent / newline tokens). */
export type ExternalRole = { role: 'indent' | 'dedent' | 'newline' };
