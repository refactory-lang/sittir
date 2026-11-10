export type * from './declaration.ts';

import type { Decorators } from '../index.ts';

/** Function decorators: a decorator on a function declaration. */
export interface FunctionDecorators extends Decorators {
	readonly 'function-decorators': true;
}
