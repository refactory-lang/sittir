export const WITNESSED_CAUSES = ['accepts-other-kind', 'semantic-gap', 'rejects-valid-syntax', 'accepts-invalid-syntax'] as const;

export type WitnessedCause = (typeof WITNESSED_CAUSES)[number];

export type RuleCause = 'alias-shape' | 'ambiguity' | WitnessedCause;

export type WitnessFormItem = string | { readonly symbol: string };

export interface OtherKindWitness {
	readonly text: string;
	readonly form: readonly WitnessFormItem[];
	readonly kind: string;
}

export interface SemanticGapWitness extends OtherKindWitness {
	readonly meaning: string;
}

export interface InvalidSyntaxWitness extends OtherKindWitness {
	readonly production: string;
}

export type Witnesses<W> = readonly [W, ...W[]];

export type RuleCauseDeclaration =
	| { readonly kind: 'reauthored'; readonly cause: RuleCause; readonly witnesses?: Witnesses<OtherKindWitness> }
	| { readonly kind: 'vocabulary' };

const RULE_CAUSE = Symbol.for('sittir.ruleCause');

function tag<F extends (...args: never[]) => unknown>(body: F, declaration: RuleCauseDeclaration): F {
	Object.defineProperty(body, RULE_CAUSE, { value: declaration, enumerable: false, writable: false });
	return body;
}

export function reauthored<F extends (...args: never[]) => unknown>(
	cause: 'accepts-other-kind',
	witnesses: Witnesses<OtherKindWitness>,
	body: F
): F;
export function reauthored<F extends (...args: never[]) => unknown>(
	cause: 'semantic-gap',
	witnesses: Witnesses<SemanticGapWitness>,
	body: F
): F;
export function reauthored<F extends (...args: never[]) => unknown>(
	cause: 'rejects-valid-syntax',
	witnesses: Witnesses<OtherKindWitness>,
	body: F
): F;
export function reauthored<F extends (...args: never[]) => unknown>(
	cause: 'accepts-invalid-syntax',
	witnesses: Witnesses<InvalidSyntaxWitness>,
	body: F
): F;
export function reauthored<F extends (...args: never[]) => unknown>(
	cause: Exclude<RuleCause, WitnessedCause>,
	body: F
): F;
export function reauthored<F extends (...args: never[]) => unknown>(
	cause: RuleCause,
	...rest: [F] | [Witnesses<OtherKindWitness>, F]
): F {
	if (rest.length === 1) return tag(rest[0], { kind: 'reauthored', cause });
	return tag(rest[1], { kind: 'reauthored', cause, witnesses: rest[0] });
}

export function vocabulary<F extends (...args: never[]) => unknown>(body: F): F {
	return tag(body, { kind: 'vocabulary' });
}

export function ruleCauseOf(fn: unknown): RuleCauseDeclaration | undefined {
	if (typeof fn !== 'function') return undefined;
	return (fn as { [RULE_CAUSE]?: RuleCauseDeclaration })[RULE_CAUSE];
}
