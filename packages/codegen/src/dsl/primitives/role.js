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
import { isSymbolLike } from '../runtime-shapes.js';
// Module-local accumulator. Null when no `grammar(...)` call is on
// the stack — calling `role()` in that state is an error because we
// have no scope to attach the binding to.
let currentRoles = null;
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
const VALID_ROLE_NAMES = new Set(['indent', 'dedent', 'newline']);
export function role(symbol, roleName) {
    if (!isSymbolLike(symbol)) {
        throw new Error(`role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol)}`);
    }
    // Runtime validation — the TS type parameter doesn't flow through
    // override files' @ts-nocheck imports, so a typo like 'indet' would
    // otherwise silently store a wrong binding.
    if (!VALID_ROLE_NAMES.has(roleName)) {
        throw new Error(`role(): second argument must be one of 'indent' | 'dedent' | 'newline', got ${JSON.stringify(roleName)}`);
    }
    if (currentRoles !== null) {
        currentRoles.set(symbol.name, { role: roleName });
    }
    return symbol;
}
/**
 * Run `fn` with a fresh role accumulator in scope. Returns the
 * accumulated bindings AND `fn`'s result. Save/restore guarantees
 * nested `grammar(...)` calls stay isolated even on exception paths.
 *
 * Called by `grammarFn` in evaluate.ts — not by override authors.
 */
export function withRoleScope(fn) {
    const previous = currentRoles;
    const fresh = new Map();
    currentRoles = fresh;
    try {
        const result = fn();
        return { roles: fresh, result };
    }
    finally {
        currentRoles = previous;
    }
}
//# sourceMappingURL=role.js.map