export type * from './declaration.ts';
export type * from './expression.ts';

/** Compile-time evaluation: functions and blocks the compiler evaluates. */
export interface CompileTimeEvaluation {
	readonly 'compile-time-evaluation': true;
}
