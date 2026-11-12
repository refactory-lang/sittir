export type * from './clause.ts';
export type * from './statement.ts';

/** Python's statements: `elif`, `del`, and `else` on loops. */
export interface PythonStatements {
	readonly 'python-statements': true;
}
