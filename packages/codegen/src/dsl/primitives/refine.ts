import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { wireGetCurrentRuleKind, wireRegisterRefineForms } from '../wire/wire.ts';
import type { RefineForm } from '../wire/wire.ts';

export type FormMap = Record<string, Record<string, number | string>>;

export function refine(original: RuntimeRule, forms: FormMap): RuntimeRule {
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
