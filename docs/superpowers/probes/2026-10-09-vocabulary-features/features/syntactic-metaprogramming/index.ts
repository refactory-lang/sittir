export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './element.ts';
export type * from './expression.ts';
export type * from './identifier.ts';

/** Syntactic metaprogramming: macros that rewrite the syntax they are given. */
export interface SyntacticMetaprogramming {
	readonly 'syntactic-metaprogramming': true;
}
