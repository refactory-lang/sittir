export type * from './declaration.ts';
export type * from './modifier.ts';

/** Foreign function interface: functions another language defines, declared with the ABI they are called by. */
export interface ForeignFunctionInterface {
	readonly 'foreign-function-interface': true;
}
