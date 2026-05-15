/**
 * dsl/alias.ts — sittir alias shadow with placeholder form.
 *
 * Two authoring modes:
 *
 *   1. **Two-arg** — `alias(rule, $.name)` or `alias(rule, 'name')`:
 *      delegates directly to the runtime's native `alias()`.
 *
 *   2. **One-arg placeholder** — `alias('assignment_eq')`:
 *      returns an `AliasPlaceholder` that `transform()`'s
 *      `resolvePatch` fills in with the original content at the
 *      patch target. Same pattern as `field('name')`.
 *
 *      In the override file:
 *        transform(original, { '1/0': alias('assignment_eq') })
 *
 *      resolvePatch produces:
 *        alias(original_content_at_1_0, { type: 'SYMBOL', name: 'assignment_eq' })
 *
 * Import explicitly when you want the placeholder form:
 *
 *     import { alias } from '@sittir/codegen/dsl'
 */
import type { Rule } from '../../compiler/rule.ts';
export interface AliasPlaceholder {
    readonly __sittirPlaceholder: 'alias';
    readonly name: string;
}
export declare function isAliasPlaceholder(v: unknown): v is AliasPlaceholder;
export declare function alias(rule: Rule | string, value?: string | Rule): unknown;
//# sourceMappingURL=alias.d.ts.map