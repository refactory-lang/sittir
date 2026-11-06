import type { Flag } from '../../types/src/vocabulary/utils.ts';
import type { PythonMap } from '../src/portable-map.ts';

type Overrides = PythonMap['overrides'];
type Arms = { [P in keyof Overrides]: Overrides[P][keyof Overrides[P]] }[keyof Overrides];
type At<K extends string> = Extract<Arms, { readonly $path: K }>;

declare const name: At<'declaration.constant'>['name'];
declare const value: NonNullable<At<'declaration.constant'>['value']>;
declare const type: NonNullable<At<'declaration.constant'>['type']>;
declare const bound: NonNullable<At<'declaration.type_parameter'>['bounds']>[number];
declare const parameterName: At<'declaration.type_parameter.variadic'>['name'];
declare const flag: Flag;

export const assigned: At<'declaration.constant'> = { $path: 'declaration.constant', name, value };
export const annotated: At<'declaration.constant'> = { $path: 'declaration.constant', name, type };
export const both: At<'declaration.constant'> = { $path: 'declaration.constant', name, type, value };
// @ts-expect-error a python constant states its value, its type or both
export const neither: At<'declaration.constant'> = { $path: 'declaration.constant', name };

export const variadic: At<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName };
// @ts-expect-error a variadic type parameter takes no bounds
export const boundedVariadic: At<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName, bounds: [bound] };
// @ts-expect-error a variadic type parameter is never const
export const constVariadic: At<'declaration.type_parameter.variadic'> = { $path: 'declaration.type_parameter.variadic', name: parameterName, const: flag };
export const parameters: At<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName };
// @ts-expect-error a parameter-list type parameter takes no bounds
export const boundedParameters: At<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName, bounds: [bound] };
// @ts-expect-error a parameter-list type parameter is never const
export const constParameters: At<'declaration.type_parameter.parameters'> = { $path: 'declaration.type_parameter.parameters', name: parameterName, const: flag };
