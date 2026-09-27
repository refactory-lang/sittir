import type { RuntimeRule } from '../types/runtime-shapes.ts';

type CanonicalForm = string | number | boolean | null | readonly CanonicalForm[];

export function ruleKey(rule: RuntimeRule): string {
	return JSON.stringify(canonicalize(rule));
}

function canonicalize(rule: unknown): CanonicalForm {
	if (typeof rule !== 'object' || rule === null) return rule as CanonicalForm;
	const r = rule as Record<string, unknown>;
	const type = (r.type as string | undefined) ?? null;
	const name = typeof r.name === 'string' ? r.name : null;
	const value = typeof r.value === 'string' || typeof r.value === 'number' ? r.value : null;
	const named = typeof r.named === 'boolean' ? r.named : null;
	const separator = 'separator' in r ? canonicalizeSeparator(r.separator) : null;

	const members = r.members as readonly unknown[] | undefined;
	if (members !== undefined) return [type, name, value, named, separator, members.map(canonicalize)];

	const content = r.content;
	if (content !== undefined) return [type, name, value, named, separator, [canonicalize(content)]];

	return [type, name, value, named, separator, null];
}

function canonicalizeSeparator(separator: unknown): CanonicalForm {
	if (typeof separator !== 'object' || separator === null) return separator as CanonicalForm;
	const sep = separator as { readonly value?: unknown; readonly trailing?: unknown; readonly leading?: unknown };
	return [
		'fact',
		typeof sep.trailing === 'string' ? sep.trailing : null,
		typeof sep.leading === 'string' ? sep.leading : null,
		canonicalize(sep.value)
	];
}

export const DSL_RULES_KEY = Symbol.for('sittir.dslRules');

export function baseRulesOf<R>(base: unknown): Record<string, R> | undefined {
	if (!base || typeof base !== 'object') return undefined;
	const grammar = 'grammar' in base ? (base as { grammar?: unknown }).grammar : base;
	if (!grammar || typeof grammar !== 'object') return undefined;
	const dslRules = (grammar as Record<symbol, unknown>)[DSL_RULES_KEY];
	return (dslRules ?? (grammar as { rules?: unknown }).rules) as Record<string, R> | undefined;
}
