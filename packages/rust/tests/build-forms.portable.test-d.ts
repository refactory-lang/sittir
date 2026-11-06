import type * as V from '../../types/src/vocabulary/index.ts';
import type { Flag } from '../../types/src/vocabulary/utils.ts';
import type { RustMap } from '../src/portable-map.ts';

type Path = keyof V.Paths<RustMap>;
type At<P extends Path> = V.Read<RustMap, P>;
type In<P extends Path> = V.InputOf<V.Paths<RustMap>[P], RustMap>;
type Unfit = { [P in Path]: [At<P>] extends [In<P>] ? never : P }[Path];

export const readsFitInputs: [Unfit] extends [never] ? true : Unfit = true;

declare const name: At<'declaration.constant'>['name'];
declare const value: NonNullable<At<'expression.range.inclusive'>['start']>;
declare const type: NonNullable<At<'declaration.constant'>['type']>;
declare const attribute: NonNullable<At<'argument'>['attributes']>[number];

export const attributed: In<'argument'> = { $path: 'argument', attributes: [attribute], value };
// @ts-expect-error the portable argument is the attributed one, so it needs its attributes
export const bare: In<'argument'> = { $path: 'argument', value };

export const closed: In<'expression.range.inclusive'> = { $path: 'expression.range.inclusive', start: value, end: value };
// @ts-expect-error an inclusive range needs its end
export const unclosed: In<'expression.range.inclusive'> = { $path: 'expression.range.inclusive', start: value };
export const open: In<'expression.range'> = { $path: 'expression.range', start: value };

export const typed: In<'declaration.constant'> = { $path: 'declaration.constant', name, type, value };
// @ts-expect-error a rust constant states its type
export const untyped: In<'declaration.constant'> = { $path: 'declaration.constant', name, value };

declare const fn: At<'declaration.function'>;
declare const extern: NonNullable<typeof fn.extern>;
export const externed: In<'declaration.function'> = { ...fn, extern };
// @ts-expect-error a function states one extern
export const twice: In<'declaration.function'> = { ...fn, extern: [extern, extern] };

declare const flag: Flag;
declare const lifetime: At<'declaration.type_parameter.lifetime'>['name'];
export const bounded: In<'declaration.type_parameter.lifetime'> = { $path: 'declaration.type_parameter.lifetime', name: lifetime, bounds: [lifetime] };
// @ts-expect-error a lifetime parameter takes no default
export const defaulted: In<'declaration.type_parameter.lifetime'> = { $path: 'declaration.type_parameter.lifetime', name: lifetime, default: type };
// @ts-expect-error a lifetime parameter is never const
export const constLifetime: In<'declaration.type_parameter.lifetime'> = { $path: 'declaration.type_parameter.lifetime', name: lifetime, const: flag };
declare const fallback: NonNullable<At<'declaration.type_parameter.value'>['default']>;
export const constant: In<'declaration.type_parameter.value'> = { $path: 'declaration.type_parameter.value', name, type, default: fallback };
// @ts-expect-error a const generic takes no bounds
export const boundedConstant: In<'declaration.type_parameter.value'> = { $path: 'declaration.type_parameter.value', name, type, bounds: [type] };
// @ts-expect-error a const generic's const is its refinement, not a flag
export const flaggedConstant: In<'declaration.type_parameter.value'> = { $path: 'declaration.type_parameter.value', name, type, const: flag };
