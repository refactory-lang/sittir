export type * from './expression.ts';

/** Optional chaining: an access that yields nothing on a null receiver. */
export interface OptionalChaining {
	readonly 'optional-chaining': true;
}
