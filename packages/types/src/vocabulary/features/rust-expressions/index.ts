export type * from './expression.ts';

/** Rust's expressions: block expressions, qualified-path calls and repeat arrays. */
export interface RustExpressions {
	readonly 'rust-expressions': true;
}
