export type * from './statement.ts';

/** Assertions: a statement that fails when its condition does not hold, `assert`. */
export interface Assertions {
	readonly assertions: true;
}
