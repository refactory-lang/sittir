import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { wireGetCurrentRuleKind, wireRegisterRefineForms } from '../wire/wire.ts';
import type { RefineForm } from '../wire/wire.ts';

export type FormMap = Record<string, Record<string, number | string>>;

export interface RefinePlaceholder {
	readonly __sittirPlaceholder: 'refine';
	readonly forms: FormMap;
}

export function isRefinePlaceholder(v: unknown): v is RefinePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'refine';
}

export function refine(forms: FormMap): RefinePlaceholder;
export function refine(original: RuntimeRule, forms: FormMap): RuntimeRule;
export function refine(originalOrForms: RuntimeRule | FormMap, maybeForms?: FormMap): RuntimeRule | RefinePlaceholder {
	if (maybeForms === undefined) return { __sittirPlaceholder: 'refine' as const, forms: originalOrForms as FormMap };
	const original = originalOrForms as RuntimeRule;
	const forms = maybeForms;
	const kind = wireGetCurrentRuleKind();
	if (!kind) {
		throw new Error('refine(): no active wire context — refine() must run inside a rule callback under wire()');
	}
	const formList: RefineForm[] = [];
	for (const [name, selections] of Object.entries(forms)) {
		if (formList.some((f) => f.name === name)) {
			throw new Error(`refine(): duplicate form name '${name}' on rule '${kind}'`);
		}
		formList.push({ name, selections: { ...selections } });
	}
	if (!wireRegisterRefineForms(kind, formList)) {
		throw new Error('refine(): wire context rejected registration — unexpected');
	}
	return original;
}
