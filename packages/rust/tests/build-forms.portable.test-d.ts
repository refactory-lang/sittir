import type { Flag } from '../../types/src/vocabulary/utils.ts';
import type { Ctx } from '../.sittir/portable.typed.ts';

declare const name: Ctx['identifier'];
declare const value: Ctx['expression'];
declare const type: Ctx['type'];
declare const attribute: Ctx['attribute'];

export const attributed: Ctx['argument'] = { $kind: 'argument', attributes: [attribute], value };
// @ts-expect-error the portable argument is the attributed one, so it needs its attributes
export const bare: Ctx['argument'] = { $kind: 'argument', value };

export const closed: Ctx['expression'] = { $kind: 'expression.range.inclusive', start: value, end: value };
// @ts-expect-error an inclusive range needs its end
export const unclosed: Ctx['expression'] = { $kind: 'expression.range.inclusive', start: value };
export const open: Ctx['expression'] = { $kind: 'expression.range', start: value };

export const typed: Ctx['declaration'] = { $kind: 'declaration.constant', name, type, value };
// @ts-expect-error a rust constant states its type
export const untyped: Ctx['declaration'] = { $kind: 'declaration.constant', name, value };

declare const fn: Extract<Ctx['declaration'], { readonly $kind: 'declaration.function' }>;
declare const extern: NonNullable<typeof fn.extern>;
export const externed: Ctx['declaration'] = { ...fn, extern };
// @ts-expect-error a function states one extern
export const twice: Ctx['declaration'] = { ...fn, extern: [extern, extern] };

declare const flag: Flag;
declare const lifetime: Extract<Ctx['declaration'], { readonly $kind: 'declaration.type_parameter.lifetime' }>['name'];
export const bounded: Ctx['declaration'] = { $kind: 'declaration.type_parameter.lifetime', name: lifetime, bounds: [lifetime] };
// @ts-expect-error a lifetime parameter takes no default
export const defaulted: Ctx['declaration'] = { $kind: 'declaration.type_parameter.lifetime', name: lifetime, default: type };
// @ts-expect-error a lifetime parameter is never const
export const constLifetime: Ctx['declaration'] = { $kind: 'declaration.type_parameter.lifetime', name: lifetime, const: flag };
declare const fallback: Ctx['slots']['declaration.type_parameter.value']['default'];
export const constant: Ctx['declaration'] = { $kind: 'declaration.type_parameter.value', name, type, default: fallback };
// @ts-expect-error a const generic takes no bounds
export const boundedConstant: Ctx['declaration'] = { $kind: 'declaration.type_parameter.value', name, type, bounds: [type] };
// @ts-expect-error a const generic's const is its refinement, not a flag
export const flaggedConstant: Ctx['declaration'] = { $kind: 'declaration.type_parameter.value', name, type, const: flag };
