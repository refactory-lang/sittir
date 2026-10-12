export * from './clause.ts';
export * from './statement.ts';

/** Print statements: printing as a statement, python 2's `print`. */
export interface PrintStatements {
	readonly 'print-statements': true;
}
