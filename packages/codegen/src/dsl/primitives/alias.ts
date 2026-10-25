import type { Rule } from '../../types/rule.ts';
import { isSymbolType } from '../../types/runtime-shapes.ts';
import { recordAlias } from '../transform/transform.ts';
import { wireInPathEdit } from '../wire/wire.ts';
import { namedCopy } from './copy.ts';

export interface AliasPlaceholder {
	readonly __sittirPlaceholder: 'alias';
	readonly name: string;
}

export function isAliasPlaceholder(v: unknown): v is AliasPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'alias';
}

const isSymbol = (rule: unknown): rule is { readonly type: 'SYMBOL'; readonly name: string } => isSymbolType((rule as { readonly type?: unknown } | null)?.type);

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
		const copied = namedCopy(rule, value);
		if (copied !== undefined) return copied;
		const shown = native(rule, value) as { readonly named?: boolean; readonly value?: unknown };
		if (wireInPathEdit() && isSymbol(rule) && shown.named === true && typeof shown.value === 'string') recordAlias(rule.name, shown.value);
		return shown;
	}

	return native(rule, rule);
}
