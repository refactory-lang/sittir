export type * from './statement.ts';

import type { AsyncAwait } from '../index.ts';

/** Asynchronous iteration: a loop that awaits each element of an asynchronous sequence. */
export interface AsyncIteration extends AsyncAwait {
	readonly 'async-iteration': true;
}
