export type * from './clause.ts';
export type * from './statement.ts';

/** Exceptions: a thrown value unwinds to the nearest handler, with try, catch and finally. */
export interface Exceptions {
	readonly exceptions: true;
}
