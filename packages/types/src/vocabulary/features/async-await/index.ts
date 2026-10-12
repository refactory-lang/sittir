export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './statement.ts';

/** Asynchronous functions: a function suspends at `await` until the value it awaits is ready. */
export interface AsyncAwait {
	readonly 'async-await': true;
}
