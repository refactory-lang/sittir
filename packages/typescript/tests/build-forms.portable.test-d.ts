import type * as V from '../../types/src/vocabulary/index.ts';
import type { TypeScriptMap } from '../src/portable/map.ts';

type Path = keyof V.Paths<TypeScriptMap>;
type At<P extends Path> = V.Read<TypeScriptMap, P>;
type In<P extends Path> = V.InputOf<V.Paths<TypeScriptMap>[P], TypeScriptMap>;
type Unfit = { [P in Path]: [At<P>] extends [In<P>] ? never : P }[Path];

export const readsFitInputs: [Unfit] extends [never] ? true : Unfit = true;

declare const sequence: At<'expression.sequence'>;

export const grouped: In<'expression.parenthesized'> = { $path: 'expression.parenthesized', expression: sequence };

declare const extended: At<'clause.extends'>['types'][number];
export const oneExtended: In<'clause.extends'> = { $path: 'clause.extends', types: [extended] };
// @ts-expect-error an extends clause holds at least one type
export const noneExtended: In<'clause.extends'> = { $path: 'clause.extends', types: [] };
