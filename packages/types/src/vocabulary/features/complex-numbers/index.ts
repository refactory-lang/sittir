export type * from './literal.ts';
export type * from './pattern.ts';

/** Complex numbers: a numeric type with an imaginary part, its imaginary literals and its patterns. */
export interface ComplexNumbers {
	readonly 'complex-numbers': true;
}
