import type { AsyncAwait } from '../async-await/index.ts';
import type { Coroutines } from '../coroutines/index.ts';

/** Asynchronous programming: asynchronous functions and coroutines. */
export interface Asynchronous extends AsyncAwait, Coroutines {
	readonly asynchronous: true;
}
