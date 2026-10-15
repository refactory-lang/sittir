export type * from './declaration.ts';
export type * from './expression.ts';

import type { Coroutines } from '../index.ts';

/** Generators: functions that run as coroutines producing a sequence, and delegation to another generator. */
export interface Generators extends Coroutines {
	readonly generators: true;
}
