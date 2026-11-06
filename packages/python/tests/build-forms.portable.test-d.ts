import type { Flag } from '../../types/src/vocabulary/utils.ts';
import type { Ctx } from '../.sittir/portable.typed.ts';

declare const name: Ctx['identifier'];
declare const value: Ctx['expression'];
declare const type: Ctx['slots']['declaration.constant']['type'];
declare const flag: Flag;

export const assigned: Ctx['declaration'] = { $kind: 'declaration.constant', name, value };
export const annotated: Ctx['declaration'] = { $kind: 'declaration.constant', name, type };
export const both: Ctx['declaration'] = { $kind: 'declaration.constant', name, type, value };
// @ts-expect-error a python constant states its value, its type or both
export const neither: Ctx['declaration'] = { $kind: 'declaration.constant', name };

export const variadic: Ctx['declaration'] = { $kind: 'declaration.type_parameter.variadic', name };
// @ts-expect-error a variadic type parameter takes no bounds
export const boundedVariadic: Ctx['declaration'] = { $kind: 'declaration.type_parameter.variadic', name, bounds: [type] };
// @ts-expect-error a variadic type parameter is never const
export const constVariadic: Ctx['declaration'] = { $kind: 'declaration.type_parameter.variadic', name, const: flag };
export const parameters: Ctx['declaration'] = { $kind: 'declaration.type_parameter.parameters', name };
// @ts-expect-error a parameter-list type parameter takes no bounds
export const boundedParameters: Ctx['declaration'] = { $kind: 'declaration.type_parameter.parameters', name, bounds: [type] };
// @ts-expect-error a parameter-list type parameter is never const
export const constParameters: Ctx['declaration'] = { $kind: 'declaration.type_parameter.parameters', name, const: flag };
