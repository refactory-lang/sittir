export type * from './statement.ts';

/** Exec statements: running code given as text, as a statement, python 2's `exec`. */
export interface ExecStatements {
	readonly 'exec-statements': true;
}
