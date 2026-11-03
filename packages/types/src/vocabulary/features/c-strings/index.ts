export type * from './literal.ts';

/** C strings: string literals of nul-terminated C strings. */
export interface CStrings {
	readonly 'c-strings': true;
}
