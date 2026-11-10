export type * from './declaration.ts';
export type * from './expression.ts';

import type { ParametricPolymorphism } from '../index.ts';
import type { FunctionSignatures } from '../../function-signatures/index.ts';
import type { MethodSignatures } from '../../methods/method-signatures/index.ts';

/** Generic signatures: type parameters on function, method and interface signatures. */
export interface GenericSignatures extends ParametricPolymorphism, FunctionSignatures, MethodSignatures {
	readonly 'generic-signatures': true;
}
