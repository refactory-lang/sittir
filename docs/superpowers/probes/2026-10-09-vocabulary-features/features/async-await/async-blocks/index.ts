import type { AsyncAwait } from '../index.ts';
export type * from './expression.ts';

/** Asynchronous blocks: a block expression that evaluates to a future of its value. */
export interface AsyncBlocks extends AsyncAwait {
	readonly 'async-blocks': true;
}
