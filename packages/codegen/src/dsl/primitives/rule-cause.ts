export const WITNESSED_CAUSES = ['accepts-other-kind', 'semantic-gap', 'rejects-valid-syntax', 'accepts-invalid-syntax', 'ruled-narrowing'] as const;

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

export interface RuledNarrowingWitness extends OtherKindWitness {
	readonly ruling: string;
}

export type Witnesses<W> = readonly [W, ...W[]];

interface CauseWitnesses {
	readonly 'accepts-other-kind': OtherKindWitness;
	readonly 'semantic-gap': SemanticGapWitness;
	readonly 'rejects-valid-syntax': OtherKindWitness;
	readonly 'accepts-invalid-syntax': InvalidSyntaxWitness;
	readonly 'ruled-narrowing': RuledNarrowingWitness;
}

export type CauseWitness<C extends WitnessedCause> = CauseWitnesses[C];

export type CausePair =
	| { readonly [C in WitnessedCause]: readonly [C, Witnesses<CauseWitness<C>>] }[WitnessedCause]
	| readonly [Exclude<RuleCause, WitnessedCause>];

export interface DeclaredCause {
	readonly cause: RuleCause;
	readonly witnesses?: Witnesses<OtherKindWitness>;
}

export type RuleCauseDeclaration =
	| { readonly kind: 'reauthored'; readonly causes: readonly DeclaredCause[] }
	| { readonly kind: 'vocabulary' };

const RULE_CAUSE = Symbol.for('sittir.ruleCause');

function tag<F extends (...args: never[]) => unknown>(body: F, declaration: RuleCauseDeclaration): F {
	Object.defineProperty(body, RULE_CAUSE, { value: declaration, enumerable: false, writable: false });
	return body;
}

function declaredCause([cause, witnesses]: CausePair): DeclaredCause {
	return witnesses === undefined ? { cause } : { cause, witnesses };
}

export function reauthored<F extends (...args: never[]) => unknown, C extends WitnessedCause>(cause: C, witnesses: Witnesses<CauseWitness<C>>, body: F): F;
export function reauthored<F extends (...args: never[]) => unknown>(cause: Exclude<RuleCause, WitnessedCause>, body: F): F;
export function reauthored<F extends (...args: never[]) => unknown>(causes: readonly [CausePair, CausePair, ...CausePair[]], body: F): F;
export function reauthored<F extends (...args: never[]) => unknown>(
	first: RuleCause | readonly [CausePair, ...CausePair[]],
	...rest: [F] | [Witnesses<OtherKindWitness>, F]
): F {
	const pairs = (typeof first === 'string' ? [rest.length === 1 ? [first] : [first, rest[0]]] : first) as readonly [CausePair, ...CausePair[]];
	const body = rest[rest.length - 1] as F;
	return tag(body, { kind: 'reauthored', causes: pairs.flatMap((pair) => [declaredCause(pair)]) });
}

export function vocabulary<F extends (...args: never[]) => unknown>(body: F): F {
	return tag(body, { kind: 'vocabulary' });
}

export function ruleCauseOf(fn: unknown): RuleCauseDeclaration | undefined {
	if (typeof fn !== 'function') return undefined;
	return (fn as { [RULE_CAUSE]?: RuleCauseDeclaration })[RULE_CAUSE];
}
