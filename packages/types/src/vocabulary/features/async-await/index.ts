export * from './clause.ts';
export * from './declaration.ts';
export * from './expression.ts';
export * from './statement.ts';

/** Asynchronous functions: a function suspends at `await` until the value it awaits is ready. */
export interface AsyncAwait {
	readonly 'async-await': true;
}
