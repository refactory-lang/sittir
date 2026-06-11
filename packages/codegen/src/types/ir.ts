/**
 * types/ir.ts — IR-level metadata types shared by the DSL and the compiler
 * (R11). Both sides import DOWN into this layer; neither imports the other.
 */

/**
 * One entry in the `polymorphVariants` lists carried by LinkedGrammar /
 * OptimizedGrammar / NodeMap — records that a `variant('x')` override inside
 * rule `parent` produced a visible child kind `parent_x` in the parse tree.
 *
 * Emitted by the DSL (`dsl/wire`'s `registerPolymorphVariant` path) and
 * propagated through the pipeline so Link, Assemble, and the factory/from
 * emitters can expose `parent_x` as a discriminable variant form.
 */
export interface PolymorphVariant {
	readonly parent: string;
	readonly child: string;
}

/** External-scanner role binding (indent / dedent / newline tokens). */
export type ExternalRole = { role: 'indent' | 'dedent' | 'newline' };
