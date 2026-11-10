export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './element.ts';
export type * from './expression.ts';
export type * from './type.ts';

import type { TypeAnnotations } from '../index.ts';
import type { StaticTypes } from '../static-types/index.ts';
import type { TypeExpressions } from '../../type-expressions/index.ts';

/** Type algebra: types computed from other types, type predicates and assertions. */
export interface TypeAlgebra extends TypeAnnotations, StaticTypes, TypeExpressions {
	readonly 'type-algebra': true;
}
