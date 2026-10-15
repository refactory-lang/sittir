export type * from './statement.ts';

/** Debugger statements: a statement that stops in an attached debugger, `debugger`. */
export interface DebuggerStatements {
	readonly 'debugger-statements': true;
}
