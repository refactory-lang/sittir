export type * from './declaration.ts';

/** Static storage: a variable with one instance that lives for the whole run of the program. */
export interface StaticStorage {
	readonly 'static-storage': true;
}
