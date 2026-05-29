// Authoring-typed facade over the DSL primitives, for overrides.ts.
//
// Same runtime impls as `./index.ts`, but with grammar-shapes return types that
// are accurate in the tree-sitter authoring context (where these produce
// tree-sitter-shaped rules). The loose dual-runtime `FieldLike`/`RuntimeRule`
// types stay codegen-internal — overrides.ts never sees them. One boundary cast
// per primitive asserts the authoring-context contract; runtime is unchanged.
import { field as fieldImpl, type FieldPlaceholder } from './primitives/field.ts';
import { alias as aliasImpl, type AliasPlaceholder } from './primitives/alias.ts';
import { transform as transformImpl } from './transform/transform.ts';
import type { Field, Alias, GrammarNode, AuthoringRule } from '../grammar-shapes/grammar-json.ts';

// Pass-throughs (no authoring-specific return shape to tighten).
export { variant } from './primitives/variant.ts';
export { enrich } from './enrich.ts';
export { wire } from './wire/wire.ts';
export type { WireConfig } from './wire/wire.ts';

/** 1-arg → transform placeholder; 2-arg → a grammar-shapes `Field` (rule body). */
interface AuthoringField {
	(name: string): FieldPlaceholder;
	<const N extends string>(name: N, content: AuthoringRule): Field<N, GrammarNode>;
}
export const field = fieldImpl as unknown as AuthoringField;

/** 1-arg string → transform placeholder; 1/2-arg rule → a grammar-shapes `Alias`. */
interface AuthoringAlias {
	(name: string): AliasPlaceholder;
	(rule: AuthoringRule, value?: string | AuthoringRule): Alias<string, GrammarNode>;
}
export const alias = aliasImpl as unknown as AuthoringAlias;

/** Patches preserve the rule's shape → return the original's (recursive) type. */
export const transform = transformImpl as unknown as <T>(original: T, ...patches: readonly unknown[]) => T;
