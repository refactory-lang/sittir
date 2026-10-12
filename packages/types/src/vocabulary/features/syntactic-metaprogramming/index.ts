export * from './clause.ts';
export * from './declaration.ts';
export * from './element.ts';
export * from './expression.ts';
export * from './identifier.ts';

/** Syntactic metaprogramming: macros that rewrite the syntax they are given. */
export interface SyntacticMetaprogramming {
	readonly 'syntactic-metaprogramming': true;
}
