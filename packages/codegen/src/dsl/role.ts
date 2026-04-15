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

// Accept both sittir's lowercase `type: 'symbol'` AND tree-sitter's
// native uppercase `type: 'SYMBOL'` shape — `$._indent` returns
// different types depending on which grammar() runtime is loaded
// (sittir's grammarFn vs. tree-sitter CLI's native).
type SymbolLike = { type: 'symbol' | 'SYMBOL'; name: string } & Record<string, unknown>

function isSymbolLike(v: unknown): v is SymbolLike {
    return !!v && typeof v === 'object'
        && ((v as { type?: unknown }).type === 'symbol' || (v as { type?: unknown }).type === 'SYMBOL')
        && typeof (v as { name?: unknown }).name === 'string'
}

/**
 * Mark an external token symbol with a structural-whitespace role.
 * Returns the symbol unchanged so the call site can be a transparent
 * member of the externals array.
 *
 * **Tree-sitter compatibility**: when `role()` is called outside any
 * sittir-managed scope (e.g. when tree-sitter's CLI loads the
 * transpiled `.sittir/grammar.js` and runs `grammar()` natively),
 * the binding is silently dropped and only the symbol passthrough
 * runs. Tree-sitter doesn't read role bindings — they only matter
 * to sittir's Link phase, which always evaluates the override file
 * inside a `withRoleScope` block. This keeps the same call site valid
 * for both consumers without runtime feature detection.
 */
export function role(symbol: Rule, roleName: 'indent' | 'dedent' | 'newline'): Rule {
    if (!isSymbolLike(symbol)) {
        throw new Error(
            `role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol)}`,
        )
    }
    if (currentRoles !== null) {
        currentRoles.set(symbol.name, { role: roleName })
    }
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
