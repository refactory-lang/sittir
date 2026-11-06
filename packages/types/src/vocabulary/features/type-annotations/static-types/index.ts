export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './type.ts';

import type { TypeAnnotations } from '../index.ts';
import type { FunctionSignatures } from '../../function-signatures/index.ts';
import type { MethodSignatures } from '../../methods/method-signatures/index.ts';
import type { FieldsAndModifiers } from '../../fields-and-modifiers/index.ts';

/** Static types: casts, array, function and tuple types, primitive types, and declared types on fields and signatures. */
export interface StaticTypes extends TypeAnnotations, FunctionSignatures, MethodSignatures, FieldsAndModifiers {
	readonly 'static-types': true;
}
