import type * as V from '../../../../packages/types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../../../../packages/typescript/src/portable-map.ts';

type G = TypeScriptMap;
type P = 'expression.parenthesized';
type In = V.InputOf<V.Paths<G>[P], G>;

export const fits: [V.Read<G, P>] extends [In] ? true : false = true;

declare const sequence: V.Read<G, 'expression.sequence'>;
declare const type: NonNullable<V.Read<G, P>['type']>;

export const typedSequence: In = { $path: 'expression.parenthesized', expression: sequence, type };
