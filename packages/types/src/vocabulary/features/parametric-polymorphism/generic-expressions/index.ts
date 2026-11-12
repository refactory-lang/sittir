export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './type.ts';

import type { ParametricPolymorphism } from '../index.ts';
import type { JavaScriptExpressions } from '../../javascript-expressions/index.ts';
import type { JavaScriptClasses } from '../../methods/classes/javascript-classes/index.ts';
import type { GenericSignatures } from '../generic-signatures/index.ts';

/** Generic expressions: type arguments on calls and `new`, and type parameters on expressions and signatures. */
export interface GenericExpressions extends ParametricPolymorphism, JavaScriptExpressions, JavaScriptClasses, GenericSignatures {
	readonly 'generic-expressions': true;
}
