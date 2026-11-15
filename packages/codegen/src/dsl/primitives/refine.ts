import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { wireGetCurrentRuleKind, wireRegisterRefineForms } from '../wire/wire.ts';
import type { RefineForm } from '../wire/wire.ts';

export type FormMap = Record<string, Record<string, number | string>>;

export interface RefineOptions {
	readonly default?: string;
}

export interface RefinePlaceholder {
	readonly __sittirPlaceholder: 'refine';
	readonly forms: FormMap;
	readonly default?: string;
}

export function isRefinePlaceholder(v: unknown): v is RefinePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'refine';
}

function isRefineOptions(v: unknown): v is RefineOptions {
	const keys = v && typeof v === 'object' ? Object.keys(v) : [];
	return keys.length === 1 && keys[0] === 'default' && typeof (v as RefineOptions).default === 'string';
}

export function refine(forms: FormMap, options?: RefineOptions): RefinePlaceholder;
export function refine(original: RuntimeRule, forms: FormMap, options?: RefineOptions): RuntimeRule;
export function refine(
	originalOrForms: RuntimeRule | FormMap,
	formsOrOptions?: FormMap | RefineOptions,
	maybeOptions?: RefineOptions
): RuntimeRule | RefinePlaceholder {
	if (formsOrOptions === undefined || (maybeOptions === undefined && isRefineOptions(formsOrOptions))) {
		const placeholder = { __sittirPlaceholder: 'refine' as const, forms: originalOrForms as FormMap };
		return formsOrOptions === undefined ? placeholder : { ...placeholder, default: (formsOrOptions as RefineOptions).default };
	}
	const original = originalOrForms as RuntimeRule;
	const forms = formsOrOptions as FormMap;
	const defaultName = maybeOptions?.default;
	const kind = wireGetCurrentRuleKind();
	if (!kind) {
		throw new Error('refine(): no active wire context — refine() must run inside a rule callback under wire()');
	}
	const formList: RefineForm[] = [];
	for (const [name, selections] of Object.entries(forms)) {
		if (formList.some((f) => f.name === name)) {
			throw new Error(`refine(): duplicate form name '${name}' on rule '${kind}'`);
		}
		formList.push({ name, selections: { ...selections }, ...(defaultName === undefined ? {} : { defaultName }) });
	}
	if (!wireRegisterRefineForms(kind, formList)) {
		throw new Error('refine(): wire context rejected registration — unexpected');
	}
	return original;
}
