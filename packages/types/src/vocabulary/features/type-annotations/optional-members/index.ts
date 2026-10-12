export type * from './declaration.ts';

import type { TypeAnnotations } from '../index.ts';

/** Optional members: a property, method or parameter that a value or a call may omit. */
export interface OptionalMembers extends TypeAnnotations {
	readonly 'optional-members': true;
}
