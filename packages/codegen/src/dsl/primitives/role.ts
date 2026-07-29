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

import type { Rule } from '../../types/rule.ts';
import type { ExternalRole } from '../../types/ir.ts';
import { isSymbolLike } from '../../types/runtime-shapes.ts';

let currentRoles: Map<string, ExternalRole> | null = null;

const VALID_ROLE_NAMES = new Set(['indent', 'dedent', 'newline'] as const);

export function role(symbol: Rule, roleName: 'indent' | 'dedent' | 'newline'): Rule {
	if (!isSymbolLike(symbol)) {
		throw new Error(
			`role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol)}`
		);
	}
	// Runtime validation — the TS type parameter doesn't flow through
	// override files' @ts-nocheck imports, so a typo like 'indet' would
	// otherwise silently store a wrong binding.
	if (!VALID_ROLE_NAMES.has(roleName as 'indent' | 'dedent' | 'newline')) {
		throw new Error(
			`role(): second argument must be one of 'indent' | 'dedent' | 'newline', got ${JSON.stringify(roleName)}`
		);
	}
	if (currentRoles !== null) {
		currentRoles.set(symbol.name, { role: roleName });
	}
	return symbol;
}

export function withRoleScope<T>(fn: () => T): {
	roles: Map<string, ExternalRole>;
	result: T;
} {
	const previous = currentRoles;
	const fresh = new Map<string, ExternalRole>();
	currentRoles = fresh;
	try {
		const result = fn();
		return { roles: fresh, result };
	} finally {
		currentRoles = previous;
	}
}
