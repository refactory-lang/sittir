export * from './declaration.ts';
export * from './modifier.ts';
export * from './statement.ts';

/** Visibility: an access level on a declaration. */
export interface Visibility {
	readonly visibility: true;
}
