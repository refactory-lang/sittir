export type * from './declaration.ts';

import type { AsyncAwait } from '../index.ts';
import type { FunctionSignatures } from '../../function-signatures/index.ts';

/** Asynchronous function signatures: a function declared without a body that suspends at `await`. */
export interface AsyncFunctionSignatures extends AsyncAwait, FunctionSignatures {
	readonly 'async-function-signatures': true;
}
