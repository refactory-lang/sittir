export * from './expression.ts';
export * from './literal.ts';

/** String interpolation: string literals that embed expressions. */
export interface StringInterpolation {
	readonly 'string-interpolation': true;
}
