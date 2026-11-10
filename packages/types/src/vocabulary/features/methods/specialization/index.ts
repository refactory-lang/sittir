export type * from './declaration.ts';

import type { Methods } from '../index.ts';

/** Specialization: a default implementation a more specific one can replace. */
export interface Specialization extends Methods {
	readonly specialization: true;
}
