import type { TypeAnnotations } from '../index.ts';
export type * from './declaration.ts';

/** Optional members: a property, method or parameter that a value or a call may omit. */
export interface OptionalMembers extends TypeAnnotations {
	readonly 'optional-members': true;
}
