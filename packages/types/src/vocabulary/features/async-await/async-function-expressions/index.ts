export type * from './expression.ts';

import type { AsyncAwait } from '../index.ts';
import type { JavaScriptExpressions } from '../../javascript-expressions/index.ts';

/** Asynchronous function expressions: an anonymous function that suspends at `await`. */
export interface AsyncFunctionExpressions extends AsyncAwait, JavaScriptExpressions {
	readonly 'async-function-expressions': true;
}
