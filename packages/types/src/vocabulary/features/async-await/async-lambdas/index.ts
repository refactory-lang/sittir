export type * from './declaration.ts';
export type * from './expression.ts';

import type { AsyncAwait } from '../index.ts';
import type { MethodSignatures } from '../../methods/method-signatures/index.ts';

/** Asynchronous lambdas: a lambda or method signature that suspends at `await`. */
export interface AsyncLambdas extends AsyncAwait, MethodSignatures {
	readonly 'async-lambdas': true;
}
