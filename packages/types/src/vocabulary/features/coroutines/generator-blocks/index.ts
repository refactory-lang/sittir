export type * from './expression.ts';

import type { Coroutines } from '../index.ts';
import type { RustExpressions } from '../../rust-expressions/index.ts';

/** Generator blocks: a block expression that yields values as it runs. */
export interface GeneratorBlocks extends Coroutines, RustExpressions {
	readonly 'generator-blocks': true;
}
