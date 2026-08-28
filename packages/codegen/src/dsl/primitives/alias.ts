import type { Rule } from '../../types/rule.ts';

export interface AliasPlaceholder {
	readonly __sittirPlaceholder: 'alias';
	readonly name: string;
}

export function isAliasPlaceholder(v: unknown): v is AliasPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'alias';
}

export function alias(rule: Rule | string, value?: string | Rule): unknown {
	if (typeof rule === 'string' && value === undefined) {
		return {
			__sittirPlaceholder: 'alias' as const,
			name: rule
		} satisfies AliasPlaceholder;
	}

	const native = (globalThis as { alias?: (r: unknown, v: unknown) => unknown }).alias;
	if (typeof native !== 'function') {
		throw new Error(
			'alias(): no global alias() found — must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)'
		);
	}

	if (value !== undefined) {
		return native(rule, value);
	}

	return native(rule, rule);
}
