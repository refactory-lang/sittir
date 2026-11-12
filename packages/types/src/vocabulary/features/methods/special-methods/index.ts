export type * from './declaration.ts';

import type { Methods } from '../index.ts';

/** Special methods: methods the language calls for its own operations, named by convention. */
export interface SpecialMethods extends Methods {
	readonly 'special-methods': true;
}
