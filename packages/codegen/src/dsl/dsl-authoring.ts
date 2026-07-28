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
import type { GrammarResult, EnrichedGrammar } from './enrich.ts';
import type { WiredOpts } from './wire/wire.ts';
import type {
	FieldRule,
	AliasRule,
	GrammarRule,
	GrammarJson,
	AuthoringRule,
	ToGrammarRule,
	PrecRule,
	PrecLeftRule,
	PrecRightRule,
	PrecDynamicRule,
	TokenRule,
	ImmediateTokenRule
} from '../grammar-shapes/grammar-json.ts';

// Pass-throughs (no authoring-specific return shape to tighten).
export { variant } from './primitives/variant.ts';
export { enrich } from './enrich.ts';
export type { GrammarResult } from './enrich.ts';
export { wire } from './wire/wire.ts';
export type { WireConfig, WiredOpts } from './wire/wire.ts';

interface AuthoringField {
	(name: string): FieldPlaceholder;
	<const N extends string>(name: N, content: AuthoringRule): FieldRule<N, GrammarRule>;
}
export const field = fieldImpl as unknown as AuthoringField;

interface AuthoringAlias {
	(name: string): AliasPlaceholder;
	(rule: AuthoringRule, value?: string | AuthoringRule): AliasRule<string, GrammarRule>;
}
export const alias = aliasImpl as unknown as AuthoringAlias;

/** Patches preserve the rule's shape → return the original's (recursive) type. */
export const transform = transformImpl as unknown as <T>(original: T, ...patches: readonly unknown[]) => T;

// `prec`/`token` are runtime-injected by `saveAndInjectDslGlobals` (same as
// `field`/`alias`'s underlying primitives) before an overrides.ts module graph
// is evaluated — see compiler/evaluate.ts. Unlike `field`/`alias`, there's no
// sittir-owned `primitives/prec.ts`/`primitives/token.ts` runtime (tree-sitter's
// own `prec`/`token` need no override-specific placeholder behavior), so we
// re-type the SAME injected global here rather than re-implementing it.
//
// This module is exported to and imported by overrides.ts, which shadows the
// ambient `prec`/`token` (declared in authoring-globals.d.ts) via ordinary
// lexical scoping — sidestepping the fact that `const`-declared ambient
// globals don't merge as overloads across files the way `declare function`
// does (unlike seq/choice/field/alias/optional/repeat/repeat1/sym/string/blank,
// which merge fine and don't need this treatment).
interface AuthoringPrec {
	<R extends AuthoringRule>(value: number | string, rule: R): PrecRule<ToGrammarRule<R>>;
	left<R extends AuthoringRule>(value: number | string, rule: R): PrecLeftRule<ToGrammarRule<R>>;
	right<R extends AuthoringRule>(value: number | string, rule: R): PrecRightRule<ToGrammarRule<R>>;
	dynamic<R extends AuthoringRule>(value: number, rule: R): PrecDynamicRule<ToGrammarRule<R>>;
}
export const prec = (globalThis as unknown as { prec: unknown }).prec as unknown as AuthoringPrec;

interface AuthoringToken {
	<R extends AuthoringRule>(rule: R): TokenRule<ToGrammarRule<R>>;
	immediate<R extends AuthoringRule>(rule: R): ImmediateTokenRule<ToGrammarRule<R>>;
}
export const token = (globalThis as unknown as { token: unknown }).token as unknown as AuthoringToken;

// `grammar()` is runtime-injected the same way (evaluate.ts's own `grammarFn`,
// NOT tree-sitter's ambient `grammar()`). Its real two-arg (extension) contract
// is `(base: <flat enriched grammar shape>, options: WiredOpts) => GrammarResult`:
// `enrich(base)` returns `EnrichedGrammar<B>` — the SAME flat `{name, rules,
// ...}` shape as `B` (sittir's readonly-tupled grammar-shape rules, each
// enriched), not a `{grammar:{...}}` wrapper — and `wire()` returns
// `WiredOpts`. `grammarFn`'s own return value IS `{grammar:{...}}`-shaped
// (`GrammarResult`), which is what a base-extension call receives. Tree-sitter's
// ambient overloads instead expect a flat but MUTABLE `GrammarSchema` base,
// which is what previously required overrides.ts's `@ts-expect-error` at the
// `grammar(enrichedBase, wire(...))` call site.
interface AuthoringGrammar {
	<B extends GrammarJson>(base: EnrichedGrammar<B>, options: WiredOpts): GrammarResult;
}
export const grammar = (globalThis as unknown as { grammar: unknown }).grammar as unknown as AuthoringGrammar;
