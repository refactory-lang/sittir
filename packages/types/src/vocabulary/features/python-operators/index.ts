export type * from './element.ts';
export type * from './expression.ts';

/** Python's operators: comparison chains, floor division, matrix multiplication and `not in`. */
export interface PythonOperators {
	readonly 'python-operators': true;
}
