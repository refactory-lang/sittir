export * from './attribute.ts';
export * from './declaration.ts';
export * from './expression.ts';

/** Decorators: a function applied to a declaration where it is declared. */
export interface Decorators {
	readonly decorators: true;
}
