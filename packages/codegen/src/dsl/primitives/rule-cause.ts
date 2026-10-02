export type RuleCause = 'alias-shape' | 'ambiguity' | 'accepts-other-kind';

export type WitnessFormItem = string | { readonly symbol: string };

export interface OtherKindWitness {
	readonly text: string;
	readonly form: readonly WitnessFormItem[];
	readonly kind: string;
}

export type RuleCauseDeclaration =
	| { readonly kind: 'reauthored'; readonly cause: RuleCause; readonly witness?: OtherKindWitness }
	| { readonly kind: 'vocabulary' };

const RULE_CAUSE = Symbol.for('sittir.ruleCause');

function tag<F extends (...args: never[]) => unknown>(body: F, declaration: RuleCauseDeclaration): F {
	Object.defineProperty(body, RULE_CAUSE, { value: declaration, enumerable: false, writable: false });
	return body;
}

export function reauthored<F extends (...args: never[]) => unknown>(cause: 'accepts-other-kind', witness: OtherKindWitness, body: F): F;
export function reauthored<F extends (...args: never[]) => unknown>(cause: Exclude<RuleCause, 'accepts-other-kind'>, body: F): F;
export function reauthored<F extends (...args: never[]) => unknown>(cause: RuleCause, ...rest: [F] | [OtherKindWitness, F]): F {
	if (rest.length === 1) return tag(rest[0], { kind: 'reauthored', cause });
	return tag(rest[1], { kind: 'reauthored', cause, witness: rest[0] });
}

export function vocabulary<F extends (...args: never[]) => unknown>(body: F): F {
	return tag(body, { kind: 'vocabulary' });
}

export function ruleCauseOf(fn: unknown): RuleCauseDeclaration | undefined {
	if (typeof fn !== 'function') return undefined;
	return (fn as { [RULE_CAUSE]?: RuleCauseDeclaration })[RULE_CAUSE];
}
