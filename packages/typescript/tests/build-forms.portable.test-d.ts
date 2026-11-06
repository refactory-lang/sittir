import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable-map.ts';

type Path = keyof V.Paths<TypeScriptMap>;
type At<P extends Path> = V.Read<TypeScriptMap, P>;
type In<P extends Path> = V.InputOf<V.Paths<TypeScriptMap>[P], TypeScriptMap>;
type Unfit = { [P in Path]: [At<P>] extends [In<P>] ? never : P }[Path];

export const readsFitInputs: [Unfit] extends [never] ? true : Unfit = true;

declare const sequence: At<'expression.sequence'>;
declare const type: NonNullable<At<'expression.parenthesized'>['type']>;

export const grouped: In<'expression.parenthesized'> = { $path: 'expression.parenthesized', expression: sequence };
// @ts-expect-error a parenthesized sequence takes no type
export const typedSequence: In<'expression.parenthesized'> = { $path: 'expression.parenthesized', expression: sequence, type };
