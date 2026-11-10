export type * from './declaration.ts';

import type { Methods } from '../index.ts';

/** Classes: types declared with their fields and methods, whose instances a constructor makes. */
export interface Classes extends Methods {
	readonly classes: true;
}
