export type * from './expression.ts';
export type * from './literal.ts';

/** String interpolation: string literals that embed expressions. */
export interface StringInterpolation {
	readonly 'string-interpolation': true;
}
