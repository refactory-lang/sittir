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

import type { Rule, ExternalRole } from '../compiler/rule.ts'

// Module-local accumulator. Null when no `grammar(...)` call is on
// the stack — calling `role()` in that state is an error because we
// have no scope to attach the binding to.
let currentRoles: Map<string, ExternalRole> | null = null

type SymbolLike = { type: 'symbol'; name: string } & Record<string, unknown>

/**
 * Mark an external token symbol with a structural-whitespace role.
 * Returns the symbol unchanged so the call site can be a transparent
 * member of the externals array.
 *
 * Throws if called outside a `grammar(...)` scope (no accumulator
 * available to push into).
 */
export function role(symbol: Rule, roleName: 'indent' | 'dedent' | 'newline'): Rule {
    if (currentRoles === null) {
        throw new Error(
            'role(): called outside a grammar() scope — role() must be called from inside an externals/rules callback during grammar evaluation',
        )
    }
    if (!symbol || typeof symbol !== 'object' || (symbol as SymbolLike).type !== 'symbol') {
        throw new Error(
            `role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol)}`,
        )
    }
    const name = (symbol as SymbolLike).name
    currentRoles.set(name, { role: roleName })
    return symbol
}

/**
 * Run `fn` with a fresh role accumulator in scope. Returns the
 * accumulated bindings AND `fn`'s result. Save/restore guarantees
 * nested `grammar(...)` calls stay isolated even on exception paths.
 *
 * Called by `grammarFn` in evaluate.ts — not by override authors.
 */
export function withRoleScope<T>(fn: () => T): { roles: Map<string, ExternalRole>; result: T } {
    const previous = currentRoles
    const fresh = new Map<string, ExternalRole>()
    currentRoles = fresh
    try {
        const result = fn()
        return { roles: fresh, result }
    } finally {
        currentRoles = previous
    }
}
