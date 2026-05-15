/**
 * dsl/transform.ts — sittir override primitives for rule patching.
 *
 * These are NOT tree-sitter baseline DSL. They are sittir-specific
 * extensions that operate on the `original` rule passed by tree-sitter's
 * `grammar(base)` mechanism to each rule callback.
 *
 * Override files import these explicitly:
 *
 *     import { transform, insert, replace } from '@sittir/codegen/dsl'
 *
 * The baseline shadow functions (`grammar`, `seq`, `choice`, `field`, ...)
 * are still injected as globals by `evaluate.ts` — don't import those.
 *
 * Types are deliberately `RuntimeRule` (not sittir's `Rule` union).
 * The `original` argument comes from tree-sitter's extension mechanism
 * at runtime — that's sittir-shaped under sittir's pipeline but
 * tree-sitter-native (uppercase types) under the CLI runtime. Typing
 * as `RuntimeRule` is honest in both directions and forces callers
 * that inspect the result to narrow via guards in `runtime-shapes.ts`.
 * Override files are `@ts-nocheck` so they're unaffected.
 */
import type { FieldPlaceholder } from '../primitives/field.ts';
import type { AliasPlaceholder } from '../primitives/alias.ts';
import type { VariantPlaceholder } from '../primitives/variant.ts';
import type { RuntimeRule } from '../runtime-shapes.ts';
/**
 * Apply patches to a rule. Patches are an object with path-string keys
 * and Rule (or one-arg field placeholder) values:
 *
 *     transform(original, {
 *         0:       field('name'),       // flat numeric — single-segment path
 *         '0/1':   field('inner'),      // nested path
 *         '0/*\/0': field('items'),     // wildcard
 *     })
 *
 * Two evaluation modes, auto-detected by key shape:
 *
 * 1. **Flat positional** — every key is a pure numeric string. Patches
 *    apply to seq members at that position, recursively descending
 *    through choice alternatives and content wrappers (preserves
 *    legacy override behavior on rules where the original is a choice
 *    of equal-shape alternatives).
 *
 * 2. **Path-addressed** — at least one key contains `/` or `*`. Each
 *    key is parsed as a path and applied to exactly the position(s) it
 *    addresses. Precedence wrappers (prec/PREC_LEFT/...) are
 *    transparent so the same paths work in both sittir and tree-sitter
 *    runtimes.
 *
 * Field patches are marked `source: 'override'` so derive-overrides-json
 * recognizes them. One-arg `field('name')` placeholders are filled in
 * from the original member at the target position; an enrich-inferred
 * field wrapper on the original is unwrapped before re-wrapping to
 * avoid nested fields.
 */
type PatchSet = Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder | VariantPlaceholder>;
/**
 * @typeparam Base - The base tree-sitter grammar's type (typically
 *   `typeof base` from `tree-sitter-<lang>/grammar.js`). Reserved for
 *   future grammar-aware path validation; currently a phantom parameter
 *   that lets call sites write `transform<typeof base>(original, ...)`
 *   so the generic surface is uniform with `wire<Base>` /
 *   `PolymorphsConfig<Base>` / `TransformsConfig<Base>`.
 */
export declare function transform<_Base = unknown>(original: RuntimeRule, ...patchSets: PatchSet[]): RuntimeRule;
/**
 * Wrap a member at a position using a wrapper function that receives
 * the original content. The wrapper's result is marked `source: 'override'`.
 *
 * Reconstructs via the runtime's native `seq()` so the result has the
 * runtime-correct rule shape (sittir lowercase vs tree-sitter
 * uppercase) — same cross-runtime contract as `transform()`.
 */
export declare function insert(original: RuntimeRule, position: number, wrapper: (content: RuntimeRule) => RuntimeRule): RuntimeRule;
/**
 * Replace content at a position. Pass `null` to suppress (remove the
 * member). Reconstructs via the runtime's native `seq()`.
 */
export declare function replace(original: RuntimeRule, position: number, replacement: RuntimeRule | null): RuntimeRule;
/**
 * Build the `alias($._hidden, $.visible)` node AND register the
 * hidden rule's body. Shared between variant() and alias() placeholders
 * because both need the same empty-match / prec handling.
 *
 * Tree-sitter refuses to compile a named syntactic rule whose body
 * matches the empty string (it can't decide which copy-count to choose
 * while parsing). A raw variant extraction can easily produce such a
 * body — e.g. rust's `array_expression` list form is
 * `repeat(elem, sep=',')` which matches zero or more, including zero.
 *
 * When the content is empty-matchable AND we can factor out a non-empty
 * core, extract the core and wrap the call-site alias in `optional()`.
 * The language is preserved (`optional(repeat1(X))` = `repeat(X)`) and
 * the hidden rule is guaranteed non-empty so tree-sitter accepts it.
 */
export declare function registerAliasedVariant(hiddenName: string, aliasValue: string, originalMember: RuntimeRule, bodyWrapper: (body: RuntimeRule) => RuntimeRule): RuntimeRule;
/**
 * Conservative empty-match detector. Returns true when `rule` can
 * produce a zero-length match. Used only to decide whether the
 * factored non-empty core is actually non-empty — errs on the side of
 * saying "true" for unknown shapes so callers don't wrongly claim a
 * body is non-empty.
 */
export declare function matchesEmpty(rule: RuntimeRule): boolean;
export {};
//# sourceMappingURL=transform.d.ts.map