export * from './declaration.ts';
export * from './expression.ts';
export * from './type.ts';

/** Unsafe code: operations the compiler does not check, in the blocks and declarations marked for them. */
export interface UnsafeCode {
	readonly 'unsafe-code': true;
}
