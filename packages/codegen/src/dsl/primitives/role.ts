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
