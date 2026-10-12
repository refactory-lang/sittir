export * from './clause.ts';
export * from './declaration.ts';
export * from './element.ts';
export * from './expression.ts';
export * from './pattern.ts';
export * from './type.ts';

/** Parametric polymorphism: declarations and types take type parameters. */
export interface ParametricPolymorphism {
	readonly 'parametric-polymorphism': true;
}
