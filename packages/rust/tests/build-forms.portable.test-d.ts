import type { Flag } from '../../types/src/vocabulary/utils.ts';
import type { RustMap } from '../src/portable-map.ts';

type Overrides = RustMap['overrides'];
type Arms = { [P in keyof Overrides]: Overrides[P][keyof Overrides[P]] }[keyof Overrides];
type At<K extends string> = Extract<Arms, { readonly $path: K }>;

declare const name: At<'declaration.constant'>['name'];
declare const value: NonNullable<At<'expression.range.inclusive'>['start']>;
declare const type: NonNullable<At<'declaration.constant'>['type']>;
declare const attribute: NonNullable<At<'argument'>['attributes']>[number];

export const attributed: At<'argument'> = { $path: 'argument', attributes: [attribute], value };
// @ts-expect-error the portable argument is the attributed one, so it needs its attributes
export const bare: At<'argument'> = { $path: 'argument', value };

export const closed: At<'expression.range.inclusive'> = { $path: 'expression.range.inclusive', start: value, end: value };
// @ts-expect-error an inclusive range needs its end
export const unclosed: At<'expression.range.inclusive'> = { $path: 'expression.range.inclusive', start: value };
export const open: At<'expression.range'> = { $path: 'expression.range', start: value };

export const typed: At<'declaration.constant'> = { $path: 'declaration.constant', name, type, value };
// @ts-expect-error a rust constant states its type
export const untyped: At<'declaration.constant'> = { $path: 'declaration.constant', name, value };

declare const fn: At<'declaration.function'>;
declare const extern: NonNullable<typeof fn.extern>;
export const externed: At<'declaration.function'> = { ...fn, extern };
// @ts-expect-error a function states one extern
export const twice: At<'declaration.function'> = { ...fn, extern: [extern, extern] };

declare const flag: Flag;
declare const lifetime: At<'declaration.type_parameter.lifetime'>['name'];
export const bounded: At<'declaration.type_parameter.lifetime'> = { $path: 'declaration.type_parameter.lifetime', name: lifetime, bounds: [lifetime] };
// @ts-expect-error a lifetime parameter takes no default
export const defaulted: At<'declaration.type_parameter.lifetime'> = { $path: 'declaration.type_parameter.lifetime', name: lifetime, default: type };
// @ts-expect-error a lifetime parameter is never const
export const constLifetime: At<'declaration.type_parameter.lifetime'> = { $path: 'declaration.type_parameter.lifetime', name: lifetime, const: flag };
declare const fallback: NonNullable<At<'declaration.type_parameter.value'>['default']>;
export const constant: At<'declaration.type_parameter.value'> = { $path: 'declaration.type_parameter.value', name, type, default: fallback };
// @ts-expect-error a const generic takes no bounds
export const boundedConstant: At<'declaration.type_parameter.value'> = { $path: 'declaration.type_parameter.value', name, type, bounds: [type] };
// @ts-expect-error a const generic's const is its refinement, not a flag
export const flaggedConstant: At<'declaration.type_parameter.value'> = { $path: 'declaration.type_parameter.value', name, type, const: flag };
