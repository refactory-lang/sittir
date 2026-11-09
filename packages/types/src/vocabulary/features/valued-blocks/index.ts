export type * from './statement.ts';

import type { RustExpressions } from '../rust-expressions/index.ts';

/** Valued blocks: a block whose trailing expression is its value, and a `break` that carries one. */
export interface ValuedBlocks extends RustExpressions {
	readonly 'valued-blocks': true;
}
