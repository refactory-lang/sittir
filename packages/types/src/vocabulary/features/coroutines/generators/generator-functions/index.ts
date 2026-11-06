export type * from './declaration.ts';
export type * from './expression.ts';

import type { Generators } from '../index.ts';
import type { JavaScriptExpressions } from '../../../javascript-expressions/index.ts';

/** Generator functions: a function, function expression or method that yields values. */
export interface GeneratorFunctions extends Generators, JavaScriptExpressions {
	readonly 'generator-functions': true;
}
