export type * from './declaration.ts';
export type * from './statement.ts';

/** Visibility: an access level on a declaration. */
export interface Visibility {
	readonly visibility: true;
}
