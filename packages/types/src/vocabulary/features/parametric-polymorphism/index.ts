export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './type.ts';

/** Parametric polymorphism: declarations and types take type parameters. */
export interface ParametricPolymorphism {
	readonly 'parametric-polymorphism': true;
}
