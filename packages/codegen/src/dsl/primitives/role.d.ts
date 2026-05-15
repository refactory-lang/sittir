/**
 * dsl/role.ts — structural-whitespace role primitive for override files.
 *
 * Sittir-specific DSL addition. Indent-sensitive grammars annotate
 * external tokens with their structural role (`indent` / `dedent` /
 * `newline`) inline in the externals callback:
 *
 *     externals: ($, prev) => [
 *         ...prev,
 *         role($._indent,  'indent'),
 *         role($._dedent,  'dedent'),
 *         role($._newline, 'newline'),
 *     ],
 *
 * `role()` returns the symbol reference UNCHANGED so the externals
 * array still receives a valid token reference. As a side effect it
 * pushes the binding onto a per-grammar accumulator that
 * `evaluate.ts`'s `grammarFn` consumes and attaches to the resulting
 * grammar as `externalRoles`. Link reads it from `raw.externalRoles`
 * to drive its symbol-resolution behavior.
 *
 * The accumulator is scoped to the enclosing `grammar(...)` call via
 * a save/restore pattern (see `withRoleScope`), so nested
 * `grammar(enrich(base), {...})` evaluations don't leak roles between
 * scopes.
 *
 * Import explicitly:
 *
 *     import { role } from '@sittir/codegen/dsl'
 */
import type { Rule } from '../../compiler/rule.ts';
import type { ExternalRole } from '../../compiler/types.ts';
export declare function role(symbol: Rule, roleName: 'indent' | 'dedent' | 'newline'): Rule;
/**
 * Run `fn` with a fresh role accumulator in scope. Returns the
 * accumulated bindings AND `fn`'s result. Save/restore guarantees
 * nested `grammar(...)` calls stay isolated even on exception paths.
 *
 * Called by `grammarFn` in evaluate.ts — not by override authors.
 */
export declare function withRoleScope<T>(fn: () => T): {
    roles: Map<string, ExternalRole>;
    result: T;
};
//# sourceMappingURL=role.d.ts.map