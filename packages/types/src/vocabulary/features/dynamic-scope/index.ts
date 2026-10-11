export type * from './statement.ts';

/** Dynamic scope: an object's properties put in scope, `with`. */
export interface DynamicScope {
	readonly 'dynamic-scope': true;
}
