/**
 * compiler/evaluate.ts — Evaluate phase.
 *
 * Executes grammar.js DSL and produces a RawGrammar.
 * When overrides.ts exists, it uses tree-sitter's native grammar(base, { rules })
 * extension mechanism — each rule fn receives ($, original).
 */
import type { Rule, FieldRule, TokenRule, SymbolRule, AliasRule, SymbolRef } from './rule.ts';
import type { RawGrammar } from './types.ts';
type Input = string | RegExp | Rule;
interface SymbolRuleWithRef extends SymbolRule {
    readonly _ref?: SymbolRef;
}
export declare function normalize(input: Input): Rule;
/**
 * Sequence combinator — matches all members in order.
 *
 * @remarks
 * A single-member seq collapses to its sole member: the extra layer has
 * the same parse semantics but confuses walkers that count seq members
 * for positional hints.
 *
 * @remarks
 * commaSep1 patterns — `seq(x, repeat(seq(sep, x)))` and variants — are
 * lifted to a single `repeat1` node with a clean `separator` marker so
 * downstream passes see a canonical shape instead of five to six nested rules.
 *
 * @remarks
 * After liftCommaSep runs, trailing-sep optionals of the form
 * `seq('(', repeat1(x, sep), optional(sep), ')')` are absorbed into the
 * repeat1's `trailing: true` flag so no phantom `optional(',')` survives
 * into simplifyRule.
 */
export declare function seq(...members: Input[]): Rule;
/**
 * Choice combinator — matches exactly one of the members.
 *
 * @remarks
 * A single-member choice collapses to its member — the wrapper has no
 * parse semantics.
 *
 * @remarks
 * `choice(x, blank())` is lowered to `optional(x)`. Tree-sitter encodes
 * blank() as either an empty seq (historical) or an empty choice; both
 * shapes mark "this branch matches nothing", so the outer choice is
 * "x or nothing" = `optional(x)`. Collapsing at DSL time means walkers
 * only ever see the optional shape.
 *
 * @remarks
 * An all-string choice is compacted to an `EnumRule` for fast downstream
 * handling.
 */
export declare function choice(...members: Input[]): Rule;
/**
 * Optional combinator — matches zero or one occurrence of the content.
 *
 * @remarks
 * `optional(optional(x))` collapses to `optional(x)` — two layers of
 * "zero or one" is the same as one layer.
 *
 * @remarks
 * `optional(repeat(x))` returns `repeat(x)` unchanged. `repeat` is
 * already optional in the config surface (`items?: T[]`, null-coalesced
 * to `[]` in the factory), so the wrapper adds no information.
 *
 * @remarks
 * `optional(repeat1(x))` is lowered to `repeat(x)`. The two are
 * parse-identical: tree-sitter surfaces "optional didn't fire" and
 * "repeat1 fired with zero items" identically (an empty children list).
 * The non-empty guarantee a bare `repeat1` carries only holds when there
 * is no `optional` wrapper to swallow the empty case.
 */
export declare function optional(content: Input): Rule;
/**
 * Zero-or-more repetition combinator.
 *
 * @remarks
 * `repeat(repeat(x))` collapses to `repeat(x)` when neither layer carries
 * a distinct separator — the outer loop is redundant.
 *
 * @remarks
 * `repeat(optional(x))` collapses to `repeat(x)` — repeat already handles
 * zero occurrences, so the optional wrapper is redundant.
 */
export declare function repeat(content: Input): Rule;
/**
 * One-or-more repetition combinator.
 *
 * @remarks
 * `repeat1(repeat1(x))` collapses to `repeat1(x)` — the outer "one or
 * more" of "one or more" accepts the same strings as the inner.
 *
 * @remarks
 * `repeat1(repeat(x))` is NOT collapsed to `repeat1(x)`. The inner
 * `repeat(x)` can match empty, so `repeat1(repeat(x))` accepts
 * zero-or-more `x` (one outer iteration of zero inner matches), which
 * matches `repeat(x)`'s language — not `repeat1(x)`'s. The shape is
 * left alone to preserve grammar author intent.
 */
export declare function repeat1(content: Input): Rule;
/**
 * Symbol reference constructor — baseline DSL shadow used by metadata
 * helpers that need a real runtime symbol without fabricating the object.
 */
export declare function symbol(name: string): SymbolRule;
export declare function createProxy(currentRule: string, refs: SymbolRef[]): Record<string, SymbolRuleWithRef>;
/**
 * Authoritative "is this kind hidden?" check shared by Link and
 * downstream passes. Tree-sitter treats a rule as hidden when:
 *
 *   (a) its name begins with `_` (convention), OR
 *   (b) its name appears in the grammar's `inline:` array (explicit).
 *
 * Grammars that don't follow the leading-underscore convention can
 * still mark rules hidden via `inline`. Passing `undefined` for
 * `inlineList` falls back to convention-only, which is the safe
 * default when Link doesn't have grammar metadata at hand.
 */
export declare function isHiddenKind(name: string, inlineList?: readonly string[]): boolean;
/**
 * Field combinator — attaches a named field to a rule.
 *
 * @param name - The field name (snake_case, raw grammar name).
 * @param content - The rule occupying this field position. Omit to
 *   create a placeholder for `resolvePatch` in transform() patches.
 * @returns A FieldRule with the field name and resolved content.
 * @remarks
 * When `content` is omitted, a placeholder FieldRule is returned with
 * `_needsContent: true`, which `resolvePatch` swaps out with the
 * original member when applying transform() patches.
 * @remarks
 * Mirrors the bare `optional()` helper's canonical collapse:
 * `field('x', optional(repeat(...)))` → `field('x', repeat(...))` and
 * `field('x', optional(repeat1(...)))` → `field('x', repeat(...))`.
 * Both are parse-identical to `repeat(x)` — tree-sitter surfaces any
 * empty case as an empty children list. Collapsing both here keeps
 * evaluate output canonical across all the equivalent list encodings
 * grammar authors write.
 * @remarks
 * Propagates the field name to every nested symbol ref. Stops at inner
 * field/alias boundaries — those own their own field name. Does not
 * overwrite a field name already set by an inner wrapper.
 */
export declare function field(name: string, content?: Input): FieldRule;
interface TokenFn {
    (content: Input): TokenRule;
    immediate: (content: Input) => TokenRule;
}
export declare const token: TokenFn;
interface PrecFn {
    (precedence: number, content: Input): Rule;
    left: (precedence: number, content: Input) => Rule;
    right: (precedence: number, content: Input) => Rule;
    dynamic: (precedence: number, content: Input) => Rule;
}
export declare const prec: PrecFn;
export declare function alias(rule: Input, value: string | Rule): AliasRule;
export declare function blank(): Rule;
/**
 * Evaluate a grammar.js (or overrides.ts) file and return a RawGrammar.
 *
 * Injects DSL functions as globals, then imports the module.
 * Tree-sitter's grammar(base, { rules }) handles extension merging natively.
 */
export declare function evaluate(entryPath: string): Promise<RawGrammar>;
export {};
//# sourceMappingURL=evaluate.d.ts.map