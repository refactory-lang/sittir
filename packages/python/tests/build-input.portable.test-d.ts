import type * as V from '../../types/src/vocabulary/index.ts';
import type * as T from '../src/types.ts';
import type * as TS from '../../typescript/src/types.ts';
import type { PythonMap } from '../src/portable/map.ts';

type Expect<X extends true> = X;
type Getter = V.BuildInput<PythonMap, 'declaration.property.getter'>;

export type GetterFlagsAdmitAsync = Expect<'async' extends NonNullable<Getter['$flags']>[number] ? true : false>;
export type GetterFlagsAdmitOverride = Expect<'override' extends NonNullable<Getter['$flags']>[number] ? true : false>;

declare const block: T.Block.Bound;
declare const foreign: TS.StatementBlock.Bound;

export const blockBody: Getter['body'] = block;
// @ts-expect-error a typescript node is no python getter's body
export const foreignBody: Getter['body'] = foreign;

type Constant = V.BuildInput<PythonMap, 'declaration.constant'>;

declare const identifier: T.Identifier.Bound;
declare const dotted: T.DottedName.Bound;

export const identifierName: Constant['name'] = identifier;
// @ts-expect-error a dotted name reads as identifier.qualified, which a constant's name never holds
export const dottedName: Constant['name'] = dotted;
