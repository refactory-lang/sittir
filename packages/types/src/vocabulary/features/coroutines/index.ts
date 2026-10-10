export type * from './expression.ts';

/** Coroutines: an expression yields a value to its caller and resumes where it left off. */
export interface Coroutines {
	readonly coroutines: true;
}
