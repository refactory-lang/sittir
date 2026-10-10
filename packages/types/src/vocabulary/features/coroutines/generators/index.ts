import type { Coroutines } from '../index.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

/** Generators: functions that run as coroutines producing a sequence, and delegation to another generator. */
export interface Generators extends Coroutines {
	readonly generators: true;
}
