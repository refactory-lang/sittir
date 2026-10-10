export type * from './declaration.ts';
export type * from './expression.ts';

/** Unsafe code: operations the compiler does not check, in the blocks and declarations marked for them. */
export interface UnsafeCode {
	readonly 'unsafe-code': true;
}
